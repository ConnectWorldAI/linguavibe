/**
 * Badge Celebration Logic
 * 
 * Detects when a user earns a new streak badge tier and triggers
 * the celebration modal. Tracks which badges have been celebrated
 * to avoid showing the same celebration twice.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateGoalStreak, getStreakBadge, STREAK_BADGES, type StreakBadge } from "@/lib/goal-streak";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CelebrationState {
  celebratedBadges: string[]; // Array of badge titles that have been celebrated
  lastCheckedStreak: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CELEBRATION_KEY = "@badge_celebration_state";

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Get the celebration state from storage.
 */
export async function getCelebrationState(): Promise<CelebrationState> {
  try {
    const raw = await AsyncStorage.getItem(CELEBRATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { celebratedBadges: [], lastCheckedStreak: 0 };
}

/**
 * Save the celebration state.
 */
export async function saveCelebrationState(state: CelebrationState): Promise<void> {
  await AsyncStorage.setItem(CELEBRATION_KEY, JSON.stringify(state));
}

/**
 * Check if there's a new badge to celebrate.
 * Returns the badge if it's newly earned and hasn't been celebrated yet.
 */
export async function checkForNewBadge(): Promise<{
  badge: StreakBadge | null;
  streakWeeks: number;
}> {
  try {
    const streak = await calculateGoalStreak();
    const currentBadge = getStreakBadge(streak.currentStreak);
    const state = await getCelebrationState();

    if (!currentBadge) {
      return { badge: null, streakWeeks: streak.currentStreak };
    }

    // Check if this badge has already been celebrated
    if (state.celebratedBadges.includes(currentBadge.title)) {
      return { badge: null, streakWeeks: streak.currentStreak };
    }

    // New badge! Mark as celebrated
    state.celebratedBadges.push(currentBadge.title);
    state.lastCheckedStreak = streak.currentStreak;
    await saveCelebrationState(state);

    return { badge: currentBadge, streakWeeks: streak.currentStreak };
  } catch {
    return { badge: null, streakWeeks: 0 };
  }
}

/**
 * Mark a specific badge as celebrated (for manual triggering).
 */
export async function markBadgeCelebrated(badgeTitle: string): Promise<void> {
  const state = await getCelebrationState();
  if (!state.celebratedBadges.includes(badgeTitle)) {
    state.celebratedBadges.push(badgeTitle);
    await saveCelebrationState(state);
  }
}

/**
 * Reset celebration state (for testing or if user wants to see celebrations again).
 */
export async function resetCelebrations(): Promise<void> {
  await AsyncStorage.removeItem(CELEBRATION_KEY);
}

/**
 * Get all badges the user has earned (for display purposes).
 */
export async function getEarnedBadges(): Promise<StreakBadge[]> {
  const streak = await calculateGoalStreak();
  return STREAK_BADGES.filter((b) => streak.currentStreak >= b.minStreak);
}

/**
 * Get the next badge the user is working toward.
 */
export async function getNextBadgeProgress(): Promise<{
  nextBadge: StreakBadge | null;
  currentStreak: number;
  weeksNeeded: number;
  progress: number; // 0-1
}> {
  const streak = await calculateGoalStreak();
  const currentBadge = getStreakBadge(streak.currentStreak);

  // Find the next badge
  let nextBadge: StreakBadge | null = null;
  for (const b of STREAK_BADGES) {
    if (streak.currentStreak < b.minStreak) {
      nextBadge = b;
      break;
    }
  }

  if (!nextBadge) {
    return { nextBadge: null, currentStreak: streak.currentStreak, weeksNeeded: 0, progress: 1 };
  }

  const previousMin = currentBadge ? currentBadge.minStreak : 0;
  const range = nextBadge.minStreak - previousMin;
  const progress = range > 0 ? (streak.currentStreak - previousMin) / range : 0;

  return {
    nextBadge,
    currentStreak: streak.currentStreak,
    weeksNeeded: nextBadge.minStreak - streak.currentStreak,
    progress: Math.min(1, Math.max(0, progress)),
  };
}
