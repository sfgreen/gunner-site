import Link from 'next/link';
import { track, referrerHost } from '../../lib/analytics';
import { PRO } from '../../lib/app/pro';

// "What happens next, with Pro": the gold-edged card right after a tool's result
// (/readiness, /step-2-score-predictor). Rendered inside a Stage, inside its own .mk
// scope; styles/pro.css (.pr-next). The headline is computed from the visitor's own most
// likely score and 270, and never shows a negative gap: at or above 270 it says to stay
// there. No result, no card (the page's own ask carries the visit). GA4 pro_click
// {location: 'readiness' | 'predictor'} on the button.

export const GOAL = 270;

/** The headline parts for a most-likely score: plain text before the gold, then the gold words. */
export function proGap(mostLikely: number): { lead: string; gold: string; gap: number } {
  const c = Math.round(mostLikely);
  if (c >= GOAL) return { lead: '', gold: 'Stay at 270 through test day.', gap: 0 };
  const gap = GOAL - c;
  return { lead: `From ${c} to ${GOAL}: `, gold: `the ${gap} ${gap === 1 ? 'point' : 'points'}, planned.`, gap };
}

const STEPS: [string, string][] = [
  ['Every form becomes a flag on your climb.', 'Pro ranks the systems leaking the most points.'],
  ['Each day ranked for you.', 'Your weakest systems first, weighted by what Step 2 tests most.'],
  ['Know the day you are ready.', 'Your next form, and when your range clears your goal.'],
];

export default function ProNext({ mostLikely, location, forms = 'these' }: {
  /** The visitor's most likely Step 2 CK score (the projection's center). */
  mostLikely: number;
  location: 'readiness' | 'predictor';
  /** "Log these forms" or "Log this form". */
  forms?: 'these' | 'this';
}) {
  const g = proGap(mostLikely);
  return (
    <div className="mk isl">
      <section className="pr-next" aria-labelledby={`${location}-pro-h`}>
        <div className="pr-next-c">
          <p className="pr-eyebrow"><span className="pr-dot" aria-hidden="true" />WHAT HAPPENS NEXT, WITH PRO</p>
          <h3 className="pr-next-h" id={`${location}-pro-h`}>{g.lead}<span className="pr-gold">{g.gold}</span></h3>
          <div className="pr-next-act">
            <Link
              className="pr-btn"
              href="/pro"
              onClick={() => track('pro_click', { location, item: 'get_pro', gap: g.gap, target: '/pro', page: `/${location === 'readiness' ? 'readiness' : 'step-2-score-predictor'}`, ref: referrerHost() })}
            >
              Get Pro
              <svg className="pr-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
            <p className="pr-next-pr"><b>{PRO.yearly.price}</b> a year, or <b>{PRO.monthly.price}</b> a month.<br />Log {forms} {forms === 'this' ? 'form' : 'forms'} in the app to start.</p>
          </div>
        </div>
        <ol className="pr-next-steps">
          {STEPS.map(([b, t], i) => (
            <li key={b}><span className="pr-n" aria-hidden="true">{i + 1}</span><span><b>{b}</b> {t}</span></li>
          ))}
        </ol>
      </section>
    </div>
  );
}
