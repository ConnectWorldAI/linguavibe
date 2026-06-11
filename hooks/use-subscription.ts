import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSubscriptionStatus, onSubscriptionChange } from "@/lib/revenuecat";

// ─── Types ───────────────────────────────────────────────────────────────────
export type PlanId = "free" | "plus" | "pro" | "enterprise";

export interface SubscriptionState {
  plan: PlanId;
  isLoading: boolean;
  subscribedDate: string | null;
}

// ─── Feature Access Matrix ──────────────────────────────────────────────────
// Defines which plan tier is required for each premium feature
export type PremiumFeature =
  | "unlimited_simulation"
  | "pro_lessons"
  | "ai_teacher_unlimited"
  | "voice_cloning"
  | "certificate_exams"
  | "custom_flashcards"
  | "progress_analytics"
  | "offline_mode"
  | "all_languages"
  | "advanced_recording"
  | "placement_retake"
  | "team_management"
  | "api_access"
  | "custom_curriculum"
  | "video_dub";

const FEATURE_REQUIREMENTS: Record<PremiumFeature, PlanId> = {
  unlimited_simulation: "pro",
  pro_lessons: "plus",
  ai_teacher_unlimited: "pro",
  voice_cloning: "pro",
  certificate_exams: "pro",
  custom_flashcards: "pro",
  progress_analytics: "pro",
  offline_mode: "plus",
  all_languages: "plus",
  advanced_recording: "plus",
  placement_retake: "plus",
  team_management: "enterprise",
  api_access: "enterprise",
  custom_curriculum: "enterprise",
  video_dub: "free",
};

// Plan hierarchy (higher index = more access)
const PLAN_HIERARCHY: PlanId[] = ["free", "plus", "pro", "enterprise"];

export function getPlanLevel(plan: PlanId): number {
  return PLAN_HIERARCHY.indexOf(plan);
}

export function hasAccess(currentPlan: PlanId, requiredPlan: PlanId): boolean {
  return getPlanLevel(currentPlan) >= getPlanLevel(requiredPlan);
}

export function getRequiredPlan(feature: PremiumFeature): PlanId {
  return FEATURE_REQUIREMENTS[feature];
}

export function canAccessFeature(currentPlan: PlanId, feature: PremiumFeature): boolean {
  return hasAccess(currentPlan, FEATURE_REQUIREMENTS[feature]);
}

// ─── Feature Display Info ───────────────────────────────────────────────────
export interface FeatureInfo {
  name: string;
  description: string;
  icon: string;
  requiredPlan: PlanId;
}

export const FEATURE_INFO: Record<PremiumFeature, FeatureInfo> = {
  unlimited_simulation: {
    name: "Unlimited Simulations",
    description: "Practice conversations without daily limits",
    icon: "chatbubbles",
    requiredPlan: "pro",
  },
  pro_lessons: {
    name: "Advanced Lessons (B2+)",
    description: "Access upper-intermediate and advanced curriculum",
    icon: "school",
    requiredPlan: "plus",
  },
  ai_teacher_unlimited: {
    name: "Unlimited AI Teacher",
    description: "Unlimited hours with your AI language teacher",
    icon: "person",
    requiredPlan: "pro",
  },
  voice_cloning: {
    name: "Voice Cloning",
    description: "Hear yourself speaking in your target language",
    icon: "mic",
    requiredPlan: "pro",
  },
  certificate_exams: {
    name: "Certificate Exams",
    description: "Take official proficiency certification tests",
    icon: "ribbon",
    requiredPlan: "pro",
  },
  custom_flashcards: {
    name: "Custom Flashcards",
    description: "Create unlimited custom flashcard decks",
    icon: "layers",
    requiredPlan: "pro",
  },
  progress_analytics: {
    name: "Progress Analytics",
    description: "Detailed learning analytics and insights",
    icon: "analytics",
    requiredPlan: "pro",
  },
  offline_mode: {
    name: "Offline Mode",
    description: "Download lessons and practice offline",
    icon: "cloud-download",
    requiredPlan: "plus",
  },
  all_languages: {
    name: "All Languages",
    description: "Access all 62+ languages (free tier: 1 language)",
    icon: "globe",
    requiredPlan: "plus",
  },
  advanced_recording: {
    name: "Advanced Recording",
    description: "Pro recording tools in WavyEQ Studios",
    icon: "radio",
    requiredPlan: "plus",
  },
  placement_retake: {
    name: "Placement Test Retake",
    description: "Retake placement test anytime (free: once/month)",
    icon: "refresh",
    requiredPlan: "plus",
  },
  team_management: {
    name: "Team Management",
    description: "Manage teams and track group progress",
    icon: "people",
    requiredPlan: "enterprise",
  },
  api_access: {
    name: "API Access",
    description: "Programmatic access to ConnectWorld AI services",
    icon: "code-slash",
    requiredPlan: "enterprise",
  },
  custom_curriculum: {
    name: "Custom Curriculum",
    description: "Build custom lesson paths for your organization",
    icon: "build",
    requiredPlan: "enterprise",
  },
  video_dub: {
    name: "Video Dubbing",
    description: "Translate and dub videos into other languages",
    icon: "film",
    requiredPlan: "free",
  },
};

// ─── Video Dub Monthly Limits ──────────────────────────────────────────────
export const VIDEO_DUB_MONTHLY_LIMITS: Record<PlanId, number> = {
  free: 1,
  plus: 10,
  pro: -1, // unlimited
  enterprise: -1, // unlimited
};

// ─── Daily Usage Limits ─────────────────────────────────────────────────────
export interface DailyLimits {
  simulations: number;
  songs: number;
  teacherMinutes: number;
}

export const PLAN_DAILY_LIMITS: Record<PlanId, DailyLimits> = {
  free: { simulations: 3, songs: 5, teacherMinutes: 5 },
  plus: { simulations: 20, songs: -1, teacherMinutes: 600 },
  pro: { simulations: -1, songs: -1, teacherMinutes: -1 },
  enterprise: { simulations: -1, songs: -1, teacherMinutes: -1 },
};

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    plan: "free",
    isLoading: true,
    subscribedDate: null,
  });

  useEffect(() => {
    loadSubscription();

    // Listen for real-time subscription changes (upgrades, downgrades, renewals)
    const unsubscribe = onSubscriptionChange((status) => {
      setState({
        plan: status.plan,
        isLoading: false,
        subscribedDate: status.expirationDate,
      });
    });

    return () => unsubscribe();
  }, []);

  const loadSubscription = async () => {
    try {
      // First try RevenueCat (source of truth for native)
      const rcStatus = await getSubscriptionStatus();
      if (rcStatus.plan !== "free") {
        // Sync RevenueCat status to local storage
        await AsyncStorage.setItem("@subscription_plan", rcStatus.plan);
        setState({
          plan: rcStatus.plan,
          isLoading: false,
          subscribedDate: rcStatus.expirationDate,
        });
        return;
      }

      // Fallback to local storage
      const plan = await AsyncStorage.getItem("@subscription_plan");
      const date = await AsyncStorage.getItem("@subscription_date");
      setState({
        plan: (plan as PlanId) || "free",
        isLoading: false,
        subscribedDate: date,
      });
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  };

  const refresh = useCallback(async () => {
    await loadSubscription();
  }, []);

  const checkFeatureAccess = useCallback(
    (feature: PremiumFeature): boolean => {
      return canAccessFeature(state.plan, feature);
    },
    [state.plan]
  );

  const getUpgradeTarget = useCallback(
    (feature: PremiumFeature): PlanId => {
      return getRequiredPlan(feature);
    },
    []
  );

  return {
    ...state,
    refresh,
    checkFeatureAccess,
    getUpgradeTarget,
    isPremium: getPlanLevel(state.plan) >= 1,
    isPro: getPlanLevel(state.plan) >= 2,
    isEnterprise: getPlanLevel(state.plan) >= 3,
  };
}
