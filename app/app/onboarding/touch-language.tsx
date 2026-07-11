import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useAuth } from "../../context/AuthContext";
import { profileRepository } from "../../services/profileRepository";
import { archetypes } from "../../data/quiz";

export default function TouchLanguageScreen() {
  const router = useRouter();
  const { touchChoices, setTouchChoice } = usePrototype();
  const { user, refreshProfile } = useAuth();
  const { archetypeId } = usePrototype();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
  const save = async () => {
    if (!user) {
      router.replace("/match/discover");
      return;
    }
    setBusy(true);
    setError("");
    const pressureMap = {
      "Feather-light": "light",
      "Comfortably gentle": "medium",
      "Steady and grounding": "firm",
    } as const;
    const durationMap = {
      "A brief hello": "brief",
      "A few quiet minutes": "few_minutes",
      "Let’s decide together": "decide_together",
    } as const;
    const environmentMap = {
      "A calm public place": "public_calm",
      "Somewhere outdoors": "outdoors",
      "A hosted community space": "hosted_community",
    } as const;
    try {
      const existing = await profileRepository.getOwnProfile(user.id);
      await profileRepository.completeProfile(
        user.id,
        { ...existing, vibeArchetype: archetypes[archetypeId].name },
        {
          pressure:
            pressureMap[touchChoices.pressure as keyof typeof pressureMap],
          duration:
            durationMap[touchChoices.duration as keyof typeof durationMap],
          environments: [
            environmentMap[
              touchChoices.environment as keyof typeof environmentMap
            ],
          ],
          holdTypes: ["side_by_side"],
          privateNervousSystemNotes: null,
        },
        {
          bodyZones: [
            {
              zone: "hands",
              status: "ask_first",
              pressure:
                pressureMap[touchChoices.pressure as keyof typeof pressureMap],
            },
          ],
          hardStops: ["All unlisted body areas are off limits"],
          privateNervousSystemNotes: null,
        },
      );
      await refreshProfile();
      router.replace("/match/discover");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Your profile could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };
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
        label={busy ? "Saving privately…" : "Save and meet the mock community"}
        disabled={!complete || busy}
        onPress={() => void save()}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
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
  error: { color: colors.signal, lineHeight: 21 },
});
