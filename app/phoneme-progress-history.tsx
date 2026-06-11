import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type PhonemeHistoryEntry = { score: number; date: string };
type PhonemeData = {
  word: string;
  history: PhonemeHistoryEntry[];
  avgScore: number;
  bestScore: number;
  attempts: number;
  trend: "up" | "down" | "flat";
};

const LANGUAGES = ["Spanish", "French", "Japanese", "Korean", "German", "Italian", "Portuguese", "Mandarin"];

export default function PhonemeProgressHistoryScreen() {
  const colors = useColors();
  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");
  const [phonemeData, setPhonemeData] = useState<PhonemeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhonemeHistory(selectedLanguage);
  }, [selectedLanguage]);

  const loadPhonemeHistory = async (language: string) => {
    setLoading(true);
    try {
      const indexKey = `@phoneme_history_index:${language}`;
      const indexRaw = await AsyncStorage.getItem(indexKey);
      const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];

      const data: PhonemeData[] = [];
      for (const word of index) {
        const key = `@phoneme_history:${language}:${word}`;
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const history: PhonemeHistoryEntry[] = JSON.parse(raw);
          const scores = history.map((h) => h.score);
          const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          const bestScore = Math.max(...scores);
          // Calculate trend from last 3 vs previous 3
          const recent = scores.slice(-3);
          const older = scores.slice(-6, -3);
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
          const delta = recentAvg - olderAvg;
          const trend = delta > 5 ? "up" : delta < -5 ? "down" : "flat";

          data.push({ word, history, avgScore, bestScore, attempts: history.length, trend });
        }
      }

      // Sort by most recent activity
      data.sort((a, b) => {
        const aDate = a.history[a.history.length - 1]?.date || "";
        const bDate = b.history[b.history.length - 1]?.date || "";
        return bDate.localeCompare(aDate);
      });

      setPhonemeData(data);
    } catch {}
    setLoading(false);
  };

  const overallStats = useMemo(() => {
    if (phonemeData.length === 0) return { totalAttempts: 0, avgScore: 0, improving: 0, declining: 0 };
    const totalAttempts = phonemeData.reduce((sum, d) => sum + d.attempts, 0);
    const avgScore = Math.round(phonemeData.reduce((sum, d) => sum + d.avgScore, 0) / phonemeData.length);
    const improving = phonemeData.filter((d) => d.trend === "up").length;
    const declining = phonemeData.filter((d) => d.trend === "down").length;
    return { totalAttempts, avgScore, improving, declining };
  }, [phonemeData]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#4ADE80";
    if (score >= 75) return "#FBBF24";
    if (score >= 50) return "#FB923C";
    return "#F87171";
  };

  const getTrendIcon = (trend: "up" | "down" | "flat") => {
    if (trend === "up") return "trending-up";
    if (trend === "down") return "trending-down";
    return "remove";
  };

  const getTrendColor = (trend: "up" | "down" | "flat") => {
    if (trend === "up") return "#4ADE80";
    if (trend === "down") return "#F87171";
    return "#FBBF24";
  };

  const renderBarChart = (history: PhonemeHistoryEntry[]) => {
    const recent = history.slice(-8);
    const maxScore = 100;
    const chartHeight = 48;

    return (
      <View style={styles.chartContainer}>
        {recent.map((entry, idx) => {
          const height = (entry.score / maxScore) * chartHeight;
          const color = getScoreColor(entry.score);
          return (
            <View key={idx} style={styles.barCol}>
              <View style={[styles.barTrack, { height: chartHeight }]}>
                <View style={[styles.bar, { height, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Phoneme Progress</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Language Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll} contentContainerStyle={styles.langRow}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.langPill,
                {
                  backgroundColor: selectedLanguage === lang ? colors.primary : colors.surface,
                  borderColor: selectedLanguage === lang ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setSelectedLanguage(lang);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.langPillText, { color: selectedLanguage === lang ? "#FFF" : colors.foreground }]}>
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Overall Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statsTitle, { color: colors.foreground }]}>Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{overallStats.totalAttempts}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Attempts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: getScoreColor(overallStats.avgScore) }]}>{overallStats.avgScore}%</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Score</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#4ADE80" }]}>{overallStats.improving}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Improving</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#F87171" }]}>{overallStats.declining}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Declining</Text>
            </View>
          </View>
        </View>

        {/* Phoneme Cards */}
        {loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="hourglass" size={32} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>Loading history...</Text>
          </View>
        ) : phonemeData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No History Yet</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Practice phonemes in the pronunciation drill to see your progress here.
            </Text>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/pronunciation-drill")}
            >
              <Text style={styles.startBtnText}>Start Practicing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          phonemeData.map((item) => (
            <TouchableOpacity
              key={item.word}
              style={[styles.phonemeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/pronunciation-drill",
                  params: { examples: item.word, language: selectedLanguage },
                });
              }}
            >
              <View style={styles.phonemeCardHeader}>
                <View style={styles.phonemeCardLeft}>
                  <Text style={[styles.phonemeWord, { color: colors.foreground }]}>{item.word}</Text>
                  <Text style={[styles.phonemeAttempts, { color: colors.muted }]}>
                    {item.attempts} attempt{item.attempts !== 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={styles.phonemeCardRight}>
                  <View style={styles.trendBadge}>
                    <Ionicons name={getTrendIcon(item.trend) as any} size={14} color={getTrendColor(item.trend)} />
                    <Text style={[styles.trendText, { color: getTrendColor(item.trend) }]}>
                      {item.trend === "up" ? "Improving" : item.trend === "down" ? "Declining" : "Steady"}
                    </Text>
                  </View>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.scoreLabel, { color: colors.muted }]}>Avg</Text>
                    <Text style={[styles.scoreValue, { color: getScoreColor(item.avgScore) }]}>{item.avgScore}%</Text>
                  </View>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.scoreLabel, { color: colors.muted }]}>Best</Text>
                    <Text style={[styles.scoreValue, { color: getScoreColor(item.bestScore) }]}>{item.bestScore}%</Text>
                  </View>
                </View>
              </View>

              {/* Mini bar chart */}
              {renderBarChart(item.history)}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  langScroll: { marginBottom: 16 },
  langRow: { gap: 8, paddingRight: 16 },
  langPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  langPillText: { fontSize: 13, fontWeight: "600" },
  statsCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  statsTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  startBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  startBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  phonemeCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  phonemeCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  phonemeCardLeft: { flex: 1 },
  phonemeWord: { fontSize: 18, fontWeight: "700" },
  phonemeAttempts: { fontSize: 12, marginTop: 2 },
  phonemeCardRight: { alignItems: "flex-end", gap: 4 },
  trendBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  trendText: { fontSize: 11, fontWeight: "600" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreLabel: { fontSize: 11 },
  scoreValue: { fontSize: 14, fontWeight: "800" },
  chartContainer: { flexDirection: "row", gap: 3, alignItems: "flex-end", height: 48 },
  barCol: { flex: 1, alignItems: "center" },
  barTrack: { width: "100%", justifyContent: "flex-end", borderRadius: 3, overflow: "hidden" },
  bar: { width: "100%", borderRadius: 3, minHeight: 3 },
});
