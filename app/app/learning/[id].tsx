import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { findLearningModule } from "../../data/learningModules";
import { getQuizEntry } from "../../data/quizCatalog";
import { hapticService } from "../../services/hapticService";
import { learningProgressService } from "../../services/learningProgress";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function LearningModuleScreen() {
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const module = useMemo(() => findLearningModule(id), [id]);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const presencePlayedRef = useRef(false);
  const attentionStepRef = useRef<number | null>(null);

  useEffect(() => {
    if (!module) return;
    let active = true;
    presencePlayedRef.current = false;
    attentionStepRef.current = null;
    void learningProgressService.load().then((progress) => {
      if (!active) return;
      const saved = progress[module.id];
      setStepIndex(saved?.completed ? 0 : (saved?.stepIndex ?? 0));
      setLoaded(true);
      // presence once per module entry — not on resume of progress alone after rerender.
      if (!presencePlayedRef.current) {
        presencePlayedRef.current = true;
        void hapticService.play("presence");
      }
    });
    return () => {
      active = false;
    };
  }, [module]);

  const completedView =
    Boolean(module) && stepIndex >= (module?.steps.length ?? 0);
  const step = module && !completedView ? module.steps[stepIndex] : undefined;
  const hasScenario = Boolean(step?.scenario);

  // attention once when landing on a consent-critical scenario step.
  useEffect(() => {
    if (!loaded || !module || !hasScenario) return;
    if (attentionStepRef.current === stepIndex) return;
    attentionStepRef.current = stepIndex;
    void hapticService.play("attention");
  }, [loaded, module, stepIndex, hasScenario]);

  if (!module) {
    return (
      <View style={styles.missing}>
        <Text style={styles.title} accessibilityRole="header">
          Module unavailable
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.secondaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // Capture after the null check so nested async handlers keep a defined type.
  const current = module;

  async function advanceFromStep() {
    if (!step) return;
    const canContinue = !step.scenario || selectedOption !== null;
    if (!canContinue) return;
    const stepId = step.id;
    // Fictional Soft Signal practice: acknowledge local stop registration only.
    if (stepId === "scenario-response" || stepId === "practice-soft-signal") {
      void hapticService.play("softSignal");
    }
    const isLast = stepIndex === current.steps.length - 1;
    if (isLast) {
      await learningProgressService.complete(current.id, current.steps.length);
      void hapticService.play("confirmation");
      // Stay on screen so optional related quiz is one calm tap away.
      setStepIndex(current.steps.length);
      return;
    }
    const next = stepIndex + 1;
    await learningProgressService.recordStep(
      current.id,
      next,
      current.steps.length,
    );
    setSelectedOption(null);
    setStepIndex(next);
  }

  async function goBackStep() {
    if (completedView) {
      setStepIndex(current.steps.length - 1);
      return;
    }
    if (stepIndex === 0) {
      router.back();
      return;
    }
    const previous = stepIndex - 1;
    await learningProgressService.recordStep(
      current.id,
      previous,
      current.steps.length,
    );
    setSelectedOption(null);
    setStepIndex(previous);
  }

  if (completedView) {
    const relatedQuiz = current.relatedQuizId
      ? getQuizEntry(current.relatedQuizId)
      : null;
    return (
      <>
        <Stack.Screen
          options={{ title: current.title, headerBackTitle: "Learn" }}
        />
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.progress}>MODULE COMPLETE · PRIVATE</Text>
          <Text style={styles.title} accessibilityRole="header">
            Soft close.
          </Text>
          <Text style={styles.body}>
            You finished “{current.title}.” Progress stays on this device only.
            Completing a module never certifies readiness, safety, or consent
            skill — it is practice with language.
          </Text>
          <View style={styles.takeaway}>
            <Text style={styles.takeawayLabel}>REMEMBER</Text>
            <Text style={styles.takeawayText}>
              You can revisit anytime. Rest is allowed. Real sessions still need
              real, current mutual consent.
            </Text>
          </View>
          {relatedQuiz ? (
            <View style={styles.relatedCard}>
              <Text style={styles.relatedTitle}>Optional private quiz</Text>
              <Text style={styles.relatedBody}>
                {current.relatedQuizPrompt ??
                  `${relatedQuiz.title} is available if you want a soft mirror — never required.`}
              </Text>
              <Text style={styles.relatedMeta}>
                {relatedQuiz.title} · ~{relatedQuiz.minutes} min · never
                consent
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Opens a private quiz. Results are never consent to touch."
                onPress={() =>
                  router.push({
                    pathname: "/quizzes/play",
                    params: { quizId: relatedQuiz.id },
                  } as never)
                }
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  Try {relatedQuiz.title}
                </Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={() => void goBackStep()}
              style={styles.secondaryButton}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Review last step</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace("/(tabs)/learn" as never)}
              style={styles.primaryButton}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Back to Learn</Text>
            </Pressable>
          </View>
        </ScrollView>
      </>
    );
  }

  if (!step) {
    return (
      <View style={styles.missing}>
        <Text style={styles.title} accessibilityRole="header">
          Lesson step unavailable
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.secondaryButton}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isLast = stepIndex === current.steps.length - 1;
  const canContinue = !step.scenario || selectedOption !== null;

  return (
    <>
      <Stack.Screen
        options={{ title: current.title, headerBackTitle: "Learn" }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.progress}>
          STEP {stepIndex + 1} OF {current.steps.length}
          {current.track === "lived-lessons" ? " · LIVED LESSON" : ""}
        </Text>
        <View
          style={styles.track}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${stepIndex + 1} of ${current.steps.length}`}
          accessibilityValue={{
            min: 1,
            max: current.steps.length,
            now: stepIndex + 1,
          }}
        >
          <View
            style={[
              styles.fill,
              {
                width: `${((stepIndex + 1) / current.steps.length) * 100}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {step.title}
        </Text>
        <Text style={styles.body}>{step.body}</Text>

        <View style={styles.takeaway}>
          <Text style={styles.takeawayLabel}>REMEMBER</Text>
          <Text style={styles.takeawayText}>{step.takeaway}</Text>
        </View>

        {step.scenario ? (
          <View style={styles.scenario}>
            <Text style={styles.scenarioPrompt}>{step.scenario.prompt}</Text>
            {step.scenario.options.map((option, index) => {
              const selected = selectedOption === index;
              return (
                <Pressable
                  key={option.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedOption(index)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      selected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selected ? (
                    <Text style={styles.feedback}>{option.feedback}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={() => void goBackStep()}
            style={styles.secondaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>
              {stepIndex === 0 ? "Exit" : "Back"}
            </Text>
          </Pressable>
          <Pressable
            disabled={!canContinue || !loaded}
            onPress={() => void advanceFromStep()}
            style={[
              styles.primaryButton,
              (!canContinue || !loaded) && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue || !loaded }}
          >
            <Text style={styles.primaryButtonText}>
              {isLast ? "Complete module" : "Continue"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

function makeStyles(colors: AppColors) {
  return {
    container: {
      padding: 24,
      paddingBottom: 48,
      backgroundColor: colors.cream,
      gap: 20,
      flexGrow: 1,
    },
    missing: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: colors.cream,
      gap: 20,
    },
    progress: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.3,
    },
    track: {
      height: 7,
      borderRadius: radius.pill,
      backgroundColor: colors.line,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      backgroundColor: colors.moss,
      borderRadius: radius.pill,
    },
    title: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 40,
      lineHeight: 44,
    },
    body: { color: colors.ink, fontSize: 18, lineHeight: 28 },
    takeaway: {
      backgroundColor: colors.mossSoft,
      borderRadius: radius.md,
      padding: 18,
      gap: 7,
    },
    takeawayLabel: {
      color: colors.moss,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.2,
    },
    takeawayText: {
      color: colors.moss,
      fontSize: 17,
      lineHeight: 24,
      fontWeight: "600",
    },
    scenario: { gap: 12 },
    scenarioPrompt: {
      color: colors.ink,
      fontWeight: "700",
      fontSize: 17,
      lineHeight: 24,
    },
    option: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      padding: 16,
      gap: 9,
    },
    optionSelected: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    optionLabel: { color: colors.ink, fontSize: 16, fontWeight: "600" },
    optionLabelSelected: { color: colors.moss },
    feedback: { color: colors.moss, fontSize: 14, lineHeight: 20 },
    relatedCard: {
      backgroundColor: colors.paper,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.plum,
      padding: 18,
      gap: 10,
    },
    relatedTitle: {
      color: colors.plum,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
    },
    relatedBody: { color: colors.ink, fontSize: 16, lineHeight: 24 },
    relatedMeta: { color: colors.muted, fontSize: 13, lineHeight: 18 },
    actions: { flexDirection: "row", gap: 12, marginTop: "auto" },
    primaryButton: {
      flex: 1,
      backgroundColor: colors.moss,
      borderRadius: radius.pill,
      paddingVertical: 16,
      alignItems: "center",
    },
    primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.moss,
      borderRadius: radius.pill,
      paddingVertical: 16,
      paddingHorizontal: 22,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: colors.moss,
      fontSize: 16,
      fontWeight: "700",
    },
    disabled: { opacity: 0.45 },
  };
}
