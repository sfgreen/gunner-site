import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, sendError } from '../../../lib/proServer';
import { ipCountry, setPreference } from '../../../lib/referralServer';

// POST /api/earnings/preference {preference: "cash" | "pro_months"}: how this sharer
// takes their rewards. Cash only where config/referral.cashCountries allows (0057 item 6).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const preference = await setPreference(me.uid, req.body?.preference, ipCountry(req));
    return res.status(200).json({ ok: true, preference });
  } catch (e) {
    return sendError(res, e);
  }
}
