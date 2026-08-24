import Head from 'next/head';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

// Shared dark "terminal" chrome for the legal / support pages, matching the
// landing page and the iOS app: ● STEP GUNNER wordmark (SF Mono), near-black
// surfaces, mono labels, accent green/blue. Pages pass only their content.
export default function DocLayout({
  title, subtitle, metaTitle, metaDesc, children,
}: {
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDesc: string;
  children: ReactNode;
}) {
  // Self-referential canonical off the route, so every page through this layout
  // gets one without each having to remember. Query strings are dropped: a
  // legal page is the same document however it was linked.
  const canonical = `https://stepgunner.com${useRouter().pathname}`;

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={canonical} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          /* Score Report register (light): shared with /readiness, /research, guides */
          --bg: #faf9f6; --bg-2: #ffffff;
          --panel: #ffffff; --hair: rgba(25,28,35,0.10); --hair-strong: rgba(25,28,35,0.17);
          --ink: #191c23; --ink-dim: #5d6470; --ink-faint: #9aa0ab;
          --green: #0d9448; --green-glow: rgba(13,148,72,0.14);
          --blue: #2f6fed; --blue-glow: rgba(47,111,237,0.14); --gold: #e08e00;
          --mono: ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, monospace;
          --sans: 'DM Sans', -apple-system, system-ui, sans-serif;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: var(--sans); color: var(--ink); background: var(--bg); -webkit-font-smoothing: antialiased; }
        a { color: var(--blue); text-decoration: none; }
        a:hover { text-decoration: underline; }
        ::selection { background: var(--blue); color: #fff; }

        /* wordmark */
        .wm { display: inline-flex; align-items: center; gap: 7px; font-family: var(--mono); font-weight: 700; letter-spacing: 2.5px; line-height: 1; white-space: nowrap; font-size: 18px; }
        .wm-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green-glow); }
        .wm-step { color: var(--blue); }
        .wm-gun { color: var(--ink); font-weight: 500; opacity: 0.9; }

        /* nav */
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(250,249,246,0.82); backdrop-filter: blur(14px); border-bottom: 1px solid var(--hair); padding: 0 40px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .nav-back { font-family: var(--mono); font-size: 11px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--ink-dim); }
        .nav-back:hover { color: var(--ink); text-decoration: none; }

        /* hero bar */
        .hero-bar { position: relative; margin-top: 64px; padding: 70px 40px 52px; overflow: hidden; border-bottom: 1px solid var(--hair); }
        .hero-bar::before { content: ''; position: absolute; inset: 0; background: radial-gradient(620px 240px at 30% -20%, var(--blue-glow), transparent 65%), radial-gradient(420px 220px at 70% 0%, var(--green-glow), transparent 65%); pointer-events: none; }
        .hero-bar-inner { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; }
        .hero-bar .app-badge { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--green); border: 1px solid rgba(70,216,119,0.3); background: rgba(70,216,119,0.06); padding: 5px 14px; border-radius: 999px; margin-bottom: 18px; }
        .hero-bar h1 { font-size: 44px; font-weight: 800; letter-spacing: -1.4px; color: var(--ink); margin-bottom: 10px; }
        .hero-bar .sub { font-family: var(--mono); font-size: 12px; letter-spacing: 0.5px; color: var(--ink-faint); }

        /* content / prose */
        .content { max-width: 760px; margin: 0 auto; padding: 56px 40px 100px; }
        .content h2 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: var(--ink); margin-top: 46px; margin-bottom: 14px; }
        .content h2:first-child { margin-top: 0; }
        .content h3 { font-size: 17px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
        .content p { color: var(--ink-dim); line-height: 1.8; font-size: 15.5px; margin-bottom: 15px; }
        .content ul { margin-left: 22px; margin-bottom: 16px; }
        .content li { color: var(--ink-dim); line-height: 1.8; font-size: 15.5px; margin-bottom: 7px; }
        .content li::marker { color: var(--green); }
        .content strong { color: var(--ink); font-weight: 700; }

        .highlight-box { background: rgba(70,216,119,0.06); border: 1px solid rgba(70,216,119,0.18); border-left: 3px solid var(--green); border-radius: 0 12px 12px 0; padding: 22px 26px; margin-bottom: 42px; }
        .highlight-box strong { display: block; color: var(--ink); font-size: 16px; margin-bottom: 8px; }
        .highlight-box p { color: var(--ink-dim); font-size: 14.5px; line-height: 1.65; margin-bottom: 0; }
        .contact-box { background: var(--panel); border: 1px solid var(--hair); border-radius: 16px; padding: 28px; margin-top: 44px; }
        .contact-box h2 { margin-top: 0; }
        .faq-item { margin-bottom: 28px; }

        /* footer */
        footer { background: var(--bg-2); border-top: 1px solid var(--hair); color: var(--ink-dim); padding: 52px 40px 34px; }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 56px; padding-bottom: 38px; border-bottom: 1px solid var(--hair); }
        .footer-tagline { font-size: 14px; line-height: 1.7; color: var(--ink-faint); margin-top: 14px; max-width: 280px; }
        .footer-heading { font-family: var(--mono); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; color: var(--ink-faint); margin-bottom: 18px; }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .footer-links a { color: var(--ink-dim); font-size: 14px; }
        .footer-links a:hover { color: var(--ink); text-decoration: none; }
        .footer-bottom { max-width: 1100px; margin: 0 auto; padding-top: 28px; display: flex; justify-content: space-between; align-items: center; font-family: var(--mono); font-size: 11px; letter-spacing: 0.5px; color: var(--ink-faint); }

        @media (max-width: 768px) {
          nav { padding: 0 18px; }
          .hero-bar { padding: 56px 20px 40px; }
          .hero-bar h1 { font-size: 32px; }
          .content { padding: 40px 20px 80px; }
          .footer-inner { grid-template-columns: 1fr; gap: 32px; }
          .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      <nav>
        <a href="/" style={{ display: 'inline-flex' }}>
          <span className="wm"><span className="wm-dot" /><span className="wm-step">STEP</span><span className="wm-gun">GUNNER</span></span>
        </a>
        <a href="/" className="nav-back">&larr; Back to Home</a>
      </nav>

      <div className="hero-bar">
        <div className="hero-bar-inner">
          <div className="app-badge">USMLE Step 2 CK</div>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
        </div>
      </div>

      <div className="content">{children}</div>

      <footer>
        <div className="footer-inner">
          <div>
            <span className="wm"><span className="wm-dot" /><span className="wm-step">STEP</span><span className="wm-gun">GUNNER</span></span>
            <p className="footer-tagline">USMLE Step 2 CK prep that doesn&apos;t suck. Built by Rezumab LLC &middot; Texas, USA.</p>
          </div>
          <div>
            <div className="footer-heading">App</div>
            <ul className="footer-links">
              <li><a href="/guides">Clerkship Guides</a></li>
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
