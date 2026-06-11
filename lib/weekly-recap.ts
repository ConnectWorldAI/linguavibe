/**
 * Weekly Recap Push Notification
 * 
 * Schedules a recurring Sunday notification summarizing the week's progress:
 * total XP earned, days goal was met, current streak status, and badges earned.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { shouldPlayNotificationSound } from "@/lib/sound-settings";

// ─── Storage Keys ───
const WEEKLY_RECAP_ENABLED_KEY = "@connectworld_weekly_recap_enabled";
const WEEKLY_RECAP_TIME_KEY = "@connectworld_weekly_recap_time";
const WEEKLY_RECAP_NOTIFICATION_ID_KEY = "@connectworld_weekly_recap_notif_id";

// ─── Types ───
export interface WeeklyRecapSettings {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
}

export interface WeeklyRecapData {
  totalXP: number;
  daysGoalMet: number;
  currentStreak: number;
  badgesEarned: number;
  exerciseSessions: number;
}

// ─── Default Settings ───
const DEFAULT_SETTINGS: WeeklyRecapSettings = {
  enabled: true,
  hour: 18, // 6 PM Sunday
  minute: 0,
};

// ─── Core Functions ───

/**
 * Get current weekly recap notification settings
 */
export async function getWeeklyRecapSettings(): Promise<WeeklyRecapSettings> {
  try {
    const enabledRaw = await AsyncStorage.getItem(WEEKLY_RECAP_ENABLED_KEY);
    const timeRaw = await AsyncStorage.getItem(WEEKLY_RECAP_TIME_KEY);

    const enabled = enabledRaw !== null ? JSON.parse(enabledRaw) : DEFAULT_SETTINGS.enabled;
    const time = timeRaw ? JSON.parse(timeRaw) : { hour: DEFAULT_SETTINGS.hour, minute: DEFAULT_SETTINGS.minute };

    return { enabled, ...time };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save weekly recap notification settings and reschedule
 */
export async function saveWeeklyRecapSettings(settings: WeeklyRecapSettings): Promise<void> {
  await AsyncStorage.setItem(WEEKLY_RECAP_ENABLED_KEY, JSON.stringify(settings.enabled));
  await AsyncStorage.setItem(
    WEEKLY_RECAP_TIME_KEY,
    JSON.stringify({ hour: settings.hour, minute: settings.minute })
  );

  if (settings.enabled) {
    await scheduleWeeklyRecap(settings);
  } else {
    await cancelWeeklyRecap();
  }
}

/**
 * Schedule the weekly recap notification for every Sunday
 */
export async function scheduleWeeklyRecap(settings?: WeeklyRecapSettings): Promise<void> {
  if (Platform.OS === "web") return;

  const Notifications = await import("expo-notifications").catch(() => null);
  if (!Notifications) return;

  const recapSettings = settings || (await getWeeklyRecapSettings());
  if (!recapSettings.enabled) return;

  // Cancel existing notification first
  await cancelWeeklyRecap();

  // Check if notification sounds are enabled
  const soundEnabled = await shouldPlayNotificationSound();

  // Schedule for every Sunday (weekday 1 in expo-notifications = Sunday)
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "📊 Your Weekly Recap is Ready!",
      body: "See how much you accomplished this week — XP earned, goals met, and more!",
      data: { deepLink: "xp-dashboard", type: "weekly-recap" },
      sound: soundEnabled,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: recapSettings.hour,
      minute: recapSettings.minute,
    },
  });

  await AsyncStorage.setItem(WEEKLY_RECAP_NOTIFICATION_ID_KEY, notificationId);
}

/**
 * Cancel the weekly recap notification
 */
export async function cancelWeeklyRecap(): Promise<void> {
  if (Platform.OS === "web") return;

  const Notifications = await import("expo-notifications").catch(() => null);
  if (!Notifications) return;

  const existingId = await AsyncStorage.getItem(WEEKLY_RECAP_NOTIFICATION_ID_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
    await AsyncStorage.removeItem(WEEKLY_RECAP_NOTIFICATION_ID_KEY);
  }
}

/**
 * Build the recap notification body with real data
 * Called when the notification fires to generate dynamic content
 */
export function formatRecapMessage(data: WeeklyRecapData): string {
  const parts: string[] = [];

  if (data.totalXP > 0) {
    parts.push(`⚡ ${data.totalXP} XP earned`);
  }

  if (data.daysGoalMet > 0) {
    parts.push(`🎯 Goal met ${data.daysGoalMet}/7 days`);
  }

  if (data.currentStreak > 0) {
    parts.push(`🔥 ${data.currentStreak}-day streak`);
  }

  if (data.badgesEarned > 0) {
    parts.push(`🏅 ${data.badgesEarned} new badge${data.badgesEarned > 1 ? "s" : ""}`);
  }

  if (data.exerciseSessions > 0) {
    parts.push(`📝 ${data.exerciseSessions} exercise session${data.exerciseSessions > 1 ? "s" : ""}`);
  }

  if (parts.length === 0) {
    return "Start a new week strong! Set a daily XP goal and begin your first exercise.";
  }

  return parts.join(" • ");
}

/**
 * Check if weekly recap is currently enabled
 */
export async function isWeeklyRecapEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(WEEKLY_RECAP_ENABLED_KEY);
  if (raw === null) return DEFAULT_SETTINGS.enabled;
  return JSON.parse(raw);
}

/**
 * Toggle weekly recap on/off
 */
export async function toggleWeeklyRecap(): Promise<boolean> {
  const current = await isWeeklyRecapEnabled();
  const newValue = !current;
  const settings = await getWeeklyRecapSettings();
  await saveWeeklyRecapSettings({ ...settings, enabled: newValue });
  return newValue;
}
