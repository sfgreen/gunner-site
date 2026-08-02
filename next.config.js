/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
