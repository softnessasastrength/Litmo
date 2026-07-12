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

export const demoBodyZones = [
  { id: "hands", label: "Hands / arms" },
  { id: "shoulders", label: "Shoulders" },
  { id: "upper_back", label: "Upper back" },
  { id: "torso", label: "Torso / midsection" },
] as const;

export type DemoBodyZoneId = (typeof demoBodyZones)[number]["id"];

type PrototypeState = {
  answers: AnswerScores[];
  archetypeId: ArchetypeId;
  selectedProfileId: string;
  touchChoices: Record<string, string>;
  bodyBoundaries: Partial<Record<DemoBodyZoneId, BoundaryStatus>>;
  aboutYou: AboutYouAnswers;
  setAnswer: (answer: AnswerScores) => void;
  hydrateAnswers: (answers: AnswerScores[]) => void;
  resetQuiz: () => void;
  selectProfile: (id: string) => void;
  setTouchChoice: (key: string, value: string) => void;
  setBodyBoundary: (zone: DemoBodyZoneId, status: BoundaryStatus) => void;
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
      setAboutYou: (patch) =>
        setAboutYouState((current) => ({ ...current, ...patch })),
    }),
    [answers, selectedProfileId, touchChoices, bodyBoundaries, aboutYou],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePrototype() {
  const value = useContext(Context);
  if (!value)
    throw new Error("usePrototype must be used within PrototypeProvider");
  return value;
}
