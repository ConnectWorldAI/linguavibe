/**
 * Pronunciation Progress Timeline
 * 
 * Shows how each pronunciation weak spot category improves week-over-week.
 * Combines pronunciation error data with weekly timestamps to show trends.
 */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WeeklySnapshot {
  weekLabel: string;
  weekStart: string;
  errorsByCategory: Record<string, number>;
  totalErrors: number;
  averageScore: number;
}

interface CategoryTimeline {
  id: string;
  label: string;
  icon: string;
  color: string;
  weeks: { weekLabel: string; count: number; score: number }[];
  trend: "improving" | "stable" | "declining";
  improvement: number; // percentage change from first to last week
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function getWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

function calculateTrend(values: number[]): "improving" | "stable" | "declining" {
  if (values.length < 2) return "stable";
  const recent = values.slice(-3);
  const earlier = values.slice(0, Math.max(1, values.length - 3));
  const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
  const earlierAvg = earlier.reduce((s, v) => s + v, 0) / earlier.length;
  const diff = recentAvg - earlierAvg;
  if (diff < -1) return "improving"; // fewer errors = improving
  if (diff > 1) return "declining";
  return "stable";
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function PronunciationTimelineScreen() {
  const [timelines, setTimelines] = useState<CategoryTimeline[]>([]);
  const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      const { PRONUNCIATION_CATEGORIES } = await import(
        "@/lib/pronunciation-error-categorization"
      );
      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      
      // Load raw pronunciation errors
      const errorsRaw = await AsyncStorage.getItem("@pronunciation_errors");
      const errors = errorsRaw ? JSON.parse(errorsRaw) : [];

      if (errors.length === 0) {
        setTimelines([]);
        setLoading(false);
        return;
      }

      // Group errors by week
      const weekMap = new Map<string, { errors: any[]; scores: number[] }>();
      
      for (const error of errors) {
        const weekNum = getWeekNumber(error.timestamp);
        const year = new Date(error.timestamp).getFullYear();
        const key = `${year}-W${weekNum}`;
        
        if (!weekMap.has(key)) {
          weekMap.set(key, { errors: [], scores: [] });
        }
        const week = weekMap.get(key)!;
        week.errors.push(error);
        week.scores.push(error.score || 0);
      }

      // Sort weeks chronologically
      const sortedWeeks = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12); // Last 12 weeks

      // Build weekly snapshots
      const weeklySnapshots: WeeklySnapshot[] = sortedWeeks.map(([key, data]) => {
        const errorsByCategory: Record<string, number> = {};
        for (const err of data.errors) {
          errorsByCategory[err.category] = (errorsByCategory[err.category] || 0) + 1;
        }
        const firstError = data.errors[0];
        return {
          weekLabel: getWeekLabel(firstError.timestamp),
          weekStart: firstError.timestamp,
          errorsByCategory,
          totalErrors: data.errors.length,
          averageScore: data.scores.reduce((s, v) => s + v, 0) / data.scores.length,
        };
      });

      setSnapshots(weeklySnapshots);

      // Build category timelines
      const categoryIds = new Set<string>();
      for (const snapshot of weeklySnapshots) {
        for (const cat of Object.keys(snapshot.errorsByCategory)) {
          categoryIds.add(cat);
        }
      }

      const categoryTimelines: CategoryTimeline[] = Array.from(categoryIds).map((catId) => {
        const catInfo = PRONUNCIATION_CATEGORIES.find((c: any) => c.id === catId);
        const weeks = weeklySnapshots.map((snap) => ({
          weekLabel: snap.weekLabel,
          count: snap.errorsByCategory[catId] || 0,
          score: snap.averageScore,
        }));

        const counts = weeks.map((w) => w.count);
        const trend = calculateTrend(counts);
        const first = counts.find((c) => c > 0) || 0;
        const last = counts[counts.length - 1] || 0;
        const improvement = first > 0 ? Math.round(((first - last) / first) * 100) : 0;

        return {
          id: catId,
          label: catInfo?.label || catId,
          icon: catInfo?.icon || "alert-circle",
          color: catInfo?.color || Colors.error,
          weeks,
          trend,
          improvement,
        };
      });

      // Sort by total errors (most problematic first)
      categoryTimelines.sort((a, b) => {
        const totalA = a.weeks.reduce((s, w) => s + w.count, 0);
        const totalB = b.weeks.reduce((s, w) => s + w.count, 0);
        return totalB - totalA;
      });

      setTimelines(categoryTimelines);
    } catch (err) {
      console.warn("Failed to load pronunciation timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedTimeline = selectedCategory
    ? timelines.find((t) => t.id === selectedCategory)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Pronunciation Timeline</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      ) : timelines.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mic-outline" size={56} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Pronunciation Data Yet</Text>
          <Text style={styles.emptySubtext}>
            Start having conversations or voice drills to see your pronunciation progress over time.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push("/conversation-sim" as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubbles" size={16} color="#fff" />
            <Text style={styles.ctaText}>Start a Conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Overview Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Progress Overview</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{timelines.length}</Text>
                <Text style={styles.summaryLabel}>Categories</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{snapshots.length}</Text>
                <Text style={styles.summaryLabel}>Weeks Tracked</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>
                  {timelines.filter((t) => t.trend === "improving").length}
                </Text>
                <Text style={styles.summaryLabel}>Improving</Text>
              </View>
            </View>
          </View>

          {/* Category List */}
          <Text style={styles.sectionTitle}>Categories</Text>
          {timelines.map((timeline) => (
            <TouchableOpacity
              key={timeline.id}
              style={[
                styles.categoryCard,
                selectedCategory === timeline.id && styles.categoryCardSelected,
              ]}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === timeline.id ? null : timeline.id
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: timeline.color + "20" }]}>
                  <Ionicons name={timeline.icon as any} size={18} color={timeline.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryLabel}>{timeline.label}</Text>
                  <View style={styles.categoryMeta}>
                    <View style={styles.trendBadge}>
                      <Ionicons
                        name={
                          timeline.trend === "improving"
                            ? "trending-down"
                            : timeline.trend === "declining"
                            ? "trending-up"
                            : "remove"
                        }
                        size={12}
                        color={
                          timeline.trend === "improving"
                            ? Colors.success
                            : timeline.trend === "declining"
                            ? Colors.error
                            : Colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.trendText,
                          {
                            color:
                              timeline.trend === "improving"
                                ? Colors.success
                                : timeline.trend === "declining"
                                ? Colors.error
                                : Colors.textSecondary,
                          },
                        ]}
                      >
                        {timeline.trend === "improving"
                          ? `${timeline.improvement}% fewer errors`
                          : timeline.trend === "declining"
                          ? "Needs attention"
                          : "Stable"}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name={selectedCategory === timeline.id ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textSecondary}
                />
              </View>

              {/* Expanded Timeline Chart */}
              {selectedCategory === timeline.id && (
                <View style={styles.timelineChart}>
                  <View style={styles.chartBars}>
                    {timeline.weeks.map((week, idx) => {
                      const maxCount = Math.max(...timeline.weeks.map((w) => w.count), 1);
                      const barHeight = Math.max((week.count / maxCount) * 80, 4);
                      const isLast = idx === timeline.weeks.length - 1;
                      return (
                        <View key={idx} style={styles.chartBarCol}>
                          <Text style={styles.chartBarValue}>
                            {week.count > 0 ? week.count : ""}
                          </Text>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: barHeight,
                                backgroundColor: isLast
                                  ? timeline.color
                                  : timeline.color + "60",
                              },
                            ]}
                          />
                          <Text style={styles.chartBarLabel}>{week.weekLabel}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.chartLegend}>
                    <Text style={styles.chartLegendText}>
                      {timeline.weeks[0]?.weekLabel} → {timeline.weeks[timeline.weeks.length - 1]?.weekLabel}
                    </Text>
                    <Text style={styles.chartLegendText}>
                      {timeline.trend === "improving"
                        ? "Errors decreasing over time"
                        : timeline.trend === "declining"
                        ? "Errors increasing — more practice needed"
                        : "Error rate holding steady"}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Overall Timeline Chart */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
            Total Errors Per Week
          </Text>
          <View style={styles.overallChart}>
            <View style={styles.chartBars}>
              {snapshots.map((snap, idx) => {
                const maxTotal = Math.max(...snapshots.map((s) => s.totalErrors), 1);
                const barHeight = Math.max((snap.totalErrors / maxTotal) * 80, 4);
                const isLast = idx === snapshots.length - 1;
                return (
                  <View key={idx} style={styles.chartBarCol}>
                    <Text style={styles.chartBarValue}>{snap.totalErrors}</Text>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: barHeight,
                          backgroundColor: isLast ? Colors.secondary : Colors.secondary + "60",
                        },
                      ]}
                    />
                    <Text style={styles.chartBarLabel}>{snap.weekLabel}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Ionicons name="bulb" size={18} color={Colors.warning} />
            <Text style={styles.tipsText}>
              Focus on categories marked as "declining" first. Consistent daily practice of 5-10 minutes on your weakest category yields the fastest improvement.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  ctaText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#fff",
  },
  scrollContent: {
    padding: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  categoryCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryCardSelected: {
    borderColor: Colors.secondary + "50",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  categoryMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timelineChart: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 110,
    gap: 2,
  },
  chartBarCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chartBarValue: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  chartBar: {
    width: "70%",
    borderRadius: 3,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 8,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  chartLegend: {
    marginTop: 10,
    alignItems: "center",
    gap: 2,
  },
  chartLegendText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  overallChart: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipsCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.warning + "15",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
});
