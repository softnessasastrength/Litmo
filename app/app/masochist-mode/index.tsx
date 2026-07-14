/** Emotional Masochist Mode toggle — denser rituals, Soft Signal still free. v0.2 */
import { useEffect, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import {
  MASOCHIST_INVARIANTS,
  defaultMasochistPrefs,
  intensityLabel,
  masochistBanner,
  ritualDensity,
  softSignalStillFree,
  type MasochistPrefs,
} from "../../lib/masochistModeCore";
import { masochistModeStore } from "../../services/masochistModeStore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import type { AppColors } from "../../theme";

export default function MasochistModeScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [prefs, setPrefs] = useState<MasochistPrefs>(defaultMasochistPrefs());

  useEffect(() => {
    void masochistModeStore.load().then(setPrefs);
  }, []);

  const save = async (next: MasochistPrefs) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    setPrefs(stamped);
    await masochistModeStore.save(stamped);
  };

  const banner = masochistBanner(prefs);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>EMOTIONAL MASOCHIST MODE v0.2</Eyebrow>
        <Title>Make everything denser. Soft Signal still free.</Title>
        <Body muted>
          Turns containment into ceremony: longer scripts, optional Edge bias,
          ceremonial copy. Soft Signal freeness is a hard invariant (
          {String(softSignalStillFree(prefs))}).
        </Body>
        {banner ? (
          <Card>
            <Body>{banner}</Body>
            <Body muted>
              Intensity: {intensityLabel(prefs)} · density ×
              {ritualDensity(prefs).toFixed(1)}
            </Body>
          </Card>
        ) : (
          <Card>
            <Body muted>
              Mode off · intensity baseline · Soft Signal free either way
            </Body>
          </Card>
        )}
        <Card>
          <View style={styles.row}>
            <Body>Enable Masochist Mode</Body>
            <Switch
              value={prefs.enabled}
              onValueChange={(v) => void save({ ...prefs, enabled: v })}
              accessibilityLabel="Enable Emotional Masochist Mode"
            />
          </View>
          <View style={[styles.row, styles.mt]}>
            <Body>Denser scripts (reconcile etc.)</Body>
            <Switch
              value={prefs.denserScripts}
              onValueChange={(v) => void save({ ...prefs, denserScripts: v })}
              accessibilityLabel="Denser scripts"
            />
          </View>
          <View style={[styles.row, styles.mt]}>
            <Body>Prefer Edge paths (where they exist)</Body>
            <Switch
              value={prefs.preferEdge}
              onValueChange={(v) => void save({ ...prefs, preferEdge: v })}
              accessibilityLabel="Prefer Edge paths"
            />
          </View>
          <View style={[styles.row, styles.mt]}>
            <Body>Ceremonial copy</Body>
            <Switch
              value={prefs.ceremonialCopy}
              onValueChange={(v) => void save({ ...prefs, ceremonialCopy: v })}
              accessibilityLabel="Ceremonial copy"
            />
          </View>
          <View style={[styles.row, styles.mt]}>
            <Body>Intensity as regulation (self-aware)</Body>
            <Switch
              value={prefs.intensityAsRegulation}
              onValueChange={(v) =>
                void save({ ...prefs, intensityAsRegulation: v })
              }
              accessibilityLabel="Intensity as regulation"
            />
          </View>
        </Card>
        <Card>
          <Text style={styles.h}>Hard invariants</Text>
          {MASOCHIST_INVARIANTS.map((line) => (
            <Body key={line} muted>
              · {line}
            </Body>
          ))}
        </Card>
        <Body muted>
          Self-aware: you may be choosing intensity as regulation. That is
          allowed. Turning this off is always Soft Signal free. Wired into
          Reconcile denser steps and Parallel ceremonial copy.
        </Body>
        <Button
          variant="secondary"
          label="Back to hub"
          onPress={() => router.push("/containment" as never)}
        />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 40 },
    row: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      gap: 12,
    },
    mt: { marginTop: 12 },
    h: {
      fontWeight: "800" as const,
      color: colors.ink,
      fontSize: 16,
      marginBottom: 8,
    },
  };
}
