import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Pill,
  Screen,
  SectionTitle,
  Title,
} from "../../components/ui";
import { mockProfiles } from "../../data/mock";
import { colors } from "../../theme";
export default function MatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile =
    mockProfiles.find((item) => item.id === id) ?? mockProfiles[0];
  return (
    <Screen>
      <View style={[styles.hero, { backgroundColor: profile.color }]}>
        <Text style={styles.glyph}>{profile.glyph}</Text>
        <Pill>{profile.archetype}</Pill>
      </View>
      <Eyebrow>SYNTHETIC PROFILE</Eyebrow>
      <Title>
        {profile.name}, {profile.age}
      </Title>
      <Body muted>
        {profile.pronouns} · {profile.distance}
      </Body>
      <Body>{profile.note}</Body>
      <Card>
        <SectionTitle>Vibe notes</SectionTitle>
        <Body>{profile.vibe}</Body>
      </Card>
      <Card>
        <SectionTitle>Trust context</SectionTitle>
        <Text style={styles.affirmed}>
          {profile.affirmed} affirmed mock sessions
        </Text>
        <Body muted>
          Past outcomes are limited context. They never prove that someone is
          safe or replace your current boundaries.
        </Body>
      </Card>
      <View style={styles.separation}>
        <Text style={styles.separationTitle}>
          Vibe brought you here. Consent comes next.
        </Text>
        <Text style={styles.separationBody}>
          The next screen uses plain, literal language and the strict overlap of
          both mock preference sets.
        </Text>
      </View>
      <Button
        label="Review a mock Consent Snapshot"
        onPress={() =>
          router.push({
            pathname: "/match/consent-snapshot",
            params: { id: profile.id },
          })
        }
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: {
    height: 190,
    borderRadius: 30,
    padding: 22,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  glyph: { color: colors.plum, fontFamily: "Georgia", fontSize: 72 },
  affirmed: {
    color: colors.moss,
    fontSize: 17,
    fontWeight: "800",
    marginVertical: 8,
  },
  separation: {
    borderLeftWidth: 4,
    borderLeftColor: colors.apricot,
    paddingLeft: 16,
    gap: 5,
  },
  separationTitle: { color: colors.ink, fontWeight: "800", fontSize: 16 },
  separationBody: { color: colors.muted, lineHeight: 21 },
});
