import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
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
  REPORT_CATEGORIES,
  reportService,
  type MyReport,
} from "../../services/reportService";
import { colors } from "../../theme";

function categoryLabel(id: string): string {
  return REPORT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function statusLabel(report: MyReport): string {
  if (report.status === "submitted") return "Received";
  if (report.status === "under_review") return "Under review";
  if (report.closedOutcome === "action_taken") return "Closed — action taken";
  if (report.closedOutcome === "info_needed")
    return "Closed — more info may be needed";
  if (report.closedOutcome === "no_action") return "Closed — no action";
  return "Closed";
}

export default function MyReportsScreen() {
  return (
    <SensitiveAccessGate>
      <MyReportsContent />
    </SensitiveAccessGate>
  );
}

function MyReportsContent() {
  const { status } = useAuth();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready"; rows: MyReport[] }
  >({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const rows = await reportService.listMyReports();
      setState({ kind: "ready", rows });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Your reports could not be loaded.",
      });
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [load, status]);

  if (status !== "authenticated") {
    return (
      <Screen>
        <Eyebrow>MY REPORTS</Eyebrow>
        <Title>Sign in to view reports.</Title>
      </Screen>
    );
  }

  if (state.kind === "loading") {
    return <LoadingState label="Loading your reports…" />;
  }
  if (state.kind === "error") {
    return (
      <FailureState
        title="Reports unavailable"
        message={state.message}
        onRetry={() => void load()}
      />
    );
  }
  if (state.rows.length === 0) {
    return (
      <Screen>
        <Eyebrow>MY REPORTS</Eyebrow>
        <Title>No reports yet.</Title>
        <EmptyState
          title="Nothing submitted"
          message="When you report someone, you will see a private status here. The other person never sees this list."
        />
        <Button
          variant="secondary"
          label="Refresh"
          onPress={() => void load()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Eyebrow>MY REPORTS</Eyebrow>
      <Title>What you submitted</Title>
      <Body muted>
        Status is for you only. Details of any internal review stay private.
        Litmo does not promise a specific outcome.
      </Body>
      {state.rows.map((row) => (
        <Card key={row.id}>
          <Text style={styles.category}>{categoryLabel(row.category)}</Text>
          <Body muted>{statusLabel(row)}</Body>
          <Body muted>
            {new Date(row.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Body>
          {row.sessionId ? (
            <Body muted>Linked to a session you were part of.</Body>
          ) : null}
        </Card>
      ))}
      <Button variant="secondary" label="Refresh" onPress={() => void load()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  category: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 4,
  },
});
