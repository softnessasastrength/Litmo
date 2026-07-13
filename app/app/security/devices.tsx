import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { deviceRegistrationService } from "../../services/deviceRegistrationService";
import { mapExternalError } from "../../services/errors";
import { useColors } from "../../context/ThemeContext";

type Device = Awaited<
  ReturnType<typeof deviceRegistrationService.list>
>[number];

type PasskeyRow = {
  id?: string;
  name?: string;
  created_at?: string;
  createdAt?: string;
};

export default function DevicesScreen() {
  return (
    <SensitiveAccessGate>
      <DeviceList />
    </SensitiveAccessGate>
  );
}

function DeviceList() {
  const colors = useColors();
  const { addPasskey, listPasskeys } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const [deviceList, keyList] = await Promise.all([
        deviceRegistrationService.list(),
        listPasskeys().catch(() => []),
      ]);
      setDevices(deviceList);
      setPasskeys((keyList as PasskeyRow[]) ?? []);
      setError("");
    } catch (caught) {
      setError(mapExternalError(caught).message);
    }
  }, [listPasskeys]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAddPasskey = async () => {
    setBusy(true);
    setNote("");
    setError("");
    try {
      await addPasskey();
      setNote("Passkey added. You can remove an older one only after you have at least two.");
      await load();
    } catch (caught) {
      setError(mapExternalError(caught).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>ACCOUNT SECURITY</Eyebrow>
      <Title>Passkeys and registered devices.</Title>
      <Body muted>
        Passkeys are your primary sign-in (WebAuthn via Supabase + Apple Face
        ID). Device registration is a separate private secret on this phone —
        it fails closed if a backup is restored without a fresh passkey sign-in.
      </Body>

      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.signal }}>
          {error}
        </Text>
      ) : null}
      {note ? <Body muted>{note}</Body> : null}

      <Body>Passkeys (Apple / iCloud Keychain)</Body>
      <Body muted>
        Private keys never leave Apple. Litmo only stores public credential
        material on the server through Supabase Auth.
      </Body>
      {passkeys.length === 0 ? (
        <Body muted>No passkeys listed yet, or the server could not list them.</Body>
      ) : (
        passkeys.map((pk, index) => (
          <View key={pk.id ?? `pk-${index}`} style={{ gap: 6, marginBottom: 8 }}>
            <Body>{pk.name?.trim() || `Passkey ${index + 1}`}</Body>
            <Body muted>
              {pk.created_at || pk.createdAt
                ? `Created ${new Date(String(pk.created_at ?? pk.createdAt)).toLocaleDateString()}`
                : "Enrolled passkey"}
            </Body>
          </View>
        ))
      )}
      <Button
        label={busy ? "Waiting for Face ID…" : "Add another passkey"}
        disabled={busy}
        onPress={() => void onAddPasskey()}
        accessibilityHint="Registers an additional WebAuthn passkey with Face ID. Recommended before removing any passkey."
      />

      <Body>Installations on Litmo</Body>
      <Body muted>
        Revocation is immediate in Litmo. A synced iCloud passkey may still
        exist in Apple Passwords; remove it there too if the device or Apple
        Account is compromised.
      </Body>
      {devices.map((device) => (
        <View key={device.id} style={{ gap: 8, marginBottom: 10 }}>
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
