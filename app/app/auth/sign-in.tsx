import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { mapExternalError } from "../../services/errors";
import type { AppColors } from "../../theme";
import { runtimeConfig } from "../../config/runtime";
import { environmentError } from "../../services/supabase";
import { useThemedStyles } from "../../hooks/useThemedStyles";

/** Shared themed form styles for sign-up / recovery / profile. */
export function authFormStyles(c: AppColors) {
  return {
    form: { gap: 10, marginTop: 8 },
    label: { color: c.ink, fontWeight: "700" as const, marginTop: 6 },
    input: {
      minHeight: 52,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.line,
      backgroundColor: c.paper,
      color: c.ink,
      paddingHorizontal: 16,
      fontSize: 17,
    },
    error: { color: c.signal, lineHeight: 21, marginVertical: 5 },
    link: {
      color: c.moss,
      fontWeight: "800" as const,
      textAlign: "center" as const,
      padding: 14,
    },
    seedBox: {
      marginTop: 8,
      padding: 14,
      borderRadius: 16,
      backgroundColor: c.mossSoft,
      gap: 6,
    },
    step: {
      color: c.moss,
      fontWeight: "800" as const,
      fontSize: 13,
      letterSpacing: 1,
      textTransform: "uppercase" as const,
    },
  };
}

export default function SignInScreen() {
  const styles = useThemedStyles(authFormStyles);
  const router = useRouter();
  const {
    signInWithPasskey,
    signInWithPassword,
    enterDemoMode,
    status,
    isPasskeyPlatformReady,
  } = useAuth();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("maya.demo@litmo.local");
  const [password, setPassword] = useState("LitmoDemo123!");
  const [showSeed, setShowSeed] = useState(false);
  const [platformReady, setPlatformReady] = useState<boolean | null>(null);
  const busy = status === "authenticating";
  const allowDevSeed = runtimeConfig.allowDemo && !environmentError;

  useEffect(() => {
    let cancelled = false;
    void isPasskeyPlatformReady().then((ok) => {
      if (!cancelled) setPlatformReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [isPasskeyPlatformReady]);

  const submitPasskey = async () => {
    setError("");
    try {
      await signInWithPasskey();
    } catch (caught) {
      setError(mapExternalError(caught).message);
    }
  };

  const submitSeed = async () => {
    setError("");
    try {
      await signInWithPassword(email, password);
    } catch (caught) {
      setError(mapExternalError(caught).message);
    }
  };

  return (
    <Screen>
      <Eyebrow>PASSKEY SIGN-IN</Eyebrow>
      <Title>Return with Face ID and your passkey.</Title>
      <Body muted>
        Real Litmo accounts use WebAuthn passkeys through Supabase Auth. Apple
        verifies you with Face ID, Touch ID, or your device passcode. Litmo
        never receives biometric data, and there is no password to remember.
      </Body>
      <Text style={styles.step}>Primary · Passkey</Text>

      {environmentError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {environmentError} Use demo mode below to explore without a backend.
        </Text>
      ) : null}
      {platformReady === false && !environmentError ? (
        <Body muted>
          This build cannot run passkeys (often Expo Go). Use a development
          build for real accounts, or continue in demo mode.
        </Body>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Button
        label={
          busy
            ? "Waiting for Face ID…"
            : "Sign in with passkey"
        }
        disabled={busy || Boolean(environmentError) || platformReady === false}
        onPress={() => void submitPasskey()}
        accessibilityHint="Starts Apple passkey authentication with Face ID or device passcode. Primary sign-in for real accounts."
      />
      <Body muted>
        After a successful passkey, this installation re-registers its private
        device secret. That protects restored backups and revoked phones.
      </Body>

      {!environmentError ? (
        <>
          <Link href="/auth/sign-up" style={styles.link}>
            New here? Create an account with a passkey
          </Link>
          <Link href={"/auth/recovery" as never} style={styles.link}>
            Can&apos;t access your passkey?
          </Link>
        </>
      ) : null}

      {allowDevSeed ? (
        <>
          <Button
            variant="secondary"
            label={
              showSeed
                ? "Hide development seed sign-in"
                : "Fallback: development seed account"
            }
            onPress={() => setShowSeed((v) => !v)}
            accessibilityHint="Local Supabase seed emails only. Not a production login path."
          />
          {showSeed ? (
            <View style={styles.seedBox}>
              <Body muted>
                Development only (ADR 0041). Passkeys remain the product path.
              </Body>
              <Text style={styles.label}>Email</Text>
              <TextInput
                accessibilityLabel="Seed account email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                accessibilityLabel="Seed account password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
              <Button
                variant="secondary"
                label={busy ? "Signing in…" : "Sign in with seed account"}
                disabled={busy || email.trim().length < 3 || password.length < 1}
                onPress={() => void submitSeed()}
              />
            </View>
          ) : null}
        </>
      ) : null}

      {runtimeConfig.allowDemo ? (
        <>
          <Button
            variant="secondary"
            label="Continue without an account (demo mode)"
            onPress={() => {
              enterDemoMode();
              router.replace("/onboarding/about-you");
            }}
            accessibilityHint="Starts the fictional local demo. No account is created."
          />
          <Body muted center>
            Demo mode uses imaginary people and local data only. No passkey
            required.
          </Body>
        </>
      ) : null}
    </Screen>
  );
}
