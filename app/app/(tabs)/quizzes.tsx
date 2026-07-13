import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { quizCatalog } from "../../data/quizCatalog";
import {
  quizResultsStore,
  type QuizResultsMap,
} from "../../services/quizResultsStore";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

export default function QuizzesHubScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [results, setResults] = useState<QuizResultsMap>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void quizResultsStore.load().then((value) => {
        if (active) setResults(value);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const vibe = quizCatalog.filter((q) => q.family === "vibe");
  const self = quizCatalog.filter((q) => q.family === "self");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>SELF-UNDERSTANDING</Text>
      <Text style={styles.title} accessibilityRole="header">
        Quizzes that stay soft.
      </Text>
      <Text style={styles.intro}>
        Explore your social weather privately. Results are conversation starters
        — never a diagnosis, safety score, or consent to touch.
      </Text>

      <View style={styles.safetyCard} accessible>
        <Text style={styles.safetyTitle}>Safety promise</Text>
        <Text style={styles.safetyBody}>
          Partner comparison only opens after both people explicitly consent to
          share and to compare. Face ID protects private result views on real
          accounts. A quiz match is never permission to touch.
        </Text>
      </View>

      <Text style={styles.section}>Vibe Quiz</Text>
      {vibe.map((entry) => {
        const done = results[entry.id];
        return (
          <Pressable
            key={entry.id}
            accessibilityRole="button"
            accessibilityLabel={`${done ? "Retake" : "Start"} ${entry.title}`}
            onPress={() =>
              router.push({
                pathname: "/quizzes/play",
                params: { quizId: entry.id },
              } as never)
            }
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{entry.title}</Text>
              <Text style={styles.cardSummary}>{entry.summary}</Text>
              <Text style={styles.meta}>
                ~{entry.minutes} min
                {done ? ` · Last: ${done.primary}` : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.muted} />
          </Pressable>
        );
      })}

      <Text style={styles.section}>More self-understanding</Text>
      {self.map((entry) => {
        const done = results[entry.id];
        return (
          <Pressable
            key={entry.id}
            accessibilityRole="button"
            accessibilityLabel={`${done ? "Retake" : "Start"} ${entry.title}`}
            onPress={() =>
              router.push({
                pathname: "/quizzes/play",
                params: { quizId: entry.id },
              } as never)
            }
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{entry.title}</Text>
              <Text style={styles.cardSummary}>{entry.summary}</Text>
              <Text style={styles.meta}>
                ~{entry.minutes} min
                {done ? ` · Saved privately` : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.muted} />
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Partner invites and shared comparison"
        onPress={() => router.push("/quizzes/share" as never)}
        style={({ pressed }) => [styles.shareCard, pressed && styles.pressed]}
      >
        <Text style={styles.cardTitle}>Partner invites</Text>
        <Text style={styles.cardSummary}>
          Create a sealed invite for a shareable quiz. Comparison stays closed
          until both people consent — twice: to share, and to compare.
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: AppColors) {
  return {
    container: { padding: 24, paddingBottom: 48, gap: 14 },
    eyebrow: {
      color: colors.moss,
      fontSize: 13,
      fontWeight: "800" as const,
      letterSpacing: 1.2,
    },
    title: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 34,
      lineHeight: 40,
    },
    intro: { color: colors.muted, fontSize: 16, lineHeight: 24 },
    safetyCard: {
      backgroundColor: colors.mossSoft,
      borderRadius: radius.md,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.line,
      gap: 6,
    },
    safetyTitle: {
      color: colors.moss,
      fontSize: 14,
      fontWeight: "800" as const,
    },
    safetyBody: { color: colors.ink, fontSize: 14, lineHeight: 21 },
    section: {
      marginTop: 10,
      color: colors.ink,
      fontSize: 18,
      fontWeight: "800" as const,
    },
    card: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 16,
    },
    shareCard: {
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.moss,
      padding: 16,
      gap: 6,
      marginTop: 8,
    },
    cardCopy: { flex: 1, gap: 4 },
    cardTitle: {
      color: colors.ink,
      fontSize: 17,
      fontWeight: "800" as const,
    },
    cardSummary: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    meta: { color: colors.plum, fontSize: 12, fontWeight: "700" as const },
    pressed: { opacity: 0.85 },
  };
}
