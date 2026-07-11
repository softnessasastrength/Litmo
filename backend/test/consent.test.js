import assert from 'node:assert/strict';
import test from 'node:test';
import { computeConsentOverlap, hashConsentSnapshot } from '../routes/consent.js';

const baseA = {
  hold_types: ['side-by-side', 'hand-holding'],
  environments: ['public_space', 'professional_setting'],
  pressure: 'firm',
  duration: '60min',
  body_zones: {
    hands: { status: 'welcomed', pressure: 'firm' },
    shoulders: { status: 'welcomed', pressure: 'medium' },
  },
};

const baseB = {
  hold_types: ['hand-holding'],
  environments: ['public_space'],
  pressure: 'light',
  duration: '30min',
  body_zones: {
    hands: { status: 'welcomed', pressure: 'light' },
    shoulders: { status: 'ask_first', pressure: 'light' },
  },
};

test('uses the strict intersection and more restrictive values', () => {
  const overlap = computeConsentOverlap(baseA, baseB);

  assert.equal(overlap.eligible, true);
  assert.deepEqual(overlap.hold_types, ['hand-holding']);
  assert.deepEqual(overlap.environments, ['public_space']);
  assert.equal(overlap.pressure, 'light');
  assert.equal(overlap.duration, '30min');
  assert.deepEqual(overlap.body_zones.hands, { status: 'welcomed', pressure: 'light' });
  assert.deepEqual(overlap.body_zones.shoulders, { status: 'ask_first', pressure: 'light' });
});

test('missing or malformed body zones fail closed', () => {
  const overlap = computeConsentOverlap(baseA, {
    ...baseB,
    body_zones: { hands: { status: 'surprise', pressure: 'firm' } },
  });

  assert.deepEqual(overlap.body_zones.hands, { status: 'off_limits', pressure: null });
  assert.equal(overlap.body_zones.shoulders.status, 'off_limits');
  assert.equal(overlap.eligible, false);
});

test('empty hold-type overlap is not eligible', () => {
  const overlap = computeConsentOverlap(baseA, { ...baseB, hold_types: ['spooning'] });
  assert.equal(overlap.eligible, false);
  assert.deepEqual(overlap.hold_types, []);
});

test('unknown top-level pressure fails closed', () => {
  const overlap = computeConsentOverlap(baseA, { ...baseB, pressure: 'maximum' });
  assert.equal(overlap.pressure, null);
  assert.equal(overlap.eligible, false);
});

test('snapshot hashes are stable across object key order', () => {
  const first = computeConsentOverlap(baseA, baseB);
  const second = {
    body_zones: first.body_zones,
    duration: first.duration,
    pressure: first.pressure,
    environments: first.environments,
    hold_types: first.hold_types,
    eligible: first.eligible,
    version: first.version,
  };

  assert.equal(hashConsentSnapshot(first), hashConsentSnapshot(second));
});

test('rejects non-object profiles', () => {
  assert.throws(() => computeConsentOverlap(null, baseB), /must be objects/);
});
