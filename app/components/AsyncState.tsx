import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Body, Button, Screen, Title } from "./ui";
import { colors } from "../theme";
export function LoadingState({
  label = "Settling things in…",
}: {
  label?: string;
}) {
  return (
    <Screen scroll={false} style={styles.center}>
      <ActivityIndicator
        color={colors.moss}
        size="large"
        accessibilityLabel={label}
      />
      <Text style={styles.label}>{label}</Text>
    </Screen>
  );
}
export function FailureState({
  title = "We could not reach that.",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Screen scroll={false} style={styles.center}>
      <Title center>{title}</Title>
      <Body center>{message}</Body>
      {onRetry ? <Button label="Try again" onPress={onRetry} /> : null}
    </Screen>
  );
}
export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{message}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  center: { justifyContent: "center", gap: 18 },
  label: { textAlign: "center", color: colors.muted, fontSize: 16 },
  empty: { padding: 24, alignItems: "center", gap: 8 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  emptyBody: { color: colors.muted, textAlign: "center", lineHeight: 22 },
});
