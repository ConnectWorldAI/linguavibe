/**
 * Targeted Drill Screen
 * 
 * Launches a focused drill session based on detected error patterns.
 * Shows exercises one at a time with immediate feedback and progress tracking.
 */
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform, Alert } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  generateDrillSession,
  completeDrillSession,
  type DrillSession,
  type DrillExercise,
} from "@/lib/error-pattern-detection";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


export default function TargetedDrillScreen() {
  const { showStreakToast } = useUsage();
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [session, setSession] = useState<DrillSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const drill = await generateDrillSession(8);
      setSession(drill);
    } catch (err) {
      Alert.alert("Error", "Could not load drill session");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const currentExercise = session?.exercises[currentIndex];

  const checkAnswer = () => {
    if (!currentExercise) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let correct = false;
    const userAnswer = (selectedOption || answer).trim().toLowerCase();
    const correctAnswer = currentExercise.correctAnswer.trim().toLowerCase();

    if (currentExercise.type === "multiple_choice" || currentExercise.type === "correct_error") {
      correct = userAnswer === correctAnswer;
    } else {
      // Allow minor variations for fill_blank, translate, conjugate
      correct = userAnswer === correctAnswer || 
                userAnswer.replace(/[.,!?;:]/g, "") === correctAnswer.replace(/[.,!?;:]/g, "");
    }

    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore(score + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const nextExercise = async () => {
    if (!session) return;
    setShowResult(false);
    setAnswer("");
    setSelectedOption(null);

    if (currentIndex + 1 >= session.exercises.length) {
      // Session complete
      setCompleted(true);
      markPracticeAndToast(showStreakToast);
      await completeDrillSession(session, session.exercises.map((e, i) => ({ exerciseId: e.id, correct: i < score + (isCorrect ? 1 : 0) })));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Targeted Drill", headerShown: true }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Preparing your drill...</Text>
        </View>
      </View>
    );
  }

  if (completed) {
    const percentage = Math.round((score / (session?.exercises.length || 1)) * 100);
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Drill Complete", headerShown: true }} />
        <View style={styles.completedContainer}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>{percentage}%</Text>
            <Text style={styles.scoreLabel}>{score}/{session?.exercises.length}</Text>
          </View>
          <Text style={styles.completedTitle}>
            {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good progress!" : "Keep practicing!"}
          </Text>
          <Text style={styles.completedSubtitle}>
            {percentage >= 80
              ? "You're mastering these patterns. Keep it up!"
              : percentage >= 60
              ? "Getting better! A few more sessions will solidify this."
              : "These patterns need more attention. Try again tomorrow."}
          </Text>

          <View style={styles.completedActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCompleted(false);
                setCurrentIndex(0);
                setScore(0);
                setAnswer("");
                setSelectedOption(null);
                loadSession();
                setLoading(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.primaryButtonText}>Practice Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!currentExercise) return null;

  const progress = ((currentIndex + 1) / (session?.exercises.length || 1)) * 100;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Targeted Drill", headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentIndex + 1}/{session?.exercises.length}</Text>
        </View>

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Ionicons name="warning" size={14} color="#F44336" />
          <Text style={styles.categoryText}>{currentExercise.type} · {currentExercise.difficulty}</Text>
        </View>

        {/* Exercise Prompt */}
        <Text style={styles.prompt}>{currentExercise.prompt}</Text>

        {/* Context if available */}
        {(currentExercise as any).context && (
          <View style={styles.contextBox}>
            <Text style={styles.contextText}>{(currentExercise as any).context}</Text>
          </View>
        )}

        {/* Answer Input */}
        {currentExercise.type === "multiple_choice" && currentExercise.options ? (
          <View style={styles.optionsContainer}>
            {currentExercise.options.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionButton,
                  selectedOption === option && styles.optionSelected,
                  showResult && option === currentExercise.correctAnswer && styles.optionCorrect,
                  showResult && selectedOption === option && !isCorrect && styles.optionWrong,
                ]}
                onPress={() => {
                  if (!showResult) {
                    setSelectedOption(option);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={0.7}
                disabled={showResult}
              >
                <Text style={[
                  styles.optionText,
                  selectedOption === option && styles.optionTextSelected,
                  showResult && option === currentExercise.correctAnswer && styles.optionTextCorrect,
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TextInput
            style={[styles.textInput, showResult && (isCorrect ? styles.inputCorrect : styles.inputWrong)]}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Type your answer..."
            placeholderTextColor="#5A6A7A"
            editable={!showResult}
            returnKeyType="done"
            onSubmitEditing={() => !showResult && (answer.trim() || selectedOption) && checkAnswer()}
            autoCapitalize="none"
          />
        )}

        {/* Result Feedback */}
        {showResult && (
          <View style={[styles.resultBox, isCorrect ? styles.resultCorrect : styles.resultWrong]}>
            <Ionicons name={isCorrect ? "checkmark-circle" : "close-circle"} size={22} color={isCorrect ? "#4CAF50" : "#F44336"} />
            <View style={styles.resultTextContainer}>
              <Text style={[styles.resultTitle, { color: isCorrect ? "#4CAF50" : "#F44336" }]}>
                {isCorrect ? "Correct!" : "Not quite"}
              </Text>
              {!isCorrect && (
                <Text style={styles.resultAnswer}>Correct answer: {currentExercise.correctAnswer}</Text>
              )}
              {currentExercise.explanation && (
                <Text style={styles.resultExplanation}>{currentExercise.explanation}</Text>
              )}
            </View>
          </View>
        )}

        {/* Action Button */}
        {!showResult ? (
          <TouchableOpacity
            style={[styles.checkButton, !(answer.trim() || selectedOption) && styles.checkButtonDisabled]}
            onPress={checkAnswer}
            disabled={!(answer.trim() || selectedOption)}
            activeOpacity={0.7}
          >
            <Text style={styles.checkButtonText}>Check Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextExercise}
            activeOpacity={0.7}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex + 1 >= (session?.exercises.length || 0) ? "See Results" : "Next"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1117",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#8A9BB0",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00AAFF",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: "#8A9BB0",
    fontWeight: "600",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(244,67,54,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  prompt: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ECEDEE",
    lineHeight: 28,
    marginBottom: 16,
  },
  contextBox: {
    backgroundColor: "rgba(0,170,255,0.08)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#00AAFF",
  },
  contextText: {
    fontSize: 14,
    color: "#B0C4DE",
    lineHeight: 20,
    fontStyle: "italic",
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  optionSelected: {
    borderColor: "#00AAFF",
    backgroundColor: "rgba(0,170,255,0.1)",
  },
  optionCorrect: {
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76,175,80,0.1)",
  },
  optionWrong: {
    borderColor: "#F44336",
    backgroundColor: "rgba(244,67,54,0.1)",
  },
  optionText: {
    fontSize: 16,
    color: "#ECEDEE",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#00AAFF",
  },
  optionTextCorrect: {
    color: "#4CAF50",
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#ECEDEE",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  inputCorrect: {
    borderColor: "#4CAF50",
  },
  inputWrong: {
    borderColor: "#F44336",
  },
  resultBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultCorrect: {
    backgroundColor: "rgba(76,175,80,0.1)",
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.2)",
  },
  resultWrong: {
    backgroundColor: "rgba(244,67,54,0.1)",
    borderWidth: 1,
    borderColor: "rgba(244,67,54,0.2)",
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  resultAnswer: {
    fontSize: 14,
    color: "#ECEDEE",
    fontWeight: "500",
    marginBottom: 4,
  },
  resultExplanation: {
    fontSize: 13,
    color: "#8A9BB0",
    lineHeight: 18,
  },
  checkButton: {
    backgroundColor: "#00AAFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  checkButtonDisabled: {
    opacity: 0.4,
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  nextButton: {
    backgroundColor: "#00AAFF",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  completedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,170,255,0.1)",
    borderWidth: 3,
    borderColor: "#00AAFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: "800",
    color: "#00AAFF",
  },
  scoreLabel: {
    fontSize: 14,
    color: "#8A9BB0",
    fontWeight: "500",
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ECEDEE",
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 15,
    color: "#8A9BB0",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  completedActions: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00AAFF",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: "#8A9BB0",
    fontWeight: "600",
  },
});
