import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { useUsage } from "@/lib/usage-context";

const EXPIRATION_DISMISSED_KEY = "@connectworld_expiration_dismissed";

export function ExpirationWarning() {
  const { usage, tierLimits } = useUsage();
  const [visible, setVisible] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [unusedCredits, setUnusedCredits] = useState(0);
  const slideAnim = useRef(new Animated.Value(150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkExpiration();
  }, [usage]);

  const checkExpiration = async () => {
    try {
      const today = new Date();
      const cycleEnd = new Date(usage.billingCycleEnd);
      const diffMs = cycleEnd.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Only show if 3 days or less remain
      if (diffDays > 3 || diffDays < 0) return;

      // Check if already dismissed today
      const dismissed = await AsyncStorage.getItem(EXPIRATION_DISMISSED_KEY);
      const todayStr = today.toISOString().split("T")[0];
      if (dismissed === todayStr) return;

      // Calculate unused credits
      const remaining = Math.max(
        (usage.creditsTotal || tierLimits.credits) - usage.creditsUsed,
        0
      );

      // Only show if user has credits remaining
      if (remaining <= 0) return;

      setDaysLeft(diffDays);
      setUnusedCredits(remaining);
      setVisible(true);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 12,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } catch {}
  };

  const dismiss = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const todayStr = new Date().toISOString().split("T")[0];
    await AsyncStorage.setItem(EXPIRATION_DISMISSED_KEY, todayStr);

    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 150, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const handleUseCredits = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dismiss();
    router.push("/usage-dashboard" as any);
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="hourglass" size={22} color={Colors.warning} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Credits Expiring Soon!</Text>
          <Text style={styles.description}>
            You have {unusedCredits} unused credits.{" "}
            {daysLeft === 0
              ? "They reset today!"
              : daysLeft === 1
              ? "They reset tomorrow!"
              : `They reset in ${daysLeft} days.`}
          </Text>
        </View>
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.ctaBtn} onPress={handleUseCredits}>
        <Ionicons name="flash" size={16} color={Colors.primary} />
        <Text style={styles.ctaText}>Use Your Credits</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.yellowBorder,
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    zIndex: 9997,
    elevation: 10,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.yellowGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.warning,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    marginTop: Spacing.sm,
  },
  ctaText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
});
