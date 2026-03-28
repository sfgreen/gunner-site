import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Gunner CK — USMLE Step 2 CK Prep</title>
        <meta name="description" content="Gunner CK is a gamified USMLE Step 2 CK study app with spaced repetition, clinical vignettes, and High Yield Step 2 CK GOLD questions. Built by a med student, for med students." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="Gunner CK — USMLE Step 2 CK Prep" />
        <meta property="og:description" content="Gamified Step 2 CK prep with spaced repetition, clinical vignettes, and CK GOLD questions." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gunner.rezumab.app" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          --green: #58cc02; --green-dark: #46a302; --green-glow: rgba(88,204,2,0.15);
          --gold: #ffc800; --blue: #1cb0f6; --red: #ff4b4b;
          --purple: #af52ff; --orange: #ff9632;
          --bg: #fafbfc; --bg-dark: #131420;
          --text: #1e2030; --text-dim: #6b7c93;
          --card: #ffffff; --border: #e8eff5;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; color: var(--text); background: var(--bg); }
        a { color: inherit; text-decoration: none; }

        /* NAV */
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 0 40px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .nav-brand { display: flex; align-items: center; gap: 10px; }
        .nav-brand .icon { font-size: 28px; }
        .nav-brand .name { font-family: 'DM Serif Display', serif; font-size: 22px; }
        .nav-brand .name span { color: var(--green); }
        .nav-links { display: flex; gap: 32px; align-items: center; }
        .nav-links a { font-size: 14px; font-weight: 600; color: var(--text-dim); transition: color 0.2s; }
        .nav-links a:hover { color: var(--text); }
        .nav-cta { background: var(--green); color: white !important; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 700; transition: transform 0.2s, box-shadow 0.2s; }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 4px 16px var(--green-glow); }

        /* HERO */
        .hero { padding: 140px 40px 100px; text-align: center; background: linear-gradient(180deg, var(--bg) 0%, white 100%); position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; top: 80px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, var(--green-glow) 0%, transparent 70%); pointer-events: none; }
        .hero-badge { display: inline-block; background: var(--green-glow); color: var(--green-dark); font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 20px; margin-bottom: 24px; letter-spacing: 1px; text-transform: uppercase; }
        .hero h1 { font-family: 'DM Serif Display', serif; font-size: 56px; line-height: 1.1; margin-bottom: 20px; max-width: 700px; margin-left: auto; margin-right: auto; }
        .hero h1 span { color: var(--green); }
        .hero p { font-size: 20px; color: var(--text-dim); max-width: 560px; margin: 0 auto 40px; line-height: 1.6; }
        .hero-cta { display: inline-flex; align-items: center; gap: 10px; background: var(--green); color: white; font-size: 18px; font-weight: 700; padding: 16px 36px; border-radius: 16px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 20px var(--green-glow); }
        .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--green-glow); }
        .hero-sub { font-size: 14px; color: var(--text-dim); margin-top: 16px; }

        /* PHONE MOCKUP */
        .phone-section { display: flex; justify-content: center; margin-top: -20px; padding: 0 40px 80px; }
        .phone-frame { width: 280px; height: 560px; background: var(--bg-dark); border-radius: 36px; border: 4px solid #2a2a3a; box-shadow: 0 20px 60px rgba(0,0,0,0.15); display: flex; flex-direction: column; align-items: center; padding: 20px 16px; overflow: hidden; position: relative; }
        .phone-notch { width: 120px; height: 28px; background: black; border-radius: 0 0 16px 16px; position: absolute; top: 0; }
        .phone-content { margin-top: 36px; width: 100%; }
        .phone-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .phone-stat { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; }
        .phone-stat.fire { color: var(--orange); }
        .phone-stat.xp { color: var(--gold); }
        .phone-stat.heart { color: var(--red); }
        .phone-modes { display: flex; gap: 8px; margin-bottom: 16px; }
        .phone-mode { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 8px; text-align: center; }
        .phone-mode .emoji { font-size: 18px; }
        .phone-mode .label { font-size: 11px; color: white; font-weight: 600; margin-top: 4px; }
        .phone-mode .sub { font-size: 9px; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .phone-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; }
        .phone-card-icon { font-size: 24px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
        .phone-card-text .title { font-size: 13px; color: white; font-weight: 700; }
        .phone-card-text .desc { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; }

        /* FEATURES */
        .features { padding: 100px 40px; background: white; }
        .features-inner { max-width: 1100px; margin: 0 auto; }
        .features-header { text-align: center; margin-bottom: 64px; }
        .features-header h2 { font-family: 'DM Serif Display', serif; font-size: 40px; margin-bottom: 16px; }
        .features-header p { font-size: 18px; color: var(--text-dim); max-width: 500px; margin: 0 auto; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .feature-card { background: var(--bg); border: 1px solid var(--border); border-radius: 20px; padding: 32px; transition: transform 0.2s, box-shadow 0.2s; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.06); }
        .feature-icon { font-size: 36px; margin-bottom: 16px; }
        .feature-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .feature-card p { font-size: 14px; color: var(--text-dim); line-height: 1.7; }

        /* STATS BAR */
        .stats-bar { padding: 80px 40px; background: linear-gradient(135deg, #1a2a1a 0%, #2d4a2d 100%); }
        .stats-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center; }
        .stat-item .num { font-family: 'DM Serif Display', serif; font-size: 44px; color: var(--green); }
        .stat-item .label { font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 8px; font-weight: 500; }

        /* CTA SECTION */
        .cta-section { padding: 100px 40px; text-align: center; background: var(--bg); }
        .cta-section h2 { font-family: 'DM Serif Display', serif; font-size: 40px; margin-bottom: 16px; }
        .cta-section p { font-size: 18px; color: var(--text-dim); margin-bottom: 40px; max-width: 480px; margin-left: auto; margin-right: auto; }

        /* FOOTER */
        footer { background: #0f172a; color: rgba(255,255,255,0.6); padding: 60px 40px; }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .footer-brand { font-family: 'DM Serif Display', serif; font-size: 24px; color: white; margin-bottom: 12px; }
        .footer-brand span { color: var(--green); }
        .footer-tagline { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.4); }
        .footer-heading { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.35); margin-bottom: 20px; }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .footer-links a { color: rgba(255,255,255,0.6); font-size: 14px; transition: color 0.2s; }
        .footer-links a:hover { color: white; }
        .footer-bottom { max-width: 1100px; margin: 0 auto; padding-top: 32px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }

        @media (max-width: 768px) {
          nav { padding: 0 20px; }
          .nav-links { display: none; }
          .hero { padding: 120px 20px 60px; }
          .hero h1 { font-size: 36px; }
          .hero p { font-size: 16px; }
          .features { padding: 60px 20px; }
          .features-grid { grid-template-columns: 1fr; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .stat-item .num { font-size: 32px; }
          .cta-section { padding: 60px 20px; }
          .footer-inner { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
          .phone-section { padding: 0 20px 60px; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="nav-brand">
          <span className="icon">🎯</span>
          <span className="name">Gunner<span>CK</span></span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="/privacy">Privacy</a>
          <a href="mailto:rezumab.med@gmail.com">Contact</a>
          <a href="#download" className="nav-cta">Download</a>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-badge">🔥 USMLE Step 2 CK</div>
        <h1>Study smarter. <span>Score higher.</span></h1>
        <p>Gamified Step 2 CK prep with spaced repetition, clinical vignettes, and High Yield Step 2 CK GOLD — built by a med student who gets it.</p>
        <a href="#download" className="hero-cta">
          <span>📱</span> Coming to the App Store
        </a>
        <p className="hero-sub">Free · iOS · No account required</p>
      </div>

      {/* PHONE MOCKUP */}
      <div className="phone-section">
        <div className="phone-frame">
          <div className="phone-notch" />
          <div className="phone-content">
            <div className="phone-header">
              <span className="phone-stat fire">🔥 7</span>
              <span style={{color: 'white', fontWeight: 800, fontSize: 14, letterSpacing: 1}}>GUNNER <span style={{color: 'rgba(255,255,255,0.5)', fontWeight: 500}}>CK</span></span>
              <span className="phone-stat xp">⚡ 1,240</span>
            </div>
            <div className="phone-modes">
              <div className="phone-mode">
                <div className="emoji">⚡</div>
                <div className="label">Rapid Fire</div>
                <div className="sub">20 cards, 2 min</div>
              </div>
              <div className="phone-mode">
                <div className="emoji">🎯</div>
                <div className="label">Weak Spots</div>
                <div className="sub">12 to review</div>
              </div>
            </div>
            <div className="phone-card">
              <div className="phone-card-icon" style={{background: 'rgba(88,204,2,0.15)'}}>📝</div>
              <div className="phone-card-text">
                <div className="title">Buzzwords</div>
                <div className="desc">Pure recall · 224 cards</div>
              </div>
            </div>
            <div className="phone-card">
              <div className="phone-card-icon" style={{background: 'rgba(28,176,246,0.15)'}}>🏥</div>
              <div className="phone-card-text">
                <div className="title">Next Best Step</div>
                <div className="desc">Clinical vignettes · 120 cards</div>
              </div>
            </div>
            <div className="phone-card">
              <div className="phone-card-icon" style={{background: 'rgba(255,200,0,0.15)'}}>🏆</div>
              <div className="phone-card-text">
                <div className="title">CK Gold</div>
                <div className="desc">Step 2 CK GOLD · 320 cards</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="features" id="features">
        <div className="features-inner">
          <div className="features-header">
            <h2>Everything you need to crush CK</h2>
            <p>No fluff. No $400 subscriptions. Just the content that actually shows up on exam day.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>Spaced Repetition</h3>
              <p>Leitner box system automatically resurfaces cards you struggle with. Master it once, move on. Forget it, see it again.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏥</div>
              <h3>Clinical Vignettes</h3>
              <p>Real-world patient scenarios with next-best-step management questions. Organized by specialty — cardio, pulm, OB, surgery, and more.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>CK Gold Questions</h3>
              <p>High Yield Step 2 CK GOLD questions that mirror actual exam content. Each one includes the teaching point, the trap, and a memory hook.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Rapid Fire Mode</h3>
              <p>20 questions, 2 minutes. Perfect for quick study sessions between rotations. Speed bonus XP for fast answers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Weakness Targeting</h3>
              <p>Smart algorithm identifies your weakest categories and drills them. Stop wasting time on what you already know.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔥</div>
              <h3>Streaks & XP</h3>
              <p>Daily goals, streak tracking, XP system, and achievements. The same psychology that makes Duolingo addictive — applied to medicine.</p>
            </div>
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item">
            <div className="num">500+</div>
            <div className="label">Practice Questions</div>
          </div>
          <div className="stat-item">
            <div className="num">15</div>
            <div className="label">Specialties Covered</div>
          </div>
          <div className="stat-item">
            <div className="num">3</div>
            <div className="label">Study Modes</div>
          </div>
          <div className="stat-item">
            <div className="num">100%</div>
            <div className="label">Free, No Ads</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section" id="download">
        <h2>Ready to start gunning?</h2>
        <p>Join the beta. Free, no account required. Just open and start drilling.</p>
        <a href="#" className="hero-cta">
          <span>🍎</span> Coming Soon on TestFlight
        </a>
        <p className="hero-sub" style={{marginTop: 16}}>iOS 17+ required · Works offline</p>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div>
            <div className="footer-brand">Gunner<span>CK</span></div>
            <p className="footer-tagline">USMLE Step 2 CK prep that doesn&apos;t suck.<br />Built by Rezumab LLC · Texas, USA.</p>
          </div>
          <div>
            <div className="footer-heading">App</div>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#download">Download</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
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
          <span>© 2026 Rezumab LLC. All rights reserved.</span>
          <span>rezumab.med@gmail.com</span>
        </div>
      </footer>
    </>
  );
}
