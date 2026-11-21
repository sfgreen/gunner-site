// The study desk, server half (gunner repo, decision 0082). Imported only by
// /api/study/* routes, so firebase-admin stays out of the browser.
//
// The rule that keeps the bank off the open web: a question leaves the server one at a
// time, only to a signed-in Pro account, only as the next card of that student's own
// block (picked by their review schedule, never by id), and its answer and explanation
// only after they answer it. Every serve counts toward a daily cap and a minimum gap.
//
// Firestore:
//   webStudy/{uid}     server-only (no rule matches it, so clients are denied)
//     block            {id, keys[], i, size, startedMs, tz, served: {key, ms, order[]} | null,
//                       results[{key, correct, xp}], streak}
//     days             {"YYYY-MM-DD" (student local): {answered, correct, xp}} (last 30)
//     servedOn         "YYYY-MM-DD" (Central), servedToday, lastServedMs  (the limits)
//     xpBanked         XP earned here that the app has not added yet (it cannot today:
//                      a server raise of stats/current.totalXP makes the phone's next
//                      stats push fail the rules' no-decrease guard until it relaunches)
//     answered, correct, buddyDay, updatedAt
//   users/{uid}/srProgress/shard_N   the answer, merged per key exactly as the app writes
//   ropes/{id}         days_{uid} gains the student's local date, once a day (Study Buddy)
//   config/webStudy    {enabled, dailyMax, minGapMs, blockSize}; absent = STUDY_DEFAULTS
import { FieldValue, Timestamp, type DocumentData, type Firestore } from 'firebase-admin/firestore';
import { ProError, proDb, statusFor, toMs } from '../proServer';
import { addAnswer, capHitsSince, reasons as guardReasons, throttled, GUARD, type GuardDay, type GuardState } from './guard';
import {
  SR_DOC_VERSION, UNSEEN, applyAnswer, intervalDaysFor, mergeMaps, selectRound, shardDocName, shuffled, srKey,
  xpFor, type PoolCard, type Progress,
} from './srs';

export const STUDY_DEFAULTS = {
  enabled: true,
  dailyMax: 300, // questions served per Central day per account
  minGapMs: 2500, // between two served questions
  blockSize: 20, // a Step 2 block: 20 questions, 30 minutes
  guard: true, // the scraping flags (guard.ts); config/webStudy.guard false turns them off
};
export type StudyConfig = typeof STUDY_DEFAULTS;

/** Decks the desk serves. NBME (near-verbatim) and Visual Dx (bundled images) never do. */
const DECKS: Record<string, { collection: string; kind: string; label: string }> = {
  ck: { collection: 'ck_gold', kind: 'ck_gold', label: 'CK Gold' },
};

export type Card = {
  key: string;
  deck: string;
  id: number;
  world: string;
  worldName: string;
  subTopic: string | null;
  stem: string;
  question: string;
  choices: string[];
  answer: string;
  whyRight: string;
  whyWrong: string | null;
  trap: string | null;
  memoryHook: string | null;
  diagnosis: string | null;
  evidence: { body?: string; title?: string; year?: number; url?: string } | null;
};

// ---- content: the live question bank, cached per server instance ----

type Bank = { version: number; checkedMs: number; cards: Map<string, Card>; pool: PoolCard[]; worlds: Record<string, string> };
let bank: Bank | null = null;
let loading: Promise<Bank> | null = null;
const RECHECK_MS = 5 * 60_000;

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/** Sentences, split where the app's RationaleView splits them (not inside "11.8" or "E. coli"). */
export function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9("'])/).map((x) => x.trim()).filter(Boolean);
}

/**
 * whyRight minus the whyWrong sentences (RationaleView.subtracting): on cards that carry
 * both, whyWrong is a verbatim subset of whyRight, so showing both whole repeats it.
 */
export function whyRightOnly(whyRight: string, whyWrong: string | null): string {
  if (!whyWrong) return whyRight;
  const drop = new Set(sentences(whyWrong).map((x) => x.toLowerCase()));
  const kept = sentences(whyRight).filter((x) => !drop.has(x.toLowerCase()));
  return kept.length ? kept.join(' ') : whyRight;
}

function toCard(deck: string, d: DocumentData, worlds: Record<string, string>): Card | null {
  const id = typeof d.id === 'number' ? d.id : Number(d.id);
  const stem = str(d.triggerMarked) || str(d.trigger);
  const answer = str(d.correctAnswer);
  const choices = Array.isArray(d.choices) ? d.choices.filter((c: unknown) => typeof c === 'string' && c.trim()) : [];
  // Image cards need the app's bundled images; skip them rather than show half a question.
  if (!Number.isFinite(id) || !stem || !answer || choices.length < 2 || !choices.includes(answer)) return null;
  if (d.image || d.explanationImage) return null;
  const world = str(d.world) || '';
  const ev = d.evidence && typeof d.evidence === 'object' ? d.evidence : null;
  return {
    key: srKey(deck, id),
    deck,
    id,
    world,
    worldName: worlds[world] || world.replace(/^ck_/, '').toUpperCase(),
    subTopic: str(d.subTopic),
    stem,
    question: str(d.question) || 'Which of the following is most likely?',
    choices,
    answer,
    whyRight: whyRightOnly(str(d.whyRight) || '', str(d.whyWrong)),
    whyWrong: str(d.whyWrong),
    trap: str(d.trap),
    memoryHook: str(d.memoryHook),
    diagnosis: str(d.diagnosis),
    evidence: ev ? { body: str(ev.body) || undefined, title: str(ev.title) || undefined, year: typeof ev.year === 'number' ? ev.year : undefined, url: str(ev.url) || undefined } : null,
  };
}

async function loadBank(db: Firestore, version: number): Promise<Bank> {
  const worlds: Record<string, string> = {};
  const cats = await db.collection('questionBank').doc('categories').collection('cards').get();
  for (const c of cats.docs) {
    const x = c.data();
    if (typeof x.id === 'string' && typeof x.displayName === 'string') worlds[x.id] = x.displayName;
  }
  const cards = new Map<string, Card>();
  const pool: PoolCard[] = [];
  for (const [deck, meta] of Object.entries(DECKS)) {
    const snap = await db.collection('questionBank').doc(meta.collection).collection('cards').get();
    for (const doc of snap.docs) {
      const c = toCard(deck, doc.data(), worlds);
      if (!c || cards.has(c.key)) continue;
      cards.set(c.key, c);
      pool.push({ key: c.key, world: c.world });
    }
  }
  console.log(`[study] bank v${version}: ${cards.size} cards`);
  return { version, checkedMs: Date.now(), cards, pool, worlds };
}

export async function getBank(db: Firestore): Promise<Bank> {
  const now = Date.now();
  if (bank && now - bank.checkedMs < RECHECK_MS) return bank;
  if (loading) return loading;
  loading = (async () => {
    const meta = (await db.collection('questionBank').doc('metadata').get()).data() || {};
    const version = typeof meta.version === 'number' ? meta.version : 0;
    if (bank && bank.version === version) {
      bank.checkedMs = now;
      return bank;
    }
    bank = await loadBank(db, version);
    return bank;
  })();
  try {
    return await loading;
  } finally {
    loading = null;
  }
}

// ---- who may study ----

export async function studyConfig(db: Firestore): Promise<StudyConfig> {
  const d = (await db.collection('config').doc('webStudy').get()).data() || {};
  const num = (v: unknown, dflt: number, lo: number, hi: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : dflt;
  return {
    enabled: d.enabled !== false,
    dailyMax: num(d.dailyMax, STUDY_DEFAULTS.dailyMax, 0, 5000),
    minGapMs: num(d.minGapMs, STUDY_DEFAULTS.minGapMs, 0, 60_000),
    blockSize: num(d.blockSize, STUDY_DEFAULTS.blockSize, 5, 40),
    guard: d.guard !== false,
  };
}

/** Pro through the App Store, the web, a grant, or the free-Pro promo while it runs. */
export async function proSource(db: Firestore, uid: string): Promise<string> {
  const [{ status }, promo] = await Promise.all([
    statusFor(uid),
    db.collection('config').doc('promo').get(),
  ]);
  if (status.source !== 'none') return status.source;
  return promo.data()?.freeProActive === true ? 'promo' : 'none';
}

export async function requireStudy(db: Firestore, uid: string): Promise<StudyConfig> {
  const cfg = await studyConfig(db);
  if (!cfg.enabled) throw new ProError(503, 'paused', 'The study desk is paused. Your phone has everything.');
  const sr = (await db.collection('config').doc('sr').get()).data() || {};
  if (sr.algorithm && sr.algorithm !== 'leitner') {
    // Only the Leitner scheduler is ported (lib/study/srs.ts); never write a schedule the phone reads differently.
    throw new ProError(503, 'paused', 'The study desk is paused while review scheduling changes.');
  }
  if ((await proSource(db, uid)) === 'none') throw new ProError(402, 'not_pro', 'The study desk is part of Pro.');
  return cfg;
}

// ---- time ----

/** The student's local date, from the browser's UTC offset in minutes (east positive, like the app's tz_). */
export function localDay(ms: number, tzMin: number): string {
  return new Date(ms + tzMin * 60_000).toISOString().slice(0, 10);
}

export function localMidnightMs(ms: number, tzMin: number): number {
  const day = localDay(ms, tzMin);
  return Date.parse(`${day}T00:00:00Z`) - tzMin * 60_000;
}

export function centralDay(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}

export function cleanTz(v: unknown): number {
  const n = typeof v === 'number' ? Math.round(v) : 0;
  return Math.max(-14 * 60, Math.min(14 * 60, n));
}

// ---- the student's review schedule ----

function readProgress(raw: unknown): Progress | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  return {
    box: Math.min(5, Math.max(0, n(r.box))),
    lastReviewedMs: toMs(r.lastReviewed),
    consecutiveCorrect: n(r.consecutiveCorrect),
    totalCorrect: n(r.totalCorrect),
    totalAttempts: n(r.totalAttempts),
    intervalDays: typeof r.intervalDays === 'number' ? r.intervalDays : null,
    dueDateMs: toMs(r.dueDate),
  };
}

function readMap(doc: DocumentData | undefined, only?: Set<string>): Record<string, Progress> {
  const out: Record<string, Progress> = {};
  const m = doc?.progressMap;
  if (!m || typeof m !== 'object') return out;
  for (const [k, v] of Object.entries(m)) {
    if (only && !only.has(k)) continue;
    const p = readProgress(v);
    if (p) out[k] = p;
  }
  return out;
}

const SHARDS = Array.from({ length: 16 }, (_, i) => `shard_${i}`);

/** The whole schedule for these keys: every shard first, the frozen `data` doc last (the app's pull order). */
export async function readSchedule(db: Firestore, uid: string, keys: Set<string>): Promise<Record<string, Progress>> {
  const col = db.collection('users').doc(uid).collection('srProgress');
  const docs = await db.getAll(...SHARDS.map((s) => col.doc(s)), col.doc('data'));
  return mergeMaps(docs.map((d) => readMap(d.data(), keys)));
}

function encode(p: Progress): Record<string, unknown> {
  const out: Record<string, unknown> = {
    box: p.box,
    consecutiveCorrect: p.consecutiveCorrect,
    totalCorrect: p.totalCorrect,
    totalAttempts: p.totalAttempts,
  };
  if (p.lastReviewedMs != null) out.lastReviewed = Timestamp.fromMillis(p.lastReviewedMs);
  if (p.intervalDays != null) out.intervalDays = p.intervalDays;
  if (p.dueDateMs != null) out.dueDate = Timestamp.fromMillis(p.dueDateMs);
  return out;
}

/**
 * Record one answer in the schedule the phone reads: read the card's current progress
 * (its shard and the frozen `data` doc, merged the app's way), apply the Leitner step,
 * and merge ONLY that key into its shard, as SpacedRepetitionStore.mergeWritePayload does.
 */
export async function recordInSchedule(db: Firestore, uid: string, key: string, correct: boolean, nowMs: number): Promise<{ before: Progress; after: Progress }> {
  const col = db.collection('users').doc(uid).collection('srProgress');
  const shardRef = col.doc(shardDocName(key));
  const only = new Set([key]);
  return db.runTransaction(async (t) => {
    const [shard, legacy] = await t.getAll(shardRef, col.doc('data'));
    const merged = mergeMaps([readMap(shard.data(), only), readMap(legacy.data(), only)]);
    const before = merged[key] || UNSEEN;
    const after = applyAnswer(before, correct, nowMs);
    t.set(shardRef, {
      progressMap: { [key]: encode(after) },
      updatedAt: FieldValue.serverTimestamp(),
      version: SR_DOC_VERSION,
    }, { merge: true });
    return { before, after };
  });
}

// ---- blocks ----

export type Block = {
  id: string;
  keys: string[];
  i: number;
  size: number;
  startedMs: number;
  tz: number;
  served: { key: string; ms: number; order: string[] } | null;
  results: Array<{ key: string; correct: boolean; xp: number }>;
  streak: number;
};

export type Question = {
  blockId: string;
  index: number;
  size: number;
  key: string;
  deck: string;
  deckLabel: string;
  world: string;
  subTopic: string | null;
  stem: string;
  question: string;
  choices: string[];
};

function questionOf(block: Block, card: Card, order: string[]): Question {
  return {
    blockId: block.id,
    index: block.i,
    size: block.keys.length,
    key: card.key,
    deck: card.deck,
    deckLabel: DECKS[card.deck]?.label || card.deck,
    world: card.worldName,
    subTopic: card.subTopic,
    stem: card.stem,
    question: card.question,
    choices: order,
  };
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** The block to show: the one in progress, else a fresh one picked by the schedule. */
export async function openBlock(db: Firestore, uid: string, cfg: StudyConfig, tz: number, fresh: boolean): Promise<Block> {
  const ref = db.collection('webStudy').doc(uid);
  const cur = ((await ref.get()).data() || {}).block as Block | undefined;
  if (cur && !fresh && cur.i < cur.keys.length) return cur;
  const b = await getBank(db);
  const now = Date.now();
  const progress = await readSchedule(db, uid, new Set(b.pool.map((c) => c.key)));
  const keys = selectRound(b.pool, progress, cfg.blockSize, now, localMidnightMs(now, tz));
  const block: Block = { id: newId(), keys, i: 0, size: keys.length, startedMs: now, tz, served: null, results: [], streak: 0 };
  await ref.set({ block, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return block;
}

/**
 * The block's current question, served under the limits. A question already served and
 * not yet answered comes back as it was (a reload never costs a serve or reshuffles).
 */
export async function serveCurrent(db: Firestore, uid: string, cfg: StudyConfig, blockId: string): Promise<{ block: Block; question: Question | null }> {
  const b = await getBank(db);
  const ref = db.collection('webStudy').doc(uid);
  return db.runTransaction(async (t) => {
    const d = (await t.get(ref)).data() || {};
    const block = d.block as Block | undefined;
    if (!block || block.id !== blockId) throw new ProError(409, 'stale_block', 'This block was replaced. Reload to continue.');
    // A card retired since the block was picked is skipped without a serve.
    let skipped = false;
    while (block.i < block.keys.length && !b.cards.has(block.keys[block.i])) {
      block.i += 1;
      block.served = null;
      skipped = true;
    }
    if (block.i >= block.keys.length) {
      if (skipped) t.set(ref, { block }, { merge: true });
      return { block, question: null };
    }
    const key = block.keys[block.i];
    const card = b.cards.get(key)!;
    if (block.served && block.served.key === key) return { block, question: questionOf(block, card, block.served.order) };
    const now = Date.now();
    const today = centralDay(now);
    const servedToday = d.servedOn === today ? Number(d.servedToday) || 0 : 0;
    // A flagged account keeps studying, slower (guard.ts).
    const lim = cfg.guard ? throttled(d.guard as GuardState | undefined, cfg.dailyMax, cfg.minGapMs) : { dailyMax: cfg.dailyMax, minGapMs: cfg.minGapMs };
    if (servedToday >= lim.dailyMax) {
      throw new ProError(429, 'daily_limit', `That is ${lim.dailyMax} questions on the web today. The iPhone app keeps going.`);
    }
    if (typeof d.lastServedMs === 'number' && now - d.lastServedMs < lim.minGapMs) {
      throw new ProError(429, 'too_fast', 'One moment.');
    }
    const order = shuffled(card.choices, Math.random);
    block.served = { key, ms: now, order };
    const write: Record<string, unknown> = { block, servedOn: today, servedToday: servedToday + 1, lastServedMs: now, updatedAt: FieldValue.serverTimestamp() };
    // The day the full cap was reached counts toward the daily_cap flag.
    if (servedToday + 1 >= cfg.dailyMax) {
      const caps = (Array.isArray(d.capDays) ? d.capDays : []).filter((x: unknown) => typeof x === 'string' && x !== today);
      write.capDays = [...caps, today].slice(-7);
    }
    t.set(ref, write, { merge: true });
    return { block, question: questionOf(block, card, order) };
  });
}

export type Reveal = {
  key: string;
  correct: boolean;
  pick: string;
  answer: string;
  whyRight: string;
  whyWrong: string | null;
  trap: string | null;
  memoryHook: string | null;
  diagnosis: string | null;
  evidence: Card['evidence'];
  fromBox: number;
  toBox: number;
  nextInDays: number;
  xp: number;
  streak: number;
  index: number;
  size: number;
  done: boolean;
  blockCorrect: number;
};

/** Mark today on the student's rope, once a local day (the app's noteStudiedToday). */
async function noteBuddyDay(db: Firestore, uid: string, day: string, nowMs: number): Promise<void> {
  try {
    const idx = (await db.collection('ropeIndex').doc(uid).get()).data() || {};
    const ropeId = typeof idx.ropeId === 'string' ? idx.ropeId : null;
    if (!ropeId) return;
    const ref = db.collection('ropes').doc(ropeId);
    const rope = (await ref.get()).data();
    if (!rope || rope.status !== 'active' || !Array.isArray(rope.uids) || !rope.uids.includes(uid)) return;
    const days: unknown[] = Array.isArray(rope[`days_${uid}`]) ? rope[`days_${uid}`] : [];
    if (days.includes(day)) return;
    await ref.update({ [`days_${uid}`]: FieldValue.arrayUnion(day), [`seen_${uid}`]: nowMs / 1000 });
    console.log(`[study] buddy day uid=${uid.slice(0, 6)} rope=${ropeId.slice(0, 8)} day=${day}`);
  } catch (e) {
    console.error('[study] buddy day failed', e);
  }
}

/** Where an answer came from, for the scraping flags only (guard.ts): never stored raw. */
export type AnswerMeta = { net?: string; agent?: string };

export async function answerCurrent(db: Firestore, uid: string, blockId: string, key: string, pickIndex: number,
                                    meta: AnswerMeta = {}, cfg: StudyConfig = STUDY_DEFAULTS): Promise<Reveal> {
  const b = await getBank(db);
  const ref = db.collection('webStudy').doc(uid);
  const now = Date.now();
  // 1. Claim the served question (a double submit cannot record twice).
  const claimed = await db.runTransaction(async (t) => {
    const d = (await t.get(ref)).data() || {};
    const block = d.block as Block | undefined;
    if (!block || block.id !== blockId) throw new ProError(409, 'stale_block', 'This block was replaced. Reload to continue.');
    const served = block.served;
    if (!served || served.key !== key || block.keys[block.i] !== key) throw new ProError(409, 'not_current', 'That question was already answered.');
    if (!Number.isInteger(pickIndex) || pickIndex < 0 || pickIndex >= served.order.length) throw new ProError(400, 'bad_pick', 'Pick one of the answers.');
    const card = b.cards.get(key);
    if (!card) throw new ProError(409, 'retired', 'That question was retired. Reload for the next one.');
    const pick = served.order[pickIndex];
    const correct = pick === card.answer;
    const streak = correct ? (block.streak || 0) + 1 : 0;
    const xp = xpFor(correct, streak, now - served.ms);
    const day = localDay(now, block.tz);
    const days = (d.days && typeof d.days === 'object' ? d.days : {}) as Record<string, { answered: number; correct: number; xp: number }>;
    const today = days[day] || { answered: 0, correct: 0, xp: 0 };
    days[day] = { answered: today.answered + 1, correct: today.correct + (correct ? 1 : 0), xp: today.xp + xp };
    for (const k of Object.keys(days).sort().slice(0, -30)) delete days[k];
    block.results = [...(block.results || []), { key, correct, xp }];
    block.streak = streak;
    block.i += 1;
    block.served = null;
    const write: Record<string, unknown> = {
      block, days,
      answered: FieldValue.increment(1),
      correct: FieldValue.increment(correct ? 1 : 0),
      xpBanked: FieldValue.increment(xp),
      updatedAt: FieldValue.serverTimestamp(),
    };
    // 1b. The scraping flags (guard.ts): this answer joins the day's signals; a scripted-looking
    // day flags the account (sticky until Danny clears it) and leaves a row in studyFlags.
    if (cfg.guard) {
      const gdays = (d.guardDays && typeof d.guardDays === 'object' ? d.guardDays : {}) as Record<string, GuardDay>;
      const hour = new Date(now + (Number(block.tz) || 0) * 60_000).getUTCHours();
      const gd = addAnswer(gdays[day], now - served.ms, correct, hour, meta.net || '', meta.agent || '');
      gdays[day] = gd;
      for (const k of Object.keys(gdays).sort().slice(0, -GUARD.keepDays)) delete gdays[k];
      write.guardDays = gdays;
      const guard = (d.guard || {}) as GuardState;
      const live = guard.flagged && !guard.cleared;
      const clearedToday = guard.cleared && typeof guard.clearedAtMs === 'number' && localDay(guard.clearedAtMs, Number(block.tz) || 0) === day;
      const why = guardReasons(gd, capHitsSince(d.capDays, centralDay(now)));
      if (why.length && !live && !clearedToday) {
        const flag = { flagged: true, cleared: false, reasons: why, atMs: now, day };
        write.guard = flag;
        t.set(db.collection('studyFlags').doc(uid), {
          uid, ...flag, answersToday: gd.n, correctToday: gd.correct, fastToday: gd.fast,
          meanSeconds: gd.n ? Math.round((gd.dwellSum / gd.n) * 10) / 10 : 0, hours: gd.hours.length,
          networks: gd.nets.length, browsers: gd.agents.length, answeredAllTime: (Number(d.answered) || 0) + 1,
          createdAt: FieldValue.serverTimestamp(),
        });
        console.warn(`[study] FLAG uid=${uid.slice(0, 6)} reasons=${why.join(',')} n=${gd.n} fast=${gd.fast} acc=${gd.n ? Math.round((100 * gd.correct) / gd.n) : 0}%`);
      }
    }
    t.set(ref, write, { merge: true });
    return { card, pick, correct, streak, xp, block, day, buddyDay: d.buddyDay };
  });
  // 2. The schedule the phone reads.
  const { before, after } = await recordInSchedule(db, uid, key, claimed.correct, now);
  // 3. Study Buddy: today counts as studied.
  if (claimed.buddyDay !== claimed.day) {
    await noteBuddyDay(db, uid, claimed.day, now);
    await ref.set({ buddyDay: claimed.day }, { merge: true });
  }
  const { card, block } = claimed;
  return {
    key,
    correct: claimed.correct,
    pick: claimed.pick,
    answer: card.answer,
    whyRight: card.whyRight,
    whyWrong: card.whyWrong,
    trap: card.trap,
    memoryHook: card.memoryHook,
    diagnosis: card.diagnosis,
    evidence: card.evidence,
    fromBox: before.box,
    toBox: after.box,
    nextInDays: intervalDaysFor(after.box),
    xp: claimed.xp,
    streak: claimed.streak,
    index: block.i - 1,
    size: block.keys.length,
    done: block.i >= block.keys.length,
    blockCorrect: block.results.filter((r) => r.correct).length,
  };
}

// ---- the desk's side panels ----

export type DeskState = {
  pro: string;
  config: { dailyMax: number; blockSize: number };
  today: { answered: number; correct: number; xp: number; servedToday: number };
  xpBanked: number;
  block: { id: string; i: number; size: number; startedMs: number; results: Array<{ correct: boolean }> } | null;
  deck: { total: number; seen: number; mastered: number; due: number };
  worlds: Array<{ name: string; seen: number; correct: number; attempts: number; total: number }>;
};

export async function deskState(db: Firestore, uid: string, tz: number): Promise<DeskState> {
  const [pro, cfg, b, wsSnap] = await Promise.all([
    proSource(db, uid), studyConfig(db), getBank(db), db.collection('webStudy').doc(uid).get(),
  ]);
  const ws = wsSnap.data() || {};
  const now = Date.now();
  const day = localDay(now, tz);
  const t = (ws.days && ws.days[day]) || { answered: 0, correct: 0, xp: 0 };
  const progress = pro === 'none' ? {} : await readSchedule(db, uid, new Set(b.pool.map((c) => c.key)));
  let seen = 0, mastered = 0, due = 0;
  const byWorld = new Map<string, { name: string; seen: number; correct: number; attempts: number; total: number }>();
  for (const c of b.pool) {
    const card = b.cards.get(c.key)!;
    const w = byWorld.get(c.world) || { name: card.worldName, seen: 0, correct: 0, attempts: 0, total: 0 };
    w.total += 1;
    const p = progress[c.key];
    if (p && p.totalAttempts > 0) {
      seen += 1;
      w.seen += 1;
      w.correct += p.totalCorrect;
      w.attempts += p.totalAttempts;
      if (p.box >= 4) mastered += 1;
      if (p.box === 1 || (p.box >= 2 && p.lastReviewedMs != null && now - p.lastReviewedMs >= intervalDaysFor(p.box) * 86_400_000)) due += 1;
    }
    byWorld.set(c.world, w);
  }
  const block = ws.block as Block | undefined;
  return {
    pro,
    config: { dailyMax: cfg.dailyMax, blockSize: cfg.blockSize },
    today: { answered: t.answered, correct: t.correct, xp: t.xp, servedToday: ws.servedOn === centralDay(now) ? Number(ws.servedToday) || 0 : 0 },
    xpBanked: Number(ws.xpBanked) || 0,
    block: block ? { id: block.id, i: block.i, size: block.keys.length, startedMs: block.startedMs, results: (block.results || []).map((r) => ({ correct: r.correct })) } : null,
    deck: { total: b.pool.length, seen, mastered, due },
    worlds: Array.from(byWorld.values()).sort((a, z) => z.total - a.total),
  };
}
