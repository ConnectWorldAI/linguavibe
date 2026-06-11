/**
 * Notification Deep-Link Handler
 * 
 * Listens for notification taps and routes to the appropriate screen
 * based on the notification data payload.
 * 
 * Supported deep-link targets:
 * - "xp-dashboard" → /xp-dashboard
 * - "achievements" → /achievements
 * - "leaderboard" → /leaderboard
 * - "daily-xp-goal" → /daily-xp-goal
 * - "focus-mode" → /focus-mode
 */
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";

export type DeepLinkTarget =
  | "xp-dashboard"
  | "achievements"
  | "leaderboard"
  | "daily-xp-goal"
  | "focus-mode"
  | "weekly-goals"
  | "streak-shield";

const ROUTE_MAP: Record<DeepLinkTarget, string> = {
  "xp-dashboard": "/xp-dashboard",
  "achievements": "/achievements",
  "leaderboard": "/leaderboard",
  "daily-xp-goal": "/daily-xp-goal",
  "focus-mode": "/focus-mode",
  "weekly-goals": "/weekly-goals",
  "streak-shield": "/streak-shield",
};

/**
 * Initialize the notification response listener for deep-linking.
 * Call this once in the root layout.
 * Returns a cleanup function.
 */
export function initNotificationDeepLinking(): () => void {
  // Notifications are not available on web
  if (Platform.OS === "web") {
    return () => {};
  }

  // Handle notification taps when app is in background/killed
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      handleNotificationResponse(response);
    }
  );

  // Also check if app was opened via a notification (cold start)
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        handleNotificationResponse(response);
      }, 1000);
    }
  }).catch(() => {});

  return () => {
    subscription.remove();
  };
}

/**
 * Process a notification response and navigate to the target screen.
 */
function handleNotificationResponse(
  response: Notifications.NotificationResponse
): void {
  const data = response.notification.request.content.data;

  if (!data) return;

  const target = data.deepLink as DeepLinkTarget | undefined;
  const screen = data.screen as string | undefined;

  // Support both "deepLink" and "screen" data keys
  const routeKey = target || screen;

  if (routeKey && ROUTE_MAP[routeKey as DeepLinkTarget]) {
    try {
      router.push(ROUTE_MAP[routeKey as DeepLinkTarget] as any);
    } catch {
      // Navigation not ready yet, ignore
    }
  }
}

/**
 * Helper to create notification content with deep-link data.
 * Use this when scheduling notifications that should deep-link on tap.
 */
export function createDeepLinkNotificationContent(
  title: string,
  body: string,
  target: DeepLinkTarget,
  extraData?: Record<string, any>
): Notifications.NotificationContentInput {
  return {
    title,
    body,
    data: {
      deepLink: target,
      ...extraData,
    },
    sound: Platform.OS === "ios" ? "default" : undefined,
  };
}
