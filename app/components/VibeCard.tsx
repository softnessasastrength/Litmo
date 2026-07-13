import { Text, View } from "react-native";
import { archetypes, type ArchetypeId } from "../data/quiz";
import { fonts, radius, type AppColors } from "../theme";
import { Pill } from "./ui";
import { useThemedStyles } from "../hooks/useThemedStyles";

type VibeCardProps = {
  archetypeId: ArchetypeId;
  /** Optional close secondary for a blended reveal. */
  secondaryId?: ArchetypeId | null;
  blendLabel?: string | null;
  showHowYouMightShowUp?: boolean;
};

export function VibeCard({
  archetypeId,
  secondaryId = null,
  blendLabel = null,
  showHowYouMightShowUp = false,
}: VibeCardProps) {
  const styles = useThemedStyles(makeStyles);
  const vibe = archetypes[archetypeId];
  const secondary = secondaryId ? archetypes[secondaryId] : null;
  return (
    <View
      accessible
      accessibilityLabel={`${vibe.name}. ${vibe.tagline}${
        blendLabel ? `. ${blendLabel}` : ""
      }`}
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
      {blendLabel ? (
        <Text style={styles.blend}>Also present: {blendLabel}</Text>
      ) : null}
      {secondary && !blendLabel ? (
        <Text style={styles.blend}>
          Secondary note: {secondary.name.replace(/^The\s+/, "")}
        </Text>
      ) : null}
      <View style={styles.traits}>
        {vibe.traits.map((trait) => (
          <Pill key={trait}>{trait}</Pill>
        ))}
      </View>
      {showHowYouMightShowUp ? (
        <View style={styles.showUp}>
          <Text style={styles.showUpTitle}>How you might show up</Text>
          {vibe.howYouMightShowUp.map((line) => (
            <Text key={line} style={styles.showUpLine}>
              · {line}
            </Text>
          ))}
        </View>
      ) : null}
      <Text style={styles.note}>
        A conversation starter, never the whole story.
      </Text>
    </View>
  );
}

function makeStyles(colors: AppColors, shadow: Record<string, unknown> = {}) {
  return {
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
      fontFamily: fonts.headline,
      fontSize: 36,
      lineHeight: 42,
      marginTop: 7,
    },
    tagline: { color: colors.ink, fontSize: 17, lineHeight: 25, marginTop: 8 },
    blend: {
      color: colors.plum,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      marginTop: 10,
    },
    traits: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 18 },
    showUp: { marginTop: 16, gap: 6 },
    showUpTitle: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    showUpLine: { color: colors.ink, fontSize: 14, lineHeight: 20 },
    note: { color: colors.muted, fontSize: 12, marginTop: 20 },
  };
}
