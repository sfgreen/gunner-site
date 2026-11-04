import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, type DocumentData, type DocumentReference } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import type { NextApiRequest } from 'next';
import { ORIGIN, ProError, grantFields, proDb, referralConfigFor, statusFor, stripe, toMs, ts } from './proServer';
import { extendManualMs, manualMs, mergedMs, PRO_MONTH_DAYS, type Plan } from './proGrant';
import {
  earningsTotals, isCashCountry, monthsFrom, refundedAfterPayout,
  type EarningsTotals, type LiveLine, type OnboardingStatus, type Payout, type PayoutPorts, type Preference,
  type Recipient, type ReferralConfig, type Run, type RunLine, type RunResult,
} from './referral';
import { globalPayouts, type GlobalPayouts } from './globalPayouts';

// The sharer's half of friend codes (decision 0057 amendment, 2026-11-04): /earnings,
// payout setup on Stripe's hosted form, and the Firestore side of executing a payout
// run the backend wrote (lib/referral.ts executeRuns). Schema: the top of lib/proServer.ts.

let payoutsSingleton: GlobalPayouts | null = null;

/** Global Payouts, or null while PAYOUTS_PROVIDER is not global_payouts ("Payouts open soon"). */
export function payoutsProvider(): GlobalPayouts | null {
  if (process.env.PAYOUTS_PROVIDER !== 'global_payouts') return null;
  if (!payoutsSingleton) {
    const key = process.env.STRIPE_PAYOUTS_KEY;
    const st = key ? new Stripe(key) : stripe();
    payoutsSingleton = globalPayouts(st, { financialAccount: process.env.STRIPE_FINANCIAL_ACCOUNT || null });
  }
  return payoutsSingleton;
}

/** Vercel's geo header, e.g. "US"; null locally. */
export function ipCountry(req: NextApiRequest): string | null {
  const c = String(req.headers['x-vercel-ip-country'] || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : null;
}

function recipientFrom(uid: string, d: DocumentData | undefined): Recipient | null {
  if (!d) return null;
  return {
    uid,
    preference: d.preference === 'cash' || d.preference === 'pro_months' ? d.preference : null,
    onboardingStatus: ['pending', 'complete', 'restricted'].includes(d.onboardingStatus) ? d.onboardingStatus : null,
    country: typeof d.country === 'string' ? d.country.toUpperCase() : null,
    stripeRecipientId: typeof d.stripeRecipientId === 'string' ? d.stripeRecipientId : null,
    payoutMethodId: typeof d.payoutMethodId === 'string' ? d.payoutMethodId : null,
    destination: typeof d.destination === 'string' ? d.destination : null,
  };
}

/** Ask Stripe where a recipient stands and write it back. Errors leave the stored state. */
async function refreshRecipient(r: Recipient, client: GlobalPayouts): Promise<Recipient> {
  if (!r.stripeRecipientId) return r;
  try {
    const s = await client.recipientState(r.stripeRecipientId);
    await proDb().collection('payoutRecipients').doc(r.uid).set({
      onboardingStatus: s.onboardingStatus, capability: s.capability, payoutMethodId: s.payoutMethodId,
      destination: s.destination, updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ...r, onboardingStatus: s.onboardingStatus, payoutMethodId: s.payoutMethodId, destination: s.destination };
  } catch (e) {
    console.warn(`[payouts] recipient refresh uid=${r.uid.slice(0, 6)} failed: ${(e as Error).message}`);
    return r;
  }
}

// ---- /earnings ----

export type EarningsRowView = {
  name: string;
  plan: Plan | null;
  rail: string;
  cents: number;
  status: string;
  reason: string | null;
  /** Reversed after its payout went out (it comes off the next one). */
  afterPayout: boolean;
  firstPaidMs: number | null;
  payableMs: number | null;
  paidMs: number | null;
};

export type EarningsView = {
  code: string | null;
  rows: EarningsRowView[];
  totals: EarningsTotals;
  payout: {
    /** Cash payouts run (PAYOUTS_PROVIDER on and cashEnabled). */
    open: boolean;
    cashEligible: boolean;
    preference: Preference | null;
    setup: 'none' | OnboardingStatus;
    destination: string | null;
    /** Pays for Pro now, so a free month adds nothing until the plan ends. */
    subscribed: boolean;
  };
  rules: Pick<ReferralConfig, 'minPayoutCents' | 'yearCapCents' | 'holdDays' | 'centsYearly' | 'centsMonthly'>;
};

/** "Sam" from "Sam Patel", the handle otherwise. Never realName or email. */
function friendName(d: DocumentData | undefined): string {
  const first = String(d?.displayName || '').trim().split(/\s+/)[0] || '';
  return first ? first.slice(0, 24) : 'A friend';
}

export async function earningsFor(uid: string, country: string | null, refresh: boolean): Promise<EarningsView> {
  const db = proDb();
  const [rowsSnap, recSnap, cfg, me] = await Promise.all([
    db.collection('referralRewards').where('sharerUid', '==', uid).limit(500).get(),
    db.collection('payoutRecipients').doc(uid).get(),
    referralConfigFor(),
    statusFor(uid),
  ]);
  const client = payoutsProvider();
  let rec = recipientFrom(uid, recSnap.data());
  if (rec && client && (refresh || rec.onboardingStatus !== 'complete')) rec = await refreshRecipient(rec, client);

  const docs = rowsSnap.docs.map((x) => x.data());
  const friends = docs.length
    ? await db.getAll(...docs.map((d) => db.collection('users').doc(String(d.friendUid || '') || '_')))
    : [];
  const rows: EarningsRowView[] = docs.map((d, i) => ({
    name: friendName(friends[i]?.data()),
    plan: d.plan === 'yearly' || d.plan === 'monthly' ? d.plan : null,
    rail: String(d.rail || 'web'),
    cents: Number(d.cents) || 0,
    status: String(d.status || ''),
    reason: typeof d.reason === 'string' ? d.reason : null,
    afterPayout: refundedAfterPayout({ status: String(d.status || ''), cents: 0, paidAt: d.paidAt }),
    firstPaidMs: toMs(d.firstPaidAt),
    payableMs: toMs(d.payableAt),
    paidMs: toMs(d.paidAt),
  })).sort((a, b) => (b.firstPaidMs ?? 0) - (a.firstPaidMs ?? 0));

  const where = rec?.country || country;
  return {
    code: typeof me.doc.referralCode === 'string' ? me.doc.referralCode : null,
    rows,
    totals: earningsTotals(docs.map((d) => ({
      status: String(d.status || ''), cents: Number(d.cents) || 0, paidAt: d.paidAt || null, deductedInRun: d.deductedInRun || null,
    }))),
    payout: {
      open: !!client && cfg.cashEnabled,
      // Unknown (no geo header, local dev) does not block; Stripe's form checks the bank.
      cashEligible: where ? isCashCountry(where, cfg) : true,
      preference: rec?.preference || null,
      setup: rec?.stripeRecipientId ? rec.onboardingStatus || 'pending' : 'none',
      destination: rec?.destination || null,
      subscribed: me.status.source === 'app_store' || me.status.source === 'web',
    },
    rules: {
      minPayoutCents: cfg.minPayoutCents, yearCapCents: cfg.yearCapCents, holdDays: cfg.holdDays,
      centsYearly: cfg.centsYearly, centsMonthly: cfg.centsMonthly,
    },
  };
}

export async function setPreference(uid: string, preference: unknown, country: string | null): Promise<Preference> {
  if (preference !== 'cash' && preference !== 'pro_months') throw new ProError(400, 'preference', 'Pick cash or Pro months.');
  const ref = proDb().collection('payoutRecipients').doc(uid);
  const [snap, cfg] = await Promise.all([ref.get(), referralConfigFor()]);
  const known = recipientFrom(uid, snap.data())?.country || country;
  if (preference === 'cash' && known && !isCashCountry(known, cfg)) {
    throw new ProError(403, 'not_cash_country', 'Cash payouts are for US bank accounts for now.');
  }
  await ref.set({ preference, ...(known ? { country: known } : {}), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  console.log(`[payouts] preference uid=${uid.slice(0, 6)} ${preference} country=${known || '?'}`);
  return preference;
}

/** Stripe's hosted form for this sharer's bank: made once, then an update link. Returns its URL. */
export async function payoutSetupLink(uid: string, country: string | null): Promise<string> {
  const client = payoutsProvider();
  const cfg = await referralConfigFor();
  if (!client || !cfg.cashEnabled) throw new ProError(503, 'payouts_closed', 'Payouts open soon.');
  const db = proDb();
  const ref = db.collection('payoutRecipients').doc(uid);
  const rec = recipientFrom(uid, (await ref.get()).data());
  const where = rec?.country || country;
  if (where && !isCashCountry(where, cfg)) throw new ProError(403, 'not_cash_country', 'Cash payouts are for US bank accounts for now.');

  let id = rec?.stripeRecipientId || null;
  if (!id) {
    const [user, doc] = await Promise.all([getAuth().getUser(uid), db.collection('users').doc(uid).get()]);
    if (!user.email) throw new ProError(400, 'no_email', 'Your account has no email for Stripe to reach you. Write to support from the app.');
    id = await client.createRecipient({ uid, email: user.email, name: String(doc.data()?.displayName || user.email) });
    await ref.set({
      stripeRecipientId: id, onboardingStatus: 'pending', country: 'US', preference: 'cash',
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`[payouts] recipient created uid=${uid.slice(0, 6)}`);
  } else if (rec?.preference !== 'cash') {
    await ref.set({ preference: 'cash', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  return client.onboardingLink(id, rec?.onboardingStatus === 'complete' ? 'account_update' : 'account_onboarding', {
    returnUrl: `${ORIGIN}/earnings?payouts=return`,
    refreshUrl: `${ORIGIN}/earnings?payouts=refresh`,
  });
}

// ---- the payout run's Firestore side ----

const LEASE_MS = 5 * 60_000;
const ALREADY_EXISTS = 6;

function payoutFrom(id: string, d: DocumentData): Payout {
  return {
    id,
    runId: String(d.runId || ''),
    sharerUid: String(d.sharerUid || ''),
    method: d.method === 'pro_months' ? 'pro_months' : 'stripe_global_payouts',
    status: d.status,
    cents: Number(d.cents) || 0,
    grossCents: Number(d.grossCents) || 0,
    deductCents: Number(d.deductCents) || 0,
    months: Number(d.months) || 0,
    rowIds: Array.isArray(d.rowIds) ? d.rowIds.map(String) : [],
    deductRowIds: Array.isArray(d.deductRowIds) ? d.deductRowIds.map(String) : [],
    recipientId: d.recipientId || null,
    payoutMethodId: d.payoutMethodId || null,
    destination: d.destination || null,
    stripeId: d.stripeId || null,
    stripeStatus: d.stripeStatus || null,
  };
}

function lineFrom(x: DocumentData): RunLine | null {
  const uid = typeof x?.sharerUid === 'string' ? x.sharerUid : '';
  if (!uid || (x.method !== 'stripe_global_payouts' && x.method !== 'pro_months')) return null;
  return {
    sharerUid: uid,
    method: x.method,
    rowIds: Array.isArray(x.rowIds) ? x.rowIds.map(String) : [],
    deductRowIds: Array.isArray(x.deductRowIds) ? x.deductRowIds.map(String) : [],
    cents: Number(x.cents) || 0,
    months: typeof x.months === 'number' ? x.months : undefined,
    stripeRecipientId: typeof x.stripeRecipientId === 'string' ? x.stripeRecipientId : null,
  };
}

/** Still owed to the sharer: payable and on no payout. */
const isLivePay = (d: DocumentData | undefined) => d?.status === 'payable' && !d.payoutId;
/** Refunded after its payout and not yet netted off another. */
const isLiveDeduct = (d: DocumentData | undefined) => d?.status === 'reversed' && !!d.paidAt && !d.deductedInRun;

export function firestorePayoutPorts(client: GlobalPayouts | null): PayoutPorts {
  const db = proDb();
  const runs = db.collection('referralPayoutRuns');
  const rewards = db.collection('referralRewards');
  const payouts = db.collection('referralPayouts');
  const recipients = db.collection('payoutRecipients');
  const refs = (ids: string[]): DocumentReference[] => ids.map((id) => rewards.doc(id));

  return {
    config: referralConfigFor,

    async openRuns(): Promise<Run[]> {
      const snap = await runs.where('status', 'in', ['approved', 'running']).get();
      return snap.docs.map((x) => ({
        id: x.id,
        status: String(x.get('status')),
        lines: (Array.isArray(x.get('lines')) ? x.get('lines') : []).map(lineFrom).filter((l: RunLine | null): l is RunLine => !!l),
      }));
    },

    async claimRun(runId, nowMs) {
      const ref = runs.doc(runId);
      return db.runTransaction(async (tx) => {
        const d = (await tx.get(ref)).data() || {};
        const free = d.status === 'approved' || (d.status === 'running' && (toMs(d.leaseUntil) ?? 0) < nowMs);
        if (!free) return false;
        tx.set(ref, {
          status: 'running', leaseUntil: Timestamp.fromMillis(nowMs + LEASE_MS),
          ...(d.startedAt ? {} : { startedAt: FieldValue.serverTimestamp() }),
        }, { merge: true });
        return true;
      });
    },

    async finishRun(runId, result: RunResult, done) {
      await runs.doc(runId).set({
        result: { ...result, errors: result.errors.slice(0, 20) },
        leaseUntil: FieldValue.delete(),
        ...(done
          ? { status: 'done', finishedAt: FieldValue.serverTimestamp(), lastError: FieldValue.delete() }
          : { lastError: result.errors[0] || 'retry' }),
      }, { merge: true });
    },

    async liveLine(line): Promise<LiveLine> {
      const ids = line.rowIds.concat(line.deductRowIds);
      const snaps = ids.length ? await db.getAll(...refs(ids)) : [];
      const row = (s: (typeof snaps)[number]) => ({ id: s.id, cents: Number(s.get('cents')) || 0 });
      const pay = snaps.slice(0, line.rowIds.length).filter((s) => isLivePay(s.data()) && s.get('sharerUid') === line.sharerUid);
      const deduct = snaps.slice(line.rowIds.length).filter((s) => isLiveDeduct(s.data()) && s.get('sharerUid') === line.sharerUid);
      return { pay: pay.map(row), deduct: deduct.map(row) };
    },

    async recipient(uid, refresh) {
      const r = recipientFrom(uid, (await recipients.doc(uid).get()).data());
      return r && refresh && client && r.preference === 'cash' ? refreshRecipient(r, client) : r;
    },

    async payout(id) {
      const snap = await payouts.doc(id).get();
      return snap.exists ? payoutFrom(id, snap.data() || {}) : null;
    },

    async beginPayout(p) {
      const ref = payouts.doc(p.id);
      try {
        await ref.create({ ...p, error: null, createdAt: FieldValue.serverTimestamp() });
        console.log(`[payouts] begin ${p.id} ${p.method} cents=${p.cents} months=${p.months} rows=${p.rowIds.length} deduct=${p.deductRowIds.length}`);
        return p;
      } catch (e) {
        if ((e as { code?: number }).code !== ALREADY_EXISTS) throw e;
        return payoutFrom(p.id, (await ref.get()).data() || {});
      }
    },

    async finishCash(p, sent, nowMs) {
      const ref = payouts.doc(p.id);
      const paidAt = Timestamp.fromMillis(nowMs);
      await db.runTransaction(async (tx) => {
        const [cur, rows, deducts] = await Promise.all([
          tx.get(ref),
          p.rowIds.length ? tx.getAll(...refs(p.rowIds)) : Promise.resolve([]),
          p.deductRowIds.length ? tx.getAll(...refs(p.deductRowIds)) : Promise.resolve([]),
        ]);
        const c = cur.data() || {};
        tx.set(ref, {
          status: c.status === 'posted' ? 'posted' : 'sent', stripeId: sent.stripeId, stripeStatus: sent.stripeStatus,
          ...(c.paidAt ? {} : { paidAt }),
        }, { merge: true });
        for (const r of rows) {
          if (isLivePay(r.data())) tx.update(r.ref, { status: 'paid', paidAt, payoutId: p.id });
          // Refunded while the payout was in flight: the money still went, so the next run nets it.
          else if (r.get('status') === 'reversed' && !r.get('paidAt')) tx.update(r.ref, { paidAt, payoutId: p.id, reversedFrom: 'paid' });
        }
        for (const d of deducts) {
          if (isLiveDeduct(d.data())) tx.update(d.ref, { deductedInRun: p.runId });
        }
      });
      console.log(`[payouts] sent ${p.id} ${sent.stripeId} ${sent.stripeStatus} cents=${p.cents}`);
    },

    async failPayout(p, error) {
      await payouts.doc(p.id).set({ status: 'failed', error, failedAt: FieldValue.serverTimestamp() }, { merge: true });
      console.warn(`[payouts] failed ${p.id}: ${error}`);
    },

    async grantMonths(p, nowMs) {
      const ref = payouts.doc(p.id);
      const userRef = db.collection('users').doc(p.sharerUid);
      const paidAt = Timestamp.fromMillis(nowMs);
      const months = await db.runTransaction(async (tx) => {
        const [cur, user, rows, deducts] = await Promise.all([
          tx.get(ref), tx.get(userRef),
          p.rowIds.length ? tx.getAll(...refs(p.rowIds)) : Promise.resolve([]),
          p.deductRowIds.length ? tx.getAll(...refs(p.deductRowIds)) : Promise.resolve([]),
        ]);
        if (cur.get('status') !== 'granting') return null;
        if (!user.exists) throw Object.assign(new Error('the sharer has no account'), { permanent: true });
        const pay = rows.filter((r) => isLivePay(r.data()));
        const live = monthsFrom({
          pay: pay.map((r) => ({ id: r.id, cents: 0 })),
          deduct: deducts.filter((d) => isLiveDeduct(d.data())).map((d) => ({ id: d.id, cents: 0 })),
        });
        const n = Math.min(live.months, p.months);
        if (n > 0) {
          const d = user.data() || {};
          const manual = extendManualMs(manualMs(grantFields(d)), nowMs, PRO_MONTH_DAYS * n);
          tx.set(userRef, {
            proGrantManualExpiresAt: ts(manual),
            proGrantExpiresAt: ts(mergedMs(manual, toMs(d.webProExpiresAt))),
            proGrantNote: `friend rewards: ${n} month(s), ${p.id}`,
          }, { merge: true });
        }
        tx.set(ref, { status: 'granted', months: n, paidAt }, { merge: true });
        for (const r of pay) tx.update(r.ref, { status: 'paid', paidAt, payoutId: p.id });
        for (const d of live.deductUsed) tx.update(rewards.doc(d.id), { deductedInRun: p.runId });
        return n;
      });
      if (months != null) console.log(`[payouts] granted ${p.id} months=${months}`);
    },

    async sentPayouts() {
      const snap = await payouts.where('status', '==', 'sent').get();
      return snap.docs.map((x) => payoutFrom(x.id, x.data()));
    },

    async settle(p, state, stripeStatus) {
      const ref = payouts.doc(p.id);
      if (state === 'posted') {
        await ref.set({ status: 'posted', stripeStatus, settledAt: FieldValue.serverTimestamp() }, { merge: true });
        return;
      }
      await db.runTransaction(async (tx) => {
        const [rows, deducts] = await Promise.all([
          p.rowIds.length ? tx.getAll(...refs(p.rowIds)) : Promise.resolve([]),
          p.deductRowIds.length ? tx.getAll(...refs(p.deductRowIds)) : Promise.resolve([]),
        ]);
        tx.set(ref, { status: 'returned', stripeStatus, settledAt: FieldValue.serverTimestamp() }, { merge: true });
        const undo = { payoutId: FieldValue.delete(), paidAt: FieldValue.delete() };
        for (const r of rows) {
          if (r.get('payoutId') !== p.id) continue;
          if (r.get('status') === 'paid') tx.update(r.ref, { status: 'payable', ...undo });
          // Refunded after a payout that never arrived: a plain refund before payout after all.
          else if (r.get('status') === 'reversed' && !r.get('deductedInRun')) tx.update(r.ref, { reversedFrom: 'payable', ...undo });
        }
        for (const d of deducts) {
          if (d.get('deductedInRun') === p.runId) tx.update(d.ref, { deductedInRun: FieldValue.delete() });
        }
      });
      console.warn(`[payouts] returned ${p.id} ${stripeStatus}: rows back to payable`);
    },
  };
}
