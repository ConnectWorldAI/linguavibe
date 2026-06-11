import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { shareWeeklyRecap } from "@/lib/milestone-sharing";

const WEEKLY_RECAP_KEY = "@connectworld_weekly_recap";

interface DayRecap {
  date: string;
  dayName: string;
  milestonesCompleted: number;
  creditsEarned: number;
  minutesLearned: number;
  isPerfectDay: boolean;
}

interface WeeklyStats {
  days: DayRecap[];
  totalMilestones: number;
  totalCredits: number;
  totalMinutes: number;
  perfectDays: number;
  bestDay: DayRecap | null;
  previousWeekMilestones: number;
}

export default function WeeklyRecapScreen() {
  const [stats, setStats] = useState<WeeklyStats>({
    days: [],
    totalMilestones: 0,
    totalCredits: 0,
    totalMinutes: 0,
    perfectDays: 0,
    bestDay: null,
    previousWeekMilestones: 0,
  });

  useEffect(() => {
    loadWeeklyStats();
  }, []);

  const loadWeeklyStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(WEEKLY_RECAP_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStats(parsed);
      } else {
        // Generate sample data for current week
        const days = generateCurrentWeekData();
        const totalMilestones = days.reduce((s, d) => s + d.milestonesCompleted, 0);
        const totalCredits = days.reduce((s, d) => s + d.creditsEarned, 0);
        const totalMinutes = days.reduce((s, d) => s + d.minutesLearned, 0);
        const perfectDays = days.filter((d) => d.isPerfectDay).length;
        const bestDay = days.reduce((best, d) =>
          d.milestonesCompleted > (best?.milestonesCompleted || 0) ? d : best,
          days[0]
        );

        const weekStats: WeeklyStats = {
          days,
          totalMilestones,
          totalCredits,
          totalMinutes,
          perfectDays,
          bestDay,
          previousWeekMilestones: Math.floor(totalMilestones * 0.8),
        };
        setStats(weekStats);
        await AsyncStorage.setItem(WEEKLY_RECAP_KEY, JSON.stringify(weekStats));
      }
    } catch {}
  };

  const generateCurrentWeekData = (): DayRecap[] => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const days: DayRecap[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + mondayOffset + i);
      const isPast = date <= today;

      days.push({
        date: date.toISOString().split("T")[0],
        dayName: dayNames[i],
        milestonesCompleted: isPast ? Math.floor(Math.random() * 5) + 3 : 0,
        creditsEarned: isPast ? Math.floor(Math.random() * 20) + 10 : 0,
        minutesLearned: isPast ? Math.floor(Math.random() * 30) + 5 : 0,
        isPerfectDay: isPast ? Math.random() > 0.7 : false,
      });
    }
    return days;
  };

  const weekOverWeekChange = stats.previousWeekMilestones > 0
    ? Math.round(((stats.totalMilestones - stats.previousWeekMilestones) / stats.previousWeekMilestones) * 100)
    : 0;

  const handleShare = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    shareWeeklyRecap({
      totalMilestones: stats.totalMilestones,
      totalCredits: stats.totalCredits,
      perfectDays: stats.perfectDays,
      bestDay: stats.bestDay?.dayName || "N/A",
      minutesLearned: stats.totalMinutes,
    });
  };

  const maxMilestones = Math.max(...stats.days.map((d) => d.milestonesCompleted), 1);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Recap</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Week Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>This Week's Highlights</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>🎯</Text>
              <Text style={styles.summaryValue}>{stats.totalMilestones}</Text>
              <Text style={styles.summaryLabel}>Milestones</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>💰</Text>
              <Text style={styles.summaryValue}>{stats.totalCredits}</Text>
              <Text style={styles.summaryLabel}>Credits</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>⭐</Text>
              <Text style={styles.summaryValue}>{stats.perfectDays}</Text>
              <Text style={styles.summaryLabel}>Perfect Days</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>⏱️</Text>
              <Text style={styles.summaryValue}>{stats.totalMinutes}m</Text>
              <Text style={styles.summaryLabel}>Learning</Text>
            </View>
          </View>
        </View>

        {/* Week-over-Week Comparison */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonTitle}>vs. Last Week</Text>
            <View style={[styles.changeBadge, weekOverWeekChange >= 0 ? styles.changePositive : styles.changeNegative]}>
              <Ionicons
                name={weekOverWeekChange >= 0 ? "trending-up" : "trending-down"}
                size={14}
                color={weekOverWeekChange >= 0 ? Colors.success : Colors.error}
              />
              <Text style={[styles.changeText, weekOverWeekChange >= 0 ? styles.changeTextPositive : styles.changeTextNegative]}>
                {weekOverWeekChange >= 0 ? "+" : ""}{weekOverWeekChange}%
              </Text>
            </View>
          </View>
          <Text style={styles.comparisonDesc}>
            {weekOverWeekChange > 0
              ? "Great progress! You're improving week over week 🚀"
              : weekOverWeekChange === 0
              ? "Consistent effort! Keep it up 💪"
              : "A bit quieter this week. Let's bounce back! 💪"}
          </Text>
        </View>

        {/* Daily Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Milestones</Text>
          <View style={styles.chartContainer}>
            {stats.days.map((day, index) => (
              <View key={index} style={styles.chartColumn}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(day.milestonesCompleted / maxMilestones) * 100}%`,
                        backgroundColor: day.isPerfectDay
                          ? Colors.gold
                          : day.milestonesCompleted > 0
                          ? Colors.secondary
                          : Colors.border,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day.dayName}</Text>
                {day.isPerfectDay && <Text style={styles.perfectStar}>⭐</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Best Day */}
        {stats.bestDay && (
          <View style={styles.bestDayCard}>
            <Text style={styles.bestDayEmoji}>🏆</Text>
            <View style={styles.bestDayContent}>
              <Text style={styles.bestDayTitle}>Best Day: {stats.bestDay.dayName}</Text>
              <Text style={styles.bestDayDesc}>
                {stats.bestDay.milestonesCompleted} milestones • {stats.bestDay.creditsEarned} credits • {stats.bestDay.minutesLearned}m learning
              </Text>
            </View>
          </View>
        )}

        {/* Motivational Message */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationEmoji}>
            {stats.perfectDays >= 5 ? "🌟" : stats.perfectDays >= 3 ? "🔥" : stats.perfectDays >= 1 ? "💪" : "🌱"}
          </Text>
          <Text style={styles.motivationText}>
            {stats.perfectDays >= 5
              ? "Incredible week! You're a language learning machine!"
              : stats.perfectDays >= 3
              ? "Awesome consistency! Keep pushing for more Perfect Days!"
              : stats.perfectDays >= 1
              ? "Great start! Try to hit more milestones each day."
              : "Every journey starts with a single step. Keep going!"}
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/milestones" as any);
          }}
        >
          <Text style={styles.ctaBtnText}>View Today's Milestones</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  shareBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  comparisonCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  comparisonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  comparisonTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changePositive: {
    backgroundColor: "rgba(0, 255, 136, 0.1)",
  },
  changeNegative: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  changeText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  changeTextPositive: {
    color: Colors.success,
  },
  changeTextNegative: {
    color: Colors.error,
  },
  comparisonDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  chartCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 120,
  },
  chartColumn: {
    alignItems: "center",
    flex: 1,
  },
  barContainer: {
    width: 24,
    height: 90,
    justifyContent: "flex-end",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  perfectStar: {
    fontSize: 10,
    marginTop: 2,
  },
  bestDayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.goldGlow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    gap: Spacing.sm,
  },
  bestDayEmoji: {
    fontSize: 28,
  },
  bestDayContent: {
    flex: 1,
  },
  bestDayTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.gold,
  },
  bestDayDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  motivationCard: {
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  motivationEmoji: {
    fontSize: 36,
  },
  motivationText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  ctaBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#fff",
  },
});
