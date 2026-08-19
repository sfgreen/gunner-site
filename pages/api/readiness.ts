import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Anonymous capture of readiness-check entries: the NBME/UWSA scores + days-out
// people run through stepgunner.com/readiness. No name, email, or account, this
// is an aggregate dataset (which also feeds the eventual calibrated model, task
// #48) plus a channel signal (referer). Admin SDK write, so no Firestore rule
// change; the collection is not client-readable.
if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) });
}

interface Body {
  entries?: { form?: string; score?: unknown; days?: unknown }[];
  projected?: { low?: unknown; high?: unknown };
  actual?: unknown; // the user's real Step 2 score, when they typed one (130-300)
  source?: unknown; // 'readiness' (full tool) | 'predictor' (quick convert)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!getApps().length) return res.status(200).json({ ok: false, reason: 'no-credential' });

  try {
    const body = (req.body || {}) as Body;
    // Number('') === 0 and Number(null) === 0, which silently turned blank dates
    // into days:0 (35% of historical rows). Blank stays null; a true today clamps
    // to 1 so days==0 never appears again (historical 0s = treat as missing).
    const numv = (v: unknown): number | null => {
      if (v == null || (typeof v === 'string' && v.trim() === '')) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const clean = (Array.isArray(body.entries) ? body.entries : [])
      .slice(0, 14)
      .map((e) => {
        const sv = numv(e.score);
        const dv = numv(e.days);
        return {
          form: typeof e.form === 'string' ? e.form.slice(0, 24) : '',
          score: sv != null ? Math.max(0, Math.min(300, Math.round(sv))) : null,
          days: dv != null ? Math.max(1, Math.min(999, Math.round(dv))) : null,
        };
      })
      .filter((e) => e.score != null);
    if (!clean.length) return res.status(400).json({ error: 'no valid entries' });

    const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
    const actualNum = num(body.actual);
    await getFirestore().collection('readinessChecks').add({
      entries: clean,
      projLow: num(body.projected?.low),
      projHigh: num(body.projected?.high),
      actual: actualNum != null && actualNum >= 130 && actualNum <= 300 ? actualNum : null,
      source: typeof body.source === 'string' ? body.source.slice(0, 24) : 'readiness',
      ref: (req.headers['referer'] || '').toString().slice(0, 200),
      ua: (req.headers['user-agent'] || '').toString().slice(0, 200),
      createdAt: Timestamp.now(),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('readiness capture error', err);
    return res.status(200).json({ ok: false });
  }
}
