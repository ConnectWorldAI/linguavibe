/**
 * Journal Analytics Screen
 *
 * Shows vocabulary growth over time, corrections trend, and score progression
 * based on the student's journal entries.
 */
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// ─── Types ──────────────────────────────────────────────────────────────────

interface JournalCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

interface JournalVocab {
  word: string;
  meaning: string;
  example: string;
}

interface JournalEntry {
  id: string;
  text: string;
  timestamp: number;
  language: string;
  corrections: JournalCorrection[];
  encouragement: string;
  newVocab: JournalVocab[];
  grammarTip: string;
  overallScore: number;
  streakMessage: string;
  isProcessing?: boolean;
}

interface AnalyticsData {
  totalEntries: number;
  totalWords: number;
  totalVocabLearned: number;
  totalCorrections: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  weeklyData: WeeklyPoint[];
  scoreProgression: ScorePoint[];
  correctionsTrend: CorrectionPoint[];
  vocabGrowth: VocabPoint[];
  topVocab: { word: string; meaning: string; count: number }[];
  commonMistakeCategories: { category: string; count: number }[];
}

interface WeeklyPoint {
  label: string;
  entries: number;
  words: number;
}

interface ScorePoint {
  date: string;
  score: number;
}

interface CorrectionPoint {
  date: string;
  corrections: number;
  wordCount: number;
  rate: number; // corrections per 100 words
}

interface VocabPoint {
  date: string;
  cumulative: number;
  newThisDay: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const JOURNAL_KEY = "@student_journal_entries";
const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_HEIGHT = 140;
const CHART_PADDING = 16;

// ─── Component ──────────────────────────────────────────────────────────────

export default function JournalAnalyticsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(JOURNAL_KEY);
      if (!raw) {
        setAnalytics(null);
        setLoading(false);
        return;
      }
      const allEntries: JournalEntry[] = JSON.parse(raw).filter(
        (e: JournalEntry) => !e.isProcessing
      );

      // Filter by time range
      const now = Date.now();
      const cutoff =
        timeRange === "week"
          ? now - 7 * 24 * 60 * 60 * 1000
          : timeRange === "month"
          ? now - 30 * 24 * 60 * 60 * 1000
          : 0;
      const entries = allEntries.filter((e) => e.timestamp >= cutoff);

      if (entries.length === 0) {
        setAnalytics(null);
        setLoading(false);
        return;
      }

      // Sort by timestamp ascending
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Basic stats
      const totalEntries = entries.length;
      const totalWords = entries.reduce((sum, e) => sum + e.text.split(/\s+/).length, 0);
      const totalVocabLearned = entries.reduce((sum, e) => sum + e.newVocab.length, 0);
      const totalCorrections = entries.reduce((sum, e) => sum + e.corrections.length, 0);
      const averageScore =
        entries.reduce((sum, e) => sum + e.overallScore, 0) / entries.length;

      // Streak calculation
      const entryDays = new Set(
        entries.map((e) => new Date(e.timestamp).toDateString())
      );
      const sortedDays = Array.from(entryDays).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );
      let currentStreak = 0;
      let longestStreak = 0;
      let streak = 0;
      const today = new Date().toDateString();
      const yesterday = new Date(now - 86400000).toDateString();

      for (let i = sortedDays.length - 1; i >= 0; i--) {
        const day = sortedDays[i];
        if (i === sortedDays.length - 1) {
          if (day === today || day === yesterday) {
            streak = 1;
          } else {
            break;
          }
        } else {
          const prev = new Date(sortedDays[i + 1]);
          const curr = new Date(day);
          const diff = (prev.getTime() - curr.getTime()) / 86400000;
          if (diff <= 1.5) {
            streak++;
          } else {
            break;
          }
        }
      }
      currentStreak = streak;

      // Longest streak
      let tempStreak = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diff = (curr.getTime() - prev.getTime()) / 86400000;
        if (diff <= 1.5) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      // Score progression
      const scoreProgression: ScorePoint[] = entries.map((e) => ({
        date: new Date(e.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: e.overallScore,
      }));

      // Corrections trend (corrections per 100 words)
      const correctionsTrend: CorrectionPoint[] = entries.map((e) => {
        const wordCount = e.text.split(/\s+/).length;
        return {
          date: new Date(e.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          corrections: e.corrections.length,
          wordCount,
          rate: wordCount > 0 ? (e.corrections.length / wordCount) * 100 : 0,
        };
      });

      // Vocab growth (cumulative)
      let cumVocab = 0;
      const vocabGrowth: VocabPoint[] = entries.map((e) => {
        cumVocab += e.newVocab.length;
        return {
          date: new Date(e.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          cumulative: cumVocab,
          newThisDay: e.newVocab.length,
        };
      });

      // Weekly data (last 7 days)
      const weeklyData: WeeklyPoint[] = [];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        const dayStr = d.toDateString();
        const dayEntries = entries.filter(
          (e) => new Date(e.timestamp).toDateString() === dayStr
        );
        weeklyData.push({
          label: dayNames[d.getDay()],
          entries: dayEntries.length,
          words: dayEntries.reduce((s, e) => s + e.text.split(/\s+/).length, 0),
        });
      }

      // Top vocab words (most frequently taught)
      const vocabMap = new Map<string, { meaning: string; count: number }>();
      for (const entry of entries) {
        for (const v of entry.newVocab) {
          const key = v.word.toLowerCase();
          const existing = vocabMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            vocabMap.set(key, { meaning: v.meaning, count: 1 });
          }
        }
      }
      const topVocab = Array.from(vocabMap.entries())
        .map(([word, data]) => ({ word, meaning: data.meaning, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Common mistake categories (from correction explanations)
      const categoryMap = new Map<string, number>();
      for (const entry of entries) {
        for (const c of entry.corrections) {
          // Simple categorization based on keywords in explanation
          const exp = c.explanation.toLowerCase();
          let cat = "Other";
          if (exp.includes("conjugat") || exp.includes("verb") || exp.includes("tense")) {
            cat = "Verb Conjugation";
          } else if (exp.includes("gender") || exp.includes("masculine") || exp.includes("feminine")) {
            cat = "Gender Agreement";
          } else if (exp.includes("accent") || exp.includes("tilde") || exp.includes("acento")) {
            cat = "Accents/Tildes";
          } else if (exp.includes("spelling") || exp.includes("orthograph")) {
            cat = "Spelling";
          } else if (exp.includes("article") || exp.includes("el/la") || exp.includes("un/una")) {
            cat = "Articles";
          } else if (exp.includes("preposition") || exp.includes("por/para")) {
            cat = "Prepositions";
          } else if (exp.includes("word order") || exp.includes("syntax")) {
            cat = "Word Order";
          } else if (exp.includes("vocabulary") || exp.includes("word choice")) {
            cat = "Word Choice";
          }
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        }
      }
      const commonMistakeCategories = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setAnalytics({
        totalEntries,
        totalWords,
        totalVocabLearned,
        totalCorrections,
        averageScore,
        currentStreak,
        longestStreak,
        weeklyData,
        scoreProgression,
        correctionsTrend,
        vocabGrowth,
        topVocab,
        commonMistakeCategories,
      });
    } catch {
      setAnalytics(null);
    }
    setLoading(false);
  }

  // ─── Mini Chart Renderer ────────────────────────────────────────────────────

  function MiniLineChart({
    data,
    color,
    label,
    valueKey,
  }: {
    data: any[];
    color: string;
    label: string;
    valueKey: string;
  }) {
    if (data.length < 2) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartLabel, { color: colors.muted }]}>{label}</Text>
          <Text style={[styles.noData, { color: colors.muted }]}>Need more entries for chart</Text>
        </View>
      );
    }

    const values = data.map((d) => d[valueKey] as number);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const chartWidth = SCREEN_WIDTH - 64;
    const pointSpacing = chartWidth / (data.length - 1);

    // Build SVG-like path using View positioning
    const points = values.map((v, i) => ({
      x: i * pointSpacing,
      y: CHART_HEIGHT - ((v - min) / range) * (CHART_HEIGHT - 20),
    }));

    // Trend indicator
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / (secondHalf.length || 1);
    const trending = secondAvg > firstAvg ? "up" : secondAvg < firstAvg ? "down" : "flat";
    const trendIcon = trending === "up" ? "trending-up" : trending === "down" ? "trending-down" : "remove";
    const trendColor = valueKey === "rate"
      ? (trending === "down" ? colors.success : trending === "up" ? colors.error : colors.muted)
      : (trending === "up" ? colors.success : trending === "down" ? colors.error : colors.muted);

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartLabel, { color: colors.foreground }]}>{label}</Text>
          <View style={styles.trendBadge}>
            <Ionicons name={trendIcon as any} size={14} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trending === "up" ? "Improving" : trending === "down" ? "Declining" : "Stable"}
            </Text>
          </View>
        </View>
        <View style={[styles.chartArea, { height: CHART_HEIGHT }]}>
          {/* Dots and connecting lines */}
          {points.map((point, i) => (
            <View key={i}>
              <View
                style={[
                  styles.chartDot,
                  {
                    left: point.x - 3,
                    top: point.y - 3,
                    backgroundColor: color,
                  },
                ]}
              />
              {i < points.length - 1 && (
                <View
                  style={[
                    styles.chartLine,
                    {
                      left: point.x,
                      top: Math.min(point.y, points[i + 1].y),
                      width: Math.sqrt(
                        Math.pow(pointSpacing, 2) +
                          Math.pow(points[i + 1].y - point.y, 2)
                      ),
                      backgroundColor: color,
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            points[i + 1].y - point.y,
                            pointSpacing
                          )}rad`,
                        },
                      ],
                      transformOrigin: "left center",
                    },
                  ]}
                />
              )}
            </View>
          ))}
          {/* X-axis labels (first, middle, last) */}
          <View style={styles.xAxisLabels}>
            <Text style={[styles.xLabel, { color: colors.muted }]}>
              {data[0].date || data[0].label}
            </Text>
            {data.length > 4 && (
              <Text style={[styles.xLabel, { color: colors.muted }]}>
                {data[Math.floor(data.length / 2)].date || data[Math.floor(data.length / 2)].label}
              </Text>
            )}
            <Text style={[styles.xLabel, { color: colors.muted }]}>
              {data[data.length - 1].date || data[data.length - 1].label}
            </Text>
          </View>
        </View>
        {/* Value summary */}
        <View style={styles.chartSummary}>
          <Text style={[styles.chartSummaryText, { color: colors.muted }]}>
            Latest: {values[values.length - 1].toFixed(1)} · Avg: {(values.reduce((s, v) => s + v, 0) / values.length).toFixed(1)}
          </Text>
        </View>
      </View>
    );
  }

  // ─── Bar Chart for Weekly Activity ──────────────────────────────────────────

  function WeeklyBarChart() {
    if (!analytics) return null;
    const { weeklyData } = analytics;
    const maxEntries = Math.max(...weeklyData.map((d) => d.entries), 1);

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartLabel, { color: colors.foreground }]}>This Week</Text>
        <View style={styles.barChartArea}>
          {weeklyData.map((day, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(day.entries / maxEntries) * 100}%`,
                      backgroundColor: day.entries > 0 ? colors.primary : colors.border,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, { color: colors.muted }]}>{day.label}</Text>
              {day.entries > 0 && (
                <Text style={[styles.barValue, { color: colors.foreground }]}>
                  {day.entries}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!analytics) {
    return (
      <ScreenContainer className="p-6">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Journal Analytics</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Data Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Write a few journal entries and come back to see your progress!
          </Text>
          <Pressable
            onPress={() => router.push("/student-journal" as any)}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[styles.ctaText, { color: "#fff" }]}>Start Writing</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Journal Analytics</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeRow}>
          {(["week", "month", "all"] as const).map((range) => (
            <Pressable
              key={range}
              onPress={() => setTimeRange(range)}
              style={({ pressed }) => [
                styles.timeRangeBtn,
                {
                  backgroundColor: timeRange === range ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  { color: timeRange === range ? "#fff" : colors.foreground },
                ]}
              >
                {range === "week" ? "7 Days" : range === "month" ? "30 Days" : "All Time"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {analytics.totalEntries}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Entries</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="text" size={20} color={colors.success} />
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {analytics.totalWords.toLocaleString()}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Words Written</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="book" size={20} color={colors.warning} />
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {analytics.totalVocabLearned}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Vocab Learned</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {analytics.averageScore.toFixed(1)}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Avg Score</Text>
          </View>
        </View>

        {/* Streak Info */}
        <View style={[styles.streakCard, { backgroundColor: colors.surface }]}>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Ionicons name="flame" size={24} color="#FF6B35" />
              <Text style={[styles.streakValue, { color: colors.foreground }]}>
                {analytics.currentStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: colors.muted }]}>Current Streak</Text>
            </View>
            <View style={[styles.streakDivider, { backgroundColor: colors.border }]} />
            <View style={styles.streakItem}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={[styles.streakValue, { color: colors.foreground }]}>
                {analytics.longestStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: colors.muted }]}>Longest Streak</Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity */}
        <WeeklyBarChart />

        {/* Score Progression Chart */}
        <MiniLineChart
          data={analytics.scoreProgression}
          color={colors.primary}
          label="Score Progression"
          valueKey="score"
        />

        {/* Corrections Trend Chart */}
        <MiniLineChart
          data={analytics.correctionsTrend}
          color={colors.error}
          label="Corrections per 100 Words"
          valueKey="rate"
        />

        {/* Vocabulary Growth Chart */}
        <MiniLineChart
          data={analytics.vocabGrowth}
          color={colors.success}
          label="Vocabulary Growth (Cumulative)"
          valueKey="cumulative"
        />

        {/* Common Mistake Categories */}
        {analytics.commonMistakeCategories.length > 0 && (
          <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.chartLabel, { color: colors.foreground }]}>
              Common Mistake Areas
            </Text>
            {analytics.commonMistakeCategories.map((cat, i) => {
              const maxCount = analytics.commonMistakeCategories[0].count;
              const pct = (cat.count / maxCount) * 100;
              return (
                <View key={i} style={styles.mistakeRow}>
                  <Text style={[styles.mistakeCategory, { color: colors.foreground }]}>
                    {cat.category}
                  </Text>
                  <View style={styles.mistakeBarWrapper}>
                    <View
                      style={[
                        styles.mistakeBar,
                        { width: `${pct}%`, backgroundColor: colors.error + "60" },
                      ]}
                    />
                  </View>
                  <Text style={[styles.mistakeCount, { color: colors.muted }]}>{cat.count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Top Vocabulary */}
        {analytics.topVocab.length > 0 && (
          <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.chartLabel, { color: colors.foreground }]}>
              Top Vocabulary Learned
            </Text>
            {analytics.topVocab.slice(0, 8).map((v, i) => (
              <View key={i} style={[styles.vocabRow, i > 0 && { borderTopColor: colors.border, borderTopWidth: 0.5 }]}>
                <View style={styles.vocabLeft}>
                  <Text style={[styles.vocabWord, { color: colors.foreground }]}>{v.word}</Text>
                  <Text style={[styles.vocabMeaning, { color: colors.muted }]}>{v.meaning}</Text>
                </View>
                <View style={[styles.vocabBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.vocabCount, { color: colors.primary }]}>x{v.count}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  timeRangeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  timeRangeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  streakCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  streakItem: {
    alignItems: "center",
    gap: 4,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  streakLabel: {
    fontSize: 12,
  },
  streakDivider: {
    width: 1,
    height: 50,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
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
  chartArea: {
    position: "relative",
    overflow: "hidden",
  },
  chartDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chartLine: {
    position: "absolute",
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  xAxisLabels: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  xLabel: {
    fontSize: 10,
  },
  chartSummary: {
    marginTop: 8,
  },
  chartSummaryText: {
    fontSize: 11,
  },
  noData: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 20,
  },
  barChartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    gap: 4,
    paddingTop: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    width: "100%",
    height: 70,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "60%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: "600",
  },
  mistakeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  mistakeCategory: {
    fontSize: 12,
    width: 100,
  },
  mistakeBarWrapper: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  mistakeBar: {
    height: "100%",
    borderRadius: 4,
  },
  mistakeCount: {
    fontSize: 11,
    width: 24,
    textAlign: "right",
  },
  vocabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  vocabLeft: {
    flex: 1,
  },
  vocabWord: {
    fontSize: 14,
    fontWeight: "600",
  },
  vocabMeaning: {
    fontSize: 12,
    marginTop: 2,
  },
  vocabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  vocabCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 260,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
