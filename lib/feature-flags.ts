/**
 * Feature Flag System
 * 
 * Lightweight A/B testing and feature flag infrastructure.
 * Flags are stored locally and can be overridden by server config.
 * 
 * Usage:
 *   const flags = useFeatureFlags();
 *   if (flags.get('onboarding_skip_dialect')) { ... }
 * 
 * Variant tracking:
 *   trackExperiment('onboarding_flow', 'variant_b', 'completed');
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeatureFlag {
  /** Unique flag key */
  key: string;
  /** Human-readable name */
  name: string;
  /** Description of what this flag controls */
  description: string;
  /** Whether the flag is enabled */
  enabled: boolean;
  /** Variant assignment (for A/B tests) */
  variant?: string;
  /** Percentage rollout (0-100) */
  rolloutPercentage: number;
  /** Target platforms */
  platforms: ("ios" | "android" | "web")[];
  /** Experiment group */
  experiment?: string;
}

export interface ExperimentEvent {
  /** Experiment key */
  experiment: string;
  /** Assigned variant */
  variant: string;
  /** Event type */
  event: string;
  /** Timestamp */
  timestamp: string;
  /** Additional properties */
  properties?: Record<string, string | number | boolean>;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const FLAGS_KEY = "@feature_flags:config";
const ASSIGNMENTS_KEY = "@feature_flags:assignments";
const EVENTS_KEY = "@feature_flags:events";
const USER_BUCKET_KEY = "@feature_flags:bucket";

// ─── Default Feature Flags ───────────────────────────────────────────────────

const DEFAULT_FLAGS: FeatureFlag[] = [
  // ─── Onboarding Experiments ─────────────────────────────────────────────
  {
    key: "onboarding_skip_dialect_single",
    name: "Skip Dialect for Single-Dialect Languages",
    description: "Auto-skip the dialect picker when a language has only one dialect option (e.g., Japanese, Korean)",
    enabled: false,
    variant: "control",
    rolloutPercentage: 0,
    platforms: ["ios", "android", "web"],
    experiment: "onboarding_flow_v2",
  },
  {
    key: "onboarding_voice_preview",
    name: "Voice Preview in Teacher Selection",
    description: "Show a 5-second voice sample button next to each teacher during onboarding",
    enabled: false,
    variant: "control",
    rolloutPercentage: 0,
    platforms: ["ios", "android", "web"],
    experiment: "onboarding_flow_v2",
  },
  {
    key: "onboarding_quick_start",
    name: "Quick Start Option",
    description: "Offer a 'Quick Start' button that skips methodology selection and uses defaults",
    enabled: false,
    variant: "control",
    rolloutPercentage: 0,
    platforms: ["ios", "android", "web"],
    experiment: "onboarding_flow_v2",
  },
  {
    key: "onboarding_progress_bar",
    name: "Progress Bar Style",
    description: "Show step-based progress bar (variant_a) vs. percentage ring (variant_b)",
    enabled: true,
    variant: "variant_a",
    rolloutPercentage: 100,
    platforms: ["ios", "android", "web"],
    experiment: "onboarding_progress_ui",
  },

  // ─── Learning Experience Experiments ────────────────────────────────────
  {
    key: "lesson_completion_celebration",
    name: "Lesson Completion Celebration",
    description: "Show confetti animation on lesson completion (variant_a) vs. subtle checkmark (variant_b)",
    enabled: true,
    variant: "variant_a",
    rolloutPercentage: 100,
    platforms: ["ios", "android", "web"],
    experiment: "completion_ux",
  },
  {
    key: "streak_freeze_reminder",
    name: "Streak Freeze Reminder",
    description: "Send push notification when streak is about to break",
    enabled: true,
    rolloutPercentage: 100,
    platforms: ["ios", "android"],
  },

  // ─── UI Experiments ────────────────────────────────────────────────────
  {
    key: "home_layout_cards",
    name: "Home Layout — Card Style",
    description: "Large cards (variant_a) vs. compact list (variant_b) on home screen",
    enabled: true,
    variant: "variant_a",
    rolloutPercentage: 100,
    platforms: ["ios", "android", "web"],
    experiment: "home_layout_v1",
  },
];

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Get or create a stable user bucket (0-99) for consistent experiment assignment.
 */
async function getUserBucket(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(USER_BUCKET_KEY);
    if (stored !== null) return parseInt(stored, 10);

    const bucket = Math.floor(Math.random() * 100);
    await AsyncStorage.setItem(USER_BUCKET_KEY, bucket.toString());
    return bucket;
  } catch {
    return Math.floor(Math.random() * 100);
  }
}

/**
 * Load feature flags from storage (with server override support).
 */
async function loadFlags(): Promise<FeatureFlag[]> {
  try {
    const stored = await AsyncStorage.getItem(FLAGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as FeatureFlag[];
      // Merge with defaults (new flags get added, removed flags stay gone)
      return mergeFlags(DEFAULT_FLAGS, parsed);
    }
  } catch {
    // Fall through to defaults
  }
  return DEFAULT_FLAGS;
}

/**
 * Merge default flags with stored overrides.
 */
function mergeFlags(defaults: FeatureFlag[], overrides: FeatureFlag[]): FeatureFlag[] {
  const overrideMap = new Map(overrides.map((f) => [f.key, f]));
  return defaults.map((flag) => {
    const override = overrideMap.get(flag.key);
    return override ? { ...flag, ...override } : flag;
  });
}

/**
 * Save flags to storage.
 */
async function saveFlags(flags: FeatureFlag[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
  } catch {
    // Silently fail
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize feature flags. Call on app startup.
 * Assigns user to experiment variants based on their bucket.
 */
export async function initFeatureFlags(): Promise<Map<string, FeatureFlag>> {
  const flags = await loadFlags();
  const bucket = await getUserBucket();
  const platform = Platform.OS as "ios" | "android" | "web";

  const resolved = new Map<string, FeatureFlag>();

  for (const flag of flags) {
    // Check platform eligibility
    if (!flag.platforms.includes(platform)) {
      resolved.set(flag.key, { ...flag, enabled: false });
      continue;
    }

    // Check rollout percentage against user bucket
    const isInRollout = bucket < flag.rolloutPercentage;
    resolved.set(flag.key, { ...flag, enabled: flag.enabled && isInRollout });
  }

  return resolved;
}

/**
 * Check if a specific flag is enabled.
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flags = await initFeatureFlags();
  return flags.get(key)?.enabled ?? false;
}

/**
 * Get the variant assignment for an experiment flag.
 */
export async function getVariant(key: string): Promise<string | undefined> {
  const flags = await initFeatureFlags();
  const flag = flags.get(key);
  if (!flag?.enabled) return undefined;
  return flag.variant;
}

/**
 * Override a flag locally (for testing or admin panel).
 */
export async function overrideFlag(key: string, enabled: boolean, variant?: string): Promise<void> {
  const flags = await loadFlags();
  const index = flags.findIndex((f) => f.key === key);
  if (index >= 0) {
    flags[index] = { ...flags[index], enabled, ...(variant ? { variant } : {}) };
    await saveFlags(flags);
  }
}

/**
 * Reset all flags to defaults.
 */
export async function resetFlags(): Promise<void> {
  await AsyncStorage.removeItem(FLAGS_KEY);
}

// ─── Experiment Tracking ─────────────────────────────────────────────────────

/**
 * Track an experiment event (exposure, conversion, completion, etc.)
 */
export async function trackExperiment(
  experiment: string,
  variant: string,
  event: string,
  properties?: Record<string, string | number | boolean>
): Promise<void> {
  const experimentEvent: ExperimentEvent = {
    experiment,
    variant,
    event,
    timestamp: new Date().toISOString(),
    properties,
  };

  if (__DEV__) {
    console.log("[FeatureFlags] Experiment event:", experimentEvent);
  }

  try {
    const stored = await AsyncStorage.getItem(EVENTS_KEY);
    const events: ExperimentEvent[] = stored ? JSON.parse(stored) : [];
    events.push(experimentEvent);
    // Keep last 200 events
    const trimmed = events.slice(-200);
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch {
    // Silently fail
  }
}

/**
 * Get all tracked experiment events (for analytics flush).
 */
export async function getExperimentEvents(): Promise<ExperimentEvent[]> {
  try {
    const stored = await AsyncStorage.getItem(EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear experiment events after successful flush to server.
 */
export async function clearExperimentEvents(): Promise<void> {
  try {
    await AsyncStorage.removeItem(EVENTS_KEY);
  } catch {
    // Silently fail
  }
}

// ─── React Hook ──────────────────────────────────────────────────────────────

/**
 * React hook for feature flags.
 * 
 * Usage in components:
 * ```tsx
 * import { useFeatureFlags } from "@/lib/feature-flags";
 * 
 * function MyComponent() {
 *   const { isEnabled, getVariant, loading } = useFeatureFlags();
 *   
 *   if (loading) return null;
 *   
 *   if (isEnabled("onboarding_skip_dialect_single")) {
 *     // Skip dialect picker
 *   }
 *   
 *   const progressStyle = getVariant("onboarding_progress_bar");
 *   // "variant_a" = step bar, "variant_b" = percentage ring
 * }
 * ```
 */
export { initFeatureFlags as loadAllFlags };
