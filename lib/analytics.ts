// Thin wrapper over the site's gtag (G-LDKSK4Z5DW, loaded in _app.tsx). Analytics
// must never break the UX, so every call is guarded and swallows errors. Events
// land in the web GA4 property (viewable in GA4 -> Events / Realtime).
type Gtag = (command: 'event', name: string, params?: Record<string, unknown>) => void;

export function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  try {
    const g = (window as unknown as { gtag?: Gtag }).gtag;
    g?.('event', event, params);
  } catch {
    /* never let analytics throw into a click handler */
  }
}

// The referrer host (e.g. "reddit.com") so funnel events can be segmented by
// channel without logging full URLs.
export function referrerHost(): string {
  if (typeof document === 'undefined') return '';
  try {
    return document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : 'direct';
  } catch {
    return 'unknown';
  }
}

// App Store campaign token (App Store Connect -> App Analytics -> Campaigns) so
// installs originating from the readiness funnel are attributable.
export const APP_STORE = 'https://apps.apple.com/us/app/step-gunner/id6761317357';
// pt = the account-wide App Analytics provider token (from the ASC campaign-link
// generator, 2026-08-20). Without pt + mt=8 Apple IGNORES ct for attribution,
// which is why the Campaigns page sat empty. ct varies per surface.
const APP_STORE_PT = '128505861';
export function appStoreUrl(campaign: string): string {
  return `${APP_STORE}?pt=${APP_STORE_PT}&ct=${encodeURIComponent(campaign)}&mt=8`;
}
