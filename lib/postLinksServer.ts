import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { centralDay, type Device } from './postLinks';

// Server half of the tracked post links: one doc per source in `postLinks/{source}`
// (server-write-only; the admin SDK is the only way in). Same init as chiefsServer.ts:
// no credential means no app, and a visit is still redirected, just not counted.
if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)), projectId: 'stepgunner-79ae7' });
  } catch (err) {
    console.error('postLinks: firebase admin init failed', err);
  }
}

/** One visit: the total, the device, the Central day, the referring host. */
export async function countVisit(source: string, device: Device, refHost: string, now = Date.now()): Promise<boolean> {
  if (!getApps().length) return false;
  const day = centralDay(now);
  const ref = refHost.replace(/[^a-z0-9.-]/gi, '').slice(0, 60) || 'direct';
  await getFirestore().collection('postLinks').doc(source).set({
    source,
    total: FieldValue.increment(1),
    [device]: FieldValue.increment(1),
    days: { [day]: FieldValue.increment(1) },
    refs: { [ref.replace(/\./g, '_')]: FieldValue.increment(1) },
    lastAt: now,   // the first visit's day is the earliest key in `days`
  }, { merge: true });
  return true;
}
