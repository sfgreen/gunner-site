/* eslint-disable @next/next/no-img-element */
// Open Graph image for an invite link (/r/CODE, decision 0058): the app's summit
// climb at night with the sharer's code, so a pasted invite unfurls as an invite
// instead of the generic home card. "Free to use" leads (the friend offer of
// decision 0057 is not live). Edge runtime; fonts are /public/og assets, memoized.
import { ImageResponse } from 'next/og';
import { ART } from '../../lib/inviteArt';
import { normalizeInviteCode } from '../../lib/invite';

export const config = { runtime: 'edge' };

let FONTS: Array<{ name: string; data: ArrayBuffer; weight: 600 | 700 | 800; style: 'normal' }> | null = null;
async function loadFonts(origin: string) {
  if (FONTS) return FONTS;
  const grab = async (path: string) => (await fetch(new URL(path, origin))).arrayBuffer();
  const [dm6, dm8, mo7, mo8] = await Promise.all([
    grab('/og/dmsans-600.ttf'), grab('/og/dmsans-800.ttf'), grab('/og/mono-700.ttf'), grab('/og/mono-800.ttf'),
  ]);
  FONTS = [
    { name: 'DM Sans', data: dm6, weight: 600, style: 'normal' },
    { name: 'DM Sans', data: dm8, weight: 800, style: 'normal' },
    { name: 'JetBrains Mono', data: mo7, weight: 700, style: 'normal' },
    { name: 'JetBrains Mono', data: mo8, weight: 800, style: 'normal' },
  ];
  return FONTS;
}

// Fixed-seed stars, so every card has the same sky.
const STARS = (() => {
  let s = 7;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: 70 }, () => ({ x: r() * 1200, y: r() * 300, r: r() < 0.18 ? 2 : 1.1 }));
})();

const GOLD = '#FFC800';

export default async function handler(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = normalizeInviteCode(searchParams.get('code') || '');
  const fonts = await loadFonts(origin);
  const [ax, ay] = ART.apex;
  const [hx, hy] = ART.head;
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', fontFamily: 'DM Sans',
        background: 'linear-gradient(180deg, #050913 0%, #0B1328 46%, #101A31 100%)' }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', left: 0, top: 0 }}>
          <defs>
            <linearGradient id="front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3A4C78" />
              <stop offset="0.42" stopColor="#1E2A4C" />
              <stop offset="1" stopColor="#080D1D" />
            </linearGradient>
            <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F4F7FF" />
              <stop offset="1" stopColor="#9FB4E8" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="trail" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#B87400" />
              <stop offset="0.6" stopColor="#F5B414" />
              <stop offset="1" stopColor="#FFE58A" />
            </linearGradient>
            <radialGradient id="moon" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#DCE4FF" stopOpacity="0.6" />
              <stop offset="1" stopColor="#DCE4FF" stopOpacity="0" />
            </radialGradient>
          </defs>
          {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={0.7} />)}
          <circle cx="770" cy="226" r="70" fill="url(#moon)" />
          <circle cx="770" cy="226" r="17" fill="#EEF2FF" />
          <path d={ART.far2} fill="#141D38" />
          <path d={ART.far1} fill="#1C2747" />
          <path d={ART.sil} fill="url(#front)" />
          <path d={ART.shadow} fill="#03060E" opacity={0.55} />
          <path d={ART.snow} fill="url(#snow)" />
          <line x1={ax} y1={ay} x2={ax} y2={ay - 40} stroke="#FFFFFF" strokeWidth={3} />
          <path d={`M${ax} ${ay - 40} L${ax + 24} ${ay - 32} L${ax} ${ay - 24} Z`} fill="#FFFFFF" />
          <line x1="548" y1={ART.passY} x2="1200" y2={ART.passY} stroke="#FF6A61" strokeWidth={2} strokeDasharray="6 8" opacity={0.5} />
          <path d={ART.route} fill="none" stroke="#FFE08A" strokeWidth={3.4} strokeLinecap="round" strokeDasharray="1 11" opacity={0.8} />
          <path d={ART.trail} fill="none" stroke="#FFB000" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" opacity={0.28} />
          <path d={ART.trail} fill="none" stroke="url(#trail)" strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={ART.trail} fill="none" stroke="#FFF4CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
          {ART.flags.map(([v, fx, fy]) => (
            <g key={v}>
              <line x1={fx} y1={fy} x2={fx} y2={fy - 36} stroke="#FFE08A" strokeWidth={2.6} />
              <path d={`M${fx} ${fy - 36} L${fx + 18} ${fy - 29} L${fx} ${fy - 22} Z`} fill={GOLD} />
            </g>
          ))}
          <circle cx={hx} cy={hy} r="26" fill="#FFC233" opacity={0.25} />
          <circle cx={hx} cy={hy} r="11" fill="#FFF1B8" stroke="#0B1328" strokeWidth={4} />
        </svg>
        {ART.flags.map(([v, fx, fy]) => (
          <div key={`c${v}`} style={{ position: 'absolute', left: fx - 26, top: fy - 70, display: 'flex', background: GOLD, color: '#1A1400',
            borderRadius: 8, padding: '2px 9px', fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 19 }}>{v}</div>
        ))}
        <div style={{ position: 'absolute', left: 64, top: 60, width: 520, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: '#30D158', marginRight: 14 }} />
            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 22, letterSpacing: 5, color: '#FFFFFF' }}>STEP GUNNER</div>
          </div>
          <div style={{ marginTop: 44, fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 20, letterSpacing: 3, color: GOLD }}>A FRIEND INVITED YOU</div>
          <div style={{ marginTop: 14, fontWeight: 800, fontSize: 64, lineHeight: 1.04, letterSpacing: -1.5, color: '#FFFFFF' }}>Climb to 270 with me</div>
          <div style={{ marginTop: 18, fontWeight: 600, fontSize: 27, lineHeight: 1.3, color: '#A9B4CC' }}>Free to use. Step 2 CK and shelf prep for the clerkship year.</div>
          <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', padding: '16px 24px', borderRadius: 18,
            background: 'rgba(8,12,26,0.85)', border: '2px solid rgba(255,200,0,0.45)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 16, letterSpacing: 3, color: 'rgba(255,255,255,0.62)' }}>
              {code ? 'USE MY CODE' : 'GET IT FREE'}
            </div>
            <div style={{ marginTop: 4, fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: code ? 48 : 36, letterSpacing: 2, color: GOLD }}>
              {code || 'STEPGUNNER.COM'}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200, height: 630, fonts,
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' },
    },
  );
}
