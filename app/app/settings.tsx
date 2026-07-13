import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Linking } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
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
  const { scheme, resolvedScheme, cycleScheme } = useTheme();
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
      <Title>Not much here yet.</Title>
      <Body muted>
        Manage access without passwords. Security changes require a fresh
        device-owner check.
      </Body>
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
      <Button
        variant="secondary"
        label={hapticsOn ? "Haptics: on" : "Haptics: off"}
        onPress={() => {
          const next = !hapticsOn;
          setHapticsOn(next);
          void hapticService.setEnabled(next);
        }}
        accessibilityHint="Toggles local haptic feedback. Disabling suppresses all vibration while visible and spoken feedback remain."
      />
      <Body muted>
        Haptics are a local optional vocabulary (presence, attention, confirm,
        Soft Signal). They never mean another person agreed or is present.
      </Body>
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
                onPress={() => router.push("/security/staff-operations" as never)}
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
