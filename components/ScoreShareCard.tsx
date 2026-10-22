import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildCopyText, computeReadiness, shareUrl, redditSubmitUrl, type Entry,
} from '../lib/readiness';
import { track } from '../lib/analytics';
import { buildCardModel, drawScoreCard, cardHeight, CARD_W } from '../lib/scoreCard';

type Props = { entries: Entry[]; actual: string; status: string };

// The shareable score card: one canvas is both the on-page preview and the exported
// PNG. Hand-drawn (no html2canvas) so the SVG/web-font handling is deterministic and
// the image is reliable for a Reddit post. Copy-as-text is the primary output for
// comment threads; the PNG is the visual flex.
export default function ScoreShareCard({ entries, actual, status }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [flash, setFlash] = useState<'text' | 'link' | 'img' | 'reddit' | 'embed' | null>(null);
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
  // The frameable /embed URL is the share link with /readiness swapped for /embed, so
  // the encoding stays single-sourced in shareUrl. The snippet is what a blog pastes.
  const embedCode = useMemo(
    () => `<iframe src="${link.replace('/readiness?', '/embed?')}" width="480" height="620" style="border:0;border-radius:16px;max-width:100%" loading="lazy" title="Step 2 CK readiness"></iframe>`,
    [link],
  );

  // The card is an image (the PNG export and the on-page preview are one canvas), drawn
  // in the same face as its OG twin (/api/og): DM Sans from the bundled /og TTFs. The
  // page itself is Inter, so the face is registered for the canvas only (FontFace),
  // never as a page stylesheet, and the first paint waits for it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if ('fonts' in document && typeof FontFace !== 'undefined') {
          const fs = (document as Document).fonts;
          const have = (w: string) => Array.from(fs as unknown as Iterable<FontFace>).some((f) => f.family.replace(/"/g, '') === 'DM Sans' && f.weight === w);
          await Promise.all([['600', '/og/dmsans-600.ttf'], ['800', '/og/dmsans-800.ttf']].map(async ([w, url]) => {
            if (have(w)) return;
            const face = new FontFace('DM Sans', `url(${url})`, { weight: w });
            fs.add(await face.load());
          }));
          await fs.ready;
        }
      } catch { /* fall back to system fonts */ }
      if (!cancelled) setFontsReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !model) return;
    const scale = 2; // 2x backing store -> crisp on retina + crisp PNG export
    canvas.width = CARD_W * scale;
    canvas.height = cardHeight(model) * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawScoreCard(ctx, model, scale);
  }, [model, fontsReady]);

  const ping = (k: 'text' | 'link' | 'img' | 'reddit' | 'embed') => { setFlash(k); setTimeout(() => setFlash(null), 1600); };

  const copyWriteup = async () => {
    track('share_action', { method: 'writeup' });
    try {
      await navigator.clipboard.writeText(buildCopyText(entries, actual, status, proj));
      ping('text');
    } catch { /* clipboard blocked; the text is still selectable in the preview */ }
  };

  const copyLink = async () => {
    track('share_action', { method: 'link' });
    try { await navigator.clipboard.writeText(link); ping('link'); }
    catch { /* ignore */ }
  };

  const copyEmbed = async () => {
    track('share_action', { method: 'embed' });
    try { await navigator.clipboard.writeText(embedCode); ping('embed'); }
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
    track('share_action', { method: nativeShare ? 'native_share' : 'download' });
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
    track('share_action', { method: 'reddit' });
    navigator.clipboard?.writeText(buildCopyText(entries, actual, status, proj)).catch(() => { /* still selectable */ });
    window.open(redditSubmitUrl(entries, actual, status), '_blank', 'noopener,noreferrer');
    withBlob(download);
    ping('reddit');
  };

  if (!model) return null;

  const aria = `Step Gunner ${model.kind} card. ${model.heroKicker} ${model.heroValue}. ${model.pctChip}.`;

  return (
    <div className="mk isl">
      <section className="sheet dark-card tl-share" aria-labelledby="tl-share-h">
        <div className="sheet-hd">
          <h2 className="lbl" id="tl-share-h"><span className="dot gold" aria-hidden="true" />Your share card</h2>
          <span className="lbl">Post it to r/step2 or share the link</span>
        </div>
        <div className="sheet-bd">
          <div className="tl-canvas">
            <canvas ref={canvasRef} role="img" aria-label={aria} style={{ aspectRatio: `${CARD_W} / ${cardHeight(model)}` }} />
          </div>

          <div className="tl-acts">
            {nativeShare ? (
              <>
                <button type="button" className="btn btn-ink wide" onClick={shareCard}>
                  {flash === 'img' ? 'Shared' : 'Share card'}
                </button>
                <button type="button" className="btn btn-q" onClick={copyWriteup}>
                  <Ic n="copy" />{flash === 'text' ? 'Copied' : 'Copy write-up'}
                </button>
                <button type="button" className="btn btn-q" onClick={copyLink}>
                  <Ic n="copy" />{flash === 'link' ? 'Link copied' : 'Copy link'}
                </button>
                <button type="button" className="btn btn-q wide" onClick={copyEmbed}>
                  <Ic n="copy" />{flash === 'embed' ? 'Embed copied' : 'Copy embed'}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-ink wide" onClick={postToReddit}>
                  {flash === 'reddit' ? 'Opening r/step2' : 'Post to r/step2'}
                </button>
                <button type="button" className="btn btn-q" onClick={shareCard}>
                  <Ic n="load" />{flash === 'img' ? 'Saved' : 'Download card'}
                </button>
                <button type="button" className="btn btn-q" onClick={copyWriteup}>
                  <Ic n="copy" />{flash === 'text' ? 'Copied' : 'Copy write-up'}
                </button>
                <button type="button" className="btn btn-q" onClick={copyLink}>
                  <Ic n="copy" />{flash === 'link' ? 'Link copied' : 'Copy link'}
                </button>
                <button type="button" className="btn btn-q" onClick={copyEmbed}>
                  <Ic n="copy" />{flash === 'embed' ? 'Embed copied' : 'Copy embed'}
                </button>
              </>
            )}
          </div>
          <p className="sr" aria-live="polite">{flash === 'img' && nativeShare ? 'Shared' : flash ? FLASH[flash] : ''}</p>
          <p className="fine tl-share-fine">
            {nativeShare
              ? 'Share card opens your phone share sheet with the card attached. Pick Reddit for an image post, or send it anywhere.'
              : 'Post to r/step2 downloads your card, copies your write-up, and opens the composer. Switch to Images, drag the card in, and paste your write-up as the first comment.'}
          </p>
        </div>
      </section>

      <style jsx global>{`
        .mk .tl-share .sheet-hd h2.lbl { display: inline-flex; align-items: center; gap: 8px; color: var(--st-ink-2); }
        .mk .tl-share .sheet-hd > span.lbl { text-transform: none; letter-spacing: 0; font-weight: 500; }
        .mk .tl-canvas { display: flex; justify-content: center; }
        .mk .tl-canvas canvas { display: block; width: 100%; max-width: 360px; height: auto; border-radius: 16px; box-shadow: 0 0 0 1px var(--st-line-2), 0 24px 48px -24px var(--st-shadow); }
        .mk .tl-acts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 20px; }
        .mk .tl-acts .btn { width: 100%; font-size: 16px; padding: 0 12px; }
        .mk .tl-acts .btn.wide { grid-column: 1 / -1; }
        .mk .tl-share p.tl-share-fine { margin-top: 12px; color: var(--st-ink-3); }
        @media (max-width: 379px) { .mk .tl-acts { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
    </div>
  );
}

const FLASH = { text: 'Copied', link: 'Link copied', img: 'Saved', reddit: 'Opening r/step2', embed: 'Embed copied' } as const;
const Ic = ({ n }: { n: 'copy' | 'load' }) => <svg className="ic sm" aria-hidden="true"><use href={`#i-${n}`} /></svg>;
