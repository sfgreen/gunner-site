import { useEffect, useRef, useState } from 'react';
import { PASS, MEAN, GMIN, GMAX, type Proj } from '../../../lib/readiness';

// The readiness pictures, in the app look: the range gauge (the home page's gauge,
// lib/wards/render.js readinessOut, plus the national mean) and the trajectory chart.
// Dark by default, for the dark tool card in a Stage; `light` for a white article page
// (the methodology). Colors only from tokens, through classes, so both themes hold.

const gx = (v: number) => `${(((Math.max(GMIN, Math.min(GMAX, v)) - GMIN) / (GMAX - GMIN)) * 100).toFixed(3)}%`;
const TICKS = [210, 220, 230, 240, 250, 260, 270];

/** The projected band on the GMIN..GMAX scale with the pass line, the US mean and the
 *  most likely score. Every number is also in the text beside it; the aria-label says it. */
export function RangeGauge({ low, high, center, light = false, showCenterLabel = false }: {
  low: number; high: number; center: number; light?: boolean; showCenterLabel?: boolean;
}) {
  const w = (((Math.min(GMAX, high) - Math.max(GMIN, low)) / (GMAX - GMIN)) * 100).toFixed(3);
  return (
    <div
      className={`gauge tl-gauge${light ? ' light' : ''}${showCenterLabel ? ' has-cl' : ''}`}
      role="img"
      aria-label={`Projected range ${low} to ${high} on a ${GMIN} to ${GMAX} scale, most likely ${center}, pass line ${PASS}, US average ${MEAN}`}
    >
      <div className="g-trk">
        <span className="g-pass" style={{ left: gx(PASS) }}><span className="g-pl">{PASS} pass</span></span>
        <span className="g-pass tl-mean" style={{ left: gx(MEAN) }}><span className="g-pl">avg {MEAN}</span></span>
        <span className="g-band" style={{ left: gx(low), width: `${w}%` }} />
        <span className="g-mid" style={{ left: gx(center) }}>{showCenterLabel && <span className="tl-cl">{center}</span>}</span>
      </div>
      <div className="g-ax" aria-hidden="true">{TICKS.map((t) => <span key={t} style={{ left: gx(t) }}>{t}</span>)}</div>
      <style jsx global>{`
        .mk .tl-gauge { margin-top: 40px; }
        .mk .tl-gauge .tl-mean { border-left-style: dashed; }
        .mk .tl-gauge .tl-mean .g-pl { left: auto; right: -4px; }
        .mk .tl-gauge.has-cl { margin-top: 64px; }
        .mk .tl-gauge .tl-cl { position: absolute; top: -48px; left: 50%; transform: translateX(-50%); font: 700 15px/1 var(--f-mono); color: var(--st-gold); white-space: nowrap; }
        .mk .tl-gauge.light .g-trk { background: var(--card-2); box-shadow: inset 0 0 0 1px var(--line); }
        .mk .tl-gauge.light .g-band { background: var(--differ-fill); box-shadow: inset 0 0 0 1px var(--step2); }
        .mk .tl-gauge.light .g-mid { background: var(--ink); }
        .mk .tl-gauge.light .g-pass { border-left-color: var(--ink-3); }
        .mk .tl-gauge.light .g-pl { color: var(--ink-2); }
        .mk .tl-gauge.light .g-ax { color: var(--ink-3); }
        .mk .tl-gauge.light .tl-cl { color: var(--step2); }
      `}</style>
    </div>
  );
}

type Pt = { s: number; d: number; form: string };

/** Real scores over days before the exam, projected to exam day: the gold cone is the
 *  range, the dashed line runs to the most likely score. Drawn at the container's own
 *  pixel width (ResizeObserver), so the labels are real 13px text on a phone and on a
 *  desktop rather than a scaled-down picture. */
export function Trajectory({ dated, proj }: { dated: Pt[]; proj: Proj }) {
  const ref = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(360);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width); if (w > 0) setW(w); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts = [...dated].sort((a, b) => b.d - a.d);
  const maxD = Math.max(pts[0].d, 1);
  // L is a gutter for the reference labels (PASS, AVG), so they never sit on the cone or a point.
  const H = 232, L = 76, R = W - 28, T = 44, B = H - 48, X0 = L + 20;
  const allS = pts.map((p) => p.s).concat([proj.low, proj.high, PASS]);
  const yMin = Math.min(...allS) - 4, yMax = Math.max(...allS) + 4;
  const xForD = (d: number) => X0 + ((maxD - d) / maxD) * (R - X0);
  const yForS = (s: number) => B - ((s - yMin) / (yMax - yMin)) * (B - T);
  const line = pts.map((p) => `${xForD(p.d)},${yForS(p.s)}`).join(' ');
  const last = pts[pts.length - 1];
  const refs = [PASS, MEAN].filter((v) => v > yMin && v < yMax);
  const shortForm = (f: string) => f.replace('NBME ', 'N').replace('UWSA ', 'U') || '';
  // A form label is dropped when the next point is too close to fit both; the score stays.
  const roomy = (i: number) => i === pts.length - 1 || xForD(pts[i + 1].d) - xForD(pts[i].d) >= 40;

  return (
    <div className="tl-tr" ref={ref}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Your NBME scores over time, projected to exam day: ${pts.map((p) => `${p.form || 'practice test'} ${p.s}, ${p.d} days out`).join('; ')}. Projected ${proj.low} to ${proj.high}, most likely ${proj.center}.`}>
        {refs.map((v) => (
          <g key={v} className={v === PASS ? 'pass' : 'mean'}>
            <line x1={L} y1={yForS(v)} x2={R} y2={yForS(v)} className="ref" />
            <text x={L - 8} y={yForS(v) + 4} textAnchor="end" className="rl">{v === PASS ? `PASS ${PASS}` : `AVG ${MEAN}`}</text>
          </g>
        ))}
        <line x1={L} y1={B} x2={R} y2={B} className="axis" />
        <path d={`M${xForD(last.d)},${yForS(last.s)} L${R},${yForS(proj.high)} L${R},${yForS(proj.low)} Z`} className="cone" />
        <polyline points={line} className="path" />
        <line x1={xForD(last.d)} y1={yForS(last.s)} x2={R} y2={yForS(proj.center)} className="proj" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={xForD(p.d)} cy={yForS(p.s)} r={5} className="dot" />
            {roomy(i) && <text x={xForD(p.d)} y={yForS(p.s) - 28} textAnchor="middle" className="fm">{shortForm(p.form)}</text>}
            <text x={xForD(p.d)} y={yForS(p.s) - 12} textAnchor="middle" className="sc">{p.s}</text>
            <text x={xForD(p.d)} y={B + 20} textAnchor="middle" className="dd">{p.d}d</text>
          </g>
        ))}
        <circle cx={R} cy={yForS(proj.center)} r={6} className="ex" />
        <text x={R} y={B + 20} textAnchor="middle" className="exl">EXAM</text>
        <text x={(X0 + R) / 2} y={H - 4} textAnchor="middle" className="ax">DAYS BEFORE EXAM</text>
      </svg>
      <style jsx global>{`
        .mk .tl-tr { width: 100%; min-width: 0; }
        .mk .tl-tr svg { display: block; max-width: 100%; height: auto; overflow: visible; }
        .mk .tl-tr text { font-family: var(--f-mono); font-size: 13px; }
        .mk .tl-tr .ref { stroke: var(--st-line-2); stroke-width: 1; stroke-dasharray: 4 4; }
        .mk .tl-tr .pass .ref { stroke: var(--st-red); opacity: .6; }
        .mk .tl-tr .rl { fill: var(--st-ink-3); }
        .mk .tl-tr .pass .rl { fill: var(--st-red); }
        .mk .tl-tr .axis { stroke: var(--st-line-2); stroke-width: 1; }
        .mk .tl-tr .cone { fill: var(--glow-gold); opacity: .45; }
        .mk .tl-tr .path { fill: none; stroke: var(--st-green); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
        .mk .tl-tr .proj { stroke: var(--st-gold); stroke-width: 2.5; stroke-dasharray: 6 5; }
        .mk .tl-tr .dot { fill: var(--st-green); stroke: var(--st-card); stroke-width: 2; }
        .mk .tl-tr .fm { fill: var(--st-ink-3); }
        .mk .tl-tr .sc { fill: var(--st-ink); font-weight: 700; font-size: 15px; }
        .mk .tl-tr .dd { fill: var(--st-ink-3); }
        .mk .tl-tr .ex { fill: var(--st-card); stroke: var(--st-gold); stroke-width: 2.5; }
        .mk .tl-tr .exl { fill: var(--st-gold); font-weight: 700; }
        .mk .tl-tr .ax { fill: var(--st-ink-3); letter-spacing: .08em; }
      `}</style>
    </div>
  );
}
