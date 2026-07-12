import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { colors } from "../../theme";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { emergencyStopService } from "../../services/emergencyStopService";

export default function ActiveSessionScreen() {
  return (
    <SensitiveAccessGate>
      <ActiveSessionContent />
    </SensitiveAccessGate>
  );
}

function ActiveSessionContent() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [seconds, setSeconds] = useState(0);
  const [ended, setEnded] = useState(false);
  const [stopState, setStopState] = useState<"idle" | "stopping" | "pending">(
    "idle",
  );
  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [ended]);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const stop = async () => {
    setEnded(true);
    setStopState("stopping");
    let pendingSync = false;
    if (sessionId) {
      const result = await emergencyStopService.stop(sessionId);
      if (result.status === "stopped_pending_sync") {
        pendingSync = true;
        setStopState("pending");
      }
    }
    router.replace({
      pathname: "/session/wrap-up",
      params: { ended: pendingSync ? "pending-sync" : "soft-signal" },
    });
  };
  return (
    <Screen scroll={false} style={styles.screen}>
      <View>
        <Eyebrow>SIMULATED ACTIVE SESSION</Eyebrow>
        <Title>You’re both here.</Title>
        <Body muted>
          Keep noticing yourself. Agreement can change at any moment.
        </Body>
      </View>
      <View
        accessible
        accessibilityLabel={`Session timer ${time}`}
        style={styles.timerWrap}
      >
        <Text style={styles.timer}>{time}</Text>
        <Text style={styles.timerLabel}>ELAPSED · MOCK TIMER</Text>
      </View>
      <Card>
        <Text style={styles.prompt}>A gentle check-in</Text>
        <Body>Are your breath, shoulders, and attention still saying yes?</Body>
      </Card>
      <View style={styles.controls}>
        <Button
          variant="signal"
          label={
            stopState === "stopping" ? "Stopping…" : "Emergency stop — end now"
          }
          disabled={ended}
          onPress={() => void stop()}
          accessibilityHint="Immediately ends the simulated session without requiring an explanation"
        />
        <Text style={styles.explain}>
          No explanation needed. Using Soft Signal carries no penalty.
        </Text>
        <Button
          variant="secondary"
          label="End together"
          onPress={() => {
            setEnded(true);
            router.replace({
              pathname: "/session/wrap-up",
              params: { ended: "together" },
            });
          }}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { justifyContent: "space-between" },
  timerWrap: { alignItems: "center" },
  timer: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 66,
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "800",
  },
  prompt: { color: colors.plum, fontWeight: "800", marginBottom: 7 },
  controls: { gap: 12 },
  explain: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
