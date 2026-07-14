/**
 * SoftSignalButton — primary Soft Signal UI control.
 *
 * Micro-grammar: consent weight 100, no arm/dwell to fire, offline-capable,
 * stop faster than grant (softSignalLocalCommitMs === 0). Label + shape +
 * position carry meaning (not color alone). Always shows not-emergency disclaimer.
 *
 * SEE:
 * - docs/CONSENT_MICROINTERACTIONS.md
 * - app/lib/softSignalCore.ts
 * - app/lib/consentInteractionCore.ts (CONSENT_POINTS.soft_signal_active, mayFireSoftSignal)
 * - docs/CODE_COMMENT_STANDARD.md (consent-critical surface)
 */

import { Text, View } from "react-native";
import { Button } from "./ui";
import { SOFT_SIGNAL_COPY } from "../lib/softSignalCore";
import {
  CONSENT_POINTS,
  mayFireSoftSignal,
} from "../lib/consentInteractionCore";
import { fonts, type AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";

/**
 * WHAT: Props for SoftSignalButton presentation and fire enablement.
 * WHY: Parents own side effects (onPress → softSignalService); this component
 *      only gates UI via mayFireSoftSignal + state machine labels.
 * CONSENT: onPress is unilateral stop/practice intent — never mutual grant.
 * EDGE CASES:
 *   - disabled true → cannot fire even if phase idle
 *   - sticky true → hides banner/explain density, keeps stop authority
 *   - state stopped/stopping → button disabled (no double-fire spam)
 * NEVER: Pass onPress that asks for a reason before calling fire.
 *        Infer peer safety or emergency dispatch from this control.
 */
type Props = {
  /** Parent-owned fire handler; must not block UI on network before local end. */
  onPress: () => void;
  /** External disable (e.g. parent still loading) — ORed with internal phase gate. */
  disabled?: boolean;
  /**
   * UI phase machine:
   * - idle: can fire (if mayFireSoftSignal)
   * - stopping: in-flight fire (local commit should already be intended)
   * - stopped: settled free state — not re-armable without parent reset
   */
  state?: "idle" | "stopping" | "stopped";
  /** Larger hit target for active session / hardware parity (default true). */
  prominent?: boolean;
  /** Show sacred banner above control (suppressed in sticky mode). */
  showBanner?: boolean;
  /** Show secondary explain copy (suppressed in sticky mode). */
  explain?: boolean;
  /**
   * Compact sticky chrome: less copy density, same stop authority.
   * WHY: Active session sticky bar must remain always available without crowding.
   */
  sticky?: boolean;
};

/**
 * Canonical consent point for Soft Signal in active context.
 * WHY: a11y labels and primary/secondary copy stay bound to CONSENT_POINTS,
 * not free-floating strings that could drift from the micro-grammar registry.
 */
const point = CONSENT_POINTS.soft_signal_active;

/**
 * WHAT: Render Soft Signal control — impossible to miss, emotionally safe copy.
 * WHY: Single shared control so active session, practice, and review surfaces
 *      share stop authority, a11y, and non-emergency framing.
 * CONSENT: Withdraw path — no arm, no reason, no peer. mayFireSoftSignal is the
 *      only local UI gate; disabled/stopping/stopped also block press.
 * EDGE CASES:
 *   - state "stopped" → alreadyEnded true → mayFireSoftSignal false
 *   - state "stopping" → phase "firing" → mayFireSoftSignal false; label "Stopping…"
 *   - sticky → banner/explain off, shell compact; notEmergency still always shown
 *   - disabled prop true → no fire even if idle
 * NEVER: Wait on network inside this component before enabling “You are free.”
 *        Use color alone for meaning. Frame Soft Signal as penalty or crisis call.
 * SEE: CONSENT_POINTS.soft_signal_active; mayFireSoftSignal; SOFT_SIGNAL_COPY
 */
export function SoftSignalButton({
  onPress,
  disabled,
  state = "idle",
  prominent = true,
  showBanner = true,
  explain = true,
  sticky = false,
}: Props) {
  const styles = useThemedStyles(makeStyles);

  // Map UI state → consentInteractionCore phase for mayFireSoftSignal.
  // stopping → firing (in progress); stopped → settled; else idle (armed for stop only).
  const phase =
    state === "stopping"
      ? "firing"
      : state === "stopped"
        ? "settled"
        : "idle";

  // Fail closed: if already ended or mid-fire, mayFireSoftSignal denies.
  // Soft Signal has no grant-arm; this only prevents double-commit / spam, not dwell.
  const canFire = mayFireSoftSignal({
    alreadyEnded: state === "stopped",
    phase,
  });

  // Labels: mode pack (Maximum sacred vs App Store calm) — never “failed” / “cancelled.”
  // Agent 04/10: Soft Signal chrome is pack-driven; stop authority unchanged.
  const label =
    state === "stopping"
      ? SOFT_SIGNAL_COPY.buttonStopping
      : state === "stopped"
        ? SOFT_SIGNAL_COPY.buttonStopped
        : SOFT_SIGNAL_COPY.button;

  // Sticky bar trades copy density for always-available control — stop authority unchanged.
  const showBannerResolved = sticky ? false : showBanner;
  const explainResolved = sticky ? false : explain;

  return (
    <View
      style={[
        styles.wrap,
        prominent && styles.wrapProminent,
        sticky && styles.wrapSticky,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={point.a11yLabel}
    >
      {showBannerResolved ? (
        <View style={styles.banner} accessible accessibilityRole="text">
          <Text style={styles.bannerTitle}>{SOFT_SIGNAL_COPY.bannerTitle}</Text>
          <Text style={styles.bannerBody}>{SOFT_SIGNAL_COPY.bannerBody}</Text>
        </View>
      ) : null}
      {/* softSignalLocalCommitMs === 0: local end is immediate; UI never waits on network. */}
      <View style={[styles.buttonShell, sticky && styles.buttonShellSticky]}>
        <Button
          variant="signal"
          label={label}
          disabled={
            // Order: external disable OR core mayFire deny OR in-flight/settled UI states.
            // Stopping/stopped forced disabled even if mayFireSoftSignal were ever looser.
            disabled ||
            !canFire ||
            state === "stopping" ||
            state === "stopped"
          }
          onPress={onPress}
          accessibilityLabel={
            state === "stopping"
              ? "Stopping session"
              : state === "stopped"
                ? "You are free. Session stopped."
                : point.a11yLabel
          }
          accessibilityHint={point.a11yHint}
        />
      </View>
      {explainResolved ? (
        <Text style={styles.explain} accessibilityRole="text">
          {/* Mode pack hint (sacred vs calm); registry secondary is secondary. */}
          {SOFT_SIGNAL_COPY.hint}
        </Text>
      ) : null}
      {/* Always visible: Soft Signal is not emergency/crisis services (product non-claim). */}
      <Text style={styles.notEmergency} accessibilityRole="text">
        {SOFT_SIGNAL_COPY.notEmergency}
      </Text>
    </View>
  );
}

/**
 * WHAT: Theme-aware styles for Soft Signal control chrome.
 * WHY: Signal border weight + soft field make the control unmissable without
 *      relying on color alone (label, shape, position also carry meaning).
 * CONSENT: Not a consent surface — presentation only.
 * EDGE CASES: sticky reduces gaps/padding; hit area still from signal Button (68pt).
 * NEVER: Style as alarm-red emergency CTA that implies crisis dispatch.
 * SEE: theme AppColors.signal / signalSoft
 */
function makeStyles(colors: AppColors) {
  return {
    wrap: { gap: 10 },
    wrapProminent: {
      marginTop: 4,
      marginBottom: 4,
    },
    wrapSticky: {
      marginTop: 0,
      marginBottom: 0,
      gap: 6,
    },
    banner: {
      backgroundColor: colors.signalSoft,
      borderWidth: 2,
      borderColor: colors.signal,
      borderRadius: 18,
      padding: 16,
      gap: 6,
    },
    bannerTitle: {
      color: colors.signal,
      fontWeight: "800" as const,
      fontSize: 13,
      letterSpacing: 1,
      textTransform: "uppercase" as const,
    },
    bannerBody: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 23,
      fontFamily: fonts.headline,
    },
    buttonShell: {
      // Extra visual weight so the control cannot blend into secondary actions.
      // min hit area enforced via signal Button (68pt) — consent weight 100.
      borderRadius: 20,
      borderWidth: 3,
      borderColor: colors.signal,
      padding: 4,
      backgroundColor: colors.signalSoft,
    },
    buttonShellSticky: {
      borderWidth: 3,
      padding: 3,
    },
    explain: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "600" as const,
      textAlign: "center" as const,
    },
    notEmergency: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center" as const,
    },
  };
}
