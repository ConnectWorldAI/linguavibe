import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  surfaceElevated: "#1C2235",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  gold: "#FFD700",
  success: "#00E676",
  error: "#FF5252",
  warning: "#FF9F43",
  purple: "#8B5CF6",
  glowSubtle: "rgba(0,170,255,0.08)",
  glowBorder: "rgba(0,170,255,0.2)",
};

interface ClassRecap {
  id: string;
  title: string;
  instructor: string;
  date: string;
  duration: string;
  language: string;
  type: "live" | "prerecorded";
  attended: boolean;
  hasAiSummary: boolean;
  topics: string[];
  tier: "free" | "premium";
}

const CLASS_RECAPS: ClassRecap[] = [
  {
    id: "1",
    title: "Dominican Slang & Street Expressions",
    instructor: "Prof. Maria Santos",
    date: "May 20, 2026",
    duration: "45 min",
    language: "Spanish",
    type: "live",
    attended: false,
    hasAiSummary: true,
    topics: ["Slang", "Informal speech", "Cultural context"],
    tier: "premium",
  },
  {
    id: "2",
    title: "Business French: Negotiations",
    instructor: "Jean-Pierre Dubois",
    date: "May 19, 2026",
    duration: "60 min",
    language: "French",
    type: "live",
    attended: true,
    hasAiSummary: true,
    topics: ["Formal language", "Negotiation phrases", "Email etiquette"],
    tier: "premium",
  },
  {
    id: "3",
    title: "Japanese Honorifics Deep Dive",
    instructor: "Yuki Tanaka",
    date: "May 18, 2026",
    duration: "50 min",
    language: "Japanese",
    type: "live",
    attended: false,
    hasAiSummary: true,
    topics: ["Keigo", "Social hierarchy", "Formal vs informal"],
    tier: "premium",
  },
  {
    id: "4",
    title: "Spanish Pronunciation Basics",
    instructor: "Carlos Rivera",
    date: "May 17, 2026",
    duration: "30 min",
    language: "Spanish",
    type: "prerecorded",
    attended: false,
    hasAiSummary: false,
    topics: ["Vowels", "Rolling R", "Accent marks"],
    tier: "free",
  },
  {
    id: "5",
    title: "Travel French Essentials",
    instructor: "Marie Laurent",
    date: "May 16, 2026",
    duration: "35 min",
    language: "French",
    type: "prerecorded",
    attended: false,
    hasAiSummary: false,
    topics: ["Directions", "Ordering food", "Transportation"],
    tier: "free",
  },
  {
    id: "6",
    title: "Advanced Conversation: Current Events",
    instructor: "Prof. Maria Santos",
    date: "May 15, 2026",
    duration: "55 min",
    language: "Spanish",
    type: "live",
    attended: false,
    hasAiSummary: true,
    topics: ["News discussion", "Opinion phrases", "Debate skills"],
    tier: "premium",
  },
];

export default function ClassRecapsScreen() {
  const router = useRouter();
  const [userTier] = useState<"free" | "premium">("free"); // Simulated user tier
  const [filter, setFilter] = useState<"all" | "live" | "free">("all");

  const filteredRecaps = CLASS_RECAPS.filter((r) => {
    if (filter === "live") return r.type === "live";
    if (filter === "free") return r.tier === "free";
    return true;
  });

  const missedThisMonth = 1; // Simulated
  const freeReplaysLeft = Math.max(0, 3 - missedThisMonth);

  const handleWatchRecap = (recap: ClassRecap) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (recap.tier === "premium" && userTier === "free") {
      Alert.alert(
        "Premium Content",
        `This live class replay requires Pro membership or a one-time fee of $2.99.\n\nUpgrade to Pro for unlimited access to all class replays.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Pay $2.99", onPress: () => router.push("/checkout" as any) },
          { text: "Upgrade to Pro", onPress: () => router.push("/membership" as any) },
        ]
      );
    } else if (recap.tier === "premium" && !recap.attended && freeReplaysLeft <= 0) {
      // Pro/Premium users who exceeded free replays
      Alert.alert(
        "Replay Limit Reached",
        `You've used all 3 free replays this month.\n\nAdditional replays are $2.99 each. Attendance matters for your certificates and credibility.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Pay $2.99", onPress: () => router.push("/checkout" as any) },
        ]
      );
    } else {
      Alert.alert("Playing", `Now playing: ${recap.title}`);
    }
  };

  const handleAiSummary = (recap: ClassRecap) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userTier === "free") {
      Alert.alert(
        "AI Summary",
        "AI class summaries are available with Pro membership.\n\nGet quick recaps of any missed class without watching the full recording.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/membership" as any) },
        ]
      );
    } else {
      Alert.alert("AI Summary", `Generating summary for: ${recap.title}\n\nKey points:\n• ${recap.topics.join("\n• ")}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Class Recaps</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tier Banner */}
      <View style={styles.tierBanner}>
        <View style={styles.tierBannerLeft}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>FREE</Text>
          </View>
          <Text style={styles.tierBannerText}>Limited access to recaps</Text>
        </View>
        <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push("/membership" as any)}>
          <Ionicons name="diamond" size={12} color="#FFFFFF" />
          <Text style={styles.upgradeBtnText}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Policy */}
      <View style={styles.policyCard}>
        <View style={styles.policyHeader}>
          <Ionicons name="school" size={16} color={Colors.warning} />
          <Text style={styles.policyTitle}>Attendance Policy</Text>
        </View>
        <Text style={styles.policyText}>
          Classes are treated like a real school. Even Pro/Premium members are charged $2.99 per replay after 3 missed classes per month. You have a 24-hour buffer to reschedule before a class is marked "missed." Your AI agent can help manage your schedule to avoid conflicts.
        </Text>
        <View style={styles.policyStats}>
          <View style={styles.policyStat}>
            <Text style={styles.policyStatValue}>1/3</Text>
            <Text style={styles.policyStatLabel}>Missed this month</Text>
          </View>
          <View style={styles.policyStat}>
            <Text style={styles.policyStatValue}>24h</Text>
            <Text style={styles.policyStatLabel}>Reschedule buffer</Text>
          </View>
          <View style={styles.policyStat}>
            <Text style={styles.policyStatValue}>$2.99</Text>
            <Text style={styles.policyStatLabel}>Per extra replay</Text>
          </View>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {[
          { key: "all", label: "All Classes" },
          { key: "live", label: "Live Replays" },
          { key: "free", label: "Free" },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(f.key as any);
            }}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {filteredRecaps.map((recap) => {
          const isLocked = recap.tier === "premium" && userTier === "free";
          return (
            <View key={recap.id} style={[styles.recapCard, isLocked && styles.recapCardLocked]}>
              {/* Lock Overlay */}
              {isLocked && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={10} color={Colors.gold} />
                  <Text style={styles.lockBadgeText}>PRO</Text>
                </View>
              )}

              {/* Type Badge */}
              <View style={styles.recapHeader}>
                <View style={[styles.typeBadge, recap.type === "live" ? styles.typeBadgeLive : styles.typeBadgeFree]}>
                  <Ionicons name={recap.type === "live" ? "videocam" : "play-circle"} size={12} color={recap.type === "live" ? Colors.error : Colors.success} />
                  <Text style={[styles.typeBadgeText, { color: recap.type === "live" ? Colors.error : Colors.success }]}>
                    {recap.type === "live" ? "Live Replay" : "Pre-recorded"}
                  </Text>
                </View>
                <Text style={styles.recapDate}>{recap.date}</Text>
              </View>

              <Text style={styles.recapTitle}>{recap.title}</Text>
              <Text style={styles.recapInstructor}>{recap.instructor} • {recap.language}</Text>
              <Text style={styles.recapDuration}>{recap.duration}</Text>

              {/* Topics */}
              <View style={styles.topicsRow}>
                {recap.topics.map((topic) => (
                  <View key={topic} style={styles.topicChip}>
                    <Text style={styles.topicChipText}>{topic}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.recapActions}>
                <TouchableOpacity
                  style={[styles.watchBtn, isLocked && styles.watchBtnLocked]}
                  onPress={() => handleWatchRecap(recap)}
                >
                  <Ionicons name={isLocked ? "lock-closed" : "play"} size={14} color="#FFFFFF" />
                  <Text style={styles.watchBtnText}>{isLocked ? "Unlock ($2.99)" : "Watch"}</Text>
                </TouchableOpacity>

                {recap.hasAiSummary && (
                  <TouchableOpacity style={styles.summaryBtn} onPress={() => handleAiSummary(recap)}>
                    <Ionicons name="sparkles" size={14} color={Colors.purple} />
                    <Text style={styles.summaryBtnText}>AI Summary</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Attended Badge */}
              {recap.attended && (
                <View style={styles.attendedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                  <Text style={styles.attendedText}>Attended</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  tierBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    backgroundColor: "rgba(255,215,0,0.06)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
    marginBottom: 14,
  },
  tierBannerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  tierBadge: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tierBadgeText: { fontSize: 9, fontWeight: "800", color: Colors.textMuted },
  tierBannerText: { fontSize: 12, color: Colors.textSecondary },
  upgradeBtn: { flexDirection: "row", gap: 4, backgroundColor: Colors.gold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: "center" },
  upgradeBtnText: { fontSize: 11, fontWeight: "700", color: "#000000" },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.glowSubtle, borderColor: Colors.glowBorder },
  filterChipText: { fontSize: 12, fontWeight: "600", color: Colors.textMuted },
  filterChipTextActive: { color: Colors.secondary },
  recapCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    position: "relative",
  },
  recapCardLocked: { borderColor: "rgba(255,215,0,0.15)" },
  lockBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 4,
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: "center",
  },
  lockBadgeText: { fontSize: 9, fontWeight: "800", color: Colors.gold },
  recapHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  typeBadge: { flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: "center" },
  typeBadgeLive: { backgroundColor: "rgba(255,82,82,0.1)" },
  typeBadgeFree: { backgroundColor: "rgba(0,230,118,0.1)" },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  recapDate: { fontSize: 11, color: Colors.textMuted },
  recapTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 4, paddingRight: 60 },
  recapInstructor: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  recapDuration: { fontSize: 11, color: Colors.textMuted, marginBottom: 10 },
  topicsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  topicChip: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  topicChipText: { fontSize: 10, color: Colors.textSecondary, fontWeight: "500" },
  recapActions: { flexDirection: "row", gap: 10 },
  watchBtn: { flexDirection: "row", gap: 6, backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  watchBtnLocked: { backgroundColor: Colors.gold },
  watchBtnText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  summaryBtn: { flexDirection: "row", gap: 6, backgroundColor: "rgba(139,92,246,0.12)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "rgba(139,92,246,0.3)" },
  summaryBtnText: { fontSize: 12, fontWeight: "600", color: Colors.purple },
  attendedBadge: { position: "absolute", bottom: 12, right: 12, flexDirection: "row", gap: 4, alignItems: "center" },
  attendedText: { fontSize: 10, color: Colors.success, fontWeight: "600" },
  policyCard: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255,159,67,0.06)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,159,67,0.2)",
    marginBottom: 14,
  },
  policyHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  policyTitle: { fontSize: 13, fontWeight: "800", color: Colors.warning },
  policyText: { fontSize: 11, color: Colors.textSecondary, lineHeight: 17, marginBottom: 12 },
  policyStats: { flexDirection: "row", justifyContent: "space-around" },
  policyStat: { alignItems: "center" },
  policyStatValue: { fontSize: 16, fontWeight: "900", color: Colors.textPrimary },
  policyStatLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 2 },
});
