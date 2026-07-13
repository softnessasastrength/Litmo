import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Choice, FadeIn, Progress, Screen } from "../../components/ui";
import { getQuizEntry } from "../../data/quizCatalog";
import type { QuizAnswer } from "../../data/quiz";
import type { AnswerScores } from "../../lib/quizScoring";
import { runQuizModel, topInsights } from "../../lib/quizScoring";
import { quizResultsStore } from "../../services/quizResultsStore";
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

  if (!entry || questions.length === 0) {
    return (
      <Screen>
        <Text style={styles.prompt}>That quiz could not be found.</Text>
      </Screen>
    );
  }

  const question = questions[index]!;
  const selected = answers.find((a) => a.questionId === question.id)?.answerId;
  const total = questions.length;

  const choose = (answer: QuizAnswer) => {
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
    const delay = reducedMotion ? 0 : 140;
    setTimeout(() => {
      if (!isLast) {
        setIndex((v) => v + 1);
        return;
      }
      const model = runQuizModel(updated);
      const notes = topInsights(model, 5).map((i) => i.text);
      void quizResultsStore
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
        });
    }, delay);
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        {index > 0 ? (
          <Pressable
            onPress={() => setIndex((v) => Math.max(0, v - 1))}
            accessibilityRole="button"
            accessibilityLabel="Previous question"
            hitSlop={10}
          >
            <Text style={styles.back}>← Back</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Text style={styles.count}>
          {index + 1} / {total}
        </Text>
      </View>
      <Progress current={index + 1} total={total} />
      <Text style={styles.kicker}>{entry.title}</Text>
      <FadeIn key={question.id}>
        <Text style={styles.scene}>{question.kicker}</Text>
        <Text style={styles.prompt} accessibilityRole="header">
          {question.prompt}
        </Text>
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
      <Text style={styles.note}>{entry.disclaimer}</Text>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    topRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
    },
    back: { color: colors.moss, fontWeight: "700" as const, fontSize: 15 },
    count: { color: colors.muted, fontWeight: "700" as const, fontSize: 12 },
    kicker: {
      color: colors.plum,
      fontSize: 13,
      fontWeight: "800" as const,
      marginTop: 10,
      textTransform: "uppercase" as const,
      letterSpacing: 0.6,
    },
    scene: { color: colors.muted, fontSize: 14, marginTop: 10 },
    prompt: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 30,
      lineHeight: 36,
      marginTop: 6,
      marginBottom: 18,
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
