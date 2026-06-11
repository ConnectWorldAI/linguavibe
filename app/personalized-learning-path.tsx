import React, { useState, useEffect } from "react";
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
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import { getDueCount } from "@/lib/srs";

// ─── Types ──────────────────────────────────────────────────────────────────
interface WeakArea {
  id: string;
  skill: string;
  category: string;
  icon: string;
  score: number;
  trend: "improving" | "declining" | "stable";
  recommendation: string;
}

interface StudyBlock {
  id: string;
  day: string;
  time: string;
  activity: string;
  skill: string;
  duration: number;
  icon: string;
  color: string;
  completed: boolean;
}

interface WeeklyGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  icon: string;
}

// ─── Data ───────────────────────────────────────────────────────────────────
const WEAK_AREAS: WeakArea[] = [
  { id: "1", skill: "Listening Comprehension", category: "Receptive", icon: "ear", score: 42, trend: "improving", recommendation: "Practice with podcast episodes at 0.8x speed" },
  { id: "2", skill: "Verb Conjugation", category: "Grammar", icon: "git-branch", score: 55, trend: "stable", recommendation: "Focus on irregular verbs in past tense" },
  { id: "3", skill: "Pronunciation (R sounds)", category: "Speaking", icon: "mic", score: 38, trend: "declining", recommendation: "Record yourself daily with tongue twisters" },
  { id: "4", skill: "Reading Speed", category: "Receptive", icon: "book", score: 61, trend: "improving", recommendation: "Read 1 short article daily without dictionary" },
  { id: "5", skill: "Vocabulary Retention", category: "Memory", icon: "bulb", score: 48, trend: "stable", recommendation: "Review flashcards before sleep for better retention" },
];

const WEEKLY_PLAN: StudyBlock[] = [
  { id: "1", day: "Mon", time: "8:00 AM", activity: "Pronunciation Drills", skill: "Speaking", duration: 15, icon: "mic", color: Colors.accent, completed: true },
  { id: "2", day: "Mon", time: "12:30 PM", activity: "Vocabulary Review (SRS)", skill: "Memory", duration: 10, icon: "bulb", color: Colors.gold, completed: true },
  { id: "3", day: "Mon", time: "8:00 PM", activity: "Listening Practice", skill: "Receptive", duration: 20, icon: "ear", color: Colors.secondary, completed: false },
  { id: "4", day: "Tue", time: "8:00 AM", activity: "Grammar: Past Tense", skill: "Grammar", duration: 15, icon: "git-branch", color: Colors.success, completed: false },
  { id: "5", day: "Tue", time: "6:00 PM", activity: "Karaoke Session", skill: "Speaking", duration: 20, icon: "musical-notes", color: "#EC4899", completed: false },
  { id: "6", day: "Wed", time: "8:00 AM", activity: "Reading Comprehension", skill: "Receptive", duration: 15, icon: "book", color: Colors.secondary, completed: false },
  { id: "7", day: "Wed", time: "12:30 PM", activity: "Flashcard Sprint", skill: "Memory", duration: 10, icon: "flash", color: Colors.gold, completed: false },
  { id: "8", day: "Wed", time: "8:00 PM", activity: "Conversation Practice", skill: "Speaking", duration: 25, icon: "chatbubbles", color: Colors.accent, completed: false },
  { id: "9", day: "Thu", time: "8:00 AM", activity: "Tongue Twisters", skill: "Speaking", duration: 10, icon: "mic", color: Colors.accent, completed: false },
  { id: "10", day: "Thu", time: "6:00 PM", activity: "Verb Conjugation Drill", skill: "Grammar", duration: 15, icon: "git-branch", color: Colors.success, completed: false },
  { id: "11", day: "Fri", time: "8:00 AM", activity: "Podcast Listening", skill: "Receptive", duration: 20, icon: "headset", color: Colors.secondary, completed: false },
  { id: "12", day: "Fri", time: "8:00 PM", activity: "Song Translation", skill: "Vocabulary", duration: 15, icon: "musical-notes", color: "#EC4899", completed: false },
  { id: "13", day: "Sat", time: "10:00 AM", activity: "Weekly Review Quiz", skill: "All", duration: 20, icon: "trophy", color: Colors.gold, completed: false },
  { id: "14", day: "Sun", time: "10:00 AM", activity: "Free Practice / Rest", skill: "Wellness", duration: 0, icon: "leaf", color: Colors.success, completed: false },
];

const WEEKLY_GOALS: WeeklyGoal[] = [
  { id: "1", title: "Study Time", target: 150, current: 45, unit: "min", icon: "time" },
  { id: "2", title: "New Words", target: 30, current: 12, unit: "words", icon: "book" },
  { id: "3", title: "Speaking", target: 60, current: 15, unit: "min", icon: "mic" },
  { id: "4", title: "Lessons", target: 10, current: 3, unit: "done", icon: "checkmark-done" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PersonalizedLearningPathScreen() {
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [plan, setPlan] = useState(WEEKLY_PLAN);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    getDueCount().then((count) => setDueCount(count)).catch(() => {});
  }, []);

  const todayBlocks = plan.filter((b) => b.day === selectedDay);

  const isSrsBlock = (block: StudyBlock) => {
    return (
      block.skill === "Memory" ||
      block.skill === "Vocabulary" ||
      /SRS|Flashcard|Review/i.test(block.activity)
    );
  };

  const handleBlockPress = (block: StudyBlock) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSrsBlock(block) && !block.completed) {
      router.push("/srs-review");
      return;
    }
    handleToggleBlock(block.id);
  };

  const handleToggleBlock = (blockId: string) => {
    setPlan((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, completed: !b.completed } : b))
    );
  };

  const handleRegenerate = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRegenerating(true);
    // Simulate AI regeneration
    setTimeout(() => {
      setIsRegenerating(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return Colors.success;
    if (score >= 50) return Colors.gold;
    return Colors.accent;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving": return { icon: "trending-up", color: Colors.success };
      case "declining": return { icon: "trending-down", color: Colors.accent };
      default: return { icon: "remove", color: Colors.textSecondary };
    }
  };

  const completedToday = todayBlocks.filter((b) => b.completed).length;
  const totalToday = todayBlocks.length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Learning Path</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleRegenerate}>
          <Ionicons name="refresh" size={20} color={isRegenerating ? Colors.secondary : Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* AI Analysis Banner */}
        <View style={styles.aiBanner}>
          <View style={styles.aiIconRow}>
            <View style={styles.aiIcon}>
              <Ionicons name="sparkles" size={18} color={Colors.secondary} />
            </View>
            <View style={styles.aiBannerContent}>
              <Text style={styles.aiBannerTitle}>AI-Personalized Plan</Text>
              <Text style={styles.aiBannerSubtitle}>Updated weekly based on your performance</Text>
            </View>
          </View>
          {isRegenerating && (
            <View style={styles.regenBadge}>
              <Text style={styles.regenText}>Regenerating...</Text>
            </View>
          )}
        </View>

        {/* Weekly Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week's Goals</Text>
          <View style={styles.goalsGrid}>
            {WEEKLY_GOALS.map((goal) => {
              const pct = Math.min((goal.current / goal.target) * 100, 100);
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <Ionicons name={goal.icon as any} size={18} color={Colors.secondary} />
                  <Text style={styles.goalValue}>{goal.current}/{goal.target}</Text>
                  <Text style={styles.goalUnit}>{goal.unit}</Text>
                  <View style={styles.goalBar}>
                    <View style={[styles.goalBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Weak Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus Areas (AI Detected)</Text>
          {WEAK_AREAS.map((area) => {
            const trend = getTrendIcon(area.trend);
            return (
              <View key={area.id} style={styles.weakCard}>
                <View style={styles.weakTop}>
                  <View style={[styles.weakIconCircle, { backgroundColor: getScoreColor(area.score) + "20" }]}>
                    <Ionicons name={area.icon as any} size={16} color={getScoreColor(area.score)} />
                  </View>
                  <View style={styles.weakInfo}>
                    <Text style={styles.weakSkill}>{area.skill}</Text>
                    <Text style={styles.weakCategory}>{area.category}</Text>
                  </View>
                  <View style={styles.weakScoreWrap}>
                    <Text style={[styles.weakScore, { color: getScoreColor(area.score) }]}>{area.score}%</Text>
                    <Ionicons name={trend.icon as any} size={14} color={trend.color} />
                  </View>
                </View>
                <Text style={styles.weakRec}>{area.recommendation}</Text>
              </View>
            );
          })}
        </View>

        {/* Daily Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Daily Schedule</Text>
            <Text style={styles.progressLabel}>{completedToday}/{totalToday} done</Text>
          </View>

          {/* Day Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
            {DAYS.map((day) => {
              const dayBlocks = plan.filter((b) => b.day === day);
              const dayDone = dayBlocks.filter((b) => b.completed).length;
              const isToday = day === "Mon"; // Simulated
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, selectedDay === day && styles.dayChipActive, isToday && styles.dayChipToday]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayChipText, selectedDay === day && styles.dayChipTextActive]}>{day}</Text>
                  {dayDone > 0 && dayDone === dayBlocks.length && (
                    <Ionicons name="checkmark-circle" size={10} color={Colors.success} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Blocks */}
          {todayBlocks.map((block) => (
            <TouchableOpacity
              key={block.id}
              style={[styles.blockCard, block.completed && styles.blockCardDone]}
              onPress={() => handleBlockPress(block)}
              activeOpacity={0.7}
            >
              <View style={[styles.blockIconCircle, { backgroundColor: block.color + "20" }]}>
                <Ionicons name={block.icon as any} size={16} color={block.completed ? Colors.textMuted : block.color} />
              </View>
              <View style={styles.blockInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.blockActivity, block.completed && styles.blockTextDone]}>{block.activity}</Text>
                  {isSrsBlock(block) && !block.completed && dueCount > 0 && (
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueBadgeText}>{dueCount} due</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.blockMeta}>
                  {block.time} • {block.duration > 0 ? `${block.duration} min` : "Rest day"}
                  {isSrsBlock(block) && !block.completed ? "  →  Tap to review" : ""}
                </Text>
              </View>
              <View style={[styles.blockCheck, block.completed && styles.blockCheckDone]}>
                {block.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Insight */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="analytics" size={18} color={Colors.secondary} />
            <Text style={styles.insightTitle}>AI Insight</Text>
          </View>
          <Text style={styles.insightText}>
            Your pronunciation scores dropped 12% this week. I've added extra tongue twister sessions on Thursday mornings.
            Your listening comprehension is improving — keep up the podcast practice!
          </Text>
          <View style={styles.insightActions}>
            <TouchableOpacity style={styles.insightBtn} activeOpacity={0.7}>
              <Ionicons name="thumbs-up-outline" size={14} color={Colors.secondary} />
              <Text style={styles.insightBtnText}>Helpful</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.insightBtn} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.insightBtnText}>Adjust Plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Adaptive Vocabulary Reuse */}
        <TouchableOpacity
          style={[styles.insightCard, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
          activeOpacity={0.7}
          onPress={() => router.push("/adaptive-vocab-reuse" as any)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(236,72,153,0.15)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="refresh-circle" size={20} color="#EC4899" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary }}>Adaptive Vocabulary</Text>
              <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>Words you struggle with auto-resurface across all learning</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: Spacing.md },
  // AI Banner
  aiBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.md, backgroundColor: Colors.secondary + "10", borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.secondary + "30", marginBottom: 20 },
  aiIconRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.secondary + "20", alignItems: "center", justifyContent: "center" },
  aiBannerContent: {},
  aiBannerTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.secondary },
  aiBannerSubtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  regenBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.secondary + "20" },
  regenText: { fontSize: 10, fontWeight: "600", color: Colors.secondary },
  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  progressLabel: { fontSize: FontSize.sm, color: Colors.success, fontWeight: "600" },
  // Goals
  goalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  goalCard: { width: "48%", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: "center", gap: 4 },
  goalValue: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  goalUnit: { fontSize: 10, color: Colors.textSecondary },
  goalBar: { width: "100%", height: 3, backgroundColor: Colors.primary, borderRadius: 2, overflow: "hidden", marginTop: 4 },
  goalBarFill: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 2 },
  goalTitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  // Weak areas
  weakCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  weakTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  weakIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  weakInfo: { flex: 1 },
  weakSkill: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  weakCategory: { fontSize: 11, color: Colors.textSecondary },
  weakScoreWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  weakScore: { fontSize: FontSize.md, fontWeight: "700" },
  weakRec: { fontSize: 12, color: Colors.textMuted, fontStyle: "italic", lineHeight: 16 },
  // Day selector
  dayRow: { marginBottom: 12 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, marginRight: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  dayChipActive: { backgroundColor: Colors.secondary + "20", borderColor: Colors.secondary },
  dayChipToday: { borderColor: Colors.gold },
  dayChipText: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  dayChipTextActive: { color: Colors.secondary, fontWeight: "600" },
  // Block card
  blockCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  blockCardDone: { opacity: 0.6 },
  blockIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  blockInfo: { flex: 1 },
  blockActivity: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  blockTextDone: { textDecorationLine: "line-through", color: Colors.textMuted },
  blockMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  blockCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  blockCheckDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  dueBadge: { backgroundColor: Colors.accent + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: Colors.accent + "40" },
  dueBadgeText: { fontSize: 9, fontWeight: "700", color: Colors.accent },
  // Insight
  insightCard: { padding: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.secondary + "30" },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  insightTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.secondary },
  insightText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  insightActions: { flexDirection: "row", gap: 12 },
  insightBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.primary },
  insightBtnText: { fontSize: 11, color: Colors.textSecondary },
});
