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

/** A free month of Pro per paying friend (decision 0057 item 6) is this many days. */
export const PRO_MONTH_DAYS = 30;

/** The manual grant moved `days` later: from its end while it still runs, else from now. */
export function extendManualMs(manual: number | null, nowMs: number, days: number): number {
  return Math.max(manual ?? 0, nowMs) + days * DAY_MS;
}

export type CheckoutOrigin = 'app' | 'web';

/**
 * Where Stripe Checkout sends the buyer back. From the app (0057 amendment, F2) it is
 * the universal link /pro/done, which reopens Step Gunner, with Stripe's page for
 * app-to-web purchases; from the web it is /pro.
 */
export function checkoutReturn(origin: CheckoutOrigin, base: string): {
  success_url: string; cancel_url: string; origin_context?: 'mobile_app';
} {
  if (origin === 'app') {
    return {
      success_url: `${base}/pro/done?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pro/done?canceled=1`,
      origin_context: 'mobile_app',
    };
  }
  return { success_url: `${base}/pro?paid={CHECKOUT_SESSION_ID}`, cancel_url: `${base}/pro?canceled=1` };
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

/** Stripe metadata on a refund the site issues for a duplicate checkout, so the refund
 *  webhook leaves the account's real plan and its friend reward alone. */
export const DUPLICATE_REFUND_TAG = 'duplicate_checkout';

/**
 * Why a checkout that just completed would bill an account twice (review M7): the
 * account already pays through the App Store, or has another live web subscription.
 * A checkout guard alone misses a second open tab or an App Store purchase made while
 * the Stripe page was open; the webhook asks again and refunds the newcomer.
 */
export function duplicateReason(appStorePaying: boolean, otherLiveWebSubscriptions: number): 'app_store' | 'web' | null {
  if (appStorePaying) return 'app_store';
  if (otherLiveWebSubscriptions > 0) return 'web';
  return null;
}

/** A Stripe refusal a webhook retry cannot change (4xx other than 429): record it and
 *  answer 200, rather than a 500 that Stripe retries for 3 days (review N6). */
export function refusedByStripe(statusCode: unknown): boolean {
  return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500 && statusCode !== 429;
}
