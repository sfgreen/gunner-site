import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import AppShell from './app/AppShell';
import { Breadcrumb } from './app/blocks';

// The frame for pages that are not built from blocks yet: the app-look chrome
// (components/app/AppShell: the nav and footer every page shares) around the page's
// own content, in a reading column that lines up under the wordmark. A page ported
// to blocks uses AppShell directly (components/app/README.md).
//
// The column is left-aligned on the 1200px grid like the wards articles; `measure`
// picks its width: article 720 (prose near 66 characters), tool 680 (forms),
// wide (the full grid, for pages with their own layout).

export type Measure = 'wide' | 'article' | 'tool';

export default function SiteShell({
  children, campaign, measure = 'article', crumb, cta,
}: {
  children: ReactNode;
  /** ct= for every store link in the chrome, and the analytics `source`. */
  campaign: string;
  measure?: Measure;
  /** Trail after Home. The entry whose href is this page renders as the current page. */
  crumb?: { href: string; label: string }[];
  /** The page's own nav button in place of "Get the app": same style, same slot
   *  (Chiefs: Apply; the ED pathways: Check readiness). A store href keeps the campaign. */
  cta?: { label: string; href: string };
}) {
  const path = (useRouter().asPath || '/').split(/[?#]/)[0];
  return (
    <AppShell campaign={campaign} navCta={cta}>
      <div className={`ax-page m-${measure}`}>
        {crumb && crumb.length > 0 && (
          <div className="mk isl"><Breadcrumb items={crumb.map((c) => (c.href === path ? { label: c.label } : c))} /></div>
        )}
        <div className="ax-col">{children}</div>
      </div>
    </AppShell>
  );
}
