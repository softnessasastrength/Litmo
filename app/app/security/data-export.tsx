import { useState } from "react";
import { Share, Text } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { useAuth } from "../../context/AuthContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import {
  safetyOpsService,
  type MyDataExport,
} from "../../services/safetyOpsService";
import { collectLocalInventory } from "../../services/localDataInventory";
import { type AppColors } from "../../theme";

export default function DataExportScreen() {
  return (
    <SensitiveAccessGate>
      <DataExportContent />
    </SensitiveAccessGate>
  );
}

function DataExportContent() {
  const styles = useThemedStyles(makeStyles);
  const { status } = useAuth();
  const [busy, setBusy] = useState(false);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const local = await collectLocalInventory();
      let server: MyDataExport | null = null;
      if (status === "authenticated") {
        try {
          server = await safetyOpsService.exportMyData();
        } catch (caught) {
          setError(
            caught instanceof Error
              ? `Server export: ${caught.message}. Local inventory still included.`
              : "Server export failed. Local inventory still included.",
          );
        }
      }
      setPayload({
        export_schema: "litmo.portability.v1",
        gdpr_note:
          "Portability package for the data subject. Not a guarantee of legal completeness. See docs/GDPR.md.",
        sensitive_categories_priority: [
          "touch_profile_versions",
          "consent_preference_versions",
          "sessions_and_snapshots_via_sessions",
          "device_local_partner_e2e_not_exported_as_keys",
        ],
        server,
        device_local: local,
      });
    } finally {
      setBusy(false);
    }
  };

  const json = payload ? JSON.stringify(payload, null, 2) : "";

  return (
    <Screen>
      <Eyebrow>YOUR DATA</Eyebrow>
      <Title>Portable, private, yours.</Title>
      <Body muted>
        Generate a structured JSON copy for access and portability. Server
        categories require sign-in. Device-local inventory is always included.
        Encryption private keys are never exported.
      </Body>
      <Card>
        <Body>
          Server (when signed in): profile, touch-profile versions, consent
          preference versions, sessions, reports (without private notes), trust
          events, quiz summaries when available.
        </Body>
        <Body muted>
          Device-local: quiz result counts, learning progress counts, mid-quiz
          save presence, partner invite presence, ND mode flag, privacy notice
          acknowledgment — not plaintext partner packages or E2E secrets.
        </Body>
      </Card>
      <Body muted>
        Prioritizes sensitive touch and consent categories. This is an
        engineering portability tool aligned with GDPR access/portability
        intent; it is not a final legal attestation.
      </Body>
      <Button
        label={
          busy
            ? "Generating…"
            : payload
              ? "Regenerate export"
              : "Generate export"
        }
        disabled={busy}
        onPress={() => void generate()}
      />
      {status !== "authenticated" ? (
        <Body muted>
          You are not signed in — export will include device-local inventory
          only.
        </Body>
      ) : null}
      {payload ? (
        <>
          <Card>
            <Text style={styles.meta}>Ready to share from this device</Text>
            <Body muted>{json.length.toLocaleString()} characters of JSON</Body>
          </Card>
          <Button
            variant="secondary"
            label="Share JSON export"
            accessibilityHint="Opens the device share sheet with your private JSON data"
            onPress={() => {
              void Share.share({
                title: "My Litmo data export",
                message: json,
              });
            }}
          />
        </>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    meta: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 16,
      marginBottom: 6,
    },
    error: { color: colors.signal, textAlign: "center" as const },
  };
}
