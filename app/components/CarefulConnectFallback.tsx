import { useEffect, useState } from "react";
import { Share, Text, TextInput, View } from "react-native";
import { Body, Button, Card, Choice } from "./ui";
import { LitmoQrCode } from "./LitmoQrCode";
import { useThemedStyles } from "../hooks/useThemedStyles";
import type { AppColors } from "../theme";
import {
  formatExpiryCountdown,
  transportLabel,
  type ConnectTransport,
  type QrBuildResult,
  type QrPrivacyMode,
} from "../services/qrInviteCore";

type Props = {
  /** Preferred transport order starts at NFC when available. */
  nfcAvailable: boolean;
  qrAvailable?: boolean;
  /** Active encrypted QR build (host side). */
  qr: QrBuildResult | null;
  /** Called when user wants NFC write/scan (parent owns NFC service). */
  onNfcPrimary?: () => void;
  nfcPrimaryLabel?: string;
  nfcEnabled?: boolean;
  /** Privacy mode toggle. */
  privacyMode: QrPrivacyMode;
  onPrivacyModeChange: (mode: QrPrivacyMode) => void;
  /** Paste path for guest. */
  onIngestPaste?: (raw: string, unlock?: string) => void;
  title?: string;
};

/**
 * Graceful degradation UI: NFC → encrypted QR → manual link/code.
 * Consent copy is always visible; expiry is informational, not urgency theater.
 */
export function CarefulConnectFallback({
  nfcAvailable,
  qrAvailable = true,
  qr,
  onNfcPrimary,
  nfcPrimaryLabel = "Use NFC",
  nfcEnabled = true,
  privacyMode,
  onPrivacyModeChange,
  onIngestPaste,
  title = "How to connect carefully",
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const [transport, setTransport] = useState<ConnectTransport>(
    nfcAvailable ? "nfc" : qrAvailable ? "qr" : "manual",
  );
  const [paste, setPaste] = useState("");
  const [unlock, setUnlock] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!qr) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [qr?.exp]);

  useEffect(() => {
    if (!nfcAvailable && transport === "nfc") {
      setTransport(qrAvailable ? "qr" : "manual");
    }
  }, [nfcAvailable, qrAvailable, transport]);

  const degrade = () => {
    if (transport === "nfc") setTransport(qrAvailable ? "qr" : "manual");
    else if (transport === "qr") setTransport("manual");
  };

  const share = async () => {
    if (!qr) return;
    try {
      await Share.share({ message: qr.shareMessage });
    } catch {
      // dismissed
    }
  };

  return (
    <Card style={styles.card}>
      <Body>{title}</Body>
      <Body muted>
        Ladder: {transportLabel("nfc")} → {transportLabel("qr")} →{" "}
        {transportLabel("manual")}. A scan or tap is never consent — Accept
        carefully next.
      </Body>

      <View style={styles.row}>
        {(["nfc", "qr", "manual"] as ConnectTransport[]).map((t) => {
          const disabled =
            (t === "nfc" && !nfcAvailable) || (t === "qr" && !qrAvailable);
          return (
            <Choice
              key={t}
              label={transportLabel(t)}
              selected={transport === t}
              onPress={() => {
                if (!disabled) setTransport(t);
              }}
            />
          );
        })}
      </View>

      <Choice
        label={
          privacyMode === "colocated"
            ? "QR mode: co-located (key in QR)"
            : "QR mode: split (unlock code required)"
        }
        selected={privacyMode === "split"}
        onPress={() =>
          onPrivacyModeChange(
            privacyMode === "colocated" ? "split" : "colocated",
          )
        }
      />
      <Body muted>
        Split mode is better if the QR might be photographed by others. The
        unlock code stays on this screen or in Share text.
      </Body>

      {transport === "nfc" ? (
        <>
          <Body muted>
            NFC uses a physical tag on iOS (not silent phone-to-phone P2P). You
            can fall back to QR anytime.
          </Body>
          {onNfcPrimary ? (
            <Button
              label={nfcPrimaryLabel}
              disabled={!nfcEnabled}
              onPress={onNfcPrimary}
            />
          ) : null}
          <Button
            variant="secondary"
            label="NFC not working — use encrypted QR"
            onPress={degrade}
          />
        </>
      ) : null}

      {transport === "qr" && qr ? (
        <>
          <View style={styles.qrWrap}>
            <LitmoQrCode
              value={qr.deepLink}
              size={220}
              accessibilityLabel={`Encrypted QR for ${qr.kind}, ${formatExpiryCountdown(qr.exp, now)}`}
            />
          </View>
          <Text style={styles.countdown}>
            {formatExpiryCountdown(qr.exp, now)} · {qr.kind.replaceAll("_", " ")}
          </Text>
          <Body muted>
            Time limit protects shoulder-surfing. When it expires, create a new
            invite — no shame, no penalty.
          </Body>
          <Body>
            Unlock code
            {privacyMode === "split" ? " (required)" : " (backup)"}:{" "}
            <Text style={styles.code}>{qr.unlockCode}</Text>
          </Body>
          <Button label="Share QR payload / unlock" onPress={() => void share()} />
          <Button
            variant="secondary"
            label="Use manual link instead"
            onPress={degrade}
          />
        </>
      ) : null}

      {transport === "qr" && !qr ? (
        <Body muted>
          Create an invite first to generate a time-limited encrypted QR.
        </Body>
      ) : null}

      {transport === "manual" && qr ? (
        <>
          <Body muted>Manual deep link (selectable)</Body>
          <Text selectable style={styles.link}>
            {qr.deepLink}
          </Text>
          <Body>
            Unlock: <Text style={styles.code}>{qr.unlockCode}</Text>
          </Body>
          <Button label="Share manual invite" onPress={() => void share()} />
        </>
      ) : null}

      {onIngestPaste ? (
        <>
          <Body muted>Receive: paste a QR deep link or envelope</Body>
          <TextInput
            accessibilityLabel="Paste encrypted QR deep link"
            value={paste}
            onChangeText={setPaste}
            style={styles.input}
            multiline
            placeholder="litmo://q/v1/…"
            placeholderTextColor="#8A8074"
          />
          <TextInput
            accessibilityLabel="Unlock code if required"
            value={unlock}
            onChangeText={setUnlock}
            style={styles.inputSingle}
            placeholder="Unlock code (split mode)"
            placeholderTextColor="#8A8074"
            autoCapitalize="none"
          />
          <Button
            variant="secondary"
            label="Review pasted invite carefully"
            disabled={!paste.trim()}
            onPress={() => onIngestPaste(paste.trim(), unlock.trim() || undefined)}
          />
        </>
      ) : null}
    </Card>
  );
}

function makeStyles(colors: AppColors) {
  return {
    card: { gap: 12 },
    row: { gap: 8 },
    qrWrap: {
      alignItems: "center" as const,
      paddingVertical: 8,
      backgroundColor: colors.white,
      borderRadius: 12,
    },
    countdown: {
      color: colors.moss,
      fontWeight: "700" as const,
      fontSize: 15,
      textAlign: "center" as const,
    },
    code: {
      fontWeight: "800" as const,
      letterSpacing: 0.5,
      color: colors.moss,
    },
    link: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      padding: 12,
      minHeight: 72,
      color: colors.ink,
      backgroundColor: colors.paper,
      fontSize: 14,
    },
    inputSingle: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      padding: 12,
      color: colors.ink,
      backgroundColor: colors.paper,
      fontSize: 14,
    },
  };
}
