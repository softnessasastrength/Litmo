/** Post-Fight Reconciliation Simulator — 5 repair archetypes. */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import {
  REPAIR_ARCHETYPES,
  canSealReconcile,
  findArchetype,
  sealReconcile,
  summarizeReconcile,
  type ReconcileDraft,
  type ReconcileSnapshot,
  type RepairArchetypeId,
} from "../../lib/reconcileCore";
import { reconcileStore } from "../../services/reconcileStore";
import { softSignalService } from "../../services/softSignalService";
import { privateDebriefStore } from "../../services/privateDebriefStore";
import { createManualDebrief } from "../../lib/privateDebriefCore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

export default function ReconcileScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setPhase] = useState<"hub" | "run" | "done">("hub");
  const [draft, setDraft] = useState<ReconcileDraft>({
    archetypeId: "undecided",
    fightNote: "",
    softSignalAcknowledged: false,
  });
  const [snap, setSnap] = useState<ReconcileSnapshot | null>(null);
  const [step, setStep] = useState(0);
  const [soft, setSoft] = useState<"idle" | "stopping" | "stopped">("idle");
  const [summary, setSummary] = useState({ total: 0, soft_signal: 0, by_archetype: [] as { id: string; count: number; label: string }[] });

  useEffect(() => {
    void reconcileStore.load().then((h) => setSummary(summarizeReconcile(h)));
  }, [phase]);

  const arch = snap ? findArchetype(snap.archetypeId) : null;
  const gate = canSealReconcile(draft);

  const start = () => {
    const s = sealReconcile(draft);
    if (!s) return;
    setSnap(s);
    setStep(0);
    setPhase("run");
  };

  const finish = async (endReason: "completed" | "soft_signal") => {
    if (!snap || !arch) return;
    await reconcileStore.append({
      snapshot: snap,
      stepsDone: step + 1,
      endedAt: new Date().toISOString(),
      endReason,
      note: "",
    });
    await privateDebriefStore.append(
      createManualDebrief({
        title: `Reconcile: ${arch.label}`,
        regulation: endReason === "soft_signal" ? 3 : 4,
        worked: arch.sampleLine,
        didnt: "",
        tags: ["repair", "conflict"],
        softSignalUsed: endReason === "soft_signal",
        source: "reconcile",
      }),
    );
    setPhase("hub");
    setSnap(null);
    setDraft({ archetypeId: "undecided", fightNote: "", softSignalAcknowledged: false });
  };

  if (phase === "run" && snap && arch) {
    const line = arch.steps[step] ?? arch.steps[0]!;
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>RECONCILE · {arch.label.toUpperCase()}</Eyebrow>
          <Title>{arch.label}</Title>
          <Card>
            <Body muted>Fight note: {snap.fightNote}</Body>
            <Text style={styles.script}>{line}</Text>
            <Body muted>
              Step {step + 1}/{arch.steps.length}
            </Body>
            <Body muted>Sample: {arch.sampleLine}</Body>
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
            label={step < arch.steps.length - 1 ? "Next step" : "Complete repair sim"}
            onPress={() => {
              if (step < arch.steps.length - 1) setStep((s) => s + 1);
              else void finish("completed");
            }}
          />
          <Button variant="secondary" label="Hub" onPress={() => router.push("/containment" as never)} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>POST-FIGHT RECONCILIATION</Eyebrow>
        <Title>5 repair archetypes.</Title>
        <Body muted>
          Practice only. Soft Signal free. {summary.total} sims · Soft Signal{" "}
          {summary.soft_signal}
        </Body>
        {REPAIR_ARCHETYPES.filter((a) => a.id !== "undecided").map((a) => (
          <Pressable
            key={a.id}
            onPress={() => setDraft({ ...draft, archetypeId: a.id as RepairArchetypeId })}
            style={[styles.card, draft.archetypeId === a.id && { borderColor: colors.moss }]}
          >
            <Text style={styles.h}>{a.label}</Text>
            <Body muted>{a.blurb}</Body>
          </Pressable>
        ))}
        <TextInput
          style={styles.input}
          placeholder="What was the fight about (short)?"
          placeholderTextColor={colors.muted}
          value={draft.fightNote}
          onChangeText={(t) => setDraft({ ...draft, fightNote: t })}
        />
        <View style={styles.row}>
          <Body>Soft Signal free</Body>
          <Switch
            value={draft.softSignalAcknowledged}
            onValueChange={(v) => setDraft({ ...draft, softSignalAcknowledged: v })}
          />
        </View>
        {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
        <Button label="Start repair sim" onPress={start} disabled={!gate.ok} />
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 40 },
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 12,
      backgroundColor: colors.cream,
    },
    h: { fontWeight: "800" as const, color: colors.ink, fontSize: 16 },
    script: { fontSize: 18, fontWeight: "600" as const, color: colors.ink, marginVertical: 12 },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      minHeight: 60,
    },
    row: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const },
  };
}
