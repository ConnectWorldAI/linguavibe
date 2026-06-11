/**
 * Whiteboard Lesson Screen
 * 
 * Full-screen interactive whiteboard lesson inspired by @inglesconomar's teaching style.
 * Uses the reusable WhiteboardExercise component with tRPC-generated lesson content.
 * 
 * Features:
 * - AI generates step-by-step whiteboard lesson on any topic
 * - Animated teacher writing on chalkboard
 * - Dual input: scribble/write OR multiple choice tap
 * - Smart grading with auto-advance
 * - Results screen with XP earned
 * - Saves progress to AsyncStorage
 */
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logLearningSession, type CEFRLevel } from "@/lib/cefr-hour-tracker";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { trpc } from "@/lib/trpc";
import { ConfettiAnimation } from "@/components/confetti-animation";
import {
  WhiteboardExercise,
  type WhiteboardLessonData,
  type WhiteboardResults,
} from "@/components/whiteboard-exercise";

// ─── Colors ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#0A0A0F",
  card: "#1A1A2E",
  cardLight: "#252540",
  primary: "#6C63FF",
  primaryLight: "#8B83FF",
  success: "#22C55E",
  successBg: "rgba(34,197,94,0.15)",
  error: "#EF4444",
  errorBg: "rgba(239,68,68,0.15)",
  warning: "#F59E0B",
  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  border: "#2A2A4A",
  gold: "#FFD700",
  board: "#1B4332",
};

// ─── XP Calculation ─────────────────────────────────────────────────────────
const XP_BY_LEVEL: Record<string, number> = {
  A1: 20, A2: 25, B1: 30, B2: 40, C1: 50, C2: 60,
};

type ScreenPhase = "loading" | "lesson" | "results" | "error";

export default function WhiteboardLessonScreen() {
  const params = useLocalSearchParams<{
    topic: string;
    language: string;
    dialect?: string;
    level: string;
    lessonType?: string;
    nativeLanguage?: string;
    lessonId?: string;
  }>();

  const topic = params.topic || "Basic Greetings";
  const language = params.language || "Spanish";
  const dialect = params.dialect;
  const level = params.level || "A1";
  const lessonType = (params.lessonType as any) || "grammar";
  const nativeLanguage = params.nativeLanguage || "English";
  const lessonId = params.lessonId || "";

  // ─── State ──────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<ScreenPhase>("loading");
  const [lessonData, setLessonData] = useState<WhiteboardLessonData | null>(null);
  const [results, setResults] = useState<WhiteboardResults | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // tRPC mutation
  const generateMutation = trpc.creatorEngine.generateWhiteboardLesson.useMutation();

  // ─── Generate Lesson ────────────────────────────────────────────────────
  const generateLesson = useCallback(async () => {
    setPhase("loading");
    setErrorMsg("");

    try {
      const result = await generateMutation.mutateAsync({
        language,
        dialect: dialect || undefined,
        nativeLanguage,
        level: level as any,
        topic,
        lessonType: lessonType as any,
        stepCount: 5,
      });

      if (!result.success || !result.steps || result.steps.length === 0) {
        throw new Error(result.error || "Failed to generate whiteboard lesson");
      }

      const data: WhiteboardLessonData = {
        lessonTitle: result.lessonTitle || topic,
        teacherName: result.teacherName || "Profe Omar",
        estimatedMinutes: result.estimatedMinutes || 5,
        steps: result.steps,
        summary: result.summary,
      };

      setLessonData(data);
      setPhase("lesson");
    } catch (err: any) {
      console.error("[WhiteboardLesson] Generation error:", err);
      setErrorMsg(err.message || "Something went wrong");
      setPhase("error");
    }
  }, [language, dialect, nativeLanguage, level, topic, lessonType]);

  useEffect(() => {
    generateLesson();
  }, []);

  // ─── Handle Lesson Complete ─────────────────────────────────────────────
  const handleComplete = useCallback(
    async (res: WhiteboardResults) => {
      setResults(res);

      // Calculate XP
      const baseXP = XP_BY_LEVEL[level] || 20;
      const accuracyBonus = Math.round(res.accuracy * baseXP);
      const speedBonus = res.timeSpent < 120 ? 10 : res.timeSpent < 180 ? 5 : 0;
      const writeBonus = res.inputModeUsed === "write" || res.inputModeUsed === "mixed" ? 10 : 0;
      const totalXP = baseXP + accuracyBonus + speedBonus + writeBonus;
      setXpEarned(totalXP);

      // Show confetti if accuracy >= 70%
      if (res.accuracy >= 0.7) {
        setShowConfetti(true);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      // Save progress
      try {
        const key = `whiteboard_progress_${language}`;
        const existing = await AsyncStorage.getItem(key);
        const progress = existing ? JSON.parse(existing) : { totalLessons: 0, totalXP: 0, topics: [] };
        progress.totalLessons += 1;
        progress.totalXP += totalXP;
        if (!progress.topics.includes(topic)) progress.topics.push(topic);
        progress.lastLesson = {
          topic,
          level,
          accuracy: res.accuracy,
          xp: totalXP,
          date: new Date().toISOString(),
        };
        await AsyncStorage.setItem(key, JSON.stringify(progress));

        // Also update global XP
        const globalXP = await AsyncStorage.getItem("totalXP");
        const currentXP = globalXP ? parseInt(globalXP) : 0;
        await AsyncStorage.setItem("totalXP", String(currentXP + totalXP));
      } catch (e) {
        console.error("[WhiteboardLesson] Save progress error:", e);
      }

      // Log CEFR hours
      try {
        await logLearningSession({
          activityType: "whiteboard",
          durationMinutes: Math.max(1, Math.round(res.timeSpent / 60)),
          language,
          level: (level.toUpperCase() || "A1") as CEFRLevel,
          topic,
          accuracy: res.accuracy,
          xpEarned: totalXP,
        });
      } catch (e2) {
        // Silently handle
      }

      setPhase("results");
    },
    [language, level, topic]
  );

  // ─── Render Loading ─────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          {/* Whiteboard loading animation */}
          <View style={styles.loadingBoard}>
            <View style={styles.loadingBoardFrame}>
              <View style={styles.loadingBoardSurface}>
                <ActivityIndicator size="large" color="#74C0FC" />
                <Text style={styles.loadingBoardText}>
                  Profe Omar is preparing{"\n"}the whiteboard...
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.loadingTopic}>{topic}</Text>
          <Text style={styles.loadingLevel}>{level} · {language}{dialect ? ` (${dialect})` : ""}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render Error ───────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={C.error} />
          <Text style={styles.errorTitle}>Couldn't load lesson</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={generateLesson}>
            <Ionicons name="refresh" size={20} color={C.text} />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render Results ─────────────────────────────────────────────────────
  if (phase === "results" && results) {
    const accuracy = Math.round(results.accuracy * 100);
    const grade =
      accuracy >= 90 ? "A+" : accuracy >= 80 ? "A" : accuracy >= 70 ? "B" : accuracy >= 60 ? "C" : "D";
    const gradeColor =
      accuracy >= 80 ? C.success : accuracy >= 60 ? C.warning : C.error;

    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        {showConfetti && <ConfettiAnimation visible={showConfetti} onComplete={() => setShowConfetti(false)} />}
        <View style={styles.resultsContainer}>
          {/* Grade Circle */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.gradeCircle}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
            <Text style={styles.gradePercent}>{accuracy}%</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Text style={styles.resultsTitle}>
              {accuracy >= 80 ? "Excellent work!" : accuracy >= 60 ? "Good effort!" : "Keep practicing!"}
            </Text>
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color={C.success} />
              <Text style={styles.statValue}>{results.correctAnswers}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="close-circle" size={24} color={C.error} />
              <Text style={styles.statValue}>{results.wrongAnswers}</Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color={C.gold} />
              <Text style={styles.statValue}>+{xpEarned}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color={C.primaryLight} />
              <Text style={styles.statValue}>{Math.floor(results.timeSpent / 60)}:{String(results.timeSpent % 60).padStart(2, "0")}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </Animated.View>

          {/* Input mode badge */}
          <Animated.View entering={FadeIn.delay(600).duration(300)} style={styles.modeBadge}>
            <Ionicons
              name={results.inputModeUsed === "write" ? "pencil" : results.inputModeUsed === "tap" ? "grid" : "swap-horizontal"}
              size={16}
              color={C.primary}
            />
            <Text style={styles.modeBadgeText}>
              {results.inputModeUsed === "write" ? "Written answers" : results.inputModeUsed === "tap" ? "Multiple choice" : "Mixed mode"}
            </Text>
          </Animated.View>

          {/* Summary */}
          {lessonData?.summary && (
            <Animated.View entering={FadeIn.delay(700).duration(300)} style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Key Takeaway</Text>
              <Text style={styles.summaryRule}>{lessonData.summary.keyRule}</Text>
              <Text style={styles.summaryPhrase}>"{lessonData.summary.practicePhrase}"</Text>
              {lessonData.summary.nextTopic && (
                <Text style={styles.summaryNext}>Next: {lessonData.summary.nextTopic}</Text>
              )}
            </Animated.View>
          )}

          {/* Actions */}
          <Animated.View entering={FadeIn.delay(800).duration(300)} style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => router.back()}
            >
              <Text style={styles.actionBtnSecondaryText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => {
                setPhase("loading");
                setResults(null);
                setShowConfetti(false);
                generateLesson();
              }}
            >
              <Ionicons name="refresh" size={18} color={C.text} />
              <Text style={styles.actionBtnPrimaryText}>New Lesson</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render Lesson ──────────────────────────────────────────────────────
  if (phase === "lesson" && lessonData) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <WhiteboardExercise
          lesson={lessonData}
          onComplete={handleComplete}
          onExit={() => router.back()}
          speakEnabled={true}
          ttsLanguage={language}
        />
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  loadingBoard: {
    width: "85%",
    borderRadius: 16,
    overflow: "hidden",
  },
  loadingBoardFrame: {
    backgroundColor: "#5C4033",
    padding: 8,
    borderRadius: 16,
  },
  loadingBoardSurface: {
    backgroundColor: C.board,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  loadingBoardText: {
    fontFamily: Platform.OS === "ios" ? "Chalkduster" : "monospace",
    fontSize: 16,
    color: "#74C0FC",
    textAlign: "center",
    lineHeight: 24,
  },
  loadingTopic: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
  },
  loadingLevel: {
    fontSize: 14,
    color: C.textMuted,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
  },
  errorMsg: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: C.text,
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
    fontSize: 14,
    color: C.textMuted,
    textDecorationLine: "underline",
  },

  // Results
  resultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  gradeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.card,
    borderWidth: 3,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: {
    fontSize: 32,
    fontWeight: "900",
  },
  gradePercent: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: -2,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  statCard: {
    width: 80,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
  },
  statLabel: {
    fontSize: 11,
    color: C.textMuted,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${C.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modeBadgeText: {
    fontSize: 13,
    color: C.primary,
    fontWeight: "500",
  },
  summaryCard: {
    width: "100%",
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryRule: {
    fontSize: 16,
    color: C.text,
    lineHeight: 22,
  },
  summaryPhrase: {
    fontSize: 15,
    color: C.primaryLight,
    fontStyle: "italic",
  },
  summaryNext: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionBtnSecondary: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  actionBtnSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: C.textSecondary,
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.primary,
  },
  actionBtnPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
  },
});
