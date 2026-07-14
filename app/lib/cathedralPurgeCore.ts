/**
 * The Cathedral Purge — the ritualized, escalating "delete everything" gate
 * sequence.
 *
 * WHAT: Pure sequencing/copy/confirmation logic for a one-way, linear ritual
 *   (not resumable or freely-navigable like the two guided rituals — an
 *   irreversible action does not get a step-chip menu to jump around in).
 *   Every gate but the final execution step can be cancelled; Soft Signal's
 *   own law — "you can always stop, no explanation" — applies here at
 *   maximum stakes, not just inside a session.
 * WHY: The urge this exists for — "burn it all down, disappear, get there
 *   before she leaves" — is real and will happen with or without a
 *   deliberate container for it. This ritual doesn't stop the urge; it
 *   makes sure the urge survives contact with a little friction and a
 *   little truth before anything irreversible happens. See
 *   docs/CATHEDRAL_PURGE.md, docs/REAL_PURPOSE.md.
 * CONSENT: Naming a reason is never required — "none of these" / declining
 *   is always valid, matching this app's house style everywhere else. The
 *   typed confirmation phrase exists to prevent an accidental or dissociated
 *   tap from being mistaken for a decision, not to interrogate the user.
 * EDGE CASES: The countdown can be cancelled at any point up to the instant
 *   execution begins. Execution itself (calling the existing, real
 *   privacyService.wipeLocal() / requestErasure()) is not re-litigated here
 *   — this file only decides *whether* the user has actually reached that
 *   point on purpose.
 * NEVER: Invent a new deletion mechanism — reuses privacyService.wipeLocal
 *   and privacyService.requestErasure exactly as they already exist and
 *   are already used by app/app/privacy/delete-data.tsx. Auto-advance any
 *   gate without an explicit user action. Treat "no reason given" as a
 *   reason to add friction elsewhere.
 * SEE: docs/CATHEDRAL_PURGE.md, app/services/privacyService.ts,
 *   app/services/cathedralSealStore.ts, app/services/localDataInventory.ts.
 */

export const CATHEDRAL_PURGE_VERSION = 1 as const;

export type PurgeGateId =
  | "intro"
  | "remove_seal"
  | "name_it"
  | "last_look"
  | "typed_confirmation"
  | "countdown"
  | "executing"
  | "done";

/** Strict linear order. No step-chip navigation — this is not a guided ritual. */
export const PURGE_GATE_ORDER: readonly PurgeGateId[] = [
  "intro",
  "remove_seal",
  "name_it",
  "last_look",
  "typed_confirmation",
  "countdown",
  "executing",
  "done",
];

export type PurgeGate = {
  id: PurgeGateId;
  title: string;
  /** Dungeon-master narration for this gate. */
  voiceLine: string;
  /** Whether Cancel/walk-away is offered on this screen. False only once execution starts. */
  cancelable: boolean;
};

export const PURGE_GATES: readonly PurgeGate[] = [
  {
    id: "intro",
    title: "You found the door.",
    voiceLine:
      "This isn't hidden by accident, and it isn't hidden well, either — you had to actually go looking for it. Good. That's the only gate that matters more than the rest of them combined. Everything past this point is real. Nothing past this point is a trick to talk you out of it. It's just going to be slow enough that you're still you when it's done.",
    cancelable: true,
  },
  {
    id: "remove_seal",
    title: "Take off the seal.",
    voiceLine:
      "Somewhere on this device is a small, quiet thing marking you as bonded to this place. Not a password. Not your account. Just a timestamp that says you were here on purpose. Taking it off is the first real thing that happens tonight — not a UI animation, an actual removal. You can still walk away after this. This isn't the point of no return. It's just the first true thing.",
    cancelable: true,
  },
  {
    id: "name_it",
    title: "What's actually happening right now?",
    voiceLine:
      "You don't have to answer this. Nothing downstream checks your answer, grades it, or unlocks based on it. But if you know what's actually moving through you right now, naming it costs you nothing and sometimes changes what you do next. If it doesn't, that's real information too.",
    cancelable: true,
  },
  {
    id: "last_look",
    title: "Here's what actually exists.",
    voiceLine:
      "Before anything is gone, here's the honest inventory — not to guilt you into staying, just so you're not guessing what you're about to lose. You can export a copy right now. You can also just look at it and still choose to burn it. Both are allowed.",
    cancelable: true,
  },
  {
    id: "typed_confirmation",
    title: "Say it on purpose.",
    voiceLine:
      "Type the phrase exactly. Not because the words are magic — because typing something on purpose is a different act than tapping a button your thumb found on its own at 3am. This is the part that makes sure a decision made it here, not just a reflex.",
    cancelable: true,
  },
  {
    id: "countdown",
    title: "This is the only clock in the whole cathedral that counts down instead of up.",
    voiceLine:
      "Nothing happens until it hits zero. You can stop it any time before that, for any reason or none, and that is not failure — that's the same freedom this whole app has protected since the first Soft Signal button. If you let it run out, that's a real choice too.",
    cancelable: true,
  },
  {
    id: "executing",
    title: "It's happening.",
    voiceLine: "No narration for this part. It's just happening now.",
    cancelable: false,
  },
  {
    id: "done",
    title: "It's done. You're still here.",
    voiceLine:
      "No badge. No score. Nobody's proud of you and nobody's disappointed in you — that was never what this was for. The device is clear. If you asked for the account erasure too, that request is real and recorded, and a human will actually act on it — it wasn't a silent instant thing, and it was never going to pretend to be. Whatever happens next, it starts from here, and here is allowed to be quiet.",
    cancelable: false,
  },
] as const;

export function findPurgeGate(id: PurgeGateId): PurgeGate {
  return PURGE_GATES.find((g) => g.id === id) ?? PURGE_GATES[0]!;
}

/** Strict forward-only progression. Returns null after the final gate. */
export function nextPurgeGate(current: PurgeGateId): PurgeGateId | null {
  const idx = PURGE_GATE_ORDER.indexOf(current);
  if (idx === -1 || idx === PURGE_GATE_ORDER.length - 1) return null;
  return PURGE_GATE_ORDER[idx + 1]!;
}

export type PurgeReasonId =
  | "want_to_disappear"
  | "ashamed"
  | "leave_before_she_does"
  | "need_control"
  | "none_of_these";

export const PURGE_REASON_OPTIONS: readonly { id: PurgeReasonId; label: string }[] = [
  { id: "want_to_disappear", label: "I want to disappear for a while" },
  { id: "ashamed", label: "I'm ashamed of all of this existing" },
  { id: "leave_before_she_does", label: "I want to leave before she does" },
  { id: "need_control", label: "I need control over something, and this is something" },
  { id: "none_of_these", label: "None of these / I don't know" },
] as const;

/** The exact phrase the user must type to proceed past confirmation. */
export const PURGE_CONFIRMATION_PHRASE = "I release this, not in anger.";

/** Case/whitespace-tolerant match — the point is a deliberate act, not a spelling test. */
export function purgeConfirmationMatches(typed: string): boolean {
  return (
    typed.trim().toLowerCase() === PURGE_CONFIRMATION_PHRASE.toLowerCase()
  );
}

export const PURGE_COUNTDOWN_SECONDS = 20;
