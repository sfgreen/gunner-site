import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, sendError } from '../../../lib/proServer';
import { earningsFor, ipCountry } from '../../../lib/referralServer';

// GET /api/earnings[?refresh=1]: the signed-in sharer's friend rewards, totals and
// payout setup (decision 0057 amendment, S2 to S6). refresh=1 (back from Stripe's
// form) asks Stripe where the payout setup stands.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const view = await earningsFor(me.uid, ipCountry(req), req.query.refresh === '1');
    return res.status(200).json({ ok: true, ...view });
  } catch (e) {
    return sendError(res, e);
  }
}
