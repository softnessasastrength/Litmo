import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ArchetypeId } from "../data/quiz";
import type { AnswerScores } from "../lib/quizScoring";
import { scoreQuiz } from "../lib/quizScoring";
import { initialAboutYouAnswers, type AboutYouAnswers } from "../data/aboutYou";

/**
 * Local-only boundary language for the phone-visible demo path and onboarding UI.
 * Product meanings:
 * - welcomed — usually okay IF both confirm in a future session snapshot
 * - ask_first — only with a clear, fresh ask in the moment
 * - off_limits — not available; silence still means no
 * Fail-closed: unset zones are treated as off_limits by consumers (boundaries review).
 * NEVER: A status alone grants partner touch or seals Consent Snapshot.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §9.2 · onboard_boundary_zone
 */
export type BoundaryStatus = "welcomed" | "ask_first" | "off_limits";

/** Body map section keys used by boundaries onboarding steps. */
export type DemoBodyZoneGroup = "upper" | "core" | "lower";

/**
 * Expanded platonic body-zone map for onboarding (12 named zones).
 * Unlisted body areas stay off limits by product law.
 * NEVER: Sexual framing; auto-flip off_limits to welcomed from match/vibe/prior.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §9 · onboard_boundary_zone
 */
export const demoBodyZones = [
  {
    id: "hands",
    label: "Hands",
    detail: "Holding, resting, or brief contact",
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
    detail: "Squeeze, lean, side hug contact",
    group: "upper" as const,
  },
  {
    id: "upper_back",
    label: "Upper back",
    detail: "Pat, rest of a hand, side hug",
    group: "upper" as const,
  },
  {
    id: "neck",
    label: "Neck / nape",
    detail: "Often sensitive — many people mark ask-first or off",
    group: "upper" as const,
  },
  {
    id: "head_scalp",
    label: "Head / scalp (not face)",
    detail: "Top of head or hair — not face or jaw",
    group: "upper" as const,
  },
  {
    id: "torso",
    label: "Torso / midsection",
    detail: "Side of ribs or mid back only if welcomed",
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
    detail: "Seated side-by-side contact if ever welcomed",
    group: "lower" as const,
  },
  {
    id: "feet",
    label: "Feet",
    detail: "Rare for many; fine to leave off limits",
    group: "lower" as const,
  },
  {
    id: "face",
    label: "Face / jaw",
    detail: "Usually off limits for platonic sessions",
    group: "upper" as const,
  },
] as const;

export type DemoBodyZoneId = (typeof demoBodyZones)[number]["id"];

/**
 * Absolute no-go tags (reinforce off limits; local demo / prepare inputs).
 * Hard stops win over welcomed zones in product semantics.
 * NEVER: Selecting zero hard stops means “open to everything” — unset zones still off limits.
 * SEE: onboard_boundary_hard_stop · docs/ONBOARDING_CONSENT_FLOW.md §9.4
 */
export const demoHardStopOptions = [
  { id: "face", label: "Face / head contact" },
  { id: "neck", label: "Neck" },
  { id: "torso_front", label: "Front of torso / chest" },
  { id: "hips", label: "Hips / waist grip" },
  { id: "legs", label: "Legs / thighs" },
  { id: "surprise", label: "Any surprise touch" },
  { id: "from_behind", label: "Approach from behind" },
  { id: "tickling", label: "Tickling or sudden pressure" },
  { id: "photos", label: "Photos or recording of touch" },
  { id: "alcohol", label: "Sessions involving alcohol for me" },
] as const;

export type DemoHardStopId = (typeof demoHardStopOptions)[number]["id"];

/**
 * Section metadata for boundaries steps upper / core / lower.
 * Titles are UI chrome only — not consent categories.
 */
export const demoBodyZoneGroups: Array<{
  id: DemoBodyZoneGroup;
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

/**
 * In-memory prototype bag for demo + onboarding UI before/without full server profile.
 * CONSENT: Every mutator is prepare/inform storage — never dual-seal or Soft Signal.
 * Demo: process memory only (lost on kill unless other stores write).
 * Real: often mirrored via profileRepository / touchLanguageStore on later saves.
 */
type PrototypeState = {
  answers: AnswerScores[];
  archetypeId: ArchetypeId;
  selectedProfileId: string;
  touchChoices: Record<string, string>;
  bodyBoundaries: Partial<Record<DemoBodyZoneId, BoundaryStatus>>;
  hardStops: DemoHardStopId[];
  /** Private nervous-system note — NEVER log body or treat as public bio. */
  boundaryNote: string;
  aboutYou: AboutYouAnswers;
  setAnswer: (answer: AnswerScores) => void;
  hydrateAnswers: (answers: AnswerScores[]) => void;
  resetQuiz: () => void;
  selectProfile: (id: string) => void;
  setTouchChoice: (key: string, value: string) => void;
  setBodyBoundary: (zone: DemoBodyZoneId, status: BoundaryStatus) => void;
  setAllBodyBoundaries: (status: BoundaryStatus) => void;
  setUnsetBodyBoundaries: (status: BoundaryStatus) => void;
  toggleHardStop: (id: DemoHardStopId) => void;
  setBoundaryNote: (note: string) => void;
  setAboutYou: (patch: Partial<AboutYouAnswers>) => void;
};
const Context = createContext<PrototypeState | null>(null);

/**
 * WHAT: Holds local onboarding/demo prototype state (about-you, vibe answers, TL choices,
 *   body zones, hard stops, private note) for the phone-visible path.
 * WHY: Demo must work without Docker/Supabase; real onboarding still uses this bag
 *   as UI state until profile/TL stores persist.
 * CONSENT: Provider is not a consent surface. Values feed future snapshots as inputs
 *   only. Unset zones remain fail-closed off limits at product edges.
 * EDGE CASES:
 *   - Kill app in demo → memory lost (expected).
 *   - setAnswer replaces same questionId only (one answer per scene).
 *   - setUnsetBodyBoundaries fills missing only — never overwrites existing statuses.
 * NEVER: Upload private note as public bio; invent consent from empty bodyBoundaries;
 *   treat selectedProfileId / vibe as partner safety.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §2.3 · ADR 0003 · boundaries / about-you / quiz screens
 */
export function PrototypeProvider({ children }: PropsWithChildren) {
  const [answers, setAnswers] = useState<AnswerScores[]>([]);
  // Seeded fictional discovery peer for demo — not a real match or consent.
  const [selectedProfileId, selectProfile] = useState("maya");
  const [touchChoices, setTouchChoices] = useState<Record<string, string>>({});
  // Partial map: missing keys = unset = off limits at review (fail-closed consumers).
  const [bodyBoundaries, setBodyBoundaries] = useState<
    Partial<Record<DemoBodyZoneId, BoundaryStatus>>
  >({});
  const [hardStops, setHardStops] = useState<DemoHardStopId[]>([]);
  // Private note: never log content; max length enforced in UI.
  const [boundaryNote, setBoundaryNote] = useState("");
  const [aboutYou, setAboutYouState] = useState<AboutYouAnswers>(
    initialAboutYouAnswers,
  );
  const value = useMemo<PrototypeState>(
    () => ({
      answers,
      // Weather primary from scores — not safety ranking.
      archetypeId: scoreQuiz(answers),
      selectedProfileId,
      touchChoices,
      bodyBoundaries,
      hardStops,
      boundaryNote,
      aboutYou,
      // onboard_vibe_answer storage: one score row per questionId.
      setAnswer: (answer) =>
        setAnswers((current) => [
          ...current.filter((item) => item.questionId !== answer.questionId),
          answer,
        ]),
      // Real-user draft resume — replace whole answer list.
      hydrateAnswers: setAnswers,
      resetQuiz: () => setAnswers([]),
      selectProfile,
      // onboard_touch_language_* inputs — key is pressure|speed|duration|environment.
      setTouchChoice: (key, choice) =>
        setTouchChoices((current) => ({ ...current, [key]: choice })),
      // onboard_boundary_zone — prepare only; does not notify peer.
      setBodyBoundary: (zone, status) =>
        setBodyBoundaries((current) => ({ ...current, [zone]: status })),
      // Intro “Mark all ask first” — still not session consent.
      setAllBodyBoundaries: (status) =>
        setBodyBoundaries(
          Object.fromEntries(
            demoBodyZones.map((zone) => [zone.id, status]),
          ) as Record<DemoBodyZoneId, BoundaryStatus>,
        ),
      // Review escape hatch: fill only unset; preserve explicit welcomed/off_limits.
      setUnsetBodyBoundaries: (status) =>
        setBodyBoundaries((current) => {
          const next = { ...current };
          for (const zone of demoBodyZones) {
            if (!next[zone.id]) next[zone.id] = status;
          }
          return next;
        }),
      // onboard_boundary_hard_stop multi-select toggle.
      toggleHardStop: (id) =>
        setHardStops((current) =>
          current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id],
        ),
      // onboard_boundary_private_note — local; never default-share.
      setBoundaryNote,
      // about-you patches (name, age self-report, gender, orientation).
      setAboutYou: (patch) =>
        setAboutYouState((current) => ({ ...current, ...patch })),
    }),
    [
      answers,
      selectedProfileId,
      touchChoices,
      bodyBoundaries,
      hardStops,
      boundaryNote,
      aboutYou,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/**
 * WHAT: Access PrototypeProvider state; throws if used outside provider.
 * WHY: Fail loud on missing provider rather than silent empty consent-adjacent defaults.
 * CONSENT: Not a consent surface — hook access only.
 * EDGE CASES: Outside provider → throw (prevents undefined mutators).
 * NEVER: Catch and invent empty welcomed zones as defaults at call sites.
 * SEE: PrototypeProvider
 */
export function usePrototype() {
  const value = useContext(Context);
  if (!value)
    throw new Error("usePrototype must be used within PrototypeProvider");
  return value;
}
