import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import {
  getProximityPrefs,
  setProximityPrefs,
  type ProximityPrefs,
} from "../../services/proximityPreference";
import { defaultProximityPrefs } from "../../services/proximityPreferenceCore";
import {
  getNearbyShareEnabled,
  setNearbyShareEnabled,
} from "../../services/localSharePreference";
import { softSignalService } from "../../services/softSignalService";
import { proximityService } from "../../services/proximityService";
import { localShareService } from "../../services/localShareService";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { runtimeConfig } from "../../config/runtime";

/**
 * Proximity Layer hub — extreme consent gating before any radio path.
 * Radar · NFC · QR · AirDrop-style Multipeer share.
 *
 * App Store Safe Mode: proximityRadar feature is off — show honest unavailable
 * screen instead of advertising RF. Maximum Mode keeps full stack.
 * SEE: docs/BUILD_MODES.md
 */
export default function ProximityHubScreen() {
  // Compile-time feature gate — App Store binary does not offer RF radar UI.
  if (!runtimeConfig.features.proximityRadar) {
    return (
      <Screen>
        <Eyebrow>NEARBY</Eyebrow>
        <Title>Nearby discovery is not available in this build.</Title>
        <Body muted>
          This App Store build focuses on accounts, preferences, boundaries, and
          session consent without continuous nearby radio. The full Proximity
          Layer remains in Maximum Mode builds (macOS / Linux / internal).
        </Body>
      </Screen>
    );
  }
  return (
    <SensitiveAccessGate>
      <ProximityHubContent />
    </SensitiveAccessGate>
  );
}

function ProximityHubContent() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [prefs, setPrefs] = useState<ProximityPrefs>(defaultProximityPrefs);
  const [nearbyOn, setNearbyOn] = useState(false);
  const [gateA, setGateA] = useState(false);
  const [gateB, setGateB] = useState(false);
  const [gateC, setGateC] = useState(false);
  const [ssState, setSsState] = useState<"idle" | "stopping" | "stopped">(
    "idle",
  );

  useFocusEffect(
    useCallback(() => {
      void getProximityPrefs().then(setPrefs);
      void getNearbyShareEnabled().then(setNearbyOn);
    }, []),
  );

  const gatesOk = gateA && gateB && gateC;
  const canOpenPaths = prefs.enabled && gatesOk;

  const saveMaster = async (enabled: boolean) => {
    const next = { ...prefs, enabled };
    setPrefs(next);
    await setProximityPrefs(next);
    if (!enabled) {
      setGateA(false);
      setGateB(false);
      setGateC(false);
    }
  };

  const softSignal = async () => {
    setSsState("stopping");
    // Tear down any active nearby radios/keys first (global hard stop).
    try {
      await proximityService.softSignal();
    } catch {
      // ignore — still fire Soft Signal and kill master
    }
    try {
      await localShareService.stop("soft_signal");
    } catch {
      // ignore
    }
    await softSignalService.fire({
      source: "practice",
      practiceOnly: true,
      surface: "mobile_app",
    });
    setSsState("stopped");
    await saveMaster(false);
  };

  return (
    <Screen>
      <Eyebrow>PROXIMITY LAYER</Eyebrow>
      <Title>Nearby only with extreme care.</Title>
      <Body muted>
        Opt-in discovery, anonymous Touch Language compatibility percentages,
        NFC tap-to-connect, encrypted QR fallback, and AirDrop-style Multipeer
        share. Radio is off by default. Soft Signal exits anytime.
      </Body>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Extreme consent gating</Text>
        <Text style={styles.bannerBody}>
          · Off by default — no advertising or browsing{"\n"}
          · Anonymous until mutual identity consent{"\n"}
          · Compatibility % is preference resonance only — never safety{"\n"}
          · Soft Signal / leave is always easier than continue{"\n"}
          · Never auto-starts a session or grants touch
        </Text>
      </View>

      <Card>
        <Body>
          {prefs.enabled
            ? "Master proximity: ON for this device"
            : "Master proximity: OFF (default)"}
        </Body>
        <Body muted>
          When off, Litmo does not run radar, NFC advertise, or Multipeer browse
          from this hub.
        </Body>
        <Button
          variant={prefs.enabled ? "secondary" : "primary"}
          label={
            prefs.enabled
              ? "Turn proximity master OFF"
              : "Allow proximity on this device"
          }
          onPress={() => void saveMaster(!prefs.enabled)}
        />
      </Card>

      {prefs.enabled ? (
        <Card>
          <Text style={styles.section}>Confirm before any path</Text>
          <Body muted>
            You must affirm all three. This is intentional friction.
          </Body>
          <Choice
            label="I understand nearby % is not safety or consent"
            selected={gateA}
            onPress={() => setGateA((v) => !v)}
          />
          <Choice
            label="I will not pressure anyone who Soft-Signals or declines"
            selected={gateB}
            onPress={() => setGateB((v) => !v)}
          />
          <Choice
            label="I accept Soft Signal may end nearby presence instantly"
            selected={gateC}
            onPress={() => setGateC((v) => !v)}
          />
        </Card>
      ) : null}

      <SoftSignalButton
        state={ssState}
        showBanner
        onPress={() => void softSignal()}
        disabled={ssState !== "idle"}
      />

      <Text style={styles.section}>Paths (after gates)</Text>

      <Button
        label="1 · Anonymous radar (+ TL compatibility %)"
        disabled={!canOpenPaths}
        onPress={() => router.push("/proximity/radar" as never)}
        accessibilityHint="Opens Multipeer anonymous radar with weather resonance and optional Touch Language shape compatibility. Soft Signal anytime."
      />
      <Body muted>
        Anonymous tokens only. Shows weather resonance and anonymous Touch
        Language shape % when both devices opt to broadcast coarse TL axes (no
        body zones on the wire).
      </Body>

      <Button
        variant="secondary"
        label="2 · NFC tap-to-connect"
        disabled={!canOpenPaths}
        onPress={() => router.push("/nfc/connect" as never)}
        accessibilityHint="NFC careful connect with Accept after every scan. Falls back to QR."
      />

      <Button
        variant="secondary"
        label="3 · QR / manual careful connect"
        disabled={!canOpenPaths}
        onPress={() =>
          router.push({
            pathname: "/nfc/connect",
            params: { intent: "profile_share" },
          } as never)
        }
        accessibilityHint="Encrypted QR and paste fallback when NFC is unavailable."
      />

      <Button
        variant="secondary"
        label="4 · AirDrop-style Multipeer share"
        disabled={!canOpenPaths || !nearbyOn}
        onPress={() => router.push("/share/local" as never)}
        accessibilityHint="Intentional nearby payload share for profile or Consent Snapshot review. Never session activation."
      />
      <Body muted>
        Nearby Share master: {nearbyOn ? "on" : "off"}.{" "}
        {!nearbyOn
          ? "Enable in Settings → Open Nearby Share preferences, or toggle below."
          : "Payload share still requires Accept."}
      </Body>
      <Button
        variant="secondary"
        label={
          nearbyOn
            ? "Turn AirDrop-style share off"
            : "Allow AirDrop-style share on this device"
        }
        onPress={() => {
          const next = !nearbyOn;
          setNearbyOn(next);
          void setNearbyShareEnabled(next);
        }}
      />

      <Button
        variant="secondary"
        label="Touch Language (feeds anonymous %) "
        onPress={() => router.push("/touch-language" as never)}
      />
      <Button variant="secondary" label="Home" onPress={() => router.back()} />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    banner: {
      backgroundColor: colors.signalSoft,
      borderColor: colors.signal,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 6,
      marginBottom: 4,
    },
    bannerTitle: {
      color: colors.signal,
      fontWeight: "800" as const,
      fontSize: 12,
      letterSpacing: 0.5,
      textTransform: "uppercase" as const,
    },
    bannerBody: { color: colors.ink, lineHeight: 22, fontSize: 14 },
    section: {
      fontFamily: fonts.headline,
      fontSize: 22,
      color: colors.ink,
      marginTop: 12,
      marginBottom: 6,
    },
  };
}
