/**
 * ConsentAffirmRow — deliberate checkbox row for prepare/grant affirmations.
 *
 * WHAT: Renders one catalog-backed consent affirm control (checkbox + label +
 *       optional detail) with debounce, a11y, and moss “on” styling.
 * WHY:  Grant and prepare toggles must not be ad-hoc Pressables with drifted
 *       copy. Every affirm maps to a ConsentPointId so product review, a11y,
 *       and neverMeans stay centralized in consentInteractionCore.
 * CONSENT: PREPARE or GRANT building blocks only (Soft Signal acks, mutual
 *       protective checks, purpose acks). This is NOT a stop control.
 *       Soft Signal uses SoftSignalButton — faster, no arm, no debounce delay
 *       that could strand a body in contact.
 * EDGE CASES:
 *   - Double-tap within toggleDebounceMs → second tap ignored (motor noise).
 *   - disabled true → no toggle; a11y state exposes disabled.
 *   - Unknown pointId → assertConsentPoint throws (fail loud in dev).
 *   - checked flips from parent → local pressed visual resets (no stuck press).
 *   - Color alone never means state: checkbox mark + role=checkbox + label.
 * NEVER:
 *   - Checking a row is not dual seal and not session activation.
 *   - Not Soft Signal / withdraw.
 *   - Not proof a partner is safe.
 * SEE: docs/CODE_COMMENT_STANDARD.md, CONSENT_POINTS, ConsentAcceptGate (share),
 *      SoftSignalButton (withdraw).
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
  /**
   * Catalog id — drives a11y label/hint, default copy, neverMeans philosophy.
   * Callers override label only when context needs more specificity.
   */
  pointId: ConsentPointId;
  /** Override primary copy when context-specific (still same point id). */
  label?: string;
  /** Override secondary detail line. */
  detail?: string;
  /** Controlled checked state — parent owns consent form state. */
  checked: boolean;
  /**
   * Parent receives the next boolean.
   * WHY controlled: seal forms need to know all toggles for arming.
   */
  onChange: (next: boolean) => void;
  /** When true, no interaction (e.g. package loading or already sealed). */
  disabled?: boolean;
};

/**
 * WHAT: Controlled consent checkbox row bound to a ConsentPointId.
 * WHY:  Shared motor intentionality (debounce) + catalog copy for every affirm.
 * CONSENT: Affirm/prepare only — never stop, never auto-seal.
 * EDGE CASES: Debounce, disabled, assert unknown id, pressed reset on check.
 * NEVER: Treat checked as mutual consent or touch permission.
 * SEE: Module header.
 */
export function ConsentAffirmRow({
  pointId,
  label,
  detail,
  checked,
  onChange,
  disabled,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  // Fail loud if a screen invents a free-string id — consent points are closed.
  const spec = assertConsentPoint(pointId);
  // lastTap enforces toggleDebounceMs across rapid motor noise / double fires.
  const lastTap = useRef(0);
  // pressed is visual-only feedback; does not change consent state.
  const [pressed, setPressed] = useState(false);

  /**
   * WHAT: Toggle checked with debounce and disabled guard.
   * WHY:  Accidental double-toggles would flip yes→no→yes and confuse arming.
   * CONSENT: Still only flips a prepare/grant checkbox — parent decides seal.
   * EDGE CASES: disabled no-op; within debounce window no-op; else invert.
   * NEVER: Does not call Soft Signal; does not network.
   */
  const toggle = () => {
    // Disabled rows must not change form state (loading / sealed / withdrawn UI).
    if (disabled) return;
    const now = Date.now();
    // Apple-level motor intentionality: ignore bounce within toggleDebounceMs.
    // Grant is slow; Soft Signal intentionally does NOT use this debounce path.
    if (now - lastTap.current < CONSENT_TIMING.toggleDebounceMs) return;
    lastTap.current = now;
    // Controlled invert — parent may reject by not updating `checked`.
    onChange(!checked);
  };

  useEffect(() => {
    // When parent commits a new checked value, clear pressed so we do not
    // leave a half-opacity row after external setState (e.g. form reset).
    setPressed(false);
  }, [checked]);

  return (
    <Pressable
      onPress={toggle}
      // Press-in/out only for affordance opacity — not a long-press grant.
      // Long-press-required-before-stop is forbidden on Soft Signal; here we
      // also avoid long-press-to-check so a11y and motor path stay single-tap.
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      // Role checkbox: meaning is not color-only (VoiceOver announces state).
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      // Prefer catalog a11y unless caller overrides label for context.
      accessibilityLabel={label ?? spec.a11yLabel}
      accessibilityHint={spec.a11yHint}
      style={[
        styles.row,
        // Moss “on” = grant/prepare visual role (not signal/withdraw rose).
        checked && styles.rowOn,
        pressed && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
    >
      {/* Mark box is decorative for AT (accessible=false); Pressable owns a11y. */}
      <View style={[styles.box, checked && styles.boxOn]} accessible={false}>
        {/* Glyph reinforces state for sighted users; not the only cue. */}
        <Text style={styles.boxMark}>{checked ? "✓" : ""}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, checked && styles.labelOn]}>
          {/* Copy from catalog keeps product language consistent across screens. */}
          {label ?? spec.copy.primary}
        </Text>
        {(detail ?? spec.copy.secondary) ? (
          <Text style={styles.detail}>{detail ?? spec.copy.secondary}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * WHAT: Theme-derived styles for the affirm row.
 * WHY:  Moss soft fill when on — grant visual role; minHeight 56 ≥ 44pt target.
 * CONSENT: Visual weight supports deliberate yes; not Soft Signal signal-rose.
 * EDGE CASES: disabled opacity 0.45 still keeps text readable (not blank).
 * NEVER: Styles alone must not be the only meaning of checked state.
 */
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
      // 56pt meets CONSENT_POINTS minTouchTarget for mutual affirm class.
      minHeight: 56,
      alignItems: "flex-start" as const,
    },
    rowOn: {
      // Grant/prepare moss — never signal rose (withdraw color role).
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    // Light press feedback only; no spring bounce (banSpringBounceOnConsent).
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
