import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { COMMISSION, HOLD_DAYS, type ChiefStats, type LedgerRow, type PublicChief, type RowStatus } from './chiefs';

// Step Gunner Chiefs, server half (see chiefs.ts for the client-safe half).
// Server-only: imported by getServerSideProps and
// API routes, never by client components, so firebase-admin stays out of the
// browser bundle. Every collection here is server-write-only (rules deny all
// client access), so the admin SDK is the only way in.

// Same init as pages/api/readiness.ts and cron/seed-bots.ts: no credential means
// no app, and every loader below degrades to "not found" instead of throwing.
if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      projectId: 'stepgunner-79ae7',
    });
  } catch (err) {
    console.error('chiefs: firebase admin init failed', err);
  }
}

export function chiefsDb(): Firestore | null {
  return getApps().length ? getFirestore() : null;
}

// Local design preview. `next dev` with CHIEFS_PREVIEW=1 and no credential
// serves one labeled fake Chief (code PREVIEW40, token preview-token-0000) so
// the active states can be reviewed without production Firestore. Unreachable
// in a build: NODE_ENV is 'production' on every Vercel deployment.
const PREVIEW_ON = process.env.NODE_ENV === 'development' && process.env.CHIEFS_PREVIEW === '1';
export const PREVIEW_CODE = 'PREVIEW40';
const PREVIEW_TOKEN = 'preview-token-0000';

// ---- time: everything a Chief sees is in Central ----
const TZ = 'America/Chicago';

function toMillis(v: unknown): number | null {
  if (v == null) return null;
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === 'object' && v !== null && typeof (v as { toMillis?: unknown }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (typeof v === 'number' && Number.isFinite(v)) return v < 1e12 ? v * 1000 : v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

export function monthKeyCT(ms: number): string {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit' }).formatToParts(ms);
  return `${p.find((x) => x.type === 'year')?.value}-${p.find((x) => x.type === 'month')?.value}`;
}

export function dateCT(ms: number): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric' }).format(ms);
}

export function stampCT(ms: number): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(ms);
}

// ---- public link: /c/[code] ----
export async function getPublicChief(code: string): Promise<PublicChief | null> {
  const db = chiefsDb();
  if (!db) {
    return PREVIEW_ON && code === PREVIEW_CODE ? { code, displayName: 'Maya', active: true, preview: true } : null;
  }
  const snap = await db.collection('chiefs').doc(code).get();
  if (!snap.exists) return null;
  const d = snap.data() || {};
  const displayName = String(d.displayName || d.name || '').trim().slice(0, 40);
  return { code, displayName, active: d.status === 'active' };
}

// ---- private dashboard: /chiefs/me?t= ----
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Buyer-blind by construction: only date, commission and status leave this
 * function. No uid, transaction id, product or offer identifier reaches props,
 * so nothing about who bought can end up in the page HTML.
 */
export async function getChiefStats(token: string): Promise<ChiefStats | null> {
  const db = chiefsDb();
  if (!db) return PREVIEW_ON && token === PREVIEW_TOKEN ? previewStats() : null;
  const found = await db.collection('chiefs').where('token', '==', token).limit(1).get();
  if (found.empty) return null;
  const chief = found.docs[0];
  const c = chief.data() || {};
  const code = String(c.code || chief.id).toUpperCase();

  // Equality filter only, sorted in memory: avoids a composite index.
  const ledger = await db.collection('chiefLedger').where('code', '==', code).limit(2000).get();

  const now = Date.now();
  const thisMonth = monthKeyCT(now);
  const holdMs = HOLD_DAYS * 24 * 3600 * 1000;
  const s = { monthCount: 0, allCount: 0, pendingUSD: 0, eligibleUSD: 0, paidUSD: 0, refundCount: 0, deductUSD: 0 };
  const rows: (LedgerRow & { ms: number })[] = [];

  for (const doc of ledger.docs) {
    const d = doc.data() || {};
    const ms = toMillis(d.purchasedAt) ?? 0;
    const amount = round2(Number(d.commissionUSD) || 0);
    const refunded = toMillis(d.refundedAt) != null;
    const paid = toMillis(d.paidAt) != null;
    let status: RowStatus;

    if (typeof d.environment === 'string' && d.environment.toLowerCase() === 'sandbox') {
      status = 'test'; // App Store sandbox purchase: shown, never counted
    } else {
      s.allCount += 1;
      if (ms && monthKeyCT(ms) === thisMonth) s.monthCount += 1;
      if (refunded && paid) { status = 'clawback'; s.refundCount += 1; s.deductUSD += amount; s.paidUSD += amount; }
      else if (refunded) { status = 'refunded'; s.refundCount += 1; }
      else if (paid) { status = 'paid'; s.paidUSD += amount; }
      else if (ms && now - ms >= holdMs) { status = 'eligible'; s.eligibleUSD += amount; }
      else { status = 'pending'; s.pendingUSD += amount; }
    }
    rows.push({ ms, date: ms ? dateCT(ms) : 'Unknown date', amount, status });
  }

  rows.sort((a, b) => b.ms - a.ms);
  return {
    code,
    displayName: String(c.displayName || c.name || '').trim().slice(0, 40),
    active: c.status === 'active',
    monthCount: s.monthCount,
    allCount: s.allCount,
    pendingUSD: round2(s.pendingUSD),
    eligibleUSD: round2(s.eligibleUSD),
    paidUSD: round2(s.paidUSD),
    refundCount: s.refundCount,
    deductUSD: round2(s.deductUSD),
    rows: rows.slice(0, 500).map(({ date, amount, status }) => ({ date, amount, status })),
    asOf: stampCT(now),
  };
}


function previewStats(): ChiefStats {
  const day = 24 * 3600 * 1000;
  const now = Date.now();
  const at = (d: number) => dateCT(now - d * day);
  const rows: LedgerRow[] = [
    { date: at(2), amount: COMMISSION, status: 'pending' },
    { date: at(9), amount: COMMISSION, status: 'pending' },
    { date: at(33), amount: COMMISSION, status: 'eligible' },
    { date: at(41), amount: COMMISSION, status: 'refunded' },
    { date: at(64), amount: COMMISSION, status: 'paid' },
  ];
  return {
    code: PREVIEW_CODE, displayName: 'Maya', active: true,
    monthCount: 2, allCount: 5, pendingUSD: round2(2 * COMMISSION), eligibleUSD: COMMISSION, paidUSD: COMMISSION,
    refundCount: 1, deductUSD: 0, rows, asOf: stampCT(now), preview: true,
  };
}
