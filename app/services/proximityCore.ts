/**
 * Proximity social layer — pure protocol and privacy gates.
 *
 * Disclosure ladder (never skip):
 *  1. Anonymous presence beacon (no name, no account id)
 *  2. Local compatibility radar (weather resonance only — not safety)
 *  3. Mutual Multipeer handshake + ephemeral E2E keys
 *  4. Mutual interest to continue
 *  5. Mutual consent before any identity reveal
 *  6. Soft Signal / stop anytime — no penalty, no explanation
 *
 * Never activates a session. Never grants touch consent.
 * Compatible with Multipeer Connectivity discoveryInfo size limits.
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";
import {
  b64url,
  deriveLocalShareSessionKey,
  encryptSharePayload,
  decryptSharePayload,
  fromB64url,
  generateX25519KeyPair,
  type X25519KeyPair,
} from "./localShareCore.ts";

export const PROXIMITY_PROTOCOL_VERSION = 1 as const;
export const PROXIMITY_SERVICE_HINT = "px";
/** Radar radio default lifetime. */
export const PROXIMITY_DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
/** Rotate ephemeral beacon token this often while radio is on. */
export const PROXIMITY_TOKEN_ROTATE_MS = 90 * 1000;

/** Coarse 0–3 axes. Not clinical. Not consent. Not a trust score. */
export type ProximityAxes = {
  /** 0 unhurried · 3 quicker social pace */
  pace: number;
  /** 0 quiet presence · 3 warm outgoing presence */
  presence: number;
  /** 0 sensory-soft · 3 sensory-flexible */
  sensory: number;
  /** 0 space-first repair · 3 talk-first repair */
  repair: number;
};

export type WeatherFamily = "hearth" | "lantern" | "tidepool" | "none";

/**
 * Public anonymous beacon — safe to put in Multipeer discoveryInfo.
 * Must never include legal name, account id, photo, body zones, or notes.
 */
export type ProximityBeacon = {
  v: typeof PROXIMITY_PROTOCOL_VERSION;
  /** Ephemeral rotating token; not an account id. */
  token: string;
  axes: ProximityAxes;
  weather: WeatherFamily;
  /** Prefers quieter nearby interactions. */
  quiet: boolean;
  /** Epoch ms when this beacon was minted. */
  mintedAt: number;
};

export type CompatibilityBand =
  | "distant"
  | "gentle"
  | "aligned"
  | "very_aligned";

export type RadarMatch = {
  peerKey: string;
  /** Multipeer display name is already anonymous (ephemeral). */
  ephemeralLabel: string;
  beacon: ProximityBeacon;
  /** 0–100 weather resonance. Never a safety score. */
  resonance: number;
  band: CompatibilityBand;
  disclaimer: string;
};

export type IdentityRevealPayload = {
  kind: "identity_reveal";
  v: typeof PROXIMITY_PROTOCOL_VERSION;
  displayName: string;
  pronouns: string | null;
  shortIntro: string | null;
  notConsentToTouch: true;
  notSessionActivation: true;
  disclaimer: string;
};

export type ProximityWireMessage =
  | {
      t: "px_hello";
      v: typeof PROXIMITY_PROTOCOL_VERSION;
      ephemeralPublic: string;
      token: string;
    }
  | {
      t: "px_hello_ack";
      v: typeof PROXIMITY_PROTOCOL_VERSION;
      ephemeralPublic: string;
      token: string;
    }
  | {
      t: "px_interest";
      v: typeof PROXIMITY_PROTOCOL_VERSION;
      /** AES-GCM of { wantContinue: true } */
      ciphertext: string;
    }
  | {
      t: "px_identity_offer";
      v: typeof PROXIMITY_PROTOCOL_VERSION;
      ciphertext: string;
    }
  | {
      t: "px_identity_accept";
      v: typeof PROXIMITY_PROTOCOL_VERSION;
      ciphertext: string;
    }
  | {
      t: "px_soft_signal";
      v: typeof PROXIMITY_PROTOCOL_VERSION;
      reason: "soft_signal" | "leave" | "timeout";
    }
  | { t: "px_cancel"; v: typeof PROXIMITY_PROTOCOL_VERSION };

export type DisclosurePhase =
  | "radio_off"
  | "radar"
  | "handshake_pending"
  | "encrypted"
  | "mutual_interest"
  | "identity_pending"
  | "identity_revealed"
  | "soft_signaled"
  | "stopped";

const RESONANCE_DISCLAIMER =
  "Weather resonance only. Not safety, not trust, not consent to touch, not a match.";

const IDENTITY_DISCLAIMER =
  "Identity was revealed only after mutual consent nearby. This is never consent to touch and never starts a session.";

export function clampAxis(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.round(n)));
}

export function normalizeAxes(input: Partial<ProximityAxes>): ProximityAxes {
  return {
    pace: clampAxis(input.pace ?? 1),
    presence: clampAxis(input.presence ?? 1),
    sensory: clampAxis(input.sensory ?? 1),
    repair: clampAxis(input.repair ?? 1),
  };
}

export function mintEphemeralToken(
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): string {
  return b64url(random(6)).slice(0, 8);
}

/** Anonymous Multipeer display name — never a real display name. */
export function mintAnonymousPeerLabel(
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): string {
  const t = mintEphemeralToken(random);
  return `·${t}`;
}

export function buildBeacon(input: {
  axes: Partial<ProximityAxes>;
  weather?: WeatherFamily;
  quiet?: boolean;
  token?: string;
  now?: number;
  random?: (n: number) => Uint8Array;
}): ProximityBeacon {
  const random = input.random ?? ((n: number) => randomBytes(n));
  return {
    v: PROXIMITY_PROTOCOL_VERSION,
    token: input.token ?? mintEphemeralToken(random),
    axes: normalizeAxes(input.axes),
    weather: input.weather ?? "none",
    quiet: Boolean(input.quiet),
    mintedAt: input.now ?? Date.now(),
  };
}

/**
 * Compact discoveryInfo-safe encoding (short strings only).
 * Format: v1|p{p}r{r}s{s}e{e}|w{W}|q{0|1}|t{token}
 */
export function encodeBeaconForDiscovery(beacon: ProximityBeacon): string {
  const w =
    beacon.weather === "hearth"
      ? "H"
      : beacon.weather === "lantern"
        ? "L"
        : beacon.weather === "tidepool"
          ? "T"
          : "n";
  const a = beacon.axes;
  return `v1|p${a.pace}r${a.presence}s${a.sensory}e${a.repair}|w${w}|q${
    beacon.quiet ? 1 : 0
  }|t${beacon.token}`;
}

export function decodeBeaconFromDiscovery(
  raw: string | null | undefined,
): ProximityBeacon | null {
  if (!raw || typeof raw !== "string") return null;
  const m = raw.match(
    /^v1\|p(\d)r(\d)s(\d)e(\d)\|w([HLTn])\|q([01])\|t([A-Za-z0-9_-]{4,16})$/,
  );
  if (!m) return null;
  const token = m[7];
  if (!token) return null;
  const weather: WeatherFamily =
    m[5] === "H"
      ? "hearth"
      : m[5] === "L"
        ? "lantern"
        : m[5] === "T"
          ? "tidepool"
          : "none";
  return {
    v: PROXIMITY_PROTOCOL_VERSION,
    token,
    axes: normalizeAxes({
      pace: Number(m[1]),
      presence: Number(m[2]),
      sensory: Number(m[3]),
      repair: Number(m[4]),
    }),
    weather,
    quiet: m[6] === "1",
    mintedAt: Date.now(),
  };
}

/**
 * Weather resonance 0–100. Lower distance = higher resonance.
 * Quiet-preference mismatch slightly dampens; never zeroed (avoid shaming).
 */
export function computeResonance(
  self: ProximityAxes,
  peer: ProximityAxes,
  opts?: { selfQuiet?: boolean; peerQuiet?: boolean },
): number {
  const keys: (keyof ProximityAxes)[] = [
    "pace",
    "presence",
    "sensory",
    "repair",
  ];
  let dist = 0;
  for (const k of keys) {
    dist += Math.abs(clampAxis(self[k]) - clampAxis(peer[k]));
  }
  // Max dist = 3*4 = 12
  let score = Math.round(100 * (1 - dist / 12));
  if (opts?.selfQuiet && opts?.peerQuiet) score = Math.min(100, score + 4);
  if (opts?.selfQuiet !== opts?.peerQuiet) score = Math.max(0, score - 6);
  return Math.max(0, Math.min(100, score));
}

export function bandForResonance(resonance: number): CompatibilityBand {
  if (resonance >= 80) return "very_aligned";
  if (resonance >= 60) return "aligned";
  if (resonance >= 40) return "gentle";
  return "distant";
}

export function bandLabel(band: CompatibilityBand): string {
  switch (band) {
    case "very_aligned":
      return "Very similar weather";
    case "aligned":
      return "Similar weather";
    case "gentle":
      return "Gentle overlap";
    default:
      return "Different weather";
  }
}

export function buildRadarMatch(input: {
  peerKey: string;
  ephemeralLabel: string;
  selfBeacon: ProximityBeacon;
  peerBeacon: ProximityBeacon;
}): RadarMatch {
  const resonance = computeResonance(input.selfBeacon.axes, input.peerBeacon.axes, {
    selfQuiet: input.selfBeacon.quiet,
    peerQuiet: input.peerBeacon.quiet,
  });
  return {
    peerKey: input.peerKey,
    ephemeralLabel: input.ephemeralLabel,
    beacon: input.peerBeacon,
    resonance,
    band: bandForResonance(resonance),
    disclaimer: RESONANCE_DISCLAIMER,
  };
}

/** DiscoveryInfo map for Multipeer (string values only, keep small). */
export function discoveryInfoFromBeacon(beacon: ProximityBeacon): Record<
  string,
  string
> {
  return {
    m: PROXIMITY_SERVICE_HINT,
    b: encodeBeaconForDiscovery(beacon),
  };
}

export function parseProximityDiscoveryInfo(
  info: Record<string, unknown> | null | undefined,
): ProximityBeacon | null {
  if (!info) return null;
  if (info.m !== PROXIMITY_SERVICE_HINT && info.mode !== "px") {
    // Still try beacon if present (forward compatible).
  }
  const b = typeof info.b === "string" ? info.b : typeof info.beacon === "string" ? info.beacon : null;
  return decodeBeaconFromDiscovery(b);
}

export function buildIdentityReveal(input: {
  displayName: string;
  pronouns?: string | null;
  shortIntro?: string | null;
}): IdentityRevealPayload {
  const name = input.displayName.trim().slice(0, 80);
  if (!name) throw new Error("A display name is required to reveal identity.");
  return {
    kind: "identity_reveal",
    v: PROXIMITY_PROTOCOL_VERSION,
    displayName: name,
    pronouns: input.pronouns?.trim()
      ? input.pronouns.trim().slice(0, 40)
      : null,
    shortIntro: input.shortIntro?.trim()
      ? input.shortIntro.trim().slice(0, 200)
      : null,
    notConsentToTouch: true,
    notSessionActivation: true,
    disclaimer: IDENTITY_DISCLAIMER,
  };
}

export function encodeProximityWire(msg: ProximityWireMessage): string {
  return JSON.stringify(msg);
}

export function parseProximityWire(raw: string): ProximityWireMessage | null {
  try {
    const msg = JSON.parse(raw) as ProximityWireMessage;
    if (!msg || typeof msg !== "object") return null;
    if (msg.v !== PROXIMITY_PROTOCOL_VERSION) return null;
    if (
      msg.t === "px_hello" ||
      msg.t === "px_hello_ack" ||
      msg.t === "px_interest" ||
      msg.t === "px_identity_offer" ||
      msg.t === "px_identity_accept" ||
      msg.t === "px_soft_signal" ||
      msg.t === "px_cancel"
    ) {
      return msg;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Strict identity-reveal gate: both local and peer must have explicitly
 * accepted. Fail closed on missing flags.
 */
export function mayRevealIdentity(state: {
  localAcceptedReveal: boolean;
  peerAcceptedReveal: boolean;
  encryptedChannelReady: boolean;
  softSignaled: boolean;
}): boolean {
  if (state.softSignaled) return false;
  if (!state.encryptedChannelReady) return false;
  return state.localAcceptedReveal && state.peerAcceptedReveal;
}

export function nextDisclosurePhase(input: {
  radioOn: boolean;
  softSignaled: boolean;
  connected: boolean;
  encrypted: boolean;
  mutualInterest: boolean;
  localReveal: boolean;
  peerReveal: boolean;
  identityShown: boolean;
}): DisclosurePhase {
  if (input.softSignaled) return "soft_signaled";
  if (!input.radioOn) return "radio_off";
  if (input.identityShown && mayRevealIdentity({
    localAcceptedReveal: input.localReveal,
    peerAcceptedReveal: input.peerReveal,
    encryptedChannelReady: input.encrypted,
    softSignaled: false,
  })) {
    return "identity_revealed";
  }
  if (input.localReveal || input.peerReveal) return "identity_pending";
  if (input.mutualInterest) return "mutual_interest";
  if (input.encrypted) return "encrypted";
  if (input.connected) return "handshake_pending";
  return "radar";
}

/** Encrypt a small JSON object under the proximity session key. */
export function sealProximityJson(
  sessionKey: Uint8Array,
  kind: "discovery_profile",
  value: unknown,
): string {
  // Reuse share AAD kinds carefully: identity maps to discovery_profile shape
  // via a dedicated wrapper payload for AES AAD reuse.
  const payload = {
    kind: "discovery_profile" as const,
    v: 1 as const,
    displayName: "__px__",
    pronouns: null,
    bio: JSON.stringify(value),
    sharedAt: new Date().toISOString(),
    notConsentToTouch: true as const,
    disclaimer: "proximity-sealed",
  };
  return encryptSharePayload(sessionKey, payload);
}

export function openProximityJson(
  sessionKey: Uint8Array,
  ciphertext: string,
): unknown | null {
  const opened = decryptSharePayload(sessionKey, ciphertext, "discovery_profile");
  if (!opened || opened.kind !== "discovery_profile") return null;
  if (opened.displayName !== "__px__" || !opened.bio) return null;
  try {
    return JSON.parse(opened.bio);
  } catch {
    return null;
  }
}

export function sealIdentityReveal(
  sessionKey: Uint8Array,
  identity: IdentityRevealPayload,
): string {
  return sealProximityJson(sessionKey, "discovery_profile", identity);
}

export function openIdentityReveal(
  sessionKey: Uint8Array,
  ciphertext: string,
): IdentityRevealPayload | null {
  const raw = openProximityJson(sessionKey, ciphertext);
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.kind !== "identity_reveal") return null;
  if (o.notConsentToTouch !== true || o.notSessionActivation !== true) {
    return null;
  }
  if (typeof o.displayName !== "string" || !o.displayName) return null;
  return {
    kind: "identity_reveal",
    v: PROXIMITY_PROTOCOL_VERSION,
    displayName: o.displayName.slice(0, 80),
    pronouns: typeof o.pronouns === "string" ? o.pronouns : null,
    shortIntro: typeof o.shortIntro === "string" ? o.shortIntro : null,
    notConsentToTouch: true,
    notSessionActivation: true,
    disclaimer:
      typeof o.disclaimer === "string" ? o.disclaimer : IDENTITY_DISCLAIMER,
  };
}

export {
  generateX25519KeyPair,
  deriveLocalShareSessionKey,
  b64url,
  fromB64url,
  type X25519KeyPair,
};

/** Stable demo peers for Expo Go / ND practice without radio. */
export function demoRadarPeers(self: ProximityBeacon): RadarMatch[] {
  const samples: ProximityBeacon[] = [
    buildBeacon({
      axes: { pace: 1, presence: 1, sensory: 0, repair: 1 },
      weather: "tidepool",
      quiet: true,
      token: "demo0001",
    }),
    buildBeacon({
      axes: { pace: 2, presence: 2, sensory: 2, repair: 2 },
      weather: "lantern",
      quiet: false,
      token: "demo0002",
    }),
    buildBeacon({
      axes: { pace: 0, presence: 0, sensory: 0, repair: 0 },
      weather: "hearth",
      quiet: true,
      token: "demo0003",
    }),
  ];
  return samples.map((b, i) =>
    buildRadarMatch({
      peerKey: `demo-${b.token}`,
      ephemeralLabel: `·demo${i + 1}`,
      selfBeacon: self,
      peerBeacon: b,
    }),
  );
}

/** Fingerprint for logging only — never log tokens raw. */
export function peerLogFingerprint(peerKey: string): string {
  const h = sha256(new TextEncoder().encode(peerKey));
  return b64url(h).slice(0, 8);
}
