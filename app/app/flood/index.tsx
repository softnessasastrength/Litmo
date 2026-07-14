/** Flood Protocol — minimum viable containment when language is gone. */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import {
  FLOOD_STEPS,
  createFloodEntry,
  summarizeFlood,
  type FloodStepId,
} from "../../lib/floodProtocolCore";
import { floodProtocolStore } from "../../services/floodProtocolStore";
import { softSignalService } from "../../services/softSignalService";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

export default function FloodProtocolScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [touched, setTouched] = useState<FloodStepId[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [soft, setSoft] = useState<"idle" | "stopping" | "stopped">("idle");
  const [summary, setSummary] = useState({ total: 0, soft_signal: 0, avg_steps: 0 });

  useEffect(() => {
    void floodProtocolStore.load().then((h) => setSummary(summarizeFlood(h)));
  }, [active]);

  const step = FLOOD_STEPS[stepIndex]!;

  const mark = (id: FloodStepId) => {
    setTouched((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const finish = async (endReason: "completed" | "soft_signal" | "abandoned") => {
    const entry = createFloodEntry(touched, endReason);
    await floodProtocolStore.append(entry);
    setActive(false);
    setTouched([]);
    setStepIndex(0);
  };

  if (active) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>FLOOD PROTOCOL · MINIMAL</Eyebrow>
          <Title>{step.label}</Title>
          <Card>
            <Text style={styles.script}>{step.script}</Text>
            <Body muted>
              Step {stepIndex + 1}/{FLOOD_STEPS.length}
            </Body>
          </Card>
          <SoftSignalButton
            state={soft}
            onPress={async () => {
              mark("soft_signal");
              setSoft("stopping");
              await softSignalService.practice();
              setSoft("stopped");
              await finish("soft_signal");
            }}
          />
          <Button
            label={
              stepIndex < FLOOD_STEPS.length - 1 ? "I did this · next" : "Done · quieter"
            }
            onPress={() => {
              mark(step.id);
              if (stepIndex < FLOOD_STEPS.length - 1) setStepIndex((i) => i + 1);
              else void finish("completed");
            }}
          />
          <Button
            variant="secondary"
            label="Skip to later map"
            onPress={() => {
              mark("later");
              void finish("completed");
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
        <Eyebrow>FLOOD PROTOCOL</Eyebrow>
        <Title>When language is gone.</Title>
        <Body muted>
          Minimum path. No essays. Soft Signal free. {summary.total} floods · Soft
          Signal {summary.soft_signal}
        </Body>
        <Card>
          <Body>
            Use this when Too Much, Conflict Sim, and Pre-Renn all feel like more
            words than you have. Six short steps. Partner not required. Partner not
            contacted.
          </Body>
        </Card>
        {FLOOD_STEPS.map((s) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.h}>{s.label}</Text>
            <Body muted>{s.script}</Body>
          </View>
        ))}
        <Button
          label="I'm flooded · start"
          onPress={() => {
            setActive(true);
            setStepIndex(0);
            setTouched([]);
          }}
        />
        <Pressable onPress={() => router.push("/pre-renn" as never)}>
          <Body muted>If you can still read: try Pre-Renn Gate →</Body>
        </Pressable>
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
    h: { fontWeight: "800" as const, color: colors.ink, fontSize: 15 },
    script: {
      fontSize: 20,
      fontWeight: "600" as const,
      color: colors.ink,
      marginVertical: 12,
      lineHeight: 28,
    },
  };
}
