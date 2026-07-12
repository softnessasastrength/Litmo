import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Linking } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { SensitiveAccessGate } from "../components/SensitiveAccessGate";
import { runtimeConfig } from "../config/runtime";
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
  const [isStaff, setIsStaff] = useState(false);

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
        label="Passkeys and registered devices"
        onPress={() => router.push("/security/devices" as never)}
      />
      {status === "authenticated" ? (
        <>
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
          {isStaff ? (
            <Button
              variant="secondary"
              label="Moderation queue (staff)"
              onPress={() => router.push("/security/moderation" as never)}
              accessibilityHint="Staff-only human review queue for structured reports"
            />
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
