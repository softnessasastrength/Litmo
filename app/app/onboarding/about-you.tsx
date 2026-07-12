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


type Step = "name" | "age" | "gender" | "orientation";
const steps: Step[] = ["name", "age", "gender", "orientation"];

export default function AboutYouScreen() {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { aboutYou, setAboutYou } = usePrototype();
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  const next = () => {
    if (stepIndex === steps.length - 1) {
      router.push("/onboarding/quiz");
    } else {
      setStepIndex((value) => value + 1);
    }
  };
  const back = () => {
    if (stepIndex === 0) router.back();
    else setStepIndex((value) => value - 1);
  };

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
            <Text style={styles.kicker}>What should we call you?</Text>
            <Text style={styles.prompt}>Just your name — nothing formal.</Text>
            <TextInput
              accessibilityLabel="Your name"
              autoCapitalize="words"
              autoFocus
              value={aboutYou.name}
              onChangeText={(text) => setAboutYou({ name: text })}
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
            />
          </View>
        ) : null}
        {step === "age" ? (
          <View style={styles.block}>
            <Text style={styles.kicker}>How many trips around the sun?</Text>
            <Text style={styles.prompt}>Litmo is for adults only — 18+.</Text>
            <TextInput
              accessibilityLabel="Your age"
              autoFocus
              keyboardType="number-pad"
              maxLength={3}
              value={aboutYou.age}
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
            <Text style={styles.kicker}>How do you describe your gender?</Text>
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
            <Text style={styles.kicker}>
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

