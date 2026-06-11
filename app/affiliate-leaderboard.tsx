import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { vanillaClient } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

type TimeFilter = "all_time" | "this_month" | "this_week";

interface LeaderboardEntry {
  rank: number;
  name: string;
  badge: string;
  totalReferrals: number;
  totalConversions: number;
  conversionRate: number;
  totalEarnings: number;
}

const BADGE_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  Platinum: { color: "#E5E4E2", bg: "#E5E4E220", icon: "💎" },
  Gold: { color: "#FFD700", bg: "#FFD70020", icon: "🥇" },
  Silver: { color: "#C0C0C0", bg: "#C0C0C020", icon: "🥈" },
  Bronze: { color: "#CD7F32", bg: "#CD7F3220", icon: "🥉" },
};

export default function AffiliateLeaderboardScreen() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all_time");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const result = await vanillaClient.affiliate.leaderboard.query({
        timeFilter,
        limit: 100,
      });
      setLeaderboard(result.leaderboard || []);
      setTotal(result.total || 0);
    } catch (err) {
      // Fallback mock data for when DB is empty
      setLeaderboard([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleJoinProgram = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/affiliate-signup");
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: "🏆", bg: "#FFD700", textColor: "#000" };
    if (rank === 2) return { icon: "🥈", bg: "#C0C0C0", textColor: "#000" };
    if (rank === 3) return { icon: "🥉", bg: "#CD7F32", textColor: "#fff" };
    return { icon: `#${rank}`, bg: "#1e2022", textColor: "#fff" };
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <Text style={styles.backBtn}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Affiliate Leaderboard</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🏆</Text>
          <Text style={styles.heroTitle}>Top Affiliates</Text>
          <Text style={styles.heroSubtitle}>
            Our highest-performing partners ranked by referrals, conversions, and earnings.
            Join the program and see your name here!
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{total}</Text>
              <Text style={styles.statLabel}>Active Affiliates</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>20%</Text>
              <Text style={styles.statLabel}>Tier 1 Commission</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>5%</Text>
              <Text style={styles.statLabel}>Tier 2 Commission</Text>
            </View>
          </View>
        </View>

        {/* Time Filters */}
        <View style={styles.filterRow}>
          {(["all_time", "this_month", "this_week"] as const).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => {
                setTimeFilter(filter);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [styles.filterChip, timeFilter === filter && styles.filterChipActive, pressed && { opacity: 0.8 }]}
            >
              <Text style={[styles.filterText, timeFilter === filter && styles.filterTextActive]}>
                {filter === "all_time" ? "All Time" : filter === "this_month" ? "This Month" : "This Week"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Leaderboard */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text style={styles.loadingText}>Loading rankings...</Text>
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌟</Text>
            <Text style={styles.emptyTitle}>Be the First!</Text>
            <Text style={styles.emptyText}>
              No rankings yet for this period. Join the affiliate program and claim the top spot!
            </Text>
          </View>
        ) : (
          <View style={styles.leaderboardList}>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <View style={styles.podium}>
                {/* 2nd Place */}
                <View style={[styles.podiumSlot, { marginTop: 20 }]}>
                  <View style={[styles.podiumCircle, { backgroundColor: "#C0C0C0" }]}>
                    <Text style={styles.podiumRank}>🥈</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1]?.name}</Text>
                  <Text style={styles.podiumReferrals}>{leaderboard[1]?.totalReferrals} referrals</Text>
                </View>
                {/* 1st Place */}
                <View style={styles.podiumSlot}>
                  <View style={[styles.podiumCircle, { backgroundColor: "#FFD700", width: 64, height: 64, borderRadius: 32 }]}>
                    <Text style={[styles.podiumRank, { fontSize: 28 }]}>🏆</Text>
                  </View>
                  <Text style={[styles.podiumName, { fontWeight: "800" }]} numberOfLines={1}>{leaderboard[0]?.name}</Text>
                  <Text style={styles.podiumReferrals}>{leaderboard[0]?.totalReferrals} referrals</Text>
                </View>
                {/* 3rd Place */}
                <View style={[styles.podiumSlot, { marginTop: 30 }]}>
                  <View style={[styles.podiumCircle, { backgroundColor: "#CD7F32" }]}>
                    <Text style={styles.podiumRank}>🥉</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2]?.name}</Text>
                  <Text style={styles.podiumReferrals}>{leaderboard[2]?.totalReferrals} referrals</Text>
                </View>
              </View>
            )}

            {/* Full List */}
            {leaderboard.map((entry) => {
              const rankDisplay = getRankDisplay(entry.rank);
              const badgeConfig = BADGE_CONFIG[entry.badge] || BADGE_CONFIG.Bronze;

              return (
                <View key={entry.rank} style={[styles.entryCard, entry.rank <= 3 && styles.entryCardTop3]}>
                  {/* Rank */}
                  <View style={[styles.rankCircle, { backgroundColor: rankDisplay.bg }]}>
                    <Text style={[styles.rankText, { color: rankDisplay.textColor }]}>
                      {entry.rank <= 3 ? rankDisplay.icon : rankDisplay.icon}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={styles.entryInfo}>
                    <View style={styles.entryNameRow}>
                      <Text style={styles.entryName}>{entry.name}</Text>
                      <View style={[styles.badgeChip, { backgroundColor: badgeConfig.bg }]}>
                        <Text style={[styles.badgeText, { color: badgeConfig.color }]}>
                          {badgeConfig.icon} {entry.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.entryStats}>
                      {entry.totalReferrals} referrals · {entry.totalConversions} conversions · {entry.conversionRate}% rate
                    </Text>
                  </View>

                  {/* Earnings */}
                  <View style={styles.entryEarnings}>
                    <Text style={styles.earningsValue}>
                      ${(entry.totalEarnings / 100).toLocaleString()}
                    </Text>
                    <Text style={styles.earningsLabel}>earned</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Want to be on this list?</Text>
          <Text style={styles.ctaText}>
            Join the ConnectWorld AI Affiliate Program and earn up to 20% commission on every referral.
            Share your unique link, grow your audience, and get paid.
          </Text>
          <Pressable
            onPress={handleJoinProgram}
            style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
          >
            <Text style={styles.ctaButtonText}>Join the Affiliate Program →</Text>
          </Pressable>
          <Text style={styles.ctaFooter}>
            Already an affiliate?{" "}
            <Text style={{ color: "#0a7ea4" }} onPress={() => router.push("/affiliate-dashboard")}>
              View your earnings dashboard
            </Text>
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { fontSize: 24, color: "#ECEDEE" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600", color: "#ECEDEE" },

  // Hero
  heroSection: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 24 },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#ECEDEE", marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: "#9BA1A6", textAlign: "center", lineHeight: 20, maxWidth: 320 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 20, width: "100%" },
  statBox: { flex: 1, backgroundColor: "#1e2022", borderRadius: 12, padding: 12, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#4ADE80" },
  statLabel: { fontSize: 10, color: "#9BA1A6", marginTop: 2, textAlign: "center" },

  // Filters
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 20 },
  filterChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#1e2022", alignItems: "center" },
  filterChipActive: { backgroundColor: "#0a7ea4" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#9BA1A6" },
  filterTextActive: { color: "#fff" },

  // Loading
  loadingContainer: { alignItems: "center", paddingVertical: 60 },
  loadingText: { color: "#9BA1A6", marginTop: 12, fontSize: 13 },

  // Empty
  emptyContainer: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#ECEDEE", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#9BA1A6", textAlign: "center", lineHeight: 20 },

  // Podium
  podium: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", paddingHorizontal: 16, marginBottom: 24 },
  podiumSlot: { flex: 1, alignItems: "center" },
  podiumCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  podiumRank: { fontSize: 22 },
  podiumName: { fontSize: 12, fontWeight: "600", color: "#ECEDEE", textAlign: "center" },
  podiumReferrals: { fontSize: 10, color: "#9BA1A6", marginTop: 2 },

  // Leaderboard List
  leaderboardList: { paddingHorizontal: 16 },
  entryCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#1e2022", borderRadius: 12, padding: 14, marginBottom: 8 },
  entryCardTop3: { borderWidth: 1, borderColor: "#FFD70040" },
  rankCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 12 },
  rankText: { fontSize: 13, fontWeight: "700" },
  entryInfo: { flex: 1 },
  entryNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  entryName: { fontSize: 14, fontWeight: "600", color: "#ECEDEE" },
  badgeChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: "700" },
  entryStats: { fontSize: 11, color: "#687076" },
  entryEarnings: { alignItems: "flex-end" },
  earningsValue: { fontSize: 15, fontWeight: "700", color: "#4ADE80" },
  earningsLabel: { fontSize: 9, color: "#687076" },

  // CTA
  ctaSection: { marginTop: 32, marginHorizontal: 16, backgroundColor: "#0a7ea410", borderRadius: 16, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#0a7ea430" },
  ctaTitle: { fontSize: 20, fontWeight: "700", color: "#ECEDEE", marginBottom: 8 },
  ctaText: { fontSize: 13, color: "#9BA1A6", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  ctaButton: { backgroundColor: "#0a7ea4", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, width: "100%", alignItems: "center" },
  ctaButtonText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  ctaFooter: { marginTop: 16, fontSize: 12, color: "#687076" },
});
