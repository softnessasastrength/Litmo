import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";
import * as Crypto from "expo-crypto";
import {
  Body,
  Button,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { useAuth } from "../../context/AuthContext";
import {
  REPORT_CATEGORIES,
  reportService,
  type ReportCategoryId,
} from "../../services/reportService";
import { sensitiveDataService } from "../../services/sensitiveDataService";
import { colors } from "../../theme";

export default function ReportScreen() {
  return (
    <SensitiveAccessGate>
      <ReportContent />
    </SensitiveAccessGate>
  );
}

function ReportContent() {
  const router = useRouter();
  const { status } = useAuth();
  const params = useLocalSearchParams<{
    reportedId?: string;
    sessionId?: string;
    displayName?: string;
  }>();
  const reportedId =
    typeof params.reportedId === "string" ? params.reportedId : "";
  const sessionId =
    typeof params.sessionId === "string" && params.sessionId.length > 0
      ? params.sessionId
      : null;
  const displayName =
    typeof params.displayName === "string" && params.displayName.length > 0
      ? params.displayName
      : "this account";

  const [category, setCategory] = useState<ReportCategoryId | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const idempotencyKey = useMemo(() => Crypto.randomUUID(), []);

  if (status !== "authenticated") {
    return (
      <Screen>
        <Eyebrow>REPORT</Eyebrow>
        <Title>Sign in to report.</Title>
        <Body muted>
          Reports require a signed-in account so human review can follow up
          without public exposure.
        </Body>
      </Screen>
    );
  }

  if (!reportedId) {
    return (
      <Screen>
        <Eyebrow>REPORT</Eyebrow>
        <Title>Missing account.</Title>
        <Body muted>
          Open a profile or session first, then report from there.
        </Body>
        <Button label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const submit = async () => {
    if (!category) return;
    setState("sending");
    setError("");
    try {
      let encryptedPrivateNote: string | null = null;
      const trimmed = note.trim();
      if (trimmed.length > 0) {
        encryptedPrivateNote = await sensitiveDataService.encryptText(
          trimmed,
          `report:${reportedId}:private-note`,
        );
        if (!encryptedPrivateNote) {
          throw new Error("Private note could not be encrypted.");
        }
      }
      await reportService.submitReport({
        reportedId,
        category,
        sessionId,
        encryptedPrivateNote,
        idempotencyKey,
      });
      setState("sent");
    } catch (caught) {
      setState("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "The report could not be sent. Try again.",
      );
    }
  };

  if (state === "sent") {
    return (
      <Screen>
        <Eyebrow>REPORT RECEIVED</Eyebrow>
        <Title>Thank you for telling us.</Title>
        <Body>
          Your report was recorded for human review. The other person is not
          told who reported them, and this is not a promise of a specific
          outcome.
        </Body>
        <Body muted>
          Litmo is not emergency response. If you are in immediate danger,
          contact local emergency services. You can also block this account so
          they cannot discover or request sessions with you.
        </Body>
        <Button
          label="View my reports"
          onPress={() => router.replace("/security/reports" as never)}
        />
        <Button
          variant="secondary"
          label="Done"
          onPress={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Eyebrow>REPORT</Eyebrow>
      <Title>Report {displayName}</Title>
      <Body muted>
        Choose a category. An optional private note is encrypted on this device
        before it is stored. Reports are never public.
      </Body>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {REPORT_CATEGORIES.map((item) => (
          <Choice
            key={item.id}
            label={item.label}
            selected={category === item.id}
            onPress={() => setCategory(item.id)}
          />
        ))}
      </View>
      <Text style={styles.noteLabel}>Private note (optional)</Text>
      <TextInput
        accessibilityLabel="Private report note"
        multiline
        value={note}
        onChangeText={setNote}
        placeholder="Only human reviewers may use this. The other person cannot read it."
        placeholderTextColor={colors.muted}
        style={styles.note}
        maxLength={1200}
      />
      <Body muted>
        Submitting does not automatically punish anyone. A person reviews
        serious patterns. Blocking remains available separately for immediate
        distance.
      </Body>
      <Button
        label={state === "sending" ? "Sending…" : "Submit report"}
        disabled={!category || state === "sending"}
        onPress={() => void submit()}
        accessibilityHint="Sends a private structured report for human review"
      />
      {state === "error" ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: { gap: 10 },
  noteLabel: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 15,
    marginTop: 8,
  },
  note: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    color: colors.ink,
    textAlignVertical: "top",
    backgroundColor: colors.cream,
  },
  error: { color: colors.signal, textAlign: "center" },
});
