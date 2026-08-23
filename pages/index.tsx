// Homepage in the Score Report register (2026-08-24): the readiness check IS the
// hero, because /readiness was the only page producing store clicks while the
// homepage took 90% of organic landings. Paper + ink + mono numerals + one green
// verdict + one gold action; the ink "pitch" band is the single dark surface.
// Live track record numbers come from track_record_json (server-side, 1h cache).
// Reviews are verbatim App Store reviews already cited on the guides; never
// paraphrased. No em or en dashes in copy.
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { GetServerSideProps } from 'next';
import ReadinessCheck from '../components/ReadinessCheck';
import { appStoreUrl, track, referrerHost } from '../lib/analytics';

const CAMPAIGN = 'home';
const TRACK_RECORD_URL = 'https://us-central1-stepgunner-79ae7.cloudfunctions.net/track_record_json';

type Row = { forms: number; err: number; inside: boolean; source?: string };
type Summary = { n: number; inside: number; within7Pct: number; medianAbsErr?: number };
type TrackRecord = { n: number; insideOf10: number; shown: number; medianAbsErr: number; last10: Row[];
  bySource?: { app?: Summary; forum?: Summary }; forumFit?: { n: number; within7Pct: number }; computedAt?: number } | null;

const FALLBACK: NonNullable<TrackRecord> = {
  n: 47, insideOf10: 8, shown: 10, medianAbsErr: 6,
  last10: [{ forms: 2, err: 6, inside: true }, { forms: 1, err: -6, inside: true }, { forms: 1, err: 4, inside: true, source: 'forum' },
    { forms: 7, err: -2, inside: true, source: 'forum' }, { forms: 3, err: 13, inside: false, source: 'forum' }, { forms: 5, err: 2, inside: true, source: 'forum' },
    { forms: 2, err: -4, inside: true, source: 'forum' }, { forms: 1, err: 40, inside: false }],
  bySource: { app: { n: 7, inside: 4, within7Pct: 43 }, forum: { n: 40, inside: 33, within7Pct: 80, medianAbsErr: 4 } },
  forumFit: { n: 239, within7Pct: 70 },
};

const REVIEWS = [
  { quote: 'This app makes studying so effortless and fun. Highly recommend.', cite: '5-star App Store review, "Best Step 2 supplement"' },
  { quote: 'Gotten me multiple questions on practice tests. Helpful for those not keen on the Anki burden but who like spaced repetition.', cite: '5-star App Store review' },
];

function AppleIcon() {
  return <svg viewBox="0 0 384 512" aria-hidden="true" style={{ width: 16, height: 16, fill: 'currentColor' }}><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>;
}

export default function Home({ record }: { record: TrackRecord }) {
  const rec = record && record.last10?.length ? record : FALLBACK;
  const forum = rec.bySource?.forum;
  const APP = appStoreUrl(CAMPAIGN);

  // Referral bridge: ?ref=CODE shows a banner and copies GUNNERREF:CODE to the
  // clipboard on the store tap; the app reads UIPasteboard once on first launch.
  const [refCode, setRefCode] = useState<string | null>(null);
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('ref');
    if (r && r.trim()) setRefCode(r.trim().toUpperCase());
  }, []);
  const store = (location: string) => () => {
    if (refCode) { try { navigator.clipboard.writeText(`GUNNERREF:${refCode}`); } catch { /* manual entry still works */ } }
    track('store_click', { source: CAMPAIGN, location, ref: referrerHost() });
  };

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Step Gunner',
    operatingSystem: 'iOS', applicationCategory: 'EducationalApplication',
    url: 'https://stepgunner.com', description: 'USMLE Step 2 CK prep with a calibrated score projection that shows its track record.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Organization', name: 'Rezumab LLC' },
  };

  return (
    <>
      <Head>
        <title>Step Gunner | Know your Step 2 CK number before exam day</title>
        <meta name="description" content="Enter your NBME and UWSA forms and get the range a calibrated model projects, checked against real students every week. Then study in the app that carries the same gauge: 7,700+ Step 2 CK questions, next-best-step chains, spaced repetition." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
        <meta property="og:title" content="Step Gunner | Know your Step 2 CK number before exam day" />
        <meta property="og:description" content="A calibrated score projection that shows its track record, and the study app that moves it." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stepgunner.com" />
        <meta property="og:image" content="https://stepgunner.com/og/research-nbme-step2.png" />
        <link rel="canonical" href="https://stepgunner.com/" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>
      <style jsx global>{`
        :root {
          --bg: #faf9f6; --bg-2: #ffffff; --bg-3: #f3f2ee;
          --hair: rgba(25,28,35,0.10); --hair-strong: rgba(25,28,35,0.17);
          --ink: #191c23; --ink-dim: #5d6470; --ink-faint: #9aa0ab;
          --green: #0d9448; --gold: #e08e00; --blue: #2f6fed; --red: #d64545; --violet: #af52ff;
          --mono: ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, monospace;
          --sans: 'DM Sans', -apple-system, system-ui, sans-serif;
        }
        * { box-sizing: border-box; } html, body { margin: 0; padding: 0; }
        body { font-family: var(--sans); color: var(--ink); background: var(--bg); -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
        ::selection { background: var(--gold); color: #fff; }
      `}</style>
      <style jsx>{`
        .page { min-height: 100vh; background: radial-gradient(90% 55% at 50% -8%, rgba(13,148,72,0.08), transparent 60%), radial-gradient(56% 22% at 50% 0%, rgba(240,180,41,0.13), transparent 62%), var(--bg); }
        .nav { display: flex; align-items: center; justify-content: space-between; max-width: 1040px; margin: 0 auto; padding: 20px 22px; }
        .wm { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-weight: 700; letter-spacing: 2.5px; font-size: 14px; }
        .wm .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 9px var(--green); } .wm b { color: var(--green); }
        .navlinks { display: flex; gap: 22px; font-family: var(--mono); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--ink-dim); }
        .navlinks :global(a):hover { color: var(--ink); }
        .nav-cta { background: var(--ink); color: #fff; padding: 9px 18px; border-radius: 999px; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 1px; }
        @media (max-width: 720px) { .navlinks { display: none; } }
        .hero { max-width: 1040px; margin: 0 auto; padding: 26px 22px 10px; display: grid; grid-template-columns: 1.05fr 1fr; gap: 36px; align-items: start; }
        @media (max-width: 860px) { .hero { grid-template-columns: 1fr; } }
        .badge { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #b57400; border: 1px solid rgba(224,142,0,0.35); background: rgba(240,180,41,0.10); border-radius: 999px; padding: 5px 11px; }
        h1 { font-size: 46px; font-weight: 800; letter-spacing: -1.2px; line-height: 1.04; margin: 18px 0 12px; } h1 .g { color: var(--green); }
        @media (max-width: 520px) { h1 { font-size: 36px; } }
        .sub { color: var(--ink-dim); font-size: 17px; line-height: 1.6; max-width: 46ch; margin-bottom: 20px; }
        .proof { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
        .proof span { font-family: var(--mono); font-size: 11px; font-weight: 700; padding: 6px 11px; border-radius: 999px; border: 1px solid var(--hair-strong); background: var(--bg-2); color: var(--ink-dim); }
        .proof span b { color: var(--ink); }
        .store { display: inline-flex; align-items: center; gap: 10px; background: var(--gold); color: #1a1403; font-weight: 800; font-size: 15px; padding: 14px 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(224,142,0,0.25); transition: transform .15s ease; }
        .store:hover { transform: translateY(-1px); }
        .tiny { font-family: var(--mono); font-size: 10.5px; color: var(--ink-faint); letter-spacing: 0.3px; margin-top: 10px; }
        .ref-banner { display: inline-flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 12.5px; color: var(--ink); background: rgba(13,148,72,0.08); border: 1px solid rgba(13,148,72,0.32); padding: 9px 16px; border-radius: 999px; margin-bottom: 18px; max-width: 92vw; line-height: 1.45; }
        .ref-banner strong { color: var(--green); }
        .receipts { max-width: 1040px; margin: 30px auto 0; padding: 0 22px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 860px) { .receipts { grid-template-columns: repeat(2, 1fr); } }
        .rc { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 14px; padding: 16px; }
        .rc .n { font-family: var(--mono); font-size: 30px; font-weight: 800; letter-spacing: -1px; line-height: 1; } .rc .n span { font-size: 14px; color: var(--ink-faint); font-weight: 600; }
        .rc .l { font-family: var(--mono); font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--ink-faint); margin-top: 8px; line-height: 1.5; }
        .rc.green .n { color: var(--green); }
        section { max-width: 1040px; margin: 0 auto; padding: 54px 22px 0; }
        .sh { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }
        .sh h2 { font-size: 28px; font-weight: 800; letter-spacing: -0.6px; } .sh :global(a.more) { font-family: var(--mono); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--green); }
        .sh p { color: var(--ink-dim); font-size: 15px; max-width: 62ch; width: 100%; }
        .tr { display: grid; grid-template-columns: 1.1fr 1fr; gap: 22px; } @media (max-width: 860px) { .tr { grid-template-columns: 1fr; } }
        .led { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 16px; padding: 16px 18px; }
        .led .k { font-family: var(--mono); font-size: 10px; letter-spacing: 1.6px; text-transform: uppercase; color: var(--ink-faint); display: flex; justify-content: space-between; }
        .led .big { font-family: var(--mono); font-size: 40px; font-weight: 800; letter-spacing: -1.5px; margin: 8px 0 2px; } .led .big span { font-size: 16px; color: var(--ink-faint); font-weight: 600; }
        .led .s { font-size: 13.5px; color: var(--ink-dim); line-height: 1.5; margin-bottom: 12px; }
        .lrow { display: grid; grid-template-columns: 64px 1fr 40px; align-items: center; gap: 10px; height: 18px; font-family: var(--mono); font-size: 10.5px; }
        .lrow .t { position: relative; height: 18px; } .lrow .t:before { content: ""; position: absolute; left: 0; right: 0; top: 8.5px; height: 1px; background: var(--hair-strong); }
        .band { position: absolute; top: 1px; height: 16px; left: 41.1%; width: 17.8%; background: rgba(224,142,0,0.10); border-left: 1px dashed rgba(224,142,0,0.55); border-right: 1px dashed rgba(224,142,0,0.55); border-radius: 3px; }
        .dot { position: absolute; top: 4px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; border: 2px solid var(--bg-2); } .dot.in { background: var(--green); } .dot.out { background: var(--red); }
        .lrow .e { text-align: right; font-weight: 700; color: var(--ink-dim); } .lrow .e.out { color: var(--red); }
        .lrow .f { color: var(--ink-faint); white-space: nowrap; } .lrow .f i { font-style: normal; font-size: 8px; border: 1px solid var(--hair-strong); border-radius: 3px; padding: 0 3px; margin-left: 3px; }
        .led .foot { font-family: var(--mono); font-size: 10px; color: var(--ink-faint); margin-top: 10px; line-height: 1.6; }
        .why { display: flex; flex-direction: column; gap: 10px; }
        .why .c { background: var(--bg-2); border: 1px solid var(--hair); border-radius: 14px; padding: 14px 16px; }
        .why .c b { display: block; font-size: 15px; margin-bottom: 4px; } .why .c p { font-size: 13.5px; color: var(--ink-dim); line-height: 1.55; } .why .c :global(a) { color: var(--blue); }
        .pitch { max-width: 1040px; margin: 54px auto 0; background: var(--ink); border-radius: 22px; padding: 34px 30px; color: #fff; position: relative; overflow: hidden; display: grid; grid-template-columns: 1fr 1.1fr; gap: 26px; align-items: center; }
        .pitch:before { content: ""; position: absolute; inset: 0; background: radial-gradient(60% 90% at 85% 0%, rgba(240,180,41,0.22), transparent 60%); }
        .pitch > * { position: relative; }
        @media (max-width: 860px) { .pitch { grid-template-columns: 1fr; margin: 54px 22px 0; } }
        .pitch .pk { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.55); }
        .pitch h2 { font-size: 30px; font-weight: 800; letter-spacing: -0.6px; margin: 8px 0 10px; line-height: 1.1; }
        .pitch p { font-size: 15px; color: rgba(255,255,255,0.74); line-height: 1.65; max-width: 48ch; margin-bottom: 16px; }
        .pitch ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; margin: 0 0 18px; padding: 0; }
        .pitch li { font-size: 13.5px; color: rgba(255,255,255,0.85); display: flex; gap: 8px; align-items: flex-start; } .pitch li:before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #46d877; margin-top: 7px; flex: 0 0 auto; }
        .shots { display: flex; gap: 12px; justify-content: center; }
        .shots img { width: 31%; border-radius: 18px; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .shots img:nth-child(2) { transform: translateY(-14px); }
        .ptrust { font-family: var(--mono); font-size: 10.5px; color: rgba(255,255,255,0.5); margin-top: 12px; }
        .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; } @media (max-width: 860px) { .cards { grid-template-columns: 1fr; } }
        .card { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 8px; transition: transform .15s ease; }
        .card:hover { transform: translateY(-2px); }
        .card .k { font-family: var(--mono); font-size: 10px; letter-spacing: 1.6px; text-transform: uppercase; color: var(--ink-faint); }
        .card b { font-size: 16px; line-height: 1.3; } .card p { font-size: 13.5px; color: var(--ink-dim); line-height: 1.55; flex: 1; margin: 0; }
        .card .go { font-family: var(--mono); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--green); font-weight: 700; }
        .quotes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; } @media (max-width: 860px) { .quotes { grid-template-columns: 1fr; } }
        .q { background: var(--bg-2); border: 1px solid var(--hair); border-radius: 14px; padding: 16px; }
        .q .stars { color: var(--gold); font-size: 13px; letter-spacing: 2px; } .q p { font-size: 14.5px; color: var(--ink); line-height: 1.55; margin: 8px 0; } .q .who { font-family: var(--mono); font-size: 10.5px; color: var(--ink-faint); }
        .final { max-width: 1040px; margin: 54px auto 0; padding: 0 22px; text-align: center; }
        .final h2 { font-size: 32px; font-weight: 800; letter-spacing: -0.8px; margin-bottom: 10px; } .final p { color: var(--ink-dim); font-size: 16px; margin-bottom: 20px; }
        footer { max-width: 1040px; margin: 60px auto 0; padding: 22px 22px 50px; border-top: 1px solid var(--hair); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-family: var(--mono); font-size: 11px; color: var(--ink-faint); }
        footer :global(a) { color: var(--ink-dim); margin-right: 14px; }
      `}</style>

      <div className="page">
        <nav className="nav">
          <a href="/" className="wm"><span className="dot" />STEP <b>GUNNER</b></a>
          <div className="navlinks"><Link href="/readiness">Readiness check</Link><Link href="/research/nbme-to-step-2">Research</Link><Link href="/guides">Guides</Link><Link href="/readiness/methodology">Methodology</Link></div>
          <a href={APP} className="nav-cta" onClick={store('nav')}>Get the app</a>
        </nav>

        <div className="hero">
          <div>
            {refCode && <div className="ref-banner"><strong>{refCode}</strong> A classmate invited you. Tap the store button and the code comes along.</div>}
            <span className="badge">USMLE Step 2 CK</span>
            <h1>Know your number <span className="g">before</span> exam day.</h1>
            <p className="sub">Enter your NBME and UWSA forms. Get the range a calibrated model projects, see how it did on real students, then drill the weak system in the app that carries the same gauge.</p>
            <div className="proof">
              <span><b>269</b> real score reports</span>
              <span><b>{forum ? forum.within7Pct : 80}%</b> within 7 points, out of sample</span>
              <span><b>7,700+</b> questions</span>
              <span>App Store <b>4.8</b></span>
            </div>
            <a href={APP} className="store" onClick={store('hero')}><AppleIcon /> Get Step Gunner free</a>
            <div className="tiny">FREE TO START · iOS 17+ · BUILT BY A MED STUDENT WHO SCORED 270</div>
          </div>
          <ReadinessCheck surface="home_hero" />
        </div>

        <div className="receipts">
          <div className="rc green"><div className="n">{forum ? forum.inside : 33}<span> / {forum ? forum.n : 40}</span></div><div className="l">r/step2 posters the model never trained on landed inside their range</div></div>
          <div className="rc"><div className="n">+9</div><div className="l">average climb from practice average to the real score, at the middle</div></div>
          <div className="rc"><div className="n">{forum?.medianAbsErr != null ? forum.medianAbsErr : 4}</div><div className="l">median points off, out of sample, updated every Monday</div></div>
          <div className="rc"><div className="n">6</div><div className="l">forms a typical student takes; the last two weeks are the signal</div></div>
        </div>

        <section>
          <div className="sh"><h2>It shows its work, every Monday.</h2><Link href="/research/nbme-to-step-2" className="more">The full record &rarr;</Link><p>Every new student who gets a real score is judged against the frozen model. The misses stay on the board. This is the same card that sits under the readiness gauge in the app.</p></div>
          <div className="tr">
            <div className="led">
              <div className="k"><span>Track record</span><span>updates every Monday</span></div>
              <div className="big">{rec.insideOf10}<span>/{rec.shown}</span></div>
              <div className="s">of the last {rec.shown} students to get their real score landed inside the range the model gave them. Typical miss {Math.round(rec.medianAbsErr)} points.</div>
              {rec.last10.slice(0, 8).map((r, i) => {
                const left = 50 + 50 * Math.max(-1, Math.min(1, r.err / 45));
                return (
                  <div className="lrow" key={i}>
                    <span className="f">{r.forms === 1 ? '1 form' : `${r.forms} forms`}{r.source === 'forum' && <i>r/</i>}</span>
                    <div className="t"><div className="band" /><span className={`dot ${r.inside ? 'in' : 'out'}`} style={{ left: `${left}%` }} /></div>
                    <span className={`e${r.inside ? '' : ' out'}`}>{r.err > 0 ? `+${r.err}` : r.err}</span>
                  </div>
                );
              })}
              <div className="foot">Points off, newest first. r/ marks an r/step2 score report. Calibrated on {rec.forumFit?.n ?? 239} published outcomes: {rec.forumFit?.within7Pct ?? 70}% within 7 points.</div>
            </div>
            <div className="why">
              <div className="c"><b>Why the model is flatter than "add 10"</b><p>Students under 235 climbed about 20 points; students over 265 climbed about 2. The line bends because low averages contain bad days. <Link href="/research/nbme-to-step-2">The data, 269 students &rarr;</Link></p></div>
              <div className="c"><b>Why your last form counts most</b><p>A form from three weeks out carries half the weight of one from this week. Old forms read low because of when they were taken, not which form.</p></div>
              <div className="c"><b>Which forms lie</b><p>NBME 9 prints about 6 points low, UWSA 2 about 5 high, UWSA 3 about 8 low. Modern NBMEs are equated and left alone. The corrections are applied for you.</p></div>
            </div>
          </div>
        </section>

        <div className="pitch">
          <div>
            <div className="pk">The app</div>
            <h2>The same projection, with a gauge that moves when you study.</h2>
            <p>7,700 questions written the way a Step 2 attending asks them: pattern to diagnosis, then the next best step as a full management chain. Spaced repetition that drains your misses. A readiness gauge with its track record attached.</p>
            <ul><li>Buzzwords, CK Gold, Next Best Step chains</li><li>Visual Dx: 890+ images</li><li>Weekly leagues and a results screen that scores every round</li><li>Readiness gauge with the track record</li></ul>
            <a href={APP} className="store" onClick={store('pitch')}><AppleIcon /> Get Step Gunner free</a>
            <div className="ptrust">Free to start. Pro unlocks the full bank and the coach. 1,200+ students.</div>
          </div>
          <div className="shots">
            <img src="/screenshots/showcase/01-home.jpg" alt="Step Gunner home screen" loading="lazy" />
            <img src="/screenshots/showcase/05-results.jpg" alt="Round results with the accuracy ring" loading="lazy" />
            <img src="/screenshots/showcase/09-league.jpg" alt="Weekly league" loading="lazy" />
          </div>
        </div>

        <section>
          <div className="sh"><h2>Read the evidence.</h2><p>Everything on this site is grounded in data you can check: published score reports, a frozen model, a public record.</p></div>
          <div className="cards">
            <Link href="/research/nbme-to-step-2" className="card"><span className="k">Research</span><b>I pulled 269 NBME to Step 2 score pairs off Reddit. Here is what actually predicts your score.</b><p>Climb by starting band, the recency half-life, which forms read off scale, and the model's out-of-sample record.</p><span className="go">Read &rarr;</span></Link>
            <Link href="/guides" className="card"><span className="k">Guides</span><b>Clerkship guides with honest resource stacks</b><p>What to do each week of the rotation and where Step Gunner fits, with real deck counts.</p><span className="go">Browse &rarr;</span></Link>
            <Link href="/readiness/methodology" className="card"><span className="k">Methodology</span><b>How the predictor works, constant by constant</b><p>The anchor, the shrinkage, the band widths, the form offsets, and the live out-of-sample numbers, imported from the same code that runs the calculator.</p><span className="go">Open &rarr;</span></Link>
          </div>
        </section>

        <section>
          <div className="sh"><h2>From the App Store</h2><p>Verbatim, from 5-star reviews.</p></div>
          <div className="quotes">
            {REVIEWS.map((r) => <div className="q" key={r.cite}><div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div><p>&ldquo;{r.quote}&rdquo;</p><div className="who">{r.cite}</div></div>)}
          </div>
        </section>

        <div className="final">
          <h2>Run your numbers, then go study.</h2>
          <p>The calculator is free and stays free. The app is where the number starts moving.</p>
          <a href={APP} className="store" onClick={store('final')}><AppleIcon /> Get Step Gunner free</a>
        </div>

        <footer>
          <span>stepgunner.com</span>
          <span><Link href="/readiness">Readiness check</Link><Link href="/research/nbme-to-step-2">Research</Link><Link href="/guides">Guides</Link><Link href="/support">Support</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></span>
          <span>Rezumab LLC</span>
        </footer>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  let record: TrackRecord = null;
  try {
    const r = await fetch(TRACK_RECORD_URL, { headers: { accept: 'application/json' } });
    if (r.ok) record = (await r.json()) as TrackRecord;
  } catch { record = null; }
  return { props: { record } };
};
