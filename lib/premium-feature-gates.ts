/**
 * Premium Feature Gates
 *
 * Defines which new features require which subscription tier,
 * and provides helper functions for gating access.
 *
 * Tier structure:
 *   Free:       Basic flashcards (SM-2), placement test (1x/month), 3 voice sessions/day, basic study groups
 *   Plus:       FSRS algorithm, offline downloads, unlimited placement retakes, 10 voice sessions/day
 *   Pro:        Unlimited voice practice, friend challenges, advanced analytics, custom flashcard decks
 *   Enterprise: Team management, API access, custom curriculum
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constants ───────────────────────────────────────────────────────────────
const DAILY_USAGE_KEY = "linguavibe_daily_feature_usage";

export type GatedFeature =
  | "voice_conversation"
  | "fsrs_algorithm"
  | "friend_challenges"
  | "offline_downloads"
  | "placement_retake"
  | "study_group_create"
  | "advanced_report";

export type PlanId = "free" | "plus" | "pro" | "enterprise";

// ─── Feature Limits per Plan ─────────────────────────────────────────────────
export interface FeatureLimits {
  dailyLimit: number; // -1 = unlimited
  requiresPlan: PlanId;
  description: string;
  upgradeMessage: string;
}

export const FEATURE_GATES: Record<GatedFeature, Record<PlanId, FeatureLimits>> = {
  voice_conversation: {
    free: { dailyLimit: 3, requiresPlan: "free", description: "3 voice sessions/day", upgradeMessage: "Upgrade to Plus for 10 sessions/day, or Pro for unlimited" },
    plus: { dailyLimit: 10, requiresPlan: "plus", description: "10 voice sessions/day", upgradeMessage: "Upgrade to Pro for unlimited voice practice" },
    pro: { dailyLimit: -1, requiresPlan: "pro", description: "Unlimited voice practice", upgradeMessage: "" },
    enterprise: { dailyLimit: -1, requiresPlan: "enterprise", description: "Unlimited voice practice", upgradeMessage: "" },
  },
  fsrs_algorithm: {
    free: { dailyLimit: 0, requiresPlan: "plus", description: "SM-2 only on free tier", upgradeMessage: "Upgrade to Plus to unlock the FSRS spaced repetition engine for better retention" },
    plus: { dailyLimit: -1, requiresPlan: "plus", description: "FSRS algorithm enabled", upgradeMessage: "" },
    pro: { dailyLimit: -1, requiresPlan: "pro", description: "FSRS algorithm enabled", upgradeMessage: "" },
    enterprise: { dailyLimit: -1, requiresPlan: "enterprise", description: "FSRS algorithm enabled", upgradeMessage: "" },
  },
  friend_challenges: {
    free: { dailyLimit: 1, requiresPlan: "free", description: "1 challenge/day", upgradeMessage: "Upgrade to Pro for unlimited friend challenges" },
    plus: { dailyLimit: 3, requiresPlan: "plus", description: "3 challenges/day", upgradeMessage: "Upgrade to Pro for unlimited friend challenges" },
    pro: { dailyLimit: -1, requiresPlan: "pro", description: "Unlimited challenges", upgradeMessage: "" },
    enterprise: { dailyLimit: -1, requiresPlan: "enterprise", description: "Unlimited challenges", upgradeMessage: "" },
  },
  offline_downloads: {
    free: { dailyLimit: 0, requiresPlan: "plus", description: "Not available on free tier", upgradeMessage: "Upgrade to Plus to download lessons for offline practice" },
    plus: { dailyLimit: 5, requiresPlan: "plus", description: "5 downloads/day", upgradeMessage: "Upgrade to Pro for unlimited downloads" },
    pro: { dailyLimit: -1, requiresPlan: "pro", description: "Unlimited downloads", upgradeMessage: "" },
    enterprise: { dailyLimit: -1, requiresPlan: "enterprise", description: "Unlimited downloads", upgradeMessage: "" },
  },
  placement_retake: {
    free: { dailyLimit: 0, requiresPlan: "plus", description: "1 test per month (free)", upgradeMessage: "Upgrade to Plus to retake the placement test anytime" },
    plus: { dailyLimit: -1, requiresPlan: "plus", description: "Unlimited retakes", upgradeMessage: "" },
    pro: { dailyLimit: -1, requiresPlan: "pro", description: "Unlimited retakes", upgradeMessage: "" },
    enterprise: { dailyLimit: -1, requiresPlan: "enterprise", description: "Unlimited retakes", upgradeMessage: "" },
  },
  study_group_create: {
    free: { dailyLimit: 1, requiresPlan: "free", description: "Join 1 group", upgradeMessage: "Upgrade to Plus to create and join unlimited study groups" },
    plus: { dailyLimit: 5, requiresPlan: "plus", description: "Create up to 5 groups", upgradeMessage: "Upgrade to Pro for unlimited groups" },
    pro: { dailyLimit: -1, requiresPlan: "pro", description: "Unlimited groups", upgradeMessage: "" },
    enterprise: { dailyLimit: -1, requiresPlan: "enterprise", description: "Unlimited groups", upgradeMessage: "" },
  },
  advanced_report: {
    free: { dailyLimit: 0, requiresPlan: "pro", description: "Basic report only", upgradeMessage: "Upgrade to Pro for AI-powered weekly fluency reports with detailed analytics" },
    plus: { dailyLimit: 1, requiresPlan: "plus", description: "1 AI report/week", upgradeMessage: "Upgrade to Pro for unlimited AI reports" },
    pro: { dailyLimit: -1, requiresPlan: "pro", description: "Unlimited AI reports", upgradeMessage: "" },
    enterprise: { dailyLimit: -1, requiresPlan: "enterprise", description: "Unlimited AI reports", upgradeMessage: "" },
  },
};

// ─── Usage Tracking ──────────────────────────────────────────────────────────
interface DailyUsage {
  date: string; // YYYY-MM-DD
  counts: Record<string, number>;
}

async function getDailyUsage(): Promise<DailyUsage> {
  const today = new Date().toISOString().split("T")[0];
  try {
    const raw = await AsyncStorage.getItem(DAILY_USAGE_KEY);
    if (raw) {
      const usage: DailyUsage = JSON.parse(raw);
      if (usage.date === today) return usage;
    }
  } catch {}
  return { date: today, counts: {} };
}

async function saveDailyUsage(usage: DailyUsage): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(usage));
  } catch {}
}

/**
 * Check if a user can access a gated feature.
 * Returns { allowed: true } or { allowed: false, message, upgradeTarget }.
 */
export async function checkFeatureGate(
  feature: GatedFeature,
  currentPlan: PlanId
): Promise<{ allowed: boolean; message?: string; upgradeTarget?: PlanId; remaining?: number }> {
  const gate = FEATURE_GATES[feature][currentPlan];
  if (!gate) return { allowed: false, message: "Unknown feature" };

  // Check plan requirement
  const planHierarchy: PlanId[] = ["free", "plus", "pro", "enterprise"];
  if (planHierarchy.indexOf(currentPlan) < planHierarchy.indexOf(gate.requiresPlan)) {
    return {
      allowed: false,
      message: gate.upgradeMessage,
      upgradeTarget: gate.requiresPlan,
    };
  }

  // Check daily limit
  if (gate.dailyLimit === -1) return { allowed: true, remaining: -1 };
  if (gate.dailyLimit === 0) {
    return {
      allowed: false,
      message: gate.upgradeMessage,
      upgradeTarget: planHierarchy[planHierarchy.indexOf(currentPlan) + 1] as PlanId || "plus",
    };
  }

  const usage = await getDailyUsage();
  const used = usage.counts[feature] || 0;
  const remaining = gate.dailyLimit - used;

  if (remaining <= 0) {
    return {
      allowed: false,
      message: `Daily limit reached (${gate.dailyLimit}/${gate.description}). ${gate.upgradeMessage}`,
      upgradeTarget: planHierarchy[Math.min(planHierarchy.indexOf(currentPlan) + 1, 3)] as PlanId,
      remaining: 0,
    };
  }

  return { allowed: true, remaining };
}

/**
 * Record usage of a gated feature.
 */
export async function recordFeatureUsage(feature: GatedFeature): Promise<void> {
  const usage = await getDailyUsage();
  usage.counts[feature] = (usage.counts[feature] || 0) + 1;
  await saveDailyUsage(usage);
}

/**
 * Get remaining uses for a feature today.
 */
export async function getRemainingUses(
  feature: GatedFeature,
  currentPlan: PlanId
): Promise<number> {
  const gate = FEATURE_GATES[feature][currentPlan];
  if (!gate || gate.dailyLimit === -1) return -1;
  if (gate.dailyLimit === 0) return 0;

  const usage = await getDailyUsage();
  const used = usage.counts[feature] || 0;
  return Math.max(0, gate.dailyLimit - used);
}

/**
 * Get a human-readable summary of what each plan unlocks.
 */
export function getPlanFeatureSummary(plan: PlanId): string[] {
  const features: string[] = [];
  for (const [feature, gates] of Object.entries(FEATURE_GATES)) {
    const gate = gates[plan];
    if (gate.dailyLimit !== 0) {
      features.push(`${gate.description} (${feature.replace(/_/g, " ")})`);
    }
  }
  return features;
}
