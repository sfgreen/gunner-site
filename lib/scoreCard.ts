// Canvas renderer + model for the shareable Step 2 score card. One renderer is
// both the on-page preview and the downloaded PNG (no divergence, no html2canvas).
// Design space is 1080 wide; the HEIGHT is content-driven (see cardHeight /
// layoutCard) so the card fits its blocks with no empty void. The caller sets the
// backing store from cardHeight(model) and passes a scale so the export is crisp.
// Tokens mirror the /readiness page exactly.
import qrcode from 'qrcode-generator';
import {
  PASS, MEAN, clamp, shareUrl, buildCardCore,
  type Entry,
} from './readiness';

export const K = {
  bg: '#0a0b0d', bg2: '#0d0e13', bg3: '#121317',
  hair: 'rgba(255,255,255,0.08)', hairS: 'rgba(255,255,255,0.14)',
  ink: '#f4f6f8', dim: '#9aa1ab', faint: '#5c636e',
  green: '#46d877', gold: '#e3b542', red: '#ef6d6d', violet: '#af52ff', ref: '#2a3038',
  track: '#1b2230', axis: '#2a3646',
};
const MONO = 'ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, monospace';
const SANS = '"DM Sans", -apple-system, system-ui, sans-serif';
const fmono = (s: number, w = 400) => `${w} ${s}px ${MONO}`;
const fsans = (s: number, w = 400) => `${w} ${s}px ${SANS}`;

export type LedgerRow = { k: string; v: string; d?: string; brand?: boolean; gold?: boolean };
export type CardModel = {
  kind: string;
  mode: 'journey' | 'readiness';
  fail: boolean;
  status: string;
  dated: { form: string; score: number; days: number }[];
  actual: number | null;
  proj: { low: number; high: number; center: number } | null;
  fromLabel: string;
  heroValue: string;
  isRange: boolean;
  heroKicker: string;
  heroTag: string;
  pctChip: string;
  tierChip: string | null;
  verdictChip: string | null;
  verdictColor: string;
  ledger: LedgerRow[];
  footerCta: string;
  shareUrl: string;
};

export const CARD_W = 1080;
// The card width is fixed; the height is derived by layoutCard so no fixed void is
// left under the content. M / AX_L / AX_R define the ONE axis the projected-range
// band chart and the ranked ladder both draw on, so their columns line up.
const M = 64;                    // side margin
const AX_L = M + 112;            // 176: shared chart axis left (gutter for ladder form labels)
const AX_R = CARD_W - M - 72;    // 944: shared chart axis right
// score (200..280) -> x on the shared axis, matching the OG image / embed geometry.
const axisX = (s: number) => AX_L + ((clamp(s, 200, 280) - 200) / 80) * (AX_R - AX_L);

// entries + optional actual + status -> everything the renderer draws. The
// semantic model (hero, chips, tags) comes from the shared buildCardCore so the
// PNG and the OG image are guaranteed identical; this only adds the portrait-only
// ledger + the QR share URL + the canvas color mapping.
export function buildCardModel(entries: Entry[], actualStr: string, status: string): CardModel | null {
  const core = buildCardCore(entries, actualStr, status);
  if (!core) return null;

  const COLOR: Record<string, string> = { green: K.green, gold: K.gold, red: K.red, dim: K.dim };
  const anyDated = core.dated.length > 0;
  const ledger: LedgerRow[] = core.parsed.map((p) => ({
    k: p.form || 'Practice',
    v: String(p.s),
    d: p.d != null ? `${p.d}d out` : anyDated ? 'timing n/a' : undefined,
  }));
  if (core.actual != null) ledger.push({ k: 'Actual Step 2', v: String(core.actual), gold: !core.fail });

  return {
    kind: core.kind, mode: core.mode, fail: core.fail, status: core.status,
    dated: core.dated,
    actual: core.actual,
    proj: core.proj ? { low: core.proj.low, high: core.proj.high, center: core.proj.center } : null,
    fromLabel: core.fromLabel, heroValue: core.heroValue, isRange: core.isRange,
    heroKicker: core.heroKicker, heroTag: core.heroTag,
    pctChip: core.pctChip, tierChip: core.tierChip, verdictChip: core.verdictChip,
    verdictColor: COLOR[core.verdictKey],
    ledger, footerCta: core.footerCta,
    shareUrl: shareUrl(entries, actualStr, status),
  };
}

/* ---------------- primitive canvas helpers ---------------- */
type Ctx = CanvasRenderingContext2D;
function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function tracked(ctx: Ctx, text: string, x: number, y: number, sp: number, align: 'left' | 'center' | 'right') {
  let total = 0;
  for (const ch of text) total += ctx.measureText(ch).width + sp;
  total -= sp;
  let sx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const ch of text) { ctx.fillText(ch, sx, y); sx += ctx.measureText(ch).width + sp; }
  ctx.textAlign = prev;
}
function fit(ctx: Ctx, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 4 && ctx.measureText(t + '...').width > maxW) t = t.slice(0, -1);
  return t + '...';
}
function niceY(scores: number[]) {
  let lo = Math.min(...scores), hi = Math.max(...scores);
  const pad = Math.max(4, (hi - lo) * 0.15);
  lo -= pad; hi += pad;
  lo = Math.max(180, lo); hi = Math.min(300, hi);
  const incs = [5, 10, 20];
  let inc = 20;
  for (const c of incs) { if ((hi - lo) / c <= 6) { inc = c; break; } }
  lo = Math.floor(lo / inc) * inc; hi = Math.ceil(hi / inc) * inc;
  const ticks: number[] = [];
  for (let s = hi; s >= lo - 0.001; s -= inc) ticks.push(s);
  return { lo, hi, inc, ticks };
}
function niceX(maxDays: number) {
  const incs = [5, 10, 15, 25, 50, 100];
  let inc = 200;
  for (const c of incs) { if (maxDays / c <= 5) { inc = c; break; } }
  const top = Math.max(inc, Math.ceil(maxDays / inc) * inc);
  const ticks: number[] = [];
  for (let d = top; d >= -0.001; d -= inc) ticks.push(d);
  return { top, inc, ticks };
}
type Pt = { x: number; y: number };
function pathSmooth(ctx: Ctx, pts: Pt[]) {
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 2) { ctx.lineTo(pts[1].x, pts[1].y); return; }
  const t = 0.16;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) * t, c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t, c2y = p2.y - (p3.y - p1.y) * t;
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
  }
}
function starPath(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.44 : r;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

/* ---------------- trajectory chart (canvas) ---------------- */
// Drawn for the DATED case (>= 2 dated tests): a real time axis exists, so the
// climb into the projected band at exam day is an honest trajectory.
function drawChart(ctx: Ctx, m: CardModel, bx: number, by: number, bw: number, bh: number) {
  const fail = m.fail;
  const accent = fail ? K.dim : K.gold;
  const xL = bx + 42, xR = bx + bw, yT = by + 10, yB = by + bh - 46;

  const pts = [...m.dated].sort((a, b) => b.days - a.days);
  const scoreVals = pts.map((p) => p.score).concat([PASS]);
  if (m.actual != null) scoreVals.push(m.actual);
  if (m.mode === 'readiness' && m.proj) scoreVals.push(m.proj.low, m.proj.high, m.proj.center);
  if (!fail) scoreVals.push(MEAN);
  const Y = niceY(scoreVals);
  const y = (v: number) => yB - (v - Y.lo) / (Y.hi - Y.lo) * (yB - yT);
  const maxD = Math.max(...pts.map((p) => p.days), 1);
  const X = niceX(maxD);
  const xOf = (d: number) => xL + (1 - d / X.top) * (xR - xL);

  ctx.font = fmono(19);
  ctx.textBaseline = 'middle';
  Y.ticks.forEach((s) => {
    const gy = y(s);
    ctx.strokeStyle = K.bg3; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xL, gy); ctx.lineTo(xR, gy); ctx.stroke();
    ctx.fillStyle = K.faint; ctx.textAlign = 'right';
    ctx.fillText(String(s), xL - 12, gy);
  });
  ctx.textBaseline = 'alphabetic';

  if (!fail && MEAN >= Y.lo && MEAN <= Y.hi) {
    const ry = y(MEAN);
    ctx.strokeStyle = K.ref; ctx.lineWidth = 1.4; ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.moveTo(xL, ry); ctx.lineTo(xR, ry); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = fmono(17); ctx.fillStyle = K.dim; ctx.textAlign = 'right';
    ctx.fillText('US AVG ' + MEAN, xR, ry - 9);
  }
  if (PASS >= Y.lo && PASS <= Y.hi) {
    const py = y(PASS);
    ctx.strokeStyle = K.red; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.55; ctx.setLineDash([5, 6]);
    ctx.beginPath(); ctx.moveTo(xL, py); ctx.lineTo(xR, py); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.font = fmono(17, 700); ctx.fillStyle = K.red; ctx.textAlign = 'left';
    ctx.fillText('PASS ' + PASS, xL + 4, py - 9);
  }

  ctx.strokeStyle = K.hairS; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(xL, yB); ctx.lineTo(xR, yB); ctx.stroke();
  ctx.textBaseline = 'alphabetic';
  X.ticks.forEach((d) => {
    const tx = xOf(d), isZero = d === 0;
    ctx.fillStyle = isZero ? (fail ? K.dim : K.gold) : K.dim;
    ctx.font = fmono(18, isZero ? 800 : 400); ctx.textAlign = 'center';
    ctx.fillText(String(d), tx, yB + 30);
  });
  ctx.fillStyle = K.faint;
  ctx.font = fmono(16);
  tracked(ctx, 'DAYS BEFORE EXAM', (xL + xR) / 2, yB + 56, 3, 'center');

  const P = pts.map((p) => ({ ...p, x: xOf(p.days), py: y(p.score) }));
  for (let i = 1; i < P.length; i++) { if (Math.abs(P[i].x - P[i - 1].x) < 10) P[i].x = P[i - 1].x + 14; }
  const curve: Pt[] = P.map((p) => ({ x: p.x, y: p.py }));
  const last = curve[curve.length - 1];

  if (curve.length >= 2) {
    const g = ctx.createLinearGradient(0, yT, 0, yB);
    g.addColorStop(0, fail ? 'rgba(154,161,171,0.16)' : 'rgba(70,216,119,0.22)');
    g.addColorStop(1, 'rgba(70,216,119,0)');
    ctx.beginPath(); pathSmooth(ctx, curve);
    ctx.lineTo(curve[curve.length - 1].x, yB); ctx.lineTo(curve[0].x, yB); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
  }

  if (m.mode === 'readiness' && m.proj) {
    ctx.beginPath();
    ctx.moveTo(last.x, last.y); ctx.lineTo(xR, y(m.proj.high)); ctx.lineTo(xR, y(m.proj.low)); ctx.closePath();
    ctx.fillStyle = fail ? 'rgba(154,161,171,0.12)' : 'rgba(227,181,66,0.13)'; ctx.fill();
  }

  if (curve.length >= 2) {
    ctx.beginPath(); pathSmooth(ctx, curve);
    ctx.strokeStyle = fail ? K.dim : K.green; ctx.lineWidth = 4.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }

  const endS = m.actual != null ? m.actual : m.proj ? m.proj.center : null;
  if (endS != null) {
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(xR, y(endS));
    ctx.strokeStyle = accent; ctx.lineWidth = 4.4; ctx.setLineDash([10, 8]); ctx.globalAlpha = 0.9; ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }

  if (m.mode === 'readiness') {
    ctx.strokeStyle = K.hairS; ctx.lineWidth = 1.2; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(xR, yT); ctx.lineTo(xR, yB); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = fmono(17, 700); ctx.fillStyle = K.dim; ctx.textAlign = 'right';
    ctx.fillText('TEST DAY', xR, yT - 6);
  }

  ctx.textBaseline = 'alphabetic';
  P.forEach((p, i) => {
    ctx.beginPath(); ctx.arc(p.x, p.py, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = fail ? K.dim : K.green; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = K.bg; ctx.stroke();
    const anchor: CanvasTextAlign = i === 0 ? 'left' : i === P.length - 1 ? 'right' : 'center';
    const dx = i === 0 ? -4 : i === P.length - 1 ? 4 : 0;
    ctx.font = fmono(20, 800); ctx.fillStyle = K.ink; ctx.textAlign = anchor;
    ctx.fillText(String(p.score), p.x + dx, p.py - 18);
    if (P.length <= 7) {
      ctx.font = fmono(14); ctx.fillStyle = K.faint;
      ctx.fillText(p.form ? p.form.replace('NBME ', 'N').replace('UWSA ', 'U') : '', p.x + dx, p.py - 38);
    }
  });

  if (m.actual != null) {
    const sx = xR, sy = y(m.actual);
    if (fail) {
      ctx.beginPath();
      ctx.moveTo(sx, sy - 10); ctx.lineTo(sx + 10, sy); ctx.lineTo(sx, sy + 10); ctx.lineTo(sx - 10, sy); ctx.closePath();
      ctx.fillStyle = K.bg; ctx.fill(); ctx.strokeStyle = K.dim; ctx.lineWidth = 3.4; ctx.stroke();
    } else {
      ctx.save(); ctx.shadowColor = 'rgba(227,181,66,0.7)'; ctx.shadowBlur = 26;
      starPath(ctx, sx, sy, 13); ctx.fillStyle = K.gold; ctx.fill(); ctx.restore();
    }
  } else if (m.mode === 'readiness' && m.proj) {
    ctx.beginPath(); ctx.arc(xR, y(m.proj.center), 6.5, 0, Math.PI * 2);
    ctx.fillStyle = K.bg; ctx.fill(); ctx.strokeStyle = K.gold; ctx.lineWidth = 3.4; ctx.stroke();
  }
}

/* ---------------- projected-range band chart (canvas) ---------------- */
// Ported from the embed / OG "Chart" geometry onto the shared 200..280 axis: the
// gold projection band (low..high), the center marker + label, the dashed green
// 218 pass line, and the ticks. For an actual score it swaps the band for a marker
// (gold star on a pass, dim diamond on a fail) over a faint practice-range band.
// This is the focal visual of the undated readiness card, where a trajectory would
// be a false temporal claim.
function drawBandChart(ctx: Ctx, m: CardModel, by: number, bh: number) {
  const fail = m.fail;
  const yAxis = by + bh - 46;
  const bandBot = yAxis - 8;
  const bandTop = bandBot - 46;
  const midY = (bandTop + bandBot) / 2;

  // axis
  ctx.strokeStyle = K.axis; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(AX_L, yAxis); ctx.lineTo(AX_R, yAxis); ctx.stroke();

  // projection band + center marker (readiness)
  if (m.actual == null && m.proj) {
    const xl = axisX(m.proj.low), xr = axisX(m.proj.high);
    rr(ctx, xl, bandTop, Math.max(6, xr - xl), bandBot - bandTop, 9);
    ctx.fillStyle = 'rgba(227,181,66,0.16)'; ctx.fill();
    ctx.strokeStyle = 'rgba(227,181,66,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
    const cx = axisX(m.proj.center);
    ctx.strokeStyle = K.gold; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, bandTop - 22); ctx.lineTo(cx, yAxis); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, midY, 7, 0, Math.PI * 2);
    ctx.fillStyle = K.gold; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = K.bg; ctx.stroke();
    ctx.font = fmono(27, 800); ctx.fillStyle = K.gold; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(m.proj.center), cx, bandTop - 30);
  }

  // actual marker (journey) over a faint practice-range band
  if (m.actual != null) {
    if (m.proj) {
      const xl = axisX(m.proj.low), xr = axisX(m.proj.high);
      rr(ctx, xl, midY - 8, Math.max(6, xr - xl), 16, 5);
      ctx.fillStyle = 'rgba(154,161,171,0.12)'; ctx.fill();
      ctx.strokeStyle = 'rgba(154,161,171,0.28)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    const ax = axisX(m.actual), mc = fail ? K.dim : K.gold;
    ctx.strokeStyle = mc; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ax, bandTop - 22); ctx.lineTo(ax, yAxis); ctx.stroke();
    if (fail) {
      ctx.beginPath();
      ctx.moveTo(ax, midY - 11); ctx.lineTo(ax + 11, midY); ctx.lineTo(ax, midY + 11); ctx.lineTo(ax - 11, midY); ctx.closePath();
      ctx.fillStyle = K.bg; ctx.fill(); ctx.strokeStyle = mc; ctx.lineWidth = 3; ctx.stroke();
    } else {
      ctx.save(); ctx.shadowColor = 'rgba(227,181,66,0.6)'; ctx.shadowBlur = 20;
      starPath(ctx, ax, midY, 13); ctx.fillStyle = K.gold; ctx.fill(); ctx.restore();
    }
    ctx.font = fmono(27, 800); ctx.fillStyle = mc; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(m.actual), ax, bandTop - 30);
  }

  // dashed 218 pass line
  const px = axisX(PASS);
  ctx.strokeStyle = K.green; ctx.lineWidth = 1.8; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(px, bandTop - 6); ctx.lineTo(px, yAxis); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = fmono(18, 700); ctx.fillStyle = K.green; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('PASS ' + PASS, px, bandTop - 14);

  // ticks
  ctx.font = fmono(19); ctx.fillStyle = K.faint; ctx.textAlign = 'center';
  [200, 220, 240, 260, 280].forEach((t) => ctx.fillText(String(t), axisX(t), yAxis + 32));
}

/* ---------------- ranked score ladder (canvas) ---------------- */
// A Cleveland dot plot on the SAME 200..280 axis as the band chart, high to low.
// Position on a common scale is the most readable comparison, and it makes no
// temporal claim, so it is the honest undated view. The freshest test is gold (it
// drives the projection most); the projection band is tinted behind the rows.
function parseDaysLabel(d?: string): number | null {
  if (!d) return null;
  const mt = d.match(/^(\d+)d out$/);
  return mt ? parseInt(mt[1], 10) : null;
}
// Index (into m.ledger) of the freshest practice test: the smallest days-out among
// dated rows, else the last-entered practice row (entry order = the app's undated
// recency order). Mirrors computeReadiness's freshest pick. Never the actual row.
function freshIndex(m: CardModel): number | null {
  const dated = m.ledger
    .map((r, i) => ({ i, days: parseDaysLabel(r.d) }))
    .filter((x) => x.days != null) as { i: number; days: number }[];
  if (dated.length) return dated.reduce((a, b) => (b.days < a.days ? b : a)).i;
  const practice = m.ledger.map((r, i) => i).filter((i) => m.ledger[i].k !== 'Actual Step 2');
  return practice.length ? practice[practice.length - 1] : null;
}
function drawScoreLadder(ctx: Ctx, m: CardModel, top: number, rowH: number, x1: number) {
  const fi = freshIndex(m);
  const rows = m.ledger.map((r, i) => ({
    k: r.k, v: r.v, score: parseInt(r.v, 10) || 0, idx: i, isActual: !!r.gold, fresh: i === fi,
  }));
  // score desc, then the freshest floats to the top of its tie group, then entry order.
  rows.sort((a, b) => (b.score - a.score) || ((a.fresh ? 0 : 1) - (b.fresh ? 0 : 1)) || (a.idx - b.idx));
  const n = rows.length;
  const bottom = top + n * rowH;

  // projection band backdrop (aligned to the band chart above)
  if (m.proj) {
    const xl = axisX(m.proj.low), xr = axisX(m.proj.high), cx = axisX(m.proj.center);
    ctx.fillStyle = 'rgba(227,181,66,0.05)'; ctx.fillRect(xl, top, Math.max(6, xr - xl), bottom - top);
    ctx.strokeStyle = 'rgba(227,181,66,0.22)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xl, top); ctx.lineTo(xl, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xr, top); ctx.lineTo(xr, bottom); ctx.stroke();
    ctx.strokeStyle = 'rgba(227,181,66,0.30)'; ctx.setLineDash([2, 6]);
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bottom); ctx.stroke(); ctx.setLineDash([]);
  }

  rows.forEach((row, i) => {
    const cyr = top + i * rowH + rowH / 2;
    const gold = row.fresh || row.isActual;
    // guide line
    ctx.strokeStyle = K.track; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(AX_L, cyr); ctx.lineTo(AX_R, cyr); ctx.stroke();
    // form label
    const label = row.isActual ? 'ACTUAL' : row.k;
    ctx.font = fmono(21, gold ? 700 : 400); ctx.fillStyle = gold ? K.gold : K.dim;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(label, AX_L - 16, cyr);
    // dot
    const dx = axisX(row.score), r = gold ? 11 : 8.5;
    ctx.beginPath(); ctx.arc(dx, cyr, r, 0, Math.PI * 2);
    ctx.fillStyle = gold ? K.gold : K.ink; ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = K.bg; ctx.stroke();
    // value
    ctx.font = fmono(25, 800); ctx.fillStyle = gold ? K.gold : K.ink;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(row.v, x1, cyr);
  });
  ctx.textBaseline = 'alphabetic';
}

/* ---------------- section slab + caption ---------------- */
function drawSlab(ctx: Ctx, x0: number, x1: number, y: number, left: string, right?: string) {
  ctx.textBaseline = 'alphabetic';
  ctx.font = fmono(17, 700); ctx.fillStyle = K.faint;
  tracked(ctx, left.toUpperCase(), x0, y, 2, 'left');
  if (right) {
    ctx.font = fmono(16, 700); ctx.fillStyle = K.faint;
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(right.toUpperCase(), x1, y);
    ctx.textAlign = 'left';
  }
}
function drawCaption(ctx: Ctx, x0: number, x1: number, y: number, text: string) {
  const sw = 26;
  ctx.fillStyle = K.gold; rr(ctx, x0, y - 11, sw, 5, 2.5); ctx.fill();
  ctx.font = fsans(17, 500); ctx.fillStyle = K.faint;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(fit(ctx, text, x1 - x0 - sw - 14), x0 + sw + 14, y);
}

/* ---------------- hero (range + pills) ---------------- */
function drawHeroValue(ctx: Ctx, m: CardModel, x: number, y: number, big: number) {
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const parts = m.isRange ? m.heroValue.split(' to ') : null;
  const gold = () => { if (!m.fail) { ctx.save(); ctx.shadowColor = 'rgba(227,181,66,0.42)'; ctx.shadowBlur = 42; } ctx.fillStyle = m.fail ? K.ink : K.gold; };
  const ungold = () => { if (!m.fail) ctx.restore(); };
  if (parts && parts.length === 2) {
    ctx.font = fmono(big, 800); gold(); ctx.fillText(parts[0], x, y); const w0 = ctx.measureText(parts[0]).width; ungold();
    ctx.font = fmono(Math.round(big * 0.42), 600); ctx.fillStyle = K.dim; ctx.fillText('to', x + w0 + 18, y); const wto = ctx.measureText('to').width;
    ctx.font = fmono(big, 800); gold(); ctx.fillText(parts[1], x + w0 + 18 + wto + 18, y); ungold();
  } else {
    ctx.font = fmono(big, 800); gold(); ctx.fillText(m.heroValue, x, y); ungold();
  }
}
function drawPills(ctx: Ctx, pills: { t: string; c: string }[], x: number, top: number, h: number) {
  ctx.font = fmono(19, 700);
  let px = x;
  const padX = 20;
  pills.forEach((p) => {
    const w = ctx.measureText(p.t).width + padX * 2;
    rr(ctx, px, top, w, h, h / 2);
    ctx.strokeStyle = p.c; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.6; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = p.c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.t, px + w / 2, top + h / 2 + 1);
    px += w + 14;
  });
  ctx.textBaseline = 'alphabetic';
}

/* ---------------- QR: dark modules on a light rounded panel ---------------- */
function drawQR(ctx: Ctx, url: string, x: number, y: number, size: number) {
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 3;
  const cell = size / (n + quiet * 2);
  rr(ctx, x, y, size, size, 12); ctx.fillStyle = '#eef1f4'; ctx.fill();
  ctx.fillStyle = '#0a0b0d';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (qr.isDark(r, c)) ctx.fillRect(x + (c + quiet) * cell, y + (r + quiet) * cell, Math.ceil(cell), Math.ceil(cell));
  }
}

/* ---------------- layout (content-driven height) ---------------- */
type Layout = {
  isDated: boolean;
  statusY: number | null;
  kickerY: number; rangeY: number; heroFont: number;
  pillsTop: number; pillH: number; tagY: number;
  slab1Y: number;
  bandTop: number; bandH: number; slab2Y: number; ladderTop: number; rowH: number; ladderRows: number;
  trajTop: number; trajH: number;
  capY: number; footerRuleY: number; qrSize: number;
  h: number;
};
// One pass over the model -> every y coordinate + the final height. Pure (no ctx):
// block heights are fixed constants and the ladder row count is known, so the card
// fits its content exactly. The caller sizes the canvas from h.
function layoutCard(m: CardModel): Layout {
  const isDated = m.dated.length >= 2;
  const isRange = m.isRange;

  let y = 108; // baseline of the brand rule
  let statusY: number | null = null;
  if (m.status) { statusY = y + 30; y += 42; }

  const kickerY = y + 36;
  const heroFont = isRange ? 96 : 148;
  const rangeY = kickerY + (isRange ? 96 : 132);
  const pillsTop = rangeY + 28;
  const pillH = 48;
  const tagY = pillsTop + pillH + 36;
  y = tagY + 12;

  const slab1Y = y + 42;

  let bandTop = 0; const bandH = 168; let slab2Y = 0, ladderTop = 0; const rowH = 46; let ladderRows = 0;
  let trajTop = 0; const trajH = 384;
  let capY = 0;

  if (isDated) {
    trajTop = slab1Y + 20;
    capY = trajTop + trajH + 40;
  } else {
    bandTop = slab1Y + 20;
    slab2Y = bandTop + bandH + 44;
    ladderRows = m.ledger.length;
    ladderTop = slab2Y + 24;
    capY = ladderTop + ladderRows * rowH + 40;
  }

  const footerRuleY = capY + 24;
  const qrSize = 100;
  const h = footerRuleY + 18 + qrSize + 22;

  return {
    isDated, statusY, kickerY, rangeY, heroFont, pillsTop, pillH, tagY, slab1Y,
    bandTop, bandH, slab2Y, ladderTop, rowH, ladderRows, trajTop, trajH, capY, footerRuleY, qrSize, h,
  };
}

// Content-fit height for a given model. Used by the React canvas to size its
// backing store + aspect ratio so there is no fixed void.
export function cardHeight(m: CardModel): number {
  return layoutCard(m).h;
}

/* ---------------- the card ---------------- */
export function drawScoreCard(ctx: Ctx, m: CardModel, scale = 1) {
  const L = layoutCard(m);
  const W = CARD_W, H = L.h;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, W, H);

  // background: flat ink, a top gold glow, a faint grid, and the inner frame.
  ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -60, 0, W / 2, -60, 760);
  glow.addColorStop(0, m.fail ? 'rgba(154,161,171,0.06)' : 'rgba(227,181,66,0.10)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 520);
  ctx.strokeStyle = 'rgba(255,255,255,0.02)'; ctx.lineWidth = 1;
  for (let gx = 0; gx <= W; gx += 36) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (let gy = 0; gy <= H; gy += 36) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
  rr(ctx, 4, 4, W - 8, H - 8, 26); ctx.strokeStyle = K.hairS; ctx.lineWidth = 2; ctx.stroke();

  const x0 = M, x1 = W - M;

  // brand
  ctx.save(); ctx.shadowColor = K.green; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.arc(x0 + 11, 64, 11, 0, Math.PI * 2); ctx.fillStyle = K.green; ctx.fill(); ctx.restore();
  ctx.font = fmono(36, 800); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.fillStyle = K.ink; tracked(ctx, 'STEP', x0 + 34, 76, 3, 'left');
  let stepW = 0; for (const ch of 'STEP') stepW += ctx.measureText(ch).width + 3;
  ctx.fillStyle = K.green; tracked(ctx, 'GUNNER', x0 + 34 + stepW + 14, 76, 3, 'left');
  ctx.font = fmono(19, 700); ctx.fillStyle = K.faint; ctx.textAlign = 'right';
  tracked(ctx, ('STEP 2 CK . ' + m.kind).toUpperCase(), x1, 74, 2, 'right');
  ctx.strokeStyle = K.hair; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, 108); ctx.lineTo(x1, 108); ctx.stroke();

  // optional status line
  if (L.statusY != null) {
    ctx.font = fsans(24, 600); ctx.fillStyle = K.dim; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(fit(ctx, m.status, x1 - x0), x0, L.statusY);
  }

  // hero: kicker, big gold range, percentile pill (+ pass-line pill when in question)
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.font = fmono(21, 600); ctx.fillStyle = K.faint;
  tracked(ctx, m.heroKicker.toUpperCase(), x0, L.kickerY, 3, 'left');
  drawHeroValue(ctx, m, x0, L.rangeY, L.heroFont);
  const pills: { t: string; c: string }[] = [{ t: m.pctChip.toUpperCase(), c: K.violet }];
  if (m.verdictChip) pills.push({ t: m.verdictChip.toUpperCase(), c: m.verdictColor });
  drawPills(ctx, pills, x0, L.pillsTop, L.pillH);
  if (m.heroTag) {
    ctx.font = fsans(23, 500); ctx.fillStyle = K.dim; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(fit(ctx, m.heroTag, x1 - x0), x0, L.tagY);
  }

  if (L.isDated) {
    // DATED: a real trajectory into the projected band at exam day.
    drawSlab(ctx, x0, x1, L.slab1Y, 'Your trajectory', 'tracked to exam day');
    drawChart(ctx, m, x0, L.trajTop, x1 - x0, L.trajH);
    drawCaption(ctx, x0, x1, L.capY, 'Green line: your tests in order. Dashed gold: projected lift to exam day.');
  } else {
    // UNDATED: focal band chart, then the ranked ladder on the same axis.
    const bandRight = m.actual != null ? undefined
      : m.dated.length === 0 ? 'rough . add exam date to tighten'
        : (m.tierChip || undefined);
    drawSlab(ctx, x0, x1, L.slab1Y, 'Projected range', bandRight);
    drawBandChart(ctx, m, L.bandTop, L.bandH);
    drawSlab(ctx, x0, x1, L.slab2Y, m.actual != null ? 'Scores, ranked' : 'Practice scores, ranked', 'n = ' + L.ladderRows);
    drawScoreLadder(ctx, m, L.ladderTop, L.rowH, x1);
    drawCaption(ctx, x0, x1, L.capY, m.actual != null
      ? 'Gold marks your projection band and your actual Step 2 score.'
      : 'Gold marks your projection band and your freshest test, which drives it most.');
  }

  // footer: CTA + share QR
  ctx.strokeStyle = K.hair; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, L.footerRuleY); ctx.lineTo(x1, L.footerRuleY); ctx.stroke();
  const qrSize = L.qrSize, qrX = x1 - qrSize, qrY = L.footerRuleY + 18;
  drawQR(ctx, m.shareUrl, qrX, qrY, qrSize);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.font = fsans(28, 700); ctx.fillStyle = K.ink; ctx.fillText(m.footerCta, x0, L.footerRuleY + 46);
  ctx.font = fmono(19, 500); ctx.fillStyle = K.dim; ctx.fillText('stepgunner.com/readiness', x0, L.footerRuleY + 78);

  ctx.restore();
}
