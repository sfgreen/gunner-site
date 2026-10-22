import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FORMS, computeReadiness, percentile, ordinal, shortTier, type Entry } from '../lib/readiness';
import { track } from '../lib/analytics';
import { Icon } from './app/blocks';

// The compact readiness check inside the research post (/research/nbme-to-step-2). Same
// engine as /readiness (lib/readiness.computeReadiness); the full page adds the exam
// date, the pass-line verdict, the trajectory and the share card. In the app look it is
// the home page's readiness tool: a dark card (.sheet.dark-card) for a Stage band, the
// forms table, the add chip and the range, styled by styles/wards.css plus the rs-
// rules in components/app/research (ResearchStyles), which the host page renders.
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
      <section className="sheet dark-card rs-tool rs-rc" aria-labelledby="rs-rc-h">
        <div className="sheet-hd"><span className="lbl"><span className="dot gold" aria-hidden="true" />Readiness check</span><span className="lbl">SAME MATH AS THE APP</span></div>
        <div className="abg-g">
          <div className="abg-in">
            <h3 className="h-3" id="rs-rc-h">{title}</h3>
            <table className="forms">
              <thead>
                <tr><th className="lbl c-form" scope="col">Form</th><th className="lbl" scope="col">Score</th><th className="lbl" scope="col">Days before exam</th><th className="c-rm" scope="col"><span className="sr">Remove</span></th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <label className="sel"><span className="sr">Form {i + 1}</span>
                        <select className="inp" value={r.form} onChange={(e) => set(i, 'form', e.target.value)}>
                          {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select><Icon name="chev" sm />
                      </label>
                    </td>
                    <td><input className="inp" inputMode="numeric" autoComplete="off" placeholder="240" value={r.score} onChange={(e) => set(i, 'score', e.target.value)} aria-label={`Score, form ${i + 1}`} /></td>
                    <td><input className="inp" inputMode="numeric" autoComplete="off" placeholder="21" value={r.days} onChange={(e) => set(i, 'days', e.target.value)} aria-label={`Days before exam, form ${i + 1}`} /></td>
                    <td className="c-rm">{rows.length > 1 && <button type="button" className="rm" onClick={() => remove(i)} aria-label={`Remove form ${i + 1}`}><Icon name="x" sm /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="rd-tools"><button type="button" className="chip" onClick={add}><Icon name="plus" sm />add another form</button></div>
          </div>
          <div className="abg-out" aria-live="polite">
            <p className="lbl">Projected Step 2 CK</p>
            {proj ? (
              <>
                <p className="range"><span className="num">{proj.low}</span><span className="to">to</span><span className="num">{proj.high}</span></p>
                <ul className="rs-chips">
                  <li className="ok">most likely {proj.center}</li>
                  <li className="pc">{ordinal(percentile(proj.center))} percentile</li>
                  <li className={proj.lowAnchor ? 'warn' : undefined}>{shortTier(proj.tier)} band</li>
                </ul>
                <p className="fine">Add your exam date in the <Link href="/readiness" onClick={() => track('cta_predictor', { surface, location: 'tool_fine' })}>full check</Link> for the pass-line verdict and the trajectory. Nothing you type leaves this page.</p>
              </>
            ) : (
              <>
                <p className="range rs-none">No range yet</p>
                <p className="fine">Enter at least one three-digit NBME or UWSA score. Nothing you type leaves this page. <Link href="/readiness/methodology">How it works</Link></p>
              </>
            )}
          </div>
        </div>
      </section>
      <style jsx global>{`
        .mk .rs-rc .abg-in { gap: 16px; }
        .mk .rs-rc .forms th { white-space: normal; }
        .mk .rs-rc .rd-tools { margin-top: 0; }
        .mk .rs-rc .range.rs-none { font-size: 38px; color: var(--st-ink-2); }
        .mk .rs-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .mk .rs-tool .rs-chips li { padding: 4px 12px; border-radius: 999px; font: 600 15px/1.5 var(--f-mono); color: var(--st-ink-2); box-shadow: inset 0 0 0 1px var(--st-line-2); }
        .mk .rs-tool .rs-chips li.ok { color: var(--st-green); box-shadow: inset 0 0 0 1px var(--st-green); }
        .mk .rs-tool .rs-chips li.pc { color: var(--st-purple); box-shadow: inset 0 0 0 1px var(--st-purple); }
        .mk .rs-tool .rs-chips li.warn { color: var(--st-gold); box-shadow: inset 0 0 0 1px var(--st-gold); }
        .mk .rs-rc .fine { max-width: 48ch; }
      `}</style>
    </div>
  );
}
