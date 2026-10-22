import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FORMS, computeReadiness, percentile, ordinal, shortTier, type Entry } from '../lib/readiness';
import { track } from '../lib/analytics';
import { Icon } from './app/blocks';
import { RangeGauge } from './app/tools/ReadinessViz';

// The compact readiness check used inside the research post. Same engine as /readiness
// (lib/readiness.computeReadiness); the full page adds the exam date, the pass-line
// verdict, the trajectory and the share card. In the app look it is the home page's
// readiness card (lib/wards/render.js): a dark app card with the forms table, the
// range and the gauge. It renders its own .mk island, so it works in any column; on
// a white article it reads as a dark card, in a Stage band it sits like the home tool.
export default function ReadinessCheck({ surface, initial, title = 'Your practice forms, one projection' }: {
  surface: string;
  initial?: Entry[];
  title?: string;
}) {
  const [rows, setRows] = useState<Entry[]>(initial ?? [
    { form: 'NBME 14', score: '240', days: '21' },
    { form: 'UWSA 2', score: '250', days: '7' },
  ]);
  const res = useMemo(() => computeReadiness(rows), [rows]);
  const proj = res.proj;
  const set = (i: number, k: keyof Entry, v: string) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const add = () => { setRows((r) => [...r, { form: 'NBME 12', score: '', days: '' }]); track('readiness_add_row', { surface }); };
  const remove = (i: number) => setRows((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : r));
  return (
    <div className="mk isl">
      <section className="sheet dark-card rc-tool" aria-labelledby={`rc-${surface}-h`}>
        <div className="sheet-hd">
          <span className="lbl rc-k"><span className="dot gold" aria-hidden="true" />Readiness check</span>
          <span className="lbl">Same math as the app</span>
        </div>
        <div className="sheet-bd">
          <h3 className="h-3 rc-t" id={`rc-${surface}-h`}>{title}</h3>
          <table className="forms">
            <thead>
              <tr>
                <th className="lbl c-form" scope="col">Form</th>
                <th className="lbl" scope="col">Score</th>
                <th className="lbl" scope="col">Days before exam</th>
                <th className="c-rm" scope="col"><span className="sr">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <label className="sel"><span className="sr">Form {i + 1}</span>
                      <select className="inp" value={r.form} onChange={(e) => set(i, 'form', e.target.value)}>
                        {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <Icon name="chev" sm />
                    </label>
                  </td>
                  <td><input className="inp" inputMode="numeric" autoComplete="off" placeholder="240" value={r.score} onChange={(e) => set(i, 'score', e.target.value)} aria-label={`Score, form ${i + 1}`} /></td>
                  <td><input className="inp" inputMode="numeric" autoComplete="off" placeholder="21" value={r.days} onChange={(e) => set(i, 'days', e.target.value)} aria-label={`Days before exam, form ${i + 1}`} /></td>
                  <td className="c-rm"><button type="button" className="rm" onClick={() => remove(i)} aria-label={`Remove form ${i + 1}`}><Icon name="x" sm /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="rd-tools"><button type="button" className="chip" onClick={add}><Icon name="plus" sm />Add another form</button></div>
          <div className="res" aria-live="polite">
            <p className="lbl">Projected Step 2 CK</p>
            {proj ? (
              <>
                <p className="range"><span className="num">{proj.low}</span><span className="to"> to </span><span className="num">{proj.high}</span></p>
                <ul className="facts">
                  <li>Most likely <b className="num">{proj.center}</b></li>
                  <li><b className="num">{ordinal(percentile(proj.center))}</b> percentile</li>
                  <li className={proj.lowAnchor ? 'rc-warn' : undefined}>{proj.lowAnchor && <Icon name="warn" sm />}{shortTier(proj.tier)} band</li>
                </ul>
                <RangeGauge low={proj.low} high={proj.high} center={proj.center} />
                <p className="fine rc-fine">Add your exam date in the <Link href="/readiness" onClick={() => track('cta_predictor', { surface, location: 'tool_fine' })}>full check</Link> for the pass-line verdict and the trajectory. Nothing you type leaves this page.</p>
              </>
            ) : (
              <>
                <p className="range rc-none">No range yet</p>
                <p className="fine rc-fine">Enter at least one three-digit NBME or UWSA score. Nothing you type leaves this page. <Link href="/readiness/methodology">How it works</Link></p>
              </>
            )}
          </div>
        </div>
      </section>
      <style jsx global>{`
        .mk .rc-tool { margin-top: 24px; }
        /* in a Stage, .mk .stage-band p (0,2,1) would outrank these p classes */
        .mk .rc-tool p.lbl { color: var(--st-ink-3); }
        .mk .rc-tool p.fine { color: var(--st-ink-3); }
        .mk .rc-tool p.range { color: var(--st-ink); }
        .mk .rc-tool .rc-k { display: inline-flex; align-items: center; gap: 8px; color: var(--st-ink-2); }
        .mk .rc-tool .rc-t { color: var(--st-ink); margin-bottom: 16px; }
        /* A host page's element rules (LabLayout's .lab .body th/td/li/b/p, 0,2,1) outrank the
           .mk vocabulary; restate what this card needs at a higher specificity. */
        .mk .rc-tool .forms { table-layout: fixed; margin: 0; font-size: inherit; }
        .mk .rc-tool .forms th, .mk .rc-tool .forms td { background: none; border: 0; white-space: normal; vertical-align: bottom; }
        .mk .rc-tool .forms th { padding: 0 8px 8px 0; color: var(--st-ink-3); overflow-wrap: normal; }
        .mk .rc-tool .forms td { padding: 4px 8px 4px 0; }
        .mk .rc-tool .forms th:last-child, .mk .rc-tool .forms td:last-child { padding-right: 0; }
        .mk .rc-tool .rc-t { margin: 0 0 16px; }
        .mk .rc-tool p.lbl, .mk .rc-tool p.range, .mk .rc-tool p.fine { margin-bottom: 0; max-width: none; }
        .mk .rc-tool p.rc-fine { max-width: 52ch; }
        .mk .rc-tool .facts { margin: 8px 0 0; padding: 0; max-width: none; }
        .mk .rc-tool .facts li { margin: 0; color: var(--st-ink-2); }
        .mk .rc-tool .facts li::marker { content: none; }
        .mk .rc-tool .facts b { color: var(--st-gold); font-weight: 600; }
        .mk .rc-tool .forms th:nth-child(1) { width: 40%; }
        .mk .rc-tool .forms th:nth-child(2) { width: 22%; }
        .mk .rc-tool .forms th:nth-child(4) { width: 44px; }
        .mk .rc-tool .rd-tools { justify-content: flex-start; }
        .mk .rc-tool p.range.rc-none { font-size: 32px; color: var(--st-ink-3); }
        .mk .rc-tool .facts li { display: inline-flex; align-items: center; gap: 4px; }
        .mk .rc-tool .facts .rc-warn { color: var(--st-gold); }
        .mk .rc-tool .rc-fine { margin-top: 16px; max-width: 52ch; }
        .mk .rc-tool .rc-fine a { color: var(--st-ink); text-decoration: underline; text-decoration-color: var(--st-line-2); text-underline-offset: .2em; }
        @media (max-width: 479px) {
          .mk .rc-tool .range { font-size: 46px; }
          .mk .rc-tool .sel select { font-size: 16px; padding-left: 8px; padding-right: 28px; }
          .mk .rc-tool .sel .ic { right: 6px; }
        }
      `}</style>
    </div>
  );
}
