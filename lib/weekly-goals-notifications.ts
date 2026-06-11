/**
 * Weekly Goals Notification Reminders
 * 
 * Sends push notifications to remind users about their weekly goal progress:
 * - Daily progress check (evening) — "You're X drills away from hitting your goal!"
 * - Mid-week nudge (Wednesday) — "Halfway through the week! Here's where you stand."
 * - Final push (Saturday) — "Last chance to hit your goals before the week resets!"
 * - Celebration — "You crushed your goals this week! A+ grade!"
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentGoals, gradeGoals, type WeeklyGoal } from "./weekly-goals-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GoalNotificationPrefs {
  enabled: boolean;
  dailyReminder: boolean;
  midWeekNudge: boolean;
  finalPush: boolean;
  celebration: boolean;
  reminderHour: number; // 0-23
  reminderMinute: number;
}

interface GoalReminderTemplate {
  title: string;
  body: string;
  type: "progress" | "nudge" | "final_push" | "celebration";
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PREFS_KEY = "@weekly_goals_notif_prefs";
const SCHEDULED_KEY = "@weekly_goals_notif_scheduled";

const DEFAULT_PREFS: GoalNotificationPrefs = {
  enabled: true,
  dailyReminder: true,
  midWeekNudge: true,
  finalPush: true,
  celebration: true,
  reminderHour: 19, // 7 PM
  reminderMinute: 0,
};

// ─── Notification Templates ─────────────────────────────────────────────────

const PROGRESS_TEMPLATES: GoalReminderTemplate[] = [
  {
    title: "📊 Goal Check-In",
    body: "You're {{remaining}} {{unit}} away from hitting your \"{{goalTitle}}\" goal!",
    type: "progress",
  },
  {
    title: "🎯 Almost There!",
    body: "{{progress}}% done with \"{{goalTitle}}\" — keep pushing!",
    type: "progress",
  },
  {
    title: "💪 Daily Goal Update",
    body: "{{completed}}/{{total}} goals completed this week. You've got this!",
    type: "progress",
  },
];

const NUDGE_TEMPLATES: GoalReminderTemplate[] = [
  {
    title: "📅 Mid-Week Check",
    body: "Halfway through! You're at {{progress}}% on your goals. Time to accelerate!",
    type: "nudge",
  },
  {
    title: "⏰ Week Half Over",
    body: "{{completed}}/{{total}} goals done. {{remaining}} more to go — you can do it!",
    type: "nudge",
  },
];

const FINAL_PUSH_TEMPLATES: GoalReminderTemplate[] = [
  {
    title: "🏁 Last Chance!",
    body: "Week resets tomorrow! You're {{remaining}} {{unit}} from completing \"{{goalTitle}}\".",
    type: "final_push",
  },
  {
    title: "⚡ Final Push",
    body: "One day left! {{completed}}/{{total}} goals done. Finish strong!",
    type: "final_push",
  },
];

const CELEBRATION_TEMPLATES: GoalReminderTemplate[] = [
  {
    title: "🏆 Goals Crushed!",
    body: "You hit {{completed}}/{{total}} goals this week! Grade: {{grade}}. Amazing work!",
    type: "celebration",
  },
  {
    title: "🎉 Weekly Goals Complete!",
    body: "{{grade}} grade this week! You completed {{completed}} goals. Keep this momentum!",
    type: "celebration",
  },
];

// ─── Preferences ────────────────────────────────────────────────────────────

export async function getGoalNotificationPrefs(): Promise<GoalNotificationPrefs> {
  try {
    const data = await AsyncStorage.getItem(PREFS_KEY);
    return data ? { ...DEFAULT_PREFS, ...JSON.parse(data) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function setGoalNotificationPrefs(prefs: Partial<GoalNotificationPrefs>): Promise<void> {
  const current = await getGoalNotificationPrefs();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  
  // Reschedule notifications with new preferences
  if (updated.enabled) {
    await scheduleGoalReminders();
  } else {
    await cancelAllGoalReminders();
  }
}

// ─── Template Filling ───────────────────────────────────────────────────────

function fillGoalTemplate(
  template: GoalReminderTemplate,
  goals: WeeklyGoal[]
): { title: string; body: string; data: Record<string, any> } {
  const total = goals.length;
  const completed = goals.filter(g => g.currentValue >= g.targetValue).length;
  const remaining = total - completed;
  
  // Find the closest-to-completion incomplete goal
  const incompleteGoals = goals.filter(g => g.currentValue < g.targetValue);
  const closestGoal = incompleteGoals.sort(
    (a, b) => (b.currentValue / b.targetValue) - (a.currentValue / a.targetValue)
  )[0];

  const avgProgress = goals.reduce((sum, g) => sum + Math.min(g.currentValue / g.targetValue, 1), 0) / total;
  const { grade } = gradeGoals(goals);

  const replacements: Record<string, string> = {
    "{{total}}": String(total),
    "{{completed}}": String(completed),
    "{{remaining}}": closestGoal ? String(Math.max(0, closestGoal.targetValue - closestGoal.currentValue)) : "0",
    "{{unit}}": closestGoal?.unit || "items",
    "{{goalTitle}}": closestGoal?.title || "weekly goal",
    "{{progress}}": String(Math.round(avgProgress * 100)),
    "{{grade}}": grade,
  };

  let title = template.title;
  let body = template.body;
  for (const [key, value] of Object.entries(replacements)) {
    title = title.replace(key, value);
    body = body.replace(key, value);
  }

  return {
    title,
    body,
    data: {
      type: "weekly_goal_reminder",
      subType: template.type,
      route: "/weekly-goals",
    },
  };
}

// ─── Scheduling ─────────────────────────────────────────────────────────────

/**
 * Schedule daily goal reminder notifications.
 * Called when goals are set/updated or preferences change.
 */
export async function scheduleGoalReminders(): Promise<void> {
  if (Platform.OS === "web") return;

  const prefs = await getGoalNotificationPrefs();
  if (!prefs.enabled) return;

  const goals = await getCurrentGoals();
  if (goals.length === 0) return;

  try {
    const Notifications = await import("expo-notifications");

    // Cancel existing goal reminders
    await cancelAllGoalReminders();

    // Schedule daily progress reminder
    if (prefs.dailyReminder) {
      const template = PROGRESS_TEMPLATES[Math.floor(Math.random() * PROGRESS_TEMPLATES.length)];
      const notification = fillGoalTemplate(template, goals);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: prefs.reminderHour,
          minute: prefs.reminderMinute,
        },
      });
    }

    // Schedule mid-week nudge (Wednesday)
    if (prefs.midWeekNudge) {
      const template = NUDGE_TEMPLATES[Math.floor(Math.random() * NUDGE_TEMPLATES.length)];
      const notification = fillGoalTemplate(template, goals);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { ...notification.data, subType: "nudge" },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 4, // Wednesday (1=Sunday, 4=Wednesday)
          hour: prefs.reminderHour,
          minute: prefs.reminderMinute,
        },
      });
    }

    // Schedule final push (Saturday)
    if (prefs.finalPush) {
      const template = FINAL_PUSH_TEMPLATES[Math.floor(Math.random() * FINAL_PUSH_TEMPLATES.length)];
      const notification = fillGoalTemplate(template, goals);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { ...notification.data, subType: "final_push" },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 7, // Saturday
          hour: prefs.reminderHour,
          minute: prefs.reminderMinute,
        },
      });
    }

    // Save scheduling metadata
    await AsyncStorage.setItem(SCHEDULED_KEY, JSON.stringify({
      scheduledAt: Date.now(),
      goalCount: goals.length,
      prefs,
    }));
  } catch (error) {
    console.warn("[GoalNotif] Failed to schedule goal reminders:", error);
  }
}

/**
 * Cancel all scheduled goal reminder notifications
 */
export async function cancelAllGoalReminders(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "weekly_goal_reminder") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
    await AsyncStorage.removeItem(SCHEDULED_KEY);
  } catch (error) {
    console.warn("[GoalNotif] Failed to cancel goal reminders:", error);
  }
}

/**
 * Send an immediate celebration notification when all goals are completed
 */
export async function sendGoalCelebration(): Promise<void> {
  if (Platform.OS === "web") return;

  const prefs = await getGoalNotificationPrefs();
  if (!prefs.enabled || !prefs.celebration) return;

  const goals = await getCurrentGoals();
  if (goals.length === 0) return;

  const allCompleted = goals.every(g => g.currentValue >= g.targetValue);
  if (!allCompleted) return;

  try {
    const Notifications = await import("expo-notifications");
    const template = CELEBRATION_TEMPLATES[Math.floor(Math.random() * CELEBRATION_TEMPLATES.length)];
    const notification = fillGoalTemplate(template, goals);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: { ...notification.data, subType: "celebration" },
        sound: "default",
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.warn("[GoalNotif] Failed to send celebration:", error);
  }
}

/**
 * Check goal progress and send a contextual reminder if needed.
 * Called after each learning session completes.
 */
export async function checkAndNotifyGoalProgress(): Promise<void> {
  if (Platform.OS === "web") return;

  const prefs = await getGoalNotificationPrefs();
  if (!prefs.enabled) return;

  const goals = await getCurrentGoals();
  if (goals.length === 0) return;

  // Check if any goal just got completed
  const justCompleted = goals.filter(g => 
    g.currentValue >= g.targetValue && !g.completed
  );

  if (justCompleted.length > 0) {
    // Check if ALL goals are now complete
    const allDone = goals.every(g => g.currentValue >= g.targetValue);
    if (allDone) {
      await sendGoalCelebration();
    }
  }
}

/**
 * Get the current notification schedule status
 */
export async function getGoalNotificationStatus(): Promise<{
  isScheduled: boolean;
  scheduledAt: number | null;
  goalCount: number;
}> {
  try {
    const data = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (!data) return { isScheduled: false, scheduledAt: null, goalCount: 0 };
    const parsed = JSON.parse(data);
    return {
      isScheduled: true,
      scheduledAt: parsed.scheduledAt,
      goalCount: parsed.goalCount,
    };
  } catch {
    return { isScheduled: false, scheduledAt: null, goalCount: 0 };
  }
}
