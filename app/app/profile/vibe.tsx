import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { VibeCard } from "../../components/VibeCard";
import { usePrototype } from "../../context/PrototypeContext";
import { runQuizModel } from "../../lib/quizScoring";
import { useAuth } from "../../context/AuthContext";
import { profileRepository } from "../../services/profileRepository";
import { quizCatalog } from "../../data/quizCatalog";

/**
 * WHAT: Post-keep vibe hub (`/profile/vibe`) after `onboard_vibe_keep` from result.
 * WHY: Bridge weather card to Touch Language onboarding (canonical next) or quiz detours
 *   without treating the card as safety proof or touch permission.
 * CONSENT: Not a new consent seal. Landing here means weather was kept for conversation
 *   only. Canonical happy path: “Quick touch preferences (onboarding)” → TL → boundaries.
 * EDGE CASES:
 *   - Zero answers → model still runs; primary falls back to archetypeId.
 *   - Retake clears local answers + real draft when user present.
 *   - Detours (full TL editor, Quizzes) can leave linear boundaries gate (documented tension).
 * NEVER: Vibe as consent; safety score; ready-for-strangers; Soft Signal required here.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §7.3 · onboard_vibe_keep · result.tsx
 */
export default function VibeProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { answers, archetypeId, resetQuiz } = usePrototype();
  const result = useMemo(() => runQuizModel(answers), [answers]);
  const vibeCount = quizCatalog.filter((q) => q.family === "vibe").length;
  const selfCount = quizCatalog.filter((q) => q.family === "self").length;

  /**
   * WHAT: Clears onboarding vibe answers (and real draft if signed in) then reopens quiz.
   * WHY: Allow change-of-mind without implying prior weather was a commitment.
   * CONSENT: Prepare reset only — does not revoke session consent (none from vibe).
   * EDGE CASES: Draft save errors ignored; local reset still happens.
   * NEVER: Delete Touch Language or boundaries as side effect of retake.
   * SEE: docs/ONBOARDING_CONSENT_FLOW.md §7.3
   */
  const retakeOnboarding = () => {
    resetQuiz();
    // Real accounts: clear server draft so resume does not restore old scenes.
    if (user) {
      void profileRepository
        .saveProgress(user.id, "vibe_quiz", {
          quizAnswers: [],
          questionIndex: 0,
        })
        .catch(() => undefined);
    }
    router.push("/onboarding/quiz");
  };

  return (
    <Screen>
      <Eyebrow>YOUR CARD</Eyebrow>
      <Title>A little shorthand for your social weather.</Title>
      <VibeCard
        archetypeId={result.primary || archetypeId}
        secondaryId={result.isCloseBlend ? result.secondary : null}
        blendLabel={result.blendLabel}
        showHowYouMightShowUp
      />
      {/* Non-claim: weather model ≠ consent (copy anchors §16). */}
      <Body muted>
        Built from your scenes with a multi-theme mix model ({result.modelVersion}
        ). Still only a conversation starter — never consent. Onboarding may use
        Short or Deep; the full catalog lives under Quizzes.
      </Body>
      <Body muted>
        Available now: {vibeCount} Vibe depths (Short ~10 · Deep 100) and{" "}
        {selfCount} self quizzes. Open the hub anytime.
      </Body>
      <Button
        label="Open full Touch Language"
        onPress={() => router.push("/touch-language" as never)}
        accessibilityHint="Pressure, speed, duration, body map, hard and soft limits"
      />
      {/* Canonical onboarding next after keep — onboard_touch_language_save path. */}
      <Button
        label="Quick touch preferences (onboarding)"
        variant="secondary"
        onPress={() => router.push("/onboarding/touch-language")}
      />
      <Button
        label="Open Quizzes hub"
        variant="secondary"
        onPress={() => router.push("/(tabs)/quizzes" as never)}
        accessibilityHint="Short and deep Vibe plus Soft Capacity, Boundary Voice, Comfort and Care, Connection Pace"
      />
      <Button
        label="Start Short Vibe (~10)"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/quizzes/play",
            params: { quizId: "vibe-short" },
          } as never)
        }
      />
      <Button
        label="Start Deep Vibe (100 scenes)"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/quizzes/play",
            params: { quizId: "vibe-deep" },
          } as never)
        }
      />
      <Button
        label="Retake onboarding vibe path"
        variant="secondary"
        onPress={retakeOnboarding}
        accessibilityHint="Restarts the onboarding quiz (short in demo or ND Mode, deep for real accounts)"
      />
    </Screen>
  );
}
