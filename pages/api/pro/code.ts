import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, codeRefusal, isPlan, resolveCode, sendError, statusFor, type CodeOk } from '../../../lib/proServer';

// POST /api/pro/code {code, plan}: does this Chief or friend code work here, and
// what does it take off. Checkout resolves the code again; this is the preview.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const plan = isPlan(req.body?.plan) ? req.body.plan : 'yearly';
    const { doc } = await statusFor(me.uid);
    const res0 = await resolveCode(req.body?.code, plan, { uid: me.uid, doc });
    const refusal = codeRefusal(res0);
    if (refusal != null) return res.status(200).json({ ok: false, error: refusal });
    const r = res0 as CodeOk;
    return res.status(200).json({ ok: true, kind: r.kind, code: r.code, label: r.label, rewards: !!r.referrerUid });
  } catch (e) {
    return sendError(res, e);
  }
}
