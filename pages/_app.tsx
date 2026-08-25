import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // /embed is a widget dropped into third-party pages. Do not run our GA inside
  // someone else's site: it would count their visitors as our sessions and track
  // pages that never consented. Embed clickthroughs are measured on /readiness instead.
  const analyticsOff = router.pathname === '/embed';
  return (
    <>
      {!analyticsOff && (
        <>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-LDKSK4Z5DW"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LDKSK4Z5DW');
            `}
          </Script>
        </>
      )}
      <Component {...pageProps} />
    </>
  );
}
