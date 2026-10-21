// Homepage in the app look (2026-10-21, the approved SITE_M3_VISUAL mock). It routes by
// where the student is this week (wards, shelf, Step 2, ED), keeps the readiness check
// as the first section under the fold (the same computeReadiness as /readiness), and
// asks for the app once in the hero. The out-of-sample "within 7" figure comes from
// track_record_json (server-side, 1h cache), with the last published value as fallback.
// ?ref=CODE keeps working: client.js switches every store button to ct=referral and
// copies GUNNERREF:CODE on the tap. No em or en dashes in copy.
import type { GetServerSideProps } from 'next';
import WardsPage from '../components/WardsPage';
import { homeHtml } from '../lib/wards/render';

const TRACK_RECORD_URL = 'https://us-central1-stepgunner-79ae7.cloudfunctions.net/track_record_json';
const WITHIN7_FALLBACK = 80;

export default function Home({ within7 }: { within7: number }) {
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Step Gunner',
    operatingSystem: 'iOS', applicationCategory: 'EducationalApplication',
    url: 'https://stepgunner.com', description: 'USMLE Step 2 CK prep for the clerkship year: Step 2 CK cards, Next Best Step chains and a calibrated readiness range.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Organization', name: 'Rezumab LLC' },
  };
  return (
    <WardsPage
      page="home"
      html={homeHtml({ within7 })}
      mountOpts={{ referral: true }}
      head={{
        title: 'Step Gunner | The clerkship year, then your Step 2 CK score',
        description: 'Templates and lab reads for the wards, shelf guides by rotation, and a Step 2 CK readiness check that shows its track record. Then study in the app.',
        path: '/',
        jsonLd: [jsonLd],
      }}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  let within7 = WITHIN7_FALLBACK;
  try {
    const r = await fetch(TRACK_RECORD_URL, { headers: { accept: 'application/json' } });
    if (r.ok) {
      const rec = (await r.json()) as { bySource?: { forum?: { within7Pct?: number } } } | null;
      const v = rec?.bySource?.forum?.within7Pct;
      if (typeof v === 'number' && v > 0 && v <= 100) within7 = Math.round(v);
    }
  } catch {
    within7 = WITHIN7_FALLBACK;
  }
  return { props: { within7 } };
};
