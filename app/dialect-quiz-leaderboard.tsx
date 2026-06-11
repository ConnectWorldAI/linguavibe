/**
 * Dialect Quiz Leaderboard
 *
 * Shows top scores, accuracy percentage, and streak for dialect recognition.
 * Supports weekly/all-time toggle and friend comparison.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/use-colors";

// ─── Types ──────────────────────────────────────────────────────────────────

type TimeFilter = "weekly" | "allTime";

interface LeaderEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  accuracy: number;
  bestStreak: number;
  gamesPlayed: number;
  isYou?: boolean;
  rank: number;
}

interface UserStats {
  totalScore: number;
  totalCorrect: number;
  totalAnswered: number;
  bestStreak: number;
  gamesPlayed: number;
  weeklyScore: number;
  weeklyCorrect: number;
  weeklyAnswered: number;
  weeklyGames: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATS_KEY = "@dialect_quiz_stats";
const LB_STATS_KEY = "@dialect_quiz_lb_stats";

// Simulated community leaderboard (in production, this would come from the server)
const COMMUNITY_LEADERS: Omit<LeaderEntry, "rank">[] = [
  { id: "1", name: "Isabella M.", avatar: "https://i.pravatar.cc/100?img=1", score: 2840, accuracy: 94, bestStreak: 18, gamesPlayed: 42 },
  { id: "2", name: "Carlos R.", avatar: "https://i.pravatar.cc/100?img=2", score: 2650, accuracy: 91, bestStreak: 15, gamesPlayed: 38 },
  { id: "3", name: "Yuki T.", avatar: "https://i.pravatar.cc/100?img=3", score: 2380, accuracy: 88, bestStreak: 14, gamesPlayed: 35 },
  { id: "4", name: "Ahmed K.", avatar: "https://i.pravatar.cc/100?img=4", score: 2100, accuracy: 85, bestStreak: 12, gamesPlayed: 30 },
  { id: "5", name: "Sophie L.", avatar: "https://i.pravatar.cc/100?img=5", score: 1920, accuracy: 82, bestStreak: 11, gamesPlayed: 28 },
  { id: "6", name: "Priya M.", avatar: "https://i.pravatar.cc/100?img=9", score: 1750, accuracy: 80, bestStreak: 10, gamesPlayed: 25 },
  { id: "7", name: "James W.", avatar: "https://i.pravatar.cc/100?img=10", score: 1580, accuracy: 78, bestStreak: 9, gamesPlayed: 22 },
  { id: "8", name: "Lina C.", avatar: "https://i.pravatar.cc/100?img=11", score: 1400, accuracy: 75, bestStreak: 8, gamesPlayed: 20 },
  { id: "9", name: "Kenji O.", avatar: "https://i.pravatar.cc/100?img=12", score: 1200, accuracy: 72, bestStreak: 7, gamesPlayed: 18 },
  { id: "10", name: "Ana P.", avatar: "https://i.pravatar.cc/100?img=14", score: 980, accuracy: 70, bestStreak: 6, gamesPlayed: 15 },
];

const WEEKLY_LEADERS: Omit<LeaderEntry, "rank">[] = [
  { id: "1", name: "Carlos R.", avatar: "https://i.pravatar.cc/100?img=2", score: 680, accuracy: 93, bestStreak: 12, gamesPlayed: 8 },
  { id: "2", name: "Isabella M.", avatar: "https://i.pravatar.cc/100?img=1", score: 620, accuracy: 90, bestStreak: 10, gamesPlayed: 7 },
  { id: "3", name: "Yuki T.", avatar: "https://i.pravatar.cc/100?img=3", score: 540, accuracy: 87, bestStreak: 9, gamesPlayed: 6 },
  { id: "4", name: "Ahmed K.", avatar: "https://i.pravatar.cc/100?img=4", score: 480, accuracy: 84, bestStreak: 8, gamesPlayed: 6 },
  { id: "5", name: "Sophie L.", avatar: "https://i.pravatar.cc/100?img=5", score: 420, accuracy: 81, bestStreak: 7, gamesPlayed: 5 },
  { id: "6", name: "Priya M.", avatar: "https://i.pravatar.cc/100?img=9", score: 360, accuracy: 78, bestStreak: 6, gamesPlayed: 5 },
  { id: "7", name: "James W.", avatar: "https://i.pravatar.cc/100?img=10", score: 300, accuracy: 75, bestStreak: 5, gamesPlayed: 4 },
  { id: "8", name: "Lina C.", avatar: "https://i.pravatar.cc/100?img=11", score: 240, accuracy: 72, bestStreak: 4, gamesPlayed: 3 },
  { id: "9", name: "Kenji O.", avatar: "https://i.pravatar.cc/100?img=12", score: 180, accuracy: 70, bestStreak: 3, gamesPlayed: 2 },
  { id: "10", name: "Ana P.", avatar: "https://i.pravatar.cc/100?img=14", score: 120, accuracy: 68, bestStreak: 2, gamesPlayed: 2 },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function DialectQuizLeaderboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("weekly");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(LB_STATS_KEY);
      if (raw) {
        setUserStats(JSON.parse(raw));
      } else {
        // Initialize from quiz stats
        setUserStats({
          totalScore: 0,
          totalCorrect: 0,
          totalAnswered: 0,
          bestStreak: 0,
          gamesPlayed: 0,
          weeklyScore: 0,
          weeklyCorrect: 0,
          weeklyAnswered: 0,
          weeklyGames: 0,
        });
      }
    } catch {
      setUserStats({
        totalScore: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        bestStreak: 0,
        gamesPlayed: 0,
        weeklyScore: 0,
        weeklyCorrect: 0,
        weeklyAnswered: 0,
        weeklyGames: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const getLeaderboard = useCallback((): LeaderEntry[] => {
    const baseLeaders = timeFilter === "weekly" ? WEEKLY_LEADERS : COMMUNITY_LEADERS;
    const leaders: LeaderEntry[] = baseLeaders.map((l, i) => ({
      ...l,
      rank: i + 1,
    }));

    // Insert user
    if (userStats) {
      const userScore = timeFilter === "weekly" ? userStats.weeklyScore : userStats.totalScore;
      const userAnswered = timeFilter === "weekly" ? userStats.weeklyAnswered : userStats.totalAnswered;
      const userCorrect = timeFilter === "weekly" ? userStats.weeklyCorrect : userStats.totalCorrect;
      const userGames = timeFilter === "weekly" ? userStats.weeklyGames : userStats.gamesPlayed;
      const accuracy = userAnswered > 0 ? Math.round((userCorrect / userAnswered) * 100) : 0;

      const userEntry: LeaderEntry = {
        id: "you",
        name: "You",
        avatar: "https://i.pravatar.cc/100?img=8",
        score: userScore,
        accuracy,
        bestStreak: userStats.bestStreak,
        gamesPlayed: userGames,
        isYou: true,
        rank: 0,
      };

      // Find position
      let inserted = false;
      const result: LeaderEntry[] = [];
      for (const leader of leaders) {
        if (!inserted && userScore >= leader.score) {
          userEntry.rank = result.length + 1;
          result.push(userEntry);
          inserted = true;
        }
        result.push({ ...leader, rank: result.length + 1 });
      }
      if (!inserted) {
        userEntry.rank = result.length + 1;
        result.push(userEntry);
      }
      return result;
    }

    return leaders;
  }, [timeFilter, userStats]);

  const leaderboard = getLeaderboard();

  const getMedalColor = (rank: number): string => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return colors.muted;
  };

  const getMedalIcon = (rank: number): string => {
    if (rank <= 3) return "medal";
    return "ellipse";
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
      marginRight: 40,
    },
    filterRow: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
    },
    filterBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
    },
    filterBtnActive: {
      backgroundColor: colors.primary,
    },
    filterText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.muted,
    },
    filterTextActive: {
      color: "#FFFFFF",
    },
    // Top 3 podium
    podiumContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-end",
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 12,
    },
    podiumItem: {
      alignItems: "center",
      flex: 1,
    },
    podiumAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 3,
    },
    podiumAvatarFirst: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
    },
    podiumName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
      marginTop: 6,
      textAlign: "center",
    },
    podiumScore: {
      fontSize: 16,
      fontWeight: "800",
      marginTop: 2,
    },
    podiumAccuracy: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 1,
    },
    podiumBase: {
      width: "100%",
      borderRadius: 8,
      marginTop: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
    },
    podiumRank: {
      fontSize: 18,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    // Your stats card
    statsCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.primary + "40",
    },
    statsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statItem: {
      alignItems: "center",
      flex: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.foreground,
    },
    statLabel: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    // List
    listHeader: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    listHeaderRank: {
      width: 36,
      fontSize: 11,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
    },
    listHeaderName: {
      flex: 1,
      fontSize: 11,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      marginLeft: 44,
    },
    listHeaderScore: {
      width: 60,
      fontSize: 11,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      textAlign: "right",
    },
    listHeaderAccuracy: {
      width: 50,
      fontSize: 11,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      textAlign: "right",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border + "40",
    },
    rowYou: {
      backgroundColor: colors.primary + "15",
      borderRadius: 12,
      marginHorizontal: 8,
      paddingHorizontal: 12,
    },
    rankText: {
      width: 36,
      fontSize: 15,
      fontWeight: "700",
      color: colors.muted,
      textAlign: "center",
    },
    rowAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
    },
    rowName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
    },
    rowNameYou: {
      color: colors.primary,
    },
    rowScore: {
      width: 60,
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "right",
    },
    rowAccuracy: {
      width: 50,
      fontSize: 13,
      color: colors.muted,
      textAlign: "right",
    },
    playBtn: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 24,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    playBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const userAccuracy =
    userStats && (timeFilter === "weekly" ? userStats.weeklyAnswered : userStats.totalAnswered) > 0
      ? Math.round(
          ((timeFilter === "weekly" ? userStats.weeklyCorrect : userStats.totalCorrect) /
            (timeFilter === "weekly" ? userStats.weeklyAnswered : userStats.totalAnswered)) *
            100
        )
      : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dialect Quiz Leaderboard</Text>
      </View>

      {/* Time Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, timeFilter === "weekly" && styles.filterBtnActive]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTimeFilter("weekly");
          }}
        >
          <Text style={[styles.filterText, timeFilter === "weekly" && styles.filterTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, timeFilter === "allTime" && styles.filterBtnActive]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTimeFilter("allTime");
          }}
        >
          <Text style={[styles.filterText, timeFilter === "allTime" && styles.filterTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top 3 Podium */}
        {top3.length >= 3 && (
          <View style={styles.podiumContainer}>
            {/* 2nd place */}
            <View style={styles.podiumItem}>
              <Image
                source={{ uri: top3[1].avatar }}
                style={[styles.podiumAvatar, { borderColor: "#C0C0C0" }]}
              />
              <Text style={styles.podiumName} numberOfLines={1}>
                {top3[1].name}
              </Text>
              <Text style={[styles.podiumScore, { color: "#C0C0C0" }]}>{top3[1].score}</Text>
              <Text style={styles.podiumAccuracy}>{top3[1].accuracy}% acc</Text>
              <View style={[styles.podiumBase, { backgroundColor: "#C0C0C0", height: 48 }]}>
                <Text style={styles.podiumRank}>2</Text>
              </View>
            </View>
            {/* 1st place */}
            <View style={styles.podiumItem}>
              <Image
                source={{ uri: top3[0].avatar }}
                style={[styles.podiumAvatarFirst, { borderColor: "#FFD700" }]}
              />
              <Text style={styles.podiumName} numberOfLines={1}>
                {top3[0].name}
              </Text>
              <Text style={[styles.podiumScore, { color: "#FFD700" }]}>{top3[0].score}</Text>
              <Text style={styles.podiumAccuracy}>{top3[0].accuracy}% acc</Text>
              <View style={[styles.podiumBase, { backgroundColor: "#FFD700", height: 64 }]}>
                <Text style={styles.podiumRank}>1</Text>
              </View>
            </View>
            {/* 3rd place */}
            <View style={styles.podiumItem}>
              <Image
                source={{ uri: top3[2].avatar }}
                style={[styles.podiumAvatar, { borderColor: "#CD7F32" }]}
              />
              <Text style={styles.podiumName} numberOfLines={1}>
                {top3[2].name}
              </Text>
              <Text style={[styles.podiumScore, { color: "#CD7F32" }]}>{top3[2].score}</Text>
              <Text style={styles.podiumAccuracy}>{top3[2].accuracy}% acc</Text>
              <View style={[styles.podiumBase, { backgroundColor: "#CD7F32", height: 36 }]}>
                <Text style={styles.podiumRank}>3</Text>
              </View>
            </View>
          </View>
        )}

        {/* Your Stats Card */}
        {userStats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {timeFilter === "weekly" ? userStats.weeklyScore : userStats.totalScore}
                </Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userAccuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userStats.bestStreak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {timeFilter === "weekly" ? userStats.weeklyGames : userStats.gamesPlayed}
                </Text>
                <Text style={styles.statLabel}>Games</Text>
              </View>
            </View>
          </View>
        )}

        {/* List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderRank}>#</Text>
          <Text style={styles.listHeaderName}>Player</Text>
          <Text style={styles.listHeaderAccuracy}>Acc</Text>
          <Text style={styles.listHeaderScore}>Score</Text>
        </View>

        {/* Remaining entries */}
        {rest.map((entry) => (
          <View key={entry.id + entry.rank} style={[styles.row, entry.isYou && styles.rowYou]}>
            <Text style={[styles.rankText, { color: getMedalColor(entry.rank) }]}>
              {entry.rank}
            </Text>
            <Image source={{ uri: entry.avatar }} style={styles.rowAvatar} />
            <Text style={[styles.rowName, entry.isYou && styles.rowNameYou]} numberOfLines={1}>
              {entry.name}
            </Text>
            <Text style={styles.rowAccuracy}>{entry.accuracy}%</Text>
            <Text style={styles.rowScore}>{entry.score}</Text>
          </View>
        ))}

        {/* Play Button */}
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/dialect-quiz" as any);
          }}
        >
          <Ionicons name="game-controller" size={20} color="#FFFFFF" />
          <Text style={styles.playBtnText}>Play Dialect Quiz</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
