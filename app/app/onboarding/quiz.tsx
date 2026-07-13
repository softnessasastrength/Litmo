import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Choice, FadeIn, Progress, Screen } from "../../components/ui";
import {
  quizDimensionLabels,
  quizQuestions,
  type QuizAnswer,
} from "../../data/quiz";
import { usePrototype } from "../../context/PrototypeContext";
import { fonts, type AppColors } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { profileRepository } from "../../services/profileRepository";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { hapticService } from "../../services/hapticService";

export default function QuizScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { answers, setAnswer, hydrateAnswers } = usePrototype();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const question = quizQuestions[index];
  const total = quizQuestions.length;
  const themeLabel = question ? quizDimensionLabels[question.dimension] : "";

  useEffect(() => {
    if (!user) return;
    profileRepository
      .getProgress(user.id)
      .then(({ draftProfile }) => {
        const saved = draftProfile.quizAnswers;
        if (Array.isArray(saved)) {
          const known = new Set(quizQuestions.map((q) => q.id));
          const filtered = (saved as typeof answers).filter((item) =>
            known.has(item.questionId),
          );
          hydrateAnswers(filtered);
          setIndex(
            Math.min(
              Number(draftProfile.questionIndex ?? 0),
              quizQuestions.length - 1,
            ),
          );
        }
      })
      .catch(() => undefined);
  }, [user?.id]);

  if (!question) return null;

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
    const isLast = index === total - 1;
    persist(
      updated,
      isLast ? total : index + 1,
      isLast ? "vibe_result" : "vibe_quiz",
    );
    const delay = reducedMotion ? 0 : 140;
    setTimeout(() => {
      if (isLast) router.replace("/onboarding/result");
      else setIndex((value) => value + 1);
    }, delay);
  };

  const goBack = () => {
    if (index <= 0) return;
    const next = index - 1;
    setIndex(next);
    persist(answers, next, "vibe_quiz");
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        {index > 0 ? (
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
          {index + 1} / {total}
        </Text>
      </View>
      <Progress current={index + 1} total={total} />
      <Text style={styles.theme} accessibilityLabel={`Theme: ${themeLabel}`}>
        {themeLabel}
      </Text>
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
        One hundred light scenes — not a diagnosis. No answer is more evolved.
        You can leave and resume anytime.
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
