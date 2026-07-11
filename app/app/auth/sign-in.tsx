import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { mapExternalError } from "../../services/errors";
import { colors, radius } from "../../theme";
export default function SignInScreen() {
  const { signIn, enterDemoMode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (caught) {
      setError(mapExternalError(caught).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Eyebrow>WELCOME BACK</Eyebrow>
      <Title>Return to your quiet corner.</Title>
      <Body muted>
        Your session stays on this device until you sign out or it expires.
      </Body>
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          accessibilityLabel="Password"
          autoComplete="current-password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          label={busy ? "Signing in…" : "Sign in"}
          disabled={busy || !email || password.length < 8}
          onPress={() => void submit()}
        />
      </View>
      <Link href="/auth/sign-up" style={styles.link}>
        New here? Create an account
      </Link>
      <Button
        variant="secondary"
        label="Continue without an account (demo mode)"
        onPress={enterDemoMode}
        accessibilityHint="Explores Litmo with local, imaginary profiles. No account is created and nothing is saved."
      />
      <Body muted center>
        Demo mode uses imaginary people and local data only. It does not create
        a real account.
      </Body>
    </Screen>
  );
}
export const authFormStyles = StyleSheet.create({
  form: { gap: 10, marginTop: 20 },
  label: { color: colors.ink, fontWeight: "700", marginTop: 6 },
  input: {
    minHeight: 52,
    borderRadius: radius.sm,
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
