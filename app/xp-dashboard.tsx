import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getOverallXP,
  getStoredScores,
  type OverallXP,
  type CreatorScoreSummary,
  type ExerciseScore,
} from "@/lib/exercise-scoring";

// ─── XP LEVEL TIERS ─────────────────────────────────────────────────────────
export const XP_TIERS = [
  { name: "Beginner", minXP: 0, maxXP: 50, color: "#6B7280", icon: "leaf" },
  { name: "Intermediate", minXP: 51, maxXP: 200, color: "#3B82F6", icon: "flame" },
  { name: "Advanced", minXP: 201, maxXP: 500, color: "#8B5CF6", icon: "rocket" },
  { name: "Expert", minXP: 501, maxXP: 1000, color: "#F59E0B", icon: "star" },
  { name: "Master", minXP: 1001, maxXP: Infinity, color: "#EF4444", icon: "trophy" },
];

export function getCurrentTier(xp: number) {
  for (let i = XP_TIERS.length - 1; i >= 0; i--) {
    if (xp >= XP_TIERS[i].minXP) return XP_TIERS[i];
  }
  return XP_TIERS[0];
}

export function getNextTier(xp: number) {
  const currentIndex = XP_TIERS.findIndex((t) => xp >= t.minXP && xp <= t.maxXP);
  if (currentIndex < XP_TIERS.length - 1) return XP_TIERS[currentIndex + 1];
  return null;
}

export function getTierProgress(xp: number): number {
  const tier = getCurrentTier(xp);
  const next = getNextTier(xp);
  if (!next) return 1; // Already at max tier
  const range = next.minXP - tier.minXP;
  const progress = xp - tier.minXP;
  return Math.min(progress / range, 1);
}

// ─── WEEKLY TREND HELPER ─────────────────────────────────────────────────────
function getWeeklyTrend(scores: ExerciseScore[]): { day: string; xp: number }[] {
  const now = new Date();
  const days: { day: string; xp: number }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayEnd = dayStart + 86400000;

    const dayXP = scores
      .filter((s) => s.timestamp >= dayStart && s.timestamp < dayEnd)
      .reduce((sum, s) => sum + s.points, 0);

    days.push({ day: dayNames[date.getDay()], xp: dayXP });
  }

  return days;
}

export default function XPDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const [overallXP, setOverallXP] = useState<OverallXP | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<{ day: string; xp: number }[]>([]);

  const loadData = useCallback(async () => {
    const xp = await getOverallXP();
    setOverallXP(xp);
    const scores = await getStoredScores();
    setWeeklyTrend(getWeeklyTrend(scores));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!overallXP) return null;

  const tier = getCurrentTier(overallXP.totalXP);
  const nextTier = getNextTier(overallXP.totalXP);
  const progress = getTierProgress(overallXP.totalXP);
  const maxBarXP = Math.max(...weeklyTrend.map((d) => d.xp), 1);

  const renderLeaderboardItem = ({ item, index }: { item: CreatorScoreSummary; index: number }) => {
    const mastery = item.maxPossiblePoints > 0
      ? Math.round((item.totalPoints / item.maxPossiblePoints) * 100)
      : 0;
    const medals = ["🥇", "🥈", "🥉"];

    return (
      <View style={[styles.leaderboardRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.rankText}>{index < 3 ? medals[index] : `#${index + 1}`}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.creatorName, { color: colors.foreground }]}>{item.creatorName}</Text>
          <Text style={[styles.creatorMeta, { color: colors.muted }]}>
            {item.sessionsCompleted} sessions · {mastery}% mastery
          </Text>
        </View>
        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={14} color="#F59E0B" />
          <Text style={styles.xpBadgeText}>{item.totalPoints} XP</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <FlatList
        data={overallXP.creatorScores}
        keyExtractor={(item) => item.creatorId}
        renderItem={renderLeaderboardItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                style={[styles.backBtn, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="arrow-back" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>XP Dashboard</Text>
              <TouchableOpacity
                  onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/achievements" as any);
                }}
                style={[styles.backBtn, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="ribbon" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                  onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/leaderboard" as any);
                }}
                style={[styles.backBtn, { backgroundColor: colors.surface, marginLeft: 8 }]}
              >
                <Ionicons name="podium" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Total XP Card */}
            <View style={[styles.xpCard, { backgroundColor: tier.color + "15", borderColor: tier.color + "40" }]}>
              <View style={[styles.tierIconCircle, { backgroundColor: tier.color + "25" }]}>
                <Ionicons name={tier.icon as any} size={36} color={tier.color} />
              </View>
              <Text style={[styles.totalXPText, { color: tier.color }]}>
                {overallXP.totalXP} XP
              </Text>
              <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>

              {/* Progress to next tier */}
              {nextTier && (
                <View style={styles.progressSection}>
                  <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: tier.color }]}
                    />
                  </View>
                  <Text style={[styles.progressLabel, { color: colors.muted }]}>
                    {nextTier.minXP - overallXP.totalXP} XP to {nextTier.name}
                  </Text>
                </View>
              )}

              {/* Share Milestone Button */}
              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: tier.color }]}
                onPress={async () => {
                  if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  const message = `🏆 I'm a ${tier.name} on ConnectMe AI!\n\n⚡ ${overallXP.totalXP} XP earned\n📚 ${overallXP.totalExercisesCompleted} exercises completed\n🎯 ${overallXP.totalSessionsCompleted} sessions\n\nJoin me and start learning!`;
                  try {
                    await Share.share({ message, title: "My XP Progress" });
                  } catch (e) {
                    // User cancelled
                  }
                }}
              >
                <Ionicons name="share-social" size={16} color="#FFF" />
                <Text style={styles.shareButtonText}>Share Milestone</Text>
              </TouchableOpacity>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {overallXP.totalExercisesCompleted}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Exercises</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {overallXP.totalSessionsCompleted}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Sessions</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {overallXP.creatorScores.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Creators</Text>
                </View>
              </View>
            </View>

            {/* Weekly Trend Chart */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
            <View style={[styles.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.barsRow}>
                {weeklyTrend.map((day, i) => {
                  const barHeight = maxBarXP > 0 ? (day.xp / maxBarXP) * 100 : 0;
                  const isToday = i === 6;
                  return (
                    <View key={day.day} style={styles.barColumn}>
                      <Text style={[styles.barValue, { color: colors.muted }]}>
                        {day.xp > 0 ? day.xp : ""}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${Math.max(barHeight, 4)}%`,
                              backgroundColor: isToday ? tier.color : tier.color + "60",
                              borderRadius: 4,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: isToday ? tier.color : colors.muted, fontWeight: isToday ? "700" : "500" }]}>
                        {day.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {weeklyTrend.every((d) => d.xp === 0) && (
                <Text style={[styles.emptyChartText, { color: colors.muted }]}>
                  Complete exercises to see your weekly progress here
                </Text>
              )}
            </View>

            {/* Leaderboard Header */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Creator Leaderboard</Text>
            {overallXP.creatorScores.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="school-outline" size={40} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Complete creator exercises to see your leaderboard
                </Text>
                <TouchableOpacity
                  style={[styles.ctaButton, { backgroundColor: tier.color }]}
                  onPress={() => router.push("/creator-directory" as any)}
                >
                  <Text style={styles.ctaButtonText}>Browse Creators</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  xpCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 24,
  },
  tierIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  totalXPText: {
    fontSize: 36,
    fontWeight: "800",
  },
  tierName: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  progressSection: {
    width: "100%",
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    width: "100%",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  barsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barTrack: {
    flex: 1,
    width: 24,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    minHeight: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: "600",
    height: 14,
  },
  barLabel: {
    fontSize: 11,
  },
  emptyChartText: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 12,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  rankText: {
    fontSize: 18,
    width: 32,
    textAlign: "center",
  },
  creatorName: {
    fontSize: 15,
    fontWeight: "600",
  },
  creatorMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F59E0B15",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  xpBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F59E0B",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  ctaButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  ctaButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  shareButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
