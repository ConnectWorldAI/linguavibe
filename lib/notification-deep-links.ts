/**
 * Notification Deep Link Handler
 *
 * Routes notification taps to the correct screen based on notification data.
 * Integrates with the existing incoming-call-handler chain so that all
 * notification types (calls, challenges, streak, creator, journal, engagement)
 * are handled in a single response listener.
 */
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// ─── Route Map ─────────────────────────────────────────────────────────────
// Maps notification `data.type` values to their target screen routes.
// If `data.route` is present it takes priority; this map is the fallback.
const NOTIFICATION_ROUTE_MAP: Record<string, string> = {
  // Streak & gamification
  "streak-reminder": "/(tabs)",
  "streak_reminder": "/(tabs)",

  // Creator content
  "creator_content_new": "/creator-feed",

  // Journal prompts
  "journal_prompt_of_the_day": "/student-journal",

  // Music & engagement
  "music_trending": "/song-player",
  "music_breakdown": "/lyrics-player",

  // Milestones
  "milestone": "/(tabs)/profile",

  // Re-engagement
  "reengagement": "/(tabs)",

  // Grammar challenges
  "grammar_challenge": "/grammar-challenge",

  // Progress report
  "weekly_report": "/progress-report-card",

  // Achievement digest
  "achievement_digest": "/progress-report-card",

  // Incoming call (handled by incoming-call-handler, listed for completeness)
  "incoming_call": "/video-call",
};

// ─── Handler ───────────────────────────────────────────────────────────────
/**
 * Attempt to route a notification response to the correct screen.
 * Returns `true` if the notification was handled, `false` otherwise.
 */
export function handleNotificationDeepLink(
  response: Notifications.NotificationResponse
): boolean {
  const data = response.notification.request.content.data;
  if (!data) return false;

  // 1. If the notification carries an explicit `route`, use it directly
  if (data.route && typeof data.route === "string") {
    const params = extractParams(data);
    if (Object.keys(params).length > 0) {
      router.push({ pathname: data.route as any, params } as any);
    } else {
      router.push(data.route as any);
    }
    tapHaptic();
    return true;
  }

  // 2. If the notification carries a `screen` field (legacy pattern)
  if (data.screen && typeof data.screen === "string") {
    router.push(`/${data.screen}` as any);
    tapHaptic();
    return true;
  }

  // 3. If the notification carries a `url` field (generic deep link)
  if (data.url && typeof data.url === "string") {
    router.push(data.url as any);
    tapHaptic();
    return true;
  }

  // 4. Look up the type in the route map
  if (data.type && typeof data.type === "string") {
    const route = NOTIFICATION_ROUTE_MAP[data.type];
    if (route) {
      const params = extractParams(data);
      if (Object.keys(params).length > 0) {
        router.push({ pathname: route as any, params } as any);
      } else {
        router.push(route as any);
      }
      tapHaptic();
      return true;
    }
  }

  return false;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function tapHaptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

/**
 * Extract useful navigation params from notification data,
 * excluding internal fields like `type`, `route`, `screen`, `url`.
 */
function extractParams(data: Record<string, unknown>): Record<string, string> {
  const SKIP_KEYS = new Set(["type", "route", "screen", "url", "sound"]);
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!SKIP_KEYS.has(key) && value != null) {
      params[key] = String(value);
    }
  }
  return params;
}

// ─── Exported Constants ────────────────────────────────────────────────────
export { NOTIFICATION_ROUTE_MAP };
