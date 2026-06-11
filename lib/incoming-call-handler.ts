/**
 * Incoming Call Notification Handler
 * 
 * Handles push notifications for incoming calls:
 * - Shows full-screen incoming call UI when notification arrives
 * - Plays ringtone sound and vibrates device
 * - Deep-links to video-call screen when user taps notification
 * - Sets up high-priority Android notification channel for calls
 */
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { Platform, Vibration } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Missed Call Badge Tracking ─────────────────────────────────────────────
const MISSED_CALLS_KEY = "@missed_calls_count";
let missedCallTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Increment the missed call badge count.
 * Called when an incoming call notification is not answered within 30 seconds.
 */
async function incrementMissedCallBadge(): Promise<void> {
  try {
    const current = await AsyncStorage.getItem(MISSED_CALLS_KEY);
    const count = (parseInt(current || "0", 10) || 0) + 1;
    await AsyncStorage.setItem(MISSED_CALLS_KEY, count.toString());
  } catch {}
}

/**
 * Clear the missed call badge count (call when user views calls tab).
 */
export async function clearMissedCallBadge(): Promise<void> {
  try {
    await AsyncStorage.setItem(MISSED_CALLS_KEY, "0");
  } catch {}
}

/**
 * Get the current missed call count.
 */
export async function getMissedCallCount(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(MISSED_CALLS_KEY);
    return parseInt(val || "0", 10) || 0;
  } catch {
    return 0;
  }
}

// ─── Android Notification Channel for Calls ──────────────────────────────────
// High-priority channel that bypasses Do Not Disturb for incoming calls
export async function setupCallNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("calls", {
    name: "Incoming Calls",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500], // Ring pattern
    lightColor: "#00D4FF",
    sound: "default",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true, // Show even in Do Not Disturb mode
    enableVibrate: true,
    enableLights: true,
  });

  // Also set up a general messaging channel
  await Notifications.setNotificationChannelAsync("messages", {
    name: "Messages",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#00D4FF",
    sound: "default",
  });
}

// ─── Vibration Pattern for Incoming Calls ────────────────────────────────────
let vibrationInterval: ReturnType<typeof setInterval> | null = null;

export function startCallVibration(): void {
  if (Platform.OS === "web") return;

  // Vibrate in a phone-ring pattern (vibrate 500ms, pause 1s, repeat)
  stopCallVibration(); // Clear any existing
  
  // Initial vibration burst
  Vibration.vibrate([0, 500, 200, 500, 200, 500, 1000], true);
}

export function stopCallVibration(): void {
  if (Platform.OS === "web") return;
  Vibration.cancel();
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
}

// ─── Notification Response Handler ───────────────────────────────────────────
// When user taps on an incoming call notification, navigate to the call screen
export function handleIncomingCallNotificationResponse(
  response: Notifications.NotificationResponse
): boolean {
  const data = response.notification.request.content.data;

  if (data?.type === "incoming_call") {
    const { callId, callerName, callType } = data as {
      callId: string;
      callerName: string;
      callType: string;
      roomName: string;
      callerId: number;
    };

    // Navigate to the video call screen with incoming call params
    router.push({
      pathname: "/video-call",
      params: {
        callId: callId as string,
        incoming: "true",
        callerName: callerName as string,
        type: callType as string,
      },
    } as any);

    // User answered — cancel the missed call timeout
    if (missedCallTimeout) {
      clearTimeout(missedCallTimeout);
      missedCallTimeout = null;
    }
    stopCallVibration();

    // Haptic feedback on answer
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    return true; // Handled
  }

  // Check for deep-link URL in data
  if (data?.url && typeof data.url === "string") {
    router.push(data.url as any);
    return true;
  }

  return false; // Not handled
}

// ─── Foreground Notification Handler ─────────────────────────────────────────
// When a call notification arrives while app is in foreground
export function handleForegroundCallNotification(
  notification: Notifications.Notification
): void {
  const data = notification.request.content.data;

  if (data?.type === "incoming_call") {
    const { callId, callerName, callType } = data as {
      callId: string;
      callerName: string;
      callType: string;
    };

    // Start vibration pattern for incoming call
    startCallVibration();

    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    // Set a 30-second timeout — if user doesn't answer, count as missed call
    if (missedCallTimeout) clearTimeout(missedCallTimeout);
    missedCallTimeout = setTimeout(() => {
      incrementMissedCallBadge();
      stopCallVibration();
    }, 30000);

    // Navigate directly to the incoming call screen
    router.push({
      pathname: "/video-call",
      params: {
        callId: callId as string,
        incoming: "true",
        callerName: callerName as string,
        type: callType as string,
      },
    } as any);
  }
}

// ─── Initialize Call Notification System ─────────────────────────────────────
let isInitialized = false;
let notificationSubscription: Notifications.EventSubscription | null = null;
let responseSubscription: Notifications.EventSubscription | null = null;

export function initializeCallNotifications(): () => void {
  if (isInitialized) return () => {};
  if (Platform.OS === "web") return () => {}; // Notifications not available on web
  isInitialized = true;

  // Set up Android call channel
  setupCallNotificationChannel();

  // Listen for incoming notifications (foreground)
  notificationSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      handleForegroundCallNotification(notification);
    }
  );

  // Listen for notification taps (background/killed)
  responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      // Try call handler first, then challenge handler, then generic URL routing
      const handled = handleIncomingCallNotificationResponse(response);
      if (!handled) {
        // Try challenge notification handler
        const { handleChallengeNotificationTap } = require("./challenge-notifications");
        const challengeHandled = handleChallengeNotificationTap(response);
        if (!challengeHandled) {
          // Try surprise lesson / teacher text handler
          const { handleSurpriseLessonNotificationTap } = require("./surprise-lesson-tap-handler");
          const surpriseHandled = handleSurpriseLessonNotificationTap(response);
          if (!surpriseHandled) {
            // Generic deep link handler (streak, creator, journal, engagement, etc.)
            const { handleNotificationDeepLink } = require("./notification-deep-links");
            handleNotificationDeepLink(response);
          }
        }
      }
    }
  );

  // Check if app was opened from a notification (cold start)
  // We already returned early on web at line 202, so this is always native here
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      const handled = handleIncomingCallNotificationResponse(response);
      if (!handled) {
        const { handleChallengeNotificationTap } = require("./challenge-notifications");
        const challengeHandled = handleChallengeNotificationTap(response);
        if (!challengeHandled) {
          const { handleSurpriseLessonNotificationTap } = require("./surprise-lesson-tap-handler");
          const surpriseHandled = handleSurpriseLessonNotificationTap(response);
          if (!surpriseHandled) {
            const { handleNotificationDeepLink } = require("./notification-deep-links");
            handleNotificationDeepLink(response);
          }
        }
      }
    }
  }).catch(() => {});

  // Return cleanup function
  return () => {
    notificationSubscription?.remove();
    responseSubscription?.remove();
    stopCallVibration();
    isInitialized = false;
  };
}
