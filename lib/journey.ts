// Journeys (gunner decision 0081): when a student signs in on stepgunner.com, the
// browser's Google Analytics client id is saved on their account (webJourneys/{uid},
// server-only), so Admin > Journeys can rebuild every visit that browser made before
// and after: landing page, demo, readiness, Pro, checkout, App Store tap.

export const GA_ID = 'G-LDKSK4Z5DW';

/** GA4's client id ("1234567890.1700000000"), the BigQuery export's user_pseudo_id. */
export function validClientId(v: unknown): v is string {
  return typeof v === 'string' && /^\d{1,12}\.\d{9,11}$/.test(v);
}

/** The client id from the _ga cookie ("GA1.1.1234567890.1700000000"). */
export function clientIdFromCookie(cookie: string): string {
  const m = /(?:^|;\s*)_ga=GA\d\.\d\.(\d{1,12}\.\d{9,11})/.exec(cookie || '');
  return m ? m[1] : '';
}

type GtagGet = (cmd: 'get', id: string, field: string, cb: (v: unknown) => void) => void;
type GtagSet = (cmd: 'set', params: Record<string, unknown>) => void;

/** This browser's GA client id, or '' (blocked, not loaded yet). Never throws. */
export function gaClientId(timeoutMs = 1500): Promise<string> {
  if (typeof window === 'undefined') return Promise.resolve('');
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: unknown) => {
      if (done) return;
      done = true;
      resolve(validClientId(v) ? v : clientIdFromCookie(document.cookie));
    };
    setTimeout(() => finish(''), timeoutMs);
    try {
      const g = (window as unknown as { gtag?: GtagGet }).gtag;
      if (g) g('get', GA_ID, 'client_id', finish); else finish('');
    } catch {
      finish('');
    }
  });
}

/** GA4 user_id = the Firebase uid from here on, so later visits join the account too. */
export function setGaUser(uid: string): void {
  if (typeof window === 'undefined') return;
  try {
    (window as unknown as { gtag?: GtagSet }).gtag?.('set', { user_id: uid });
  } catch {
    /* analytics never breaks the page */
  }
}
