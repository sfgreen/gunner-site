import type { NextApiRequest, NextApiResponse } from 'next';
import { caller, proDb, ProError, sendError } from '../../../lib/proServer';
import { validClientId } from '../../../lib/journey';

// POST /api/journey/link {clientId, page} (Bearer: the student's Firebase ID token):
// saves this browser's GA client id on webJourneys/{uid} (server-only, gunner decision
// 0081), so Admin > Journeys can join the site's analytics export to the account.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  try {
    const me = await caller(req);
    const cid = req.body?.clientId;
    if (!validClientId(cid)) throw new ProError(400, 'client_id', 'No analytics id.');
    const page = typeof req.body?.page === 'string' ? req.body.page.slice(0, 80) : '';
    const db = proDb();
    const ref = db.collection('webJourneys').doc(me.uid);
    const now = Date.now();
    const added = await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const d = snap.exists ? snap.data() || {} : {};
      const ids: string[] = Array.isArray(d.clientIds) ? d.clientIds.filter(validClientId) : [];
      const isNew = !ids.includes(cid);
      if (isNew) ids.push(cid);
      t.set(ref, {
        uid: me.uid, clientIds: ids.slice(-10), provider: me.provider,
        firstAt: d.firstAt || now, lastAt: now, lastPage: page, how: d.how || 'signin',
      }, { merge: true });
      return isNew;
    });
    console.log(`[journey] link uid=${me.uid.slice(0, 6)} page=${page} new=${added}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return sendError(res, e);
  }
}
