import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';
import { checkoutReturn } from '../../../lib/proGrant';
import {
  ORIGIN, ProError, caller, codeRefusal, isPlan, priceFor, proDb, resolveCode, sendError, statusFor, stripe, syncCustomer,
  type CodeOk,
} from '../../../lib/proServer';

// POST /api/pro/checkout {plan, code?, origin?} -> {url, id}: a Stripe Checkout session
// for this account (decision 0051). Refuses an account that already pays, so no one
// is billed twice. The webhook, not this route, turns Pro on.
//
// origin "app" (decision 0057 amendment, F2): the app calls this with its own Firebase
// ID token and opens the url in Safari. Stripe shows its app-to-web page
// (origin_context mobile_app) and returns to stepgunner.com/pro/done, a universal link
// that reopens the app. Anything else is the web page (/pro).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const plan = req.body?.plan;
    if (!isPlan(plan)) throw new ProError(400, 'plan', 'Pick a plan.');
    const origin = req.body?.origin === 'app' ? 'app' : 'web';
    const { status, doc } = await statusFor(me.uid);
    if (status.source === 'app_store') {
      throw new ProError(409, 'app_store', 'This account already has Pro through the App Store.');
    }
    if (status.source === 'web') {
      throw new ProError(409, 'web', 'This account already has Pro. Use Manage plan to change it.');
    }

    const meta: Record<string, string> = { app: 'stepgunner', uid: me.uid, plan, origin };
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (typeof req.body?.code === 'string' && req.body.code.trim()) {
      const res0 = await resolveCode(req.body.code, plan, { uid: me.uid, doc });
      const refusal = codeRefusal(res0);
      if (refusal != null) throw new ProError(400, 'code', refusal);
      const r = res0 as CodeOk;
      discounts = [{ coupon: r.coupon }];
      meta.code = r.code;
      meta.codeKind = r.kind;
      if (r.referrerUid) meta.referrerUid = r.referrerUid;
    }

    const st = stripe();
    // One open checkout per account (review M7): a session left open in another tab or
    // in Safari could otherwise be paid after this one.
    const previous = typeof doc.webPro?.openSessionId === 'string' ? doc.webPro.openSessionId : null;
    if (previous) {
      try {
        const old = await st.checkout.sessions.retrieve(previous);
        if (old.status === 'open') await st.checkout.sessions.expire(previous);
      } catch (e) {
        console.warn(`[pro] could not expire session ${previous}: ${(e as Error).message}`);
      }
    }
    let customer: string | undefined = doc.webPro?.customerId || undefined;
    if (customer) {
      // Paid a moment ago and the webhook has not landed yet: ask Stripe, not the doc.
      const live = await st.subscriptions.list({ customer, status: 'all', limit: 20 });
      if (live.data.some((x) => ['active', 'trialing', 'past_due'].includes(x.status))) {
        await syncCustomer(customer, 'checkout_guard');
        throw new ProError(409, 'web', 'This account already has Pro. Use Manage plan to change it.');
      }
    } else {
      const c = await st.customers.create({
        email: me.email || undefined,
        metadata: { uid: me.uid, app: 'stepgunner' },
      });
      customer = c.id;
      await proDb().collection('users').doc(me.uid).set({ webPro: { customerId: customer } }, { merge: true });
    }

    // Managed Payments (decision 0051): Stripe is the merchant of record and owns tax,
    // so the session sends managed_payments and never automatic_tax or customer_update.
    const managed = process.env.STRIPE_MANAGED === '1';
    const tax = !managed && process.env.STRIPE_TAX === '1';
    const session = await st.checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: me.uid,
      line_items: [{ price: priceFor(plan), quantity: 1 }],
      discounts,
      metadata: meta,
      subscription_data: { metadata: meta },
      managed_payments: managed ? { enabled: true } : undefined,
      automatic_tax: tax ? { enabled: true } : undefined,
      customer_update: tax ? { address: 'auto', name: 'auto' } : undefined,
      ...checkoutReturn(origin, ORIGIN),
    });
    if (!session.url) throw new ProError(502, 'stripe', 'Checkout did not open. Try again.');
    await proDb().collection('users').doc(me.uid).set({ webPro: { openSessionId: session.id } }, { merge: true });
    console.log(`[pro] checkout ${origin} uid=${me.uid.slice(0, 6)} plan=${plan} code=${meta.codeKind || 'none'} session=${session.id}`);
    return res.status(200).json({ ok: true, url: session.url, id: session.id });
  } catch (e) {
    return sendError(res, e);
  }
}
