import { useCallback, useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import { FailureState, LoadingState } from "../../components/AsyncState";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { useAuth } from "../../context/AuthContext";
import { useColors } from "../../context/ThemeContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { safetyOpsService } from "../../services/safetyOpsService";
import { type AppColors } from "../../theme";

export default function PrivateAlphaScreen() {
  return (
    <SensitiveAccessGate>
      <PrivateAlphaContent />
    </SensitiveAccessGate>
  );
}

function PrivateAlphaContent() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { status } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; admitted: boolean }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({
        kind: "ready",
        admitted: await safetyOpsService.amIPrivateAlphaMember(),
      });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Private-alpha access could not be checked.",
      });
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [load, status]);

  if (status !== "authenticated") {
    return (
      <Screen>
        <Eyebrow>PRIVATE ALPHA</Eyebrow>
        <Title>Sign in to continue.</Title>
      </Screen>
    );
  }
  if (state.kind === "loading") {
    return <LoadingState label="Checking private-alpha access…" />;
  }
  if (state.kind === "error") {
    return (
      <FailureState
        title="Access check unavailable"
        message={state.message}
        onRetry={() => void load()}
      />
    );
  }
  if (state.admitted) {
    return (
      <Screen>
        <Eyebrow>PRIVATE ALPHA</Eyebrow>
        <Title>You’re in the cohort.</Title>
        <Card>
          <Body>
            This account can use discovery and request new sessions while
            matching is available.
          </Body>
        </Card>
        <Body muted>
          Admission is not identity verification, proof of safety, or consent.
          Every session still requires its own active agreement.
        </Body>
        <Button variant="secondary" label="Check again" onPress={() => void load()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Eyebrow>PRIVATE ALPHA</Eyebrow>
      <Title>Redeem an invitation.</Title>
      <Body muted>
        A Litmo staff member can share a single-use invitation. It expires seven
        days after issuance.
      </Body>
      <TextInput
        accessibilityLabel="Private-alpha invitation code"
        autoCapitalize="none"
        autoCorrect={false}
        value={code}
        onChangeText={setCode}
        placeholder="48-character invitation code"
        placeholderTextColor={colors.muted}
        maxLength={64}
        style={styles.input}
      />
      <Button
        label={busy ? "Redeeming…" : "Redeem invitation"}
        disabled={busy || code.trim().length === 0}
        onPress={() => {
          void (async () => {
            setBusy(true);
            try {
              await safetyOpsService.redeemPrivateAlphaInvite(code);
              setCode("");
              setState({ kind: "ready", admitted: true });
            } catch (caught) {
              setState({
                kind: "error",
                message:
                  caught instanceof Error
                    ? caught.message
                    : "The invitation could not be redeemed.",
              });
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
      <Body muted>
        Codes are case-insensitive. Failed attempts are rate-limited and do not
        reveal whether a code existed, expired, or was already used.
      </Body>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    input: {
      minHeight: 56,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: 14,
      color: colors.ink,
      backgroundColor: colors.paper,
      fontSize: 16,
    },
  };
}

