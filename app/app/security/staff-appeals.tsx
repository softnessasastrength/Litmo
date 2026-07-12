import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import {
  EmptyState,
  FailureState,
  LoadingState,
} from "../../components/AsyncState";
import { useAuth } from "../../context/AuthContext";
import { appealService, type OpenAppeal } from "../../services/appealService";
import { moderationService } from "../../services/moderationService";
import { colors } from "../../theme";

export default function StaffAppealsScreen() {
  return (
    <SensitiveAccessGate>
      <StaffAppealsContent />
    </SensitiveAccessGate>
  );
}

function StaffAppealsContent() {
  const { status } = useAuth();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "denied" }
    | { kind: "error"; message: string }
    | { kind: "ready"; rows: OpenAppeal[] }
  >({ kind: "loading" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const staff = await moderationService.amIStaffModerator();
      if (!staff) {
        setState({ kind: "denied" });
        return;
      }
      const rows = await appealService.listOpenAppeals();
      setState({ kind: "ready", rows });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Open appeals could not be loaded.",
      });
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [load, status]);

  if (status !== "authenticated") {
    return (
      <Screen>
        <Eyebrow>STAFF APPEALS</Eyebrow>
        <Title>Sign in required.</Title>
      </Screen>
    );
  }
  if (state.kind === "loading") {
    return <LoadingState label="Loading appeals…" />;
  }
  if (state.kind === "denied") {
    return (
      <Screen>
        <Eyebrow>STAFF APPEALS</Eyebrow>
        <Title>Staff only.</Title>
      </Screen>
    );
  }
  if (state.kind === "error") {
    return (
      <FailureState
        title="Appeals unavailable"
        message={state.message}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <Screen>
      <Eyebrow>STAFF APPEALS</Eyebrow>
      <Title>Open restriction appeals</Title>
      <Body muted>
        Human review only. Lifting an appeal removes the active hold. Upholding
        leaves the restriction in place.
      </Body>
      {state.rows.length === 0 ? (
        <EmptyState
          title="No open appeals"
          message="When someone appeals a hold, it appears here."
        />
      ) : (
        state.rows.map((row) => (
          <Card key={row.id}>
            <Text style={styles.kind}>
              {row.restrictionKind.replace(/_/g, " ")}
            </Text>
            <Body muted>
              {new Date(row.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Body>
            <Body>{row.statement}</Body>
            <View style={styles.actions}>
              <Button
                variant="secondary"
                label={busyId === `${row.id}-up` ? "…" : "Uphold"}
                disabled={Boolean(busyId)}
                onPress={() => {
                  void (async () => {
                    setBusyId(`${row.id}-up`);
                    setError("");
                    try {
                      await appealService.resolveAppeal(row.id, "upheld");
                      await load();
                    } catch (caught) {
                      setError(
                        caught instanceof Error
                          ? caught.message
                          : "Could not uphold appeal.",
                      );
                    } finally {
                      setBusyId(null);
                    }
                  })();
                }}
              />
              <Button
                label={busyId === `${row.id}-lift` ? "…" : "Lift restriction"}
                disabled={Boolean(busyId)}
                onPress={() => {
                  void (async () => {
                    setBusyId(`${row.id}-lift`);
                    setError("");
                    try {
                      await appealService.resolveAppeal(
                        row.id,
                        "lifted",
                        "Lifted after appeal review.",
                      );
                      await load();
                    } catch (caught) {
                      setError(
                        caught instanceof Error
                          ? caught.message
                          : "Could not lift via appeal.",
                      );
                    } finally {
                      setBusyId(null);
                    }
                  })();
                }}
              />
            </View>
          </Card>
        ))
      )}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button variant="secondary" label="Refresh" onPress={() => void load()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  kind: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  actions: { gap: 8, marginTop: 10 },
  error: { color: colors.signal, textAlign: "center" },
});
