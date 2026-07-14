import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  learningModules,
  learningModulesForTrack,
  learningPaths,
  pathCompletion,
  recommendedNextModule,
  type LearningModule,
  type LearningPath,
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
import { runtimeConfig } from "../../config/runtime";

function ModuleCard({
  module,
  progress,
  onPress,
  styles,
  colors,
  featured,
}: {
  module: LearningModule;
  progress: LearningProgress;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
  featured?: boolean;
}) {
  const state = progress[module.id];
  const status = state?.completed ? "Completed" : state ? "Continue" : "Start";
  const scenarioCount = module.steps.filter((s) => s.scenario).length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${status} ${module.title}, about ${module.minutes} minutes. ${module.summary}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        featured && styles.cardFeatured,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, featured && styles.iconWrapFeatured]}>
          <Ionicons
            name={
              state?.completed
                ? "checkmark"
                : featured
                  ? "sparkles-outline"
                  : "book-outline"
            }
            size={20}
            color={featured ? colors.plum : colors.moss}
          />
        </View>
        <View style={styles.cardCopy}>
          {featured ? (
            <Text style={styles.featuredLabel}>RECOMMENDED NEXT</Text>
          ) : null}
          <Text style={styles.cardTitle}>{module.title}</Text>
          <Text style={styles.cardSummary}>{module.summary}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{module.minutes} min</Text>
        <Text style={styles.meta}>
          {module.steps.length} steps
          {scenarioCount > 0 ? ` · ${scenarioCount} practice` : ""}
        </Text>
        {module.requiredBeforeFirstSession ? (
          <Text style={styles.required}>Recommended before first session</Text>
        ) : null}
        {module.relatedQuizId ? (
          <Text style={styles.quizLink}>Pairs with a private quiz</Text>
        ) : null}
        {module.relatedPractice && module.relatedPractice.length > 0 ? (
          <Text style={styles.practiceLink}>Product practice</Text>
        ) : null}
        <Text style={styles.action}>{status} →</Text>
      </View>
    </Pressable>
  );
}

function PathCard({
  path,
  progress,
  onOpenFirst,
  styles,
  colors,
}: {
  path: LearningPath;
  progress: LearningProgress;
  onOpenFirst: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
}) {
  const { done, total } = pathCompletion(path, progress);
  const complete = done === total && total > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${path.title}. ${done} of ${total} modules complete. About ${path.minutes} minutes. ${path.summary}`}
      onPress={onOpenFirst}
      style={({ pressed }) => [styles.pathCard, pressed && styles.pressed]}
    >
      <View style={styles.pathTop}>
        <View style={styles.pathIcon}>
          <Ionicons
            name={complete ? "checkmark-circle" : "map-outline"}
            size={22}
            color={colors.moss}
          />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.pathTitle}>{path.title}</Text>
          <Text style={styles.cardSummary}>{path.summary}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {done}/{total} modules · ~{path.minutes} min
        </Text>
        <Text style={styles.action}>
          {complete ? "Review →" : done > 0 ? "Continue path →" : "Start path →"}
        </Text>
      </View>
      <View style={styles.pathTrack}>
        <View
          style={[
            styles.pathFill,
            { width: `${total ? (done / total) * 100 : 0}%` },
          ]}
        />
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

  // v1 App Store Safe scope: solo self-understanding only. Lived Lessons
  // presuppose an existing partner dynamic (Partner Communication, etc.) and
  // are a deliberate later layer. SEE: docs/BUILD_MODES.md.
  const showLivedLessons = runtimeConfig.features.pairedGrowthContent;

  const completed = completionCount(progress);
  const foundations = learningModulesForTrack("foundations");
  const lived = learningModulesForTrack("lived-lessons");
  const livedIds = new Set(lived.map((m) => m.id));
  const foundationsDone = foundations.filter(
    (m) => progress[m.id]?.completed,
  ).length;
  const livedDone = lived.filter((m) => progress[m.id]?.completed).length;
  const rawNext = recommendedNextModule(progress);
  const next =
    showLivedLessons || !rawNext || rawNext.track !== "lived-lessons"
      ? rawNext
      : foundations.find((m) => !progress[m.id]?.completed);
  const visiblePaths = showLivedLessons
    ? learningPaths
    : learningPaths.filter((p) => !p.moduleIds.some((id) => livedIds.has(id)));

  const openModule = (module: LearningModule) => {
    router.push({
      pathname: "/learning/[id]",
      params: { id: module.id },
    });
  };

  const openPath = (path: LearningPath) => {
    const firstIncomplete =
      path.moduleIds
        .map((id) => learningModules.find((m) => m.id === id))
        .find((m) => m && !progress[m.id]?.completed) ??
      learningModules.find((m) => m.id === path.moduleIds[0]);
    if (firstIncomplete) openModule(firstIncomplete);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>GUIDED LEARNING</Text>
      <Text style={styles.title} accessibilityRole="header">
        Learn the language before you need it.
      </Text>
      <Text style={styles.intro}>
        {showLivedLessons
          ? "A full private section: six lived lessons from hard-earned practice, six Litmo foundations, and curated paths. Short interactive steps, scenarios with feedback, optional product practice and quizzes. Completing a module never proves anyone is safe."
          : "A private section for understanding yourself: six Litmo foundations and curated paths. Short interactive steps, scenarios with feedback. Completing a module never proves anyone is safe."}
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
          max: showLivedLessons ? learningModules.length : foundations.length,
          now: showLivedLessons ? completed : foundationsDone,
        }}
        accessibilityLabel={`${showLivedLessons ? completed : foundationsDone} of ${showLivedLessons ? learningModules.length : foundations.length} modules completed`}
      >
        <View style={styles.progressMain}>
          <Text style={styles.progressNumber}>
            {showLivedLessons ? completed : foundationsDone}/
            {showLivedLessons ? learningModules.length : foundations.length}
          </Text>
          <Text style={styles.progressLabel}>modules completed privately</Text>
        </View>
        <View style={styles.progressSplit}>
          {showLivedLessons ? (
            <Text style={styles.progressSplitText}>
              Lived {livedDone}/{lived.length}
            </Text>
          ) : null}
          <Text style={styles.progressSplitText}>
            Foundations {foundationsDone}/{foundations.length}
          </Text>
        </View>
      </View>

      {next ? (
        <ModuleCard
          module={next}
          progress={progress}
          styles={styles}
          colors={colors}
          featured
          onPress={() => openModule(next)}
        />
      ) : (
        <View style={styles.allDoneCard} accessible>
          <Text style={styles.allDoneTitle}>Private curriculum complete</Text>
          <Text style={styles.cardSummary}>
            You can revisit any module. Completing everything still never
            certifies safety — real sessions still need real, current mutual
            consent.
          </Text>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Exorcism Dojo. Private ritual surface for defense inventory, urge log, and burn gates. Not a consumer product feature."
        accessibilityHint="Device-local only. Completing dojo steps never proves safety or consent."
        onPress={() => router.push("/dojo" as never)}
        style={({ pressed }) => [
          styles.campfireCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.campfireIcon}>
          <Ionicons name="flame-outline" size={22} color={colors.moss} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>Exorcism Dojo</Text>
          <Text style={styles.cardSummary}>
            THIS IS A PRIVATE EXORCISM ARTIFACT, NOT A PRODUCT. Name defenses
            D01–D24, log urges before building, track burn readiness. Pair with
            the Exorcism Dojo learning path.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.muted} />
      </Pressable>

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
            Short (~10) and Deep (100) Vibe, plus Soft Capacity, Boundary Voice,
            Comfort & Care, and Connection Pace. Soft weather only — never a
            grade or consent.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.muted} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.section} accessibilityRole="header">
          Learning paths
        </Text>
        <Text style={styles.sectionHint}>
          Curated sequences — start or resume at the first incomplete module.
          Paths never gate sessions and never certify readiness.
        </Text>
      </View>

      {[...visiblePaths]
        .sort((a, b) => {
          // Surface the dojo path first — ritual honesty over product curriculum.
          if (a.id === "exorcism-dojo-track") return -1;
          if (b.id === "exorcism-dojo-track") return 1;
          return 0;
        })
        .map((path) => (
          <PathCard
            key={path.id}
            path={path}
            progress={progress}
            styles={styles}
            colors={colors}
            onOpenFirst={() => openPath(path)}
          />
        ))}

      {showLivedLessons ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.section} accessibilityRole="header">
              Lived lessons
            </Text>
            <Text style={styles.sectionHint}>
              Six hard-learned modules: Consent as Language, Nervous System
              Safety, Boundaries, Recovering from Violation, Partner
              Communication, and Self-Compassion. Interactive practice,
              optional product links and quizzes. Leave anytime.
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
        </>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.section} accessibilityRole="header">
          Litmo foundations
        </Text>
        <Text style={styles.sectionHint}>
          How Consent Snapshots, Soft Signal, Touch Language, full session flow,
          blocking/reporting, and trust signals work in the product.
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

      <View style={styles.footerNote} accessible>
        <Text style={styles.footerNoteText}>
          Progress stays on this device. No public badges, streaks, or safety
          rankings. A match, quiz result, or completed module never constitutes
          consent.
        </Text>
      </View>
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
      gap: 12,
    },
    progressMain: {
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
    progressSplit: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 12,
    },
    progressSplitText: {
      color: colors.moss,
      fontSize: 13,
      fontWeight: "600" as const,
    },
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
    cardFeatured: {
      borderWidth: 1.5,
      borderColor: colors.plum,
      backgroundColor: colors.paper,
    },
    allDoneCard: {
      backgroundColor: colors.mossSoft,
      borderRadius: radius.md,
      padding: 18,
      gap: 8,
    },
    allDoneTitle: {
      color: colors.moss,
      fontSize: 18,
      fontWeight: "700" as const,
    },
    pathCard: {
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.line,
      ...shadow,
    },
    pathTop: { flexDirection: "row" as const, gap: 12 },
    pathIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.mossSoft,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    pathTitle: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "700" as const,
    },
    pathTrack: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.line,
      overflow: "hidden" as const,
    },
    pathFill: {
      height: "100%" as const,
      backgroundColor: colors.moss,
      borderRadius: radius.pill,
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
    iconWrapFeatured: {
      backgroundColor: colors.plumSoft,
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
    featuredLabel: {
      color: colors.plum,
      fontSize: 11,
      fontWeight: "800" as const,
      letterSpacing: 0.8,
    },
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
    practiceLink: {
      color: colors.ink,
      backgroundColor: colors.line,
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
    footerNote: {
      marginTop: 8,
      padding: 16,
      borderRadius: radius.md,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
    },
    footerNoteText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
    },
  };
}
