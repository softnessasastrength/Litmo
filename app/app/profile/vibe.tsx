import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { VibeCard } from "../../components/VibeCard";
import { usePrototype } from "../../context/PrototypeContext";
import { runQuizModel } from "../../lib/quizScoring";
import { useAuth } from "../../context/AuthContext";
import { profileRepository } from "../../services/profileRepository";
import { quizCatalog } from "../../data/quizCatalog";

export default function VibeProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { answers, archetypeId, resetQuiz } = usePrototype();
  const result = useMemo(() => runQuizModel(answers), [answers]);
  const vibeCount = quizCatalog.filter((q) => q.family === "vibe").length;
  const selfCount = quizCatalog.filter((q) => q.family === "self").length;

  const retakeOnboarding = () => {
    resetQuiz();
    if (user) {
      void profileRepository
        .saveProgress(user.id, "vibe_quiz", {
          quizAnswers: [],
          questionIndex: 0,
        })
        .catch(() => undefined);
    }
    router.push("/onboarding/quiz");
  };

  return (
    <Screen>
      <Eyebrow>YOUR CARD</Eyebrow>
      <Title>A little shorthand for your social weather.</Title>
      <VibeCard
        archetypeId={result.primary || archetypeId}
        secondaryId={result.isCloseBlend ? result.secondary : null}
        blendLabel={result.blendLabel}
        showHowYouMightShowUp
      />
      <Body muted>
        Built from your scenes with a multi-theme mix model ({result.modelVersion}
        ). Still only a conversation starter — never consent. Onboarding may use
        Short or Deep; the full catalog lives under Quizzes.
      </Body>
      <Body muted>
        Available now: {vibeCount} Vibe depths (Short ~10 · Deep 100) and{" "}
        {selfCount} self quizzes. Open the hub anytime.
      </Body>
      <Button
        label="Name my touch language"
        onPress={() => router.push("/onboarding/touch-language")}
      />
      <Button
        label="Open Quizzes hub"
        variant="secondary"
        onPress={() => router.push("/(tabs)/quizzes" as never)}
        accessibilityHint="Short and deep Vibe plus Soft Capacity, Boundary Voice, Comfort and Care, Connection Pace"
      />
      <Button
        label="Start Short Vibe (~10)"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/quizzes/play",
            params: { quizId: "vibe-short" },
          } as never)
        }
      />
      <Button
        label="Start Deep Vibe (100 scenes)"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/quizzes/play",
            params: { quizId: "vibe-deep" },
          } as never)
        }
      />
      <Button
        label="Retake onboarding vibe path"
        variant="secondary"
        onPress={retakeOnboarding}
        accessibilityHint="Restarts the onboarding quiz (short in demo or ND Mode, deep for real accounts)"
      />
    </Screen>
  );
}
