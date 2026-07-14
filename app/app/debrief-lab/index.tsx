/** Private Debrief Lab — useful data, not creepy. v0.2 precision. */
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import {
  DEBRIEF_FORBIDDEN,
  DEBRIEF_TAG_VOCAB,
  createManualDebrief,
  generateInsights,
  summarizeDebriefs,
  type UnifiedDebriefEntry,
} from "../../lib/privateDebriefCore";
import { privateDebriefStore } from "../../services/privateDebriefStore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";
import { runtimeConfig } from "../../config/runtime";
import { FeatureUnavailable } from "../../components/FeatureUnavailable";

export default function DebriefLabScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [log, setLog] = useState<UnifiedDebriefEntry[]>([]);
  const [title, setTitle] = useState("");
  const [worked, setWorked] = useState("");
  const [didnt, setDidnt] = useState("");
  const [reg, setReg] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [soft, setSoft] = useState(false);
  const [again, setAgain] = useState(false);
  const [showForbidden, setShowForbidden] = useState(false);

  const reload = useCallback(async () => {
    setLog(await privateDebriefStore.load());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const summary = summarizeDebriefs(log);
  const insights = generateInsights(log);

  const save = async () => {
    const e = createManualDebrief({
      title,
      regulation: reg,
      worked,
      didnt,
      tags,
      softSignalUsed: soft,
      again,
    });
    await privateDebriefStore.append(e);
    setTitle("");
    setWorked("");
    setDidnt("");
    setReg(null);
    setTags([]);
    setSoft(false);
    setAgain(false);
    await reload();
  };

  if (!runtimeConfig.features.pairedGrowthContent) {
    return (
      <FeatureUnavailable
        eyebrow="RELATIONSHIP TOOLS"
        title="This tool is not available in this build."
        body="This build focuses on your own self-understanding. Relationship-in-friction tools (bond map, conflict, attachment repair) remain in Maximum Mode builds (macOS / Linux / internal)."
      />
    );
  }
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>PRIVATE DEBRIEF LAB v0.2</Eyebrow>
        <Title>Useful data. Not creepy.</Title>
        <Body muted>
          Local only. Controlled tags. Wipeable. Soft Signal freeness tracked as
          skill, not failure. Never partner surveillance.
        </Body>
        <Card>
          <Body>
            {summary.total} entries · Soft Signal rate{" "}
            {Math.round(summary.soft_signal_rate * 100)}% · avg regulation{" "}
            {summary.avg_regulation ?? "—"}
            {summary.again_rate != null
              ? ` · again ${Math.round(summary.again_rate * 100)}%`
              : ""}
          </Body>
          <Body muted>
            Top tags:{" "}
            {summary.top_tags.map((t) => `${t.tag}(${t.count})`).join(" · ") ||
              "none yet"}
          </Body>
          {summary.by_source.length > 0 ? (
            <Body muted>
              Sources:{" "}
              {summary.by_source
                .slice(0, 5)
                .map((s) => `${s.source}(${s.count})`)
                .join(" · ")}
            </Body>
          ) : null}
        </Card>
        <Card>
          <Text style={styles.h}>Insights</Text>
          {insights.map((i) => (
            <Body key={i.id} muted>
              [{i.kind}] {i.text}
            </Body>
          ))}
        </Card>
        <Card>
          <Text style={styles.h}>New debrief</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Debrief title"
          />
          <Body muted>Regulation after (1–5)</Body>
          <View style={styles.row}>
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <Pressable
                key={n}
                onPress={() => setReg(n)}
                style={[
                  styles.chip,
                  reg === n && {
                    borderColor: colors.moss,
                    backgroundColor: colors.mossSoft,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Regulation ${n}`}
              >
                <Text style={{ color: colors.ink }}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={worked}
            onChangeText={setWorked}
            placeholder="What worked"
            placeholderTextColor={colors.muted}
            accessibilityLabel="What worked"
          />
          <TextInput
            style={styles.input}
            value={didnt}
            onChangeText={setDidnt}
            placeholder="What didn't"
            placeholderTextColor={colors.muted}
            accessibilityLabel="What did not work"
          />
          <View style={styles.rowWrap}>
            {DEBRIEF_TAG_VOCAB.map((t) => (
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
                accessibilityRole="button"
                accessibilityLabel={`Tag ${t}`}
              >
                <Text style={{ color: colors.ink, fontSize: 12 }}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.rowBetween}>
            <Body>Soft Signal used</Body>
            <Switch
              value={soft}
              onValueChange={setSoft}
              accessibilityLabel="Soft Signal used"
            />
          </View>
          <View style={styles.rowBetween}>
            <Body>Would do again</Body>
            <Switch
              value={again}
              onValueChange={setAgain}
              accessibilityLabel="Would do again"
            />
          </View>
          <Button label="Save private debrief" onPress={() => void save()} />
        </Card>
        <Card>
          <Pressable
            onPress={() => setShowForbidden((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showForbidden }}
            accessibilityLabel="Anti-creep rules"
            accessibilityHint={showForbidden ? "Collapses the list" : "Expands the list"}
          >
            <Text style={styles.h}>
              Anti-creep rules {showForbidden ? "▾" : "▸"}
            </Text>
          </Pressable>
          {showForbidden
            ? DEBRIEF_FORBIDDEN.map((f) => (
                <Body key={f} muted>
                  ✕ {f}
                </Body>
              ))
            : (
              <Body muted>Tap to expand what we never store.</Body>
            )}
        </Card>
        {log.slice(0, 12).map((e) => (
          <Card key={e.id}>
            <Body>
              {e.title} · {e.source}
            </Body>
            <Body muted>
              reg {e.regulation ?? "—"} · {e.tags.join(", ")}
              {e.softSignalUsed ? " · SS" : ""}
              {e.again ? " · again" : ""}
            </Body>
            {e.worked ? <Body muted>Worked: {e.worked}</Body> : null}
          </Card>
        ))}
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 40 },
    h: { fontWeight: "800" as const, color: colors.ink, fontSize: 16 },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 12,
      color: colors.ink,
      backgroundColor: colors.cream,
      marginTop: 8,
    },
    row: { flexDirection: "row" as const, gap: 8, marginTop: 8 },
    rowWrap: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 6,
      marginTop: 8,
    },
    rowBetween: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginTop: 10,
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
