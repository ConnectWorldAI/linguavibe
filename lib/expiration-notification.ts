import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EXPIRATION_NOTIF_SCHEDULED_KEY = "@connectworld_expiration_notif_scheduled";

/**
 * Schedule a local notification 3 days before billing cycle ends
 * to remind users about unused credits.
 */
export async function scheduleExpirationNotification(billingCycleEnd: string): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    // Check if we already scheduled for this cycle
    const scheduled = await AsyncStorage.getItem(EXPIRATION_NOTIF_SCHEDULED_KEY);
    if (scheduled === billingCycleEnd) return;

    const Notifications = await import("expo-notifications");

    // Cancel existing expiration notifications
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of allScheduled) {
      if ((notif.content.data as any)?.type === "credit_expiration") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Calculate 3 days before cycle end
    const cycleEnd = new Date(billingCycleEnd);
    const reminderDate = new Date(cycleEnd);
    reminderDate.setDate(reminderDate.getDate() - 3);
    reminderDate.setHours(10, 0, 0, 0); // 10 AM

    const now = new Date();
    if (reminderDate <= now) return; // Already past reminder date

    const secondsUntil = Math.floor((reminderDate.getTime() - now.getTime()) / 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏳ Credits Expiring Soon!",
        body: "Your unused credits will reset in 3 days. Use them before they're gone!",
        data: { type: "credit_expiration", route: "/usage-dashboard" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil,
        repeats: false,
      },
    });

    await AsyncStorage.setItem(EXPIRATION_NOTIF_SCHEDULED_KEY, billingCycleEnd);
  } catch {}
}
