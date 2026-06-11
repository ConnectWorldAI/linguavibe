import React, { useState, useEffect } from "react";
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
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  DAILY_MILESTONES,
  getDailyMilestoneState,
  isPerfectDay,
  PERFECT_DAY_BONUS,
  type DailyMilestoneState,
  type Milestone,
} from "@/lib/streak-bonus";
import {
  getPerfectDayStreak,
  getNextStreakBonus,
  type PerfectDayStreak,
} from "@/lib/perfect-day-streak";
import { sharePerfectDay, shareMilestoneAchievement } from "@/lib/milestone-sharing";

export default function MilestonesScreen() {
  const [state, setState] = useState<DailyMilestoneState>({
    date: new Date().toISOString().split("T")[0],
    completedIds: [],
    dailyTalk: 0,
    dailyVideo: 0,
    dailySong: 0,
    dailyTeacher: 0,
  });

  const [perfectStreak, setPerfectStreak] = useState<PerfectDayStreak>({
    currentStreak: 0,
    lastPerfectDay: "",
    longestStreak: 0,
    totalPerfectDays: 0,
    lastBonusAwarded: 0,
  });

  useEffect(() => {
    getDailyMilestoneState().then(setState);
    getPerfectDayStreak().then(setPerfectStreak);
  }, []);

  const totalMinutes = state.dailyTalk + state.dailyVideo + state.dailyTeacher;
  const creditsEarnedToday = DAILY_MILESTONES.filter((m) =>
    state.completedIds.includes(m.id)
  ).reduce((sum, m) => sum + m.credits, 0);
  const completedCount = state.completedIds.length;

  const getProgress = (milestone: Milestone): number => {
    let current = 0;
    switch (milestone.requirement.category) {
      case "talk":
        current = state.dailyTalk;
        break;
      case "video":
        current = state.dailyVideo;
        break;
      case "song":
        current = state.dailySong;
        break;
      case "teacher":
        current = state.dailyTeacher;
        break;
      case "total":
        current = totalMinutes;
        break;
    }
    return Math.min(current / milestone.requirement.amount, 1);
  };

  const isCompleted = (milestone: Milestone): boolean =>
    state.completedIds.includes(milestone.id);

  const renderMilestone = ({ item }: { item: Milestone }) => {
    const completed = isCompleted(item);
    const progress = getProgress(item);
    const progressPct = Math.round(progress * 100);

    return (
      <View style={[styles.milestoneCard, completed && styles.milestoneCompleted]}>
        <View style={styles.milestoneLeft}>
          <View
            style={[
              styles.iconCircle,
              completed && styles.iconCircleCompleted,
            ]}
          >
            {completed ? (
              <Ionicons name="checkmark" size={20} color={Colors.primary} />
            ) : (
              <Ionicons
                name={item.icon as any}
                size={20}
                color={progress > 0 ? Colors.secondary : Colors.textMuted}
              />
            )}
          </View>
        </View>
        <View style={styles.milestoneContent}>
          <View style={styles.milestoneHeader}>
            <Text
              style={[
                styles.milestoneTitle,
                completed && styles.milestoneTitleCompleted,
              ]}
            >
              {item.title}
            </Text>
            <View style={[styles.creditsBadge, completed && styles.creditsBadgeCompleted]}>
              <Text
                style={[
                  styles.creditsText,
                  completed && styles.creditsTextCompleted,
                ]}
              >
                +{item.credits}
              </Text>
              <Ionicons
                name="diamond"
                size={10}
                color={completed ? Colors.primary : Colors.gold}
              />
            </View>
          </View>
          <Text style={styles.milestoneDesc}>{item.description}</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPct}%`,
                    backgroundColor: completed ? Colors.success : Colors.secondary,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completed ? "Done!" : `${progressPct}%`}
            </Text>
            {completed && (
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  shareMilestoneAchievement(item);
                }}
                style={styles.milestoneShareBtn}
              >
                <Ionicons name="share-social-outline" size={14} color={Colors.success} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Daily Milestones</Text>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            sharePerfectDay({
              milestoneCompleted: completedCount,
              totalMilestones: DAILY_MILESTONES.length,
              creditsEarned: creditsEarnedToday,
              perfectDayStreak: perfectStreak.currentStreak,
              longestStreak: perfectStreak.longestStreak,
            });
          }}
          style={styles.shareBtn}
        >
          <Ionicons name="share-outline" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{creditsEarnedToday}</Text>
          <Text style={styles.summaryLabel}>Credits Earned</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {completedCount}/{DAILY_MILESTONES.length}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalMinutes}m</Text>
          <Text style={styles.summaryLabel}>Total Today</Text>
        </View>
      </View>

      {/* Perfect Day Card */}
      {isPerfectDay(state) && (
        <View style={styles.perfectDayCard}>
          <Text style={styles.perfectDayEmoji}>🌟</Text>
          <View style={styles.perfectDayContent}>
            <Text style={styles.perfectDayTitle}>Perfect Day!</Text>
            <Text style={styles.perfectDayDesc}>
              All milestones completed! +{PERFECT_DAY_BONUS} bonus credits (2x multiplier)
            </Text>
          </View>
        </View>
      )}

      {/* Perfect Day Streak */}
      {perfectStreak.totalPerfectDays > 0 && (
        <View style={styles.streakSection}>
          <View style={styles.streakRow}>
            <View style={styles.streakStat}>
              <Text style={styles.streakStatValue}>{perfectStreak.currentStreak}</Text>
              <Text style={styles.streakStatLabel}>Current Streak</Text>
            </View>
            <View style={styles.streakStat}>
              <Text style={styles.streakStatValue}>{perfectStreak.longestStreak}</Text>
              <Text style={styles.streakStatLabel}>Best Streak</Text>
            </View>
            <View style={styles.streakStat}>
              <Text style={styles.streakStatValue}>{perfectStreak.totalPerfectDays}</Text>
              <Text style={styles.streakStatLabel}>Total Perfect</Text>
            </View>
          </View>
          {getNextStreakBonus(perfectStreak.currentStreak) && (
            <View style={styles.nextBonusRow}>
              <Text style={styles.nextBonusLabel}>
                {getNextStreakBonus(perfectStreak.currentStreak)!.emoji} Next bonus at{" "}
                {getNextStreakBonus(perfectStreak.currentStreak)!.streak} days:{" "}
                +{getNextStreakBonus(perfectStreak.currentStreak)!.credits} credits
              </Text>
              <View style={styles.nextBonusBar}>
                <View
                  style={[
                    styles.nextBonusBarFill,
                    {
                      width: `${Math.min(
                        (perfectStreak.currentStreak /
                          getNextStreakBonus(perfectStreak.currentStreak)!.streak) *
                          100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Overall Progress */}
      <View style={styles.overallProgress}>
        <View style={styles.overallHeader}>
          <Text style={styles.overallTitle}>Today's Progress</Text>
          <Text style={styles.overallPct}>
            {Math.round((completedCount / DAILY_MILESTONES.length) * 100)}%
          </Text>
        </View>
        <View style={styles.overallBarBg}>
          <View
            style={[
              styles.overallBarFill,
              {
                width: `${(completedCount / DAILY_MILESTONES.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Weekly Recap Link */}
      <TouchableOpacity
        style={styles.weeklyRecapLink}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/weekly-recap" as any);
        }}
      >
        <Ionicons name="calendar-outline" size={18} color={Colors.secondary} />
        <Text style={styles.weeklyRecapText}>View Weekly Recap</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Milestones List */}
      <FlatList
        data={DAILY_MILESTONES}
        renderItem={renderMilestone}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.gold,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  overallProgress: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  overallTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  overallPct: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.secondary,
  },
  overallBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0, 170, 255, 0.15)",
    overflow: "hidden",
  },
  overallBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: 100,
    gap: Spacing.sm,
  },
  milestoneCard: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  milestoneCompleted: {
    borderColor: Colors.greenBorder,
    backgroundColor: "rgba(0, 255, 136, 0.04)",
  },
  milestoneLeft: {
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleCompleted: {
    backgroundColor: Colors.success,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  milestoneTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  milestoneTitleCompleted: {
    color: Colors.success,
  },
  creditsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.goldGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  creditsBadgeCompleted: {
    backgroundColor: Colors.greenGlow,
  },
  creditsText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gold,
  },
  creditsTextCompleted: {
    color: Colors.success,
  },
  milestoneDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
    width: 40,
    textAlign: "right",
  },
  perfectDayCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.goldGlow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    gap: Spacing.sm,
  },
  perfectDayEmoji: {
    fontSize: 32,
  },
  perfectDayContent: {
    flex: 1,
  },
  perfectDayTitle: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.gold,
  },
  perfectDayDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  shareBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
  },
  milestoneShareBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(0, 255, 136, 0.1)",
    marginLeft: 4,
  },
  weeklyRecapLink: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  weeklyRecapText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
  streakSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  streakStat: {
    alignItems: "center",
  },
  streakStatValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.gold,
  },
  streakStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  nextBonusRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextBonusLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  nextBonusBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    overflow: "hidden",
  },
  nextBonusBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
});
