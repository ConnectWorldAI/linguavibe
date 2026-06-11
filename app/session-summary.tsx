import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getLastSessionSummary,
  getWeeklyStats,
  getSessionHistory,
  type SessionSummary,
} from "@/lib/session-summary";

export default function SessionSummaryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [s, w] = await Promise.all([
        getLastSessionSummary(),
        getWeeklyStats(),
      ]);
      setSummary(s);
      setWeeklyStats(w);
    } catch (e) {
      console.error("Failed to load session summary:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Session Summary", headerShown: true }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!summary) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Session Summary", headerShown: true }} />
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Sessions Yet</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Complete a study session to see your teacher's notes and next steps here.
          </Text>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/flashcard-srs")}
          >
            <Text style={styles.startButtonText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Session Summary", headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Session Header */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <Text style={{ fontSize: 32 }}>
              {summary.overallScore >= 85 ? "🌟" : summary.overallScore >= 65 ? "📈" : "💪"}
            </Text>
            <View style={styles.headerInfo}>
              <Text style={[styles.scoreText, { color: colors.foreground }]}>{summary.overallScore}% Overall</Text>
              <Text style={[styles.durationText, { color: colors.muted }]}>
                {summary.durationMinutes} min · {summary.accuracy}% accuracy · {summary.totalCorrect}/{summary.totalAttempts} correct
              </Text>
            </View>
          </View>
        </View>

        {/* Teacher's Note */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>🎓 Teacher's Note</Text>
          <Text style={[styles.teacherNote, { color: colors.foreground }]}>{summary.teacherNote}</Text>
        </View>

        {/* Strengths */}
        {summary.strengths.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>✅ What Went Well</Text>
            {summary.strengths.map((s, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: "#22C55E" }]}>●</Text>
                <Text style={[styles.bulletText, { color: colors.foreground }]}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Weaknesses */}
        {summary.weaknesses.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>🎯 Needs Attention</Text>
            {summary.weaknesses.map((w, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: "#F59E0B" }]}>●</Text>
                <Text style={[styles.bulletText, { color: colors.foreground }]}>{w}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Next Steps */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>📋 Next Steps</Text>
          {summary.nextSteps.map((step, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.stepCard, { borderColor: colors.border }]}
              onPress={() => step.screenRoute && router.push(step.screenRoute as any)}
            >
              <View style={styles.stepHeader}>
                <View style={[
                  styles.priorityIndicator,
                  { backgroundColor: step.priority === "high" ? "#EF4444" : step.priority === "medium" ? "#F59E0B" : "#3B82F6" }
                ]} />
                <Text style={[styles.stepAction, { color: colors.foreground }]}>{step.action}</Text>
              </View>
              <Text style={[styles.stepReason, { color: colors.muted }]}>{step.reason}</Text>
              <Text style={[styles.stepTime, { color: colors.primary }]}>~{step.estimatedMinutes} min</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tomorrow's Focus */}
        <View style={[styles.focusCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
          <Text style={[styles.focusTitle, { color: colors.primary }]}>📅 Tomorrow's Focus</Text>
          <Text style={[styles.focusText, { color: colors.foreground }]}>{summary.tomorrowFocus}</Text>
        </View>

        {/* Weekly Stats */}
        {weeklyStats && weeklyStats.sessionsThisWeek > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>📊 This Week</Text>
            <View style={styles.weekGrid}>
              <View style={styles.weekStat}>
                <Text style={[styles.weekNum, { color: colors.primary }]}>{weeklyStats.sessionsThisWeek}</Text>
                <Text style={[styles.weekLabel, { color: colors.muted }]}>Sessions</Text>
              </View>
              <View style={styles.weekStat}>
                <Text style={[styles.weekNum, { color: colors.primary }]}>{weeklyStats.totalMinutes}</Text>
                <Text style={[styles.weekLabel, { color: colors.muted }]}>Minutes</Text>
              </View>
              <View style={styles.weekStat}>
                <Text style={[styles.weekNum, { color: colors.primary }]}>{weeklyStats.averageScore}%</Text>
                <Text style={[styles.weekLabel, { color: colors.muted }]}>Avg Score</Text>
              </View>
            </View>
            <View style={styles.trendRow}>
              <Text style={[styles.trendText, { color: colors.muted }]}>
                Trend: {weeklyStats.improvementTrend === "improving" ? "📈 Improving" : weeklyStats.improvementTrend === "declining" ? "📉 Needs attention" : "➡️ Stable"}
              </Text>
              {weeklyStats.bestDay !== "None" && (
                <Text style={[styles.trendText, { color: colors.muted }]}>Best day: {weeklyStats.bestDay}</Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  startButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  startButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerInfo: { flex: 1 },
  scoreText: { fontSize: 22, fontWeight: "700" },
  durationText: { fontSize: 12, marginTop: 4 },
  teacherNote: { fontSize: 14, lineHeight: 22 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  bullet: { fontSize: 10, marginRight: 8, marginTop: 4 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 20 },
  stepCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  stepHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  priorityIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  stepAction: { fontSize: 14, fontWeight: "600", flex: 1 },
  stepReason: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  stepTime: { fontSize: 11, fontWeight: "600" },
  focusCard: { borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1 },
  focusTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  focusText: { fontSize: 14, lineHeight: 22 },
  weekGrid: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  weekStat: { alignItems: "center" },
  weekNum: { fontSize: 20, fontWeight: "700" },
  weekLabel: { fontSize: 11, marginTop: 2 },
  trendRow: { flexDirection: "row", justifyContent: "space-between" },
  trendText: { fontSize: 12 },
});
