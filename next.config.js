/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // The score-collection email links live at stepgunner.com/score/* but the
    // capture endpoints are Firebase Functions behind the Firebase Hosting site
    // (firebase.json rewrites /score/** -> capture_score / save_score /
    // capture_nbme / score_report / unsubscribe). Proxy the whole path space so
    // one link domain serves both stacks.
    return [
      {
        source: '/score/:path*',
        destination: 'https://stepgunner-79ae7.web.app/score/:path*',
      },
    ];
  },
  async headers() {
    // Allow /embed to be framed by any origin (it is a public, shareable widget).
    // frame-ancestors * opts in; we deliberately do NOT set X-Frame-Options here,
    // since that legacy header would block cross-origin framing. Scoped to /embed
    // only so no other route loosens its framing policy.
    // /pro and /earnings can open with the app's one-time sign-in code in ?h= (lib/handoff.ts).
    // The page drops it from the URL during parse, but the chunks the preload scanner
    // fetches first would carry it in their Referer; strict-origin sends only the origin.
    const handoffPage = [{ key: 'Referrer-Policy', value: 'strict-origin' }];
    return [
      {
        source: '/embed',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
      { source: '/pro', headers: handoffPage },
      { source: '/earnings', headers: handoffPage },
    ];
  },
};
module.exports = nextConfig;
