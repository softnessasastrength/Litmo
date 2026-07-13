import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { computeCompatibility, type CompatibilityResult } from "@litmo/domain";
import {
  Body,
  Button,
  Card,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  mockConsentProfileVersion,
  mockSnapshotNow,
} from "../../data/mockConsentProfiles";
import {
  buildSnapshotRows,
  type SnapshotRow,
} from "../../lib/consentSnapshotView";
import { scheduleDemoNotification } from "../../services/notifications";
import {
  sessionRepository,
  type PersistedSnapshot,
} from "../../services/sessionRepository";
import { hapticService } from "../../services/hapticService";
import { type AppColors } from "../../theme";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { FailureState, LoadingState } from "../../components/AsyncState";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function ConsentSnapshotScreen() {
  return (
    <SensitiveAccessGate>
      <ConsentSnapshotContent />
    </SensitiveAccessGate>
  );
}

function ConsentSnapshotContent() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { id, sessionId } = useLocalSearchParams<{
    id?: string;
    sessionId?: string;
  }>();
  const realSessionId =
    typeof sessionId === "string" && sessionId.length > 0 ? sessionId : null;
  const isReal = Boolean(realSessionId);

  const [decision, setDecision] = useState("");
  const [confirmState, setConfirmState] = useState<
    "idle" | "confirming" | "waiting" | "error" | "withdrawing" | "ended"
  >("idle");
  const [confirmError, setConfirmError] = useState("");
  const [lifecycleNote, setLifecycleNote] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<PersistedSnapshot | null>(null);
  const [realRows, setRealRows] = useState<SnapshotRow[] | null>(null);
  const [realLoad, setRealLoad] = useState<
    "idle" | "loading" | "ready" | "error"
  >(isReal ? "loading" : "idle");
  const [realLoadError, setRealLoadError] = useState("");

  const mockRows = useMemo(() => {
    const result = computeCompatibility(
      mockConsentProfileVersion("self"),
      mockConsentProfileVersion(id ?? "maya"),
      mockSnapshotNow,
    );
    return buildSnapshotRows(result);
  }, [id]);

  const rows = isReal ? (realRows ?? []) : mockRows;

  const proceededRef = useRef(false);
  const leftRef = useRef(false);
  const attentionPlayedRef = useRef(false);
  const proceedToActive = async () => {
    if (proceededRef.current || leftRef.current) return;
    proceededRef.current = true;
    await sessionRepository.activateSession(realSessionId!);
    void scheduleDemoNotification(4);
    router.push({
      pathname: "/session/active",
      params: { sessionId: realSessionId! },
    });
  };

  const leaveEnded = (message: string) => {
    if (leftRef.current) return;
    leftRef.current = true;
    setConfirmState("ended");
    setLifecycleNote(message);
  };

  const applyCompatibility = (compatibility: CompatibilityResult | null) => {
    if (!compatibility) {
      setRealRows([]);
      return;
    }
    setRealRows(buildSnapshotRows(compatibility));
  };

  const loadRealSnapshot = async () => {
    if (!realSessionId) return;
    setRealLoad("loading");
    setRealLoadError("");
    try {
      let current =
        await sessionRepository.getLatestSessionSnapshot(realSessionId);
      if (!current) {
        current = await sessionRepository.createSnapshot(realSessionId);
      }
      setSnapshot(current);
      applyCompatibility(current.compatibility);
      setRealLoad("ready");
    } catch (caught) {
      setRealLoad("error");
      setRealLoadError(
        caught instanceof Error
          ? caught.message
          : "The Consent Snapshot could not be prepared. Check that the backend is running and both people have saved touch and consent profiles.",
      );
    }
  };

  useEffect(() => {
    if (isReal) void loadRealSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realSessionId]);

  // attention once when the snapshot is ready to read — invites a pause only;
  // never implies mutual agreement (confirmation is a separate, dual action).
  useEffect(() => {
    if (attentionPlayedRef.current) return;
    if (isReal && realLoad !== "ready") return;
    if (isReal && realLoad === "error") return;
    attentionPlayedRef.current = true;
    void hapticService.play("attention");
  }, [isReal, realLoad]);

  const confirmReal = async () => {
    setConfirmState("confirming");
    setConfirmError("");
    try {
      const created =
        snapshot ?? (await sessionRepository.createSnapshot(realSessionId!));
      setSnapshot(created);
      if (created.compatibility) applyCompatibility(created.compatibility);
      const result = await sessionRepository.confirmSnapshot(
        created.id,
        created.fingerprint,
      );
      if (result !== "ready") {
        setConfirmState("waiting");
        return;
      }
      await proceedToActive();
    } catch (caught) {
      setConfirmState("error");
      setConfirmError(
        caught instanceof Error
          ? caught.message
          : "This could not be confirmed right now.",
      );
    }
  };

  // Real sessions: hydrate status, leave if the counterpart already cancelled,
  // activate if already ready, and listen for ready / terminal changes.
  useEffect(() => {
    if (!realSessionId) return;
    let cancelled = false;
    const handleStatus = (status: string) => {
      if (cancelled || leftRef.current) return;
      if (status === "ready" || status === "active") {
        void proceedToActive();
        return;
      }
      if (
        status === "cancelled" ||
        status === "expired" ||
        status === "declined" ||
        status === "soft_signaled" ||
        status === "safety_ended" ||
        status === "completed"
      ) {
        leaveEnded(
          status === "cancelled" || status === "declined"
            ? "This consent process ended. No session will begin."
            : status === "expired"
              ? "This request expired before consent finished."
              : "This session is no longer available for consent review.",
        );
      }
    };
    void sessionRepository.getSession(realSessionId).then((session) => {
      handleStatus(session.status);
    });
    const unsubscribe = sessionRepository.subscribeToSession(
      realSessionId,
      (session) => handleStatus(session.status),
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realSessionId]);

  const confirm = () => {
    if (realSessionId) {
      void confirmReal();
      return;
    }
    void scheduleDemoNotification(4);
    router.push("/session/active");
  };

  const withdraw = async () => {
    if (!realSessionId) {
      router.replace("/home");
      return;
    }
    setConfirmState("withdrawing");
    setConfirmError("");
    try {
      await sessionRepository.withdrawConsent(realSessionId);
      router.replace("/home");
    } catch (caught) {
      setConfirmState("error");
      setConfirmError(
        caught instanceof Error
          ? caught.message
          : "Withdrawal could not be recorded right now.",
      );
    }
  };

  if (isReal && realLoad === "loading") {
    return <LoadingState label="Preparing the real Consent Snapshot…" />;
  }
  if (isReal && realLoad === "error") {
    return (
      <FailureState
        title="Snapshot unavailable"
        message={realLoadError}
        onRetry={() => void loadRealSnapshot()}
      />
    );
  }

  return (
    <Screen>
      <Eyebrow>{isReal ? "CONSENT SNAPSHOT" : "MOCK CONSENT SNAPSHOT"}</Eyebrow>
      <Title>Read every boundary before you agree.</Title>
      <Body>
        {isReal
          ? "This is the live, directional overlap of both participants' saved touch and consent profiles, computed by the trusted backend. A match and a Vibe Profile do not grant consent."
          : "This is the live, directional overlap of two mock preference sets computed by the real consent engine. A match and a Vibe Profile do not grant consent."}
      </Body>
      <Card style={styles.snapshot}>
        {rows.length === 0 ? (
          <Body muted>
            No shared permitted items to list. Either person may stop without
            granting consent.
          </Body>
        ) : (
          rows.map((item) => (
            <View
              key={item.label}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${item.label}: ${item.value}`}
              style={styles.row}
            >
              <Text accessible={false} style={styles.label}>
                {item.label}
              </Text>
              <Text accessible={false} allowFontScaling style={styles.value}>
                {item.value}
              </Text>
            </View>
          ))
        )}
      </Card>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Consent decision. Choose whether this snapshot matches what you agree to now."
        style={styles.decisions}
      >
        <Choice
          label="Yes, this matches what I agree to now"
          selected={decision === "yes"}
          onPress={() => setDecision("yes")}
        />
        <Choice
          label="No, I want to change or stop"
          selected={decision === "no"}
          onPress={() => setDecision("no")}
        />
      </View>
      {decision === "no" ? (
        <View
          style={styles.stop}
          accessible
          accessibilityRole="summary"
          accessibilityLabel="Nothing moves forward. Withdrawal cancels consent without penalty."
        >
          <Text style={styles.stopTitle}>Nothing moves forward.</Text>
          <Text style={styles.stopBody}>
            You never owe an explanation. Withdrawal cancels pre-activation
            consent without penalty.
          </Text>
          <Button
            variant="signal"
            label={
              confirmState === "withdrawing"
                ? "Withdrawing…"
                : isReal
                  ? "Withdraw and leave"
                  : "Leave this mock snapshot"
            }
            disabled={confirmState === "withdrawing"}
            onPress={() => void withdraw()}
            accessibilityLabel={
              isReal
                ? "Withdraw and leave without granting consent"
                : "Leave this mock snapshot without granting consent"
            }
            accessibilityHint="Ends this consent process without requiring a reason. Does not grant consent."
          />
        </View>
      ) : null}
      {confirmState === "waiting" ? (
        <View style={styles.waiting}>
          <Text style={styles.waitingTitle}>
            Your confirmation is recorded.
          </Text>
          <Text style={styles.waitingBody}>
            Waiting for the other person to confirm the same snapshot. This
            screen updates automatically when they do — or if they withdraw.
          </Text>
        </View>
      ) : null}
      {confirmState === "ended" && lifecycleNote ? (
        <View style={styles.stop}>
          <Text style={styles.stopTitle}>Consent review ended</Text>
          <Text style={styles.stopBody}>{lifecycleNote}</Text>
          <Button
            label="Back to home"
            onPress={() => router.replace("/home")}
          />
        </View>
      ) : null}
      {decision !== "no" && confirmState !== "ended" ? (
        <Button
          label={
            confirmState === "confirming"
              ? "Confirming…"
              : confirmState === "waiting"
                ? "Check again"
                : isReal
                  ? "Confirm this snapshot"
                  : "Confirm this mock snapshot"
          }
          disabled={
            decision !== "yes" ||
            confirmState === "confirming" ||
            confirmState === "waiting" ||
            (isReal && rows.length === 0)
          }
          onPress={confirm}
          accessibilityHint={
            decision !== "yes"
              ? "Choose Yes above before confirming. Confirming records only your agreement to this snapshot."
              : "Records your confirmation of this exact snapshot. Does not mean the other person has confirmed yet."
          }
        />
      ) : null}
      {confirmState === "error" ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {confirmError}
        </Text>
      ) : null}
      {!isReal ? (
        <Body muted center>
          In a real Litmo session, each person would confirm independently. This
          prototype simulates both confirmations with mock preference sets.
        </Body>
      ) : (
        <Body muted center>
          Each person confirms the same immutable snapshot independently. If
          either profile changes, this snapshot is no longer current.
        </Body>
      )}
      <Button
        variant="secondary"
        label="Share snapshot review nearby"
        disabled={rows.length === 0}
        onPress={() =>
          router.push({
            pathname: "/share/local",
            params: {
              kind: "consent_snapshot_review",
              title: isReal
                ? "Consent Snapshot review"
                : "Mock Consent Snapshot review",
              rows: JSON.stringify(rows),
            },
          } as never)
        }
        accessibilityHint="Opens intentional Multipeer nearby share for co-located snapshot review only. Never activates a session or grants consent."
      />
      <Body muted center>
        Nearby share is co-located review only. It does not replace independent
        confirmation or activate a session.
      </Body>
      <Body muted center>
        Confirming may ask for notification permission and send one local
        notification so you can see how session alerts will feel.
      </Body>
    </Screen>
  );
}
function makeStyles(colors: AppColors) {
  return {
    snapshot: { gap: 0 },
    row: {
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    label: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    value: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 23,
      marginTop: 4,
      fontWeight: "600",
    },
    decisions: { gap: 10 },
    stop: { padding: 16, borderRadius: 16, backgroundColor: colors.signalSoft },
    stopTitle: { color: colors.signal, fontWeight: "800" },
    stopBody: { color: colors.ink, lineHeight: 21, marginTop: 4 },
    waiting: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.mossSoft,
    },
    waitingTitle: { color: colors.moss, fontWeight: "800" },
    waitingBody: { color: colors.ink, lineHeight: 21, marginTop: 4 },
    error: { color: colors.signal, textAlign: "center" },
  };
}
