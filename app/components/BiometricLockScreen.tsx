/**
 * Full-app biometric lock cover for real account sessions when app returns locked.
 *
 * WHAT: Modal-like overlay with Face ID unlock while BiometricLockContext is locked.
 * WHY: Private vault / account surfaces must not flash under the OS app switcher.
 * CONSENT: Unlock is device access control only — never session consent or Soft Signal.
 * EDGE CASES: busy during checking/authenticating disables button; message from state.
 * NEVER: Store face templates; claim Face ID proves adult age or peer safety.
 * SEE: BiometricLockContext · SensitiveAccessGate (step-up for single screens)
 */

import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBiometricLock } from "../context/BiometricLockContext";
import { fonts, type AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { Body, Button } from "./ui";

/**
 * WHAT: Absolute-fill cover styles so locked content cannot be interacted with.
 * WHY: zIndex 10000 sits above navigation chrome during lock.
 * CONSENT: Presentation only.
 * EDGE CASES: none — pure style map.
 * NEVER: Transparent cover that still allows taps through to private screens.
 */
function makeStyles(colors: AppColors) {
  return {
    cover: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.cream,
      zIndex: 10_000,
    },
    safe: {
      flex: 1,
      padding: 28,
      justifyContent: "space-between" as const,
    },
    mark: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.paper,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    markText: {
      color: colors.plum,
      fontFamily: fonts.wordmark,
      fontSize: 42,
    },
    copy: { gap: 14 },
    kicker: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "800" as const,
      letterSpacing: 2,
    },
    title: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 48,
      lineHeight: 54,
    },
    action: { gap: 16 },
    note: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center" as const,
    },
  };
}

/**
 * WHAT: Full-screen lock UI bound to biometric lock context unlock().
 * WHY: Real accounts require Face ID after backgrounding; demo may skip via provider.
 * CONSENT: Not a consent surface for touch; success only unlocks app shell.
 * EDGE CASES: checking/authenticating → busy disabled button + waiting copy.
 * NEVER: Bypass lock for “just browsing” when provider required=true.
 * SEE: useBiometricLock unlock · accessibilityViewIsModal
 */
export function BiometricLockScreen() {
  const { state, unlock } = useBiometricLock();
  const styles = useThemedStyles(makeStyles);
  const busy = state.status === "checking" || state.status === "authenticating";
  return (
    <View style={styles.cover} accessibilityViewIsModal>
      <SafeAreaView style={styles.safe}>
        <View style={styles.mark}>
          <Text style={styles.markText}>L</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>PRIVATE BY DEFAULT</Text>
          <Text style={styles.title}>Litmo is locked.</Text>
          <Body muted>{busy ? "Waiting for Face ID…" : state.message}</Body>
        </View>
        <View style={styles.action}>
          <Button
            label={busy ? "Face ID in progress…" : "Unlock with Face ID"}
            onPress={() => void unlock()}
            disabled={busy}
            accessibilityHint="Uses Apple Face ID; no biometric data is stored by Litmo"
          />
          <Text style={styles.note}>
            Litmo receives only Apple’s success or failure result. Your face
            data never enters the app.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
