import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, proDb, sendError } from '../../../lib/proServer';
import { answerCurrent, requireStudy } from '../../../lib/study/server';
import { networkOf } from '../../../lib/study/guard';

// POST /api/study/answer {blockId, key, pick} (pick = index into the served order)
// -> the reveal: right or wrong, the answer, the explanation, the box move (0082).
// Saved to the student's review schedule the way the app saves it.
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
    const { blockId, key, pick } = req.body || {};
    if (typeof blockId !== 'string' || typeof key !== 'string') {
      return res.status(400).json({ ok: false, code: 'bad_request', error: 'Missing the question.' });
    }
    const fwd = req.headers['x-forwarded-for'];
    const meta = {
      net: networkOf(Array.isArray(fwd) ? fwd[0] : fwd, req.socket?.remoteAddress),
      agent: String(req.headers['user-agent'] || '').slice(0, 300),
    };
    const reveal = await answerCurrent(db, me.uid, blockId, key, Number(pick), meta, cfg);
    console.log(`[study] answer uid=${me.uid.slice(0, 6)} key=${key} correct=${reveal.correct} box=${reveal.fromBox}->${reveal.toBox} xp=${reveal.xp}`);
    return res.status(200).json({ ok: true, reveal });
  } catch (e) {
    return sendError(res, e);
  }
}
