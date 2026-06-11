import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  country: string;
  weeklyMinutes: number;
  dailyGoal: number;
  streak: number;
  rank: number;
  isMe: boolean;
  change: number; // rank change from last week (-2 = dropped 2, +3 = rose 3)
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: "1", name: "Sofia Martinez", avatar: "🇲🇽", country: "Mexico", weeklyMinutes: 420, dailyGoal: 60, streak: 28, rank: 1, isMe: false, change: 0 },
  { id: "2", name: "Kenji Tanaka", avatar: "🇯🇵", country: "Japan", weeklyMinutes: 385, dailyGoal: 60, streak: 21, rank: 2, isMe: false, change: 2 },
  { id: "3", name: "You", avatar: "🇺🇸", country: "United States", weeklyMinutes: 340, dailyGoal: 30, streak: 14, rank: 3, isMe: true, change: 1 },
  { id: "4", name: "Amélie Dubois", avatar: "🇫🇷", country: "France", weeklyMinutes: 310, dailyGoal: 45, streak: 12, rank: 4, isMe: false, change: -2 },
  { id: "5", name: "Lucas Schmidt", avatar: "🇩🇪", country: "Germany", weeklyMinutes: 290, dailyGoal: 45, streak: 9, rank: 5, isMe: false, change: -1 },
  { id: "6", name: "Priya Patel", avatar: "🇮🇳", country: "India", weeklyMinutes: 265, dailyGoal: 30, streak: 18, rank: 6, isMe: false, change: 3 },
  { id: "7", name: "Marco Rossi", avatar: "🇮🇹", country: "Italy", weeklyMinutes: 240, dailyGoal: 30, streak: 7, rank: 7, isMe: false, change: 0 },
  { id: "8", name: "Yuki Sato", avatar: "🇯🇵", country: "Japan", weeklyMinutes: 225, dailyGoal: 30, streak: 5, rank: 8, isMe: false, change: -1 },
  { id: "9", name: "Emma Johnson", avatar: "🇬🇧", country: "United Kingdom", weeklyMinutes: 210, dailyGoal: 30, streak: 11, rank: 9, isMe: false, change: 2 },
  { id: "10", name: "Carlos Silva", avatar: "🇧🇷", country: "Brazil", weeklyMinutes: 195, dailyGoal: 30, streak: 4, rank: 10, isMe: false, change: -3 },
  { id: "11", name: "Anna Kowalski", avatar: "🇵🇱", country: "Poland", weeklyMinutes: 180, dailyGoal: 30, streak: 6, rank: 11, isMe: false, change: 0 },
  { id: "12", name: "Hassan Ali", avatar: "🇪🇬", country: "Egypt", weeklyMinutes: 165, dailyGoal: 30, streak: 3, rank: 12, isMe: false, change: 1 },
];

type TimeFilter = "week" | "month" | "allTime";

export default function FocusLeaderboardScreen() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);

  // Load leaderboard from AsyncStorage (synced from server)
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@focus_leaderboard');
        if (stored) setLeaderboard(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  const myEntry = leaderboard.find((e) => e.isMe);
  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return "#64748B";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "trophy";
    if (rank === 2) return "medal";
    if (rank === 3) return "ribbon";
    return "ellipse";
  };

  const formatMinutes = (min: number): string => {
    if (min >= 60) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${min}m`;
  };

  const renderPodium = () => (
    <View style={styles.podiumContainer}>
      {/* 2nd Place */}
      <View style={styles.podiumSlot}>
        <Text style={styles.podiumAvatar}>{topThree[1]?.avatar}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>{topThree[1]?.name.split(" ")[0]}</Text>
        <Text style={styles.podiumMinutes}>{formatMinutes(topThree[1]?.weeklyMinutes || 0)}</Text>
        <View style={[styles.podiumBar, { height: 60, backgroundColor: "rgba(192, 192, 192, 0.2)", borderColor: "#C0C0C0" }]}>
          <Text style={[styles.podiumRank, { color: "#C0C0C0" }]}>2</Text>
        </View>
      </View>

      {/* 1st Place */}
      <View style={styles.podiumSlot}>
        <View style={styles.crownContainer}>
          <Ionicons name="trophy" size={20} color="#FFD700" />
        </View>
        <Text style={styles.podiumAvatar}>{topThree[0]?.avatar}</Text>
        <Text style={styles.podiumName} numberOfLines={1}>{topThree[0]?.name.split(" ")[0]}</Text>
        <Text style={[styles.podiumMinutes, { color: "#FFD700" }]}>{formatMinutes(topThree[0]?.weeklyMinutes || 0)}</Text>
        <View style={[styles.podiumBar, { height: 80, backgroundColor: "rgba(255, 215, 0, 0.15)", borderColor: "#FFD700" }]}>
          <Text style={[styles.podiumRank, { color: "#FFD700" }]}>1</Text>
        </View>
      </View>

      {/* 3rd Place */}
      <View style={styles.podiumSlot}>
        <Text style={styles.podiumAvatar}>{topThree[2]?.avatar}</Text>
        <Text style={[styles.podiumName, topThree[2]?.isMe && { color: "#00AAFF" }]} numberOfLines={1}>
          {topThree[2]?.isMe ? "You" : topThree[2]?.name.split(" ")[0]}
        </Text>
        <Text style={styles.podiumMinutes}>{formatMinutes(topThree[2]?.weeklyMinutes || 0)}</Text>
        <View style={[styles.podiumBar, { height: 45, backgroundColor: "rgba(205, 127, 50, 0.15)", borderColor: "#CD7F32" }]}>
          <Text style={[styles.podiumRank, { color: "#CD7F32" }]}>3</Text>
        </View>
      </View>
    </View>
  );

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => (
    <TouchableOpacity
      style={[styles.entryRow, item.isMe && styles.entryRowMe]}
      onPress={() => {
        if (!item.isMe) router.push("/connection-profile" as any);
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.entryLeft}>
        <Text style={[styles.entryRank, { color: getRankColor(item.rank) }]}>
          {item.rank}
        </Text>
        <Text style={styles.entryAvatar}>{item.avatar}</Text>
        <View style={styles.entryInfo}>
          <Text style={[styles.entryName, item.isMe && { color: "#00AAFF" }]}>
            {item.name}
          </Text>
          <View style={styles.entryMeta}>
            {item.streak > 0 && (
              <View style={styles.entryStreakBadge}>
                <Ionicons name="flame" size={10} color="#F97316" />
                <Text style={styles.entryStreakText}>{item.streak}d</Text>
              </View>
            )}
            <Text style={styles.entryGoalText}>{item.dailyGoal}m/day goal</Text>
          </View>
        </View>
      </View>
      <View style={styles.entryRight}>
        <Text style={[styles.entryMinutes, item.isMe && { color: "#00AAFF" }]}>
          {formatMinutes(item.weeklyMinutes)}
        </Text>
        {item.change !== 0 && (
          <View style={styles.entryChange}>
            <Ionicons
              name={item.change > 0 ? "arrow-up" : "arrow-down"}
              size={10}
              color={item.change > 0 ? "#22C55E" : "#EF4444"}
            />
            <Text style={[styles.entryChangeText, { color: item.change > 0 ? "#22C55E" : "#EF4444" }]}>
              {Math.abs(item.change)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus Leaderboard</Text>
        <TouchableOpacity onPress={() => router.push("/study-session" as any)} style={styles.timerBtn}>
          <Ionicons name="timer" size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Time Filter */}
      <View style={styles.filterRow}>
        {(["week", "month", "allTime"] as TimeFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, timeFilter === f && styles.filterChipActive]}
            onPress={() => {
              setTimeFilter(f);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.filterChipText, timeFilter === f && styles.filterChipTextActive]}>
              {f === "week" ? "This Week" : f === "month" ? "This Month" : "All Time"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My Position Banner */}
      {myEntry && (
        <View style={styles.myBanner}>
          <View style={styles.myBannerLeft}>
            <Ionicons name={getRankIcon(myEntry.rank) as any} size={18} color={getRankColor(myEntry.rank)} />
            <Text style={styles.myBannerText}>
              You're #{myEntry.rank} with {formatMinutes(myEntry.weeklyMinutes)} this week
            </Text>
          </View>
          {myEntry.change !== 0 && (
            <View style={[styles.myChangeBadge, { backgroundColor: myEntry.change > 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }]}>
              <Ionicons
                name={myEntry.change > 0 ? "arrow-up" : "arrow-down"}
                size={12}
                color={myEntry.change > 0 ? "#22C55E" : "#EF4444"}
              />
              <Text style={[styles.myChangeText, { color: myEntry.change > 0 ? "#22C55E" : "#EF4444" }]}>
                {Math.abs(myEntry.change)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Podium */}
      {renderPodium()}

      {/* Rest of Leaderboard */}
      <FlatList
        data={restOfList}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E14" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#E2E8F0" },
  timerBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "#6366F1",
  },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  filterChipTextActive: { color: "#6366F1" },
  myBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0, 170, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.2)",
    marginBottom: 16,
  },
  myBannerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  myBannerText: { fontSize: 13, fontWeight: "600", color: "#E2E8F0" },
  myChangeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  myChangeText: { fontSize: 11, fontWeight: "700" },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  podiumSlot: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  crownContainer: {
    marginBottom: 4,
  },
  podiumAvatar: { fontSize: 28 },
  podiumName: { fontSize: 11, fontWeight: "600", color: "#E2E8F0", textAlign: "center" },
  podiumMinutes: { fontSize: 11, fontWeight: "700", color: "#94A3B8" },
  podiumBar: {
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  podiumRank: { fontSize: 20, fontWeight: "900" },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    marginBottom: 8,
  },
  entryRowMe: {
    backgroundColor: "rgba(0, 170, 255, 0.06)",
    borderColor: "rgba(0, 170, 255, 0.15)",
  },
  entryLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  entryRank: { fontSize: 14, fontWeight: "800", width: 24, textAlign: "center" },
  entryAvatar: { fontSize: 22 },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 13, fontWeight: "600", color: "#E2E8F0" },
  entryMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  entryStreakBadge: { flexDirection: "row", alignItems: "center", gap: 2 },
  entryStreakText: { fontSize: 10, fontWeight: "600", color: "#F97316" },
  entryGoalText: { fontSize: 10, color: "#64748B" },
  entryRight: { alignItems: "flex-end", gap: 2 },
  entryMinutes: { fontSize: 14, fontWeight: "700", color: "#E2E8F0" },
  entryChange: { flexDirection: "row", alignItems: "center", gap: 2 },
  entryChangeText: { fontSize: 10, fontWeight: "700" },
});
