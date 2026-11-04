// The app's one-time sign-in code (/pro?h=CODE, /earnings?h=CODE, lib/handoff.ts) moves
// to sessionStorage and off the URL during parse (pages/_document.tsx), before GA
// (afterInteractive) records the page URL, so the code never reaches GA, history or a
// Referer. lib/webAccount.ts picks it up.
export const HANDOFF_STORAGE_KEY = 'sg.handoff';

export const HANDOFF_STRIP = `(function(){try{var l=location;if(!/^\\/(pro|earnings)\\/?$/.test(l.pathname))return;var u=new URL(l.href),h=u.searchParams.get('h');if(!h)return;sessionStorage.setItem('${HANDOFF_STORAGE_KEY}',h);u.searchParams.delete('h');history.replaceState(null,'',u.pathname+u.search+u.hash);}catch(e){}})();`;
