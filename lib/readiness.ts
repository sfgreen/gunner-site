// Shared Step 2 readiness math + share encoding. Single source of truth for the
// /readiness page, the share-card canvas renderer, the OG image route, and the
// copy-as-text write-up so the interactive readout, the card, and the link
// preview never drift.
//
// The projection is PORTED 1:1 from the app's ReadinessEstimate.swift (task #48,
// refit in decision 0008) so the range on the site matches the range in the app for
// the same NBMEs:
//   center = 250 + 0.79 * (anchor - 250) + 9   (range-restriction-corrected
//            regression toward the population mean + the measured practice->real
//            gain; anchor = a RECENCY-DECAY weighted mean of the self-assessments,
//            tau=30, decision 0008), band = a days-out table, plus a low-anchor guardrail.

export const PASS = 218; // USMLE Step 2 CK minimum passing score
// At/above this, a pass is not in question, so the "Clears 218" chip is dropped as
// obvious (a 262 does not need to be told it cleared the pass line). ~1.4 residual
// SD above PASS, ~10th percentile. Below it, the pass-line framing is real signal.
export const PASS_COMFORT = 230;
export const MEAN = 250; // US LCME first-taker Step 2 CK mean, 2024-2025 (SD 15)
export const GMIN = 205,
  GMAX = 275; // range-gauge scale
export const FORMS = [
  'NBME 9', 'NBME 10', 'NBME 11', 'NBME 12', 'NBME 13', 'NBME 14', 'NBME 15', 'NBME 16',
  'UWSA 1', 'UWSA 2', 'UWSA 3',
];

// Calibration constants, mirrored from ReadinessEstimate.swift.
export const CAL = {
  mean: 250,      // populationMean the anchor is shrunk toward
  slope: 0.79,    // Thorndike Case II range-restriction-corrected regression slope
  delta: 9,       // level offset: cohort outscores its (recency-decay) anchor; refit +6 -> +9 (decision 0008)
  tau: 30,        // recency-decay time constant for the anchor weights (half-life ~21 days)
  residualSD: 8.4,
  floor: 200,
  ceiling: 280,
};

// Step 2 CK percentile norm table (USMLE Score Interpretation Guidelines, Table 2,
// LCME first-takers July 2022 - June 2025, N=67,934). Linearly interpolated.
export const NORM: [number, number][] = [
  [200, 0], [205, 1], [210, 1], [215, 2], [220, 4], [225, 6], [230, 10], [235, 16],
  [240, 24], [245, 34], [250, 47], [255, 60], [260, 74], [265, 85], [270, 94], [275, 98], [300, 100],
];

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
export function percentile(score: number): number {
  const s = clamp(score, 200, 300);
  for (let i = 0; i < NORM.length - 1; i++) {
    const [x0, y0] = NORM[i], [x1, y1] = NORM[i + 1];
    if (s >= x0 && s <= x1) return Math.round(y0 + ((y1 - y0) * (s - x0)) / (x1 - x0));
  }
  return s >= 300 ? 100 : 0;
}
export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
export function gpct(v: number) {
  return ((clamp(v, GMIN, GMAX) - GMIN) / (GMAX - GMIN)) * 100;
}

// Calibrated center: shrink the anchor toward the population mean, add the
// practice->real gain, clamp to the display band.
export function calibratedCenter(anchor: number): number {
  const c = CAL.mean + CAL.slope * (anchor - CAL.mean) + CAL.delta;
  return clamp(Math.round(c), CAL.floor, CAL.ceiling);
}

// Displayed half-width by the freshest anchor's days-out (~68% band). Mirrors
// ReadinessEstimate.bandHalfWidth; no date -> the app's moderate default (11).
export function bandHalfWidth(days: number | null): { band: number; tier: string } {
  if (days == null || Number.isNaN(days)) return { band: 11, tier: 'Rough (add your exam date)' };
  if (days < 15) return { band: 7, tier: 'Tight' };
  if (days <= 30) return { band: 11, tier: 'Moderate' };
  if (days <= 56) return { band: 15, tier: 'Wide' };
  return { band: 18, tier: 'Very wide (exam far out)' };
}

// Last run of digits in a form label ('NBME 9' -> 9, 'UWSA 2' -> 2), mirroring the
// app's ReadinessEstimate.formNumber / anchor_weighting.py's float(form).
export function formNumber(form: string): number | null {
  const m = form.match(/\d+/g);
  return m ? parseInt(m[m.length - 1], 10) : null;
}

function leastSquares(pts: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  const n = pts.length;
  if (!n) return null;
  const sx = pts.reduce((a, p) => a + p.x, 0);
  const sy = pts.reduce((a, p) => a + p.y, 0);
  const sxx = pts.reduce((a, p) => a + p.x * p.x, 0);
  const sxy = pts.reduce((a, p) => a + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-12) return null;
  const slope = (n * sxy - sx * sy) / denom;
  return { slope, intercept: (sy - slope * sx) / n };
}

export type Entry = { form: string; score: string; days: string };
export type Proj = {
  low: number; high: number; band: number; tier: string;
  verdict: string; vclass: string; center: number;
  lowAnchor: boolean;
};
export type Dated = { s: number; d: number; form: string };
export type Parsed = { s: number; d: number | null; form: string };

const isUWSA = (form: string): boolean => /uwsa/i.test(form);
// numpy-style median (even length -> mean of the two middles), so the app, web, and
// analysis all agree to the point.
function medianOf(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Effective days-out for each parsed self-assessment (smaller = fresher). 1:1 with
// ReadinessEstimate.effectiveDays / anchor_weighting.py::effective_days: the real
// days-out when entered, else imputed from the within-student (formNumber -> days)
// least-squares line (needs >= 2 distinct known forms), else a HYBRID entry-order
// fallback (see the fallback block below).
export function effectiveDays(parsed: Parsed[]): number[] {
  const eff: (number | null)[] = parsed.map((p) => (p.d != null && !Number.isNaN(p.d) ? p.d : null));
  const missing = parsed.map((_, i) => i).filter((i) => eff[i] == null);
  if (missing.length === 0) return eff as number[];

  const known: { x: number; y: number }[] = [];
  parsed.forEach((p, i) => {
    const f = formNumber(p.form);
    if (eff[i] != null && f != null) known.push({ x: f, y: eff[i] as number });
  });
  if (new Set(known.map((k) => k.x)).size >= 2) {
    const line = leastSquares(known);
    if (line) {
      for (const i of missing) {
        const f = formNumber(parsed[i].form);
        if (f != null) eff[i] = Math.max(0, line.slope * f + line.intercept);
      }
    }
  }

  const still = parsed.map((_, i) => i).filter((i) => eff[i] == null);
  if (still.length) {
    // Hybrid entry-order fallback (RESULTS_anchor_fallback_2026-08-03). Base = entry
    // order: the array index IS the order rows were added, so the last-added row is the
    // freshest (handles form-16-then-form-10, which a form-number sort gets backwards).
    // But a UWSA is pinned to the MEDIAN NBME recency, so a UWSA listed last cannot pose
    // as "just took this" by listing convention alone (62% of students list a UWSA last,
    // only 36% of the time is it actually the freshest). NBME-to-NBME order is untouched.
    // Degrades to plain entry order when there is no NBME to anchor the median.
    const n = parsed.length;
    const base = new Map<number, number>();
    for (const i of still) base.set(i, 7 + (n - 1 - i) * 10);
    const nbmeEff = still.filter((i) => !isUWSA(parsed[i].form)).map((i) => base.get(i) as number);
    const med = nbmeEff.length ? medianOf(nbmeEff) : null;
    for (const i of still) {
      eff[i] = med != null && isUWSA(parsed[i].form) ? med : (base.get(i) as number);
    }
  }
  return eff as number[];
}

// Recency-decay weighted anchor (decision 0008): sum(exp(-eff/tau) * score) /
// sum(exp(-eff/tau)). 1:1 with ReadinessEstimate.decayAnchor.
export function decayAnchor(parsed: Parsed[]): number {
  if (!parsed.length) return 0;
  const eff = effectiveDays(parsed);
  let num = 0, den = 0;
  parsed.forEach((p, i) => {
    const w = Math.exp(-eff[i] / CAL.tau);
    num += p.s * w;
    den += w;
  });
  return den > 0 ? num / den : parsed[0].s;
}

// One pass over the raw entry rows -> everything the page + card + OG need.
export function computeReadiness(entries: Entry[]) {
  const parsed: Parsed[] = entries
    .map((e) => ({ s: parseInt(e.score, 10), d: e.days === '' ? null : parseInt(e.days, 10), form: e.form }))
    .filter((p) => !Number.isNaN(p.s) && p.s >= 130 && p.s <= 300);
  const dated = parsed.filter((p) => p.d != null && !Number.isNaN(p.d)) as Dated[];

  // Freshest anchor = the practice test closest to exam day (smallest days-out);
  // with no dates, the last one entered. Matches the app's recency-weighted anchor.
  let freshestP: Parsed | null = null;
  if (dated.length) {
    freshestP = parsed.reduce<Parsed | null>((best, p) => {
      if (p.d == null) return best;
      if (best == null || best.d == null || p.d < best.d) return p;
      return best;
    }, null);
  } else if (parsed.length) {
    freshestP = parsed[parsed.length - 1];
  }

  let proj: Proj | null = null;
  if (freshestP) {
    // Recency-decay weighted anchor (decision 0008), 1:1 with ReadinessEstimate.decayAnchor.
    const anchor = Math.round(decayAnchor(parsed));
    const center = calibratedCenter(anchor);

    let { band, tier } = bandHalfWidth(freshestP.d);
    // Low-anchor guardrail (Monte Carlo): a raw anchor at/below the pass line has
    // an untested low tail, so widen the band and flag high uncertainty. The
    // shrinkage pulls the center up, so this fires on the ANCHOR, not the center.
    const lowAnchor = anchor <= PASS;
    if (lowAnchor) { band = Math.max(band + 4, 15); tier = 'High uncertainty'; }

    const low = clamp(center - band, CAL.floor, CAL.ceiling);
    const high = clamp(center + band, CAL.floor, CAL.ceiling);
    // Pass-line verdict only when passing is genuinely in question; a projection
    // that comfortably clears leaves it empty (the percentile carries it).
    let verdict = '', vclass = '';
    if (high < PASS) { verdict = `Below the ${PASS} pass line. There is time to build.`; vclass = 'low'; }
    else if (low < PASS) { verdict = `Straddles the ${PASS} pass line. Keep building.`; vclass = 'warn'; }
    else if (low <= PASS_COMFORT) { verdict = `Clears the ${PASS} pass line.`; vclass = 'ok'; }
    proj = { low, high, band, tier, verdict, vclass, center, lowAnchor };
  }
  return { parsed, dated, freshest: freshestP, proj, showTrajectory: dated.length >= 2 && !!proj };
}

// Drop the "(add your exam date)" qualifier for compact chips.
export function shortTier(tier: string) {
  const t = tier.replace(/\s*\(.*\)\s*/, '').trim();
  return t || tier;
}

// ---- shared semantic card model (both the PNG canvas and the OG image) ----
export type VerdictKey = 'green' | 'gold' | 'red' | 'dim';
export type CardCore = {
  kind: string;
  mode: 'journey' | 'readiness';
  fail: boolean;
  status: string;
  parsed: Parsed[];
  dated: { form: string; score: number; days: number }[];
  actual: number | null;
  proj: { low: number; high: number; center: number; tier: string } | null;
  fromLabel: string;      // e.g. "229 first"
  fromScore: number | null;
  heroValue: string;
  isRange: boolean;
  heroKicker: string;
  heroTag: string;
  pctChip: string;
  pct: number;
  tierChip: string | null;
  verdictChip: string | null;
  verdictKey: VerdictKey;
  footerCta: string;
};

// entries + optional actual + status -> the semantic model the renderers draw.
export function buildCardCore(entries: Entry[], actualStr: string, status: string): CardCore | null {
  const { parsed, dated, proj } = computeReadiness(entries);
  const actual = actualStr === '' ? null : parseInt(actualStr, 10);
  const hasActual = actual != null && !Number.isNaN(actual);
  if (!parsed.length && !hasActual) return null;

  const fail = hasActual && (actual as number) < PASS;
  const mode: 'journey' | 'readiness' = hasActual ? 'journey' : 'readiness';
  const kind = hasActual ? (fail ? 'Score Report' : 'Score Journey') : 'Readiness Report';

  const heroValue = hasActual ? String(actual) : proj ? `${proj.low} to ${proj.high}` : '';
  const isRange = !hasActual;
  const heroKicker = fail ? 'Step 2 CK' : hasActual ? 'Actual Step 2 CK' : 'Projected Step 2 CK';
  const heroTag = fail
    ? 'Below the 218 pass line. Regrouping for a retake.'
    : hasActual
      ? 'Actual score, tracked from practice tests.'
      : 'Projection from your practice tests, not a guarantee.';

  const pctSource = hasActual ? (actual as number) : proj ? proj.center : 0;
  const pct = percentile(pctSource);
  const pctChip = hasActual
    ? `${ordinal(pct)} percentile`
    : `proj. ${ordinal(pct)} %ile (est.)`;

  // Pass-line chip only when passing is in question; a comfortably-passing score
  // (or projection) drops it as obvious, letting the percentile speak.
  let verdictChip: string | null = null;
  let verdictKey: VerdictKey = 'dim';
  if (hasActual) {
    const a = actual as number;
    if (a < PASS) { verdictChip = `Below ${PASS}`; verdictKey = 'dim'; }
    else if (a <= PASS_COMFORT) { verdictChip = `Clears ${PASS}`; verdictKey = 'green'; }
  } else if (proj) {
    if (proj.high < PASS) { verdictChip = `Below ${PASS}`; verdictKey = 'red'; }
    else if (proj.low < PASS) { verdictChip = `Straddles ${PASS}`; verdictKey = 'gold'; }
    else if (proj.low <= PASS_COMFORT) { verdictChip = `Clears ${PASS}`; verdictKey = 'green'; }
  }
  const tierChip = !hasActual && proj ? `${shortTier(proj.tier)} range` : null;
  const fromScore = parsed.length ? parsed[0].s : null;

  return {
    kind, mode, fail, status: (status || '').trim(),
    parsed,
    dated: dated.map((d) => ({ form: d.form, score: d.s, days: d.d })),
    actual: hasActual ? (actual as number) : null,
    proj: proj ? { low: proj.low, high: proj.high, center: proj.center, tier: proj.tier } : null,
    fromLabel: fromScore != null ? `${fromScore} first` : '',
    fromScore,
    heroValue, isRange, heroKicker, heroTag,
    pctChip, pct, tierChip, verdictChip, verdictKey,
    footerCta: fail
      ? 'Build a retake plan, free'
      : hasActual ? 'Predict yours, free' : 'Track your trajectory, free',
  };
}

// A one-line title + description for the shared link's OG meta.
export function ogMeta(core: CardCore | null): { title: string; desc: string } {
  const desc = 'Every practice test, tracked to exam day. Build yours free, no sign-up.';
  if (!core) {
    return { title: 'Step 2 Readiness Check | Step Gunner', desc };
  }
  if (core.fail) return { title: 'Regrouping for a Step 2 CK retake | Step Gunner', desc };
  if (core.actual != null) {
    const t = core.fromScore != null && core.fromScore !== core.actual
      ? `${core.fromScore} to ${core.actual} on Step 2 CK`
      : `${core.actual} on Step 2 CK`;
    return { title: `${t} | Step Gunner`, desc };
  }
  return { title: `${core.heroValue} projected on Step 2 CK | Step Gunner`, desc };
}

// ---- shareable link: compact base64url of the entered rows + actual + status ----
// Shape: { e:[[formIdx, score, days|null], ...], a: actual|null, s: status }.
// formIdx is FORMS.indexOf(form) or -1. Kept short so the QR stays low-density.
export type ShareState = { entries: Entry[]; actual: string; status: string };

function b64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeShare(entries: Entry[], actual: string, status: string): string {
  const e = entries
    .map((en) => {
      const score = parseInt(en.score, 10);
      if (Number.isNaN(score)) return null;
      const days = en.days === '' ? null : parseInt(en.days, 10);
      return [FORMS.indexOf(en.form), score, Number.isNaN(days as number) ? null : days];
    })
    .filter(Boolean);
  const a = actual === '' ? null : parseInt(actual, 10);
  const obj = { e, a: Number.isNaN(a as number) ? null : a, s: (status || '').slice(0, 60) };
  return b64urlEncode(JSON.stringify(obj));
}

export function decodeShare(param: string): ShareState | null {
  try {
    const obj = JSON.parse(b64urlDecode(param)) as {
      e?: unknown[]; a?: unknown; s?: unknown;
    };
    if (!obj || !Array.isArray(obj.e)) return null;
    const entries: Entry[] = obj.e
      .map((row) => {
        if (!Array.isArray(row)) return null;
        const [fi, sc, dy] = row as [number, number, number | null];
        const form = typeof fi === 'number' && fi >= 0 && fi < FORMS.length ? FORMS[fi] : '';
        const score = Number.isFinite(sc) ? String(Math.round(sc)) : '';
        const days = dy == null || !Number.isFinite(dy) ? '' : String(Math.round(dy));
        if (score === '') return null;
        return { form, score, days };
      })
      .filter(Boolean) as Entry[];
    if (!entries.length) return null;
    const actual = Number.isFinite(obj.a as number) ? String(Math.round(obj.a as number)) : '';
    const status = typeof obj.s === 'string' ? obj.s.slice(0, 60) : '';
    return { entries, actual, status };
  } catch {
    return null;
  }
}

export const SHARE_BASE = 'https://stepgunner.com/readiness';
export function shareUrl(entries: Entry[], actual: string, status: string): string {
  return `${SHARE_BASE}?e=${encodeShare(entries, actual, status)}`;
}

// ---- Reddit r/step2 submit deep link ----
// Title is built from the student's OWN numbers (and status line) so it reads
// personal and varies per user, never a templated string a mod would flag.
export function redditTitle(entries: Entry[], actual: string, status: string): string {
  const core = buildCardCore(entries, actual, status);
  if (!core) return 'My Step 2 CK readiness';
  const st = core.status ? `, ${core.status}` : '';
  if (core.fail) return `Regrouping for a Step 2 CK retake${st}`;
  if (core.actual != null) {
    if (core.fromScore != null && core.fromScore !== core.actual) {
      return `${core.fromScore} to ${core.actual} on Step 2 CK${st}`;
    }
    return `Step 2 CK: ${core.actual}${st}`;
  }
  if (core.proj) return `Projected ${core.proj.low} to ${core.proj.high} on Step 2 CK${st}`;
  return `My Step 2 CK readiness${st}`;
}

// Lands the user in the r/step2 composer with the title prefilled. Reddit cannot
// pre-attach a file via URL, so the image is downloaded client-side to drag in.
export function redditSubmitUrl(entries: Entry[], actual: string, status: string): string {
  return `https://www.reddit.com/r/step2/submit?title=${encodeURIComponent(redditTitle(entries, actual, status))}`;
}

// ---- native r/step2 copy-as-text write-up ----
export function buildCopyText(entries: Entry[], actual: string, status: string, proj: Proj | null): string {
  const lines: string[] = [];
  const st = (status || '').trim();
  if (st) { lines.push(st); lines.push(''); }
  const anyDated = entries.some((e) => e.days.trim() !== '' && e.score.trim() !== '');
  entries.forEach((e) => {
    const score = parseInt(e.score, 10);
    if (Number.isNaN(score) || score < 130 || score > 300) return;
    const form = e.form || 'Practice test';
    const d = e.days === '' ? null : parseInt(e.days, 10);
    const tail = d != null && !Number.isNaN(d)
      ? ` (${d} days out)`
      : anyDated ? ' (timing not reported)' : '';
    lines.push(`${form}: ${score}${tail}`);
  });
  const actNum = actual === '' ? null : parseInt(actual, 10);
  if (actNum != null && !Number.isNaN(actNum)) {
    lines.push(`Actual STEP 2: ${actNum}`);
  } else if (proj) {
    lines.push(`Projected Step 2 CK: ${proj.low} to ${proj.high} (est.)`);
  }
  lines.push('');
  lines.push(`tracked free on Step Gunner: ${SHARE_BASE}`);
  return lines.join('\n');
}
