import type { GetStaticProps } from 'next';
import PathwaysHub from '../../components/pathways/PathwaysHub';
import { buildHub, publishedEntries } from '../../lib/pathways/data';
import type { HubVM } from '../../lib/pathways/data';

// The ED pathways hub. With nothing published (production before Danny's first
// sign-off) it is a 404, never a thin page; nav does not link it yet.
export default function Pathways({ vm }: { vm: HubVM }) {
  return <PathwaysHub vm={vm} />;
}

export const getStaticProps: GetStaticProps = async () => {
  const published = publishedEntries();
  if (!published.length) return { notFound: true };
  return { props: { vm: buildHub(published) } };
};
