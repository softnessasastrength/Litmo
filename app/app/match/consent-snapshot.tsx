import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { computeCompatibility } from "@litmo/domain";
import {
  Body,
  Button,
  Card,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  mockConsentProfileVersion,
  mockSnapshotNow,
} from "../../data/mockConsentProfiles";
import { buildSnapshotRows } from "../../lib/consentSnapshotView";
import { scheduleDemoNotification } from "../../services/notifications";
import { colors } from "../../theme";

export default function ConsentSnapshotScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [decision, setDecision] = useState("");
  const rows = useMemo(() => {
    const result = computeCompatibility(
      mockConsentProfileVersion("self"),
      mockConsentProfileVersion(id ?? "maya"),
      mockSnapshotNow,
    );
    return buildSnapshotRows(result);
  }, [id]);
  return (
    <Screen>
      <Eyebrow>MOCK CONSENT SNAPSHOT</Eyebrow>
      <Title>Read every boundary before you agree.</Title>
      <Body>
        This is the live, directional overlap of two mock preference sets
        computed by the real consent engine. A match and a Vibe Profile do not
        grant consent.
      </Body>
      <Card style={styles.snapshot}>
        {rows.map((item) => (
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
        onPress={() => {
          void scheduleDemoNotification({
            title: "Litmo (demo)",
            body: "Your practice session is ready to begin.",
            secondsFromNow: 4,
          });
          router.push("/session/active");
        }}
      />
      <Body muted center>
        In a real Litmo session, each person would confirm independently. This
        prototype simulates both confirmations.
      </Body>
      <Body muted center>
        Confirming will ask for notification permission and send one real local
        notification a few seconds later, so you can see how session alerts will
        actually work — not just a mockup.
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
