import { useRouter } from "expo-router";
import { ImageBackground, Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, Button, FadeIn } from "../components/ui";
import { welcomeCopy } from "../config/copy";
import { fonts, type AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";

/**
 * WHAT: Cold-launch welcome screen (`/`) — brand hero + single primary CTA into entry choice.
 * WHY: First product pixel after OS/Expo splash must set tone (soft, non-transactional)
 *   and refuse auto-entry into demo or discovery. User must deliberately leave welcome.
 * CONSENT: Point `onboard_welcome_continue` (kind: inform). Primary only authorizes
 *   navigation to `/entry`. No account, match, session, or body access.
 * EDGE CASES:
 *   - System back on root stack → leave app / OS prior; never skip to Home.
 *   - External link → browser only; app state unchanged; not an in-app consent act.
 *   - Clean install always lands here when no session (Auth restore → locked + public).
 * NEVER: Auto-enter demo (`forbidden: auto_enter_demo`); skip to discovery; imply
 *   “you’re matched” or “you’re safe”; create a real account from this screen.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §3 · CONSENT_POINTS.onboard_welcome_continue
 *   · docs/CODE_COMMENT_STANDARD.md
 */
export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  return (
    <ImageBackground
      source={require("../assets/wallpaper-welcome.png")}
      style={styles.wallpaper}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.screen}>
          {/* FadeIn respects Reduce Motion via shared FadeIn impl — presence, not grant arm. */}
          <FadeIn>
            {/* Brand mark only — not a button, not a deep-link target. */}
            <View style={styles.mark}>
              <Text style={styles.markText}>L</Text>
            </View>
            <View style={styles.hero}>
              {/* Mode-aware welcome: Maximum vs App Store Safe (docs/BUILD_MODES.md). */}
              <Text style={styles.kicker}>{welcomeCopy.kicker}</Text>
              <Text style={styles.title}>{welcomeCopy.title}</Text>
              <Body muted>{welcomeCopy.body}</Body>
            </View>
          </FadeIn>
          <View style={styles.bottom}>
            {/*
              onboard_welcome_continue — inform, offline, no arm, haptic presence (spec).
              push (not replace) so user can back to welcome from entry.
              Label from mode copy so iOS store binary is review-sanitized.
            */}
            <Button
              label={welcomeCopy.primary}
              onPress={() => router.push("/entry")}
              accessibilityHint="Opens options for entering the Litmo prototype"
            />
            <Text style={styles.caption}>{welcomeCopy.caption}</Text>
            {/* Marketing site only — never in-app consent or age eligibility. */}
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
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

/**
 * WHAT: Theme-derived styles for welcome layout (full-bleed wallpaper + bottom CTA stack).
 * WHY: Keeps palette through useThemedStyles so ND text scale and dark mode stay consistent.
 * CONSENT: Not a consent surface — visual only.
 * EDGE CASES: none — pure style factory of validated theme colors.
 * NEVER: Encode product gates in layout math (no hidden auto-advance timers here).
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §3.1
 */
function makeStyles(colors: AppColors) {
  return {
    wallpaper: { flex: 1 },
    safe: { flex: 1 },
    screen: {
      flex: 1,
      padding: 24,
      paddingBottom: 40,
      paddingTop: 40,
      justifyContent: "space-between",
    },
    mark: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: colors.plumSoft,
      justifyContent: "center",
      alignItems: "center",
    },
    markText: { fontFamily: fonts.wordmark, fontSize: 40, color: colors.plum },
    hero: { gap: 16, marginTop: 56 },
    kicker: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1.7,
    },
    title: {
      color: colors.ink,
      fontFamily: fonts.headline,
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
  };
}
