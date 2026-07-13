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
 * Onboarding Vibe path.
 * Demo / Neurodivergent Mode use the calm short (~10) set so the phone-visible
 * walkthrough stays light. Real account onboarding uses the full bank so
 * profile archetype remains a fuller first-pass signal — never consent.
 * Short + Deep are always available again under the Quizzes tab.
 */
export default function QuizScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { answers, setAnswer, hydrateAnswers } = usePrototype();
  const { user, status } = useAuth();
  const { prefs, reducedStimulation } = useNeurodivergent();

  const useShortPath =
    status === "demo" || prefs.enabled || reducedStimulation;
  const questions = useMemo(
    () => vibeQuestionsForMode(useShortPath ? "short" : "deep"),
    [useShortPath],
  );

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, questions.length - 1));
  const question = questions[safeIndex];
  const total = questions.length;
  const themeLabel = question ? quizDimensionLabels[question.dimension] : "";

  useEffect(() => {
    // Keep index in range if the short/deep set changes mid-session.
    setIndex((i) => Math.min(i, Math.max(0, questions.length - 1)));
  }, [questions.length]);

  useEffect(() => {
    if (!user) return;
    profileRepository
      .getProgress(user.id)
      .then(({ draftProfile }) => {
        const saved = draftProfile.quizAnswers;
        if (Array.isArray(saved)) {
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
      .catch(() => undefined);
  }, [user?.id, questions]);

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

  const persist = (
    updated: typeof answers,
    nextIndex: number,
    step: "vibe_quiz" | "vibe_result",
  ) => {
    if (!user) return;
    void profileRepository
      .saveProgress(user.id, step, {
        quizAnswers: updated,
        questionIndex: nextIndex,
      })
      .catch(() => undefined);
  };

  const choose = (answer: QuizAnswer) => {
    const selectedAnswer = {
      questionId: question.id,
      answerId: answer.id,
      scores: answer.scores,
    };
    setAnswer(selectedAnswer);
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
    const delay = reducedMotion ? 0 : 140;
    setTimeout(() => {
      if (isLast) router.replace("/onboarding/result");
      else setIndex((value) => value + 1);
    }, delay);
  };

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
