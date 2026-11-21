// The study desk's spaced review (gunner repo, decision 0082), ported from the app's
// SpacedRepetitionStore so a question answered on the web lands in the SAME review
// schedule the phone reads. Pure functions, no imports: `node --test
// scripts/test_study_srs.mjs` runs this exact file.
//
// What must match the app byte for byte (each has a parity test):
//   key          "<deck>:<id>"                       SpacedRepetitionStore.key(type:id:)
//   shard        "shard_" + FNV-1a-64(utf8 key) % 16  shardDocName(for:)
//   transition   Leitner applyAnswer                  applyAnswer(to:correct:config:)
//   merge        per key, more attempts wins, then the fresher lastReviewed
//                                                     shouldTakeRemote(...)
// Only the Leitner scheduler is ported. config/sr.algorithm "v2" makes the desk
// refuse to save (srWritable), so a web answer can never write a schedule the
// phone would read differently.

export const SHARD_COUNT = 16;
export const SR_DOC_VERSION = 2; // SpacedRepetitionStore.currentVersion
export const DAY_S = 86_400;
/** Box 0..5 review intervals in seconds (SpacedRepetitionStore.boxIntervals). */
export const BOX_INTERVALS_S = [0, 0, DAY_S, 3 * DAY_S, 7 * DAY_S, 14 * DAY_S];
export const NEW_PER_ROUND = 6; // SRConfig.newCardsPerRound default

export type Progress = {
  box: number;
  lastReviewedMs: number | null;
  consecutiveCorrect: number;
  totalCorrect: number;
  totalAttempts: number;
  /** v2 fields, carried through untouched (never written by the desk). */
  intervalDays?: number | null;
  dueDateMs?: number | null;
};

export const UNSEEN: Progress = {
  box: 0, lastReviewedMs: null, consecutiveCorrect: 0, totalCorrect: 0, totalAttempts: 0,
};

export function srKey(deck: string, id: number | string): string {
  return `${deck}:${id}`;
}

const FNV_OFFSET = BigInt('0xcbf29ce484222325');
const FNV_PRIME = BigInt('0x100000001b3');
const MASK64 = BigInt('0xffffffffffffffff');

/** FNV-1a 64 over the UTF-8 bytes (SpacedRepetitionStore.stableHash). */
export function stableHash(s: string): bigint {
  let h = FNV_OFFSET;
  const bytes = new TextEncoder().encode(s);
  for (let i = 0; i < bytes.length; i++) {
    h ^= BigInt(bytes[i]);
    h = (h * FNV_PRIME) & MASK64;
  }
  return h;
}

export function shardDocName(key: string): string {
  return `shard_${Number(stableHash(key) % BigInt(SHARD_COUNT))}`;
}

/** The pull's per-key rule: take remote only when strictly newer by (attempts, lastReviewed). */
export function shouldTakeRemote(
  remoteAttempts: number, remoteLastMs: number | null, localAttempts: number, localLastMs: number | null,
): boolean {
  if (remoteAttempts !== localAttempts) return remoteAttempts > localAttempts;
  return (remoteLastMs ?? -Infinity) > (localLastMs ?? -Infinity);
}

/** Union the shards and the frozen `data` doc the way the app's pull does: shards first, `data` last. */
export function mergeMaps(maps: Array<Record<string, Progress>>): Record<string, Progress> {
  const out: Record<string, Progress> = {};
  for (const m of maps) {
    for (const [k, p] of Object.entries(m)) {
      const have = out[k];
      if (!have || shouldTakeRemote(p.totalAttempts, p.lastReviewedMs, have.totalAttempts, have.lastReviewedMs)) {
        out[k] = p;
      }
    }
  }
  return out;
}

/** Leitner applyAnswer: wrong -> Box 1; first correct from unseen -> Box 2; else +1, cap 5. */
export function applyAnswer(input: Progress, correct: boolean, nowMs: number): Progress {
  const p: Progress = { ...input, totalAttempts: input.totalAttempts + 1, lastReviewedMs: nowMs };
  if (correct) {
    p.totalCorrect = input.totalCorrect + 1;
    p.consecutiveCorrect = input.consecutiveCorrect + 1;
    p.box = input.box === 0 ? 2 : Math.min(input.box + 1, 5);
  } else {
    p.consecutiveCorrect = 0;
    p.box = 1;
  }
  return p;
}

/** Days until the card is next due after this box (for "Box 2 -> Box 3, back in 3 days"). */
export function intervalDaysFor(box: number): number {
  return BOX_INTERVALS_S[Math.min(Math.max(box, 0), BOX_INTERVALS_S.length - 1)] / DAY_S;
}

export function isDue(p: Progress, nowMs: number): boolean {
  if (p.box === 0) return false;
  if (p.lastReviewedMs == null) return true;
  return nowMs - p.lastReviewedMs >= BOX_INTERVALS_S[p.box] * 1000;
}

/** How long past due, in ms (most neglected first). Box 1 is due at the miss. */
export function pastDueMs(p: Progress, nowMs: number): number {
  if (p.lastReviewedMs == null) return Number.MAX_SAFE_INTEGER;
  return nowMs - p.lastReviewedMs - BOX_INTERVALS_S[Math.min(Math.max(p.box, 0), 5)] * 1000;
}

export type PoolCard = { key: string; world: string };

/** Fisher-Yates with an injectable random (tests pin it). */
export function shuffled<T>(xs: T[], rand: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Stable sort (Array.prototype.sort is stable in every engine we run on). */
function stableSort<T>(xs: T[], cmp: (a: T, b: T) => number): T[] {
  return xs.map((x, i) => [x, i] as const).sort((a, b) => cmp(a[0], b[0]) || a[1] - b[1]).map((x) => x[0]);
}

/**
 * The app's balanced Leitner `selectCards`, plus the CK Gold hero's stratified new
 * share (`CardRepository.stratifiedRoundKeys`: one selection decides the review/new
 * split, and only the new cards are re-drawn across worlds, round-robin).
 *
 *  1. Box 1 (not answered in the last 60 s) and overdue Box 2+ (not reviewed today),
 *     interleaved Box 1 first, each most-neglected first, capped at the priority target
 *  2. new cards, up to NEW_PER_ROUND, spread across worlds
 *  3. more priority, then more new, if short
 *  4. seen, not due, not reviewed today, least-mastered first
 *  5. reviewed today, oldest first
 * The priority run leads; the rest is shuffled.
 *
 * `dayStartMs` is the student's local midnight (the browser sends its offset).
 */
export function selectRound(
  pool: PoolCard[], progress: Record<string, Progress>, count: number, nowMs: number, dayStartMs: number,
  rand: () => number = Math.random, newPerRound = NEW_PER_ROUND,
): string[] {
  const target = Math.min(count, pool.length);
  const P = (k: string) => progress[k] || UNSEEN;
  const world: Record<string, string> = {};
  for (const c of pool) world[c.key] = c.world;

  let overdue: string[] = [];
  let box1: string[] = [];
  const unseen: string[] = [];
  let notDue: string[] = [];
  const today: Array<[string, number]> = [];
  for (const { key } of pool) {
    const p = P(key);
    const reviewedToday = p.lastReviewedMs != null && p.lastReviewedMs >= dayStartMs;
    if (p.box === 0) unseen.push(key);
    else if (p.box === 1) {
      if (p.lastReviewedMs != null && nowMs - p.lastReviewedMs < 60_000) today.push([key, p.lastReviewedMs]);
      else box1.push(key);
    } else if (reviewedToday) {
      if (p.lastReviewedMs != null) today.push([key, p.lastReviewedMs]);
    } else if (isDue(p, nowMs)) overdue.push(key);
    else notDue.push(key);
  }

  overdue = stableSort(shuffled(overdue, rand), (a, b) => pastDueMs(P(b), nowMs) - pastDueMs(P(a), nowMs));
  box1 = stableSort(shuffled(box1, rand), (a, b) => pastDueMs(P(b), nowMs) - pastDueMs(P(a), nowMs));

  const newSlots = Math.min(newPerRound, unseen.length, target);
  const priorityTarget = target - newSlots;

  const priority: string[] = [];
  for (let i = 0; i < Math.max(box1.length, overdue.length); i++) {
    if (i < box1.length) priority.push(box1[i]);
    if (i < overdue.length) priority.push(overdue[i]);
  }

  const selected: string[] = [];
  const has = new Set<string>();
  const take = (k: string) => { if (!has.has(k)) { has.add(k); selected.push(k); } };

  for (const k of priority) { if (selected.length >= priorityTarget) break; take(k); }

  // New cards, round-robin across worlds (each world's order shuffled).
  const byWorld = new Map<string, string[]>();
  for (const k of shuffled(unseen, rand)) {
    const w = world[k] || '';
    if (!byWorld.has(w)) byWorld.set(w, []);
    byWorld.get(w)!.push(k);
  }
  const worlds = shuffled(Array.from(byWorld.keys()), rand);
  const spread: string[] = [];
  for (let i = 0; spread.length < unseen.length; i++) {
    for (const w of worlds) {
      const list = byWorld.get(w)!;
      if (i < list.length) spread.push(list[i]);
    }
  }
  let added = 0;
  for (const k of spread) { if (added >= newSlots || selected.length >= target) break; take(k); added++; }

  for (const k of priority) { if (selected.length >= target) break; take(k); }
  for (const k of spread) { if (selected.length >= target) break; take(k); }

  notDue = stableSort(shuffled(notDue, rand), (a, b) => P(a).box - P(b).box);
  for (const k of notDue) { if (selected.length >= target) break; take(k); }
  if (selected.length < target) {
    for (const [k] of today.slice().sort((a, b) => a[1] - b[1])) { if (selected.length >= target) break; take(k); }
  }

  const prioritySet = new Set([...box1, ...overdue]);
  const run = selected.filter((k) => prioritySet.has(k));
  const filler = shuffled(selected.filter((k) => !prioritySet.has(k)), rand);
  return [...run, ...filler];
}

/** XP for one answer (StatsManager.recordAnswer, §8): wrong 0; right 10/15/20 by streak; +5 under 5 s. */
export function xpFor(correct: boolean, streakAfter: number, answerMs: number): number {
  if (!correct) return 0;
  const base = streakAfter >= 5 ? 20 : streakAfter >= 3 ? 15 : 10;
  return base + (answerMs > 0 && answerMs < 5000 ? 5 : 0);
}
