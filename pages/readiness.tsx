import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useState, useEffect, useRef } from 'react';
import {
  PASS, PASS_COMFORT, FORMS,
  percentile, ordinal, computeReadiness, decodeShare, buildCardCore, ogMeta, SHARE_BASE,
  type Entry, smartDays, examDaysUntil, TAKEN_OPTS, takenIsExact, takenSource, MODEL_VERSION, visitorIdentity } from '../lib/readiness';
import ScoreShareCard from '../components/ScoreShareCard';
import { track, referrerHost } from '../lib/analytics';
import { AppShell, ArticleHeader, Hero, Icon, Stage } from '../components/app';
import { BeatPitch, ToolStickyBar } from '../components/app/tools/asks';
import { RangeGauge, Trajectory } from '../components/app/tools/ReadinessViz';

// /readiness, the site's main conversion surface, in the app look: the header on the
// page, the tool in a dark Stage band like the home page's readiness block (the inputs,
// then the answer under them), the share card and the ask after the result.
//
// Behavior is unchanged from the Score Report page: ?e= restores a shared run over
// local storage, every settled check posts once to /api/readiness (debounced 2.5s,
// de-duped), readiness_computed fires with it, the return-score nudge, the share card.
// Store buttons keep their attribution: ct=readiness_web on the App Store URL and
// source=readiness in GA4, as before; the old `pitch` slot reports as `result` and
// the phone bar as `sticky` (lib/wards/site.json locs).

const CT = 'readiness_web';
const SRC = { source: 'readiness' };

type OG = { title: string; desc: string; image: string; url: string };

export default function Readiness({ og }: { og: OG }) {
  const [entries, setEntries] = useState<Entry[]>([{ form: '', score: '', days: '' }]);
  const [actual, setActual] = useState('');
  const [examRaw, setExamRaw] = useState('');
  const [nudge, setNudge] = useState(false);
  const [status, setStatus] = useState('');
  const lastSent = useRef('');

  // Restore on load. A shared ?e= link wins over local storage so a shared link
  // recreates the exact inputs + card; otherwise fall back to this device's saved run.
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('e');
      if (q) {
        const s = decodeShare(q);
        if (s) { setEntries(s.entries); setActual(s.actual); setStatus(s.status); return; }
      }
    } catch { /* ignore */ }
    try {
      const s = localStorage.getItem('gunner_readiness');
      if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length) setEntries(p); }
      const a = localStorage.getItem('gunner_readiness_actual'); if (a) setActual(a);
      const st = localStorage.getItem('gunner_readiness_status'); if (st) setStatus(st);
      const ex = localStorage.getItem('gunner_readiness_exam'); if (ex) setExamRaw(ex);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('gunner_readiness', JSON.stringify(entries));
      localStorage.setItem('gunner_readiness_actual', actual);
      localStorage.setItem('gunner_readiness_status', status);
      localStorage.setItem('gunner_readiness_exam', examRaw);
    } catch { /* ignore */ }
  }, [entries, actual, status, examRaw]);

  const { dated, proj, showTrajectory } = computeReadiness(entries);
  const ed = examDaysUntil(examRaw);
  const actualNum = actual === '' ? NaN : parseInt(actual, 10);
  const actualValid = !Number.isNaN(actualNum) && actualNum >= 130 && actualNum <= 300;
  const canShare = !!proj || actualValid;

  // Save each settled check anonymously (aggregate dataset). Debounced + de-duped.
  useEffect(() => {
    // actual-only sessions (share-link visitors reporting a real score with no
    // forms) are rows too; requiring proj here silently dropped every one.
    if (!proj && !actualValid) return;
    const ident = visitorIdentity();
    const payload = JSON.stringify({
      entries: entries.filter((e) => e.score !== '').map((e) => ({
        form: e.form, score: e.score, days: e.days, dateSource: takenSource(e.days, e.exact),
      })),
      projected: proj ? { low: proj.low, high: proj.high } : null,
      actual: actualValid ? actualNum : null,
      source: 'readiness',
      examInDays: ed,
      modelVersion: MODEL_VERSION,
      visitor: ident ? { id: ident.vid, session: ident.sid, firstSeen: ident.firstSeen } : null,
    });
    if (payload === lastSent.current) return;
    const t = setTimeout(() => {
      lastSent.current = payload;
      fetch('/api/readiness', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }).catch(() => { /* ignore */ });
      if (proj) track('readiness_computed', { low: proj.low, high: proj.high, hasActual: actualValid, ref: referrerHost() });
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, actual, examRaw]);

  // Return-score nudge: a visitor whose saved forms are weeks old, or whose
  // own exam date has passed, probably HAS a real score now. Inviting it here
  // is what turns an old projection into an anonymous blind pair.
  useEffect(() => {
    if (actual !== '') { setNudge(false); return; }
    const ident = visitorIdentity();
    const stale = !!ident && ident.firstSeen > 0 && Date.now() - ident.firstSeen > 14 * 86400000;
    const hasForms = entries.some((e) => e.score !== '');
    const examPassed = ed != null && ed < 0;
    setNudge((stale && hasForms) || examPassed);
  }, [entries, actual, examRaw, ed]);

  const setEntry = (i: number, patch: Partial<Entry>) => setEntries((es) => es.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const addEntry = () => setEntries((es) => (es.length < 12 ? [...es, { form: '', score: '', days: '' }] : es));
  const removeEntry = (i: number) => setEntries((es) => (es.length > 1 ? es.filter((_, j) => j !== i) : es));
  const onlyNum = (v: string, n: number) => v.replace(/[^0-9]/g, '').slice(0, n);
  // Visible labels sit on the first row; every later row names its fields for screen readers.
  const lab = (i: number, t: string) => (i === 0 ? <span className="lbl">{t}</span> : <span className="sr">{t}, test {i + 1}</span>);

  return (
    <>
      <Head>
        <title>{og.title}</title>
        <meta name="description" content="Enter your NBME or UWSA scores and see a projected Step 2 CK range, percentile, and trajectory, free. Step Gunner tracks every practice test to exam day." />
        <meta property="og:title" content={og.title} />
        <meta property="og:description" content={og.desc} />
        <meta property="og:url" content={og.url} />
        {/* Always the bare page: a shared ?e= card is the same content with a
            different payload, so every share must consolidate here rather than
            becoming its own indexable near-duplicate. og:url above keeps the
            payload so the unfurl still shows the student's own card. */}
        <link rel="canonical" href="https://stepgunner.com/readiness" />
        <meta property="og:image" content={og.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={og.image} />
      </Head>

      <AppShell
        campaign="readiness"
       
        sticky={<ToolStickyBar title="Your forms are the floor." button="Get Step Gunner free" ct={CT} params={SRC} />}
      >
        <Hero>
          {/* The phone bar appears once a range exists and the header has scrolled away. */}
          <div {...(proj != null ? { 'data-sticky-start': '' } : {})}>
            <ArticleHeader
              category="step2"
              byline={false}
              eyebrow="Free readiness check"
              title="How ready are you for Step 2 CK?"
              accent="Step 2 CK?"
              dek="Drop in your NBME or UWSA scores and see a projected Step 2 range, percentile, and trajectory. No sign-up."
            />
          </div>
        </Hero>

        <Stage category="step2" id="check">
          <div className="mk isl">
            <section className="sheet dark-card ry-tool" aria-labelledby="ry-tool-h">
              <div className="sheet-hd">
                <h2 className="lbl" id="ry-tool-h"><span className="dot gold" aria-hidden="true" />Readiness check</h2>
              </div>
              <div className="ry-g">
                <div className="ry-forms">
                  <ol className="ry-rows">
                    {entries.map((e, i) => (
                      <li className="ry-row" key={i}>
                        <label className="ry-f ry-form">
                          {lab(i, 'Form')}
                          <span className="sel">
                            <select className={'inp' + (e.form === '' ? ' ry-empty' : '')} value={e.form} onChange={(ev) => setEntry(i, { form: ev.target.value })}>
                              <option value="">Form</option>
                              {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <Icon name="chev" sm />
                          </span>
                        </label>
                        <label className="ry-f ry-score">
                          {lab(i, 'Score')}
                          <input className="inp" inputMode="numeric" autoComplete="off" placeholder="248" value={e.score} onChange={(ev) => setEntry(i, { score: onlyNum(ev.target.value, 3) })} />
                        </label>
                        <label className="ry-f ry-taken">
                          {lab(i, 'Taken')}
                          {takenIsExact(e.days, e.exact) ? (
                            <span className="ry-hintw">
                              <input className="inp txt" autoFocus autoComplete="off" placeholder="Jun 20, or 21" value={e.days}
                                onChange={(ev) => setEntry(i, { days: ev.target.value.replace(/[^0-9A-Za-z /,-]/g, '').slice(0, 12) })}
                                onBlur={(ev) => { if (!ev.target.value.trim()) setEntry(i, { exact: false, days: '' }); }} />
                              {(() => { const d = smartDays(e.days);
                                return d != null ? <i className="ry-hint num">&asymp;{d}d ago</i> : null; })()}
                            </span>
                          ) : (
                            <span className="sel">
                              <select className={'inp' + (e.days === '' ? ' ry-empty' : '')} value={e.days}
                                onChange={(ev) => { const v = ev.target.value; if (v === 'x') setEntry(i, { exact: true, days: '' }); else setEntry(i, { days: v, exact: false }); }}>
                                {TAKEN_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                              <Icon name="chev" sm />
                            </span>
                          )}
                        </label>
                        <button type="button" className="ry-rm" aria-label={`Remove test ${i + 1}`} onClick={() => removeEntry(i)} style={{ visibility: i === 0 ? 'hidden' : 'visible' }}>
                          <Icon name="x" sm />
                        </button>
                      </li>
                    ))}
                  </ol>
                  <button type="button" className="chip ry-add" onClick={addEntry}><Icon name="plus" sm />Add another NBME / UWSA</button>
                  <p className="fine">
                    Add roughly when you took each form. A rough pick is plenty; use exact date if you know it. The projection leans on your freshest scores, the ones that best predict test day. Skip it for a rough read.
                  </p>
                </div>

                <div className="ry-more">
                  <div className="ry-exam">
                    <label className="ry-f">
                      <span className="lbl">Exam date <em>(opt.)</em></span>
                      <span className="ry-hintw">
                        <input className="inp txt" autoComplete="off" placeholder="Sep 20, or 32" value={examRaw}
                          onChange={(ev) => setExamRaw(ev.target.value.replace(/[^0-9A-Za-z /,-]/g, '').slice(0, 12))} />
                        {ed != null ? <i className="ry-hint num">{ed >= 0 ? `≈${ed}d out` : `${-ed}d ago`}</i> : null}
                      </span>
                    </label>
                    <p className="fine">With an exam date the projection can say how much runway is left, and forms age against the right day.</p>
                  </div>

                  {nudge && (
                    <p className="ry-nudge">
                      <b>Been tested since?</b> Add your real score below. It grades our projection in public and tightens the model for the next student.
                    </p>
                  )}
                  <div className="ry-extra">
                    <label className="ry-f">
                      <span className="lbl">Actual Step 2 <em>(opt.)</em></span>
                      <input className="inp" inputMode="numeric" autoComplete="off" placeholder="250" value={actual} onChange={(ev) => setActual(onlyNum(ev.target.value, 3))} />
                    </label>
                    <label className="ry-f">
                      <span className="lbl">Status line <em>(opt.)</em></span>
                      <input className="inp txt" type="text" maxLength={60} placeholder="US MD, targeting IM" value={status} onChange={(ev) => setStatus(ev.target.value)} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="ry-res" aria-live="polite">
                {actualValid ? (
                  <div className="ry-res-g">
                    <div className="ry-ans">
                      <p className="lbl">Your Step 2 CK</p>
                      <p className={'range' + (actualNum < PASS ? ' ry-muted' : '')}><span className="num">{actualNum}</span></p>
                      <ul className="ry-tags">
                        <li>{ordinal(percentile(actualNum))} %ile</li>
                      </ul>
                      {actualNum < PASS
                        ? <p className="ry-verdict low"><Icon name="warn" sm />Below {PASS}</p>
                        : actualNum <= PASS_COMFORT
                          ? <p className="ry-verdict ok"><Icon name="checkc" sm />Clears {PASS}</p>
                          : null}
                      <p className="fine">Your actual score, plotted against your practice trajectory. Percentile vs US first-takers.</p>
                    </div>
                    {proj && (
                      <div className="ry-viz">
                        {showTrajectory ? <Trajectory dated={dated} proj={proj} /> : <RangeGauge low={proj.low} high={proj.high} center={proj.center} />}
                      </div>
                    )}
                  </div>
                ) : proj ? (
                  <div className="ry-res-g">
                    <div className="ry-ans">
                      <p className="lbl">Projected Step 2 CK</p>
                      <p className="range"><span className="num">{proj.low}</span><span className="to"> to </span><span className="num">{proj.high}</span></p>
                      <ul className="ry-tags">
                        <li>proj. {ordinal(percentile(proj.center))} %ile</li>
                        <li>{proj.tier} range</li>
                      </ul>
                      {proj.verdict && (
                        <p className={'ry-verdict ' + proj.vclass}><Icon name={proj.vclass === 'ok' ? 'checkc' : 'warn'} sm />{proj.verdict}</p>
                      )}
                      <p className="fine">
                        {showTrajectory
                          ? 'Green dots are your scores; the gold band is your projected range at exam day. Percentile vs US first-takers. A rough estimate, not a guarantee.'
                          : 'A rough range, not a guarantee. It widens the farther your test is from exam day. Add another NBME to see your trajectory.'}
                      </p>
                    </div>
                    <div className="ry-viz">
                      {showTrajectory ? <Trajectory dated={dated} proj={proj} /> : <RangeGauge low={proj.low} high={proj.high} center={proj.center} />}
                    </div>
                  </div>
                ) : (
                  <div className="rep-empty">
                    <p className="verdict">Your projection appears here</p>
                    <p>Add an NBME or UWSA score above to see your Step 2 range, percentile, and trajectory.</p>
                  </div>
                )}
              </div>
            </section>

            <p className="fine ry-saved">
              Your entries stay on this device and are saved anonymously (no name or email) to sharpen these projections.{' '}
              <Link href="/readiness/methodology">How this projection works</Link> &middot; <Link href="/step-2-score-predictor">How it did on a blind test</Link>
            </p>

            <div className={'ry-after' + (canShare ? ' two' : '')}>
              {canShare && <ScoreShareCard entries={entries} actual={actual} status={status} />}
              <BeatPitch
                id="ry-pitch"
                kicker="The part you control"
                title="Your forms are the floor. The next weeks decide the beat."
                stats={[{ v: '+9', l: 'median beat' }, { v: '+10 to 11', l: 'with 3+ weeks of grind' }]}
                body="The gap between practice forms and the real thing is not luck. It is the reps you put in after. Step Gunner runs those weeks: 6,000+ Step 2 CK questions, a projection that moves with your accuracy, and a planner that says exactly what your next form needs."
                fine="Free to start. This calculator stays free either way."
                note="146 tracked reports. The biggest beats belong to students who kept working."
                ct={CT}
                params={SRC}
                end
              />
            </div>
          </div>
        </Stage>
      </AppShell>

      <style jsx global>{`
        /* .mk .stage-band p (0,2,1) outranks the .mk vocabulary's p classes inside a Stage; restate them. */
        .mk .ry-tool p.lbl { color: var(--st-ink-3); }
        .mk .ry-tool p.fine, .mk .ry-tool .fine { color: var(--st-ink-3); }
        .mk .ry-res p.range { color: var(--st-ink); }
        .mk .ry-res p.range.ry-muted { color: var(--st-ink-3); }
        .mk .ry-res p.verdict { color: var(--st-ink); }
        .mk .ry-tool .sheet-hd h2.lbl { display: inline-flex; align-items: center; gap: 8px; color: var(--st-ink-2); }
        .mk .ry-g { display: grid; gap: 24px; padding: 20px; }
        .mk .ry-forms, .mk .ry-more { min-width: 0; display: grid; gap: 16px; align-content: start; }
        .mk .ry-rows { display: grid; gap: 12px; }
        .mk .ry-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 44px; grid-template-areas: "form form rm" "score taken taken"; gap: 8px; align-items: end; }
        .mk .ry-row + .ry-row { padding-top: 12px; box-shadow: inset 0 1px 0 var(--st-line); }
        .mk .ry-form { grid-area: form; }
        .mk .ry-score { grid-area: score; }
        .mk .ry-taken { grid-area: taken; }
        .mk .ry-rm { grid-area: rm; display: inline-grid; place-items: center; width: 44px; height: 48px; border: 0; border-radius: 12px; background: none; color: var(--st-ink-2); cursor: pointer; }
        .mk .ry-rm:hover { color: var(--st-ink); box-shadow: inset 0 0 0 1px var(--st-line-2); }
        .mk .ry-f { display: grid; gap: 8px; min-width: 0; }
        .mk .ry-f .lbl em { font-style: normal; text-transform: none; letter-spacing: 0; font-weight: 500; }
        .mk .ry-f .inp { font-size: 18px; }
        .mk .ry-f .sel select { font-size: 17px; }
        .mk .dark-card .inp.ry-empty { color: var(--st-ink-3); }
        .mk .dark-card .inp::placeholder { color: var(--st-ink-3); opacity: 1; }
        .mk .ry-hintw { position: relative; display: block; }
        .mk .ry-hintw .inp { padding-right: 88px; }
        .mk .ry-hint { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-style: normal; font-size: 13px; font-weight: 700; color: var(--st-green); pointer-events: none; white-space: nowrap; }
        .mk .ry-add { justify-self: start; }
        .mk .ry-exam { display: grid; gap: 8px; }
        .mk .ry-nudge { padding: 12px 16px; border-radius: var(--r-md); background: var(--st-ok-tint); box-shadow: inset 0 0 0 1px var(--st-line-2); color: var(--st-ink-2); font-size: 16px; line-height: 1.5; }
        .mk .ry-nudge b { color: var(--st-green); }
        .mk .ry-extra { display: grid; gap: 16px; padding-top: 16px; box-shadow: inset 0 1px 0 var(--st-line); }
        .mk .ry-res { padding: 20px; box-shadow: inset 0 1px 0 var(--st-line); }
        .mk .ry-res .rep-empty { margin-top: 0; }
        .mk .ry-res-g { display: grid; gap: 24px; }
        .mk .ry-ans { min-width: 0; }
        .mk .ry-ans .range { margin-top: 8px; }
        .mk .ry-muted { color: var(--st-ink-3); }
        .mk .ry-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .mk .ry-tags li { padding: 4px 12px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--st-line-2); font: 600 15px/1.4 var(--f-mono); color: var(--st-ink); }
        .mk .ry-verdict { display: flex; align-items: flex-start; gap: 8px; margin-top: 12px; font-weight: 600; font-size: 17px; line-height: 1.4; }
        .mk .ry-verdict .ic { margin-top: 3px; }
        .mk .ry-verdict.ok { color: var(--st-green); }
        .mk .ry-verdict.warn { color: var(--st-gold); }
        .mk .ry-verdict.low { color: var(--st-red); }
        .mk .ry-ans .fine { margin-top: 12px; max-width: 46ch; }
        .mk .ry-viz { min-width: 0; align-self: center; }
        .mk .ry-saved { margin-top: 16px; color: var(--st-ink-3); max-width: 72ch; }
        .mk .ry-saved a { color: var(--st-ink); text-decoration: underline; text-decoration-color: var(--st-line-2); text-underline-offset: .2em; }
        .mk .ry-saved a:hover { text-decoration-color: currentColor; }
        .mk .ry-after { display: grid; gap: 20px; margin-top: 24px; align-items: start; }
        @media (min-width: 480px) { .mk .ry-extra { grid-template-columns: minmax(0, 160px) minmax(0, 1fr); } }
        @media (min-width: 600px) {
          .mk .ry-row { grid-template-columns: minmax(0, 1.2fr) minmax(0, .8fr) minmax(0, 1.1fr) 44px; grid-template-areas: "form score taken rm"; }
          .mk .ry-row + .ry-row { padding-top: 0; box-shadow: none; }
          .mk .ry-rows { gap: 8px; }
        }
        @media (min-width: 760px) { .mk .ry-g, .mk .ry-res { padding: 24px 28px; } }
        @media (min-width: 960px) {
          .mk .ry-g { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: 40px; }
          .mk .ry-more { padding-left: 40px; box-shadow: inset 1px 0 0 var(--st-line); }
          .mk .ry-extra { grid-template-columns: minmax(0, 1fr); }
          .mk .ry-res-g { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); column-gap: 40px; align-items: center; }
          .mk .ry-after.two { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
          .mk .ry-after.two .tl-beat { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </>
  );
}

// SSR the OG meta so a shared ?e= link unfurls as the student's own card. Crawlers
// (Reddit, X, iMessage) do not run the client JS, so the og:image must be in the
// server HTML; it points at the dynamic /api/og route with the same ?e= payload.
export const getServerSideProps: GetServerSideProps<{ og: OG }> = async (ctx) => {
  const ORIGIN = SHARE_BASE.replace('/readiness', '');
  const e = typeof ctx.query.e === 'string' ? ctx.query.e : '';
  const decoded = e ? decodeShare(e) : null;
  const core = decoded ? buildCardCore(decoded.entries, decoded.actual, decoded.status) : null;
  const meta = ogMeta(core);
  const qs = core ? `?e=${encodeURIComponent(e)}` : '';
  ctx.res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return {
    props: {
      og: {
        title: meta.title,
        desc: meta.desc,
        image: `${ORIGIN}/api/og${qs}`,
        url: `${ORIGIN}/readiness${qs}`,
      },
    },
  };
};
