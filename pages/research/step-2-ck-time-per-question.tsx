// Research post: does taking longer per question go with more right answers?
// From the app's own answer telemetry (GA4 card_answered via BigQuery), 383 people
// with 150+ answers and 450,766 answers in all. Fourth in the research series; the
// first built on app data rather than r/step2 score reports.
// Numbers: gunner repo analysis/answer_telemetry/telemetry.py (aggregates.json).
// Figures: gunner repo docs/blog/figures/render_telemetry.py --light.
// Draft with the full robustness table: gunner repo docs/blog/step-2-ck-time-per-question.md.
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
import { appStoreUrl, track, referrerHost } from '../../lib/analytics';

const CAMPAIGN = 'research_speed';
const PUBLISHED = '2026-10-22';
const PATH = '/research/step-2-ck-time-per-question';

function Fig({ src, alt, caption, n }: { src: string; alt: string; caption: string; n: number }) {
  return (
    <figure className="fig">
      <img src={src} alt={alt} loading="lazy" />
      <figcaption><b>Figure {n}.</b> {caption}</figcaption>
    </figure>
  );
}

export default function TimePerQuestion() {
  const store = appStoreUrl(CAMPAIGN);
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
    <LabLayout
      eyebrow="Research"
      title={title}
      lede={<>427,282 timed answers from 383 people in a Step 2 CK app. The slowest quarter took 2.6 times as long per question as the fastest and got the same share right. Inside one person&apos;s answers, the slow ones were the wrong ones.</>}
      crumb={[{ href: '/readiness', label: 'Readiness check' }, { href: PATH, label: 'Research' }]}
      metaTitle="Step 2 CK Time Per Question: Does Going Slower Help?"
      metaDesc={desc}
      campaign={CAMPAIGN}
      head={<>
        <link rel="canonical" href={`https://stepgunner.com${PATH}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </>}
    >
      <style jsx global>{`
        .prose h2 { font-size: 23px; font-weight: 800; letter-spacing: -0.4px; margin: 44px 0 12px; }
        .prose h3 { font-size: 17px; font-weight: 700; margin: 26px 0 8px; }
        .prose p { color: var(--ink-dim); font-size: 15.5px; line-height: 1.75; margin: 0 0 14px; }
        .prose p strong, .prose li strong { color: var(--ink); }
        .prose ul { margin: 0 0 16px 22px; } .prose li { color: var(--ink-dim); font-size: 15.5px; line-height: 1.7; margin-bottom: 7px; } .prose li::marker { color: var(--green); }
        .prose a { color: var(--blue); } .prose a:hover { text-decoration: underline; }
        .byline { display: flex; flex-wrap: wrap; gap: 8px 18px; font-family: var(--mono); font-size: 11px; color: var(--ink-faint); letter-spacing: 0.3px; margin: -8px 0 24px; }
        .byline b { color: var(--ink-dim); font-weight: 600; }
        .abstract { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 16px; padding: 20px 22px; margin-bottom: 18px; }
        .abstract .k { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: var(--green); margin-bottom: 8px; }
        .abstract p { font-size: 15px; margin: 0; color: var(--ink); line-height: 1.75; }
        .pitch { margin: 18px 0 8px; background: var(--ink); border-radius: 18px; padding: 22px 22px 20px; color: #ffffff; position: relative; overflow: hidden; }
        .pitch:before { content: ""; position: absolute; inset: 0; background: radial-gradient(60% 90% at 85% 0%, rgba(240,180,41,0.22), transparent 60%); }
        .pitch > * { position: relative; }
        .pitch .pk { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.55); }
        .pitch .ph { font-size: 19px; font-weight: 800; margin: 6px 0 6px; letter-spacing: -0.3px; }
        .pitch .ps { font-size: 14px; color: rgba(255,255,255,0.72); line-height: 1.6; max-width: 56ch; margin: 0 0 14px; }
        .pitch .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .pitch .btn-store { display: inline-flex; align-items: center; gap: 9px; background: var(--gold); color: #1a1403; font-weight: 800; font-size: 14px; padding: 12px 18px; border-radius: 12px; }
        .pitch .btn-store:hover { filter: brightness(1.06); }
        .pitch .btn-calc { display: inline-flex; align-items: center; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.28); color: #fff; font-weight: 700; font-size: 14px; }
        .fig { margin: 22px 0 28px; }
        .fig img { width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--hair); background: var(--bg); display: block; }
        .fig figcaption { font-size: 13px; color: var(--ink-dim); line-height: 1.6; margin-top: 10px; } .fig figcaption b { color: var(--ink); }
        .tbl { width: 100%; border-collapse: collapse; margin: 8px 0 24px; font-size: 14.5px; background: var(--bg-2); border: 1px solid var(--hair); border-radius: 12px; overflow: hidden; }
        .tbl th { text-align: left; font-family: var(--mono); font-size: 10.5px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-faint); padding: 9px 12px; border-bottom: 1px solid var(--hair-strong); background: var(--bg-3); }
        .tbl td { padding: 9px 12px; border-bottom: 1px solid var(--hair); color: var(--ink-dim); } .tbl tr:last-child td { border-bottom: 0; }
        .tbl td.n, .tbl th.n { text-align: right; font-family: var(--mono); } .tbl td.n b { color: var(--ink); }
        .tbl tr.hi td { background: rgba(240,180,41,0.07); }
        .cta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 28px 0 10px; }
        .cta a { display: block; text-align: center; padding: 16px 14px; border-radius: 12px; font-weight: 800; font-size: 14px; }
        .cta a:hover { filter: brightness(1.05); }
        .cta .pri { background: var(--ink); color: #fff; } .cta .sec { border: 1px solid var(--hair-strong); color: var(--ink); background: var(--bg-2); }
        .cta small { display: block; font-family: var(--mono); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.65; margin-top: 4px; font-weight: 600; }
        .refs li { font-size: 13.5px; }
        @media (max-width: 640px) { .tbl { font-size: 13.5px; } .cta { grid-template-columns: 1fr; } }
      `}</style>

      <div className="prose">
      <div className="byline">
        <span><b>Danny Varghese</b>, MS4, Texas A&amp;M College of Medicine</span>
        <span>Published {PUBLISHED}</span>
        <span>383 people, 427,282 answers</span>
        <span>About 7 minutes</span>
      </div>

      <div className="abstract">
        <div className="k">Summary</div>
        <p>&ldquo;Slow down and read every word&rdquo; is the pacing advice everyone repeats. Across 383 people who each answered at least 150 questions in a Step 2 CK app, the slowest quarter took a median of 27 seconds per question, 2.6 times the fastest quarter&apos;s 10, and got 76.3% right against 77.0%. The 95% interval on that gap runs from 3.1 points worse to 1.7 points better, so the most generous reading is a point or two for more than double the time. Inside one person the pattern is sharp: people got 85% of their fastest fifth of answers right and 72% of their slowest fifth. A long pause is mostly a sign of not knowing, not a way to find out. None of this shows that hurrying helps.</p>
      </div>

      <section className="pitch">
        <div className="pk">Your forms, your exam date, one projected range</div>
        <div className="ph">Find out where you actually stand, not how fast you are.</div>
        <p className="ps">The readiness check takes your NBME and UWSA scores with the dates you sat them and gives you a projected range instead of one fake precise number. Free, no account needed for the web version.</p>
        <div className="row">
          <Link href="/readiness" className="btn-store" onClick={() => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' })}>Run the readiness check</Link>
          <a href={store} className="btn-calc" onClick={() => track('store_click', { source: CAMPAIGN, location: 'pitch_top', ref: referrerHost() })}>Get the app free</a>
        </div>
      </section>

      <h2>1. The advice everyone gives</h2>
      <p>Every thread about running out of time on Step 2 ends with the same advice: slow down, read every word, the answer is in the stem. I have given that advice myself. It sounds like it has to be true, because the alternative, that careful readers do no better, sounds absurd.</p>
      <p>The problem with testing it belongs up front, not in a footnote. Stronger students are faster and more accurate at the same time, because knowing the answer is what makes you fast. So the people who take longest are, on average, people who know less, and any comparison of fast and slow people is tangled up with ability. This data cannot show that hurrying helps, and I am not going to claim it does. What it can do is look for the reward the advice promises. If reading slowly bought accuracy, the slow readers should be the accurate ones. <strong>They are not.</strong></p>
      <p>Who this is, before any more numbers: 383 people who answered at least 150 questions in Step Gunner, a Step 2 CK app, between June 12 and October 20, 2026, with test and developer accounts removed. They chose to download a study app, which already makes them different from the average test taker. The time is measured in the app, from the options appearing to the tap, not on the exam. App questions are short (a CK Gold vignette has a median of 41 words), and the exam allows about 90 seconds a question. Read this as a test of whether extra time buys accuracy on practice questions, not as an exam pacing study.</p>

      <h2>2. Fastest to slowest</h2>
      <Fig n={1} src="/research/speed_fig1_deciles.svg" alt="Mean accuracy for ten groups of about 38 people each, ordered by their median seconds per question from about 8 to 33 seconds; every group sits between 75 and 78 percent" caption="383 people in ten groups of about 38, ordered by their median time per question. Accuracy stays between 75% and 78% from 8 seconds to 33 seconds. The bars are 95% intervals." />

      <table className="tbl">
        <thead><tr><th>speed quarter</th><th className="n">people</th><th className="n">median per question</th><th className="n">right</th><th className="n">95% interval</th></tr></thead>
        <tbody>
          <tr className="hi"><td>fastest</td><td className="n">96</td><td className="n">10.2 s</td><td className="n"><b>77.0%</b></td><td className="n">75.3 to 78.6</td></tr>
          <tr><td>second</td><td className="n">96</td><td className="n">14.9 s</td><td className="n"><b>77.1%</b></td><td className="n">75.5 to 78.5</td></tr>
          <tr><td>third</td><td className="n">96</td><td className="n">19.6 s</td><td className="n"><b>75.4%</b></td><td className="n">73.6 to 77.3</td></tr>
          <tr className="hi"><td>slowest</td><td className="n">95</td><td className="n">27.0 s</td><td className="n"><b>76.3%</b></td><td className="n">74.5 to 78.1</td></tr>
        </tbody>
      </table>

      <p>The slowest quarter spent about 17 more seconds on every question and got <strong>0.7 points fewer</strong> right, with an interval from 3.1 points fewer to 1.7 points more. Put plainly, about 76 or 77 of every 100 questions right, whichever end you are on. Across everyone, the correlation between time per question and accuracy is <strong>-0.12</strong> (interval -0.26 to 0.01): close to nothing, and if anything leaning the wrong way for the advice.</p>

      <h2>3. Same questions, same answer</h2>
      <p>The obvious objection is that slow people might be doing harder questions. A CK Gold vignette takes longer than a one-line Buzzword, so a slow person could simply be someone who studies vignettes. So I compared every answer with how that same question usually goes: its usual time, and how often everyone else gets it right. The relationship stays flat (r = -0.07, interval -0.19 to 0.04).</p>
      <p>The app brings missed questions back, and a repeat is fast and usually right, which could flatter the fast. Counting only the first time each person met each question: flat again (r = -0.10, interval -0.24 to 0.03, 359 people).</p>
      <p>And on CK Gold vignettes alone, where careful reading ought to matter most, the slower readers did slightly <strong>worse</strong>: 75.3% for the fastest quarter at 11.5 seconds, 73.1% for the slowest at 29 seconds (303 people with 100 or more vignettes, r = -0.15, interval -0.31 to just below zero).</p>

      <h2>4. Inside one person, the slow answers are the wrong ones</h2>
      <Fig n={2} src="/research/speed_fig2_within.svg" alt="Accuracy by each person's own speed fifth, falling from about 85 percent on their fastest answers to about 72 percent on their slowest, in every deck" caption="Each person compared only with themselves. An answer counts as slow when it took longer than that question usually takes. The fastest fifth of a person's answers were 85% right, the slowest fifth 72%, and the shape is the same in CK Gold, Next Best Step and Buzzwords." />
      <p>The comparison between people is confounded by ability, so take ability out: compare each person only with themselves. For every answer I asked whether it took that person longer or shorter than the question usually takes, then split each person&apos;s answers into fifths.</p>
      <p>Their fastest fifth: <strong>85% right</strong>. Their slowest fifth: <strong>72% right</strong>. Same shape in every deck, from one-line Buzzwords to full vignettes, across about 85,000 answers per fifth.</p>
      <p>This is confounded too, the other way round: you are slow because you do not know, so it cannot tell you that moving on sooner would have saved those questions. What it does tell you is what a long pause usually means. By the time you are well past your usual time on a question, your odds have already fallen from about 85 in 100 to about 72 in 100.</p>

      <section className="pitch">
        <div className="pk">Where these answers came from</div>
        <div className="ph">Every number on this page is from questions people answered in Step Gunner.</div>
        <p className="ps">Buzzwords, Visual Dx images, CK Gold vignettes, Next Best Step drills and LFX drills, with spaced repetition that brings the ones you miss back, and a readiness range that moves as you add each practice score. Free to download.</p>
        <div className="row">
          <a href={store} className="btn-store" onClick={() => track('store_click', { source: CAMPAIGN, location: 'pitch_mid', ref: referrerHost() })}>Get Step Gunner free</a>
          <Link href="/research/most-missed-step-2-ck-topics" className="btn-calc" onClick={() => track('cta_research_post', { surface: CAMPAIGN, target: 'most-missed-step-2-ck-topics' })}>Read: the topics people miss</Link>
        </div>
      </section>

      <h2>5. How long each kind of question takes</h2>
      <p>Nobody publishes per-question timing for Step 2 practice, so here it is, from all 450,766 answers by 998 people. &ldquo;First look&rdquo; is the median the first time each person met a question.</p>
      <Fig n={3} src="/research/speed_fig3_types.svg" alt="Median seconds per question by question type, from 7.3 seconds for Dx Buzzwords to 18.3 seconds for Next Best Step, all far below the exam's 90 seconds per question" caption="Gold is the median, the bar is the middle half of answers. The dashed line is the exam's average allowance of 90 seconds per question. App questions are much shorter than exam vignettes, so these are not pacing targets." />
      <table className="tbl">
        <thead><tr><th>question type</th><th className="n">answers</th><th className="n">median</th><th className="n">first look</th><th className="n">stem words</th></tr></thead>
        <tbody>
          <tr><td>Dx Buzzwords (clue to diagnosis)</td><td className="n">6,733</td><td className="n"><b>7.3 s</b></td><td className="n">8.5 s</td><td className="n">19</td></tr>
          <tr><td>Buzzwords (one-line recall)</td><td className="n">93,588</td><td className="n"><b>8.5 s</b></td><td className="n">9.7 s</td><td className="n">14</td></tr>
          <tr><td>Visual Dx (image)</td><td className="n">11,008</td><td className="n"><b>9.7 s</b></td><td className="n">12.8 s</td><td className="n">21</td></tr>
          <tr><td>CK Gold (vignette)</td><td className="n">213,725</td><td className="n"><b>16.2 s</b></td><td className="n">18.8 s</td><td className="n">41</td></tr>
          <tr><td>NBME Practice (vignette)</td><td className="n">3,810</td><td className="n"><b>16.7 s</b></td><td className="n">20.7 s</td><td className="n">77</td></tr>
          <tr className="hi"><td>Next Best Step (management)</td><td className="n">121,711</td><td className="n"><b>18.3 s</b></td><td className="n">21.1 s</td><td className="n">36</td></tr>
        </tbody>
      </table>
      <p>The slowest kind is the management question, Next Best Step at 18.3 seconds, slower than full CK Gold vignettes at 16.2 even though its stems are shorter (36 words against 41). Every type runs far under the exam&apos;s 90 seconds, which says more about how short these questions are than about anyone&apos;s pace. From May 2026 the exam runs in sixteen 30-minute blocks of no more than 20 questions, so 90 seconds a question is the floor of what you get on average.</p>

      <h2>6. What did not survive</h2>
      <p>My first pass at this, in September, said spending three times as long goes with slightly <strong>worse</strong> accuracy: 78.1% for the fastest quarter against 75.7% for the slowest. That does not survive.</p>
      <p>101 of the 433 &ldquo;users&rdquo; in that pass were simulator installs, which are development and test runs, and it counted every install as a separate person. With those removed, installs merged into people, and the data extended to October, the gap shrinks to the 0.7 points above, with an interval that crosses zero. In the data from late August on, by itself, the correlation is -0.01. In a second log the app keeps, written separately and keyed to accounts, it is +0.08 (111 people, interval -0.12 to 0.27). Slower is not reliably worse. It is just not better.</p>
      <p>I tried every other cut I could defend: 50, 150 or 300 answers as the entry bar, dropping answers under a second or over five minutes, each half of the date range, first tries only, same-question adjustment. The correlation lands between -0.15 and +0.11 every time. <strong>None of them shows a reward for going slower that can be told apart from zero.</strong></p>
      <p>The same first pass labelled a 6.1-second deck as visual diagnosis. It was the text-only diagnosis deck. The image deck takes 9.7 seconds.</p>

      <h2>7. What this cannot tell you</h2>
      <ul>
        <li><strong>It is correlational in both directions.</strong> Between people, ability drives speed and accuracy together. Within a person, not knowing drives both. Neither tells you what would happen if you personally slowed down or sped up.</li>
        <li><strong>It is app timing, not exam timing.</strong> These questions are shorter than exam vignettes, and nobody is watching a block clock.</li>
        <li><strong>The sample chose itself.</strong> People who use a study app, answer 150 or more questions and stick around are not every test taker.</li>
        <li><strong>The app rewards speed.</strong> A correct answer under 5 seconds earns a small XP bonus. There is no pile-up just under the line (10,098 answers between 4.5 and 5 seconds, 10,409 between 5 and 5.5), so it does not seem to bend people&apos;s timing, but it is a thumb on the scale toward fast.</li>
      </ul>

      <h2>8. What I would actually do</h2>
      <p>This part is my judgment, not something the data proves.</p>
      <p><strong>Do not make slowness a strategy.</strong> Read at the pace you read when you know the answer. Treat a long pause as information rather than as progress: once you are well past your usual time on a question, you are more likely in the 72% zone than the 85% zone. Make your best choice, mark it, and keep moving, so the time goes to questions you can still get.</p>
      <p>If you are running out of time on blocks, the fix this data points at is knowing more, not reading slower. The <Link href="/research/most-missed-step-2-ck-topics">topics people miss most</Link> are a reasonable place to start, and the <Link href="/research/dedicated-calendar">dedicated schedule post</Link> covers when to check where you stand.</p>

      <h2>9. The short version</h2>
      <p>The slowest quarter of 383 people took 2.6 times as long per question and got the same share right. Inside each person, the slowest answers were the least accurate ones.</p>
      <p><strong>Going slower is not where accuracy comes from. A long pause is a symptom, not a strategy.</strong></p>

      <div className="cta">
        <a className="pri" href={store} onClick={() => track('store_click', { source: CAMPAIGN, location: 'cta_bottom', ref: referrerHost() })}>Get Step Gunner free<small>vignettes, drills, spaced repetition</small></a>
        <Link className="sec" href="/readiness" onClick={() => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' })}>Run the readiness check<small>free, with exam date and percentile</small></Link>
      </div>

      <h2>Data and method</h2>
      <p>Every answer event the app logged from June 12 to October 20, 2026 (588,320), minus simulator installs, duplicate events and the developer&apos;s own accounts: 450,766 answers by 998 people on 7,763 questions. A person is their account where the install carried one, else the install. The headline uses the 383 people with 150 or more answers: per person, median seconds per question and share correct; quarters by median time; each person counts once; 95% intervals by resampling people. The same-question adjustment compares each answer with that question&apos;s median time and its accuracy among everyone else (questions with 11 or more answers). The within-person view times each answer against that question&apos;s median and splits each person&apos;s answers into their own fifths. The second log is the app&apos;s per-round attempt record (from August 21), read separately as an independent check. Every cell shown has at least 10 people; nobody&apos;s individual answers are published.</p>

      <h2>References</h2>
      <ul className="refs">
        <li>USMLE. Step 2 CK exam format: sixteen 30-minute blocks of no more than 20 questions from May 7, 2026 (previously eight 60-minute blocks of no more than 40). usmle.org, read October 22, 2026.</li>
        <li>Step Gunner answer telemetry, June 12 to October 20, 2026, aggregated; no individual records published.</li>
      </ul>
      </div>
    </LabLayout>
  );
}
