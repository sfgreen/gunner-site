import Head from 'next/head';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — Step Gunner | Rezumab LLC</title>
        <meta name="description" content="Privacy Policy for Step Gunner by Rezumab LLC. Your study data stays on your device." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          --green: #58cc02; --green-dark: #46a302; --green-glow: rgba(88,204,2,0.15);
          --bg: #fafbfc; --text: #1e2030; --text-dim: #6b7c93;
          --card: #ffffff; --border: #e8eff5; --off-white: #f4f8fb;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; color: var(--text); background: var(--card); }
        a { color: var(--green-dark); text-decoration: none; }
        a:hover { text-decoration: underline; }

        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 0 40px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nav-brand .icon { font-size: 28px; }
        .nav-brand .name { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text); }
        .nav-brand .name span { color: var(--green); }
        .nav-back { font-size: 14px; color: var(--green-dark); font-weight: 500; }

        .hero-bar { background: linear-gradient(135deg, #1a2a1a, #2d4a2d); padding: 80px 40px 60px; margin-top: 64px; }
        .hero-bar-inner { max-width: 760px; margin: 0 auto; }
        .hero-bar .app-badge { display: inline-block; background: var(--green); color: white; font-size: 13px; font-weight: 700; padding: 5px 16px; border-radius: 20px; margin-bottom: 16px; letter-spacing: 1px; }
        .hero-bar h1 { font-family: 'DM Serif Display', serif; font-size: 42px; color: white; margin-bottom: 8px; }
        .hero-bar p { color: rgba(255,255,255,0.6); font-size: 15px; }

        .content { max-width: 760px; margin: 0 auto; padding: 60px 40px 100px; }
        .highlight-box { background: #eef9e6; border-left: 4px solid var(--green); border-radius: 0 12px 12px 0; padding: 24px 28px; margin-bottom: 48px; }
        .highlight-box strong { display: block; color: var(--text); font-size: 17px; margin-bottom: 8px; }
        .highlight-box p { color: var(--text-dim); font-size: 15px; line-height: 1.6; }
        h2 { font-family: 'DM Serif Display', serif; font-size: 26px; color: var(--text); margin-top: 48px; margin-bottom: 16px; }
        p { color: var(--text-dim); line-height: 1.8; font-size: 16px; margin-bottom: 16px; }
        ul { margin-left: 24px; margin-bottom: 16px; }
        li { color: var(--text-dim); line-height: 1.8; font-size: 16px; margin-bottom: 6px; }
        .contact-box { background: var(--off-white); border: 1px solid var(--border); border-radius: 16px; padding: 32px; margin-top: 48px; }
        .contact-box h2 { margin-top: 0; }

        footer { background: #0f172a; color: rgba(255,255,255,0.6); padding: 60px 40px; }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .footer-brand { font-family: 'DM Serif Display', serif; font-size: 24px; color: white; margin-bottom: 12px; }
        .footer-brand span { color: var(--green); }
        .footer-tagline { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.4); }
        .footer-heading { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.35); margin-bottom: 20px; }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .footer-links a { color: rgba(255,255,255,0.6); font-size: 14px; text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: white; text-decoration: none; }
        .footer-bottom { max-width: 1100px; margin: 0 auto; padding-top: 32px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }

        @media (max-width: 768px) {
          nav { padding: 0 20px; }
          .hero-bar { padding: 80px 20px 48px; }
          .hero-bar h1 { font-size: 32px; }
          .content { padding: 40px 20px 80px; }
          .footer-inner { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      <nav>
        <a href="/" className="nav-brand">
          <span className="icon">🎯</span>
          <span className="name">Step<span>Gunner</span></span>
        </a>
        <a href="/" className="nav-back">← Back to Home</a>
      </nav>

      <div className="hero-bar">
        <div className="hero-bar-inner">
          <div className="app-badge">GUNNER CK</div>
          <h1>Privacy Policy</h1>
          <p>Step Gunner by Rezumab LLC &nbsp;·&nbsp; Effective March 2026</p>
        </div>
      </div>

      <div className="content">
        <div className="highlight-box">
          <strong>The short version: Your study data stays on your device.</strong>
          <p>Step Gunner is a USMLE Step 2 CK study app. All quiz progress, scores, and study history are stored locally on your iPhone. We don&apos;t collect personal information or track your usage.</p>
        </div>

        <h2>Overview</h2>
        <p>Step Gunner is a medical education quiz application developed by Rezumab LLC. It helps medical students prepare for the USMLE Step 2 CK exam through gamified flashcard-based learning with spaced repetition. This policy describes our data practices.</p>

        <h2>Information Stored on Your Device</h2>
        <p>The following data is stored locally on your device only:</p>
        <ul>
          <li>Quiz scores, accuracy, and streak data</li>
          <li>Spaced repetition progress and mastery levels</li>
          <li>XP totals and achievement badges</li>
          <li>Category performance breakdown</li>
          <li>Question reports you submit</li>
          <li>Theme preference (light/dark mode)</li>
        </ul>
        <p>This data never leaves your device except as described in the &ldquo;Question Reports&rdquo; section below.</p>

        <h2>Information We Do Not Collect</h2>
        <p>Step Gunner does not collect, store, or transmit any of the following:</p>
        <ul>
          <li>Personal information (name, email, phone number, address)</li>
          <li>Device identifiers or advertising IDs</li>
          <li>Location data</li>
          <li>Usage analytics or behavioral tracking</li>
          <li>Crash reports or diagnostic data</li>
          <li>Cookies or tracking technologies of any kind</li>
        </ul>

        <h2>Question Reports</h2>
        <p>When you flag a question using the in-app report feature, the following information is sent to our server to help us improve question quality:</p>
        <ul>
          <li>The question text (truncated to 200 characters)</li>
          <li>The correct answer and your selected answer</li>
          <li>The answer choices shown</li>
          <li>The category and question ID</li>
          <li>Your reason for reporting and optional notes</li>
          <li>A timestamp of when the report was submitted</li>
        </ul>
        <p>No personal identifiers are attached to these reports. They are used solely to identify and fix incorrect or unclear questions. Reports are transmitted via HTTPS to our secure server endpoint.</p>

        <h2>Third-Party Services</h2>
        <p>Step Gunner does not integrate with any third-party analytics platforms, advertising networks, or social media SDKs. The app functions entirely offline except for the optional question report feature.</p>

        <h2>Data Retention</h2>
        <p>All study data is stored on your device using Apple&apos;s local storage APIs. Deleting the app permanently removes all data. Question reports sent to our server are retained only as long as needed to review and improve question quality.</p>

        <h2>Children&apos;s Privacy</h2>
        <p>Step Gunner is designed for medical students and healthcare professionals. It is not directed at children under 13, and we do not knowingly collect information from anyone under 13.</p>

        <h2>Medical Disclaimer</h2>
        <p>Step Gunner is for educational purposes only. It is not a substitute for medical education, clinical training, or professional medical advice. Always consult authoritative medical resources and supervising physicians for clinical decision-making.</p>

        <h2>Changes to This Policy</h2>
        <p>If we update this privacy policy, changes will be posted on this page with an updated date.</p>

        <div className="contact-box">
          <h2>Contact Us</h2>
          <p>Questions about this Privacy Policy or Step Gunner?</p>
          <p>
            <strong>Email:</strong> <a href="mailto:rezumab.med@gmail.com">rezumab.med@gmail.com</a><br />
            <strong>Company:</strong> Rezumab LLC<br />
            <strong>State:</strong> Texas, USA
          </p>
        </div>
      </div>

      <footer>
        <div className="footer-inner">
          <div>
            <div className="footer-brand">Step<span>Gunner</span></div>
            <p className="footer-tagline">USMLE Step 2 CK prep that doesn&apos;t suck.<br />Built by Rezumab LLC · Texas, USA.</p>
          </div>
          <div>
            <div className="footer-heading">App</div>
            <ul className="footer-links">
              <li><a href="/#features">Features</a></li>
              <li><a href="/#download">Download</a></li>
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
