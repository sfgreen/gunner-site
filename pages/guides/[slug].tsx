import type { GetStaticPaths, GetStaticProps } from 'next';
import GuideLayout from '../../components/GuideLayout';
import { allGuideSlugs, getGuide } from '../../lib/guides';
import type { GuideData } from '../../lib/guides/types';

// One statically-generated page per live guide, read straight from the data model.
// Adding lib/guides/<slug>.ts + registering it in lib/guides/index.ts is all it
// takes to ship a new clerkship here (and in the hub and sitemap).
export default function GuidePage({ guide }: { guide: GuideData }) {
  return <GuideLayout guide={guide} />;
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: allGuideSlugs().map((slug) => ({ params: { slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const guide = getGuide(slug);
  if (!guide) return { notFound: true };
  return { props: { guide } };
};
