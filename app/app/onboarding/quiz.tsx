import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Choice, FadeIn, Progress, Screen } from "../../components/ui";
import { quizQuestions, type QuizAnswer } from "../../data/quiz";
import { usePrototype } from "../../context/PrototypeContext";
import { colors } from "../../theme";
export default function QuizScreen() {
  const router = useRouter();
  const { answers, setAnswer } = usePrototype();
  const [index, setIndex] = useState(0);
  const question = quizQuestions[index];
  if (!question) return null;
  const selected = answers.find(
    (item) => item.questionId === question.id,
  )?.answerId;
  const choose = (answer: QuizAnswer) => {
    setAnswer({
      questionId: question.id,
      answerId: answer.id,
      scores: answer.scores,
    });
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
        A LITTLE QUESTION · {index + 1} OF {quizQuestions.length}
      </Text>
      <FadeIn key={question.id}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{question.kicker}</Text>
          <Text style={styles.prompt}>{question.prompt}</Text>
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
      </Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  count: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  header: { gap: 10, marginTop: 16, marginBottom: 28 },
  kicker: { color: colors.plum, fontSize: 15, fontWeight: "700" },
  prompt: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 34,
    lineHeight: 41,
  },
  options: { gap: 12 },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: "auto",
  },
});
