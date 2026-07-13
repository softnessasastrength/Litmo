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
 * Step-up Face ID for private screens. In demo / pre-account states the
 * biometric provider reports required=false and authenticateSensitiveAction
 * resolves true without calling LocalAuthentication, so Expo Go can walk
 * Consent Snapshot, Soft Signal, wrap-up, quizzes, and trust history on
 * fictional data.
 *
 * Fail closed: content stays hidden until auth succeeds. Denied/cancel shows
 * retry and back (never a blank trap).
 */
export function SensitiveAccessGate({ children }: PropsWithChildren) {
  const router = useRouter();
  const { authenticateSensitiveAction, required } = useBiometricLock();
  const [allowed, setAllowed] = useState(!required);
  const [busy, setBusy] = useState(required);
  const [denied, setDenied] = useState(false);

  const tryAuth = useCallback(async () => {
    if (!required) {
      setAllowed(true);
      setBusy(false);
      setDenied(false);
      return;
    }
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
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)/quizzes" as never);
            }}
          />
        </View>
      </Screen>
    );
  }

  return <LoadingState label="Protecting this private area…" />;
}
