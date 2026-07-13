import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { TouchLanguageMap } from "../../components/TouchLanguageMap";
import {
  completenessOf,
  createDefaultTouchLanguage,
  summarizeForDisplay,
  type TouchLanguageDocument,
} from "../../lib/touchLanguageCore";
import { touchLanguageStore } from "../../services/touchLanguageStore";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

/**
 * Touch Language hub — visual overview of the full preference map.
 * Local-first; never consent to touch.
 */
export default function TouchLanguageHubScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [doc, setDoc] = useState<TouchLanguageDocument>(
    createDefaultTouchLanguage(),
  );
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void touchLanguageStore.loadOrDefault().then((value) => {
        if (active) {
          setDoc(value);
          setLoaded(true);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const summary = summarizeForDisplay(doc);
  const complete = completenessOf(doc);

  return (
    <Screen>
      <Eyebrow>TOUCH LANGUAGE</Eyebrow>
      <Title>How you like to be touched — in clear language.</Title>
      <Body muted>
        Pressure, speed, duration, areas, hard limits, and soft limits. Saved on
        this device. A map is never consent — every session still needs a fresh
        Consent Snapshot.
      </Body>

      {!loaded ? (
        <Body muted>Loading your private map…</Body>
      ) : (
        <>
          <Card>
            <Text style={styles.meta}>
              {complete.zonesNamed}/{complete.zonesTotal} zones named ·{" "}
              {complete.isMinimallyComplete ? "Ready to share" : "Keep building"}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.k}>Pressure · </Text>
              {summary.pressure}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.k}>Speed · </Text>
              {summary.speed}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.k}>Duration · </Text>
              {summary.duration}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.k}>Places · </Text>
              {summary.environments}
            </Text>
            <Text style={styles.row}>
              <Text style={styles.k}>Holds · </Text>
              {summary.holds || "None chosen"}
            </Text>
          </Card>

          <TouchLanguageMap document={doc} />

          <Card>
            <Text style={styles.section}>Hard limits</Text>
            <Body muted>{summary.hardLimits}</Body>
            <Text style={[styles.section, { marginTop: 12 }]}>Soft limits</Text>
            <Body muted>{summary.softLimits}</Body>
          </Card>

          <View style={styles.safety}>
            <Text style={styles.safetyTitle}>Your profile is not consent.</Text>
            <Text style={styles.safetyBody}>
              Sharing a map only lets someone review preferences. Soft Signal and
              a session-specific snapshot still govern real contact.
            </Text>
          </View>

          <Button
            label="Edit full Touch Language"
            onPress={() => router.push("/touch-language/edit" as never)}
          />
          <Button
            variant="secondary"
            label="Secure share with a partner"
            onPress={() => router.push("/touch-language/share" as never)}
            accessibilityHint="Creates an encrypted, time-limited share. Partner must accept. Never consent to touch."
          />
          <Button
            variant="secondary"
            label="Body-zone onboarding walkthrough"
            onPress={() => router.push("/onboarding/boundaries" as never)}
          />
        </>
      )}
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    meta: {
      color: colors.moss,
      fontSize: 13,
      fontWeight: "700" as const,
      marginBottom: 10,
    },
    row: { color: colors.ink, fontSize: 15, lineHeight: 22, marginBottom: 4 },
    k: { fontWeight: "700" as const, color: colors.muted },
    section: {
      fontFamily: fonts.headline,
      fontSize: 20,
      color: colors.ink,
      marginBottom: 4,
    },
    safety: {
      backgroundColor: colors.plumSoft,
      borderRadius: 18,
      padding: 18,
      gap: 5,
      marginTop: 4,
    },
    safetyTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" as const },
    safetyBody: { color: colors.muted, lineHeight: 21 },
  };
}
