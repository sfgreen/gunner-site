import type { FitStat } from './types';
import countsData from './clerkship_counts.json';

// Auto-computed clerkship card counts. The single source of truth is the app repo
// (stepgunner), where scripts/gen_clerkship_counts.py reads the live card JSON and
// emits scripts/clerkship_counts.json, keyed by rotation id (pediatrics,
// internal_medicine, ...). That file is copied verbatim into
// lib/guides/clerkship_counts.json here, so the /guides "Step Gunner fit" numbers
// update whenever content ships, instead of being hand-typed per rotation.
//
// WHAT WE RENDER: the rounded-down marketing floors in each rotation's `display`
// block (e.g. total 2903 -> "2900+", 367 -> "350+"), not the raw integers. Danny
// wants clean rounded "N+" strings; the raw `decks` integers are still used to
// decide WHICH decks to show (a deck with a raw count of 0 is dropped, never
// rendered as "0+"). The "+" already lives in the display strings.
//
// TO REFRESH AFTER CONTENT CHANGES (do this in the app repo, then rebuild the site):
//   1. cd into the app repo (~/workspace/gunner)
//   2. functions/venv/bin/python scripts/gen_clerkship_counts.py
//   3. cp scripts/clerkship_counts.json gunner-site-repo/lib/guides/clerkship_counts.json
//   4. npm run build
// Do NOT read the sibling app repo at build time. Vercel only has this repo, so the
// committed JSON is the robust default.
//
// No em or en dashes anywhere.

/** The five card decks a rotation can carry, matching the gen script's keys. */
export type DeckKey = 'ckGold' | 'nbs' | 'buzzwords' | 'dxBuzzwords' | 'visualDx';

export interface DeckCounts {
  ckGold: number;
  nbs: number;
  buzzwords: number;
  dxBuzzwords: number;
  visualDx: number;
}

/** Rounded-down "N+" strings per deck plus the headline total, as authored by the
 *  gen script. These are what the page renders. */
export interface DeckDisplay {
  ckGold: string;
  nbs: string;
  buzzwords: string;
  dxBuzzwords: string;
  visualDx: string;
  total: string;
}

export interface RotationCounts {
  displayName: string;
  decks: DeckCounts;
  total: number;
  display: DeckDisplay;
}

interface CountsFile {
  rotations: Record<string, RotationCounts>;
}

const rotations = (countsData as CountsFile).rotations;

/** Counts for one rotation, keyed by the gen script's rotation id. Throws (at build
 *  time, in getStaticProps) if the id is missing, so a typo fails loud, not silent. */
export function deckCounts(rotationId: string): RotationCounts {
  const r = rotations[rotationId];
  if (!r) {
    const known = Object.keys(rotations).join(', ');
    throw new Error(
      `No clerkship counts for rotation "${rotationId}". Known ids: ${known}. ` +
        'Regenerate lib/guides/clerkship_counts.json from the app repo.',
    );
  }
  return r;
}

const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];

/** How many decks a rotation actually has content in, spelled out ("four"). Counts
 *  raw integers, so it stays honest as decks fill in or empty out, and drives the
 *  "across N study modes" line. */
export function modeWord(rotationId: string): string {
  const c = deckCounts(rotationId);
  const active = (Object.keys(c.decks) as DeckKey[]).filter((k) => c.decks[k] > 0).length;
  return NUM_WORDS[active] ?? String(active);
}

/** A stat's label and one-liner. The number is filled in from the live counts, and
 *  a deck with zero cards is dropped, so a rotation only shows the modes it has. */
export interface DeckLabel {
  deck: DeckKey;
  /** Stat label, e.g. "CK Gold, IM". */
  k: string;
  /** One-line description. */
  d: string;
}

/** Build the FitStat[] for the "Step Gunner fit" stats grid: number auto-filled from
 *  the rotation's rounded `display` strings, decks with a raw count of 0 omitted. A
 *  rotation that later gains Visual Dx images (like IM's 102) grows a row with no
 *  copy edit here. */
export function fitStats(rotationId: string, labels: DeckLabel[]): FitStat[] {
  const c = deckCounts(rotationId);
  return labels
    .filter((l) => c.decks[l.deck] > 0)
    .map((l) => ({ n: c.display[l.deck], k: l.k, d: l.d }));
}
