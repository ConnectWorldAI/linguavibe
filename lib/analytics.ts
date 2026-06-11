/**
 * Analytics Event Tracking Library
 * 
 * Lightweight event tracking system for measuring user engagement.
 * Events are batched locally and persisted to AsyncStorage before flush.
 * 
 * Key events tracked:
 * - lesson_complete: User finishes a lesson
 * - duel_played: User completes a pronunciation duel
 * - referral_shared: User shares their referral code
 * - achievement_unlocked: User unlocks a new achievement
 * - voice_room_joined: User joins a live voice room
 * - daily_challenge_completed: User finishes daily challenge
 * - streak_maintained: User maintains their streak
 * - song_translated: User translates a song
 * - call_completed: User finishes an AI voice call
 * - walkthrough_completed: User finishes the onboarding walkthrough
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type AnalyticsEventName =
  | "lesson_complete"
  | "duel_played"
  | "duel_won"
  | "referral_shared"
  | "referral_converted"
  | "achievement_unlocked"
  | "voice_room_joined"
  | "voice_room_left"
  | "daily_challenge_completed"
  | "streak_maintained"
  | "streak_broken"
  | "song_translated"
  | "call_completed"
  | "walkthrough_completed"
  | "walkthrough_skipped"
  | "screen_view"
  | "feature_used"
  | "error_occurred"
  | "subscription_started"
  | "subscription_cancelled"
  | "invite_sent"
  | "invite_accepted";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
  sessionId: string;
  platform: string;
}

export interface AnalyticsBatch {
  events: AnalyticsEvent[];
  batchId: string;
  createdAt: number;
  flushed: boolean;
}

export interface AnalyticsSummary {
  totalEvents: number;
  eventCounts: Record<string, number>;
  firstEvent: number | null;
  lastEvent: number | null;
  sessionsCount: number;
  pendingBatches: number;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const ANALYTICS_QUEUE_KEY = "@connectworld_analytics_queue";
const ANALYTICS_BATCHES_KEY = "@connectworld_analytics_batches";
const ANALYTICS_SESSION_KEY = "@connectworld_analytics_session";
const ANALYTICS_SUMMARY_KEY = "@connectworld_analytics_summary";

const BATCH_SIZE = 25; // Events per batch
const MAX_BATCHES = 50; // Max stored batches before oldest are dropped
const FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ─── SESSION MANAGEMENT ─────────────────────────────────────────────────────

let currentSessionId: string | null = null;
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}`;
}

/**
 * Initialize analytics session. Call on app startup.
 */
export async function initAnalytics(): Promise<string> {
  currentSessionId = generateSessionId();
  
  // Load any pending events from previous session
  try {
    const pending = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (pending) {
      const parsed = JSON.parse(pending) as AnalyticsEvent[];
      eventQueue = parsed;
    }
  } catch {}

  // Start periodic flush
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(() => {
    flushEvents();
  }, FLUSH_INTERVAL_MS);

  // Track session start
  trackEvent("screen_view", { screen: "app_launch", session_start: true });

  return currentSessionId;
}

/**
 * End analytics session. Call on app background/close.
 */
export async function endAnalytics(): Promise<void> {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  await flushEvents();
  currentSessionId = null;
}

// ─── EVENT TRACKING ─────────────────────────────────────────────────────────

/**
 * Track an analytics event.
 */
export function trackEvent(
  name: AnalyticsEventName,
  properties?: Record<string, string | number | boolean>
): void {
  const event: AnalyticsEvent = {
    name,
    properties: properties || {},
    timestamp: Date.now(),
    sessionId: currentSessionId || "unknown",
    platform: Platform.OS,
  };

  eventQueue.push(event);

  // Auto-flush if batch size reached
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  }

  // Persist queue to survive crashes
  persistQueue();
}

/**
 * Track a screen view event.
 */
export function trackScreenView(screenName: string, params?: Record<string, string>): void {
  trackEvent("screen_view", { screen: screenName, ...params });
}

/**
 * Track a feature usage event.
 */
export function trackFeatureUsed(featureName: string, details?: Record<string, string | number | boolean>): void {
  trackEvent("feature_used", { feature: featureName, ...details });
}

// ─── CONVENIENCE TRACKERS ───────────────────────────────────────────────────

export function trackLessonComplete(lessonId: string, score: number, duration: number): void {
  trackEvent("lesson_complete", { lesson_id: lessonId, score, duration_seconds: duration });
}

export function trackDuelPlayed(opponentType: "ai" | "human", won: boolean, score: number): void {
  trackEvent("duel_played", { opponent_type: opponentType, won, score });
  if (won) trackEvent("duel_won", { opponent_type: opponentType, score });
}

export function trackReferralShared(channel: "link" | "sms" | "social"): void {
  trackEvent("referral_shared", { channel });
}

export function trackAchievementUnlocked(achievementId: string, tier: string): void {
  trackEvent("achievement_unlocked", { achievement_id: achievementId, tier });
}

export function trackVoiceRoomJoined(roomId: string, level: string): void {
  trackEvent("voice_room_joined", { room_id: roomId, level });
}

export function trackDailyChallengeCompleted(challengeType: string, score: number): void {
  trackEvent("daily_challenge_completed", { challenge_type: challengeType, score });
}

export function trackStreakMaintained(streakDays: number): void {
  trackEvent("streak_maintained", { streak_days: streakDays });
}

export function trackCallCompleted(teacherId: string, duration: number, language: string): void {
  trackEvent("call_completed", { teacher_id: teacherId, duration_seconds: duration, language });
}

export function trackInviteSent(type: "duel" | "friend" | "referral"): void {
  trackEvent("invite_sent", { invite_type: type });
}

// ─── BATCH MANAGEMENT ───────────────────────────────────────────────────────

async function persistQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(eventQueue));
  } catch {}
}

/**
 * Flush pending events into a batch and persist.
 */
export async function flushEvents(): Promise<number> {
  if (eventQueue.length === 0) return 0;

  const eventsToFlush = [...eventQueue];
  eventQueue = [];

  const batch: AnalyticsBatch = {
    events: eventsToFlush,
    batchId: generateSessionId(),
    createdAt: Date.now(),
    flushed: false,
  };

  try {
    // Load existing batches
    const existing = await AsyncStorage.getItem(ANALYTICS_BATCHES_KEY);
    let batches: AnalyticsBatch[] = existing ? JSON.parse(existing) : [];

    // Add new batch
    batches.push(batch);

    // Trim old batches if over limit
    if (batches.length > MAX_BATCHES) {
      batches = batches.slice(batches.length - MAX_BATCHES);
    }

    await AsyncStorage.setItem(ANALYTICS_BATCHES_KEY, JSON.stringify(batches));
    await AsyncStorage.removeItem(ANALYTICS_QUEUE_KEY);

    // Update summary
    await updateSummary(eventsToFlush);

    return eventsToFlush.length;
  } catch {
    // Put events back if flush fails
    eventQueue = [...eventsToFlush, ...eventQueue];
    await persistQueue();
    return 0;
  }
}

/**
 * Update the analytics summary with new events.
 */
async function updateSummary(newEvents: AnalyticsEvent[]): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(ANALYTICS_SUMMARY_KEY);
    const summary: AnalyticsSummary = existing
      ? JSON.parse(existing)
      : { totalEvents: 0, eventCounts: {}, firstEvent: null, lastEvent: null, sessionsCount: 0, pendingBatches: 0 };

    for (const event of newEvents) {
      summary.totalEvents++;
      summary.eventCounts[event.name] = (summary.eventCounts[event.name] || 0) + 1;
      if (!summary.firstEvent) summary.firstEvent = event.timestamp;
      summary.lastEvent = event.timestamp;
    }

    // Count unique sessions
    const sessions = new Set(newEvents.map(e => e.sessionId));
    summary.sessionsCount += sessions.size;

    await AsyncStorage.setItem(ANALYTICS_SUMMARY_KEY, JSON.stringify(summary));
  } catch {}
}

// ─── REPORTING ──────────────────────────────────────────────────────────────

/**
 * Get the current analytics summary.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const data = await AsyncStorage.getItem(ANALYTICS_SUMMARY_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    totalEvents: 0,
    eventCounts: {},
    firstEvent: null,
    lastEvent: null,
    sessionsCount: 0,
    pendingBatches: 0,
  };
}

/**
 * Get all stored batches (for debugging or server sync).
 */
export async function getStoredBatches(): Promise<AnalyticsBatch[]> {
  try {
    const data = await AsyncStorage.getItem(ANALYTICS_BATCHES_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

/**
 * Get pending event count (not yet flushed).
 */
export function getPendingEventCount(): number {
  return eventQueue.length;
}

/**
 * Clear all analytics data (for testing or user request).
 */
export async function clearAnalytics(): Promise<void> {
  eventQueue = [];
  await AsyncStorage.multiRemove([
    ANALYTICS_QUEUE_KEY,
    ANALYTICS_BATCHES_KEY,
    ANALYTICS_SUMMARY_KEY,
  ]);
}

/**
 * Get event counts for specific events (for dashboard display).
 */
export async function getEventCounts(eventNames: AnalyticsEventName[]): Promise<Record<string, number>> {
  const summary = await getAnalyticsSummary();
  const counts: Record<string, number> = {};
  for (const name of eventNames) {
    counts[name] = summary.eventCounts[name] || 0;
  }
  return counts;
}

/**
 * Export analytics data as JSON string (for sharing/debugging).
 */
export async function exportAnalyticsData(): Promise<string> {
  const summary = await getAnalyticsSummary();
  const batches = await getStoredBatches();
  return JSON.stringify({
    summary,
    batches,
    pendingEvents: eventQueue.length,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}
