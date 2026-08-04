import { Html, Head, Main, NextScript } from 'next/document';

// Loads DM Sans once, site-wide, from the correct place (the Document head), so
// pages and components never inject their own font <link rel="stylesheet"> (which
// triggers Next's no-page-custom-font warning). The whole site's --sans stack
// resolves to DM Sans from here.
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap"
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
