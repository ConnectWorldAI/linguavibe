/**
 * Daily XP Goal — Set a daily XP target with notification reminders.
 * Tracks progress throughout the day and sends a reminder if goal not met.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { shouldPlayNotificationSound } from "@/lib/sound-settings";

const DAILY_GOAL_KEY = "@daily_xp_goal";
const DAILY_PROGRESS_KEY = "@daily_xp_progress";
const REMINDER_NOTIFICATION_ID = "daily-xp-reminder";

export interface DailyXPGoal {
  targetXP: number;
  reminderHour: number; // 0-23
  reminderMinute: number; // 0-59
  isEnabled: boolean;
}

export interface DailyXPProgress {
  date: string; // YYYY-MM-DD
  earnedXP: number;
  goalMet: boolean;
}

const DEFAULT_GOAL: DailyXPGoal = {
  targetXP: 10,
  reminderHour: 20, // 8 PM
  reminderMinute: 0,
  isEnabled: false,
};

// ─── GOAL SETTINGS ──────────────────────────────────────────────────────────
export async function getDailyXPGoal(): Promise<DailyXPGoal> {
  try {
    const stored = await AsyncStorage.getItem(DAILY_GOAL_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_GOAL;
  } catch {
    return DEFAULT_GOAL;
  }
}

export async function setDailyXPGoal(goal: DailyXPGoal): Promise<void> {
  await AsyncStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(goal));
  if (goal.isEnabled) {
    await scheduleDailyReminder(goal);
  } else {
    await cancelDailyReminder();
  }
}

// ─── DAILY PROGRESS ─────────────────────────────────────────────────────────
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export async function getDailyProgress(): Promise<DailyXPProgress> {
  try {
    const stored = await AsyncStorage.getItem(DAILY_PROGRESS_KEY);
    if (stored) {
      const progress: DailyXPProgress = JSON.parse(stored);
      if (progress.date === getTodayKey()) {
        return progress;
      }
    }
    // New day or no data
    return { date: getTodayKey(), earnedXP: 0, goalMet: false };
  } catch {
    return { date: getTodayKey(), earnedXP: 0, goalMet: false };
  }
}

export async function addDailyXP(points: number): Promise<DailyXPProgress> {
  const progress = await getDailyProgress();
  const goal = await getDailyXPGoal();

  progress.earnedXP += points;
  progress.goalMet = progress.earnedXP >= goal.targetXP;

  await AsyncStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));
  return progress;
}

export async function checkDailyGoalMet(): Promise<boolean> {
  const progress = await getDailyProgress();
  const goal = await getDailyXPGoal();
  return progress.earnedXP >= goal.targetXP;
}

// ─── NOTIFICATION SCHEDULING ────────────────────────────────────────────────
async function scheduleDailyReminder(goal: DailyXPGoal): Promise<void> {
  if (Platform.OS === "web") return;

  // Cancel existing reminder first
  await cancelDailyReminder();

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  // Check if notification sounds are enabled
  const soundEnabled = await shouldPlayNotificationSound();

  // Schedule daily notification at the user's chosen time
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily XP Goal Reminder",
      body: `You haven't reached your ${goal.targetXP} XP goal today. Keep learning!`,
      sound: soundEnabled,
      data: { type: "daily_xp_reminder", deepLink: "xp-dashboard" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: goal.reminderHour,
      minute: goal.reminderMinute,
    },
    identifier: REMINDER_NOTIFICATION_ID,
  });
}

async function cancelDailyReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
  } catch {
    // Notification might not exist
  }
}

// ─── PRESET OPTIONS ─────────────────────────────────────────────────────────
export const XP_GOAL_PRESETS = [
  { label: "Casual", xp: 5, description: "5 XP/day — a few exercises" },
  { label: "Regular", xp: 10, description: "10 XP/day — steady progress" },
  { label: "Serious", xp: 20, description: "20 XP/day — dedicated learner" },
  { label: "Intense", xp: 30, description: "30 XP/day — power learner" },
];

export const REMINDER_TIME_PRESETS = [
  { label: "Morning", hour: 9, minute: 0 },
  { label: "Afternoon", hour: 14, minute: 0 },
  { label: "Evening", hour: 20, minute: 0 },
  { label: "Night", hour: 22, minute: 0 },
];
