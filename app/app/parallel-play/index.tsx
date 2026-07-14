/** Parallel Play But Make It Sacred — non-touch closeness. */
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import {
  PARALLEL_MODES,
  canSealParallel,
  findParallel,
  sealParallel,
  type ParallelModeId,
  type ParallelSnapshot,
} from "../../lib/parallelPlayCore";
import { parallelPlayStore } from "../../services/parallelPlayStore";
import { softSignalService } from "../../services/softSignalService";
import { privateDebriefStore } from "../../services/privateDebriefStore";
import { createManualDebrief } from "../../lib/privateDebriefCore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

export default function ParallelPlayScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [modeId, setModeId] = useState<ParallelModeId>("undecided");
  const [intention, setIntention] = useState("");
  const [ss, setSs] = useState(false);
  const [noTouch, setNoTouch] = useState(false);
  const [snap, setSnap] = useState<ParallelSnapshot | null>(null);
  const [active, setActive] = useState(false);
  const [soft, setSoft] = useState<"idle" | "stopping" | "stopped">("idle");

  const draft = {
    modeId,
    intention,
    softSignalAcknowledged: ss,
    noTouchAcknowledged: noTouch,
  };
  const gate = canSealParallel(draft);
  const mode = snap ? findParallel(snap.modeId) : null;

  const start = () => {
    const s = sealParallel(draft);
    if (!s) return;
    setSnap(s);
    setActive(true);
  };

  const end = async (endReason: "completed" | "soft_signal", felt: boolean) => {
    if (!snap) return;
    await parallelPlayStore.append({
      snapshot: snap,
      endedAt: new Date().toISOString(),
      endReason,
      feltConnected: felt,
      note: "",
    });
    await privateDebriefStore.append(
      createManualDebrief({
        title: `Parallel: ${findParallel(snap.modeId).label}`,
        regulation: felt ? 4 : 3,
        worked: findParallel(snap.modeId).sacredRule,
        didnt: "",
        tags: ["parallel"],
        softSignalUsed: endReason === "soft_signal",
        source: "parallel_play",
      }),
    );
    setActive(false);
    setSnap(null);
  };

  if (active && snap && mode) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>SACRED PARALLEL PLAY</Eyebrow>
          <Title>{mode.label}</Title>
          <Card>
            <Body>{mode.blurb}</Body>
            <Text style={styles.sacred}>{mode.sacredRule}</Text>
            <Body muted>
              Duration guide: {mode.minutes === "open" ? "open" : `${mode.minutes} min`}
            </Body>
            {snap.intention ? <Body muted>Intention: {snap.intention}</Body> : null}
          </Card>
          <SoftSignalButton
            state={soft}
            onPress={async () => {
              setSoft("stopping");
              await softSignalService.practice();
              setSoft("stopped");
              await end("soft_signal", false);
            }}
          />
          <Button label="Complete · felt connected" onPress={() => void end("completed", true)} />
          <Button
            variant="secondary"
            label="Complete · neutral"
            onPress={() => void end("completed", false)}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>PARALLEL PLAY</Eyebrow>
        <Title>But make it sacred.</Title>
        <Body muted>Non-touch closeness. Soft Signal free. Presence without performance.</Body>
        {PARALLEL_MODES.filter((m) => m.id !== "undecided").map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setModeId(m.id)}
            style={[styles.card, modeId === m.id && { borderColor: colors.moss }]}
          >
            <Text style={styles.h}>{m.label}</Text>
            <Body muted>{m.blurb}</Body>
            <Body muted>{m.sacredRule}</Body>
          </Pressable>
        ))}
        <TextInput
          style={styles.input}
          placeholder="Optional intention…"
          placeholderTextColor={colors.muted}
          value={intention}
          onChangeText={setIntention}
        />
        <View style={styles.row}>
          <Body>Non-touch unless separately sealed</Body>
          <Switch value={noTouch} onValueChange={setNoTouch} />
        </View>
        <View style={styles.row}>
          <Body>Soft Signal free</Body>
          <Switch value={ss} onValueChange={setSs} />
        </View>
        {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
        <Button label="Begin sacred parallel" onPress={start} disabled={!gate.ok} />
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
    sacred: {
      color: colors.moss,
      fontWeight: "700" as const,
      fontSize: 15,
      marginVertical: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
    },
    row: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      gap: 12,
    },
  };
}
