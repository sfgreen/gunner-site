import { useState } from 'react';
import { Cites, Icon, Source } from './ui';
import type { Cite } from '../../lib/pathways/data';

// The step's own options as a self-test. Options arrive shuffled with a stable
// seed (the JSON keys every answer first); the first pick locks the check and
// reveals the rationale and its sources. Right and wrong are marked by icon and
// word as well as colour, and the result is announced politely.
const LETTERS = 'ABCDEFGH';

export default function QuickCheck({ id, ask, options, answer, why, cites, sources }: {
  id: string; ask: string; options: string[]; answer: number; why: string; cites: Cite[]; sources: Source[];
}) {
  const [pick, setPick] = useState<number | null>(null);
  const done = pick !== null;
  const qid = `q-${id}`;
  return (
    <div className="pw-quiz" role="group" aria-labelledby={qid}>
      <p className="pw-qk">Quick check</p>
      <p className="pw-qa" id={qid}>{ask}</p>
      <div className="pw-opts">
        {options.map((o, i) => {
          const right = done && i === answer;
          const wrong = done && i === pick && i !== answer;
          return (
            <button
              key={i}
              type="button"
              className={`pw-opt${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`}
              aria-disabled={done || undefined}
              onClick={() => { if (!done) setPick(i); }}
            >
              <span className="pw-opt-l" aria-hidden="true">{right ? <Icon name="check" /> : wrong ? <Icon name="x" /> : LETTERS[i]}</span>
              <span className="pw-opt-t">
                {o}
                {right && <span className="pw-sr"> (correct answer)</span>}
                {wrong && <span className="pw-sr"> (your pick)</span>}
              </span>
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {done && (
          <div className="pw-why">
            <p>
              <b>{pick === answer ? 'Correct.' : `Not quite: the answer is ${LETTERS[answer]}.`}</b> <b>Why.</b> {why}
            </p>
            <Cites cites={cites} sources={sources} />
          </div>
        )}
      </div>
    </div>
  );
}
