import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, proDb, sendError } from '../../../lib/proServer';
import { cleanTz, deskState } from '../../../lib/study/server';

// GET /api/study/state?tz=<minutes east of UTC>: the desk's side panels (decision 0082).
// Signed-in named accounts only; a free account gets pro "none" and no schedule read.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const state = await deskState(proDb(), me.uid, cleanTz(Number(req.query.tz)));
    return res.status(200).json({ ok: true, state });
  } catch (e) {
    return sendError(res, e);
  }
}
