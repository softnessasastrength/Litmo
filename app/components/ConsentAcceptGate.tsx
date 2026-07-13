/**
 * Share / post-tap accept gate — explicit Accept + equal Decline.
 * Scan/decode never opens content without this.
 */

import { Text, View } from "react-native";
import { Button } from "./ui";
import {
  CONSENT_POINTS,
  type ConsentPointId,
  assertConsentPoint,
} from "../lib/consentInteractionCore";
import { fonts, radius, type AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";

type Props = {
  pointId: ConsentPointId;
  disclaimer: string;
  onAccept: () => void;
  onDecline: () => void;
  acceptLabel?: string;
  declineLabel?: string;
  busy?: boolean;
};

export function ConsentAcceptGate({
  pointId,
  disclaimer,
  onAccept,
  onDecline,
  acceptLabel,
  declineLabel,
  busy,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const spec = assertConsentPoint(pointId);

  return (
    <View style={styles.wrap} accessible={false}>
      <View style={styles.banner} accessible accessibilityRole="text">
        <Text style={styles.bannerTitle}>EXPLICIT ACCEPT REQUIRED</Text>
        <Text style={styles.bannerBody}>{disclaimer}</Text>
        <Text style={styles.never}>
          Never means: {spec.neverMeans.slice(0, 2).join(" · ")}
        </Text>
      </View>
      <Button
        label={acceptLabel ?? spec.copy.primary}
        onPress={onAccept}
        disabled={busy}
        accessibilityLabel={spec.a11yLabel}
        accessibilityHint={spec.a11yHint}
      />
      <Button
        variant="signal"
        label={
          declineLabel ??
          CONSENT_POINTS.request_decline.copy.primary + " — no explanation needed"
        }
        onPress={onDecline}
        disabled={busy}
        accessibilityLabel={CONSENT_POINTS.request_decline.a11yLabel}
        accessibilityHint={CONSENT_POINTS.request_decline.a11yHint}
      />
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return {
    wrap: { gap: 12 },
    banner: {
      backgroundColor: colors.mossSoft,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.moss,
      padding: 14,
      gap: 6,
    },
    bannerTitle: {
      color: colors.moss,
      fontSize: 11,
      fontWeight: "800" as const,
      letterSpacing: 1,
    },
    bannerBody: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: fonts.headline,
    },
    never: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
    },
  };
}
