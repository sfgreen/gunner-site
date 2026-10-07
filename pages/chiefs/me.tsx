import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import SiteShell from '../../components/SiteShell';
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
      </Head>
      <SiteShell campaign="chiefs_me" measure="article" cta={{ label: 'Chiefs', href: '/chiefs' }}>
        {stats ? <Dashboard s={stats} /> : <NotFound hadToken={hadToken} />}
      </SiteShell>
      <style jsx global>{`
        .me { --gold-deep: #8a5600; padding-top: 24px; }
        .me .eyebrow {
          font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--gold-deep);
        }
        .me h1 {
          font-size: clamp(32px, 6vw, 48px); font-weight: 800; letter-spacing: -0.03em;
          line-height: 1.05; margin: 16px 0 8px;
        }
        .me .asof { margin: 0 0 32px; font-size: 14px; color: var(--ink-dim); }
        .me h2 {
          font-family: var(--mono); font-size: 12px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--ink-dim); margin: 0 0 16px;
        }
        .me section { margin-top: 48px; }
        .me .lede { font-size: 18px; color: var(--ink-dim); max-width: 34em; }
      `}</style>
    </>
  );
}

function NotFound({ hadToken }: { hadToken: boolean }) {
  return (
    <div className="me">
      <span className="eyebrow">Chief dashboard</span>
      <h1>{hadToken ? 'This link is not valid.' : 'This page needs your private link.'}</h1>
      <p className="lede">
        {hadToken
          ? 'It may have been mistyped or replaced with a new one. '
          : 'Open the link from your Chief welcome email. '}
        For a fresh link, email <a href="mailto:rezumab.med@gmail.com">rezumab.med@gmail.com</a> from the address you applied with.
      </p>
    </div>
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
    <div className="me">
      {s.preview && <p className="pv">Preview data. Local design fixture, not a real Chief.</p>}
      <span className="eyebrow">Chief dashboard, private</span>
      <h1>{s.displayName ? `${s.displayName}, your numbers.` : 'Your numbers.'}</h1>
      <p className="asof">As of {s.asOf}. Only people with this link can see this page.</p>

      {!s.active && (
        <p className="paused" role="status">
          Your code is paused right now, so new signups cannot redeem it. Earnings below still pay out as usual.
        </p>
      )}

      {/* Lead with the answer: what is coming to you next. */}
      <div className="money">
        <div className="lead">
          <span className="k">Next payout</span>
          <span className="v">{usd(nextPayout)}</span>
          <span className="c">
            {s.deductUSD > 0
              ? `${usd(s.eligibleUSD)} eligible, less ${usd(s.deductUSD)} refunded after an earlier payout.`
              : 'Eligible signups, paid in the next monthly payout.'}
          </span>
        </div>
        <div>
          <span className="k">Pending</span>
          <span className="v sm">{usd(s.pendingUSD)}</span>
          <span className="c">Under {HOLD_DAYS} days old.</span>
        </div>
        <div>
          <span className="k">Paid to date</span>
          <span className="v sm">{usd(s.paidUSD)}</span>
          <span className="c">All payouts so far.</span>
        </div>
      </div>

      <dl className="counts">
        <div><dt>Signups this month</dt><dd>{s.monthCount}</dd></div>
        <div><dt>Signups all time</dt><dd>{s.allCount}</dd></div>
        <div><dt>Refunds</dt><dd>{s.refundCount}</dd></div>
      </dl>

      <section aria-labelledby="share-h">
        <h2 id="share-h">Your code and link</h2>
        <div className="share">
          <span className="code">{s.code}</span>
          <div className="linkrow">
            <input ref={inputRef} readOnly value={link} aria-label="Your share link" onFocus={(e) => e.currentTarget.select()} />
            <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
          </div>
          <span className="sr" aria-live="polite">{copied ? 'Link copied' : ''}</span>
          <p className="tip">When you share it, say it is your code and that you earn from it.</p>
        </div>
      </section>

      <section aria-labelledby="ledger-h">
        <h2 id="ledger-h">Signups</h2>
        {s.rows.length === 0 ? (
          <div className="empty">
            <b>No signups yet.</b>
            <p>When someone redeems {s.code}, it appears here once the App Store reports the purchase. Each one pays {HOLD_DAYS} days later, in the next monthly payout.</p>
          </div>
        ) : (
          <div className="tw">
            <table>
              <caption className="sr">Your signups, newest first. Dates in Central time.</caption>
              <thead>
                <tr><th scope="col">Date</th><th scope="col" className="r">Amount</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {s.rows.map((r, i) => (
                  <tr key={i} className={r.status}>
                    <td>{r.date}</td>
                    <td className="r n">{r.status === 'clawback' ? '-' : ''}{usd(r.amount)}</td>
                    <td><span className={'st ' + r.status}><i aria-hidden="true" />{LABEL[r.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="legend">
          Pending: under {HOLD_DAYS} days old. Eligible: paid in the next monthly payout. A refund before payout is
          never paid; a refund after payout comes off the next one.
        </p>
      </section>

      <style jsx>{`
        .pv {
          margin: 0 0 24px; padding: 8px 12px; border: 1px dashed var(--gold-deep); border-radius: 8px;
          font-family: var(--mono); font-size: 12px; color: var(--gold-deep);
        }
        .paused {
          border-left: 3px solid var(--gold); background: var(--gold-soft); padding: 12px 16px;
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0; margin: 0 0 24px; font-weight: 600;
        }
        .k {
          display: block; font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--ink-dim);
        }
        .money {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--hair-strong);
          border: 1px solid var(--hair-strong); border-radius: var(--radius); overflow: hidden;
          box-shadow: var(--lift);
        }
        .money > div { background: var(--panel); padding: 16px; }
        .money .lead { grid-column: 1 / -1; padding: 24px 16px; }
        .v {
          display: block; font-size: 48px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.05;
          margin-top: 8px; font-variant-numeric: tabular-nums;
        }
        .v.sm { font-size: 24px; letter-spacing: -0.02em; }
        .c { display: block; font-size: 14px; color: var(--ink-dim); margin-top: 8px; line-height: 1.4; }

        .counts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0 0; }
        .counts div { border-top: 1px solid var(--hair-strong); padding-top: 12px; display: flex; flex-direction: column; justify-content: space-between; }
        .counts dt { font-size: 13px; color: var(--ink-dim); line-height: 1.3; }
        .counts dd { margin: 4px 0 0; font-size: 28px; font-weight: 800; font-variant-numeric: tabular-nums; }

        .share { border: 1px solid var(--hair-strong); border-radius: var(--radius); padding: 16px; background: var(--bg-2); }
        .code { display: block; font-family: var(--mono); font-size: 28px; font-weight: 800; letter-spacing: 0.12em; margin-bottom: 16px; }
        .linkrow { display: flex; gap: 8px; }
        .linkrow input {
          flex: 1 1 auto; min-width: 0; min-height: 48px; padding: 0 12px; font: inherit; font-family: var(--mono);
          font-size: 14px; color: var(--ink); background: var(--bg-3); border: 1px solid var(--hair-strong);
          border-radius: var(--radius-sm);
        }
        .linkrow button {
          flex: 0 0 auto; min-height: 48px; min-width: 112px; padding: 0 16px; border-radius: var(--radius-sm);
          border: 0; background: var(--ink); color: #fff; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
        }
        .linkrow button:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
        .tip { margin: 12px 0 0; font-size: 14px; color: var(--ink-dim); }
        .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

        .empty { border: 1px dashed var(--hair-strong); border-radius: var(--radius); padding: 24px; }
        .empty p { margin: 8px 0 0; color: var(--ink-dim); }

        .tw { overflow-x: auto; border: 1px solid var(--hair-strong); border-radius: var(--radius-sm); background: var(--panel); }
        table { border-collapse: collapse; width: 100%; font-size: 15px; }
        th {
          text-align: left; font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--ink-dim); font-weight: 700; padding: 12px 16px; background: var(--bg-3);
          border-bottom: 1px solid var(--hair-strong); white-space: nowrap;
        }
        td { padding: 12px 16px; border-bottom: 1px solid var(--hair); white-space: nowrap; }
        tr:last-child td { border-bottom: none; }
        .r { text-align: right; }
        .n { font-variant-numeric: tabular-nums; }
        tr.refunded .n, tr.test .n { color: var(--ink-dim); text-decoration: line-through; }
        .st { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
        .st i { width: 8px; height: 8px; border-radius: 50%; background: var(--ink-dim); flex: 0 0 auto; }
        .st.eligible i { background: var(--gold); }
        .st.paid i { background: var(--green); }
        .st.pending i { background: transparent; border: 1.5px solid var(--ink-dim); }
        .st.refunded i, .st.clawback i { background: var(--red); }
        .st.test i { background: transparent; border: 1.5px dashed var(--ink-dim); }
        .legend { margin: 12px 0 0; font-size: 14px; color: var(--ink-dim); max-width: 60ch; }

        @media (min-width: 640px) {
          .money { grid-template-columns: 2fr 1fr 1fr; }
          .money .lead { grid-column: auto; }
          .money > div { padding: 24px; }
          .v { font-size: 56px; }
          .v.sm { font-size: 28px; margin-top: 16px; }
        }
      `}</style>
    </div>
  );
}
