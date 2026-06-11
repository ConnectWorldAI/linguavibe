import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  getWeeklyReportHistory,
  sendImmediateProgressNotification,
  type WeeklyReport,
} from "@/lib/weekly-progress-notification";

// ─── Grade Helpers ──────────────────────────────────────────────────────────

const GRADE_ORDER = ["A+", "A", "B+", "B", "C+", "C", "D", "F"] as const;

function gradeToNumeric(grade: string): number {
  const map: Record<string, number> = {
    "A+": 8, A: 7, "B+": 6, B: 5, "C+": 4, C: 3, D: 2, F: 1,
  };
  return map[grade] || 0;
}

function gradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return Colors.success;
  if (grade === "B+" || grade === "B") return "#3B82F6";
  if (grade === "C+" || grade === "C") return Colors.gold;
  if (grade === "D") return "#F97316";
  return Colors.error;
}

function gradeEmoji(grade: string): string {
  if (grade === "A+") return "🌟";
  if (grade === "A") return "⭐";
  if (grade === "B+" || grade === "B") return "📈";
  if (grade === "C+" || grade === "C") return "📊";
  if (grade === "D") return "📉";
  return "🔴";
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Grade Trend Chart ──────────────────────────────────────────────────────

function GradeTrendChart({ reports }: { reports: WeeklyReport[] }) {
  if (reports.length < 2) return null;

  const chartHeight = 120;
  const chartWidth = Math.min(reports.length * 40, 320);
  const maxGrade = 8; // A+ = 8
  const minGrade = 1; // F = 1

  // Reverse so oldest is on left
  const sorted = [...reports].reverse();

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Grade Trend</Text>
      <View style={[styles.chartArea, { height: chartHeight + 30, width: "100%" }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>A+</Text>
          <Text style={styles.yLabel}>B</Text>
          <Text style={styles.yLabel}>D</Text>
          <Text style={styles.yLabel}>F</Text>
        </View>
        {/* Chart body */}
        <View style={[styles.chartBody, { height: chartHeight }]}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((pct, i) => (
            <View
              key={i}
              style={[styles.gridLine, { top: chartHeight * pct }]}
            />
          ))}
          {/* Data points and connecting lines */}
          <View style={styles.pointsRow}>
            {sorted.map((report, idx) => {
              const value = gradeToNumeric(report.grade);
              const normalizedY = ((value - minGrade) / (maxGrade - minGrade)) * (chartHeight - 20);
              const bottomPos = normalizedY + 5;
              return (
                <View key={idx} style={styles.pointColumn}>
                  <View
                    style={[
                      styles.dataPoint,
                      {
                        bottom: bottomPos,
                        backgroundColor: gradeColor(report.grade),
                      },
                    ]}
                  />
                  <Text style={styles.pointLabel}>
                    {new Date(report.metrics.weekStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }).split(" ")[0]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Report Card Item ───────────────────────────────────────────────────────

function ReportItem({ report, isExpanded, onToggle }: {
  report: WeeklyReport;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { metrics } = report;

  return (
    <TouchableOpacity
      style={[styles.reportCard, isExpanded && styles.reportCardExpanded]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {/* Header row */}
      <View style={styles.reportHeader}>
        <View style={[styles.gradeBadge, { backgroundColor: gradeColor(report.grade) + "20" }]}>
          <Text style={[styles.gradeText, { color: gradeColor(report.grade) }]}>
            {report.grade}
          </Text>
        </View>
        <View style={styles.reportMeta}>
          <Text style={styles.reportDateRange}>
            {formatDateRange(metrics.weekStartDate, metrics.weekEndDate)}
          </Text>
          <Text style={styles.reportSubtext}>
            {metrics.sessionsCompleted} sessions • {Math.round(metrics.averageAccuracy)}% accuracy
          </Text>
        </View>
        <View style={styles.reportRight}>
          <Text style={styles.masteryText}>{Math.round(metrics.overallMastery)}%</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={Colors.textSecondary}
          />
        </View>
      </View>

      {/* Quick stats row */}
      <View style={styles.quickStats}>
        <View style={styles.statPill}>
          <Ionicons name="flame-outline" size={14} color={Colors.gold} />
          <Text style={styles.statPillText}>{metrics.streakDays}d streak</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="time-outline" size={14} color={Colors.primary} />
          <Text style={styles.statPillText}>{metrics.totalMinutes}m</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
          <Text style={styles.statPillText}>{metrics.errorPatternsFixed} fixed</Text>
        </View>
        {metrics.masteryChange !== 0 && (
          <View style={styles.statPill}>
            <Ionicons
              name={metrics.masteryChange > 0 ? "trending-up" : "trending-down"}
              size={14}
              color={metrics.masteryChange > 0 ? Colors.success : Colors.error}
            />
            <Text style={[styles.statPillText, { color: metrics.masteryChange > 0 ? Colors.success : Colors.error }]}>
              {metrics.masteryChange > 0 ? "+" : ""}{metrics.masteryChange}%
            </Text>
          </View>
        )}
      </View>

      {/* Expanded details */}
      {isExpanded && (
        <View style={styles.expandedSection}>
          {/* Detailed metrics grid */}
          <View style={styles.metricsGrid}>
            <MetricCell label="Flashcards" value={`${metrics.flashcardsReviewed}`} icon="albums-outline" />
            <MetricCell label="Mastered" value={`${metrics.flashcardsMastered}`} icon="star-outline" />
            <MetricCell label="Lessons" value={`${metrics.lessonsCompleted}`} icon="book-outline" />
            <MetricCell label="Conversations" value={`${metrics.conversationMinutes}m`} icon="chatbubbles-outline" />
            <MetricCell label="Drills" value={`${metrics.drillSessionsCompleted}`} icon="fitness-outline" />
            <MetricCell label="Drill Acc." value={`${Math.round(metrics.drillAccuracy)}%`} icon="analytics-outline" />
            <MetricCell label="Gaps Closed" value={`${metrics.knowledgeGapsClosed}`} icon="git-merge-outline" />
            <MetricCell label="New Skills" value={`${metrics.newSkillsIntroduced}`} icon="add-circle-outline" />
          </View>

          {/* Highlights */}
          {report.highlights.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>✨ Highlights</Text>
              {report.highlights.map((h, i) => (
                <Text key={i} style={styles.detailItem}>• {h}</Text>
              ))}
            </View>
          )}

          {/* Areas of improvement */}
          {report.areasOfImprovement.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>🎯 Focus Areas</Text>
              {report.areasOfImprovement.map((a, i) => (
                <Text key={i} style={styles.detailItem}>• {a}</Text>
              ))}
            </View>
          )}

          {/* Teacher note */}
          {report.teacherNote && (
            <View style={styles.teacherNoteBox}>
              <Text style={styles.teacherNoteLabel}>📝 Teacher's Note</Text>
              <Text style={styles.teacherNoteText}>{report.teacherNote}</Text>
            </View>
          )}

          {/* Generated date */}
          <Text style={styles.generatedDate}>
            Generated {formatFullDate(report.generatedAt)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MetricCell({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.metricCell}>
      <Ionicons name={icon as any} size={16} color={Colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function ViewPastReportsScreen() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const history = await getWeeklyReportHistory();
      // Sort newest first
      history.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      setReports(history);
    } catch (err) {
      console.warn("Failed to load report history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleGenerateNow = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setGenerating(true);
    try {
      await sendImmediateProgressNotification();
      // Reload after generation
      await loadReports();
    } catch (err) {
      console.warn("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // ─── Empty State ────────────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Reports Yet</Text>
      <Text style={styles.emptySubtext}>
        Weekly progress reports are generated every Sunday at 6 PM.
        Generate your first report now to see how you're doing!
      </Text>
      <TouchableOpacity
        style={styles.generateBtn}
        onPress={handleGenerateNow}
        disabled={generating}
        activeOpacity={0.8}
      >
        {generating ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.generateBtnText}>Generate Report Now</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // ─── Header ─────────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Summary stats */}
      {reports.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{reports.length}</Text>
            <Text style={styles.summaryLabel}>Reports</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: gradeColor(reports[0].grade) }]}>
              {reports[0].grade}
            </Text>
            <Text style={styles.summaryLabel}>Latest</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {Math.round(reports.reduce((sum, r) => sum + r.metrics.overallMastery, 0) / reports.length)}%
            </Text>
            <Text style={styles.summaryLabel}>Avg Mastery</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {gradeEmoji(reports[0].grade)}
            </Text>
            <Text style={styles.summaryLabel}>Trend</Text>
          </View>
        </View>
      )}

      {/* Grade trend chart */}
      <GradeTrendChart reports={reports} />

      {/* Generate button */}
      <TouchableOpacity
        style={styles.generateSmallBtn}
        onPress={handleGenerateNow}
        disabled={generating}
        activeOpacity={0.8}
      >
        {generating ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <>
            <Ionicons name="refresh" size={16} color={Colors.primary} />
            <Text style={styles.generateSmallBtnText}>Generate New Report</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Report History</Text>
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Navigation header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Past Reports</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push("/compare-weeks" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="git-compare-outline" size={22} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : reports.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <ReportItem
              report={item}
              isExpanded={expandedIndex === index}
              onToggle={() => toggleExpand(index)}
            />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  headerContent: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  chartArea: {
    flexDirection: "row",
  },
  yAxis: {
    width: 24,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  yLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  chartBody: {
    flex: 1,
    position: "relative",
    marginLeft: 8,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
  },
  pointsRow: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "space-evenly",
  },
  pointColumn: {
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  dataPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
  },
  pointLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  generateSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary + "15",
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  generateSmallBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  // Report card
  reportCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportCardExpanded: {
    borderColor: Colors.primary + "50",
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  gradeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: {
    fontSize: FontSize.lg,
    fontWeight: "800",
  },
  reportMeta: {
    flex: 1,
    gap: 2,
  },
  reportDateRange: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  reportSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  reportRight: {
    alignItems: "center",
    gap: 2,
  },
  masteryText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
  quickStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: Spacing.sm,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  expandedSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricCell: {
    width: "22%",
    alignItems: "center",
    gap: 2,
    padding: 6,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  metricValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
  },
  metricLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  detailSection: {
    marginBottom: Spacing.sm,
  },
  detailTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  detailItem: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    paddingLeft: 4,
  },
  teacherNoteBox: {
    backgroundColor: Colors.primary + "10",
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  teacherNoteLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 4,
  },
  teacherNoteText: {
    fontSize: FontSize.xs,
    color: Colors.text,
    lineHeight: 18,
    fontStyle: "italic",
  },
  generatedDate: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.sm,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  generateBtnText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: "#fff",
  },
});
