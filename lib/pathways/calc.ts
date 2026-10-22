// The bedside-math engine for pathway calculators, the web twin of the app's
// PathwayExpr / PathwayCalculator and of scripts/validate_pathways.py in the app
// repo. Calculators are content (docs/content_types/ed_pathways_calculators.md);
// this file only knows the fixed grammar:
//
//   expression := term (("+" | "-") term)*
//   term       := unary (("*" | "/") unary)*
//   unary      := "-" unary | primary
//   primary    := number | name | fn "(" expression ("," expression)* ")" | "(" expression ")"
//   fn         := min (2 args) | max (2 args) | round (1 arg, half away from zero)
//
// Nothing is ever passed to eval or Function: a formula is tokenized, parsed into
// a tree and walked. Anything outside the grammar throws CalcError.
//
// Plain functions and type-only syntax on purpose: scripts/test_pathway_calcs.mjs
// runs this file straight under Node's type stripping, with no build step.

export class CalcError extends Error {}

type Token = { kind: 'num'; value: number } | { kind: 'name'; value: string } | { kind: 'sym'; value: string };

export type Expr =
  | { kind: 'num'; value: number }
  | { kind: 'name'; name: string }
  | { kind: 'neg'; arg: Expr }
  | { kind: 'bin'; op: '+' | '-' | '*' | '/'; left: Expr; right: Expr }
  | { kind: 'call'; fn: 'min' | 'max' | 'round'; args: Expr[] };

const ARITY: Record<string, number> = { min: 2, max: 2, round: 1 };
const DIGITS = '0123456789.';

function isAsciiLetter(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}
function isAsciiDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
    } else if (DIGITS.includes(ch)) {
      let j = i;
      while (j < text.length && DIGITS.includes(text[j])) j += 1;
      const raw = text.slice(i, j);
      // Number() would accept "1e3" or "0x1f"; the grammar is digits and one dot.
      if (!/^(\d+\.?\d*|\.\d+)$/.test(raw)) throw new CalcError(`bad number ${raw}`);
      out.push({ kind: 'num', value: parseFloat(raw) });
      i = j;
    } else if (isAsciiLetter(ch) || ch === '_') {
      let j = i;
      while (j < text.length && (isAsciiLetter(text[j]) || isAsciiDigit(text[j]) || text[j] === '_')) j += 1;
      out.push({ kind: 'name', value: text.slice(i, j) });
      i = j;
    } else if ('+-*/(),'.includes(ch)) {
      out.push({ kind: 'sym', value: ch });
      i += 1;
    } else {
      throw new CalcError(`unexpected ${JSON.stringify(ch)}`);
    }
  }
  return out;
}

export function parseExpr(text: string): Expr {
  if (typeof text !== 'string') throw new CalcError('not a string');
  const tokens = tokenize(text);
  let i = 0;
  const take = (sym: string): boolean => {
    const t = tokens[i];
    if (t && t.kind === 'sym' && t.value === sym) {
      i += 1;
      return true;
    }
    return false;
  };
  const expression = (): Expr => {
    let left = term();
    for (;;) {
      if (take('+')) left = { kind: 'bin', op: '+', left, right: term() };
      else if (take('-')) left = { kind: 'bin', op: '-', left, right: term() };
      else return left;
    }
  };
  const term = (): Expr => {
    let left = unary();
    for (;;) {
      if (take('*')) left = { kind: 'bin', op: '*', left, right: unary() };
      else if (take('/')) left = { kind: 'bin', op: '/', left, right: unary() };
      else return left;
    }
  };
  const unary = (): Expr => (take('-') ? { kind: 'neg', arg: unary() } : primary());
  const primary = (): Expr => {
    const t = tokens[i];
    if (!t) throw new CalcError('the formula ends early');
    i += 1;
    if (t.kind === 'num') return { kind: 'num', value: t.value };
    if (t.kind === 'name') {
      if (!take('(')) return { kind: 'name', name: t.value };
      if (!(t.value in ARITY)) throw new CalcError(`${t.value}() is not min, max or round`);
      const args = [expression()];
      while (take(',')) args.push(expression());
      if (!take(')')) throw new CalcError(`${t.value}( is not closed`);
      if (args.length !== ARITY[t.value]) {
        throw new CalcError(`${t.value} takes ${ARITY[t.value]} argument(s), got ${args.length}`);
      }
      return { kind: 'call', fn: t.value as 'min' | 'max' | 'round', args };
    }
    if (t.value === '(') {
      const e = expression();
      if (!take(')')) throw new CalcError('a ( is not closed');
      return e;
    }
    throw new CalcError(`unexpected ${t.value}`);
  };
  const tree = expression();
  if (i !== tokens.length) throw new CalcError(`unexpected ${String(tokens[i].value)}`);
  return tree;
}

/** Swift's .toNearestOrAwayFromZero; Math.round goes half toward +infinity. */
export function roundHalfAway(x: number): number {
  const a = Math.abs(x);
  const f = Math.floor(a);
  const r = a - f >= 0.5 ? f + 1 : f;
  return x < 0 ? -r : r;
}

/** Round half away from zero to `decimals` places, never -0: Output.shown(_:)
 *  in the app's Pathways.swift, operation for operation, so a band boundary
 *  lands on the same side on the web as on the phone. */
export function roundTo(x: number, decimals: number): number {
  const m = Math.pow(10, decimals);
  const r = roundHalfAway(x * m) / m;
  return r === 0 ? 0 : r;
}

export function evaluate(e: Expr, values: Record<string, number>): number {
  let v: number;
  switch (e.kind) {
    case 'num':
      v = e.value;
      break;
    case 'name':
      if (!Object.prototype.hasOwnProperty.call(values, e.name)) throw new CalcError(`${e.name} is not an input`);
      v = Number(values[e.name]);
      break;
    case 'neg':
      v = -evaluate(e.arg, values);
      break;
    case 'bin': {
      const x = evaluate(e.left, values);
      const y = evaluate(e.right, values);
      if (e.op === '/') {
        if (y === 0) throw new CalcError('divide by zero');
        v = x / y;
      } else {
        v = e.op === '+' ? x + y : e.op === '-' ? x - y : x * y;
      }
      break;
    }
    case 'call': {
      const xs = e.args.map((a) => evaluate(a, values));
      v = e.fn === 'min' ? Math.min(xs[0], xs[1]) : e.fn === 'max' ? Math.max(xs[0], xs[1]) : roundHalfAway(xs[0]);
      break;
    }
    default:
      throw new CalcError('unknown node');
  }
  if (!Number.isFinite(v)) throw new CalcError('the result is not finite');
  return v;
}

export function exprNames(e: Expr): Set<string> {
  if (e.kind === 'name') return new Set([e.name]);
  if (e.kind === 'neg') return exprNames(e.arg);
  if (e.kind === 'bin') return new Set(Array.from(exprNames(e.left)).concat(Array.from(exprNames(e.right))));
  if (e.kind === 'call') return new Set(e.args.flatMap((a) => Array.from(exprNames(a))));
  return new Set();
}

// ---- calculators ----

export type Bounds = { gt?: number; gte?: number; lt?: number; lte?: number };
export type Band = Bounds & { text: string };
export type CalcInput = {
  id: string;
  label: string;
  unit?: string;
  default: number;
  min?: number;
  max?: number;
  step?: number;
  choices?: { label: string; value: number }[];
};
export type CalcOutput = { label: string; expr: string; unit?: string; decimals?: number; bands?: Band[] };
export type CalcItem = { id: string; label: string; options: { label: string; points: number }[] };
export type CalcTest = { inputs?: Record<string, number>; picks?: Record<string, number>; expect: number | number[] };
export type Calculator = {
  id: string;
  title: string;
  kind: 'formula' | 'points';
  inputs?: CalcInput[];
  outputs?: CalcOutput[];
  items?: CalcItem[];
  bands?: Band[];
  sources?: { docId: string; where?: string }[];
  note?: string;
  tests?: CalcTest[];
};

/** Every bound the band has holds (PathwayCalculator.Band.matches). */
export function bandHolds(b: Bounds, x: number): boolean {
  if (b.gt !== undefined && !(x > b.gt)) return false;
  if (b.gte !== undefined && !(x >= b.gte)) return false;
  if (b.lt !== undefined && !(x < b.lt)) return false;
  if (b.lte !== undefined && !(x <= b.lte)) return false;
  return true;
}

export function bandFor(bands: Band[] | undefined, shown: number): Band | null {
  if (!bands) return null;
  return bands.find((b) => bandHolds(b, shown)) || null;
}

export function defaults(c: Calculator): Record<string, number> {
  const v: Record<string, number> = {};
  for (const inp of c.inputs || []) v[inp.id] = inp.default;
  return v;
}

export type OutputResult = { label: string; unit?: string; value: number | null; shown: string; band: string | null; error?: string };

/** Every output of a formula calculator: the unrounded value, the value as
 *  shown (decimals, half away from zero) and the band matched on the shown value. */
export function runFormula(c: Calculator, values: Record<string, number>): OutputResult[] {
  return (c.outputs || []).map((o) => {
    try {
      const value = evaluate(parseExpr(o.expr), values);
      const shownNum = roundTo(value, o.decimals || 0);
      const band = bandFor(o.bands, shownNum);
      return { label: o.label, unit: o.unit, value, shown: formatNumber(shownNum, o.decimals || 0), band: band ? band.text : null };
    } catch (err) {
      const msg = err instanceof CalcError ? err.message : 'cannot compute';
      return { label: o.label, unit: o.unit, value: null, shown: 'Not defined', band: null, error: msg };
    }
  });
}

/** A points score: picks map an item id to an option index; an unnamed item
 *  takes its first option, as the app's pickers open on it. */
export function pointsTotal(c: Calculator, picks: Record<string, number>): number {
  let total = 0;
  for (const it of c.items || []) {
    const idx = Object.prototype.hasOwnProperty.call(picks, it.id) ? picks[it.id] : 0;
    const opt = it.options[idx];
    if (!opt) throw new CalcError(`${it.id} has no option ${idx}`);
    total += opt.points;
  }
  return total;
}

/** Fixed decimals, no thousands separator (doses read as typed in an order). */
export function formatNumber(x: number, decimals: number): string {
  return (x === 0 ? 0 : x).toFixed(decimals);
}

/** The formula as a reader sees it: input labels for ids, real operator glyphs. */
export function prettyExpr(expr: string, labels: Record<string, string>): string {
  const sym: Record<string, string> = { '+': ' + ', '-': ' − ', '*': ' × ', '/': ' ÷ ', '(': '(', ')': ')', ',': ', ' };
  const toks = tokenize(expr);
  let out = '';
  toks.forEach((t, k) => {
    if (t.kind === 'num') out += String(t.value);
    else if (t.kind === 'name') out += labels[t.value] || t.value;
    else if (t.value === '-') {
      // A minus after an operator, a "(" or a ",", or at the start, is unary.
      const prev = toks[k - 1];
      const unary = !prev || (prev.kind === 'sym' && prev.value !== ')');
      out += unary ? '−' : sym['-'];
    } else out += sym[t.value];
  });
  return out.replace(/\s+/g, ' ').trim();
}
