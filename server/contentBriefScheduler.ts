/**
 * Content Brief Scheduler
 * 
 * Weekly cron job that auto-generates 7 content briefs (one per day)
 * using generateWeeklyBriefs() and stores them in Airtable for the
 * content team to produce.
 */

import {
  generateWeeklyBriefs,
  getAllCreatorProfiles,
  getCreatorsByLanguage,
  type ContentBrief,
} from "../lib/viral-creator-templates";
import { getTrendingMusic } from "../lib/viral-music-tracker";

// ─── Airtable Config ────────────────────────────────────────────────────────

const AIRTABLE_API = "https://api.airtable.com/v0";

function getAirtableHeaders() {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("AIRTABLE_API_KEY not set");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function getBaseId() {
  const id = process.env.AIRTABLE_BASE_ID;
  if (!id) throw new Error("AIRTABLE_BASE_ID not set");
  return id;
}

// ─── TABLE 8: Content Briefs ────────────────────────────────────────────────

export const CONTENT_BRIEFS_TABLE = "Content Briefs";

export const CONTENT_BRIEFS_FIELDS = {
  Title: "Title",
  CreatorProfileId: "Creator Profile ID",
  CreatorHandle: "Creator Handle",
  Language: "Language",
  Topic: "Topic",
  Difficulty: "Difficulty",
  TargetDuration: "Target Duration (sec)",
  HookText: "Hook Text",
  ContentText: "Content Text",
  ExampleText: "Example Text",
  CTAText: "CTA Text",
  Hashtags: "Hashtags",
  ScheduledDate: "Scheduled Date",
  Status: "Status", // draft | scheduled | in_production | published | archived
  WeekNumber: "Week Number",
  CreatedAt: "Created At",
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScheduledBrief {
  brief: ContentBrief;
  scheduledDate: string; // ISO date
  weekNumber: number;
}

export interface WeeklySchedule {
  weekNumber: number;
  startDate: string;
  endDate: string;
  briefs: ScheduledBrief[];
  creatorId: string;
  language: string;
}

// ─── Language Rotation ──────────────────────────────────────────────────────

const LANGUAGE_ROTATION = [
  "Spanish",
  "Portuguese",
  "Korean",
  "Japanese",
  "French",
  "Arabic",
  "German",
  "Italian",
  "Chinese",
  "Russian",
];

/**
 * Get the target language for a given week number based on rotation.
 */
export function getLanguageForWeek(weekNumber: number): string {
  return LANGUAGE_ROTATION[weekNumber % LANGUAGE_ROTATION.length];
}

/**
 * Select the best creator for a given language, rotating through available creators.
 */
export function selectCreatorForWeek(language: string, weekNumber: number): string {
  const creators = getCreatorsByLanguage(language);
  if (creators.length === 0) {
    // Fallback to any creator
    const all = getAllCreatorProfiles();
    return all[weekNumber % all.length].id;
  }
  return creators[weekNumber % creators.length].id;
}

// ─── Topic Generation ───────────────────────────────────────────────────────

/**
 * Generate 7 topics for the week based on trending music and cultural content.
 */
export async function generateWeeklyTopics(language: string): Promise<string[]> {
  const trending = await getTrendingMusic(language);
  const topics: string[] = [];

  // Pull topics from trending music
  for (const song of trending.slice(0, 3)) {
    topics.push(`${song.genre} vocabulary: "${song.title}" by ${song.artist}`);
  }

  // Add cultural/dialect topics
  const culturalTopics: Record<string, string[]> = {
    Spanish: [
      "Street slang vs formal greetings",
      "Ordering food like a local",
      "Texting abbreviations and emoji culture",
      "Dance vocabulary: reggaeton moves",
    ],
    Portuguese: [
      "Gírias cariocas (Rio slang)",
      "Funk carioca vocabulary",
      "Brazilian vs Portuguese differences",
      "Carnival expressions",
    ],
    Korean: [
      "K-drama expressions you hear everywhere",
      "Aegyo (cute talk) phrases",
      "Korean texting slang (ㅋㅋㅋ, ㅎㅎ)",
      "K-pop fan vocabulary",
    ],
    Japanese: [
      "Anime expressions in real life",
      "Keigo (polite speech) basics",
      "Japanese internet slang (www, 草)",
      "Convenience store phrases",
    ],
    French: [
      "Verlan (French backwards slang)",
      "Parisian vs Québécois expressions",
      "French rap vocabulary",
      "Café culture phrases",
    ],
    Arabic: [
      "Egyptian dialect vs MSA",
      "Habibi and terms of endearment",
      "Arabic calligraphy vocabulary",
      "Marketplace haggling phrases",
    ],
    German: [
      "Denglisch (German-English mashups)",
      "Berlin street slang",
      "Oktoberfest vocabulary",
      "German compound word creativity",
    ],
    Italian: [
      "Italian hand gestures and their meanings",
      "Regional dialect differences",
      "Opera vocabulary in daily life",
      "Italian coffee culture phrases",
    ],
    Chinese: [
      "Internet slang (666, 520, 233)",
      "Chengyu (4-character idioms) in daily life",
      "WeChat expressions",
      "Street food ordering phrases",
    ],
    Russian: [
      "Russian diminutives and affection",
      "Soviet-era expressions still used today",
      "Russian internet memes vocabulary",
      "Metro and city navigation phrases",
    ],
  };

  const langTopics = culturalTopics[language] || culturalTopics["Spanish"];
  const remaining = 7 - topics.length;
  topics.push(...langTopics.slice(0, remaining));

  return topics.slice(0, 7);
}

// ─── Schedule Generation ────────────────────────────────────────────────────

/**
 * Get the current ISO week number.
 */
export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Generate a full weekly schedule of content briefs.
 */
export function generateWeeklySchedule(weekNumber?: number): WeeklySchedule {
  const week = weekNumber ?? getWeekNumber();
  const language = getLanguageForWeek(week);
  const creatorId = selectCreatorForWeek(language, week);
  const topics = generateWeeklyTopics(language);
  const briefs = generateWeeklyBriefs(creatorId, language, topics);

  // Calculate dates for the week (Monday-Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // Monday = 1
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);

  const scheduledBriefs: ScheduledBrief[] = briefs.map((brief, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      brief,
      scheduledDate: date.toISOString().split("T")[0],
      weekNumber: week,
    };
  });

  const endDate = new Date(monday);
  endDate.setDate(monday.getDate() + 6);

  return {
    weekNumber: week,
    startDate: monday.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    briefs: scheduledBriefs,
    creatorId,
    language,
  };
}

// ─── Airtable Storage ───────────────────────────────────────────────────────

/**
 * Store a single content brief in Airtable.
 */
export async function storeBriefInAirtable(scheduled: ScheduledBrief): Promise<string | null> {
  try {
    const baseId = getBaseId();
    const headers = getAirtableHeaders();
    const { brief, scheduledDate, weekNumber } = scheduled;

    const record = {
      fields: {
        [CONTENT_BRIEFS_FIELDS.Title]: `${brief.topic} (${brief.language})`,
        [CONTENT_BRIEFS_FIELDS.CreatorProfileId]: brief.creatorProfileId,
        [CONTENT_BRIEFS_FIELDS.CreatorHandle]: brief.creatorHandle || "",
        [CONTENT_BRIEFS_FIELDS.Language]: brief.language,
        [CONTENT_BRIEFS_FIELDS.Topic]: brief.topic,
        [CONTENT_BRIEFS_FIELDS.Difficulty]: brief.difficulty,
        [CONTENT_BRIEFS_FIELDS.TargetDuration]: brief.targetDuration,
        [CONTENT_BRIEFS_FIELDS.HookText]: brief.script.find(s => s.type === "hook")?.text || "",
        [CONTENT_BRIEFS_FIELDS.ContentText]: brief.script.find(s => s.type === "content")?.text || "",
        [CONTENT_BRIEFS_FIELDS.ExampleText]: brief.script.find(s => s.type === "example")?.text || "",
        [CONTENT_BRIEFS_FIELDS.CTAText]: brief.script.find(s => s.type === "cta")?.text || "",
        [CONTENT_BRIEFS_FIELDS.Hashtags]: brief.hashtags.join(", "),
        [CONTENT_BRIEFS_FIELDS.ScheduledDate]: scheduledDate,
        [CONTENT_BRIEFS_FIELDS.Status]: "scheduled",
        [CONTENT_BRIEFS_FIELDS.WeekNumber]: weekNumber,
        [CONTENT_BRIEFS_FIELDS.CreatedAt]: new Date().toISOString(),
      },
    };

    const response = await fetch(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(CONTENT_BRIEFS_TABLE)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      console.error(`[ContentBriefScheduler] Airtable error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.id || null;
  } catch (error) {
    console.error("[ContentBriefScheduler] Failed to store brief:", error);
    return null;
  }
}

/**
 * Store an entire weekly schedule in Airtable (batch of up to 10 records).
 */
export async function storeWeeklyScheduleInAirtable(schedule: WeeklySchedule): Promise<number> {
  let stored = 0;
  for (const scheduled of schedule.briefs) {
    const id = await storeBriefInAirtable(scheduled);
    if (id) stored++;
  }
  return stored;
}

// ─── Cron Job Entry Point ───────────────────────────────────────────────────

/**
 * Main scheduler function — call this weekly (e.g., every Monday at 6am).
 * Generates 7 content briefs for the week and stores them in Airtable.
 */
export async function runWeeklyContentBriefScheduler(): Promise<{
  success: boolean;
  schedule: WeeklySchedule;
  storedCount: number;
  error?: string;
}> {
  try {
    const schedule = generateWeeklySchedule();
    console.log(
      `[ContentBriefScheduler] Generating week ${schedule.weekNumber} briefs ` +
      `for ${schedule.language} using creator ${schedule.creatorId}`
    );

    const storedCount = await storeWeeklyScheduleInAirtable(schedule);

    console.log(
      `[ContentBriefScheduler] Stored ${storedCount}/${schedule.briefs.length} briefs in Airtable`
    );

    return { success: true, schedule, storedCount };
  } catch (error: any) {
    console.error("[ContentBriefScheduler] Scheduler failed:", error);
    return {
      success: false,
      schedule: generateWeeklySchedule(),
      storedCount: 0,
      error: error.message,
    };
  }
}

/**
 * Preview next week's schedule without storing (for admin panel / dry run).
 */
export function previewNextWeekSchedule(): WeeklySchedule {
  const nextWeek = getWeekNumber() + 1;
  return generateWeeklySchedule(nextWeek);
}
