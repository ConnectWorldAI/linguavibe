import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface StreakCelebrationProps {
  visible: boolean;
  streakDays: number;
  onDismiss: () => void;
}

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
}

const CONFETTI_COLORS = [
  "#FFD700", // Gold
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#A78BFA", // Purple
  "#F472B6", // Pink
  "#34D399", // Green
  "#FBBF24", // Amber
  "#60A5FA", // Blue
  "#F97316", // Orange
  "#E879F9", // Fuchsia
];

const MILESTONE_CONFIG: Record<number, { emoji: string; title: string; message: string }> = {
  7: {
    emoji: "🔥",
    title: "1 Week Streak!",
    message: "You've been reviewing grammar every day for a full week!",
  },
  14: {
    emoji: "⚡",
    title: "2 Week Streak!",
    message: "Two weeks of consistent grammar practice — incredible dedication!",
  },
  30: {
    emoji: "🏆",
    title: "30 Day Streak!",
    message: "A full month of daily grammar reviews — you're unstoppable!",
  },
  60: {
    emoji: "💎",
    title: "60 Day Streak!",
    message: "Two months of daily practice — your grammar mastery is showing!",
  },
  90: {
    emoji: "👑",
    title: "90 Day Streak!",
    message: "Three months! You've built an unbreakable learning habit!",
  },
  100: {
    emoji: "🌟",
    title: "100 Day Streak!",
    message: "Triple digits! You're in the top 1% of language learners!",
  },
  365: {
    emoji: "🎆",
    title: "1 Year Streak!",
    message: "365 days of grammar mastery — legendary achievement!",
  },
};

function getMilestoneConfig(days: number) {
  // Check exact milestones first
  if (MILESTONE_CONFIG[days]) return MILESTONE_CONFIG[days];
  // For non-standard milestones, find the closest
  return {
    emoji: "🔥",
    title: `${days} Day Streak!`,
    message: `${days} days of consistent grammar practice — amazing!`,
  };
}

export function StreakCelebration({ visible, streakDays, onDismiss }: StreakCelebrationProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0)).current;
  const cardRotation = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const [particles, setParticles] = useState<Particle[]>([]);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Create confetti particles
      const newParticles: Particle[] = Array.from({ length: 45 }, () => ({
        x: new Animated.Value(SCREEN_WIDTH / 2),
        y: new Animated.Value(SCREEN_HEIGHT / 2),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(0),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
      }));
      setParticles(newParticles);

      // Animate overlay in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Animate card entrance with bounce
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate emoji bounce
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(emojiScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        delay: 400,
        useNativeDriver: true,
      }).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.2,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Confetti burst
      setTimeout(() => {
        newParticles.forEach((p) => {
          const angle = Math.random() * Math.PI * 2;
          const distance = 80 + Math.random() * 200;
          const targetX = SCREEN_WIDTH / 2 + Math.cos(angle) * distance;
          const targetY = SCREEN_HEIGHT / 2 + Math.sin(angle) * distance - 50;

          Animated.parallel([
            Animated.timing(p.x, {
              toValue: targetX,
              duration: 600 + Math.random() * 400,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(p.y, {
                toValue: targetY - 100,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(p.y, {
                toValue: SCREEN_HEIGHT + 50,
                duration: 1200 + Math.random() * 800,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(p.rotation, {
              toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(p.scale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(p.scale, {
                toValue: 0,
                duration: 1500,
                delay: 500,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        });
      }, 100);

      // Auto-dismiss after 5 seconds
      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 5000);
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [visible]);

  const handleDismiss = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setParticles([]);
      emojiScale.setValue(0);
      textOpacity.setValue(0);
      glowOpacity.setValue(0);
      cardRotation.setValue(0);
      onDismiss();
    });
  };

  if (!visible) return null;

  const config = getMilestoneConfig(streakDays);

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <TouchableOpacity style={styles.dismissArea} onPress={handleDismiss} activeOpacity={1}>
        {/* Confetti particles */}
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  {
                    rotate: p.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                  { scale: p.scale },
                ],
              },
            ]}
          />
        ))}

        {/* Glow effect */}
        <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

        {/* Celebration card */}
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
          {/* Streak flame ring */}
          <Animated.View style={[styles.emojiContainer, { transform: [{ scale: emojiScale }] }]}>
            <Text style={styles.emoji}>{config.emoji}</Text>
          </Animated.View>

          <Animated.View style={{ opacity: textOpacity }}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.message}>{config.message}</Text>

            {/* Streak counter */}
            <View style={styles.streakCounter}>
              <Text style={styles.streakNumber}>{streakDays}</Text>
              <Text style={styles.streakLabel}>days</Text>
            </View>

            <TouchableOpacity style={styles.continueBtn} onPress={handleDismiss}>
              <Text style={styles.continueBtnText}>Keep Going!</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Milestone Check Helper ─────────────────────────────────────────────────
/**
 * Check if a streak count is a celebration-worthy milestone.
 */
export function isStreakMilestone(days: number): boolean {
  return days === 7 || days === 14 || days === 30 || days === 60 || days === 90 || days === 100 || days === 365;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  dismissArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  particle: {
    position: "absolute",
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#FFD700",
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: SCREEN_WIDTH * 0.82,
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFD70020",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFD70050",
  },
  emoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  streakCounter: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 24,
    gap: 4,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: "900",
    color: "#fff",
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
  },
  continueBtn: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
  },
});
