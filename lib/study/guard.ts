// Scraping flags for the study desk (decision 0082 amendment 2026-11-21, Danny: "Build the flags").
//
// Every answer adds to the account's day: how long the question was on screen before the
// answer (serve to answer, server clock), right or wrong, the student's local hour, and a
// hashed network prefix and browser. A day that looks like a script, not a student, flags the
// account. A flagged account keeps studying, slower: 40 questions a day, 15 s apart, until
// Danny clears `webStudy/{uid}.guard`. Pure rules here; the I/O is in server.ts.
//
// The thresholds sit far from real study. A Step 2 question takes about a minute (LEARNINGS
// 2026-10-22: 15% of answers come in under 15 s), the bank's first-try rate is about 75%, and
// the median sitting is 10 answers.
import { createHash } from 'node:crypto';

export const GUARD = {
  fastMs: 6000, // an answer this soon after the question appeared is "fast"
  minAnswers: 40, // no speed or rhythm flag before this many answers in a day
  fastShare: 0.5, // half the day's answers fast
  accMinAnswers: 60,
  lowAccuracy: 0.35, // random on five choices is 20%; students land near 75%
  regularCv: 0.15, // answer times this even (spread / mean) are a timer, not a reader
  activeHours: 18, // answering in 18 or more different hours of one local day
  networks: 4, // four or more networks in one day
  browsers: 3, // three or more browsers in one day
  capDays: 2, // the daily cap hit on two of the last seven days
  throttleMax: 40,
  throttleGapMs: 15_000,
  keepDays: 30,
};

export type GuardDay = {
  n: number;
  correct: number;
  fast: number;
  dwellSum: number; // seconds
  dwellSq: number; // seconds squared
  hours: number[];
  nets: string[];
  agents: string[];
};

export type GuardState = {
  flagged?: boolean;
  reasons?: string[];
  atMs?: number;
  day?: string;
  cleared?: boolean; // Danny clears a flag by setting this; the next flag needs new evidence
  clearedAtMs?: number;
};

export function emptyDay(): GuardDay {
  return { n: 0, correct: 0, fast: 0, dwellSum: 0, dwellSq: 0, hours: [], nets: [], agents: [] };
}

/** A short one-way tag for a network prefix or browser string: comparable within a day, not reversible. */
export function tag(s: string): string {
  return createHash('sha256').update(`sg-study|${s}`).digest('hex').slice(0, 10);
}

/** The /24 of an IPv4 address or the /48 of an IPv6 one, from the first x-forwarded-for hop. */
export function networkOf(forwardedFor: string | undefined, remote: string | undefined): string {
  const ip = ((forwardedFor || '').split(',')[0] || remote || '').trim().replace(/^::ffff:/, '');
  if (!ip) return '';
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + '::/48';
  const p = ip.split('.');
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0/24` : ip;
}

function addUnique(list: string[], v: string, cap = 12): string[] {
  if (!v || list.includes(v)) return list;
  return [...list, v].slice(-cap);
}

export function addAnswer(day: GuardDay | undefined, dwellMs: number, correct: boolean, hour: number,
                          net: string, agent: string): GuardDay {
  const d = { ...emptyDay(), ...(day || {}) };
  const s = Math.max(0, dwellMs) / 1000;
  return {
    n: d.n + 1,
    correct: d.correct + (correct ? 1 : 0),
    fast: d.fast + (dwellMs < GUARD.fastMs ? 1 : 0),
    dwellSum: d.dwellSum + s,
    dwellSq: d.dwellSq + s * s,
    hours: d.hours.includes(hour) ? d.hours : [...d.hours, hour],
    nets: addUnique(d.nets, net ? tag(net) : ''),
    agents: addUnique(d.agents, agent ? tag(agent) : ''),
  };
}

/** Why this day looks scripted; empty when it looks like a student. */
export function reasons(day: GuardDay, capHitsLast7: number): string[] {
  const out: string[] = [];
  if (day.n >= GUARD.minAnswers && day.fast / day.n >= GUARD.fastShare) out.push('fast');
  if (day.n >= GUARD.accMinAnswers && day.correct / day.n < GUARD.lowAccuracy) out.push('guessing');
  if (day.n >= GUARD.minAnswers) {
    const mean = day.dwellSum / day.n;
    const sd = Math.sqrt(Math.max(0, day.dwellSq / day.n - mean * mean));
    if (mean > 0 && sd / mean < GUARD.regularCv) out.push('even_rhythm');
  }
  if (day.hours.length >= GUARD.activeHours) out.push('no_sleep');
  if (day.nets.length >= GUARD.networks) out.push('many_networks');
  if (day.agents.length >= GUARD.browsers) out.push('many_browsers');
  if (capHitsLast7 >= GUARD.capDays) out.push('daily_cap');
  return out;
}

/** Cap days inside the last seven (Central days, yyyy-mm-dd, as the cap counts them). */
export function capHitsSince(capDays: unknown, todayCentral: string): number {
  if (!Array.isArray(capDays)) return 0;
  const cut = new Date(Date.parse(`${todayCentral}T00:00:00Z`) - 6 * 86_400_000).toISOString().slice(0, 10);
  return capDays.filter((d) => typeof d === 'string' && d >= cut && d <= todayCentral).length;
}

/** The limits a flagged account studies under. */
export function throttled(guard: GuardState | undefined, dailyMax: number, minGapMs: number): { dailyMax: number; minGapMs: number } {
  if (!guard?.flagged || guard.cleared) return { dailyMax, minGapMs };
  return { dailyMax: Math.min(dailyMax, GUARD.throttleMax), minGapMs: Math.max(minGapMs, GUARD.throttleGapMs) };
}
