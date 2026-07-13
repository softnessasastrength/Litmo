import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Share, Text, TextInput, View } from "react-native";
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
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { useAuth } from "../../context/AuthContext";
import { useNeurodivergent } from "../../context/NeurodivergentContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import type { AppColors } from "../../theme";
import {
  intentLabel,
  nfcService,
  type NfcUiState,
} from "../../services/nfcService";
import type { NfcIntent } from "../../services/nfcCore";
import type { QrPrivacyMode } from "../../services/qrInviteCore";
import { profileRepository } from "../../services/profileRepository";

export default function NfcConnectScreen() {
  return (
    <SensitiveAccessGate>
      <NfcConnectContent />
    </SensitiveAccessGate>
  );
}

function NfcConnectContent() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user, status } = useAuth();
  const neuro = useNeurodivergent();
  const params = useLocalSearchParams<{
    intent?: string;
    rows?: string;
    title?: string;
    payload?: string;
  }>();

  const [state, setState] = useState<NfcUiState>(nfcService.getState());
  const [intent, setIntent] = useState<NfcIntent>(
    params.intent === "snapshot_initiate"
      ? "snapshot_initiate"
      : params.intent === "key_exchange"
        ? "key_exchange"
        : "profile_share",
  );
  const [paste, setPaste] = useState(
    typeof params.payload === "string" ? params.payload : "",
  );
  const [acceptPaste, setAcceptPaste] = useState("");
  const [profile, setProfile] = useState({
    displayName: "Litmo neighbor",
    pronouns: null as string | null,
    bio: null as string | null,
  });
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState<QrPrivacyMode>("colocated");

  const snapshotRows = (() => {
    if (typeof params.rows !== "string" || !params.rows) return [];
    try {
      const parsed = JSON.parse(params.rows) as {
        label: string;
        value: string;
      }[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  useEffect(() => {
    const unsub = nfcService.subscribe(setState);
    void nfcService.refresh();
    return () => {
      unsub();
      void nfcService.cancel();
    };
  }, []);

  useEffect(() => {
    if (typeof params.payload === "string" && params.payload) {
      nfcService.ingestExternalPayload(params.payload, "deep_link");
    }
  }, [params.payload]);

  useEffect(() => {
    let cancelled = false;
    if (status === "demo") {
      setProfile({
        displayName: "Demo self",
        pronouns: null,
        bio: "Demo profile for careful NFC practice.",
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

  const create = async () => {
    setBusy(true);
    setLocalError(null);
    try {
      await nfcService.createOffer({
        intent,
        label: neuro.enabled ? "quiet" : null,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Could not create offer.",
      );
    } finally {
      setBusy(false);
    }
  };

  const shareFallback = async () => {
    const message = state.fallback?.shareMessage;
    if (!message) return;
    try {
      await Share.share({ message });
    } catch {
      // user dismissed
    }
  };

  const seal = async () => {
    setBusy(true);
    setLocalError(null);
    try {
      await nfcService.sealForPeer({
        displayName: profile.displayName,
        pronouns: profile.pronouns,
        bio: profile.bio,
        snapshotTitle:
          typeof params.title === "string"
            ? params.title
            : "Consent Snapshot review",
        snapshotRows,
        peerAcceptRaw: acceptPaste.trim() || undefined,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Could not seal package.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>NFC · CAREFUL CONNECT</Eyebrow>
      <Title>Tap, then choose — every time.</Title>
      <Body muted>
        NFC tags, QR/link, or a short code. After every scan you must Accept or
        Decline. Encryption is ephemeral. A tap is never consent to touch and
        never starts a session.
      </Body>

      <Card style={styles.card}>
        <Body>
          {state.nfcHardware
            ? "NFC hardware available on this build"
            : "NFC hardware unavailable — use QR / share / manual code"}
        </Body>
        <Body muted>
          iOS third-party apps use NDEF tags (not silent phone-to-phone P2P).
          QR and manual invite always work as graceful fallback.
        </Body>
      </Card>

      {neuro.enabled ? (
        <Card style={styles.card}>
          <Body>Neurodivergent Mode</Body>
          <Body muted>
            One step at a time. No urgency. Soft cancel is always available.
            You can use codes instead of NFC if tags feel overstimulating.
          </Body>
        </Card>
      ) : null}

      {state.phase === "idle" ||
      state.phase === "canceled" ||
      state.phase === "error" ? (
        <>
          <Body>What do you want to offer?</Body>
          <View accessibilityRole="radiogroup" style={styles.choices}>
            <Choice
              label="Discovery profile share"
              selected={intent === "profile_share"}
              onPress={() => setIntent("profile_share")}
            />
            <Choice
              label="Consent Snapshot review invite"
              selected={intent === "snapshot_initiate"}
              onPress={() => setIntent("snapshot_initiate")}
            />
            <Choice
              label="Secure key exchange only"
              selected={intent === "key_exchange"}
              onPress={() => setIntent("key_exchange")}
            />
          </View>
          <Button
            label={busy ? "Preparing…" : `Create ${intentLabel(intent)} offer`}
            disabled={busy}
            onPress={() => void create()}
          />
          <CarefulConnectFallback
            nfcAvailable={state.nfcHardware}
            qrAvailable
            qr={null}
            privacyMode={privacyMode}
            onPrivacyModeChange={(mode) => {
              setPrivacyMode(mode);
              nfcService.setQrPrivacyMode(mode);
            }}
            nfcPrimaryLabel="Scan NFC tag"
            nfcEnabled={state.nfcHardware && !busy}
            onNfcPrimary={() => void nfcService.beginScan()}
            onIngestPaste={(raw, unlock) =>
              nfcService.ingestExternalPayload(raw, "qr", unlock)
            }
            title="Receive an invite (NFC → QR → manual)"
          />
        </>
      ) : null}

      {state.statusNote ? (
        <Card style={styles.card}>
          <Text style={styles.phase}>{state.phase.replaceAll("_", " ")}</Text>
          <Body muted>{state.statusNote}</Body>
          {state.errorMessage || localError ? (
            <Text accessibilityRole="alert" style={styles.alert}>
              {state.errorMessage || localError}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {state.phase === "offer_ready" ||
      state.phase === "writing" ||
      state.phase === "accepted" ||
      state.phase === "key_ready" ||
      state.phase === "content_ready" ? (
        <>
          <Card style={styles.card}>
            <Body>Your package</Body>
            {state.offer ? (
              <>
                <Body>
                  {intentLabel(state.offer.intent)} · code{" "}
                  <Text style={styles.code}>{state.offer.code}</Text>
                </Body>
                <Body muted>{state.offer.disclaimer}</Body>
              </>
            ) : null}
          </Card>
          <CarefulConnectFallback
            nfcAvailable={state.nfcHardware}
            qrAvailable
            qr={state.qr}
            privacyMode={privacyMode}
            onPrivacyModeChange={(mode) => {
              setPrivacyMode(mode);
              nfcService.setQrPrivacyMode(mode);
            }}
            nfcPrimaryLabel="Write invite to NFC tag"
            nfcEnabled={Boolean(state.nfcWrite && state.offer)}
            onNfcPrimary={() => void nfcService.writeOfferToTag()}
            title="Share carefully (NFC → encrypted QR → manual)"
          />
          {(state.phase === "offer_ready" || state.phase === "accepted") && (
            <Card style={styles.card}>
              <Text style={styles.label}>
                Paste their Accept QR/link (after they consent)
              </Text>
              <TextInput
                accessibilityLabel="Paste peer accept link"
                value={acceptPaste}
                onChangeText={setAcceptPaste}
                style={styles.input}
                multiline
                placeholder="litmo://q/v1/… or litmo://nfc/accept/v1/…"
                placeholderTextColor="#8A8074"
              />
              <Button
                label={busy ? "Sealing…" : "Seal content for them"}
                disabled={busy}
                onPress={() => void seal()}
              />
              <Button
                variant="secondary"
                label="Share legacy non-QR link"
                onPress={() => void shareFallback()}
              />
            </Card>
          )}
        </>
      ) : null}

      {state.phase === "awaiting_post_tap_consent" && state.pendingOffer ? (
        <Card style={styles.card}>
          <Body>Careful review required</Body>
          <Body>
            Intent: {intentLabel(state.pendingOffer.intent)}
            {state.pendingOffer.label
              ? ` · label ${state.pendingOffer.label}`
              : ""}
          </Body>
          <Body muted>{state.pendingOffer.disclaimer}</Body>
          <Body muted>
            Transport: {state.transport ?? "unknown"}. A physical tap or QR scan
            is not enough — only your Accept continues.
          </Body>
          <Button
            label="Accept carefully"
            onPress={() => void nfcService.acceptPostTap()}
            accessibilityHint="Derives ephemeral keys and allows sealed content. Never consent to touch."
          />
          <Button
            variant="signal"
            label="Decline — no explanation needed"
            onPress={() => nfcService.declinePostTap()}
          />
        </Card>
      ) : null}

      {state.phase === "key_ready" ? (
        <Card style={styles.card}>
          <Body>Keys ready after your accept</Body>
          <Body muted>
            Show them your Accept encrypted QR above (if visible) or paste a
            sealed package they send next.
          </Body>
          <Text style={styles.label}>Paste sealed package (optional)</Text>
          <TextInput
            accessibilityLabel="Paste sealed package"
            value={paste}
            onChangeText={setPaste}
            style={styles.input}
            multiline
          />
          <Button
            label="Open sealed package"
            onPress={() => {
              if (paste.trim()) {
                nfcService.ingestExternalPayload(paste.trim(), "qr");
              }
              nfcService.openSealed(paste.trim() || undefined);
            }}
          />
        </Card>
      ) : null}

      {state.opened ? (
        <Card style={styles.card}>
          <Body>Opened after explicit consent</Body>
          {state.opened.kind === "profile_share" ? (
            <>
              <Text style={styles.revealName}>{state.opened.displayName}</Text>
              {state.opened.pronouns ? (
                <Body muted>{state.opened.pronouns}</Body>
              ) : null}
              {state.opened.bio ? <Body>{state.opened.bio}</Body> : null}
            </>
          ) : null}
          {state.opened.kind === "snapshot_initiate" ? (
            <>
              <Text style={styles.revealName}>{state.opened.title}</Text>
              <Body muted>
                Review only — does not activate a session or grant touch.
              </Body>
              {state.opened.rows.map((row) => (
                <View key={row.label} style={styles.row}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowValue}>{row.value}</Text>
                </View>
              ))}
              <Button
                variant="secondary"
                label="Open Consent Snapshot screen (review)"
                onPress={() =>
                  router.push({
                    pathname: "/match/consent-snapshot",
                    params: { id: "maya" },
                  } as never)
                }
              />
            </>
          ) : null}
          {state.opened.kind === "key_exchange" ? (
            <Body>{state.opened.note}</Body>
          ) : null}
          <Body muted>Still never consent to touch.</Body>
        </Card>
      ) : null}

      <Button
        variant="signal"
        label="Cancel / Soft clear"
        onPress={() => void nfcService.cancel()}
        accessibilityHint="Ends NFC sessions and clears ephemeral keys. No explanation needed."
      />
      <Button variant="secondary" label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    card: { gap: 12 },
    choices: { gap: 10 },
    phase: {
      color: colors.moss,
      fontWeight: "800" as const,
      fontSize: 13,
      letterSpacing: 1,
      textTransform: "uppercase" as const,
    },
    alert: {
      color: colors.signal,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "600" as const,
    },
    label: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700" as const,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      padding: 14,
      minHeight: 88,
      color: colors.ink,
      fontSize: 15,
      backgroundColor: colors.paper,
    },
    code: {
      fontWeight: "800" as const,
      letterSpacing: 1.2,
      color: colors.moss,
    },
    revealName: {
      color: colors.ink,
      fontSize: 24,
      fontWeight: "700" as const,
    },
    row: { gap: 4, marginTop: 6 },
    rowLabel: {
      color: colors.moss,
      fontWeight: "700" as const,
      fontSize: 12,
      textTransform: "uppercase" as const,
    },
    rowValue: { color: colors.ink, fontSize: 16, lineHeight: 22 },
    linkText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
    },
  };
}
