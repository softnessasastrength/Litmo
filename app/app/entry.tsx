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
import { useNeurodivergent } from "../context/NeurodivergentContext";
import { fonts, type AppColors } from "../theme";
import { entryCopy } from "../config/copy";
import { runtimeConfig } from "../config/runtime";
import { environmentError } from "../services/supabase";
import { useThemedStyles } from "../hooks/useThemedStyles";

/**
 * WHAT: Path-choice screen (`/entry`) — demo vs real passkey account.
 * WHY: Separates fictional local walkthrough from durable auth so demo never
 *   pretends to be a real person connection and real never skips eligibility later.
 * CONSENT: Points `onboard_entry_demo`, `onboard_entry_signin`, `onboard_entry_signup`;
 *   side-effect `onboard_nd_default_demo` when demo is entered. Footer states
 *   platonic-adult purpose (`onboard_platonic_adult_ack` is catalogued but not yet
 *   a required checkbox — text-only today). All prepare/inform; never touch consent.
 * EDGE CASES:
 *   - `allowDemo === false` → demo card omitted; only real path.
 *   - Supabase env missing → real buttons disabled; demo still available if allowDemo.
 *   - Demo uses router.replace so About You is not stacked under Entry for back-confusion.
 *   - Re-entering Entry while already `demo` is allowed; no hard block.
 * NEVER: Touch granted; age confirmed without later Apple gate (real); real matching
 *   from demo; ND Mode as clinical diagnosis or match trait.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §4 · CONSENT_POINTS onboard_entry_* · ADR 0003
 */
export default function EntryScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { enterDemoMode } = useAuth();
  const { setEnabled: setNeuroEnabled } = useNeurodivergent();

  return (
    <Screen style={styles.screen}>
      <FadeIn>
        <View style={styles.heading}>
          {/* Mode-aware entry copy (Maximum full voice vs App Store Safe). */}
          <Eyebrow>{entryCopy.eyebrow}</Eyebrow>
          <Title>{entryCopy.title}</Title>
          <Body muted>{entryCopy.body}</Body>
          {runtimeConfig.features.showBuildModeBadge ? (
            <Text style={styles.modeBadge} accessibilityRole="text">
              {runtimeConfig.isMaximumBuild
                ? entryCopy.modeBadgeMaximum
                : entryCopy.modeBadgeAppStore}
            </Text>
          ) : null}
        </View>
      </FadeIn>

      {/*
        Demo vs real is a product gate, not a consent seal.
        allowDemo = development env AND features.demoModeSurface (false in app_store).
      */}
      {runtimeConfig.allowDemo ? (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{entryCopy.demoTitle}</Text>
          <Body>{entryCopy.demoBody}</Body>
          <View style={styles.notice} accessible accessibilityRole="text">
            <Text style={styles.noticeTitle}>{entryCopy.demoNoticeTitle}</Text>
            <Text style={styles.noticeBody}>{entryCopy.demoNoticeBody}</Text>
          </View>
          {/*
            onboard_entry_demo (prepare) sequence:
            (1) enterDemoMode → status "demo"
            (2) setNeuroEnabled(true) → onboard_nd_default_demo (device-local calm)
            (3) replace About You — Entry not under stack for false “back = cancel account”
            Network: none. Soft Signal still not armed in pure onboarding.
          */}
          <Button
            label={entryCopy.demoButton}
            onPress={() => {
              enterDemoMode();
              // Calm default for the phone-visible demo path (device-local only).
              // NEVER clinical diagnosis or match trait — Settings can disable later.
              void setNeuroEnabled(true);
              router.replace("/onboarding/about-you");
            }}
            accessibilityHint="Starts the fictional demo with no account. Neurodivergent Mode turns on for a quieter walkthrough. Local quiz or learning progress may remain on this device only."
          />
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>{entryCopy.realTitle}</Text>
        <Body muted>{entryCopy.realBody}</Body>
        {/* Fail-closed for real path: without Supabase config, controls stay present but inert. */}
        {environmentError ? (
          <View style={styles.notice} accessible accessibilityRole="text">
            <Text style={styles.noticeTitle}>Local service not configured</Text>
            <Text style={styles.noticeBody}>
              Real accounts need a Supabase URL and anon key (see
              docs/LOCAL_DEVELOPMENT.md). Demo mode still works without them.
            </Text>
          </View>
        ) : null}
        {/* onboard_entry_signin — prepare; disabled when environmentError (fail-closed). */}
        <Button
          label="Sign in with passkey"
          onPress={() => router.push("/auth/sign-in")}
          variant="secondary"
          accessibilityHint="Opens passkey-first sign-in for a real, persistent account"
          disabled={Boolean(environmentError)}
        />
        {/* onboard_entry_signup — prepare; still never means age or touch confirmed. */}
        <Button
          label="Create account with passkey"
          onPress={() => router.push("/auth/sign-up")}
          variant="secondary"
          accessibilityHint="Opens passkey registration after a one-time email ownership code"
          disabled={Boolean(environmentError)}
        />
      </Card>

      {/*
        onboard_platonic_adult_ack (catalog): purpose understanding only.
        Current UI: footer text — NOT a required ConsentAffirmRow yet.
        Authorizes understanding adults / platonic / non-sexual; NEVER Apple age or legal ID.
      */}
      <Text style={styles.footer}>{entryCopy.footer}</Text>
    </Screen>
  );
}

/**
 * WHAT: Theme styles for entry cards, notices, and purpose footer.
 * WHY: Shared notice pattern (apricot rail) is educational, not error-as-panic.
 * CONSENT: Not a consent surface — presentation only.
 * EDGE CASES: none — pure style factory.
 * NEVER: Hide disabled real controls without the env notice (a11y dead-end ban).
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §4.5
 */
function makeStyles(colors: AppColors) {
  return {
    screen: { paddingTop: 32 },
    heading: { gap: 14, marginBottom: 6 },
    modeBadge: {
      color: colors.moss,
      fontSize: 11,
      fontWeight: "800" as const,
      letterSpacing: 0.8,
      marginTop: 4,
    },
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
