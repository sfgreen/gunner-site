// "Share a question, not a score": the friend's page at stepgunner.com/q/<slug>
// (pages/q/[slug].tsx). A student who gets a question most students miss can send
// it; the friend answers it here, free, with no sign-up.
//
// Pure functions, no imports, so `node --test scripts/test_share_question.mjs` runs
// this exact file. The file loader is lib/shareQuestionServer.ts (server only).

/** One row of data/share/questions.json, as the export script writes it. */
export type ShareQuestionRow = {
  slug: string;
  key: string;
  deck: string;
  deckLabel: string;
  world: string;
  tint: string;
  stem: string;
  /** Empty on most Buzzwords rows: the stem is the prompt ("Aschoff's bodies?"). */
  question: string;
  choices: string[];
  /** The exact text of the right choice. */
  answer: string;
  explanation: string;
  /** Students who answered it, and how many got it right on the first try. */
  tried: number;
  right: number;
  /** Questions in the deck, for "2,530 CK Gold questions like this". Optional:
   *  without it the line says "More CK Gold questions like this". */
  deckCount?: number;
};

/** What the page gets: the choices in a fixed per-question order and the answer as
 *  an index into them. */
export type ShareQuestion = {
  slug: string;
  deck: string;
  deckLabel: string;
  stem: string;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  tried: number;
  right: number;
  deckCount: number | null;
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
const count = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** Why a row cannot become a page, or null when it can. */
export function rowProblem(r: unknown): string | null {
  if (!r || typeof r !== 'object') return 'not an object';
  const o = r as Record<string, unknown>;
  if (typeof o.slug !== 'string' || !SLUG_RE.test(o.slug)) return 'slug must be lower-case letters, digits and hyphens';
  for (const f of ['deck', 'deckLabel', 'stem', 'answer', 'explanation']) {
    if (!text(o[f])) return `${f} is empty`;
  }
  if (typeof o.question !== 'string') return 'question must be a string (empty when the stem is the prompt)';
  const ch = o.choices;
  if (!Array.isArray(ch) || ch.length < 2 || ch.length > 6 || !ch.every(text)) return 'choices must be 2 to 6 non-empty strings';
  if (new Set(ch).size !== ch.length) return 'choices repeat';
  if (!ch.includes(o.answer)) return 'answer is not one of the choices';
  if (!count(o.tried) || (o.tried as number) < 1) return 'tried must be a whole number above 0';
  if (!count(o.right) || (o.right as number) > (o.tried as number)) return 'right must be a whole number from 0 to tried';
  if (o.deckCount !== undefined && (!count(o.deckCount) || (o.deckCount as number) < 1)) return 'deckCount must be a whole number above 0';
  return null;
}

/** "N in 10" who get it right on the first try, held to 1..9 so no line ever says
 *  0 or 10 in 10. */
export function rightIn10(right: number, tried: number): number {
  return Math.min(9, Math.max(1, Math.round((right / tried) * 10)));
}

/** "N in 10 miss it": 10 minus the right line, so the two always add up to 10. */
export function missIn10(right: number, tried: number): number {
  return 10 - rightIn10(right, tried);
}

// FNV-1a: a stable 32-bit seed from the slug.
function seedOf(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// mulberry32: a small seeded generator, the same sequence in every runtime.
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The choices in an order fixed by the slug. The decks store the answer first on
 *  about half the cards (CK Gold: 1,277 of 2,530), so the export order would give it
 *  away. Fixed, not random per visit, so every friend sees the same A to E. */
export function shuffledFor(slug: string, choices: string[]): string[] {
  const out = choices.slice();
  const next = rng(seedOf(slug));
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A valid row (rowProblem returned null) as the page's props. */
export function toShareQuestion(r: ShareQuestionRow): ShareQuestion {
  const choices = shuffledFor(r.slug, r.choices.map((c) => c.trim()));
  return {
    slug: r.slug,
    deck: r.deck.trim(),
    deckLabel: r.deckLabel.trim(),
    stem: r.stem.trim(),
    question: r.question.trim(),
    choices,
    answerIndex: choices.indexOf(r.answer.trim()),
    explanation: r.explanation.trim(),
    tried: r.tried,
    right: r.right,
    deckCount: typeof r.deckCount === 'number' ? r.deckCount : null,
  };
}

// Letters, digits and the hyphen, as /pro's normalizeCode (lib/proGrant.ts) accepts.
// A RegExp object, not a literal: the u flag is past the tsconfig target.
const NOT_CODE = new RegExp('[^\\p{L}\\p{N}-]', 'gu');

/** The ?ref= code, cleaned the way /pro reads it: upper case, letters, digits and
 *  hyphens, 3 to 24 long. Anything else is no code, so the page never shows a code
 *  that /pro would refuse as "That isn't a code." */
export function cleanRef(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const c = raw.trim().toUpperCase().replace(NOT_CODE, '');
  return c.length >= 3 && c.length <= 24 ? c : null;
}
