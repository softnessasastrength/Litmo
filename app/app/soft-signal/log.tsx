/**
 * Private Soft Signal personal records screen — never a score, never required at stop.
 *
 * Lists SoftSignalLogEntry from softSignalService.loadPersonalLog. Optional
 * private journal notes are post-hoc only (add/edit after stop). Empty state
 * offers practice Soft Signal — never shames the user for having no exits logged.
 *
 * SEE:
 * - app/lib/softSignalCore.ts (SOFT_SIGNAL_COPY.logPrivacy)
 * - app/services/softSignalService.ts
 * - app/services/softSignalLogStore.ts
 * - docs/CODE_COMMENT_STANDARD.md (consent-critical privacy surface)
 */

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
 * WHAT: Screen showing device-private Soft Signal history with optional notes.
 * WHY: People may want to remember their own safe exits later without peer visibility
 *      or productized scoring; notes are optional reflection, not interrogation.
 * CONSENT: Viewing/editing log is not consent to contact. Notes never required at fire.
 *          Soft Signal remains never a penalty and not emergency services.
 * EDGE CASES:
 *   - empty log → practice CTA, not shame copy
 *   - sessionId present → “Session ref saved privately” (no peer name)
 *   - sessionId null → practice/demo framing
 *   - editingId single-entry edit mode; cancel clears draft without save
 *   - focus refresh reloads vault on every focus (new practice entries appear)
 * NEVER: Rank entries by “severity.” Share notes with partners. Demand notes.
 *        Display this list as a public trust score or safety rating.
 * SEE: softSignalService.loadPersonalLog / addJournalNote; SOFT_SIGNAL_COPY.log*
 */
export default function SoftSignalLogScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  /** Newest-first private Soft Signal entries from local vault. */
  const [entries, setEntries] = useState<SoftSignalLogEntry[]>([]);
  /** Which entry’s optional note editor is open; null = none. */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** Draft note text — never logged to analytics; max 500 at input + store. */
  const [draft, setDraft] = useState("");

  /**
   * WHAT: Reload personal Soft Signal log from service into local state.
   * WHY: Keep UI in sync after practice, fire elsewhere, or note save.
   * CONSENT: Not a consent surface; read-only load of private history.
   * EDGE CASES: load failures surface as empty via store fail-closed (service returns []).
   * NEVER: Log entry bodies or privateJournalNote to console during refresh.
   * SEE: softSignalService.loadPersonalLog
   */
  const refresh = useCallback(() => {
    void softSignalService.loadPersonalLog().then(setEntries);
  }, []);

  // Refresh on focus so practice/other screens’ new entries appear without app restart.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  /**
   * WHAT: Persist optional private journal note for one Soft Signal id, then exit edit.
   * WHY: Post-hoc reflection only — product must never force this at Soft Signal time.
   * CONSENT: Optional private note; saving is not an explanation demanded by Litmo.
   * EDGE CASES:
   *   - empty draft → store trims to null
   *   - always clears editingId/draft after save attempt
   * NEVER: Send note to peer. Require non-empty note. Use note as matching signal.
   * SEE: softSignalService.addJournalNote (500 char hygiene in store)
   */
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
      {/* Explicit privacy framing: not a score, not partner-shared, not required at stop. */}
      <Body muted>{SOFT_SIGNAL_COPY.logPrivacy}</Body>

      {entries.length === 0 ? (
        <Card>
          {/* Empty is neutral — never “you haven’t used safety enough.” */}
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
            {/* Outcome is plumbing language (synced/pending/practice), not blame. */}
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
              // Opaque ref only — do not show peer identity on this private screen.
              <Text style={styles.meta}>Session ref saved privately</Text>
            ) : (
              <Text style={styles.meta}>No session id (practice or demo)</Text>
            )}
            {entry.privateJournalNote ? (
              // User-authored private note; never required at Soft Signal fire time.
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
                  // Align with createLogEntry / updateNote 500 cap.
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
                    // Discard draft — no write; Soft Signal history unchanged.
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
                  // Prefill draft from existing note; empty string if none.
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

/**
 * WHAT: Theme styles for Soft Signal private log typography and note input.
 * WHY: Private note field must look personal/calm, not “incident report” chrome.
 * CONSENT: Not a consent surface — presentation only.
 * EDGE CASES: multiline input minHeight for optional reflection without pressure UX.
 * NEVER: Style as public leaderboard or penalty report form.
 */
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
