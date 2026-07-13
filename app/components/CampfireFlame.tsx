import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function CampfireFlame({
  active = true,
  label = "A softly glowing campfire",
}: {
  active?: boolean;
  label?: string;
}) {
  const reducedMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pulse.stopAnimation();
    if (!active || reducedMotion) {
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.96,
          duration: 760,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 620,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [active, pulse, reducedMotion]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ alignItems: "center", justifyContent: "center", minHeight: 128 }}
    >
      <Animated.Text
        accessible={false}
        style={{
          fontSize: 88,
          opacity: active ? 1 : 0.55,
          transform: [{ scale: pulse }],
        }}
      >
        🔥
      </Animated.Text>
    </View>
  );
}
