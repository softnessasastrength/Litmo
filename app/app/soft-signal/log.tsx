import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Text, TextInput, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  SOFT_SIGNAL_COPY,
  type SoftSignalLogEntry,
} from "../../lib/softSignalCore";
import { softSignalService } from "../../services/softSignalService";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

/**
 * Private Soft Signal personal records — never a score, never required at stop.
 */
export default function SoftSignalLogScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [entries, setEntries] = useState<SoftSignalLogEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const refresh = useCallback(() => {
    void softSignalService.loadPersonalLog().then(setEntries);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const saveNote = async (id: string) => {
    await softSignalService.addJournalNote(id, draft);
    setEditingId(null);
    setDraft("");
    refresh();
  };

  return (
    <Screen>
      <Eyebrow>SOFT SIGNAL · PRIVATE LOG</Eyebrow>
      <Title>Your safe exits — for you only.</Title>
      <Body muted>{SOFT_SIGNAL_COPY.logPrivacy}</Body>

      {entries.length === 0 ? (
        <Card>
          <Body muted>{SOFT_SIGNAL_COPY.logEmpty}</Body>
          <Button
            label="Practice Soft Signal"
            onPress={() => router.push("/soft-signal/practice" as never)}
          />
        </Card>
      ) : (
        entries.map((entry) => (
          <Card key={entry.id}>
            <Text style={styles.when}>
              {new Date(entry.firedAt).toLocaleString()}
            </Text>
            <Text style={styles.line}>
              Outcome · {entry.outcome.replaceAll("_", " ")}
            </Text>
            <Text style={styles.line}>
              Source · {entry.source.replaceAll("_", " ")}
            </Text>
            <Text style={styles.line}>
              Surface · {entry.surface.replaceAll("_", " ")}
            </Text>
            {entry.sessionId ? (
              <Text style={styles.meta}>Session ref saved privately</Text>
            ) : (
              <Text style={styles.meta}>No session id (practice or demo)</Text>
            )}
            {entry.privateJournalNote ? (
              <Text style={styles.note}>“{entry.privateJournalNote}”</Text>
            ) : (
              <Text style={styles.meta}>No private note yet</Text>
            )}
            {editingId === entry.id ? (
              <>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  style={styles.input}
                  placeholder="Optional private note for you only…"
                  placeholderTextColor={colors.muted}
                  multiline
                  maxLength={500}
                />
                <Button
                  label="Save note"
                  onPress={() => void saveNote(entry.id)}
                />
                <Button
                  variant="secondary"
                  label="Cancel"
                  onPress={() => {
                    setEditingId(null);
                    setDraft("");
                  }}
                />
              </>
            ) : (
              <Button
                variant="secondary"
                label={
                  entry.privateJournalNote
                    ? "Edit private note"
                    : "Add private note (optional)"
                }
                onPress={() => {
                  setEditingId(entry.id);
                  setDraft(entry.privateJournalNote ?? "");
                }}
              />
            )}
          </Card>
        ))
      )}

      <Button
        variant="secondary"
        label="Practice Soft Signal"
        onPress={() => router.push("/soft-signal/practice" as never)}
      />
      <Button
        variant="secondary"
        label="Back"
        onPress={() => router.back()}
      />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    when: {
      fontFamily: fonts.headline,
      fontSize: 20,
      color: colors.ink,
      marginBottom: 6,
    },
    line: { color: colors.ink, fontSize: 15, lineHeight: 22 },
    meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
    note: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
      fontStyle: "italic" as const,
    },
    input: {
      marginTop: 10,
      minHeight: 80,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.cream,
      padding: 12,
      color: colors.ink,
      textAlignVertical: "top" as const,
    },
  };
}
