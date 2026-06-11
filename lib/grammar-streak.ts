import AsyncStorage from "@react-native-async-storage/async-storage";
import { isFreezeActiveToday } from "./streak-freeze";

const STREAK_KEY = "@grammar_streak_data";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string; // YYYY-MM-DD
  reviewDates: string[]; // Array of YYYY-MM-DD dates
}

function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getYesterday(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export async function getStreakData(): Promise<StreakData> {
  try {
    const stored = await AsyncStorage.getItem(STREAK_KEY);
    if (stored) {
      const data = JSON.parse(stored) as StreakData;
      // Check if streak is still valid (last review was today or yesterday)
      const today = getToday();
      const yesterday = getYesterday();
      if (data.lastReviewDate !== today && data.lastReviewDate !== yesterday) {
        // Check if streak freeze is active before breaking
        const freezeActive = await isFreezeActiveToday();
        if (freezeActive) {
          // Freeze protects the streak — don't reset
          return data;
        }
        // Streak broken
        return { ...data, currentStreak: 0 };
      }
      return data;
    }
  } catch (e) {
    console.error("Failed to load streak data:", e);
  }
  return { currentStreak: 0, longestStreak: 0, lastReviewDate: "", reviewDates: [] };
}

export async function recordGrammarReview(): Promise<StreakData> {
  const today = getToday();
  const yesterday = getYesterday();
  
  let data = await getStreakData();
  
  // Already reviewed today
  if (data.lastReviewDate === today) {
    return data;
  }
  
  // Continuing streak from yesterday
  if (data.lastReviewDate === yesterday) {
    data.currentStreak += 1;
  } else {
    // Starting new streak
    data.currentStreak = 1;
  }
  
  // Update longest streak
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }
  
  data.lastReviewDate = today;
  
  // Add to review dates (keep last 90 days)
  if (!data.reviewDates.includes(today)) {
    data.reviewDates.push(today);
    if (data.reviewDates.length > 90) {
      data.reviewDates = data.reviewDates.slice(-90);
    }
  }
  
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save streak data:", e);
  }
  
  return data;
}

export async function getStreakCount(): Promise<number> {
  const data = await getStreakData();
  return data.currentStreak;
}
