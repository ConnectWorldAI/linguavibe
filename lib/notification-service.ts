import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Notification preference keys
const NOTIF_PREFS_KEY = "@notification_preferences";

export type NotificationCategory =
  | "streak_reminders"
  | "class_reminders"
  | "new_content"
  | "friend_activity"
  | "achievements"
  | "weekly_recap"
  | "promotional";

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  streak_reminders: true,
  class_reminders: true,
  new_content: true,
  friend_activity: true,
  achievements: true,
  weekly_recap: true,
  promotional: false,
};

export const NOTIFICATION_LABELS: Record<NotificationCategory, { title: string; desc: string; icon: string }> = {
  streak_reminders: {
    title: "Streak Reminders",
    desc: "Daily reminder to keep your streak alive",
    icon: "flame",
  },
  class_reminders: {
    title: "Class Starting Soon",
    desc: "15 min before your scheduled class",
    icon: "videocam",
  },
  new_content: {
    title: "New Content",
    desc: "When new courses or lessons are available",
    icon: "sparkles",
  },
  friend_activity: {
    title: "Friend Activity",
    desc: "When friends achieve milestones or send you messages",
    icon: "people",
  },
  achievements: {
    title: "Achievements & Badges",
    desc: "When you earn new badges or complete goals",
    icon: "trophy",
  },
  weekly_recap: {
    title: "Weekly Recap",
    desc: "Sunday summary of your learning progress",
    icon: "bar-chart",
  },
  promotional: {
    title: "Promotions & Offers",
    desc: "Special deals and limited-time offers",
    icon: "pricetag",
  },
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
    if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PREFERENCES;
}

export async function setNotificationPreference(
  category: NotificationCategory,
  enabled: boolean
): Promise<void> {
  const prefs = await getNotificationPreferences();
  prefs[category] = enabled;
  await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
}

export async function scheduleStreakReminder(): Promise<void> {
  // In production, this would use expo-notifications to schedule a daily reminder
  // For now, we track that the user has opted in
  const prefs = await getNotificationPreferences();
  if (!prefs.streak_reminders) return;
  // Schedule logic would go here with Notifications.scheduleNotificationAsync
}

export async function scheduleClassReminder(classTime: Date, title: string): Promise<void> {
  const prefs = await getNotificationPreferences();
  if (!prefs.class_reminders) return;
  // Would schedule 15 min before class
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    // In production: const { status } = await Notifications.requestPermissionsAsync();
    // return status === "granted";
    await AsyncStorage.setItem("@notification_permission", "granted");
    return true;
  } catch {
    return false;
  }
}
