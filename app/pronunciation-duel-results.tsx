import React, { useState, useEffect } from "react";
import { useAchievementUnlock } from "@/hooks/use-achievement-unlock";
import { AchievementUnlockToast } from "@/components/achievement-unlock-toast";
import { trackDuelPlayed } from "@/lib/analytics";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Share,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { generateDuelInviteLink } from "@/lib/social-challenge-sharing";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  type DuelMatch,
  type DuelStats,
  getDuelHistory,
  getDuelStats,
  getModeInfo,
} from "@/lib/pronunciation-duel";

export default function PronunciationDuelResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ matchId?: string; fromGame?: string }>();
  const [latestMatch, setLatestMatch] = useState<DuelMatch | null>(null);
  const [history, setHistory] = useState<DuelMatch[]>([]);
  const [stats, setStats] = useState<DuelStats | null>(null);
  const [activeTab, setActiveTab] = useState<"latest" | "history">(params.fromGame ? "latest" : "history");

  const { toastData, checkForUnlocks, dismissToast } = useAchievementUnlock();

  useEffect(() => {
    loadData();
  }, []);

  // Track duel completion and check for achievement unlocks after duel results load
  useEffect(() => {
    if (latestMatch && params.fromGame) {
      // Track duel in analytics
      const opponentType = params.fromGame === "multiplayer" ? "human" : "ai";
      const won = latestMatch.winner === "player";
      trackDuelPlayed(opponentType as "ai" | "human", won, latestMatch.playerTotalScore);
      // Delay slightly to let the results screen render first
      const timer = setTimeout(() => checkForUnlocks(), 1500);
      return () => clearTimeout(timer);
    }
  }, [latestMatch, params.fromGame]);

  const loadData = async () => {
    const allHistory = await getDuelHistory();
    setHistory(allHistory);
    const duelStats = await getDuelStats();
    setStats(duelStats);

    if (params.matchId) {
      const found = allHistory.find(m => m.id === params.matchId);
      if (found) setLatestMatch(found);
    } else if (allHistory.length > 0) {
      setLatestMatch(allHistory[0]);
    }
  };

  const handleShare = async () => {
    if (!latestMatch) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const modeInfo = getModeInfo(latestMatch.mode);
    const result = latestMatch.winner === "player" ? "Won" : latestMatch.winner === "tie" ? "Tied" : "Lost";
    const deepLink = generateDuelInviteLink(latestMatch.mode, latestMatch.category, latestMatch.language || "spanish");
    const message = `🎤 Pronunciation Duel — ${modeInfo.title}\n\n${result} against ${latestMatch.opponentName}!\nScore: ${latestMatch.playerTotalScore} vs ${latestMatch.opponentTotalScore}\n\n${deepLink.url}\n\nChallenge me on LinguaVibe! 🔥`;
    try {
      await Share.share({ message, url: deepLink.url });
    } catch {}
  };

  const handleRematch = () => {
    if (!latestMatch) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({
      pathname: "/pronunciation-duel" as any,
      params: {
        mode: latestMatch.mode,
        category: latestMatch.category,
        difficulty: latestMatch.difficulty,
        opponent: latestMatch.opponentName,
      },
    });
  };

  const renderLatestMatch = () => {
    if (!latestMatch) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="mic-off" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No duels yet!</Text>
          <Text style={styles.emptySubtext}>Start a pronunciation duel to see results here.</Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.push("/pronunciation-duel-lobby" as any)}
          >
            <Text style={styles.startBtnText}>Start a Duel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const modeInfo = getModeInfo(latestMatch.mode);
    const isWin = latestMatch.winner === "player";
    const isTie = latestMatch.winner === "tie";

    return (
      <View style={styles.latestContainer}>
        {/* Winner Banner */}
        <View style={[styles.winnerBanner, {
          backgroundColor: isWin ? Colors.success + "15" : isTie ? Colors.gold + "15" : Colors.accent + "15",
          borderColor: isWin ? Colors.success + "40" : isTie ? Colors.gold + "40" : Colors.accent + "40",
        }]}>
          <Ionicons
            name={isWin ? "trophy" : isTie ? "ribbon" : "sad"}
            size={32}
            color={isWin ? Colors.success : isTie ? Colors.gold : Colors.accent}
          />
          <Text style={[styles.winnerText, {
            color: isWin ? Colors.success : isTie ? Colors.gold : Colors.accent,
          }]}>
            {isWin ? "Victory!" : isTie ? "It's a Tie!" : "Defeated"}
          </Text>
        </View>

        {/* Score Comparison */}
        <View style={styles.scoreComparison}>
          <View style={styles.playerColumn}>
            <Text style={styles.playerName}>You</Text>
            <Text style={[styles.bigScore, { color: isWin ? Colors.success : Colors.textPrimary }]}>
              {latestMatch.playerTotalScore}
            </Text>
          </View>
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.playerColumn}>
            <Text style={styles.playerName}>{latestMatch.opponentName}</Text>
            <Text style={[styles.bigScore, { color: !isWin && !isTie ? Colors.accent : Colors.textPrimary }]}>
              {latestMatch.opponentTotalScore}
            </Text>
          </View>
        </View>

        {/* Round Breakdown */}
        <Text style={styles.breakdownTitle}>Round Breakdown</Text>
        {latestMatch.rounds.map((round, i) => (
          <View key={i} style={styles.roundRow}>
            <View style={styles.roundLeft}>
              <Text style={styles.roundNum}>R{round.roundNumber}</Text>
              <Text style={styles.roundWord} numberOfLines={1}>{round.word.text}</Text>
            </View>
            <View style={styles.roundScores}>
              <Text style={[styles.roundPlayerScore, {
                color: round.playerScore >= round.opponentScore ? Colors.success : Colors.textMuted,
              }]}>
                {round.playerScore}
              </Text>
              <Text style={styles.roundDash}>—</Text>
              <Text style={[styles.roundOpponentScore, {
                color: round.opponentScore > round.playerScore ? Colors.accent : Colors.textMuted,
              }]}>
                {round.opponentScore}
              </Text>
            </View>
          </View>
        ))}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="share-social" size={18} color={Colors.secondary} />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => router.push({ pathname: "/duel-replay" as any, params: { matchId: latestMatch?.id || "" } })}
            activeOpacity={0.7}
          >
            <Ionicons name="film-outline" size={18} color={Colors.secondary} />
            <Text style={styles.shareBtnText}>Replay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rematchBtn, { backgroundColor: modeInfo.color }]}
            onPress={handleRematch}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.rematchBtnText}>Rematch</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: DuelMatch }) => {
    const modeInfo = getModeInfo(item.mode);
    const isWin = item.winner === "player";
    const isTie = item.winner === "tie";
    const date = new Date(item.startedAt).toLocaleDateString();

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => {
          setLatestMatch(item);
          setActiveTab("latest");
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.historyIcon, { backgroundColor: modeInfo.color + "20" }]}>
          <Ionicons name={modeInfo.icon as any} size={18} color={modeInfo.color} />
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.historyMode}>{modeInfo.title}</Text>
          <Text style={styles.historyOpponent}>vs {item.opponentName} • {date}</Text>
        </View>
        <View style={styles.historyResult}>
          <Text style={[styles.historyScore, {
            color: isWin ? Colors.success : isTie ? Colors.gold : Colors.accent,
          }]}>
            {item.playerTotalScore}—{item.opponentTotalScore}
          </Text>
          <Text style={[styles.historyOutcome, {
            color: isWin ? Colors.success : isTie ? Colors.gold : Colors.accent,
          }]}>
            {isWin ? "W" : isTie ? "T" : "L"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duel Results</Text>
        <TouchableOpacity
          onPress={() => router.push("/pronunciation-duel-lobby" as any)}
          style={styles.newDuelBtn}
        >
          <Ionicons name="add" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      {stats && stats.totalDuels > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.miniStat}>
            <Text style={[styles.miniStatValue, { color: Colors.success }]}>{stats.wins}</Text>
            <Text style={styles.miniStatLabel}>W</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={[styles.miniStatValue, { color: Colors.accent }]}>{stats.losses}</Text>
            <Text style={styles.miniStatLabel}>L</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={[styles.miniStatValue, { color: Colors.gold }]}>{stats.ties}</Text>
            <Text style={styles.miniStatLabel}>T</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={[styles.miniStatValue, { color: Colors.secondary }]}>{stats.bestWinStreak}</Text>
            <Text style={styles.miniStatLabel}>Best</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "latest" && styles.tabActive]}
          onPress={() => setActiveTab("latest")}
        >
          <Text style={[styles.tabText, activeTab === "latest" && styles.tabTextActive]}>Latest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "latest" ? (
        <FlatList
          data={[1]} // single item to enable scroll
          keyExtractor={() => "latest"}
          renderItem={() => renderLatestMatch()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No history yet</Text>
              <Text style={styles.emptySubtext}>Complete a duel to see your match history.</Text>
            </View>
          }
        />
      )}
      <AchievementUnlockToast toastData={toastData} onDismiss={dismissToast} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  newDuelBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniStat: { alignItems: "center" },
  miniStatValue: { fontSize: FontSize.lg, fontWeight: "800" },
  miniStatLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.surfaceElevated },
  tabText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textMuted },
  tabTextActive: { color: Colors.textPrimary },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  latestContainer: { paddingTop: 8 },
  winnerBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 20,
  },
  winnerText: { fontSize: FontSize.xxl, fontWeight: "800" },
  scoreComparison: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  playerColumn: { flex: 1, alignItems: "center" },
  playerName: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 4 },
  bigScore: { fontSize: 48, fontWeight: "900" },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  vsText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textMuted },
  breakdownTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  roundRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  roundLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  roundNum: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textMuted, width: 24 },
  roundWord: { fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  roundScores: { flexDirection: "row", alignItems: "center", gap: 6 },
  roundPlayerScore: { fontSize: FontSize.md, fontWeight: "700", width: 28, textAlign: "right" },
  roundDash: { fontSize: FontSize.sm, color: Colors.textMuted },
  roundOpponentScore: { fontSize: FontSize.md, fontWeight: "700", width: 28 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary + "15",
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  shareBtnText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.secondary },
  rematchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  rematchBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#fff" },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: { flex: 1, marginLeft: 12 },
  historyMode: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  historyOpponent: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  historyResult: { alignItems: "flex-end" },
  historyScore: { fontSize: FontSize.sm, fontWeight: "700" },
  historyOutcome: { fontSize: FontSize.xs, fontWeight: "700", marginTop: 2 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginTop: 16 },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4, textAlign: "center" },
  startBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary,
  },
  startBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#fff" },
});
