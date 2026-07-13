import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  FadeIn,
  Screen,
  Title,
} from "../../components/ui";
import { VibeCard } from "../../components/VibeCard";
import { usePrototype } from "../../context/PrototypeContext";
import { archetypes, quizDimensionLabels } from "../../data/quiz";
import { scoreQuizDetailed, topInsights } from "../../lib/quizScoring";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function ResultScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { answers, archetypeId } = usePrototype();
  const result = useMemo(() => scoreQuizDetailed(answers), [answers]);
  const vibe = archetypes[result.primary || archetypeId];
  const insights = topInsights(result, 5);

  return (
    <Screen>
      <FadeIn>
        <Eyebrow>A SMALL REVEAL</Eyebrow>
        <Title>{vibe.name}</Title>
        <Body>{vibe.description}</Body>
      </FadeIn>

      <VibeCard
        archetypeId={result.primary}
        secondaryId={result.isCloseBlend ? result.secondary : null}
        blendLabel={result.blendLabel}
        showHowYouMightShowUp
      />

      <Card>
        <Text style={styles.meta}>
          {result.answeredCount} of {result.questionCount} scenes ·{" "}
          {result.themesTouched} themes touched
        </Text>
        {insights.length > 0 ? (
          <View style={styles.insightList}>
            <Text style={styles.sectionLabel}>A few notes (not all 100)</Text>
            {insights.map((insight) => (
              <Text
                key={`${insight.questionId}:${insight.answerId}`}
                style={styles.insightText}
              >
                · {quizDimensionLabels[insight.dimension]}: {insight.text}
              </Text>
            ))}
          </View>
        ) : (
          <Body muted>
            Answer a few scenes to see light notes here. Partial quizzes still
            score what you finished.
          </Body>
        )}
      </Card>

      <Body muted center>
        People are more nuanced than any quiz — even a long playful one. This is
        not a diagnosis, ranking, or consent. A vibe never grants touch.
      </Body>
      <Button
        label="Keep this Vibe Profile"
        onPress={() => router.push("/profile/vibe")}
      />
      <Button
        label="Change answers"
        variant="secondary"
        onPress={() => router.replace("/onboarding/quiz")}
      />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    meta: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600" as const,
      marginBottom: 10,
    },
    sectionLabel: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 20,
      marginBottom: 8,
    },
    insightList: { gap: 8 },
    insightText: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  };
}
