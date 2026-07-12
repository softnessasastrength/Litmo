import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBiometricLock } from "../context/BiometricLockContext";
import { colors, fonts } from "../theme";
import { Body, Button } from "./ui";

export function BiometricLockScreen() {
  const { state, unlock } = useBiometricLock();
  const busy = state.status === "checking" || state.status === "authenticating";
  return (
    <View style={styles.cover} accessibilityViewIsModal>
      <SafeAreaView style={styles.safe}>
        <View style={styles.mark}>
          <Text style={styles.markText}>L</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>PRIVATE BY DEFAULT</Text>
          <Text style={styles.title}>Litmo is locked.</Text>
          <Body muted>{busy ? "Waiting for Face ID…" : state.message}</Body>
        </View>
        <View style={styles.action}>
          <Button
            label={busy ? "Face ID in progress…" : "Unlock with Face ID"}
            onPress={() => void unlock()}
            disabled={busy}
            accessibilityHint="Uses Apple Face ID; no biometric data is stored by Litmo"
          />
          <Text style={styles.note}>
            Litmo receives only Apple’s success or failure result. Your face
            data never enters the app.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cream,
    zIndex: 10_000,
  },
  safe: { flex: 1, padding: 28, justifyContent: "space-between" },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { color: colors.plum, fontFamily: fonts.wordmark, fontSize: 42 },
  copy: { gap: 14 },
  kicker: {
    color: colors.moss,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.headline,
    fontSize: 48,
    lineHeight: 54,
  },
  action: { gap: 16 },
  note: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
