import Link from 'next/link';
import { useMemo, useState } from 'react';
import LabLayout from '../components/LabLayout';
import benchmarks from '../lib/specialty_benchmarks.json';
import { PASS, percentile, ordinal } from '../lib/readiness';
import { appStoreUrl, track } from '../lib/analytics';

// Cluster 3 of the search strategy. Every competitor publishes the same thing:
// the AVERAGE Step 2 score of matched applicants, as prose. That answers the
// wrong question. "The average matched dermatologist scored 253" tells a 244
// nothing about their odds. NRMP publishes P(match | score band), which is the
// question students actually have, and nobody puts it in a tool.
//
// Honesty rules this page lives by, because the whole strategy rests on being
// trusted with numbers: US MD seniors only (stated, not buried), cells with
// thin n flagged rather than smoothed, non-monotonic wobble shown rather than
// tidied, and the causal claim explicitly NOT made.

type Spec = {
  abbr: string;
  matchedAvg: number;
  pMatchPct: Record<string, number | null>;
  nBySeniors: Record<string, number>;
};
const SPECIALTIES = benchmarks.specialties as unknown as Record<string, Spec>;
const META = benchmarks.meta as unknown as { source: string; note: string; passingScore: number };
const BANDS = ['210-219', '220-229', '230-239', '240-249', '250+'];
const THIN = 30; // below this many seniors in a cell, the percentage is noise

const NAMES = Object.keys(SPECIALTIES).sort(
  (a, b) => SPECIALTIES[b].matchedAvg - SPECIALTIES[a].matchedAvg,
);

/** Points of match probability bought by moving from the 230s to 250+. */
function marginal(name: string): number | null {
  const p = SPECIALTIES[name].pMatchPct;
  const lo = p['230-239'];
  const hi = p['250+'];
  return lo == null || hi == null ? null : hi - lo;
}

const LEVERAGE = NAMES
  .map((n) => ({ name: n, gain: marginal(n) }))
  .filter((x): x is { name: string; gain: number } => x.gain != null)
  .sort((a, b) => b.gain - a.gain);

const bandLabel = (b: string) => (b === '250+' ? '250 and up' : `${b.slice(0, 3)}s`);

export default function ScoreBySpecialty() {
  const [name, setName] = useState('Orthopaedic Surgery');
  const [score, setScore] = useState('');
  const spec = SPECIALTIES[name];

  const n = parseInt(score, 10);
  const valid = !Number.isNaN(n) && n >= 180 && n <= 300;
  const yourBand = useMemo(() => {
    if (!valid) return null;
    if (n >= 250) return '250+';
    if (n >= 240) return '240-249';
    if (n >= 230) return '230-239';
    if (n >= 220) return '220-229';
    if (n >= 210) return '210-219';
    return '<210';
  }, [n, valid]);

  const yourP = yourBand && yourBand !== '<210' ? spec.pMatchPct[yourBand] : null;
  const yourN = yourBand && yourBand !== '<210' ? spec.nBySeniors[yourBand] ?? 0 : 0;
  const gain = marginal(name);

  return (
    <LabLayout
      metaTitle="Step 2 CK Score by Specialty: Your Odds, Not the Average"
      metaDesc="Probability of matching at your actual Step 2 CK score, by specialty, from NRMP data on US MD seniors. Not the average score of people who matched."
      campaign="specialty_targets"
      eyebrow="Match data"
      title="What Step 2 score do you need for your specialty?"
      lede="Every other page answers this with the average score of people who matched. That is the wrong number. Here is the probability of matching at your score."
      maxWidth={780}
      head={(
        <>
          <link rel="canonical" href="https://stepgunner.com/step-2-score-by-specialty" />
          <meta property="og:title" content="What Step 2 score do you need for your specialty?" />
          <meta property="og:description" content="Probability of matching at your actual Step 2 CK score, by specialty, from NRMP data on US MD seniors." />
          <meta property="og:url" content="https://stepgunner.com/step-2-score-by-specialty" />
          <meta property="og:image" content="https://stepgunner.com/api/og" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="https://stepgunner.com/api/og" />
        </>
      )}
    >
      <section className="block">
        <h2>The average is the wrong number</h2>
        <p>
          &quot;The average matched dermatologist scored 253&quot; is the most repeated sentence in
          Step 2 advice, and it is close to useless. It describes people who already matched. It
          says nothing about what happens to <em>you</em> at 244.
        </p>
        <p>
          The NRMP publishes the number that actually answers the question: among US MD seniors
          who applied to a specialty, what fraction matched, broken out by Step 2 band. That is
          below, for all 22 specialties, with the sample size of every cell so you can see which
          numbers to trust.
        </p>
      </section>

      <section className="block tool">
        <div className="row">
          <label className="field">
            <span>Specialty</span>
            <select value={name} onChange={(e) => { setName(e.target.value); track('specialty_select', { specialty: e.target.value }); }}>
              {NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Your Step 2 score</span>
            <input
              inputMode="numeric"
              placeholder="245"
              value={score}
              onChange={(e) => setScore(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
            />
          </label>
        </div>

        {valid && yourBand === '<210' && (
          <p className="callout warn">
            Below 210 the published bands run out of usable data for most specialties, and a
            score under {PASS} is a fail rather than a low pass. The honest read at that level is
            that the score is not the thing to optimise next.
          </p>
        )}

        {valid && yourP != null && (
          <p className={'callout ' + (yourN < THIN ? 'warn' : 'good')}>
            <b>{n} in {name}:</b> {yourP}% of US MD seniors in the {bandLabel(yourBand!)} matched,
            out of {yourN.toLocaleString()} applicants in that band.
            {yourN < THIN && ' That cell has fewer than 30 people in it, so treat the percentage as a rumour, not a rate.'}
            {' '}Your score sits at the {ordinal(percentile(n))} percentile of all first-takers.
          </p>
        )}

        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Step 2 band</th>
                <th className="r">Matched</th>
                <th className="r">Applicants</th>
                <th>How solid</th>
              </tr>
            </thead>
            <tbody>
              {BANDS.map((b) => {
                const p = spec.pMatchPct[b];
                const cn = spec.nBySeniors[b] ?? 0;
                const mine = yourBand === b;
                return (
                  <tr key={b} className={mine ? 'mine' : ''}>
                    <td className="n"><b>{bandLabel(b)}</b>{mine ? <i className="you">you</i> : null}</td>
                    <td className="r n">
                      {p == null ? '--' : (
                        <span className="mag">
                          <span className="magbar"><i style={{ width: `${p}%` }} /></span>
                          <b>{p}%</b>
                        </span>
                      )}
                    </td>
                    <td className="r n">{cn.toLocaleString()}</td>
                    <td className="solid">
                      {cn === 0 ? 'no data'
                        : cn < THIN ? <span className="thin">too few to trust</span>
                          : cn < 200 ? 'usable' : 'solid'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="fine">
          Matched average for {name}: <b>{spec.matchedAvg}</b>. {META.source}.
        </p>
      </section>

      <section className="block">
        <h2>Whether the next 20 points are worth anything depends entirely on your specialty</h2>
        <p>
          This is the finding worth carrying away, and it is invisible if you only ever read
          average scores. Moving from the 230s to 250 and up is the same amount of work in every
          specialty. It buys wildly different things.
        </p>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Specialty</th>
                <th className="r">230s</th>
                <th className="r">250+</th>
                <th className="r">Points bought</th>
              </tr>
            </thead>
            <tbody>
              {LEVERAGE.map((l) => {
                const p = SPECIALTIES[l.name].pMatchPct;
                const hot = l.gain >= 20;
                return (
                  <tr key={l.name} className={hot ? 'hot' : l.gain <= 3 ? 'flat' : ''}>
                    <td>{l.name}</td>
                    <td className="r n">{p['230-239']}%</td>
                    <td className="r n">{p['250+']}%</td>
                    <td className="r n">
                      <span className="mag">
                        <span className="magbar"><i style={{ width: `${Math.max(0, l.gain) / 43 * 100}%` }} /></span>
                        <b>{l.gain > 0 ? `+${l.gain}` : l.gain}</b>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          In Plastic Surgery those twenty points are worth <b>43 points of match probability</b>.
          In Family Medicine, Pediatrics and Internal Medicine they are worth <b>one</b>, because
          those specialties already match nearly everyone who applies with a score in the 230s.
          If you are going into primary care with a 235, the honest advice is that more Step 2
          points are close to the least valuable thing you can buy with your remaining weeks.
        </p>
        <p className="cta-line">
          <Link href="/readiness" className="btn">See where your practice forms project</Link>
        </p>
      </section>

      <section className="block">
        <h2>What this data cannot tell you</h2>
        <p>
          Four limits, stated plainly, because a page that hides them is not worth trusting with
          a decision this size.
        </p>
        <ol className="limits">
          <li>
            <b>It is US MD seniors only.</b> DO students and international graduates face
            different distributions and often different score expectations. These numbers do not
            transfer.
          </li>
          <li>
            <b>It is a correlation, not a lever.</b> Students who score 250 also tend to have
            stronger research, letters, and clerkship grades. The percentage attached to a band is
            what happened to people in that band, not what a score change would do for you. Nobody
            has run the experiment where the same applicant applies twice with different scores.
          </li>
          <li>
            <b>Thin cells wobble.</b> Radiation Oncology reads 100% in the 220s and 99% at 250 and
            up, which is not a real inversion, it is twenty people. Every cell under 30 applicants
            is marked. Do not build a plan on a marked cell.
          </li>
          <li>
            <b>The top band is open-ended.</b> 250+ has no ceiling, so a specialty whose applicants
            cluster at 265 looks the same here as one clustering at 252.
          </li>
        </ol>
        <p className="fine">
          {META.note} Pages still quoting 214 as the passing score are using the pre-2022 number;
          it has been {PASS} since.
        </p>
      </section>

      <section className="block">
        <h2>Related</h2>
        <ul className="rel">
          <li><Link href="/step-2-ck-percentiles">What your Step 2 score means in percentiles</Link></li>
          <li><Link href="/step-2-score-predictor">Project your score from practice forms</Link></li>
          <li><Link href="/research/nbme-to-step-2">The research behind the projection</Link></li>
        </ul>
        <p className="cta-line">
          <a
            href={appStoreUrl('specialty_targets')}
            className="btn primary"
            onClick={() => track('store_click', { source: 'specialty_targets', location: 'footer' })}
          >
            Get Step Gunner
          </a>
        </p>
      </section>

      <style jsx>{`
        .block { margin: 0 0 36px; }
        h2 { font-size: 22px; letter-spacing: -0.015em; margin: 0 0 10px; text-wrap: balance; }
        p { margin: 0 0 14px; }
        .tool .row { display: flex; flex-wrap: wrap; gap: 14px; margin: 0 0 16px; }
        .field { display: flex; flex-direction: column; gap: 5px; flex: 1 1 200px; }
        .field span {
          font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--ink-faint); font-weight: 700;
        }
        .field select, .field input {
          font: inherit; font-size: 16px; padding: 10px 12px; border-radius: 8px;
          border: 1px solid var(--hair-strong); background: var(--bg-2); color: var(--ink);
        }
        .callout {
          border-left: 3px solid var(--ink-faint); padding: 13px 17px;
          border-radius: 0 8px 8px 0; margin: 0 0 16px; background: var(--bg-3);
        }
        .callout.good { border-left-color: var(--green); }
        .callout.warn { border-left-color: var(--gold); }
        .tw { overflow-x: auto; border: 1px solid var(--hair-strong); border-radius: 8px; }
        table { border-collapse: collapse; width: 100%; font-size: 15px; min-width: 460px; }
        th {
          text-align: left; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--ink-faint); font-weight: 700;
          padding: 11px 14px; background: var(--bg-3);
          border-bottom: 1px solid var(--hair-strong); white-space: nowrap;
        }
        td { padding: 10px 14px; border-bottom: 1px solid var(--hair); background: var(--bg-2); }
        tr:last-child td { border-bottom: none; }
        tr.mine td { background: rgba(13, 148, 72, 0.09); }
        tr.hot td { background: rgba(224, 142, 0, 0.07); }
        tr.flat td { color: var(--ink-dim); }
        .r { text-align: right; }
        /* Magnitude encoded as a bar, with the value always beside it. The bar
           is the fast read; the number is the precise one and doubles as the
           label that keeps a low-contrast fill accessible. */
        .mag { display: inline-flex; align-items: center; gap: 9px; justify-content: flex-end; width: 100%; }
        .magbar {
          flex: 1 1 auto; max-width: 92px; height: 7px; border-radius: 999px;
          background: var(--bg-3); overflow: hidden; display: block;
        }
        .magbar i { display: block; height: 100%; background: var(--green); border-radius: 999px; }
        .mag b { min-width: 40px; text-align: right; font-variant-numeric: tabular-nums; }
        .n { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .you {
          font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--green); margin-left: 7px; font-style: normal;
        }
        .thin { color: var(--gold); }
        .solid { font-family: var(--mono); font-size: 12px; color: var(--ink-dim); }
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
