import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
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
import {
  cosmeticForUserId,
  discoveryService,
  type DiscoveryProfile,
} from "../../services/discoveryService";
import { LoadingState, FailureState } from "../../components/AsyncState";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";


const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function MatchDetailScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routeId = typeof id === "string" ? id : "";
  const isRealId = uuidRe.test(routeId);
  const mockProfile =
    mockProfiles.find((item) => item.id === routeId) ?? mockProfiles[0];
  const { status } = useAuth();
  const canRequest = status === "authenticated";

  const [real, setReal] = useState<DiscoveryProfile | null>(null);
  const [realLoad, setRealLoad] = useState<
    "idle" | "loading" | "error" | "ready"
  >(isRealId ? "loading" : "idle");
  const [realError, setRealError] = useState("");

  const [requestState, setRequestState] = useState<
    "idle" | "sending" | "sent" | "cancelling" | "error"
  >("idle");
  const [requestError, setRequestError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [blockState, setBlockState] = useState<
    "idle" | "blocking" | "blocked" | "error"
  >("idle");
  const [blockError, setBlockError] = useState("");

  useEffect(() => {
    if (!isRealId) return;
    let cancelled = false;
    setRealLoad("loading");
    void discoveryService
      .listProfiles()
      .then((rows) => {
        if (cancelled) return;
        const found = rows.find((r) => r.userId === routeId) ?? null;
        if (!found) {
          setRealError("That person is not available in discovery right now.");
          setRealLoad("error");
          return;
        }
        setReal(found);
        setRealLoad("ready");
      })
      .catch((caught) => {
        if (cancelled) return;
        setRealError(
          caught instanceof Error
            ? caught.message
            : "Profile could not be loaded.",
        );
        setRealLoad("error");
      });
    return () => {
      cancelled = true;
    };
  }, [isRealId, routeId]);

  const targetUserId = useMemo(() => {
    if (isRealId) return routeId;
    return personaUserId[mockProfile.id as MockPersonaId];
  }, [isRealId, routeId, mockProfile.id]);

  const display = useMemo(() => {
    if (isRealId && real) {
      const cosmetic = cosmeticForUserId(real.userId);
      return {
        name: real.displayName,
        pronouns: real.pronouns ?? "pronouns not listed",
        note: real.bio?.trim() || "No bio yet.",
        vibe: real.vibeArchetype ?? "Open to connection",
        archetype: real.vibeArchetype ?? "Neighbor",
        color: cosmetic.color,
        glyph: cosmetic.glyph,
        distance: null as string | null,
        age: null as number | null,
        affirmed: real.completedSessions,
        accountAgeDays: real.accountAgeDays,
        synthetic: false,
      };
    }
    return {
      name: mockProfile.name,
      pronouns: mockProfile.pronouns,
      note: mockProfile.note,
      vibe: mockProfile.vibe,
      archetype: mockProfile.archetype,
      color: mockProfile.color,
      glyph: mockProfile.glyph,
      distance: mockProfile.distance,
      age: mockProfile.age,
      affirmed: mockProfile.affirmed,
      accountAgeDays: null as number | null,
      synthetic: true,
    };
  }, [isRealId, real, mockProfile]);

  const sendRequest = async () => {
    setRequestState("sending");
    setRequestError("");
    try {
      const newId = await sessionRepository.requestSession(targetUserId);
      setSessionId(newId);
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
      await blockService.blockUser(targetUserId);
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

  if (isRealId && realLoad === "loading") {
    return <LoadingState label="Loading profile…" />;
  }
  if (isRealId && realLoad === "error") {
    return (
      <FailureState
        title="Profile unavailable"
        message={realError}
        onRetry={() => {
          setRealLoad("loading");
          void discoveryService.listProfiles().then((rows) => {
            const found = rows.find((r) => r.userId === routeId) ?? null;
            if (!found) {
              setRealError(
                "That person is not available in discovery right now.",
              );
              setRealLoad("error");
              return;
            }
            setReal(found);
            setRealLoad("ready");
          });
        }}
      />
    );
  }

  return (
    <Screen>
      <View style={[styles.hero, { backgroundColor: display.color }]}>
        <Text style={styles.glyph}>{display.glyph}</Text>
        <Pill>{display.archetype}</Pill>
      </View>
      <Eyebrow>
        {display.synthetic ? "SYNTHETIC PROFILE" : "REAL ACCOUNT"}
      </Eyebrow>
      <Title>
        {display.name}
        {display.age != null ? `, ${display.age}` : ""}
      </Title>
      <Body muted>
        {display.pronouns}
        {display.distance ? ` · ${display.distance}` : ""}
      </Body>
      <Body>{display.note}</Body>
      <Card>
        <SectionTitle>Vibe notes</SectionTitle>
        <Body>{display.vibe}</Body>
      </Card>
      <Card>
        <SectionTitle>Specific context (not a score)</SectionTitle>
        <Text style={styles.affirmed}>
          {display.synthetic
            ? `${display.affirmed} completed mock sessions listed for demo`
            : `${display.affirmed} completed session${display.affirmed === 1 ? "" : "s"}`}
        </Text>
        {!display.synthetic && display.accountAgeDays != null ? (
          <Body muted>Account age: {display.accountAgeDays} days.</Body>
        ) : null}
        <Body muted>
          {display.synthetic
            ? "Account age on this synthetic profile is illustrative only. Real discovery shows account age in days and completed session counts as separate facts — never a single safety rating."
            : "These are separate facts, not a safety rating. Positive history never replaces current consent."}
        </Body>
      </Card>
      <View style={styles.separation}>
        <Text style={styles.separationTitle}>
          Vibe brought you here. Consent comes next.
        </Text>
        <Text style={styles.separationBody}>
          {display.synthetic
            ? "The next screen uses plain, literal language and the strict overlap of both mock preference sets."
            : "A real session still requires an explicit request, mutual acceptance, and a fresh Consent Snapshot — curiosity is not consent."}
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
                  : `Request a session with ${display.name}`
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
                {display.name} will see this the next time they open Litmo. This
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
                : `Practice requesting a session with ${display.name}`
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
      {display.synthetic ? (
        <Button
          label={
            status === "demo"
              ? "Continue to mock Consent Snapshot"
              : "Review a mock Consent Snapshot"
          }
          onPress={() =>
            router.push({
              pathname: "/match/consent-snapshot",
              params: { id: mockProfile.id },
            })
          }
          accessibilityHint="Opens the mock Consent Snapshot. Confirming is practice only unless a real session ID is present."
        />
      ) : (
        <Body muted>
          Consent Snapshot for a real pair starts after they accept a request
          and enter the review path — not from curiosity alone.
        </Body>
      )}
      {canRequest ? (
        <Button
          variant="secondary"
          label={`Report ${display.name}`}
          onPress={() =>
            router.push({
              pathname: "/security/report",
              params: {
                reportedId: targetUserId,
                displayName: display.name,
              },
            })
          }
          accessibilityHint="Opens a private structured report for human review. They are not told who reported them."
        />
      ) : null}
      {canRequest && blockState !== "blocked" ? (
        <>
          <Button
            variant="signal"
            label={
              blockState === "blocking" ? "Blocking…" : `Block ${display.name}`
            }
            disabled={blockState === "blocking"}
            onPress={() => void blockPerson()}
            accessibilityHint="Immediately and privately blocks this account. They are not told who blocked them. Open sessions with them end; pending requests are cancelled."
          />
          <Body muted center>
            Blocking is private and immediate. They will not be told it was you.
            Pending session requests between you are cancelled. Reporting is
            separate and does not automatically block.
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
function makeStyles(colors: AppColors) {
  return {
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
};
}

