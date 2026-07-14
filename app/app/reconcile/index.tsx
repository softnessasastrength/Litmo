/** Post-Fight Reconciliation Simulator — 5 repair archetypes. v0.2 denser under masochist. */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import {
  REPAIR_ARCHETYPES,
  canSealReconcile,
  findArchetype,
  resolveReconcileSteps,
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
import { masochistModeStore } from "../../services/masochistModeStore";
import {
  masochistBanner,
  wantsDenserRitual,
  type MasochistPrefs,
  defaultMasochistPrefs,
} from "../../lib/masochistModeCore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

export default function ReconcileScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setPhase] = useState<"hub" | "run">("hub");
  const [draft, setDraft] = useState<ReconcileDraft>({
    archetypeId: "undecided",
    fightNote: "",
    softSignalAcknowledged: false,
  });
  const [snap, setSnap] = useState<ReconcileSnapshot | null>(null);
  const [step, setStep] = useState(0);
  const [soft, setSoft] = useState<"idle" | "stopping" | "stopped">("idle");
  const [summary, setSummary] = useState({
    total: 0,
    soft_signal: 0,
    by_archetype: [] as { id: string; count: number; label: string }[],
  });
  const [mPrefs, setMPrefs] = useState<MasochistPrefs>(defaultMasochistPrefs());

  useEffect(() => {
    void reconcileStore.load().then((h) => setSummary(summarizeReconcile(h)));
    void masochistModeStore.load().then(setMPrefs);
  }, [phase]);

  const arch = snap ? findArchetype(snap.archetypeId) : null;
  const steps =
    snap && arch ? resolveReconcileSteps(arch, snap.denser) : [];
  const gate = canSealReconcile(draft);
  const denser = wantsDenserRitual(mPrefs);
  const banner = masochistBanner(mPrefs);

  const start = () => {
    const s = sealReconcile(draft, denser);
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
        tags: ["repair", "conflict", ...(snap.denser ? ["ceremony"] : [])],
        softSignalUsed: endReason === "soft_signal",
        source: "reconcile",
        again: endReason === "completed",
      }),
    );
    setPhase("hub");
    setSnap(null);
    setDraft({
      archetypeId: "undecided",
      fightNote: "",
      softSignalAcknowledged: false,
    });
  };

  if (phase === "run" && snap && arch) {
    const line = steps[step] ?? steps[0] ?? "Soft Signal free.";
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>
            RECONCILE · {arch.label.toUpperCase()}
            {snap.denser ? " · DENSE" : ""}
          </Eyebrow>
          <Title>{arch.label}</Title>
          <Card>
            <Body muted>Fight note: {snap.fightNote}</Body>
            <Text style={styles.script}>{line}</Text>
            <Body muted>
              Step {step + 1}/{steps.length}
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
            label={
              step < steps.length - 1 ? "Next step" : "Complete repair sim"
            }
            onPress={() => {
              if (step < steps.length - 1) setStep((s) => s + 1);
              else void finish("completed");
            }}
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
        <Eyebrow>POST-FIGHT RECONCILIATION v0.2</Eyebrow>
        <Title>5 repair archetypes.</Title>
        <Body muted>
          Practice only. Soft Signal free. {summary.total} sims · Soft Signal{" "}
          {summary.soft_signal}
          {denser ? " · denser ritual armed" : ""}
        </Body>
        {banner ? (
          <Card>
            <Body>{banner}</Body>
          </Card>
        ) : null}
        {REPAIR_ARCHETYPES.filter((a) => a.id !== "undecided").map((a) => (
          <Pressable
            key={a.id}
            onPress={() =>
              setDraft({ ...draft, archetypeId: a.id as RepairArchetypeId })
            }
            style={[
              styles.card,
              draft.archetypeId === a.id && { borderColor: colors.moss },
            ]}
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            <Text style={styles.h}>{a.label}</Text>
            <Body muted>{a.blurb}</Body>
            <Body muted>When: {a.whenToUse}</Body>
            <Body muted>Not: {a.antiPattern}</Body>
          </Pressable>
        ))}
        <TextInput
          style={styles.input}
          placeholder="What was the fight about (short)?"
          placeholderTextColor={colors.muted}
          value={draft.fightNote}
          onChangeText={(t) => setDraft({ ...draft, fightNote: t })}
          accessibilityLabel="Fight note"
        />
        <View style={styles.row}>
          <Body>Soft Signal free</Body>
          <Switch
            value={draft.softSignalAcknowledged}
            onValueChange={(v) =>
              setDraft({ ...draft, softSignalAcknowledged: v })
            }
            accessibilityLabel="Acknowledge Soft Signal free"
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
      gap: 4,
    },
    h: { fontWeight: "800" as const, color: colors.ink, fontSize: 16 },
    script: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: colors.ink,
      marginVertical: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      minHeight: 60,
    },
    row: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
    },
  };
}
