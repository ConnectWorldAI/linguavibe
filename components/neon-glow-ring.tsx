import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

interface NeonGlowRingProps {
  /** The color of the glow ring. Defaults to neon blue */
  color?: string;
  /** Size of the ring (width/height). Defaults to 80 */
  size?: number;
  /** Border width of the ring. Defaults to 2 */
  ringWidth?: number;
  /** Whether to show the ring. Defaults to true */
  visible?: boolean;
  /** Additional style for the container */
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * A neon glow ring component inspired by the ConnectWorld AI logo's
 * electric blue halo around the globe. Wraps any child element
 * with a glowing border ring.
 */
export function NeonGlowRing({
  color = "#00AAFF",
  size = 80,
  ringWidth = 2,
  visible = true,
  style,
  children,
}: NeonGlowRingProps) {
  if (!visible) return <>{children}</>;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringWidth,
          borderColor: color + "80",
          alignItems: "center",
          justifyContent: "center",
          // The glow effect
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 12,
          elevation: 10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * A horizontal gold waveform accent bar inspired by the logo's
 * audio waveform visualization. Use as a decorative element.
 */
export function GoldWaveformAccent({
  width = 120,
  height = 24,
  bars = 12,
}: {
  width?: number;
  height?: number;
  bars?: number;
}) {
  return (
    <View style={[styles.waveformContainer, { width, height }]}>
      {Array.from({ length: bars }).map((_, i) => {
        // Create a wave pattern - taller in the middle
        const progress = i / (bars - 1);
        const amplitude = Math.sin(progress * Math.PI) * 0.8 + 0.2;
        const barHeight = height * amplitude;
        // Alternate between gold and amber
        const isGold = i % 2 === 0;
        return (
          <View
            key={i}
            style={[
              styles.waveformBar,
              {
                height: barHeight,
                backgroundColor: isGold ? "#FFB800" : "#FF8C00",
                opacity: 0.6 + amplitude * 0.4,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/**
 * A small neon dot that looks like a neural network node
 * from the logo's globe connections.
 */
export function NeonDot({
  color = "#00CCFF",
  size = 6,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: size,
        elevation: 4,
      }}
    />
  );
}

const styles = StyleSheet.create({
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
});
