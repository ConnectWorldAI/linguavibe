/**
 * CEFR Hour Tracker
 * 
 * Tracks learning hours by activity type per language, persisted in AsyncStorage.
 * Used to show certification progress — how many hours completed toward each CEFR level.
 * 
 * CEFR Standard Guided Learning Hours (cumulative):
 *   A1: ~100h | A2: ~200h | B1: ~400h | B2: ~600h | C1: ~800h | C2: ~1200h
 * 
 * These vary by language difficulty. We use FSI estimates for language-specific adjustments.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActivityType =
  | "whiteboard"
  | "visual_association"
  | "adaptive"
  | "conversation"
  | "grammar"
  | "pronunciation"
  | "vocabulary"
  | "cultural_discovery"
  | "story_choice"
  | "match_pairs"
  | "fill_order"
  | "grammar_comparison"
  | "listening"
  | "reading"
  | "writing"
  | "speaking"
  | "song_lesson"
  | "virtual_class"
  | "other";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LearningSession {
  id: string;
  activityType: ActivityType;
  durationMinutes: number;
  language: string;
  level: CEFRLevel;
  topic: string;
  accuracy?: number; // 0-1
  xpEarned?: number;
  timestamp: string; // ISO date
}

export interface LanguageProgress {
  language: string;
  totalHours: number;
  totalSessions: number;
  totalXP: number;
  currentLevel: CEFRLevel;
  hoursByActivity: Record<ActivityType, number>;
  hoursByLevel: Record<CEFRLevel, number>;
  recentSessions: LearningSession[]; // Last 50 sessions
  averageAccuracy: number;
  streak: number; // consecutive days
  lastSessionDate: string;
  startDate: string;
}

export interface CertificationProgress {
  currentLevel: CEFRLevel;
  nextLevel: CEFRLevel | null;
  hoursCompleted: number;
  hoursRequired: number;
  hoursToNextLevel: number;
  percentComplete: number;
  estimatedDaysToNextLevel: number; // Based on average daily pace
  averageDailyHours: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/**
 * CEFR cumulative hour requirements per level.
 * Based on Cambridge/Alliance Française/Instituto Cervantes estimates.
 */
const CEFR_HOURS: Record<CEFRLevel, number> = {
  A1: 100,
  A2: 200,
  B1: 400,
  B2: 600,
  C1: 800,
  C2: 1200,
};

/**
 * Language difficulty multipliers (FSI categories).
 * Category I (easiest for English speakers) = 1.0x
 * Category IV (hardest) = 2.2x
 */
const LANGUAGE_MULTIPLIERS: Record<string, number> = {
  // Category I — 24-30 weeks (600-750 hours)
  Spanish: 1.0,
  French: 1.0,
  Italian: 1.0,
  Portuguese: 1.0,
  Dutch: 1.0,
  Norwegian: 1.0,
  Swedish: 1.0,
  Danish: 1.0,
  Romanian: 1.0,

  // Category II — 36 weeks (900 hours)
  German: 1.2,
  Indonesian: 1.2,
  Malay: 1.2,
  Swahili: 1.2,

  // Category III — 44 weeks (1100 hours)
  Hindi: 1.5,
  Russian: 1.5,
  Turkish: 1.5,
  Polish: 1.5,
  Czech: 1.5,
  Greek: 1.5,
  Hebrew: 1.5,
  Thai: 1.5,
  Vietnamese: 1.5,

  // Category IV — 88 weeks (2200 hours)
  Arabic: 2.2,
  Chinese: 2.2,
  Mandarin: 2.2,
  Cantonese: 2.2,
  Japanese: 2.2,
  Korean: 2.2,
};

const LEVEL_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const STORAGE_KEY_PREFIX = "cefr_progress_";
const GLOBAL_STATS_KEY = "cefr_global_stats";

// ─── Helper Functions ───────────────────────────────────────────────────────

function getStorageKey(language: string): string {
  return `${STORAGE_KEY_PREFIX}${language.toLowerCase().replace(/\s+/g, "_")}`;
}

function getLanguageMultiplier(language: string): number {
  // Try exact match first, then case-insensitive
  const key = Object.keys(LANGUAGE_MULTIPLIERS).find(
    (k) => k.toLowerCase() === language.toLowerCase()
  );
  return key ? LANGUAGE_MULTIPLIERS[key] : 1.3; // Default to Category II-III
}

function getRequiredHours(level: CEFRLevel, language: string): number {
  const base = CEFR_HOURS[level];
  const multiplier = getLanguageMultiplier(language);
  return Math.round(base * multiplier);
}

function getNextLevel(current: CEFRLevel): CEFRLevel | null {
  const idx = LEVEL_ORDER.indexOf(current);
  return idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;
}

function getCurrentLevelFromHours(totalHours: number, language: string): CEFRLevel {
  const multiplier = getLanguageMultiplier(language);
  // Work backwards from C2 to find the highest completed level
  for (let i = LEVEL_ORDER.length - 1; i >= 0; i--) {
    const required = CEFR_HOURS[LEVEL_ORDER[i]] * multiplier;
    if (totalHours >= required) {
      // They've completed this level, so they're working on the next one
      return i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : "C2";
    }
  }
  return "A1";
}

function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getDayKey(date: string): string {
  return date.slice(0, 10); // YYYY-MM-DD
}

// ─── Core API ───────────────────────────────────────────────────────────────

/**
 * Load progress for a specific language.
 */
export async function getLanguageProgress(language: string): Promise<LanguageProgress> {
  try {
    const key = getStorageKey(language);
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("[CEFRTracker] Load error:", e);
  }

  // Return empty progress
  return {
    language,
    totalHours: 0,
    totalSessions: 0,
    totalXP: 0,
    currentLevel: "A1",
    hoursByActivity: {} as Record<ActivityType, number>,
    hoursByLevel: {} as Record<CEFRLevel, number>,
    recentSessions: [],
    averageAccuracy: 0,
    streak: 0,
    lastSessionDate: "",
    startDate: new Date().toISOString(),
  };
}

/**
 * Save progress for a specific language.
 */
async function saveLanguageProgress(progress: LanguageProgress): Promise<void> {
  try {
    const key = getStorageKey(progress.language);
    await AsyncStorage.setItem(key, JSON.stringify(progress));
  } catch (e) {
    console.error("[CEFRTracker] Save error:", e);
  }
}

/**
 * Log a learning session. This is the main entry point — call this
 * whenever any exercise/lesson/activity is completed.
 */
export async function logLearningSession(params: {
  activityType: ActivityType;
  durationMinutes: number;
  language: string;
  level?: CEFRLevel;
  topic?: string;
  accuracy?: number;
  xpEarned?: number;
}): Promise<LearningSession> {
  const progress = await getLanguageProgress(params.language);

  const session: LearningSession = {
    id: generateSessionId(),
    activityType: params.activityType,
    durationMinutes: Math.max(1, Math.round(params.durationMinutes)),
    language: params.language,
    level: params.level || progress.currentLevel,
    topic: params.topic || "General",
    accuracy: params.accuracy,
    xpEarned: params.xpEarned,
    timestamp: new Date().toISOString(),
  };

  // Update hours
  const hours = session.durationMinutes / 60;
  progress.totalHours += hours;
  progress.totalSessions += 1;
  progress.totalXP += session.xpEarned || 0;

  // Hours by activity
  const currentActivityHours = progress.hoursByActivity[session.activityType] || 0;
  progress.hoursByActivity[session.activityType] = currentActivityHours + hours;

  // Hours by level
  const currentLevelHours = progress.hoursByLevel[session.level] || 0;
  progress.hoursByLevel[session.level] = currentLevelHours + hours;

  // Update current level based on total hours
  progress.currentLevel = getCurrentLevelFromHours(progress.totalHours, params.language);

  // Average accuracy (rolling)
  if (session.accuracy !== undefined) {
    const totalWithAccuracy = progress.recentSessions.filter((s) => s.accuracy !== undefined).length;
    if (totalWithAccuracy > 0) {
      progress.averageAccuracy =
        (progress.averageAccuracy * totalWithAccuracy + session.accuracy) / (totalWithAccuracy + 1);
    } else {
      progress.averageAccuracy = session.accuracy;
    }
  }

  // Streak calculation
  const today = getDayKey(new Date().toISOString());
  const lastDay = progress.lastSessionDate ? getDayKey(progress.lastSessionDate) : "";
  if (lastDay === today) {
    // Same day, streak unchanged
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDayKey(yesterday.toISOString());
    if (lastDay === yesterdayKey) {
      progress.streak += 1;
    } else if (lastDay !== today) {
      progress.streak = 1; // Reset streak
    }
  }

  progress.lastSessionDate = session.timestamp;

  // Keep last 50 sessions
  progress.recentSessions.unshift(session);
  if (progress.recentSessions.length > 50) {
    progress.recentSessions = progress.recentSessions.slice(0, 50);
  }

  await saveLanguageProgress(progress);

  // Also update global stats
  await updateGlobalStats(session);

  return session;
}

/**
 * Get certification progress for a language — how close to next CEFR level.
 */
export async function getCertificationProgress(language: string): Promise<CertificationProgress> {
  const progress = await getLanguageProgress(language);
  const currentLevel = progress.currentLevel;
  const nextLevel = getNextLevel(currentLevel);

  // Hours required for current level (what they're working toward)
  const hoursRequired = getRequiredHours(currentLevel, language);

  // Hours completed toward this level
  // If they're at A1, they need 0-100h. If at B1, they need 200-400h, etc.
  const prevLevelIdx = LEVEL_ORDER.indexOf(currentLevel) - 1;
  const prevLevelHours =
    prevLevelIdx >= 0 ? getRequiredHours(LEVEL_ORDER[prevLevelIdx], language) : 0;
  const hoursInCurrentLevel = Math.max(0, progress.totalHours - prevLevelHours);
  const hoursNeededForLevel = hoursRequired - prevLevelHours;
  const hoursToNextLevel = Math.max(0, hoursNeededForLevel - hoursInCurrentLevel);
  const percentComplete = hoursNeededForLevel > 0
    ? Math.min(100, Math.round((hoursInCurrentLevel / hoursNeededForLevel) * 100))
    : 100;

  // Estimate days to next level based on average daily pace
  let averageDailyHours = 0;
  if (progress.startDate) {
    const daysSinceStart = Math.max(
      1,
      Math.ceil(
        (Date.now() - new Date(progress.startDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    averageDailyHours = progress.totalHours / daysSinceStart;
  }

  const estimatedDaysToNextLevel =
    averageDailyHours > 0 ? Math.ceil(hoursToNextLevel / averageDailyHours) : 999;

  return {
    currentLevel,
    nextLevel,
    hoursCompleted: Math.round(progress.totalHours * 10) / 10,
    hoursRequired,
    hoursToNextLevel: Math.round(hoursToNextLevel * 10) / 10,
    percentComplete,
    estimatedDaysToNextLevel,
    averageDailyHours: Math.round(averageDailyHours * 100) / 100,
  };
}

/**
 * Get all languages the user has studied.
 */
export async function getAllLanguages(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter((k) => k.startsWith(STORAGE_KEY_PREFIX))
      .map((k) => {
        const raw = k.replace(STORAGE_KEY_PREFIX, "");
        // Convert snake_case back to title case
        return raw
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      });
  } catch {
    return [];
  }
}

/**
 * Get progress for all languages at once.
 */
export async function getAllLanguageProgress(): Promise<LanguageProgress[]> {
  const languages = await getAllLanguages();
  const results: LanguageProgress[] = [];
  for (const lang of languages) {
    results.push(await getLanguageProgress(lang));
  }
  return results.sort((a, b) => b.totalHours - a.totalHours);
}

/**
 * Get the CEFR hour requirements table for a specific language.
 */
export function getCEFRRequirements(language: string): Array<{
  level: CEFRLevel;
  cumulativeHours: number;
  incrementalHours: number;
}> {
  const multiplier = getLanguageMultiplier(language);
  let prevHours = 0;
  return LEVEL_ORDER.map((level) => {
    const cumulative = Math.round(CEFR_HOURS[level] * multiplier);
    const incremental = cumulative - prevHours;
    prevHours = cumulative;
    return { level, cumulativeHours: cumulative, incrementalHours: incremental };
  });
}

/**
 * Get activity type display info (label, icon, color).
 */
export function getActivityDisplayInfo(type: ActivityType): {
  label: string;
  icon: string;
  color: string;
} {
  const map: Record<ActivityType, { label: string; icon: string; color: string }> = {
    whiteboard: { label: "Whiteboard", icon: "easel", color: "#6C63FF" },
    visual_association: { label: "Visual Cards", icon: "images", color: "#FF6B6B" },
    adaptive: { label: "Adaptive", icon: "bulb", color: "#FFD93D" },
    conversation: { label: "Conversation", icon: "chatbubbles", color: "#4ECDC4" },
    grammar: { label: "Grammar", icon: "book", color: "#45B7D1" },
    pronunciation: { label: "Pronunciation", icon: "mic", color: "#F093FB" },
    vocabulary: { label: "Vocabulary", icon: "library", color: "#A8E6CF" },
    cultural_discovery: { label: "Culture", icon: "globe", color: "#FF8A5C" },
    story_choice: { label: "Stories", icon: "document-text", color: "#C4B5FD" },
    match_pairs: { label: "Match Pairs", icon: "git-compare", color: "#67E8F9" },
    fill_order: { label: "Fill In", icon: "create", color: "#FCA5A5" },
    grammar_comparison: { label: "Grammar Compare", icon: "swap-horizontal", color: "#86EFAC" },
    listening: { label: "Listening", icon: "headset", color: "#818CF8" },
    reading: { label: "Reading", icon: "reader", color: "#FB923C" },
    writing: { label: "Writing", icon: "pencil", color: "#F472B6" },
    speaking: { label: "Speaking", icon: "volume-high", color: "#34D399" },
    song_lesson: { label: "Song Lessons", icon: "musical-notes", color: "#E879F9" },
    virtual_class: { label: "Virtual Class", icon: "videocam", color: "#38BDF8" },
    other: { label: "Other", icon: "ellipsis-horizontal", color: "#9CA3AF" },
  };
  return map[type] || map.other;
}

// ─── Global Stats ───────────────────────────────────────────────────────────

interface GlobalStats {
  totalHoursAllLanguages: number;
  totalSessionsAllLanguages: number;
  totalXPAllLanguages: number;
  languageCount: number;
}

async function updateGlobalStats(session: LearningSession): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(GLOBAL_STATS_KEY);
    const stats: GlobalStats = data
      ? JSON.parse(data)
      : { totalHoursAllLanguages: 0, totalSessionsAllLanguages: 0, totalXPAllLanguages: 0, languageCount: 0 };

    stats.totalHoursAllLanguages += session.durationMinutes / 60;
    stats.totalSessionsAllLanguages += 1;
    stats.totalXPAllLanguages += session.xpEarned || 0;

    const languages = await getAllLanguages();
    stats.languageCount = languages.length;

    await AsyncStorage.setItem(GLOBAL_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("[CEFRTracker] Global stats error:", e);
  }
}

export async function getGlobalStats(): Promise<GlobalStats> {
  try {
    const data = await AsyncStorage.getItem(GLOBAL_STATS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    totalHoursAllLanguages: 0,
    totalSessionsAllLanguages: 0,
    totalXPAllLanguages: 0,
    languageCount: 0,
  };
}

/**
 * Map exercise type names to ActivityType for logging.
 */
export function mapExerciseToActivity(exerciseType: string): ActivityType {
  const mapping: Record<string, ActivityType> = {
    story_choice: "story_choice",
    cultural_discovery: "cultural_discovery",
    conversation_chain: "conversation",
    match_pairs: "match_pairs",
    fill_order: "fill_order",
    grammar_comparison: "grammar_comparison",
    whiteboard_teaching: "whiteboard",
    visual_association: "visual_association",
    pronunciation: "pronunciation",
    vocabulary: "vocabulary",
    grammar: "grammar",
    listening: "listening",
    reading: "reading",
    writing: "writing",
    speaking: "speaking",
  };
  return mapping[exerciseType] || "adaptive";
}
