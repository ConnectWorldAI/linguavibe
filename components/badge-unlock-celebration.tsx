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
import { Colors, FontSize } from "@/constants/Colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BadgeUnlockProps {
  visible: boolean;
  badge: {
    emoji: string;
    name: string;
    description: string;
  } | null;
  onDismiss: () => void;
}

// Confetti particle
interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
}

const CONFETTI_COLORS = [
  Colors.gold,
  Colors.secondary,
  "#FF6B6B",
  "#4ECDC4",
  "#A78BFA",
  "#F472B6",
  "#34D399",
  "#FBBF24",
  "#60A5FA",
  "#F97316",
];

export function BadgeUnlockCelebration({ visible, badge, onDismiss }: BadgeUnlockProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeRotation = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const [particles, setParticles] = useState<Particle[]>([]);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && badge) {
      // Haptic feedback
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Create confetti particles
      const newParticles: Particle[] = Array.from({ length: 40 }, () => ({
        x: new Animated.Value(SCREEN_WIDTH / 2),
        y: new Animated.Value(SCREEN_HEIGHT / 2),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(1),
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

      // Badge entrance: scale up with rotation
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(badgeScale, {
            toValue: 1,
            friction: 4,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(badgeRotation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Text fade in
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti explosion
      setTimeout(() => {
        newParticles.forEach((p) => {
          const angle = Math.random() * Math.PI * 2;
          const distance = 100 + Math.random() * 200;
          const targetX = SCREEN_WIDTH / 2 + Math.cos(angle) * distance;
          const targetY = SCREEN_HEIGHT / 2 + Math.sin(angle) * distance - 100;

          Animated.parallel([
            Animated.timing(p.x, {
              toValue: targetX,
              duration: 800 + Math.random() * 400,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(p.y, {
                toValue: targetY,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(p.y, {
                toValue: SCREEN_HEIGHT + 50,
                duration: 1000 + Math.random() * 500,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(p.rotation, {
              toValue: 3 + Math.random() * 5,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(800),
              Animated.timing(p.scale, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        });
      }, 200);

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Auto-dismiss after 4 seconds
      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 4000);
    }

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [visible, badge]);

  const handleDismiss = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(badgeScale, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      badgeRotation.setValue(0);
      glowOpacity.setValue(0);
      setParticles([]);
      onDismiss();
    });
  };

  if (!visible || !badge) return null;

  const spin = badgeRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        {/* Confetti particles */}
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.confetti,
              {
                width: p.size,
                height: p.size * (Math.random() > 0.5 ? 1 : 2),
                backgroundColor: p.color,
                borderRadius: p.size / 4,
                transform: [
                  { translateX: Animated.subtract(p.x, new Animated.Value(p.size / 2)) },
                  { translateY: Animated.subtract(p.y, new Animated.Value(p.size / 2)) },
                  { rotate: p.rotation.interpolate({ inputRange: [0, 10], outputRange: ["0deg", "3600deg"] }) },
                  { scale: p.scale },
                ],
              },
            ]}
          />
        ))}

        {/* Gold glow behind badge */}
        <Animated.View
          style={[
            styles.glowCircle,
            { opacity: glowOpacity },
          ]}
        />

        {/* Badge icon */}
        <Animated.View
          style={[
            styles.badgeContainer,
            {
              transform: [{ scale: badgeScale }, { rotate: spin }],
            },
          ]}
        >
          <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
        </Animated.View>

        {/* Badge info */}
        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text style={styles.unlockLabel}>BADGE UNLOCKED!</Text>
          <Text style={styles.badgeName}>{badge.name}</Text>
          <Text style={styles.badgeDesc}>{badge.description}</Text>
          <Text style={styles.tapHint}>Tap anywhere to dismiss</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
    backgroundColor: "rgba(2, 4, 6, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  touchArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  confetti: {
    position: "absolute",
  },
  glowCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 20,
  },
  badgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(10, 22, 40, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 30,
  },
  badgeEmoji: {
    fontSize: 56,
  },
  textContainer: {
    marginTop: 32,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  unlockLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.gold,
    letterSpacing: 3,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  badgeDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  tapHint: {
    marginTop: 24,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
