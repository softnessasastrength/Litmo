import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
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
  moderationService,
  type ModerationQueueRow,
  type QueueStatus,
} from "../../services/moderationService";
import { REPORT_CATEGORIES } from "../../services/reportService";
import { colors } from "../../theme";

function categoryLabel(id: string): string {
  return REPORT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function priorityLabel(p: string): string {
  return p.replace(/_/g, " ");
}

export default function ModerationQueueScreen() {
  return (
    <SensitiveAccessGate>
      <ModerationQueueContent />
    </SensitiveAccessGate>
  );
}

function ModerationQueueContent() {
  const router = useRouter();
  const { status } = useAuth();
  const [filter, setFilter] = useState<QueueStatus | "all">("open");
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "denied" }
    | { kind: "error"; message: string }
    | { kind: "ready"; rows: ModerationQueueRow[] }
  >({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const staff = await moderationService.amIStaffModerator();
      if (!staff) {
        setState({ kind: "denied" });
        return;
      }
      const rows = await moderationService.listQueue(
        filter === "all" ? null : filter,
      );
      setState({ kind: "ready", rows });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "The moderation queue could not be loaded.",
      });
    }
  }, [filter]);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [load, status]);

  if (status !== "authenticated") {
    return (
      <Screen>
        <Eyebrow>MODERATION</Eyebrow>
        <Title>Staff only.</Title>
        <Body muted>Sign in with a staff account to review reports.</Body>
      </Screen>
    );
  }

  if (state.kind === "loading") {
    return <LoadingState label="Loading moderation queue…" />;
  }
  if (state.kind === "denied") {
    return (
      <Screen>
        <Eyebrow>MODERATION</Eyebrow>
        <Title>Not available on this account.</Title>
        <Body muted>
          This console is only for people with a staff role. Ordinary accounts
          cannot see reports about others.
        </Body>
      </Screen>
    );
  }
  if (state.kind === "error") {
    return (
      <FailureState
        title="Queue unavailable"
        message={state.message}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <Screen>
      <Eyebrow>MODERATION</Eyebrow>
      <Title>Human review queue</Title>
      <Body muted>
        No automatic punishment. Claim a case, add private notes, then close
        with a coarse outcome the reporter can see.
      </Body>
      <View style={styles.filters}>
        {(
          [
            ["open", "Open"],
            ["in_progress", "In progress"],
            ["escalated", "Escalated"],
            ["resolved", "Resolved"],
            ["all", "All"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            variant={filter === value ? "primary" : "secondary"}
            label={label}
            onPress={() => setFilter(value)}
          />
        ))}
      </View>
      {state.rows.length === 0 ? (
        <EmptyState
          title="No cases here"
          message="When someone submits a structured report, it appears in this queue for human review."
        />
      ) : (
        state.rows.map((row) => (
          <Card key={row.caseId}>
            <Text style={styles.priority}>{priorityLabel(row.priority)}</Text>
            <Text style={styles.category}>{categoryLabel(row.category)}</Text>
            <Body muted>
              {row.queueStatus.replace(/_/g, " ")} · report{" "}
              {row.reportStatus.replace(/_/g, " ")}
            </Body>
            <Body muted>
              {new Date(row.caseCreatedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Body>
            <Button
              variant="secondary"
              label="Open case"
              onPress={() =>
                router.push({
                  pathname: "/security/moderation-case",
                  params: {
                    caseId: row.caseId,
                    reportId: row.reportId,
                    reportedId: row.reportedId,
                    category: row.category,
                    priority: row.priority,
                    queueStatus: row.queueStatus,
                    sessionId: row.sessionId ?? "",
                  },
                })
              }
            />
          </Card>
        ))
      )}
      <Button variant="secondary" label="Refresh" onPress={() => void load()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 8 },
  priority: {
    color: colors.signal,
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  category: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 17,
    marginBottom: 4,
  },
});
