import Head from 'next/head';

export default function Support() {
  return (
    <>
      <Head>
        <title>Support — Step Gunner | Rezumab LLC</title>
        <meta name="description" content="Get help with Step Gunner. Contact our support team." />
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
        h2 { font-family: 'DM Serif Display', serif; font-size: 26px; color: var(--text); margin-top: 48px; margin-bottom: 16px; }
        h2:first-child { margin-top: 0; }
        p { color: var(--text-dim); line-height: 1.8; font-size: 16px; margin-bottom: 16px; }
        ul { margin-left: 24px; margin-bottom: 16px; }
        li { color: var(--text-dim); line-height: 1.8; font-size: 16px; margin-bottom: 6px; }
        .contact-box { background: var(--off-white); border: 1px solid var(--border); border-radius: 16px; padding: 32px; margin-top: 32px; }
        .contact-box h2 { margin-top: 0; }
        .faq-item { margin-bottom: 32px; }
        .faq-item h3 { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
        .faq-item p { margin-bottom: 8px; }

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
        <a href="/" className="nav-back">&larr; Back to Home</a>
      </nav>

      <div className="hero-bar">
        <div className="hero-bar-inner">
          <div className="app-badge">GUNNER CK</div>
          <h1>Support</h1>
          <p>We&apos;re here to help</p>
        </div>
      </div>

      <div className="content">
        <div className="contact-box">
          <h2>Contact Us</h2>
          <p>Have a question, found a bug, or need help with your account? Reach out and we&apos;ll get back to you as soon as possible.</p>
          <p>
            <strong>Email:</strong> <a href="mailto:rezumab.med@gmail.com">rezumab.med@gmail.com</a><br />
            <strong>Company:</strong> Rezumab LLC<br />
            <strong>Location:</strong> Texas, USA
          </p>
          <p>We typically respond within 24 hours.</p>
        </div>

        <h2>Frequently Asked Questions</h2>

        <div className="faq-item">
          <h3>How do I cancel my subscription?</h3>
          <p>Go to <strong>Settings &gt; Apple ID &gt; Subscriptions</strong> on your iPhone. Find Step Gunner Pro and tap Cancel Subscription. You&apos;ll retain access until the end of your current billing period.</p>
        </div>

        <div className="faq-item">
          <h3>How do I restore my purchase on a new device?</h3>
          <p>Open the app, tap any locked section to open the paywall, then tap <strong>Restore Purchase</strong> at the bottom. Make sure you&apos;re signed in with the same Apple ID used for the original purchase.</p>
        </div>

        <div className="faq-item">
          <h3>How do I delete my account?</h3>
          <p>Go to <strong>Profile &gt; Delete Account</strong> at the bottom of the Profile tab. This permanently removes all your data from our servers. This action cannot be undone.</p>
        </div>

        <div className="faq-item">
          <h3>I found an incorrect question. How do I report it?</h3>
          <p>During a quiz, tap the <strong>flag icon</strong> on any question to submit a report. Include the reason and any notes. We review all reports and update questions regularly.</p>
        </div>

        <div className="faq-item">
          <h3>Does the app work offline?</h3>
          <p>Yes. All questions are stored on your device. You can study without an internet connection. Progress syncs to the cloud when you&apos;re back online.</p>
        </div>

        <div className="faq-item">
          <h3>What devices are supported?</h3>
          <p>Step Gunner requires an iPhone running iOS 17 or later.</p>
        </div>
      </div>

      <footer>
        <div className="footer-inner">
          <div>
            <div className="footer-brand">Step<span>Gunner</span></div>
            <p className="footer-tagline">USMLE Step 2 CK prep that doesn&apos;t suck.<br />Built by Rezumab LLC &middot; Texas, USA.</p>
          </div>
          <div>
            <div className="footer-heading">App</div>
            <ul className="footer-links">
              <li><a href="/#features">Features</a></li>
              <li><a href="/#download">Download</a></li>
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
