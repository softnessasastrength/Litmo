import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  learningModules,
  learningModulesForTrack,
  type LearningModule,
} from "../../data/learningModules";
import { useNeurodivergent } from "../../context/NeurodivergentContext";
import { clearLanguage } from "../../lib/clearLanguage";
import { learningProgressService } from "../../services/learningProgress";
import {
  completionCount,
  LearningProgress,
} from "../../services/learningProgressCore";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

function ModuleCard({
  module,
  progress,
  onPress,
  styles,
  colors,
}: {
  module: LearningModule;
  progress: LearningProgress;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
}) {
  const state = progress[module.id];
  const status = state?.completed ? "Completed" : state ? "Continue" : "Start";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${status} ${module.title}, about ${module.minutes} minutes. ${module.summary}`}
      onPress={onPress}
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
          <Text style={styles.required}>Recommended before first session</Text>
        ) : null}
        {module.relatedQuizId ? (
          <Text style={styles.quizLink}>Pairs with a private quiz</Text>
        ) : null}
        <Text style={styles.action}>{status} →</Text>
      </View>
    </Pressable>
  );
}

export default function LearningHomeScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { prefs } = useNeurodivergent();
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
  const foundations = learningModulesForTrack("foundations");
  const lived = learningModulesForTrack("lived-lessons");

  const openModule = (module: LearningModule) => {
    router.push({
      pathname: "/learning/[id]",
      params: { id: module.id },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>GUIDED LEARNING</Text>
      <Text style={styles.title} accessibilityRole="header">
        Learn the language before you need it.
      </Text>
      <Text style={styles.intro}>
        A full private section: hard-earned lived lessons plus Litmo
        foundations. Short interactive steps, trauma-informed, never scored.
        Completing a module never proves anyone is safe.
      </Text>

      {prefs.enabled ? (
        <View style={styles.ndBanner} accessible>
          <Text style={styles.ndBannerText}>{clearLanguage.ndModeOn}</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => router.push("/settings" as never)}
          accessibilityRole="button"
          accessibilityHint="Opens Settings to enable Neurodivergent Mode"
          style={styles.ndSoftLink}
        >
          <Text style={styles.ndSoftLinkText}>{clearLanguage.ndModeOffHint}</Text>
        </Pressable>
      )}

      <View
        style={styles.progressCard}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: learningModules.length,
          now: completed,
        }}
        accessibilityLabel={`${completed} of ${learningModules.length} modules completed`}
      >
        <Text style={styles.progressNumber}>
          {completed}/{learningModules.length}
        </Text>
        <Text style={styles.progressLabel}>modules completed privately</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Campfire Mode. Three local practices for group presence, quiet co-regulation, and calm focus."
        onPress={() => router.push("/campfire" as never)}
        style={({ pressed }) => [
          styles.campfireCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.campfireIcon}>
          <Text accessible={false} style={styles.campfireGlyph}>
            🔥
          </Text>
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>Campfire Mode</Text>
          <Text style={styles.cardSummary}>
            Circle gathering, quiet co-regulation, and a digital focus fire.
            Local, private, and never scored.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.muted} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Quizzes. Private Vibe and self-understanding quizzes that pair with learning modules."
        accessibilityHint="Results are never consent to touch"
        onPress={() => router.push("/(tabs)/quizzes" as never)}
        style={({ pressed }) => [styles.quizCard, pressed && styles.pressed]}
      >
        <View style={styles.iconWrapPlum}>
          <Ionicons name="leaf-outline" size={20} color={colors.plum} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>Vibe & self quizzes</Text>
          <Text style={styles.cardSummary}>
            Soft weather for conversation. Several lived-lesson modules link to
            a matching private quiz — optional, never a grade.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.muted} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.section} accessibilityRole="header">
          Lived lessons
        </Text>
        <Text style={styles.sectionHint}>
          Six hard-learned modules: Consent as Language, Nervous System Safety,
          Boundaries, Recovering from Violation, Partner Communication, and
          Self-Compassion. Short sections, interactive practice, private
          progress. Several pair with a Vibe or self quiz — optional, never a
          grade. Leave anytime.
        </Text>
      </View>

      {lived.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          progress={progress}
          styles={styles}
          colors={colors}
          onPress={() => openModule(module)}
        />
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.section} accessibilityRole="header">
          Litmo foundations
        </Text>
        <Text style={styles.sectionHint}>
          How Consent Snapshots, Soft Signal, Touch Language, and safety tools
          work in the product.
        </Text>
      </View>

      {foundations.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          progress={progress}
          styles={styles}
          colors={colors}
          onPress={() => openModule(module)}
        />
      ))}
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
      fontWeight: "700" as const,
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
    ndBanner: {
      backgroundColor: colors.mossSoft,
      borderRadius: radius.md,
      padding: 14,
    },
    ndBannerText: {
      color: colors.moss,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600" as const,
    },
    ndSoftLink: {
      paddingVertical: 8,
    },
    ndSoftLinkText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      textDecorationLine: "underline" as const,
    },
    progressCard: {
      backgroundColor: colors.mossSoft,
      borderRadius: radius.md,
      padding: 18,
      flexDirection: "row" as const,
      alignItems: "baseline" as const,
      gap: 8,
    },
    progressNumber: {
      color: colors.moss,
      fontSize: 27,
      fontWeight: "700" as const,
    },
    progressLabel: { color: colors.moss, fontSize: 14 },
    sectionHeader: { marginTop: 8, gap: 6 },
    section: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 24,
    },
    sectionHint: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    campfireCard: {
      minHeight: 112,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
      padding: 18,
      backgroundColor: colors.apricotSoft,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.apricot,
      ...shadow,
    },
    quizCard: {
      minHeight: 96,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
      padding: 18,
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.plum,
      ...shadow,
    },
    campfireIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: colors.paper,
    },
    campfireGlyph: { fontSize: 28 },
    card: {
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      padding: 18,
      gap: 16,
      ...shadow,
    },
    pressed: { opacity: 0.78 },
    cardTop: { flexDirection: "row" as const, gap: 13 },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.mossSoft,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    iconWrapPlum: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.plumSoft,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    cardCopy: { flex: 1, gap: 5 },
    cardTitle: {
      color: colors.ink,
      fontSize: 20,
      fontWeight: "700" as const,
    },
    cardSummary: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    metaRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      flexWrap: "wrap" as const,
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
    quizLink: {
      color: colors.moss,
      backgroundColor: colors.mossSoft,
      borderRadius: radius.pill,
      paddingHorizontal: 9,
      paddingVertical: 4,
      fontSize: 11,
      fontWeight: "600" as const,
    },
    action: {
      color: colors.moss,
      fontWeight: "700" as const,
      marginLeft: "auto" as const,
    },
  };
}
