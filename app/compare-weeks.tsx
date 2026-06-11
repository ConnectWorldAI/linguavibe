/**
 * Compare Weeks Screen
 * 
 * Lets users select two weekly reports and view them side-by-side
 * to see exactly what improved, declined, or stayed the same.
 */
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
  type WeeklyReport,
  type WeeklyMetrics,
} from "@/lib/weekly-progress-notification";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function formatWeekShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateRange(startDate: string, endDate: string): string {
  return `${formatWeekShort(startDate)} – ${formatWeekShort(endDate)}`;
}

type MetricKey = keyof WeeklyMetrics;

interface ComparisonMetric {
  label: string;
  key: MetricKey;
  icon: string;
  format: "number" | "percent" | "minutes" | "text";
  higherIsBetter: boolean;
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  { label: "Overall Mastery", key: "overallMastery", icon: "trophy-outline", format: "percent", higherIsBetter: true },
  { label: "Accuracy", key: "averageAccuracy", icon: "checkmark-circle-outline", format: "percent", higherIsBetter: true },
  { label: "Sessions", key: "sessionsCompleted", icon: "calendar-outline", format: "number", higherIsBetter: true },
  { label: "Total Minutes", key: "totalMinutes", icon: "time-outline", format: "minutes", higherIsBetter: true },
  { label: "Streak Days", key: "streakDays", icon: "flame-outline", format: "number", higherIsBetter: true },
  { label: "Flashcards Reviewed", key: "flashcardsReviewed", icon: "albums-outline", format: "number", higherIsBetter: true },
  { label: "Flashcards Mastered", key: "flashcardsMastered", icon: "star-outline", format: "number", higherIsBetter: true },
  { label: "Lessons Completed", key: "lessonsCompleted", icon: "book-outline", format: "number", higherIsBetter: true },
  { label: "Conversation Minutes", key: "conversationMinutes", icon: "chatbubbles-outline", format: "minutes", higherIsBetter: true },
  { label: "Drills Completed", key: "drillSessionsCompleted", icon: "fitness-outline", format: "number", higherIsBetter: true },
  { label: "Drill Accuracy", key: "drillAccuracy", icon: "analytics-outline", format: "percent", higherIsBetter: true },
  { label: "Error Patterns Fixed", key: "errorPatternsFixed", icon: "git-merge-outline", format: "number", higherIsBetter: true },
  { label: "Errors Remaining", key: "errorPatternsRemaining", icon: "alert-circle-outline", format: "number", higherIsBetter: false },
  { label: "Knowledge Gaps Closed", key: "knowledgeGapsClosed", icon: "close-circle-outline", format: "number", higherIsBetter: true },
  { label: "New Skills", key: "newSkillsIntroduced", icon: "add-circle-outline", format: "number", higherIsBetter: true },
  { label: "Difficulty Level", key: "currentDifficulty", icon: "speedometer-outline", format: "number", higherIsBetter: true },
];

// ─── Report Selector ────────────────────────────────────────────────────────

function ReportSelector({
  reports,
  selectedIndex,
  onSelect,
  label,
  otherSelectedIndex,
}: {
  reports: WeeklyReport[];
  selectedIndex: number | null;
  onSelect: (idx: number) => void;
  label: string;
  otherSelectedIndex: number | null;
}) {
  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
        {reports.map((report, idx) => {
          const isSelected = selectedIndex === idx;
          const isOther = otherSelectedIndex === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.selectorChip,
                isSelected && styles.selectorChipSelected,
                isOther && styles.selectorChipDisabled,
              ]}
              onPress={() => {
                if (!isOther) {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(idx);
                }
              }}
              activeOpacity={isOther ? 1 : 0.7}
              disabled={isOther}
            >
              <Text style={[
                styles.chipGrade,
                isSelected && styles.chipGradeSelected,
                { color: isSelected ? "#fff" : gradeColor(report.grade) },
              ]}>
                {report.grade}
              </Text>
              <Text style={[styles.chipDate, isSelected && styles.chipDateSelected]}>
                {formatWeekShort(report.metrics.weekStartDate)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Comparison Row ─────────────────────────────────────────────────────────

function ComparisonRow({
  metric,
  leftValue,
  rightValue,
}: {
  metric: ComparisonMetric;
  leftValue: number | string;
  rightValue: number | string;
}) {
  const leftNum = typeof leftValue === "number" ? leftValue : 0;
  const rightNum = typeof rightValue === "number" ? rightValue : 0;
  const diff = rightNum - leftNum;
  const improved = metric.higherIsBetter ? diff > 0 : diff < 0;
  const declined = metric.higherIsBetter ? diff < 0 : diff > 0;
  const unchanged = diff === 0;

  const formatValue = (val: number | string): string => {
    if (typeof val === "string") return val;
    if (metric.format === "percent") return `${Math.round(val)}%`;
    if (metric.format === "minutes") return `${Math.round(val)}m`;
    return `${Math.round(val)}`;
  };

  const changeColor = improved ? Colors.success : declined ? Colors.error : Colors.textSecondary;
  const changeIcon = improved ? "arrow-up" : declined ? "arrow-down" : "remove";

  return (
    <View style={styles.compRow}>
      <View style={styles.compLeft}>
        <Ionicons name={metric.icon as any} size={16} color={Colors.textSecondary} />
        <Text style={styles.compLabel}>{metric.label}</Text>
      </View>
      <View style={styles.compValues}>
        <Text style={styles.compValue}>{formatValue(leftValue)}</Text>
        <View style={[styles.compChange, { backgroundColor: changeColor + "15" }]}>
          <Ionicons name={changeIcon as any} size={12} color={changeColor} />
          <Text style={[styles.compChangeText, { color: changeColor }]}>
            {unchanged ? "—" : `${diff > 0 ? "+" : ""}${metric.format === "percent" ? `${Math.round(diff)}%` : Math.round(diff)}`}
          </Text>
        </View>
        <Text style={styles.compValue}>{formatValue(rightValue)}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function CompareWeeksScreen() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [leftIndex, setLeftIndex] = useState<number | null>(null);
  const [rightIndex, setRightIndex] = useState<number | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const history = await getWeeklyReportHistory();
      history.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      setReports(history);
      // Auto-select the two most recent if available
      if (history.length >= 2) {
        setLeftIndex(1); // Second most recent (older)
        setRightIndex(0); // Most recent (newer)
      }
    } catch (err) {
      console.warn("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const leftReport = leftIndex !== null ? reports[leftIndex] : null;
  const rightReport = rightIndex !== null ? reports[rightIndex] : null;
  const canCompare = leftReport && rightReport;

  // Calculate summary
  const summary = canCompare ? (() => {
    const leftGrade = gradeToNumeric(leftReport.grade);
    const rightGrade = gradeToNumeric(rightReport.grade);
    const gradeChange = rightGrade - leftGrade;
    const masteryChange = rightReport.metrics.overallMastery - leftReport.metrics.overallMastery;
    const accuracyChange = rightReport.metrics.averageAccuracy - leftReport.metrics.averageAccuracy;
    
    let improved = 0;
    let declined = 0;
    let unchanged = 0;
    for (const metric of COMPARISON_METRICS) {
      const lv = leftReport.metrics[metric.key];
      const rv = rightReport.metrics[metric.key];
      if (typeof lv === "number" && typeof rv === "number") {
        const diff = rv - lv;
        if (diff === 0) unchanged++;
        else if ((metric.higherIsBetter && diff > 0) || (!metric.higherIsBetter && diff < 0)) improved++;
        else declined++;
      }
    }

    return { gradeChange, masteryChange, accuracyChange, improved, declined, unchanged };
  })() : null;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Compare Weeks</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : reports.length < 2 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="git-compare-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Need More Data</Text>
          <Text style={styles.emptySubtext}>
            You need at least 2 weekly reports to compare. Keep learning and your reports will build up!
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Selectors */}
          <ReportSelector
            reports={reports}
            selectedIndex={leftIndex}
            onSelect={setLeftIndex}
            label="Week A (Older)"
            otherSelectedIndex={rightIndex}
          />
          <ReportSelector
            reports={reports}
            selectedIndex={rightIndex}
            onSelect={setRightIndex}
            label="Week B (Newer)"
            otherSelectedIndex={leftIndex}
          />

          {/* Summary Card */}
          {canCompare && summary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Comparison Summary</Text>
              <View style={styles.summaryRow}>
                {/* Grade change */}
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryGrade, { color: gradeColor(leftReport.grade) }]}>{leftReport.grade}</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
                  <Text style={[styles.summaryGrade, { color: gradeColor(rightReport.grade) }]}>{rightReport.grade}</Text>
                </View>
                {/* Metrics summary */}
                <View style={styles.summaryMetrics}>
                  <View style={styles.summaryMetricItem}>
                    <Ionicons name="trending-up" size={14} color={Colors.success} />
                    <Text style={[styles.summaryMetricText, { color: Colors.success }]}>{summary.improved} improved</Text>
                  </View>
                  <View style={styles.summaryMetricItem}>
                    <Ionicons name="trending-down" size={14} color={Colors.error} />
                    <Text style={[styles.summaryMetricText, { color: Colors.error }]}>{summary.declined} declined</Text>
                  </View>
                  <View style={styles.summaryMetricItem}>
                    <Ionicons name="remove" size={14} color={Colors.textSecondary} />
                    <Text style={[styles.summaryMetricText, { color: Colors.textSecondary }]}>{summary.unchanged} same</Text>
                  </View>
                </View>
              </View>

              {/* Key changes */}
              <View style={styles.keyChanges}>
                <View style={styles.keyChangeItem}>
                  <Text style={styles.keyChangeLabel}>Mastery</Text>
                  <Text style={[styles.keyChangeValue, { color: summary.masteryChange >= 0 ? Colors.success : Colors.error }]}>
                    {summary.masteryChange >= 0 ? "+" : ""}{Math.round(summary.masteryChange)}%
                  </Text>
                </View>
                <View style={styles.keyChangeDivider} />
                <View style={styles.keyChangeItem}>
                  <Text style={styles.keyChangeLabel}>Accuracy</Text>
                  <Text style={[styles.keyChangeValue, { color: summary.accuracyChange >= 0 ? Colors.success : Colors.error }]}>
                    {summary.accuracyChange >= 0 ? "+" : ""}{Math.round(summary.accuracyChange)}%
                  </Text>
                </View>
                <View style={styles.keyChangeDivider} />
                <View style={styles.keyChangeItem}>
                  <Text style={styles.keyChangeLabel}>Grade</Text>
                  <Text style={[styles.keyChangeValue, { color: summary.gradeChange >= 0 ? Colors.success : Colors.error }]}>
                    {summary.gradeChange > 0 ? `+${summary.gradeChange}` : summary.gradeChange === 0 ? "—" : `${summary.gradeChange}`}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Detailed Comparison */}
          {canCompare && (
            <View style={styles.detailSection}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>Metric-by-Metric</Text>
                <View style={styles.detailHeaderLabels}>
                  <Text style={styles.detailHeaderLabel}>
                    {formatWeekShort(leftReport.metrics.weekStartDate)}
                  </Text>
                  <Text style={styles.detailHeaderLabelCenter}>Change</Text>
                  <Text style={styles.detailHeaderLabel}>
                    {formatWeekShort(rightReport.metrics.weekStartDate)}
                  </Text>
                </View>
              </View>
              {COMPARISON_METRICS.map((metric) => {
                const lv = leftReport.metrics[metric.key];
                const rv = rightReport.metrics[metric.key];
                if (typeof lv === "string" || typeof rv === "string") return null;
                return (
                  <ComparisonRow
                    key={metric.key}
                    metric={metric}
                    leftValue={lv as number}
                    rightValue={rv as number}
                  />
                );
              })}
            </View>
          )}

          {/* Highlights Comparison */}
          {canCompare && (
            <View style={styles.highlightsSection}>
              <Text style={styles.detailTitle}>Highlights Comparison</Text>
              <View style={styles.highlightsRow}>
                <View style={styles.highlightsCol}>
                  <Text style={styles.highlightsColTitle}>
                    {formatWeekShort(leftReport.metrics.weekStartDate)}
                  </Text>
                  {leftReport.highlights.length > 0 ? (
                    leftReport.highlights.map((h, i) => (
                      <Text key={i} style={styles.highlightItem}>• {h}</Text>
                    ))
                  ) : (
                    <Text style={styles.highlightEmpty}>No highlights</Text>
                  )}
                </View>
                <View style={styles.highlightsDivider} />
                <View style={styles.highlightsCol}>
                  <Text style={styles.highlightsColTitle}>
                    {formatWeekShort(rightReport.metrics.weekStartDate)}
                  </Text>
                  {rightReport.highlights.length > 0 ? (
                    rightReport.highlights.map((h, i) => (
                      <Text key={i} style={styles.highlightItem}>• {h}</Text>
                    ))
                  ) : (
                    <Text style={styles.highlightEmpty}>No highlights</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Focus Areas Comparison */}
          {canCompare && (
            <View style={styles.highlightsSection}>
              <Text style={styles.detailTitle}>Focus Areas Comparison</Text>
              <View style={styles.highlightsRow}>
                <View style={styles.highlightsCol}>
                  <Text style={styles.highlightsColTitle}>
                    {formatWeekShort(leftReport.metrics.weekStartDate)}
                  </Text>
                  {leftReport.areasOfImprovement.length > 0 ? (
                    leftReport.areasOfImprovement.map((a, i) => (
                      <Text key={i} style={styles.highlightItem}>• {a}</Text>
                    ))
                  ) : (
                    <Text style={styles.highlightEmpty}>None identified</Text>
                  )}
                </View>
                <View style={styles.highlightsDivider} />
                <View style={styles.highlightsCol}>
                  <Text style={styles.highlightsColTitle}>
                    {formatWeekShort(rightReport.metrics.weekStartDate)}
                  </Text>
                  {rightReport.areasOfImprovement.length > 0 ? (
                    rightReport.areasOfImprovement.map((a, i) => (
                      <Text key={i} style={styles.highlightItem}>• {a}</Text>
                    ))
                  ) : (
                    <Text style={styles.highlightEmpty}>None identified</Text>
                  )}
                </View>
              </View>
            </View>
          )}

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
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
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
  backButton: {
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  backButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  // Selectors
  selectorContainer: {
    marginBottom: Spacing.md,
  },
  selectorLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  selectorScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 2,
  },
  selectorChipSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  selectorChipDisabled: {
    opacity: 0.4,
  },
  chipGrade: {
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  chipGradeSelected: {
    color: "#fff",
  },
  chipDate: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  chipDateSelected: {
    color: "rgba(255,255,255,0.8)",
  },
  // Summary
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryGrade: {
    fontSize: FontSize.xl,
    fontWeight: "800",
  },
  summaryMetrics: {
    gap: 4,
  },
  summaryMetricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryMetricText: {
    fontSize: 11,
    fontWeight: "500",
  },
  keyChanges: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  keyChangeItem: {
    alignItems: "center",
    gap: 2,
  },
  keyChangeLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  keyChangeValue: {
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  keyChangeDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  // Detail section
  detailSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailHeader: {
    marginBottom: Spacing.sm,
  },
  detailTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  detailHeaderLabels: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  detailHeaderLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    width: 50,
    textAlign: "center",
  },
  detailHeaderLabelCenter: {
    fontSize: 10,
    color: Colors.textSecondary,
    width: 60,
    textAlign: "center",
  },
  // Comparison row
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  compLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  compLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  compValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compValue: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    width: 42,
    textAlign: "center",
  },
  compChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 50,
    justifyContent: "center",
  },
  compChangeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  // Highlights
  highlightsSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  highlightsRow: {
    flexDirection: "row",
    gap: 8,
  },
  highlightsCol: {
    flex: 1,
  },
  highlightsColTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.secondary,
    marginBottom: 6,
  },
  highlightItem: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 3,
  },
  highlightEmpty: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  highlightsDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
});
