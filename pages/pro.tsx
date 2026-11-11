import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { AppShell } from '../components/app';
import ProSignIn, { APPLE_ON } from '../components/ProSignIn';
import ProStyles from '../components/ProStyles';
import ProVideo from '../components/ProVideo';
import { track } from '../lib/analytics';
import { api, fmtDate, useWebAccount } from '../lib/webAccount';

// stepgunner.com/pro: buy Pro on the web, unlock it on the phone (gunner repo,
// decision 0051; the approved "Pro on the web" board of the Step Gunner Web mock).
// Sign in with the app's own account (Apple or Google, or the app's handoff link
// /pro#h=CODE), pick a plan, pay on Stripe's page; the webhook writes the server
// grant the app already reads.

type Plan = 'yearly' | 'monthly';
type Source = 'app_store' | 'web' | 'grant' | 'none';
type Status = {
  source: Source;
  plan: Plan | null;
  periodEndMs: number | null;
  cancelAtPeriodEnd: boolean;
  grantEndMs: number | null;
  answered: number | null;
  streak: number | null;
  savedCode: string | null;
};
type Code = { code: string; label: string; kind: 'friend' | 'chief'; rewards: boolean };

const PLANS: { id: Plan; name: string; sub: string; price: string }[] = [
  { id: 'yearly', name: 'Yearly', sub: 'BEST VALUE · $8.33 A MONTH', price: '$99.99' },
  { id: 'monthly', name: 'Monthly', sub: 'CANCEL ANYTIME', price: '$14.99' },
];

// The app's paywall labels (scripts/config_copy.json in the gunner repo).
const FEATURES = [
  { t: 'NBME INTELLIGENCE', d: 'Every NBME you log plants a flag on your climb, and Pro ranks the leaks that move it.' },
  { t: 'VISUAL DX', d: '892 questions on 532 images: H&E, skin, smears, Gram stains, ECGs and CT.' },
  { t: 'RETENTION FORECAST', d: 'What fades before your exam, and the reviews a day that hold it.' },
  { t: 'YOUR PLAN TO TEST DAY', d: 'Every day ranked by your weakest systems and what Step 2 tests most.' },
  { t: 'WHERE YOUR POINTS ARE', d: 'Every system ranked by the points it holds, each with a one-tap Drill 10.' },
  { t: 'NO DAILY CAPS', d: 'Unlimited cram, all nine LFX formats and ED Pathways.' },
];

export default function ProPage() {
  const router = useRouter();
  const account = useWebAccount();
  const { user } = account;
  const [status, setStatus] = useState<Status | null>(null);
  const [plan, setPlan] = useState<Plan>('yearly');
  const [codeText, setCodeText] = useState('');
  const [code, setCode] = useState<Code | null>(null);
  const [codeErr, setCodeErr] = useState('');
  const [pageErr, setErr] = useState('');
  const [busyOn, setBusy] = useState<'' | 'code' | 'checkout' | 'portal'>('');
  const [paid, setPaid] = useState<'' | 'confirming' | 'on' | 'slow'>('');
  const urlCode = useRef('');
  // The marketing site links here with the plan its visitor was looking at (?plan=monthly).
  useEffect(() => {
    if (router.isReady && router.query.plan === 'monthly') setPlan('monthly');
  }, [router.isReady, router.query.plan]);
  const busy = busyOn || (account.busy ? 'signin' : '');
  const err = pageErr || account.err;

  useEffect(() => {
    track('pro_web_view', {});
  }, []);

  const loadStatus = useCallback(async (u: User) => {
    const r = await api<{ status: Status }>(u, '/api/pro/status');
    if (r.ok) {
      setStatus(r.status);
      setErr('');
    } else {
      setStatus(null);
      setErr(r.error || 'Something went wrong. Try again.');
    }
    return r.ok ? r.status : null;
  }, []);

  useEffect(() => {
    if (user) loadStatus(user);
    else setStatus(null);
  }, [user, loadStatus]);

  // Back from Stripe: wait for the webhook to turn Pro on.
  useEffect(() => {
    if (!user || !router.isReady || typeof router.query.paid !== 'string') return undefined;
    setPaid('confirming');
    let n = 0;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      const s = await loadStatus(user);
      if (s && s.source === 'web') {
        setPaid('on');
        track('pro_web_paid', { plan: s.plan || '' });
        return;
      }
      n += 1;
      if (n >= 15) setPaid('slow');
      else setTimeout(tick, 2000);
    };
    tick();
    return () => { stop = true; };
  }, [user, router.isReady, router.query.paid, loadStatus]);

  const signIn = (provider: 'apple' | 'google') => {
    setErr('');
    account.signIn(provider, () => track('pro_web_signin', { provider }));
  };

  const signOut = async () => {
    await account.signOut();
    setCode(null);
    setCodeText('');
    setPaid('');
    router.replace('/pro', undefined, { shallow: true });
  };

  const applyCode = async () => {
    if (!user || !codeText.trim()) return;
    setBusy('code');
    setCodeErr('');
    const r = await api<{ code: string; label: string; kind: 'friend' | 'chief'; rewards: boolean }>(user, '/api/pro/code', { code: codeText, plan });
    setBusy('');
    if (r.ok) setCode({ code: r.code, label: r.label, kind: r.kind, rewards: r.rewards });
    else {
      setCode(null);
      setCodeErr(r.error || "That code didn't work.");
    }
  };

  // A share link (stepgunner.com/pro?code=X or ?ref=X) fills the code box, and the
  // code is checked once the account is found.
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.code ?? router.query.ref;
    const v = typeof q === 'string' ? q.trim().toUpperCase() : '';
    if (v && !urlCode.current) {
      urlCode.current = v;
      setCodeText(v);
    }
  }, [router.isReady, router.query.code, router.query.ref]);

  // No code in the link: use the friend code this student saved in the app.
  useEffect(() => {
    if (status?.savedCode && !urlCode.current && !codeText) {
      urlCode.current = status.savedCode;
      setCodeText(status.savedCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (!user || !status || status.source === 'web' || status.source === 'app_store') return;
    if (urlCode.current && codeText === urlCode.current && !code && !codeErr && !busy) {
      urlCode.current = ' ';
      applyCode();
    }
    // applyCode reads codeText and plan, both current on this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, status, codeText]);

  const pickPlan = (p: Plan) => {
    setPlan(p);
    // A code's label depends on the plan (Chief codes are yearly only): check again.
    if (code) {
      setCode(null);
      setCodeErr('');
    }
  };

  const checkout = async () => {
    if (!user) return;
    setBusy('checkout');
    setErr('');
    track('pro_web_checkout', { plan, code_kind: code?.kind || 'none' });
    const r = await api<{ url: string }>(user, '/api/pro/checkout', { plan, code: code?.code });
    if (r.ok && r.url) {
      window.location.assign(r.url);
      return;
    }
    setBusy('');
    setErr(r.error || 'Checkout did not open. Try again.');
    if (r.code === 'web' || r.code === 'app_store') loadStatus(user);
  };

  const portal = async () => {
    if (!user) return;
    setBusy('portal');
    const r = await api<{ url: string }>(user, '/api/pro/portal', {});
    if (r.ok && r.url) {
      window.location.assign(r.url);
      return;
    }
    setBusy('');
    setErr(r.error || 'Could not open your plan. Try again.');
  };

  const anonymous = !!user && user.isAnonymous;
  const step = !user || anonymous ? 0 : paid || status?.source === 'web' ? 2 : 1;
  const steps = ['1 · SIGN IN', '2 · PLAN', '3 · PAY'];

  let panel: JSX.Element;
  if (user === undefined) {
    panel = <p className="pro-muted">Checking your sign-in...</p>;
  } else if (!user || anonymous) {
    panel = (
      <ProSignIn
        title="Sign in with your Step Gunner account"
        lede="Use the same sign-in as the app, so Pro lands on the account that has your progress."
        busy={!!busy}
        onSignIn={signIn}
      >
        {!APPLE_ON && (
          <p className="pro-fine">Signed in to the app with Apple? Apple sign-in on the web is coming. Until then, buy Pro in the app.</p>
        )}
        <p className="pro-fine">No sign-in in the app yet? Add one first (Settings, Account), so your progress comes with you.</p>
      </ProSignIn>
    );
  } else if (!status) {
    panel = <p className="pro-muted">{err || 'Finding your account...'}</p>;
  } else if (paid === 'confirming') {
    panel = (
      <div className="pro-stack">
        <h2>Confirming your payment...</h2>
        <p className="pro-muted">This takes a few seconds.</p>
      </div>
    );
  } else if (paid === 'on' || (paid === '' && status.source === 'web')) {
    panel = (
      <div className="pro-stack pro-done">
        <span className="pro-check" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <h2 className="pro-h2-lg">Pro is on.</h2>
        <p className="pro-muted">
          {paid === 'on'
            ? 'Close Step Gunner on your phone and open it again: Pro is on the same account. A receipt is on its way to your email.'
            : `Your ${status.plan || ''} plan ${status.cancelAtPeriodEnd ? 'ends' : 'renews'} ${fmtDate(status.periodEndMs)}.`}
        </p>
        <div className="pro-row">
          <button type="button" className="pro-btn pro-ghost pro-auto" disabled={!!busy} onClick={portal}>
            {busy === 'portal' ? 'Opening...' : 'Manage plan'}
          </button>
        </div>
      </div>
    );
  } else if (paid === 'slow') {
    panel = (
      <div className="pro-stack">
        <h2>Payment received</h2>
        <p className="pro-muted">Pro is taking longer than usual to switch on. Refresh this page in a minute. If it still is not on, write to support from the app and we will fix it.</p>
      </div>
    );
  } else if (status.source === 'app_store') {
    panel = (
      <div className="pro-stack">
        <h2>You're set.</h2>
        <p className="pro-muted">This account already has Pro through the App Store. Manage it on your iPhone in Settings, then your name, then Subscriptions.</p>
      </div>
    );
  } else {
    panel = (
      <div className="pro-stack">
        <div className="pro-found">
          <span className="pro-dot" aria-hidden="true" />
          <span>
            Signed in. Found your account
            {status.answered != null && (
              <>: <span className="pro-mono">{status.answered.toLocaleString('en-US')} answers{status.streak ? ` · ${status.streak}-day streak` : ''}</span></>
            )}
          </span>
        </div>
        {status.source === 'grant' && (
          <p className="pro-fine">You have Pro until {fmtDate(status.grantEndMs)}. A plan bought now starts billing today and keeps Pro on after that.</p>
        )}
        <h2>Pick a plan</h2>
        {PLANS.map((p) => (
          <button key={p.id} type="button" className={`pro-plan${plan === p.id ? ' on' : ''}`} aria-pressed={plan === p.id} onClick={() => pickPlan(p.id)}>
            <span className="pro-radio"><span /></span>
            <span className="pro-plan-txt">
              <span className="pro-plan-name">{p.name}</span>
              <span className="pro-plan-sub">{p.sub}</span>
            </span>
            <span className="pro-plan-price">{p.price}</span>
          </button>
        ))}
        <form className="pro-code" onSubmit={(e) => { e.preventDefault(); applyCode(); }}>
          <div className="pro-code-field">
            <label htmlFor="pro-code">Chief or friend code</label>
            <input id="pro-code" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="e.g. ALEX-7Q2"
              value={codeText} onChange={(e) => { setCodeText(e.target.value); setCode(null); setCodeErr(''); }} />
          </div>
          <button type="submit" className="pro-btn pro-ghost pro-apply" disabled={!!busy || !codeText.trim()}>
            {busy === 'code' ? '...' : 'Apply'}
          </button>
        </form>
        {code && (
          <p className="pro-ok">
            Code applied: {code.label}.{code.kind === 'friend' && code.rewards ? ' The student who shared it gets paid when you join.' : ''}
          </p>
        )}
        {codeErr && <p className="pro-bad">{codeErr}</p>}
        <button type="button" className="pro-btn pro-primary" disabled={!!busy} onClick={checkout}>
          {busy === 'checkout' ? 'Opening checkout...' : 'Continue to secure checkout'}
        </button>
        <p className="pro-fine">
          Renews automatically until you cancel. Cancel anytime from Manage plan. Payments by Stripe; shows as STEP GUNNER on
          your statement. <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a>
        </p>
      </div>
    );
  }

  return (
    <AppShell
      campaign="pro_web"
      pageType="pro"
      section={null}
      seo={{
        title: 'Step Gunner Pro',
        description: 'Get Step Gunner Pro on the web. Sign in with your app account and Pro is on your phone.',
        path: '/pro',
        noindex: true,
      }}
    >
      {/* Headline, then checkout, then the video and features: on a phone the sign-in
          button sits right under the headline instead of below the whole pitch. From
          960px the card moves to its own column beside them (ProStyles, .pro-buy). */}
      <div className="pro-wrap pro-buy">
        <header className="pro-pitch pro-head">
          <span className="pro-eyebrow">STEP GUNNER PRO</span>
          <h1>Your plan to test day.</h1>
          <p className="pro-lede">Ranked by your weakest systems and what Step 2 tests most. Buy it here, and it's on your phone, on the same account.</p>
        </header>

        <section className="pro-card" aria-label="Checkout">
          <ol className="pro-steps" aria-label="Steps">
            {steps.map((label, i) => (
              <li key={label} className={i < step ? 'done' : i === step ? 'now' : ''}>
                <span className="bar" />
                <span className="lbl">{label}</span>
              </li>
            ))}
          </ol>
          {panel}
          {err && (status || !user) && <p className="pro-bad">{err}</p>}
          {user && !anonymous && (
            <p className="pro-fine pro-who">
              {user.email ? <>Signed in as {user.email}. </> : null}
              <button type="button" className="pro-link" onClick={signOut}>Not you? Sign out</button>
            </p>
          )}
        </section>

        <div className="pro-show">
          <ProVideo />
          <ul className="pro-feats">
            {FEATURES.map((f) => (
              <li key={f.t}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                <div><span className="pro-feat-t">{f.t}</span><span className="pro-feat-d">{f.d}</span></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="pro-foot">Already pay through the App Store? You're set. Nothing to buy here.</p>

      <ProStyles />
    </AppShell>
  );
}
