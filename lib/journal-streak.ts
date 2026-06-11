/**
 * Journal Streak Tracking
 * 
 * Tracks daily journal writing streaks with milestone badges,
 * progress bars, and celebration notifications.
 * Follows the same tier pattern as pronunciation-streak-badges.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Storage Keys ──────────────────────────────────────────────────────────
const JOURNAL_STREAK_KEY = "@journal_streak";
const JOURNAL_LAST_ENTRY_KEY = "@journal_last_entry_date";
const JOURNAL_LONGEST_STREAK_KEY = "@journal_longest_streak";
const JOURNAL_BADGES_KEY = "@journal_earned_badges";
const JOURNAL_TOTAL_ENTRIES_KEY = "@journal_total_entries";

// ─── Badge Tiers ───────────────────────────────────────────────────────────
export type JournalBadgeTier = "none" | "bronze" | "silver" | "gold" | "diamond";

export interface JournalBadgeInfo {
  name: string;
  icon: string;
  color: string;
  days: number;
  description: string;
}

export const JOURNAL_BADGE_TIERS: Record<JournalBadgeTier, JournalBadgeInfo> = {
  none: { name: "Beginner Writer", icon: "📝", color: "#9BA1A6", days: 0, description: "Start your writing journey" },
  bronze: { name: "Consistent Writer", icon: "🖊️", color: "#CD7F32", days: 7, description: "7 days of daily journal entries" },
  silver: { name: "Dedicated Author", icon: "✍️", color: "#C0C0C0", days: 30, description: "30 days of daily journal entries" },
  gold: { name: "Master Storyteller", icon: "📖", color: "#FFD700", days: 100, description: "100 days of daily journal entries" },
  diamond: { name: "Legendary Wordsmith", icon: "💎", color: "#B9F2FF", days: 365, description: "365 days of daily journal entries" },
};

export const JOURNAL_BADGE_TIERS_LIST = [
  { ...JOURNAL_BADGE_TIERS.bronze, tier: "bronze" as JournalBadgeTier, minStreak: 7 },
  { ...JOURNAL_BADGE_TIERS.silver, tier: "silver" as JournalBadgeTier, minStreak: 30 },
  { ...JOURNAL_BADGE_TIERS.gold, tier: "gold" as JournalBadgeTier, minStreak: 100 },
  { ...JOURNAL_BADGE_TIERS.diamond, tier: "diamond" as JournalBadgeTier, minStreak: 365 },
];

const MILESTONE_DAYS = [3, 5, 7, 10, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365];

// ─── Tier Calculation ──────────────────────────────────────────────────────

export function getTierForStreak(days: number): JournalBadgeTier {
  if (days >= 365) return "diamond";
  if (days >= 100) return "gold";
  if (days >= 30) return "silver";
  if (days >= 7) return "bronze";
  return "none";
}

function getNextTier(current: JournalBadgeTier): JournalBadgeTier | null {
  const order: JournalBadgeTier[] = ["none", "bronze", "silver", "gold", "diamond"];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

export function isMilestoneDay(days: number): boolean {
  return MILESTONE_DAYS.includes(days);
}

export function getCelebrationLevel(days: number): "small" | "medium" | "large" | "epic" {
  if (days >= 365) return "epic";
  if (days >= 100) return "large";
  if (days >= 30) return "medium";
  return "small";
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface JournalBadge {
  id: string;
  tier: JournalBadgeTier;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiredDays: number;
  earnedAt?: string;
}

export interface JournalBadgeNotification {
  type: "tier_upgrade" | "streak_milestone";
  badge: JournalBadge;
  message: string;
  celebrationLevel: "small" | "medium" | "large" | "epic";
}

export interface JournalStreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalEntries: number;
  currentTier: JournalBadgeTier;
  nextTier: JournalBadgeTier | null;
  daysToNextTier: number;
  progressPercent: number;
  badges: JournalBadge[];
  totalBadgesEarned: number;
}

// ─── Streak Management ─────────────────────────────────────────────────────

/**
 * Record a journal entry and update the streak.
 * Returns the updated streak and any badge notification.
 */
export async function recordJournalEntry(): Promise<{
  streak: number;
  notification: JournalBadgeNotification | null;
}> {
  const today = new Date().toISOString().split("T")[0];
  const lastEntry = await AsyncStorage.getItem(JOURNAL_LAST_ENTRY_KEY);
  const currentStreakRaw = await AsyncStorage.getItem(JOURNAL_STREAK_KEY);
  let currentStreak = currentStreakRaw ? parseInt(currentStreakRaw, 10) : 0;

  // Increment total entries
  const totalRaw = await AsyncStorage.getItem(JOURNAL_TOTAL_ENTRIES_KEY);
  const total = (totalRaw ? parseInt(totalRaw, 10) : 0) + 1;
  await AsyncStorage.setItem(JOURNAL_TOTAL_ENTRIES_KEY, String(total));

  if (lastEntry === today) {
    // Already wrote today — don't double count streak but still count entry
    return { streak: currentStreak, notification: null };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastEntry === yesterdayStr) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  await AsyncStorage.setItem(JOURNAL_STREAK_KEY, String(currentStreak));
  await AsyncStorage.setItem(JOURNAL_LAST_ENTRY_KEY, today);

  // Update longest streak
  const longestRaw = await AsyncStorage.getItem(JOURNAL_LONGEST_STREAK_KEY);
  const longest = longestRaw ? parseInt(longestRaw, 10) : 0;
  if (currentStreak > longest) {
    await AsyncStorage.setItem(JOURNAL_LONGEST_STREAK_KEY, String(currentStreak));
  }

  // Check for badge notifications
  const notification = await checkBadgeNotification(currentStreak);

  return { streak: currentStreak, notification };
}

/**
 * Get current streak info for display
 */
export async function getJournalStreakInfo(): Promise<JournalStreakInfo> {
  const streakRaw = await AsyncStorage.getItem(JOURNAL_STREAK_KEY);
  const currentStreak = streakRaw ? parseInt(streakRaw, 10) : 0;

  const longestRaw = await AsyncStorage.getItem(JOURNAL_LONGEST_STREAK_KEY);
  const longestStreak = Math.max(longestRaw ? parseInt(longestRaw, 10) : 0, currentStreak);

  const totalRaw = await AsyncStorage.getItem(JOURNAL_TOTAL_ENTRIES_KEY);
  const totalEntries = totalRaw ? parseInt(totalRaw, 10) : 0;

  const currentTier = getTierForStreak(currentStreak);
  const nextTier = getNextTier(currentTier);
  const currentMin = JOURNAL_BADGE_TIERS[currentTier].days;
  const nextMin = nextTier ? JOURNAL_BADGE_TIERS[nextTier].days : currentMin;
  const daysToNextTier = nextTier ? nextMin - currentStreak : 0;
  const progressPercent = nextTier
    ? Math.min(Math.max(((currentStreak - currentMin) / (nextMin - currentMin)) * 100, 0), 100)
    : 100;

  const earnedBadges = await getEarnedBadges();
  const allBadges = getAllBadges().map((badge) => {
    const earned = earnedBadges.find((b) => b.id === badge.id);
    return earned ? { ...badge, earnedAt: earned.earnedAt } : badge;
  });

  return {
    currentStreak,
    longestStreak,
    totalEntries,
    currentTier,
    nextTier,
    daysToNextTier,
    progressPercent,
    badges: allBadges,
    totalBadgesEarned: earnedBadges.length,
  };
}

// ─── Badge Storage ─────────────────────────────────────────────────────────

async function checkBadgeNotification(streak: number): Promise<JournalBadgeNotification | null> {
  const tier = getTierForStreak(streak);
  const tierInfo = JOURNAL_BADGE_TIERS[tier];

  // Check if we just earned a new tier
  if (tier !== "none" && streak === tierInfo.days) {
    const badge: JournalBadge = {
      id: `journal_badge_${tier}`,
      tier,
      name: tierInfo.name,
      description: tierInfo.description,
      icon: tierInfo.icon,
      color: tierInfo.color,
      requiredDays: tierInfo.days,
      earnedAt: new Date().toISOString(),
    };

    await saveEarnedBadge(badge);

    return {
      type: "tier_upgrade",
      badge,
      message: `Congratulations! You earned the ${tierInfo.name} badge!`,
      celebrationLevel: getCelebrationLevel(streak),
    };
  }

  // Check for milestone notifications
  if (isMilestoneDay(streak)) {
    const badge: JournalBadge = {
      id: `journal_milestone_${streak}`,
      tier,
      name: `${streak}-Day Writer`,
      description: `Wrote journal entries for ${streak} consecutive days`,
      icon: streak >= 100 ? "🔥" : streak >= 30 ? "⭐" : "✨",
      color: tierInfo.color,
      requiredDays: streak,
    };

    return {
      type: "streak_milestone",
      badge,
      message: `Amazing! ${streak}-day journal writing streak!`,
      celebrationLevel: getCelebrationLevel(streak),
    };
  }

  return null;
}

async function saveEarnedBadge(badge: JournalBadge): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(JOURNAL_BADGES_KEY);
    const badges: JournalBadge[] = raw ? JSON.parse(raw) : [];
    if (!badges.find((b) => b.id === badge.id)) {
      badges.push(badge);
      await AsyncStorage.setItem(JOURNAL_BADGES_KEY, JSON.stringify(badges));
    }
  } catch {}
}

export async function getEarnedBadges(): Promise<JournalBadge[]> {
  try {
    const raw = await AsyncStorage.getItem(JOURNAL_BADGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getAllBadges(): JournalBadge[] {
  return JOURNAL_BADGE_TIERS_LIST.map((t) => ({
    id: `journal_badge_${t.tier}`,
    tier: t.tier,
    name: t.name,
    description: t.description,
    icon: t.icon,
    color: t.color,
    requiredDays: t.minStreak,
  }));
}

/**
 * Get the current badge for display in the journal header
 */
export function getCurrentBadge(streakDays: number): JournalBadgeInfo {
  const tier = getTierForStreak(streakDays);
  return JOURNAL_BADGE_TIERS[tier];
}

/**
 * Get the next badge info for motivation display
 */
export function getNextBadge(streakDays: number): JournalBadgeInfo | null {
  const currentTier = getTierForStreak(streakDays);
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return null;
  return JOURNAL_BADGE_TIERS[nextTier];
}
