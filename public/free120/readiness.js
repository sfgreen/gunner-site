// GENERATED from lib/readiness.ts by scripts/build_free120_readiness.mjs. Do not edit.
export const PASS = 218;
export const PASS_COMFORT = 230;
export const MEAN = 250;
export const GMIN = 205, GMAX = 275;
export const FORMS = [
    'NBME 9', 'NBME 10', 'NBME 11', 'NBME 12', 'NBME 13', 'NBME 14', 'NBME 15', 'NBME 16',
    'UWSA 1', 'UWSA 2', 'UWSA 3',
];
export const CAL = {
    mean: 250,
    slope: 0.79,
    delta: 9,
    tau: 30,
    residualSD: 8.4,
    floor: 200,
    ceiling: 280,
};
export const FORM_OFFSETS = {
    'NBME 9': 5.5,
    'UWSA 2': -4.8,
    'UWSA 3': 6.3,
};
export function formOffset(form) {
    var _a;
    return (_a = FORM_OFFSETS[form]) !== null && _a !== void 0 ? _a : 0;
}
export function correctedScore(form, printed) {
    return printed + formOffset(form);
}
export const NORM = [
    [200, 0], [205, 1], [210, 1], [215, 2], [220, 4], [225, 6], [230, 10], [235, 16],
    [240, 24], [245, 34], [250, 47], [255, 60], [260, 74], [265, 85], [270, 94], [275, 98], [300, 100],
];
export function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}
export function percentile(score) {
    const s = clamp(score, 200, 300);
    for (let i = 0; i < NORM.length - 1; i++) {
        const [x0, y0] = NORM[i], [x1, y1] = NORM[i + 1];
        if (s >= x0 && s <= x1)
            return Math.round(y0 + ((y1 - y0) * (s - x0)) / (x1 - x0));
    }
    return s >= 300 ? 100 : 0;
}
export function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
export function gpct(v) {
    return ((clamp(v, GMIN, GMAX) - GMIN) / (GMAX - GMIN)) * 100;
}
export function calibratedCenter(anchor) {
    const c = CAL.mean + CAL.slope * (anchor - CAL.mean) + CAL.delta;
    return clamp(Math.round(c), CAL.floor, CAL.ceiling);
}
export function bandHalfWidth(days) {
    if (days == null || Number.isNaN(days))
        return { band: 11, tier: 'Rough (add your exam date)' };
    if (days < 15)
        return { band: 7, tier: 'Tight' };
    if (days <= 30)
        return { band: 11, tier: 'Moderate' };
    if (days <= 56)
        return { band: 15, tier: 'Wide' };
    return { band: 18, tier: 'Very wide (exam far out)' };
}
export function formNumber(form) {
    const m = form.match(/\d+/g);
    return m ? parseInt(m[m.length - 1], 10) : null;
}
function leastSquares(pts) {
    const n = pts.length;
    if (!n)
        return null;
    const sx = pts.reduce((a, p) => a + p.x, 0);
    const sy = pts.reduce((a, p) => a + p.y, 0);
    const sxx = pts.reduce((a, p) => a + p.x * p.x, 0);
    const sxy = pts.reduce((a, p) => a + p.x * p.y, 0);
    const denom = n * sxx - sx * sx;
    if (Math.abs(denom) < 1e-12)
        return null;
    const slope = (n * sxy - sx * sy) / denom;
    return { slope, intercept: (sy - slope * sx) / n };
}
export const TAKEN_OPTS = [
    ['', 'optional'], ['3', 'this week'], ['7', '~1 wk ago'], ['14', '~2 wks ago'],
    ['21', '~3 wks ago'], ['30', '~1 mo ago'], ['45', '~6 wks ago'], ['60', '~2 mo ago'],
    ['100', '3+ mo ago'], ['x', 'exact date\u2026'],
];
export function takenIsExact(days, flag) {
    return !!flag || (days !== '' && !TAKEN_OPTS.some(([v]) => v === days));
}
export function takenSource(days, exactFlag) {
    if (days === '')
        return 'none';
    return takenIsExact(days, exactFlag) ? 'exact' : 'bucket';
}
export const MODEL_VERSION = 'w3-decay30-off3-d9';
export function visitorIdentity() {
    if (typeof window === 'undefined')
        return null;
    const uuid = () => {
        var _a, _b;
        const c = globalThis.crypto;
        return (_b = (_a = c === null || c === void 0 ? void 0 : c.randomUUID) === null || _a === void 0 ? void 0 : _a.call(c)) !== null && _b !== void 0 ? _b : Math.random().toString(36).slice(2) + Date.now().toString(36);
    };
    try {
        let vid = localStorage.getItem('gunner_vid');
        let firstSeen = Number(localStorage.getItem('gunner_vid_t')) || 0;
        if (!vid) {
            vid = uuid();
            firstSeen = Date.now();
            localStorage.setItem('gunner_vid', vid);
            localStorage.setItem('gunner_vid_t', String(firstSeen));
        }
        let sid = sessionStorage.getItem('gunner_sid');
        if (!sid) {
            sid = uuid();
            sessionStorage.setItem('gunner_sid', sid);
        }
        return { vid, sid, firstSeen };
    }
    catch {
        return null;
    }
}
export function smartDays(raw) {
    const t = (raw || '').trim();
    if (!t)
        return null;
    if (/^\d{1,3}$/.test(t))
        return parseInt(t, 10);
    const yr = new Date().getFullYear();
    let ms = Date.parse(`${t}, ${yr}`);
    if (Number.isNaN(ms))
        ms = Date.parse(t);
    if (Number.isNaN(ms))
        return null;
    if (ms > Date.now() + 2 * 86400000)
        ms -= 365.25 * 86400000;
    const days = Math.floor((Date.now() - ms) / 86400000);
    return days >= 0 && days <= 400 ? days : null;
}
export function examDaysUntil(raw) {
    const t = (raw || '').trim();
    if (!t)
        return null;
    if (/^\d{1,3}$/.test(t)) {
        const n = parseInt(t, 10);
        return n <= 400 ? n : null;
    }
    const yr = new Date().getFullYear();
    for (const cand of [`${t}, ${yr}`, `${t}, ${yr + 1}`, t]) {
        const ms = Date.parse(cand);
        if (!Number.isNaN(ms)) {
            const d = Math.round((ms - Date.now()) / 86400000);
            if (d >= -45 && d <= 400)
                return d;
        }
    }
    return null;
}
const isUWSA = (form) => /uwsa/i.test(form);
function medianOf(xs) {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
export function effectiveDays(parsed) {
    const eff = parsed.map((p) => (p.d != null && !Number.isNaN(p.d) ? p.d : null));
    const missing = parsed.map((_, i) => i).filter((i) => eff[i] == null);
    if (missing.length === 0)
        return eff;
    const known = [];
    parsed.forEach((p, i) => {
        const f = formNumber(p.form);
        if (eff[i] != null && f != null)
            known.push({ x: f, y: eff[i] });
    });
    if (new Set(known.map((k) => k.x)).size >= 2) {
        const line = leastSquares(known);
        if (line) {
            for (const i of missing) {
                const f = formNumber(parsed[i].form);
                if (f != null)
                    eff[i] = Math.max(0, line.slope * f + line.intercept);
            }
        }
    }
    const still = parsed.map((_, i) => i).filter((i) => eff[i] == null);
    if (still.length) {
        const n = parsed.length;
        const base = new Map();
        for (const i of still)
            base.set(i, 7 + (n - 1 - i) * 10);
        const nbmeEff = still.filter((i) => !isUWSA(parsed[i].form)).map((i) => base.get(i));
        const med = nbmeEff.length ? medianOf(nbmeEff) : null;
        for (const i of still) {
            eff[i] = med != null && isUWSA(parsed[i].form) ? med : base.get(i);
        }
    }
    return eff;
}
export function decayAnchor(parsed) {
    if (!parsed.length)
        return 0;
    const eff = effectiveDays(parsed);
    let num = 0, den = 0;
    parsed.forEach((p, i) => {
        const w = Math.exp(-eff[i] / CAL.tau);
        num += correctedScore(p.form, p.s) * w;
        den += w;
    });
    return den > 0 ? num / den : correctedScore(parsed[0].form, parsed[0].s);
}
export function computeReadiness(entries) {
    const parsed = entries
        .map((e) => ({ s: parseInt(e.score, 10), d: smartDays(e.days), form: e.form }))
        .filter((p) => !Number.isNaN(p.s) && p.s >= 130 && p.s <= 300);
    const dated = parsed.filter((p) => p.d != null && !Number.isNaN(p.d));
    let freshestP = null;
    if (dated.length) {
        freshestP = parsed.reduce((best, p) => {
            if (p.d == null)
                return best;
            if (best == null || best.d == null || p.d < best.d)
                return p;
            return best;
        }, null);
    }
    else if (parsed.length) {
        freshestP = parsed[parsed.length - 1];
    }
    let proj = null;
    if (freshestP) {
        const anchor = Math.round(decayAnchor(parsed));
        const center = calibratedCenter(anchor);
        let { band, tier } = bandHalfWidth(freshestP.d);
        const lowAnchor = anchor <= PASS;
        if (lowAnchor) {
            band = Math.max(band + 4, 15);
            tier = 'High uncertainty';
        }
        const low = clamp(center - band, CAL.floor, CAL.ceiling);
        const high = clamp(center + band, CAL.floor, CAL.ceiling);
        let verdict = '', vclass = '';
        if (high < PASS) {
            verdict = `Below the ${PASS} pass line. There is time to build.`;
            vclass = 'low';
        }
        else if (low < PASS) {
            verdict = `Straddles the ${PASS} pass line. Keep building.`;
            vclass = 'warn';
        }
        else if (low <= PASS_COMFORT) {
            verdict = `Clears the ${PASS} pass line.`;
            vclass = 'ok';
        }
        proj = { low, high, band, tier, verdict, vclass, center, lowAnchor };
    }
    return { parsed, dated, freshest: freshestP, proj, showTrajectory: dated.length >= 2 && !!proj };
}
export function shortTier(tier) {
    const t = tier.replace(/\s*\(.*\)\s*/, '').trim();
    return t || tier;
}
export function buildCardCore(entries, actualStr, status) {
    const { parsed, dated, proj } = computeReadiness(entries);
    const actual = actualStr === '' ? null : parseInt(actualStr, 10);
    const hasActual = actual != null && !Number.isNaN(actual);
    if (!parsed.length && !hasActual)
        return null;
    const fail = hasActual && actual < PASS;
    const mode = hasActual ? 'journey' : 'readiness';
    const kind = hasActual ? (fail ? 'Score Report' : 'Score Journey') : 'Readiness Report';
    const heroValue = hasActual ? String(actual) : proj ? `${proj.low} to ${proj.high}` : '';
    const isRange = !hasActual;
    const heroKicker = fail ? 'Step 2 CK' : hasActual ? 'Actual Step 2 CK' : 'Projected Step 2 CK';
    const heroTag = fail
        ? 'Below the 218 pass line. Regrouping for a retake.'
        : hasActual
            ? 'Actual score, tracked from practice tests.'
            : 'Projection from your practice tests, not a guarantee.';
    const pctSource = hasActual ? actual : proj ? proj.center : 0;
    const pct = percentile(pctSource);
    const pctChip = hasActual
        ? `${ordinal(pct)} percentile`
        : `proj. ${ordinal(pct)} %ile (est.)`;
    let verdictChip = null;
    let verdictKey = 'dim';
    if (hasActual) {
        const a = actual;
        if (a < PASS) {
            verdictChip = `Below ${PASS}`;
            verdictKey = 'dim';
        }
        else if (a <= PASS_COMFORT) {
            verdictChip = `Clears ${PASS}`;
            verdictKey = 'green';
        }
    }
    else if (proj) {
        if (proj.high < PASS) {
            verdictChip = `Below ${PASS}`;
            verdictKey = 'red';
        }
        else if (proj.low < PASS) {
            verdictChip = `Straddles ${PASS}`;
            verdictKey = 'gold';
        }
        else if (proj.low <= PASS_COMFORT) {
            verdictChip = `Clears ${PASS}`;
            verdictKey = 'green';
        }
    }
    const tierChip = !hasActual && proj ? `${shortTier(proj.tier)} range` : null;
    const fromScore = parsed.length ? parsed[0].s : null;
    return {
        kind, mode, fail, status: (status || '').trim(),
        parsed,
        dated: dated.map((d) => ({ form: d.form, score: d.s, days: d.d })),
        actual: hasActual ? actual : null,
        proj: proj ? { low: proj.low, high: proj.high, center: proj.center, tier: proj.tier } : null,
        fromLabel: fromScore != null ? `${fromScore} first` : '',
        fromScore,
        heroValue, isRange, heroKicker, heroTag,
        pctChip, pct, tierChip, verdictChip, verdictKey,
        footerCta: fail
            ? 'Build a retake plan, free'
            : hasActual ? 'Predict yours, free' : 'Track your trajectory, free',
    };
}
export function ogMeta(core) {
    const desc = 'Every practice test, tracked to exam day. Build yours free, no sign-up.';
    if (!core) {
        return { title: 'Step 2 Readiness Check | Step Gunner', desc };
    }
    if (core.fail)
        return { title: 'Regrouping for a Step 2 CK retake | Step Gunner', desc };
    if (core.actual != null) {
        const t = core.fromScore != null && core.fromScore !== core.actual
            ? `${core.fromScore} to ${core.actual} on Step 2 CK`
            : `${core.actual} on Step 2 CK`;
        return { title: `${t} | Step Gunner`, desc };
    }
    return { title: `${core.heroValue} projected on Step 2 CK | Step Gunner`, desc };
}
function b64urlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
    const padded = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++)
        bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}
export function encodeShare(entries, actual, status) {
    const e = entries
        .map((en) => {
        const score = parseInt(en.score, 10);
        if (Number.isNaN(score))
            return null;
        const days = en.days === '' ? null : parseInt(en.days, 10);
        return [FORMS.indexOf(en.form), score, Number.isNaN(days) ? null : days];
    })
        .filter(Boolean);
    const a = actual === '' ? null : parseInt(actual, 10);
    const obj = { e, a: Number.isNaN(a) ? null : a, s: (status || '').slice(0, 60) };
    return b64urlEncode(JSON.stringify(obj));
}
export function decodeShare(param) {
    try {
        const obj = JSON.parse(b64urlDecode(param));
        if (!obj || !Array.isArray(obj.e))
            return null;
        const entries = obj.e
            .map((row) => {
            if (!Array.isArray(row))
                return null;
            const [fi, sc, dy] = row;
            const form = typeof fi === 'number' && fi >= 0 && fi < FORMS.length ? FORMS[fi] : '';
            const score = Number.isFinite(sc) ? String(Math.round(sc)) : '';
            const days = dy == null || !Number.isFinite(dy) ? '' : String(Math.round(dy));
            if (score === '')
                return null;
            return { form, score, days };
        })
            .filter(Boolean);
        if (!entries.length)
            return null;
        const actual = Number.isFinite(obj.a) ? String(Math.round(obj.a)) : '';
        const status = typeof obj.s === 'string' ? obj.s.slice(0, 60) : '';
        return { entries, actual, status };
    }
    catch {
        return null;
    }
}
export const SHARE_BASE = 'https://stepgunner.com/readiness';
export function shareUrl(entries, actual, status) {
    return `${SHARE_BASE}?e=${encodeShare(entries, actual, status)}`;
}
export function redditTitle(entries, actual, status) {
    const core = buildCardCore(entries, actual, status);
    if (!core)
        return 'My Step 2 CK readiness';
    const st = core.status ? `, ${core.status}` : '';
    if (core.fail)
        return `Regrouping for a Step 2 CK retake${st}`;
    if (core.actual != null) {
        if (core.fromScore != null && core.fromScore !== core.actual) {
            return `${core.fromScore} to ${core.actual} on Step 2 CK${st}`;
        }
        return `Step 2 CK: ${core.actual}${st}`;
    }
    if (core.proj)
        return `Projected ${core.proj.low} to ${core.proj.high} on Step 2 CK${st}`;
    return `My Step 2 CK readiness${st}`;
}
export function redditSubmitUrl(entries, actual, status) {
    return `https://www.reddit.com/r/step2/submit?title=${encodeURIComponent(redditTitle(entries, actual, status))}`;
}
export function buildCopyText(entries, actual, status, proj) {
    const lines = [];
    const st = (status || '').trim();
    if (st) {
        lines.push(st);
        lines.push('');
    }
    const anyDated = entries.some((e) => e.days.trim() !== '' && e.score.trim() !== '');
    entries.forEach((e) => {
        const score = parseInt(e.score, 10);
        if (Number.isNaN(score) || score < 130 || score > 300)
            return;
        const form = e.form || 'Practice test';
        const d = e.days === '' ? null : parseInt(e.days, 10);
        const tail = d != null && !Number.isNaN(d)
            ? ` (${d} days out)`
            : anyDated ? ' (timing not reported)' : '';
        lines.push(`${form}: ${score}${tail}`);
    });
    const actNum = actual === '' ? null : parseInt(actual, 10);
    if (actNum != null && !Number.isNaN(actNum)) {
        lines.push(`Actual STEP 2: ${actNum}`);
    }
    else if (proj) {
        lines.push(`Projected Step 2 CK: ${proj.low} to ${proj.high} (est.)`);
    }
    lines.push('');
    lines.push(`tracked free on Step Gunner: ${SHARE_BASE}`);
    return lines.join('\n');
}
