import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PrototypeProvider } from "../context/PrototypeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { NeurodivergentProvider } from "../context/NeurodivergentContext";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { FailureState, LoadingState } from "../components/AsyncState";
import { environmentError } from "../services/supabase";
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
  return (
    <ThemeProvider>
      {!fontsLoaded && !fontError ? (
        <LoadingState label="Preparing Litmo…" />
      ) : (
        <AppErrorBoundary>
          <NeurodivergentProvider>
            <PrototypeProvider>
              <AuthProvider>
                <BiometricLockProvider>
                  <ThemedChrome />
                  <AuthenticatedStack />
                  <BiometricPrivacyCover />
                </BiometricLockProvider>
              </AuthProvider>
            </PrototypeProvider>
          </NeurodivergentProvider>
        </AppErrorBoundary>
      )}
    </ThemeProvider>
  );
}

function ThemedChrome() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function BiometricPrivacyCover() {
  const { state, required } = useBiometricLock();
  if (!required) return null;
  if (state.status === "unlocked" && !state.privacyShielded) return null;
  return <BiometricLockScreen />;
}

function AuthenticatedStack() {
  const auth = useAuth();
  const { colors } = useTheme();
  if (auth.status === "authenticating" || auth.status === "registering")
    return <LoadingState label="Restoring your private session…" />;
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
        contentStyle: { backgroundColor: colors.cream },
      }}
    />
  );
}
