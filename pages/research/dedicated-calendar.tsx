// Research post: when 269 r/step2 students actually sat each practice form.
// Third in the series after nbme-to-step-2 and free-120-to-step-2, same dataset
// and same limitations. This one fills the site's largest content gap: there was
// no dedicated-period planning content at all.
// Figures render from the gunner repo (docs/blog/figures/render_calendar.py).
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
import { appStoreUrl, track, referrerHost } from '../../lib/analytics';

const CAMPAIGN = 'research_dedicated_calendar';
const PUBLISHED = '2026-09-19';

function Fig({ src, alt, caption, n }: { src: string; alt: string; caption: string; n: number }) {
  return (
    <figure className="fig">
      <img src={src} alt={alt} loading="lazy" />
      <figcaption><b>Figure {n}.</b> {caption}</figcaption>
    </figure>
  );
}

export default function DedicatedCalendar() {
  const store = appStoreUrl(CAMPAIGN);
  const title = 'Nobody tells you when to take each NBME. Here is when 269 people actually did.';
  const desc = 'The dedicated-period form schedule reconstructed from 269 real score reports: the median day each NBME and UWSA gets sat, how many forms people take, and what more time is worth.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: title,
    description: desc,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    author: { '@type': 'Person', name: 'Danny Varghese', description: 'MS4, Texas A&M College of Medicine', url: 'https://stepgunner.com' },
    publisher: { '@type': 'Organization', name: 'Step Gunner', url: 'https://stepgunner.com' },
    mainEntityOfPage: 'https://stepgunner.com/research/dedicated-calendar',
    about: ['USMLE Step 2 CK', 'dedicated study period', 'NBME self-assessment', 'study schedule'],
  };

  return (
    <LabLayout
      eyebrow="Research"
      title="The dedicated schedule nobody wrote down"
      lede={<>269 students, 3,737 practice scores, and the form calendar almost all of them converged on without being told. When each NBME actually gets sat, how many people take, and what another week is worth.</>}
      crumb={[{ href: '/readiness', label: 'Readiness check' }, { href: '/research/dedicated-calendar', label: 'Research' }]}
      metaTitle="Step 2 CK Dedicated Schedule: When to Take Each NBME, from 269 Real Reports"
      metaDesc={desc}
      campaign={CAMPAIGN}
      head={<>
        <link rel="canonical" href="https://stepgunner.com/research/dedicated-calendar" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </>}
    >
      <style jsx global>{`
        .prose h2 { font-size: 23px; font-weight: 800; letter-spacing: -0.4px; margin: 44px 0 12px; }
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
        @media (max-width: 640px) { .tbl { font-size: 13.5px; } .cta { grid-template-columns: 1fr; } }
      `}</style>

      <div className="prose">
      <div className="byline">
        <span><b>Danny Varghese</b>, MS4, Texas A&amp;M College of Medicine</span>
        <span>Published {PUBLISHED}</span>
        <span>269 students, 199 with dates</span>
        <span>About 7 minutes</span>
      </div>

      <div className="abstract">
        <div className="k">Summary</div>
        <p>There is no official schedule for dedicated, and there turns out to be a real one anyway. Across 269 r/step2 score reports, the median day each form gets sat runs perfectly in order: NBME 9 at 56 days out, NBME 13 at 21, NBME 15 and UWSA 2 at 10, NBME 16 at 6, and the Free 120 at 3. Nobody coordinated that. The median student sits seven forms across about six weeks, finishing a week before the exam, and improves at 1.73 points per week while doing it. The two places the crowd's instinct costs them are at the end, where the most informative forms arrive too late to act on.</p>
      </div>

      <section className="pitch">
        <div className="pk">Your dates, against this calendar</div>
        <div className="ph">Put your exam date in and see where you actually are.</div>
        <p className="ps">The readiness check takes your forms with the dates you sat them, applies the per-form corrections from this research, and gives you a projected range instead of one fake precise number. Free, no account needed.</p>
        <div className="row">
          <Link href="/readiness" className="btn-store" onClick={() => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' })}>Run the readiness check</Link>
          <a href={store} className="btn-calc" onClick={() => track('store_click', { source: CAMPAIGN, location: 'pitch_top', ref: referrerHost() })}>Get the app free</a>
        </div>
      </section>

      <h2>1. The schedule nobody wrote down</h2>
      <p>There is no official plan for dedicated. There is a stack of practice forms, an exam date, and a group chat where somebody confidently says to take NBME 9 first because it is the hardest. I planned mine that way.</p>
      <p>So I went back to the 269 score reports and asked a different question from <Link href="/research/nbme-to-step-2">last time</Link>. Not what the forms predict, but when people sit them.</p>

      <Fig n={1} src="/research/cal_fig1_schedule.svg" alt="Median days before the exam that each NBME, UWSA and the Free 120 is sat, with the interquartile range for each" caption="Gold dot is the median day; the bar is the middle half of students. Time runs right to left toward exam day." />

      <table className="tbl">
        <thead><tr><th>form</th><th className="n">students</th><th className="n">median days out</th><th className="n">middle half</th></tr></thead>
        <tbody>
          <tr><td>NBME 9</td><td className="n">88</td><td className="n"><b>56</b></td><td className="n">35 to 95</td></tr>
          <tr><td>NBME 10</td><td className="n">140</td><td className="n"><b>45</b></td><td className="n">28 to 72</td></tr>
          <tr><td>UWSA 1</td><td className="n">75</td><td className="n"><b>37</b></td><td className="n">24 to 60</td></tr>
          <tr><td>NBME 11</td><td className="n">152</td><td className="n"><b>35</b></td><td className="n">23 to 57</td></tr>
          <tr><td>NBME 12</td><td className="n">137</td><td className="n"><b>25</b></td><td className="n">18 to 42</td></tr>
          <tr><td>NBME 13</td><td className="n">162</td><td className="n"><b>21</b></td><td className="n">14 to 31</td></tr>
          <tr><td>UWSA 3</td><td className="n">25</td><td className="n"><b>21</b></td><td className="n">9 to 30</td></tr>
          <tr><td>NBME 14</td><td className="n">165</td><td className="n"><b>15</b></td><td className="n">10 to 24</td></tr>
          <tr><td>NBME 15</td><td className="n">165</td><td className="n"><b>10</b></td><td className="n">7 to 16</td></tr>
          <tr><td>UWSA 2</td><td className="n">104</td><td className="n"><b>10</b></td><td className="n">7 to 22</td></tr>
          <tr><td>NBME 16</td><td className="n">47</td><td className="n"><b>6</b></td><td className="n">4 to 7</td></tr>
          <tr className="hi"><td>Free 120</td><td className="n">171</td><td className="n"><b>3</b></td><td className="n">2 to 4</td></tr>
        </tbody>
      </table>

      <p>Read that column again. It is in order. Perfectly in order, from NBME 9 at eight weeks out down to the Free 120 at three days, and nobody coordinated it.</p>
      <p>What happened is that everyone independently decided the newest forms are the most representative and should go last, closest to the real thing, where they work as a final read. NBME 9 is the oldest so it goes first, when a bad number does the least damage. It is a sensible instinct and the whole population had it.</p>
      <p>The one that surprised me is UWSA 2 at ten days out, level with NBME 15. People save it because it has a reputation as the hardest, and in the <Link href="/research/nbme-to-step-2">NBME analysis</Link> it turned out to print about five points <strong>high</strong> rather than low. A lot of people are sitting an inflated form at the exact moment they are most likely to believe it.</p>

      <h2>2. How long the whole thing runs</h2>
      <ul>
        <li>The first dated form goes <strong>47 days</strong> before the exam, middle half 30 to 86.</li>
        <li>The last one goes <strong>7 days</strong> before, middle half 5 to 10.</li>
        <li>First form to last spans <strong>40 days</strong>, middle half 25 to 78.</li>
        <li><strong>64%</strong> sit a form inside the final week. Only <strong>10%</strong> sit one in the final three days.</li>
      </ul>
      <p>So the shape of a dedicated period as actually lived is about six weeks of forms, the last one roughly a week out, then a quiet stretch. That last part is worth noticing. The final week is mostly not for testing. It is for the Free 120 and for stopping.</p>

      <h2>3. How many forms</h2>
      <Fig n={2} src="/research/cal_fig2_howmany.svg" alt="Distribution of how many NBME and UWSA forms each student took" caption="Median seven, middle half five to eight, maximum eleven. Only 4% took a single form." />
      <p>The median student sits <strong>seven</strong> NBME or UWSA forms, middle half five to eight, most anyone took eleven. Only <strong>4%</strong> took one.</p>
      <p>That 4% matters more than it looks, because it is the group whose number you should trust least. Running the predictor across the whole set, students with a single form on file miss their real score by <strong>10.9 points</strong> on average. Students with several miss by about five. The buckets in between hold nine to thirteen students each, so I am not going to pretend there is a clean curve. The only claim the data supports is that one is not enough, and it supports that clearly.</p>
      <p>If you have taken exactly one form and you are making decisions off it, you are working from the noisiest possible version of your own ability.</p>

      <h2>4. What the calendar converts into</h2>
      <p>A schedule is only useful if it tells you what moving it buys. From the same set, 178 students with three or more dated forms improved at a median of <strong>1.73 points per week</strong>. The fast quarter managed 3.5, the slow quarter 0.8, and 91% improved at all.</p>
      <table className="tbl">
        <thead><tr><th>more time</th><th className="n">what the median student gains</th></tr></thead>
        <tbody>
          <tr><td>one more week</td><td className="n"><b>about 2 points</b></td></tr>
          <tr><td>two more weeks</td><td className="n"><b>about 3 points</b></td></tr>
          <tr><td>four more weeks</td><td className="n"><b>about 7 points</b></td></tr>
        </tbody>
      </table>
      <p>That is the number to hold against whatever a delay costs you. Some people should absolutely push. What the data kills is the specific fantasy that two more weeks turns a 245 into a 260.</p>

      <section className="pitch">
        <div className="pk">The part between the forms</div>
        <div className="ph">Six weeks is a long time to study without a system.</div>
        <p className="ps">Step Gunner is built for the days between practice tests: a daily case, spaced repetition that brings your misses back until they stick, and a readiness range that moves as you add each score. Free to start.</p>
        <div className="row">
          <a href={store} className="btn-store" onClick={() => track('store_click', { source: CAMPAIGN, location: 'pitch_mid', ref: referrerHost() })}>Get Step Gunner free</a>
          <Link href="/research/free-120-to-step-2" className="btn-calc" onClick={() => track('cta_free120_post', { surface: CAMPAIGN })}>Read the Free 120 post</Link>
        </div>
      </section>

      <h2>5. What I would actually do with this</h2>
      <p><strong>Do not save the newest forms for last just because they are newest.</strong> The population does, and the logic is sound, but it means most people arrive at the final fortnight holding their most informative reads with no time left to act on any of them. Consider moving one of NBME 14 or 15 earlier, into the three to four week window, where a bad result is still a problem you can work on.</p>
      <p><strong>Take the Free 120 early.</strong> Same argument in its strongest form, and it has <Link href="/research/free-120-to-step-2">its own post</Link>. The median student sits it three days out, where it can only be a mood.</p>
      <p><strong>Do not take one form and plan around it.</strong> Two is a different object from one.</p>
      <p><strong>Expect a quiet last week.</strong> Two thirds sit something in the final seven days, but only one in ten sits anything in the final three. The end of dedicated is not more testing.</p>

      <h2>6. What this cannot tell you</h2>
      <ul>
        <li><strong>It is descriptive, not prescriptive.</strong> This is what a self-selected group of high scorers did. It is not evidence the order caused the scores, and I have not tried to test that, because with this data I could not separate the schedule from the person following it.</li>
        <li><strong>Dates come from what people reported.</strong> Not every post carried them. Rows run from 25 students on UWSA 3 to 165 on NBME 14 and 15, and the n is on every row so you can weight them yourself. I would not plan around the UWSA 3 line.</li>
        <li><strong>The sample posts.</strong> Mean real score 258 against a national mean near 251, lowest in the set a 216. If you are aiming below that range the timing probably transfers but the score levels do not.</li>
      </ul>

      <h2>7. The short version</h2>
      <p>There is a schedule. NBME 9 at eight weeks, the 10s and 11s through the second month, the 13s and 14s in the last three weeks, NBME 15 and UWSA 2 at ten days, NBME 16 at six, the Free 120 at three. Seven forms, about six weeks, last one a week out.</p>
      <p>Almost everyone converges on it without being told, which is decent evidence it is sane.</p>
      <p><strong>The two places I would deviate are where the crowd's instinct costs them information at the moment they can still use it: pull one recent form earlier, and pull the Free 120 much earlier.</strong></p>

      <div className="cta">
        <a className="pri" href={store} onClick={() => track('store_click', { source: CAMPAIGN, location: 'cta_bottom', ref: referrerHost() })}>Get Step Gunner free<small>daily case, spaced repetition, readiness range</small></a>
        <Link className="sec" href="/readiness" onClick={() => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' })}>Run the readiness check<small>free, with exam date and percentile</small></Link>
      </div>

      <h2>Data and method</h2>
      <p>Score-report posts from r/step2, parsed into one row per assessment with usernames dropped at ingest. 269 students, 3,737 assessments; 239 have a real Step 2 score and at least one three-digit practice form, and 199 reported dates for at least one form. Form rows show the median days before the exam among students who dated that form. Prediction error by form count uses the same shrinkage-linear model as the <Link href="/readiness/methodology">predictor</Link>. Improvement rate is a within-student regression of offset-corrected form score against date, for the 178 students with three or more dated forms. Figures rebuild from the source data rather than being stored.</p>
      </div>
    </LabLayout>
  );
}
