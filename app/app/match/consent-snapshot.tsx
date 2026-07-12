import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { computeCompatibility } from "@litmo/domain";
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
import { buildSnapshotRows } from "../../lib/consentSnapshotView";
import { scheduleDemoNotification } from "../../services/notifications";
import {
  sessionRepository,
  type PersistedSnapshot,
} from "../../services/sessionRepository";
import { colors } from "../../theme";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";

export default function ConsentSnapshotScreen() {
  return (
    <SensitiveAccessGate>
      <ConsentSnapshotContent />
    </SensitiveAccessGate>
  );
}

function ConsentSnapshotContent() {
  const router = useRouter();
  const { id, sessionId } = useLocalSearchParams<{
    id: string;
    sessionId?: string;
  }>();
  const [decision, setDecision] = useState("");
  const [confirmState, setConfirmState] = useState<
    "idle" | "confirming" | "waiting" | "error"
  >("idle");
  const [confirmError, setConfirmError] = useState("");
  const [snapshot, setSnapshot] = useState<PersistedSnapshot | null>(null);
  const rows = useMemo(() => {
    const result = computeCompatibility(
      mockConsentProfileVersion("self"),
      mockConsentProfileVersion(id ?? "maya"),
      mockSnapshotNow,
    );
    return buildSnapshotRows(result);
  }, [id]);

  const confirmReal = async () => {
    setConfirmState("confirming");
    setConfirmError("");
    try {
      const created =
        snapshot ?? (await sessionRepository.createSnapshot(sessionId!));
      setSnapshot(created);
      const result = await sessionRepository.confirmSnapshot(
        created.id,
        created.fingerprint,
      );
      if (result !== "ready") {
        setConfirmState("waiting");
        return;
      }
      await sessionRepository.activateSession(sessionId!);
      void scheduleDemoNotification(4);
      router.push({ pathname: "/session/active", params: { sessionId } });
    } catch (caught) {
      setConfirmState("error");
      setConfirmError(
        caught instanceof Error
          ? caught.message
          : "This could not be confirmed right now.",
      );
    }
  };

  const confirm = () => {
    if (sessionId) {
      void confirmReal();
      return;
    }
    void scheduleDemoNotification(4);
    router.push("/session/active");
  };

  return (
    <Screen>
      <Eyebrow>
        {sessionId ? "CONSENT SNAPSHOT" : "MOCK CONSENT SNAPSHOT"}
      </Eyebrow>
      <Title>Read every boundary before you agree.</Title>
      <Body>
        This is the live, directional overlap of two mock preference sets
        computed by the real consent engine. A match and a Vibe Profile do not
        grant consent.
      </Body>
      <Card style={styles.snapshot}>
        {rows.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </Card>
      <View accessibilityRole="radiogroup" style={styles.decisions}>
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
        <View style={styles.stop}>
          <Text style={styles.stopTitle}>Nothing moves forward.</Text>
          <Text style={styles.stopBody}>
            You never owe an explanation. In this prototype, you can return and
            choose another path.
          </Text>
        </View>
      ) : null}
      {confirmState === "waiting" ? (
        <View style={styles.waiting}>
          <Text style={styles.waitingTitle}>
            Your confirmation is recorded.
          </Text>
          <Text style={styles.waitingBody}>
            Waiting for the other person to confirm the same snapshot before
            this session can begin. This screen doesn't update by itself yet —
            check again once they have.
          </Text>
        </View>
      ) : null}
      <Button
        label={
          confirmState === "confirming"
            ? "Confirming…"
            : confirmState === "waiting"
              ? "Check again"
              : sessionId
                ? "Confirm this snapshot"
                : "Confirm this mock snapshot"
        }
        disabled={decision !== "yes" || confirmState === "confirming"}
        onPress={confirm}
      />
      {confirmState === "error" ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {confirmError}
        </Text>
      ) : null}
      {!sessionId ? (
        <Body muted center>
          In a real Litmo session, each person would confirm independently. This
          prototype simulates both confirmations.
        </Body>
      ) : null}
      <Body muted center>
        Confirming will ask for notification permission and send one real local
        notification a few seconds later, so you can see how session alerts will
        actually work — not just a mockup.
      </Body>
    </Screen>
  );
}
const styles = StyleSheet.create({
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
  waiting: { padding: 16, borderRadius: 16, backgroundColor: colors.mossSoft },
  waitingTitle: { color: colors.moss, fontWeight: "800" },
  waitingBody: { color: colors.ink, lineHeight: 21, marginTop: 4 },
  error: { color: colors.signal, textAlign: "center" },
});
