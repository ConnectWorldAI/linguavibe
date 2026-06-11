import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAnalyticsSummary,
  getEventCounts,
  getStoredBatches,
  type AnalyticsSummary,
  type AnalyticsEventName,
} from "@/lib/analytics";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface DashboardStats {
  lessonsCompleted: number;
  duelsPlayed: number;
  duelsWon: number;
  voiceRoomsJoined: number;
  achievementsUnlocked: number;
  referralsShared: number;
  invitesSent: number;
  dailyChallengesCompleted: number;
  callsCompleted: number;
  streakRecord: number;
  currentStreak: number;
  totalSessions: number;
  totalTimeMinutes: number;
  wordsLearned: number;
  firstActivityDate: string | null;
  daysSinceStart: number;
}

interface WeeklyTrend {
  label: string;
  lessons: number;
  duels: number;
  minutes: number;
}

type TimeRange = "week" | "month" | "all";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function formatDate(ts: number | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysBetween(ts1: number, ts2: number): number {
  return Math.floor(Math.abs(ts2 - ts1) / (1000 * 60 * 60 * 24));
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function AnalyticsDashboardScreen() {
  const colors = useColors();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const summary = await getAnalyticsSummary();
      const counts = await getEventCounts([
        "lesson_complete",
        "duel_played",
        "voice_room_joined",
        "achievement_unlocked",
        "referral_shared",
        "invite_sent",
        "daily_challenge_completed",
        "call_completed",
        "streak_maintained",
      ] as AnalyticsEventName[]);

      // Load streak data from AsyncStorage
      const streakData = await AsyncStorage.getItem("@streak_data");
      const streak = streakData ? JSON.parse(streakData) : { current: 0, best: 0 };

      // Load words learned count
      const vocabData = await AsyncStorage.getItem("@mastered_words");
      const wordsLearned = vocabData ? JSON.parse(vocabData).length : 0;

      // Estimate time from session count (avg 8 min per session)
      const estimatedMinutes = summary.sessionsCount * 8;

      // Calculate win rate from batches
      const batches = await getStoredBatches();
      let duelsWon = 0;
      for (const batch of batches) {
        for (const event of batch.events) {
          if (event.name === "duel_played" && event.properties?.won === "true") {
            duelsWon++;
          }
        }
      }

      const dashStats: DashboardStats = {
        lessonsCompleted: counts["lesson_complete"] || 0,
        duelsPlayed: counts["duel_played"] || 0,
        duelsWon,
        voiceRoomsJoined: counts["voice_room_joined"] || 0,
        achievementsUnlocked: counts["achievement_unlocked"] || 0,
        referralsShared: counts["referral_shared"] || 0,
        invitesSent: counts["invite_sent"] || 0,
        dailyChallengesCompleted: counts["daily_challenge_completed"] || 0,
        callsCompleted: counts["call_completed"] || 0,
        streakRecord: streak.best || 0,
        currentStreak: streak.current || 0,
        totalSessions: summary.sessionsCount,
        totalTimeMinutes: estimatedMinutes,
        wordsLearned,
        firstActivityDate: formatDate(summary.firstEvent),
        daysSinceStart: summary.firstEvent ? daysBetween(summary.firstEvent, Date.now()) : 0,
      };

      setStats(dashStats);

      // Generate mock weekly trends based on total data
      const weeks: WeeklyTrend[] = [];
      const totalLessons = dashStats.lessonsCompleted;
      const totalDuels = dashStats.duelsPlayed;
      const totalMins = dashStats.totalTimeMinutes;
      const weekCount = Math.max(4, Math.ceil(dashStats.daysSinceStart / 7));
      for (let i = 0; i < Math.min(weekCount, 8); i++) {
        const weekLabel = i === 0 ? "This Week" : i === 1 ? "Last Week" : `${i} Weeks Ago`;
        const factor = Math.max(0.1, 1 - i * 0.15 + Math.random() * 0.2);
        weeks.push({
          label: weekLabel,
          lessons: Math.round((totalLessons / weekCount) * factor),
          duels: Math.round((totalDuels / weekCount) * factor),
          minutes: Math.round((totalMins / weekCount) * factor),
        });
      }
      setWeeklyTrends(weeks);
    } catch {}
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const winRate = stats && stats.duelsPlayed > 0
    ? Math.round((stats.duelsWon / stats.duelsPlayed) * 100)
    : 0;

  const maxBarValue = Math.max(...weeklyTrends.map(w => w.minutes), 1);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>My Progress</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Journey Summary */}
        {stats && (
          <View style={[styles.journeyCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
            <Ionicons name="rocket" size={24} color={colors.primary} />
            <View style={styles.journeyText}>
              <Text style={[styles.journeyTitle, { color: colors.foreground }]}>
                {stats.daysSinceStart > 0
                  ? `${stats.daysSinceStart} Days of Learning`
                  : "Welcome to Your Journey!"}
              </Text>
              <Text style={[styles.journeySubtitle, { color: colors.muted }]}>
                {stats.firstActivityDate
                  ? `Started ${stats.firstActivityDate}`
                  : "Complete your first lesson to start tracking"}
              </Text>
            </View>
          </View>
        )}

        {/* Key Metrics Grid */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="book" label="Lessons" value={stats?.lessonsCompleted ?? 0}
            color="#4CAF50" bgColor="#4CAF5015" textColor={colors.foreground} mutedColor={colors.muted}
          />
          <MetricCard
            icon="flash" label="Duels" value={stats?.duelsPlayed ?? 0}
            color="#FF9800" bgColor="#FF980015" textColor={colors.foreground} mutedColor={colors.muted}
          />
          <MetricCard
            icon="time" label="Minutes" value={stats?.totalTimeMinutes ?? 0}
            color="#2196F3" bgColor="#2196F315" textColor={colors.foreground} mutedColor={colors.muted}
          />
          <MetricCard
            icon="flame" label="Streak" value={stats?.currentStreak ?? 0}
            color="#F44336" bgColor="#F4433615" textColor={colors.foreground} mutedColor={colors.muted}
          />
        </View>

        {/* Detailed Stats */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Detailed Stats</Text>
        <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <StatRow icon="trophy" label="Duel Win Rate" value={`${winRate}%`} color={colors.foreground} mutedColor={colors.muted} accentColor="#FF9800" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow icon="mic" label="Voice Rooms Joined" value={`${stats?.voiceRoomsJoined ?? 0}`} color={colors.foreground} mutedColor={colors.muted} accentColor="#9C27B0" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow icon="medal" label="Achievements Unlocked" value={`${stats?.achievementsUnlocked ?? 0}`} color={colors.foreground} mutedColor={colors.muted} accentColor="#FFD700" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow icon="call" label="AI Calls Completed" value={`${stats?.callsCompleted ?? 0}`} color={colors.foreground} mutedColor={colors.muted} accentColor="#00BCD4" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow icon="calendar" label="Daily Challenges" value={`${stats?.dailyChallengesCompleted ?? 0}`} color={colors.foreground} mutedColor={colors.muted} accentColor="#8BC34A" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow icon="people" label="Referrals Shared" value={`${stats?.referralsShared ?? 0}`} color={colors.foreground} mutedColor={colors.muted} accentColor="#E91E63" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <StatRow icon="school" label="Words Learned" value={`${stats?.wordsLearned ?? 0}`} color={colors.foreground} mutedColor={colors.muted} accentColor="#3F51B5" />
        </View>

        {/* Weekly Activity Chart */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Weekly Activity</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {weeklyTrends.length > 0 ? (
            weeklyTrends.slice(0, 4).map((week, i) => (
              <View key={i} style={styles.chartRow}>
                <Text style={[styles.chartLabel, { color: colors.muted }]} numberOfLines={1}>
                  {week.label}
                </Text>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        backgroundColor: colors.primary,
                        width: `${Math.max(5, (week.minutes / maxBarValue) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartValue, { color: colors.foreground }]}>
                  {week.minutes}m
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Complete some activities to see your trends
            </Text>
          )}
        </View>

        {/* Most Used Features */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Most Used Features</Text>
        <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {stats ? (
            (() => {
              const featureEntries = [
                { id: "lessons", label: "Lessons", count: stats.lessonsCompleted, icon: "book", color: "#4CAF50" },
                { id: "duels", label: "Duels", count: stats.duelsPlayed, icon: "flash", color: "#FF9800" },
                { id: "voice-rooms", label: "Voice Rooms", count: stats.voiceRoomsJoined, icon: "mic", color: "#9C27B0" },
                { id: "calls", label: "AI Calls", count: stats.callsCompleted, icon: "call", color: "#00BCD4" },
                { id: "challenges", label: "Daily Challenges", count: stats.dailyChallengesCompleted, icon: "calendar", color: "#8BC34A" },
                { id: "referrals", label: "Referrals", count: stats.referralsShared, icon: "people", color: "#E91E63" },
              ].filter(f => f.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
              const maxCount = featureEntries[0]?.count || 1;
              if (featureEntries.length === 0) {
                return (
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    Start using features to see your usage stats here
                  </Text>
                );
              }
              return featureEntries.map((feature, i) => (
                <View key={feature.id}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.statRow}>
                    <View style={[styles.statIconBg, { backgroundColor: feature.color + "15" }]}>
                      <Ionicons name={feature.icon as any} size={18} color={feature.color} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.statLabel, { color: colors.muted, flex: undefined }]}>{feature.label}</Text>
                      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                        <View style={{ height: 4, backgroundColor: feature.color, borderRadius: 2, width: `${(feature.count / maxCount) * 100}%` }} />
                      </View>
                    </View>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{feature.count}×</Text>
                  </View>
                </View>
              ));
            })()
          ) : null}
        </View>

        {/* Personal Bests */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Bests</Text>
        <View style={styles.bestsGrid}>
          <View style={[styles.bestCard, { backgroundColor: "#FFD70015", borderColor: "#FFD70030" }]}>
            <Ionicons name="flame" size={28} color="#F44336" />
            <Text style={[styles.bestValue, { color: colors.foreground }]}>{stats?.streakRecord ?? 0}</Text>
            <Text style={[styles.bestLabel, { color: colors.muted }]}>Best Streak</Text>
          </View>
          <View style={[styles.bestCard, { backgroundColor: "#4CAF5015", borderColor: "#4CAF5030" }]}>
            <Ionicons name="school" size={28} color="#4CAF50" />
            <Text style={[styles.bestValue, { color: colors.foreground }]}>{stats?.wordsLearned ?? 0}</Text>
            <Text style={[styles.bestLabel, { color: colors.muted }]}>Words Mastered</Text>
          </View>
          <View style={[styles.bestCard, { backgroundColor: "#2196F315", borderColor: "#2196F330" }]}>
            <Ionicons name="apps" size={28} color="#2196F3" />
            <Text style={[styles.bestValue, { color: colors.foreground }]}>{stats?.totalSessions ?? 0}</Text>
            <Text style={[styles.bestLabel, { color: colors.muted }]}>Total Sessions</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function MetricCard({
  icon, label, value, color, bgColor, textColor, mutedColor,
}: {
  icon: string; label: string; value: number; color: string; bgColor: string; textColor: string; mutedColor: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: bgColor, borderColor: color + "30" }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.metricValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: mutedColor }]}>{label}</Text>
    </View>
  );
}

function StatRow({
  icon, label, value, color, mutedColor, accentColor,
}: {
  icon: string; label: string; value: string; color: string; mutedColor: string; accentColor: string;
}) {
  return (
    <View style={styles.statRow}>
      <View style={[styles.statIconBg, { backgroundColor: accentColor + "15" }]}>
        <Ionicons name={icon as any} size={18} color={accentColor} />
      </View>
      <Text style={[styles.statLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  journeyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  journeyText: {
    flex: 1,
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  journeySubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  statIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginLeft: 46,
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  chartLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: "500",
  },
  chartBarContainer: {
    flex: 1,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(128,128,128,0.1)",
    overflow: "hidden",
  },
  chartBar: {
    height: "100%",
    borderRadius: 10,
    opacity: 0.8,
  },
  chartValue: {
    width: 40,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 20,
  },
  bestsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  bestCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  bestValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  bestLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
});
