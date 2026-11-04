import type { ReactNode } from 'react';

// Sign in with the app's own account (decision 0051, item 1), for /pro and /earnings.
// Apple on the web needs a Services ID in Firebase first, so its button shows only
// with NEXT_PUBLIC_PRO_APPLE=1 (decision 0051, Open).
export const APPLE_ON = process.env.NEXT_PUBLIC_PRO_APPLE === '1';

export default function ProSignIn({ title, lede, busy, onSignIn, children }: {
  title: string;
  lede: string;
  busy: boolean;
  onSignIn: (provider: 'apple' | 'google') => void;
  /** Fine print under the buttons. */
  children?: ReactNode;
}) {
  return (
    <div className="pro-stack">
      <h2>{title}</h2>
      <p className="pro-muted">{lede}</p>
      {APPLE_ON && (
        <button type="button" className="pro-btn pro-apple" disabled={busy} onClick={() => onSignIn('apple')}>
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.59 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.3-3.52zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z"/></svg>
          Continue with Apple
        </button>
      )}
      <button type="button" className="pro-btn pro-ghost" disabled={busy} onClick={() => onSignIn('google')}>
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28v-3.1H1.28a12 12 0 0 0 0 10.76l4.01-3.1z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77z"/></svg>
        Continue with Google
      </button>
      {children}
    </div>
  );
}
