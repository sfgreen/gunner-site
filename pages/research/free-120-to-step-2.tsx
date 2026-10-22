// Research post: what a Free 120 percentage converts to, from 215 r/step2 score
// reports that carried both a current-form percentage and a real Step 2 score.
// Companion to nbme-to-step-2, same dataset and same limitations; that post kept
// Free 120 percentages out of the model, so this is the piece that uses them.
// Figures render from the gunner repo (docs/blog/figures/render_free120.py).
// Built from the app-look blocks (components/app/README.md).
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import {
  AppShell, ArticleBody, ArticleHeader, Figure, Hero, Section, Table,
} from '../../components/app';
import { ChoicePair, PageHead, Pitch, ResearchStyles, Summary } from '../../components/app/research';
import { track } from '../../lib/analytics';

const CAMPAIGN = 'research_free120';
const PUBLISHED = '2026-09-15';
const H1 = 'What a Free 120 percentage is actually worth';

const TOC: [string, string][] = [
  ['table', 'The table nobody publishes'],
  ['vibe', 'It is not a vibe check'],
  ['ruins', 'The part that ruins it'],
  ['do', 'What I would actually do'],
  ['limits', 'What this cannot tell you'],
  ['wrong', 'One thing I got wrong'],
  ['short', 'The short version'],
  ['method', 'Data and method'],
  ['refs', 'References'],
];

export default function FreeOneTwenty() {
  const title = 'The Free 120 predicts better than its reputation. Almost nobody takes it in time to use it.';
  const desc = 'A Free 120 to Step 2 CK conversion table from 215 real score reports, how it compares with NBME and UWSA as a predictor, and the timing problem that wastes it.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: title,
    description: desc,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    author: { '@type': 'Person', name: 'Danny Varghese', description: 'MS4, Texas A&M College of Medicine', url: 'https://stepgunner.com' },
    publisher: { '@type': 'Organization', name: 'Step Gunner', url: 'https://stepgunner.com' },
    mainEntityOfPage: 'https://stepgunner.com/research/free-120-to-step-2',
    about: ['USMLE Step 2 CK', 'Free 120', 'score prediction'],
  };

  return (
    <>
      <PageHead metaTitle="Free 120 to Step 2 CK Score Conversion Table: 215 Real Reports" metaDesc={desc} ogImage="/og/research/free-120-to-step-2.png" ogAlt={H1}>
        <link rel="canonical" href="https://stepgunner.com/research/free-120-to-step-2" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </PageHead>

      <AppShell campaign={CAMPAIGN} pageType="research">
        <ResearchStyles />
        <Hero>
          <ArticleHeader
            category="step2"
            crumb={[{ href: '/research', label: 'Research' }, { label: 'Free 120 to Step 2' }]}
            eyebrow="Research"
            title={H1}
            accent="actually worth"
            dek={<>215 students who posted a current-form Free 120 percentage and then a real Step 2 score. The conversion table nobody publishes, and the reason most people get nothing out of it.</>}
            meta={[`Published ${PUBLISHED}`, '215 students, current form', 'About 7 minutes']}
          />
          <Summary>
            <p>The Free 120 is treated as a vibe check. It is not. Across 215 r/step2 score reports carrying a current-form percentage and a real Step 2 score, the correlation is 0.55, and scored leave-one-out it misses the real score by 5.9 points on its own against 5.2 for a whole recency-weighted stack of paid NBME and UWSA forms. Added to those forms it improves them, 5.2 to 5.0, so it is carrying information they do not. The problem is when people sit it: the median student takes it three days before the exam and 91% take it inside the final week, which is the one moment the number cannot change anything.</p>
          </Summary>
          <Pitch
            placement="top"
            kicker="Your forms, your Free 120, one projected range"
            title="Find out where you actually stand while there is still time to move it."
            body="The readiness check takes your NBME and UWSA scores with the dates you sat them, applies the per-form corrections from this research, and gives you a range instead of one fake precise number. Free, no account needed for the web version."
            primary={{ href: '/readiness', label: 'Run the readiness check', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' }) }}
            secondary={{ store: true, loc: 'top', label: 'Get the app free' }}
            trust={<>The same model publishes its out-of-sample misses every Monday on the <Link href="/research/nbme-to-step-2">research page</Link>.</>}
          />
        </Hero>

        <ArticleBody toc={TOC}>
          <Section id="table" n="01" title="The table nobody publishes">
            <p className="prs">Every thread about the Free 120 ends the same way: it is not predictive, do not read into it. Nobody checks, because checking needs a set of people who posted a percentage and then came back with a real score. That set exists on r/step2, so I parsed it. 269 students, 2,042 reported practice scores, and 215 of them with a current-form Free 120 percentage plus a real three-digit result.</p>
            <p className="prs">Median real Step 2 score, by Free 120 band:</p>
            <Figure n={1} src="/research/f120_fig2_bands.svg" width={576} height={360} alt="Median real Step 2 score by Free 120 band, with the interquartile range of each band" caption="Gold dot is the median; the bar is the middle half of students in that band. The spread is the point: a band tells you the centre, not your score." />
            <Table
              label="Median real Step 2 score by Free 120 band, current form"
              head={['Free 120, current form', 'students', 'median real Step 2', 'middle half']}
              num={[1, 2, 3]}
              hl={[2]}
              rows={[
                ['65 to 69%', '12', <b key="b">247</b>, '242 to 251'],
                ['70 to 74%', '31', <b key="b">250</b>, '246 to 258'],
                ['75 to 79%', '68', <b key="b">256</b>, '252 to 261'],
                ['80 to 84%', '50', <b key="b">261</b>, '255 to 267'],
                ['85% and up', '48', <b key="b">270</b>, '265 to 273'],
              ]}
            />
            <p className="prs">Six students scored under 65% with a median of 250, which I am not going to band, because six students is not a band. If you are under 65 with a week left, the honest answer is that I do not have enough people like you to tell you anything.</p>
            <p className="prs"><strong>Read the fourth column, not the third.</strong> A 78% has a median of 256, and the middle half of students at that band landed between 252 and 261. The full range at that band ran from 241 to 272. The median is a real signal and the spread around it is thirty points wide, and both things are true at once.</p>
          </Section>

          <Section id="vibe" n="02" title="It is not a vibe check">
            <Figure n={2} src="/research/f120_fig1_scatter.svg" width={576} height={432} alt="Scatter of Free 120 percent correct against actual Step 2 CK score for 215 students, with the fitted line" caption="215 students. The correlation is 0.55, which is not what a test with no signal looks like." />
            <p className="prs">I ran every single-number rule I could build against the 205 students who had both a Free 120 and at least one NBME or UWSA, scoring each one leave-one-out so nothing gets graded on its own fit:</p>
            <Table
              label="Mean miss against the real score, by single-number rule"
              head={['single-number rule', 'mean miss against the real score']}
              num={[1]}
              hl={[0, 4]}
              rows={[
                ['Free 120 percentage alone', <b key="b">5.9 points</b>],
                ['Best NBME or UWSA form', '5.4'],
                ['Plain average of every form', '5.3'],
                ['Recency-weighted NBME/UWSA average', '5.2'],
                ['Forms and the Free 120 together', <b key="b">5.0</b>],
              ]}
            />
            <p className="prs">One free 120-question exam, taken in an afternoon, gets you within 5.9 points. A full set of paid NBMEs gets you to 5.2. That gap is smaller than most people would guess.</p>
            <p className="prs">The bottom row is the part I did not expect. Adding the Free 120 on top of the forms improves the prediction, 5.2 to 5.0. It is not re-measuring what the NBMEs already told you. It carries something of its own, which makes sense once you say it out loud: it is the only practice material written by the organisation that writes the real exam.</p>
          </Section>

          <Section id="ruins" n="03" title="The part that ruins it">
            <Figure n={3} src="/research/f120_fig3_timing.svg" width={576} height={302} alt="Histogram of how many days before the exam students sat the Free 120" caption="Median three days. 91% of students sat it inside the final week." />
            <p className="prs">The median student sat the Free 120 <strong>three days</strong> before their exam. Ninety one percent sat it inside the final week. The middle half sat it between two and four days out.</p>
            <p className="prs">So here is the situation almost everyone creates. You take the one piece of material written by the actual exam writers, it turns out to be roughly as informative as your entire paid practice stack, and you take it at the single moment in the whole timeline when you can do nothing about what it tells you.</p>
            <p className="prs">If it comes back at 85 you feel good for three days, which is pleasant and changes nothing. If it comes back at 68 you spend the last seventy two hours before the most important exam of your life in a panic, which is worse than pleasant and also changes nothing, because there is no version of the next three days that moves you fifteen points.</p>
            <p className="prs">I did this too. I sat mine four days out, and I remember treating it as a temperature check rather than as information, because by then that was the only thing it could be.</p>
          </Section>

          <Section id="do" n="04" title="What I would actually do">
            <p className="prs"><strong>Take it twice.</strong> Once around three to four weeks out, when the number can still change what you do, and once in the last week if you want the familiarity of the interface.</p>
            <p className="prs">The first sitting is the one that earns its keep. A 71% with a month left is a different object from a 71% with three days left: it is still a problem you can work on. The timing evidence from the <Link href="/research/nbme-to-step-2">NBME analysis</Link> applies here too, so an early Free 120 should be weighted like any other early form rather than treated as a verdict.</p>
            <p className="prs">The second sitting is for the interface, the lab value pop-ups and the pacing, and you should expect it to read a little high because you have seen the questions.</p>
            <p className="prs">The whole form calendar has the same shape, and I mapped it in <Link href="/research/dedicated-calendar">the dedicated schedule post</Link>: the most informative reads all cluster in the last fortnight. Which of those forms to believe when they disagree has <Link href="/research/which-nbme-is-most-predictive">its own post</Link>.</p>
            <p className="prs">The obvious objection is that there is only one current form, so taking it early spends it. That is real. My answer is that a number you can act on is worth more than a number you cannot, and the second sitting still gives you the interface even if it no longer gives you a clean score.</p>
            <Pitch
              kicker="While the number can still move"
              title="Three to four weeks out is the window this article is really about."
              body="Step Gunner is built for the part that happens between practice forms: a daily case, spaced repetition that brings your misses back until they stick, and a readiness range that updates as you add each score. Free to start."
              primary={{ store: true, loc: 'mid', label: 'Get Step Gunner free' }}
              secondary={{ href: '/free120', label: 'Sit the Free 120 timed', onClick: () => track('cta_free120', { surface: CAMPAIGN, location: 'pitch_mid' }) }}
            />
          </Section>

          <Section id="limits" n="05" title="What this cannot tell you">
            <ul className="rs-ul">
              <li><strong>The sample posts.</strong> Mean real score 258 against a national mean of about 250, and the lowest real score in the whole dataset is a 216. The low bands especially are built on students who recovered, because students who did not are less likely to write the thread.</li>
              <li><strong>The edges are thin.</strong> Twelve students at 65 to 69 and six under 65. I would not plan anything around the bottom two rows.</li>
              <li><strong>Current form only.</strong> Older Free 120 versions are a different instrument and mixing them would misdescribe what the table shows.</li>
              <li><strong>Correlation is not a promise.</strong> A 0.55 correlation explains about 30% of the variance in real scores. Most of what decides your number is not in this table.</li>
            </ul>
          </Section>

          <Section id="wrong" n="06" title="One thing I got wrong">
            <p className="prs">My first pass put the correlation at 0.32, and I nearly published a piece arguing that the Free 120 is weakly informative and should be held loosely.</p>
            <p className="prs">Then I looked at the distribution and found a record with a Free 120 of <strong>220%</strong>, which cannot exist on a 120-question exam. It was a parsing failure. That single bad row was dragging the correlation from 0.55 down to 0.32 on its own, and it would have flipped the entire conclusion.</p>
            <p className="prs">I dropped it because 220% is impossible, not because it disagreed with me, and that distinction matters. Dropping points that disagree with your thesis is how you manufacture a result. So I also re-ran the whole thing excluding the twelve other records where the parser had clearly misfired somewhere, and the correlation rose to 0.62 while the band medians moved by at most a point. The table is robust. The headline correlation is somewhere between 0.55 and 0.62 and I have reported the more conservative one.</p>
            <p className="prs">I am telling you this because the same score reports feed the predictor on this site, and you should know how it gets checked.</p>
          </Section>

          <Section id="short" n="07" title="The short version">
            <p className="prs">The Free 120 is worth more than its reputation. One free exam gets within about six points of your real score, close to what an entire set of paid forms manages, and it adds information on top of them rather than repeating them.</p>
            <p className="prs">And it is almost always taken three days out, where it can only ever be a mood.</p>
            <p className="prs"><strong>Take it early enough that the number still has somewhere to go.</strong></p>
          </Section>

          <ChoicePair
            store={{ label: 'Get Step Gunner free', sub: 'daily case, spaced repetition, readiness range' }}
            alt={{ href: '/readiness', label: 'Run the readiness check', sub: 'free, with exam date and percentile', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' }) }}
          />

          <Section id="method" n="" title="Data and method">
            <p className="prs">Score-report posts from r/step2, parsed into one row per assessment with usernames dropped at ingest. A student enters this analysis when a current-form Free 120 percentage and a real three-digit Step 2 score are both present (n=215). Percentages above 100 are impossible on a 120-question exam and are excluded; no other value was removed from the primary analysis. Comparison rules were scored leave-one-out on the 205 students who also had at least one NBME or UWSA form, using the same per-form corrections and recency weighting as the <Link href="/readiness/methodology">predictor</Link>. Figures rebuild from the source data rather than being stored, so a chart cannot drift from what it claims to show.</p>
          </Section>

          <Section id="refs" n="" title="References">
            <div className="refs"><ol>
              <li>USMLE. Step 2 CK Free 120 sample test items (current form).</li>
              <li>USMLE. Step 2 CK Score Interpretation Guidelines (percentile norms, LCME first-takers, July 2022 to June 2025).</li>
              <li>r/step2 score-report threads, 2025 to 2026, parsed with usernames removed at ingest.</li>
            </ol></div>
          </Section>
        </ArticleBody>
      </AppShell>
    </>
  );
}
