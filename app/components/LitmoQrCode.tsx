import { useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import { buildQrMatrix } from "../lib/qrMatrix";
import { useTheme } from "../context/ThemeContext";

type Props = {
  value: string;
  /** Outer size in dp (default 200). */
  size?: number;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

/**
 * On-device QR renderer for careful-connect deep links.
 * Meaning is never color-only: high-contrast modules; label provided separately.
 */
export function LitmoQrCode({
  value,
  size = 200,
  accessibilityLabel = "QR code for Litmo careful-connect invite",
  style,
}: Props) {
  const { colors } = useTheme();
  const matrix = useMemo(() => {
    try {
      return buildQrMatrix(value, "M");
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix || !value) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel="QR unavailable for this payload"
        style={[
          {
            width: size,
            height: size,
            backgroundColor: colors.paper,
            borderWidth: 1,
            borderColor: colors.line,
          },
          style,
        ]}
      />
    );
  }

  const cell = size / matrix.size;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: size,
          height: size,
          backgroundColor: colors.white,
          padding: 0,
          flexDirection: "row",
          flexWrap: "wrap",
        },
        style,
      ]}
    >
      {matrix.modules.map((dark, i) => (
        <View
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          style={{
            width: cell,
            height: cell,
            backgroundColor: dark ? colors.ink : colors.white,
          }}
        />
      ))}
    </View>
  );
}
