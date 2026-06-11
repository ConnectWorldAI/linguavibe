/**
 * Grammar Streak Notification Reminders
 * 
 * Schedules evening push notifications to remind users to review grammar
 * if they haven't done so yet today, helping them maintain their streak.
 * 
 * Flow:
 * 1. On app open / after grammar review, check if today's review is done
 * 2. Schedule a 7 PM local notification if no review recorded today
 * 3. Cancel the notification if user completes a grammar review
 * 4. Supports customizable reminder time via user preferences
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStreakData } from "./grammar-streak";

const STREAK_REMINDER_KEY = "@grammar_streak_reminder_prefs";
const LAST_SCHEDULED_KEY = "@grammar_streak_last_scheduled";

export interface StreakReminderPrefs {
  enabled: boolean;
  reminderHour: number; // 0-23
  reminderMinute: number; // 0-59
  motivationalMessages: boolean;
}

const DEFAULT_PREFS: StreakReminderPrefs = {
  enabled: true,
  reminderHour: 19, // 7 PM
  reminderMinute: 0,
  motivationalMessages: true,
};

const MOTIVATIONAL_MESSAGES = [
  "Your grammar streak is at risk! Just 5 minutes keeps it alive.",
  "Don't let your streak slip! A quick grammar review is all it takes.",
  "Your streak is counting on you! Open the app for a quick practice.",
  "Almost bedtime — have you reviewed grammar today? Keep that streak going!",
  "Your future fluent self will thank you. Quick grammar review?",
  "Streak alert! You haven't practiced grammar yet today.",
  "One quick grammar exercise = streak saved. You got this!",
  "Your streak is waiting! Tap to keep your momentum going.",
];

/**
 * Get streak reminder preferences
 */
export async function getStreakReminderPrefs(): Promise<StreakReminderPrefs> {
  try {
    const stored = await AsyncStorage.getItem(STREAK_REMINDER_KEY);
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PREFS;
}

/**
 * Save streak reminder preferences
 */
export async function saveStreakReminderPrefs(prefs: Partial<StreakReminderPrefs>): Promise<void> {
  try {
    const current = await getStreakReminderPrefs();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(STREAK_REMINDER_KEY, JSON.stringify(updated));
    // Reschedule with new prefs
    await scheduleGrammarStreakReminder();
  } catch {}
}

/**
 * Get a random motivational message for the notification
 */
function getMotivationalMessage(streakDays: number): { title: string; body: string } {
  if (streakDays >= 30) {
    return {
      title: `🔥 ${streakDays}-Day Streak at Risk!`,
      body: "You've built an incredible streak! Don't lose it — just one grammar exercise today.",
    };
  }
  if (streakDays >= 7) {
    return {
      title: `⚡ ${streakDays}-Day Streak Needs You!`,
      body: "You're on a roll! Quick grammar review to keep your streak alive.",
    };
  }
  if (streakDays >= 3) {
    return {
      title: "📚 Grammar Streak Reminder",
      body: `${streakDays} days strong! Don't break the chain — review grammar now.`,
    };
  }

  const randomMsg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
  return {
    title: "📖 Grammar Review Time",
    body: randomMsg,
  };
}

/**
 * Schedule the grammar streak reminder notification.
 * Should be called:
 * - On app startup
 * - After changing reminder preferences
 * - After midnight (new day)
 */
export async function scheduleGrammarStreakReminder(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");
    const prefs = await getStreakReminderPrefs();

    // Cancel any existing grammar streak reminders
    await cancelGrammarStreakReminder();

    if (!prefs.enabled) return;

    // Check if user already reviewed grammar today
    const streakData = await getStreakData();
    const today = new Date().toISOString().split("T")[0];

    if (streakData.lastReviewDate === today) {
      // Already reviewed today — no reminder needed
      return;
    }

    // Check if it's already past the reminder time today
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(prefs.reminderHour, prefs.reminderMinute, 0, 0);

    if (now >= reminderTime) {
      // Already past reminder time today — schedule for tomorrow
      // (But only if streak is still valid — i.e., last review was yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (streakData.lastReviewDate !== yesterdayStr && streakData.currentStreak > 0) {
        // Streak already broken, no point reminding
        return;
      }
    }

    // Get motivational content
    const { title, body } = getMotivationalMessage(streakData.currentStreak);

    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          type: "grammar_streak_reminder",
          streakDays: streakData.currentStreak,
          action: "open_grammar",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.reminderHour,
        minute: prefs.reminderMinute,
      },
      identifier: "grammar-streak-reminder",
    });

    await AsyncStorage.setItem(LAST_SCHEDULED_KEY, today);
  } catch (error) {
    console.warn("[GrammarStreakNotif] Failed to schedule:", error);
  }
}

/**
 * Cancel the grammar streak reminder (e.g., after user completes review)
 */
export async function cancelGrammarStreakReminder(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");
    // Cancel by identifier
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (
        notif.identifier === "grammar-streak-reminder" ||
        (notif.content.data as any)?.type === "grammar_streak_reminder"
      ) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {}
}

/**
 * Call this after the user completes a grammar review to cancel today's reminder
 * and reschedule for tomorrow
 */
export async function onGrammarReviewCompleted(): Promise<void> {
  await cancelGrammarStreakReminder();
  // The next app open will reschedule for the following day if needed
}

/**
 * Initialize grammar streak notifications on app startup
 */
export async function initGrammarStreakNotifications(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    await scheduleGrammarStreakReminder();
  } catch {}
}
