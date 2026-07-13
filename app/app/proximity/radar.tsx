import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
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
import { CarefulConnectFallback } from "../../components/CarefulConnectFallback";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { useAuth } from "../../context/AuthContext";
import { useNeurodivergent } from "../../context/NeurodivergentContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import type { AppColors } from "../../theme";
import {
  getProximityPrefs,
  setProximityPrefs,
  type ProximityPrefs,
} from "../../services/proximityPreference";
import {
  bandLabel,
  proximityService,
  type ProximityUiState,
} from "../../services/proximityService";
import type { QrPrivacyMode } from "../../services/qrInviteCore";
import { profileRepository } from "../../services/profileRepository";
import { defaultProximityPrefs } from "../../services/proximityPreferenceCore";

export default function ProximityRadarScreen() {
  return (
    <SensitiveAccessGate>
      <ProximityRadarContent />
    </SensitiveAccessGate>
  );
}

function ProximityRadarContent() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user, status } = useAuth();
  const neuro = useNeurodivergent();
  const [state, setState] = useState<ProximityUiState>(
    proximityService.getState(),
  );
  const [prefs, setPrefs] = useState<ProximityPrefs>(defaultProximityPrefs);
  const [step, setStep] = useState<"intro" | "radar">("intro");
  const [profile, setProfile] = useState({
    displayName: "Litmo neighbor",
    pronouns: null as string | null,
    bio: null as string | null,
  });
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState<QrPrivacyMode>("colocated");

  useEffect(() => {
    const unsub = proximityService.subscribe(setState);
    void getProximityPrefs().then(setPrefs);
    void proximityService.refresh();
    return () => {
      unsub();
      void proximityService.stop("leave_screen");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (status === "demo") {
      setProfile({
        displayName: "Demo self",
        pronouns: null,
        bio: "Practice nearby presence.",
      });
      return;
    }
    if (!user) return;
    void profileRepository
      .getOwnProfile(user.id)
      .then((p) => {
        if (cancelled) return;
        setProfile({
          displayName: p.displayName || "Litmo neighbor",
          pronouns: p.pronouns,
          bio: p.bio,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, status]);

  const savePrefs = async (next: ProximityPrefs) => {
    setPrefs(next);
    await setProximityPrefs(next);
  };

  const start = async (forceDemo?: boolean) => {
    setBusy(true);
    setLocalError(null);
    try {
      if (!prefs.enabled) {
        await savePrefs({ ...prefs, enabled: true });
      }
      await proximityService.startRadar({ forceDemo });
      setStep("radar");
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Could not start proximity.",
      );
    } finally {
      setBusy(false);
    }
  };

  const progressive = neuro.progressiveDisclosure || neuro.enabled;
  const showDetail =
    !progressive ||
    state.phase === "mutual_interest" ||
    state.phase === "identity_pending" ||
    state.phase === "identity_revealed" ||
    state.phase === "encrypted" ||
    state.phase === "handshake_pending";

  return (
    <Screen>
      <Eyebrow>PROXIMITY</Eyebrow>
      <Title>Nearby, only as much as you choose.</Title>
      <Body muted>
        Opt-in anonymous radar, weather resonance (never a safety score),
        encrypted Multipeer handshake, and mutual consent before any name is
        shown. Soft Signal exits immediately — no explanation, no penalty.
      </Body>

      {step === "intro" ? (
        <>
          <Card style={styles.card}>
            <Body>
              {prefs.enabled
                ? "Proximity is allowed on this device"
                : "Proximity is off (default)"}
            </Body>
            <Body muted>
              Master opt-in. When off, Litmo does not advertise or browse nearby.
              Quiet-preferred is the default beacon style.
            </Body>
            <Button
              variant={prefs.enabled ? "secondary" : "primary"}
              label={
                prefs.enabled ? "Turn proximity off" : "Allow proximity on this device"
              }
              onPress={() =>
                void savePrefs({ ...prefs, enabled: !prefs.enabled })
              }
            />
          </Card>

          {neuro.enabled ? (
            <Card style={styles.card}>
              <Body>Neurodivergent Mode is on</Body>
              <Body muted>
                This screen uses calm language, progressive detail, and a
                always-visible Soft Signal. You can leave anytime. No urgency
                timers that pressure you — only a privacy timeout that turns
                radio off.
              </Body>
            </Card>
          ) : null}

          <Body>How your anonymous weather reads nearby</Body>
          <Body muted>
            These axes are coarse social weather only. They are not Touch
            Language, not Consent Snapshot, and never grant touch.
          </Body>
          {(
            [
              ["pace", "Pace (0 unhurried · 3 quicker)"],
              ["presence", "Presence (0 quiet · 3 warm)"],
              ["sensory", "Sensory (0 soft · 3 flexible)"],
              ["repair", "Repair (0 space-first · 3 talk-first)"],
            ] as const
          ).map(([key, label]) => (
            <View key={key} style={styles.axisRow}>
              <Body muted>
                {label}: {prefs.axes[key]}
              </Body>
              <View style={styles.axisButtons}>
                {[0, 1, 2, 3].map((n) => (
                  <Choice
                    key={n}
                    label={String(n)}
                    selected={prefs.axes[key] === n}
                    onPress={() =>
                      void savePrefs({
                        ...prefs,
                        axes: { ...prefs.axes, [key]: n },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          ))}

          <Choice
            label={
              prefs.quietPreferred
                ? "Quiet-preferred on (recommended)"
                : "Quiet-preferred off"
            }
            selected={prefs.quietPreferred}
            onPress={() =>
              void savePrefs({
                ...prefs,
                quietPreferred: !prefs.quietPreferred,
              })
            }
          />
          <Choice
            label={
              prefs.includeWeather
                ? `Include vibe family (${prefs.weather})`
                : "Hide vibe family on radar (default)"
            }
            selected={prefs.includeWeather}
            onPress={() =>
              void savePrefs({
                ...prefs,
                includeWeather: !prefs.includeWeather,
                weather: prefs.includeWeather ? "none" : prefs.weather === "none" ? "tidepool" : prefs.weather,
              })
            }
          />

          {localError ? (
            <Text accessibilityRole="alert" style={styles.alert}>
              {localError}
            </Text>
          ) : null}

          <Button
            label={busy ? "Starting…" : "Start anonymous radar"}
            disabled={busy || !prefs.enabled}
            onPress={() => void start(false)}
            accessibilityHint="Starts Multipeer anonymous proximity radar. Soft Signal can stop it anytime."
          />
          <Button
            variant="secondary"
            label="Practice radar (demo, no radio)"
            disabled={busy}
            onPress={() => void start(true)}
            accessibilityHint="Opens a trauma-informed practice radar with fictional neighbors. No local network radio."
          />
          <Body muted>
            Multipeer is preferred for anonymous radar. Encrypted QR is the
            robust fallback when NFC/radio is unavailable.
          </Body>
          <Button variant="secondary" label="Back" onPress={() => router.back()} />
        </>
      ) : null}

      {step === "radar" ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.phase}>{state.phase.replaceAll("_", " ")}</Text>
            {state.statusNote ? <Body muted>{state.statusNote}</Body> : null}
            {state.demoMode ? (
              <Body muted>Demo practice — fictional peers only.</Body>
            ) : null}
            {state.errorMessage ? (
              <Text accessibilityRole="alert" style={styles.alert}>
                {state.errorMessage}
              </Text>
            ) : null}
          </Card>

          <SoftSignalButton
            prominent
            onPress={() => {
              void proximityService.softSignal().then(() => setStep("intro"));
            }}
          />

          <CarefulConnectFallback
            nfcAvailable={false}
            qrAvailable
            qr={state.qr}
            privacyMode={privacyMode}
            onPrivacyModeChange={(mode) => {
              setPrivacyMode(mode);
              proximityService.setQrPrivacyMode(mode);
            }}
            title="Fallback when Multipeer is weak (encrypted QR → manual)"
            onIngestPaste={(raw, unlock) =>
              proximityService.ingestQr(raw, unlock)
            }
          />

          {state.pendingQrInvite ? (
            <Card style={styles.card}>
              <Body>QR peer waiting for your accept</Body>
              <Body muted>
                Label {state.pendingQrInvite.label ?? "anonymous"}. Weather
                axes only until you accept — still not a name, not consent.
              </Body>
              <Button
                label="Accept QR peer carefully"
                onPress={() => proximityService.acceptPendingQrInvite()}
              />
              <Button
                variant="signal"
                label="Decline QR peer"
                onPress={() => proximityService.declinePendingQrInvite()}
              />
            </Card>
          ) : null}

          {state.invitation ? (
            <Card style={styles.card}>
              <Body>Private handshake request</Body>
              <Body muted>
                From anonymous peer {state.invitation.label}. Accept only if the
                situation feels right. Names are still hidden.
              </Body>
              <Button
                label="Accept handshake"
                onPress={() =>
                  void proximityService.respondToInvitation(true)
                }
              />
              <Button
                variant="secondary"
                label="Decline"
                onPress={() =>
                  void proximityService.respondToInvitation(false)
                }
              />
            </Card>
          ) : null}

          {state.phase === "radar" || state.phase === "handshake_pending" ? (
            <>
              <Body>Anonymous nearby</Body>
              {state.matches.length === 0 ? (
                <Card style={styles.card}>
                  <Body muted>
                    No anonymous beacons yet. Keep the screen open only while you
                    feel comfortable. Soft Signal anytime.
                  </Body>
                </Card>
              ) : (
                state.matches.map((m) => (
                  <Card key={m.peerKey} style={styles.card}>
                    <Text style={styles.peerLabel}>{m.ephemeralLabel}</Text>
                    <Body>
                      {bandLabel(m.band)} · weather resonance {m.resonance}%
                    </Body>
                    {m.tlCompatibility != null ? (
                      <Body>
                        Touch Language shape {m.tlCompatibility}%
                        {m.tlBandLabel ? ` · ${m.tlBandLabel}` : ""}
                      </Body>
                    ) : (
                      <Body muted>
                        Touch Language % unavailable (peer or you not
                        broadcasting TL axes)
                      </Body>
                    )}
                    <Body muted>{m.disclaimer}</Body>
                    {m.tlCompatibility != null ? (
                      <Body muted>{m.tlDisclaimer}</Body>
                    ) : null}
                    {showDetail ? (
                      <Body muted>
                        Quiet-preferred: {m.beacon.quiet ? "yes" : "no"}
                        {m.beacon.weather !== "none"
                          ? ` · weather family: ${m.beacon.weather}`
                          : ""}
                      </Body>
                    ) : null}
                    <Button
                      label="Request private handshake"
                      onPress={() =>
                        void proximityService.inviteHandshake(m.peerKey)
                      }
                      accessibilityHint="Starts encrypted Multipeer handshake without revealing your name"
                    />
                  </Card>
                ))
              )}
            </>
          ) : null}

          {(state.phase === "encrypted" ||
            state.phase === "mutual_interest" ||
            state.phase === "identity_pending" ||
            state.phase === "identity_revealed") &&
          state.activePeerId ? (
            <Card style={styles.card}>
              <Body>
                With {state.activePeerLabel ?? "nearby peer"} (still anonymous
                until mutual reveal)
              </Body>
              {!(state.localInterest && state.peerInterest) ? (
                <>
                  <Body muted>
                    Encrypted channel is ready. Interest is optional and
                    revocable. Soft Signal is still primary.
                  </Body>
                  <Button
                    label={
                      state.localInterest
                        ? "Interest sent — waiting"
                        : "I am open to continue carefully"
                    }
                    disabled={state.localInterest}
                    onPress={() => void proximityService.offerInterest()}
                  />
                </>
              ) : (
                <>
                  <Body muted>
                    Mutual interest. Names stay hidden until both people choose
                    reveal. This is never consent to touch.
                  </Body>
                  {!state.localRevealOffer ? (
                    <Button
                      label="Offer my first name / display name"
                      onPress={() =>
                        void proximityService.offerIdentityReveal({
                          displayName: profile.displayName,
                          pronouns: profile.pronouns,
                          shortIntro: profile.bio,
                        })
                      }
                      accessibilityHint="Sends encrypted identity only after mutual interest. Peer still must consent to reveal."
                    />
                  ) : (
                    <Body muted>
                      You offered identity. Waiting for mutual consent before
                      anything is shown.
                    </Body>
                  )}
                </>
              )}

              {state.phase === "identity_revealed" && state.peerIdentity ? (
                <View style={styles.reveal}>
                  <Text style={styles.peerLabel}>
                    {state.peerIdentity.displayName}
                  </Text>
                  {state.peerIdentity.pronouns ? (
                    <Body muted>{state.peerIdentity.pronouns}</Body>
                  ) : null}
                  {state.peerIdentity.shortIntro ? (
                    <Body>{state.peerIdentity.shortIntro}</Body>
                  ) : null}
                  <Body muted>{state.peerIdentity.disclaimer}</Body>
                  <Button
                    variant="secondary"
                    label="Share more nearby (profile or snapshot)"
                    onPress={() =>
                      router.push({
                        pathname: "/share/local",
                        params: { kind: "discovery_profile" },
                      } as never)
                    }
                  />
                </View>
              ) : null}
            </Card>
          ) : null}

          {(state.phase === "soft_signaled" || state.phase === "stopped") && (
            <Card style={styles.card}>
              <Body>{state.statusNote}</Body>
              <Button
                label="Return to setup"
                onPress={() => setStep("intro")}
              />
            </Card>
          )}

          <Button
            variant="secondary"
            label="Stop and leave"
            onPress={() => {
              void proximityService.stop("user");
              setStep("intro");
            }}
          />
        </>
      ) : null}
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    card: { gap: 12 },
    phase: {
      color: colors.moss,
      fontWeight: "800" as const,
      fontSize: 14,
      letterSpacing: 1,
      textTransform: "uppercase" as const,
    },
    alert: {
      color: colors.signal,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "600" as const,
    },
    axisRow: { gap: 8 },
    axisButtons: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
    peerLabel: {
      color: colors.ink,
      fontSize: 22,
      fontWeight: "700" as const,
    },
    reveal: { gap: 8, marginTop: 8 },
  };
}
