import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";

const { width } = Dimensions.get("window");

interface CallLimitPaywallProps {
  visible: boolean;
  onDismiss: () => void;
  minutesUsed: number;
  minutesLimit: number;
  onUpgrade?: () => void;
}

const UPGRADE_OPTIONS = [
  {
    id: "pro",
    name: "Pro",
    price: "$9.99/mo",
    minutes: "30 min/month",
    color: Colors.secondary,
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$24.99/mo",
    minutes: "Unlimited",
    color: Colors.gold,
  },
];

export function CallLimitPaywall({
  visible,
  onDismiss,
  minutesUsed,
  minutesLimit,
  onUpgrade,
}: CallLimitPaywallProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleUpgrade = (tierId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDismiss();
    router.push("/subscription");
    onUpgrade?.();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Call ended indicator */}
          <View style={styles.handleBar} />

          {/* Warning icon */}
          <View style={styles.warningIcon}>
            <Ionicons name="time" size={36} color={Colors.warning} />
          </View>

          <Text style={styles.title}>Free Call Time Ended</Text>
          <Text style={styles.subtitle}>
            Your {minutesLimit}-minute free tier call limit has been reached. Upgrade to keep talking!
          </Text>

          {/* Usage bar */}
          <View style={styles.usageSection}>
            <View style={styles.usageHeader}>
              <Text style={styles.usageLabel}>Call time used</Text>
              <Text style={styles.usageValue}>{minutesUsed}/{minutesLimit} min</Text>
            </View>
            <View style={styles.usageBarBg}>
              <View style={[styles.usageBarFill, { width: "100%" }]} />
            </View>
          </View>

          {/* Upgrade options */}
          <View style={styles.optionsContainer}>
            {UPGRADE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  option.popular && styles.optionCardPopular,
                ]}
                onPress={() => handleUpgrade(option.id)}
                activeOpacity={0.7}
              >
                {option.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                <View style={styles.optionHeader}>
                  <Text style={[styles.optionName, { color: option.color }]}>{option.name}</Text>
                  <Text style={styles.optionPrice}>{option.price}</Text>
                </View>
                <View style={styles.optionFeature}>
                  <Ionicons name="call" size={14} color={option.color} />
                  <Text style={styles.optionMinutes}>{option.minutes} of calls</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dismiss */}
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Call Duration Timer Hook ────────────────────────────────────────────────

export function useCallDurationLimit(limitMinutes: number = 5) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const limitSeconds = limitMinutes * 60;

  useEffect(() => {
    if (isActive && !isLimitReached) {
      intervalRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          if (next >= limitSeconds) {
            setIsLimitReached(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isLimitReached, limitSeconds]);

  const startTimer = () => setIsActive(true);
  const stopTimer = () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const resetTimer = () => {
    setSecondsElapsed(0);
    setIsLimitReached(false);
    setIsActive(false);
  };

  const minutesRemaining = Math.max(0, Math.ceil((limitSeconds - secondsElapsed) / 60));
  const formattedTime = `${Math.floor(secondsElapsed / 60)}:${String(secondsElapsed % 60).padStart(2, "0")}`;
  const warningThreshold = secondsElapsed >= limitSeconds * 0.8; // 80% used

  return {
    secondsElapsed,
    isLimitReached,
    isActive,
    startTimer,
    stopTimer,
    resetTimer,
    minutesRemaining,
    formattedTime,
    warningThreshold,
    limitMinutes,
  };
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 40,
    alignItems: "center",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  warningIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.warning + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.warning + "30",
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  usageSection: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  usageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  usageValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.error,
  },
  usageBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden",
  },
  usageBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  optionsContainer: {
    width: "100%",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  optionCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardPopular: {
    borderColor: Colors.secondary + "50",
    backgroundColor: Colors.secondary + "08",
  },
  popularBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.secondary,
    textTransform: "uppercase",
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  optionName: {
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  optionPrice: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  optionFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optionMinutes: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  dismissButton: {
    paddingVertical: 12,
  },
  dismissText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
