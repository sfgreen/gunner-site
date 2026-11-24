// The site's form list (lib/readiness.ts): NBME 17 is offered, and adding it never moved an old form's
// share-link index (a share link stores forms by FORMS index).
//   node --experimental-transform-types --no-warnings --import ./scripts/ts-resolve.mjs --test scripts/test_readiness_forms.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORMS, FORM_CHOICES, encodeShare, decodeShare, formOffset } from '../lib/readiness.ts';

test('the share-link indexes of the forms before NBME 17 never move', () => {
  const pinned = ['NBME 9', 'NBME 10', 'NBME 11', 'NBME 12', 'NBME 13', 'NBME 14', 'NBME 15', 'NBME 16', 'UWSA 1', 'UWSA 2', 'UWSA 3'];
  pinned.forEach((f, i) => assert.equal(FORMS.indexOf(f), i, f));
  assert.equal(FORMS.indexOf('NBME 17'), 11);
});

test('pickers list every form once, NBME 17 after 16', () => {
  assert.deepEqual([...FORM_CHOICES].sort(), [...FORMS].sort());
  assert.equal(FORM_CHOICES.indexOf('NBME 17'), FORM_CHOICES.indexOf('NBME 16') + 1);
});

test('a link round-trips NBME 17 and the UWSAs', () => {
  const entries = [{ form: 'NBME 17', score: '251', days: '3' }, { form: 'UWSA 2', score: '262', days: '10' }];
  const back = decodeShare(encodeShare(entries, '', ''));
  assert.deepEqual(back.entries.map((e) => e.form), ['NBME 17', 'UWSA 2']);
});

test('NBME 17 is vendor-equated like 10-16 (no offset)', () => {
  assert.equal(formOffset('NBME 17'), 0);
  assert.equal(formOffset('NBME 16'), 0);
  assert.equal(formOffset('NBME 9'), 5.5);
});
