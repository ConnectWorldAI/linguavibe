/**
 * Surprise Lesson Notification Tap Handler
 * 
 * Routes users to the surprise lesson screen when they tap
 * a surprise lesson push notification.
 */
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Platform } from "react-native";

/**
 * Handle when user taps a surprise lesson notification.
 * Routes them directly to the surprise lesson screen.
 * Returns true if the notification was handled.
 */
export function handleSurpriseLessonNotificationTap(
  response: Notifications.NotificationResponse,
): boolean {
  const data = response.notification.request.content.data;

  if (data?.type === "surprise_lesson") {
    router.push({
      pathname: "/surprise-lesson",
      params: { fromNotification: "true" },
    } as any);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    return true;
  }

  // Also handle teacher text notifications
  if (data?.type === "teacher_text") {
    router.push({
      pathname: "/student-journal",
      params: { fromNotification: "true" },
    } as any);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    return true;
  }

  return false;
}
