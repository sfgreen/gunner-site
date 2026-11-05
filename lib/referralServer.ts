import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, type DocumentData, type DocumentReference } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import type { NextApiRequest } from 'next';
import { ORIGIN, ProError, chargeOfPayment, grantFields, proDb, referralConfigFor, statusFor, stripe, toMs, ts } from './proServer';
import { extendManualMs, manualMs, mergedMs, PRO_MONTH_DAYS, type Plan } from './proGrant';
import {
  closeOrphans, earningsTotals, isCashCountry, monthsFrom, paymentTakenBack, SETTLE_WINDOW_MS, waitingOf,
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
      destination: s.destination, ...(s.country ? { country: s.country } : {}), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return {
      ...r, onboardingStatus: s.onboardingStatus, payoutMethodId: s.payoutMethodId, destination: s.destination,
      country: s.country || r.country,
    };
  } catch (e) {
    console.warn(`[payouts] recipient refresh uid=${r.uid.slice(0, 6)} failed: ${(e as Error).message}`);
    return r;
  }
}

// ---- /earnings ----

/** One friend as the sharer sees it: the same fields the app's my_referral_rewards
 *  callable returns. No friend uid, rail, purchase date, amount paid, transaction id or
 *  skip reason (review N3). */
export type EarningsRowView = {
  name: string;
  plan: Plan | null;
  status: string;
  cents: number;
  payableMs: number | null;
  paidMs: number | null;
  waiting: 'monthly_budget' | 'year_cap_hold' | null;
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

  const docs = rowsSnap.docs.map((x) => x.data()).sort((a, b) => (toMs(b.firstPaidAt) ?? 0) - (toMs(a.firstPaidAt) ?? 0));
  const friends = docs.length
    ? await db.getAll(...docs.map((d) => db.collection('users').doc(String(d.friendUid || '') || '_')))
    : [];
  const rows: EarningsRowView[] = docs.map((d, i) => ({
    name: friendName(friends[i]?.data()),
    plan: d.plan === 'yearly' || d.plan === 'monthly' ? d.plan : null,
    status: String(d.status || ''),
    cents: Math.max(0, Number(d.cents) || 0),
    payableMs: toMs(d.payableAt),
    paidMs: toMs(d.paidAt),
    waiting: waitingOf(d.reason),
  }));

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
  if (!where) throw new ProError(400, 'no_country', "We couldn't tell which country you're in. Open this page on your phone and try again.");
  if (!isCashCountry(where, cfg)) throw new ProError(403, 'not_cash_country', 'Cash payouts are for US bank accounts for now.');

  let id = rec?.stripeRecipientId || null;
  if (!id) {
    const [user, doc] = await Promise.all([getAuth().getUser(uid), db.collection('users').doc(uid).get()]);
    if (!user.email) throw new ProError(400, 'no_email', 'Your account has no email for Stripe to reach you. Write to support from the app.');
    id = await client.createRecipient({ uid, email: user.email, name: String(doc.data()?.displayName || user.email), country: where });
    await ref.set({
      stripeRecipientId: id, onboardingStatus: 'pending', country: where, preference: 'cash',
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

/**
 * Close every Step Gunner recipient whose account is gone (review m4, N5): a recipient
 * holds bank details, and delete_account removes only payoutRecipients/{uid}, so the list
 * comes from Stripe. Gone means both: no Firebase Auth user and no users doc. Errors are
 * logged per recipient and the rest still run.
 */
export async function closeOrphanRecipients(client: GlobalPayouts): Promise<{ closed: string[]; errors: string[] }> {
  const db = proDb();
  const out = await closeOrphans(
    await client.listRecipients(),
    async (uid) => {
      try {
        await getAuth().getUser(uid);
        return false;
      } catch (e) {
        if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
      }
      return !(await db.collection('users').doc(uid).get()).exists;
    },
    async (r) => {
      await client.closeRecipient(r.id);
      await db.collection('payoutRecipients').doc(r.uid).delete();
      console.log(`[payouts] closed recipient ${r.id}: account ${r.uid.slice(0, 6)} is deleted`);
    },
  );
  for (const e of out.errors) console.warn(`[payouts] closing a deleted account's recipient failed: ${e}`);
  return out;
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

    async liveLine(line, write): Promise<LiveLine> {
      const ids = line.rowIds.concat(line.deductRowIds);
      const snaps = ids.length ? await db.getAll(...refs(ids)) : [];
      const row = (x: (typeof snaps)[number]) => ({ id: x.id, cents: Number(x.get('cents')) || 0 });
      const pay = [];
      for (const x of snaps.slice(0, line.rowIds.length)) {
        if (!isLivePay(x.data()) || x.get('sharerUid') !== line.sharerUid) continue;
        // The safety net under the refund webhook (review M9): ask Stripe about the
        // friend's first payment before paying for it.
        const pi = x.get('rail') === 'web' ? x.get('firstPaymentIntent') : null;
        if (typeof pi === 'string' && pi) {
          const charge = await chargeOfPayment(pi);
          if (!charge) {
            console.warn(`[payouts] ${x.id}: Stripe no longer has ${pi}; the row waits`);
            continue;
          }
          const gone = paymentTakenBack(charge);
          if (gone) {
            if (write) {
              await db.runTransaction(async (tx) => {
                const cur = await tx.get(x.ref);
                if (isLivePay(cur.data())) {
                  tx.update(x.ref, { status: 'reversed', reversedFrom: 'payable', reason: gone, reversedAt: FieldValue.serverTimestamp() });
                }
              });
            }
            console.warn(`[payouts] ${x.id}: first payment ${gone === 'refund' ? 'refunded' : 'disputed'}, ${write ? 'reversed' : 'would reverse'}`);
            continue;
          }
        }
        pay.push(row(x));
      }
      const deduct = snaps.slice(line.rowIds.length).filter((x) => isLiveDeduct(x.data()) && x.get('sharerUid') === line.sharerUid);
      return { pay, deduct: deduct.map(row) };
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

    async openPayouts(nowMs) {
      const snap = await payouts.where('status', 'in', ['sent', 'posted']).get();
      return snap.docs
        .filter((x) => x.get('status') === 'sent' || (toMs(x.get('postedAt')) ?? 0) > nowMs - SETTLE_WINDOW_MS)
        .map((x) => payoutFrom(x.id, x.data()));
    },

    async settle(p, state, stripeStatus) {
      const ref = payouts.doc(p.id);
      if (state === 'posted') {
        await ref.set({ status: 'posted', stripeStatus, postedAt: FieldValue.serverTimestamp() }, { merge: true });
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
        // Danny sees it on the run in Admin; the backend's run email does not cover it.
        tx.set(runs.doc(p.runId), {
          alerts: FieldValue.arrayUnion({
            kind: 'payout_returned', payoutId: p.id, sharerUid: p.sharerUid, cents: p.cents, stripeStatus, at: Timestamp.now(),
          }),
        }, { merge: true });
      });
      console.warn(`[payouts] returned ${p.id} ${stripeStatus}: rows back to payable, alert on run ${p.runId}`);
    },
  };
}
