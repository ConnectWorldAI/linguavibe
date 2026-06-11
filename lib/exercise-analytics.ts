/**
 * Exercise Analytics Tracking
 * 
 * Tracks exercise completion rates, accuracy, and engagement per exercise type.
 * Stores data locally in AsyncStorage with daily aggregation.
 * Syncs to server when connectivity is available.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ExerciseType =
  | "rrt"
  | "netflix_dictation"
  | "whiteboard"
  | "visual_association"
  | "conversation"
  | "grammar"
  | "fill_order"
  | "match_pairs"
  | "story_choice"
  | "cultural_discovery"
  | "pronunciation"
  | "adaptive_lesson";

export interface ExerciseEvent {
  id: string;
  type: ExerciseType;
  timestamp: number;
  language: string;
  level?: string;
}

export interface ExerciseStartEvent extends ExerciseEvent {
  action: "start";
  phraseCount: number;
}

export interface ExerciseCompleteEvent extends ExerciseEvent {
  action: "complete";
  correct: number;
  total: number;
  durationMs: number;
  accuracy: number; // 0-100
  audioMode?: "server" | "device"; // For RRT exercises
}

export interface ExerciseAbandonedEvent extends ExerciseEvent {
  action: "abandoned";
  phraseIndex: number;
  reason: "exit" | "timeout" | "error" | "skip";
  durationMs: number;
}

export type AnalyticsEvent = ExerciseStartEvent | ExerciseCompleteEvent | ExerciseAbandonedEvent;

export interface DailyAggregate {
  date: string; // YYYY-MM-DD
  totalExercises: number;
  completedExercises: number;
  abandonedExercises: number;
  totalDurationMs: number;
  averageAccuracy: number;
  byType: Record<string, {
    started: number;
    completed: number;
    abandoned: number;
    totalCorrect: number;
    totalQuestions: number;
    totalDurationMs: number;
  }>;
  byLanguage: Record<string, {
    started: number;
    completed: number;
    averageAccuracy: number;
  }>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY_EVENTS = "@exercise_analytics_events";
const STORAGE_KEY_AGGREGATES = "@exercise_analytics_aggregates";
const STORAGE_KEY_LAST_SYNC = "@exercise_analytics_last_sync";
const MAX_EVENTS_BEFORE_AGGREGATE = 100;

// ─── Utility ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Core Tracking Functions ─────────────────────────────────────────────────

/**
 * Track the start of an exercise session.
 * Returns a session ID to be used when tracking completion or abandonment.
 */
export async function trackExerciseStart(
  type: ExerciseType,
  phraseCount: number,
  language: string,
  level?: string,
): Promise<string> {
  const id = generateId();
  const event: ExerciseStartEvent = {
    id,
    type,
    action: "start",
    timestamp: Date.now(),
    language,
    level,
    phraseCount,
  };

  await appendEvent(event);
  return id;
}

/**
 * Track the successful completion of an exercise.
 */
export async function trackExerciseComplete(
  sessionId: string,
  type: ExerciseType,
  correct: number,
  total: number,
  durationMs: number,
  language: string,
  options?: { level?: string; audioMode?: "server" | "device" },
): Promise<void> {
  const event: ExerciseCompleteEvent = {
    id: sessionId,
    type,
    action: "complete",
    timestamp: Date.now(),
    language,
    level: options?.level,
    correct,
    total,
    durationMs,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    audioMode: options?.audioMode,
  };

  await appendEvent(event);
  await maybeAggregate();
}

/**
 * Track when a user abandons an exercise before completion.
 */
export async function trackExerciseAbandoned(
  sessionId: string,
  type: ExerciseType,
  phraseIndex: number,
  reason: "exit" | "timeout" | "error" | "skip",
  durationMs: number,
  language: string,
): Promise<void> {
  const event: ExerciseAbandonedEvent = {
    id: sessionId,
    type,
    action: "abandoned",
    timestamp: Date.now(),
    language,
    phraseIndex,
    reason,
    durationMs,
  };

  await appendEvent(event);
  await maybeAggregate();
}

// ─── Storage Helpers ─────────────────────────────────────────────────────────

async function appendEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_EVENTS);
    const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    events.push(event);
    await AsyncStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
  } catch (err) {
    console.warn("[ExerciseAnalytics] Failed to store event:", err);
  }
}

async function maybeAggregate(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_EVENTS);
    const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];

    if (events.length < MAX_EVENTS_BEFORE_AGGREGATE) return;

    // Aggregate events older than today
    const today = getDateKey(Date.now());
    const toAggregate = events.filter((e) => getDateKey(e.timestamp) !== today);
    const toKeep = events.filter((e) => getDateKey(e.timestamp) === today);

    if (toAggregate.length === 0) return;

    // Load existing aggregates
    const aggRaw = await AsyncStorage.getItem(STORAGE_KEY_AGGREGATES);
    const aggregates: Record<string, DailyAggregate> = aggRaw ? JSON.parse(aggRaw) : {};

    // Process events into daily aggregates
    for (const event of toAggregate) {
      const dateKey = getDateKey(event.timestamp);
      if (!aggregates[dateKey]) {
        aggregates[dateKey] = {
          date: dateKey,
          totalExercises: 0,
          completedExercises: 0,
          abandonedExercises: 0,
          totalDurationMs: 0,
          averageAccuracy: 0,
          byType: {},
          byLanguage: {},
        };
      }

      const agg = aggregates[dateKey];

      if (event.action === "start") {
        agg.totalExercises++;
        // Init type entry
        if (!agg.byType[event.type]) {
          agg.byType[event.type] = { started: 0, completed: 0, abandoned: 0, totalCorrect: 0, totalQuestions: 0, totalDurationMs: 0 };
        }
        agg.byType[event.type].started++;
        // Init language entry
        if (!agg.byLanguage[event.language]) {
          agg.byLanguage[event.language] = { started: 0, completed: 0, averageAccuracy: 0 };
        }
        agg.byLanguage[event.language].started++;
      } else if (event.action === "complete") {
        agg.completedExercises++;
        agg.totalDurationMs += event.durationMs;
        // Update type stats
        if (!agg.byType[event.type]) {
          agg.byType[event.type] = { started: 0, completed: 0, abandoned: 0, totalCorrect: 0, totalQuestions: 0, totalDurationMs: 0 };
        }
        agg.byType[event.type].completed++;
        agg.byType[event.type].totalCorrect += event.correct;
        agg.byType[event.type].totalQuestions += event.total;
        agg.byType[event.type].totalDurationMs += event.durationMs;
        // Update language stats
        if (!agg.byLanguage[event.language]) {
          agg.byLanguage[event.language] = { started: 0, completed: 0, averageAccuracy: 0 };
        }
        agg.byLanguage[event.language].completed++;
      } else if (event.action === "abandoned") {
        agg.abandonedExercises++;
        agg.totalDurationMs += event.durationMs;
        if (!agg.byType[event.type]) {
          agg.byType[event.type] = { started: 0, completed: 0, abandoned: 0, totalCorrect: 0, totalQuestions: 0, totalDurationMs: 0 };
        }
        agg.byType[event.type].abandoned++;
        agg.byType[event.type].totalDurationMs += event.durationMs;
      }

      // Recalculate average accuracy for the day
      const completedEvents = toAggregate.filter(
        (e) => e.action === "complete" && getDateKey(e.timestamp) === dateKey
      ) as ExerciseCompleteEvent[];
      if (completedEvents.length > 0) {
        agg.averageAccuracy = Math.round(
          completedEvents.reduce((sum, e) => sum + e.accuracy, 0) / completedEvents.length
        );
      }

      // Recalculate language accuracy
      for (const lang of Object.keys(agg.byLanguage)) {
        const langCompleted = toAggregate.filter(
          (e) => e.action === "complete" && e.language === lang && getDateKey(e.timestamp) === dateKey
        ) as ExerciseCompleteEvent[];
        if (langCompleted.length > 0) {
          agg.byLanguage[lang].averageAccuracy = Math.round(
            langCompleted.reduce((sum, e) => sum + e.accuracy, 0) / langCompleted.length
          );
        }
      }
    }

    // Save aggregates and keep only today's events
    await AsyncStorage.setItem(STORAGE_KEY_AGGREGATES, JSON.stringify(aggregates));
    await AsyncStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(toKeep));
  } catch (err) {
    console.warn("[ExerciseAnalytics] Aggregation failed:", err);
  }
}

// ─── Query Functions ─────────────────────────────────────────────────────────

/**
 * Get analytics summary for a date range.
 */
export async function getAnalyticsSummary(
  startDate?: string,
  endDate?: string,
): Promise<{
  totalExercises: number;
  completedExercises: number;
  abandonedExercises: number;
  completionRate: number;
  averageAccuracy: number;
  totalDurationMs: number;
  byType: Record<string, { completed: number; accuracy: number; avgDurationMs: number }>;
  byLanguage: Record<string, { completed: number; accuracy: number }>;
  dailyTrend: Array<{ date: string; completed: number; accuracy: number }>;
}> {
  try {
    const aggRaw = await AsyncStorage.getItem(STORAGE_KEY_AGGREGATES);
    const aggregates: Record<string, DailyAggregate> = aggRaw ? JSON.parse(aggRaw) : {};

    // Also include today's pending events
    const eventsRaw = await AsyncStorage.getItem(STORAGE_KEY_EVENTS);
    const todayEvents: AnalyticsEvent[] = eventsRaw ? JSON.parse(eventsRaw) : [];

    // Filter by date range
    const filteredDays = Object.values(aggregates).filter((agg) => {
      if (startDate && agg.date < startDate) return false;
      if (endDate && agg.date > endDate) return false;
      return true;
    });

    // Calculate totals
    let totalExercises = 0;
    let completedExercises = 0;
    let abandonedExercises = 0;
    let totalDurationMs = 0;
    let accuracySum = 0;
    let accuracyCount = 0;
    const byType: Record<string, { completed: number; totalCorrect: number; totalQuestions: number; totalDurationMs: number }> = {};
    const byLanguage: Record<string, { completed: number; accuracySum: number; accuracyCount: number }> = {};
    const dailyTrend: Array<{ date: string; completed: number; accuracy: number }> = [];

    for (const day of filteredDays) {
      totalExercises += day.totalExercises;
      completedExercises += day.completedExercises;
      abandonedExercises += day.abandonedExercises;
      totalDurationMs += day.totalDurationMs;

      if (day.averageAccuracy > 0) {
        accuracySum += day.averageAccuracy * day.completedExercises;
        accuracyCount += day.completedExercises;
      }

      // Merge type stats
      for (const [type, stats] of Object.entries(day.byType)) {
        if (!byType[type]) byType[type] = { completed: 0, totalCorrect: 0, totalQuestions: 0, totalDurationMs: 0 };
        byType[type].completed += stats.completed;
        byType[type].totalCorrect += stats.totalCorrect;
        byType[type].totalQuestions += stats.totalQuestions;
        byType[type].totalDurationMs += stats.totalDurationMs;
      }

      // Merge language stats
      for (const [lang, stats] of Object.entries(day.byLanguage)) {
        if (!byLanguage[lang]) byLanguage[lang] = { completed: 0, accuracySum: 0, accuracyCount: 0 };
        byLanguage[lang].completed += stats.completed;
        if (stats.averageAccuracy > 0) {
          byLanguage[lang].accuracySum += stats.averageAccuracy * stats.completed;
          byLanguage[lang].accuracyCount += stats.completed;
        }
      }

      dailyTrend.push({
        date: day.date,
        completed: day.completedExercises,
        accuracy: day.averageAccuracy,
      });
    }

    // Add today's events to totals
    const todayStarts = todayEvents.filter((e) => e.action === "start");
    const todayCompletes = todayEvents.filter((e) => e.action === "complete") as ExerciseCompleteEvent[];
    const todayAbandoned = todayEvents.filter((e) => e.action === "abandoned");
    totalExercises += todayStarts.length;
    completedExercises += todayCompletes.length;
    abandonedExercises += todayAbandoned.length;
    for (const e of todayCompletes) {
      totalDurationMs += e.durationMs;
      accuracySum += e.accuracy;
      accuracyCount++;
    }

    return {
      totalExercises,
      completedExercises,
      abandonedExercises,
      completionRate: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0,
      averageAccuracy: accuracyCount > 0 ? Math.round(accuracySum / accuracyCount) : 0,
      totalDurationMs,
      byType: Object.fromEntries(
        Object.entries(byType).map(([type, stats]) => [
          type,
          {
            completed: stats.completed,
            accuracy: stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0,
            avgDurationMs: stats.completed > 0 ? Math.round(stats.totalDurationMs / stats.completed) : 0,
          },
        ])
      ),
      byLanguage: Object.fromEntries(
        Object.entries(byLanguage).map(([lang, stats]) => [
          lang,
          {
            completed: stats.completed,
            accuracy: stats.accuracyCount > 0 ? Math.round(stats.accuracySum / stats.accuracyCount) : 0,
          },
        ])
      ),
      dailyTrend: dailyTrend.sort((a, b) => a.date.localeCompare(b.date)),
    };
  } catch (err) {
    console.warn("[ExerciseAnalytics] Failed to get summary:", err);
    return {
      totalExercises: 0,
      completedExercises: 0,
      abandonedExercises: 0,
      completionRate: 0,
      averageAccuracy: 0,
      totalDurationMs: 0,
      byType: {},
      byLanguage: {},
      dailyTrend: [],
    };
  }
}

/**
 * Get all pending events for server sync.
 */
export async function getPendingEventsForSync(): Promise<AnalyticsEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_EVENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get all aggregated data for server sync.
 */
export async function getAggregatesForSync(): Promise<Record<string, DailyAggregate>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_AGGREGATES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Mark events as synced (clear pending events after successful server sync).
 */
export async function markEventsSynced(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
    // Keep only today's events after sync
    const raw = await AsyncStorage.getItem(STORAGE_KEY_EVENTS);
    const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    const today = getDateKey(Date.now());
    const todayEvents = events.filter((e) => getDateKey(e.timestamp) === today);
    await AsyncStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(todayEvents));
  } catch (err) {
    console.warn("[ExerciseAnalytics] Failed to mark synced:", err);
  }
}

/**
 * Get the last sync timestamp.
 */
export async function getLastSyncTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC);
  } catch {
    return null;
  }
}

/**
 * Clear all analytics data (for testing/reset).
 */
export async function clearAnalytics(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEY_EVENTS, STORAGE_KEY_AGGREGATES, STORAGE_KEY_LAST_SYNC]);
}
