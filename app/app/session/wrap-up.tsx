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

export default function SessionWrapUpScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { ended, sessionId } = useLocalSearchParams<{
    ended?: string;
    sessionId?: string;
  }>();
  const { status, user } = useAuth();
  const [outcome, setOutcome] = useState<WrapupOutcome | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [peerUserId, setPeerUserId] = useState<string | null>(null);
  const canPersist = status === "authenticated" && !!sessionId;
  const showReportOffer =
    canPersist &&
    !!peerUserId &&
    (outcome === "felt_uncomfortable" ||
      outcome === "safety_concern" ||
      outcome === "soft_signal_used");

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
        const peer =
          session.userA === user.id
            ? session.userB
            : session.userB === user.id
              ? session.userA
              : null;
        setPeerUserId(peer);
      })
      .catch(() => {
        if (!cancelled) setPeerUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [canPersist, sessionId, user?.id]);

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
      setError(
        caught instanceof Error
          ? caught.message
          : "Your reflection could not be saved. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const openReport = () => {
    if (!peerUserId || !sessionId) return;
    router.push({
      pathname: "/security/report",
      params: {
        reportedId: peerUserId,
        sessionId,
        displayName: "the other person",
      },
    });
  };

  return (
    <Screen>
      <Eyebrow>
        {canPersist ? "PRIVATE WRAP-UP" : "PRIVATE MOCK WRAP-UP"}
      </Eyebrow>
      <Title>The session has ended.</Title>
      <Body>
        {ended === "soft-signal"
          ? "Soft Signal ended the session immediately. You do not need to explain why."
          : ended === "pending-sync"
            ? "The session stopped on this device. Litmo will keep retrying the private stop request when a connection returns. It cannot resume here."
            : ended === "not-active"
              ? "This session hadn't fully started yet, so it can't be marked complete. Nothing was recorded as ended — you can return and pick up where you left off."
              : "You ended the session together."}
      </Body>
      <View style={styles.question}>
        <Text style={styles.questionText}>
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

