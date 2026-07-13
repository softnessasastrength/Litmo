import { useRouter, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Body, Button, Screen } from "../../components/ui";
import { PANIC_COPY } from "../../lib/traumaSafetyCore";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

/**
 * Calm cover after panic Soft Signal — reduces pressure to re-engage.
 * Not emergency services. No session controls here.
 */
export default function PanicCoverScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { sessionId, softSignalLogId } = useLocalSearchParams<{
    sessionId?: string;
    softSignalLogId?: string;
  }>();

  const now = new Date();
  const time = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.center} accessible>
        <Text style={styles.clock} accessibilityRole="header">
          {time}
        </Text>
        <Text style={styles.title}>{PANIC_COPY.coverTitle}</Text>
        <Body muted center>
          {PANIC_COPY.coverBody}
        </Body>
        <Text style={styles.fine}>{PANIC_COPY.notEmergency}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          label="Private wrap-up when ready"
          onPress={() =>
            router.replace({
              pathname: "/session/wrap-up",
              params: {
                ended: "soft-signal",
                sessionId: sessionId ?? "",
                softSignalLogId: softSignalLogId ?? "",
                exitKind: "panic_mode",
              },
            } as never)
          }
          accessibilityHint="Optional private reflection. You can skip everything."
        />
        <Button
          variant="secondary"
          label="Optional reflection tools"
          onPress={() =>
            router.push({
              pathname: "/safety/reflection",
              params: {
                sessionId: sessionId ?? "",
                softSignalLogId: softSignalLogId ?? "",
                exitKind: "panic_mode",
              },
            } as never)
          }
        />
        <Button
          variant="secondary"
          label="Home"
          onPress={() => router.replace("/(tabs)/home" as never)}
        />
      </View>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    screen: {
      justifyContent: "space-between" as const,
      backgroundColor: colors.cream,
    },
    center: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      gap: 14,
      paddingHorizontal: 24,
    },
    clock: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 56,
      marginBottom: 8,
    },
    title: {
      color: colors.moss,
      fontFamily: fonts.headline,
      fontSize: 32,
      textAlign: "center" as const,
    },
    fine: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center" as const,
      marginTop: 12,
      maxWidth: 320,
    },
    actions: { gap: 10, width: "100%" as const, paddingBottom: 12 },
  };
}
