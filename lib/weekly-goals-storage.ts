/**
 * Weekly Goals Storage Module
 * 
 * Shared storage functions for weekly goals, used by both the Weekly Goals screen
 * and the weekly report card generation system.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type GoalCategory =
  | "error_patterns"
  | "study_time"
  | "sessions"
  | "accuracy"
  | "flashcards"
  | "conversations"
  | "drills"
  | "streak"
  | "lessons"
  | "mastery"
  | "custom";

export interface WeeklyGoal {
  id: string;
  category: GoalCategory;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  icon: string;
  color: string;
  createdAt: string;
  weekStartDate: string;
  completed: boolean;
}

export interface GoalHistory {
  weekStartDate: string;
  weekEndDate: string;
  goals: WeeklyGoal[];
  overallScore: number; // 0-100
  grade: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GOALS_KEY = "@weekly_goals_current";
const GOAL_HISTORY_KEY = "@weekly_goals_history";

// ─── Storage Functions ──────────────────────────────────────────────────────

export async function getCurrentGoals(): Promise<WeeklyGoal[]> {
  try {
    const data = await AsyncStorage.getItem(GOALS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveCurrentGoals(goals: WeeklyGoal[]): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export async function getGoalHistory(): Promise<GoalHistory[]> {
  try {
    const data = await AsyncStorage.getItem(GOAL_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveGoalHistory(history: GoalHistory[]): Promise<void> {
  await AsyncStorage.setItem(GOAL_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Grade goals for the current week. Called by the weekly report system.
 */
export function gradeGoals(goals: WeeklyGoal[]): { score: number; grade: string } {
  if (goals.length === 0) return { score: 0, grade: "N/A" };

  let totalProgress = 0;
  for (const goal of goals) {
    const progress = Math.min(goal.currentValue / goal.targetValue, 1.5); // Cap at 150%
    totalProgress += progress;
  }
  const avgProgress = totalProgress / goals.length;
  const score = Math.round(avgProgress * 100);

  let grade = "F";
  if (score >= 95) grade = "A+";
  else if (score >= 85) grade = "A";
  else if (score >= 78) grade = "B+";
  else if (score >= 70) grade = "B";
  else if (score >= 62) grade = "C+";
  else if (score >= 55) grade = "C";
  else if (score >= 40) grade = "D";

  return { score, grade };
}

/**
 * Update a specific goal's current value (used by adaptive engine hooks)
 */
export async function updateGoalProgress(
  category: GoalCategory,
  increment: number
): Promise<void> {
  const goals = await getCurrentGoals();
  let updated = false;
  let justCompleted = false;
  for (const goal of goals) {
    if (goal.category === category && !goal.completed) {
      goal.currentValue += increment;
      if (goal.currentValue >= goal.targetValue) {
        goal.completed = true;
        justCompleted = true;
      }
      updated = true;
      break;
    }
  }
  if (updated) {
    await saveCurrentGoals(goals);
  }
  // Celebrate when a goal is completed
  if (justCompleted) {
    try {
      const { celebrateDailyGoalComplete } = require("@/lib/milestone-celebration");
      celebrateDailyGoalComplete();
    } catch {}
  }
}

/**
 * Archive current goals to history and reset for new week
 */
export async function archiveAndResetGoals(): Promise<void> {
  const goals = await getCurrentGoals();
  if (goals.length === 0) return;

  const { score, grade } = gradeGoals(goals);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const historyEntry: GoalHistory = {
    weekStartDate: weekStart.toISOString(),
    weekEndDate: now.toISOString(),
    goals: [...goals],
    overallScore: score,
    grade,
  };

  const history = await getGoalHistory();
  history.unshift(historyEntry);
  // Keep last 52 weeks
  if (history.length > 52) history.length = 52;
  await saveGoalHistory(history);

  // Check for streak milestone celebration
  try {
    const { calculateGoalStreak } = require("@/lib/goal-streak");
    const { celebrateStreakMilestone, isStreakMilestone } = require("@/lib/milestone-celebration");
    const streak = await calculateGoalStreak();
    if (isStreakMilestone(streak.currentStreak)) {
      celebrateStreakMilestone(streak.currentStreak);
    }
  } catch {}

  // Reset current goals (keep same targets, zero out progress)
  const resetGoals = goals.map(g => ({
    ...g,
    currentValue: 0,
    completed: false,
    weekStartDate: now.toISOString(),
  }));
  await saveCurrentGoals(resetGoals);
}
