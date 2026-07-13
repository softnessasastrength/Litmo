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
import { archetypes, type ArchetypeId } from "../../data/quiz";
import {
  confidenceCopy,
  runQuizModel,
  topInsights,
} from "../../lib/quizScoring";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function ResultScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { answers, archetypeId } = usePrototype();
  const result = useMemo(() => runQuizModel(answers), [answers]);
  const vibe = archetypes[result.primary || archetypeId];
  const insights = topInsights(result, 5);
  const mixOrder = (Object.keys(archetypes) as ArchetypeId[]).sort(
    (a, b) => result.mixPercent[b] - result.mixPercent[a],
  );

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
        <Text style={styles.sectionLabel}>Weather mix</Text>
        <Body muted>
          Playful model {result.modelVersion} — weights from your scenes, not a
          clinical profile. Higher is not better.
        </Body>
        <View style={styles.mixList}>
          {mixOrder.map((id) => (
            <View key={id} style={styles.mixRow}>
              <Text style={styles.mixName}>
                {archetypes[id].name.replace(/^The\s+/, "")}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(result.mixPercent[id], result.mixPercent[id] > 0 ? 4 : 0)}%`,
                      backgroundColor: archetypes[id].color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.mixPct}>{result.mixPercent[id]}%</Text>
            </View>
          ))}
        </View>
      </Card>

      {result.signatureThemes.length > 0 ? (
        <Card>
          <Text style={styles.sectionLabel}>Where this showed up</Text>
          <Body muted>
            Themes that most strongly leaned {vibe.name.replace(/^The\s+/, "")}.
          </Body>
          <View style={styles.themeList}>
            {result.signatureThemes.map((theme) => (
              <Text key={theme.dimension} style={styles.themeLine}>
                · {theme.label}
                {theme.leanShare > 0
                  ? ` (${Math.round(theme.leanShare * 100)}% lean)`
                  : ""}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.meta}>
          {result.answeredCount}/{result.questionCount} scenes ·{" "}
          {result.themesTouched}/10 themes ·{" "}
          {Math.round(result.modelConfidence * 100)}% model fill
        </Text>
        <Body muted>{confidenceCopy(result.confidenceLabel)}</Body>
        {insights.length > 0 ? (
          <View style={styles.insightList}>
            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
              A few notes
            </Text>
            {insights.map((insight) => (
              <Text
                key={`${insight.questionId}:${insight.answerId}`}
                style={styles.insightText}
              >
                · {insight.text}
              </Text>
            ))}
          </View>
        ) : null}
      </Card>

      <Body muted center>
        Model-heavy under the hood, still just social weather. Not a diagnosis,
        safety score, or consent. A vibe never grants touch.
      </Body>
      <Button
        label="Keep this Vibe Profile"
        onPress={() => router.push("/profile/vibe")}
      />
      <Button
        label="Browse Short & Deep Quizzes"
        variant="secondary"
        onPress={() => router.push("/(tabs)/quizzes" as never)}
        accessibilityHint="Opens the Quizzes hub with Short Vibe, Deep Vibe (100), and four self quizzes"
      />
      <Button
        label="Try Deep Vibe (100 scenes)"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/quizzes/play",
            params: { quizId: "vibe-deep" },
          } as never)
        }
        accessibilityHint="Starts the full 100-scene Vibe on the Quizzes path. Progress saves on this device."
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
    sectionLabel: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 20,
      marginBottom: 6,
    },
    meta: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600" as const,
      marginBottom: 8,
    },
    mixList: { gap: 10, marginTop: 12 },
    mixRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
    },
    mixName: {
      width: 88,
      color: colors.ink,
      fontSize: 13,
      fontWeight: "700" as const,
    },
    barTrack: {
      flex: 1,
      height: 10,
      borderRadius: 99,
      backgroundColor: colors.line,
      overflow: "hidden" as const,
    },
    barFill: {
      height: 10,
      borderRadius: 99,
    },
    mixPct: {
      width: 40,
      textAlign: "right" as const,
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700" as const,
    },
    themeList: { gap: 6, marginTop: 10 },
    themeLine: { color: colors.ink, fontSize: 15, lineHeight: 22 },
    insightList: { gap: 8 },
    insightText: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  };
}
