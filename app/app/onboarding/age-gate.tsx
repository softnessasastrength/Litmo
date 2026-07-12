import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { runtimeConfig } from "../../config/runtime";
import { ageGateService } from "../../services/ageGateService";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

/**
 * Adult eligibility gate after account auth / onboarding.
 * Uses Apple Declared Age Range when available; development self-attest
 * only outside production when the native API is unavailable.
 */
export default function AgeGateScreen() {
  const styles = useThemedStyles(makeStyles);
  const { user, refreshProfile, status } = useAuth();
  const [busy, setBusy] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [message, setMessage] = useState("");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    void ageGateService.isNativeAvailable().then(setNativeAvailable);
  }, []);

  const finish = async () => {
    await refreshProfile();
  };

  const requestApple = async () => {
    if (!user) return;
    setBusy(true);
    setMessage("");
    setBlocked(false);
    try {
      const result = await ageGateService.requestAppleAdultSignal();
      const recorded = await ageGateService.recordSignal(result);
      if (recorded.isAdult) {
        await finish();
        return;
      }
      setBlocked(true);
      setMessage(
        result.message ??
          "Litmo is for adults 18+. An adult age range was not confirmed.",
      );
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Age confirmation could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const selfAttestDev = async () => {
    if (!user) return;
    setBusy(true);
    setMessage("");
    try {
      await ageGateService.developmentSelfAttestAdult();
      await finish();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Development self-attest failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (status === "demo") {
    return (
      <Screen>
        <Eyebrow>DEMO</Eyebrow>
        <Title>No age check in demo mode.</Title>
        <Body muted>
          Demo mode uses fictional data only and does not run Apple age range
          requests.
        </Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Eyebrow>ADULTS ONLY</Eyebrow>
      <Title>Confirm you are 18 or older.</Title>
      <Body muted>
        Litmo is for consenting adults. On iPhone, we ask Apple for a privacy-
        preserving age range — not your birthday, not an ID scan, and not Face
        ID as proof of age.
      </Body>
      <View style={styles.notice} accessible accessibilityRole="text">
        <Text style={styles.noticeTitle}>What we store</Text>
        <Text style={styles.noticeBody}>
          Only a coarse result (adult / not adult / declined) and optional range
          bounds. This is eligibility, not a safety or trust score.
        </Text>
      </View>
      <Button
        label={
          busy
            ? "Checking…"
            : nativeAvailable
              ? "Continue with Apple age range"
              : "Try Apple age range"
        }
        disabled={busy}
        onPress={() => void requestApple()}
        accessibilityHint="Opens the system age range sheet when available"
      />
      {!nativeAvailable && !runtimeConfig.isProduction ? (
        <>
          <Body muted center>
            This build cannot use Declared Age Range (Expo Go, simulator, or
            older iOS). Development self-attest is available only outside
            production.
          </Body>
          <Button
            variant="secondary"
            label="Development: I confirm I am 18+"
            disabled={busy}
            onPress={() => void selfAttestDev()}
            accessibilityHint="Development-only adult self-attestation. Not used in production."
          />
        </>
      ) : null}
      {blocked ? (
        <View style={styles.blocked} accessible accessibilityRole="alert">
          <Text style={styles.blockedTitle}>Access not available</Text>
          <Text style={styles.blockedBody}>{message}</Text>
        </View>
      ) : null}
      {message && !blocked ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {message}
        </Text>
      ) : null}
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    notice: {
      gap: 6,
      borderLeftWidth: 4,
      borderLeftColor: colors.moss,
      backgroundColor: colors.mossSoft,
      padding: 14,
      marginVertical: 8,
    },
    noticeTitle: { color: colors.ink, fontWeight: "800", fontSize: 14 },
    noticeBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
    blocked: {
      gap: 6,
      borderLeftWidth: 4,
      borderLeftColor: colors.signal,
      backgroundColor: colors.signalSoft,
      padding: 14,
      marginTop: 12,
    },
    blockedTitle: { color: colors.ink, fontWeight: "800", fontSize: 14 },
    blockedBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
    error: { color: colors.signal, lineHeight: 21, marginTop: 8 },
  };
}
