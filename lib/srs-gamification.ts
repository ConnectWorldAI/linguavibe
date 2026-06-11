/**
 * SRS Gamification System
 * 
 * Adds game mechanics to the spaced repetition system:
 * - Streak bonuses for consecutive daily SRS reviews
 * - XP system for completing due cards on time
 * - "Perfect Recall" badge when all cards answered correctly on first try
 * - Level progression based on total XP
 * - Daily/weekly challenges
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "linguavibe_srs_gamification";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SRSGamificationState {
  // XP System
  totalXP: number;
  todayXP: number;
  weeklyXP: number;
  level: number;
  xpToNextLevel: number;
  
  // Streak System
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string; // YYYY-MM-DD
  streakFreezeAvailable: boolean;
  streakFreezeUsedToday: boolean;
  
  // Badges
  badges: Badge[];
  
  // Daily Stats
  cardsReviewedToday: number;
  perfectRecallToday: boolean; // All cards correct on first try today
  consecutivePerfectDays: number;
  
  // History
  dailyHistory: DailyRecord[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: number;
  category: "streak" | "accuracy" | "volume" | "speed" | "special";
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  cardsReviewed: number;
  correctOnFirstTry: number;
  totalCorrect: number;
  xpEarned: number;
  streakDay: number;
  perfectRecall: boolean;
}

export interface ReviewResult {
  xpEarned: number;
  streakBonus: number;
  perfectRecallBonus: number;
  newBadges: Badge[];
  levelUp: boolean;
  newLevel: number;
  message: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const XP_PER_CARD = 10;
const XP_CORRECT_BONUS = 5;
const XP_FIRST_TRY_BONUS = 8;
const XP_ON_TIME_BONUS = 3; // Card reviewed before it was overdue
const STREAK_MULTIPLIER_BASE = 0.1; // +10% per streak day, capped
const MAX_STREAK_MULTIPLIER = 2.0; // Max 200% bonus
const PERFECT_RECALL_BONUS = 50;
const DAILY_GOAL_BONUS = 25;
const DAILY_GOAL_CARDS = 10;

// Level thresholds (XP needed for each level)
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000,
  5000, 6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 33000,
  40000, 50000, 62000, 76000, 92000, 110000, 130000, 155000, 185000, 220000,
];

// Badge definitions
const BADGE_DEFINITIONS: Array<{ id: string; name: string; description: string; icon: string; category: Badge["category"]; check: (state: SRSGamificationState) => boolean }> = [
  // Streak badges
  { id: "streak_3", name: "Getting Started", description: "3-day review streak", icon: "🔥", category: "streak", check: (s) => s.currentStreak >= 3 },
  { id: "streak_7", name: "Week Warrior", description: "7-day review streak", icon: "⚡", category: "streak", check: (s) => s.currentStreak >= 7 },
  { id: "streak_14", name: "Fortnight Focus", description: "14-day review streak", icon: "💪", category: "streak", check: (s) => s.currentStreak >= 14 },
  { id: "streak_30", name: "Monthly Master", description: "30-day review streak", icon: "🏆", category: "streak", check: (s) => s.currentStreak >= 30 },
  { id: "streak_60", name: "Iron Will", description: "60-day review streak", icon: "🦾", category: "streak", check: (s) => s.currentStreak >= 60 },
  { id: "streak_100", name: "Century Club", description: "100-day review streak", icon: "💯", category: "streak", check: (s) => s.currentStreak >= 100 },
  
  // Accuracy badges
  { id: "perfect_1", name: "Perfect Recall", description: "All cards correct on first try (1 day)", icon: "🎯", category: "accuracy", check: (s) => s.perfectRecallToday && s.cardsReviewedToday >= 5 },
  { id: "perfect_3", name: "Sharp Mind", description: "3 consecutive perfect recall days", icon: "🧠", category: "accuracy", check: (s) => s.consecutivePerfectDays >= 3 },
  { id: "perfect_7", name: "Photographic Memory", description: "7 consecutive perfect recall days", icon: "📸", category: "accuracy", check: (s) => s.consecutivePerfectDays >= 7 },
  { id: "perfect_14", name: "Memory Palace", description: "14 consecutive perfect recall days", icon: "🏰", category: "accuracy", check: (s) => s.consecutivePerfectDays >= 14 },
  
  // Volume badges
  { id: "cards_50", name: "Card Collector", description: "Reviewed 50 cards total", icon: "🃏", category: "volume", check: (s) => getTotalCardsReviewed(s) >= 50 },
  { id: "cards_200", name: "Deck Master", description: "Reviewed 200 cards total", icon: "📚", category: "volume", check: (s) => getTotalCardsReviewed(s) >= 200 },
  { id: "cards_500", name: "Knowledge Seeker", description: "Reviewed 500 cards total", icon: "🎓", category: "volume", check: (s) => getTotalCardsReviewed(s) >= 500 },
  { id: "cards_1000", name: "Scholar", description: "Reviewed 1000 cards total", icon: "📖", category: "volume", check: (s) => getTotalCardsReviewed(s) >= 1000 },
  
  // Level badges
  { id: "level_5", name: "Rising Star", description: "Reached level 5", icon: "⭐", category: "special", check: (s) => s.level >= 5 },
  { id: "level_10", name: "Dedicated Learner", description: "Reached level 10", icon: "🌟", category: "special", check: (s) => s.level >= 10 },
  { id: "level_20", name: "Language Champion", description: "Reached level 20", icon: "👑", category: "special", check: (s) => s.level >= 20 },
  
  // XP badges
  { id: "xp_1000", name: "First Thousand", description: "Earned 1,000 XP", icon: "💎", category: "special", check: (s) => s.totalXP >= 1000 },
  { id: "xp_5000", name: "XP Hoarder", description: "Earned 5,000 XP", icon: "💰", category: "special", check: (s) => s.totalXP >= 5000 },
  { id: "xp_10000", name: "XP Legend", description: "Earned 10,000 XP", icon: "🏅", category: "special", check: (s) => s.totalXP >= 10000 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTotalCardsReviewed(state: SRSGamificationState): number {
  return state.dailyHistory.reduce((sum, d) => sum + d.cardsReviewed, 0);
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getLevel(xp: number): { level: number; xpToNext: number } {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      const nextThreshold = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i] + 50000;
      return { level: i + 1, xpToNext: nextThreshold - xp };
    }
  }
  return { level: 1, xpToNext: LEVEL_THRESHOLDS[1] - xp };
}

function getStreakMultiplier(streak: number): number {
  return Math.min(1 + streak * STREAK_MULTIPLIER_BASE, MAX_STREAK_MULTIPLIER);
}

// ─── State Management ───────────────────────────────────────────────────────

const DEFAULT_STATE: SRSGamificationState = {
  totalXP: 0,
  todayXP: 0,
  weeklyXP: 0,
  level: 1,
  xpToNextLevel: 100,
  currentStreak: 0,
  longestStreak: 0,
  lastReviewDate: "",
  streakFreezeAvailable: true,
  streakFreezeUsedToday: false,
  cardsReviewedToday: 0,
  perfectRecallToday: true,
  consecutivePerfectDays: 0,
  badges: [],
  dailyHistory: [],
};

async function loadState(): Promise<SRSGamificationState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const state = JSON.parse(raw) as SRSGamificationState;
    
    // Reset daily stats if it's a new day
    const today = getToday();
    if (state.lastReviewDate && state.lastReviewDate !== today) {
      // Check if streak is broken (more than 1 day gap)
      const lastDate = new Date(state.lastReviewDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 1) {
        // Streak broken (unless freeze available)
        if (daysDiff === 2 && state.streakFreezeAvailable) {
          state.streakFreezeUsedToday = true;
          state.streakFreezeAvailable = false;
        } else {
          state.currentStreak = 0;
          state.consecutivePerfectDays = 0;
        }
      }
      
      // Save yesterday's record
      if (state.cardsReviewedToday > 0) {
        state.dailyHistory.push({
          date: state.lastReviewDate,
          cardsReviewed: state.cardsReviewedToday,
          correctOnFirstTry: state.perfectRecallToday ? state.cardsReviewedToday : Math.floor(state.cardsReviewedToday * 0.7),
          totalCorrect: state.cardsReviewedToday,
          xpEarned: state.todayXP,
          streakDay: state.currentStreak,
          perfectRecall: state.perfectRecallToday,
        });
        // Keep only last 90 days
        if (state.dailyHistory.length > 90) {
          state.dailyHistory = state.dailyHistory.slice(-90);
        }
      }
      
      // Reset daily counters
      state.todayXP = 0;
      state.cardsReviewedToday = 0;
      state.perfectRecallToday = true;
      state.streakFreezeUsedToday = false;
      
      // Reset weekly XP on Monday
      const dayOfWeek = todayDate.getDay();
      if (dayOfWeek === 1) {
        state.weeklyXP = 0;
      }
    }
    
    return state;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function saveState(state: SRSGamificationState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Record a card review and calculate XP earned
 */
export async function recordCardReview(params: {
  correct: boolean;
  firstTry: boolean;
  onTime: boolean; // Was the card reviewed before it became overdue?
}): Promise<ReviewResult> {
  const state = await loadState();
  const today = getToday();
  const isNewDay = state.lastReviewDate !== today;
  
  // Update streak on first review of the day
  if (isNewDay) {
    state.currentStreak += 1;
    if (state.currentStreak > state.longestStreak) {
      state.longestStreak = state.currentStreak;
    }
    state.lastReviewDate = today;
  }
  
  // Calculate XP
  let baseXP = XP_PER_CARD;
  if (params.correct) baseXP += XP_CORRECT_BONUS;
  if (params.firstTry && params.correct) baseXP += XP_FIRST_TRY_BONUS;
  if (params.onTime) baseXP += XP_ON_TIME_BONUS;
  
  // Apply streak multiplier
  const multiplier = getStreakMultiplier(state.currentStreak);
  const streakBonus = Math.round(baseXP * (multiplier - 1));
  let totalXP = baseXP + streakBonus;
  
  // Track perfect recall
  if (!params.correct || !params.firstTry) {
    state.perfectRecallToday = false;
  }
  
  // Update counters
  state.cardsReviewedToday += 1;
  
  // Perfect recall bonus (checked at end of session)
  let perfectRecallBonus = 0;
  
  // Daily goal bonus
  if (state.cardsReviewedToday === DAILY_GOAL_CARDS) {
    totalXP += DAILY_GOAL_BONUS;
  }
  
  // Update XP
  state.totalXP += totalXP;
  state.todayXP += totalXP;
  state.weeklyXP += totalXP;
  
  // Update level
  const { level, xpToNext } = getLevel(state.totalXP);
  const levelUp = level > state.level;
  state.level = level;
  state.xpToNextLevel = xpToNext;
  
  // Check for new badges
  const newBadges: Badge[] = [];
  const earnedIds = new Set(state.badges.map((b) => b.id));
  
  for (const def of BADGE_DEFINITIONS) {
    if (!earnedIds.has(def.id) && def.check(state)) {
      const badge: Badge = {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        earnedAt: Date.now(),
        category: def.category,
      };
      state.badges.push(badge);
      newBadges.push(badge);
    }
  }
  
  await saveState(state);
  
  // Generate message
  let message = `+${totalXP} XP`;
  if (streakBonus > 0) message += ` (${state.currentStreak}-day streak bonus!)`;
  if (levelUp) message = `🎉 Level ${level}! ${message}`;
  if (newBadges.length > 0) message += ` | New badge: ${newBadges[0].icon} ${newBadges[0].name}`;
  
  return {
    xpEarned: totalXP,
    streakBonus,
    perfectRecallBonus,
    newBadges,
    levelUp,
    newLevel: level,
    message,
  };
}

/**
 * Complete a review session — awards perfect recall bonus if applicable
 */
export async function completeReviewSession(): Promise<ReviewResult | null> {
  const state = await loadState();
  
  if (state.perfectRecallToday && state.cardsReviewedToday >= 5) {
    // Award perfect recall bonus
    state.totalXP += PERFECT_RECALL_BONUS;
    state.todayXP += PERFECT_RECALL_BONUS;
    state.weeklyXP += PERFECT_RECALL_BONUS;
    state.consecutivePerfectDays += 1;
    
    const { level, xpToNext } = getLevel(state.totalXP);
    const levelUp = level > state.level;
    state.level = level;
    state.xpToNextLevel = xpToNext;
    
    // Check for perfect recall badges
    const newBadges: Badge[] = [];
    const earnedIds = new Set(state.badges.map((b) => b.id));
    for (const def of BADGE_DEFINITIONS) {
      if (!earnedIds.has(def.id) && def.check(state)) {
        const badge: Badge = {
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          earnedAt: Date.now(),
          category: def.category,
        };
        state.badges.push(badge);
        newBadges.push(badge);
      }
    }
    
    await saveState(state);
    
    return {
      xpEarned: PERFECT_RECALL_BONUS,
      streakBonus: 0,
      perfectRecallBonus: PERFECT_RECALL_BONUS,
      newBadges,
      levelUp,
      newLevel: level,
      message: `🎯 Perfect Recall! +${PERFECT_RECALL_BONUS} XP bonus`,
    };
  }
  
  return null;
}

/**
 * Get current gamification state for UI display
 */
export async function getGamificationState(): Promise<SRSGamificationState> {
  return loadState();
}

/**
 * Get all earned badges
 */
export async function getBadges(): Promise<Badge[]> {
  const state = await loadState();
  return state.badges;
}

/**
 * Get streak info
 */
export async function getStreakInfo(): Promise<{
  current: number;
  longest: number;
  multiplier: number;
  freezeAvailable: boolean;
}> {
  const state = await loadState();
  return {
    current: state.currentStreak,
    longest: state.longestStreak,
    multiplier: getStreakMultiplier(state.currentStreak),
    freezeAvailable: state.streakFreezeAvailable,
  };
}

/**
 * Use a streak freeze (prevents streak from breaking for 1 missed day)
 */
export async function useStreakFreeze(): Promise<boolean> {
  const state = await loadState();
  if (!state.streakFreezeAvailable) return false;
  state.streakFreezeAvailable = false;
  state.streakFreezeUsedToday = true;
  await saveState(state);
  return true;
}

/**
 * Award a streak freeze (e.g., from completing a challenge or purchase)
 */
export async function awardStreakFreeze(): Promise<void> {
  const state = await loadState();
  state.streakFreezeAvailable = true;
  await saveState(state);
}

/**
 * Get XP progress for level display
 */
export async function getLevelProgress(): Promise<{
  level: number;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number; // 0-1
}> {
  const state = await loadState();
  const currentThreshold = LEVEL_THRESHOLDS[state.level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[state.level] || currentThreshold + 50000;
  const xpInLevel = state.totalXP - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  
  return {
    level: state.level,
    totalXP: state.totalXP,
    currentLevelXP: xpInLevel,
    nextLevelXP: xpNeeded,
    progress: Math.min(xpInLevel / xpNeeded, 1),
  };
}

/**
 * Get weekly leaderboard data (local only — shows daily XP for the week)
 */
export async function getWeeklyProgress(): Promise<DailyRecord[]> {
  const state = await loadState();
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  const weekStartStr = weekStart.toISOString().split("T")[0];
  
  return state.dailyHistory.filter((d) => d.date >= weekStartStr);
}
