import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AppShell } from '../../components/app';
import ProStyles from '../../components/ProStyles';
import { track } from '../../lib/analytics';

// stepgunner.com/pro/done: where Stripe Checkout returns a purchase started in the app
// (decision 0057 amendment, F2; /api/pro/checkout origin "app"). The AASA routes
// /pro/done* to the app, so iOS normally opens Step Gunner straight away and this
// never renders. When it does (a redirect iOS would not hand over, or the app is
// gone), the button opens the app through its own scheme, stepgunner://pro/done,
// with the same query, and the app refreshes the grant. The webhook already turned
// Pro on; nothing here confirms or grants anything. No em or en dashes in copy.

const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]+$/;

export default function ProDone() {
  const router = useRouter();
  const session = typeof router.query.session === 'string' && SESSION_RE.test(router.query.session) ? router.query.session : '';
  const canceled = router.query.canceled === '1';
  const state = canceled ? 'canceled' : session ? 'paid' : 'open';
  const appUrl = canceled ? 'stepgunner://pro/done?canceled=1' : session ? `stepgunner://pro/done?session=${session}` : 'stepgunner://pro/done';

  useEffect(() => {
    if (router.isReady) track('pro_done_view', { state });
  }, [router.isReady, state]);

  return (
    <AppShell
      campaign="pro_app"
      pageType="pro"
      section={null}
      seo={{ title: 'Step Gunner Pro', description: 'Back to Step Gunner.', path: '/pro/done', noindex: true }}
    >
      <div className="pro-wrap pro-done-wrap">
        <section className="pro-card" aria-live="polite">
          <div className="pro-stack pro-done">
            {state === 'paid' && (
              <span className="pro-check" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
            )}
            <h2 className="pro-h2-lg">
              {state === 'paid' ? 'Payment received.' : state === 'canceled' ? 'Checkout canceled.' : 'Back to Step Gunner.'}
            </h2>
            <p className="pro-muted">
              {state === 'paid'
                ? 'Pro is on your Step Gunner account. Open the app and it is ready.'
                : state === 'canceled'
                  ? 'Nothing was charged. Your code still works whenever you are ready.'
                  : 'Open the app to pick up where you left off.'}
            </p>
            <a className="pro-btn pro-primary pro-done-open" href={appUrl} onClick={() => track('pro_done_open_app', { state })}>
              Open Step Gunner
            </a>
            <p className="pro-fine">
              {state === 'paid'
                ? "Didn't open? Open Step Gunner from your home screen: Pro switches on when it starts. A receipt is on its way to your email."
                : "Didn't open? Open Step Gunner from your home screen."}
            </p>
          </div>
        </section>
      </div>
      <ProStyles />
      <style jsx>{`
        .pro-done-wrap { justify-content: center; padding-top: 56px; padding-bottom: 72px; }
        .pro-done-open { align-self: stretch; text-decoration: none; }
      `}</style>
    </AppShell>
  );
}
