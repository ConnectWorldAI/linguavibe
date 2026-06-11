/**
 * Pronunciation Streak Badges Library
 * 
 * Awards visual badges (Bronze/Silver/Gold/Diamond) for consecutive daily
 * challenge completions, displayed on the user profile.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────

export type BadgeTier = "none" | "bronze" | "silver" | "gold" | "diamond";

export interface StreakBadge {
  id: string;
  tier: BadgeTier;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiredDays: number;
  earnedAt?: string;
  language?: string;
}

export interface BadgeProgress {
  currentStreak: number;
  longestStreak: number;
  currentTier: BadgeTier;
  nextTier: BadgeTier | null;
  daysToNextTier: number;
  progressPercent: number;
  badges: StreakBadge[];
  totalBadgesEarned: number;
}

export interface BadgeNotification {
  type: "badge_earned" | "streak_milestone" | "tier_upgrade";
  badge: StreakBadge;
  message: string;
  celebrationLevel: "small" | "medium" | "large" | "epic";
}

// ─── Constants ──────────────────────────────────────────────────────

const BADGES_KEY = "pronunciation_streak_badges";
const STREAK_KEY = "pronunciation_daily_streak";
const LAST_PRACTICE_KEY = "pronunciation_last_practice_date";

export const BADGE_TIERS: Record<BadgeTier, { days: number; color: string; icon: string; name: string }> = {
  none: { days: 0, color: "#9CA3AF", icon: "⚪", name: "Beginner" },
  bronze: { days: 7, color: "#CD7F32", icon: "🥉", name: "Bronze Speaker" },
  silver: { days: 30, color: "#C0C0C0", icon: "🥈", name: "Silver Orator" },
  gold: { days: 100, color: "#FFD700", icon: "🥇", name: "Gold Linguist" },
  diamond: { days: 365, color: "#B9F2FF", icon: "💎", name: "Diamond Master" },
};

const MILESTONE_DAYS = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365, 500, 730, 1000];

// ─── Badge Calculation ──────────────────────────────────────────────

/**
 * Determine the badge tier for a given streak count
 */
export function getTierForStreak(days: number): BadgeTier {
  if (days >= 365) return "diamond";
  if (days >= 100) return "gold";
  if (days >= 30) return "silver";
  if (days >= 7) return "bronze";
  return "none";
}

/**
 * Get the next tier after the current one
 */
export function getNextTier(currentTier: BadgeTier): BadgeTier | null {
  const order: BadgeTier[] = ["none", "bronze", "silver", "gold", "diamond"];
  const idx = order.indexOf(currentTier);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

/**
 * Calculate progress toward the next badge tier
 */
export function calculateProgress(currentStreak: number): {
  currentTier: BadgeTier;
  nextTier: BadgeTier | null;
  daysToNextTier: number;
  progressPercent: number;
} {
  const currentTier = getTierForStreak(currentStreak);
  const nextTier = getNextTier(currentTier);
  
  if (!nextTier) {
    return { currentTier, nextTier: null, daysToNextTier: 0, progressPercent: 100 };
  }
  
  const currentThreshold = BADGE_TIERS[currentTier].days;
  const nextThreshold = BADGE_TIERS[nextTier].days;
  const daysToNextTier = nextThreshold - currentStreak;
  const progressInTier = currentStreak - currentThreshold;
  const tierRange = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, Math.round((progressInTier / tierRange) * 100));
  
  return { currentTier, nextTier, daysToNextTier, progressPercent };
}

/**
 * Generate all badge definitions
 */
export function getAllBadges(): StreakBadge[] {
  return [
    {
      id: "badge_bronze",
      tier: "bronze",
      name: BADGE_TIERS.bronze.name,
      description: "Complete 7 consecutive daily pronunciation challenges",
      icon: BADGE_TIERS.bronze.icon,
      color: BADGE_TIERS.bronze.color,
      requiredDays: BADGE_TIERS.bronze.days,
    },
    {
      id: "badge_silver",
      tier: "silver",
      name: BADGE_TIERS.silver.name,
      description: "Complete 30 consecutive daily pronunciation challenges",
      icon: BADGE_TIERS.silver.icon,
      color: BADGE_TIERS.silver.color,
      requiredDays: BADGE_TIERS.silver.days,
    },
    {
      id: "badge_gold",
      tier: "gold",
      name: BADGE_TIERS.gold.name,
      description: "Complete 100 consecutive daily pronunciation challenges",
      icon: BADGE_TIERS.gold.icon,
      color: BADGE_TIERS.gold.color,
      requiredDays: BADGE_TIERS.gold.days,
    },
    {
      id: "badge_diamond",
      tier: "diamond",
      name: BADGE_TIERS.diamond.name,
      description: "Complete 365 consecutive daily pronunciation challenges",
      icon: BADGE_TIERS.diamond.icon,
      color: BADGE_TIERS.diamond.color,
      requiredDays: BADGE_TIERS.diamond.days,
    },
  ];
}

/**
 * Check if a streak day is a milestone
 */
export function isMilestoneDay(days: number): boolean {
  return MILESTONE_DAYS.includes(days);
}

/**
 * Get celebration level for a milestone
 */
export function getCelebrationLevel(days: number): "small" | "medium" | "large" | "epic" {
  if (days >= 365) return "epic";
  if (days >= 100) return "large";
  if (days >= 30) return "medium";
  return "small";
}

// ─── Streak Management ──────────────────────────────────────────────

/**
 * Record a daily practice and update streak
 */
export async function recordDailyPractice(): Promise<{
  streak: number;
  notification: BadgeNotification | null;
}> {
  const today = new Date().toISOString().split("T")[0];
  const lastPractice = await AsyncStorage.getItem(LAST_PRACTICE_KEY);
  const currentStreakRaw = await AsyncStorage.getItem(STREAK_KEY);
  let currentStreak = currentStreakRaw ? parseInt(currentStreakRaw, 10) : 0;
  
  if (lastPractice === today) {
    // Already practiced today
    return { streak: currentStreak, notification: null };
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  if (lastPractice === yesterdayStr) {
    // Consecutive day
    currentStreak += 1;
  } else {
    // Streak broken, start fresh
    currentStreak = 1;
  }
  
  await AsyncStorage.setItem(STREAK_KEY, String(currentStreak));
  await AsyncStorage.setItem(LAST_PRACTICE_KEY, today);
  
  // Check for badge notifications
  const notification = await checkBadgeNotification(currentStreak);
  
  // Update longest streak
  const longestRaw = await AsyncStorage.getItem("pronunciation_longest_streak");
  const longest = longestRaw ? parseInt(longestRaw, 10) : 0;
  if (currentStreak > longest) {
    await AsyncStorage.setItem("pronunciation_longest_streak", String(currentStreak));
  }
  
  return { streak: currentStreak, notification };
}

/**
 * Check if a badge notification should be shown
 */
async function checkBadgeNotification(streak: number): Promise<BadgeNotification | null> {
  const tier = getTierForStreak(streak);
  const tierInfo = BADGE_TIERS[tier];
  
  // Check if we just earned a new tier
  if (tier !== "none" && streak === tierInfo.days) {
    const badge: StreakBadge = {
      id: `badge_${tier}`,
      tier,
      name: tierInfo.name,
      description: `Completed ${tierInfo.days} consecutive daily challenges`,
      icon: tierInfo.icon,
      color: tierInfo.color,
      requiredDays: tierInfo.days,
      earnedAt: new Date().toISOString(),
    };
    
    // Save earned badge
    await saveEarnedBadge(badge);
    
    return {
      type: "tier_upgrade",
      badge,
      message: `🎉 Congratulations! You earned the ${tierInfo.name} badge!`,
      celebrationLevel: getCelebrationLevel(streak),
    };
  }
  
  // Check for milestone notifications
  if (isMilestoneDay(streak)) {
    const badge: StreakBadge = {
      id: `milestone_${streak}`,
      tier,
      name: `${streak}-Day Streak`,
      description: `Practiced pronunciation for ${streak} consecutive days`,
      icon: streak >= 100 ? "🔥" : streak >= 30 ? "⭐" : "✨",
      color: tierInfo.color,
      requiredDays: streak,
    };
    
    return {
      type: "streak_milestone",
      badge,
      message: `🔥 Amazing! ${streak}-day pronunciation streak!`,
      celebrationLevel: getCelebrationLevel(streak),
    };
  }
  
  return null;
}

// ─── Badge Storage ──────────────────────────────────────────────────

async function saveEarnedBadge(badge: StreakBadge): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(BADGES_KEY);
    const badges: StreakBadge[] = raw ? JSON.parse(raw) : [];
    
    // Don't duplicate
    if (!badges.find(b => b.id === badge.id)) {
      badges.push(badge);
      await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(badges));
    }
  } catch {
    // Silent fail
  }
}

export async function getEarnedBadges(): Promise<StreakBadge[]> {
  try {
    const raw = await AsyncStorage.getItem(BADGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get full badge progress for display
 */
export async function getBadgeProgress(): Promise<BadgeProgress> {
  const streakRaw = await AsyncStorage.getItem(STREAK_KEY);
  const currentStreak = streakRaw ? parseInt(streakRaw, 10) : 0;
  
  const longestRaw = await AsyncStorage.getItem("pronunciation_longest_streak");
  const longestStreak = longestRaw ? parseInt(longestRaw, 10) : 0;
  
  const { currentTier, nextTier, daysToNextTier, progressPercent } = calculateProgress(currentStreak);
  
  const earnedBadges = await getEarnedBadges();
  const allBadges = getAllBadges().map(badge => {
    const earned = earnedBadges.find(b => b.id === badge.id);
    return earned ? { ...badge, earnedAt: earned.earnedAt } : badge;
  });
  
  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    currentTier,
    nextTier,
    daysToNextTier,
    progressPercent,
    badges: allBadges,
    totalBadgesEarned: earnedBadges.length,
  };
}

/**
 * Get the display badge for the user's profile
 */
export async function getProfileBadge(): Promise<{
  tier: BadgeTier;
  icon: string;
  name: string;
  color: string;
  streak: number;
} | null> {
  const streakRaw = await AsyncStorage.getItem(STREAK_KEY);
  const currentStreak = streakRaw ? parseInt(streakRaw, 10) : 0;
  
  if (currentStreak < 7) return null;
  
  const tier = getTierForStreak(currentStreak);
  const tierInfo = BADGE_TIERS[tier];
  
  return {
    tier,
    icon: tierInfo.icon,
    name: tierInfo.name,
    color: tierInfo.color,
    streak: currentStreak,
  };
}

/**
 * Synchronous convenience: get the current badge tier info for a given streak count.
 * Returns the badge tier object or null if streak is below minimum.
 */
export function getCurrentBadge(streakDays: number): { name: string; icon: string; color: string; days: number } | null {
  if (streakDays < 7) return null;
  const tier = getTierForStreak(streakDays);
  return BADGE_TIERS[tier];
}

/**
 * Synchronous convenience: get the next badge tier info for a given streak count.
 * Returns the next tier object or null if already at max.
 */
export function getNextBadge(streakDays: number): { name: string; icon: string; color: string; days: number } | null {
  const currentTier = getTierForStreak(streakDays);
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return null;
  return BADGE_TIERS[nextTier];
}

/**
 * Array version of BADGE_TIERS for rendering in lists/grids.
 * Excludes "none" tier, only shows earnable badges.
 */
export const BADGE_TIERS_LIST = [
  { ...BADGE_TIERS.bronze, tier: "bronze" as BadgeTier, minStreak: 7 },
  { ...BADGE_TIERS.silver, tier: "silver" as BadgeTier, minStreak: 30 },
  { ...BADGE_TIERS.gold, tier: "gold" as BadgeTier, minStreak: 100 },
  { ...BADGE_TIERS.diamond, tier: "diamond" as BadgeTier, minStreak: 365 },
];

/**
 * Synchronous convenience: calculate badge progress percentage for a given streak.
 * Returns 0-100 representing progress toward the next badge tier.
 */
export function getBadgeProgressSync(streakDays: number): number {
  const currentTier = getTierForStreak(streakDays);
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return 100; // Already at max
  const currentMin = BADGE_TIERS[currentTier].days;
  const nextMin = BADGE_TIERS[nextTier].days;
  const progress = ((streakDays - currentMin) / (nextMin - currentMin)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}
