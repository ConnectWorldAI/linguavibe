/**
 * Achievements Screen — Grid of collectible badges with locked/unlocked states.
 * Users can browse all available achievements and see their progress.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  ACHIEVEMENTS,
  getAchievementProgress,
  checkAndUnlockAchievements,
  type Achievement,
  type UserStats,
} from "@/lib/achievements";
import { getOverallXP } from "@/lib/exercise-scoring";
import { getPinnedFeatures } from "@/lib/recently-visited";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "xp", label: "XP" },
  { key: "streak", label: "Streak" },
  { key: "sessions", label: "Sessions" },
  { key: "creators", label: "Creators" },
  { key: "special", label: "Special" },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [totalUnlocked, setTotalUnlocked] = useState(0);

  const loadAchievements = useCallback(async () => {
    // Gather current stats
    const xpData = await getOverallXP();
    const pinned = await getPinnedFeatures();

    // Get streak from AsyncStorage
    let currentStreak = 0;
    try {
      const streakData = await AsyncStorage.getItem("@goal_streak_cache");
      if (streakData) {
        const parsed = JSON.parse(streakData);
        currentStreak = parsed.currentStreak || 0;
      }
    } catch {}

    // Get focus sessions count
    let focusSessions = 0;
    try {
      const focusData = await AsyncStorage.getItem("@focus_sessions");
      if (focusData) {
        focusSessions = JSON.parse(focusData).length || 0;
      }
    } catch {}

    const stats: UserStats = {
      totalXP: xpData.totalXP,
      currentStreak,
      totalSessions: xpData.totalSessionsCompleted,
      totalExercises: xpData.totalExercisesCompleted,
      creatorsAttempted: xpData.creatorScores.length,
      focusSessions,
      pinnedFeatures: pinned.length,
    };

    // Check and unlock new achievements
    await checkAndUnlockAchievements(stats);

    // Load progress
    const progress = await getAchievementProgress();
    setUnlockedIds(progress.unlockedIds);
    setTotalUnlocked(progress.unlocked);
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const filteredAchievements = selectedCategory === "all"
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  const renderBadge = ({ item }: { item: Achievement }) => {
    const isUnlocked = unlockedIds.has(item.id);

    return (
      <View style={[styles.badgeCard, {
        backgroundColor: isUnlocked ? item.color + "10" : colors.surface,
        borderColor: isUnlocked ? item.color + "40" : colors.border,
      }]}>
        <View style={[styles.badgeIcon, {
          backgroundColor: isUnlocked ? item.color + "20" : colors.border + "40",
        }]}>
          <Ionicons
            name={item.icon as any}
            size={28}
            color={isUnlocked ? item.color : colors.muted + "60"}
          />
          {!isUnlocked && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={12} color={colors.muted} />
            </View>
          )}
        </View>
        <Text style={[styles.badgeName, {
          color: isUnlocked ? colors.foreground : colors.muted,
        }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.badgeDesc, {
          color: isUnlocked ? colors.muted : colors.muted + "80",
        }]} numberOfLines={2}>
          {item.description}
        </Text>
        {isUnlocked && (
          <View style={[styles.unlockedBadge, { backgroundColor: item.color }]}>
            <Ionicons name="checkmark" size={10} color="#FFF" />
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        renderItem={renderBadge}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                style={[styles.backBtn, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="arrow-back" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Achievements</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Progress Summary */}
            <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.progressRow}>
                <Ionicons name="ribbon" size={24} color={colors.primary} />
                <Text style={[styles.progressText, { color: colors.foreground }]}>
                  {totalUnlocked} / {ACHIEVEMENTS.length} Badges Unlocked
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, {
                  width: `${(totalUnlocked / ACHIEVEMENTS.length) * 100}%`,
                  backgroundColor: colors.primary,
                }]} />
              </View>
            </View>

            {/* Category Filter */}
            <FlatList
              data={CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.filterRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(item.key);
                  }}
                  style={[styles.filterChip, {
                    backgroundColor: selectedCategory === item.key ? colors.primary : colors.surface,
                    borderColor: selectedCategory === item.key ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[styles.filterText, {
                    color: selectedCategory === item.key ? "#FFF" : colors.foreground,
                  }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="ribbon-outline" size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No achievements in this category yet
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  filterRow: {
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badgeCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    position: "relative",
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    position: "relative",
  },
  lockOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 2,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
  },
  unlockedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
