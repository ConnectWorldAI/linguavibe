import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const BATTLE_TYPES = [
  {
    id: "speed",
    title: "Speed Translation",
    description: "Translate phrases faster than your opponent",
    icon: "⚡",
    players: "1v1",
    duration: "2 min",
    xpReward: 100,
  },
  {
    id: "pronunciation",
    title: "Pronunciation Face-Off",
    description: "AI judges who pronounces it better",
    icon: "🎤",
    players: "1v1",
    duration: "3 min",
    xpReward: 150,
  },
  {
    id: "vocab",
    title: "Vocabulary Blitz",
    description: "Name as many words in a category as possible",
    icon: "📚",
    players: "1v1 or Team",
    duration: "1 min",
    xpReward: 80,
  },
  {
    id: "listening",
    title: "Listening Race",
    description: "Listen to a clip and answer first",
    icon: "👂",
    players: "1v1",
    duration: "5 min",
    xpReward: 120,
  },
  {
    id: "slang",
    title: "Slang Showdown",
    description: "Guess the meaning of regional slang phrases",
    icon: "🔥",
    players: "1v1 or Team",
    duration: "3 min",
    xpReward: 130,
  },
  {
    id: "song",
    title: "Song Lyric Challenge",
    description: "Fill in the missing translated lyrics",
    icon: "🎵",
    players: "1v1",
    duration: "4 min",
    xpReward: 140,
  },
];

const LEADERBOARD = [
  { rank: 1, name: "Maria G.", xp: 12450, flag: "🇨🇴", wins: 89 },
  { rank: 2, name: "James K.", xp: 11200, flag: "🇺🇸", wins: 76 },
  { rank: 3, name: "Yuki T.", xp: 10800, flag: "🇯🇵", wins: 72 },
  { rank: 4, name: "Ahmed R.", xp: 9500, flag: "🇪🇬", wins: 65 },
  { rank: 5, name: "You", xp: 8900, flag: "🇺🇸", wins: 58 },
  { rank: 6, name: "Sarah L.", xp: 8200, flag: "🇬🇧", wins: 54 },
  { rank: 7, name: "Chen W.", xp: 7800, flag: "🇨🇳", wins: 51 },
];

export default function BattleModeScreen() {
  const [tab, setTab] = useState<"battles" | "leaderboard">("battles");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Battle Mode</Text>
        <View style={styles.winsChip}>
          <Text style={styles.winsEmoji}>🏆</Text>
          <Text style={styles.winsText}>58 wins</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "battles" && styles.tabActive]}
          onPress={() => setTab("battles")}
        >
          <Text style={[styles.tabText, tab === "battles" && styles.tabTextActive]}>
            Battle
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "leaderboard" && styles.tabActive]}
          onPress={() => setTab("leaderboard")}
        >
          <Text style={[styles.tabText, tab === "leaderboard" && styles.tabTextActive]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === "battles" && (
          <View style={styles.content}>
            {/* Quick Match */}
            <TouchableOpacity style={styles.quickMatchCard}>
              <View style={styles.quickMatchIcon}>
                <Text style={{ fontSize: 32 }}>⚔️</Text>
              </View>
              <Text style={styles.quickMatchTitle}>Quick Match</Text>
              <Text style={styles.quickMatchSubtitle}>
                Find a random opponent at your level
              </Text>
              <View style={styles.quickMatchButton}>
                <Text style={styles.quickMatchButtonText}>Find Opponent</Text>
              </View>
              <Text style={styles.quickMatchOnline}>
                247 players online now
              </Text>
            </TouchableOpacity>

            {/* Battle Types */}
            <Text style={styles.sectionTitle}>Choose Battle Type</Text>
            {BATTLE_TYPES.map((battle) => (
              <TouchableOpacity key={battle.id} style={styles.battleCard}>
                <Text style={styles.battleIcon}>{battle.icon}</Text>
                <View style={styles.battleInfo}>
                  <Text style={styles.battleTitle}>{battle.title}</Text>
                  <Text style={styles.battleDescription}>{battle.description}</Text>
                  <View style={styles.battleMeta}>
                    <View style={styles.battleMetaItem}>
                      <Ionicons name="people" size={12} color={Colors.textSecondary} />
                      <Text style={styles.battleMetaText}>{battle.players}</Text>
                    </View>
                    <View style={styles.battleMetaItem}>
                      <Ionicons name="time" size={12} color={Colors.textSecondary} />
                      <Text style={styles.battleMetaText}>{battle.duration}</Text>
                    </View>
                    <View style={styles.battleMetaItem}>
                      <Ionicons name="star" size={12} color={Colors.warning} />
                      <Text style={styles.battleMetaXp}>+{battle.xpReward} XP</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}

            {/* Weekly Challenge */}
            <View style={styles.weeklyChallenge}>
              <View style={styles.weeklyChallengeHeader}>
                <Text style={styles.weeklyChallengeEmoji}>🏅</Text>
                <Text style={styles.weeklyChallengeTitle}>Weekly Challenge</Text>
              </View>
              <Text style={styles.weeklyChallengeDesc}>
                Win 10 battles this week to earn the "Language Warrior" badge and 500 bonus XP
              </Text>
              <View style={styles.weeklyChallengeProgress}>
                <View style={styles.weeklyChallengeBar}>
                  <View style={[styles.weeklyChallengeBarFill, { width: "60%" }]} />
                </View>
                <Text style={styles.weeklyChallengeCount}>6/10 wins</Text>
              </View>
            </View>
          </View>
        )}

        {tab === "leaderboard" && (
          <View style={styles.content}>
            {/* Top 3 Podium */}
            <View style={styles.podium}>
              {/* 2nd Place */}
              <View style={styles.podiumItem}>
                <Text style={styles.podiumAvatar}>{LEADERBOARD[1].flag}</Text>
                <Text style={styles.podiumName}>{LEADERBOARD[1].name}</Text>
                <View style={[styles.podiumBar, { height: 60, backgroundColor: Colors.textSecondary + "30" }]}>
                  <Text style={styles.podiumRank}>2</Text>
                </View>
              </View>
              {/* 1st Place */}
              <View style={styles.podiumItem}>
                <Text style={styles.podiumCrown}>👑</Text>
                <Text style={styles.podiumAvatar}>{LEADERBOARD[0].flag}</Text>
                <Text style={styles.podiumName}>{LEADERBOARD[0].name}</Text>
                <View style={[styles.podiumBar, { height: 80, backgroundColor: Colors.warning + "30" }]}>
                  <Text style={styles.podiumRank}>1</Text>
                </View>
              </View>
              {/* 3rd Place */}
              <View style={styles.podiumItem}>
                <Text style={styles.podiumAvatar}>{LEADERBOARD[2].flag}</Text>
                <Text style={styles.podiumName}>{LEADERBOARD[2].name}</Text>
                <View style={[styles.podiumBar, { height: 45, backgroundColor: Colors.warning + "15" }]}>
                  <Text style={styles.podiumRank}>3</Text>
                </View>
              </View>
            </View>

            {/* Full Leaderboard */}
            {LEADERBOARD.slice(3).map((player) => (
              <View
                key={player.rank}
                style={[
                  styles.leaderboardRow,
                  player.name === "You" && styles.leaderboardRowSelf,
                ]}
              >
                <Text style={styles.leaderboardRank}>#{player.rank}</Text>
                <Text style={styles.leaderboardFlag}>{player.flag}</Text>
                <Text style={[
                  styles.leaderboardName,
                  player.name === "You" && styles.leaderboardNameSelf,
                ]}>
                  {player.name}
                </Text>
                <View style={styles.leaderboardStats}>
                  <Text style={styles.leaderboardWins}>{player.wins} wins</Text>
                  <Text style={styles.leaderboardXp}>{player.xp.toLocaleString()} XP</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  winsChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  winsEmoji: {
    fontSize: 14,
  },
  winsText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.warning,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
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
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  quickMatchCard: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  quickMatchIcon: {
    marginBottom: Spacing.md,
  },
  quickMatchTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  quickMatchSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  quickMatchButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  quickMatchButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  quickMatchOnline: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  battleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  battleIcon: {
    fontSize: 28,
  },
  battleInfo: {
    flex: 1,
  },
  battleTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  battleDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  battleMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  battleMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  battleMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  battleMetaXp: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: "600",
  },
  weeklyChallenge: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  weeklyChallengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  weeklyChallengeEmoji: {
    fontSize: 20,
  },
  weeklyChallengeTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.warning,
  },
  weeklyChallengeDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  weeklyChallengeProgress: {
    gap: 6,
  },
  weeklyChallengeBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  weeklyChallengeBarFill: {
    height: "100%",
    backgroundColor: Colors.warning,
    borderRadius: 4,
  },
  weeklyChallengeCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  podiumItem: {
    alignItems: "center",
    flex: 1,
  },
  podiumCrown: {
    fontSize: 20,
    marginBottom: 4,
  },
  podiumAvatar: {
    fontSize: 28,
    marginBottom: 4,
  },
  podiumName: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  podiumBar: {
    width: "80%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumRank: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: 10,
  },
  leaderboardRowSelf: {
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  leaderboardRank: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    width: 30,
  },
  leaderboardFlag: {
    fontSize: 20,
  },
  leaderboardName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  leaderboardNameSelf: {
    color: Colors.secondary,
  },
  leaderboardStats: {
    alignItems: "flex-end",
  },
  leaderboardWins: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  leaderboardXp: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
