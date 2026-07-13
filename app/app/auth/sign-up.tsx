import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { mapExternalError } from "../../services/errors";
import { authFormStyles } from "./sign-in";
import { useThemedStyles } from "../../hooks/useThemedStyles";

type Step = "details" | "code" | "passkey";

export default function SignUpScreen() {
  const styles = useThemedStyles(authFormStyles);
  const {
    requestAccountCode,
    confirmAccountAndCreatePasskey,
    isPasskeyPlatformReady,
  } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("details");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [platformReady, setPlatformReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void isPasskeyPlatformReady().then((ok) => {
      if (!cancelled) setPlatformReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [isPasskeyPlatformReady]);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      if (step === "details") {
        await requestAccountCode(email, name);
        setStep("code");
      } else if (step === "code" || step === "passkey") {
        setStep("passkey");
        // Verifies OTP (if still valid) then opens Face ID passkey sheet.
        await confirmAccountAndCreatePasskey(email, code);
      }
    } catch (caught) {
      const mapped = mapExternalError(caught);
      setError(mapped.message);
      // If passkey cancelled after OTP, return to code step with calm copy.
      if (mapped.code === "auth_cancelled" && step === "passkey") {
        setStep("code");
      } else if (step === "passkey") {
        setStep("code");
      }
    } finally {
      setBusy(false);
    }
  };

  const stepLabel =
    step === "details"
      ? "Step 1 of 3 · Email"
      : step === "code"
        ? "Step 2 of 3 · Confirm ownership"
        : "Step 3 of 3 · Create passkey";

  return (
    <Screen>
      <Eyebrow>CREATE ACCOUNT</Eyebrow>
      <Title>
        {step === "details"
          ? "Create your private account."
          : step === "code"
            ? "Confirm, then create your passkey."
            : "Face ID will save your passkey."}
      </Title>
      <Text style={styles.step}>{stepLabel}</Text>
      <Body muted>
        {step === "details"
          ? "Litmo is passkey-first. Email is only used once to prove ownership — it is never a password."
          : step === "code"
            ? `Enter the one-time code sent to ${email}. Next, Apple will ask for Face ID or your passcode to create your passkey.`
            : "Apple stores your passkey in iCloud Keychain with user verification required. Litmo never sees your biometrics."}
      </Body>

      {platformReady === false ? (
        <Body muted>
          Passkey registration needs an iOS development build (not Expo Go). You
          can still explore with demo mode from the entry screen.
        </Body>
      ) : null}

      <View style={styles.form}>
        {step === "details" ? (
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
        ) : null}
        {step === "code" || step === "passkey" ? (
          <>
            <Text style={styles.label}>One-time confirmation code</Text>
            <TextInput
              accessibilityLabel="One-time confirmation code"
              autoComplete="one-time-code"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              style={styles.input}
              editable={step === "code"}
            />
          </>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          label={
            busy
              ? step === "passkey"
                ? "Waiting for Face ID…"
                : "Checking…"
              : step === "details"
                ? "Send confirmation code"
                : step === "code"
                  ? "Confirm and create passkey"
                  : "Creating passkey…"
          }
          disabled={
            busy ||
            platformReady === false ||
            (step === "details" && (!email || !name.trim())) ||
            (step === "code" && code.length < 6)
          }
          onPress={() => void submit()}
          accessibilityHint={
            step === "details"
              ? "Sends a one-time ownership code. Not a password."
              : "Verifies the code and opens Apple passkey registration with Face ID."
          }
        />
      </View>
      <Body muted>
        After your passkey is created, this phone registers a private device
        secret for privacy features and fail-closed restore.
      </Body>
      <Link href="/auth/sign-in" style={styles.link}>
        Already have an account? Sign in with a passkey
      </Link>
    </Screen>
  );
}
