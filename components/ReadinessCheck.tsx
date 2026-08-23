import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FORMS, computeReadiness, percentile, ordinal, shortTier, type Entry } from '../lib/readiness';
import { track } from '../lib/analytics';

// The compact readiness check used on the homepage hero and inside the research
// post. Same engine as /readiness (lib/readiness.computeReadiness); the full page
// adds the exam date, the pass-line verdict, the trajectory and the share card.
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
    <div className="rc-tool">
      <style jsx>{`
        .rc-tool { border: 1px solid var(--hair-strong); background: var(--bg-2); border-radius: 18px; padding: 18px; box-shadow: 0 20px 50px rgba(25,28,35,0.06); }
        .tk { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); display: flex; justify-content: space-between; gap: 10px; }
        .tk b { color: var(--green); letter-spacing: 1px; }
        h3 { font-size: 18px; font-weight: 800; margin: 6px 0 12px; letter-spacing: -0.2px; }
        .row { display: grid; grid-template-columns: 1.15fr 1fr 1fr 26px; gap: 8px; margin-bottom: 8px; align-items: end; }
        .f span { display: block; font-family: var(--mono); font-size: 9.5px; letter-spacing: 0.4px; text-transform: uppercase; color: var(--ink-dim); margin-bottom: 5px; }
        .f input, .f select { width: 100%; background: var(--bg-3); border: 1px solid var(--hair-strong); border-radius: 10px; color: var(--ink); font-family: var(--mono); font-size: 13px; padding: 10px; outline: none; }
        .f input:focus, .f select:focus { border-color: var(--green); }
        .rm { height: 40px; background: transparent; border: 1px solid var(--hair); border-radius: 10px; color: var(--ink-faint); font-size: 14px; cursor: pointer; }
        .rm:hover { color: var(--red); }
        .add { width: 100%; background: transparent; border: 1px dashed var(--hair-strong); border-radius: 10px; color: var(--ink-dim); font-family: var(--mono); font-size: 11px; padding: 9px; cursor: pointer; margin-top: 2px; }
        .add:hover { border-color: var(--green); color: var(--green); }
        .result { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--hair); text-align: center; }
        .rk { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); }
        .rv { font-family: var(--mono); font-size: 44px; font-weight: 800; letter-spacing: -1.5px; color: var(--gold); line-height: 1.05; margin-top: 4px; }
        .rv.muted { color: var(--ink-faint); }
        .rv .d { font-size: 18px; color: var(--ink-dim); font-weight: 600; margin: 0 8px; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 10px 0 4px; }
        .chip { font-family: var(--mono); font-size: 11px; font-weight: 700; padding: 5px 11px; border-radius: 999px; border: 1px solid var(--hair-strong); color: var(--ink-dim); }
        .chip.ok { color: var(--green); border-color: rgba(13,148,72,0.4); }
        .chip.pctl { color: var(--violet); border-color: rgba(175,82,255,0.4); }
        .chip.warn { color: var(--gold); border-color: rgba(224,142,0,0.4); }
        .fine { color: var(--ink-faint); font-size: 12px; line-height: 1.5; margin: 10px auto 0; max-width: 44ch; }
        .fine :global(a) { color: var(--blue); }
        @media (max-width: 480px) { .row { grid-template-columns: 1fr 1fr; } .row .f:first-child { grid-column: 1 / -1; } }
      `}</style>
      <div className="tk"><span>Readiness check</span><b>SAME MATH AS THE APP</b></div>
      <h3>{title}</h3>
      {rows.map((r, i) => (
        <div className="row" key={i}>
          <div className="f"><span>Form</span>
            <select value={r.form} onChange={(e) => set(i, 'form', e.target.value)} aria-label="Form">
              {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="f"><span>Score</span><input inputMode="numeric" placeholder="240" value={r.score} onChange={(e) => set(i, 'score', e.target.value)} aria-label="Score" /></div>
          <div className="f"><span>Days before exam</span><input inputMode="numeric" placeholder="21" value={r.days} onChange={(e) => set(i, 'days', e.target.value)} aria-label="Days before exam" /></div>
          <button className="rm" onClick={() => remove(i)} aria-label="Remove form">&times;</button>
        </div>
      ))}
      <button className="add" onClick={add}>+ add another form</button>
      <div className="result">
        <div className="rk">Projected Step 2 CK</div>
        {proj ? (
          <>
            <div className="rv">{proj.low}<span className="d">to</span>{proj.high}</div>
            <div className="chips">
              <span className="chip ok">most likely {proj.center}</span>
              <span className="chip pctl">{ordinal(percentile(proj.center))} percentile</span>
              <span className={`chip${proj.lowAnchor ? ' warn' : ''}`}>{shortTier(proj.tier)} band</span>
            </div>
            <div className="fine">Add your exam date in the <Link href="/readiness" onClick={() => track('cta_predictor', { surface, location: 'tool_fine' })}>full check</Link> for the pass-line verdict and the trajectory. Nothing you type leaves this page.</div>
          </>
        ) : (
          <>
            <div className="rv muted">&mdash;</div>
            <div className="fine">Enter at least one three-digit NBME or UWSA score. Nothing you type leaves this page. <Link href="/readiness/methodology">How it works</Link></div>
          </>
        )}
      </div>
    </div>
  );
}
