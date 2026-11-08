import { useEffect, useRef, useState } from 'react';
import { track } from '../lib/analytics';

// The "what you get with Pro" video on /pro: a vertical 9:16 screen recording
// (720x1280 web encode) on its own dark stage. Styles are the .pro-vid-* rules in
// components/ProStyles.tsx.
//
// Motion: the server HTML never autoplays. After mount it plays muted and looped
// only when the visitor has not asked for reduced motion, and only while it is on
// screen. Under Reduced Motion, or when the browser blocks autoplay (iOS Low
// Power Mode), the poster shows with a Play button that starts it with controls.
// An autoplaying loop gets a Pause button (WCAG 2.2.2).

// Flip on once /public/media/pro/pro-video.webm ships (VP9 or AV1). WebM goes
// first so browsers that play it take the smaller file; the MP4 is the fallback.
const PRO_VIDEO_WEBM = true;
const SRC = '/media/pro/pro-video';
const LABEL =
  'Step Gunner Pro, feature by feature: NBME intelligence, Visual Dx, retention forecast, your coach, weak spots, no daily caps.';

// init: the server render and first paint (CSS shows the Play button to Reduced
// Motion visitors before hydration). auto: muted loop while on screen.
// poster: waiting for a tap. manual: started by the visitor, native controls.
type Mode = 'init' | 'auto' | 'poster' | 'manual';

export default function ProVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>('init');
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false);
  const reduced = useRef(false);

  // React does not reliably set `muted` from markup; iOS only autoplays a muted video.
  const play = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch((err: unknown) => {
        // AbortError = a pause or offscreen interrupted the load: not a block.
        if (err instanceof DOMException && err.name === 'NotAllowedError') setMode('poster');
      });
    }
  };

  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      reduce = false;
    }
    reduced.current = reduce;
    setMode(reduce ? 'poster' : 'auto');
  }, []);

  // Play while on screen (auto only); pause when scrolled away to save battery.
  useEffect(() => {
    const v = ref.current;
    if (!v || (mode !== 'auto' && mode !== 'manual')) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      if (mode === 'auto') play();
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e) return;
        if (e.isIntersecting) {
          if (mode === 'auto' && !userPaused.current) play();
        } else if (!v.paused) {
          v.pause();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [mode]);

  const start = () => {
    track('pro_video_play', { via: 'button', reduced: reduced.current });
    userPaused.current = false;
    setMode('manual');
    play();
  };

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      play();
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const showPlay = mode === 'init' || mode === 'poster';

  return (
    <figure className="pro-vid">
      <div className="pro-vid-frame">
        <video
          ref={ref}
          className="pro-vid-v"
          muted
          loop={mode !== 'manual'}
          playsInline
          controls={mode === 'manual'}
          preload="metadata"
          poster={`${SRC}-poster.jpg`}
          width={720}
          height={1280}
          aria-label={LABEL}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          {PRO_VIDEO_WEBM && <source src={`${SRC}.webm`} type="video/webm" />}
          <source src={`${SRC}.mp4`} type="video/mp4" />
        </video>
        {showPlay && (
          <button type="button" className={`pro-vid-play${mode === 'init' ? ' is-init' : ''}`} aria-label="Play the Pro video" onClick={start}>
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.2-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>
      {mode === 'auto' && (
        <button
          type="button"
          className="pro-vid-pp"
          aria-label={playing ? 'Pause the Pro video' : 'Play the Pro video'}
          onClick={toggle}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
              <rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4.5 2.9v10.2a.8.8 0 0 0 1.22.68l8.1-5.1a.8.8 0 0 0 0-1.36l-8.1-5.1A.8.8 0 0 0 4.5 2.9z" fill="currentColor" />
            </svg>
          )}
        </button>
      )}
      <figcaption className="pro-vid-cap">
        <span className="pro-vid-k">WHAT YOU GET WITH PRO</span>
        <span className="pro-vid-l">Recorded in the real app.</span>
      </figcaption>
    </figure>
  );
}
