/**
 * Daily Challenge Push Notifications
 * 
 * Sends a morning push notification with the Word of the Day
 * to drive daily engagement and streak retention.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DailyChallengeNotifPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
  includeWordPreview: boolean;
  includeStreakInfo: boolean;
}

export interface ScheduledNotifInfo {
  identifier: string;
  scheduledAt: string;
  hour: number;
  minute: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PREFS_KEY = "@daily_challenge_notif_prefs";
const SCHEDULED_KEY = "@daily_challenge_notif_scheduled";
const NOTIF_CHANNEL_ID = "daily-duel-challenge";

const DEFAULT_PREFS: DailyChallengeNotifPrefs = {
  enabled: true,
  hour: 8,
  minute: 0,
  includeWordPreview: true,
  includeStreakInfo: true,
};

// Motivational messages for daily challenge notifications
const MOTIVATIONAL_MESSAGES = [
  "Ready to sharpen your pronunciation?",
  "Your daily word is waiting!",
  "Keep your streak alive!",
  "A new pronunciation challenge awaits!",
  "Time to flex your language muscles!",
  "Can you nail today's word?",
  "Your pronunciation journey continues!",
  "Challenge yourself today!",
  "Don't break your streak!",
  "New word, new opportunity!",
  "Your friends are already practicing!",
  "Beat yesterday's score!",
  "Rise and pronounce!",
  "Today's challenge is a good one!",
  "Practice makes perfect pronunciation!",
];

// ─── Preferences ────────────────────────────────────────────────────────────

export async function getDailyChallengeNotifPrefs(): Promise<DailyChallengeNotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

export async function saveDailyChallengeNotifPrefs(
  prefs: Partial<DailyChallengeNotifPrefs>,
): Promise<DailyChallengeNotifPrefs> {
  const current = await getDailyChallengeNotifPrefs();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Notification Scheduling ────────────────────────────────────────────────

function getRandomMessage(): string {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

export async function scheduleDailyChallengeNotification(
  wordPreview?: string,
  streakDays?: number,
): Promise<ScheduledNotifInfo | null> {
  if (Platform.OS === "web") return null;

  const prefs = await getDailyChallengeNotifPrefs();
  if (!prefs.enabled) return null;

  try {
    const Notifications = await import("expo-notifications");

    // Cancel existing daily challenge notifications
    await cancelDailyChallengeNotification();

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(NOTIF_CHANNEL_ID, {
        name: "Daily Duel Challenge",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // Build notification content
    let title = "Daily Pronunciation Challenge";
    let body = getRandomMessage();

    if (prefs.includeWordPreview && wordPreview) {
      title = `Today's Word: "${wordPreview}"`;
    }

    if (prefs.includeStreakInfo && streakDays && streakDays > 0) {
      body = `${streakDays}-day streak! ${body}`;
    }

    // Schedule daily repeating notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: "daily_duel_challenge", screen: "daily-duel-challenge" },
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: NOTIF_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.hour,
        minute: prefs.minute,
      },
    });

    const info: ScheduledNotifInfo = {
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

export async function cancelDailyChallengeNotification(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");
    const raw = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (raw) {
      const info: ScheduledNotifInfo = JSON.parse(raw);
      await Notifications.cancelScheduledNotificationAsync(info.identifier);
      await AsyncStorage.removeItem(SCHEDULED_KEY);
    }

    // Also cancel any with the daily challenge channel
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of all) {
      if (notif.content.data?.type === "daily_duel_challenge") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {}
}

export async function getScheduledNotifInfo(): Promise<ScheduledNotifInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// ─── Notification Response Handler ──────────────────────────────────────────

export function isDailyChallengeNotification(data: Record<string, unknown>): boolean {
  return data?.type === "daily_duel_challenge";
}

export function getDailyChallengeRoute(): string {
  return "/daily-duel-challenge";
}

// ─── Reschedule on Preference Change ────────────────────────────────────────

export async function updateAndReschedule(
  prefs: Partial<DailyChallengeNotifPrefs>,
): Promise<DailyChallengeNotifPrefs> {
  const updated = await saveDailyChallengeNotifPrefs(prefs);

  if (updated.enabled) {
    await scheduleDailyChallengeNotification();
  } else {
    await cancelDailyChallengeNotification();
  }

  return updated;
}

// ─── Format Helpers ─────────────────────────────────────────────────────────

export function formatNotifTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}
