/* Free 120 engine. One copy of the exam for /free120step2021, /free120step2019 and the
   /free120 hub (your own PDF). Each page is a thin shell: it sets window.F120_CONFIG and
   window.SG (GA4 + the attributed store link), loads its data, then this file.

   What changed in the 2026-11 overhaul (docs/decisions in the app repo, "Free 120 overhaul"):
   - Three ways to sit it: test day (3 x 40, 60 min, a 45 min break bank), short blocks
     (6 x 20, 30 min) and tutor (no clock, the explanation right after each answer, no range).
   - Progress is saved per form AND per mode. Before this, 2021, 2019 and the hub all wrote
     the same localStorage keys, so one form's answers showed up as done on the other.
     claimLegacy() moves the old keys to the form they belong to (see there).
   - Results in the app look: the band chart with the next band, where the points went,
     pace, changed answers, marked questions, the block table, the NBME/UWSA box (the same
     readiness model as /readiness, compiled from lib/readiness.ts), a share image.
   - A two-pane review, labs docked beside the question on wide screens, a phone screen
     that sends the link to a laptop, in-page dialogs instead of confirm().

   Copy rules: no em or en dashes, no emoji, live features only. Under 65 percent gets NO
   band on purpose (six students in the set scored there; the research will not band six). */
(function () {
  'use strict';

  var CFG = window.F120_CONFIG || {};
  var SG = window.SG || { storeUrl: function () { return 'https://apps.apple.com/us/app/step-gunner/id6761317357'; }, track: function () {}, referrerHost: function () { return 'direct'; }, CT: 'free120' };

  /* ───────────────────────── utilities ───────────────────────── */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function fmtShort(sec) { // 1:05, 0:48, 12:30
    sec = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function fmtDur(sec) { // 2 hours 41 minutes
    var m = Math.round((sec || 0) / 60), h = Math.floor(m / 60), r = m % 60;
    var out = [];
    if (h) out.push(h + (h === 1 ? ' hour' : ' hours'));
    if (r || !h) out.push(r + (r === 1 ? ' minute' : ' minutes'));
    return out.join(' ');
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(ms) { var d = new Date(ms); return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function fmtClock(ms) {
    var d = new Date(ms), h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM' : ' PM');
  }
  function pctOf(c, t) { return t ? Math.round(100 * c / t) : 0; }
  function track(ev, params) { try { SG.track(ev, params || {}); } catch (e) { /* analytics never throws */ } }

  // Stroke icons in the SF Symbols register (no emoji anywhere in the UI).
  var IC = {
    pause: '<path d="M9 5v14M15 5v14"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    resume: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/>',
    laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
    keys: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
    down: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    up: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    share: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/>',
    upArrow: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    pin: '<path d="M12 17v5M8 3h8l-1 6 3 3v2H6v-2l3-3z"/>',
    ext: '<path d="M7 17L17 7M9 7h8v8"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    circle: '<circle cx="12" cy="12" r="8"/>'
  };
  function ic(name, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + IC[name] + '</svg>'; }
  function icRaw(name, w, stroke, sw) {
    return '<svg width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="none" stroke="' + (stroke || 'currentColor') + '" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[name] + '</svg>';
  }

  // An attributed App Store link. location = the GA4 slot; one ct per page (SG.CT).
  function storeLink(location, html, cls, extra) {
    return '<a class="' + (cls == null ? 'fx-btn' : cls) + '" href="' + esc(SG.storeUrl()) + '" target="_blank" rel="noopener noreferrer" data-store="' + esc(location) + '"' +
      (extra ? ' data-extra="' + esc(JSON.stringify(extra)) + '"' : '') + '>' + html + '</a>';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-store]');
    if (!a) return;
    var p = { source: SG.CT, location: a.getAttribute('data-store'), ref: SG.referrerHost() };
    try { var x = JSON.parse(a.getAttribute('data-extra') || 'null'); if (x) for (var k in x) p[k] = x[k]; } catch (err) { /* ignore */ }
    track('store_click', p);
  });

  /* ───────────────────────── constants ───────────────────────── */
  var MODES = {
    test: { per: 40, min: 60, clock: true, range: true, label: 'Test day', long: 'test day mode' },
    short: { per: 20, min: 30, clock: true, range: true, label: 'Short blocks', long: 'short blocks' },
    tutor: { per: 40, min: 0, clock: false, range: false, label: 'Tutor', long: 'tutor mode' }
  };
  var BREAK_BANK = 45 * 60;
  var FORMS = [
    { id: '2021', href: '/free120step2021', name: '2021 form' },
    { id: '2019', href: '/free120step2019', name: '2019 form' }
  ];

  // The band table from /research/free-120-to-step-2: 215 r/Step2 score reports carrying a
  // current-form percentage and a real score. q1/q3 = the middle half.
  var BANDS = [
    { min: 85, med: 270, q1: 265, q3: 273, n: 48 },
    { min: 80, med: 261, q1: 255, q3: 267, n: 50 },
    { min: 75, med: 256, q1: 252, q3: 261, n: 68 },
    { min: 70, med: 250, q1: 246, q3: 258, n: 31 },
    { min: 65, med: 247, q1: 242, q3: 251, n: 12 }
  ];
  function bandIndex(pct) { for (var i = 0; i < BANDS.length; i++) if (pct >= BANDS[i].min) return i; return -1; }

  var SYS_NAME = {
    'Reproductive/OB-GYN': 'OB-GYN', 'Renal/GU': 'Renal and GU', 'Musculoskeletal/Rheumatology': 'MSK and rheum',
    'Multisystem/General': 'Multisystem', 'Heme/Onc': 'Heme and onc', 'Infectious Disease': 'Infectious disease',
    'Biostatistics/Ethics': 'Biostats and ethics', 'Emergency/Critical Care': 'Emergency and ICU', 'OB/GYN': 'OB-GYN'
  };
  var SYS_CHIP = { 'Reproductive/OB-GYN': 'OB-GYN', 'Renal/GU': 'RENAL', 'Musculoskeletal/Rheumatology': 'MSK', 'Multisystem/General': 'MULTISYSTEM',
    'Heme/Onc': 'HEME ONC', 'Infectious Disease': 'ID', 'Gastrointestinal': 'GI', 'Cardiovascular': 'CARDIO', 'Pulmonary': 'PULM',
    'Neurology': 'NEURO', 'Psychiatry': 'PSYCH', 'Endocrine': 'ENDO', 'Dermatology': 'DERM' };
  function sysName(s) { return SYS_NAME[s] || s || 'Other'; }
  var SYS_SHORT = { 'Renal/GU': 'Renal', 'Heme/Onc': 'Heme-onc', 'Musculoskeletal/Rheumatology': 'MSK', 'Multisystem/General': 'Multisystem', 'Reproductive/OB-GYN': 'OB-GYN' };
  function sysShort(s) { return SYS_SHORT[s] || sysName(s); }

  var LABS = [
    ['Serum: electrolytes and chemistry', [
      ['Sodium (Na+)', '136 to 146 mEq/L', '136 to 146 mmol/L'], ['Potassium (K+)', '3.5 to 5.0 mEq/L', '3.5 to 5.0 mmol/L'],
      ['Chloride (Cl-)', '95 to 105 mEq/L', '95 to 105 mmol/L'], ['Bicarbonate (HCO3-)', '22 to 28 mEq/L', '22 to 28 mmol/L'],
      ['Urea nitrogen (BUN)', '7 to 18 mg/dL', '2.5 to 6.4 mmol/L'], ['Creatinine', '0.6 to 1.2 mg/dL', '53 to 106 µmol/L'],
      ['Glucose (fasting)', '70 to 100 mg/dL', '3.8 to 5.6 mmol/L'], ['Glucose (random, non-fasting)', '<140 mg/dL', '<7.77 mmol/L'],
      ['Calcium (total)', '8.4 to 10.2 mg/dL', '2.1 to 2.6 mmol/L'], ['Magnesium', '1.5 to 2.0 mg/dL', '0.75 to 1.0 mmol/L'],
      ['Phosphorus (inorganic)', '3.0 to 4.5 mg/dL', '1.0 to 1.5 mmol/L'], ['Osmolality', '275 to 295 mOsmol/kg', '275 to 295 mOsmol/kg'],
      ['Uric acid', '3.0 to 8.2 mg/dL', '0.18 to 0.48 mmol/L']]],
    ['Serum: hepatic and pancreatic', [
      ['ALT', '10 to 40 U/L', '10 to 40 U/L'], ['AST', '12 to 38 U/L', '12 to 38 U/L'], ['Alkaline phosphatase', '25 to 100 U/L', '25 to 100 U/L'],
      ['Amylase', '25 to 125 U/L', '25 to 125 U/L'], ['Lipase', '10 to 140 U/L', '10 to 140 U/L'], ['Bilirubin, total', '0.1 to 1.0 mg/dL', '2 to 17 µmol/L'],
      ['Bilirubin, direct', '0.0 to 0.3 mg/dL', '0 to 5 µmol/L'], ['Total protein', '6.0 to 7.8 g/dL', '60 to 78 g/L'], ['Albumin', '3.5 to 5.5 g/dL', '35 to 55 g/L'],
      ['Globulin', '2.3 to 3.5 g/dL', '23 to 35 g/L'], ['Ammonia', '11 to 35 µmol/L', '11 to 35 µmol/L']]],
    ['Serum: lipids', [
      ['Cholesterol, total', 'Desirable <200 mg/dL', '<5.2 mmol/L'], ['HDL', '40 to 60 mg/dL', '1.0 to 1.6 mmol/L'], ['LDL', '<160 mg/dL', '<4.2 mmol/L'],
      ['Triglycerides', '<150 mg/dL', '<1.70 mmol/L']]],
    ['Serum: iron studies', [
      ['Ferritin (M)', '20 to 250 ng/mL', '20 to 250 µg/L'], ['Ferritin (F)', '10 to 120 ng/mL', '10 to 120 µg/L'], ['Iron (M)', '65 to 175 µg/dL', '11.6 to 31.3 µmol/L'],
      ['Iron (F)', '50 to 170 µg/dL', '9.0 to 30.4 µmol/L'], ['Total iron-binding capacity', '250 to 400 µg/dL', '44.8 to 71.6 µmol/L'],
      ['Transferrin', '200 to 360 mg/dL', '2.0 to 3.6 g/L'], ['Transferrin saturation', '20% to 50%', '0.20 to 0.50']]],
    ['Serum: endocrine', [
      ['TSH', '0.4 to 4.0 µU/mL', '0.4 to 4.0 mIU/L'], ['Free T4', '0.9 to 1.7 ng/dL', '12.0 to 21.9 pmol/L'], ['Thyroxine (T4)', '5 to 12 µg/dL', '64 to 155 nmol/L'],
      ['T3 (RIA)', '100 to 200 ng/dL', '1.5 to 3.1 nmol/L'], ['Intact PTH', '10 to 60 pg/mL', '10 to 60 ng/L'], ['Cortisol (0800 h)', '5 to 23 µg/dL', '138 to 635 nmol/L'],
      ['Cortisol (1600 h)', '3 to 15 µg/dL', '82 to 413 nmol/L'], ['ACTH', '<80 pg/mL (a.m.)', '<17.6 pmol/L'], ['Prolactin (M)', '<17 ng/mL', '<17 µg/L'],
      ['Prolactin (F, non-pregnant)', '<25 ng/mL', '<25 µg/L'], ['FSH (M)', '4 to 25 mIU/mL', '4 to 25 IU/L'], ['FSH (F, follicular)', '4 to 30 mIU/mL', '4 to 30 IU/L'],
      ['FSH (F, postmenopausal)', '40 to 250 mIU/mL', '40 to 250 IU/L'], ['LH (M)', '6 to 23 mIU/mL', '6 to 23 IU/L'], ['Insulin (fasting)', '5 to 20 µU/mL', '36 to 144 pmol/L'],
      ['C-peptide (fasting)', '0.5 to 2.0 ng/mL', '0.17 to 0.66 nmol/L'], ['Hemoglobin A1c', '≤6%', '≤42 mmol/mol']]],
    ['Serum: cardiac and muscle', [
      ['Troponin I', '≤0.04 ng/mL', '≤0.04 µg/L'], ['BNP', '<100 pg/mL', '<100 ng/L'], ['NT-proBNP', '<300 pg/mL', '<300 ng/L'],
      ['Creatine kinase (M)', '25 to 90 U/L', '25 to 90 U/L'], ['Creatine kinase (F)', '10 to 70 U/L', '10 to 70 U/L'], ['CK-MB', '<6%', '<0.06'],
      ['Lactate dehydrogenase', '45 to 200 U/L', '45 to 200 U/L']]],
    ['Serum: immunoglobulins', [
      ['IgA', '76 to 390 mg/dL', '0.76 to 3.90 g/L'], ['IgE', '0 to 380 IU/mL', '0 to 380 kIU/L'], ['IgG', '650 to 1500 mg/dL', '6.5 to 15.0 g/L'],
      ['IgM', '50 to 300 mg/dL', '0.5 to 3.0 g/L']]],
    ['Hematology: complete blood count', [
      ['Hematocrit (M)', '41% to 53%', '0.41 to 0.53'], ['Hematocrit (F)', '36% to 46%', '0.36 to 0.46'], ['Hemoglobin (M)', '13.5 to 17.5 g/dL', '135 to 175 g/L'],
      ['Hemoglobin (F)', '12.0 to 16.0 g/dL', '120 to 160 g/L'], ['MCV', '80 to 100 fL', '80 to 100 fL'], ['MCH', '25 to 35 pg/cell', '0.39 to 0.54 fmol/cell'],
      ['MCHC', '31% to 36% Hb/cell', '4.8 to 5.6 mmol Hb/L'], ['RDW', '11.5% to 14.5%', '0.115 to 0.145'], ['WBC', '4500 to 11,000/mm³', '4.5 to 11.0 × 10⁹/L'],
      ['Neutrophils, segmented', '54% to 62%', '0.54 to 0.62'], ['Neutrophils, bands', '3% to 5%', '0.03 to 0.05'], ['Lymphocytes', '25% to 33%', '0.25 to 0.33'],
      ['Monocytes', '3% to 7%', '0.03 to 0.07'], ['Eosinophils', '1% to 3%', '0.01 to 0.03'], ['Basophils', '0% to 0.75%', '0.00 to 0.0075'],
      ['Platelet count', '150,000 to 400,000/mm³', '150 to 400 × 10⁹/L'], ['Reticulocytes', '0.5% to 1.5%', '0.005 to 0.015'],
      ['ESR (M)', '0 to 15 mm/h', '0 to 15 mm/h'], ['ESR (F)', '0 to 20 mm/h', '0 to 20 mm/h']]],
    ['Hematology: coagulation', [
      ['PT', '11 to 15 seconds', '11 to 15 s'], ['PTT (activated)', '25 to 40 seconds', '25 to 40 s'], ['INR', '0.9 to 1.1', '0.9 to 1.1'],
      ['D-dimer', '≤250 ng/mL', '≤1.4 nmol/L'], ['Fibrinogen', '200 to 400 mg/dL', '2.0 to 4.0 g/L'], ['Bleeding time', '2 to 7 minutes', '']]],
    ['Blood gases (arterial, room air)', [
      ['pH', '7.35 to 7.45', ''], ['PaO2', '75 to 105 mm Hg', '10.0 to 14.0 kPa'], ['PaCO2', '33 to 45 mm Hg', '4.4 to 5.9 kPa'],
      ['HCO3-', '22 to 28 mEq/L', '22 to 28 mmol/L'], ['O2 saturation', '≥95%', '']]],
    ['Urine', [
      ['Calcium', '100 to 300 mg/24 h', '2.5 to 7.5 mmol/24 h'], ['Creatinine clearance (M)', '97 to 137 mL/min', ''], ['Creatinine clearance (F)', '88 to 128 mL/min', ''],
      ['Osmolality', '50 to 1200 mOsmol/kg', ''], ['Proteins, total', '<150 mg/24 h', '<0.15 g/24 h'], ['Specific gravity', '1.001 to 1.035', ''],
      ['pH', '4.5 to 8.0', ''], ['Sodium', '100 to 260 mEq/24 h', '100 to 260 mmol/24 h'], ['Microalbumin (random)', '<30 mg/g Cr', '']]],
    ['CSF', [
      ['Opening pressure', '70 to 180 mm H₂O', ''], ['Glucose', '40 to 70 mg/dL', '2.2 to 3.9 mmol/L (≥60% of serum)'], ['Protein', '<40 mg/dL', '<0.40 g/L'],
      ['Cell count', '0 to 5 lymphocytes/mm³', ''], ['Chloride', '118 to 132 mEq/L', '118 to 132 mmol/L']]],
    ['Vital and body', [['Body mass index (BMI)', 'Adult: 19 to 25 kg/m²', '']]]
  ];

  /* ───────────────────────── storage ─────────────────────────
     free120:settings                {fontSize, dark, mode}
     free120:<form>:<mode>:prog      {blockIdx: {answers, marks, completed, timeSpent, timeOnItem, changes, firstAnswer, when}}
     free120:<form>:<mode>:inprog    the open block (survives a refresh)
     free120:<form>:<mode>:meta      {breakUsed, finishedAt, finishTracked}
     free120:nbme                    the NBME/UWSA rows typed on results (shared by every form)
     Every key starts with "free120" so the backup file carries old and new alike. */
  function lsGet(k, fb) { try { var v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  function lsKeys(prefix) {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(prefix) === 0) out.push(k); } } catch (e) { /* ignore */ }
    return out;
  }
  function K(form, mode, kind) { return 'free120:' + form + ':' + mode + ':' + kind; }

  var settings = (function () {
    var s = lsGet('free120:settings', null);
    if (s) return { fontSize: s.fontSize || 'md', dark: !!s.dark, mode: MODES[s.mode] ? s.mode : 'test' };
    var old = lsGet('free120_settings_v1', {}) || {};
    // The old blockMode was saved with every settings change, so '20' does not mean it was
    // chosen. Read the mode from where the answers actually are.
    var mode = lsGet('free120_prog40_v1', null) || lsGet('free120_inprog40_v1', null) ? 'test'
      : (lsGet('free120_prog_v2', null) || lsGet('free120_inprog_v1', null) ? 'short' : 'test');
    return { fontSize: old.fontSize || 'md', dark: !!old.dark, mode: mode };
  })();
  function saveSettings() { lsSet('free120:settings', settings); }

  /* ───────────────────────── data ───────────────────────── */
  var FORM = CFG.form || null;      // '2021' | '2019'; on the hub, set once a PDF is read
  var DATA = null;                  // {questions, blocks}
  var META = {};                    // per question: system, discipline, topic, explanation, stem/abstract/images fixes
  var KEY = {};                     // n -> answer letter
  var ITEMS = [];                   // the 120 in order
  var BLOCKS = [];                  // the active grouping for settings.mode

  function deGarble(s) {
    return s == null ? s : String(s)
      .replace(/ȝ/g, 'µ').replace(/ȕ/g, 'β').replace(/Į/g, 'α').replace(/í/g, '−')
      .replace(/[\x01-\x08\x0e-\x1f]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) + 29); })
      .replace(/[\x80-\x9f]/g, '')
      .replace(/(\d)\/mm3?(?![A-Za-z0-9³])/g, '$1/mm³')
      .replace(/cm\s+H\s*2\s*[0O]\b/g, 'cm H₂O');
  }
  function useData(data, meta) {
    DATA = data; META = meta || {};
    ITEMS = (data.blocks || []).reduce(function (a, b) { return a.concat(b.items); }, []);
    KEY = {}; ITEMS.forEach(function (it) { KEY[it.n] = it.answer; });
    rebuildBlocks();
  }
  function bakedData() {
    var data = window.FREE120, meta = window.FREE120_META || {};
    if (!data || !data.blocks) return false;
    var figs = CFG.figs || {};
    Object.keys(figs).forEach(function (n) {
      meta[n] = meta[n] || {};
      if (!(meta[n].images && meta[n].images.length)) meta[n].images = [figs[n]];
    });
    var fix = function (q) { q.stem = deGarble(q.stem); (q.options || []).forEach(function (o) { o.text = deGarble(o.text); }); };
    (data.questions || []).forEach(fix);
    (data.blocks || []).forEach(function (b) { (b.items || []).forEach(fix); });
    var patch = CFG.metaPatch || {};
    Object.keys(patch).forEach(function (n) { meta[n] = Object.assign(meta[n] || {}, patch[n]); });
    useData(data, meta);
    return true;
  }
  function rebuildBlocks() {
    var per = MODES[settings.mode].per;
    BLOCKS = [];
    for (var i = 0; i < ITEMS.length; i += per) BLOCKS.push({ n: BLOCKS.length + 1, items: ITEMS.slice(i, i + per) });
  }
  function mode() { return MODES[settings.mode]; }
  function blockSec() { return mode().min * 60; }

  function loadProg(form, m) { return lsGet(K(form || FORM, m || settings.mode, 'prog'), {}) || {}; }
  function saveProg(p) { lsSet(K(FORM, settings.mode, 'prog'), p); }
  function loadMeta(form, m) { return lsGet(K(form || FORM, m || settings.mode, 'meta'), {}) || {}; }
  function saveMeta(x) { lsSet(K(FORM, settings.mode, 'meta'), x); }
  function loadInprog(form, m) { return lsGet(K(form || FORM, m || settings.mode, 'inprog'), null); }
  function clearInprog() { lsDel(K(FORM, settings.mode, 'inprog')); }
  function nBlocks(m) { return Math.ceil(120 / MODES[m].per); }
  function doneCount(prog, m) { var c = 0; for (var i = 0; i < nBlocks(m); i++) if (prog[i] && prog[i].completed) c++; return c; }
  function allDone(prog, m) { return doneCount(prog, m) === nBlocks(m); }

  /* The 2021 page, the 2019 page and the hub all saved to the SAME keys until 2026-11. The
     first page to load after the change claims the old answers when they fit its answer key:
     a real sitting scores well above chance against its own form (students land 55 to 85
     percent) and near chance against the other form's key. Under 40 percent on 10+
     answers = they belong to the other form, so leave them for it. Old keys stay put. */
  function claimLegacy() {
    if (!FORM || !ITEMS.length) return;
    var claims = lsGet('free120:legacyClaim', {}) || {};
    [['20', 'free120_prog_v2', 'free120_inprog_v1', 'short'], ['40', 'free120_prog40_v1', 'free120_inprog40_v1', 'test']].forEach(function (L) {
      if (claims[L[0]]) return;
      var prog = lsGet(L[1], null), ip = lsGet(L[2], null);
      if (!prog && !ip) return;
      if (lsGet(K(FORM, L[3], 'prog'), null) || lsGet(K(FORM, L[3], 'inprog'), null)) return;
      var hit = 0, tot = 0;
      function score(ans) { Object.keys(ans || {}).forEach(function (n) { tot++; if (KEY[n] && ans[n] === KEY[n]) hit++; }); }
      Object.keys(prog || {}).forEach(function (b) { score((prog[b] || {}).answers); });
      if (ip) score(ip.answers);
      if (tot >= 10 && hit / tot < 0.4) return;
      if (prog) lsSet(K(FORM, L[3], 'prog'), prog);
      if (ip) lsSet(K(FORM, L[3], 'inprog'), ip);
      claims[L[0]] = FORM;
      lsSet('free120:legacyClaim', claims);
    });
  }

  /* ───────────────────────── shell ───────────────────────── */
  var VIEWS = ['f-start', 'f-exam', 'f-inter', 'f-results', 'f-review', 'f-phone'];
  function header(cur) {
    return '<header class="fx-top"><div class="in">' +
      '<a class="fx-wm" href="/" aria-label="Step Gunner home"><span class="d" aria-hidden="true"></span><span class="w1">STEP</span><span class="w2">GUNNER</span></a>' +
      '<nav aria-label="Main"><a href="/wards">On the wards</a><a href="/guides">Shelf exams</a><a href="/readiness" class="cur">Step 2</a><a href="/research">Research</a></nav>' +
      '<div class="r"><a class="fx-pro" href="/pro">PRO</a>' + storeLink(cur || 'header', 'Get the app', 'fx-btn sm') + '</div>' +
      '</div></header>';
  }

  function injectShell() {
    var start = $('f-start');
    if (!start) { start = document.createElement('div'); start.id = 'f-start'; document.body.insertBefore(start, document.body.firstChild); }
    start.classList.add('fx', 'fx-view');
    // The page ships its own hero (h1 + intro) inside #f-start for search engines; keep it.
    var hero = start.querySelector('.fx-hero');
    start.innerHTML = header('header') + '<main class="fx-main" id="f-start-main"></main>';
    if (hero) $('f-start-main').appendChild(hero);
    var host = document.createElement('div');
    host.innerHTML =
      '<div id="f-exam" class="exam" style="display:none">' +
        '<div class="topnav">' +
          '<span class="brand">USMLE Step 2 CK</span><span class="sep"></span>' +
          '<span class="block-label" id="block-label">Block 1</span><span class="item-label" id="item-label">Item 1 of 40</span>' +
          '<span class="tutor-pill" id="tutor-pill" hidden>TUTOR</span>' +
          '<span class="timer" id="timer">60:00</span>' +
          '<button class="nav-btn" id="btn-pause" type="button">' + icRaw('pause', 14) + '<span>Pause</span></button>' +
          '<button class="nav-btn" id="btn-labs" type="button" aria-pressed="false">' + icRaw('flask', 14) + '<span>Lab Values</span></button>' +
          '<button class="nav-btn" id="btn-calc" type="button">' + icRaw('calc', 14) + '<span>Calculator</span></button>' +
          '<button class="nav-btn" id="btn-settings" type="button">' + icRaw('sliders', 14) + '<span>Settings</span></button>' +
          '<button class="nav-btn danger" id="btn-quit" type="button">End Block</button>' +
        '</div>' +
        '<div class="main">' +
          '<div class="item-rail" id="item-rail" aria-label="Questions in this block"></div>' +
          '<div class="qbox" id="qbox">' +
            '<div class="qhead"><span class="qnum" id="qnum">Item 1</span>' +
              '<label class="mark" id="mark-label"><input type="checkbox" id="mark-cb"> Mark for review</label>' +
              '<span class="saved" id="saved">' + icRaw('check', 13, '#1a7f3a', 2.6) + 'SAVED</span></div>' +
            '<div class="qabstract" id="qabstract" style="display:none"></div>' +
            '<div class="qstem" id="qstem"></div>' +
            '<div class="qimages" id="qimages"></div>' +
            '<div class="opt-header" id="opt-header" style="display:none"></div>' +
            '<ul class="opts" id="opts"></ul>' +
            '<div class="explain" id="explanation" style="display:none"></div>' +
          '</div>' +
          '<aside class="labs" id="labs" aria-label="Lab values">' +
            '<div class="labs-head"><h2>Lab values</h2>' +
              '<input type="search" id="lab-search" class="lab-search" placeholder="Search labs (sodium, TSH)" aria-label="Search lab values">' +
              '<button class="close" id="labs-close" type="button" aria-label="Close lab values">' + icRaw('x', 16, '#fff', 2.2) + '</button></div>' +
            '<div class="labs-body" id="labs-body"></div>' +
            '<p class="labs-note">Docked beside the question on a wide screen, so the stem stays in view.</p>' +
          '</aside>' +
          '<div class="labs-backdrop" id="labs-back"></div>' +
        '</div>' +
        '<div class="controls">' +
          '<button id="btn-prev" type="button">Previous</button><button id="btn-next" type="button">Next</button>' +
          '<span class="keys" aria-hidden="true"><kbd>A</kbd>to<kbd>E</kbd>answer <kbd>N</kbd>next <kbd>M</kbd>mark <kbd>L</kbd>labs</span>' +
          '<span class="status" id="status"></span>' +
        '</div>' +
      '</div>' +
      '<div id="f-inter" style="display:none"></div>' +
      '<div id="f-results" class="fx fx-view" style="display:none"></div>' +
      '<div id="f-review" class="fx fx-view" style="display:none"></div>' +
      '<div id="f-phone" class="fx fx-view" style="display:none"></div>' +
      // end-of-block review grid
      '<div class="review-screen" id="block-review"><div class="review-card">' +
        '<h2 id="rv-title">Review: Block 1</h2>' +
        '<div class="rv-sub">Click any item to go back to it. The clock keeps running until you submit.</div>' +
        '<div class="rv-legend"><span><i class="rv-dot" style="background:#dcfce7;border-color:#86efac"></i> Answered</span><span><i class="rv-dot" style="background:#fff"></i> Blank</span><span><i class="rv-dot" style="background:var(--warn)"></i> Marked</span></div>' +
        '<div class="rv-grid" id="rv-grid"></div><div class="rv-sub" id="rv-counts"></div>' +
        '<div class="actions"><button id="rv-return" type="button">Back to the block</button><button class="primary" id="rv-submit" type="button">Submit block</button></div>' +
      '</div></div>' +
      // settings
      '<div class="settings-pop" id="settings-pop" role="dialog" aria-label="Display settings"><h3>Display</h3>' +
        '<div class="row">Font size<div class="seg" id="seg-font"><button data-fs="sm" type="button">A-</button><button data-fs="md" type="button">A</button><button data-fs="lg" type="button">A+</button></div></div>' +
        '<div class="row">Reverse colors<div class="seg" id="seg-dark"><button data-dark="0" type="button">Light</button><button data-dark="1" type="button">Dark</button></div></div>' +
        '<div class="note">How you sit it (test day, short blocks, tutor) is picked on the start page.</div>' +
      '</div>' +
      // calculator
      '<div class="calc" id="calc"><div class="calc-head" id="calc-head">Calculator <span class="close" id="calc-close" role="button" aria-label="Close calculator">×</span></div>' +
        '<div class="calc-disp" id="calc-disp">0</div><div class="calc-keys" id="calc-keys">' +
        '<button class="op" data-k="C">C</button><button class="op" data-k="←">←</button><button class="op" data-k="%">%</button><button class="op" data-k="/">÷</button>' +
        '<button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button><button class="op" data-k="*">×</button>' +
        '<button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button><button class="op" data-k="-">−</button>' +
        '<button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button><button class="op" data-k="+">+</button>' +
        '<button data-k="0">0</button><button data-k=".">.</button><button class="eq" data-k="=" style="grid-column:span 2">=</button>' +
      '</div></div>' +
      // dialog + share preview
      '<div class="fx-dlg" id="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-t"><div class="box"><div class="t" id="dlg-t"></div><div class="b" id="dlg-b"></div><div class="row" id="dlg-row"></div></div></div>' +
      '<div class="fx-share" id="share" role="dialog" aria-modal="true" aria-label="Share your result"><div class="box"></div></div>' +
      '<input type="file" id="import-file" accept="application/json" style="display:none">';
    while (host.firstChild) document.body.appendChild(host.firstChild);
  }

  function showView(id) {
    VIEWS.forEach(function (v) { var el = $(v); if (el) el.style.display = (v === id) ? '' : 'none'; });
    var ex = $('f-exam');
    if (ex) ex.classList.toggle('live', id === 'f-exam');
    try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
  }
  function curView() { for (var i = 0; i < VIEWS.length; i++) { var el = $(VIEWS[i]); if (el && el.style.display !== 'none') return VIEWS[i]; } return null; }

  // In-page dialog. buttons = [{label, value, cls}]. Resolves with the clicked value (Escape = null).
  var dlgResolve = null;
  function ask(title, body, buttons) {
    return new Promise(function (resolve) {
      $('dlg-t').textContent = title;
      $('dlg-b').textContent = body;
      var row = $('dlg-row'); row.innerHTML = '';
      buttons.forEach(function (b) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = b.label; if (b.cls) btn.className = b.cls;
        btn.addEventListener('click', function () { closeDlg(b.value); });
        row.appendChild(btn);
      });
      dlgResolve = resolve;
      $('dlg').classList.add('open');
      var last = row.lastChild; if (last) last.focus();
    });
  }
  function closeDlg(v) { $('dlg').classList.remove('open'); var r = dlgResolve; dlgResolve = null; if (r) r(v); }
  function confirmBox(title, body, okLabel, danger) {
    return ask(title, body, [{ label: 'Cancel', value: false }, { label: okLabel, value: true, cls: danger ? 'danger' : 'ok' }]);
  }

  /* ───────────────────────── start ───────────────────────── */
  var pdfOpen = false;
  function formStatus(fid) {
    // Finished beats in progress; test day beats short blocks; tutor never counts as a sitting.
    var best = null;
    ['test', 'short'].forEach(function (m) {
      var p = loadProg(fid, m);
      if (allDone(p, m)) {
        var meta = loadMeta(fid, m), c = 0, t = 0;
        Object.keys(p).forEach(function (b) { var a = (p[b] || {}).answers || {}; Object.keys(a).forEach(function (n) { if (lsKeyFor(fid, n) && a[n] === lsKeyFor(fid, n)) c++; }); });
        var fin = meta.finishedAt || lastWhen(p);
        if (!best || best.kind !== 'done' || fin > best.when) best = { kind: 'done', mode: m, when: fin, correct: c };
      }
    });
    if (best) return best;
    var ans = 0, m2 = null;
    ['test', 'short', 'tutor'].forEach(function (m) {
      var p = loadProg(fid, m), ip = loadInprog(fid, m), a = 0;
      Object.keys(p).forEach(function (b) { a += Object.keys((p[b] || {}).answers || {}).length; });
      if (ip) a += Object.keys(ip.answers || {}).length;
      if (a > ans) { ans = a; m2 = m; }
    });
    return ans ? { kind: 'progress', mode: m2, answered: ans } : { kind: 'none' };
  }
  // Another form's answer key is not loaded on this page, so a finished OTHER form shows its
  // date only; its percentage is stored when it finishes (meta.pct).
  function lsKeyFor(fid, n) { return fid === FORM ? KEY[n] : null; }
  function lastWhen(p) { var w = 0; Object.keys(p).forEach(function (b) { if (p[b] && p[b].when > w) w = p[b].when; }); return w; }

  function anyInprog() {
    // The open block to offer first: this form and mode, then anything else on this browser.
    var list = [];
    lsKeys('free120:').forEach(function (k) {
      var m = k.match(/^free120:(\d{4}):(test|short|tutor):inprog$/);
      if (!m) return;
      var ip = lsGet(k, null);
      if (ip && ip.answers) list.push({ form: m[1], mode: m[2], ip: ip });
    });
    list.sort(function (a, b) {
      var sa = (a.form === FORM ? 2 : 0) + (a.mode === settings.mode ? 1 : 0), sb = (b.form === FORM ? 2 : 0) + (b.mode === settings.mode ? 1 : 0);
      return sb - sa || (b.ip.when || 0) - (a.ip.when || 0);
    });
    return list[0] || null;
  }

  function renderStart() {
    var main = $('f-start-main');
    var hero = main.querySelector('.fx-hero');
    main.innerHTML = '';
    if (hero) main.appendChild(hero);
    var html = '';

    // Resume banner
    var open = anyInprog();
    if (open) {
      var per = MODES[open.mode].per, nb = Math.ceil(120 / per);
      var formName = open.form + ' form';
      var clock = MODES[open.mode].clock ? ' <b>' + fmtTime(open.ip.remaining) + '</b> left on that block\'s clock.' : '';
      var here = open.form === FORM;
      html += '<section class="fx-resume" aria-label="Resume"><span class="ico">' + ic('resume') + '</span>' +
        '<div class="t"><b>Pick up where you stopped</b><span>' + esc(formName) + ', ' + esc(MODES[open.mode].long) + '. Block ' + (open.ip.blockIdx + 1) + ' of ' + nb +
        ', question ' + ((open.ip.itemIdx || 0) + 1) + '.' + clock + '</span></div>' +
        (here ? '<button class="fx-btn" type="button" id="btn-resume" data-mode="' + open.mode + '">Resume block ' + (open.ip.blockIdx + 1) + ic('arrow') + '</button>'
              : '<a class="fx-btn" href="' + (open.form === '2019' ? '/free120step2019' : '/free120step2021') + '">Resume on the ' + esc(formName) + ic('arrow') + '</a>') +
        '</section>';
    }

    // 01 Choose a form
    html += '<section class="fx-sec"><h2 class="fx-h2"><span class="n">01</span>Choose a form</h2><div class="fx-cards">';
    FORMS.forEach(function (f) {
      var sel = f.id === FORM;
      var st = formStatus(f.id), foot = '';
      if (st.kind === 'done') {
        var pm = loadMeta(f.id, st.mode), pc = pm.pct != null ? pm.pct : (sel ? pctOf(st.correct, 120) : null);
        foot = '<span class="st done">' + icRaw('check', 15, 'currentColor', 2.4) + 'Finished ' + fmtDate(st.when) + (pc != null ? ' · ' + pc + '%' : '') +
          (sel ? '<button class="fx-linkbtn go" type="button" data-results="' + st.mode + '">See results</button>' : '<span class="go">See results</span>') + '</span>';
      } else if (st.kind === 'progress') {
        if (sel && st.mode === settings.mode) foot = progBar(loadProg(f.id, st.mode), loadInprog(f.id, st.mode), st.mode);
        foot += '<span class="st">In progress · ' + st.answered + ' of 120 answered' + (st.mode !== settings.mode ? ' (' + MODES[st.mode].long + ')' : '') + '</span>';
      } else {
        foot = '<span class="st">Not started</span>';
      }
      var inner = '<span class="k"><span>' + (sel ? 'BUILT IN · SELECTED' : 'BUILT IN') + '</span>' + (sel ? icRaw('check', 20, 'currentColor', 2.2) : '') + '</span>' +
        '<span class="nm">' + esc(f.name) + '</span><span class="ds">120 questions with our own explanation for every one.</span><span class="ft">' + foot + '</span>';
      var href = f.href + (st.kind === 'done' ? '#results' : '');
      html += sel ? '<div class="fx-form sel">' + inner + '</div>' : '<a class="fx-form" href="' + href + '">' + inner + '</a>';
    });
    var pdfSel = CFG.source === 'pdf' && FORM;
    html += (CFG.source === 'pdf'
      ? '<button type="button" class="fx-form pdf" id="btn-pdf" style="text-align:left;border:0;cursor:pointer;font:inherit">'
      : '<a class="fx-form pdf" href="/free120#pdf">') +
      '<span class="k"><span>' + (pdfSel ? 'YOUR PDF · ' + FORM + ' · SELECTED' : 'YOUR PDF') + '</span></span><span class="nm">A newer form</span>' +
      '<span class="ds">Download the current Free 120 PDF from the NBME and drop it here. Read in your browser, never uploaded.</span>' +
      '<span class="ft"><span class="fx-btn2" style="align-self:flex-start">' + ic('up') + 'Choose PDF</span></span>' +
      (CFG.source === 'pdf' ? '</button>' : '</a>');
    html += '</div>';
    if (CFG.source === 'pdf') html += pdfPanel();
    html += '</section>';

    if (FORM) {
      // 02 Choose how to sit it
      html += '<section class="fx-sec"><h2 class="fx-h2"><span class="n">02</span>Choose how to sit it</h2><div class="fx-cards" role="radiogroup" aria-label="How to sit it">' +
        modeCard('test', 'CLOSEST TO THE REAL THING', '3 blocks of 40, 60 minutes each. A 45 minute break bank between blocks, like the real day. Answers stay hidden until the end.') +
        modeCard('short', 'OVER A FEW DAYS', '6 blocks of 20, 30 minutes each. Same 90 seconds a question, in sittings that fit around rotations.') +
        modeCard('tutor', 'FOR A SECOND PASS', 'Answer, then read the explanation right away. No clock. Good for a form you have already sat.') +
        '</div></section>';

      // Go panel
      var prog = loadProg(), nb = BLOCKS.length, dc = doneCount(prog, settings.mode);
      var next = -1; for (var i = 0; i < nb; i++) if (!(prog[i] && prog[i].completed)) { next = i; break; }
      var copy = {
        test: ['About 3 hours', 'Plus whatever break you take.'],
        short: ['30 minutes a sitting', 'Six sittings, any days you like.'],
        tutor: ['Your own pace', 'No clock, no pressure.']
      }[settings.mode];
      var label = next === -1 ? 'See your results'
        : (settings.mode === 'tutor' ? (dc ? 'Continue tutor: block ' + (next + 1) + ' of ' + nb : 'Start in tutor mode') : 'Start block ' + (next + 1) + ' of ' + nb);
      html += '<section class="fx-go"><div class="fx-facts">' +
        '<div>' + ic('laptop') + '<span><b>Laptop or desktop</b><small>Lab values sit beside the question.</small></span></div>' +
        '<div>' + ic('clock') + '<span><b>' + copy[0] + '</b><small>' + copy[1] + '</small></span></div>' +
        '<div>' + ic('keys') + '<span><b>Keys work</b><small>A to E answers, N next, P back, M marks, L labs.</small></span></div>' +
        '</div><div class="fx-gorow"><button type="button" class="fx-btn big" id="btn-go" data-next="' + next + '">' + label + ic('arrow') + '</button>' +
        '<span class="note">Every click saves. Close the tab and come back any time, on this browser.</span></div>';
      if (dc || prog[next]) {
        html += '<div class="fx-blocks" aria-label="Blocks"><span class="lab">BLOCKS</span>';
        BLOCKS.forEach(function (b, bi) {
          var r = prog[bi];
          html += '<button type="button" class="fx-chip' + (r && r.completed ? ' done' : '') + '" data-block="' + bi + '">' +
            (r && r.completed ? icRaw('check', 13, 'currentColor', 2.6) : '') + 'Block ' + b.n + (r && r.completed && mode().clock ? ' · ' + fmtTime(r.timeSpent) : '') + '</button>';
        });
        html += '<span class="note" style="font-size:13px;color:var(--fx-ink-3)">Pick a block to sit it again.</span></div>';
      }
      html += '</section>';

      html += '<section class="fx-data" aria-label="Your data"><span class="lab">YOUR DATA</span>' +
        '<button type="button" class="fx-ghost" id="btn-export">' + ic('down') + 'Save a backup file</button>' +
        '<button type="button" class="fx-ghost" id="btn-import">' + ic('up') + 'Load a backup on another computer</button>' +
        '<button type="button" class="fx-ghost danger" id="btn-clear">' + ic('trash') + 'Clear this form</button>' +
        '<span class="msg" id="io-status" role="status"></span></section>';
    }

    html += '<div class="fx-bar"><span class="gd" aria-hidden="true"></span><span class="t">Free, no account, nothing leaves your browser. From <b>Step Gunner</b>: master the Next Best Step.</span>' +
      storeLink('top', 'Get the app', 'fx-btn2') + '</div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    while (wrap.firstChild) main.appendChild(wrap.firstChild);
    wireStart();
    if (pdfOpen) wirePdf();
  }
  function modeCard(m, kick, desc) {
    var on = settings.mode === m;
    var tag = MODES[m].range
      ? '<span class="tag">' + ic('check') + 'Gets a score range</span>'
      : '<span class="tag no">' + ic('info') + 'No score range: seeing answers as you go lifts the score</span>';
    return '<button type="button" class="fx-mode" role="radio" aria-checked="' + on + '" aria-pressed="' + on + '" data-mode="' + m + '">' +
      '<span class="k"><span>' + kick + '</span><span class="rd" aria-hidden="true"></span></span>' +
      '<span class="nm">' + MODES[m].label + '</span><span class="ds">' + desc + '</span>' + tag + '</button>';
  }
  function progBar(prog, ip, m) {
    var nb = nBlocks(m), per = MODES[m].per, s = '<div class="fx-pbar" style="grid-template-columns:repeat(' + nb + ', minmax(0, 1fr))" role="img" aria-label="' + doneCount(prog, m) + ' of ' + nb + ' blocks done">';
    for (var i = 0; i < nb; i++) {
      if (prog[i] && prog[i].completed) s += '<span class="full"></span>';
      else if (ip && ip.blockIdx === i) { var f = Math.round(100 * Object.keys(ip.answers || {}).length / per); s += '<span style="background:linear-gradient(90deg, var(--fx-act) ' + f + '%, var(--fx-line) ' + f + '%)"></span>'; }
      else s += '<span></span>';
    }
    return s + '</div>';
  }

  function wireStart() {
    var main = $('f-start-main');
    main.querySelectorAll('.fx-mode').forEach(function (b) {
      b.addEventListener('click', function () {
        if (settings.mode === b.dataset.mode) return;
        settings.mode = b.dataset.mode; saveSettings(); rebuildBlocks();
        track('free120_mode', { form: FORM, mode: settings.mode });
        renderStart();
        var again = $('f-start-main').querySelector('.fx-mode[data-mode="' + settings.mode + '"]'); if (again) again.focus();
      });
    });
    var go = $('btn-go');
    if (go) go.addEventListener('click', function () {
      var nx = parseInt(go.dataset.next, 10);
      if (nx === -1) { showResults(); return; }
      var ip = loadInprog();
      if (ip && ip.blockIdx === nx) { resumeInprog(); return; }
      startBlock(nx, false);
    });
    var rs = $('btn-resume');
    if (rs) rs.addEventListener('click', function () {
      if (rs.dataset.mode !== settings.mode) { settings.mode = rs.dataset.mode; saveSettings(); rebuildBlocks(); }
      resumeInprog();
    });
    main.querySelectorAll('[data-results]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.results !== settings.mode) { settings.mode = b.dataset.results; saveSettings(); rebuildBlocks(); }
        showResults();
      });
    });
    main.querySelectorAll('.fx-chip[data-block]').forEach(function (b) {
      b.addEventListener('click', function () { startBlock(parseInt(b.dataset.block, 10), true); });
    });
    var ex = $('btn-export'); if (ex) ex.addEventListener('click', exportProgress);
    var im = $('btn-import'); if (im) im.addEventListener('click', function () { $('import-file').click(); });
    var cl = $('btn-clear'); if (cl) cl.addEventListener('click', function () {
      confirmBox('Clear the ' + FORM + ' form?', 'This deletes every answer, timing and result for the ' + FORM + ' form on this browser, in all three modes. Other forms are untouched. It cannot be undone, so save a backup file first if you might want it.', 'Clear it', true)
        .then(function (ok) {
          if (!ok) return;
          lsKeys('free120:' + FORM + ':').forEach(lsDel);
          renderStart();
          var s = $('io-status'); if (s) s.textContent = 'Cleared the ' + FORM + ' form.';
        });
    });
    var bp = $('btn-pdf'); if (bp) bp.addEventListener('click', function () { pdfOpen = !pdfOpen; renderStart(); if (pdfOpen) { var d = $('pdf-drop'); if (d) d.focus(); } });
  }

  /* ───────────────────────── exam ───────────────────────── */
  var state = null, timerHandle = null, savedTimer = null;
  function freshState(bi) {
    return { blockIdx: bi, itemIdx: 0, answers: {}, marks: {}, strikes: {}, timeOnItem: {}, changes: {}, firstAnswer: {}, highlights: {},
      remaining: blockSec(), elapsed: 0, paused: false, startedAt: Date.now(), reviewMode: false };
  }
  function block() { return BLOCKS[state.blockIdx]; }
  function curItem() { var b = block(); return b && b.items[state.itemIdx]; }

  function saveInprog() {
    if (!state || state.reviewMode || curView() !== 'f-exam') return;
    lsSet(K(FORM, settings.mode, 'inprog'), {
      blockIdx: state.blockIdx, itemIdx: state.itemIdx, answers: state.answers, marks: state.marks, strikes: state.strikes,
      timeOnItem: state.timeOnItem, changes: state.changes, firstAnswer: state.firstAnswer, highlights: state.highlights,
      remaining: state.remaining, elapsed: state.elapsed, paused: state.paused, when: Date.now()
    });
    var s = $('saved');
    if (s) { s.classList.add('on'); clearTimeout(savedTimer); savedTimer = setTimeout(function () { s.classList.remove('on'); }, 1400); }
  }

  function startBlock(bi, askRetake) {
    var b = BLOCKS[bi]; if (!b) return;
    var rec = loadProg()[bi];
    var go = function () {
      clearInprog();
      state = freshState(bi);
      track('free120_block_start', { form: FORM, mode: settings.mode, block: bi + 1 });
      enterExam();
    };
    if (askRetake && rec && rec.completed) {
      confirmBox('Sit block ' + b.n + ' again?', 'Your answers for block ' + b.n + ' will be replaced by the new attempt. The other blocks stay as they are.', 'Sit it again', false)
        .then(function (ok) { if (ok) go(); });
      return;
    }
    go();
  }
  function resumeInprog() {
    var ip = loadInprog();
    if (!ip || !BLOCKS[ip.blockIdx]) return;
    if ((loadProg()[ip.blockIdx] || {}).completed) { clearInprog(); renderStart(); return; }
    state = freshState(ip.blockIdx);
    ['itemIdx', 'answers', 'marks', 'strikes', 'timeOnItem', 'changes', 'firstAnswer', 'highlights'].forEach(function (k) { if (ip[k] != null) state[k] = ip[k]; });
    if (ip.remaining != null) state.remaining = ip.remaining;
    state.elapsed = ip.elapsed || 0;
    state.paused = mode().clock;   // held on return, so the student can settle in first
    enterExam();
  }
  function enterExam() {
    showView('f-exam');
    var tutor = settings.mode === 'tutor';
    $('block-label').textContent = 'Block ' + block().n + ' of ' + BLOCKS.length;
    $('tutor-pill').hidden = !tutor;
    $('btn-pause').hidden = tutor;
    $('btn-quit').textContent = 'End Block';
    buildRail();
    renderItem();
    startTimer();
    saveInprog();
  }

  function buildRail() {
    var rail = $('item-rail'); rail.innerHTML = '';
    block().items.forEach(function (it, i) {
      var c = document.createElement('div');
      c.className = 'it'; c.textContent = i + 1; c.setAttribute('role', 'button'); c.tabIndex = 0;
      c.addEventListener('click', function () { state.itemIdx = i; renderItem(); });
      rail.appendChild(c);
    });
    updateRail();
  }
  function updateRail() {
    var items = block().items, tutor = settings.mode === 'tutor';
    $('item-rail').querySelectorAll('.it').forEach(function (el, i) {
      var n = items[i].n, a = state.answers[n];
      el.classList.toggle('current', i === state.itemIdx);
      el.classList.toggle('answered', a != null);
      el.classList.toggle('marked', !!state.marks[n]);
      var d = el.querySelector('i.dot');
      if (tutor && a != null) {
        if (!d) { d = document.createElement('i'); el.appendChild(d); }
        d.className = 'dot ' + (a === KEY[n] ? 'r' : 'w');
      } else if (d) d.remove();
    });
  }
  function statusLine() {
    var items = block().items, a = 0, r = 0, mk = 0;
    items.forEach(function (it) { if (state.answers[it.n] != null) { a++; if (state.answers[it.n] === KEY[it.n]) r++; } if (state.marks[it.n]) mk++; });
    return a + ' answered' + (settings.mode === 'tutor' ? ' · ' + r + ' right so far' : '') + ' · ' + mk + ' marked';
  }

  function renderRich(el, text) {
    el.innerHTML = '';
    String(text).split('\n\n').forEach(function (para) {
      if (para.indexOf('[[TABLE]]') === 0) {
        var pre = document.createElement('pre'); pre.className = 'stem-table'; pre.textContent = para.replace(/^\[\[TABLE\]\]\n?/, ''); el.appendChild(pre);
      } else { var p = document.createElement('p'); p.textContent = para; el.appendChild(p); }
    });
  }
  function stemFor(it) {
    var qm = META[it.n] || {};
    var text = qm.stem || it.stem || '(no stem)';
    if (qm.optionGrid) {
      // the option grid prints its own column headers; drop the leftover header row from the stem
      var parts = text.split('\n\n'), last = parts[parts.length - 1].replace(/^\[\[TABLE\]\]\n?/, '');
      if (/\S\s{2,}\S/.test(last) && last.length < 80 && !/[.?]\s*$/.test(last.trim())) { parts.pop(); text = parts.join('\n\n'); }
    }
    return text;
  }
  function imagesFor(it, cb) {
    var qm = META[it.n] || {};
    var list = qm.images || it.images;
    if ((!list || !list.length) && window._F120 && !it._figDone && window.Free120Parser && window.Free120Parser.figurePageForItem) {
      var pg = window.Free120Parser.figurePageForItem(window._F120.year, it.n);
      if (pg) {
        it._figDone = true;
        window.Free120Parser.extractOneFigure(window._F120.pdf, pg).then(function (url) { if (url) it.images = [url]; cb(); });
        return 'loading';
      }
    }
    return list || [];
  }
  function drawImages(wrap, it, rerender) {
    wrap.innerHTML = '';
    var list = imagesFor(it, rerender);
    if (list === 'loading') { wrap.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0">Loading figure</div>'; return; }
    list.forEach(function (src) {
      var im = document.createElement('img'); im.src = src; im.alt = 'Question figure';
      im.addEventListener('click', function () {
        im.classList.toggle('zoomed');
        var bd = document.querySelector('.qimages-backdrop');
        if (!bd) {
          bd = document.createElement('div'); bd.className = 'qimages-backdrop'; document.body.appendChild(bd);
          bd.addEventListener('click', function () { document.querySelectorAll('img.zoomed').forEach(function (i) { i.classList.remove('zoomed'); }); bd.classList.remove('open'); });
        }
        bd.classList.toggle('open', im.classList.contains('zoomed'));
      });
      wrap.appendChild(im);
    });
  }
  function optionInner(opt, grid) {
    if (grid && grid.cols) {
      var vals = opt.text.trim().split(/\s+/);
      return '<span class="letter">' + opt.letter + '</span>' + grid.cols.map(function (c, ix) { return '<span class="cell">' + esc(vals[ix] || '') + '</span>'; }).join('');
    }
    return '<span class="letter">' + opt.letter + '</span><span>' + esc(opt.text) + '</span>';
  }

  function renderItem() {
    var it = curItem(); if (!it) return;
    var items = block().items, qm = META[it.n] || {}, tutor = settings.mode === 'tutor';
    var revealed = tutor && state.answers[it.n] != null;
    $('item-label').textContent = 'Item ' + (state.itemIdx + 1) + ' of ' + items.length;
    $('qnum').textContent = 'Item ' + (state.itemIdx + 1);
    var ab = $('qabstract'), abText = qm.abstract || it.abstract;
    if (abText) { renderRich(ab, abText); ab.style.display = ''; } else ab.style.display = 'none';
    renderRich($('qstem'), stemFor(it));
    var hl = state.highlights[it.n];
    if (hl) {
      if (typeof hl.qstem === 'string') $('qstem').innerHTML = hl.qstem;
      if (typeof hl.qabstract === 'string' && ab.style.display !== 'none') ab.innerHTML = hl.qabstract;
    }
    drawImages($('qimages'), it, function () { var c = curItem(); if (c && c.n === it.n) renderItem(); });
    $('mark-cb').checked = !!state.marks[it.n];
    $('mark-label').classList.toggle('marked', !!state.marks[it.n]);

    var ul = $('opts'); ul.innerHTML = '';
    ul.classList.toggle('locked', revealed);
    var grid = qm.optionGrid, oh = $('opt-header');
    if (grid && grid.cols) {
      var tmpl = '34px repeat(' + grid.cols.length + ', 1fr)';
      oh.style.gridTemplateColumns = tmpl;
      oh.innerHTML = '<div></div>' + grid.cols.map(function (c) { return '<div>' + esc(c) + '</div>'; }).join('');
      oh.style.display = 'grid';
    } else oh.style.display = 'none';
    it.options.forEach(function (opt) {
      var li = document.createElement('li');
      li.dataset.letter = opt.letter;
      if (grid && grid.cols) { li.classList.add('gridopt'); li.style.gridTemplateColumns = '34px repeat(' + grid.cols.length + ', 1fr)'; }
      li.innerHTML = optionInner(opt, grid);
      var mine = state.answers[it.n] === opt.letter;
      if (mine) li.classList.add('sel');
      if ((state.strikes[it.n] || []).indexOf(opt.letter) !== -1) li.classList.add('struck');
      if (revealed) {
        li.classList.remove('sel');
        if (opt.letter === KEY[it.n]) li.classList.add(mine ? 'review-correct' : 'review-correct-answer');
        else if (mine) li.classList.add('review-wrong');
        if (!grid) {
          var v = opt.letter === KEY[it.n] ? (mine ? 'Your answer, correct' : 'Correct answer') : (mine ? 'Your answer' : '');
          if (v) li.insertAdjacentHTML('beforeend', '<span class="verdict">' + (opt.letter === KEY[it.n] ? icRaw('check', 14, 'currentColor', 2.6) : '') + v + '</span>');
        }
      }
      li.addEventListener('click', function () { choose(it, opt.letter); });
      li.addEventListener('contextmenu', function (ev) {
        ev.preventDefault();
        if (revealed) return;
        var set = state.strikes[it.n] || (state.strikes[it.n] = []);
        var ix = set.indexOf(opt.letter);
        if (ix >= 0) set.splice(ix, 1); else set.push(opt.letter);
        li.classList.toggle('struck', set.indexOf(opt.letter) !== -1);
        saveInprog();
      });
      ul.appendChild(li);
    });

    var ex = $('explanation');
    if (revealed && qm.explanation) {
      ex.innerHTML = '<div class="exhead"><b>Explanation</b><span>' + fmtShort(state.timeOnItem[it.n] || 0) + ' ON THIS QUESTION</span></div>' +
        '<div class="tags"><span class="topic">' + esc(qm.topic) + '</span> · ' + esc(sysName(qm.system)) + ' · ' + esc(qm.discipline) + '</div>' +
        '<div class="body">' + esc(qm.explanation) + '</div>' + moreLike(qm.system, 'tutor', 'more');
      ex.style.display = '';
    } else ex.style.display = 'none';
    $('status').textContent = 'Item ' + (state.itemIdx + 1) + ' of ' + items.length + ' · ' + statusLine();
    updateRail();
    $('qbox').scrollTo({ top: 0, behavior: 'instant' });
  }
  function moreLike(system, location, cls) {
    var nm = sysName(system);
    var txt = '<b>More like this:</b> ' + esc(nm) + ' next best steps in Step Gunner, ten at a time';
    return storeLink(location, '<span class="gd" aria-hidden="true"></span><span>' + txt + '</span>' + icRaw('arrow', 13, '#0060df', 2.4), cls, { system: nm });
  }

  function choose(it, letter) {
    if (state.reviewMode) return;
    var tutor = settings.mode === 'tutor';
    if (tutor && state.answers[it.n] != null) return;   // tutor locks after the reveal
    var prev = state.answers[it.n];
    if (prev && prev !== letter) state.changes[it.n] = (state.changes[it.n] || 0) + 1;
    if (!(it.n in state.firstAnswer)) state.firstAnswer[it.n] = letter;
    state.answers[it.n] = letter;
    saveInprog();
    if (tutor) { renderItem(); return; }
    // update in place so stem highlights are not wiped by a full re-render
    $('opts').querySelectorAll('li').forEach(function (x) { x.classList.toggle('sel', x.dataset.letter === letter); });
    updateRail();
    $('status').textContent = 'Item ' + (state.itemIdx + 1) + ' of ' + block().items.length + ' · ' + statusLine();
  }

  /* clock */
  function startTimer() { stopTimer(); timerHandle = setInterval(tick, 1000); paintTimer(); }
  function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }
  function tick() {
    if (!state || state.paused || state.reviewMode || curView() !== 'f-exam') return;
    if (document.hidden && !mode().clock) return;            // tutor counts only time spent looking
    var it = curItem();
    if (it) state.timeOnItem[it.n] = (state.timeOnItem[it.n] || 0) + 1;
    state.elapsed++;
    if (mode().clock) state.remaining--;
    paintTimer();
    if (state.elapsed % 5 === 0) saveInprog();
    if (mode().clock && state.remaining <= 0) endBlock(true);
  }
  function paintTimer() {
    var t = $('timer'), clock = mode().clock;
    t.classList.toggle('noclock', !clock);
    t.textContent = clock ? fmtTime(state.remaining) : 'NO CLOCK';
    t.classList.toggle('lowtime', clock && state.remaining <= 60 && !state.paused);
    t.classList.toggle('paused', clock && state.paused);
    var pb = $('btn-pause');
    pb.innerHTML = state.paused ? icRaw('play', 14) + '<span>Resume</span>' : icRaw('pause', 14) + '<span>Pause</span>';
  }
  function togglePause() { if (!mode().clock) return; state.paused = !state.paused; paintTimer(); saveInprog(); }

  /* navigation */
  function go(delta) {
    var N = block().items.length, ni = state.itemIdx + delta;
    saveInprog();
    if (ni >= N) { openBlockReview(); return; }
    state.itemIdx = Math.max(0, Math.min(N - 1, ni));
    renderItem();
  }
  function openBlockReview() {
    var items = block().items, grid = $('rv-grid'), answered = 0, marked = 0;
    grid.innerHTML = '';
    items.forEach(function (it, i) {
      var c = document.createElement('div'); c.className = 'rv-cell'; c.textContent = i + 1;
      if (state.answers[it.n] != null) { c.classList.add('answered'); answered++; } else c.classList.add('blank');
      if (state.marks[it.n]) { c.classList.add('marked'); marked++; }
      c.addEventListener('click', function () { closeBlockReview(); state.itemIdx = i; renderItem(); });
      grid.appendChild(c);
    });
    $('rv-title').textContent = 'Review: Block ' + block().n;
    $('rv-counts').textContent = answered + ' answered · ' + (items.length - answered) + ' blank · ' + marked + ' marked for review';
    $('block-review').classList.add('open');
    $('rv-submit').focus();
  }
  function closeBlockReview() { $('block-review').classList.remove('open'); }

  function endBlock(timeUp) {
    stopTimer(); closeBlockReview(); closeLabs();
    var b = block(), prog = loadProg();
    prog[state.blockIdx] = {
      answers: Object.assign({}, state.answers), marks: Object.assign({}, state.marks), completed: true,
      timeSpent: mode().clock ? blockSec() - state.remaining : state.elapsed,
      timeOnItem: Object.assign({}, state.timeOnItem), changes: Object.assign({}, state.changes),
      firstAnswer: Object.assign({}, state.firstAnswer), when: Date.now()
    };
    saveProg(prog);
    clearInprog();
    track('free120_block_end', { form: FORM, mode: settings.mode, block: state.blockIdx + 1, time_up: !!timeUp });
    if (allDone(prog, settings.mode)) {
      var meta = loadMeta();
      meta.finishedAt = Date.now();
      saveMeta(meta);
      showResults(true);
      return;
    }
    renderInter(state.blockIdx, !!timeUp);
  }

  /* highlight + strike (as in the NBME interface) */
  function captureHighlights() {
    var it = curItem(); if (!it) return;
    state.highlights[it.n] = { qstem: $('qstem').innerHTML, qabstract: $('qabstract').innerHTML };
    saveInprog();
  }
  function wireHighlighting() {
    function within(container) {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) return false;
      var range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return false;
      try {
        var m = document.createElement('mark'); m.className = 'hl';
        m.appendChild(range.extractContents()); range.insertNode(m); sel.removeAllRanges();
        return true;
      } catch (e) { return false; /* the selection crossed element boundaries */ }
    }
    ['qstem', 'qabstract'].forEach(function (id) {
      $(id).addEventListener('mouseup', function () { setTimeout(function () { if (within($(id))) captureHighlights(); }, 0); });
    });
    $('qbox').addEventListener('click', function (e) {
      var m = e.target.closest && e.target.closest('mark.hl');
      if (!m) return;
      var p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize();
      captureHighlights();
    });
  }

  /* lab values: one panel, docked on wide screens */
  var labsOpen = false;
  function buildLabs() {
    var parts = [];
    LABS.forEach(function (sec) {
      parts.push('<section class="lab-section"><h3>' + esc(sec[0]) + '</h3><div class="lab-grid">');
      sec[1].forEach(function (r) {
        var tokens = (r[0] + ' ' + r[1] + ' ' + (r[2] || '')).toLowerCase().replace(/"/g, '');
        parts.push('<div class="lab-row" data-tokens="' + esc(tokens) + '"><div class="name">' + esc(r[0]) + '</div><div class="vals"><div class="range">' + esc(r[1]) + '</div>' +
          (r[2] ? '<span class="si">' + esc(r[2]) + '</span>' : '') + '</div></div>');
      });
      parts.push('</div></section>');
    });
    $('labs-body').innerHTML = parts.join('');
    $('lab-search').addEventListener('input', function () {
      var q = this.value.trim().toLowerCase(), body = $('labs-body');
      body.querySelectorAll('.lab-row').forEach(function (r) { r.classList.toggle('hidden', !!q && r.dataset.tokens.indexOf(q) === -1); });
      body.querySelectorAll('.lab-section').forEach(function (s) { s.classList.toggle('hidden', !s.querySelector('.lab-row:not(.hidden)')); });
    });
  }
  function openLabs() { labsOpen = true; paintLabs(); setTimeout(function () { $('lab-search').focus(); }, 0); }
  function closeLabs() { labsOpen = false; paintLabs(); }
  function paintLabs() {
    $('labs').classList.toggle('open', labsOpen);
    $('labs-back').classList.toggle('open', labsOpen);
    $('f-exam').classList.toggle('labs-on', labsOpen);
    $('btn-labs').setAttribute('aria-pressed', labsOpen ? 'true' : 'false');
  }

  /* calculator (safe arithmetic, no eval) */
  function wireCalc() {
    var expr = '', disp = $('calc-disp');
    function render() { disp.textContent = expr || '0'; }
    function evalExpr(s) {
      var tokens = s.match(/(\d*\.\d+|\d+\.?\d*|[+\-*/])/g);
      if (!tokens) return 0;
      var nums = [], ops = [];
      function prec(o) { return (o === '*' || o === '/') ? 2 : 1; }
      function apply() { var b = nums.pop(), a = nums.pop(), o = ops.pop(); nums.push(o === '+' ? a + b : o === '-' ? a - b : o === '*' ? a * b : a / b); }
      tokens.forEach(function (t) {
        if (/^[+\-*/]$/.test(t)) { while (ops.length && prec(ops[ops.length - 1]) >= prec(t)) apply(); ops.push(t); }
        else nums.push(parseFloat(t));
      });
      while (ops.length) apply();
      var r = nums.length ? nums[0] : 0;
      return Math.round((r + Number.EPSILON) * 1e6) / 1e6;
    }
    $('calc-keys').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var k = b.dataset.k;
      if (k === 'C') expr = '';
      else if (k === '←') expr = expr.slice(0, -1);
      else if (k === '=') { try { expr = String(evalExpr(expr)); } catch (er) { expr = 'Error'; } }
      else if (k === '%') { try { expr = String(evalExpr(expr) / 100); } catch (er) { /* keep */ } }
      else {
        if (expr === 'Error') expr = '';
        if (k === '.') { var cur = expr.split(/[+\-*/]/).pop(); if (cur.indexOf('.') === -1) { if (cur === '') expr += '0'; expr += k; } }
        else expr += k;
      }
      render();
    });
    var head = $('calc-head'), drag = null;
    head.addEventListener('mousedown', function (e) {
      if (e.target.id === 'calc-close') return;
      var c = $('calc'); drag = { x: e.clientX, y: e.clientY, l: c.offsetLeft, t: c.offsetTop }; e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!drag) return; var c = $('calc');
      c.style.left = (drag.l + e.clientX - drag.x) + 'px'; c.style.top = (drag.t + e.clientY - drag.y) + 'px'; c.style.right = 'auto';
    });
    document.addEventListener('mouseup', function () { drag = null; });
    $('calc-close').addEventListener('click', function () { $('calc').classList.remove('open'); });
  }

  /* display settings */
  function applySettings() {
    document.body.classList.remove('fs-sm', 'fs-md', 'fs-lg');
    document.body.classList.add('fs-' + (settings.fontSize || 'md'));
    document.body.classList.toggle('dark', !!settings.dark);
    document.querySelectorAll('#seg-font button').forEach(function (b) { b.classList.toggle('on', b.dataset.fs === settings.fontSize); });
    document.querySelectorAll('#seg-dark button').forEach(function (b) { b.classList.toggle('on', b.dataset.dark === (settings.dark ? '1' : '0')); });
  }

  function wireExam() {
    wireHighlighting(); wireCalc(); buildLabs();
    $('btn-prev').addEventListener('click', function () { go(-1); });
    $('btn-next').addEventListener('click', function () { go(+1); });
    $('btn-pause').addEventListener('click', togglePause);
    $('btn-labs').addEventListener('click', function () { if (labsOpen) closeLabs(); else openLabs(); });
    $('labs-close').addEventListener('click', closeLabs);
    $('labs-back').addEventListener('click', closeLabs);
    $('btn-calc').addEventListener('click', function () { $('calc').classList.toggle('open'); });
    $('btn-quit').addEventListener('click', openBlockReview);
    $('rv-return').addEventListener('click', closeBlockReview);
    $('rv-submit').addEventListener('click', function () {
      var items = block().items, blank = items.filter(function (it) { return state.answers[it.n] == null; }).length;
      if (!blank) { endBlock(false); return; }
      confirmBox('Submit with ' + blank + ' blank?', 'Blank questions count as wrong. You will not be able to come back to block ' + block().n + ' after you submit.', 'Submit block', false)
        .then(function (ok) { if (ok) endBlock(false); });
    });
    $('mark-cb').addEventListener('change', function (e) { toggleMark(e.target.checked); });
    function toggleSettings(e) { e.stopPropagation(); $('settings-pop').classList.toggle('open'); }
    $('btn-settings').addEventListener('click', toggleSettings);
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#settings-pop') && !e.target.closest('#btn-settings')) $('settings-pop').classList.remove('open');
    });
    $('seg-font').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { settings.fontSize = b.dataset.fs; saveSettings(); applySettings(); } });
    $('seg-dark').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { settings.dark = b.dataset.dark === '1'; saveSettings(); applySettings(); } });

    document.addEventListener('keydown', function (e) {
      if ($('dlg').classList.contains('open')) { if (e.key === 'Escape') closeDlg(null); return; }
      if ($('share').classList.contains('open')) { if (e.key === 'Escape') closeShare(); return; }
      var v = curView();
      if (v === 'f-review') { reviewKeys(e); return; }
      if (v !== 'f-exam' || !state) return;
      var tag = (e.target.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      var k = e.key;
      if (k === 'Escape') { closeLabs(); $('calc').classList.remove('open'); $('settings-pop').classList.remove('open'); closeBlockReview(); return; }
      if ($('block-review').classList.contains('open')) return;
      if (k === 'ArrowRight' || k === 'n' || k === 'N') { go(+1); e.preventDefault(); return; }
      if (k === 'ArrowLeft' || k === 'p' || k === 'P') { go(-1); e.preventDefault(); return; }
      if (k === ' ') { togglePause(); e.preventDefault(); return; }
      if (k === 'm' || k === 'M') { toggleMark(!state.marks[curItem().n]); return; }
      if (k === 'l' || k === 'L') { if (labsOpen) closeLabs(); else openLabs(); e.preventDefault(); return; }
      var up = k.toUpperCase();
      if (/^[A-F]$/.test(up)) {
        var it = curItem(), opt = it.options.filter(function (o) { return o.letter === up; })[0];
        if (opt) choose(it, up);
      }
    });
  }
  function toggleMark(on) {
    var it = curItem(); if (!it) return;
    if (on) state.marks[it.n] = true; else delete state.marks[it.n];
    $('mark-cb').checked = !!on;
    $('mark-label').classList.toggle('marked', !!on);
    updateRail(); saveInprog();
    $('status').textContent = 'Item ' + (state.itemIdx + 1) + ' of ' + block().items.length + ' · ' + statusLine();
  }

  /* ───────────────────────── between blocks ───────────────────────── */
  var breakHandle = null;
  function qrTile(cls) {
    return '<div class="fx-vf' + (cls ? ' ' + cls : '') + '"><span class="br tl" aria-hidden="true"></span><span class="br tr" aria-hidden="true"></span><span class="br bl" aria-hidden="true"></span><span class="br brr" aria-hidden="true"></span>' +
      '<div class="tile"><img src="/free120/qr-app.svg" alt="QR code that opens Step Gunner on the App Store" width="200" height="200"><div class="beam" aria-hidden="true"></div></div></div>';
  }
  function phonePeek() {
    return '<div class="fx-peek" aria-hidden="true"><div class="isl"></div><div class="glow"></div><div class="scr">' +
      '<div class="k2">TODAY\'S ROUND</div><div class="h">Next best step</div>' +
      '<div class="q"><p>34 weeks. BP 168/112, headache, platelets 88,000.</p><p><b>What comes next?</b></p>' +
      '<div class="o"><b>A</b>Magnesium sulfate</div><div class="o"><b>B</b>Recheck in 4 hours</div><div class="o"><b>C</b>Home on labetalol</div></div>' +
      '</div></div>';
  }
  function dwm() { return '<div class="fx-dwm"><span class="d" aria-hidden="true"></span><span class="w1">STEP</span><span class="w2">GUNNER</span></div>'; }

  function renderInter(bi, timeUp) {
    stopBreak();
    var prog = loadProg(), rec = prog[bi] || {}, nb = BLOCKS.length, dc = doneCount(prog, settings.mode);
    var b = BLOCKS[bi], items = b.items;
    var answered = items.filter(function (it) { return (rec.answers || {})[it.n] != null; }).length;
    var marked = Object.keys(rec.marks || {}).length;
    var next = -1; for (var i = 0; i < nb; i++) if (!(prog[i] && prog[i].completed)) { next = i; break; }
    var m = settings.mode, testDay = m === 'test';
    var bars = ''; for (var j = 0; j < nb; j++) bars += '<span class="' + (prog[j] && prog[j].completed ? 'full' : '') + '"></span>';
    var html = '<div class="fx-im"><section class="card">' +
      '<div class="hd"><h1>Block ' + b.n + (timeUp ? ': time is up' : ' complete') + '</h1><span>' + dc + ' of ' + nb + ' · ' + (nb - dc) + ' to go</span></div>' +
      '<div class="prog" style="grid-template-columns:repeat(' + nb + ', minmax(0, 1fr))" role="img" aria-label="' + dc + ' of ' + nb + ' blocks complete">' + bars + '</div>' +
      '<p class="note">' + (m === 'tutor' ? 'Saved. Every answer and explanation stays in review at the end.' : 'Your answers are saved. Scores and the answer key stay hidden until you finish, like test day.') + '</p>' +
      '<div class="stats">' +
        '<div><b>' + answered + '</b><small>Answered</small></div><div><b>' + marked + '</b><small>Marked</small></div>' +
        '<div><b>' + (items.length - answered) + '</b><small>Blank</small></div>' +
        '<div><b>' + fmtTime(rec.timeSpent) + '</b><small>' + (mode().clock ? 'of ' + fmtTime(blockSec()) + ' used' : 'on this block') + '</small></div>' +
      '</div>';
    if (testDay && next !== -1) {
      html += '<div class="fx-bank" id="bank"></div>';
    } else if (next !== -1) {
      html += '<div class="acts"><button type="button" class="primary" id="im-next">Start block ' + (next + 1) + '</button><button type="button" id="im-home">Finish later</button></div>';
    }
    html += '</section>' + qrCard(m) + '</div>';
    $('f-inter').innerHTML = html;
    showView('f-inter');
    if (testDay && next !== -1) paintBank(next, false);
    var nx = $('im-next'); if (nx) nx.addEventListener('click', function () { startBlock(next, false); });
    var hm = $('im-home'); if (hm) hm.addEventListener('click', function () { showView('f-start'); renderStart(); });
  }
  function qrCard(m) {
    var testDay = m === 'test';
    return '<section class="fx-dark" aria-label="Step Gunner: scan to get the app"><div class="grid" aria-hidden="true"></div><div class="in">' +
      '<div class="copy">' + dwm() + '<div style="flex:1"></div>' +
        '<div class="k">' + (testDay ? 'ON YOUR BREAK' : 'BETWEEN BLOCKS') + '</div>' +
        '<h2>' + (testDay ? 'Your phone is already out.' : 'Take the next step with you.') + '</h2>' +
        '<p>Every question in that block asked what you do next. Step Gunner drills exactly that, ten at a time, between everything else. Free.</p>' +
        storeLink('mid', 'Get Step Gunner free', 'fx-btn getbtn') +
        '<div class="meta"><span>IPHONE</span><span class="sep"></span><span>FREE</span><span class="sep"></span><span>4.8 ON THE APP STORE</span>' +
          storeLink('qr_link_mid', 'APP STORE PAGE<svg viewBox="0 0 24 24" aria-hidden="true">' + IC.ext + '</svg>', '') + '</div>' +
      '</div>' +
      '<div class="fx-scan">' + phonePeek() + qrTile('') +
        '<div class="cap"><span class="fx-cap1">POINT YOUR IPHONE CAMERA HERE</span>' + (testDay ? '<span class="fx-cap2">BACK BEFORE THE CLOCK ENDS</span>' : '<span class="fx-cap2">OPENS THE APP STORE</span>') + '</div>' +
      '</div></div></section>';
  }

  // Test day gives 45 minutes of break across the whole exam. It runs only while resting.
  function paintBank(next, running) {
    var meta = loadMeta(), used = Math.min(BREAK_BANK, meta.breakUsed || 0), left = BREAK_BANK - used;
    var C = 2 * Math.PI * 58, off = C * (1 - left / BREAK_BANK);
    var el = $('bank'); if (!el) return;
    var empty = left <= 0;
    el.innerHTML = '<svg class="ring" width="136" height="136" viewBox="0 0 136 136" role="img" aria-label="Break bank: ' + fmtTime(left) + ' left">' +
        '<circle class="bg" cx="68" cy="68" r="58" fill="none" stroke-width="10"></circle>' +
        '<circle class="fg" cx="68" cy="68" r="58" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 68 68)"></circle>' +
        '<text x="68" y="70" text-anchor="middle" style="font-weight:700;font-size:28px" id="bank-t">' + fmtTime(left) + '</text>' +
        '<text class="l" x="68" y="92" text-anchor="middle" style="font-weight:600;font-size:10px;letter-spacing:.14em">' + (running ? 'ON BREAK' : 'LEFT') + '</text></svg>' +
      '<div class="t"><h2>Break bank</h2><p>' + (empty ? 'The 45 minutes are used up. On test day the clock would now come out of your block time.'
        : 'Test day gives you 45 minutes of break across the whole exam. Take some now; whatever you leave carries to the next break. The clock only runs while you rest.') + '</p>' +
      '<div class="acts">' + (running
        ? '<button type="button" class="primary" id="bk-end">End break, start block ' + (next + 1) + '</button>'
        : (empty ? '' : '<button type="button" class="primary" id="bk-start">' + icRaw('clock', 16) + 'Start break</button>') +
          '<button type="button" id="bk-skip"' + (empty ? ' class="primary"' : '') + '>' + (empty ? 'Start block ' + (next + 1) : 'Skip it, start block ' + (next + 1)) + '</button>') +
        '<button type="button" id="bk-home" style="border-color:transparent">Finish later</button></div></div>';
    var s = $('bk-start'); if (s) s.addEventListener('click', function () { startBreak(next); });
    var k = $('bk-skip'); if (k) k.addEventListener('click', function () { startBlock(next, false); });
    var e = $('bk-end'); if (e) e.addEventListener('click', function () { stopBreak(); startBlock(next, false); });
    var h = $('bk-home'); if (h) h.addEventListener('click', function () { stopBreak(); showView('f-start'); renderStart(); });
  }
  function startBreak(next) {
    stopBreak();
    paintBank(next, true);
    track('free120_break', { form: FORM });
    breakHandle = setInterval(function () {
      var meta = loadMeta();
      meta.breakUsed = Math.min(BREAK_BANK, (meta.breakUsed || 0) + 1);
      saveMeta(meta);
      var left = BREAK_BANK - meta.breakUsed, C = 2 * Math.PI * 58;
      var fg = document.querySelector('#bank .fg'), t = $('bank-t');
      if (fg) fg.setAttribute('stroke-dashoffset', (C * (1 - left / BREAK_BANK)).toFixed(1));
      if (t) t.textContent = fmtTime(left);
      if (left <= 0) { stopBreak(); paintBank(next, false); }
    }, 1000);
  }
  function stopBreak() { if (breakHandle) { clearInterval(breakHandle); breakHandle = null; } }

  /* ───────────────────────── results ───────────────────────── */
  // The App Store video shows Study Buddy (3.0). On since 2026-11-10: 3.0 LIVE and
  // config/social.buddyEnabled true. Turn it off again if Study Buddy is switched off.
  var APP_VIDEO_LIVE = true;

  function buildRows(prog, m) {
    var rows = [], per = MODES[m || settings.mode].per;
    ITEMS.forEach(function (it, idx) {
      var bi = Math.floor(idx / per), rec = prog[bi] || {};
      var you = (rec.answers || {})[it.n] || null, first = (rec.firstAnswer || {})[it.n] || null;
      var t = (rec.timeOnItem || {})[it.n];
      var qm = META[it.n] || {};
      rows.push({ bi: bi, ii: idx % per, n: it.n, it: it, you: you, first: first, ans: KEY[it.n],
        res: !you ? 'blank' : (you === KEY[it.n] ? 'right' : 'wrong'),
        changed: !!(first && you && first !== you), t: t == null ? null : t, slow: t != null && t > 120,
        marked: !!(rec.marks || {})[it.n], hasMarks: !!rec.marks,
        system: qm.system || 'Other', discipline: qm.discipline || 'Other', topic: qm.topic || '' });
    });
    return rows;
  }
  function results() {
    var m = settings.mode, prog = loadProg(), rows = buildRows(prog, m);
    var c = 0, w = 0, bl = 0, time = 0;
    rows.forEach(function (r) { if (r.res === 'right') c++; else if (r.res === 'wrong') w++; else bl++; });
    var blocks = BLOCKS.map(function (b, bi) {
      var rr = rows.filter(function (r) { return r.bi === bi; }), bc = rr.filter(function (r) { return r.res === 'right'; }).length;
      var ts = (prog[bi] || {}).timeSpent || 0; time += ts;
      return { n: b.n, c: bc, t: rr.length, pct: pctOf(bc, rr.length), time: ts, slow: rr.filter(function (r) { return r.slow; }).length, rows: rr };
    });
    return { m: m, rows: rows, c: c, w: w, bl: bl, N: rows.length, pct: pctOf(c, rows.length), time: time, blocks: blocks, meta: loadMeta(), prog: prog };
  }
  function groupBy(rows, key) {
    var g = {};
    rows.forEach(function (r) { var k = r[key]; g[k] = g[k] || { name: k, c: 0, t: 0, wrong: 0 }; g[k].t++; if (r.res === 'right') g[k].c++; else g[k].wrong++; });
    return Object.keys(g).map(function (k) { var x = g[k]; x.pct = pctOf(x.c, x.t); return x; })
      .sort(function (a, b) { return a.pct - b.pct || b.t - a.t; });
  }
  // Fewest extra right answers to reach a band (bands compare the rounded percentage).
  function needFor(minPct, c, N) { for (var x = c; x <= N; x++) if (pctOf(x, N) >= minPct) return x - c; return null; }

  var resState = { tab: 'system', allSys: false, R: null };
  function showResults(justFinished) {
    var R = results();
    resState.R = R;
    var meta = R.meta;
    if (justFinished || !meta.finishTracked) {
      var bi0 = bandIndex(R.pct);
      if (!meta.finishTracked) {
        meta.finishTracked = true;
        track('free120_finish', { form: FORM, mode: R.m, pct: R.pct, band: MODES[R.m].range ? (bi0 >= 0 ? String(BANDS[bi0].min) : 'under65') : 'tutor' });
      }
      meta.pct = R.pct;
      if (!meta.finishedAt) meta.finishedAt = lastWhen(R.prog);
      saveMeta(meta);
    }
    renderResults();
    showView('f-results');
    setHash('results');
  }
  function setHash(h) { try { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch (e) { /* ignore */ } }

  function axisFor(extra) {
    var lo = 240, hi = 275;
    if (extra) { lo = Math.min(lo, Math.floor((extra.low - 3) / 5) * 5); hi = Math.max(hi, Math.ceil((extra.high + 3) / 5) * 5); }
    return { lo: lo, hi: hi, x: function (v) { return (100 * (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)); } };
  }
  function chartRow(label, sub, cls, q1, q3, med, ax) {
    var l = ax.x(q1), w = ax.x(q3) - l;
    return '<div class="row"><span class="lb ' + cls + '"><b>' + label + '</b><small>' + sub + '</small></span>' +
      '<div class="tr"><span class="base"></span><span class="iqr ' + cls + '" style="left:' + l.toFixed(1) + '%;width:' + Math.max(1.5, w).toFixed(1) + '%"></span>' +
      '<span class="med ' + cls + '" style="left:' + ax.x(med).toFixed(1) + '%"></span></div></div>';
  }
  function renderChart(R, nbme) {
    var host = $('fx-chart'); if (!host) return;
    var bi = bandIndex(R.pct), ax = axisFor(nbme), out = '', label = '';
    if (bi >= 0) {
      var b = BANDS[bi];
      out += chartRow('You: ' + b.min + '% band', b.n + ' students', '', b.q1, b.q3, b.med, ax);
      if (bi > 0) { var nb = BANDS[bi - 1]; out += chartRow(nb.min + '% band', nb.n + ' students', 'next', nb.q1, nb.q3, nb.med, ax); }
      label = 'Range chart. Your band, ' + b.min + ' percent: middle half ' + b.q1 + ' to ' + b.q3 + ', median ' + b.med + '.';
    }
    if (nbme) {
      out += chartRow('Your NBMEs', nbme.n + (nbme.n === 1 ? ' form' : ' forms'), 'nb', nbme.low, nbme.high, nbme.center, ax);
      label += ' Your NBME and UWSA projection: ' + nbme.low + ' to ' + nbme.high + '.';
    }
    var ticks = '';
    for (var v = Math.ceil(ax.lo / 10) * 10; v <= ax.hi; v += 10) ticks += '<span style="left:' + ax.x(v).toFixed(1) + '%">' + v + '</span>';
    out += '<div class="row"><span></span><div class="ax">' + ticks + '</div></div>';
    host.innerHTML = out;
    host.setAttribute('aria-label', label);
  }

  function renderResults() {
    var R = resState.R, M = MODES[R.m], bi = bandIndex(R.pct), band = bi >= 0 ? BANDS[bi] : null;
    var finished = R.meta.finishedAt || lastWhen(R.prog);
    var html = header('header') + '<main class="fx-main">';

    // Head
    html += '<section class="fx-rh"><div class="t"><span class="fx-kick">FREE 120 · ' + esc(FORM) + ' FORM · ' + esc(M.long.toUpperCase()) + '</span>' +
      '<h1>' + R.c + ' of ' + R.N + (M.range ? '. Here is what it means.' : ' in tutor mode.') + '</h1>' +
      '<span class="when">Finished ' + fmtDate(finished) + ' at ' + fmtClock(finished) + ' · ' + fmtDur(R.time) + (M.clock ? ' on the clock' : ' on it') + '</span></div>' +
      '<div class="acts"><button type="button" class="fx-btn" id="btn-review">Review answers</button>' +
      (M.range && band ? '<button type="button" class="fx-btn2" id="btn-share">' + ic('share') + 'Share result</button>' : '') + '</div></section>';

    // Score + band
    html += '<section class="fx-score"><div class="big"><span class="fx-kick">YOUR SCORE</span><span class="n">' + R.pct + '%</span>' +
      '<span class="s">' + R.c + ' right · ' + R.w + ' wrong · ' + R.bl + ' blank</span></div><div class="band">';
    if (!M.range) {
      html += '<div class="fx-kick">NO SCORE RANGE IN TUTOR MODE</div><div class="h">Seeing each answer as you go lifts the score.</div>' +
        '<p class="fx-fine" style="font-size:15px;color:var(--fx-ink-2)">So this one is for learning, not predicting. Sit a form in test day mode or short blocks for a range from 215 real score reports.</p>';
    } else if (band) {
      html += '<div style="display:flex;flex-direction:column;gap:6px"><span class="fx-kick">WHERE STUDENTS LIKE YOU LANDED ON STEP 2</span>' +
        '<span class="h">Middle half: ' + band.q1 + ' to ' + band.q3 + '. Median ' + band.med + '.</span></div>' +
        '<div class="fx-chart" id="fx-chart" role="img"></div>';
      if (bi > 0) {
        var nb = BANDS[bi - 1], need = needFor(nb.min, R.c, R.N);
        html += '<div class="fx-call">' + ic('upArrow') + '<span><b>' + (need === 1 ? 'One more right' : need + ' more right') + '</b> puts you in the ' + nb.min + '% band, where the median was ' + nb.med + '.</span></div>';
      } else {
        html += '<div class="fx-call">' + ic('upArrow') + '<span><b>Top band in the set.</b> Most people sit this three days out, when a good number is just relief. Weeks out, it buys you a plan.</span></div>';
      }
      html += '<p class="fx-fine">Bars are the middle half of real Step 2 scores at each Free 120 band, from 215 r/Step2 score reports (correlation 0.55; the sample skews high). Under 65% gets no band, on purpose. <a href="/research/free-120-to-step-2">How we built this</a></p>';
    } else {
      var need65 = needFor(65, R.c, R.N);
      html += '<span class="fx-kick">WHERE STUDENTS LIKE YOU LANDED</span><span class="h">No band for this one.</span>' +
        '<p class="fx-fine" style="font-size:15px;color:var(--fx-ink-2)">Six students in the set scored under 65. Six is not a band, so nobody can honestly tell you what this converts to. ' +
        'The first band starts at 65%: ' + need65 + ' more right.</p>' +
        '<div class="fx-chart" id="fx-chart" role="img"></div>' +
        '<p class="fx-fine"><b>What the data does say:</b> most people sit this three days out. If you have weeks, that is the whole difference. <a href="/research/free-120-to-step-2">How we built this</a></p>';
    }
    html += '</div></section>';

    // NBME / UWSA box (the same model as /readiness)
    if (window.F120R && window.F120R.computeReadiness) html += readinessBox();

    // Where the points went + how you took it
    html += '<section class="fx-two"><div class="fx-card" id="fx-sys-card"></div><div class="fx-card">' + tookCard(R) + '</div></section>';

    // The app
    html += appCard(R);

    // Block by block
    html += '<section class="fx-sec"><h2 style="margin:0;font-size:19px;font-weight:800">Block by block</h2><div class="fx-tablewrap"><table class="fx-table"><thead><tr>' +
      '<th>BLOCK</th><th class="num">RIGHT</th><th class="num">SCORE</th><th class="num">' + (M.clock ? 'CLOCK USED' : 'TIME') + '</th><th>NOTE</th></tr></thead><tbody>';
    var low = null, slowB = null;
    R.blocks.forEach(function (b) { if (!low || b.pct < low.pct) low = b; if (!slowB || b.time > slowB.time) slowB = b; });
    var flag = R.blocks.length > 1 && low === slowB && R.blocks.some(function (b) { return b.pct > low.pct; });
    var mostSlow = R.blocks.reduce(function (a, b) { return b.slow > a.slow ? b : a; }, R.blocks[0]);
    R.blocks.forEach(function (b) {
      var note = '';
      if (flag && b === low) note = 'Slowest and lowest.' + (mostSlow === b && b.slow >= 2 ? ' Most of the long questions sat here.' : '');
      html += '<tr' + (note ? ' class="flag"' : '') + '><td style="font-weight:600">Block ' + b.n + '</td><td class="num">' + b.c + '/' + b.t + '</td><td class="num">' + b.pct + '%</td>' +
        '<td class="num">' + fmtTime(b.time) + '</td><td class="note">' + note + '</td></tr>';
    });
    html += '</tbody></table></div></section>';

    var other = FORMS.filter(function (f) { return f.id !== FORM; })[0];
    html += '<div class="fx-bar"><span class="gd" aria-hidden="true"></span><span class="t">Free, no account. This result lives in your browser until you clear it.</span>' +
      '<button type="button" class="fx-btn2" id="btn-tostart">Back to the start</button>' +
      (other ? '<a class="fx-btn2" href="' + other.href + '">Sit the ' + esc(other.name) + '</a>' : '') + '</div>';
    html += '</main>';

    $('f-results').innerHTML = html;
    renderSysCard();
    renderChart(R, currentNbme());
    wireResults();
  }

  function renderSysCard() {
    var R = resState.R, host = $('fx-sys-card');
    var key = resState.tab === 'system' ? 'system' : 'discipline';
    var groups = groupBy(R.rows, key), show = resState.allSys ? groups : groups.slice(0, 6);
    var h = '<div class="hd"><h2>Where the points went</h2><div class="fx-tabs" role="tablist" aria-label="Group by">' +
      '<button type="button" role="tab" data-tab="system" aria-selected="' + (key === 'system') + '">System</button>' +
      '<button type="button" role="tab" data-tab="discipline" aria-selected="' + (key === 'discipline') + '">Discipline</button></div></div><div class="fx-sys">';
    show.forEach(function (g) {
      var col = g.pct <= 50 ? 'var(--fx-red)' : g.pct < 70 ? 'var(--fx-amber)' : 'var(--fx-green)';
      h += '<div class="r' + (g.pct < 60 ? ' weak' : '') + '"><span class="nm">' + esc(sysName(g.name)) + '</span>' +
        '<span class="br"><i style="width:' + g.pct + '%;background:' + col + '"></i></span><span class="v">' + g.c + '/' + g.t + '</span></div>';
    });
    h += '</div><div class="fx-cfoot">';
    if (groups.length > 6) h += '<button type="button" class="fx-linkbtn" id="btn-allsys">' + (resState.allSys ? 'Show the weakest 6' : 'Show all ' + groups.length + ' ' + (key === 'system' ? 'systems' : 'disciplines')) + '</button>';
    var thin = groups.filter(function (g) { return g.pct < 60 && g.t <= 8; }).sort(function (a, b) { return a.t - b.t; })[0];
    if (thin) h += '<span class="note">' + thin.t + ' ' + esc(sysName(thin.name)) + ' questions is a signal, not a verdict.</span>';
    h += '</div>';
    host.innerHTML = h;
    host.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { resState.tab = b.dataset.tab; resState.allSys = false; renderSysCard(); }); });
    var all = $('btn-allsys'); if (all) all.addEventListener('click', function () { resState.allSys = !resState.allSys; renderSysCard(); });
  }

  function tookCard(R) {
    var timed = R.rows.filter(function (r) { return r.t != null; });
    var h = '<h2>How you took it</h2>';
    if (timed.length) {
      var avg = Math.round(timed.reduce(function (a, r) { return a + r.t; }, 0) / timed.length);
      var slow = timed.filter(function (r) { return r.slow; }).length;
      var top = R.blocks.reduce(function (a, b) { return b.slow > a.slow ? b : a; }, R.blocks[0]);
      var where = slow >= 3 && top.slow * 2 >= slow && R.blocks.length > 1 ? ', ' + top.slow + ' of them in block ' + top.n : '';
      var sent = avg + ' seconds a question. ' + (slow ? slow + (slow === 1 ? ' took' : ' took') + ' over 2 minutes' + where + '.' : 'None took over 2 minutes.');
      h += '<div class="fx-took"><div class="l"><b>Pace</b><span>' + sent + '</span></div>' +
        '<div class="fx-pace" style="grid-template-columns:repeat(' + Math.min(R.blocks.length, 3) + ', minmax(0, 1fr))" role="img" aria-label="Time on each question by block. The dashed line is 90 seconds; ' + slow + ' ran past 2 minutes.">';
      R.blocks.forEach(function (b) {
        h += '<div class="blk"><div class="bars"><span class="line" style="bottom:' + (90 / 200 * 64).toFixed(1) + 'px"></span>';
        b.rows.forEach(function (r) {
          if (r.t == null) { h += '<i class="none"></i>'; return; }
          var hpx = Math.max(4, Math.round(Math.min(r.t, 200) / 200 * 64));
          h += '<i class="' + (r.slow ? 'slow' : '') + '" style="height:' + hpx + 'px"></i>';
        });
        h += '</div><span class="lb">B' + b.n + ' · ' + fmtTime(b.time) + '</span></div>';
      });
      h += '</div><span class="fx-legend"><span><i class="dash"></i>90 seconds, test day pace</span><span><i class="sw"></i>over 2 minutes</span></span></div>';
    }
    var ch = R.rows.filter(function (r) { return r.changed; });
    var w2r = ch.filter(function (r) { return r.first !== r.ans && r.you === r.ans; }).length;
    var r2w = ch.filter(function (r) { return r.first === r.ans && r.you !== r.ans; }).length;
    var both = ch.length - w2r - r2w, net = w2r - r2w;
    if (R.m !== 'tutor') {
      if (ch.length) {
        var verdict = net > 0 ? 'Your second look was worth it.' : net < 0 ? 'Your first instinct was better. Trust it more.' : 'It washed out.';
        h += '<div class="fx-took"><div class="l"><b>Changed answers</b><span>' + ch.length + (ch.length === 1 ? ' change' : ' changes') + ', net <b style="color:' + (net > 0 ? 'var(--fx-green)' : net < 0 ? 'var(--fx-red)' : 'var(--fx-ink-2)') + '">' + (net > 0 ? '+' : '') + net + '</b>. ' + verdict + '</span></div>' +
          '<div class="fx-stack" role="img" aria-label="Of ' + ch.length + ' changes: ' + w2r + ' wrong to right, ' + r2w + ' right to wrong, ' + both + ' wrong both times.">' +
          (w2r ? '<span class="g" style="flex:' + w2r + '"></span>' : '') + (r2w ? '<span class="r" style="flex:' + r2w + '"></span>' : '') + (both ? '<span class="n" style="flex:' + both + '"></span>' : '') + '</div>' +
          '<span class="fx-legend"><span><b style="color:var(--fx-green)">' + w2r + '</b> wrong to right</span><span><b style="color:var(--fx-red)">' + r2w + '</b> right to wrong</span><span><b>' + both + '</b> wrong both times</span></span></div>';
      } else {
        h += '<div class="fx-took"><div class="l"><b>Changed answers</b><span>You never changed an answer.</span></div></div>';
      }
    }
    var withMarks = R.rows.filter(function (r) { return r.hasMarks; });
    if (withMarks.length) {
      var mk = withMarks.filter(function (r) { return r.marked; }), un = withMarks.filter(function (r) { return !r.marked; });
      var mc = mk.filter(function (r) { return r.res === 'right'; }).length, uc = un.filter(function (r) { return r.res === 'right'; }).length;
      var mp = pctOf(mc, mk.length), up = pctOf(uc, un.length);
      var line = !mk.length ? 'You marked nothing.' : (mp + 10 <= up ? 'You doubted the right ones.' : (mp >= up ? 'Your marked ones held up. The doubt cost time, not points.' : 'Marked and unmarked landed close.'));
      h += '<div class="fx-took"><div class="l"><b>Marked questions</b><span>' + line + '</span></div>';
      if (mk.length) {
        h += '<div class="fx-mk"><span>Marked</span><span class="br"><i style="width:' + mp + '%;background:var(--fx-amber)"></i></span><span class="v">' + mc + '/' + mk.length + ' · ' + mp + '%</span>' +
          '<span>Not marked</span><span class="br"><i style="width:' + up + '%;background:var(--fx-green)"></i></span><span class="v">' + uc + '/' + un.length + ' · ' + up + '%</span></div>';
      }
      h += '</div>';
    }
    return h;
  }

  function appCard(R) {
    var weak = groupBy(R.rows, 'system').filter(function (g) { return g.pct < 70 && g.t >= 3; }).slice(0, 2);
    function part(g) {
      var nm = sysShort(g.name);
      if (g.c * 2 === g.t) return 'half of ' + nm;
      return g.c + ' of ' + g.t + ' in ' + nm;
    }
    var h2 = weak.length === 2 ? 'You got ' + part(weak[0]) + ' and ' + part(weak[1]) + '.'
      : weak.length === 1 ? sysShort(weak[0].name) + ' cost you the most: ' + weak[0].c + ' of ' + weak[0].t + '.'
      : 'No system under 70%. Keep it there.';
    var names = weak.map(function (g) { return sysShort(g.name); });
    var p = 'Step Gunner drills the next best step across every system' + (names.length ? ', ' + names.join(' and ') + ' included' : '') + ', ten questions at a time, every day until test day. Free.' + (APP_VIDEO_LIVE ? ' Here is the app in 27 seconds.' : '');
    var chips = weak.map(function (g) { return '<span class="chip"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC.pin + '</svg>' + esc(SYS_CHIP[g.name] || sysName(g.name).toUpperCase()) + '<i>' + g.c + '/' + g.t + '</i></span>'; }).join('');
    var copy = '<div class="copy">' + dwm() + '<div class="k" style="margin-top:10px">YOUR NEXT TWO WEEKS</div><h2>' + esc(h2) + '</h2><p>' + esc(p) + '</p>' +
      (chips ? '<div class="chips">' + chips + '</div>' : '') + storeLink('result_app', 'Get Step Gunner free', 'fx-btn getbtn', { band: bandTag(R) }) + '</div>';
    var qr = '<div class="qrcol">' + qrTile('sm') + '<span class="fx-cap1">POINT YOUR IPHONE CAMERA HERE</span><span class="fx-cap2">OPENS THE APP STORE</span>' +
      '<span class="sub"><span>FREE</span><span class="sep"></span><span>4.8 ON THE APP STORE</span></span>' +
      storeLink('qr_link', 'NO PHONE? APP STORE PAGE<svg viewBox="0 0 24 24" aria-hidden="true">' + IC.ext + '</svg>', 'out', { band: bandTag(R) }) + '</div>';
    if (APP_VIDEO_LIVE) {
      return '<section class="fx-dark fx-app" id="app" aria-label="Step Gunner: scan to open on your phone"><div class="grid" aria-hidden="true"></div><div class="in" style="flex-direction:column">' + copy +
        '<div class="media"><div class="vid"><div class="vbox"><video id="app-video" src="/media/free120/app-27s.mp4" poster="/media/free120/app-27s-poster.jpg" muted loop playsinline preload="none" ' +
        'aria-label="Step Gunner App Store video: score readiness, next best step chains, ED pathways and study partners"></video>' +
        '<button type="button" class="pp" id="app-pp" aria-label="Play the video">' + icRaw('play', 16, '#fff') + '</button></div>' +
        '<div class="vcap"><b>THE APP IN 27 SECONDS</b><span class="sep"></span><span>NO SOUND</span><span class="sep"></span><span>EXAMPLE SCORES</span></div></div>' + qr + '</div></div></section>';
    }
    return '<section class="fx-dark fx-app novid" id="app" aria-label="Step Gunner: scan to open on your phone"><div class="grid" aria-hidden="true"></div><div class="in"><div class="wrap">' + copy +
      '<div class="media">' + qr + '</div></div></div></section>';
  }
  function bandTag(R) { if (!MODES[R.m].range) return 'tutor'; var b = bandIndex(R.pct); return b >= 0 ? String(BANDS[b].min) : 'under65'; }

  function wireResults() {
    $('btn-review').addEventListener('click', function () { openReview('wrong'); });
    var sh = $('btn-share'); if (sh) sh.addEventListener('click', openShare);
    $('btn-tostart').addEventListener('click', function () { setHash(''); showView('f-start'); renderStart(); });
    wireReadiness();
    var v = $('app-video'), pp = $('app-pp');
    if (v && pp) {
      var reduce = false; try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { reduce = false; }
      function paint() { var on = !v.paused; pp.innerHTML = on ? icRaw('pause', 16, '#fff', 2.6) : icRaw('play', 16, '#fff'); pp.setAttribute('aria-label', on ? 'Pause the video' : 'Play the video'); }
      pp.addEventListener('click', function () { if (v.paused) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
      v.addEventListener('play', paint); v.addEventListener('pause', paint);
      if (!reduce && 'IntersectionObserver' in window) {
        // Load and play only once the card is on screen (1.5 MB; most visitors never scroll there).
        var io = new IntersectionObserver(function (ents) {
          ents.forEach(function (en) {
            if (en.isIntersecting) { v.preload = 'auto'; v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () { paint(); }); }
            else if (!v.paused) v.pause();
          });
        }, { threshold: 0.4 });
        io.observe(v);
      }
    }
  }

  /* NBME / UWSA scores beside the band: the same readiness model as /readiness */
  function nbmeRows() { var r = lsGet('free120:nbme', null); return Array.isArray(r) && r.length ? r : [{ form: '', score: '', days: '' }]; }
  function validEntries(rows) { return rows.filter(function (r) { var s = parseInt(r.score, 10); return r.form && s >= 130 && s <= 300; }).map(function (r) { return { form: r.form, score: String(parseInt(r.score, 10)), days: r.days || '' }; }); }
  function currentNbme() {
    var R5 = window.F120R; if (!R5 || !R5.computeReadiness) return null;
    var e = validEntries(nbmeRows()); if (!e.length) return null;
    var out = R5.computeReadiness(e);
    return out.proj ? { low: out.proj.low, high: out.proj.high, center: out.proj.center, tier: out.proj.tier, n: e.length, entries: e } : null;
  }
  function readinessBox() {
    var R5 = window.F120R, rows = nbmeRows();
    var formOpts = function (v) { return '<option value="">Form</option>' + R5.FORMS.map(function (f) { return '<option' + (f === v ? ' selected' : '') + '>' + f + '</option>'; }).join(''); };
    var takenOpts = function (v) { return R5.TAKEN_OPTS.filter(function (o) { return o[0] !== 'x'; }).map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === v ? ' selected' : '') + '>' + (o[0] === '' ? 'When? (optional)' : o[1]) + '</option>'; }).join(''); };
    var h = '<section class="fx-ready" id="fx-ready"><div class="hd"><div class="t"><span class="fx-kick">ONE MORE STEP</span><h2>Add your NBME and UWSA scores</h2>' +
      '<p>The band above is students like you. Your own practice tests are more personal: add them and both land on one scale. Same model as the readiness check, which missed real scores by 4.1 points on average in a blind test of 32 score reports.</p></div></div>' +
      '<div class="fx-rlab" aria-hidden="true"><span>FORM</span><span>SCORE</span><span>TAKEN</span><span></span></div><div class="fx-rows" id="fx-rows">';
    rows.forEach(function (r, i) {
      h += '<div class="fx-rrow" data-i="' + i + '"><select aria-label="Practice form" data-f="form">' + formOpts(r.form) + '</select>' +
        '<input type="number" inputmode="numeric" min="130" max="300" placeholder="Score" aria-label="Score" data-f="score" value="' + esc(r.score) + '">' +
        '<select class="tk" aria-label="When you took it" data-f="days">' + takenOpts(r.days) + '</select>' +
        '<button type="button" class="x" aria-label="Remove this form" data-x="' + i + '">' + icRaw('x', 16, 'currentColor', 2.2) + '</button></div>';
    });
    h += '</div><div class="acts"><button type="button" class="fx-ghost" id="fx-add">' + ic('plus') + 'Add a form</button></div><div id="fx-rout"></div></section>';
    return h;
  }
  var captureTimer = null, captured = {};
  function paintReadiness() {
    var out = $('fx-rout'); if (!out) return;
    var nb = currentNbme(), R = resState.R;
    renderChart(R, nb);
    if (!nb) { out.innerHTML = ''; return; }
    var link = '/readiness?e=' + window.F120R.encodeShare(nb.entries, '', '');
    out.innerHTML = '<div class="fx-rout"><span class="v">' + nb.low + ' to ' + nb.high + '</span><span class="s">From your ' + (nb.n === 1 ? 'practice test' : nb.n + ' practice tests') +
      ', most likely ' + nb.center + '. ' + esc(window.F120R.shortTier(nb.tier)) + ' range' + (/add your exam date/.test(nb.tier) ? ': add when you took each form to tighten it.' : '.') + ' It is drawn in green on the chart above.</span></div>' +
      '<div class="acts" style="margin-top:12px"><a class="fx-btn" href="' + link + '" id="fx-open-ready">See the full readiness check' + ic('arrow') + '</a>' +
      storeLink('readiness', 'Track it in the app', 'fx-btn2', { band: bandTag(R) }) + '</div>';
    scheduleCapture(nb, R);
  }
  function scheduleCapture(nb, R) {
    clearTimeout(captureTimer);
    var sig = JSON.stringify(nb.entries);
    if (captured[sig]) return;
    captureTimer = setTimeout(function () {
      captured[sig] = true;
      var R5 = window.F120R, vis = R5.visitorIdentity ? R5.visitorIdentity() : null;
      var body = {
        entries: nb.entries.map(function (e) { return { form: e.form, score: e.score, days: e.days, dateSource: R5.takenSource(e.days) }; }),
        projected: { low: nb.low, high: nb.high }, source: 'free120', modelVersion: R5.MODEL_VERSION,
        visitor: vis ? { id: vis.vid, session: vis.sid, firstSeen: vis.firstSeen } : null,
        free120: { form: FORM, mode: R.m, pct: R.pct, correct: R.c, total: R.N }
      };
      try { fetch('/api/readiness', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(function () {}); } catch (e) { /* offline is fine */ }
      track('free120_readiness', { form: FORM, n_forms: nb.n });
    }, 2500);
  }
  function wireReadiness() {
    var box = $('fx-ready'); if (!box) { return; }
    function rowsFromDom() {
      return Array.prototype.map.call(box.querySelectorAll('.fx-rrow'), function (el) {
        return { form: el.querySelector('[data-f="form"]').value, score: el.querySelector('[data-f="score"]').value, days: el.querySelector('[data-f="days"]').value };
      });
    }
    box.addEventListener('input', function () { lsSet('free120:nbme', rowsFromDom()); paintReadiness(); });
    box.addEventListener('change', function () { lsSet('free120:nbme', rowsFromDom()); paintReadiness(); });
    box.addEventListener('click', function (e) {
      var x = e.target.closest('[data-x]');
      if (x) {
        var rows = rowsFromDom(); rows.splice(parseInt(x.dataset.x, 10), 1);
        lsSet('free120:nbme', rows.length ? rows : [{ form: '', score: '', days: '' }]);
        rerenderReadiness(); return;
      }
      if (e.target.closest('#fx-add')) {
        var r2 = rowsFromDom(); if (r2.length >= 8) return;
        r2.push({ form: '', score: '', days: '' }); lsSet('free120:nbme', r2); rerenderReadiness();
        var sel = box.querySelectorAll('.fx-rrow select[data-f="form"]'); if (sel.length) sel[sel.length - 1].focus();
      }
    });
    paintReadiness();
  }
  function rerenderReadiness() {
    var old = $('fx-ready'); if (!old) return;
    var tmp = document.createElement('div'); tmp.innerHTML = readinessBox();
    old.parentNode.replaceChild(tmp.firstChild, old);
    wireReadiness();
  }

  /* ───────────────────────── share image (1080 x 1350) ───────────────────────── */
  var shareUrlCache = null;
  function drawShare(R) {
    var b = BANDS[bandIndex(R.pct)], W = 1080, H = 1350;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var x = cv.getContext('2d');
    var g = x.createLinearGradient(0, 0, W * 0.42, H); g.addColorStop(0, '#131d33'); g.addColorStop(0.46, '#0a0f1c'); g.addColorStop(1, '#05070d');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    function glow(cx, cy, r, rgba) { var rg = x.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, rgba); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H); }
    glow(W * 0.88, H * 0.18, 700, 'rgba(10,132,255,0.30)');
    glow(W * 0.06, H * 0.92, 640, 'rgba(48,209,88,0.16)');
    // grid, fading out from the middle
    var gc = document.createElement('canvas'); gc.width = W; gc.height = H; var gx = gc.getContext('2d');
    gx.strokeStyle = 'rgba(255,255,255,0.05)'; gx.lineWidth = 1;
    for (var i = 0; i <= W; i += 54) { gx.beginPath(); gx.moveTo(i + 0.5, 0); gx.lineTo(i + 0.5, H); gx.stroke(); }
    for (var j = 0; j <= H; j += 54) { gx.beginPath(); gx.moveTo(0, j + 0.5); gx.lineTo(W, j + 0.5); gx.stroke(); }
    gx.globalCompositeOperation = 'destination-in';
    var mg = gx.createRadialGradient(W * 0.6, H * 0.4, 0, W * 0.6, H * 0.4, 860); mg.addColorStop(0, 'rgba(0,0,0,1)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
    gx.fillStyle = mg; gx.fillRect(0, 0, W, H);
    x.drawImage(gc, 0, 0);
    var SANS = 'Inter, "Helvetica Neue", Arial, sans-serif', MONO = '"JetBrains Mono", "SF Mono", Menlo, monospace';
    x.textBaseline = 'alphabetic';
    // wordmark
    x.fillStyle = '#30d158'; x.shadowColor = 'rgba(48,209,88,0.85)'; x.shadowBlur = 16; x.beginPath(); x.arc(94, 112, 6.5, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
    x.font = '700 30px ' + MONO; x.fillStyle = '#0a84ff'; spaced(x, 'STEP', 116, 123, 5);
    var w1 = measureSpaced(x, 'STEP', 5);
    x.font = '600 23px ' + MONO; x.fillStyle = 'rgba(255,255,255,0.88)'; spaced(x, 'GUNNER', 116 + w1 + 14, 123, 5);
    x.font = '600 22px ' + MONO; x.fillStyle = '#8f9aad'; x.textAlign = 'right'; x.fillText(MODES[R.m].long.toUpperCase(), W - 88, 122); x.textAlign = 'left';
    x.font = '600 28px ' + MONO; x.fillStyle = '#8f9aad'; spaced(x, 'MY FREE 120 · ' + FORM + ' FORM', 88, 268, 5);
    // the number
    x.font = '800 300px ' + SANS;
    var tg = x.createLinearGradient(0, 300, 0, 560); tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.55, '#ffffff'); tg.addColorStop(1, '#b3bdcc');
    x.fillStyle = tg; x.fillText(R.pct + '%', 76, 548);
    x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(88, 640, W - 176, 2);
    x.font = '400 38px ' + SANS; x.fillStyle = '#b3bdcc'; x.fillText('Students in my band scored', 88, 722);
    x.font = '800 116px ' + SANS; x.fillStyle = '#ffffff'; x.fillText(b.q1 + ' to ' + b.q3, 82, 846);
    x.font = '400 34px ' + SANS; x.fillStyle = '#b3bdcc'; x.fillText('on Step 2. Median ' + b.med + ', from ' + b.n + ' real score reports.', 88, 910);
    // range bar on 240..275
    var L = 88, Wd = W - 176, top = 966;
    function px(v) { return L + Wd * (v - 240) / 35; }
    x.fillStyle = 'rgba(255,255,255,0.10)'; roundRect(x, L, top + 18, Wd, 4, 2); x.fill();
    var bg2 = x.createLinearGradient(px(b.q1), 0, px(b.q3), 0); bg2.addColorStop(0, '#4da3ff'); bg2.addColorStop(1, '#0a84ff');
    x.shadowColor = 'rgba(10,132,255,0.55)'; x.shadowBlur = 34; x.fillStyle = bg2; roundRect(x, px(b.q1), top + 6, px(b.q3) - px(b.q1), 28, 14); x.fill(); x.shadowBlur = 0;
    x.fillStyle = '#0a0f1c'; x.beginPath(); x.arc(px(b.med), top + 20, 18, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(px(b.med), top + 20, 13, 0, Math.PI * 2); x.fill();
    x.font = '500 22px ' + MONO; x.fillStyle = '#8f9aad';
    [240, 250, 260, 270].forEach(function (v, k) { x.textAlign = k === 0 ? 'left' : 'center'; x.fillText(String(v), px(v), top + 76); });
    x.textAlign = 'left';
    // footer card
    var fy = H - 80 - 150;
    x.fillStyle = 'rgba(255,255,255,0.05)'; roundRect(x, 88, fy, W - 176, 150, 28); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 2; roundRect(x, 89, fy + 1, W - 178, 148, 27); x.stroke();
    x.font = '700 30px ' + SANS; x.fillStyle = '#ffffff'; x.fillText('Sit it free, like test day', 118, fy + 62);
    x.font = '600 28px ' + MONO; x.fillStyle = '#30d158'; x.fillText('stepgunner.com/free120', 118, fy + 108);
    x.font = '600 20px ' + MONO; x.fillStyle = '#8f9aad'; x.textAlign = 'right';
    x.fillText('NO ACCOUNT', W - 118, fy + 66); x.fillText('NOTHING UPLOADED', W - 118, fy + 98); x.textAlign = 'left';
    return cv;
  }
  function spaced(x, s, X, Y, sp) { for (var i = 0; i < s.length; i++) { x.fillText(s[i], X, Y); X += x.measureText(s[i]).width + sp; } }
  function measureSpaced(x, s, sp) { var w = 0; for (var i = 0; i < s.length; i++) w += x.measureText(s[i]).width + sp; return w - sp; }
  function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

  function openShare() {
    var R = resState.R, el = $('share'), bx = el.querySelector('.box');
    bx.innerHTML = '<button type="button" class="x" id="sh-x" aria-label="Close">' + icRaw('x', 16, '#fff', 2.2) + '</button><p>Making your image</p>';
    el.classList.add('open');
    $('sh-x').addEventListener('click', closeShare);
    var fonts = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 100px Inter'), document.fonts.load('400 30px Inter'), document.fonts.load('700 30px Inter'), document.fonts.load('600 28px "JetBrains Mono"')]) : Promise.resolve();
    fonts.catch(function () {}).then(function () {
      var cv = drawShare(R);
      cv.toBlob(function (blob) {
        if (!blob) { bx.innerHTML = '<p>Your browser could not make the image.</p>'; return; }
        if (shareUrlCache) URL.revokeObjectURL(shareUrlCache);
        shareUrlCache = URL.createObjectURL(blob);
        var file = null; try { file = new File([blob], 'free120-' + FORM + '.png', { type: 'image/png' }); } catch (e) { file = null; }
        var canFile = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
        bx.innerHTML = '<button type="button" class="x" id="sh-x" aria-label="Close">' + icRaw('x', 16, '#fff', 2.2) + '</button>' +
          '<img src="' + shareUrlCache + '" alt="Your Free 120 result: ' + R.pct + ' percent, students in your band scored ' + BANDS[bandIndex(R.pct)].q1 + ' to ' + BANDS[bandIndex(R.pct)].q3 + '" width="1080" height="1350">' +
          '<div class="row">' + (canFile ? '<button type="button" class="fx-btn" id="sh-share">' + ic('share') + 'Share</button>' : '') +
          '<a class="' + (canFile ? 'fx-btn2' : 'fx-btn') + '" id="sh-save" href="' + shareUrlCache + '" download="free120-' + FORM + '.png">' + ic('down') + 'Save image</a></div>' +
          '<p>Made on this device. Nothing about your answers is uploaded.</p>';
        $('sh-x').addEventListener('click', closeShare);
        $('sh-save').addEventListener('click', function () { track('free120_share', { form: FORM, method: 'save' }); });
        var s = $('sh-share');
        if (s) s.addEventListener('click', function () {
          navigator.share({ files: [file], text: 'My Free 120. Sit it free, like test day: stepgunner.com/free120' }).then(function () {
            track('free120_share', { form: FORM, method: 'share' });
          }).catch(function () { /* dismissed */ });
        });
      }, 'image/png');
    });
  }
  function closeShare() { $('share').classList.remove('open'); }

  /* ───────────────────────── review, two panes ───────────────────────── */
  var rv = { filter: 'wrong', sys: '', cur: null, rows: [] };
  var FILTERS = [['all', 'All'], ['wrong', 'Wrong'], ['marked', 'Marked'], ['changed', 'Changed'], ['slow', 'Over 2 min'], ['blank', 'Blank']];
  function rvPass(r, f) {
    if (f === 'wrong') return r.res === 'wrong'; if (f === 'blank') return r.res === 'blank'; if (f === 'marked') return r.marked;
    if (f === 'changed') return r.changed; if (f === 'slow') return r.slow; return true;
  }
  function rvList() { return rv.rows.filter(function (r) { return rvPass(r, rv.filter) && (!rv.sys || r.system === rv.sys); }); }
  function openReview(filter, n) {
    var R = resState.R || results(); resState.R = R;
    rv.rows = R.rows;
    rv.filter = filter || 'all';
    if (!rvList().length) rv.filter = 'all';
    rv.sys = '';
    var list = rvList();
    rv.cur = n != null ? n : (list[0] && list[0].n);
    renderReviewShell(R);
    renderReviewList(); renderReviewQ();
    showView('f-review');
    setHash('review');
    track('free120_review_open', { form: FORM, filter: rv.filter });
  }
  function renderReviewShell(R) {
    var counts = {};
    FILTERS.forEach(function (f) { counts[f[0]] = R.rows.filter(function (r) { return rvPass(r, f[0]); }).length; });
    var sysw = groupBy(R.rows, 'system').sort(function (a, b) { return b.wrong - a.wrong || a.name.localeCompare(b.name); });
    $('f-review').innerHTML = '<div class="fx-rv"><header class="top"><div class="in">' +
      '<button type="button" class="fx-ghost" id="rv-back" style="color:var(--fx-act)">' + ic('back') + 'Results</button><span class="sep" aria-hidden="true"></span>' +
      '<h1>Review · ' + esc(FORM) + ' form</h1><span class="sum">' + R.c + ' RIGHT · ' + R.w + ' WRONG' + (R.bl ? ' · ' + R.bl + ' BLANK' : '') + ' · ' + R.pct + '%</span></div></header>' +
      '<div class="body"><aside aria-label="Questions"><div class="filters" role="group" aria-label="Filter">' +
      FILTERS.filter(function (f) { return f[0] === 'all' || counts[f[0]]; }).map(function (f) {
        return '<button type="button" class="fx-chip' + (rv.filter === f[0] ? ' on' : '') + '" aria-pressed="' + (rv.filter === f[0]) + '" data-f="' + f[0] + '">' + f[1] + ' ' + counts[f[0]] + '</button>';
      }).join('') + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px"><label class="k" for="rv-sys">SYSTEM</label><select id="rv-sys"><option value="">All systems</option>' +
      sysw.map(function (g) { return '<option value="' + esc(g.name) + '">' + esc(sysName(g.name)) + (g.wrong ? ' (' + g.wrong + ' wrong)' : '') + '</option>'; }).join('') + '</select></div>' +
      '<div class="list" id="rv-list"></div></aside><main id="rv-main" tabindex="-1"></main></div></div>';
    $('rv-back').addEventListener('click', function () { showResults(); });
    $('f-review').querySelectorAll('.filters [data-f]').forEach(function (b) {
      b.addEventListener('click', function () {
        rv.filter = b.dataset.f;
        $('f-review').querySelectorAll('.filters [data-f]').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var l = rvList(); if (!l.some(function (r) { return r.n === rv.cur; })) rv.cur = l[0] ? l[0].n : null;
        renderReviewList(); renderReviewQ();
      });
    });
    $('rv-sys').addEventListener('change', function () {
      rv.sys = this.value;
      var l = rvList(); if (!l.some(function (r) { return r.n === rv.cur; })) rv.cur = l[0] ? l[0].n : null;
      renderReviewList(); renderReviewQ();
    });
  }
  var RV_IC = { wrong: ['w', IC.x], right: ['r', IC.check], blank: ['b', IC.circle] };
  function renderReviewList() {
    var list = rvList(), host = $('rv-list');
    if (!list.length) { host.innerHTML = '<div class="empty">No questions match.</div>'; return; }
    host.innerHTML = list.map(function (r) {
      var i2 = RV_IC[r.res];
      return '<button type="button" class="it' + (r.n === rv.cur ? ' on' : '') + '" data-n="' + r.n + '"' + (r.n === rv.cur ? ' aria-current="true"' : '') + '>' +
        '<span class="ic ' + i2[0] + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + i2[1] + '</svg></span>' +
        '<span class="id">B' + (r.bi + 1) + ' · ' + (r.ii + 1) + '</span><span class="sy">' + esc(sysName(r.system)) + '</span>' +
        '<span class="tm' + (r.slow ? ' slow' : '') + '">' + (r.t == null ? '' : fmtShort(r.t)) + '</span></button>';
    }).join('');
    host.querySelectorAll('.it').forEach(function (b) {
      b.addEventListener('click', function () {
        rv.cur = parseInt(b.dataset.n, 10); renderReviewList(); renderReviewQ();
        if (window.matchMedia('(max-width: 940px)').matches) { var m = $('rv-main'); m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  }
  function renderReviewQ() {
    var main = $('rv-main'), r = rv.rows.filter(function (x) { return x.n === rv.cur; })[0];
    if (!r) { main.innerHTML = '<p style="color:var(--fx-ink-3)">Pick a question on the left.</p>'; return; }
    var it = r.it, qm = META[it.n] || {}, list = rvList(), pos = list.indexOf(r);
    var pills = '<span class="fx-pill">' + esc(sysName(r.system)) + '</span>';
    if (r.t != null) pills += '<span class="fx-pill' + (r.slow ? ' slow' : '') + '">' + ic('clock') + fmtShort(r.t) + '</span>';
    if (r.changed) {
      var good = r.you === r.ans, bad = r.first === r.ans;
      pills += '<span class="fx-pill ' + (good ? 'good' : bad ? 'bad' : '') + '">Changed ' + r.first + ' to ' + r.you + (good ? ': wrong to right' : bad ? ': right to wrong' : '') + '</span>';
    }
    if (r.marked) pills += '<span class="fx-pill">Marked</span>';
    var h = '<div class="qh"><span class="t">Block ' + (r.bi + 1) + ' · Question ' + (r.ii + 1) + '</span>' + pills + '</div>';
    var abText = qm.abstract || it.abstract;
    if (abText) h += '<div class="abstract" id="rv-ab"><span class="k">SHARED ABSTRACT</span></div>';
    h += '<div class="stem" id="rv-stem"></div><div class="figs" id="rv-figs"></div>';
    var grid = qm.optionGrid;
    if (grid && grid.cols) h += '<div class="ohead" style="grid-template-columns:26px repeat(' + grid.cols.length + ', 1fr) auto">' + '<span></span>' + grid.cols.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '<span></span></div>';
    h += '<div class="opts2">';
    it.options.forEach(function (o) {
      var cls = '', tag = '';
      if (o.letter === r.ans) { cls = 'ok'; tag = r.you === r.ans ? 'Correct · your answer' : (r.first === r.ans ? 'Correct · your first pick' : 'Correct'); }
      else if (o.letter === r.you) { cls = 'no'; tag = 'Your final answer'; }
      else if (o.letter === r.first) { cls = 'first'; tag = 'Your first pick'; }
      var body = grid && grid.cols
        ? o.text.trim().split(/\s+/).slice(0, grid.cols.length).map(function (v) { return '<span>' + esc(v) + '</span>'; }).join('')
        : '<span class="tx">' + esc(o.text) + '</span>';
      h += '<div class="o ' + cls + (grid && grid.cols ? ' grid' : '') + '"' + (grid && grid.cols ? ' style="grid-template-columns:26px repeat(' + grid.cols.length + ', 1fr) auto"' : '') + '>' +
        '<span class="l">' + o.letter + '</span>' + body + '<span class="tg">' + tag + '</span></div>';
    });
    h += '</div>';
    if (qm.explanation) {
      h += '<section class="fx-why" aria-label="Explanation"><span class="k">WHY ' + esc(r.ans) + (qm.topic ? ' · ' + esc(qm.topic.toUpperCase()) : '') + '</span><p>' + esc(qm.explanation) + '</p>' +
        '<div class="more2"><span class="gd" aria-hidden="true"></span><span><b>More like this:</b> ' + esc(sysName(r.system)) + ' next best steps in Step Gunner, ten at a time.</span>' +
        storeLink('review', 'Get the app' + ic('arrow'), '', { system: sysName(r.system) }) + '</div></section>';
    }
    h += '<div class="nav"><button type="button" class="fx-btn2" id="rv-prev"' + (pos <= 0 ? ' disabled' : '') + '>Previous</button>' +
      '<button type="button" class="fx-btn" id="rv-next"' + (pos >= list.length - 1 ? ' disabled' : '') + '>Next' + (rv.filter !== 'all' ? ' ' + FILTERS.filter(function (f) { return f[0] === rv.filter; })[0][1].toLowerCase() : '') + '</button>' +
      '<span class="keys" aria-hidden="true"><kbd>J</kbd><kbd>K</kbd>move through the list</span></div>';
    main.innerHTML = h;
    if (abText) { var ab = document.createElement('div'); renderRich(ab, abText); while (ab.firstChild) $('rv-ab').appendChild(ab.firstChild); }
    renderRich($('rv-stem'), stemFor(it));
    drawImages($('rv-figs'), it, function () { if (rv.cur === it.n) renderReviewQ(); });
    $('rv-prev').addEventListener('click', function () { rvStep(-1); });
    $('rv-next').addEventListener('click', function () { rvStep(1); });
  }
  function rvStep(d) {
    var list = rvList(), i = list.findIndex(function (x) { return x.n === rv.cur; });
    var nx = list[i + d]; if (!nx) return;
    rv.cur = nx.n; renderReviewList(); renderReviewQ();
    var on = $('rv-list').querySelector('.it.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    $('rv-main').scrollTop = 0; if (window.matchMedia('(min-width: 941px)').matches) window.scrollTo(0, 0);
  }
  function reviewKeys(e) {
    var tag = (e.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') { rvStep(1); e.preventDefault(); }
    if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') { rvStep(-1); e.preventDefault(); }
    if (e.key === 'Escape') showResults();
  }

  /* ───────────────────────── phone: send it to the laptop ───────────────────────── */
  function renderPhone() {
    var url = location.origin + location.pathname;
    var title = FORM ? 'Free 120 · ' + FORM + ' form' : 'Free 120';
    var mail = 'mailto:?subject=' + encodeURIComponent('Free 120 for my laptop') + '&body=' + encodeURIComponent(url);
    $('f-phone').innerHTML = '<div class="fx-phbar"><b>USMLE Step 2 CK</b><span>' + esc(title) + '</span></div><div class="fx-ph">' +
      '<div class="card"><h1>This exam wants a laptop.</h1><p>120 questions, about 3 hours, lab values beside every question. It runs on a phone, but it sits like the real thing on a bigger screen.</p>' +
      '<div class="fx-kick" style="margin-top:4px">SEND THE LINK TO YOUR LAPTOP</div><div class="row">' +
      (navigator.share ? '<button type="button" class="fx-btn" id="ph-share">' + ic('share') + 'Send link</button>' : '') +
      '<button type="button" class="fx-btn2" id="ph-copy">' + ic('copy') + 'Copy link</button>' +
      '<a class="fx-btn2" id="ph-mail" href="' + esc(mail) + '">' + ic('mail') + 'Email it to me</a></div>' +
      '<p class="msg" id="ph-msg" role="status"></p>' +
      '<button type="button" class="fx-linkbtn" id="ph-anyway" style="align-self:flex-start">Start on this phone anyway</button></div>' +
      '<div class="fx-warm"><div class="hd"><span class="k">WHILE YOU ARE HERE</span><h2>Warm up with one next best step.</h2></div>' +
      '<div class="q" id="ph-q"><div class="m"><span>DKA · IN THE ED</span><span>DECISION 2</span></div>' +
      '<p>Glucose 520, pH 7.10, bicarbonate 9, potassium 3.1. Fluids are running. <b>What comes next?</b></p>' +
      '<button type="button" data-k="A"><span>A</span>Start the insulin drip</button><button type="button" data-k="B"><span>B</span>Replace potassium, hold the insulin</button><button type="button" data-k="C"><span>C</span>Give sodium bicarbonate</button>' +
      '<div class="why" id="ph-why" hidden><b id="ph-v"></b><span>With potassium under 3.5, insulin waits: it drives potassium into the cells and can stop the heart. Bicarbonate is for a pH under 7.0.</span></div></div>' +
      '<div class="ft"><p>That was one step of the app\'s DKA chain, from the ED door to the floor. Step Gunner drills the next step, one chain a day.</p>' +
      storeLink('phone', 'Get Step Gunner free<small>iPhone · 4.8 on the App Store</small>', 'fx-store') + '</div></div>' +
      '<p class="fine">Free, no account, nothing leaves your browser.</p></div>';
    var msg = $('ph-msg');
    var sh = $('ph-share'); if (sh) sh.addEventListener('click', function () {
      navigator.share({ title: 'Step 2 CK ' + title, url: url }).then(function () { track('free120_phone_send', { method: 'share' }); }).catch(function () {});
    });
    $('ph-copy').addEventListener('click', function () {
      var ok = function () { msg.textContent = 'Copied. Paste it on your laptop.'; track('free120_phone_send', { method: 'copy' }); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok).catch(function () { msg.textContent = url; });
      else msg.textContent = url;
    });
    $('ph-mail').addEventListener('click', function () { track('free120_phone_send', { method: 'email' }); });
    $('ph-anyway').addEventListener('click', function () {
      try { sessionStorage.setItem('free120:phoneok', '1'); } catch (e) { /* ignore */ }
      showView('f-start'); renderStart();
    });
    $('ph-q').querySelectorAll('button[data-k]').forEach(function (b) {
      b.addEventListener('click', function () {
        var pick = b.dataset.k;
        $('ph-q').querySelectorAll('button[data-k]').forEach(function (x) { x.className = x.dataset.k === 'B' ? 'right' : (x.dataset.k === pick ? 'wrong' : ''); });
        var why = $('ph-why'); why.hidden = false;
        var v = $('ph-v'); v.textContent = pick === 'B' ? 'Right. Potassium first.' : 'Not yet. Potassium first.'; v.style.color = pick === 'B' ? '#30d158' : '#ffb199';
        track('free120_warmup', { right: pick === 'B' });
      });
    });
  }
  function wantsPhone() {
    var narrow = false; try { narrow = window.matchMedia('(max-width: 700px)').matches; } catch (e) { narrow = false; }
    if (!narrow) return false;
    try { if (sessionStorage.getItem('free120:phoneok')) return false; } catch (e) { /* ignore */ }
    if (location.hash) return false;
    if (lsKeys('free120:').some(function (k) { return /:(prog|inprog)$/.test(k); })) return false;
    if (lsGet('free120_prog_v2', null) || lsGet('free120_prog40_v1', null)) return false;
    return true;
  }

  /* ───────────────────────── the hub: your own PDF ───────────────────────── */
  var pdfFile = null;
  function pdfPanel() {
    if (!pdfOpen) return '';
    return '<div class="fx-pdf" id="pdf"><div class="drop" id="pdf-drop" role="button" tabindex="0"><b>Drop your Free 120 PDF here, or click to choose</b><span>The official PDF from the NBME site. It never leaves your browser.</span></div>' +
      '<input type="file" id="pdf-file" accept="application/pdf" style="display:none">' +
      '<div class="row"><label for="pdf-year" class="fx-kick">WHICH FORM</label><select id="pdf-year"><option value="2021">2021 edition</option><option value="2019">2019 edition</option></select>' +
      '<button type="button" class="fx-btn" id="pdf-build" disabled>Build my test</button></div>' +
      '<div class="status" id="pdf-status" role="status"></div>' +
      '<p class="fine"><b>Private and local.</b> Your PDF is read in your browser to build the test; nothing is uploaded. Explanations and the score range come with this page; the questions come only from your file. A newer form the reader cannot parse is told to you plainly.</p></div>';
  }
  function wirePdf() {
    var drop = $('pdf-drop'), input = $('pdf-file'), build = $('pdf-build'), st = $('pdf-status');
    if (!drop) return;
    function pick(f) {
      if (!f) return;
      if (f.type && f.type.indexOf('pdf') === -1 && !/\.pdf$/i.test(f.name)) { st.textContent = 'Please choose a PDF file.'; st.classList.add('err'); return; }
      pdfFile = f; build.disabled = false; st.classList.remove('err');
      st.textContent = 'Ready: ' + f.name + ' (' + Math.round(f.size / 1024) + ' KB). Choose the form, then Build my test.';
    }
    drop.addEventListener('click', function () { input.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', function (e) { pick(e.target.files[0]); });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); pick(e.dataTransfer.files[0]); });
    build.addEventListener('click', function () { if (pdfFile) buildFromPdf(pdfFile, $('pdf-year').value); });
  }
  function buildFromPdf(file, year) {
    var st = $('pdf-status'); st.classList.remove('err');
    if (!window.pdfjsLib || !window.Free120Parser) { st.textContent = 'The PDF reader did not load. Check your connection and refresh.'; st.classList.add('err'); return; }
    st.textContent = 'Reading the PDF';
    file.arrayBuffer().then(function (buf) { return window.pdfjsLib.getDocument({ data: buf }).promise; }).then(function (pdf) {
      st.textContent = 'Reading ' + pdf.numPages + ' pages';
      return window.Free120Parser.pdfToText(pdf).then(function (res) { return { pdf: pdf, full: res.full }; });
    }).then(function (o) {
      st.textContent = 'Finding the questions';
      var data = window.Free120Parser.parse(o.full);
      var nQ = data.questions ? data.questions.length : 0, nA = data._answers || 0;
      if (nQ < 100 || nA < 100 || !data.blocks) {
        st.textContent = 'Could not read a full 120 from that file (' + nQ + ' questions, ' + nA + ' answers). Make sure it is the official Free 120 PDF, not a scan. A form newer than 2021 may not parse yet.';
        st.classList.add('err'); return;
      }
      window._F120 = { pdf: o.pdf, year: year };
      FORM = year;
      useData(data, (window.FREE120_EXPLANATIONS && window.FREE120_EXPLANATIONS[year]) || {});
      claimLegacy();
      pdfOpen = false;
      track('free120_pdf_built', { year: year });
      renderStart();
    }).catch(function (e) {
      st.textContent = 'Could not read that PDF: ' + (e && e.message ? e.message : e);
      st.classList.add('err');
    });
  }

  /* ───────────────────────── backup ───────────────────────── */
  function exportProgress() {
    var dump = {};
    lsKeys('free120').forEach(function (k) { try { dump[k] = localStorage.getItem(k); } catch (e) { /* ignore */ } });
    var stamp = new Date().toISOString().slice(0, 10);
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }));
    a.download = 'free120_backup_' + stamp + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    var s = $('io-status'); if (s) s.textContent = 'Saved free120_backup_' + stamp + '.json (' + Object.keys(dump).length + ' items).';
  }
  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var obj, s = $('io-status');
      try { obj = JSON.parse(reader.result); } catch (e) { if (s) s.textContent = 'That is not a Free 120 backup file.'; return; }
      var n = 0;
      Object.keys(obj || {}).forEach(function (k) { if (k.indexOf('free120') === 0 && typeof obj[k] === 'string') { try { localStorage.setItem(k, obj[k]); n++; } catch (e) { /* full */ } } });
      if (s) s.textContent = 'Loaded ' + n + ' items. Reloading.';
      setTimeout(function () { location.reload(); }, 700);
    };
    reader.readAsText(file);
  }

  /* ───────────────────────── boot ───────────────────────── */
  function boot() {
    injectShell();
    applySettings();
    wireExam();
    $('import-file').addEventListener('change', function (e) { if (e.target.files[0]) importProgress(e.target.files[0]); });
    $('dlg').addEventListener('click', function (e) { if (e.target === $('dlg')) closeDlg(null); });
    $('share').addEventListener('click', function (e) { if (e.target === $('share')) closeShare(); });
    if (CFG.source !== 'pdf') {
      if (!bakedData()) {
        $('f-start-main').insertAdjacentHTML('beforeend', '<p style="color:var(--fx-red)">The questions did not load. Refresh the page.</p>');
        showView('f-start'); return;
      }
      claimLegacy();
    } else {
      pdfOpen = location.hash === '#pdf';
    }
    if (wantsPhone()) { renderPhone(); showView('f-phone'); return; }
    renderStart();
    showView('f-start');
    if (FORM && location.hash === '#results' && allDone(loadProg(), settings.mode)) showResults();
    else if (FORM && location.hash === '#results') {
      // the most recent finished sitting of this form
      var done = ['test', 'short', 'tutor'].filter(function (m) { return allDone(loadProg(FORM, m), m); });
      if (done.length) { settings.mode = done[0]; saveSettings(); rebuildBlocks(); renderStart(); showResults(); }
    } else if (FORM && location.hash === '#review' && allDone(loadProg(), settings.mode)) { showResults(); openReview('wrong'); }
    if (CFG.source === 'pdf' && pdfOpen) { var d = $('pdf-drop'); if (d) d.scrollIntoView({ block: 'center' }); }
  }
  window.addEventListener('hashchange', function () {
    if (!FORM || curView() === 'f-exam') return;
    if (location.hash === '#results' && allDone(loadProg(), settings.mode)) showResults();
    else if (!location.hash && (curView() === 'f-results' || curView() === 'f-review')) { showView('f-start'); renderStart(); }
  });
  window.F120 = { version: '2026-11', settings: settings };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
