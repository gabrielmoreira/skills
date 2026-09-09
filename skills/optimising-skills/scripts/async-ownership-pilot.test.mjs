import test from 'node:test';
import assert from 'node:assert/strict';
import { summarise } from './async-ownership-pilot.mjs';

const trial = (family, repeat, arm, pass, extra = {}) => ({
  family, repeat, arm, grade: { valid: true, pass, checks: [] },
  elapsedMs: 10, usage: { totalTokens: 100 }, estimatedCost: 0.01, ...extra,
});
const pair = (family, repeat, win = true) => [
  trial(family, repeat, 'baseline', !win), trial(family, repeat, 'candidate', win),
];

test('repeats do not become independent families or precise effect bounds', () => {
  const records = ['pipeline', 'guarded', 'batch'].flatMap(family =>
    Array.from({ length: 4 }, (_, repeat) => pair(family, repeat)).flat());
  const result = summarise(records);
  assert.equal(result.wins, 12);
  assert.equal(result.uncertainty.families, 3);
  assert.equal(result.uncertainty.discordantFamilies, 3);
  assert.equal(result.uncertainty.signTestTwoSided, 0.25);
  assert.ok(result.uncertainty.effect95ReferenceBounds[0] < 0);
});

test('nine of twelve independent wins is not five percent evidence', () => {
  const result = summarise(Array.from({ length: 12 }, (_, index) => pair(`family-${index}`, 0, index < 9)).flat());
  assert.equal(result.uncertainty.signTestTwoSided, 0.14599609375);
});

test('invalid trials retain costs and make their paired comparison unavailable', () => {
  const result = summarise([...pair('pipeline', 0),
    trial('pipeline', 1, 'baseline', false),
    trial('pipeline', 1, 'candidate', true, { invalid: 'provider changed' })]);
  assert.equal(result.quarantinedTrials, 1);
  assert.equal(result.unavailablePairs, 1);
  assert.equal(result.pairs.length, 1);
  assert.equal(result.groups['pipeline/candidate'].totalTokens, 200);
  assert.equal(result.groups['pipeline/candidate'].attempted, 2);
  assert.equal(result.groups['pipeline/candidate'].valid, 1);
});

test('duplicate trial identities cannot silently select the favourable artifact', () => {
  assert.throws(() => summarise([...pair('pipeline', 0), trial('pipeline', 0, 'baseline', true)]), /duplicate trial/i);
});
