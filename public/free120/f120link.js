/* The Free 120 knockout link: stepgunner.com/f/<code>.

   A code is the form's two-digit tag, a dash, then 120 bits as 20 base64url
   characters: bit n-1 (most significant bit first in each byte) is set when
   question n was missed, wrong or blank. Everything the app needs is in the
   link, so there is no server, no account and no expiry; the app decodes the
   same format (Free120Link.swift in the app repo). Never change the layout of
   an existing tag: links already shared would decode wrong.

   Needs window.F120_KNOCKOUT (knockout.js, generated in the app repo). */
(function () {
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  var N = 120, BYTES = 15, CHARS = 20;

  function maps() { return window.F120_KNOCKOUT || {}; }
  function formFor(tag) {
    var m = maps();
    for (var f in m) if (m.hasOwnProperty(f) && m[f].tag === tag) return f;
    return null;
  }

  function encodeMask(missed) {
    var bytes = [];
    for (var i = 0; i < BYTES; i++) bytes.push(0);
    missed.forEach(function (n) {
      n = +n;
      if (n >= 1 && n <= N) bytes[(n - 1) >> 3] |= 0x80 >> ((n - 1) & 7);
    });
    var out = '';
    for (var j = 0; j < BYTES; j += 3) {
      var v = (bytes[j] << 16) | (bytes[j + 1] << 8) | bytes[j + 2];
      out += B64[(v >> 18) & 63] + B64[(v >> 12) & 63] + B64[(v >> 6) & 63] + B64[v & 63];
    }
    return out;
  }

  function decodeMask(s) {
    if (s.length !== CHARS) return null;
    var bytes = [];
    for (var j = 0; j < CHARS; j += 4) {
      var v = 0;
      for (var k = 0; k < 4; k++) {
        var d = B64.indexOf(s.charAt(j + k));
        if (d < 0) return null;
        v = (v << 6) | d;
      }
      bytes.push((v >> 16) & 255, (v >> 8) & 255, v & 255);
    }
    var missed = [];
    for (var n = 1; n <= N; n++) if (bytes[(n - 1) >> 3] & (0x80 >> ((n - 1) & 7))) missed.push(n);
    return missed;
  }

  function encode(form, missed) {
    var f = maps()[form];
    return f ? f.tag + '-' + encodeMask(missed) : null;
  }

  function decode(code) {
    var m = /^([0-9]{2})-([A-Za-z0-9_-]{20})$/.exec(String(code || ''));
    if (!m) return null;
    var form = formFor(m[1]), missed = decodeMask(m[2]);
    return form && missed ? { form: form, missed: missed } : null;
  }

  // The knockout list: every missed question's topic and the union of the app
  // questions mapped to it. Systems are ordered by misses, most first.
  function knockout(form, missed) {
    var f = maps()[form];
    if (!f) return null;
    var keys = {}, nKeys = 0, bySys = {}, order = [];
    missed.forEach(function (n) {
      var q = f.q[String(n)];
      if (!q) return;
      var ks = q.same.concat(q.near);
      ks.forEach(function (k) { if (!keys[k]) { keys[k] = 1; nKeys++; } });
      if (!bySys[q.s]) { bySys[q.s] = []; order.push(q.s); }
      bySys[q.s].push({ n: n, topic: q.t, count: ks.length });
    });
    var systems = order.map(function (s) { return { system: s, topics: bySys[s] }; })
      .sort(function (a, b) { return b.topics.length - a.topics.length || a.system.localeCompare(b.system); });
    return { missed: missed.length, questions: nKeys, systems: systems };
  }

  window.F120Link = {
    encode: encode,
    decode: decode,
    knockout: knockout,
    url: function (code) { return 'https://stepgunner.com/f/' + code; },
    appUrl: function (code) { return 'stepgunner://f/' + code; }
  };
})();
