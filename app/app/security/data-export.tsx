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
  const [payload, setPayload] = useState<MyDataExport | null>(null);
  const [error, setError] = useState("");

  if (status !== "authenticated") {
    return (
      <Screen>
        <Eyebrow>YOUR DATA</Eyebrow>
        <Title>Sign in to export.</Title>
      </Screen>
    );
  }

  const json = payload ? JSON.stringify(payload, null, 2) : "";
  return (
    <Screen>
      <Eyebrow>YOUR DATA</Eyebrow>
      <Title>Portable, private, yours.</Title>
      <Body muted>
        Generate a structured JSON copy of account data already available to
        you. The export is created on demand and stays on this device until you
        choose where to share it.
      </Body>
      <Card>
        <Body>
          Includes your profile, touch-profile and consent-preference versions,
          sessions, submitted reports without private notes, and trust events.
        </Body>
      </Card>
      <Body muted>
        This private-alpha export is a portability tool, not a legal statement
        that every possible category is complete.
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
        onPress={() => {
          void (async () => {
            setBusy(true);
            setError("");
            try {
              setPayload(await safetyOpsService.exportMyData());
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Your export could not be generated.",
              );
            } finally {
              setBusy(false);
            }
          })();
        }}
      />
      {payload ? (
        <>
          <Card>
            <Text style={styles.meta}>
              Generated{" "}
              {typeof payload.generated_at === "string"
                ? new Date(payload.generated_at).toLocaleString()
                : "just now"}
            </Text>
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
      fontWeight: "800",
      fontSize: 16,
      marginBottom: 6,
    },
    error: { color: colors.signal, textAlign: "center" as const },
  };
}
