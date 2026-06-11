/**
 * Streak Battles & Wagering
 * 
 * Head-to-head challenges where users bet streak days or in-app currency
 * on who can score higher on a live quiz. Competitive social pressure = retention.
 * 
 * Features:
 * - Live 1v1 quiz battles with real-time scoring
 * - Wager system (bet streak days or credits)
 * - Battle history and win/loss record
 * - Matchmaking by skill level
 * - Battle categories (vocab, grammar, pronunciation, culture)
 * - Reward multipliers for win streaks
 */

import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BattleStats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
  creditsWon: number;
  creditsLost: number;
  rank: string;
  xp: number;
}

interface BattleChallenge {
  id: string;
  opponentName: string;
  opponentEmoji: string;
  opponentLevel: string;
  opponentWinRate: number;
  category: string;
  wagerType: "credits" | "streak_days";
  wagerAmount: number;
  language: string;
  status: "pending" | "active" | "completed";
  result?: "win" | "loss" | "draw";
  myScore?: number;
  opponentScore?: number;
  timestamp: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: number;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const MOCK_STATS: BattleStats = {
  wins: 47,
  losses: 23,
  draws: 5,
  winStreak: 4,
  bestStreak: 12,
  creditsWon: 1250,
  creditsLost: 580,
  rank: "Silver III",
  xp: 3420,
};

const MOCK_CHALLENGES: BattleChallenge[] = [
  { id: "b1", opponentName: "María G.", opponentEmoji: "🇪🇸", opponentLevel: "B2", opponentWinRate: 0.72, category: "Vocabulary", wagerType: "credits", wagerAmount: 50, language: "Spanish", status: "pending", timestamp: Date.now() - 300000 },
  { id: "b2", opponentName: "Yuki T.", opponentEmoji: "🇯🇵", opponentLevel: "B1", opponentWinRate: 0.65, category: "Grammar", wagerType: "streak_days", wagerAmount: 2, language: "Japanese", status: "pending", timestamp: Date.now() - 600000 },
  { id: "b3", opponentName: "Lucas R.", opponentEmoji: "🇧🇷", opponentLevel: "A2", opponentWinRate: 0.58, category: "Slang", wagerType: "credits", wagerAmount: 25, language: "Portuguese", status: "completed", result: "win", myScore: 8, opponentScore: 5, timestamp: Date.now() - 3600000 },
  { id: "b4", opponentName: "Sophie L.", opponentEmoji: "🇫🇷", opponentLevel: "C1", opponentWinRate: 0.81, category: "Culture", wagerType: "credits", wagerAmount: 100, language: "French", status: "completed", result: "loss", myScore: 6, opponentScore: 9, timestamp: Date.now() - 7200000 },
  { id: "b5", opponentName: "Jin K.", opponentEmoji: "🇰🇷", opponentLevel: "B2", opponentWinRate: 0.69, category: "Vocabulary", wagerType: "streak_days", wagerAmount: 3, language: "Korean", status: "completed", result: "win", myScore: 9, opponentScore: 7, timestamp: Date.now() - 14400000 },
];

const BATTLE_CATEGORIES = [
  { id: "vocab", name: "Vocabulary", icon: "book", color: "#3B82F6" },
  { id: "grammar", name: "Grammar", icon: "construct", color: "#8B5CF6" },
  { id: "slang", name: "Slang & Idioms", icon: "chatbox-ellipses", color: "#F59E0B" },
  { id: "culture", name: "Cultural IQ", icon: "earth", color: "#10B981" },
  { id: "pronunciation", name: "Pronunciation", icon: "mic", color: "#EF4444" },
  { id: "speed", name: "Speed Round", icon: "flash", color: "#EC4899" },
];

const MOCK_QUESTIONS: QuizQuestion[] = [
  { id: "q1", question: "What does 'estar en las nubes' mean?", options: ["To be in the clouds (daydreaming)", "To be very tall", "To be happy", "To be flying"], correctIndex: 0, category: "slang", difficulty: 2 },
  { id: "q2", question: "Which is correct: 'Yo soy cansado' or 'Yo estoy cansado'?", options: ["Yo soy cansado", "Yo estoy cansado", "Both are correct", "Neither is correct"], correctIndex: 1, category: "grammar", difficulty: 1 },
  { id: "q3", question: "What is the formal 'you' in French?", options: ["Tu", "Vous", "Il", "On"], correctIndex: 1, category: "vocab", difficulty: 1 },
  { id: "q4", question: "In Japan, what does bowing at 45° signify?", options: ["Casual hello", "Business greeting", "Deep apology", "Goodbye"], correctIndex: 2, category: "culture", difficulty: 3 },
  { id: "q5", question: "What does '대박' (daebak) mean in Korean?", options: ["Goodbye", "Thank you", "Awesome/Jackpot", "Sorry"], correctIndex: 2, category: "slang", difficulty: 1 },
];

const STORAGE_KEY = "@streak_battles_data";

// ─── Component ───────────────────────────────────────────────────────────────

export default function StreakBattlesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [stats, setStats] = useState<BattleStats>(MOCK_STATS);
  const [challenges, setChallenges] = useState<BattleChallenge[]>(MOCK_CHALLENGES);
  const [inBattle, setInBattle] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [battleComplete, setBattleComplete] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<BattleChallenge | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const winRate = stats.wins / (stats.wins + stats.losses + stats.draws) || 0;

  const startBattle = (challenge: BattleChallenge) => {
    setActiveChallenge(challenge);
    setInBattle(true);
    setCurrentQuestion(0);
    setMyScore(0);
    setOpponentScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setBattleComplete(false);
    setTimeLeft(10);
    startTimer();
  };

  const startTimer = () => {
    setTimeLeft(10);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    // Opponent might get it right
    const opponentGetsIt = Math.random() > 0.4;
    if (opponentGetsIt) setOpponentScore((prev) => prev + 1);
    setShowResult(true);
    setTimeout(() => nextQuestion(), 1500);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = index === MOCK_QUESTIONS[currentQuestion].correctIndex;
    if (correct) setMyScore((prev) => prev + 1);

    // Simulate opponent answer
    const opponentGetsIt = Math.random() > 0.35;
    if (opponentGetsIt) setOpponentScore((prev) => prev + 1);

    setShowResult(true);
    setTimeout(() => nextQuestion(), 1500);
  };

  const nextQuestion = () => {
    if (currentQuestion >= MOCK_QUESTIONS.length - 1) {
      setBattleComplete(true);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setCurrentQuestion((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    startTimer();
  };

  const endBattle = () => {
    setInBattle(false);
    setBattleComplete(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const getRankColor = (rank: string) => {
    if (rank.includes("Gold")) return "#F59E0B";
    if (rank.includes("Silver")) return "#9CA3AF";
    if (rank.includes("Bronze")) return "#CD7F32";
    if (rank.includes("Diamond")) return "#60A5FA";
    return colors.primary;
  };

  // ─── Battle View ───────────────────────────────────────────────────────────

  if (inBattle && !battleComplete) {
    const question = MOCK_QUESTIONS[currentQuestion];
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={styles.battleContainer}>
          {/* Score Header */}
          <View style={styles.battleHeader}>
            <View style={styles.battlePlayer}>
              <Text style={[styles.battlePlayerName, { color: colors.foreground }]}>You</Text>
              <Text style={[styles.battleScore, { color: colors.primary }]}>{myScore}</Text>
            </View>
            <View style={styles.battleVs}>
              <Text style={[styles.battleRound, { color: colors.muted }]}>
                {currentQuestion + 1}/{MOCK_QUESTIONS.length}
              </Text>
              <Text style={[styles.vsText, { color: colors.foreground }]}>VS</Text>
            </View>
            <View style={styles.battlePlayer}>
              <Text style={[styles.battlePlayerName, { color: colors.foreground }]}>
                {activeChallenge?.opponentName}
              </Text>
              <Text style={[styles.battleScore, { color: colors.error }]}>{opponentScore}</Text>
            </View>
          </View>

          {/* Timer */}
          <View style={[styles.timerBar, { backgroundColor: colors.surface }]}>
            <View style={[styles.timerFill, { 
              width: `${(timeLeft / 10) * 100}%`,
              backgroundColor: timeLeft > 5 ? colors.success : timeLeft > 2 ? colors.warning : colors.error,
            }]} />
          </View>
          <Text style={[styles.timerText, { color: timeLeft > 5 ? colors.success : colors.error }]}>
            {timeLeft}s
          </Text>

          {/* Question */}
          <View style={styles.questionSection}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{question.category}</Text>
            </View>
            <Text style={[styles.questionText, { color: colors.foreground }]}>{question.question}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              let bgColor = colors.surface;
              let borderColor = colors.border;
              let textColor = colors.foreground;

              if (showResult) {
                if (index === question.correctIndex) {
                  bgColor = colors.success + "20";
                  borderColor = colors.success;
                  textColor = colors.success;
                } else if (index === selectedAnswer && index !== question.correctIndex) {
                  bgColor = colors.error + "20";
                  borderColor = colors.error;
                  textColor = colors.error;
                }
              } else if (index === selectedAnswer) {
                bgColor = colors.primary + "15";
                borderColor = colors.primary;
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionButton, { backgroundColor: bgColor, borderColor }]}
                  onPress={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionLetter, { color: textColor }]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Battle Complete View ──────────────────────────────────────────────────

  if (battleComplete) {
    const won = myScore > opponentScore;
    const draw = myScore === opponentScore;

    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>{won ? "🏆" : draw ? "🤝" : "😤"}</Text>
          <Text style={[styles.resultTitle, { color: won ? colors.success : draw ? colors.warning : colors.error }]}>
            {won ? "VICTORY!" : draw ? "DRAW!" : "DEFEAT!"}
          </Text>
          <View style={styles.resultScores}>
            <View style={styles.resultScoreItem}>
              <Text style={[styles.resultScoreLabel, { color: colors.muted }]}>You</Text>
              <Text style={[styles.resultScoreValue, { color: colors.primary }]}>{myScore}</Text>
            </View>
            <Text style={[styles.resultVs, { color: colors.muted }]}>—</Text>
            <View style={styles.resultScoreItem}>
              <Text style={[styles.resultScoreLabel, { color: colors.muted }]}>{activeChallenge?.opponentName}</Text>
              <Text style={[styles.resultScoreValue, { color: colors.error }]}>{opponentScore}</Text>
            </View>
          </View>
          {activeChallenge && (
            <View style={[styles.wagerResult, { backgroundColor: won ? colors.success + "15" : colors.error + "15" }]}>
              <Text style={[styles.wagerResultText, { color: won ? colors.success : colors.error }]}>
                {won ? "+" : "-"}{activeChallenge.wagerAmount} {activeChallenge.wagerType === "credits" ? "credits" : "streak days"}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.primary }]}
            onPress={endBattle}
            activeOpacity={0.7}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Main Lobby View ───────────────────────────────────────────────────────

  const pendingChallenges = challenges.filter((c) => c.status === "pending");
  const completedChallenges = challenges.filter((c) => c.status === "completed");

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Streak Battles</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statsTop}>
            <View style={styles.rankSection}>
              <Text style={[styles.rankLabel, { color: colors.muted }]}>Rank</Text>
              <Text style={[styles.rankValue, { color: getRankColor(stats.rank) }]}>{stats.rank}</Text>
            </View>
            <View style={styles.recordSection}>
              <Text style={[styles.recordText, { color: colors.success }]}>{stats.wins}W</Text>
              <Text style={[styles.recordDivider, { color: colors.muted }]}>·</Text>
              <Text style={[styles.recordText, { color: colors.error }]}>{stats.losses}L</Text>
              <Text style={[styles.recordDivider, { color: colors.muted }]}>·</Text>
              <Text style={[styles.recordText, { color: colors.muted }]}>{stats.draws}D</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statBoxValue, { color: colors.primary }]}>{Math.round(winRate * 100)}%</Text>
              <Text style={[styles.statBoxLabel, { color: colors.muted }]}>Win Rate</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statBoxValue, { color: colors.warning }]}>{stats.winStreak}</Text>
              <Text style={[styles.statBoxLabel, { color: colors.muted }]}>Current Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statBoxValue, { color: colors.success }]}>{stats.creditsWon}</Text>
              <Text style={[styles.statBoxLabel, { color: colors.muted }]}>Credits Won</Text>
            </View>
          </View>
        </View>

        {/* Quick Match Button */}
        <TouchableOpacity
          style={[styles.quickMatchButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Alert.alert("Finding Opponent...", "Matching you with someone at your level!", [
              { text: "Cancel", style: "cancel" },
              { text: "OK", onPress: () => startBattle(MOCK_CHALLENGES[0]) },
            ]);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="flash" size={22} color="#fff" />
          <Text style={styles.quickMatchText}>Quick Match</Text>
          <Text style={styles.quickMatchSub}>Bet 25 credits</Text>
        </TouchableOpacity>

        {/* Battle Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Battle Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesRow}>
              {BATTLE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, { backgroundColor: cat.color + "15", borderColor: cat.color + "40" }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                  <Text style={[styles.categoryChipText, { color: cat.color }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Pending Challenges */}
        {pendingChallenges.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Incoming Challenges ({pendingChallenges.length})
            </Text>
            {pendingChallenges.map((challenge) => (
              <View key={challenge.id} style={[styles.challengeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.challengeTop}>
                  <View style={styles.challengeOpponent}>
                    <Text style={styles.opponentEmoji}>{challenge.opponentEmoji}</Text>
                    <View>
                      <Text style={[styles.opponentName, { color: colors.foreground }]}>{challenge.opponentName}</Text>
                      <Text style={[styles.opponentMeta, { color: colors.muted }]}>
                        {challenge.opponentLevel} • {Math.round(challenge.opponentWinRate * 100)}% WR
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.wagerBadge, { backgroundColor: colors.warning + "15" }]}>
                    <Text style={[styles.wagerText, { color: colors.warning }]}>
                      {challenge.wagerAmount} {challenge.wagerType === "credits" ? "💰" : "🔥"}
                    </Text>
                  </View>
                </View>
                <View style={styles.challengeBottom}>
                  <Text style={[styles.challengeCategory, { color: colors.muted }]}>
                    {challenge.category} • {challenge.language}
                  </Text>
                  <View style={styles.challengeActions}>
                    <TouchableOpacity
                      style={[styles.acceptButton, { backgroundColor: colors.success }]}
                      onPress={() => startBattle(challenge)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.declineButton, { backgroundColor: colors.error + "15" }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.declineText, { color: colors.error }]}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Battle History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Battles</Text>
          {completedChallenges.map((battle) => (
            <View key={battle.id} style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.historyResult, { backgroundColor: battle.result === "win" ? colors.success + "15" : colors.error + "15" }]}>
                <Text style={[styles.historyResultText, { color: battle.result === "win" ? colors.success : colors.error }]}>
                  {battle.result === "win" ? "W" : "L"}
                </Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={[styles.historyOpponent, { color: colors.foreground }]}>
                  {battle.opponentEmoji} {battle.opponentName}
                </Text>
                <Text style={[styles.historyMeta, { color: colors.muted }]}>
                  {battle.myScore}-{battle.opponentScore} • {battle.category}
                </Text>
              </View>
              <Text style={[styles.historyWager, { color: battle.result === "win" ? colors.success : colors.error }]}>
                {battle.result === "win" ? "+" : "-"}{battle.wagerAmount}
                {battle.wagerType === "credits" ? "💰" : "🔥"}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 16, gap: 18, paddingBottom: 100 },
  statsCard: { borderRadius: 16, padding: 16, borderWidth: 0.5, gap: 14 },
  statsTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rankSection: { gap: 2 },
  rankLabel: { fontSize: 11 },
  rankValue: { fontSize: 20, fontWeight: "800" },
  recordSection: { flexDirection: "row", alignItems: "center", gap: 6 },
  recordText: { fontSize: 14, fontWeight: "700" },
  recordDivider: { fontSize: 14 },
  statsGrid: { flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center", gap: 2 },
  statBoxValue: { fontSize: 18, fontWeight: "800" },
  statBoxLabel: { fontSize: 10 },
  quickMatchButton: { borderRadius: 14, padding: 18, alignItems: "center", gap: 4 },
  quickMatchText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  quickMatchSub: { color: "#ffffff80", fontSize: 12 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  categoriesRow: { flexDirection: "row", gap: 8, paddingRight: 16 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5 },
  categoryChipText: { fontSize: 12, fontWeight: "600" },
  challengeCard: { borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 10 },
  challengeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  challengeOpponent: { flexDirection: "row", alignItems: "center", gap: 10 },
  opponentEmoji: { fontSize: 28 },
  opponentName: { fontSize: 15, fontWeight: "600" },
  opponentMeta: { fontSize: 11 },
  wagerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  wagerText: { fontSize: 13, fontWeight: "700" },
  challengeBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  challengeCategory: { fontSize: 12 },
  challengeActions: { flexDirection: "row", gap: 8 },
  acceptButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  declineButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  declineText: { fontSize: 13, fontWeight: "600" },
  historyCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 0.5, gap: 10 },
  historyResult: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  historyResultText: { fontSize: 14, fontWeight: "800" },
  historyInfo: { flex: 1, gap: 2 },
  historyOpponent: { fontSize: 14, fontWeight: "600" },
  historyMeta: { fontSize: 11 },
  historyWager: { fontSize: 14, fontWeight: "700" },
  // Battle view
  battleContainer: { flex: 1, padding: 20, justifyContent: "center", gap: 20 },
  battleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  battlePlayer: { alignItems: "center", gap: 4 },
  battlePlayerName: { fontSize: 14, fontWeight: "600" },
  battleScore: { fontSize: 32, fontWeight: "900" },
  battleVs: { alignItems: "center" },
  battleRound: { fontSize: 11 },
  vsText: { fontSize: 16, fontWeight: "800" },
  timerBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  timerFill: { height: "100%", borderRadius: 3 },
  timerText: { textAlign: "center", fontSize: 18, fontWeight: "800" },
  questionSection: { alignItems: "center", gap: 12 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: "600" },
  questionText: { fontSize: 18, fontWeight: "700", textAlign: "center", lineHeight: 26 },
  optionsContainer: { gap: 10 },
  optionButton: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  optionLetter: { fontSize: 14, fontWeight: "700", width: 24 },
  optionText: { fontSize: 15, flex: 1 },
  // Result
  resultContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 20 },
  resultEmoji: { fontSize: 64 },
  resultTitle: { fontSize: 28, fontWeight: "900" },
  resultScores: { flexDirection: "row", alignItems: "center", gap: 20 },
  resultScoreItem: { alignItems: "center", gap: 4 },
  resultScoreLabel: { fontSize: 13 },
  resultScoreValue: { fontSize: 36, fontWeight: "900" },
  resultVs: { fontSize: 20 },
  wagerResult: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  wagerResultText: { fontSize: 18, fontWeight: "700" },
  doneButton: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  doneButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
