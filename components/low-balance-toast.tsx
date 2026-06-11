import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useUsage, type LowBalanceAlert, type UsageCategory } from "@/lib/usage-context";

const CATEGORY_LABELS: Record<UsageCategory, string> = {
  talk: "Voice Call Minutes",
  video: "Video Call Minutes",
  song: "Song Translations",
  teacher: "AI Teacher Minutes",
  credits: "Credits",
};

const CATEGORY_ICONS: Record<UsageCategory, string> = {
  talk: "call",
  video: "videocam",
  song: "musical-notes",
  teacher: "school",
  credits: "diamond",
};

export function LowBalanceToast() {
  const { lowBalanceAlert, dismissAlert } = useUsage();
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lowBalanceAlert) {
      // Show toast
      if (Platform.OS !== "web") {
        if (lowBalanceAlert.level === "exceeded") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      // Auto-dismiss after 6 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [lowBalanceAlert]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -150, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      dismissAlert();
    });
  };

  if (!lowBalanceAlert) return null;

  const { category, level, percentUsed, remaining, limit } = lowBalanceAlert;
  const label = CATEGORY_LABELS[category];
  const icon = CATEGORY_ICONS[category];

  const getBgColor = () => {
    switch (level) {
      case "warning": return Colors.goldGlow;
      case "critical": return Colors.redGlow;
      case "exceeded": return "rgba(255, 68, 68, 0.25)";
    }
  };

  const getBorderColor = () => {
    switch (level) {
      case "warning": return Colors.goldBorder;
      case "critical": return Colors.redBorder;
      case "exceeded": return Colors.error;
    }
  };

  const getIconColor = () => {
    switch (level) {
      case "warning": return Colors.warning;
      case "critical": return Colors.error;
      case "exceeded": return Colors.error;
    }
  };

  const getMessage = () => {
    switch (level) {
      case "warning": return `${label}: ${remaining} remaining (${Math.round(percentUsed)}% used)`;
      case "critical": return `⚠️ ${label}: Only ${remaining} left!`;
      case "exceeded": return `🚫 ${label}: Limit reached! Upgrade for more.`;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: getBgColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: getIconColor() + "30" }]}>
          <Ionicons name={icon as any} size={20} color={getIconColor()} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>
            {level === "exceeded" ? "Limit Reached" : "Low Balance Alert"}
          </Text>
          <Text style={styles.message}>{getMessage()}</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={hideToast}>
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {level !== "warning" && (
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() => {
            hideToast();
            router.push("/subscription" as any);
          }}
        >
          <Ionicons name="rocket" size={14} color="#fff" />
          <Text style={styles.upgradeBtnText}>
            {level === "exceeded" ? "Upgrade Now" : "Get More"}
          </Text>
        </TouchableOpacity>
      )}
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
    padding: Spacing.md,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    color: Colors.textPrimary,
  },
  message: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: Colors.secondary,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  upgradeBtnText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: "#fff",
  },
});
