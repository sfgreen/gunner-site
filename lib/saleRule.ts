// The store sale on the web (gunner repo, decision 0085 amendment 3), the rule as pure
// functions. No imports, so `node --test scripts/test_sale_rule.mjs` runs this exact file.
//
// The app's sale (SaleOffer.swift) and the backend (functions/main.py _sale_live,
// _sale_hold_over) read `config/sale`:
//   active, code (BF50), name, startEpoch, endEpoch (seconds), holdHours (0 = no hold),
//   excludeStorefronts (App Store alpha-3 codes, e.g. IND, PAK, NPL for the 0066 price test)
// and each student's first look, `users/{uid}.saleSeen.<code>` (seconds). A student's price
// runs `holdHours` from that first look, never past the sale's end, and does not come back.
// The web adds two fields to the same doc:
//   webCoupon   the Stripe coupon checkout applies (yearly only, like the app)
//   webPrice    what the yearly row shows, e.g. "$49.99" (the coupon's result)
// No webCoupon = no sale on the web.

export type SaleDoc = Record<string, unknown>;

export type WebSale = {
  code: string;
  name: string;
  coupon: string;
  price: string;
  /** When this student's sale price ends (ms): their hold, capped by the sale's end. */
  endsAtMs: number;
  /** No first look on file yet: the caller stamps saleSeen.<code> = now. */
  firstLook: boolean;
};

// App Store storefronts are alpha-3; the site knows the visitor's country as alpha-2
// (Vercel's x-vercel-ip-country). Only the codes config/sale has skipped so far.
const ALPHA3_TO_2: Record<string, string> = { IND: 'IN', PAK: 'PK', NPL: 'NP' };

export function saleCode(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

/** True when the sale skips this visitor's country (alpha-2). An unknown country is not skipped. */
export function countrySkipped(doc: SaleDoc, country: string | null | undefined): boolean {
  const c = (country || '').trim().toUpperCase();
  if (!c) return false;
  const list = Array.isArray(doc.excludeStorefronts) ? doc.excludeStorefronts : [];
  return list.some((x) => {
    const s = typeof x === 'string' ? x.trim().toUpperCase() : '';
    return s === c || ALPHA3_TO_2[s] === c;
  });
}

/**
 * The sale price this student can have now on the web, or null. `user` is users/{uid}.
 * Whether the account has ever paid is the caller's check (it needs iapEvents).
 */
export function webSaleFor(doc: SaleDoc | null | undefined, user: Record<string, unknown> | null | undefined,
  country: string | null | undefined, nowMs: number): WebSale | null {
  if (!doc || doc.active !== true) return null;
  const code = saleCode(doc.code);
  const coupon = typeof doc.webCoupon === 'string' ? doc.webCoupon.trim() : '';
  const price = typeof doc.webPrice === 'string' ? doc.webPrice.trim() : '';
  if (!code || !coupon || !price) return null;
  const start = num(doc.startEpoch) * 1000;
  const end = num(doc.endEpoch) * 1000;
  if (!(end > start) || nowMs < start || nowMs >= end) return null;
  if (countrySkipped(doc, country)) return null;
  const hold = Math.min(168, Math.max(0, Math.floor(num(doc.holdHours ?? 24))));
  const seenMap = user && typeof user.saleSeen === 'object' && user.saleSeen ? (user.saleSeen as Record<string, unknown>) : {};
  const seen = num(seenMap[code]) * 1000;
  const name = typeof doc.name === 'string' && doc.name.trim() ? doc.name.trim() : 'Black Friday';
  if (hold === 0) return { code, name, coupon, price, endsAtMs: end, firstLook: false };
  if (seen > 0) {
    const ends = Math.min(end, seen + hold * 3_600_000);
    return nowMs < ends ? { code, name, coupon, price, endsAtMs: ends, firstLook: false } : null;
  }
  return { code, name, coupon, price, endsAtMs: Math.min(end, nowMs + hold * 3_600_000), firstLook: true };
}
