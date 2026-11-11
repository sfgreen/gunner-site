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
      // Newer Free 120 years people type or link (2022 to 2029, and 2020) used to 404. They get
      // a page that points to the built-in 2021 and 2019 forms and the bring-your-PDF hub.
      {
        source: '/free120step:year(2020|202[2-9])',
        destination: '/free120/newer.html',
      },
      // A Free 120 knockout list carried from the results page (public/free120/f120link.js).
      // The code is the whole payload, so the page is static and reads it from the path.
      {
        source: '/f/:code',
        destination: '/free120/link.html',
      },
      {
        source: '/score/:path*',
        destination: 'https://stepgunner-79ae7.web.app/score/:path*',
      },
      // The ChatGPT app's MCP server (decision 0065 in the app repo). OpenAI
      // requires the submitted URL to sit on the domain being verified, and the
      // server itself is a Firebase Function, so this proxies the same way
      // /score/* does: through the Firebase Hosting rewrite, not straight at
      // cloudfunctions.net. POST only; the server answers JSON-RPC.
      {
        source: '/mcp',
        destination: 'https://stepgunner-79ae7.web.app/mcp',
      },
    ];
  },
  async headers() {
    // Allow /embed to be framed by any origin (it is a public, shareable widget).
    // frame-ancestors * opts in; we deliberately do NOT set X-Frame-Options here,
    // since that legacy header would block cross-origin framing. Scoped to /embed
    // only so no other route loosens its framing policy.
    return [
      {
        source: '/embed',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
