import { randomUUID } from 'node:crypto';
import {
  createConsentSnapshot,
  toConsentProfileVersion,
} from '@litmo/domain';

export class SessionSnapshotError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.name = 'SessionSnapshotError';
    this.code = code;
    this.status = status;
  }
}

function profileVersion(touch, consent) {
  if (!touch || !consent) throw new SessionSnapshotError('profile_versions_missing', 409);
  return toConsentProfileVersion({
    touchId: touch.id,
    touchVersion: touch.version,
    consentVersion: consent.version,
    userId: touch.user_id,
    createdAt: touch.created_at,
    touch: {
      ...touch.profile,
      privateNervousSystemNotes: null,
    },
    consent: {
      ...consent.preferences,
      privateNervousSystemNotes: null,
    },
  });
}

export function createSessionSnapshotService(repository, options = {}) {
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? randomUUID;

  return async function createForSession({ accessToken, sessionId }) {
    if (!accessToken) throw new SessionSnapshotError('authentication_required', 401);
    const actorId = await repository.authenticate(accessToken);
    if (!actorId) throw new SessionSnapshotError('authentication_required', 401);

    const session = await repository.getSession(sessionId);
    if (!session || ![session.user_a, session.user_b].includes(actorId)) {
      throw new SessionSnapshotError('session_not_found_or_access_denied', 404);
    }
    if (session.status !== 'consent_pending') {
      throw new SessionSnapshotError('session_not_awaiting_consent', 409);
    }

    const [versionsA, versionsB] = await Promise.all([
      repository.getLatestProfileVersions(session.user_a),
      repository.getLatestProfileVersions(session.user_b),
    ]);
    const snapshot = createConsentSnapshot({
      id: newId(),
      sessionId: session.id,
      profileA: profileVersion(versionsA?.touch, versionsA?.consent),
      profileB: profileVersion(versionsB?.touch, versionsB?.consent),
      createdAt: now().toISOString(),
    });
    if (!snapshot.compatibility.eligible) {
      throw new SessionSnapshotError('no_compatible_consent_overlap', 422);
    }

    const snapshotId = await repository.persistSnapshot(snapshot);
    return { ...snapshot, id: snapshotId, confirmations: {} };
  };
}
