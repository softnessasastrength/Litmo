import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { learningModules } from "../../data/learningModules";
import { learningProgressService } from "../../services/learningProgress";
import {
  completionCount,
  LearningProgress,
} from "../../services/learningProgressCore";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";


export default function LearningHomeScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [progress, setProgress] = useState<LearningProgress>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void learningProgressService
        .load()
        .then((value) => active && setProgress(value));
      return () => {
        active = false;
      };
    }, []),
  );

  const completed = completionCount(progress);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>GUIDED PRACTICE</Text>
      <Text style={styles.title}>Learn the language before you need it.</Text>
      <Text style={styles.intro}>
        Short, step-by-step modules explain how Litmo works and why each safety
        boundary exists. No scores, streaks, or public badges.
      </Text>

      <View
        style={styles.progressCard}
        accessibilityLabel={`${completed} of ${learningModules.length} modules completed`}
      >
        <Text style={styles.progressNumber}>
          {completed}/{learningModules.length}
        </Text>
        <Text style={styles.progressLabel}>modules completed privately</Text>
      </View>

      {learningModules.map((module) => {
        const state = progress[module.id];
        const status = state?.completed
          ? "Completed"
          : state
            ? "Continue"
            : "Start";
        return (
          <Pressable
            key={module.id}
            accessibilityRole="button"
            accessibilityLabel={`${status} ${module.title}, about ${module.minutes} minutes`}
            onPress={() =>
              router.push({
                pathname: "/learning/[id]",
                params: { id: module.id },
              })
            }
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name={state?.completed ? "checkmark" : "book-outline"}
                  size={20}
                  color={colors.moss}
                />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{module.title}</Text>
                <Text style={styles.cardSummary}>{module.summary}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{module.minutes} min</Text>
              {module.requiredBeforeFirstSession ? (
                <Text style={styles.required}>
                  Recommended before first session
                </Text>
              ) : null}
              <Text style={styles.action}>{status} →</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(colors: AppColors, shadow: Record<string, unknown> = {}) {
  return {
  container: {
    padding: 22,
    paddingBottom: 48,
    backgroundColor: colors.cream,
    gap: 16,
  },
  eyebrow: {
    color: colors.moss,
    fontWeight: "700",
    letterSpacing: 1.4,
    fontSize: 12,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.headline,
    fontSize: 38,
    lineHeight: 42,
  },
  intro: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  progressCard: {
    backgroundColor: colors.mossSoft,
    borderRadius: radius.md,
    padding: 18,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  progressNumber: { color: colors.moss, fontSize: 27, fontWeight: "700" },
  progressLabel: { color: colors.moss, fontSize: 14 },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    padding: 18,
    gap: 16,
    ...shadow,
  },
  pressed: { opacity: 0.78 },
  cardTop: { flexDirection: "row", gap: 13 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mossSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  cardCopy: { flex: 1, gap: 5 },
  cardTitle: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  cardSummary: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 9,
  },
  meta: { color: colors.muted, fontSize: 12 },
  required: {
    color: colors.plum,
    backgroundColor: colors.plumSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
  },
  action: { color: colors.moss, fontWeight: "700", marginLeft: "auto" },
};
}

