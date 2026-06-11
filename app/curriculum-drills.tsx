import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


type DrillType = "multiple_choice" | "fill_blank" | "translate" | "listen" | "match";

type Drill = {
  id: string;
  type: DrillType;
  question: string;
  options?: string[];
  correctAnswer: string;
  hint?: string;
  points: number;
};

type Lesson = {
  id: string;
  title: string;
  topic: string;
  drills: Drill[];
  xpReward: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: string;
};

const CURRENT_LESSON: Lesson = {
  id: "1",
  title: "Greetings & Introductions",
  topic: "Spanish Basics",
  difficulty: "Beginner",
  icon: "👋",
  xpReward: 50,
  drills: [
    { id: "d1", type: "multiple_choice", question: "How do you say 'Hello' in Spanish?", options: ["Hola", "Adiós", "Gracias", "Por favor"], correctAnswer: "Hola", points: 10 },
    { id: "d2", type: "fill_blank", question: "Complete: '_____ me llamo Carlos'", correctAnswer: "Hola", hint: "A greeting word", points: 10 },
    { id: "d3", type: "translate", question: "Translate: 'Good morning'", correctAnswer: "Buenos días", points: 15 },
    { id: "d4", type: "multiple_choice", question: "What does 'Mucho gusto' mean?", options: ["Nice to meet you", "Goodbye", "Thank you", "See you later"], correctAnswer: "Nice to meet you", points: 10 },
    { id: "d5", type: "fill_blank", question: "Complete: '¿Cómo _____?'", correctAnswer: "estás", hint: "How are you?", points: 15 },
  ],
};

export default function CurriculumDrillsScreen() {
  const { showStreakToast } = useUsage();
  const colors = useColors();
  const [currentDrill, setCurrentDrill] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);

  const drill = CURRENT_LESSON.drills[currentDrill];
  const progress = ((currentDrill + 1) / CURRENT_LESSON.drills.length) * 100;

  const checkAnswer = () => {
    const answer = drill.type === "multiple_choice" ? selectedAnswer : textAnswer.trim();
    const correct = answer?.toLowerCase() === drill.correctAnswer.toLowerCase();
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + drill.points);
      setStreak((s) => s + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setStreak(0);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const nextDrill = () => {
    if (currentDrill >= CURRENT_LESSON.drills.length - 1) {
      setCompleted(true);
      markPracticeAndToast(showStreakToast);
      return;
    }
    setCurrentDrill((c) => c + 1);
    setSelectedAnswer(null);
    setTextAnswer("");
    setIsCorrect(null);
    setShowHint(false);
  };

  const renderDrill = () => {
    if (!drill) return null;

    return (
      <View style={styles.drillContainer}>
        {/* Drill Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: colors.primary + "15" }]}>
          <Ionicons
            name={drill.type === "multiple_choice" ? "list" : drill.type === "fill_blank" ? "pencil" : drill.type === "translate" ? "language" : "ear"}
            size={14}
            color={colors.primary}
          />
          <Text style={[styles.typeText, { color: colors.primary }]}>
            {drill.type === "multiple_choice" ? "Multiple Choice" : drill.type === "fill_blank" ? "Fill in the Blank" : "Translate"}
          </Text>
        </View>

        {/* Question */}
        <Text style={[styles.question, { color: colors.foreground }]}>{drill.question}</Text>

        {/* Answer Area */}
        {drill.type === "multiple_choice" && drill.options && (
          <View style={styles.optionsGrid}>
            {drill.options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: selectedAnswer === opt
                      ? isCorrect === null ? colors.primary : isCorrect && opt === drill.correctAnswer ? colors.success : colors.error
                      : isCorrect !== null && opt === drill.correctAnswer ? colors.success : colors.border,
                    borderWidth: selectedAnswer === opt || (isCorrect !== null && opt === drill.correctAnswer) ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  if (isCorrect !== null) return;
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedAnswer(opt);
                }}
                disabled={isCorrect !== null}
              >
                <Text style={[styles.optionText, { color: colors.foreground }]}>{opt}</Text>
                {isCorrect !== null && opt === drill.correctAnswer && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(drill.type === "fill_blank" || drill.type === "translate") && (
          <View style={styles.inputArea}>
            <TextInput
              style={[styles.answerInput, {
                backgroundColor: colors.surface,
                borderColor: isCorrect === null ? colors.border : isCorrect ? colors.success : colors.error,
                color: colors.foreground,
              }]}
              placeholder="Type your answer..."
              placeholderTextColor={colors.muted}
              value={textAnswer}
              onChangeText={setTextAnswer}
              editable={isCorrect === null}
              returnKeyType="done"
              onSubmitEditing={checkAnswer}
            />
            {drill.hint && !showHint && isCorrect === null && (
              <TouchableOpacity onPress={() => setShowHint(true)} style={styles.hintBtn}>
                <Ionicons name="bulb-outline" size={16} color="#FBBF24" />
                <Text style={[styles.hintBtnText, { color: "#FBBF24" }]}>Show Hint</Text>
              </TouchableOpacity>
            )}
            {showHint && (
              <View style={[styles.hintCard, { backgroundColor: "#FBBF2410", borderColor: "#FBBF2430" }]}>
                <Ionicons name="bulb" size={14} color="#FBBF24" />
                <Text style={[styles.hintText, { color: "#FBBF24" }]}>{drill.hint}</Text>
              </View>
            )}
          </View>
        )}

        {/* Feedback */}
        {isCorrect !== null && (
          <View style={[styles.feedbackCard, { backgroundColor: isCorrect ? "#4ADE8015" : "#F8717115", borderColor: isCorrect ? "#4ADE8040" : "#F8717140" }]}>
            <Ionicons name={isCorrect ? "checkmark-circle" : "close-circle"} size={20} color={isCorrect ? "#4ADE80" : "#F87171"} />
            <View>
              <Text style={[styles.feedbackTitle, { color: isCorrect ? "#4ADE80" : "#F87171" }]}>
                {isCorrect ? "Correct!" : "Not quite"}
              </Text>
              {!isCorrect && (
                <Text style={[styles.feedbackAnswer, { color: colors.muted }]}>
                  Answer: {drill.correctAnswer}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {isCorrect === null ? (
            <TouchableOpacity
              style={[styles.checkBtn, { backgroundColor: colors.primary, opacity: (selectedAnswer || textAnswer.trim()) ? 1 : 0.5 }]}
              onPress={checkAnswer}
              disabled={!selectedAnswer && !textAnswer.trim()}
            >
              <Text style={styles.checkBtnText}>Check</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.checkBtn, { backgroundColor: colors.primary }]} onPress={nextDrill}>
              <Text style={styles.checkBtnText}>{currentDrill >= CURRENT_LESSON.drills.length - 1 ? "Finish" : "Continue"}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderCompleted = () => (
    <View style={styles.completedContainer}>
      <Text style={styles.completedEmoji}>🎉</Text>
      <Text style={[styles.completedTitle, { color: colors.foreground }]}>Lesson Complete!</Text>
      <Text style={[styles.completedSubtitle, { color: colors.muted }]}>{CURRENT_LESSON.title}</Text>

      <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreItemValue, { color: colors.primary }]}>{score}</Text>
            <Text style={[styles.scoreItemLabel, { color: colors.muted }]}>Points</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreItemValue, { color: "#FBBF24" }]}>+{CURRENT_LESSON.xpReward}</Text>
            <Text style={[styles.scoreItemLabel, { color: colors.muted }]}>XP Earned</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreItemValue, { color: colors.success }]}>{Math.round((score / (CURRENT_LESSON.drills.reduce((s, d) => s + d.points, 0))) * 100)}%</Text>
            <Text style={[styles.scoreItemLabel, { color: colors.muted }]}>Accuracy</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.progressBarWrap, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
        </View>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={14} color="#F59E0B" />
          <Text style={[styles.streakText, { color: "#F59E0B" }]}>{streak}</Text>
        </View>
      </View>

      {/* Lesson Info */}
      {!completed && (
        <View style={[styles.lessonInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 20 }}>{CURRENT_LESSON.icon}</Text>
          <View>
            <Text style={[styles.lessonTitle, { color: colors.foreground }]}>{CURRENT_LESSON.title}</Text>
            <Text style={[styles.lessonTopic, { color: colors.muted }]}>{CURRENT_LESSON.topic} • {CURRENT_LESSON.difficulty}</Text>
          </View>
        </View>
      )}

      {completed ? renderCompleted() : renderDrill()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, gap: 12 },
  backBtn: { padding: 4 },
  progressBarWrap: { flex: 1, height: 8, borderRadius: 4 },
  progressBarFill: { height: 8, borderRadius: 4 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 2 },
  streakText: { fontSize: 13, fontWeight: "800" },
  lessonInfo: { flexDirection: "row", alignItems: "center", gap: 12, margin: 16, padding: 12, borderRadius: 12, borderWidth: 1 },
  lessonTitle: { fontSize: 15, fontWeight: "700" },
  lessonTopic: { fontSize: 12, marginTop: 2 },
  drillContainer: { flex: 1, padding: 16 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 16 },
  typeText: { fontSize: 12, fontWeight: "700" },
  question: { fontSize: 20, fontWeight: "700", lineHeight: 28, marginBottom: 24 },
  optionsGrid: { gap: 10 },
  optionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: 12 },
  optionText: { fontSize: 16, fontWeight: "600" },
  inputArea: { gap: 10 },
  answerInput: { height: 52, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, fontSize: 16, fontWeight: "600" },
  hintBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  hintBtnText: { fontSize: 12, fontWeight: "600" },
  hintCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1 },
  hintText: { fontSize: 13 },
  feedbackCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  feedbackTitle: { fontSize: 15, fontWeight: "700" },
  feedbackAnswer: { fontSize: 13, marginTop: 2 },
  actionRow: { marginTop: 24 },
  checkBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  checkBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  completedContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  completedEmoji: { fontSize: 48, marginBottom: 12 },
  completedTitle: { fontSize: 24, fontWeight: "800" },
  completedSubtitle: { fontSize: 14, marginTop: 4, marginBottom: 24 },
  scoreCard: { width: "100%", padding: 20, borderRadius: 14, borderWidth: 1, marginBottom: 24 },
  scoreRow: { flexDirection: "row", justifyContent: "space-around" },
  scoreItem: { alignItems: "center" },
  scoreItemValue: { fontSize: 22, fontWeight: "800" },
  scoreItemLabel: { fontSize: 11, marginTop: 4 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
