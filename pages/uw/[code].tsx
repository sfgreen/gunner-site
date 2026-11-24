import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AppShell, StoreButton } from '../../components/app';
import ProStyles from '../../components/ProStyles';
import { track } from '../../lib/analytics';
import { cleanConnectCode } from '../../lib/uworldCompanion';

// stepgunner.com/uw/<code>: the QR the Companion extension shows to connect a laptop
// (gunner decision 0087). With the app installed and the AASA claiming /uw/*, iOS opens
// Step Gunner on "Connect this laptop?" and this page never renders. It renders when
// the app is missing or too old, so it says that, and offers the app's own scheme.
// The code is a one-time pairing code that expires in 15 minutes; nothing is stored here.

export default function ConnectLaptop() {
  const router = useRouter();
  const code = cleanConnectCode(router.query.code);

  useEffect(() => {
    if (router.isReady) track('uworld_connect_page_view', { valid: code ? 1 : 0 });
  }, [router.isReady, code]);

  return (
    <AppShell
      campaign="uworld_connect"
      pageType="tool"
      section={null}
      seo={{ title: 'Connect Step Gunner', description: 'Connect your laptop to Step Gunner.', path: '/uw', noindex: true }}
    >
      <div className="pro-wrap uw-wrap">
        <section className="pro-card" aria-live="polite">
          <div className="pro-stack">
            <h1 className="pro-h2-lg">Open this in Step Gunner.</h1>
            <p className="pro-muted">
              This code connects your laptop's UWorld Companion to Step Gunner. Your phone opened the website
              instead of the app, so the app is not installed or needs an update.
            </p>
            {code && (
              <a className="pro-btn pro-primary uw-open" href={`stepgunner://uw/${code}`}
                 onClick={() => track('uworld_connect_open_app', {})}>
                Open Step Gunner
              </a>
            )}
            <StoreButton loc="inline" variant="q" block>Get or update Step Gunner</StoreButton>
            <p className="pro-fine">
              After installing or updating, scan the code on your laptop again. Codes last 15 minutes; the laptop
              shows a new one when it runs out.
            </p>
          </div>
        </section>
      </div>
      <ProStyles />
      <style jsx>{`
        .uw-wrap { justify-content: center; padding-top: 56px; padding-bottom: 72px; }
        .uw-open { align-self: stretch; text-align: center; text-decoration: none; }
      `}</style>
    </AppShell>
  );
}
