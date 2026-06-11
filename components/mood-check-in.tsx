/**
 * Mood Check-In Component
 * 
 * A quick, non-intrusive mood check before lessons.
 * Appears as a gentle prompt: "How are you feeling today?"
 * The system uses this to adjust lesson tone, difficulty, and duration.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { recordMood, type MoodEntry } from "@/lib/teacher-memory";

interface MoodOption {
  mood: MoodEntry["mood"];
  emoji: string;
  label: string;
  color: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { mood: "energized", emoji: "⚡", label: "Energized", color: "#F59E0B" },
  { mood: "excited", emoji: "🔥", label: "Excited", color: "#EF4444" },
  { mood: "calm", emoji: "☁️", label: "Calm", color: "#06B6D4" },
  { mood: "neutral", emoji: "😊", label: "Good", color: "#10B981" },
  { mood: "tired", emoji: "😴", label: "Tired", color: "#6366F1" },
  { mood: "stressed", emoji: "😤", label: "Stressed", color: "#EC4899" },
];

interface MoodCheckInProps {
  studentName: string;
  onComplete: (mood: MoodEntry["mood"]) => void;
  onSkip: () => void;
}

export function MoodCheckIn({ studentName, onComplete, onSkip }: MoodCheckInProps) {
  const [selected, setSelected] = useState<MoodEntry["mood"] | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1));

  const handleSelect = async (mood: MoodEntry["mood"]) => {
    setSelected(mood);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Record the mood
    await recordMood(mood, "check_in");
    
    // Animate out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onComplete(mood);
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.card}>
        <Text style={styles.greeting}>
          Hey {studentName} 👋
        </Text>
        <Text style={styles.question}>
          How are you feeling right now?
        </Text>
        <Text style={styles.subtitle}>
          I'll adjust today's lesson to match your energy
        </Text>
        
        <View style={styles.moodGrid}>
          {MOOD_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.mood}
              style={[
                styles.moodButton,
                selected === option.mood && { borderColor: option.color, backgroundColor: option.color + "15" },
              ]}
              onPress={() => handleSelect(option.mood)}
              activeOpacity={0.7}
            >
              <Text style={styles.moodEmoji}>{option.emoji}</Text>
              <Text style={[styles.moodLabel, selected === option.mood && { color: option.color }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 14, 26, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 100,
  },
  card: {
    backgroundColor: "#141B2D",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  question: {
    fontSize: 17,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 24,
    textAlign: "center",
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  moodButton: {
    width: 100,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#1E293B",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 13,
    color: "#64748B",
  },
});
