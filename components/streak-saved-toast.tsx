import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

interface StreakSavedToastProps {
  visible: boolean;
  streakCount?: number;
  onDismiss: () => void;
}

// ─── Milestone Configuration ────────────────────────────────────────────────

type MilestoneTheme = {
  emoji: string;
  title: string;
  message: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  hapticType: "success" | "warning" | "error";
};

function getMilestoneTheme(count: number): MilestoneTheme {
  if (count >= 365) {
    return {
      emoji: "👑",
      title: "👑 Legendary! 1 Year!",
      message: `${count}-day streak — You're unstoppable!`,
      color: "#FFD700",
      bgColor: "rgba(255, 215, 0, 0.12)",
      borderColor: "rgba(255, 215, 0, 0.5)",
      iconName: "trophy",
      hapticType: "success",
    };
  }
  if (count >= 100) {
    return {
      emoji: "💎",
      title: "💎 Diamond Streak!",
      message: `${count} days — Elite dedication!`,
      color: "#A855F7",
      bgColor: "rgba(168, 85, 247, 0.12)",
      borderColor: "rgba(168, 85, 247, 0.5)",
      iconName: "diamond",
      hapticType: "success",
    };
  }
  if (count >= 60) {
    return {
      emoji: "⚡",
      title: "⚡ Two Months Strong!",
      message: `${count}-day streak — Incredible consistency!`,
      color: "#3B82F6",
      bgColor: "rgba(59, 130, 246, 0.12)",
      borderColor: "rgba(59, 130, 246, 0.5)",
      iconName: "flash",
      hapticType: "success",
    };
  }
  if (count >= 30) {
    return {
      emoji: "🌟",
      title: "🌟 One Month Milestone!",
      message: `${count}-day streak — You're building a habit!`,
      color: "#F59E0B",
      bgColor: "rgba(245, 158, 11, 0.12)",
      borderColor: "rgba(245, 158, 11, 0.5)",
      iconName: "star",
      hapticType: "success",
    };
  }
  if (count >= 14) {
    return {
      emoji: "🚀",
      title: "🚀 Two Weeks!",
      message: `${count}-day streak — Keep the momentum!`,
      color: "#10B981",
      bgColor: "rgba(16, 185, 129, 0.12)",
      borderColor: "rgba(16, 185, 129, 0.5)",
      iconName: "rocket",
      hapticType: "success",
    };
  }
  if (count >= 7) {
    return {
      emoji: "🔥",
      title: "🔥 One Week Streak!",
      message: `${count} days in a row — Great start!`,
      color: "#EF4444",
      bgColor: "rgba(239, 68, 68, 0.12)",
      borderColor: "rgba(239, 68, 68, 0.4)",
      iconName: "flame",
      hapticType: "success",
    };
  }
  if (count >= 3) {
    return {
      emoji: "🔥",
      title: "🔥 Practice Recorded",
      message: `${count}-day streak — Nice rhythm!`,
      color: "#FF6B35",
      bgColor: "rgba(255, 107, 53, 0.1)",
      borderColor: "rgba(255, 107, 53, 0.4)",
      iconName: "flame",
      hapticType: "success",
    };
  }
  // Default (1-2 days or no count)
  return {
    emoji: "🔥",
    title: "🔥 Practice Recorded",
    message: count && count > 0 ? `${count}-day streak!` : "Streak saved!",
    color: "#FF6B35",
    bgColor: "rgba(255, 107, 53, 0.1)",
    borderColor: "rgba(255, 107, 53, 0.4)",
    iconName: "flame",
    hapticType: "success",
  };
}

/**
 * A brief toast notification that appears when a user's practice is recorded
 * toward their daily streak. Shows milestone-specific theming for 7/14/30/60/100/365-day streaks.
 */
export function StreakSavedToast({ visible, streakCount, onDismiss }: StreakSavedToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [shown, setShown] = useState(false);

  const theme = getMilestoneTheme(streakCount || 0);
  const isMilestone = (streakCount || 0) >= 7;

  useEffect(() => {
    if (visible) {
      setShown(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(
          isMilestone
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Success
        );
        // Extra haptic for big milestones
        if ((streakCount || 0) >= 30) {
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }, 200);
        }
      }
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 90, friction: 10 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
      ]).start();

      // Milestones stay visible longer
      const displayDuration = isMilestone ? 4000 : 2500;

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: -100, duration: 250, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => {
          setShown(false);
          onDismiss();
        });
      }, displayDuration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shown || !visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.bgColor,
          borderColor: theme.borderColor,
          shadowColor: theme.color,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.color + "25" }]}>
          <Ionicons name={theme.iconName as any} size={20} color={theme.color} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: theme.color }]}>{theme.title}</Text>
          <Text style={styles.description}>{theme.message}</Text>
        </View>
        {isMilestone && (
          <View style={[styles.badge, { backgroundColor: theme.color + "20" }]}>
            <Text style={[styles.badgeText, { color: theme.color }]}>{streakCount}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    zIndex: 9997,
    elevation: 9,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  description: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
