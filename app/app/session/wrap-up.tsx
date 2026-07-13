/**
 * Session wrap-up screen — private post-session reflection after any end path.
 *
 * WHAT: Collect optional outcome + private note after a session ends (normal,
 *       Soft Signal, pending sync, or not-active). Optionally offer reporting.
 * WHY: Trauma-informed closure without public ratings, scores, or partner visibility.
 * CONSENT: Reflection never grants, renews, or certifies consent or safety of a peer.
 *          Soft Signal use is celebrated as self-trust, never framed as a penalty.
 * EDGE CASES:
 *   - demo / no sessionId → mock path; continue without persistence
 *   - submit pending_sync → still navigate; durable local record exists
 *   - peer lookup fails → report offer stays hidden (fail closed for report params)
 * NEVER: Public ratings, partner-visible notes, or “this person is safe” claims.
 * SEE: sessionWrapupService · docs/CODE_COMMENT_STANDARD.md
 */

import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, TextInput, View } from "react-native";
import {
  Body,
  Button,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { fonts, radius, type AppColors } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { sessionWrapupService } from "../../services/sessionWrapupService";
import type { WrapupOutcome } from "../../services/sessionWrapupServiceCore";
import { sessionRepository } from "../../services/sessionRepository";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

/**
 * WHAT: Radio options for private wrap-up outcome (product language, not scores).
 * WHY: Fixed catalog so backend enums stay aligned and copy cannot drift into ratings.
 * CONSENT: Choosing an outcome is reflection only — not a consent grant or peer label.
 * EDGE CASES: safety_concern / felt_uncomfortable / soft_signal_used unlock report offer.
 * NEVER: Treat outcomes as star ratings, compatibility scores, or public trust signals.
 * SEE: WrapupOutcome in sessionWrapupServiceCore
 */
const outcomeChoices: Array<{
  value: WrapupOutcome;
  label: string;
  detail: string;
}> = [
  {
    value: "completed_comfortably",
    label: "It felt good, start to finish",
    detail: "I felt respected and comfortable",
  },
  {
    value: "ended_normally",
    label: "It ended normally",
    detail: "Nothing to reward or flag",
  },
  {
    value: "soft_signal_used",
    label: "I used Soft Signal",
    detail: "I stopped it and that was the right call",
  },
  {
    value: "felt_uncomfortable",
    label: "Something felt uncomfortable",
    detail: "Keep this private and offer support",
  },
  {
    value: "safety_concern",
    label: "I have a safety concern",
    detail: "This is private evidence for human review, not a public rating",
  },
];

/**
 * WHAT: Default export route for `/session/wrap-up` after session end.
 * WHY: Single private surface for all end kinds (soft-signal, normal, pending-sync).
 * CONSENT: Post-session only. Does not re-open contact or seal a new snapshot.
 * EDGE CASES:
 *   - unauthenticated / demo → canPersist false; still allows Continue without save
 *   - soft-signal / pending-sync copy affirms stop was correct and free
 * NEVER: Block navigation on optional note; force explanation of Soft Signal.
 * SEE: Phone-visible vertical slice wrap-up step
 */
export default function SessionWrapUpScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { ended, sessionId, softSignalLogId, exitKind } = useLocalSearchParams<{
    ended?: string;
    sessionId?: string;
    softSignalLogId?: string;
    exitKind?: string;
  }>();
  const { status, user } = useAuth();
  const [outcome, setOutcome] = useState<WrapupOutcome | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [peerUserId, setPeerUserId] = useState<string | null>(null);
  // Real wrap-up persistence only for authenticated accounts with a session id.
  const canPersist = status === "authenticated" && !!sessionId;
  // Report is optional support — only when we know the peer and outcome warrants offer.
  const showReportOffer =
    canPersist &&
    !!peerUserId &&
    (outcome === "felt_uncomfortable" ||
      outcome === "safety_concern" ||
      outcome === "soft_signal_used");

  /**
   * WHAT: Resolve the other participant’s user id for optional report prefill.
   * WHY: Report flow needs reportedId; wrap-up itself never needs peer identity.
   * CONSENT: Peer id is for human-review routing only — not trust display.
   * EDGE CASES:
   *   - demo / missing session → peer null, report hidden
   *   - user not on session → peer null (fail closed)
   *   - unmount mid-fetch → cancelled flag ignores stale setState
   * NEVER: Surface peer legal identity; log private note with peer id.
   */
  useEffect(() => {
    if (!canPersist || !sessionId || !user?.id) {
      setPeerUserId(null);
      return;
    }
    let cancelled = false;
    void sessionRepository
      .getSession(sessionId)
      .then((session) => {
        if (cancelled) return;
        // Fail closed: only set peer when this user is exactly one side.
        const peer =
          session.userA === user.id
            ? session.userB
            : session.userB === user.id
              ? session.userA
              : null;
        setPeerUserId(peer);
      })
      .catch(() => {
        // Network/session errors hide report rather than invent a peer id.
        if (!cancelled) setPeerUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [canPersist, sessionId, user?.id]);

  /**
   * WHAT: Persist private wrap-up (or skip persist in mock/demo) then open trust history.
   * WHY: Durable reflection + offline-queue parity with emergency stop; never lose local save.
   * CONSENT: Submit records private reflection only — not a consent grant or peer score.
   * EDGE CASES:
   *   - empty outcome → no-op (button already disabled)
   *   - !canPersist → navigate without network write
   *   - pending_sync from service still treated as success for navigation
   * NEVER: Treat submit success as certifying the peer safe; share note with partner.
   * SEE: sessionWrapupService.submit
   */
  const save = async () => {
    if (!outcome) return;
    if (!canPersist) {
      router.push("/profile/trust-ledger");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Both "saved" and "pending_sync" mean this device has durably
      // recorded the reflection -- pending_sync just means the network
      // call failed and will retry on next app restart (mirrors
      // emergencyStopService's offline-queue pattern), not that anything
      // was lost.
      await sessionWrapupService.submit(sessionId!, outcome, note || null);
      router.push("/profile/trust-ledger");
    } catch (caught) {
      // Stay on screen with recoverable error — do not discard typed note.
      setError(
        caught instanceof Error
          ? caught.message
          : "Your reflection could not be saved. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  /**
   * WHAT: Navigate to structured security report with session + peer prefilled.
   * WHY: Separate report from reflection so soft concerns can escalate without conflating.
   * CONSENT: Report is optional human review — never required after Soft Signal.
   * EDGE CASES: Missing peer or sessionId → no-op (fail closed; no partial report).
   * NEVER: Auto-submit report from wrap-up outcome alone; name-report the peer publicly.
   */
  const openReport = () => {
    if (!peerUserId || !sessionId) return;
    router.push({
      pathname: "/security/report",
      params: {
        reportedId: peerUserId,
        sessionId,
        // Generic label — never invent real-name identity from wrap-up.
        displayName: "the other person",
      },
    });
  };

  return (
    <Screen>
      <Eyebrow>
        {canPersist ? "PRIVATE WRAP-UP" : "PRIVATE MOCK WRAP-UP"}
      </Eyebrow>
      <Title>
        {ended === "soft-signal" || ended === "pending-sync"
          ? "You stopped safely."
          : "The session has ended."}
      </Title>
      <Body>
        {ended === "soft-signal"
          ? "Soft Signal ended the session immediately. That was the right call if you needed it. You do not need to explain why. Soft Signal is never a penalty."
          : ended === "pending-sync"
            ? "Stopped on this device. Litmo will sync the private stop when the network returns. The session cannot resume here."
            : ended === "not-active"
              ? "This session hadn't fully started yet, so it can't be marked complete. Nothing was recorded as ended — you can return and pick up where you left off."
              : "You ended the session together."}
      </Body>
      {ended === "soft-signal" || ended === "pending-sync" ? (
        <Button
          variant="secondary"
          label="Open private Soft Signal log"
          onPress={() => router.push("/soft-signal/log" as never)}
          accessibilityHint="View personal Soft Signal records on this device. Optional notes only — never required when you stop."
        />
      ) : null}
      <Button
        variant="secondary"
        label="Optional reflection tools (skip anytime)"
        onPress={() =>
          router.push({
            pathname: "/safety/reflection",
            params: {
              sessionId: sessionId ?? "",
              softSignalLogId: softSignalLogId ?? "",
              exitKind: exitKind ?? ended ?? "unknown",
            },
          } as never)
        }
        accessibilityHint="Private, trauma-informed prompts. Every step is skippable. Not therapy."
      />
      <Body muted>
        Reflection is optional. Stopping mid-way is self-trust. Nothing here is
        shared with a partner or used as a score.
      </Body>
      <View style={styles.question}>
        <Text style={styles.questionText} accessibilityRole="header">
          How did this interaction feel for you?
        </Text>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {outcomeChoices.map((choice) => (
            <Choice
              key={choice.value}
              label={choice.label}
              detail={choice.detail}
              selected={outcome === choice.value}
              onPress={() => setOutcome(choice.value)}
            />
          ))}
        </View>
      </View>
      {outcome === "felt_uncomfortable" || outcome === "safety_concern" ? (
        <View style={styles.support}>
          <Text style={styles.supportTitle}>Your comfort matters.</Text>
          <Text style={styles.supportBody}>
            {canPersist
              ? "Your wrap-up stays private. If you want human review, you can also submit a structured report — they will not be told who reported them."
              : "A production system would privately offer reporting and support options for human review. This prototype stores nothing."}
          </Text>
        </View>
      ) : null}
      {showReportOffer ? (
        <>
          <Button
            variant="secondary"
            label="Report this session for human review"
            onPress={openReport}
            accessibilityHint="Opens a private structured report linked to this session. Optional and separate from your wrap-up."
          />
          <Body muted>
            Reporting is optional and separate from this private reflection.
            Litmo is not emergency response — if you are in immediate danger,
            contact local emergency services.
          </Body>
        </>
      ) : null}
      <View style={styles.noteBlock}>
        <Text style={styles.noteLabel}>
          Anything you want to privately note? (optional)
        </Text>
        <TextInput
          accessibilityLabel="Private note"
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="Only you can read this."
          placeholderTextColor={colors.muted}
          style={styles.noteInput}
        />
      </View>
      <Body muted>
        Your response is private. It does not create a public rating or certify
        another person as safe.
      </Body>
      {!canPersist ? (
        <Body muted>
          {status === "demo"
            ? "Demo mode does not persist a wrap-up. Sign in for a real session to keep a private record."
            : "This mock session has no real session to attach a wrap-up to yet."}
        </Body>
      ) : null}
      <Button
        label={
          busy
            ? "Saving privately…"
            : canPersist
              ? "Save my private reflection"
              : "Continue"
        }
        disabled={!outcome || busy}
        onPress={() => void save()}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}
/**
 * WHAT: Theme-driven styles for wrap-up layout (question, support, note, error).
 * WHY: useThemedStyles factory keeps cream/ink tokens consistent with rest of app.
 * CONSENT: Not a consent surface — presentation only.
 * EDGE CASES: none — pure style object from AppColors.
 * NEVER: Encode product meaning (safe/unsafe) via color alone without text.
 */
function makeStyles(colors: AppColors) {
  return {
    question: { gap: 14, marginTop: 18 },
    questionText: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 28,
      lineHeight: 34,
    },
    options: { gap: 10 },
    support: {
      backgroundColor: colors.signalSoft,
      padding: 18,
      borderRadius: 18,
    },
    supportTitle: { color: colors.signal, fontWeight: "800", fontSize: 16 },
    supportBody: { color: colors.ink, lineHeight: 21, marginTop: 5 },
    noteBlock: { gap: 8 },
    noteLabel: { color: colors.muted, fontSize: 13, fontWeight: "700" },
    noteInput: {
      minHeight: 90,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      color: colors.ink,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      textAlignVertical: "top",
    },
    error: { color: colors.signal, textAlign: "center" },
  };
}
