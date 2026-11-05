// The app's one-time sign-in code (/pro#h=CODE, /earnings#h=CODE, lib/handoff.ts) rides
// in the fragment, so no server, log or Referer ever sees it. This moves it to
// sessionStorage and off the URL during parse (pages/_document.tsx), before GA
// (afterInteractive) reads the page location. lib/webAccount.ts picks it up.
export const HANDOFF_STORAGE_KEY = 'sg.handoff';

export const HANDOFF_STRIP = `(function(){try{var l=location;if(!/^\\/(pro|earnings)\\/?$/.test(l.pathname))return;var m=/^#h=([A-Za-z0-9_-]+)$/.exec(l.hash);if(!m)return;sessionStorage.setItem('${HANDOFF_STORAGE_KEY}',m[1]);history.replaceState(null,'',l.pathname+l.search);}catch(e){}})();`;
