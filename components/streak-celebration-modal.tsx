/**
 * StreakCelebrationModal — Animated confetti + badge overlay
 * Shows when a streak milestone is newly reached.
 * Uses react-native-reanimated for smooth confetti particle animations.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { shouldPlayHaptic } from "@/lib/sound-settings";
import { Colors } from "@/constants/Colors";
import { STREAK_MILESTONES } from "@/lib/milestone-celebration";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONFETTI_COUNT = 40;
const CONFETTI_COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FF9FF3", "#00AAFF", "#FF2D2D"];

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: "square" | "circle" | "strip";
}

interface Props {
  visible: boolean;
  streakDays: number;
  onDismiss: () => void;
}

function getBadgeInfo(streakDays: number): { emoji: string; title: string; subtitle: string; color: string } {
  if (streakDays >= 365) return { emoji: "🌟", title: "LEGENDARY!", subtitle: "365-day streak!", color: "#EC4899" };
  if (streakDays >= 100) return { emoji: "👑", title: "UNSTOPPABLE!", subtitle: "100-day streak!", color: "#8B5CF6" };
  if (streakDays >= 60) return { emoji: "🏆", title: "CHAMPION!", subtitle: "60-day streak!", color: "#F59E0B" };
  if (streakDays >= 30) return { emoji: "💪", title: "DEDICATED!", subtitle: "30-day streak!", color: "#10B981" };
  if (streakDays >= 14) return { emoji: "⚡", title: "MOMENTUM!", subtitle: "14-day streak!", color: "#EAB308" };
  return { emoji: "🔥", title: "ON FIRE!", subtitle: "7-day streak!", color: "#F97316" };
}

export function StreakCelebrationModal({ visible, streakDays, onDismiss }: Props) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const badgeRotate = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const badge = getBadgeInfo(streakDays);

  useEffect(() => {
    if (!visible) return;

    // Create confetti pieces
    const pieces: ConfettiPiece[] = Array.from({ length: CONFETTI_COUNT }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 10,
      shape: (["square", "circle", "strip"] as const)[Math.floor(Math.random() * 3)],
    }));
    setConfetti(pieces);

    // Animate confetti falling
    pieces.forEach((piece, index) => {
      const delay = index * 30;
      const duration = 2000 + Math.random() * 1500;

      Animated.parallel([
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 50,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: (piece.x as any)._value + (Math.random() - 0.5) * 150,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.opacity, {
          toValue: 0,
          duration: duration * 0.8,
          delay: delay + duration * 0.5,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Badge entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Badge subtle rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeRotate, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(badgeRotate, { toValue: -1, duration: 2000, useNativeDriver: true }),
        Animated.timing(badgeRotate, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Haptic on show (gated by preference)
    if (Platform.OS !== "web") {
      shouldPlayHaptic().then((on) => {
        if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    }

    return () => {
      scaleAnim.setValue(0);
      badgeRotate.setValue(0);
      glowAnim.setValue(0);
    };
  }, [visible]);

  const handleDismiss = () => {
    if (Platform.OS !== "web") shouldPlayHaptic().then((on) => { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); });
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  const rotateInterpolate = badgeRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-3deg", "0deg", "3deg"],
  });

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        {/* Confetti particles */}
        {confetti.map((piece, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: piece.color,
                width: piece.shape === "strip" ? piece.size * 0.4 : piece.size,
                height: piece.shape === "strip" ? piece.size * 2 : piece.size,
                borderRadius: piece.shape === "circle" ? piece.size / 2 : piece.shape === "strip" ? 2 : 2,
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  {
                    rotate: piece.rotation.interpolate({
                      inputRange: [-360, 0, 360],
                      outputRange: ["-360deg", "0deg", "360deg"],
                    }),
                  },
                ],
                opacity: piece.opacity,
              },
            ]}
          />
        ))}

        {/* Badge card */}
        <Animated.View
          style={[
            styles.badgeCard,
            {
              transform: [{ scale: scaleAnim }, { rotate: rotateInterpolate }],
              borderColor: badge.color + "60",
            },
          ]}
        >
          {/* Glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                borderColor: badge.color,
                opacity: glowAnim,
              },
            ]}
          />

          <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
          <Text style={[styles.badgeTitle, { color: badge.color }]}>{badge.title}</Text>
          <Text style={styles.badgeSubtitle}>{badge.subtitle}</Text>

          <View style={styles.streakRow}>
            <Text style={styles.streakNumber}>{streakDays}</Text>
            <Text style={styles.streakLabel}>days</Text>
          </View>

          <Text style={styles.motivationText}>
            {streakDays >= 100
              ? "You're in the top 1% of learners!"
              : streakDays >= 30
              ? "Consistency is your superpower!"
              : "Keep the momentum going!"}
          </Text>

          <TouchableOpacity style={[styles.dismissBtn, { backgroundColor: badge.color }]} onPress={handleDismiss}>
            <Text style={styles.dismissBtnText}>Keep Going!</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  confettiPiece: {
    position: "absolute",
  },
  badgeCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 340,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  glowRing: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
    borderWidth: 3,
  },
  badgeEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  badgeTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  badgeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: "200",
    color: Colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  streakLabel: {
    fontSize: 18,
    color: Colors.textMuted,
    marginLeft: 6,
  },
  motivationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  dismissBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  dismissBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
