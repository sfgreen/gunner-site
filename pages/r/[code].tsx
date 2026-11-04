import type { GetServerSideProps } from 'next';
import { useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { AppShell, ArticleHeader, Hero, NumberedSteps, StoreButton } from '../../components/app';
import { ResearchStyles } from '../../components/app/research';
import { referrerHost, track } from '../../lib/analytics';
import { normalizeInviteCode } from '../../lib/invite';

// /r/[code]: the invite link the app shares (Share my climb, decision 0058).
// - App installed, link tapped in Messages, Mail or Safari: iOS opens the app
//   straight from the link (the AASA routes /r/*) and the app redeems the code;
//   this page never renders.
// - App installed, link tapped inside Instagram's or TikTok's own browser (they
//   never hand a universal link to the app): "Open Step Gunner" below uses the
//   app's own scheme, stepgunner://r/CODE.
// - No app (most friends): the store button copies stepgunner.com/?ref=CODE; on
//   first launch the app sees a link on the clipboard and asks to paste it (the
//   steps tell the friend to allow it). Typing the code in Profile always works.
// - A laptop: a QR code to finish on the phone. Android: Step Gunner is iPhone
//   and iPad only, said plainly.
// - Any device: "Claim 40% off on the web" goes to /pro?code=CODE, which takes the
//   code at Stripe Checkout (decision 0057 amendment, F1 and F5).
// Server-rendered so Messages, WhatsApp and the rest unfurl it with the invite
// card (/api/og-invite). No em or en dashes in copy.

type Props = { code: string };

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, res }) => {
  const code = normalizeInviteCode(typeof params?.code === 'string' ? params.code : '');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('X-Robots-Tag', 'noindex, follow');
  return { props: { code } };
};

type Device = 'ios' | 'android' | 'desktop';

export default function Invite({ code }: Props) {
  const [copied, setCopied] = useState(false);
  // Decided after mount so the server HTML is the same for every device (the
  // iPhone layout is the default: it is what most friends see).
  const [device, setDevice] = useState<Device>('ios');
  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setDevice(ios ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop');
  }, []);

  useEffect(() => {
    track('invite_link_view', { code, has_code: !!code, ref: referrerHost() });
  }, [code]);

  // Any App Store tap on this page puts the invite link on the clipboard; the
  // app reads it on first launch (it asks first, and only when a link is there).
  useEffect(() => {
    if (!code) return undefined;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href*="apps.apple.com"]');
      if (!a) return;
      try { navigator.clipboard?.writeText(`https://stepgunner.com/?ref=${code}`); } catch (err) { /* typing it in Profile still works */ }
      track('invite_store_tap', { code });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [code]);

  const qrSvg = useMemo(() => {
    if (!code) return '';
    const qr = qrcode(0, 'M');
    qr.addData(`https://stepgunner.com/r/${code}`);
    qr.make();
    return qr.createSvgTag({ cellSize: 5, margin: 3, scalable: true });
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      track('invite_code_copy', { code });
    } catch (err) {
      setCopied(false);
    }
  };

  return (
    <>
      <AppShell
        campaign="referral"
        pageType="tool"
        seo={{
          title: code ? `A friend invited you to Step Gunner (code ${code})` : 'A friend invited you to Step Gunner',
          description: 'Free to use. Step 2 CK and shelf prep for the clerkship year: practice by rotation, see your score range, and climb toward 270.',
          path: code ? `/r/${code}` : '/r',
          ogImage: `/api/og-invite?code=${encodeURIComponent(code)}`,
          ogType: 'website',
          noindex: true,
        }}
      >
        <ResearchStyles />
        <Hero>
          <ArticleHeader
            category="site"
            eyebrow="You're invited"
            title="A friend invited you to Step Gunner"
            accent="Step Gunner"
            dek="Free to use. Step 2 CK and shelf prep for the clerkship year: practice by rotation, see your score range as it climbs, and know what to study today."
            byline={false}
          />
          <div className="mk isl">
            <div className="rs-pt-col">
              <section className="sheet rs-code" aria-labelledby="rs-code-k">
                <div className="sheet-bd">
                  <h2 className="lbl" id="rs-code-k">Your friend&apos;s code</h2>
                  {code ? (
                    <>
                      <p className="rs-code-v num">{code}</p>
                      <button type="button" className="btn btn-q" onClick={copy}>{copied ? 'Copied' : 'Copy code'}</button>
                    </>
                  ) : <p className="rs-code-none">This link is missing its code. Step Gunner is still free to use.</p>}
                </div>
              </section>

              {device === 'desktop' && code ? (
                <section className="sheet rs-qr" aria-labelledby="rs-qr-k">
                  <div className="sheet-bd">
                    <h2 className="lbl" id="rs-qr-k">Open this on your iPhone</h2>
                    <div className="rs-qr-img" role="img" aria-label="QR code for this invite" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                    <p className="rs-fine">Point your iPhone camera here. Step Gunner is an iPhone and iPad app, and the code comes along from your phone.</p>
                  </div>
                </section>
              ) : null}

              {device === 'android' ? (
                <p className="rs-note">Step Gunner is on iPhone and iPad. Keep the code: it works on any iPhone or iPad you sign in on.</p>
              ) : null}

              {code || device !== 'desktop' ? (
                <div className="rs-act">
                  {device !== 'desktop' ? <StoreButton loc="top" lg>Get Step Gunner free</StoreButton> : null}
                  {code ? (
                    <a className="btn btn-q btn-lg" href={`/pro?code=${encodeURIComponent(code)}`} onClick={() => track('invite_claim_web', { code, device })}>
                      Claim 40% off on the web
                    </a>
                  ) : null}
                </div>
              ) : null}

              <NumberedSteps steps={[
                { text: <><b>Get Step Gunner</b> on the App Store. It&apos;s free.</> },
                { text: code
                  ? <>Open it. When your iPhone asks to paste, tap <b>Allow Paste</b>: that brings your friend&apos;s code.</>
                  : <>Open it and study a round.</> },
                { text: code
                  ? <>No prompt, or you tapped no? Enter <b>{code}</b> in <b>Profile &gt; Got a code? Redeem it</b>.</>
                  : <>See your Step 2 CK range as it climbs.</> },
              ]} />

              {code && device === 'ios' ? (
                <p className="rs-fine">Already have the app? <a href={`stepgunner://r/${code}`} onClick={() => track('invite_open_app', { code })}>Open Step Gunner</a> and the code comes along.</p>
              ) : null}
            </div>
          </div>
        </Hero>
      </AppShell>
      <style jsx global>{`
        .mk .rs-pt-col { max-width: 640px; margin-top: 32px; padding-bottom: 64px; }
        .mk .rs-code .sheet-bd, .mk .rs-qr .sheet-bd { display: grid; gap: 10px; justify-items: start; }
        .mk .rs-code-v { font: 800 38px/1.1 var(--f-mono); letter-spacing: .12em; color: var(--ink); overflow-wrap: anywhere; }
        .mk .rs-code-none { font-size: 18px; font-weight: 600; color: var(--ink-2); }
        .mk .rs-qr { margin-top: 16px; }
        .mk .rs-qr-img { width: 180px; height: 180px; background: #fff; border-radius: 12px; padding: 6px; }
        .mk .rs-qr-img svg { width: 100%; height: 100%; display: block; }
        .mk .rs-note { margin-top: 16px; font-size: 16px; font-weight: 600; color: var(--ink-2); }
        .mk .rs-pt-col .rs-act { margin-top: 20px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
        .mk .rs-pt-col .steps { margin-top: 24px; }
        .mk .rs-fine { margin-top: 16px; font-size: 15px; color: var(--ink-2); }
        .mk .rs-fine a { color: var(--act, #3d8bff); font-weight: 700; }
        @media (min-width: 760px) { .mk .rs-pt-col { padding-bottom: 88px; } }
      `}</style>
    </>
  );
}
