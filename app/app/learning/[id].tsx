import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { findLearningModule } from "../../data/learningModules";
import { getQuizEntry } from "../../data/quizCatalog";
import { useNeurodivergent } from "../../context/NeurodivergentContext";
import { clearLanguage } from "../../lib/clearLanguage";
import { hapticService } from "../../services/hapticService";
import { learningProgressService } from "../../services/learningProgress";
import { speechService } from "../../services/speechService";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function LearningModuleScreen() {
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    prefs,
    reducedStimulation,
    voiceAids,
    easySaves,
    oneAtATime,
    progressiveDisclosure,
    easyBreaks,
  } = useNeurodivergent();
  const module = useMemo(() => findLearningModule(id), [id]);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState("");
  const [showBodyMore, setShowBodyMore] = useState(false);
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
        // Presence haptic skipped under reduced stimulation / ND mode.
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
    if (!loaded || !module || !hasScenario || reducedStimulation) return;
    if (attentionStepRef.current === stepIndex) return;
    attentionStepRef.current = stepIndex;
    void hapticService.play("attention");
  }, [loaded, module, stepIndex, hasScenario, reducedStimulation]);

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
    setShowBodyMore(false);
    setVoiceDraft("");
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
  const plain = prefs.clearLanguage;
  const stepTotal = current.steps.length;
  const progressLabel = plain
    ? clearLanguage.progressLearn(stepIndex + 1, stepTotal)
    : `Step ${stepIndex + 1} of ${stepTotal} · ${Math.round(((stepIndex + 1) / stepTotal) * 100)}% · ${Math.max(0, stepTotal - stepIndex - 1)} left`;

  // Progressive disclosure: shorter body until expanded
  const bodyText =
    progressiveDisclosure && !showBodyMore && step.body.length > 220
      ? `${step.body.slice(0, 200).trim()}…`
      : step.body;

  const takeBreak = () => {
    router.replace("/(tabs)/learn" as never);
  };

  const readStep = () => {
    const opts =
      step.scenario?.options
        .map((o, i) => `Option ${i + 1}: ${o.label}.`)
        .join(" ") ?? "";
    void speechService.speak(
      [
        clearLanguage.learningProgress(stepIndex + 1, current.steps.length),
        step.title,
        step.body,
        `Remember: ${step.takeaway}`,
        step.scenario ? `Question: ${step.scenario.prompt}. ${opts}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  };

  return (
    <>
      <Stack.Screen
        options={{ title: current.title, headerBackTitle: "Learn" }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {prefs.enabled ? (
          <Text style={styles.ndHint}>
            {plain
              ? clearLanguage.ndModeOn
              : "Neurodivergent Mode: larger text, your pace, clear progress, easy breaks, progressive detail, voice aids."}
          </Text>
        ) : null}
        <Text style={styles.progress} accessibilityLabel={progressLabel}>
          {progressLabel.toUpperCase()}
          {!plain && current.track === "lived-lessons" ? " · LIVED" : ""}
        </Text>
        <View
          style={styles.track}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={progressLabel}
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

        {easyBreaks ? (
          <Pressable
            onPress={takeBreak}
            style={styles.breakBtn}
            accessibilityRole="button"
            accessibilityLabel={clearLanguage.takeBreak}
            accessibilityHint={clearLanguage.breakSaved}
          >
            <Text style={styles.breakBtnText}>
              {plain ? clearLanguage.takeBreak : "☕ Take a break (saved)"}
            </Text>
          </Pressable>
        ) : null}

        {prefs.easyNavigation || oneAtATime ? (
          <View style={styles.jumpRow}>
            <Pressable
              onPress={() => setJumpOpen((v) => !v)}
              style={styles.jumpToggle}
              accessibilityRole="button"
              accessibilityLabel={
                jumpOpen ? "Hide step list" : "Show step list"
              }
            >
              <Text style={styles.jumpToggleText}>
                {jumpOpen ? "Hide jump list" : "Jump to step"}
              </Text>
            </Pressable>
            {prefs.readAloud ? (
              <Pressable
                onPress={readStep}
                style={styles.jumpToggle}
                accessibilityRole="button"
                accessibilityLabel={clearLanguage.learningReadAloud}
              >
                <Text style={styles.jumpToggleText}>
                  {plain ? clearLanguage.learningReadAloud : "Read aloud"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : prefs.readAloud ? (
          <Pressable
            onPress={readStep}
            style={styles.jumpToggle}
            accessibilityRole="button"
            accessibilityLabel={clearLanguage.learningReadAloud}
          >
            <Text style={styles.jumpToggleText}>
              {plain ? clearLanguage.learningReadAloud : "Read aloud"}
            </Text>
          </Pressable>
        ) : null}

        {jumpOpen && prefs.easyNavigation ? (
          <View style={styles.jumpList}>
            {current.steps.map((s, i) => (
              <Pressable
                key={s.id}
                onPress={() => {
                  setStepIndex(i);
                  setSelectedOption(null);
                  setShowBodyMore(false);
                  setJumpOpen(false);
                }}
                style={[
                  styles.jumpChip,
                  i === stepIndex && styles.jumpChipActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Step ${i + 1}: ${s.title}`}
              >
                <Text style={styles.jumpChipText}>{i + 1}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text
          style={[styles.title, plain && styles.titlePlain]}
          accessibilityRole="header"
        >
          {step.title}
        </Text>
        <Text style={[styles.body, plain && styles.bodyPlain]}>{bodyText}</Text>
        {progressiveDisclosure && step.body.length > 220 ? (
          <Pressable
            onPress={() => setShowBodyMore((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={
              showBodyMore ? clearLanguage.hideDetail : clearLanguage.showDetail
            }
          >
            <Text style={styles.discloseText}>
              {showBodyMore ? clearLanguage.hideDetail : clearLanguage.showDetail}
            </Text>
          </Pressable>
        ) : null}

        {(!progressiveDisclosure ||
          showBodyMore ||
          selectedOption !== null ||
          !step.scenario) && (
          <View style={styles.takeaway}>
            <Text style={styles.takeawayLabel}>REMEMBER</Text>
            <Text style={styles.takeawayText}>{step.takeaway}</Text>
          </View>
        )}

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
                  onPress={() => {
                    setSelectedOption(index);
                    setVoiceDraft("");
                  }}
                  style={[
                    styles.option,
                    selected && styles.optionSelected,
                    plain && styles.optionPlain,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      selected && styles.optionLabelSelected,
                    ]}
                  >
                    {oneAtATime || prefs.easyNavigation
                      ? `${index + 1}. ${option.label}`
                      : option.label}
                  </Text>
                  {selected ? (
                    <Text style={styles.feedback}>{option.feedback}</Text>
                  ) : null}
                </Pressable>
              );
            })}
            {voiceAids && step.scenario.options.length > 0 ? (
              <View style={styles.voiceBlock}>
                <Text style={styles.voiceHint}>
                  {plain
                    ? clearLanguage.quizVoiceHint
                    : "Type or dictate option number (1, 2, 3…), then Go. Or tap a button."}
                </Text>
                <View style={styles.voiceRow}>
                  <TextInput
                    value={voiceDraft}
                    onChangeText={setVoiceDraft}
                    keyboardType="number-pad"
                    placeholder={
                      plain
                        ? clearLanguage.quizVoicePlaceholder
                        : "Option number"
                    }
                    placeholderTextColor={styles.placeholder.color}
                    style={styles.voiceInput}
                    accessibilityLabel="Choose scenario option by number"
                    returnKeyType="go"
                    onSubmitEditing={() => {
                      const n = Number.parseInt(voiceDraft.trim(), 10);
                      if (
                        Number.isFinite(n) &&
                        n >= 1 &&
                        n <= step.scenario!.options.length
                      ) {
                        setSelectedOption(n - 1);
                        setVoiceDraft("");
                      }
                    }}
                  />
                  <Pressable
                    onPress={() => {
                      const n = Number.parseInt(voiceDraft.trim(), 10);
                      if (
                        Number.isFinite(n) &&
                        n >= 1 &&
                        n <= step.scenario!.options.length
                      ) {
                        setSelectedOption(n - 1);
                        setVoiceDraft("");
                      }
                    }}
                    style={styles.voiceGo}
                    accessibilityRole="button"
                    accessibilityLabel="Submit option number"
                  >
                    <Text style={styles.voiceGoText}>Go</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {easySaves ? (
          <Text style={styles.savedHint} accessibilityLiveRegion="polite">
            {plain
              ? "Your place in this module saves on this device."
              : "Progress saves privately on this device as you go."}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={() => void goBackStep()}
            style={styles.secondaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>
              {stepIndex === 0 ? "Exit" : plain ? "Previous" : "Back"}
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
              {isLast
                ? plain
                  ? "Finish module"
                  : "Complete module"
                : plain
                  ? "Next"
                  : "Continue"}
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
    ndHint: {
      color: colors.moss,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600",
    },
    track: {
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.line,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      backgroundColor: colors.moss,
      borderRadius: radius.pill,
    },
    jumpRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    jumpToggle: {
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
    },
    jumpToggleText: {
      color: colors.moss,
      fontWeight: "700",
      fontSize: 14,
    },
    jumpList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    jumpChip: {
      minWidth: 44,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.paper,
    },
    jumpChipActive: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    jumpChipText: { color: colors.ink, fontWeight: "700", fontSize: 14 },
    breakBtn: {
      alignSelf: "flex-start",
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      marginBottom: 4,
    },
    breakBtnText: {
      color: colors.moss,
      fontWeight: "700",
      fontSize: 14,
    },
    discloseText: {
      color: colors.moss,
      fontWeight: "700",
      fontSize: 14,
      textDecorationLine: "underline",
      marginBottom: 8,
    },
    title: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 40,
      lineHeight: 44,
    },
    titlePlain: { fontSize: 32, lineHeight: 38 },
    body: { color: colors.ink, fontSize: 18, lineHeight: 28 },
    bodyPlain: { fontSize: 18, lineHeight: 30 },
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
      minHeight: 56,
    },
    optionPlain: { minHeight: 64, padding: 18 },
    optionSelected: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    optionLabel: { color: colors.ink, fontSize: 16, fontWeight: "600" },
    optionLabelSelected: { color: colors.moss },
    feedback: { color: colors.moss, fontSize: 14, lineHeight: 20 },
    voiceBlock: { gap: 8, marginTop: 4 },
    voiceHint: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    voiceRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    voiceInput: {
      flex: 1,
      minHeight: 52,
      borderWidth: 1.5,
      borderColor: colors.line,
      borderRadius: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.paper,
      color: colors.ink,
      fontSize: 17,
    },
    placeholder: { color: colors.muted },
    voiceGo: {
      minWidth: 64,
      minHeight: 52,
      borderRadius: 12,
      backgroundColor: colors.moss,
      alignItems: "center",
      justifyContent: "center",
    },
    voiceGoText: {
      color: colors.white,
      fontWeight: "800",
      fontSize: 16,
    },
    savedHint: {
      color: colors.moss,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
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
