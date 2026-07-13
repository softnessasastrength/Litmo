import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { quizCatalog, type QuizCatalogEntry } from "../../data/quizCatalog";
import {
  quizResultsRepository,
  type QuizResultsMap,
  type StoredQuizResult,
} from "../../services/quizResultsRepository";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

function vibeDepthLabel(entry: QuizCatalogEntry): string {
  if (entry.id === "vibe-short") return "Short";
  if (entry.id === "vibe-deep") return "Deep";
  return "Vibe";
}

function vibeDepthHint(entry: QuizCatalogEntry): string {
  if (entry.id === "vibe-short") {
    return "A gentle first pass — about ten calm scenes.";
  }
  if (entry.id === "vibe-deep") {
    return "A fuller weather mix — one hundred light scenes. Pause anytime.";
  }
  return entry.summary;
}

function statusLabel(
  entry: QuizCatalogEntry,
  done: StoredQuizResult | undefined,
): string {
  if (!done) return "Start";
  return "Retake";
}

function statusDetail(
  entry: QuizCatalogEntry,
  done: StoredQuizResult | undefined,
): string {
  if (!done) return `About ${entry.minutes} min`;
  // Never surface archetype/primary labels outside SensitiveAccessGate.
  return "Saved privately";
}

export default function QuizzesHubScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [results, setResults] = useState<QuizResultsMap>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void quizResultsRepository.load().then((value) => {
        if (active) setResults(value);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const vibe = quizCatalog.filter((q) => q.family === "vibe");
  const self = quizCatalog.filter((q) => q.family === "self");

  const openQuiz = (entry: QuizCatalogEntry) => {
    router.push({
      pathname: "/quizzes/play",
      params: { quizId: entry.id },
    } as never);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>SELF-UNDERSTANDING</Text>
      <Text style={styles.title} accessibilityRole="header">
        Quizzes that stay soft.
      </Text>
      <Text style={styles.intro}>
        Explore your social weather privately. Results are conversation starters
        — never a diagnosis, safety score, or consent to touch.
      </Text>

      <View
        style={styles.safetyCard}
        accessible
        accessibilityRole="text"
        accessibilityLabel="Safety promise. Partner comparison only opens after both people explicitly consent to share and to compare. Face ID protects private result views on real accounts. A quiz match is never permission to touch."
      >
        <Text style={styles.safetyTitle}>Safety promise</Text>
        <Text style={styles.safetyBody}>
          Partner comparison only opens after both people explicitly consent to
          share and to compare. Results are end-to-end encrypted for the invite.
          Face ID protects private result and partner screens on real accounts.
          A quiz match is never permission to touch.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Guided Practice lived lessons. Consent language, nervous system safety, boundaries, recovery, communication, and self-compassion."
        accessibilityHint="Opens short trauma-informed learning modules that pair with private quizzes"
        onPress={() => router.push("/(tabs)/learn" as never)}
        style={({ pressed }) => [styles.learnLinkCard, pressed && styles.pressed]}
      >
        <Text style={styles.learnLinkTitle}>From learning → weather</Text>
        <Text style={styles.learnLinkBody}>
          Lived lessons on Learn pair with these quizzes: consent as language,
          capacity, boundaries, recovery, pace, and care. Modules stay private
          and never grade you.
        </Text>
        <Text style={styles.learnLinkAction}>Open Guided Practice →</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.section} accessibilityRole="header">
          Vibe Quiz
        </Text>
        <Text style={styles.sectionHint}>
          Short for a soft first pass. Deep for a fuller mix.
        </Text>
      </View>

      {vibe.map((entry) => {
        const done = results[entry.id];
        const depth = vibeDepthLabel(entry);
        const status = statusLabel(entry, done);
        const isShort = entry.id === "vibe-short";
        const a11y = [
          `${status} ${entry.title}`,
          vibeDepthHint(entry),
          statusDetail(entry, done),
          entry.shareable ? "Can invite a partner later" : null,
        ]
          .filter(Boolean)
          .join(". ");

        return (
          <Pressable
            key={entry.id}
            accessibilityRole="button"
            accessibilityLabel={a11y}
            accessibilityHint="Opens the quiz"
            onPress={() => openQuiz(entry)}
            style={({ pressed }) => [
              styles.vibeCard,
              isShort ? styles.vibeCardShort : styles.vibeCardDeep,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.cardTop}>
              <View
                style={[
                  styles.depthBadge,
                  isShort ? styles.depthBadgeShort : styles.depthBadgeDeep,
                ]}
              >
                <Text
                  style={[
                    styles.depthBadgeText,
                    isShort
                      ? styles.depthBadgeTextShort
                      : styles.depthBadgeTextDeep,
                  ]}
                >
                  {depth}
                </Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>
                  {isShort ? "Soft first pass" : "Fuller weather mix"}
                </Text>
                <Text style={styles.cardSummary}>{vibeDepthHint(entry)}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{statusDetail(entry, done)}</Text>
              {done ? (
                <Text style={styles.savedPill}>Private result saved</Text>
              ) : null}
              <Text style={styles.action}>{status} →</Text>
            </View>
          </Pressable>
        );
      })}

      <View style={styles.sectionHeader}>
        <Text style={styles.section} accessibilityRole="header">
          More self-understanding
        </Text>
        <Text style={styles.sectionHint}>
          Short, private quizzes. Never scored in public.
        </Text>
      </View>

      {self.map((entry) => {
        const done = results[entry.id];
        const status = statusLabel(entry, done);
        const a11y = [
          `${status} ${entry.title}`,
          entry.summary,
          statusDetail(entry, done),
        ].join(". ");

        return (
          <Pressable
            key={entry.id}
            accessibilityRole="button"
            accessibilityLabel={a11y}
            accessibilityHint="Opens the quiz"
            onPress={() => openQuiz(entry)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name={done ? "checkmark" : "leaf-outline"}
                  size={20}
                  color={colors.moss}
                />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{entry.title}</Text>
                <Text style={styles.cardSummary}>{entry.summary}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{statusDetail(entry, done)}</Text>
              <Text style={styles.action}>{status} →</Text>
            </View>
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Partner invites and shared comparison. Two consents: share an encrypted result, then compare only if both opt in. End-to-end encrypted."
        accessibilityHint="Opens partner invite and mutual-consent comparison flow"
        onPress={() => router.push("/quizzes/share" as never)}
        style={({ pressed }) => [styles.shareCard, pressed && styles.pressed]}
      >
        <View style={styles.shareTop}>
          <View style={styles.iconWrapPlum}>
            <Ionicons name="people-outline" size={20} color={colors.plum} />
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>Partner invites & comparison</Text>
            <Text style={styles.cardSummary}>
              Invite one person. Encrypt your weather with Signal-style E2E.
              Comparison opens only after both of you consent to share and to
              compare — never automatically, never as consent to touch.
            </Text>
          </View>
        </View>
        <Text style={styles.shareMeta}>
          Mutual consent · E2E encrypted · never auto-open
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: AppColors, shadow: Record<string, unknown> = {}) {
  return {
    container: {
      padding: 22,
      paddingBottom: 48,
      backgroundColor: colors.cream,
      gap: 14,
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
    learnLinkCard: {
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.moss,
      padding: 16,
      gap: 8,
    },
    learnLinkTitle: {
      color: colors.moss,
      fontSize: 14,
      fontWeight: "800" as const,
    },
    learnLinkBody: { color: colors.ink, fontSize: 14, lineHeight: 21 },
    learnLinkAction: {
      color: colors.moss,
      fontSize: 14,
      fontWeight: "700" as const,
    },
    sectionHeader: { marginTop: 8, gap: 4 },
    section: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 24,
    },
    sectionHint: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    vibeCard: {
      minHeight: 112,
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      padding: 18,
      gap: 14,
      borderWidth: 1.5,
      ...shadow,
    },
    vibeCardShort: {
      borderColor: colors.moss,
      backgroundColor: colors.paper,
    },
    vibeCardDeep: {
      borderColor: colors.plum,
      backgroundColor: colors.paper,
    },
    card: {
      minHeight: 96,
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      padding: 18,
      gap: 14,
      borderWidth: 1,
      borderColor: colors.line,
      ...shadow,
    },
    pressed: { opacity: 0.78 },
    cardTop: {
      flexDirection: "row" as const,
      gap: 13,
      alignItems: "flex-start" as const,
    },
    shareTop: {
      flexDirection: "row" as const,
      gap: 13,
      alignItems: "flex-start" as const,
    },
    depthBadge: {
      minWidth: 52,
      minHeight: 52,
      borderRadius: 16,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: 8,
    },
    depthBadgeShort: { backgroundColor: colors.mossSoft },
    depthBadgeDeep: { backgroundColor: colors.plumSoft },
    depthBadgeText: {
      fontSize: 12,
      fontWeight: "800" as const,
      letterSpacing: 0.4,
    },
    depthBadgeTextShort: { color: colors.moss },
    depthBadgeTextDeep: { color: colors.plum },
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
      gap: 8,
    },
    meta: { color: colors.muted, fontSize: 12 },
    savedPill: {
      color: colors.plum,
      backgroundColor: colors.plumSoft,
      borderRadius: radius.pill,
      paddingHorizontal: 9,
      paddingVertical: 4,
      fontSize: 11,
      fontWeight: "700" as const,
      overflow: "hidden" as const,
    },
    action: {
      color: colors.moss,
      fontWeight: "700" as const,
      marginLeft: "auto" as const,
      fontSize: 14,
    },
    shareCard: {
      minHeight: 112,
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.moss,
      padding: 18,
      gap: 12,
      marginTop: 6,
      ...shadow,
    },
    shareMeta: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700" as const,
    },
  };
}
