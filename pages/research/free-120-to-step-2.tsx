// Research post: what a Free 120 percentage converts to, from 215 r/step2 score
// reports that carried both a current-form percentage and a real Step 2 score.
// Companion to nbme-to-step-2, same dataset and same limitations; that post kept
// Free 120 percentages out of the model, so this is the piece that uses them.
// Figures render from the gunner repo (docs/blog/figures/render_free120.py).
// No em or en dashes anywhere in the copy (site rule).
import Link from 'next/link';
import LabLayout from '../../components/LabLayout';
import { appStoreUrl, track, referrerHost } from '../../lib/analytics';

const CAMPAIGN = 'research_free120';
const PUBLISHED = '2026-09-15';

function Fig({ src, alt, caption, n }: { src: string; alt: string; caption: string; n: number }) {
  return (
    <figure className="fig">
      <img src={src} alt={alt} loading="lazy" />
      <figcaption><b>Figure {n}.</b> {caption}</figcaption>
    </figure>
  );
}

export default function FreeOneTwenty() {
  const store = appStoreUrl(CAMPAIGN);
  const title = 'The Free 120 predicts better than its reputation. Almost nobody takes it in time to use it.';
  const desc = 'A Free 120 to Step 2 CK conversion table from 215 real score reports, plus how it compares with NBME and UWSA forms as a predictor, and the timing problem that wastes it.';
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
    <LabLayout
      eyebrow="Research"
      title="What a Free 120 percentage is actually worth"
      lede={<>215 students who posted a current-form Free 120 percentage and then a real Step 2 score. The conversion table nobody publishes, and the reason most people get nothing out of it.</>}
      crumb={[{ href: '/free120', label: 'Free 120' }, { href: '/research/free-120-to-step-2', label: 'Research' }]}
      metaTitle="Free 120 to Step 2 CK Score: Conversion Table from 215 Real Reports"
      metaDesc={desc}
      campaign={CAMPAIGN}
      head={<>
        <link rel="canonical" href="https://stepgunner.com/research/free-120-to-step-2" />
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
        .pitch .ptrust { font-family: var(--mono); font-size: 10.5px; color: rgba(255,255,255,0.5); margin-top: 12px; }
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
        <span>215 students, current form</span>
        <span>About 7 minutes</span>
      </div>

      <div className="abstract">
        <div className="k">Summary</div>
        <p>The Free 120 is treated as a vibe check. It is not. Across 215 r/step2 score reports carrying a current-form percentage and a real Step 2 score, the correlation is 0.55, and scored leave-one-out it misses the real score by 5.9 points on its own against 5.2 for a whole recency-weighted stack of paid NBME and UWSA forms. Added to those forms it improves them, 5.2 to 5.0, so it is carrying information they do not. The problem is when people sit it: the median student takes it three days before the exam and 91% take it inside the final week, which is the one moment the number cannot change anything.</p>
      </div>

      <section className="pitch">
        <div className="pk">Your forms, your Free 120, one projected range</div>
        <div className="ph">Find out where you actually stand while there is still time to move it.</div>
        <p className="ps">The readiness check takes your NBME and UWSA scores with the dates you sat them, applies the per-form corrections from this research, and gives you a range instead of one fake precise number. Free, no account needed for the web version.</p>
        <div className="row">
          <Link href="/readiness" className="btn-store" onClick={() => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' })}>Run the readiness check</Link>
          <a href={store} className="btn-calc" onClick={() => track('store_click', { source: CAMPAIGN, location: 'pitch_top', ref: referrerHost() })}>Get the app free</a>
        </div>
        <div className="ptrust">The same model publishes its out-of-sample misses every Monday on the <Link href="/research/nbme-to-step-2" style={{ color: 'rgba(255,255,255,0.72)' }}>research page</Link>.</div>
      </section>

      <h2>1. The table nobody publishes</h2>
      <p>Every thread about the Free 120 ends the same way: it is not predictive, do not read into it. Nobody checks, because checking needs a set of people who posted a percentage and then came back with a real score. That set exists on r/step2, so I parsed it. 269 students, 3,737 practice scores, and 215 of them with a current-form Free 120 percentage plus a real three-digit result.</p>
      <p>Median real Step 2 score, by Free 120 band:</p>

      <Fig n={1} src="/research/f120_fig2_bands.svg" alt="Median real Step 2 score by Free 120 band, with the interquartile range of each band" caption="Gold dot is the median; the bar is the middle half of students in that band. The spread is the point: a band tells you the centre, not your score." />

      <table className="tbl">
        <thead><tr><th>Free 120, current form</th><th className="n">students</th><th className="n">median real Step 2</th><th className="n">middle half</th></tr></thead>
        <tbody>
          <tr><td>65 to 69%</td><td className="n">12</td><td className="n"><b>247</b></td><td className="n">242 to 251</td></tr>
          <tr><td>70 to 74%</td><td className="n">31</td><td className="n"><b>250</b></td><td className="n">246 to 258</td></tr>
          <tr className="hi"><td>75 to 79%</td><td className="n">68</td><td className="n"><b>256</b></td><td className="n">252 to 261</td></tr>
          <tr><td>80 to 84%</td><td className="n">50</td><td className="n"><b>261</b></td><td className="n">255 to 267</td></tr>
          <tr><td>85% and up</td><td className="n">48</td><td className="n"><b>270</b></td><td className="n">265 to 273</td></tr>
        </tbody>
      </table>

      <p>Six students scored under 65% with a median of 250, which I am not going to band, because six students is not a band. If you are under 65 with a week left, the honest answer is that I do not have enough people like you to tell you anything.</p>
      <p><strong>Read the fourth column, not the third.</strong> A 78% has a median of 256, and the middle half of students at that band landed between 252 and 261. The full range at that band ran from 241 to 272. The median is a real signal and the spread around it is thirty points wide, and both things are true at once.</p>

      <h2>2. It is not a vibe check</h2>
      <Fig n={2} src="/research/f120_fig1_scatter.svg" alt="Scatter of Free 120 percent correct against actual Step 2 CK score for 215 students, with the fitted line" caption="215 students. The correlation is 0.55, which is not what a test with no signal looks like." />
      <p>I ran every single-number rule I could build against the 205 students who had both a Free 120 and at least one NBME or UWSA, scoring each one leave-one-out so nothing gets graded on its own fit:</p>

      <table className="tbl">
        <thead><tr><th>single-number rule</th><th className="n">mean miss against the real score</th></tr></thead>
        <tbody>
          <tr className="hi"><td>Free 120 percentage alone</td><td className="n"><b>5.9 points</b></td></tr>
          <tr><td>Best NBME or UWSA form</td><td className="n">5.4</td></tr>
          <tr><td>Plain average of every form</td><td className="n">5.3</td></tr>
          <tr><td>Recency-weighted NBME/UWSA average</td><td className="n">5.2</td></tr>
          <tr className="hi"><td>Forms and the Free 120 together</td><td className="n"><b>5.0</b></td></tr>
        </tbody>
      </table>

      <p>One free 120-question exam, taken in an afternoon, gets you within 5.9 points. A full set of paid NBMEs gets you to 5.2. That gap is smaller than most people would guess.</p>
      <p>The bottom row is the part I did not expect. Adding the Free 120 on top of the forms improves the prediction, 5.2 to 5.0. It is not re-measuring what the NBMEs already told you. It carries something of its own, which makes sense once you say it out loud: it is the only practice material written by the organisation that writes the real exam.</p>

      <h2>3. The part that ruins it</h2>
      <Fig n={3} src="/research/f120_fig3_timing.svg" alt="Histogram of how many days before the exam students sat the Free 120" caption="Median three days. 91% of students sat it inside the final week." />
      <p>The median student sat the Free 120 <strong>three days</strong> before their exam. Ninety one percent sat it inside the final week. The middle half sat it between two and four days out.</p>
      <p>So here is the situation almost everyone creates. You take the one piece of material written by the actual exam writers, it turns out to be roughly as informative as your entire paid practice stack, and you take it at the single moment in the whole timeline when you can do nothing about what it tells you.</p>
      <p>If it comes back at 85 you feel good for three days, which is pleasant and changes nothing. If it comes back at 68 you spend the last seventy two hours before the most important exam of your life in a panic, which is worse than pleasant and also changes nothing, because there is no version of the next three days that moves you fifteen points.</p>
      <p>I did this too. I sat mine four days out, and I remember treating it as a temperature check rather than as information, because by then that was the only thing it could be.</p>

      <h2>4. What I would actually do</h2>
      <p><strong>Take it twice.</strong> Once around three to four weeks out, when the number can still change what you do, and once in the last week if you want the familiarity of the interface.</p>
      <p>The first sitting is the one that earns its keep. A 71% with a month left is a different object from a 71% with three days left: it is still a problem you can work on. The timing evidence from the <Link href="/research/nbme-to-step-2">NBME analysis</Link> applies here too, so an early Free 120 should be weighted like any other early form rather than treated as a verdict.</p>
      <p>The second sitting is for the interface, the lab value pop-ups and the pacing, and you should expect it to read a little high because you have seen the questions.</p>
      <p>The obvious objection is that there is only one current form, so taking it early spends it. That is real. My answer is that a number you can act on is worth more than a number you cannot, and the second sitting still gives you the interface even if it no longer gives you a clean score.</p>

      <section className="pitch">
        <div className="pk">While the number can still move</div>
        <div className="ph">Three to four weeks out is the window this article is really about.</div>
        <p className="ps">Step Gunner is built for the part that happens between practice forms: a daily case, spaced repetition that brings your misses back until they stick, and a readiness range that updates as you add each score. Free to start.</p>
        <div className="row">
          <a href={store} className="btn-store" onClick={() => track('store_click', { source: CAMPAIGN, location: 'pitch_mid', ref: referrerHost() })}>Get Step Gunner free</a>
          <Link href="/free120" className="btn-calc" onClick={() => track('cta_free120', { surface: CAMPAIGN, location: 'pitch_mid' })}>Sit the Free 120 timed</Link>
        </div>
      </section>

      <h2>5. What this cannot tell you</h2>
      <ul>
        <li><strong>The sample posts.</strong> Mean real score 258 against a national mean near 251, and the lowest real score in the whole dataset is a 216. The low bands especially are built on students who recovered, because students who did not are less likely to write the thread.</li>
        <li><strong>The edges are thin.</strong> Twelve students at 65 to 69 and six under 65. I would not plan anything around the bottom two rows.</li>
        <li><strong>Current form only.</strong> Older Free 120 versions are a different instrument and mixing them would misdescribe what the table shows.</li>
        <li><strong>Correlation is not a promise.</strong> A 0.55 correlation explains about 30% of the variance in real scores. Most of what decides your number is not in this table.</li>
      </ul>

      <h2>6. One thing I got wrong</h2>
      <p>My first pass put the correlation at 0.32, and I nearly published a piece arguing that the Free 120 is weakly informative and should be held loosely.</p>
      <p>Then I looked at the distribution and found a record with a Free 120 of <strong>220%</strong>, which cannot exist on a 120-question exam. It was a parsing failure. That single bad row was dragging the correlation from 0.55 down to 0.32 on its own, and it would have flipped the entire conclusion.</p>
      <p>I dropped it because 220% is impossible, not because it disagreed with me, and that distinction matters. Dropping points that disagree with your thesis is how you manufacture a result. So I also re-ran the whole thing excluding the twelve other records where the parser had clearly misfired somewhere, and the correlation rose to 0.62 while the band medians moved by at most a point. The table is robust. The headline correlation is somewhere between 0.55 and 0.62 and I have reported the more conservative one.</p>
      <p>I am telling you this because the same score reports feed the predictor on this site, and you should know how it gets checked.</p>

      <h2>7. The short version</h2>
      <p>The Free 120 is worth more than its reputation. One free exam gets within about six points of your real score, close to what an entire set of paid forms manages, and it adds information on top of them rather than repeating them.</p>
      <p>And it is almost always taken three days out, where it can only ever be a mood.</p>
      <p><strong>Take it early enough that the number still has somewhere to go.</strong></p>

      <div className="cta">
        <a className="pri" href={store} onClick={() => track('store_click', { source: CAMPAIGN, location: 'cta_bottom', ref: referrerHost() })}>Get Step Gunner free<small>daily case, spaced repetition, readiness range</small></a>
        <Link className="sec" href="/readiness" onClick={() => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' })}>Run the readiness check<small>free, with exam date and percentile</small></Link>
      </div>

      <h2>Data and method</h2>
      <p>Score-report posts from r/step2, parsed into one row per assessment with usernames dropped at ingest. A student enters this analysis when a current-form Free 120 percentage and a real three-digit Step 2 score are both present (n=215). Percentages above 100 are impossible on a 120-question exam and are excluded; no other value was removed from the primary analysis. Comparison rules were scored leave-one-out on the 205 students who also had at least one NBME or UWSA form, using the same per-form corrections and recency weighting as the <Link href="/readiness/methodology">predictor</Link>. Figures rebuild from the source data rather than being stored, so a chart cannot drift from what it claims to show.</p>

      <h2>References</h2>
      <ul className="refs">
        <li>USMLE. Step 2 CK Free 120 sample test items (current form).</li>
        <li>USMLE. Step 2 CK Score Interpretation Guidelines (percentile norms, LCME first-takers, July 2022 to June 2025).</li>
        <li>r/step2 score-report threads, 2025 to 2026, parsed with usernames removed at ingest.</li>
      </ul>
      </div>
    </LabLayout>
  );
}
