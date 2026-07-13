/**
 * Consent Snapshot confirmation screen (match flow).
 *
 * WHAT: Review shared permitted boundaries; dual-confirm or withdraw before session activate.
 * WHY: Explicit, session-specific, revocable consent — match/vibe never substitutes.
 * CONSENT: Primary consent surface. Confirm arms only after Yes + grant-arm dwell.
 *          Withdraw is free, reasonless, no peer approval. Soft Signal remains free later.
 * EDGE CASES:
 *   - mock path (no sessionId) vs real session path diverge for persist only
 *   - empty shared rows → Confirm stays disabled (fail closed)
 *   - peer withdraw / terminal lifecycle → leave without activating
 * NEVER: Auto-confirm from NFC/QR share; treat nearby share as activation; skip arm dwell.
 * SEE: CONSENT_POINTS.session_engine_confirm · useConsentGrantArm · sessionRepository
 */

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
import { CONSENT_POINTS } from "../../lib/consentInteractionCore";
import { useConsentGrantArm } from "../../hooks/useConsentGrantArm";
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
import {
  buildEncryptedQr,
  buildSnapshotStartInner,
} from "../../services/qrInviteCore";

/**
 * WHAT: Route shell that wraps snapshot content in Face ID / sensitive step-up.
 * WHY: Consent Snapshot is private session material; real accounts require biometrics.
 * CONSENT: Gate does not grant session consent — only unlocks reading the screen.
 * EDGE CASES: Demo/pre-account required=false → children render without LocalAuth.
 * NEVER: Treat biometric success as dual-confirm or session activation.
 * SEE: SensitiveAccessGate · BiometricLockContext
 */
export default function ConsentSnapshotScreen() {
  return (
    <SensitiveAccessGate>
      <ConsentSnapshotContent />
    </SensitiveAccessGate>
  );
}

/**
 * WHAT: Full Consent Snapshot UI + confirm/withdraw orchestration for mock or real sessions.
 * WHY: Isolate biometric gate from lifecycle logic so denied Face ID never half-confirms.
 * CONSENT: Yes requires arm; No/withdraw cancels without penalty; share is review-only.
 * EDGE CASES: See loadRealSnapshot, confirmReal, lifecycle subscription handlers.
 * NEVER: Confirm without decision === "yes" and confirmArmed; auto-accept after QR/NFC.
 * SEE: docs/adr for session lifecycle · phone-visible vertical slice step 7
 */
function ConsentSnapshotContent() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { id, sessionId } = useLocalSearchParams<{
    id?: string;
    sessionId?: string;
  }>();
  // Empty string sessionId must not count as real — fail closed to mock practice path.
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

  /**
   * WHAT: Build display rows from mock dual-profile compatibility for demo practice.
   * WHY: Phone-visible path without backend still trains careful reading of overlap.
   * CONSENT: Mock overlap is never real consent and must not claim mutual affirmation.
   * EDGE CASES: missing id → default mock peer "maya".
   * NEVER: Persist mock rows as sealed production snapshots.
   */
  const mockRows = useMemo(() => {
    const result = computeCompatibility(
      mockConsentProfileVersion("self"),
      mockConsentProfileVersion(id ?? "maya"),
      mockSnapshotNow,
    );
    return buildSnapshotRows(result);
  }, [id]);

  // Real path: empty until loaded; never fall back to mock rows for a real sessionId.
  const rows = isReal ? (realRows ?? []) : mockRows;

  const proceededRef = useRef(false);
  const leftRef = useRef(false);
  const attentionPlayedRef = useRef(false);

  /**
   * WHAT: Activate real session once and navigate to active timer.
   * WHY: Dual-confirm (or already-ready subscription) must only activate once under races.
   * CONSENT: Callers must only invoke after mutual snapshot ready — not after single Yes.
   * EDGE CASES:
   *   - proceededRef / leftRef → idempotent no-op (subscription + confirm race)
   * NEVER: Activate after withdraw/ended; call without realSessionId.
   */
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

  /**
   * WHAT: Terminal UI state when session can no longer complete consent review.
   * WHY: Peer cancel/expire/soft-signal must stop confirm without trapping the user.
   * CONSENT: Leaving ended is not a grant; it prevents contact from starting.
   * EDGE CASES: leftRef makes leaveEnded idempotent under multi-status events.
   * NEVER: Proceed to active from ended.
   */
  const leaveEnded = (message: string) => {
    if (leftRef.current) return;
    leftRef.current = true;
    setConfirmState("ended");
    setLifecycleNote(message);
  };

  /**
   * WHAT: Map engine CompatibilityResult to SnapshotRow UI list (or empty).
   * WHY: Null compatibility must show empty shared list, not stale prior rows.
   * CONSENT: Rows are read-only presentation of intersection — not an auto-yes.
   * EDGE CASES: null → [] so Confirm stays disabled when isReal && rows.length === 0.
   * NEVER: Invent permitted zones when engine returned null.
   */
  const applyCompatibility = (compatibility: CompatibilityResult | null) => {
    if (!compatibility) {
      setRealRows([]);
      return;
    }
    setRealRows(buildSnapshotRows(compatibility));
  };

  /**
   * WHAT: Fetch or create the session’s Consent Snapshot and hydrate rows.
   * WHY: Real sessions need server fingerprint + compatibility before any confirm.
   * CONSENT: Create/get is prepare-only until both people confirm independently.
   * EDGE CASES: no latest → createSnapshot; network error → FailureState with retry.
   * NEVER: Auto-confirm after successful load.
   * SEE: sessionRepository.getLatestSessionSnapshot · createSnapshot
   */
  const loadRealSnapshot = async () => {
    if (!realSessionId) return;
    setRealLoad("loading");
    setRealLoadError("");
    try {
      let current =
        await sessionRepository.getLatestSessionSnapshot(realSessionId);
      if (!current) {
        // First arrival creates immutable snapshot from current dual profiles.
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

  /**
   * WHAT: Record this person’s confirm of the current snapshot fingerprint.
   * WHY: Dual independent confirm is required before activate (constitution).
   * CONSENT: Session-specific grant of this snapshot only; Soft Signal remains free later.
   * EDGE CASES:
   *   - result !== "ready" → waiting for peer (do not activate)
   *   - missing local snapshot → create then confirm
   * NEVER: Activate on single-side confirm; ignore fingerprint mismatch errors.
   * SEE: sessionRepository.confirmSnapshot
   */
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
      // Only mutual ready may start contact; single-side stays in waiting.
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
    /**
     * WHAT: React to session lifecycle status from initial get + realtime subscription.
     * WHY: Peer confirm, withdraw, or Soft Signal must update this device without refresh.
     * CONSENT: ready/active → proceed only if not already left; terminal → leaveEnded.
     * EDGE CASES: cancelled flag after unmount; leftRef blocks late ready races.
     * NEVER: Treat match status alone as consent without snapshot ready path.
     */
    const handleStatus = (status: string) => {
      if (cancelled || leftRef.current) return;
      if (status === "ready" || status === "active") {
        void proceedToActive();
        return;
      }
      // Terminal / non-activatable statuses: fail closed — no session begins.
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

  // Grant-arm: Confirm disabled until Yes + deliberate dwell; withdrawn/ended disarms.
  const { armed: confirmArmed, armProgress } = useConsentGrantArm({
    contentReady: rows.length > 0 || !isReal,
    requiredTogglesAllOn: decision === "yes",
    fingerprintCurrent: true,
    withdrawn: confirmState === "ended",
  });

  /**
   * WHAT: Entry point for Confirm button — real dual-confirm or mock navigate.
   * WHY: Single gate so UI cannot call activate without decision + arm checks.
   * CONSENT: Requires explicit Yes and armed state; mock never writes real consent.
   * EDGE CASES: !yes || !armed → no-op; mock skips server and opens active demo.
   * NEVER: Bypass arm for “already matched” or NFC scan success.
   */
  const confirm = () => {
    if (decision !== "yes" || !confirmArmed) return;
    if (realSessionId) {
      void confirmReal();
      return;
    }
    // Mock path: practice navigation only — not a persisted consent seal.
    void scheduleDemoNotification(4);
    router.push("/session/active");
  };

  /**
   * WHAT: Withdraw pre-activation consent or leave mock without grant.
   * WHY: Free no — constitution forbids requiring reason, dwell, or peer OK to stop.
   * CONSENT: Unilateral cancel of consent process; never a penalty.
   * EDGE CASES: mock → home replace; RPC fail → error state, stay for retry.
   * NEVER: Require explanation fields; treat withdraw as Soft Signal log requirement.
   * SEE: sessionRepository.withdrawConsent
   */
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
      <View style={styles.protectiveBanner}>
        <Text style={styles.protectiveBannerTitle}>Slow yes · free no</Text>
        <Text style={styles.protectiveBannerBody}>
          Soft Signal ends anything immediately — no explanation. A match or
          vibe is never consent. Your yes is deliberate; Confirm arms only after
          you choose Yes and a short pause. Soft Signal never waits.
        </Text>
        {!isReal ? (
          <Button
            variant="secondary"
            label="Open full Consent Snapshot prepare → seal"
            onPress={() =>
              router.push("/consent-snapshot/prepare" as never)
            }
            accessibilityHint="Boundaries, mood, safewords, aftercare, Soft Signal acknowledgment, then mutual seal"
          />
        ) : null}
      </View>
      <Body>
        {isReal
          ? "Shared permitted boundaries for this session only. A match and a Vibe Profile do not grant consent. Soft Signal stays free after you confirm."
          : "Mock preference overlap from the real consent engine. Practice reading carefully — still never real consent."}
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
      {decision === "yes" &&
      !confirmArmed &&
      confirmState !== "ended" &&
      confirmState !== "waiting" ? (
        <View
          style={styles.armTrack}
          accessible
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(armProgress * 100),
          }}
          accessibilityLabel="Arming confirm deliberately"
        >
          <View style={[styles.armFill, { width: `${armProgress * 100}%` }]} />
          <Text style={styles.armLabel}>
            Arming confirm… {Math.round(armProgress * 100)}%
          </Text>
        </View>
      ) : null}
      {decision !== "no" && confirmState !== "ended" ? (
        <Button
          label={
            confirmState === "confirming"
              ? "Confirming…"
              : confirmState === "waiting"
                ? "Check again"
                : !confirmArmed && decision === "yes"
                  ? "Arming confirm…"
                  : CONSENT_POINTS.session_engine_confirm.copy.primary
          }
          disabled={
            decision !== "yes" ||
            !confirmArmed ||
            confirmState === "confirming" ||
            confirmState === "waiting" ||
            (isReal && rows.length === 0)
          }
          onPress={confirm}
          accessibilityLabel={CONSENT_POINTS.session_engine_confirm.a11yLabel}
          accessibilityHint={CONSENT_POINTS.session_engine_confirm.a11yHint}
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
      <Button
        variant="secondary"
        label="NFC / QR snapshot review invite"
        disabled={rows.length === 0}
        onPress={() =>
          router.push({
            pathname: "/nfc/connect",
            params: {
              intent: "snapshot_initiate",
              title: isReal
                ? "Consent Snapshot review"
                : "Mock Consent Snapshot review",
              rows: JSON.stringify(rows),
            },
          } as never)
        }
        accessibilityHint="Creates an NFC or encrypted QR invite for co-located snapshot review. Receiver must Accept after scan. Never activates a session."
      />
      <Button
        variant="secondary"
        label="Encrypted QR only (snapshot start)"
        disabled={rows.length === 0}
        onPress={() => {
          const qr = buildEncryptedQr({
            kind: "snapshot_start",
            inner: buildSnapshotStartInner({
              title: isReal
                ? "Consent Snapshot review"
                : "Mock Consent Snapshot review",
              rows,
            }),
            mode: "colocated",
          });
          router.push({
            pathname: "/nfc/connect",
            params: {
              intent: "snapshot_initiate",
              title: isReal
                ? "Consent Snapshot review"
                : "Mock Consent Snapshot review",
              rows: JSON.stringify(rows),
              payload: qr.deepLink,
            },
          } as never);
        }}
        accessibilityHint="Builds a time-limited encrypted QR for snapshot review start, then opens careful-connect to show it."
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
/**
 * WHAT: Theme styles for snapshot list, decisions, arm progress, stop/waiting banners.
 * WHY: Visual hierarchy for slow-yes / free-no without color-only meaning.
 * CONSENT: Not a consent surface — presentation only.
 * EDGE CASES: none — pure style map.
 * NEVER: Encode grant vs withdraw as color alone without labels.
 */
function makeStyles(colors: AppColors) {
  return {
    protectiveBanner: {
      backgroundColor: colors.signalSoft,
      borderWidth: 1,
      borderColor: colors.signal,
      borderRadius: 16,
      padding: 16,
      gap: 8,
      marginBottom: 8,
    },
    protectiveBannerTitle: {
      color: colors.signal,
      fontWeight: "800" as const,
      fontSize: 12,
      letterSpacing: 0.5,
      textTransform: "uppercase" as const,
    },
    protectiveBannerBody: {
      color: colors.ink,
      lineHeight: 21,
      fontSize: 15,
    },
    snapshot: { gap: 0 },
    row: {
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    label: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700" as const,
      textTransform: "uppercase" as const,
      letterSpacing: 0.7,
    },
    value: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 23,
      marginTop: 4,
      fontWeight: "600" as const,
    },
    decisions: { gap: 10 },
    stop: { padding: 16, borderRadius: 16, backgroundColor: colors.signalSoft },
    stopTitle: { color: colors.signal, fontWeight: "800" as const },
    stopBody: { color: colors.ink, lineHeight: 21, marginTop: 4 },
    waiting: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.mossSoft,
    },
    waitingTitle: { color: colors.moss, fontWeight: "800" as const },
    waitingBody: { color: colors.ink, lineHeight: 21, marginTop: 4 },
    armTrack: {
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.line,
      overflow: "hidden" as const,
      justifyContent: "center" as const,
      marginBottom: 4,
    },
    armFill: {
      position: "absolute" as const,
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.mossSoft,
      borderRadius: 12,
    },
    armLabel: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700" as const,
      textAlign: "center" as const,
      zIndex: 1,
    },
    error: { color: colors.signal, textAlign: "center" as const },
  };
}
