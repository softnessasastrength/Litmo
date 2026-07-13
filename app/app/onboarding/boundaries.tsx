import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  Body,
  Button,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  demoBodyZoneGroups,
  demoBodyZones,
  demoHardStopOptions,
  type BoundaryStatus,
  type DemoBodyZoneGroup,
  usePrototype,
} from "../../context/PrototypeContext";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useNeurodivergent } from "../../context/NeurodivergentContext";

const statuses: Array<{
  value: BoundaryStatus;
  label: string;
  detail: string;
}> = [
  {
    value: "welcomed",
    label: "Welcomed",
    detail: "Usually okay if we both confirm in the session",
  },
  {
    value: "ask_first",
    label: "Ask first",
    detail: "Only with a clear, fresh ask in the moment",
  },
  {
    value: "off_limits",
    label: "Off limits",
    detail: "Not available — silence here still means no",
  },
];

type Step =
  | "intro"
  | DemoBodyZoneGroup
  | "hard_stops"
  | "note"
  | "review";

const stepOrder: Step[] = [
  "intro",
  "upper",
  "core",
  "lower",
  "hard_stops",
  "note",
  "review",
];

/**
 * Expanded local body-zone + hard-stop setup for the phone-visible path.
 * Does not grant consent; values stay in PrototypeContext only.
 */
export default function BoundariesScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { prefs } = useNeurodivergent();
  const {
    bodyBoundaries,
    setBodyBoundary,
    setAllBodyBoundaries,
    setUnsetBodyBoundaries,
    hardStops,
    toggleHardStop,
    boundaryNote,
    setBoundaryNote,
  } = usePrototype();
  const [stepIndex, setStepIndex] = useState(0);
  const step = stepOrder[stepIndex] ?? "intro";

  const zonesForStep = useMemo(() => {
    if (step === "upper" || step === "core" || step === "lower") {
      return demoBodyZones.filter((z) => z.group === step);
    }
    return [];
  }, [step]);

  const setCount = demoBodyZones.filter((z) => bodyBoundaries[z.id]).length;
  const allZonesSet = setCount === demoBodyZones.length;
  const welcomed = demoBodyZones.filter(
    (z) => bodyBoundaries[z.id] === "welcomed",
  );
  const askFirst = demoBodyZones.filter(
    (z) => bodyBoundaries[z.id] === "ask_first",
  );
  const offLimits = demoBodyZones.filter(
    (z) => bodyBoundaries[z.id] === "off_limits" || !bodyBoundaries[z.id],
  );

  const groupComplete =
    step !== "upper" && step !== "core" && step !== "lower"
      ? true
      : zonesForStep.every((z) => bodyBoundaries[z.id]);

  const goNext = () => {
    if (stepIndex >= stepOrder.length - 1) {
      router.replace("/home");
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex <= 0) return;
    setStepIndex((i) => i - 1);
  };

  const progressLabel = `Step ${stepIndex + 1} of ${stepOrder.length}`;

  return (
    <Screen>
      <Eyebrow>BOUNDARIES · LOCAL ONLY · EXPANDED</Eyebrow>
      <Text style={styles.progress} accessibilityRole="text">
        {progressLabel} · {setCount}/{demoBodyZones.length} zones named
      </Text>

      {step === "intro" ? (
        <>
          <Title>Build a fuller body map — still not consent.</Title>
          <Body muted>
            You will walk through upper body, core, and legs/feet, then absolute
            hard stops. Color is never the only cue — every option has a label.
            This stays on device in the demo. Every real session still needs a
            fresh Consent Snapshot.
          </Body>
          <View style={styles.safety}>
            <Text style={styles.safetyTitle}>Fail closed by design</Text>
            <Text style={styles.safetyBody}>
              Unset zones and unlisted areas are off limits. A match, vibe, or
              prior session never turns off limits into welcomed.
            </Text>
          </View>
          {prefs.enabled ? (
            <Body muted>
              Neurodivergent Mode: use “Mark remaining ask first” anytime if
              choosing zone-by-zone is tiring.
            </Body>
          ) : null}
          <View style={styles.quickRow}>
            <Button
              variant="secondary"
              label="Mark all ask first"
              onPress={() => setAllBodyBoundaries("ask_first")}
              accessibilityHint="Sets every body zone to ask first. You can still edit each one."
            />
          </View>
          <Button
            label="Start body map"
            onPress={goNext}
            accessibilityHint="Begins upper body zones"
          />
        </>
      ) : null}

      {(step === "upper" || step === "core" || step === "lower") && (
        <>
          <Title>
            {demoBodyZoneGroups.find((g) => g.id === step)?.title ?? "Zones"}
          </Title>
          <Body muted>
            {demoBodyZoneGroups.find((g) => g.id === step)?.summary}
          </Body>
          {zonesForStep.map((zone) => (
            <View key={zone.id} style={styles.group}>
              <Text style={styles.question} accessibilityRole="header">
                {zone.label}
              </Text>
              {zone.detail ? (
                <Text style={styles.zoneDetail}>{zone.detail}</Text>
              ) : null}
              <View accessibilityRole="radiogroup" style={styles.choices}>
                {statuses.map((status) => (
                  <Choice
                    key={status.value}
                    label={status.label}
                    detail={status.detail}
                    selected={bodyBoundaries[zone.id] === status.value}
                    onPress={() => setBodyBoundary(zone.id, status.value)}
                  />
                ))}
              </View>
            </View>
          ))}
          <View style={styles.quickRow}>
            <Button
              variant="secondary"
              label="Mark remaining in this section ask first"
              onPress={() => {
                for (const zone of zonesForStep) {
                  if (!bodyBoundaries[zone.id]) {
                    setBodyBoundary(zone.id, "ask_first");
                  }
                }
              }}
              accessibilityHint="Fills unset zones in this section only with ask first"
            />
          </View>
          <View style={styles.navRow}>
            <Button variant="secondary" label="Back" onPress={goBack} />
            <Button
              label="Continue"
              disabled={!groupComplete}
              onPress={goNext}
              accessibilityHint={
                groupComplete
                  ? "Goes to the next boundary step"
                  : "Choose a status for each zone in this section, or mark remaining ask first"
              }
            />
          </View>
        </>
      )}

      {step === "hard_stops" ? (
        <>
          <Title>Absolute hard stops</Title>
          <Body muted>
            Tap anything that must never happen — even if a zone above said ask
            first. Hard stops win. You can select more than one.
          </Body>
          <View style={styles.chipWrap}>
            {demoHardStopOptions.map((stop) => {
              const on = hardStops.includes(stop.id);
              return (
                <Pressable
                  key={stop.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={stop.label}
                  onPress={() => toggleHardStop(stop.id)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {on ? "✓ " : ""}
                    {stop.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Body muted>
            Selected: {hardStops.length === 0 ? "none yet" : hardStops.length}
          </Body>
          <View style={styles.navRow}>
            <Button variant="secondary" label="Back" onPress={goBack} />
            <Button label="Continue" onPress={goNext} />
          </View>
        </>
      ) : null}

      {step === "note" ? (
        <>
          <Title>Private nervous-system note</Title>
          <Body muted>
            Optional. Stays local in the demo. Never shown as a public bio.
            Examples: “I need a minute before contact,” “No sudden from-behind
            approaches,” “I freeze when rushed.”
          </Body>
          <TextInput
            value={boundaryNote}
            onChangeText={setBoundaryNote}
            placeholder="Optional private note…"
            placeholderTextColor="#8A7F78"
            multiline
            style={styles.noteInput}
            accessibilityLabel="Private nervous system note"
            maxLength={400}
          />
          <Text style={styles.charCount}>{boundaryNote.length}/400</Text>
          <View style={styles.navRow}>
            <Button variant="secondary" label="Back" onPress={goBack} />
            <Button label="Review map" onPress={goNext} />
          </View>
        </>
      ) : null}

      {step === "review" ? (
        <>
          <Title>Your boundary map</Title>
          <Body muted>
            Unset zones count as off limits. This is still not session consent.
          </Body>
          {!allZonesSet ? (
            <View style={styles.warning}>
              <Text style={styles.warningTitle}>
                {demoBodyZones.length - setCount} zones still unset
              </Text>
              <Text style={styles.warningBody}>
                They will be treated as off limits. You can fill them or mark
                remaining as ask first.
              </Text>
              <Button
                variant="secondary"
                label="Mark remaining ask first"
                onPress={() => setUnsetBodyBoundaries("ask_first")}
              />
            </View>
          ) : null}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Welcomed</Text>
            <Text style={styles.summaryValue}>
              {welcomed.length
                ? welcomed.map((z) => z.label).join(" · ")
                : "None named"}
            </Text>
            <Text style={styles.summaryLabel}>Ask first</Text>
            <Text style={styles.summaryValue}>
              {askFirst.length
                ? askFirst.map((z) => z.label).join(" · ")
                : "None named"}
            </Text>
            <Text style={styles.summaryLabel}>Off limits (incl. unset)</Text>
            <Text style={styles.summaryValue}>
              {offLimits.map((z) => z.label).join(" · ")}
            </Text>
            <Text style={styles.summaryLabel}>Hard stops</Text>
            <Text style={styles.summaryValue}>
              {hardStops.length
                ? demoHardStopOptions
                    .filter((s) => hardStops.includes(s.id))
                    .map((s) => s.label)
                    .join(" · ")
                : "None selected"}
            </Text>
            {boundaryNote.trim() ? (
              <>
                <Text style={styles.summaryLabel}>Private note</Text>
                <Text style={styles.summaryValue}>{boundaryNote.trim()}</Text>
              </>
            ) : null}
          </View>
          <View style={styles.safety}>
            <Text style={styles.safetyTitle}>Missing means off limits.</Text>
            <Text style={styles.safetyBody}>
              We never invent consent from silence, a vibe match, or a prior
              session. Soft Signal still ends anything immediately.
            </Text>
          </View>
          <View style={styles.navRow}>
            <Button variant="secondary" label="Back" onPress={goBack} />
            <Button
              label="Save boundaries and continue"
              onPress={() => router.replace("/home")}
              accessibilityHint="Continues the demo with your local boundary choices. Nothing is uploaded."
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    progress: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700" as const,
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    group: { gap: 10, marginTop: 14 },
    question: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 24,
      lineHeight: 30,
    },
    zoneDetail: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: -4,
    },
    choices: { gap: 9 },
    safety: {
      backgroundColor: colors.plumSoft,
      borderRadius: 18,
      padding: 18,
      gap: 5,
      marginTop: 8,
    },
    safetyTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
    safetyBody: { color: colors.muted, lineHeight: 21 },
    warning: {
      backgroundColor: colors.paper,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      gap: 8,
      marginTop: 8,
    },
    warningTitle: { color: colors.ink, fontWeight: "800" as const },
    warningBody: { color: colors.muted, lineHeight: 20 },
    quickRow: { marginTop: 8, gap: 8 },
    navRow: { marginTop: 12, gap: 10 },
    chipWrap: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
      marginTop: 12,
    },
    chip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    chipOn: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    chipText: { color: colors.ink, fontSize: 14, fontWeight: "600" as const },
    chipTextOn: { color: colors.moss },
    noteInput: {
      minHeight: 110,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      padding: 14,
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      textAlignVertical: "top" as const,
      marginTop: 10,
    },
    charCount: {
      color: colors.muted,
      fontSize: 12,
      alignSelf: "flex-end" as const,
    },
    summaryCard: {
      backgroundColor: colors.paper,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 16,
      gap: 6,
      marginTop: 8,
    },
    summaryLabel: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700" as const,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
      marginTop: 8,
    },
    summaryValue: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  };
}
