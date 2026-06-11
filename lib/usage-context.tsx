import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { recordMilestoneUsage, type Milestone } from "@/lib/streak-bonus";
import { UserStorage } from "@/lib/user-storage";

const USAGE_STORAGE_KEY = "@connectworld_usage_data";
const LOW_BALANCE_SHOWN_KEY = "@connectworld_low_balance_shown";

export type UsageTier = "free" | "plus" | "pro";

export interface TierLimits {
  talkMinutes: number;
  videoMinutes: number;
  songTranslations: number;
  aiTeacherMinutes: number;
  credits: number;
}

export const TIER_LIMITS: Record<UsageTier, TierLimits> = {
  free: {
    talkMinutes: 15,
    videoMinutes: 5,
    songTranslations: 3,
    aiTeacherMinutes: 10,
    credits: 50,
  },
  plus: {
    talkMinutes: 120,
    videoMinutes: 60,
    songTranslations: 30,
    aiTeacherMinutes: 120,
    credits: 500,
  },
  pro: {
    talkMinutes: -1, // unlimited
    videoMinutes: -1,
    songTranslations: -1,
    aiTeacherMinutes: -1,
    credits: 2000,
  },
};

export interface UsageData {
  tier: UsageTier;
  talkMinutesUsed: number;
  videoMinutesUsed: number;
  songTranslationsUsed: number;
  aiTeacherMinutesUsed: number;
  creditsUsed: number;
  creditsTotal: number;
  billingCycleStart: string;
  billingCycleEnd: string;
  lastResetDate: string;
}

export type UsageCategory = "talk" | "video" | "song" | "teacher" | "credits";

export type LowBalanceAlert = {
  category: UsageCategory;
  level: "warning" | "critical" | "exceeded";
  percentUsed: number;
  remaining: number;
  limit: number;
} | null;

interface UsageContextType {
  usage: UsageData;
  tierLimits: TierLimits;
  incrementUsage: (category: UsageCategory, amount?: number) => void;
  upgradeTier: (tier: UsageTier) => void;
  getPercentUsed: (category: UsageCategory) => number;
  getRemaining: (category: UsageCategory) => number;
  isLimitReached: (category: UsageCategory) => boolean;
  lowBalanceAlert: LowBalanceAlert;
  dismissAlert: () => void;
  milestoneAchieved: Milestone | null;
  dismissMilestone: () => void;
  streakToastVisible: boolean;
  streakToastCount: number | undefined;
  showStreakToast: (count?: number) => void;
  dismissStreakToast: () => void;
  rateLimitVisible: boolean;
  rateLimitRetryAfter: number | undefined;
  showRateLimitToast: (retryAfterSeconds?: number) => void;
  dismissRateLimitToast: () => void;
}

const getDefaultUsage = (): UsageData => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return {
    tier: "free",
    talkMinutesUsed: 0,
    videoMinutesUsed: 0,
    songTranslationsUsed: 0,
    aiTeacherMinutesUsed: 0,
    creditsUsed: 0,
    creditsTotal: 50,
    billingCycleStart: startOfMonth,
    billingCycleEnd: endOfMonth,
    lastResetDate: startOfMonth,
  };
};

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const [usage, setUsage] = useState<UsageData>(getDefaultUsage());
  const [lowBalanceAlert, setLowBalanceAlert] = useState<LowBalanceAlert>(null);
  const [milestoneAchieved, setMilestoneAchieved] = useState<Milestone | null>(null);
  const [streakToastVisible, setStreakToastVisible] = useState(false);
  const [streakToastCount, setStreakToastCount] = useState<number | undefined>(undefined);
  const [rateLimitVisible, setRateLimitVisible] = useState(false);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number | undefined>(undefined);
  const milestoneQueue = useRef<Milestone[]>([]);
  const alertShownRef = useRef<Set<string>>(new Set());

  const tierLimits = TIER_LIMITS[usage.tier];

  // Load from storage on mount (user-scoped)
  useEffect(() => {
    const loadUsage = async () => {
      try {
        const stored = await UserStorage.get(USAGE_STORAGE_KEY);
        // Also check if user has purchased a subscription
        const subTier = await AsyncStorage.getItem("@subscription_tier");
        if (stored) {
          const parsed: UsageData = JSON.parse(stored);
          // Sync subscription tier from purchase
          if (subTier === "premium" || subTier === "pro") {
            parsed.tier = "pro";
          } else if (subTier === "plus") {
            parsed.tier = "plus";
          }
          // Check if billing cycle has reset
          const today = new Date().toISOString().split("T")[0];
          if (today > parsed.billingCycleEnd) {
            // Reset for new cycle
            const newUsage = getDefaultUsage();
            newUsage.tier = parsed.tier;
            newUsage.creditsTotal = TIER_LIMITS[parsed.tier].credits;
            setUsage(newUsage);
            await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(newUsage));
            await AsyncStorage.removeItem(LOW_BALANCE_SHOWN_KEY);
          } else {
            setUsage(parsed);
          }
        } else if (subTier === "premium" || subTier === "pro") {
          // No usage data yet but user is premium
          const newUsage = getDefaultUsage();
          newUsage.tier = "pro";
          newUsage.creditsTotal = TIER_LIMITS["pro"].credits;
          setUsage(newUsage);
          await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(newUsage));
        }
        // Load previously shown alerts
        const shownAlerts = await AsyncStorage.getItem(LOW_BALANCE_SHOWN_KEY);
        if (shownAlerts) {
          alertShownRef.current = new Set(JSON.parse(shownAlerts));
        }
      } catch {}
    };
    loadUsage();
  }, []);

  // Persist usage changes (user-scoped)
  const persistUsage = useCallback(async (newUsage: UsageData) => {
    try {
      await UserStorage.set(USAGE_STORAGE_KEY, JSON.stringify(newUsage));
    } catch {}
  }, []);

  const getUsedValue = (category: UsageCategory, data: UsageData): number => {
    switch (category) {
      case "talk": return data.talkMinutesUsed;
      case "video": return data.videoMinutesUsed;
      case "song": return data.songTranslationsUsed;
      case "teacher": return data.aiTeacherMinutesUsed;
      case "credits": return data.creditsUsed;
    }
  };

  const getLimitValue = (category: UsageCategory): number => {
    switch (category) {
      case "talk": return tierLimits.talkMinutes;
      case "video": return tierLimits.videoMinutes;
      case "song": return tierLimits.songTranslations;
      case "teacher": return tierLimits.aiTeacherMinutes;
      case "credits": return tierLimits.credits;
    }
  };

  const getPercentUsed = (category: UsageCategory): number => {
    const limit = getLimitValue(category);
    if (limit === -1) return 0; // unlimited
    const used = getUsedValue(category, usage);
    return Math.min((used / limit) * 100, 100);
  };

  const getRemaining = (category: UsageCategory): number => {
    const limit = getLimitValue(category);
    if (limit === -1) return Infinity;
    return Math.max(limit - getUsedValue(category, usage), 0);
  };

  const isLimitReached = (category: UsageCategory): boolean => {
    const limit = getLimitValue(category);
    if (limit === -1) return false;
    return getUsedValue(category, usage) >= limit;
  };

  const checkLowBalance = useCallback((category: UsageCategory, newUsage: UsageData) => {
    const limit = getLimitValue(category);
    if (limit === -1) return; // unlimited, no alerts

    const used = getUsedValue(category, newUsage);
    const pct = (used / limit) * 100;
    const remaining = Math.max(limit - used, 0);

    let level: "warning" | "critical" | "exceeded" | null = null;
    if (pct >= 100) level = "exceeded";
    else if (pct >= 90) level = "critical";
    else if (pct >= 80) level = "warning";

    if (level) {
      const alertKey = `${category}_${level}`;
      if (!alertShownRef.current.has(alertKey)) {
        alertShownRef.current.add(alertKey);
        setLowBalanceAlert({ category, level, percentUsed: pct, remaining, limit });
        // Persist shown alerts
        AsyncStorage.setItem(LOW_BALANCE_SHOWN_KEY, JSON.stringify([...alertShownRef.current])).catch(() => {});
      }
    }
  }, [tierLimits]);

  const showNextMilestone = useCallback(() => {
    if (milestoneQueue.current.length > 0) {
      const next = milestoneQueue.current.shift()!;
      setMilestoneAchieved(next);
    }
  }, []);

  const dismissMilestone = useCallback(() => {
    setMilestoneAchieved(null);
    // Show next queued milestone after a brief delay
    setTimeout(() => showNextMilestone(), 500);
  }, [showNextMilestone]);

  const incrementUsage = useCallback((category: UsageCategory, amount: number = 1) => {
    setUsage((prev) => {
      const newUsage = { ...prev };
      switch (category) {
        case "talk":
          newUsage.talkMinutesUsed += amount;
          break;
        case "video":
          newUsage.videoMinutesUsed += amount;
          break;
        case "song":
          newUsage.songTranslationsUsed += amount;
          break;
        case "teacher":
          newUsage.aiTeacherMinutesUsed += amount;
          break;
        case "credits":
          newUsage.creditsUsed += amount;
          break;
      }
      persistUsage(newUsage);
      checkLowBalance(category, newUsage);
      return newUsage;
    });

    // Check milestones for non-credits categories
    if (category !== "credits") {
      recordMilestoneUsage(category, amount).then(({ newMilestones, perfectDayTriggered }) => {
        if (newMilestones.length > 0) {
          // Award bonus credits for each milestone
          for (const m of newMilestones) {
            setUsage((prev) => {
              const updated = { ...prev, creditsUsed: prev.creditsUsed - m.credits };
              persistUsage(updated);
              return updated;
            });
          }
          // Queue milestone toasts
          milestoneQueue.current.push(...newMilestones);
          if (!milestoneAchieved) {
            showNextMilestone();
          }
        }
        // Perfect Day 2x bonus
        if (perfectDayTriggered) {
          const { PERFECT_DAY_BONUS } = require("@/lib/streak-bonus");
          const { recordPerfectDay } = require("@/lib/perfect-day-streak");

          // Record the Perfect Day streak and check for escalating bonus
          recordPerfectDay().then(({ newBonus }: { newBonus: any }) => {
            if (newBonus) {
              // Award streak bonus credits
              setUsage((prev) => {
                const updated = { ...prev, creditsUsed: prev.creditsUsed - newBonus.credits };
                persistUsage(updated);
                return updated;
              });
              // Queue streak bonus toast
              milestoneQueue.current.push({
                id: `streak_bonus_${newBonus.streak}`,
                title: newBonus.label,
                description: `${newBonus.emoji} ${newBonus.streak}-day Perfect Day streak! Bonus awarded`,
                icon: "trophy",
                credits: newBonus.credits,
                requirement: { category: "total", amount: 0 },
              });
            }
          });

          setUsage((prev) => {
            const updated = { ...prev, creditsUsed: prev.creditsUsed - PERFECT_DAY_BONUS };
            persistUsage(updated);
            return updated;
          });
          // Queue a special Perfect Day milestone toast
          milestoneQueue.current.push({
            id: "perfect_day",
            title: "Perfect Day!",
            description: "All milestones completed! 2x bonus credits awarded",
            icon: "star",
            credits: PERFECT_DAY_BONUS,
            requirement: { category: "total", amount: 0 },
          });
          if (!milestoneAchieved) {
            showNextMilestone();
          }
        }
      });
    }
  }, [persistUsage, checkLowBalance, milestoneAchieved, showNextMilestone]);

  const dismissAlert = useCallback(() => {
    setLowBalanceAlert(null);
  }, []);

  const showStreakToast = useCallback((count?: number) => {
    setStreakToastCount(count);
    setStreakToastVisible(true);
  }, []);

  const dismissStreakToast = useCallback(() => {
    setStreakToastVisible(false);
    setStreakToastCount(undefined);
  }, []);

  const showRateLimitToast = useCallback((retryAfterSeconds?: number) => {
    setRateLimitRetryAfter(retryAfterSeconds);
    setRateLimitVisible(true);
  }, []);

  const dismissRateLimitToast = useCallback(() => {
    setRateLimitVisible(false);
    setRateLimitRetryAfter(undefined);
  }, []);

  const upgradeTier = useCallback(async (newTier: UsageTier) => {
    const newUsage = { ...usage, tier: newTier, creditsTotal: TIER_LIMITS[newTier].credits };
    setUsage(newUsage);
    await persistUsage(newUsage);
    await AsyncStorage.setItem("@subscription_tier", newTier === "pro" ? "premium" : newTier);
  }, [usage, persistUsage]);

  return (
    <UsageContext.Provider
      value={{
        usage,
        tierLimits,
        incrementUsage,
        upgradeTier,
        getPercentUsed,
        getRemaining,
        isLimitReached,
        lowBalanceAlert,
        dismissAlert,
        milestoneAchieved,
        dismissMilestone,
        streakToastVisible,
        streakToastCount,
        showStreakToast,
        dismissStreakToast,
        rateLimitVisible,
        rateLimitRetryAfter,
        showRateLimitToast,
        dismissRateLimitToast,
      }}
    >
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error("useUsage must be used within a UsageProvider");
  }
  return context;
}
