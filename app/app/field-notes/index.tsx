/** Private Field Notes — freeform local capture. Not a partner message. */
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import {
  FIELD_NOTE_TAGS,
  createFieldNote,
  summarizeFieldNotes,
  type FieldNote,
} from "../../lib/fieldNotesCore";
import { fieldNotesStore } from "../../services/fieldNotesStore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

export default function FieldNotesScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);

  const reload = useCallback(async () => {
    setNotes(await fieldNotesStore.load());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const summary = summarizeFieldNotes(notes);

  const save = async () => {
    const n = createFieldNote({ body, tags, mood });
    if (!n) return;
    await fieldNotesStore.append(n);
    setBody("");
    setTags([]);
    setMood(null);
    await reload();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>FIELD NOTES</Eyebrow>
        <Title>Capture without sending.</Title>
        <Body muted>
          Local only. Wipeable. Not a partner channel. {summary.total} notes
          {summary.top_tags[0]
            ? ` · top tag ${summary.top_tags[0].tag}`
            : ""}
        </Body>
        <Card>
          <TextInput
            style={[styles.input, { minHeight: 120 }]}
            multiline
            placeholder="Write it here so it doesn’t have to become a text…"
            placeholderTextColor={colors.muted}
            value={body}
            onChangeText={setBody}
            accessibilityLabel="Field note body"
          />
          <Body muted>Mood 1–5 (optional)</Body>
          <View style={styles.row}>
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <Pressable
                key={n}
                onPress={() => setMood(n)}
                style={[
                  styles.chip,
                  mood === n && {
                    borderColor: colors.moss,
                    backgroundColor: colors.mossSoft,
                  },
                ]}
              >
                <Text style={{ color: colors.ink }}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.rowWrap}>
            {FIELD_NOTE_TAGS.map((t) => (
              <Pressable
                key={t}
                onPress={() =>
                  setTags((prev) =>
                    prev.includes(t)
                      ? prev.filter((x) => x !== t)
                      : [...prev, t],
                  )
                }
                style={[
                  styles.chip,
                  tags.includes(t) && {
                    borderColor: colors.moss,
                    backgroundColor: colors.mossSoft,
                  },
                ]}
              >
                <Text style={{ color: colors.ink, fontSize: 12 }}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Button label="Save private note" onPress={() => void save()} />
        </Card>
        {notes.slice(0, 20).map((n) => (
          <Card key={n.id}>
            <Body>{n.body}</Body>
            <Body muted>
              {n.at.slice(0, 16).replace("T", " ")}
              {n.mood != null ? ` · mood ${n.mood}` : ""}
              {n.tags.length ? ` · ${n.tags.join(", ")}` : ""}
            </Body>
            <Button
              variant="secondary"
              label="Delete"
              onPress={() => void fieldNotesStore.remove(n.id).then(reload)}
            />
          </Card>
        ))}
        <Button
          variant="secondary"
          label="Pre-Renn Gate"
          onPress={() => router.push("/pre-renn" as never)}
        />
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 40 },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      textAlignVertical: "top" as const,
    },
    row: { flexDirection: "row" as const, gap: 8, marginVertical: 8 },
    rowWrap: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 6,
      marginBottom: 10,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.cream,
    },
  };
}
