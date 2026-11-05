import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';
import { FieldValue } from 'firebase-admin/firestore';
import {
  cancelLive, firstPaymentIntent, idOf, isDuplicateRefund, isPlan, proDb, reverseReward, rewardReferrer, stripe, syncCustomer,
  undoDuplicateCheckout,
} from '../../../lib/proServer';

// POST /api/pro/webhook: Stripe's events for the Step Gunner account (decision
// 0051). Verified by signature, so it reads the raw body. Every event re-syncs the
// customer from Stripe's current state (syncCustomer), so a redelivered or
// out-of-order event cannot leave a wrong grant; a 500 makes Stripe retry.
//
// The endpoint listens to: checkout.session.completed,
// checkout.session.async_payment_succeeded, customer.subscription.created,
// customer.subscription.updated, customer.subscription.deleted,
// customer.subscription.paused, customer.subscription.resumed, invoice.paid,
// invoice.payment_failed, charge.refunded, charge.dispute.created.

export const config = { api: { bodyParser: false } };

async function rawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

async function onCheckout(s: Stripe.Checkout.Session): Promise<void> {
  const customer = idOf(s.customer);
  if (!customer || s.metadata?.app !== 'stepgunner') return;
  const m = s.metadata || {};
  const uid = m.uid || s.client_reference_id || null;
  const subscriptionId = idOf(s.subscription);
  const paymentIntent = s.payment_status === 'paid' ? await firstPaymentIntent(s) : null;
  // The checkout guard ran when the session opened; the account may have started paying
  // since (another tab, or the App Store while Stripe's page was open). Ask again.
  const duplicate = uid ? await undoDuplicateCheckout(uid, customer, subscriptionId, paymentIntent) : null;
  await syncCustomer(customer, duplicate ? 'duplicate_checkout' : 'checkout');
  if (uid) await proDb().collection('users').doc(uid).set({ webPro: { openSessionId: FieldValue.delete() } }, { merge: true });
  await proDb().collection('webSales').doc(s.id).set({
    uid,
    plan: m.plan || null,
    code: m.code || null,
    codeKind: m.codeKind || null,
    origin: m.origin || 'web',
    amountTotal: s.amount_total ?? null,
    currency: s.currency || null,
    paymentStatus: s.payment_status,
    subscriptionId,
    duplicateOf: duplicate,
    livemode: s.livemode,
    at: FieldValue.serverTimestamp(),
  }, { merge: true });
  if (duplicate) return;
  // Only a real payment earns the sharer a reward (0057): a first bill a coupon took
  // to $0 ("no_payment_required") does not.
  if (m.codeKind === 'friend' && m.referrerUid && uid && s.payment_status === 'paid' && isPlan(m.plan)) {
    const out = await rewardReferrer({
      sharerUid: m.referrerUid, friendUid: uid, code: m.code || null, plan: m.plan,
      sessionId: s.id, subscriptionId, paymentIntent, paidCents: s.amount_total ?? null,
    });
    console.log(`[pro] friend reward: ${out} session=${s.id}`);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'not configured' });
  const st = stripe();
  let event: Stripe.Event;
  try {
    event = st.webhooks.constructEvent(await rawBody(req), req.headers['stripe-signature'] as string, secret);
  } catch (e) {
    console.warn('[pro] bad signature', (e as Error).message);
    return res.status(400).json({ error: 'bad signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await onCheckout(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed': {
        const c = idOf((event.data.object as Stripe.Subscription).customer);
        if (c) await syncCustomer(c, event.type);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const c = idOf((event.data.object as Stripe.Invoice).customer);
        if (c) await syncCustomer(c, event.type);
        break;
      }
      case 'charge.refunded': {
        // A full refund ends the plan now (decision 0051, item 8). A partial
        // refund is a goodwill credit and leaves the plan alone.
        const ch = event.data.object as Stripe.Charge;
        const c = idOf(ch.customer);
        if (c && ch.refunded && (await isDuplicateRefund(ch.id))) {
          // Our own refund of a duplicate checkout: that subscription is already canceled,
          // and the account's real plan and friend reward stand.
          await syncCustomer(c, 'duplicate_refund');
        } else if (c && ch.refunded) {
          const n = await cancelLive(c);
          console.log(`[pro] full refund: canceled ${n} subscription(s)`);
          const r = await syncCustomer(c, 'refund');
          if (r.uid) console.log(`[pro] friend reward after refund: ${await reverseReward(r.uid, 'refund', idOf(ch.payment_intent))}`);
        }
        break;
      }
      case 'charge.dispute.created': {
        const d = event.data.object as Stripe.Dispute;
        const chargeId = idOf(d.charge);
        if (chargeId) {
          const ch = await st.charges.retrieve(chargeId);
          const c = idOf(ch.customer);
          if (c) {
            await cancelLive(c);
            const r = await syncCustomer(c, 'dispute');
            if (r.uid) console.log(`[pro] friend reward after dispute: ${await reverseReward(r.uid, 'dispute', idOf(ch.payment_intent))}`);
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error(`[pro] ${event.type} ${event.id} failed`, e);
    return res.status(500).json({ error: 'processing failed' });
  }
  return res.status(200).json({ received: true });
}
