/**
 * Cultural Feed Notifications — Schedules local push notifications
 * when cultural holidays are approaching (7, 3, and 1 day before).
 * 
 * Provides vocabulary suggestions in the notification body so users
 * can start learning relevant words before the holiday arrives.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUpcomingHolidays, getAllHolidaysForLanguage, type CulturalHoliday } from "./cultural-calendar";

const FEED_NOTIF_KEY = "@cultural_feed_last_scheduled";

/**
 * Schedule cultural feed notifications for approaching holidays.
 * Schedules alerts at 7 days, 3 days, and 1 day before each holiday.
 */
export async function scheduleCulturalFeedNotifications(languageCode: string): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");

    // Cancel existing cultural feed notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "cultural_feed") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Get all holidays for this language
    const holidays = getAllHolidaysForLanguage(languageCode);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    // Schedule notifications for holidays within the next 30 days
    const upcomingHolidays = getUpcomingHolidays(languageCode, 30);

    for (const holiday of upcomingHolidays) {
      const daysUntil = calculateDaysUntil(holiday, currentMonth, currentDay);

      // Schedule 7-day alert
      if (daysUntil >= 7) {
        await scheduleHolidayAlert(Notifications, holiday, 7, daysUntil);
      }

      // Schedule 3-day alert
      if (daysUntil >= 3) {
        await scheduleHolidayAlert(Notifications, holiday, 3, daysUntil);
      }

      // Schedule 1-day alert
      if (daysUntil >= 1) {
        await scheduleHolidayAlert(Notifications, holiday, 1, daysUntil);
      }

      // Schedule day-of alert
      if (daysUntil >= 0) {
        await scheduleHolidayAlert(Notifications, holiday, 0, daysUntil);
      }
    }

    // Store last scheduled timestamp
    await AsyncStorage.setItem(FEED_NOTIF_KEY, JSON.stringify({
      language: languageCode,
      scheduledAt: now.toISOString(),
      holidayCount: upcomingHolidays.length,
    }));
  } catch (error) {
    // Silently fail — notifications are optional
    console.warn("Failed to schedule cultural feed notifications:", error);
  }
}

/**
 * Schedule a single holiday alert notification.
 */
async function scheduleHolidayAlert(
  Notifications: any,
  holiday: CulturalHoliday,
  alertDaysBefore: number,
  currentDaysUntil: number
): Promise<void> {
  const secondsUntilAlert = (currentDaysUntil - alertDaysBefore) * 86400;
  if (secondsUntilAlert < 0) return; // Already passed

  const { title, body } = getNotificationContent(holiday, alertDaysBefore);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: {
        type: "cultural_feed",
        holidayId: holiday.id,
        holidayName: holiday.nativeName,
        daysUntil: alertDaysBefore,
      },
    },
    trigger: secondsUntilAlert === 0
      ? null // Send immediately for same-day
      : {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(secondsUntilAlert, 60), // Minimum 60 seconds
          repeats: false,
        },
  });
}

/**
 * Generate notification content based on days until holiday.
 */
function getNotificationContent(holiday: CulturalHoliday, daysBefore: number): { title: string; body: string } {
  const vocabPreview = holiday.vocabulary.slice(0, 3).join(", ");
  const greeting = holiday.greetings[0] || "";

  switch (daysBefore) {
    case 7:
      return {
        title: `${holiday.nativeName} in 7 days!`,
        body: `Start learning: ${vocabPreview}. ${holiday.vocabulary.length} words to master before the celebration!`,
      };
    case 3:
      return {
        title: `${holiday.nativeName} in 3 days!`,
        body: `Practice saying: "${greeting}" — you'll need it soon! ${holiday.foods.slice(0, 2).join(" & ")} will be everywhere.`,
      };
    case 1:
      return {
        title: `${holiday.nativeName} is TOMORROW!`,
        body: `Final prep! Greet people with: "${greeting}". Know these foods: ${holiday.foods.slice(0, 3).join(", ")}.`,
      };
    case 0:
      return {
        title: `${holiday.nativeName} is TODAY!`,
        body: `Happy ${holiday.nativeName}! Use what you learned: "${greeting}". Enjoy the celebration!`,
      };
    default:
      return {
        title: `${holiday.nativeName} approaching!`,
        body: `Learn the vocabulary: ${vocabPreview}`,
      };
  }
}

/**
 * Calculate days until a holiday (same logic as cultural-calendar.ts).
 */
function calculateDaysUntil(holiday: CulturalHoliday, currentMonth: number, currentDay: number): number {
  let holidayDayOfYear = (holiday.month - 1) * 30 + holiday.day;
  let currentDayOfYear = (currentMonth - 1) * 30 + currentDay;
  let diff = holidayDayOfYear - currentDayOfYear;
  if (diff < -holiday.durationDays) {
    diff += 360;
  }
  return diff;
}

/**
 * Get feed items for display — upcoming holidays with vocabulary suggestions.
 * Used by the Live Cultural Feed screen.
 */
export interface FeedItem {
  holiday: CulturalHoliday;
  daysUntil: number;
  urgency: "happening_now" | "tomorrow" | "this_week" | "coming_soon" | "upcoming";
  vocabularySuggestions: string[];
  greeting: string;
  foodsToKnow: string[];
}

export function getCulturalFeedItems(languageCode: string, daysAhead: number = 30): FeedItem[] {
  const holidays = getUpcomingHolidays(languageCode, daysAhead);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  return holidays.map(holiday => {
    const daysUntil = calculateDaysUntil(holiday, currentMonth, currentDay);
    let urgency: FeedItem["urgency"];
    if (daysUntil <= 0) urgency = "happening_now";
    else if (daysUntil === 1) urgency = "tomorrow";
    else if (daysUntil <= 3) urgency = "this_week";
    else if (daysUntil <= 7) urgency = "coming_soon";
    else urgency = "upcoming";

    return {
      holiday,
      daysUntil,
      urgency,
      vocabularySuggestions: holiday.vocabulary.slice(0, 10),
      greeting: holiday.greetings[0] || "",
      foodsToKnow: holiday.foods.slice(0, 5),
    };
  });
}

/**
 * Check if cultural feed notifications should be rescheduled.
 * Call this on app startup to ensure notifications are current.
 */
/**
 * Schedule daily cultural intelligence push notifications.
 * Sends a daily cultural tidbit from the AI friend at a preferred time.
 * Content is generated from the Cultural Intelligence Pipeline's cached feed.
 */
export async function scheduleDailyCulturalPush(
  languageCode: string,
  preferredHour: number = 10, // Default 10 AM
): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");

    // Cancel existing daily cultural pushes
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "daily_cultural_intel") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Schedule daily recurring notification
    const dailyMessages = getDailyCulturalMessages(languageCode);
    if (dailyMessages.length === 0) return;

    // Pick a random message for today
    const todayMessage = dailyMessages[Math.floor(Math.random() * dailyMessages.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: todayMessage.title,
        body: todayMessage.body,
        sound: true,
        data: {
          type: "daily_cultural_intel",
          category: todayMessage.category,
          route: "/cultural-feed",
          vocabulary: JSON.stringify(todayMessage.vocabulary),
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: preferredHour,
        minute: 0,
      },
    });

    // Store scheduling info
    await AsyncStorage.setItem("@daily_cultural_push", JSON.stringify({
      language: languageCode,
      scheduledAt: new Date().toISOString(),
      preferredHour,
    }));
  } catch (error) {
    console.warn("Failed to schedule daily cultural push:", error);
  }
}

/**
 * Generate daily cultural message options based on language.
 * These are templates that rotate daily.
 */
function getDailyCulturalMessages(languageCode: string): Array<{
  title: string;
  body: string;
  category: string;
  vocabulary: Array<{ word: string; meaning: string }>;
}> {
  const langBase = languageCode.substring(0, 2);

  const messages: Record<string, Array<{
    title: string;
    body: string;
    category: string;
    vocabulary: Array<{ word: string; meaning: string }>;
  }>> = {
    es: [
      {
        title: "\uD83C\uDFB5 Tu amigo dice...",
        body: "Did you know reggaeton started in Puerto Rico in the 90s? The word 'perreo' comes from 'perro' (dog) — it describes the dance style!",
        category: "music",
        vocabulary: [{ word: "perreo", meaning: "reggaeton dance" }, { word: "cancion", meaning: "song" }],
      },
      {
        title: "\uD83C\uDF2E Cultural bite!",
        body: "In Mexico, 'sobremesa' is the time after a meal when everyone stays at the table talking. There's no English word for it!",
        category: "culture",
        vocabulary: [{ word: "sobremesa", meaning: "after-meal conversation" }, { word: "comida", meaning: "meal" }],
      },
      {
        title: "\uD83D\uDCF0 What's trending?",
        body: "'No mames' is one of the most common Mexican slang expressions. It means 'no way!' or 'you're kidding!' Use it with friends only!",
        category: "slang",
        vocabulary: [{ word: "no mames", meaning: "no way!" }, { word: "neta", meaning: "for real" }],
      },
      {
        title: "\uD83C\uDDFA\uD83C\uDDF8\u2192\uD83C\uDDF2\uD83C\uDDFD Your friend says...",
        body: "Fun fact: Spanish has more native speakers than English! 500M+ people speak it. You're joining a massive community.",
        category: "history",
        vocabulary: [{ word: "idioma", meaning: "language" }, { word: "hablante", meaning: "speaker" }],
      },
    ],
    fr: [
      {
        title: "\uD83C\uDDEB\uD83C\uDDF7 Ton ami dit...",
        body: "In France, it's rude to eat on the go. The French sit down for every meal — even a quick coffee. 'Prendre son temps' is a lifestyle!",
        category: "culture",
        vocabulary: [{ word: "repas", meaning: "meal" }, { word: "caf\u00e9", meaning: "coffee" }],
      },
      {
        title: "\uD83C\uDFB5 Music moment!",
        body: "French rap is HUGE — artists like Ninho and Jul dominate charts. 'Banger' in French slang? 'Un son de ouf!'",
        category: "music",
        vocabulary: [{ word: "un son", meaning: "a track/song" }, { word: "ouf", meaning: "crazy (verlan for fou)" }],
      },
    ],
    pt: [
      {
        title: "\uD83C\uDDE7\uD83C\uDDF7 Seu amigo diz...",
        body: "Brazilians say 'saudade' for a deep longing for something you love. No exact English translation exists!",
        category: "culture",
        vocabulary: [{ word: "saudade", meaning: "deep longing" }, { word: "amor", meaning: "love" }],
      },
    ],
    ja: [
      {
        title: "\uD83C\uDDEF\uD83C\uDDF5 Your friend says...",
        body: "In Japan, 'KY' (kuuki yomenai) means someone who can't read the room. Social awareness is huge in Japanese culture!",
        category: "culture",
        vocabulary: [{ word: "\u7A7A\u6C17", meaning: "atmosphere/mood" }, { word: "\u8AAD\u3080", meaning: "to read" }],
      },
    ],
    ko: [
      {
        title: "\uD83C\uDDF0\uD83C\uDDF7 Your friend says...",
        body: "'Aegyo' (\uC560\uAD50) is acting cute in Korean culture. K-pop idols do it all the time! It's a real social skill.",
        category: "culture",
        vocabulary: [{ word: "\uC560\uAD50", meaning: "cute charm" }, { word: "\uC544\uC774\uB3CC", meaning: "idol" }],
      },
    ],
  };

  // Default messages for any language
  const defaults = [
    {
      title: "\uD83C\uDF0D Daily language tip!",
      body: "The best way to learn a language is to make mistakes. Every error is a step forward. Keep going!",
      category: "motivation",
      vocabulary: [] as Array<{ word: string; meaning: string }>,
    },
  ];

  return messages[langBase] || defaults;
}

/**
 * Check and reschedule daily cultural push if needed.
 * Call on app startup alongside holiday notifications.
 */
export async function checkAndRescheduleDailyCulturalPush(languageCode: string): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const enabled = await AsyncStorage.getItem("@daily_cultural_push_enabled");
    if (enabled === "false") return;

    const lastScheduled = await AsyncStorage.getItem("@daily_cultural_push");
    if (lastScheduled) {
      const data = JSON.parse(lastScheduled);
      const scheduledDate = new Date(data.scheduledAt);
      const hoursSince = (Date.now() - scheduledDate.getTime()) / (1000 * 60 * 60);

      if (data.language !== languageCode || hoursSince > 24) {
        await scheduleDailyCulturalPush(languageCode, data.preferredHour || 10);
      }
    } else {
      await scheduleDailyCulturalPush(languageCode);
    }
  } catch {
    // Silently fail
  }
}

export async function checkAndRescheduleFeedNotifications(languageCode: string): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const enabled = await AsyncStorage.getItem("@cultural_feed_notifications");
    if (enabled === "false") return;

    const lastScheduled = await AsyncStorage.getItem(FEED_NOTIF_KEY);
    if (lastScheduled) {
      const data = JSON.parse(lastScheduled);
      const scheduledDate = new Date(data.scheduledAt);
      const hoursSince = (Date.now() - scheduledDate.getTime()) / (1000 * 60 * 60);

      // Reschedule if language changed or more than 24 hours since last schedule
      if (data.language !== languageCode || hoursSince > 24) {
        await scheduleCulturalFeedNotifications(languageCode);
      }
    } else {
      // Never scheduled — do it now
      await scheduleCulturalFeedNotifications(languageCode);
    }
  } catch {
    // Silently fail
  }
}
