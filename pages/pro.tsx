import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Auth, User } from 'firebase/auth';
import { AppShell } from '../components/app';
import { track } from '../lib/analytics';

// stepgunner.com/pro: buy Pro on the web, unlock it on the phone (gunner repo,
// decision 0051; the approved "Pro on the web" board of the Step Gunner Web mock).
// Sign in with the app's own account (Apple or Google), pick a plan, pay on
// Stripe's page; the webhook writes the server grant the app already reads.
//
// Apple on the web needs a Services ID in Firebase first, so its button shows only
// with NEXT_PUBLIC_PRO_APPLE=1 (decision 0051, Open).

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

const APPLE_ON = process.env.NEXT_PUBLIC_PRO_APPLE === '1';

const PLANS: { id: Plan; name: string; sub: string; price: string }[] = [
  { id: 'yearly', name: 'Yearly', sub: 'BEST VALUE · $8.33 A MONTH', price: '$99.99' },
  { id: 'monthly', name: 'Monthly', sub: 'CANCEL ANYTIME', price: '$14.99' },
];

// The app's paywall labels (scripts/config_copy.json in the gunner repo).
const FEATURES = [
  { t: 'YOUR PLAN TO TEST DAY', d: 'Every task, every day, ranked and phased to your exam date.' },
  { t: 'WHERE YOUR POINTS ARE', d: "Each system's share of your points, weakest and highest yield first." },
  { t: 'NBME INTELLIGENCE', d: 'Every practice test you log sharpens the range and plans your next one.' },
  { t: "WHAT'S IN VISUAL DX", d: 'EKGs, films, scans and skin, read the way the exam shows them.' },
  { t: 'UNLIMITED CRAM', d: 'No daily cap on drills.' },
];

const fmtUsd = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;

const fmtDate = (ms: number | null) =>
  ms ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric' }).format(ms) : '';

async function api<T>(user: User, path: string, body?: unknown): Promise<T & { ok: boolean; error?: string; code?: string }> {
  const token = await user.getIdToken();
  const r = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    return await r.json();
  } catch {
    return { ok: false, error: 'Something went wrong. Try again.' } as T & { ok: boolean; error: string };
  }
}

function signInError(code: string): string {
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow pop-ups for stepgunner.com and try again.';
  if (code === 'auth/account-exists-with-different-credential') return 'Your account signs in another way. Try the other button.';
  return "Sign-in didn't finish. Try again.";
}

export default function ProPage() {
  const router = useRouter();
  const authRef = useRef<Auth | null>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = still checking
  const [status, setStatus] = useState<Status | null>(null);
  const [plan, setPlan] = useState<Plan>('yearly');
  const [codeText, setCodeText] = useState('');
  const [code, setCode] = useState<Code | null>(null);
  const [codeErr, setCodeErr] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<'' | 'signin' | 'code' | 'checkout' | 'portal'>('');
  const [paid, setPaid] = useState<'' | 'confirming' | 'on' | 'slow'>('');
  const urlCode = useRef('');

  // Firebase loads only here, after paint.
  useEffect(() => {
    track('pro_web_view', {});
    let unsub = () => {};
    (async () => {
      const [{ webAuth }, { onAuthStateChanged }] = await Promise.all([import('../lib/firebaseWeb'), import('firebase/auth')]);
      const auth = webAuth();
      authRef.current = auth;
      unsub = onAuthStateChanged(auth, (u) => setUser(u));
    })();
    return () => unsub();
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

  const signIn = async (provider: 'apple' | 'google') => {
    const auth = authRef.current;
    if (!auth) return;
    setBusy('signin');
    setErr('');
    track('pro_web_signin', { provider });
    try {
      const m = await import('firebase/auth');
      const p = provider === 'google' ? new m.GoogleAuthProvider() : new m.OAuthProvider('apple.com');
      if (provider === 'apple') {
        (p as InstanceType<typeof m.OAuthProvider>).addScope('email');
      }
      await m.signInWithPopup(auth, p);
    } catch (e) {
      setErr(signInError((e as { code?: string }).code || ''));
    } finally {
      setBusy('');
    }
  };

  const signOut = async () => {
    const auth = authRef.current;
    if (!auth) return;
    const m = await import('firebase/auth');
    await m.signOut(auth);
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
      <div className="pro-stack">
        <h2>Sign in with your Step Gunner account</h2>
        <p className="pro-muted">Use the same sign-in as the app, so Pro lands on the account that has your progress.</p>
        {APPLE_ON && (
          <button type="button" className="pro-btn pro-apple" disabled={!!busy} onClick={() => signIn('apple')}>
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.59 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.3-3.52zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z"/></svg>
            Continue with Apple
          </button>
        )}
        <button type="button" className="pro-btn pro-ghost" disabled={!!busy} onClick={() => signIn('google')}>
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28v-3.1H1.28a12 12 0 0 0 0 10.76l4.01-3.1z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77z"/></svg>
          Continue with Google
        </button>
        {!APPLE_ON && (
          <p className="pro-fine">Signed in to the app with Apple? Apple sign-in on the web is coming. Until then, buy Pro in the app.</p>
        )}
        <p className="pro-fine">No sign-in in the app yet? Add one first (Settings, Account), so your progress comes with you.</p>
      </div>
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
      <div className="pro-wrap">
        <section className="pro-pitch">
          <span className="pro-eyebrow">STEP GUNNER PRO</span>
          <h1>Your plan to test day.</h1>
          <p className="pro-lede">Ranked by your weakest systems and what Step 2 tests most. Buy it here, and it's on your phone, on the same account.</p>
          <ul className="pro-feats">
            {FEATURES.map((f) => (
              <li key={f.t}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                <div><span className="pro-feat-t">{f.t}</span><span className="pro-feat-d">{f.d}</span></div>
              </li>
            ))}
          </ul>
        </section>

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
      </div>
      <p className="pro-foot">Already pay through the App Store? You're set. Nothing to buy here.</p>

      <style jsx global>{`
        .pro-wrap { max-width: 1200px; margin: 0 auto; padding: 40px 16px 32px; /* the .ax-page gutters, so the column sits under the wordmark */ display: flex; flex-wrap: wrap; align-items: flex-start; gap: 48px; }
        .pro-pitch { flex: 1 1 420px; min-width: 0; display: flex; flex-direction: column; gap: 24px; padding-top: 8px; }
        .pro-eyebrow { font: 600 12px/1 var(--f-mono); letter-spacing: .18em; color: var(--key); }
        .pro-pitch h1 { margin: 0; font-size: 46px; line-height: 1.04; font-weight: 700; letter-spacing: -1px; color: var(--ink); text-wrap: balance; }
        .pro-lede { margin: 0; max-width: 46ch; font-size: 18px; line-height: 1.55; color: var(--ink-2); }
        .pro-feats { list-style: none; margin: 0; padding: 0; max-width: 520px; }
        .pro-feats li { display: flex; gap: 14px; padding: 14px 0; border-top: 1px solid var(--line); color: var(--wards); }
        .pro-feats li > div { display: flex; flex-direction: column; gap: 4px; }
        .pro-feat-t { font: 600 13px/1.3 var(--f-mono); letter-spacing: .12em; color: var(--ink); }
        .pro-feat-d { font-size: 15px; line-height: 1.45; color: var(--ink-2); }

        .pro-card { flex: 1 1 400px; max-width: 480px; min-width: 0; display: flex; flex-direction: column; gap: 20px; padding: 28px;
          border-radius: 20px; color: var(--st-ink);
          background: radial-gradient(90% 60% at 100% 0%, var(--st-card-glow), transparent 60%), linear-gradient(180deg, var(--st-card), var(--st-card-2));
          box-shadow: inset 0 0 0 1px var(--st-line-2), 0 40px 80px -24px var(--st-shadow); }
        .pro-card h2 { margin: 0; font-size: 21px; line-height: 1.25; font-weight: 600; color: var(--st-white); }
        .pro-card .pro-h2-lg { font-size: 28px; font-weight: 700; }
        .pro-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .pro-steps li { display: flex; flex-direction: column; gap: 8px; }
        .pro-steps .bar { height: 3px; border-radius: 2px; background: var(--st-line-2); }
        .pro-steps .lbl { font: 500 11px/1 var(--f-mono); letter-spacing: .14em; color: var(--st-ctl); }
        .pro-steps li.done .bar { background: var(--st-green); }
        .pro-steps li.now .bar { background: var(--st-blue); }
        .pro-steps li.done .lbl, .pro-steps li.now .lbl { color: var(--st-ink); }
        .pro-stack { display: flex; flex-direction: column; gap: 12px; }
        .pro-muted { margin: 0; font-size: 15px; line-height: 1.55; color: var(--st-ink-2); }
        .pro-fine { margin: 0; font-size: 13px; line-height: 1.55; color: var(--st-ink-3); }
        .pro-fine a, .pro-link { color: var(--st-blue); }
        .pro-link { background: none; border: 0; padding: 0; font: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
        .pro-ok { margin: 0; font-size: 13px; line-height: 1.5; color: var(--st-green); }
        .pro-bad { margin: 0; font-size: 13px; line-height: 1.5; color: var(--st-red); }
        .pro-mono { font-family: var(--f-mono); color: var(--st-ink); }

        .pro-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 48px; padding: 0 18px; border-radius: 12px;
          font: 600 15px/1 var(--f-sans); cursor: pointer; border: 0; }
        .pro-btn:disabled { opacity: .55; cursor: default; }
        .pro-apple { background: var(--st-white); color: var(--st-screen); }
        .pro-ghost { background: transparent; color: var(--st-ink); box-shadow: inset 0 0 0 1px var(--st-line-2); }
        .pro-ghost:hover:not(:disabled) { background: var(--st-line); }
        .pro-primary { height: 52px; margin-top: 4px; background: var(--st-act); color: var(--st-on-act); font-size: 16px; box-shadow: 0 12px 30px -8px var(--st-glow-a); }
        .pro-primary:hover:not(:disabled) { background: var(--st-act-hov); }
        .pro-auto { align-self: flex-start; }

        .pro-found { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; font-size: 14px; line-height: 1.45;
          color: var(--st-ink-2); background: var(--st-ok-tint); box-shadow: inset 0 0 0 1px var(--ring-green); }
        .pro-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--st-green); }

        .pro-plan { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 14px; border: 0; text-align: left; cursor: pointer;
          color: var(--st-ink); background: var(--st-card-2); box-shadow: inset 0 0 0 1px var(--st-line-2); font: inherit; }
        .pro-plan.on { background: var(--focus-ring); box-shadow: inset 0 0 0 1px var(--st-blue); }
        .pro-radio { flex: none; width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--st-ctl); display: inline-flex; align-items: center; justify-content: center; }
        .pro-radio span { width: 10px; height: 10px; border-radius: 50%; }
        .pro-plan.on .pro-radio { box-shadow: inset 0 0 0 2px var(--st-blue); }
        .pro-plan.on .pro-radio span { background: var(--st-blue); }
        .pro-plan-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .pro-plan-name { font-size: 16px; font-weight: 600; }
        .pro-plan-sub { font: 500 11.5px/1.2 var(--f-mono); letter-spacing: .06em; color: var(--st-ink-3); }
        .pro-plan-price { font: 500 18px/1 var(--f-mono); color: var(--st-white); font-variant-numeric: tabular-nums; }

        .pro-code { display: flex; gap: 8px; align-items: flex-end; margin: 0; }
        .pro-code-field { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
        .pro-code-field label { font-size: 13px; color: var(--st-ink-2); }
        .pro-code-field input { height: 44px; padding: 0 14px; border-radius: 11px; border: 0; outline: none; color: var(--st-ink);
          background: var(--st-bg); box-shadow: inset 0 0 0 1px var(--st-line-2); font: 500 15px/1 var(--f-mono); letter-spacing: .06em; }
        .pro-code-field input:focus { box-shadow: inset 0 0 0 1px var(--st-blue), 0 0 0 3px var(--focus-ring); }
        .pro-apply { height: 44px; font-size: 14px; }

        .pro-done { align-items: flex-start; }
        .pro-check { width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
          color: var(--st-green); background: var(--st-ok-tint); box-shadow: inset 0 0 0 1px var(--glow-green), 0 0 30px var(--ring-green); }
        .pro-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
        .pro-who { padding-top: 12px; border-top: 1px solid var(--st-line); overflow-wrap: anywhere; }
        .pro-foot { max-width: 1200px; margin: 0 auto; padding: 16px 16px 40px; font-size: 13px; color: var(--ink-3); }

        @media (min-width: 760px) {
          .pro-wrap, .pro-foot { padding-left: 40px; padding-right: 40px; }
        }
        @media (max-width: 600px) {
          .pro-wrap { padding-top: 24px; gap: 32px; }
          .pro-pitch h1 { font-size: 38px; }
          .pro-card { padding: 20px; }
        }
      `}</style>
    </AppShell>
  );
}
