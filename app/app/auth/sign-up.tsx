import { Link } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { mapExternalError } from "../../services/errors";
import { authFormStyles as styles } from "./sign-in";
export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await signUp(email, password, name);
    } catch (caught) {
      setError(mapExternalError(caught).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Eyebrow>A GENTLE BEGINNING</Eyebrow>
      <Title>Create your private account.</Title>
      <Body muted>
        Your name and preferences belong to you. Vibe information and consent
        boundaries remain separate.
      </Body>
      <View style={styles.form}>
        <Text style={styles.label}>What should we call you?</Text>
        <TextInput
          accessibilityLabel="Display name"
          autoComplete="name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
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
        <Text style={styles.label}>Password · at least 10 characters</Text>
        <TextInput
          accessibilityLabel="Password, at least 10 characters"
          autoComplete="new-password"
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
          label={busy ? "Creating account…" : "Create account"}
          disabled={busy || !email || !name.trim() || password.length < 10}
          onPress={() => void submit()}
        />
      </View>
      <Link href="/auth/sign-in" style={styles.link}>
        Already have an account? Sign in
      </Link>
    </Screen>
  );
}
