import { Text, View } from "react-native";
import { Button } from "./ui";
import { SOFT_SIGNAL_COPY } from "../lib/softSignalCore";
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
};

/**
 * Soft Signal control — impossible to miss, emotionally safe copy.
 * Label + shape + position carry meaning (not color alone).
 */
export function SoftSignalButton({
  onPress,
  disabled,
  state = "idle",
  prominent = true,
  showBanner = true,
  explain = true,
}: Props) {
  const styles = useThemedStyles(makeStyles);

  const label =
    state === "stopping"
      ? SOFT_SIGNAL_COPY.buttonStopping
      : state === "stopped"
        ? SOFT_SIGNAL_COPY.buttonStopped
        : SOFT_SIGNAL_COPY.button;

  return (
    <View
      style={[styles.wrap, prominent && styles.wrapProminent]}
      accessibilityRole="summary"
      accessibilityLabel="Soft Signal control. Ends the session immediately without explanation."
    >
      {showBanner ? (
        <View style={styles.banner} accessible accessibilityRole="text">
          <Text style={styles.bannerTitle}>{SOFT_SIGNAL_COPY.bannerTitle}</Text>
          <Text style={styles.bannerBody}>{SOFT_SIGNAL_COPY.bannerBody}</Text>
        </View>
      ) : null}
      <View style={styles.buttonShell}>
        <Button
          variant="signal"
          label={label}
          disabled={disabled || state === "stopping" || state === "stopped"}
          onPress={onPress}
          accessibilityLabel={
            state === "stopping"
              ? "Stopping session"
              : state === "stopped"
                ? "Session stopped safely"
                : "Soft Signal, end session now"
          }
          accessibilityHint={SOFT_SIGNAL_COPY.hint}
        />
      </View>
      {explain ? (
        <Text style={styles.explain} accessibilityRole="text">
          {SOFT_SIGNAL_COPY.hint}
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
      borderRadius: 20,
      borderWidth: 3,
      borderColor: colors.signal,
      padding: 4,
      backgroundColor: colors.signalSoft,
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
