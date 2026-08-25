// Parser for score lists pasted straight out of a Reddit post.
//
// Built for /readiness/paste, the internal tool used to answer "what's my
// predicted score" threads without retyping six forms into the calculator.
//
// The one rule that matters: NEVER silently drop a line. A dropped form changes
// the anchor and therefore the projection, and a wrong number posted under the
// Step Gunner name is worse than no answer. Anything not understood comes back
// in `unparsed` so the page can show it.

import { FORMS } from './readiness';

export type ParsedLine = {
  form: string;      // canonical, matching FORMS
  score: string;     // printed score as typed
  days: string;      // '' when no timing was given
  raw: string;
};

export type ParseResult = {
  entries: ParsedLine[];
  unparsed: string[];
  /** Lines that named a form we do not model (Free 120, CMS, Amboss, old Step 1). */
  unsupported: string[];
};

const CANON = new Map(FORMS.map((f) => [f.toLowerCase().replace(/\s+/g, ''), f]));

// Forms students post that this model does not carry. Recognised on purpose so
// they can be reported as skipped rather than landing in `unparsed` looking
// like a parser bug.
const UNSUPPORTED = /\b(free\s*-?\s*120|cms\b|amboss|usmle\s*rx|kaplan|step\s*1|old\s*free|nbme\s*[1-8]\b)/i;

/** "NBME 11", "nbme11", "form 11", "N11" -> "NBME 11"; UWorld variants -> "UWSA n". */
function canonicalForm(text: string): string | null {
  const t = text.toLowerCase();

  const uw = t.match(/(?:uwsa|uw\s*sa|uworld\s*(?:self[\s-]*assessment|sa)?)\s*#?\s*([123])\b/);
  if (uw) return CANON.get(`uwsa${uw[1]}`) ?? null;

  const nb = t.match(/(?:nbme|form|n)\s*#?\s*(\d{1,2})\b/);
  if (nb) {
    const n = parseInt(nb[1], 10);
    if (n >= 9 && n <= 16) return CANON.get(`nbme${n}`) ?? null;
  }
  return null;
}

/** Pull a timing hint out of a line: "(30 days out)", "30d ago", "6/15", "2 weeks". */
function timing(text: string): string {
  const t = text.toLowerCase();

  const wk = t.match(/(\d{1,2})\s*(?:weeks?|wks?|w)\s*(?:ago|out|before)?/);
  if (wk) return String(Math.round(parseInt(wk[1], 10) * 7));

  const mo = t.match(/(\d{1,2})\s*(?:months?|mos?)\s*(?:ago|out|before)?/);
  if (mo) return String(Math.round(parseInt(mo[1], 10) * 30));

  const d = t.match(/(\d{1,3})\s*(?:days?|d)\s*(?:ago|out|before)/);
  if (d) return d[1];

  // A parenthesised date like (6/15) or (Jun 15). smartDays handles the rest.
  const paren = text.match(/\(([^)]{3,18})\)/);
  if (paren && /\d/.test(paren[1]) && !/^\s*\d{3}\s*$/.test(paren[1])) {
    const inner = paren[1].trim();
    if (/^\d{1,2}\s*[/-]\s*\d{1,2}$/.test(inner) || /[a-z]{3}/i.test(inner)) return inner;
  }
  return '';
}

/**
 * Score = a 3-digit number in the 130..300 range that is NOT part of the form
 * name. The form name is stripped first so "NBME 11: 220" cannot yield 11.
 */
function scoreFrom(text: string, formMatch: string): string | null {
  const stripped = text.replace(formMatch, ' ');
  const nums = stripped.match(/\b(\d{3})\b/g);
  if (!nums) return null;
  for (const n of nums) {
    const v = parseInt(n, 10);
    if (v >= 130 && v <= 300) return String(v);
  }
  return null;
}

export function parseScoreList(raw: string): ParseResult {
  const entries: ParsedLine[] = [];
  const unparsed: string[] = [];
  const unsupported: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    // A bare header like "My scores:" is not a failure, it is chatter.
    if (!/\d/.test(t)) continue;

    if (UNSUPPORTED.test(t)) { unsupported.push(t); continue; }

    const form = canonicalForm(t);
    if (!form) { unparsed.push(t); continue; }

    // Re-find the literal form text so it can be removed before reading the score.
    const fm = t.match(
      /(?:uwsa|uw\s*sa|uworld\s*(?:self[\s-]*assessment|sa)?)\s*#?\s*[123]|(?:nbme|form|n)\s*#?\s*\d{1,2}/i,
    );
    const score = scoreFrom(t, fm ? fm[0] : '');
    if (!score) { unparsed.push(t); continue; }

    entries.push({ form, score, days: timing(t), raw: t });
  }

  return { entries, unparsed, unsupported };
}
