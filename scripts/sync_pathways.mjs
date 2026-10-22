#!/usr/bin/env node
// Copy the approved ED pathways from the app repo's content staging into
// content/pathways/, the only place the site build reads them from (Vercel
// builds see this repo alone, so the copies are committed).
//
//   node scripts/sync_pathways.mjs                 # default source below
//   node scripts/sync_pathways.mjs <staging dir>   # or PATHWAYS_SRC=<dir>
//
// Rules:
// - Only files whose top-level status is "approved" are copied. A draft never
//   reaches the site, however the page layer is configured.
// - Bytes are copied verbatim, so `diff` against the source proves the copy.
// - A copy whose source is gone or no longer approved is removed (git keeps it),
//   otherwise a pathway pulled back to draft would stay on the site.
// - The publishing gate (Danny's medical sign-off) is NOT decided here. It lives
//   in the per-pathway editorial file, read by lib/pathways/data.ts at build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DEFAULT_SRC = '/Users/dannyvarghese/.openclaw/workspace/gunner/content_staging/pathways'; // trunk, the OTA source
const SRC = path.resolve(process.argv[2] || process.env.PATHWAYS_SRC || DEFAULT_SRC);
const DEST = path.join(ROOT, 'content', 'pathways');

function fail(msg) {
  console.error(`sync_pathways: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(SRC) || !fs.statSync(SRC).isDirectory()) fail(`no source directory at ${SRC}`);
fs.mkdirSync(DEST, { recursive: true });

const copied = [];
const held = [];
for (const name of fs.readdirSync(SRC).filter((n) => n.endsWith('.json')).sort()) {
  const raw = fs.readFileSync(path.join(SRC, name));
  let doc;
  try {
    doc = JSON.parse(raw.toString('utf8'));
  } catch (err) {
    fail(`${name} is not valid JSON (${err.message})`);
  }
  if (!doc || typeof doc.id !== 'string' || !doc.id.startsWith('pw_')) fail(`${name} has no pw_ id`);
  if (doc.status !== 'approved') {
    held.push(`${name} (${doc.status})`);
    continue;
  }
  const out = path.join(DEST, name);
  const same = fs.existsSync(out) && Buffer.compare(fs.readFileSync(out), raw) === 0;
  if (!same) fs.writeFileSync(out, raw);
  copied.push(`${name}${same ? '' : ' (updated)'}`);
}

const keep = new Set(copied.map((c) => c.split(' ')[0]));
const removed = [];
for (const name of fs.readdirSync(DEST).filter((n) => n.endsWith('.json'))) {
  if (!keep.has(name)) {
    fs.unlinkSync(path.join(DEST, name));
    removed.push(name);
  }
}

console.log(`sync_pathways: ${copied.length} approved copied from ${SRC}`);
for (const c of copied) console.log(`  ok    ${c}`);
for (const h of held) console.log(`  held  ${h}`);
for (const r of removed) console.log(`  gone  ${r} (no longer approved at the source)`);
