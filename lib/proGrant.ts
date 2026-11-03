// Pro on the web (gunner repo, decision 0051), the unlock rule as pure functions.
// No imports, so `node --test scripts/test_pro_grant.mjs` runs this exact file.
//
// The app unlocks Pro from `users/{uid}.proGrantExpiresAt` (SubscriptionManager
// .refreshServerGrant). Two sources feed it, each in its own field:
//   proGrantManualExpiresAt  comps (scripts/grant_pro.py)
//   webProExpiresAt          a paid Stripe period plus a day of grace
// and proGrantExpiresAt is always the later of the two. So a comp never cuts a
// paying web student short, and a web cancel never erases a comp.

export const DAY_MS = 86_400_000;
export const GRACE_MS = DAY_MS; // a renewal that is a few hours late keeps Pro

// Friend codes (decision 0057, 2026-11-03; amends 0051). The friend's discount is a
// Stripe coupon picked by plan: 40% off a first year (STRIPE_COUPON_FRIEND_YEARLY)
// or $5 off a first month (STRIPE_COUPON_FRIEND_MONTHLY). The student who shared
// earns cash, paid by hand (Managed Payments allows no Connect payouts): $15 for a
// yearly friend, $5 for a monthly one. It is payable 30 days after the friend's
// first payment if that payment is not refunded, and capped per calendar year
// under the 1099 line. Rows live in referralRewards/{friendUid}, one per friend, ever.
export const FRIEND_PAYOUT_CENTS: Record<'yearly' | 'monthly', number> = { yearly: 1500, monthly: 500 };
export const FRIEND_YEAR_CAP_CENTS = 199_500;
export const FRIEND_HOLD_MS = 30 * DAY_MS;

/** A referralRewards row, read for the cap. */
export type RewardRow = { status: string; cents: number; firstPaidMs: number | null };

const EARNING = new Set(['pending', 'payable', 'paid']);

/** Cents a sharer has earned from friends whose first payment fell in this calendar
 *  year (UTC). Reversed, skipped and capped rows do not count. */
export function earnedInYearCents(rows: RewardRow[], nowMs: number): number {
  const year = new Date(nowMs).getUTCFullYear();
  let sum = 0;
  for (const r of rows) {
    if (!EARNING.has(r.status)) continue;
    if (r.firstPaidMs != null && new Date(r.firstPaidMs).getUTCFullYear() !== year) continue;
    sum += Math.max(0, r.cents || 0);
  }
  return sum;
}

/** Cents one more paying friend earns: the plan's amount, what is left under the cap, or 0. */
export function friendPayoutCents(plan: 'yearly' | 'monthly', earnedCents: number, cap = FRIEND_YEAR_CAP_CENTS): number {
  return Math.max(0, Math.min(FRIEND_PAYOUT_CENTS[plan], cap - Math.max(0, earnedCents)));
}

/**
 * What a refund or dispute does to a reward row. Only a refund of the friend's FIRST
 * payment takes the reward back (0057: a later renewal's refund leaves it). When the
 * first payment is unknown, a refund while the row is still in its hold counts.
 * Returns the new status, or null for no change.
 */
export function reversalStatus(
  row: { status: string; firstPaymentIntent?: string | null },
  refundedPaymentIntent: string | null,
): string | null {
  const first = row.firstPaymentIntent || null;
  if (first) {
    if (!refundedPaymentIntent || refundedPaymentIntent !== first) return null;
  } else if (row.status !== 'pending') {
    return null;
  }
  if (row.status === 'pending' || row.status === 'payable') return 'reversed';
  if (row.status === 'paid') return 'reversed_after_paid';
  return null;
}

export type Plan = 'yearly' | 'monthly';

/** The parts of a Stripe subscription the rule reads (built in proServer.ts). */
export type SubLite = {
  id: string;
  status: string;
  /** End of the paid period, ms (the latest item's current_period_end). */
  periodEndMs: number;
  cancelAtPeriodEnd: boolean;
  plan: Plan | null;
};

// Stripe statuses that keep Pro on. past_due: Stripe is retrying the card, and
// the grace day covers the gap. incomplete, incomplete_expired, unpaid, paused
// and canceled do not.
const LIVE = new Set(['active', 'trialing', 'past_due']);

export function isLive(s: SubLite): boolean {
  return LIVE.has(s.status);
}

/** The live subscription that pays furthest ahead, or null. */
export function liveSub(subs: SubLite[]): SubLite | null {
  let best: SubLite | null = null;
  for (const s of subs) {
    if (!isLive(s)) continue;
    if (!best || s.periodEndMs > best.periodEndMs) best = s;
  }
  return best;
}

/** webProExpiresAt for a customer's subscriptions: null when nothing live. */
export function webExpiresMs(subs: SubLite[]): number | null {
  const s = liveSub(subs);
  return s ? s.periodEndMs + GRACE_MS : null;
}

/** What a users doc holds, with every time already in ms (null = absent or unset). */
export type GrantFields = {
  hasManualField: boolean;
  manualMs: number | null;
  hasWebField: boolean;
  grantMs: number | null;
};

/**
 * The manual grant. Before this rule every grant was manual and lived only in
 * proGrantExpiresAt, so a doc with neither new field reads its grant as manual.
 * Once the web or grant_pro.py writes the manual field (null included), that
 * field is the truth.
 */
export function manualMs(f: GrantFields): number | null {
  if (f.hasManualField) return f.manualMs;
  if (f.hasWebField) return null;
  return f.grantMs;
}

/** proGrantExpiresAt: the later of the two sources, null when neither. */
export function mergedMs(manual: number | null, web: number | null): number | null {
  if (manual == null) return web;
  if (web == null) return manual;
  return Math.max(manual, web);
}

/** The same "paying through the App Store" rule as functions/main.py. */
export function appStoreActive(
  iapStatus: unknown, iapEnvironment: unknown, iapExpirationMs: number | null, nowMs: number,
): boolean {
  return iapStatus === 'active' && iapEnvironment !== 'Sandbox' && !(iapExpirationMs != null && iapExpirationMs < nowMs);
}

/**
 * Codes are stored uppercase: a student's referralCode is the first name's letters
 * and digits (any script, AuthManager.makeReferralCode) plus "-" and 4 characters;
 * a Chief code is its doc id. Anything else is not a code.
 */
const CODE_RE = new RegExp('^[\\p{L}\\p{N}-]{3,24}$', 'u');
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const c = raw.trim().toUpperCase();
  return CODE_RE.test(c) ? c : null;
}

/**
 * The hyphen is only there to read the code; a code typed without it is the same
 * code. A student's referralCode always ends in "-" plus 4 characters, so the
 * hyphen goes back in before the last 4. Chief codes never hold one (Apple offer
 * codes allow no special characters), so a promoted student's Chief code is their
 * referralCode without the hyphen.
 */
export function studentCodeForm(code: string): string {
  if (code.includes('-') || code.length < 5) return code;
  return `${code.slice(0, -4)}-${code.slice(-4)}`;
}
export function chiefCodeForm(code: string): string {
  return code.replace(/-/g, '');
}

/** "40% off your first year" / "$10.00 off your first payment", from a Stripe coupon. */
export function couponLabel(
  c: { percent_off?: number | null; amount_off?: number | null; duration?: string | null; duration_in_months?: number | null },
  plan: Plan,
): string | null {
  const amount = c.percent_off ? `${trimNum(c.percent_off)}%` : c.amount_off ? `$${(c.amount_off / 100).toFixed(2)}` : null;
  if (!amount) return null;
  let span = 'your first payment';
  if (c.duration === 'once') span = plan === 'yearly' ? 'your first year' : 'your first month';
  else if (c.duration === 'forever') span = 'every payment';
  else if (c.duration === 'repeating' && c.duration_in_months) span = `your first ${c.duration_in_months} months`;
  return `${amount} off ${span}`;
}

function trimNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
