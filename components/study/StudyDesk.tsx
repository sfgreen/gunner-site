import Head from 'next/head';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import ProSignIn, { APPLE_ON } from '../ProSignIn';
import ProStyles from '../ProStyles';
import { track } from '../../lib/analytics';
import { LABS } from '../../lib/study/labs';
import type { DeskState, Question, Reveal } from '../../lib/study/server';
import { type ApiResult, type useWebAccount } from '../../lib/webAccount';

// stepgunner.com/study: the study desk (gunner repo, decision 0082; the Study desk of the
// 2026-10-30 mock Danny approved). A Pro student studies their own CK Gold review queue on
// a laptop, in 20-question blocks, tutor mode. Every answer is saved to the same review
// schedule the phone reads and marks today on their Study Buddy rope.
//
// The bank stays off the open web: the page never holds more than the one question on
// screen, and its answer arrives only after the student answers (lib/study/server.ts).
// No em or en dashes in copy.

type BlockView = { id: string; i: number; size: number; startedMs: number; results: Array<{ correct: boolean }> };

const LETTERS = 'ABCDEFGH';
const EXAM_PACE_S = 90; // 20 questions in 30 minutes

function tzMinutes(): number {
  return -new Date().getTimezoneOffset();
}

function clock(s: number): string {
  const v = Math.max(0, Math.floor(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
}

/** [+finding] and [-finding] (docs/PERTINENT_MARKUP.md) as highlighted spans. */
function Pertinent({ text }: { text: string }) {
  const parts: Array<{ t: string; k: '' | '+' | '-' }> = [];
  const re = /\[([+-])([^\]]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ t: text.slice(last, m.index), k: '' });
    parts.push({ t: m[2], k: m[1] as '+' | '-' });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ t: text.slice(last), k: '' });
  return (
    <>
      {parts.map((p, i) =>
        p.k === '+' ? <mark key={i} className="sd-pos">{p.t}</mark>
          : p.k === '-' ? <mark key={i} className="sd-neg">{p.t}</mark>
            : <span key={i}>{p.t}</span>)}
    </>
  );
}

function boxWord(box: number): string {
  return ['New', 'Struggling', 'Learning', 'Getting it', 'Strong', 'Mastered'][box] || `Box ${box}`;
}

function nextLine(r: Reveal): string {
  if (r.toBox === 1) return 'Back in your next block';
  return r.nextInDays === 1 ? 'Back tomorrow' : `Back in ${r.nextInDays} days`;
}

export type StudyCall = <T>(user: User, path: string, body?: unknown) => Promise<ApiResult<T>>;

type DeskSale = { name: string; price: string; endsAtMs: number };

/** h:mm:ss left, for the sale line on the Pro card. */
function saleLeft(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(t / 3600)}:${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/** The desk. `account` and `call` come from the page (the real account and API) or a test harness. */
export default function StudyDesk({ account, call }: { account: ReturnType<typeof useWebAccount>; call: StudyCall }) {
  const api = call;
  const { user } = account;
  const [state, setState] = useState<DeskState | null>(null);
  const [gate, setGate] = useState<'' | 'anonymous' | 'not_pro' | 'paused' | 'daily_limit' | 'error'>('');
  const [gateMsg, setGateMsg] = useState('');
  const [block, setBlock] = useState<BlockView | null>(null);
  const [q, setQ] = useState<Question | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [struck, setStruck] = useState<Record<number, boolean>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [busy, setBusy] = useState(false);
  const [labsOpen, setLabsOpen] = useState(false);
  const [labQuery, setLabQuery] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [shownAt, setShownAt] = useState(() => Date.now());
  const [blockXp, setBlockXp] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef(false);
  // The store sale this account can have (gunner decision 0085 amendment 3), for the Pro card.
  const [sale, setSale] = useState<DeskSale | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (gate !== 'not_pro' || !user) return undefined;
    let stop = false;
    api<{ status: { sale: DeskSale | null } }>(user, '/api/pro/status').then((r) => {
      if (!stop && r.ok) setSale(r.status?.sale || null);
    });
    return () => { stop = true; };
  }, [gate, user, api]);

  const fail = useCallback((code: string | undefined, msg: string | undefined) => {
    const known = ['anonymous', 'not_pro', 'paused', 'daily_limit'];
    setGate((known.includes(code || '') ? code : 'error') as typeof gate);
    setGateMsg(msg || 'Something went wrong. Try again.');
  }, []);

  const loadState = useCallback(async (u: User) => {
    const r = await api<{ state: DeskState }>(u, `/api/study/state?tz=${tzMinutes()}`);
    if (!r.ok) { fail(r.code, r.error); return null; }
    setState(r.state);
    if (r.state.pro === 'none') { setGate('not_pro'); return null; }
    return r.state;
  }, [fail]);

  const openBlock = useCallback(async (u: User, fresh: boolean) => {
    setBusy(true);
    const r = await api<{ block: BlockView; question: Question | null }>(u, '/api/study/block', { tz: tzMinutes(), fresh });
    setBusy(false);
    if (!r.ok) { fail(r.code, r.error); return; }
    setGate('');
    setBlock(r.block);
    setQ(r.question);
    setPick(null);
    setStruck({});
    setReveal(null);
    setShownAt(Date.now());
    setDone(!r.question);
    if (fresh) setBlockXp(0);
    track('study_block', { fresh, index: r.block.i, size: r.block.size });
  }, [fail]);

  useEffect(() => {
    if (!user || started.current) return;
    if (user.isAnonymous) { setGate('anonymous'); return; }
    started.current = true;
    (async () => {
      const s = await loadState(user);
      if (s) await openBlock(user, false);
    })();
  }, [user, loadState, openBlock]);

  const submit = useCallback(async () => {
    if (!user || !q || pick == null || reveal || busy) return;
    setBusy(true);
    const r = await api<{ reveal: Reveal }>(user, '/api/study/answer', { blockId: q.blockId, key: q.key, pick });
    setBusy(false);
    if (!r.ok) { fail(r.code, r.error); return; }
    setReveal(r.reveal);
    setBlockXp((x) => x + r.reveal.xp);
    const rv = r.reveal;
    setState((s) => (s ? {
      ...s,
      xpBanked: s.xpBanked + rv.xp,
      today: { ...s.today, answered: s.today.answered + 1, correct: s.today.correct + (rv.correct ? 1 : 0), xp: s.today.xp + rv.xp },
    } : s));
    setBlock((b) => (b ? { ...b, i: r.reveal.index + 1, results: [...b.results, { correct: r.reveal.correct }] } : b));
    track('study_answer', { correct: r.reveal.correct, box: r.reveal.toBox });
  }, [user, q, pick, reveal, busy, fail]);

  const next = useCallback(async () => {
    if (!user || !block || busy) return;
    if (reveal?.done) {
      setDone(true);
      setQ(null);
      setReveal(null);
      loadState(user);
      return;
    }
    setBusy(true);
    const r = await api<{ done: boolean; question: Question | null }>(user, '/api/study/next', { blockId: block.id });
    setBusy(false);
    if (!r.ok) {
      if (r.code === 'too_fast') { setTimeout(() => next(), 1200); return; }
      fail(r.code, r.error);
      return;
    }
    setQ(r.question);
    setPick(null);
    setStruck({});
    setReveal(null);
    setShownAt(Date.now());
    if (!r.question) { setDone(true); loadState(user); }
  }, [user, block, busy, reveal, fail, loadState]);

  const toggleStrike = useCallback((i: number) => {
    if (reveal) return;
    setStruck((s) => ({ ...s, [i]: !s[i] }));
    if (pick === i) setPick(null);
  }, [reveal, pick]);

  // Keyboard: 1-5 or A-E choose, S strike the chosen one, M mark, L labs, Enter submit or next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (q && !reveal) {
        const n = /^[1-8]$/.test(k) ? Number(k) - 1 : 'abcdefgh'.indexOf(k);
        if (n >= 0 && n < q.choices.length) {
          if (!struck[n]) setPick(n);
          e.preventDefault();
          return;
        }
        if (k === 's' && pick != null) { toggleStrike(pick); e.preventDefault(); return; }
      }
      if (k === 'm' && q) { setMarked((m) => ({ ...m, [q.key]: !m[q.key] })); e.preventDefault(); return; }
      if (k === 'l') { setLabsOpen((o) => !o); e.preventDefault(); return; }
      if (k === 'enter') {
        if (reveal) next(); else submit();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, reveal, pick, struck, submit, next, toggleStrike]);

  const elapsed = block ? (now - block.startedMs) / 1000 : 0;
  const answeredInBlock = block ? block.results.length : 0;
  const avgPace = answeredInBlock ? elapsed / answeredInBlock : 0;
  const onQuestion = (now - shownAt) / 1000;

  const weakest = useMemo(() => {
    if (!state) return [];
    return state.worlds
      .filter((w) => w.attempts >= 5)
      .map((w) => ({ ...w, pct: Math.round((100 * w.correct) / Math.max(1, w.attempts)) }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5);
  }, [state]);

  const labs = useMemo(() => {
    const qy = labQuery.trim().toLowerCase();
    if (!qy) return LABS;
    return LABS.map((g) => ({ ...g, rows: g.rows.filter((r) => r[0].toLowerCase().includes(qy) || g.title.toLowerCase().includes(qy)) }))
      .filter((g) => g.rows.length);
  }, [labQuery]);

  const cells = useMemo(() => {
    if (!block) return [];
    return Array.from({ length: block.size }, (_, k) => {
      const res = block.results[k];
      const current = !done && k === block.results.length;
      return { n: k + 1, state: res ? (res.correct ? 'ok' : 'bad') : current ? 'cur' : 'todo' };
    });
  }, [block, done]);

  const signedOut = user === null;
  const checking = user === undefined;

  return (
    <>
      <Head>
        <title>Study desk | Step Gunner</title>
        <meta name="description" content="Step Gunner on the web, for a laptop or an Android phone: 20-question CK Gold blocks, lab values beside the question, and every answer saved to the same review schedule as the iPhone app." />
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <ProStyles />
      <div className="sd">
        <header className="sd-top">
          <a href="/" className="sd-logo" aria-label="Step Gunner home">
            <span className="sd-dot" aria-hidden="true" />
            <span className="sd-l1">STEP</span>
            <span className="sd-l2">GUNNER</span>
          </a>
          <span className="sd-tag">STUDY DESK</span>
          <div className="sd-topr">
            {state && state.pro !== 'none' && (
              <>
                <span className="sd-chip" title="Answered on the web today">{state.today.answered} today</span>
                <span className="sd-chip" title="XP earned on the web">{state.xpBanked.toLocaleString()} XP</span>
              </>
            )}
            {user && !user.isAnonymous && (
              <button type="button" className="sd-ghost sd-small" onClick={() => { account.signOut(); started.current = false; setState(null); setBlock(null); setQ(null); setGate(''); }}>
                Sign out
              </button>
            )}
          </div>
        </header>

        {(checking || signedOut || gate) && (
          <main className="sd-gate">
            {checking && <p className="sd-muted">Opening your desk…</p>}
            {signedOut && (
              <div className="sd-card sd-narrow">
                <ProSignIn
                  title="Study Step Gunner on the web."
                  lede="On a laptop or an Android phone. Use the iPhone app too? Sign in with the same account and every answer here lands in the same review schedule."
                  busy={account.busy}
                  onSignIn={(p) => account.signIn(p, () => track('study_signin', { provider: p }))}
                >
                  {!APPLE_ON && (
                    <p className="sd-fine">Signed in with Apple in the app? Apple sign-in on the web is coming. Until then, add Google to your account in the app (Settings, Account).</p>
                  )}
                  {account.err && <p className="sd-err">{account.err}</p>}
                </ProSignIn>
              </div>
            )}
            {gate === 'anonymous' && (
              <div className="sd-card sd-narrow">
                <h2>Add a sign-in in the app first</h2>
                <p className="sd-muted">Your progress lives on an account without a sign-in. In the app, open Settings, then Account, add Apple or Google, and come back.</p>
              </div>
            )}
            {gate === 'not_pro' && (
              <div className="sd-card sd-narrow">
                <h2>The study desk is part of Pro</h2>
                <p className="sd-muted">CK Gold in 20-question blocks, with lab values beside every question, on a laptop or an Android phone. Pro on the web also turns Pro on in the iPhone app.</p>
                {sale && now < sale.endsAtMs && (
                  <p className="sd-sale">{sale.name}: half off your first year, {sale.price}. Your price ends in <span className="sd-sale-clock">{saleLeft(sale.endsAtMs - now)}</span></p>
                )}
                <a className="pro-btn" href="/pro?from=study" onClick={() => track('pro_click', { location: 'study', sale: sale ? 1 : 0 })}>See Pro</a>
                <p className="sd-fine">Already Pro on your phone? Make sure you signed in here with the same account.</p>
              </div>
            )}
            {(gate === 'paused' || gate === 'daily_limit' || gate === 'error') && (
              <div className="sd-card sd-narrow">
                <h2>{gate === 'daily_limit' ? 'That is the web for today' : gate === 'paused' ? 'The desk is paused' : 'Something went wrong'}</h2>
                <p className="sd-muted">{gateMsg}</p>
                {gate === 'error' && user && (
                  <button type="button" className="pro-btn" onClick={() => { setGate(''); started.current = false; setState(null); }}>Try again</button>
                )}
              </div>
            )}
          </main>
        )}

        {!checking && !signedOut && !gate && (
          <div className="sd-grid">
            <aside className="sd-left" aria-label="Your block">
              <section className="sd-sec">
                <h2 className="sd-h">TODAY ON THE WEB</h2>
                <div className="sd-stats">
                  <div><b>{state?.today.answered ?? 0}</b><span>answered</span></div>
                  <div><b>{state && state.today.answered ? `${Math.round((100 * state.today.correct) / state.today.answered)}%` : '·'}</b><span>correct</span></div>
                  <div><b>{state?.deck.due ?? 0}</b><span>due</span></div>
                </div>
              </section>

              {block && (
                <section className="sd-sec">
                  <div className="sd-row"><h2 className="sd-h">BLOCK MAP</h2><span className="sd-mono sd-muted">{answeredInBlock} / {block.size}</span></div>
                  <div className="sd-map">
                    {cells.map((c) => (
                      <span key={c.n} className={`sd-cell sd-${c.state}`}>
                        {c.n}
                        {q && c.state === 'cur' && marked[q.key] && <i className="sd-flag" aria-label="Marked" />}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="sd-sec">
                <h2 className="sd-h">SYSTEMS · WEAKEST FIRST</h2>
                {weakest.length === 0 && <p className="sd-fine">Your weakest systems show here once you have 5 answers in a system.</p>}
                {weakest.map((w) => (
                  <div key={w.name} className="sd-sys">
                    <div className="sd-row"><span>{w.name}</span><span className="sd-mono sd-muted">{w.pct}%</span></div>
                    <div className="sd-bar"><div style={{ width: `${w.pct}%` }} /></div>
                  </div>
                ))}
              </section>

              {state && (
                <section className="sd-sec">
                  <h2 className="sd-h">CK GOLD</h2>
                  <p className="sd-fine sd-mono">{state.deck.seen.toLocaleString()} OF {state.deck.total.toLocaleString()} SEEN · {state.deck.mastered.toLocaleString()} MASTERED</p>
                  <div className="sd-bar"><div style={{ width: `${Math.round((100 * state.deck.seen) / Math.max(1, state.deck.total))}%` }} /></div>
                </section>
              )}
            </aside>

            <main className="sd-main">
              {done && block && (
                <div className="sd-done">
                  <h2 className="sd-h">BLOCK DONE</h2>
                  <p className="sd-big">{block.results.filter((r) => r.correct).length} of {block.results.length}</p>
                  <p className="sd-muted">{clock(elapsed)} for the block, {clock(avgPace)} a question (test day allows 1:30). +{blockXp} XP.</p>
                  <p className="sd-fine">Every answer is in your review schedule. Misses come back in your next block; the rest come back on their own days.</p>
                  <button type="button" className="sd-primary" disabled={busy} onClick={() => user && openBlock(user, true)}>Start another block</button>
                </div>
              )}

              {!done && q && (
                <>
                  <div className="sd-qbar">
                    <span className="sd-mono sd-strong">QUESTION {q.index + 1} OF {q.size}</span>
                    <span className="sd-mono sd-muted">{q.deckLabel.toUpperCase()} · {q.world.toUpperCase()}</span>
                    <div className="sd-tools">
                      <button type="button" className={`sd-ghost${marked[q.key] ? ' sd-on-gold' : ''}`} aria-pressed={!!marked[q.key]} onClick={() => setMarked((m) => ({ ...m, [q.key]: !m[q.key] }))}>Mark</button>
                      <button type="button" className={`sd-ghost${labsOpen ? ' sd-on-blue' : ''}`} aria-pressed={labsOpen} onClick={() => setLabsOpen((o) => !o)}>Lab values</button>
                    </div>
                    <span className="sd-clock" aria-label="Time on this block">{clock(elapsed)}</span>
                  </div>
                  <div className="sd-q">
                    <p className="sd-stem"><Pertinent text={q.stem} /></p>
                    <p className="sd-lead">{q.question}</p>
                    <div role="group" aria-label="Answer choices" className="sd-choices">
                      {q.choices.map((c, i) => {
                        const isAns = reveal && c === reveal.answer;
                        const isPick = reveal ? i === pick : false;
                        const cls = reveal
                          ? isAns ? 'sd-ch sd-ch-ans' : isPick ? 'sd-ch sd-ch-bad' : 'sd-ch sd-ch-dim'
                          : `sd-ch${pick === i ? ' sd-ch-pick' : ''}${struck[i] ? ' sd-ch-struck' : ''}`;
                        return (
                          <div key={i} className={cls}>
                            <button type="button" className="sd-chb" disabled={!!reveal} onClick={() => !struck[i] && setPick(i)}>
                              <span className="sd-letter">{LETTERS[i]}</span>
                              <span className="sd-chtext">{c}</span>
                              {reveal && isAns && <span className="sd-chtag sd-ok-t">ANSWER</span>}
                              {reveal && isPick && !isAns && <span className="sd-chtag sd-bad-t">YOUR PICK</span>}
                            </button>
                            {!reveal && (
                              <button type="button" className="sd-strike" aria-label={`Strike out choice ${LETTERS[i]}`} aria-pressed={!!struck[i]} onClick={() => toggleStrike(i)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 12h16" /><path d="M8 7.5C8.6 6 10.1 5 12 5c1.9 0 3.4.8 4 2.2" /><path d="M8.5 16.6c.6 1.5 2 2.4 3.7 2.4 2.2 0 3.8-1.2 3.8-2.9" /></svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="sd-actions">
                    {!reveal ? (
                      <button type="button" className="sd-primary" disabled={pick == null || busy} onClick={submit}>Submit answer</button>
                    ) : (
                      <button type="button" className="sd-primary" disabled={busy} onClick={next}>{reveal.done ? 'See the block' : 'Next question'}</button>
                    )}
                    <span className="sd-fine">
                      {reveal ? 'Enter for the next one.' : pick == null ? 'Pick an answer, or strike out the ones you can rule out.' : 'Locked in? Submit, or press Enter.'}
                    </span>
                    {!reveal && <span className="sd-mono sd-muted sd-qclock">{clock(onQuestion)}</span>}
                  </div>
                </>
              )}

              {!done && !q && <p className="sd-muted sd-pad">{busy ? 'Picking your block from your review queue…' : 'Loading…'}</p>}
            </main>

            <aside className="sd-right" aria-label="Explanation and lab values">
              {reveal && (
                <section className="sd-card sd-reveal">
                  <p className={reveal.correct ? 'sd-verdict sd-ok-t' : 'sd-verdict sd-bad-t'}>
                    {reveal.correct ? 'Correct.' : `Not quite. The answer is ${LETTERS[q ? q.choices.indexOf(reveal.answer) : 0]}.`}
                    {reveal.xp > 0 && <span className="sd-xp">+{reveal.xp} XP</span>}
                  </p>
                  {reveal.diagnosis && (
                    <div className="sd-blk">
                      <span className="sd-h">DIAGNOSIS</span>
                      <span className="sd-dx">{reveal.diagnosis}</span>
                    </div>
                  )}
                  <div className="sd-blk">
                    <span className="sd-h">WHY {LETTERS[q ? q.choices.indexOf(reveal.answer) : 0]}</span>
                    <p>{reveal.whyRight}</p>
                  </div>
                  {reveal.whyWrong && (
                    <div className="sd-blk">
                      <span className="sd-h">WHY NOT THE OTHERS</span>
                      <p>{reveal.whyWrong}</p>
                    </div>
                  )}
                  {reveal.trap && (
                    <div className="sd-blk">
                      <span className="sd-h sd-warn-t">THE TRAP</span>
                      <p>{reveal.trap}</p>
                    </div>
                  )}
                  {reveal.memoryHook && (
                    <div className="sd-blk sd-hook">
                      <span className="sd-h sd-blue-t">REMEMBER</span>
                      <p>{reveal.memoryHook}</p>
                    </div>
                  )}
                  {reveal.evidence?.title && (
                    <p className="sd-fine">
                      {reveal.evidence.body ? `${reveal.evidence.body}${reveal.evidence.year ? ` ${reveal.evidence.year}` : ''}: ` : ''}
                      {reveal.evidence.url ? <a href={reveal.evidence.url} target="_blank" rel="noopener noreferrer">{reveal.evidence.title}</a> : reveal.evidence.title}
                    </p>
                  )}
                  <p className="sd-move sd-mono">
                    {boxWord(reveal.fromBox).toUpperCase()} → {boxWord(reveal.toBox).toUpperCase()} · {nextLine(reveal).toUpperCase()}
                  </p>
                </section>
              )}
              {!reveal && block && !done && (
                <section className="sd-card sd-pace">
                  <div><span className="sd-h">ANSWERED</span><b>{answeredInBlock}</b></div>
                  <div><span className="sd-h">AVG PACE</span><b>{answeredInBlock ? clock(avgPace) : '·'}</b></div>
                  <div><span className="sd-h">EXAM PACE</span><b className="sd-muted">{clock(EXAM_PACE_S)}</b></div>
                </section>
              )}
              {(labsOpen || !reveal) && (
                <section className="sd-card sd-labs" aria-label="Lab values">
                  <div className="sd-row">
                    <span className="sd-h">LAB VALUES</span>
                    <span className="sd-fine">L to {labsOpen ? 'hide' : 'pin'}</span>
                  </div>
                  <input type="search" className="sd-search" placeholder="Search labs (sodium, TSH)" aria-label="Search lab values" value={labQuery} onChange={(e) => setLabQuery(e.target.value)} />
                  <div className="sd-labscroll">
                    {labs.map((g) => (
                      <div key={g.title} className="sd-labg">
                        <span className="sd-labt">{g.title}</span>
                        {g.rows.map(([name, range]) => (
                          <div key={name} className="sd-lab"><span>{name}</span><span className="sd-mono">{range}</span></div>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        )}

        <footer className="sd-foot">
          <span><b>1-5</b> choose</span>
          <span><b>S</b> strike</span>
          <span><b>M</b> mark</span>
          <span><b>L</b> labs</span>
          <span><b>ENTER</b> submit, next</span>
          <span className="sd-sync"><i aria-hidden="true" />Saved to your review schedule. The iPhone app picks it up the next time it opens.</span>
        </footer>
      </div>

      <style jsx global>{`
        body { background: var(--st-bg); }
        /* The desk's own colors: the app's night look, and Dawn (the app's light mode) on a light system. */
        .sd { --d-stem: #E2E5EC; --d-strong: #ffffff; --d-main-a: rgba(19,23,30,0.92); --d-main-b: rgba(14,17,23,0.92);
          --d-choice: rgba(19,23,30,0.55); --d-disabled: #1a2029; --d-body: #d5d9e1; --d-label: #c9ced8;
          --d-hover: rgba(255,255,255,0.05); --d-dotted: rgba(255,255,255,0.35); --d-shadow: rgba(0,0,0,0.45);
          --d-glow: rgba(90,200,250,0.12); --d-glow-0: rgba(90,200,250,0); --d-warn: #ff9f0a;
          --d-act-t08: rgba(10,132,255,0.08); --d-act-t10: rgba(10,132,255,0.10); --d-act-t16: rgba(10,132,255,0.16);
          --d-act-t25: rgba(10,132,255,0.25); --d-act-t50: rgba(10,132,255,0.5); --d-gold-line: rgba(255,214,10,0.6);
          --d-ok-line: rgba(48,209,88,0.45); --d-ok-line2: rgba(48,209,88,0.6); --d-ok-wash: rgba(48,209,88,0.08);
          --d-bad-line: rgba(255,107,98,0.45); --d-bad-line2: rgba(255,69,58,0.6); --d-bad-wash: rgba(255,69,58,0.08); --d-bad-fill: #ff453a; --d-on-green: #04110a; }
        @media (prefers-color-scheme: light) {
          :root:root { --st-bg: #f5f6f8; --st-bg-2: #eef1f7; --st-card: #ffffff; --st-card-2: #ffffff; --st-line: #dfe4ee; --st-line-2: #c3ccdd;
            --st-ctl: #5a6585; --st-ink: #0e1530; --st-ink-2: #334063; --st-ink-3: #5a6585; --st-act: #3a5bbf; --st-act-hov: #24427f;
            --st-on-act: #ffffff; --st-blue: #3a5bbf; --st-green: #108048; --st-gold: #9a6a00; --st-red: #c62828;
            --st-ok-tint: rgba(16,128,72,0.10); --st-bad-tint: rgba(198,40,40,0.08); --st-bezel: #eef1f7; color-scheme: light; }
          .sd { --d-stem: #1c2647; --d-strong: #0e1530; --d-main-a: #ffffff; --d-main-b: #ffffff; --d-choice: #f7f8fb; --d-disabled: #e6e9f0;
            --d-body: #334063; --d-label: #46526f; --d-hover: rgba(14,21,48,0.04); --d-dotted: rgba(14,21,48,0.35); --d-shadow: rgba(20,30,70,0.10);
            --d-glow: rgba(58,91,191,0.08); --d-glow-0: rgba(58,91,191,0); --d-warn: #a86200;
            --d-act-t08: rgba(58,91,191,0.06); --d-act-t10: rgba(58,91,191,0.08); --d-act-t16: rgba(58,91,191,0.12);
            --d-act-t25: rgba(58,91,191,0.22); --d-act-t50: rgba(58,91,191,0.45); --d-gold-line: rgba(154,106,0,0.45);
            --d-ok-line: rgba(16,128,72,0.40); --d-ok-line2: rgba(16,128,72,0.55); --d-ok-wash: rgba(16,128,72,0.07);
            --d-bad-line: rgba(198,40,40,0.40); --d-bad-line2: rgba(198,40,40,0.55); --d-bad-wash: rgba(198,40,40,0.06); --d-bad-fill: #c62828; --d-on-green: #ffffff; }
        }
        .sd { min-height: 100vh; color: var(--st-ink); background: radial-gradient(1100px 420px at 50% -120px, var(--d-glow), var(--d-glow-0) 70%), var(--st-bg);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif;
          padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
        .sd-mono, .sd-h, .sd-clock, .sd-chip, .sd-letter, .sd-tag, .sd-foot { font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace; }
        .sd-top { max-width: 1440px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; padding: 16px 0 14px; border-bottom: 1px solid var(--st-line); }
        .sd-logo { display: inline-flex; align-items: center; gap: 9px; text-decoration: none; }
        .sd-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--st-green); box-shadow: 0 0 10px rgba(48,209,88,0.7); }
        .sd-l1 { font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-weight: 700; font-size: 18px; letter-spacing: 3px; color: var(--st-act); }
        .sd-l2 { font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-weight: 600; font-size: 14px; letter-spacing: 3px; color: var(--st-ink-2); margin-left: -2px; }
        .sd-tag { font-size: 11px; letter-spacing: 0.14em; color: var(--st-ink-3); border: 1px solid var(--st-line-2); border-radius: 6px; padding: 4px 8px; }
        .sd-topr { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .sd-chip { font-size: 12.5px; color: var(--st-ink-2); padding: 6px 10px; border-radius: 8px; border: 1px solid var(--st-line); background: var(--st-card-2); }
        .sd-ghost { font: inherit; font-size: 12.5px; height: 32px; padding: 0 11px; border-radius: 8px; border: 1px solid var(--st-line-2); background: transparent; color: var(--st-ink-2); cursor: pointer; }
        .sd-ghost:hover { background: var(--d-hover); }
        .sd-small { height: 30px; }
        .sd-on-gold { color: var(--st-gold); border-color: var(--d-gold-line); }
        .sd-on-blue { color: var(--st-blue); border-color: var(--d-act-t50); background: var(--d-act-t08); }
        .sd-gate { max-width: 1440px; margin: 0 auto; padding: 48px 0; display: flex; justify-content: center; }
        .sd-card { border-radius: 16px; border: 1px solid var(--st-line); background: var(--st-card-2); padding: 20px; }
        .sd-narrow { max-width: 460px; width: 100%; display: flex; flex-direction: column; gap: 12px; }
        .sd-narrow h2 { margin: 0; font-size: 22px; text-wrap: balance; }
        .sd-muted { color: var(--st-ink-3); }
        .sd-sale { margin: 0; padding: 10px 12px; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--st-gold); color: var(--st-ink); font-size: 14px; line-height: 1.45; }
        .sd-sale-clock { color: var(--st-gold); font-family: var(--f-mono); font-variant-numeric: tabular-nums; white-space: nowrap; }
        .sd-fine { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--st-ink-3); }
        .sd-err { margin: 0; font-size: 13px; color: var(--st-red); }
        .sd-grid { max-width: 1440px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: flex-start; gap: 20px; padding: 20px 0; }
        .sd-left { flex: 1 1 220px; min-width: 0; display: flex; flex-direction: column; gap: 22px; }
        .sd-main { flex: 999 1 560px; min-width: 0; display: flex; flex-direction: column; border-radius: 16px; border: 1px solid var(--st-line); background: linear-gradient(180deg, var(--d-main-a), var(--d-main-b)); box-shadow: 0 30px 60px var(--d-shadow); }
        .sd-right { flex: 1 1 320px; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
        .sd-sec { display: flex; flex-direction: column; gap: 10px; }
        .sd-h { margin: 0; font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; color: var(--st-ink-3); }
        .sd-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
        .sd-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .sd-stats div, .sd-pace div { display: flex; flex-direction: column; gap: 2px; }
        .sd-stats b, .sd-pace b { font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 20px; color: var(--st-ink); font-weight: 600; }
        .sd-stats span { font-size: 11.5px; color: var(--st-ink-3); }
        .sd-map { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
        .sd-cell { position: relative; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 12px; border: 1px solid var(--st-line); color: var(--st-ink-3); }
        .sd-ok { background: var(--st-ok-tint); border-color: var(--d-ok-line); color: var(--st-green); }
        .sd-bad { background: var(--st-bad-tint); border-color: var(--d-bad-line); color: var(--st-red); }
        .sd-cur { background: var(--d-act-t16); border-color: var(--st-act); color: var(--d-strong); }
        .sd-flag { position: absolute; top: 4px; right: 4px; width: 5px; height: 5px; border-radius: 50%; background: var(--st-gold); }
        .sd-sys { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; }
        .sd-bar { height: 4px; border-radius: 2px; background: var(--st-line); overflow: hidden; }
        .sd-bar div { height: 100%; border-radius: 2px; background: var(--st-act); }
        .sd-qbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; padding: 14px 18px; border-bottom: 1px solid var(--st-line); font-size: 12px; letter-spacing: 0.1em; }
        .sd-strong { color: var(--st-ink); font-weight: 600; }
        .sd-tools { display: flex; gap: 6px; margin-left: auto; letter-spacing: 0; }
        .sd-clock { font-size: 13px; color: var(--st-ink); padding: 6px 10px; border-radius: 8px; background: var(--st-bezel); border: 1px solid var(--st-line); letter-spacing: 0; }
        .sd-q { padding: 26px clamp(16px, 3vw, 34px) 8px; display: flex; flex-direction: column; gap: 20px; }
        .sd-stem { margin: 0; max-width: 70ch; font-size: 17px; line-height: 1.68; color: var(--d-stem); }
        .sd-pos { background: transparent; color: var(--st-gold); font-weight: 600; }
        .sd-neg { background: transparent; color: var(--st-ink-2); text-decoration: underline dotted var(--d-dotted); text-underline-offset: 3px; }
        .sd-lead { margin: 0; font-size: 17px; font-weight: 600; color: var(--d-strong); }
        .sd-choices { display: flex; flex-direction: column; gap: 9px; max-width: 780px; }
        .sd-ch { display: flex; align-items: stretch; border-radius: 12px; border: 1px solid var(--st-line); background: var(--d-choice); }
        .sd-chb { flex: 1; min-width: 0; display: flex; align-items: center; gap: 14px; padding: 12px 14px; background: transparent; border: 0; text-align: left; color: var(--st-ink); font: inherit; cursor: pointer; }
        .sd-chb:disabled { cursor: default; }
        .sd-ch:hover:not(.sd-ch-ans):not(.sd-ch-bad):not(.sd-ch-dim) { border-color: var(--st-line-2); }
        .sd-letter { flex: none; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 7px; font-size: 13px; font-weight: 700; border: 1px solid var(--st-line-2); color: var(--st-ink-2); }
        .sd-chtext { flex: 1; min-width: 0; font-size: 15.5px; line-height: 1.45; }
        .sd-chtag { flex: none; font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 10.5px; letter-spacing: 0.12em; }
        .sd-ch-pick { border-color: var(--st-act); background: var(--d-act-t10); }
        .sd-ch-pick .sd-letter { background: var(--st-act); border-color: var(--st-act); color: #fff; }
        .sd-ch-struck .sd-chtext { text-decoration: line-through; opacity: 0.45; }
        .sd-ch-ans { border-color: var(--d-ok-line2); background: var(--d-ok-wash); }
        .sd-ch-ans .sd-letter { background: var(--st-green); border-color: var(--st-green); color: var(--d-on-green); }
        .sd-ch-bad { border-color: var(--d-bad-line2); background: var(--d-bad-wash); }
        .sd-ch-bad .sd-letter { background: var(--d-bad-fill); border-color: var(--d-bad-fill); color: #fff; }
        .sd-ch-dim .sd-chtext { color: var(--st-ink-3); }
        .sd-strike { flex: none; width: 44px; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: 0; border-left: 1px solid var(--st-line); color: var(--st-ink-3); cursor: pointer; border-radius: 0 12px 12px 0; }
        .sd-strike[aria-pressed='true'] { color: var(--st-red); }
        .sd-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 18px clamp(16px, 3vw, 34px) 24px; }
        .sd-qclock { margin-left: auto; font-size: 12px; }
        .sd-primary { height: 44px; padding: 0 22px; border-radius: 11px; border: 0; background: var(--st-act); color: #fff; font: inherit; font-size: 14.5px; font-weight: 600; cursor: pointer; box-shadow: 0 8px 24px var(--d-act-t25); }
        .sd-primary:disabled { background: var(--d-disabled); color: var(--st-ink-3); box-shadow: none; cursor: default; }
        .sd-reveal { display: flex; flex-direction: column; gap: 16px; }
        .sd-verdict { margin: 0; display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 15px; }
        .sd-xp { margin-left: auto; font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 12px; color: var(--st-gold); }
        .sd-ok-t { color: var(--st-green); }
        .sd-bad-t { color: var(--st-red); }
        .sd-warn-t { color: var(--d-warn); }
        .sd-blue-t { color: var(--st-blue); }
        .sd-blk { display: flex; flex-direction: column; gap: 6px; }
        .sd-blk p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--d-body); }
        .sd-dx { font-size: 17px; font-weight: 600; color: var(--d-strong); }
        .sd-hook { padding: 14px; border-radius: 12px; background: var(--d-act-t08); border: 1px solid var(--d-act-t25); }
        .sd-hook p { color: var(--st-ink); font-weight: 500; }
        .sd-move { margin: 0; font-size: 11px; letter-spacing: 0.1em; color: var(--st-ink-3); border-top: 1px solid var(--st-line); padding-top: 12px; }
        .sd-pace { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .sd-labs { display: flex; flex-direction: column; gap: 10px; }
        .sd-search { height: 34px; border-radius: 9px; border: 1px solid var(--st-line-2); background: var(--st-bezel); color: var(--st-ink); padding: 0 10px; font: inherit; font-size: 13px; }
        .sd-labscroll { max-height: 420px; overflow: auto; display: flex; flex-direction: column; gap: 12px; }
        .sd-labg { display: flex; flex-direction: column; }
        .sd-labt { font-size: 11px; color: var(--st-ink-3); padding-bottom: 4px; }
        .sd-lab { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; padding: 4px 0; border-top: 1px solid var(--st-line); }
        .sd-lab span:first-child { color: var(--d-label); }
        .sd-lab .sd-mono { font-size: 12px; color: var(--st-ink); text-align: right; }
        .sd-done { padding: 36px clamp(16px, 3vw, 34px); display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
        .sd-big { margin: 0; font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 44px; font-weight: 700; color: var(--d-strong); }
        .sd-pad { padding: 28px; }
        .sd-foot { max-width: 1440px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 22px; padding: 12px 0 calc(18px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--st-line); font-size: 11.5px; color: var(--st-ink-3); }
        .sd-foot b { color: var(--d-label); font-weight: 500; }
        .sd-sync { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
        .sd-sync i { width: 6px; height: 6px; border-radius: 50%; background: var(--st-green); box-shadow: 0 0 8px rgba(48,209,88,0.8); }
        @media (max-width: 900px) { .sd-main { order: -1; } }
        @media (max-width: 720px) { .sd-foot span:not(.sd-sync) { display: none; } .sd-sync { margin-left: 0; } }
      `}</style>
    </>
  );
}
