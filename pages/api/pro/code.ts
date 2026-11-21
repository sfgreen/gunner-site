import type { NextApiRequest, NextApiResponse } from 'next';
import {
  caller, codeRefusal, countryOf, isPlan, isSaleCode, resolveCode, saleCheck, sendError, statusFor, type CodeOk,
} from '../../../lib/proServer';

// POST /api/pro/code {code, plan}: does this Chief, friend or sale code work here, and
// what does it take off. Checkout resolves the code again; this is the preview. While
// this student's sale price is live (gunner decision 0085 amendment 3), the yearly plan
// takes the sale price whatever the code; a friend code still pays its sharer.
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
    const country = countryOf(req);
    if (await isSaleCode(req.body?.code)) {
      const c = await saleCheck(me.uid, doc, country, plan, false);
      if (!c.sale) return res.status(200).json({ ok: false, error: c.refusal });
      return res.status(200).json({ ok: true, kind: 'sale', code: c.sale.code, label: `the ${c.sale.name} price, ${c.sale.price} for your first year`, rewards: false });
    }
    const res0 = await resolveCode(req.body?.code, plan, { uid: me.uid, doc });
    const refusal = codeRefusal(res0);
    if (refusal != null) return res.status(200).json({ ok: false, error: refusal });
    const r = res0 as CodeOk;
    const sale = plan === 'yearly' ? (await saleCheck(me.uid, doc, country, plan, false)).sale : null;
    const label = sale ? `the ${sale.name} price, ${sale.price} for your first year` : r.label;
    return res.status(200).json({ ok: true, kind: r.kind, code: r.code, label, rewards: !!r.referrerUid });
  } catch (e) {
    return sendError(res, e);
  }
}
