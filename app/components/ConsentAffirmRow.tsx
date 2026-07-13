/**
 * Granular consent affirm row — deliberate toggle with explicit a11y.
 * Used for prepare Soft Signal acks and mutual protective checks.
 * Never used for Soft Signal stop (that is SoftSignalButton).
 */

import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  CONSENT_TIMING,
  type ConsentPointId,
  assertConsentPoint,
} from "../lib/consentInteractionCore";
import { fonts, radius, type AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";

type Props = {
  pointId: ConsentPointId;
  /** Override primary copy when context-specific. */
  label?: string;
  detail?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

export function ConsentAffirmRow({
  pointId,
  label,
  detail,
  checked,
  onChange,
  disabled,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const spec = assertConsentPoint(pointId);
  const lastTap = useRef(0);
  const [pressed, setPressed] = useState(false);

  // Debounce accidental double toggles (Apple-level motor intentionality).
  const toggle = () => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastTap.current < CONSENT_TIMING.toggleDebounceMs) return;
    lastTap.current = now;
    onChange(!checked);
  };

  useEffect(() => {
    setPressed(false);
  }, [checked]);

  return (
    <Pressable
      onPress={toggle}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      accessibilityLabel={label ?? spec.a11yLabel}
      accessibilityHint={spec.a11yHint}
      style={[
        styles.row,
        checked && styles.rowOn,
        pressed && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
    >
      <View style={[styles.box, checked && styles.boxOn]} accessible={false}>
        <Text style={styles.boxMark}>{checked ? "✓" : ""}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, checked && styles.labelOn]}>
          {label ?? spec.copy.primary}
        </Text>
        {(detail ?? spec.copy.secondary) ? (
          <Text style={styles.detail}>{detail ?? spec.copy.secondary}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function makeStyles(colors: AppColors) {
  return {
    row: {
      flexDirection: "row" as const,
      gap: 12,
      padding: 14,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      minHeight: 56,
      alignItems: "flex-start" as const,
    },
    rowOn: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    rowPressed: { opacity: 0.92 },
    rowDisabled: { opacity: 0.45 },
    box: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.line,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: 2,
    },
    boxOn: {
      borderColor: colors.moss,
      backgroundColor: colors.moss,
    },
    boxMark: {
      color: colors.white,
      fontWeight: "800" as const,
      fontSize: 14,
    },
    copy: { flex: 1, gap: 4 },
    label: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: fonts.headline,
      lineHeight: 22,
    },
    labelOn: { color: colors.moss },
    detail: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
    },
  };
}
