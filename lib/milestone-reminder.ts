import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDailyMilestoneState, DAILY_MILESTONES, isPerfectDay } from "@/lib/streak-bonus";

const REMINDER_SCHEDULED_KEY = "@connectworld_milestone_reminder_scheduled";

/**
 * Schedule a daily 8 PM notification to remind users to complete milestones.
 * Only fires if milestones are incomplete at that time.
 */
export async function scheduleMilestoneReminder(): Promise<void> {
  try {
    // Check if already scheduled today
    const today = new Date().toISOString().split("T")[0];
    const lastScheduled = await AsyncStorage.getItem(REMINDER_SCHEDULED_KEY);
    if (lastScheduled === today) return;

    // Cancel any existing milestone reminders
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "milestone_reminder") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Check current milestone state
    const state = await getDailyMilestoneState();
    const completedCount = state.completedIds.length;
    const totalMilestones = DAILY_MILESTONES.length;

    // Don't schedule if already a Perfect Day
    if (isPerfectDay(state)) return;

    // Calculate time until 8 PM today
    const now = new Date();
    const eightPM = new Date(now);
    eightPM.setHours(20, 0, 0, 0);

    // If it's already past 8 PM, don't schedule
    if (now >= eightPM) return;

    const secondsUntil8PM = Math.floor((eightPM.getTime() - now.getTime()) / 1000);

    const remaining = totalMilestones - completedCount;
    const messages = [
      `You're ${completedCount}/${totalMilestones} milestones done today! Just ${remaining} more for a Perfect Day 🌟`,
      `Don't miss your Perfect Day! ${remaining} milestones left to complete 🔥`,
      `Almost there! Finish ${remaining} more milestones before midnight for bonus credits 💰`,
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Perfect Day Reminder",
        body: message,
        data: { type: "milestone_reminder", screen: "/milestones" },
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil8PM,
        repeats: false,
      },
    });

    await AsyncStorage.setItem(REMINDER_SCHEDULED_KEY, today);
  } catch (error) {
    // Silently fail - notifications are optional
  }
}

/**
 * Cancel the milestone reminder (e.g., when Perfect Day is achieved).
 */
export async function cancelMilestoneReminder(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "milestone_reminder") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {}
}
