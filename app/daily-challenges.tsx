import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";

const CHALLENGES_KEY = "@linguavibe_daily_challenges";
const CHALLENGE_HISTORY_KEY = "@linguavibe_challenge_history";

type ChallengeCategory = "translate" | "pronunciation" | "listening" | "vocabulary" | "culture" | "music";
type ChallengeDifficulty = "easy" | "medium" | "hard" | "extreme";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  xpReward: number;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
  color: string;
  timeLimit?: number; // minutes
  bonusXP?: number;
}

const CATEGORY_ICONS: Record<ChallengeCategory, { icon: string; color: string }> = {
  translate: { icon: "language", color: "#3B82F6" },
  pronunciation: { icon: "mic", color: "#8B5CF6" },
  listening: { icon: "headset", color: "#EC4899" },
  vocabulary: { icon: "book", color: "#10B981" },
  culture: { icon: "earth", color: "#F59E0B" },
  music: { icon: "musical-notes", color: "#EF4444" },
};

const DIFFICULTY_CONFIG: Record<ChallengeDifficulty, { label: string; color: string; multiplier: number }> = {
  easy: { label: "Easy", color: "#10B981", multiplier: 1 },
  medium: { label: "Medium", color: "#F59E0B", multiplier: 1.5 },
  hard: { label: "Hard", color: "#EF4444", multiplier: 2 },
  extreme: { label: "Extreme", color: "#8B5CF6", multiplier: 3 },
};

const CHALLENGE_POOL: Omit<Challenge, "id" | "current" | "completed" | "claimed">[] = [
  // Translate challenges
  { title: "Lyric Translator", description: "Translate 5 song lyrics to your target language", category: "translate", difficulty: "easy", xpReward: 50, target: 5, icon: "language", color: "#3B82F6" },
  { title: "Speed Translator", description: "Translate 10 phrases in under 5 minutes", category: "translate", difficulty: "medium", xpReward: 100, target: 10, icon: "flash", color: "#3B82F6", timeLimit: 5 },
  { title: "Slang Master", description: "Correctly translate 3 regional slang phrases", category: "translate", difficulty: "hard", xpReward: 150, target: 3, icon: "flame", color: "#3B82F6" },
  { title: "Paragraph Pro", description: "Translate a full paragraph without errors", category: "translate", difficulty: "extreme", xpReward: 250, target: 1, icon: "document-text", color: "#3B82F6" },

  // Pronunciation challenges
  { title: "Tongue Twister", description: "Record 3 tongue twisters with 80%+ accuracy", category: "pronunciation", difficulty: "medium", xpReward: 100, target: 3, icon: "mic", color: "#8B5CF6" },
  { title: "Perfect Pitch", description: "Score 90%+ on 5 pronunciation drills", category: "pronunciation", difficulty: "hard", xpReward: 150, target: 5, icon: "star", color: "#8B5CF6" },
  { title: "Accent Actor", description: "Mimic 3 different regional accents", category: "pronunciation", difficulty: "extreme", xpReward: 200, target: 3, icon: "people", color: "#8B5CF6" },
  { title: "Sound Check", description: "Practice 10 difficult sounds", category: "pronunciation", difficulty: "easy", xpReward: 50, target: 10, icon: "volume-high", color: "#8B5CF6" },

  // Listening challenges
  { title: "Ear Training", description: "Identify 5 words from audio clips", category: "listening", difficulty: "easy", xpReward: 50, target: 5, icon: "ear", color: "#EC4899" },
  { title: "Song Detective", description: "Identify the language of 3 songs", category: "listening", difficulty: "medium", xpReward: 75, target: 3, icon: "musical-note", color: "#EC4899" },
  { title: "Conversation Catch", description: "Understand 80% of a 2-minute conversation", category: "listening", difficulty: "hard", xpReward: 150, target: 1, icon: "chatbubbles", color: "#EC4899" },

  // Vocabulary challenges
  { title: "Word Collector", description: "Learn 15 new words today", category: "vocabulary", difficulty: "easy", xpReward: 50, target: 15, icon: "book", color: "#10B981" },
  { title: "Flashcard Frenzy", description: "Review 30 flashcards with 85%+ accuracy", category: "vocabulary", difficulty: "medium", xpReward: 100, target: 30, icon: "layers", color: "#10B981" },
  { title: "Word Web", description: "Find 5 synonyms for each of 3 words", category: "vocabulary", difficulty: "hard", xpReward: 150, target: 15, icon: "git-network", color: "#10B981" },
  { title: "Vocab Sprint", description: "Learn 25 words in 10 minutes", category: "vocabulary", difficulty: "extreme", xpReward: 250, target: 25, icon: "rocket", color: "#10B981", timeLimit: 10 },

  // Culture challenges
  { title: "Culture Explorer", description: "Complete 2 cultural discovery exercises", category: "culture", difficulty: "easy", xpReward: 50, target: 2, icon: "earth", color: "#F59E0B" },
  { title: "Festival Scholar", description: "Learn about 3 cultural festivals", category: "culture", difficulty: "medium", xpReward: 100, target: 3, icon: "calendar", color: "#F59E0B" },
  { title: "Food Linguist", description: "Learn food vocabulary from 3 different regions", category: "culture", difficulty: "hard", xpReward: 150, target: 3, icon: "restaurant", color: "#F59E0B" },

  // Music challenges
  { title: "Karaoke Star", description: "Sing along to 3 songs with 70%+ score", category: "music", difficulty: "medium", xpReward: 100, target: 3, icon: "musical-notes", color: "#EF4444" },
  { title: "Lyric Genius", description: "Fill in 20 missing words from song lyrics", category: "music", difficulty: "easy", xpReward: 50, target: 20, icon: "text", color: "#EF4444" },
  { title: "Music Marathon", description: "Listen to 5 songs and identify key phrases", category: "music", difficulty: "hard", xpReward: 150, target: 5, icon: "headset", color: "#EF4444" },
  { title: "Duet Master", description: "Complete a duet with 85%+ pronunciation", category: "music", difficulty: "extreme", xpReward: 300, target: 1, icon: "people-circle", color: "#EF4444", bonusXP: 100 },
];

function pickDailyChallenges(): Challenge[] {
  const shuffled = [...CHALLENGE_POOL].sort(() => Math.random() - 0.5);
  const categories = new Set<ChallengeCategory>();
  const picked: Challenge[] = [];

  for (const c of shuffled) {
    if (picked.length >= 6) break;
    if (categories.size < 4 && categories.has(c.category) && picked.length < 4) continue;
    categories.add(c.category);
    picked.push({
      ...c,
      id: `${c.category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      current: 0,
      completed: false,
      claimed: false,
    });
  }
  return picked;
}

export default function DailyChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | "all">("all");

  const celebrationScale = useSharedValue(0);

  useEffect(() => {
    loadChallenges();
    const timer = setInterval(updateTimeLeft, 60000);
    updateTimeLeft();
    return () => clearInterval(timer);
  }, []);

  const updateTimeLeft = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeLeft(`${hours}h ${minutes}m`);
  };

  const loadChallenges = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHALLENGES_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        if (data.date === today) {
          setChallenges(data.challenges);
          setTotalXP(data.totalXP || 0);
          setStreak(data.streak || 0);
          setLoading(false);
          return;
        }
      }
      // New day — generate fresh challenges
      const fresh = pickDailyChallenges();
      const historyRaw = await AsyncStorage.getItem(CHALLENGE_HISTORY_KEY);
      const history = historyRaw ? JSON.parse(historyRaw) : { streak: 0, lastDate: "" };
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const newStreak = history.lastDate === yesterday.toDateString() ? history.streak : 0;

      setChallenges(fresh);
      setStreak(newStreak);
      setTotalXP(0);
      await saveChallenges(fresh, 0, newStreak);
    } catch (e) {
      setChallenges(pickDailyChallenges());
    }
    setLoading(false);
  };

  const saveChallenges = async (c: Challenge[], xp: number, s: number) => {
    await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify({
      date: new Date().toDateString(),
      challenges: c,
      totalXP: xp,
      streak: s,
    }));
  };

  const simulateProgress = useCallback(async (challengeId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setChallenges(prev => {
      const updated = prev.map(c => {
        if (c.id !== challengeId || c.completed) return c;
        const newCurrent = Math.min(c.current + 1, c.target);
        const completed = newCurrent >= c.target;
        return { ...c, current: newCurrent, completed };
      });
      saveChallenges(updated, totalXP, streak);
      return updated;
    });
  }, [totalXP, streak]);

  const claimReward = useCallback(async (challengeId: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.claimed) return;

    const xpEarned = challenge.xpReward + (challenge.bonusXP || 0);
    const newTotalXP = totalXP + xpEarned;

    setChallenges(prev => {
      const updated = prev.map(c => c.id === challengeId ? { ...c, claimed: true } : c);
      const allClaimed = updated.every(c => c.claimed);

      if (allClaimed) {
        setShowCelebration(true);
        celebrationScale.value = withSequence(
          withSpring(1.2, { damping: 8 }),
          withSpring(1, { damping: 12 })
        );
        const newStreak = streak + 1;
        setStreak(newStreak);
        AsyncStorage.setItem(CHALLENGE_HISTORY_KEY, JSON.stringify({
          streak: newStreak,
          lastDate: new Date().toDateString(),
        }));
        saveChallenges(updated, newTotalXP, newStreak);
      } else {
        saveChallenges(updated, newTotalXP, streak);
      }
      return updated;
    });
    setTotalXP(newTotalXP);
  }, [challenges, totalXP, streak]);

  const completedCount = challenges.filter(c => c.completed).length;
  const claimedCount = challenges.filter(c => c.claimed).length;
  const overallProgress = challenges.length > 0 ? claimedCount / challenges.length : 0;

  const filteredChallenges = selectedCategory === "all"
    ? challenges
    : challenges.filter(c => c.category === selectedCategory);

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading challenges...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Daily Challenges</Text>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={12} color={Colors.gold} />
            <Text style={styles.timerText}>{timeLeft} left</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.streakBadge}
          onPress={() => router.push("/challenge-leaderboard" as any)}
        >
          <Ionicons name="trophy" size={16} color="#FFD700" />
        </TouchableOpacity>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color="#FF6B35" />
          <Text style={styles.streakText}>{streak}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* XP Summary Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.xpCard}>
          <View style={styles.xpRow}>
            <View>
              <Text style={styles.xpLabel}>Today's XP</Text>
              <Text style={styles.xpValue}>{totalXP}</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>{claimedCount}/{challenges.length} Complete</Text>
              <View style={styles.progressBarOuter}>
                <View style={[styles.progressBarInner, { width: `${overallProgress * 100}%` }]} />
              </View>
            </View>
          </View>
          {overallProgress === 1 && (
            <View style={styles.allCompleteBanner}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.allCompleteText}>All challenges complete! +50 bonus XP</Text>
            </View>
          )}
        </Animated.View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContainer}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === "all" && styles.categoryChipActive]}
            onPress={() => setSelectedCategory("all")}
          >
            <Text style={[styles.categoryChipText, selectedCategory === "all" && styles.categoryChipTextActive]}>All</Text>
          </TouchableOpacity>
          {(Object.keys(CATEGORY_ICONS) as ChallengeCategory[]).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && { ...styles.categoryChipActive, backgroundColor: CATEGORY_ICONS[cat].color }]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Ionicons name={CATEGORY_ICONS[cat].icon as any} size={14} color={selectedCategory === cat ? "#fff" : Colors.textSecondary} />
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Challenge Cards */}
        <View style={styles.challengeList}>
          {filteredChallenges.map((challenge, index) => {
            const diffConfig = DIFFICULTY_CONFIG[challenge.difficulty];
            const progress = challenge.target > 0 ? challenge.current / challenge.target : 0;

            return (
              <Animated.View
                key={challenge.id}
                entering={FadeInDown.delay(150 + index * 80)}
                style={[styles.challengeCard, challenge.claimed && styles.challengeCardClaimed]}
              >
                <View style={styles.challengeHeader}>
                  <View style={[styles.challengeIcon, { backgroundColor: challenge.color + "20" }]}>
                    <Ionicons name={challenge.icon as any} size={22} color={challenge.color} />
                  </View>
                  <View style={styles.challengeInfo}>
                    <View style={styles.challengeTitleRow}>
                      <Text style={[styles.challengeTitle, challenge.claimed && styles.challengeTitleClaimed]}>
                        {challenge.title}
                      </Text>
                      <View style={[styles.difficultyBadge, { backgroundColor: diffConfig.color + "20" }]}>
                        <Text style={[styles.difficultyText, { color: diffConfig.color }]}>{diffConfig.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.challengeDescription}>{challenge.description}</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.challengeProgressRow}>
                  <View style={styles.challengeProgressBar}>
                    <View style={[styles.challengeProgressFill, {
                      width: `${progress * 100}%`,
                      backgroundColor: challenge.completed ? Colors.success : challenge.color,
                    }]} />
                  </View>
                  <Text style={styles.challengeProgressText}>
                    {challenge.current}/{challenge.target}
                  </Text>
                </View>

                {/* Reward & Action */}
                <View style={styles.challengeFooter}>
                  <View style={styles.rewardBadge}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.rewardText}>+{challenge.xpReward} XP</Text>
                    {challenge.bonusXP ? (
                      <Text style={styles.bonusText}>+{challenge.bonusXP} bonus</Text>
                    ) : null}
                  </View>
                  {challenge.timeLimit && (
                    <View style={styles.timeLimitBadge}>
                      <Ionicons name="timer-outline" size={12} color={Colors.gold} />
                      <Text style={styles.timeLimitText}>{challenge.timeLimit}m</Text>
                    </View>
                  )}
                  {challenge.claimed ? (
                    <View style={styles.claimedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                      <Text style={styles.claimedText}>Claimed</Text>
                    </View>
                  ) : challenge.completed ? (
                    <TouchableOpacity
                      style={styles.claimButton}
                      onPress={() => claimReward(challenge.id)}
                    >
                      <Text style={styles.claimButtonText}>Claim XP</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.doButton, { backgroundColor: challenge.color + "20" }]}
                      onPress={() => simulateProgress(challenge.id)}
                    >
                      <Text style={[styles.doButtonText, { color: challenge.color }]}>Do It</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Celebration Modal */}
        {showCelebration && (
          <Animated.View style={[styles.celebrationCard, celebrationStyle]}>
            <Text style={styles.celebrationEmoji}>🏆</Text>
            <Text style={styles.celebrationTitle}>All Challenges Complete!</Text>
            <Text style={styles.celebrationSubtitle}>
              You earned {totalXP + 50} XP today. Streak: {streak} days!
            </Text>
            <TouchableOpacity
              style={styles.celebrationButton}
              onPress={() => setShowCelebration(false)}
            >
              <Text style={styles.celebrationButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: Colors.textSecondary, fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backButton: { padding: 8 },
  headerCenter: { flex: 1, marginLeft: 8 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  timerBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  timerText: { fontSize: 12, color: Colors.gold, fontWeight: "600" },
  streakBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,107,53,0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  streakText: { fontSize: 14, fontWeight: "700", color: "#FF6B35" },
  scrollView: { flex: 1 },
  xpCard: { marginHorizontal: Spacing.md, marginTop: Spacing.sm, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  xpRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpLabel: { fontSize: 13, color: Colors.textSecondary },
  xpValue: { fontSize: 32, fontWeight: "800", color: Colors.gold },
  progressInfo: { alignItems: "flex-end" },
  progressLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  progressBarOuter: { width: 120, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  progressBarInner: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 3 },
  allCompleteBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, backgroundColor: "rgba(255,215,0,0.1)", padding: 10, borderRadius: 10 },
  allCompleteText: { fontSize: 13, fontWeight: "600", color: "#FFD700" },
  categoryScroll: { marginTop: Spacing.md },
  categoryContainer: { paddingHorizontal: Spacing.md, gap: 8 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  categoryChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
  categoryChipTextActive: { color: "#fff" },
  challengeList: { paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: 12 },
  challengeCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  challengeCardClaimed: { opacity: 0.6 },
  challengeHeader: { flexDirection: "row", gap: 12 },
  challengeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  challengeInfo: { flex: 1 },
  challengeTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  challengeTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, flex: 1 },
  challengeTitleClaimed: { textDecorationLine: "line-through", color: Colors.textSecondary },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  difficultyText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  challengeDescription: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  challengeProgressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  challengeProgressBar: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  challengeProgressFill: { height: "100%", borderRadius: 3 },
  challengeProgressText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary, minWidth: 36, textAlign: "right" },
  challengeFooter: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 },
  rewardBadge: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  rewardText: { fontSize: 13, fontWeight: "700", color: "#FFD700" },
  bonusText: { fontSize: 11, color: Colors.success, fontWeight: "600" },
  timeLimitBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(245,158,11,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  timeLimitText: { fontSize: 11, color: Colors.gold, fontWeight: "600" },
  claimedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  claimedText: { fontSize: 13, color: Colors.success, fontWeight: "600" },
  claimButton: { backgroundColor: Colors.gold, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  claimButtonText: { fontSize: 13, fontWeight: "700", color: "#000" },
  doButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  doButtonText: { fontSize: 13, fontWeight: "700" },
  celebrationCard: { marginHorizontal: Spacing.md, marginTop: Spacing.lg, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: "center", borderWidth: 2, borderColor: "#FFD700" },
  celebrationEmoji: { fontSize: 48 },
  celebrationTitle: { fontSize: 22, fontWeight: "800", color: Colors.text, marginTop: 8 },
  celebrationSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginTop: 4 },
  celebrationButton: { backgroundColor: Colors.gold, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, marginTop: 16 },
  celebrationButtonText: { fontSize: 16, fontWeight: "700", color: "#000" },
});
