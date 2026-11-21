// The study desk's server against an in-memory Firestore (decision 0082): the block
// it picks, what a served question carries (never the answer), the limits, and what an
// answer writes (the review shard the phone reads, the ledger, the buddy day).
//
//   npm run test:study
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Timestamp } from 'firebase-admin/firestore';
import { FakeDb } from './fake_firestore.mjs';
import { answerCurrent, openBlock, serveCurrent, localDay, centralDay } from '../lib/study/server.ts';
import { shardDocName } from '../lib/study/srs.ts';

const U = 'student1';
const NOW = Date.now();
const TZ = -360; // Central standard time
const CFG = { enabled: true, dailyMax: 300, minGapMs: 0, blockSize: 20 };

function card(id, world, extra = {}) {
  return {
    id, world, trigger: `A ${id}-year-old with [+finding ${id}].`, triggerMarked: `A ${id}-year-old with [+finding ${id}].`,
    question: 'What is the next step?', choices: [`Right ${id}`, `Wrong ${id}a`, `Wrong ${id}b`, `Wrong ${id}c`],
    correctAnswer: `Right ${id}`, whyRight: `Because ${id}.`, whyWrong: 'Others are wrong.', trap: 'A trap.',
    memoryHook: 'A hook.', diagnosis: `Dx ${id}`, subTopic: 'Sub', ...extra,
  };
}

function seeded() {
  const db = new FakeDb();
  db.seed('questionBank/metadata', { version: 7 });
  db.seed('questionBank/categories/cards/cat_ck_cardio', { id: 'ck_cardio', displayName: 'Cardiology', kind: 'ck_gold' });
  const worlds = ['ck_cardio', 'ck_id', 'ck_gi'];
  for (let id = 1; id <= 40; id++) db.seed(`questionBank/ck_gold/cards/ck_${id}`, card(id, worlds[id % 3]));
  db.seed('questionBank/ck_gold/cards/ck_90', card(90, 'ck_gi', { image: 'xray_1' }));
  db.seed('questionBank/ck_gold/cards/ck_91', card(91, 'ck_gi', { correctAnswer: 'Not a choice' }));
  // Legacy frozen doc holds ck:1 (missed 2 h ago); a shard holds ck:2 (Box 2, 3 days ago).
  db.seed(`users/${U}/srProgress/data`, { progressMap: {
    'ck:1': { box: 1, totalAttempts: 1, totalCorrect: 0, consecutiveCorrect: 0, lastReviewed: Timestamp.fromMillis(NOW - 2 * 3600_000) },
  } });
  db.seed(`users/${U}/srProgress/${shardDocName('ck:2')}`, { progressMap: {
    'ck:2': { box: 2, totalAttempts: 1, totalCorrect: 1, consecutiveCorrect: 1, lastReviewed: Timestamp.fromMillis(NOW - 3 * 86_400_000) },
  } });
  db.seed(`ropeIndex/${U}`, { ropeId: 'R1' });
  db.seed('ropes/R1', { status: 'active', uids: [U, 'buddy'], [`days_${U}`]: ['2026-01-01'] });
  return db;
}

test('the block follows the schedule: the miss first, the overdue card second, no image or broken cards', async () => {
  const db = seeded();
  const block = await openBlock(db, U, CFG, TZ, false);
  assert.equal(block.keys.length, 20);
  assert.equal(block.keys[0], 'ck:1');
  assert.equal(block.keys[1], 'ck:2');
  assert.ok(!block.keys.includes('ck:90') && !block.keys.includes('ck:91'));
  const again = await openBlock(db, U, CFG, TZ, false);
  assert.equal(again.id, block.id, 'an unfinished block resumes');
});

test('a served question never carries its answer, and a reload costs no serve', async () => {
  const db = seeded();
  const block = await openBlock(db, U, CFG, TZ, false);
  const { question } = await serveCurrent(db, U, CFG, block.id);
  assert.equal(question.key, 'ck:1');
  assert.deepEqual([...question.choices].sort(), ['Right 1', 'Wrong 1a', 'Wrong 1b', 'Wrong 1c']);
  const text = JSON.stringify(question);
  for (const leak of ['correctAnswer', 'whyRight', 'Because 1', 'A hook', 'Dx 1']) assert.ok(!text.includes(leak), leak);
  const before = db.read(`webStudy/${U}`).servedToday;
  const { question: same } = await serveCurrent(db, U, CFG, block.id);
  assert.deepEqual(same.choices, question.choices, 'same order on reload');
  assert.equal(db.read(`webStudy/${U}`).servedToday, before);
});

test('an answer lands in the shard the phone reads, merged with the frozen legacy doc', async () => {
  const db = seeded();
  const block = await openBlock(db, U, CFG, TZ, false);
  const { question } = await serveCurrent(db, U, CFG, block.id);
  const wrong = question.choices.findIndex((c) => c !== 'Right 1');
  const r = await answerCurrent(db, U, block.id, 'ck:1', wrong);
  assert.equal(r.correct, false);
  assert.equal(r.answer, 'Right 1');
  assert.equal(r.fromBox, 1);
  assert.equal(r.toBox, 1);
  const shard = db.read(`users/${U}/srProgress/${shardDocName('ck:1')}`);
  const p = shard.progressMap['ck:1'];
  assert.equal(p.totalAttempts, 2, 'counts the legacy attempt');
  assert.equal(p.box, 1);
  assert.equal(p.consecutiveCorrect, 0);
  assert.ok(p.lastReviewed instanceof Timestamp);
  assert.equal(shard.version, 2);
  assert.equal(db.read(`users/${U}/srProgress/data`).progressMap['ck:1'].totalAttempts, 1, 'the frozen doc is never written');

  // ck:2 (Box 2) answered right moves to Box 3 in its own shard.
  const { question: q2 } = await serveCurrent(db, U, CFG, block.id);
  assert.equal(q2.key, 'ck:2');
  const r2 = await answerCurrent(db, U, block.id, 'ck:2', q2.choices.indexOf('Right 2'));
  assert.equal(r2.correct, true);
  assert.equal(r2.toBox, 3);
  assert.equal(r2.nextInDays, 3);
  assert.equal(r2.xp % 5, 0);
  const p2 = db.read(`users/${U}/srProgress/${shardDocName('ck:2')}`).progressMap['ck:2'];
  assert.deepEqual([p2.box, p2.totalAttempts, p2.totalCorrect, p2.consecutiveCorrect], [3, 2, 2, 2]);

  const ws = db.read(`webStudy/${U}`);
  assert.equal(ws.answered, 2);
  assert.equal(ws.correct, 1);
  assert.equal(ws.xpBanked, r2.xp);
  const day = localDay(Date.now(), TZ);
  assert.deepEqual(ws.days[day], { answered: 2, correct: 1, xp: r2.xp });
});

test('a double submit records once', async () => {
  const db = seeded();
  const block = await openBlock(db, U, CFG, TZ, false);
  const { question } = await serveCurrent(db, U, CFG, block.id);
  await answerCurrent(db, U, block.id, question.key, 0);
  await assert.rejects(answerCurrent(db, U, block.id, question.key, 0), (e) => e.code === 'not_current');
  const p = db.read(`users/${U}/srProgress/${shardDocName(question.key)}`).progressMap[question.key];
  assert.equal(p.totalAttempts, 2);
});

test('an answer needs the served question of the live block', async () => {
  const db = seeded();
  const block = await openBlock(db, U, CFG, TZ, false);
  await assert.rejects(answerCurrent(db, U, block.id, 'ck:1', 0), (e) => e.code === 'not_current', 'not served yet');
  await serveCurrent(db, U, CFG, block.id);
  await assert.rejects(answerCurrent(db, U, 'other', 'ck:1', 0), (e) => e.code === 'stale_block');
  await assert.rejects(answerCurrent(db, U, block.id, 'ck:5', 0), (e) => e.code === 'not_current', 'only the current card');
  await assert.rejects(answerCurrent(db, U, block.id, 'ck:1', 9), (e) => e.code === 'bad_pick');
});

test('the first answer of the day marks the buddy rope once', async () => {
  const db = seeded();
  const block = await openBlock(db, U, CFG, TZ, false);
  for (let i = 0; i < 3; i++) {
    const { question } = await serveCurrent(db, U, CFG, block.id);
    await answerCurrent(db, U, block.id, question.key, 0);
  }
  const rope = db.read('ropes/R1');
  const day = localDay(Date.now(), TZ);
  assert.deepEqual(rope[`days_${U}`], ['2026-01-01', day]);
  assert.equal(typeof rope[`seen_${U}`], 'number');
  assert.equal(db.writes.filter((w) => w.path === 'ropes/R1').length, 1);
});

test('no rope, no rope write', async () => {
  const db = seeded();
  db.docs.delete(`ropeIndex/${U}`);
  const block = await openBlock(db, U, CFG, TZ, false);
  const { question } = await serveCurrent(db, U, CFG, block.id);
  await answerCurrent(db, U, block.id, question.key, 0);
  assert.equal(db.writes.filter((w) => w.path.startsWith('ropes/')).length, 0);
});

test('the daily cap and the minimum gap hold', async () => {
  const db = seeded();
  const cfg = { ...CFG, dailyMax: 2 };
  const block = await openBlock(db, U, cfg, TZ, false);
  for (let i = 0; i < 2; i++) {
    const { question } = await serveCurrent(db, U, cfg, block.id);
    await answerCurrent(db, U, block.id, question.key, 0);
  }
  await assert.rejects(serveCurrent(db, U, cfg, block.id), (e) => e.code === 'daily_limit' && e.status === 429);
  assert.equal(db.read(`webStudy/${U}`).servedOn, centralDay(Date.now()));

  const db2 = seeded();
  const slow = { ...CFG, minGapMs: 60_000 };
  const b2 = await openBlock(db2, U, slow, TZ, false);
  const { question } = await serveCurrent(db2, U, slow, b2.id);
  await answerCurrent(db2, U, b2.id, question.key, 0);
  await assert.rejects(serveCurrent(db2, U, slow, b2.id), (e) => e.code === 'too_fast');
});

test('a finished block reports done and a fresh one starts over', async () => {
  const db = seeded();
  const cfg = { ...CFG, blockSize: 5 };
  const block = await openBlock(db, U, cfg, TZ, false);
  let last;
  for (let i = 0; i < 5; i++) {
    const { question } = await serveCurrent(db, U, cfg, block.id);
    last = await answerCurrent(db, U, block.id, question.key, 0);
  }
  assert.equal(last.done, true);
  const { question } = await serveCurrent(db, U, cfg, block.id);
  assert.equal(question, null);
  const fresh = await openBlock(db, U, cfg, TZ, false);
  assert.notEqual(fresh.id, block.id, 'a finished block is not resumed');
});

test('local days follow the student, the cap follows Central', () => {
  const t = Date.UTC(2026, 10, 18, 3, 30); // 9:30 PM Central on the 17th, 9:00 AM in India
  assert.equal(localDay(t, -360), '2026-11-17');
  assert.equal(localDay(t, 330), '2026-11-18');
  assert.equal(centralDay(t), '2026-11-17');
});

test('why-right drops the why-wrong sentences it repeats (the app does the same)', async () => {
  const { whyRightOnly, sentences } = await import('../lib/study/server.ts');
  const right = 'Lyme is treated with doxycycline. Azithromycin is second line. Acyclovir is an antiviral, 0.5 mg does nothing for E. coli either.';
  const wrong = 'Azithromycin is second line. Acyclovir is an antiviral, 0.5 mg does nothing for E. coli either.';
  assert.equal(whyRightOnly(right, wrong), 'Lyme is treated with doxycycline.');
  assert.equal(whyRightOnly(right, null), right);
  assert.deepEqual(sentences('Na 11.8 mEq/L. E. coli grows. Done!'), ['Na 11.8 mEq/L.', 'E. coli grows.', 'Done!']);
});

test('a web-only account (no phone, no schedule, no rope, no user doc) studies from new cards', async () => {
  const db = seeded();
  const W = 'android1';
  const block = await openBlock(db, W, CFG, TZ, false);
  assert.equal(block.keys.length, 20, 'a full block of new cards');
  assert.ok(block.keys.every((k) => /^ck:\d+$/.test(k) && k !== 'ck:90' && k !== 'ck:91'));
  const { question } = await serveCurrent(db, W, CFG, block.id);
  assert.ok(question && !('correctAnswer' in question) && !('answer' in question));
  const r = await answerCurrent(db, W, block.id, question.key, question.choices.indexOf(`Right ${question.key.slice(3)}`));
  assert.equal(r.correct, true);
  assert.equal(r.fromBox, 0, 'unseen');
  assert.equal(r.toBox, 2, 'first right answer from unseen goes to Box 2, as on the phone');
  const p = db.read(`users/${W}/srProgress/${shardDocName(question.key)}`).progressMap[question.key];
  assert.deepEqual([p.box, p.totalAttempts, p.totalCorrect], [2, 1, 1]);
  assert.equal(db.read(`users/${W}/srProgress/data`), undefined, 'no legacy doc is made up');
  assert.equal(db.read(`ropeIndex/${W}`), undefined, 'no rope is made up');
  assert.equal(db.read(`webStudy/${W}`).answered, 1);
});
