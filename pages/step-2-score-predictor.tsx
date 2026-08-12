import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import {
  FORMS, CAL, formOffset, correctedScore, calibratedCenter, bandHalfWidth,
  percentile, ordinal,
} from '../lib/readiness';
import { track, referrerHost, appStoreUrl } from '../lib/analytics';

const APP = appStoreUrl('predictor');
const CANONICAL = 'https://stepgunner.com/step-2-score-predictor';

// FAQ content doubles as the FAQPage structured data, so the answers below are
// the single source for both the visible section and the JSON-LD.
const FAQ: { q: string; a: string }[] = [
  {
    q: 'How accurate is this Step 2 score predictor?',
    a: 'Tested blind on 32 score reports it had never seen (the August 2026 release thread): average miss about 4 points, bias under 1 point, and roughly 9 out of 10 actual scores landed within 8 points of the projection. The fit comes from 258 real posted score reports. Reddit posters skew toward good news, so treat the range as honest but not generous.',
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
  const [form, setForm] = useState('NBME 15');
  const [score, setScore] = useState('');
  const [days, setDays] = useState('');

  const printed = parseInt(score, 10);
  const valid = !Number.isNaN(printed) && printed >= 130 && printed <= 300;
  const d = days === '' ? null : parseInt(days, 10);
  const off = formOffset(form);
  const counted = valid ? correctedScore(form, printed) : NaN;
  const center = valid ? calibratedCenter(counted) : NaN;
  const { band, tier } = bandHalfWidth(d);
  const lo = valid ? Math.max(CAL.floor, center - band) : NaN;
  const hi = valid ? Math.min(CAL.ceiling, center + band) : NaN;

  const onCompute = (v: string) => {
    setScore(v.replace(/[^0-9]/g, '').slice(0, 3));
    if (v.length === 3) track('predictor_quick_convert', { form, ref: referrerHost() });
  };

  return (
    <>
      <Head>
        <title>Step 2 Score Predictor | NBME + UWSA Score Conversion, Calibrated</title>
        <meta
          name="description"
          content="Free Step 2 CK score predictor and NBME score conversion for forms 9 to 16 and UWSA 1 to 3. Fit on 258 real score reports, tested blind: average miss ~4 points. Honest ranges, not promises."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content="Step 2 Score Predictor: NBME score conversion that shows its work" />
        <meta property="og:description" content="Fit on 258 real score reports. Tested blind on 32 more: average miss ~4 points. NBME 9-16 and UWSA conversions, free." />
        <meta property="og:url" content={CANONICAL} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0a0b0d" />
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
          <span className="badge">Free tool + methodology</span>
          <h1>Step 2 score predictor that shows its work</h1>
          <p className="sub">
            NBME score conversion for forms 9 to 16 and UWSA 1 to 3, fit on 258 real posted score
            reports and tested blind on 32 more. Average miss: about 4 points.
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
              <label className="field">
                <span>Days before exam <em>(opt.)</em></span>
                <input inputMode="numeric" placeholder="14" value={days} onChange={(e) => setDays(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))} />
              </label>
            </div>

            {valid ? (
              <div className="result">
                <div className="rk">Projected Step 2 CK</div>
                <div className="rv">{lo}<span className="d"> to </span>{hi}</div>
                <div className="chips">
                  <span className="chip pctl">proj. {ordinal(percentile(center))} %ile</span>
                  <span className="chip">{tier} range</span>
                  {Math.abs(off) >= 0.5 && (
                    <span className={'chip ' + (off > 0 ? 'up' : 'hot')}>
                      {form} {off > 0 ? 'prints low: counted as ' : 'prints hot: counted as '}{Math.round(counted)}
                    </span>
                  )}
                </div>
                <p className="fine">
                  One form is a rough read. The projection sharpens a lot with two or three forms and
                  their dates: use the <Link href="/readiness">full calculator</Link> for that.
                </p>
              </div>
            ) : (
              <div className="result empty">
                <div className="emptytitle">Your conversion appears here</div>
                <p className="emptysub">Pick a form and enter the printed score. No sign-up.</p>
              </div>
            )}
          </div>

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
            <h2>The honest limits</h2>
            <p>
              The data comes from public score-release threads, which skew toward people posting
              good news. That means the error bars here are a floor, not a ceiling, and the model
              recalibrates as real outcomes accumulate. No single practice form can honestly promise
              a score, which is why everything on this page is a range.
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

          <section className="upsell">
            <div className="ueyebrow">Want the number to move, not just be measured?</div>
            <h2>The app plans your next form.</h2>
            <p>
              Step Gunner tracks every NBME with dates, projects your score to exam day, and its
              NBME Planner shows exactly what your next form needs to say for each goal. Plus the
              question bank, spaced repetition, and weekly leagues. Free to start.
            </p>
            <a href={APP} className="btn-store" onClick={() => track('store_click', { source: 'predictor', location: 'upsell', ref: referrerHost() })}>Get Step Gunner on the App Store</a>
          </section>

          <footer className="foot">
            <Link href="/">stepgunner.com</Link>
            <Link href="/readiness">Full calculator</Link>
            <Link href="/guides">Clerkship guides</Link>
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
        .page { min-height: 100vh; background:
          radial-gradient(90% 55% at 50% -8%, rgba(70,216,119,0.08), transparent 60%),
          linear-gradient(var(--hair) 1px, transparent 1px) 0 0/26px 26px,
          linear-gradient(90deg, var(--hair) 1px, transparent 1px) 0 0/26px 26px, var(--bg); }
        .nav { display: flex; align-items: center; justify-content: space-between; max-width: 660px; margin: 0 auto; padding: 20px 22px; }
        .wm { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-weight: 700; letter-spacing: 2.5px; font-size: 14px; }
        .wm .wt b.g { color: var(--green); font-weight: 700; }
        .wm .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 9px var(--green); flex: 0 0 auto; }
        .nav-cta { background: var(--green); color: #05130a; padding: 9px 18px; border-radius: 10px; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 1px; box-shadow: 0 4px 18px rgba(70,216,119,0.24); }

        .wrap { max-width: 640px; margin: 0 auto; padding: 30px 22px 80px; }
        .badge { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--green); border: 1px solid rgba(70,216,119,0.3); background: rgba(70,216,119,0.06); padding: 6px 15px; border-radius: 999px; }
        h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1; margin: 20px 0 10px; }
        .sub { color: var(--ink-dim); font-size: 16px; margin: 0 0 26px; max-width: 44ch; }

        .tool { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 18px; padding: 20px; }
        .qrow { display: grid; grid-template-columns: 1.2fr 1fr 1.2fr; gap: 10px; }
        @media (max-width: 560px) { .qrow { grid-template-columns: 1fr 1fr; } }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field span { font-family: var(--mono); font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--ink-faint); }
        .field em { font-style: normal; opacity: 0.7; text-transform: none; letter-spacing: 0; }
        .field select, .field input { background: var(--bg-3); border: 1px solid var(--hair-strong); border-radius: 10px; color: var(--ink); font-family: var(--mono); font-size: 15px; padding: 11px 12px; width: 100%; }
        .field select:focus, .field input:focus { outline: none; border-color: rgba(70,216,119,0.5); }

        .result { margin-top: 18px; border-top: 1px solid var(--hair); padding-top: 18px; text-align: center; }
        .result.empty { color: var(--ink-faint); }
        .emptytitle { font-weight: 700; color: var(--ink-dim); }
        .emptysub { font-size: 13px; margin: 6px 0 0; }
        .rk { font-family: var(--mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); }
        .rv { font-family: var(--mono); font-size: 44px; font-weight: 800; color: var(--gold); margin: 6px 0 4px; }
        .rv .d { font-size: 20px; color: var(--ink-dim); font-weight: 500; }
        .chips { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 8px 0 4px; }
        .chip { font-family: var(--mono); font-size: 11px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--hair-strong); color: var(--ink-dim); }
        .chip.pctl { color: var(--green); border-color: rgba(70,216,119,0.35); }
        .chip.up { color: var(--green); border-color: rgba(70,216,119,0.35); }
        .chip.hot { color: var(--gold); border-color: rgba(227,181,66,0.4); }
        .fine { font-size: 12.5px; color: var(--ink-faint); margin: 10px auto 0; max-width: 46ch; line-height: 1.55; }
        .fine :global(a) { color: var(--green); }

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

        .upsell { margin-top: 46px; border: 1px solid rgba(70,216,119,0.28); background: linear-gradient(165deg, rgba(70,216,119,0.07), var(--bg-2)); border-radius: 18px; padding: 24px 22px; text-align: center; }
        .ueyebrow { font-family: var(--mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--green); }
        .upsell h2 { font-size: 22px; font-weight: 800; margin: 10px 0 8px; }
        .upsell p { color: var(--ink-dim); font-size: 14.5px; line-height: 1.6; max-width: 46ch; margin: 0 auto 16px; }
        .btn-store { display: inline-flex; align-items: center; gap: 9px; background: var(--green); color: #05130a; font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.6px; padding: 13px 22px; border-radius: 12px; box-shadow: 0 6px 22px rgba(70,216,119,0.26); }

        .foot { display: flex; gap: 18px; justify-content: center; margin-top: 44px; font-family: var(--mono); font-size: 11.5px; color: var(--ink-faint); flex-wrap: wrap; }
        .foot :global(a):hover { color: var(--ink-dim); }
      `}</style>
    </>
  );
}
