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
  const { prefs: neuroPrefs, setEnabled: setNeuroEnabled } = useNeurodivergent();
  const [isStaff, setIsStaff] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void hapticService.isEnabled().then((on) => {
      if (!cancelled) setHapticsOn(on);
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
            Global for the whole app: larger text and tap targets, reduced
            motion, one question or learning step at a time, clear language,
            easy on-device saves, read-aloud, and keyboard-dictation voice aids
            on Quizzes and Guided Learning. Device-local only. Never matching,
            trust, or consent authority. Turning on quiets haptics by default —
            re-enable below if you want them.
          </Body>
        </View>
        <Switch
          accessibilityLabel="Neurodivergent Mode"
          accessibilityHint="Turns on larger text, reduced motion, one step at a time, easy saves, read aloud, and voice dictation aids across the app"
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
        variant="secondary"
        label="Passkeys and registered devices"
        onPress={() => router.push("/security/devices" as never)}
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
            label="Export my data"
            onPress={() => router.push("/security/data-export" as never)}
            accessibilityHint="Generate and share a private structured copy of your Litmo data"
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
