import { createHash, randomBytes } from 'crypto';

// App-to-web handoff (decision 0057 amendment, S2): the app trades its Firebase ID
// token for a one-time code, opens stepgunner.com/earnings#h=CODE (or /pro), and the
// page trades the code for a custom token, so the student is signed in on the web
// with no second sign-in and no Apple Services ID. The code rides in the fragment, which
// browsers never send to a server, a log or a Referer. Only its SHA-256 is stored
// (authHandoffs/{hash}); it works once, for 2 minutes.

export const HANDOFF_TTL_MS = 2 * 60_000;
export const HANDOFF_PAGES = ['earnings', 'pro'] as const;
export type HandoffPage = (typeof HANDOFF_PAGES)[number];

const CODE_RE = /^[A-Za-z0-9_-]{43}$/;

/** 256 random bits, base64url (43 characters). */
export function newHandoffCode(): string {
  return randomBytes(32).toString('base64url');
}

export function isHandoffCode(v: unknown): v is string {
  return typeof v === 'string' && CODE_RE.test(v);
}

export function handoffKey(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function handoffUrl(origin: string, to: HandoffPage, code: string): string {
  return `${origin}/${to}#h=${code}`;
}

export function handoffPage(v: unknown): HandoffPage {
  return (HANDOFF_PAGES as readonly string[]).includes(v as string) ? (v as HandoffPage) : 'earnings';
}

/** Why a stored handoff cannot be used, or null when it can. */
export function handoffRefusal(doc: { uid?: unknown; expiresAtMs?: number | null } | null, nowMs: number): string | null {
  if (!doc || typeof doc.uid !== 'string' || !doc.uid) return 'used_or_unknown';
  if (doc.expiresAtMs == null || doc.expiresAtMs <= nowMs) return 'expired';
  return null;
}
