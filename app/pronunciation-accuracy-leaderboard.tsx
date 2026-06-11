/**
 * Pronunciation Accuracy Leaderboard Screen
 * 
 * Global rankings by heatmap mastery percentage — compete on
 * pronunciation quality, not just duel wins.
 */
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  type AccuracyLeaderboard,
  type AccuracyLeaderboardEntry,
  type LeaderboardTimeframe,
  buildAccuracyLeaderboard,
  cacheLeaderboard,
  getCachedLeaderboard,
  getBadgeForMastery,
  getRankColor,
  getRankIcon,
  getTrendIcon,
  formatCategory,
  MASTERY_BADGES,
} from "@/lib/pronunciation-accuracy-leaderboard";

// ─── Timeframe Tabs ─────────────────────────────────────────────────────────

const TIMEFRAMES: { key: LeaderboardTimeframe; label: string }[] = [
  { key: "all_time", label: "All Time" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

export default function PronunciationAccuracyLeaderboardScreen() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<AccuracyLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("all_time");
  const [showBadgeInfo, setShowBadgeInfo] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const cached = await getCachedLeaderboard();
      if (cached && cached.timeframe === timeframe) {
        setLeaderboard(cached);
        setLoading(false);
        return;
      }
      const lb = await buildAccuracyLeaderboard(timeframe);
      setLeaderboard(lb);
      await cacheLeaderboard(lb);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // ─── Podium ─────────────────────────────────────────────────────────────

  const renderPodium = () => {
    if (!leaderboard || leaderboard.entries.length < 3) return null;
    const top3 = leaderboard.entries.slice(0, 3);
    const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd

    return (
      <View style={styles.podiumContainer}>
        {podiumOrder.map((entry, idx) => {
          const isFirst = idx === 1;
          const podiumHeight = isFirst ? 100 : idx === 0 ? 75 : 60;
          const badge = getBadgeForMastery(entry.masteryPercentage);

          return (
            <View key={entry.userId} style={styles.podiumSlot}>
              <View style={[styles.podiumAvatar, isFirst && styles.podiumAvatarFirst, { borderColor: badge.color }]}>
                <Ionicons name={badge.icon as any} size={isFirst ? 28 : 22} color={badge.color} />
              </View>
              <Text style={[styles.podiumName, isFirst && styles.podiumNameFirst]} numberOfLines={1}>
                {entry.displayName}
              </Text>
              <Text style={[styles.podiumMastery, { color: badge.color }]}>
                {entry.masteryPercentage.toFixed(1)}%
              </Text>
              <View style={[styles.podiumBar, { height: podiumHeight, backgroundColor: badge.color + "30", borderColor: badge.color + "60" }]}>
                <Text style={[styles.podiumRank, { color: badge.color }]}>#{entry.rank}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ─── User Card ──────────────────────────────────────────────────────────

  const renderUserCard = () => {
    if (!leaderboard?.currentUserEntry) return null;
    const entry = leaderboard.currentUserEntry;
    const badge = getBadgeForMastery(entry.masteryPercentage);
    const trend = getTrendIcon(entry.trend);

    return (
      <View style={styles.userCard}>
        <View style={styles.userCardHeader}>
          <View style={styles.userCardLeft}>
            <View style={[styles.userRankBadge, { backgroundColor: getRankColor(entry.rank) + "25", borderColor: getRankColor(entry.rank) }]}>
              <Text style={[styles.userRankText, { color: getRankColor(entry.rank) }]}>#{entry.rank}</Text>
            </View>
            <View>
              <Text style={styles.userCardName}>Your Ranking</Text>
              <View style={styles.userBadgeRow}>
                <Ionicons name={badge.icon as any} size={14} color={badge.color} />
                <Text style={[styles.userBadgeText, { color: badge.color }]}>{badge.name}</Text>
              </View>
            </View>
          </View>
          <View style={styles.userCardRight}>
            <Text style={styles.userMasteryBig}>{entry.masteryPercentage.toFixed(1)}%</Text>
            <View style={styles.trendRow}>
              <Ionicons name={trend.icon as any} size={12} color={trend.color} />
              <Text style={[styles.trendText, { color: trend.color }]}>{entry.trend}</Text>
            </View>
          </View>
        </View>
        <View style={styles.userStatsRow}>
          <View style={styles.userStat}>
            <Text style={styles.userStatValue}>{entry.wordsAttempted}</Text>
            <Text style={styles.userStatLabel}>Attempted</Text>
          </View>
          <View style={styles.userStat}>
            <Text style={styles.userStatValue}>{entry.wordsMastered}</Text>
            <Text style={styles.userStatLabel}>Mastered</Text>
          </View>
          <View style={styles.userStat}>
            <Text style={styles.userStatValue}>{entry.averageAccuracy.toFixed(0)}%</Text>
            <Text style={styles.userStatLabel}>Accuracy</Text>
          </View>
          <View style={styles.userStat}>
            <Text style={styles.userStatValue}>{entry.streak}d</Text>
            <Text style={styles.userStatLabel}>Streak</Text>
          </View>
        </View>
        <View style={styles.userCategoryRow}>
          <Text style={styles.userCatLabel}>
            Best: <Text style={{ color: Colors.success }}>{formatCategory(entry.strongestCategory)}</Text>
          </Text>
          <Text style={styles.userCatLabel}>
            Focus: <Text style={{ color: Colors.accent }}>{formatCategory(entry.weakestCategory)}</Text>
          </Text>
        </View>
      </View>
    );
  };

  // ─── List Item ──────────────────────────────────────────────────────────

  const renderEntry = ({ item }: { item: AccuracyLeaderboardEntry }) => {
    const badge = getBadgeForMastery(item.masteryPercentage);
    const trend = getTrendIcon(item.trend);
    const isUser = item.isCurrentUser;

    return (
      <View style={[styles.entryRow, isUser && styles.entryRowUser]}>
        <View style={styles.entryRank}>
          <Text style={[styles.entryRankText, { color: getRankColor(item.rank) }]}>
            {item.rank}
          </Text>
        </View>
        <View style={[styles.entryAvatar, { borderColor: badge.color }]}>
          <Ionicons name={badge.icon as any} size={16} color={badge.color} />
        </View>
        <View style={styles.entryInfo}>
          <Text style={[styles.entryName, isUser && { color: Colors.secondary }]} numberOfLines={1}>
            {item.displayName}
          </Text>
          <Text style={styles.entryBadge}>{badge.name}</Text>
        </View>
        <View style={styles.entryStats}>
          <Text style={styles.entryMastery}>{item.masteryPercentage.toFixed(1)}%</Text>
          <View style={styles.entryTrend}>
            <Ionicons name={trend.icon as any} size={10} color={trend.color} />
          </View>
        </View>
      </View>
    );
  };

  // ─── Badge Info Modal ───────────────────────────────────────────────────

  const renderBadgeInfo = () => {
    if (!showBadgeInfo) return null;
    return (
      <View style={styles.badgeInfoOverlay}>
        <View style={styles.badgeInfoCard}>
          <View style={styles.badgeInfoHeader}>
            <Text style={styles.badgeInfoTitle}>Mastery Badges</Text>
            <TouchableOpacity onPress={() => setShowBadgeInfo(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          {MASTERY_BADGES.map((badge) => (
            <View key={badge.id} style={styles.badgeInfoRow}>
              <Ionicons name={badge.icon as any} size={20} color={badge.color} />
              <View style={styles.badgeInfoText}>
                <Text style={[styles.badgeInfoName, { color: badge.color }]}>{badge.name}</Text>
                <Text style={styles.badgeInfoDesc}>{badge.description}</Text>
                <Text style={styles.badgeInfoReq}>{badge.minMastery}%+ mastery</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ─── Header ─────────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View>
      {renderPodium()}
      {renderUserCard()}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Full Rankings</Text>
        <Text style={styles.listHeaderCount}>
          {leaderboard?.totalParticipants || 0} participants
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Accuracy Leaderboard</Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowBadgeInfo(true);
            }}
            style={styles.infoBtn}
          >
            <Ionicons name="information-circle-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Timeframe Tabs */}
        <View style={styles.tabRow}>
          {TIMEFRAMES.map((tf) => (
            <TouchableOpacity
              key={tf.key}
              style={[styles.tab, timeframe === tf.key && styles.tabActive]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTimeframe(tf.key);
              }}
            >
              <Text style={[styles.tabText, timeframe === tf.key && styles.tabTextActive]}>
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={styles.loadingText}>Loading rankings...</Text>
          </View>
        ) : (
          <FlatList
            data={leaderboard?.entries || []}
            keyExtractor={(item) => item.userId}
            renderItem={renderEntry}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {renderBadgeInfo()}
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  title: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  infoBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  tabActive: { backgroundColor: Colors.secondary + "25" },
  tabText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: "600" },
  tabTextActive: { color: Colors.secondary },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.md },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 100 },

  // Podium
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  podiumSlot: { alignItems: "center", flex: 1 },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    marginBottom: Spacing.xs,
  },
  podiumAvatarFirst: { width: 60, height: 60, borderRadius: 30, borderWidth: 3 },
  podiumName: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: "600", maxWidth: 80 },
  podiumNameFirst: { fontSize: FontSize.sm, color: Colors.textPrimary },
  podiumMastery: { fontSize: FontSize.sm, fontWeight: "700", marginBottom: Spacing.xs },
  podiumBar: {
    width: "80%",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  podiumRank: { fontSize: FontSize.lg, fontWeight: "800" },

  // User Card
  userCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  userCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  userCardLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  userRankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  userRankText: { fontSize: FontSize.md, fontWeight: "800" },
  userCardName: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  userBadgeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  userBadgeText: { fontSize: FontSize.xs, fontWeight: "600" },
  userCardRight: { alignItems: "flex-end" },
  userMasteryBig: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.secondary },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  trendText: { fontSize: FontSize.xs, fontWeight: "600", textTransform: "capitalize" },
  userStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  userStat: { alignItems: "center" },
  userStatValue: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  userStatLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  userCategoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  userCatLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  // List
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  listHeaderTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  listHeaderCount: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Entry Row
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryRowUser: {
    borderColor: Colors.secondary + "50",
    backgroundColor: Colors.secondary + "08",
  },
  entryRank: { width: 32, alignItems: "center" },
  entryRankText: { fontSize: FontSize.sm, fontWeight: "800" },
  entryAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginRight: Spacing.sm,
  },
  entryInfo: { flex: 1 },
  entryName: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  entryBadge: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  entryStats: { alignItems: "flex-end" },
  entryMastery: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  entryTrend: { marginTop: 2 },

  // Badge Info
  badgeInfoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  badgeInfoCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  badgeInfoTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  badgeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  badgeInfoText: { flex: 1 },
  badgeInfoName: { fontSize: FontSize.sm, fontWeight: "700" },
  badgeInfoDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  badgeInfoReq: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
});
