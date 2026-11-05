// Friend codes (gunner repo, decision 0057, amended 2026-11-04 "Stripe end to end"):
// the reward rules, a sharer's earnings, and the monthly payout run, as pure code.
// No runtime imports, so `node --test scripts/test_referral.mjs` runs this exact
// file. Firestore and Stripe come in through PayoutPorts and PayoutsClient
// (lib/referralServer.ts, lib/globalPayouts.ts). The collections are documented
// at the top of lib/proServer.ts.

import type { Plan } from './proGrant';

const DAY_MS = 86_400_000;

/** config/referral (0057 item 11), all read server-side. */
export type ReferralConfig = {
  cashEnabled: boolean;
  autoPayout: boolean;
  holdDays: number;
  minPayoutCents: number;
  yearCapCents: number;
  monthlyBudgetCents: number;
  cashCountries: string[];
  centsYearly: number;
  centsMonthly: number;
};

export const REFERRAL_DEFAULTS: ReferralConfig = {
  cashEnabled: false,
  autoPayout: false,
  holdDays: 30,
  minPayoutCents: 2000,
  yearCapCents: 199_500, // under the $2,000 1099 line
  monthlyBudgetCents: 25_000,
  cashCountries: ['US'],
  centsYearly: 1500,
  centsMonthly: 500,
};

type IntKey = 'holdDays' | 'minPayoutCents' | 'yearCapCents' | 'monthlyBudgetCents' | 'centsYearly' | 'centsMonthly';

/** config/referral as stored: a missing or malformed key falls back to its default. */
export function referralConfig(raw: unknown): ReferralConfig {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const int = (k: IntKey): number => {
    const v = d[k];
    return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : REFERRAL_DEFAULTS[k];
  };
  const bool = (k: 'cashEnabled' | 'autoPayout'): boolean => (typeof d[k] === 'boolean' ? (d[k] as boolean) : REFERRAL_DEFAULTS[k]);
  const countries = Array.isArray(d.cashCountries)
    ? d.cashCountries.filter((c): c is string => typeof c === 'string' && /^[A-Za-z]{2}$/.test(c)).map((c) => c.toUpperCase())
    : REFERRAL_DEFAULTS.cashCountries;
  return {
    cashEnabled: bool('cashEnabled'),
    autoPayout: bool('autoPayout'),
    holdDays: int('holdDays'),
    minPayoutCents: int('minPayoutCents'),
    yearCapCents: int('yearCapCents'),
    monthlyBudgetCents: int('monthlyBudgetCents'),
    cashCountries: countries,
    centsYearly: int('centsYearly'),
    centsMonthly: int('centsMonthly'),
  };
}

export function holdMs(cfg: Pick<ReferralConfig, 'holdDays'>): number {
  return cfg.holdDays * DAY_MS;
}

export function isCashCountry(country: string | null | undefined, cfg: Pick<ReferralConfig, 'cashCountries'>): boolean {
  return !!country && cfg.cashCountries.includes(country.toUpperCase());
}

/**
 * The preference to save for a sharer who has none (decision 0057 item 6): outside the
 * cash countries Pro months are the only choice, and the backend pays Pro months only
 * from a stored preference, so it is saved for them. Null when nothing should be saved:
 * a saved choice stands, and an unknown country is never guessed.
 */
export function defaultPreference(
  stored: Preference | null, country: string | null, cfg: Pick<ReferralConfig, 'cashCountries'>,
): 'pro_months' | null {
  if (stored || !country) return null;
  return isCashCountry(country, cfg) ? null : 'pro_months';
}

// ---- one friend's reward ----

const EARNING = new Set(['pending', 'payable', 'paid']);

/** What one paying friend earns the sharer, at full amount: the backend applies the
 *  yearly cap when it writes a payout run, by the calendar year of payout. */
export function rewardCents(plan: Plan, cfg: Pick<ReferralConfig, 'centsYearly' | 'centsMonthly'>): number {
  return plan === 'yearly' ? cfg.centsYearly : cfg.centsMonthly;
}

/**
 * The same card behind two rewards is one person farming them (review M6): the first
 * payment's card fingerprint already on another friend's row (any sharer), or among
 * the sharer's own payments, makes the new row skipped, reason shared_card.
 */
export function sharedCardReason(
  fingerprint: string | null, onOtherFriendRow: boolean, sharerFingerprints: Set<string>,
): 'shared_card' | null {
  if (!fingerprint) return null;
  return onOtherFriendRow || sharerFingerprints.has(fingerprint) ? 'shared_card' : null;
}

/** A first payment Stripe later refunded in full or that is disputed: the reward goes
 *  (review M9, the check before any payout). Partial refunds are goodwill and keep it. */
export function paymentTakenBack(charge: { refunded?: boolean | null; disputed?: boolean | null } | null): 'refund' | 'dispute' | null {
  if (!charge) return null;
  if (charge.disputed) return 'dispute';
  if (charge.refunded) return 'refund';
  return null;
}

/**
 * What a refund or dispute does to a reward row. Only a refund of the friend's FIRST
 * payment takes the reward back (0057: a later renewal's refund leaves it). When the
 * first payment is unknown, a refund while the row is still in its hold counts.
 * Returns the fields to merge, or null for no change: status reversed, and
 * reversedFrom the status it had. A row reversed from paid keeps its paidAt, and the
 * next payout run nets it off the sharer's payable rows (deductedInRun).
 */
export function reversalFields(
  row: { status: string; firstPaymentIntent?: string | null },
  refundedPaymentIntent: string | null,
): { status: 'reversed'; reversedFrom: string } | null {
  const first = row.firstPaymentIntent || null;
  if (first) {
    if (!refundedPaymentIntent || refundedPaymentIntent !== first) return null;
  } else if (row.status !== 'pending') {
    return null;
  }
  return EARNING.has(row.status) ? { status: 'reversed', reversedFrom: row.status } : null;
}

// ---- a sharer's earnings (/earnings) ----

export type EarningRow = { status: string; cents: number; paidAt?: unknown; deductedInRun?: string | null };

/** The same totals the app's my_referral_rewards callable returns (functions/main.py). */
export type EarningsTotals = {
  /** Friends whose reward still stands: pending, payable or paid. */
  friends: number;
  pendingCents: number;
  payableCents: number;
  paidCents: number;
  /** Rows refunded after payout, not yet netted off a payout (0057 item 3). */
  owedBackCents: number;
};

/** A row reversed after its payout went out: it keeps paidAt until a run nets it. */
export function refundedAfterPayout(r: EarningRow): boolean {
  return r.status === 'reversed' && !!r.paidAt;
}

export function earningsTotals(rows: EarningRow[]): EarningsTotals {
  const t: EarningsTotals = { friends: 0, pendingCents: 0, payableCents: 0, paidCents: 0, owedBackCents: 0 };
  for (const r of rows) {
    const c = Math.max(0, r.cents || 0);
    if (r.status === 'pending' || r.status === 'payable' || r.status === 'paid') {
      t[`${r.status}Cents` as 'pendingCents' | 'payableCents' | 'paidCents'] += c;
      t.friends += 1;
    } else if (refundedAfterPayout(r) && !r.deductedInRun) {
      t.owedBackCents += c;
    }
  }
  return t;
}

/** Why a reward is held, the only reasons a sharer is shown (review M5/N3): the monthly
 *  budget, or the yearly cap until January. Skip reasons never leave the server. */
export function waitingOf(reason: unknown): 'monthly_budget' | 'year_cap_hold' | null {
  return reason === 'monthly_budget' || reason === 'year_cap_hold' ? reason : null;
}

// ---- the monthly payout run ----
//
// The backend (functions/main.py referral_payout_run) writes referralPayoutRuns/{YYYY-MM}
// on the 1st with one line per sharer, already under the yearly cap, the monthly
// budget and the $20 cash minimum; Admin (or autoPayout) approves it. The site only
// executes approved runs: per line it re-reads the rows, pays only those still
// payable, nets the refunds the line lists, writes referralPayouts/{runId}_{sharerUid},
// and marks the run done.

export type PayoutMethod = 'stripe_global_payouts' | 'pro_months';
/** sending/granting: written before the money or the grant moves, so a crash resumes. */
export type PayoutStatus = 'sending' | 'sent' | 'posted' | 'failed' | 'returned' | 'granting' | 'granted';
export type OnboardingStatus = 'pending' | 'complete' | 'restricted';
export type Preference = 'cash' | 'pro_months';

/** One sharer in a run, as the backend wrote it. */
export type RunLine = {
  sharerUid: string;
  method: PayoutMethod;
  rowIds: string[];
  /** Rows refunded after an earlier payout, netted here. */
  deductRowIds: string[];
  /** payable less deductions, what Admin approved for this sharer (cash). */
  cents: number;
  months?: number;
  stripeRecipientId?: string | null;
};

export type Run = { id: string; status: string; lines: RunLine[] };

/** A line's rows as they stand now. */
export type LiveRow = { id: string; cents: number };
export type LiveLine = { pay: LiveRow[]; deduct: LiveRow[] };

export type Recipient = {
  uid: string;
  preference: Preference | null;
  onboardingStatus: OnboardingStatus | null;
  country: string | null;
  stripeRecipientId: string | null;
  payoutMethodId: string | null;
  destination: string | null;
};

export type Payout = {
  id: string;
  runId: string;
  sharerUid: string;
  method: PayoutMethod;
  status: PayoutStatus;
  /** Cash sent: rows less deductions. 0 for Pro months. */
  cents: number;
  grossCents: number;
  deductCents: number;
  months: number;
  rowIds: string[];
  deductRowIds: string[];
  recipientId: string | null;
  payoutMethodId: string | null;
  destination: string | null;
  stripeId: string | null;
  stripeStatus: string | null;
};

export type SkipReason = 'cash_off' | 'recipient_incomplete' | 'nothing_payable' | 'under_minimum' | 'failed_earlier';

export function payoutIdFor(runId: string, sharerUid: string): string {
  return `${runId}_${sharerUid}`;
}

/**
 * The payout for one cash line, from its rows as they stand now: only rows still
 * payable, less the deductions still owed, never more than the line Admin approved
 * and never under minPayoutCents. A skip reason when it cannot go out today.
 */
export function cashPayout(
  run: Pick<Run, 'id'>, line: RunLine, live: LiveLine, r: Recipient | null, cfg: ReferralConfig,
): Payout | SkipReason {
  if (!cfg.cashEnabled) return 'cash_off';
  if (!r || r.onboardingStatus !== 'complete' || !r.stripeRecipientId || !isCashCountry(r.country, cfg)) return 'recipient_incomplete';
  const gross = live.pay.reduce((sum, x) => sum + Math.max(0, x.cents), 0);
  const deduct = live.deduct.reduce((sum, x) => sum + Math.max(0, x.cents), 0);
  const cents = Math.min(gross - deduct, Math.max(0, line.cents));
  if (!live.pay.length || cents <= 0) return 'nothing_payable';
  // A refund since approval can drop a line under the minimum: its rows wait for a later run.
  if (cents < cfg.minPayoutCents) return 'under_minimum';
  return {
    id: payoutIdFor(run.id, line.sharerUid), runId: run.id, sharerUid: line.sharerUid,
    method: 'stripe_global_payouts', status: 'sending', cents, grossCents: gross, deductCents: deduct, months: 0,
    rowIds: live.pay.map((x) => x.id), deductRowIds: live.deduct.map((x) => x.id),
    recipientId: r.stripeRecipientId, payoutMethodId: r.payoutMethodId, destination: r.destination,
    stripeId: null, stripeStatus: null,
  };
}

/** A Pro months line: one month per paying friend, no minimum (0057 item 6). The grant
 *  re-reads the rows in its own transaction, so months here is what Admin approved. */
export function monthsPayout(run: Pick<Run, 'id'>, line: RunLine): Payout {
  return {
    id: payoutIdFor(run.id, line.sharerUid), runId: run.id, sharerUid: line.sharerUid,
    method: 'pro_months', status: 'granting', cents: 0, grossCents: 0, deductCents: 0,
    months: Math.max(0, line.months ?? line.rowIds.length - line.deductRowIds.length),
    rowIds: line.rowIds.slice(), deductRowIds: line.deductRowIds.slice(),
    recipientId: null, payoutMethodId: null, destination: null, stripeId: null, stripeStatus: null,
  };
}

/** Months a Pro months payout grants from its rows as they stand: each refund after an
 *  earlier payout takes one paying friend back. */
export function monthsFrom(live: LiveLine): { months: number; deductUsed: LiveRow[] } {
  const deductUsed = live.deduct.slice(0, live.pay.length);
  return { months: live.pay.length - deductUsed.length, deductUsed };
}

/**
 * Close the payout recipients of deleted accounts (review m4, N5). A close is
 * irreversible, so isGone must be sure (the server checks Firebase Auth and the users
 * doc). One failure never stops the rest: errors are collected and returned.
 */
export async function closeOrphans(
  recipients: { id: string; uid: string | null }[],
  isGone: (uid: string) => Promise<boolean>,
  close: (r: { id: string; uid: string }) => Promise<void>,
): Promise<{ closed: string[]; errors: string[] }> {
  const out = { closed: [] as string[], errors: [] as string[] };
  for (const r of recipients) {
    if (!r.uid) continue;
    try {
      if (!(await isGone(r.uid))) continue;
      await close({ id: r.id, uid: r.uid });
      out.closed.push(r.id);
    } catch (e) {
      out.errors.push(`${r.id}: ${message(e)}`);
    }
  }
  return out;
}

/** Sends one cash payout. Must be idempotent by payout.id (the Stripe idempotency key).
 *  A refusal that retrying cannot fix throws an error with `permanent: true`. */
export interface PayoutsClient {
  send(p: Payout): Promise<{ stripeId: string; stripeStatus: string }>;
  /** posted: the money left; failed: it will not arrive (canceled, failed or returned). */
  outcome(stripeId: string): Promise<{ state: 'posted' | 'failed' | 'open'; stripeStatus: string }>;
  cancel(stripeId: string): Promise<void>;
}

export interface PayoutPorts {
  config(): Promise<ReferralConfig>;
  /** referralPayoutRuns with status approved, or running (this executor, interrupted). */
  openRuns(): Promise<Run[]>;
  /** approved -> running, or take over a running run whose lease ran out. False if another invocation holds it. */
  claimRun(runId: string, nowMs: number): Promise<boolean>;
  finishRun(runId: string, result: RunResult, done: boolean): Promise<void>;
  /** The line's rows now: pay = still payable and unpaid; deduct = reversed after payout, not
   *  yet netted. A web row whose first payment Stripe has since refunded in full or seen
   *  disputed is left out, and reversed when write is true (never on a dry run). */
  liveLine(line: RunLine, write: boolean): Promise<LiveLine>;
  /** refresh: ask Stripe where the recipient stands first and write it back. */
  recipient(uid: string, refresh: boolean): Promise<Recipient | null>;
  payout(id: string): Promise<Payout | null>;
  /** Create the payout doc if absent; return what is stored. */
  beginPayout(p: Payout): Promise<Payout>;
  /** The payout is sent: its rows go paid (paidAt, payoutId; a row refunded meanwhile keeps
   *  status reversed and gains paidAt and reversedFrom paid), deductions get deductedInRun. Idempotent. */
  finishCash(p: Payout, sent: { stripeId: string; stripeStatus: string }, nowMs: number): Promise<void>;
  failPayout(p: Payout, error: string): Promise<void>;
  /** In one transaction, only from granting: the manual grant moves 30 days per month
   *  (monthsFrom on the rows as they stand), rows go paid, deductions netted, payout granted. */
  grantMonths(p: Payout, nowMs: number): Promise<void>;
  /** Cash payouts still settling: sent, or posted less than SETTLE_WINDOW_MS ago (a bank
   *  can return an ACH credit after it posts). */
  openPayouts(nowMs: number): Promise<Payout[]>;
  /** posted: record when; failed: the payout goes returned, its rows back to payable, its
   *  deductions owed again, and the run doc gets an alert. */
  settle(p: Payout, state: 'posted' | 'failed', stripeStatus: string): Promise<void>;
}

export type RunResult = {
  sharers: number;
  rows: number;
  cashCents: number;
  proMonths: number;
  skipped: Partial<Record<SkipReason, number>>;
  failed: number;
  errors: string[];
};

export type LinePlan = { sharerUid: string; method: PayoutMethod; payout?: Payout; skip?: SkipReason; resume?: boolean };
export type RunReport = { runId: string; outcome: 'done' | 'retry' | 'busy' | 'dry_run'; result?: RunResult; plan?: LinePlan[] };

function emptyResult(): RunResult {
  return { sharers: 0, rows: 0, cashCents: 0, proMonths: 0, skipped: {}, failed: 0, errors: [] };
}

function isPermanent(e: unknown): boolean {
  return !!(e && typeof e === 'object' && (e as { permanent?: unknown }).permanent === true);
}

function message(e: unknown): string {
  return String((e as { message?: unknown })?.message || e).slice(0, 300);
}

const DONE_OR_IN_FLIGHT = new Set<PayoutStatus>(['sending', 'sent', 'posted', 'granting', 'granted']);

/** How long a posted payout is still watched for a return (review M2). */
export const SETTLE_WINDOW_MS = 60 * DAY_MS;

/** Check cash payouts still in flight, then execute every approved (or interrupted) run. */
export async function executeRuns(
  ports: PayoutPorts,
  client: PayoutsClient | null,
  o: { nowMs: number; dryRun: boolean; runId?: string },
): Promise<{ settled: { posted: number; returned: number }; runs: RunReport[] }> {
  const settled = { posted: 0, returned: 0 };
  if (client && !o.dryRun) {
    for (const p of await ports.openPayouts(o.nowMs)) {
      if (!p.stripeId) continue;
      try {
        const out = await client.outcome(p.stripeId);
        if (out.state === 'open' || (out.state === 'posted' && p.status === 'posted')) continue;
        if (out.state === 'failed') await client.cancel(p.stripeId).catch((e) => console.warn(`[payouts] cancel ${p.id}: ${message(e)}`));
        await ports.settle(p, out.state, out.stripeStatus);
        if (out.state === 'posted') settled.posted += 1;
        else settled.returned += 1;
      } catch (e) {
        console.warn(`[payouts] settle ${p.id} failed: ${message(e)}`);
      }
    }
  }

  const cfg = await ports.config();
  const runs = (await ports.openRuns()).filter((r) => !o.runId || r.id === o.runId).sort((a, b) => (a.id < b.id ? -1 : 1));
  const reports: RunReport[] = [];
  for (const run of runs) {
    if (!o.dryRun && !(await ports.claimRun(run.id, o.nowMs))) {
      reports.push({ runId: run.id, outcome: 'busy' });
      continue;
    }
    const result = emptyResult();
    const plan: LinePlan[] = [];
    let retry = 0;
    for (const line of run.lines) {
      const id = payoutIdFor(run.id, line.sharerUid);
      let p: Payout | null = null;
      try {
        const existing = await ports.payout(id);
        if (existing && !DONE_OR_IN_FLIGHT.has(existing.status)) {
          plan.push({ sharerUid: line.sharerUid, method: line.method, skip: 'failed_earlier' });
          result.skipped.failed_earlier = (result.skipped.failed_earlier || 0) + 1;
          continue;
        }
        if (existing) {
          p = existing;
        } else if (line.method === 'pro_months') {
          // The grant re-reads the rows in its transaction; this first drops any whose
          // payment Stripe took back since the run was written.
          await ports.liveLine(line, !o.dryRun);
          p = monthsPayout(run, line);
        } else {
          const planned = cashPayout(run, line, await ports.liveLine(line, !o.dryRun), await ports.recipient(line.sharerUid, !o.dryRun && !!client), cfg);
          if (typeof planned === 'string') {
            plan.push({ sharerUid: line.sharerUid, method: line.method, skip: planned });
            result.skipped[planned] = (result.skipped[planned] || 0) + 1;
            continue;
          }
          p = planned;
        }
        plan.push({ sharerUid: line.sharerUid, method: line.method, payout: p, resume: !!existing });
        if (o.dryRun) continue;

        if (p.method === 'stripe_global_payouts' && !client) {
          throw new Error('payouts are closed on the site (PAYOUTS_PROVIDER); the cash line waits');
        }
        p = await ports.beginPayout(p);
        if (p.method === 'pro_months') {
          if (p.status === 'granting') await ports.grantMonths(p, o.nowMs);
          p = (await ports.payout(p.id)) || p;
          result.proMonths += p.months;
        } else {
          const sent = p.status === 'sending' ? await client.send(p) : { stripeId: p.stripeId, stripeStatus: p.stripeStatus };
          await ports.finishCash(p, sent, o.nowMs);
          result.cashCents += p.cents;
        }
        result.sharers += 1;
        result.rows += p.rowIds.length;
      } catch (e) {
        if (isPermanent(e) && p) {
          await ports.failPayout(p, message(e));
          result.failed += 1;
        } else {
          retry += 1;
        }
        result.errors.push(`${id}: ${message(e)}`);
      }
    }
    if (o.dryRun) {
      reports.push({ runId: run.id, outcome: 'dry_run', plan });
      continue;
    }
    await ports.finishRun(run.id, result, retry === 0);
    reports.push({ runId: run.id, outcome: retry === 0 ? 'done' : 'retry', result });
  }
  return { settled, runs: reports };
}
