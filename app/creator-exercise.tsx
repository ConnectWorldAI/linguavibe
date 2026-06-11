/**
 * Creator Exercise — Interactive mini-lesson with tap-to-answer exercises
 * inspired by a spotlight creator's teaching style.
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  TextInput,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { getAllSpotlightCreators, SampleExercise } from "@/lib/creator-spotlight";
import { calculateExercisePoints, saveSessionScores } from "@/lib/exercise-scoring";
import { addDailyXP } from "@/lib/daily-xp-goal";
import { recordDailyXP } from "@/components/weekly-progress-card";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


type ExerciseState = "unanswered" | "correct" | "incorrect" | "hint_shown";

interface ExerciseProgress {
  state: ExerciseState;
  userAnswer: string;
  attempts: number;
  hintUsed: boolean;
  wasRevealed: boolean;
}

export default function CreatorExerciseScreen() {
  const { showStreakToast } = useUsage();
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ creatorId?: string }>();

  // Find the creator
  const creators = getAllSpotlightCreators();
  const creator = creators.find((c) => c.id === params.creatorId) || creators[0];
  const exercises = creator.sampleExercises;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<ExerciseProgress[]>(
    exercises.map(() => ({ state: "unanswered", userAnswer: "", attempts: 0, hintUsed: false, wasRevealed: false }))
  );
  const [inputValue, setInputValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [sessionXP, setSessionXP] = useState<number | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const currentExercise = exercises[currentIndex];
  const currentProgress = progress[currentIndex];

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const normalizeAnswer = (text: string) =>
    text.toLowerCase().trim().replace(/[.,!?¡¿'"]/g, "");

  const checkAnswer = () => {
    if (!inputValue.trim()) return;

    const userNorm = normalizeAnswer(inputValue);
    const correctAnswers = currentExercise.answer
      .split("/")
      .map((a) => normalizeAnswer(a));

    const isCorrect = correctAnswers.some(
      (correct) => userNorm.includes(correct) || correct.includes(userNorm)
    );

    const newProgress = [...progress];
    newProgress[currentIndex] = {
      ...newProgress[currentIndex],
      userAnswer: inputValue,
      attempts: newProgress[currentIndex].attempts + 1,
      state: isCorrect ? "correct" : "incorrect",
    };
    setProgress(newProgress);

    if (isCorrect) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      triggerShake();
    }
  };

  const showHint = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newProgress = [...progress];
    newProgress[currentIndex] = {
      ...newProgress[currentIndex],
      state: "hint_shown",
      hintUsed: true,
    };
    setProgress(newProgress);
  };

  const revealAnswer = () => {
    const newProgress = [...progress];
    newProgress[currentIndex] = {
      ...newProgress[currentIndex],
      state: "correct",
      userAnswer: currentExercise.answer,
      wasRevealed: true,
    };
    setProgress(newProgress);
  };

  const goToNext = async () => {
    if (currentIndex < exercises.length - 1) {
      fadeAnim.setValue(0);
      setCurrentIndex(currentIndex + 1);
      setInputValue("");
    } else {
      // Calculate and save scores
      const exerciseScores = progress.map((p) => ({
        points: calculateExercisePoints({
          wasRevealed: p.wasRevealed,
          hintUsed: p.hintUsed,
          attempts: p.attempts,
        }),
        maxPoints: 3,
      }));
      const totalXP = await saveSessionScores(creator.id, creator.name, exerciseScores);
      // Also increment daily XP goal progress
      await addDailyXP(totalXP);
      // Record for weekly progress chart
      await recordDailyXP(totalXP);
      setSessionXP(totalXP);
      setShowResults(true);
      markPracticeAndToast(showStreakToast);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      fadeAnim.setValue(0);
      setCurrentIndex(currentIndex - 1);
      setInputValue(progress[currentIndex - 1].userAnswer);
    }
  };

  const resetAll = () => {
    setProgress(exercises.map(() => ({ state: "unanswered", userAnswer: "", attempts: 0, hintUsed: false, wasRevealed: false })));
    setCurrentIndex(0);
    setInputValue("");
    setShowResults(false);
    setSessionXP(null);
  };

  // Calculate live points for current exercise
  const getExercisePoints = (p: ExerciseProgress): number => {
    if (p.state !== "correct") return 0;
    return calculateExercisePoints({
      wasRevealed: p.wasRevealed,
      hintUsed: p.hintUsed,
      attempts: p.attempts,
    });
  };

  const correctCount = progress.filter((p) => p.state === "correct").length;

  const exerciseIcon = (type: SampleExercise["type"]) => {
    switch (type) {
      case "phrase": return "chatbubble-ellipses-outline";
      case "quiz": return "help-circle-outline";
      case "fill_blank": return "create-outline";
      case "listen": return "ear-outline";
      default: return "bulb-outline";
    }
  };

  if (showResults) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.resultsContainer}>
          <View style={[styles.resultsBadge, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="trophy" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.resultsTitle, { color: colors.foreground }]}>
            Exercise Complete!
          </Text>
          <Text style={[styles.resultsScore, { color: colors.primary }]}>
            {correctCount}/{exercises.length} correct
          </Text>
          {sessionXP !== null && (
            <View style={[styles.xpBadge, { backgroundColor: colors.warning + "15" }]}>
              <Ionicons name="star" size={18} color={colors.warning} />
              <Text style={[styles.xpBadgeText, { color: colors.warning }]}>
                +{sessionXP} XP earned ({sessionXP}/{exercises.length * 3} possible)
              </Text>
            </View>
          )}
          <Text style={[styles.resultsCreator, { color: colors.muted }]}>
            Inspired by {creator.name}'s style
          </Text>

          <View style={styles.resultsActions}>
            <Pressable
              onPress={resetAll}
              style={({ pressed }) => [
                styles.resultBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.resultBtnText}>Try Again</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.resultBtn,
                { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="arrow-back" size={18} color={colors.foreground} />
              <Text style={[styles.resultBtnText, { color: colors.foreground }]}>Back</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {creator.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            Exercise {currentIndex + 1} of {exercises.length}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Progress dots */}
      <View style={styles.progressDots}>
        {exercises.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  progress[i].state === "correct"
                    ? colors.success
                    : i === currentIndex
                    ? colors.primary
                    : colors.border,
              },
              i === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.exerciseCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: fadeAnim,
              transform: [{ translateX: shakeAnim }],
            },
          ]}
        >
          {/* Exercise type badge */}
          <View style={[styles.typeBadge, { backgroundColor: colors.primary + "12" }]}>
            <Ionicons
              name={exerciseIcon(currentExercise.type) as any}
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
              {currentExercise.type.replace("_", " ").toUpperCase()}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>
            {currentExercise.title}
          </Text>

          {/* Prompt */}
          <Text style={[styles.exercisePrompt, { color: colors.foreground }]}>
            {currentExercise.prompt}
          </Text>

          {/* Hint */}
          {currentProgress.state === "hint_shown" && currentExercise.hint && (
            <View style={[styles.hintBox, { backgroundColor: colors.warning + "15" }]}>
              <Ionicons name="bulb" size={16} color={colors.warning} />
              <Text style={[styles.hintText, { color: colors.warning }]}>
                {currentExercise.hint}
              </Text>
            </View>
          )}

          {/* Input area */}
          {currentProgress.state !== "correct" ? (
            <View style={styles.inputArea}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.background,
                    borderColor:
                      currentProgress.state === "incorrect"
                        ? colors.error
                        : colors.border,
                  },
                ]}
                placeholder="Type your answer..."
                placeholderTextColor={colors.muted}
                value={inputValue}
                onChangeText={setInputValue}
                returnKeyType="done"
                onSubmitEditing={checkAnswer}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Incorrect feedback */}
              {currentProgress.state === "incorrect" && (
                <Text style={[styles.incorrectText, { color: colors.error }]}>
                  Not quite! Try again or use a hint.
                </Text>
              )}

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={checkAnswer}
                  style={({ pressed }) => [
                    styles.checkBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.8 },
                    !inputValue.trim() && { opacity: 0.5 },
                  ]}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.checkBtnText}>Check</Text>
                </Pressable>

                {currentExercise.hint &&
                  currentProgress.state !== "hint_shown" && (
                    <Pressable
                      onPress={showHint}
                      style={({ pressed }) => [
                        styles.hintBtn,
                        { borderColor: colors.warning },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Ionicons name="bulb-outline" size={16} color={colors.warning} />
                      <Text style={[styles.hintBtnText, { color: colors.warning }]}>
                        Hint
                      </Text>
                    </Pressable>
                  )}

                {currentProgress.attempts >= 2 && (
                  <Pressable
                    onPress={revealAnswer}
                    style={({ pressed }) => [
                      styles.hintBtn,
                      { borderColor: colors.muted },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="eye-outline" size={16} color={colors.muted} />
                    <Text style={[styles.hintBtnText, { color: colors.muted }]}>
                      Reveal
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : (
            /* Correct state */
            <View style={[styles.correctBox, { backgroundColor: colors.success + "12" }]}>
              <View style={styles.correctHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.correctTitle, { color: colors.success }]}>
                  Correct!
                </Text>
              </View>
              <Text style={[styles.correctAnswer, { color: colors.foreground }]}>
                {currentExercise.answer}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Navigation footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={goToPrev}
          style={({ pressed }) => [
            styles.navBtn,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 },
            currentIndex === 0 && { opacity: 0.3 },
          ]}
          disabled={currentIndex === 0}
        >
          <Ionicons name="arrow-back" size={18} color={colors.foreground} />
          <Text style={[styles.navBtnText, { color: colors.foreground }]}>Prev</Text>
        </Pressable>

        <Text style={[styles.footerProgress, { color: colors.muted }]}>
          {correctCount}/{exercises.length} answered
        </Text>

        <Pressable
          onPress={goToNext}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: colors.primary, borderColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.navBtnText, { color: "#fff" }]}>
            {currentIndex === exercises.length - 1 ? "Finish" : "Next"}
          </Text>
          <Ionicons
            name={currentIndex === exercises.length - 1 ? "flag" : "arrow-forward"}
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 30,
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  exerciseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  exercisePrompt: {
    fontSize: 16,
    lineHeight: 24,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  hintText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  inputArea: {
    gap: 12,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  incorrectText: {
    fontSize: 13,
    marginTop: -4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  checkBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  hintBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  hintBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  correctBox: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  correctHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  correctTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  correctAnswer: {
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 28,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerProgress: {
    fontSize: 12,
  },
  resultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  resultsBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  resultsScore: {
    fontSize: 32,
    fontWeight: "700",
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  xpBadgeText: {
    fontSize: 15,
    fontWeight: "700",
  },
  resultsCreator: {
    fontSize: 14,
    marginBottom: 24,
  },
  resultsActions: {
    flexDirection: "row",
    gap: 12,
  },
  resultBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
  },
  resultBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
