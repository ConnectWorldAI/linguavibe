import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type Exercise = {
  id: string;
  title: string;
  description: string;
  type: "tongue_twister" | "vowel_drill" | "consonant_pair" | "intonation" | "rhythm" | "minimal_pair";
  difficulty: "easy" | "medium" | "hard";
  targetSound: string;
  example: string;
  pronunciation: string;
  tip: string;
  completed: boolean;
};

type TrainingCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  exercises: number;
  completed: number;
};

const CATEGORIES: TrainingCategory[] = [
  { id: "1", name: "Tongue Twisters", icon: "chatbubble-outline", color: "#6C5CE7", exercises: 12, completed: 4 },
  { id: "2", name: "Vowel Drills", icon: "mic-outline", color: "#00B894", exercises: 8, completed: 2 },
  { id: "3", name: "Consonant Pairs", icon: "swap-horizontal-outline", color: "#E17055", exercises: 10, completed: 6 },
  { id: "4", name: "Intonation", icon: "trending-up-outline", color: "#0984E3", exercises: 6, completed: 1 },
  { id: "5", name: "Rhythm & Stress", icon: "musical-notes-outline", color: "#FDCB6E", exercises: 8, completed: 3 },
  { id: "6", name: "Minimal Pairs", icon: "git-compare-outline", color: "#A29BFE", exercises: 15, completed: 7 },
];

const EXERCISES: Exercise[] = [
  { id: "1", title: "Rolling R Practice", description: "Master the Spanish trilled 'rr' sound", type: "consonant_pair", difficulty: "hard", targetSound: "rr", example: "Erre con erre, cigarro; erre con erre, barril", pronunciation: "EH-rreh kon EH-rreh, see-GAH-rroh", tip: "Start by saying 'butter' quickly, then move your tongue tip forward to the alveolar ridge", completed: false },
  { id: "2", title: "Nasal Vowels", description: "Practice French nasal vowel sounds", type: "vowel_drill", difficulty: "medium", targetSound: "ã, õ, ẽ", example: "Un bon vin blanc", pronunciation: "uhn bohn vahn blahn", tip: "Let air flow through your nose while keeping your mouth in vowel position", completed: false },
  { id: "3", title: "Pitch Accent", description: "Japanese pitch accent patterns for common words", type: "intonation", difficulty: "hard", targetSound: "↑↓", example: "箸 (hashi↑) vs 橋 (ha↑shi)", pronunciation: "HA-shi (chopsticks) vs ha-SHI (bridge)", tip: "Record yourself and compare the pitch contour with native audio", completed: true },
  { id: "4", title: "Th vs S", description: "Distinguish English 'th' from Spanish 's'", type: "minimal_pair", difficulty: "easy", targetSound: "θ / s", example: "think vs sink, path vs pass", pronunciation: "Put tongue between teeth for 'th'", tip: "Place your tongue between your teeth and blow gently for 'th'", completed: true },
  { id: "5", title: "Speed Drill: Trabalenguas", description: "Increase fluency with rapid Spanish phrases", type: "tongue_twister", difficulty: "medium", targetSound: "Multiple", example: "Tres tristes tigres tragaban trigo en un trigal", pronunciation: "trehs TREES-tehs TEE-grehs...", tip: "Start slowly, then gradually increase speed while maintaining clarity", completed: false },
  { id: "6", title: "Syllable Stress Patterns", description: "Master where stress falls in Spanish words", type: "rhythm", difficulty: "easy", targetSound: "Stress", example: "MÉ-di-co vs me-DI-ci-na vs me-di-ci-NAL", pronunciation: "Stress moves as suffixes are added", tip: "Tap your finger on the stressed syllable as you speak", completed: false },
];

export default function VoiceTrainingScreen() {
  const colors = useColors();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  const startRecording = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(waveAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ])
    ).start();
  };

  const stopRecording = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRecording(false);
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    pulseAnim.setValue(1);
    waveAnim.setValue(0);
  };

  const DIFFICULTY_COLORS = { easy: "#4ADE80", medium: "#FBBF24", hard: "#F87171" };

  if (selectedExercise) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedExercise(null)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{selectedExercise.title}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={[styles.contentContainer, { alignItems: "center" }]}>
          {/* Target Sound */}
          <View style={[styles.targetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.targetLabel, { color: colors.muted }]}>Target Sound</Text>
            <Text style={[styles.targetSound, { color: colors.primary }]}>{selectedExercise.targetSound}</Text>
          </View>

          {/* Example */}
          <View style={[styles.exampleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.exampleLabel, { color: colors.muted }]}>Say this:</Text>
            <Text style={[styles.exampleText, { color: colors.foreground }]}>{selectedExercise.example}</Text>
            <View style={[styles.pronunciationRow, { backgroundColor: colors.background }]}>
              <Ionicons name="volume-high-outline" size={16} color={colors.primary} />
              <Text style={[styles.pronunciationText, { color: colors.primary }]}>{selectedExercise.pronunciation}</Text>
            </View>
          </View>

          {/* Tip */}
          <View style={[styles.tipCard, { backgroundColor: "#FFD70010", borderColor: "#FFD70030" }]}>
            <Ionicons name="bulb-outline" size={18} color="#B8860B" />
            <Text style={[styles.tipText, { color: colors.foreground }]}>{selectedExercise.tip}</Text>
          </View>

          {/* Record Button */}
          <View style={styles.recordSection}>
            <Animated.View style={[styles.recordOuter, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity
                style={[styles.recordBtn, { backgroundColor: isRecording ? "#FF6B6B" : colors.primary }]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
            <Text style={[styles.recordLabel, { color: colors.muted }]}>
              {isRecording ? "Tap to stop" : "Tap to record"}
            </Text>
          </View>

          {/* Waveform placeholder */}
          {isRecording && (
            <View style={styles.waveform}>
              {Array.from({ length: 20 }).map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: colors.primary,
                      height: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 8 + Math.random() * 32],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Voice Training</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>Pronunciation Lab</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Progress Summary */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressRow}>
            <View style={styles.progressStat}>
              <Text style={[styles.progressNumber, { color: colors.primary }]}>23</Text>
              <Text style={[styles.progressLabel, { color: colors.muted }]}>Completed</Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressNumber, { color: "#FFD700" }]}>7</Text>
              <Text style={[styles.progressLabel, { color: colors.muted }]}>Day Streak</Text>
            </View>
            <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressNumber, { color: "#4ADE80" }]}>82%</Text>
              <Text style={[styles.progressLabel, { color: colors.muted }]}>Accuracy</Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Training Categories</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: cat.color + "10", borderColor: cat.color + "30" }]}
              activeOpacity={0.7}
            >
              <Ionicons name={cat.icon as any} size={22} color={cat.color} />
              <Text style={[styles.categoryName, { color: colors.foreground }]}>{cat.name}</Text>
              <Text style={[styles.categoryProgress, { color: colors.muted }]}>{cat.completed}/{cat.exercises}</Text>
              <View style={[styles.categoryBar, { backgroundColor: cat.color + "20" }]}>
                <View style={[styles.categoryBarFill, { backgroundColor: cat.color, width: `${(cat.completed / cat.exercises) * 100}%` }]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Exercises */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Today's Exercises</Text>
        {EXERCISES.map((exercise) => {
          const diffColor = DIFFICULTY_COLORS[exercise.difficulty];
          return (
            <TouchableOpacity
              key={exercise.id}
              style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedExercise(exercise);
              }}
            >
              <View style={styles.exerciseLeft}>
                {exercise.completed ? (
                  <View style={[styles.checkCircle, { backgroundColor: "#4ADE8020" }]}>
                    <Ionicons name="checkmark" size={16} color="#4ADE80" />
                  </View>
                ) : (
                  <View style={[styles.checkCircle, { backgroundColor: diffColor + "15", borderColor: diffColor + "40", borderWidth: 1 }]}>
                    <Text style={[styles.exerciseIcon, { color: diffColor }]}>{exercise.targetSound.charAt(0)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseTitle, { color: colors.foreground, textDecorationLine: exercise.completed ? "line-through" : "none" }]}>{exercise.title}</Text>
                <Text style={[styles.exerciseDesc, { color: colors.muted }]}>{exercise.description}</Text>
                <View style={styles.exerciseMeta}>
                  <View style={[styles.diffBadge, { backgroundColor: diffColor + "15" }]}>
                    <Text style={[styles.diffText, { color: diffColor }]}>{exercise.difficulty}</Text>
                  </View>
                  <Text style={[styles.exerciseType, { color: colors.muted }]}>{exercise.type.replace("_", " ")}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  progressCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 24 },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  progressStat: { alignItems: "center" },
  progressNumber: { fontSize: 24, fontWeight: "800" },
  progressLabel: { fontSize: 11, marginTop: 2 },
  progressDivider: { width: 1, height: 36 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: { width: "47%", padding: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
  categoryName: { fontSize: 13, fontWeight: "700" },
  categoryProgress: { fontSize: 11 },
  categoryBar: { height: 4, borderRadius: 2, marginTop: 4 },
  categoryBarFill: { height: "100%", borderRadius: 2 },
  exerciseCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  exerciseLeft: { marginRight: 12 },
  checkCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  exerciseIcon: { fontSize: 14, fontWeight: "800" },
  exerciseInfo: { flex: 1 },
  exerciseTitle: { fontSize: 14, fontWeight: "700" },
  exerciseDesc: { fontSize: 12, marginTop: 2 },
  exerciseMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  diffText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  exerciseType: { fontSize: 11, textTransform: "capitalize" },
  // Detail view
  targetCard: { alignItems: "center", padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 20, width: "100%" },
  targetLabel: { fontSize: 12, fontWeight: "600" },
  targetSound: { fontSize: 36, fontWeight: "800", marginTop: 4 },
  exampleCard: { width: "100%", padding: 20, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  exampleLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
  exampleText: { fontSize: 18, fontWeight: "700", lineHeight: 26 },
  pronunciationRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, padding: 10, borderRadius: 8 },
  pronunciationText: { fontSize: 13, fontStyle: "italic" },
  tipCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 24, width: "100%" },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
  recordSection: { alignItems: "center", marginTop: 20, marginBottom: 16 },
  recordOuter: { marginBottom: 12 },
  recordBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  recordLabel: { fontSize: 13 },
  waveform: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, height: 48 },
  waveBar: { width: 4, borderRadius: 2 },
});
