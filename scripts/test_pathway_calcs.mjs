// Every pathway calculator's own worked examples, run through the web engine.
//
//   node --test scripts/test_pathway_calcs.mjs        (npm run test:calcs)
//
// Node 22.6+ runs lib/pathways/calc.ts directly (type stripping), so the test
// exercises the exact file the pages import. A calculator ships interactive on
// the site only while this passes: the same tests gate the content in the app
// repo (validate_pathways.py) and the app (PathwayCalculatorTests.swift).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CalcError, parseExpr, evaluate, exprNames, runFormula, pointsTotal, defaults, roundHalfAway, roundTo, bandFor, prettyExpr,
} from '../lib/pathways/calc.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'content', 'pathways');
const pathways = fs.readdirSync(DIR).filter((n) => n.endsWith('.json')).sort()
  .map((n) => JSON.parse(fs.readFileSync(path.join(DIR, n), 'utf8')));
const calcs = pathways.flatMap((p) => (p.calculators || []).map((c) => ({ p, c })));
const TOL = 1e-6;

test('the content has calculators to test', () => {
  assert.ok(calcs.length >= 31, `expected at least 31 calculators, found ${calcs.length}`);
});

for (const { p, c } of calcs) {
  test(`${p.id} / ${c.id}: its own tests pass`, () => {
    assert.ok(Array.isArray(c.tests) && c.tests.length >= 2, 'at least two tests');
    for (const [k, t] of c.tests.entries()) {
      if (c.kind === 'formula') {
        const values = { ...defaults(c), ...(t.inputs || {}) };
        const got = runFormula(c, values);
        assert.equal(got.length, t.expect.length, `test ${k + 1}: one expectation per output`);
        got.forEach((g, j) => {
          assert.equal(g.error, undefined, `test ${k + 1} ${g.label}: ${g.error}`);
          assert.ok(Math.abs(g.value - t.expect[j]) <= TOL, `test ${k + 1} ${g.label}: got ${g.value}, expected ${t.expect[j]}`);
        });
      } else {
        assert.equal(pointsTotal(c, t.picks || {}), t.expect, `test ${k + 1}: points total`);
        assert.ok(bandFor(c.bands, t.expect), `test ${k + 1}: total ${t.expect} falls in no band`);
      }
    }
  });

  test(`${p.id} / ${c.id}: formulas read only their own inputs, defaults compute`, () => {
    if (c.kind !== 'formula') return;
    const ids = new Set((c.inputs || []).map((i) => i.id));
    for (const o of c.outputs) {
      for (const n of exprNames(parseExpr(o.expr))) assert.ok(ids.has(n), `${o.label} reads ${n}, not an input`);
      assert.doesNotThrow(() => prettyExpr(o.expr, {}));
    }
    for (const r of runFormula(c, defaults(c))) assert.equal(r.error, undefined, `${r.label} at the defaults: ${r.error}`);
  });
}

test('every step names calculators its pathway has', () => {
  for (const p of pathways) {
    const ids = new Set((p.calculators || []).map((c) => c.id));
    for (const n of p.nodes) for (const id of n.calcs || []) assert.ok(ids.has(id), `${p.id}/${n.id} names ${id}`);
  }
});

test('the grammar refuses anything that is not arithmetic', () => {
  const refused = [
    'alert(1)', 'Math.max(1, 2)', 'na ** 2', 'na; 1', '1e3', '0x1f', 'min(1)', 'round(1, 2)', 'max(1, 2, 3)',
    '(1 + 2', '1 + 2)', '', '-', 'na − cl', '`1`', 'na[0]', 'na.length', 'constructor', '__proto__', 'na = 1',
  ];
  for (const src of refused) {
    assert.throws(() => evaluate(parseExpr(src), { na: 1, cl: 1 }), CalcError, `should refuse ${JSON.stringify(src)}`);
  }
});

test('arithmetic follows the grammar: precedence, unary minus, functions', () => {
  const v = (s, vals = {}) => evaluate(parseExpr(s), vals);
  assert.equal(v('1 + 2 * 3'), 7);
  assert.equal(v('(1 + 2) * 3'), 9);
  assert.equal(v('8 / 4 / 2'), 1);
  assert.equal(v('10 - 4 - 3'), 3);
  assert.equal(v('--2'), 2);
  assert.equal(v('-2 * -3'), 6);
  assert.equal(v('min(3, max(1, 2))'), 2);
  assert.equal(v('round(2.5) + round(-2.5)'), 0);
  assert.equal(v('.5 + 1.'), 1.5);
  assert.equal(v('na - (cl + hco3)', { na: 134, cl: 98, hco3: 11 }), 25);
  assert.throws(() => v('1 / (2 - 2)'), CalcError);
});

test('formulas print with input labels and real operator signs', () => {
  const labels = { na: 'Sodium', cl: 'Chloride', hco3: 'Bicarbonate', g0: 'Glucose before', g1: 'Glucose after' };
  assert.equal(prettyExpr('na - (cl + hco3)', labels), 'Sodium \u2212 (Chloride + Bicarbonate)');
  assert.equal(prettyExpr('2 * na + glu / 18', labels), '2 \u00d7 Sodium + glu \u00f7 18');
  assert.equal(prettyExpr('-1.6 * (g0 - g1) / 100', labels), '\u22121.6 \u00d7 (Glucose before \u2212 Glucose after) \u00f7 100');
  assert.equal(prettyExpr('max(0, na)', labels), 'max(0, Sodium)');
  for (const { c } of calcs) {
    if (c.kind !== 'formula') continue;
    const l = Object.fromEntries(c.inputs.map((i) => [i.id, i.label]));
    for (const o of c.outputs) assert.doesNotMatch(prettyExpr(o.expr, l), /undefined/, `${c.id} ${o.label}`);
  }
});

test('shown values round half away from zero, never -0', () => {
  assert.equal(roundHalfAway(0.5), 1);
  assert.equal(roundHalfAway(-0.5), -1);
  assert.equal(roundHalfAway(2.4999), 2);
  assert.equal(roundTo(7.25, 1), 7.3);
  assert.equal(roundTo(-0.04, 1), 0);
  assert.ok(Object.is(roundTo(-0.04, 1), 0));
});
