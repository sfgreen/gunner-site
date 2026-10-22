import { Fragment, useId, useState } from 'react';
import { Icon } from '../app';
import { Cites, Source } from './ui';
import { runFormula, pointsTotal, bandFor, prettyExpr } from '../../lib/pathways/calc';
import { calcAnchor, nodeAnchor } from '../../lib/pathways/view';
import type { CalcVM, Lookup } from '../../lib/pathways/view';

// One bedside calculator, entirely from content: inputs, formula, bands, note and
// sources come from the pathway JSON, the arithmetic from lib/pathways/calc (the
// grammar parser, no eval), whose results scripts/test_pathway_calcs.mjs checks
// against every calculator's own worked examples. A dark app card, the same
// fields and inputs as the ABG interpreter (.fld, .inp). It renders at the
// defaults on the server, so the numbers are there before any script runs.

export default function Calculator({ calc, sources, lk }: { calc: CalcVM; sources: Source[]; lk: Lookup }) {
  const uid = useId();
  const inputs = calc.inputs || [];
  const [raw, setRaw] = useState<Record<string, string>>(() =>
    Object.fromEntries(inputs.map((i) => [i.id, String(i.default)])),
  );
  const [picks, setPicks] = useState<Record<string, number>>({});
  const labels = Object.fromEntries(inputs.map((i) => [i.id, i.label]));
  const anchor = calcAnchor(calc.id);

  // A typed value outside the range the calculator was checked over shows no
  // result; a guess at an extreme value is worse than none.
  const problems: string[] = [];
  const values: Record<string, number> = {};
  for (const i of inputs) {
    const v = Number(raw[i.id]);
    if (raw[i.id] === '' || !Number.isFinite(v)) problems.push(`Enter a value for ${i.label.toLowerCase()}.`);
    else if (!i.choices && ((i.min !== undefined && v < i.min) || (i.max !== undefined && v > i.max))) {
      problems.push(`${i.label}: enter ${i.min} to ${i.max}${i.unit ? ` ${i.unit}` : ''}.`);
    }
    values[i.id] = v;
  }
  const bad = (id: string, i: (typeof inputs)[number]) => {
    const v = Number(raw[id]);
    return raw[id] === '' || !Number.isFinite(v) || (!i.choices && ((i.min !== undefined && v < i.min) || (i.max !== undefined && v > i.max)));
  };

  return (
    <section className="sheet dark-card pw-calc" id={anchor} aria-labelledby={`${anchor}-h`}>
      <div className="sheet-hd">
        <h3 className="lbl" id={`${anchor}-h`}>{calc.title}</h3>
      </div>
      <div className="sheet-bd">
        {calc.kind === 'formula' ? (
          <>
            <div className="pw-flds">
              {inputs.map((i) => {
                const fid = `${uid}-${i.id}`;
                return (
                  <div className={`fld${i.choices ? ' pw-wide' : ''}`} key={i.id}>
                    <label htmlFor={fid}>
                      <span>{i.label}</span>
                      {i.unit && <span className="u">{i.unit}</span>}
                    </label>
                    {i.choices ? (
                      <span className="sel">
                        <select id={fid} className="inp" value={raw[i.id]} onChange={(e) => setRaw({ ...raw, [i.id]: e.target.value })}>
                          {i.choices.map((c) => <option key={c.label} value={String(c.value)}>{c.label}</option>)}
                        </select>
                        <Icon name="chev" sm />
                      </span>
                    ) : (
                      <input
                        id={fid}
                        className="inp"
                        type="number"
                        inputMode="decimal"
                        min={i.min}
                        max={i.max}
                        step={i.step ?? 'any'}
                        value={raw[i.id]}
                        aria-invalid={bad(i.id, i) || undefined}
                        onChange={(e) => setRaw({ ...raw, [i.id]: e.target.value })}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="pw-out" aria-live="polite">
              {problems.length ? (
                <p className="err">{problems[0]}</p>
              ) : (
                runFormula(calc, values).map((r) => (
                  <div className="pw-orow" key={r.label}>
                    <span className="lbl">{r.label}</span>
                    <span className="pw-ov num">
                      {r.shown}
                      {r.value !== null && r.unit && <small> {r.unit}</small>}
                    </span>
                    {r.band && <span className="pw-ob">{r.band}</span>}
                  </div>
                ))
              )}
            </div>
            <div className="pw-form">
              {(calc.outputs || []).map((o) => (
                <p key={o.label}><b>{o.label}</b> = {prettyExpr(o.expr, labels)}</p>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="pw-flds pw-pts">
              {(calc.items || []).map((it) => {
                const fid = `${uid}-${it.id}`;
                return (
                  <div className="fld" key={it.id}>
                    <label htmlFor={fid}><span>{it.label}</span></label>
                    <span className="sel">
                      <select id={fid} className="inp" value={String(picks[it.id] ?? 0)} onChange={(e) => setPicks({ ...picks, [it.id]: Number(e.target.value) })}>
                        {it.options.map((o, k) => (
                          <option key={k} value={String(k)}>
                            {o.label} ({o.points >= 0 ? '+' : ''}{o.points})
                          </option>
                        ))}
                      </select>
                      <Icon name="chev" sm />
                    </span>
                  </div>
                );
              })}
            </div>
            {(() => {
              const total = pointsTotal(calc, picks);
              const band = bandFor(calc.bands, total);
              return (
                <div className="pw-out" aria-live="polite">
                  <div className="pw-orow">
                    <span className="lbl">Total</span>
                    <span className="pw-ov num">{total}</span>
                    {band && <span className="pw-ob">{band.text}</span>}
                  </div>
                </div>
              );
            })()}
            {calc.bands && calc.bands.length > 0 && (
              <ul className="pw-bands" aria-label="Score bands">
                {calc.bands.map((b) => <li key={b.text}>{b.text}</li>)}
              </ul>
            )}
          </>
        )}
        {calc.kind === 'formula' && (calc.outputs || []).some((o) => o.bands && o.bands.length) && (
          <ul className="pw-bands" aria-label="Bands">
            {(calc.outputs || []).flatMap((o) => (o.bands || []).map((b) => <li key={`${o.label}-${b.text}`}>{b.text}</li>))}
          </ul>
        )}
        {calc.note && <p className="pw-cnote">{calc.note}</p>}
        <Cites cites={lk.cites(calc.cites)} sources={sources} />
        {calc.usedBy && calc.usedBy.length > 0 && (
          <p className="pw-used">
            Used at:{' '}
            {calc.usedBy.map((id, k) => (
              <Fragment key={id}>
                {k > 0 && '; '}
                <a href={`#${nodeAnchor(id)}`}>{lk.step(id)?.ask}</a>
              </Fragment>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
