/**
 * Smart Engagement Notifications
 * 
 * Schedules local push notifications based on user behavior patterns:
 * - Streak reminders (don't break your streak!)
 * - New viral song breakdowns
 * - Lesson completion milestones
 * - Re-engagement after inactivity
 * - Smart timing based on user's active hours
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const ENGAGEMENT_PREFS_KEY = "@engagement_notif_prefs";
const LAST_ACTIVE_KEY = "@engagement_last_active";
const ACTIVE_HOURS_KEY = "@engagement_active_hours";
const STREAK_NOTIF_KEY = "@engagement_streak_scheduled";
const MUSIC_NOTIF_KEY = "@engagement_music_scheduled";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EngagementPreferences {
  streakReminders: boolean;
  musicAlerts: boolean;
  milestoneAlerts: boolean;
  reEngagement: boolean;
  quietHoursStart: number; // 0-23 hour
  quietHoursEnd: number;   // 0-23 hour
  timezone: string;
}

interface ActiveHoursProfile {
  /** Most active hour (0-23) based on usage history */
  peakHour: number;
  /** Second most active hour */
  secondaryHour: number;
  /** Average daily sessions */
  avgDailySessions: number;
  /** Days since last activity */
  daysSinceActive: number;
  /** Total sessions tracked */
  totalSessions: number;
}

export interface NotificationTemplate {
  id: string;
  category: "streak" | "music" | "milestone" | "reengagement" | "social";
  title: string;
  body: string;
  data: Record<string, string>;
  /** Priority: 1 = urgent, 2 = normal, 3 = low */
  priority: 1 | 2 | 3;
}

// ─── Default Preferences ──────────────────────────────────────────────────────
const DEFAULT_PREFS: EngagementPreferences = {
  streakReminders: true,
  musicAlerts: true,
  milestoneAlerts: true,
  reEngagement: true,
  quietHoursStart: 22, // 10 PM
  quietHoursEnd: 8,    // 8 AM
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

// ─── Notification Templates ───────────────────────────────────────────────────
const STREAK_TEMPLATES: Omit<NotificationTemplate, "id">[] = [
  {
    category: "streak",
    title: "🔥 Don't break your streak!",
    body: "You're on a {streak}-day streak! Just 5 minutes keeps it alive.",
    data: { route: "/(tabs)", type: "streak_reminder" },
    priority: 1,
  },
  {
    category: "streak",
    title: "⚡ Your streak is waiting",
    body: "Quick — one lesson keeps your {streak}-day streak going!",
    data: { route: "/(tabs)", type: "streak_reminder" },
    priority: 1,
  },
  {
    category: "streak",
    title: "🏆 {streak} days strong!",
    body: "Don't stop now. You're in the top 10% of learners this week.",
    data: { route: "/(tabs)", type: "streak_reminder" },
    priority: 1,
  },
];

const MUSIC_TEMPLATES: Omit<NotificationTemplate, "id">[] = [
  {
    category: "music",
    title: "🎵 New viral song breakdown!",
    body: "\"{songTitle}\" by {artist} is trending. Learn the lyrics now!",
    data: { route: "/song-player", type: "music_trending" },
    priority: 2,
  },
  {
    category: "music",
    title: "🔥 This song is everywhere right now",
    body: "\"{songTitle}\" — learn what everyone's singing in {language}.",
    data: { route: "/song-player", type: "music_trending" },
    priority: 2,
  },
  {
    category: "music",
    title: "🎶 New {genre} hit decoded",
    body: "We broke down \"{songTitle}\" word by word. Tap to learn!",
    data: { route: "/lyrics-player", type: "music_breakdown" },
    priority: 2,
  },
];

const MILESTONE_TEMPLATES: Omit<NotificationTemplate, "id">[] = [
  {
    category: "milestone",
    title: "🎉 Milestone unlocked!",
    body: "You've completed {count} lessons! Your {language} is leveling up.",
    data: { route: "/(tabs)/profile", type: "milestone" },
    priority: 2,
  },
  {
    category: "milestone",
    title: "📈 You learned {count} new words this week!",
    body: "Keep this pace and you'll be conversational in {timeEstimate}.",
    data: { route: "/(tabs)/profile", type: "milestone" },
    priority: 3,
  },
];

const REENGAGEMENT_TEMPLATES: Omit<NotificationTemplate, "id">[] = [
  {
    category: "reengagement",
    title: "👋 We miss you!",
    body: "It's been {days} days. Your {language} skills are waiting!",
    data: { route: "/(tabs)", type: "reengagement" },
    priority: 2,
  },
  {
    category: "reengagement",
    title: "🌍 What's new in {language}?",
    body: "New content dropped while you were away. Come check it out!",
    data: { route: "/(tabs)/tv", type: "reengagement" },
    priority: 2,
  },
  {
    category: "reengagement",
    title: "🗣️ Your AI teacher misses you",
    body: "{teacherName} has new conversation topics ready. Let's chat!",
    data: { route: "/(tabs)/teacher", type: "reengagement" },
    priority: 3,
  },
];

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Get or initialize engagement notification preferences.
 */
export async function getEngagementPrefs(): Promise<EngagementPreferences> {
  try {
    const stored = await AsyncStorage.getItem(ENGAGEMENT_PREFS_KEY);
    if (stored) return JSON.parse(stored);
    return DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Update engagement notification preferences.
 */
export async function updateEngagementPrefs(
  updates: Partial<EngagementPreferences>
): Promise<EngagementPreferences> {
  const current = await getEngagementPrefs();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(ENGAGEMENT_PREFS_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Record user activity to build active hours profile.
 * Call this on every app open or significant interaction.
 */
export async function recordActivity(): Promise<void> {
  const now = new Date();
  const hour = now.getHours();
  
  // Store last active timestamp
  await AsyncStorage.setItem(LAST_ACTIVE_KEY, now.toISOString());
  
  // Update active hours histogram
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_HOURS_KEY);
    const histogram: number[] = stored ? JSON.parse(stored) : new Array(24).fill(0);
    histogram[hour] = (histogram[hour] || 0) + 1;
    await AsyncStorage.setItem(ACTIVE_HOURS_KEY, JSON.stringify(histogram));
  } catch {
    // Non-critical, ignore
  }
}

/**
 * Get the user's active hours profile for smart timing.
 */
export async function getActiveHoursProfile(): Promise<ActiveHoursProfile> {
  try {
    const histogramStr = await AsyncStorage.getItem(ACTIVE_HOURS_KEY);
    const lastActiveStr = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
    
    const histogram: number[] = histogramStr ? JSON.parse(histogramStr) : new Array(24).fill(0);
    const totalSessions = histogram.reduce((sum, v) => sum + v, 0);
    
    // Find peak hours
    const sorted = histogram
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count);
    
    const peakHour = sorted[0]?.hour ?? 19; // Default to 7 PM
    const secondaryHour = sorted[1]?.hour ?? 12; // Default to noon
    
    // Calculate days since last active
    let daysSinceActive = 0;
    if (lastActiveStr) {
      const lastActive = new Date(lastActiveStr);
      daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      peakHour,
      secondaryHour,
      avgDailySessions: totalSessions > 0 ? totalSessions / 30 : 0, // Rough 30-day average
      daysSinceActive,
      totalSessions,
    };
  } catch {
    return {
      peakHour: 19,
      secondaryHour: 12,
      avgDailySessions: 0,
      daysSinceActive: 0,
      totalSessions: 0,
    };
  }
}

/**
 * Check if a given hour is within quiet hours.
 */
function isQuietHour(hour: number, prefs: EngagementPreferences): boolean {
  const { quietHoursStart, quietHoursEnd } = prefs;
  if (quietHoursStart < quietHoursEnd) {
    // e.g., 22-8 wraps around midnight
    return hour >= quietHoursStart || hour < quietHoursEnd;
  }
  // Normal range (e.g., 1-6)
  return hour >= quietHoursStart && hour < quietHoursEnd;
}

/**
 * Calculate the optimal notification time based on user's active hours
 * and quiet hours preferences.
 */
export function getOptimalNotificationTime(
  profile: ActiveHoursProfile,
  prefs: EngagementPreferences,
  category: NotificationTemplate["category"]
): { hour: number; minute: number } {
  // Streak reminders: schedule 2 hours before typical peak (give them time to act)
  // Music alerts: schedule at peak hour (when they're most engaged)
  // Re-engagement: schedule at secondary hour (different touchpoint)
  
  let targetHour: number;
  
  switch (category) {
    case "streak":
      // 2 hours before peak, so they have time to complete a lesson
      targetHour = (profile.peakHour - 2 + 24) % 24;
      break;
    case "music":
      // At peak engagement time
      targetHour = profile.peakHour;
      break;
    case "reengagement":
      // At secondary hour for a different touchpoint
      targetHour = profile.secondaryHour;
      break;
    default:
      targetHour = profile.peakHour;
  }
  
  // If target falls in quiet hours, shift to just after quiet hours end
  if (isQuietHour(targetHour, prefs)) {
    targetHour = prefs.quietHoursEnd;
  }
  
  // Add some randomness (0-30 min) to avoid feeling robotic
  const minute = Math.floor(Math.random() * 30);
  
  return { hour: targetHour, minute };
}

/**
 * Fill template variables with actual values.
 */
function fillTemplate(
  template: Omit<NotificationTemplate, "id">,
  vars: Record<string, string | number>
): NotificationTemplate {
  let title = template.title;
  let body = template.body;
  
  for (const [key, value] of Object.entries(vars)) {
    title = title.replace(`{${key}}`, String(value));
    body = body.replace(`{${key}}`, String(value));
  }
  
  return {
    ...template,
    id: `engagement_${template.category}_${Date.now()}`,
    title,
    body,
  };
}

/**
 * Schedule streak reminder notification.
 * Should be called daily when user opens the app.
 */
export async function scheduleStreakReminder(currentStreak: number): Promise<void> {
  if (Platform.OS === "web") return;
  
  const prefs = await getEngagementPrefs();
  if (!prefs.streakReminders || currentStreak < 2) return;
  
  try {
    const Notifications = await import("expo-notifications");
    
    // Cancel existing streak notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "streak_reminder") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
    
    // Get optimal time
    const profile = await getActiveHoursProfile();
    const { hour, minute } = getOptimalNotificationTime(profile, prefs, "streak");
    
    // Pick a random template
    const templateIdx = Math.floor(Math.random() * STREAK_TEMPLATES.length);
    const notification = fillTemplate(STREAK_TEMPLATES[templateIdx], {
      streak: currentStreak,
    });
    
    // Schedule for tomorrow at optimal time (only fires if they haven't opened app)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    
    await AsyncStorage.setItem(STREAK_NOTIF_KEY, JSON.stringify({
      scheduledAt: Date.now(),
      streak: currentStreak,
      triggerHour: hour,
    }));
  } catch (error) {
    console.warn("[EngagementNotif] Failed to schedule streak reminder:", error);
  }
}

/**
 * Schedule a notification for a new trending song.
 * Called when new viral music is detected in the tracker.
 */
export async function scheduleMusicAlert(song: {
  title: string;
  artist: string;
  language: string;
  genre: string;
}): Promise<void> {
  if (Platform.OS === "web") return;
  
  const prefs = await getEngagementPrefs();
  if (!prefs.musicAlerts) return;
  
  try {
    const Notifications = await import("expo-notifications");
    const profile = await getActiveHoursProfile();
    const { hour, minute } = getOptimalNotificationTime(profile, prefs, "music");
    
    // Pick a random music template
    const templateIdx = Math.floor(Math.random() * MUSIC_TEMPLATES.length);
    const notification = fillTemplate(MUSIC_TEMPLATES[templateIdx], {
      songTitle: song.title,
      artist: song.artist,
      language: song.language,
      genre: song.genre,
    });
    
    // Schedule for the next optimal time
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: { ...notification.data, songTitle: song.title, artist: song.artist },
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    
    await AsyncStorage.setItem(MUSIC_NOTIF_KEY, JSON.stringify({
      scheduledAt: Date.now(),
      song: song.title,
    }));
  } catch (error) {
    console.warn("[EngagementNotif] Failed to schedule music alert:", error);
  }
}

/**
 * Schedule milestone celebration notification.
 * Called after lesson completion when a milestone is hit.
 */
export async function scheduleMilestoneAlert(
  lessonsCompleted: number,
  language: string
): Promise<void> {
  if (Platform.OS === "web") return;
  
  const prefs = await getEngagementPrefs();
  if (!prefs.milestoneAlerts) return;
  
  // Only trigger at meaningful milestones
  const milestones = [5, 10, 25, 50, 75, 100, 150, 200, 300, 500];
  if (!milestones.includes(lessonsCompleted)) return;
  
  try {
    const Notifications = await import("expo-notifications");
    
    // Estimate time to conversational based on lessons
    const timeEstimate = lessonsCompleted < 50 ? "3-4 months" :
                         lessonsCompleted < 100 ? "6-8 weeks" :
                         "a few more weeks";
    
    const templateIdx = Math.floor(Math.random() * MILESTONE_TEMPLATES.length);
    const notification = fillTemplate(MILESTONE_TEMPLATES[templateIdx], {
      count: lessonsCompleted,
      language,
      timeEstimate,
    });
    
    // Show immediately (celebration)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: "default",
      },
      trigger: null, // Immediate
    });
  } catch (error) {
    console.warn("[EngagementNotif] Failed to schedule milestone alert:", error);
  }
}

/**
 * Schedule re-engagement notifications for inactive users.
 * Called on app open — if user has been away, schedule future re-engagement
 * in case they go inactive again.
 */
export async function scheduleReEngagement(
  language: string,
  teacherName: string
): Promise<void> {
  if (Platform.OS === "web") return;
  
  const prefs = await getEngagementPrefs();
  if (!prefs.reEngagement) return;
  
  try {
    const Notifications = await import("expo-notifications");
    
    // Cancel existing re-engagement notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "reengagement") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
    
    const profile = await getActiveHoursProfile();
    const { hour, minute } = getOptimalNotificationTime(profile, prefs, "reengagement");
    
    // Schedule at 3 days, 7 days, and 14 days of inactivity
    const intervals = [3, 7, 14];
    
    for (const days of intervals) {
      const templateIdx = Math.floor(Math.random() * REENGAGEMENT_TEMPLATES.length);
      const notification = fillTemplate(REENGAGEMENT_TEMPLATES[templateIdx], {
        days,
        language,
        teacherName,
      });
      
      // Schedule for N days from now at optimal time
      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + days);
      triggerDate.setHours(hour, minute, 0, 0);
      
      // Only schedule if trigger is in the future
      if (triggerDate.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
            sound: "default",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
      }
    }
  } catch (error) {
    console.warn("[EngagementNotif] Failed to schedule re-engagement:", error);
  }
}

/**
 * Master function: call on every app open to set up all engagement notifications.
 * Handles activity recording, streak reminders, and re-engagement scheduling.
 */
export async function initEngagementNotifications(params: {
  currentStreak: number;
  language: string;
  teacherName: string;
  lessonsCompleted: number;
}): Promise<void> {
  if (Platform.OS === "web") return;
  
  // Record this activity
  await recordActivity();
  
  // Schedule streak reminder (fires tomorrow if they don't return)
  await scheduleStreakReminder(params.currentStreak);
  
  // Schedule re-engagement (fires after 3/7/14 days of inactivity)
  await scheduleReEngagement(params.language, params.teacherName);
}

/**
 * Cancel all engagement notifications (e.g., when user disables them).
 */
export async function cancelAllEngagementNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  
  try {
    const Notifications = await import("expo-notifications");
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    const engagementTypes = ["streak_reminder", "music_trending", "music_breakdown", "milestone", "reengagement"];
    
    for (const notif of scheduled) {
      if (engagementTypes.includes(notif.content.data?.type as string)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.warn("[EngagementNotif] Failed to cancel notifications:", error);
  }
}

// ─── Exports for testing ──────────────────────────────────────────────────────
export const _testing = {
  STREAK_TEMPLATES,
  MUSIC_TEMPLATES,
  MILESTONE_TEMPLATES,
  REENGAGEMENT_TEMPLATES,
  isQuietHour,
  fillTemplate,
  getOptimalNotificationTime,
};
