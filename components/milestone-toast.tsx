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
import type { Milestone } from "@/lib/streak-bonus";

interface MilestoneToastProps {
  milestone: Milestone | null;
  onDismiss: () => void;
}

export function MilestoneToast({ milestone, onDismiss }: MilestoneToastProps) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (milestone) {
      setVisible(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: -120, duration: 300, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          setVisible(false);
          onDismiss();
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [milestone]);

  if (!visible || !milestone) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name={milestone.icon as any} size={22} color={Colors.gold} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>🏆 Milestone Unlocked!</Text>
          <Text style={styles.milestoneName}>{milestone.title}</Text>
          <Text style={styles.description}>{milestone.description}</Text>
        </View>
        <View style={styles.creditsWrap}>
          <Text style={styles.creditsText}>+{milestone.credits}</Text>
          <Ionicons name="diamond" size={12} color={Colors.gold} />
        </View>
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
    borderColor: Colors.goldBorder,
    backgroundColor: Colors.goldGlow,
    padding: Spacing.md,
    zIndex: 9998,
    elevation: 10,
    shadowColor: Colors.gold,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gold,
  },
  milestoneName: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  description: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  creditsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditsText: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: Colors.gold,
  },
});
