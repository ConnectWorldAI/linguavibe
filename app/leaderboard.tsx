import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { getOverallXP } from "@/lib/exercise-scoring";
import { buildChallengeMessage, getUnreadReferralCount } from "@/lib/referral-incentive";
import { useNotificationBadges } from "@/lib/notification-badges";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LeaderboardTab = "streak" | "credits" | "songs" | "xp" | "weekly";

type LeaderEntry = {
  id: string;
  name: string;
  avatar: string;
  value: number;
  isYou?: boolean;
};

const STREAK_LEADERS: LeaderEntry[] = [
  { id: "1", name: "Maria G.", avatar: "https://i.pravatar.cc/100?img=1", value: 142 },
  { id: "2", name: "Carlos R.", avatar: "https://i.pravatar.cc/100?img=2", value: 98 },
  { id: "3", name: "Yuki T.", avatar: "https://i.pravatar.cc/100?img=3", value: 87 },
  { id: "4", name: "Ahmed K.", avatar: "https://i.pravatar.cc/100?img=4", value: 64 },
  { id: "5", name: "Sophie L.", avatar: "https://i.pravatar.cc/100?img=5", value: 52 },
  { id: "6", name: "You", avatar: "https://i.pravatar.cc/100?img=8", value: 12, isYou: true },
  { id: "7", name: "Priya M.", avatar: "https://i.pravatar.cc/100?img=9", value: 9 },
  { id: "8", name: "James W.", avatar: "https://i.pravatar.cc/100?img=10", value: 7 },
  { id: "9", name: "Lina C.", avatar: "https://i.pravatar.cc/100?img=11", value: 5 },
  { id: "10", name: "Kenji O.", avatar: "https://i.pravatar.cc/100?img=12", value: 3 },
];

const CREDITS_LEADERS: LeaderEntry[] = [
  { id: "1", name: "Carlos R.", avatar: "https://i.pravatar.cc/100?img=2", value: 4250 },
  { id: "2", name: "Sophie L.", avatar: "https://i.pravatar.cc/100?img=5", value: 3800 },
  { id: "3", name: "Maria G.", avatar: "https://i.pravatar.cc/100?img=1", value: 2900 },
  { id: "4", name: "Ahmed K.", avatar: "https://i.pravatar.cc/100?img=4", value: 2100 },
  { id: "5", name: "Yuki T.", avatar: "https://i.pravatar.cc/100?img=3", value: 1750 },
  { id: "6", name: "James W.", avatar: "https://i.pravatar.cc/100?img=10", value: 1200 },
  { id: "7", name: "You", avatar: "https://i.pravatar.cc/100?img=8", value: 875, isYou: true },
  { id: "8", name: "Priya M.", avatar: "https://i.pravatar.cc/100?img=9", value: 650 },
  { id: "9", name: "Lina C.", avatar: "https://i.pravatar.cc/100?img=11", value: 420 },
  { id: "10", name: "Kenji O.", avatar: "https://i.pravatar.cc/100?img=12", value: 180 },
];

const SONGS_LEADERS: LeaderEntry[] = [
  { id: "1", name: "Yuki T.", avatar: "https://i.pravatar.cc/100?img=3", value: 89 },
  { id: "2", name: "Maria G.", avatar: "https://i.pravatar.cc/100?img=1", value: 72 },
  { id: "3", name: "Lina C.", avatar: "https://i.pravatar.cc/100?img=11", value: 58 },
  { id: "4", name: "Carlos R.", avatar: "https://i.pravatar.cc/100?img=2", value: 45 },
  { id: "5", name: "Sophie L.", avatar: "https://i.pravatar.cc/100?img=5", value: 38 },
  { id: "6", name: "You", avatar: "https://i.pravatar.cc/100?img=8", value: 24, isYou: true },
  { id: "7", name: "Ahmed K.", avatar: "https://i.pravatar.cc/100?img=4", value: 19 },
  { id: "8", name: "James W.", avatar: "https://i.pravatar.cc/100?img=10", value: 14 },
  { id: "9", name: "Priya M.", avatar: "https://i.pravatar.cc/100?img=9", value: 8 },
  { id: "10", name: "Kenji O.", avatar: "https://i.pravatar.cc/100?img=12", value: 4 },
];

const XP_LEADERS: LeaderEntry[] = [
  { id: "1", name: "Maria G.", avatar: "https://i.pravatar.cc/100?img=1", value: 12450 },
  { id: "2", name: "Carlos R.", avatar: "https://i.pravatar.cc/100?img=2", value: 11280 },
  { id: "3", name: "Yuki T.", avatar: "https://i.pravatar.cc/100?img=3", value: 10890 },
  { id: "4", name: "Ahmed K.", avatar: "https://i.pravatar.cc/100?img=4", value: 9750 },
  { id: "5", name: "Sophie L.", avatar: "https://i.pravatar.cc/100?img=5", value: 8920 },
  { id: "6", name: "You", avatar: "https://i.pravatar.cc/100?img=8", value: 8450, isYou: true },
  { id: "7", name: "Priya M.", avatar: "https://i.pravatar.cc/100?img=9", value: 7800 },
  { id: "8", name: "James W.", avatar: "https://i.pravatar.cc/100?img=10", value: 7200 },
  { id: "9", name: "Lina C.", avatar: "https://i.pravatar.cc/100?img=11", value: 6890 },
  { id: "10", name: "Kenji O.", avatar: "https://i.pravatar.cc/100?img=12", value: 6450 },
];

const XP_BREAKDOWN = [
  { label: "Lessons", xp: 3200, icon: "book", color: "#00AAFF" },
  { label: "Flashcards", xp: 2100, icon: "layers", color: "#FFD700" },
  { label: "Streaks", xp: 1400, icon: "flame", color: "#00E676" },
  { label: "Calls", xp: 980, icon: "call", color: "#8B5CF6" },
  { label: "Songs", xp: 770, icon: "musical-notes", color: "#FF5252" },
];

const WEEKLY_XP_LEADERS: LeaderEntry[] = [
  { id: "1", name: "Maria G.", avatar: "https://i.pravatar.cc/100?img=1", value: 145 },
  { id: "2", name: "Carlos R.", avatar: "https://i.pravatar.cc/100?img=2", value: 128 },
  { id: "3", name: "Yuki T.", avatar: "https://i.pravatar.cc/100?img=3", value: 112 },
  { id: "4", name: "Ahmed K.", avatar: "https://i.pravatar.cc/100?img=4", value: 98 },
  { id: "5", name: "Sophie L.", avatar: "https://i.pravatar.cc/100?img=5", value: 87 },
  { id: "6", name: "You", avatar: "https://i.pravatar.cc/100?img=8", value: 0, isYou: true },
  { id: "7", name: "Priya M.", avatar: "https://i.pravatar.cc/100?img=9", value: 54 },
  { id: "8", name: "James W.", avatar: "https://i.pravatar.cc/100?img=10", value: 42 },
  { id: "9", name: "Lina C.", avatar: "https://i.pravatar.cc/100?img=11", value: 35 },
  { id: "10", name: "Kenji O.", avatar: "https://i.pravatar.cc/100?img=12", value: 22 },
];

const TABS: { key: LeaderboardTab; label: string; icon: string; unit: string }[] = [
  { key: "weekly", label: "Weekly", icon: "calendar", unit: "XP" },
  { key: "xp", label: "XP", icon: "trophy", unit: "XP" },
  { key: "streak", label: "Streak", icon: "flame", unit: "days" },
  { key: "credits", label: "Credits", icon: "diamond", unit: "credits" },
  { key: "songs", label: "Songs", icon: "musical-notes", unit: "songs" },
];

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("weekly");
  const [userWeeklyXP, setUserWeeklyXP] = useState(0);
  const { badges, setBadge } = useNotificationBadges();
  const colors = useColors();

  useEffect(() => {
    loadUserXP();
    getUnreadReferralCount().then((count) => setBadge("referrals", count));
  }, []);

  const loadUserXP = async () => {
    try {
      const xpData = await getOverallXP(); const totalXP = xpData.totalXP;
      // Approximate weekly XP as recent portion of total
      const weeklyXP = Math.min(totalXP, Math.floor(totalXP * 0.3) + 5);
      setUserWeeklyXP(weeklyXP);
    } catch {}
  };

  const getLeaders = () => {
    switch (activeTab) {
      case "streak": return STREAK_LEADERS;
      case "credits": return CREDITS_LEADERS;
      case "songs": return SONGS_LEADERS;
      case "xp": return XP_LEADERS;
      case "weekly": {
        // Insert real user XP into weekly leaders
        const leaders = WEEKLY_XP_LEADERS.map(l =>
          l.isYou ? { ...l, value: userWeeklyXP } : l
        );
        leaders.sort((a, b) => b.value - a.value);
        return leaders;
      }
    }
  };

  const getUnit = () => TABS.find(t => t.key === activeTab)?.unit || "";

  const leaders = getLeaders();
  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  const getMedalColor = (rank: number) => {
    if (rank === 0) return "#FFD700";
    if (rank === 1) return "#C0C0C0";
    if (rank === 2) return "#CD7F32";
    return Colors.textMuted;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.key);
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? "#fff" : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top 3 Podium */}
        <View style={styles.podium}>
          {/* 2nd place */}
          <View style={styles.podiumSlot}>
            <View style={[styles.podiumAvatarWrap, { borderColor: getMedalColor(1) }]}>
              <Image source={{ uri: top3[1]?.avatar }} style={styles.podiumAvatar} />
            </View>
            <Text style={styles.podiumName}>{top3[1]?.name}</Text>
            <Text style={styles.podiumValue}>{top3[1]?.value} {getUnit()}</Text>
            <View style={[styles.podiumBar, { height: 60, backgroundColor: "#C0C0C0" + "30" }]}>
              <Text style={styles.podiumRank}>2</Text>
            </View>
          </View>

          {/* 1st place */}
          <View style={styles.podiumSlot}>
            <View style={styles.crownWrap}>
              <Text style={styles.crown}>👑</Text>
            </View>
            <View style={[styles.podiumAvatarWrap, styles.podiumAvatarFirst, { borderColor: getMedalColor(0) }]}>
              <Image source={{ uri: top3[0]?.avatar }} style={styles.podiumAvatarBig} />
            </View>
            <Text style={[styles.podiumName, { color: Colors.gold }]}>{top3[0]?.name}</Text>
            <Text style={[styles.podiumValue, { color: Colors.gold }]}>{top3[0]?.value} {getUnit()}</Text>
            <View style={[styles.podiumBar, { height: 80, backgroundColor: Colors.gold + "30" }]}>
              <Text style={[styles.podiumRank, { color: Colors.gold }]}>1</Text>
            </View>
          </View>

          {/* 3rd place */}
          <View style={styles.podiumSlot}>
            <View style={[styles.podiumAvatarWrap, { borderColor: getMedalColor(2) }]}>
              <Image source={{ uri: top3[2]?.avatar }} style={styles.podiumAvatar} />
            </View>
            <Text style={styles.podiumName}>{top3[2]?.name}</Text>
            <Text style={styles.podiumValue}>{top3[2]?.value} {getUnit()}</Text>
            <View style={[styles.podiumBar, { height: 45, backgroundColor: "#CD7F32" + "30" }]}>
              <Text style={styles.podiumRank}>3</Text>
            </View>
          </View>
        </View>

        {/* Rest of the list */}
        <View style={styles.listSection}>
          {rest.map((entry, idx) => (
            <View
              key={entry.id}
              style={[styles.listRow, entry.isYou && styles.listRowYou]}
            >
              <Text style={styles.listRank}>{idx + 4}</Text>
              <Image source={{ uri: entry.avatar }} style={styles.listAvatar} />
              <View style={styles.listInfo}>
                <Text style={[styles.listName, entry.isYou && { color: Colors.secondary }]}>
                  {entry.name} {entry.isYou && "(You)"}
                </Text>
              </View>
              <Text style={[styles.listValue, entry.isYou && { color: Colors.secondary }]}>
                {entry.value.toLocaleString()} {getUnit()}
              </Text>
            </View>
          ))}
        </View>

        {/* Your Stats */}
        <View style={styles.yourStats}>
          <Text style={styles.yourStatsTitle}>Your Position</Text>
          <View style={styles.yourStatsRow}>
            <View style={styles.yourStatItem}>
              <Text style={styles.yourStatValue}>
                #{leaders.findIndex(l => l.isYou) + 1}
              </Text>
              <Text style={styles.yourStatLabel}>Rank</Text>
            </View>
            <View style={styles.yourStatItem}>
              <Text style={styles.yourStatValue}>
                {leaders.find(l => l.isYou)?.value || 0}
              </Text>
              <Text style={styles.yourStatLabel}>{getUnit()}</Text>
            </View>
            <View style={styles.yourStatItem}>
              <Text style={styles.yourStatValue}>Top {Math.round(((leaders.findIndex(l => l.isYou) + 1) / leaders.length) * 100)}%</Text>
              <Text style={styles.yourStatLabel}>Percentile</Text>
            </View>
          </View>
        </View>

        {/* Challenge a Friend */}
        {(activeTab === "weekly" || activeTab === "xp") && (
          <TouchableOpacity
            style={styles.challengeButton}
            activeOpacity={0.8}
            onPress={async () => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              const userEntry = leaders.find(l => l.isYou);
              const userXP = userEntry?.value || 0;
              const message = await buildChallengeMessage(userXP, userXP);
              try {
                await Share.share({
                  message,
                  title: "XP Challenge",
                });
              } catch {}
            }}
          >
            <Ionicons name="people" size={18} color="#fff" />
            <Text style={styles.challengeButtonText}>Challenge a Friend</Text>
          </TouchableOpacity>
        )}

        {/* Referral Dashboard Link */}
        {(activeTab === "weekly" || activeTab === "xp") && (
          <TouchableOpacity
            style={[styles.challengeButton, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginTop: 8 }]}
            activeOpacity={0.8}
            onPress={() => router.push("/referral-dashboard" as any)}
          >
            <Ionicons name="gift" size={18} color={colors.primary} />
            <Text style={[styles.challengeButtonText, { color: colors.primary }]}>Referral Dashboard</Text>
            {badges.referrals > 0 && (
              <View style={{ backgroundColor: "#EF4444", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, marginLeft: 6 }}>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{badges.referrals}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* XP Breakdown */}
        {activeTab === "xp" && (
          <View style={styles.xpBreakdown}>
            <Text style={styles.xpBreakdownTitle}>Your XP Breakdown</Text>
            {XP_BREAKDOWN.map((item) => (
              <View key={item.label} style={styles.xpRow}>
                <View style={[styles.xpIcon, { backgroundColor: item.color + "15" }]}>
                  <Ionicons name={item.icon as any} size={14} color={item.color} />
                </View>
                <Text style={styles.xpLabel}>{item.label}</Text>
                <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill, { width: `${(item.xp / 3200) * 100}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={[styles.xpValue, { color: item.color }]}>{item.xp.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  tabActive: {
    backgroundColor: Colors.secondary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  // Podium
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: 8,
  },
  podiumSlot: {
    flex: 1,
    alignItems: "center",
  },
  crownWrap: {
    marginBottom: -8,
    zIndex: 1,
  },
  crown: {
    fontSize: 24,
  },
  podiumAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  podiumAvatarFirst: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
  },
  podiumAvatar: {
    width: "100%",
    height: "100%",
  },
  podiumAvatarBig: {
    width: "100%",
    height: "100%",
  },
  podiumName: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  podiumValue: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },
  podiumBar: {
    width: "80%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumRank: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: Colors.textSecondary,
  },
  // List
  listSection: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
  },
  listRowYou: {
    backgroundColor: Colors.secondary + "15",
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  listRank: {
    width: 24,
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textMuted,
    textAlign: "center",
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
    marginRight: 10,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  listValue: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  // Your Stats
  yourStats: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  yourStatsTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  yourStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  yourStatItem: {
    alignItems: "center",
  },
  yourStatValue: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.secondary,
  },
  yourStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // XP Breakdown
  xpBreakdown: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  xpBreakdownTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  xpIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  xpLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    width: 65,
    fontWeight: "500",
  },
  xpBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  xpValue: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    width: 44,
    textAlign: "right",
  },
  challengeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  challengeButtonText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "700",
  },
});
