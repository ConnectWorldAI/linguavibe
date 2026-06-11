import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { BadgeUnlockCelebration } from "@/components/badge-unlock-celebration";

const BADGES_KEY = "@connectworld_badges_unlocked";

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  emoji: string;
  category: "learning" | "streaks" | "social" | "milestones";
  requirement: string;
  progress: number; // 0-100
  unlocked: boolean;
  unlockedDate?: string;
  color: string;
}

const ALL_BADGES: Badge[] = [
  // Learning
  { id: "first_call", title: "First Call", description: "Make your first voice call", icon: "call", emoji: "📞", category: "learning", requirement: "1 voice call", progress: 100, unlocked: true, unlockedDate: "2024-01-15", color: Colors.secondary },
  { id: "talk_10", title: "Conversationalist", description: "10 minutes of talk time", icon: "chatbubbles", emoji: "💬", category: "learning", requirement: "10 min talk time", progress: 100, unlocked: true, unlockedDate: "2024-01-18", color: Colors.glow },
  { id: "talk_100", title: "Chatterbox", description: "100 minutes of talk time", icon: "megaphone", emoji: "📢", category: "learning", requirement: "100 min talk time", progress: 45, unlocked: false, color: Colors.secondary },
  { id: "talk_1000", title: "Talk Master", description: "1000 minutes of total talk time", icon: "mic", emoji: "🎙️", category: "learning", requirement: "1000 min talk time", progress: 5, unlocked: false, color: "#8B5CF6" },
  { id: "song_1", title: "First Song", description: "Learn your first song", icon: "musical-note", emoji: "🎵", category: "learning", requirement: "1 song learned", progress: 100, unlocked: true, unlockedDate: "2024-01-16", color: Colors.gold },
  { id: "song_10", title: "Music Enthusiast", description: "Learn 10 songs", icon: "musical-notes", emoji: "🎶", category: "learning", requirement: "10 songs learned", progress: 70, unlocked: false, color: Colors.gold },
  { id: "song_50", title: "Song Master", description: "Learn 50 songs", icon: "disc", emoji: "💿", category: "learning", requirement: "50 songs learned", progress: 14, unlocked: false, color: "#9B59B6" },
  { id: "song_100", title: "Platinum Artist", description: "Learn 100 songs", icon: "trophy", emoji: "🏅", category: "learning", requirement: "100 songs learned", progress: 7, unlocked: false, color: Colors.gold },
  // Streaks
  { id: "streak_3", title: "Getting Started", description: "3-day learning streak", icon: "flame", emoji: "🔥", category: "streaks", requirement: "3-day streak", progress: 100, unlocked: true, unlockedDate: "2024-01-19", color: "#FF6B35" },
  { id: "streak_7", title: "Week Warrior", description: "7-day learning streak", icon: "flame", emoji: "⚡", category: "streaks", requirement: "7-day streak", progress: 57, unlocked: false, color: "#FF6B35" },
  { id: "streak_30", title: "Monthly Master", description: "30-day learning streak", icon: "flame", emoji: "💎", category: "streaks", requirement: "30-day streak", progress: 13, unlocked: false, color: "#E91E63" },
  { id: "streak_100", title: "Century Streak", description: "100-day learning streak", icon: "flame", emoji: "👑", category: "streaks", requirement: "100-day streak", progress: 4, unlocked: false, color: Colors.gold },
  { id: "perfect_1", title: "Perfect Start", description: "First Perfect Day", icon: "star", emoji: "⭐", category: "streaks", requirement: "1 Perfect Day", progress: 100, unlocked: true, unlockedDate: "2024-01-20", color: Colors.gold },
  { id: "perfect_7", title: "Perfect Week", description: "7 Perfect Days total", icon: "star", emoji: "🌟", category: "streaks", requirement: "7 Perfect Days", progress: 28, unlocked: false, color: Colors.gold },
  { id: "perfect_streak_3", title: "Flawless Trio", description: "3 consecutive Perfect Days", icon: "star", emoji: "✨", category: "streaks", requirement: "3-day Perfect streak", progress: 33, unlocked: false, color: "#FFD700" },
  // Social
  { id: "connect_1", title: "First Friend", description: "Connect with your first language partner", icon: "person-add", emoji: "🤝", category: "social", requirement: "1 connection", progress: 100, unlocked: true, unlockedDate: "2024-01-17", color: "#E91E63" },
  { id: "connect_10", title: "Social Butterfly", description: "Connect with 10 language partners", icon: "people", emoji: "🦋", category: "social", requirement: "10 connections", progress: 40, unlocked: false, color: "#E91E63" },
  { id: "referral_1", title: "Ambassador", description: "Refer your first friend", icon: "gift", emoji: "🎁", category: "social", requirement: "1 referral", progress: 0, unlocked: false, color: "#F472B6" },
  { id: "referral_5", title: "Super Ambassador", description: "Refer 5 friends", icon: "gift", emoji: "🌍", category: "social", requirement: "5 referrals", progress: 0, unlocked: false, color: "#F472B6" },
  { id: "congrats_10", title: "Cheerleader", description: "Congratulate friends 10 times", icon: "heart", emoji: "❤️", category: "social", requirement: "10 congratulations", progress: 20, unlocked: false, color: Colors.accent },
  // Milestones
  { id: "credits_100", title: "Credit Collector", description: "Earn 100 credits total", icon: "diamond", emoji: "💰", category: "milestones", requirement: "100 credits earned", progress: 100, unlocked: true, unlockedDate: "2024-01-21", color: Colors.gold },
  { id: "credits_500", title: "Credit Hoarder", description: "Earn 500 credits total", icon: "diamond", emoji: "💎", category: "milestones", requirement: "500 credits earned", progress: 35, unlocked: false, color: Colors.secondary },
  { id: "credits_1000", title: "Credit King", description: "Earn 1000 credits total", icon: "diamond", emoji: "👑", category: "milestones", requirement: "1000 credits earned", progress: 18, unlocked: false, color: Colors.gold },
  { id: "milestone_all", title: "Completionist", description: "Complete all milestones in one day 5 times", icon: "ribbon", emoji: "🏆", category: "milestones", requirement: "5 Perfect Days", progress: 20, unlocked: false, color: "#FFD700" },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "grid" },
  { id: "learning", label: "Learning", icon: "book" },
  { id: "streaks", label: "Streaks", icon: "flame" },
  { id: "social", label: "Social", icon: "people" },
  { id: "milestones", label: "Goals", icon: "trophy" },
];

export default function BadgesScreen() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [badges, setBadges] = useState<Badge[]>(ALL_BADGES);
  const [celebrationBadge, setCelebrationBadge] = useState<{ emoji: string; name: string; description: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    checkForNewUnlocks();
  }, []);

  const checkForNewUnlocks = async () => {
    try {
      const stored = await AsyncStorage.getItem(BADGES_KEY);
      const previouslyUnlocked: string[] = stored ? JSON.parse(stored) : [];
      const currentlyUnlocked = badges.filter(b => b.unlocked).map(b => b.id);
      const newlyUnlocked = currentlyUnlocked.filter(id => !previouslyUnlocked.includes(id));
      if (newlyUnlocked.length > 0) {
        const badge = badges.find(b => b.id === newlyUnlocked[0]);
        if (badge) {
          setTimeout(() => {
            setCelebrationBadge({ emoji: badge.emoji, name: badge.title, description: badge.description });
            setShowCelebration(true);
          }, 500);
        }
        await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(currentlyUnlocked));
      }
    } catch (e) { /* ignore */ }
  };

  const simulateUnlock = (badge: Badge) => {
    if (badge.unlocked) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCelebrationBadge({ emoji: badge.emoji, name: badge.title, description: badge.description });
    setShowCelebration(true);
    setBadges(prev => prev.map(b => b.id === badge.id ? { ...b, unlocked: true, progress: 100, unlockedDate: new Date().toISOString().split("T")[0] } : b));
  };

  const filteredBadges =
    selectedCategory === "all"
      ? badges
      : badges.filter((b) => b.category === selectedCategory);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;

  const renderBadge = ({ item }: { item: Badge }) => (
    <TouchableOpacity
      style={[styles.badgeCard, !item.unlocked && styles.badgeCardLocked]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!item.unlocked && item.progress >= 50) simulateUnlock(item);
      }}
      onLongPress={() => {
        if (!item.unlocked) simulateUnlock(item);
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.badgeIconContainer, { backgroundColor: item.unlocked ? item.color + "22" : "rgba(255,255,255,0.03)" }]}>
        <Text style={[styles.badgeEmoji, !item.unlocked && styles.badgeEmojiLocked]}>
          {item.emoji}
        </Text>
        {!item.unlocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
          </View>
        )}
      </View>
      <Text style={[styles.badgeTitle, !item.unlocked && styles.badgeTitleLocked]} numberOfLines={1}>
        {item.title}
      </Text>
      {item.unlocked ? (
        <Text style={styles.badgeUnlockedDate}>
          {new Date(item.unlockedDate!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </Text>
      ) : (
        <View style={styles.badgeProgressContainer}>
          <View style={styles.badgeProgressBg}>
            <View
              style={[
                styles.badgeProgressFill,
                { width: `${item.progress}%`, backgroundColor: item.color },
              ]}
            />
          </View>
          <Text style={styles.badgeProgressText}>{item.progress}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressCount}>{unlockedCount}</Text>
          <Text style={styles.progressTotal}>/{totalCount}</Text>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Badges Unlocked</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(unlockedCount / totalCount) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressHint}>
            {totalCount - unlockedCount} more to collect!
          </Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        <FlatList
          horizontal
          data={CATEGORIES}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryTab,
                selectedCategory === item.id && styles.categoryTabActive,
              ]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(item.id);
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={14}
                color={selectedCategory === item.id ? "#fff" : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === item.id && styles.categoryTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Badges Grid */}
      <FlatList
        data={filteredBadges}
        renderItem={renderBadge}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.badgeGrid}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.badgeRow}
      />

      {/* Badge Unlock Celebration */}
      <BadgeUnlockCelebration
        visible={showCelebration}
        badge={celebrationBadge}
        onDismiss={() => {
          setShowCelebration(false);
          setCelebrationBadge(null);
        }}
      />
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  progressSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    borderWidth: 2,
    borderColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  progressCount: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.secondary,
  },
  progressTotal: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  progressHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  categoryTabs: {
    marginBottom: Spacing.md,
  },
  categoryList: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryTabActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  categoryTabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: "#fff",
  },
  badgeGrid: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  badgeRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  badgeCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeCardLocked: {
    opacity: 0.7,
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeEmojiLocked: {
    opacity: 0.4,
  },
  lockOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  badgeTitleLocked: {
    color: Colors.textSecondary,
  },
  badgeUnlockedDate: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: "600",
  },
  badgeProgressContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeProgressBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  badgeProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  badgeProgressText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.textMuted,
  },
});
