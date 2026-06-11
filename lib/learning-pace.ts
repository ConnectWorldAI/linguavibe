/**
 * Learning Pace Tracker
 * Calculates whether the user is on-track, ahead, or behind their fluency/certification goal.
 * Works like a "billable hours" system — tracks required vs. actual study time.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const PACE_STORAGE_KEY = "@learning_pace_goal";
const PRACTICE_LOG_KEY = "@practice_log";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LearningStyle = "visual" | "auditory" | "conversational" | "reading" | "mixed";

export type GoalType = "fluency" | "certification" | "travel" | "career" | "personal";

export interface LearningGoal {
  id: string;
  language: string;
  goalType: GoalType;
  targetLevel: string; // e.g., "B2", "JLPT N3", "Fluent"
  targetDate: string; // ISO date
  createdAt: string;
  learningStyle: LearningStyle;
  availableMinutesPerDay: number;
  availableDaysPerWeek: number;
  workSchedule?: string; // e.g., "9-5 Mon-Fri"
  prioritySkills: SkillPriority[];
}

export interface SkillPriority {
  skill: "speaking" | "listening" | "reading" | "writing" | "grammar" | "vocabulary";
  weight: number; // 0-1, how much time should go here
  recommendedMinutes: number; // daily recommended
}

export interface PracticeEntry {
  date: string; // ISO date
  minutesSpent: number;
  skill: string;
  activity: string; // e.g., "lesson", "flashcard", "call", "song"
}

export interface PaceStatus {
  status: "on-track" | "ahead" | "behind" | "at-risk";
  percentComplete: number; // 0-100
  expectedPercent: number; // where they should be by now
  totalMinutesRequired: number;
  totalMinutesCompleted: number;
  minutesBehind: number; // positive = behind, negative = ahead
  daysRemaining: number;
  dailyMinutesNeeded: number; // to get back on track
  catchUpMessage: string;
  skillBreakdown: SkillProgress[];
  weeklyTarget: number; // minutes per week needed
  currentWeekMinutes: number;
}

export interface SkillProgress {
  skill: string;
  targetMinutes: number;
  actualMinutes: number;
  percentComplete: number;
  status: "on-track" | "ahead" | "behind";
}

// ─── Research-Based Skill Weights ────────────────────────────────────────────
// Based on language acquisition research: speaking and listening are most impactful

const DEFAULT_SKILL_WEIGHTS: Record<LearningStyle, SkillPriority[]> = {
  conversational: [
    { skill: "speaking", weight: 0.35, recommendedMinutes: 15 },
    { skill: "listening", weight: 0.30, recommendedMinutes: 12 },
    { skill: "vocabulary", weight: 0.15, recommendedMinutes: 6 },
    { skill: "grammar", weight: 0.10, recommendedMinutes: 4 },
    { skill: "reading", weight: 0.05, recommendedMinutes: 2 },
    { skill: "writing", weight: 0.05, recommendedMinutes: 2 },
  ],
  auditory: [
    { skill: "listening", weight: 0.35, recommendedMinutes: 15 },
    { skill: "speaking", weight: 0.25, recommendedMinutes: 10 },
    { skill: "vocabulary", weight: 0.15, recommendedMinutes: 6 },
    { skill: "grammar", weight: 0.10, recommendedMinutes: 4 },
    { skill: "reading", weight: 0.10, recommendedMinutes: 4 },
    { skill: "writing", weight: 0.05, recommendedMinutes: 2 },
  ],
  visual: [
    { skill: "reading", weight: 0.25, recommendedMinutes: 10 },
    { skill: "vocabulary", weight: 0.20, recommendedMinutes: 8 },
    { skill: "listening", weight: 0.20, recommendedMinutes: 8 },
    { skill: "speaking", weight: 0.15, recommendedMinutes: 6 },
    { skill: "grammar", weight: 0.15, recommendedMinutes: 6 },
    { skill: "writing", weight: 0.05, recommendedMinutes: 2 },
  ],
  reading: [
    { skill: "reading", weight: 0.30, recommendedMinutes: 12 },
    { skill: "writing", weight: 0.20, recommendedMinutes: 8 },
    { skill: "vocabulary", weight: 0.20, recommendedMinutes: 8 },
    { skill: "grammar", weight: 0.15, recommendedMinutes: 6 },
    { skill: "listening", weight: 0.10, recommendedMinutes: 4 },
    { skill: "speaking", weight: 0.05, recommendedMinutes: 2 },
  ],
  mixed: [
    { skill: "speaking", weight: 0.25, recommendedMinutes: 10 },
    { skill: "listening", weight: 0.25, recommendedMinutes: 10 },
    { skill: "vocabulary", weight: 0.15, recommendedMinutes: 6 },
    { skill: "reading", weight: 0.15, recommendedMinutes: 6 },
    { skill: "grammar", weight: 0.10, recommendedMinutes: 4 },
    { skill: "writing", weight: 0.10, recommendedMinutes: 4 },
  ],
};

// Estimated total hours to reach each CEFR level from zero
const HOURS_TO_LEVEL: Record<string, number> = {
  A1: 80,
  A2: 200,
  B1: 400,
  B2: 600,
  C1: 800,
  C2: 1000,
  "Fluent": 700,
  "JLPT N5": 150,
  "JLPT N4": 300,
  "JLPT N3": 500,
  "JLPT N2": 750,
  "JLPT N1": 1000,
  "DELF A1": 80,
  "DELF A2": 200,
  "DELF B1": 400,
  "DELF B2": 600,
  "HSK 1": 100,
  "HSK 2": 200,
  "HSK 3": 400,
  "HSK 4": 600,
  "HSK 5": 800,
  "HSK 6": 1000,
};

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Save a learning goal
 */
export async function saveLearningGoal(goal: LearningGoal): Promise<void> {
  await AsyncStorage.setItem(PACE_STORAGE_KEY, JSON.stringify(goal));
}

/**
 * Get the active learning goal
 */
export async function getLearningGoal(): Promise<LearningGoal | null> {
  try {
    const stored = await AsyncStorage.getItem(PACE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Log a practice session
 */
export async function logPractice(entry: PracticeEntry): Promise<void> {
  const log = await getPracticeLog();
  log.push(entry);
  // Keep last 365 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  const filtered = log.filter((e) => new Date(e.date) >= cutoff);
  await AsyncStorage.setItem(PRACTICE_LOG_KEY, JSON.stringify(filtered));
}

/**
 * Get all practice log entries
 */
export async function getPracticeLog(): Promise<PracticeEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(PRACTICE_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Calculate the current pace status
 */
export async function calculatePaceStatus(): Promise<PaceStatus | null> {
  const goal = await getLearningGoal();
  if (!goal) return null;

  const log = await getPracticeLog();
  const now = new Date();
  const targetDate = new Date(goal.targetDate);
  const createdDate = new Date(goal.createdAt);

  // Total time span
  const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(1, Math.ceil((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Total minutes required (based on target level)
  const hoursNeeded = HOURS_TO_LEVEL[goal.targetLevel] || 400;
  const totalMinutesRequired = hoursNeeded * 60;

  // Total minutes completed (from practice log since goal creation)
  const relevantLog = log.filter((e) => new Date(e.date) >= createdDate);
  const totalMinutesCompleted = relevantLog.reduce((sum, e) => sum + e.minutesSpent, 0);

  // Expected progress by now
  const expectedPercent = Math.min(100, (elapsedDays / totalDays) * 100);
  const percentComplete = Math.min(100, (totalMinutesCompleted / totalMinutesRequired) * 100);

  // How far behind/ahead
  const expectedMinutes = (elapsedDays / totalDays) * totalMinutesRequired;
  const minutesBehind = expectedMinutes - totalMinutesCompleted;

  // Daily minutes needed to catch up
  const remainingMinutes = totalMinutesRequired - totalMinutesCompleted;
  const dailyMinutesNeeded = daysRemaining > 0 ? Math.ceil(remainingMinutes / daysRemaining) : 0;

  // Weekly target
  const weeklyTarget = dailyMinutesNeeded * goal.availableDaysPerWeek;

  // Current week minutes
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const currentWeekMinutes = relevantLog
    .filter((e) => new Date(e.date) >= weekStart)
    .reduce((sum, e) => sum + e.minutesSpent, 0);

  // Determine status
  let status: PaceStatus["status"];
  const paceRatio = percentComplete / Math.max(1, expectedPercent);
  if (paceRatio >= 1.1) status = "ahead";
  else if (paceRatio >= 0.8) status = "on-track";
  else if (paceRatio >= 0.5) status = "behind";
  else status = "at-risk";

  // Generate catch-up message
  let catchUpMessage: string;
  if (status === "ahead") {
    catchUpMessage = `Great work! You're ${Math.round((paceRatio - 1) * 100)}% ahead of schedule. Keep it up!`;
  } else if (status === "on-track") {
    catchUpMessage = `You're on pace to reach ${goal.targetLevel} by your target date. Stay consistent!`;
  } else if (status === "behind") {
    const extraMin = Math.ceil(minutesBehind / Math.max(1, daysRemaining));
    catchUpMessage = `You're ${Math.round(minutesBehind)} minutes behind. Add ${extraMin} extra min/day to catch up.`;
  } else {
    catchUpMessage = `You're significantly behind. Consider extending your target date or increasing daily study time.`;
  }

  // Skill breakdown
  const skillBreakdown: SkillProgress[] = goal.prioritySkills.map((sp) => {
    const skillMinutes = relevantLog
      .filter((e) => e.skill === sp.skill)
      .reduce((sum, e) => sum + e.minutesSpent, 0);
    const targetMinutes = sp.weight * totalMinutesRequired;
    const pct = Math.min(100, (skillMinutes / Math.max(1, targetMinutes)) * 100);
    const expectedPct = expectedPercent;
    let skillStatus: "on-track" | "ahead" | "behind" = "on-track";
    if (pct >= expectedPct * 1.1) skillStatus = "ahead";
    else if (pct < expectedPct * 0.8) skillStatus = "behind";
    return {
      skill: sp.skill,
      targetMinutes,
      actualMinutes: skillMinutes,
      percentComplete: pct,
      status: skillStatus,
    };
  });

  return {
    status,
    percentComplete,
    expectedPercent,
    totalMinutesRequired,
    totalMinutesCompleted,
    minutesBehind,
    daysRemaining,
    dailyMinutesNeeded,
    catchUpMessage,
    skillBreakdown,
    weeklyTarget,
    currentWeekMinutes,
  };
}

/**
 * Get default skill priorities for a learning style
 */
export function getDefaultSkillPriorities(style: LearningStyle): SkillPriority[] {
  return DEFAULT_SKILL_WEIGHTS[style];
}

/**
 * Get estimated hours for a target level
 */
export function getEstimatedHours(targetLevel: string): number {
  return HOURS_TO_LEVEL[targetLevel] || 400;
}

/**
 * Get all available target levels
 */
export function getAvailableTargetLevels(): string[] {
  return Object.keys(HOURS_TO_LEVEL);
}
