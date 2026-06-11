/**
 * Unified Notification Triggers
 *
 * Central initialization point for all LinguaVibe notification triggers:
 * 1. Streak Reminder — daily at 8 PM if user hasn't practiced
 * 2. Creator Content Alert — when new content from followed creators is ingested
 * 3. Journal Prompt — morning notification with AI-generated writing prompt
 *
 * Call `initAllNotificationTriggers()` on app startup to ensure all
 * recurring notifications are scheduled.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Re-exports for convenience ──────────────────────────────────────────────
export {
  scheduleStreakReminder,
  cancelStreakReminder,
  markTodayAsPracticed,
  hasUserPracticedToday,
  REMINDER_TIMES,
} from "./streak-notifications";

export {
  scheduleJournalPromptNotification,
  cancelJournalPromptNotification,
  initJournalPromptNotification,
  getJournalPromptNotifPrefs,
  saveJournalPromptNotifPrefs,
} from "./journal-prompt-notification";

export {
  scheduleCreatorContentAlert,
  cancelCreatorContentAlerts,
  getCreatorContentNotifPrefs,
  saveCreatorContentNotifPrefs,
} from "./creator-content-notifications";

export {
  initEngagementNotifications,
  scheduleStreakReminder as scheduleSmartStreakReminder,
  scheduleMusicAlert,
  scheduleMilestoneAlert,
  scheduleReEngagement,
  getEngagementPrefs,
  updateEngagementPrefs,
} from "./engagement-notifications";

// ─── Gamification Keys ───────────────────────────────────────────────────────
const GAMIFICATION_KEY = "linguavibe_gamification";

// ─── Master Initialization ───────────────────────────────────────────────────

/**
 * Initialize all notification triggers on app startup.
 * Reads current user state from AsyncStorage and schedules appropriate notifications.
 */
export async function initAllNotificationTriggers(): Promise<{
  streakScheduled: boolean;
  journalScheduled: boolean;
  engagementScheduled: boolean;
}> {
  if (Platform.OS === "web") {
    return { streakScheduled: false, journalScheduled: false, engagementScheduled: false };
  }

  const result = {
    streakScheduled: false,
    journalScheduled: false,
    engagementScheduled: false,
  };

  try {
    // 1. Streak Reminder
    const { scheduleStreakReminder: scheduleStreak } = await import("./streak-notifications");
    await scheduleStreak({ enabled: true, hour: 20, minute: 0 });
    result.streakScheduled = true;
  } catch (err) {
    console.warn("[NotifTriggers] Streak reminder setup failed:", err);
  }

  try {
    // 2. Journal Prompt
    const { initJournalPromptNotification: initJournal } = await import("./journal-prompt-notification");
    await initJournal();
    result.journalScheduled = true;
  } catch (err) {
    console.warn("[NotifTriggers] Journal prompt setup failed:", err);
  }

  try {
    // 3. Engagement Notifications (smart streak + re-engagement)
    const { initEngagementNotifications: initEngagement } = await import("./engagement-notifications");
    // Load current gamification state
    let currentStreak = 0;
    let lessonsCompleted = 0;
    try {
      const gRaw = await AsyncStorage.getItem(GAMIFICATION_KEY);
      if (gRaw) {
        const g = JSON.parse(gRaw);
        currentStreak = g.currentStreak || 0;
        lessonsCompleted = g.lessonsCompleted || 0;
      }
    } catch {}

    // Load target language
    let language = "Spanish";
    try {
      const prefs = await AsyncStorage.getItem("@language_preferences");
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.targetLanguage) language = parsed.targetLanguage;
      }
    } catch {}

    await initEngagement({
      currentStreak,
      language,
      teacherName: "Your AI Teacher",
      lessonsCompleted,
    });
    result.engagementScheduled = true;
  } catch (err) {
    console.warn("[NotifTriggers] Engagement notifications setup failed:", err);
  }

  return result;
}

/**
 * Cancel all LinguaVibe notification triggers.
 * Call when user disables all notifications.
 */
export async function cancelAllNotificationTriggers(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const { cancelStreakReminder: cancelStreak } = await import("./streak-notifications");
    await cancelStreak();
  } catch {}

  try {
    const { cancelJournalPromptNotification: cancelJournal } = await import("./journal-prompt-notification");
    await cancelJournal();
  } catch {}

  try {
    const { cancelCreatorContentAlerts: cancelCreator } = await import("./creator-content-notifications");
    await cancelCreator();
  } catch {}

  try {
    const { cancelAllEngagementNotifications: cancelEngagement } = await import("./engagement-notifications");
    await cancelEngagement();
  } catch {}
}
