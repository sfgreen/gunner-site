import Head from 'next/head';
import { useState, useEffect } from 'react';

// The app's wordmark, on the web: ● STEP (accent blue) GUNNER (dim),
// SF Mono / system monospaced, all-caps, tracked — matches the splash +
// home header in the iOS app.
function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <span className="wm" style={{ fontSize: size }}>
      <span className="wm-dot" />
      <span className="wm-step">STEP</span>
      <span className="wm-gun">GUNNER</span>
    </span>
  );
}

export default function Home() {
  const APP = 'https://apps.apple.com/us/app/step-gunner/id6761317357';
  // Referral bridge: read ?ref=CODE, show a banner, and copy a GUNNERREF:CODE
  // sentinel to the clipboard on the App Store tap so the code survives the
  // install — the app reads UIPasteboard once on first launch and applies it.
  const [refCode, setRefCode] = useState<string | null>(null);
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('ref');
    if (r && r.trim()) setRefCode(r.trim().toUpperCase());
  }, []);
  const copyRef = () => {
    if (refCode) {
      try { navigator.clipboard.writeText(`GUNNERREF:${refCode}`); }
      catch { /* clipboard blocked; manual code entry in-app still works */ }
    }
  };
  return (
    <>
      <Head>
        <title>Step Gunner | USMLE Step 2 CK Prep</title>
        <meta name="description" content="Step Gunner is a gamified USMLE Step 2 CK study app: clinical case missions, Socratic rounds, 1,400+ high-yield questions, spaced repetition, and weekly leagues. Built by a med student, for med students." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0a0b0d" />
        <meta property="og:title" content="Step Gunner | USMLE Step 2 CK Prep" />
        <meta property="og:description" content="Gun for honors. Clinical case missions, Socratic rounds, weekly leagues, and a streak that won't let you coast." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stepgunner.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          --bg: #0a0b0d; --bg-2: #0d0e13;
          --panel: #121317; --panel-2: #16181d;
          --hair: rgba(255,255,255,0.08); --hair-strong: rgba(255,255,255,0.14);
          --ink: #f4f6f8; --ink-dim: #9aa1ab; --ink-faint: #5c636e;
          --green: #46d877; --green-dark: #2f9e57; --green-glow: rgba(70,216,119,0.18);
          --blue: #5090f7; --blue-glow: rgba(80,144,247,0.22);
          --gold: #e3b542; --red: #ef6d6d; --purple: #af52ff;
          --mono: ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, monospace;
          --sans: 'DM Sans', -apple-system, system-ui, sans-serif;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: var(--sans); color: var(--ink); background: var(--bg); -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
        ::selection { background: var(--blue); color: #fff; }

        /* WORDMARK */
        .wm { display: inline-flex; align-items: center; gap: 7px; font-family: var(--mono); font-weight: 700; letter-spacing: 2.5px; line-height: 1; white-space: nowrap; }
        .wm-dot { width: 0.4em; height: 0.4em; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green-glow); }
        .wm-step { color: var(--blue); }
        .wm-gun { color: var(--ink); font-weight: 500; opacity: 0.9; }

        /* NAV */
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(10,11,13,0.78); backdrop-filter: blur(14px); border-bottom: 1px solid var(--hair); padding: 0 40px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .nav-links { display: flex; gap: 30px; align-items: center; }
        .nav-links a { font-family: var(--mono); font-size: 11px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--ink-dim); transition: color 0.2s; }
        .nav-links a:hover { color: var(--ink); }
        .nav-cta { background: var(--blue); color: #fff !important; padding: 9px 18px; border-radius: 10px; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 1px; transition: transform 0.15s, box-shadow 0.2s; box-shadow: 0 4px 18px var(--blue-glow); }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 26px var(--blue-glow); }

        /* HERO */
        .hero { position: relative; padding: 150px 24px 70px; text-align: center; overflow: hidden; }
        .hero::before { content: ''; position: absolute; inset: 0; background:
          radial-gradient(620px 360px at 50% -4%, var(--blue-glow), transparent 60%),
          radial-gradient(500px 320px at 50% 8%, var(--green-glow), transparent 62%);
          pointer-events: none; }
        .hero::after { content: ''; position: absolute; inset: 0; background-image:
          linear-gradient(var(--hair) 1px, transparent 1px),
          linear-gradient(90deg, var(--hair) 1px, transparent 1px);
          background-size: 38px 38px; mask-image: radial-gradient(circle at 50% 30%, #000 0%, transparent 70%); opacity: 0.5; pointer-events: none; }
        .hero-inner { position: relative; z-index: 1; }
        .hero-badge { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--green); border: 1px solid rgba(70,216,119,0.3); background: rgba(70,216,119,0.06); padding: 6px 16px; border-radius: 999px; margin-bottom: 26px; }
        .hero h1 { font-size: 68px; font-weight: 800; line-height: 1.02; letter-spacing: -2px; max-width: 760px; margin: 0 auto 22px; }
        .hero h1 .a { color: var(--green); }
        .hero p { font-size: 19px; color: var(--ink-dim); max-width: 580px; margin: 0 auto 36px; line-height: 1.6; }
        .btn-store { display: inline-flex; align-items: center; gap: 10px; background: var(--blue); color: #fff; font-size: 17px; font-weight: 700; padding: 16px 34px; border-radius: 14px; transition: transform 0.15s, box-shadow 0.2s; box-shadow: 0 6px 28px var(--blue-glow); }
        .btn-store:hover { transform: translateY(-2px); box-shadow: 0 12px 40px var(--blue-glow); }
        .btn-store .apple { width: 16px; height: 19px; flex: 0 0 auto; }
        .hero-cta-row { display: flex; gap: 14px; justify-content: center; align-items: center; flex-wrap: wrap; }
        .btn-ghost { display: inline-flex; align-items: center; gap: 8px; color: var(--green); font-family: var(--mono); font-size: 13px; font-weight: 700; letter-spacing: 0.3px; border: 1px solid rgba(70,216,119,0.35); background: rgba(70,216,119,0.06); padding: 15px 22px; border-radius: 14px; transition: border-color 0.2s, background 0.2s; }
        .btn-ghost:hover { border-color: var(--green); background: rgba(70,216,119,0.12); transform: translateY(-2px); }
        .hero-sub { font-family: var(--mono); font-size: 12px; letter-spacing: 0.5px; color: var(--ink-faint); margin-top: 18px; }
        .ref-banner { display: inline-flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 12.5px; letter-spacing: 0.2px; color: var(--ink); background: rgba(70,216,119,0.08); border: 1px solid rgba(70,216,119,0.32); padding: 9px 16px; border-radius: 999px; margin-bottom: 22px; max-width: 92vw; line-height: 1.45; }
        .ref-banner strong { color: var(--green); font-weight: 700; }
        .ref-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green-glow); flex: 0 0 auto; }

        /* SHOWCASE STRIP */
        .showcase { padding: 0 0 96px; }
        .showcase-head { text-align: center; max-width: 600px; margin: 0 auto 30px; padding: 0 20px; }
        .showcase-head .eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 12px; }
        .showcase-head h2 { font-size: 34px; font-weight: 800; letter-spacing: -1px; }
        .showcase-strip { display: flex; gap: 20px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 10px 40px 28px; -webkit-overflow-scrolling: touch; }
        .showcase-strip::-webkit-scrollbar { height: 8px; }
        .showcase-strip::-webkit-scrollbar-track { background: transparent; }
        .showcase-strip::-webkit-scrollbar-thumb { background: var(--hair-strong); border-radius: 4px; }
        .showcase-strip img { flex: 0 0 auto; width: 300px; height: auto; display: block; border-radius: 30px; scroll-snap-align: center; border: 1px solid var(--hair); box-shadow: 0 18px 50px rgba(0,0,0,0.5); }

        /* FEATURES */
        .features { padding: 90px 40px; }
        .features-inner { max-width: 1100px; margin: 0 auto; }
        .features-header { text-align: center; margin-bottom: 56px; }
        .features-header .eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 14px; }
        .features-header h2 { font-size: 40px; font-weight: 800; letter-spacing: -1.4px; margin-bottom: 14px; }
        .features-header p { font-size: 17px; color: var(--ink-dim); max-width: 520px; margin: 0 auto; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .feature-card { background: var(--panel); border: 1px solid var(--hair); border-radius: 18px; padding: 28px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; position: relative; overflow: hidden; }
        .feature-card:hover { transform: translateY(-4px); border-color: var(--hair-strong); box-shadow: 0 16px 44px rgba(0,0,0,0.45); }
        .feature-icon { font-size: 30px; margin-bottom: 16px; }
        .feature-card h3 { font-size: 17px; font-weight: 700; margin-bottom: 9px; letter-spacing: -0.3px; }
        .feature-card p { font-size: 14px; color: var(--ink-dim); line-height: 1.65; }

        /* STATS */
        .stats-bar { padding: 70px 40px; border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair); background:
          radial-gradient(600px 200px at 50% 0%, var(--green-glow), transparent 70%), var(--bg-2); }
        .stats-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; text-align: center; }
        .stat-item .num { font-size: 46px; font-weight: 800; letter-spacing: -1.5px; color: var(--green); }
        .stat-item .label { font-family: var(--mono); font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--ink-faint); margin-top: 8px; }

        /* CTA */
        .cta-section { position: relative; padding: 110px 40px; text-align: center; overflow: hidden; }
        .cta-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(600px 320px at 50% 50%, var(--blue-glow), transparent 65%); pointer-events: none; }
        .cta-inner { position: relative; z-index: 1; }
        .cta-section h2 { font-size: 44px; font-weight: 800; letter-spacing: -1.6px; margin-bottom: 16px; }
        .cta-section p { font-size: 17px; color: var(--ink-dim); margin: 0 auto 36px; max-width: 480px; }

        /* FOOTER */
        footer { background: var(--bg-2); border-top: 1px solid var(--hair); color: var(--ink-dim); padding: 56px 40px 36px; }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 56px; padding-bottom: 40px; border-bottom: 1px solid var(--hair); }
        .footer-tagline { font-size: 14px; line-height: 1.7; color: var(--ink-faint); margin-top: 14px; max-width: 280px; }
        .footer-heading { font-family: var(--mono); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; color: var(--ink-faint); margin-bottom: 18px; }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .footer-links a { color: var(--ink-dim); font-size: 14px; transition: color 0.2s; }
        .footer-links a:hover { color: var(--ink); }
        .footer-bottom { max-width: 1100px; margin: 0 auto; padding-top: 28px; display: flex; justify-content: space-between; align-items: center; font-family: var(--mono); font-size: 11px; letter-spacing: 0.5px; color: var(--ink-faint); }

        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          nav { padding: 0 18px; }
          .nav-links a:not(.nav-cta) { display: none; }
          .hero { padding: 120px 20px 50px; }
          .hero h1 { font-size: 42px; letter-spacing: -1.2px; }
          .hero p { font-size: 16px; }
          .showcase-strip { padding: 10px 20px 24px; gap: 14px; }
          .showcase-strip img { width: 80vw; max-width: 320px; border-radius: 26px; }
          .features { padding: 64px 20px; }
          .features-grid { grid-template-columns: 1fr; }
          .features-header h2 { font-size: 30px; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .stat-item .num { font-size: 36px; }
          .cta-section { padding: 70px 20px; }
          .cta-section h2 { font-size: 32px; }
          .footer-inner { grid-template-columns: 1fr; gap: 32px; }
          .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <Wordmark size={18} />
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="/privacy">Privacy</a>
          <a href="/support">Support</a>
          <a href={APP} onClick={copyRef} className="nav-cta">Download</a>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-inner">
          {refCode && (
            <div className="ref-banner">
              <span className="ref-dot" />
              <span>Invite locked in <strong>{refCode}</strong> &middot; you and your friend each get <strong>250 XP</strong> when you join.</span>
            </div>
          )}
          <div className="hero-badge">USMLE Step 2 CK</div>
          <h1>Gun for <span className="a">honors.</span></h1>
          <p>Clinical case missions, Socratic rounds, 1,400+ high-yield questions, weekly leagues, and a streak that won&apos;t let you coast.</p>
          <div className="hero-cta-row">
            <a href={APP} onClick={copyRef} className="btn-store"><svg className="apple" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg> Download on the App Store</a>
            <a href="/readiness" className="btn-ghost">See your readiness, free &rarr;</a>
          </div>
          <p className="hero-sub">FREE TO START &middot; iOS 17+ &middot; BUILT BY A MED STUDENT</p>
        </div>
      </div>

      {/* SHOWCASE */}
      <div className="showcase">
        <div className="showcase-head">
          <div className="eyebrow">See it in action</div>
          <h2>Your Step 2 CK cockpit</h2>
        </div>
        <div className="showcase-strip">
          <img src="/screenshots/showcase/01-home.jpg" alt="Home — your Step 2 CK cockpit" loading="lazy" />
          <img src="/screenshots/showcase/05-results.jpg" alt="Run summary — every round scored to the accuracy ring" loading="lazy" />
          <img src="/screenshots/showcase/02-cases.jpg" alt="Case Missions — work the wards" loading="lazy" />
          <img src="/screenshots/showcase/03-caseplay.jpg" alt="Case play — reason it out, beat by beat" loading="lazy" />
          <img src="/screenshots/showcase/04-path.jpg" alt="Skill-tree paths — Step 2 CK mapped like a game" loading="lazy" />
          <img src="/screenshots/showcase/09-league.jpg" alt="Weekly leagues — promotion and relegation" loading="lazy" />
          <img src="/screenshots/showcase/06-profile.jpg" alt="Profile — 30-day consistency heatmap" loading="lazy" />
          <img src="/screenshots/showcase/07-share.jpg" alt="Share cards — flex the streak" loading="lazy" />
          <img src="/screenshots/showcase/08-pimping.jpg" alt="Pimp Me — Socratic rounds in private" loading="lazy" />
          <img src="/screenshots/showcase/10-pro.jpg" alt="Step Gunner Pro" loading="lazy" />
        </div>
      </div>

      {/* FEATURES */}
      <div className="features" id="features">
        <div className="features-inner">
          <div className="features-header">
            <div className="eyebrow">Everything you need</div>
            <h2>Built for how gunners actually study</h2>
            <p>Smart tools that turn the Step 2 grind into a streak you don&apos;t want to break.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🩺</div>
              <h3>Case Missions</h3>
              <p>Work 36 clinical cases across 11 services, from presentation to disposition. Reason it out beat by beat. Nail the call and the management for honors.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Scored to the Ring</h3>
              <p>Every round ends on one clean accuracy ring, with your misses surfaced first so you fix what actually moves the needle.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Weekly Leagues</h3>
              <p>Promotion and relegation, reset every Monday. Top three move up, bottom three drop. No coasting.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>Smart Spaced Repetition</h3>
              <p>A Leitner box system that brings back what you miss and retires what you&apos;ve mastered into long-term review.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏅</div>
              <h3>CK Gold Questions</h3>
              <p>High-yield clinical vignettes across 15 specialties, each with the explanation, the common trap, and a memory hook.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Pimp Me &middot; Socratic Rounds</h3>
              <p>Private rounds with a virtual attending. Miss one and it asks the follow-up. Recognition &rarr; management &rarr; complications, nobody watching.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Don&apos;t Miss a Day</h3>
              <p>A 30-day consistency heatmap plus your weak systems. Tap any day to see exactly what you did.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📲</div>
              <h3>Shareable Progress</h3>
              <p>Turn a perfect round or a long streak into a story-style card worth sending to the group chat.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Rapid Fire</h3>
              <p>Twenty questions, two minutes. Exam-day time pressure with speed-bonus XP for fast answers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item"><div className="num">1,400+</div><div className="label">Practice Questions</div></div>
          <div className="stat-item"><div className="num">36</div><div className="label">Clinical Cases</div></div>
          <div className="stat-item"><div className="num">15</div><div className="label">Specialties</div></div>
          <div className="stat-item"><div className="num">22</div><div className="label">Achievements</div></div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section" id="download">
        <div className="cta-inner">
          <h2>Ready to start gunning?</h2>
          <p>Free to start. Clinical case missions, Socratic rounds, weekly leagues, and the question bank that doesn&apos;t suck.</p>
          <a href={APP} onClick={copyRef} className="btn-store"><svg className="apple" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg> Download on the App Store</a>
          <p className="hero-sub">iOS 17+ &middot; WORKS OFFLINE &middot; KEEP GUNNING</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div>
            <Wordmark size={18} />
            <p className="footer-tagline">USMLE Step 2 CK prep that doesn&apos;t suck. Built by Rezumab LLC &middot; Texas, USA.</p>
          </div>
          <div>
            <div className="footer-heading">App</div>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href={APP} onClick={copyRef}>Download</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Use</a></li>
              <li><a href="/support">Support</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-heading">Company</div>
            <ul className="footer-links">
              <li><a href="https://rezumab.app">Rezumab</a></li>
              <li><a href="mailto:rezumab.med@gmail.com">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 Rezumab LLC. All rights reserved.</span>
          <span>rezumab.med@gmail.com</span>
        </div>
      </footer>
    </>
  );
}
