// The shared-question page's rules (pages/q/[slug].tsx), run against the file the
// page imports, and every row of the question file the build will use.
//
//   node --test scripts/test_share_question.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanRef, missIn10, rightIn10, rowProblem, shuffledFor, toShareQuestion } from '../lib/shareQuestion.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAMPLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/share/questions.sample.json'), 'utf8'));
const row = (o = {}) => ({ ...SAMPLE[0], ...o });

test('the mock card: 14 of 141 right is 1 in 10 right, 9 in 10 miss', () => {
  assert.equal(rightIn10(14, 141), 1);
  assert.equal(missIn10(14, 141), 9);
});

test('the lines are held to 1..9 and always add up to 10', () => {
  for (const tried of [1, 7, 30, 141, 1000]) {
    for (let right = 0; right <= tried; right += 1) {
      const r = rightIn10(right, tried);
      const m = missIn10(right, tried);
      assert.ok(r >= 1 && r <= 9, `right ${right}/${tried} -> ${r}`);
      assert.ok(m >= 1 && m <= 9, `miss ${right}/${tried} -> ${m}`);
      assert.equal(r + m, 10);
    }
  }
  assert.equal(rightIn10(0, 50), 1);
  assert.equal(rightIn10(50, 50), 9);
  assert.equal(rightIn10(54, 168), 3); // 32% right: "Only 3 in 10 do"
});

test('the choice order is fixed per slug, keeps every choice, and moves the answer', () => {
  const choices = ['A1', 'B2', 'C3', 'D4', 'E5'];
  const a = shuffledFor('ck-10081', choices);
  assert.deepEqual(a, shuffledFor('ck-10081', choices));
  assert.deepEqual(a.slice().sort(), choices);
  // Across many slugs the first-listed choice lands in every position.
  const firstAt = new Set();
  for (let i = 0; i < 200; i += 1) firstAt.add(shuffledFor(`ck-${i}`, choices).indexOf('A1'));
  assert.deepEqual([...firstAt].sort(), [0, 1, 2, 3, 4]);
});

test('the page gets the answer as an index into the shuffled choices', () => {
  const q = toShareQuestion(row());
  assert.equal(q.choices[q.answerIndex], 'Obturator hernia');
  assert.equal(q.deckCount, 2530);
  assert.equal(toShareQuestion(row({ deckCount: undefined })).deckCount, null);
});

test('rows that cannot become a page are named', () => {
  assert.equal(rowProblem(row()), null);
  assert.equal(rowProblem(row({ question: '' })), null); // Buzzwords: the stem is the prompt
  assert.match(rowProblem(row({ answer: 'Hiatal hernia' })), /answer/);
  assert.match(rowProblem(row({ right: 142 })), /right/);
  assert.match(rowProblem(row({ tried: 0 })), /tried/);
  assert.match(rowProblem(row({ slug: 'CK 10081' })), /slug/);
  assert.match(rowProblem(row({ choices: ['A', 'A'] })), /repeat/);
  assert.match(rowProblem(row({ choices: ['Obturator hernia'] })), /choices/);
  assert.match(rowProblem(row({ deckCount: 0 })), /deckCount/);
  assert.match(rowProblem(null), /object/);
});

test('?ref= is cleaned the way /pro reads a code', () => {
  assert.equal(cleanRef(' swiftsca-k7qm '), 'SWIFTSCA-K7QM');
  assert.equal(cleanRef('SWIFTSCA-K7QM<script>'), 'SWIFTSCA-K7QMSCRIPT');
  assert.equal(cleanRef('ab'), null);
  assert.equal(cleanRef('A'.repeat(25)), null);
  assert.equal(cleanRef(['SWIFTSCA-K7QM']), null);
  assert.equal(cleanRef(undefined), null);
});

test('every row of the file the build uses becomes a page', () => {
  const real = path.join(ROOT, 'data/share/questions.json');
  const file = fs.existsSync(real) ? real : path.join(ROOT, 'data/share/questions.sample.json');
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(Array.isArray(rows) && rows.length > 0, `${path.basename(file)} has rows`);
  const bad = rows.map((r) => [r && r.slug, rowProblem(r)]).filter(([, why]) => why);
  assert.deepEqual(bad, [], `${path.basename(file)}: ${bad.length} rows skipped`);
  assert.equal(new Set(rows.map((r) => r.slug)).size, rows.length, 'slugs are unique');
});
