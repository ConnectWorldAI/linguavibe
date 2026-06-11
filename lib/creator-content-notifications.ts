/**
 * Creator Content Notification Triggers
 *
 * Fires local push notifications when new content from followed creators
 * is discovered by the auto-ingest pipeline. Integrates with the existing
 * engagement notification infrastructure for smart timing and quiet hours.
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Storage Keys ────────────────────────────────────────────────────────────
const CREATOR_NOTIF_PREFS_KEY = "@creator_content_notif_prefs";
const CREATOR_NOTIF_LAST_KEY = "@creator_content_notif_last";
const FOLLOWED_KEY = "connectworld_followed_influencers";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CreatorContentNotifPrefs {
  enabled: boolean;
  /** Only notify for followed creators (vs all featured) */
  followedOnly: boolean;
}

export interface CreatorContentPayload {
  creatorId: string;
  creatorName: string;
  platform: string;
  language: string;
  contentCount: number;
  /** Optional: first content title or description */
  contentPreview?: string;
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_PREFS: CreatorContentNotifPrefs = {
  enabled: true,
  followedOnly: false,
};

// ─── Notification Templates ──────────────────────────────────────────────────
const CREATOR_TEMPLATES = [
  {
    title: "New {language} content from {creatorName}!",
    body: "{contentCount} new post(s) just dropped. Tap to learn from real native speakers.",
  },
  {
    title: "{creatorName} posted something new",
    body: "Fresh {language} teaching content is ready for you. Don't miss it!",
  },
  {
    title: "Your favorite creator just posted",
    body: "{creatorName} has {contentCount} new {language} lesson(s). Check it out!",
  },
  {
    title: "Learn {language} with {creatorName}",
    body: "New content just arrived from {platform}. Tap to explore!",
  },
];

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function getCreatorContentNotifPrefs(): Promise<CreatorContentNotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(CREATOR_NOTIF_PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_PREFS;
}

export async function saveCreatorContentNotifPrefs(
  prefs: Partial<CreatorContentNotifPrefs>
): Promise<CreatorContentNotifPrefs> {
  const current = await getCreatorContentNotifPrefs();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(CREATOR_NOTIF_PREFS_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Follow State ────────────────────────────────────────────────────────────

async function getFollowedCreatorIds(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(FOLLOWED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ─── Template Filling ────────────────────────────────────────────────────────

function fillCreatorTemplate(
  template: { title: string; body: string },
  vars: Record<string, string | number>
): { title: string; body: string } {
  let title = template.title;
  let body = template.body;
  for (const [key, value] of Object.entries(vars)) {
    title = title.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    body = body.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return { title, body };
}

// ─── Notification Scheduling ─────────────────────────────────────────────────

/**
 * Schedule a notification when new creator content is ingested.
 * Call this from the auto-ingest result handler or polling check.
 */
export async function scheduleCreatorContentAlert(
  payload: CreatorContentPayload
): Promise<void> {
  if (Platform.OS === "web") return;

  const prefs = await getCreatorContentNotifPrefs();
  if (!prefs.enabled) return;

  // If followedOnly, check if this creator is followed
  if (prefs.followedOnly) {
    const followed = await getFollowedCreatorIds();
    if (!followed.includes(payload.creatorId)) return;
  }

  // Throttle: don't notify for same creator more than once per 6 hours
  try {
    const lastRaw = await AsyncStorage.getItem(CREATOR_NOTIF_LAST_KEY);
    if (lastRaw) {
      const last = JSON.parse(lastRaw) as Record<string, number>;
      const lastTime = last[payload.creatorId] || 0;
      if (Date.now() - lastTime < 6 * 60 * 60 * 1000) return;
    }
  } catch {}

  try {
    const Notifications = await import("expo-notifications");

    // Pick a random template
    const template = CREATOR_TEMPLATES[Math.floor(Math.random() * CREATOR_TEMPLATES.length)];
    const { title, body } = fillCreatorTemplate(template, {
      creatorName: payload.creatorName,
      language: payload.language,
      contentCount: payload.contentCount,
      platform: payload.platform,
    });

    // Schedule for 2 seconds from now (near-immediate but avoids trigger:null issues)
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: "creator_content_new",
          creatorId: payload.creatorId,
          route: "/creator-feed",
        },
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });

    // Record throttle timestamp
    const lastRaw = await AsyncStorage.getItem(CREATOR_NOTIF_LAST_KEY);
    const last = lastRaw ? JSON.parse(lastRaw) : {};
    last[payload.creatorId] = Date.now();
    await AsyncStorage.setItem(CREATOR_NOTIF_LAST_KEY, JSON.stringify(last));
  } catch (error) {
    console.warn("[CreatorContentNotif] Failed to schedule:", error);
  }
}

/**
 * Cancel all pending creator content notifications.
 */
export async function cancelCreatorContentAlerts(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "creator_content_new") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {}
}

// ─── Exports for Testing ─────────────────────────────────────────────────────
export const _testing = {
  CREATOR_TEMPLATES,
  fillCreatorTemplate,
  DEFAULT_PREFS,
};
