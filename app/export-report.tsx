/**
 * Export Report Screen
 * 
 * Generates a beautiful shareable image/card of the Progress Report Card
 * including the goal streak badge, overall grade, and key metrics.
 * Uses react-native-view-shot to capture and expo-sharing to share.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";
import { calculateGoalStreak, getStreakBadge, getStreakDisplay } from "@/lib/goal-streak";
import { getShieldState } from "@/lib/streak-shield";

interface ReportData {
  overallGrade: string;
  overallScore: number;
  goalGrade: string | null;
  goalScore: number;
  streakWeeks: number;
  streakBadge: { emoji: string; title: string; color: string } | null;
  shieldsAvailable: number;
  weekLabel: string;
  targetLanguage: string;
  highlights: string[];
  metrics: { label: string; value: string }[];
}

export default function ExportReportScreen() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<"minimal" | "detailed" | "social">("detailed");
  const cardRef = useRef<View>(null);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      // Load latest weekly report
      const reportsRaw = await AsyncStorage.getItem("@weekly_reports");
      const reports = reportsRaw ? JSON.parse(reportsRaw) : [];
      const latestReport = reports.length > 0 ? reports[0] : null;

      // Load streak
      const streak = await calculateGoalStreak();
      const badge = getStreakBadge(streak.currentStreak);

      // Load shield state
      const shieldState = await getShieldState();

      // Load goal grade
      let goalGrade: string | null = null;
      let goalScore = 0;
      try {
        const { getCurrentGoals, gradeGoals } = await import("@/lib/weekly-goals-storage");
        const goals = await getCurrentGoals();
        if (goals.length > 0) {
          const result = gradeGoals(goals);
          goalGrade = result.grade;
          goalScore = result.score;
        }
      } catch {}

      // Load language
      let targetLanguage = "Spanish";
      try {
        const prefs = await AsyncStorage.getItem("@language_preferences");
        if (prefs) {
          const parsed = JSON.parse(prefs);
          if (parsed.targetLanguage) targetLanguage = parsed.targetLanguage;
        }
      } catch {}

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());

      setReportData({
        overallGrade: latestReport?.overallGrade || "B+",
        overallScore: latestReport?.metrics?.overallScore || 78,
        goalGrade,
        goalScore,
        streakWeeks: streak.currentStreak,
        streakBadge: badge ? { emoji: badge.emoji, title: badge.title, color: badge.color } : null,
        shieldsAvailable: shieldState.shieldsAvailable,
        weekLabel: `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        targetLanguage,
        highlights: latestReport?.highlights || ["Consistent daily practice", "Vocabulary growth"],
        metrics: [
          { label: "Mastery", value: `${latestReport?.metrics?.masteryLevel || 72}%` },
          { label: "Accuracy", value: `${latestReport?.metrics?.accuracy || 81}%` },
          { label: "Sessions", value: `${latestReport?.metrics?.sessionsCompleted || 5}` },
          { label: "Words", value: `${latestReport?.metrics?.wordsLearned || 34}` },
        ],
      });
    } catch (err) {
      console.warn("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = useCallback(async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const uri = await captureRef(cardRef.current, {
        format: "png",
        quality: 1.0,
        result: "tmpfile",
      });

      if (Platform.OS === "web") {
        await Share.share({
          message: `My ${reportData?.targetLanguage} learning report: Grade ${reportData?.overallGrade} • ${reportData?.streakWeeks}-week streak 🔥`,
        });
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share Your Report Card",
          UTI: "public.png",
        });
      } else {
        await Share.share({
          message: `My ${reportData?.targetLanguage} learning report: Grade ${reportData?.overallGrade} • ${reportData?.streakWeeks}-week streak 🔥`,
        });
      }
    } catch {
      await Share.share({
        message: `My ${reportData?.targetLanguage} learning report: Grade ${reportData?.overallGrade}`,
      });
    } finally {
      setExporting(false);
    }
  }, [reportData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loadingText}>Preparing your report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!reportData) return null;

  const gradeColor = (grade: string): string => {
    if (grade.startsWith("A")) return "#10B981";
    if (grade.startsWith("B")) return "#3B82F6";
    if (grade.startsWith("C")) return "#F59E0B";
    if (grade.startsWith("D")) return "#F97316";
    return "#EF4444";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Export Report</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Style Selector */}
        <View style={styles.styleSelector}>
          {(["minimal", "detailed", "social"] as const).map((style) => (
            <TouchableOpacity
              key={style}
              style={[styles.styleBtn, selectedStyle === style && styles.styleBtnActive]}
              onPress={() => setSelectedStyle(style)}
            >
              <Text style={[styles.styleBtnText, selectedStyle === style && styles.styleBtnTextActive]}>
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Shareable Card */}
        <View style={styles.cardWrapper}>
          <View ref={cardRef} collapsable={false} style={styles.shareableCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardBrand}>ConnectWorld AI</Text>
              <Text style={styles.cardWeek}>{reportData.weekLabel}</Text>
            </View>

            {/* Grade Section */}
            <View style={styles.gradeSection}>
              <View style={[styles.gradeBubble, { backgroundColor: gradeColor(reportData.overallGrade) + "20" }]}>
                <Text style={[styles.gradeText, { color: gradeColor(reportData.overallGrade) }]}>
                  {reportData.overallGrade}
                </Text>
              </View>
              <Text style={styles.gradeLabel}>{reportData.targetLanguage} Progress</Text>
              <Text style={styles.gradeScore}>{reportData.overallScore}% overall score</Text>
            </View>

            {/* Streak Badge */}
            {reportData.streakWeeks > 0 && (
              <View style={styles.streakSection}>
                <Text style={{ fontSize: 20 }}>
                  {reportData.streakBadge?.emoji || "🔥"}
                </Text>
                <Text style={[styles.streakText, { color: reportData.streakBadge?.color || "#F97316" }]}>
                  {reportData.streakWeeks}-week streak
                  {reportData.streakBadge ? ` • ${reportData.streakBadge.title}` : ""}
                </Text>
                {reportData.shieldsAvailable > 0 && (
                  <Text style={styles.shieldBadge}>
                    🛡️ {reportData.shieldsAvailable}
                  </Text>
                )}
              </View>
            )}

            {/* Goal Grade (if available) */}
            {reportData.goalGrade && selectedStyle !== "minimal" && (
              <View style={styles.goalSection}>
                <View style={[styles.goalBadge, { backgroundColor: gradeColor(reportData.goalGrade) + "15" }]}>
                  <Text style={[styles.goalGradeText, { color: gradeColor(reportData.goalGrade) }]}>
                    {reportData.goalGrade}
                  </Text>
                </View>
                <Text style={styles.goalLabel}>Personal Goals</Text>
              </View>
            )}

            {/* Metrics Grid */}
            {selectedStyle !== "minimal" && (
              <View style={styles.metricsGrid}>
                {reportData.metrics.map((metric, idx) => (
                  <View key={idx} style={styles.metricItem}>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Highlights */}
            {selectedStyle === "detailed" && reportData.highlights.length > 0 && (
              <View style={styles.highlightsSection}>
                {reportData.highlights.slice(0, 2).map((h, idx) => (
                  <View key={idx} style={styles.highlightRow}>
                    <Text style={styles.highlightDot}>✓</Text>
                    <Text style={styles.highlightText}>{h}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>Learning with ConnectWorld AI</Text>
            </View>
          </View>
        </View>

        {/* Export Button */}
        <View style={styles.exportSection}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExport}
            disabled={exporting}
            activeOpacity={0.8}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="share" size={20} color="#fff" />
                <Text style={styles.exportBtnText}>Share Report Card</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.copyBtn}
            onPress={async () => {
              await Share.share({
                message: `📊 My ${reportData.targetLanguage} Report Card\n\nGrade: ${reportData.overallGrade} (${reportData.overallScore}%)\n🔥 ${reportData.streakWeeks}-week streak\n${reportData.metrics.map(m => `${m.label}: ${m.value}`).join("\n")}\n\n— ConnectWorld AI`,
              });
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="copy-outline" size={18} color={Colors.secondary} />
            <Text style={styles.copyBtnText}>Share as Text</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  styleSelector: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 4,
  },
  styleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  styleBtnActive: {
    backgroundColor: Colors.secondary,
  },
  styleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  styleBtnTextActive: {
    color: "#fff",
  },
  cardWrapper: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  shareableCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF80",
    letterSpacing: 0.5,
  },
  cardWeek: {
    fontSize: 12,
    color: "#FFFFFF60",
  },
  gradeSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  gradeBubble: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  gradeText: {
    fontSize: 32,
    fontWeight: "900",
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFFDD",
  },
  gradeScore: {
    fontSize: 13,
    color: "#FFFFFF80",
    marginTop: 4,
  },
  streakSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF10",
    borderRadius: 12,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "700",
  },
  shieldBadge: {
    fontSize: 12,
    color: "#FFFFFF80",
    marginLeft: 4,
  },
  goalSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  goalBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  goalGradeText: {
    fontSize: 14,
    fontWeight: "800",
  },
  goalLabel: {
    fontSize: 13,
    color: "#FFFFFF90",
    fontWeight: "500",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    minWidth: "40%",
    backgroundColor: "#FFFFFF08",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFFEE",
  },
  metricLabel: {
    fontSize: 11,
    color: "#FFFFFF70",
    marginTop: 4,
  },
  highlightsSection: {
    marginBottom: 20,
    gap: 8,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  highlightDot: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "700",
  },
  highlightText: {
    fontSize: 13,
    color: "#FFFFFFBB",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF15",
    paddingTop: 14,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "#FFFFFF50",
    letterSpacing: 0.3,
  },
  exportSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  exportBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.secondary,
  },
});
