import { useState } from "react";
import { useRouter } from "expo-router";
import { Text, TextInput, View } from "react-native";
import {
  Body,
  Button,
  Choice,
  FadeIn,
  Progress,
  Screen,
} from "../../components/ui";
import { genderOptions, orientationOptions } from "../../data/aboutYou";
import { usePrototype } from "../../context/PrototypeContext";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

/**
 * Product step id for About You. Order is fixed: name → age → gender → orientation.
 * Each step maps to an onboard_* prepare/inform point — never session dual-seal.
 */
type Step = "name" | "age" | "gender" | "orientation";

/** Canonical linear order; index 0 backs to prior screen (Entry on demo replace path). */
const steps: Step[] = ["name", "age", "gender", "orientation"];

/**
 * WHAT: Four-step self-describe onboarding (`/onboarding/about-you`) for display
 *   name, adult self-report age, gender, and orientation into PrototypeContext.
 * WHY: Gather local (and later real-profile) starting points before vibe quiz
 *   without treating any answer as safety, matching eligibility beyond 18+, or touch.
 * CONSENT: Points `onboard_profile_name` (inform), `onboard_age_self_report` (prepare),
 *   `onboard_profile_gender` (inform), `onboard_profile_orientation` (inform).
 *   Authorizes profile/local state only. Age self-report ≠ Apple Declared Age Range.
 * EDGE CASES:
 *   - Whitespace-only name → Next disabled.
 *   - Age under 18 or non-digit → Next disabled (`forbidden: allow_under_18_continue`).
 *   - “Something else” without custom text → Next disabled (gender & orientation).
 *   - Age paste with letters → stripped; leading zeros coerce via Number (018 → 18 ok).
 *   - Last Next → quiz; no server write until real-user quiz/TL paths.
 * NEVER: Legal name verification; public directory; government ID; birthday storage;
 *   consent to touch; substitute for `/onboarding/age-gate` on real accounts;
 *   attraction as safety signal.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §5 · CONSENT_POINTS onboard_profile_* / onboard_age_self_report
 */
export default function AboutYouScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { aboutYou, setAboutYou } = usePrototype();
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  /**
   * WHAT: Advances to next About You step, or pushes vibe quiz on the last step.
   * WHY: Keeps linear prepare flow; quiz is weather only, still not touch.
   * CONSENT: Last step press continues prepare path (`onboard_profile_orientation` → quiz inform).
   * EDGE CASES: Only callable when canContinue true (primary disabled otherwise).
   * NEVER: Skip age gate for real accounts; seal snapshot; mark onboarding complete server-side.
   * SEE: docs/ONBOARDING_CONSENT_FLOW.md §5.4
   */
  const next = () => {
    if (stepIndex === steps.length - 1) {
      router.push("/onboarding/quiz");
    } else {
      setStepIndex((value) => value + 1);
    }
  };

  /**
   * WHAT: Goes to previous step, or router.back() on step 0.
   * WHY: No dead ends; user can revise without clearing later fields (memory keeps them).
   * CONSENT: Navigation only — does not revoke session consent (none exists yet).
   * EDGE CASES: Demo replace from Entry may make step-0 back leave product path.
   * NEVER: Clear age/gender on back (state preserved for re-edit).
   * SEE: docs/ONBOARDING_CONSENT_FLOW.md §5.0
   */
  const back = () => {
    if (stepIndex === 0) router.back();
    else setStepIndex((value) => value - 1);
  };

  // Fail-closed step gates: Next stays disabled until the active step is valid.
  // Age: digits only + Number >= 18 — self-report for demo/about-you ONLY.
  // NEVER treat this as Apple Declared Age Range or production eligibility.
  const canContinue =
    step === "name"
      ? aboutYou.name.trim().length > 0
      : step === "age"
        ? /^\d{1,3}$/.test(aboutYou.age.trim()) && Number(aboutYou.age) >= 18
        : step === "gender"
          ? Boolean(aboutYou.gender) &&
            (aboutYou.gender !== "Something else" ||
              aboutYou.genderCustom.trim().length > 0)
          : Boolean(aboutYou.orientation) &&
            (aboutYou.orientation !== "Something else" ||
              aboutYou.orientationCustom.trim().length > 0);

  return (
    <Screen>
      <Progress current={stepIndex + 1} total={steps.length} />
      <Text style={styles.count}>
        A LITTLE ABOUT YOU · {stepIndex + 1} OF {steps.length}
      </Text>
      <FadeIn key={step}>
        {step === "name" ? (
          <View style={styles.block}>
            {/* onboard_profile_name — display name only, not legal identity. */}
            <Text style={styles.kicker} accessibilityRole="header">
              What should we call you?
            </Text>
            <Text style={styles.prompt}>Just your name — nothing formal.</Text>
            <TextInput
              accessibilityLabel="Your name"
              autoCapitalize="words"
              autoFocus
              value={aboutYou.name}
              // Display name only — not legal identity, not matching eligibility, not consent.
              // Empty trim is rejected by canContinue so we never treat whitespace-as-name as ready.
              onChangeText={(text) => setAboutYou({ name: text })}
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
            />
          </View>
        ) : null}
        {step === "age" ? (
          <View style={styles.block}>
            {/*
              onboard_age_self_report — prepare eligibility for demo/about-you path only.
              Under 18: Next stays disabled. NEVER Apple range, ID, or production adult signal.
            */}
            <Text style={styles.kicker} accessibilityRole="header">
              How many trips around the sun?
            </Text>
            <Text style={styles.prompt}>Litmo is for adults only — 18+.</Text>
            <TextInput
              accessibilityLabel="Your age"
              autoFocus
              keyboardType="number-pad"
              maxLength={3}
              value={aboutYou.age}
              // Strip non-digits (paste safety). No upper adult cap beyond 3 digits in UI.
              // Number(age) >= 18 is the only gate — real accounts still need age-gate later.
              onChangeText={(text) =>
                setAboutYou({ age: text.replace(/[^0-9]/g, "") })
              }
              style={styles.input}
              placeholder="Age"
              placeholderTextColor={colors.muted}
            />
          </View>
        ) : null}
        {step === "gender" ? (
          <View style={styles.block}>
            {/* onboard_profile_gender — inform; never medical classification or binary-only force. */}
            <Text style={styles.kicker} accessibilityRole="header">
              How do you describe your gender?
            </Text>
            <Text style={styles.prompt}>
              Pick what fits, or tell us in your own words.
            </Text>
            <View accessibilityRole="radiogroup" style={styles.options}>
              {[...genderOptions, "Something else"].map((option) => (
                <Choice
                  key={option}
                  label={option}
                  selected={aboutYou.gender === option}
                  onPress={() => setAboutYou({ gender: option })}
                />
              ))}
            </View>
            {/* Custom free-text only when “Something else”; empty custom blocks Next. */}
            {aboutYou.gender === "Something else" ? (
              <TextInput
                accessibilityLabel="Describe your gender in your own words"
                autoFocus
                value={aboutYou.genderCustom}
                onChangeText={(text) => setAboutYou({ genderCustom: text })}
                style={styles.input}
                placeholder="In your own words"
                placeholderTextColor={colors.muted}
              />
            ) : null}
          </View>
        ) : null}
        {step === "orientation" ? (
          <View style={styles.block}>
            {/*
              onboard_profile_orientation — inform.
              Copy law: attraction helps understand preference, NEVER safety/trust score.
            */}
            <Text style={styles.kicker} accessibilityRole="header">
              What&rsquo;s your sexual orientation?
            </Text>
            <Text style={styles.prompt}>
              This helps us understand attraction, never anything about safety.
            </Text>
            <View accessibilityRole="radiogroup" style={styles.options}>
              {[...orientationOptions, "Something else"].map((option) => (
                <Choice
                  key={option}
                  label={option}
                  selected={aboutYou.orientation === option}
                  onPress={() => setAboutYou({ orientation: option })}
                />
              ))}
            </View>
            {aboutYou.orientation === "Something else" ? (
              <TextInput
                accessibilityLabel="Describe your orientation in your own words"
                autoFocus
                value={aboutYou.orientationCustom}
                onChangeText={(text) =>
                  setAboutYou({ orientationCustom: text })
                }
                style={styles.input}
                placeholder="In your own words"
                placeholderTextColor={colors.muted}
              />
            ) : null}
          </View>
        ) : null}
      </FadeIn>
      {/* Sharing is opt-in later — onboarding stores locally / profile path only. */}
      <Body muted center>
        You can change any of this later. None of it is shared until you choose
        to share it.
      </Body>
      <View style={styles.buttons}>
        <View style={styles.buttonFlex}>
          <Button
            variant="secondary"
            label="Back"
            onPress={back}
            accessibilityHint="Goes to the previous question"
          />
        </View>
        <View style={styles.buttonFlex}>
          {/* Grant arm dwell does NOT apply — onboarding Next is inform/prepare, not dual-seal. */}
          <Button
            label={
              stepIndex === steps.length - 1 ? "Continue to the quiz" : "Next"
            }
            disabled={!canContinue}
            onPress={next}
          />
        </View>
      </View>
    </Screen>
  );
}

/**
 * WHAT: Theme styles for About You progress chrome, inputs, and dual nav buttons.
 * WHY: Shared input height meets min touch target; radiogroup spacing for exclusive choices.
 * CONSENT: Not a consent surface.
 * EDGE CASES: none — pure style factory.
 * NEVER: Color-only meaning for required fields (disabled state is on Button, not hue alone).
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §14
 */
function makeStyles(colors: AppColors) {
  return {
    count: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.1,
    },
    block: { gap: 10, marginTop: 16, marginBottom: 20 },
    kicker: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 30,
      lineHeight: 36,
    },
    prompt: { color: colors.muted, fontSize: 15, lineHeight: 21 },
    options: { gap: 9, marginTop: 6 },
    input: {
      minHeight: 52,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      color: colors.ink,
      paddingHorizontal: 16,
      fontSize: 17,
      marginTop: 8,
    },
    buttons: { flexDirection: "row", gap: 12, marginTop: "auto" },
    buttonFlex: { flex: 1 },
  };
}
