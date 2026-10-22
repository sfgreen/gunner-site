// Research post: does taking longer per question go with more right answers?
// From the app's own answer telemetry (GA4 card_answered via BigQuery), 383 people
// with 150+ answers and 450,766 answers in all. Fourth in the research series; the
// first built on app data rather than r/step2 score reports.
// Numbers: gunner repo analysis/answer_telemetry/telemetry.py (aggregates.json).
// Figures: gunner repo docs/blog/figures/render_telemetry.py --light.
// Draft with the full robustness table: gunner repo docs/blog/step-2-ck-time-per-question.md.
// Built from the app-look blocks (components/app/README.md).
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import {
  AppShell, ArticleBody, ArticleHeader, Figure, Hero, Section, Table,
} from '../../components/app';
import { ChoicePair, PageHead, Pitch, ResearchStyles, Summary } from '../../components/app/research';
import { track } from '../../lib/analytics';

const CAMPAIGN = 'research_speed';
const PUBLISHED = '2026-10-22';
const PATH = '/research/step-2-ck-time-per-question';

const TOC: [string, string][] = [
  ['advice', 'The advice everyone gives'],
  ['speed', 'Fastest to slowest'],
  ['same', 'Same questions, same answer'],
  ['within', 'Inside one person, the slow answers are the wrong ones'],
  ['types', 'How long each kind of question takes'],
  ['survive', 'What did not survive'],
  ['limits', 'What this cannot tell you'],
  ['do', 'What I would actually do'],
  ['short', 'The short version'],
  ['method', 'Data and method'],
  ['refs', 'References'],
];

export default function TimePerQuestion() {
  const title = 'Going slower did not come with more right answers';
  const desc = '427,282 timed answers from 383 students: the slowest quarter took 2.6 times as long per question and got no more right. Plus seconds per question by type.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: title,
    description: desc,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    author: { '@type': 'Person', name: 'Danny Varghese', description: 'MS4, Texas A&M College of Medicine', url: 'https://stepgunner.com' },
    publisher: { '@type': 'Organization', name: 'Step Gunner', url: 'https://stepgunner.com' },
    mainEntityOfPage: `https://stepgunner.com${PATH}`,
    about: ['USMLE Step 2 CK', 'test pacing', 'time per question'],
  };

  return (
    <>
      <PageHead metaTitle="Step 2 CK Time Per Question: Does Going Slower Help?" metaDesc={desc} ogImage="/og/research/step-2-ck-time-per-question.png" ogAlt={title}>
        <link rel="canonical" href={`https://stepgunner.com${PATH}`} />
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
            crumb={[{ href: '/readiness', label: 'Readiness check' }, { href: '/research', label: 'Research' }]}
            eyebrow="Research"
            title={title}
            accent="more right answers"
            dek={<>427,282 timed answers from 383 people in a Step 2 CK app. The slowest quarter took 2.6 times as long per question as the fastest and got the same share right. Inside one person&apos;s answers, the slow ones were the wrong ones.</>}
            meta={[`Published ${PUBLISHED}`, '383 people, 427,282 answers', 'About 7 minutes']}
          />
          <Summary>
            <p>&ldquo;Slow down and read every word&rdquo; is the pacing advice everyone repeats. Across 383 people who each answered at least 150 questions in a Step 2 CK app, the slowest quarter took a median of 27 seconds per question, 2.6 times the fastest quarter&apos;s 10, and got 76.3% right against 77.0%. The 95% interval on that gap runs from 3.1 points worse to 1.7 points better, so the most generous reading is a point or two for more than double the time. Inside one person the pattern is sharp: people got 85% of their fastest fifth of answers right and 72% of their slowest fifth. A long pause is mostly a sign of not knowing, not a way to find out. None of this shows that hurrying helps.</p>
          </Summary>
          <Pitch
            placement="top"
            kicker="Your forms, your exam date, one projected range"
            title="Find out where you actually stand, not how fast you are."
            body="The readiness check takes your NBME and UWSA scores with the dates you sat them and gives you a projected range instead of one fake precise number. Free, no account needed for the web version."
            primary={{ href: '/readiness', label: 'Run the readiness check', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' }) }}
            secondary={{ store: true, loc: 'top', label: 'Get the app free' }}
          />
        </Hero>

        <ArticleBody toc={TOC}>
          <Section id="advice" n="01" title="The advice everyone gives">
            <p className="prs">Every thread about running out of time on Step 2 ends with the same advice: slow down, read every word, the answer is in the stem. I have given that advice myself. It sounds like it has to be true, because the alternative, that careful readers do no better, sounds absurd.</p>
            <p className="prs">The problem with testing it belongs up front, not in a footnote. Stronger students are faster and more accurate at the same time, because knowing the answer is what makes you fast. So the people who take longest are, on average, people who know less, and any comparison of fast and slow people is tangled up with ability. This data cannot show that hurrying helps, and I am not going to claim it does. What it can do is look for the reward the advice promises. If reading slowly bought accuracy, the slow readers should be the accurate ones. <strong>They are not.</strong></p>
            <p className="prs">Who this is, before any more numbers: 383 people who answered at least 150 questions in Step Gunner, a Step 2 CK app, between June 12 and October 20, 2026, with test and developer accounts removed. They chose to download a study app, which already makes them different from the average test taker. The time is measured in the app, from the options appearing to the tap, not on the exam. App questions are short (a CK Gold vignette has a median of 41 words), and the exam allows about 90 seconds a question. Read this as a test of whether extra time buys accuracy on practice questions, not as an exam pacing study.</p>
          </Section>

          <Section id="speed" n="02" title="Fastest to slowest">
            <Figure n={1} src="/research/speed_fig1_deciles.svg" width={576} height={346} alt="Mean accuracy for ten groups of about 38 people each, ordered by their median seconds per question from about 8 to 33 seconds; every group sits between 75 and 78 percent" caption="383 people in ten groups of about 38, ordered by their median time per question. Accuracy stays between 75% and 78% from 8 seconds to 33 seconds. The bars are 95% intervals." />
            <Table
              label="Accuracy by speed quarter"
              head={['speed quarter', 'people', 'median per question', 'right', '95% interval']}
              num={[1, 2, 3, 4]}
              hl={[0, 3]}
              minWidth={560}
              rows={[
                ['fastest', '96', '10.2 s', <b key="b">77.0%</b>, '75.3 to 78.6'],
                ['second', '96', '14.9 s', <b key="b">77.1%</b>, '75.5 to 78.5'],
                ['third', '96', '19.6 s', <b key="b">75.4%</b>, '73.6 to 77.3'],
                ['slowest', '95', '27.0 s', <b key="b">76.3%</b>, '74.5 to 78.1'],
              ]}
            />
            <p className="prs">The slowest quarter spent about 17 more seconds on every question and got <strong>0.7 points fewer</strong> right, with an interval from 3.1 points fewer to 1.7 points more. Put plainly, about 76 or 77 of every 100 questions right, whichever end you are on. Across everyone, the correlation between time per question and accuracy is <strong>-0.12</strong> (interval -0.26 to 0.01): close to nothing, and if anything leaning the wrong way for the advice.</p>
          </Section>

          <Section id="same" n="03" title="Same questions, same answer">
            <p className="prs">The obvious objection is that slow people might be doing harder questions. A CK Gold vignette takes longer than a one-line Buzzword, so a slow person could simply be someone who studies vignettes. So I compared every answer with how that same question usually goes: its usual time, and how often everyone else gets it right. The relationship stays flat (r = -0.07, interval -0.19 to 0.04).</p>
            <p className="prs">The app brings missed questions back, and a repeat is fast and usually right, which could flatter the fast. Counting only the first time each person met each question: flat again (r = -0.10, interval -0.24 to 0.03, 359 people).</p>
            <p className="prs">And on CK Gold vignettes alone, where careful reading ought to matter most, the slower readers did slightly <strong>worse</strong>: 75.3% for the fastest quarter at 11.5 seconds, 73.1% for the slowest at 29 seconds (303 people with 100 or more vignettes, r = -0.15, interval -0.31 to just below zero).</p>
          </Section>

          <Section id="within" n="04" title="Inside one person, the slow answers are the wrong ones">
            <Figure n={2} src="/research/speed_fig2_within.svg" width={576} height={346} alt="Accuracy by each person's own speed fifth, falling from about 85 percent on their fastest answers to about 72 percent on their slowest, in every deck" caption="Each person compared only with themselves. An answer counts as slow when it took longer than that question usually takes. The fastest fifth of a person's answers were 85% right, the slowest fifth 72%, and the shape is the same in CK Gold, Next Best Step and Buzzwords." />
            <p className="prs">The comparison between people is confounded by ability, so take ability out: compare each person only with themselves. For every answer I asked whether it took that person longer or shorter than the question usually takes, then split each person&apos;s answers into fifths.</p>
            <p className="prs">Their fastest fifth: <strong>85% right</strong>. Their slowest fifth: <strong>72% right</strong>. Same shape in every deck, from one-line Buzzwords to full vignettes, across about 85,000 answers per fifth.</p>
            <p className="prs">This is confounded too, the other way round: you are slow because you do not know, so it cannot tell you that moving on sooner would have saved those questions. What it does tell you is what a long pause usually means. By the time you are well past your usual time on a question, your odds have already fallen from about 85 in 100 to about 72 in 100.</p>
            <Pitch
              kicker="Where these answers came from"
              title="Every number on this page is from questions people answered in Step Gunner."
              body="Buzzwords, Visual Dx images, CK Gold vignettes, Next Best Step drills and LFX drills, with spaced repetition that brings the ones you miss back, and a readiness range that moves as you add each practice score. Free to download."
              primary={{ store: true, loc: 'mid', label: 'Get Step Gunner free' }}
              secondary={{ href: '/research/most-missed-step-2-ck-topics', label: 'Read: the topics people miss', onClick: () => track('cta_research_post', { surface: CAMPAIGN, target: 'most-missed-step-2-ck-topics' }) }}
            />
          </Section>

          <Section id="types" n="05" title="How long each kind of question takes">
            <p className="prs">Nobody publishes per-question timing for Step 2 practice, so here it is, from all 450,766 answers by 998 people. &ldquo;First look&rdquo; is the median the first time each person met a question.</p>
            <Figure n={3} src="/research/speed_fig3_types.svg" width={576} height={331} alt="Median seconds per question by question type, from 7.3 seconds for Dx Buzzwords to 18.3 seconds for Next Best Step, all far below the exam's 90 seconds per question" caption="Gold is the median, the bar is the middle half of answers. The dashed line is the exam's average allowance of 90 seconds per question. App questions are much shorter than exam vignettes, so these are not pacing targets." />
            <Table
              label="Median seconds per question, by question type"
              head={['question type', 'answers', 'median', 'first look', 'stem words']}
              num={[1, 2, 3, 4]}
              hl={[5]}
              minWidth={600}
              rows={[
                ['Dx Buzzwords (clue to diagnosis)', '6,733', <b key="b">7.3 s</b>, '8.5 s', '19'],
                ['Buzzwords (one-line recall)', '93,588', <b key="b">8.5 s</b>, '9.7 s', '14'],
                ['Visual Dx (image)', '11,008', <b key="b">9.7 s</b>, '12.8 s', '21'],
                ['CK Gold (vignette)', '213,725', <b key="b">16.2 s</b>, '18.8 s', '41'],
                ['NBME Practice (vignette)', '3,810', <b key="b">16.7 s</b>, '20.7 s', '77'],
                ['Next Best Step (management)', '121,711', <b key="b">18.3 s</b>, '21.1 s', '36'],
              ]}
            />
            <p className="prs">The slowest kind is the management question, Next Best Step at 18.3 seconds, slower than full CK Gold vignettes at 16.2 even though its stems are shorter (36 words against 41). Every type runs far under the exam&apos;s 90 seconds, which says more about how short these questions are than about anyone&apos;s pace. From May 2026 the exam runs in sixteen 30-minute blocks of no more than 20 questions, so 90 seconds a question is the floor of what you get on average.</p>
          </Section>

          <Section id="survive" n="06" title="What did not survive">
            <p className="prs">My first pass at this, in September, said spending three times as long goes with slightly <strong>worse</strong> accuracy: 78.1% for the fastest quarter against 75.7% for the slowest. That does not survive.</p>
            <p className="prs">101 of the 433 &ldquo;users&rdquo; in that pass were simulator installs, which are development and test runs, and it counted every install as a separate person. With those removed, installs merged into people, and the data extended to October, the gap shrinks to the 0.7 points above, with an interval that crosses zero. In the data from late August on, by itself, the correlation is -0.01. In a second log the app keeps, written separately and keyed to accounts, it is +0.08 (111 people, interval -0.12 to 0.27). Slower is not reliably worse. It is just not better.</p>
            <p className="prs">I tried every other cut I could defend: 50, 150 or 300 answers as the entry bar, dropping answers under a second or over five minutes, each half of the date range, first tries only, same-question adjustment. The correlation lands between -0.15 and +0.11 every time. <strong>None of them shows a reward for going slower that can be told apart from zero.</strong></p>
            <p className="prs">The same first pass labelled a 6.1-second deck as visual diagnosis. It was the text-only diagnosis deck. The image deck takes 9.7 seconds.</p>
          </Section>

          <Section id="limits" n="07" title="What this cannot tell you">
            <ul className="rs-ul">
              <li><strong>It is correlational in both directions.</strong> Between people, ability drives speed and accuracy together. Within a person, not knowing drives both. Neither tells you what would happen if you personally slowed down or sped up.</li>
              <li><strong>It is app timing, not exam timing.</strong> These questions are shorter than exam vignettes, and nobody is watching a block clock.</li>
              <li><strong>The sample chose itself.</strong> People who use a study app, answer 150 or more questions and stick around are not every test taker.</li>
              <li><strong>The app rewards speed.</strong> A correct answer under 5 seconds earns a small XP bonus. There is no pile-up just under the line (10,098 answers between 4.5 and 5 seconds, 10,409 between 5 and 5.5), so it does not seem to bend people&apos;s timing, but it is a thumb on the scale toward fast.</li>
            </ul>
          </Section>

          <Section id="do" n="08" title="What I would actually do" lead="This part is my judgment, not something the data proves.">
            <p className="prs"><strong>Do not make slowness a strategy.</strong> Read at the pace you read when you know the answer. Treat a long pause as information rather than as progress: once you are well past your usual time on a question, you are more likely in the 72% zone than the 85% zone. Make your best choice, mark it, and keep moving, so the time goes to questions you can still get.</p>
            <p className="prs">If you are running out of time on blocks, the fix this data points at is knowing more, not reading slower. The <Link href="/research/most-missed-step-2-ck-topics">topics people miss most</Link> are a reasonable place to start, and the <Link href="/research/dedicated-calendar">dedicated schedule post</Link> covers when to check where you stand.</p>
          </Section>

          <Section id="short" n="09" title="The short version">
            <p className="prs">The slowest quarter of 383 people took 2.6 times as long per question and got the same share right. Inside each person, the slowest answers were the least accurate ones.</p>
            <p className="prs"><strong>Going slower is not where accuracy comes from. A long pause is a symptom, not a strategy.</strong></p>
          </Section>

          <ChoicePair
            store={{ label: 'Get Step Gunner free', sub: 'vignettes, drills, spaced repetition' }}
            alt={{ href: '/readiness', label: 'Run the readiness check', sub: 'free, with exam date and percentile', onClick: () => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' }) }}
          />

          <Section id="method" n="" title="Data and method">
            <p className="prs">Every answer event the app logged from June 12 to October 20, 2026 (588,320), minus simulator installs, duplicate events and the developer&apos;s own accounts: 450,766 answers by 998 people on 7,763 questions. A person is their account where the install carried one, else the install. The headline uses the 383 people with 150 or more answers: per person, median seconds per question and share correct; quarters by median time; each person counts once; 95% intervals by resampling people. The same-question adjustment compares each answer with that question&apos;s median time and its accuracy among everyone else (questions with 11 or more answers). The within-person view times each answer against that question&apos;s median and splits each person&apos;s answers into their own fifths. The second log is the app&apos;s per-round attempt record (from August 21), read separately as an independent check. Every cell shown has at least 10 people; nobody&apos;s individual answers are published.</p>
          </Section>

          <Section id="refs" n="" title="References">
            <div className="refs"><ol>
              <li>USMLE. Step 2 CK exam format: sixteen 30-minute blocks of no more than 20 questions from May 7, 2026 (previously eight 60-minute blocks of no more than 40). usmle.org, read October 22, 2026.</li>
              <li>Step Gunner answer telemetry, June 12 to October 20, 2026, aggregated; no individual records published.</li>
            </ol></div>
          </Section>
        </ArticleBody>
      </AppShell>
    </>
  );
}
