import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface GradientMeshBGProps {
  /** Which preset to use */
  variant?: "home" | "studio" | "learn" | "subtle" | "brand" | "explore";
}

/**
 * A subtle gradient mesh background with soft radial glows.
 * Place this as the FIRST child inside a container (position: absolute).
 * 
 * The "brand" variant matches the ConnectWorld AI logo:
 * - Deep navy base
 * - Neon blue glow (top-right, like the globe's halo)
 * - Gold amber glow (left, like the waveform)
 * - Subtle cyan nodes scattered
 */
export function GradientMeshBG({ variant = "home" }: GradientMeshBGProps) {
  const config = VARIANTS[variant];

  return (
    <View style={styles.container} pointerEvents="none">
      {config.orbs.map((orb, i) => (
        <View
          key={i}
          style={[
            styles.orb,
            {
              width: orb.size,
              height: orb.size,
              borderRadius: orb.size / 2,
              backgroundColor: orb.color,
              top: orb.top,
              left: orb.left,
              right: orb.right,
              bottom: orb.bottom,
              opacity: orb.opacity,
            },
          ]}
        />
      ))}
      {/* Subtle noise/grain texture overlay */}
      <View style={styles.grain} />
    </View>
  );
}

interface OrbConfig {
  size: number;
  color: string;
  opacity: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

interface VariantConfig {
  orbs: OrbConfig[];
}

const VARIANTS: Record<string, VariantConfig> = {
  // Brand variant - matches the logo exactly
  brand: {
    orbs: [
      // Top-right neon blue halo (like the globe's ring)
      { size: 320, color: "#003366", opacity: 0.45, top: -100, right: -80 },
      // Secondary blue glow (ring continuation)
      { size: 200, color: "#004488", opacity: 0.3, top: 80, right: 20 },
      // Left gold waveform glow
      { size: 220, color: "#3D2E0A", opacity: 0.35, top: SCREEN_HEIGHT * 0.3, left: -80 },
      // Bottom-left subtle gold
      { size: 150, color: "#332200", opacity: 0.2, bottom: 200, left: -40 },
      // Center-bottom blue node cluster
      { size: 180, color: "#001A33", opacity: 0.25, bottom: 60, right: SCREEN_WIDTH * 0.2 },
      // Tiny cyan accent (neural node)
      { size: 80, color: "#006699", opacity: 0.2, top: SCREEN_HEIGHT * 0.5, left: SCREEN_WIDTH * 0.6 },
    ],
  },
  home: {
    orbs: [
      // Top-left blue glow (logo halo)
      { size: 320, color: "#002D5E", opacity: 0.4, top: -80, left: -100 },
      // Top-right cyan glow
      { size: 220, color: "#003D5E", opacity: 0.3, top: 60, right: -60 },
      // Mid-left gold accent (waveform)
      { size: 200, color: "#3D2E0A", opacity: 0.25, top: SCREEN_HEIGHT * 0.35, left: -60 },
      // Bottom-right purple
      { size: 250, color: "#1A0D3D", opacity: 0.2, bottom: 100, right: -80 },
      // Bottom-center subtle green
      { size: 160, color: "#0A3D2E", opacity: 0.12, bottom: -40, left: SCREEN_WIDTH * 0.3 },
    ],
  },
  studio: {
    orbs: [
      // Top center gold/warm glow (recording/music vibe)
      { size: 300, color: "#3D2E0A", opacity: 0.35, top: -60, left: SCREEN_WIDTH * 0.2 },
      // Left blue halo
      { size: 240, color: "#002D5E", opacity: 0.35, top: SCREEN_HEIGHT * 0.3, left: -80 },
      // Bottom-right purple
      { size: 200, color: "#1A0D3D", opacity: 0.25, bottom: 60, right: -60 },
      // Mid gold waveform accent
      { size: 160, color: "#332200", opacity: 0.2, top: SCREEN_HEIGHT * 0.5, right: 20 },
    ],
  },
  learn: {
    orbs: [
      // Top-left deep blue
      { size: 280, color: "#002D5E", opacity: 0.35, top: -60, left: -80 },
      // Right cyan
      { size: 200, color: "#003D5E", opacity: 0.25, top: 200, right: -50 },
      // Bottom green
      { size: 200, color: "#0A3D2E", opacity: 0.2, bottom: 80, left: -40 },
    ],
  },
  explore: {
    orbs: [
      // Top blue halo
      { size: 280, color: "#002D5E", opacity: 0.35, top: -80, right: -60 },
      // Mid-left gold
      { size: 180, color: "#3D2E0A", opacity: 0.2, top: SCREEN_HEIGHT * 0.4, left: -60 },
      // Bottom purple
      { size: 220, color: "#1A0D3D", opacity: 0.2, bottom: 40, left: SCREEN_WIDTH * 0.3 },
    ],
  },
  subtle: {
    orbs: [
      // Very subtle single glow
      { size: 300, color: "#002D5E", opacity: 0.2, top: -80, left: -60 },
      { size: 200, color: "#1A0D3D", opacity: 0.1, bottom: 100, right: -60 },
    ],
  },
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 8, 16, 0.12)",
  },
});
