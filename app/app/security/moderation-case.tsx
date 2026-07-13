import { useCallback, useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
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
  type CaseEvidence,
  type ModerationNote,
  type PermanentBanPolicySnapshot,
} from "../../services/moderationService";
import { REPORT_CATEGORIES } from "../../services/reportService";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import { SAFETY_OPS_CONSTITUTION_MAP } from "../../lib/safetyOpsCore";

function categoryLabel(id: string): string {
  return REPORT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function shortId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

export default function ModerationCaseScreen() {
  return (
    <SensitiveAccessGate>
      <ModerationCaseContent />
    </SensitiveAccessGate>
  );
}

function ModerationCaseContent() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
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
  const [evidence, setEvidence] = useState<CaseEvidence | null>(null);
  const [banPolicy, setBanPolicy] = useState<PermanentBanPolicySnapshot | null>(
    null,
  );
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
      const [rows, pack, policy] = await Promise.all([
        moderationService.listNotes(caseId),
        moderationService.getCaseEvidence(caseId),
        moderationService.getPermanentBanPolicy(),
      ]);
      setNotes(rows);
      setEvidence(pack);
      setBanPolicy(policy);
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

  const displayCategory = evidence?.category ?? category;
  const displayPriority = evidence?.priority ?? priority;
  const displayQueue = evidence?.queueStatus ?? queueStatus;
  const displayReported = evidence?.reportedId ?? reportedId;
  const displaySessionId = evidence?.sessionId ?? sessionId;

  return (
    <Screen>
      <Eyebrow>CASE</Eyebrow>
      <Title>{categoryLabel(displayCategory)}</Title>
      <Body muted>
        Priority {displayPriority || "—"} ·{" "}
        {(displayQueue || "—").replace(/_/g, " ")}
      </Body>
      <Card>
        <Text style={styles.section}>Evidence</Text>
        <Body muted>
          Staff-only. Counts are facts for judgment — not a safety score. Device
          encrypted notes cannot be read here.
        </Body>
        {evidence?.staffSharedMessage ? (
          <View style={styles.evidenceBlock}>
            <Text style={styles.evidenceLabel}>Reporter message</Text>
            <Body>{evidence.staffSharedMessage}</Body>
          </View>
        ) : (
          <Body muted>No staff-shared message on this report.</Body>
        )}
        <Body muted>
          Device-bound private note:{" "}
          {evidence?.hasDevicePrivateNote
            ? "present (not readable by staff)"
            : "none"}
        </Body>
        <Body muted>
          Reported {displayReported ? shortId(displayReported) : "—"}
          {evidence?.reporterId
            ? ` · Reporter ${shortId(evidence.reporterId)}`
            : ""}
        </Body>
        <Body muted>
          Other reports about this account:{" "}
          {evidence?.priorOtherReportsForReported ?? 0} · Open cases:{" "}
          {evidence?.priorOpenCasesForReported ?? 0}
        </Body>
        {evidence?.reportedActiveRestrictionKind ? (
          <Body muted>
            Active restriction: {evidence.reportedActiveRestrictionKind}
          </Body>
        ) : (
          <Body muted>No active matching restriction on reported account.</Body>
        )}
        {evidence?.session ? (
          <View style={styles.evidenceBlock}>
            <Text style={styles.evidenceLabel}>Linked session</Text>
            <Body muted>
              Status {evidence.session.status.replace(/_/g, " ")} ·{" "}
              {shortId(evidence.session.id)}
            </Body>
            <Body muted>
              Participants {shortId(evidence.session.userA)} /{" "}
              {shortId(evidence.session.userB)}
            </Body>
            <Body muted>
              Created{" "}
              {new Date(evidence.session.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {evidence.session.startedAt
                ? ` · Started ${new Date(evidence.session.startedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                : ""}
              {evidence.session.endedAt
                ? ` · Ended ${new Date(evidence.session.endedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                : ""}
            </Body>
          </View>
        ) : displaySessionId ? (
          <Body muted>
            Linked session id {shortId(displaySessionId)} (row not found).
          </Body>
        ) : (
          <Body muted>No session linked to this report.</Body>
        )}
      </Card>
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
        {displayReported ? (
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
                  displayReported,
                  "safety_review",
                  ends.toISOString(),
                  "Applied from moderator console case " + caseId,
                );
              })
            }
            accessibilityHint="Staff-only temporary matching hold. Cancels pending requests. Not automatic."
          />
        ) : null}
        <Body muted>
          Permanent ban is human-in-the-loop only (Constitution{" "}
          {SAFETY_OPS_CONSTITUTION_MAP.permanentBanHitl.join(", ")}). It never
          auto-applies from reports, rate limits, or trust events.
        </Body>
        {banPolicy && !banPolicy.completionAllowed ? (
          <Body muted>
            Permanent ban is blocked until a named second reviewer is configured
            and two distinct staff accounts exist. Matching holds remain
            available. This is fail-closed engineering, not legal approval.
          </Body>
        ) : null}
        {displayReported && banPolicy?.completionAllowed ? (
          <Button
            variant="signal"
            label={
              busy === "ban-request"
                ? "Requesting…"
                : "Request permanent ban (needs second staff)"
            }
            disabled={Boolean(busy)}
            onPress={() =>
              void run("ban-request", async () => {
                await moderationService.requestPermanentBan(
                  displayReported,
                  "safety_review",
                  "Requested from moderator console case " + caseId,
                  caseId,
                );
              })
            }
            accessibilityHint="Creates a pending permanent ban. A different staff account must confirm. Not automatic."
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

function makeStyles(colors: AppColors) {
  return {
    section: {
      color: colors.ink,
      fontWeight: "800",
      fontSize: 16,
      marginBottom: 8,
    },
    evidenceBlock: {
      marginTop: 10,
      gap: 4,
    },
    evidenceLabel: {
      color: colors.ink,
      fontWeight: "700",
      fontSize: 14,
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
  };
}
