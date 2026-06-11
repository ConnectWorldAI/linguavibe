/**
 * Daily Briefing Card
 * 
 * Personalized "Here's what to focus on today" card for the home screen.
 * Pulls from session summary, knowledge gap map, adaptive pacing, and error patterns
 * to generate a concise, actionable daily learning plan.
 */
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { getLastSessionSummary, getSessionStreak } from "@/lib/session-summary";
import { getLearningPriorities } from "@/lib/knowledge-gap-map";
import { getRecommendedDifficulty, getPacingProfile } from "@/lib/adaptive-pacing";
import { getActivePatterns, generateDrillSession } from "@/lib/error-pattern-detection";
import { getLearningStyleProfile } from "@/lib/learning-style-detection";

interface DailyBriefing {
  greeting: string;
  streakDays: number;
  focusAreas: { label: string; icon: string; route: string; priority: "high" | "medium" | "low" }[];
  paceState: string;
  difficulty: number;
  primaryStyle: string;
  errorPatternsCount: number;
  tomorrowFocus?: string;
}

export function DailyBriefingCard() {
  const router = useRouter();
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadBriefing();
  }, []);

  const loadBriefing = async () => {
    try {
      const [lastSession, streak, priorities, difficulty, pacingProfile, patterns, styleProfile] = await Promise.all([
        getLastSessionSummary(),
        getSessionStreak(),
        getLearningPriorities(),
        getRecommendedDifficulty(),
        getPacingProfile(),
        getActivePatterns(),
        getLearningStyleProfile(),
      ]);

      // Build focus areas from priorities and patterns
      const focusAreas: DailyBriefing["focusAreas"] = [];

      // Add top priority from knowledge gap
      if (priorities.length > 0) {
        const top = priorities[0];
        focusAreas.push({
          label: `Practice ${top.domain}: ${top.skillName || top.domain}`,
          icon: top.domain === "grammar" ? "construct" : top.domain === "vocabulary" ? "book" : top.domain === "pronunciation" ? "mic" : "school",
          route: top.domain === "vocabulary" ? "/flashcard-srs" : top.domain === "pronunciation" ? "/voice-conversation" : "/lesson-player",
          priority: "high",
        });
      }

      // Add error pattern drill if patterns exist
      if (patterns.length > 0) {
        focusAreas.push({
          label: `Fix ${patterns[0].category} pattern (${patterns[0].frequency}x)`,
          icon: "warning",
          route: "/flashcard-srs",
          priority: "high",
        });
      }

      // Add session-based recommendation
      if (lastSession?.tomorrowFocus) {
        focusAreas.push({
          label: lastSession.tomorrowFocus,
          icon: "arrow-forward-circle",
          route: "/knowledge-gap-map",
          priority: "medium",
        });
      }

      // Add style-based recommendation
      if (styleProfile?.primaryStyle) {
        const styleRoutes: Record<string, string> = {
          visual: "/flashcard-srs",
          auditory: "/voice-conversation",
          reading: "/lesson-player",
          kinesthetic: "/friend-challenges",
        };
        focusAreas.push({
          label: `${styleProfile.primaryStyle} practice (your strongest modality)`,
          icon: styleProfile.primaryStyle === "auditory" ? "headset" : styleProfile.primaryStyle === "visual" ? "eye" : "hand-left",
          route: styleRoutes[styleProfile.primaryStyle] || "/flashcard-srs",
          priority: "low",
        });
      }

      // Determine greeting based on time of day
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

      setBriefing({
        greeting,
        streakDays: streak,
        focusAreas: focusAreas.slice(0, 3), // Max 3 focus areas
        paceState: pacingProfile?.paceState || "warming_up",
        difficulty,
        primaryStyle: styleProfile?.primaryStyle || "reading",
        errorPatternsCount: patterns.length,
        tomorrowFocus: lastSession?.tomorrowFocus,
      });
    } catch (err) {
      // Fallback briefing for new users
      setBriefing({
        greeting: "Welcome back",
        streakDays: 0,
        focusAreas: [
          { label: "Start a flashcard session", icon: "albums", route: "/flashcard-srs", priority: "high" },
          { label: "Try a lesson", icon: "book", route: "/lesson-player", priority: "medium" },
          { label: "Practice speaking", icon: "mic", route: "/voice-conversation", priority: "low" },
        ],
        paceState: "warming_up",
        difficulty: 5,
        primaryStyle: "reading",
        errorPatternsCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#00AAFF" />
      </View>
    );
  }

  if (!briefing) return null;

  const paceEmoji = briefing.paceState === "flow" ? "🔥" : briefing.paceState === "breezing" ? "⚡" : briefing.paceState === "struggling" ? "💪" : "🌱";
  const priorityColors = { high: "#F44336", medium: "#FF9800", low: "#4CAF50" };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setCollapsed(!collapsed);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{briefing.greeting} {paceEmoji}</Text>
          <Text style={styles.subtitle}>
            {briefing.streakDays > 0 ? `${briefing.streakDays}-day streak` : "Start your streak today"}
            {briefing.errorPatternsCount > 0 ? ` · ${briefing.errorPatternsCount} patterns to fix` : ""}
          </Text>
        </View>
        <Ionicons name={collapsed ? "chevron-down" : "chevron-up"} size={18} color="#9BA1A6" />
      </TouchableOpacity>

      {/* Focus Areas */}
      {!collapsed && (
        <View style={styles.focusAreas}>
          <Text style={styles.focusTitle}>Today's Focus</Text>
          {briefing.focusAreas.map((area, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.focusItem}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(area.route as any);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.priorityDot, { backgroundColor: priorityColors[area.priority] }]} />
              <Ionicons name={area.icon as any} size={18} color="#00AAFF" style={{ marginRight: 10 }} />
              <Text style={styles.focusLabel} numberOfLines={1}>{area.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#5A6A7A" />
            </TouchableOpacity>
          ))}

          {/* Practice Weak Areas Button */}
          {briefing.errorPatternsCount > 0 && (
            <TouchableOpacity
              style={styles.practiceButton}
              onPress={async () => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                try {
                  const drill = await generateDrillSession(8);
                  if (drill && drill.exercises.length > 0) {
                    router.push({ pathname: "/targeted-drill" as any, params: { sessionId: drill.id } });
                  } else {
                    router.push("/flashcard-srs" as any);
                  }
                } catch {
                  router.push("/flashcard-srs" as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="fitness" size={18} color="#FFF" />
              <Text style={styles.practiceButtonText}>Practice Weak Areas</Text>
              <View style={styles.patternBadge}>
                <Text style={styles.patternBadgeText}>{briefing.errorPatternsCount}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Quick stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statText}>Pace: {briefing.paceState}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statText}>Difficulty: {briefing.difficulty}/10</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statText}>Style: {briefing.primaryStyle}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#141825",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,170,255,0.15)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ECEDEE",
  },
  subtitle: {
    fontSize: 13,
    color: "#8A9BB0",
    marginTop: 2,
  },
  focusAreas: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  focusTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5A6A7A",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  focusItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,170,255,0.05)",
    borderRadius: 10,
    marginBottom: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  focusLabel: {
    flex: 1,
    fontSize: 14,
    color: "#ECEDEE",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  statPill: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statText: {
    fontSize: 11,
    color: "#8A9BB0",
    fontWeight: "500",
  },
  practiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F44336",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  practiceButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  patternBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  patternBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
  },
});
