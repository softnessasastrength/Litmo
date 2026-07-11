import type { PropsWithChildren, ReactNode } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useEffect, useRef } from "react";
import { colors, radius, shadow } from "../theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function Screen({
  children,
  scroll = true,
  style,
}: PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>) {
  const content = <View style={[styles.content, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
export function FadeIn({ children }: PropsWithChildren) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const offset = useRef(new Animated.Value(reduced ? 0 : 12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: reduced ? 0 : 360,
        useNativeDriver: true,
      }),
      Animated.timing(offset, {
        toValue: 0,
        duration: reduced ? 0 : 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [offset, opacity, reduced]);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY: offset }] }}>
      {children}
    </Animated.View>
  );
}
export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}
export function Title({
  children,
  center = false,
}: PropsWithChildren<{ center?: boolean }>) {
  return (
    <Text style={[styles.title, center && styles.center]}>{children}</Text>
  );
}
export function Body({
  children,
  center = false,
  muted = false,
}: PropsWithChildren<{ center?: boolean; muted?: boolean }>) {
  return (
    <Text style={[styles.body, center && styles.center, muted && styles.muted]}>
      {children}
    </Text>
  );
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "signal";
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`${variant}Button`],
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" && styles.secondaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Choice({
  label,
  detail,
  glyph,
  selected,
  onPress,
}: {
  label: string;
  detail?: string;
  glyph?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
    >
      {glyph ? <Text style={styles.glyph}>{glyph}</Text> : null}
      <View style={styles.flex}>
        <Text style={styles.choiceLabel}>{label}</Text>
        {detail ? <Text style={styles.choiceDetail}>{detail}</Text> : null}
      </View>
      <Text style={styles.radio}>{selected ? "●" : "○"}</Text>
    </Pressable>
  );
}
export function Pill({ children }: PropsWithChildren) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}
export function SectionTitle({
  children,
  action,
}: PropsWithChildren<{ action?: ReactNode }>) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}
export function Progress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const reduced = useReducedMotion();
  const width = useRef(new Animated.Value(current / total)).current;
  useEffect(() => {
    Animated.timing(width, {
      toValue: current / total,
      duration: reduced ? 0 : 280,
      useNativeDriver: false,
    }).start();
  }, [current, reduced, total, width]);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current }}
      accessibilityLabel={`Question ${current} of ${total}`}
      style={styles.progressTrack}
    >
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: width.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1 },
  content: { flexGrow: 1, padding: 24, paddingBottom: 40, gap: 18 },
  flex: { flex: 1 },
  eyebrow: {
    color: colors.moss,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 38,
    lineHeight: 45,
    fontWeight: "600",
  },
  center: { textAlign: "center" },
  body: { color: colors.ink, fontSize: 17, lineHeight: 26 },
  muted: { color: colors.muted },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  button: {
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.moss,
  },
  primaryButton: { backgroundColor: colors.moss },
  secondaryButton: {
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.moss,
  },
  signalButton: { backgroundColor: colors.signal, minHeight: 64 },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: "800" },
  secondaryText: { color: colors.moss },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  choice: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  choiceSelected: {
    borderColor: colors.moss,
    backgroundColor: colors.mossSoft,
  },
  glyph: {
    width: 36,
    color: colors.plum,
    fontFamily: "Georgia",
    fontSize: 25,
    textAlign: "center",
  },
  choiceLabel: { color: colors.ink, fontSize: 17, fontWeight: "700" },
  choiceDetail: { color: colors.muted, fontSize: 14, marginTop: 4 },
  radio: { color: colors.moss, fontSize: 21 },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.mossSoft,
  },
  pillText: { color: colors.moss, fontSize: 13, fontWeight: "700" },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "Georgia",
    color: colors.ink,
    fontSize: 24,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.line,
  },
  progressFill: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.apricot,
  },
});
export const uiStyles = styles;
