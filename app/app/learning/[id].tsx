import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { findLearningModule } from "../../data/learningModules";
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

  const step = module?.steps[stepIndex];
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
        <Text style={styles.title}>Module unavailable</Text>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // Capture after the null check so nested async handlers keep a defined type.
  const current = module;
  if (!step) {
    return (
      <View style={styles.missing}>
        <Text style={styles.title}>Lesson step unavailable</Text>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isLast = stepIndex === current.steps.length - 1;
  const canContinue = !step.scenario || selectedOption !== null;
  const stepId = step.id;

  async function advance() {
    if (!canContinue) return;
    // Fictional Soft Signal practice: acknowledge local stop registration only.
    if (stepId === "scenario-response" || stepId === "practice-soft-signal") {
      void hapticService.play("softSignal");
    }
    if (isLast) {
      await learningProgressService.complete(current.id, current.steps.length);
      void hapticService.play("confirmation");
      router.replace("/(tabs)/learn");
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
  const styles = useThemedStyles(makeStyles);
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

  return (
    <>
      <Stack.Screen
        options={{ title: current.title, headerBackTitle: "Learn" }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.progress}>
          STEP {stepIndex + 1} OF {current.steps.length}
        </Text>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
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

        <Text style={styles.title}>{step.title}</Text>
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
          >
            <Text style={styles.secondaryButtonText}>
              {stepIndex === 0 ? "Exit" : "Back"}
            </Text>
          </Pressable>
          <Pressable
            disabled={!canContinue || !loaded}
            onPress={() => void advance()}
            style={[
              styles.primaryButton,
              (!canContinue || !loaded) && styles.disabled,
            ]}
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
  secondaryButtonText: { color: colors.moss, fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.45 },
};
}

