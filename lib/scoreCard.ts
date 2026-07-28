// Canvas renderer + model for the shareable Step 2 score card. One renderer is
// both the on-page preview and the downloaded PNG (no divergence, no html2canvas).
// Design space is 1080x1350 (4:5); the caller sets the backing store and passes a
// scale so the export is crisp. Tokens mirror the /readiness page exactly.
import qrcode from 'qrcode-generator';
import {
  PASS, MEAN, shareUrl, buildCardCore,
  type Entry,
} from './readiness';

export const K = {
  bg: '#0a0b0d', bg2: '#0d0e13', bg3: '#121317',
  hair: 'rgba(255,255,255,0.08)', hairS: 'rgba(255,255,255,0.14)',
  ink: '#f4f6f8', dim: '#9aa1ab', faint: '#5c636e',
  green: '#46d877', gold: '#e3b542', red: '#ef6d6d', violet: '#af52ff', ref: '#2a3038',
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
export const CARD_H = 1350;

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
  while (t.length > 4 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
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

/* ---------------- the card ---------------- */
export function drawScoreCard(ctx: Ctx, m: CardModel, scale = 1) {
  const W = CARD_W, H = CARD_H;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = K.bg; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -60, 0, W / 2, -60, 760);
  glow.addColorStop(0, m.fail ? 'rgba(154,161,171,0.06)' : 'rgba(227,181,66,0.10)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 520);
  ctx.strokeStyle = 'rgba(255,255,255,0.02)'; ctx.lineWidth = 1;
  for (let gx = 0; gx <= W; gx += 36) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (let gy = 0; gy <= H; gy += 36) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
  rr(ctx, 4, 4, W - 8, H - 8, 26); ctx.strokeStyle = K.hairS; ctx.lineWidth = 2; ctx.stroke();

  const M = 64, x0 = M, x1 = W - M;

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

  // TL;DR anchor
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  if (m.status) { ctx.font = fsans(25, 600); ctx.fillStyle = K.dim; ctx.fillText(fit(ctx, m.status, 460), x0, 150); }
  ctx.textAlign = 'right';
  ctx.font = fmono(30, 800);
  const hw = ctx.measureText(m.heroValue).width;
  ctx.fillStyle = m.fail ? K.ink : K.gold; ctx.fillText(m.heroValue, x1, 150);
  if (m.fromLabel) {
    ctx.font = fmono(24, 400); ctx.fillStyle = K.faint;
    ctx.fillText(m.fromLabel + '  → ', x1 - hw - 8, 150);
  }

  let cy = 150;

  // chart
  if (m.dated.length >= 2) {
    drawChart(ctx, m, x0, 176, x1 - x0, 372);
    cy = 176 + 372;
    ctx.textBaseline = 'alphabetic';
    let lx = x0 + 2; const ly = cy + 8;
    const leg = (color: string, dash: boolean, label: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash(dash ? [6, 4] : []);
      ctx.beginPath(); ctx.moveTo(lx, ly - 5); ctx.lineTo(lx + 22, ly - 5); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = fmono(15); ctx.fillStyle = K.faint; ctx.textAlign = 'left'; ctx.fillText(label, lx + 30, ly);
      lx += 30 + ctx.measureText(label).width + 26;
    };
    leg(m.fail ? K.dim : K.green, false, 'PRACTICE');
    leg(m.fail ? K.dim : K.gold, true, m.actual != null ? 'TO ACTUAL' : 'PROJECTED');
    cy = ly + 26;
  } else {
    cy = 210;
  }

  // hero
  const heroBig = m.isRange ? 92 : 148;
  ctx.textAlign = 'center';
  ctx.font = fmono(21, 600); ctx.fillStyle = K.faint;
  tracked(ctx, m.heroKicker.toUpperCase(), W / 2, cy + 52, 3, 'center');
  ctx.font = fmono(heroBig, 800);
  if (m.fail) { ctx.fillStyle = K.ink; }
  else { ctx.save(); ctx.shadowColor = 'rgba(227,181,66,0.45)'; ctx.shadowBlur = 44; ctx.fillStyle = K.gold; }
  const heroY = cy + 52 + (m.isRange ? 96 : 132);
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(m.heroValue, W / 2, heroY);
  if (!m.fail) ctx.restore();
  ctx.font = fsans(23, 500); ctx.fillStyle = K.dim; ctx.textAlign = 'center';
  if (m.heroTag) ctx.fillText(fit(ctx, m.heroTag, 820), W / 2, heroY + 42);

  cy = heroY + 42 + 26;

  // chips
  const chips: { t: string; c: string }[] = [{ t: m.pctChip, c: K.violet }];
  if (m.tierChip) chips.push({ t: m.tierChip, c: K.dim });
  if (m.verdictChip) chips.push({ t: m.verdictChip, c: m.verdictColor });
  ctx.font = fmono(19, 700);
  const chipH = 46, gap = 14, padX = 20;
  let totalW = 0;
  const ws = chips.map((ch) => { const w = ctx.measureText(ch.t).width + padX * 2; totalW += w; return w; });
  totalW += gap * (chips.length - 1);
  let chx = W / 2 - totalW / 2; const chy = cy + 18;
  chips.forEach((ch, i) => {
    rr(ctx, chx, chy, ws[i], chipH, chipH / 2);
    ctx.strokeStyle = ch.c; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.4; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = ch.c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch.t, chx + ws[i] / 2, chy + chipH / 2 + 1);
    chx += ws[i] + gap;
  });
  ctx.textBaseline = 'alphabetic';
  cy = chy + chipH + 20;

  // ledger
  const footerRuleY = H - 114;
  ctx.fillStyle = K.faint; ctx.font = fmono(17, 700); ctx.textAlign = 'left';
  tracked(ctx, 'PRACTICE SCORES', x0, cy + 22, 2, 'left');
  let lty = cy + 22 + 30;
  const rows = m.ledger;
  const avail = footerRuleY - 22 - lty;
  const rowH = Math.max(30, Math.min(50, avail / Math.max(rows.length, 1)));
  const rfs = Math.min(27, rowH - 6);
  rows.forEach((row) => {
    const yb = lty + rowH * 0.68;
    ctx.font = fmono(rfs, row.brand ? 700 : 400);
    ctx.fillStyle = row.brand ? K.green : row.gold ? K.gold : K.dim;
    ctx.textAlign = 'left'; ctx.fillText(row.k, x0, yb);
    const kW = ctx.measureText(row.k).width;
    ctx.font = fmono(rfs, 800); ctx.fillStyle = row.gold ? K.gold : row.brand ? K.green : K.ink;
    ctx.textAlign = 'right'; ctx.fillText(row.v, x1, yb);
    const vW = ctx.measureText(row.v).width;
    let dW = 0;
    if (row.d) {
      ctx.font = fmono(rfs - 3, 600); ctx.fillStyle = K.faint;
      ctx.fillText(row.d, x1 - vW - 10, yb);
      dW = ctx.measureText(row.d).width + 20;
    }
    const dStart = x0 + kW + 14, dEnd = x1 - vW - (row.d ? dW : 10);
    if (dEnd > dStart) {
      ctx.strokeStyle = K.hair; ctx.lineWidth = 1; ctx.setLineDash([1, 6]);
      ctx.beginPath(); ctx.moveTo(dStart, yb - 6); ctx.lineTo(dEnd, yb - 6); ctx.stroke(); ctx.setLineDash([]);
    }
    lty += rowH;
  });

  // footer
  ctx.strokeStyle = K.hair; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, footerRuleY); ctx.lineTo(x1, footerRuleY); ctx.stroke();
  const qrSize = 94, qrX = x1 - qrSize, qrY = footerRuleY + 16;
  drawQR(ctx, m.shareUrl, qrX, qrY, qrSize);
  ctx.textAlign = 'left';
  ctx.font = fsans(27, 700); ctx.fillStyle = K.ink; ctx.fillText(m.footerCta, x0, footerRuleY + 42);
  ctx.font = fmono(19, 500); ctx.fillStyle = K.dim; ctx.fillText('stepgunner.com/readiness', x0, footerRuleY + 72);

  ctx.restore();
}
