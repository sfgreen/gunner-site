import Link from 'next/link';
import { useState } from 'react';
import LabLayout from '../components/LabLayout';
import { NORM, PASS, MEAN, percentile, ordinal } from '../lib/readiness';
import { appStoreUrl, track } from '../lib/analytics';

// The percentile query is high volume and badly served: most pages that rank
// for it either reprint a stale table or quote 214 as the passing score, which
// has been 218 since 2022. The norm table below is the published USMLE one,
// already the source of truth for /readiness and the app, so this page cannot
// drift from the tool.
//
// The thesis is the part nobody writes: the distribution is densest around the
// mean, so the same ten points are worth very different amounts of percentile
// depending on where you start. That is computed from the table, not asserted.

const ROWS = NORM.filter(([s]) => s >= 210 && s <= 275);

/** Percentile points gained per 10-score-point step, straight off the table. */
const STEPS = [210, 220, 230, 240, 250, 260, 270].slice(0, -1).map((lo, i) => {
  const hi = [220, 230, 240, 250, 260, 270][i];
  return { lo, hi, gain: percentile(hi) - percentile(lo) };
});
const STEEPEST = STEPS.reduce((a, b) => (b.gain > a.gain ? b : a));

export default function Percentiles() {
  const [score, setScore] = useState('');
  const n = parseInt(score, 10);
  const valid = !Number.isNaN(n) && n >= 180 && n <= 300;
  const p = valid ? percentile(n) : null;

  return (
    <LabLayout
      metaTitle="Step 2 CK Percentiles: What Your Score Actually Means"
      metaDesc="The published Step 2 CK percentile table for US MD first-takers, an instant lookup, and why the same ten points are worth more in the middle."
      campaign="percentiles"
      eyebrow="Score interpretation"
      title="Step 2 CK percentiles, and what your score actually means"
      lede="The real norm table, an instant lookup, and the thing about the distribution that changes how you should read your own number."
      maxWidth={780}
      head={(
        <>
          <link rel="canonical" href="https://stepgunner.com/step-2-ck-percentiles" />
          <meta property="og:title" content="Step 2 CK percentiles, and what your score actually means" />
          <meta property="og:description" content="The published Step 2 CK percentile table for US MD first-takers, plus why the same ten points are worth more in the middle of the distribution." />
          <meta property="og:url" content="https://stepgunner.com/step-2-ck-percentiles" />
          <meta property="og:image" content="https://stepgunner.com/api/og" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="https://stepgunner.com/api/og" />
        </>
      )}
    >
      <section className="block tool">
        <label className="field">
          <span>Your Step 2 CK score</span>
          <input
            inputMode="numeric"
            placeholder="245"
            value={score}
            onChange={(e) => setScore(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
          />
        </label>
        {valid && (
          <p className={'callout ' + (n >= PASS ? 'good' : 'warn')}>
            <b>{n}</b> is the <b>{ordinal(p!)} percentile</b> of US MD first-takers. That means
            about {p}% of them scored at or below you, and about {100 - p!}% scored higher.
            {n >= PASS
              ? n >= MEAN
                ? ' It is above the national mean of 250.'
                : ` It clears the ${PASS} pass line and sits below the 250 mean.`
              : ` It is below the ${PASS} passing score.`}
          </p>
        )}
      </section>

      <section className="block">
        <h2>The passing score is 218, not 214</h2>
        <p>
          A surprising number of pages ranking for this question still quote 214. That was the
          old standard. The current minimum passing score for Step 2 CK is <b>{PASS}</b>. If a
          page tells you 214, whatever else it says was written a while ago and not checked
          since.
        </p>
        <p>
          The other number worth fixing in your head: the mean is <b>{MEAN}</b>, with a standard
          deviation of about 15. So a 250 is not a good score in the sense people mean when they
          say it, it is the exact middle. That surprises people who have spent months on forums
          where every posted score starts with a 25.
        </p>
      </section>

      <section className="block">
        <h2>The same ten points are worth more in the middle</h2>
        <p>
          Scores are densest around the mean, so a ten point gain moves your percentile by very
          different amounts depending on where you start. Straight from the table:
        </p>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Moving from</th>
                <th className="r">Percentile gained</th>
                <th>How it reads</th>
              </tr>
            </thead>
            <tbody>
              {STEPS.map((s) => (
                <tr key={s.lo} className={s === STEEPEST ? 'peak' : ''}>
                  <td className="n">{s.lo} to {s.hi}</td>
                  <td className="r n"><b>+{s.gain}</b></td>
                  <td className="how">
                    {s.gain >= 25 ? 'the steepest stretch on the curve'
                      : s.gain >= 20 ? 'dense: points move you a lot'
                        : s.gain >= 14 ? 'moderate'
                          : 'thin air: points move you less'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The steepest stretch is <b>{STEEPEST.lo} to {STEEPEST.hi}</b>, worth{' '}
          <b>{STEEPEST.gain} percentile points</b>. Above 265 the curve flattens hard: the work
          required to add points keeps rising while the percentile they buy keeps shrinking. That
          is the quantitative version of advice you have heard as a vibe.
        </p>
        <p>
          It cuts the other way too. If you are sitting at 230 and aiming for a specialty that
          matches nearly everyone in the 230s, extra points are buying percentile you do not
          need.{' '}
          <Link href="/step-2-score-by-specialty">Whether points are worth anything depends on your specialty</Link>,
          and the difference between specialties is enormous.
        </p>
      </section>

      <section className="block">
        <h2>The full table</h2>
        <p className="sub">
          Published USMLE percentiles for LCME first-takers. Values between listed scores are
          linearly interpolated, which is what the lookup above does.
        </p>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Score</th>
                <th className="r">Percentile</th>
                <th>Where that sits</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([s, pc]) => (
                <tr key={s} className={valid && Math.abs(n - s) < 3 ? 'mine' : ''}>
                  <td className="n"><b>{s}</b></td>
                  <td className="r n">{pc}</td>
                  <td className="how">
                    {s < PASS ? <span className="fail">below the {PASS} pass line</span>
                      : s === MEAN ? 'the national mean'
                        : s < MEAN ? 'below the mean'
                          : s >= 270 ? 'top few percent'
                            : 'above the mean'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine">
          Source: USMLE Score Interpretation Guidelines, Table 2, LCME first-takers July 2022 to
          June 2025, N = 67,934. First-takers only, so repeaters and international graduates are
          not in this distribution.
        </p>
      </section>

      <section className="block">
        <h2>Three ways this number gets misread</h2>
        <ol className="limits">
          <li>
            <b>Percentile is not your match probability.</b> It is your rank among first-takers
            and nothing more. Two people at the same percentile applying to different specialties
            have completely different odds.
          </li>
          <li>
            <b>Forums are not the distribution.</b> People post good news. A subreddit where
            everything starts with a 25 is showing you roughly the top third with extra steps.
          </li>
          <li>
            <b>A practice form percentile is not this percentile.</b> Practice forms are scored on
            their own scales against their own reference groups.{' '}
            <Link href="/step-2-score-predictor">Convert the form first</Link>, then read the
            percentile off the projection.
          </li>
        </ol>
      </section>

      <section className="block">
        <h2>Related</h2>
        <ul className="rel">
          <li><Link href="/step-2-score-by-specialty">What score you need for your specialty</Link></li>
          <li><Link href="/readiness">Project your score from practice forms</Link></li>
          <li><Link href="/readiness/methodology">How the projection is calibrated</Link></li>
        </ul>
        <p className="cta-line">
          <a
            href={appStoreUrl('percentiles')}
            className="btn primary"
            onClick={() => track('store_click', { source: 'percentiles', location: 'footer' })}
          >
            Get Step Gunner
          </a>
        </p>
      </section>

      <style jsx>{`
        .block { margin: 0 0 36px; }
        h2 { font-size: 22px; letter-spacing: -0.015em; margin: 0 0 10px; text-wrap: balance; }
        p { margin: 0 0 14px; }
        .sub { color: var(--ink-dim); }
        .field { display: flex; flex-direction: column; gap: 5px; max-width: 260px; margin: 0 0 16px; }
        .field span {
          font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--ink-faint); font-weight: 700;
        }
        .field input {
          font: inherit; font-size: 18px; padding: 11px 13px; border-radius: 8px;
          border: 1px solid var(--hair-strong); background: var(--bg-2); color: var(--ink);
          font-variant-numeric: tabular-nums;
        }
        .callout {
          border-left: 3px solid var(--ink-faint); padding: 13px 17px;
          border-radius: 0 8px 8px 0; margin: 0; background: var(--bg-3);
        }
        .callout.good { border-left-color: var(--green); }
        .callout.warn { border-left-color: var(--gold); }
        .tw { overflow-x: auto; border: 1px solid var(--hair-strong); border-radius: 8px; }
        table { border-collapse: collapse; width: 100%; font-size: 15px; min-width: 420px; }
        th {
          text-align: left; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--ink-faint); font-weight: 700;
          padding: 11px 14px; background: var(--bg-3);
          border-bottom: 1px solid var(--hair-strong); white-space: nowrap;
        }
        td { padding: 9px 14px; border-bottom: 1px solid var(--hair); background: var(--bg-2); }
        tr:last-child td { border-bottom: none; }
        tr.peak td { background: rgba(47, 111, 237, 0.08); }
        tr.mine td { background: rgba(13, 148, 72, 0.09); }
        .r { text-align: right; }
        .n { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .how { font-size: 13.5px; color: var(--ink-dim); }
        .fail { color: var(--gold); }
        .fine { font-size: 13.5px; color: var(--ink-dim); margin: 10px 0 0; }
        .limits { padding-left: 20px; }
        .limits li { margin-bottom: 10px; }
        .rel { padding-left: 20px; }
        .rel li { margin-bottom: 6px; }
        .cta-line { margin: 18px 0 0; }
        .btn {
          display: inline-block; border: 1px solid var(--hair-strong); border-radius: 8px;
          padding: 9px 16px; font-weight: 600; font-size: 15px;
        }
        .btn.primary { background: var(--ink); color: var(--bg); border-color: var(--ink); }
      `}</style>
    </LabLayout>
  );
}
