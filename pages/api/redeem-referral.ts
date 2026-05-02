import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Firebase admin init (once per cold start)
if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      projectId: 'stepgunner-79ae7',
    });
  } catch (err) {
    console.error('Firebase admin init failed:', err);
  }
}

const REFEREE_GRANT_DAYS = 30;
const REFERRER_GRANT_DAYS = 30;

interface RedeemBody {
  code: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: require Firebase ID token in header
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });

  let refereeUid: string;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    refereeUid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  // Validate body
  const body = req.body as RedeemBody;
  const code = (body.code || '').trim().toUpperCase();
  if (!code || code.length < 5) {
    return res.status(400).json({ error: 'Invalid referral code' });
  }

  const db = getFirestore();

  // Look up the code's owner. Single-field equality query — fine without an index.
  const snap = await db.collection('users').where('referralCode', '==', code).limit(1).get();
  if (snap.empty) {
    return res.status(404).json({ error: 'Code not found' });
  }
  const referrerDoc = snap.docs[0];
  const referrerUid = referrerDoc.id;

  // Self-referral block
  if (referrerUid === refereeUid) {
    return res.status(400).json({ error: 'Cannot redeem your own code' });
  }

  // One-redemption-per-account block
  const refereeDoc = await db.collection('users').doc(refereeUid).get();
  if (refereeDoc.data()?.redeemedReferralCode) {
    return res.status(400).json({ error: 'Already redeemed a referral code' });
  }

  // Apply grants atomically
  const now = Date.now();
  const refereeExpires = Timestamp.fromMillis(now + REFEREE_GRANT_DAYS * 86400 * 1000);
  // Referrer: extend from current expiration if still future, else from now
  const refData = referrerDoc.data() || {};
  const existingMs = (refData.proGrantExpiresAt as Timestamp | undefined)?.toMillis() ?? now;
  const refBase = Math.max(existingMs, now);
  const referrerExpires = Timestamp.fromMillis(refBase + REFERRER_GRANT_DAYS * 86400 * 1000);

  const batch = db.batch();
  batch.update(db.collection('users').doc(refereeUid), {
    proGrantExpiresAt: refereeExpires,
    redeemedReferralCode: code,
    referredBy: referrerUid,
  });
  batch.update(db.collection('users').doc(referrerUid), {
    proGrantExpiresAt: referrerExpires,
    referralsCount: (refData.referralsCount ?? 0) + 1,
  });
  try {
    await batch.commit();
  } catch (err) {
    console.error('Referral grant batch failed:', err);
    return res.status(500).json({ error: 'Grant write failed' });
  }

  return res.status(200).json({
    ok: true,
    refereeProUntil: refereeExpires.toDate().toISOString(),
    referrerName: refData.displayName ?? null,
  });
}
