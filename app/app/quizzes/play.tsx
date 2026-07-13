import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Choice, FadeIn, Progress, Screen } from "../../components/ui";
import { getQuizEntry } from "../../data/quizCatalog";
import type { QuizAnswer } from "../../data/quiz";
import type { AnswerScores } from "../../lib/quizScoring";
import { runQuizModel, topInsights } from "../../lib/quizScoring";
import { quizResultsRepository } from "../../services/quizResultsRepository";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { hapticService } from "../../services/hapticService";

export default function QuizPlayScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const entry = getQuizEntry(String(quizId ?? ""));
  const questions = useMemo(() => entry?.questions() ?? [], [entry]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerScores[]>([]);
  const advancing = useRef(false);

  if (!entry || questions.length === 0) {
    return (
      <Screen>
        <Text style={styles.prompt} accessibilityRole="header">
          That quiz could not be found.
        </Text>
        <Text style={styles.note}>
          Return to Quizzes and choose a short or deep Vibe path, or another
          self-understanding quiz.
        </Text>
        <Pressable
          onPress={() => router.replace("/(tabs)/quizzes" as never)}
          accessibilityRole="button"
          accessibilityLabel="Back to Quizzes"
          hitSlop={12}
          style={({ pressed }) => [styles.exitLink, pressed && styles.pressed]}
        >
          <Text style={styles.back}>← Back to Quizzes</Text>
        </Pressable>
      </Screen>
    );
  }

  const question = questions[index]!;
  const selected = answers.find((a) => a.questionId === question.id)?.answerId;
  const total = questions.length;

  const goBack = () => {
    if (advancing.current) return;
    if (index > 0) {
      setIndex((v) => Math.max(0, v - 1));
      return;
    }
    router.back();
  };

  const choose = (answer: QuizAnswer) => {
    if (advancing.current) return;
    advancing.current = true;

    const selectedAnswer: AnswerScores = {
      questionId: question.id,
      answerId: answer.id,
      scores: answer.scores,
    };
    const updated = [
      ...answers.filter((a) => a.questionId !== question.id),
      selectedAnswer,
    ];
    setAnswers(updated);
    void hapticService.play("presence");

    const isLast = index === total - 1;
    // Reduced motion: advance immediately — no artificial pause.
    const delay = reducedMotion ? 0 : 140;

    const advance = () => {
      if (!isLast) {
        setIndex((v) => v + 1);
        advancing.current = false;
        return;
      }
      const model = runQuizModel(updated);
      const notes = topInsights(model, 5).map((i) => i.text);
      void quizResultsRepository
        .saveResult({
          quizId: entry.id,
          primary: model.primary,
          secondary: model.secondary,
          mixPercent: model.mixPercent,
          notes,
          completedAt: new Date().toISOString(),
          modeLabel: entry.title,
        })
        .then(() => {
          router.replace({
            pathname: "/quizzes/result",
            params: { quizId: entry.id },
          } as never);
        })
        .finally(() => {
          advancing.current = false;
        });
    };

    if (delay === 0) {
      advance();
    } else {
      setTimeout(advance, delay);
    }
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={
            index > 0 ? "Previous question" : "Leave quiz and go back"
          }
          hitSlop={12}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.back}>{index > 0 ? "← Back" : "← Leave"}</Text>
        </Pressable>
        <Text
          style={styles.count}
          accessibilityLabel={`Question ${index + 1} of ${total}`}
        >
          {index + 1} / {total}
        </Text>
      </View>

      <Progress current={index + 1} total={total} />

      <Text style={styles.kicker}>{entry.title}</Text>

      <FadeIn key={question.id}>
        {question.kicker ? (
          <Text style={styles.scene}>{question.kicker}</Text>
        ) : null}
        <Text style={styles.prompt} accessibilityRole="header">
          {question.prompt}
        </Text>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {question.answers.map((answer) => (
            <Choice
              key={answer.id}
              label={answer.label}
              detail={answer.detail}
              glyph={answer.glyph}
              selected={selected === answer.id}
              onPress={() => choose(answer)}
            />
          ))}
        </View>
      </FadeIn>

      <View style={styles.disclaimerBlock} accessible>
        <Text style={styles.disclaimerTitle}>Soft reminder</Text>
        <Text style={styles.note}>{entry.disclaimer}</Text>
      </View>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    topRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      minHeight: 44,
    },
    back: {
      color: colors.moss,
      fontWeight: "700" as const,
      fontSize: 16,
      minHeight: 24,
    },
    exitLink: { marginTop: 16, alignSelf: "flex-start" as const },
    pressed: { opacity: 0.7 },
    count: {
      color: colors.muted,
      fontWeight: "700" as const,
      fontSize: 13,
    },
    kicker: {
      color: colors.plum,
      fontSize: 13,
      fontWeight: "800" as const,
      marginTop: 10,
      textTransform: "uppercase" as const,
      letterSpacing: 0.6,
    },
    scene: { color: colors.muted, fontSize: 14, marginTop: 10, lineHeight: 20 },
    prompt: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 30,
      lineHeight: 36,
      marginTop: 6,
      marginBottom: 18,
    },
    options: { gap: 10 },
    disclaimerBlock: {
      marginTop: "auto" as const,
      paddingTop: 16,
      gap: 4,
      alignItems: "center" as const,
    },
    disclaimerTitle: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "800" as const,
      letterSpacing: 0.5,
      textTransform: "uppercase" as const,
    },
    note: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center" as const,
    },
  };
}
