import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { ScreenContainer } from "@/components/screen-container";
import {
  getSubmissions,
  deleteSubmission,
  type RecordingSubmission,
} from "@/lib/wavy-eq-submissions";

// ─── Progress Chart Component ─────────────────────────────────────────────────
function ProgressChart({ submissions }: { submissions: RecordingSubmission[] }) {
  const scored = submissions
    .filter((s) => s.score !== undefined)
    .slice(0, 20)
    .reverse(); // oldest first for chart

  if (scored.length < 2) {
    return (
      <View style={styles.chartEmpty}>
        <Ionicons name="analytics-outline" size={32} color={Colors.textMuted} />
        <Text style={styles.chartEmptyText}>
          Complete at least 2 recordings with scores to see your progress chart
        </Text>
      </View>
    );
  }

  const scores = scored.map((s) => s.score || 0);
  const maxScore = 100;
  const chartHeight = 120;
  const barWidth = Math.min(28, (280 - scored.length * 2) / scored.length);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Score Progress</Text>
      <View style={styles.chartArea}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>100</Text>
          <Text style={styles.yLabel}>75</Text>
          <Text style={styles.yLabel}>50</Text>
          <Text style={styles.yLabel}>25</Text>
        </View>
        {/* Bars */}
        <View style={styles.barsContainer}>
          {scores.map((score, i) => {
            const height = (score / maxScore) * chartHeight;
            const color =
              score >= 85
                ? Colors.success
                : score >= 70
                ? Colors.gold
                : Colors.accent;
            return (
              <View key={i} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      width: barWidth,
                      backgroundColor: color,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{score}</Text>
              </View>
            );
          })}
        </View>
      </View>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}
          </Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.success }]}>
            {Math.max(...scores)}
          </Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.gold }]}>
            {scores.length}
          </Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  scores[scores.length - 1] > scores[0]
                    ? Colors.success
                    : Colors.accent,
              },
            ]}
          >
            {scores[scores.length - 1] > scores[0] ? "↑" : "↓"}
            {Math.abs(scores[scores.length - 1] - scores[0])}
          </Text>
          <Text style={styles.statLabel}>Trend</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SubmissionsHistoryScreen() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<RecordingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    const data = await getSubmissions();
    setSubmissions(data);
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleDelete = async (id: string) => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteSubmission(id);
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  };

  const getScoreColor = (score?: number) => {
    if (!score) return Colors.textMuted;
    if (score >= 85) return Colors.success;
    if (score >= 70) return Colors.gold;
    return Colors.accent;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "full":
        return "mic";
      case "punch-in":
        return "musical-notes";
      case "word-by-word":
        return "text";
      default:
        return "mic";
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const renderItem = ({ item }: { item: RecordingSubmission }) => (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.modeIcon,
            { backgroundColor: getScoreColor(item.score) + "20" },
          ]}
        >
          <Ionicons
            name={getModeIcon(item.mode) as any}
            size={20}
            color={getScoreColor(item.score)}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.assignmentTitle}
          </Text>
          <Text style={styles.cardMeta}>
            {item.mode.charAt(0).toUpperCase() + item.mode.slice(1)} •{" "}
            {formatDuration(item.duration)} • {formatDate(item.completedAt)}
          </Text>
        </View>
        {item.score !== undefined && (
          <View
            style={[
              styles.scoreBadge,
              { backgroundColor: getScoreColor(item.score) + "20" },
            ]}
          >
            <Text
              style={[styles.scoreText, { color: getScoreColor(item.score) }]}
            >
              {item.score}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.sectionsText}>
          {item.sectionsRecorded}/{item.totalSections} sections recorded
        </Text>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="disc-outline" size={56} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No Recordings Yet</Text>
      <Text style={styles.emptySubtitle}>
        Complete a recording session in WavyEq Studios to see your history here
      </Text>
      <TouchableOpacity
        style={styles.goToStudioBtn}
        onPress={() => router.push("/studio-hub")}
        activeOpacity={0.8}
      >
        <Ionicons name="mic" size={18} color="#fff" />
        <Text style={styles.goToStudioText}>Go to Studios</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recording History</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={submissions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          submissions.length > 0 ? (
            <ProgressChart submissions={submissions} />
          ) : null
        }
        ListEmptyComponent={loading ? null : renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },

  // Chart
  chartContainer: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  chartArea: {
    flexDirection: "row",
    height: 140,
    alignItems: "flex-end",
  },
  yAxis: {
    justifyContent: "space-between",
    height: 120,
    marginRight: 8,
  },
  yLabel: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    height: 120,
  },
  barWrapper: {
    alignItems: "center",
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.secondary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chartEmpty: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartEmptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 18,
  },

  // Cards
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  cardMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  scoreText: {
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  sectionsText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  deleteBtn: {
    padding: 6,
  },

  // Empty
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  goToStudioBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    gap: 8,
  },
  goToStudioText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: "#fff",
  },
});
