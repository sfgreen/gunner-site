/* free120-parser.js
   Client-side Free 120 parser: PDF (via pdf.js) -> window.FREE120 = {questions, blocks}.
   Ports the poppler-based extract_free120.py logic to the browser. No NBME text ships
   with this file; it only parses the user's own uploaded PDF.
*/
(function () {
  'use strict';

  // ---- 1. Reconstruct layout-preserving text from pdf.js text positions ----
  // pdftotext -layout aligns columns by absolute x; we emulate that by mapping each
  // text item's x to a character column relative to the page's left margin.
  async function pageToLayoutText(page) {
    const tc = await page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
    const raw = [];
    for (const it of tc.items) {
      if (!it.str) continue;
      raw.push({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width || 0, h: it.height || 0 });
    }
    if (!raw.length) return '';
    // estimate average glyph width (pt per char) for column mapping
    let totW = 0, totC = 0;
    for (const r of raw) { if (r.w > 0 && r.str.length) { totW += r.w; totC += r.str.length; } }
    const charW = Math.max(3.0, Math.min(7.5, totC ? totW / totC : 5));
    const pageMinX = Math.min.apply(null, raw.map(r => r.x));
    // group into lines by y (descending = top to bottom)
    raw.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    let cur = [], curY = null;
    const yTol = 3.2;
    for (const r of raw) {
      if (curY === null || Math.abs(r.y - curY) <= yTol) { cur.push(r); if (curY === null) curY = r.y; }
      else { lines.push(cur); cur = [r]; curY = r.y; }
    }
    if (cur.length) lines.push(cur);
    const out = [];
    for (const line of lines) {
      line.sort((a, b) => a.x - b.x);
      let s = '';
      for (const r of line) {
        const col = Math.round((r.x - pageMinX) / charW);
        if (col > s.length) s += ' '.repeat(col - s.length);
        else if (s.length && !s.endsWith(' ') && col <= s.length) { /* abutting */ }
        s += r.str;
      }
      out.push(s.replace(/\s+$/, ''));
    }
    return out.join('\n');
  }

  async function pdfToText(pdf) {
    const pages = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      pages.push(await pageToLayoutText(page));
    }
    return { full: pages.join('\n'), pages };
  }

  // ---- 2. Parse the layout text into questions/options/answers ----
  function parseAnswerKey(lines) {
    // Prefer the explicit header (2021); fall back to the densest "N. X" cluster (2019).
    let akStart = null;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('Answer Key for USMLE Step 2 CK Sample Test Questions') !== -1) akStart = i;
    }
    const akRe = /\b(\d{1,3})\.\s+([A-Z])\b/g;
    function harvest(from, to) {
      const ans = {};
      for (let i = from; i < to; i++) {
        let m; akRe.lastIndex = 0;
        const ln = lines[i];
        while ((m = akRe.exec(ln)) !== null) {
          const n = parseInt(m[1], 10);
          if (n >= 1 && n <= 120) ans[n] = m[2];
        }
      }
      return ans;
    }
    if (akStart !== null) {
      const ans = harvest(akStart, Math.min(lines.length, akStart + 90));
      if (Object.keys(ans).length >= 90) return ans;
    }
    // fallback: slide a window over the last third, pick the window with the most answers
    let best = {}, bestN = 0;
    const start = Math.floor(lines.length * 0.5);
    for (let i = start; i < lines.length; i += 5) {
      const ans = harvest(i, Math.min(lines.length, i + 60));
      if (Object.keys(ans).length > bestN) { best = ans; bestN = Object.keys(ans).length; }
    }
    return best;
  }

  // Where the answer key starts (so questions are bounded correctly). The 2021 PDF has the
  // "Answer Key…" header in the body; the 2019 PDF only has it in the TOC, so fall back to the
  // start of the last dense cluster of compact "N. X  N. X  N. X" answer rows.
  function answerKeyStart(lines) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].indexOf('Answer Key for USMLE Step 2 CK Sample Test Questions') !== -1) {
        if (i > lines.length * 0.4) return i;   // real key (body), not the TOC entry
        break;
      }
    }
    const isAkRow = ln => (ln.match(/\b\d{1,3}\.\s+[A-Z]\b/g) || []).length >= 3;
    let clusterStart = null, last = -99, result = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (isAkRow(lines[i])) {
        if (i - last > 5) clusterStart = i;
        last = i; result = clusterStart;
      }
    }
    return result;
  }

  function buildChain(text) {
    // all line-leading "N. " positions
    const itemRe = /^[ \t]*(\d+)\.[ \t]+/gm;
    const matches = [];
    let m;
    while ((m = itemRe.exec(text)) !== null) {
      matches.push({ n: parseInt(m[1], 10), start: m.index, end: m.index + m[0].length });
    }
    // Score a chain by how many items actually contain lettered "(A)" options. This
    // rejects the front-matter numbering (instructions/lab values are numbered too, but
    // have no options) in favor of the real question sequence.
    function scoreChain(chain) {
      let s = 0;
      for (let i = 0; i < chain.length; i++) {
        const bs = chain[i].end;
        const be = (i + 1 < chain.length) ? chain[i + 1].start : text.length;
        if (/\n[ \t]*\([A-Z]\)[ \t]/.test(text.slice(bs, Math.min(be, bs + 4000)))) s++;
      }
      return s;
    }
    // From each candidate "1.", greedily build the advancing-by-1 chain; keep the one
    // with the most option-bearing items (ties broken by length).
    let bestChain = [], bestScore = -1;
    for (let s = 0; s < matches.length; s++) {
      if (matches[s].n !== 1) continue;
      const chain = [];
      let target = 1, cursor = 0;
      for (let k = s; k < matches.length; k++) {
        const mm = matches[k];
        if (mm.start < cursor) continue;
        if (mm.n === target) { chain.push(mm); cursor = mm.end; target++; if (target > 120) break; }
      }
      const sc = scoreChain(chain);
      if (sc > bestScore || (sc === bestScore && chain.length > bestChain.length)) { bestChain = chain; bestScore = sc; }
    }
    return bestChain;
  }

  const INTRO_FORMS = [
    /(?:abstract|passage|graph|figure|table|chart)\b[\s\S]{0,260}?(?:[Qq]uestions?|[Ii]tems?)\s+#?(\d+)\s*[-–]\s*(\d+)\b[^\n]*/,
    /(?:Questions?|Items?)\s+#?(\d+)\s*[-–]\s*(\d+)\s+(?:are|use|refer)\s+(?:based|the\s+following|to)\b[^\n]*/
  ];
  function findIntro(text) {
    let best = null;
    for (const r of INTRO_FORMS) {
      const m = r.exec(text);
      if (m && (best === null || m.index < best.m.index)) best = { m: m, lo: parseInt(m[1], 10), hi: parseInt(m[2], 10) };
    }
    return best;
  }
  const URL_RE = /https?:\/\/\S+/g;

  // ---- Safe, general font-corruption repair (NBME's Free 120 PDF ships a broken
  // ToUnicode map). Only fully-unambiguous fixes: 1:1 symbol glyphs, and control
  // chars (never legitimate in text) shifted +29 back to the digit/space they encode.
  // Letter-level Caesar garble is NOT touched (genuine uppercase like hCG/MRI is
  // indistinguishable from shifted lowercase). ----
  function deGarbleSafe(s) {
    return s
      .replace(/ȝ/g, 'µ').replace(/ȕ/g, 'β').replace(/Į/g, 'α').replace(/í/g, '−')
      .replace(/[\x01-\x08\x0e-\x1f]/g, c => String.fromCharCode(c.charCodeAt(0) + 29))
      .replace(/[\x80-\x9f]/g, '');   // strip C1 control noise (never valid display text)
  }
  // Recover the font's Caesar-shifted words (every garbled glyph is exactly -29).
  // A 4+ uppercase/digit run is only un-shifted when it decodes to a plausible word
  // (all letters + a vowel); genuine acronyms (TABLE, VATER...) decode to junk with
  // ^ _ ` and are left untouched. The blocklist guards the rare acronym (GERD) that
  // would otherwise decode to a pseudo-word.
  const ACRONYM_KEEP = /^(GERD|COPD|NSAID|SIADH|NSTEMI|STEMI|PERRLA|HIPAA|HEENT|TABLE|VATER|EMTALA|EPCS)$/;
  function fixCaesarWords(s) {
    return s.replace(/[0-9A-Z]*[A-Z]{4,}[0-9A-Z]*/g, run => {
      if (ACRONYM_KEEP.test(run)) return run;
      const dec = run.replace(/[A-Z0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 29));
      return (/^[A-Za-z]+$/.test(dec) && /[aeiou]/.test(dec)) ? dec : run;
    });
  }
  // The handful of short, ambiguous tokens the general un-shift cannot safely touch
  // (µJ vs microjoules, LV vs left-ventricle). The Free 120 is a fixed document, so these
  // few factual lab values are corrected deterministically, anchored to clean surrounding
  // words so nothing else is affected. Repairing the spacing here also stops the table
  // detector from misfiring on the garbled line.
  function fixKnownGarble(s) {
    return s
      // 2021 Q64 (prolactinoma): "2.0 µU/mL and a prolactin concentration of 100"
      .replace(/2\.0\s+µ8\/P\/\s+DQG\s+D\s+prolactin/g, '2.0 µU/mL and a prolactin')
      .replace(/prolactin\s+concentration\s+RI\s+100/g, 'prolactin concentration of 100')
      // 2021 Q83 (MEN2A): "metanephrine concentration is 4000 µg/24 h (N=140-785)"
      .replace(/metanephrine\s+concentration\s+LV\s+4000\s+µJ\/24\s+K\s+1\s+140/g,
               'metanephrine concentration is 4000 µg/24 h (N=140')
      // restore the cubic-mm superscript dropped during PDF extraction (CBC counts: 1100/mm3)
      .replace(/(\d)\/mm3?(?![A-Za-z0-9³])/g, '$1/mm³');
  }
  function stripMarkers(s) {
    return s
      .replace(/\s*END OF SET\b.*$/s, '')
      .replace(/\s*USMLE STEP 2 CK SAMPLE TEST QUESTIONS.*$/s, '')
      .replace(/\s*Items?\s*#?\s*\d+\D{1,4}\d+\s+(?:are part of a sequential|are|refer)\b.*$/s, '');
  }

  function isTabular(blockLines) {
    let n = 0;
    for (const ln of blockLines) if (/\S {2,}\S/.test(ln)) n++;
    return n >= 2 && blockLines.length >= 2;
  }

  // ---- lab-panel aware stem rendering ----
  // pdf.js often merges the prose intro with the first lab row and the last lab row
  // with the trailing question. We split those off and group the whole panel into one table.
  function labParts(ln) {                                // split at the FIRST 2+ space gap (label | value)
    const m = ln.match(/^(\s*\S.*?\S)\s{2,}(\S.*)$/);
    return m ? [m[1].replace(/^\s+/, ''), m[2].trim()] : null;
  }
  function looksLikeValue(rhs) {
    if (/^[,;]/.test(rhs)) return false;                 // ", AST activity of..." => inline prose, not a value
    return /^[<>≥≤(]?\s*[\d.]/.test(rhs)
        || /^(negative|none|positive|trace|normal|moderate|present|absent|reactive|nonreactive|pending|numerous|markedly)\b/i.test(rhs)
        || /(mg\/dL|g\/dL|mEq\/L|\/mm|U\/L|ng\/mL|mm Hg|µ[A-Za-z]|%|seconds|\/hpf|mmol|µg|pg|fL|\/min|mOsm|× ?10|\/L\b)/.test(rhs);
  }
  function isLabish(ln) {
    const p = labParts(ln);
    if (!p) return false;
    const label = p[0];
    if (label.length > 46) return false;                 // long => prose sentence, not a lab row
    if (/[.?]\s/.test(label)) return false;              // sentence punctuation mid-label => prose
    if (label.split(/\s+/).length > 7) return false;     // too many words => prose
    return looksLikeValue(p[1]);
  }
  const LAB_HEADER_RE = /^\s*(Serum|Urine|Blood|Plasma|Whole blood|Hematology|Arterial blood gas(?: analysis)?|Cerebrospinal fluid|CSF|On Admission|Now)\s*:?\s*$/i;
  function splitMixedLabLine(ln) {
    const out = [];
    // prose intro ("...studies show:") + first lab row on the same line
    const pm = ln.match(/^(.*\b(?:show|shown|reveals?|follows|include|are)\s*:)\s+(\S.*\s{2,}\S.*)$/i);
    if (pm && isLabish(pm[2])) { out.push(pm[1]); ln = pm[2]; }
    // last lab row + trailing question ("...320,000/mm3 Which of the following...?")
    const sm = ln.match(/^(.*?\s{2,}\S.*?)\s+([A-Z][a-z]+(?:\s+\S+){3,}\?)\s*$/);
    if (sm && isLabish(sm[1])) { out.push(sm[1]); out.push(sm[2]); return out; }
    out.push(ln);
    return out;
  }
  function parseStem(stemRaw) {
    let lines = [];
    for (const raw of stemRaw.split('\n')) {
      for (const piece of splitMixedLabLine(raw.replace(/\s+$/, ''))) lines.push(piece);
    }
    const paras = [];
    const blank = s => !s.trim();
    const labRow = s => isLabish(s) || LAB_HEADER_RE.test(s);
    let i = 0;
    while (i < lines.length) {
      if (blank(lines[i])) { i++; continue; }
      if (labRow(lines[i])) {
        const block = [];
        while (i < lines.length) {
          if (blank(lines[i])) {                       // allow blank lines inside a panel
            let j = i + 1; while (j < lines.length && blank(lines[j])) j++;
            if (j < lines.length && labRow(lines[j])) { i = j; continue; }
            break;
          }
          if (labRow(lines[i])) { block.push(lines[i]); i++; } else break;
        }
        let indent = Infinity;
        for (const l of block) { if (!l.trim()) continue; const k = l.length - l.replace(/^ +/, '').length; if (k < indent) indent = k; }
        if (!isFinite(indent)) indent = 0;
        const tab = block.map(l => l.startsWith(' '.repeat(indent)) ? l.slice(indent) : l).join('\n');
        paras.push('[[TABLE]]\n' + tab);
      } else {
        const block = [];
        while (i < lines.length && !blank(lines[i]) && !labRow(lines[i])) { block.push(lines[i].trim()); i++; }
        paras.push(block.join(' '));
      }
    }
    return paras.filter(Boolean).join('\n\n').trim();
  }

  function parseFree120(full) {
    let lines = full.split('\n');
    const answers = parseAnswerKey(lines);
    // bound region: up to where the answer key actually starts (handles 2021 body header + 2019 TOC-only)
    const akStart = answerKeyStart(lines);
    let qaText = lines.slice(0, akStart).join('\n');
    qaText = qaText.replace(URL_RE, ' ').replace(/^[ \t]*\d+[ \t]*$/gm, '').replace(/Continued on Next Page/g, '');
    qaText = fixKnownGarble(fixCaesarWords(deGarbleSafe(qaText)));

    const chain = buildChain(qaText);
    const items = [];
    const sharedAbstracts = {};
    for (let i = 0; i < chain.length; i++) {
      const n = chain[i].n;
      const bodyStart = chain[i].end;
      const bodyEnd = (i + 1 < chain.length) ? chain[i + 1].start : qaText.length;
      let body = qaText.slice(bodyStart, bodyEnd);

      const intro = findIntro(body);
      if (intro && intro.m.index > 0) {
        let abs = body.slice(intro.m.index).replace(URL_RE, '').trim();
        const al = abs.split('\n');
        for (let idx = 0; idx < al.length; idx++) { if (al[idx].trim()) { al.splice(0, idx + 1); break; } }
        const cleaned = al.map(l => l.replace(/\s+$/, '')).join('\n').trim();
        const lo = Math.min(intro.lo, intro.hi), hi = Math.max(intro.lo, intro.hi);
        for (let qn = lo; qn <= hi; qn++) if (qn !== n) sharedAbstracts[qn] = cleaned;
        body = body.slice(0, intro.m.index);
      }
      body = stripMarkers(body);   // remove END OF SET / leftover instruction tails from stem + options

      const optRe = /^[ \t]*\(([A-Z])\)[ \t]+/gm;
      const optMatches = [];
      let om;
      while ((om = optRe.exec(body)) !== null) optMatches.push({ letter: om[1], start: om.index, end: om.index + om[0].length });
      const stemRaw = optMatches.length ? body.slice(0, optMatches[0].start) : body;
      const options = [];
      for (let j = 0; j < optMatches.length; j++) {
        const s = optMatches[j].end;
        const e = (j + 1 < optMatches.length) ? optMatches[j + 1].start : body.length;
        let chunk = body.slice(s, e);
        let cut = chunk.length;
        const gap = /\n\s*\n/.exec(chunk); if (gap) cut = Math.min(cut, gap.index);
        const i2 = INTRO_FORMS[0].exec(chunk); if (i2) cut = Math.min(cut, i2.index);
        const u = /https?:\/\/\S+/.exec(chunk); if (u) cut = Math.min(cut, u.index);
        chunk = chunk.slice(0, cut);
        options.push({ letter: optMatches[j].letter, text: stripMarkers(chunk).replace(/\s+/g, ' ').trim() });
      }
      items.push({ n: n, stem: parseStem(stemRaw), options: options, answer: answers[n] || '' });
    }
    for (const q of items) if (sharedAbstracts[q.n]) q.abstract = sharedAbstracts[q.n];

    const blocks = [];
    for (let b = 0; b < 6; b++) blocks.push({ n: b + 1, items: items.slice(b * 20, (b + 1) * 20) });
    return { questions: items, blocks: blocks, _answers: Object.keys(answers).length };
  }

  // ---- 3. Figure extraction: render each figure page, crop the embedded image
  // region by its bbox, return a data-URL per question. The page->question map is a
  // factual association for the fixed Free 120 document (not NBME text), so the
  // attachments are correct (matches the verified ground truth, incl. the 79->80 move).
  const FIG_MAPS = {
    '2021': {22:[25],23:[26],25:[33],32:[53,54],35:[60],40:[76],42:[80],45:[87],53:[107],55:[114]},
    '2019': {11:[6],16:[20],26:[49],30:[61],37:[84]}
  };
  function matMul(m, n) {
    return [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3],
            m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
  }
  // Which page holds the figure for a given item number (null if none).
  function figurePageForItem(year, n) {
    const map = FIG_MAPS[year] || {};
    for (const p in map) if (map[p].indexOf(n) !== -1) return parseInt(p, 10);
    return null;
  }
  // Render one figure page and crop its largest embedded image to a PNG data-URL.
  async function extractOneFigure(pdf, pageNum, scale) {
    scale = scale || 2;
    const OPS = (window.pdfjsLib || {}).OPS;
    if (!OPS || pageNum > pdf.numPages) return null;
    const page = await pdf.getPage(pageNum);
    const opl = await page.getOperatorList();
    let ctm = [1,0,0,1,0,0]; const stack = []; let best = null;
    for (let i = 0; i < opl.fnArray.length; i++) {
      const fn = opl.fnArray[i], a = opl.argsArray[i];
      if (fn === OPS.save) stack.push(ctm.slice());
      else if (fn === OPS.restore) ctm = stack.pop() || ctm;
      else if (fn === OPS.transform) ctm = matMul(ctm, a);
      else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintImageXObjectRepeat) {
        const w = Math.hypot(ctm[0], ctm[1]), h = Math.hypot(ctm[2], ctm[3]);
        if (w > 80 && h > 50 && (!best || w*h > best.w*best.h)) best = { x: ctm[4], y: ctm[5], w: w, h: h };
      }
    }
    if (!best) return null;
    const vp = page.getViewport({ scale: scale });
    const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
    await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    const pad = 4;
    let cx = best.x*scale - pad, cy = vp.height - (best.y + best.h)*scale - pad;
    let cw = best.w*scale + 2*pad, ch = best.h*scale + 2*pad;
    cx = Math.max(0, cx); cy = Math.max(0, cy);
    cw = Math.min(vp.width - cx, cw); ch = Math.min(vp.height - cy, ch);
    const o = document.createElement('canvas'); o.width = cw; o.height = ch;
    o.getContext('2d').drawImage(cv, cx, cy, cw, ch, 0, 0, cw, ch);
    return o.toDataURL('image/png');
  }
  // Eager extraction of all figures (kept for non-lazy callers).
  async function extractFigures(pdf, year, scale) {
    const map = FIG_MAPS[year] || {}, out = {};
    for (const pStr of Object.keys(map)) {
      const url = await extractOneFigure(pdf, parseInt(pStr, 10), scale);
      if (url) for (const n of map[pStr]) out[n] = url;
    }
    return out;
  }

  window.Free120Parser = {
    pdfToText: pdfToText, parse: parseFree120,
    extractFigures: extractFigures, extractOneFigure: extractOneFigure, figurePageForItem: figurePageForItem
  };
})();
