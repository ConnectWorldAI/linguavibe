/**
 * ConnectWorld AI TV - Content Drop Scheduling System
 * 
 * Manages the daily content release schedule for AI TV series.
 * Each day has 10 content drops from 7am-10pm, creating a "TV schedule" feel.
 * Users get countdown timers and notifications for upcoming drops.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type DropType =
  | "ai_short_film"    // AI-generated episode from a series
  | "slang"            // Slang of the day
  | "surprise_call"    // Surprise AI agent call prompt
  | "music"            // Music feature / song breakdown
  | "cultural"         // Cultural deep dive
  | "recap"            // Daily recap / review
  | "live"             // Live event
  | "challenge";       // Daily challenge

export interface ContentDrop {
  id: string;
  time: string;           // "7:00 AM" format
  hour: number;           // 24h format for calculations
  minute: number;
  label: string;
  seriesId: string | null;
  seriesTitle: string | null;
  type: DropType;
  description: string;
  isAvailable: boolean;   // Has this drop happened today?
  isWatched: boolean;     // Has user consumed this?
}

export interface DailySchedule {
  date: string;           // YYYY-MM-DD
  drops: ContentDrop[];
  totalDrops: number;
  watchedCount: number;
}

export interface CountdownState {
  nextDrop: ContentDrop | null;
  timeUntil: string;       // "2h 15m" or "45m 30s" or "Now!"
  millisUntil: number;
  todayProgress: number;   // 0-1 how much of today's content is available
}

// ─── DEFAULT DAILY SCHEDULE ──────────────────────────────────────────────────
// This is the template; actual series assignments rotate based on day of week
const DAILY_SCHEDULE_TEMPLATE: Omit<ContentDrop, "id" | "isAvailable" | "isWatched">[] = [
  {
    time: "7:00 AM", hour: 7, minute: 0,
    label: "Morning Episode",
    seriesId: "granny-abroad",
    seriesTitle: "Granny Abroad",
    type: "ai_short_film",
    description: "Start your day with a laugh and new vocabulary",
  },
  {
    time: "7:05 AM", hour: 7, minute: 5,
    label: "Slang of the Day",
    seriesId: null,
    seriesTitle: null,
    type: "slang",
    description: "One new slang expression with examples and audio",
  },
  {
    time: "8:00 AM", hour: 8, minute: 0,
    label: "Professional Series",
    seriesId: "the-interview",
    seriesTitle: "The Interview",
    type: "ai_short_film",
    description: "Business vocabulary for your commute",
  },
  {
    time: "12:00 PM", hour: 12, minute: 0,
    label: "Lunch Break Episode",
    seriesId: "the-colmado",
    seriesTitle: "The Colmado",
    type: "ai_short_film",
    description: "Quick episode while you eat",
  },
  {
    time: "1:00 PM", hour: 13, minute: 0,
    label: "Surprise Agent Call",
    seriesId: null,
    seriesTitle: null,
    type: "surprise_call",
    description: "An AI character calls you for a practice conversation",
  },
  {
    time: "3:00 PM", hour: 15, minute: 0,
    label: "Music Feature",
    seriesId: null,
    seriesTitle: null,
    type: "music",
    description: "Song breakdown with lyrics translation",
  },
  {
    time: "5:00 PM", hour: 17, minute: 0,
    label: "Cooking Episode",
    seriesId: "kitchen-secrets",
    seriesTitle: "Kitchen Secrets",
    type: "ai_short_film",
    description: "Learn food vocabulary through recipes",
  },
  {
    time: "7:00 PM", hour: 19, minute: 0,
    label: "Evening Series",
    seriesId: "lost-in-translation",
    seriesTitle: "Lost in Translation",
    type: "ai_short_film",
    description: "Wind down with a drama episode",
  },
  {
    time: "9:00 PM", hour: 21, minute: 0,
    label: "Cultural Deep Dive",
    seriesId: null,
    seriesTitle: null,
    type: "cultural",
    description: "Explore cultural context behind the language",
  },
  {
    time: "10:00 PM", hour: 22, minute: 0,
    label: "Daily Recap",
    seriesId: null,
    seriesTitle: null,
    type: "recap",
    description: "Review everything you learned today",
  },
];

// ─── SCHEDULE GENERATION ─────────────────────────────────────────────────────
const STORAGE_KEY = "@connectworld_tv_watched";

/**
 * Generate today's content schedule with availability status
 */
export function generateDailySchedule(): DailySchedule {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const drops: ContentDrop[] = DAILY_SCHEDULE_TEMPLATE.map((template, index) => {
    const isAvailable = currentHour > template.hour ||
      (currentHour === template.hour && currentMinute >= template.minute);

    return {
      ...template,
      id: `drop_${today}_${index}`,
      isAvailable,
      isWatched: false, // Will be updated from storage
    };
  });

  return {
    date: today,
    drops,
    totalDrops: drops.length,
    watchedCount: 0,
  };
}

/**
 * Calculate countdown to next content drop
 */
export function getCountdownState(): CountdownState {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const schedule = generateDailySchedule();

  // Find next upcoming drop
  const nextDrop = schedule.drops.find((d) => !d.isAvailable) || null;

  if (!nextDrop) {
    // All drops for today are done
    return {
      nextDrop: null,
      timeUntil: "Tomorrow 7:00 AM",
      millisUntil: 0,
      todayProgress: 1,
    };
  }

  // Calculate time until next drop
  const target = new Date();
  target.setHours(nextDrop.hour, nextDrop.minute, 0, 0);
  const diff = target.getTime() - now.getTime();

  let timeUntil: string;
  if (diff <= 0) {
    timeUntil = "Now!";
  } else {
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (h > 0) {
      timeUntil = `${h}h ${m}m`;
    } else if (m > 0) {
      timeUntil = `${m}m ${s}s`;
    } else {
      timeUntil = `${s}s`;
    }
  }

  const availableCount = schedule.drops.filter((d) => d.isAvailable).length;
  const todayProgress = availableCount / schedule.totalDrops;

  return {
    nextDrop,
    timeUntil,
    millisUntil: Math.max(0, diff),
    todayProgress,
  };
}

/**
 * Mark a content drop as watched
 */
export async function markDropWatched(dropId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const watched: string[] = stored ? JSON.parse(stored) : [];
    if (!watched.includes(dropId)) {
      watched.push(dropId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(watched));
    }
  } catch (e) {
    console.error("[ContentDrops] Error marking watched:", e);
  }
}

/**
 * Get all watched drop IDs for today
 */
export async function getWatchedDrops(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Get the type icon for a content drop
 */
export function getDropTypeIcon(type: DropType): string {
  switch (type) {
    case "ai_short_film": return "film";
    case "slang": return "chatbubble-ellipses";
    case "surprise_call": return "call";
    case "music": return "musical-notes";
    case "cultural": return "earth";
    case "recap": return "list";
    case "live": return "radio";
    case "challenge": return "trophy";
    default: return "ellipse";
  }
}

/**
 * Get the type color for a content drop
 */
export function getDropTypeColor(type: DropType): string {
  switch (type) {
    case "ai_short_film": return "#00AAFF";
    case "slang": return "#F59E0B";
    case "surprise_call": return "#EC4899";
    case "music": return "#8B5CF6";
    case "cultural": return "#22C55E";
    case "recap": return "#06B6D4";
    case "live": return "#EF4444";
    case "challenge": return "#F97316";
    default: return "#7EB8E0";
  }
}

/**
 * Schedule a notification for the next content drop
 * (To be called from the notification scheduler provider)
 */
export function getNextDropNotificationData(): {
  title: string;
  body: string;
  triggerMs: number;
} | null {
  const state = getCountdownState();
  if (!state.nextDrop || state.millisUntil <= 0) return null;

  return {
    title: `📺 ${state.nextDrop.label}`,
    body: state.nextDrop.seriesTitle
      ? `New episode of "${state.nextDrop.seriesTitle}" just dropped!`
      : state.nextDrop.description,
    triggerMs: state.millisUntil,
  };
}
