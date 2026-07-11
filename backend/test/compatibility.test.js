import assert from 'node:assert/strict';
import test from 'node:test';
import { toConsentProfileVersion, computeCompatibility } from '@litmo/domain';

const createdAt = '2026-07-11T10:00:00Z';
const touch = {
  pressure: 'medium',
  duration: 'few_minutes',
  environments: ['public_calm'],
  holdTypes: ['hand_holding'],
  privateNervousSystemNotes: null,
};
const consent = {
  bodyZones: [{ zone: 'hands', status: 'welcomed', pressure: 'medium' }],
  hardStops: [],
  privateNervousSystemNotes: null,
};
const participant = (userId, touchId) => ({
  touchId,
  touchVersion: 1,
  consentVersion: 1,
  userId,
  createdAt,
  touch,
  consent,
});

test('the canonical adapter and engine agree with two compatible participants', () => {
  const profileA = toConsentProfileVersion(
    participant('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  );
  const profileB = toConsentProfileVersion(
    participant('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002'),
  );
  const result = computeCompatibility(profileA, profileB, new Date(createdAt));
  assert.equal(result.eligible, true);
  assert.equal(result.consentGranted, false);
  assert.ok(result.permitted.some((item) => item.value === 'hands'));
});

test('an invalid participant shape fails closed rather than partially mapping', () => {
  const invalid = {
    ...participant('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
    touch: { pressure: 'not-a-real-value' },
  };
  assert.throws(() => toConsentProfileVersion(invalid));
});
