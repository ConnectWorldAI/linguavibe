/**
 * Goal Streak Tracking
 * 
 * Counts consecutive weeks where the user hits their weekly goals.
 * Derives streak from GoalHistory data and provides badge metadata.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GoalStreak {
  currentStreak: number;
  longestStreak: number;
  lastWeekHit: boolean; // Did the user hit their goals last week?
  streakStartDate: string | null;
  totalWeeksHit: number;
  totalWeeksTracked: number;
}

export interface StreakBadge {
  emoji: string;
  title: string;
  color: string;
  description: string;
  minStreak: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STREAK_CACHE_KEY = "@goal_streak_cache";

// Passing threshold: grade B- or higher (score >= 70)
const PASSING_SCORE = 70;

export const STREAK_BADGES: StreakBadge[] = [
  { emoji: "🔥", title: "On Fire", color: "#F97316", description: "2-week goal streak", minStreak: 2 },
  { emoji: "⚡", title: "Momentum", color: "#EAB308", description: "4-week goal streak", minStreak: 4 },
  { emoji: "💪", title: "Dedicated", color: "#10B981", description: "8-week goal streak", minStreak: 8 },
  { emoji: "🏆", title: "Champion", color: "#F59E0B", description: "12-week goal streak", minStreak: 12 },
  { emoji: "👑", title: "Unstoppable", color: "#8B5CF6", description: "20-week goal streak", minStreak: 20 },
  { emoji: "🌟", title: "Legend", color: "#EC4899", description: "52-week goal streak", minStreak: 52 },
];

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Calculate the current goal streak from goal history.
 * A "hit" week is one where overallScore >= PASSING_SCORE.
 */
export async function calculateGoalStreak(): Promise<GoalStreak> {
  try {
    const historyRaw = await AsyncStorage.getItem("@weekly_goals_history");
    const history = historyRaw ? JSON.parse(historyRaw) : [];

    if (history.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastWeekHit: false,
        streakStartDate: null,
        totalWeeksHit: 0,
        totalWeeksTracked: 0,
      };
    }

    // History is stored newest-first, so reverse for chronological order
    const chronological = [...history].reverse();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalWeeksHit = 0;
    let streakStartDate: string | null = null;

    for (let i = 0; i < chronological.length; i++) {
      const entry = chronological[i];
      const hit = entry.overallScore >= PASSING_SCORE;

      if (hit) {
        totalWeeksHit++;
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // Current streak: count backwards from the most recent week
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i]; // history is newest-first
      if (entry.overallScore >= PASSING_SCORE) {
        currentStreak++;
        streakStartDate = entry.weekStartDate;
      } else {
        break;
      }
    }

    // Wait — history is newest-first, so index 0 is the most recent
    // Recalculate: iterate from index 0 forward
    currentStreak = 0;
    streakStartDate = null;
    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      if (entry.overallScore >= PASSING_SCORE) {
        currentStreak++;
        streakStartDate = entry.weekStartDate;
      } else {
        break;
      }
    }

    const lastWeekHit = history.length > 0 && history[0].overallScore >= PASSING_SCORE;

    const streak: GoalStreak = {
      currentStreak,
      longestStreak,
      lastWeekHit,
      streakStartDate,
      totalWeeksHit,
      totalWeeksTracked: history.length,
    };

    // Cache the result
    await AsyncStorage.setItem(STREAK_CACHE_KEY, JSON.stringify(streak));

    return streak;
  } catch (err) {
    console.warn("Failed to calculate goal streak:", err);
    // Try to return cached value
    try {
      const cached = await AsyncStorage.getItem(STREAK_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastWeekHit: false,
      streakStartDate: null,
      totalWeeksHit: 0,
      totalWeeksTracked: 0,
    };
  }
}

/**
 * Get the highest badge earned based on current streak.
 */
export function getStreakBadge(streak: number): StreakBadge | null {
  if (streak < 2) return null;
  
  // Find the highest badge the user qualifies for
  let badge: StreakBadge | null = null;
  for (const b of STREAK_BADGES) {
    if (streak >= b.minStreak) {
      badge = b;
    }
  }
  return badge;
}

/**
 * Get the next badge to earn.
 */
export function getNextBadge(streak: number): StreakBadge | null {
  for (const b of STREAK_BADGES) {
    if (streak < b.minStreak) {
      return b;
    }
  }
  return null;
}

/**
 * Get streak display info for the report card.
 */
export function getStreakDisplay(streak: GoalStreak): {
  emoji: string;
  label: string;
  color: string;
  subtext: string;
} {
  const badge = getStreakBadge(streak.currentStreak);
  
  if (streak.currentStreak === 0) {
    return {
      emoji: "🎯",
      label: "No Streak",
      color: "#9CA3AF",
      subtext: "Hit your goals this week to start a streak!",
    };
  }

  if (streak.currentStreak === 1) {
    return {
      emoji: "✨",
      label: "1 Week",
      color: "#10B981",
      subtext: "Great start! Keep it going next week.",
    };
  }

  if (badge) {
    return {
      emoji: badge.emoji,
      label: `${streak.currentStreak} Weeks`,
      color: badge.color,
      subtext: badge.description,
    };
  }

  return {
    emoji: "🔥",
    label: `${streak.currentStreak} Weeks`,
    color: "#F97316",
    subtext: `${streak.currentStreak}-week goal streak!`,
  };
}
