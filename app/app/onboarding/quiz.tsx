import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
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

export default function QuizScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { answers, setAnswer, hydrateAnswers } = usePrototype();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const question = quizQuestions[index];
  useEffect(() => {
    if (!user) return;
    profileRepository
      .getProgress(user.id)
      .then(({ draftProfile }) => {
        const saved = draftProfile.quizAnswers;
        if (Array.isArray(saved)) {
          hydrateAnswers(saved as typeof answers);
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
  const choose = (answer: QuizAnswer) => {
    const selectedAnswer = {
      questionId: question.id,
      answerId: answer.id,
      scores: answer.scores,
    };
    setAnswer(selectedAnswer);
    const updated = [
      ...answers.filter((item) => item.questionId !== question.id),
      selectedAnswer,
    ];
    if (user)
      void profileRepository
        .saveProgress(
          user.id,
          index === quizQuestions.length - 1 ? "vibe_result" : "vibe_quiz",
          { quizAnswers: updated, questionIndex: index + 1 },
        )
        .catch(() => undefined);
    setTimeout(() => {
      if (index === quizQuestions.length - 1)
        router.replace("/onboarding/result");
      else setIndex((value) => value + 1);
    }, 180);
  };
  return (
    <Screen>
      <Progress current={index + 1} total={quizQuestions.length} />
      <Text style={styles.count}>
        VIBE WEATHER · {index + 1} OF {quizQuestions.length}
      </Text>
      <Text
        style={styles.dimension}
        accessibilityLabel={`Theme: ${quizDimensionLabels[question.dimension]}`}
      >
        {quizDimensionLabels[question.dimension]}
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
        No answer is more evolved than another. Pick what feels nicest today.
        This is a playful social-weather quiz—not a diagnosis, ranking, or
        consent tool.
      </Text>
    </Screen>
  );
}
function makeStyles(colors: AppColors) {
  return {
    count: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.1,
    },
    dimension: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 6,
    },
    header: { gap: 10, marginTop: 12, marginBottom: 28 },
    kicker: { color: colors.plum, fontSize: 15, fontWeight: "700" },
    prompt: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 36,
      lineHeight: 43,
    },
    options: { gap: 12 },
    note: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      marginTop: "auto",
    },
  };
}
