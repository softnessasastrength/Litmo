import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { touchOptions } from "../../data/mock";
import { usePrototype } from "../../context/PrototypeContext";
import { colors } from "../../theme";

export default function TouchLanguageScreen() {
  const router = useRouter();
  const { touchChoices, setTouchChoice } = usePrototype();
  const groups = [
    {
      key: "pressure",
      title: "What kind of pressure tends to feel kind?",
      choices: touchOptions.pressure,
    },
    {
      key: "duration",
      title: "How long sounds comfortable?",
      choices: touchOptions.duration,
    },
    {
      key: "environment",
      title: "Where might your system settle easiest?",
      choices: touchOptions.environment,
    },
  ] as const;
  const complete = groups.every((group) => touchChoices[group.key]);
  return (
    <Screen>
      <Eyebrow>TOUCH LANGUAGE</Eyebrow>
      <Title>Preferences are a starting point.</Title>
      <Body muted>
        Choose what sounds welcoming today. You can always ask, decline, or
        change your mind later.
      </Body>
      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={styles.question}>{group.title}</Text>
          <View accessibilityRole="radiogroup" style={styles.choices}>
            {group.choices.map((choice) => (
              <Choice
                key={choice}
                label={choice}
                selected={touchChoices[group.key] === choice}
                onPress={() => setTouchChoice(group.key, choice)}
              />
            ))}
          </View>
        </View>
      ))}
      <View style={styles.safety}>
        <Text style={styles.safetyTitle}>Your profile is not consent.</Text>
        <Text style={styles.safetyBody}>
          It helps begin a conversation. Every session still requires a new,
          explicit agreement.
        </Text>
      </View>
      <Button
        label="Meet the mock community"
        disabled={!complete}
        onPress={() => router.push("/match/discover")}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  group: { gap: 12, marginTop: 12 },
  question: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 23,
    lineHeight: 29,
  },
  choices: { gap: 9 },
  safety: {
    backgroundColor: colors.plumSoft,
    borderRadius: 18,
    padding: 18,
    gap: 5,
  },
  safetyTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  safetyBody: { color: colors.muted, lineHeight: 21 },
});
