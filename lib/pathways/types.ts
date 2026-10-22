// The two layers a pathway page is built from.
//
// 1. Pathway: content/pathways/<id>.json, copied verbatim from the app repo's
//    content_staging/pathways by scripts/sync_pathways.mjs (decision 0044 schema).
//    Doses, forks, quick checks, conflicts, cases and sources all come from here.
// 2. Editorial: content/pathway-articles/<slug>.json, the per-pathway article
//    layer (hero, short answer, section questions, checklist, rounds, traps, FAQ,
//    related) and the publishing gate (`published`, `signedOff`). `refs` are
//    audit pointers back into the pathway. They are never rendered as such;
//    the short answer shows the sources of the nodes its refs name.
import type { Calculator } from './calc';

export type SourceRef = { docId: string; where?: string };

export type Order = {
  item: string;
  dose: string;
  status: 'ok' | 'avoid' | 'conflict' | 'pending';
  sources?: SourceRef[];
  note?: string;
};

export type StepNode = {
  id: string;
  kind: 'step';
  stage: string;
  ask: string;
  options: string[];
  answer: number;
  chainStep: string;
  why: string;
  next: string;
  sources: SourceRef[];
  orders?: Order[];
  note?: string;
  calcs?: string[];
};

export type Outcome = {
  id: string;
  if: string;
  next: string;
  ddx?: { lead: string[]; out: string[] };
  orders?: Order[];
};

export type BranchNode = { id: string; kind: 'branch'; stage: string; label: string; outcomes: Outcome[] };
export type EndNode = { id: string; kind: 'end'; stage?: string; summary: string };
export type PathwayNode = StepNode | BranchNode | EndNode;

export type PathwayCase = {
  id: string;
  label: string;
  vignette: string;
  picks: Record<string, string>;
  results: Record<string, string>;
};

export type Pathway = {
  id: string;
  title: string;
  world: string;
  synonyms: string[];
  reviewBy: string;
  status: string;
  sources: { docId: string; label: string; title: string; url: string }[];
  differential: string[];
  start: string;
  nodes: PathwayNode[];
  cases: PathwayCase[];
  calculators?: Calculator[];
};

// ---- editorial ----

type Refs = { refs?: string[] };
export type EdText = { text: string } & Refs;

export type Editorial = {
  id: string;
  slug: string;
  /** On the site: generated, indexed, listed, in the sitemap. Not a review claim. */
  published?: boolean;
  /** Danny's per-pathway medical read: the only flag behind "Medically reviewed by". */
  signedOff: boolean;
  /** Optional: the sign-off date for MedicalWebPage.lastReviewed; falls back to `updated`. */
  signedOffDate?: string;
  updated: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  dek: string;
  jumpLinks?: { label: string; stage: string }[];
  shortAnswer?: ({ lead: string } & EdText)[];
  /** One per node stage, in pathway order. `nodes` (optional, not in the base
   *  schema) pins an explicit node list when one stage is too broad for one H2. */
  sections: ({ stage: string; heading: string; intro?: string; nodes?: string[] } & Refs)[];
  checklist?: { heading: string; items: ({ label?: string } & EdText)[] } | null;
  rounds?: {
    present: RoundsPresent;
    pimp?: ({ q: string; a: string } & Refs)[];
  } | null;
  traps?: EdText[];
  faq?: ({ q: string; a: string } & Refs)[];
  related?: string[];
};

/** How a student presents the patient. The base schema leaves the shape open, so
 *  the page reads a paragraph, a list of paragraphs, or a structured one-liner
 *  with a numbered assessment and plan. */
export type RoundsPresent =
  | string
  | string[]
  | {
      intro?: string;
      oneLiner?: string;
      plan?: (string | ({ lead?: string } & EdText))[];
    }
  | null
  | undefined;
