import type { GetServerSideProps } from 'next';
import { useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { AppShell, StoreButton } from '../../components/app';
import { referrerHost, track } from '../../lib/analytics';
import { cleanSource, deviceOf, destination, isBot, topicOf, type Device, type Topic } from '../../lib/postLinks';

// stepgunner.com/get/<source>: the "Download Step Gunner now" link at the end of every post.
// The visit is counted server-side (bots and link previews skipped). An iPhone or iPad goes
// straight to the App Store. A laptop gets this page: the post's video in a phone, a QR code
// to finish on the phone (it scans back to this link with ?via=qr, counted as a scan), the
// App Store link and a copy button. Android is told plainly that Step Gunner is an iPhone app
// and offered the web desk. Same pattern as /r/ (invites) and /c/ (Chiefs). Never indexed.

type Props = { source: string; device: Device; topic: Topic };

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, query, req, res }) => {
  const source = cleanSource(params?.src) || 'unknown';
  const ua = req.headers['user-agent'];
  const device = deviceOf(ua);
  if (!isBot(ua)) {
    let refHost = 'direct';
    try {
      const r = req.headers.referer;
      if (r) refHost = new URL(r).hostname.replace(/^www\./, '');
    } catch {
      refHost = 'unknown';
    }
    try {
      const { countVisit } = await import('../../lib/postLinksServer');
      await countVisit(source, device, refHost, { qr: query.via === 'qr' });
    } catch (err) {
      console.error('get link: count failed', { source, err });
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (device === 'ios') return { redirect: { destination: destination(source, device), permanent: false } };
  return { props: { source, device, topic: topicOf(source) } };
};

const COPY: Record<Topic, { eyebrow: string; title: string; accent: string; dek: string; video: string; poster: string;
  points: { k: string; t: string; b: string }[] }> = {
  buddy: {
    eyebrow: 'Study Buddy · Step Gunner',
    title: 'Never study alone.',
    accent: 'alone.',
    dek: 'Rope up with a friend or get matched by exam date, time zone and pace. Every day you both study, the rope glows gold.',
    video: '/media/buddy/buddy-video.mp4',
    poster: '/media/buddy/buddy-video-poster.jpg',
    points: [
      { k: '01', t: 'A streak for both of you', b: 'The rope streak counts the days you both study, not just yours.' },
      { k: '02', t: 'Same 10', b: 'Answer the same questions on your own time, then compare every pick you split on.' },
      { k: '03', t: 'One nudge a day', b: 'One tap reminds your buddy, in their daytime. No chat.' },
    ],
  },
  app: {
    eyebrow: 'Step Gunner · Step 2 CK',
    title: 'Step 2 CK prep for the clerkship year.',
    accent: 'clerkship year.',
    dek: 'Short sessions between patients, spaced review of every miss, and a readiness range checked against real scores.',
    video: '/media/pro/pro-video.mp4',
    poster: '/media/pro/pro-video-poster.jpg',
    points: [
      { k: '01', t: 'Between patients', b: 'Rounds of 10 clinical questions you can finish in a hallway.' },
      { k: '02', t: 'Every miss comes back', b: 'Spaced review brings back what you missed until you get it right.' },
      { k: '03', t: 'A score range, not a guess', b: 'Your NBME and UWSA scores become a Step 2 CK range with its track record published.' },
    ],
  },
};

export default function GetStepGunner({ source, device, topic }: Props) {
  const c = COPY[topic];
  const link = `https://stepgunner.com/get/${source}`;
  const campaign = `post_${source}`;
  const [copied, setCopied] = useState(false);
  const qrSvg = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(`${link}?via=qr`);
    qr.make();
    return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }, [link]);

  useEffect(() => {
    track('get_page_view', { source, device, topic, ref: referrerHost() });
  }, [source, device, topic]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      track('get_copy_link', { source });
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  };

  const [lead, gold] = c.title.endsWith(c.accent) ? [c.title.slice(0, -c.accent.length), c.accent] : [c.title, ''];

  return (
    <AppShell campaign={campaign} pageType="get" page={`/get/${source}`} section={null}
      seo={{ title: 'Get Step Gunner on your iPhone', description: c.dek, path: `/get/${source}`, noindex: true }}>
      <div className="mk isl">
        <div className={`stage-band gt-band${topic === 'buddy' ? ' c-step2' : ''}`}>
          <div className="wrap gt-g">
            <div className="gt-copy">
              <p className="gt-eye"><span className="gt-dot" />{c.eyebrow}</p>
              <h1 className="gt-h">{lead}<span className="gt-acc">{gold}</span></h1>
              <p className="gt-dek">{c.dek}</p>

              {device === 'android' ? (
                <div className="gt-card gt-android">
                  <p className="gt-card-h">Step Gunner is an iPhone and iPad app.</p>
                  <p className="gt-card-b">On Android, the web desk runs in your browser: CK Gold questions with Step Gunner Pro.</p>
                  <div className="gt-btns">
                    <a className="btn btn-act btn-lg" href="/study" onClick={() => track('get_web_desk', { source })}>Study in your browser</a>
                    <StoreButton loc="hero" variant="q" lg ct={campaign}>App Store page</StoreButton>
                  </div>
                </div>
              ) : (
                <div className="gt-card">
                  <div className="gt-qr" aria-label="QR code that opens Step Gunner in the App Store on your iPhone"
                    dangerouslySetInnerHTML={{ __html: qrSvg }} />
                  <div className="gt-qr-c">
                    <p className="gt-card-h">Point your iPhone camera here.</p>
                    <p className="gt-card-b">It opens Step Gunner in the App Store. Free to start, built for iPhone and iPad.</p>
                    <div className="gt-btns">
                      <StoreButton loc="hero" lg ct={campaign}>Open the App Store</StoreButton>
                      <button type="button" className="btn btn-q btn-lg gt-copy-btn" onClick={copy} aria-live="polite">
                        {copied ? 'Link copied' : 'Copy link'}
                      </button>
                    </div>
                    <p className="gt-link">{link.replace('https://', '')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="gt-stage">
              <figure className="device gt-dev">
                <div className="dv">
                  <video src={c.video} poster={c.poster} autoPlay muted loop playsInline preload="metadata"
                    aria-label="Step Gunner in action" />
                </div>
              </figure>
            </div>
          </div>
        </div>
      </div>

      <div className="mk isl">
        <div className="wrap gt-pts">
          {c.points.map((p) => (
            <div key={p.k} className="gt-pt">
              <span className="gt-k">{p.k}</span>
              <p className="gt-pt-t">{p.t}</p>
              <p className="gt-pt-b">{p.b}</p>
            </div>
          ))}
        </div>
        <p className="wrap fine gt-fine">Step Gunner is made by Rezumab LLC. Pro is an optional upgrade inside the app.</p>
      </div>

      <style jsx global>{`
        .mk .gt-band { padding: 40px 0 56px; }
        .mk .gt-g { display: grid; gap: 40px; align-items: center; grid-template-columns: minmax(0, 1fr); }
        .mk .gt-copy { min-width: 0; }
        .mk .gt-eye { display: inline-flex; align-items: center; gap: 10px; font: 700 13px/1 var(--f-mono); letter-spacing: .14em; text-transform: uppercase; color: var(--st-ink-2); }
        .mk .gt-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--st-green); box-shadow: 0 0 10px var(--st-green); }
        .mk .gt-h { margin-top: 20px; font: 800 46px/1.02 var(--f-sans); letter-spacing: -.035em; color: var(--st-ink); text-wrap: balance; }
        .mk .gt-acc { color: var(--st-blue); }
        .mk .gt-band.c-step2 .gt-acc { color: var(--st-gold); }
        .mk .gt-dek { margin-top: 18px; max-width: 34em; font-size: 18px; line-height: 1.55; color: var(--st-ink-2); }
        .mk .gt-card { display: flex; gap: 24px; align-items: center; margin-top: 32px; padding: 20px; border-radius: 24px; background: var(--st-card);
          box-shadow: inset 0 0 0 1px var(--st-line), 0 24px 60px -24px var(--st-shadow); }
        .mk .gt-qr { flex: none; width: 184px; height: 184px; padding: 10px; border-radius: 16px; background: var(--st-white);
          box-shadow: 0 0 0 1px rgba(0,0,0,.06), 0 0 48px -8px var(--st-glow-a); }
        .mk .gt-qr svg { display: block; width: 100%; height: 100%; }
        .mk .gt-qr-c { min-width: 0; }
        .mk .gt-card-h { font: 700 21px/1.25 var(--f-sans); color: var(--st-ink); }
        .mk .gt-card-b { margin-top: 8px; font-size: 16px; line-height: 1.5; color: var(--st-ink-2); }
        .mk .gt-btns { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 18px; }
        .mk .gt-copy-btn { color: var(--st-ink); box-shadow: inset 0 0 0 1px var(--st-line-2); background: transparent; }
        .mk .gt-link { margin-top: 12px; font: 600 13px/1.4 var(--f-mono); letter-spacing: .04em; color: var(--st-ink-3); overflow-wrap: anywhere; }
        .mk .gt-android { display: block; }
        .mk .gt-stage { display: flex; justify-content: center; }
        .mk .gt-dev { width: 280px; }
        .mk .gt-dev video { display: block; width: 100%; aspect-ratio: 9 / 16; object-fit: cover; background: var(--st-screen); }
        .mk .gt-pts { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); padding-block: 40px 8px; }
        .mk .gt-pt { padding: 20px; border-radius: 20px; background: var(--card); box-shadow: inset 0 0 0 1px var(--line); }
        .mk .gt-k { font: 700 13px/1 var(--f-mono); letter-spacing: .12em; color: var(--ink-3); }
        .mk .gt-pt-t { margin-top: 12px; font: 700 19px/1.3 var(--f-sans); color: var(--ink); }
        .mk .gt-pt-b { margin-top: 6px; font-size: 16px; line-height: 1.5; color: var(--ink-2); }
        .mk .gt-fine { padding-block: 16px 56px; }
        @media (min-width: 760px) {
          .mk .gt-pts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .mk .gt-h { font-size: 58px; }
        }
        @media (min-width: 960px) {
          .mk .gt-band { padding: 64px 0 80px; }
          .mk .gt-g { grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr); gap: 56px; }
          .mk .gt-dev { width: 300px; }
        }
        @media (max-width: 600px) {
          .mk .gt-card { flex-direction: column; align-items: flex-start; }
          .mk .gt-h { font-size: 38px; }
          .mk .gt-dev { width: 240px; }
        }
      `}</style>
    </AppShell>
  );
}
