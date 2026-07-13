import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  FadeIn,
  Screen,
  Title,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { fonts, type AppColors } from "../theme";
import { runtimeConfig } from "../config/runtime";
import { environmentError } from "../services/supabase";
import { useThemedStyles } from "../hooks/useThemedStyles";

export default function EntryScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { enterDemoMode } = useAuth();

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

      {runtimeConfig.allowDemo ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Demo mode</Text>
          <Body>
            Walk through Touch Language onboarding, boundaries, discovery,
            Quizzes (short or deep Vibe), consent, a practice session, Soft
            Signal, and private wrap-up.
          </Body>
          <View style={styles.notice} accessible accessibilityRole="text">
            <Text style={styles.noticeTitle}>Important</Text>
            <Text style={styles.noticeBody}>
              Compatibility, quizzes, and trust examples are educational signals
              only. They do not establish consent or prove that anyone is safe.
            </Text>
          </View>
          <Button
            label="Enter the fictional demo"
            onPress={() => {
              enterDemoMode();
              router.replace("/onboarding/about-you");
            }}
            accessibilityHint="Starts the Litmo prototype with fictional local data. No account is created and nothing is saved."
          />
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Account sign-in</Text>
        <Body muted>
          Sign in or create a real account. Your general profile, touch
          preferences, and consent boundaries persist across visits.
        </Body>
        {environmentError ? (
          <View style={styles.notice} accessible accessibilityRole="text">
            <Text style={styles.noticeTitle}>Local service not configured</Text>
            <Text style={styles.noticeBody}>
              Real accounts need a Supabase URL and anon key (see
              docs/LOCAL_DEVELOPMENT.md). Demo mode still works without them.
            </Text>
          </View>
        ) : null}
        <Button
          label="Sign in with an account"
          onPress={() => router.push("/auth/sign-in")}
          variant="secondary"
          accessibilityHint="Opens sign-in for a real, persistent account"
          disabled={Boolean(environmentError)}
        />
      </Card>

      <Text style={styles.footer}>
        For consenting adults. Non-sexual, platonic connection only. Consent is
        specific, mutual, and revocable at any moment.
      </Text>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    screen: { paddingTop: 32 },
    heading: { gap: 14, marginBottom: 6 },
    card: { gap: 16 },
    cardTitle: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 28,
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
  };
}
