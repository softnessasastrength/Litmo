/**
 * Sensitive access gate — step-up Face ID before private screen content.
 *
 * WHAT: Hide children until authenticateSensitiveAction succeeds (or required=false).
 * WHY: Quiz results, Consent Snapshot, Soft Signal-adjacent private areas need step-up.
 * CONSENT: Unlock is device privacy, not session consent or Soft Signal.
 * EDGE CASES:
 *   - demo / pre-account required=false → children render without LocalAuthentication
 *   - deny/cancel → retry + back (never blank trap)
 * NEVER: Treat biometric success as Consent Snapshot yes; show children while denied.
 * SEE: BiometricLockContext · CODE_COMMENT_STANDARD (biometric lock)
 */

import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { LoadingState } from "./AsyncState";
import { Body, Button, Screen, Title } from "./ui";
import { useBiometricLock } from "../context/BiometricLockContext";

/**
 * WHAT: Step-up Face ID wrapper for private screens; fail closed until allowed.
 * WHY: Centralize gate UI so each private route does not reimplement deny/retry.
 * CONSENT: Gate does not grant touch or dual-confirm; only unlocks reading local UI.
 * EDGE CASES: required false short-circuits to allowed; busy/denied distinct UI states.
 * NEVER: Auto-retry in a tight loop that traps accessibility focus without exit.
 * SEE: useBiometricLock.authenticateSensitiveAction
 */
export function SensitiveAccessGate({ children }: PropsWithChildren) {
  const router = useRouter();
  const { authenticateSensitiveAction, required } = useBiometricLock();
  // When biometrics not required (demo), start allowed so Expo Go path stays smooth.
  const [allowed, setAllowed] = useState(!required);
  const [busy, setBusy] = useState(required);
  const [denied, setDenied] = useState(false);

  /**
   * WHAT: Run sensitive-action biometrics (or pass-through when not required).
   * WHY: Initial mount and “Try Face ID again” share one path.
   * CONSENT: Success unlocks UI only — not consent seal.
   * EDGE CASES: !required → allowed true without OS prompt; failure → denied UI.
   * NEVER: Set allowed true on error/cancel; log biometric templates (OS never gives them).
   */
  const tryAuth = useCallback(async () => {
    if (!required) {
      setAllowed(true);
      setBusy(false);
      setDenied(false);
      return;
    }
    // Fail closed: hide content while the OS prompt is outstanding.
    setBusy(true);
    setDenied(false);
    setAllowed(false);
    const ok = await authenticateSensitiveAction();
    setBusy(false);
    setAllowed(ok);
    setDenied(!ok);
  }, [authenticateSensitiveAction, required]);

  useEffect(() => {
    void tryAuth();
  }, [tryAuth]);

  if (allowed) return children;

  if (busy) {
    return <LoadingState label="Protecting this private area…" />;
  }

  if (denied) {
    return (
      <Screen>
        <Title>This area stays private.</Title>
        <Body muted>
          Face ID did not unlock this screen, so Litmo will not show quiz
          results or partner packages. Nothing was shared.
        </Body>
        <View style={{ gap: 12, marginTop: 8 }}>
          <Button
            label="Try Face ID again"
            onPress={() => void tryAuth()}
            accessibilityHint="Requests Apple Face ID again"
          />
          <Button
            label="Go back"
            variant="secondary"
            onPress={() => {
              // Prefer back stack; quizzes hub is a safe non-sensitive fallback.
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)/quizzes" as never);
            }}
          />
        </View>
      </Screen>
    );
  }

  // Initial frame before effect runs: still fail closed (no children flash).
  return <LoadingState label="Protecting this private area…" />;
}
