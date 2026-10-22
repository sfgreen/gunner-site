// Build-time only (fs): loads the pathways and their editorial layer, applies the
// publishing gate, and turns both into the plain view model the pages render.
//
// THE PUBLISHING GATE. An article is live when its editorial file says
// `published: true` (Danny, 2026-10-22: "just publish the pathways") or
// `signedOff: true` (his per-pathway medical read). On a production build
// (VERCEL_ENV=production) only live articles are generated, listed, linked and
// put in the sitemap. Everywhere else (Vercel previews, local) every approved
// pathway renders, and one that is not live carries a draft banner and noindex.
//
// The two flags are not the same claim. `published` puts a page on the site;
// only `signedOff` puts "Medically reviewed by" on it and `lastReviewed` in its
// structured data.
import fs from 'fs';
import path from 'path';
import type {
  Pathway, PathwayNode, StepNode, BranchNode, EndNode, Order, SourceRef, Editorial, RoundsPresent,
} from './types';
import { WORLDS, worldLabel } from './config';
import { getGuide } from '../guides';
import type {
  ArticleVM, Block, CalcVM, CaseVM, Cite, CiteRefs, DisagreeVM, EndItemVM, ForkVM, FromRef, GlanceVM, Lead, LinkVM,
  NextVM, OrderVM, PresentVM, SectionVM, StepVM,
} from './view';
import { forkAnchor, nodeAnchor } from './view';

export type { ArticleVM } from './view';

const ROOT = process.cwd();
const PW_DIR = path.join(ROOT, 'content', 'pathways');
const ED_DIR = path.join(ROOT, 'content', 'pathway-articles');
const FIXTURE = path.join(ROOT, 'lib', 'pathways', '__dev_fixture_dka.json');
// The ED next-best-step study article lives on its own branch; link it only once
// its page is actually in the tree, so whichever merges first never links a 404.
const ED_ARTICLE_PAGE = path.join(ROOT, 'pages', 'step-2-ck-emergency-medicine.tsx');

export const BASE = 'https://stepgunner.com';
export const AUTHOR = 'Danny Varghese';

// Readable URLs where the pathway id is an abbreviation (Danny, 2026-10-22). The
// editorial file is named by the slug; ids, related lists and ct= keep the id.
const SLUG_OVERRIDES: Record<string, string> = {
  pw_ams: 'altered-mental-status',
  pw_tox: 'overdose',
  pw_htn: 'hypertensive-emergency',
};
const ID_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_OVERRIDES).map(([id, slug]) => [slug, id]),
);
export const slugOf = (id: string): string =>
  SLUG_OVERRIDES[id.startsWith('pw_') ? id : `pw_${id}`] ?? id.replace(/^pw_/, '').replace(/_/g, '-');
const idOf = (ref: string): string =>
  ID_BY_SLUG[ref] ?? (ref.startsWith('pw_') ? ref : `pw_${ref.replace(/-/g, '_')}`);
export const isProductionBuild = (): boolean => process.env.VERCEL_ENV === 'production';

/** The short name a crumb or a sticky bar uses: "Hyperglycemic crisis: DKA and HHS" reads "DKA and HHS". */
export function shortName(title: string): string {
  const i = title.indexOf(': ');
  return i > 0 ? title.slice(i + 2) : title;
}

// ---------------------------------------------------------------- loading

let pathwayCache: Pathway[] | null = null;

export function allPathways(): Pathway[] {
  if (pathwayCache) return pathwayCache;
  const list = fs
    .readdirSync(PW_DIR)
    .filter((n) => n.endsWith('.json'))
    .sort()
    .map((n) => JSON.parse(fs.readFileSync(path.join(PW_DIR, n), 'utf8')) as Pathway)
    // sync_pathways.mjs copies approved files only; this is the second lock.
    .filter((p) => p.status === 'approved');
  if (process.env.NODE_ENV === 'production') pathwayCache = list;
  return list;
}

export type EditorialSource = 'file' | 'fixture' | 'pending';

function readEditorial(slug: string): { ed: Editorial; source: EditorialSource } | null {
  const file = path.join(ED_DIR, `${slug}.json`);
  if (fs.existsSync(file)) {
    let ed: Editorial;
    try {
      ed = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      throw new Error(`content/pathway-articles/${slug}.json is not valid JSON: ${(err as Error).message}`);
    }
    for (const key of ['h1', 'seoTitle', 'metaDescription', 'sections'] as const) {
      if (!ed || !ed[key]) throw new Error(`content/pathway-articles/${slug}.json has no ${key}`);
    }
    return { ed, source: 'file' };
  }
  // The DKA mock's editorial, for building the template before the real file
  // lands. Never on production, and it is never signed off.
  if (slug === 'dka-hhs' && !isProductionBuild() && fs.existsSync(FIXTURE)) {
    return { ed: { ...JSON.parse(fs.readFileSync(FIXTURE, 'utf8')), published: false, signedOff: false }, source: 'fixture' };
  }
  return null;
}

/** A stand-in for previews while a pathway's editorial file is still being
 *  written: the pathway's own title and stages, nothing invented. */
function pendingEditorial(p: Pathway): Editorial {
  const stages: string[] = [];
  for (const n of p.nodes) if (n.kind === 'step' && !stages.includes(n.stage)) stages.push(n.stage);
  return {
    id: p.id, slug: slugOf(p.id), published: false, signedOff: false, updated: '',
    seoTitle: `${p.title}: the ED pathway | Step Gunner`,
    metaDescription: `${p.title} for Step 2 CK: the ED algorithm fork by fork, with doses and the guideline line each one comes from.`,
    h1: p.title, dek: '', jumpLinks: [], shortAnswer: [],
    sections: stages.map((s) => ({ stage: s, heading: s })),
    checklist: null, rounds: null, traps: [], faq: [], related: [],
  };
}

export type Entry = {
  pathway: Pathway;
  slug: string;
  editorial: Editorial;
  source: EditorialSource;
  signedOff: boolean;
  /** published || signedOff: on the live site, indexable, in the sitemap. */
  live: boolean;
};

/** The gate, on an editorial file's own flags. */
const isLive = (ed: Editorial): boolean => ed.published === true || ed.signedOff === true;

/** Every pathway this build publishes, in file order. */
export function publishedEntries(): Entry[] {
  const prod = isProductionBuild();
  const out: Entry[] = [];
  for (const p of allPathways()) {
    const slug = slugOf(p.id);
    const found = readEditorial(slug);
    // The editorial files name the pathway with or without the pw_ prefix.
    if (found && found.ed.id && slugOf(found.ed.id) !== slug) {
      throw new Error(`content/pathway-articles/${slug}.json has id ${found.ed.id}, expected ${p.id}`);
    }
    const fromFile = !!found && found.source === 'file';
    const signedOff = fromFile && found!.ed.signedOff === true;
    const live = fromFile && isLive(found!.ed);
    if (prod && !live) continue;
    out.push({ pathway: p, slug, editorial: found ? found.ed : pendingEditorial(p), source: found ? found.source : 'pending', signedOff, live });
  }
  return out;
}

// ---------------------------------------------------------------- helpers

/** The text before the first ";" of an outcome's `if` is its short form (0044). */
function splitIf(s: string): { result: string; meaning: string } {
  const i = s.indexOf(';');
  return i < 0 ? { result: s.trim(), meaning: '' } : { result: s.slice(0, i).trim(), meaning: s.slice(i + 1).trim() };
}

/** 660 of 724 endpoint summaries open with a short label and a colon
 *  ("MI as the trigger: ICU care, ..."). Split it off without rewording. */
function splitEnd(s: string): { label: string | null; rest: string } {
  const m = /^([^:;.]{3,80}):\s+([\s\S]*)$/.exec(s);
  return m ? { label: m[1].trim(), rest: m[2].trim() } : { label: null, rest: s };
}

const anchorize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Answer-first options in a stable shuffled order (the JSON keys every quick
 *  check at A). Seeded per node, so a reload never moves the answer. */
function shuffleOptions(options: string[], answer: number, seed: string): { options: string[]; answer: number } {
  let a = fnv(seed) || 1;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const idx = options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { options: idx.map((i) => options[i]), answer: idx.indexOf(answer) };
}

const strip = (s: string): string => s.replace(/\*\*/g, '');
const words = (s: string | null | undefined): number => (s ? strip(s).split(/\s+/).filter(Boolean).length : 0);

/** Sentences, split only at ". " before a capital, so "pH 7.14" and "0.5 mmol/L"
 *  stay whole. Rejoining with one space gives back the original text exactly. */
function sentencesOf(s: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < s.length - 2; i += 1) {
    if (s[i] === '.' && s[i + 1] === ' ' && /[A-Z]/.test(s[i + 2])) {
      out.push(s.slice(start, i + 1));
      start = i + 2;
    }
  }
  out.push(s.slice(start));
  return out.map((x) => x.trim()).filter(Boolean);
}

/** A short "Label: rest" opener, split off for a bold lead without rewording. */
function leadOf(text: string, maxWords: number, maxChars: number): Lead {
  const m = /^([^:;.]+):\s+([\s\S]+)$/.exec(text);
  if (m && m[1].length <= maxChars && m[1].trim().split(/\s+/).length <= maxWords) return { lead: m[1].trim(), text: m[2] };
  return { lead: null, text };
}

/** A paragraph of rounds advice, broken before each sentence that opens with a
 *  short label ("One-liner:", "Plan:", "Potassium:") so the presentation reads
 *  problem by problem. Text between labels stays with the paragraph before it. */
function labelledParagraphs(s: string): Lead[] {
  const out: Lead[] = [];
  for (const block of s.split(/\n\s*\n/)) {
    for (const sent of sentencesOf(block.trim())) {
      const l = leadOf(sent, 4, 28);
      if (l.lead || !out.length) out.push(l);
      else out[out.length - 1] = { ...out[out.length - 1], text: `${out[out.length - 1].text} ${sent}` };
    }
  }
  return out;
}

function presentVM(p: RoundsPresent): PresentVM | null {
  if (!p) return null;
  if (typeof p === 'string') return { intro: null, oneLiner: null, paragraphs: labelledParagraphs(p), plan: [] };
  if (Array.isArray(p)) return { intro: null, oneLiner: null, paragraphs: p.filter(Boolean).flatMap(labelledParagraphs), plan: [] };
  return {
    intro: p.intro || null,
    oneLiner: p.oneLiner || null,
    paragraphs: [],
    plan: (p.plan || []).map((x) => (typeof x === 'string' ? { lead: null, text: x } : { lead: x.lead || null, text: x.text })),
  };
}

/** JSON round trip: getStaticProps refuses undefined, and this drops it. */
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x));

// ---------------------------------------------------------------- the article

const SPECIAL_ANCHORS: Record<string, string> = {
  short: 'short', glance: 'glance', checklist: 'checklist', math: 'math', calculators: 'math', rounds: 'rounds',
  traps: 'traps', disagree: 'disagree', patients: 'patients', cases: 'patients', faq: 'faq', sources: 'sources', related: 'related',
};

/** An array, or nothing: empty lists stay out of the page data. */
const opt = <T>(xs: T[]): T[] | undefined => (xs.length ? xs : undefined);

export function buildArticle(entry: Entry, published: Entry[]): ArticleVM {
  const { pathway: p, editorial: ed } = entry;
  const byId = new Map<string, PathwayNode>(p.nodes.map((n) => [n.id, n]));
  const srcIndex = new Map(p.sources.map((s, i) => [s.docId, i]));
  const calcById = new Map((p.calculators || []).map((c) => [c.id, c]));
  const steps = p.nodes.filter((n): n is StepNode => n.kind === 'step');
  const branches = p.nodes.filter((n): n is BranchNode => n.kind === 'branch');

  // Each distinct citation ships once; blocks carry its index.
  const citeTable: Cite[] = [];
  const citeKey = new Map<string, number>();
  const cites = (refs: SourceRef[] | undefined): CiteRefs | undefined =>
    opt((refs || []).map((r) => {
      const src = srcIndex.has(r.docId) ? srcIndex.get(r.docId)! : -1;
      const c: Cite = { src, ...(r.where ? { where: r.where } : {}), ...(src < 0 ? { label: r.docId } : {}) };
      const key = `${c.src}\u0000${c.where || ''}\u0000${c.label || ''}`;
      if (!citeKey.has(key)) {
        citeKey.set(key, citeTable.length);
        citeTable.push(c);
      }
      return citeKey.get(key)!;
    }));
  const orders = (os: Order[] | undefined): OrderVM[] | undefined =>
    opt((os || []).map((o) => ({
      item: o.item, dose: o.dose,
      ...(o.status && o.status !== 'ok' ? { status: o.status } : {}),
      ...(o.note ? { note: o.note } : {}),
      cites: cites(o.sources),
    })));

  // ---- which section each node belongs to ----
  // Steps go to the section of their stage (or the section whose optional
  // `nodes` names them). Forks are never pulled away from their step: each one
  // renders right after the step that leads to it (or after the fork that does),
  // so the algorithm reads in order. A section on the forks' own stage ("Result")
  // becomes an index of every fork's thresholds, and one on the endpoints' stage
  // ("Outcome") collects where the routes end.
  const specs = ed.sections.length ? ed.sections : pendingEditorial(p).sections;
  const claimed = new Map<string, number>(); // step or explicitly listed node -> section index
  const pinned = new Set<string>(); // ids a section's `nodes` names
  specs.forEach((s, i) => {
    if (s.nodes && s.nodes.length) {
      for (const id of s.nodes) if (byId.has(id) && !claimed.has(id)) { claimed.set(id, i); pinned.add(id); }
    } else {
      for (const n of steps) if (n.stage === s.stage && !claimed.has(n.id)) claimed.set(n.id, i);
    }
  });
  // Steps no section claims still render, under their stage name, after the rest.
  const extra: { stage: string; heading: string }[] = [];
  for (const n of steps) {
    if (claimed.has(n.id)) continue;
    let k = extra.findIndex((x) => x.stage === n.stage);
    if (k < 0) {
      extra.push({ stage: n.stage, heading: n.stage });
      k = extra.length - 1;
    }
    claimed.set(n.id, specs.length + k);
  }
  const allSpecs: { stage: string; heading: string; intro?: string; nodes?: string[] }[] = [...specs, ...extra];

  // Endpoints that get their own entry in an Outcome-stage section, and so an anchor.
  const endSection = new Map<string, number>();
  allSpecs.forEach((s, i) => {
    for (const n of p.nodes) if (n.kind === 'end' && !endSection.has(n.id) && (pinned.has(n.id) ? claimed.get(n.id) === i : n.stage === s.stage)) endSection.set(n.id, i);
  });

  // Where a route goes, by id. An endpoint with no entry of its own reads in
  // full where it is reached, from one shared table (endText).
  const endText: Record<string, string> = {};
  const nextOf = (id: string): NextVM => {
    const n = byId.get(id);
    if (!n) return { kind: 'missing' };
    if (n.kind === 'step') return { kind: 'step', to: n.id };
    if (n.kind === 'branch') return { kind: 'fork', to: n.id };
    if (!endSection.has(n.id)) endText[n.id] = n.summary;
    return { kind: 'end', to: n.id };
  };

  const stepVM = (n: StepNode): StepVM => {
    const q = shuffleOptions(n.options, n.answer, `${p.id}:${n.id}`);
    const nx = nextOf(n.next);
    return {
      kind: 'step', id: n.id, stage: n.stage, ask: n.ask, chainStep: n.chainStep,
      ...(n.note ? { note: n.note } : {}),
      orders: orders(n.orders),
      calcs: opt((n.calcs || []).filter((c) => calcById.has(c))),
      options: q.options, answer: q.answer, why: n.why, cites: cites(n.sources),
      ...(nx.kind === 'end' ? { end: nx } : {}),
    };
  };

  const forkVM = (b: BranchNode): ForkVM => ({
    kind: 'fork', id: b.id, label: b.label,
    rows: b.outcomes.map((o) => {
      const { result, meaning } = splitIf(o.if);
      return {
        result, ...(meaning ? { meaning } : {}), next: nextOf(o.next), orders: orders(o.orders),
        lead: opt(o.ddx?.lead || []), out: opt(o.ddx?.out || []),
      };
    }),
  });

  // A fork renders right after the step that leads to it; a fork reached only
  // from another fork renders after that fork.
  const parentOf = new Map<string, string>();
  for (const b of branches) {
    if (pinned.has(b.id)) continue;
    const step = steps.find((s) => s.next === b.id);
    const viaFork = branches.find((x) => x.id !== b.id && x.outcomes.some((o) => o.next === b.id));
    if (step) parentOf.set(b.id, step.id);
    else if (viaFork) parentOf.set(b.id, viaFork.id);
  }
  const children = new Map<string, string[]>();
  parentOf.forEach((parent, child) => children.set(parent, (children.get(parent) || []).concat(child)));

  const placed = new Set<string>();
  const emit = (id: string, out: Block[]) => {
    if (placed.has(id)) return;
    const n = byId.get(id);
    if (!n || n.kind === 'end') return;
    placed.add(id);
    out.push(n.kind === 'step' ? stepVM(n) : forkVM(n));
    for (const c of children.get(id) || []) emit(c, out);
  };

  const indexStages = new Set(branches.map((b) => b.stage));
  const usedAnchors = new Set<string>();
  const sections: (SectionVM & { stage: string })[] = allSpecs.map((s, i) => {
    const blocks: Block[] = [];
    if (indexStages.has(s.stage) && !(s.nodes && s.nodes.length)) {
      blocks.push({ kind: 'forkIndex', forks: branches.filter((b) => b.stage === s.stage).map((b) => b.id) });
    }
    const order = s.nodes && s.nodes.length ? s.nodes : p.nodes.map((n) => n.id);
    for (const id of order) if (claimed.get(id) === i) emit(id, blocks);
    const ends = p.nodes.filter((n): n is EndNode => n.kind === 'end' && endSection.get(n.id) === i);
    if (ends.length) {
      blocks.push({
        kind: 'ends',
        items: ends.map((e): EndItemVM => {
          const { label, rest } = splitEnd(e.summary);
          const from: FromRef[] = [];
          for (const b of branches) b.outcomes.forEach((o, row) => { if (o.next === e.id) from.push({ fork: b.id, row }); });
          for (const st of steps) if (st.next === e.id) from.push({ step: st.id });
          return { id: e.id, ...(label ? { label } : {}), rest, from: opt(from) };
        }),
      });
    }
    let anchor = `s-${anchorize(s.stage) || i}`;
    while (usedAnchors.has(anchor)) anchor = `${anchor}-${i}`;
    usedAnchors.add(anchor);
    return { anchor, stage: s.stage, heading: s.heading, ...(s.intro ? { intro: s.intro } : {}), blocks };
  });
  // Anything still unplaced (a fork on a cycle, say) goes last, never dropped.
  const lastWithSteps = [...sections].reverse().find((s) => s.blocks.some((b) => b.kind === 'step')) || sections[sections.length - 1];
  for (const b of branches) if (!placed.has(b.id) && lastWithSteps) emit(b.id, lastWithSteps.blocks);
  const visible = sections.filter((s) => s.blocks.length > 0);
  const hasForkIndex = visible.some((s) => s.blocks.some((b) => b.kind === 'forkIndex'));

  // ---- at a glance: the typical route, from the first case's picks ----
  // Thresholds show here as chips unless a fork-index section already lists them.
  const picks = p.cases[0]?.picks || {};
  const glance: GlanceVM[] = [];
  {
    let cur = byId.get(p.start);
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id) && glance.length < 14) {
      seen.add(cur.id);
      if (cur.kind === 'step') {
        glance.push({ step: cur.id, forks: [] });
        cur = byId.get(cur.next);
      } else if (cur.kind === 'branch') {
        const b: BranchNode = cur;
        const row = glance[glance.length - 1];
        if (row) row.forks.push(b.id);
        const pick = b.outcomes.find((o) => o.id === picks[b.id])
          || b.outcomes.find((o) => byId.get(o.next)?.kind !== 'end')
          || b.outcomes[0];
        cur = pick ? byId.get(pick.next) : undefined;
      } else break;
    }
  }

  // ---- bedside math ----
  const calculators: CalcVM[] = (p.calculators || []).map((c) => {
    const { tests: _t, sources, ...rest } = c;
    return {
      ...rest, cites: cites(sources),
      usedBy: opt(steps.filter((s) => (s.calcs || []).includes(c.id)).map((s) => s.id)),
    };
  });

  // ---- where the guidelines disagree: every conflict order, once, by location ----
  const disagree: DisagreeVM[] = [];
  const seenConflict = new Set<string>();
  const addConflicts = (os: Order[] | undefined, at: { node: string; row?: number }) => {
    (os || []).forEach((o, order) => {
      const key = `${o.item}\u0000${o.dose}`;
      if (o.status !== 'conflict' || seenConflict.has(key)) return;
      seenConflict.add(key);
      disagree.push({ ...at, order });
    });
  };
  for (const n of p.nodes) {
    if (n.kind === 'step') addConflicts(n.orders, { node: n.id });
    if (n.kind === 'branch') n.outcomes.forEach((o, row) => addConflicts(o.orders, { node: n.id, row }));
  }

  // ---- practice patients: three cases that between them walk the most forks ----
  const walk = (c: Pathway['cases'][number]): CaseVM['forks'] => {
    const forks: CaseVM['forks'] = [];
    let cur = byId.get(p.start);
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      if (cur.kind === 'step') cur = byId.get(cur.next);
      else if (cur.kind === 'branch') {
        const b: BranchNode = cur;
        const row = b.outcomes.findIndex((x) => x.id === c.picks[b.id]);
        if (row < 0) break;
        // Resolve the row's next now so an unlisted endpoint lands in endText.
        nextOf(b.outcomes[row].next);
        forks.push({ fork: b.id, row, ...(c.results[b.id] ? { result: c.results[b.id] } : {}) });
        cur = byId.get(b.outcomes[row].next);
      } else break;
    }
    return forks;
  };
  const chosen: number[] = [];
  const covered = new Set<string>();
  while (chosen.length < Math.min(3, p.cases.length)) {
    let best = -1;
    let gain = -1;
    p.cases.forEach((c, i) => {
      if (chosen.includes(i)) return;
      const g = Object.entries(c.picks).filter(([k, v]) => !covered.has(`${k}=${v}`)).length;
      if (g > gain) {
        gain = g;
        best = i;
      }
    });
    if (best < 0) break;
    chosen.push(best);
    for (const [k, v] of Object.entries(p.cases[best].picks)) covered.add(`${k}=${v}`);
  }
  const cases: CaseVM[] = chosen.sort((a, b) => a - b).map((i) => {
    const c = p.cases[i];
    return { id: c.id, label: c.label, vignette: c.vignette, forks: walk(c) };
  });

  // ---- related pathways and the guides around them ----
  const pub = new Map(published.map((e) => [e.pathway.id, e]));
  const related: { slug: string; title: string }[] = [];
  const addRel = (id: string) => {
    const e = pub.get(id);
    if (!e || id === p.id || related.some((r) => r.slug === e.slug) || related.length >= 4) return;
    related.push({ slug: e.slug, title: e.pathway.title });
  };
  for (const r of ed.related || []) addRel(idOf(r));
  if (related.length < 4) {
    const mine = new Set(p.differential);
    published
      .filter((e) => e.pathway.id !== p.id)
      .map((e) => ({ e, shared: e.pathway.differential.filter((d) => mine.has(d)).length, same: e.pathway.world === p.world ? 1 : 0 }))
      .filter((x) => x.shared > 0 || x.same > 0)
      .sort((a, b) => b.shared - a.shared || b.same - a.same)
      .forEach((x) => addRel(x.e.pathway.id));
  }

  const also: LinkVM[] = [];
  const guideSlug = WORLDS[p.world]?.guide;
  const guide = guideSlug ? getGuide(guideSlug) : null;
  if (guide) also.push({ href: `/guides/${guide.meta.slug}`, label: guide.meta.clerkship, kind: 'Shelf guide' });
  const em = getGuide('emergency-medicine');
  if (em && guideSlug !== 'emergency-medicine') also.push({ href: '/guides/emergency-medicine', label: em.meta.clerkship, kind: 'Shelf guide' });
  if (fs.existsSync(ED_ARTICLE_PAGE)) also.push({ href: '/step-2-ck-emergency-medicine', label: 'The next best step in the ED', kind: 'Study guide' });
  also.push({ href: '/readiness', label: 'Readiness check', kind: 'Tool' });

  // ---- jump links ----
  const jump: { label: string; anchor: string }[] = [];
  for (const j of ed.jumpLinks || []) {
    const sec = visible.find((s) => s.stage.toLowerCase() === String(j.stage).toLowerCase());
    const anchor = sec ? sec.anchor : SPECIAL_ANCHORS[String(j.stage).toLowerCase()];
    if (anchor && !jump.some((x) => x.anchor === anchor)) jump.push({ label: j.label, anchor });
  }

  const checklist = ed.checklist && ed.checklist.items?.length
    ? {
        heading: ed.checklist.heading,
        items: ed.checklist.items.map((it) => {
          if (it.label) return { label: it.label, text: it.text };
          const l = leadOf(it.text, 10, 64);
          return { label: l.lead, text: l.text };
        }),
      }
    : null;
  const rounds = ed.rounds && (ed.rounds.present || ed.rounds.pimp?.length)
    ? { present: presentVM(ed.rounds.present), pimp: (ed.rounds.pimp || []).map((x) => ({ q: x.q, a: x.a })) }
    : null;
  const faq = (ed.faq || []).map((f) => ({ q: f.q, a: f.a }));
  // A trap's first sentence names it ("Insulin before fluid."); the rest says why.
  const traps: Lead[] = (ed.traps || []).map((t) => {
    const ss = sentencesOf(t.text);
    return ss.length > 1 ? { lead: ss[0], text: ss.slice(1).join(' ') } : { lead: null, text: t.text };
  });
  // Each short-answer line carries the sources behind the nodes its `refs` point
  // at (a step's own and its orders', a fork's orders', a calculator's), as
  // indexes into the article's sources: the mono source line under the line.
  const srcOfRefs = (refs: string[] | undefined): number[] | undefined => {
    const out: number[] = [];
    const add = (rs: SourceRef[] | undefined) => {
      for (const r of rs || []) {
        const i = srcIndex.get(r.docId);
        if (i !== undefined && !out.includes(i)) out.push(i);
      }
    };
    for (const ref of refs || []) {
      if (ref.startsWith('calc:')) {
        add(calcById.get(ref.slice(5))?.sources);
        continue;
      }
      const n = byId.get(ref);
      if (!n) continue;
      if (n.kind === 'step') {
        add(n.sources);
        for (const o of n.orders || []) add(o.sources);
      } else if (n.kind === 'branch') {
        for (const oc of n.outcomes) for (const o of oc.orders || []) add(o.sources);
      }
    }
    return opt(out);
  };
  const shortAnswer = (ed.shortAnswer || []).map((s) => ({ lead: s.lead, text: s.text, src: srcOfRefs(s.refs) }));

  // ---- reading time: the text a reader sees without clicking, at 230 words a minute ----
  const stepById = new Map<string, StepVM>();
  const forkById = new Map<string, ForkVM>();
  for (const s of visible) for (const b of s.blocks) {
    if (b.kind === 'step') stepById.set(b.id, b);
    if (b.kind === 'fork') forkById.set(b.id, b);
  }
  const nextWords = (n: NextVM): number => {
    if (!n.to) return 0;
    if (n.kind === 'step') return words(stepById.get(n.to)?.chainStep);
    if (n.kind === 'fork') return words(forkById.get(n.to)?.label);
    const e = byId.get(n.to);
    if (!e || e.kind !== 'end') return 0;
    const { label } = splitEnd(e.summary);
    return words(endSection.has(e.id) && label ? label : e.summary);
  };
  let wc = words(ed.dek) + shortAnswer.reduce((a, s) => a + words(s.lead) + words(s.text), 0);
  for (const s of visible) {
    wc += words(s.heading) + words(s.intro);
    for (const b of s.blocks) {
      if (b.kind === 'step') {
        // The quick check's options and rationale stay hidden until a pick, so they are not counted.
        wc += words(b.ask) + words(b.chainStep) + words(b.note);
        wc += (b.orders || []).reduce((a, o) => a + words(o.item) + words(o.dose) + words(o.note), 0);
      } else if (b.kind === 'fork') {
        wc += b.rows.reduce((a, r) => a + words(r.result) + words(r.meaning) + nextWords(r.next), 0);
      } else if (b.kind === 'ends') {
        wc += b.items.reduce((a, e) => a + words(e.label) + words(e.rest), 0);
      }
    }
  }
  wc += (checklist?.items || []).reduce((a, i) => a + words(i.label) + words(i.text), 0);
  wc += (rounds?.pimp || []).reduce((a, x) => a + words(x.q) + words(x.a), 0);
  wc += traps.reduce((a, t) => a + words(t.lead) + words(t.text), 0) + faq.reduce((a, f) => a + words(f.q) + words(f.a), 0);
  wc += cases.reduce((a, c) => a + words(c.vignette), 0);

  // The differential diagnoses the fork tables actually name ("Leading: ..."),
  // for structured data: a name in JSON-LD should be on the page.
  const named = new Set<string>();
  for (const b of Array.from(forkById.values())) for (const r of b.rows) for (const d of [...(r.lead || []), ...(r.out || [])]) named.add(d);
  const mentions = p.differential.filter((d) => named.has(d));

  const short = shortName(p.title);
  const draft = !entry.live;
  return plain({
    id: p.id, slug: entry.slug, title: p.title, short, worldLabel: worldLabel(p.world),
    signedOff: entry.signedOff, reviewedDate: entry.signedOff ? ed.signedOffDate || ed.updated || null : null,
    draft, editorialPending: entry.source === 'pending', fixture: entry.source === 'fixture',
    seoTitle: ed.seoTitle, metaDescription: ed.metaDescription, h1: ed.h1, dek: ed.dek || '', updated: ed.updated || null,
    counts: { steps: steps.length, forks: branches.length, sources: p.sources.length, cases: p.cases.length, minutes: Math.max(1, Math.round(wc / 230)) },
    jump, shortAnswer, glance, glanceChips: !hasForkIndex,
    // `stage` matched the jump links above; the page never reads it.
    sections: visible.map(({ stage: _s, ...rest }) => rest),
    checklist, calculators, rounds, traps, disagree, cases, faq,
    sources: p.sources.map((s) => ({ label: s.label, title: s.title, url: s.url })),
    cites: citeTable, endText, mentions, related, also,
    appCount: allPathways().length, searchTerm: p.synonyms[0] || short,
  });
}

// ---------------------------------------------------------------- the hub

export type HubCard = {
  slug: string; title: string; world: string; first: string; trap: string | null;
  steps: number; cases: number; draft: boolean; pending: boolean; haystack: string;
};
export type HubVM = {
  groups: { world: string; label: string; cards: HubCard[] }[];
  counts: { pathways: number; cases: number; sources: number };
  anyDraft: boolean; noindex: boolean;
  /** The newest article date: the hub's dateModified and sitemap lastmod. */
  updated: string | null;
};

export function buildHub(published: Entry[]): HubVM {
  const cards: HubCard[] = published.map((e) => {
    const p = e.pathway;
    const start = p.nodes.find((n) => n.id === p.start);
    const first = start && start.kind === 'step' ? start.chainStep : '';
    const trap = e.editorial.traps && e.editorial.traps[0] ? strip(e.editorial.traps[0].text) : null;
    const haystack = [p.title, ...p.synonyms].join(' | ').toLowerCase();
    return {
      slug: e.slug, title: p.title, world: p.world, first, trap,
      steps: p.nodes.filter((n) => n.kind === 'step').length, cases: p.cases.length,
      draft: !e.live, pending: e.source === 'pending', haystack,
    };
  });
  const worlds = Object.keys(WORLDS).concat(cards.map((c) => c.world)).filter((w, i, a) => a.indexOf(w) === i);
  const groups = worlds
    .map((w) => ({ world: w, label: worldLabel(w), cards: cards.filter((c) => c.world === w).sort((a, b) => a.title.localeCompare(b.title)) }))
    .filter((g) => g.cards.length);
  const sources = new Set(published.flatMap((e) => e.pathway.sources.map((s) => s.docId)));
  const anyDraft = cards.some((c) => c.draft);
  const updated = published.map((e) => e.editorial.updated).filter(Boolean).sort().pop() || null;
  return plain({
    groups,
    counts: { pathways: cards.length, cases: published.reduce((a, e) => a + e.pathway.cases.length, 0), sources: sources.size },
    anyDraft, noindex: anyDraft || cards.length === 0, updated,
  });
}

/** Sitemap rows: live articles only (published or signed off), in every
 *  environment (a draft is noindex, so listing it would contradict the page).
 *  The hub joins with the first live article, its lastmod the newest of theirs. */
export function sitemapPathways(): { path: string; lastmod: string | null }[] {
  // The sitemap renders per request, so this reads the small editorial files and
  // opens a pathway file only for an article that is live.
  const out: { path: string; lastmod: string | null }[] = [];
  if (!fs.existsSync(ED_DIR)) return out;
  const live: { slug: string; updated: string | null }[] = [];
  for (const name of fs.readdirSync(ED_DIR).filter((n) => n.endsWith('.json')).sort()) {
    const slug = name.slice(0, -'.json'.length);
    let found: ReturnType<typeof readEditorial> = null;
    try {
      found = readEditorial(slug);
    } catch (err) {
      // The build already refuses a malformed file; at request time skip it
      // rather than fail the whole sitemap.
      console.error(`sitemap: skipping pathway article ${slug}: ${(err as Error).message}`);
      continue;
    }
    if (!found || found.source !== 'file' || !isLive(found.ed)) continue;
    const file = path.join(PW_DIR, `${idOf(slug).replace(/^pw_/, '')}.json`);
    if (!fs.existsSync(file)) continue;
    const p = JSON.parse(fs.readFileSync(file, 'utf8')) as Pathway;
    if (p.status !== 'approved' || slugOf(p.id) !== slug) continue;
    live.push({ slug, updated: found.ed.updated || null });
  }
  if (!live.length) return out;
  const latest = live.map((e) => e.updated).filter(Boolean).sort().pop() || null;
  out.push({ path: '/pathways', lastmod: latest });
  for (const e of live) out.push({ path: `/pathways/${e.slug}`, lastmod: e.updated });
  return out;
}
