import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const { width } = Dimensions.get("window");

type TimeRange = "week" | "month" | "year";

// Weekly data
const WEEKLY_DATA = {
  timeSpent: [45, 30, 60, 25, 50, 40, 35], // minutes per day
  lessonsCompleted: [3, 2, 4, 1, 3, 2, 2],
  xpEarned: [120, 85, 150, 60, 130, 95, 80],
  vocabMastered: [8, 5, 12, 3, 9, 6, 7],
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const MONTHLY_DATA = {
  timeSpent: [180, 210, 150, 240], // minutes per week
  lessonsCompleted: [12, 15, 10, 18],
  xpEarned: [520, 680, 450, 720],
  vocabMastered: [35, 42, 28, 50],
  days: ["Week 1", "Week 2", "Week 3", "Week 4"],
};

const STATS = {
  totalHours: 42,
  totalLessons: 156,
  totalXP: 8450,
  totalVocab: 312,
  currentStreak: 12,
  longestStreak: 28,
  coursesCompleted: 4,
  certificatesEarned: 6,
};

const XP_BREAKDOWN = [
  { label: "Lessons", value: 3200, color: Colors.secondary, icon: "book" },
  { label: "Flashcards", value: 1800, color: Colors.success, icon: "layers" },
  { label: "Pronunciation", value: 1200, color: Colors.accent, icon: "mic" },
  { label: "Streaks", value: 1050, color: "#F59E0B", icon: "flame" },
  { label: "Challenges", value: 700, color: "#8B5CF6", icon: "trophy" },
  { label: "Social", value: 500, color: "#EC4899", icon: "people" },
];

export default function ProgressDashboardScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const data = timeRange === "week" ? WEEKLY_DATA : MONTHLY_DATA;
  const maxTime = Math.max(...data.timeSpent);
  const maxXP = Math.max(...data.xpEarned);
  const totalXPBreakdown = XP_BREAKDOWN.reduce((a, b) => a + b.value, 0);

  const renderBarChart = (values: number[], max: number, color: string, label: string, unit: string) => (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{label}</Text>
        <Text style={styles.chartTotal}>
          {values.reduce((a, b) => a + b, 0)} {unit}
        </Text>
      </View>
      <View style={styles.barChart}>
        {values.map((val, i) => (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: `${Math.max((val / max) * 100, 5)}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{data.days[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={20} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Time range selector */}
        <View style={styles.timeRangeRow}>
          {(["week", "month", "year"] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeRangeBtn, timeRange === range && styles.timeRangeBtnActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
                {range === "week" ? "This Week" : range === "month" ? "This Month" : "This Year"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color={Colors.secondary} />
            <Text style={styles.statValue}>{STATS.totalHours}h</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book" size={20} color={Colors.success} />
            <Text style={styles.statValue}>{STATS.totalLessons}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{(STATS.totalXP / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="language" size={20} color="#8B5CF6" />
            <Text style={styles.statValue}>{STATS.totalVocab}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
        </View>

        {/* Streak card */}
        <View style={styles.streakCard}>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View>
                <Text style={styles.streakValue}>{STATS.currentStreak} days</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </View>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakEmoji}>🏆</Text>
              <View>
                <Text style={styles.streakValue}>{STATS.longestStreak} days</Text>
                <Text style={styles.streakLabel}>Longest Streak</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Time Spent Chart */}
        {renderBarChart(data.timeSpent, maxTime, Colors.secondary, "Time Spent", "min")}

        {/* XP Earned Chart */}
        {renderBarChart(data.xpEarned, maxXP, "#8B5CF6", "XP Earned", "XP")}

        {/* XP Breakdown */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>XP Breakdown</Text>
          <Text style={styles.chartSubtitle}>Where your XP comes from</Text>
          {XP_BREAKDOWN.map((item) => (
            <View key={item.label} style={styles.breakdownRow}>
              <View style={[styles.breakdownIcon, { backgroundColor: item.color + "20" }]}>
                <Ionicons name={item.icon as any} size={16} color={item.color} />
              </View>
              <Text style={styles.breakdownLabel}>{item.label}</Text>
              <View style={styles.breakdownBarTrack}>
                <View
                  style={[
                    styles.breakdownBarFill,
                    { width: `${(item.value / totalXPBreakdown) * 100}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={styles.breakdownValue}>{item.value.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Achievements summary */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: Colors.gold + "20" }]}>
                <Ionicons name="ribbon" size={22} color={Colors.gold} />
              </View>
              <Text style={styles.achievementValue}>{STATS.certificatesEarned}</Text>
              <Text style={styles.achievementLabel}>Certificates</Text>
            </View>
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: Colors.success + "20" }]}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
              </View>
              <Text style={styles.achievementValue}>{STATS.coursesCompleted}</Text>
              <Text style={styles.achievementLabel}>Courses Done</Text>
            </View>
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: Colors.accent + "20" }]}>
                <Ionicons name="flame" size={22} color={Colors.accent} />
              </View>
              <Text style={styles.achievementValue}>{STATS.longestStreak}</Text>
              <Text style={styles.achievementLabel}>Best Streak</Text>
            </View>
          </View>
        </View>

        {/* Lessons completed */}
        {renderBarChart(data.lessonsCompleted, Math.max(...data.lessonsCompleted), Colors.success, "Lessons Completed", "lessons")}

        {/* Quick links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.quickLink} onPress={() => router.push("/streak-calendar" as any)}>
            <Ionicons name="calendar" size={18} color={Colors.secondary} />
            <Text style={styles.quickLinkText}>View Streak Calendar</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink} onPress={() => router.push("/my-certificates" as any)}>
            <Ionicons name="ribbon" size={18} color={Colors.gold} />
            <Text style={styles.quickLinkText}>View Certificates</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink} onPress={() => router.push("/leaderboard" as any)}>
            <Ionicons name="podium" size={18} color="#8B5CF6" />
            <Text style={styles.quickLinkText}>View Leaderboard</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  timeRangeRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeRangeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  timeRangeBtnActive: {
    backgroundColor: Colors.secondary + "20",
  },
  timeRangeText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  timeRangeTextActive: {
    color: Colors.secondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 60) / 4 - 10,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  streakCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  streakEmoji: {
    fontSize: 28,
  },
  streakValue: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  streakLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  chartCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  chartTotal: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
  },
  barTrack: {
    flex: 1,
    width: "70%",
    backgroundColor: Colors.border + "50",
    borderRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 6,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  breakdownIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  breakdownLabel: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    width: 80,
  },
  breakdownBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border + "50",
    borderRadius: 4,
    overflow: "hidden",
  },
  breakdownBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  breakdownValue: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
    width: 45,
    textAlign: "right",
  },
  achievementsGrid: {
    flexDirection: "row",
    marginTop: 12,
    gap: 12,
  },
  achievementItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementValue: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  achievementLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  quickLinks: {
    gap: 8,
  },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickLinkText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
});
