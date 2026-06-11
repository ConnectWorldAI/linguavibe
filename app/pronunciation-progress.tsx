/**
 * Pronunciation Progress Timeline
 * 
 * Features:
 * - Score tracking over time per phoneme/sound
 * - Visual graph showing improvement trajectory
 * - Integration with Time Capsule recordings for before/after comparison
 * - Per-language and per-sound breakdown
 * - Weekly/monthly trend analysis
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PronunciationSession {
  id: string;
  date: number;
  language: string;
  phrase: string;
  overallScore: number;
  phonemeScores: { phoneme: string; score: number }[];
  problemSounds: string[];
  feedback: string;
}

interface PhonemeProgress {
  phoneme: string;
  scores: { date: number; score: number }[];
  currentAvg: number;
  trend: "improving" | "declining" | "stable";
  bestScore: number;
  sessionsCount: number;
}

interface TimeCapsuleEntry {
  id: string;
  recordedAt: number;
  day: number; // Day 1, 30, 90, 365
  language: string;
  phrase: string;
  score: number | null;
  audioUri: string | null;
}

type TimeRange = "week" | "month" | "all";

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "@pronunciation_progress";
const TIME_CAPSULE_KEY = "@time_capsule_entries";
const SCREEN_WIDTH = Dimensions.get("window").width;
const GRAPH_WIDTH = SCREEN_WIDTH - 64;
const GRAPH_HEIGHT = 160;

// ─── Sample Data (populated from real sessions) ──────────────────────────────

const SAMPLE_SESSIONS: PronunciationSession[] = [
  { id: "s1", date: Date.now() - 86400000 * 30, language: "French", phrase: "Bonjour", overallScore: 52, phonemeScores: [{ phoneme: "ʒ", score: 45 }, { phoneme: "ɔ̃", score: 38 }, { phoneme: "u", score: 72 }], problemSounds: ["ʒ", "ɔ̃"], feedback: "Work on nasal vowels" },
  { id: "s2", date: Date.now() - 86400000 * 25, language: "French", phrase: "Comment allez-vous", overallScore: 58, phonemeScores: [{ phoneme: "ɔ̃", score: 45 }, { phoneme: "a", score: 80 }, { phoneme: "u", score: 75 }], problemSounds: ["ɔ̃"], feedback: "Nasal vowels improving" },
  { id: "s3", date: Date.now() - 86400000 * 20, language: "French", phrase: "Je voudrais", overallScore: 63, phonemeScores: [{ phoneme: "ʒ", score: 55 }, { phoneme: "ɛ", score: 70 }, { phoneme: "u", score: 78 }], problemSounds: ["ʒ"], feedback: "Good progress on 'je'" },
  { id: "s4", date: Date.now() - 86400000 * 15, language: "French", phrase: "Merci beaucoup", overallScore: 71, phonemeScores: [{ phoneme: "ʁ", score: 60 }, { phoneme: "o", score: 82 }, { phoneme: "u", score: 85 }], problemSounds: ["ʁ"], feedback: "French R needs work" },
  { id: "s5", date: Date.now() - 86400000 * 10, language: "French", phrase: "S'il vous plaît", overallScore: 75, phonemeScores: [{ phoneme: "ʒ", score: 68 }, { phoneme: "ɔ̃", score: 62 }, { phoneme: "ɛ", score: 78 }], problemSounds: [], feedback: "Great improvement!" },
  { id: "s6", date: Date.now() - 86400000 * 5, language: "French", phrase: "Excusez-moi", overallScore: 79, phonemeScores: [{ phoneme: "ʁ", score: 72 }, { phoneme: "y", score: 65 }, { phoneme: "ɛ", score: 82 }], problemSounds: ["y"], feedback: "Focus on 'u' vs 'ou'" },
  { id: "s7", date: Date.now() - 86400000 * 2, language: "French", phrase: "Je suis ravi", overallScore: 83, phonemeScores: [{ phoneme: "ʒ", score: 78 }, { phoneme: "ʁ", score: 76 }, { phoneme: "a", score: 90 }], problemSounds: [], feedback: "Excellent progress!" },
  { id: "s8", date: Date.now() - 86400000 * 1, language: "French", phrase: "Enchanté", overallScore: 86, phonemeScores: [{ phoneme: "ɔ̃", score: 75 }, { phoneme: "ʃ", score: 88 }, { phoneme: "e", score: 92 }], problemSounds: [], feedback: "Near native on this phrase!" },
];

const SAMPLE_TIME_CAPSULES: TimeCapsuleEntry[] = [
  { id: "tc1", recordedAt: Date.now() - 86400000 * 30, day: 1, language: "French", phrase: "Bonjour, comment allez-vous?", score: 52, audioUri: null },
  { id: "tc2", recordedAt: Date.now() - 86400000 * 1, day: 30, language: "French", phrase: "Bonjour, comment allez-vous?", score: 83, audioUri: null },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PronunciationProgressScreen() {
  const colors = useColors();
  const router = useRouter();
  const [sessions, setSessions] = useState<PronunciationSession[]>(SAMPLE_SESSIONS);
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsuleEntry[]>(SAMPLE_TIME_CAPSULES);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeProgress | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) setSessions(parsed);
      }
      const capsules = await AsyncStorage.getItem(TIME_CAPSULE_KEY);
      if (capsules) {
        const parsed = JSON.parse(capsules);
        if (parsed.length > 0) setTimeCapsules(parsed);
      }
    } catch {}
  };

  // Filter sessions by time range
  const filteredSessions = sessions.filter((s) => {
    const now = Date.now();
    if (timeRange === "week") return s.date > now - 7 * 86400000;
    if (timeRange === "month") return s.date > now - 30 * 86400000;
    return true;
  });

  // Calculate overall stats
  const overallAvg = filteredSessions.length > 0
    ? Math.round(filteredSessions.reduce((sum, s) => sum + s.overallScore, 0) / filteredSessions.length)
    : 0;

  const latestScore = filteredSessions.length > 0
    ? filteredSessions[filteredSessions.length - 1].overallScore
    : 0;

  const firstScore = filteredSessions.length > 0
    ? filteredSessions[0].overallScore
    : 0;

  const improvement = latestScore - firstScore;

  // Build phoneme progress data
  const phonemeProgress: PhonemeProgress[] = (() => {
    const map: Record<string, { scores: { date: number; score: number }[] }> = {};
    for (const session of filteredSessions) {
      for (const ps of session.phonemeScores) {
        if (!map[ps.phoneme]) map[ps.phoneme] = { scores: [] };
        map[ps.phoneme].scores.push({ date: session.date, score: ps.score });
      }
    }
    return Object.entries(map).map(([phoneme, data]) => {
      const scores = data.scores.sort((a, b) => a.date - b.date);
      const avg = Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length);
      const first = scores[0]?.score || 0;
      const last = scores[scores.length - 1]?.score || 0;
      const trend = last - first > 5 ? "improving" : last - first < -5 ? "declining" : "stable";
      return {
        phoneme,
        scores,
        currentAvg: avg,
        trend,
        bestScore: Math.max(...scores.map((s) => s.score)),
        sessionsCount: scores.length,
      };
    }).sort((a, b) => b.sessionsCount - a.sessionsCount);
  })();

  // Render mini graph (SVG-free, using View bars)
  const renderGraph = (data: { date: number; score: number }[], height: number = GRAPH_HEIGHT) => {
    if (data.length < 2) return null;
    const maxScore = 100;
    const barWidth = Math.max(4, Math.min(12, (GRAPH_WIDTH - 32) / data.length - 2));

    return (
      <View style={[styles.graphContainer, { height }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={[styles.axisLabel, { color: colors.muted }]}>100</Text>
          <Text style={[styles.axisLabel, { color: colors.muted }]}>50</Text>
          <Text style={[styles.axisLabel, { color: colors.muted }]}>0</Text>
        </View>
        {/* Bars */}
        <View style={styles.barsContainer}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { top: 0, borderColor: colors.border }]} />
          <View style={[styles.gridLine, { top: "50%", borderColor: colors.border }]} />
          <View style={[styles.gridLine, { top: "100%", borderColor: colors.border }]} />
          {/* Data bars */}
          <View style={styles.barsRow}>
            {data.map((point, i) => {
              const barHeight = (point.score / maxScore) * (height - 20);
              const barColor = point.score >= 80 ? colors.success :
                point.score >= 60 ? colors.warning : colors.error;
              return (
                <View key={i} style={[styles.barWrapper, { height: height - 20 }]}>
                  <View
                    style={[styles.bar, {
                      height: barHeight,
                      width: barWidth,
                      backgroundColor: barColor,
                      borderRadius: barWidth / 2,
                    }]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const getScoreColor = (score: number) =>
    score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.error;

  const getTrendIcon = (trend: string) =>
    trend === "improving" ? "trending-up" : trend === "declining" ? "trending-down" : "remove";

  const getTrendColor = (trend: string) =>
    trend === "improving" ? colors.success : trend === "declining" ? colors.error : colors.muted;

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Pronunciation Progress</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Time Range Selector */}
        <View style={[styles.timeSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(["week", "month", "all"] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.timeButton, timeRange === range && { backgroundColor: colors.primary }]}
              onPress={() => setTimeRange(range)}
              activeOpacity={0.7}
            >
              <Text style={[styles.timeButtonText, { color: timeRange === range ? "#fff" : colors.muted }]}>
                {range === "week" ? "7 Days" : range === "month" ? "30 Days" : "All Time"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overall Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: getScoreColor(overallAvg) }]}>{overallAvg}%</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Average</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: getScoreColor(latestScore) }]}>{latestScore}%</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Latest</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.improvementRow}>
                <Ionicons
                  name={improvement > 0 ? "arrow-up" : improvement < 0 ? "arrow-down" : "remove"}
                  size={16}
                  color={improvement > 0 ? colors.success : improvement < 0 ? colors.error : colors.muted}
                />
                <Text style={[styles.statValue, { color: improvement > 0 ? colors.success : improvement < 0 ? colors.error : colors.muted }]}>
                  {Math.abs(improvement)}%
                </Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Change</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{filteredSessions.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Sessions</Text>
            </View>
          </View>
        </View>

        {/* Overall Score Graph */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Score Timeline</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            Your overall pronunciation accuracy over time
          </Text>
          {renderGraph(filteredSessions.map((s) => ({ date: s.date, score: s.overallScore })))}
        </View>

        {/* Phoneme Breakdown */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sound Breakdown</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            Tap a sound to see its progress graph
          </Text>
          <View style={styles.phonemeGrid}>
            {phonemeProgress.map((pp) => (
              <TouchableOpacity
                key={pp.phoneme}
                style={[styles.phonemeChip, {
                  backgroundColor: getScoreColor(pp.currentAvg) + "15",
                  borderColor: getScoreColor(pp.currentAvg) + "40",
                  ...(selectedPhoneme?.phoneme === pp.phoneme && { borderWidth: 2, borderColor: colors.primary }),
                }]}
                onPress={() => setSelectedPhoneme(selectedPhoneme?.phoneme === pp.phoneme ? null : pp)}
                activeOpacity={0.7}
              >
                <Text style={[styles.phonemeChar, { color: getScoreColor(pp.currentAvg) }]}>{pp.phoneme}</Text>
                <View style={styles.phonemeChipMeta}>
                  <Text style={[styles.phonemeScore, { color: getScoreColor(pp.currentAvg) }]}>{pp.currentAvg}%</Text>
                  <Ionicons
                    name={getTrendIcon(pp.trend) as any}
                    size={12}
                    color={getTrendColor(pp.trend)}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Phoneme Detail */}
          {selectedPhoneme && (
            <View style={[styles.phonemeDetail, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.phonemeDetailHeader}>
                <Text style={[styles.phonemeDetailTitle, { color: colors.foreground }]}>
                  /{selectedPhoneme.phoneme}/ Progress
                </Text>
                <View style={styles.phonemeTrendBadge}>
                  <Ionicons
                    name={getTrendIcon(selectedPhoneme.trend) as any}
                    size={14}
                    color={getTrendColor(selectedPhoneme.trend)}
                  />
                  <Text style={[styles.phonemeTrendText, { color: getTrendColor(selectedPhoneme.trend) }]}>
                    {selectedPhoneme.trend}
                  </Text>
                </View>
              </View>
              <View style={styles.phonemeDetailStats}>
                <Text style={[styles.phonemeDetailStat, { color: colors.muted }]}>
                  Best: {selectedPhoneme.bestScore}% | Sessions: {selectedPhoneme.sessionsCount}
                </Text>
              </View>
              {renderGraph(selectedPhoneme.scores, 100)}
            </View>
          )}
        </View>

        {/* Time Capsule Comparison */}
        {timeCapsules.length >= 2 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginLeft: 8 }]}>Time Capsule</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              Compare your pronunciation from Day 1 to now
            </Text>
            <View style={styles.capsuleComparison}>
              {timeCapsules.map((capsule, i) => (
                <View key={capsule.id} style={[styles.capsuleCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[styles.capsuleDayBadge, { backgroundColor: i === 0 ? colors.muted + "20" : colors.success + "20" }]}>
                    <Text style={[styles.capsuleDayText, { color: i === 0 ? colors.muted : colors.success }]}>
                      Day {capsule.day}
                    </Text>
                  </View>
                  <Text style={[styles.capsulePhrase, { color: colors.foreground }]} numberOfLines={1}>
                    {capsule.phrase}
                  </Text>
                  <Text style={[styles.capsuleScore, { color: getScoreColor(capsule.score || 0) }]}>
                    {capsule.score || "—"}%
                  </Text>
                  <Text style={[styles.capsuleDate, { color: colors.muted }]}>
                    {new Date(capsule.recordedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
            {timeCapsules.length >= 2 && (
              <View style={[styles.improvementBanner, { backgroundColor: colors.success + "10" }]}>
                <Ionicons name="trophy" size={20} color={colors.success} />
                <Text style={[styles.improvementBannerText, { color: colors.success }]}>
                  +{(timeCapsules[timeCapsules.length - 1].score || 0) - (timeCapsules[0].score || 0)}% improvement since Day 1!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Sessions */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Sessions</Text>
          {filteredSessions.slice(-5).reverse().map((session) => (
            <View key={session.id} style={[styles.sessionRow, { borderBottomColor: colors.border }]}>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionPhrase, { color: colors.foreground }]}>{session.phrase}</Text>
                <Text style={[styles.sessionDate, { color: colors.muted }]}>
                  {new Date(session.date).toLocaleDateString()} • {session.language}
                </Text>
                {session.feedback ? (
                  <Text style={[styles.sessionFeedback, { color: colors.muted }]}>{session.feedback}</Text>
                ) : null}
              </View>
              <View style={[styles.sessionScoreBadge, { backgroundColor: getScoreColor(session.overallScore) + "15" }]}>
                <Text style={[styles.sessionScoreText, { color: getScoreColor(session.overallScore) }]}>
                  {session.overallScore}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "800" },
  timeSelector: { flexDirection: "row", borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 0.5 },
  timeButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  timeButtonText: { fontSize: 13, fontWeight: "600" },
  statsCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 0.5 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "500" },
  improvementRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  section: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionSubtitle: { fontSize: 12, marginTop: 2, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center" },
  graphContainer: { flexDirection: "row", marginTop: 8 },
  yAxis: { width: 28, justifyContent: "space-between", paddingVertical: 2 },
  axisLabel: { fontSize: 9, textAlign: "right" },
  barsContainer: { flex: 1, position: "relative" },
  gridLine: { position: "absolute", left: 0, right: 0, borderTopWidth: 0.5, borderStyle: "dashed" },
  barsRow: { flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-evenly", height: "100%" },
  barWrapper: { justifyContent: "flex-end", alignItems: "center" },
  bar: { minHeight: 4 },
  phonemeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  phonemeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: "center", minWidth: 60 },
  phonemeChar: { fontSize: 18, fontWeight: "700" },
  phonemeChipMeta: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  phonemeScore: { fontSize: 11, fontWeight: "600" },
  phonemeDetail: { marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 0.5 },
  phonemeDetailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  phonemeDetailTitle: { fontSize: 14, fontWeight: "700" },
  phonemeTrendBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  phonemeTrendText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  phonemeDetailStats: { marginTop: 4, marginBottom: 8 },
  phonemeDetailStat: { fontSize: 11 },
  capsuleComparison: { flexDirection: "row", gap: 12 },
  capsuleCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 0.5, alignItems: "center", gap: 6 },
  capsuleDayBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  capsuleDayText: { fontSize: 11, fontWeight: "700" },
  capsulePhrase: { fontSize: 12, fontWeight: "500", textAlign: "center" },
  capsuleScore: { fontSize: 24, fontWeight: "900" },
  capsuleDate: { fontSize: 10 },
  improvementBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, marginTop: 12 },
  improvementBannerText: { fontSize: 13, fontWeight: "700" },
  sessionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5 },
  sessionInfo: { flex: 1, gap: 2 },
  sessionPhrase: { fontSize: 14, fontWeight: "600" },
  sessionDate: { fontSize: 11 },
  sessionFeedback: { fontSize: 11, fontStyle: "italic" },
  sessionScoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  sessionScoreText: { fontSize: 15, fontWeight: "800" },
});
