/**
 * Slang of the Day Push Notification
 *
 * Delivers one regional slang word daily with pronunciation, meaning,
 * and which country it's from — linking directly into the dialect quiz.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
  getSlangForLanguage,
  getSlangLanguageConfig,
  languageNameToCode,
  type SlangEntry,
} from "./slang-data";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SlangOfDayPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface ScheduledSlangNotifInfo {
  identifier: string;
  scheduledAt: string;
  hour: number;
  minute: number;
}

export interface SlangOfDayEntry {
  expression: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  dialect: string;
  dialectFlag: string;
  language: string;
  category: string;
  date: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PREFS_KEY = "@slang_of_day_prefs";
const SCHEDULED_KEY = "@slang_of_day_scheduled";
const HISTORY_KEY = "@slang_of_day_history";
const SENT_IDS_KEY = "@slang_of_day_sent_ids";
const NOTIF_CHANNEL_ID = "slang-of-the-day";

const TIME_TO_HOUR: Record<string, number> = {
  morning: 9,
  afternoon: 13,
  evening: 18,
  night: 20,
};

// Dialect to country/region mapping with flags
const DIALECT_INFO: Record<string, { country: string; flag: string }> = {
  dominican: { country: "Dominican Republic", flag: "\ud83c\udde9\ud83c\uddf4" },
  mexican: { country: "Mexico", flag: "\ud83c\uddf2\ud83c\uddfd" },
  colombian: { country: "Colombia", flag: "\ud83c\udde8\ud83c\uddf4" },
  venezuelan: { country: "Venezuela", flag: "\ud83c\uddfb\ud83c\uddea" },
  panamanian: { country: "Panama", flag: "\ud83c\uddf5\ud83c\udde6" },
  cuban: { country: "Cuba", flag: "\ud83c\udde8\ud83c\uddfa" },
  puertorican: { country: "Puerto Rico", flag: "\ud83c\uddf5\ud83c\uddf7" },
  argentine: { country: "Argentina", flag: "\ud83c\udde6\ud83c\uddf7" },
  peruvian: { country: "Peru", flag: "\ud83c\uddf5\ud83c\uddea" },
  chilean: { country: "Chile", flag: "\ud83c\udde8\ud83c\uddf1" },
  costarican: { country: "Costa Rica", flag: "\ud83c\udde8\ud83c\uddf7" },
  standard: { country: "Standard", flag: "\ud83c\uddea\ud83c\uddf8" },
  american: { country: "USA", flag: "\ud83c\uddfa\ud83c\uddf8" },
  british: { country: "UK", flag: "\ud83c\uddec\ud83c\udde7" },
  australian: { country: "Australia", flag: "\ud83c\udde6\ud83c\uddfa" },
  haitian: { country: "Haiti", flag: "\ud83c\udded\ud83c\uddf9" },
  quebecois: { country: "Qu\u00e9bec", flag: "\ud83c\udde8\ud83c\udde6" },
  african: { country: "West Africa", flag: "\ud83c\uddf8\ud83c\uddf3" },
  brazilian: { country: "Brazil", flag: "\ud83c\udde7\ud83c\uddf7" },
  european: { country: "Portugal", flag: "\ud83c\uddf5\ud83c\uddf9" },
  egyptian: { country: "Egypt", flag: "\ud83c\uddea\ud83c\uddec" },
  levantine: { country: "Lebanon/Syria", flag: "\ud83c\uddf1\ud83c\udde7" },
  gulf: { country: "UAE/Saudi", flag: "\ud83c\udde6\ud83c\uddea" },
};

const NOTIFICATION_BODIES = [
  "Learn a new slang word from {country} {flag}",
  "Today's slang: \"{expression}\" from {country} {flag}",
  "{flag} Did you know? \"{expression}\" means \"{meaning}\"",
  "Slang alert from {country}! \"{expression}\" {flag}",
  "Your daily slang drop: \"{expression}\" {flag}",
  "Street cred boost! Learn \"{expression}\" from {country} {flag}",
];

// ─── Preferences ────────────────────────────────────────────────────────────

export async function getSlangOfDayPrefs(): Promise<SlangOfDayPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default: enabled, use preferred study time
  const preferredTime = (await AsyncStorage.getItem("@preferred_time")) || "morning";
  return {
    enabled: true,
    hour: TIME_TO_HOUR[preferredTime] ?? 9,
    minute: 30,
  };
}

export async function saveSlangOfDayPrefs(prefs: SlangOfDayPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ─── History ────────────────────────────────────────────────────────────────

export async function getSlangOfDayHistory(): Promise<SlangOfDayEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function getSentIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SENT_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function addToHistory(entry: SlangOfDayEntry, slangId: string): Promise<void> {
  const history = await getSlangOfDayHistory();
  history.unshift(entry);
  // Keep last 90 days
  const trimmed = history.slice(0, 90);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));

  const sentIds = await getSentIds();
  sentIds.push(slangId);
  // Keep last 200 IDs
  await AsyncStorage.setItem(SENT_IDS_KEY, JSON.stringify(sentIds.slice(-200)));
}

// ─── Pick Today's Slang ─────────────────────────────────────────────────────

export async function pickSlangOfTheDay(): Promise<{
  entry: SlangOfDayEntry;
  slangId: string;
} | null> {
  try {
    const targetLang = (await AsyncStorage.getItem("@target_language")) || "Spanish";
    const targetDialect = (await AsyncStorage.getItem("@target_dialect")) || "";
    const langCode = languageNameToCode(targetLang);
    const config = getSlangLanguageConfig(langCode);
    if (!config) return null;

    const sentIds = await getSentIds();

    // Try to pick from the student's target dialect first, then other dialects
    const dialects = config.dialects || [];
    const targetDialectFirst = [
      ...dialects.filter((d) => d.code === targetDialect),
      ...dialects.filter((d) => d.code !== targetDialect),
    ];

    for (const dialect of targetDialectFirst) {
      const entries = getSlangForLanguage(langCode, dialect.code);
      const available = entries.filter((e) => !sentIds.includes(e.id));
      if (available.length === 0) continue;

      // Pick a random one
      const picked = available[Math.floor(Math.random() * available.length)];
      const dialectInfo = DIALECT_INFO[dialect.code] || {
        country: dialect.name,
        flag: dialect.flag,
      };

      const dayEntry: SlangOfDayEntry = {
        expression: picked.expression,
        meaning: picked.meaning,
        example: picked.example,
        exampleTranslation: picked.exampleTranslation,
        dialect: dialect.code,
        dialectFlag: dialectInfo.flag,
        language: targetLang,
        category: picked.category,
        date: new Date().toISOString().split("T")[0],
      };

      return { entry: dayEntry, slangId: picked.id };
    }

    // All slang exhausted — reset and start over
    await AsyncStorage.removeItem(SENT_IDS_KEY);
    return pickSlangOfTheDay();
  } catch {
    return null;
  }
}

// ─── Schedule Notification ──────────────────────────────────────────────────

export async function scheduleSlangOfDayNotification(): Promise<ScheduledSlangNotifInfo | null> {
  if (Platform.OS === "web") return null;
  const prefs = await getSlangOfDayPrefs();
  if (!prefs.enabled) return null;

  try {
    const Notifications = await import("expo-notifications");

    // Cancel existing
    await cancelSlangOfDayNotification();

    // Set up Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(NOTIF_CHANNEL_ID, {
        name: "Slang of the Day",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
      });
    }

    // Pick today's slang for the notification body
    const picked = await pickSlangOfTheDay();
    const targetLang = (await AsyncStorage.getItem("@target_language")) || "Spanish";

    let body = "A new slang word is waiting for you!";
    let title = `Slang of the Day`;

    if (picked) {
      const info = DIALECT_INFO[picked.entry.dialect] || {
        country: picked.entry.dialect,
        flag: "",
      };
      const template =
        NOTIFICATION_BODIES[
          Math.floor(Math.random() * NOTIFICATION_BODIES.length)
        ];
      body = template
        .replace("{country}", info.country)
        .replace("{flag}", info.flag)
        .replace("{expression}", picked.entry.expression)
        .replace("{meaning}", picked.entry.meaning);
      title = `${info.flag} ${targetLang} Slang of the Day`;

      // Save to history
      await addToHistory(picked.entry, picked.slangId);
    }

    // Schedule daily repeating notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: "slang_of_the_day",
          screen: "dialect-quiz",
          slangExpression: picked?.entry.expression || "",
          slangDialect: picked?.entry.dialect || "",
        },
        sound: "default",
        ...(Platform.OS === "android"
          ? { channelId: NOTIF_CHANNEL_ID }
          : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.hour,
        minute: prefs.minute,
      },
    });

    const info: ScheduledSlangNotifInfo = {
      identifier,
      scheduledAt: new Date().toISOString(),
      hour: prefs.hour,
      minute: prefs.minute,
    };
    await AsyncStorage.setItem(SCHEDULED_KEY, JSON.stringify(info));
    return info;
  } catch {
    return null;
  }
}

// ─── Cancel ─────────────────────────────────────────────────────────────────

export async function cancelSlangOfDayNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    const raw = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (raw) {
      const info: ScheduledSlangNotifInfo = JSON.parse(raw);
      await Notifications.cancelScheduledNotificationAsync(info.identifier);
      await AsyncStorage.removeItem(SCHEDULED_KEY);
    }
  } catch {}
}

// ─── Initialize ─────────────────────────────────────────────────────────────

export async function initSlangOfDayNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    // Check if already scheduled
    const raw = await AsyncStorage.getItem(SCHEDULED_KEY);
    if (raw) {
      const info: ScheduledSlangNotifInfo = JSON.parse(raw);
      // Re-schedule if prefs changed
      const prefs = await getSlangOfDayPrefs();
      if (info.hour !== prefs.hour || info.minute !== prefs.minute) {
        await scheduleSlangOfDayNotification();
      }
      return;
    }
    // First time — schedule
    await scheduleSlangOfDayNotification();
  } catch {}
}
