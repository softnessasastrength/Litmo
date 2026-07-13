import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Linking, Switch, View } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNeurodivergent } from "../context/NeurodivergentContext";
import { SensitiveAccessGate } from "../components/SensitiveAccessGate";
import { runtimeConfig } from "../config/runtime";
import { hapticService } from "../services/hapticService";
import { moderationService } from "../services/moderationService";
import {
  getNearbyShareEnabled,
  setNearbyShareEnabled,
} from "../services/localSharePreference";
import { localShareService } from "../services/localShareService";

export default function SettingsScreen() {
  return (
    <SensitiveAccessGate>
      <SettingsContent />
    </SensitiveAccessGate>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { status, signOut } = useAuth();
  const { scheme, resolvedScheme, cycleScheme, colors } = useTheme();
  const {
    prefs: neuroPrefs,
    setEnabled: setNeuroEnabled,
    cyclePace,
    cycleSensory,
    cycleHaptics,
    cycleLanguage,
    cycleOverloadExit,
    cycleMotion,
    paceMode,
    sensoryProfile,
    hapticIntensity,
    languagePreference,
    overloadExitMode,
    motionPreference,
  } = useNeurodivergent();
  const [isStaff, setIsStaff] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [nearbyShareOn, setNearbyShareOn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void hapticService.isEnabled().then((on) => {
      if (!cancelled) setHapticsOn(on);
    });
    void getNearbyShareEnabled().then((on) => {
      if (!cancelled) setNearbyShareOn(on);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setIsStaff(false);
      return;
    }
    let cancelled = false;
    void moderationService.amIStaffModerator().then((staff) => {
      if (!cancelled) setIsStaff(staff);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <Screen>
      <Eyebrow>SETTINGS</Eyebrow>
      <Title>Your device, your comfort.</Title>
      <Body muted>
        Preferences stay on this phone. Security changes need a fresh device
        owner check. Nothing here is a score or consent gate.
      </Body>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Body>
            {neuroPrefs.enabled
              ? "Neurodivergent Mode on"
              : "Neurodivergent Mode off"}
          </Body>
          <Body muted>
            Inclusive design for the whole app: larger text, reduced motion,
            progressive disclosure, customizable pace, clear progress, easy
            breaks, one step at a time, voice read-aloud and dictation aids, and
            easy on-device saves — especially on Vibe Quiz and Guided Learning.
            Device-local only. Calm and respectful — never matching, trust, or
            consent authority. Turning on quiets haptics by default.
          </Body>
        </View>
        <Switch
          accessibilityLabel="Neurodivergent Mode"
          accessibilityHint="Turns on larger text, reduced motion, your own pace, progressive detail, easy breaks, clear progress, and voice aids"
          trackColor={{ false: colors.line, true: colors.mossSoft }}
          thumbColor={neuroPrefs.enabled ? colors.moss : colors.white}
          ios_backgroundColor={colors.line}
          onValueChange={(next) => {
            void setNeuroEnabled(next).then(() => {
              if (next) setHapticsOn(false);
            });
          }}
          value={neuroPrefs.enabled}
        />
      </View>

      {neuroPrefs.enabled ? (
        <>
          <Body muted>
            Second-level accommodations stay on this phone. Change any axis
            without turning the whole mode off. Soft Signal and consent rules
            never change.
          </Body>
          <Button
            variant="secondary"
            label={
              paceMode === "confirm"
                ? "Pace: you confirm (recommended)"
                : paceMode === "slow"
                  ? "Pace: slower auto-advance"
                  : "Pace: brief auto-advance"
            }
            onPress={() => void cyclePace()}
            accessibilityHint="Cycles quiz pace: confirm to continue, slow auto-advance, or brief auto-advance"
          />
          <Button
            variant="secondary"
            label={
              sensoryProfile === "low"
                ? "Sensory profile: low stimulation"
                : sensoryProfile === "variable"
                  ? "Sensory profile: variable day"
                  : "Sensory profile: balanced"
            }
            onPress={() => void cycleSensory()}
            accessibilityHint="Cycles sensory density preference for chrome and auto-advance"
          />
          <Button
            variant="secondary"
            label={
              motionPreference === "reduced"
                ? "Motion: reduced"
                : "Motion: standard"
            }
            onPress={() => void cycleMotion()}
            accessibilityHint="Cycles reduced motion preference. System Reduce Motion is always honored."
          />
          <Button
            variant="secondary"
            label={
              hapticIntensity === "off"
                ? "Haptics intensity: off"
                : hapticIntensity === "minimal"
                  ? "Haptics intensity: stop signals only"
                  : "Haptics intensity: standard"
            }
            onPress={() => void cycleHaptics()}
            accessibilityHint="Cycles haptic intensity. Minimal keeps Soft Signal feedback only."
          />
          <Button
            variant="secondary"
            label={
              languagePreference === "plain"
                ? "Language: plain and short"
                : languagePreference === "detailed"
                  ? "Language: more detail"
                  : "Language: standard"
            }
            onPress={() => void cycleLanguage()}
            accessibilityHint="Cycles how much explainer text chrome shows. Consent meaning never softens."
          />
          <Button
            variant="secondary"
            label={
              overloadExitMode === "break"
                ? "Overload exit: take a break (saved)"
                : overloadExitMode === "home"
                  ? "Overload exit: leave to Home"
                  : "Overload exit: calm cover / safety tools"
            }
            onPress={() => void cycleOverloadExit()}
            accessibilityHint="Cycles where overload exit goes. Session panic path still uses Soft Signal first."
          />
          <Body muted>
            Confirm pace waits for you. Low sensory reduces simultaneous chrome.
            Overload exits never require a reason and never show to a peer.
          </Body>
        </>
      ) : null}

      <Button
        variant="secondary"
        label={
          scheme === "system"
            ? "Appearance: system"
            : scheme === "dark"
              ? "Appearance: dark"
              : "Appearance: light"
        }
        onPress={cycleScheme}
        accessibilityHint="Cycles light, dark, and follow system appearance. Preference stays on this device."
      />
      <Body muted>
        {scheme === "system"
          ? `Following your phone (${resolvedScheme}). Safety colors stay distinct; meaning is never color-only.`
          : scheme === "dark"
            ? "Dark mode softens the surface for low light. Safety colors stay distinct; meaning is never color-only."
            : "Light mode is the default cream journal surface. Switch anytime on this device only."}
      </Body>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Body>{hapticsOn ? "Haptics on" : "Haptics off"}</Body>
          <Body muted>
            Haptics are a local optional vocabulary (presence, attention,
            confirm, Soft Signal). They never mean another person agreed or is
            present.
          </Body>
        </View>
        <Switch
          accessibilityLabel="Haptics"
          accessibilityHint="Disables or enables local haptic feedback. Spoken and visible feedback remain."
          trackColor={{ false: colors.line, true: colors.mossSoft }}
          thumbColor={hapticsOn ? colors.moss : colors.white}
          ios_backgroundColor={colors.line}
          onValueChange={(next) => {
            setHapticsOn(next);
            void hapticService.setEnabled(next);
          }}
          value={hapticsOn}
        />
      </View>
      <Button
        variant="signal"
        label="Exorcism Dojo (not a product)"
        onPress={() => router.push("/dojo" as never)}
        accessibilityHint="Private ritual surface: defense inventory, urge log, burn readiness. Not a consumer feature."
      />
      <Body muted>
        THIS IS A PRIVATE EXORCISM ARTIFACT, NOT A PRODUCT. Open the Dojo to
        name fears before building more cage bars.
      </Body>
      <Button
        variant="secondary"
        label="Passkeys and registered devices"
        onPress={() => router.push("/security/devices" as never)}
      />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Body>
            {nearbyShareOn
              ? "Nearby share allowed"
              : "Nearby share off (default)"}
          </Body>
          <Body muted>
            AirDrop-style Multipeer exchange for discovery profiles and
            co-located Consent Snapshot reviews. Off by default. Radio only
            while you open Nearby Share. Easy stop. Never consent to touch.
            Requires an iOS development build (not Expo Go).
          </Body>
        </View>
        <Switch
          accessibilityLabel="Nearby share"
          accessibilityHint="Master opt-in for Multipeer nearby share. Default is off."
          trackColor={{ false: colors.line, true: colors.mossSoft }}
          thumbColor={nearbyShareOn ? colors.moss : colors.white}
          ios_backgroundColor={colors.line}
          onValueChange={(next) => {
            setNearbyShareOn(next);
            void setNearbyShareEnabled(next).then(() => {
              if (!next) void localShareService.stop("settings_opt_out");
            });
          }}
          value={nearbyShareOn}
        />
      </View>
      <Button
        variant="secondary"
        label="Open Nearby Share"
        onPress={() => router.push("/share/local" as never)}
        accessibilityHint="Open the intentional nearby share screen for profiles or snapshot review"
      />
      <Button
        variant="secondary"
        label="Proximity Layer hub (radar · NFC · QR)"
        onPress={() => router.push("/proximity" as never)}
        accessibilityHint="Opens the proximity hub with extreme consent gates before radar, NFC, or Multipeer. Soft Signal exits. Never consent to touch."
      />
      <Button
        variant="secondary"
        label="Touch Language (full map)"
        onPress={() => router.push("/touch-language" as never)}
        accessibilityHint="Pressure, speed, duration, body map, hard and soft limits. Local save and secure partner share."
      />
      <Button
        variant="secondary"
        label="Soft Signal practice & private log"
        onPress={() => router.push("/soft-signal/practice" as never)}
        accessibilityHint="Practice Soft Signal and view private exit records on this device."
      />
      <Button
        variant="secondary"
        label="Local-first vault & encrypted backup"
        onPress={() => router.push("/security/local-first" as never)}
        accessibilityHint="Personal data stays on this device first. Optional opaque encrypted cloud backup is off by default."
      />
      <Button
        variant="secondary"
        label="Trauma-informed safety tools"
        onPress={() => router.push("/safety" as never)}
        accessibilityHint="Panic mode, quick exit, session timeout, partner checks, private reflection. Soft Signal is always available."
      />
      <Body muted>
        Touch Language, Consent Snapshots, Soft Signal history, learning, and
        private history work fully offline. Cloud backup is optional ciphertext
        only — never required for the app to work.
      </Body>

      <Body>Privacy & data protection</Body>
      <Body muted>
        Privacy by design, transparent notices, export, and erasure. Sensitive
        touch and consent data are prioritized. See docs/GDPR.md.
      </Body>
      <Button
        variant="secondary"
        label="Privacy Policy"
        onPress={() => router.push("/privacy/policy" as never)}
        accessibilityHint="Opens the in-app privacy notice"
      />
      <Button
        variant="secondary"
        label="Data protection & rights"
        onPress={() => router.push("/privacy/data-protection" as never)}
        accessibilityHint="Opens GDPR-aligned rights and sensitive-data explanation"
      />
      <Button
        variant="secondary"
        label="Export my data"
        onPress={() => router.push("/security/data-export" as never)}
        accessibilityHint="Generate and share a private structured copy of your Litmo data"
      />
      <Button
        variant="secondary"
        label="Delete or wipe my data"
        onPress={() => router.push("/privacy/delete-data" as never)}
        accessibilityHint="Wipe this device and request account erasure"
      />

      {status === "authenticated" ? (
        <>
          <Button
            variant="secondary"
            label="Private-alpha access"
            onPress={() => router.push("/security/private-alpha" as never)}
            accessibilityHint="Check admission or redeem a private-alpha invitation"
          />
          <Button
            variant="secondary"
            label="Blocked accounts"
            onPress={() => router.push("/security/blocked" as never)}
            accessibilityHint="View and unblock accounts you have privately blocked"
          />
          <Button
            variant="secondary"
            label="My reports"
            onPress={() => router.push("/security/reports" as never)}
            accessibilityHint="View private status of safety reports you submitted"
          />
          <Button
            variant="secondary"
            label="Your private signals"
            onPress={() => router.push("/security/trust-signals" as never)}
            accessibilityHint="View specific facts about your own account. Not a safety score."
          />
          <Button
            variant="secondary"
            label="Appeals"
            onPress={() => router.push("/security/appeals" as never)}
            accessibilityHint="Appeal an active matching hold or ban for human review"
          />
          {isStaff ? (
            <>
              <Button
                variant="secondary"
                label="Safety operations (staff)"
                onPress={() =>
                  router.push("/security/staff-operations" as never)
                }
                accessibilityHint="Staff-only private-alpha invitations and global matching pause"
              />
              <Button
                variant="secondary"
                label="Moderation queue (staff)"
                onPress={() => router.push("/security/moderation" as never)}
                accessibilityHint="Staff-only human review queue for structured reports"
              />
              <Button
                variant="secondary"
                label="Open appeals (staff)"
                onPress={() => router.push("/security/staff-appeals" as never)}
                accessibilityHint="Staff review of restriction appeals"
              />
            </>
          ) : null}
        </>
      ) : null}
      <Button
        variant="secondary"
        label="softnessasastrength.com"
        onPress={() => void Linking.openURL("https://softnessasastrength.com")}
      />
      {runtimeConfig.allowDiagnostics ? (
        <Button
          variant="secondary"
          label="Non-sensitive diagnostics"
          onPress={() => router.push("/diagnostics" as never)}
        />
      ) : null}
      <Button
        variant="secondary"
        label={status === "demo" ? "Exit demo mode" : "Sign out"}
        onPress={() => {
          void signOut();
          router.replace("/");
        }}
      />
    </Screen>
  );
}
