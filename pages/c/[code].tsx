import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import SiteShell from '../../components/SiteShell';
import { appStoreUrl, track, referrerHost } from '../../lib/analytics';
import { CHIEF_YEARLY, LIST_YEARLY, normalizeCode, possessive, redeemUrl, usd, type PublicChief } from '../../lib/chiefs';

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
        <title>{live ? `${title} | Step Gunner Pro at half price` : 'Step Gunner'}</title>
        <meta name="description" content={live
          ? `Your first year of Step Gunner Pro for ${usd(CHIEF_YEARLY)} instead of ${usd(LIST_YEARLY)}. Step 2 CK prep for the clerkship year.`
          : 'Step Gunner is Step 2 CK prep for the clerkship year.'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
        <meta name="robots" content="noindex, follow" />
        <meta property="og:title" content={live ? `${title}: Step Gunner Pro at half price` : 'Step Gunner'} />
        <meta property="og:description" content={live
          ? `First year of Pro for ${usd(CHIEF_YEARLY)} instead of ${usd(LIST_YEARLY)}.`
          : 'Step 2 CK prep for the clerkship year.'} />
      </Head>

      <SiteShell campaign={campaign} measure="tool" cta={{ label: 'Get the app', href: store }}>
        <div className="cl">
          {chief?.preview && <p className="pv">Preview data. Local design fixture, not a real Chief.</p>}

          {live ? (
            <>
              <span className="eyebrow">Chief code</span>
              <h1>{title}</h1>
              <p className="lede">
                Your first year of Step Gunner Pro at half price:{' '}
                <b>{usd(CHIEF_YEARLY)}</b> instead of {usd(LIST_YEARLY)}.
              </p>

              <div className="ticket">
                <div className="row">
                  <span className="k">Code</span>
                  <span className="code">{code}</span>
                </div>
                <a
                  href={redeemUrl(code)}
                  className="go"
                  onClick={() => track('chief_redeem_click', { code, ref: referrerHost() })}
                >
                  Redeem in the App Store
                </a>
                <p className="note">
                  Opens the App Store with the code filled in. For new subscribers on the yearly plan.
                  Year two renews at the regular price, and you can cancel any time in Settings.
                </p>
                <p className="note">
                  Already have Step Gunner? In the newest version, open Settings and tap
                  {' '}<b>Redeem a Chief code</b>, or tap <b>Have a Chief code?</b> on the Pro screen.
                </p>
              </div>

              {!onIOS && (
                <div className="qr" aria-label="QR code to open this page on your iPhone">
                  <div className="qrimg" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                  <p>
                    <b>On a computer?</b> Step Gunner is an iPhone app, and Apple only redeems codes on the
                    phone. Scan this with your iPhone camera to open this page there.
                  </p>
                </div>
              )}

              <a
                href={store}
                className="alt"
                onClick={() => track('store_click', { source: campaign, location: 'chief_link', code })}
              >
                Or install the free app first
              </a>
            </>
          ) : (
            <>
              <span className="eyebrow muted">Chief code</span>
              <h1>{title}</h1>
              <p className="lede">
                {asked ? <>The code <b className="mono">{asked}</b> is paused, mistyped or no longer running.</> : 'This link is missing its code.'}{' '}
                Step Gunner is still free to download.
              </p>
              <a
                href={store}
                className="go"
                onClick={() => track('store_click', { source: campaign, location: 'chief_link_inactive', code: asked })}
              >
                Get Step Gunner
              </a>
            </>
          )}

          <section className="what" aria-labelledby="what-h">
            <h2 id="what-h">What Step Gunner is</h2>
            <p>Step 2 CK prep built for the clerkship year: short rounds of clinical questions, spaced review of what you miss, and next best step chains the way attendings ask them.</p>
            <p>Its score projection is checked against real students&apos; results and publishes its own track record.</p>
          </section>

          {live && (
            <p className="disc">
              {name || 'This Chief'} is a Step Gunner Chief and earns a share of signups made with this code.
            </p>
          )}
        </div>
      </SiteShell>

      <style jsx>{`
        .cl { --gold-deep: #8a5600; padding-top: 24px; }
        .pv {
          margin: 0 0 24px; padding: 8px 12px; border: 1px dashed var(--gold-deep); border-radius: 8px;
          font-family: var(--mono); font-size: 12px; color: var(--gold-deep);
        }
        .eyebrow {
          font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--gold-deep);
        }
        .eyebrow.muted { color: var(--ink-dim); }
        h1 {
          font-size: clamp(36px, 8vw, 56px); font-weight: 800; letter-spacing: -0.035em;
          line-height: 1.02; margin: 16px 0 16px;
        }
        .lede { font-size: 19px; line-height: 1.5; color: var(--ink-dim); margin: 0 0 32px; max-width: 32em; }
        .lede b { color: var(--ink); font-weight: 800; }
        .mono { font-family: var(--mono); letter-spacing: 0.06em; }

        /* The one lifted object: the code, the action, the condition. */
        .ticket {
          background: var(--panel); border: 1px solid var(--hair-strong); border-radius: 16px;
          padding: 24px; box-shadow: var(--lift-lg);
        }
        .row {
          display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
          padding-bottom: 16px; margin-bottom: 24px; border-bottom: 1px dashed var(--hair-strong);
        }
        .k {
          font-family: var(--mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--ink-dim);
        }
        .code {
          font-family: var(--mono); font-size: clamp(24px, 6vw, 32px); font-weight: 800;
          letter-spacing: 0.12em; overflow-wrap: anywhere; text-align: right;
        }
        .go {
          display: flex; align-items: center; justify-content: center; min-height: 52px; width: 100%;
          padding: 0 24px; border-radius: 12px; background: var(--gold); color: #1a1403;
          font-size: 17px; font-weight: 800; text-decoration: none;
          box-shadow: 0 8px 24px -12px rgba(224, 142, 0, 0.6);
          transition: transform .16s ease-out, box-shadow .16s ease-out;
        }
        .go:hover { text-decoration: none; transform: translateY(-1px); box-shadow: 0 12px 28px -12px rgba(224, 142, 0, 0.7); }
        .go:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
        .cl > .go { width: auto; display: inline-flex; }
        .note { margin: 16px 0 0; font-size: 14px; line-height: 1.5; color: var(--ink-dim); }
        .note b { color: var(--ink); font-weight: 600; }
        .qr { display: flex; gap: 18px; align-items: center; margin: 22px 0 0; padding: 18px; border: 1px solid var(--hair-strong, #e3dfd6); border-radius: 16px; background: var(--bg-2, #fff); }
        .qrimg { width: 132px; height: 132px; flex: none; }
        .qrimg :global(svg) { width: 100%; height: 100%; display: block; }
        .qr p { margin: 0; font-size: 14px; line-height: 1.55; color: var(--ink-dim); }
        .qr p b { color: var(--ink); }
        @media (max-width: 420px) { .qr { flex-direction: column; align-items: flex-start; } }
        .alt {
          display: inline-flex; align-items: center; min-height: 44px; margin-top: 16px;
          font-weight: 700; color: var(--ink); text-decoration: underline;
          text-decoration-color: var(--hair-strong); text-underline-offset: 4px;
        }
        .alt:hover { text-decoration-color: var(--ink); }

        .what { margin-top: 56px; padding-top: 24px; border-top: 1px solid var(--hair-strong); }
        .what h2 {
          font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--ink-dim); margin: 0 0 16px;
        }
        .what p { margin: 0 0 8px; line-height: 1.6; }
        .disc { margin: 32px 0 0; font-size: 14px; color: var(--ink-dim); }
      `}</style>
    </>
  );
}
