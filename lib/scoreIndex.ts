// The published NBME-to-Step-2 outcome index, served at /data/nbme-step2.
//
// Generated in the app repo by scripts/gen_score_index.py from two
// independently sampled cohorts (de-identified r/step2 score-release reports,
// and first-party post-exam reports from the app), then copied here as
// lib/score_index.v1.json. public/data/nbme-step2.v1.{json,csv} are the same
// build, served for download; they must come from the same generator run.
//
// Every number the page states reads through this module, so the copy cannot
// drift from the data. Nothing here invents a statistic: a cell thinner than
// `minCell` arrives suppressed and must be rendered as a count only.
import RAW from './score_index.v1.json';

export type Cell = {
  n: number;
  suppressed: boolean;
  medianPrinted?: number;
  medianActual?: number;
  medianDelta?: number;
  p25Actual?: number;
  p75Actual?: number;
  deltaP25?: number;
  deltaP75?: number;
};

export type FormCell = Cell & { bands: Record<string, Cell> };

export type Level = {
  n: number;
  suppressed: boolean;
  medianActual?: number;
  meanActual?: number;
  sdActual?: number;
  minActual?: number;
  maxActual?: number;
  vsNationalMean?: number;
};

export type Cohort = { pairs: number; students: number; level: Level; forms: Record<string, FormCell> };
export type CohortName = 'forum' | 'app';

type Doc = {
  version: number;
  generatedAt: string;
  generatedBy: string;
  license: string;
  citeAs: string;
  minCell: number;
  national: { mean: number; sd: number; population: string; source: string };
  readThisFirst: { forum: string; app: string; both: string };
  cohorts: Record<string, Cohort>;
};

const DOC = RAW as unknown as Doc;

export const INDEX = DOC;
export const FORUM: Cohort = DOC.cohorts.forum;
export const APP: Cohort | undefined = DOC.cohorts.app;
export const NATIONAL = DOC.national;
export const MIN_CELL = DOC.minCell;

export const TOTAL_PAIRS = Object.values(DOC.cohorts).reduce((s, c) => s + c.pairs, 0);
export const TOTAL_STUDENTS = Object.values(DOC.cohorts).reduce((s, c) => s + c.students, 0);

/** The downloads, served from public/data. Same generator run as lib/score_index.v1.json. */
export const DOWNLOAD = {
  csv: `/data/nbme-step2.v${DOC.version}.csv`,
  json: `/data/nbme-step2.v${DOC.version}.json`,
};

export const BANDS = ['below 230', '230 to 239', '240 to 249', '250 to 259', '260 and up'] as const;
export type Band = typeof BANDS[number];

/** Which printed-score band a score falls in, or null if it is not a plausible score. */
export function bandOf(score: number): Band | null {
  if (!Number.isFinite(score) || score < 100 || score > 300) return null;
  if (score < 230) return 'below 230';
  if (score < 240) return '230 to 239';
  if (score < 250) return '240 to 249';
  if (score < 260) return '250 to 259';
  return '260 and up';
}

/** Sentence case for a band label at the head of a row. */
export const bandTitle = (b: string): string => b.charAt(0).toUpperCase() + b.slice(1);

export const cohort = (name: CohortName): Cohort | undefined => DOC.cohorts[name];

export const formCell = (name: CohortName, slug: string): FormCell | undefined =>
  DOC.cohorts[name]?.forms[slug];

export const bandCell = (name: CohortName, slug: string, band: Band): Cell | undefined =>
  DOC.cohorts[name]?.forms[slug]?.bands[band];

/** A cell carries statistics only when the generator did not suppress it. */
export const usable = (c?: Cell): c is Cell & { medianActual: number } =>
  !!c && !c.suppressed && c.medianActual != null;

/** 259 not 259.0, 16.5 kept. Numbers reach the page as strings so no row re-rounds. */
export function fmt(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return '--';
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

/** A delta always carries its sign: +16, 0, -4. */
export function signed(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return '--';
  const s = fmt(n);
  return n > 0 ? `+${s}` : s;
}

// generatedAt is UTC; both of these render it in Central, which is the clock
// the project reports in, and which also keeps the server and client render
// identical for a visitor in another timezone.
const CENTRAL = 'America/Chicago';

export const generatedOn = (): string =>
  new Date(DOC.generatedAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: CENTRAL,
  });

/** YYYY-MM-DD in Central, for schema.org dateModified. */
export const generatedDate = (): string =>
  new Date(DOC.generatedAt).toLocaleDateString('en-CA', { timeZone: CENTRAL });
