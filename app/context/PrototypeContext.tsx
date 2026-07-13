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

/** Local-only boundary language for the phone-visible demo path. */
export type BoundaryStatus = "welcomed" | "ask_first" | "off_limits";

export type DemoBodyZoneGroup = "upper" | "core" | "lower";

/**
 * Expanded platonic body-zone map for onboarding.
 * Unlisted areas stay off limits. Never sexual framing.
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

/** Absolute no-go tags (reinforce off limits; local demo only). */
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

type PrototypeState = {
  answers: AnswerScores[];
  archetypeId: ArchetypeId;
  selectedProfileId: string;
  touchChoices: Record<string, string>;
  bodyBoundaries: Partial<Record<DemoBodyZoneId, BoundaryStatus>>;
  hardStops: DemoHardStopId[];
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

export function PrototypeProvider({ children }: PropsWithChildren) {
  const [answers, setAnswers] = useState<AnswerScores[]>([]);
  const [selectedProfileId, selectProfile] = useState("maya");
  const [touchChoices, setTouchChoices] = useState<Record<string, string>>({});
  const [bodyBoundaries, setBodyBoundaries] = useState<
    Partial<Record<DemoBodyZoneId, BoundaryStatus>>
  >({});
  const [hardStops, setHardStops] = useState<DemoHardStopId[]>([]);
  const [boundaryNote, setBoundaryNote] = useState("");
  const [aboutYou, setAboutYouState] = useState<AboutYouAnswers>(
    initialAboutYouAnswers,
  );
  const value = useMemo<PrototypeState>(
    () => ({
      answers,
      archetypeId: scoreQuiz(answers),
      selectedProfileId,
      touchChoices,
      bodyBoundaries,
      hardStops,
      boundaryNote,
      aboutYou,
      setAnswer: (answer) =>
        setAnswers((current) => [
          ...current.filter((item) => item.questionId !== answer.questionId),
          answer,
        ]),
      hydrateAnswers: setAnswers,
      resetQuiz: () => setAnswers([]),
      selectProfile,
      setTouchChoice: (key, choice) =>
        setTouchChoices((current) => ({ ...current, [key]: choice })),
      setBodyBoundary: (zone, status) =>
        setBodyBoundaries((current) => ({ ...current, [zone]: status })),
      setAllBodyBoundaries: (status) =>
        setBodyBoundaries(
          Object.fromEntries(
            demoBodyZones.map((zone) => [zone.id, status]),
          ) as Record<DemoBodyZoneId, BoundaryStatus>,
        ),
      setUnsetBodyBoundaries: (status) =>
        setBodyBoundaries((current) => {
          const next = { ...current };
          for (const zone of demoBodyZones) {
            if (!next[zone.id]) next[zone.id] = status;
          }
          return next;
        }),
      toggleHardStop: (id) =>
        setHardStops((current) =>
          current.includes(id)
            ? current.filter((item) => item !== id)
            : [...current, id],
        ),
      setBoundaryNote,
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
export function usePrototype() {
  const value = useContext(Context);
  if (!value)
    throw new Error("usePrototype must be used within PrototypeProvider");
  return value;
}
