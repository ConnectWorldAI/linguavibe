/**
 * Progress Milestones Screen
 * Celebratory animations and credit bonuses at 25%, 50%, 75%, 100% of learning goal.
 * Shows milestone history and shareable achievement cards.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

const Colors = {
  bg: "#0A0E1A",
  card: "#141B2D",
  cardBorder: "#1E293B",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  primary: "#00AAFF",
  warning: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
  purple: "#8B5CF6",
  orange: "#F97316",
  gold: "#FFD700",
  pink: "#EC4899",
};

interface Milestone {
  id: string;
  percentage: number;
  title: string;
  description: string;
  icon: string;
  creditBonus: number;
  xpBonus: number;
  badge: string;
  unlocked: boolean;
  unlockedDate?: string;
  celebration: string;
}

const MILESTONES: Milestone[] = [
  {
    id: "m25",
    percentage: 25,
    title: "Foundation Builder",
    description: "You've completed 25% of your learning goal. The basics are locked in!",
    icon: "construct",
    creditBonus: 50,
    xpBonus: 500,
    badge: "🏗️",
    unlocked: true,
    unlockedDate: "May 10, 2026",
    celebration: "confetti",
  },
  {
    id: "m50",
    percentage: 50,
    title: "Halfway Hero",
    description: "50% complete! You're conversational and growing fast.",
    icon: "rocket",
    creditBonus: 100,
    xpBonus: 1000,
    badge: "🚀",
    unlocked: true,
    unlockedDate: "May 18, 2026",
    celebration: "fireworks",
  },
  {
    id: "m75",
    percentage: 75,
    title: "Almost Fluent",
    description: "75% done! You can handle complex conversations with confidence.",
    icon: "flame",
    creditBonus: 200,
    xpBonus: 2000,
    badge: "🔥",
    unlocked: false,
    celebration: "sparkles",
  },
  {
    id: "m100",
    percentage: 100,
    title: "Goal Achieved",
    description: "100%! You've reached your fluency target. Time to celebrate!",
    icon: "trophy",
    creditBonus: 500,
    xpBonus: 5000,
    badge: "🏆",
    unlocked: false,
    celebration: "mega_confetti",
  },
];

interface RewardHistory {
  date: string;
  milestone: string;
  credits: number;
  xp: number;
}

const REWARD_HISTORY: RewardHistory[] = [
  { date: "May 18, 2026", milestone: "Halfway Hero", credits: 100, xp: 1000 },
  { date: "May 10, 2026", milestone: "Foundation Builder", credits: 50, xp: 500 },
];

export default function ProgressMilestonesScreen() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const currentProgress = 58; // percent toward goal

  const handleCelebrate = (id: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCelebratingId(id);
    setShowCelebration(true);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const handleShare = (milestone: Milestone) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In production: generate shareable card image and open share sheet
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Milestones</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Overall Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Your Learning Journey</Text>
            <Text style={styles.progressPercent}>{currentProgress}%</Text>
          </View>
          <Text style={styles.progressSub}>Spanish B2 Fluency Goal</Text>
          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarFill, { width: `${currentProgress}%` }]} />
            {/* Milestone markers */}
            {[25, 50, 75, 100].map((pct) => (
              <View key={pct} style={[styles.milestoneMarker, { left: `${pct}%` }]}>
                <View
                  style={[
                    styles.markerDot,
                    pct <= currentProgress ? styles.markerDotDone : styles.markerDotPending,
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0%</Text>
            <Text style={styles.progressLabel}>25%</Text>
            <Text style={styles.progressLabel}>50%</Text>
            <Text style={styles.progressLabel}>75%</Text>
            <Text style={styles.progressLabel}>100%</Text>
          </View>
        </View>

        {/* Celebration Overlay */}
        {showCelebration && (
          <View style={styles.celebrationBanner}>
            <Text style={styles.celebrationEmoji}>🎉✨🎊</Text>
            <Text style={styles.celebrationText}>Milestone Unlocked!</Text>
          </View>
        )}

        {/* Milestone Cards */}
        <Text style={styles.sectionTitle}>Your Milestones</Text>
        {MILESTONES.map((milestone) => (
          <Animated.View
            key={milestone.id}
            style={[
              styles.milestoneCard,
              milestone.unlocked && styles.milestoneCardUnlocked,
              celebratingId === milestone.id && { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.milestoneHeader}>
              <View
                style={[
                  styles.milestoneIconWrap,
                  { backgroundColor: milestone.unlocked ? Colors.gold + "20" : Colors.cardBorder },
                ]}
              >
                <Text style={styles.milestoneBadge}>{milestone.badge}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.milestoneTitleRow}>
                  <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  <Text style={styles.milestonePercent}>{milestone.percentage}%</Text>
                </View>
                <Text style={styles.milestoneDesc}>{milestone.description}</Text>
                {milestone.unlockedDate && (
                  <Text style={styles.milestoneDate}>Unlocked {milestone.unlockedDate}</Text>
                )}
              </View>
            </View>

            {/* Rewards */}
            <View style={styles.rewardsRow}>
              <View style={styles.rewardItem}>
                <Ionicons name="flash" size={14} color={Colors.gold} />
                <Text style={styles.rewardText}>+{milestone.xpBonus} XP</Text>
              </View>
              <View style={styles.rewardItem}>
                <Ionicons name="diamond" size={14} color={Colors.primary} />
                <Text style={styles.rewardText}>+{milestone.creditBonus} credits</Text>
              </View>
              {milestone.unlocked && (
                <View style={styles.rewardItem}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={[styles.rewardText, { color: Colors.success }]}>Claimed</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            {milestone.unlocked ? (
              <View style={styles.milestoneActions}>
                <TouchableOpacity
                  style={styles.celebrateBtn}
                  onPress={() => handleCelebrate(milestone.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.celebrateBtnText}>🎉 Celebrate Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => handleShare(milestone)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-outline" size={16} color={Colors.primary} />
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.lockedBanner}>
                <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
                <Text style={styles.lockedText}>
                  {milestone.percentage - currentProgress}% more to unlock
                </Text>
              </View>
            )}
          </Animated.View>
        ))}

        {/* Reward History */}
        <Text style={styles.sectionTitle}>Reward History</Text>
        <View style={styles.historyCard}>
          {REWARD_HISTORY.map((item, idx) => (
            <View key={idx} style={[styles.historyItem, idx > 0 && styles.historyItemBorder]}>
              <View>
                <Text style={styles.historyMilestone}>{item.milestone}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>
              <View style={styles.historyRewards}>
                <Text style={styles.historyCredits}>+{item.credits} 💎</Text>
                <Text style={styles.historyXp}>+{item.xp} XP</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total Earned */}
        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>Total Milestone Rewards Earned</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>150</Text>
              <Text style={styles.totalLabel}>Credits</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>1,500</Text>
              <Text style={styles.totalLabel}>XP</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>2</Text>
              <Text style={styles.totalLabel}>Badges</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },

  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  progressPercent: { fontSize: 24, fontWeight: "800", color: Colors.primary },
  progressSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginBottom: 14 },
  progressBarOuter: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.cardBorder,
    position: "relative",
    overflow: "visible",
  },
  progressBarFill: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  milestoneMarker: {
    position: "absolute",
    top: -4,
    marginLeft: -8,
  },
  markerDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.bg },
  markerDotDone: { backgroundColor: Colors.gold },
  markerDotPending: { backgroundColor: Colors.cardBorder },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressLabel: { fontSize: 10, color: Colors.textMuted },

  celebrationBanner: {
    alignItems: "center",
    backgroundColor: Colors.gold + "15",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
  },
  celebrationEmoji: { fontSize: 28, marginBottom: 4 },
  celebrationText: { fontSize: 16, fontWeight: "700", color: Colors.gold },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },

  milestoneCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  milestoneCardUnlocked: { borderColor: Colors.gold + "40" },
  milestoneHeader: { flexDirection: "row", gap: 12, marginBottom: 12 },
  milestoneIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneBadge: { fontSize: 24 },
  milestoneTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  milestoneTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  milestonePercent: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  milestoneDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 17 },
  milestoneDate: { fontSize: 11, color: Colors.success, marginTop: 4 },

  rewardsRow: { flexDirection: "row", gap: 14, marginBottom: 12 },
  rewardItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  rewardText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },

  milestoneActions: { flexDirection: "row", gap: 10 },
  celebrateBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.gold + "15",
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  celebrateBtnText: { fontSize: 13, fontWeight: "600", color: Colors.gold },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary + "15",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  shareBtnText: { fontSize: 13, fontWeight: "600", color: Colors.primary },

  lockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.cardBorder + "50",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  lockedText: { fontSize: 12, color: Colors.textMuted },

  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  historyItemBorder: { borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  historyMilestone: { fontSize: 14, fontWeight: "600", color: Colors.text },
  historyDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  historyRewards: { alignItems: "flex-end" },
  historyCredits: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  historyXp: { fontSize: 11, color: Colors.gold, marginTop: 2 },

  totalCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  totalTitle: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary, textAlign: "center", marginBottom: 12 },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  totalItem: { alignItems: "center" },
  totalValue: { fontSize: 22, fontWeight: "800", color: Colors.text },
  totalLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  totalDivider: { width: 1, height: 30, backgroundColor: Colors.cardBorder },
});
