import { Pressable, Text, View } from "react-native";
import { BODY_ZONES, type ZoneId } from "../data/touchLanguageCatalog";
import {
  effectiveZoneStatus,
  type TouchLanguageDocument,
} from "../lib/touchLanguageCore";
import { fonts, radius, type AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useColors } from "../context/ThemeContext";

const STATUS_SWATCH: Record<
  string,
  { bg: keyof AppColors; label: string }
> = {
  welcomed: { bg: "mossSoft", label: "W" },
  ask_first: { bg: "apricotSoft", label: "A" },
  soft_limit: { bg: "plumSoft", label: "S" },
  off_limits: { bg: "line", label: "✕" },
};

type Props = {
  document: TouchLanguageDocument;
  selectedZoneId?: ZoneId | null;
  onSelectZone?: (zoneId: ZoneId) => void;
  compact?: boolean;
};

/**
 * Visual body-zone map: labeled chips with status swatches.
 * Color is never the only cue — letter + accessibility label always present.
 */
export function TouchLanguageMap({
  document,
  selectedZoneId,
  onSelectZone,
  compact,
}: Props) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const groups = [
    { id: "upper", title: "Upper" },
    { id: "core", title: "Core" },
    { id: "lower", title: "Lower" },
  ] as const;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {!compact ? (
        <Text style={styles.legendTitle}>Body map</Text>
      ) : null}
      <View style={styles.legendRow}>
        {(
          [
            ["welcomed", "Welcomed"],
            ["ask_first", "Ask first"],
            ["soft_limit", "Soft limit"],
            ["off_limits", "Off limits"],
          ] as const
        ).map(([id, label]) => (
          <View key={id} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors[STATUS_SWATCH[id]!.bg] },
              ]}
            />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
      {groups.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.chipRow}>
            {BODY_ZONES.filter((z) => z.group === group.id).map((zone) => {
              const status = effectiveZoneStatus(document, zone.id);
              const swatch = STATUS_SWATCH[status] ?? STATUS_SWATCH.off_limits!;
              const selected = selectedZoneId === zone.id;
              return (
                <Pressable
                  key={zone.id}
                  disabled={!onSelectZone}
                  onPress={() => onSelectZone?.(zone.id)}
                  accessibilityRole={onSelectZone ? "button" : "text"}
                  accessibilityLabel={`${zone.label}: ${status.replace("_", " ")}`}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: colors[swatch.bg],
                      borderColor: selected ? colors.moss : colors.line,
                    },
                    selected && styles.chipSelected,
                  ]}
                >
                  <Text style={styles.chipMark} accessible={false}>
                    {swatch.label}
                  </Text>
                  <Text style={styles.chipLabel}>{zone.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <Text style={styles.footnote}>
        Unset zones count as off limits. Map is never consent.
      </Text>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return {
    wrap: { gap: 10 },
    legendTitle: {
      fontFamily: fonts.headline,
      fontSize: 20,
      color: colors.ink,
    },
    legendRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 10,
    },
    legendItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.line,
    },
    legendText: { color: colors.muted, fontSize: 12 },
    group: { gap: 8 },
    groupTitle: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700" as const,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
    },
    chipRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
    },
    chip: {
      borderRadius: radius.md,
      borderWidth: 1.5,
      paddingHorizontal: 10,
      paddingVertical: 8,
      minWidth: 96,
      gap: 2,
    },
    chipSelected: {
      borderWidth: 2,
    },
    chipMark: {
      fontSize: 11,
      fontWeight: "800" as const,
      color: colors.ink,
    },
    chipLabel: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.ink,
    },
    footnote: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 4,
    },
  };
}
