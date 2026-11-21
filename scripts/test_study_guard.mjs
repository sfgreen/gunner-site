// The scraping flags (lib/study/guard.ts and its wiring in server.ts), on the fake Firestore.
//   npm run test:study
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FakeDb } from './fake_firestore.mjs';
import { addAnswer, emptyDay, reasons, capHitsSince, throttled, networkOf, GUARD } from '../lib/study/guard.ts';
import { answerCurrent, openBlock, serveCurrent } from '../lib/study/server.ts';

function day(n, { dwellMs = 45_000, jitter = 20_000, acc = 0.75, hours = 3, nets = 1, agents = 1 } = {}) {
  let d = emptyDay();
  for (let i = 0; i < n; i++) {
    const dw = dwellMs + (i % 2 ? jitter : -jitter) * ((i % 7) / 7);
    d = addAnswer(d, dw, i / n < acc, i % hours, `net${i % nets}`, `ua${i % agents}`);
  }
  return d;
}

test('a real study day raises nothing, even a long one', () => {
  assert.deepEqual(reasons(day(200, { hours: 9 }), 0), []);
  assert.deepEqual(reasons(day(39, { dwellMs: 2000, jitter: 0 }), 0), [], 'no speed or rhythm flag before 40 answers');
});

test('scripted days flag, each for its own reason', () => {
  assert.ok(reasons(day(60, { dwellMs: 3000, jitter: 500 }), 0).includes('fast'));
  assert.ok(reasons(day(80, { acc: 0.2 }), 0).includes('guessing'));
  assert.ok(reasons(day(60, { dwellMs: 20_000, jitter: 300 }), 0).includes('even_rhythm'));
  assert.ok(reasons(day(60, { hours: 20 }), 0).includes('no_sleep'));
  assert.ok(reasons(day(30, { nets: 5 }), 0).includes('many_networks'));
  assert.ok(reasons(day(30, { agents: 3 }), 0).includes('many_browsers'));
  assert.ok(reasons(day(10), 2).includes('daily_cap'));
});

test('cap days count only inside the last seven', () => {
  assert.equal(capHitsSince(['2026-11-10', '2026-11-15', '2026-11-21'], '2026-11-21'), 2);
  assert.equal(capHitsSince(null, '2026-11-21'), 0);
});

test('a flagged account studies slower until it is cleared', () => {
  assert.deepEqual(throttled({ flagged: true }, 300, 2500), { dailyMax: GUARD.throttleMax, minGapMs: GUARD.throttleGapMs });
  assert.deepEqual(throttled({ flagged: true, cleared: true }, 300, 2500), { dailyMax: 300, minGapMs: 2500 });
  assert.deepEqual(throttled(undefined, 300, 2500), { dailyMax: 300, minGapMs: 2500 });
});

test('networks are reduced to a prefix before hashing', () => {
  assert.equal(networkOf('203.0.113.77, 10.0.0.1', undefined), '203.0.113.0/24');
  assert.equal(networkOf(undefined, '::ffff:198.51.100.9'), '198.51.100.0/24');
  assert.equal(networkOf('2001:db8:abcd:12::1', undefined), '2001:db8:abcd::/48');
});

function bank() {
  const db = new FakeDb();
  db.seed('questionBank/metadata', { version: 7 });
  db.seed('questionBank/categories/cards/cat_ck_cardio', { id: 'ck_cardio', displayName: 'Cardiology', kind: 'ck_gold' });
  for (let id = 1; id <= 60; id++) db.seed(`questionBank/ck_gold/cards/ck_${id}`, {
    id, world: 'ck_cardio', trigger: `Stem ${id}.`, triggerMarked: `Stem ${id}.`, question: 'Next step?',
    choices: [`Right ${id}`, `W${id}a`, `W${id}b`, `W${id}c`], correctAnswer: `Right ${id}`, whyRight: 'Because.',
  });
  return db;
}

test('a script answering instantly gets flagged, logged once, then throttled', async () => {
  const db = bank();
  const U = 'bot1';
  const CFG = { enabled: true, dailyMax: 300, minGapMs: 0, blockSize: 20, guard: true };
  let flaggedAt = -1;
  for (let i = 0; i < 45 && flaggedAt < 0; i++) {
    let block = await openBlock(db, U, CFG, -360, false);
    let { question } = await serveCurrent(db, U, CFG, block.id);
    if (!question) { block = await openBlock(db, U, CFG, -360, true); ({ question } = await serveCurrent(db, U, CFG, block.id)); }
    await answerCurrent(db, U, block.id, question.key, 1, { net: '203.0.113.0/24', agent: 'curl/8' }, CFG);
    if (flaggedAt < 0 && db.read(`webStudy/${U}`).guard?.flagged) flaggedAt = i + 1;
  }
  assert.equal(flaggedAt, 40, 'flags on the 40th instant answer');
  const flag = db.read(`studyFlags/${U}`);
  assert.ok(flag.reasons.includes('fast'));
  assert.equal(flag.answersToday, 40);
  const ws = db.read(`webStudy/${U}`);
  assert.equal(ws.guard.day, flag.day);
  assert.ok(!JSON.stringify(ws).includes('203.0.113'), 'the network is never stored raw');
  // Throttled: the 41st serve of the day is past the flagged cap of 40.
  const block = await openBlock(db, U, CFG, -360, true);
  await assert.rejects(serveCurrent(db, U, CFG, block.id), (e) => e.code === 'daily_limit');
});

test('the switch turns the flags off', async () => {
  const db = bank();
  const CFG = { enabled: true, dailyMax: 300, minGapMs: 0, blockSize: 20, guard: false };
  for (let i = 0; i < 41; i++) {
    let block = await openBlock(db, 'u2', CFG, -360, false);
    let { question } = await serveCurrent(db, 'u2', CFG, block.id);
    if (!question) { block = await openBlock(db, 'u2', CFG, -360, true); ({ question } = await serveCurrent(db, 'u2', CFG, block.id)); }
    await answerCurrent(db, 'u2', block.id, question.key, 1, {}, CFG);
  }
  assert.equal(db.read('studyFlags/u2'), undefined);
  assert.equal(db.read('webStudy/u2').guardDays, undefined);
});
