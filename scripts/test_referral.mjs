// Friend rewards and payouts (decision 0057 amendment), run against the files the
// API imports. Firestore and Stripe are mocked: an in-memory ledger that keeps the
// same contract as lib/referralServer.ts firestorePayoutPorts, and a Stripe that
// honors idempotency keys.
//
//   node --test scripts/test_referral.mjs        (part of npm run test:pro)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REFERRAL_DEFAULTS, referralConfig, earningsTotals, refundedAfterPayout, cashPayout, monthsPayout, monthsFrom,
  executeRuns, payoutIdFor, isCashCountry,
} from '../lib/referral.ts';
import { extendManualMs } from '../lib/proGrant.ts';
import { globalPayouts, onboardingStatusOf, GP_API_VERSION } from '../lib/globalPayouts.ts';
import {
  HANDOFF_TTL_MS, newHandoffCode, isHandoffCode, handoffKey, handoffPage, handoffRefusal,
} from '../lib/handoff.ts';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 11, 1, 16); // Dec 1 2026, 10 AM Central
const CFG = referralConfig({ cashEnabled: true });

// ---- config ----

test('config/referral falls back to the 0057 defaults key by key', () => {
  assert.deepEqual(referralConfig(undefined), REFERRAL_DEFAULTS);
  assert.equal(REFERRAL_DEFAULTS.cashEnabled, false, 'cash is off until Danny turns it on');
  assert.equal(REFERRAL_DEFAULTS.autoPayout, false, 'the first run waits for Danny (same default as functions/main.py)');
  assert.equal(REFERRAL_DEFAULTS.minPayoutCents, 2000);
  assert.equal(REFERRAL_DEFAULTS.yearCapCents, 199500);
  assert.equal(REFERRAL_DEFAULTS.monthlyBudgetCents, 25000);
  const c = referralConfig({ cashEnabled: true, holdDays: 45, minPayoutCents: '20', yearCapCents: -1, cashCountries: ['us', 'ca', 'USA', 7] });
  assert.equal(c.cashEnabled, true);
  assert.equal(c.holdDays, 45);
  assert.equal(c.minPayoutCents, 2000, 'a string is not a number');
  assert.equal(c.yearCapCents, 199500, 'a negative cap is ignored');
  assert.deepEqual(c.cashCountries, ['US', 'CA'], 'two-letter codes only, uppercased');
  assert.equal(isCashCountry('us', c), true);
  assert.equal(isCashCountry('GB', c), false);
  assert.equal(isCashCountry(null, c), false);
});

// ---- earnings totals ----

test('earnings totals: on hold, payable less refunds after payout, paid', () => {
  const t = earningsTotals([
    { status: 'pending', cents: 1500 },
    { status: 'pending', cents: 500 },
    { status: 'payable', cents: 1500 },
    { status: 'payable', cents: 1500 },
    { status: 'paid', cents: 1500, paidAt: NOW },
    { status: 'reversed', cents: 500, paidAt: NOW },
    { status: 'reversed', cents: 1500, paidAt: NOW, deductedInRun: '2026-11' },
    { status: 'reversed', cents: 1500 },
    { status: 'skipped', cents: 0 },
    { status: 'forfeited', cents: 0 },
  ]);
  assert.equal(t.friends, 10);
  assert.equal(t.pendingCents, 2000);
  assert.equal(t.payableCents, 3000);
  assert.equal(t.paidCents, 3500, 'money that went out, rows refunded after payout included');
  assert.equal(t.owedCents, 500, 'only the refund no run has netted yet');
  assert.equal(t.nextCents, 2500);
  assert.equal(earningsTotals([{ status: 'reversed', cents: 1500, paidAt: NOW }]).nextCents, 0, 'never below zero');
  assert.equal(refundedAfterPayout({ status: 'reversed', cents: 0, paidAt: NOW }), true);
  assert.equal(refundedAfterPayout({ status: 'reversed', cents: 0 }), false, 'refunded inside the hold: nothing went out');
  assert.deepEqual(earningsTotals([]), { friends: 0, pendingCents: 0, payableCents: 0, paidCents: 0, owedCents: 0, nextCents: 0 });
});

// ---- one line of an approved run ----

const RUN = { id: '2026-12' };
const cashLine = (uid, o = {}) => ({ sharerUid: uid, method: 'stripe_global_payouts', rowIds: ['f1', 'f2'], deductRowIds: [], cents: 3000, stripeRecipientId: `acct_${uid}`, ...o });
const monthsLine = (uid, o = {}) => ({ sharerUid: uid, method: 'pro_months', rowIds: ['g1', 'g2'], deductRowIds: [], cents: 2000, months: 2, ...o });
const cash = (uid, o = {}) => ({
  uid, preference: 'cash', onboardingStatus: 'complete', country: 'US', stripeRecipientId: `acct_${uid}`,
  payoutMethodId: `usba_${uid}`, destination: 'Chase ••6789', ...o,
});
const months = (uid) => ({ uid, preference: 'pro_months', onboardingStatus: null, country: 'GB', stripeRecipientId: null, payoutMethodId: null, destination: null });
const live = (pay, deduct = []) => ({ pay: pay.map(([id, cents]) => ({ id, cents })), deduct: deduct.map(([id, cents]) => ({ id, cents })) });

test('a cash line pays the rows still payable, less the refunds it nets, never more than approved', () => {
  const p = cashPayout(RUN, cashLine('sam', { deductRowIds: ['r0'], cents: 2500 }), live([['f1', 1500], ['f2', 1500]], [['r0', 500]]), cash('sam'), CFG);
  assert.equal(p.id, payoutIdFor('2026-12', 'sam'));
  assert.equal(p.id, '2026-12_sam');
  assert.equal(p.status, 'sending');
  assert.equal(p.cents, 2500);
  assert.equal(p.grossCents, 3000);
  assert.equal(p.deductCents, 500);
  assert.deepEqual(p.rowIds, ['f1', 'f2']);
  assert.deepEqual(p.deductRowIds, ['r0']);
  assert.equal(p.recipientId, 'acct_sam');
  assert.equal(p.payoutMethodId, 'usba_sam');
  const refunded = cashPayout(RUN, cashLine('sam'), live([['f1', 1500]]), cash('sam'), CFG);
  assert.equal(refunded.cents, 1500, 'a friend refunded since approval drops out; the line still pays the rest');
  assert.deepEqual(refunded.rowIds, ['f1']);
  const capped = cashPayout(RUN, cashLine('sam', { cents: 2000 }), live([['f1', 1500], ['f2', 1500]]), cash('sam'), CFG);
  assert.equal(capped.cents, 2000, 'never more than the line Admin approved');
});

test('a cash line waits when cash is off, setup is not complete, or nothing is left', () => {
  const l = cashLine('sam');
  const rows = live([['f1', 1500], ['f2', 1500]]);
  assert.equal(cashPayout(RUN, l, rows, cash('sam'), referralConfig({ cashEnabled: false })), 'cash_off');
  assert.equal(cashPayout(RUN, l, rows, null, CFG), 'recipient_incomplete');
  assert.equal(cashPayout(RUN, l, rows, cash('sam', { onboardingStatus: 'restricted' }), CFG), 'recipient_incomplete');
  assert.equal(cashPayout(RUN, l, rows, cash('sam', { country: 'GB' }), CFG), 'recipient_incomplete', 'cash only where cashCountries allows');
  assert.equal(cashPayout(RUN, l, live([]), cash('sam'), CFG), 'nothing_payable');
  assert.equal(cashPayout(RUN, l, live([['f1', 500]], [['r0', 1500]]), cash('sam'), CFG), 'nothing_payable', 'refunds ate it');
});

test('Pro months: one per paying friend, no minimum, each refund after payout takes one back', () => {
  const p = monthsPayout(RUN, monthsLine('gb'));
  assert.equal(p.method, 'pro_months');
  assert.equal(p.status, 'granting');
  assert.equal(p.months, 2);
  assert.equal(p.cents, 0);
  assert.equal(monthsPayout(RUN, monthsLine('gb', { months: undefined, rowIds: ['a'], deductRowIds: [] })).months, 1, 'one friend is enough');
  assert.deepEqual(monthsFrom(live([['a', 500], ['b', 1500]], [['r', 1500]])), { months: 1, deductUsed: [{ id: 'r', cents: 1500 }] });
  assert.deepEqual(monthsFrom(live([['a', 500]], [['r', 1500], ['s', 500]])).months, 0, 'never below zero, one refund per friend used');
  assert.equal(monthsFrom(live([['a', 500]], [['r', 1500], ['s', 500]])).deductUsed.length, 1);
});

// ---- the executor, against an in-memory ledger ----

function ledger({ rows = {}, recipients = {}, users = {}, runs = {}, payouts = {}, cfg = { cashEnabled: true } } = {}) {
  const db = {
    rows: new Map(Object.entries(rows).map(([k, v]) => [k, { ...v }])),
    recipients: new Map(Object.entries(recipients)),
    users: new Map(Object.entries(users).map(([k, v]) => [k, { ...v }])),
    runs: new Map(Object.entries(runs).map(([k, v]) => [k, { ...v }])),
    payouts: new Map(Object.entries(payouts).map(([k, v]) => [k, { ...v }])),
    cfg,
    refreshed: [],
    failNextFinish: 0,
  };
  const livePay = (r) => r && r.status === 'payable' && !r.payoutId;
  const liveDeduct = (r) => r && r.status === 'reversed' && r.paidAt && !r.deductedInRun;
  const ports = {
    config: async () => referralConfig(db.cfg),
    openRuns: async () => [...db.runs].filter(([, r]) => ['approved', 'running'].includes(r.status)).map(([id, r]) => ({ id, status: r.status, lines: r.lines })),
    claimRun: async (id, now) => {
      const r = db.runs.get(id);
      if (!(r.status === 'approved' || (r.status === 'running' && (r.leaseUntil ?? 0) < now))) return false;
      Object.assign(r, { status: 'running', leaseUntil: now + 5 * 60_000 });
      return true;
    },
    finishRun: async (id, result, done) => {
      const r = db.runs.get(id);
      Object.assign(r, { result, leaseUntil: null }, done ? { status: 'done' } : { lastError: result.errors[0] });
    },
    liveLine: async (line) => ({
      pay: line.rowIds.filter((id) => livePay(db.rows.get(id))).map((id) => ({ id, cents: db.rows.get(id).cents })),
      deduct: line.deductRowIds.filter((id) => liveDeduct(db.rows.get(id))).map((id) => ({ id, cents: db.rows.get(id).cents })),
    }),
    recipient: async (uid, refresh) => { db.refreshed.push(refresh); return db.recipients.get(uid) || null; },
    payout: async (id) => (db.payouts.has(id) ? { ...db.payouts.get(id) } : null),
    beginPayout: async (p) => {
      if (db.payouts.has(p.id)) return { ...db.payouts.get(p.id) };
      db.payouts.set(p.id, { ...p });
      return p;
    },
    finishCash: async (p, sent, now) => {
      if (db.failNextFinish > 0) { db.failNextFinish -= 1; throw new Error('deadline exceeded'); }
      const c = db.payouts.get(p.id);
      Object.assign(c, { status: c.status === 'posted' ? 'posted' : 'sent', stripeId: sent.stripeId, stripeStatus: sent.stripeStatus, paidAtMs: c.paidAtMs ?? now });
      for (const id of p.rowIds) {
        const r = db.rows.get(id);
        if (livePay(r)) Object.assign(r, { status: 'paid', paidAt: now, payoutId: p.id });
        else if (r.status === 'reversed' && !r.paidAt) Object.assign(r, { paidAt: now, payoutId: p.id, reversedFrom: 'paid' });
      }
      for (const id of p.deductRowIds) { const r = db.rows.get(id); if (liveDeduct(r)) r.deductedInRun = p.runId; }
    },
    failPayout: async (p, error) => Object.assign(db.payouts.get(p.id), { status: 'failed', error }),
    grantMonths: async (p, now) => {
      const c = db.payouts.get(p.id);
      if (c.status !== 'granting') return;
      const u = db.users.get(p.sharerUid);
      if (!u) throw Object.assign(new Error('the sharer has no account'), { permanent: true });
      const pay = p.rowIds.filter((id) => livePay(db.rows.get(id)));
      const m = monthsFrom({ pay: pay.map((id) => ({ id, cents: 0 })), deduct: p.deductRowIds.filter((id) => liveDeduct(db.rows.get(id))).map((id) => ({ id, cents: 0 })) });
      const n = Math.min(m.months, p.months);
      if (n > 0) u.manualMs = extendManualMs(u.manualMs ?? null, now, 30 * n);
      Object.assign(c, { status: 'granted', months: n, paidAtMs: now });
      for (const id of pay) Object.assign(db.rows.get(id), { status: 'paid', paidAt: now, payoutId: p.id });
      for (const d of m.deductUsed) db.rows.get(d.id).deductedInRun = p.runId;
    },
    sentPayouts: async () => [...db.payouts.values()].filter((p) => p.status === 'sent').map((p) => ({ ...p })),
    settle: async (p, state, stripeStatus) => {
      const c = db.payouts.get(p.id);
      if (state === 'posted') { Object.assign(c, { status: 'posted', stripeStatus }); return; }
      Object.assign(c, { status: 'returned', stripeStatus });
      for (const id of p.rowIds) {
        const r = db.rows.get(id);
        if (r.payoutId === p.id && r.status === 'paid') Object.assign(r, { status: 'payable', payoutId: undefined, paidAt: undefined });
      }
      for (const id of p.deductRowIds) { const r = db.rows.get(id); if (r.deductedInRun === p.runId) r.deductedInRun = undefined; }
    },
  };
  return { db, ports };
}

function fakeStripe({ permanentFor = [], flakyFor = [], outcomes = {} } = {}) {
  const byKey = new Map();
  const calls = [];
  const flaky = new Set(flakyFor);
  return {
    calls,
    byKey,
    client: {
      async send(p) {
        calls.push(['send', p.id, p.cents]);
        if (flaky.has(p.sharerUid)) { flaky.delete(p.sharerUid); throw new Error('socket hang up'); }
        if (permanentFor.includes(p.sharerUid)) throw Object.assign(new Error('recipient_capability_not_active'), { permanent: true });
        if (!byKey.has(p.id)) byKey.set(p.id, `poi_test_${byKey.size + 1}`); // the idempotency key is the payout id
        return { stripeId: byKey.get(p.id), stripeStatus: 'processing' };
      },
      async outcome(id) { return outcomes[id] || { state: 'open', stripeStatus: 'processing' }; },
      async cancel(id) { calls.push(['cancel', id]); },
    },
  };
}

const r15 = (sharerUid, o = {}) => ({ sharerUid, cents: 1500, status: 'payable', payableAt: NOW - 2 * DAY, ...o });

// The run the backend would write on Dec 1: sam cash ($30 less a $5 refund after payout),
// gb Pro months (2 friends), and a line for ann whose setup is not finished.
function world() {
  return ledger({
    rows: {
      f1: r15('sam'), f2: r15('sam'), r0: { sharerUid: 'sam', cents: 500, status: 'reversed', reversedFrom: 'paid', paidAt: NOW - 40 * DAY },
      g1: r15('gb'), g2: r15('gb', { cents: 500 }), a1: r15('ann'), a2: r15('ann'), late: r15('sam'),
    },
    recipients: { sam: cash('sam'), gb: months('gb'), ann: cash('ann', { onboardingStatus: 'pending' }) },
    users: { sam: { manualMs: null }, gb: { manualMs: NOW + 10 * DAY } },
    runs: { '2026-12': { status: 'approved', lines: [
      cashLine('sam', { rowIds: ['f1', 'f2'], deductRowIds: ['r0'], cents: 2500 }),
      monthsLine('gb', { rowIds: ['g1', 'g2'] }),
      cashLine('ann', { rowIds: ['a1', 'a2'] }),
    ] } },
  });
}

test('an approved run pays its lines once, grants Pro months, flips the rows and finishes', async () => {
  const { db, ports } = world();
  const s = fakeStripe();
  const out = await executeRuns(ports, s.client, { nowMs: NOW, dryRun: false });
  assert.deepEqual(s.calls, [['send', '2026-12_sam', 2500]]);
  const sam = db.payouts.get('2026-12_sam');
  assert.equal(sam.status, 'sent');
  assert.equal(sam.stripeId, 'poi_test_1');
  assert.equal(db.rows.get('f1').status, 'paid');
  assert.equal(db.rows.get('f1').payoutId, '2026-12_sam');
  assert.equal(db.rows.get('r0').deductedInRun, '2026-12', 'the refund after payout is netted once');
  assert.equal(db.rows.get('r0').status, 'reversed');
  assert.equal(db.rows.get('late').status, 'payable', 'not in the run: waits for the next one');
  assert.equal(db.payouts.get('2026-12_gb').status, 'granted');
  assert.equal(db.users.get('gb').manualMs, NOW + 70 * DAY, 'two friends: 60 days on top of the running comp');
  assert.equal(db.rows.get('g2').status, 'paid');
  assert.equal(db.rows.get('a1').status, 'payable', 'ann never finished setup: her rows wait');
  assert.equal(db.payouts.has('2026-12_ann'), false);
  assert.equal(db.runs.get('2026-12').status, 'done');
  assert.deepEqual(out.runs[0].result, { sharers: 2, rows: 4, cashCents: 2500, proMonths: 2, skipped: { recipient_incomplete: 1 }, failed: 0, errors: [] });
  assert.deepEqual(db.refreshed, [true, true], 'cash recipients are re-checked with Stripe before money moves');

  const again = await executeRuns(ports, s.client, { nowMs: NOW + 60_000, dryRun: false });
  assert.deepEqual(again.runs, [], 'a done run is never run again');
  assert.equal(s.calls.length, 1);
});

test('rows refunded after approval drop out of the line', async () => {
  const { db, ports } = world();
  db.rows.get('f2').status = 'reversed';
  db.rows.get('f2').reversedFrom = 'payable';
  db.rows.get('g1').status = 'reversed';
  const s = fakeStripe();
  await executeRuns(ports, s.client, { nowMs: NOW, dryRun: false });
  assert.deepEqual(s.calls, [['send', '2026-12_sam', 1000]], '$15 less the $5 owed');
  assert.equal(db.rows.get('f2').status, 'reversed');
  assert.equal(db.rows.get('f2').payoutId, undefined);
  assert.equal(db.payouts.get('2026-12_gb').months, 1);
  assert.equal(db.users.get('gb').manualMs, NOW + 40 * DAY);
});

test('a crash after Stripe took the money resumes without paying twice', async () => {
  const { db, ports } = world();
  const s = fakeStripe();
  db.failNextFinish = 1;
  const first = await executeRuns(ports, s.client, { nowMs: NOW, dryRun: false });
  assert.equal(first.runs[0].outcome, 'retry');
  assert.equal(db.runs.get('2026-12').status, 'running');
  assert.equal(db.payouts.get('2026-12_sam').status, 'sending');
  assert.equal(db.rows.get('f1').status, 'payable');
  assert.equal(db.runs.get('2026-12').leaseUntil, null, 'a retry releases the lease for the next cron');

  db.runs.get('2026-12').leaseUntil = NOW + 5 * 60_000; // another invocation is mid-run
  const busy = await executeRuns(ports, s.client, { nowMs: NOW + 60_000, dryRun: false });
  assert.equal(busy.runs[0].outcome, 'busy', 'it holds the lease');
  assert.equal(s.calls.length, 1);

  const second = await executeRuns(ports, s.client, { nowMs: NOW + 10 * 60_000, dryRun: false });
  assert.equal(second.runs[0].outcome, 'done');
  assert.equal(s.byKey.size, 1, 'Stripe saw one payout: the retry reused the idempotency key');
  assert.deepEqual(s.calls.map((c) => c[1]), ['2026-12_sam', '2026-12_sam']);
  assert.deepEqual(s.calls.map((c) => c[2]), [2500, 2500], 'the stored amount, not a new plan');
  assert.equal(db.rows.get('f2').status, 'paid');
  assert.equal(db.users.get('gb').manualMs, NOW + 70 * DAY, 'the Pro months were granted once');
});

test('a refusal fails that payout only; a network error or closed payouts retry the run', async () => {
  const a = world();
  const refuse = fakeStripe({ permanentFor: ['sam'] });
  const out = await executeRuns(a.ports, refuse.client, { nowMs: NOW, dryRun: false });
  assert.equal(out.runs[0].outcome, 'done');
  assert.equal(out.runs[0].result.failed, 1);
  assert.equal(a.db.payouts.get('2026-12_sam').status, 'failed');
  assert.match(a.db.payouts.get('2026-12_sam').error, /recipient_capability_not_active/);
  assert.equal(a.db.rows.get('f1').status, 'payable', 'the rows wait for a later run');
  assert.equal(a.db.rows.get('r0').deductedInRun, undefined, 'nothing netted');
  assert.equal(a.db.payouts.get('2026-12_gb').status, 'granted', 'others still get paid');

  const b = world();
  const flaky = fakeStripe({ flakyFor: ['sam'] });
  const first = await executeRuns(b.ports, flaky.client, { nowMs: NOW, dryRun: false });
  assert.equal(first.runs[0].outcome, 'retry');
  const second = await executeRuns(b.ports, flaky.client, { nowMs: NOW + 10 * 60_000, dryRun: false });
  assert.equal(second.runs[0].outcome, 'done');
  assert.equal(b.db.rows.get('f1').status, 'paid');
  assert.equal(flaky.byKey.size, 1);

  const c = world();
  const closed = await executeRuns(c.ports, null, { nowMs: NOW, dryRun: false });
  assert.equal(closed.runs[0].outcome, 'retry', 'an approved cash line waits for PAYOUTS_PROVIDER');
  assert.match(closed.runs[0].result.errors[0], /payouts are closed/);
  assert.equal(c.db.payouts.get('2026-12_gb').status, 'granted', 'Pro months still go');
  assert.equal(c.db.rows.get('f1').status, 'payable');
});

test('cash switched off after approval: the cash line is skipped, its rows stay payable', async () => {
  const { db, ports } = world();
  db.cfg = { cashEnabled: false };
  const out = await executeRuns(ports, fakeStripe().client, { nowMs: NOW, dryRun: false });
  assert.deepEqual(out.runs[0].result.skipped, { cash_off: 2 });
  assert.equal(db.rows.get('f1').status, 'payable');
  assert.equal(db.runs.get('2026-12').status, 'done', 'done releases the rows to the next run');
});

test('dry run plans without writing or sending', async () => {
  const { db, ports } = world();
  const s = fakeStripe();
  const out = await executeRuns(ports, s.client, { nowMs: NOW, dryRun: true });
  assert.equal(out.runs[0].outcome, 'dry_run');
  assert.deepEqual(out.runs[0].plan.map((x) => [x.sharerUid, x.skip || (x.payout.method === 'pro_months' ? `${x.payout.months}mo` : x.payout.cents)]),
    [['sam', 2500], ['gb', '2mo'], ['ann', 'recipient_incomplete']]);
  assert.equal(s.calls.length, 0);
  assert.equal(db.payouts.size, 0);
  assert.equal(db.runs.get('2026-12').status, 'approved');
  assert.deepEqual(db.refreshed, [false, false], 'a dry run does not call Stripe for recipients');
});

test('only approved runs run; awaiting approval and done are left alone', async () => {
  const { db, ports } = ledger({
    rows: { a: r15('sam'), b: r15('sam') },
    recipients: { sam: cash('sam') },
    runs: {
      '2026-10': { status: 'done', lines: [cashLine('sam', { rowIds: ['a', 'b'] })] },
      '2026-11': { status: 'awaiting_approval', lines: [cashLine('sam', { rowIds: ['a', 'b'] })] },
      '2026-12': { status: 'approved', lines: [cashLine('sam', { rowIds: ['a', 'b'] })] },
    },
  });
  const out = await executeRuns(ports, fakeStripe().client, { nowMs: NOW, dryRun: false });
  assert.deepEqual(out.runs.map((r) => r.runId), ['2026-12']);
  assert.equal(db.runs.get('2026-11').status, 'awaiting_approval');
  assert.equal(db.payouts.has('2026-12_sam'), true);
});

test('a payout that bounces puts its rows back to payable and its refund back to owed', async () => {
  const { db, ports } = ledger({
    rows: {
      a: { ...r15('sam'), status: 'paid', payoutId: '2026-11_sam', paidAt: NOW - 30 * DAY },
      b: { ...r15('sam'), status: 'paid', payoutId: '2026-11_sam', paidAt: NOW - 30 * DAY },
      r: { sharerUid: 'sam', cents: 500, status: 'reversed', reversedFrom: 'paid', paidAt: NOW - 60 * DAY, deductedInRun: '2026-11' },
    },
    payouts: {
      '2026-11_sam': { id: '2026-11_sam', runId: '2026-11', sharerUid: 'sam', method: 'stripe_global_payouts', status: 'sent', cents: 2500, rowIds: ['a', 'b'], deductRowIds: ['r'], stripeId: 'poi_test_9' },
      '2026-11_amy': { id: '2026-11_amy', runId: '2026-11', sharerUid: 'amy', method: 'stripe_global_payouts', status: 'sent', cents: 2000, rowIds: [], deductRowIds: [], stripeId: 'poi_test_8' },
    },
  });
  const s = fakeStripe({ outcomes: { poi_test_9: { state: 'failed', stripeStatus: 'requires_action:payout_method_closed' }, poi_test_8: { state: 'posted', stripeStatus: 'posted' } } });
  const out = await executeRuns(ports, s.client, { nowMs: NOW, dryRun: false });
  assert.deepEqual(out.settled, { posted: 1, returned: 1 });
  assert.deepEqual(s.calls, [['cancel', 'poi_test_9']]);
  assert.equal(db.payouts.get('2026-11_sam').status, 'returned');
  assert.equal(db.rows.get('a').status, 'payable');
  assert.equal(db.rows.get('r').deductedInRun, undefined, 'the refund is owed again');
  assert.equal(db.payouts.get('2026-11_amy').status, 'posted');
});

// ---- Global Payouts requests, against a mocked Stripe ----

function rawStripe(responses = {}) {
  const calls = [];
  return {
    calls,
    st: {
      async rawRequest(method, path, params, options) {
        calls.push({ method, path, params, options });
        const key = `${method} ${path.split('?')[0]}`;
        const r = responses[key];
        if (r instanceof Error) throw r;
        return typeof r === 'function' ? r(params, options) : r ?? {};
      },
    },
  };
}

test('a recipient is a US individual with ACH, made once per account', async () => {
  const m = rawStripe({ 'POST /v2/core/accounts': { id: 'acct_test_1' } });
  const gp = globalPayouts(m.st);
  assert.equal(await gp.createRecipient({ uid: 'u1', email: 'sam@example.com', name: 'Sam' }), 'acct_test_1');
  const c = m.calls[0];
  assert.equal(c.options.apiVersion, GP_API_VERSION);
  assert.equal(c.options.idempotencyKey, 'gunner_recipient_u1');
  assert.deepEqual(c.params.identity, { country: 'us', entity_type: 'individual' });
  assert.deepEqual(c.params.configuration, { recipient: { capabilities: { bank_accounts: { ach: { requested: true } } } } });
  assert.equal(c.params.contact_email, 'sam@example.com');
  assert.equal(c.params.metadata.uid, 'u1');
});

test("the hosted form is an Account Link for the recipient configuration, back to /earnings", async () => {
  const m = rawStripe({ 'POST /v2/core/account_links': { url: 'https://connect.stripe.com/x' } });
  const gp = globalPayouts(m.st);
  const url = await gp.onboardingLink('acct_1', 'account_onboarding', { returnUrl: 'https://stepgunner.com/earnings?payouts=return', refreshUrl: 'https://stepgunner.com/earnings?payouts=refresh' });
  assert.equal(url, 'https://connect.stripe.com/x');
  assert.deepEqual(m.calls[0].params, {
    account: 'acct_1',
    use_case: { type: 'account_onboarding', account_onboarding: { configurations: ['recipient'], return_url: 'https://stepgunner.com/earnings?payouts=return', refresh_url: 'https://stepgunner.com/earnings?payouts=refresh' } },
  });
  await gp.onboardingLink('acct_1', 'account_update', { returnUrl: 'r', refreshUrl: 'f' });
  assert.equal(m.calls[1].params.use_case.type, 'account_update');
  assert.deepEqual(m.calls[1].params.use_case.account_update.configurations, ['recipient']);
});

test('a recipient is complete with ACH active and a usable bank; the default bank wins', async () => {
  const methods = { data: [
    { id: 'usba_old', type: 'bank_account', archived: true, usage_status: { payments: 'eligible' }, bank_account: { bank_name: 'Old', last4: '0000' } },
    { id: 'usba_a', type: 'bank_account', usage_status: { payments: 'eligible' }, bank_account: { bank_name: 'Chase', last4: '6789' } },
    { id: 'usba_b', type: 'bank_account', usage_status: { payments: 'eligible' }, bank_account: { bank_name: 'Ally', last4: '4321' } },
    { id: 'card_1', type: 'card', usage_status: { payments: 'eligible' } },
  ] };
  const m = rawStripe({
    'GET /v2/core/accounts/acct_1': { configuration: { recipient: { capabilities: { bank_accounts: { ach: { status: 'active' } } } } }, defaults: { payout_methods: { usd: 'usba_b' } } },
    'GET /v2/money_management/payout_methods': methods,
  });
  const s = await globalPayouts(m.st).recipientState('acct_1');
  assert.deepEqual(s, { onboardingStatus: 'complete', capability: 'active', payoutMethodId: 'usba_b', destination: 'Ally ••4321' });
  assert.equal(m.calls[0].path, '/v2/core/accounts/acct_1?include[0]=configuration.recipient&include[1]=defaults');
  assert.equal(m.calls[1].options.stripeContext, 'acct_1', 'payout methods are read as the recipient');
  assert.equal(onboardingStatusOf('active', false), 'pending', 'ACH on but no bank yet');
  assert.equal(onboardingStatusOf('pending', true), 'pending');
  assert.equal(onboardingStatusOf('restricted', true), 'restricted');
  assert.equal(onboardingStatusOf('unsupported', false), 'restricted');
  assert.equal(onboardingStatusOf(null, false), 'pending');
});

test('a payout is one PayoutIntent from the open financial account, keyed by the payout id', async () => {
  const m = rawStripe({
    'GET /v2/money_management/financial_accounts': { data: [{ id: 'fa_closed', status: 'closed' }, { id: 'fa_1', status: 'open' }] },
    'POST /v2/money_management/payout_intents': (params) => ({ id: 'poi_1', status: 'processing', amount: params.amount }),
  });
  const gp = globalPayouts(m.st);
  const p = { id: '2026-12_sam', runId: '2026-12', sharerUid: 'sam', cents: 3000, rowIds: ['a', 'b'], recipientId: 'acct_sam', payoutMethodId: 'usba_sam' };
  assert.deepEqual(await gp.send(p), { stripeId: 'poi_1', stripeStatus: 'processing' });
  await gp.send(p);
  const sends = m.calls.filter((c) => c.method === 'POST');
  assert.equal(m.calls.filter((c) => c.path.includes('financial_accounts')).length, 1, 'the account is looked up once');
  assert.equal(sends[0].options.idempotencyKey, 'gunner_payout_2026-12_sam');
  assert.equal(sends[1].options.idempotencyKey, sends[0].options.idempotencyKey, 'a retry sends the same key');
  assert.equal(sends[0].options.apiVersion, GP_API_VERSION);
  assert.deepEqual(sends[0].params.amount, { value: 3000, currency: 'usd' });
  assert.deepEqual(sends[0].params.from, { financial_account: 'fa_1', currency: 'usd' });
  assert.deepEqual(sends[0].params.to, { recipient: 'acct_sam', currency: 'usd', payout_method: 'usba_sam' });
  assert.equal(sends[0].params.metadata.payoutId, '2026-12_sam');
  assert.deepEqual(sends[0].params.recipient_notification, { setting: 'configured' }, 'Stripe emails the sharer');
  const pinned = globalPayouts(rawStripe({ 'POST /v2/money_management/payout_intents': { id: 'poi_2', status: 'pending' } }).st, { financialAccount: 'fa_env' });
  assert.equal((await pinned.send(p)).stripeId, 'poi_2');
});

test('Stripe refusals are permanent, outages and set-up gaps retry', async () => {
  const err = (statusCode) => Object.assign(new Error(`http ${statusCode}`), { statusCode });
  const p = { id: 'x', runId: 'r', sharerUid: 's', cents: 2000, rowIds: [], recipientId: 'acct', payoutMethodId: null };
  for (const [code, permanent] of [[400, true], [404, true], [409, true], [429, false], [500, false]]) {
    const gp = globalPayouts(rawStripe({ 'POST /v2/money_management/payout_intents': err(code) }).st, { financialAccount: 'fa' });
    const e = await gp.send(p).catch((x) => x);
    assert.equal(!!e.permanent, permanent, `HTTP ${code}`);
  }
  const noFa = globalPayouts(rawStripe({ 'GET /v2/money_management/financial_accounts': { data: [] } }).st);
  const e = await noFa.send(p).catch((x) => x);
  assert.match(e.message, /financial account/);
  assert.equal(!!e.permanent, false, 'turning Global Payouts on later lets the run finish');
  const blank = globalPayouts(rawStripe().st, { financialAccount: 'fa' });
  assert.equal((await blank.send({ ...p, recipientId: null }).catch((x) => x)).permanent, true);
});

test('payout outcomes: posted, failed (canceled, failed, returned), or still open', async () => {
  const pi = (o) => ({ 'GET /v2/money_management/payout_intents/poi_1': o });
  const outcome = (o) => globalPayouts(rawStripe(pi(o)).st).outcome('poi_1');
  assert.deepEqual(await outcome({ status: 'posted' }), { state: 'posted', stripeStatus: 'posted' });
  assert.deepEqual(await outcome({ status: 'canceled' }), { state: 'failed', stripeStatus: 'canceled' });
  assert.deepEqual(await outcome({ status: 'requires_action', next_action: { type: 'handle_failure', handle_failure: { failure_reason: 'insufficient_funds' } } }), { state: 'failed', stripeStatus: 'requires_action:insufficient_funds' });
  assert.deepEqual(await outcome({ status: 'requires_action', next_action: { type: 'confirm' } }), { state: 'open', stripeStatus: 'requires_action' }, 'Danny confirms in the Dashboard');
  assert.deepEqual(await outcome({ status: 'processing' }), { state: 'open', stripeStatus: 'processing' });
});

// ---- the app-to-web handoff ----

test('handoff codes: 256 random bits, stored only as a hash, good once for 2 minutes', () => {
  const a = newHandoffCode();
  const b = newHandoffCode();
  assert.notEqual(a, b);
  assert.equal(a.length, 43);
  assert.equal(isHandoffCode(a), true);
  assert.equal(isHandoffCode(`${a}=`), false);
  assert.equal(isHandoffCode('short'), false);
  assert.equal(isHandoffCode(null), false);
  assert.match(handoffKey(a), /^[0-9a-f]{64}$/);
  assert.equal(handoffKey(a), handoffKey(a));
  assert.notEqual(handoffKey(a), handoffKey(b));
  assert.equal(HANDOFF_TTL_MS, 120_000);
  assert.equal(handoffRefusal(null, NOW), 'used_or_unknown', 'deleted on use, so a second try finds nothing');
  assert.equal(handoffRefusal({ uid: 'u', expiresAtMs: NOW - 1 }, NOW), 'expired');
  assert.equal(handoffRefusal({ uid: 'u', expiresAtMs: NOW }, NOW), 'expired');
  assert.equal(handoffRefusal({ uid: '', expiresAtMs: NOW + 1 }, NOW), 'used_or_unknown');
  assert.equal(handoffRefusal({ uid: 'u', expiresAtMs: NOW + HANDOFF_TTL_MS }, NOW), null);
  assert.equal(handoffPage('pro'), 'pro');
  assert.equal(handoffPage('admin'), 'earnings', 'only the two pages');
});
