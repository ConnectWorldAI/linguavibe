/**
 * Journal Prompt-of-the-Day Push Notification
 *
 * Delivers one AI-generated writing prompt at the student's preferred study time.
 * Uses the same prompt generation endpoint as the student journal screen.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface JournalPromptNotifPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface ScheduledJournalNotifInfo {
  identifier: string;
  scheduledAt: string;
  hour: number;
  minute: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PREFS_KEY = "@journal_prompt_notif_prefs";
const SCHEDULED_KEY = "@journal_prompt_notif_scheduled";
const NOTIF_CHANNEL_ID = "journal-prompt-of-the-day";

// Map preferred study time to hour
const TIME_TO_HOUR: Record<string, number> = {
  morning: 8,
  afternoon: 14,
  evening: 19,
  night: 21,
};

// Prompt teasers to rotate through (actual AI prompt is generated on open)
const PROMPT_TEASERS = [
  "Your daily writing prompt is ready!",
  "Time to write! Today's prompt is waiting for you.",
  "Grab your journal — a fresh prompt just dropped.",
  "Ready to practice writing? Open your journal!",
  "Your vocabulary needs you! New writing prompt inside.",
  "A new journal challenge awaits — let's write!",
  "Keep your writing streak alive! New prompt ready.",
  "Today's prompt uses words from your recent lessons.",
  "Write something in your target language today!",
  "Your AI tutor left you a writing prompt.",
  "New prompt alert! Practice makes fluency.",
  "Journal time! Today's topic is inspired by your progress.",
];

// ─── Preferences ────────────────────────────────────────────────────────────

export async function getJournalPromptNotifPrefs(): Promise<JournalPromptNotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default: derive from learning schedule preferred time
  const scheduleRaw = await AsyncStorage.getItem("@learning_schedule");
  let hour = 9;
  if (scheduleRaw) {
    try {
      const schedule = JSON.parse(scheduleRaw);
      if (schedule.preferredTime && TIME_TO_HOUR[schedule.preferredTime]) {
        hour = TIME_TO_HOUR[schedule.preferredTime];
      }
    } catch {}
  }
  return { enabled: true, hour, minute: 0 };
}

export async function saveJournalPromptNotifPrefs(
  prefs: Partial<JournalPromptNotifPrefs>
): Promise<JournalPromptNotifPrefs> {
  const current = await getJournalPromptNotifPrefs();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Notification Scheduling ────────────────────────────────────────────────

function getRandomTeaser(): string {
  return PROMPT_TEASERS[Math.floor(Math.random() * PROMPT_TEASERS.length)];
}

/**
 * Schedule the daily journal prompt notification at the student's preferred time.
 */
export async function scheduleJournalPromptNotification(): Promise<ScheduledJournalNotifInfo | null> {
  if (Platform.OS === "web") return null;

  const prefs = await getJournalPromptNotifPrefs();
  if (!prefs.enabled) return null;

  try {
    const Notifications = await import("expo-notifications");

    // Cancel existing journal prompt notifications
    await cancelJournalPromptNotification();

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(NOTIF_CHANNEL_ID, {
        name: "Journal Writing Prompts",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      });
    }

    // Get target language for the notification title
    const targetLang = (await AsyncStorage.getItem("@target_language")) || "Spanish";

    // Schedule daily repeating notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Write in ${targetLang} today`,
        body: getRandomTeaser(),
        data: { type: "journal_prompt_of_the_day", screen: "student-journal" },
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: NOTIF_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.hour,
        minute: prefs.minute,
      },
    });

    const info: ScheduledJournalNotifInfo = {
      identifier,
      scheduledAt: new Date().toISOString(),
      hour: prefs.hour,
      minute: prefs.minute,
    };
    await AsyncStorage.setItem(SCHEDULED_KEY, JSON.stringify(info));
    return info;
  } catch {
    return null;
  }
}

/**
 * Cancel any existing journal prompt notification.
 */
export async function cancelJournalPromptNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    const raw = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (raw) {
      const info: ScheduledJournalNotifInfo = JSON.parse(raw);
      await Notifications.cancelScheduledNotificationAsync(info.identifier);
      await AsyncStorage.removeItem(SCHEDULED_KEY);
    }
    // Also cancel any with the journal prompt type
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of all) {
      if (notif.content.data?.type === "journal_prompt_of_the_day") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {}
}

/**
 * Check if the journal prompt notification is currently scheduled.
 */
export async function isJournalPromptNotificationScheduled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_KEY);
    return !!raw;
  } catch {
    return false;
  }
}

/**
 * Initialize journal prompt notifications (call after onboarding or app start).
 * Automatically schedules if not already scheduled and prefs are enabled.
 */
export async function initJournalPromptNotification(): Promise<void> {
  const prefs = await getJournalPromptNotifPrefs();
  if (!prefs.enabled) return;
  const scheduled = await isJournalPromptNotificationScheduled();
  if (!scheduled) {
    await scheduleJournalPromptNotification();
  }
}
