import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Image, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AnimatedSplashProps {
  onFinish: () => void;
}

/**
 * AnimatedSplash — branded splash-to-home transition.
 *
 * Sequence:
 *   0-500ms:   Logo fades in + scales from 0.7 → 1.0
 *   400-1600ms: Neon glow ring pulses (2 cycles)
 *   500-900ms:  "ConnectWorld AI" text fades in
 *   1800-2300ms: Everything fades out smoothly
 *
 * Total duration: ~2.3s (fast enough to not annoy, slow enough to brand)
 */
export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.85);
  const containerOpacity = useSharedValue(1);
  const aiPulse = useSharedValue(0.5);

  useEffect(() => {
    // Phase 1: Logo fades in and scales up (0-500ms)
    logoOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    // Phase 1b: Brand text fades in (500-900ms)
    textOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );

    // Phase 2: Neon glow pulses (400-1600ms)
    glowOpacity.value = withDelay(
      400,
      withSequence(
        withTiming(0.8, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 200, easing: Easing.inOut(Easing.ease) })
      )
    );
    glowScale.value = withDelay(
      400,
      withSequence(
        withTiming(1.1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.08, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 200, easing: Easing.inOut(Easing.ease) })
      )
    );

    // Phase 2b: Pulsing glow on "ai" text (500-1800ms)
    aiPulse.value = withDelay(
      500,
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 300, easing: Easing.inOut(Easing.ease) })
      )
    );

    // Phase 3: Fade out entire splash (1800-2300ms)
    containerOpacity.value = withDelay(
      1800,
      withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const aiPulseStyle = useAnimatedStyle(() => ({
    opacity: aiPulse.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Dark background */}
      <View style={styles.backgroundLayer} />

      {/* Outer glow ring */}
      <Animated.View style={[styles.glowRingOuter, glowStyle]} />

      {/* Inner glow ring */}
      <Animated.View style={[styles.glowRing, glowStyle]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={require("@/assets/images/splash-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Brand text below logo */}
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.brandName}>ConnectWorld</Text>
        <Animated.Text style={[styles.brandAi, aiPulseStyle]}>ai</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const LOGO_SIZE = Math.min(SCREEN_WIDTH * 0.55, 260);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#040810",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#040810",
  },
  glowRing: {
    position: "absolute",
    width: LOGO_SIZE + 50,
    height: LOGO_SIZE + 50,
    borderRadius: (LOGO_SIZE + 50) / 2,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(0, 136, 255, 0.5)",
    shadowColor: "#0088FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 25,
    ...(Platform.OS === "web"
      ? ({
          boxShadow:
            "0 0 30px rgba(0, 136, 255, 0.4), 0 0 60px rgba(0, 136, 255, 0.2), inset 0 0 30px rgba(0, 136, 255, 0.08)",
        } as any)
      : {}),
  },
  glowRingOuter: {
    position: "absolute",
    width: LOGO_SIZE + 90,
    height: LOGO_SIZE + 90,
    borderRadius: (LOGO_SIZE + 90) / 2,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0, 200, 255, 0.15)",
    shadowColor: "#00C8FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE * 0.18,
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 24,
    gap: 4,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ECEDEE",
    letterSpacing: 0.5,
  },
  brandAi: {
    fontSize: 20,
    fontFamily: "DancingScript-Regular",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    ...(Platform.OS === "web"
      ? { textShadow: "0 0 8px #00AAFF, 0 0 16px #00AAFF40, 0 0 24px #00AAFF25" }
      : { textShadowColor: "#00AAFF", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }),
  } as any,
});
