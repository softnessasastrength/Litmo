import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Choice, FadeIn, Progress, Screen } from "../../components/ui";
import { useNeurodivergent } from "../../context/NeurodivergentContext";
import { getQuizEntry } from "../../data/quizCatalog";
import type { QuizAnswer } from "../../data/quiz";
import { clearLanguage } from "../../lib/clearLanguage";
import type { AnswerScores } from "../../lib/quizScoring";
import { runQuizModel, topInsights } from "../../lib/quizScoring";
import { quizPlayProgress } from "../../services/quizPlayProgress";
import { quizResultsRepository } from "../../services/quizResultsRepository";
import { speechService } from "../../services/speechService";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { hapticService } from "../../services/hapticService";

export default function QuizPlayScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { prefs, reducedStimulation, voiceAids, oneAtATime, easySaves } =
    useNeurodivergent();
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const entry = getQuizEntry(String(quizId ?? ""));
  const questions = useMemo(() => entry?.questions() ?? [], [entry]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerScores[]>([]);
  const [resumeOffer, setResumeOffer] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [loadedProgress, setLoadedProgress] = useState(false);
  const advancing = useRef(false);

  // Always device-local mid-quiz save/resume (calm for short + deep).
  // Neurodivergent Mode only changes how prominently we surface it.
  useEffect(() => {
    if (!entry) {
      setLoadedProgress(true);
      return;
    }
    let active = true;
    void quizPlayProgress.get(entry.id).then((saved) => {
      if (!active) return;
      if (saved && saved.answers.length > 0) {
        setResumeOffer(true);
      }
      setLoadedProgress(true);
    });
    return () => {
      active = false;
    };
  }, [entry]);

  useEffect(() => {
    if (!entry || !loadedProgress) return;
    if (answers.length === 0 && index === 0) return;
    void quizPlayProgress.save({
      quizId: entry.id,
      index,
      answers,
      updatedAt: new Date().toISOString(),
    });
  }, [answers, entry, index, loadedProgress]);

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
  const plain = prefs.clearLanguage;

  const applyResume = async () => {
    const saved = await quizPlayProgress.get(entry.id);
    if (!saved) {
      setResumeOffer(false);
      return;
    }
    setAnswers(saved.answers);
    setIndex(Math.min(saved.index, Math.max(0, total - 1)));
    setResumeOffer(false);
  };

  const discardResume = async () => {
    await quizPlayProgress.clear(entry.id);
    setResumeOffer(false);
    setAnswers([]);
    setIndex(0);
  };

  const goBack = () => {
    if (advancing.current) return;
    if (index > 0) {
      setIndex((v) => Math.max(0, v - 1));
      return;
    }
    router.back();
  };

  const goNextUnanswered = () => {
    if (index < total - 1) setIndex((v) => v + 1);
  };

  const finishWith = (updated: AnswerScores[]) => {
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
      .then(async () => {
        await quizPlayProgress.clear(entry.id);
        router.replace({
          pathname: "/quizzes/result",
          params: { quizId: entry.id },
        } as never);
      })
      .finally(() => {
        advancing.current = false;
      });
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
    setVoiceDraft("");
    if (!reducedStimulation) {
      void hapticService.play("presence");
    }

    const isLast = index === total - 1;
    // Reduced stimulation / ND mode: advance immediately.
    const delay = reducedStimulation ? 0 : 140;

    const advance = () => {
      if (!isLast) {
        setIndex((v) => v + 1);
        advancing.current = false;
        return;
      }
      finishWith(updated);
    };

    if (delay === 0) {
      advance();
    } else {
      setTimeout(advance, delay);
    }
  };

  const applyVoiceNumber = () => {
    const n = Number.parseInt(voiceDraft.trim(), 10);
    if (!Number.isFinite(n) || n < 1 || n > question.answers.length) return;
    const answer = question.answers[n - 1];
    if (answer) choose(answer);
  };

  const readQuestion = () => {
    const labels = question.answers
      .map((a, i) => `Option ${i + 1}: ${a.label}.`)
      .join(" ");
    const text = [
      plain ? clearLanguage.quizProgress(index + 1, total) : null,
      question.kicker,
      question.prompt,
      labels,
      plain ? clearLanguage.quizSoftReminder : entry.disclaimer,
    ]
      .filter(Boolean)
      .join(" ");
    void speechService.speak(text);
  };

const questionBlock = (
    <>
      <Text style={styles.kicker}>{entry.title}</Text>

      {voiceAids || prefs.readAloud ? (
        <Pressable
          onPress={readQuestion}
          accessibilityRole="button"
          accessibilityLabel={clearLanguage.quizReadAloud}
          style={styles.readBtn}
        >
          <Text style={styles.readBtnText}>
            {plain ? clearLanguage.quizReadAloud : "🔊 Read question aloud"}
          </Text>
        </Pressable>
      ) : null}

      {question.kicker ? (
        <Text style={styles.scene}>{question.kicker}</Text>
      ) : null}
      <Text style={styles.prompt} accessibilityRole="header">
        {question.prompt}
      </Text>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {question.answers.map((answer, i) => (
          <Choice
            key={answer.id}
            label={
              oneAtATime || prefs.easyNavigation
                ? `${i + 1}. ${answer.label}`
                : answer.label
            }
            detail={answer.detail}
            glyph={reducedStimulation ? undefined : answer.glyph}
            selected={selected === answer.id}
            onPress={() => choose(answer)}
          />
        ))}
      </View>
    </>
  );

  return (
    <Screen>
      {prefs.enabled ? (
        <View style={styles.ndBanner} accessible>
          <Text style={styles.ndBannerText}>
            {plain
              ? clearLanguage.ndModeOn
              : "Neurodivergent Mode: larger text, reduced motion, one question at a time, easy saves, voice aids."}
          </Text>
        </View>
      ) : null}

      {resumeOffer ? (
        <View style={styles.resumeCard} accessible>
          <Text style={styles.resumeTitle}>
            {plain ? clearLanguage.quizResume : "Resume saved progress?"}
          </Text>
          <Text style={styles.note}>
            {plain
              ? clearLanguage.quizSaved
              : "We found answers saved on this device. Nothing was shared."}
          </Text>
          <View style={styles.resumeRow}>
            <Pressable
              onPress={() => void applyResume()}
              accessibilityRole="button"
              accessibilityLabel="Resume quiz from saved place"
              style={styles.resumePrimary}
            >
              <Text style={styles.resumePrimaryText}>Resume</Text>
            </Pressable>
            <Pressable
              onPress={() => void discardResume()}
              accessibilityRole="button"
              accessibilityLabel="Start quiz from the beginning"
              style={styles.resumeSecondary}
            >
              <Text style={styles.resumeSecondaryText}>Start over</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.topRow}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={
            index > 0
              ? plain
                ? clearLanguage.quizBack
                : "Previous question"
              : plain
                ? clearLanguage.quizLeave
                : "Leave quiz and go back"
          }
          hitSlop={12}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.back}>
            {index > 0
              ? plain
                ? `← ${clearLanguage.quizBack}`
                : "← Back"
              : plain
                ? `← ${clearLanguage.quizLeave}`
                : "← Leave"}
          </Text>
        </Pressable>
        <Text
          style={styles.count}
          accessibilityLabel={clearLanguage.quizProgress(index + 1, total)}
        >
          {index + 1} / {total}
        </Text>
      </View>

      <Progress current={index + 1} total={total} />

      {oneAtATime || prefs.easyNavigation ? (
        <View style={styles.navTools}>
          <Text style={styles.oneAtATimeHint} accessibilityLiveRegion="polite">
            {plain
              ? clearLanguage.quizProgress(index + 1, total)
              : `One question at a time · ${index + 1} of ${total}`}
          </Text>
          <Pressable
            onPress={() => setNavOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={
              navOpen ? "Hide question list" : "Show question list"
            }
            style={styles.navToggle}
          >
            <Text style={styles.navToggleText}>
              {navOpen ? "Hide jump list" : "Jump to question"}
            </Text>
          </Pressable>
          {index < total - 1 ? (
            <Pressable
              onPress={goNextUnanswered}
              accessibilityRole="button"
              accessibilityLabel={clearLanguage.quizNext}
              style={styles.navToggle}
            >
              <Text style={styles.navToggleText}>
                {plain ? clearLanguage.quizNext : "Skip forward →"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {navOpen && (oneAtATime || prefs.easyNavigation) ? (
        <View style={styles.jumpList} accessibilityRole="list">
          {questions.map((q, i) => {
            const answered = answers.some((a) => a.questionId === q.id);
            return (
              <Pressable
                key={q.id}
                onPress={() => {
                  setIndex(i);
                  setNavOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: i === index }}
                accessibilityLabel={`Question ${i + 1}${answered ? ", answered" : ""}${i === index ? ", current" : ""}`}
                style={[
                  styles.jumpItem,
                  i === index && styles.jumpItemActive,
                  answered && styles.jumpItemDone,
                ]}
              >
                <Text style={styles.jumpItemText}>
                  {i + 1}
                  {answered ? " ✓" : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {reducedStimulation ? (
        questionBlock
      ) : (
        <FadeIn key={question.id}>{questionBlock}</FadeIn>
      )}

      {voiceAids || prefs.voiceInputAids ? (
        <View style={styles.voiceBlock}>
          <Text style={styles.voiceHint}>
            {plain
              ? clearLanguage.quizVoiceHint
              : "Type or dictate an option number, then Go. Or tap a button above. Keyboard dictation uses your device microphone."}
          </Text>
          <View style={styles.voiceRow}>
            <TextInput
              value={voiceDraft}
              onChangeText={setVoiceDraft}
              keyboardType="number-pad"
              placeholder={
                plain ? clearLanguage.quizVoicePlaceholder : "Option number"
              }
              placeholderTextColor={styles.placeholder.color}
              style={styles.voiceInput}
              accessibilityLabel="Answer by option number"
              accessibilityHint="Enter 1 for first option, 2 for second, and so on. Dictation works if enabled on your keyboard."
              returnKeyType="go"
              onSubmitEditing={applyVoiceNumber}
            />
            <Pressable
              onPress={applyVoiceNumber}
              accessibilityRole="button"
              accessibilityLabel="Submit option number"
              style={styles.voiceGo}
            >
              <Text style={styles.voiceGoText}>Go</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {easySaves ? (
        <Text style={styles.savedHint} accessibilityLiveRegion="polite">
          {plain
            ? clearLanguage.quizSaved
            : "Easy save: progress stays on this device. Leave anytime and resume later."}
        </Text>
      ) : null}

      <View style={styles.disclaimerBlock} accessible>
        <Text style={styles.disclaimerTitle}>
          {plain ? "Remember" : "Soft reminder"}
        </Text>
        <Text style={styles.note}>
          {plain ? clearLanguage.quizSoftReminder : entry.disclaimer}
        </Text>
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
      minHeight: 48,
    },
    back: {
      color: colors.moss,
      fontWeight: "700" as const,
      fontSize: 17,
      minHeight: 28,
    },
    exitLink: { marginTop: 16, alignSelf: "flex-start" as const },
    pressed: { opacity: 0.7 },
    count: {
      color: colors.muted,
      fontWeight: "700" as const,
      fontSize: 15,
    },
    kicker: {
      color: colors.plum,
      fontSize: 13,
      fontWeight: "800" as const,
      marginTop: 10,
      textTransform: "uppercase" as const,
      letterSpacing: 0.6,
    },
    scene: { color: colors.muted, fontSize: 15, marginTop: 10, lineHeight: 22 },
    prompt: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 28,
      lineHeight: 34,
      marginTop: 6,
      marginBottom: 18,
    },
    options: { gap: 12 },
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
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center" as const,
    },
    ndBanner: {
      backgroundColor: colors.mossSoft,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    ndBannerText: {
      color: colors.moss,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600" as const,
    },
    resumeCard: {
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.moss,
      borderRadius: 14,
      padding: 14,
      gap: 8,
      marginBottom: 10,
    },
    resumeTitle: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 16,
    },
    resumeRow: { flexDirection: "row" as const, gap: 10, marginTop: 4 },
    resumePrimary: {
      flex: 1,
      minHeight: 48,
      backgroundColor: colors.moss,
      borderRadius: 24,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    resumePrimaryText: {
      color: colors.white,
      fontWeight: "800" as const,
      fontSize: 15,
    },
    resumeSecondary: {
      flex: 1,
      minHeight: 48,
      borderWidth: 1.5,
      borderColor: colors.moss,
      borderRadius: 24,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    resumeSecondaryText: {
      color: colors.moss,
      fontWeight: "700" as const,
      fontSize: 15,
    },
    oneAtATimeHint: {
      width: "100%" as const,
      color: colors.moss,
      fontSize: 14,
      fontWeight: "700" as const,
    },
    navTools: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
      marginTop: 8,
    },
    navToggle: {
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 22,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
    },
    navToggleText: {
      color: colors.moss,
      fontWeight: "700" as const,
      fontSize: 14,
    },
    jumpList: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
      marginTop: 8,
    },
    jumpItem: {
      minWidth: 44,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: colors.paper,
    },
    jumpItemActive: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    jumpItemDone: { borderColor: colors.moss },
    jumpItemText: {
      color: colors.ink,
      fontWeight: "700" as const,
      fontSize: 14,
    },
    readBtn: {
      minHeight: 48,
      marginTop: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.plumSoft,
      alignSelf: "flex-start" as const,
    },
    readBtnText: {
      color: colors.plum,
      fontWeight: "700" as const,
      fontSize: 15,
    },
    voiceBlock: { marginTop: 14, gap: 8 },
    voiceHint: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    voiceRow: { flexDirection: "row" as const, gap: 8, alignItems: "center" as const },
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
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    voiceGoText: {
      color: colors.white,
      fontWeight: "800" as const,
      fontSize: 16,
    },
    savedHint: {
      marginTop: 12,
      color: colors.moss,
      fontSize: 13,
      fontWeight: "600" as const,
      textAlign: "center" as const,
    },
  };
}
