import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { deviceRegistrationService } from "../../services/deviceRegistrationService";
import { mapExternalError } from "../../services/errors";
import { useColors } from "../../context/ThemeContext";

type Device = Awaited<
  ReturnType<typeof deviceRegistrationService.list>
>[number];

export default function DevicesScreen() {
  return (
    <SensitiveAccessGate>
      <DeviceList />
    </SensitiveAccessGate>
  );
}

function DeviceList() {
  const colors = useColors();
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setDevices(await deviceRegistrationService.list());
    } catch (caught) {
      setError(mapExternalError(caught).message);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return (
    <Screen>
      <Eyebrow>ACCOUNT SECURITY</Eyebrow>
      <Title>Your registered devices.</Title>
      <Body muted>
        Revocation is immediate in Litmo. A synced iCloud passkey may still
        exist in Apple Passwords; remove it there too if the device or Apple
        Account is compromised.
      </Body>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.signal }}>
          {error}
        </Text>
      ) : null}
      {devices.map((device) => (
        <View key={device.id} style={{ gap: 8 }}>
          <Body>{device.display_name}</Body>
          <Body muted>
            {device.revoked_at
              ? "Revoked"
              : `Last checked ${new Date(device.last_seen_at).toLocaleDateString()}`}
          </Body>
          {!device.revoked_at ? (
            <Button
              variant="secondary"
              label="Revoke this device"
              onPress={() =>
                void deviceRegistrationService
                  .revoke(device.id)
                  .then(load)
                  .catch((caught) => setError(mapExternalError(caught).message))
              }
            />
          ) : null}
        </View>
      ))}
    </Screen>
  );
}
