import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Firebase admin init (once per cold start)
if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      projectId: 'stepgunner-79ae7',
    });
  } catch (err) {
    console.error('Firebase admin init failed:', err);
  }
}

// ─────────── Constants (mirrored from seed_bots_weekly.py) ───────────────────

const MIN_BOT_XP = 50;
const MIN_LEADER_FLOOR = 500;
const SLACK_FACTOR = 0.83;
const SLACK_TOP_GAP = 5;
const SLACK_STREAK_CAP = 3;
const DAY_STREAK_CAP = 90;

type Tier = 'pressure' | 'close' | 'mid' | 'low';

interface TierProfile {
  avgXpPerCorrect: [number, number];
  accuracy: [number, number];
  dayStreak: [number, number];
}

const TIER_PROFILES: Record<Tier, TierProfile> = {
  pressure: { avgXpPerCorrect: [14.0, 17.0], accuracy: [0.78, 0.90], dayStreak: [20, 70] },
  close:    { avgXpPerCorrect: [12.5, 15.0], accuracy: [0.74, 0.86], dayStreak: [10, 35] },
  mid:      { avgXpPerCorrect: [11.5, 13.5], accuracy: [0.70, 0.82], dayStreak: [4, 18] },
  low:      { avgXpPerCorrect: [10.5, 12.0], accuracy: [0.65, 0.78], dayStreak: [1, 7] },
};

const TIER_MISS_PROBABILITY: Record<Tier, number> = {
  pressure: 0.01, close: 0.03, mid: 0.08, low: 0.15,
};

interface Bot {
  uid: string;
  name: string;
  avatar: string;
  tier: Tier;
  pctRange: [number, number];
}

const BOTS: Bot[] = [
  // Top 10 — non-overlapping lanes
  { uid: 'bot_000_chiefbiopsy42',   name: 'ChiefBiopsy42',     avatar: '🧬', tier: 'pressure', pctRange: [1.14, 1.20] },
  { uid: 'bot_001_boardsbound88',   name: 'BoardsBound88',     avatar: '🎯', tier: 'pressure', pctRange: [1.07, 1.12] },
  { uid: 'bot_002_statpearlsking',  name: 'StatPearlsKing',    avatar: '💎', tier: 'pressure', pctRange: [1.01, 1.05] },
  { uid: 'bot_003_pimpedhard66',    name: 'PimpedHard66',      avatar: '⚡', tier: 'close',    pctRange: [0.90, 0.96] },
  { uid: 'bot_004_ckgunner12',      name: 'CKGunner12',        avatar: '🔥', tier: 'close',    pctRange: [0.82, 0.88] },
  { uid: 'bot_005_diffdxdestroyer', name: 'DiffDxDestroyer',   avatar: '🧠', tier: 'close',    pctRange: [0.74, 0.80] },
  { uid: 'bot_006_wardwhisperer',   name: 'WardWhisperer',     avatar: '🩺', tier: 'mid',      pctRange: [0.64, 0.71] },
  { uid: 'bot_007_postcallninja',   name: 'PostCallNinja',     avatar: '💊', tier: 'mid',      pctRange: [0.55, 0.62] },
  { uid: 'bot_008_morningrounds',   name: 'MorningRounds',     avatar: '📚', tier: 'mid',      pctRange: [0.46, 0.53] },
  { uid: 'bot_009_clerkshipclimber',name: 'ClerkshipClimber',  avatar: '⚕️', tier: 'low',      pctRange: [0.34, 0.42] },
  // Filler — overlapping low bands, recyclable order
  { uid: 'bot_010_rotationrogue',   name: 'RotationRogue',     avatar: '🩸', tier: 'low',      pctRange: [0.22, 0.32] },
  { uid: 'bot_011_stepcadet',       name: 'StepCadet',         avatar: '🦴', tier: 'low',      pctRange: [0.16, 0.26] },
  { uid: 'bot_012_q_bank_quincy',   name: 'QBankQuincy',       avatar: '📒', tier: 'low',      pctRange: [0.12, 0.22] },
  { uid: 'bot_013_uworld_warrior',  name: 'UWorldWarrior',     avatar: '🛡️', tier: 'low',      pctRange: [0.08, 0.18] },
  { uid: 'bot_014_anki_apprentice', name: 'AnkiApprentice',    avatar: '🎴', tier: 'low',      pctRange: [0.05, 0.15] },
];

// ─────────── Helpers ─────────────────────────────────────────────────────────

function uniform(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}
function randInt(lo: number, hi: number): number {
  return Math.floor(uniform(lo, hi + 1));
}

function isoWeekKey(d: Date = new Date()): string {
  // Standard ISO 8601 week: Monday=1, Thursday determines week-year
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;             // 0=Mon … 6=Sun
  target.setUTCDate(target.getUTCDate() - dayNum + 3);     // Thu of this ISO week
  const firstThursday = target.getTime();
  target.setUTCMonth(0, 1);                                 // Jan 1
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const week = 1 + Math.round((firstThursday - target.getTime()) / 604_800_000);
  const year = new Date(firstThursday).getUTCFullYear();
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function slackProbability(deltaXp: number): number {
  if (deltaXp >= 1000) return 0.60;
  if (deltaXp >= 500)  return 0.40;
  if (deltaXp >= 200)  return 0.20;
  return 0.10;
}

interface DerivedStats { answered: number; correct: number; }
function deriveStats(xp: number, tier: Tier): DerivedStats {
  const p = TIER_PROFILES[tier];
  const xpPerCorrect = uniform(...p.avgXpPerCorrect);
  const correct = Math.max(1, Math.round(xp / xpPerCorrect));
  const acc = uniform(...p.accuracy);
  const answered = Math.max(correct + 1, Math.round(correct / acc));
  return { answered, correct };
}

function computeBotStreak(uid: string, tier: Tier, state: Record<string, unknown>): number {
  const botStreaks = (state.botStreaks as Record<string, number>) || {};
  const prev = botStreaks[uid];
  if (prev == null) {
    const [lo, hi] = TIER_PROFILES[tier].dayStreak;
    return randInt(lo, hi);
  }
  if (Math.random() < TIER_MISS_PROBABILITY[tier]) return 1;
  return Math.min(prev + 1, DAY_STREAK_CAP);
}

// ─────────── Main handler ───────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Cron auth check — Vercel sends this header on scheduled runs
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.authorization;
  if (expected && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!expected) {
    console.warn('CRON_SECRET not set — endpoint is unauthenticated');
  }

  if (!getApps().length) {
    return res.status(500).json({ error: 'firebase admin not initialized' });
  }

  const db = getFirestore();
  const weekKey = isoWeekKey();
  const log: string[] = [`Reseeding bots for ${weekKey}`];

  // Load persistent state
  const stateRef = db.collection('meta').doc('botSeederState');
  const stateDoc = await stateRef.get();
  const state: Record<string, unknown> = stateDoc.exists ? (stateDoc.data() ?? {}) : {};

  // Find top human player this week
  const scoresSnap = await db.collection('weeklyScores')
    .where('weekKey', '==', weekKey)
    .get();
  let topXp = 0;
  let topName: string | null = null;
  let topUid: string | null = null;
  scoresSnap.forEach((d) => {
    const data = d.data();
    if ((data.uid as string)?.startsWith('bot_')) return;
    const xp = (data.weeklyXP as number) ?? 0;
    if (xp > topXp) {
      topXp = xp;
      topName = data.displayName ?? null;
      topUid = data.uid ?? null;
    }
  });

  let leaderXp = topXp;
  let slackActive = false;
  let slackReason = 'no humans this week, full bot pressure';
  let deltaXp = 0;

  if (topUid == null) {
    leaderXp = MIN_LEADER_FLOOR;
    log.push(`  → no human players yet (using baseline ${MIN_LEADER_FLOOR})`);
  } else {
    const sameWeek = state.lastWeekKey === weekKey;
    const sameLeader = state.lastLeaderUid === topUid;
    deltaXp = sameWeek && sameLeader
      ? Math.max(0, topXp - ((state.lastLeaderXp as number) ?? 0))
      : topXp;

    const prob = slackProbability(deltaXp);
    const pbMap = (state.humanWeeklyPB as Record<string, number>) || {};
    const prevPb = pbMap[topUid] ?? 0;
    const isPersonalBest = topXp > prevPb;
    const consec = (state.consecutiveSlackDays as number) ?? 0;

    if (isPersonalBest) {
      slackActive = true;
      slackReason = `PERSONAL BEST (prev: ${prevPb}, now: ${topXp})`;
    } else if (consec >= SLACK_STREAK_CAP) {
      slackActive = false;
      slackReason = `ANTI-STREAK (${consec} consecutive slack days, forcing full pressure)`;
    } else {
      const roll = Math.random();
      slackActive = roll < prob;
      slackReason = `roll ${roll.toFixed(2)} ${slackActive ? '<' : '≥'} ${prob.toFixed(2)} (effort: Δ${deltaXp >= 0 ? '+' : ''}${deltaXp} XP)`;
    }

    log.push(`  → top human: ${topName} @ ${topXp} XP (Δ ${deltaXp >= 0 ? '+' : ''}${deltaXp} vs yesterday)`);
    log.push(`  → SLACK: ${slackActive ? 'ACTIVE' : 'inactive'} — ${slackReason}`);
  }

  // Build bot writes
  const newBotStreaks: Record<string, number> = {
    ...((state.botStreaks as Record<string, number>) || {}),
  };

  const batch = db.batch();
  const wroteBots: { uid: string; name: string; xp: number }[] = [];
  for (const b of BOTS) {
    let [pctMin, pctMax] = b.pctRange;
    if (slackActive) { pctMin *= SLACK_FACTOR; pctMax *= SLACK_FACTOR; }
    const pct = uniform(pctMin, pctMax);
    let rawXp = Math.max(MIN_BOT_XP, Math.floor(leaderXp * pct));
    let xp = Math.round(rawXp / 5) * 5;   // multiples of 5 (game rule)
    if (slackActive && b.tier === 'pressure') {
      xp = Math.min(xp, leaderXp - SLACK_TOP_GAP);
      xp = Math.floor(xp / 5) * 5;
    }
    const { answered, correct } = deriveStats(xp, b.tier);
    const dayStreak = computeBotStreak(b.uid, b.tier, state);
    newBotStreaks[b.uid] = dayStreak;

    const docId = `${b.uid}_${weekKey}`;
    const ref = db.collection('weeklyScores').doc(docId);
    batch.set(ref, {
      uid: b.uid,
      weekKey,
      displayName: b.name,
      avatar: b.avatar,
      weeklyXP: xp,
      totalCorrect: correct,
      totalAnswered: answered,
      bestStreak: dayStreak,
      updatedAt: Timestamp.now(),
    }, { merge: true });
    wroteBots.push({ uid: b.uid, name: b.name, xp });
  }
  await batch.commit();

  // Persist state for next run
  const newPB: Record<string, number> = {
    ...((state.humanWeeklyPB as Record<string, number>) || {}),
  };
  if (topUid && topXp > (newPB[topUid] ?? 0)) newPB[topUid] = topXp;

  const stateUpdate: Record<string, unknown> = {
    lastWeekKey: weekKey,
    botStreaks: newBotStreaks,
  };
  if (topUid != null) {
    stateUpdate.lastLeaderXp = topXp;
    stateUpdate.lastLeaderUid = topUid;
    stateUpdate.consecutiveSlackDays = slackActive
      ? ((state.consecutiveSlackDays as number) ?? 0) + 1
      : 0;
    stateUpdate.humanWeeklyPB = newPB;
  }
  await stateRef.set(stateUpdate, { merge: true });

  log.push(`✅ Reseeded ${BOTS.length} bots for ${weekKey}`);
  return res.status(200).json({
    ok: true,
    weekKey,
    leaderXp,
    slackActive,
    slackReason,
    deltaXp,
    bots: wroteBots,
    log,
  });
}
