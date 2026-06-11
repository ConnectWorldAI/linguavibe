/**
 * Badge Toast — Animated toast notification that slides in when a new badge is unlocked.
 * Shows badge icon, name, and description with auto-dismiss.
 */
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { shouldPlayHaptic } from "@/lib/sound-settings";
import { useColors } from "@/hooks/use-colors";
import { ACHIEVEMENTS, type Achievement } from "@/lib/achievements";

export interface BadgeToastData {
  badgeId: string;
}

interface BadgeToastProps {
  badge: BadgeToastData | null;
  onDismiss: () => void;
  /** Auto-dismiss after this many ms. Default 4000 */
  duration?: number;
}

export function BadgeToast({ badge, onDismiss, duration = 4000 }: BadgeToastProps) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) return;

    // Haptic feedback (gated by user preference)
    if (Platform.OS !== "web") {
      shouldPlayHaptic().then((enabled) => {
        if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    }

    // Slide in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [badge]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!badge) return null;

  const achievement = ACHIEVEMENTS.find((a) => a.id === badge.badgeId);
  if (!achievement) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: achievement.color + "40",
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={dismiss}
        activeOpacity={0.8}
      >
        <View style={[styles.iconCircle, { backgroundColor: achievement.color + "20" }]}>
          <Ionicons name={achievement.icon as any} size={24} color={achievement.color} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            🏆 New Badge Unlocked!
          </Text>
          <Text style={[styles.badgeName, { color: achievement.color }]}>
            {achievement.name}
          </Text>
          <Text style={[styles.description, { color: colors.muted }]} numberOfLines={1}>
            {achievement.description}
          </Text>
        </View>

        <Ionicons name="close" size={18} color={colors.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 1,
  },
  description: {
    fontSize: 12,
  },
});
