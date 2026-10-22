import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { AppShell, ArticleHeader, Hero, Table } from '../../components/app';
import { track } from '../../lib/analytics';
import { HOLD_DAYS, isTokenShape, shareUrl, usd, type ChiefStats, type RowStatus } from '../../lib/chiefs';

// /chiefs/me?t=<token>: a Chief's private numbers. The token in the URL is the
// only credential, so this page is noindex, never cached, and sends no
// Referer (the token must not leak to the App Store or GA through a click).
// Buyer-blind: getChiefStats strips everything but date, amount and status.

type Props = { stats: ChiefStats | null; hadToken: boolean };

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const t = query.t;
  let stats: ChiefStats | null = null;
  if (isTokenShape(t)) {
    try {
      const { getChiefStats } = await import('../../lib/chiefsServer');
      stats = await getChiefStats(t);
    } catch (err) {
      console.error('chiefs/me: lookup failed', err);
    }
  }
  if (!stats) res.statusCode = 404;
  return { props: { stats, hadToken: typeof t === 'string' && t.length > 0 } };
};

const LABEL: Record<RowStatus, string> = {
  pending: 'Pending',
  eligible: 'Eligible',
  paid: 'Paid',
  refunded: 'Refunded',
  clawback: 'Refunded after payout',
  test: 'Test purchase',
};

export default function ChiefMe({ stats, hadToken }: Props) {
  return (
    <>
      <Head>
        <title>Your Chief numbers | Step Gunner</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <AppShell campaign="chiefs_me" navCta={{ label: 'Chiefs', href: '/chiefs' }}>
        {stats ? <Dashboard s={stats} /> : <NotFound hadToken={hadToken} />}
      </AppShell>
    </>
  );
}

function NotFound({ hadToken }: { hadToken: boolean }) {
  return (
    <Hero>
      <ArticleHeader
        category="site"
        byline={false}
        eyebrow="Chief dashboard"
        title={hadToken ? 'This link is not valid.' : 'This page needs your private link.'}
        dek={<>
          {hadToken
            ? 'It may have been mistyped or replaced with a new one. '
            : 'Open the link from your Chief welcome email. '}
          For a fresh link, email <a href="mailto:rezumab.med@gmail.com">rezumab.med@gmail.com</a> from the address you applied with.
        </>}
      />
      <div className="mk isl"><div className="cm-gap" /></div>
      <style jsx global>{`.mk .cm-gap { height: 64px; }`}</style>
    </Hero>
  );
}

function Dashboard({ s }: { s: ChiefStats }) {
  const link = shareUrl(s.code);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const nextPayout = Math.max(0, s.eligibleUSD - s.deductUSD);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      inputRef.current?.select(); // clipboard blocked: leave it selected for a manual copy
      return;
    }
    setCopied(true);
    track('chief_link_copy', { code: s.code });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Hero>
        <div className="mk isl">
          {s.preview && <p className="cm-pv">Preview data. Local design fixture, not a real Chief.</p>}
        </div>
        <ArticleHeader
          category="site"
          byline={false}
          eyebrow="Chief dashboard, private"
          title={s.displayName ? `${s.displayName}, your numbers.` : 'Your numbers.'}
          accent={s.displayName ? 'your numbers.' : undefined}
          dek={`As of ${s.asOf}. Only people with this link can see this page.`}
        />
        <div className="mk isl">
          {!s.active && (
            <p className="cm-paused" role="status">
              <svg className="ic sm" aria-hidden="true"><use href="#i-warn" /></svg>
              Your code is paused right now, so new signups cannot redeem it. Earnings below still pay out as usual.
            </p>
          )}

          {/* Lead with the answer: what is coming to you next. */}
          <div className="cm-money">
            <div className="cm-lead">
              <span className="lbl">Next payout</span>
              <span className="cm-v num">{usd(nextPayout)}</span>
              <span className="cm-c">
                {s.deductUSD > 0
                  ? `${usd(s.eligibleUSD)} eligible, less ${usd(s.deductUSD)} refunded after an earlier payout.`
                  : 'Eligible signups, paid in the next monthly payout.'}
              </span>
            </div>
            <div>
              <span className="lbl">Pending</span>
              <span className="cm-v sm num">{usd(s.pendingUSD)}</span>
              <span className="cm-c">Under {HOLD_DAYS} days old.</span>
            </div>
            <div>
              <span className="lbl">Paid to date</span>
              <span className="cm-v sm num">{usd(s.paidUSD)}</span>
              <span className="cm-c">All payouts so far.</span>
            </div>
          </div>

          <dl className="cm-counts">
            <div><dt>Signups this month</dt><dd className="num">{s.monthCount}</dd></div>
            <div><dt>Signups all time</dt><dd className="num">{s.allCount}</dd></div>
            <div><dt>Refunds</dt><dd className="num">{s.refundCount}</dd></div>
          </dl>

          <section className="cm-sec" aria-labelledby="share-h">
            <h2 className="lbl" id="share-h">Your code and link</h2>
            <div className="sheet cm-share">
              <div className="sheet-bd">
                <span className="cm-code">{s.code}</span>
                <div className="cm-linkrow">
                  <input className="inp" ref={inputRef} readOnly value={link} aria-label="Your share link" onFocus={(e) => e.currentTarget.select()} />
                  <button type="button" className="btn btn-q" onClick={copy}>
                    <svg className="ic sm" aria-hidden="true"><use href={copied ? '#i-check' : '#i-copy'} /></svg>{copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
                <span className="sr" aria-live="polite">{copied ? 'Link copied' : ''}</span>
                <p className="fine cm-tip">When you share it, say it is your code and that you earn from it.</p>
              </div>
            </div>
          </section>

          <section className="cm-sec" aria-labelledby="ledger-h">
            <h2 className="lbl" id="ledger-h">Signups</h2>
            {s.rows.length === 0 ? (
              <div className="empty cm-empty">
                <b>No signups yet.</b>
                <p>When someone redeems {s.code}, it appears here once the App Store reports the purchase. Each one pays {HOLD_DAYS} days later, in the next monthly payout.</p>
              </div>
            ) : (
              <Table
                label="Your signups, newest first. Dates in Central time."
                head={['Date', 'Amount', 'Status']}
                num={[1]}
                rows={s.rows.map((r) => [
                  r.date,
                  <span key="a" className={r.status === 'refunded' || r.status === 'test' ? 'cm-strike' : undefined}>{r.status === 'clawback' ? '-' : ''}{usd(r.amount)}</span>,
                  <span key="s" className={'cm-st ' + r.status}><i aria-hidden="true" />{LABEL[r.status]}</span>,
                ])}
              />
            )}
            <p className="fine cm-legend">
              Pending: under {HOLD_DAYS} days old. Eligible: paid in the next monthly payout. A refund before payout is
              never paid; a refund after payout comes off the next one.
            </p>
          </section>
          <div className="cm-gap" />
        </div>
      </Hero>

      <style jsx global>{`
        .mk .cm-pv { margin-bottom: 16px; padding: 8px 12px; border-radius: 8px; outline: 1px dashed var(--step2); outline-offset: -1px; font: 600 13px/1.4 var(--f-mono); color: var(--step2); max-width: 820px; }
        .mk .cm-paused { display: flex; align-items: flex-start; gap: 8px; max-width: 820px; margin-top: 24px; padding: 12px 16px; border-radius: var(--r-md); background: var(--step2-tint); box-shadow: inset 4px 0 0 var(--step2); color: var(--ink); font-weight: 600; }
        .mk .cm-paused .ic { margin-top: 4px; color: var(--step2); }
        .mk .cm-money { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; max-width: 820px; margin-top: 32px; border-radius: var(--r-lg); overflow: hidden; background: var(--line); box-shadow: 0 1px 2px var(--shadow-a), 0 12px 32px -16px var(--shadow-b), 0 0 0 1px var(--line); }
        .mk .cm-money > div { display: grid; align-content: start; gap: 8px; min-width: 0; padding: 16px; background: var(--card); }
        .mk .cm-money .cm-lead { grid-column: 1 / -1; padding: 24px 16px; }
        .mk .cm-v { font: 800 46px/1.05 var(--f-sans); letter-spacing: -.035em; color: var(--ink); font-variant-numeric: tabular-nums; }
        .mk .cm-v.num { font-family: var(--f-sans); }
        .mk .cm-v.sm { font-size: 23px; letter-spacing: -.02em; }
        .mk .cm-c { font-size: 15px; line-height: 1.45; color: var(--ink-2); }
        .mk .cm-counts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; max-width: 820px; margin-top: 24px; }
        .mk .cm-counts > div { display: flex; flex-direction: column; justify-content: space-between; padding-top: 12px; box-shadow: inset 0 1px 0 var(--line-2); }
        .mk .cm-counts dt { font-size: 15px; line-height: 1.3; color: var(--ink-2); }
        .mk .cm-counts dd { margin-top: 4px; font: 800 28px/1.1 var(--f-sans); color: var(--ink); }
        .mk .cm-sec { max-width: 820px; margin-top: 48px; }
        .mk .cm-sec > .lbl { margin-bottom: 16px; }
        .mk .cm-code { display: block; margin-bottom: 16px; font: 800 28px/1.2 var(--f-mono); letter-spacing: .12em; color: var(--ink); overflow-wrap: anywhere; }
        .mk .cm-linkrow { display: flex; gap: 8px; }
        .mk .cm-linkrow .inp { flex: 1 1 auto; min-width: 0; font-size: 15px; background: var(--card-2); }
        .mk .cm-linkrow .btn { flex: none; min-height: 48px; }
        .mk .cm-tip { margin-top: 12px; }
        .mk .cm-empty { margin-top: 0; }
        .mk .cm-empty p { margin-top: 8px; }
        .mk .cm-strike { color: var(--ink-3); text-decoration: line-through; }
        .mk .cm-st { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: var(--ink); white-space: nowrap; }
        .mk .cm-st i { width: 8px; height: 8px; border-radius: 50%; background: var(--ink-3); flex: none; }
        .mk .cm-st.eligible i { background: var(--step2); }
        .mk .cm-st.paid i { background: var(--ok); }
        .mk .cm-st.pending i { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ink-3); }
        .mk .cm-st.refunded i, .mk .cm-st.clawback i { background: var(--bad); }
        .mk .cm-st.test i { background: transparent; outline: 1.5px dashed var(--ink-3); outline-offset: -1.5px; }
        .mk .cm-legend { margin-top: 12px; max-width: 60ch; }
        .mk .cm-gap { height: 64px; }
        @media (min-width: 640px) {
          .mk .cm-money { grid-template-columns: 2fr 1fr 1fr; }
          .mk .cm-money .cm-lead { grid-column: auto; }
          .mk .cm-money > div { padding: 24px; }
          .mk .cm-v { font-size: 58px; }
          .mk .cm-v.sm { font-size: 28px; margin-top: 8px; }
        }
      `}</style>
    </>
  );
}
