import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
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
import { notifyPrivateUpdate } from "../../services/notifications";
import { sessionRepository } from "../../services/sessionRepository";
import { colors, fonts } from "../../theme";

type OpenSession = {
  id: string;
  counterpartId: string;
  status: string;
  startedAt: string | null;
  createdAt: string;
};

function resumeLabel(status: string): string {
  if (status === "active") return "Return to active session";
  if (status === "ready") return "Continue — both confirmed";
  if (status === "consent_pending") return "Continue consent review";
  if (status === "accepted") return "Begin consent review";
  return "Open session";
}

function resumeRoute(session: OpenSession): {
  pathname: "/session/active" | "/match/consent-snapshot";
  params: Record<string, string>;
} {
  if (session.status === "active") {
    return {
      pathname: "/session/active",
      params: { sessionId: session.id },
    };
  }
  return {
    pathname: "/match/consent-snapshot",
    params: {
      id: personaIdForUserId(session.counterpartId),
      sessionId: session.id,
    },
  };
}

export default function HomeTabScreen() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);

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
    const unsubscribe = sessionRepository.subscribeToIncomingRequests(
      user.id,
      (event) => {
        void refreshActivity();
        if (event === "INSERT") void notifyPrivateUpdate();
      },
    );
    return unsubscribe;
  }, [status, user, refreshActivity]);

  return (
    <Screen>
      <Eyebrow>{status === "demo" ? "DEMO MODE" : "HOME"}</Eyebrow>
      <Title>Good to see you.</Title>
      <Body muted>
        A quiet landing spot. Discovery and trust history live in their own
        tabs. Open sessions can be resumed here after a restart.
      </Body>

      {status === "authenticated" && openSessions.length > 0
        ? openSessions.map((session) => {
            const route = resumeRoute(session);
            return (
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
                <View style={styles.cardAction}>
                  <Button
                    label={resumeLabel(session.status)}
                    onPress={() =>
                      router.push({
                        pathname: route.pathname,
                        params: route.params,
                      })
                    }
                    accessibilityHint="Returns to the current consent or active session step without inventing new consent"
                  />
                </View>
              </Card>
            );
          })
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
const styles = StyleSheet.create({
  cardTitle: {
    color: colors.ink,
    fontFamily: fonts.headline,
    fontSize: 22,
    marginBottom: 6,
  },
  cardAction: { marginTop: 12 },
});
