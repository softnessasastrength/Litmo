import { useRouter } from "expo-router";
import { Linking } from "react-native";
import { Body, Button, Eyebrow, Screen, Title } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { SensitiveAccessGate } from "../components/SensitiveAccessGate";

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
        This is a placeholder. Real settings (notifications, privacy, account
        management) will live here as Litmo grows.
      </Body>
      <Button
        variant="secondary"
        label="softnessasastrength.com"
        onPress={() => void Linking.openURL("https://softnessasastrength.com")}
      />
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
