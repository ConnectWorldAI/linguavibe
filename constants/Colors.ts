/**
 * ConnectWorld AI - Futuristic Neon Color System v3
 * Derived directly from the ConnectWorld AI logo:
 * - Deep navy-black background (like the logo's dark space)
 * - INTENSE electric blue neon ring/glow (the globe's halo)
 * - Warm gold/amber waveform accents (audio identity)
 * - Flag-inspired red accent
 * - Neural network node dots (bright cyan points)
 */

export const Colors = {
  // Core backgrounds (from logo's dark navy space)
  primary: "#040810",              // Logo background - deepest navy-black
  backgroundDark: "#020406",       // Even deeper for layering
  surfaceCard: "#0A1628",          // Card surface - slightly lighter navy
  surfaceElevated: "#0E1E38",      // Elevated surface - visible navy
  surfaceGlass: "rgba(10, 22, 40, 0.95)",

  // NEON BLUE GLOW (the logo's signature electric ring)
  secondary: "#00AAFF",            // Core neon blue
  glow: "#00CCFF",                 // Bright cyan glow (neural nodes)
  glowStrong: "#66DDFF",           // Highlight cyan
  glowSubtle: "rgba(0, 204, 255, 0.10)",
  glowBorder: "rgba(0, 170, 255, 0.45)",   // Ring border
  glowShadow: "rgba(0, 170, 255, 0.55)",   // Shadow cast
  glowIntense: "rgba(0, 204, 255, 0.75)",  // Intense halo
  glowRing: "rgba(0, 170, 255, 0.35)",     // The blue ring around elements

  // WARM GOLD (from logo's left-side audio waveform)
  gold: "#FFB800",
  goldBright: "#FFCC33",
  goldGlow: "rgba(255, 184, 0, 0.12)",
  goldBorder: "rgba(255, 184, 0, 0.45)",
  goldIntense: "rgba(255, 184, 0, 0.70)",

  // RED ACCENT (from flags - Gambian flag "O" in logo)
  accent: "#FF2D2D",
  redGlow: "rgba(255, 45, 45, 0.12)",
  redBorder: "rgba(255, 45, 45, 0.35)",

  // Status colors (neon variants)
  success: "#00FF88",
  warning: "#FFD600",
  error: "#FF4444",

  // Green glow
  greenGlow: "rgba(0, 255, 136, 0.10)",
  greenBorder: "rgba(0, 255, 136, 0.35)",

  // Yellow glow
  yellowGlow: "rgba(255, 214, 0, 0.10)",
  yellowBorder: "rgba(255, 214, 0, 0.35)",

  // Text (white against deep navy, blue-tinted secondaries)
  textPrimary: "#FFFFFF",
  textSecondary: "#7EB8E0",        // Blue-tinted (matches logo text glow)
  textMuted: "#3D5A7A",
  textAccent: "#00CCFF",           // Bright cyan (neural node color)
  textDark: "#040810",
  textGold: "#FFB800",

  // Borders (neon blue glow borders like the logo ring)
  border: "rgba(0, 170, 255, 0.18)",
  borderStrong: "rgba(0, 170, 255, 0.55)",
  borderLight: "rgba(126, 184, 224, 0.06)",

  // Aliases for backward compatibility with screens using shorthand names
  text: "#FFFFFF",                  // Alias for textPrimary
  surface: "#0A1628",               // Alias for surfaceCard
  card: "#0A1628",                  // Alias for surfaceCard
  cardBg: "#0A1628",               // Alias for surfaceCard
  background: "#040810",            // Alias for primary
  muted: "#3D5A7A",                // Alias for textMuted
  foreground: "#FFFFFF",            // Alias for textPrimary
  accentBlue: "#00AAFF",           // Alias for secondary
  glassBorder: "rgba(0, 170, 255, 0.45)", // Alias for glowBorder

  // Purple accent (for challenges, AI features)
  neonPurple: "#A855F7",

  // Overlay
  overlay: "rgba(2, 4, 6, 0.92)",

  // Gradients (inspired by logo's dark-to-glow transitions)
  gradient: {
    primary: ["#020406", "#040810"],
    blue: ["#0A1628", "#040810"],
    accent: ["#00CCFF", "#0066CC"],
    gold: ["#FFB800", "#CC8800"],
    glow: ["rgba(0, 204, 255, 0.25)", "rgba(4, 8, 16, 0)"],
    card: ["rgba(10, 22, 40, 0.98)", "rgba(14, 30, 56, 0.98)"],
    // New: logo-inspired ring gradient
    ring: ["rgba(0, 170, 255, 0.60)", "rgba(0, 204, 255, 0.20)"],
    // New: gold waveform gradient
    waveform: ["#FFB800", "#FF8C00"],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 14,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 38,
};
