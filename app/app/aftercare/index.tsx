/** Aftercare Protocol — land the plane. Soft Signal free. */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import {
  AFTERCARE_MODES,
  canSealAftercare,
  findAftercare,
  resolveAftercareSteps,
  sealAftercare,
  summarizeAftercare,
  type AftercareDraft,
  type AftercareModeId,
  type AftercareSnapshot,
} from "../../lib/aftercareCore";
import { aftercareStore } from "../../services/aftercareStore";
import { softSignalService } from "../../services/softSignalService";
import { masochistModeStore } from "../../services/masochistModeStore";
import {
  defaultMasochistPrefs,
  masochistBanner,
  wantsDenserRitual,
  type MasochistPrefs,
} from "../../lib/masochistModeCore";
import { relationshipModelStore } from "../../services/relationshipModelStore";
import {
  aftercareModeFromPhase,
  modelBannerLine,
  type RelationshipModel,
} from "../../lib/relationshipModelCore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

export default function AftercareScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [draft, setDraft] = useState<AftercareDraft>({
    modeId: "undecided",
    softSignalAcknowledged: false,
    partnerLine: "",
  });
  const [snap, setSnap] = useState<AftercareSnapshot | null>(null);
  const [relModel, setRelModel] = useState<RelationshipModel | null>(null);
  const [modePrimed, setModePrimed] = useState(false);
  const [step, setStep] = useState(0);
  const [soft, setSoft] = useState<"idle" | "stopping" | "stopped">("idle");
  const [mPrefs, setMPrefs] = useState<MasochistPrefs>(defaultMasochistPrefs());
  const [summary, setSummary] = useState({ total: 0, soft_signal: 0, settled: 0 });

  useEffect(() => {
    void masochistModeStore.load().then(setMPrefs);
    void aftercareStore.load().then((h) => setSummary(summarizeAftercare(h)));
    void relationshipModelStore.load().then((b) => {
      if (!b?.model) return;
      setRelModel(b.model);
      if (!modePrimed) {
        const mode = aftercareModeFromPhase(b.model.phase);
        if (mode) setDraft((d) => ({ ...d, modeId: mode }));
        setModePrimed(true);
      }
    });
  }, [snap, modePrimed]);

  const denser = wantsDenserRitual(mPrefs);
  const banner = masochistBanner(mPrefs);
  const gate = canSealAftercare(draft);
  const mode = snap ? findAftercare(snap.modeId) : null;
  const steps =
    snap && mode ? resolveAftercareSteps(mode, snap.denser) : [];

  const start = () => {
    const s = sealAftercare(draft, denser);
    if (!s) return;
    setSnap(s);
    setStep(0);
  };

  const finish = async (
    endReason: "completed" | "soft_signal",
    feltSettled: boolean,
  ) => {
    if (!snap) return;
    await aftercareStore.append({
      snapshot: snap,
      stepsDone: step + 1,
      endedAt: new Date().toISOString(),
      endReason,
      feltSettled,
      note: "",
    });
    setSnap(null);
    setDraft({
      modeId: "undecided",
      softSignalAcknowledged: false,
      partnerLine: "",
    });
  };

  if (snap && mode) {
    const line = steps[step] ?? "Soft Signal free.";
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>
            AFTERCARE · {mode.label.toUpperCase()}
            {snap.denser ? " · DENSE" : ""}
          </Eyebrow>
          <Title>{mode.label}</Title>
          <Card>
            <Text style={styles.script}>{line}</Text>
            <Body muted>
              Step {step + 1}/{steps.length}
            </Body>
            {snap.partnerLine ? (
              <Body muted>Optional line (not sent): {snap.partnerLine}</Body>
            ) : null}
          </Card>
          <SoftSignalButton
            state={soft}
            onPress={async () => {
              setSoft("stopping");
              await softSignalService.practice();
              setSoft("stopped");
              await finish("soft_signal", false);
            }}
          />
          <Button
            label={
              step < steps.length - 1 ? "Next step" : "Complete · felt settled"
            }
            onPress={() => {
              if (step < steps.length - 1) setStep((s) => s + 1);
              else void finish("completed", true);
            }}
          />
          {step >= steps.length - 1 ? (
            <Button
              variant="secondary"
              label="Complete · still buzzing"
              onPress={() => void finish("completed", false)}
            />
          ) : null}
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
        <Eyebrow>AFTERCARE PROTOCOL</Eyebrow>
        <Title>Land the plane.</Title>
        <Body muted>
          Post-touch, post-conflict, post-flood, post-good-thing, post-build.
          Soft Signal free. {summary.total} runs · settled {summary.settled}
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
              Mode primed from phase when possible. Soft Signal free to pick another.
            </Body>
          </Card>
        ) : null}
        {AFTERCARE_MODES.filter((m) => m.id !== "undecided").map((m) => (
          <Pressable
            key={m.id}
            onPress={() =>
              setDraft({ ...draft, modeId: m.id as AftercareModeId })
            }
            style={[
              styles.card,
              draft.modeId === m.id && { borderColor: colors.moss },
            ]}
            accessibilityRole="button"
            accessibilityLabel={m.label}
          >
            <Text style={styles.h}>{m.label}</Text>
            <Body muted>{m.blurb}</Body>
          </Pressable>
        ))}
        <TextInput
          style={styles.input}
          placeholder="Optional partner line (never auto-sent)"
          placeholderTextColor={colors.muted}
          value={draft.partnerLine}
          onChangeText={(t) => setDraft({ ...draft, partnerLine: t })}
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
        <Button label="Begin aftercare" onPress={start} disabled={!gate.ok} />
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
    },
    rowBetween: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
    },
  };
}
