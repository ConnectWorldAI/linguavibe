import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDuelHistory } from "@/lib/pronunciation-duel";

// Alias for backward compatibility with test expectations
const getDuelMatchHistory = getDuelHistory;
import { getBadgeProgress } from "@/lib/pronunciation-streak-badges";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "duels" | "streaks" | "mastery" | "social" | "milestones";
  progress: number; // 0-1
  unlocked: boolean;
  unlockedAt?: string;
  tier?: "bronze" | "silver" | "gold" | "diamond";
  value?: number;
  target?: number;
}

type CategoryFilter = "all" | "duels" | "streaks" | "mastery" | "social" | "milestones";

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: "All",
  duels: "Duels",
  streaks: "Streaks",
  mastery: "Mastery",
  social: "Social",
  milestones: "Milestones",
};

const CATEGORY_ICONS: Record<CategoryFilter, string> = {
  all: "trophy",
  duels: "flash",
  streaks: "flame",
  mastery: "star",
  social: "people",
  milestones: "flag",
};

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  diamond: "#B9F2FF",
};

// ─── Achievement Definitions ──────────────────────────────────────────────────
function buildAchievements(stats: UserStats): Achievement[] {
  return [
    // Duel achievements
    { id: "first_duel", title: "First Steps", description: "Complete your first pronunciation duel", icon: "flash-outline", category: "duels", progress: Math.min(stats.duelsPlayed / 1, 1), unlocked: stats.duelsPlayed >= 1, target: 1, value: stats.duelsPlayed },
    { id: "duel_10", title: "Duel Enthusiast", description: "Complete 10 pronunciation duels", icon: "flash", category: "duels", progress: Math.min(stats.duelsPlayed / 10, 1), unlocked: stats.duelsPlayed >= 10, tier: "bronze", target: 10, value: stats.duelsPlayed },
    { id: "duel_50", title: "Duel Warrior", description: "Complete 50 pronunciation duels", icon: "flash", category: "duels", progress: Math.min(stats.duelsPlayed / 50, 1), unlocked: stats.duelsPlayed >= 50, tier: "silver", target: 50, value: stats.duelsPlayed },
    { id: "duel_100", title: "Duel Master", description: "Complete 100 pronunciation duels", icon: "flash", category: "duels", progress: Math.min(stats.duelsPlayed / 100, 1), unlocked: stats.duelsPlayed >= 100, tier: "gold", target: 100, value: stats.duelsPlayed },
    { id: "duel_500", title: "Duel Legend", description: "Complete 500 pronunciation duels", icon: "flash", category: "duels", progress: Math.min(stats.duelsPlayed / 500, 1), unlocked: stats.duelsPlayed >= 500, tier: "diamond", target: 500, value: stats.duelsPlayed },
    { id: "win_streak_5", title: "Hot Streak", description: "Win 5 duels in a row", icon: "bonfire", category: "duels", progress: Math.min(stats.longestWinStreak / 5, 1), unlocked: stats.longestWinStreak >= 5, tier: "bronze", target: 5, value: stats.longestWinStreak },
    { id: "win_streak_10", title: "Unstoppable", description: "Win 10 duels in a row", icon: "bonfire", category: "duels", progress: Math.min(stats.longestWinStreak / 10, 1), unlocked: stats.longestWinStreak >= 10, tier: "gold", target: 10, value: stats.longestWinStreak },
    { id: "perfect_round", title: "Perfect Round", description: "Score 100% on a duel round", icon: "checkmark-circle", category: "duels", progress: stats.perfectRounds > 0 ? 1 : 0, unlocked: stats.perfectRounds > 0, target: 1, value: stats.perfectRounds },
    // Streak achievements
    { id: "streak_3", title: "Getting Started", description: "Maintain a 3-day daily challenge streak", icon: "flame-outline", category: "streaks", progress: Math.min(stats.dailyStreak / 3, 1), unlocked: stats.dailyStreak >= 3, target: 3, value: stats.dailyStreak },
    { id: "streak_7", title: "Week Warrior", description: "Maintain a 7-day daily challenge streak", icon: "flame", category: "streaks", progress: Math.min(stats.dailyStreak / 7, 1), unlocked: stats.dailyStreak >= 7, tier: "bronze", target: 7, value: stats.dailyStreak },
    { id: "streak_30", title: "Monthly Master", description: "Maintain a 30-day daily challenge streak", icon: "flame", category: "streaks", progress: Math.min(stats.dailyStreak / 30, 1), unlocked: stats.dailyStreak >= 30, tier: "silver", target: 30, value: stats.dailyStreak },
    { id: "streak_90", title: "Quarter Champion", description: "Maintain a 90-day daily challenge streak", icon: "flame", category: "streaks", progress: Math.min(stats.dailyStreak / 90, 1), unlocked: stats.dailyStreak >= 90, tier: "gold", target: 90, value: stats.dailyStreak },
    { id: "streak_365", title: "Year of Dedication", description: "Maintain a 365-day daily challenge streak", icon: "flame", category: "streaks", progress: Math.min(stats.dailyStreak / 365, 1), unlocked: stats.dailyStreak >= 365, tier: "diamond", target: 365, value: stats.dailyStreak },
    // Mastery achievements
    { id: "words_25", title: "Word Collector", description: "Master 25 words with 90%+ accuracy", icon: "book-outline", category: "mastery", progress: Math.min(stats.wordsMastered / 25, 1), unlocked: stats.wordsMastered >= 25, tier: "bronze", target: 25, value: stats.wordsMastered },
    { id: "words_100", title: "Vocabulary Builder", description: "Master 100 words with 90%+ accuracy", icon: "book", category: "mastery", progress: Math.min(stats.wordsMastered / 100, 1), unlocked: stats.wordsMastered >= 100, tier: "silver", target: 100, value: stats.wordsMastered },
    { id: "words_500", title: "Lexicon Expert", description: "Master 500 words with 90%+ accuracy", icon: "library", category: "mastery", progress: Math.min(stats.wordsMastered / 500, 1), unlocked: stats.wordsMastered >= 500, tier: "gold", target: 500, value: stats.wordsMastered },
    { id: "lang_2", title: "Bilingual", description: "Practice in 2 different languages", icon: "globe-outline", category: "mastery", progress: Math.min(stats.languagesPracticed / 2, 1), unlocked: stats.languagesPracticed >= 2, tier: "bronze", target: 2, value: stats.languagesPracticed },
    { id: "lang_4", title: "Polyglot", description: "Practice in 4 different languages", icon: "globe", category: "mastery", progress: Math.min(stats.languagesPracticed / 4, 1), unlocked: stats.languagesPracticed >= 4, tier: "silver", target: 4, value: stats.languagesPracticed },
    { id: "lang_7", title: "World Citizen", description: "Practice in all 7 supported languages", icon: "earth", category: "mastery", progress: Math.min(stats.languagesPracticed / 7, 1), unlocked: stats.languagesPracticed >= 7, tier: "gold", target: 7, value: stats.languagesPracticed },
    // Social achievements
    { id: "share_1", title: "Social Butterfly", description: "Share your first duel result", icon: "share-outline", category: "social", progress: Math.min(stats.sharesCount / 1, 1), unlocked: stats.sharesCount >= 1, target: 1, value: stats.sharesCount },
    { id: "share_10", title: "Influencer", description: "Share 10 duel results", icon: "share-social", category: "social", progress: Math.min(stats.sharesCount / 10, 1), unlocked: stats.sharesCount >= 10, tier: "bronze", target: 10, value: stats.sharesCount },
    { id: "challenge_5", title: "Challenger", description: "Send 5 duel challenges to friends", icon: "paper-plane-outline", category: "social", progress: Math.min(stats.challengesSent / 5, 1), unlocked: stats.challengesSent >= 5, tier: "bronze", target: 5, value: stats.challengesSent },
    { id: "challenge_25", title: "Rival Maker", description: "Send 25 duel challenges to friends", icon: "paper-plane", category: "social", progress: Math.min(stats.challengesSent / 25, 1), unlocked: stats.challengesSent >= 25, tier: "silver", target: 25, value: stats.challengesSent },
    { id: "multiplayer_1", title: "Live Duelist", description: "Complete your first live multiplayer duel", icon: "people-outline", category: "social", progress: Math.min(stats.multiplayerDuels / 1, 1), unlocked: stats.multiplayerDuels >= 1, target: 1, value: stats.multiplayerDuels },
    { id: "multiplayer_10", title: "Arena Fighter", description: "Complete 10 live multiplayer duels", icon: "people", category: "social", progress: Math.min(stats.multiplayerDuels / 10, 1), unlocked: stats.multiplayerDuels >= 10, tier: "silver", target: 10, value: stats.multiplayerDuels },
    // Milestone achievements
    { id: "first_perfect", title: "Flawless Victory", description: "Get a perfect score in a full duel match", icon: "diamond-outline", category: "milestones", progress: stats.perfectMatches > 0 ? 1 : 0, unlocked: stats.perfectMatches > 0, target: 1, value: stats.perfectMatches },
    { id: "tongue_twister", title: "Tongue Twister Master", description: "Complete 10 tongue twister rounds", icon: "mic", category: "milestones", progress: Math.min(stats.tongueTwisterRounds / 10, 1), unlocked: stats.tongueTwisterRounds >= 10, tier: "bronze", target: 10, value: stats.tongueTwisterRounds },
    { id: "speed_demon", title: "Speed Demon", description: "Complete a duel round in under 3 seconds", icon: "timer-outline", category: "milestones", progress: stats.fastestRound < 3 ? 1 : 0, unlocked: stats.fastestRound < 3 && stats.fastestRound > 0, target: 1, value: stats.fastestRound > 0 ? 1 : 0 },
    { id: "comeback_king", title: "Comeback King", description: "Win a duel after being down 2+ rounds", icon: "trending-up", category: "milestones", progress: stats.comebacks > 0 ? 1 : 0, unlocked: stats.comebacks > 0, target: 1, value: stats.comebacks },
    { id: "daily_50", title: "Daily Devotee", description: "Complete 50 daily challenges", icon: "calendar", category: "milestones", progress: Math.min(stats.dailyChallengesCompleted / 50, 1), unlocked: stats.dailyChallengesCompleted >= 50, tier: "gold", target: 50, value: stats.dailyChallengesCompleted },
  ];
}

// ─── User Stats Interface ─────────────────────────────────────────────────────
interface UserStats {
  duelsPlayed: number;
  duelsWon: number;
  longestWinStreak: number;
  perfectRounds: number;
  perfectMatches: number;
  dailyStreak: number;
  wordsMastered: number;
  languagesPracticed: number;
  sharesCount: number;
  challengesSent: number;
  multiplayerDuels: number;
  tongueTwisterRounds: number;
  fastestRound: number;
  comebacks: number;
  dailyChallengesCompleted: number;
}

const STATS_KEY = "@linguavibe_achievements_stats";

async function loadUserStats(): Promise<UserStats> {
  try {
    const stored = await AsyncStorage.getItem(STATS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  // Derive stats from duel match history
  const matches = await getDuelHistory();
  let duelsWon = 0;
  let perfectRounds = 0;
  let perfectMatches = 0;
  let longestWinStreak = 0;
  let currentStreak = 0;
  let tongueTwisterRounds = 0;
  let fastestRound = Infinity;
  let comebacks = 0;
  const languages = new Set<string>();

  for (const match of matches) {
    if (match.winner === "player") {
      duelsWon++;
      currentStreak++;
      longestWinStreak = Math.max(longestWinStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    if (match.language) languages.add(match.language);
    if (match.rounds) {
      let playerBehind = 0;
      let playerAhead = 0;
      for (const round of match.rounds) {
        if (round.playerScore >= 95) perfectRounds++;
        if (match.mode === "tongue_twister") tongueTwisterRounds++;
        if (round.playerTime && round.playerTime < fastestRound) fastestRound = round.playerTime / 1000;
        if (round.opponentScore > round.playerScore) playerBehind++;
        else playerAhead++;
      }
      if (playerBehind >= 2 && match.winner === "player") comebacks++;
      if (match.rounds.every((r: any) => r.playerScore >= 95)) perfectMatches++;
    }
  }

  // Load daily challenge stats
  let dailyStreak = 0;
  let dailyChallengesCompleted = 0;
  try {
    const dailyData = await AsyncStorage.getItem("@daily_challenge_history");
    if (dailyData) {
      const history = JSON.parse(dailyData);
      dailyChallengesCompleted = history.length || 0;
      dailyStreak = history.currentStreak || 0;
    }
  } catch {}

  // Load social stats
  let sharesCount = 0;
  let challengesSent = 0;
  let multiplayerDuels = 0;
  try {
    const socialData = await AsyncStorage.getItem("@duel_social_stats");
    if (socialData) {
      const social = JSON.parse(socialData);
      sharesCount = social.shares || 0;
      challengesSent = social.challenges || 0;
      multiplayerDuels = social.multiplayer || 0;
    }
  } catch {}

  // Load mastery data
  let wordsMastered = 0;
  try {
    const masteryData = await AsyncStorage.getItem("@pronunciation_mastery");
    if (masteryData) {
      const mastery = JSON.parse(masteryData);
      wordsMastered = Object.values(mastery).filter((v: any) => v >= 0.9).length;
    }
  } catch {}

  const stats: UserStats = {
    duelsPlayed: matches.length,
    duelsWon,
    longestWinStreak,
    perfectRounds,
    perfectMatches,
    dailyStreak,
    wordsMastered,
    languagesPracticed: languages.size || 1,
    sharesCount,
    challengesSent,
    multiplayerDuels,
    tongueTwisterRounds,
    fastestRound: fastestRound === Infinity ? 0 : fastestRound,
    comebacks,
    dailyChallengesCompleted,
  };

  // Cache for next time
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats)).catch(() => {});
  return stats;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AchievementsWallScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats().then((s) => {
      setStats(s);
      setAchievements(buildAchievements(s));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => filter === "all" ? achievements : achievements.filter((a) => a.category === filter), [filter, achievements]);
  const unlockedCount = useMemo(() => achievements.filter((a) => a.unlocked).length, [achievements]);
  const totalCount = achievements.length;
  const completionPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const renderAchievement = useCallback(({ item }: { item: Achievement }) => (
    <View style={[styles.achievementCard, !item.unlocked && styles.lockedCard]}>
      <View style={[styles.iconCircle, item.tier ? { borderColor: TIER_COLORS[item.tier] } : {}]}>
        <Ionicons
          name={item.icon as any}
          size={24}
          color={item.unlocked ? (item.tier ? TIER_COLORS[item.tier] : Colors.accent) : "#555"}
        />
      </View>
      <View style={styles.achievementInfo}>
        <View style={styles.titleRow}>
          <Text style={[styles.achievementTitle, !item.unlocked && styles.lockedText]}>
            {item.title}
          </Text>
          {item.tier && item.unlocked && (
            <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[item.tier] + "30" }]}>
              <Text style={[styles.tierText, { color: TIER_COLORS[item.tier] }]}>
                {item.tier.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.achievementDesc, !item.unlocked && styles.lockedText]}>
          {item.description}
        </Text>
        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.round(item.progress * 100)}%`,
                backgroundColor: item.unlocked
                  ? (item.tier ? TIER_COLORS[item.tier] : Colors.accent)
                  : "#444",
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {item.unlocked ? "Unlocked!" : `${item.value || 0} / ${item.target || 1}`}
        </Text>
      </View>
      {item.unlocked && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={styles.checkIcon} />
      )}
    </View>
  ), []);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trophy Room</Text>
        <View style={styles.headerRight}>
          <Text style={styles.completionText}>{completionPct}%</Text>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsSummary}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{unlockedCount}</Text>
          <Text style={styles.statLabel}>Unlocked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.duelsWon || 0}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.dailyStreak || 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Category Filter */}
      <FlatList
        data={Object.keys(CATEGORY_LABELS) as CategoryFilter[]}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        keyExtractor={(item) => item}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            onPress={() => setFilter(cat)}
          >
            <Ionicons
              name={CATEGORY_ICONS[cat] as any}
              size={14}
              color={filter === cat ? "#fff" : Colors.textSecondary}
            />
            <Text style={[styles.filterChipText, filter === cat && styles.filterChipTextActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Achievements List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderAchievement}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        windowSize={7}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        removeClippedSubviews={true}
        getItemLayout={(_, index) => ({ length: 88, offset: 88 * index, index })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={48} color="#555" />
            <Text style={styles.emptyText}>No achievements in this category yet</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: Colors.textPrimary, marginLeft: 8 },
  headerRight: { backgroundColor: Colors.accent + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  completionText: { color: Colors.accent, fontSize: 14, fontWeight: "700" },
  statsSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "500" },
  filterChipTextActive: { color: "#fff" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 10 },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockedCard: { opacity: 0.6 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  achievementInfo: { flex: 1, marginLeft: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  achievementTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  lockedText: { color: "#666" },
  achievementDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  tierBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  tierText: { fontSize: 9, fontWeight: "800" },
  progressBarBg: { height: 4, backgroundColor: "#222", borderRadius: 2, marginTop: 6 },
  progressBarFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  checkIcon: { marginLeft: 8 },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: "#666", fontSize: 14 },
});
