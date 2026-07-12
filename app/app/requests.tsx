import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { personaIdForUserId } from "../data/mockConsentProfiles";
import { sessionRepository } from "../services/sessionRepository";
import { supabase } from "../services/supabase";
import { colors } from "../theme";
import {
  EmptyState,
  FailureState,
  LoadingState,
} from "../components/AsyncState";

type IncomingRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  createdAt: string;
};

export default function IncomingRequestsScreen() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready"; requests: IncomingRequest[] }
  >({ kind: "loading" });
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setState({ kind: "loading" });
    try {
      const [requests, { data: profiles, error: profilesError }] =
        await Promise.all([
          sessionRepository.listIncomingRequests(user.id),
          supabase.rpc("discovery_profiles"),
        ]);
      if (profilesError) throw profilesError;
      const nameByUserId = new Map<string, string>(
        (profiles ?? []).map(
          (row: { user_id: string; display_name: string }) => [
            row.user_id,
            row.display_name,
          ],
        ),
      );
      setState({
        kind: "ready",
        requests: requests.map((request) => ({
          ...request,
          requesterName: nameByUserId.get(request.requesterId) ?? "Someone",
        })),
      });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Requests could not be loaded.",
      });
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const respond = async (
    request: IncomingRequest,
    decision: "accepted" | "declined",
  ) => {
    setRespondingTo(request.id);
    try {
      await sessionRepository.respondToRequest(request.id, decision);
      if (decision === "accepted") {
        // Best-effort: advances the session toward consent review. If this
        // fails, the requests list still refreshes and the person can try
        // again from the match screen; it does not block the accept itself.
        try {
          await sessionRepository.beginConsentReview(request.id);
        } catch {
          // Swallowed intentionally -- see comment above.
        }
        router.push({
          pathname: "/match/consent-snapshot",
          params: {
            id: personaIdForUserId(request.requesterId),
            sessionId: request.id,
          },
        });
        return;
      }
      await load();
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "That response could not be saved.",
      });
    } finally {
      setRespondingTo(null);
    }
  };

  if (status !== "authenticated") {
    return (
      <Screen scroll={false} style={styles.center}>
        <Title center>Session requests</Title>
        <Body center muted>
          Demo mode has no real account to receive requests on. Sign in to see
          requests sent to you.
        </Body>
      </Screen>
    );
  }
  if (state.kind === "loading")
    return <LoadingState label="Checking for requests…" />;
  if (state.kind === "error")
    return <FailureState message={state.message} onRetry={() => void load()} />;

  return (
    <Screen>
      <Eyebrow>SESSION REQUESTS</Eyebrow>
      <Title>Who's asked to meet?</Title>
      <Body muted>
        Accepting only begins the consent process. It never grants consent by
        itself.
      </Body>
      {state.requests.length === 0 ? (
        <EmptyState
          title="No requests right now"
          message="When someone requests a session with you, it will show up here."
        />
      ) : (
        <View style={styles.list}>
          {state.requests.map((request) => (
            <Card key={request.id}>
              <Text style={styles.name}>{request.requesterName}</Text>
              <Body muted>
                Requested{" "}
                {new Date(request.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Body>
              <View style={styles.actions}>
                <Button
                  label={respondingTo === request.id ? "…" : "Accept"}
                  disabled={respondingTo === request.id}
                  onPress={() => void respond(request, "accepted")}
                />
                <Button
                  variant="secondary"
                  label={respondingTo === request.id ? "…" : "Decline"}
                  disabled={respondingTo === request.id}
                  onPress={() => void respond(request, "declined")}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  center: { justifyContent: "center", gap: 18 },
  list: { gap: 14 },
  name: { color: colors.ink, fontWeight: "800", fontSize: 17 },
  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
});
