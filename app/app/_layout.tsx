import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PrototypeProvider } from "../context/PrototypeContext";
import { colors } from "../theme";

export default function RootLayout() {
  return (
    <PrototypeProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerTintColor: colors.moss,
          headerStyle: { backgroundColor: colors.cream },
          headerShadowVisible: false,
          headerTitle: "",
        }}
      />
    </PrototypeProvider>
  );
}
