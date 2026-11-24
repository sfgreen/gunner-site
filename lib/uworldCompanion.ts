// The UWorld Companion (gunner decision 0087): the Chrome extension that sends a
// student's UWorld misses to TODAY in the app. CHROME_STORE_URL stays empty until the
// listing is public; the /uworld page then shows "Add to Chrome".
export const CHROME_STORE_URL = '';

// The connect code on stepgunner.com/uw/<code>: 10 characters from this alphabet
// (functions/uworld.py CODE_ALPHABET, the app's UWorldConnectLink).
const ALPHABET = /^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{10}$/;

export function cleanConnectCode(raw: unknown): string {
  const code = typeof raw === 'string' ? raw.toUpperCase().replace(/-/g, '') : '';
  return ALPHABET.test(code) ? code : '';
}
