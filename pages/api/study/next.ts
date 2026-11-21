import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, proDb, sendError } from '../../../lib/proServer';
import { requireStudy, serveCurrent } from '../../../lib/study/server';

// POST /api/study/next {blockId} -> the block's current question (0082). Counts toward
// the daily cap and the minimum gap only when it serves a question not served before.
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
    const blockId = typeof req.body?.blockId === 'string' ? req.body.blockId : '';
    const { block, question } = await serveCurrent(db, me.uid, cfg, blockId);
    return res.status(200).json({ ok: true, done: !question, index: block.i, size: block.keys.length, question });
  } catch (e) {
    return sendError(res, e);
  }
}
