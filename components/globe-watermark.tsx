import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface GlobeWatermarkProps {
  /** Color variant */
  variant?: "brand" | "cyan" | "subtle";
  /** Size of the globe */
  size?: number;
  /** Opacity (0-1) */
  opacity?: number;
  /** Position */
  position?: "center" | "bottom-right" | "top-left" | "top-right";
}

/**
 * A faint wireframe globe watermark for screen backgrounds.
 * Uses SVG to draw latitude/longitude lines in a sphere shape.
 * Very low opacity so it doesn't compete with content.
 */
export function GlobeWatermark({
  variant = "brand",
  size = 320,
  opacity = 0.08,
  position = "center",
}: GlobeWatermarkProps) {
  const colors = VARIANTS[variant];
  const posStyle = POSITIONS[position];

  const r = size / 2 - 4; // radius with padding
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={[styles.container, posStyle]} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity }}>
        {/* Outer circle */}
        <Circle cx={cx} cy={cy} r={r} stroke={colors.primary} strokeWidth={1.5} fill="none" />

        {/* Latitude lines (horizontal ellipses) */}
        <Ellipse cx={cx} cy={cy - r * 0.5} rx={r * 0.87} ry={r * 0.15} stroke={colors.secondary} strokeWidth={0.8} fill="none" />
        <Ellipse cx={cx} cy={cy - r * 0.25} rx={r * 0.97} ry={r * 0.12} stroke={colors.secondary} strokeWidth={0.6} fill="none" />
        <Ellipse cx={cx} cy={cy} rx={r} ry={r * 0.08} stroke={colors.primary} strokeWidth={1} fill="none" />
        <Ellipse cx={cx} cy={cy + r * 0.25} rx={r * 0.97} ry={r * 0.12} stroke={colors.secondary} strokeWidth={0.6} fill="none" />
        <Ellipse cx={cx} cy={cy + r * 0.5} rx={r * 0.87} ry={r * 0.15} stroke={colors.secondary} strokeWidth={0.8} fill="none" />

        {/* Longitude lines (vertical ellipses) */}
        <Ellipse cx={cx} cy={cy} rx={r * 0.15} ry={r} stroke={colors.tertiary} strokeWidth={0.8} fill="none" />
        <Ellipse cx={cx} cy={cy} rx={r * 0.45} ry={r} stroke={colors.tertiary} strokeWidth={0.7} fill="none" />
        <Ellipse cx={cx} cy={cy} rx={r * 0.75} ry={r} stroke={colors.tertiary} strokeWidth={0.6} fill="none" />

        {/* Center vertical line */}
        <Path d={`M ${cx} ${cy - r} L ${cx} ${cy + r}`} stroke={colors.primary} strokeWidth={0.8} />

        {/* Equator highlight */}
        <Ellipse cx={cx} cy={cy} rx={r} ry={r * 0.08} stroke={colors.primary} strokeWidth={1.2} fill="none" opacity={0.6} />

        {/* Subtle glow ring */}
        <Circle cx={cx} cy={cy} r={r + 8} stroke={colors.primary} strokeWidth={0.5} fill="none" opacity={0.4} />
        <Circle cx={cx} cy={cy} r={r + 16} stroke={colors.primary} strokeWidth={0.3} fill="none" opacity={0.2} />
      </Svg>
    </View>
  );
}

interface ColorSet {
  primary: string;
  secondary: string;
  tertiary: string;
}

const VARIANTS: Record<string, ColorSet> = {
  brand: {
    // ConnectWorld AI logo colors: red, green, blue
    primary: "#EF4444",    // Red
    secondary: "#22C55E",  // Green
    tertiary: "#3B82F6",   // Blue
  },
  cyan: {
    primary: "#00AAFF",
    secondary: "#00AAFF",
    tertiary: "#00AAFF",
  },
  subtle: {
    primary: "#7EB8E0",
    secondary: "#7EB8E0",
    tertiary: "#7EB8E0",
  },
};

const POSITIONS: Record<string, any> = {
  center: {
    top: SCREEN_HEIGHT * 0.2,
    left: (SCREEN_WIDTH - 320) / 2,
  },
  "bottom-right": {
    bottom: -40,
    right: -60,
  },
  "top-left": {
    top: 40,
    left: -60,
  },
  "top-right": {
    top: 60,
    right: -40,
  },
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 0,
  },
});
