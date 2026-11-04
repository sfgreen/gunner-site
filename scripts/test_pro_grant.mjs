// The web Pro unlock rule (decision 0051), run against the file the API imports.
//
//   node --test scripts/test_pro_grant.mjs        (npm run test:pro)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_MS, GRACE_MS, liveSub, webExpiresMs, manualMs, mergedMs, appStoreActive,
  normalizeCode, couponLabel, studentCodeForm, chiefCodeForm, extendManualMs, PRO_MONTH_DAYS, checkoutReturn,
} from '../lib/proGrant.ts';
import {
  FRIEND_PAYOUT_CENTS, FRIEND_YEAR_CAP_CENTS, FRIEND_HOLD_MS, earnedInYearCents, friendPayoutCents, reversalFields,
} from '../lib/referral.ts';

const NOW = Date.UTC(2026, 9, 30, 15);
const sub = (o) => ({ id: 's', status: 'active', periodEndMs: NOW + 30 * DAY_MS, cancelAtPeriodEnd: false, plan: 'monthly', ...o });

test('a live subscription pays through its period plus a grace day', () => {
  assert.equal(webExpiresMs([sub()]), NOW + 30 * DAY_MS + GRACE_MS);
  assert.equal(webExpiresMs([sub({ status: 'past_due' })]), NOW + 30 * DAY_MS + GRACE_MS);
  assert.equal(webExpiresMs([sub({ status: 'trialing' })]), NOW + 30 * DAY_MS + GRACE_MS);
});

test('nothing live means no web days', () => {
  for (const status of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused']) {
    assert.equal(webExpiresMs([sub({ status })]), null, status);
  }
  assert.equal(webExpiresMs([]), null);
});

test('a canceled-at-period-end subscription still pays to the end', () => {
  assert.equal(webExpiresMs([sub({ cancelAtPeriodEnd: true })]), NOW + 30 * DAY_MS + GRACE_MS);
});

test('of several, the live one that pays furthest ahead wins', () => {
  const a = sub({ id: 'a', periodEndMs: NOW + DAY_MS });
  const b = sub({ id: 'b', periodEndMs: NOW + 300 * DAY_MS, plan: 'yearly' });
  const c = sub({ id: 'c', status: 'canceled', periodEndMs: NOW + 900 * DAY_MS });
  assert.equal(liveSub([a, b, c]).id, 'b');
});

test('an old grant with neither new field is a manual grant', () => {
  const g = NOW + 7 * DAY_MS;
  assert.equal(manualMs({ hasManualField: false, manualMs: null, hasWebField: false, grantMs: g }), g);
});

test('once the manual field exists it is the truth, null included', () => {
  assert.equal(manualMs({ hasManualField: true, manualMs: null, hasWebField: true, grantMs: NOW + 99 * DAY_MS }), null);
  assert.equal(manualMs({ hasManualField: true, manualMs: NOW, hasWebField: true, grantMs: NOW + 99 * DAY_MS }), NOW);
});

test('a web field without a manual field means the grant came from the web', () => {
  assert.equal(manualMs({ hasManualField: false, manualMs: null, hasWebField: true, grantMs: NOW + 30 * DAY_MS }), null);
});

test('the grant is the later of comp and web; a cancel never erases a comp', () => {
  const comp = NOW + 365 * DAY_MS;
  assert.equal(mergedMs(comp, NOW + 30 * DAY_MS), comp);
  assert.equal(mergedMs(comp, null), comp, 'web canceled, comp stays');
  assert.equal(mergedMs(NOW + DAY_MS, NOW + 30 * DAY_MS), NOW + 30 * DAY_MS, 'a short comp never cuts a payer short');
  assert.equal(mergedMs(null, null), null);
});

test('a yearly friend earns the sharer $15, a monthly one $5, stacking up to the yearly cap', () => {
  assert.deepEqual(FRIEND_PAYOUT_CENTS, { yearly: 1500, monthly: 500 });
  assert.equal(FRIEND_YEAR_CAP_CENTS, 199500, 'under the $2,000 1099 line');
  assert.equal(FRIEND_HOLD_MS, 30 * DAY_MS);
  assert.equal(friendPayoutCents('yearly', 0), 1500);
  assert.equal(friendPayoutCents('monthly', 0), 500);
  assert.equal(friendPayoutCents('yearly', 4500), 1500, 'three friends in, the fourth still earns the full amount');
  assert.equal(friendPayoutCents('yearly', FRIEND_YEAR_CAP_CENTS - 700), 700, 'the last friend under the cap earns what is left');
  assert.equal(friendPayoutCents('monthly', FRIEND_YEAR_CAP_CENTS), 0);
  assert.equal(friendPayoutCents('yearly', -100), 1500, 'a bad negative sum never raises the reward');
});

test('the cap counts this calendar year, and only rows still earning', () => {
  const row = (o) => ({ status: 'pending', cents: 1500, firstPaidMs: NOW - DAY_MS, ...o });
  assert.equal(earnedInYearCents([row(), row({ status: 'payable' }), row({ status: 'paid' })], NOW), 4500);
  assert.equal(earnedInYearCents([row({ firstPaidMs: Date.UTC(2025, 11, 31) })], NOW), 0, 'last year');
  assert.equal(earnedInYearCents([row({ status: 'reversed' }), row({ status: 'reversed', paidAt: NOW })], NOW), 0);
  assert.equal(earnedInYearCents([row({ status: 'skipped', cents: 0 }), row({ status: 'forfeited', cents: 0 })], NOW), 0);
  assert.equal(earnedInYearCents([row({ firstPaidMs: null })], NOW), 1500, 'a row without a time yet counts');
});

test('only a refund of the first payment takes a reward back', () => {
  const r = (status, first = 'pi_first') => ({ status, firstPaymentIntent: first });
  const rev = (from) => ({ status: 'reversed', reversedFrom: from });
  assert.deepEqual(reversalFields(r('pending'), 'pi_first'), rev('pending'));
  assert.deepEqual(reversalFields(r('payable'), 'pi_first'), rev('payable'));
  assert.deepEqual(reversalFields(r('paid'), 'pi_first'), rev('paid'), 'keeps paidAt; the next run nets it');
  assert.equal(reversalFields(r('pending'), 'pi_renewal'), null, 'a later renewal refunded: the reward stands');
  assert.equal(reversalFields(r('paid'), null), null);
  assert.equal(reversalFields(r('reversed'), 'pi_first'), null, 'already taken back');
  assert.equal(reversalFields(r('skipped'), 'pi_first'), null);
  assert.equal(reversalFields(r('forfeited'), 'pi_first'), null);
  assert.deepEqual(reversalFields(r('pending', null), 'pi_any'), rev('pending'), 'first payment unknown: a refund inside the hold counts');
  assert.equal(reversalFields(r('payable', null), 'pi_any'), null, 'first payment unknown and past the hold: kept');
});

test('App Store paying matches the server rule', () => {
  assert.equal(appStoreActive('active', 'Production', NOW + DAY_MS, NOW), true);
  assert.equal(appStoreActive('active', undefined, null, NOW), true);
  assert.equal(appStoreActive('active', 'Sandbox', NOW + DAY_MS, NOW), false);
  assert.equal(appStoreActive('active', 'Production', NOW - DAY_MS, NOW), false);
  assert.equal(appStoreActive('expired', 'Production', NOW + DAY_MS, NOW), false);
});

test('codes normalize to uppercase and refuse junk', () => {
  assert.equal(normalizeCode('  alex-7q2 '), 'ALEX-7Q2');
  assert.equal(normalizeCode('josé-ab12'), 'JOSÉ-AB12', 'the app keeps non-ASCII letters');
  assert.equal(normalizeCode('ab'), null);
  assert.equal(normalizeCode('drop table;'), null);
  assert.equal(normalizeCode(42), null);
});

test('coupon labels say what comes off and when', () => {
  assert.equal(couponLabel({ percent_off: 40, duration: 'once' }, 'yearly'), '40% off your first year');
  assert.equal(couponLabel({ percent_off: 20, duration: 'once' }, 'monthly'), '20% off your first month');
  assert.equal(couponLabel({ amount_off: 1000, duration: 'once' }, 'monthly'), '$10.00 off your first month');
  assert.equal(couponLabel({ percent_off: 15, duration: 'repeating', duration_in_months: 3 }, 'monthly'), '15% off your first 3 months');
  assert.equal(couponLabel({ duration: 'once' }, 'yearly'), null);
});

test('a code works with or without its hyphen', () => {
  assert.equal(studentCodeForm('ALEX7Q2M'), 'ALEX-7Q2M');
  assert.equal(studentCodeForm('ALEX-7Q2M'), 'ALEX-7Q2M', 'already has it');
  assert.equal(studentCodeForm('GUNNER7Q2M'), 'GUNNER-7Q2M');
  assert.equal(studentCodeForm('\u0410\u041d\u042f7Q2M'), '\u0410\u041d\u042f-7Q2M', 'a non-Latin first name');
  assert.equal(studentCodeForm('7Q2M'), '7Q2M', 'too short to hold a prefix');
  assert.equal(chiefCodeForm('ALEX-7Q2M'), 'ALEX7Q2M');
  assert.equal(chiefCodeForm('MAYA50'), 'MAYA50');
});

test('a $5 friend coupon reads as $5 off the first payment', () => {
  assert.equal(couponLabel({ amount_off: 500, duration: 'once' }, 'monthly'), '$5.00 off your first month');
  assert.equal(couponLabel({ amount_off: 500, duration: 'once' }, 'yearly'), '$5.00 off your first year');
});

test('a Pro month extends a running grant from its end, a lapsed one from now', () => {
  assert.equal(PRO_MONTH_DAYS, 30);
  assert.equal(extendManualMs(NOW + 10 * DAY_MS, NOW, 30), NOW + 40 * DAY_MS, 'stacks on a running comp');
  assert.equal(extendManualMs(NOW - 10 * DAY_MS, NOW, 30), NOW + 30 * DAY_MS, 'a lapsed comp restarts today');
  assert.equal(extendManualMs(null, NOW, 60), NOW + 60 * DAY_MS, 'two friends, no comp');
});

test('checkout from the app returns to the universal link with the app-to-web page', () => {
  const app = checkoutReturn('app', 'https://stepgunner.com');
  assert.equal(app.success_url, 'https://stepgunner.com/pro/done?session={CHECKOUT_SESSION_ID}');
  assert.equal(app.cancel_url, 'https://stepgunner.com/pro/done?canceled=1');
  assert.equal(app.origin_context, 'mobile_app');
  const web = checkoutReturn('web', 'https://stepgunner.com');
  assert.deepEqual(web, { success_url: 'https://stepgunner.com/pro?paid={CHECKOUT_SESSION_ID}', cancel_url: 'https://stepgunner.com/pro?canceled=1' });
  assert.equal('origin_context' in web, false, 'the web keeps the default Checkout page');
});
