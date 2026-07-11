import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { colors } from "../../theme";

export default function SessionWrapUpScreen() {
  const router = useRouter();
  const { ended } = useLocalSearchParams<{ ended?: string }>();
  const [outcome, setOutcome] = useState("");
  return (
    <Screen>
      <Eyebrow>PRIVATE MOCK WRAP-UP</Eyebrow>
      <Title>The session has ended.</Title>
      <Body>
        {ended === "soft-signal"
          ? "Soft Signal ended the session immediately. You do not need to explain why."
          : "You ended the session together."}
      </Body>
      <View style={styles.question}>
        <Text style={styles.questionText}>
          How did this interaction feel for you?
        </Text>
        <View accessibilityRole="radiogroup" style={styles.options}>
          <Choice
            label="Felt good"
            detail="I felt respected and comfortable"
            selected={outcome === "good"}
            onPress={() => setOutcome("good")}
          />
          <Choice
            label="Felt neutral"
            detail="Nothing to reward or punish"
            selected={outcome === "neutral"}
            onPress={() => setOutcome("neutral")}
          />
          <Choice
            label="Felt uncomfortable"
            detail="Keep this private and offer support"
            selected={outcome === "uncomfortable"}
            onPress={() => setOutcome("uncomfortable")}
          />
        </View>
      </View>
      {outcome === "uncomfortable" ? (
        <View style={styles.support}>
          <Text style={styles.supportTitle}>Your comfort matters.</Text>
          <Text style={styles.supportBody}>
            A production system would privately offer reporting and support
            options for human review. This prototype stores nothing.
          </Text>
        </View>
      ) : null}
      <Body muted>
        Your response is private. It does not create a public rating or certify
        another person as safe.
      </Body>
      <Button
        label="Save mock reflection"
        disabled={!outcome}
        onPress={() => router.push("/profile/trust-ledger")}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  question: { gap: 14, marginTop: 18 },
  questionText: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 26,
    lineHeight: 32,
  },
  options: { gap: 10 },
  support: {
    backgroundColor: colors.signalSoft,
    padding: 18,
    borderRadius: 18,
  },
  supportTitle: { color: colors.signal, fontWeight: "800", fontSize: 16 },
  supportBody: { color: colors.ink, lineHeight: 21, marginTop: 5 },
});
