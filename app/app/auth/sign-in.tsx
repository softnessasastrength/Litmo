import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { mapExternalError } from "../../services/errors";
import { colors } from "../../theme";
import { runtimeConfig } from "../../config/runtime";

export default function SignInScreen() {
  const { signInWithPasskey, enterDemoMode, status } = useAuth();
  const [error, setError] = useState("");
  const busy = status === "authenticating";
  const submit = async () => {
    setError("");
    try {
      await signInWithPasskey();
    } catch (caught) {
      setError(mapExternalError(caught).message);
    }
  };
  return (
    <Screen>
      <Eyebrow>WELCOME BACK</Eyebrow>
      <Title>Return with your passkey.</Title>
      <Body muted>
        Apple verifies you with Face ID or your device passcode. Litmo never
        receives biometric data, and there is no password to remember.
      </Body>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button
        label={busy ? "Checking with Apple…" : "Sign in with passkey"}
        disabled={busy}
        onPress={() => void submit()}
      />
      <Link href="/auth/sign-up" style={styles.link}>
        New here? Create an account
      </Link>
      <Link href={"/auth/recovery" as never} style={styles.link}>
        Can’t access your passkey?
      </Link>
      {runtimeConfig.allowDemo ? (
        <>
          <Button
            variant="secondary"
            label="Continue without an account (demo mode)"
            onPress={enterDemoMode}
          />
          <Body muted center>
            Demo mode uses imaginary people and local data only.
          </Body>
        </>
      ) : null}
    </Screen>
  );
}

export const authFormStyles = StyleSheet.create({
  form: { gap: 10, marginTop: 20 },
  label: { color: colors.ink, fontWeight: "700", marginTop: 6 },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    color: colors.ink,
    paddingHorizontal: 16,
    fontSize: 17,
  },
  error: { color: colors.signal, lineHeight: 21, marginVertical: 5 },
  link: {
    color: colors.moss,
    fontWeight: "800",
    textAlign: "center",
    padding: 14,
  },
});
const styles = authFormStyles;
