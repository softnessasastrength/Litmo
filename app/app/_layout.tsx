import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PrototypeProvider } from "../context/PrototypeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { FailureState, LoadingState } from "../components/AsyncState";
import { colors } from "../theme";

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <PrototypeProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <AuthenticatedStack />
        </AuthProvider>
      </PrototypeProvider>
    </AppErrorBoundary>
  );
}
function AuthenticatedStack() {
  const auth = useAuth();
  if (auth.status === "loading")
    return <LoadingState label="Restoring your private session…" />;
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
