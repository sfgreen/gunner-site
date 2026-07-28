import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildCopyText, computeReadiness, shareUrl, redditSubmitUrl, type Entry,
} from '../lib/readiness';
import { buildCardModel, drawScoreCard, CARD_W, CARD_H } from '../lib/scoreCard';

type Props = { entries: Entry[]; actual: string; status: string };

// The shareable score card: one canvas is both the on-page preview and the exported
// PNG. Hand-drawn (no html2canvas) so the SVG/web-font handling is deterministic and
// the image is reliable for a Reddit post. Copy-as-text is the primary output for
// comment threads; the PNG is the visual flex.
export default function ScoreShareCard({ entries, actual, status }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [flash, setFlash] = useState<'text' | 'link' | 'img' | 'reddit' | null>(null);
  // Phones can hand the PNG straight to the Reddit app via the share sheet;
  // desktop cannot, so it gets the guided download + composer flow instead.
  const [nativeShare, setNativeShare] = useState(false);
  useEffect(() => {
    try {
      const nav = navigator as Navigator & {
        canShare?: (d: unknown) => boolean;
        userAgentData?: { mobile?: boolean };
      };
      const probe = new File([new Blob()], 'probe.png', { type: 'image/png' });
      const canShareFiles = !!(nav.canShare && nav.canShare({ files: [probe] }));
      // Desktop Chrome also reports canShare(files)=true but has no Reddit app in
      // its share dialog, so only use the native sheet on an actual touch device;
      // everything else gets the guided Post-to-r/step2 flow.
      const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
      const isMobile = nav.userAgentData?.mobile === true || coarse;
      setNativeShare(canShareFiles && isMobile);
    } catch { setNativeShare(false); }
  }, []);

  const model = useMemo(() => buildCardModel(entries, actual, status), [entries, actual, status]);
  const proj = useMemo(() => computeReadiness(entries).proj, [entries]);
  const link = useMemo(() => shareUrl(entries, actual, status), [entries, actual, status]);

  // Ensure the two card faces (DM Sans display + system mono) are resident before
  // the first paint, else the canvas falls back to a default face.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if ('fonts' in document) {
          await (document as Document).fonts.ready;
          await Promise.all(
            ['800 36px "DM Sans"', '700 25px "DM Sans"', '500 23px "DM Sans"']
              .map((f) => (document as Document).fonts.load(f).catch(() => undefined)),
          );
        }
      } catch { /* fall back to system fonts */ }
      if (!cancelled) setFontsReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !model) return;
    const scale = 2; // 2160x2700 backing store -> crisp on retina + crisp PNG export
    canvas.width = CARD_W * scale;
    canvas.height = CARD_H * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawScoreCard(ctx, model, scale);
  }, [model, fontsReady]);

  const ping = (k: 'text' | 'link' | 'img' | 'reddit') => { setFlash(k); setTimeout(() => setFlash(null), 1600); };

  const copyWriteup = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(entries, actual, status, proj));
      ping('text');
    } catch { /* clipboard blocked; the text is still selectable in the preview */ }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); ping('link'); }
    catch { /* ignore */ }
  };

  const withBlob = (cb: (blob: Blob) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => { if (blob) cb(blob); }, 'image/png');
  };

  const download = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'step-gunner-readiness.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // Mobile: native share sheet (attaches the card). Desktop: download the PNG.
  const shareCard = () => {
    withBlob((blob) => {
      const file = new File([blob], 'step-gunner-readiness.png', { type: 'image/png' });
      const nav = navigator as Navigator & {
        canShare?: (d: unknown) => boolean;
        share?: (d: unknown) => Promise<void>;
      };
      if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        nav.share({ files: [file], title: 'My Step 2 CK readiness', text: 'Tracked free on Step Gunner' })
          .then(() => ping('img'))
          .catch(() => { /* user dismissed */ });
        return;
      }
      download(blob);
      ping('img');
    });
  };

  // Desktop one-click: copy the write-up (for the first comment / a text post),
  // download the card to drag in, and open the r/step2 composer with the title in.
  const postToReddit = () => {
    navigator.clipboard?.writeText(buildCopyText(entries, actual, status, proj)).catch(() => { /* still selectable */ });
    window.open(redditSubmitUrl(entries, actual, status), '_blank', 'noopener,noreferrer');
    withBlob(download);
    ping('reddit');
  };

  if (!model) return null;

  const aria = `Step Gunner ${model.kind} card. ${model.heroKicker} ${model.heroValue}. ${model.pctChip}.`;

  return (
    <section className="share" aria-label="Shareable score card">
      <div className="share-head">
        <span className="stag">Your share card</span>
        <span className="shint">Post it to r/step2 or share the link</span>
      </div>

      <div className="canvas-wrap">
        <canvas ref={canvasRef} role="img" aria-label={aria} style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }} />
      </div>

      <div className="actions">
        {nativeShare ? (
          <>
            <button className="act primary wide" onClick={shareCard}>
              {flash === 'img' ? 'Shared' : 'Share card'}
            </button>
            <button className="act" onClick={copyWriteup}>
              {flash === 'text' ? 'Copied' : 'Copy write-up'}
            </button>
            <button className="act ghost" onClick={copyLink}>
              {flash === 'link' ? 'Link copied' : 'Copy link'}
            </button>
          </>
        ) : (
          <>
            <button className="act primary wide" onClick={postToReddit}>
              {flash === 'reddit' ? 'Opening r/step2' : 'Post to r/step2'}
            </button>
            <button className="act" onClick={shareCard}>
              {flash === 'img' ? 'Saved' : 'Download card'}
            </button>
            <button className="act" onClick={copyWriteup}>
              {flash === 'text' ? 'Copied' : 'Copy write-up'}
            </button>
            <button className="act ghost wide" onClick={copyLink}>
              {flash === 'link' ? 'Link copied' : 'Copy link'}
            </button>
          </>
        )}
      </div>
      <p className="share-fine">
        {nativeShare
          ? 'Share card opens your phone share sheet with the card attached. Pick Reddit for an image post, or send it anywhere.'
          : 'Post to r/step2 downloads your card, copies your write-up, and opens the composer. Switch to Images, drag the card in, and paste your write-up as the first comment.'}
      </p>

      <style jsx>{`
        .share { margin-top: 22px; border: 1px solid var(--hair-strong); background: var(--bg-2); border-radius: 16px; padding: 18px; }
        .share-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .stag { font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); }
        .shint { font-family: var(--mono); font-size: 10.5px; color: var(--ink-faint); letter-spacing: 0.2px; }
        .canvas-wrap { display: flex; justify-content: center; }
        .canvas-wrap :global(canvas) { width: 100%; max-width: 360px; height: auto; display: block; border: 1px solid var(--hair); border-radius: 14px; }
        .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
        .act { height: 46px; border-radius: 11px; font-family: var(--mono); font-size: 12.5px; font-weight: 800; letter-spacing: 0.4px; cursor: pointer; border: 1px solid var(--hair-strong); background: var(--bg-3); color: var(--ink); transition: border-color 120ms ease, color 120ms ease; }
        .act:hover { border-color: var(--ink-dim); }
        .act:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
        .act.primary { background: var(--green); color: #05130a; border-color: transparent; box-shadow: 0 6px 22px rgba(70,216,119,0.24); }
        .act.primary:hover { border-color: transparent; transform: translateY(-1px); }
        .act.wide { grid-column: 1 / -1; }
        .act.ghost { background: transparent; color: var(--ink-dim); border-style: dashed; }
        .act.ghost:hover { color: var(--green); border-color: var(--green); }
        .share-fine { color: var(--ink-faint); font-size: 12px; line-height: 1.5; margin: 12px 2px 0; }
        @media (max-width: 380px) { .actions { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}
