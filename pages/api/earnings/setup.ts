import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, sendError } from '../../../lib/proServer';
import { ipCountry, payoutSetupLink } from '../../../lib/referralServer';

// POST /api/earnings/setup -> {url}: Stripe's hosted payout form for this sharer (a
// single-use Account Link, 5 minutes), made on demand because it cannot be emailed
// or reused. 503 payouts_closed until PAYOUTS_PROVIDER and cashEnabled are on.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const url = await payoutSetupLink(me.uid, ipCountry(req));
    return res.status(200).json({ ok: true, url });
  } catch (e) {
    return sendError(res, e);
  }
}
