import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { type AppColors } from "../../theme";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { useAuth } from "../../context/AuthContext";
import { emergencyStopService } from "../../services/emergencyStopService";
import { hapticService } from "../../services/hapticService";
import { sessionCompleteService } from "../../services/sessionCompleteService";
import { sessionRepository } from "../../services/sessionRepository";
import { useThemedStyles } from "../../hooks/useThemedStyles";


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
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user } = useAuth();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [seconds, setSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [peerUserId, setPeerUserId] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [stopState, setStopState] = useState<"idle" | "stopping" | "pending">(
    "idle",
  );
  const [completing, setCompleting] = useState(false);
  /** Display-only: last server sync outcome. Never invents consent offline. */
  const [syncNote, setSyncNote] = useState<string | null>(null);
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
  // manual refresh. On foreground, re-read so a missed Realtime event cannot
  // leave a terminal session looking active.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    const applySession = (session: {
      status: string;
      startedAt: string | null;
      userA?: string;
      userB?: string;
    }) => {
      if (session.startedAt) setStartedAt(session.startedAt);
      if (user?.id && session.userA && session.userB) {
        setPeerUserId(
          session.userA === user.id
            ? session.userB
            : session.userB === user.id
              ? session.userA
              : null,
        );
      }
      const reason = terminalEndedReason[session.status];
      if (reason && !endedRef.current) {
        endedRef.current = true;
        setEnded(true);
        router.replace({
          pathname: "/session/wrap-up",
          params: { ended: reason, sessionId },
        });
      }
    };

    const refresh = async () => {
      try {
        const session = await sessionRepository.getSession(sessionId);
        if (cancelled) return;
        setSyncNote(null);
        applySession(session);
      } catch {
        if (!cancelled)
          setSyncNote(
            "Connection uncertain. Soft Signal still works offline; completion will sync when the network returns.",
          );
      }
    };

    void refresh();
    const unsubscribe = sessionRepository.subscribeToSession(
      sessionId,
      (session) => {
        setSyncNote(null);
        applySession(session);
      },
    );

    const onAppState = (next: AppStateStatus) => {
      if (next === "active") void refresh();
    };
    const appSub = AppState.addEventListener("change", onAppState);

    return () => {
      cancelled = true;
      unsubscribe();
      appSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const stop = async () => {
    // Safety transition first; haptic acknowledgement never gates the stop.
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
    // Soft Signal acknowledgement only — does not represent the peer stopping.
    void hapticService.play("softSignal");
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
        {syncNote ? (
          <View style={styles.syncNote} accessible accessibilityRole="text">
            <Text style={styles.syncNoteText}>{syncNote}</Text>
          </View>
        ) : null}
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
        {sessionId && peerUserId && !ended ? (
          <>
            <Button
              variant="secondary"
              label="Report for human review"
              onPress={() =>
                router.push({
                  pathname: "/security/report",
                  params: {
                    reportedId: peerUserId,
                    sessionId,
                    displayName: "the other person",
                  },
                })
              }
              accessibilityHint="Opens a private structured report linked to this session. Does not end the session."
            />
            <Text style={styles.explain}>
              Reporting does not end the session. Soft Signal is still the
              immediate stop. Litmo is not emergency response.
            </Text>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
function makeStyles(colors: AppColors) {
  return {
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
  syncNote: {
    marginTop: 12,
    backgroundColor: colors.apricotSoft,
    borderLeftWidth: 4,
    borderLeftColor: colors.apricot,
    padding: 12,
    borderRadius: 12,
  },
  syncNoteText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
};
}

