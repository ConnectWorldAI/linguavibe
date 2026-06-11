/**
 * Language Battles - 1v1 Real-Time Competitions
 * Multiple game modes: Vocabulary Speed, Pronunciation Duel, Translation Race,
 * Listening Challenge, Grammar Blitz. Plus tournaments and leaderboards.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface BattleMode {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: string;
  xpReward: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  wins: number;
  winRate: string;
  streak: number;
  language: string;
  flag: string;
}

interface Tournament {
  id: string;
  name: string;
  language: string;
  flag: string;
  participants: number;
  maxParticipants: number;
  prize: string;
  startsIn: string;
  status: "upcoming" | "live" | "completed";
  mode: string;
}

interface BattleQuestion {
  id: string;
  type: "vocab" | "translation" | "listening" | "grammar" | "pronunciation";
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

// ─── DATA ───────────────────────────────────────────────────────────────────

const BATTLE_MODES: BattleMode[] = [
  { id: "vocab-speed", name: "Vocab Speed", icon: "⚡", description: "First to answer wins! Race to match words with meanings.", color: "#F59E0B", difficulty: "Easy", duration: "2 min", xpReward: 50 },
  { id: "pronunciation-duel", name: "Pronunciation Duel", icon: "🎤", description: "Say it better! AI judges whose pronunciation is more accurate.", color: "#EF4444", difficulty: "Medium", duration: "3 min", xpReward: 75 },
  { id: "translation-race", name: "Translation Race", icon: "🏎️", description: "Translate sentences faster than your opponent. Speed + accuracy.", color: "#3B82F6", difficulty: "Medium", duration: "3 min", xpReward: 75 },
  { id: "listening-challenge", name: "Listening Challenge", icon: "👂", description: "Listen to native audio and answer first. No replays!", color: "#8B5CF6", difficulty: "Hard", duration: "4 min", xpReward: 100 },
  { id: "grammar-blitz", name: "Grammar Blitz", icon: "📝", description: "Fill in the blanks, fix errors, conjugate verbs — fastest wins.", color: "#10B981", difficulty: "Medium", duration: "3 min", xpReward: 75 },
  { id: "slang-showdown", name: "Slang Showdown", icon: "🔥", description: "Know your street talk? Match slang to meanings before your opponent.", color: "#EC4899", difficulty: "Hard", duration: "2 min", xpReward: 100 },
];

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "María G.", avatar: "👩‍🦰", xp: 12450, wins: 89, winRate: "78%", streak: 12, language: "Spanish", flag: "🇪🇸" },
  { rank: 2, name: "Kenji T.", avatar: "👨", xp: 11200, wins: 82, winRate: "75%", streak: 8, language: "Japanese", flag: "🇯🇵" },
  { rank: 3, name: "Sophie L.", avatar: "👩", xp: 10800, wins: 76, winRate: "72%", streak: 15, language: "French", flag: "🇫🇷" },
  { rank: 4, name: "Ahmed K.", avatar: "🧔", xp: 9900, wins: 71, winRate: "70%", streak: 6, language: "Arabic", flag: "🇪🇬" },
  { rank: 5, name: "You", avatar: "🎯", xp: 8500, wins: 62, winRate: "68%", streak: 4, language: "Spanish", flag: "🇩🇴" },
  { rank: 6, name: "Park J.", avatar: "👨‍🦱", xp: 8200, wins: 58, winRate: "66%", streak: 3, language: "Korean", flag: "🇰🇷" },
  { rank: 7, name: "Lucas M.", avatar: "👦", xp: 7800, wins: 55, winRate: "64%", streak: 7, language: "Portuguese", flag: "🇧🇷" },
];

const TOURNAMENTS: Tournament[] = [
  { id: "t1", name: "Spanish Sprint Championship", language: "Spanish", flag: "🇪🇸", participants: 128, maxParticipants: 256, prize: "1000 XP + Gold Badge", startsIn: "2h 30m", status: "upcoming", mode: "Vocab Speed" },
  { id: "t2", name: "French Pronunciation Cup", language: "French", flag: "🇫🇷", participants: 64, maxParticipants: 64, prize: "Premium Week + 500 XP", startsIn: "LIVE", status: "live", mode: "Pronunciation Duel" },
  { id: "t3", name: "Global Translation Derby", language: "All", flag: "🌍", participants: 512, maxParticipants: 512, prize: "2000 XP + Diamond Badge", startsIn: "Tomorrow", status: "upcoming", mode: "Translation Race" },
];

const SAMPLE_QUESTIONS: BattleQuestion[] = [
  { id: "q1", type: "vocab", question: "What does 'mariposa' mean?", options: ["Butterfly", "Flower", "Rainbow", "Bird"], correctIndex: 0, timeLimit: 10 },
  { id: "q2", type: "translation", question: "Translate: 'I want to go to the beach'", options: ["Quiero ir a la playa", "Quiero ir al parque", "Quiero ir a la tienda", "Quiero ir al cine"], correctIndex: 0, timeLimit: 15 },
  { id: "q3", type: "grammar", question: "Fill in: Ella ___ muy inteligente", options: ["es", "está", "ser", "son"], correctIndex: 0, timeLimit: 10 },
  { id: "q4", type: "vocab", question: "What does '素晴らしい' mean?", options: ["Wonderful", "Terrible", "Normal", "Boring"], correctIndex: 0, timeLimit: 10 },
  { id: "q5", type: "vocab" as any, question: "Dominican: What does 'vaina' mean?", options: ["Thing/stuff", "Banana", "Car", "Money"], correctIndex: 0, timeLimit: 8 },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function LanguageBattlesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"modes" | "battle" | "leaderboard" | "tournaments">("modes");
  const [selectedMode, setSelectedMode] = useState<BattleMode | null>(null);
  const [matchmaking, setMatchmaking] = useState(false);
  const [inBattle, setInBattle] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [battleComplete, setBattleComplete] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Matchmaking animation
  useEffect(() => {
    if (matchmaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      // Simulate finding opponent
      const timer = setTimeout(() => {
        setMatchmaking(false);
        setInBattle(true);
        setCurrentQuestion(0);
        setPlayerScore(0);
        setOpponentScore(0);
        setCombo(0);
        setTimeLeft(10);
        setBattleComplete(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [matchmaking]);

  // Battle timer
  useEffect(() => {
    if (inBattle && !battleComplete && selectedAnswer === null) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up — opponent scores
            setOpponentScore((s) => s + 100);
            setCombo(0);
            nextQuestion();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [inBattle, battleComplete, selectedAnswer, currentQuestion]);

  const startMatchmaking = (mode: BattleMode) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to dedicated pronunciation duel lobby for that mode
    if (mode.id === "pronunciation-duel") {
      router.push("/pronunciation-duel-lobby" as any);
      return;
    }
    setSelectedMode(mode);
    setMatchmaking(true);
    setActiveTab("battle");
  };

  const answerQuestion = (index: number) => {
    if (selectedAnswer !== null) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(index);

    const question = SAMPLE_QUESTIONS[currentQuestion];
    if (index === question.correctIndex) {
      const timeBonus = timeLeft * 10;
      const comboBonus = combo * 25;
      const points = 100 + timeBonus + comboBonus;
      setPlayerScore((s) => s + points);
      setCombo((c) => c + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setCombo(0);
      setOpponentScore((s) => s + 100 + Math.floor(Math.random() * 50));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => nextQuestion(), 1500);
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    if (currentQuestion >= SAMPLE_QUESTIONS.length - 1) {
      setBattleComplete(true);
    } else {
      setCurrentQuestion((q) => q + 1);
      setTimeLeft(10);
    }
  };

  // ─── MODES VIEW ───────────────────────────────────────────────────────────

  const renderModes = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Stats Banner */}
      <View style={[styles.statsBanner, { backgroundColor: colors.primary + "10" }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>62</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Wins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>68%</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Win Rate</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>4🔥</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>#5</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Rank</Text>
        </View>
      </View>

      {/* Quick Match */}
      <TouchableOpacity
        style={[styles.quickMatchBtn, { backgroundColor: colors.primary }]}
        onPress={() => startMatchmaking(BATTLE_MODES[0])}
        activeOpacity={0.8}
      >
        <Ionicons name="flash" size={24} color="#FFF" />
        <Text style={styles.quickMatchText}>Quick Match</Text>
        <Text style={styles.quickMatchSub}>Random mode, random opponent</Text>
      </TouchableOpacity>

      {/* Battle Modes */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Battle Modes</Text>
      {BATTLE_MODES.map((mode) => (
        <TouchableOpacity
          key={mode.id}
          style={[styles.modeCard, { backgroundColor: colors.surface }]}
          onPress={() => startMatchmaking(mode)}
          activeOpacity={0.7}
        >
          <View style={[styles.modeIconBg, { backgroundColor: mode.color + "20" }]}>
            <Text style={styles.modeIcon}>{mode.icon}</Text>
          </View>
          <View style={styles.modeInfo}>
            <Text style={[styles.modeName, { color: colors.foreground }]}>{mode.name}</Text>
            <Text style={[styles.modeDesc, { color: colors.muted }]}>{mode.description}</Text>
            <View style={styles.modeMeta}>
              <Text style={[styles.modeDifficulty, { color: mode.color }]}>{mode.difficulty}</Text>
              <Text style={[styles.modeDuration, { color: colors.muted }]}>⏱ {mode.duration}</Text>
              <Text style={[styles.modeXP, { color: "#F59E0B" }]}>+{mode.xpReward} XP</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>
      ))}

      {/* Active Tournaments */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>🏆 Tournaments</Text>
      {TOURNAMENTS.map((t) => (
        <View key={t.id} style={[styles.tournamentCard, { backgroundColor: colors.surface }]}>
          <View style={styles.tournamentHeader}>
            <Text style={styles.tournamentFlag}>{t.flag}</Text>
            <View style={styles.tournamentInfo}>
              <Text style={[styles.tournamentName, { color: colors.foreground }]}>{t.name}</Text>
              <Text style={[styles.tournamentMode, { color: colors.muted }]}>{t.mode}</Text>
            </View>
            {t.status === "live" && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          <View style={styles.tournamentMeta}>
            <Text style={[styles.tournamentParticipants, { color: colors.muted }]}>
              👥 {t.participants}/{t.maxParticipants}
            </Text>
            <Text style={[styles.tournamentPrize, { color: "#F59E0B" }]}>🏆 {t.prize}</Text>
            <Text style={[styles.tournamentTime, { color: t.status === "live" ? "#EF4444" : colors.primary }]}>
              {t.startsIn}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: t.status === "live" ? "#EF4444" : colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.joinBtnText}>{t.status === "live" ? "Watch Live" : "Join Tournament"}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  // ─── BATTLE VIEW ──────────────────────────────────────────────────────────

  const renderBattle = () => {
    if (matchmaking) {
      return (
        <View style={styles.matchmakingContainer}>
          <Animated.View style={[styles.matchmakingPulse, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.matchmakingIcon}>⚔️</Text>
          </Animated.View>
          <Text style={[styles.matchmakingTitle, { color: colors.foreground }]}>Finding Opponent...</Text>
          <Text style={[styles.matchmakingMode, { color: colors.primary }]}>{selectedMode?.name}</Text>
          <Text style={[styles.matchmakingSub, { color: colors.muted }]}>Matching you with someone at your level</Text>
          <View style={styles.matchmakingDots}>
            <Animated.View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Animated.View style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.6 }]} />
            <Animated.View style={[styles.dot, { backgroundColor: colors.primary, opacity: 0.3 }]} />
          </View>
        </View>
      );
    }

    if (battleComplete) {
      const won = playerScore > opponentScore;
      return (
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>{won ? "🏆" : "😤"}</Text>
          <Text style={[styles.resultTitle, { color: won ? "#10B981" : "#EF4444" }]}>
            {won ? "VICTORY!" : "DEFEAT"}
          </Text>
          <View style={[styles.resultScores, { backgroundColor: colors.surface }]}>
            <View style={styles.resultPlayer}>
              <Text style={styles.resultAvatar}>🎯</Text>
              <Text style={[styles.resultName, { color: colors.foreground }]}>You</Text>
              <Text style={[styles.resultScore, { color: colors.primary }]}>{playerScore}</Text>
            </View>
            <Text style={[styles.resultVs, { color: colors.muted }]}>VS</Text>
            <View style={styles.resultPlayer}>
              <Text style={styles.resultAvatar}>👩‍🦰</Text>
              <Text style={[styles.resultName, { color: colors.foreground }]}>María G.</Text>
              <Text style={[styles.resultScore, { color: "#EF4444" }]}>{opponentScore}</Text>
            </View>
          </View>
          <View style={styles.resultRewards}>
            <Text style={[styles.rewardText, { color: "#F59E0B" }]}>+{won ? 75 : 25} XP earned</Text>
            {combo > 2 && <Text style={[styles.rewardText, { color: "#8B5CF6" }]}>🔥 Best combo: {combo}x</Text>}
          </View>
          <TouchableOpacity
            style={[styles.playAgainBtn, { backgroundColor: colors.primary }]}
            onPress={() => { setInBattle(false); setActiveTab("modes"); }}
            activeOpacity={0.8}
          >
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (inBattle) {
      const question = SAMPLE_QUESTIONS[currentQuestion];
      return (
        <Animated.View style={[styles.battleContainer, { transform: [{ translateX: shakeAnim }] }]}>
          {/* Score Header */}
          <View style={styles.battleHeader}>
            <View style={styles.battlePlayer}>
              <Text style={styles.battleAvatar}>🎯</Text>
              <Text style={[styles.battleScore, { color: colors.primary }]}>{playerScore}</Text>
            </View>
            <View style={styles.battleTimer}>
              <Text style={[styles.timerText, { color: timeLeft <= 3 ? "#EF4444" : colors.foreground }]}>{timeLeft}</Text>
              <Text style={[styles.timerLabel, { color: colors.muted }]}>sec</Text>
            </View>
            <View style={styles.battlePlayer}>
              <Text style={styles.battleAvatar}>👩‍🦰</Text>
              <Text style={[styles.battleScore, { color: "#EF4444" }]}>{opponentScore}</Text>
            </View>
          </View>

          {/* Combo */}
          {combo > 0 && (
            <View style={[styles.comboBadge, { backgroundColor: "#F59E0B20" }]}>
              <Text style={styles.comboText}>🔥 {combo}x Combo!</Text>
            </View>
          )}

          {/* Progress */}
          <View style={styles.battleProgress}>
            <Text style={[styles.progressLabel, { color: colors.muted }]}>
              Question {currentQuestion + 1}/{SAMPLE_QUESTIONS.length}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / SAMPLE_QUESTIONS.length) * 100}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>

          {/* Question */}
          <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.questionType, { color: colors.primary }]}>
              {question.type === "vocab" ? "⚡ Vocabulary" : question.type === "translation" ? "🏎️ Translation" : question.type === "grammar" ? "📝 Grammar" : "🔥 Slang"}
            </Text>
            <Text style={[styles.questionText, { color: colors.foreground }]}>{question.question}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsGrid}>
            {question.options.map((option, index) => {
              let bgColor = colors.surface;
              let borderColor = colors.border;
              if (selectedAnswer !== null) {
                if (index === question.correctIndex) {
                  bgColor = "#10B98120";
                  borderColor = "#10B981";
                } else if (index === selectedAnswer && index !== question.correctIndex) {
                  bgColor = "#EF444420";
                  borderColor = "#EF4444";
                }
              }
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
                  onPress={() => answerQuestion(index)}
                  activeOpacity={0.7}
                  disabled={selectedAnswer !== null}
                >
                  <Text style={[styles.optionLetter, { color: colors.primary }]}>{["A", "B", "C", "D"][index]}</Text>
                  <Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      );
    }

    return renderModes();
  };

  // ─── LEADERBOARD VIEW ─────────────────────────────────────────────────────

  const renderLeaderboard = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Top 3 Podium */}
      <View style={styles.podium}>
        {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((entry, i) => (
          <View key={entry.rank} style={[styles.podiumSpot, i === 1 && styles.podiumFirst]}>
            <Text style={styles.podiumAvatar}>{entry.avatar}</Text>
            <Text style={[styles.podiumName, { color: colors.foreground }]}>{entry.name}</Text>
            <Text style={[styles.podiumXP, { color: colors.primary }]}>{entry.xp.toLocaleString()} XP</Text>
            <View style={[styles.podiumRank, { backgroundColor: i === 1 ? "#F59E0B" : i === 0 ? "#C0C0C0" : "#CD7F32" }]}>
              <Text style={styles.podiumRankText}>#{entry.rank}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Full List */}
      {LEADERBOARD.slice(3).map((entry) => (
        <View key={entry.rank} style={[styles.leaderRow, { backgroundColor: entry.name === "You" ? colors.primary + "10" : colors.surface }]}>
          <Text style={[styles.leaderRank, { color: colors.muted }]}>#{entry.rank}</Text>
          <Text style={styles.leaderAvatar}>{entry.avatar}</Text>
          <View style={styles.leaderInfo}>
            <Text style={[styles.leaderName, { color: colors.foreground }]}>{entry.name}</Text>
            <Text style={[styles.leaderStats, { color: colors.muted }]}>{entry.flag} {entry.wins}W • {entry.winRate} • {entry.streak}🔥</Text>
          </View>
          <Text style={[styles.leaderXP, { color: colors.primary }]}>{entry.xp.toLocaleString()}</Text>
        </View>
      ))}
    </ScrollView>
  );

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (inBattle || matchmaking) { setInBattle(false); setMatchmaking(false); setActiveTab("modes"); }
          else router.back();
        }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>⚔️ Language Battles</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Tab Bar (hidden during battle) */}
      {!inBattle && !matchmaking && (
        <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
          {[
            { id: "modes" as const, label: "Modes", icon: "⚔️" },
            { id: "leaderboard" as const, label: "Rankings", icon: "🏆" },
            { id: "tournaments" as const, label: "Tournaments", icon: "🎖️" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab.id ? colors.primary : colors.muted }]}>
                {tab.icon} {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content */}
      {activeTab === "modes" && !inBattle && !matchmaking && renderModes()}
      {(activeTab === "battle" || inBattle || matchmaking) && renderBattle()}
      {activeTab === "leaderboard" && renderLeaderboard()}
      {activeTab === "tournaments" && renderModes()}
    </ScreenContainer>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  tabBar: { flexDirection: "row", paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 13, fontWeight: "600" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  // Stats
  statsBanner: { flexDirection: "row", borderRadius: 12, padding: 16, marginBottom: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 10, marginTop: 2 },
  // Quick Match
  quickMatchBtn: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 20 },
  quickMatchText: { color: "#FFF", fontSize: 18, fontWeight: "800", marginTop: 8 },
  quickMatchSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  // Mode Cards
  modeCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
  modeIconBg: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  modeIcon: { fontSize: 22 },
  modeInfo: { flex: 1 },
  modeName: { fontSize: 15, fontWeight: "700" },
  modeDesc: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  modeMeta: { flexDirection: "row", gap: 8, marginTop: 6 },
  modeDifficulty: { fontSize: 10, fontWeight: "700" },
  modeDuration: { fontSize: 10 },
  modeXP: { fontSize: 10, fontWeight: "700" },
  // Tournaments
  tournamentCard: { borderRadius: 12, padding: 14, marginBottom: 10 },
  tournamentHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  tournamentFlag: { fontSize: 24 },
  tournamentInfo: { flex: 1 },
  tournamentName: { fontSize: 14, fontWeight: "700" },
  tournamentMode: { fontSize: 11, marginTop: 2 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EF444420", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" },
  liveText: { color: "#EF4444", fontSize: 10, fontWeight: "800" },
  tournamentMeta: { flexDirection: "row", gap: 12, marginTop: 10 },
  tournamentParticipants: { fontSize: 11 },
  tournamentPrize: { fontSize: 11, fontWeight: "600" },
  tournamentTime: { fontSize: 11, fontWeight: "700" },
  joinBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  joinBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  // Matchmaking
  matchmakingContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  matchmakingPulse: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#3B82F620", justifyContent: "center", alignItems: "center" },
  matchmakingIcon: { fontSize: 40 },
  matchmakingTitle: { fontSize: 22, fontWeight: "800", marginTop: 20 },
  matchmakingMode: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  matchmakingSub: { fontSize: 12, marginTop: 8 },
  matchmakingDots: { flexDirection: "row", gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  // Battle
  battleContainer: { flex: 1, padding: 16 },
  battleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  battlePlayer: { alignItems: "center" },
  battleAvatar: { fontSize: 28 },
  battleScore: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  battleTimer: { alignItems: "center" },
  timerText: { fontSize: 32, fontWeight: "900" },
  timerLabel: { fontSize: 10 },
  comboBadge: { alignSelf: "center", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, marginBottom: 8 },
  comboText: { color: "#F59E0B", fontSize: 14, fontWeight: "700" },
  battleProgress: { marginBottom: 16 },
  progressLabel: { fontSize: 11, marginBottom: 4 },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  questionCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  questionType: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  questionText: { fontSize: 18, fontWeight: "700", lineHeight: 26 },
  optionsGrid: { gap: 10 },
  optionBtn: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, borderWidth: 1.5, gap: 12 },
  optionLetter: { fontSize: 14, fontWeight: "800", width: 24 },
  optionText: { fontSize: 15, fontWeight: "600", flex: 1 },
  // Results
  resultContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  resultEmoji: { fontSize: 60 },
  resultTitle: { fontSize: 28, fontWeight: "900", marginTop: 12 },
  resultScores: { flexDirection: "row", alignItems: "center", gap: 20, borderRadius: 16, padding: 20, marginTop: 20, width: "100%" },
  resultPlayer: { flex: 1, alignItems: "center" },
  resultAvatar: { fontSize: 32 },
  resultName: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  resultScore: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  resultVs: { fontSize: 16, fontWeight: "800" },
  resultRewards: { marginTop: 16, alignItems: "center", gap: 4 },
  rewardText: { fontSize: 14, fontWeight: "700" },
  playAgainBtn: { marginTop: 24, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 24 },
  playAgainText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  // Leaderboard
  podium: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 12, marginBottom: 24, paddingTop: 20 },
  podiumSpot: { alignItems: "center", width: 90 },
  podiumFirst: { marginBottom: 20 },
  podiumAvatar: { fontSize: 32 },
  podiumName: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  podiumXP: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  podiumRank: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginTop: 6 },
  podiumRankText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  leaderRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 6, gap: 10 },
  leaderRank: { fontSize: 13, fontWeight: "700", width: 28 },
  leaderAvatar: { fontSize: 24 },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 14, fontWeight: "600" },
  leaderStats: { fontSize: 10, marginTop: 2 },
  leaderXP: { fontSize: 14, fontWeight: "700" },
});
