import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { colors } from "../../theme";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { emergencyStopService } from "../../services/emergencyStopService";
import { sessionCompleteService } from "../../services/sessionCompleteService";
import { sessionRepository } from "../../services/sessionRepository";

const terminalEndedReason: Record<string, string> = {
  soft_signaled: "soft-signal",
  safety_ended: "soft-signal",
  completed: "together",
};

export default function ActiveSessionScreen() {
  return (
    <SensitiveAccessGate>
      <ActiveSessionContent />
    </SensitiveAccessGate>
  );
}

function ActiveSessionContent() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [seconds, setSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [stopState, setStopState] = useState<"idle" | "stopping" | "pending">(
    "idle",
  );
  const [completing, setCompleting] = useState(false);
  const endedRef = useRef(false);

  // Real elapsed time from the database's started_at once a real session is
  // present (migration 016); a plain local counter otherwise (demo/mock).
  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => {
      if (startedAt) {
        setSeconds(
          Math.max(
            0,
            Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
          ),
        );
      } else if (!sessionId) {
        setSeconds((value) => value + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [ended, startedAt, sessionId]);

  // Fetch the real session once, then subscribe to changes so the other
  // participant's soft signal or completion is reflected here without a
  // manual refresh.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    void sessionRepository.getSession(sessionId).then((session) => {
      if (!cancelled) setStartedAt(session.startedAt);
    });
    const unsubscribe = sessionRepository.subscribeToSession(
      sessionId,
      (session) => {
        if (session.startedAt) setStartedAt(session.startedAt);
        const reason = terminalEndedReason[session.status];
        if (reason && !endedRef.current) {
          endedRef.current = true;
          setEnded(true);
          router.replace({
            pathname: "/session/wrap-up",
            params: { ended: reason, sessionId },
          });
        }
      },
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const stop = async () => {
    endedRef.current = true;
    setEnded(true);
    setStopState("stopping");
    let pendingSync = false;
    if (sessionId) {
      const result = await emergencyStopService.stop(sessionId);
      if (result.status === "stopped_pending_sync") {
        pendingSync = true;
        setStopState("pending");
      }
    }
    router.replace({
      pathname: "/session/wrap-up",
      params: {
        ended: pendingSync ? "pending-sync" : "soft-signal",
        sessionId: sessionId ?? "",
      },
    });
  };
  const endTogether = async () => {
    endedRef.current = true;
    setEnded(true);
    setCompleting(true);
    // "pending-sync" and "not-active" are different problems: a network
    // failure is durably queued and retried on restore (ADR 0020), while a
    // session that was never actually active cannot become completed by
    // retrying — it needs the earlier steps finished first.
    let reason: "together" | "pending-sync" | "not-active" = sessionId
      ? "not-active"
      : "together";
    if (sessionId) {
      const result = await sessionCompleteService.complete(sessionId);
      if (result.status === "completed") reason = "together";
      else if (result.status === "pending_sync") reason = "pending-sync";
      else reason = "not-active";
    }
    router.replace({
      pathname: "/session/wrap-up",
      params: {
        ended: reason,
        sessionId: sessionId ?? "",
      },
    });
  };
  return (
    <Screen scroll={false} style={styles.screen}>
      <View>
        <Eyebrow>
          {sessionId ? "ACTIVE SESSION" : "SIMULATED ACTIVE SESSION"}
        </Eyebrow>
        <Title>You’re both here.</Title>
        <Body muted>
          Keep noticing yourself. Agreement can change at any moment.
        </Body>
      </View>
      <View
        accessible
        accessibilityLabel={`Session timer ${time}`}
        style={styles.timerWrap}
      >
        <Text style={styles.timer}>{time}</Text>
        <Text style={styles.timerLabel}>
          {sessionId ? "ELAPSED" : "ELAPSED · MOCK TIMER"}
        </Text>
      </View>
      <Card>
        <Text style={styles.prompt}>A gentle check-in</Text>
        <Body>Are your breath, shoulders, and attention still saying yes?</Body>
      </Card>
      <View style={styles.controls}>
        <Button
          variant="signal"
          label={
            stopState === "stopping" ? "Stopping…" : "Emergency stop — end now"
          }
          disabled={ended}
          onPress={() => void stop()}
          accessibilityHint="Immediately ends the simulated session without requiring an explanation"
        />
        <Text style={styles.explain}>
          No explanation needed. Using Soft Signal carries no penalty.
        </Text>
        <Button
          variant="secondary"
          label={completing ? "Ending…" : "End together"}
          disabled={ended}
          onPress={() => void endTogether()}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { justifyContent: "space-between" },
  timerWrap: { alignItems: "center" },
  timer: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 66,
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "800",
  },
  prompt: { color: colors.plum, fontWeight: "800", marginBottom: 7 },
  controls: { gap: 12 },
  explain: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
