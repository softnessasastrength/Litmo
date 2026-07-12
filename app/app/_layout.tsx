import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PrototypeProvider } from "../context/PrototypeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { FailureState, LoadingState } from "../components/AsyncState";
import { Body, Button, Screen, Title } from "../components/ui";
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
        <BiometricLockProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <AuthenticatedStack />
            <BiometricPrivacyCover />
          </AuthProvider>
        </BiometricLockProvider>
      </PrototypeProvider>
    </AppErrorBoundary>
  );
}
function BiometricPrivacyCover() {
  const { state } = useBiometricLock();
  if (state.status === "unlocked" && !state.privacyShielded) return null;
  return <BiometricLockScreen />;
}
function AuthenticatedStack() {
  const auth = useAuth();
  if (auth.status === "loading")
    return <LoadingState label="Restoring your private session…" />;
  if (auth.status === "error" && environmentError)
    return (
      <Screen scroll={false} style={{ justifyContent: "center", gap: 18 }}>
        <Title center>No local service is configured.</Title>
        <Body center>{environmentError}</Body>
        <Button
          label="Continue without an account (demo mode)"
          onPress={auth.enterDemoMode}
        />
      </Screen>
    );
  if (auth.status === "error")
    return (
      <FailureState
        title="Litmo needs a moment."
        message={auth.error?.message ?? "An unexpected error occurred."}
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
