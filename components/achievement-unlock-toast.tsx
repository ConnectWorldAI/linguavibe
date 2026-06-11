import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import type { AchievementToastData } from "@/lib/achievement-unlock";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Confetti Particle ────────────────────────────────────────────────────────

interface ConfettiParticle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
}

const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA",
  "#F472B6", "#34D399", "#FBBF24", "#60A5FA",
  "#F97316", "#22D3EE",
];

// ─── Component ────────────────────────────────────────────────────────────────

interface AchievementUnlockToastProps {
  toastData: AchievementToastData | null;
  onDismiss: () => void;
}

export function AchievementUnlockToast({ toastData, onDismiss }: AchievementUnlockToastProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-160)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);
  const [visible, setVisible] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toastData) {
      setVisible(true);

      // Haptic feedback
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Generate confetti if needed
      if (toastData.showConfetti) {
        generateConfetti();
      }

      // Slide in animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();

      // Glow pulse for gold/diamond
      if (toastData.achievement.tier === "gold" || toastData.achievement.tier === "diamond") {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          ])
        ).start();
      }

      // Auto-dismiss after 5 seconds
      dismissTimer.current = setTimeout(() => {
        dismissToast();
      }, 5000);

      return () => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
      };
    }
  }, [toastData]);

  const generateConfetti = () => {
    const particles: ConfettiParticle[] = Array.from({ length: 30 }, () => ({
      x: new Animated.Value(SCREEN_WIDTH / 2),
      y: new Animated.Value(-20),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 4,
    }));

    setConfettiParticles(particles);

    particles.forEach((p) => {
      const targetX = Math.random() * SCREEN_WIDTH;
      const targetY = 200 + Math.random() * 300;
      const duration = 1500 + Math.random() * 1000;

      Animated.parallel([
        Animated.timing(p.x, { toValue: targetX, duration, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: targetY, duration, useNativeDriver: true }),
        Animated.timing(p.rotation, { toValue: Math.random() * 720, duration, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0, duration: duration + 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -160, duration: 300, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setConfettiParticles([]);
      onDismiss();
    });
  };

  const handlePress = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissToast();
    // Navigate to achievements wall after dismiss animation
    setTimeout(() => {
      router.push(toastData?.navigateTo as any || "/achievements-wall");
    }, 350);
  };

  if (!visible || !toastData) return null;

  const { achievement } = toastData;
  const tierColor = getTierColor(achievement.tier);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Confetti particles */}
      {confettiParticles.map((particle, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.confettiParticle,
            {
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 720],
                    outputRange: ["0deg", "720deg"],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {/* Toast card */}
      <Animated.View
        style={[
          styles.toastContainer,
          {
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.toastCard, { borderColor: tierColor }]}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          {/* Glow effect for gold/diamond */}
          {(achievement.tier === "gold" || achievement.tier === "diamond") && (
            <Animated.View
              style={[
                styles.glowBorder,
                { borderColor: tierColor, opacity: glowAnim },
              ]}
            />
          )}

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${tierColor}20` }]}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.unlockLabel}>Achievement Unlocked!</Text>
              {achievement.tier && (
                <View style={[styles.tierBadge, { backgroundColor: `${tierColor}30` }]}>
                  <Text style={[styles.tierText, { color: tierColor }]}>
                    {achievement.tier.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.achievementTitle} numberOfLines={1}>
              {achievement.title}
            </Text>
            <Text style={styles.tapHint}>Tap to view trophy room →</Text>
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTierColor(tier?: string): string {
  switch (tier) {
    case "diamond": return "#B9F2FF";
    case "gold": return "#FFD700";
    case "silver": return "#C0C0C0";
    case "bronze": return "#CD7F32";
    default: return Colors.secondary;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  confettiParticle: {
    position: "absolute",
    borderRadius: 2,
  },
  toastContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: Spacing.md,
    right: Spacing.md,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glowBorder: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: BorderRadius.lg + 2,
    borderWidth: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  achievementIcon: {
    fontSize: 24,
  },
  contentContainer: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unlockLabel: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  achievementTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  tapHint: {
    fontSize: FontSize.xs - 1,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
