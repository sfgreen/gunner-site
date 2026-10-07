import type { NextApiRequest, NextApiResponse } from 'next';
import { Timestamp } from 'firebase-admin/firestore';
import { chiefsDb } from '../../lib/chiefsServer';
import { AUDIENCES, CHANNELS, YEARS, type FieldErrors } from '../../lib/chiefs';

// Chiefs application intake (contract: chiefApplications/{autoId}). Admin SDK
// write; the collection is server-write-only and Danny reviews it by script.
//
// Rate limit is in-memory per IP per hour. On Vercel that is per warm instance,
// so it is a speed bump against a script hammering the form, not a guarantee.
// The honeypot (`company`) catches the naive bots that fill every field.

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function clientIp(req: NextApiRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim();
  return first || req.socket.remoteAddress || 'unknown';
}

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // bound memory on a long-lived instance
  return false;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const b = (req.body || {}) as Record<string, unknown>;
  // Honeypot: pretend success so the bot moves on.
  if (str(b.company, 100)) return res.status(200).json({ ok: true });

  if (limited(clientIp(req))) {
    return res.status(429).json({ error: 'Too many applications from this network. Try again in an hour.' });
  }

  const name = str(b.name, 80);
  const email = str(b.email, 120).toLowerCase();
  const school = str(b.school, 120);
  const year = str(b.year, 20);
  const audience = str(b.audience, 20);
  const why = typeof b.why === 'string' ? b.why.trim().slice(0, 1200) : '';
  const picked = Array.isArray(b.channels) ? b.channels : [];
  const channels = picked
    .filter((c): c is string => typeof c === 'string' && (CHANNELS as readonly string[]).includes(c))
    .slice(0, CHANNELS.length);
  const other = str(b.channelsOther, 160);
  if (other) channels.push(`Other: ${other}`);

  const errors: FieldErrors = {};
  if (name.length < 2) errors.name = 'Enter your name.';
  if (!EMAIL.test(email)) errors.email = 'Enter an email we can reach you at.';
  if (school.length < 2) errors.school = 'Enter your school.';
  if (!(YEARS as readonly string[]).includes(year)) errors.year = 'Pick your year.';
  if (!channels.length) errors.channels = 'Pick at least one place, or describe it under Other.';
  if (!(AUDIENCES as readonly string[]).includes(audience)) errors.audience = 'Pick a rough size.';
  if (why.length < 20) errors.why = 'A sentence or two, at least 20 characters.';
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Check the highlighted fields.', fields: errors });

  const db = chiefsDb();
  if (!db) {
    console.error('chiefs-apply: no FIREBASE_SERVICE_ACCOUNT_KEY, application not stored');
    return res.status(503).json({ error: 'Applications are not open on this server right now. Email rezumab.med@gmail.com instead.' });
  }

  try {
    const ref = (req.headers['referer'] || '').toString();
    const source = str(b.source, 60) || 'chiefs_page';
    const doc = await db.collection('chiefApplications').add({
      name, email, school, year, channels, audience, why,
      createdAt: Timestamp.now(),
      status: 'new',
      source,
      ref: ref.slice(0, 200),
    });
    console.info('chiefs-apply: stored', { id: doc.id, school, year, audience, channels: channels.length, source });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('chiefs-apply: write failed', err);
    return res.status(500).json({ error: 'Something went wrong on our side. Try again in a minute.' });
  }
}
