/**
 * Touch Language body-zone map component.
 *
 * WHAT: Render grouped zone chips with status letter + color swatches from a TL document.
 * WHY: Visual map for onboarding/review without re-implementing effective status per screen.
 * CONSENT: Map is prepare/display only — never seals Consent Snapshot or grants contact.
 * EDGE CASES: Unset zones use effectiveZoneStatus (off limits); unknown status → off_limits swatch.
 * NEVER: Color-only status; treat map selection as session consent; auto-expand limits.
 * SEE: touchLanguageCore.effectiveZoneStatus · CODE_COMMENT_STANDARD (a11y non-color-only)
 */

import { Pressable, Text, View } from "react-native";
import { BODY_ZONES, type ZoneId } from "../data/touchLanguageCatalog";
import {
  effectiveZoneStatus,
  type TouchLanguageDocument,
} from "../lib/touchLanguageCore";
import { fonts, radius, type AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useColors } from "../context/ThemeContext";
import {
  hapticService,
  zonePreviewPhrase,
} from "../services/hapticService";

/**
 * WHAT: Map zone status → soft background token + short letter mark.
 * WHY: Color is never the only cue — letter + accessibilityLabel always present.
 * CONSENT: Display tokens only — not consent grants.
 * EDGE CASES: Callers fall back to off_limits swatch when status unknown.
 * NEVER: Use intensity of color as a safety score.
 */
const STATUS_SWATCH: Record<
  string,
  { bg: keyof AppColors; label: string }
> = {
  welcomed: { bg: "mossSoft", label: "W" },
  ask_first: { bg: "apricotSoft", label: "A" },
  soft_limit: { bg: "plumSoft", label: "S" },
  off_limits: { bg: "line", label: "✕" },
};

/**
 * WHAT: Props for optional selection + compact legend mode.
 * WHY: Same map serves read-only review and interactive zone pickers.
 * CONSENT: onSelectZone edits preferences only when parent wires save — not session yes.
 * EDGE CASES: without onSelectZone chips are text role (non-interactive).
 * NEVER: Parent treat selection as dual-confirm.
 */
type Props = {
  document: TouchLanguageDocument;
  selectedZoneId?: ZoneId | null;
  onSelectZone?: (zoneId: ZoneId) => void;
  compact?: boolean;
};

/**
 * WHAT: Visual body-zone map: labeled chips with status swatches.
 * WHY: Shared accessibility-safe presentation of Touch Language boundaries.
 * CONSENT: Footnote states map is never consent; unset = off limits (fail closed).
 * EDGE CASES: compact hides title; disabled press when no onSelectZone.
 * NEVER: Imply welcomed zones authorize contact without snapshot.
 * SEE: effectiveZoneStatus
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
              // Unset / missing → effective off_limits (fail closed for contact).
              const status = effectiveZoneStatus(document, zone.id);
              const swatch = STATUS_SWATCH[status] ?? STATUS_SWATCH.off_limits!;
              const selected = selectedZoneId === zone.id;
              return (
                <Pressable
                  key={zone.id}
                  disabled={!onSelectZone}
                  onPress={() => {
                    // Local pressure preview only — never peer consent or seal (ADR 0063).
                    const pressure =
                      document.zones?.[zone.id]?.pressure ??
                      document.pressure ??
                      null;
                    void hapticService.playPhrase(zonePreviewPhrase(pressure));
                    onSelectZone?.(zone.id);
                  }}
                  accessibilityRole={onSelectZone ? "button" : "text"}
                  // Text status always accompanies color (non-color-only meaning).
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

/**
 * WHAT: Theme styles for map legend, chips, and footnote.
 * WHY: Consistent density with onboarding screens.
 * CONSENT: Presentation only.
 * EDGE CASES: none — pure style object.
 * NEVER: Encode safety scores via size alone without labels.
 */
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
