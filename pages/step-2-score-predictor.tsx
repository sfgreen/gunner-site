import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import {
  FORMS, CAL, formOffset, correctedScore, calibratedCenter, bandHalfWidth,
  percentile, ordinal, smartDays, TAKEN_OPTS, takenIsExact, takenSource, MODEL_VERSION, visitorIdentity,
} from '../lib/readiness';
import { track, referrerHost } from '../lib/analytics';
import benchmarks from '../lib/specialty_benchmarks.json';
import { FORM_PAGES } from '../lib/forms';
import {
  AppShell, ArticleBody, ArticleHeader, Callout, EndBand, Faq, Hero, Icon, Section, Stage, StickyStoreBar,
} from '../components/app';
import { BeatPitch } from '../components/app/tools/asks';

// /step-2-score-predictor in the app look: the one-form converter in a dark Stage band
// (inputs beside the answer, like the ABG interpreter), the specialty read under it once
// there is a number, the ask, then the receipts, the method, the FAQ and the form pages
// as an article. Behavior unchanged: predictor_quick_convert, predictor_specialty
// (saved per device), predictor_to_full (seeds /readiness without clobbering a saved
// run), the anonymous /api/readiness capture. Store buttons carry ct=predictor and
// source=predictor as before; the old `pitch` slot reports as `result`, `bridge` as `end`.

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

const PROOFS: { stat: string; small: string; b: string; s: string }[] = [
  { stat: '258', small: 'reports, in the open', b: 'The formula is printed on this page.', s: 'Fit on 258 real posted score reports, methodology public, nothing to take on faith.' },
  { stat: '4.1', small: 'avg miss, blind', b: 'Frozen, then tested on 32 unseen reports.', s: 'Bias +0.97, statistically zero. Nine in ten actual scores landed within 8 points.' },
  { stat: '3', small: 'forms decoded', b: 'It knows which forms lie.', s: 'NBME 9 prints 5.5 low, UWSA 2 prints 4.8 hot, UWSA 3 prints 6.3 low. A flat lookup chart hands you the wrong number.' },
  { stat: '+11', small: 'at 3+ weeks out', b: 'It knows your runway.', s: 'A form taken three weeks out means a bigger beat than one taken the night before, so the date changes the math.' },
  { stat: '100%', small: 'of misses public', b: 'It grades itself in public.', s: 'Every new real score gets checked against our projection, and the misses stay on the page.' },
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

  const maxP = sp ? Math.max(1, ...BANDS.map((b) => sp.pMatchPct[b] ?? 0)) : 1;

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

      <AppShell campaign="predictor" sticky={<StickyStoreBar title="Your form is the floor." button="Get Step Gunner free" />}>
        <Hero>
          {/* The phone bar appears once there is a range and the header has scrolled away. */}
          <div {...(valid ? { 'data-sticky-start': '' } : {})}>
            <ArticleHeader
              category="step2"
              byline={false}
              eyebrow={<>Free &middot; No sign-up &middot; Shows its work</>}
              title="Step 2 score predictor that shows its work"
              accent="shows its work"
              dek="Any NBME 9 to 16 or UWSA score becomes a projected Step 2 CK range, fit on 258 real posted score reports and tested blind on 32 more: average miss 4.1 points. The range appears as you type."
            />
          </div>
        </Hero>

        <Stage category="step2" id="convert">
          <div className="mk isl">
            <section className="sheet dark-card pd-tool" aria-labelledby="pd-tool-h">
              <h2 className="sr" id="pd-tool-h">Score converter</h2>
              <div className="pd-g">
                <div className="pd-in">
                  <div className="pd-q">
                    <label className="pd-f">
                      <span className="lbl">Form</span>
                      <span className="sel">
                        <select className="inp" value={form} onChange={(e) => { setForm(e.target.value); }}>
                          {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <Icon name="chev" sm />
                      </span>
                    </label>
                    <label className="pd-f">
                      <span className="lbl">Printed score</span>
                      <input className="inp" inputMode="numeric" autoComplete="off" placeholder="245" value={score} onChange={(e) => onCompute(e.target.value)} />
                    </label>
                    <label className="pd-f pd-taken">
                      <span className="lbl">Taken</span>
                      {takenIsExact(days, takenExact) ? (
                        <span className="pd-hintw">
                          <input className="inp txt" autoFocus autoComplete="off" placeholder="Jul 2, or 21" value={days}
                            onChange={(e) => setDays(e.target.value.replace(/[^0-9A-Za-z /,-]/g, '').slice(0, 12))}
                            onBlur={(e) => { if (!e.target.value.trim()) { setTakenExact(false); setDays(''); } }} />
                          {d != null ? <i className="pd-hint num">&asymp;{d}d ago</i> : null}
                        </span>
                      ) : (
                        <span className="sel">
                          <select className={'inp' + (days === '' ? ' pd-empty' : '')} value={days}
                            onChange={(e) => { const v = e.target.value; if (v === 'x') { setTakenExact(true); setDays(''); } else setDays(v); }}>
                            {TAKEN_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          <Icon name="chev" sm />
                        </span>
                      )}
                    </label>
                  </div>
                  <p className="fine pd-fhint">dated forms <b>weigh more</b></p>

                  <div className="pd-prog">
                    <span className="lbl">Forms</span>
                    <div className="pd-slots">
                      <span className={'pd-slot' + (valid ? ' done' : '')}>{valid ? form : 'this one'}</span>
                      <button type="button" className="pd-slot ghost" onClick={() => goFull('slot')}><Icon name="plus" sm />add</button>
                      <button type="button" className="pd-slot ghost" onClick={() => goFull('slot')}><Icon name="plus" sm />add</button>
                    </div>
                    <span className="fine pd-pr">each dated form <b>tightens this range</b></span>
                  </div>
                </div>

                <div className="pd-out" aria-live="polite">
                  {valid ? (
                    <>
                      <p className="lbl">Projected Step 2 CK</p>
                      <p className="range"><span className="num">{lo}</span><span className="to"> to </span><span className="num">{hi}</span></p>
                      <ul className="pd-tags">
                        <li>midpoint {mid} &middot; {ordinal(percentile(center))} %ile of first-takers</li>
                        {Math.abs(off) >= 0.5 && (
                          <li className={off > 0 ? 'up' : 'hot'}>
                            {form} {off > 0 ? 'prints low: counted as ' : 'prints hot: counted as '}{Math.round(counted)}
                          </li>
                        )}
                      </ul>
                      <details className="pd-how">
                        <summary><Icon name="chev" sm />how we got {mid}</summary>
                        <p>
                          {Math.abs(off) >= 0.5
                            ? `${form} ${printed} counts as ${Math.round(counted)} (prints ${off > 0 ? 'low' : 'hot'} by ${Math.abs(off)}). `
                            : `${form} ${printed} enters at face value. `}
                          Calibrated map: 250 + 0.79 x ({Math.round(counted)} - 250) + 9 = {mid}. The
                          &plusmn;{band} band {d != null ? 'is tightened by your form date' : 'is wide because the form is undated'}.
                          Full math on the <Link href="/readiness/methodology">methodology page</Link>.
                        </p>
                      </details>
                      <dl className="pd-stats">
                        <div><dt className="num">80%</dt><dd>beat their last form</dd></div>
                        <div><dt className="num">+9</dt><dd>median beat</dd></div>
                        <div><dt className="num">4.1</dt><dd>avg miss, tested blind</dd></div>
                      </dl>
                    </>
                  ) : (
                    <div className="rep-empty">
                      <p className="verdict">Your conversion appears here</p>
                      <p>Pick a form and enter the printed score. No sign-up, it answers as you type.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {valid && (
              <section className="sheet dark-card pd-spec" aria-labelledby="pd-spec-h">
                <div className="sheet-hd"><span className="lbl pd-no">01</span></div>
                <div className="sheet-bd">
                  <h2 className="h-3" id="pd-spec-h">What does a {mid} actually buy?</h2>
                  <p className="pd-lede">Depends where you point it. Pick your target:</p>
                  <label className="sel pd-specsel">
                    <span className="sr">Target specialty</span>
                    <select className={'inp' + (specialty === '' ? ' pd-empty' : '')} value={specialty} onChange={(e) => pickSpecialty(e.target.value)}>
                      <option value="">choose your target specialty&hellip;</option>
                      {SPEC_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <Icon name="chev" sm />
                  </label>
                  {sp && (pct != null ? (
                    <div className="pd-verdict">
                      <p className="pd-vbig">{bandPhrase(bk)}, <em className="num">{pct}%</em> of {specialty.toLowerCase()} applicants matched.</p>
                      <p className="pd-vsub">
                        Matched average {sp.matchedAvg}. {diff > 0 ? `Your midpoint sits ${diff} above it.` : diff < 0 ? `Your midpoint sits ${-diff} below it.` : 'Your midpoint sits right at it.'}
                      </p>
                    </div>
                  ) : (
                    <div className="pd-verdict">
                      <p className="pd-vsub">NRMP charts too few US MD seniors at this band in {specialty.toLowerCase()} to quote a match rate. The bars show the shape across bands.</p>
                    </div>
                  ))}
                  {sp && (
                    <div className="pd-bands" role="img" aria-label={`Share of US MD seniors who matched in ${specialty}, by Step 2 band: ${BANDS.map((b) => `${b} ${sp.pMatchPct[b] == null ? 'not charted' : `${sp.pMatchPct[b]}%`}`).join(', ')}`}>
                      {BANDS.map((b) => {
                        const p = sp.pMatchPct[b] ?? null;
                        return (
                          <div key={b} className={'pd-bnd' + (b === bk ? ' you' : '')} aria-hidden="true">
                            <span className="pv num">{p == null ? 'n/a' : b === bk ? `${p}%` : p}</span>
                            <span className="bar" style={{ height: `${p == null ? 3 : Math.max(4, Math.round((p / maxP) * 96))}px` }} />
                            <span className="bl num">{b === '250+' ? '250+' : `${b.slice(0, 3)}s`}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="srcl">NRMP Charting Outcomes in the Match, US MD seniors, 2020 to 2024. All 22 specialties.</p>
                </div>
              </section>
            )}

            <div className="pd-ask">
              <BeatPitch
                id="pd-pitch"
                kicker="The part you control"
                title="Your form is the floor. The next three weeks decide the beat."
                stats={[{ v: '+9', l: 'median beat' }, { v: '+10 to 11', l: 'with 3+ weeks of grind' }]}
                body={<>The gap between a practice form and the real thing is not luck. It is the reps you put in after. Step Gunner runs those weeks: <b>6,000+ Step 2 CK questions</b>, a projection that moves with your accuracy, and a planner that says exactly what your next form needs.</>}
                fine="Free to start. This predictor stays free either way."
                note="146 tracked reports. The biggest beats belong to students who kept working."
              />
            </div>
          </div>
        </Stage>

        <ArticleBody toc={[['receipts', 'The receipts'], ['how', 'How the conversion works'], ['blind', 'The blind test'], ['faq', 'Questions students actually ask'], ['forms', 'One form at a time']]}>
          <Section id="receipts" n="02" title="The receipts">
            <div className="mk isl">
              <ul className="pd-proofs">
                {PROOFS.map((p) => (
                  <li key={p.stat}>
                    <p className="pd-stat"><span className="num">{p.stat}</span><span className="lbl">{p.small}</span></p>
                    <div><p className="pd-pb">{p.b}</p><p className="pd-ps">{p.s}</p></div>
                  </li>
                ))}
              </ul>
            </div>
            <Callout>
              <p><b>Read the error bars honestly.</b> Score-release threads skew toward good news, so our published misses are a floor, not a ceiling. No practice form can promise a score. That is why everything on this page is a range.</p>
            </Callout>
          </Section>

          <Section id="how" n="03" title="How the conversion works">
            <div className="mk isl">
              <p className="prs">
                Most NBME conversion charts are a single lookup table with no dates and no source. This
                one runs the same calibrated engine as the Step Gunner app, in three steps:
              </p>
              <p className="prs">
                <b>1. Scale translation.</b> Three forms print off the common scale and get translated
                before anything else: old NBME 9 prints about 5.5 low (credited back), UWSA 2 prints
                about 4.8 hot, UWSA 3 about 6.3 low. Forms 10 through 16 are equated by NBME itself
                and enter at face value. Your printed number is never shown reduced.
              </p>
              <p className="prs">
                <b>2. Recency weighting.</b> With multiple forms, each one is weighted by
                exp(minus age over 30 days). A form from this week dominates; a form from two months
                ago barely whispers. This is also the honest answer to which form predicts best:
                the one you took last.
              </p>
              <p className="prs">
                <b>3. The calibrated map.</b> The blended level is mapped through
                250 + 0.79 x (level minus 250) + 9, fit on real reported outcomes. The +9 is the
                measured practice-to-real gain, which is why your projection usually sits above your
                latest form. The result is shown as a range, because a point estimate would be
                pretending.
              </p>
            </div>
          </Section>

          <Section id="blind" n="04" title="The blind test">
            <div className="mk isl">
              <p className="prs">
                In August 2026 we froze the model and scored 32 new score reports it had never seen,
                from the newest score release thread. Result: average miss 4.1 points, bias +0.97
                (statistically zero), 88 percent of actual scores inside plus or minus 7 and 94 percent
                inside plus or minus 8. Also: 26 of the 32 scored at or above their freshest NBME,
                which is the pattern the +9 gain encodes. Full write-up and reproduction scripts on
                the <Link href="/readiness/methodology">methodology page</Link>.
              </p>
            </div>
          </Section>

          <Section id="faq" n="05" title="Questions students actually ask">
            <Faq items={FAQ} />
          </Section>

          {/* Hub to children. Each form page owns its own query ("nbme 15 score
              conversion"); this page owns the broad one. Linking them here is
              what keeps the authority on the hub instead of stranding eleven
              orphans that only the sitemap knows about. */}
          <Section id="forms" n="06" title="One form at a time" lead="Every form, what it prints, and a full conversion table.">
            <div className="mk isl">
              <ul className="gjump pd-forms">
                {FORM_PAGES.map((f) => (
                  <li key={f.slug}><Link href={`/step-2-score-predictor/${f.slug}`}>{f.form}</Link></li>
                ))}
              </ul>
            </div>
          </Section>
        </ArticleBody>

        <EndBand title="The predictor is a snapshot. The app is the film." button="Get the app" />
      </AppShell>

      <style jsx global>{`
        /* .mk .stage-band p (0,2,1) outranks the .mk vocabulary's p classes inside a Stage; restate them. */
        .mk .pd-tool p.lbl, .mk .pd-spec p.lbl { color: var(--st-ink-3); }
        .mk .pd-tool p.fine { color: var(--st-ink-3); }
        .mk .pd-out p.range { color: var(--st-ink); }
        .mk .pd-out p.verdict { color: var(--st-ink); }
        .mk .pd-spec p.srcl { color: var(--st-ink-3); }
        .mk .pd-g { display: grid; }
        .mk .pd-in { min-width: 0; padding: 20px; display: grid; gap: 16px; align-content: start; }
        .mk .pd-q { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px 8px; }
        .mk .pd-taken { grid-column: 1 / -1; }
        .mk .pd-f { display: grid; gap: 8px; min-width: 0; }
        .mk .pd-f .sel select { font-size: 17px; }
        .mk .dark-card .inp.pd-empty { color: var(--st-ink-3); }
        .mk .dark-card .inp::placeholder { color: var(--st-ink-3); opacity: 1; }
        .mk .pd-hintw { position: relative; display: block; }
        .mk .pd-hintw .inp { padding-right: 88px; }
        .mk .pd-hint { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-style: normal; font-size: 13px; font-weight: 700; color: var(--st-green); pointer-events: none; white-space: nowrap; }
        .mk .pd-fhint { margin-top: -8px; }
        .mk .pd-fhint b, .mk .pd-pr b { color: var(--st-ink); font-weight: 600; }
        .mk .pd-prog { display: grid; gap: 8px; padding-top: 16px; box-shadow: inset 0 1px 0 var(--st-line); }
        .mk .pd-slots { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .mk .pd-slot { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-height: 44px; padding: 0 8px; border: 0; border-radius: 12px; background: var(--st-card-2); box-shadow: inset 0 0 0 1px var(--st-line-2); color: var(--st-ink-3); font: 600 15px/1.2 var(--f-mono); text-align: center; }
        .mk .pd-slot.done { color: var(--st-green); box-shadow: inset 0 0 0 1px var(--st-green); background: var(--st-ok-tint); }
        .mk .pd-slot.ghost { cursor: pointer; background: none; box-shadow: none; outline: 1px dashed var(--st-line-2); outline-offset: -1px; color: var(--st-ink-2); }
        .mk .pd-slot.ghost:hover { outline-color: var(--st-blue); color: var(--st-ink); }
        .mk .pd-slot.ghost:focus-visible { outline: 2px solid var(--st-blue); outline-offset: 2px; }
        .mk .pd-out { min-width: 0; padding: 20px; box-shadow: inset 0 1px 0 var(--st-line); }
        .mk .pd-out .rep-empty { margin-top: 0; }
        .mk .pd-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .mk .pd-tags li { padding: 4px 12px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--st-line-2); font: 600 15px/1.4 var(--f-mono); color: var(--st-ink); }
        .mk .pd-tags li.up { color: var(--st-green); }
        .mk .pd-tags li.hot { color: var(--st-gold); }
        .mk .pd-how { margin-top: 16px; }
        .mk .pd-how summary { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; cursor: pointer; list-style: none; font: 600 15px/1.2 var(--f-mono); color: var(--st-ink-2); text-decoration: underline; text-decoration-color: var(--st-line-2); text-underline-offset: .25em; }
        .mk .pd-how summary::-webkit-details-marker { display: none; }
        .mk .pd-how summary .ic { transition: transform var(--d-micro) var(--ease); }
        .mk .pd-how[open] summary .ic { transform: rotate(180deg); }
        .mk .pd-how p { margin-top: 4px; font: 500 15px/1.6 var(--f-mono); color: var(--st-ink-2); max-width: 60ch; }
        .mk .pd-how a { color: var(--st-ink); text-decoration: underline; text-decoration-color: var(--st-line-2); }
        .mk .pd-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 20px; box-shadow: inset 0 1px 0 var(--st-line); }
        .mk .pd-stats > div { min-width: 0; padding: 16px 12px 0 0; }
        .mk .pd-stats > div + div { padding-left: 12px; box-shadow: inset 1px 0 0 var(--st-line); }
        .mk .pd-stats dt { font: 800 23px/1.1 var(--f-sans); letter-spacing: -.02em; color: var(--st-ink); }
        .mk .pd-stats dd { margin-top: 4px; font: 600 13px/1.35 var(--f-mono); letter-spacing: .04em; text-transform: uppercase; color: var(--st-ink-3); }
        .mk .pd-spec { margin-top: 20px; }
        .mk .pd-no { color: var(--st-gold); }
        .mk .pd-spec .h-3 { color: var(--st-ink); }
        .mk .pd-lede { margin-top: 8px; color: var(--st-ink-2); }
        .mk .pd-specsel { margin-top: 16px; max-width: 480px; }
        .mk .pd-verdict { margin-top: 16px; padding: 12px 16px; border-radius: var(--r-md); background: var(--st-card-2); box-shadow: inset 3px 0 0 var(--st-gold); }
        .mk .pd-vbig { font-weight: 700; font-size: 19px; line-height: 1.4; color: var(--st-ink); }
        .mk .pd-vbig em { font-style: normal; color: var(--st-gold); }
        .mk .pd-vsub { margin-top: 4px; color: var(--st-ink-2); font-size: 16px; }
        .mk .pd-verdict .pd-vsub:first-child { margin-top: 0; }
        .mk .pd-bands { display: flex; gap: 8px; align-items: flex-end; margin-top: 20px; max-width: 480px; }
        .mk .pd-bnd { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; align-items: stretch; text-align: center; }
        .mk .pd-bnd .pv { font-size: 13px; font-weight: 700; color: var(--st-ink-2); margin-bottom: 4px; }
        .mk .pd-bnd .bar { display: block; border-radius: 6px 6px 0 0; background: var(--st-line-2); }
        .mk .pd-bnd .bl { margin-top: 8px; font-size: 13px; color: var(--st-ink-3); }
        .mk .pd-bnd.you .pv { color: var(--st-gold); }
        .mk .pd-bnd.you .bar { background: var(--st-gold); box-shadow: 0 0 16px var(--glow-gold); }
        .mk .pd-bnd.you .bl { color: var(--st-ink); font-weight: 700; }
        .mk .pd-ask { margin-top: 20px; }
        .mk .pd-proofs { display: grid; gap: 8px; margin-top: 16px; }
        .mk .pd-proofs > li { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 16px; align-items: start; padding: 16px; border-radius: var(--r-md); background: var(--card); box-shadow: inset 0 0 0 1px var(--line); }
        .mk .pd-stat { display: grid; gap: 4px; }
        .mk .pd-stat .num { font: 800 28px/1 var(--f-sans); letter-spacing: -.02em; color: var(--ink); font-variant-numeric: tabular-nums; }
        .mk .pd-stat .lbl { font-size: 13px; letter-spacing: .04em; }
        .mk .pd-pb { font-weight: 700; color: var(--ink); }
        .mk .pd-ps { margin-top: 4px; color: var(--ink-2); font-size: 16px; line-height: 1.5; }
        .mk .pd-forms { margin-top: 16px; }
        .mk .pd-forms a { font-family: var(--f-mono); }
        @media (min-width: 600px) {
          .mk .pd-q { grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr) minmax(0, 1.2fr); }
          .mk .pd-taken { grid-column: auto; }
        }
        @media (min-width: 760px) { .mk .pd-in, .mk .pd-out { padding: 28px; } }
        @media (min-width: 960px) {
          .mk .pd-g { grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); }
          .mk .pd-out { box-shadow: inset 1px 0 0 var(--st-line); }
        }
      `}</style>
    </>
  );
}
