/**
 * Surprise Lesson Push Notifications
 * 
 * Detects user inactivity and schedules push notifications like
 * "Your teacher left you something cool" to re-engage inactive users
 * with fun micro-lessons based on trending target culture.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Storage Keys ──────────────────────────────────────────────────────────
const SURPRISE_SCHEDULE_KEY = "@surprise_lesson_schedule";
const SURPRISE_PREFS_KEY = "@surprise_lesson_notif_prefs";
const LAST_APP_OPEN_KEY = "@last_app_open";
const CHANNEL_ID = "surprise-lessons";

// ─── Types ─────────────────────────────────────────────────────────────────
export interface SurpriseLessonNotifPrefs {
  enabled: boolean;
  inactivityThresholdHours: number; // How long before triggering (default 24h)
  checkHour: number; // What hour to check (default 10 AM)
  checkMinute: number;
}

const DEFAULT_PREFS: SurpriseLessonNotifPrefs = {
  enabled: true,
  inactivityThresholdHours: 24,
  checkHour: 10,
  checkMinute: 0,
};

// ─── Notification Messages ─────────────────────────────────────────────────
const SURPRISE_TITLES = [
  "Your teacher left you something cool!",
  "A surprise lesson is waiting for you!",
  "Something fun from your teacher!",
  "You've got a special lesson!",
  "Your teacher misses you!",
];

const SURPRISE_BODIES = [
  "A fun micro-lesson based on what's trending in your target culture.",
  "Discover something cool about the culture you're learning!",
  "Your teacher prepared a special lesson just for you.",
  "Come back and see what your teacher found for you!",
  "A quick, fun lesson to get you back on track!",
];

function getRandomItem(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Preferences ───────────────────────────────────────────────────────────

export async function getSurpriseLessonPrefs(): Promise<SurpriseLessonNotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(SURPRISE_PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

export async function saveSurpriseLessonPrefs(
  prefs: Partial<SurpriseLessonNotifPrefs>,
): Promise<SurpriseLessonNotifPrefs> {
  const current = await getSurpriseLessonPrefs();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(SURPRISE_PREFS_KEY, JSON.stringify(updated));
  return updated;
}

// ─── App Open Tracking ─────────────────────────────────────────────────────

export async function recordAppOpen(): Promise<void> {
  await AsyncStorage.setItem(LAST_APP_OPEN_KEY, Date.now().toString());
}

export async function getHoursSinceLastOpen(): Promise<number> {
  try {
    const lastOpen = await AsyncStorage.getItem(LAST_APP_OPEN_KEY);
    if (!lastOpen) return 999; // Never opened = very inactive
    return (Date.now() - parseInt(lastOpen, 10)) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}

// ─── Notification Scheduling ───────────────────────────────────────────────

/**
 * Schedule a daily check notification that fires at the configured time.
 * When the notification fires and the user hasn't opened the app recently,
 * it shows the surprise lesson notification.
 * 
 * Called on app launch and when preferences change.
 */
export async function scheduleSurpriseLessonCheck(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const prefs = await getSurpriseLessonPrefs();

    // Also check voice settings toggle
    const settingsStr = await AsyncStorage.getItem("@voice_settings");
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      if (settings.surpriseLessonsEnabled === false) {
        await cancelSurpriseLessonSchedule();
        return;
      }
    }

    if (!prefs.enabled) {
      await cancelSurpriseLessonSchedule();
      return;
    }

    // Cancel existing first
    await cancelSurpriseLessonSchedule();

    const Notifications = await import("expo-notifications");

    // Set up Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Surprise Lessons",
        description: "Fun micro-lessons when you haven't practiced in a while",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // Schedule daily check notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: getRandomItem(SURPRISE_TITLES),
        body: getRandomItem(SURPRISE_BODIES),
        data: {
          type: "surprise_lesson",
          route: "/surprise-lesson",
        },
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.checkHour,
        minute: prefs.checkMinute,
      },
    });

    await AsyncStorage.setItem(SURPRISE_SCHEDULE_KEY, JSON.stringify([identifier]));
  } catch {
    // Silent fail
  }
}

/**
 * Cancel all scheduled surprise lesson notifications
 */
export async function cancelSurpriseLessonSchedule(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");
    const stored = await AsyncStorage.getItem(SURPRISE_SCHEDULE_KEY);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      for (const id of ids) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {}
      }
      await AsyncStorage.removeItem(SURPRISE_SCHEDULE_KEY);
    }

    // Also cancel any stray surprise lesson notifications
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of all) {
      if (notif.content.data?.type === "surprise_lesson") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {}
}

/**
 * Update preferences and reschedule
 */
export async function updatePrefsAndReschedule(
  prefs: Partial<SurpriseLessonNotifPrefs>,
): Promise<SurpriseLessonNotifPrefs> {
  const updated = await saveSurpriseLessonPrefs(prefs);
  if (updated.enabled) {
    await scheduleSurpriseLessonCheck();
  } else {
    await cancelSurpriseLessonSchedule();
  }
  return updated;
}

/**
 * Send an immediate surprise lesson notification (for when inactivity is detected on app open)
 */
export async function sendImmediateSurpriseLessonNotif(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const prefs = await getSurpriseLessonPrefs();
    if (!prefs.enabled) return;

    const hoursSince = await getHoursSinceLastOpen();
    if (hoursSince < prefs.inactivityThresholdHours) return;

    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: getRandomItem(SURPRISE_TITLES),
        body: getRandomItem(SURPRISE_BODIES),
        data: { type: "surprise_lesson", route: "/surprise-lesson" },
        sound: "default",
      },
      trigger: null, // Immediate
    });
  } catch {}
}

/**
 * Check if a notification response is a surprise lesson
 */
export function isSurpriseLessonNotification(data: Record<string, unknown>): boolean {
  return data?.type === "surprise_lesson";
}

/**
 * Get the route for surprise lesson notification tap
 */
export function getSurpriseLessonRoute(): string {
  return "/surprise-lesson";
}
