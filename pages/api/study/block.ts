import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, proDb, sendError } from '../../../lib/proServer';
import { cleanTz, openBlock, requireStudy, serveCurrent } from '../../../lib/study/server';

// POST /api/study/block {tz, fresh?} -> the block in progress (or a new one picked by
// the student's review schedule) and its current question, without the answer (0082).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const db = proDb();
    const cfg = await requireStudy(db, me.uid);
    const block = await openBlock(db, me.uid, cfg, cleanTz(req.body?.tz), req.body?.fresh === true);
    const { block: b, question } = await serveCurrent(db, me.uid, cfg, block.id);
    console.log(`[study] block uid=${me.uid.slice(0, 6)} id=${b.id} i=${b.i}/${b.keys.length} fresh=${req.body?.fresh === true}`);
    return res.status(200).json({
      ok: true,
      block: { id: b.id, i: b.i, size: b.keys.length, startedMs: b.startedMs, results: b.results.map((r) => ({ correct: r.correct })) },
      question,
    });
  } catch (e) {
    return sendError(res, e);
  }
}
