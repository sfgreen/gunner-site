import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe, syncCustomer } from '../../../lib/proServer';

// Daily (vercel.json): re-sync every Step Gunner customer from Stripe (decision
// 0051, item 9). Heals a missed webhook within a day, and cancels the plan of an
// account that was deleted in the app (syncCustomer). Vercel sends CRON_SECRET;
// without it the route refuses, since it can cancel subscriptions.
export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!process.env.STRIPE_SECRET_KEY) return res.status(200).json({ skipped: 'stripe not configured' });
  const notes: Record<string, number> = {};
  let n = 0;
  try {
    for await (const c of stripe().customers.list({ limit: 100 })) {
      if (c.metadata?.app !== 'stepgunner' || !c.metadata?.uid) continue;
      const r = await syncCustomer(c.id, 'reconcile');
      notes[r.note] = (notes[r.note] || 0) + 1;
      n += 1;
    }
  } catch (e) {
    console.error('[pro] reconcile failed', e);
    return res.status(500).json({ error: 'reconcile failed', synced: n, notes });
  }
  console.log(`[pro] reconcile synced=${n}`, notes);
  return res.status(200).json({ synced: n, notes });
}
