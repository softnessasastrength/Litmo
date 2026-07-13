import { Link } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { mapExternalError } from "../../services/errors";
import { authFormStyles } from "./sign-in";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function SignUpScreen() {
  const styles = useThemedStyles(authFormStyles);
  const { requestAccountCode, confirmAccountAndCreatePasskey } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (!sent) {
        await requestAccountCode(email, name);
        setSent(true);
      } else await confirmAccountAndCreatePasskey(email, code);
    } catch (caught) {
      setError(mapExternalError(caught).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Eyebrow>A GENTLE BEGINNING</Eyebrow>
      <Title>
        {sent
          ? "Confirm, then create your passkey."
          : "Create your private account."}
      </Title>
      <Body muted>
        {sent
          ? `Enter the one-time code sent to ${email}. It only confirms account ownership; it cannot be used as a password.`
          : "Litmo uses an Apple passkey in iCloud Keychain. You will never create a password."}
      </Body>
      <View style={styles.form}>
        {!sent ? (
          <>
            <Text style={styles.label}>What should we call you?</Text>
            <TextInput
              accessibilityLabel="Display name"
              autoComplete="name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <Text style={styles.label}>Email for account confirmation</Text>
            <TextInput
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>One-time confirmation code</Text>
            <TextInput
              accessibilityLabel="One-time confirmation code"
              autoComplete="one-time-code"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              style={styles.input}
            />
          </>
        )}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          label={
            busy
              ? "Checking…"
              : sent
                ? "Confirm and create passkey"
                : "Send confirmation code"
          }
          disabled={
            busy ||
            (!sent && (!email || !name.trim())) ||
            (sent && code.length < 6)
          }
          onPress={() => void submit()}
        />
      </View>
      <Link href="/auth/sign-in" style={styles.link}>
        Already have an account? Sign in with a passkey
      </Link>
    </Screen>
  );
}
