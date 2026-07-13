import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
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
import { privacyService } from "../../services/privacyService";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function DeleteDataScreen() {
  return (
    <SensitiveAccessGate>
      <DeleteDataBody />
    </SensitiveAccessGate>
  );
}

function DeleteDataBody() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { status } = useAuth();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"ok" | "warn">("ok");

  const wipeLocal = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const report = await privacyService.wipeLocal();
      setMessageTone("ok");
      setMessage(
        `Device-local data cleared (${report.asyncCleared.length + report.secureCleared.length} stores). Encryption private keys on this phone are removed where known. Server account (if any) is not deleted by this step.`,
      );
    } catch {
      setMessageTone("warn");
      setMessage("Could not complete local wipe. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const requestErasure = async () => {
    if (status !== "authenticated") {
      setMessageTone("warn");
      setMessage("Sign in to request server-side account erasure.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await privacyService.requestErasure(note);
      if ("error" in result) {
        setMessageTone("warn");
        setMessage(result.error);
        return;
      }
      setMessageTone("ok");
      setMessage(
        `Erasure request recorded (${result.id.slice(0, 8)}…). Ops will fulfill according to policy. Full automatic account destruction is not silent — see docs/GDPR.md. Consider wiping this device too.`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>DELETE / ERASE</Eyebrow>
      <Title>Leave cleanly when you need to.</Title>
      <Body muted>
        Two separate powers: wipe this device now, and (if signed in) request
        account erasure for human/ops fulfillment. Soft Signal still ends a
        session without any of this.
      </Body>

      <Card>
        <Text style={styles.cardTitle} accessibilityRole="header">
          1 · Wipe this device
        </Text>
        <Body muted>
          Clears local quiz results, learning progress, mid-quiz saves, partner
          invites, known E2E identity material, and related preferences on this
          phone. Immediate. Does not delete your cloud account by itself.
        </Body>
        <Button
          label={busy ? "Working…" : "Wipe data on this device"}
          variant="secondary"
          disabled={busy}
          onPress={() => void wipeLocal()}
          accessibilityHint="Removes Litmo local stores on this device only"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle} accessibilityRole="header">
          2 · Request account erasure
        </Text>
        <Body muted>
          Queues a GDPR-style erasure request while signed in. Complete
          automated deletion of every server row is blocked until legal and ops
          owners approve destructive workflows — your request is still recorded
          and respected as a formal ask.
        </Body>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional note (never required for Soft Signal)"
          placeholderTextColor={styles.placeholder.color}
          multiline
          style={styles.input}
          accessibilityLabel="Optional note for erasure request"
          maxLength={500}
        />
        <Button
          label={busy ? "Working…" : "Submit erasure request"}
          disabled={busy || status !== "authenticated"}
          onPress={() => void requestErasure()}
          accessibilityHint="Records an erasure request for your account"
        />
        {status !== "authenticated" ? (
          <Body muted>Sign in with a real account to submit a server request.</Body>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.cardTitle} accessibilityRole="header">
          Sensitive categories
        </Text>
        <Body muted>
          Touch profiles, consent preferences, and Consent Snapshots are
          high-priority. Export them first if you need a copy. Private encrypted
          notes may be unreadable without this device’s keys after wipe.
        </Body>
        <Button
          label="Export my data first"
          variant="secondary"
          onPress={() => router.push("/security/data-export" as never)}
        />
      </Card>

      {message ? (
        <View
          style={[
            styles.msg,
            messageTone === "ok" ? styles.msgOk : styles.msgWarn,
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.msgText}>{message}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    cardTitle: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 22,
      marginBottom: 8,
    },
    input: {
      minHeight: 80,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      padding: 12,
      marginVertical: 10,
      backgroundColor: colors.paper,
      color: colors.ink,
      textAlignVertical: "top" as const,
    },
    placeholder: { color: colors.muted },
    msg: {
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
    },
    msgOk: {
      backgroundColor: colors.mossSoft,
      borderColor: colors.moss,
    },
    msgWarn: {
      backgroundColor: colors.plumSoft,
      borderColor: colors.plum,
    },
    msgText: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  };
}
