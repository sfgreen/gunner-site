// The pathway article's view model as it travels to the browser, and the lookup
// that turns its references back into text. Client-safe (no fs): the pages
// import it at runtime, lib/pathways/data imports it to build the model.
//
// WHY REFERENCES. Everything in the model is rendered, so the page data is the
// article itself, and six articles went past Next's 128 kB page-data warning
// (environmental 174 kB). Most of the excess was the same text shipped twice:
// a fork row's "next step" repeats the step it links to, the disagreement table
// repeats its orders, forty orders cite the same guideline line. So each string
// ships once and a block points at it by id; `lookupOf` rebuilds the text on the
// server render and in the browser alike, so the HTML is unchanged.
import type { Calculator } from './calc';

export const nodeAnchor = (id: string): string => `n-${id}`;
export const forkAnchor = (id: string): string => `f-${id}`;
export const endAnchor = (id: string): string => `e-${id}`;
export const calcAnchor = (id: string): string => `calc-${id}`;

/** A citation. `src` indexes the article's `sources`; -1 is a docId the pathway
 *  does not list (the content gate forbids it), and `label` then names it. */
export type Cite = { src: number; where?: string; label?: string };
/** Indexes into the article's `cites`: each distinct citation ships once. */
export type CiteRefs = number[];

/** `status` is omitted for 'ok', the common case. */
export type OrderVM = { item: string; dose: string; status?: 'avoid' | 'conflict' | 'pending'; note?: string; cites?: CiteRefs };
export type OrderStatus = 'ok' | 'avoid' | 'conflict' | 'pending';

/** Where a fork outcome or a step leads: a node id the lookup resolves. */
export type NextVM = { kind: 'step' | 'fork' | 'end' | 'missing'; to?: string };

export type StepVM = {
  kind: 'step'; id: string; stage: string; ask: string; chainStep: string; note?: string;
  orders?: OrderVM[]; calcs?: string[]; options: string[]; answer: number; why: string; cites?: CiteRefs;
  /** Set when this step is the last on its route. */
  end?: NextVM;
};
export type ForkRowVM = { result: string; meaning?: string; next: NextVM; orders?: OrderVM[]; lead?: string[]; out?: string[] };
export type ForkVM = { kind: 'fork'; id: string; label: string; rows: ForkRowVM[] };
/** A Result-stage section: every fork's thresholds, each linking to its table. */
export type ForkIndexVM = { kind: 'forkIndex'; forks: string[] };
/** Which result or step reaches an endpoint: a fork row, or a step. */
export type FromRef = { fork: string; row: number } | { step: string };
export type EndItemVM = { id: string; label?: string; rest: string; from?: FromRef[] };
/** An Outcome-stage section: where the routes end, and which results lead there. */
export type EndsVM = { kind: 'ends'; items: EndItemVM[] };
export type Block = StepVM | ForkVM | ForkIndexVM | EndsVM;
export type SectionVM = { anchor: string; heading: string; intro?: string; blocks: Block[] };

/** One row of the at-a-glance route: a step, and the forks right after it. */
export type GlanceVM = { step: string; forks: string[] };
/** A practice patient's walk: at each fork, the row it takes and its own result. */
export type CaseVM = { id: string; label: string; vignette: string; forks: { fork: string; row: number; result?: string }[] };
/** A "Sources differ" order, located on its step or fork row. */
export type DisagreeVM = { node: string; row?: number; order: number };
export type CalcVM = Omit<Calculator, 'tests' | 'sources'> & { cites?: CiteRefs; usedBy?: string[] };
export type LinkVM = { href: string; label: string; kind: string };
export type Lead = { lead: string | null; text: string };
export type PresentVM = { intro: string | null; oneLiner: string | null; paragraphs: Lead[]; plan: Lead[] };

export type ArticleVM = {
  id: string; slug: string; title: string; short: string; worldLabel: string;
  signedOff: boolean; reviewedDate: string | null;
  /** Not published and not signed off: a preview-only draft (banner + noindex). */
  draft: boolean; editorialPending: boolean; fixture: boolean;
  seoTitle: string; metaDescription: string; h1: string; dek: string; updated: string | null;
  counts: { steps: number; forks: number; sources: number; cases: number; minutes: number };
  jump: { label: string; anchor: string }[];
  /** `src`: indexes into `sources`, the sources behind the nodes the line's refs name. */
  shortAnswer: { lead: string; text: string; src?: number[] }[];
  glance: GlanceVM[];
  /** Thresholds show as chips in the glance unless a fork-index section lists them. */
  glanceChips: boolean;
  sections: SectionVM[];
  checklist: { heading: string; items: { label: string | null; text: string }[] } | null;
  calculators: CalcVM[];
  rounds: { present: PresentVM | null; pimp: { q: string; a: string }[] } | null;
  traps: Lead[];
  disagree: DisagreeVM[];
  cases: CaseVM[];
  faq: { q: string; a: string }[];
  sources: { label: string; title: string; url: string }[];
  cites: Cite[];
  /** Endpoint summaries with no entry of their own on the page, by node id. */
  endText: Record<string, string>;
  /** Differential diagnoses the fork tables name, for structured data. */
  mentions: string[];
  related: { slug: string; title: string }[];
  also: LinkVM[];
  appCount: number;
  searchTerm: string;
};

// ---------------------------------------------------------------- the lookup

export type Resolved = { kind: NextVM['kind']; text: string; anchor: string | null };

export type Lookup = {
  step: (id: string) => StepVM | undefined;
  fork: (id: string) => ForkVM | undefined;
  calc: (id: string) => CalcVM | undefined;
  /** The text and anchor a NextVM stands for. */
  next: (n: NextVM | undefined) => Resolved;
  /** A fork row as "Fork label: result". */
  rowLabel: (fork: string, row: number) => string;
  /** An order a DisagreeVM points at, with the step or fork row it sits on. */
  order: (d: DisagreeVM) => { order: OrderVM; context: string; anchor: string } | null;
  cites: (refs: CiteRefs | undefined) => Cite[];
};

export function lookupOf(vm: ArticleVM): Lookup {
  const steps = new Map<string, StepVM>();
  const forks = new Map<string, ForkVM>();
  const ends = new Map<string, EndItemVM>();
  for (const s of vm.sections) {
    for (const b of s.blocks) {
      if (b.kind === 'step') steps.set(b.id, b);
      else if (b.kind === 'fork') forks.set(b.id, b);
      else if (b.kind === 'ends') for (const e of b.items) ends.set(e.id, e);
    }
  }
  const calcs = new Map(vm.calculators.map((c) => [c.id, c]));
  const none: Resolved = { kind: 'missing', text: '', anchor: null };

  const next = (n: NextVM | undefined): Resolved => {
    if (!n || !n.to) return none;
    if (n.kind === 'step') {
      const s = steps.get(n.to);
      return s ? { kind: 'step', text: s.chainStep, anchor: nodeAnchor(s.id) } : none;
    }
    if (n.kind === 'fork') {
      const f = forks.get(n.to);
      return f ? { kind: 'fork', text: f.label, anchor: forkAnchor(f.id) } : none;
    }
    if (n.kind === 'end') {
      // An endpoint with its own entry links there by its short label; any other
      // reads in full where it is reached.
      const e = ends.get(n.to);
      if (e) return { kind: 'end', text: e.label || e.rest, anchor: endAnchor(e.id) };
      const t = vm.endText[n.to];
      return t ? { kind: 'end', text: t, anchor: null } : none;
    }
    return none;
  };

  const rowLabel = (fork: string, row: number): string => {
    const f = forks.get(fork);
    return f && f.rows[row] ? `${f.label}: ${f.rows[row].result}` : '';
  };

  const order = (d: DisagreeVM) => {
    if (d.row === undefined) {
      const s = steps.get(d.node);
      const o = s?.orders?.[d.order];
      return s && o ? { order: o, context: s.ask, anchor: nodeAnchor(s.id) } : null;
    }
    const f = forks.get(d.node);
    const o = f?.rows[d.row]?.orders?.[d.order];
    return f && o ? { order: o, context: rowLabel(f.id, d.row), anchor: forkAnchor(f.id) } : null;
  };

  return {
    step: (id) => steps.get(id),
    fork: (id) => forks.get(id),
    calc: (id) => calcs.get(id),
    next,
    rowLabel,
    order,
    cites: (refs) => (refs || []).map((i) => vm.cites[i]).filter(Boolean),
  };
}
