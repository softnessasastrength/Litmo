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
        secondaryId={result.secondary}
        blendLabel={result.blendLabel}
        showHowYouMightShowUp
      />

      {insights.length > 0 ? (
        <Card>
          <Text style={styles.sectionLabel}>Patterns you leaned toward</Text>
          <Body muted>
            Drawn from your answers across place, pacing, sensory comfort, play,
            and repair—not a diagnosis.
          </Body>
          <View style={styles.insightList}>
            {insights.map((insight) => (
              <View
                key={`${insight.questionId}:${insight.answerId}`}
                style={styles.insightRow}
              >
                <Text style={styles.insightDim}>
                  {quizDimensionLabels[insight.dimension]}
                </Text>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionLabel}>Score weather</Text>
        <Body muted>
          Playful weights only ({result.answeredCount} of {result.questionCount}{" "}
          questions answered in this pass). Higher is not better.
        </Body>
        <View style={styles.scoreRow}>
          {(Object.keys(archetypes) as Array<keyof typeof archetypes>).map(
            (id) => (
              <View key={id} style={styles.scoreChip}>
                <Text style={styles.scoreName}>
                  {archetypes[id].name.replace(/^The\s+/, "")}
                </Text>
                <Text style={styles.scoreValue}>{result.totals[id]}</Text>
              </View>
            ),
          )}
        </View>
      </Card>

      <Body muted center>
        People are more nuanced than profiles. This is an invitation to
        notice—not a diagnosis, a ranking, or a promise of compatibility. A vibe
        never grants consent.
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
      fontSize: 22,
      marginBottom: 6,
    },
    insightList: { gap: 12, marginTop: 12 },
    insightRow: { gap: 4 },
    insightDim: {
      color: colors.plum,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    insightText: { color: colors.ink, fontSize: 15, lineHeight: 22 },
    scoreRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 12,
    },
    scoreChip: {
      minWidth: 96,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
    },
    scoreName: { color: colors.muted, fontSize: 12, fontWeight: "700" },
    scoreValue: {
      color: colors.ink,
      fontSize: 22,
      fontWeight: "800",
      marginTop: 2,
    },
  };
}
