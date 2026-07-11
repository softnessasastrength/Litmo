import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Body, Button, FadeIn, Screen } from "../components/ui";
import { colors } from "../theme";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <Screen scroll={false} style={styles.screen}>
      <FadeIn>
        <View style={styles.mark}>
          <Text style={styles.markText}>L</Text>
        </View>
        <View style={styles.hero}>
          <Text style={styles.kicker}>WELCOME TO LITMO</Text>
          <Text style={styles.title}>Connection can be soft.</Text>
          <Body muted>
            A playful place to learn your vibe, name your boundaries, and
            practice clear consent.
          </Body>
        </View>
      </FadeIn>
      <View style={styles.bottom}>
        <Button
          label="Begin with your vibe"
          onPress={() => router.push("/onboarding/quiz")}
          accessibilityHint="Starts the personality quiz"
        />
        <Text style={styles.caption}>
          A tap-through prototype using imaginary people and local data.
        </Text>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { justifyContent: "space-between", paddingTop: 40 },
  mark: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.plumSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  markText: { fontFamily: "Georgia", fontSize: 32, color: colors.plum },
  hero: { gap: 16, marginTop: 56 },
  kicker: {
    color: colors.moss,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.7,
  },
  title: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 52,
    lineHeight: 57,
    maxWidth: 330,
  },
  bottom: { gap: 16 },
  caption: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
