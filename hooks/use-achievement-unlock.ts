/**
 * useAchievementUnlock Hook
 * 
 * Provides achievement unlock detection and toast state management.
 * Wire into any screen that completes gameplay (duels, lessons, challenges)
 * to trigger the confetti/haptic toast when new achievements are unlocked.
 */
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackAchievementUnlocked } from "@/lib/analytics";
import {
  detectNewUnlocks,
  createAchievementToast,
  shouldShowConfetti,
  getUnlockedCount,
  type AchievementUnlockEvent,
  type AchievementToastData,
} from "@/lib/achievement-unlock";

// Achievement stats key (shared with achievements-wall.tsx)
const STATS_KEY = "@linguavibe_achievements_stats";

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

// Build achievements list from stats (mirrors achievements-wall.tsx)
function buildAchievementsList(stats: UserStats) {
  return [
    { id: "first_duel", title: "First Steps", description: "Complete your first pronunciation duel", icon: "⚡", category: "duels" as const, progress: Math.min(stats.duelsPlayed / 1, 1), unlocked: stats.duelsPlayed >= 1 },
    { id: "duel_10", title: "Duel Enthusiast", description: "Complete 10 pronunciation duels", icon: "⚡", category: "duels" as const, tier: "bronze" as const, progress: Math.min(stats.duelsPlayed / 10, 1), unlocked: stats.duelsPlayed >= 10 },
    { id: "duel_50", title: "Duel Warrior", description: "Complete 50 pronunciation duels", icon: "⚡", category: "duels" as const, tier: "silver" as const, progress: Math.min(stats.duelsPlayed / 50, 1), unlocked: stats.duelsPlayed >= 50 },
    { id: "duel_100", title: "Duel Master", description: "Complete 100 pronunciation duels", icon: "⚡", category: "duels" as const, tier: "gold" as const, progress: Math.min(stats.duelsPlayed / 100, 1), unlocked: stats.duelsPlayed >= 100 },
    { id: "duel_500", title: "Duel Legend", description: "Complete 500 pronunciation duels", icon: "⚡", category: "duels" as const, tier: "diamond" as const, progress: Math.min(stats.duelsPlayed / 500, 1), unlocked: stats.duelsPlayed >= 500 },
    { id: "win_streak_5", title: "Hot Streak", description: "Win 5 duels in a row", icon: "🔥", category: "duels" as const, tier: "bronze" as const, progress: Math.min(stats.longestWinStreak / 5, 1), unlocked: stats.longestWinStreak >= 5 },
    { id: "win_streak_10", title: "Unstoppable", description: "Win 10 duels in a row", icon: "🔥", category: "duels" as const, tier: "gold" as const, progress: Math.min(stats.longestWinStreak / 10, 1), unlocked: stats.longestWinStreak >= 10 },
    { id: "perfect_round", title: "Perfect Round", description: "Score 100% on a duel round", icon: "✅", category: "duels" as const, progress: stats.perfectRounds > 0 ? 1 : 0, unlocked: stats.perfectRounds > 0 },
    { id: "streak_3", title: "Getting Started", description: "Maintain a 3-day streak", icon: "🔥", category: "streaks" as const, progress: Math.min(stats.dailyStreak / 3, 1), unlocked: stats.dailyStreak >= 3 },
    { id: "streak_7", title: "Week Warrior", description: "Maintain a 7-day streak", icon: "🔥", category: "streaks" as const, tier: "bronze" as const, progress: Math.min(stats.dailyStreak / 7, 1), unlocked: stats.dailyStreak >= 7 },
    { id: "streak_30", title: "Monthly Master", description: "Maintain a 30-day streak", icon: "🔥", category: "streaks" as const, tier: "silver" as const, progress: Math.min(stats.dailyStreak / 30, 1), unlocked: stats.dailyStreak >= 30 },
    { id: "streak_90", title: "Quarter Champion", description: "Maintain a 90-day streak", icon: "🔥", category: "streaks" as const, tier: "gold" as const, progress: Math.min(stats.dailyStreak / 90, 1), unlocked: stats.dailyStreak >= 90 },
    { id: "streak_365", title: "Year of Dedication", description: "Maintain a 365-day streak", icon: "🔥", category: "streaks" as const, tier: "diamond" as const, progress: Math.min(stats.dailyStreak / 365, 1), unlocked: stats.dailyStreak >= 365 },
    { id: "words_25", title: "Word Collector", description: "Master 25 words", icon: "📚", category: "mastery" as const, tier: "bronze" as const, progress: Math.min(stats.wordsMastered / 25, 1), unlocked: stats.wordsMastered >= 25 },
    { id: "words_100", title: "Vocabulary Builder", description: "Master 100 words", icon: "📚", category: "mastery" as const, tier: "silver" as const, progress: Math.min(stats.wordsMastered / 100, 1), unlocked: stats.wordsMastered >= 100 },
    { id: "words_500", title: "Lexicon Expert", description: "Master 500 words", icon: "📚", category: "mastery" as const, tier: "gold" as const, progress: Math.min(stats.wordsMastered / 500, 1), unlocked: stats.wordsMastered >= 500 },
    { id: "lang_2", title: "Bilingual", description: "Practice in 2 languages", icon: "🌍", category: "mastery" as const, tier: "bronze" as const, progress: Math.min(stats.languagesPracticed / 2, 1), unlocked: stats.languagesPracticed >= 2 },
    { id: "lang_4", title: "Polyglot", description: "Practice in 4 languages", icon: "🌍", category: "mastery" as const, tier: "silver" as const, progress: Math.min(stats.languagesPracticed / 4, 1), unlocked: stats.languagesPracticed >= 4 },
    { id: "lang_7", title: "World Citizen", description: "Practice in all 7 languages", icon: "🌍", category: "mastery" as const, tier: "gold" as const, progress: Math.min(stats.languagesPracticed / 7, 1), unlocked: stats.languagesPracticed >= 7 },
    { id: "share_1", title: "Social Butterfly", description: "Share your first result", icon: "📤", category: "social" as const, progress: Math.min(stats.sharesCount / 1, 1), unlocked: stats.sharesCount >= 1 },
    { id: "share_10", title: "Influencer", description: "Share 10 results", icon: "📤", category: "social" as const, tier: "bronze" as const, progress: Math.min(stats.sharesCount / 10, 1), unlocked: stats.sharesCount >= 10 },
    { id: "challenge_5", title: "Challenger", description: "Send 5 challenges", icon: "✈️", category: "social" as const, tier: "bronze" as const, progress: Math.min(stats.challengesSent / 5, 1), unlocked: stats.challengesSent >= 5 },
    { id: "challenge_25", title: "Rival Maker", description: "Send 25 challenges", icon: "✈️", category: "social" as const, tier: "silver" as const, progress: Math.min(stats.challengesSent / 25, 1), unlocked: stats.challengesSent >= 25 },
    { id: "multiplayer_1", title: "Live Duelist", description: "Complete a live multiplayer duel", icon: "👥", category: "social" as const, progress: Math.min(stats.multiplayerDuels / 1, 1), unlocked: stats.multiplayerDuels >= 1 },
    { id: "multiplayer_10", title: "Arena Fighter", description: "Complete 10 live duels", icon: "👥", category: "social" as const, tier: "silver" as const, progress: Math.min(stats.multiplayerDuels / 10, 1), unlocked: stats.multiplayerDuels >= 10 },
    { id: "first_perfect", title: "Flawless Victory", description: "Get a perfect match score", icon: "💎", category: "milestones" as const, progress: stats.perfectMatches > 0 ? 1 : 0, unlocked: stats.perfectMatches > 0 },
    { id: "tongue_twister", title: "Tongue Twister Master", description: "Complete 10 tongue twister rounds", icon: "🎤", category: "milestones" as const, tier: "bronze" as const, progress: Math.min(stats.tongueTwisterRounds / 10, 1), unlocked: stats.tongueTwisterRounds >= 10 },
    { id: "daily_50", title: "Daily Devotee", description: "Complete 50 daily challenges", icon: "📅", category: "milestones" as const, tier: "gold" as const, progress: Math.min(stats.dailyChallengesCompleted / 50, 1), unlocked: stats.dailyChallengesCompleted >= 50 },
  ];
}

export interface UseAchievementUnlockReturn {
  toastData: AchievementToastData | null;
  checkForUnlocks: () => Promise<AchievementUnlockEvent[]>;
  dismissToast: () => void;
  pendingUnlocks: AchievementUnlockEvent[];
}

/**
 * Hook that checks for newly unlocked achievements and manages toast queue.
 * Call `checkForUnlocks()` after any gameplay event (duel complete, lesson done, etc.)
 */
export function useAchievementUnlock(): UseAchievementUnlockReturn {
  const [toastData, setToastData] = useState<AchievementToastData | null>(null);
  const [pendingUnlocks, setPendingUnlocks] = useState<AchievementUnlockEvent[]>([]);

  const checkForUnlocks = useCallback(async (): Promise<AchievementUnlockEvent[]> => {
    try {
      // Load current stats
      const statsRaw = await AsyncStorage.getItem(STATS_KEY);
      if (!statsRaw) return [];

      const stats: UserStats = JSON.parse(statsRaw);
      const achievements = buildAchievementsList(stats);

      // Detect new unlocks
      const newUnlocks = await detectNewUnlocks(achievements);
      if (newUnlocks.length === 0) return [];

      // Track each unlock in analytics
      for (const unlock of newUnlocks) {
        trackAchievementUnlocked(unlock.id, unlock.tier || "bronze");
      }

      // Queue all unlocks
      setPendingUnlocks(newUnlocks);

      // Show first unlock toast immediately
      const firstUnlock = newUnlocks[0];
      const previousCount = await getUnlockedCount();
      const toast = createAchievementToast(firstUnlock);
      toast.showConfetti = shouldShowConfetti(firstUnlock, previousCount - newUnlocks.length);
      setToastData(toast);

      return newUnlocks;
    } catch {
      return [];
    }
  }, []);

  const dismissToast = useCallback(() => {
    setToastData(null);

    // Show next pending unlock if any
    setPendingUnlocks((prev) => {
      if (prev.length <= 1) return [];
      const remaining = prev.slice(1);
      // Show next toast after a brief delay
      setTimeout(async () => {
        const nextUnlock = remaining[0];
        const previousCount = await getUnlockedCount();
        const toast = createAchievementToast(nextUnlock);
        toast.showConfetti = shouldShowConfetti(nextUnlock, previousCount);
        setToastData(toast);
      }, 500);
      return remaining;
    });
  }, []);

  return { toastData, checkForUnlocks, dismissToast, pendingUnlocks };
}
