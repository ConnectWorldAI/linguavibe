/**
 * Achievement Unlock Detection & Toast System
 * 
 * Detects newly unlocked achievements by comparing current state
 * against previously stored unlock IDs. Triggers confetti/haptic
 * celebration and a toast notification linking to the trophy room.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AchievementUnlockEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier?: "bronze" | "silver" | "gold" | "diamond";
  category: "duels" | "streaks" | "mastery" | "social" | "milestones";
  unlockedAt: string;
}

export interface AchievementToastData {
  achievement: AchievementUnlockEvent;
  showConfetti: boolean;
  navigateTo: string;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const UNLOCKED_IDS_KEY = "@achievements_unlocked_ids";
const UNLOCK_HISTORY_KEY = "@achievements_unlock_history";
const WEEKLY_UNLOCKS_KEY = "@achievements_weekly_unlocks";

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Get previously stored unlocked achievement IDs
 */
export async function getUnlockedAchievementIds(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(UNLOCKED_IDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save current unlocked achievement IDs
 */
export async function saveUnlockedAchievementIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(UNLOCKED_IDS_KEY, JSON.stringify(ids));
}

/**
 * Detect newly unlocked achievements by comparing current vs stored state
 * Returns array of newly unlocked achievement events
 */
export async function detectNewUnlocks(
  currentAchievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    tier?: "bronze" | "silver" | "gold" | "diamond";
    category: "duels" | "streaks" | "mastery" | "social" | "milestones";
    unlocked: boolean;
  }>
): Promise<AchievementUnlockEvent[]> {
  const previousIds = await getUnlockedAchievementIds();
  const currentUnlockedIds = currentAchievements
    .filter((a) => a.unlocked)
    .map((a) => a.id);

  const newlyUnlocked = currentUnlockedIds.filter(
    (id) => !previousIds.includes(id)
  );

  if (newlyUnlocked.length === 0) return [];

  const now = new Date().toISOString();
  const events: AchievementUnlockEvent[] = newlyUnlocked
    .map((id) => {
      const achievement = currentAchievements.find((a) => a.id === id);
      if (!achievement) return null;
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        tier: achievement.tier,
        category: achievement.category,
        unlockedAt: now,
      };
    })
    .filter(Boolean) as AchievementUnlockEvent[];

  // Persist updated unlock state
  await saveUnlockedAchievementIds(currentUnlockedIds);

  // Add to unlock history
  await addToUnlockHistory(events);

  // Track weekly unlocks for digest
  await addToWeeklyUnlocks(events);

  return events;
}

/**
 * Add unlock events to persistent history
 */
async function addToUnlockHistory(events: AchievementUnlockEvent[]): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(UNLOCK_HISTORY_KEY);
    const history: AchievementUnlockEvent[] = stored ? JSON.parse(stored) : [];
    history.push(...events);
    // Keep last 200 entries
    const trimmed = history.slice(-200);
    await AsyncStorage.setItem(UNLOCK_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}

/**
 * Track unlocks this week for the weekly digest notification
 */
async function addToWeeklyUnlocks(events: AchievementUnlockEvent[]): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(WEEKLY_UNLOCKS_KEY);
    const weekly: AchievementUnlockEvent[] = stored ? JSON.parse(stored) : [];
    weekly.push(...events);
    await AsyncStorage.setItem(WEEKLY_UNLOCKS_KEY, JSON.stringify(weekly));
  } catch {}
}

/**
 * Get this week's unlocked achievements (for digest notification)
 */
export async function getWeeklyUnlocks(): Promise<AchievementUnlockEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(WEEKLY_UNLOCKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Reset weekly unlocks counter (called after sending digest)
 */
export async function resetWeeklyUnlocks(): Promise<void> {
  await AsyncStorage.setItem(WEEKLY_UNLOCKS_KEY, JSON.stringify([]));
}

/**
 * Get full unlock history
 */
export async function getUnlockHistory(): Promise<AchievementUnlockEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(UNLOCK_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get total unlocked count
 */
export async function getUnlockedCount(): Promise<number> {
  const ids = await getUnlockedAchievementIds();
  return ids.length;
}

/**
 * Create toast data for a newly unlocked achievement
 */
export function createAchievementToast(
  event: AchievementUnlockEvent
): AchievementToastData {
  return {
    achievement: event,
    showConfetti: event.tier === "gold" || event.tier === "diamond",
    navigateTo: "/achievements-wall",
  };
}

/**
 * Determine if confetti should be shown for this unlock
 * - Always show for gold/diamond tier
 * - Show for first unlock in a category
 * - Show for milestone category
 */
export function shouldShowConfetti(
  event: AchievementUnlockEvent,
  previousUnlockCount: number
): boolean {
  if (event.tier === "gold" || event.tier === "diamond") return true;
  if (event.category === "milestones") return true;
  if (previousUnlockCount === 0) return true; // First ever achievement
  return false;
}

/**
 * Get achievements closest to being unlocked (for weekly digest)
 * Returns achievements with progress >= 60% but not yet unlocked
 */
export function getClosestToUnlock(
  achievements: Array<{
    id: string;
    title: string;
    progress: number;
    unlocked: boolean;
    target?: number;
    value?: number;
  }>
): Array<{ id: string; title: string; progress: number; remaining: number }> {
  return achievements
    .filter((a) => !a.unlocked && a.progress >= 0.6)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3)
    .map((a) => ({
      id: a.id,
      title: a.title,
      progress: Math.round(a.progress * 100),
      remaining: (a.target || 1) - (a.value || 0),
    }));
}
