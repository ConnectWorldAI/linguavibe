import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Configuration ───────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Types ───────────────────────────────────────────────────────────────────
export interface NotificationPreferences {
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  streakAlerts: boolean;
  lessonComplete: boolean;
  weeklyReport: boolean;
  socialNotifs: boolean;
  marketingNotifs: boolean;
  slangOfTheDay: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  dailyReminder: true,
  reminderTime: "09:00",
  streakAlerts: true,
  lessonComplete: true,
  weeklyReport: true,
  socialNotifs: true,
  marketingNotifs: false,
  slangOfTheDay: true,
};

const PREFS_KEY = "@notification_prefs";
const TOKEN_KEY = "@push_token";

// ─── Permission & Token ──────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

/**
 * Get the Expo push token for this device.
 * Uses the projectId from app.config.ts (via Constants) for proper EAS integration.
 */
export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.warn("[Notifications] Push tokens require a physical device");
    return null;
  }

  try {
    // Get projectId from Expo config (set automatically by EAS)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId
      ?? undefined;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    await AsyncStorage.setItem(TOKEN_KEY, token.data);
    return token.data;
  } catch (e) {
    console.warn("[Notifications] Failed to get push token:", e);
    return null;
  }
}

/**
 * Get the currently stored push token (without re-requesting).
 */
export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Register for push notifications: request permission, get token, and sync to server.
 * Call this on app startup after user is authenticated.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const granted = await requestNotificationPermission();
  if (!granted) return null;
  return getPushToken();
}

/**
 * Get the device platform for push token registration.
 */
export function getDevicePlatform(): "ios" | "android" | "web" {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}

/**
 * Get a human-readable device name for push token registration.
 */
export function getDeviceName(): string {
  return Device.deviceName ?? `${Device.brand ?? "Unknown"} ${Device.modelName ?? "Device"}`;
}

// ─── Preferences ─────────────────────────────────────────────────────────────
export async function getNotificationPrefs(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(PREFS_KEY);
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch (e) {}
  return DEFAULT_PREFS;
}

export async function saveNotificationPrefs(prefs: NotificationPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  // Reschedule notifications based on new prefs
  await scheduleLocalNotifications(prefs);
}

// ─── Local Scheduling ────────────────────────────────────────────────────────
export async function scheduleLocalNotifications(prefs: NotificationPreferences): Promise<void> {
  if (Platform.OS === "web") return;

  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Daily learning reminder
  if (prefs.dailyReminder) {
    const [hours, minutes] = prefs.reminderTime.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Learn!",
        body: "Your daily lesson is waiting. Keep your streak alive!",
        sound: true,
        data: { type: "daily_reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
  }

  // Streak warning (6 PM if no activity)
  if (prefs.streakAlerts) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Don't Lose Your Streak!",
        body: "You haven't practiced today. Just 5 minutes keeps your streak going!",
        sound: true,
        data: { type: "streak_warning" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 18,
        minute: 0,
      },
    });
  }

  // Expression of the Day (8 AM daily) — language-adaptive
  if (prefs.slangOfTheDay) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "\ud83c\udf1f Expression of the Day",
        body: "A new expression is waiting for you! Tap to learn today's slang.",
        sound: true,
        data: { type: "slang_of_the_day" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });
  }

  // Weekly progress report (Sunday 10 AM)
  if (prefs.weeklyReport) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Weekly Progress Report",
        body: "See how much you've learned this week!",
        sound: true,
        data: { type: "weekly_report" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 10,
        minute: 0,
      },
    });
  }
}

// ─── Trigger Notifications ───────────────────────────────────────────────────
export async function sendLessonCompleteNotification(lessonTitle: string, xpEarned: number): Promise<void> {
  const prefs = await getNotificationPrefs();
  if (!prefs.lessonComplete || Platform.OS === "web") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lesson Complete!",
      body: `Great job finishing "${lessonTitle}"! +${xpEarned} XP`,
      sound: true,
      data: { type: "lesson_complete", lessonTitle, xpEarned },
    },
    trigger: null, // Immediate
  });
}

export async function sendStreakMilestoneNotification(days: number): Promise<void> {
  if (Platform.OS === "web") return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${days}-Day Streak!`,
      body: `Amazing! You've been learning for ${days} days straight!`,
      sound: true,
      data: { type: "streak_milestone", days },
    },
    trigger: null,
  });
}

export async function sendSocialNotification(fromUser: string, type: "message" | "friend_request" | "call"): Promise<void> {
  const prefs = await getNotificationPrefs();
  if (!prefs.socialNotifs || Platform.OS === "web") return;

  const titles = {
    message: "New Message",
    friend_request: "Friend Request",
    call: "Incoming Call",
  };
  const bodies = {
    message: `${fromUser} sent you a message`,
    friend_request: `${fromUser} wants to connect with you`,
    call: `${fromUser} is calling you`,
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titles[type],
      body: bodies[type],
      sound: true,
      data: { type: `social_${type}`, fromUser },
    },
    trigger: null,
  });
}

// ─── Weekly Progress Digest ─────────────────────────────────────────────────
export interface WeeklyDigestData {
  streakDays: number;
  lessonsCompleted: number;
  xpEarned: number;
  minutesPracticed: number;
  cefrLevel: string | null;
  cefrChanged: boolean;
  previousLevel?: string;
}

export async function generateWeeklyDigest(): Promise<WeeklyDigestData> {
  const streakRaw = await AsyncStorage.getItem("@streak_count");
  const lessonsRaw = await AsyncStorage.getItem("@weekly_lessons_completed");
  const xpRaw = await AsyncStorage.getItem("@weekly_xp_earned");
  const minutesRaw = await AsyncStorage.getItem("@weekly_minutes_practiced");
  const cefrLevel = await AsyncStorage.getItem("@cefr_level");
  const levelUpRaw = await AsyncStorage.getItem("@cefr_level_up");

  const digest: WeeklyDigestData = {
    streakDays: streakRaw ? parseInt(streakRaw, 10) : 0,
    lessonsCompleted: lessonsRaw ? parseInt(lessonsRaw, 10) : 0,
    xpEarned: xpRaw ? parseInt(xpRaw, 10) : 0,
    minutesPracticed: minutesRaw ? parseInt(minutesRaw, 10) : 0,
    cefrLevel,
    cefrChanged: !!levelUpRaw,
    previousLevel: levelUpRaw ? JSON.parse(levelUpRaw).from : undefined,
  };

  return digest;
}

export async function sendWeeklyProgressDigest(): Promise<void> {
  const prefs = await getNotificationPrefs();
  if (!prefs.weeklyReport || Platform.OS === "web") return;

  const digest = await generateWeeklyDigest();

  let body = `This week: ${digest.lessonsCompleted} lessons, ${digest.xpEarned} XP, ${digest.minutesPracticed} min practiced.`;
  if (digest.streakDays > 0) {
    body += ` ${digest.streakDays}-day streak!`;
  }
  if (digest.cefrChanged && digest.previousLevel && digest.cefrLevel) {
    body = `You leveled up from ${digest.previousLevel} to ${digest.cefrLevel}! ` + body;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your Weekly Progress Report",
      body,
      sound: true,
      data: { type: "weekly_digest", ...digest },
    },
    trigger: null, // Immediate - called by the weekly scheduler
  });

  // Reset weekly counters
  await AsyncStorage.multiSet([
    ["@weekly_lessons_completed", "0"],
    ["@weekly_xp_earned", "0"],
    ["@weekly_minutes_practiced", "0"],
  ]);
}

export async function incrementWeeklyStats(type: "lesson" | "xp" | "minutes", amount: number): Promise<void> {
  const keys = {
    lesson: "@weekly_lessons_completed",
    xp: "@weekly_xp_earned",
    minutes: "@weekly_minutes_practiced",
  };
  const key = keys[type];
  const current = await AsyncStorage.getItem(key);
  const newVal = (current ? parseInt(current, 10) : 0) + amount;
  await AsyncStorage.setItem(key, String(newVal));
}

// Configure weekly digest schedule
export interface DigestScheduleConfig {
  dayOfWeek: number; // 1=Sunday, 2=Monday, ..., 7=Saturday
  hour: number;
  minute: number;
}

const DIGEST_SCHEDULE_KEY = "@digest_schedule";

export async function getDigestSchedule(): Promise<DigestScheduleConfig> {
  try {
    const stored = await AsyncStorage.getItem(DIGEST_SCHEDULE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return { dayOfWeek: 1, hour: 10, minute: 0 }; // Default: Sunday 10 AM
}

export async function setDigestSchedule(config: DigestScheduleConfig): Promise<void> {
  await AsyncStorage.setItem(DIGEST_SCHEDULE_KEY, JSON.stringify(config));
  // Reschedule the weekly notification
  const prefs = await getNotificationPrefs();
  if (prefs.weeklyReport && Platform.OS !== "web") {
    // Cancel existing weekly report
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "weekly_report") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
    // Schedule new one
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Weekly Progress Report",
        body: "See how much you've learned this week!",
        sound: true,
        data: { type: "weekly_report" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: config.dayOfWeek,
        hour: config.hour,
        minute: config.minute,
      },
    });
  }
}

// ─── SRS Review Reminders ────────────────────────────────────────────────────

const SRS_NOTIFICATION_ID = "srs_review_reminder";

/**
 * Schedule a local notification when SRS items are due for review.
 * Call this after completing a review session or when the app opens.
 * Checks the SRS queue and schedules a reminder for the next due batch.
 */
export async function scheduleSRSReviewNotification(dueCount: number): Promise<void> {
  if (Platform.OS === "web" || dueCount <= 0) return;

  const prefs = await getNotificationPrefs();
  if (!prefs.dailyReminder) return; // respect notification preferences

  // Cancel any existing SRS reminder
  await cancelSRSReviewNotification();

  // Schedule immediate notification if items are due now
  await Notifications.scheduleNotificationAsync({
    identifier: SRS_NOTIFICATION_ID,
    content: {
      title: "\ud83e\udde0 Review Time!",
      body: dueCount === 1
        ? "1 card is ready for review. Quick 2-minute session to lock it in!"
        : `${dueCount} cards are ready for review. Keep your memory sharp!`,
      sound: true,
      badge: dueCount,
      data: { type: "srs_review", dueCount, route: "/srs-review" },
    },
    trigger: null, // immediate
  });
}

/**
 * Schedule a recurring SRS check notification.
 * Fires at optimal review times (10 AM and 7 PM) to catch morning and evening review windows.
 */
export async function scheduleSRSRecurringReminders(): Promise<void> {
  if (Platform.OS === "web") return;

  const prefs = await getNotificationPrefs();
  if (!prefs.dailyReminder) return;

  // Morning review reminder (10 AM)
  await Notifications.scheduleNotificationAsync({
    identifier: "srs_morning_reminder",
    content: {
      title: "\u2615 Morning Review",
      body: "Start your day by reviewing vocabulary. Just 3 minutes!",
      sound: true,
      data: { type: "srs_review", route: "/srs-review" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 10,
      minute: 0,
    },
  });

  // Evening review reminder (7 PM)
  await Notifications.scheduleNotificationAsync({
    identifier: "srs_evening_reminder",
    content: {
      title: "\ud83c\udf19 Evening Review",
      body: "Review before bed — your brain consolidates during sleep!",
      sound: true,
      data: { type: "srs_review", route: "/srs-review" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
  });
}

/**
 * Cancel all SRS review notifications.
 */
export async function cancelSRSReviewNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(SRS_NOTIFICATION_ID);
    await Notifications.cancelScheduledNotificationAsync("srs_morning_reminder");
    await Notifications.cancelScheduledNotificationAsync("srs_evening_reminder");
  } catch {
    // Notification may not exist yet
  }
}

// ─── Notification Listeners ──────────────────────────────────────────────────
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

// ─── Teacher Voice Memo Notifications ────────────────────────────────────────

const VOICE_MEMO_NOTIFICATION_ID = "teacher_voice_memo";

/**
 * Send a push notification when the teacher sends a voice memo.
 * The notification links to the voice memo player screen.
 */
export async function sendVoiceMemoNotification(params: {
  teacherName: string;
  memoType: string;
  struggleArea: string;
  memoId: string;
}): Promise<void> {
  if (Platform.OS === "web") return;

  const prefs = await getNotificationPrefs();
  if (!prefs.dailyReminder) return;

  const titles: Record<string, string> = {
    encouragement: `${params.teacherName} sent you encouragement 💪`,
    tip: `${params.teacherName} has a tip for you 💡`,
    homework_assigned: `${params.teacherName} assigned practice 📚`,
    milestone: `${params.teacherName} noticed your progress! 🎉`,
    check_in: `${params.teacherName} is checking in 👋`,
  };

  const bodies: Record<string, string> = {
    encouragement: `Your teacher noticed you're working on ${params.struggleArea}. Tap to hear their message.`,
    tip: `A quick tip about ${params.struggleArea} that might help you break through.`,
    homework_assigned: `New targeted practice for ${params.struggleArea}. Tap to listen.`,
    milestone: `You're improving in ${params.struggleArea}! Tap to hear your teacher's message.`,
    check_in: `Haven't seen you in a while. Your teacher left you a voice note.`,
  };

  await Notifications.scheduleNotificationAsync({
    identifier: `${VOICE_MEMO_NOTIFICATION_ID}_${params.memoId}`,
    content: {
      title: titles[params.memoType] || `🎙️ New voice memo from ${params.teacherName}`,
      body: bodies[params.memoType] || `Tap to listen to your teacher's message about ${params.struggleArea}.`,
      sound: true,
      badge: 1,
      data: {
        type: "teacher_voice_memo",
        memoId: params.memoId,
        route: "/voice-memo-player",
      },
    },
    trigger: null, // immediate
  });
}
