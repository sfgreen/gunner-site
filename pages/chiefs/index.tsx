import Head from 'next/head';
import { FormEvent, useEffect, useRef, useState } from 'react';
import SiteShell from '../../components/SiteShell';
import { track, referrerHost } from '../../lib/analytics';
import {
  AUDIENCES, CHANNELS, CHIEF_YEARLY, COMMISSION, HOLD_DAYS, LIST_YEARLY, PROCEEDS, YEARS,
  usd, type FieldErrors,
} from '../../lib/chiefs';

// /chiefs: the invitation-only program page and the application form.
//
// Register: Score Report light, the site's only register since 2026-08-24, with
// the ink band as its one sanctioned dark surface. Premium here comes from
// restraint, not from a new palette: one very large headline, a lot of air, a
// single ink "terms card" that reads like an invitation, gold reserved for the
// one action (Apply) and the money figures on the card, and nothing else lifted.
// A coupon page shouts the discount; this page leads with selection and puts
// the numbers in a quiet card, the way a private bank shows a rate.

const PAGE_TITLE = 'Step Gunner Chiefs | By invitation';
const PAGE_DESC =
  'Step Gunner Chiefs share Step Gunner with a code of their own. Friends get the first year of Pro at half price, and the Chief earns half of what we make.';

type Status = 'idle' | 'sending' | 'done' | 'error';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'When do I get paid?',
    a: `Monthly. A signup becomes eligible ${HOLD_DAYS} days after the purchase, and everything eligible is paid in the next monthly payout.`,
  },
  {
    q: 'What if someone gets a refund?',
    a: 'If a signup is refunded before it pays out, it never pays out. If it is refunded after, that amount comes off your next payout.',
  },
  {
    q: 'Do I need tax paperwork?',
    a: 'If you are paid in the US, you send a W-9 before your first payout. If your total for the year passes the IRS reporting threshold, you receive a 1099-NEC.',
  },
  {
    q: 'Do I earn on renewals?',
    a: 'No. You earn on the first year only. If your friend stays for a second year, that renewal is at the regular price and is not shared.',
  },
  {
    q: 'Who can use my code?',
    a: 'New Step Gunner Pro subscribers on the yearly plan, redeemed through the App Store. Someone who already subscribes cannot use it.',
  },
  {
    q: 'Are there quotas?',
    a: 'No. Share it once or every week. Nobody measures your effort, and there is no minimum to stay a Chief.',
  },
  {
    q: 'How are Chiefs chosen?',
    a: 'We read every application ourselves. We look for students whose classmates already ask them what to use, and we keep the group small.',
  },
];

export default function Chiefs() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [fields, setFields] = useState<FieldErrors>({});
  const [channels, setChannels] = useState<string[]>([]);
  const alertRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => { track('chiefs_view', { ref: referrerHost() }); }, []);
  useEffect(() => {
    if (status === 'error') alertRef.current?.focus();
    if (status === 'done') doneRef.current?.focus();
  }, [status]);

  const toggle = (c: string) =>
    setChannels((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;
    const f = new FormData(e.currentTarget);
    const params = new URLSearchParams(window.location.search);
    const body = {
      name: f.get('name'), email: f.get('email'), school: f.get('school'), year: f.get('year'),
      channels, channelsOther: f.get('channelsOther'), audience: f.get('audience'), why: f.get('why'),
      company: f.get('company'),
      source: params.get('src') || `chiefs_page${referrerHost() ? ':' + referrerHost() : ''}`,
    };
    setStatus('sending');
    setFields({});
    track('chiefs_apply_submit', { channels: channels.length });
    try {
      const r = await fetch('/api/chiefs-apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; fields?: FieldErrors };
      if (r.ok && j.ok) {
        setStatus('done');
        track('chiefs_apply_success', {});
        return;
      }
      setFields(j.fields || {});
      setMessage(j.error || 'Something went wrong. Try again.');
      setStatus('error');
      track('chiefs_apply_error', { code: r.status });
    } catch {
      setMessage('Could not reach the server. Check your connection and try again.');
      setStatus('error');
      track('chiefs_apply_error', { code: 0 });
    }
  }

  const err = (k: keyof FieldErrors) =>
    fields[k] ? <span className="ferr" id={`e-${k}`}>{fields[k]}</span> : null;
  const aria = (k: keyof FieldErrors) =>
    fields[k] ? { 'aria-invalid': true, 'aria-describedby': `e-${k}` } : {};

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
        <link rel="canonical" href="https://stepgunner.com/chiefs" />
        <meta property="og:title" content="Step Gunner Chiefs" />
        <meta property="og:description" content="By invitation. A code of your own, half off for your friends, half of what we make for you." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stepgunner.com/chiefs" />
      </Head>

      <SiteShell campaign="chiefs" measure="article" cta={{ label: 'Apply', href: '#apply' }}>
        <div className="chiefs">
          <header className="hero">
            <span className="eyebrow">Step Gunner Chiefs</span>
            <h1>Chiefs are chosen.</h1>
            <p className="lede">
              Every class has a few people everyone else asks what to use for Step 2. We invite a small
              number of them to share Step Gunner with a code of their own, and we pay them for it.
            </p>
            <a href="#apply" className="go" onClick={() => track('chiefs_cta_click', { location: 'hero' })}>
              Apply to be a Chief
            </a>
          </header>

          <section className="card" aria-labelledby="terms-h">
            <div className="card-top">
              <span id="terms-h">The terms</span>
              <span>By invitation</span>
            </div>
            <dl className="figs">
              <div>
                <dt>Your friends pay</dt>
                <dd className="v">{usd(CHIEF_YEARLY)}</dd>
                <dd className="c">for the first year of Pro, instead of {usd(LIST_YEARLY)}.</dd>
              </div>
              <div>
                <dt>You earn</dt>
                <dd className="v gold">{usd(COMMISSION)}</dd>
                <dd className="c">on every first-year signup with your code.</dd>
              </div>
              <div>
                <dt>Paid</dt>
                <dd className="v">Monthly</dd>
                <dd className="c">once a signup is {HOLD_DAYS} days old.</dd>
              </div>
            </dl>
            <p className="math">
              Apple keeps 15% of {usd(CHIEF_YEARLY)}. Step Gunner keeps {usd(PROCEEDS)}. Half of that is yours.
            </p>
          </section>

          <section aria-labelledby="gets-h">
            <span className="kicker">What a Chief gets</span>
            <h2 id="gets-h">A code with your name on it.</h2>
            <ol className="rows">
              <li>
                <span className="n" aria-hidden="true">01</span>
                <div><b>Your own code and link.</b> Something like MAYA50, plus a link that opens the App Store with the code already filled in.</div>
              </li>
              <li>
                <span className="n" aria-hidden="true">02</span>
                <div><b>Half off for your friends.</b> New subscribers get the first year of Pro for {usd(CHIEF_YEARLY)} instead of {usd(LIST_YEARLY)}. Year two renews at the regular price.</div>
              </li>
              <li>
                <span className="n" aria-hidden="true">03</span>
                <div><b>Half of what we make.</b> About {usd(COMMISSION)} for every first-year signup, paid monthly. No cap.</div>
              </li>
              <li>
                <span className="n" aria-hidden="true">04</span>
                <div><b>Your numbers, privately.</b> A page only you can open, with signups this month and all time, and what is pending, eligible and paid.</div>
              </li>
            </ol>
          </section>

          <section aria-labelledby="ask-h">
            <span className="kicker">What we ask</span>
            <h2 id="ask-h">Three things, no quotas.</h2>
            <ol className="rows">
              <li>
                <span className="n" aria-hidden="true">01</span>
                <div><b>Share it honestly.</b> Say what you actually think of the app, including what it does not do for you.</div>
              </li>
              <li>
                <span className="n" aria-hidden="true">02</span>
                <div><b>Say it is your code.</b> Every time you share it, make clear you earn from it. &ldquo;My code, I get a cut&rdquo; is enough.</div>
              </li>
              <li>
                <span className="n" aria-hidden="true">03</span>
                <div><b>Nothing else.</b> No quotas, no posting schedule, no minimum. Share it when it is useful to someone.</div>
              </li>
            </ol>
          </section>

          <section aria-labelledby="faq-h">
            <span className="kicker">Questions</span>
            <h2 id="faq-h">The fine print, in plain words.</h2>
            <div className="faq">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="apply" aria-labelledby="apply-h" className="apply">
            <span className="kicker">Apply</span>
            <h2 id="apply-h">Tell us where you would share it.</h2>
            <p className="sub">
              We read every application. If it is a fit, your code and private link arrive by email.
            </p>

            {status === 'done' ? (
              <div className="done" ref={doneRef} tabIndex={-1} role="status">
                <b>Application received.</b>
                <p>Thank you. We read each one ourselves, so it can take a few days. You will hear from us either way.</p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                {status === 'error' && (
                  <div className="alert" role="alert" tabIndex={-1} ref={alertRef}>{message}</div>
                )}

                <div className="grid2">
                  <label className="f">
                    <span className="l">Name</span>
                    <input name="name" autoComplete="name" required maxLength={80} {...aria('name')} />
                    {err('name')}
                  </label>
                  <label className="f">
                    <span className="l">Email</span>
                    <input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={120} {...aria('email')} />
                    {err('email')}
                  </label>
                  <label className="f">
                    <span className="l">School</span>
                    <input name="school" autoComplete="organization" required maxLength={120} {...aria('school')} />
                    {err('school')}
                  </label>
                  <label className="f">
                    <span className="l">Year</span>
                    <select name="year" required defaultValue="" {...aria('year')}>
                      <option value="" disabled>Choose</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {err('year')}
                  </label>
                </div>

                <fieldset className="f" {...aria('channels')}>
                  <legend className="l">Where you would share it</legend>
                  <div className="chips">
                    {CHANNELS.map((c) => (
                      <label key={c} className={'chip' + (channels.includes(c) ? ' on' : '')}>
                        <input type="checkbox" checked={channels.includes(c)} onChange={() => toggle(c)} />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    name="channelsOther" className="other" maxLength={160}
                    placeholder="Other, or a handle or link (optional)" aria-label="Other places, handles or links (optional)"
                  />
                  {err('channels')}
                </fieldset>

                <fieldset className="f" {...aria('audience')}>
                  <legend className="l">Roughly how many people would see it</legend>
                  <div className="chips">
                    {AUDIENCES.map((a) => (
                      <label key={a} className="chip radio">
                        <input type="radio" name="audience" value={a} />
                        <span>{a}</span>
                      </label>
                    ))}
                  </div>
                  {err('audience')}
                </fieldset>

                <label className="f">
                  <span className="l">Why you</span>
                  <textarea
                    name="why" rows={4} maxLength={1200} required
                    placeholder="Who asks you what to use, and what you would tell them."
                    {...aria('why')}
                  />
                  {err('why')}
                </label>

                {/* Honeypot. Hidden from people and from assistive tech. */}
                <div className="hp" aria-hidden="true">
                  <label>Company <input name="company" tabIndex={-1} autoComplete="off" /></label>
                </div>

                <button type="submit" className="go" disabled={status === 'sending'} aria-busy={status === 'sending'}>
                  {status === 'sending' ? 'Sending' : 'Send application'}
                </button>
                <p className="fine">
                  We use this only to review your application. Applying commits you to nothing.
                </p>
              </form>
            )}
          </section>
        </div>
      </SiteShell>

      <style jsx>{`
        /* Local tokens. --gold-deep exists because the site --gold-ink (#b87400)
           is 3.8:1 on paper, under AA for 12px text; #8a5600 is 5.9:1. */
        .chiefs { --gold-deep: #8a5600; }

        /* ---- hero: the headline does the work, so it gets the size ---- */
        .hero { padding: 32px 0 40px; }
        .eyebrow, .kicker {
          display: inline-block; font-family: var(--mono); font-size: 12px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold-deep);
        }
        h1 {
          font-size: clamp(44px, 10vw, 80px); font-weight: 800; letter-spacing: -0.04em;
          line-height: 0.98; margin: 16px 0 24px;
        }
        .lede {
          font-size: clamp(18px, 2.4vw, 21px); line-height: 1.5; color: var(--ink-dim);
          max-width: 34em; margin: 0 0 32px;
        }

        /* the one action, the one gold object */
        .go {
          display: inline-flex; align-items: center; justify-content: center; min-height: 48px;
          padding: 0 24px; border-radius: 12px; border: 0; cursor: pointer;
          background: var(--gold); color: #1a1403; font: inherit; font-size: 16px; font-weight: 800;
          text-decoration: none; transition: transform .16s ease-out, box-shadow .16s ease-out;
          box-shadow: 0 8px 24px -12px rgba(224, 142, 0, 0.6);
        }
        .go:hover { text-decoration: none; transform: translateY(-1px); box-shadow: 0 12px 28px -12px rgba(224, 142, 0, 0.7); }
        .go:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
        .go[disabled] { opacity: 0.6; cursor: progress; transform: none; }

        /* ---- the terms card: the page's single dark surface ---- */
        .card {
          position: relative; overflow: hidden; background: var(--ink); color: #fff;
          border-radius: 20px; padding: 24px; box-shadow: var(--lift-lg);
        }
        .card::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(70% 90% at 100% 0%, rgba(240, 180, 41, 0.16), transparent 60%);
        }
        .card > * { position: relative; }
        .card-top {
          display: flex; justify-content: space-between; gap: 16px;
          font-family: var(--mono); font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72); padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        }
        .figs { display: grid; grid-template-columns: 1fr; gap: 24px; margin: 24px 0; }
        .figs dt {
          font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
        }
        .figs dd { margin: 0; }
        .figs .v {
          font-size: 40px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-top: 8px;
          font-variant-numeric: tabular-nums;
        }
        .figs .v.gold { color: #f0b429; }
        .figs .c { font-size: 15px; line-height: 1.45; color: rgba(255, 255, 255, 0.78); margin-top: 4px; }
        .math {
          margin: 0; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.14);
          font-family: var(--mono); font-size: 12.5px; line-height: 1.6; color: rgba(255, 255, 255, 0.72);
        }

        /* ---- sections ---- */
        section { padding-top: 64px; }
        section.card { padding-top: 24px; }
        h2 {
          font-size: clamp(26px, 4.4vw, 36px); font-weight: 800; letter-spacing: -0.025em;
          line-height: 1.12; margin: 8px 0 24px;
        }
        .sub { color: var(--ink-dim); margin: -8px 0 24px; max-width: 36em; }

        .rows { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--hair-strong); }
        .rows li {
          display: grid; grid-template-columns: 40px 1fr; gap: 8px; padding: 16px 0;
          border-bottom: 1px solid var(--hair); line-height: 1.55;
        }
        .rows .n { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--ink-dim); padding-top: 4px; }
        .rows b { font-weight: 700; }
        .rows div { color: var(--ink-dim); }
        .rows div b { color: var(--ink); }

        .faq { border-top: 1px solid var(--hair-strong); }
        details { border-bottom: 1px solid var(--hair); }
        summary {
          list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center;
          gap: 16px; min-height: 56px; padding: 8px 0; font-weight: 700;
        }
        summary::-webkit-details-marker { display: none; }
        summary::after {
          content: ""; flex: 0 0 auto; width: 8px; height: 8px; margin-right: 4px;
          border-right: 2px solid var(--ink-dim); border-bottom: 2px solid var(--ink-dim);
          transform: rotate(45deg) translateY(-2px); transition: transform .18s ease-out;
        }
        details[open] summary::after { transform: rotate(225deg) translateY(-2px); }
        details p { margin: 0 0 16px; color: var(--ink-dim); max-width: 60ch; }

        /* ---- form ---- */
        form { display: grid; gap: 24px; }
        .grid2 { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .f { display: grid; gap: 8px; margin: 0; padding: 0; border: 0; min-width: 0; }
        .l { font-size: 14px; font-weight: 700; padding: 0; }
        input, select, textarea {
          font: inherit; font-size: 16px; color: var(--ink); background: var(--bg-2);
          border: 1px solid var(--hair-strong); border-radius: var(--radius-sm);
          padding: 12px 14px; min-height: 48px; width: 100%;
          transition: border-color .16s ease-out, box-shadow .16s ease-out;
        }
        textarea { resize: vertical; line-height: 1.5; }
        input::placeholder, textarea::placeholder { color: #6b7280; }
        input:focus, select:focus, textarea:focus {
          outline: none; border-color: var(--ink); box-shadow: 0 0 0 3px rgba(25, 28, 35, 0.12);
        }
        [aria-invalid='true'] input:not(.other), input[aria-invalid='true'],
        select[aria-invalid='true'], textarea[aria-invalid='true'] { border-color: var(--red); }
        .other { margin-top: 8px; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip { position: relative; display: inline-flex; }
        .chip input {
          position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; min-height: 0; padding: 0;
        }
        .chip span {
          display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px;
          border: 1px solid var(--hair-strong); border-radius: 999px; background: var(--bg-2);
          font-size: 15px; font-weight: 600; color: var(--ink-dim);
          transition: background .16s ease-out, color .16s ease-out, border-color .16s ease-out;
        }
        /* checked state carries a glyph and weight, not just a fill */
        .chip input:checked + span { background: var(--ink); border-color: var(--ink); color: #fff; }
        .chip input:checked + span::before { content: "\\2713"; margin-right: 8px; font-weight: 800; }
        .chip input:focus-visible + span { outline: 2px solid var(--blue); outline-offset: 2px; }
        .chiefs :global(.ferr) { color: var(--red); font-size: 14px; font-weight: 600; line-height: 1.4; }
        .alert {
          border-left: 3px solid var(--red); background: var(--red-soft); color: var(--ink);
          padding: 12px 16px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-weight: 600;
        }
        .alert:focus { outline: none; }
        .hp { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
        .apply .go { width: 100%; }
        .fine { margin: -8px 0 0; font-size: 14px; color: var(--ink-dim); }
        .done {
          border: 1px solid var(--hair-strong); background: var(--bg-2); border-radius: var(--radius);
          padding: 24px; box-shadow: var(--lift);
        }
        .done:focus { outline: none; }
        .done b { font-size: 20px; }
        .done p { margin: 8px 0 0; color: var(--ink-dim); }

        @media (min-width: 640px) {
          .hero { padding: 56px 0 56px; }
          .card { padding: 32px; }
          .figs { grid-template-columns: repeat(3, 1fr); gap: 24px; }
          .figs > div + div { border-left: 1px solid rgba(255, 255, 255, 0.14); padding-left: 24px; }
          .grid2 { grid-template-columns: 1fr 1fr; }
          .apply .go { width: auto; justify-self: start; }
          section { padding-top: 80px; }
        }
      `}</style>
    </>
  );
}
