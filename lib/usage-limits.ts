import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── TIER DEFINITIONS ────────────────────────────────────────────────────────

export type TierLevel = "free" | "pro" | "premium";

export interface ServiceLimit {
  /** Max uses per billing cycle (null = unlimited) */
  limit: number | null;
  /** Unit description for display */
  unit: string;
}

export interface TierLimits {
  callTranslationMinutes: ServiceLimit;
  videoCallMinutes: ServiceLimit;
  songTranslations: ServiceLimit;
  urlTranslations: ServiceLimit;
  videoUploadMinutes: ServiceLimit;
  voiceMemos: ServiceLimit;
  languages: ServiceLimit;
  aiTranscriptions: ServiceLimit;
}

export const TIER_LIMITS: Record<TierLevel, TierLimits> = {
  free: {
    callTranslationMinutes: { limit: 5, unit: "min/call" },
    videoCallMinutes: { limit: 0, unit: "min" }, // text-only on free
    songTranslations: { limit: 3, unit: "songs/month" },
    urlTranslations: { limit: 5, unit: "pages/month" },
    videoUploadMinutes: { limit: 0, unit: "min" }, // not available
    voiceMemos: { limit: 10, unit: "memos/month" },
    languages: { limit: 1, unit: "language" },
    aiTranscriptions: { limit: 5, unit: "/month" },
  },
  pro: {
    callTranslationMinutes: { limit: 30, unit: "min/month" },
    videoCallMinutes: { limit: 30, unit: "min/month" },
    songTranslations: { limit: null, unit: "unlimited" },
    urlTranslations: { limit: 50, unit: "pages/month" },
    videoUploadMinutes: { limit: 10, unit: "min/month" },
    voiceMemos: { limit: null, unit: "unlimited" },
    languages: { limit: 5, unit: "languages" },
    aiTranscriptions: { limit: 50, unit: "/month" },
  },
  premium: {
    callTranslationMinutes: { limit: 500, unit: "min/month" },
    videoCallMinutes: { limit: 500, unit: "min/month" },
    songTranslations: { limit: 100, unit: "songs/month" },
    urlTranslations: { limit: 200, unit: "pages/month" },
    videoUploadMinutes: { limit: 60, unit: "min/month" },
    voiceMemos: { limit: 500, unit: "memos/month" },
    languages: { limit: 50, unit: "languages" },
    aiTranscriptions: { limit: 500, unit: "/month" },
  },
};

// ─── PAY-AS-YOU-GO OVERAGE RATES ─────────────────────────────────────────────

export interface OverageRate {
  pricePerUnit: number; // in dollars
  unit: string;
}

export const OVERAGE_RATES: Record<ServiceKey, OverageRate> = {
  callTranslationMinutes: { pricePerUnit: 0.50, unit: "per minute" },
  videoCallMinutes: { pricePerUnit: 0.75, unit: "per minute" },
  songTranslations: { pricePerUnit: 1.00, unit: "per song" },
  urlTranslations: { pricePerUnit: 0.25, unit: "per page" },
  videoUploadMinutes: { pricePerUnit: 1.50, unit: "per minute" },
  voiceMemos: { pricePerUnit: 0.10, unit: "per memo" },
  languages: { pricePerUnit: 2.00, unit: "per language" },
  aiTranscriptions: { pricePerUnit: 0.20, unit: "per transcription" },
};

// ─── ALERT THRESHOLDS ────────────────────────────────────────────────────────

export type AlertLevel = "none" | "nudge" | "warning" | "critical";

export interface UsageAlert {
  level: AlertLevel;
  percentage: number;
  message: string;
  service: ServiceKey;
}

const ALERT_THRESHOLDS = [
  { level: "nudge" as AlertLevel, percentage: 75 },
  { level: "warning" as AlertLevel, percentage: 90 },
  { level: "critical" as AlertLevel, percentage: 100 },
];

const SERVICE_DISPLAY_NAMES: Record<ServiceKey, string> = {
  callTranslationMinutes: "call translation minutes",
  videoCallMinutes: "video call minutes",
  songTranslations: "song translations",
  urlTranslations: "URL translations",
  videoUploadMinutes: "video upload minutes",
  voiceMemos: "voice memos",
  languages: "languages",
  aiTranscriptions: "AI transcriptions",
};

export function checkUsageAlert(data: UsageData, service: ServiceKey): UsageAlert | null {
  const limits = TIER_LIMITS[data.tier];
  const limit = limits[service].limit;
  if (limit === null) return null;
  if (limit === 0) return null;

  const used = data.usage[service] || 0;
  const percentage = (used / limit) * 100;

  // Find the highest threshold crossed
  let alert: UsageAlert | null = null;
  for (const threshold of ALERT_THRESHOLDS) {
    if (percentage >= threshold.percentage) {
      const serviceName = SERVICE_DISPLAY_NAMES[service];
      let message = "";
      if (threshold.level === "nudge") {
        message = `Heads up! You've used 75% of your ${serviceName} this month.`;
      } else if (threshold.level === "warning") {
        const remaining = Math.max(0, limit - used);
        message = `Almost out! Only ${remaining} ${limits[service].unit.split("/")[0]} of ${serviceName} remaining.`;
      } else if (threshold.level === "critical") {
        const rate = OVERAGE_RATES[service];
        message = `You've used all your ${serviceName}. Continue with pay-as-you-go at $${rate.pricePerUnit.toFixed(2)} ${rate.unit}?`;
      }
      alert = { level: threshold.level, percentage, message, service };
    }
  }
  return alert;
}

export function getAllAlerts(data: UsageData): UsageAlert[] {
  const services: ServiceKey[] = Object.keys(TIER_LIMITS.free) as ServiceKey[];
  const alerts: UsageAlert[] = [];
  for (const service of services) {
    const alert = checkUsageAlert(data, service);
    if (alert) alerts.push(alert);
  }
  return alerts.sort((a, b) => b.percentage - a.percentage);
}

// ─── USAGE TRACKING ──────────────────────────────────────────────────────────

export type ServiceKey = keyof TierLimits;

export interface UsageData {
  tier: TierLevel;
  cycleStart: string; // ISO date
  usage: Record<ServiceKey, number>;
}

const STORAGE_KEY = "@connectworld_usage_limits";

const DEFAULT_USAGE: UsageData = {
  tier: "free",
  cycleStart: new Date().toISOString(),
  usage: {
    callTranslationMinutes: 0,
    videoCallMinutes: 0,
    songTranslations: 0,
    urlTranslations: 0,
    videoUploadMinutes: 0,
    voiceMemos: 0,
    languages: 0,
    aiTranscriptions: 0,
  },
};

export async function getUsageData(): Promise<UsageData> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as UsageData;
      // Check if cycle needs reset (30 days)
      const cycleStart = new Date(data.cycleStart);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 30) {
        // Reset cycle
        const resetData: UsageData = {
          ...data,
          cycleStart: now.toISOString(),
          usage: { ...DEFAULT_USAGE.usage },
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
        return resetData;
      }
      return data;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USAGE));
    return DEFAULT_USAGE;
  } catch {
    return DEFAULT_USAGE;
  }
}

export async function incrementUsage(service: ServiceKey, amount: number = 1): Promise<UsageData> {
  const data = await getUsageData();
  data.usage[service] = (data.usage[service] || 0) + amount;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export async function setTier(tier: TierLevel): Promise<void> {
  const data = await getUsageData();
  data.tier = tier;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getRemainingUsage(data: UsageData, service: ServiceKey): number | null {
  const limits = TIER_LIMITS[data.tier];
  const limit = limits[service].limit;
  if (limit === null) return null; // unlimited
  return Math.max(0, limit - (data.usage[service] || 0));
}

export function isLimitReached(data: UsageData, service: ServiceKey): boolean {
  const remaining = getRemainingUsage(data, service);
  if (remaining === null) return false; // unlimited
  return remaining <= 0;
}

export function getUsagePercentage(data: UsageData, service: ServiceKey): number {
  const limits = TIER_LIMITS[data.tier];
  const limit = limits[service].limit;
  if (limit === null || limit === 0) return 0;
  return Math.min(100, ((data.usage[service] || 0) / limit) * 100);
}

export function formatRemaining(data: UsageData, service: ServiceKey): string {
  const limits = TIER_LIMITS[data.tier];
  const limit = limits[service].limit;
  if (limit === null) return "Unlimited";
  if (limit === 0) return "Not available on free tier";
  const remaining = getRemainingUsage(data, service);
  return `${remaining} ${limits[service].unit} remaining`;
}

// ─── DAYS REMAINING IN CYCLE ─────────────────────────────────────────────────

export function getDaysRemainingInCycle(data: UsageData): number {
  const cycleStart = new Date(data.cycleStart);
  const cycleEnd = new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(0, Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}
