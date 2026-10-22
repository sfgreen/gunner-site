import Link from 'next/link';
import { useState } from 'react';
import {
  AppShell, ArticleBody, ArticleHeader, Hero, Icon, NumberedSteps, Section, Stage, StatStrip, StoreButton, Table,
} from '../components/app';
import { HeroEnd, PageHead, ResearchStyles } from '../components/app/research';
import { NORM, PASS, MEAN, percentile, ordinal } from '../lib/readiness';

// The percentile query is high volume and badly served: most pages that rank
// for it either reprint a stale table or quote 214 as the passing score, which
// has been 218 since 2022. The norm table below is the published USMLE one,
// already the source of truth for /readiness and the app, so this page cannot
// drift from the tool.
//
// The thesis is the part nobody writes: the distribution is densest around the
// mean, so the same ten points are worth very different amounts of percentile
// depending on where you start. That is computed from the table, not asserted.
// Built from the app-look blocks (components/app/README.md): the lookup sits in a
// Stage band under the header, like the ABG interpreter.

const ROWS = NORM.filter(([s]) => s >= 210 && s <= 275);

/** Percentile points gained per 10-score-point step, straight off the table. */
const STEPS = [210, 220, 230, 240, 250, 260, 270].slice(0, -1).map((lo, i) => {
  const hi = [220, 230, 240, 250, 260, 270][i];
  return { lo, hi, gain: percentile(hi) - percentile(lo) };
});
const STEEPEST = STEPS.reduce((a, b) => (b.gain > a.gain ? b : a));

const TOC: [string, string][] = [
  ['pass', 'The passing score is 218, not 214'],
  ['middle', 'The same ten points are worth more in the middle'],
  ['table', 'The full table'],
  ['misread', 'Three ways this number gets misread'],
  ['related', 'Related'],
];

export default function Percentiles() {
  const [score, setScore] = useState('');
  const n = parseInt(score, 10);
  const valid = !Number.isNaN(n) && n >= 180 && n <= 300;
  const p = valid ? percentile(n) : null;
  const title = 'Step 2 CK percentiles, and what your score actually means';

  return (
    <>
      <PageHead metaTitle="Step 2 CK Percentiles: What Your Score Actually Means" metaDesc="The published Step 2 CK percentile table for US MD first-takers, an instant lookup, and why the same ten points are worth more in the middle.">
        <link rel="canonical" href="https://stepgunner.com/step-2-ck-percentiles" />
        <meta property="og:title" content="Step 2 CK percentiles, and what your score actually means" />
        <meta property="og:description" content="The published Step 2 CK percentile table for US MD first-takers, plus why the same ten points are worth more in the middle of the distribution." />
        <meta property="og:url" content="https://stepgunner.com/step-2-ck-percentiles" />
        <meta property="og:image" content="https://stepgunner.com/api/og" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://stepgunner.com/api/og" />
      </PageHead>

      <AppShell campaign="percentiles" pageType="tool">
        <ResearchStyles />
        <Hero>
          <ArticleHeader
            category="step2"
            eyebrow="Score interpretation"
            title={title}
            accent="and what your score actually means"
            dek="The real norm table, an instant lookup, and the thing about the distribution that changes how you should read your own number."
            byline={false}
          />
          <HeroEnd />
        </Hero>

        <Stage category="step2">
          <div className="mk isl">
            <div className="sheet dark-card rs-tool rs-pl">
              <div className="sheet-bd rs-pl-g">
                <div className="fld">
                  <label htmlFor="rs-pl-score">Your Step 2 CK score</label>
                  <input
                    id="rs-pl-score"
                    className="inp"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="245"
                    value={score}
                    onChange={(e) => setScore(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  />
                </div>
                <div aria-live="polite">
                  {valid && (
                    <p className={'rs-read ' + (n >= PASS ? 'ok' : 'warn')}>
                      <b>{n}</b> is the <b>{ordinal(p!)} percentile</b> of US MD first-takers. That means
                      about {p}% of them scored at or below you, and about {100 - p!}% scored higher.
                      {n >= PASS
                        ? n >= MEAN
                          ? ' It is above the national mean of 250.'
                          : ` It clears the ${PASS} pass line and sits below the 250 mean.`
                        : ` It is below the ${PASS} passing score.`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Stage>

        <ArticleBody toc={TOC}>
          <StatStrip items={[
            { value: '218', label: <><span className="rs-sk">Passing score</span>not 214, which is what pages ranking for this still print</> },
            { value: '250', label: <><span className="rs-sk">National mean</span>so a 250 is the exact middle, not a good score</> },
            { value: '+27', tone: 'good', label: <><span className="rs-sk">Steepest 10 points</span>percentile bought between 250 and 260, the densest stretch</> },
          ]} />

          <Section id="pass" n="" title="The passing score is 218, not 214">
            <p className="prs">
              A surprising number of pages ranking for this question still quote 214. That was the
              old standard. The current minimum passing score for Step 2 CK is <b>{PASS}</b>. If a
              page tells you 214, whatever else it says was written a while ago and not checked
              since.
            </p>
            <p className="prs">
              The other number worth fixing in your head: the mean is <b>{MEAN}</b>, with a standard
              deviation of about 15. So a 250 is not a good score in the sense people mean when they
              say it, it is the exact middle. That surprises people who have spent months on forums
              where every posted score starts with a 25.
            </p>
          </Section>

          <Section id="middle" n="" title="The same ten points are worth more in the middle">
            <p className="prs">
              Scores are densest around the mean, so a ten point gain moves your percentile by very
              different amounts depending on where you start. Straight from the table:
            </p>
            <Table
              label="Percentile gained per ten points"
              head={['Moving from', 'Percentile gained', 'How it reads']}
              num={[1]}
              hl={STEPS.map((s, i) => (s === STEEPEST ? i : -1)).filter((i) => i >= 0)}
              minWidth={460}
              rows={STEPS.map((s) => [
                `${s.lo} to ${s.hi}`,
                <span key="m" className="rs-mag"><span className="rs-bar"><i style={{ width: `${s.gain / 27 * 100}%` }} /></span><b>+{s.gain}</b></span>,
                <span key="h" className="rs-how">
                  {s.gain >= 25 ? 'the steepest stretch on the curve'
                    : s.gain >= 20 ? 'dense: points move you a lot'
                      : s.gain >= 14 ? 'moderate'
                        : 'thin air: points move you less'}
                </span>,
              ])}
            />
            <p className="prs">
              The steepest stretch is <b>{STEEPEST.lo} to {STEEPEST.hi}</b>, worth{' '}
              <b>{STEEPEST.gain} percentile points</b>. Above 265 the curve flattens hard: the work
              required to add points keeps rising while the percentile they buy keeps shrinking. That
              is the quantitative version of advice you have heard as a vibe.
            </p>
            <p className="prs">
              It cuts the other way too. If you are sitting at 230 and aiming for a specialty that
              matches nearly everyone in the 230s, extra points are buying percentile you do not
              need.{' '}
              <Link href="/step-2-score-by-specialty">Whether points are worth anything depends on your specialty</Link>,
              and the difference between specialties is enormous.
            </p>
          </Section>

          <Section id="table" n="" title="The full table">
            <p className="prs">
              Published USMLE percentiles for LCME first-takers. Values between listed scores are
              linearly interpolated, which is what the lookup above does.
            </p>
            <Table
              label="Step 2 CK percentiles, LCME first-takers"
              head={['Score', 'Percentile', 'Where that sits']}
              num={[1]}
              hl={ROWS.map(([s], i) => (valid && Math.abs(n - s) < 3 ? i : -1)).filter((i) => i >= 0)}
              minWidth={420}
              rows={ROWS.map(([s, pc]) => [
                <b key="s">{s}</b>,
                String(pc),
                <span key="w" className="rs-how">
                  {s < PASS ? <span className="rs-fail">below the {PASS} pass line</span>
                    : s === MEAN ? 'the national mean'
                      : s < MEAN ? 'below the mean'
                        : s >= 270 ? 'top few percent'
                          : 'above the mean'}
                </span>,
              ])}
            />
            <p className="rs-fine">
              Source: USMLE Score Interpretation Guidelines, Table 2, LCME first-takers July 2022 to
              June 2025, N = 67,934. First-takers only, so repeaters and international graduates are
              not in this distribution.
            </p>
          </Section>

          <Section id="misread" n="" title="Three ways this number gets misread">
            <NumberedSteps steps={[
              { text: <><b>Percentile is not your match probability.</b> It is your rank among first-takers and nothing more. Two people at the same percentile applying to different specialties have completely different odds.</> },
              { text: <><b>Forums are not the distribution.</b> People post good news. A subreddit where everything starts with a 25 is showing you roughly the top third with extra steps.</> },
              { text: <><b>A practice form percentile is not this percentile.</b> Practice forms are scored on their own scales against their own reference groups.{' '}<Link href="/step-2-score-predictor">Convert the form first</Link>, then read the percentile off the projection.</> },
            ]} />
          </Section>

          <Section id="related" n="" title="Related">
            <div className="mk isl">
              <div className="rel">
                <Link href="/step-2-score-by-specialty"><span className="rt">What score you need for your specialty</span><Icon name="arrow" /></Link>
                <Link href="/readiness"><span className="rt">Project your score from practice forms</span><Icon name="arrow" /></Link>
                <Link href="/readiness/methodology"><span className="rt">How the projection is calibrated</span><Icon name="arrow" /></Link>
              </div>
              <div className="rs-act"><StoreButton loc="end">Get Step Gunner</StoreButton></div>
            </div>
          </Section>
        </ArticleBody>
      </AppShell>
      <style jsx global>{`
        .mk .rs-pl { max-width: 720px; }
        .mk .rs-pl-g { display: grid; gap: 16px; }
        .mk .rs-pl .fld { max-width: 280px; }
        @media (min-width: 760px) { .mk .rs-pl-g { grid-template-columns: 240px minmax(0, 1fr); align-items: end; gap: 24px; } }
      `}</style>
    </>
  );
}
