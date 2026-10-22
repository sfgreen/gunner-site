import { Fragment } from 'react';
import type { Cite, OrderStatus } from '../../lib/pathways/view';

// Shared atoms for the pathway article and hub, in the app look (components/app).
// The sprite icons come from the blocks (Icon); the four glyphs the sprite has no
// symbol for are drawn here with the same stroke, so both read as one set. Status
// is always icon plus word, never color alone.

const PATHS: Record<'branch' | 'ext' | 'dash' | 'box', string> = {
  branch: 'M7 21V3M7 13c0-4.5 3.5-7 10-7M14 3l3 3-3 3',
  ext: 'M8 16L16 8M10 8h6v6',
  dash: 'M6 12h12',
  box: 'M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4z',
};

export function PwIcon({ name, sm = true }: { name: keyof typeof PATHS; sm?: boolean }) {
  return (
    <svg className={`ic${sm ? ' sm' : ''}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The app-look scope for markup that is not a block: the .mk vocabulary applies inside. */
export function Mk({ children }: { children: React.ReactNode }) {
  return <div className="mk isl">{children}</div>;
}

/** End a line with a full stop unless it already has closing punctuation. */
export const sentence = (s: string): string => (/[.!?:)]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

export type Source = { label: string; title: string; url: string };

const NEW_TAB = { target: '_blank', rel: 'nofollow noopener noreferrer', 'aria-describedby': 'pw-newtab' } as const;

/** The mono source line under an order, a step or a calculator: each citation's
 *  label (linked) and where in the source, as the wards articles print them. */
export function Cites({ cites, sources }: { cites: Cite[]; sources: Source[] }) {
  if (!cites.length) return null;
  return (
    <p className="srcl">
      {cites.map((c, i) => {
        const s = c.src >= 0 ? sources[c.src] : null;
        const label = s ? s.label : c.label || 'Source';
        return (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            {s && s.url ? <a href={s.url} {...NEW_TAB}>{label}</a> : <span>{label}</span>}
            {c.where && <>, {c.where}</>}
          </Fragment>
        );
      })}
    </p>
  );
}

/** One linked label per source (the short answer's line), deduplicated. */
export function SourceLine({ src, sources }: { src: number[] | undefined; sources: Source[] }) {
  const xs = (src || []).map((i) => sources[i]).filter(Boolean);
  if (!xs.length) return null;
  return (
    <>
      {xs.map((s, i) => (
        <Fragment key={s.url || s.label}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <a href={s.url} {...NEW_TAB}>{s.label}</a>
        </Fragment>
      ))}
    </>
  );
}

const STATUS: Record<OrderStatus, { word: string; icon: 'check' | 'x' | 'warn' | 'dash' }> = {
  ok: { word: 'Use', icon: 'check' },
  avoid: { word: 'Avoid', icon: 'x' },
  conflict: { word: 'Sources differ', icon: 'warn' },
  pending: { word: 'Not stated', icon: 'dash' },
};

const SPRITE = new Set(['check', 'x', 'warn']);

export function StatusChip({ status = 'ok' }: { status?: OrderStatus }) {
  const s = STATUS[status] || STATUS.ok;
  return (
    <span className={`pw-chip ${status}`}>
      {SPRITE.has(s.icon)
        ? <svg className="ic sm" aria-hidden="true"><use href={`#i-${s.icon}`} /></svg>
        : <PwIcon name="dash" />}
      {s.word}
    </span>
  );
}

/** Screen-reader text for "opens in a new tab", referenced by every citation. */
export function NewTabNote() {
  return <span id="pw-newtab" className="sr">Opens in a new tab</span>;
}

/** A label only phones see: the column header of a table cell once rows stack
 *  (display: none from 600px, where the table has its own header row). Not
 *  aria-hidden: a stacked table can lose its header semantics in Safari. */
export function CellLabel({ children }: { children: React.ReactNode }) {
  return <span className="pw-cl">{children}</span>;
}
