import type { NextApiRequest, NextApiResponse } from 'next';
import { handoffPage, handoffUrl } from '../../../../lib/handoff';
import { ORIGIN, caller, mintHandoff, sendError } from '../../../../lib/proServer';

// POST /api/auth/handoff {to?: "earnings" | "pro"} with the app's Firebase ID token
// -> {code, url, expiresAtMs}, url = stepgunner.com/<to>#h=CODE. The app opens url in
// Safari and the page signs in as this account (lib/handoff.ts). Named accounts only:
// caller() refuses anonymous.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const to = handoffPage(req.body?.to);
    const { code, expiresAtMs } = await mintHandoff(me.uid, to);
    console.log(`[handoff] minted uid=${me.uid.slice(0, 6)} to=${to} provider=${me.provider}`);
    return res.status(200).json({ ok: true, code, url: handoffUrl(ORIGIN, to, code), expiresAtMs });
  } catch (e) {
    return sendError(res, e);
  }
}
