import type { NextApiRequest, NextApiResponse } from 'next';
import { executeRuns } from '../../../lib/referral';
import { firestorePayoutPorts, payoutsProvider } from '../../../lib/referralServer';

// The friend-reward payout run (decision 0057 amendment, S4 and D2). The backend
// (functions/main.py referral_payout_run) writes referralPayoutRuns/{YYYY-MM} with one
// line per sharer, and Admin (or autoPayout) approves it. This only executes approved
// (or interrupted) runs: per line, one PayoutIntent from the rows still payable less
// the refunds it nets, or Pro months. It also checks payouts still in flight and puts
// a bounced one's rows back to payable. It never flips rows or creates runs.
//
// Daily (vercel.json) so a run approved after the 1st still goes out that day; a day
// with no approved run is one query. On demand: the same URL with CRON_SECRET,
// ?run=YYYY-MM for one run, ?dry_run=1 (or PAYOUTS_DRY_RUN=1) to plan without writing.
export const config = { maxDuration: 60 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const dryRun = req.query.dry_run === '1' || process.env.PAYOUTS_DRY_RUN === '1';
  const runId = typeof req.query.run === 'string' && /^\d{4}-\d{2}$/.test(req.query.run) ? req.query.run : undefined;
  try {
    const client = payoutsProvider();
    const out = await executeRuns(firestorePayoutPorts(client), client, { nowMs: Date.now(), dryRun, runId });
    console.log(`[payouts] cron dryRun=${dryRun} provider=${client ? 'global_payouts' : 'off'} settled=${JSON.stringify(out.settled)} runs=${JSON.stringify(out.runs.map((r) => ({ id: r.runId, outcome: r.outcome, result: r.result })))}`);
    return res.status(200).json({ ok: true, dryRun, provider: client ? 'global_payouts' : null, ...out });
  } catch (e) {
    console.error('[payouts] cron failed', e);
    return res.status(500).json({ error: 'payout run failed' });
  }
}
