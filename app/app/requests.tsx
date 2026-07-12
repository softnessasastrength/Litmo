import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  SectionTitle,
  Title,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { personaIdForUserId } from "../data/mockConsentProfiles";
import { notifyPrivateUpdate } from "../services/notifications";
import { sessionRepository } from "../services/sessionRepository";
import { supabase } from "../services/supabase";
import { type AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";
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
  expiresAt: string;
};

type OutgoingRequest = {
  id: string;
  recipientId: string;
  recipientName: string;
  createdAt: string;
  expiresAt: string;
};

export default function IncomingRequestsScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user, status } = useAuth();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | {
        kind: "ready";
        incoming: IncomingRequest[];
        outgoing: OutgoingRequest[];
      }
  >({ kind: "loading" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (options?: { quiet?: boolean }) => {
      if (!user) return;
      if (!options?.quiet) setState({ kind: "loading" });
      try {
        const [incoming, outgoing, { data: profiles, error: profilesError }] =
          await Promise.all([
            sessionRepository.listIncomingRequests(),
            sessionRepository.listOutgoingRequests(),
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
          incoming: incoming.map((request) => ({
            ...request,
            requesterName: nameByUserId.get(request.requesterId) ?? "Someone",
          })),
          outgoing: outgoing.map((request) => ({
            ...request,
            recipientName: nameByUserId.get(request.recipientId) ?? "Someone",
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
    },
    [user],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Live refresh + privacy-safe local alert on a brand-new incoming request.
  useEffect(() => {
    if (!user || status !== "authenticated") return;
    return sessionRepository.subscribeToIncomingRequests(user.id, (event) => {
      void load({ quiet: true });
      if (event === "INSERT") void notifyPrivateUpdate();
    });
  }, [user, status, load]);

  const respond = async (
    request: IncomingRequest,
    decision: "accepted" | "declined",
  ) => {
    setBusyId(request.id);
    try {
      await sessionRepository.respondToRequest(request.id, decision);
      if (decision === "accepted") {
        try {
          await sessionRepository.beginConsentReview(request.id);
        } catch {
          // Best-effort; accept already succeeded.
        }
        router.push({
          pathname: "/match/consent-snapshot",
          params: {
            // Mock persona id only used if snapshot falls back; real path uses sessionId.
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
      setBusyId(null);
    }
  };

  const cancelOutgoing = async (request: OutgoingRequest) => {
    setBusyId(request.id);
    try {
      await sessionRepository.cancelRequest(request.id);
      await load({ quiet: true });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "That request could not be cancelled.",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (status !== "authenticated") {
    return (
      <Screen scroll={false} style={styles.center}>
        <Title center>Session requests</Title>
        <Body center muted>
          Demo mode has no real account to send or receive requests on. Sign in
          to manage real session requests.
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
      <Title>Requests in and out.</Title>
      <Body muted>
        Accepting only begins consent review. Cancelling withdraws a pending
        ask. Neither grants consent.
      </Body>

      <SectionTitle>Incoming</SectionTitle>
      {state.incoming.length === 0 ? (
        <EmptyState
          title="No incoming requests"
          message="When someone requests a session with you, it will show up here."
        />
      ) : (
        <View style={styles.list}>
          {state.incoming.map((request) => (
            <Card key={request.id}>
              <Text style={styles.name}>{request.requesterName}</Text>
              <Body muted>
                Requested{" "}
                {new Date(request.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Body>
              <Body muted>
                Expires{" "}
                {new Date(request.expiresAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Body>
              <View style={styles.actions}>
                <Button
                  label={busyId === request.id ? "…" : "Accept"}
                  disabled={busyId === request.id}
                  onPress={() => void respond(request, "accepted")}
                />
                <Button
                  variant="secondary"
                  label={busyId === request.id ? "…" : "Decline"}
                  disabled={busyId === request.id}
                  onPress={() => void respond(request, "declined")}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      <SectionTitle>Outgoing</SectionTitle>
      {state.outgoing.length === 0 ? (
        <EmptyState
          title="No outgoing requests"
          message="When you request a session, it stays here until they respond, it expires, or you cancel."
        />
      ) : (
        <View style={styles.list}>
          {state.outgoing.map((request) => (
            <Card key={request.id}>
              <Text style={styles.name}>{request.recipientName}</Text>
              <Body muted>
                Sent{" "}
                {new Date(request.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Body>
              <Body muted>
                Expires{" "}
                {new Date(request.expiresAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Body>
              <View style={styles.actions}>
                <Button
                  variant="secondary"
                  label={busyId === request.id ? "…" : "Cancel request"}
                  disabled={busyId === request.id}
                  onPress={() => void cancelOutgoing(request)}
                  accessibilityHint="Withdraws this pending session request. No explanation is required."
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
function makeStyles(colors: AppColors) {
  return {
    center: { justifyContent: "center", gap: 18 },
    list: { gap: 14, marginBottom: 18 },
    name: { color: colors.ink, fontWeight: "800", fontSize: 17 },
    actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  };
}
