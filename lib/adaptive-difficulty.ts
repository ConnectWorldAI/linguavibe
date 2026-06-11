/**
 * Adaptive Difficulty Engine
 * 
 * Uses heatmap data to automatically select words the user struggles
 * with most, creating personalized practice rounds.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type HeatmapSummary,
  type HeatmapCell,
  type CategoryStats,
  buildHeatmapSummary,
  getCachedHeatmap,
} from "./pronunciation-heatmap";
import {
  type DuelWord,
  type DuelCategory,
  type DuelGameMode,
  type DuelDifficulty,
  getDuelWords,
} from "./pronunciation-duel";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AdaptiveStrategy = "weakness_focus" | "balanced" | "challenge_up" | "review";

export interface AdaptiveProfile {
  userId: string;
  overallMastery: number;           // 0-100
  weakCategories: string[];         // sorted weakest first
  strongCategories: string[];       // sorted strongest first
  weakWords: string[];              // words with lowest accuracy
  strongWords: string[];            // words with highest accuracy
  recommendedDifficulty: DuelDifficulty;
  recommendedStrategy: AdaptiveStrategy;
  sessionsCompleted: number;
  lastUpdated: string;
}

export interface AdaptiveRound {
  words: DuelWord[];
  difficulty: DuelDifficulty;
  strategy: AdaptiveStrategy;
  focusCategory: DuelCategory;
  personalizedReason: string;
}

export interface AdaptiveSettings {
  enabled: boolean;
  weaknessFocusRatio: number;       // 0-1, how much to focus on weak words
  difficultyAutoAdjust: boolean;
  includeReviewWords: boolean;
  maxConsecutiveHardWords: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PROFILE_KEY = "@adaptive_difficulty_profile";
const SETTINGS_KEY = "@adaptive_difficulty_settings";
const SESSION_LOG_KEY = "@adaptive_session_log";

const DEFAULT_SETTINGS: AdaptiveSettings = {
  enabled: true,
  weaknessFocusRatio: 0.6,
  difficultyAutoAdjust: true,
  includeReviewWords: true,
  maxConsecutiveHardWords: 3,
};

const CATEGORY_MAP: Record<string, DuelCategory> = {
  abcs: "abcs",
  numbers: "numbers",
  adjectives: "adjectives",
  present_tense: "verbs_present",
  past_tense: "verbs_past",
  future_tense: "verbs_future",
  mixed: "mixed",
};

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getAdaptiveSettings(): Promise<AdaptiveSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export async function saveAdaptiveSettings(
  settings: Partial<AdaptiveSettings>,
): Promise<AdaptiveSettings> {
  const current = await getAdaptiveSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Profile Building ───────────────────────────────────────────────────────

function determineDifficulty(mastery: number): DuelDifficulty {
  if (mastery >= 80) return "hard";
  if (mastery >= 50) return "medium";
  return "easy";
}

function determineStrategy(
  mastery: number,
  sessionsCompleted: number,
): AdaptiveStrategy {
  if (sessionsCompleted < 3) return "balanced";
  if (mastery < 30) return "review";
  if (mastery < 60) return "weakness_focus";
  if (mastery >= 80) return "challenge_up";
  return "balanced";
}

export async function buildAdaptiveProfile(): Promise<AdaptiveProfile> {
  let summary: HeatmapSummary | null = null;

  try {
    summary = await getCachedHeatmap();
    if (!summary) {
      summary = await buildHeatmapSummary();
    }
  } catch {}

  // Get session count
  let sessionsCompleted = 0;
  try {
    const raw = await AsyncStorage.getItem(SESSION_LOG_KEY);
    if (raw) {
      const log = JSON.parse(raw);
      sessionsCompleted = Array.isArray(log) ? log.length : 0;
    }
  } catch {}

  if (!summary || summary?.totalWordsAttempted === 0) {
    return {
      userId: "current_user",
      overallMastery: 0,
      weakCategories: ["mixed"],
      strongCategories: [],
      weakWords: [],
      strongWords: [],
      recommendedDifficulty: "easy",
      recommendedStrategy: "balanced",
      sessionsCompleted,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Aggregate across all languages
  const allCells: HeatmapCell[] = [];
  const allCategoryStats: CategoryStats[] = [];

  for (const lang of summary.languages) {
    allCells.push(...lang.cells);
    allCategoryStats.push(...lang.categoryStats);
  }

  // Calculate overall mastery
  const totalCells = allCells.length;
  const masteredCells = allCells.filter(
    (c) => c.intensity === "mastered" || c.intensity === "strong",
  ).length;
  const overallMastery = totalCells > 0 ? (masteredCells / totalCells) * 100 : 0;

  // Find weak and strong categories
  const catAccuracyMap = new Map<string, { total: number; count: number }>();
  for (const stat of allCategoryStats) {
    const existing = catAccuracyMap.get(stat.category) || { total: 0, count: 0 };
    existing.total += stat?.averageScore * stat?.totalAttempts;
    existing.count += stat?.totalAttempts;
    catAccuracyMap.set(stat.category, existing);
  }

  const catAccuracies = Array.from(catAccuracyMap.entries())
    .map(([cat, data]) => ({
      category: cat,
      accuracy: data.count > 0 ? data.total / data.count : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakCategories = catAccuracies.slice(0, 3).map((c) => c.category);
  const strongCategories = catAccuracies
    .slice(-3)
    .reverse()
    .map((c) => c.category);

  // Find weak and strong words
  const sortedCells = [...allCells].sort(
    (a, b) => a.averageScore - b.averageScore,
  );
  const weakWords = sortedCells.slice(0, 10).map((c) => c.word);
  const strongWords = sortedCells
    .slice(-10)
    .reverse()
    .map((c) => c.word);

  const profile: AdaptiveProfile = {
    userId: "current_user",
    overallMastery: Math.round(overallMastery * 10) / 10,
    weakCategories,
    strongCategories,
    weakWords,
    strongWords,
    recommendedDifficulty: determineDifficulty(overallMastery),
    recommendedStrategy: determineStrategy(overallMastery, sessionsCompleted),
    sessionsCompleted,
    lastUpdated: new Date().toISOString(),
  };

  // Cache profile
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export async function getCachedProfile(): Promise<AdaptiveProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// ─── Adaptive Word Selection ────────────────────────────────────────────────

export async function getAdaptiveRound(
  mode: DuelGameMode,
  language: string = "Spanish",
  wordCount: number = 5,
): Promise<AdaptiveRound> {
  const settings = await getAdaptiveSettings();
  const profile = await buildAdaptiveProfile();

  if (!settings.enabled || profile.overallMastery === 0) {
    // No adaptive data — use default
    const words = getDuelWords(mode, "mixed", wordCount, language);
    return {
      words,
      difficulty: "medium",
      strategy: "balanced",
      focusCategory: "mixed",
      personalizedReason: "Starting fresh — let's see what you know!",
    };
  }

  const strategy = profile.recommendedStrategy;
  const difficulty = settings.difficultyAutoAdjust
    ? profile.recommendedDifficulty
    : "medium";

  // Determine focus category based on strategy
  let focusCategory: DuelCategory = "mixed";
  let personalizedReason = "";

  switch (strategy) {
    case "weakness_focus": {
      const weakCat = profile.weakCategories[0] || "mixed";
      focusCategory = (CATEGORY_MAP[weakCat] || "mixed") as DuelCategory;
      personalizedReason = `Focusing on ${formatCategoryName(focusCategory)} — your area with most room for improvement.`;
      break;
    }
    case "challenge_up": {
      // Pick a category they're good at but push difficulty
      const strongCat = profile.strongCategories[0] || "mixed";
      focusCategory = (CATEGORY_MAP[strongCat] || "mixed") as DuelCategory;
      personalizedReason = `You're excelling! Let's push your ${formatCategoryName(focusCategory)} to the next level.`;
      break;
    }
    case "review": {
      focusCategory = "mixed";
      personalizedReason = "Review mode — reinforcing what you've learned so far.";
      break;
    }
    default: {
      focusCategory = "mixed";
      personalizedReason = "Balanced practice across all categories.";
    }
  }

  // Get words with weakness weighting
  let words = getDuelWords(mode, focusCategory, wordCount, language);

  // If weakness_focus, try to include specific weak words
  if (strategy === "weakness_focus" && profile.weakWords.length > 0) {
    const weakCount = Math.ceil(wordCount * settings.weaknessFocusRatio);
    const regularCount = wordCount - weakCount;

    // Get some regular words
    const regularWords = getDuelWords(mode, focusCategory, regularCount + 5, language);

    // Try to find weak words in the regular pool or create them
    const weakPool = regularWords.filter((w) =>
      profile.weakWords.some(
        (ww) => w.text.toLowerCase().includes(ww.toLowerCase()) || ww.toLowerCase().includes(w.text.toLowerCase()),
      ),
    );

    if (weakPool.length > 0) {
      const selectedWeak = weakPool.slice(0, weakCount);
      const selectedRegular = regularWords
        .filter((w) => !selectedWeak.includes(w))
        .slice(0, regularCount);
      words = [...selectedWeak, ...selectedRegular].slice(0, wordCount);
    }
  }

  // Ensure we don't have too many consecutive hard words
  if (settings.maxConsecutiveHardWords > 0 && words.length > settings.maxConsecutiveHardWords) {
    // Shuffle to break up difficulty clusters
    words = words.sort(() => Math.random() - 0.5);
  }

  return {
    words,
    difficulty,
    strategy,
    focusCategory,
    personalizedReason,
  };
}

// ─── Session Logging ────────────────────────────────────────────────────────

export interface AdaptiveSessionLog {
  timestamp: string;
  strategy: AdaptiveStrategy;
  difficulty: DuelDifficulty;
  focusCategory: string;
  wordsAttempted: number;
  averageScore: number;
  language: string;
}

export async function logAdaptiveSession(log: AdaptiveSessionLog): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_LOG_KEY);
    const logs: AdaptiveSessionLog[] = raw ? JSON.parse(raw) : [];
    logs.push(log);
    // Keep last 100 sessions
    const trimmed = logs.slice(-100);
    await AsyncStorage.setItem(SESSION_LOG_KEY, JSON.stringify(trimmed));
  } catch {}
}

export async function getAdaptiveSessionLogs(): Promise<AdaptiveSessionLog[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_LOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// ─── Strategy Descriptions ──────────────────────────────────────────────────

export function getStrategyInfo(strategy: AdaptiveStrategy): {
  name: string;
  description: string;
  icon: string;
  color: string;
} {
  switch (strategy) {
    case "weakness_focus":
      return {
        name: "Weakness Focus",
        description: "Targeting your weakest areas for maximum improvement",
        icon: "fitness",
        color: "#FF6B35",
      };
    case "balanced":
      return {
        name: "Balanced",
        description: "Even mix across all categories",
        icon: "scale",
        color: "#00AAFF",
      };
    case "challenge_up":
      return {
        name: "Challenge Up",
        description: "Pushing your best skills to mastery level",
        icon: "rocket",
        color: "#E040FB",
      };
    case "review":
      return {
        name: "Review",
        description: "Reinforcing fundamentals for a solid foundation",
        icon: "refresh",
        color: "#00FF88",
      };
  }
}

export function getDifficultyInfo(difficulty: DuelDifficulty): {
  name: string;
  color: string;
  icon: string;
} {
  switch (difficulty) {
    case "easy":
      return { name: "Easy", color: "#00FF88", icon: "leaf" };
    case "medium":
      return { name: "Medium", color: "#FFB800", icon: "flame" };
    case "hard":
      return { name: "Hard", color: "#FF4444", icon: "skull" };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCategoryName(cat: string): string {
  const map: Record<string, string> = {
    abcs: "ABCs",
    numbers: "Numbers",
    adjectives: "Adjectives",
    present_tense: "Present Tense",
    past_tense: "Past Tense",
    future_tense: "Future Tense",
    mixed: "Mixed",
  };
  return map[cat] || cat;
}
