import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSessionSnapshotService,
  SessionSnapshotError,
} from '../services/sessionSnapshotService.js';

const userA = '10000000-0000-4000-8000-000000000001';
const userB = '10000000-0000-4000-8000-000000000002';
const sessionId = '30000000-0000-4000-8000-000000000001';
const createdAt = '2026-07-12T12:00:00.000Z';

function versions(userId, touchId) {
  return {
    touch: {
      id: touchId,
      user_id: userId,
      version: 1,
      created_at: createdAt,
      profile: {
        pressure: 'medium', duration: 'few_minutes',
        environments: ['public_calm'], holdTypes: ['hand_holding'],
      },
      private_nervous_system_notes: 'never copy this note',
    },
    consent: {
      user_id: userId,
      version: 1,
      created_at: createdAt,
      preferences: {
        bodyZones: [{ zone: 'hands', status: 'welcomed', pressure: 'medium' }],
        hardStops: [],
      },
      private_nervous_system_notes: 'or this note',
    },
  };
}

function repository(overrides = {}) {
  const persisted = [];
  return {
    persisted,
    authenticate: async () => userA,
    getSession: async () => ({ id: sessionId, user_a: userA, user_b: userB, status: 'consent_pending' }),
    getLatestProfileVersions: async (userId) => versions(
      userId,
      userId === userA
        ? '20000000-0000-4000-8000-000000000001'
        : '20000000-0000-4000-8000-000000000002',
    ),
    persistSnapshot: async (snapshot) => {
      persisted.push(snapshot);
      return '40000000-0000-4000-8000-000000000001';
    },
    ...overrides,
  };
}

const options = {
  now: () => new Date(createdAt),
  newId: () => '40000000-0000-4000-8000-000000000099',
};

test('a participant creates and persists one canonical exact-version snapshot', async () => {
  const repo = repository();
  const createSnapshot = createSessionSnapshotService(repo, options);
  const snapshot = await createSnapshot({ accessToken: 'valid-token', sessionId });

  assert.equal(repo.persisted.length, 1);
  assert.equal(snapshot.id, '40000000-0000-4000-8000-000000000001');
  assert.equal(snapshot.profileAVersion, 1);
  assert.equal(snapshot.profileBVersion, 1);
  assert.equal(snapshot.compatibility.consentGranted, false);
  assert.equal(snapshot.fingerprint.length, 64);
  assert.doesNotMatch(JSON.stringify(snapshot), /never copy|or this note/);
});

test('missing authentication fails before session or profile data is read', async () => {
  let sessionRead = false;
  const repo = repository({ getSession: async () => { sessionRead = true; } });
  const createSnapshot = createSessionSnapshotService(repo, options);
  await assert.rejects(
    createSnapshot({ accessToken: null, sessionId }),
    (error) => error instanceof SessionSnapshotError && error.code === 'authentication_required',
  );
  assert.equal(sessionRead, false);
});

test('a non-participant receives the same opaque denial as a missing session', async () => {
  const repo = repository({ authenticate: async () => '10000000-0000-4000-8000-000000000003' });
  const createSnapshot = createSessionSnapshotService(repo, options);
  await assert.rejects(
    createSnapshot({ accessToken: 'valid-token', sessionId }),
    (error) => error.code === 'session_not_found_or_access_denied' && error.status === 404,
  );
});

test('diverged profile versions fail closed without persisting a snapshot', async () => {
  const repo = repository({
    getLatestProfileVersions: async (userId) => {
      const result = versions(userId, userId === userA
        ? '20000000-0000-4000-8000-000000000001'
        : '20000000-0000-4000-8000-000000000002');
      result.consent.version = 2;
      return result;
    },
  });
  const createSnapshot = createSessionSnapshotService(repo, options);
  await assert.rejects(createSnapshot({ accessToken: 'valid-token', sessionId }));
  assert.equal(repo.persisted.length, 0);
});
