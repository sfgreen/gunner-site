import { appStoreUrl } from './analytics';

// Tracked post links (Danny 2026-11-24: "i want a cta for all post writeups from now on and a way to
// track it. Download Step Gunner now"). Every post ends with stepgunner.com/get/<source>, e.g.
// /get/reddit-buddy. The server counts the visit (postLinksServer.ts), then an iPhone goes to the
// App Store with ct=post_<source> and everyone else lands on the home page with UTM tags. Apple
// does not attribute first downloads to ct at our volume (gunner-apple-attribution-limits), so the
// visit count is the number to read per post. Pure helpers here; node --test drives them.

/** "Reddit_Buddy " -> "reddit-buddy"; null when nothing usable is left. */
export function cleanSource(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return s.length >= 2 ? s : null;
}

// Link-preview fetchers and crawlers: Reddit, iMessage (facebookexternalhit/Twitterbot), Slack,
// Discord, WhatsApp, search engines, scripts. A preview is not a person.
const BOT = /bot|crawl|spider|preview|facebookexternalhit|embedly|whatsapp|telegram|slack|discord|skype|linkedin|vkshare|quora link|pinterest|curl|wget|python-|go-http|okhttp|java\/|headless|lighthouse|monitor|uptime|axios|node-fetch|undici/i;

export function isBot(ua: string | undefined): boolean {
  return !ua || BOT.test(ua);
}

export type Device = 'ios' | 'android' | 'desktop';

export function deviceOf(ua: string | undefined): Device {
  const u = ua || '';
  if (/iPhone|iPad|iPod/.test(u)) return 'ios';
  if (/Android/.test(u)) return 'android';
  return 'desktop';
}

/** Where a visit goes: the App Store on an iPhone or iPad, the home page anywhere else. */
export function destination(source: string, device: Device): string {
  if (device === 'ios') return appStoreUrl(`post_${source}`);
  const q = new URLSearchParams({ utm_source: 'post', utm_medium: 'link', utm_campaign: source });
  return `/?${q.toString()}`;
}

/** YYYY-MM-DD in Central time (every count Danny reads is in Central). */
export function centralDay(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}
