// Static Open Graph cards (1200x630 PNG) for the ED pathways and the article
// pages that had none: one per live pathway article, the /pathways hub, every
// /research page and /step-2-ck-emergency-medicine.
//
//   node scripts/og_cards.mjs          (npm run og:cards)
//
// The PNGs are committed under public/og/, so a page's unfurl never waits on a
// function and a build needs no image step. Re-run after adding a pathway or a
// research post, or after changing a title below.
//
// The light Score Report register (styles/globals.css): page #faf9f6, ink
// #191c23, one green. The mark is the site's own wordmark only: a green dot and
// STEP GUNNER in mono. No emoji, no mascot art. Rendered with the satori + resvg
// build Next already ships (next/og), using the fonts in public/og/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { ImageResponse } from 'next/dist/compiled/@vercel/og/index.node.js';
import { WORLDS } from '../lib/pathways/config.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OG = path.join(ROOT, 'public', 'og');
const h = React.createElement;

const C = {
  bg: '#faf9f6', panel: '#ffffff', ink: '#191c23', dim: '#5d6470',
  green: '#0d9448', greenInk: '#086b33', hair: 'rgba(25, 28, 35, 0.17)',
};

const font = (name) => fs.readFileSync(path.join(OG, name));
const FONTS = [
  { name: 'DM Sans', data: font('dmsans-600.ttf'), weight: 600, style: 'normal' },
  { name: 'DM Sans', data: font('dmsans-800.ttf'), weight: 800, style: 'normal' },
  { name: 'Mono', data: font('mono-700.ttf'), weight: 700, style: 'normal' },
  { name: 'Mono', data: font('mono-800.ttf'), weight: 800, style: 'normal' },
];

/** Display size steps down with length so every title sits in two or three lines. */
const titleSize = (t) => (t.length <= 20 ? 104 : t.length <= 34 ? 88 : t.length <= 52 ? 72 : 62);

function Card({ eyebrow, title, chips = [], url }) {
  return h('div', {
    style: {
      width: 1200, height: 630, display: 'flex', flexDirection: 'column', background: C.bg,
      fontFamily: 'DM Sans', color: C.ink, borderTop: `10px solid ${C.green}`,
      padding: '64px 80px 56px',
    },
  },
  h('div', {
    style: { display: 'flex', fontFamily: 'Mono', fontWeight: 700, fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', color: C.greenInk },
  }, eyebrow),
  h('div', {
    style: {
      display: 'flex', marginTop: 28, fontWeight: 800, fontSize: titleSize(title), lineHeight: 1.06,
      letterSpacing: -2, maxWidth: 1040,
    },
  }, title),
  chips.length
    ? h('div', { style: { display: 'flex', gap: 14, marginTop: 36 } },
      ...chips.map((c) => h('div', {
        key: c,
        style: {
          display: 'flex', fontFamily: 'Mono', fontWeight: 700, fontSize: 22, color: C.ink, background: C.panel,
          border: `2px solid ${C.hair}`, borderRadius: 999, padding: '10px 22px',
        },
      }, c)))
    : null,
  h('div', { style: { display: 'flex', flexGrow: 1 } }),
  h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
      h('div', { style: { width: 18, height: 18, borderRadius: 9, background: C.green } }),
      h('div', { style: { display: 'flex', fontFamily: 'Mono', fontWeight: 800, fontSize: 28, letterSpacing: 5 } },
        h('span', { style: { color: C.ink } }, 'STEP'),
        h('span', { style: { color: C.green, marginLeft: 16 } }, 'GUNNER'))),
    h('div', { style: { display: 'flex', fontFamily: 'Mono', fontWeight: 700, fontSize: 22, color: C.dim } }, url)));
}

async function write(rel, props) {
  const res = new ImageResponse(Card(props), { width: 1200, height: 630, fonts: FONTS });
  const out = path.join(OG, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  return out;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const outputs = [];

// ---- the pathways: the same gate as lib/pathways/data (published or signedOff)
const PW = path.join(ROOT, 'content', 'pathways');
const ED = path.join(ROOT, 'content', 'pathway-articles');
const live = [];
for (const name of fs.readdirSync(ED).filter((n) => n.endsWith('.json')).sort()) {
  const ed = JSON.parse(fs.readFileSync(path.join(ED, name), 'utf8'));
  if (ed.published !== true && ed.signedOff !== true) continue;
  const id = String(ed.id).replace(/^pw_/, '');
  const p = JSON.parse(fs.readFileSync(path.join(PW, `${id}.json`), 'utf8'));
  if (p.status !== 'approved') continue;
  live.push({ slug: name.slice(0, -'.json'.length), p });
}
for (const { slug, p } of live) {
  const steps = p.nodes.filter((n) => n.kind === 'step').length;
  const forks = p.nodes.filter((n) => n.kind === 'branch').length;
  outputs.push(await write(`pathways/${slug}.png`, {
    eyebrow: `ED pathway · ${WORLDS[p.world]?.label || p.world}`,
    title: p.title,
    chips: [plural(steps, 'decision step', 'decision steps'), plural(forks, 'fork', 'forks'), plural(p.sources.length, 'source', 'sources')],
    url: `stepgunner.com/pathways/${slug}`,
  }));
}
if (live.length) {
  const cases = live.reduce((a, x) => a + x.p.cases.length, 0);
  const sources = new Set(live.flatMap((x) => x.p.sources.map((s) => s.docId))).size;
  outputs.push(await write('pathways/index.png', {
    eyebrow: 'ED pathways · Step 2 CK',
    title: 'ED pathways for Step 2 CK and EM rotations',
    chips: [plural(live.length, 'presentation', 'presentations'), plural(cases, 'practice patient', 'practice patients'), plural(sources, 'cited source', 'cited sources')],
    url: 'stepgunner.com/pathways',
  }));
}

// ---- article pages: each card carries the page's own H1. The check below
// fails the run if a title here no longer appears in its page, so a retitled
// page cannot keep a stale card.
const PAGES = [
  { page: 'pages/research/index.tsx', out: 'research/index.png', eyebrow: 'Research', title: 'Step 2 folklore, checked against data', url: 'stepgunner.com/research' },
  { page: 'pages/research/nbme-to-step-2.tsx', out: 'research/nbme-to-step-2.png', eyebrow: 'Research', title: 'What actually predicts your Step 2 score', url: 'stepgunner.com/research' },
  { page: 'pages/research/free-120-to-step-2.tsx', out: 'research/free-120-to-step-2.png', eyebrow: 'Research', title: 'What a Free 120 percentage is actually worth', url: 'stepgunner.com/research' },
  { page: 'pages/research/dedicated-calendar.tsx', out: 'research/dedicated-calendar.png', eyebrow: 'Research', title: 'The dedicated schedule nobody wrote down', url: 'stepgunner.com/research' },
  { page: 'pages/research/which-nbme-is-most-predictive.tsx', out: 'research/which-nbme-is-most-predictive.png', eyebrow: 'Research', title: 'Which NBME is the real you?', url: 'stepgunner.com/research' },
  { page: 'pages/research/model-misses-app-users.tsx', out: 'research/model-misses-app-users.png', eyebrow: 'Research', title: 'Why our own model is worse on our own users', url: 'stepgunner.com/research' },
  { page: 'pages/research/step-2-ck-time-per-question.tsx', out: 'research/step-2-ck-time-per-question.png', eyebrow: 'Research', title: 'Going slower did not come with more right answers', url: 'stepgunner.com/research' },
  { page: 'pages/research/most-missed-step-2-ck-topics.tsx', out: 'research/most-missed-step-2-ck-topics.png', eyebrow: 'Research', title: 'Everyone misses the same questions. Here is what they have in common.', url: 'stepgunner.com/research' },
  { page: 'pages/step-2-ck-emergency-medicine.tsx', out: 'step-2-ck-emergency-medicine.png', eyebrow: 'Study guide · Step 2 CK', title: 'The next best step in the ED', url: 'stepgunner.com/step-2-ck-emergency-medicine' },
];
const stale = PAGES.filter((x) => !fs.readFileSync(path.join(ROOT, x.page), 'utf8').includes(x.title));
if (stale.length) {
  console.error(`Title not found in its page (update PAGES): ${stale.map((x) => x.page).join(', ')}`);
  process.exit(1);
}
for (const x of PAGES) outputs.push(await write(x.out, x));

console.log(`${outputs.length} cards written under public/og/`);
