import type { GetStaticPaths, GetStaticProps } from 'next';
import PathwayArticle from '../../components/pathways/PathwayArticle';
import { buildArticle, publishedEntries } from '../../lib/pathways/data';
import type { ArticleVM } from '../../lib/pathways/data';

// One static page per published pathway. "Published" is decided at build time
// by lib/pathways/data: on production only Danny's signed-off articles exist
// (none yet, so this route builds no pages there); previews and local builds
// render every approved pathway as a noindex draft.
export default function PathwayPage({ vm }: { vm: ArticleVM }) {
  return <PathwayArticle vm={vm} />;
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: publishedEntries().map((e) => ({ params: { slug: e.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const published = publishedEntries();
  const entry = published.find((e) => e.slug === params?.slug);
  if (!entry) return { notFound: true };
  return { props: { vm: buildArticle(entry, published) } };
};
