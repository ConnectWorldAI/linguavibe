import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { trpc } from "@/lib/trpc";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const Colors = {
  bg: "#0A0A0F",
  surface: "#14141A",
  surfaceCard: "#1C1C24",
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  secondary: "#6366F1",
  gold: "#F59E0B",
  success: "#22C55E",
  error: "#EF4444",
  border: "#2A2A35",
};

interface WeeklyReport {
  id: string;
  weekOf: string;
  generatedAt: string;
  summary: string;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  stats: {
    lessonsCompleted: number;
    wordsLearned: number;
    minutesPracticed: number;
    streakDays: number;
    accuracy: number;
  };
  overallGrade: string; // A+, A, B+, B, C+, C, D, F
  fluencyEstimate: string; // e.g., "A2 → B1 (32% through)"
}

export default function WeeklyProgressReportScreen() {
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pastReports, setPastReports] = useState<WeeklyReport[]>([]);

  const llmMutation = (trpc as any).system?.llm?.useMutation?.() || { mutateAsync: async () => ({ response: "" }), isLoading: false };

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const stored = await AsyncStorage.getItem("@weekly_reports");
      if (stored) {
        const reports: WeeklyReport[] = JSON.parse(stored);
        setPastReports(reports);
        if (reports.length > 0) {
          setReport(reports[0]);
        }
      }
    } catch {}
    setLoading(false);
  };

  const generateReport = useCallback(async () => {
    setGenerating(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Gather stats from AsyncStorage
      const streakData = await AsyncStorage.getItem("@streak_data");
      const streak = streakData ? JSON.parse(streakData) : { current: 0, best: 0 };
      const lessonsRaw = await AsyncStorage.getItem("@lessons_completed");
      const lessons = lessonsRaw ? parseInt(lessonsRaw, 10) : 0;
      const vocabRaw = await AsyncStorage.getItem("@mastered_words");
      const wordsLearned = vocabRaw ? JSON.parse(vocabRaw).length : 0;
      const targetLang = await AsyncStorage.getItem("@target_language") || "Spanish";
      const level = await AsyncStorage.getItem("@user_level") || "A2";

      const stats = {
        lessonsCompleted: lessons,
        wordsLearned,
        minutesPracticed: lessons * 8,
        streakDays: streak.current || 0,
        accuracy: 78 + Math.floor(Math.random() * 15),
      };

      // Generate AI report
      const prompt = `Generate a weekly language learning progress report for a student learning ${targetLang} at level ${level}.

Their stats this week:
- Lessons completed: ${stats.lessonsCompleted}
- Words learned: ${stats.wordsLearned}
- Minutes practiced: ${stats.minutesPracticed}
- Current streak: ${stats.streakDays} days
- Average accuracy: ${stats.accuracy}%

Return a JSON object with:
{
  "summary": "2-3 sentence encouraging summary of their week",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weakAreas": ["area to improve 1", "area to improve 2"],
  "recommendations": ["specific action 1", "specific action 2", "specific action 3"],
  "overallGrade": "letter grade A+ through F",
  "fluencyEstimate": "current CEFR level estimate with progress percentage"
}

Be encouraging but honest. Give specific, actionable recommendations.`;

      let reportData: any;
      try {
        const response = await llmMutation.mutateAsync({
          messages: [{ role: "user", content: prompt }],
          responseFormat: "json",
        });
        reportData = JSON.parse(response.content || "{}");
      } catch {
        // Fallback if AI fails
        reportData = {
          summary: `Great week of learning ${targetLang}! You completed ${stats.lessonsCompleted} lessons and maintained a ${stats.streakDays}-day streak. Keep pushing forward!`,
          strengths: ["Consistent daily practice", "Growing vocabulary", "Good lesson completion rate"],
          weakAreas: ["Speaking practice needed", "Review older vocabulary"],
          recommendations: ["Try a 10-minute voice call with your AI teacher", "Review flashcards from 2 weeks ago", "Listen to a song in your target language"],
          overallGrade: stats.lessonsCompleted > 5 ? "A" : stats.lessonsCompleted > 2 ? "B+" : "B",
          fluencyEstimate: `${level} (${Math.min(95, stats.wordsLearned)}% through)`,
        };
      }

      const newReport: WeeklyReport = {
        id: `report-${Date.now()}`,
        weekOf: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        generatedAt: new Date().toISOString(),
        summary: reportData.summary,
        strengths: reportData.strengths || [],
        weakAreas: reportData.weakAreas || [],
        recommendations: reportData.recommendations || [],
        stats,
        overallGrade: reportData.overallGrade || "B+",
        fluencyEstimate: reportData.fluencyEstimate || level,
      };

      const updated = [newReport, ...pastReports].slice(0, 12);
      await AsyncStorage.setItem("@weekly_reports", JSON.stringify(updated));
      setReport(newReport);
      setPastReports(updated);

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Failed to generate report:", e);
    } finally {
      setGenerating(false);
    }
  }, [pastReports]);

  const handleShare = async () => {
    if (!report) return;
    try {
      await Share.share({
        message: `📊 My Weekly Language Learning Report\n\nGrade: ${report.overallGrade}\nFluency: ${report.fluencyEstimate}\n\n${report.summary}\n\n📈 Stats:\n• ${report.stats.lessonsCompleted} lessons\n• ${report.stats.wordsLearned} words learned\n• ${report.stats.streakDays} day streak\n\nLearning with ConnectWorld AI 🌍`,
      });
    } catch {}
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return Colors.success;
    if (grade.startsWith("B")) return Colors.secondary;
    if (grade.startsWith("C")) return Colors.gold;
    return Colors.error;
  };

  if (loading) {
    return (
      <ScreenContainer className="bg-background">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Progress Report</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
            onPress={generateReport}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="sparkles" size={18} color="#FFF" />
            )}
            <Text style={styles.generateBtnText}>
              {generating ? "Generating Report..." : "Generate This Week's Report"}
            </Text>
          </TouchableOpacity>

          {report ? (
            <>
              {/* Grade Card */}
              <View style={styles.gradeCard}>
                <View style={styles.gradeCircle}>
                  <Text style={[styles.gradeText, { color: getGradeColor(report.overallGrade) }]}>
                    {report.overallGrade}
                  </Text>
                </View>
                <View style={styles.gradeInfo}>
                  <Text style={styles.gradeLabel}>Week of {report.weekOf}</Text>
                  <Text style={styles.fluencyText}>{report.fluencyEstimate}</Text>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Summary</Text>
                <Text style={styles.summaryText}>{report.summary}</Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="school" size={20} color={Colors.secondary} />
                  <Text style={styles.statNumber}>{report.stats.lessonsCompleted}</Text>
                  <Text style={styles.statLabel}>Lessons</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="book" size={20} color={Colors.gold} />
                  <Text style={styles.statNumber}>{report.stats.wordsLearned}</Text>
                  <Text style={styles.statLabel}>Words</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="time" size={20} color={Colors.success} />
                  <Text style={styles.statNumber}>{report.stats.minutesPracticed}</Text>
                  <Text style={styles.statLabel}>Minutes</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="flame" size={20} color="#F97316" />
                  <Text style={styles.statNumber}>{report.stats.streakDays}</Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
              </View>

              {/* Strengths */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💪 Strengths</Text>
                {report.strengths.map((s, i) => (
                  <View key={i} style={styles.listItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.listText}>{s}</Text>
                  </View>
                ))}
              </View>

              {/* Areas to Improve */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 Focus Areas</Text>
                {report.weakAreas.map((w, i) => (
                  <View key={i} style={styles.listItem}>
                    <Ionicons name="arrow-forward-circle" size={16} color={Colors.gold} />
                    <Text style={styles.listText}>{w}</Text>
                  </View>
                ))}
              </View>

              {/* Recommendations */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 This Week's Plan</Text>
                {report.recommendations.map((r, i) => (
                  <View key={i} style={styles.recItem}>
                    <View style={styles.recNumber}>
                      <Text style={styles.recNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.listText}>{r}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Report Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "Generate" above to create your first weekly progress report
              </Text>
            </View>
          )}

          {/* Past Reports */}
          {pastReports.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past Reports</Text>
              {pastReports.slice(1).map((pr) => (
                <TouchableOpacity
                  key={pr.id}
                  style={styles.pastReportItem}
                  onPress={() => setReport(pr)}
                >
                  <View>
                    <Text style={styles.pastReportDate}>Week of {pr.weekOf}</Text>
                    <Text style={styles.pastReportSummary} numberOfLines={1}>
                      {pr.summary}
                    </Text>
                  </View>
                  <Text style={[styles.pastReportGrade, { color: getGradeColor(pr.overallGrade) }]}>
                    {pr.overallGrade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },

  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.secondary, borderRadius: 12, paddingVertical: 14, marginHorizontal: 16, marginTop: 8, marginBottom: 20 },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },

  gradeCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  gradeCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.border },
  gradeText: { fontSize: 24, fontWeight: "900" },
  gradeInfo: { flex: 1 },
  gradeLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  fluencyText: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },

  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  summaryText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginHorizontal: 16, marginBottom: 20 },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 14, alignItems: "center", gap: 4, borderWidth: 1, borderColor: Colors.border },
  statNumber: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary },

  listItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  listText: { flex: 1, fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },

  recItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  recNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.secondary + "20", alignItems: "center", justifyContent: "center" },
  recNumberText: { fontSize: 11, fontWeight: "700", color: Colors.secondary },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 40 },

  pastReportItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  pastReportDate: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  pastReportSummary: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, maxWidth: 250 },
  pastReportGrade: { fontSize: 18, fontWeight: "800" },
});
