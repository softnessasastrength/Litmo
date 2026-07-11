import { StyleSheet, Text, View } from "react-native";
import { archetypes, type ArchetypeId } from "../data/quiz";
import { colors, radius, shadow } from "../theme";
import { Pill } from "./ui";
export function VibeCard({ archetypeId }: { archetypeId: ArchetypeId }) {
  const vibe = archetypes[archetypeId];
  return (
    <View
      accessible
      accessibilityLabel={`${vibe.name}. ${vibe.tagline}`}
      style={[styles.card, { backgroundColor: vibe.softColor }]}
    >
      <View style={styles.top}>
        <Text style={[styles.symbol, { color: vibe.color }]}>
          {vibe.symbol}
        </Text>
        <Text style={styles.brand}>LITMO · VIBE PROFILE</Text>
      </View>
      <Text style={styles.eyebrow}>{vibe.eyebrow}</Text>
      <Text style={styles.name}>{vibe.name}</Text>
      <Text style={styles.tagline}>{vibe.tagline}</Text>
      <View style={styles.traits}>
        {vibe.traits.map((trait) => (
          <Pill key={trait}>{trait}</Pill>
        ))}
      </View>
      <Text style={styles.note}>
        A conversation starter, never the whole story.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 24,
    minHeight: 370,
    justifyContent: "flex-end",
    borderWidth: 1,
    borderColor: colors.white,
    ...shadow,
  },
  top: {
    position: "absolute",
    top: 22,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  symbol: { fontFamily: "Georgia", fontSize: 58 },
  brand: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  eyebrow: {
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    fontSize: 12,
    fontWeight: "800",
  },
  name: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 34,
    lineHeight: 40,
    marginTop: 7,
  },
  tagline: { color: colors.ink, fontSize: 17, lineHeight: 25, marginTop: 8 },
  traits: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 18 },
  note: { color: colors.muted, fontSize: 12, marginTop: 20 },
});
