import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  demoBodyZones,
  type BoundaryStatus,
  usePrototype,
} from "../../context/PrototypeContext";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

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
    detail: "Not available for this person or this session",
  },
];

/**
 * Local body-zone boundary setup for the phone-visible path.
 * Does not grant consent; values stay in PrototypeContext only.
 */
export default function BoundariesScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { bodyBoundaries, setBodyBoundary } = usePrototype();
  const complete = demoBodyZones.every((zone) => bodyBoundaries[zone.id]);

  return (
    <Screen>
      <Eyebrow>BOUNDARIES · LOCAL ONLY</Eyebrow>
      <Title>Name what is welcomed, ask-first, or off limits.</Title>
      <Body muted>
        Color is not the only cue — each option has its own label. This is not
        consent. Every real session still needs a fresh Consent Snapshot.
      </Body>
      {demoBodyZones.map((zone) => (
        <View key={zone.id} style={styles.group} accessible>
          <Text style={styles.question}>{zone.label}</Text>
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
      <View style={styles.safety}>
        <Text style={styles.safetyTitle}>Missing means off limits.</Text>
        <Text style={styles.safetyBody}>
          Anything you leave unset, and every unlisted area, is treated as off
          limits in the demo. We never invent consent from silence.
        </Text>
      </View>
      <Button
        label="Save boundaries and continue"
        disabled={!complete}
        onPress={() => router.replace("/home")}
        accessibilityHint="Continues the demo with your local boundary choices. Nothing is uploaded."
      />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    group: { gap: 12, marginTop: 12 },
    question: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 25,
      lineHeight: 31,
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
  };
}
