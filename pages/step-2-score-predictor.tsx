import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import {
  FORMS, CAL, formOffset, correctedScore, calibratedCenter, bandHalfWidth,
  percentile, ordinal, smartDays, TAKEN_OPTS, takenIsExact, takenSource, MODEL_VERSION, visitorIdentity,
} from '../lib/readiness';
import { track, referrerHost, appStoreUrl } from '../lib/analytics';
import benchmarks from '../lib/specialty_benchmarks.json';

const APP = appStoreUrl('predictor');
const CANONICAL = 'https://stepgunner.com/step-2-score-predictor';

type Spec = { abbr: string; matchedAvg: number; pMatchPct: Record<string, number | null>; nBySeniors: Record<string, number> };
const SPECIALTIES = benchmarks.specialties as unknown as Record<string, Spec>;
const SPEC_NAMES = Object.keys(SPECIALTIES);
const BANDS = ['200-209', '210-219', '220-229', '230-239', '240-249', '250+'];
const bandPhrase = (bk: string) =>
  bk === '<200' ? 'Below 200' : bk === '250+' ? 'At 250+' : `In the ${bk.slice(0, 3)}s`;

// FAQ content doubles as the FAQPage structured data, so the answers below are
// the single source for both the visible section and the JSON-LD.
const FAQ: { q: string; a: string }[] = [
  {
    q: 'How accurate is this Step 2 score predictor?',
    a: 'Tested blind on 32 score reports it had never seen (the August 2026 release thread): average miss 4.1 points, bias +0.97 (statistically zero), and roughly 9 out of 10 actual scores landed within 8 points of the projection. The fit comes from 258 real posted score reports. Reddit posters skew toward good news, so treat the range as honest but not generous.',
  },
  {
    q: 'Is NBME 16 accurate, and does it convert high?',
    a: 'NBME 16 prints a few points higher than the older forms for the same student. But people who print high on 16 really do score high on the exam, so this predictor counts your 16 at face value. It is one of the strongest single forms you can take.',
  },
  {
    q: 'Do UWSA scores inflate?',
    a: 'UWSA 2 prints about 5 points hot relative to the NBME scale, so this converter translates it down before blending. UWSA 1 sits roughly on scale. UWSA 3 runs a few points low on thinner data. Your printed number is never changed on screen, only inside the math.',
  },
  {
    q: 'Is old NBME 9 still worth anything?',
    a: 'Form 9 genuinely prints about 5 to 6 points low, so it gets credited back in the conversion. It is old and it fades fast under the recency weighting, but it is not garbage.',
  },
  {
    q: 'Which NBME form predicts Step 2 best?',
    a: 'Mostly whichever one you took last. Once you control for when forms are taken, forms 10 through 16 are statistically indistinguishable as predictors. Recency is what matters: a form from this week says far more about you than a form from six weeks ago.',
  },
  {
    q: 'What score do I need on my next NBME?',
    a: 'That depends on your goal, your other forms, and your timing. The Step Gunner app includes an NBME Planner that answers it exactly: pick the form you have not taken, and it shows the required score for each goal on your timeline.',
  },
];

export default function Predictor() {
  const router = useRouter();
  const [form, setForm] = useState('NBME 15');
  const [score, setScore] = useState('');
  const [days, setDays] = useState('');
  const [takenExact, setTakenExact] = useState(false);
  const [specialty, setSpecialty] = useState('');

  const printed = parseInt(score, 10);
  const valid = !Number.isNaN(printed) && printed >= 130 && printed <= 300;
  const d = smartDays(days);
  const off = formOffset(form);
  const counted = valid ? correctedScore(form, printed) : NaN;
  const center = valid ? calibratedCenter(counted) : NaN;
  const { band } = bandHalfWidth(d);
  const lo = valid ? Math.max(CAL.floor, center - band) : NaN;
  const hi = valid ? Math.min(CAL.ceiling, center + band) : NaN;

  const mid = valid ? Math.round(center) : NaN;
  const bk = valid ? (mid < 200 ? '<200' : mid >= 250 ? '250+' : BANDS[Math.floor((mid - 200) / 10)]) : '';
  const sp = specialty ? SPECIALTIES[specialty] : null;
  const pct = sp && bk ? sp.pMatchPct[bk] ?? null : null;
  const diff = sp && valid ? mid - sp.matchedAvg : 0;

  const onCompute = (v: string) => {
    setScore(v.replace(/[^0-9]/g, '').slice(0, 3));
    if (v.length === 3) track('predictor_quick_convert', { form, ref: referrerHost() });
  };

  useEffect(() => {
    try {
      const s = localStorage.getItem('gunner_specialty');
      if (s && SPECIALTIES[s]) setSpecialty(s);
    } catch { /* ignore */ }
  }, []);
  const pickSpecialty = (v: string) => {
    setSpecialty(v);
    try { localStorage.setItem('gunner_specialty', v); } catch { /* ignore */ }
    if (v) track('predictor_specialty', { specialty: v, ref: referrerHost() });
  };

  // The 2-of-3 ghost slots hand off to the full calculator; seed it with the
  // current form so the started journey carries over (never clobber a returning
  // visitor's saved rows).
  const goFull = (where: string) => {
    try {
      const s = localStorage.getItem('gunner_readiness');
      const cur = s ? JSON.parse(s) : null;
      const hasScores = Array.isArray(cur) && cur.some((e) => e && e.score);
      if (!hasScores && valid) {
        localStorage.setItem('gunner_readiness', JSON.stringify([
          { form, score: String(printed), days, exact: days !== '' && takenIsExact(days, takenExact) },
          { form: '', score: '', days: '' },
        ]));
      }
    } catch { /* ignore */ }
    track('predictor_to_full', { where, ref: referrerHost() });
    router.push('/readiness');
  };

  // Anonymous capture of settled conversions (same sink + shape as the full
  // calculator, source-tagged): fires 2.5s after the inputs stop changing.
  const lastSent = useRef('');
  useEffect(() => {
    if (!valid) return;
    const ident = visitorIdentity();
    const payload = JSON.stringify({
      entries: [{ form, score: printed, days: d, dateSource: takenSource(days, takenExact), raw: days.slice(0, 12) }],
      projected: { low: lo, high: hi }, actual: null, source: 'predictor',
      specialty: specialty || null,
      modelVersion: MODEL_VERSION,
      visitor: ident ? { id: ident.vid, session: ident.sid, firstSeen: ident.firstSeen } : null,
    });
    if (payload === lastSent.current) return;
    const t = setTimeout(() => {
      lastSent.current = payload;
      fetch('/api/readiness', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => { /* ignore */ });
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, score, days, specialty]);

  return (
    <>
      <Head>
        <title>Step 2 Score Predictor | NBME + UWSA Score Conversion, Calibrated</title>
        <meta name="description" content="Free Step 2 CK score predictor and NBME score conversion for forms 9 to 16 and UWSA 1 to 3. Fit on 258 real score reports, average miss 4.1 points." />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content="Step 2 Score Predictor: NBME score conversion that shows its work" />
        <meta property="og:description" content="Fit on 258 real score reports. Tested blind on 32 more: average miss 4.1 points. NBME 9-16 and UWSA conversions, free." />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content="https://stepgunner.com/api/og" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://stepgunner.com/api/og" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQ.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      </Head>

      <div className="page">
        <nav className="nav">
          <a href="/" className="wm"><span className="dot" /><span className="wt">STEP <b className="g">GUNNER</b></span></a>
          <a href={APP} className="nav-cta" onClick={() => track('store_click', { source: 'predictor', location: 'nav', ref: referrerHost() })}>Download</a>
        </nav>

        <main className="wrap">
          <span className="badge">Free &middot; No sign-up &middot; Shows its work</span>
          <h1>Step 2 score predictor that shows its work</h1>
          <p className="sub">
            Any NBME 9 to 16 or UWSA score becomes a projected Step 2 CK range, fit on 258 real
            posted score reports and tested blind on 32 more: average miss 4.1 points. The range
            appears as you type.
          </p>

          <div className="tool">
            <div className="qrow">
              <label className="field">
                <span>Form</span>
                <select value={form} onChange={(e) => { setForm(e.target.value); }}>
                  {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Printed score</span>
                <input inputMode="numeric" placeholder="245" value={score} onChange={(e) => onCompute(e.target.value)} />
              </label>
              <label className="field when">
                <span>Taken</span>
                {takenIsExact(days, takenExact) ? (
                  <>
                    <input autoFocus placeholder="Jul 2, or 21" value={days}
                      onChange={(e) => setDays(e.target.value.replace(/[^0-9A-Za-z /,-]/g, '').slice(0, 12))}
                      onBlur={(e) => { if (!e.target.value.trim()) { setTakenExact(false); setDays(''); } }} />
                    {d != null ? <i className="dhint">&asymp;{d}d ago</i> : null}
                  </>
                ) : (
                  <select value={days} style={{ color: days === '' ? '#9aa0ab' : undefined }}
                    onChange={(e) => { const v = e.target.value; if (v === 'x') { setTakenExact(true); setDays(''); } else setDays(v); }}>
                    {TAKEN_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                )}
              </label>
            </div>
            <div className="fhint">dated forms <b>weigh more</b></div>

            {valid ? (
              <div className="result">
                <div className="rk">Projected Step 2 CK</div>
                <div className="rv">{lo}<span className="d"> to </span>{hi}</div>
                <div className="chips">
                  <span className="chip pctl">midpoint {mid} &middot; {ordinal(percentile(center))} %ile of first-takers</span>
                  {Math.abs(off) >= 0.5 && (
                    <span className={'chip ' + (off > 0 ? 'up' : 'hot')}>
                      {form} {off > 0 ? 'prints low: counted as ' : 'prints hot: counted as '}{Math.round(counted)}
                    </span>
                  )}
                </div>
                <details className="how">
                  <summary>how we got {mid}</summary>
                  <p>
                    {Math.abs(off) >= 0.5
                      ? `${form} ${printed} counts as ${Math.round(counted)} (prints ${off > 0 ? 'low' : 'hot'} by ${Math.abs(off)}). `
                      : `${form} ${printed} enters at face value. `}
                    Calibrated map: 250 + 0.79 x ({Math.round(counted)} - 250) + 9 = {mid}. The
                    &plusmn;{band} band {d != null ? 'is tightened by your form date' : 'is wide because the form is undated'}.
                    Full math on the <Link href="/readiness/methodology">methodology page</Link>.
                  </p>
                </details>
                <div className="statline">
                  <div className="sl"><span className="n">80%</span><span className="l">beat their last form</span></div>
                  <div className="sl"><span className="n">+9</span><span className="l">median beat</span></div>
                  <div className="sl"><span className="n">4.1</span><span className="l">avg miss, tested blind</span></div>
                </div>
              </div>
            ) : (
              <div className="result empty">
                <div className="emptytitle">Your conversion appears here</div>
                <p className="emptysub">Pick a form and enter the printed score. No sign-up, it answers as you type.</p>
              </div>
            )}

            <div className="prog">
              <span className="pl">FORMS</span>
              <div className="slots">
                <span className={'slot' + (valid ? ' done' : '')}>{valid ? form : 'this one'}</span>
                <button type="button" className="slot ghost" onClick={() => goFull('slot')}>+ add</button>
                <button type="button" className="slot ghost" onClick={() => goFull('slot')}>+ add</button>
              </div>
              <span className="pr">each dated form <b>tightens this range</b></span>
            </div>
          </div>

          {valid && (
            <section className="spec">
              <div className="sechead"><span className="no">01</span><h2>What does a {mid} actually buy?</h2></div>
              <p className="lede">Depends where you point it. Pick your target:</p>
              <div className="speccard">
                <select className="specsel" value={specialty} style={{ color: specialty === '' ? '#9aa0ab' : undefined }} onChange={(e) => pickSpecialty(e.target.value)}>
                  <option value="">choose your target specialty&hellip;</option>
                  {SPEC_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                {sp && (pct != null ? (
                  <div className="verdict">
                    <div className="vbig">{bandPhrase(bk)}, <em>{pct}%</em> of {specialty.toLowerCase()} applicants matched.</div>
                    <div className="vsub">
                      Matched average {sp.matchedAvg}. {diff > 0 ? `Your midpoint sits ${diff} above it.` : diff < 0 ? `Your midpoint sits ${-diff} below it.` : 'Your midpoint sits right at it.'}
                    </div>
                  </div>
                ) : (
                  <div className="verdict">
                    <div className="vsub">NRMP charts too few US MD seniors at this band in {specialty.toLowerCase()} to quote a match rate. The bars show the shape across bands.</div>
                  </div>
                ))}
                {sp && (
                  <div className="bands">
                    {BANDS.map((b) => {
                      const p = sp.pMatchPct[b] ?? null;
                      return (
                        <div key={b} className={'bnd' + (b === bk ? ' you' : '')}>
                          <span className="pv">{p == null ? 'n/a' : b === bk ? `${p}%` : p}</span>
                          <span className="bar" style={{ height: `${p == null ? 3 : 4 + p * 0.42}px` }} />
                          <span className="bl">{b === '250+' ? '250+' : `${b.slice(0, 3)}s`}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="src">NRMP Charting Outcomes in the Match, US MD seniors, 2020 to 2024. All 22 specialties.</p>
              </div>
            </section>
          )}

          <section className="pitch">
            <div className="pk">The part you control</div>
            <h2>Your form is the floor. The next three weeks decide the beat.</h2>
            <div className="pstat">
              <div className="ps"><span className="pn">+9</span><span className="plb">median beat</span></div>
              <div className="ps"><span className="pn">+10 to 11</span><span className="plb">with 3+ weeks of grind</span></div>
            </div>
            <p>
              The gap between a practice form and the real thing is not luck. It is the reps you put
              in after. Step Gunner runs those weeks: <b>7,000+ Step 2 CK questions</b>, a projection
              that moves with your accuracy, and a planner that says exactly what your next form needs.
            </p>
            <a href={APP} className="pcta" onClick={() => track('store_click', { source: 'predictor', location: 'pitch', ref: referrerHost() })}>Get Step Gunner free</a>
            <div className="ptrust">Free to start. This predictor stays free either way.</div>
            <div className="ptrust dim">146 tracked reports. The biggest beats belong to students who kept working.</div>
          </section>

          <section className="rec">
            <div className="sechead"><span className="no">02</span><h2>The receipts</h2></div>
            <div className="proofs">
              <div className="proof">
                <div className="stat">258<small>reports, in the open</small></div>
                <div className="txt"><b>The formula is printed on this page.</b><span>Fit on 258 real posted score reports, methodology public, nothing to take on faith.</span></div>
              </div>
              <div className="proof">
                <div className="stat">4.1<small>avg miss, blind</small></div>
                <div className="txt"><b>Frozen, then tested on 32 unseen reports.</b><span>Bias +0.97, statistically zero. Nine in ten actual scores landed within 8 points.</span></div>
              </div>
              <div className="proof">
                <div className="stat">3<small>forms decoded</small></div>
                <div className="txt"><b>It knows which forms lie.</b><span>NBME 9 prints 5.5 low, UWSA 2 prints 4.8 hot, UWSA 3 prints 6.3 low. A flat lookup chart hands you the wrong number.</span></div>
              </div>
              <div className="proof">
                <div className="stat">+11<small>at 3+ weeks out</small></div>
                <div className="txt"><b>It knows your runway.</b><span>A form taken three weeks out means a bigger beat than one taken the night before, so the date changes the math.</span></div>
              </div>
              <div className="proof gold">
                <div className="stat">100%<small>of misses public</small></div>
                <div className="txt"><b>It grades itself in public.</b><span>Every new real score gets checked against our projection, and the misses stay on the page.</span></div>
              </div>
            </div>
            <div className="limits">
              <b>Read the error bars honestly.</b>
              <p>Score-release threads skew toward good news, so our published misses are a floor, not a ceiling. No practice form can promise a score. That is why everything on this page is a range.</p>
            </div>
          </section>

          <section className="article">
            <h2>How the conversion works</h2>
            <p>
              Most NBME conversion charts are a single lookup table with no dates and no source. This
              one runs the same calibrated engine as the Step Gunner app, in three steps:
            </p>
            <p>
              <b>1. Scale translation.</b> Three forms print off the common scale and get translated
              before anything else: old NBME 9 prints about 5.5 low (credited back), UWSA 2 prints
              about 4.8 hot, UWSA 3 about 6.3 low. Forms 10 through 16 are equated by NBME itself
              and enter at face value. Your printed number is never shown reduced.
            </p>
            <p>
              <b>2. Recency weighting.</b> With multiple forms, each one is weighted by
              exp(minus age over 30 days). A form from this week dominates; a form from two months
              ago barely whispers. This is also the honest answer to which form predicts best:
              the one you took last.
            </p>
            <p>
              <b>3. The calibrated map.</b> The blended level is mapped through
              250 + 0.79 x (level minus 250) + 9, fit on real reported outcomes. The +9 is the
              measured practice-to-real gain, which is why your projection usually sits above your
              latest form. The result is shown as a range, because a point estimate would be
              pretending.
            </p>
            <h2>The blind test</h2>
            <p>
              In August 2026 we froze the model and scored 32 new score reports it had never seen,
              from the newest score release thread. Result: average miss 4.1 points, bias +0.97
              (statistically zero), 88 percent of actual scores inside plus or minus 7 and 94 percent
              inside plus or minus 8. Also: 26 of the 32 scored at or above their freshest NBME,
              which is the pattern the +9 gain encodes. Full write-up and reproduction scripts on
              the <Link href="/readiness/methodology">methodology page</Link>.
            </p>
          </section>

          <section className="faq">
            <h2>Questions students actually ask</h2>
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>

          <div className="bridge">
            <span className="bline">The predictor is a snapshot. <b>The app is the film.</b></span>
            <a href={APP} className="bcta" onClick={() => track('store_click', { source: 'predictor', location: 'bridge', ref: referrerHost() })}>Get the app</a>
          </div>

          <footer className="foot">
            <Link href="/">stepgunner.com</Link>
            <Link href="/readiness">Full calculator</Link>
            <Link href="/guides">Clerkship guides</Link>
            <span>Rezumab LLC</span>
          </footer>
        </main>

        {valid && (
          <a href={APP} className="msticky" onClick={() => track('store_click', { source: 'predictor', location: 'sticky', ref: referrerHost() })}>Get Step Gunner free</a>
        )}
      </div>

      <style jsx global>{`
        :root {
          --bg: #faf9f6; --bg-2: #ffffff; --bg-3: #ffffff;
          --hair: rgba(25,28,35,0.10); --hair-strong: rgba(25,28,35,0.17);
          --ink: #191c23; --ink-dim: #5d6470; --ink-faint: #9aa0ab;
          --green: #0d9448; --gold: #e08e00; --blue: #2f6fed; --red: #d64545;
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
          radial-gradient(90% 55% at 50% -8%, rgba(13,148,72,0.08), transparent 60%),
          radial-gradient(56% 22% at 50% 0%, rgba(240,180,41,0.13), transparent 62%), var(--bg); }
        .nav { display: flex; align-items: center; justify-content: space-between; max-width: 660px; margin: 0 auto; padding: 20px 22px; }
        .wm { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-weight: 700; letter-spacing: 2.5px; font-size: 14px; }
        .wm .wt b.g { color: var(--green); font-weight: 700; }
        .wm .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 9px var(--green); flex: 0 0 auto; }
        .nav-cta { background: var(--ink); color: #ffffff; padding: 9px 18px; border-radius: 999px; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 1px; box-shadow: 0 3px 12px rgba(25,28,35,0.18); }

        .wrap { max-width: 640px; margin: 0 auto; padding: 30px 22px 80px; }
        .badge { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #b57400; border: 1px solid rgba(224,142,0,0.35); background: rgba(240,180,41,0.10); padding: 6px 15px; border-radius: 999px; }
        h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1; margin: 20px 0 10px; }
        .sub { color: var(--ink-dim); font-size: 16px; margin: 0 0 26px; max-width: 46ch; }

        .tool { background: var(--bg-2); border: 1px solid var(--hair); border-radius: 18px; padding: 20px 20px 0; box-shadow: 0 2px 18px rgba(25,28,35,0.06); overflow: hidden; }
        .qrow { display: grid; grid-template-columns: 1.2fr 1fr 1.2fr; gap: 10px; }
        .field { position: relative; }
        .dhint { position: absolute; right: 8px; bottom: 13px; font-family: var(--mono, ui-monospace); font-style: normal; font-size: 10px; font-weight: 700; color: #0d9448; pointer-events: none; }
        .fhint { text-align: right; font-family: var(--mono); font-size: 10px; color: var(--ink-faint); margin-top: 7px; }
        .fhint b { color: var(--green); }
        @media (max-width: 560px) {
          .qrow { grid-template-columns: 1.1fr 0.75fr 1fr; gap: 6px; }
          .field input, .field select { padding: 9px 8px; height: 42px; }
          .field span { font-size: 8.5px; margin-bottom: 5px; }
        }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field span { font-family: var(--mono); font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--ink-faint); }
        .field em { font-style: normal; opacity: 0.7; text-transform: none; letter-spacing: 0; }
        .field select, .field input { background: var(--bg-3); border: 1px solid var(--hair-strong); border-radius: 10px; color: var(--ink); font-family: var(--mono); font-size: 15px; padding: 11px 12px; width: 100%; }
        .field select:focus, .field input:focus { outline: none; border-color: rgba(13,148,72,0.5); }

        .result { margin-top: 14px; border-top: 1px dashed rgba(13,148,72,0.4); background: linear-gradient(180deg, rgba(13,148,72,0.045), transparent); margin-left: -20px; margin-right: -20px; padding: 16px 20px; text-align: center; }
        .result.empty { color: var(--ink-faint); border-top: 1px solid var(--hair); background: none; }
        .emptytitle { font-weight: 700; color: var(--ink-dim); }
        .emptysub { font-size: 13px; margin: 6px 0 0; }
        .rk { font-family: var(--mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); }
        .rv { font-family: var(--mono); font-size: 44px; font-weight: 800; color: var(--gold); margin: 6px 0 4px; }
        .rv .d { font-size: 20px; color: var(--ink-dim); font-weight: 500; }
        .chips { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 8px 0 4px; }
        .chip { font-family: var(--mono); font-size: 11px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--hair-strong); color: var(--ink-dim); }
        .chip.pctl { color: var(--green); border-color: rgba(13,148,72,0.35); }
        .chip.up { color: var(--green); border-color: rgba(13,148,72,0.35); }
        .chip.hot { color: var(--gold); border-color: rgba(227,181,66,0.4); }
        .how { margin: 8px auto 0; max-width: 52ch; }
        .how summary { cursor: pointer; list-style: none; display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; color: var(--ink-faint); text-decoration: underline; text-underline-offset: 3px; }
        .how summary::-webkit-details-marker { display: none; }
        .how p { font-size: 12.5px; color: var(--ink-dim); line-height: 1.6; margin: 8px 0 0; text-align: left; font-family: var(--mono); }
        .how :global(a) { color: var(--green); }
        .statline { display: flex; margin-top: 14px; border-top: 1px dashed var(--hair); padding-top: 12px; }
        .sl { flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .sl + .sl { border-left: 1px solid var(--hair); }
        .sl .n { font-family: var(--mono); font-size: 17px; font-weight: 800; color: var(--green); letter-spacing: -0.5px; }
        .sl .l { font-family: var(--mono); font-size: 8.5px; letter-spacing: 1.1px; text-transform: uppercase; color: var(--ink-faint); }

        .prog { display: flex; align-items: center; gap: 10px; padding: 12px 20px 14px; margin-left: -20px; margin-right: -20px; background: #fdfcf9; border-top: 1px solid var(--hair); }
        .prog .pl { font-family: var(--mono); font-size: 9px; font-weight: 700; letter-spacing: 1.6px; color: var(--ink-faint); }
        .slots { display: flex; gap: 6px; flex: 1; }
        .slot { flex: 1; height: 34px; border-radius: 9px; border: 1px solid var(--hair-strong); display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-size: 10px; font-weight: 700; color: var(--ink-faint); background: var(--bg-2); }
        .slot.done { background: rgba(13,148,72,0.08); border-color: rgba(13,148,72,0.4); color: var(--green); }
        .slot.ghost { border-style: dashed; cursor: pointer; }
        .slot.ghost:hover { border-color: rgba(13,148,72,0.5); color: var(--green); }
        .prog .pr { font-family: var(--mono); font-size: 9.5px; color: var(--ink-dim); text-align: right; max-width: 120px; line-height: 1.45; }
        .prog .pr b { color: var(--green); }
        @media (max-width: 560px) { .prog .pr { display: none; } }

        .sechead { display: flex; gap: 12px; align-items: baseline; border-top: 1px solid var(--hair); padding-top: 14px; margin-top: 40px; }
        .sechead .no { font-family: var(--mono); font-size: 11px; font-weight: 800; color: var(--gold); }
        .sechead h2 { font-size: 21px; font-weight: 800; margin: 0; letter-spacing: -0.3px; }
        .lede { color: var(--ink-dim); font-size: 15px; margin: 10px 0 0; }

        .speccard { background: var(--bg-2); border: 1px solid var(--hair); border-radius: 16px; padding: 16px; margin-top: 14px; box-shadow: 0 2px 14px rgba(25,28,35,0.05); }
        .specsel { width: 100%; background: var(--bg-3); border: 1px solid var(--hair-strong); border-radius: 11px; color: var(--ink); font-family: var(--mono); font-size: 14px; font-weight: 700; padding: 11px 12px; height: 46px; }
        .specsel:focus { outline: none; border-color: rgba(13,148,72,0.5); }
        .verdict { margin-top: 12px; background: #ecfbf2; border: 1px solid rgba(13,148,72,0.25); border-radius: 13px; padding: 12px 15px; }
        .vbig { font-size: 16px; font-weight: 800; }
        .vbig em { font-style: normal; color: var(--green); font-family: var(--mono); }
        .vsub { font-size: 13px; color: var(--ink-dim); margin-top: 3px; }
        .bands { display: flex; gap: 5px; margin-top: 13px; align-items: flex-end; height: 66px; }
        .bnd { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; text-align: center; }
        .bnd .pv { font-family: var(--mono); font-size: 9.5px; font-weight: 700; color: var(--ink-dim); margin-bottom: 3px; }
        .bnd.you .pv { color: #b57400; }
        .bnd .bar { display: block; background: #e8e6df; border-radius: 5px 5px 0 0; }
        .bnd.you .bar { background: linear-gradient(180deg, #f0b429, #d97706); }
        .bnd .bl { font-family: var(--mono); font-size: 8px; color: var(--ink-faint); margin-top: 4px; }
        .bnd.you .bl { color: var(--ink); font-weight: 800; }
        .src { font-size: 11.5px; color: var(--ink-faint); margin: 10px 0 0; }

        .pitch { margin-top: 40px; background: var(--ink); border-radius: 18px; padding: 24px 22px 22px; color: #ffffff; position: relative; overflow: hidden; }
        .pitch:before { content: ""; position: absolute; inset: 0; background: radial-gradient(60% 90% at 85% 0%, rgba(240,180,41,0.22), transparent 60%); }
        .pitch > * { position: relative; }
        .pk { font-family: var(--mono); font-size: 10px; font-weight: 700; letter-spacing: 2.4px; text-transform: uppercase; color: #f0b429; }
        .pitch h2 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; margin: 8px 0 0; max-width: 26ch; }
        .pstat { display: flex; margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.14); padding-top: 12px; max-width: 400px; }
        .ps { flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .ps + .ps { border-left: 1px solid rgba(255,255,255,0.14); padding-left: 16px; }
        .pn { font-family: var(--mono); font-size: 20px; font-weight: 800; color: #f0b429; letter-spacing: -0.5px; }
        .plb { font-family: var(--mono); font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase; color: #8b94a3; }
        .pitch p { color: #b7bdc9; font-size: 14px; line-height: 1.6; margin: 12px 0 0; max-width: 54ch; }
        .pitch p b { color: #ffffff; }
        .pcta { display: inline-block; background: #ffffff; color: var(--ink); border-radius: 999px; font-size: 14px; font-weight: 800; padding: 12px 22px; margin-top: 14px; box-shadow: 0 6px 22px rgba(0,0,0,0.3); }
        .ptrust { font-size: 11.5px; color: #8b94a3; margin-top: 10px; }
        .ptrust.dim { margin-top: 4px; }

        .rec { margin-top: 4px; }
        .proofs { margin-top: 16px; display: grid; gap: 10px; }
        .proof { background: var(--bg-2); border: 1px solid var(--hair); border-radius: 14px; padding: 13px 16px; display: grid; grid-template-columns: 86px 1fr; gap: 14px; align-items: baseline; box-shadow: 0 1px 8px rgba(25,28,35,0.04); }
        .proof .stat { font-family: var(--mono); font-size: 21px; font-weight: 800; letter-spacing: -1px; color: var(--green); line-height: 1.05; }
        .proof .stat small { display: block; font-size: 8.5px; font-weight: 600; letter-spacing: 1.1px; color: var(--ink-faint); margin-top: 4px; text-transform: uppercase; }
        .proof .txt b { display: block; font-size: 14.5px; font-weight: 750; }
        .proof .txt span { display: block; font-size: 13px; line-height: 1.5; color: var(--ink-dim); margin-top: 3px; }
        .proof.gold .stat { color: #b57400; }

        .limits { margin-top: 16px; border: 1px dashed rgba(25,28,35,0.22); border-radius: 14px; padding: 14px 16px; background: #fdfcfa; }
        .limits b { font-size: 13.5px; font-weight: 750; }
        .limits p { font-size: 13px; line-height: 1.55; color: var(--ink-dim); margin: 4px 0 0; }

        .article { margin-top: 42px; }
        .article h2 { font-size: 21px; font-weight: 800; margin: 30px 0 10px; }
        .article p { color: var(--ink-dim); font-size: 15px; line-height: 1.65; margin: 0 0 14px; }
        .article b { color: var(--ink); }
        .article :global(a) { color: var(--green); }

        .faq { margin-top: 42px; }
        .faq h2 { font-size: 21px; font-weight: 800; margin: 0 0 12px; }
        .faq details { border: 1px solid var(--hair); border-radius: 12px; background: var(--bg-2); margin-bottom: 8px; padding: 0 16px; }
        .faq summary { cursor: pointer; font-weight: 700; font-size: 14.5px; padding: 13px 0; list-style: none; }
        .faq summary::-webkit-details-marker { display: none; }
        .faq details p { color: var(--ink-dim); font-size: 14px; line-height: 1.6; margin: 0 0 14px; }

        .bridge { margin-top: 44px; border-top: 1px solid var(--hair); padding-top: 16px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .bline { font-size: 14px; font-weight: 650; }
        .bline b { color: var(--green); }
        .bcta { margin-left: auto; background: var(--ink); color: #ffffff; border-radius: 999px; font-size: 12px; font-weight: 800; padding: 9px 16px; }

        .foot { display: flex; gap: 18px; justify-content: center; margin-top: 26px; font-family: var(--mono); font-size: 11.5px; color: var(--ink-faint); flex-wrap: wrap; }
        .foot :global(a):hover { color: var(--ink-dim); }

        .msticky { display: none; }
        @media (max-width: 560px) {
          .wrap { padding-bottom: 120px; }
          .msticky { position: fixed; left: 16px; right: 16px; bottom: calc(14px + env(safe-area-inset-bottom)); display: flex; justify-content: center; background: var(--ink); color: #ffffff; padding: 15px; border-radius: 999px; font-size: 14px; font-weight: 800; box-shadow: 0 10px 30px rgba(25,28,35,0.35); z-index: 50; }
        }
      `}</style>
    </>
  );
}
