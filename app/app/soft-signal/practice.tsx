/**
 * Practice Soft Signal screen — no peer, no session, muscle memory for freedom.
 *
 * Fires softSignalService.practice() only. Never starts a session, notifies a
 * peer, or requires a reason. Soft Signal is success, not a penalty, and is not
 * emergency services (disclaimer lives on SoftSignalButton).
 *
 * SEE:
 * - app/components/SoftSignalButton.tsx
 * - app/services/softSignalService.ts
 * - app/lib/softSignalCore.ts (SOFT_SIGNAL_COPY)
 * - docs/CODE_COMMENT_STANDARD.md (consent-critical UI)
 */

import { useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import { SOFT_SIGNAL_COPY, type SoftSignalFireResult } from "../../lib/softSignalCore";
import { softSignalService } from "../../services/softSignalService";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

/**
 * WHAT: Screen that lets a user practice Soft Signal without a real peer/session.
 * WHY: Body freedom is a skill under stress — practice builds motor memory safely
 *      so real Soft Signal is familiar, never punitive, never social.
 * CONSENT: Practice never seals a consent snapshot, starts contact, or notifies anyone.
 *          Stop path still uses full Soft Signal button grammar (weight 100, no arm).
 * EDGE CASES:
 *   - mid-fire state "stopping" disables button (parent disabled + SoftSignalButton gate)
 *   - after stop, "Practice again" resets local UI state only (does not delete log)
 *   - result.userMessage is practice-framed via outcome practice_only
 * NEVER: Call softSignalService.fire with a real sessionId from this screen.
 *        Frame practice as failure training or emergency drill for 911.
 *        Require a reason after practice fire.
 * SEE: softSignalService.practice; SoftSignalButton; SOFT_SIGNAL_COPY.practice*
 */
export default function SoftSignalPracticeScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  /**
   * UI phase for SoftSignalButton:
   * idle → can practice fire; stopping → in flight; stopped → settled “You are free.”
   */
  const [state, setState] = useState<"idle" | "stopping" | "stopped">("idle");
  /** Last practice fire result for calm after-copy; null before first fire. */
  const [result, setResult] = useState<SoftSignalFireResult | null>(null);

  /**
   * WHAT: Run practice Soft Signal (no remote withdraw) and settle UI to stopped.
   * WHY: Parent owns async fire so SoftSignalButton stays presentational.
   * CONSENT: practiceOnly path — no peer notify, no session start, no reason prompt.
   * EDGE CASES:
   *   - setState("stopping") immediately so double-tap cannot re-enter idle fire
   *   - service always returns localEnded true; we still set stopped after await
   * NEVER: Collect explanation. Navigate away before local settle without user intent.
   *        Treat practice log as peer-facing evidence.
   * SEE: softSignalService.practice
   */
  const fire = async () => {
    // Enter stopping before await so button disables (order: UI gate then service).
    setState("stopping");
    const next = await softSignalService.practice();
    setResult(next);
    // Settled free state — Soft Signal success language via SoftSignalButton labels.
    setState("stopped");
  };

  return (
    <Screen>
      <Eyebrow>SOFT SIGNAL · PRACTICE</Eyebrow>
      <Title>{SOFT_SIGNAL_COPY.practiceTitle}</Title>
      <Body muted>{SOFT_SIGNAL_COPY.practiceBody}</Body>

      <View style={styles.panel}>
        <SoftSignalButton
          state={state}
          onPress={() => void fire()}
          // Extra parent gate: only idle can start; SoftSignalButton also gates phase.
          disabled={state !== "idle"}
        />
      </View>

      {result ? (
        <View style={styles.after} accessible>
          {/* Sacred settled copy — never “you cancelled” or “failed.” */}
          <Text style={styles.afterTitle}>{SOFT_SIGNAL_COPY.endedTitle}</Text>
          <Text style={styles.afterBody}>{result.userMessage}</Text>
          <Text style={styles.meta}>
            {/* Privacy: practice log is local; hardware pattern id is non-sensitive. */}
            Logged privately as practice · hardware pattern{" "}
            {result.hardwareCommand.patternId}
          </Text>
          <Button
            label="View personal Soft Signal log"
            onPress={() => router.push("/soft-signal/log" as never)}
          />
          <Button
            variant="secondary"
            label="Practice again"
            onPress={() => {
              // Reset UI only — previous practice entries remain in private log.
              setState("idle");
              setResult(null);
            }}
          />
        </View>
      ) : null}

      <Button variant="secondary" label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

/**
 * WHAT: Theme styles for practice panel and after-stop calm field.
 * WHY: After-state uses mossSoft (growth/care) not alarm red — Soft Signal is success.
 * CONSENT: Not a consent surface — presentation only.
 * EDGE CASES: none — pure style factory.
 * NEVER: Style after panel as emergency/crisis alert chrome.
 */
function makeStyles(colors: AppColors) {
  return {
    panel: { marginTop: 12 },
    after: {
      marginTop: 20,
      padding: 18,
      borderRadius: 18,
      // Calm success field — Soft Signal is dignified exit, not error state.
      backgroundColor: colors.mossSoft,
      gap: 10,
    },
    afterTitle: {
      fontFamily: fonts.headline,
      fontSize: 26,
      color: colors.ink,
    },
    afterBody: { color: colors.ink, lineHeight: 22, fontSize: 16 },
    meta: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  };
}
