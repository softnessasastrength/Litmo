import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export type BiometricFailure = {
  status: "unavailable" | "error";
  message: string;
};

function failureMessage(error: LocalAuthentication.LocalAuthenticationError) {
  switch (error) {
    case "not_enrolled":
      return "Face ID is not enrolled. Set up Face ID in iPhone Settings before opening Litmo.";
    case "lockout":
      return "Face ID is locked after too many attempts. Unlock Face ID in iPhone Settings or by locking and unlocking your phone, then try again.";
    case "not_available":
      return "Face ID is unavailable on this device. Litmo remains locked.";
    case "passcode_not_set":
      return "A device passcode is required before Face ID can be used. Litmo remains locked.";
    case "user_cancel":
    case "app_cancel":
    case "system_cancel":
      return "Face ID was cancelled. Litmo remains locked; use the button below when you are ready.";
    case "user_fallback":
      return "Passcode fallback is disabled. Litmo requires Face ID.";
    case "authentication_failed":
      return "Face ID did not recognize you. Litmo remains locked.";
    default:
      return "Face ID could not complete. Litmo remains locked; please try again.";
  }
}

export const biometricAuthService = {
  async authenticate(): Promise<
    { ok: true } | ({ ok: false } & BiometricFailure)
  > {
    if (Platform.OS !== "ios")
      return {
        ok: false,
        status: "unavailable",
        message:
          "Mandatory Face ID locking is currently supported only on iPhone. Litmo remains locked.",
      };

    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    if (
      !hasHardware ||
      !types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    )
      return {
        ok: false,
        status: "unavailable",
        message:
          "This iPhone does not provide Face ID. Litmo cannot be unlocked on this device.",
      };
    if (!enrolled)
      return {
        ok: false,
        status: "unavailable",
        message:
          "Face ID is not enrolled. Set it up in iPhone Settings before opening Litmo.",
      };

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Litmo",
      cancelLabel: "Keep Litmo locked",
      fallbackLabel: "",
      disableDeviceFallback: true,
    });
    if (result.success) return { ok: true };
    return {
      ok: false,
      status: "error",
      message: failureMessage(result.error),
    };
  },
};
