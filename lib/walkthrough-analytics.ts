import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────
export type WalkthroughEvent =
  | "walkthrough_started"
  | "walkthrough_step_viewed"
  | "walkthrough_step_completed"
  | "walkthrough_skipped"
  | "walkthrough_completed"
  | "walkthrough_settings_opened"
  | "walkthrough_reset";

export interface WalkthroughAnalyticsEntry {
  event: WalkthroughEvent;
  stepId?: string;
  stepIndex?: number;
  totalSteps?: number;
  timestamp: number;
  source?: "first_launch" | "settings" | "translation_hub" | "manual" | "cloudwave_agent";
}

export interface WalkthroughAnalyticsSummary {
  totalStarts: number;
  totalCompletions: number;
  totalSkips: number;
  stepDropoffs: Record<string, number>;
  averageLastStep: number;
  lastSessionDate: string | null;
  events: WalkthroughAnalyticsEntry[];
}

// ─── Storage Key ─────────────────────────────────────────────────────────────
const ANALYTICS_KEY = "@connectworld_walkthrough_analytics";

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Track a walkthrough analytics event.
 * Persists to AsyncStorage for later retrieval/export.
 */
export async function trackWalkthroughEvent(
  event: WalkthroughEvent,
  metadata?: {
    stepId?: string;
    stepIndex?: number;
    totalSteps?: number;
    source?: WalkthroughAnalyticsEntry["source"];
    reason?: string;
    [key: string]: any;
  }
): Promise<void> {
  try {
    const entry: WalkthroughAnalyticsEntry = {
      event,
      timestamp: Date.now(),
      ...metadata,
    };

    const existing = await AsyncStorage.getItem(ANALYTICS_KEY);
    const events: WalkthroughAnalyticsEntry[] = existing
      ? JSON.parse(existing)
      : [];

    events.push(entry);

    // Keep only the last 200 events to prevent storage bloat
    const trimmed = events.slice(-200);
    await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));

    // Also log to console in dev for debugging
    if (__DEV__) {
      console.log(
        `[WalkthroughAnalytics] ${event}`,
        metadata ? JSON.stringify(metadata) : ""
      );
    }
  } catch (error) {
    // Silently fail — analytics should never break the app
    if (__DEV__) {
      console.warn("[WalkthroughAnalytics] Failed to track event:", error);
    }
  }
}

/**
 * Get a summary of walkthrough analytics data.
 * Useful for displaying in a dashboard or exporting.
 */
export async function getWalkthroughAnalytics(): Promise<WalkthroughAnalyticsSummary> {
  try {
    const existing = await AsyncStorage.getItem(ANALYTICS_KEY);
    const events: WalkthroughAnalyticsEntry[] = existing
      ? JSON.parse(existing)
      : [];

    const totalStarts = events.filter(
      (e) => e.event === "walkthrough_started"
    ).length;
    const totalCompletions = events.filter(
      (e) => e.event === "walkthrough_completed"
    ).length;
    const totalSkips = events.filter(
      (e) => e.event === "walkthrough_skipped"
    ).length;

    // Calculate step drop-offs: count how many times each step was the last viewed
    // before a skip or abandonment
    const stepDropoffs: Record<string, number> = {};
    const skipEvents = events.filter((e) => e.event === "walkthrough_skipped");
    for (const skip of skipEvents) {
      const stepId = skip.stepId || `step_${skip.stepIndex ?? "unknown"}`;
      stepDropoffs[stepId] = (stepDropoffs[stepId] || 0) + 1;
    }

    // Average last step reached before skip/abandon
    const skipStepIndices = skipEvents
      .map((e) => e.stepIndex)
      .filter((i): i is number => i !== undefined);
    const averageLastStep =
      skipStepIndices.length > 0
        ? skipStepIndices.reduce((a, b) => a + b, 0) / skipStepIndices.length
        : 0;

    // Last session date
    const lastEvent = events[events.length - 1];
    const lastSessionDate = lastEvent
      ? new Date(lastEvent.timestamp).toISOString()
      : null;

    return {
      totalStarts,
      totalCompletions,
      totalSkips,
      stepDropoffs,
      averageLastStep,
      lastSessionDate,
      events,
    };
  } catch {
    return {
      totalStarts: 0,
      totalCompletions: 0,
      totalSkips: 0,
      stepDropoffs: {},
      averageLastStep: 0,
      lastSessionDate: null,
      events: [],
    };
  }
}

/**
 * Clear all walkthrough analytics data.
 */
export async function clearWalkthroughAnalytics(): Promise<void> {
  await AsyncStorage.removeItem(ANALYTICS_KEY);
}
