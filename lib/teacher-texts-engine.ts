/**
 * Teacher Texts Engine
 * 
 * Schedules and manages casual check-in messages from the AI teacher
 * throughout the day in the target language. Like a real tutor texting
 * "Hey, did you practice that verb conjugation we talked about?"
 * 
 * Supports customizable morning/afternoon/evening times and frequency.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { createVanillaClient } from "./trpc";
import { getStudentName } from "./teacher-memory";
import { getStruggles, getStudentProfile } from "./learning-intelligence";
import { getCurriculum } from "./curriculum-data";
import { getCompanionContext } from "./wave-cloud-memory";

// ─── Storage Keys ──────────────────────────────────────────────────────────
const TEACHER_TEXTS_KEY = "@teacher_texts_history";
const TEACHER_TEXTS_SCHEDULE_KEY = "@teacher_texts_schedule";
const TEACHER_TEXTS_LAST_SENT_KEY = "@teacher_texts_last_sent";
const TEACHER_TEXTS_PREFS_KEY = "@teacher_texts_prefs";
const MIN_HOURS_BETWEEN_TEXTS = 2;
const MAX_TEXTS_PER_DAY = 6;

// ─── Types ─────────────────────────────────────────────────────────────────
export interface TeacherText {
  id: string;
  message: string;
  type: string;
  language: string;
  timestamp: number;
  read: boolean;
}

export interface TeacherTextScheduleSlot {
  enabled: boolean;
  hour: number;
  minute: number;
  label: string; // "Morning", "Afternoon", "Evening"
  textType: string;
}

export interface TeacherTextPrefs {
  enabled: boolean;
  frequency: "light" | "moderate" | "frequent"; // 1x, 2x, 3x per day
  slots: TeacherTextScheduleSlot[];
  includeTargetLanguage: boolean; // Mix target language into messages
  casualTone: boolean; // Use casual/friendly tone
}

const DEFAULT_SLOTS: TeacherTextScheduleSlot[] = [
  { enabled: true, hour: 9, minute: 0, label: "Morning Motivation", textType: "motivation" },
  { enabled: true, hour: 14, minute: 0, label: "Afternoon Practice", textType: "practice_check" },
  { enabled: true, hour: 19, minute: 0, label: "Evening Review", textType: "conversation_starter" },
];

const DEFAULT_PREFS: TeacherTextPrefs = {
  enabled: true,
  frequency: "moderate",
  slots: DEFAULT_SLOTS,
  includeTargetLanguage: true,
  casualTone: true,
};

// ─── Motivational Messages ─────────────────────────────────────────────────
const MORNING_MESSAGES = [
  "Good morning! Ready to learn something new today?",
  "Rise and shine! Your language journey continues.",
  "Buenos días! Let's make today count.",
  "New day, new words to learn!",
  "Your teacher is here — let's get started!",
  "Morning! Did you dream in your target language yet?",
  "Hey! Quick warm-up before your day starts?",
];

const AFTERNOON_MESSAGES = [
  "Quick check — did you practice that grammar we covered?",
  "Hey! How about a 5-minute vocabulary review?",
  "Your brain is warmed up — perfect time for a quick lesson!",
  "Remember that tricky conjugation? Let's nail it today.",
  "Afternoon boost! Try using a new word in conversation today.",
  "Pop quiz time! Can you remember yesterday's vocabulary?",
];

const EVENING_MESSAGES = [
  "How was your day? Tell me about it in your target language!",
  "Wind down with a quick review of today's words.",
  "Before bed — try thinking about tomorrow's plans in your target language.",
  "Evening reflection: what new word did you use today?",
  "Great job today! Here's a fun expression for tomorrow.",
  "Relaxing? Perfect time to listen to some target language music!",
];

function getRandomMessage(textType: string): string {
  const pool = textType === "motivation" ? MORNING_MESSAGES
    : textType === "practice_check" ? AFTERNOON_MESSAGES
    : EVENING_MESSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Preferences ───────────────────────────────────────────────────────────

export async function getTeacherTextPrefs(): Promise<TeacherTextPrefs> {
  try {
    const raw = await AsyncStorage.getItem(TEACHER_TEXTS_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFS, ...parsed, slots: parsed.slots || DEFAULT_SLOTS };
    }
  } catch {}
  return { ...DEFAULT_PREFS };
}

export async function saveTeacherTextPrefs(prefs: Partial<TeacherTextPrefs>): Promise<TeacherTextPrefs> {
  const current = await getTeacherTextPrefs();
  const updated = { ...current, ...prefs };
  if (prefs.slots) updated.slots = prefs.slots;
  await AsyncStorage.setItem(TEACHER_TEXTS_PREFS_KEY, JSON.stringify(updated));
  return updated;
}

export async function updateSlotTime(
  slotIndex: number,
  hour: number,
  minute: number,
): Promise<TeacherTextPrefs> {
  const prefs = await getTeacherTextPrefs();
  if (slotIndex >= 0 && slotIndex < prefs.slots.length) {
    prefs.slots[slotIndex] = { ...prefs.slots[slotIndex], hour, minute };
  }
  await AsyncStorage.setItem(TEACHER_TEXTS_PREFS_KEY, JSON.stringify(prefs));
  return prefs;
}

export async function toggleSlot(slotIndex: number): Promise<TeacherTextPrefs> {
  const prefs = await getTeacherTextPrefs();
  if (slotIndex >= 0 && slotIndex < prefs.slots.length) {
    prefs.slots[slotIndex].enabled = !prefs.slots[slotIndex].enabled;
  }
  await AsyncStorage.setItem(TEACHER_TEXTS_PREFS_KEY, JSON.stringify(prefs));
  return prefs;
}

// ─── History Management ────────────────────────────────────────────────────

export async function getTeacherTextHistory(): Promise<TeacherText[]> {
  try {
    const stored = await AsyncStorage.getItem(TEACHER_TEXTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function saveTeacherText(text: Omit<TeacherText, "id" | "timestamp" | "read">): Promise<TeacherText> {
  const history = await getTeacherTextHistory();
  const newText: TeacherText = {
    ...text,
    id: `tt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    read: false,
  };
  history.unshift(newText);
  const trimmed = history.slice(0, 100);
  await AsyncStorage.setItem(TEACHER_TEXTS_KEY, JSON.stringify(trimmed));
  return newText;
}

export async function markTeacherTextRead(textId: string): Promise<void> {
  const history = await getTeacherTextHistory();
  const updated = history.map((t) => (t.id === textId ? { ...t, read: true } : t));
  await AsyncStorage.setItem(TEACHER_TEXTS_KEY, JSON.stringify(updated));
}

export async function getUnreadTeacherTextCount(): Promise<number> {
  const history = await getTeacherTextHistory();
  return history.filter((t) => !t.read).length;
}

// ─── Send Logic ────────────────────────────────────────────────────────────

export async function shouldSendTeacherText(): Promise<boolean> {
  try {
    const prefs = await getTeacherTextPrefs();
    if (!prefs.enabled) return false;

    // Also check voice settings toggle
    const settingsStr = await AsyncStorage.getItem("@voice_settings");
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      if (settings.teacherTextsEnabled === false) return false;
    }

    const lastSent = await AsyncStorage.getItem(TEACHER_TEXTS_LAST_SENT_KEY);
    if (lastSent) {
      const hoursSince = (Date.now() - parseInt(lastSent, 10)) / (1000 * 60 * 60);
      if (hoursSince < MIN_HOURS_BETWEEN_TEXTS) return false;
    }

    const history = await getTeacherTextHistory();
    const today = new Date().toDateString();
    const todayTexts = history.filter(
      (t) => new Date(t.timestamp).toDateString() === today
    );
    if (todayTexts.length >= MAX_TEXTS_PER_DAY) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Get vocabulary from recently completed lessons for personalization
 */
export async function getRecentLessonVocabulary(langCode: string, cefrLevel: string): Promise<string[]> {
  try {
    const progressRaw = await AsyncStorage.getItem("@lesson_progress");
    const completedIds: string[] = progressRaw ? JSON.parse(progressRaw) : [];
    if (completedIds.length === 0) return [];

    // Get the last 5 completed lesson IDs
    const recentIds = completedIds.slice(-5);
    const curriculum = getCurriculum(langCode);
    const allLessons = curriculum.units.flatMap((u) => u.lessons);

    // Extract lesson titles and descriptions as vocabulary context
    const recentLessons = allLessons.filter((l) => recentIds.includes(l.id));
    const vocabHints: string[] = [];
    for (const lesson of recentLessons) {
      // Extract key vocabulary terms from lesson title and description
      vocabHints.push(lesson.title);
      if (lesson.culturalHint) {
        // Extract quoted words from cultural hints
        const quoted = lesson.culturalHint.match(/'([^']+)'/g);
        if (quoted) vocabHints.push(...quoted.map((q) => q.replace(/'/g, "")));
      }
    }
    return vocabHints.slice(0, 8);
  } catch {
    return [];
  }
}

function pickTextType(hour: number, struggles: string[], recentTopics: string[]): string {
  if (hour < 10) return "motivation";
  if (hour < 13) return struggles.length > 0 ? "grammar_nudge" : "vocab_reminder";
  if (hour < 16) return "culture_share";
  if (hour < 19) return recentTopics.length > 0 ? "practice_check" : "conversation_starter";
  return "conversation_starter";
}

export async function generateAndDeliverTeacherText(): Promise<TeacherText | null> {
  const canSend = await shouldSendTeacherText();
  if (!canSend) return null;

  try {
    const vanillaClient = createVanillaClient();
    const studentName = await getStudentName();
    const targetLanguage = (await AsyncStorage.getItem("@target_language")) || "es";
    const cefrLevel = (await AsyncStorage.getItem("@cefr_level")) || "A1";
    const struggles = await getStruggles();
    const profile = await getStudentProfile();
    const companionCtx = await getCompanionContext();

    const langNameMap: Record<string, string> = {
      es: "Spanish", fr: "French", pt: "Portuguese", de: "German",
      it: "Italian", ja: "Japanese", ko: "Korean", zh: "Chinese",
      ar: "Arabic", en: "English",
    };

    const hour = new Date().getHours();
    const textType = pickTextType(
      hour,
      struggles.map((s) => s.topic),
      profile.strongAreas
    );

    // Get recent lesson vocabulary for personalization
    const recentVocab = await getRecentLessonVocabulary(targetLanguage, cefrLevel);
    const vocabContext = recentVocab.length > 0
      ? `\nRecent vocabulary from lessons: ${recentVocab.join(", ")}`
      : "";

    const result = await vanillaClient.waveCloudChat.generateTeacherText.mutate({
      studentName,
      targetLanguage: langNameMap[targetLanguage] || "Spanish",
      cefrLevel,
      recentTopics: profile.strongAreas.slice(0, 3),
      recentStruggles: struggles.map((s) => s.topic).slice(0, 3),
      recentVocabulary: recentVocab,
      memoryContext: (companionCtx.slice(0, 400) + vocabContext).slice(0, 600),
      textType: textType as any,
    });

    const savedText = await saveTeacherText({
      message: result.message,
      type: result.type,
      language: result.language,
    });

    await AsyncStorage.setItem(TEACHER_TEXTS_LAST_SENT_KEY, Date.now().toString());

    // Deliver immediate local notification
    if (Platform.OS !== "web") {
      const Notifications = await import("expo-notifications");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Your ${langNameMap[targetLanguage] || "Language"} Teacher`,
          body: result.message.slice(0, 150),
          data: { type: "teacher_text", textId: savedText.id, route: "/student-journal" },
          sound: "default",
        },
        trigger: null,
      });
    }

    return savedText;
  } catch {
    return null;
  }
}

// ─── Scheduled Notification Management ─────────────────────────────────────

const CHANNEL_ID = "teacher-texts";

/**
 * Schedule recurring teacher text notifications based on user preferences.
 * Called on app launch and whenever preferences change.
 */
export async function scheduleTeacherTexts(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const prefs = await getTeacherTextPrefs();

    // Also check voice settings toggle
    const settingsStr = await AsyncStorage.getItem("@voice_settings");
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      if (settings.teacherTextsEnabled === false) {
        await cancelTeacherTextSchedule();
        return;
      }
    }

    if (!prefs.enabled) {
      await cancelTeacherTextSchedule();
      return;
    }

    // Cancel existing schedule first
    await cancelTeacherTextSchedule();

    const Notifications = await import("expo-notifications");

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Teacher Messages",
        description: "Casual check-in messages from your AI teacher",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const targetLanguage = (await AsyncStorage.getItem("@target_language")) || "es";
    const langNameMap: Record<string, string> = {
      es: "Spanish", fr: "French", pt: "Portuguese", de: "German",
      it: "Italian", ja: "Japanese", ko: "Korean", zh: "Chinese",
      ar: "Arabic", en: "English",
    };
    const langName = langNameMap[targetLanguage] || "Language";

    // Determine which slots to schedule based on frequency
    const activeSlots = getActiveSlotsForFrequency(prefs);
    const scheduleIds: string[] = [];

    for (const slot of activeSlots) {
      if (!slot.enabled) continue;

      const message = getRandomMessage(slot.textType);
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${langName} Teacher`,
          body: message,
          data: {
            type: "teacher_text_trigger",
            textType: slot.textType,
            route: "/student-journal",
          },
          sound: "default",
          ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: slot.hour,
          minute: slot.minute,
        },
      });
      scheduleIds.push(identifier);
    }

    await AsyncStorage.setItem(TEACHER_TEXTS_SCHEDULE_KEY, JSON.stringify(scheduleIds));
  } catch {
    // Silent fail — notifications are optional
  }
}

/**
 * Get active slots based on frequency preference
 */
function getActiveSlotsForFrequency(prefs: TeacherTextPrefs): TeacherTextScheduleSlot[] {
  const enabledSlots = prefs.slots.filter((s) => s.enabled);
  switch (prefs.frequency) {
    case "light":
      // Only morning slot
      return enabledSlots.slice(0, 1);
    case "frequent":
      // All enabled slots
      return enabledSlots;
    case "moderate":
    default:
      // Morning + evening (skip afternoon)
      return enabledSlots.length <= 2 ? enabledSlots : [enabledSlots[0], enabledSlots[enabledSlots.length - 1]];
  }
}

/**
 * Cancel all scheduled teacher text notifications
 */
export async function cancelTeacherTextSchedule(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const Notifications = await import("expo-notifications");
    const stored = await AsyncStorage.getItem(TEACHER_TEXTS_SCHEDULE_KEY);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      for (const id of ids) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {}
      }
      await AsyncStorage.removeItem(TEACHER_TEXTS_SCHEDULE_KEY);
    }

    // Also cancel any stray teacher text notifications
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of all) {
      if (
        notif.content.data?.type === "teacher_text_trigger" ||
        notif.content.data?.type === "teacher_text"
      ) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch {}
}

/**
 * Update preferences and reschedule notifications
 */
export async function updatePrefsAndReschedule(
  prefs: Partial<TeacherTextPrefs>,
): Promise<TeacherTextPrefs> {
  const updated = await saveTeacherTextPrefs(prefs);
  if (updated.enabled) {
    await scheduleTeacherTexts();
  } else {
    await cancelTeacherTextSchedule();
  }
  return updated;
}

/**
 * Format a time slot for display
 */
export function formatSlotTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}

/**
 * Check if a notification response is a teacher text
 */
export function isTeacherTextNotification(data: Record<string, unknown>): boolean {
  return data?.type === "teacher_text" || data?.type === "teacher_text_trigger";
}

/**
 * Get the route to navigate to when a teacher text notification is tapped
 */
export function getTeacherTextRoute(): string {
  return "/student-journal";
}
