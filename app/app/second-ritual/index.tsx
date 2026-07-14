/**
 * Two Maps, One Table — second guided ritual (bringing someone in).
 *
 * WHAT: Four-step follow-up to /first-ritual, for once "younger me" actually
 *   has a partner. Each step frames and links to an existing screen
 *   (Weather, Touch Language share, Relationship Model, Attachment Repair)
 *   rather than duplicating their logic — see secondRitualCore.ts.
 * WHY: docs/SECOND_RITUAL.md / docs/REAL_PURPOSE.md's North star addition.
 * CONSENT: Not consent, not a diagnosis, not therapy. Phase-2 content —
 *   presupposes an existing relationship, gated behind pairedGrowthContent.
 *   Fails closed on direct/deep-link navigation even though Home already
 *   stops linking here in App Store Safe.
 * EDGE CASES: Steps resumable in any order via the step chips; "Continue"
 *   never validates the linked screen was actually completed.
 * NEVER: Require finishing before other protocols are reachable. Imply
 *   completion proves the relationship is safe or ready.
 * SEE: docs/SECOND_RITUAL.md, app/lib/secondRitualCore.ts,
 *   app/services/secondRitualStore.ts, app/app/first-ritual/index.tsx.
 */
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Progress, Screen, Title } from "../../components/ui";
import { FeatureUnavailable } from "../../components/FeatureUnavailable";
import {
  SECOND_RITUAL_STEPS,
  defaultSecondRitualProgress,
  findSecondRitualStep,
  isRitualComplete,
  markStepComplete,
  nextIncompleteStep,
  sharedReassuranceLines,
  type SecondRitualProgress,
  type SecondRitualStepId,
} from "../../lib/secondRitualCore";
import { secondRitualStore } from "../../services/secondRitualStore";
import { runtimeConfig } from "../../config/runtime";
import { modeCopy } from "../../config/copy";

export default function SecondRitualScreen() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState<SecondRitualProgress>(
    defaultSecondRitualProgress(),
  );
  const [stepId, setStepId] = useState<SecondRitualStepId>("check_your_weather");

  useEffect(() => {
    if (!runtimeConfig.features.pairedGrowthContent) return;
    void secondRitualStore.load().then((p) => {
      setProgress(p);
      setStepId(nextIncompleteStep(p)?.id ?? "check_your_weather");
      setLoaded(true);
    });
  }, []);

  // v1 App Store Safe scope: phase-2 content — presupposes an existing
  // relationship. SEE: docs/BUILD_MODES.md.
  if (!runtimeConfig.features.pairedGrowthContent) {
    return (
      <FeatureUnavailable
        eyebrow="TWO MAPS, ONE TABLE"
        title="Not available in this build."
        body="This build focuses on your own self-understanding. Bringing a partner in is a Maximum Mode layer (macOS / Linux / internal)."
      />
    );
  }

  const advance = async () => {
    const next = markStepComplete(progress, stepId);
    setProgress(next);
    await secondRitualStore.save(next);
    const upcoming = nextIncompleteStep(next);
    if (upcoming) setStepId(upcoming.id);
  };

  if (!loaded) {
    return (
      <Screen>
        <Body muted>Loading…</Body>
      </Screen>
    );
  }

  const step = findSecondRitualStep(stepId);
  const stepIndex = SECOND_RITUAL_STEPS.findIndex((s) => s.id === stepId);
  const complete = isRitualComplete(progress);

  return (
    <Screen>
      <Eyebrow>TWO MAPS, ONE TABLE</Eyebrow>
      <Progress current={stepIndex + 1} total={SECOND_RITUAL_STEPS.length} labelPrefix="Step" />
      <Title>{step.title}</Title>
      <Card>
        <Body>{step.voiceLine}</Body>
      </Card>

      {stepId === "shared_reassurance" ? (
        <Card>
          {sharedReassuranceLines()
            .slice(0, 4)
            .map((line) => (
              <Body key={line} muted>
                {line}
              </Body>
            ))}
          <Body>
            Neither of you has to perform being okay to keep this. Both of you
            get to need things. {modeCopy.partnerName} included.
          </Body>
        </Card>
      ) : (
        <Card>
          <Button
            variant="secondary"
            label={step.linkLabel}
            onPress={() => router.push(step.href as never)}
          />
        </Card>
      )}

      {!complete ? (
        <Button label="Continue" onPress={() => void advance()} />
      ) : (
        <Card>
          <Body>
            That's the whole sequence. No badge, no score, and it doesn't
            expire — come back to any step whenever, in any order.
          </Body>
          <Button label="Back to Home" onPress={() => router.push("/(tabs)/home" as never)} />
        </Card>
      )}

      <View style={{ flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {SECOND_RITUAL_STEPS.map((s) => (
          <Button
            key={s.id}
            variant={s.id === stepId ? "primary" : "secondary"}
            label={progress.completedSteps.includes(s.id) ? `✓ ${s.title}` : s.title}
            onPress={() => setStepId(s.id)}
          />
        ))}
      </View>

      <Button
        variant="secondary"
        label="Back to Home"
        onPress={() => router.push("/(tabs)/home" as never)}
      />
    </Screen>
  );
}
