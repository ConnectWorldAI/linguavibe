/**
 * Weekly Achievements Digest — Schedules a weekly notification summarizing
 * badges earned and XP progress for the week.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { shouldPlayNotificationSound } from "@/lib/sound-settings";

const DIGEST_SETTINGS_KEY = "@weekly_digest_settings";
const DIGEST_HISTORY_KEY = "@weekly_digest_history";
const DIGEST_NOTIFICATION_ID = "weekly-digest-notification";

export interface WeeklyDigestSettings {
  isEnabled: boolean;
  /** Day of week: 0=Sunday, 1=Monday, ... 6=Saturday */
  dayOfWeek: number;
  /** Hour to send (0-23) */
  hour: number;
  /** Minute to send (0-59) */
  minute: number;
}

export interface WeeklyDigestEntry {
  weekStartDate: string; // YYYY-MM-DD
  xpEarned: number;
  badgesUnlocked: string[];
  exercisesCompleted: number;
  streakDays: number;
  generatedAt: number; // timestamp
}

export const DEFAULT_DIGEST_SETTINGS: WeeklyDigestSettings = {
  isEnabled: true,
  dayOfWeek: 0, // Sunday
  hour: 10,
  minute: 0,
};

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ─── SETTINGS ───────────────────────────────────────────────────────────────

export async function getWeeklyDigestSettings(): Promise<WeeklyDigestSettings> {
  try {
    const stored = await AsyncStorage.getItem(DIGEST_SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_DIGEST_SETTINGS;
}

export async function setWeeklyDigestSettings(
  settings: WeeklyDigestSettings
): Promise<void> {
  await AsyncStorage.setItem(DIGEST_SETTINGS_KEY, JSON.stringify(settings));
  if (settings.isEnabled) {
    await scheduleWeeklyDigestNotification(settings);
  } else {
    await cancelWeeklyDigestNotification();
  }
}

// ─── NOTIFICATION SCHEDULING ────────────────────────────────────────────────

export async function scheduleWeeklyDigestNotification(
  settings: WeeklyDigestSettings
): Promise<void> {
  if (Platform.OS === "web") return;

  // Cancel existing
  await cancelWeeklyDigestNotification();

  // Request permissions
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") return;
  }

  // Check if notification sounds are enabled
  const soundEnabled = await shouldPlayNotificationSound();

  // Schedule weekly recurring notification
  await Notifications.scheduleNotificationAsync({
    identifier: DIGEST_NOTIFICATION_ID,
    content: {
      title: "📊 Your Weekly Progress",
      body: "Check out your weekly achievements digest — see how much you've grown!",
      sound: soundEnabled ? "default" : false,
      data: { type: "weekly_digest", deepLink: "xp-dashboard" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: settings.dayOfWeek + 1, // expo uses 1-7 (Sun=1)
      hour: settings.hour,
      minute: settings.minute,
    },
  });
}

export async function cancelWeeklyDigestNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(DIGEST_NOTIFICATION_ID);
  } catch {}
}

// ─── DIGEST HISTORY ─────────────────────────────────────────────────────────

export async function getDigestHistory(): Promise<WeeklyDigestEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(DIGEST_HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export async function saveDigestEntry(entry: WeeklyDigestEntry): Promise<void> {
  const history = await getDigestHistory();
  // Keep last 12 weeks
  const updated = [...history, entry].slice(-12);
  await AsyncStorage.setItem(DIGEST_HISTORY_KEY, JSON.stringify(updated));
}

/**
 * Generate the current week's digest summary.
 * Call this when the user opens the digest or when the notification fires.
 */
export async function generateWeeklyDigest(
  xpEarned: number,
  badgesUnlocked: string[],
  exercisesCompleted: number,
  streakDays: number
): Promise<WeeklyDigestEntry> {
  const now = new Date();
  // Get start of current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weekStartDate = startOfWeek.toISOString().split("T")[0]; // YYYY-MM-DD

  const entry: WeeklyDigestEntry = {
    weekStartDate,
    xpEarned,
    badgesUnlocked,
    exercisesCompleted,
    streakDays,
    generatedAt: Date.now(),
  };

  await saveDigestEntry(entry);
  return entry;
}

/**
 * Format a digest entry into a readable notification body.
 */
export function formatDigestMessage(entry: WeeklyDigestEntry): string {
  const parts: string[] = [];

  if (entry.xpEarned > 0) {
    parts.push(`⚡ ${entry.xpEarned} XP earned`);
  }

  if (entry.badgesUnlocked.length > 0) {
    parts.push(
      `🏆 ${entry.badgesUnlocked.length} badge${entry.badgesUnlocked.length > 1 ? "s" : ""} unlocked`
    );
  }

  if (entry.exercisesCompleted > 0) {
    parts.push(`📝 ${entry.exercisesCompleted} exercises completed`);
  }

  if (entry.streakDays > 0) {
    parts.push(`🔥 ${entry.streakDays}-day streak`);
  }

  if (parts.length === 0) {
    return "Start this week strong — complete an exercise to get your first XP!";
  }

  return parts.join(" • ");
}

/**
 * Check if digest is due (hasn't been generated this week).
 */
export async function isDigestDueThisWeek(): Promise<boolean> {
  const history = await getDigestHistory();
  if (history.length === 0) return true;

  const lastEntry = history[history.length - 1];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const currentWeekStart = startOfWeek.toISOString().split("T")[0];

  return lastEntry.weekStartDate !== currentWeekStart;
}
