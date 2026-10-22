import { useEffect, useRef, useState } from 'react';
import { Icon } from '../app';
import { track } from '../../lib/analytics';
import { Cites, Source } from './ui';
import { nodeAnchor } from '../../lib/pathways/view';
import type { Lookup, StepVM } from '../../lib/pathways/view';

// Every step's quick check, one at a time, in the Stage band: the pathway's
// interactive heart, in the app's dark question look (.tc, the wards "try the
// case" card). Options arrive in a stable shuffled order (lib/pathways/data);
// the first pick locks a question and reveals why, with its sources and a link
// to the step in the article. Every question is in the server HTML; only the
// current one is shown. Right and wrong are icon plus word as well as color.
const LETTERS = 'ABCDEFGH';

export default function QuickChecks({ steps, lk, sources, page }: {
  steps: StepVM[]; lk: Lookup; sources: Source[]; page: string;
}) {
  const n = steps.length;
  const [cur, setCur] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => steps.map(() => null));
  const moved = useRef(false);
  const qRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // After Previous or Next, the new question takes focus, so a screen reader reads it.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    qRefs.current[cur]?.focus();
  }, [cur]);

  if (!n) return null;
  const answered = picks.filter((p) => p !== null).length;
  const right = picks.filter((p, i) => p !== null && p === steps[i].answer).length;
  const go = (i: number) => { moved.current = true; setCur(i); };
  const pick = (k: number, i: number) => {
    if (picks[k] !== null) return;
    setPicks(picks.map((p, j) => (j === k ? i : p)));
    track('pathway_check_answer', { page, step: steps[k].id, correct: i === steps[k].answer });
  };
  const restart = () => { setPicks(steps.map(() => null)); go(0); };
  const last = cur === n - 1;

  return (
    <section className="tc pw-qp" id="checks" aria-labelledby="checks-h">
      <div className="tc-hd">
        <h2 className="lbl" id="checks-h"><Icon name="pulse" sm />Quick checks</h2>
        <span className="lbl num">{cur + 1} of {n}</span>
      </div>
      <div className="pw-qbar" aria-hidden="true">
        {steps.map((s, i) => {
          const p = picks[i];
          const st = p === null ? (i === cur ? 'now' : '') : p === s.answer ? 'ok' : 'no';
          return <i key={s.id} className={st} />;
        })}
      </div>
      {steps.map((s, k) => {
        const p = picks[k];
        const done = p !== null;
        const qid = `q-${s.id}`;
        return (
          <div className="pw-qc" key={s.id} hidden={k !== cur} role="group" aria-labelledby={qid}>
            <p className="lbl">{s.stage}</p>
            <p className="tc-q" id={qid} tabIndex={-1} ref={(el) => { qRefs.current[k] = el; }}>{s.ask}</p>
            <ol className="tc-o" aria-labelledby={qid}>
              {s.options.map((o, i) => {
                const st = !done ? undefined : i === s.answer ? 'right' : i === p ? 'wrong' : 'dim';
                return (
                  <li key={i}>
                    <button type="button" className="opt" data-s={st} aria-disabled={done || undefined} onClick={() => pick(k, i)}>
                      <span className="k">{LETTERS[i]}</span>
                      <span>{o}</span>
                      <span className="m">
                        {st === 'right' && <><Icon name="check" sm />Answer</>}
                        {st === 'wrong' && <><Icon name="x" sm />Your pick</>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div aria-live="polite">
              {done && (
                <div className="tc-r on pw-qr">
                  <p className={`tc-res ${p === s.answer ? 'ok' : 'no'}`}>
                    <Icon name={p === s.answer ? 'checkc' : 'xc'} />
                    <b>{p === s.answer ? 'Correct.' : `Not quite: the answer is ${LETTERS[s.answer]}.`}</b>
                  </p>
                  <p><b>Why.</b> {s.why}</p>
                  <Cites cites={lk.cites(s.cites)} sources={sources} />
                  <a className="lnk on-dark" href={`#${nodeAnchor(s.id)}`}>Read the step<Icon name="arrow" sm /></a>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="pw-qnav">
        <button type="button" className="btn btn-q" onClick={() => go(cur - 1)} disabled={cur === 0}>
          <span className="pw-flip"><Icon name="arrow" sm /></span>Previous
        </button>
        <p className="pw-qsc" aria-live="polite">
          {answered ? `${right} right of ${answered} answered` : `${n} steps, one question each`}
        </p>
        {last
          ? <button type="button" className="btn btn-q" onClick={restart}>Start over</button>
          : <button type="button" className="btn btn-q" onClick={() => go(cur + 1)}>Next<Icon name="arrow" sm /></button>}
      </div>
    </section>
  );
}
