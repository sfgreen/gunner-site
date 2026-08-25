import Head from 'next/head';
import { useMemo, useState } from 'react';
import { parseScoreList } from '../../lib/parseScores';
import { computeReadiness, percentile, ordinal, shortTier, PASS } from '../../lib/readiness';

// Internal tool: paste a Reddit score list, get the reply back.
//
// Deliberately noindex and out of the sitemap. It is not a second calculator
// competing with /readiness for the same query, it is the thing that makes
// answering "what's my predicted score" threads take five seconds instead of
// two minutes of retyping.
//
// It reuses computeReadiness, so the number it prints is the number /readiness
// and the app print for the same forms. Verified against a real posted reply:
// the six-form example below returns 232 to 254, matching what was posted.

const DEFAULT_FOOTER =
  'You can sharpen your projection using this free calculator on Step Gunner: https://stepgunner.com/readiness';

const SAMPLE = `NBME 11: 220
NBME 12: 224
NBME 13: 226
NBME 14: 228
NBME 15: 238
UWSA 2: 237`;

export default function Paste() {
  const [raw, setRaw] = useState('');
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [actual, setActual] = useState('');
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseScoreList(raw), [raw]);
  const { proj } = useMemo(
    () => computeReadiness(parsed.entries.map((e) => ({ form: e.form, score: e.score, days: e.days }))),
    [parsed],
  );

  const output = useMemo(() => {
    if (!parsed.entries.length) return '';
    const anyDated = parsed.entries.some((e) => e.days.trim() !== '');
    const lines = parsed.entries.map((e) => {
      const tail = e.days.trim() !== ''
        ? ` (${e.days} days out)`
        : anyDated ? ' (timing not reported)' : '';
      return `${e.form}: ${e.score}${tail}`;
    });
    lines.push('');
    const act = parseInt(actual, 10);
    if (!Number.isNaN(act)) lines.push(`Actual Step 2 CK: ${act}`);
    else if (proj) lines.push(`Projected Step 2 CK: ${proj.low} to ${proj.high} (est.)`);
    if (footer.trim()) { lines.push(''); lines.push(footer.trim()); }
    return lines.join('\n');
  }, [parsed, proj, footer, actual]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <Head>
        <title>Paste to projection</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="page">
        <header>
          <h1>Paste to projection</h1>
          <p>
            Paste a score list from a thread. The projection uses the same model as{' '}
            <a href="/readiness">the calculator</a>, so the number matches.
            <button type="button" className="lnk" onClick={() => setRaw(SAMPLE)}>load an example</button>
          </p>
        </header>

        <div className="cols">
          <section>
            <label className="lbl" htmlFor="in">Their scores</label>
            <textarea
              id="in"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={'NBME 11: 220\nNBME 12: 224\nUWSA 2: 237'}
              spellCheck={false}
            />

            <div className="opts">
              <label className="opt">
                <span>Actual score, if they reported one</span>
                <input
                  inputMode="numeric"
                  value={actual}
                  placeholder="leave blank"
                  onChange={(e) => setActual(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                />
              </label>
              <label className="opt wide">
                <span>Closing line</span>
                <input value={footer} onChange={(e) => setFooter(e.target.value)} />
              </label>
            </div>
          </section>

          <section>
            <label className="lbl" htmlFor="out">
              Reply
              {output && (
                <button type="button" className={'copy' + (copied ? ' done' : '')} onClick={copy}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </label>
            <textarea id="out" readOnly value={output} placeholder="Output appears here." spellCheck={false} />

            {proj && (
              <div className="meta">
                <span><b>{proj.low} to {proj.high}</b></span>
                <span>midpoint {proj.center}</span>
                <span>{ordinal(percentile(proj.center))} %ile</span>
                <span>{shortTier(proj.tier)} band, {'±'}{proj.band}</span>
                {proj.lowAnchor && <span className="warn">low anchor, widened</span>}
                {proj.low < PASS && <span className="warn">straddles the {PASS} pass line</span>}
              </div>
            )}
          </section>
        </div>

        {/* A dropped form silently changes the anchor, so anything not
            understood is shown loudly rather than swallowed. */}
        {(parsed.unparsed.length > 0 || parsed.unsupported.length > 0) && (
          <div className="flags">
            {parsed.unparsed.length > 0 && (
              <div className="flag bad">
                <b>Not understood, check before posting</b>
                <ul>{parsed.unparsed.map((l) => <li key={l}>{l}</li>)}</ul>
              </div>
            )}
            {parsed.unsupported.length > 0 && (
              <div className="flag">
                <b>Skipped on purpose, the model does not carry these</b>
                <ul>{parsed.unsupported.map((l) => <li key={l}>{l}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        {parsed.entries.length > 0 && (
          <details className="check">
            <summary>What it read ({parsed.entries.length} forms, order matters when undated)</summary>
            <table>
              <thead><tr><th>#</th><th>Form</th><th className="r">Score</th><th className="r">Days out</th><th>From</th></tr></thead>
              <tbody>
                {parsed.entries.map((e, i) => (
                  <tr key={e.raw + i}>
                    <td className="n">{i + 1}</td>
                    <td>{e.form}</td>
                    <td className="r n">{e.score}</td>
                    <td className="r n">{e.days || <span className="dim">none</span>}</td>
                    <td className="dim">{e.raw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fine">
              With no dates the model treats the order you pasted as oldest to newest, and pins a
              UWSA to the median NBME recency. If they listed newest first, reverse it.
            </p>
          </details>
        )}
      </div>

      <style jsx global>{`
        :root {
          --bg: #faf9f6; --bg-2: #ffffff; --bg-3: #f3f2ee;
          --hair: rgba(25,28,35,0.10); --hair-strong: rgba(25,28,35,0.17);
          --ink: #191c23; --ink-dim: #5d6470; --ink-faint: #9aa0ab;
          --green: #0d9448; --gold: #b87400; --red: #c0392b;
          --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          --sans: 'DM Sans', -apple-system, system-ui, sans-serif;
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--sans); }
      `}</style>
      <style jsx>{`
        .page { max-width: 1080px; margin: 0 auto; padding: 30px 20px 70px; }
        header { margin-bottom: 20px; }
        h1 { font-size: 26px; letter-spacing: -0.02em; margin: 0 0 5px; }
        header p { color: var(--ink-dim); margin: 0; font-size: 15px; }
        header a { color: #2f6fed; }
        .lnk {
          background: none; border: none; color: #2f6fed; font: inherit;
          cursor: pointer; padding: 0 0 0 8px; text-decoration: underline;
        }
        .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .lbl {
          display: flex; align-items: center; justify-content: space-between;
          font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--ink-faint); font-weight: 700;
          margin-bottom: 6px; min-height: 26px;
        }
        textarea {
          width: 100%; min-height: 260px; font-family: var(--mono); font-size: 14px;
          line-height: 1.62; padding: 13px 15px; border-radius: 9px;
          border: 1px solid var(--hair-strong); background: var(--bg-2); color: var(--ink);
          resize: vertical;
        }
        textarea:focus { outline: 2px solid #2f6fed; outline-offset: 1px; }
        #out { background: var(--bg-3); }
        .copy {
          font-family: var(--sans); font-size: 12px; font-weight: 700; letter-spacing: 0.02em;
          text-transform: none; padding: 5px 13px; border-radius: 6px; cursor: pointer;
          background: var(--ink); color: var(--bg); border: 1px solid var(--ink);
        }
        .copy.done { background: var(--green); border-color: var(--green); }
        .opts { display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
        .opt { display: flex; flex-direction: column; gap: 5px; flex: 0 0 auto; }
        .opt.wide { flex: 1 1 260px; }
        .opt span {
          font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--ink-faint); font-weight: 700;
        }
        .opt input {
          font: inherit; font-size: 14px; padding: 8px 11px; border-radius: 7px;
          border: 1px solid var(--hair-strong); background: var(--bg-2); color: var(--ink);
        }
        .meta {
          display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 10px;
          font-family: var(--mono); font-size: 12px; color: var(--ink-dim);
        }
        .meta .warn { color: var(--gold); }
        .flags { display: grid; gap: 10px; margin-top: 18px; }
        .flag {
          border-left: 3px solid var(--gold); background: rgba(224,142,0,0.08);
          padding: 11px 15px; border-radius: 0 8px 8px 0; font-size: 14px;
        }
        .flag.bad { border-left-color: var(--red); background: rgba(192,57,43,0.08); }
        .flag ul { margin: 6px 0 0; padding-left: 18px; font-family: var(--mono); font-size: 12.5px; }
        .check { margin-top: 18px; }
        .check summary {
          cursor: pointer; font-family: var(--mono); font-size: 11.5px;
          letter-spacing: 0.06em; color: var(--ink-dim);
        }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 14px; }
        th {
          text-align: left; font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--ink-faint); padding: 8px 10px;
          border-bottom: 1px solid var(--hair-strong);
        }
        td { padding: 7px 10px; border-bottom: 1px solid var(--hair); }
        .r { text-align: right; }
        .n { font-variant-numeric: tabular-nums; }
        .dim { color: var(--ink-faint); }
        .fine { font-size: 13px; color: var(--ink-dim); margin: 10px 0 0; }
        @media (max-width: 760px) { .cols { grid-template-columns: 1fr; } textarea { min-height: 190px; } }
      `}</style>
    </>
  );
}
