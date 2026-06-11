/**
 * Streak Shield Power-Up
 * 
 * Protects the user's goal streak for one missed week.
 * Similar to Duolingo's streak freeze — users earn or purchase shields
 * that automatically activate when they miss a week.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StreakShieldState {
  shieldsAvailable: number;
  shieldsUsed: number;
  shieldHistory: ShieldUsage[];
  lastEarnedDate: string | null;
  maxShields: number;
}

export interface ShieldUsage {
  date: string;
  weekStartDate: string;
  streakPreserved: number; // What streak was preserved
}

export interface ShieldEarnCondition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  check: () => Promise<boolean>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SHIELD_KEY = "@streak_shield_state";
const MAX_SHIELDS = 3;
const EARN_COOLDOWN_DAYS = 7; // Can earn one shield per week

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Get the current streak shield state.
 */
export async function getShieldState(): Promise<StreakShieldState> {
  try {
    const raw = await AsyncStorage.getItem(SHIELD_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      return { ...getDefaultState(), ...state };
    }
  } catch {}
  return getDefaultState();
}

/**
 * Save the streak shield state.
 */
export async function saveShieldState(state: StreakShieldState): Promise<void> {
  await AsyncStorage.setItem(SHIELD_KEY, JSON.stringify(state));
}

/**
 * Get default shield state for new users.
 */
function getDefaultState(): StreakShieldState {
  return {
    shieldsAvailable: 1, // Start with 1 free shield
    shieldsUsed: 0,
    shieldHistory: [],
    lastEarnedDate: null,
    maxShields: MAX_SHIELDS,
  };
}

/**
 * Use a shield to protect the streak.
 * Returns true if shield was successfully used, false if none available.
 */
export async function useShield(weekStartDate: string, currentStreak: number): Promise<boolean> {
  const state = await getShieldState();
  
  if (state.shieldsAvailable <= 0) {
    return false;
  }

  state.shieldsAvailable -= 1;
  state.shieldsUsed += 1;
  state.shieldHistory.push({
    date: new Date().toISOString(),
    weekStartDate,
    streakPreserved: currentStreak,
  });

  await saveShieldState(state);
  return true;
}

/**
 * Earn a shield by completing a challenge.
 * Returns true if shield was earned, false if at max or on cooldown.
 */
export async function earnShield(): Promise<{ earned: boolean; reason?: string }> {
  const state = await getShieldState();

  // Check max capacity
  if (state.shieldsAvailable >= state.maxShields) {
    return { earned: false, reason: "You already have the maximum number of shields." };
  }

  // Check cooldown
  if (state.lastEarnedDate) {
    const lastEarned = new Date(state.lastEarnedDate);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - lastEarned.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < EARN_COOLDOWN_DAYS) {
      const daysLeft = EARN_COOLDOWN_DAYS - daysSince;
      return { earned: false, reason: `You can earn another shield in ${daysLeft} day${daysLeft > 1 ? "s" : ""}.` };
    }
  }

  state.shieldsAvailable += 1;
  state.lastEarnedDate = new Date().toISOString();
  await saveShieldState(state);
  return { earned: true };
}

/**
 * Check if a shield should auto-activate for a missed week.
 * Called during streak calculation when a week is missed.
 */
export async function shouldAutoActivateShield(
  weekStartDate: string,
  currentStreak: number
): Promise<boolean> {
  // Only activate if there's a streak worth protecting (2+ weeks)
  if (currentStreak < 2) return false;

  const state = await getShieldState();
  
  // Check if shield was already used for this week
  const alreadyUsed = state.shieldHistory.some(
    (h) => h.weekStartDate === weekStartDate
  );
  if (alreadyUsed) return false;

  // Try to use a shield
  return await useShield(weekStartDate, currentStreak);
}

/**
 * Get earn conditions — ways users can earn shields.
 */
export function getEarnConditions(): Array<{
  id: string;
  title: string;
  description: string;
  emoji: string;
}> {
  return [
    {
      id: "perfect_week",
      title: "Perfect Week",
      description: "Complete all goals with A+ grade",
      emoji: "🌟",
    },
    {
      id: "seven_day_streak",
      title: "7-Day Practice",
      description: "Practice every day for 7 days straight",
      emoji: "📅",
    },
    {
      id: "help_friend",
      title: "Study Buddy",
      description: "Complete a group study session",
      emoji: "🤝",
    },
    {
      id: "pronunciation_master",
      title: "Pronunciation Master",
      description: "Score 90+ on 5 pronunciation checks",
      emoji: "🎤",
    },
  ];
}

/**
 * Get shield display info for UI.
 */
export function getShieldDisplayInfo(state: StreakShieldState): {
  emoji: string;
  statusText: string;
  statusColor: string;
  canEarn: boolean;
} {
  if (state.shieldsAvailable >= state.maxShields) {
    return {
      emoji: "🛡️",
      statusText: "Full Protection",
      statusColor: "#10B981",
      canEarn: false,
    };
  }

  if (state.shieldsAvailable > 0) {
    return {
      emoji: "🛡️",
      statusText: `${state.shieldsAvailable} Shield${state.shieldsAvailable > 1 ? "s" : ""} Ready`,
      statusColor: "#3B82F6",
      canEarn: true,
    };
  }

  return {
    emoji: "⚠️",
    statusText: "No Shields — Streak at Risk!",
    statusColor: "#EF4444",
    canEarn: true,
  };
}
