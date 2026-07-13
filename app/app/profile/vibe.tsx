import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { VibeCard } from "../../components/VibeCard";
import { usePrototype } from "../../context/PrototypeContext";
import { scoreQuizDetailed } from "../../lib/quizScoring";

export default function VibeProfileScreen() {
  const router = useRouter();
  const { answers, archetypeId } = usePrototype();
  const result = useMemo(() => scoreQuizDetailed(answers), [answers]);
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
        This card is designed to feel shareable, but sharing is not enabled in
        this prototype. Your vibe may suggest conversation—not consent.
      </Body>
      <Button
        label="Name my touch language"
        onPress={() => router.push("/onboarding/touch-language")}
      />
    </Screen>
  );
}
