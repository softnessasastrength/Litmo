import { useCallback, useEffect, useState } from "react";
import { Alert, Share, Text, View } from "react-native";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import { FailureState, LoadingState } from "../../components/AsyncState";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { useAuth } from "../../context/AuthContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { moderationService } from "../../services/moderationService";
import { safetyOpsService } from "../../services/safetyOpsService";
import { type AppColors } from "../../theme";

export default function StaffOperationsScreen() {
  return (
    <SensitiveAccessGate>
      <StaffOperationsContent />
    </SensitiveAccessGate>
  );
}

function StaffOperationsContent() {
  const styles = useThemedStyles(makeStyles);
  const { status } = useAuth();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "denied" }
    | { kind: "ready"; paused: boolean }
    | { kind: "error"; message: string }
  >({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      if (!(await moderationService.amIStaffModerator())) {
        setState({ kind: "denied" });
        return;
      }
      setState({
        kind: "ready",
        paused: await safetyOpsService.isMatchingPaused(),
      });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Safety operations could not be loaded.",
      });
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [load, status]);

  if (status !== "authenticated") {
    return (
      <Screen>
        <Eyebrow>SAFETY OPERATIONS</Eyebrow>
        <Title>Staff only.</Title>
      </Screen>
    );
  }
  if (state.kind === "loading") return <LoadingState label="Loading safety operations…" />;
  if (state.kind === "denied") {
    return (
      <Screen>
        <Eyebrow>SAFETY OPERATIONS</Eyebrow>
        <Title>Not available on this account.</Title>
        <Body muted>Only named staff moderators can use these controls.</Body>
      </Screen>
    );
  }
  if (state.kind === "error") {
    return (
      <FailureState
        title="Safety operations unavailable"
        message={state.message}
        onRetry={() => void load()}
      />
    );
  }

  const changePause = (enabled: boolean) => {
    Alert.alert(
      enabled ? "Pause all new matching?" : "Resume new matching?",
      enabled
        ? "Discovery and new session requests will stop for the entire private alpha. Existing safety controls remain available."
        : "Discovery and new session requests will become available again for admitted, eligible accounts.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: enabled ? "Pause matching" : "Resume matching",
          style: enabled ? "destructive" : "default",
          onPress: () => {
            void (async () => {
              setBusy(true);
              setError("");
              try {
                const paused = await safetyOpsService.setMatchingPaused(enabled);
                setState({ kind: "ready", paused });
              } catch (caught) {
                setError(
                  caught instanceof Error
                    ? caught.message
                    : "Matching state could not be changed.",
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Eyebrow>SAFETY OPERATIONS</Eyebrow>
      <Title>Private-alpha controls</Title>
      <Card>
        <Text style={[styles.status, state.paused && styles.paused]}>
          Matching is {state.paused ? "PAUSED" : "AVAILABLE"}
        </Text>
        <Body muted>
          This global switch affects discovery and new session requests only.
          Reporting, blocking, appeals, and the emergency stop remain available.
        </Body>
        <View style={styles.cardActions}>
          <Button
            variant={state.paused ? "secondary" : "signal"}
            label={busy
              ? "Updating…"
              : state.paused
                ? "Resume matching"
                : "Pause all new matching"}
            disabled={busy}
            onPress={() => changePause(!state.paused)}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.heading}>Issue one invitation</Text>
        <Body muted>
          Generates a single-use code that expires in seven days. The plaintext
          code is never stored and is shown only here.
        </Body>
        <View style={styles.cardActions}>
          <Button
            variant="secondary"
            label={busy ? "Issuing…" : "Issue invitation"}
            disabled={busy}
            onPress={() => {
              void (async () => {
                setBusy(true);
                setError("");
                setInviteCode(null);
                try {
                  setInviteCode(await safetyOpsService.issuePrivateAlphaInvite());
                } catch (caught) {
                  setError(
                    caught instanceof Error
                      ? caught.message
                      : "Invitation could not be issued.",
                  );
                } finally {
                  setBusy(false);
                }
              })();
            }}
          />
        </View>
        {inviteCode ? (
          <View style={styles.codeBlock}>
            <Text selectable accessibilityLabel="New private-alpha invitation code" style={styles.code}>
              {inviteCode}
            </Text>
            <Button
              label="Share invitation"
              onPress={() => {
                void Share.share({
                  title: "Litmo private-alpha invitation",
                  message: `Litmo private-alpha invitation (single use; expires in 7 days): ${inviteCode}`,
                });
              }}
            />
            <Body muted>
              Share it now. Leaving this screen permanently hides this plaintext code.
            </Body>
          </View>
        ) : null}
      </Card>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button variant="secondary" label="Refresh state" onPress={() => void load()} />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    status: {
      color: colors.moss,
      fontWeight: "900",
      fontSize: 16,
      marginBottom: 8,
    },
    paused: { color: colors.signal },
    heading: {
      color: colors.ink,
      fontWeight: "800",
      fontSize: 18,
      marginBottom: 8,
    },
    cardActions: { marginTop: 14 },
    codeBlock: { marginTop: 16, gap: 12 },
    code: {
      color: colors.ink,
      backgroundColor: colors.cream,
      borderColor: colors.line,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      fontFamily: "monospace",
      fontSize: 15,
      lineHeight: 22,
    },
    error: { color: colors.signal, textAlign: "center" as const },
  };
}

