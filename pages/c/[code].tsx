import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { AppShell, ArticleHeader, Hero, StoreButton } from '../../components/app';
import { appStoreUrl, track, referrerHost } from '../../lib/analytics';
import { CHIEF_YEARLY, DISCOUNT_PCT, LIST_YEARLY, normalizeCode, possessive, redeemUrl, usd, type PublicChief } from '../../lib/chiefs';

// /c/[code]: the link a Chief shares. Server-rendered so the Chief's name and the
// offer are in the HTML that iMessage and Instagram unfurl. Unknown, malformed
// or paused codes, and a server with no Firestore credential, all land on the
// same calm "not active" state with the ordinary store link: a dead code should
// never look like an error page to the friend who tapped it.

type Props = { chief: PublicChief | null; asked: string };

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, res }) => {
  const raw = typeof params?.code === 'string' ? params.code : '';
  const code = normalizeCode(raw);
  let chief: PublicChief | null = null;
  if (code) {
    try {
      const { getPublicChief } = await import('../../lib/chiefsServer');
      chief = await getPublicChief(code);
    } catch (err) {
      console.error('chief link: lookup failed', { code, err });
    }
  }
  // Short shared cache: pausing a code takes effect within a minute.
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('X-Robots-Tag', 'noindex, follow');
  return { props: { chief, asked: (code || raw).slice(0, 32) } };
};

export default function ChiefLink({ chief, asked }: Props) {
  const live = !!chief && chief.active;
  const code = chief?.code || asked;
  const campaign = live ? `chief_${code.toLowerCase()}` : 'chief_inactive';
  const store = appStoreUrl(campaign);
  const name = chief?.displayName || '';

  useEffect(() => {
    track('chief_link_view', { code, active: live, ref: referrerHost() });
  }, [code, live]);

  // Apple's redeem link only works on an iPhone or iPad. A Chief's link opened
  // from a class group chat on a laptop gets a QR code to finish on the phone.
  // Decided after mount so the server HTML is the same for every device.
  const [onIOS, setOnIOS] = useState(true);
  useEffect(() => {
    const ua = navigator.userAgent;
    setOnIOS(/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  }, []);
  const qrSvg = useMemo(() => {
    if (!live) return '';
    const qr = qrcode(0, 'M');
    qr.addData(`https://stepgunner.com/c/${code}`);
    qr.make();
    return qr.createSvgTag({ cellSize: 5, margin: 3, scalable: true });
  }, [live, code]);

  const title = live ? `${possessive(name)} Chief code` : 'This code is not active';

  return (
    <>
      <Head>
        <title>{live ? `${title} | Step Gunner Pro at ${DISCOUNT_PCT}% off` : 'Step Gunner'}</title>
        <meta name="description" content={live
          ? `Your first year of Step Gunner Pro for ${usd(CHIEF_YEARLY)} instead of ${usd(LIST_YEARLY)}. Step 2 CK prep for the clerkship year.`
          : 'Step Gunner is Step 2 CK prep for the clerkship year.'} />
        <meta name="robots" content="noindex, follow" />
        <meta property="og:title" content={live ? `${title}: Step Gunner Pro at ${DISCOUNT_PCT}% off` : 'Step Gunner'} />
        <meta property="og:description" content={live
          ? `First year of Pro for ${usd(CHIEF_YEARLY)} instead of ${usd(LIST_YEARLY)}.`
          : 'Step 2 CK prep for the clerkship year.'} />
      </Head>

      <AppShell campaign={campaign} navCta={{ label: 'Get the app', href: store }}>
        <Hero>
          <div className="mk isl">
            {chief?.preview && <p className="cc-pv">Preview data. Local design fixture, not a real Chief.</p>}
          </div>

          {live ? (
            <>
              <ArticleHeader
                category="site"
                byline={false}
                eyebrow="Chief code"
                title={title}
                dek={<>
                  Your first year of Step Gunner Pro at {DISCOUNT_PCT}% off:{' '}
                  <b>{usd(CHIEF_YEARLY)}</b> instead of {usd(LIST_YEARLY)}.
                </>}
              />

              <div className="mk isl">
                <div className="sheet cc-ticket">
                  <div className="sheet-hd">
                    <span className="lbl">Code</span>
                    <span className="cc-code">{code}</span>
                  </div>
                  <div className="sheet-bd">
                    {/* Apple's offer-code redeem link (not the store listing), with its own event. */}
                    <a
                      href={redeemUrl(code)}
                      className="btn btn-act btn-lg btn-block"
                      onClick={() => track('chief_redeem_click', { code, ref: referrerHost() })}
                    >
                      Redeem in the App Store
                    </a>
                    <p className="cc-note">
                      Opens the App Store with the code filled in. For new subscribers on the yearly plan.
                      Year two renews at the regular price, and you can cancel any time in Settings.
                    </p>
                    <p className="cc-note">
                      Already have Step Gunner? In the newest version, open Settings and tap
                      {' '}<b>Redeem a Chief code</b>, or tap <b>Have a Chief code?</b> on the Pro screen.
                    </p>
                  </div>
                </div>

                {!onIOS && (
                  <div className="sheet cc-qr" aria-label="QR code to open this page on your iPhone">
                    <div className="cc-qrimg" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                    <p>
                      <b>On a computer?</b> Step Gunner is an iPhone app, and Apple only redeems codes on the
                      phone. Scan this with your iPhone camera to open this page there.
                    </p>
                  </div>
                )}

                <div className="cc-alt">
                  <StoreButton loc="inline" variant="q" params={{ code }}>Or install the free app first</StoreButton>
                </div>
              </div>
            </>
          ) : (
            <>
              <ArticleHeader
                category="site"
                byline={false}
                eyebrow="Chief code"
                title={title}
                dek={<>
                  {asked ? <>The code <b className="cc-mono">{asked}</b> is paused, mistyped or no longer running.</> : 'This link is missing its code.'}{' '}
                  Step Gunner is still free to download.
                </>}
              />
              <div className="mk isl">
                <div className="cc-act">
                  <StoreButton loc="hero" lg params={{ code: asked }}>Get Step Gunner</StoreButton>
                </div>
              </div>
            </>
          )}

          <div className="mk isl">
            <section className="cc-what" aria-labelledby="what-h">
              <h2 className="lbl" id="what-h">What Step Gunner is</h2>
              <p className="prs">Step 2 CK prep built for the clerkship year: short rounds of clinical questions, spaced review of what you miss, and next best step chains the way attendings ask them.</p>
              <p className="prs">Its score projection is checked against real students&apos; results and publishes its own track record.</p>
            </section>

            {live && (
              <p className="fine cc-disc">
                {name || 'This Chief'} is a Step Gunner Chief and earns a share of signups made with this code.
              </p>
            )}
            <div className="cc-gap" />
          </div>
        </Hero>
      </AppShell>

      <style jsx global>{`
        .mk .cc-pv { margin-bottom: 16px; padding: 8px 12px; border-radius: 8px; outline: 1px dashed var(--step2); outline-offset: -1px; font: 600 13px/1.4 var(--f-mono); color: var(--step2); max-width: 680px; }
        .mk .cc-mono { font-family: var(--f-mono); letter-spacing: .06em; }
        .mk .cc-ticket { max-width: 680px; margin-top: 32px; box-shadow: 0 1px 2px var(--shadow-a), 0 16px 40px -16px var(--shadow-b), inset 0 0 0 1px var(--line); }
        .mk .cc-ticket .sheet-hd { align-items: baseline; flex-wrap: nowrap; }
        .mk .cc-code { min-width: 0; font: 800 28px/1.2 var(--f-mono); letter-spacing: .12em; color: var(--ink); overflow-wrap: anywhere; text-align: right; }
        .mk .cc-note { margin-top: 16px; font-size: 16px; line-height: 1.5; color: var(--ink-2); }
        .mk .cc-note b { color: var(--ink); font-weight: 600; }
        .mk .cc-qr { display: flex; gap: 20px; align-items: center; max-width: 680px; margin-top: 16px; padding: 20px; }
        .mk .cc-qrimg { width: 132px; height: 132px; flex: none; padding: 4px; border-radius: 12px; background: var(--paper); }
        .mk .cc-qrimg svg { display: block; width: 100%; height: 100%; }
        .mk .cc-qr p { font-size: 16px; line-height: 1.55; color: var(--ink-2); }
        .mk .cc-qr p b { color: var(--ink); }
        .mk .cc-alt { margin-top: 16px; }
        .mk .cc-act { margin-top: 32px; }
        .mk .cc-what { max-width: 680px; margin-top: 56px; padding-top: 24px; box-shadow: inset 0 1px 0 var(--line-2); }
        .mk .cc-what .prs:first-of-type { margin-top: 16px; }
        .mk .cc-disc { max-width: 680px; margin-top: 32px; }
        .mk .cc-gap { height: 64px; }
        @media (min-width: 760px) { .mk .cc-code { font-size: 32px; } }
        @media (max-width: 420px) { .mk .cc-qr { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </>
  );
}
