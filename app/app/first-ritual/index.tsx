/**
 * The Map, Not The Mirror — first guided ritual.
 *
 * WHAT: Four-step solo sequence for someone new to Litmo, convinced they're
 *   "too much" and scared of ruining a good thing. Reuses existing containment
 *   building blocks (trigger naming, Soft Signal, reassurance lines) with new
 *   sequencing and voice — see app/lib/firstRitualCore.ts for what's reused.
 * WHY: docs/REAL_PURPOSE.md / docs/FIRST_RITUAL.md — a compassionate,
 *   step-by-step companion that doesn't require therapy first. Armor, not
 *   homework: nothing here is required, scored, or gated.
 * CONSENT: Not consent, not a diagnosis, not therapy. Soft Signal is reachable
 *   on every step. Steps can be done in any order or skipped; "Continue" never
 *   validates that a step was "done right."
 * EDGE CASES: Progress resumes from the first incomplete step, but the user
 *   can freely jump via the step dots. Soft Signal fire here is practice-only
 *   (no session, no peer) — same as /soft-signal/practice.
 * NEVER: Require finishing before other protocols are reachable. Present
 *   completion as proof of healing or readiness for a partner.
 * SEE: docs/FIRST_RITUAL.md, app/lib/firstRitualCore.ts,
 *   app/services/firstRitualStore.ts, app/components/SoftSignalButton.tsx.
 */
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Choice, Eyebrow, Progress, Screen, Title } from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import {
  FIRST_RITUAL_STEPS,
  defaultFirstRitualProgress,
  findFirstRitualStep,
  firstReassuranceClosing,
  isRitualComplete,
  markStepComplete,
  nextIncompleteStep,
  setChosenTrigger,
  type FirstRitualProgress,
  type FirstRitualStepId,
} from "../../lib/firstRitualCore";
import { TOO_MUCH_TRIGGERS, REASSURANCE_LINES } from "../../lib/tooMuchCore";
import { runtimeConfig } from "../../config/runtime";
import { firstRitualStore } from "../../services/firstRitualStore";
import { softSignalService } from "../../services/softSignalService";
import { modeCopy } from "../../config/copy";

export default function FirstRitualScreen() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState<FirstRitualProgress>(
    defaultFirstRitualProgress(),
  );
  const [stepId, setStepId] = useState<FirstRitualStepId>("name_it");
  const [softSignalState, setSoftSignalState] = useState<
    "idle" | "stopping" | "stopped"
  >("idle");

  useEffect(() => {
    void firstRitualStore.load().then((p) => {
      setProgress(p);
      setStepId(nextIncompleteStep(p)?.id ?? "name_it");
      setLoaded(true);
    });
  }, []);

  const persist = async (next: FirstRitualProgress) => {
    setProgress(next);
    await firstRitualStore.save(next);
  };

  const advance = async () => {
    const next = markStepComplete(progress, stepId);
    await persist(next);
    const upcoming = nextIncompleteStep(next);
    if (upcoming) setStepId(upcoming.id);
  };

  const practiceSoftSignal = async () => {
    setSoftSignalState("stopping");
    await softSignalService.practice();
    setSoftSignalState("stopped");
  };

  if (!loaded) {
    return (
      <Screen>
        <Body muted>Loading…</Body>
      </Screen>
    );
  }

  const step = findFirstRitualStep(stepId);
  const stepIndex = FIRST_RITUAL_STEPS.findIndex((s) => s.id === stepId);
  const complete = isRitualComplete(progress);

  return (
    <Screen>
      <Eyebrow>THE MAP, NOT THE MIRROR</Eyebrow>
      <Progress current={stepIndex + 1} total={FIRST_RITUAL_STEPS.length} labelPrefix="Step" />
      <Title>{step.title}</Title>
      <Card>
        <Body>{step.voiceLine}</Body>
      </Card>

      {stepId === "name_it" ? (
        <View style={{ gap: 8 }}>
          {TOO_MUCH_TRIGGERS.filter((t) => t.id !== "custom" && t.id !== "undecided").map(
            (t, i, arr) => (
              <Choice
                key={t.id}
                label={t.label}
                detail={t.detect}
                selected={progress.chosenTriggerId === t.id}
                onPress={() => void persist(setChosenTrigger(progress, t.id))}
                index={i + 1}
                count={arr.length}
              />
            ),
          )}
          <Body muted>
            No pressure to pick right now — "none of these yet" is a valid answer.
          </Body>
        </View>
      ) : null}

      {stepId === "locate_it" ? (
        <Card>
          <Body muted>
            Takes about a minute. Comes back to you, never to anyone else.
          </Body>
          <Button
            variant="secondary"
            label="Open Nervous System Weather"
            onPress={() => router.push("/weather" as never)}
          />
        </Card>
      ) : null}

      {stepId === "the_armor" ? (
        <SoftSignalButton
          onPress={() => void practiceSoftSignal()}
          state={softSignalState}
        />
      ) : null}

      {stepId === "first_reassurance" ? (
        <Card>
          {REASSURANCE_LINES.slice(0, 4).map((line) => (
            <Body key={line} muted>
              {line}
            </Body>
          ))}
          <Body>{firstReassuranceClosing(modeCopy.partnerName)}</Body>
        </Card>
      ) : null}

      {!complete ? (
        <Button label="Continue" onPress={() => void advance()} />
      ) : (
        <Card>
          <Body>
            That's the whole ritual. No badge, no score — just came back to
            yourself four times. Come back to any step whenever, in any order.
          </Body>
          {runtimeConfig.features.pairedGrowthContent ? (
            <Body muted>
              No rush on this next part — it's only relevant once there's an
              actual person to bring in.
            </Body>
          ) : null}
          {runtimeConfig.features.pairedGrowthContent ? (
            <Button
              variant="secondary"
              label="When you're ready: Two Maps, One Table"
              onPress={() => router.push("/second-ritual" as never)}
            />
          ) : null}
          <Button label="Back to Home" onPress={() => router.push("/(tabs)/home" as never)} />
        </Card>
      )}

      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        {FIRST_RITUAL_STEPS.map((s) => (
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
