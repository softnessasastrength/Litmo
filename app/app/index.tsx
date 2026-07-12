import { useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
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
          label="Explore the prototype"
          onPress={() => router.push("/entry")}
          accessibilityHint="Opens options for entering the Litmo prototype"
        />
        <Text style={styles.caption}>
          A tap-through prototype using imaginary people and local data. No real
          account or connection is created.
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityHint="Opens softnessasastrength.com in your browser"
          onPress={() =>
            void Linking.openURL("https://softnessasastrength.com")
          }
          hitSlop={8}
        >
          <Text style={styles.link}>softnessasastrength.com</Text>
        </Pressable>
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
  link: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    textDecorationLine: "underline",
    marginTop: 2,
  },
});
