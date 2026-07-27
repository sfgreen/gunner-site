import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

const APP = 'https://apps.apple.com/us/app/step-gunner/id6761317357';
const PASS = 218; // USMLE Step 2 CK minimum passing score

// Rough projected-range band by how close the assessment is to exam day.
// Grounded in how self-reported NBME/UWSA scores track with real Step 2
// outcomes: the farther out an assessment, the wider the miss. This is a
// deliberately honest, approximate band, not a point prediction.
function project(nbme: number, days: number | null) {
  const s = Math.max(130, Math.min(300, nbme));
  let band: number;
  let tier: string;
  if (days == null || Number.isNaN(days)) { band = 14; tier = 'Rough (timing unknown)'; }
  else if (days <= 14) { band = 8; tier = 'Tight'; }
  else if (days <= 30) { band = 12; tier = 'Moderate'; }
  else if (days <= 60) { band = 16; tier = 'Wide'; }
  else { band = 22; tier = 'Very wide (exam far out)'; }
  const low = Math.max(180, Math.round(s - band));
  const high = Math.min(300, Math.round(s + band));
  let verdict: string;
  if (low >= PASS) verdict = `Clears the ${PASS} pass line.`;
  else if (high >= PASS) verdict = `Straddles the ${PASS} pass line. Keep building.`;
  else verdict = `Below the ${PASS} pass line. There is time to build.`;
  return { low, high, band, tier, verdict };
}

export default function Readiness() {
  const [score, setScore] = useState('');
  const [days, setDays] = useState('');
  const n = parseInt(score, 10);
  const d = days === '' ? null : parseInt(days, 10);
  const valid = !Number.isNaN(n) && n >= 130 && n <= 300;
  const r = valid ? project(n, d) : null;

  return (
    <>
      <Head>
        <title>Step 2 Readiness Check — Step Gunner</title>
        <meta name="description" content="Enter your latest NBME or UWSA score and see a projected Step 2 CK range, free. Step Gunner tracks every practice test and projects your score over time." />
        <meta property="og:title" content="Step 2 Readiness Check — Step Gunner" />
        <meta property="og:description" content="See your projected Step 2 CK range from your latest NBME, free." />
        <meta property="og:url" content="https://stepgunner.com/readiness" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0a0b0d" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="page">
        <nav className="nav">
          <Link href="/" className="wm"><span className="dot" /> STEP<span className="g">GUNNER</span></Link>
          <a href={APP} className="nav-cta">Download</a>
        </nav>

        <main className="wrap">
          <span className="badge">Free readiness check</span>
          <h1>How ready are you for Step 2 CK?</h1>
          <p className="sub">Drop in your most recent NBME or UWSA score and see a projected Step 2 range. No sign-up.</p>

          <div className="tool">
            <div className="fields">
              <label className="field">
                <span>Latest NBME / UWSA score</span>
                <input
                  inputMode="numeric" placeholder="e.g. 248" value={score}
                  onChange={(e) => setScore(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                />
              </label>
              <label className="field">
                <span>Days until your exam <em>(optional)</em></span>
                <input
                  inputMode="numeric" placeholder="e.g. 21" value={days}
                  onChange={(e) => setDays(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                />
              </label>
            </div>

            {r ? (
              <div className="result">
                <div className="rk">Projected Step 2 CK</div>
                <div className="rv">{r.low}<span className="dash"> to </span>{r.high}</div>
                <div className="chips">
                  <span className="chip">{r.tier} range</span>
                  <span className={'chip ' + (r.low >= PASS ? 'ok' : r.high >= PASS ? 'warn' : 'low')}>{r.verdict}</span>
                </div>
                <p className="fine">
                  A rough range, not a guarantee. It widens the farther your test is from exam day,
                  because early scores drift more before the real thing.
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

          <section className="upsell">
            <div className="ueyebrow">One score only tells you so much</div>
            <h2>Track every NBME and watch your trajectory.</h2>
            <p>
              Step Gunner logs each practice test, plots your score over time, projects it forward to
              your exam date, and shows a live readiness gauge. Plus 1,400+ high-yield questions,
              spaced repetition, and weekly leagues. Free to start.
            </p>
            <a href={APP} className="btn-store"><span aria-hidden>{'▸'}</span> Get Step Gunner on the App Store</a>
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
          --green: #46d877; --gold: #e3b542; --blue: #5090f7; --red: #ef6d6d;
          --mono: ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, monospace;
          --sans: 'DM Sans', -apple-system, system-ui, sans-serif;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { font-family: var(--sans); color: var(--ink); background: var(--bg); -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(90% 55% at 50% -8%, rgba(70,216,119,0.08), transparent 60%),
            linear-gradient(var(--hair) 1px, transparent 1px) 0 0/26px 26px,
            linear-gradient(90deg, var(--hair) 1px, transparent 1px) 0 0/26px 26px,
            var(--bg);
        }
        .nav { display: flex; align-items: center; justify-content: space-between; max-width: 900px; margin: 0 auto; padding: 20px 22px; }
        .wm { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-weight: 700; letter-spacing: 2.5px; font-size: 14px; }
        .wm .g { color: var(--blue); }
        .wm .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 9px var(--green); }
        .nav-cta { background: var(--blue); color: #fff; padding: 9px 18px; border-radius: 10px; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 1px; }

        .wrap { max-width: 620px; margin: 0 auto; padding: 34px 22px 80px; }
        .badge { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--green); border: 1px solid rgba(70,216,119,0.3); background: rgba(70,216,119,0.06); padding: 6px 15px; border-radius: 999px; }
        h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1; margin: 20px 0 10px; }
        .sub { color: var(--ink-dim); font-size: 16px; margin: 0 0 26px; max-width: 34ch; }

        .tool { border: 1px solid var(--hair-strong); background: var(--bg-2); border-radius: 16px; padding: 18px; }
        .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 460px) { .fields { grid-template-columns: 1fr; } }
        .field span { display: block; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.6px; text-transform: uppercase; color: var(--ink-dim); margin-bottom: 7px; }
        .field em { color: var(--ink-faint); font-style: normal; text-transform: none; letter-spacing: 0; }
        .field input { width: 100%; background: var(--bg-3); border: 1px solid var(--hair-strong); border-radius: 10px; color: var(--ink); font-family: var(--mono); font-size: 20px; font-weight: 700; padding: 12px 14px; outline: none; }
        .field input:focus { border-color: var(--green); }
        .field input::placeholder { color: var(--ink-faint); font-weight: 500; }

        .result { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--hair); text-align: center; }
        .rk { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); }
        .rv { font-family: var(--mono); font-size: 44px; font-weight: 800; letter-spacing: -1.5px; color: var(--gold); line-height: 1.05; margin-top: 4px; }
        .rv.muted { color: var(--ink-faint); }
        .rv .dash { font-size: 20px; color: var(--ink-dim); font-weight: 600; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 12px 0 4px; }
        .chip { font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 0.4px; padding: 5px 11px; border-radius: 999px; border: 1px solid var(--hair-strong); color: var(--ink-dim); }
        .chip.ok { color: var(--green); border-color: rgba(70,216,119,0.4); }
        .chip.warn { color: var(--gold); border-color: rgba(227,181,66,0.4); }
        .chip.low { color: var(--red); border-color: rgba(239,109,109,0.4); }
        .fine { color: var(--ink-faint); font-size: 12.5px; line-height: 1.5; margin: 12px auto 0; max-width: 42ch; }

        .upsell { margin-top: 40px; border: 1px solid var(--hair); background: var(--bg-2); border-radius: 16px; padding: 26px 22px; }
        .ueyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); }
        .upsell h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.3px; margin: 10px 0 10px; }
        .upsell p { color: var(--ink-dim); font-size: 15px; line-height: 1.55; margin: 0 0 20px; }
        .btn-store { display: inline-flex; align-items: center; gap: 9px; background: var(--green); color: #05130a; font-family: var(--mono); font-weight: 800; font-size: 13px; letter-spacing: 0.4px; padding: 13px 20px; border-radius: 12px; box-shadow: 0 6px 26px rgba(70,216,119,0.28); }
        .btn-store span { font-size: 11px; }

        .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 34px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.5px; color: var(--ink-faint); }
        .foot :global(a) { color: var(--ink-dim); }
      `}</style>
    </>
  );
}
