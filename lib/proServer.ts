// ---- Firestore schema: friend codes, payouts, handoffs (decisions 0051, 0057 + its
// 2026-11-04 amendment), agreed with the backend (functions/main.py, the referral
// section). Everything here is server-write-only; a signed-in sharer may read their own
// referralRewards rows and payoutRecipients doc. Money is integer US cents, times are
// Timestamps.
//
// Who writes what:
//   site     referralRewards rows for web purchases and their refunds (the Stripe
//            webhook), payoutRecipients, referralPayouts, and a run's execution
//            (approved -> running -> done, rows paid, deductions netted)
//   backend  App Store rows and refunds, the daily pending -> payable flip under the
//            yearly cap and the monthly budget, the monthly run (lines + approval), emails
//
// referralRewards/{friendUid}: one row per friend, ever (0057 item 10)
//   sharerUid, friendUid, code, rail ('web' | 'appstore'), plan ('yearly' | 'monthly'),
//   firstPaidAt, firstPaidCents, txnRef (web: Stripe subscription id; App Store:
//   originalTransactionId), cents (centsYearly or centsMonthly at full amount; the
//   backend applies the yearly cap when it writes a run, by calendar year of payout),
//   payableAt (firstPaidAt + holdDays; the flip resets it to the time it turned
//   payable), reason, at. Web rows add sessionId, firstPaymentIntent (what a refund is
//   matched against) and cardFingerprint (the first payment's card); App Store rows add
//   firstTransactionId, currency, productId, offerType, offerIdentifier, environment.
//   status:
//     pending    in the hold (reason 'monthly_budget' when the budget pushed it a month)
//     payable    the backend's daily job flipped it; the next run lists it
//     paid       payoutId, paidAt
//     reversed   the first payment was refunded or disputed: reason ('refund' | 'dispute'
//                | 'revoke'), reversedAt, reversedFrom (the status it had). reversedFrom
//                'paid' keeps paidAt; a later run nets it and stamps deductedInRun
//     skipped    never qualified, cents 0: reason 'shared_card' (that card already paid
//                for another friend's row, or the sharer pays with it), 'sandbox',
//                'self', 'paid_before', 'other_offer', ...
//     forfeited  cents 0 or never paid: reason 'year_cap' (the yearly cap left
//                nothing, by the year of the friend's first payment) or 'sharer_deleted'
//
// referralPayoutRuns/{YYYY-MM}: written by the backend on the 1st, executed here
//   month, asOf, status (awaiting_approval | approved | running | done), approvedBy,
//   approvedAt, createdAt, minPayoutCents, cashEnabled,
//   lines[]: {sharerUid, method ('stripe_global_payouts' | 'pro_months'), rowIds,
//     deductRowIds, payableCents, deductCents, cents, months (Pro months),
//     stripeRecipientId and country (cash)}
//   waiting[]: the same with a reason, not paid this run
//   totals {lines, cashLines, cashCents, proMonthLines, proMonths, deductCents, rows,
//     waitingLines, waitingCents}
//   the site adds startedAt, leaseUntil, finishedAt, lastError,
//   result {sharers, rows, cashCents, proMonths, skipped {reason: n}, failed, errors}, and
//   alerts[] {kind 'payout_returned', payoutId, sharerUid, cents, stripeStatus, at} when a
//   payout bounces, even after the run is done
//
// referralPayouts/{runId}_{sharerUid}: one per executed line (the site writes these)
//   sharerUid, runId, method, cents (cash sent: rows less deductions; 0 for Pro
//   months), grossCents, deductCents, months, rowIds, deductRowIds, recipientId,
//   payoutMethodId, destination ('Chase ••6789'), stripeId (PayoutIntent poi_...),
//   stripeStatus, error, createdAt, paidAt, postedAt, settledAt
//   status:
//     sending | granting   written before the money or the grant moves, so a crash resumes
//     sent                 Stripe accepted it (rows paid); posted: the money left our account.
//                          Both are re-checked daily until 60 days after posting
//     failed               Stripe refused it; the rows stay payable for a later run
//     returned             it bounced, before or after posting; rows back to payable,
//                          deductions owed again, alert on the run
//     granted              Pro months added to proGrantManualExpiresAt
//
// payoutRecipients/{uid}
//   stripeRecipientId (v2 Account acct_...), onboardingStatus (pending | complete |
//   restricted), country (ISO 3166 alpha-2), preference (cash | pro_months), updatedAt;
//   the site also keeps capability (the ACH status), payoutMethodId, destination
//
// config/referral
//   cashEnabled, autoPayout, holdDays, minPayoutCents, yearCapCents, monthlyBudgetCents,
//   cashCountries, centsYearly, centsMonthly; defaults in lib/referral.ts REFERRAL_DEFAULTS
//   (the same as functions/main.py REFERRAL_CONFIG_DEFAULTS)
//
// referralCodes/{CODE}: written by the backend (server-claimed, unique), uid = the owner.
//   The only way the site resolves a friend code (CODE is the stored FIRSTWORD-XXXX form);
//   a code without a doc is not found.
//
// users/{uid}.webPro.openSessionId: the account's open Checkout session; a new checkout
//   expires it, a completed one clears it.
//
// authHandoffs/{sha256 of the code}: uid, to ('earnings' | 'pro'), createdAt, expiresAt
//   (2 minutes); deleted when used. The code travels as /earnings#h=CODE (lib/handoff.ts).

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp, type DocumentData, type Firestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import type { NextApiRequest } from 'next';
import {
  appStoreActive, chiefCodeForm, couponLabel, DUPLICATE_REFUND_TAG, duplicateReason, liveSub, manualMs, mergedMs,
  normalizeCode, studentCodeForm, webExpiresMs, type GrantFields, type Plan, type SubLite,
} from './proGrant';
import {
  holdMs, paymentTakenBack, referralConfig, reversalFields, rewardCents, sharedCardReason, type ReferralConfig,
} from './referral';
import { HANDOFF_TTL_MS, handoffKey, handoffRefusal, newHandoffCode, type HandoffPage } from './handoff';

// Pro on the web (gunner repo, decision 0051), server half. Imported only by API
// routes and crons, never by a component, so firebase-admin and the Stripe key stay
// out of the browser bundle.
//
// Env (Vercel): FIREBASE_SERVICE_ACCOUNT_KEY (already set for /api/readiness),
// STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_YEARLY,
// STRIPE_PRICE_MONTHLY, STRIPE_COUPON_FRIEND_YEARLY, STRIPE_COUPON_FRIEND_MONTHLY,
// STRIPE_COUPON_CHIEF, STRIPE_PORTAL_CONFIG, STRIPE_MANAGED (1 = Managed Payments).
// scripts/stripe_setup.mjs makes the Stripe side and sets them.
// Sharer payouts (lib/referralServer.ts): PAYOUTS_PROVIDER=global_payouts turns them on;
// STRIPE_PAYOUTS_KEY (live needs a restricted key, Global Payouts refuses sk_live; the
// test key works in a sandbox), STRIPE_FINANCIAL_ACCOUNT (optional, else the first open
// one), PAYOUTS_DRY_RUN=1 (plan only), CRON_SECRET (the payout cron).

if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      projectId: 'stepgunner-79ae7',
    });
  } catch (err) {
    console.error('pro: firebase admin init failed', err);
  }
}

export class ProError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function proDb(): Firestore {
  if (!getApps().length) throw new ProError(503, 'not_configured', 'The server is not set up yet.');
  return getFirestore();
}

let stripeSingleton: Stripe | null = null;
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new ProError(503, 'not_configured', 'Payments are not set up yet.');
  if (!stripeSingleton) stripeSingleton = new Stripe(key);
  return stripeSingleton;
}

export function priceFor(plan: Plan): string {
  const id = plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY;
  if (!id) throw new ProError(503, 'not_configured', 'Payments are not set up yet.');
  return id;
}

function planOfPrice(priceId: string | undefined): Plan | null {
  if (priceId && priceId === process.env.STRIPE_PRICE_YEARLY) return 'yearly';
  if (priceId && priceId === process.env.STRIPE_PRICE_MONTHLY) return 'monthly';
  return null;
}

export function isPlan(v: unknown): v is Plan {
  return v === 'yearly' || v === 'monthly';
}

// ---- who is calling ----

export type Caller = { uid: string; email: string | null; provider: string };

/** The Firebase ID token in `Authorization: Bearer`. Anonymous accounts are refused:
 *  their progress lives on a phone the web cannot reach (decision 0051, item 1). */
export async function caller(req: NextApiRequest): Promise<Caller> {
  proDb();
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) throw new ProError(401, 'signed_out', 'Sign in first.');
  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(token);
  } catch {
    throw new ProError(401, 'signed_out', 'Your sign-in expired. Sign in again.');
  }
  const provider = String(decoded.firebase?.sign_in_provider || '');
  if (provider === 'anonymous') {
    throw new ProError(403, 'anonymous', 'Add a sign-in in the app first (Settings, Account).');
  }
  return { uid: decoded.uid, email: decoded.email || null, provider };
}

/** A one-time code for this account (lib/handoff.ts). The caller is already a named account. */
export async function mintHandoff(uid: string, to: HandoffPage): Promise<{ code: string; expiresAtMs: number }> {
  const code = newHandoffCode();
  const expiresAtMs = Date.now() + HANDOFF_TTL_MS;
  await proDb().collection('authHandoffs').doc(handoffKey(code)).create({
    uid, to, createdAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(expiresAtMs),
  });
  return { code, expiresAtMs };
}

/** Trade a handoff code for a custom token, once. The code is deleted whether or not it was still good. */
export async function redeemHandoff(code: string): Promise<{ uid: string; token: string }> {
  const db = proDb();
  const ref = db.collection('authHandoffs').doc(handoffKey(code));
  const out = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.data();
    const why = handoffRefusal(d ? { uid: d.uid, expiresAtMs: toMs(d.expiresAt) } : null, Date.now());
    if (snap.exists) tx.delete(ref);
    return why ? { why } : { uid: String(d.uid) };
  });
  if ('why' in out) throw new ProError(410, out.why, 'That link has expired. Open it from the app again.');
  try {
    await getAuth().getUser(out.uid);
  } catch (e) {
    // createCustomToken would mint a sign-in for a uid that no longer exists, and the
    // web sign-in would create a blank account under it.
    if ((e as { code?: string }).code === 'auth/user-not-found') throw new ProError(410, 'no_account', 'That account no longer exists.');
    throw e;
  }
  return { uid: out.uid, token: await getAuth().createCustomToken(out.uid) };
}

// ---- reading a users doc ----

export function toMs(v: unknown): number | null {
  if (v == null) return null;
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === 'object' && typeof (v as { toMillis?: unknown }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number' && Number.isFinite(v)) return v < 1e12 ? v * 1000 : v;
  return null;
}

export function grantFields(d: DocumentData): GrantFields {
  return {
    hasManualField: 'proGrantManualExpiresAt' in d,
    manualMs: toMs(d.proGrantManualExpiresAt),
    hasWebField: 'webProExpiresAt' in d,
    grantMs: toMs(d.proGrantExpiresAt),
  };
}

export function payingOnAppStore(d: DocumentData, nowMs = Date.now()): boolean {
  return appStoreActive(d.iapStatus, d.iapEnvironment, toMs(d.iapExpiration), nowMs);
}

/**
 * Never paid anywhere: no App Store event ever, no web subscription ever. The
 * users doc alone cannot say: the app writes iapStatus "none" for free students
 * and clears iapOriginalTransactionId when a plan lapses. The App Store webhook's
 * iapEvents rows carry the uid and outlive the lapse.
 */
export async function neverPaid(uid: string, d: DocumentData): Promise<boolean> {
  if (d.iapStatus === 'active' || d.iapOriginalTransactionId || (d.webPro && d.webPro.subscriptionId)) return false;
  const ev = await proDb().collection('iapEvents').where('uid', '==', uid).limit(10).get();
  return !ev.docs.some((e) => (e.data() || {}).environment !== 'Sandbox');
}

export const ts = (ms: number | null) => (ms == null ? null : Timestamp.fromMillis(ms));

// ---- Stripe -> users/{uid} ----

function subLite(s: Stripe.Subscription): SubLite {
  const items = s.items?.data || [];
  const end = items.reduce((m, it) => Math.max(m, it.current_period_end || 0), 0);
  return {
    id: s.id,
    status: s.status,
    periodEndMs: end * 1000,
    cancelAtPeriodEnd: !!s.cancel_at_period_end,
    plan: planOfPrice(items[0]?.price?.id) || (isPlan(s.metadata?.plan) ? s.metadata.plan : null),
  };
}

export type SyncResult = { uid: string | null; webMs: number | null; grantMs: number | null; note: string };

/**
 * Re-read a customer's subscriptions from Stripe and write the grant. Every
 * webhook and the daily reconcile call this, so it is idempotent and order-proof:
 * it never trusts the event payload, only Stripe's current state.
 */
export async function syncCustomer(customerId: string, reason: string): Promise<SyncResult> {
  const st = stripe();
  const db = proDb();
  const cust = await st.customers.retrieve(customerId);
  if ((cust as Stripe.DeletedCustomer).deleted) return { uid: null, webMs: null, grantMs: null, note: 'customer deleted' };
  const uid = (cust as Stripe.Customer).metadata?.uid;
  if (!uid) return { uid: null, webMs: null, grantMs: null, note: 'customer has no uid' };

  const list = await st.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  const subs = list.data.map(subLite);

  // A deleted account keeps no subscription (the web side of BUGLOG 063).
  let authGone = false;
  try {
    await getAuth().getUser(uid);
  } catch (e) {
    authGone = (e as { code?: string }).code === 'auth/user-not-found';
  }
  if (authGone) {
    for (const s of subs.filter((x) => ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete'].includes(x.status))) {
      await st.subscriptions.cancel(s.id);
    }
    return { uid, webMs: null, grantMs: null, note: 'account deleted: subscriptions canceled' };
  }

  const web = webExpiresMs(subs);
  const live = liveSub(subs);
  const latest = live || subs.slice().sort((a, b) => b.periodEndMs - a.periodEndMs)[0] || null;
  const ref = db.collection('users').doc(uid);
  let grant: number | null = null;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.data() || {};
    const manual = manualMs(grantFields(d));
    grant = mergedMs(manual, web);
    tx.set(ref, {
      webPro: {
        status: latest ? latest.status : 'none',
        plan: latest?.plan || null,
        periodEndAt: latest ? ts(latest.periodEndMs) : null,
        cancelAtPeriodEnd: latest ? latest.cancelAtPeriodEnd : false,
        customerId,
        subscriptionId: latest?.id || null,
        updatedAt: FieldValue.serverTimestamp(),
        reason,
      },
      webProExpiresAt: ts(web),
      proGrantManualExpiresAt: ts(manual),
      proGrantExpiresAt: grant == null ? FieldValue.delete() : ts(grant),
    }, { merge: true });
  });
  console.log(`[pro] sync ${reason} uid=${uid.slice(0, 6)} web=${web} grant=${grant}`);
  return { uid, webMs: web, grantMs: grant, note: 'ok' };
}

/** The card fingerprint a subscription pays with, or null. */
async function subscriptionCard(subscriptionId: string | null): Promise<string | null> {
  if (!subscriptionId) return null;
  try {
    const s = await stripe().subscriptions.retrieve(subscriptionId, { expand: ['default_payment_method'] });
    const pm = s.default_payment_method;
    return pm && typeof pm === 'object' ? pm.card?.fingerprint || null : null;
  } catch (e) {
    console.warn('[pro] subscription card lookup failed', (e as Error).message);
    return null;
  }
}

/** Every card fingerprint on a customer: saved cards and the cards of its past charges. */
async function customerFingerprints(customerId: string | null | undefined): Promise<Set<string>> {
  if (!customerId) return new Set();
  const st = stripe();
  const [pms, charges] = await Promise.all([
    st.customers.listPaymentMethods(customerId, { type: 'card', limit: 20 }),
    st.charges.list({ customer: customerId, limit: 100 }),
  ]);
  return new Set([
    ...pms.data.map((p) => p.card?.fingerprint),
    ...charges.data.map((c) => c.payment_method_details?.card?.fingerprint),
  ].filter((f): f is string => !!f));
}

export type ChargeFacts = { fingerprint: string | null; refunded: boolean; disputed: boolean };

/** What a payment's charge says now, or null when Stripe no longer has it (a customer's
 *  data deletion request removes it). */
export async function chargeOfPayment(paymentIntent: string): Promise<ChargeFacts | null> {
  try {
    const pi = await stripe().paymentIntents.retrieve(paymentIntent, { expand: ['latest_charge'] });
    const ch = pi.latest_charge;
    if (!ch || typeof ch === 'string') return null;
    return { fingerprint: ch.payment_method_details?.card?.fingerprint || null, refunded: !!ch.refunded, disputed: !!ch.disputed };
  } catch (e) {
    if ((e as { statusCode?: number }).statusCode === 404) return null;
    throw e;
  }
}

/** The PaymentIntent of a Checkout Session's first invoice, so a refund can be matched to it. */
export async function firstPaymentIntent(s: Stripe.Checkout.Session): Promise<string | null> {
  const inv = idOf(s.invoice as string | { id: string } | null);
  if (!inv) return null;
  try {
    const i = await stripe().invoices.retrieve(inv, { expand: ['payments'] });
    const pay = i.payments?.data?.[0]?.payment;
    return idOf((pay?.payment_intent as string | { id: string } | undefined) || null);
  } catch (e) {
    console.warn('[pro] first payment lookup failed', (e as Error).message);
    return null;
  }
}

export async function referralConfigFor(): Promise<ReferralConfig> {
  return referralConfig((await proDb().collection('config').doc('referral').get()).data());
}

/**
 * A friend code's reward (decision 0057): a row in referralRewards/{friendUid}, one per
 * friend, ever, at full amount (centsYearly or centsMonthly, $15 / $5; the backend
 * applies the yearly cap when it writes a payout run), payable holdDays (30) after this
 * first payment. This never moves money: an approved run pays it (lib/referral.ts).
 * The row keeps the first payment's card fingerprint; a card already behind another
 * friend's row, or one the sharer pays with, earns nothing (skipped, shared_card).
 */
export async function rewardReferrer(r: {
  sharerUid: string; friendUid: string; code: string | null; plan: Plan;
  sessionId: string; subscriptionId: string | null; paymentIntent: string | null; paidCents: number | null;
}): Promise<string> {
  const db = proDb();
  const mark = db.collection('referralRewards').doc(r.friendUid);
  const [m0, u0, cfg] = await Promise.all([mark.get(), db.collection('users').doc(r.sharerUid).get(), referralConfigFor()]);
  if (m0.exists) return `already ${m0.data()?.status}`;
  if (!u0.exists) return 'sharer has no account';
  const d = u0.data() || {};
  const now = Date.now();
  const charge = r.paymentIntent ? await chargeOfPayment(r.paymentIntent) : null;
  const fingerprint = charge?.fingerprint || (await subscriptionCard(r.subscriptionId));
  const [others, sharerCards] = await Promise.all([
    fingerprint ? db.collection('referralRewards').where('cardFingerprint', '==', fingerprint).limit(3).get() : Promise.resolve(null),
    customerFingerprints(d.webPro?.customerId),
  ]);
  const base = {
    sharerUid: r.sharerUid, friendUid: r.friendUid, code: r.code, rail: 'web', plan: r.plan,
    sessionId: r.sessionId, txnRef: r.subscriptionId, firstPaymentIntent: r.paymentIntent,
    firstPaidCents: r.paidCents, firstPaidAt: Timestamp.fromMillis(now), cardFingerprint: fingerprint || null,
    payableAt: Timestamp.fromMillis(now + holdMs(cfg)), at: FieldValue.serverTimestamp(),
  };
  const shared = sharedCardReason(fingerprint, !!others && others.docs.some((x) => x.id !== r.friendUid), sharerCards);
  const takenBack = paymentTakenBack(charge);
  const cents = rewardCents(r.plan, cfg);
  let row: Record<string, unknown>;
  if (shared) row = { status: 'skipped', reason: shared, cents: 0 };
  // Refunded or disputed before this webhook ran: the refund event found no row to reverse.
  else if (takenBack) row = { status: 'reversed', reversedFrom: 'pending', reason: takenBack, reversedAt: FieldValue.serverTimestamp(), cents };
  else row = { status: 'pending', cents };
  try {
    await mark.create({ ...base, ...row });
  } catch (e) {
    if ((e as { code?: number }).code === 6) return 'already handled'; // ALREADY_EXISTS: a parallel delivery won
    throw e;
  }
  return `${row.status}${row.reason ? ` (${row.reason})` : ''} ${cents}`;
}

/** A refund or dispute of the friend's first payment takes the reward back (0057).
 *  A row already paid keeps its paidAt; the next payout run nets it. */
export async function reverseReward(friendUid: string, why: 'refund' | 'dispute', paymentIntent: string | null): Promise<string> {
  const mark = proDb().collection('referralRewards').doc(friendUid);
  const r = (await mark.get()).data();
  if (!r) return 'no reward';
  const fields = reversalFields({ status: String(r.status || ''), firstPaymentIntent: r.firstPaymentIntent || null }, paymentIntent);
  if (!fields) return `kept (${r.status}; not the first payment or nothing to take back)`;
  await mark.set({ ...fields, reason: why, reversedAt: FieldValue.serverTimestamp() }, { merge: true });
  return `reversed from ${fields.reversedFrom}`;
}

// ---- codes ----

export type CodeOk = { ok: true; kind: 'friend' | 'chief'; code: string; coupon: string; label: string; referrerUid?: string };
export type CodeResult = CodeOk | { ok: false; reason: string };

/** The refusal text, or null when the code works (the site builds with strict off,
 *  which does not narrow a boolean discriminant). */
export function codeRefusal(r: CodeResult): string | null {
  return r.ok ? null : (r as { reason: string }).reason;
}

/**
 * A Chief code (chiefs/{code}, decision 0041) or a student's code. A student code's
 * owner comes only from the server-claimed index referralCodes/{CODE} (uid), never
 * from users.referralCode, which a client can set to anyone's code (review B1). A code
 * the index does not hold yet is not found. Codes match with or without the hyphen:
 * the index key is the stored form, FIRSTWORD-XXXX.
 */
export async function resolveCode(raw: unknown, plan: Plan, me: { uid: string; doc: DocumentData }): Promise<CodeResult> {
  const code = normalizeCode(raw);
  if (!code) return { ok: false, reason: "That isn't a code." };
  const db = proDb();
  if (!(await neverPaid(me.uid, me.doc))) return { ok: false, reason: 'Codes are for a first subscription.' };

  const student = studentCodeForm(code);
  const claim = await db.collection('referralCodes').doc(student).get();
  const ownerUid = typeof claim.get('uid') === 'string' && claim.get('uid') ? String(claim.get('uid')) : null;
  if (ownerUid === me.uid) return { ok: false, reason: "That's your own code. Share it with a friend." };

  const chiefId = chiefCodeForm(code);
  const chief = await db.collection('chiefs').doc(chiefId).get();
  if (chief.exists) {
    const c = chief.data() || {};
    if (c.status !== 'active') return { ok: false, reason: 'That code is no longer active.' };
    if (plan === 'yearly') {
      const coupon = process.env.STRIPE_COUPON_CHIEF;
      if (!coupon) return { ok: false, reason: 'Codes are not set up yet.' };
      return { ok: true, kind: 'chief', code: chiefId, coupon, label: await labelOf(coupon, plan) };
    }
    // A Chief promoted from a student (scripts/chief_add.py --promote) keeps the
    // friend deal on monthly (0041 amendment); any other Chief code is yearly only.
    if (!c.fromReferralCode) return { ok: false, reason: 'A Chief code works on the yearly plan.' };
  }

  if (!ownerUid || !(await db.collection('users').doc(ownerUid).get()).exists) {
    return { ok: false, reason: "We couldn't find that code." };
  }
  const coupon = plan === 'yearly' ? process.env.STRIPE_COUPON_FRIEND_YEARLY : process.env.STRIPE_COUPON_FRIEND_MONTHLY;
  if (!coupon) return { ok: false, reason: 'Codes are not set up yet.' };
  return { ok: true, kind: 'friend', code: student, coupon, label: await labelOf(coupon, plan), referrerUid: ownerUid };
}

async function labelOf(couponId: string, plan: Plan): Promise<string> {
  try {
    const c = await stripe().coupons.retrieve(couponId);
    return couponLabel(c, plan) || 'Discount applied';
  } catch {
    return 'Discount applied';
  }
}

// ---- what the page shows ----

export type ProStatus = {
  source: 'app_store' | 'web' | 'grant' | 'none';
  plan: Plan | null;
  periodEndMs: number | null;
  cancelAtPeriodEnd: boolean;
  grantEndMs: number | null;
  answered: number | null;
  streak: number | null;
  /** A friend code this student saved in the app (redeem_referral), for the code box. */
  savedCode: string | null;
};

export async function statusFor(uid: string): Promise<{ status: ProStatus; doc: DocumentData }> {
  const db = proDb();
  const [u, stats] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('users').doc(uid).collection('stats').doc('current').get(),
  ]);
  const d = u.data() || {};
  const s = stats.data() || {};
  const now = Date.now();
  const web = d.webPro || {};
  const webMs = toMs(d.webProExpiresAt);
  const grantMs = toMs(d.proGrantExpiresAt);
  let source: ProStatus['source'] = 'none';
  if (payingOnAppStore(d, now)) source = 'app_store';
  else if (webMs && webMs > now) source = 'web';
  else if (grantMs && grantMs > now) source = 'grant';
  return {
    doc: d,
    status: {
      source,
      plan: isPlan(web.plan) ? web.plan : null,
      periodEndMs: toMs(web.periodEndAt),
      cancelAtPeriodEnd: !!web.cancelAtPeriodEnd,
      grantEndMs: grantMs,
      answered: typeof s.totalAnswered === 'number' ? s.totalAnswered : null,
      streak: typeof s.dayStreak === 'number' ? s.dayStreak : null,
      savedCode: typeof d.redeemedReferralCode === 'string' && d.redeemedReferralCode.trim() ? d.redeemedReferralCode.trim().toUpperCase() : null,
    },
  };
}

// ---- shared by the routes ----

export const ORIGIN = process.env.PRO_ORIGIN || 'https://stepgunner.com';

export function sendError(res: { status: (n: number) => { json: (b: unknown) => void } }, e: unknown): void {
  if (e instanceof ProError) {
    res.status(e.status).json({ ok: false, code: e.code, error: e.message });
    return;
  }
  console.error('[pro] unexpected', e);
  res.status(500).json({ ok: false, code: 'server', error: 'Something went wrong. Try again.' });
}

/**
 * A completed checkout for an account that already pays (App Store, or another live web
 * subscription): cancel the new subscription and refund its first payment in full, now.
 * Returns why, or null when the checkout stands. Idempotent: the refund is keyed by the
 * subscription, and a canceled subscription is not live.
 */
export async function undoDuplicateCheckout(uid: string, customerId: string, subscriptionId: string | null,
  paymentIntent: string | null): Promise<'app_store' | 'web' | null> {
  if (!subscriptionId) return null;
  const st = stripe();
  const [u, subs] = await Promise.all([
    proDb().collection('users').doc(uid).get(),
    st.subscriptions.list({ customer: customerId, status: 'all', limit: 20 }),
  ]);
  const others = subs.data.filter((x) => x.id !== subscriptionId && ['active', 'trialing', 'past_due'].includes(x.status));
  const why = duplicateReason(payingOnAppStore(u.data() || {}), others.length);
  if (!why) return null;
  const mine = subs.data.find((x) => x.id === subscriptionId);
  if (mine && !['canceled', 'incomplete_expired'].includes(mine.status)) await st.subscriptions.cancel(subscriptionId);
  if (paymentIntent) {
    await st.refunds.create(
      { payment_intent: paymentIntent, reason: 'duplicate', metadata: { gunner: DUPLICATE_REFUND_TAG, subscription: subscriptionId, uid } },
      { idempotencyKey: `gunner_dup_refund_${subscriptionId}` },
    );
  }
  console.warn(`[pro] duplicate checkout uid=${uid.slice(0, 6)} already ${why}: canceled ${subscriptionId}, refunded ${paymentIntent || 'nothing (no payment found)'}`);
  return why;
}

/** True when a refunded charge's refund is one the site made for a duplicate checkout. */
export async function isDuplicateRefund(chargeId: string): Promise<boolean> {
  const list = await stripe().refunds.list({ charge: chargeId, limit: 10 });
  return list.data.some((r) => r.metadata?.gunner === DUPLICATE_REFUND_TAG);
}

/** Cancel every live subscription a customer has, now (refunds and disputes). */
export async function cancelLive(customerId: string): Promise<number> {
  const st = stripe();
  const list = await st.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  let n = 0;
  for (const s of list.data) {
    if (['active', 'trialing', 'past_due', 'unpaid', 'paused'].includes(s.status)) {
      await st.subscriptions.cancel(s.id);
      n += 1;
    }
  }
  return n;
}

export function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === 'string' ? v : v.id;
}
