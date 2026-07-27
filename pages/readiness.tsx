import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

const APP = 'https://apps.apple.com/us/app/step-gunner/id6761317357';
const PASS = 218; // USMLE Step 2 CK minimum passing score
const MEAN = 250; // US LCME first-taker Step 2 CK mean, 2024-2025 (SD 15), USMLE Score Interpretation Guidelines
const GMIN = 205, GMAX = 275; // range-gauge scale
const FORMS = ['NBME 9', 'NBME 10', 'NBME 11', 'NBME 12', 'NBME 13', 'NBME 14', 'NBME 15', 'NBME 16', 'UWSA 1', 'UWSA 2', 'UWSA 3'];

// Step 2 CK percentile norm table (USMLE Score Interpretation Guidelines, Table 2,
// LCME first-takers July 2022 - June 2025, N=67,934). Linearly interpolated.
const NORM: [number, number][] = [
  [200, 0], [205, 1], [210, 1], [215, 2], [220, 4], [225, 6], [230, 10], [235, 16],
  [240, 24], [245, 34], [250, 47], [255, 60], [260, 74], [265, 85], [270, 94], [275, 98], [300, 100],
];
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function percentile(score: number): number {
  const s = clamp(score, 200, 300);
  for (let i = 0; i < NORM.length - 1; i++) {
    const [x0, y0] = NORM[i], [x1, y1] = NORM[i + 1];
    if (s >= x0 && s <= x1) return Math.round(y0 + ((y1 - y0) * (s - x0)) / (x1 - x0));
  }
  return s >= 300 ? 100 : 0;
}
function ordinal(n: number) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function bandForDays(days: number | null): { band: number; tier: string } {
  if (days == null || Number.isNaN(days)) return { band: 14, tier: 'Rough (add your exam date)' };
  if (days <= 14) return { band: 8, tier: 'Tight' };
  if (days <= 30) return { band: 12, tier: 'Moderate' };
  if (days <= 60) return { band: 16, tier: 'Wide' };
  return { band: 22, tier: 'Very wide (exam far out)' };
}
function gpct(v: number) { return ((clamp(v, GMIN, GMAX) - GMIN) / (GMAX - GMIN)) * 100; }

type Entry = { form: string; score: string; days: string };
type Proj = { low: number; high: number; band: number; tier: string; verdict: string; vclass: string; center: number };

export default function Readiness() {
  const [entries, setEntries] = useState<Entry[]>([{ form: '', score: '', days: '' }]);
  const lastSent = useRef('');

  // Persist on this device.
  useEffect(() => {
    try { const s = localStorage.getItem('gunner_readiness'); if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length) setEntries(p); } } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('gunner_readiness', JSON.stringify(entries)); } catch { /* ignore */ }
  }, [entries]);

  const parsed = entries
    .map((e) => ({ s: parseInt(e.score, 10), d: e.days === '' ? null : parseInt(e.days, 10), form: e.form }))
    .filter((p) => !Number.isNaN(p.s) && p.s >= 130 && p.s <= 300);
  const dated = parsed.filter((p) => p.d != null && !Number.isNaN(p.d)) as { s: number; d: number; form: string }[];
  const freshest = dated.length
    ? dated.reduce((a, b) => (b.d < a.d ? b : a))
    : parsed.length ? { s: parsed[parsed.length - 1].s, d: null as number | null } : null;

  let proj: Proj | null = null;
  if (freshest) {
    const { band, tier } = bandForDays(freshest.d);
    const low = clamp(Math.round(freshest.s - band), 180, 300);
    const high = clamp(Math.round(freshest.s + band), 180, 300);
    let verdict: string, vclass: string;
    if (low >= PASS) { verdict = `Clears the ${PASS} pass line.`; vclass = 'ok'; }
    else if (high >= PASS) { verdict = `Straddles the ${PASS} pass line. Keep building.`; vclass = 'warn'; }
    else { verdict = `Below the ${PASS} pass line. There is time to build.`; vclass = 'low'; }
    proj = { low, high, band, tier, verdict, vclass, center: freshest.s };
  }

  // Save each settled check anonymously (aggregate dataset). Debounced + de-duped.
  useEffect(() => {
    if (!proj) return;
    const payload = JSON.stringify({ entries: entries.filter((e) => e.score !== ''), projected: { low: proj.low, high: proj.high } });
    if (payload === lastSent.current) return;
    const t = setTimeout(() => {
      lastSent.current = payload;
      fetch('/api/readiness', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => { /* ignore */ });
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const setEntry = (i: number, patch: Partial<Entry>) => setEntries((es) => es.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const addEntry = () => setEntries((es) => (es.length < 12 ? [...es, { form: '', score: '', days: '' }] : es));
  const removeEntry = (i: number) => setEntries((es) => (es.length > 1 ? es.filter((_, j) => j !== i) : es));
  const onlyNum = (v: string, n: number) => v.replace(/[^0-9]/g, '').slice(0, n);
  const showTrajectory = dated.length >= 2 && !!proj;

  return (
    <>
      <Head>
        <title>Step 2 Readiness Check — Step Gunner</title>
        <meta name="description" content="Enter your NBME or UWSA scores and see a projected Step 2 CK range, percentile, and trajectory, free. Step Gunner tracks every practice test to exam day." />
        <meta property="og:title" content="Step 2 Readiness Check — Step Gunner" />
        <meta property="og:description" content="See your projected Step 2 CK range, percentile, and trajectory from your NBMEs, free." />
        <meta property="og:url" content="https://stepgunner.com/readiness" />
        <meta property="og:image" content="https://stepgunner.com/screenshots/showcase/01-home.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0a0b0d" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="page">
        <nav className="nav">
          <Link href="/" className="wm"><span className="dot" /><span className="wt">STEP <b className="g">GUNNER</b></span></Link>
          <a href={APP} className="nav-cta">Download</a>
        </nav>

        <main className="wrap">
          <span className="badge">Free readiness check</span>
          <h1>How ready are you for Step 2 CK?</h1>
          <p className="sub">Drop in your NBME or UWSA scores and see a projected Step 2 range, percentile, and trajectory. No sign-up.</p>

          <div className="tool">
            {entries.map((e, i) => (
              <div className="entry" key={i}>
                <label className="field">
                  {i === 0 && <span>Form</span>}
                  <select value={e.form} onChange={(ev) => setEntry(i, { form: ev.target.value })}>
                    <option value="">Form</option>
                    {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
                <label className="field">
                  {i === 0 && <span>Score</span>}
                  <input inputMode="numeric" placeholder="248" value={e.score} onChange={(ev) => setEntry(i, { score: onlyNum(ev.target.value, 3) })} />
                </label>
                <label className="field">
                  {i === 0 && <span>Days out <em>(opt.)</em></span>}
                  <input inputMode="numeric" placeholder="21" value={e.days} onChange={(ev) => setEntry(i, { days: onlyNum(ev.target.value, 3) })} />
                </label>
                <button className="rm" aria-label="remove" onClick={() => removeEntry(i)} style={{ visibility: i === 0 ? 'hidden' : 'visible' }}>✕</button>
              </div>
            ))}
            <button className="add" onClick={addEntry}>+ Add another NBME / UWSA</button>

            {proj ? (
              <div className="result">
                {showTrajectory ? <Trajectory dated={dated} proj={proj} /> : <Gauge proj={proj} />}
                <div className="rk">Projected Step 2 CK</div>
                <div className="rv">{proj.low}<span className="d"> to </span>{proj.high}</div>
                <div className="chips">
                  <span className="chip pctl">proj. {ordinal(percentile(proj.center))} %ile</span>
                  <span className="chip">{proj.tier} range</span>
                  <span className={'chip ' + proj.vclass}>{proj.verdict}</span>
                </div>
                <p className="fine">
                  {showTrajectory
                    ? 'Green dots are your scores; the gold band is your projected range at exam day. Percentile vs US first-takers. A rough estimate, not a guarantee.'
                    : 'A rough range, not a guarantee. It widens the farther your test is from exam day. Add another NBME to see your trajectory.'}
                </p>
              </div>
            ) : (
              <div className="result empty">
                <div className="rk">Projected Step 2 CK</div>
                <div className="rv muted">, to ,</div>
                <p className="fine">Enter a score between 130 and 300 to see your range.</p>
              </div>
            )}
          </div>
          <p className="saved">Your entries stay on this device and are saved anonymously (no name or email) to sharpen these projections.</p>

          <section className="upsell">
            <div className="ueyebrow">This is one snapshot. The app tracks the whole climb.</div>
            <h2>Get the full trajectory and your own share card.</h2>
            <p>
              Step Gunner logs every NBME, plots your score over time, projects it to your exam date,
              and turns it into a share-ready score card. Plus a deep question bank, spaced repetition,
              and weekly leagues. Free to start.
            </p>
            <a href={APP} className="btn-store"><svg className="apple" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg> Get Step Gunner on the App Store</a>
          </section>

          <footer className="foot">
            <Link href="/">stepgunner.com</Link>
            <span>Rezumab LLC</span>
          </footer>
        </main>
      </div>

      <style jsx global>{`
        :root {
          --bg: #0a0b0d; --bg-2: #0d0e13; --bg-3: #121317;
          --hair: rgba(255,255,255,0.08); --hair-strong: rgba(255,255,255,0.14);
          --ink: #f4f6f8; --ink-dim: #9aa1ab; --ink-faint: #5c636e;
          --green: #46d877; --gold: #e3b542; --blue: #5090f7; --red: #ef6d6d; --violet: #af52ff;
          --mono: ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, monospace;
          --sans: 'DM Sans', -apple-system, system-ui, sans-serif;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { font-family: var(--sans); color: var(--ink); background: var(--bg); -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <style jsx>{`
        .page { min-height: 100vh; background:
          radial-gradient(90% 55% at 50% -8%, rgba(70,216,119,0.08), transparent 60%),
          linear-gradient(var(--hair) 1px, transparent 1px) 0 0/26px 26px,
          linear-gradient(90deg, var(--hair) 1px, transparent 1px) 0 0/26px 26px, var(--bg); }
        .nav { display: flex; align-items: center; justify-content: space-between; max-width: 660px; margin: 0 auto; padding: 20px 22px; }
        .wm { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-weight: 700; letter-spacing: 2.5px; font-size: 14px; }
        .wm .wt b.g { color: var(--blue); font-weight: 700; }
        .wm .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 9px var(--green); flex: 0 0 auto; }
        .nav-cta { background: var(--blue); color: #fff; padding: 9px 18px; border-radius: 10px; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 1px; }

        .wrap { max-width: 640px; margin: 0 auto; padding: 30px 22px 80px; }
        .badge { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--green); border: 1px solid rgba(70,216,119,0.3); background: rgba(70,216,119,0.06); padding: 6px 15px; border-radius: 999px; }
        h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1; margin: 20px 0 10px; }
        .sub { color: var(--ink-dim); font-size: 16px; margin: 0 0 26px; max-width: 38ch; }

        .tool { border: 1px solid var(--hair-strong); background: var(--bg-2); border-radius: 16px; padding: 18px; }
        .entry { display: grid; grid-template-columns: 1.15fr 1fr 1fr 28px; gap: 10px; align-items: end; margin-bottom: 12px; }
        .field span { display: block; font-family: var(--mono); font-size: 10px; letter-spacing: 0.4px; text-transform: uppercase; color: var(--ink-dim); margin-bottom: 7px; white-space: nowrap; }
        .field em { color: var(--ink-faint); font-style: normal; text-transform: none; letter-spacing: 0; }
        .field input, .field select { width: 100%; background: var(--bg-3); border: 1px solid var(--hair-strong); border-radius: 10px; color: var(--ink); font-family: var(--mono); font-size: 16px; font-weight: 700; padding: 11px 12px; outline: none; height: 46px; }
        .field select { appearance: none; -webkit-appearance: none; cursor: pointer; font-size: 13px; }
        .field input:focus, .field select:focus { border-color: var(--green); }
        .field input::placeholder { color: var(--ink-faint); font-weight: 500; }
        .rm { height: 46px; background: transparent; border: 1px solid var(--hair); border-radius: 10px; color: var(--ink-faint); font-size: 12px; cursor: pointer; padding: 0; }
        .rm:hover { color: var(--red); border-color: rgba(239,109,109,0.4); }
        .add { width: 100%; margin-top: 2px; background: transparent; border: 1px dashed var(--hair-strong); border-radius: 10px; color: var(--ink-dim); font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.4px; padding: 11px; cursor: pointer; }
        .add:hover { border-color: var(--green); color: var(--green); }

        .result { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--hair); text-align: center; }
        .rk { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); }
        .rv { font-family: var(--mono); font-size: 44px; font-weight: 800; letter-spacing: -1.5px; color: var(--gold); line-height: 1.05; margin-top: 4px; }
        .rv.muted { color: var(--ink-faint); }
        .rv .d { font-size: 20px; color: var(--ink-dim); font-weight: 600; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 12px 0 4px; }
        .chip { font-family: var(--mono); font-size: 11px; font-weight: 700; padding: 5px 11px; border-radius: 999px; border: 1px solid var(--hair-strong); color: var(--ink-dim); }
        .chip.pctl { color: var(--violet); border-color: rgba(175,82,255,0.4); }
        .chip.ok { color: var(--green); border-color: rgba(70,216,119,0.4); }
        .chip.warn { color: var(--gold); border-color: rgba(227,181,66,0.4); }
        .chip.low { color: var(--red); border-color: rgba(239,109,109,0.4); }
        .fine { color: var(--ink-faint); font-size: 12.5px; line-height: 1.5; margin: 12px auto 0; max-width: 46ch; }
        .saved { text-align: center; color: var(--ink-faint); font-family: var(--mono); font-size: 10.5px; margin: 14px 0 0; letter-spacing: 0.2px; }

        .upsell { margin-top: 34px; border: 1px solid var(--hair); background: var(--bg-2); border-radius: 16px; padding: 26px 22px; }
        .ueyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--ink-faint); }
        .upsell h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.3px; margin: 10px 0 10px; }
        .upsell p { color: var(--ink-dim); font-size: 15px; line-height: 1.55; margin: 0 0 20px; }
        .btn-store { display: inline-flex; align-items: center; gap: 9px; background: var(--green); color: #05130a; font-family: var(--mono); font-weight: 800; font-size: 13px; letter-spacing: 0.4px; padding: 13px 20px; border-radius: 12px; box-shadow: 0 6px 26px rgba(70,216,119,0.28); }
        .btn-store .apple { width: 14px; height: 17px; flex: 0 0 auto; }

        .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 34px; font-family: var(--mono); font-size: 11px; color: var(--ink-faint); }
        .foot :global(a) { color: var(--ink-dim); }

        @media (max-width: 480px) { .entry { grid-template-columns: 1fr 1fr; } .field.rmwrap { display: none; } .rm { grid-column: 2; } }
      `}</style>
    </>
  );
}

// Always-on range gauge: the projected band on a 205-275 scale with pass + mean markers.
function Gauge({ proj }: { proj: Proj }) {
  return (
    <div className="gauge">
      <div className="track">
        <div className="band" style={{ left: gpct(proj.low) + '%', width: (gpct(proj.high) - gpct(proj.low)) + '%' }} />
        <div className="mk pass" style={{ left: gpct(PASS) + '%' }} />
        <div className="mk mean" style={{ left: gpct(MEAN) + '%' }} />
        <div className="lbl pass" style={{ left: gpct(PASS) + '%' }}>{PASS} pass</div>
        <div className="lbl mean" style={{ left: gpct(MEAN) + '%' }}>avg {MEAN}</div>
      </div>
      <div className="scale"><span>{GMIN}</span><span>{GMAX}</span></div>
      <style jsx>{`
        .gauge { margin: 0 auto 18px; max-width: 340px; }
        .track { position: relative; height: 12px; background: var(--bg-3); border: 1px solid var(--hair); border-radius: 999px; margin-top: 30px; }
        .band { position: absolute; top: -1px; bottom: -1px; background: linear-gradient(90deg, rgba(227,181,66,0.5), var(--gold)); border-radius: 999px; box-shadow: 0 0 14px rgba(227,181,66,0.4); }
        .mk { position: absolute; top: -4px; width: 2px; height: 20px; transform: translateX(-1px); }
        .mk.pass { background: var(--red); } .mk.mean { background: var(--ink-dim); }
        .lbl { position: absolute; top: -26px; transform: translateX(-50%); font-family: var(--mono); font-size: 8.5px; letter-spacing: 0.4px; white-space: nowrap; }
        .lbl.pass { color: var(--red); } .lbl.mean { color: var(--ink-dim); }
        .scale { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 9px; color: var(--ink-faint); margin-top: 8px; }
      `}</style>
    </div>
  );
}

// Trajectory chart: real scores over days-before-exam, projected to exam day, with band + refs.
function Trajectory({ dated, proj }: { dated: { s: number; d: number; form: string }[]; proj: Proj }) {
  const pts = [...dated].sort((a, b) => b.d - a.d);
  const maxD = Math.max(pts[0].d, 1);
  const W = 340, H = 182, L = 30, R = 322, T = 20, B = 142;
  const allS = pts.map((p) => p.s).concat([proj.low, proj.high, PASS]);
  const yMin = Math.min(...allS) - 4, yMax = Math.max(...allS) + 4;
  const xForD = (d: number) => L + ((maxD - d) / maxD) * (R - L);
  const yForS = (s: number) => B - ((s - yMin) / (yMax - yMin)) * (B - T);
  const line = pts.map((p) => `${xForD(p.d)},${yForS(p.s)}`).join(' ');
  const last = pts[pts.length - 1];
  const refs = [PASS, MEAN].filter((v) => v > yMin && v < yMax);
  const shortForm = (f: string) => f.replace('NBME ', 'N').replace('UWSA ', 'U') || '';

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Your NBME scores over time, projected to exam day">
        {refs.map((v) => (
          <g key={v}>
            <line x1={L} y1={yForS(v)} x2={R} y2={yForS(v)} stroke={v === PASS ? 'rgba(239,109,109,0.35)' : '#2a3038'} strokeWidth={1} strokeDasharray="4 3" />
            <text x={R} y={yForS(v) - 3} fill={v === PASS ? '#ef6d6d' : '#5c636e'} fontFamily="ui-monospace, monospace" fontSize={7.5} textAnchor="end">{v === PASS ? `PASS ${PASS}` : `AVG ${MEAN}`}</text>
          </g>
        ))}
        <path d={`M${xForD(last.d)},${yForS(last.s)} L${R},${yForS(proj.high)} L${R},${yForS(proj.low)} Z`} fill="rgba(227,181,66,0.13)" />
        <polyline points={line} fill="none" stroke="#46d877" strokeWidth={2.2} />
        <line x1={xForD(last.d)} y1={yForS(last.s)} x2={R} y2={yForS(proj.center)} stroke="#e3b542" strokeWidth={2.2} strokeDasharray="5 4" opacity={0.85} />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={xForD(p.d)} cy={yForS(p.s)} r={4} fill="#46d877" stroke="#0a0b0d" strokeWidth={1.5} />
            <text x={xForD(p.d)} y={yForS(p.s) - 16} fill="#5c636e" fontFamily="ui-monospace, monospace" fontSize={6.5} textAnchor="middle">{shortForm(p.form)}</text>
            <text x={xForD(p.d)} y={yForS(p.s) - 8} fill="#f4f6f8" fontFamily="ui-monospace, monospace" fontSize={9} fontWeight={800} textAnchor="middle">{p.s}</text>
            <text x={xForD(p.d)} y={B + 13} fill="#9aa1ab" fontFamily="ui-monospace, monospace" fontSize={7.5} textAnchor="middle">{p.d}d</text>
          </g>
        ))}
        <circle cx={R} cy={yForS(proj.center)} r={4.5} fill="none" stroke="#e3b542" strokeWidth={2} />
        <text x={R} y={B + 13} fill="#e3b542" fontFamily="ui-monospace, monospace" fontSize={7.5} fontWeight={700} textAnchor="middle">EXAM</text>
        <text x={W / 2} y={H - 2} fill="#5c636e" fontFamily="ui-monospace, monospace" fontSize={7} letterSpacing={1} textAnchor="middle">DAYS BEFORE EXAM</text>
      </svg>
      <style jsx>{`
        .chart { margin: 0 auto 16px; max-width: 360px; }
        .chart svg { display: block; width: 100%; height: auto; }
      `}</style>
    </div>
  );
}
