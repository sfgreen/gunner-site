// The study desk's spaced review against the app's rules (decision 0082).
//
//   node --test scripts/test_study_srs.mjs        (npm run test:study)
//
// The hash values come from the app's own SpacedRepetitionStore.stableHash, run in
// Swift on 2026-11-17, so a web answer lands in the shard the phone reads.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  stableHash, shardDocName, srKey, applyAnswer, mergeMaps, shouldTakeRemote, selectRound,
  isDue, intervalDaysFor, xpFor, UNSEEN, DAY_S,
} from '../lib/study/srs.ts';

const SWIFT = [
  ['ck:10101', '2660703878272200734', 'shard_14'],
  ['ck:11046', '15056369309751238021', 'shard_5'],
  ['cl:1116', '15829419505766595017', 'shard_9'],
  ['sp:hyponatremia:thiazide', '6762681367852609413', 'shard_5'],
  ['pathq:L1:0', '17853939530881813836', 'shard_12'],
  ['ck:é', '17304204622637220571', 'shard_11'],
];

test('the shard hash matches the app (FNV-1a 64 over UTF-8)', () => {
  for (const [k, h, shard] of SWIFT) {
    assert.equal(stableHash(k).toString(), h, k);
    assert.equal(shardDocName(k), shard, k);
  }
  assert.equal(srKey('ck', 10101), 'ck:10101');
});

const NOW = Date.UTC(2026, 10, 17, 18);
const p = (o) => ({ ...UNSEEN, ...o });

test('Leitner transitions match the app', () => {
  // first correct skips Box 1
  assert.deepEqual(applyAnswer(UNSEEN, true, NOW), p({ box: 2, lastReviewedMs: NOW, consecutiveCorrect: 1, totalCorrect: 1, totalAttempts: 1 }));
  // a miss on unseen is Box 1
  assert.equal(applyAnswer(UNSEEN, false, NOW).box, 1);
  for (let box = 1; box <= 5; box++) {
    const before = p({ box, totalAttempts: 3, totalCorrect: 2, consecutiveCorrect: 2, lastReviewedMs: NOW - DAY_S * 1000 });
    const right = applyAnswer(before, true, NOW);
    assert.equal(right.box, Math.min(box + 1, 5));
    assert.equal(right.totalAttempts, 4);
    assert.equal(right.totalCorrect, 3);
    assert.equal(right.consecutiveCorrect, 3);
    const wrong = applyAnswer(before, false, NOW);
    assert.equal(wrong.box, 1);
    assert.equal(wrong.consecutiveCorrect, 0);
    assert.equal(wrong.totalCorrect, 2);
    assert.equal(wrong.lastReviewedMs, NOW);
  }
});

test('v2 fields ride through a web answer untouched', () => {
  const before = p({ box: 3, totalAttempts: 2, intervalDays: 4.5, dueDateMs: NOW + 1 });
  const after = applyAnswer(before, true, NOW);
  assert.equal(after.intervalDays, 4.5);
  assert.equal(after.dueDateMs, NOW + 1);
});

test('merge: more attempts wins, then the fresher review; ties keep what is there', () => {
  assert.equal(shouldTakeRemote(3, 1, 2, 9), true);
  assert.equal(shouldTakeRemote(2, 9, 3, 1), false);
  assert.equal(shouldTakeRemote(2, 9, 2, 1), true);
  assert.equal(shouldTakeRemote(2, 1, 2, 1), false);
  assert.equal(shouldTakeRemote(2, 1, 2, null), true);
  const shard = { 'ck:1': p({ box: 3, totalAttempts: 4, lastReviewedMs: 5 }) };
  const legacy = { 'ck:1': p({ box: 2, totalAttempts: 4, lastReviewedMs: 5 }), 'ck:2': p({ box: 1, totalAttempts: 1 }) };
  const m = mergeMaps([shard, legacy]);
  assert.equal(m['ck:1'].box, 3, 'exact tie keeps the shard copy (shards are read first)');
  assert.equal(m['ck:2'].box, 1);
});

test('due and intervals', () => {
  assert.equal(isDue(UNSEEN, NOW), false);
  assert.equal(isDue(p({ box: 1, lastReviewedMs: NOW }), NOW), true);
  assert.equal(isDue(p({ box: 2, lastReviewedMs: NOW - DAY_S * 1000 + 1 }), NOW), false);
  assert.equal(isDue(p({ box: 2, lastReviewedMs: NOW - DAY_S * 1000 }), NOW), true);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(intervalDaysFor), [0, 0, 1, 3, 7, 14]);
});

test('XP: 10, 15 at a 3-run, 20 at a 5-run, +5 under 5 seconds, 0 when wrong', () => {
  assert.equal(xpFor(true, 1, 9000), 10);
  assert.equal(xpFor(true, 3, 9000), 15);
  assert.equal(xpFor(true, 5, 9000), 20);
  assert.equal(xpFor(true, 1, 4000), 15);
  assert.equal(xpFor(false, 9, 1000), 0);
  for (const s of [1, 2, 3, 4, 5, 9]) for (const t of [100, 6000]) assert.equal(xpFor(true, s, t) % 5, 0);
});

// A seeded random so selection tests are repeatable.
function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
const DAY0 = NOW - 6 * 3600_000; // local midnight for the student

test('a round: Box 1 leads, overdue interleaves, 6 new spread across worlds', () => {
  const pool = [];
  const prog = {};
  for (let i = 0; i < 10; i++) { pool.push({ key: `ck:b${i}`, world: 'cards' }); prog[`ck:b${i}`] = p({ box: 1, totalAttempts: 1, lastReviewedMs: NOW - (i + 2) * 3600_000 }); }
  for (let i = 0; i < 10; i++) { pool.push({ key: `ck:o${i}`, world: 'cards' }); prog[`ck:o${i}`] = p({ box: 2, totalAttempts: 1, lastReviewedMs: NOW - (2 + i) * DAY_S * 1000 }); }
  for (const w of ['ck_cards', 'ck_id', 'ck_gi']) for (let i = 0; i < 10; i++) pool.push({ key: `ck:n${w}${i}`, world: w });
  const r = selectRound(pool, prog, 20, NOW, DAY0, seeded(7));
  assert.equal(r.length, 20);
  assert.ok(r[0].startsWith('ck:b'), 'Box 1 leads');
  assert.ok(r[1].startsWith('ck:o'), 'overdue takes the second slot');
  assert.equal(r[0], 'ck:b9', 'most neglected Box 1 first');
  assert.equal(r[1], 'ck:o9', 'most neglected overdue first');
  const fresh = r.filter((k) => k.startsWith('ck:n'));
  assert.equal(fresh.length, 6);
  const worlds = new Set(fresh.map((k) => k.slice(4, -1)));
  assert.equal(worlds.size, 3, 'new cards spread across worlds');
  assert.equal(new Set(r).size, 20, 'no repeats');
});

test('a Box 1 card answered under a minute ago waits; today-reviewed Box 2+ is last resort', () => {
  const pool = [{ key: 'ck:1', world: 'a' }, { key: 'ck:2', world: 'a' }, { key: 'ck:3', world: 'a' }];
  const prog = {
    'ck:1': p({ box: 1, totalAttempts: 1, lastReviewedMs: NOW - 30_000 }),
    'ck:2': p({ box: 3, totalAttempts: 2, lastReviewedMs: NOW - 3600_000 }),
    'ck:3': p({ box: 1, totalAttempts: 1, lastReviewedMs: NOW - 120_000 }),
  };
  const r = selectRound(pool, prog, 1, NOW, DAY0, seeded(1));
  assert.deepEqual(r, ['ck:3']);
  const all = selectRound(pool, prog, 3, NOW, DAY0, seeded(1));
  assert.equal(all[0], 'ck:3');
  assert.deepEqual(new Set(all), new Set(['ck:1', 'ck:2', 'ck:3']));
});

test('no new cards left: the round fills from review, least mastered first', () => {
  const pool = [];
  const prog = {};
  for (let b = 2; b <= 5; b++) { pool.push({ key: `ck:${b}`, world: 'a' }); prog[`ck:${b}`] = p({ box: b, totalAttempts: 3, lastReviewedMs: DAY0 - 1000 }); }
  const r = selectRound(pool, prog, 2, NOW, DAY0, seeded(3));
  // Box 2 reviewed yesterday is overdue (1 day) only if a full day passed; here it has not.
  assert.deepEqual(r.sort(), ['ck:2', 'ck:3']);
});
