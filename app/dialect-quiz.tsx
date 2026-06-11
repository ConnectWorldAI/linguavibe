/**
 * Dialect Quiz Screen
 *
 * Cloud Wave tests the student on recognizing which country/region
 * a slang phrase comes from. Multiple choice with 4 options per question.
 * Tracks score, streak, and previously asked questions to avoid repeats.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { createVanillaClient } from "@/lib/trpc";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


// ─── Types ──────────────────────────────────────────────────────────────────

interface QuizOption {
  region: string;
  flag: string;
}

interface QuizQuestion {
  word: string;
  pronunciation: string;
  meaning: string;
  correctRegion: string;
  correctFlag: string;
  options: QuizOption[];
  explanation: string;
  difficulty: string;
}

interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  streak: number;
  bestStreak: number;
  answered: boolean;
  selectedRegion: string | null;
  isCorrect: boolean | null;
  totalPlayed: number;
}

const STORAGE_KEY = "@dialect_quiz_stats";
const ASKED_KEY = "@dialect_quiz_asked";

// ─── Component ──────────────────────────────────────────────────────────────

export default function DialectQuizScreen() {
  const { showStreakToast } = useUsage();
  const colors = useColors();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    answered: false,
    selectedRegion: null,
    isCorrect: null,
    totalPlayed: 0,
  });
  const [stats, setStats] = useState({ totalCorrect: 0, totalPlayed: 0, bestStreak: 0 });
  const [previouslyAsked, setPreviouslyAsked] = useState<string[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);

  const shakeX = useSharedValue(0);
  const scaleCorrect = useSharedValue(1);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setStats(JSON.parse(raw));
      const asked = await AsyncStorage.getItem(ASKED_KEY);
      if (asked) setPreviouslyAsked(JSON.parse(asked));
    } catch {}
  };

  const saveStats = async (newStats: typeof stats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      setStats(newStats);
    } catch {}
  };

  const saveAsked = async (words: string[]) => {
    try {
      // Keep last 100 to avoid infinite growth
      const trimmed = words.slice(-100);
      await AsyncStorage.setItem(ASKED_KEY, JSON.stringify(trimmed));
      setPreviouslyAsked(trimmed);
    } catch {}
  };

  // ─── Start Quiz ──────────────────────────────────────────────────────────

  const startQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const targetLanguage = (await AsyncStorage.getItem("@target_language")) || "Spanish";
      const client = createVanillaClient();
      const result = await client.waveCloudChat.generateDialectQuiz.mutate({
        targetLanguage,
        difficulty,
        questionCount: 5,
        previouslyAsked,
      });

      if (result.success && result.questions.length > 0) {
        setState({
          questions: result.questions,
          currentIndex: 0,
          score: 0,
          streak: 0,
          bestStreak: 0,
          answered: false,
          selectedRegion: null,
          isCorrect: null,
          totalPlayed: 0,
        });
        setQuizStarted(true);
      }
    } catch (err) {
      console.error("Failed to generate quiz:", err);
    } finally {
      setLoading(false);
    }
  }, [difficulty, previouslyAsked]);

  // ─── Answer Selection ─────────────────────────────────────────────────────

  const handleAnswer = useCallback(
    (region: string) => {
      if (state.answered) return;

      const question = state.questions[state.currentIndex];
      const correct = region === question.correctRegion;

      if (correct) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        scaleCorrect.value = withSequence(
          withTiming(1.1, { duration: 100 }),
          withTiming(1, { duration: 100 })
        );
      } else {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        shakeX.value = withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-10, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
      }

      const newStreak = correct ? state.streak + 1 : 0;
      const newBestStreak = Math.max(state.bestStreak, newStreak);

      setState((prev) => ({
        ...prev,
        answered: true,
        selectedRegion: region,
        isCorrect: correct,
        score: correct ? prev.score + 1 : prev.score,
        streak: newStreak,
        bestStreak: newBestStreak,
        totalPlayed: prev.totalPlayed + 1,
      }));

      // Track asked words
      const newAsked = [...previouslyAsked, question.word];
      saveAsked(newAsked);
    },
    [state, previouslyAsked]
  );

  // ─── Next Question ────────────────────────────────────────────────────────

  const nextQuestion = useCallback(() => {
    if (state.currentIndex >= state.questions.length - 1) {
      // Quiz complete - save stats
      const newStats = {
        totalCorrect: stats.totalCorrect + state.score,
        totalPlayed: stats.totalPlayed + state.questions.length,
        bestStreak: Math.max(stats.bestStreak, state.bestStreak),
      };
      saveStats(newStats);
      markPracticeAndToast(showStreakToast);
      return;
    }

    setState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      answered: false,
      selectedRegion: null,
      isCorrect: null,
    }));
  }, [state, stats]);

  // ─── Animated Styles ──────────────────────────────────────────────────────

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleCorrect.value }],
  }));

  // ─── Quiz Complete View ───────────────────────────────────────────────────

  const isComplete = quizStarted && state.currentIndex >= state.questions.length - 1 && state.answered;

  if (isComplete) {
    const percentage = Math.round((state.score / state.questions.length) * 100);
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Quiz Complete!</Text>
            <View style={{ width: 36 }} />
          </View>

          <Animated.View entering={FadeIn.duration(400)} style={styles.completeContainer}>
            {/* Score Circle */}
            <View style={[styles.scoreCircle, { borderColor: percentage >= 80 ? colors.success : percentage >= 50 ? colors.warning : colors.error }]}>
              <Text style={[styles.scorePercentage, { color: colors.foreground }]}>{percentage}%</Text>
              <Text style={[styles.scoreLabel, { color: colors.muted }]}>
                {state.score}/{state.questions.length}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statValue, { color: colors.success }]}>{state.score}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Correct</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{state.bestStreak}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Best Streak</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statValue, { color: colors.warning }]}>{stats.bestStreak}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>All-Time Best</Text>
              </View>
            </View>

            {/* Message from Cloud Wave */}
            <View style={[styles.waveMessage, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.waveEmoji]}>
                {percentage >= 80 ? "🌊" : percentage >= 50 ? "💪" : "📚"}
              </Text>
              <Text style={[styles.waveText, { color: colors.foreground }]}>
                {percentage >= 80
                  ? "Amazing! You really know your dialects! You're becoming a true language detective."
                  : percentage >= 50
                  ? "Good work! You're getting better at recognizing regional slang. Keep practicing!"
                  : "Don't worry — dialect recognition takes time. Each quiz makes you sharper!"}
              </Text>
            </View>

            {/* Action Buttons */}
            <Pressable
              onPress={() => {
                setQuizStarted(false);
                setState((prev) => ({ ...prev, currentIndex: 0, score: 0, streak: 0, bestStreak: 0, answered: false, selectedRegion: null, isCorrect: null, totalPlayed: 0 }));
              }}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
            >
              <Text style={[styles.primaryBtnText, { color: "#fff" }]}>Play Again</Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.secondaryBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.muted }]}>Back to Home</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Start Screen ─────────────────────────────────────────────────────────

  if (!quizStarted) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dialect Quiz</Text>
            <Pressable onPress={() => router.push("/dialect-quiz-leaderboard" as any)} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="trophy" size={20} color={colors.primary} />
            </Pressable>
          </View>

          <Animated.View entering={FadeInDown.duration(400)} style={styles.startContainer}>
            {/* Icon */}
            <Text style={styles.quizIcon}>🌍</Text>
            <Text style={[styles.startTitle, { color: colors.foreground }]}>
              Where's That Slang From?
            </Text>
            <Text style={[styles.startSubtitle, { color: colors.muted }]}>
              Cloud Wave will test you on recognizing which country or region a slang phrase belongs to. Can you tell Dominican from Mexican? Puerto Rican from Colombian?
            </Text>

            {/* Lifetime Stats */}
            {stats.totalPlayed > 0 && (
              <View style={[styles.lifetimeStats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.lifetimeTitle, { color: colors.foreground }]}>Your Stats</Text>
                <View style={styles.lifetimeRow}>
                  <Text style={[styles.lifetimeStat, { color: colors.muted }]}>
                    {stats.totalCorrect}/{stats.totalPlayed} correct ({Math.round((stats.totalCorrect / stats.totalPlayed) * 100)}%)
                  </Text>
                  <Text style={[styles.lifetimeStat, { color: colors.primary }]}>
                    Best streak: {stats.bestStreak}
                  </Text>
                </View>
              </View>
            )}

            {/* Difficulty Selector */}
            <Text style={[styles.difficultyLabel, { color: colors.foreground }]}>Difficulty</Text>
            <View style={styles.difficultyRow}>
              {(["easy", "medium", "hard"] as const).map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDifficulty(d)}
                  style={({ pressed }) => [
                    styles.difficultyBtn,
                    {
                      backgroundColor: difficulty === d ? colors.primary : colors.surface,
                      borderColor: difficulty === d ? colors.primary : colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyBtnText,
                      { color: difficulty === d ? "#fff" : colors.muted },
                    ]}
                  >
                    {d === "easy" ? "Easy" : d === "medium" ? "Medium" : "Hard"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Start Button */}
            <Pressable
              onPress={startQuiz}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.primary, marginTop: 24 },
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                loading && { opacity: 0.6 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.primaryBtnText, { color: "#fff" }]}>Start Quiz</Text>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Quiz In Progress ─────────────────────────────────────────────────────

  const question = state.questions[state.currentIndex];
  const progress = (state.currentIndex + 1) / state.questions.length;

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header with progress */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.muted }]}>
              {state.currentIndex + 1}/{state.questions.length}
            </Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={[styles.streakText, { color: colors.primary }]}>
              {state.streak > 0 ? `🔥${state.streak}` : ""}
            </Text>
          </View>
        </View>

        {/* Score bar */}
        <View style={styles.scoreBar}>
          <Text style={[styles.scoreText, { color: colors.success }]}>
            Score: {state.score}
          </Text>
        </View>

        {/* Question Card */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.questionLabel, { color: colors.muted }]}>
            Which region does this slang come from?
          </Text>
          <Text style={[styles.slangWord, { color: colors.foreground }]}>
            "{question.word}"
          </Text>
          {question.pronunciation ? (
            <Text style={[styles.pronunciation, { color: colors.muted }]}>
              /{question.pronunciation}/
            </Text>
          ) : null}
          <Text style={[styles.meaning, { color: colors.muted }]}>
            Meaning: {question.meaning}
          </Text>
        </Animated.View>

        {/* Options */}
        <Animated.View style={[styles.optionsContainer, shakeStyle]}>
          {question.options.map((option, idx) => {
            const isSelected = state.selectedRegion === option.region;
            const isCorrectOption = option.region === question.correctRegion;
            const showResult = state.answered;

            let optionBg = colors.surface;
            let optionBorder = colors.border;
            if (showResult && isCorrectOption) {
              optionBg = colors.success + "20";
              optionBorder = colors.success;
            } else if (showResult && isSelected && !state.isCorrect) {
              optionBg = colors.error + "20";
              optionBorder = colors.error;
            }

            return (
              <Pressable
                key={`${option.region}-${idx}`}
                onPress={() => handleAnswer(option.region)}
                disabled={state.answered}
                style={({ pressed }) => [
                  styles.optionBtn,
                  {
                    backgroundColor: optionBg,
                    borderColor: optionBorder,
                  },
                  pressed && !state.answered && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.optionFlag}>{option.flag}</Text>
                <Text style={[styles.optionText, { color: colors.foreground }]}>
                  {option.region}
                </Text>
                {showResult && isCorrectOption && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
                {showResult && isSelected && !state.isCorrect && (
                  <Text style={styles.crossmark}>✗</Text>
                )}
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Explanation (shown after answering) */}
        {state.answered && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[styles.explanationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.explanationTitle, { color: state.isCorrect ? colors.success : colors.error }]}>
              {state.isCorrect ? "Correct! 🎉" : "Not quite! 🤔"}
            </Text>
            <Text style={[styles.explanationText, { color: colors.muted }]}>
              {question.explanation}
            </Text>
          </Animated.View>
        )}

        {/* Next Button */}
        {state.answered && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pressable
              onPress={nextQuestion}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.primary, marginTop: 16 },
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: "#fff" }]}>
                {state.currentIndex >= state.questions.length - 1 ? "See Results" : "Next Question"}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
  },
  streakBadge: {
    width: 50,
    alignItems: "flex-end",
  },
  streakText: {
    fontSize: 16,
    fontWeight: "700",
  },
  scoreBar: {
    alignItems: "center",
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  questionCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  slangWord: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  pronunciation: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 8,
  },
  meaning: {
    fontSize: 14,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  optionFlag: {
    fontSize: 24,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    color: "#22C55E",
    fontWeight: "700",
  },
  crossmark: {
    fontSize: 20,
    color: "#EF4444",
    fontWeight: "700",
  },
  explanationCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  startContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },
  quizIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  startSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  lifetimeStats: {
    width: "100%",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  lifetimeTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  lifetimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  lifetimeStat: {
    fontSize: 13,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 10,
  },
  difficultyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  difficultyBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  completeContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: "800",
  },
  scoreLabel: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  waveMessage: {
    width: "100%",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 24,
  },
  waveEmoji: {
    fontSize: 24,
  },
  waveText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
