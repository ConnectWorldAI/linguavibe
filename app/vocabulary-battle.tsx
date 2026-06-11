import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { trpc } from "@/lib/trpc";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface BattleQuestion {
  id: string;
  word: string;
  translation: string;
  options: string[];
  correctIndex: number;
  dialect: string;
  flag: string;
}

type BattleState = "lobby" | "countdown" | "playing" | "result";

// ─── QUESTION BANK ───────────────────────────────────────────────────────────

const BATTLE_QUESTIONS: BattleQuestion[] = [
  { id: "1", word: "Vaina", translation: "Thing / Stuff", options: ["Money", "Thing / Stuff", "Food", "Car"], correctIndex: 1, dialect: "Dominican", flag: "🇩🇴" },
  { id: "2", word: "Chévere", translation: "Cool / Awesome", options: ["Cool / Awesome", "Ugly", "Fast", "Slow"], correctIndex: 0, dialect: "Venezuelan", flag: "🇻🇪" },
  { id: "3", word: "Parcero", translation: "Friend / Buddy", options: ["Enemy", "Teacher", "Friend / Buddy", "Boss"], correctIndex: 2, dialect: "Colombian", flag: "🇨🇴" },
  { id: "4", word: "Güey", translation: "Dude", options: ["Girl", "Dude", "Dog", "House"], correctIndex: 1, dialect: "Mexican", flag: "🇲🇽" },
  { id: "5", word: "Bacano", translation: "Great / Excellent", options: ["Bad", "Boring", "Great / Excellent", "Small"], correctIndex: 2, dialect: "Colombian", flag: "🇨🇴" },
  { id: "6", word: "Jeva", translation: "Girlfriend", options: ["Girlfriend", "Mother", "Sister", "Teacher"], correctIndex: 0, dialect: "Dominican", flag: "🇩🇴" },
  { id: "7", word: "Pana", translation: "Friend", options: ["Bread", "Friend", "Water", "Street"], correctIndex: 1, dialect: "Venezuelan", flag: "🇻🇪" },
  { id: "8", word: "Neta", translation: "Truth / For real", options: ["Lie", "Maybe", "Truth / For real", "Never"], correctIndex: 2, dialect: "Mexican", flag: "🇲🇽" },
  { id: "9", word: "Tiguere", translation: "Clever person", options: ["Animal", "Clever person", "Fool", "Child"], correctIndex: 1, dialect: "Dominican", flag: "🇩🇴" },
  { id: "10", word: "Chimba", translation: "Amazing", options: ["Terrible", "Amazing", "Normal", "Weird"], correctIndex: 1, dialect: "Colombian", flag: "🇨🇴" },
  { id: "11", word: "Chamo", translation: "Kid / Young person", options: ["Old man", "Kid / Young person", "Teacher", "Doctor"], correctIndex: 1, dialect: "Venezuelan", flag: "🇻🇪" },
  { id: "12", word: "Órale", translation: "Alright / Let's go", options: ["Goodbye", "Alright / Let's go", "Stop", "Wait"], correctIndex: 1, dialect: "Mexican", flag: "🇲🇽" },
  { id: "13", word: "Klk", translation: "What's up", options: ["What's up", "Goodbye", "Thank you", "Sorry"], correctIndex: 0, dialect: "Dominican", flag: "🇩🇴" },
  { id: "14", word: "Berraco", translation: "Brave / Skilled", options: ["Scared", "Lazy", "Brave / Skilled", "Quiet"], correctIndex: 2, dialect: "Colombian", flag: "🇨🇴" },
  { id: "15", word: "Chido", translation: "Cool / Nice", options: ["Hot", "Cool / Nice", "Cold", "Ugly"], correctIndex: 1, dialect: "Mexican", flag: "🇲🇽" },
];

const ROUND_TIME = 10; // seconds per question
const TOTAL_ROUNDS = 10;

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function VocabularyBattleScreen() {
  const router = useRouter();
  const [battleState, setBattleState] = useState<BattleState>("lobby");
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerStreak, setPlayerStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [playerAnswers, setPlayerAnswers] = useState<(boolean | null)[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;

  // Shuffle and pick questions
  const initQuestions = useCallback(() => {
    const shuffled = [...BATTLE_QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, TOTAL_ROUNDS));
  }, []);

  // Start battle
  const startBattle = useCallback(() => {
    initQuestions();
    setBattleState("countdown");
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerStreak(0);
    setCurrentRound(0);
    setPlayerAnswers([]);
    setCountdown(3);
  }, [initQuestions]);

  // Countdown effect
  useEffect(() => {
    if (battleState !== "countdown") return;
    if (countdown <= 0) {
      setBattleState("playing");
      setTimeLeft(ROUND_TIME);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [battleState, countdown]);

  // Round timer
  useEffect(() => {
    if (battleState !== "playing") return;
    if (showResult) return;

    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: ROUND_TIME * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up
          handleTimeout();
          return ROUND_TIME;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [battleState, currentRound, showResult]);

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(-1);
    setShowResult(true);
    setPlayerStreak(0);
    setPlayerAnswers((prev) => [...prev, null]);
    // Opponent might get it right
    if (Math.random() > 0.4) {
      setOpponentScore((s) => s + 100);
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(advanceRound, 1500);
  };

  const handleAnswer = (index: number) => {
    if (showResult || selectedAnswer !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedAnswer(index);
    setShowResult(true);

    const question = questions[currentRound];
    const isCorrect = index === question.correctIndex;

    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft * 10);
      const streakBonus = playerStreak >= 3 ? 50 : playerStreak >= 2 ? 25 : 0;
      const points = 100 + timeBonus + streakBonus;
      setPlayerScore((s) => s + points);
      setPlayerStreak((s) => s + 1);
      setPlayerAnswers((prev) => [...prev, true]);

      // Score pop animation
      Animated.sequence([
        Animated.timing(scorePopAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scorePopAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setPlayerStreak(0);
      setPlayerAnswers((prev) => [...prev, false]);

      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Simulate opponent answer
    const opponentCorrect = Math.random() > 0.45;
    if (opponentCorrect) {
      const oppTimeBonus = Math.floor(Math.random() * 80);
      setOpponentScore((s) => s + 100 + oppTimeBonus);
    }

    setTimeout(advanceRound, 1500);
  };

  const advanceRound = () => {
    if (currentRound >= TOTAL_ROUNDS - 1) {
      setBattleState("result");
      return;
    }
    setCurrentRound((r) => r + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(ROUND_TIME);
  };

  const currentQuestion = questions[currentRound];

  // ─── LOBBY ─────────────────────────────────────────────────────────────────

  if (battleState === "lobby") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vocabulary Battle</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.lobbyContent}>
          <View style={styles.lobbyHero}>
            <Text style={styles.lobbyEmoji}>⚔️</Text>
            <Text style={styles.lobbyTitle}>Head-to-Head Battle</Text>
            <Text style={styles.lobbyDesc}>
              Test your vocabulary against an opponent! Answer faster for bonus points.
              Build streaks for multipliers.
            </Text>
          </View>

          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>Battle Rules</Text>
            <View style={styles.ruleRow}>
              <Ionicons name="timer" size={18} color={Colors.secondary} />
              <Text style={styles.ruleText}>{ROUND_TIME} seconds per question</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="layers" size={18} color={Colors.gold} />
              <Text style={styles.ruleText}>{TOTAL_ROUNDS} rounds total</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="flash" size={18} color={Colors.success} />
              <Text style={styles.ruleText}>Faster answers = more points</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="flame" size={18} color={Colors.accent} />
              <Text style={styles.ruleText}>3+ streak = bonus multiplier</Text>
            </View>
          </View>

          <View style={styles.dialectsCard}>
            <Text style={styles.dialectsTitle}>Dialects Featured</Text>
            <View style={styles.dialectsRow}>
              <View style={styles.dialectChip}><Text style={styles.dialectChipText}>🇩🇴 Dominican</Text></View>
              <View style={styles.dialectChip}><Text style={styles.dialectChipText}>🇨🇴 Colombian</Text></View>
              <View style={styles.dialectChip}><Text style={styles.dialectChipText}>🇲🇽 Mexican</Text></View>
              <View style={styles.dialectChip}><Text style={styles.dialectChipText}>🇻🇪 Venezuelan</Text></View>
            </View>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={startBattle}>
            <Ionicons name="flash" size={20} color="#000" />
            <Text style={styles.startBtnText}>Find Opponent</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── COUNTDOWN ─────────────────────────────────────────────────────────────

  if (battleState === "countdown") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownLabel}>Battle starts in</Text>
          <Text style={styles.countdownNumber}>{countdown}</Text>
          <View style={styles.vsContainer}>
            <View style={styles.playerCard}>
              <Text style={styles.playerAvatar}>👤</Text>
              <Text style={styles.playerName}>You</Text>
            </View>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.playerCard}>
              <Text style={styles.playerAvatar}>🤖</Text>
              <Text style={styles.playerName}>AI Rival</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── RESULT ────────────────────────────────────────────────────────────────

  if (battleState === "result") {
    const won = playerScore > opponentScore;
    const tied = playerScore === opponentScore;
    const correctCount = playerAnswers.filter((a) => a === true).length;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <Text style={styles.resultEmoji}>
            {won ? "🏆" : tied ? "🤝" : "😤"}
          </Text>
          <Text style={styles.resultTitle}>
            {won ? "Victory!" : tied ? "It's a Tie!" : "Defeat"}
          </Text>
          <Text style={styles.resultSubtitle}>
            {won
              ? "You dominated the battle!"
              : tied
              ? "Evenly matched!"
              : "Better luck next time!"}
          </Text>

          <View style={styles.scoreComparison}>
            <View style={styles.scoreColumn}>
              <Text style={styles.scoreLabel}>You</Text>
              <Text style={[styles.finalScore, won && styles.winnerScore]}>
                {playerScore}
              </Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreColumn}>
              <Text style={styles.scoreLabel}>AI Rival</Text>
              <Text style={[styles.finalScore, !won && !tied && styles.winnerScore]}>
                {opponentScore}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{correctCount}/{TOTAL_ROUNDS}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round((correctCount / TOTAL_ROUNDS) * 100)}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.max(...(playerAnswers.reduce((acc: number[], val) => {
                if (val === true) acc.push((acc[acc.length - 1] || 0) + 1);
                else acc.push(0);
                return acc;
              }, []) || [0]))}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.playAgainBtn} onPress={startBattle}>
              <Ionicons name="refresh" size={18} color="#000" />
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exitBtn} onPress={() => router.back()}>
              <Text style={styles.exitBtnText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── PLAYING ───────────────────────────────────────────────────────────────

  if (!currentQuestion) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Score Bar */}
      <View style={styles.scoreBar}>
        <View style={styles.scoreBarPlayer}>
          <Text style={styles.scoreBarAvatar}>👤</Text>
          <Text style={styles.scoreBarScore}>{playerScore}</Text>
        </View>
        <View style={styles.roundIndicator}>
          <Text style={styles.roundText}>{currentRound + 1}/{TOTAL_ROUNDS}</Text>
        </View>
        <View style={styles.scoreBarPlayer}>
          <Text style={styles.scoreBarScore}>{opponentScore}</Text>
          <Text style={styles.scoreBarAvatar}>🤖</Text>
        </View>
      </View>

      {/* Timer Bar */}
      <View style={styles.timerBarContainer}>
        <Animated.View
          style={[
            styles.timerBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: timeLeft <= 3 ? Colors.accent : Colors.secondary,
            },
          ]}
        />
      </View>

      {/* Streak indicator */}
      {playerStreak >= 2 && (
        <View style={styles.streakBanner}>
          <Ionicons name="flame" size={16} color={Colors.gold} />
          <Text style={styles.streakBannerText}>{playerStreak}x Streak!</Text>
        </View>
      )}

      {/* Question */}
      <Animated.View style={[styles.questionContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.dialectBadge}>
          <Text style={styles.dialectBadgeText}>{currentQuestion.flag} {currentQuestion.dialect}</Text>
        </View>
        <Text style={styles.questionWord}>{currentQuestion.word}</Text>
        <Text style={styles.questionPrompt}>What does this mean?</Text>
      </Animated.View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = index === currentQuestion.correctIndex;
          const showCorrect = showResult && isCorrect;
          const showWrong = showResult && isSelected && !isCorrect;

          return (
            <TouchableOpacity
              key={`${currentQuestion.id}-${index}`}
              style={[
                styles.optionBtn,
                showCorrect && styles.optionCorrect,
                showWrong && styles.optionWrong,
                isSelected && !showResult && styles.optionSelected,
              ]}
              onPress={() => handleAnswer(index)}
              disabled={showResult}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.optionText,
                showCorrect && styles.optionTextCorrect,
                showWrong && styles.optionTextWrong,
              ]}>
                {option}
              </Text>
              {showCorrect && <Ionicons name="checkmark-circle" size={22} color={Colors.success} />}
              {showWrong && <Ionicons name="close-circle" size={22} color={Colors.accent} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timer display */}
      <View style={styles.timerDisplay}>
        <Ionicons name="timer" size={18} color={timeLeft <= 3 ? Colors.accent : Colors.textSecondary} />
        <Text style={[styles.timerText, timeLeft <= 3 && styles.timerTextUrgent]}>
          {timeLeft}s
        </Text>
      </View>

      {/* Score pop animation */}
      <Animated.View style={[styles.scorePop, { opacity: scorePopAnim, transform: [{ scale: scorePopAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] }) }] }]}>
        <Text style={styles.scorePopText}>+{100 + Math.floor(timeLeft * 10)}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  // Lobby
  lobbyContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  lobbyHero: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  lobbyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  lobbyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  lobbyDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  rulesCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rulesTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ruleText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  dialectsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dialectsTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  dialectsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  dialectChip: {
    backgroundColor: Colors.glowSubtle,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  dialectChipText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  startBtnText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: "#000",
  },

  // Countdown
  countdownContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownLabel: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  countdownNumber: {
    fontSize: 80,
    fontWeight: "900",
    color: Colors.secondary,
    marginBottom: Spacing.xxl,
  },
  vsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  playerCard: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  playerAvatar: {
    fontSize: 40,
  },
  playerName: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  vsText: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.gold,
  },

  // Score Bar
  scoreBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  scoreBarPlayer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  scoreBarAvatar: {
    fontSize: 24,
  },
  scoreBarScore: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  roundIndicator: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roundText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  // Timer Bar
  timerBarContainer: {
    height: 4,
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: Spacing.lg,
    borderRadius: 2,
    overflow: "hidden",
  },
  timerBarFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Streak
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  streakBannerText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gold,
  },

  // Question
  questionContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  dialectBadge: {
    backgroundColor: Colors.glowSubtle,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  dialectBadgeText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  questionWord: {
    fontSize: 36,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  questionPrompt: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  // Options
  optionsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flex: 1,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.glowSubtle,
  },
  optionCorrect: {
    borderColor: Colors.success,
    backgroundColor: "rgba(0, 255, 136, 0.08)",
  },
  optionWrong: {
    borderColor: Colors.accent,
    backgroundColor: "rgba(255, 45, 45, 0.08)",
  },
  optionText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  optionTextCorrect: {
    color: Colors.success,
  },
  optionTextWrong: {
    color: Colors.accent,
  },

  // Timer Display
  timerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  timerText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  timerTextUrgent: {
    color: Colors.accent,
  },

  // Score Pop
  scorePop: {
    position: "absolute",
    top: "30%",
    alignSelf: "center",
  },
  scorePopText: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.success,
  },

  // Result
  resultContent: {
    padding: Spacing.lg,
    alignItems: "center",
    paddingTop: 60,
  },
  resultEmoji: {
    fontSize: 72,
    marginBottom: Spacing.md,
  },
  resultTitle: {
    fontSize: FontSize.hero,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  resultSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  scoreComparison: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
  },
  scoreColumn: {
    flex: 1,
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  finalScore: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  winnerScore: {
    color: Colors.gold,
  },
  scoreDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  resultActions: {
    width: "100%",
    gap: Spacing.sm,
  },
  playAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  playAgainText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: "#000",
  },
  exitBtn: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  exitBtnText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
