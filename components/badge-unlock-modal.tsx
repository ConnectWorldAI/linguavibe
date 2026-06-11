/**
 * Badge Unlock Modal
 * 
 * Shows a celebration animation with confetti burst and badge reveal
 * when users earn a new streak badge tier.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { shouldPlayHaptic } from "@/lib/sound-settings";
import { Colors } from "@/constants/Colors";
import type { StreakBadge } from "@/lib/goal-streak";

interface BadgeUnlockModalProps {
  visible: boolean;
  badge: StreakBadge | null;
  streakWeeks: number;
  onDismiss: () => void;
}

// Confetti particle component
function ConfettiParticle({ delay, color, startX }: { delay: number; color: string; startX: number }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(Dimensions.get("window").height * 0.6, {
        duration: 2500 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 120, {
        duration: 2500,
        easing: Easing.out(Easing.quad),
      })
    );
    opacity.value = withDelay(
      delay + 1800,
      withTiming(0, { duration: 700 })
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 2500 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: "20%",
          left: "50%",
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function BadgeUnlockModal({ visible, badge, streakWeeks, onDismiss }: BadgeUnlockModalProps) {
  const badgeScale = useSharedValue(0);
  const badgeOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  const [showConfetti, setShowConfetti] = useState(false);

  const confettiColors = ["#F97316", "#EAB308", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444"];

  useEffect(() => {
    if (visible && badge) {
      // Reset
      badgeScale.value = 0;
      badgeOpacity.value = 0;
      titleOpacity.value = 0;
      subtitleOpacity.value = 0;
      buttonOpacity.value = 0;
      glowScale.value = 0.5;
      setShowConfetti(true);

      // Trigger haptics (gated by preference)
      if (Platform.OS !== "web") {
        shouldPlayHaptic().then((on) => {
          if (!on) return;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }, 200);
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }, 400);
        });
      }

      // Animate badge entrance
      badgeOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
      badgeScale.value = withDelay(
        300,
        withSequence(
          withTiming(1.3, { duration: 300, easing: Easing.out(Easing.back(2)) }),
          withTiming(1, { duration: 200 })
        )
      );

      // Glow pulse
      glowScale.value = withDelay(
        300,
        withSequence(
          withTiming(1.5, { duration: 600 }),
          withTiming(1.2, { duration: 400 }),
          withTiming(1.4, { duration: 300 })
        )
      );

      // Text animations
      titleOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
      subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
      buttonOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));
    }
  }, [visible, badge]);

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeOpacity.value,
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: badgeOpacity.value * 0.3,
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: withTiming(titleOpacity.value === 1 ? 0 : 10, { duration: 300 }) }],
  }));

  const subtitleAnimStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonOpacity.value }],
  }));

  if (!badge) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {showConfetti &&
          Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle
              key={i}
              delay={i * 60}
              color={confettiColors[i % confettiColors.length]}
              startX={(Math.random() - 0.5) * Dimensions.get("window").width * 0.8}
            />
          ))}

        <View style={styles.content}>
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glow,
              { backgroundColor: badge.color + "40" },
              glowAnimStyle,
            ]}
          />

          {/* Badge emoji */}
          <Animated.View style={[styles.badgeContainer, badgeAnimStyle]}>
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
          </Animated.View>

          {/* Title */}
          <Animated.View style={titleAnimStyle}>
            <Text style={styles.title}>New Badge Unlocked!</Text>
            <Text style={[styles.badgeTitle, { color: badge.color }]}>
              {badge.title}
            </Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={subtitleAnimStyle}>
            <Text style={styles.subtitle}>
              {streakWeeks}-week goal streak achieved!
            </Text>
            <Text style={styles.description}>{badge.description}</Text>
          </Animated.View>

          {/* Dismiss button */}
          <Animated.View style={buttonAnimStyle}>
            <TouchableOpacity
              style={[styles.dismissBtn, { backgroundColor: badge.color }]}
              onPress={onDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissBtnText}>Awesome!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  badgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  badgeEmoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  badgeTitle: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFFDD",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: 32,
  },
  dismissBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
  },
  dismissBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
