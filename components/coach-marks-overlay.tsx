import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

const COACH_MARKS_KEY = "@connectworld_coach_marks_seen";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CoachStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  position: "top" | "center" | "bottom";
}

const COACH_STEPS: CoachStep[] = [
  {
    id: "lesson",
    title: "Start Your First Lesson",
    description: "Tap here to dive into structured lessons with grammar, vocabulary, and cultural insights tailored to your level.",
    icon: "book",
    route: "/lessons",
    color: "#6C63FF",
    position: "top",
  },
  {
    id: "conversation",
    title: "Practice a Conversation",
    description: "Chat with your AI teacher in real-time. They'll correct your mistakes and teach you natural phrases.",
    icon: "chatbubbles",
    route: "/conversation-sim",
    color: "#00C9A7",
    position: "center",
  },
  {
    id: "report",
    title: "Track Your Progress",
    description: "Check your weekly report card to see your grade, strengths, and areas to improve.",
    icon: "stats-chart",
    route: "/progress-report-card",
    color: "#FF6B6B",
    position: "bottom",
  },
];

interface CoachMarksOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

export function CoachMarksOverlay({ visible, onDismiss }: CoachMarksOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      animateIn();
      startPulse();
    }
  }, [visible, currentStep]);

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep < COACH_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handleTapAction = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const step = COACH_STEPS[currentStep];
    handleDismiss();
    setTimeout(() => {
      router.push(step.route as any);
    }, 200);
  };

  const handleDismiss = async () => {
    await AsyncStorage.setItem(COACH_MARKS_KEY, "true");
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      onDismiss();
    });
  };

  const handleSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    handleDismiss();
  };

  if (!visible) return null;

  const step = COACH_STEPS[currentStep];

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.backdrop} />
      <View style={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {COACH_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStep && styles.dotActive,
                i < currentStep && styles.dotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Skip button */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip Tour</Text>
        </TouchableOpacity>

        {/* Main card */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Icon circle with pulse */}
          <Animated.View
            style={[
              styles.iconCircle,
              { backgroundColor: step.color + "20", transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={[styles.iconInner, { backgroundColor: step.color }]}>
              <Ionicons name={step.icon as any} size={32} color="#fff" />
            </View>
          </Animated.View>

          {/* Step number */}
          <View style={[styles.stepBadge, { backgroundColor: step.color }]}>
            <Text style={styles.stepBadgeText}>
              {currentStep + 1} of {COACH_STEPS.length}
            </Text>
          </View>

          {/* Text */}
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: step.color }]}
              onPress={handleTapAction}
            >
              <Ionicons name="arrow-forward" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Go There Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={[styles.nextBtnText, { color: step.color }]}>
                {currentStep < COACH_STEPS.length - 1 ? "Next Tip →" : "Got It ✓"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// Helper to check if coach marks have been seen
export async function hasSeenCoachMarks(): Promise<boolean> {
  try {
    const seen = await AsyncStorage.getItem(COACH_MARKS_KEY);
    return seen === "true";
  } catch {
    return false;
  }
}

// Helper to reset coach marks (for testing)
export async function resetCoachMarks(): Promise<void> {
  await AsyncStorage.removeItem(COACH_MARKS_KEY);
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stepIndicator: {
    position: "absolute",
    top: 80,
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#fff",
  },
  dotCompleted: {
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  skipBtn: {
    position: "absolute",
    top: 72,
    right: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1a1d21",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  nextBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
