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
import { archetypes } from "../../data/quiz";
import { scoreQuizDetailed, topInsights } from "../../lib/quizScoring";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function ResultScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { answers, archetypeId } = usePrototype();
  const result = useMemo(() => scoreQuizDetailed(answers), [answers]);
  const vibe = archetypes[result.primary || archetypeId];
  const insights = topInsights(result, 3);

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

      {insights.length > 0 ? (
        <Card>
          <Text style={styles.sectionLabel}>A few notes from your answers</Text>
          <View style={styles.insightList}>
            {insights.map((insight) => (
              <Text
                key={`${insight.questionId}:${insight.answerId}`}
                style={styles.insightText}
              >
                · {insight.text}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}

      <Body muted center>
        People are more nuanced than profiles. This is a light invitation to
        notice—not a diagnosis or a promise. A vibe never grants consent.
      </Body>
      <Button
        label="Keep this Vibe Profile"
        onPress={() => router.push("/profile/vibe")}
      />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
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
