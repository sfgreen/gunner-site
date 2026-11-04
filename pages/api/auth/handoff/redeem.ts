import type { NextApiRequest, NextApiResponse } from 'next';
import { isHandoffCode } from '../../../../lib/handoff';
import { ProError, redeemHandoff, sendError } from '../../../../lib/proServer';

// POST /api/auth/handoff/redeem {code} -> {token}: a Firebase custom token for the
// account that minted the code, which the page signs in with. Works once, within 2
// minutes (lib/handoff.ts).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const code = req.body?.code;
    if (!isHandoffCode(code)) throw new ProError(400, 'bad_code', 'That link is not complete. Open it from the app again.');
    const { uid, token } = await redeemHandoff(code);
    console.log(`[handoff] redeemed uid=${uid.slice(0, 6)}`);
    return res.status(200).json({ ok: true, token });
  } catch (e) {
    return sendError(res, e);
  }
}
