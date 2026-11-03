import type { NextApiRequest, NextApiResponse } from 'next';
import { ORIGIN, ProError, caller, sendError, statusFor, stripe } from '../../../lib/proServer';

// POST /api/pro/portal -> {url}: Stripe's customer portal for this account's web
// plan (cancel, change card, receipts). App Store plans are managed in iOS Settings.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const { doc } = await statusFor(me.uid);
    const customer = doc.webPro?.customerId;
    if (!customer) throw new ProError(404, 'no_plan', 'This account has no plan bought on the web.');
    const s = await stripe().billingPortal.sessions.create({
      customer,
      return_url: `${ORIGIN}/pro`,
      // Made by scripts/stripe_setup.mjs; a new account has no default portal.
      configuration: process.env.STRIPE_PORTAL_CONFIG || undefined,
    });
    return res.status(200).json({ ok: true, url: s.url });
  } catch (e) {
    return sendError(res, e);
  }
}
