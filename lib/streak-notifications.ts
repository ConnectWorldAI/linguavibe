/**
 * Daily Streak Notification Reminder
 * Schedules a recurring local notification to remind users to maintain their streak.
 * If the user hasn't opened the app by their scheduled study time, they get a push.
 * Includes motivational streak-aware messages and practice completion hooks.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STREAK_NOTIFICATION_ID = "daily-streak-reminder";
const STORAGE_KEY = "@streak_notification_settings";

export interface StreakNotificationSettings {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
  currentStreak: number;
}

const DEFAULT_SETTINGS: StreakNotificationSettings = {
  enabled: true,
  hour: 9,
  minute: 0,
  currentStreak: 0,
};

// ─── Motivational Messages (streak-aware) ───────────────────────────────────
const STREAK_MESSAGES = [
  { title: "Keep your streak alive!", body: "You're on a {streak}-day streak. Don't break it now!" },
  { title: "Time to practice!", body: "Just 5 minutes keeps your {streak}-day streak going." },
  { title: "Your streak is waiting!", body: "{streak} days strong. Let's make it {next}!" },
  { title: "Don't lose your progress!", body: "Practice today to keep your {streak}-day streak." },
  { title: "Quick session?", body: "A few minutes of practice protects your {streak}-day streak." },
  { title: "Streak check!", body: "Day {next} is calling. Keep the momentum going!" },
  { title: "You're on fire!", body: "{streak} days in a row. Let's add one more!" },
  { title: "Daily reminder", body: "Your language skills grow every day. Streak: {streak} days." },
];

function getStreakMessage(streak: number): { title: string; body: string } {
  const idx = streak % STREAK_MESSAGES.length;
  const template = STREAK_MESSAGES[idx];
  return {
    title: template.title,
    body: template.body
      .replace(/{streak}/g, String(streak))
      .replace(/{next}/g, String(streak + 1)),
  };
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("streak-reminders", {
      name: "Streak Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00AAFF",
      description: "Daily reminders to maintain your learning streak",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

/**
 * Schedule the daily streak reminder notification
 */
export async function scheduleStreakReminder(
  settings?: Partial<StreakNotificationSettings>
): Promise<void> {
  if (Platform.OS === "web") return;

  const currentSettings = await getStreakNotificationSettings();
  const merged = { ...currentSettings, ...settings };

  // Cancel existing reminder first
  await cancelStreakReminder();

  if (!merged.enabled) {
    await saveStreakNotificationSettings(merged);
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Get streak-aware message
  const streak = merged.currentStreak || 1;
  const { title, body } = getStreakMessage(streak);

  // Schedule daily recurring notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: "streak-reminder", action: "open-learn", deepLink: "/(tabs)", streak },
      sound: true,
      ...(Platform.OS === "android" && { channelId: "streak-reminders" }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: merged.hour,
      minute: merged.minute,
      repeats: true,
    },
    identifier: STREAK_NOTIFICATION_ID,
  });

  await saveStreakNotificationSettings(merged);
}

/**
 * Cancel the daily streak reminder
 */
export async function cancelStreakReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIFICATION_ID);
  } catch {
    // Notification may not exist yet, that's fine
  }
}

/**
 * Get current notification settings
 */
export async function getStreakNotificationSettings(): Promise<StreakNotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

/**
 * Save notification settings
 */
async function saveStreakNotificationSettings(
  settings: StreakNotificationSettings
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Call this when user completes any learning activity.
 * Updates streak and reschedules notification with new message.
 */
export async function markTodayAsPracticed(newStreak?: number): Promise<{ firstToday: boolean }> {
  const today = new Date().toISOString().split("T")[0];
  const lastPractice = await AsyncStorage.getItem("@last_practice_date");
  const firstToday = lastPractice !== today;
  await AsyncStorage.setItem("@last_practice_date", today);

  // Update streak count in settings and reschedule with fresh message
  if (newStreak !== undefined) {
    const settings = await getStreakNotificationSettings();
    await scheduleStreakReminder({ ...settings, currentStreak: newStreak });
  }
  return { firstToday };
}

/**
 * Check if user practiced today
 */
export async function hasUserPracticedToday(): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const lastPractice = await AsyncStorage.getItem("@last_practice_date");
  return lastPractice === today;
}

/**
 * Setup notification handler for foreground notifications
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Initialize streak notifications on app startup.
 * Checks if reminders are enabled and schedules if needed.
 */
export async function initStreakNotifications(): Promise<void> {
  if (Platform.OS === "web") return;

  const settings = await getStreakNotificationSettings();
  if (!settings.enabled) return;

  // Check if user already practiced today
  const practiced = await hasUserPracticedToday();
  if (practiced) return; // No need to remind today

  // Schedule/reschedule reminder
  await scheduleStreakReminder(settings);
}

/**
 * Update the reminder time and reschedule.
 */
export async function updateReminderTime(hour: number, minute: number): Promise<void> {
  const settings = await getStreakNotificationSettings();
  await scheduleStreakReminder({ ...settings, hour, minute });
}

/**
 * Toggle streak notifications on/off.
 */
export async function toggleStreakNotifications(enabled: boolean): Promise<void> {
  const settings = await getStreakNotificationSettings();
  if (enabled) {
    await scheduleStreakReminder({ ...settings, enabled: true });
  } else {
    await cancelStreakReminder();
    await saveStreakNotificationSettings({ ...settings, enabled: false });
  }
}

/**
 * Get available reminder time options for the settings UI
 */
export const REMINDER_TIMES = [
  { label: "6:00 AM", hour: 6, minute: 0 },
  { label: "7:00 AM", hour: 7, minute: 0 },
  { label: "8:00 AM", hour: 8, minute: 0 },
  { label: "9:00 AM", hour: 9, minute: 0 },
  { label: "10:00 AM", hour: 10, minute: 0 },
  { label: "12:00 PM", hour: 12, minute: 0 },
  { label: "2:00 PM", hour: 14, minute: 0 },
  { label: "5:00 PM", hour: 17, minute: 0 },
  { label: "7:00 PM", hour: 19, minute: 0 },
  { label: "9:00 PM", hour: 21, minute: 0 },
];
