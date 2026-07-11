import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Body, Button, Card, Eyebrow, FadeIn, Screen, Title } from "../components/ui";
import { colors } from "../theme";

export default function EntryScreen() {
  const router = useRouter();

  return (
    <Screen style={styles.screen}>
      <FadeIn>
        <View style={styles.heading}>
          <Eyebrow>Choose how to enter</Eyebrow>
          <Title>Explore Litmo honestly.</Title>
          <Body muted>
            This build is a local prototype. Demo mode uses fictional adults and
            does not create an account, verify identity, or connect you with a
            real person.
          </Body>
        </View>
      </FadeIn>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Demo mode</Text>
        <Body>
          Walk through Touch Language onboarding, boundaries, discovery,
          consent, a practice session, Soft Signal, and private wrap-up.
        </Body>
        <View style={styles.notice} accessible accessibilityRole="text">
          <Text style={styles.noticeTitle}>Important</Text>
          <Text style={styles.noticeBody}>
            Compatibility and trust examples are educational signals only. They
            do not establish consent or prove that anyone is safe.
          </Text>
        </View>
        <Button
          label="Enter the fictional demo"
          onPress={() => router.replace("/onboarding/quiz")}
          accessibilityHint="Starts the Litmo prototype with fictional local data"
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Account sign-in</Text>
        <Body muted>
          Real accounts and persistent Supabase authentication are part of the
          current foundation chapter and are not enabled in this prototype yet.
        </Body>
        <Button
          label="Sign-in is not available yet"
          onPress={() => undefined}
          disabled
          variant="secondary"
          accessibilityHint="Account sign-in is not available in this prototype"
        />
      </Card>

      <Text style={styles.footer}>
        For consenting adults. Non-sexual, platonic connection only. Consent is
        specific, mutual, and revocable at any moment.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 32 },
  heading: { gap: 14, marginBottom: 6 },
  card: { gap: 16 },
  cardTitle: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 26,
    fontWeight: "600",
  },
  notice: {
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: colors.apricot,
    backgroundColor: colors.cream,
    padding: 14,
  },
  noticeTitle: { color: colors.ink, fontWeight: "800", fontSize: 14 },
  noticeBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  footer: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
  },
});
