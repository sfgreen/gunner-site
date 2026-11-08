// Invite links (decision 0058): stepgunner.com/r/CODE. Codes are the app's
// `makeReferralCode` output, `<NAME>-<4 chars>`; this mirrors the app's
// ReferralCode.normalized + ReferralDeepLink.sanitized so the page shows the
// same code the app will redeem. Anything else normalizes to ''.
export function normalizeInviteCode(raw: string): string {
  let code = (raw || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!code.includes('-') && code.length >= 5) code = `${code.slice(0, -4)}-${code.slice(-4)}`;
  if (code.length < 5 || code.length > 16 || code.startsWith('-') || code.endsWith('-')) return '';
  return code;
}

// Study Buddy (decision 0062): /r/CODE?b=TOKEN carries a one-time rope token
// beside the referral code. Mirrors the app's BuddyLink.valid (16 to 32
// url-safe characters); anything else is dropped, never echoed.
export function buddyToken(raw: string | null | undefined): string {
  const t = (raw || '').trim();
  return /^[A-Za-z0-9_-]{16,32}$/.test(t) ? t : '';
}
