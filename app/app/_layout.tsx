import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PrototypeProvider } from "../context/PrototypeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { FailureState, LoadingState } from "../components/AsyncState";
import { environmentError } from "../services/supabase";
import { colors } from "../theme";
import {
  BiometricLockProvider,
  useBiometricLock,
} from "../context/BiometricLockContext";
import { BiometricLockScreen } from "../components/BiometricLockScreen";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "CormorantGaramond-Italic": require("../assets/fonts/CormorantGaramond-Italic.ttf"),
    "BeauRivage-Regular": require("../assets/fonts/BeauRivage-Regular.ttf"),
  });
  if (!fontsLoaded && !fontError)
    return <LoadingState label="Preparing Litmo…" />;
  return (
    <AppErrorBoundary>
      <PrototypeProvider>
        {/* Auth must wrap biometric lock so Face ID can be skipped in demo /
            pre-account states (see biometricRequiredForAuthStatus). */}
        <AuthProvider>
          <BiometricLockProvider>
            <StatusBar style="dark" />
            <AuthenticatedStack />
            <BiometricPrivacyCover />
          </BiometricLockProvider>
        </AuthProvider>
      </PrototypeProvider>
    </AppErrorBoundary>
  );
}
function BiometricPrivacyCover() {
  const { state, required } = useBiometricLock();
  if (!required) return null;
  if (state.status === "unlocked" && !state.privacyShielded) return null;
  return <BiometricLockScreen />;
}
function AuthenticatedStack() {
  const auth = useAuth();
  if (auth.status === "authenticating" || auth.status === "registering")
    return <LoadingState label="Restoring your private session…" />;
  // Missing Supabase config no longer hard-blocks the UI: AuthContext
  // restores as locked so welcome → entry → demo works without Docker.
  // Unexpected auth failures still fail closed with retry.
  if (auth.status === "error")
    return (
      <FailureState
        title="Litmo needs a moment."
        message={
          auth.error?.message ??
          environmentError ??
          "An unexpected error occurred."
        }
        onRetry={() => void auth.refreshProfile()}
      />
    );
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerTintColor: colors.moss,
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTitle: "",
      }}
    />
  );
}
