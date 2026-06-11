import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Share } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const Colors = {
  primary: "#0A0E1A",
  secondary: "#00AAFF",
  gold: "#FFD700",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  success: "#00E676",
};

const CONFETTI_COLORS = ["#FFD700", "#00AAFF", "#FF6B6B", "#00E676", "#FF9F43", "#A855F7", "#EC4899"];
const NUM_CONFETTI = 60;

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
}

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: NUM_CONFETTI }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 800,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

function ConfettiPieceComponent({ piece }: { piece: ConfettiPiece }) {
  const translateY = useSharedValue(-50);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      piece.delay,
      withTiming(SCREEN_HEIGHT + 50, { duration: 2500 + Math.random() * 1000, easing: Easing.out(Easing.quad) })
    );
    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 720, { duration: 3000 })
    );
    opacity.value = withDelay(
      piece.delay + 2000,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: piece.x,
          top: -20,
          width: piece.size,
          height: piece.size * 1.5,
          backgroundColor: piece.color,
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
}

interface ConfettiOverlayProps {
  visible: boolean;
  courseName: string;
  onDismiss: () => void;
}

export function ConfettiOverlay({ visible, courseName, onDismiss }: ConfettiOverlayProps) {
  const confettiPieces = useRef(generateConfetti()).current;
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.5);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 600);
      }
      overlayOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withDelay(400, withSequence(
        withTiming(1.05, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 150 })
      ));
      cardOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = 0.5;
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: visible ? "auto" as const : "none" as const,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const handleShare = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `🎉 I just completed "${courseName}" on ConnectWorld AI! Another step toward fluency! 🌍\n\n#ConnectWorldAI #LanguageLearning #Achievement`,
        title: "Course Completed!",
      });
    } catch (e) {
      // User cancelled
    }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      {/* Confetti */}
      {confettiPieces.map((piece) => (
        <ConfettiPieceComponent key={piece.id} piece={piece} />
      ))}

      {/* Celebration Card */}
      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subtitle}>You completed</Text>
        <Text style={styles.courseName}>{courseName}</Text>
        <Text style={styles.description}>
          All lessons finished! You've earned a certificate of completion.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share Achievement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={styles.dismissBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  card: {
    backgroundColor: "#141825",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 32,
    borderWidth: 1,
    borderColor: "rgba(0,170,255,0.3)",
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "900", color: Colors.gold, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
  courseName: { fontSize: 18, fontWeight: "700", color: Colors.secondary, textAlign: "center", marginBottom: 12 },
  description: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  actions: { width: "100%", gap: 10 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  dismissBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dismissBtnText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
});
