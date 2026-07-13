import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { VibeCard } from "../../components/VibeCard";
import { getQuizEntry } from "../../data/quizCatalog";
import { archetypes, type ArchetypeId } from "../../data/quiz";
import {
  quizResultsRepository,
  type StoredQuizResult,
} from "../../services/quizResultsRepository";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

function ResultBody() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const entry = getQuizEntry(String(quizId ?? ""));
  const [result, setResult] = useState<StoredQuizResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void quizResultsRepository.load().then((map) => {
      if (!active) return;
      setResult(map[String(quizId ?? "") as keyof typeof map] ?? null);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [quizId]);

  if (!entry) {
    return (
      <Screen>
        <Title>Quiz not found</Title>
        <Body muted>
          That result path is missing. Return to Quizzes and try again.
        </Body>
        <Button
          label="Back to Quizzes"
          onPress={() => router.replace("/(tabs)/quizzes" as never)}
        />
      </Screen>
    );
  }

  if (!loaded) {
    return (
      <Screen>
        <Eyebrow>PRIVATE RESULT</Eyebrow>
        <Title>{entry.title}</Title>
        <Body muted>Opening your private result…</Body>
      </Screen>
    );
  }

  if (!result) {
    return (
      <Screen>
        <Eyebrow>PRIVATE RESULT</Eyebrow>
        <Title>{entry.title}</Title>
        <Body muted>
          No private result saved yet. Take the quiz when you have a quiet
          moment — nothing is shared automatically.
        </Body>
        <Button
          label="Take this quiz"
          onPress={() =>
            router.replace({
              pathname: "/quizzes/play",
              params: { quizId: entry.id },
            } as never)
          }
        />
        <Button
          label="Back to Quizzes"
          variant="secondary"
          onPress={() => router.replace("/(tabs)/quizzes" as never)}
        />
      </Screen>
    );
  }

  // Calm mix order: show highest contribution first as weather, not ranking.
  const mixOrder = (Object.keys(archetypes) as ArchetypeId[]).sort(
    (a, b) => result.mixPercent[b] - result.mixPercent[a],
  );

  const primaryName = archetypes[result.primary]?.name ?? result.primary;

  return (
    <Screen>
      <FadeIn>
        <Eyebrow>PRIVATE RESULT</Eyebrow>
        <Title>{entry.title}</Title>
        <Body muted>
          A soft reflection of how you answered today — not a score, rank, or
          proof of safety.
        </Body>

        <View
          style={styles.calmBanner}
          accessible
          accessibilityLabel="This is a private conversation starter, not a ranking or diagnosis."
        >
          <Text style={styles.calmBannerTitle}>Not a ranking</Text>
          <Text style={styles.calmBannerBody}>
            You are not competing with anyone.{" "}
            {primaryName.replace(/^The\s+/, "")} is a weather note for how you
            might show up — never a fixed identity or a permission to touch.
          </Text>
        </View>

        <VibeCard
          archetypeId={result.primary}
          secondaryId={result.secondary}
          showHowYouMightShowUp
        />

        <Card>
          <Text style={styles.sectionLabel}>Weather mix</Text>
          <Text style={styles.sectionHint}>
            How much each tone showed up in your answers. Percentages describe
            blend, not place finish.
          </Text>
          {mixOrder.map((id) => {
            const pct = result.mixPercent[id] ?? 0;
            const label = archetypes[id].name.replace(/^The\s+/, "");
            return (
              <View
                key={id}
                style={styles.mixRow}
                accessible
                accessibilityLabel={`${label}, about ${pct} percent of the mix`}
              >
                <Text style={styles.mixName}>{label}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`,
                        backgroundColor: archetypes[id].color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.mixPct}>{pct}%</Text>
              </View>
            );
          })}
        </Card>

        {result.notes.length > 0 ? (
          <Card>
            <Text style={styles.sectionLabel}>A few soft notes</Text>
            <Text style={styles.sectionHint}>
              Gentle observations from your answers — not instructions.
            </Text>
            {result.notes.map((note) => (
              <Text key={note} style={styles.note}>
                · {note}
              </Text>
            ))}
          </Card>
        ) : null}

        <Body muted center>
          Saved privately on this device. When you are signed in, a summary may
          also back up to your account (owner-only). Sharing still requires a
          separate invite and two explicit consents — to share, then to compare.
        </Body>

        <Text style={styles.disclaimer}>{entry.disclaimer}</Text>

        <Button
          label="Back to Quizzes"
          onPress={() => router.replace("/(tabs)/quizzes" as never)}
        />
        {entry.shareable ? (
          <Button
            label="Partner invite for this quiz"
            variant="secondary"
            accessibilityHint="Opens the two-consent share and compare flow"
            onPress={() =>
              router.push({
                pathname: "/quizzes/share",
                params: { quizId: entry.id },
              } as never)
            }
          />
        ) : null}
        <Button
          label="Retake when you like"
          variant="secondary"
          onPress={() =>
            router.replace({
              pathname: "/quizzes/play",
              params: { quizId: entry.id },
            } as never)
          }
        />
      </FadeIn>
    </Screen>
  );
}

export default function QuizResultScreen() {
  return (
    <SensitiveAccessGate>
      <ResultBody />
    </SensitiveAccessGate>
  );
}

function makeStyles(colors: AppColors) {
  return {
    calmBanner: {
      backgroundColor: colors.mossSoft,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.line,
      gap: 6,
    },
    calmBannerTitle: {
      color: colors.moss,
      fontSize: 13,
      fontWeight: "800" as const,
      letterSpacing: 0.4,
      textTransform: "uppercase" as const,
    },
    calmBannerBody: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 22,
    },
    sectionLabel: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 20,
      marginBottom: 4,
    },
    sectionHint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    mixRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      marginBottom: 8,
      minHeight: 28,
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
    barFill: { height: 10, borderRadius: 99 },
    mixPct: {
      width: 40,
      textAlign: "right" as const,
      color: colors.muted,
      fontWeight: "700" as const,
    },
    note: { color: colors.ink, fontSize: 15, lineHeight: 22, marginBottom: 6 },
    disclaimer: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center" as const,
    },
  };
}
