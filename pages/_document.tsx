import { Html, Head, Main, NextScript } from 'next/document';
import { HANDOFF_STRIP } from '../lib/handoffStrip';

// Loads the app look's two families, Inter and JetBrains Mono, once, site-wide, from
// the correct place (the Document head), so pages and components never inject their
// own font <link rel="stylesheet"> (which triggers Next's no-page-custom-font
// warning). --f-sans and --f-mono (styles/globals.css) resolve to them.
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: HANDOFF_STRIP }} />
        {/* Add to Home screen on Android opens the study desk like an app (no Android app exists). */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..800&family=JetBrains+Mono:wght@500..700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
