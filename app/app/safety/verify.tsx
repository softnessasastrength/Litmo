import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  PARTNER_VERIFICATION_CHECKS,
  VERIFICATION_COPY,
  type PartnerVerificationCheckId,
} from "../../lib/traumaSafetyCore";
import { traumaSafetyService } from "../../services/traumaSafetyService";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

/**
 * Present-moment partner / self diligence checks.
 * Never a safety certificate, identity proof, or consent substitute.
 */
export default function PartnerVerifyScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [selected, setSelected] = useState<Set<PartnerVerificationCheckId>>(
    new Set(),
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (id: PartnerVerificationCheckId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      await traumaSafetyService.saveVerification([...selected]);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>PRESENT-MOMENT CHECKS</Eyebrow>
      <Title>{VERIFICATION_COPY.title}</Title>
      <Body muted>{VERIFICATION_COPY.body}</Body>

      <Card>
        <Text style={styles.warn} accessibilityRole="text">
          Completing these never means anyone is safe, verified by Litmo, or
          that touch is authorized. Soft Signal still ends everything
          immediately.
        </Text>
      </Card>

      {PARTNER_VERIFICATION_CHECKS.map((check) => {
        const on = selected.has(check.id);
        return (
          <Pressable
            key={check.id}
            onPress={() => toggle(check.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={check.label}
            style={[styles.row, on && styles.rowOn]}
          >
            <View style={[styles.box, on && styles.boxOn]}>
              <Text style={styles.boxMark}>{on ? "✓" : ""}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.label}>{check.label}</Text>
              <Text style={styles.detail}>{check.detail}</Text>
            </View>
          </Pressable>
        );
      })}

      <Body muted>
        {selected.size === 0
          ? VERIFICATION_COPY.incomplete
          : `${selected.size} of ${PARTNER_VERIFICATION_CHECKS.length} noted for you.`}
      </Body>

      <Button
        label={busy ? "Saving…" : saved ? "Saved privately" : "Save privately"}
        onPress={() => void save()}
        disabled={busy || selected.size === 0}
      />
      <Button
        variant="secondary"
        label="Practice Soft Signal"
        onPress={() => router.push("/soft-signal/practice" as never)}
      />
      <Button
        variant="secondary"
        label="Consent Snapshot prepare"
        onPress={() => router.push("/consent-snapshot/prepare" as never)}
      />
      <Button variant="secondary" label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    warn: {
      color: colors.moss,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600" as const,
    },
    row: {
      flexDirection: "row" as const,
      gap: 12,
      padding: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      minHeight: 64,
    },
    rowOn: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    box: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.line,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: 2,
    },
    boxOn: {
      borderColor: colors.moss,
      backgroundColor: colors.moss,
    },
    boxMark: { color: colors.white, fontWeight: "800" as const, fontSize: 14 },
    copy: { flex: 1, gap: 4 },
    label: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: fonts.headline,
    },
    detail: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  };
}
