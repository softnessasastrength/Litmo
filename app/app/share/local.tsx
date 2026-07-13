import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { useAuth } from "../../context/AuthContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import type { AppColors } from "../../theme";
import {
  localShareService,
  makeProfilePayload,
  makeSnapshotPayload,
  type LocalShareUiState,
} from "../../services/localShareService";
import {
  getNearbyShareEnabled,
  setNearbyShareEnabled,
} from "../../services/localSharePreference";
import {
  shareKindLabel,
  type ShareKind,
  type SnapshotRowShare,
} from "../../services/localShareCore";
import { profileRepository } from "../../services/profileRepository";

type Mode = "choose" | "host" | "receive";

export default function LocalShareScreen() {
  return (
    <SensitiveAccessGate>
      <LocalShareContent />
    </SensitiveAccessGate>
  );
}

function LocalShareContent() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user, status } = useAuth();
  const params = useLocalSearchParams<{
    kind?: string;
    title?: string;
    rows?: string;
    displayName?: string;
    pronouns?: string;
    bio?: string;
  }>();

  const initialKind: ShareKind =
    params.kind === "consent_snapshot_review"
      ? "consent_snapshot_review"
      : "discovery_profile";

  const [kind, setKind] = useState<ShareKind>(initialKind);
  const [mode, setMode] = useState<Mode>("choose");
  const [state, setState] = useState<LocalShareUiState>(
    localShareService.getState(),
  );
  const [masterOn, setMasterOn] = useState(false);
  const [profile, setProfile] = useState({
    displayName: "Litmo neighbor",
    pronouns: null as string | null,
    bio: null as string | null,
  });
  const [prepError, setPrepError] = useState<string | null>(null);

  const snapshotRows: SnapshotRowShare[] = useMemo(() => {
    if (typeof params.rows !== "string" || !params.rows) return [];
    try {
      const parsed = JSON.parse(params.rows) as SnapshotRowShare[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.rows]);

  useEffect(() => {
    const unsub = localShareService.subscribe(setState);
    void localShareService.refreshAvailability().then(() => {
      void getNearbyShareEnabled().then(setMasterOn);
    });
    return () => {
      unsub();
      void localShareService.stop("leave_screen");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (typeof params.displayName === "string" && params.displayName) {
        if (!cancelled) {
          setProfile({
            displayName: params.displayName,
            pronouns:
              typeof params.pronouns === "string" ? params.pronouns : null,
            bio: typeof params.bio === "string" ? params.bio : null,
          });
        }
        return;
      }
      if (status === "demo") {
        if (!cancelled) {
          setProfile({
            displayName: "Demo self",
            pronouns: null,
            bio: "Demo discovery profile for nearby practice.",
          });
        }
        return;
      }
      if (!user) return;
      try {
        const own = await profileRepository.getOwnProfile(user.id);
        if (!cancelled) {
          setProfile({
            displayName: own.displayName || "Litmo neighbor",
            pronouns: own.pronouns,
            bio: own.bio,
          });
        }
      } catch {
        // Keep demo-safe default; profile load is best-effort.
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, status, params.displayName, params.pronouns, params.bio]);

  const startHost = async () => {
    setPrepError(null);
    setMode("host");
    try {
      const payload =
        kind === "discovery_profile"
          ? makeProfilePayload(profile)
          : makeSnapshotPayload({
              title:
                typeof params.title === "string"
                  ? params.title
                  : "Consent Snapshot review",
              rows: snapshotRows,
            });
      if (
        kind === "consent_snapshot_review" &&
        snapshotRows.length === 0
      ) {
        setPrepError(
          "Open Nearby Share from a Consent Snapshot so the rows can travel with you. Empty snapshot reviews are not shared.",
        );
        setMode("choose");
        return;
      }
      await localShareService.startAsHost({
        myDisplayName: profile.displayName,
        shareKind: kind,
        payload,
      });
    } catch (error) {
      setPrepError(
        error instanceof Error ? error.message : "Could not start sharing.",
      );
      setMode("choose");
    }
  };

  const startReceive = async () => {
    setPrepError(null);
    setMode("receive");
    try {
      await localShareService.startAsGuest({
        myDisplayName: profile.displayName,
        shareKind: kind,
      });
    } catch (error) {
      setPrepError(
        error instanceof Error ? error.message : "Could not start receiving.",
      );
      setMode("choose");
    }
  };

  const toggleMaster = async (next: boolean) => {
    await setNearbyShareEnabled(next);
    setMasterOn(next);
    await localShareService.refreshAvailability();
    if (!next) {
      await localShareService.stop("opt_out");
      setMode("choose");
    }
  };

  const active =
    mode !== "choose" &&
    state.phase !== "idle" &&
    state.phase !== "stopped" &&
    state.phase !== "error";

  return (
    <Screen>
      <Eyebrow>NEARBY SHARE</Eyebrow>
      <Title>Share only what you mean, only while you stay.</Title>
      <Body muted>
        AirDrop-style, on this local network only. Multipeer Connectivity plus
        ephemeral encryption. Off by default. Easy to stop. Never consent to
        touch, never session activation, never private nervous-system notes.
      </Body>

      <Card style={styles.card}>
        <Body>
          {masterOn ? "Nearby sharing is allowed on this device" : "Nearby sharing is off"}
        </Body>
        <Body muted>
          Master switch. When off, Litmo will not advertise or browse. You can
          still open this screen to turn it on intentionally.
        </Body>
        <Button
          variant={masterOn ? "secondary" : "primary"}
          label={masterOn ? "Turn nearby sharing off" : "Allow nearby sharing"}
          onPress={() => void toggleMaster(!masterOn)}
          accessibilityHint="Master opt-in for Multipeer nearby share. Default is off."
        />
      </Card>

      {!state.available ? (
        <Card style={styles.card}>
          <Body>Development build required</Body>
          <Body muted>
            Expo Go does not include the Litmo Multipeer module. Use an iOS
            development build (`npx expo run:ios`) on two physical devices (or
            one device and simulator for limited tests).
          </Body>
        </Card>
      ) : null}

      {mode === "choose" ? (
        <>
          <Body>What do you want to exchange?</Body>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Share kind"
            style={styles.choices}
          >
            <Choice
              label="Discovery profile (name, pronouns, short intro)"
              selected={kind === "discovery_profile"}
              onPress={() => setKind("discovery_profile")}
            />
            <Choice
              label="Consent Snapshot review (co-located only)"
              selected={kind === "consent_snapshot_review"}
              onPress={() => setKind("consent_snapshot_review")}
            />
          </View>
          <Body muted>
            {kind === "discovery_profile"
              ? `About to share as “${profile.displayName}”. Boundaries and private notes stay off this channel.`
              : "Snapshot share is for reading together in person. It does not start a session or replace live confirmation."}
          </Body>
          {prepError ? (
            <Text accessibilityRole="alert" style={styles.alert}>
              {prepError}
            </Text>
          ) : null}
          <Button
            label={`Offer ${shareKindLabel(kind)} nearby`}
            disabled={!masterOn || !state.available}
            onPress={() => void startHost()}
            accessibilityHint="Starts advertising so a person next to you can request a connection"
          />
          <Button
            variant="secondary"
            label={`Receive ${shareKindLabel(kind)} nearby`}
            disabled={!masterOn || !state.available}
            onPress={() => void startReceive()}
            accessibilityHint="Looks for someone who started offering a share"
          />
        </>
      ) : null}

      {mode !== "choose" ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.phase}>{state.phase.replaceAll("_", " ")}</Text>
            {state.statusNote ? <Body muted>{state.statusNote}</Body> : null}
            {state.errorMessage ? (
              <Text accessibilityRole="alert" style={styles.alert}>
                {state.errorMessage}
              </Text>
            ) : null}
          </Card>

          {state.invitation ? (
            <Card style={styles.card}>
              <Body>
                {state.invitation.displayName} wants to connect
              </Body>
              <Body muted>
                Accept only if they are next to you and this is the person you
                intended.
              </Body>
              <Button
                label="Accept connection"
                onPress={() =>
                  void localShareService.respondToInvitation(true)
                }
              />
              <Button
                variant="secondary"
                label="Decline"
                onPress={() =>
                  void localShareService.respondToInvitation(false)
                }
              />
            </Card>
          ) : null}

          {state.peers.length > 0 && mode === "receive" ? (
            <View style={styles.peerList}>
              <Body>Nearby offers</Body>
              {state.peers.map((peer) => (
                <Card key={peer.peerId} style={styles.card}>
                  <Body>{peer.discoveryLabel || peer.displayName}</Body>
                  <Body muted>
                    {peer.shareKind
                      ? shareKindLabel(peer.shareKind as ShareKind)
                      : "Litmo nearby"}
                  </Body>
                  <Button
                    label={`Connect to ${peer.displayName}`}
                    onPress={() => void localShareService.invite(peer)}
                  />
                </Card>
              ))}
            </View>
          ) : null}

          {state.received ? (
            <Card style={styles.card}>
              <Body>Received nearby</Body>
              <Body muted>{state.received.disclaimer}</Body>
              {state.received.kind === "discovery_profile" ? (
                <>
                  <Text style={styles.receivedName}>
                    {state.received.displayName}
                  </Text>
                  {state.received.pronouns ? (
                    <Body muted>{state.received.pronouns}</Body>
                  ) : null}
                  {state.received.bio ? <Body>{state.received.bio}</Body> : null}
                </>
              ) : (
                <>
                  <Text style={styles.receivedName}>{state.received.title}</Text>
                  {state.received.rows.map((row) => (
                    <View key={row.label} style={styles.row}>
                      <Text style={styles.rowLabel}>{row.label}</Text>
                      <Text style={styles.rowValue}>{row.value}</Text>
                    </View>
                  ))}
                </>
              )}
              <Body muted>
                Not consent to touch. Not a live session. Either of you may stop
                or walk away without explanation.
              </Body>
            </Card>
          ) : null}

          <Button
            variant="signal"
            label={active ? "Stop sharing now" : "Close nearby share"}
            onPress={() => {
              void localShareService.stop("user");
              setMode("choose");
            }}
            accessibilityHint="Immediately turns off nearby radio and clears ephemeral keys"
          />
        </>
      ) : null}

      <Button variant="secondary" label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    card: { gap: 12 },
    choices: { gap: 10 },
    peerList: { gap: 12 },
    alert: {
      color: colors.signal,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "600" as const,
    },
    phase: {
      color: colors.moss,
      fontWeight: "800" as const,
      fontSize: 15,
      textTransform: "uppercase" as const,
      letterSpacing: 1,
    },
    receivedName: {
      color: colors.ink,
      fontSize: 24,
      fontWeight: "700" as const,
    },
    row: { gap: 4, marginTop: 8 },
    rowLabel: {
      color: colors.moss,
      fontWeight: "700" as const,
      fontSize: 13,
      textTransform: "uppercase" as const,
    },
    rowValue: { color: colors.ink, fontSize: 17, lineHeight: 24 },
  };
}
