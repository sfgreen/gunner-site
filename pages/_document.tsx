import { Html, Head, Main, NextScript } from 'next/document';

// Loads the app look's two families, Inter and JetBrains Mono, once, site-wide, from
// the correct place (the Document head), so pages and components never inject their
// own font <link rel="stylesheet"> (which triggers Next's no-page-custom-font
// warning). --f-sans and --f-mono (styles/globals.css) resolve to them.
export default function Document() {
  return (
    <Html lang="en">
      <Head>
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
