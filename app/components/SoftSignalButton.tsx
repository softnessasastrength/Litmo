import { Text, View } from "react-native";
import { Button } from "./ui";
import { SOFT_SIGNAL_COPY } from "../lib/softSignalCore";
import {
  CONSENT_POINTS,
  mayFireSoftSignal,
} from "../lib/consentInteractionCore";
import { fonts, type AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";

type Props = {
  onPress: () => void;
  disabled?: boolean;
  state?: "idle" | "stopping" | "stopped";
  /** Larger hit target for active session / hardware parity. */
  prominent?: boolean;
  showBanner?: boolean;
  explain?: boolean;
  /** Compact sticky mode: less copy density, same stop authority. */
  sticky?: boolean;
};

const point = CONSENT_POINTS.soft_signal_active;

/**
 * Soft Signal control — impossible to miss, emotionally safe copy.
 * Micro-grammar: weight 100, no arm, offline, stop faster than grant.
 * Label + shape + position carry meaning (not color alone).
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

  const phase =
    state === "stopping"
      ? "firing"
      : state === "stopped"
        ? "settled"
        : "idle";
  const canFire = mayFireSoftSignal({
    alreadyEnded: state === "stopped",
    phase,
  });

  const label =
    state === "stopping"
      ? SOFT_SIGNAL_COPY.buttonStopping
      : state === "stopped"
        ? SOFT_SIGNAL_COPY.buttonStopped
        : point.copy.primary;

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
      {/* softSignalLocalCommitMs === 0: local end is immediate; UI never waits. */}
      <View style={[styles.buttonShell, sticky && styles.buttonShellSticky]}>
        <Button
          variant="signal"
          label={label}
          disabled={
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
          {point.copy.secondary ?? SOFT_SIGNAL_COPY.hint}
        </Text>
      ) : null}
      <Text style={styles.notEmergency} accessibilityRole="text">
        {SOFT_SIGNAL_COPY.notEmergency}
      </Text>
    </View>
  );
}

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
