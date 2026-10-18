// Step Gunner Chiefs, the invitation-only referral program (contract: gunner
// repo, decision 0041). Client-safe half: constants, formatting and types. The
// firebase-admin half lives in chiefsServer.ts so it never reaches a browser
// bundle (a component importing a module that initializes firebase-admin would
// drag the whole SDK client-side).

// ---- the deal (contract, Danny 2026-10-18, decision 0041 amended) ----
// Kept here so the copy on every Chiefs page moves together when a price does.
// LIST_YEARLY must match App Store Connect (yearly $99.99 from 2026-10-20).
export const LIST_YEARLY = 99.99;
export const DISCOUNT_PCT = 40; // a Chief code takes 40% off the first year
export const CHIEF_YEARLY = 59.99;
export const PROCEEDS_RATE = 0.85; // Small Business Program: Apple keeps 15%
export const PAYOUT_RATE = 0.4; // the Chief earns 40% of our proceeds
export const PAYOUT_PCT = Math.round(PAYOUT_RATE * 100);
export const PROCEEDS = Math.round(CHIEF_YEARLY * PROCEEDS_RATE * 100) / 100; // 50.99
export const COMMISSION = Math.round(CHIEF_YEARLY * PROCEEDS_RATE * PAYOUT_RATE * 100) / 100; // 20.40
export const HOLD_DAYS = 30;
export const APP_ID = '6761317357';

export const usd = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function redeemUrl(code: string): string {
  return `https://apps.apple.com/redeem?ctx=offercodes&id=${APP_ID}&code=${encodeURIComponent(code)}`;
}

/** Doc ids are the uppercase custom code. Anything else is not a code. */
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const c = raw.trim().toUpperCase();
  return /^[A-Z0-9]{3,32}$/.test(c) ? c : null;
}

export function shareUrl(code: string): string {
  return `https://stepgunner.com/c/${code}`;
}

// ---- application form: the API validates against these same lists ----
export const YEARS = ['MS1', 'MS2', 'MS3', 'MS4', 'Resident', 'Other'] as const;
export const AUDIENCES = ['Under 50', '50 to 500', '500 to 5,000', 'Over 5,000'] as const;
export const CHANNELS = [
  'Class group chat', 'Instagram', 'TikTok', 'Reddit', 'YouTube', 'Discord', 'Tutoring', 'In person',
] as const;

export type FieldErrors = Partial<Record<'name' | 'email' | 'school' | 'year' | 'channels' | 'audience' | 'why', string>>;

export interface PublicChief {
  code: string;
  displayName: string;
  active: boolean;
  /** Local design fixture (see chiefsServer.ts); the page labels it loudly. */
  preview?: boolean;
}

export type RowStatus = 'pending' | 'eligible' | 'paid' | 'refunded' | 'clawback' | 'test';

export interface LedgerRow {
  date: string;
  amount: number;
  status: RowStatus;
}

export interface ChiefStats {
  code: string;
  displayName: string;
  active: boolean;
  monthCount: number;
  allCount: number;
  pendingUSD: number;
  eligibleUSD: number;
  paidUSD: number;
  refundCount: number;
  /** Refunded after it was paid: comes out of the next payout. */
  deductUSD: number;
  rows: LedgerRow[];
  asOf: string;
  preview?: boolean;
}

export function isTokenShape(t: unknown): t is string {
  return typeof t === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(t);
}

export function possessive(name: string): string {
  return name ? `${name}’s` : 'A';
}
