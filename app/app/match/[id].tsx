import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Pill,
  Screen,
  SectionTitle,
  Title,
} from "../../components/ui";
import { mockProfiles } from "../../data/mock";
import {
  personaUserId,
  type MockPersonaId,
} from "../../data/mockConsentProfiles";
import { useAuth } from "../../context/AuthContext";
import { blockService } from "../../services/blockService";
import { sessionRepository } from "../../services/sessionRepository";
import { colors } from "../../theme";

export default function MatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile =
    mockProfiles.find((item) => item.id === id) ?? mockProfiles[0];
  const { status } = useAuth();
  const [requestState, setRequestState] = useState<
    "idle" | "sending" | "sent" | "cancelling" | "error"
  >("idle");
  const [requestError, setRequestError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [blockState, setBlockState] = useState<
    "idle" | "blocking" | "blocked" | "error"
  >("idle");
  const [blockError, setBlockError] = useState("");
  const canRequest = status === "authenticated";
  const personaTargetId = personaUserId[profile.id as MockPersonaId];

  const sendRequest = async () => {
    setRequestState("sending");
    setRequestError("");
    try {
      const id = await sessionRepository.requestSession(
        personaUserId[profile.id as MockPersonaId],
      );
      setSessionId(id);
      setRequestState("sent");
    } catch (caught) {
      setRequestState("error");
      setRequestError(
        caught instanceof Error
          ? caught.message
          : "The request could not be sent. Try again.",
      );
    }
  };

  const cancelRequest = async () => {
    if (!sessionId) return;
    setRequestState("cancelling");
    setRequestError("");
    try {
      await sessionRepository.cancelRequest(sessionId);
      setSessionId(null);
      setRequestState("idle");
    } catch (caught) {
      setRequestState("error");
      setRequestError(
        caught instanceof Error
          ? caught.message
          : "The request could not be cancelled.",
      );
    }
  };

  const blockPerson = async () => {
    setBlockState("blocking");
    setBlockError("");
    try {
      await blockService.blockUser(personaTargetId);
      setBlockState("blocked");
      setSessionId(null);
      setRequestState("idle");
    } catch (caught) {
      setBlockState("error");
      setBlockError(
        caught instanceof Error
          ? caught.message
          : "That account could not be blocked right now.",
      );
    }
  };

  return (
    <Screen>
      <View style={[styles.hero, { backgroundColor: profile.color }]}>
        <Text style={styles.glyph}>{profile.glyph}</Text>
        <Pill>{profile.archetype}</Pill>
      </View>
      <Eyebrow>SYNTHETIC PROFILE</Eyebrow>
      <Title>
        {profile.name}, {profile.age}
      </Title>
      <Body muted>
        {profile.pronouns} · {profile.distance}
      </Body>
      <Body>{profile.note}</Body>
      <Card>
        <SectionTitle>Vibe notes</SectionTitle>
        <Body>{profile.vibe}</Body>
      </Card>
      <Card>
        <SectionTitle>Trust context</SectionTitle>
        <Text style={styles.affirmed}>
          {profile.affirmed} affirmed mock sessions
        </Text>
        <Body muted>
          Past outcomes are limited context. They never prove that someone is
          safe or replace your current boundaries.
        </Body>
      </Card>
      <View style={styles.separation}>
        <Text style={styles.separationTitle}>
          Vibe brought you here. Consent comes next.
        </Text>
        <Text style={styles.separationBody}>
          The next screen uses plain, literal language and the strict overlap of
          both mock preference sets.
        </Text>
      </View>
      {canRequest ? (
        <>
          <Button
            variant="secondary"
            label={
              requestState === "sending"
                ? "Sending…"
                : requestState === "sent" || requestState === "cancelling"
                  ? "Request sent"
                  : `Request a session with ${profile.name}`
            }
            disabled={
              requestState === "sending" ||
              requestState === "sent" ||
              requestState === "cancelling"
            }
            onPress={() => void sendRequest()}
          />
          {requestState === "sent" || requestState === "cancelling" ? (
            <>
              <Body muted>
                {profile.name} will see this the next time they open Litmo. This
                only sends a request — nothing is scheduled or agreed yet.
              </Body>
              <Button
                variant="secondary"
                label={
                  requestState === "cancelling"
                    ? "Cancelling…"
                    : "Cancel this request"
                }
                disabled={requestState === "cancelling" || !sessionId}
                onPress={() => void cancelRequest()}
                accessibilityHint="Withdraws the pending session request without requiring a reason"
              />
              <Button
                variant="secondary"
                label="View all requests"
                onPress={() => router.push("/requests")}
              />
            </>
          ) : null}
          {requestState === "error" ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {requestError}
            </Text>
          ) : null}
        </>
      ) : status === "demo" ? (
        <>
          <Button
            variant="secondary"
            label={
              requestState === "sent"
                ? "Practice request recorded (demo)"
                : `Practice requesting a session with ${profile.name}`
            }
            disabled={requestState === "sent"}
            onPress={() => setRequestState("sent")}
            accessibilityHint="Records a fictional practice request only. No message is sent to a real person."
          />
          {requestState === "sent" ? (
            <Body muted>
              Demo only — nothing was delivered. A real request needs a
              signed-in account. You can still practice the Consent Snapshot
              next.
            </Body>
          ) : (
            <Body muted>
              You are in demo mode. This practice request stays on this phone
              and never contacts a real person.
            </Body>
          )}
        </>
      ) : (
        <Body muted>
          Sign in to send a real session request, or enter demo mode from the
          entry screen to practice with fictional people.
        </Body>
      )}
      <Button
        label={
          status === "demo"
            ? "Continue to mock Consent Snapshot"
            : "Review a mock Consent Snapshot"
        }
        onPress={() =>
          router.push({
            pathname: "/match/consent-snapshot",
            params: { id: profile.id },
          })
        }
        accessibilityHint="Opens the mock Consent Snapshot. Confirming is practice only unless a real session ID is present."
      />
      {canRequest && blockState !== "blocked" ? (
        <>
          <Button
            variant="signal"
            label={
              blockState === "blocking" ? "Blocking…" : `Block ${profile.name}`
            }
            disabled={blockState === "blocking"}
            onPress={() => void blockPerson()}
            accessibilityHint="Immediately and privately blocks this account. They are not told who blocked them. Pending requests are cancelled."
          />
          <Body muted center>
            Blocking is private and immediate. They will not be told it was you.
            Pending session requests between you are cancelled.
          </Body>
          {blockState === "error" ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {blockError}
            </Text>
          ) : null}
        </>
      ) : null}
      {blockState === "blocked" ? (
        <Body muted center>
          Blocked. You will not see each other in discovery or requests. Manage
          blocks in Settings.
        </Body>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: {
    height: 190,
    borderRadius: 30,
    padding: 22,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  glyph: { color: colors.plum, fontFamily: "Georgia", fontSize: 72 },
  affirmed: {
    color: colors.moss,
    fontSize: 17,
    fontWeight: "800",
    marginVertical: 8,
  },
  separation: {
    borderLeftWidth: 4,
    borderLeftColor: colors.apricot,
    paddingLeft: 16,
    gap: 5,
  },
  separationTitle: { color: colors.ink, fontWeight: "800", fontSize: 16 },
  separationBody: { color: colors.muted, lineHeight: 21 },
  error: { color: colors.signal, textAlign: "center" },
});
