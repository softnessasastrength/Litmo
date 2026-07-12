import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Eyebrow,
  Pill,
  Screen,
  Title,
} from "../../components/ui";
import { mockProfiles } from "../../data/mock";
import { usePrototype } from "../../context/PrototypeContext";
import { useAuth } from "../../context/AuthContext";
import { colors, fonts, radius, shadow } from "../../theme";

export default function DiscoverScreen() {
  const router = useRouter();
  const { selectProfile } = usePrototype();
  const { user, status } = useAuth();
  return (
    <Screen>
      <Eyebrow>
        {status === "demo"
          ? "DEMO · IMAGINARY NEIGHBORS"
          : "IMAGINARY NEIGHBORS"}
      </Eyebrow>
      <Title>Who feels easy to be curious about?</Title>
      <Body muted>
        These synthetic profiles show vibe possibilities only. Vibe is not
        consent, and no safety guarantee is implied.
      </Body>
      {user ? (
        <Button
          variant="secondary"
          label="Edit my general profile"
          onPress={() => router.push("/profile/edit")}
        />
      ) : (
        <Body muted>
          Demo mode has no account to edit. Sign in to edit a general profile.
        </Body>
      )}
      <View style={styles.list}>
        {mockProfiles.map((profile) => (
          <Pressable
            key={profile.id}
            accessibilityRole="button"
            accessibilityLabel={`View ${profile.name}'s mock profile`}
            onPress={() => {
              selectProfile(profile.id);
              router.push(`/match/${profile.id}`);
            }}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={[styles.avatar, { backgroundColor: profile.color }]}>
              <Text style={styles.glyph}>{profile.glyph}</Text>
            </View>
            <View style={styles.main}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>
                  {profile.name}, {profile.age}
                </Text>
                <Text style={styles.arrow}>›</Text>
              </View>
              <Text style={styles.pronouns}>
                {profile.pronouns} · {profile.distance}
              </Text>
              <Pill>{profile.archetype}</Pill>
              <Text style={styles.vibe}>{profile.vibe}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  list: { gap: 14 },
  card: {
    flexDirection: "row",
    gap: 15,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  pressed: { opacity: 0.75 },
  avatar: {
    width: 70,
    height: 82,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  glyph: { color: colors.plum, fontFamily: "Georgia", fontSize: 34 },
  main: { flex: 1, gap: 7 },
  nameRow: { flexDirection: "row", justifyContent: "space-between" },
  name: { color: colors.ink, fontFamily: fonts.headline, fontSize: 23 },
  arrow: { color: colors.moss, fontSize: 26 },
  pronouns: { color: colors.muted, fontSize: 12 },
  vibe: { color: colors.ink, fontSize: 13, lineHeight: 19 },
});
