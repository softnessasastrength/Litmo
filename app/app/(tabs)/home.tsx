import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { personaIdForUserId } from "../../data/mockConsentProfiles";
import { quizCatalog } from "../../data/quizCatalog";
import { notifyPrivateUpdate } from "../../services/notifications";
import { sessionRepository } from "../../services/sessionRepository";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

type OpenSession = {
  id: string;
  counterpartId: string;
  status: string;
  startedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
};

function resumeLabel(status: string): string {
  if (status === "active") return "Return to active session";
  if (status === "ready") return "Start session — both confirmed";
  if (status === "consent_pending") return "Continue consent review";
  if (status === "accepted") return "Begin consent review";
  return "Open session";
}

export default function HomeTabScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { status, user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const refreshActivity = useCallback(async () => {
    if (!user) return;
    try {
      const [requests, open] = await Promise.all([
        sessionRepository.listIncomingRequests(),
        sessionRepository.listOpenSessions(),
      ]);
      setPendingCount(requests.length);
      setOpenSessions(open);
    } catch {
      setPendingCount(0);
      setOpenSessions([]);
    }
  }, [user]);

  useEffect(() => {
    if (status !== "authenticated" || !user) {
      setPendingCount(0);
      setOpenSessions([]);
      return;
    }
    void refreshActivity();
    const unsubIncoming = sessionRepository.subscribeToIncomingRequests(
      user.id,
      (event) => {
        void refreshActivity();
        if (event === "INSERT") void notifyPrivateUpdate();
      },
    );
    const unsubOpen = sessionRepository.subscribeToParticipantSessions(
      user.id,
      () => void refreshActivity(),
    );
    return () => {
      unsubIncoming();
      unsubOpen();
    };
  }, [status, user, refreshActivity]);

  const resume = async (session: OpenSession) => {
    setResumingId(session.id);
    try {
      if (session.status === "active") {
        router.push({
          pathname: "/session/active",
          params: { sessionId: session.id },
        });
        return;
      }
      // Both confirmed: activate (idempotent if already active) and resume timer.
      if (session.status === "ready") {
        try {
          await sessionRepository.activateSession(session.id);
        } catch {
          // If activation races, still open active — getSession will reflect truth.
        }
        router.push({
          pathname: "/session/active",
          params: { sessionId: session.id },
        });
        return;
      }
      // accepted → advance into consent_pending when possible (idempotent).
      if (session.status === "accepted") {
        try {
          await sessionRepository.beginConsentReview(session.id);
        } catch {
          // Still open the snapshot; user can retry the transition later.
        }
      }
      router.push({
        pathname: "/match/consent-snapshot",
        params: {
          id: personaIdForUserId(session.counterpartId),
          sessionId: session.id,
        },
      });
    } finally {
      setResumingId(null);
    }
  };

  return (
    <Screen>
      <Eyebrow>{status === "demo" ? "DEMO MODE" : "HOME"}</Eyebrow>
      <Title>Good to see you.</Title>
      <Body muted>
        A quiet landing spot. Discovery, Quizzes, and trust history live in
        their own tabs. Open sessions can be resumed here after a restart.
      </Body>

      {status === "authenticated" && openSessions.length > 0
        ? openSessions.map((session) => (
            <Card key={session.id}>
              <Text style={styles.cardTitle}>
                {session.status === "active"
                  ? "Session in progress"
                  : "Consent still open"}
              </Text>
              <Body muted>
                Status: {session.status.replaceAll("_", " ")}. Resuming never
                grants new consent — it only returns you to the current step.
              </Body>
              {session.expiresAt ? (
                <Body muted>
                  Review expires{" "}
                  {new Date(session.expiresAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Body>
              ) : null}
              <View style={styles.cardAction}>
                <Button
                  label={
                    resumingId === session.id
                      ? "Opening…"
                      : resumeLabel(session.status)
                  }
                  disabled={resumingId === session.id}
                  onPress={() => void resume(session)}
                  accessibilityHint="Returns to the current consent or active session step without inventing new consent"
                />
              </View>
            </Card>
          ))
        : null}

      <Card>
        <Text style={styles.cardTitle}>
          {status === "authenticated" && pendingCount > 0
            ? pendingCount === 1
              ? "1 session request waiting"
              : `${pendingCount} session requests waiting`
            : openSessions.length === 0
              ? "Nothing active right now"
              : "Session requests"}
        </Text>
        <Body muted>
          {status === "authenticated" && pendingCount > 0
            ? "Accepting only begins consent review. It never grants consent by itself."
            : "When you request or confirm a session, its status will show up here."}
        </Body>
        {status === "authenticated" && pendingCount > 0 ? (
          <View style={styles.cardAction}>
            <Button
              label="Review session requests"
              onPress={() => router.push("/requests")}
              accessibilityHint="Opens the list of people who have requested a session with you"
            />
          </View>
        ) : null}
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Quizzes — all on device</Text>
        <Body muted>
          {quizCatalog.filter((q) => q.family === "vibe").length} Vibe depths
          (Short ~10 · Deep 100) and{" "}
          {quizCatalog.filter((q) => q.family === "self").length} self quizzes
          (Soft Capacity, Boundary Voice, Comfort & Care, Connection Pace).
          Results stay private — never consent to touch.
        </Body>
        <View style={styles.cardAction}>
          <Button
            label="Open Quizzes hub"
            onPress={() => router.push("/(tabs)/quizzes" as never)}
            accessibilityHint="Lists every quiz: short and deep Vibe plus self-understanding"
          />
        </View>
        <View style={styles.cardAction}>
          <Button
            variant="secondary"
            label="Start Short Vibe (~10 scenes)"
            onPress={() =>
              router.push({
                pathname: "/quizzes/play",
                params: { quizId: "vibe-short" },
              } as never)
            }
            accessibilityHint="Starts the calm short Vibe Quiz immediately"
          />
        </View>
        <View style={styles.cardAction}>
          <Button
            variant="secondary"
            label="Start Deep Vibe (100 scenes)"
            onPress={() =>
              router.push({
                pathname: "/quizzes/play",
                params: { quizId: "vibe-deep" },
              } as never)
            }
            accessibilityHint="Starts the full 100-scene Vibe Quiz. Progress saves on this device."
          />
        </View>
      </Card>

      <Button
        label="Touch Language (full body map)"
        onPress={() => router.push("/touch-language" as never)}
        accessibilityHint="Opens your full Touch Language map: pressure, speed, duration, zones, hard and soft limits. Local save and secure partner share. Never consent to touch."
      />
      <Button
        label="Consent Snapshot (prepare & mutual seal)"
        onPress={() => router.push("/consent-snapshot/prepare" as never)}
        accessibilityHint="Serious pre-session process: boundaries, mood, safewords, aftercare, Soft Signal. Both people must affirm. Never automatic consent."
      />
      <Button
        variant="signal"
        label="Spooning Protocol v0.1"
        onPress={() => router.push("/spooning" as never)}
        accessibilityHint="Over-engineered cuddle planner: roles, positions, duration, Soft Signal, private debrief. Containment, not a product."
      />
      <Button
        variant="signal"
        label="Exorcism Dojo — not a product"
        onPress={() => router.push("/dojo" as never)}
        accessibilityHint="Private ritual: defense inventory, urge before build, burn readiness. Not a consumer feature."
      />
      <Button
        variant="secondary"
        label="Soft Signal (practice & private log)"
        onPress={() => router.push("/soft-signal/practice" as never)}
        accessibilityHint="Practice Soft Signal without a peer, or open your private Soft Signal records. Never punitive."
      />
      <Button
        variant="secondary"
        label="Trauma-informed safety (panic · timeout · reflect)"
        onPress={() => router.push("/safety" as never)}
        accessibilityHint="Panic cover, quick exit, session time boundaries, present-moment checks, and optional private reflection. Not emergency services."
      />
      <Button
        variant="secondary"
        label="Proximity Layer (radar · NFC · QR · AirDrop)"
        onPress={() => router.push("/proximity" as never)}
        accessibilityHint="Full proximity hub: opt-in anonymous radar with Touch Language compatibility percent, NFC, encrypted QR, and AirDrop-style share. Extreme consent gating. Soft Signal anytime."
      />
      <Button
        variant="secondary"
        label={
          status === "demo"
            ? "Guided Learning (paths · lived · foundations · demo)"
            : "Guided Learning (paths · lived · foundations)"
        }
        onPress={() => router.push("/(tabs)/learn" as never)}
        accessibilityHint="Opens the full private curriculum: learning paths, six lived lessons, six foundations, interactive scenarios, optional Soft Signal and Consent Snapshot practice. Never a safety score."
      />
      <Button
        variant="secondary"
        label={
          status === "demo"
            ? "Partner invite practice (demo)"
            : "Partner invite & comparison"
        }
        onPress={() => router.push("/quizzes/share" as never)}
        accessibilityHint="Opens encrypted partner invite and mutual-consent comparison. Never auto-opens."
      />
      <Button
        variant="secondary"
        label="Meet the mock community"
        onPress={() => router.push("/discover")}
      />
      {status === "authenticated" ? (
        <Button
          variant="secondary"
          label={
            pendingCount > 0
              ? `Session requests (${pendingCount})`
              : "Session requests"
          }
          onPress={() => router.push("/requests")}
          accessibilityHint="Opens incoming and outgoing session requests"
        />
      ) : null}
      <Button
        variant="secondary"
        label="View private trust history"
        onPress={() => router.push("/profile/trust-ledger")}
      />
    </Screen>
  );
}
function makeStyles(colors: AppColors) {
  return {
    cardTitle: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 22,
      marginBottom: 6,
    },
    cardAction: { marginTop: 12 },
  };
}
