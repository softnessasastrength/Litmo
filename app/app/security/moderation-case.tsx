import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import {
  moderationService,
  type ModerationNote,
} from "../../services/moderationService";
import { REPORT_CATEGORIES } from "../../services/reportService";
import { colors } from "../../theme";

function categoryLabel(id: string): string {
  return REPORT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export default function ModerationCaseScreen() {
  return (
    <SensitiveAccessGate>
      <ModerationCaseContent />
    </SensitiveAccessGate>
  );
}

function ModerationCaseContent() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    caseId?: string;
    reportedId?: string;
    category?: string;
    priority?: string;
    queueStatus?: string;
    sessionId?: string;
  }>();
  const caseId = typeof params.caseId === "string" ? params.caseId : "";
  const reportedId =
    typeof params.reportedId === "string" ? params.reportedId : "";
  const category = typeof params.category === "string" ? params.category : "";
  const priority = typeof params.priority === "string" ? params.priority : "";
  const queueStatus =
    typeof params.queueStatus === "string" ? params.queueStatus : "";
  const sessionId =
    typeof params.sessionId === "string" && params.sessionId.length > 0
      ? params.sessionId
      : null;

  const [notes, setNotes] = useState<ModerationNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "error" | "denied"
  >("loading");

  const load = useCallback(async () => {
    if (!caseId) return;
    setLoadState("loading");
    setError("");
    try {
      const staff = await moderationService.amIStaffModerator();
      if (!staff) {
        setLoadState("denied");
        return;
      }
      const rows = await moderationService.listNotes(caseId);
      setNotes(rows);
      setLoadState("ready");
    } catch (caught) {
      setLoadState("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "This case could not be loaded.",
      );
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (label: string, action: () => Promise<void>) => {
    setBusy(label);
    setError("");
    try {
      await action();
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "That action could not run.",
      );
    } finally {
      setBusy(null);
    }
  };

  if (!caseId) {
    return (
      <Screen>
        <Eyebrow>CASE</Eyebrow>
        <Title>Missing case.</Title>
        <Button label="Back to queue" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (loadState === "loading") {
    return <LoadingState label="Loading case…" />;
  }
  if (loadState === "denied") {
    return (
      <Screen>
        <Eyebrow>CASE</Eyebrow>
        <Title>Staff only.</Title>
        <Body muted>This account cannot open moderation cases.</Body>
      </Screen>
    );
  }
  if (loadState === "error" && notes.length === 0) {
    return (
      <FailureState
        title="Case unavailable"
        message={error}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <Screen>
      <Eyebrow>CASE</Eyebrow>
      <Title>{categoryLabel(category)}</Title>
      <Body muted>
        Priority {priority || "—"} · {queueStatus.replace(/_/g, " ") || "—"}
      </Body>
      {sessionId ? (
        <Body muted>
          Linked session present (private to participants + staff).
        </Body>
      ) : (
        <Body muted>No session linked to this report.</Body>
      )}
      <Card>
        <Text style={styles.section}>Actions</Text>
        <Body muted>
          Human review only. Resolving sets a coarse reporter-visible outcome.
          Holds pause matching without a public score.
        </Body>
        <Button
          variant="secondary"
          label={busy === "claim" ? "Claiming…" : "Claim this case"}
          disabled={Boolean(busy)}
          onPress={() =>
            void run("claim", () => moderationService.claimCase(caseId))
          }
        />
        <Button
          variant="secondary"
          label={busy === "resolve-none" ? "Closing…" : "Close — no action"}
          disabled={Boolean(busy)}
          onPress={() =>
            void run("resolve-none", () =>
              moderationService.resolveCase(caseId, "no_action"),
            )
          }
        />
        <Button
          variant="secondary"
          label={
            busy === "resolve-action" ? "Closing…" : "Close — action taken"
          }
          disabled={Boolean(busy)}
          onPress={() =>
            void run("resolve-action", () =>
              moderationService.resolveCase(caseId, "action_taken"),
            )
          }
        />
        <Button
          variant="secondary"
          label={busy === "resolve-info" ? "Closing…" : "Close — info needed"}
          disabled={Boolean(busy)}
          onPress={() =>
            void run("resolve-info", () =>
              moderationService.resolveCase(caseId, "info_needed"),
            )
          }
        />
        {reportedId ? (
          <Button
            variant="signal"
            label={
              busy === "hold" ? "Applying hold…" : "Apply 7-day matching hold"
            }
            disabled={Boolean(busy)}
            onPress={() =>
              void run("hold", async () => {
                const ends = new Date();
                ends.setDate(ends.getDate() + 7);
                await moderationService.applyMatchingHold(
                  reportedId,
                  "safety_review",
                  ends.toISOString(),
                  "Applied from moderator console case " + caseId,
                );
              })
            }
            accessibilityHint="Staff-only temporary matching hold. Cancels pending requests. Not automatic."
          />
        ) : null}
      </Card>
      <Card>
        <Text style={styles.section}>Internal notes</Text>
        {notes.length === 0 ? (
          <EmptyState
            title="No notes yet"
            message="Notes stay staff-only. They never appear on the reporter status screen."
          />
        ) : (
          notes.map((note) => (
            <View key={note.id} style={styles.note}>
              <Body muted>
                {new Date(note.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Body>
              <Body>{note.body}</Body>
            </View>
          ))
        )}
        <TextInput
          accessibilityLabel="Internal moderation note"
          multiline
          value={noteDraft}
          onChangeText={setNoteDraft}
          placeholder="Private staff note (not shown to either party)."
          placeholderTextColor={colors.muted}
          style={styles.input}
          maxLength={4000}
        />
        <Button
          label={busy === "note" ? "Saving…" : "Add note"}
          disabled={Boolean(busy) || noteDraft.trim().length < 1}
          onPress={() =>
            void run("note", async () => {
              await moderationService.addNote(caseId, noteDraft.trim());
              setNoteDraft("");
            })
          }
        />
      </Card>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button
        variant="secondary"
        label="Back to queue"
        onPress={() => router.replace("/security/moderation" as never)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 8,
  },
  note: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
    marginTop: 10,
    gap: 4,
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
    marginTop: 10,
  },
  error: { color: colors.signal, textAlign: "center" },
});
