import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const WEEKLY_SUMMARY_KEY = "@connectworld_weekly_summary";
const LAST_SUMMARY_KEY = "@connectworld_last_weekly_summary_date";

export interface WeeklySummary {
  id: string;
  date: string;
  talkMinutes: number;
  videoMinutes: number;
  songsTranslated: number;
  teacherMinutes: number;
  creditsUsed: number;
  creditsRemaining: number;
  streak: number;
  motivationalMessage: string;
  weekLabel: string;
}

const MOTIVATIONAL_MESSAGES = [
  "You're making great progress! Keep the momentum going this week. 🚀",
  "Consistency is key — even 5 minutes a day builds fluency! 💪",
  "Your dedication to learning is paying off. Stay curious! 🌟",
  "Great week! Try a new challenge type to keep things fresh. 🎯",
  "You're building real skills. Every conversation counts! 🗣️",
  "Impressive effort! Consider trying a song lesson for variety. 🎵",
  "Keep it up! You're on track to hit your monthly goals. 📈",
  "Small steps, big results. Your future self will thank you! ✨",
];

function getMotivationalMessage(talkMinutes: number, streak: number): string {
  if (streak >= 7) return "Amazing 7+ day streak! You're unstoppable! 🔥";
  if (talkMinutes >= 30) return "Over 30 minutes of conversation this week — incredible! 🏆";
  if (talkMinutes === 0) return "No calls this week? Jump back in — even 2 minutes helps! 💡";
  const idx = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
  return MOTIVATIONAL_MESSAGES[idx];
}

function getWeekLabel(): string {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const format = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${format(weekStart)} – ${format(now)}`;
}

export async function generateWeeklySummary(): Promise<WeeklySummary | null> {
  try {
    // Check if we already generated a summary today
    const lastDate = await AsyncStorage.getItem(LAST_SUMMARY_KEY);
    const today = new Date().toISOString().split("T")[0];
    if (lastDate === today) return null;

    // Get usage data
    const usageStr = await AsyncStorage.getItem("@connectworld_usage_data");
    if (!usageStr) return null;
    const usage = JSON.parse(usageStr);

    // Get streak data
    const streakStr = await AsyncStorage.getItem("@connectworld_streak");
    const streak = streakStr ? parseInt(streakStr, 10) : 0;

    const summary: WeeklySummary = {
      id: `summary_${today}`,
      date: today,
      talkMinutes: usage.talkMinutesUsed || 0,
      videoMinutes: usage.videoMinutesUsed || 0,
      songsTranslated: usage.songTranslationsUsed || 0,
      teacherMinutes: usage.aiTeacherMinutesUsed || 0,
      creditsUsed: usage.creditsUsed || 0,
      creditsRemaining: Math.max((usage.creditsTotal || 50) - (usage.creditsUsed || 0), 0),
      streak,
      motivationalMessage: getMotivationalMessage(usage.talkMinutesUsed || 0, streak),
      weekLabel: getWeekLabel(),
    };

    // Store summary
    const existingSummaries = await AsyncStorage.getItem(WEEKLY_SUMMARY_KEY);
    const summaries: WeeklySummary[] = existingSummaries ? JSON.parse(existingSummaries) : [];
    summaries.unshift(summary);
    // Keep last 8 weeks
    const trimmed = summaries.slice(0, 8);
    await AsyncStorage.setItem(WEEKLY_SUMMARY_KEY, JSON.stringify(trimmed));
    await AsyncStorage.setItem(LAST_SUMMARY_KEY, today);

    return summary;
  } catch {
    return null;
  }
}

export async function getWeeklySummaries(): Promise<WeeklySummary[]> {
  try {
    const stored = await AsyncStorage.getItem(WEEKLY_SUMMARY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function isSunday(): boolean {
  return new Date().getDay() === 0;
}

/**
 * Schedule a local notification for weekly summary.
 * This uses expo-notifications to schedule for next Sunday at 10am.
 */
export async function scheduleWeeklySummaryNotification(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");

    // Cancel any existing weekly summary notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if ((notif.content.data as any)?.type === "weekly_summary") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Schedule for next Sunday at 10:00 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📊 Your Weekly Learning Summary",
        body: "See how much you learned this week! Tap to view your stats.",
        data: { type: "weekly_summary", route: "/notifications" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 10,
        minute: 0,
      },
    });
  } catch {}
}
