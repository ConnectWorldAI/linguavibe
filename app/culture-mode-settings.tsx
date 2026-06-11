/**
 * Culture Mode Settings Screen
 * 
 * Lets users choose how they want to learn:
 * - Immersive: Cultural scenarios, story exercises, real-world tasks
 * - Grammar: Traditional drills, conjugation, translation
 * - Balanced: Mix of both (default)
 * 
 * Also lets them set cultural intensity (how deep the cultural content goes).
 */
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useCultureMode, CultureMode, CultureIntensity } from "@/lib/culture-mode";

const MODE_OPTIONS: { id: CultureMode; title: string; subtitle: string; icon: string; emoji: string; examples: string[] }[] = [
  {
    id: "immersive",
    title: "Cultural Immersion",
    subtitle: "Learn through real cultural experiences",
    icon: "earth",
    emoji: "🌍",
    examples: [
      "Help abuela make sancocho in the kitchen",
      "Order at a real Japanese izakaya",
      "Navigate a French boulangerie",
      "Celebrate Día de Muertos with vocabulary",
    ],
  },
  {
    id: "balanced",
    title: "Balanced Learning",
    subtitle: "Mix of culture and grammar (recommended)",
    icon: "git-compare",
    emoji: "⚖️",
    examples: [
      "Cultural scenarios + grammar drills",
      "Story exercises + conjugation practice",
      "Real-world tasks + structured lessons",
      "Best of both worlds",
    ],
  },
  {
    id: "grammar",
    title: "Grammar Focus",
    subtitle: "Structured drills and traditional exercises",
    icon: "school",
    emoji: "📚",
    examples: [
      "Verb conjugation tables",
      "Fill-in-the-blank exercises",
      "Translation practice",
      "Sentence structure drills",
    ],
  },
];

const INTENSITY_OPTIONS: { id: CultureIntensity; title: string; description: string; emoji: string }[] = [
  {
    id: "light",
    title: "Light Touch",
    description: "Brief cultural notes alongside exercises",
    emoji: "🌱",
  },
  {
    id: "medium",
    title: "Medium Depth",
    description: "Cultural context woven into most exercises",
    emoji: "🌿",
  },
  {
    id: "deep",
    title: "Deep Dive",
    description: "Full cultural immersion — traditions, history, customs in every exercise",
    emoji: "🌳",
  },
];

export default function CultureModeSettingsScreen() {
  const router = useRouter();
  const { mode, intensity, setMode, setIntensity } = useCultureMode();

  const handleModeSelect = (newMode: CultureMode) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setMode(newMode);
  };

  const handleIntensitySelect = (newIntensity: CultureIntensity) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIntensity(newIntensity);
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Learning Style</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>How do you want to learn?</Text>
          <Text style={styles.descriptionText}>
            Choose between culturally-immersive exercises (learn by experiencing traditions, food, and customs) 
            or traditional grammar drills. You can change this anytime.
          </Text>
        </View>

        {/* Mode Selection */}
        <Text style={styles.sectionTitle}>Learning Mode</Text>
        {MODE_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => handleModeSelect(option.id)}
            style={({ pressed }) => [
              styles.modeCard,
              mode === option.id && styles.modeCardSelected,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={styles.modeCardHeader}>
              <Text style={styles.modeEmoji}>{option.emoji}</Text>
              <View style={styles.modeCardTitleRow}>
                <Text style={[styles.modeTitle, mode === option.id && styles.modeTitleSelected]}>
                  {option.title}
                </Text>
                <Text style={styles.modeSubtitle}>{option.subtitle}</Text>
              </View>
              {mode === option.id && (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              )}
            </View>
            <View style={styles.examplesContainer}>
              {option.examples.map((example, idx) => (
                <View key={idx} style={styles.exampleRow}>
                  <Text style={styles.exampleBullet}>•</Text>
                  <Text style={styles.exampleText}>{example}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        ))}

        {/* Cultural Intensity (only shown when not grammar-only) */}
        {mode !== "grammar" && (
          <>
            <Text style={styles.sectionTitle}>Cultural Depth</Text>
            <Text style={styles.sectionSubtitle}>
              How much cultural content do you want in your lessons?
            </Text>
            <View style={styles.intensityRow}>
              {INTENSITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => handleIntensitySelect(option.id)}
                  style={({ pressed }) => [
                    styles.intensityCard,
                    intensity === option.id && styles.intensityCardSelected,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.intensityEmoji}>{option.emoji}</Text>
                  <Text style={[styles.intensityTitle, intensity === option.id && styles.intensityTitleSelected]}>
                    {option.title}
                  </Text>
                  <Text style={styles.intensityDesc}>{option.description}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Preview of what they'll get */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Your Experience</Text>
          <Text style={styles.previewText}>
            {mode === "immersive" && intensity === "deep"
              ? "Every lesson is a cultural adventure. You'll learn vocabulary by helping grandma cook, ordering at local restaurants, celebrating holidays, and navigating real-world scenarios — all in your target language."
              : mode === "immersive" && intensity === "medium"
              ? "Most exercises are cultural scenarios with some structured practice. You'll experience traditions, food, and customs while building vocabulary and grammar."
              : mode === "immersive" && intensity === "light"
              ? "Cultural notes and context appear alongside exercises. You'll get a taste of the culture while focusing on language skills."
              : mode === "grammar"
              ? "Pure language mechanics: conjugation drills, translation exercises, fill-in-the-blank, and sentence structure practice. Efficient and focused."
              : mode === "balanced" && intensity === "deep"
              ? "Half cultural immersion, half structured drills. Deep cultural context in story exercises, plus focused grammar practice to reinforce what you learn."
              : mode === "balanced" && intensity === "medium"
              ? "A healthy mix of cultural scenarios and grammar drills. You'll experience the culture while building solid language foundations."
              : "Light cultural touches mixed with grammar exercises. Cultural notes add flavor without overwhelming the structured learning."}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  descriptionCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  modeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modeCardSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.5)",
  },
  modeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modeEmoji: {
    fontSize: 28,
  },
  modeCardTitleRow: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  modeTitleSelected: {
    color: "#10B981",
  },
  modeSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  examplesContainer: {
    marginTop: 12,
    paddingLeft: 44,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  exampleBullet: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginRight: 8,
    marginTop: 1,
  },
  exampleText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    flex: 1,
  },
  intensityRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 8,
  },
  intensityCard: {
    flex: 1,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  intensityCardSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.5)",
  },
  intensityEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  intensityTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  intensityTitleSelected: {
    color: "#10B981",
  },
  intensityDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 14,
  },
  previewCard: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  previewText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 20,
  },
});
