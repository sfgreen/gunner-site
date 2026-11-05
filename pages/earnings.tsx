import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { AppShell } from '../components/app';
import ProSignIn, { APPLE_ON } from '../components/ProSignIn';
import ProStyles from '../components/ProStyles';
import { track } from '../lib/analytics';
import type { EarningsRowView, EarningsView } from '../lib/referralServer';
import { api, fmtDate, fmtUsd, useWebAccount } from '../lib/webAccount';

// stepgunner.com/earnings: a sharer's friend rewards (decision 0057, amended
// 2026-11-04, stories S2 to S6). Signed in with the app's account: Google on the web,
// or the app's handoff link /earnings#h=CODE (no second sign-in). Shows each friend
// (first name or handle only), the totals, and how the sharer is paid: cash to a US
// bank through Stripe's hosted form, or a free month of Pro per friend. Payouts run on
// the 1st (pages/api/cron/referral-payouts.ts). No em or en dashes in copy.

type View = EarningsView & { ok: boolean; error?: string };

type Tone = 'hold' | 'ok' | 'paid' | 'bad' | 'mute';

function statusOf(r: EarningsRowView): { label: string; tone: Tone } {
  switch (r.status) {
    case 'pending':
      if (r.reason === 'monthly_budget') return { label: 'Pays next month', tone: 'hold' };
      return { label: r.payableMs ? `On hold to ${fmtDate(r.payableMs)}` : 'On hold', tone: 'hold' };
    case 'payable': return { label: 'Payable', tone: 'ok' };
    case 'paid': return { label: r.paidMs ? `Paid ${fmtDate(r.paidMs)}` : 'Paid', tone: 'paid' };
    case 'reversed': return { label: r.afterPayout ? 'Refunded after payout' : 'Refunded', tone: 'bad' };
    case 'forfeited': return { label: r.reason === 'year_cap' ? 'Over the yearly cap' : 'Forfeited', tone: 'mute' };
    case 'skipped': return { label: 'Not eligible', tone: 'mute' };
    default: return { label: r.status, tone: 'mute' };
  }
}

const PLAN_LABEL: Record<string, string> = { yearly: 'YEARLY', monthly: 'MONTHLY' };

export default function Earnings() {
  const router = useRouter();
  const account = useWebAccount();
  const { user } = account;
  const [view, setView] = useState<View | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<'' | 'pref' | 'setup'>('');
  const [copied, setCopied] = useState(false);
  const handledReturn = useRef(false);

  useEffect(() => {
    track('earnings_view', {});
  }, []);

  const load = useCallback(async (u: User, refresh = false) => {
    const r = await api<View>(u, `/api/earnings${refresh ? '?refresh=1' : ''}`);
    if (r.ok) {
      setView(r);
      setErr('');
    } else {
      setView(null);
      setErr(r.error || 'Something went wrong. Try again.');
    }
    return r.ok ? r : null;
  }, []);

  const setup = useCallback(async (u: User) => {
    setBusy('setup');
    setErr('');
    track('earnings_setup', {});
    const r = await api<{ url: string }>(u, '/api/earnings/setup', {});
    if (r.ok && r.url) {
      window.location.assign(r.url);
      return;
    }
    setBusy('');
    setErr(r.error || 'Stripe did not open. Try again.');
  }, []);

  // Back from Stripe's form (?payouts=return) or its expired link (?payouts=refresh,
  // which needs a fresh link: Account Links work once, for 5 minutes).
  useEffect(() => {
    if (!user || !router.isReady) {
      if (user === null) setView(null);
      return;
    }
    const back = router.query.payouts;
    if ((back === 'return' || back === 'refresh') && !handledReturn.current) {
      handledReturn.current = true;
      router.replace('/earnings', undefined, { shallow: true });
      track('earnings_stripe_back', { kind: back });
      if (back === 'refresh') {
        setup(user);
        return;
      }
      load(user, true);
      return;
    }
    load(user);
    // router.replace changes the query; this runs once per account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router.isReady]);

  const choose = async (preference: 'cash' | 'pro_months') => {
    if (!user || !view || view.payout.preference === preference) return;
    setBusy('pref');
    setErr('');
    track('earnings_preference', { preference });
    const r = await api<{ preference: string }>(user, '/api/earnings/preference', { preference });
    setBusy('');
    if (r.ok) await load(user);
    else setErr(r.error || 'That did not save. Try again.');
  };

  const copyLink = async () => {
    if (!view?.code) return;
    try {
      await navigator.clipboard.writeText(`https://stepgunner.com/r/${view.code}`);
      setCopied(true);
      track('earnings_copy_link', {});
    } catch (e) {
      setCopied(false);
    }
  };

  const rules = view?.rules;
  const min = fmtUsd(rules?.minPayoutCents ?? 2000);
  const hold = rules?.holdDays ?? 30;
  const yearly = fmtUsd(rules?.centsYearly ?? 1500);
  const monthly = fmtUsd(rules?.centsMonthly ?? 500);
  const cap = fmtUsd(rules?.yearCapCents ?? 199500);

  const anonymous = !!user && user.isAnonymous;
  let panel: JSX.Element;
  if (user === undefined) {
    panel = <p className="pro-muted">{account.err || 'Checking your sign-in...'}</p>;
  } else if (!user || anonymous) {
    panel = (
      <ProSignIn
        title="Sign in to see your rewards"
        lede="Use the same sign-in as the app, so your friends and rewards come up."
        busy={account.busy}
        onSignIn={(p) => account.signIn(p, () => track('earnings_signin', { provider: p }))}
      >
        {!APPLE_ON && <p className="pro-fine">Signed in to the app with Apple? Apple sign-in on the web is coming.</p>}
      </ProSignIn>
    );
  } else if (!view) {
    panel = <p className="pro-muted">{err || 'Finding your rewards...'}</p>;
  } else {
    const t = view.totals;
    const p = view.payout;
    // Only what is saved shows as chosen (review M3): a sharer who never picked is not paid.
    const pref = p.preference;
    panel = (
      <div className="pro-stack">
        <div className="ern-tiles">
          <div className="ern-tile"><span className="ern-k">ON HOLD</span><span className="ern-v">{fmtUsd(t.pendingCents)}</span></div>
          <div className="ern-tile"><span className="ern-k">PAYABLE</span><span className="ern-v ern-ok">{fmtUsd(t.nextCents)}</span></div>
          <div className="ern-tile"><span className="ern-k">PAID</span><span className="ern-v">{fmtUsd(t.paidCents)}</span></div>
        </div>
        {t.owedCents > 0 && (
          <p className="pro-fine">A friend refunded after you were paid, so {fmtUsd(t.owedCents)} comes off your next payout.</p>
        )}

        <h2 className="ern-h">How you get paid</h2>
        {p.cashEligible ? (
          <button type="button" className={`pro-plan${pref === 'cash' ? ' on' : ''}`} aria-pressed={pref === 'cash'} disabled={!!busy} onClick={() => choose('cash')}>
            <span className="pro-radio"><span /></span>
            <span className="pro-plan-txt">
              <span className="pro-plan-name">Cash to your bank</span>
              <span className="pro-plan-sub">{yearly} OR {monthly} PER FRIEND</span>
            </span>
          </button>
        ) : (
          <p className="pro-muted">Outside the US, your rewards come as Pro: a free month for each paying friend. Cash goes to US bank accounts for now.</p>
        )}
        <button type="button" className={`pro-plan${pref === 'pro_months' ? ' on' : ''}`} aria-pressed={pref === 'pro_months'} disabled={!!busy} onClick={() => choose('pro_months')}>
          <span className="pro-radio"><span /></span>
          <span className="pro-plan-txt">
            <span className="pro-plan-name">A free month of Pro</span>
            <span className="pro-plan-sub">ONE MONTH PER FRIEND</span>
          </span>
        </button>

        {pref === 'cash' && !p.open && (
          <p className="pro-muted">Payouts open soon. Your rewards are kept safe and go out once they open.</p>
        )}
        {pref === 'cash' && p.open && p.setup === 'none' && (
          <>
            <button type="button" className="pro-btn pro-primary" disabled={!!busy} onClick={() => setup(user)}>
              {busy === 'setup' ? 'Opening Stripe...' : 'Set up payouts'}
            </button>
            <p className="pro-fine">Stripe asks for your name and bank once, on its own secure page. Step Gunner never sees your bank details.</p>
          </>
        )}
        {pref === 'cash' && p.open && p.setup === 'pending' && (
          <>
            <p className="pro-muted">Stripe is checking your details, or still needs a few more.</p>
            <button type="button" className="pro-btn pro-ghost" disabled={!!busy} onClick={() => setup(user)}>
              {busy === 'setup' ? 'Opening Stripe...' : 'Finish setup'}
            </button>
          </>
        )}
        {pref === 'cash' && p.open && p.setup === 'restricted' && (
          <>
            <p className="pro-bad">Stripe needs more from you before it can pay you.</p>
            <button type="button" className="pro-btn pro-ghost" disabled={!!busy} onClick={() => setup(user)}>
              {busy === 'setup' ? 'Opening Stripe...' : 'Fix it on Stripe'}
            </button>
          </>
        )}
        {pref === 'cash' && p.open && p.setup === 'complete' && (
          <div className="pro-found">
            <span className="pro-dot" aria-hidden="true" />
            <span>
              Paid to <span className="pro-mono">{p.destination || 'your bank'}</span> on the 1st, once {min} or more is payable.{' '}
              <button type="button" className="pro-link" disabled={!!busy} onClick={() => setup(user)}>Change bank</button>
            </span>
          </div>
        )}
        {pref === 'pro_months' && (
          <p className="pro-muted">
            {p.subscribed
              ? 'You already have Pro through your plan. A free month starts the day it is added, so it helps only once your plan has ended.'
              : 'Each paying friend adds a free month of Pro to this account on the 1st.'}
          </p>
        )}
        {!pref && (
          <p className="pro-fine">{p.cashEligible ? 'Pick one to get paid on the 1st.' : 'Tap A free month of Pro to confirm it.'}</p>
        )}

        <h2 className="ern-h">Friends</h2>
        {view.rows.length ? (
          <ul className="ern-rows">
            {view.rows.map((r, i) => {
              const s = statusOf(r);
              return (
                <li key={`${r.firstPaidMs}-${i}`} className="ern-row">
                  <span className="ern-who">
                    <span className="ern-name">{r.name}</span>
                    <span className="ern-sub">{PLAN_LABEL[r.plan || ''] || 'PRO'}{r.firstPaidMs ? ` · JOINED ${fmtDate(r.firstPaidMs).toUpperCase()}` : ''}</span>
                  </span>
                  <span className="ern-amt">
                    <span className="ern-c">{r.cents > 0 ? fmtUsd(r.cents) : ''}</span>
                    <span className={`ern-chip ern-${s.tone}`}>{s.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="pro-stack">
            <p className="pro-muted">No paying friends yet. Share your code: it takes 40% off a friend&apos;s first year.</p>
            {view.code && (
              <div className="pro-row">
                <span className="ern-code">{view.code}</span>
                <button type="button" className="pro-btn pro-ghost pro-auto" onClick={copyLink}>{copied ? 'Copied' : 'Copy invite link'}</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <AppShell
      campaign="earnings"
      pageType="pro"
      section={null}
      seo={{
        title: 'Your friend rewards · Step Gunner',
        description: 'See the friends who joined with your code and how you get paid.',
        path: '/earnings',
        noindex: true,
      }}
    >
      <div className="pro-wrap ern-wrap">
        <section className="pro-pitch">
          <span className="pro-eyebrow">STEP GUNNER · FRIEND REWARDS</span>
          <h1>Your friends, your rewards.</h1>
          <p className="pro-lede">
            Your code takes 40% off a friend&apos;s first year of Pro. When they pay, you earn {yearly} for a yearly plan or {monthly} for a monthly one.
          </p>
          <ul className="pro-feats">
            {[
              { t: `${hold}-DAY HOLD`, d: `A reward is payable ${hold} days after a friend's first payment, if that payment is not refunded.` },
              { t: 'PAID ON THE 1ST', d: `Once ${min} or more is payable, Stripe sends it to your bank.` },
              { t: `UP TO ${cap} A YEAR`, d: 'Rewards stay under the line where tax forms start.' },
              { t: 'OR PRO MONTHS', d: 'Take a free month of Pro for each paying friend instead.' },
            ].map((f) => (
              <li key={f.t}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                <div><span className="pro-feat-t">{f.t}</span><span className="pro-feat-d">{f.d}</span></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="pro-card" aria-label="Your rewards">
          {panel}
          {(err || account.err) && (view || !user) && <p className="pro-bad">{err || account.err}</p>}
          {user && !anonymous && (
            <p className="pro-fine pro-who">
              {user.email ? <>Signed in as {user.email}. </> : null}
              <button type="button" className="pro-link" onClick={account.signOut}>Not you? Sign out</button>
            </p>
          )}
        </section>
      </div>

      <ProStyles />
      <style jsx global>{`
        .ern-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .ern-tile { display: flex; flex-direction: column; gap: 8px; padding: 14px 12px; border-radius: 14px; background: var(--st-card-2); box-shadow: inset 0 0 0 1px var(--st-line-2); min-width: 0; }
        .ern-k { font: 500 11px/1 var(--f-mono); letter-spacing: .14em; color: var(--st-ctl); }
        .ern-v { font: 600 23px/1 var(--f-mono); color: var(--st-white); font-variant-numeric: tabular-nums; }
        .ern-v.ern-ok { color: var(--st-green); }
        .pro-card .ern-h { margin-top: 12px; font-size: 18px; }
        .ern-rows { list-style: none; margin: 0; padding: 0; }
        .ern-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-top: 1px solid var(--st-line); }
        .ern-who { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .ern-name { font-size: 15px; font-weight: 600; color: var(--st-ink); overflow-wrap: anywhere; }
        .ern-sub { font: 500 11px/1.2 var(--f-mono); letter-spacing: .06em; color: var(--st-ink-3); }
        .ern-amt { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex: none; }
        .ern-c { font: 500 16px/1 var(--f-mono); color: var(--st-white); font-variant-numeric: tabular-nums; }
        .ern-chip { font: 500 11px/1 var(--f-mono); letter-spacing: .04em; padding: 6px 8px; border-radius: 8px; white-space: nowrap; }
        .ern-hold { color: var(--st-ink-2); box-shadow: inset 0 0 0 1px var(--st-line-2); }
        .ern-ok { color: var(--st-green); }
        .ern-chip.ern-ok { background: var(--st-ok-tint); }
        .ern-paid { color: var(--st-blue); background: var(--focus-ring); }
        .ern-bad { color: var(--st-red); background: var(--st-bad-tint); }
        .ern-mute { color: var(--st-ink-3); box-shadow: inset 0 0 0 1px var(--st-line); }
        .ern-code { font: 600 18px/1 var(--f-mono); letter-spacing: .1em; color: var(--st-white); align-self: center; }
        @media (max-width: 760px) {
          .ern-wrap .pro-card { order: -1; }
        }
        @media (max-width: 600px) {
          .ern-v { font-size: 19px; }
        }
      `}</style>
    </AppShell>
  );
}
