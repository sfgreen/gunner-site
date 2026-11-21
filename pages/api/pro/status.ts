import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, countryOf, publicSale, saleCheck, sendError, statusFor } from '../../../lib/proServer';

// GET /api/pro/status: is this account Pro, and through what (decision 0051).
// Also the account check the page shows after sign-in (answers, streak), and the store
// sale this account can have now (gunner decision 0085 amendment 3); reading it is the
// student's first look, which starts their hold.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const { status, doc } = await statusFor(me.uid);
    const buying = status.source === 'none' || status.source === 'grant';
    const sale = buying ? (await saleCheck(me.uid, doc, countryOf(req), 'yearly', true)).sale : null;
    return res.status(200).json({ ok: true, status: { ...status, sale: publicSale(sale) } });
  } catch (e) {
    return sendError(res, e);
  }
}
