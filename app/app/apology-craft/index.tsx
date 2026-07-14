/** Apology Craft Simulator — practice repair language. Never auto-sent. */
import { useEffect, useState } from "react";
import { ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import {
  APOLOGY_ANTI_PATTERNS,
  canSealApology,
  defaultApologyDraft,
  sealApology,
  summarizeApology,
  type ApologyDraft,
  type ApologySnapshot,
} from "../../lib/apologyCraftCore";
import { apologyCraftStore } from "../../services/apologyCraftStore";
import { softSignalService } from "../../services/softSignalService";
import { relationshipModelStore } from "../../services/relationshipModelStore";
import { BondMapBanner } from "../../components/BondMapBanner";
import type { RelationshipModel } from "../../lib/relationshipModelCore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

export default function ApologyCraftScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [draft, setDraft] = useState<ApologyDraft>(defaultApologyDraft());
  const [snap, setSnap] = useState<ApologySnapshot | null>(null);
  const [soft, setSoft] = useState<"idle" | "stopping" | "stopped">("idle");
  const [relModel, setRelModel] = useState<RelationshipModel | null>(null);
  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    scrapped: 0,
    soft_signal: 0,
  });

  useEffect(() => {
    void apologyCraftStore.load().then((h) => setSummary(summarizeApology(h)));
    void relationshipModelStore.load().then((b) => {
      if (b?.model) setRelModel(b.model);
    });
  }, [snap]);

  const gate = canSealApology(draft);

  const seal = () => {
    const s = sealApology(draft);
    if (!s) return;
    setSnap(s);
  };

  const finish = async (
    endReason: "completed" | "soft_signal" | "scrapped",
  ) => {
    if (!snap) return;
    await apologyCraftStore.append({
      snapshot: snap,
      endedAt: new Date().toISOString(),
      endReason,
      note: "",
    });
    setSnap(null);
    setDraft(defaultApologyDraft());
  };

  if (snap) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>APOLOGY CRAFT · DRAFT</Eyebrow>
          <Title>Composed line (not sent)</Title>
          <Card>
            <Text style={styles.script}>{snap.composedLine}</Text>
            <Body muted>
              This never auto-sends. Soft Signal free to scrap it forever.
            </Body>
          </Card>
          <SoftSignalButton
            state={soft}
            onPress={async () => {
              setSoft("stopping");
              await softSignalService.practice();
              setSoft("stopped");
              await finish("soft_signal");
            }}
          />
          <Button
            label="Save draft · I may use it later"
            onPress={() => void finish("completed")}
          />
          <Button
            variant="secondary"
            label="Scrap (valid win)"
            onPress={() => void finish("scrapped")}
          />
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
        <Eyebrow>APOLOGY CRAFT</Eyebrow>
        <Title>Impact + slice. Not self-annihilation.</Title>
        <Body muted>
          Practice only. Never auto-sent. {summary.total} drafts · completed{" "}
          {summary.completed} · scrapped {summary.scrapped}
        </Body>
        <BondMapBanner
          model={relModel}
          onOpenModel={() => router.push("/relationship-model" as never)}
        />
        <Card>
          <Text style={styles.h}>Anti-patterns</Text>
          {APOLOGY_ANTI_PATTERNS.map((p) => (
            <Body key={p} muted>
              ✕ {p}
            </Body>
          ))}
        </Card>
        <TextInput
          style={styles.input}
          placeholder="Impact I see (one sentence)"
          placeholderTextColor={colors.muted}
          value={draft.impact}
          onChangeText={(t) => setDraft({ ...draft, impact: t })}
        />
        <TextInput
          style={styles.input}
          placeholder="My slice only (not the whole weather)"
          placeholderTextColor={colors.muted}
          value={draft.mySlice}
          onChangeText={(t) => setDraft({ ...draft, mySlice: t })}
        />
        <TextInput
          style={styles.input}
          placeholder="What I'm not doing (optional)"
          placeholderTextColor={colors.muted}
          value={draft.notDoing}
          onChangeText={(t) => setDraft({ ...draft, notDoing: t })}
        />
        <TextInput
          style={styles.input}
          placeholder="Repair offer (optional)"
          placeholderTextColor={colors.muted}
          value={draft.repairOffer}
          onChangeText={(t) => setDraft({ ...draft, repairOffer: t })}
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
        {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
        <Button label="Compose apology draft" onPress={seal} disabled={!gate.ok} />
        <Button
          variant="secondary"
          label="Reconcile archetypes"
          onPress={() => router.push("/reconcile" as never)}
        />
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 40 },
    h: { fontWeight: "800" as const, color: colors.ink, fontSize: 16, marginBottom: 6 },
    script: {
      fontSize: 17,
      fontWeight: "600" as const,
      color: colors.ink,
      lineHeight: 26,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      minHeight: 56,
    },
    rowBetween: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
    },
  };
}
