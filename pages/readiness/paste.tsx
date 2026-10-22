import Head from 'next/head';
import { AppShell, Icon } from '../../components/app';
import { useMemo, useState } from 'react';
import { parseScoreList } from '../../lib/parseScores';
import {
  computeReadiness, percentile, ordinal, shortTier, PASS, encodeShare, SHARE_BASE,
} from '../../lib/readiness';

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [usePrefill, setUsePrefill] = useState(true);

  const parsed = useMemo(() => parseScoreList(raw), [raw]);
  const { proj } = useMemo(
    () => computeReadiness(parsed.entries.map((e) => ({ form: e.form, score: e.score, days: e.days }))),
    [parsed],
  );

  const shareLink = useMemo(() => {
    if (!parsed.entries.length) return '';
    const es = parsed.entries.map((e) => ({ form: e.form, score: e.score, days: e.days }));
    return `${SHARE_BASE}?e=${encodeShare(es, actual, '')}`;
  }, [parsed, actual]);

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
    if (footer.trim()) {
      lines.push('');
      lines.push(usePrefill && shareLink ? `${footer.trim().replace(/https?:\/\/\S+$/, '').trim()} ${shareLink}` : footer.trim());
    }
    return lines.join('\n');
  }, [parsed, proj, footer, actual, usePrefill, shareLink]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1600);
    } catch { setCopiedLink(false); }
  };

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
      </Head>

      <AppShell campaign="readiness_paste" section={null}>
        <div className="mk isl">
          <div className="wrap ps-wrap">
            <header className="art-hd ps-hd">
              <h1 className="h-1 ps-h1">Paste to projection</h1>
              <p className="stand">
                Paste a score list from a thread. The projection uses the same model as{' '}
                <a href="/readiness">the calculator</a>, so the number matches.
                <button type="button" className="ps-ex" onClick={() => setRaw(SAMPLE)}>load an example</button>
              </p>
            </header>

            <div className="ps-cols">
              <section className="sheet ps-col" aria-label="Their scores">
                <div className="sheet-bd">
                  <label className="lbl ps-lab" htmlFor="in">Their scores</label>
                  <textarea
                    id="in"
                    className="ps-ta"
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    placeholder={'NBME 11: 220\nNBME 12: 224\nUWSA 2: 237'}
                    spellCheck={false}
                  />

                  <div className="ps-opts">
                    <label className="ps-opt">
                      <span className="lbl">Actual score, if they reported one</span>
                      <input
                        className="inp"
                        inputMode="numeric"
                        value={actual}
                        placeholder="leave blank"
                        onChange={(e) => setActual(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                      />
                    </label>
                    <label className="ps-opt wide">
                      <span className="lbl">Closing line</span>
                      <input className="inp txt" value={footer} onChange={(e) => setFooter(e.target.value)} />
                    </label>
                  </div>
                </div>
              </section>

              <section className="sheet ps-col" aria-label="Reply">
                <div className="sheet-bd">
                  <div className="ps-lab">
                    <label className="lbl" htmlFor="out">Reply</label>
                    {output && (
                      <button type="button" className="btn btn-q ps-copy" onClick={copy}>
                        <Icon name={copied ? 'check' : 'copy'} sm />{copied ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <textarea id="out" className="ps-ta ps-out" readOnly value={output} placeholder="Output appears here." spellCheck={false} />

                  {shareLink && (
                    <div className="ps-link">
                      <label className="ps-tog">
                        <input type="checkbox" checked={usePrefill} onChange={(e) => setUsePrefill(e.target.checked)} />
                        <span>Close with a link that pre-fills their scores</span>
                      </label>
                      <div className="ps-linkrow">
                        <code>{shareLink.slice(0, 46)}...</code>
                        <button type="button" className="btn btn-q ps-copy" onClick={copyLink}>
                          <Icon name={copiedLink ? 'check' : 'copy'} sm />{copiedLink ? 'Copied' : 'Copy link'}
                        </button>
                        <a href={shareLink} target="_blank" rel="noreferrer" className="lnk">open</a>
                      </div>
                    </div>
                  )}
                  <p className="sr" aria-live="polite">{copied || copiedLink ? 'Copied' : ''}</p>

                  {proj && (
                    <ul className="ps-meta">
                      <li><b>{proj.low} to {proj.high}</b></li>
                      <li>midpoint {proj.center}</li>
                      <li>{ordinal(percentile(proj.center))} %ile</li>
                      <li>{shortTier(proj.tier)} band, {'±'}{proj.band}</li>
                      {proj.lowAnchor && <li className="warn"><Icon name="warn" sm />low anchor, widened</li>}
                      {proj.low < PASS && <li className="warn"><Icon name="warn" sm />straddles the {PASS} pass line</li>}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            {/* A dropped form silently changes the anchor, so anything not
                understood is shown loudly rather than swallowed. */}
            {(parsed.unparsed.length > 0 || parsed.unsupported.length > 0) && (
              <div className="ps-flags">
                {parsed.unparsed.length > 0 && (
                  <aside className="trap">
                    <p className="lbl"><Icon name="warn" sm />Not understood, check before posting</p>
                    <ul className="ps-fl">{parsed.unparsed.map((l) => <li key={l}>{l}</li>)}</ul>
                  </aside>
                )}
                {parsed.unsupported.length > 0 && (
                  <aside className="ps-skip">
                    <p className="lbl">Skipped on purpose, the model does not carry these</p>
                    <ul className="ps-fl">{parsed.unsupported.map((l) => <li key={l}>{l}</li>)}</ul>
                  </aside>
                )}
              </div>
            )}

            {parsed.entries.length > 0 && (
              <details className="otp ps-check">
                <summary><span className="lbl">What it read ({parsed.entries.length} forms, order matters when undated)</span><Icon name="chev" sm /></summary>
                <div className="tbl-w" role="region" aria-label="What it read" tabIndex={0}>
                  <table className="tbl">
                    <caption>What it read</caption>
                    <thead><tr><th scope="col" className="n">#</th><th scope="col">Form</th><th scope="col" className="n">Score</th><th scope="col" className="n">Days out</th><th scope="col">From</th></tr></thead>
                    <tbody>
                      {parsed.entries.map((e, i) => (
                        <tr key={e.raw + i}>
                          <td className="n">{i + 1}</td>
                          <th scope="row">{e.form}</th>
                          <td className="n">{e.score}</td>
                          <td className="n">{e.days || <span className="ps-dim">none</span>}</td>
                          <td className="ps-dim">{e.raw}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="fine ps-fine">
                  With no dates the model treats the order you pasted as oldest to newest, and pins a
                  UWSA to the median NBME recency. If they listed newest first, reverse it.
                </p>
              </details>
            )}
          </div>
        </div>
      </AppShell>

      <style jsx global>{`
        .mk .ps-wrap { padding-top: 24px; padding-bottom: 88px; }
        .mk .ps-h1 { font-size: 38px; }
        .mk .ps-hd .stand a { color: var(--key); text-decoration: underline; }
        .mk .ps-ex { display: inline-flex; align-items: center; min-height: 44px; margin-left: 8px; padding: 0 4px; border: 0; background: none; cursor: pointer; color: var(--key); font: inherit; text-decoration: underline; text-underline-offset: .2em; }
        .mk .ps-cols { display: grid; gap: 16px; margin-top: 32px; }
        .mk .ps-col { min-width: 0; }
        .mk .ps-lab { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; margin-bottom: 8px; }
        .mk .ps-ta { display: block; width: 100%; min-height: 240px; padding: 12px 16px; border: 0; border-radius: var(--r-sm); background: var(--card); color: var(--ink); box-shadow: inset 0 0 0 1px var(--ctl); font: 500 16px/1.6 var(--f-mono); font-feature-settings: "zero" 1; resize: vertical; }
        .mk .ps-ta::placeholder { color: var(--ink-3); opacity: 1; }
        .mk .ps-ta:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }
        .mk .ps-out { background: var(--card-2); }
        .mk .ps-copy { min-height: 44px; padding: 0 16px; font-size: 16px; }
        .mk .ps-opts { display: grid; gap: 12px; margin-top: 16px; }
        .mk .ps-opt { display: grid; gap: 8px; min-width: 0; }
        .mk .ps-opt .inp { font-size: 16px; }
        .mk .ps-link { margin-top: 16px; }
        .mk .ps-tog { display: flex; align-items: center; gap: 8px; min-height: 44px; font-size: 16px; cursor: pointer; }
        .mk .ps-tog input { width: 20px; height: 20px; accent-color: var(--act); }
        .mk .ps-linkrow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px; }
        .mk .ps-linkrow code { min-width: 0; padding: 4px 8px; border-radius: 8px; background: var(--card-2); box-shadow: inset 0 0 0 1px var(--line); font: 500 13px/1.5 var(--f-mono); color: var(--ink-2); overflow-wrap: anywhere; }
        .mk .ps-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 16px; font: 500 15px/1.5 var(--f-mono); color: var(--ink-2); }
        .mk .ps-meta b { color: var(--ink); }
        .mk .ps-meta .warn { display: inline-flex; align-items: center; gap: 4px; color: var(--step2); font-weight: 600; }
        .mk .ps-flags { display: grid; gap: 12px; margin-top: 16px; }
        .mk .ps-skip { padding: 16px 20px; border-radius: var(--r-md); background: var(--step2-tint); box-shadow: inset 4px 0 0 var(--step2); }
        .mk .ps-skip .lbl { color: var(--step2); }
        .mk .ps-fl { margin-top: 8px; display: grid; gap: 4px; font: 500 15px/1.5 var(--f-mono); color: var(--ink); overflow-wrap: anywhere; }
        .mk .ps-check { margin-top: 16px; }
        .mk .ps-check summary .lbl { text-transform: none; letter-spacing: .02em; }
        .mk .ps-check .tbl-w { margin-bottom: 8px; }
        .mk .ps-dim { color: var(--ink-3); }
        .mk .ps-fine { padding-bottom: 16px; max-width: 70ch; }
        @media (min-width: 600px) { .mk .ps-opts { grid-template-columns: minmax(0, 200px) minmax(0, 1fr); } }
        @media (min-width: 960px) { .mk .ps-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); } .mk .ps-ta { min-height: 300px; } }
      `}</style>
    </>
  );
}
