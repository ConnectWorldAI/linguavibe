/**
 * Weekly Achievement Digest Notification
 * 
 * Sends a weekly push notification summarizing new achievements earned
 * and closest-to-unlocking milestones to drive re-engagement.
 * Scheduled every Sunday at 11 AM local time.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AchievementDigestData {
  weeklyUnlockedCount: number;
  weeklyUnlockedTitles: string[];
  totalUnlocked: number;
  totalAchievements: number;
  closestToUnlock: Array<{
    title: string;
    progressPercent: number;
    remaining: string;
  }>;
  streakDays: number;
}

export interface AchievementDigestPrefs {
  enabled: boolean;
  dayOfWeek: number; // 1=Sunday ... 7=Saturday
  hour: number;
  minute: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIGEST_PREFS_KEY = "@achievement_digest_prefs";
const DIGEST_SCHEDULED_KEY = "@achievement_digest_scheduled";
const WEEKLY_UNLOCKS_KEY = "@achievements_weekly_unlocks";
const UNLOCKED_IDS_KEY = "@achievements_unlocked_ids";
const TOTAL_ACHIEVEMENTS = 28; // From achievements.ts

const DEFAULT_PREFS: AchievementDigestPrefs = {
  enabled: true,
  dayOfWeek: 1, // Sunday
  hour: 11,
  minute: 0,
};

// Motivational messages for digest
const DIGEST_MESSAGES = [
  "Your weekly trophy report is here!",
  "See what you've accomplished this week!",
  "Your achievement journey continues!",
  "Check out your progress this week!",
  "Trophy room update available!",
  "You're making great progress!",
  "Your weekly achievement summary awaits!",
  "Time to celebrate your wins!",
];

// ─── Preferences ──────────────────────────────────────────────────────────────

export async function getAchievementDigestPrefs(): Promise<AchievementDigestPrefs> {
  try {
    const raw = await AsyncStorage.getItem(DIGEST_PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

export async function saveAchievementDigestPrefs(
  prefs: Partial<AchievementDigestPrefs>
): Promise<AchievementDigestPrefs> {
  const current = await getAchievementDigestPrefs();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(DIGEST_PREFS_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Digest Data Generation ───────────────────────────────────────────────────

export async function generateAchievementDigest(): Promise<AchievementDigestData> {
  // Get weekly unlocks
  let weeklyUnlockedTitles: string[] = [];
  try {
    const weeklyRaw = await AsyncStorage.getItem(WEEKLY_UNLOCKS_KEY);
    if (weeklyRaw) {
      const weeklyUnlocks = JSON.parse(weeklyRaw);
      weeklyUnlockedTitles = weeklyUnlocks.map((u: any) => u.title || "Achievement");
    }
  } catch {}

  // Get total unlocked
  let totalUnlocked = 0;
  try {
    const idsRaw = await AsyncStorage.getItem(UNLOCKED_IDS_KEY);
    if (idsRaw) {
      totalUnlocked = JSON.parse(idsRaw).length;
    }
  } catch {}

  // Get streak
  let streakDays = 0;
  try {
    const streakRaw = await AsyncStorage.getItem("@streak_count");
    if (streakRaw) streakDays = parseInt(streakRaw, 10);
  } catch {}

  // Closest to unlock (simulated from progress data)
  const closestToUnlock = await getClosestAchievements();

  return {
    weeklyUnlockedCount: weeklyUnlockedTitles.length,
    weeklyUnlockedTitles,
    totalUnlocked,
    totalAchievements: TOTAL_ACHIEVEMENTS,
    closestToUnlock,
    streakDays,
  };
}

async function getClosestAchievements(): Promise<
  Array<{ title: string; progressPercent: number; remaining: string }>
> {
  // Read achievement progress from storage
  try {
    const progressRaw = await AsyncStorage.getItem("@achievements_progress");
    if (progressRaw) {
      const progress = JSON.parse(progressRaw);
      return progress
        .filter((a: any) => !a.unlocked && a.progress >= 60)
        .sort((a: any, b: any) => b.progress - a.progress)
        .slice(0, 3)
        .map((a: any) => ({
          title: a.title,
          progressPercent: a.progress,
          remaining: `${100 - a.progress}% to go`,
        }));
    }
  } catch {}
  return [];
}

// ─── Notification Scheduling ──────────────────────────────────────────────────

export async function scheduleAchievementDigest(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const prefs = await getAchievementDigestPrefs();
  if (!prefs.enabled) return null;

  try {
    const Notifications = await import("expo-notifications");

    // Cancel existing achievement digest notifications
    await cancelAchievementDigest();

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("achievement-digest", {
        name: "Achievement Digest",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      });
    }

    // Generate digest content
    const digest = await generateAchievementDigest();

    // Build notification body
    let body = "";
    if (digest.weeklyUnlockedCount > 0) {
      body = `🏆 You unlocked ${digest.weeklyUnlockedCount} achievement${digest.weeklyUnlockedCount > 1 ? "s" : ""} this week! `;
      if (digest.weeklyUnlockedTitles.length > 0) {
        body += `Including "${digest.weeklyUnlockedTitles[0]}"`;
        if (digest.weeklyUnlockedTitles.length > 1) {
          body += ` and ${digest.weeklyUnlockedTitles.length - 1} more`;
        }
        body += ". ";
      }
    } else {
      body = "No new achievements this week — keep pushing! ";
    }

    if (digest.closestToUnlock.length > 0) {
      body += `Almost there: "${digest.closestToUnlock[0].title}" (${digest.closestToUnlock[0].progressPercent}%)`;
    }

    body += ` Total: ${digest.totalUnlocked}/${digest.totalAchievements} earned.`;

    const title = DIGEST_MESSAGES[Math.floor(Math.random() * DIGEST_MESSAGES.length)];

    // Schedule weekly recurring notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          type: "achievement_digest",
          route: "/achievements-wall",
          ...digest,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: prefs.dayOfWeek,
        hour: prefs.hour,
        minute: prefs.minute,
      },
    });

    // Store scheduled info
    await AsyncStorage.setItem(
      DIGEST_SCHEDULED_KEY,
      JSON.stringify({
        identifier,
        scheduledAt: new Date().toISOString(),
        dayOfWeek: prefs.dayOfWeek,
        hour: prefs.hour,
        minute: prefs.minute,
      })
    );

    // Reset weekly unlocks counter after scheduling
    await AsyncStorage.setItem(WEEKLY_UNLOCKS_KEY, JSON.stringify([]));

    return identifier;
  } catch {
    return null;
  }
}

export async function cancelAchievementDigest(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");
    const raw = await AsyncStorage.getItem(DIGEST_SCHEDULED_KEY);
    if (raw) {
      const info = JSON.parse(raw);
      await Notifications.cancelScheduledNotificationAsync(info.identifier);
      await AsyncStorage.removeItem(DIGEST_SCHEDULED_KEY);
    }

    // Also cancel any with the achievement_digest type
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of all) {
      if (notif.content.data?.type === "achievement_digest") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {}
}

export async function getScheduledDigestInfo(): Promise<{
  identifier: string;
  scheduledAt: string;
  dayOfWeek: number;
  hour: number;
  minute: number;
} | null> {
  try {
    const raw = await AsyncStorage.getItem(DIGEST_SCHEDULED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// ─── Reschedule on Preference Change ──────────────────────────────────────────

export async function updateAndRescheduleDigest(
  prefs: Partial<AchievementDigestPrefs>
): Promise<AchievementDigestPrefs> {
  const updated = await saveAchievementDigestPrefs(prefs);

  if (updated.enabled) {
    await scheduleAchievementDigest();
  } else {
    await cancelAchievementDigest();
  }

  return updated;
}

// ─── Notification Response Handler ────────────────────────────────────────────

export function isAchievementDigestNotification(data: Record<string, unknown>): boolean {
  return data?.type === "achievement_digest";
}

export function getAchievementDigestRoute(): string {
  return "/achievements-wall";
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

export function formatDigestDay(dayOfWeek: number): string {
  const days = ["", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || "Sunday";
}

export function formatDigestTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}
