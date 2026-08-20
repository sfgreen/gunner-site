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
  entries?: { form?: string; score?: unknown; days?: unknown; dateSource?: unknown; raw?: unknown }[];
  projected?: { low?: unknown; high?: unknown } | null;
  actual?: unknown; // the user's real Step 2 score, when they typed one (130-300)
  source?: unknown; // 'readiness' (full tool) | 'predictor' (quick convert)
  modelVersion?: unknown; // which shipped web model produced the projection
  visitor?: { id?: unknown; session?: unknown; firstSeen?: unknown } | null; // anonymous uuids
  specialty?: unknown; // target specialty picked on the predictor (NRMP key)
  examInDays?: unknown; // signed days until the exam (negative = already taken)
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
          dateSource: e.dateSource === 'bucket' || e.dateSource === 'exact' || e.dateSource === 'none' ? e.dateSource : null,
          raw: typeof e.raw === 'string' ? e.raw.slice(0, 12) : null,
        };
      })
      .filter((e) => e.score != null);

    const num = (v: unknown) =>
      v == null || (typeof v === 'string' && v.trim() === '') || !Number.isFinite(Number(v))
        ? null
        : Math.round(Number(v));
    const actualNum = num(body.actual);
    const actualOk = actualNum != null && actualNum >= 130 && actualNum <= 300;
    // An outcome with no forms is still a row (share-link visitors reporting
    // a real score); only reject when there is neither.
    if (!clean.length && !actualOk) return res.status(400).json({ error: 'no valid entries' });
    await getFirestore().collection('readinessChecks').add({
      entries: clean,
      projLow: num(body.projected?.low),
      projHigh: num(body.projected?.high),
      actual: actualOk ? actualNum : null,
      source: typeof body.source === 'string' ? body.source.slice(0, 24) : 'readiness',
      modelVersion: typeof body.modelVersion === 'string' ? body.modelVersion.slice(0, 24) : null,
      visitorId: typeof body.visitor?.id === 'string' ? body.visitor.id.slice(0, 48) : null,
      sessionId: typeof body.visitor?.session === 'string' ? body.visitor.session.slice(0, 48) : null,
      visitorFirstSeen: num(body.visitor?.firstSeen),
      specialty: typeof body.specialty === 'string' ? body.specialty.slice(0, 40) : null,
      examInDays: num(body.examInDays),
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
