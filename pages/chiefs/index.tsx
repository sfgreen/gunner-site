import Head from 'next/head';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AppShell, ArticleBody, ArticleHeader, Faq, Hero, Icon, NumberedSteps, Section } from '../../components/app';
import { track, referrerHost } from '../../lib/analytics';
import {
  AUDIENCES, CHANNELS, CHIEF_YEARLY, COMMISSION, DISCOUNT_PCT, HOLD_DAYS, LIST_YEARLY, PAYOUT_PCT, PROCEEDS, YEARS,
  usd, type FieldErrors,
} from '../../lib/chiefs';

// /chiefs: the invitation-only program page and the application form.
//
// In the app look (2026-10-22): the restraint stays. One very large headline, a lot of
// air, the terms as the page's one dark app card (the money figures read like a private
// bank's rate card, the commission in gold), and the one blue action: Apply. Events are
// unchanged: chiefs_view, chiefs_cta_click, chiefs_apply_submit / _success / _error.

const PAGE_TITLE = 'Step Gunner Chiefs | By invitation';
const PAGE_DESC =
  'Step Gunner Chiefs share Step Gunner with a code of their own. Friends get the first year of Pro at 40% off, and the Chief earns 40% of what we make.';

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
    fields[k] ? <span className="ch-ferr" id={`e-${k}`}>{fields[k]}</span> : null;
  const aria = (k: keyof FieldErrors) =>
    fields[k] ? { 'aria-invalid': true, 'aria-describedby': `e-${k}` } : {};

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESC} />
        <link rel="canonical" href="https://stepgunner.com/chiefs" />
        <meta property="og:title" content="Step Gunner Chiefs" />
        <meta property="og:description" content="By invitation. A code of your own, 40% off for your friends, 40% of what we make for you." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stepgunner.com/chiefs" />
      </Head>

      <AppShell campaign="chiefs" navCta={{ label: 'Apply', href: '#apply' }}>
        <Hero>
          <ArticleHeader
            category="site"
            byline={false}
            eyebrow="Step Gunner Chiefs"
            title="Chiefs are chosen."
            accent="chosen."
            dek={<>
              Every class has a few people everyone else asks what to use for Step 2. We invite a small
              number of them to share Step Gunner with a code of their own, and we pay them for it.
            </>}
          />
          <div className="mk isl">
            <div className="ch-hero-act">
              <a href="#apply" className="btn btn-act btn-lg" onClick={() => track('chiefs_cta_click', { location: 'hero' })}>
                Apply to be a Chief
              </a>
            </div>

            <section className="sheet dark-card ch-terms" aria-labelledby="terms-h">
              <div className="sheet-hd">
                <h2 className="lbl" id="terms-h">The terms</h2>
                <span className="lbl">By invitation</span>
              </div>
              <div className="sheet-bd">
                <dl className="ch-figs">
                  <div>
                    <dt className="lbl">Your friends pay</dt>
                    <dd className="v num">{usd(CHIEF_YEARLY)}</dd>
                    <dd className="c">for the first year of Pro, instead of {usd(LIST_YEARLY)}.</dd>
                  </div>
                  <div>
                    <dt className="lbl">You earn</dt>
                    <dd className="v num gold">{usd(COMMISSION)}</dd>
                    <dd className="c">on every first-year signup with your code.</dd>
                  </div>
                  <div>
                    <dt className="lbl">Paid</dt>
                    <dd className="v">Monthly</dd>
                    <dd className="c">once a signup is {HOLD_DAYS} days old.</dd>
                  </div>
                </dl>
                <p className="ch-math">
                  Apple keeps 15% of {usd(CHIEF_YEARLY)}. Step Gunner keeps {usd(PROCEEDS)}. {PAYOUT_PCT}% of that is yours.
                </p>
              </div>
            </section>
          </div>
        </Hero>

        <ArticleBody toc={[['gets', 'What a Chief gets'], ['ask', 'What we ask'], ['faq', 'Questions'], ['apply', 'Apply']]}>
          <Section id="gets" n="01" title="A code with your name on it.">
            <NumberedSteps steps={[
              { text: <><b>Your own code and link.</b> Something like MAYA40, plus a link that opens the App Store with the code already filled in.</> },
              { text: <><b>{DISCOUNT_PCT}% off for your friends.</b> New subscribers get the first year of Pro for {usd(CHIEF_YEARLY)} instead of {usd(LIST_YEARLY)}. Year two renews at the regular price.</> },
              { text: <><b>{PAYOUT_PCT}% of what we make.</b> About {usd(COMMISSION)} for every first-year signup, paid monthly. No cap.</> },
              { text: <><b>Your numbers, privately.</b> A page only you can open, with signups this month and all time, and what is pending, eligible and paid.</> },
            ]} />
          </Section>

          <Section id="ask" n="02" title="Three things, no quotas.">
            <NumberedSteps steps={[
              { text: <><b>Share it honestly.</b> Say what you actually think of the app, including what it does not do for you.</> },
              { text: <><b>Say it is your code.</b> Every time you share it, make clear you earn from it. &ldquo;My code, I get a cut&rdquo; is enough.</> },
              { text: <><b>Nothing else.</b> No quotas, no posting schedule, no minimum. Share it when it is useful to someone.</> },
            ]} />
          </Section>

          <Section id="faq" n="03" title="The fine print, in plain words.">
            <Faq items={FAQ} />
          </Section>

          <Section id="apply" n="04" title="Tell us where you would share it." lead="We read every application. If it is a fit, your code and private link arrive by email.">
            <div className="mk isl">
              <div className="sheet ch-apply">
                <div className="sheet-bd">
                  {status === 'done' ? (
                    <div className="ch-done" ref={doneRef} tabIndex={-1} role="status">
                      <p className="ch-done-t"><Icon name="checkc" />Application received.</p>
                      <p>Thank you. We read each one ourselves, so it can take a few days. You will hear from us either way.</p>
                    </div>
                  ) : (
                    <form onSubmit={submit} noValidate className="ch-form">
                      {status === 'error' && (
                        <div className="ch-alert" role="alert" tabIndex={-1} ref={alertRef}><Icon name="warn" sm />{message}</div>
                      )}

                      <div className="ch-grid2">
                        <label className="ch-f">
                          <span className="ch-l">Name</span>
                          <input className="inp txt" name="name" autoComplete="name" required maxLength={80} {...aria('name')} />
                          {err('name')}
                        </label>
                        <label className="ch-f">
                          <span className="ch-l">Email</span>
                          <input className="inp txt" name="email" type="email" autoComplete="email" inputMode="email" required maxLength={120} {...aria('email')} />
                          {err('email')}
                        </label>
                        <label className="ch-f">
                          <span className="ch-l">School</span>
                          <input className="inp txt" name="school" autoComplete="organization" required maxLength={120} {...aria('school')} />
                          {err('school')}
                        </label>
                        <label className="ch-f">
                          <span className="ch-l">Year</span>
                          <span className="sel">
                            <select className="inp" name="year" required defaultValue="" {...aria('year')}>
                              <option value="" disabled>Choose</option>
                              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <Icon name="chev" sm />
                          </span>
                          {err('year')}
                        </label>
                      </div>

                      <fieldset className="ch-f" {...aria('channels')}>
                        <legend className="ch-l">Where you would share it</legend>
                        <div className="ch-opts">
                          {CHANNELS.map((c) => (
                            <label key={c} className="ch-opt">
                              <input type="checkbox" checked={channels.includes(c)} onChange={() => toggle(c)} />
                              <span><Icon name="check" sm />{c}</span>
                            </label>
                          ))}
                        </div>
                        <input
                          name="channelsOther" className="inp txt ch-other" maxLength={160}
                          placeholder="Other, or a handle or link (optional)" aria-label="Other places, handles or links (optional)"
                        />
                        {err('channels')}
                      </fieldset>

                      <fieldset className="ch-f" {...aria('audience')}>
                        <legend className="ch-l">Roughly how many people would see it</legend>
                        <div className="ch-opts">
                          {AUDIENCES.map((a) => (
                            <label key={a} className="ch-opt">
                              <input type="radio" name="audience" value={a} />
                              <span><Icon name="check" sm />{a}</span>
                            </label>
                          ))}
                        </div>
                        {err('audience')}
                      </fieldset>

                      <label className="ch-f">
                        <span className="ch-l">Why you</span>
                        <textarea
                          className="inp txt ch-why" name="why" rows={4} maxLength={1200} required
                          placeholder="Who asks you what to use, and what you would tell them."
                          {...aria('why')}
                        />
                        {err('why')}
                      </label>

                      {/* Honeypot. Hidden from people and from assistive tech. */}
                      <div className="ch-hp" aria-hidden="true">
                        <label>Company <input name="company" tabIndex={-1} autoComplete="off" /></label>
                      </div>

                      <div className="ch-submit">
                        <button type="submit" className="btn btn-act btn-lg" disabled={status === 'sending'} aria-busy={status === 'sending'}>
                          {status === 'sending' ? 'Sending' : 'Send application'}
                        </button>
                        <p className="fine">
                          We use this only to review your application. Applying commits you to nothing.
                        </p>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </Section>
        </ArticleBody>
      </AppShell>

      <style jsx global>{`
        .mk .ch-hero-act { margin-top: 32px; }
        .mk .ch-terms { max-width: 820px; margin: 32px 0 24px; }
        .mk .ch-terms .sheet-hd .lbl { color: var(--st-ink-2); }
        .mk .ch-figs { display: grid; gap: 24px; }
        .mk .ch-figs dt { color: var(--st-ink-3); }
        .mk .ch-figs .v { margin-top: 8px; font: 800 38px/1.1 var(--f-sans); letter-spacing: -.03em; color: var(--st-ink); font-variant-numeric: tabular-nums; }
        .mk .ch-figs .v.num { font-family: var(--f-sans); }
        .mk .ch-figs .v.gold { color: var(--st-gold); }
        .mk .ch-figs .c { margin-top: 4px; font-size: 16px; line-height: 1.45; color: var(--st-ink-2); }
        .mk .ch-math { margin-top: 24px; padding-top: 16px; box-shadow: inset 0 1px 0 var(--st-line); font: 500 15px/1.6 var(--f-mono); color: var(--st-ink-2); }
        .mk .ch-apply { margin-top: 20px; }
        .mk .ch-form { display: grid; gap: 24px; }
        .mk .ch-grid2 { display: grid; gap: 16px; }
        .mk .ch-f { display: grid; gap: 8px; min-width: 0; }
        .mk .ch-l { font-size: 16px; font-weight: 700; color: var(--ink); padding: 0; }
        .mk fieldset.ch-f > .ch-l { margin-bottom: 8px; }
        .mk .ch-form .inp.txt { font-size: 17px; }
        .mk .ch-form .inp::placeholder { color: var(--ink-3); opacity: 1; }
        .mk .ch-form .inp:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; box-shadow: inset 0 0 0 1px var(--focus); }
        .mk .ch-why { min-height: 120px; padding: 12px; line-height: 1.5; resize: vertical; }
        .mk .ch-other { margin-top: 8px; }
        .mk .ch-opts { display: flex; flex-wrap: wrap; gap: 8px; }
        .mk .ch-opt { position: relative; display: inline-flex; }
        .mk .ch-opt input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
        .mk .ch-opt span { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: 999px; background: var(--card); box-shadow: inset 0 0 0 1px var(--line-2); font-size: 16px; font-weight: 500; color: var(--ink-2); transition: box-shadow var(--d-micro) var(--ease), background-color var(--d-micro) var(--ease); }
        .mk .ch-opt span .ic { display: none; }
        .mk .ch-opt:hover span { box-shadow: inset 0 0 0 1px var(--ctl); }
        /* the checked state carries a glyph and weight, not just a tint */
        .mk .ch-opt input:checked + span { background: var(--focus-ring); box-shadow: inset 0 0 0 2px var(--key); color: var(--ink); font-weight: 700; padding-left: 12px; }
        .mk .ch-opt input:checked + span .ic { display: block; color: var(--key); }
        .mk .ch-opt input:focus-visible + span { outline: 2px solid var(--focus); outline-offset: 2px; }
        .mk .ch-ferr { color: var(--bad); font-size: 15px; font-weight: 600; line-height: 1.4; }
        .mk .ch-form [aria-invalid='true'] .ch-opt span { box-shadow: inset 0 0 0 1px var(--bad); }
        .mk .ch-alert { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px; border-radius: var(--r-md); background: var(--bad-tint); box-shadow: inset 4px 0 0 var(--bad); color: var(--ink); font-weight: 600; }
        .mk .ch-alert .ic { color: var(--bad); margin-top: 4px; }
        .mk .ch-alert:focus { outline: none; }
        .mk .ch-hp { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
        .mk .ch-submit { display: grid; gap: 8px; }
        .mk .ch-submit .btn { width: 100%; }
        .mk .ch-submit .btn[aria-busy='true'] { cursor: progress; }
        .mk .ch-done:focus { outline: none; }
        .mk .ch-done-t { display: flex; align-items: center; gap: 8px; font: 700 21px/1.3 var(--f-sans); color: var(--ink); }
        .mk .ch-done-t .ic { color: var(--ok); }
        .mk .ch-done p + p { margin-top: 8px; color: var(--ink-2); }
        @media (min-width: 640px) {
          .mk .ch-figs { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .mk .ch-figs > div + div { padding-left: 24px; box-shadow: inset 1px 0 0 var(--st-line); }
          .mk .ch-grid2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .mk .ch-submit .btn { width: auto; justify-self: start; }
        }
      `}</style>
    </>
  );
}
