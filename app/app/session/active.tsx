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

/**
 * Maps terminal session repository statuses → wrap-up `ended` query params.
 * soft_signaled / safety_ended share soft-signal wrap-up framing (withdraw path).
 * completed → together. Unknown statuses do not force navigation.
 */
const terminalEndedReason: Record<string, string> = {
  soft_signaled: "soft-signal",
  safety_ended: "soft-signal",
  completed: "together",
};

/**
 * WHAT: Route shell for active session — wraps content in SensitiveAccessGate.
 * WHY: Real account sensitive surface may require fresh device-owner check;
 *   Soft Signal and session state must not be reachable without that gate when required.
 * CONSENT: Gate is device ownership / privacy cover — NEVER touch consent or dual-seal.
 * EDGE CASES: Demo may pass gate rules differently; content still renders Soft Signal.
 * NEVER: Treat gate unlock as session yes; skip Soft Signal because lock succeeded.
 * SEE: SensitiveAccessGate · docs ONBOARDING vs session (Soft Signal only post-onboarding)
 */
export default function ActiveSessionScreen() {
  return (
    <SensitiveAccessGate>
      <ActiveSessionContent />
    </SensitiveAccessGate>
  );
}

/**
 * WHAT: Live / simulated active session UI — timer, timeout prefs, sticky Soft Signal,
 *   quick/panic exit, end together, optional report/block.
 * WHY: Session-time withdraw must stay faster and more available than any continue path;
 *   sticky Soft Signal is constitution I.4 (stop always reachable).
 * CONSENT: Soft Signal / quick / panic / timeout exit are WITHDRAW paths (no reason,
 *   no peer required, local end authoritative). “End together” is mutual complete — not
 *   Soft Signal. Report does not end session. Extend-time is free yes only after timeout due.
 * EDGE CASES:
 *   - No sessionId → simulated timer + practice-capable Soft Signal (practiceOnly when fire).
 *   - Network loss → syncNote; Soft Signal still works offline.
 *   - Terminal remote status → wrap-up once (endedRef).
 *   - Timeout auto Soft Signal vs prompt extend (+15 min prefs).
 *   - Double-fire guarded by endedRef before async I/O.
 * NEVER: Require reason at stop; hide Soft Signal under scroll only; claim emergency services;
 *   invent consent from timer still running; block without peerUserId.
 * SEE: softSignalService · traumaSafetyService · SOFT_SIGNAL_COPY · softSignalCore
 *   · docs/CONSENT_MICROINTERACTIONS.md (session grammar, not onboard_*)
 */
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
  // Synchronous guards: React state alone can double-fire Soft Signal under rapid taps.
  const endedRef = useRef(false);
  const timeoutFiredRef = useRef(false);

  useEffect(() => {
    void traumaSafetyService.loadPrefs().then(async (prefs) => {
      // Dual-agreed time from sealed local mutual snapshot (strictest of both).
      // Prefer intersection maxDurationMinutes when mutual present and not withdrawn.
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
              // Warn window scales with agreed max; floor 1 minute.
              warnBeforeMinutes: Math.min(
                prefs.timeout.warnBeforeMinutes,
                Math.max(1, Math.floor(mins / 6)),
              ),
            },
          });
          return;
        }
      } catch {
        // ignore — local prefs still apply (fail open for comfort prefs, not for consent)
      }
      setSafetyPrefs(prefs);
    });
  }, []);

  useEffect(() => {
    // Stop ticking once ended so wrap-up does not keep advancing display.
    if (ended) return;
    const timer = setInterval(() => {
      if (startedAt) {
        // Real session: elapsed from server/local startedAt.
        setSeconds(
          Math.max(
            0,
            Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
          ),
        );
      } else if (!sessionId) {
        // Simulated path: simple increment mock timer.
        setSeconds((value) => value + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [ended, startedAt, sessionId]);

  // Session timeout: warning + auto Soft Signal or prompt.
  // Timeout Soft Signal is still withdraw — no reason, local end first in service layer.
  useEffect(() => {
    if (ended || endedRef.current) return;
    const phase = traumaSafetyService.timeoutPhase(safetyPrefs, seconds);
    if (phase.phase === "warning" && phase.message) {
      setTimeoutBanner(phase.message);
      setTimeoutDuePrompt(false);
    } else if (phase.phase === "due") {
      setTimeoutBanner(phase.message);
      if (safetyPrefs.timeout.autoSoftSignalAtTimeout) {
        // Fire once only — auto path must not loop Soft Signal.
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
        // Prompt path: Soft Signal still sticky below; extend is optional free yes.
        setTimeoutDuePrompt(true);
      }
    } else {
      setTimeoutBanner(null);
      setTimeoutDuePrompt(false);
    }
  }, [seconds, safetyPrefs, ended, sessionId, router]);

  useEffect(() => {
    // Real sessionId: hydrate startedAt / peer / terminal status + subscribe.
    if (!sessionId) return;
    let cancelled = false;

    /**
     * WHAT: Applies remote session row to local timer/peer/terminal navigation.
     * WHY: Peer Soft Signal or complete must end UI even if local button unused.
     * CONSENT: Terminal soft_signaled is withdraw path; completed is together — not new grant.
     * EDGE CASES: endedRef prevents double wrap-up navigation.
     * NEVER: Treat active status as ongoing body permission without sealed snapshot elsewhere.
     * SEE: sessionRepository · terminalEndedReason
     */
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
        // Fail open for Soft Signal: network uncertainty must not disable stop.
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

    // Foreground return: re-pull status in case Soft Signal landed while backgrounded.
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

  /**
   * WHAT: Routes after any Soft Signal-family exit (wrap-up or panic cover).
   * WHY: Centralize pending_sync vs soft-signal ended param + panic branch.
   * CONSENT: Post-withdraw navigation only — session already locally ended by services.
   * EDGE CASES: navigateTo panic-cover → cover screen; else wrap-up with log id.
   * NEVER: Require reason text; block navigation on network (local end already done).
   * SEE: traumaSafetyService exit results · softSignalService.fire outcomes
   */
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

  /**
   * WHAT: Primary Soft Signal fire from sticky button (active_session source).
   * WHY: Immediate withdraw; practiceOnly when no sessionId (simulated).
   * CONSENT: WITHDRAW — no arm, no reason, no peer. Local end authoritative.
   * EDGE CASES: endedRef short-circuit; pending_sync still navigates wrap-up.
   * NEVER: Ask why; wait for network before local end (service order); re-enable grant.
   * SEE: softSignalService.fire · SoftSignalButton · constitution I.4
   */
  const stop = async () => {
    if (endedRef.current) return;
    // Optimistic local end before await — stop must not lose a race to double-tap continue.
    endedRef.current = true;
    setEnded(true);
    setStopState("stopping");
    const result = await softSignalService.fire({
      source: "active_session",
      sessionId: sessionId ?? null,
      surface: "mobile_app",
      // No real session → practice-shaped fire (no peer notify).
      practiceOnly: !sessionId,
    });
    if (result.outcome === "pending_sync") setStopState("pending");
    goAfterExit({
      exitKind: "soft_signal",
      softSignal: result,
      navigateTo: "wrap-up",
    });
  };

  /**
   * WHAT: Quick exit via trauma safety stack (Soft Signal family, wrap-up).
   * WHY: Alternate labeled path for users who want “leave now” without panic cover.
   * CONSENT: WITHDRAW — same philosophy as Soft Signal; no reason.
   * EDGE CASES: endedRef guard; result.navigateTo may still be wrap-up.
   * NEVER: Route to emergency services; require explanation.
   * SEE: traumaSafetyService.quickExit
   */
  const quickExit = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
    setStopState("stopping");
    const result = await traumaSafetyService.quickExit(sessionId);
    goAfterExit(result);
  };

  /**
   * WHAT: Panic mode — Soft Signal + calm cover screen (not emergency services).
   * WHY: Discretionary cover after immediate stop for safety / social exit needs.
   * CONSENT: WITHDRAW then cover — cover is not a grant delay.
   * EDGE CASES: endedRef; goAfterExit may choose panic-cover.
   * NEVER: Claim 911/emergency response; require reason; delay stop for cover animation.
   * SEE: traumaSafetyService.panicExit · /safety/panic-cover
   */
  const panicExit = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
    setStopState("stopping");
    const result = await traumaSafetyService.panicExit(sessionId);
    goAfterExit(result);
  };

  /**
   * WHAT: Soft Signal when timeout is due and user uses sticky button (non-auto path).
   * WHY: Sticky Soft Signal remains primary stop even while “continue a little longer” exists.
   * CONSENT: WITHDRAW — timeout soft signal, not a penalty.
   * EDGE CASES: autoSoftSignal path uses separate timeoutExit(true); this is false (manual).
   * NEVER: Force extend; punish for stopping at boundary.
   * SEE: traumaSafetyService.timeoutExit · timeoutDuePrompt UI
   */
  const timeoutSoftSignal = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnded(true);
    setStopState("stopping");
    const result = await traumaSafetyService.timeoutExit(sessionId, false);
    goAfterExit(result);
  };

  /**
   * WHAT: Blocks peer and ends local session navigation to wrap-up.
   * WHY: Safety/privacy leave path distinct from Soft Signal but still immediate exit.
   * CONSENT: Block + leave is not dual-seal; does not require Soft Signal first.
   * EDGE CASES: !peerUserId or already ended → no-op; network error keeps UI with message.
   * NEVER: Tell peer who blocked; claim block is Soft Signal log semantics unless wired.
   * SEE: blockService.blockUser
   */
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

  /**
   * WHAT: Mutual “end together” complete path (not Soft Signal withdraw).
   * WHY: Allow graceful complete when both ready; Soft Signal remains available until then.
   * CONSENT: Complete is not withdraw and not a new grant — session ends as completed/pending.
   * EDGE CASES: No sessionId → treat as together (simulated). Service pending_sync / not-active.
   * NEVER: Disable Soft Signal while completing; require Soft Signal reason after together.
   * SEE: sessionCompleteService.complete
   */
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

  // Map UI SoftSignalButton states from local end + stopState (never “half active” after stop).
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
            {/* Extend is optional free yes — Soft Signal still available and sticky. */}
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
                        // +15 minutes — comfort extension, not auto consent for more touch.
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
              {/* Report does NOT end session — Soft Signal remains the immediate stop. */}
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

      {/* Sticky Soft Signal: always visible; never buried under scroll content only. */}
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
            // When timeout due, sticky stop uses timeout Soft Signal path; else standard fire.
            void (timeoutDuePrompt ? timeoutSoftSignal() : stop())
          }
        />
      </View>
    </Screen>
  );
}

/**
 * WHAT: Theme styles for active session timer, sticky Soft Signal chrome, notes.
 * WHY: Sticky exit uses signal border — withdraw visual weight; not grant moss.
 * CONSENT: Sticky layout is withdraw ergonomics — never a grant control style.
 * EDGE CASES: none — pure style factory.
 * NEVER: Style Soft Signal like a secondary muted link; hide sticky under padding tricks.
 * SEE: SOFT_SIGNAL_COPY · SoftSignalButton
 */
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
