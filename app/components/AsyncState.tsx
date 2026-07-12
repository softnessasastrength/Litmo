import { ActivityIndicator, Text, View } from "react-native";
import { Body, Button, Screen, Title } from "./ui";
import type { AppColors } from "../theme";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useColors } from "../context/ThemeContext";

function makeStyles(colors: AppColors) {
  return {
    center: { justifyContent: "center" as const, gap: 18 },
    label: {
      textAlign: "center" as const,
      color: colors.muted,
      fontSize: 16,
    },
    empty: { padding: 24, alignItems: "center" as const, gap: 8 },
    emptyTitle: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "800" as const,
    },
    emptyBody: {
      color: colors.muted,
      textAlign: "center" as const,
      lineHeight: 22,
    },
  };
}

export function LoadingState({
  label = "Settling things in…",
}: {
  label?: string;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
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
  const styles = useThemedStyles(makeStyles);
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
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{message}</Text>
    </View>
  );
}
