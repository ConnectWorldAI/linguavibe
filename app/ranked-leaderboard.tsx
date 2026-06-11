import { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { getRankForRating, getMatchmakingProfile, generateSimulatedOpponents, getWinRate, RANK_TIERS, type RankInfo, type RankTier, type MatchmakingProfile } from "@/lib/matchmaking";

// Map tier keys to icons
const TIER_ICONS: Record<string, string> = {
  bronze: "shield-outline",
  silver: "shield-half-outline",
  gold: "shield",
  platinum: "diamond-outline",
  diamond: "diamond",
  master: "trophy",
};

interface LeaderboardPlayer {
  id: string;
  name: string;
  elo: number;
  tier: RankTier;
  wins: number;
  losses: number;
  winRate: number;
  weeklyClimb: number;
  isCurrentUser: boolean;
}

interface MyStats {
  elo: number;
  rank: number;
  wins: number;
  losses: number;
  winRate: number;
  weeklyClimb: number;
  tier: RankInfo;
}

type TimeFilter = "weekly" | "monthly" | "all_time";

export default function RankedLeaderboardScreen() {
  const colors = useColors();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("weekly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [timeFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const profile = await getMatchmakingProfile();
      const opponents = generateSimulatedOpponents(profile.rating, 20);
      const leaderboardPlayers: LeaderboardPlayer[] = opponents.map((opp) => ({
        id: opp.id,
        name: opp.name,
        elo: opp.rating,
        tier: opp.rankTier,
        wins: Math.round(opp.gamesPlayed * opp.winRate / 100),
        losses: opp.gamesPlayed - Math.round(opp.gamesPlayed * opp.winRate / 100),
        winRate: opp.winRate,
        weeklyClimb: Math.floor(Math.random() * 60) - 20,
        isCurrentUser: false,
      }));
      const myWinRate = getWinRate(profile);
      leaderboardPlayers.push({
        id: "me",
        name: "You",
        elo: profile.rating,
        tier: profile.rankTier,
        wins: profile.wins,
        losses: profile.losses,
        winRate: myWinRate,
        weeklyClimb: Math.floor(Math.random() * 30),
        isCurrentUser: true,
      });
      leaderboardPlayers.sort((a, b) => b.elo - a.elo);
      const filtered = timeFilter === "weekly" ? leaderboardPlayers.slice(0, 15) :
                       timeFilter === "monthly" ? leaderboardPlayers.slice(0, 20) :
                       leaderboardPlayers;
      setPlayers(filtered);
      const myRank = filtered.findIndex((p) => p.isCurrentUser) + 1;
      const tier = getRankForRating(profile.rating);
      setMyStats({
        elo: profile.rating,
        rank: myRank || filtered.length,
        wins: profile.wins,
        losses: profile.losses,
        winRate: myWinRate,
        weeklyClimb: Math.floor(Math.random() * 30),
        tier,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerRow = useCallback(({ item, index }: { item: LeaderboardPlayer; index: number }) => {
    const tierInfo = getRankForRating(item.elo);
    const tierColor = tierInfo.color;
    const isMe = item.isCurrentUser;
    const rank = index + 1;

    return (
      <View style={[styles.playerRow, isMe && { backgroundColor: colors.primary + "15", borderColor: colors.primary, borderWidth: 1 }]}>
        <View style={styles.rankCol}>
          {rank <= 3 ? (
            <View style={[styles.medalBadge, { backgroundColor: rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : "#CD7F32" }]}>
              <Text style={styles.medalText}>{rank}</Text>
            </View>
          ) : (
            <Text style={[styles.rankText, { color: colors.muted }]}>{rank}</Text>
          )}
        </View>
        <View style={styles.playerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.playerName, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}{isMe ? " (You)" : ""}
            </Text>
            {item.weeklyClimb > 0 && (
              <View style={styles.climbBadge}>
                <Ionicons name="arrow-up" size={10} color="#22C55E" />
                <Text style={styles.climbText}>+{item.weeklyClimb}</Text>
              </View>
            )}
            {item.weeklyClimb < 0 && (
              <View style={styles.climbBadge}>
                <Ionicons name="arrow-down" size={10} color="#EF4444" />
                <Text style={[styles.climbText, { color: "#EF4444" }]}>{item.weeklyClimb}</Text>
              </View>
            )}
          </View>
          <View style={styles.statsRow}>
            <Text style={[styles.winRate, { color: colors.muted }]}>
              {item.wins}W / {item.losses}L ({item.winRate}%)
            </Text>
          </View>
        </View>
        <View style={styles.tierCol}>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + "20", borderColor: tierColor }]}>
            <Ionicons name={TIER_ICONS[item.tier] as any || "shield"} size={14} color={tierColor} />
            <Text style={[styles.tierName, { color: tierColor }]}>{tierInfo.label}</Text>
          </View>
          <Text style={[styles.eloText, { color: colors.muted }]}>{item.elo} ELO</Text>
        </View>
      </View>
    );
  }, [colors]);

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Ranked Leaderboard</Text>
        <View style={{ width: 40 }} />
      </View>

      {myStats && (
        <View style={[styles.myStatsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.myStatsLeft}>
            <View style={[styles.myTierBadge, { backgroundColor: myStats.tier.color + "20" }]}>
              <Ionicons name={TIER_ICONS[myStats.tier.tier] as any || "shield"} size={24} color={myStats.tier.color} />
            </View>
            <View>
              <Text style={[styles.myTierName, { color: myStats.tier.color }]}>{myStats.tier.label}</Text>
              <Text style={[styles.myElo, { color: colors.foreground }]}>{myStats.elo} ELO</Text>
            </View>
          </View>
          <View style={styles.myStatsRight}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{myStats.rank || "—"}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Rank</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#22C55E" }]}>{myStats.wins}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{myStats.winRate}%</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Win Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: myStats.weeklyClimb >= 0 ? "#22C55E" : "#EF4444" }]}>
                {myStats.weeklyClimb >= 0 ? "+" : ""}{myStats.weeklyClimb}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>This Week</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.filterRow}>
        {(["weekly", "monthly", "all_time"] as TimeFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setTimeFilter(filter)}
            style={[
              styles.filterBtn,
              { borderColor: timeFilter === filter ? colors.primary : colors.border },
              timeFilter === filter && { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Text style={[styles.filterText, { color: timeFilter === filter ? colors.primary : colors.muted }]}>
              {filter === "weekly" ? "This Week" : filter === "monthly" ? "This Month" : "All Time"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayerRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        windowSize={7}
        maxToRenderPerBatch={12}
        initialNumToRender={10}
        removeClippedSubviews={true}
        getItemLayout={(_, index) => ({ length: 72, offset: 72 * index, index })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {loading ? "Loading rankings..." : "No ranked players yet. Win duels to climb!"}
            </Text>
          </View>
        }
      />

      <View style={styles.bottomAction}>
        <TouchableOpacity
          onPress={() => router.push("/duel-multiplayer?mode=ranked" as any)}
          style={[styles.playBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="flash" size={20} color="#fff" />
          <Text style={styles.playBtnText}>Play Ranked Match</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  myStatsCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  myStatsLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  myTierBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  myTierName: { fontSize: 14, fontWeight: "700" },
  myElo: { fontSize: 20, fontWeight: "800" },
  myStatsRight: { flexDirection: "row", gap: 16 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 10, marginTop: 2 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: "600" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  playerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8 },
  rankCol: { width: 36, alignItems: "center" },
  medalBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  medalText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  rankText: { fontSize: 15, fontWeight: "600" },
  playerInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  playerName: { fontSize: 15, fontWeight: "600", maxWidth: 140 },
  climbBadge: { flexDirection: "row", alignItems: "center", gap: 2 },
  climbText: { fontSize: 11, fontWeight: "600", color: "#22C55E" },
  statsRow: { marginTop: 2 },
  winRate: { fontSize: 12 },
  tierCol: { alignItems: "flex-end" },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  tierName: { fontSize: 11, fontWeight: "700" },
  eloText: { fontSize: 11, marginTop: 3 },
  bottomAction: { position: "absolute", bottom: Platform.OS === "web" ? 20 : 36, left: 16, right: 16 },
  playBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16 },
  playBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
