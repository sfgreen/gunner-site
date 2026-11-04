import { useCallback, useEffect, useRef, useState } from 'react';
import type { Auth, User } from 'firebase/auth';
import { HANDOFF_STORAGE_KEY } from './handoffStrip';

// The student's app account on a web page (/pro, /earnings): Google (Apple once
// NEXT_PUBLIC_PRO_APPLE=1), or the app's one-time handoff (lib/handoff.ts). Firebase
// loads only after paint, and only on the pages that call this.
//
// The handoff code arrives as ?h=CODE; lib/handoffStrip.ts has already moved it into
// sessionStorage.

export type ApiResult<T> = T & { ok: boolean; error?: string; code?: string };

export async function api<T>(user: User, path: string, body?: unknown): Promise<ApiResult<T>> {
  const token = await user.getIdToken();
  const r = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    return await r.json();
  } catch (err) {
    return { ok: false, error: 'Something went wrong. Try again.' } as ApiResult<T>;
  }
}

export const fmtUsd = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, '')}`;

export const fmtDate = (ms: number | null) =>
  ms ? new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric' }).format(ms) : '';

export function signInError(code: string): string {
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '';
  if (code === 'auth/popup-blocked') return 'Your browser blocked the sign-in window. Allow pop-ups for stepgunner.com and try again.';
  if (code === 'auth/account-exists-with-different-credential') return 'Your account signs in another way. Try the other button.';
  return "Sign-in didn't finish. Try again.";
}

function takeHandoffCode(): string {
  try {
    const saved = sessionStorage.getItem(HANDOFF_STORAGE_KEY);
    if (saved) {
      sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
      return saved;
    }
  } catch (err) {
    // Storage blocked (private mode on old Safari): fall back to the URL.
  }
  const url = new URL(window.location.href);
  const h = url.searchParams.get('h') || '';
  if (h) {
    url.searchParams.delete('h');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }
  return h;
}

// One redemption per page load, shared by every mount (React runs effects twice in dev).
let handoff: Promise<{ error: string; used: boolean }> | null = null;

function redeemHandoff(auth: Auth, signIn: (auth: Auth, token: string) => Promise<unknown>) {
  if (!handoff) {
    handoff = (async () => {
      const code = takeHandoffCode();
      if (!code) return { error: '', used: false };
      try {
        const r = await fetch('/api/auth/handoff/redeem', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
        });
        const j = await r.json().catch(() => ({}));
        if (!j.ok || !j.token) return { error: j.error || 'That link has expired. Open it from the app again.', used: false };
        await signIn(auth, j.token);
        return { error: '', used: true };
      } catch (err) {
        return { error: "Sign-in didn't finish. Open the page from the app again.", used: false };
      }
    })();
  }
  return handoff;
}

export function useWebAccount() {
  const authRef = useRef<Auth | null>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = still checking
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [viaHandoff, setViaHandoff] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    let live = true;
    (async () => {
      const [{ webAuth }, m] = await Promise.all([import('./firebaseWeb'), import('firebase/auth')]);
      const auth = webAuth();
      authRef.current = auth;
      const h = await redeemHandoff(auth, m.signInWithCustomToken);
      if (!live) return;
      if (h.error) setErr(h.error);
      setViaHandoff(h.used);
      unsub = m.onAuthStateChanged(auth, (u) => setUser(u));
    })();
    return () => { live = false; unsub(); };
  }, []);

  const signIn = useCallback(async (provider: 'apple' | 'google', onTrack?: () => void) => {
    const auth = authRef.current;
    if (!auth) return;
    setBusy(true);
    setErr('');
    onTrack?.();
    try {
      const m = await import('firebase/auth');
      const p = provider === 'google' ? new m.GoogleAuthProvider() : new m.OAuthProvider('apple.com');
      if (provider === 'apple') (p as InstanceType<typeof m.OAuthProvider>).addScope('email');
      await m.signInWithPopup(auth, p);
    } catch (e) {
      setErr(signInError((e as { code?: string }).code || ''));
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const auth = authRef.current;
    if (!auth) return;
    const m = await import('firebase/auth');
    await m.signOut(auth);
    setViaHandoff(false);
    setErr('');
  }, []);

  return { user, busy, err, setErr, viaHandoff, signIn, signOut };
}
