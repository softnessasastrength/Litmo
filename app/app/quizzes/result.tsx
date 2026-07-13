import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { VibeCard } from "../../components/VibeCard";
import { getQuizEntry } from "../../data/quizCatalog";
import { archetypes, type ArchetypeId } from "../../data/quiz";
import {
  quizResultsStore,
  type StoredQuizResult,
} from "../../services/quizResultsStore";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

function ResultBody() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const entry = getQuizEntry(String(quizId ?? ""));
  const [result, setResult] = useState<StoredQuizResult | null>(null);

  useEffect(() => {
    void quizResultsStore.load().then((map) => {
      setResult(map[String(quizId ?? "") as keyof typeof map] ?? null);
    });
  }, [quizId]);

  if (!entry) {
    return (
      <Screen>
        <Title>Quiz not found</Title>
      </Screen>
    );
  }

  if (!result) {
    return (
      <Screen>
        <Eyebrow>QUIZ</Eyebrow>
        <Title>{entry.title}</Title>
        <Body muted>No private result saved yet.</Body>
        <Button
          label="Take this quiz"
          onPress={() =>
            router.replace({
              pathname: "/quizzes/play",
              params: { quizId: entry.id },
            } as never)
          }
        />
      </Screen>
    );
  }

  const mixOrder = (Object.keys(archetypes) as ArchetypeId[]).sort(
    (a, b) => result.mixPercent[b] - result.mixPercent[a],
  );

  return (
    <Screen>
      <Eyebrow>PRIVATE RESULT</Eyebrow>
      <Title>{entry.title}</Title>
      <Body muted>{entry.disclaimer}</Body>

      <VibeCard
        archetypeId={result.primary}
        secondaryId={result.secondary}
        showHowYouMightShowUp
      />

      <Card>
        <Text style={styles.sectionLabel}>Weather mix</Text>
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
      </Card>

      {result.notes.length > 0 ? (
        <Card>
          <Text style={styles.sectionLabel}>A few soft notes</Text>
          {result.notes.map((note) => (
            <Text key={note} style={styles.note}>
              · {note}
            </Text>
          ))}
        </Card>
      ) : null}

      <Body muted center>
        Saved only on this device. Sharing requires a separate invite and
        explicit mutual consent before any comparison.
      </Body>

      <Button
        label="Back to Quizzes"
        onPress={() => router.replace("/(tabs)/quizzes" as never)}
      />
      {entry.shareable ? (
        <Button
          label="Partner invite for this quiz"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/quizzes/share",
              params: { quizId: entry.id },
            } as never)
          }
        />
      ) : null}
      <Button
        label="Retake"
        variant="secondary"
        onPress={() =>
          router.replace({
            pathname: "/quizzes/play",
            params: { quizId: entry.id },
          } as never)
        }
      />
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
    sectionLabel: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 20,
      marginBottom: 10,
    },
    mixRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      marginBottom: 8,
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
  };
}
