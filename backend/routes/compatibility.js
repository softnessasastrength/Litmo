import express from 'express';
import { toConsentProfileVersion, computeCompatibility } from '@litmo/domain';

const router = express.Router();

// Canonical Chapter 3 route. Documented in docs/adr/0001-directional-consent-engine.md
// and docs/adr/0002-legacy-profile-adapter.md. Accepts the legacy Chapter 2 touch/consent
// shape per participant, maps it through the documented adapter, and runs the same pure
// engine `@litmo/domain` exposes to the mobile client. This never grants consent; it only
// reports compatibility.
function toProfileVersion(participant, label) {
  if (!participant || typeof participant !== 'object') {
    throw new TypeError(`${label} is required.`);
  }
  const { touchId, touchVersion, consentVersion, userId, createdAt, touch, consent } =
    participant;
  return toConsentProfileVersion({
    touchId,
    touchVersion,
    consentVersion,
    userId,
    createdAt,
    touch,
    consent,
  });
}

router.post('/compatibility', (req, res) => {
  try {
    const profileA = toProfileVersion(req.body?.participantA, 'participantA');
    const profileB = toProfileVersion(req.body?.participantB, 'participantB');
    const compatibility = computeCompatibility(profileA, profileB);
    return res.status(compatibility.eligible ? 200 : 422).json({ compatibility });
  } catch (error) {
    return res.status(400).json({
      error: 'invalid_consent_profiles',
      message: error instanceof Error ? error.message : 'Invalid consent profiles.',
    });
  }
});

export default router;
