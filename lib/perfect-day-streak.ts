import AsyncStorage from "@react-native-async-storage/async-storage";

const PERFECT_DAY_STREAK_KEY = "@connectworld_perfect_day_streak";

export interface PerfectDayStreak {
  currentStreak: number;
  lastPerfectDay: string; // ISO date string
  longestStreak: number;
  totalPerfectDays: number;
  lastBonusAwarded: number; // streak level when last bonus was given
}

export interface StreakBonus {
  streak: number;
  credits: number;
  label: string;
  emoji: string;
}

export const STREAK_BONUSES: StreakBonus[] = [
  { streak: 3, credits: 50, label: "3-Day Perfect Streak", emoji: "🔥" },
  { streak: 5, credits: 100, label: "5-Day Perfect Streak", emoji: "⚡" },
  { streak: 7, credits: 200, label: "7-Day Perfect Streak", emoji: "💎" },
  { streak: 14, credits: 500, label: "2-Week Perfect Streak", emoji: "👑" },
  { streak: 30, credits: 1000, label: "30-Day Perfect Streak", emoji: "🏆" },
];

export async function getPerfectDayStreak(): Promise<PerfectDayStreak> {
  try {
    const stored = await AsyncStorage.getItem(PERFECT_DAY_STREAK_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    currentStreak: 0,
    lastPerfectDay: "",
    longestStreak: 0,
    totalPerfectDays: 0,
    lastBonusAwarded: 0,
  };
}

export async function recordPerfectDay(): Promise<{
  streak: PerfectDayStreak;
  newBonus: StreakBonus | null;
}> {
  const streak = await getPerfectDayStreak();
  const today = new Date().toISOString().split("T")[0];

  // Already recorded today
  if (streak.lastPerfectDay === today) {
    return { streak, newBonus: null };
  }

  // Check if consecutive (yesterday was a perfect day)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (streak.lastPerfectDay === yesterdayStr) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }

  streak.lastPerfectDay = today;
  streak.totalPerfectDays += 1;
  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }

  // Check for new bonus
  let newBonus: StreakBonus | null = null;
  for (const bonus of STREAK_BONUSES) {
    if (streak.currentStreak >= bonus.streak && streak.lastBonusAwarded < bonus.streak) {
      newBonus = bonus;
      streak.lastBonusAwarded = bonus.streak;
    }
  }

  await AsyncStorage.setItem(PERFECT_DAY_STREAK_KEY, JSON.stringify(streak));
  return { streak, newBonus };
}

export function getNextStreakBonus(currentStreak: number): StreakBonus | null {
  for (const bonus of STREAK_BONUSES) {
    if (currentStreak < bonus.streak) {
      return bonus;
    }
  }
  return null;
}
