import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Choice, FadeIn, Progress, Screen } from "../../components/ui";
import {
  quizDimensionLabels,
  type QuizAnswer,
} from "../../data/quiz";
import { usePrototype } from "../../context/PrototypeContext";
import { useNeurodivergent } from "../../context/NeurodivergentContext";
import { fonts, type AppColors } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { profileRepository } from "../../services/profileRepository";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { hapticService } from "../../services/hapticService";
import { vibeQuestionsForMode } from "../../lib/quizPaths";

/**
 * WHAT: Onboarding Vibe path (`/onboarding/quiz`) — scene-by-scene weather answers.
 * WHY: Collect social-weather answers for archetype mix. Demo / ND use short (~10);
 *   real account onboarding defaults deep (100) unless ND/reduced stimulation.
 * CONSENT: Each Choice is `onboard_vibe_answer` (inform). Weather only — never
 *   consent to touch, safety score, auto-match, or dual-seal.
 * EDGE CASES:
 *   - Empty question bank → recovery copy (no blank dead end).
 *   - Real user: hydrate draft answers + index from profileRepository; filter unknown ids.
 *   - Mode switch mid-session: clamp index into new length.
 *   - Re-tap same answer still advances after delay (choose always advances).
 *   - First scene: Back control absent (placeholder) — no About You via this back.
 *   - Reduce Motion: advance delay 0ms (else 140ms presence pause).
 * NEVER: score_as_safety; auto_match_from_vibe; “correct” answers; Soft Signal required here.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §6 · CONSENT_POINTS.onboard_vibe_answer · quizPaths
 */
export default function QuizScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { answers, setAnswer, hydrateAnswers } = usePrototype();
  const { user, status } = useAuth();
  const { prefs, reducedStimulation } = useNeurodivergent();

  // Demo, ND Mode, or reduced stimulation → short calm path (~10).
  // Real account with ND off → deep first pass. Short+Deep remain under Quizzes anytime.
  // Mode selection is comfort/load — NEVER consent weight or safety ranking.
  const useShortPath =
    status === "demo" || prefs.enabled || reducedStimulation;
  const questions = useMemo(
    () => vibeQuestionsForMode(useShortPath ? "short" : "deep"),
    [useShortPath],
  );

  const [index, setIndex] = useState(0);
  // Fail-closed index clamp: never read past end if set changes under us.
  const safeIndex = Math.min(index, Math.max(0, questions.length - 1));
  const question = questions[safeIndex];
  const total = questions.length;
  const themeLabel = question ? quizDimensionLabels[question.dimension] : "";

  useEffect(() => {
    // Keep index in range if the short/deep set changes mid-session.
    setIndex((i) => Math.min(i, Math.max(0, questions.length - 1)));
  }, [questions.length]);

  useEffect(() => {
    // Real accounts only: resume draft. Demo has no user → memory-only path.
    if (!user) return;
    profileRepository
      .getProgress(user.id)
      .then(({ draftProfile }) => {
        const saved = draftProfile.quizAnswers;
        if (Array.isArray(saved)) {
          // Drop answers for questions not in current mode bank (short vs deep).
          const known = new Set(questions.map((q) => q.id));
          const filtered = (saved as typeof answers).filter((item) =>
            known.has(item.questionId),
          );
          hydrateAnswers(filtered);
          setIndex(
            Math.min(
              Number(draftProfile.questionIndex ?? 0),
              Math.max(0, questions.length - 1),
            ),
          );
        }
      })
      // Silent fail: draft is convenience, not eligibility. Never block quiz on network.
      .catch(() => undefined);
  }, [user?.id, questions]);

  // Empty bank recovery — no silent blank screen (product law: no dead ends).
  if (!question || total === 0) {
    return (
      <Screen>
        <Text style={styles.prompt} accessibilityRole="header">
          Vibe scenes could not load.
        </Text>
        <Text style={styles.note}>
          Try again from About you, or open Short / Deep anytime under Quizzes.
        </Text>
      </Screen>
    );
  }

  const selected = answers.find(
    (item) => item.questionId === question.id,
  )?.answerId;

  /**
   * WHAT: Fire-and-forget draft save for real users (answers + index + step label).
   * WHY: Resume after kill mid-quiz; demo has no user so this is a no-op.
   * CONSENT: Persist weather draft only — not consent, not adult eligibility.
   * EDGE CASES: Network errors swallowed; never surface as hard fail mid-flow.
   * NEVER: Log answer content as “safety evidence”; complete onboarding flag here.
   * SEE: docs/ONBOARDING_CONSENT_FLOW.md §6.3 · profileRepository.saveProgress
   */
  const persist = (
    updated: typeof answers,
    nextIndex: number,
    step: "vibe_quiz" | "vibe_result",
  ) => {
    // Demo / no session: PrototypeContext memory only.
    if (!user) return;
    void profileRepository
      .saveProgress(user.id, step, {
        quizAnswers: updated,
        questionIndex: nextIndex,
      })
      .catch(() => undefined);
  };

  /**
   * WHAT: Records one scene answer, presence haptic, optional draft save, advances.
   * WHY: Immediate visual selection + short delay (unless reduced motion) before next
   *   scene supports motor intentionality without grant-arm dwell (inform, not seal).
   * CONSENT: `onboard_vibe_answer` — inform. Replacing an answer for the same questionId
   *   is allowed; never seals snapshot or grants touch.
   * EDGE CASES:
   *   - Last scene → replace to result (no stack back into last question as “still taking”).
   *   - delay 0 when reducedMotion; else 140ms.
   *   - Re-tap same Choice still advances (choose always advances).
   * NEVER: Rank “more evolved” answers; auto-match; treat vibe as session yes.
   * SEE: docs/ONBOARDING_CONSENT_FLOW.md §6.3 · CONSENT_POINTS.onboard_vibe_answer
   */
  const choose = (answer: QuizAnswer) => {
    const selectedAnswer = {
      questionId: question.id,
      answerId: answer.id,
      scores: answer.scores,
    };
    setAnswer(selectedAnswer);
    // Presence haptic (spec) — not confirmation-of-consent.
    void hapticService.play("presence");
    const updated = [
      ...answers.filter((item) => item.questionId !== question.id),
      selectedAnswer,
    ];
    const isLast = safeIndex === total - 1;
    persist(
      updated,
      isLast ? total : safeIndex + 1,
      isLast ? "vibe_result" : "vibe_quiz",
    );
    // 140ms: brief selected-state visibility. 0 under Reduce Motion. Not grant arm (320ms).
    const delay = reducedMotion ? 0 : 140;
    setTimeout(() => {
      if (isLast) router.replace("/onboarding/result");
      else setIndex((value) => value + 1);
    }, delay);
  };

  /**
   * WHAT: Moves to previous scene without clearing prior answer.
   * WHY: Allow revise; re-persist index for real-user draft resume.
   * CONSENT: Navigation within inform path only.
   * EDGE CASES: safeIndex <= 0 → no-op (first scene has no back control).
   * NEVER: Clear answers on back; navigate to About You from this control.
   * SEE: docs/ONBOARDING_CONSENT_FLOW.md §6.3
   */
  const goBack = () => {
    if (safeIndex <= 0) return;
    const next = safeIndex - 1;
    setIndex(next);
    persist(answers, next, "vibe_quiz");
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        {safeIndex > 0 ? (
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous question"
            hitSlop={10}
            style={({ pressed }) => [
              styles.back,
              pressed && styles.backPressed,
            ]}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        ) : (
          // Layout placeholder so counter stays right-aligned on first scene.
          <View style={styles.backPlaceholder} />
        )}
        <Text style={styles.count}>
          {safeIndex + 1} / {total}
        </Text>
      </View>
      <Progress current={safeIndex + 1} total={total} />
      <Text style={styles.theme} accessibilityLabel={`Theme: ${themeLabel}`}>
        {themeLabel}
      </Text>
      {/* Mode copy always repeats: never consent to touch. */}
      {useShortPath ? (
        <Text style={styles.hint}>
          Short calm path for demo / Neurodivergent Mode ({total} scenes). Full
          Deep Vibe (100) is under Quizzes anytime — never consent to touch.
        </Text>
      ) : (
        <Text style={styles.hint}>
          Deep first pass ({total} scenes). Prefer a lighter start? Short Vibe
          is under Quizzes — never consent to touch.
        </Text>
      )}
      <FadeIn key={question.id}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{question.kicker}</Text>
          <Text style={styles.prompt} accessibilityRole="header">
            {question.prompt}
          </Text>
        </View>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {question.answers.map((answer) => (
            <Choice
              key={answer.id}
              {...answer}
              selected={selected === answer.id}
              onPress={() => choose(answer)}
            />
          ))}
        </View>
      </FadeIn>
      <Text style={styles.note}>
        {useShortPath
          ? "A soft first pass — not a diagnosis. No answer is more evolved."
          : "One hundred light scenes — not a diagnosis. No answer is more evolved. You can leave and resume anytime under Quizzes."}
      </Text>
    </Screen>
  );
}

/**
 * WHAT: Theme styles for quiz chrome (back, progress, options, footer note).
 * WHY: Stable layout for short/deep lengths and VoiceOver radiogroup.
 * CONSENT: Not a consent surface.
 * EDGE CASES: none — pure style factory.
 * NEVER: Color-only “correct answer” styling (no answer is more evolved).
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §6
 */
function makeStyles(colors: AppColors) {
  return {
    topRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      minHeight: 28,
    },
    back: { paddingVertical: 4, paddingRight: 8 },
    backPressed: { opacity: 0.7 },
    backPlaceholder: { width: 64 },
    backText: {
      color: colors.moss,
      fontSize: 15,
      fontWeight: "700" as const,
    },
    count: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700" as const,
    },
    theme: {
      color: colors.plum,
      fontSize: 12,
      fontWeight: "700" as const,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
      marginTop: 8,
    },
    hint: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 8,
      marginBottom: 4,
    },
    header: { gap: 8, marginTop: 8, marginBottom: 20 },
    kicker: { color: colors.muted, fontSize: 14, fontWeight: "600" as const },
    prompt: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 30,
      lineHeight: 36,
    },
    options: { gap: 10 },
    note: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center" as const,
      marginTop: "auto" as const,
    },
  };
}
