import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Choice, FadeIn, Progress, Screen } from "../../components/ui";
import type { QuizAnswer } from "../../data/quiz";
import { usePrototype } from "../../context/PrototypeContext";
import { useNeurodivergent } from "../../context/NeurodivergentContext";
import { fonts, type AppColors } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { profileRepository } from "../../services/profileRepository";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { vibeQuestionsForMode } from "../../lib/quizPaths";

/**
 * Onboarding Vibe path.
 * Demo / Neurodivergent Mode use the calm short (~10) set so the phone-visible
 * walkthrough stays light. Real account onboarding still uses the full bank so
 * profile archetype remains a fuller first-pass signal — never consent.
 */
export default function QuizScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { answers, setAnswer, hydrateAnswers } = usePrototype();
  const { user, status } = useAuth();
  const { prefs, reducedStimulation } = useNeurodivergent();
  const [index, setIndex] = useState(0);
  const questions = useMemo(() => {
    const useShort = status === "demo" || prefs.enabled;
    return vibeQuestionsForMode(useShort ? "short" : "deep");
  }, [status, prefs.enabled]);
  const question = questions[index];
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
              Math.max(0, questions.length - 1),
            ),
          );
        }
      })
      .catch(() => undefined);
  }, [user?.id, questions.length]);
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
          index === questions.length - 1 ? "vibe_result" : "vibe_quiz",
          { quizAnswers: updated, questionIndex: index + 1 },
        )
        .catch(() => undefined);
    const delay = reducedStimulation ? 0 : 140;
    const advance = () => {
      if (index === questions.length - 1) router.replace("/onboarding/result");
      else setIndex((value) => value + 1);
    };
    if (delay === 0) advance();
    else setTimeout(advance, delay);
  };
  const total = questions.length;
  return (
    <Screen>
      <Progress current={index + 1} total={total} />
      <Text style={styles.count}>
        {status === "demo" || prefs.enabled
          ? `SOFT WEATHER · ${index + 1} OF ${total}`
          : `A LITTLE QUESTION · ${index + 1} OF ${total}`}
      </Text>
      {status === "demo" || prefs.enabled ? (
        <Text style={styles.hint}>
          Short calm path for demo / Neurodivergent Mode. Full deep Vibe lives
          under Quizzes anytime — never consent to touch.
        </Text>
      ) : null}
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
    hint: {
      color: colors.moss,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600",
      marginTop: 6,
    },
    header: { gap: 10, marginTop: 16, marginBottom: 28 },
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
