import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors, BorderRadius } from "../constants/Colors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Intensity of the glass effect (0-1) */
  intensity?: number;
  /** Border glow color */
  glowColor?: string;
  /** Whether to show the top accent line */
  accentLine?: boolean;
  accentColor?: string;
}

/**
 * A glassmorphism card component.
 * Uses semi-transparent backgrounds with subtle border glow
 * to create depth and layering without expo-blur-view overhead.
 * 
 * Works consistently across iOS, Android, and Web.
 */
export function GlassCard({
  children,
  style,
  intensity = 0.6,
  glowColor = Colors.glowBorder,
  accentLine = false,
  accentColor = Colors.secondary,
}: GlassCardProps) {
  const bgOpacity = Math.min(0.85, 0.5 + intensity * 0.35);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: `rgba(14, 22, 38, ${bgOpacity})`,
          borderColor: glowColor,
          shadowColor: glowColor,
        },
        style,
      ]}
    >
      {accentLine && (
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
      )}
      {/* Inner highlight for glass depth */}
      <View style={styles.innerHighlight} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    // Soft outer glow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  accentLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 1,
  },
  innerHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
});
