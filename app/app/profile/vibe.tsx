import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { VibeCard } from "../../components/VibeCard";
import { usePrototype } from "../../context/PrototypeContext";
import { runQuizModel } from "../../lib/quizScoring";
import { useAuth } from "../../context/AuthContext";
import { profileRepository } from "../../services/profileRepository";

export default function VibeProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { answers, archetypeId, resetQuiz } = usePrototype();
  const result = useMemo(() => runQuizModel(answers), [answers]);

  const retake = () => {
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
        Built from up to 100 light scenes with a multi-theme mix model (
        {result.modelVersion}). Still only a conversation starter — never
        consent. Sharing is not enabled in this prototype.
      </Body>
      <Button
        label="Name my touch language"
        onPress={() => router.push("/onboarding/touch-language")}
      />
      <Button
        label="Retake the 100-question vibe quiz"
        variant="secondary"
        onPress={retake}
      />
    </Screen>
  );
}
