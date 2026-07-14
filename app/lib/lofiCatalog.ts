/**
 * Containment Lo-Fi catalog — free/royalty-friendly remote streams + comedy titles.
 *
 * WHAT: Protocol-mapped track list with direct HTTP MP3s and attribution.
 * WHY: In-app ambient without shipping copyrighted commercial lo-fi.
 * CONSENT: Music is never consent, Soft Signal, or a skill score.
 * NEVER: Bundle unlicensed audio; hide attribution for CC-BY works.
 * SEE: docs/CONTAINMENT_LOFI.md
 */

export const LOFI_CATALOG_VERSION = 1 as const;

export type LofiProtocolId =
  | "hub"
  | "spooning"
  | "morning"
  | "cathedral"
  | "masochist"
  | "conflict"
  | "soft_signal";

export type LofiTrack = {
  id: string;
  /** Comedy canon title (ours) */
  canonTitle: string;
  protocolId: LofiProtocolId;
  protocolLabel: string;
  vibe: string;
  /** Real underlying work title */
  sourceTitle: string;
  artist: string;
  /** Direct streamable URL (must be HTTPS) */
  uri: string;
  license: string;
  attribution: string;
  homepage: string;
};

/**
 * Kevin MacLeod (incompetech.com) tracks — CC BY 4.0.
 * Licensed under Creative Commons: By Attribution 4.0 License
 * http://creativecommons.org/licenses/by/4.0/
 */
const INCOMPETECH = "https://incompetech.com/music/royalty-free/mp3-royaltyfree";

export const LOFI_TRACKS: readonly LofiTrack[] = [
  {
    id: "hub-wallpaper",
    canonTitle: "Option A (Keep Building)",
    protocolId: "hub",
    protocolLabel: "Containment Hub",
    vibe: "Lobby jazz-ish · open laptop · rain-adjacent calm",
    sourceTitle: "Wallpaper",
    artist: "Kevin MacLeod",
    uri: `${INCOMPETECH}/Wallpaper.mp3`,
    license: "CC BY 4.0",
    attribution:
      "Wallpaper by Kevin MacLeod (incompetech.com) — CC BY 4.0",
    homepage: "https://incompetech.com/",
  },
  {
    id: "spoon-dreams",
    canonTitle: "Safety Spoon in D♭",
    protocolId: "spooning",
    protocolLabel: "Spooning Protocol",
    vibe: "Velvet hold · blanket prison · soft body",
    sourceTitle: "Dreams Become Real",
    artist: "Kevin MacLeod",
    uri: `${INCOMPETECH}/Dreams%20Become%20Real.mp3`,
    license: "CC BY 4.0",
    attribution:
      "Dreams Become Real by Kevin MacLeod (incompetech.com) — CC BY 4.0",
    homepage: "https://incompetech.com/",
  },
  {
    id: "morning-easy",
    canonTitle: "Gremlin Needs 8 Minutes",
    protocolId: "morning",
    protocolLabel: "Morning Cuddle",
    vibe: "Half-awake · pre-coffee · Exit Protocol ok",
    sourceTitle: "Easy Lemon",
    artist: "Kevin MacLeod",
    uri: `${INCOMPETECH}/Easy%20Lemon.mp3`,
    license: "CC BY 4.0",
    attribution:
      "Easy Lemon by Kevin MacLeod (incompetech.com) — CC BY 4.0",
    homepage: "https://incompetech.com/",
  },
  {
    id: "cathedral-gymnopedie",
    canonTitle: "Care-Seeker Is Strength",
    protocolId: "cathedral",
    protocolLabel: "Attachment Repair Cathedral",
    vibe: "Soft church of piano · mommy issues · soft land",
    sourceTitle: "Gymnopedie No 1",
    artist: "Kevin MacLeod",
    uri: `${INCOMPETECH}/Gymnopedie%20No%201.mp3`,
    license: "CC BY 4.0",
    attribution:
      "Gymnopedie No 1 by Kevin MacLeod (incompetech.com) — CC BY 4.0",
    homepage: "https://incompetech.com/",
  },
  {
    id: "masochist-slowburn",
    canonTitle: "Edge Is Capped",
    protocolId: "masochist",
    protocolLabel: "Emotional Masochist Circuit",
    vibe: "Low burn · no growth-porn drops · soft land required",
    sourceTitle: "Slow Burn",
    artist: "Kevin MacLeod",
    uri: `${INCOMPETECH}/Slow%20Burn.mp3`,
    license: "CC BY 4.0",
    attribution:
      "Slow Burn by Kevin MacLeod (incompetech.com) — CC BY 4.0",
    homepage: "https://incompetech.com/",
  },
  {
    id: "conflict-space",
    canonTitle: "Court Summons (Lo-Fi Edit)",
    protocolId: "conflict",
    protocolLabel: "Conflict Navigation Sim",
    vibe: "Steady · practice room · not a prosecutor brief",
    sourceTitle: "Space Jazz",
    artist: "Kevin MacLeod",
    uri: `${INCOMPETECH}/Space%20Jazz.mp3`,
    license: "CC BY 4.0",
    attribution:
      "Space Jazz by Kevin MacLeod (incompetech.com) — CC BY 4.0",
    homepage: "https://incompetech.com/",
  },
  {
    id: "soft-floating",
    canonTitle: "No TED Talk Required",
    protocolId: "soft_signal",
    protocolLabel: "Soft Signal / aftercare",
    vibe: "Wide calm · exit · you are free",
    sourceTitle: "Floating Cities",
    artist: "Kevin MacLeod",
    uri: `${INCOMPETECH}/Floating%20Cities.mp3`,
    license: "CC BY 4.0",
    attribution:
      "Floating Cities by Kevin MacLeod (incompetech.com) — CC BY 4.0",
    homepage: "https://incompetech.com/",
  },
  {
    id: "hub-carefree",
    canonTitle: "Option A B-Side",
    protocolId: "hub",
    protocolLabel: "Containment Hub",
    vibe: "Secondary lobby loop · slightly brighter",
    sourceTitle: "Carefree",
    artist: "Kevin MacLeod",
    uri: `${INCOMPETECH}/Carefree.mp3`,
    license: "CC BY 4.0",
    attribution:
      "Carefree by Kevin MacLeod (incompetech.com) — CC BY 4.0",
    homepage: "https://incompetech.com/",
  },
] as const;

export function findLofiTrack(id: string): LofiTrack | null {
  return LOFI_TRACKS.find((t) => t.id === id) ?? null;
}

export function tracksForProtocol(
  protocolId: LofiProtocolId,
): readonly LofiTrack[] {
  return LOFI_TRACKS.filter((t) => t.protocolId === protocolId);
}

export function defaultTrackForProtocol(
  protocolId: LofiProtocolId,
): LofiTrack {
  return tracksForProtocol(protocolId)[0] ?? LOFI_TRACKS[0]!;
}

export function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return 0.35;
  return Math.max(0, Math.min(1, v));
}

export function nextTrackId(
  currentId: string,
  catalog: readonly LofiTrack[] = LOFI_TRACKS,
): string {
  if (catalog.length === 0) return currentId;
  const i = catalog.findIndex((t) => t.id === currentId);
  if (i < 0) return catalog[0]!.id;
  return catalog[(i + 1) % catalog.length]!.id;
}

export function prevTrackId(
  currentId: string,
  catalog: readonly LofiTrack[] = LOFI_TRACKS,
): string {
  if (catalog.length === 0) return currentId;
  const i = catalog.findIndex((t) => t.id === currentId);
  if (i < 0) return catalog[0]!.id;
  return catalog[(i - 1 + catalog.length) % catalog.length]!.id;
}
