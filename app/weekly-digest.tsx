import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";

const WEEK_DATA = {
  weekOf: "May 12 - May 18, 2026",
  weekNumber: 20,
  totalXP: 1420,
  xpChange: +18,
  totalMinutes: 245,
  minutesChange: +12,
  lessonsCompleted: 14,
  lessonsChange: +3,
  wordsLearned: 67,
  wordsChange: +22,
  streakDays: 7,
  flashcardsReviewed: 142,
  pronunciationScore: 87,
  classesAttended: 3,
  goalsHit: 5,
  goalsMissed: 2,
};

const HIGHLIGHTS = [
  { emoji: "🏆", title: "Perfect Week!", description: "7/7 day streak maintained" },
  { emoji: "📚", title: "Top Course", description: "Dominican Spanish: 6 lessons completed" },
  { emoji: "🎯", title: "Best Day", description: "Wednesday - 52 min, 320 XP" },
  { emoji: "🗣️", title: "Pronunciation", description: "87% avg accuracy (+5% from last week)" },
];

const NEXT_WEEK_GOALS = [
  { icon: "book", title: "Complete Module 4", target: "5 lessons", color: Colors.secondary },
  { icon: "layers", title: "Master 20 flashcards", target: "Easy rating", color: Colors.success },
  { icon: "mic", title: "Pronunciation drill", target: "90% accuracy", color: "#8B5CF6" },
  { icon: "videocam", title: "Attend live class", target: "2 sessions", color: Colors.gold },
];

const DAILY_BREAKDOWN = [
  { day: "Mon", xp: 180, minutes: 32 },
  { day: "Tue", xp: 220, minutes: 38 },
  { day: "Wed", xp: 320, minutes: 52 },
  { day: "Thu", xp: 150, minutes: 28 },
  { day: "Fri", xp: 240, minutes: 40 },
  { day: "Sat", xp: 180, minutes: 30 },
  { day: "Sun", xp: 130, minutes: 25 },
];

export default function WeeklyDigestScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const maxXP = Math.max(...DAILY_BREAKDOWN.map(d => d.xp));

  const handleShare = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `📊 My LinguaVibe Weekly Digest (${WEEK_DATA.weekOf})\n\n🔥 ${WEEK_DATA.streakDays}-day streak\n⚡ ${WEEK_DATA.totalXP} XP earned\n📚 ${WEEK_DATA.lessonsCompleted} lessons completed\n🧠 ${WEEK_DATA.wordsLearned} new words learned\n⏱️ ${WEEK_DATA.totalMinutes} minutes studied\n\n#LinguaVibe #LanguageLearning`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Weekly Digest</Text>
          <Text style={styles.headerSub}>{WEEK_DATA.weekOf}</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Banner */}
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryTitle}>Week {WEEK_DATA.weekNumber} Summary</Text>
          <Text style={styles.summaryEmoji}>📊</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{WEEK_DATA.totalXP}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
            <Text style={[styles.statChange, { color: Colors.success }]}>+{WEEK_DATA.xpChange}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{WEEK_DATA.totalMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
            <Text style={[styles.statChange, { color: Colors.success }]}>+{WEEK_DATA.minutesChange}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{WEEK_DATA.lessonsCompleted}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
            <Text style={[styles.statChange, { color: Colors.success }]}>+{WEEK_DATA.lessonsChange}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{WEEK_DATA.wordsLearned}</Text>
            <Text style={styles.statLabel}>Words</Text>
            <Text style={[styles.statChange, { color: Colors.success }]}>+{WEEK_DATA.wordsChange}</Text>
          </View>
        </View>

        {/* Daily Breakdown Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Activity</Text>
          <View style={styles.chartRow}>
            {DAILY_BREAKDOWN.map((day, i) => (
              <TouchableOpacity
                key={i}
                style={styles.chartCol}
                onPress={() => setSelectedDay(selectedDay === i ? null : i)}
                activeOpacity={0.7}
              >
                <View style={styles.chartBarWrap}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${(day.xp / maxXP) * 100}%`,
                        backgroundColor: selectedDay === i ? Colors.gold : Colors.secondary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartDayText, selectedDay === i && { color: Colors.gold }]}>{day.day}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedDay !== null && (
            <View style={styles.chartTooltip}>
              <Text style={styles.chartTooltipText}>
                {DAILY_BREAKDOWN[selectedDay].day}: {DAILY_BREAKDOWN[selectedDay].xp} XP • {DAILY_BREAKDOWN[selectedDay].minutes} min
              </Text>
            </View>
          )}
        </View>

        {/* Highlights */}
        <View style={styles.highlightsSection}>
          <Text style={styles.sectionTitle}>Highlights</Text>
          {HIGHLIGHTS.map((h, i) => (
            <View key={i} style={styles.highlightCard}>
              <Text style={styles.highlightEmoji}>{h.emoji}</Text>
              <View style={styles.highlightInfo}>
                <Text style={styles.highlightTitle}>{h.title}</Text>
                <Text style={styles.highlightDesc}>{h.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Activity Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Activity Breakdown</Text>
          <View style={styles.breakdownGrid}>
            <View style={styles.breakdownItem}>
              <Ionicons name="flame" size={20} color={Colors.gold} />
              <Text style={styles.breakdownValue}>{WEEK_DATA.streakDays}</Text>
              <Text style={styles.breakdownLabel}>Streak Days</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Ionicons name="layers" size={20} color={Colors.success} />
              <Text style={styles.breakdownValue}>{WEEK_DATA.flashcardsReviewed}</Text>
              <Text style={styles.breakdownLabel}>Flashcards</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Ionicons name="mic" size={20} color="#8B5CF6" />
              <Text style={styles.breakdownValue}>{WEEK_DATA.pronunciationScore}%</Text>
              <Text style={styles.breakdownLabel}>Pronunciation</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Ionicons name="videocam" size={20} color={Colors.secondary} />
              <Text style={styles.breakdownValue}>{WEEK_DATA.classesAttended}</Text>
              <Text style={styles.breakdownLabel}>Classes</Text>
            </View>
          </View>
        </View>

        {/* Goals Performance */}
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>Goals Performance</Text>
          <View style={styles.goalsRow}>
            <View style={styles.goalsHit}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.goalsHitValue}>{WEEK_DATA.goalsHit}</Text>
              <Text style={styles.goalsHitLabel}>Goals Hit</Text>
            </View>
            <View style={styles.goalsDivider} />
            <View style={styles.goalsHit}>
              <Ionicons name="close-circle" size={24} color={Colors.accent} />
              <Text style={styles.goalsMissedValue}>{WEEK_DATA.goalsMissed}</Text>
              <Text style={styles.goalsHitLabel}>Missed</Text>
            </View>
          </View>
          <View style={styles.goalsBar}>
            <View style={[styles.goalsBarFill, { width: `${(WEEK_DATA.goalsHit / (WEEK_DATA.goalsHit + WEEK_DATA.goalsMissed)) * 100}%` }]} />
          </View>
          <Text style={styles.goalsPercent}>
            {Math.round((WEEK_DATA.goalsHit / (WEEK_DATA.goalsHit + WEEK_DATA.goalsMissed)) * 100)}% completion rate
          </Text>
        </View>

        {/* Next Week Goals */}
        <View style={styles.nextWeekSection}>
          <Text style={styles.sectionTitle}>Next Week Goals</Text>
          <Text style={styles.nextWeekSub}>AI-recommended based on your progress</Text>
          {NEXT_WEEK_GOALS.map((goal, i) => (
            <View key={i} style={styles.nextGoalCard}>
              <View style={[styles.nextGoalIcon, { backgroundColor: `${goal.color}20` }]}>
                <Ionicons name={goal.icon as any} size={18} color={goal.color} />
              </View>
              <View style={styles.nextGoalInfo}>
                <Text style={styles.nextGoalTitle}>{goal.title}</Text>
                <Text style={styles.nextGoalTarget}>{goal.target}</Text>
              </View>
              <Ionicons name="add-circle-outline" size={22} color={Colors.textSecondary} />
            </View>
          ))}
        </View>

        {/* Share CTA */}
        <TouchableOpacity style={styles.shareCTA} onPress={handleShare} activeOpacity={0.8}>
          <Ionicons name="share-social" size={22} color="#FFFFFF" />
          <Text style={styles.shareCTAText}>Share Your Weekly Progress</Text>
        </TouchableOpacity>

        {/* Email Preference */}
        <View style={styles.emailCard}>
          <Ionicons name="mail" size={20} color={Colors.secondary} />
          <View style={styles.emailInfo}>
            <Text style={styles.emailTitle}>Weekly Email Digest</Text>
            <Text style={styles.emailSub}>Sent every Monday at 8:00 AM</Text>
          </View>
          <View style={styles.emailBadge}>
            <Text style={styles.emailBadgeText}>ON</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: Spacing.lg },
  summaryBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.glowBorder },
  summaryTitle: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary },
  summaryEmoji: { fontSize: 32 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: FontSize.xl, fontWeight: "900", color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statChange: { fontSize: FontSize.xs, fontWeight: "700", marginTop: 4 },
  chartCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  chartTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  chartRow: { flexDirection: "row", justifyContent: "space-between", height: 120, alignItems: "flex-end" },
  chartCol: { alignItems: "center", flex: 1 },
  chartBarWrap: { width: 20, height: 100, justifyContent: "flex-end", borderRadius: 10, overflow: "hidden", backgroundColor: "rgba(0, 170, 255, 0.08)" },
  chartBar: { width: "100%", borderRadius: 10 },
  chartDayText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 6, fontWeight: "600" },
  chartTooltip: { alignItems: "center", marginTop: Spacing.sm, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  chartTooltipText: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: "600" },
  highlightsSection: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  highlightCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  highlightEmoji: { fontSize: 24 },
  highlightInfo: { flex: 1 },
  highlightTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  highlightDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  breakdownSection: { marginBottom: Spacing.lg },
  breakdownGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  breakdownItem: { flex: 1, minWidth: "45%", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: "center", gap: 4, borderWidth: 1, borderColor: Colors.border },
  breakdownValue: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.textPrimary },
  breakdownLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  goalsSection: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  goalsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.xl, marginBottom: Spacing.md },
  goalsHit: { alignItems: "center", gap: 4 },
  goalsHitValue: { fontSize: FontSize.xl, fontWeight: "900", color: Colors.success },
  goalsMissedValue: { fontSize: FontSize.xl, fontWeight: "900", color: Colors.accent },
  goalsHitLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  goalsDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  goalsBar: { height: 6, borderRadius: 3, backgroundColor: "rgba(255, 45, 45, 0.2)", overflow: "hidden", marginBottom: 6 },
  goalsBarFill: { height: "100%", borderRadius: 3, backgroundColor: Colors.success },
  goalsPercent: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: "center" },
  nextWeekSection: { marginBottom: Spacing.lg },
  nextWeekSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.md, marginTop: -8 },
  nextGoalCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  nextGoalIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  nextGoalInfo: { flex: 1 },
  nextGoalTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  nextGoalTarget: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  shareCTA: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.secondary, borderRadius: BorderRadius.md, paddingVertical: 14, marginBottom: Spacing.md },
  shareCTAText: { fontSize: FontSize.md, fontWeight: "700", color: "#FFFFFF" },
  emailCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  emailInfo: { flex: 1 },
  emailTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  emailSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  emailBadge: { backgroundColor: "rgba(0, 255, 136, 0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  emailBadgeText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.success },
});
