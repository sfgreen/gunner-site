import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, sendError, statusFor } from '../../../lib/proServer';

// GET /api/pro/status: is this account Pro, and through what (decision 0051).
// Also the account check the page shows after sign-in (answers, streak).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const { status } = await statusFor(me.uid);
    return res.status(200).json({ ok: true, status });
  } catch (e) {
    return sendError(res, e);
  }
}
