/** Emotional Masochist Mode toggle — denser rituals, Soft Signal still free. */
import { useEffect, useState } from "react";
import { ScrollView, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import {
  defaultMasochistPrefs,
  masochistBanner,
  type MasochistPrefs,
} from "../../lib/masochistModeCore";
import { masochistModeStore } from "../../services/masochistModeStore";

export default function MasochistModeScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<MasochistPrefs>(defaultMasochistPrefs());

  useEffect(() => {
    void masochistModeStore.load().then(setPrefs);
  }, []);

  const save = async (next: MasochistPrefs) => {
    setPrefs(next);
    await masochistModeStore.save(next);
  };

  const banner = masochistBanner(prefs);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <Eyebrow>EMOTIONAL MASOCHIST MODE</Eyebrow>
        <Title>Make everything denser. Soft Signal still free.</Title>
        <Body muted>
          Turns containment into ceremony: longer scripts preference, optional
          Edge bias, ceremonial copy. Never weakens Soft Signal freeness.
        </Body>
        {banner ? (
          <Card>
            <Body>{banner}</Body>
          </Card>
        ) : null}
        <Card>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Body>Enable Masochist Mode</Body>
            <Switch
              value={prefs.enabled}
              onValueChange={(v) => void save({ ...prefs, enabled: v })}
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <Body>Denser scripts</Body>
            <Switch
              value={prefs.denserScripts}
              onValueChange={(v) => void save({ ...prefs, denserScripts: v })}
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <Body>Prefer Edge paths (where they exist)</Body>
            <Switch
              value={prefs.preferEdge}
              onValueChange={(v) => void save({ ...prefs, preferEdge: v })}
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <Body>Ceremonial copy</Body>
            <Switch
              value={prefs.ceremonialCopy}
              onValueChange={(v) => void save({ ...prefs, ceremonialCopy: v })}
            />
          </View>
        </Card>
        <Body muted>
          This mode is self-aware: you may be choosing intensity as regulation.
          That is allowed. Soft Signal remains God Mode.
        </Body>
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
