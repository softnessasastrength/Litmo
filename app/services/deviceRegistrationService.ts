import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { gateAuthCeremony } from "./authCeremonyClient.ts";
import { deviceSecretStorage } from "./secureSessionStorage.ts";
import { supabase } from "./supabase.ts";
import { createDeviceRegistrationService } from "./deviceRegistrationServiceCore.ts";

export const deviceRegistrationService = createDeviceRegistrationService({
  storage: deviceSecretStorage,
  client: supabase as never,
  randomUUID: Crypto.randomUUID,
  platform: Platform.OS,
  ceremonyGate: (input) => gateAuthCeremony(input),
});
