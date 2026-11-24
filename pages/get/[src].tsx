import type { GetServerSideProps } from 'next';
import { cleanSource, destination, deviceOf, isBot } from '../../lib/postLinks';

// stepgunner.com/get/<source>: the "Download Step Gunner now" link at the end of every post.
// Counts the visit (bots and link previews skipped), then redirects. Never cached, never indexed.
export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  const source = cleanSource(params?.src) || 'unknown';
  const ua = req.headers['user-agent'];
  const device = deviceOf(ua);
  if (!isBot(ua)) {
    let refHost = 'direct';
    try {
      const r = req.headers.referer;
      if (r) refHost = new URL(r).hostname.replace(/^www\./, '');
    } catch {
      refHost = 'unknown';
    }
    try {
      const { countVisit } = await import('../../lib/postLinksServer');
      await countVisit(source, device, refHost);
    } catch (err) {
      console.error('get link: count failed', { source, err });
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  return { redirect: { destination: destination(source, device), permanent: false } };
};

export default function Get() {
  return null;
}
