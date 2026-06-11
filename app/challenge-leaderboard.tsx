import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInDown,
} from "react-native-reanimated";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const { width } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  challengesCompleted: number;
  rank: number;
  isCurrentUser: boolean;
  trend: "up" | "down" | "same";
  badge?: string;
}

type TimeFilter = "today" | "week" | "month" | "allTime";
type BoardType = "xp" | "streak" | "challenges";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: "1", name: "Sofia M.", avatar: "🇲🇽", xp: 12450, streak: 45, challengesCompleted: 89, rank: 1, isCurrentUser: false, trend: "same", badge: "🏆" },
  { id: "2", name: "Carlos R.", avatar: "🇩🇴", xp: 11200, streak: 38, challengesCompleted: 76, rank: 2, isCurrentUser: false, trend: "up", badge: "🥈" },
  { id: "3", name: "Aisha K.", avatar: "🇳🇬", xp: 10800, streak: 52, challengesCompleted: 71, rank: 3, isCurrentUser: false, trend: "down", badge: "🥉" },
  { id: "4", name: "You", avatar: "⭐", xp: 9650, streak: 23, challengesCompleted: 64, rank: 4, isCurrentUser: true, trend: "up" },
  { id: "5", name: "Kenji T.", avatar: "🇯🇵", xp: 8900, streak: 31, challengesCompleted: 58, rank: 5, isCurrentUser: false, trend: "down" },
  { id: "6", name: "Priya S.", avatar: "🇮🇳", xp: 8200, streak: 19, challengesCompleted: 52, rank: 6, isCurrentUser: false, trend: "up" },
  { id: "7", name: "Lucas B.", avatar: "🇧🇷", xp: 7800, streak: 27, challengesCompleted: 49, rank: 7, isCurrentUser: false, trend: "same" },
  { id: "8", name: "Fatima A.", avatar: "🇸🇦", xp: 7100, streak: 14, challengesCompleted: 43, rank: 8, isCurrentUser: false, trend: "up" },
  { id: "9", name: "Dmitri V.", avatar: "🇷🇺", xp: 6500, streak: 21, challengesCompleted: 38, rank: 9, isCurrentUser: false, trend: "down" },
  { id: "10", name: "Marie L.", avatar: "🇫🇷", xp: 5900, streak: 16, challengesCompleted: 35, rank: 10, isCurrentUser: false, trend: "same" },
  { id: "11", name: "Jin W.", avatar: "🇰🇷", xp: 5400, streak: 12, challengesCompleted: 31, rank: 11, isCurrentUser: false, trend: "up" },
  { id: "12", name: "Amara O.", avatar: "🇬🇭", xp: 4800, streak: 9, challengesCompleted: 27, rank: 12, isCurrentUser: false, trend: "same" },
];

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "allTime", label: "All Time" },
];

const BOARD_TYPES: { key: BoardType; label: string; icon: string }[] = [
  { key: "xp", label: "XP", icon: "flash" },
  { key: "streak", label: "Streaks", icon: "flame" },
  { key: "challenges", label: "Challenges", icon: "trophy" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChallengeLeaderboardScreen() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  const [boardType, setBoardType] = useState<BoardType>("xp");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [refreshing, setRefreshing] = useState(false);
  const [userRank, setUserRank] = useState(4);
  const [userXP, setUserXP] = useState(9650);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const xp = await AsyncStorage.getItem("@total_xp");
      const streak = await AsyncStorage.getItem("@current_streak");
      if (xp) {
        const xpNum = parseInt(xp, 10);
        setUserXP(xpNum);
        // Update user entry in leaderboard
        setLeaderboard(prev => prev.map(e =>
          e.isCurrentUser ? { ...e, xp: xpNum, streak: streak ? parseInt(streak, 10) : e.streak } : e
        ));
      }
    } catch {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadUserStats();
    // Simulate server refresh
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const getSortedLeaderboard = () => {
    const sorted = [...leaderboard].sort((a, b) => {
      switch (boardType) {
        case "xp": return b.xp - a.xp;
        case "streak": return b.streak - a.streak;
        case "challenges": return b.challengesCompleted - a.challengesCompleted;
      }
    });
    return sorted.map((entry, i) => ({ ...entry, rank: i + 1 }));
  };

  const getStatValue = (entry: LeaderboardEntry) => {
    switch (boardType) {
      case "xp": return `${entry.xp.toLocaleString()} XP`;
      case "streak": return `${entry.streak} days`;
      case "challenges": return `${entry.challengesCompleted} done`;
    }
  };

  const sorted = getSortedLeaderboard();
  const topThree = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const currentUser = sorted.find(e => e.isCurrentUser);

  const renderTopThree = () => (
    <View style={styles.podiumContainer}>
      {/* 2nd place */}
      <View style={[styles.podiumSlot, styles.podiumSecond]}>
        <Text style={styles.podiumAvatar}>{topThree[1]?.avatar}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>{topThree[1]?.name}</Text>
        <Text style={styles.podiumStat}>{topThree[1] ? getStatValue(topThree[1]) : ""}</Text>
        <View style={[styles.podiumBar, { height: 80, backgroundColor: "#C0C0C0" }]}>
          <Text style={styles.podiumRank}>2</Text>
        </View>
      </View>
      {/* 1st place */}
      <View style={[styles.podiumSlot, styles.podiumFirst]}>
        <View style={styles.crownWrap}>
          <Text style={styles.crown}>👑</Text>
        </View>
        <Text style={styles.podiumAvatar}>{topThree[0]?.avatar}</Text>
        <Text style={[styles.podiumName, { fontWeight: "700" }]} numberOfLines={1}>{topThree[0]?.name}</Text>
        <Text style={[styles.podiumStat, { color: Colors.gold }]}>{topThree[0] ? getStatValue(topThree[0]) : ""}</Text>
        <View style={[styles.podiumBar, { height: 110, backgroundColor: Colors.gold }]}>
          <Text style={styles.podiumRank}>1</Text>
        </View>
      </View>
      {/* 3rd place */}
      <View style={[styles.podiumSlot, styles.podiumThird]}>
        <Text style={styles.podiumAvatar}>{topThree[2]?.avatar}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>{topThree[2]?.name}</Text>
        <Text style={styles.podiumStat}>{topThree[2] ? getStatValue(topThree[2]) : ""}</Text>
        <View style={[styles.podiumBar, { height: 60, backgroundColor: "#CD7F32" }]}>
          <Text style={styles.podiumRank}>3</Text>
        </View>
      </View>
    </View>
  );

  const renderEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <View style={[styles.entryRow, item.isCurrentUser && styles.entryRowCurrent]}>
        <View style={styles.entryRank}>
          <Text style={[styles.entryRankText, item.isCurrentUser && { color: Colors.primary }]}>
            {item.rank}
          </Text>
        </View>
        <Text style={styles.entryAvatar}>{item.avatar}</Text>
        <View style={styles.entryInfo}>
          <View style={styles.entryNameRow}>
            <Text style={[styles.entryName, item.isCurrentUser && { color: Colors.primary, fontWeight: "700" }]}>
              {item.name}
            </Text>
            {item.badge && <Text style={styles.entryBadge}>{item.badge}</Text>}
            <Ionicons
              name={item.trend === "up" ? "arrow-up" : item.trend === "down" ? "arrow-down" : "remove"}
              size={14}
              color={item.trend === "up" ? Colors.success : item.trend === "down" ? Colors.accent : Colors.textMuted}
              style={{ marginLeft: 4 }}
            />
          </View>
          <Text style={styles.entryStreak}>🔥 {item.streak} day streak</Text>
        </View>
        <Text style={[styles.entryStat, item.isCurrentUser && { color: Colors.primary }]}>
          {getStatValue(item)}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <TouchableOpacity onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/challenge-history" as any);
        }} style={styles.shareBtn}>
          <Ionicons name="time-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Board Type Tabs */}
      <View style={styles.boardTabs}>
        {BOARD_TYPES.map(bt => (
          <TouchableOpacity
            key={bt.key}
            style={[styles.boardTab, boardType === bt.key && styles.boardTabActive]}
            onPress={() => {
              setBoardType(bt.key);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={bt.icon as any}
              size={16}
              color={boardType === bt.key ? "#fff" : Colors.textMuted}
            />
            <Text style={[styles.boardTabText, boardType === bt.key && styles.boardTabTextActive]}>
              {bt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Time Filter */}
      <View style={styles.timeFilters}>
        {TIME_FILTERS.map(tf => (
          <TouchableOpacity
            key={tf.key}
            style={[styles.timeFilter, timeFilter === tf.key && styles.timeFilterActive]}
            onPress={() => setTimeFilter(tf.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.timeFilterText, timeFilter === tf.key && styles.timeFilterTextActive]}>
              {tf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={rest}
        keyExtractor={item => item.id}
        renderItem={renderEntry}
        ListHeaderComponent={
          <>
            {renderTopThree()}
            {/* Your Position Banner */}
            {currentUser && currentUser.rank > 3 && (
              <View style={styles.yourPositionBanner}>
                <View style={styles.yourPositionLeft}>
                  <Text style={styles.yourPositionRank}>#{currentUser.rank}</Text>
                  <Text style={styles.yourPositionLabel}>Your Position</Text>
                </View>
                <View style={styles.yourPositionRight}>
                  <Text style={styles.yourPositionStat}>{getStatValue(currentUser)}</Text>
                  <Text style={styles.yourPositionGap}>
                    {sorted[currentUser.rank - 2]
                      ? `${(boardType === "xp"
                          ? sorted[currentUser.rank - 2].xp - currentUser.xp
                          : boardType === "streak"
                          ? sorted[currentUser.rank - 2].streak - currentUser.streak
                          : sorted[currentUser.rank - 2].challengesCompleted - currentUser.challengesCompleted
                        ).toLocaleString()} to next rank`
                      : "Top spot!"}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Rankings</Text>
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: Colors.textPrimary },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },

  boardTabs: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  boardTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.surface },
  boardTabActive: { backgroundColor: Colors.primary },
  boardTabText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  boardTabTextActive: { color: "#fff" },

  timeFilters: { flexDirection: "row", paddingHorizontal: 16, gap: 6, marginBottom: 16 },
  timeFilter: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surface },
  timeFilterActive: { backgroundColor: Colors.primary + "20", borderWidth: 1, borderColor: Colors.primary },
  timeFilterText: { fontSize: 12, fontWeight: "500", color: Colors.textMuted },
  timeFilterTextActive: { color: Colors.primary, fontWeight: "600" },

  podiumContainer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, gap: 12 },
  podiumSlot: { alignItems: "center", flex: 1 },
  podiumFirst: {},
  podiumSecond: {},
  podiumThird: {},
  crownWrap: { marginBottom: -4 },
  crown: { fontSize: 24 },
  podiumAvatar: { fontSize: 32, marginBottom: 4 },
  podiumName: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary, marginBottom: 2, textAlign: "center" },
  podiumStat: { fontSize: 11, color: Colors.textMuted, marginBottom: 6 },
  podiumBar: { width: "100%", borderTopLeftRadius: 12, borderTopRightRadius: 12, alignItems: "center", justifyContent: "center" },
  podiumRank: { fontSize: 22, fontWeight: "800", color: "#fff" },

  yourPositionBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: Colors.primary + "15", borderWidth: 1, borderColor: Colors.primary + "40" },
  yourPositionLeft: { alignItems: "flex-start" },
  yourPositionRank: { fontSize: 28, fontWeight: "800", color: Colors.primary },
  yourPositionLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  yourPositionRight: { alignItems: "flex-end" },
  yourPositionStat: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  yourPositionGap: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  listHeader: { paddingHorizontal: 16, paddingBottom: 8 },
  listHeaderText: { fontSize: 14, fontWeight: "600", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  listContent: { paddingBottom: 40 },

  entryRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  entryRowCurrent: { backgroundColor: Colors.primary + "10" },
  entryRank: { width: 32, alignItems: "center" },
  entryRankText: { fontSize: 16, fontWeight: "700", color: Colors.textMuted },
  entryAvatar: { fontSize: 28, marginHorizontal: 12 },
  entryInfo: { flex: 1 },
  entryNameRow: { flexDirection: "row", alignItems: "center" },
  entryName: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  entryBadge: { fontSize: 14, marginLeft: 4 },
  entryStreak: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  entryStat: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, marginLeft: 8 },
});
