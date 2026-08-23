import Head from 'next/head';
import Link from 'next/link';
import { ReactNode } from 'react';
import { appStoreUrl, track } from '../lib/analytics';

// The lab-memo LIGHT register shared by the tool pages (/readiness is the
// reference; /research/* and /readiness/methodology sit on this). Paper
// background, ink text, green/gold/blue accents, mono labels. The homepage is
// the only dark surface; the ink "pitch" band is the one allowed bridge.
export default function LabLayout({
  title, eyebrow, lede, crumb, metaTitle, metaDesc, campaign, children, head, maxWidth = 720,
}: {
  title: string;
  eyebrow?: string;
  lede?: ReactNode;
  crumb?: { href: string; label: string }[];
  metaTitle: string;
  metaDesc: string;
  campaign: string;           // ct= for the nav store button
  children: ReactNode;
  head?: ReactNode;
  maxWidth?: number;
}) {
  const store = appStoreUrl(campaign);
  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#faf9f6" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        {head}
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
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { font-family: var(--sans); color: var(--ink); background: var(--bg); -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
        ::selection { background: var(--gold); color: #fff; }
      `}</style>
      <style jsx>{`
        .page { min-height: 100vh; background:
          radial-gradient(90% 55% at 50% -8%, rgba(13,148,72,0.08), transparent 60%),
          radial-gradient(56% 22% at 50% 0%, rgba(240,180,41,0.13), transparent 62%), var(--bg); }
        .nav { display: flex; align-items: center; justify-content: space-between; max-width: ${maxWidth}px; margin: 0 auto; padding: 20px 22px; }
        .wm { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-weight: 700; letter-spacing: 2.5px; font-size: 14px; }
        .wm .wt b.g { color: var(--green); font-weight: 700; }
        .wm .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 9px var(--green); flex: 0 0 auto; }
        .nav-cta { background: var(--ink); color: #ffffff; padding: 9px 18px; border-radius: 999px; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 1px; transition: transform .15s ease, box-shadow .2s ease; }
        .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 26px rgba(13,148,72,0.32); }
        .wrap { max-width: ${maxWidth}px; margin: 0 auto; padding: 10px 22px 80px; line-height: 1.55; }
        .crumb { font-family: var(--mono); font-size: 11px; color: var(--ink-faint); display: flex; align-items: center; gap: 9px; margin-bottom: 18px; letter-spacing: 0.4px; }
        .crumb :global(a) { color: var(--ink-dim); } .crumb :global(a):hover { color: var(--green); }
        .eyebrow { display: inline-block; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #b57400; border: 1px solid rgba(224,142,0,0.35); background: rgba(240,180,41,0.10); border-radius: 999px; padding: 5px 11px; }
        h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.6px; line-height: 1.12; margin: 18px 0 12px; }
        .lede { color: var(--ink-dim); font-size: 16.5px; line-height: 1.6; margin: 0 0 26px; max-width: 62ch; }
        .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 44px; padding-top: 18px; border-top: 1px solid var(--hair); font-family: var(--mono); font-size: 11px; color: var(--ink-faint); flex-wrap: wrap; gap: 10px; }
        .foot :global(a) { color: var(--ink-dim); } .foot :global(a):hover { color: var(--green); }
        @media (max-width: 520px) { h1 { font-size: 28px; } .nav { padding: 16px 18px; } .wrap { padding: 8px 18px 60px; } }
      `}</style>
      <div className="page">
        <nav className="nav">
          <a href="/" className="wm"><span className="dot" /><span className="wt">STEP <b className="g">GUNNER</b></span></a>
          <a href={store} className="nav-cta" onClick={() => track('store_click', { source: campaign, location: 'nav' })}>Get the app</a>
        </nav>
        <main className="wrap">
          {crumb && crumb.length > 0 && (
            <div className="crumb">
              {crumb.map((c, i) => (
                <span key={c.href} style={{ display: 'inline-flex', gap: 9 }}>
                  {i > 0 && <span>/</span>}
                  <Link href={c.href}>{c.label}</Link>
                </span>
              ))}
            </div>
          )}
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {lede && <p className="lede">{lede}</p>}
          {children}
          <footer className="foot">
            <Link href="/">stepgunner.com</Link>
            <Link href="/readiness">Readiness check</Link>
            <Link href="/readiness/methodology">Methodology</Link>
            <span>Rezumab LLC</span>
          </footer>
        </main>
      </div>
    </>
  );
}
