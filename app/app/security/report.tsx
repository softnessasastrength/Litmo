import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, TextInput, View } from "react-native";
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
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

export default function ReportScreen() {
  return (
    <SensitiveAccessGate>
      <ReportContent />
    </SensitiveAccessGate>
  );
}

function ReportContent() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
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
      const trimmed = note.trim();
      await reportService.submitReport({
        reportedId,
        category,
        sessionId,
        // Staff-readable free text for human review (ADR 0037). Not device-encrypted.
        staffSharedMessage: trimmed.length > 0 ? trimmed : null,
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
        Choose a category. An optional message is shared only with human
        reviewers (not with the other person, and never public).
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
      <Text style={styles.noteLabel}>Message for reviewers (optional)</Text>
      <TextInput
        accessibilityLabel="Message for human reviewers"
        multiline
        value={note}
        onChangeText={setNote}
        placeholder="Shared with human reviewers only. The other person cannot read this."
        placeholderTextColor={colors.muted}
        style={styles.note}
        maxLength={2000}
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

function makeStyles(colors: AppColors) {
  return {
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
  };
}
