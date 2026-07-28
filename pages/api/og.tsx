/* eslint-disable @next/next/no-img-element */
// Dynamic Open Graph image for a shared /readiness link. Reads the same ?e=
// param the page uses, rebuilds the shared card model (buildCardCore), and draws
// a 1200x630 landscape card so a pasted link unfurls as the student's own result
// instead of a generic screenshot. Runs at the edge; fonts are static /public
// assets fetched once and memoized. Deliberately mirrors the app score card.
import { ImageResponse } from 'next/og';
import {
  PASS, MEAN, buildCardCore, decodeShare, type CardCore,
} from '../../lib/readiness';

export const config = { runtime: 'edge' };

const C = {
  bg: '#0a0b0d', ink: '#f4f6f8', dim: '#9aa1ab', faint: '#5c636e',
  green: '#46d877', gold: '#e3b542', red: '#ef6d6d', violet: '#af52ff', ref: '#2a3038',
  hair: 'rgba(255,255,255,0.08)', hairS: 'rgba(255,255,255,0.14)',
};

// ---- fonts (memoized across warm invocations) ----
let FONTS: Array<{ name: string; data: ArrayBuffer; weight: 400 | 600 | 700 | 800; style: 'normal' }> | null = null;
async function loadFonts(origin: string) {
  if (FONTS) return FONTS;
  const grab = async (path: string) => (await fetch(new URL(path, origin))).arrayBuffer();
  const [dm6, dm8, mo7, mo8] = await Promise.all([
    grab('/og/dmsans-600.ttf'), grab('/og/dmsans-800.ttf'),
    grab('/og/mono-700.ttf'), grab('/og/mono-800.ttf'),
  ]);
  FONTS = [
    { name: 'DM Sans', data: dm6, weight: 600, style: 'normal' },
    { name: 'DM Sans', data: dm8, weight: 800, style: 'normal' },
    { name: 'JetBrains Mono', data: mo7, weight: 700, style: 'normal' },
    { name: 'JetBrains Mono', data: mo8, weight: 800, style: 'normal' },
  ];
  return FONTS;
}

// ---- trajectory / scale sparkline (native satori SVG) ----
function niceRange(vals: number[]) {
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(4, (hi - lo) * 0.15);
  lo -= pad; hi += pad;
  lo = Math.max(180, lo); hi = Math.min(300, hi);
  if (hi - lo < 12) { const m = (hi + lo) / 2; lo = m - 7; hi = m + 7; }
  return { lo, hi };
}

// A label is HTML (satori can't render <text> inside an inline <svg>), positioned
// absolutely over the chart. anchor picks which edge x refers to.
type Lbl = { x: number; top: number; text: string; color: string; size: number; weight: 700; anchor: 'start' | 'end' | 'middle' };

function Spark({ core }: { core: CardCore }) {
  const W = 440, H = 330;
  const fail = core.fail;
  const line = fail ? C.dim : C.green;
  const accent = fail ? C.dim : C.gold;
  const shapes: JSX.Element[] = [];
  const labels: Lbl[] = [];
  let k = 0;
  const key = () => `s${k++}`;

  const pts = [...core.dated].sort((a, b) => b.days - a.days); // earliest (large days) left
  const trajectory = pts.length >= 2;

  if (trajectory) {
    const xL = 48, xR = 420, yT = 26, yB = 286;
    const scores = pts.map((p) => p.score).concat([PASS]);
    if (core.actual != null) scores.push(core.actual);
    if (core.mode === 'readiness' && core.proj) scores.push(core.proj.low, core.proj.high, core.proj.center);
    if (!fail) scores.push(MEAN);
    const { lo, hi } = niceRange(scores);
    const y = (v: number) => yB - ((v - lo) / (hi - lo)) * (yB - yT);
    const maxD = Math.max(...pts.map((p) => p.days), 1);
    const x = (d: number) => xL + (1 - d / maxD) * (xR - xL);

    if (PASS >= lo && PASS <= hi) {
      shapes.push(<line key={key()} x1={xL} y1={y(PASS)} x2={xR} y2={y(PASS)} stroke={C.red} strokeWidth={2} strokeDasharray="6 7" opacity={0.55} />);
      labels.push({ x: xL, top: y(PASS) - 25, text: 'PASS 218', color: C.red, size: 17, weight: 700, anchor: 'start' });
    }
    if (!fail && MEAN >= lo && MEAN <= hi) {
      shapes.push(<line key={key()} x1={xL} y1={y(MEAN)} x2={xR} y2={y(MEAN)} stroke={C.ref} strokeWidth={2} strokeDasharray="11 8" />);
      // Left edge: the busy region (projection cone, test-day marker) is on the right.
      labels.push({ x: xL, top: y(MEAN) - 24, text: 'US AVG 250', color: C.dim, size: 16, weight: 700, anchor: 'start' });
    }

    const P = pts.map((p) => ({ x: x(p.days), y: y(p.score) }));
    for (let i = 1; i < P.length; i++) if (Math.abs(P[i].x - P[i - 1].x) < 12) P[i].x = P[i - 1].x + 16;
    const d = P.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const endS = core.actual != null ? core.actual : core.proj ? core.proj.center : null;
    const last = P[P.length - 1];
    if (endS != null && core.mode === 'readiness' && core.proj) {
      shapes.push(<path key={key()} d={`M${last.x.toFixed(1)},${last.y.toFixed(1)} L${xR},${y(core.proj.high).toFixed(1)} L${xR},${y(core.proj.low).toFixed(1)} Z`} fill={fail ? 'rgba(154,161,171,0.12)' : 'rgba(227,181,66,0.14)'} />);
      shapes.push(<line key={key()} x1={xR} y1={yT} x2={xR} y2={yB} stroke={C.hairS} strokeWidth={2} strokeDasharray="5 7" />);
      labels.push({ x: xR, top: yT - 20, text: 'TEST DAY', color: C.dim, size: 15, weight: 700, anchor: 'end' });
    }
    shapes.push(<path key={key()} d={d} fill="none" stroke={line} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />);
    if (endS != null) {
      shapes.push(<line key={key()} x1={last.x} y1={last.y} x2={xR} y2={y(endS)} stroke={accent} strokeWidth={7} strokeLinecap="round" strokeDasharray="11 9" opacity={0.9} />);
    }

    P.forEach((p) => shapes.push(<circle key={key()} cx={p.x} cy={p.y} r={10} fill={line} stroke={C.bg} strokeWidth={4} />));
    if (core.actual != null) {
      const ex = xR, ey = y(core.actual);
      if (fail) shapes.push(<path key={key()} d={`M${ex},${ey - 12} L${ex + 12},${ey} L${ex},${ey + 12} L${ex - 12},${ey} Z`} fill={C.bg} stroke={C.dim} strokeWidth={4} />);
      else shapes.push(<path key={key()} d={starPath(ex, ey, 15)} fill={C.gold} />);
    } else if (core.mode === 'readiness' && core.proj) {
      shapes.push(<circle key={key()} cx={xR} cy={y(core.proj.center)} r={9} fill={C.bg} stroke={C.gold} strokeWidth={5} />);
    }
  } else {
    // scale bar: one score (or none) -> a 200..280 number line
    const xL = 40, xR = 420, yb = 196;
    const sx = (s: number) => xL + ((Math.max(200, Math.min(280, s)) - 200) / 80) * (xR - xL);
    shapes.push(<line key={key()} x1={xL} y1={yb} x2={xR} y2={yb} stroke={C.hairS} strokeWidth={2} />);
    [200, 220, 240, 260, 280].forEach((t) => {
      shapes.push(<line key={key()} x1={sx(t)} y1={yb} x2={sx(t)} y2={yb + 10} stroke={C.faint} strokeWidth={2} />);
      labels.push({ x: sx(t), top: yb + 18, text: String(t), color: C.faint, size: 16, weight: 700, anchor: 'middle' });
    });
    if (!fail) {
      shapes.push(<line key={key()} x1={sx(MEAN)} y1={yb - 44} x2={sx(MEAN)} y2={yb} stroke={C.ref} strokeWidth={2} strokeDasharray="6 6" />);
      labels.push({ x: sx(MEAN), top: yb - 66, text: 'US AVG', color: C.dim, size: 15, weight: 700, anchor: 'middle' });
    }
    shapes.push(<line key={key()} x1={sx(PASS)} y1={yb - 70} x2={sx(PASS)} y2={yb} stroke={C.red} strokeWidth={2} strokeDasharray="6 6" opacity={0.7} />);
    labels.push({ x: sx(PASS), top: yb - 92, text: 'PASS 218', color: C.red, size: 15, weight: 700, anchor: 'middle' });

    if (core.mode === 'readiness' && core.proj) {
      shapes.push(<rect key={key()} x={sx(core.proj.low)} y={yb - 26} width={Math.max(4, sx(core.proj.high) - sx(core.proj.low))} height={26} rx={6} fill="rgba(227,181,66,0.18)" stroke={C.gold} strokeWidth={2} />);
      shapes.push(<circle key={key()} cx={sx(core.proj.center)} cy={yb - 13} r={8} fill={C.bg} stroke={C.gold} strokeWidth={4} />);
    }
    if (core.actual != null) {
      const ax = sx(core.actual);
      if (fail) shapes.push(<path key={key()} d={`M${ax},${yb - 26} L${ax + 12},${yb - 13} L${ax},${yb} L${ax - 12},${yb - 13} Z`} fill={C.bg} stroke={C.dim} strokeWidth={4} />);
      else shapes.push(<path key={key()} d={starPath(ax, yb - 13, 15)} fill={C.gold} />);
    }
    if (core.dated.length === 1) {
      shapes.push(<circle key={key()} cx={sx(core.dated[0].score)} cy={yb} r={10} fill={line} stroke={C.bg} strokeWidth={4} />);
    }
  }

  return (
    <div style={{ display: 'flex', position: 'relative', width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', top: 0, left: 0 }}>
        {shapes}
      </svg>
      {labels.map((l, i) => {
        const est = l.text.length * l.size * 0.62;
        const left = l.anchor === 'start' ? l.x : l.anchor === 'end' ? l.x - est : l.x - est / 2;
        return (
          <div
            key={`l${i}`}
            style={{
              position: 'absolute', top: l.top, left: Math.round(left),
              fontFamily: 'JetBrains Mono', fontWeight: l.weight, fontSize: l.size,
              color: l.color, whiteSpace: 'nowrap', display: 'flex',
            }}
          >
            {l.text}
          </div>
        );
      })}
    </div>
  );
}

function starPath(cx: number, cy: number, r: number) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.44 : r;
    const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
    d += `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`;
  }
  return d + 'Z';
}

// ---- chips ----
function chipsFor(core: CardCore): Array<{ t: string; c: string }> {
  if (core.fail) return [{ t: core.verdictChip || 'Below 218', c: C.dim }];
  const out: Array<{ t: string; c: string }> = [{ t: core.pctChip, c: C.violet }];
  if (core.tierChip) out.push({ t: core.tierChip, c: C.dim });
  const vc = { green: C.green, gold: C.gold, red: C.red, dim: C.dim }[core.verdictKey];
  if (core.verdictChip) out.push({ t: core.verdictChip, c: vc });
  return out;
}

// ---- the card ----
function Card({ core }: { core: CardCore }) {
  const heroColor = core.fail ? C.ink : C.gold;
  const chips = chipsFor(core);
  return (
    <div
      style={{
        width: 1200, height: 630, display: 'flex', flexDirection: 'column',
        padding: '44px 58px 40px', color: C.ink, fontFamily: 'DM Sans',
        backgroundColor: C.bg, position: 'relative',
        backgroundImage: 'linear-gradient(150deg, #0f1116 0%, #0a0b0d 46%, #08090b 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 360,
          backgroundImage: core.fail
            ? 'linear-gradient(180deg, rgba(154,161,171,0.07), transparent)'
            : 'linear-gradient(180deg, rgba(227,181,66,0.11), transparent)',
        }}
      />
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, bottom: 16, border: `1px solid ${C.hairS}`, borderRadius: 18 }} />

      {/* top */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.green, marginRight: 14 }} />
          <div style={{ display: 'flex', fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 38, letterSpacing: 3 }}>
            <div>STEP&#8202;</div>
            <div style={{ color: C.green }}>&#8202;GUNNER</div>
          </div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 21, letterSpacing: 3, color: C.faint }}>
          {('Step 2 CK . ' + core.kind).toUpperCase()}
        </div>
      </div>
      <div style={{ height: 1, backgroundColor: C.hair, marginTop: 26 }} />

      {/* middle */}
      <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', paddingRight: 40 }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: 23, letterSpacing: 4, color: C.faint }}>
            {core.heroKicker.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono', fontWeight: 800, lineHeight: 1,
              fontSize: core.isRange ? 100 : 168, color: heroColor,
              margin: '16px 0 14px', display: 'flex',
            }}
          >
            {core.heroValue}
          </div>
          <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: 26, color: C.dim, maxWidth: 560, lineHeight: 1.3 }}>
            {core.heroTag}
          </div>
        </div>
        <div style={{ display: 'flex', width: 440, height: 330, flexShrink: 0 }}>
          <Spark core={core} />
        </div>
      </div>

      {/* bottom */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {chips.map((ch, i) => (
            <div
              key={i}
              style={{
                display: 'flex', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 22,
                padding: '11px 20px', borderRadius: 999, border: `1.4px solid ${ch.c}`,
                color: ch.c, marginRight: 16,
              }}
            >
              {ch.t}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 'auto' }}>
          <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: 25, color: C.ink }}>{core.footerCta}</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 19, color: C.dim, marginTop: 2 }}>stepgunner.com/readiness</div>
        </div>
      </div>
    </div>
  );
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const e = url.searchParams.get('e') || '';
  const decoded = e ? decodeShare(e) : null;
  const core = decoded ? buildCardCore(decoded.entries, decoded.actual, decoded.status) : null;

  // Fallback: a generic-but-branded card when there is no valid payload, so a bare
  // /api/og never 500s a crawler.
  const model: CardCore = core || {
    kind: 'Readiness Report', mode: 'readiness', fail: false, status: '',
    parsed: [], dated: [], actual: null, proj: null,
    fromLabel: '', fromScore: null,
    heroValue: '200 to 280', isRange: true,
    heroKicker: 'Projected Step 2 CK',
    heroTag: 'Drop in your NBME or UWSA scores and see your range, free.',
    pctChip: 'Free readiness check', pct: 0, tierChip: null,
    verdictChip: null, verdictKey: 'dim', footerCta: 'Track your trajectory, free',
  };

  const fonts = await loadFonts(url.origin);
  return new ImageResponse(<Card core={model} />, {
    width: 1200,
    height: 630,
    fonts,
    headers: {
      'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
}
