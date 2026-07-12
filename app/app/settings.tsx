import { useRouter } from "expo-router";
import { Linking } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { SensitiveAccessGate } from "../components/SensitiveAccessGate";
import { runtimeConfig } from "../config/runtime";

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
