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
import { masochistModeStore } from "../../services/masochistModeStore";
import {
  masochistBanner,
  wantsDenserRitual,
  type MasochistPrefs,
  defaultMasochistPrefs,
} from "../../lib/masochistModeCore";
import { relationshipModelStore } from "../../services/relationshipModelStore";
import {
  modelBannerLine,
  setPhase as setBondPhase,
  type RelationshipEvent,
  type RelationshipModel,
} from "../../lib/relationshipModelCore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

/**
 * WHAT: Post-fight repair sim screen with optional bond-map phase nudge.
 * WHY: Practice repair locally; when a full sim completes while bond phase is
 *      repair_needed, mark the map toward steady so exile-math has a structure.
 * CONSENT: Sim is practice only — never contact, never consent, never a score.
 * EDGE CASES:
 *   - Soft Signal end → never force bond phase (freeness outranks optimization)
 *   - No model / non-repair_needed phase → leave map untouched
 * NEVER: Treat complete as proof partner is safe, repaired, or consented.
 * SEE: docs/RELATIONSHIP_MODEL.md
 */
export default function ReconcileScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [phase, setUiPhase] = useState<"hub" | "run">("hub");
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
  const [relModel, setRelModel] = useState<RelationshipModel | null>(null);
  const [relEvents, setRelEvents] = useState<RelationshipEvent[]>([]);

  useEffect(() => {
    void reconcileStore.load().then((h) => setSummary(summarizeReconcile(h)));
    void masochistModeStore.load().then(setMPrefs);
    void relationshipModelStore.load().then((b) => {
      if (b) {
        setRelModel(b.model);
        setRelEvents(b.events);
      }
    });
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
    setUiPhase("run");
  };

  /**
   * WHAT: Persist sim history and optionally nudge bond phase after full repair.
   * WHY: Completing practice while map says repair_needed can leave exile-math;
   *      Soft Signal abort must not rewrite the map (freeness > optimization).
   * CONSENT: Local practice log only — never sends, never seals consent.
   * EDGE CASES:
   *   - endReason soft_signal → append history, no setBondPhase
   *   - completed + repair_needed → setBondPhase steady + save
   *   - completed + other phase / no model → history only
   * NEVER: Infer partner repair, safety, or consent from this call.
   */
  const finish = async (endReason: "completed" | "soft_signal") => {
    if (!snap || !arch) return;
    await reconcileStore.append({
      snapshot: snap,
      stepsDone: step + 1,
      endedAt: new Date().toISOString(),
      endReason,
      note: arch.sampleLine,
    });
    // Fail-closed on Soft Signal: freeness never reduced by map optimization.
    if (
      endReason === "completed" &&
      relModel &&
      relModel.phase === "repair_needed"
    ) {
      const { model: next, event } = setBondPhase(relModel, "steady");
      const evts = [event, ...relEvents].slice(0, 100);
      await relationshipModelStore.saveModel(next, evts);
      setRelModel(next);
      setRelEvents(evts);
    }
    setUiPhase("hub");
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
        {relModel ? (
          <Card>
            <Body muted>Bond map: {modelBannerLine(relModel)}</Body>
            <Body muted>
              Complete repair (not Soft Signal) while phase is repair_needed →
              steady. Soft Signal freeness unchanged.
            </Body>
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
        <Button
          variant="secondary"
          label="Relationship Model"
          onPress={() => router.push("/relationship-model" as never)}
        />
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
