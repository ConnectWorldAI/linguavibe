/**
 * Call History Timeline
 * Scrollable timeline of all past Coach Mode scorecards.
 * Shows score progression, filters by type/difficulty, and links to full scorecard detail.
 */
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

const Colors = {
  bg: "#0A0E1A",
  card: "#141B2D",
  cardBorder: "#1E293B",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  primary: "#00AAFF",
  warning: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
  purple: "#8B5CF6",
  orange: "#F97316",
  gold: "#FFD700",
  pink: "#EC4899",
  teal: "#14B8A6",
};

type CallType = "scheduled" | "surprise" | "graded" | "scenario";
type Difficulty = "easy" | "medium" | "hard" | "surprise";

interface HistoryEntry {
  id: string;
  date: string;
  scenario: string;
  speaker: string;
  accent: string;
  type: CallType;
  difficulty: Difficulty;
  overallScore: number;
  grade: string;
  xpEarned: number;
  paceCredit: string;
  duration: string;
  categories: {
    pronunciation: number;
    comprehension: number;
    fluency: number;
    vocabulary: number;
    recovery: number;
  };
}

// Sample history data (in production, loaded from AsyncStorage)
const CALL_HISTORY: HistoryEntry[] = [
  {
    id: "h1",
    date: "2026-05-23",
    scenario: "Meeting Host Family",
    speaker: "Familia Rodriguez",
    accent: "Colombian",
    type: "scheduled",
    difficulty: "medium",
    overallScore: 79,
    grade: "C+",
    xpEarned: 179,
    paceCredit: "1.5x",
    duration: "14:32",
    categories: { pronunciation: 72, comprehension: 85, fluency: 74, vocabulary: 80, recovery: 78 },
  },
  {
    id: "h2",
    date: "2026-05-22",
    scenario: "Ordering at a Restaurant",
    speaker: "Ana",
    accent: "Spanish (Castilian)",
    type: "scenario",
    difficulty: "easy",
    overallScore: 85,
    grade: "B+",
    xpEarned: 128,
    paceCredit: "1x",
    duration: "9:15",
    categories: { pronunciation: 80, comprehension: 92, fluency: 82, vocabulary: 85, recovery: 88 },
  },
  {
    id: "h3",
    date: "2026-05-21",
    scenario: "Emergency Situation",
    speaker: "Unknown Caller",
    accent: "Various",
    type: "surprise",
    difficulty: "surprise",
    overallScore: 62,
    grade: "D",
    xpEarned: 186,
    paceCredit: "2x",
    duration: "6:48",
    categories: { pronunciation: 65, comprehension: 58, fluency: 55, vocabulary: 68, recovery: 70 },
  },
  {
    id: "h4",
    date: "2026-05-20",
    scenario: "Lost in the City",
    speaker: "Carlos",
    accent: "Mexican",
    type: "scenario",
    difficulty: "easy",
    overallScore: 88,
    grade: "B+",
    xpEarned: 132,
    paceCredit: "1x",
    duration: "7:22",
    categories: { pronunciation: 84, comprehension: 92, fluency: 86, vocabulary: 88, recovery: 90 },
  },
  {
    id: "h5",
    date: "2026-05-19",
    scenario: "Teacher's Friend Just Landed",
    speaker: "Valentina",
    accent: "Colombian",
    type: "scheduled",
    difficulty: "medium",
    overallScore: 74,
    grade: "C",
    xpEarned: 167,
    paceCredit: "1.5x",
    duration: "12:05",
    categories: { pronunciation: 70, comprehension: 80, fluency: 68, vocabulary: 72, recovery: 76 },
  },
  {
    id: "h6",
    date: "2026-05-18",
    scenario: "At the Doctor's Office",
    speaker: "Dra. Gomez",
    accent: "Peruvian",
    type: "scenario",
    difficulty: "medium",
    overallScore: 71,
    grade: "C",
    xpEarned: 160,
    paceCredit: "1.5x",
    duration: "11:40",
    categories: { pronunciation: 68, comprehension: 78, fluency: 65, vocabulary: 70, recovery: 72 },
  },
  {
    id: "h7",
    date: "2026-05-17",
    scenario: "Phone Call from Landlord",
    speaker: "Don Pedro",
    accent: "Dominican",
    type: "surprise",
    difficulty: "hard",
    overallScore: 58,
    grade: "D",
    xpEarned: 174,
    paceCredit: "2x",
    duration: "10:18",
    categories: { pronunciation: 60, comprehension: 52, fluency: 50, vocabulary: 62, recovery: 68 },
  },
  {
    id: "h8",
    date: "2026-05-16",
    scenario: "Ordering at a Restaurant",
    speaker: "Ana",
    accent: "Spanish (Castilian)",
    type: "scenario",
    difficulty: "easy",
    overallScore: 82,
    grade: "B",
    xpEarned: 123,
    paceCredit: "1x",
    duration: "8:50",
    categories: { pronunciation: 78, comprehension: 88, fluency: 80, vocabulary: 82, recovery: 84 },
  },
  {
    id: "h9",
    date: "2026-05-15",
    scenario: "Lost in the City",
    speaker: "Carlos",
    accent: "Mexican",
    type: "scenario",
    difficulty: "easy",
    overallScore: 76,
    grade: "C+",
    xpEarned: 114,
    paceCredit: "1x",
    duration: "6:30",
    categories: { pronunciation: 72, comprehension: 82, fluency: 74, vocabulary: 76, recovery: 78 },
  },
  {
    id: "h10",
    date: "2026-05-14",
    scenario: "Meeting Host Family",
    speaker: "Familia Rodriguez",
    accent: "Colombian",
    type: "scheduled",
    difficulty: "medium",
    overallScore: 68,
    grade: "D",
    xpEarned: 153,
    paceCredit: "1.5x",
    duration: "13:10",
    categories: { pronunciation: 64, comprehension: 74, fluency: 62, vocabulary: 68, recovery: 70 },
  },
  {
    id: "h11",
    date: "2026-05-13",
    scenario: "Emergency Situation",
    speaker: "Unknown Caller",
    accent: "Various",
    type: "surprise",
    difficulty: "surprise",
    overallScore: 55,
    grade: "F",
    xpEarned: 165,
    paceCredit: "2x",
    duration: "5:45",
    categories: { pronunciation: 58, comprehension: 50, fluency: 48, vocabulary: 55, recovery: 62 },
  },
  {
    id: "h12",
    date: "2026-05-12",
    scenario: "Ordering at a Restaurant",
    speaker: "Ana",
    accent: "Spanish (Castilian)",
    type: "scenario",
    difficulty: "easy",
    overallScore: 72,
    grade: "C",
    xpEarned: 108,
    paceCredit: "1x",
    duration: "9:00",
    categories: { pronunciation: 68, comprehension: 78, fluency: 70, vocabulary: 72, recovery: 74 },
  },
];

type FilterType = "all" | "scheduled" | "surprise" | "graded" | "scenario";

function getScoreColor(score: number): string {
  if (score >= 90) return Colors.success;
  if (score >= 75) return Colors.primary;
  if (score >= 60) return Colors.warning;
  return Colors.error;
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return Colors.success;
  if (grade.startsWith("B")) return Colors.primary;
  if (grade.startsWith("C")) return Colors.warning;
  return Colors.error;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function typeIcon(type: CallType): string {
  switch (type) {
    case "scheduled": return "calendar";
    case "surprise": return "flash";
    case "graded": return "ribbon";
    case "scenario": return "map";
  }
}

function typeColor(type: CallType): string {
  switch (type) {
    case "scheduled": return Colors.primary;
    case "surprise": return Colors.error;
    case "graded": return Colors.purple;
    case "scenario": return Colors.teal;
  }
}

export default function CallHistoryScreen() {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredHistory = useMemo(() => {
    if (filter === "all") return CALL_HISTORY;
    return CALL_HISTORY.filter((h) => h.type === filter);
  }, [filter]);

  // Stats
  const stats = useMemo(() => {
    const scores = CALL_HISTORY.map((h) => h.overallScore);
    const totalXP = CALL_HISTORY.reduce((sum, h) => sum + h.xpEarned, 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const best = Math.max(...scores);
    const worst = Math.min(...scores);
    // Calculate streak (consecutive days with calls)
    let streak = 0;
    const today = new Date("2026-05-23");
    for (let i = 0; i < CALL_HISTORY.length; i++) {
      const callDate = new Date(CALL_HISTORY[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      if (callDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    return { total: CALL_HISTORY.length, avg, best, worst, totalXP, streak };
  }, []);

  // Score trend (last 5 scores, oldest to newest)
  const scoreTrend = useMemo(() => {
    return [...CALL_HISTORY].reverse().slice(-8).map((h) => h.overallScore);
  }, []);

  const handleViewScorecard = (entry: HistoryEntry) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/call-scorecard",
      params: { callId: entry.id, scenario: entry.scenario },
    });
  };

  const renderProgressChart = () => {
    const maxScore = 100;
    const chartHeight = 80;
    const barWidth = 28;

    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Score Progression</Text>
          <Text style={styles.chartSub}>Last {scoreTrend.length} calls</Text>
        </View>
        <View style={styles.chartContainer}>
          {scoreTrend.map((score, idx) => {
            const height = (score / maxScore) * chartHeight;
            const color = getScoreColor(score);
            return (
              <View key={idx} style={styles.barCol}>
                <Text style={[styles.barLabel, { color }]}>{score}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height, backgroundColor: color, opacity: 0.8 + (idx / scoreTrend.length) * 0.2 },
                    ]}
                  />
                </View>
                <Text style={styles.barIndex}>#{idx + 1}</Text>
              </View>
            );
          })}
        </View>
        {/* Trend indicator */}
        {scoreTrend.length >= 3 && (
          <View style={styles.trendRow}>
            {(() => {
              const recent = scoreTrend.slice(-3);
              const older = scoreTrend.slice(-6, -3);
              const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
              const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
              const delta = Math.round(recentAvg - olderAvg);
              const trending = delta > 3 ? "up" : delta < -3 ? "down" : "flat";
              const trendColor = trending === "up" ? Colors.success : trending === "down" ? Colors.error : Colors.warning;
              const trendIcon = trending === "up" ? "trending-up" : trending === "down" ? "trending-down" : "remove";
              return (
                <>
                  <Ionicons name={trendIcon as any} size={16} color={trendColor} />
                  <Text style={[styles.trendText, { color: trendColor }]}>
                    {trending === "up" ? `+${delta} pts improving` : trending === "down" ? `${delta} pts declining` : "Holding steady"}
                  </Text>
                </>
              );
            })()}
          </View>
        )}
      </View>
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Calls</Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={[styles.statValue, { color: getScoreColor(stats.avg) }]}>{stats.avg}</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{stats.best}</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={[styles.statValue, { color: Colors.gold }]}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>
      <View style={styles.xpRow}>
        <Ionicons name="flash" size={14} color={Colors.gold} />
        <Text style={styles.xpText}>{stats.totalXP.toLocaleString()} total XP earned from calls</Text>
      </View>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: HistoryEntry }) => {
    const scoreColor = getScoreColor(item.overallScore);
    const gradeColor = getGradeColor(item.grade);

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => handleViewScorecard(item)}
        activeOpacity={0.7}
      >
        {/* Timeline dot */}
        <View style={styles.timelineCol}>
          <View style={[styles.timelineDot, { backgroundColor: typeColor(item.type) }]}>
            <Ionicons name={typeIcon(item.type) as any} size={12} color="#FFF" />
          </View>
          <View style={styles.timelineLine} />
        </View>

        {/* Content */}
        <View style={styles.historyContent}>
          {/* Header row */}
          <View style={styles.historyHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyScenario}>{item.scenario}</Text>
              <Text style={styles.historySpeaker}>
                {item.speaker} • {item.accent}
              </Text>
            </View>
            {/* Grade badge */}
            <View style={[styles.gradeBadge, { backgroundColor: gradeColor + "20", borderColor: gradeColor + "40" }]}>
              <Text style={[styles.gradeText, { color: gradeColor }]}>{item.grade}</Text>
            </View>
          </View>

          {/* Score bar */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreBarTrack}>
              <View style={[styles.scoreBarFill, { width: `${item.overallScore}%`, backgroundColor: scoreColor }]} />
            </View>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>{item.overallScore}</Text>
          </View>

          {/* Category mini scores */}
          <View style={styles.miniScores}>
            <View style={styles.miniScoreItem}>
              <Ionicons name="mic" size={10} color={Colors.orange} />
              <Text style={styles.miniScoreText}>{item.categories.pronunciation}</Text>
            </View>
            <View style={styles.miniScoreItem}>
              <Ionicons name="ear" size={10} color={Colors.primary} />
              <Text style={styles.miniScoreText}>{item.categories.comprehension}</Text>
            </View>
            <View style={styles.miniScoreItem}>
              <Ionicons name="speedometer" size={10} color={Colors.teal} />
              <Text style={styles.miniScoreText}>{item.categories.fluency}</Text>
            </View>
            <View style={styles.miniScoreItem}>
              <Ionicons name="book" size={10} color={Colors.purple} />
              <Text style={styles.miniScoreText}>{item.categories.vocabulary}</Text>
            </View>
            <View style={styles.miniScoreItem}>
              <Ionicons name="shield-checkmark" size={10} color={Colors.success} />
              <Text style={styles.miniScoreText}>{item.categories.recovery}</Text>
            </View>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <Text style={styles.metaDate}>{formatDate(item.date)}</Text>
            <View style={styles.metaDivider} />
            <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.duration}</Text>
            <View style={styles.metaDivider} />
            <Ionicons name="flash" size={11} color={Colors.gold} />
            <Text style={styles.metaText}>+{item.xpEarned} XP</Text>
            {item.paceCredit !== "1x" && (
              <>
                <View style={styles.metaDivider} />
                <Text style={[styles.metaText, { color: Colors.gold }]}>{item.paceCredit} pace</Text>
              </>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ alignSelf: "center" }} />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Call History</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {(["all", "scenario", "scheduled", "graded", "surprise"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {renderStatsCard()}
              {renderProgressChart()}
              <Text style={styles.sectionTitle}>
                {filter === "all" ? "All Calls" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Calls`}
                {" "}({filteredHistory.length})
              </Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="call-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No calls yet</Text>
              <Text style={styles.emptyText}>Complete Coach Mode calls to see your history here</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },

  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: { backgroundColor: Colors.primary + "20", borderColor: Colors.primary },
  filterText: { fontSize: 11, fontWeight: "600", color: Colors.textMuted },
  filterTextActive: { color: Colors.primary },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Stats
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { alignItems: "center", flex: 1 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: Colors.cardBorder },
  statValue: { fontSize: 22, fontWeight: "800", color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  xpText: { fontSize: 12, color: Colors.textSecondary },

  // Chart
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  chartTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  chartSub: { fontSize: 11, color: Colors.textMuted },
  chartContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 110 },
  barCol: { alignItems: "center", flex: 1 },
  barLabel: { fontSize: 10, fontWeight: "700", marginBottom: 4 },
  barTrack: { width: 20, height: 80, backgroundColor: Colors.cardBorder + "50", borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  bar: { width: "100%", borderRadius: 4 },
  barIndex: { fontSize: 9, color: Colors.textMuted, marginTop: 4 },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  trendText: { fontSize: 12, fontWeight: "600" },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 12, marginTop: 4 },

  // History Item
  historyCard: {
    flexDirection: "row",
    marginBottom: 2,
    paddingVertical: 12,
  },
  timelineCol: { width: 36, alignItems: "center" },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.cardBorder,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  historyScenario: { fontSize: 14, fontWeight: "700", color: Colors.text },
  historySpeaker: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeText: { fontSize: 13, fontWeight: "800" },

  // Score bar
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  scoreBarTrack: { flex: 1, height: 6, backgroundColor: Colors.cardBorder, borderRadius: 3, overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 3 },
  scoreValue: { fontSize: 14, fontWeight: "800", width: 28, textAlign: "right" },

  // Mini scores
  miniScores: { flexDirection: "row", gap: 10, marginBottom: 8 },
  miniScoreItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  miniScoreText: { fontSize: 10, color: Colors.textSecondary, fontWeight: "600" },

  // Meta
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaDate: { fontSize: 10, color: Colors.textMuted },
  metaDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted, marginHorizontal: 4 },
  metaText: { fontSize: 10, color: Colors.textMuted },

  // Empty state
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.textMuted },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: "center" },
});
