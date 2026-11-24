// Visits per tracked post link (stepgunner.com/get/<source>), read-only.
//   node scripts/post_links.mjs [source]
// Reads postLinks/* with the local service account (~/.config/firebase/stepgunner-service-account.json).
// Apple does not attribute first downloads to ct at our volume, so visits are the per-post number;
// cross-check a big day against App Store Connect's first-time downloads by source type.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(readFileSync(`${homedir()}/.config/firebase/stepgunner-service-account.json`, 'utf8'));
initializeApp({ credential: cert(key), projectId: 'stepgunner-79ae7' });
const only = process.argv[2];
const snap = await getFirestore().collection('postLinks').get();
const fmt = (ms) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(ms)) + ' CT';
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
const last7 = [...Array(7)].map((_, i) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date(Date.now() - (6 - i) * 86400000)));
const rows = snap.docs.map((d) => d.data()).filter((r) => !only || r.source === only).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
if (!rows.length) { console.log(only ? `no visits for ${only}` : 'no tracked links visited yet'); process.exit(0); }
console.log(`today ${today} (Central). last 7 days: ${last7.map((d) => d.slice(5)).join(' ')}`);
for (const r of rows) {
  const days = r.days || {};
  const first = Object.keys(days).sort()[0];
  const refs = Object.entries(r.refs || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h, n]) => `${h.replace(/_/g, '.')} ${n}`).join(', ');
  console.log(`\n${r.source}: ${r.total || 0} visits (iPhone ${r.ios || 0}, Android ${r.android || 0}, desktop ${r.desktop || 0})`);
  console.log(`  last 7 days: ${last7.map((d) => days[d] || 0).join(' ')}   first ${first}, last ${fmt(r.lastAt)}`);
  if (refs) console.log(`  from: ${refs}`);
}
