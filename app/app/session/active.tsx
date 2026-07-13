import { useEffect, useRef, useState } from "react";
import {
  AppState,
  type AppStateStatus,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { SoftSignalButton } from "../../components/SoftSignalButton";
import { useAuth } from "../../context/AuthContext";
import { blockService } from "../../services/blockService";
import { sessionCompleteService } from "../../services/sessionCompleteService";
import { sessionRepository } from "../../services/sessionRepository";
import { softSignalService } from "../../services/softSignalService";
import { traumaSafetyService } from "../../services/traumaSafetyService";
import type { TraumaSafetyPrefs } from "../../lib/traumaSafetyCore";
import { defaultTraumaSafetyPrefs } from "../../lib/traumaSafetyCore";
import { SOFT_SIGNAL_COPY } from "../../lib/softSignalCore";
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
  const [blockState, setBlockState] = useState<"idle" | "blocking" | "error">(
    "idle",
  );
  const [blockError, setBlockError] = useState("");
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [safetyPrefs, setSafetyPrefs] = useState<TraumaSafetyPrefs>(
    defaultTraumaSafetyPrefs(),
  );
  const [timeoutBanner, setTimeoutBanner] = useState<string | null>(null);
  const [timeoutDuePrompt, setTimeoutDuePrompt] = useState(false);
  const endedRef = useRef(false);
  const timeoutFiredRef = useRef(false);

  useEffect(() => {
    void traumaSafetyService.loadPrefs().then(async (prefs) => {
      // Dual-agreed time from sealed local mutual snapshot (strictest of both).
      try {
        const {
          sessionConsentSnapshotStore,
        } = await import("../../services/sessionConsentSnapshotStore");
        const mutual = await sessionConsentSnapshotStore.loadMutual();
        const mins = mutual?.intersection?.maxDurationMinutes;
        if (
          mutual &&
          !mutual.withdrawnAt &&
          typeof mins === "number" &&
          mins >= 5
        ) {
          setSafetyPrefs({
            ...prefs,
            timeout: {
              ...prefs.timeout,
              enabled: true,
              maxMinutes: mins,
              warnBeforeMinutes: Math.min(
                prefs.timeout.warnBeforeMinutes,
                Math.max(1, Math.floor(mins / 6)),
              ),
            },
          });
          return;
        }
      } catch {
        // ignore — local prefs still apply
      }
      setSafetyPrefs(prefs);
    });
  }, []);

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

  // Session timeout: warning + auto Soft Signal or prompt.
  useEffect(() => {
    if (ended || endedRef.current) return;
    const phase = traumaSafetyService.timeoutPhase(safetyPrefs, seconds);
    if (phase.phase === "warning" && phase.message) {
      setTimeoutBanner(phase.message);
      setTimeoutDuePrompt(false);
    } else if (phase.phase === "due") {
      setTimeoutBanner(phase.message);
      if (safetyPrefs.timeout.autoSoftSignalAtTimeout) {
        if (!timeoutFiredRef.current) {
          timeoutFiredRef.current = true;
          void (async () => {
            const result = await traumaSafetyService.timeoutExit(
              sessionId,
              true,
            );
            endedRef.current = true;
            setEnded(true);
            router.replace({
              pathname: "/session/wrap-up",
              params: {
                ended:
                  result.softSignal.outcome === "pending_sync"
                    ? "pending-sync"
                    : "soft-signal",
                sessionId: sessionId ?? "",
                softSignalLogId: result.softSignal.logEntry.id,
                exitKind: result.exitKind,
              },
            });
          })();
        }
      } else {
        setTimeoutDuePrompt(true);
      }
    } else {
      setTimeoutBanner(null);
      setTimeoutDuePrompt(false);
    }
  }, [seconds, safetyPrefs, ended, sessionId, router]);

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

  const goAfterExit = (result: {
    exitKind: string;
    softSignal: {
      outcome: string;
      logEntry: { id: string };
    };
    navigateTo: "wrap-up" | "panic-cover" | "home";
  }) => {
    const endedParam =
      result.softSignal.outcome === "pending_sync"
        ? "pending-sync"
        : "soft-signal";
    if (result.navigateTo === "panic-cover") {
      router.replace({
        pathname: "/safety/panic-cover",
        params: {
          sessionId: sessionId ?? "",
          softSignalLogId: result.softSignal.logEntry.id,
        },
      } as never);
      return;
    }
    router.replace({
      pathname: "/session/wrap-up",
      params: {
        ended: endedParam,
        sessionId: sessionId ?? "",
        softSignalLogId: result.softSignal.logEntry.id,
        exitKind: result.exitKind,
      },
    } as never);
  };

  const stop = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
    setStopState("stopping");
    const result = await softSignalService.fire({
      source: "active_session",
      sessionId: sessionId ?? null,
      surface: "mobile_app",
      practiceOnly: !sessionId,
    });
    if (result.outcome === "pending_sync") setStopState("pending");
    goAfterExit({
      exitKind: "soft_signal",
      softSignal: result,
      navigateTo: "wrap-up",
    });
  };

  const quickExit = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
    setStopState("stopping");
    const result = await traumaSafetyService.quickExit(sessionId);
    goAfterExit(result);
  };

  const panicExit = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
    setStopState("stopping");
    const result = await traumaSafetyService.panicExit(sessionId);
    goAfterExit(result);
  };

  const timeoutSoftSignal = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
    setStopState("stopping");
    const result = await traumaSafetyService.timeoutExit(sessionId, false);
    goAfterExit(result);
  };

  const blockPeer = async () => {
    if (!peerUserId || endedRef.current) return;
    setBlockState("blocking");
    setBlockError("");
    try {
      await blockService.blockUser(peerUserId);
      endedRef.current = true;
      setEnded(true);
      router.replace({
        pathname: "/session/wrap-up",
        params: {
          ended: "soft-signal",
          sessionId: sessionId ?? "",
          exitKind: "soft_signal",
        },
      });
    } catch (caught) {
      setBlockState("error");
      setBlockError(
        caught instanceof Error
          ? caught.message
          : "That account could not be blocked right now.",
      );
    }
  };

  const endTogether = async () => {
    endedRef.current = true;
    setEnded(true);
    setCompleting(true);
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
        exitKind: "together",
      },
    });
  };

  const softSignalState =
    ended
      ? "stopped"
      : stopState === "stopping" || stopState === "pending"
        ? "stopping"
        : "idle";

  return (
    <Screen scroll={false} style={styles.screen}>
      {/* Scrollable context; Soft Signal stays sticky below for impossible-to-miss exit. */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Eyebrow>
            {sessionId ? "ACTIVE SESSION" : "SIMULATED ACTIVE SESSION"}
          </Eyebrow>
          <Title>You’re both here.</Title>
          <Body muted>
            Keep noticing yourself. Agreement can change at any moment. Soft
            Signal stays pinned below — never needs a reason.
          </Body>
          {syncNote ? (
            <View style={styles.syncNote} accessible accessibilityRole="text">
              <Text style={styles.syncNoteText}>{syncNote}</Text>
            </View>
          ) : null}
          {timeoutBanner ? (
            <View
              style={styles.timeoutNote}
              accessible
              accessibilityRole="alert"
            >
              <Text style={styles.timeoutNoteText}>{timeoutBanner}</Text>
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
            {safetyPrefs.timeout.enabled
              ? ` · BOUNDARY ${safetyPrefs.timeout.maxMinutes}M`
              : ""}
          </Text>
        </View>
        <Card>
          <Text style={styles.prompt}>A gentle check-in</Text>
          <Body>
            Are your breath, shoulders, and attention still saying yes?
          </Body>
        </Card>
        {timeoutDuePrompt && !ended ? (
          <Card>
            <Text style={styles.prompt}>Time boundary</Text>
            <Body muted>
              The time you set is complete. Soft Signal (pinned below) ends
              immediately. Extending needs a free yes from you — never pressure.
            </Body>
            <Button
              variant="secondary"
              label="Continue a little longer (I still want to)"
              onPress={() => {
                setTimeoutDuePrompt(false);
                setTimeoutBanner(
                  "Continuing with awareness. Soft Signal is still available.",
                );
                void traumaSafetyService
                  .loadPrefs()
                  .then((p) =>
                    traumaSafetyService.savePrefs({
                      ...p,
                      timeout: {
                        ...p.timeout,
                        maxMinutes: p.timeout.maxMinutes + 15,
                      },
                    }),
                  )
                  .then(setSafetyPrefs);
              }}
            />
          </Card>
        ) : null}
        <View style={styles.secondaryControls}>
          <Button
            variant="secondary"
            label="Quick exit"
            disabled={ended}
            onPress={() => void quickExit()}
            accessibilityHint="Ends the session immediately and opens private wrap-up. No explanation needed."
          />
          <Button
            variant="secondary"
            label="Panic mode — stop & cover"
            disabled={ended}
            onPress={() => void panicExit()}
            accessibilityHint="Ends the session immediately and shows a calm cover screen. Not emergency services."
          />
          <Button
            variant="secondary"
            label={completing ? "Ending…" : "End together"}
            disabled={ended}
            onPress={() => void endTogether()}
            accessibilityHint="Ends the session as completed when both people are ready. Soft Signal is still available if you need to stop immediately."
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
                Reporting does not end the session. Soft Signal (below) is still
                the immediate stop. Litmo is not emergency response.
              </Text>
              <Button
                variant="secondary"
                label={
                  blockState === "blocking"
                    ? "Blocking…"
                    : "Block this person and leave"
                }
                disabled={blockState === "blocking"}
                onPress={() => void blockPeer()}
                accessibilityHint="Privately blocks them and ends this session. They are not told who blocked them."
              />
              <Text style={styles.explain}>
                Blocking ends open sessions with them and hides you from each
                other. They are not told it was you.
              </Text>
              {blockState === "error" ? (
                <Text accessibilityRole="alert" style={styles.explain}>
                  {blockError}
                </Text>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={styles.stickyExit}
        accessibilityRole="summary"
        accessibilityLabel="Soft Signal. Ends the session immediately. Always available."
      >
        <Text style={styles.stickyLabel}>{SOFT_SIGNAL_COPY.stickyLabel}</Text>
        <SoftSignalButton
          prominent
          sticky
          state={softSignalState}
          disabled={ended}
          onPress={() =>
            void (timeoutDuePrompt ? timeoutSoftSignal() : stop())
          }
        />
      </View>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    screen: { flex: 1, justifyContent: "flex-start", paddingBottom: 0 },
    scroll: { flex: 1 },
    scrollContent: { gap: 16, paddingBottom: 16 },
    stickyExit: {
      borderTopWidth: 2,
      borderTopColor: colors.signal,
      backgroundColor: colors.cream,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 8,
    },
    stickyLabel: {
      color: colors.signal,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.1,
      textAlign: "center",
    },
    secondaryControls: { gap: 12, width: "100%" },
    timerWrap: { alignItems: "center", paddingHorizontal: 8 },
    timer: {
      color: colors.ink,
      fontFamily: "Georgia",
      fontSize: 66,
      fontVariant: ["tabular-nums"],
      maxFontSizeMultiplier: 1.35,
    },
    timerLabel: {
      color: colors.muted,
      fontSize: 11,
      letterSpacing: 1.5,
      fontWeight: "800",
    },
    prompt: { color: colors.plum, fontWeight: "800", marginBottom: 7 },
    explain: {
      color: colors.muted,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 20,
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
    timeoutNote: {
      marginTop: 12,
      backgroundColor: colors.mossSoft,
      borderLeftWidth: 4,
      borderLeftColor: colors.moss,
      padding: 12,
      borderRadius: 12,
    },
    timeoutNoteText: {
      color: colors.moss,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
    },
  };
}
