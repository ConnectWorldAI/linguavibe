import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { createVanillaClient } from "@/lib/trpc";

interface Recommendation {
  methodName: string;
  teachingStyle: string;
  description: string;
  bestFor: string;
  exampleActivities: string[];
  matchScore: number;
  reasons: string[];
}

export default function MethodologyRecommendationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [studentProfile, setStudentProfile] = useState<{
    level: string;
    pace: string;
    struggles: string[];
    quizAccuracy: number;
  } | null>(null);

  useEffect(() => {
    loadAndFetch();
  }, []);

  const loadAndFetch = async () => {
    try {
      // Gather student profile data
      const [targetLang, level, quizStatsRaw, strugglesRaw, paceRaw] = await Promise.all([
        AsyncStorage.getItem("@target_language"),
        AsyncStorage.getItem("@proficiency_level"),
        AsyncStorage.getItem("@dialect_quiz_stats"),
        AsyncStorage.getItem("@learning_struggles"),
        AsyncStorage.getItem("@learning_pace"),
      ]);

      const quizStats = quizStatsRaw ? JSON.parse(quizStatsRaw) : null;
      const struggles = strugglesRaw ? JSON.parse(strugglesRaw) : [];
      const pace = paceRaw || "moderate";

      setStudentProfile({
        level: level || "A1",
        pace,
        struggles,
        quizAccuracy: quizStats
          ? quizStats.totalQuestions > 0
            ? Math.round((quizStats.correctAnswers / quizStats.totalQuestions) * 100)
            : 0
          : 0,
      });

      const client = createVanillaClient();
      const result = await (client as any).methodologyIngestion.recommend.query({
        targetLanguage: targetLang || "Spanish",
        proficiencyLevel: level || "A1",
        learningPace: pace,
        struggles,
        quizPerformance: quizStats
          ? {
              totalQuestions: quizStats.totalQuestions || 0,
              correctAnswers: quizStats.correctAnswers || 0,
              bestStreak: quizStats.bestStreak || 0,
            }
          : undefined,
      });

      setRecommendations(result.recommendations);
    } catch (err) {
      console.warn("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (idx: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  const getScoreColor = (score: number) => {
    if (score >= 50) return colors.success;
    if (score >= 30) return "#F59E0B";
    return colors.primary;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 50) return "Excellent Match";
    if (score >= 30) return "Good Match";
    return "Potential Fit";
  };

  const renderItem = ({ item, index }: { item: Recommendation; index: number }) => {
    const isExpanded = expandedIdx === index;
    const scoreColor = getScoreColor(item.matchScore);

    return (
      <TouchableOpacity
        onPress={() => toggleExpand(index)}
        activeOpacity={0.8}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {/* Rank badge */}
        <View style={[styles.rankBadge, { backgroundColor: index === 0 ? "#F59E0B" : index === 1 ? "#94A3B8" : index === 2 ? "#CD7F32" : colors.muted }]}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodName, { color: colors.foreground }]}>{item.methodName}</Text>
              <Text style={[styles.teachingStyle, { color: colors.primary }]}>{item.teachingStyle}</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + "20" }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>{item.matchScore}pts</Text>
              <Text style={[styles.scoreLabel, { color: scoreColor }]}>{getScoreLabel(item.matchScore)}</Text>
            </View>
          </View>

          <Text style={[styles.description, { color: colors.muted }]} numberOfLines={isExpanded ? undefined : 2}>
            {item.description}
          </Text>

          {/* Reasons */}
          <View style={styles.reasonsRow}>
            {item.reasons.map((reason, i) => (
              <View key={i} style={[styles.reasonChip, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                <Text style={[styles.reasonText, { color: colors.primary }]}>{reason}</Text>
              </View>
            ))}
          </View>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Best For</Text>
              <Text style={[styles.sectionText, { color: colors.muted }]}>{item.bestFor}</Text>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Example Activities</Text>
              {item.exampleActivities.map((activity, i) => (
                <View key={i} style={styles.activityRow}>
                  <Ionicons name="play-circle-outline" size={14} color={colors.primary} />
                  <Text style={[styles.activityText, { color: colors.muted }]}>{activity}</Text>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => router.push("/methodology-dashboard" as any)}
                style={[styles.viewAllBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.viewAllText, { color: colors.background }]}>View All Methodologies</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.expandHint}>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.muted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>For You</Text>
        <TouchableOpacity onPress={loadAndFetch} style={styles.backBtn}>
          <Ionicons name="refresh" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Student Profile Summary */}
      {studentProfile && (
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.profileTitle, { color: colors.foreground }]}>Your Learning Profile</Text>
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{studentProfile.level}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Level</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{studentProfile.pace}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Pace</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{studentProfile.quizAccuracy}%</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Quiz Acc.</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{studentProfile.struggles.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Struggles</Text>
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Analyzing your learning profile...</Text>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.methodName}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={[styles.listHeader, { color: colors.muted }]}>
              Top {recommendations.length} methodologies ranked by compatibility with your learning style, pace, and performance data.
            </Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  profileCard: { marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  profileTitle: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  profileStats: { flexDirection: "row", justifyContent: "space-between" },
  profileStat: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 11 },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  listHeader: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden", flexDirection: "row" },
  rankBadge: { width: 32, alignItems: "center", justifyContent: "center" },
  rankText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  cardContent: { flex: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  methodName: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  teachingStyle: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  scoreBadge: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  scoreText: { fontSize: 14, fontWeight: "700" },
  scoreLabel: { fontSize: 9, fontWeight: "500" },
  description: { fontSize: 13, lineHeight: 18 },
  reasonsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reasonChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  reasonText: { fontSize: 11, fontWeight: "500" },
  expandedContent: { gap: 8, marginTop: 4 },
  divider: { height: 1, marginVertical: 4 },
  sectionTitle: { fontSize: 13, fontWeight: "600" },
  sectionText: { fontSize: 12, lineHeight: 17 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 4 },
  activityText: { fontSize: 12, lineHeight: 16 },
  viewAllBtn: { alignSelf: "center", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
  viewAllText: { fontSize: 13, fontWeight: "600" },
  expandHint: { alignItems: "center", marginTop: 4 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
});
