/** Nervous System Weather — daily local check-in. */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import {
  canSealWeather,
  defaultWeatherDraft,
  sealWeather,
  summarizeWeather,
  weatherSuggestions,
  type WeatherDraft,
  type WeatherSnapshot,
} from "../../lib/weatherCore";
import { weatherStore } from "../../services/weatherStore";
import { softSignalService } from "../../services/softSignalService";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

function Axis({
  label,
  value,
  onChange,
  colors,
  styles,
}: {
  label: string;
  value: 1 | 2 | 3 | 4 | 5 | null;
  onChange: (n: 1 | 2 | 3 | 4 | 5) => void;
  colors: AppColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View>
      <Body>{label}</Body>
      <View style={styles.row}>
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[
              styles.chip,
              value === n && {
                borderColor: colors.moss,
                backgroundColor: colors.mossSoft,
              },
            ]}
            accessibilityLabel={`${label} ${n}`}
          >
            <Text style={{ color: colors.ink }}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function WeatherScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [draft, setDraft] = useState<WeatherDraft>(defaultWeatherDraft());
  const [snap, setSnap] = useState<WeatherSnapshot | null>(null);
  const [soft, setSoft] = useState<"idle" | "stopping" | "stopped">("idle");
  const [summary, setSummary] = useState({
    total: 0,
    avg_anxiety: null as number | null,
    avg_capacity: null as number | null,
    last_sky: null as string | null,
  });

  useEffect(() => {
    void weatherStore.load().then((h) => setSummary(summarizeWeather(h)));
  }, [snap]);

  const gate = canSealWeather(draft);

  const seal = () => {
    const s = sealWeather(draft);
    if (!s) return;
    setSnap(s);
  };

  const finish = async (endReason: "completed" | "soft_signal") => {
    if (!snap) return;
    await weatherStore.append({
      snapshot: snap,
      endedAt: new Date().toISOString(),
      endReason,
    });
    setSnap(null);
    setDraft(defaultWeatherDraft());
  };

  if (snap) {
    const suggestions = weatherSuggestions(snap);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>NERVOUS SYSTEM WEATHER</Eyebrow>
          <Title>{snap.skyLabel}</Title>
          <Card>
            <Body>
              Energy {snap.energy} · Anxiety {snap.anxiety} · Attachment heat{" "}
              {snap.attachmentHeat} · Capacity for others {snap.capacityForOthers}
            </Body>
            {snap.note ? <Body muted>{snap.note}</Body> : null}
          </Card>
          <Text style={styles.h}>Suggested from this sky</Text>
          {suggestions.map((href) => (
            <Button
              key={href}
              variant="secondary"
              label={href}
              onPress={() => router.push(href as never)}
            />
          ))}
          <SoftSignalButton
            state={soft}
            onPress={async () => {
              setSoft("stopping");
              await softSignalService.practice();
              setSoft("stopped");
              await finish("soft_signal");
            }}
          />
          <Button label="Log weather · done" onPress={() => void finish("completed")} />
          <Button
            variant="secondary"
            label="Hub"
            onPress={() => router.push("/containment" as never)}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>NERVOUS SYSTEM WEATHER</Eyebrow>
        <Title>Name the sky before it becomes a person&apos;s job.</Title>
        <Body muted>
          Local only. Not clinical. Soft Signal free. {summary.total} check-ins
          {summary.last_sky ? ` · last: ${summary.last_sky}` : ""}
          {summary.avg_anxiety != null
            ? ` · avg anxiety ${summary.avg_anxiety}`
            : ""}
        </Body>
        <Card>
          <Axis
            label="Energy (1 low → 5 high)"
            value={draft.energy}
            onChange={(n) => setDraft({ ...draft, energy: n })}
            colors={colors}
            styles={styles}
          />
          <Axis
            label="Anxiety (1 calm → 5 high)"
            value={draft.anxiety}
            onChange={(n) => setDraft({ ...draft, anxiety: n })}
            colors={colors}
            styles={styles}
          />
          <Axis
            label="Attachment heat (1 cool → 5 hot)"
            value={draft.attachmentHeat}
            onChange={(n) => setDraft({ ...draft, attachmentHeat: n })}
            colors={colors}
            styles={styles}
          />
          <Axis
            label="Capacity for others (1 none → 5 open)"
            value={draft.capacityForOthers}
            onChange={(n) => setDraft({ ...draft, capacityForOthers: n })}
            colors={colors}
            styles={styles}
          />
          <TextInput
            style={styles.input}
            placeholder="Optional note (never auto-sent)"
            placeholderTextColor={colors.muted}
            value={draft.note}
            onChangeText={(t) => setDraft({ ...draft, note: t })}
          />
          <View style={styles.rowBetween}>
            <Body>Soft Signal free</Body>
            <Switch
              value={draft.softSignalAcknowledged}
              onValueChange={(v) =>
                setDraft({ ...draft, softSignalAcknowledged: v })
              }
            />
          </View>
        </Card>
        {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
        <Button label="Read the sky" onPress={seal} disabled={!gate.ok} />
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 40 },
    h: { fontWeight: "800" as const, color: colors.ink, fontSize: 16 },
    row: {
      flexDirection: "row" as const,
      gap: 8,
      marginVertical: 8,
      flexWrap: "wrap" as const,
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
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.cream,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      marginTop: 8,
    },
  };
}
