/**
 * Weekly Grammar Progress Report
 * Email-style summary card showing mistakes reduced, streak maintained,
 * and top improved categories over the past week.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { getMistakes, type GrammarMistake } from "@/lib/grammar-mistakes";
import { getStreakData } from "@/lib/grammar-streak";
import { getCorrectionHistory } from "@/lib/grammar-correction-parser";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalMistakes: number;
  previousWeekMistakes: number;
  mistakeReduction: number; // percentage
  streakDays: number;
  longestStreak: number;
  topCategories: { category: string; count: number; trend: "up" | "down" | "same" }[];
  improvedCategories: { category: string; reduction: number }[];
  conversationCorrections: number;
  quizMistakes: number;
  languagesStudied: string[];
  dailyBreakdown: { day: string; count: number }[];
  grade: "A" | "B" | "C" | "D" | "F";
}

const REPORT_HISTORY_KEY = "@grammar_weekly_reports";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getWeekBounds(weeksAgo: number = 0): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - dayOfWeek - (weeksAgo * 7));
  startOfThisWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfThisWeek);
  endOfWeek.setDate(startOfThisWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { start: startOfThisWeek, end: endOfWeek };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function calculateGrade(report: WeeklyReport): "A" | "B" | "C" | "D" | "F" {
  let score = 50; // Base score

  // Streak bonus (up to +20)
  score += Math.min(20, report.streakDays * 3);

  // Mistake reduction bonus (up to +20)
  if (report.mistakeReduction > 0) score += Math.min(20, report.mistakeReduction / 2);

  // Active practice bonus (up to +10)
  if (report.conversationCorrections > 0) score += 5;
  if (report.quizMistakes > 0) score += 5;

  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

async function generateWeeklyReport(): Promise<WeeklyReport> {
  const thisWeek = getWeekBounds(0);
  const lastWeek = getWeekBounds(1);

  const allMistakes = await getMistakes();
  const streakData = await getStreakData();
  const correctionHistory = await getCorrectionHistory(14);

  // Filter mistakes by week
  const thisWeekMistakes = allMistakes.filter(
    (m) => m.timestamp >= thisWeek.start.getTime() && m.timestamp <= thisWeek.end.getTime()
  );
  const lastWeekMistakes = allMistakes.filter(
    (m) => m.timestamp >= lastWeek.start.getTime() && m.timestamp <= lastWeek.end.getTime()
  );

  // Calculate reduction
  const thisCount = thisWeekMistakes.length;
  const lastCount = lastWeekMistakes.length;
  const reduction = lastCount > 0
    ? Math.round(((lastCount - thisCount) / lastCount) * 100)
    : 0;

  // Category analysis
  const categoryCountsThis: Record<string, number> = {};
  const categoryCountsLast: Record<string, number> = {};

  for (const m of thisWeekMistakes) {
    categoryCountsThis[m.category] = (categoryCountsThis[m.category] || 0) + 1;
  }
  for (const m of lastWeekMistakes) {
    categoryCountsLast[m.category] = (categoryCountsLast[m.category] || 0) + 1;
  }

  const topCategories = Object.entries(categoryCountsThis)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => {
      const lastCount = categoryCountsLast[category] || 0;
      const trend: "up" | "down" | "same" = count < lastCount ? "down" : count > lastCount ? "up" : "same";
      return { category, count, trend };
    });

  // Improved categories (fewer mistakes than last week)
  const improvedCategories = Object.entries(categoryCountsLast)
    .filter(([cat]) => (categoryCountsThis[cat] || 0) < categoryCountsLast[cat]!)
    .map(([category, lastCount]) => ({
      category,
      reduction: Math.round(((lastCount! - (categoryCountsThis[category] || 0)) / lastCount!) * 100),
    }))
    .sort((a, b) => b.reduction - a.reduction)
    .slice(0, 3);

  // Source breakdown
  const conversationCorrections = thisWeekMistakes.filter((m) => m.source === "conversation").length;
  const quizMistakes = thisWeekMistakes.filter((m) => m.source === "quiz").length;

  // Languages studied
  const languagesStudied = [...new Set(thisWeekMistakes.map((m) => m.language))];

  // Daily breakdown
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyBreakdown = days.map((day, i) => {
    const dayStart = new Date(thisWeek.start);
    dayStart.setDate(thisWeek.start.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const count = thisWeekMistakes.filter(
      (m) => m.timestamp >= dayStart.getTime() && m.timestamp <= dayEnd.getTime()
    ).length;
    return { day, count };
  });

  const report: WeeklyReport = {
    weekStart: formatDate(thisWeek.start),
    weekEnd: formatDate(thisWeek.end),
    totalMistakes: thisCount,
    previousWeekMistakes: lastCount,
    mistakeReduction: reduction,
    streakDays: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    topCategories,
    improvedCategories,
    conversationCorrections,
    quizMistakes,
    languagesStudied,
    dailyBreakdown,
    grade: "C", // Placeholder, calculated below
  };

  report.grade = calculateGrade(report);

  // Save to history
  try {
    const stored = await AsyncStorage.getItem(REPORT_HISTORY_KEY);
    const history: WeeklyReport[] = stored ? JSON.parse(stored) : [];
    // Avoid duplicate for same week
    const existingIdx = history.findIndex((r) => r.weekStart === report.weekStart);
    if (existingIdx >= 0) {
      history[existingIdx] = report;
    } else {
      history.push(report);
    }
    if (history.length > 12) history.splice(0, history.length - 12);
    await AsyncStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(history));
  } catch {}

  return report;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function GrammarProgressReportScreen() {
  const router = useRouter();
  const colors = useColors();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateWeeklyReport().then((r) => {
      setReport(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleShare = async () => {
    if (!report) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = `📊 My Grammar Progress Report (${report.weekStart} - ${report.weekEnd})\n\n` +
      `Grade: ${report.grade}\n` +
      `🔥 Streak: ${report.streakDays} days\n` +
      `📉 Mistakes reduced: ${report.mistakeReduction > 0 ? report.mistakeReduction + "%" : "Working on it!"}\n` +
      `📚 Languages: ${report.languagesStudied.join(", ") || "None this week"}\n\n` +
      `#LinguaVibe #LanguageLearning`;
    try {
      await Share.share({ message: text });
    } catch {}
  };

  const gradeColors: Record<string, string> = {
    A: "#22C55E",
    B: "#4ADE80",
    C: "#F59E0B",
    D: "#F97316",
    F: "#EF4444",
  };

  const formatCategory = (cat: string) =>
    cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>Generating your report...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!report) {
    return (
      <ScreenContainer className="p-6">
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>No data available yet. Keep practicing!</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Weekly Report</Text>
          <TouchableOpacity onPress={handleShare} style={styles.headerShare}>
            <Ionicons name="share-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Email-style card */}
        <View style={[styles.emailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Subject line */}
          <View style={styles.emailHeader}>
            <Text style={[styles.emailSubject, { color: colors.foreground }]}>
              📊 Grammar Progress Report
            </Text>
            <Text style={[styles.emailDate, { color: colors.muted }]}>
              {report.weekStart} — {report.weekEnd}
            </Text>
          </View>

          {/* Grade badge */}
          <View style={[styles.gradeBadge, { backgroundColor: gradeColors[report.grade] + "20" }]}>
            <Text style={[styles.gradeLabel, { color: gradeColors[report.grade] }]}>
              Grade
            </Text>
            <Text style={[styles.gradeValue, { color: gradeColors[report.grade] }]}>
              {report.grade}
            </Text>
            <Text style={[styles.gradeDesc, { color: colors.muted }]}>
              {report.grade === "A" ? "Excellent progress!" :
               report.grade === "B" ? "Great work!" :
               report.grade === "C" ? "Keep it up!" :
               report.grade === "D" ? "Room to improve" : "Let's get back on track"}
            </Text>
          </View>

          {/* Key metrics */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
              <Ionicons name="flame" size={20} color="#F59E0B" />
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{report.streakDays}</Text>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>Day Streak</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
              <Ionicons name="trending-down" size={20} color={report.mistakeReduction > 0 ? "#22C55E" : "#EF4444"} />
              <Text style={[styles.metricValue, { color: colors.foreground }]}>
                {report.mistakeReduction > 0 ? `-${report.mistakeReduction}%` : report.mistakeReduction === 0 ? "0%" : `+${Math.abs(report.mistakeReduction)}%`}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>Mistakes</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.background }]}>
              <Ionicons name="chatbubbles" size={20} color="#7C3AED" />
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{report.conversationCorrections}</Text>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>Chat Fixes</Text>
            </View>
          </View>

          {/* Daily breakdown bar chart */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Activity</Text>
            <View style={styles.barChart}>
              {report.dailyBreakdown.map((d, i) => {
                const maxCount = Math.max(...report.dailyBreakdown.map((x) => x.count), 1);
                const height = Math.max(4, (d.count / maxCount) * 60);
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.bar, { height, backgroundColor: d.count > 0 ? colors.primary : colors.border }]} />
                    <Text style={[styles.barLabel, { color: colors.muted }]}>{d.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Top mistake categories */}
          {report.topCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Mistake Areas</Text>
              {report.topCategories.map((cat, i) => (
                <View key={i} style={[styles.categoryRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.categoryLeft}>
                    <Text style={[styles.categoryName, { color: colors.foreground }]}>
                      {formatCategory(cat.category)}
                    </Text>
                    <Text style={[styles.categoryCount, { color: colors.muted }]}>
                      {cat.count} mistake{cat.count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={[styles.trendBadge, {
                    backgroundColor: cat.trend === "down" ? "#22C55E20" : cat.trend === "up" ? "#EF444420" : colors.background
                  }]}>
                    <Ionicons
                      name={cat.trend === "down" ? "trending-down" : cat.trend === "up" ? "trending-up" : "remove"}
                      size={14}
                      color={cat.trend === "down" ? "#22C55E" : cat.trend === "up" ? "#EF4444" : colors.muted}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Improved categories */}
          {report.improvedCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🎉 Most Improved</Text>
              {report.improvedCategories.map((cat, i) => (
                <View key={i} style={[styles.improvedRow, { backgroundColor: "#22C55E10" }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                  <Text style={[styles.improvedText, { color: colors.foreground }]}>
                    {formatCategory(cat.category)}
                  </Text>
                  <Text style={styles.improvedPercent}>-{cat.reduction}%</Text>
                </View>
              ))}
            </View>
          )}

          {/* Languages studied */}
          {report.languagesStudied.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Languages Practiced</Text>
              <View style={styles.langRow}>
                {report.languagesStudied.map((lang, i) => (
                  <View key={i} style={[styles.langPill, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.langText, { color: colors.primary }]}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Summary stats */}
          <View style={[styles.summaryBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>This Week Summary</Text>
            <Text style={[styles.summaryLine, { color: colors.muted }]}>
              • Total mistakes logged: {report.totalMistakes} (last week: {report.previousWeekMistakes})
            </Text>
            <Text style={[styles.summaryLine, { color: colors.muted }]}>
              • From conversations: {report.conversationCorrections}
            </Text>
            <Text style={[styles.summaryLine, { color: colors.muted }]}>
              • From quizzes: {report.quizMistakes}
            </Text>
            <Text style={[styles.summaryLine, { color: colors.muted }]}>
              • Longest streak: {report.longestStreak} days
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => { router.push("/grammar-mistake-journal" as any); }}
          >
            <Ionicons name="journal" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>View Mistake Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => { router.push("/grammar-quiz" as any); }}
          >
            <Ionicons name="school" size={18} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Take Grammar Quiz</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontSize: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: "#fff", fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerBack: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerShare: { padding: 4 },
  emailCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20 },
  emailHeader: { marginBottom: 16 },
  emailSubject: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  emailDate: { fontSize: 13 },
  gradeBadge: { alignItems: "center", padding: 20, borderRadius: 12, marginBottom: 20 },
  gradeLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  gradeValue: { fontSize: 48, fontWeight: "800", marginVertical: 4 },
  gradeDesc: { fontSize: 13 },
  metricsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  metricCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: 10, gap: 4 },
  metricValue: { fontSize: 18, fontWeight: "700" },
  metricLabel: { fontSize: 11 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  barChart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 80 },
  barCol: { alignItems: "center", flex: 1, gap: 4 },
  bar: { width: 20, borderRadius: 4 },
  barLabel: { fontSize: 10 },
  categoryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5 },
  categoryLeft: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: "500" },
  categoryCount: { fontSize: 12, marginTop: 2 },
  trendBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  improvedRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, marginBottom: 6 },
  improvedText: { flex: 1, fontSize: 14, fontWeight: "500" },
  improvedPercent: { fontSize: 14, fontWeight: "700", color: "#22C55E" },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  langPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  langText: { fontSize: 13, fontWeight: "600" },
  summaryBox: { padding: 16, borderRadius: 10, borderWidth: 1 },
  summaryTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  summaryLine: { fontSize: 13, marginBottom: 4, lineHeight: 20 },
  actions: { gap: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 10 },
  actionBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
