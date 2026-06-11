/**
 * Friend Challenges Screen
 *
 * Competitive language learning with friends or AI opponents.
 * Features: challenge creation, active challenge list, vocab duel gameplay,
 * challenge stats, and history.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  type Challenge,
  type ChallengeType,
  type ChallengeStats,
  CHALLENGE_TEMPLATES,
  createChallenge,
  getActiveChallenges,
  getChallengeStats,
  getChallengeHistory,
  answerChallengeQuestion,
  completeChallenge,
} from "@/lib/friend-challenges";
import { FeatureGateBanner } from "@/components/feature-gate-banner";

type ScreenView = "main" | "create" | "duel" | "stats";

export default function FriendChallengesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [view, setView] = useState<ScreenView>("main");
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [history, setHistory] = useState<Challenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [duelScore, setDuelScore] = useState(0);
  const [duelComplete, setDuelComplete] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [active, s, h] = await Promise.all([
      getActiveChallenges(),
      getChallengeStats(),
      getChallengeHistory(),
    ]);
    setActiveChallenges(active);
    setStats(s);
    setHistory(h);
  };

  const handleCreateChallenge = async (type: ChallengeType) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const challenge = await createChallenge({
      type,
      language: "Spanish",
      difficulty: "medium",
      opponentName: "AI Opponent",
      opponentAvatar: "🤖",
    });
    await loadData();
    if (type === "vocab_duel") {
      setCurrentChallenge(challenge);
      setCurrentQIndex(0);
      setDuelScore(0);
      setDuelComplete(false);
      setView("duel");
    } else {
      setView("main");
    }
  };

  const handleDuelAnswer = async (answer: string) => {
    if (!currentChallenge || selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    const q = currentChallenge.questions?.[currentQIndex];
    if (!q) return;

    const startTime = Date.now();
    const result = await answerChallengeQuestion(currentChallenge.id, q.id, answer, 3000);
    setAnswerCorrect(result.correct);
    setDuelScore((prev) => prev + result.pointsEarned);

    if (Platform.OS !== "web") {
      if (result.correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    Animated.timing(progressAnim, {
      toValue: (currentQIndex + 1) / (currentChallenge.questions?.length || 1),
      duration: 300,
      useNativeDriver: false,
    }).start();

    setTimeout(async () => {
      const nextIdx = currentQIndex + 1;
      if (nextIdx >= (currentChallenge.questions?.length || 0)) {
        const completed = await completeChallenge(currentChallenge.id);
        setCurrentChallenge(completed);
        setDuelComplete(true);
        await loadData();
      } else {
        setCurrentQIndex(nextIdx);
        setSelectedAnswer(null);
        setAnswerCorrect(null);
      }
    }, 1000);
  };

  // ─── Duel View ─────────────────────────────────────────────────────────────
  if (view === "duel" && currentChallenge) {
    if (duelComplete) {
      const won = currentChallenge.winnerId === "me";
      return (
        <ScreenContainer>
          <View style={[s.container, { backgroundColor: colors.background }]}>
            <View style={s.duelCompleteContainer}>
              <Text style={{ fontSize: 64 }}>{won ? "🏆" : "💪"}</Text>
              <Text style={[s.duelCompleteTitle, { color: colors.foreground }]}>
                {won ? "You Won!" : "Good Try!"}
              </Text>
              <View style={s.duelScoreRow}>
                <View style={s.duelScoreBox}>
                  <Text style={s.duelScoreAvatar}>{currentChallenge.creator.avatar}</Text>
                  <Text style={[s.duelScoreName, { color: colors.foreground }]}>You</Text>
                  <Text style={[s.duelScoreValue, { color: won ? colors.success : colors.muted }]}>
                    {currentChallenge.creator.score}
                  </Text>
                </View>
                <Text style={[s.vsText, { color: colors.muted }]}>VS</Text>
                <View style={s.duelScoreBox}>
                  <Text style={s.duelScoreAvatar}>{currentChallenge.opponent.avatar}</Text>
                  <Text style={[s.duelScoreName, { color: colors.foreground }]}>{currentChallenge.opponent.name}</Text>
                  <Text style={[s.duelScoreValue, { color: !won ? colors.success : colors.muted }]}>
                    {currentChallenge.opponent.score}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[s.doneBtn, { backgroundColor: colors.primary }]}
                onPress={() => { setView("main"); setDuelComplete(false); }}
              >
                <Text style={s.doneBtnText}>Back to Challenges</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScreenContainer>
      );
    }

    const question = currentChallenge.questions?.[currentQIndex];
    if (!question) return null;

    return (
      <ScreenContainer>
        <View style={[s.container, { backgroundColor: colors.background }]}>
          {/* Duel Header */}
          <View style={s.duelHeader}>
            <TouchableOpacity onPress={() => setView("main")} style={s.closeBtn}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.duelProgress, { color: colors.muted }]}>
              {currentQIndex + 1} / {currentChallenge.questions?.length}
            </Text>
            <Text style={[s.duelPointsLive, { color: colors.primary }]}>{duelScore} pts</Text>
          </View>

          {/* Progress Bar */}
          <View style={[s.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View style={[s.progressFill, { backgroundColor: colors.primary, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
          </View>

          {/* Question */}
          <View style={s.questionContainer}>
            <Text style={[s.questionLabel, { color: colors.muted }]}>Translate to Spanish</Text>
            <Text style={[s.questionText, { color: colors.foreground }]}>{question.prompt}</Text>
          </View>

          {/* Options */}
          <View style={s.optionsContainer}>
            {question.options?.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === question.correctAnswer;
              let bgColor = colors.surface;
              let borderColor = colors.border;
              if (selectedAnswer !== null) {
                if (isCorrect) { bgColor = colors.success + "20"; borderColor = colors.success; }
                else if (isSelected && !isCorrect) { bgColor = colors.error + "20"; borderColor = colors.error; }
              }
              return (
                <TouchableOpacity
                  key={idx}
                  style={[s.optionBtn, { backgroundColor: bgColor, borderColor }]}
                  onPress={() => handleDuelAnswer(option)}
                  disabled={selectedAnswer !== null}
                  activeOpacity={0.7}
                >
                  <Text style={[s.optionText, { color: colors.foreground }]}>{option}</Text>
                  {selectedAnswer !== null && isCorrect && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  )}
                  {selectedAnswer !== null && isSelected && !isCorrect && (
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Create Challenge View ─────────────────────────────────────────────────
  if (view === "create") {
    return (
      <ScreenContainer>
        <View style={[s.container, { backgroundColor: colors.background }]}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setView("main")} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>New Challenge</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView contentContainerStyle={s.createContent}>
            <Text style={[s.sectionTitle, { color: colors.muted }]}>Choose Challenge Type</Text>
            {(Object.entries(CHALLENGE_TEMPLATES) as [ChallengeType, typeof CHALLENGE_TEMPLATES[ChallengeType]][]).map(([type, template]) => (
              <TouchableOpacity
                key={type}
                style={[s.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleCreateChallenge(type)}
                activeOpacity={0.7}
              >
                <View style={[s.templateIcon, { backgroundColor: template.color + "20" }]}>
                  <Ionicons name={template.icon as any} size={24} color={template.color} />
                </View>
                <View style={s.templateInfo}>
                  <Text style={[s.templateTitle, { color: colors.foreground }]}>{template.title}</Text>
                  <Text style={[s.templateDesc, { color: colors.muted }]}>{template.description}</Text>
                  <Text style={[s.templateDuration, { color: colors.primary }]}>
                    {template.duration < 24 ? `${template.duration}h` : `${Math.round(template.duration / 24)}d`} to complete
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Stats View ────────────────────────────────────────────────────────────
  if (view === "stats" && stats) {
    return (
      <ScreenContainer>
        <View style={[s.container, { backgroundColor: colors.background }]}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setView("main")} style={s.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Challenge Stats</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView contentContainerStyle={s.statsContent}>
            {/* Win Rate */}
            <View style={[s.statsHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 48 }}>🏆</Text>
              <Text style={[s.statsWinRate, { color: colors.foreground }]}>{stats.winRate}%</Text>
              <Text style={[s.statsWinRateLabel, { color: colors.muted }]}>Win Rate</Text>
            </View>

            {/* Stats Grid */}
            <View style={s.statsGrid}>
              {[
                { label: "Total", value: stats.totalChallenges.toString(), icon: "trophy", color: colors.primary },
                { label: "Wins", value: stats.wins.toString(), icon: "checkmark-circle", color: colors.success },
                { label: "Losses", value: stats.losses.toString(), icon: "close-circle", color: colors.error },
                { label: "Win Streak", value: stats.bestWinStreak.toString(), icon: "flame", color: "#F59E0B" },
                { label: "Points", value: stats.totalPointsEarned.toLocaleString(), icon: "star", color: "#8B5CF6" },
                { label: "Draws", value: stats.draws.toString(), icon: "remove-circle", color: colors.muted },
              ].map((item, idx) => (
                <View key={idx} style={[s.statsGridItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                  <Text style={[s.statsGridValue, { color: colors.foreground }]}>{item.value}</Text>
                  <Text style={[s.statsGridLabel, { color: colors.muted }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Recent History */}
            <Text style={[s.sectionTitle, { color: colors.muted }]}>Recent Challenges</Text>
            {history.slice(0, 10).map((c) => (
              <View key={c.id} style={[s.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons
                  name={c.winnerId === "me" ? "trophy" : "close-circle"}
                  size={18}
                  color={c.winnerId === "me" ? colors.success : colors.error}
                />
                <View style={s.historyInfo}>
                  <Text style={[s.historyTitle, { color: colors.foreground }]}>{c.title}</Text>
                  <Text style={[s.historyMeta, { color: colors.muted }]}>
                    vs {c.opponent.name} • {c.creator.score} - {c.opponent.score}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Main View ─────────────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Challenges</Text>
          <TouchableOpacity onPress={() => setView("stats")} style={s.statsBtn}>
            <Ionicons name="stats-chart" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.mainContent}>
          <FeatureGateBanner feature="friend_challenges" />

          {/* Quick Stats Banner */}
          {stats && (
            <View style={[s.quickStats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={s.quickStatItem}>
                <Text style={[s.quickStatValue, { color: colors.foreground }]}>{stats.wins}</Text>
                <Text style={[s.quickStatLabel, { color: colors.muted }]}>Wins</Text>
              </View>
              <View style={[s.quickStatDivider, { backgroundColor: colors.border }]} />
              <View style={s.quickStatItem}>
                <Text style={[s.quickStatValue, { color: colors.foreground }]}>{stats.currentWinStreak}</Text>
                <Text style={[s.quickStatLabel, { color: colors.muted }]}>Streak</Text>
              </View>
              <View style={[s.quickStatDivider, { backgroundColor: colors.border }]} />
              <View style={s.quickStatItem}>
                <Text style={[s.quickStatValue, { color: colors.foreground }]}>{stats.winRate}%</Text>
                <Text style={[s.quickStatLabel, { color: colors.muted }]}>Win Rate</Text>
              </View>
            </View>
          )}

          {/* New Challenge Button */}
          <TouchableOpacity
            style={[s.newChallengeBtn, { backgroundColor: colors.primary }]}
            onPress={() => setView("create")}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={22} color="#FFF" />
            <Text style={s.newChallengeBtnText}>New Challenge</Text>
          </TouchableOpacity>

          {/* Active Challenges */}
          <Text style={[s.sectionTitle, { color: colors.muted }]}>Active Challenges</Text>
          {activeChallenges.length === 0 ? (
            <View style={[s.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 40 }}>⚔️</Text>
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No Active Challenges</Text>
              <Text style={[s.emptyDesc, { color: colors.muted }]}>Start a challenge to compete with friends!</Text>
            </View>
          ) : (
            activeChallenges.map((c) => {
              const template = CHALLENGE_TEMPLATES[c.type];
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[s.challengeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    if (c.type === "vocab_duel" && c.questions) {
                      setCurrentChallenge(c);
                      setCurrentQIndex(0);
                      setDuelScore(c.creator.score);
                      setDuelComplete(false);
                      setSelectedAnswer(null);
                      setAnswerCorrect(null);
                      progressAnim.setValue(0);
                      setView("duel");
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={s.challengeTop}>
                    <View style={[s.challengeIcon, { backgroundColor: template.color + "20" }]}>
                      <Ionicons name={template.icon as any} size={20} color={template.color} />
                    </View>
                    <View style={s.challengeInfo}>
                      <Text style={[s.challengeTitle, { color: colors.foreground }]}>{c.title}</Text>
                      <Text style={[s.challengeMeta, { color: colors.muted }]}>
                        vs {c.opponent.name} • {c.language}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </View>
                  <View style={s.challengeScoreRow}>
                    <Text style={[s.challengeScoreLabel, { color: colors.muted }]}>
                      You: <Text style={{ color: colors.foreground, fontWeight: "700" }}>{c.creator.score}</Text>
                    </Text>
                    <Text style={[s.challengeScoreLabel, { color: colors.muted }]}>
                      {c.opponent.name}: <Text style={{ color: colors.foreground, fontWeight: "700" }}>{c.opponent.score}</Text>
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  statsBtn: { padding: 4 },
  closeBtn: { padding: 4 },
  mainContent: { padding: 16, paddingBottom: 100 },
  // Quick Stats
  quickStats: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  quickStatItem: { flex: 1, alignItems: "center" },
  quickStatValue: { fontSize: 22, fontWeight: "800" },
  quickStatLabel: { fontSize: 11, marginTop: 2 },
  quickStatDivider: { width: 1, marginVertical: 4 },
  // New Challenge
  newChallengeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 20 },
  newChallengeBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  // Section
  sectionTitle: { fontSize: 13, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10, marginTop: 4 },
  // Challenge Card
  challengeCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  challengeTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  challengeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  challengeInfo: { flex: 1, marginLeft: 12 },
  challengeTitle: { fontSize: 15, fontWeight: "700" },
  challengeMeta: { fontSize: 12, marginTop: 2 },
  challengeScoreRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "rgba(128,128,128,0.2)" },
  challengeScoreLabel: { fontSize: 12 },
  // Empty State
  emptyState: { alignItems: "center", padding: 32, borderRadius: 14, borderWidth: 1 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyDesc: { fontSize: 13, textAlign: "center", marginTop: 4 },
  // Create View
  createContent: { padding: 16, paddingBottom: 100 },
  templateCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  templateIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  templateInfo: { flex: 1, marginLeft: 12 },
  templateTitle: { fontSize: 15, fontWeight: "700" },
  templateDesc: { fontSize: 12, marginTop: 2 },
  templateDuration: { fontSize: 11, fontWeight: "600", marginTop: 4 },
  // Duel View
  duelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  duelProgress: { fontSize: 14, fontWeight: "600" },
  duelPointsLive: { fontSize: 14, fontWeight: "800" },
  progressBar: { height: 4, marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  questionContainer: { alignItems: "center", paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 },
  questionLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 },
  questionText: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  optionsContainer: { paddingHorizontal: 16, gap: 10 },
  optionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1.5 },
  optionText: { fontSize: 16, fontWeight: "600" },
  // Duel Complete
  duelCompleteContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  duelCompleteTitle: { fontSize: 28, fontWeight: "800", marginTop: 16 },
  duelScoreRow: { flexDirection: "row", alignItems: "center", gap: 24, marginTop: 32 },
  duelScoreBox: { alignItems: "center" },
  duelScoreAvatar: { fontSize: 40 },
  duelScoreName: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  duelScoreValue: { fontSize: 28, fontWeight: "800", marginTop: 4 },
  vsText: { fontSize: 18, fontWeight: "800" },
  doneBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 40 },
  doneBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  // Stats View
  statsContent: { padding: 16, paddingBottom: 100 },
  statsHero: { alignItems: "center", padding: 24, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  statsWinRate: { fontSize: 48, fontWeight: "800", marginTop: 8 },
  statsWinRateLabel: { fontSize: 14, fontWeight: "600" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statsGridItem: { width: "31%", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  statsGridValue: { fontSize: 20, fontWeight: "800", marginTop: 6 },
  statsGridLabel: { fontSize: 10, marginTop: 2 },
  historyItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  historyInfo: { flex: 1, marginLeft: 10 },
  historyTitle: { fontSize: 14, fontWeight: "600" },
  historyMeta: { fontSize: 11, marginTop: 2 },
});
