import { useEffect, useRef } from "react";
import {
  Text,
  View,
  Image,
  StyleSheet,
  Animated,
  Platform,
  type TextStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Colors } from "@/constants/Colors";

// ─── Types ──────────────────────────────────────────────────────────────────

interface BrandNameProps {
  /** Font size variant. "ai" uses DancingScript-Bold at xl, Regular otherwise. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Color for "ConnectWorld" text. Defaults to Colors.textPrimary */
  color?: string;
  /** Color for "ai" text. Defaults to white */
  aiColor?: string;
  /** Additional style for the container Text */
  style?: StyleProp<TextStyle>;
  /** Whether to show the full tagline below */
  showTagline?: boolean;
  /** Tagline color override */
  taglineColor?: string;
  /** Enable animated entrance (fade-in + slide-up with tagline reveal) */
  animated?: boolean;
  /** Animation delay in ms before starting */
  animationDelay?: number;
  /** Enable neon glow effect on "ai" text (best on dark backgrounds) */
  glow?: boolean;
  /** Custom glow color. Defaults to electric blue (#00AAFF) */
  glowColor?: string;
  /** Enable pulsing glow animation on "ai" text (for splash/login screens) */
  pulsingGlow?: boolean;
}

interface BrandLockupProps extends BrandNameProps {
  /** Logo size in pixels. Defaults based on size variant. */
  logoSize?: number;
  /** Additional style for the lockup container */
  containerStyle?: StyleProp<ViewStyle>;
}

// ─── Size Map ───────────────────────────────────────────────────────────────

const SIZE_MAP = {
  sm: { main: 14, ai: 13, logo: 24, font: "DancingScript-Regular" },
  md: { main: 18, ai: 16, logo: 32, font: "DancingScript-Regular" },
  lg: { main: 22, ai: 20, logo: 40, font: "DancingScript-Regular" },
  xl: { main: 28, ai: 24, logo: 48, font: "DancingScript-Bold" },
};

// ─── Glow Shadow Styles ─────────────────────────────────────────────────────

function getGlowStyle(glowColor: string, fontSize: number): TextStyle {
  if (Platform.OS === "web") {
    return {
      // @ts-ignore - web-only textShadow property
      textShadow: `0 0 6px ${glowColor}, 0 0 12px ${glowColor}40, 0 0 20px ${glowColor}25`,
    };
  }
  // iOS/Android: use shadow properties for a subtle glow
  return {
    textShadowColor: glowColor,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: Math.max(6, fontSize * 0.4),
  };
}

// ─── BrandName Component ────────────────────────────────────────────────────

/**
 * Reusable brand name component that renders "ConnectWorld ai" with
 * the "ai" in Dancing Script handwritten font matching the logo.
 *
 * Features:
 * - Dancing Script font (Regular for sm-lg, Bold for xl)
 * - Optional neon glow effect on "ai" text
 * - Animated entrance (fade-in + slide-up)
 * - Optional tagline display
 *
 * Usage:
 * ```tsx
 * <BrandName size="lg" glow />
 * <BrandName size="xl" showTagline animated glow glowColor="#00AAFF" />
 * ```
 */
export function BrandName({
  size = "md",
  color = Colors.textPrimary,
  aiColor = "#FFFFFF",
  style,
  showTagline = false,
  taglineColor = Colors.textSecondary,
  animated = false,
  animationDelay = 0,
  glow = false,
  glowColor = "#00AAFF",
  pulsingGlow = false,
}: BrandNameProps) {
  const sizes = SIZE_MAP[size];
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animated ? 10 : 0)).current;
  const taglineFade = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulsingGlow) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulsingGlow]);

  useEffect(() => {
    if (!animated) return;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (showTagline) {
          Animated.timing(taglineFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }
      });
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animated, animationDelay, showTagline]);

  const aiTextStyle: TextStyle[] = [
    { fontFamily: sizes.font, fontSize: sizes.ai, color: aiColor },
    glow ? getGlowStyle(glowColor, sizes.ai) : {},
  ];

  const aiElement = pulsingGlow ? (
    <Animated.Text style={[...aiTextStyle, { opacity: pulseAnim }]}>ai</Animated.Text>
  ) : (
    <Text style={aiTextStyle}>ai</Text>
  );

  const brandContent = (
    <Text
      style={[
        styles.container,
        { fontSize: sizes.main, color },
        style,
      ]}
    >
      ConnectWorld{" "}
      {aiElement}
    </Text>
  );

  const taglineContent = showTagline ? (
    <Animated.View style={[{ opacity: animated ? taglineFade : 1 }]}>
      <Text
        style={[
          styles.taglineTop,
          { color: taglineColor },
        ]}
      >
        Join ConnectWorld{" "}
        <Text style={[{ fontFamily: sizes.font, color: aiColor }, glow ? getGlowStyle(glowColor, 14) : {}]}>ai</Text>
      </Text>
      <Text
        style={[
          styles.taglineBottom,
          { color: taglineColor },
        ]}
      >
        Learn And Hear The World Your Way!
      </Text>
    </Animated.View>
  ) : null;

  if (animated) {
    return (
      <View style={styles.animatedWrapper}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {brandContent}
        </Animated.View>
        {taglineContent}
      </View>
    );
  }

  return (
    <>
      {brandContent}
      {taglineContent}
    </>
  );
}

// ─── BrandLockup Component ──────────────────────────────────────────────────

/**
 * Brand lockup that combines the globe app icon + "ConnectWorld ai" text
 * as a single horizontal unit for headers and navigation bars.
 *
 * Usage:
 * ```tsx
 * <BrandLockup size="md" glow />
 * <BrandLockup size="lg" showTagline />
 * ```
 */
export function BrandLockup({
  size = "md",
  logoSize,
  containerStyle,
  ...brandProps
}: BrandLockupProps) {
  const sizes = SIZE_MAP[size];
  const resolvedLogoSize = logoSize ?? sizes.logo;

  return (
    <View style={[styles.lockupContainer, containerStyle]}>
      <Image
        source={require("../assets/images/icon.png")}
        style={[
          styles.lockupLogo,
          { width: resolvedLogoSize, height: resolvedLogoSize, borderRadius: resolvedLogoSize * 0.2 },
        ]}
        resizeMode="contain"
      />
      <View style={styles.lockupTextContainer}>
        <BrandName size={size} glow {...brandProps} />
      </View>
    </View>
  );
}

// ─── BrandNameInline Component ──────────────────────────────────────────────

/**
 * Inline brand text for use within sentences.
 * Renders "ConnectWorld ai" inline without wrapping.
 *
 * Usage:
 * ```tsx
 * <Text>Join <BrandNameInline /> today!</Text>
 * ```
 */
export function BrandNameInline({
  color = Colors.textPrimary,
  aiColor = "#FFFFFF",
  glow = false,
  glowColor = "#00AAFF",
}: {
  color?: string;
  aiColor?: string;
  glow?: boolean;
  glowColor?: string;
}) {
  const aiTextStyle: TextStyle[] = [
    styles.inlineAi,
    { color: aiColor },
    glow ? getGlowStyle(glowColor, 14) : {},
  ];

  return (
    <Text style={{ fontWeight: "700", color }}>
      ConnectWorld{" "}
      <Text style={aiTextStyle}>ai</Text>
    </Text>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  inlineAi: {
    fontFamily: "DancingScript-Regular",
  },
  taglineTop: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  taglineBottom: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 3,
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  animatedWrapper: {
    alignItems: "center",
  },
  lockupContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  lockupLogo: {
    backgroundColor: "transparent",
  },
  lockupTextContainer: {
    justifyContent: "center",
  },
});
