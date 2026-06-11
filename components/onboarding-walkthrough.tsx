/**
 * Post-Onboarding Guided Walkthrough
 * 
 * A tooltip-style walkthrough that highlights key features after the user
 * completes initial onboarding and lands on the home screen for the first time.
 * Shows contextual tooltips pointing to UI elements to guide discovery.
 * 
 * Features highlighted:
 * 1. Pronunciation Duels — competitive practice
 * 2. Voice Rooms — live group conversation
 * 3. Referral Program — invite friends for rewards
 * 4. Achievements — gamification trophy room
 * 5. Daily Challenge — streak-building habit
 */
import { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const WALKTHROUGH_COMPLETE_KEY = "@connectworld_walkthrough_complete";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── WALKTHROUGH STEPS ──────────────────────────────────────────────────────

export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action?: string; // Optional CTA text
  route?: string; // Optional navigation target
  position: "top" | "center" | "bottom";
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "welcome_back",
    title: "Welcome to ConnectWorld AI! 🎉",
    description: "Let's take a quick tour of the features that will accelerate your language learning. This takes about 30 seconds.",
    icon: "rocket",
    color: "#3B82F6",
    position: "center",
  },
  {
    id: "pronunciation_duels",
    title: "Pronunciation Duels ⚔️",
    description: "Challenge other learners to real-time pronunciation battles. Win duels to climb the ranked leaderboard and earn ELO points!",
    icon: "mic",
    color: "#EF4444",
    action: "Try a Duel",
    route: "/duel-multiplayer",
    position: "bottom",
  },
  {
    id: "voice_rooms",
    title: "Live Voice Rooms 🎙️",
    description: "Join group conversations with AI moderation. Practice speaking with learners at your level — the AI keeps the conversation flowing and corrects mistakes in real-time.",
    icon: "people",
    color: "#8B5CF6",
    action: "Explore Rooms",
    route: "/voice-rooms",
    position: "center",
  },
  {
    id: "referral_rewards",
    title: "Invite Friends, Earn Rewards 🎁",
    description: "Share your invite code to unlock tiered rewards: extra video call time, translation credits, and exclusive badges. Reach Legend tier for lifetime perks!",
    icon: "gift",
    color: "#F59E0B",
    action: "See Rewards",
    route: "/referral",
    position: "center",
  },
  {
    id: "achievements",
    title: "Trophy Room 🏆",
    description: "Every duel won, streak maintained, and word mastered earns you achievements. Unlock gold and diamond badges to share on social media!",
    icon: "trophy",
    color: "#10B981",
    action: "View Trophies",
    route: "/achievements-wall",
    position: "center",
  },
  {
    id: "daily_challenge",
    title: "Daily Challenges 📅",
    description: "Complete today's Word of the Day challenge to build your streak. Morning notifications will remind you — consistency is key to fluency!",
    icon: "today",
    color: "#06B6D4",
    position: "bottom",
  },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

interface OnboardingWalkthroughProps {
  onComplete?: () => void;
}

export function OnboardingWalkthrough({ onComplete }: OnboardingWalkthroughProps) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    checkShouldShow();
  }, []);

  useEffect(() => {
    if (visible) {
      animateIn();
    }
  }, [visible, currentStep]);

  const checkShouldShow = async () => {
    try {
      const completed = await AsyncStorage.getItem(WALKTHROUGH_COMPLETE_KEY);
      if (!completed) {
        // Small delay to let the home screen render first
        setTimeout(() => setVisible(true), 800);
      }
    } catch {}
  };

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const animateOut = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(callback);
  };

  const handleNext = () => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      animateOut(() => {
        setCurrentStep(currentStep + 1);
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(WALKTHROUGH_COMPLETE_KEY, "true");
    animateOut(() => {
      setVisible(false);
      onComplete?.();
    });
  };

  const handleAction = (step: WalkthroughStep) => {
    if (step.route) {
      handleComplete();
      setTimeout(() => {
        router.push(step.route as any);
      }, 300);
    } else {
      handleNext();
    }
  };

  if (!visible) return null;

  const step = WALKTHROUGH_STEPS[currentStep];
  const progress = (currentStep + 1) / WALKTHROUGH_STEPS.length;

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdropTouch} onPress={handleSkip} activeOpacity={1} />
      </Animated.View>

      {/* Tooltip Card */}
      <Animated.View
        style={[
          styles.tooltipCard,
          step.position === "top" && styles.tooltipTop,
          step.position === "center" && styles.tooltipCenter,
          step.position === "bottom" && styles.tooltipBottom,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: step.color }]} />
        </View>

        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: step.color + "20" }]}>
          <Ionicons name={step.icon as any} size={32} color={step.color} />
        </View>

        {/* Content */}
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>

        {/* Actions */}
        <View style={styles.actionRow}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip Tour</Text>
            </TouchableOpacity>
          )}
          <View style={styles.actionRight}>
            {step.action && (
              <TouchableOpacity
                onPress={() => handleAction(step)}
                style={[styles.actionBtn, { backgroundColor: step.color + "20", borderColor: step.color }]}
              >
                <Text style={[styles.actionText, { color: step.color }]}>{step.action}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleNext} style={[styles.nextBtn, { backgroundColor: step.color }]}>
              <Text style={styles.nextText}>
                {currentStep < WALKTHROUGH_STEPS.length - 1 ? "Next" : "Done!"}
              </Text>
              <Ionicons
                name={currentStep < WALKTHROUGH_STEPS.length - 1 ? "arrow-forward" : "checkmark"}
                size={16}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Step Counter */}
        <View style={styles.stepCounter}>
          {WALKTHROUGH_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.counterDot,
                i === currentStep && { backgroundColor: step.color, width: 20 },
                i < currentStep && { backgroundColor: step.color + "60" },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── UTILITY ────────────────────────────────────────────────────────────────

/**
 * Check if the walkthrough has been completed
 */
export async function hasCompletedWalkthrough(): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem(WALKTHROUGH_COMPLETE_KEY);
    return completed === "true";
  } catch {
    return false;
  }
}

/**
 * Reset the walkthrough (for testing or re-showing)
 */
export async function resetWalkthrough(): Promise<void> {
  await AsyncStorage.removeItem(WALKTHROUGH_COMPLETE_KEY);
}

/**
 * Get the walkthrough steps (for testing)
 */
export function getWalkthroughSteps(): WalkthroughStep[] {
  return WALKTHROUGH_STEPS;
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  backdropTouch: {
    flex: 1,
  },
  tooltipCard: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  tooltipTop: {
    top: Platform.OS === "web" ? 80 : 120,
  },
  tooltipCenter: {
    top: SCREEN_HEIGHT * 0.25,
  },
  tooltipBottom: {
    bottom: Platform.OS === "web" ? 100 : 160,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 13,
    color: "#999",
  },
  actionRight: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  nextText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  stepCounter: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  counterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
});
