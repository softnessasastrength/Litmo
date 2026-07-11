import crypto from 'node:crypto';
import express from 'express';

const router = express.Router();

const PRESSURE_RANK = Object.freeze({ light: 0, medium: 1, firm: 2 });
const DURATION_MINUTES = Object.freeze({ '15min': 15, '30min': 30, '60min': 60, open: Number.POSITIVE_INFINITY });
const ZONE_RANK = Object.freeze({ off_limits: 0, ask_first: 1, welcomed: 2 });

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === 'string'))].sort();
}

function conservativeEnum(a, b, ranking) {
  if (!(a in ranking) || !(b in ranking)) return null;
  return ranking[a] <= ranking[b] ? a : b;
}

function conservativeDuration(a, b) {
  if (!(a in DURATION_MINUTES) || !(b in DURATION_MINUTES)) return null;
  return DURATION_MINUTES[a] <= DURATION_MINUTES[b] ? a : b;
}

function intersectStrings(a, b) {
  const right = new Set(uniqueStrings(b));
  return uniqueStrings(a).filter((value) => right.has(value));
}

function allZoneIds(a, b) {
  return [...new Set([...Object.keys(isPlainObject(a) ? a : {}), ...Object.keys(isPlainObject(b) ? b : {})])].sort();
}

function normalizeZone(zone) {
  if (!isPlainObject(zone)) return { status: 'off_limits', pressure: null };
  const status = zone.status in ZONE_RANK ? zone.status : 'off_limits';
  const pressure = zone.pressure in PRESSURE_RANK ? zone.pressure : null;
  return { status, pressure };
}

export function computeConsentOverlap(userA, userB) {
  if (!isPlainObject(userA) || !isPlainObject(userB)) {
    throw new TypeError('Both consent profiles must be objects.');
  }

  const holdTypes = intersectStrings(userA.hold_types, userB.hold_types);
  const environments = intersectStrings(userA.environments, userB.environments);
  const pressure = conservativeEnum(userA.pressure, userB.pressure, PRESSURE_RANK);
  const duration = conservativeDuration(userA.duration, userB.duration);

  const zonesA = isPlainObject(userA.body_zones) ? userA.body_zones : {};
  const zonesB = isPlainObject(userB.body_zones) ? userB.body_zones : {};
  const bodyZones = {};

  for (const zoneId of allZoneIds(zonesA, zonesB)) {
    const a = normalizeZone(zonesA[zoneId]);
    const b = normalizeZone(zonesB[zoneId]);
    const status = conservativeEnum(a.status, b.status, ZONE_RANK) ?? 'off_limits';

    bodyZones[zoneId] = {
      status,
      pressure:
        status === 'off_limits'
          ? null
          : conservativeEnum(a.pressure, b.pressure, PRESSURE_RANK),
    };
  }

  const eligible =
    holdTypes.length > 0 &&
    environments.length > 0 &&
    pressure !== null &&
    duration !== null &&
    Object.values(bodyZones).some((zone) => zone.status !== 'off_limits' && zone.pressure !== null);

  return {
    version: 1,
    eligible,
    hold_types: holdTypes,
    environments,
    pressure,
    duration,
    body_zones: bodyZones,
  };
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function hashConsentSnapshot(snapshot) {
  const canonical = JSON.stringify(canonicalize(snapshot));
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

router.post('/overlap', (req, res) => {
  try {
    const overlap = computeConsentOverlap(req.body?.user_a, req.body?.user_b);
    return res.status(overlap.eligible ? 200 : 422).json({
      overlap,
      hash: hashConsentSnapshot(overlap),
    });
  } catch (error) {
    return res.status(400).json({
      error: 'invalid_consent_profiles',
      message: error instanceof Error ? error.message : 'Invalid consent profiles.',
    });
  }
});

export default router;
