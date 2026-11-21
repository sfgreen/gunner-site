// The store sale on the web (gunner decision 0085 amendment 3), run against the file the API imports.
//
//   node --test scripts/test_sale_rule.mjs        (npm run test:pro)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countrySkipped, saleCode, webSaleFor } from '../lib/saleRule.ts';

const H = 3_600_000;
const START = Date.UTC(2026, 10, 22, 8); // Sun Nov 22 2:00 AM CST
const END = Date.UTC(2026, 11, 1, 5, 59, 59); // Mon Nov 30 11:59:59 PM CST
const doc = (over = {}) => ({
  active: true, code: 'BF50', name: 'Black Friday', startEpoch: START / 1000, endEpoch: END / 1000, holdHours: 48,
  excludeStorefronts: ['IND', 'PAK', 'NPL'], webCoupon: 'gunner_bf50_yearly', webPrice: '$49.99', ...over,
});

test('no sale before the start, at the end, when off, or with no web coupon', () => {
  assert.equal(webSaleFor(doc(), {}, 'US', START - 1), null);
  assert.equal(webSaleFor(doc(), {}, 'US', END), null);
  assert.equal(webSaleFor(doc({ active: false }), {}, 'US', START + H), null);
  assert.equal(webSaleFor(doc({ webCoupon: '' }), {}, 'US', START + H), null);
  assert.equal(webSaleFor(doc({ webPrice: undefined }), {}, 'US', START + H), null);
  assert.equal(webSaleFor(null, {}, 'US', START + H), null);
});

test('a first look starts a 48 hour hold and asks the caller to stamp it', () => {
  const now = START + 5 * H;
  const s = webSaleFor(doc(), {}, 'US', now);
  assert.equal(s.firstLook, true);
  assert.equal(s.endsAtMs, now + 48 * H);
  assert.equal(s.coupon, 'gunner_bf50_yearly');
  assert.equal(s.price, '$49.99');
});

test('the hold runs from the first look on file (seconds, as the app writes it), then never comes back', () => {
  const seen = START + 10 * H;
  const user = { saleSeen: { BF50: seen / 1000 + 0.25 } };
  const mid = webSaleFor(doc(), user, 'US', seen + 47 * H);
  assert.equal(mid.firstLook, false);
  assert.equal(mid.endsAtMs, seen + 48 * H + 250);
  assert.equal(webSaleFor(doc(), user, 'US', seen + 49 * H), null);
});

test('the hold never runs past the sale', () => {
  const seen = END - 10 * H;
  const s = webSaleFor(doc(), { saleSeen: { BF50: seen / 1000 } }, 'US', END - H);
  assert.equal(s.endsAtMs, END);
  const fresh = webSaleFor(doc(), {}, 'US', END - 2 * H);
  assert.equal(fresh.endsAtMs, END);
});

test('holdHours 0 means the sale end for everyone; a missing holdHours is 24 like the app', () => {
  assert.equal(webSaleFor(doc({ holdHours: 0 }), {}, 'US', START + H).endsAtMs, END);
  const d = doc(); delete d.holdHours;
  assert.equal(webSaleFor(d, {}, 'US', START + H).endsAtMs, START + 25 * H);
});

test('the skipped App Store countries match the visitor country; unknown is not skipped', () => {
  for (const c of ['IN', 'PK', 'NP', 'in']) assert.equal(webSaleFor(doc(), {}, c, START + H), null, c);
  assert.ok(webSaleFor(doc(), {}, 'US', START + H));
  assert.ok(webSaleFor(doc(), {}, '', START + H));
  assert.equal(countrySkipped(doc({ excludeStorefronts: ['GB'] }), 'GB'), true);
});

test('codes compare without case or punctuation', () => {
  assert.equal(saleCode(' bf-50 '), 'BF50');
  assert.equal(saleCode(null), '');
  assert.ok(webSaleFor(doc({ code: 'bf50' }), { saleSeen: { BF50: (START / 1000) } }, 'US', START + H));
});
