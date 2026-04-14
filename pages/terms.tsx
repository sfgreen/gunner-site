import Head from 'next/head';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Use — Step Gunner | Rezumab LLC</title>
        <meta name="description" content="Terms of Use for Step Gunner by Rezumab LLC." />
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
        <a href="/" className="nav-back">&larr; Back to Home</a>
      </nav>

      <div className="hero-bar">
        <div className="hero-bar-inner">
          <div className="app-badge">GUNNER CK</div>
          <h1>Terms of Use</h1>
          <p>Step Gunner by Rezumab LLC &nbsp;&middot;&nbsp; Effective April 2026</p>
        </div>
      </div>

      <div className="content">
        <h2>Acceptance of Terms</h2>
        <p>By downloading, installing, or using Step Gunner (&quot;the App&quot;), you agree to be bound by these Terms of Use. If you do not agree to these terms, do not use the App.</p>

        <h2>Description of Service</h2>
        <p>Step Gunner is a mobile educational application designed to help medical students prepare for the USMLE Step 2 CK examination. The App provides quiz-based study tools, spaced repetition, and AI-powered explanations.</p>

        <h2>Subscriptions</h2>
        <p>Step Gunner offers auto-renewable subscription plans:</p>
        <ul>
          <li><strong>Step Gunner Pro Monthly</strong> &mdash; $5.99/month</li>
          <li><strong>Step Gunner Pro Yearly</strong> &mdash; $49.99/year</li>
        </ul>
        <p>Subscriptions include a 7-day free trial for new subscribers. Payment is charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period at the same price.</p>
        <p>You can manage and cancel your subscriptions by going to your App Store account settings after purchase.</p>

        <h2>Account Registration</h2>
        <p>You must sign in with Google or Apple to use the App. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to provide accurate information during registration.</p>

        <h2>Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Reproduce, distribute, or share the App&apos;s question content outside the App</li>
          <li>Reverse engineer, decompile, or disassemble the App</li>
          <li>Use the App for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to the App&apos;s systems or other users&apos; accounts</li>
          <li>Use automated systems or bots to interact with the App</li>
        </ul>

        <h2>Intellectual Property</h2>
        <p>All content in the App, including questions, explanations, graphics, and software, is the property of Rezumab LLC and is protected by copyright and intellectual property laws. You may not reproduce, modify, or distribute any content from the App without prior written consent.</p>

        <h2>Medical Disclaimer</h2>
        <p>Step Gunner is for educational purposes only. The App does not provide medical advice, diagnoses, or treatment recommendations. It is not a substitute for medical education, clinical training, or professional medical advice. Always consult authoritative medical resources and supervising physicians for clinical decision-making. Rezumab LLC is not responsible for any clinical decisions made based on content in the App.</p>

        <h2>AI-Generated Content</h2>
        <p>The App includes AI-powered explanations generated on-device using Apple Foundation Models. These explanations are generated dynamically and may contain inaccuracies. They are intended as supplementary study aids and should not be relied upon as the sole source of medical knowledge.</p>

        <h2>Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Rezumab LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the App. The App is provided &quot;as is&quot; without warranties of any kind, either express or implied.</p>

        <h2>Account Termination</h2>
        <p>We reserve the right to suspend or terminate your account if you violate these Terms of Use. You may delete your account at any time from the Profile tab in the App, which will permanently remove your data from our servers.</p>

        <h2>Changes to Terms</h2>
        <p>We may update these Terms of Use from time to time. Changes will be posted on this page with an updated effective date. Continued use of the App after changes constitutes acceptance of the new terms.</p>

        <h2>Governing Law</h2>
        <p>These Terms of Use are governed by the laws of the State of Texas, United States, without regard to conflict of law principles.</p>

        <div className="contact-box">
          <h2>Contact Us</h2>
          <p>Questions about these Terms of Use?</p>
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
            <p className="footer-tagline">USMLE Step 2 CK prep that doesn&apos;t suck.<br />Built by Rezumab LLC &middot; Texas, USA.</p>
          </div>
          <div>
            <div className="footer-heading">App</div>
            <ul className="footer-links">
              <li><a href="/#features">Features</a></li>
              <li><a href="/#download">Download</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Use</a></li>
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
