import { useCallback, useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
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
import {
  appealService,
  type ActiveRestriction,
  type MyAppeal,
} from "../../services/appealService";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";


export default function AppealsScreen() {
  return (
    <SensitiveAccessGate>
      <AppealsContent />
    </SensitiveAccessGate>
  );
}

function AppealsContent() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { status } = useAuth();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | {
        kind: "ready";
        restrictions: ActiveRestriction[];
        appeals: MyAppeal[];
      }
  >({ kind: "loading" });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [restrictions, appeals] = await Promise.all([
        appealService.listMyActiveRestrictions(),
        appealService.listMyAppeals(),
      ]);
      setState({ kind: "ready", restrictions, appeals });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Appeals could not be loaded.",
      });
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [load, status]);

  if (status !== "authenticated") {
    return (
      <Screen>
        <Eyebrow>APPEALS</Eyebrow>
        <Title>Sign in to appeal.</Title>
      </Screen>
    );
  }
  if (state.kind === "loading") {
    return <LoadingState label="Loading appeals…" />;
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
      <Eyebrow>APPEALS</Eyebrow>
      <Title>Human review of holds</Title>
      <Body muted>
        You can ask a person to reconsider an active matching hold or ban.
        Submitting an appeal does not promise a specific outcome.
      </Body>

      <Text style={styles.section}>Active restrictions</Text>
      {state.restrictions.length === 0 ? (
        <EmptyState
          title="No active holds"
          message="If matching is paused later, you can appeal from here."
        />
      ) : (
        state.restrictions.map((r) => (
          <Card key={r.id}>
            <Text style={styles.kind}>
              {r.kind === "permanent_ban" ? "Permanent ban" : "Matching hold"}
            </Text>
            <Body muted>
              {r.endsAt
                ? `Until ${new Date(r.endsAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`
                : "No automatic end date"}
            </Body>
            {r.hasOpenAppeal ? (
              <Body muted>An appeal is already open for this restriction.</Body>
            ) : (
              <>
                <TextInput
                  accessibilityLabel="Appeal statement"
                  multiline
                  value={drafts[r.id] ?? ""}
                  onChangeText={(text) =>
                    setDrafts((prev) => ({ ...prev, [r.id]: text }))
                  }
                  placeholder="Explain why you are asking for reconsideration (private to staff)."
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  maxLength={2000}
                />
                <Button
                  label={busyId === r.id ? "Submitting…" : "Submit appeal"}
                  disabled={
                    Boolean(busyId) || (drafts[r.id] ?? "").trim().length < 1
                  }
                  onPress={() => {
                    void (async () => {
                      setBusyId(r.id);
                      setError("");
                      try {
                        await appealService.submitAppeal(
                          r.id,
                          (drafts[r.id] ?? "").trim(),
                        );
                        setDrafts((prev) => ({ ...prev, [r.id]: "" }));
                        await load();
                      } catch (caught) {
                        setError(
                          caught instanceof Error
                            ? caught.message
                            : "Appeal could not be submitted.",
                        );
                      } finally {
                        setBusyId(null);
                      }
                    })();
                  }}
                />
              </>
            )}
          </Card>
        ))
      )}

      <Text style={styles.section}>Your appeals</Text>
      {state.appeals.length === 0 ? (
        <Body muted>No appeals submitted yet.</Body>
      ) : (
        state.appeals.map((a) => (
          <Card key={a.id}>
            <Text style={styles.kind}>{a.status.replace(/_/g, " ")}</Text>
            <Body muted>
              {a.restrictionKind.replace(/_/g, " ")} ·{" "}
              {new Date(a.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Body>
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

function makeStyles(colors: AppColors) {
  return {
  section: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 16,
    marginTop: 8,
  },
  kind: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  input: {
    minHeight: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    color: colors.ink,
    textAlignVertical: "top",
    backgroundColor: colors.cream,
    marginVertical: 10,
  },
  error: { color: colors.signal, textAlign: "center" },
};
}

