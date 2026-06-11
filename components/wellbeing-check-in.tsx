/**
 * Wellbeing Check-In Component
 * 
 * A gentle, non-intrusive check-in that Wave Cloud uses to understand
 * how the student is doing emotionally, physically, and socially.
 * 
 * Appears:
 * - Once daily when the app is opened (if enabled)
 * - After Wave Cloud detects concerning patterns
 * - When the student hasn't checked in for 2+ days
 * 
 * Design: Feels like a friend asking "How are you?" not a clinical survey.
 */
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { recordWellbeing } from "@/lib/wave-cloud-memory";
import type { WellbeingEntry } from "@/lib/wave-cloud-memory";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface WellbeingCheckInProps {
  visible: boolean;
  onComplete: (entry: Omit<WellbeingEntry, "timestamp">) => void;
  onDismiss: () => void;
  studentName?: string;
}

type CheckInStep = "mood" | "energy" | "stress" | "social" | "done";

const MOOD_OPTIONS = [
  { value: 2, emoji: "😢", label: "Rough" },
  { value: 4, emoji: "😕", label: "Meh" },
  { value: 6, emoji: "🙂", label: "Okay" },
  { value: 8, emoji: "😊", label: "Good" },
  { value: 10, emoji: "🤩", label: "Great!" },
];

const ENERGY_OPTIONS = [
  { value: 2, emoji: "🪫", label: "Drained" },
  { value: 4, emoji: "😴", label: "Low" },
  { value: 6, emoji: "⚡", label: "Normal" },
  { value: 8, emoji: "🔥", label: "Energized" },
  { value: 10, emoji: "🚀", label: "On fire!" },
];

const STRESS_OPTIONS = [
  { value: 2, emoji: "🧘", label: "Chill" },
  { value: 4, emoji: "😌", label: "Calm" },
  { value: 6, emoji: "😤", label: "Some" },
  { value: 8, emoji: "😰", label: "High" },
  { value: 10, emoji: "🤯", label: "Maxed" },
];

const SOCIAL_OPTIONS = [
  { value: 2, emoji: "🏝️", label: "Isolated" },
  { value: 4, emoji: "🤷", label: "Disconnected" },
  { value: 6, emoji: "👋", label: "Okay" },
  { value: 8, emoji: "🤝", label: "Connected" },
  { value: 10, emoji: "💛", label: "Loved" },
];

export function WellbeingCheckIn({ visible, onComplete, onDismiss, studentName }: WellbeingCheckInProps) {
  const [step, setStep] = useState<CheckInStep>("mood");
  const [mood, setMood] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(0);
  const [stress, setStress] = useState<number>(0);
  const [social, setSocial] = useState<number>(0);
  // Reset step when modal becomes visible again
  useEffect(() => {
    if (visible) {
      setStep("mood");
      setMood(0);
      setEnergy(0);
      setStress(0);
      setSocial(0);
    }
  }, [visible]);

  const name = studentName || "friend";

  const handleSelect = useCallback((value: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    switch (step) {
      case "mood":
        setMood(value);
        setTimeout(() => setStep("energy"), 300);
        break;
      case "energy":
        setEnergy(value);
        setTimeout(() => setStep("stress"), 300);
        break;
      case "stress":
        setStress(value);
        setTimeout(() => setStep("social"), 300);
        break;
      case "social":
        setSocial(value);
        setTimeout(() => {
          setStep("done");
          const entry: Omit<WellbeingEntry, "timestamp"> = {
            overallMood: mood,
            energyLevel: energy,
            stressLevel: stress,
            socialConnection: value,
            source: "check_in",
          };
          recordWellbeing(entry);
          onComplete(entry);
        }, 300);
        break;
    }
  }, [step, mood, energy, stress, onComplete]);

  const getStepContent = () => {
    switch (step) {
      case "mood":
        return {
          question: `Hey ${name}, how are you feeling today?`,
          subtitle: "Be honest — no judgment here",
          options: MOOD_OPTIONS,
        };
      case "energy":
        return {
          question: "How's your energy level?",
          subtitle: "This helps me know what kind of day to plan for you",
          options: ENERGY_OPTIONS,
        };
      case "stress":
        return {
          question: "Any stress on your plate?",
          subtitle: "It's okay if there is — we can work through it",
          options: STRESS_OPTIONS,
        };
      case "social":
        return {
          question: "How connected do you feel to people?",
          subtitle: "Friends, family, anyone who matters",
          options: SOCIAL_OPTIONS,
        };
      default:
        return null;
    }
  };

  const content = getStepContent();

  if (!visible || step === "done") return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {/* Skip button */}
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {["mood", "energy", "stress", "social"].map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                (step === s || ["mood", "energy", "stress", "social"].indexOf(step) > i) && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Question */}
        {content && (
          <View style={styles.questionContainer}>
            <Text style={styles.question}>{content.question}</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>

            {/* Options */}
            <View style={styles.optionsRow}>
              {content.options.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => handleSelect(opt.value)}
                  style={({ pressed }) => [
                    styles.optionBtn,
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Wave Cloud branding */}
        <View style={styles.branding}>
          <Text style={styles.brandingText}>Wave Cloud is checking in 💙</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1419",
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: "center",
  },
  skipBtn: {
    position: "absolute",
    top: 60,
    right: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: "#9BA1A6",
    fontSize: 16,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 48,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#334155",
  },
  progressDotActive: {
    backgroundColor: "#60A5FA",
    width: 24,
  },
  questionContainer: {
    alignItems: "center",
    gap: 12,
  },
  question: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ECEDEE",
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    color: "#9BA1A6",
    textAlign: "center",
    marginBottom: 32,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  optionBtn: {
    width: (SCREEN_WIDTH - 48 - 48) / 5,
    minWidth: 56,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#1E2022",
    borderWidth: 1,
    borderColor: "#334155",
  },
  optionEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 11,
    color: "#9BA1A6",
    fontWeight: "500",
  },
  branding: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  brandingText: {
    fontSize: 14,
    color: "#4B5563",
  },
});

export default WellbeingCheckIn;
