/**
 * Catalog for the full Touch Language system.
 * Platonic, trauma-informed labels — never clinical diagnosis language.
 */

export const PRESSURE_OPTIONS = [
  {
    id: "light",
    label: "Feather-light",
    detail: "Barely there contact, easy to miss if you are not paying attention",
  },
  {
    id: "medium",
    label: "Comfortably gentle",
    detail: "Clear contact without heavy weight",
  },
  {
    id: "firm",
    label: "Steady and grounding",
    detail: "Solid presence that still stays kind",
  },
] as const;

export const SPEED_OPTIONS = [
  {
    id: "slow",
    label: "Very slow",
    detail: "Unhurried, predictable, room to breathe",
  },
  {
    id: "unhurried",
    label: "Unhurried",
    detail: "Natural pace without rush",
  },
  {
    id: "moderate",
    label: "Moderate",
    detail: "Ordinary social tempo",
  },
  {
    id: "brisk",
    label: "Brisk but kind",
    detail: "Quicker contact that still signals clearly",
  },
] as const;

export const DURATION_OPTIONS = [
  {
    id: "brief",
    label: "A brief hello",
    detail: "A few seconds is often enough",
  },
  {
    id: "few_minutes",
    label: "A few quiet minutes",
    detail: "A short settled window",
  },
  {
    id: "decide_together",
    label: "Let’s decide together",
    detail: "Check in as you go — no fixed clock",
  },
] as const;

export const ENVIRONMENT_OPTIONS = [
  {
    id: "public_calm",
    label: "A calm public place",
    detail: "Soft ambient noise, other people nearby",
  },
  {
    id: "outdoors",
    label: "Somewhere outdoors",
    detail: "Air, sky, space to step away",
  },
  {
    id: "hosted_community",
    label: "A hosted community space",
    detail: "Facilitated or familiar venue",
  },
] as const;

export const HOLD_TYPE_OPTIONS = [
  { id: "side_by_side", label: "Side-by-side presence", detail: "Sitting or standing beside" },
  { id: "hand_holding", label: "Hand holding", detail: "Hands only, clear start and end" },
  { id: "shoulder_squeeze", label: "Shoulder squeeze", detail: "Brief, solid, then release" },
  { id: "upper_back_rest", label: "Hand on upper back", detail: "Resting contact, not a full hug" },
  { id: "side_hug", label: "Side hug", detail: "One-arm, no full enclosure" },
  { id: "guided_walk", label: "Guided walk contact", detail: "Elbow or forearm while walking" },
  { id: "forearm_rest", label: "Forearm rest", detail: "Light resting contact while seated" },
  { id: "no_hold", label: "No holds — presence only", detail: "Nearness without gripping" },
] as const;

export type ZoneGroup = "upper" | "core" | "lower";

export const BODY_ZONES = [
  {
    id: "hands",
    label: "Hands",
    detail: "Holding, resting, brief contact",
    group: "upper" as const,
  },
  {
    id: "arms",
    label: "Arms / forearms",
    detail: "Side-by-side, guiding, light rest",
    group: "upper" as const,
  },
  {
    id: "shoulders",
    label: "Shoulders",
    detail: "Squeeze, lean, side-hug contact",
    group: "upper" as const,
  },
  {
    id: "upper_back",
    label: "Upper back",
    detail: "Pat or resting hand",
    group: "upper" as const,
  },
  {
    id: "neck",
    label: "Neck / nape",
    detail: "Often sensitive — many mark ask-first or off",
    group: "upper" as const,
  },
  {
    id: "head_scalp",
    label: "Head / scalp (not face)",
    detail: "Top of head or hair — not face or jaw",
    group: "upper" as const,
  },
  {
    id: "face",
    label: "Face / jaw",
    detail: "Usually off limits for platonic sessions",
    group: "upper" as const,
  },
  {
    id: "torso",
    label: "Torso / midsection",
    detail: "Side of ribs or mid-back only if welcomed",
    group: "core" as const,
  },
  {
    id: "lower_back",
    label: "Lower back",
    detail: "Often ask-first even when upper back is okay",
    group: "core" as const,
  },
  {
    id: "hips_outer",
    label: "Outer hips / waist (side)",
    detail: "Side-of-body only — never assumed",
    group: "core" as const,
  },
  {
    id: "legs",
    label: "Legs (outer thigh / calf)",
    detail: "Seated side-by-side if ever welcomed",
    group: "lower" as const,
  },
  {
    id: "feet",
    label: "Feet",
    detail: "Rare for many; fine to leave off limits",
    group: "lower" as const,
  },
] as const;

export const ZONE_GROUPS: Array<{
  id: ZoneGroup;
  title: string;
  summary: string;
}> = [
  {
    id: "upper",
    title: "Upper body & head",
    summary: "Hands through shoulders, back, neck, head, face.",
  },
  {
    id: "core",
    title: "Core & midsection",
    summary: "Torso, lower back, outer hips — often more protected.",
  },
  {
    id: "lower",
    title: "Legs & feet",
    summary: "Optional; many people keep these off limits.",
  },
];

export const HARD_LIMIT_PRESETS = [
  "Face / head contact",
  "Neck contact",
  "Front of torso / chest",
  "Hips or waist grip",
  "Legs / thighs",
  "Any surprise touch",
  "Approach from behind",
  "Tickling or sudden pressure",
  "Photos or recording of touch",
  "Sessions involving alcohol for me",
  "Full frontal hug enclosure",
  "Holding that traps or restrains",
] as const;

export const SOFT_LIMIT_PRESETS = [
  "Long holds without a check-in",
  "Talking while touching",
  "Silence while touching",
  "Public places with many strangers",
  "Being watched by others during contact",
  "Fast tempo even when pressure is light",
  "More than a few minutes without a pause",
  "Contact when I am already peopled-out",
  "New people without a long warm-up chat",
  "Touch right after conflict or stress",
] as const;

export const BOUNDARY_STATUS_OPTIONS = [
  {
    id: "welcomed",
    label: "Welcomed",
    detail: "Usually okay if we both confirm in the session",
    colorKey: "moss" as const,
  },
  {
    id: "ask_first",
    label: "Ask first",
    detail: "Only with a clear, fresh ask in the moment",
    colorKey: "amber" as const,
  },
  {
    id: "soft_limit",
    label: "Soft limit",
    detail: "Usually avoid — only with extra care and an easy out",
    colorKey: "plum" as const,
  },
  {
    id: "off_limits",
    label: "Hard limit / off limits",
    detail: "Not available. Silence here still means no.",
    colorKey: "signal" as const,
  },
] as const;

export type PressureId = (typeof PRESSURE_OPTIONS)[number]["id"];
export type SpeedId = (typeof SPEED_OPTIONS)[number]["id"];
export type DurationId = (typeof DURATION_OPTIONS)[number]["id"];
export type EnvironmentId = (typeof ENVIRONMENT_OPTIONS)[number]["id"];
export type HoldTypeId = (typeof HOLD_TYPE_OPTIONS)[number]["id"];
export type ZoneId = (typeof BODY_ZONES)[number]["id"];
export type BoundaryStatusId = (typeof BOUNDARY_STATUS_OPTIONS)[number]["id"];
