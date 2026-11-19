import Head from 'next/head';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppShell, Icon, Stage, StoreButton } from '../../components/app';
import { FREE } from '../../lib/app/chrome';
import { track } from '../../lib/analytics';
import { cleanRef, missIn10, rightIn10, type ShareQuestion } from '../../lib/shareQuestion';
import { loadShareQuestions } from '../../lib/shareQuestionServer';

// stepgunner.com/q/<slug>?ref=CODE: "share a question, not a score" (the approved
// QuestionWeb board of the share-card mock). A student who gets a question
// most students miss sends it; the friend answers it here, free, no sign-up, then
// sees the sender's pick, the explanation, and two ways in: the app, or Pro on the
// web with the sender's code (40% off a first year or $5 off a first month, decision 0057; /pro reads ?code=).
//
// Static: every page is built from data/share/questions.json (lib/shareQuestionServer).
// The link carries only the code, and nothing public maps a code to a pseudonym yet,
// so the sender is "a friend". The page is only reachable from a shared link and the
// app offers the link only after a right answer, so "your friend got it" holds.
//
// The app is on the first screen at every step (Danny 2026-11-18): the nav's "Get the
// app" shows on phones here (the site hides it below 960 px), an app row sits right
// under the verdict, and answering scrolls the verdict to the top when that row would
// be below the fold. Mock: https://claude.ai/artifact/QMwzz5X2GCtBbLDjMu9foN
//
// GA4 (lib/analytics): q_view {slug, deck, has_ref}, q_answer {slug, deck, correct},
// q_cta {slug, target: app | app_verdict | pro | copy_code}, plus the site's store_click
// (location nav, verdict or result).

type Props = { q: ShareQuestion };

const TITLE = 'Can you get this one?';
const OG_IMAGE = '/og/research/most-missed-step-2-ck-topics.png';
const OG_ALT = 'Step Gunner: Everyone misses the same questions.';

const paras = (s: string) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const noStop = (s: string) => s.replace(/[.\s]+$/, '');
// Measure before paint in the browser; the server never renders the result.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function SharedQuestion({ q }: Props) {
  const router = useRouter();
  const [ref, setRef] = useState<string | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [copied, setCopied] = useState<'' | 'ok' | 'fail'>('');
  const [live, setLive] = useState('');
  // The explanations run to 1,500 characters: six lines, then a toggle, so the
  // card with the next step stays near the verdict. 'fits' when nothing is cut.
  const [why, setWhy] = useState<'clamped' | 'open' | 'fits'>('clamped');
  const viewed = useRef(false);
  const verdictRef = useRef<HTMLDivElement>(null);
  const appRowRef = useRef<HTMLElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLSpanElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();

  const right10 = rightIn10(q.right, q.tried);
  const miss10 = missIn10(q.right, q.tried);
  const answer = q.choices[q.answerIndex];
  const done = pick != null;
  const correct = pick === q.answerIndex;

  // The code is in the query, which a static page reads after hydration.
  useEffect(() => {
    if (!router.isReady || viewed.current) return;
    viewed.current = true;
    const r = cleanRef(router.query.ref);
    setRef(r);
    track('q_view', { slug: q.slug, deck: q.deck, has_ref: !!r });
  }, [router.isReady, router.query.ref, q.slug, q.deck]);

  // A referred App Store tap (here, the nav, the menu, the footer) copies
  // GUNNERREF:<code>, which the app reads once on first launch: the home page's bridge.
  useEffect(() => {
    if (!ref) return undefined;
    const onTap = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="https://apps.apple.com"]');
      if (!a) return;
      try {
        navigator.clipboard?.writeText(`GUNNERREF:${ref}`)?.catch(() => { /* typing the code in the app still works */ });
      } catch {
        /* typing the code in the app still works */
      }
    };
    document.addEventListener('click', onTap, true);
    return () => document.removeEventListener('click', onTap, true);
  }, [ref]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  useBeforePaint(() => {
    const el = whyRef.current;
    if (done && el && el.scrollHeight <= el.clientHeight + 1) setWhy('fits');
  }, [done]);

  // After an answer, the verdict and the app row under it should share the screen.
  // When the row would sit below the fold (a phone), the verdict goes to the top, under
  // the sticky nav (its scroll-margin); when it already fits (a laptop), nothing moves.
  useEffect(() => {
    const vd = verdictRef.current;
    if (!done || !vd) return;
    const row = appRowRef.current?.getBoundingClientRect();
    if (row && row.bottom <= window.innerHeight - 8) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    vd.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [done]);

  const choose = (i: number) => {
    if (done) return;
    const ok = i === q.answerIndex;
    setPick(i);
    setLive(ok ? `Correct. Only ${right10} in 10 do.` : `Not this one. The answer is ${noStop(answer)}. ${miss10} in 10 miss it too.`);
    track('q_answer', { slug: q.slug, deck: q.deck, correct: ok });
  };

  const copyCode = async () => {
    if (!ref) return;
    track('q_cta', { slug: q.slug, target: 'copy_code' });
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(ref);
      setCopied('ok');
      setLive('Code copied.');
    } catch {
      // No clipboard (an old browser, an in-app web view): select it for a manual copy.
      const node = codeRef.current;
      const sel = window.getSelection();
      if (node && sel) {
        const range = document.createRange();
        range.selectNodeContents(node);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      setCopied('fail');
      setLive("Couldn't copy. The code is selected: copy it from there.");
    }
    copyTimer.current = setTimeout(() => setCopied(''), 2000);
  };

  const proHref = ref ? `/pro?code=${encodeURIComponent(ref)}` : '/pro';
  const more = q.deckCount ? `${q.deckCount.toLocaleString('en-US')} ${q.deckLabel} questions like this` : `More ${q.deckLabel} questions like this`;
  const desc = `${miss10} in 10 students miss it on the first try.`;
  const stem = paras(q.stem);
  const promptInStem = !q.question.trim();

  return (
    <AppShell
      campaign="share_q"
      pageType="share_q"
      section={null}
      seo={{ title: TITLE, description: desc, path: `/q/${q.slug}`, ogImage: OG_IMAGE, ogType: 'website', noindex: true }}
    >
      <Head>
        <meta property="og:site_name" content="Step Gunner" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={OG_ALT} />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={desc} />
      </Head>

      <Stage id="sq">
        <article className="sq" aria-labelledby="sq-h">
          <h1 className="sq-eye" id="sq-h">
            <span>A friend sent you this</span>
            <span aria-hidden="true">·</span>
            <span className="sr">, </span>
            <b>{miss10} in 10 miss it</b>
          </h1>

          <div className={`sq-stem${promptInStem ? ' sq-q' : ''}`} id={promptInStem ? 'sq-q' : undefined}>
            {stem.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          <div className="sq-ask">
            {!promptInStem && <p className="sq-q" id="sq-q">{q.question}</p>}
            <ul className="sq-opts" aria-labelledby="sq-q">
              {q.choices.map((c, i) => {
                const isAnswer = i === q.answerIndex;
                const s = !done ? undefined : isAnswer ? 'right' : i === pick ? 'mine' : 'dim';
                const tag = s === 'right' ? (i === pick ? 'You · correct' : 'Correct') : s === 'mine' ? 'You' : '';
                return (
                  <li key={c}>
                    <button type="button" className="sq-opt" data-s={s} aria-disabled={done || undefined} onClick={() => choose(i)}>
                      <span className="t">{c}</span>
                      {tag && (
                        <span className="sq-tag">
                          {s === 'right' && <Icon name="check" sm />}
                          {tag}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {!done ? (
            <p className="sq-hint">
              <Icon name="lock" sm />
              <span>Answer to see what your friend picked. No sign-up.</span>
            </p>
          ) : (
            <div className="sq-res">
              <div className="sq-vd" ref={verdictRef}>
                <p className="sq-vd-t" data-ok={correct || undefined}>
                  {correct ? `You got it. Only ${right10} in 10 do.` : `${noStop(answer)}. ${miss10} in 10 miss it too.`}
                </p>
                <p className="sq-vd-f">Your friend: got it</p>
              </div>
              <section className="sq-app" ref={appRowRef} aria-label="Step Gunner for iPhone">
                <div className="sq-app-t">
                  <p className="sq-app-n">{q.deckCount ? `${q.deckCount.toLocaleString('en-US')} more like this` : 'More like this'}</p>
                  <p className="sq-app-s">{q.deckLabel} questions in the iPhone app</p>
                </div>
                <div onClick={() => track('q_cta', { slug: q.slug, target: 'app_verdict' })}>
                  <StoreButton loc="verdict" params={{ slug: q.slug }}>Get the app</StoreButton>
                </div>
              </section>
              <div className="sq-why" id="sq-why" ref={whyRef} data-clamp={why === 'clamped' || undefined}>
                {paras(q.explanation).map((p, i) => <p key={i}>{p}</p>)}
              </div>
              {why !== 'fits' && (
                <button type="button" className="sq-more" aria-expanded={why === 'open'} aria-controls="sq-why" onClick={() => setWhy(why === 'open' ? 'clamped' : 'open')}>
                  {why === 'open' ? 'Show less' : 'Read the full explanation'}
                </button>
              )}

              <section className="sq-card" aria-labelledby="sq-card-t">
                <h2 className="sq-card-t" id="sq-card-t">{more}</h2>
                <p className="sq-card-b">{ref ? "Your friend's code takes 40% off a first year of Pro on the web, or $5 off a first month." : `${FREE}.`}</p>
                <div className="sq-acts">
                  <div onClick={() => track('q_cta', { slug: q.slug, target: 'app' })}>
                    <StoreButton loc="result" block params={{ slug: q.slug }}>Get the app</StoreButton>
                  </div>
                  <a className="btn btn-block sq-ghost" href={proHref} onClick={() => track('q_cta', { slug: q.slug, target: 'pro' })}>
                    {ref ? 'Pro on the web, 40% off' : 'See Pro'}
                  </a>
                </div>
                {ref && (
                  <div className="sq-code">
                    <span className="sq-code-l">Friend code</span>
                    <div className="sq-code-r">
                      <span className="sq-code-v" ref={codeRef}>{ref}</span>
                      <button type="button" className="sq-copy" onClick={copyCode} aria-label={copied === 'ok' ? 'Code copied' : 'Copy the friend code'}>
                        <Icon name={copied === 'ok' ? 'check' : 'copy'} sm />
                        <span aria-hidden="true">{copied === 'ok' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="sq-code-h">Got the app? Enter <b>{ref}</b> in Profile, Invite friends.</p>
                  </div>
                )}
              </section>
            </div>
          )}

          <p className="sr" role="status" aria-live="polite">{live}</p>
        </article>
      </Stage>

      <style jsx global>{`
        /* The question band: the app's dark world in both themes (the --st-* tokens,
           as the Try-the-case card and the /pro checkout card). One centered column,
           phone first. Type from the site scale; spacing on the 4/8 grid. */
        .mk #sq { min-height: calc(100vh - var(--nav-h)); min-height: calc(100svh - var(--nav-h)); }
        .mk .sq { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
        .mk .sq :focus-visible { outline-color: var(--st-blue); }

        .mk .sq .sq-eye { display: flex; flex-wrap: wrap; column-gap: 8px; font: 600 13px/1.5 var(--f-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--st-ink-3); }
        .mk .sq .sq-eye b { color: var(--st-ink); font-weight: 700; white-space: nowrap; }

        .mk .sq .sq-stem { display: grid; gap: 12px; font-size: 16px; line-height: 1.55; color: var(--st-ink-2); }
        .mk .sq .sq-stem p { white-space: pre-line; }
        .mk .sq .sq-ask { display: grid; gap: 12px; }
        .mk .sq .sq-q { font-size: 19px; line-height: 1.35; font-weight: 600; color: var(--st-ink); }

        .mk .sq .sq-opts { display: grid; gap: 8px; }
        .mk .sq .sq-opt { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 12px 16px; border: 0; border-radius: 12px;
          background: var(--st-card-2); color: var(--st-ink); box-shadow: inset 0 0 0 1px var(--st-line-2); font: 500 16px/1.4 var(--f-sans); text-align: left; cursor: pointer;
          transition: background-color var(--d-micro) var(--ease), box-shadow var(--d-micro) var(--ease), color var(--d-micro) var(--ease); }
        .mk .sq .sq-opt:hover:not([aria-disabled="true"]) { box-shadow: inset 0 0 0 1px var(--st-ink-3); }
        .mk .sq .sq-opt:active:not([aria-disabled="true"]) { background: var(--st-card); }
        .mk .sq .sq-opt[aria-disabled="true"] { cursor: default; }
        .mk .sq .sq-opt .t { flex: 1; min-width: 0; }
        .mk .sq .sq-tag { display: inline-flex; align-items: center; gap: 4px; flex: none; font: 700 13px/1 var(--f-mono); letter-spacing: .08em; text-transform: uppercase; }
        .mk .sq .sq-opt[data-s="right"] { background: var(--st-ok-tint); box-shadow: inset 0 0 0 1px var(--glow-green); }
        .mk .sq .sq-opt[data-s="right"] .sq-tag { color: var(--st-green); }
        .mk .sq .sq-opt[data-s="mine"] { background: var(--warn-bg); box-shadow: inset 0 0 0 1px var(--warn-line); }
        .mk .sq .sq-opt[data-s="mine"] .sq-tag { color: var(--st-gold); }
        .mk .sq .sq-opt[data-s="dim"] { background: transparent; color: var(--st-ink-3); box-shadow: inset 0 0 0 1px var(--st-line); }

        .mk .sq .sq-hint { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; border: 1px dashed var(--st-line-2); font-size: 15px; line-height: 1.45; color: var(--st-ink-2); }
        .mk .sq .sq-hint .ic { color: var(--st-ink-3); }

        .mk .sq .sq-res { display: grid; gap: 16px; animation: sq-in var(--d-move) var(--ease) both; }
        @keyframes sq-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .mk .sq .sq-vd { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; scroll-margin: calc(var(--nav-h) + 16px) 0 24px; }
        .mk .sq .sq-vd-t { font-size: 19px; line-height: 1.35; font-weight: 600; color: var(--st-gold); }
        .mk .sq .sq-vd-t[data-ok] { color: var(--st-green); }
        .mk .sq .sq-vd-f { font: 600 13px/1.4 var(--f-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--st-ink-3); white-space: nowrap; }
        /* The app row under the verdict: the app's green action, inside the dark band. */
        .mk .sq .sq-app { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 14px 14px 14px 16px; border-radius: 14px;
          background: linear-gradient(180deg, var(--st-card), var(--st-card-2)); box-shadow: inset 0 0 0 1px var(--glow-green), 0 18px 36px -24px var(--st-shadow); }
        .mk .sq .sq-app-n { font-size: 16px; line-height: 1.3; font-weight: 600; color: var(--st-ink); }
        .mk .sq .sq-app-s { margin-top: 2px; font-size: 14px; line-height: 1.4; color: var(--st-ink-3); }
        .mk .sq .sq-app .btn { min-height: 44px; padding-inline: 16px; font-size: 15px; font-weight: 700; white-space: nowrap;
          background: var(--st-green); color: var(--st-on-green); box-shadow: none; }
        .mk .sq .sq-app .btn:hover { filter: brightness(1.08); }

        /* The nav's Get the app: hidden on phones site-wide, shown on this page. */
        .mk .sn .sn-cta { display: inline-flex; margin-left: auto; min-height: 36px; padding: 0 12px; font-size: 15px; font-weight: 600;
          background: transparent; color: var(--ok); box-shadow: inset 0 0 0 1px var(--ok); }
        .mk .sn .sn-cta:hover { background: var(--card-2); }
        .mk .sn .sn-cta + .burger { margin-left: 0; }
        @media (max-width: 359px) { .mk .sn .sn-cta { display: none; } .mk .sn .sn-cta + .burger { margin-left: auto; } }
        @media (min-width: 960px) { .mk .sn .sn-cta { min-height: 44px; padding: 0 16px; } }

        .mk .sq .sq-why { font-size: 16px; line-height: 1.55; color: var(--st-ink-2); }
        .mk .sq .sq-why p + p { margin-top: 12px; }
        .mk .sq .sq-why[data-clamp] { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 6; overflow: hidden; }
        .mk .sq .sq-more { justify-self: start; display: inline-flex; align-items: center; min-height: 44px; margin-top: -8px; padding: 0; border: 0; background: none; cursor: pointer;
          color: var(--st-blue); font: 600 15px/1.2 var(--f-sans); text-decoration: underline; text-decoration-color: var(--blue-35); text-underline-offset: .2em; }
        .mk .sq .sq-more:hover { text-decoration-color: currentColor; }

        .mk .sq .sq-card { display: grid; gap: 12px; margin-top: 8px; padding: 16px; border-radius: var(--r-md);
          background: linear-gradient(180deg, var(--st-card), var(--st-card-2)); box-shadow: inset 0 0 0 1px var(--st-line-2), 0 24px 48px -24px var(--st-shadow); }
        .mk .sq .sq-card-t { font-size: 18px; line-height: 1.3; font-weight: 600; color: var(--st-ink); }
        .mk .sq .sq-card-b { font-size: 15px; line-height: 1.5; color: var(--st-ink-2); }
        .mk .sq .sq-acts { display: grid; gap: 8px; margin-top: 4px; }
        .mk .sq .sq-acts .btn { min-height: 48px; font-size: 16px; }
        .mk .sq .sq-ghost { background: transparent; color: var(--st-ink); box-shadow: inset 0 0 0 1px var(--st-line-2); }
        .mk .sq .sq-ghost:hover { background: var(--st-line); box-shadow: inset 0 0 0 1px var(--st-ink-3); }

        .mk .sq .sq-code { display: grid; gap: 8px; padding-top: 12px; border-top: 1px dashed var(--st-line-2); }
        .mk .sq .sq-code-r { display: flex; align-items: center; gap: 12px; }
        .mk .sq .sq-code-l { font: 600 13px/1.3 var(--f-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--st-ink-3); }
        .mk .sq .sq-code-v { flex: 1; min-width: 0; font: 700 18px/1.3 var(--f-mono); letter-spacing: .06em; color: var(--st-green); overflow-wrap: anywhere; -webkit-user-select: all; user-select: all; }
        .mk .sq .sq-copy { display: inline-flex; align-items: center; justify-content: center; gap: 8px; flex: none; min-width: 112px; min-height: 44px; padding: 0 16px; border: 0; border-radius: 12px;
          background: transparent; color: var(--st-ink); box-shadow: inset 0 0 0 1px var(--st-line-2); font: 600 15px/1 var(--f-sans); cursor: pointer; transition: background-color var(--d-micro) var(--ease); }
        .mk .sq .sq-copy:hover { background: var(--st-line); }
        .mk .sq .sq-code-h { font-size: 15px; line-height: 1.5; color: var(--st-ink-3); }
        .mk .sq .sq-code-h b { font-family: var(--f-mono); font-weight: 600; color: var(--st-ink); }

        @media (min-width: 600px) {
          .mk .sq .sq-acts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 760px) {
          .mk .sq .sq-stem, .mk .sq .sq-why { font-size: 18px; }
          .mk .sq .sq-q { font-size: 21px; }
          .mk .sq .sq-card { padding: 20px; }
        }
      `}</style>
    </AppShell>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  // Every question is known at build (the file ships with the deploy), so an
  // unknown slug is a CDN 404 with no server work.
  paths: loadShareQuestions().map((x) => ({ params: { slug: x.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const q = loadShareQuestions().find((x) => x.slug === params?.slug);
  if (!q) return { notFound: true };
  return { props: { q } };
};
