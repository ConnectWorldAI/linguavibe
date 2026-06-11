import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { getAnalyticsSummary } from "@/lib/exercise-analytics";

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  rrt: "Rapid Recall",
  netflix_dictation: "Netflix Dictation",
  whiteboard: "Whiteboard",
  visual_association: "Visual Association",
  conversation: "Conversation",
  grammar: "Grammar",
  fill_order: "Fill Order",
  match_pairs: "Match Pairs",
  story_choice: "Story Choice",
  cultural_discovery: "Cultural Discovery",
  pronunciation: "Pronunciation",
  adaptive_lesson: "Adaptive Lesson",
};

export default function ExerciseAnalyticsScreen() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      let startDate: string | undefined;
      const now = new Date();
      if (timeRange === "week") {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().split("T")[0];
      } else if (timeRange === "month") {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        startDate = d.toISOString().split("T")[0];
      }
      const data = await getAnalyticsSummary(startDate);
      setSummary(data);
    } catch (err) {
      console.warn("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Exercise Analytics</Text>
      </View>

      {/* Time Range Filter */}
      <View style={styles.timeRow}>
        {(["week", "month", "all"] as const).map((range) => (
          <Pressable
            key={range}
            style={({ pressed }) => [
              styles.timeTab,
              timeRange === range && styles.timeTabActive,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[styles.timeTabText, timeRange === range && styles.timeTabTextActive]}>
              {range === "week" ? "This Week" : range === "month" ? "This Month" : "All Time"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : summary ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Overview Cards */}
          <View style={styles.overviewRow}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{summary.completedExercises}</Text>
              <Text style={styles.overviewLabel}>Completed</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={[styles.overviewNumber, { color: "#22C55E" }]}>
                {summary.averageAccuracy}%
              </Text>
              <Text style={styles.overviewLabel}>Accuracy</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={[styles.overviewNumber, { color: "#F59E0B" }]}>
                {summary.completionRate}%
              </Text>
              <Text style={styles.overviewLabel}>Completion</Text>
            </View>
          </View>

          {/* Time Spent */}
          <View style={styles.timeSpentCard}>
            <Text style={styles.sectionTitle}>Time Invested</Text>
            <Text style={styles.timeSpentValue}>{formatDuration(summary.totalDurationMs)}</Text>
            <Text style={styles.timeSpentSub}>
              {summary.totalExercises} exercises started, {summary.abandonedExercises} abandoned
            </Text>
          </View>

          {/* By Exercise Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance by Type</Text>
            {Object.entries(summary.byType).length > 0 ? (
              Object.entries(summary.byType).map(([type, stats]: [string, any]) => (
                <View key={type} style={styles.typeRow}>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeName}>{EXERCISE_TYPE_LABELS[type] || type}</Text>
                    <Text style={styles.typeCount}>{stats.completed} completed</Text>
                  </View>
                  <View style={styles.typeStats}>
                    <Text style={styles.typeAccuracy}>{stats.accuracy}%</Text>
                    <View style={styles.accuracyBar}>
                      <View style={[styles.accuracyFill, { width: `${stats.accuracy}%` }]} />
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No exercise data yet. Complete some exercises to see stats.</Text>
            )}
          </View>

          {/* By Language */}
          {Object.entries(summary.byLanguage).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance by Language</Text>
              {Object.entries(summary.byLanguage).map(([lang, stats]: [string, any]) => (
                <View key={lang} style={styles.langRow}>
                  <Text style={styles.langName}>{lang}</Text>
                  <Text style={styles.langCompleted}>{stats.completed} exercises</Text>
                  <Text style={styles.langAccuracy}>{stats.accuracy}% accuracy</Text>
                </View>
              ))}
            </View>
          )}

          {/* Adaptive Difficulty Hint */}
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>Adaptive Difficulty Engine</Text>
            <Text style={styles.hintText}>
              Your exercise difficulty automatically adjusts based on your accuracy and completion rates.
              {summary.averageAccuracy > 85
                ? " You're doing great! Difficulty will increase to keep you challenged."
                : summary.averageAccuracy > 60
                ? " You're on track. Keep practicing to improve your accuracy."
                : " Consider reviewing basics. Difficulty has been adjusted to help you build confidence."}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No Analytics Yet</Text>
          <Text style={styles.emptySubtext}>Complete exercises to see your performance data</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A4A",
  },
  backBtn: { padding: 8 },
  backBtnText: { fontSize: 24, color: "#FFFFFF" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", marginLeft: 12 },
  timeRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  timeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  timeTabActive: { borderColor: "#6C63FF", backgroundColor: "#2A2A4A" },
  timeTabText: { fontSize: 13, color: "#6B7280" },
  timeTabTextActive: { color: "#FFFFFF", fontWeight: "600" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  overviewRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  overviewCard: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  overviewNumber: { fontSize: 24, fontWeight: "700", color: "#6C63FF" },
  overviewLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  timeSpentCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  timeSpentValue: { fontSize: 32, fontWeight: "700", color: "#FFFFFF", marginTop: 8 },
  timeSpentSub: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  section: {
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", marginBottom: 12 },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A4A20",
  },
  typeInfo: { flex: 1 },
  typeName: { fontSize: 14, fontWeight: "500", color: "#FFFFFF" },
  typeCount: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  typeStats: { alignItems: "flex-end", width: 80 },
  typeAccuracy: { fontSize: 14, fontWeight: "600", color: "#22C55E" },
  accuracyBar: {
    width: 60,
    height: 4,
    backgroundColor: "#2A2A4A",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  accuracyFill: { height: "100%", backgroundColor: "#22C55E", borderRadius: 2 },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A4A20",
    gap: 12,
  },
  langName: { fontSize: 14, fontWeight: "500", color: "#FFFFFF", flex: 1 },
  langCompleted: { fontSize: 12, color: "#9CA3AF" },
  langAccuracy: { fontSize: 12, color: "#22C55E", fontWeight: "600" },
  hintCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#6C63FF40",
  },
  hintTitle: { fontSize: 14, fontWeight: "600", color: "#8B83FF", marginBottom: 8 },
  hintText: { fontSize: 13, color: "#D1D5DB", lineHeight: 20 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  emptySubtext: { fontSize: 14, color: "#9CA3AF", marginTop: 4, textAlign: "center" },
  emptyText: { fontSize: 13, color: "#9CA3AF", fontStyle: "italic" },
});
