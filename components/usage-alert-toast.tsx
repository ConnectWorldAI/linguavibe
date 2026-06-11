import React, { useEffect, useRef, useState } from "react";
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
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  type UsageAlert,
  type AlertLevel,
  OVERAGE_RATES,
} from "@/lib/usage-limits";

interface UsageAlertToastProps {
  alert: UsageAlert | null;
  onDismiss: () => void;
  onPayAsYouGo?: () => void;
}

const ALERT_CONFIG: Record<AlertLevel, { icon: string; color: string; bgColor: string }> = {
  none: { icon: "information-circle", color: Colors.textSecondary, bgColor: Colors.surfaceCard },
  nudge: { icon: "alert-circle", color: Colors.warning, bgColor: Colors.warning + "12" },
  warning: { icon: "warning", color: "#FF6B35", bgColor: "#FF6B35" + "12" },
  critical: { icon: "close-circle", color: Colors.error, bgColor: Colors.error + "12" },
};

export function UsageAlertToast({ alert, onDismiss, onPayAsYouGo }: UsageAlertToastProps) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setVisible(true);
      if (Platform.OS !== "web") {
        if (alert.level === "critical") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (alert.level === "warning") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 15 }).start();
      if (alert.level === "nudge") {
        const timer = setTimeout(() => handleDismiss(), 5000);
        return () => clearTimeout(timer);
      }
    } else {
      handleDismiss();
    }
  }, [alert]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, { toValue: -120, duration: 200, useNativeDriver: true }).start(() => {
      setVisible(false);
      onDismiss();
    });
  };

  if (!visible || !alert) return null;

  const config = ALERT_CONFIG[alert.level];
  const rate = OVERAGE_RATES[alert.service];

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], backgroundColor: config.bgColor },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: config.color + "20" }]}>
          <Ionicons name={config.icon as any} size={22} color={config.color} />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.message} numberOfLines={2}>{alert.message}</Text>
          {alert.level === "critical" && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.payGoButton}
                onPress={() => { onPayAsYouGo?.(); handleDismiss(); }}
              >
                <Text style={styles.payGoText}>
                  Pay-as-you-go (${rate.pricePerUnit.toFixed(2)}/{rate.unit.replace("per ", "")})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => { handleDismiss(); router.push("/subscription"); }}
              >
                <Ionicons name="arrow-up-circle" size={14} color={Colors.secondary} />
                <Text style={styles.upgradeText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          )}
          {alert.level === "warning" && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => { handleDismiss(); router.push("/subscription"); }}
            >
              <Ionicons name="arrow-up-circle" size={14} color={Colors.secondary} />
              <Text style={styles.upgradeText}>Upgrade Plan</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: {
    flex: 1,
    gap: 8,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  payGoButton: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  payGoText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.secondary + "15",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  upgradeText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: "600",
  },
  closeBtn: {
    padding: 4,
  },
});
