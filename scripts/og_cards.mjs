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
// The app look (styles/globals.css, light): the page ground #f4f8fc, ink
// #0b1220, the article header as the pages draw it (components/app ArticleHeader):
// a mono eyebrow after the category dot, then the 800 two-tone title, its accent
// half in the category color (ED gray, Step 2 gold). Counts sit in mono chips.
// The mark is the site's own wordmark only, as the nav draws it: a green dot,
// STEP in the action blue, GUNNER in gray, mono. No emoji, no mascot art.
// Rendered with the satori + resvg build Next already ships (next/og): Inter 800
// and JetBrains Mono 700/800 from public/og/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { ImageResponse } from 'next/dist/compiled/@vercel/og/index.node.js';
import { WORLDS } from '../lib/pathways/config.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OG = path.join(ROOT, 'public', 'og');
const h = React.createElement;

// The light app tokens (styles/globals.css :root).
const C = {
  bg: '#f4f8fc', card: '#ffffff', ink: '#0b1220', ink2: '#3b4658', ink3: '#566173',
  line: '#dde6f1', key: '#0060df', green: '#30d158',
};
// Category: the eyebrow dot, its ring, and the title's accent half (blocks.tsx DOT, app.css .key).
const CAT = {
  ed: { dot: '#4a5568', ring: 'rgba(74,85,104,0.16)', accent: '#4a5568' },
  step2: { dot: '#ffd60a', ring: 'rgba(255,214,10,0.30)', accent: '#7d5a00' },
};

const font = (name) => fs.readFileSync(path.join(OG, name));
const FONTS = [
  { name: 'Inter', data: font('inter-800.ttf'), weight: 800, style: 'normal' },
  { name: 'Mono', data: font('mono-700.ttf'), weight: 700, style: 'normal' },
  { name: 'Mono', data: font('mono-800.ttf'), weight: 800, style: 'normal' },
];

/** Display size steps down with length so every title sits in two to four lines. */
const titleSize = (t) => (t.length <= 24 ? 104 : t.length <= 40 ? 88 : t.length <= 60 ? 76 : t.length <= 80 ? 66 : 58);

/** The two-tone title as words in a wrapping row (satori has no inline runs), the
 *  accent words in the category color. */
function Title({ title, accent, cat }) {
  const size = titleSize(title);
  const k = accent && title.includes(accent) ? title.lastIndexOf(accent) : -1;
  const words = [];
  const push = (text, color) => text.split(/\s+/).filter(Boolean).forEach((w) => words.push({ w, color }));
  if (k < 0) push(title, C.ink);
  else {
    push(title.slice(0, k), C.ink);
    push(accent, CAT[cat].accent);
    push(title.slice(k + accent.length), C.ink);
  }
  return h('div', {
    style: {
      display: 'flex', flexWrap: 'wrap', columnGap: Math.round(size * 0.24), marginTop: 28, maxWidth: 1056,
      fontFamily: 'Inter', fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: -size * 0.035,
    },
  }, ...words.map(({ w, color }, i) => h('span', { key: i, style: { color } }, w)));
}

function Card({ cat, eyebrow, title, accent, chips = [], url }) {
  const c = CAT[cat];
  return h('div', {
    style: {
      width: 1200, height: 630, display: 'flex', flexDirection: 'column', background: C.bg, color: C.ink,
      padding: '64px 72px 52px',
    },
  },
  h('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
    h('div', { style: { width: 16, height: 16, borderRadius: 8, background: c.dot, boxShadow: `0 0 0 6px ${c.ring}` } }),
    h('div', {
      style: { display: 'flex', fontFamily: 'Mono', fontWeight: 700, fontSize: 24, letterSpacing: 3.6, textTransform: 'uppercase', color: C.ink2 },
    }, eyebrow)),
  Title({ title, accent, cat }),
  chips.length
    ? h('div', { style: { display: 'flex', gap: 12, marginTop: 36 } },
      ...chips.map((x) => h('div', {
        key: x,
        style: {
          display: 'flex', fontFamily: 'Mono', fontWeight: 700, fontSize: 22, color: C.ink2, background: C.card,
          border: `2px solid ${C.line}`, borderRadius: 14, padding: '8px 18px',
        },
      }, x)))
    : null,
  h('div', { style: { display: 'flex', flexGrow: 1 } }),
  h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 28, borderTop: `2px solid ${C.line}` } },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } },
      h('div', { style: { width: 14, height: 14, borderRadius: 7, background: C.green } }),
      h('div', { style: { display: 'flex', alignItems: 'center', fontFamily: 'Mono' } },
        h('span', { style: { color: C.key, fontWeight: 800, fontSize: 30, letterSpacing: 4.2 } }, 'STEP'),
        h('span', { style: { color: C.ink3, fontWeight: 700, fontSize: 22, letterSpacing: 3.1, marginLeft: 14 } }, 'GUNNER'))),
    h('div', { style: { display: 'flex', fontFamily: 'Mono', fontWeight: 700, fontSize: 22, color: C.ink3 } }, url)));
}

async function write(rel, props) {
  const res = new ImageResponse(Card(props), { width: 1200, height: 630, fonts: FONTS });
  const out = path.join(OG, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  return out;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** The pages' accent rule (components/LabLayout): what follows the last ": " or ", ". */
const labAccent = (t) => {
  const i = Math.max(t.lastIndexOf(': '), t.lastIndexOf(', '));
  return i > 0 ? t.slice(i + 2) : undefined;
};
/** The pathway articles' rule (components/pathways/PathwayArticle): after the first ": ". */
const pathwayAccent = (t) => {
  const i = t.indexOf(': ');
  return i > 0 ? t.slice(i + 2) : undefined;
};
const outputs = [];

// ---- the pathways: the same gate as lib/pathways/data (published or signedOff).
// Each card carries the article's own H1, two-tone as on the page.
const PW = path.join(ROOT, 'content', 'pathways');
const ED = path.join(ROOT, 'content', 'pathway-articles');
const live = [];
for (const name of fs.readdirSync(ED).filter((n) => n.endsWith('.json')).sort()) {
  const ed = JSON.parse(fs.readFileSync(path.join(ED, name), 'utf8'));
  if (ed.published !== true && ed.signedOff !== true) continue;
  const id = String(ed.id).replace(/^pw_/, '');
  const p = JSON.parse(fs.readFileSync(path.join(PW, `${id}.json`), 'utf8'));
  if (p.status !== 'approved') continue;
  live.push({ slug: name.slice(0, -'.json'.length), p, ed });
}
for (const { slug, p, ed } of live) {
  const steps = p.nodes.filter((n) => n.kind === 'step').length;
  const forks = p.nodes.filter((n) => n.kind === 'branch').length;
  outputs.push(await write(`pathways/${slug}.png`, {
    cat: 'ed',
    eyebrow: `ED pathway · ${WORLDS[p.world]?.label || p.world}`,
    title: ed.h1,
    accent: pathwayAccent(ed.h1),
    chips: [plural(steps, 'decision step', 'decision steps'), plural(forks, 'fork', 'forks'), plural(p.sources.length, 'source', 'sources')],
    url: `stepgunner.com/pathways/${slug}`,
  }));
}
if (live.length) {
  const cases = live.reduce((a, x) => a + x.p.cases.length, 0);
  const sources = new Set(live.flatMap((x) => x.p.sources.map((s) => s.docId))).size;
  outputs.push(await write('pathways/index.png', {
    cat: 'ed',
    eyebrow: 'ED pathways · Step 2 CK',
    title: 'ED pathways for Step 2 CK and EM rotations',
    accent: 'for Step 2 CK and EM rotations',
    chips: [plural(live.length, 'presentation', 'presentations'), plural(cases, 'practice patient', 'practice patients'), plural(sources, 'cited source', 'cited sources')],
    url: 'stepgunner.com/pathways',
  }));
}

// ---- article pages: each card carries the page's own H1, with the page's accent.
// The check below fails the run if a title here no longer appears in its page,
// so a retitled page cannot keep a stale card.
const PAGES = [
  { page: 'pages/research/index.tsx', out: 'research/index.png', cat: 'step2', eyebrow: 'Research', title: 'Step 2 folklore, checked against data', url: 'stepgunner.com/research' },
  { page: 'pages/research/nbme-to-step-2.tsx', out: 'research/nbme-to-step-2.png', cat: 'step2', eyebrow: 'Research', title: 'What actually predicts your Step 2 score', url: 'stepgunner.com/research' },
  { page: 'pages/research/free-120-to-step-2.tsx', out: 'research/free-120-to-step-2.png', cat: 'step2', eyebrow: 'Research', title: 'What a Free 120 percentage is actually worth', url: 'stepgunner.com/research' },
  { page: 'pages/research/dedicated-calendar.tsx', out: 'research/dedicated-calendar.png', cat: 'step2', eyebrow: 'Research', title: 'The dedicated schedule nobody wrote down', url: 'stepgunner.com/research' },
  { page: 'pages/research/which-nbme-is-most-predictive.tsx', out: 'research/which-nbme-is-most-predictive.png', cat: 'step2', eyebrow: 'Research', title: 'Which NBME is the real you?', url: 'stepgunner.com/research' },
  { page: 'pages/research/model-misses-app-users.tsx', out: 'research/model-misses-app-users.png', cat: 'step2', eyebrow: 'Research', title: 'Why our own model is worse on our own users', url: 'stepgunner.com/research' },
  { page: 'pages/research/step-2-ck-time-per-question.tsx', out: 'research/step-2-ck-time-per-question.png', cat: 'step2', eyebrow: 'Research', title: 'Going slower did not come with more right answers', url: 'stepgunner.com/research' },
  { page: 'pages/research/most-missed-step-2-ck-topics.tsx', out: 'research/most-missed-step-2-ck-topics.png', cat: 'step2', eyebrow: 'Research', title: 'Everyone misses the same questions. Here is what they have in common.', url: 'stepgunner.com/research' },
  { page: 'pages/step-2-ck-emergency-medicine.tsx', out: 'step-2-ck-emergency-medicine.png', cat: 'ed', eyebrow: 'Study guide · Step 2 CK', title: 'The next best step in the ED', url: 'stepgunner.com/step-2-ck-emergency-medicine' },
];
const stale = PAGES.filter((x) => !fs.readFileSync(path.join(ROOT, x.page), 'utf8').includes(x.title));
if (stale.length) {
  console.error(`Title not found in its page (update PAGES): ${stale.map((x) => x.page).join(', ')}`);
  process.exit(1);
}
for (const x of PAGES) outputs.push(await write(x.out, { ...x, accent: labAccent(x.title) }));

console.log(`${outputs.length} cards written under public/og/`);
