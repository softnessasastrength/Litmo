import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { snapshot } from "../../data/mock";
import { colors } from "../../theme";

export default function ConsentSnapshotScreen() {
  const router = useRouter();
  const [decision, setDecision] = useState("");
  return (
    <Screen>
      <Eyebrow>MOCK CONSENT SNAPSHOT</Eyebrow>
      <Title>Read every boundary before you agree.</Title>
      <Body>
        This is the most restrictive overlap of both mock profiles. A match and
        a Vibe Profile do not grant consent.
      </Body>
      <Card style={styles.snapshot}>
        {snapshot.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </Card>
      <View accessibilityRole="radiogroup" style={styles.decisions}>
        <Choice
          label="Yes, this matches what I agree to now"
          selected={decision === "yes"}
          onPress={() => setDecision("yes")}
        />
        <Choice
          label="No, I want to change or stop"
          selected={decision === "no"}
          onPress={() => setDecision("no")}
        />
      </View>
      {decision === "no" ? (
        <View style={styles.stop}>
          <Text style={styles.stopTitle}>Nothing moves forward.</Text>
          <Text style={styles.stopBody}>
            You never owe an explanation. In this prototype, you can return and
            choose another path.
          </Text>
        </View>
      ) : null}
      <Button
        label="Confirm this mock snapshot"
        disabled={decision !== "yes"}
        onPress={() => router.push("/session/active")}
      />
      <Body muted center>
        In a real Litmo session, each person would confirm independently. This
        prototype simulates both confirmations.
      </Body>
    </Screen>
  );
}
const styles = StyleSheet.create({
  snapshot: { gap: 0 },
  row: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  value: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 4,
    fontWeight: "600",
  },
  decisions: { gap: 10 },
  stop: { padding: 16, borderRadius: 16, backgroundColor: colors.signalSoft },
  stopTitle: { color: colors.signal, fontWeight: "800" },
  stopBody: { color: colors.ink, lineHeight: 21, marginTop: 4 },
});
