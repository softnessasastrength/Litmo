import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { runtimeConfig } from "../../config/runtime";
import { ageGateService } from "../../services/ageGateService";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

/**
 * WHAT: Adult eligibility gate (`/onboarding/age-gate`) after real onboarding complete.
 * WHY: Real accounts must confirm 18+ via Apple Declared Age Range (or dev-only
 *   self-attest outside production when native API is unavailable). Demo skips entirely.
 * CONSENT: `onboard_age_apple_range` (prepare), `onboard_age_dev_attest` (prepare, dev).
 *   Authorizes coarse adult eligibility only. Age self-report in About You ≠ this signal.
 * EDGE CASES:
 *   - status === "demo" → explainer only; no Apple sheet.
 *   - User declines sheet → error message; stay on gate; retry allowed.
 *   - Not adult range → blocked alert; no home.
 *   - Production without native → no self-attest (stuck until native available) — fail-closed.
 *   - !user on handlers → no-op (cannot record eligibility without session).
 * NEVER: Store exact birthday; Face ID as age proof; trust/safety score from range;
 *   substitute About You self-report for this gate; claim clinical/legal approval.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §11.3 · ADR 0025 · CONSENT_POINTS onboard_age_*
 */
export default function AgeGateScreen() {
  const styles = useThemedStyles(makeStyles);
  const { user, refreshProfile, status } = useAuth();
  const [busy, setBusy] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [message, setMessage] = useState("");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Probe once: decides label + whether dev self-attest may appear.
    void ageGateService.isNativeAvailable().then(setNativeAvailable);
  }, []);

  /**
   * WHAT: Re-reads profile so auth reducer can move age_gate → authenticated when adult.
   * WHY: Recording the signal alone does not update client status without refresh.
   * CONSENT: Not a grant — only reloads eligibility state for routing.
   * EDGE CASES: Caller already recorded adult signal; refresh may still leave age_gate if not adult.
   * NEVER: Force home without isAdult; invent eligibility on refresh failure (Auth handles error).
   * SEE: authReducer RESTORED order · protectedRouteFor age_gate
   */
  const finish = async () => {
    await refreshProfile();
  };

  /**
   * WHAT: Requests Apple Declared Age Range, records coarse result, finishes if adult.
   * WHY: Privacy-preserving adult check without birthday or ID scan.
   * CONSENT: `onboard_age_apple_range` — prepare eligibility. Not touch consent.
   * EDGE CASES:
   *   - !user → return (fail-closed; nothing to attach signal to).
   *   - recorded.isAdult false → blocked UI; stay.
   *   - Throw (decline / network) → message, not blocked banner (unless range not adult).
   * NEVER: Store birthday; treat Face ID biometrics as age; score trust from range.
   * SEE: ageGateService.requestAppleAdultSignal · recordSignal
   */
  const requestApple = async () => {
    // Fail-closed: no session → no eligibility write.
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
      // Explicit non-adult: block access; do not route to home.
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

  /**
   * WHAT: Development-only adult self-attest when native Declared Age Range is unavailable.
   * WHY: Unblocks local dev (Expo Go / simulator) without shipping production bypass.
   * CONSENT: `onboard_age_dev_attest` — prepare, offline, non-production only.
   * EDGE CASES: !user → no-op; service may refuse if production (defense in depth).
   * NEVER: Show or honor this path in production builds; equate with Apple range for trust.
   * SEE: runtimeConfig.isProduction · ageGateService.developmentSelfAttestAdult
   */
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

  // Demo never runs Apple age range — self-report on About You is separate and local.
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
      {/* onboard_age_apple_range — busy disables double-submit; not grant arm. */}
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
      {/* Fail-closed production: no self-attest when native missing. Dev-only escape hatch. */}
      {!nativeAvailable && !runtimeConfig.isProduction ? (
        <>
          <Body muted center>
            This build cannot use Declared Age Range (Expo Go, simulator, or
            older iOS). Development self-attest is available only outside
            production.
          </Body>
          {/* onboard_age_dev_attest — NEVER production. */}
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

/**
 * WHAT: Theme styles for eligibility notice, blocked alert, and error text.
 * WHY: Blocked state uses signal rail; notice uses moss — eligibility, not Soft Signal stop.
 * CONSENT: Not a consent surface.
 * EDGE CASES: none — pure style factory.
 * NEVER: Style blocked as “you may continue anyway”.
 * SEE: docs/ONBOARDING_CONSENT_FLOW.md §11.3
 */
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
