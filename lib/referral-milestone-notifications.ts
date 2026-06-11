/**
 * Referral Milestone Push Notifications
 * 
 * Sends push notifications when users are close to the next referral tier,
 * encouraging them to share and unlock better rewards.
 * 
 * Triggers:
 * - When user is within 1 referral of the next tier
 * - When a new referral converts (signs up)
 * - Weekly nudge if user has 0 referrals but has been active 7+ days
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const REFERRAL_NOTIF_KEY = "@connectworld_referral_milestone_notifs";
const LAST_NUDGE_KEY = "@connectworld_referral_last_nudge";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface ReferralTier {
  name: string;
  minReferrals: number;
  reward: string;
  icon: string;
  color: string;
}

export interface ReferralMilestoneNotification {
  id: string;
  type: "approaching_tier" | "new_conversion" | "weekly_nudge" | "tier_unlocked";
  title: string;
  body: string;
  tier?: string;
  referralsNeeded?: number;
  scheduledAt: number;
  fired: boolean;
}

export interface ReferralNotifPrefs {
  enabled: boolean;
  approachingTierEnabled: boolean;
  conversionEnabled: boolean;
  weeklyNudgeEnabled: boolean;
}

// ─── TIER DEFINITIONS ───────────────────────────────────────────────────────

export const REFERRAL_TIERS: ReferralTier[] = [
  { name: "Starter", minReferrals: 0, reward: "Base rewards", icon: "🌱", color: "#22C55E" },
  { name: "Connector", minReferrals: 3, reward: "+30min video call time", icon: "🔗", color: "#3B82F6" },
  { name: "Ambassador", minReferrals: 7, reward: "1.5x translation credits", icon: "🌟", color: "#F59E0B" },
  { name: "Champion", minReferrals: 15, reward: "2x all rewards + exclusive badge", icon: "🏆", color: "#9B59B6" },
  { name: "Legend", minReferrals: 30, reward: "Lifetime premium perks", icon: "👑", color: "#E74C3C" },
];

// ─── CORE FUNCTIONS ─────────────────────────────────────────────────────────

/**
 * Get the current tier and next tier based on referral count
 */
export function getCurrentAndNextTier(referralCount: number): { current: ReferralTier; next: ReferralTier | null; referralsToNext: number } {
  let current = REFERRAL_TIERS[0];
  let next: ReferralTier | null = null;

  for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (referralCount >= REFERRAL_TIERS[i].minReferrals) {
      current = REFERRAL_TIERS[i];
      next = i < REFERRAL_TIERS.length - 1 ? REFERRAL_TIERS[i + 1] : null;
      break;
    }
  }

  const referralsToNext = next ? next.minReferrals - referralCount : 0;
  return { current, next, referralsToNext };
}

/**
 * Check if user should receive an "approaching tier" notification
 */
export function shouldNotifyApproachingTier(referralCount: number): { shouldNotify: boolean; tier: ReferralTier | null; referralsNeeded: number } {
  const { next, referralsToNext } = getCurrentAndNextTier(referralCount);
  
  if (!next) return { shouldNotify: false, tier: null, referralsNeeded: 0 };
  
  // Notify when within 1-2 referrals of next tier
  const shouldNotify = referralsToNext <= 2 && referralsToNext > 0;
  return { shouldNotify, tier: next, referralsNeeded: referralsToNext };
}

/**
 * Generate notification content based on milestone type
 */
export function generateMilestoneNotification(
  type: ReferralMilestoneNotification["type"],
  referralCount: number,
  newReferralName?: string
): { title: string; body: string } {
  const { current, next, referralsToNext } = getCurrentAndNextTier(referralCount);

  switch (type) {
    case "approaching_tier":
      if (!next) return { title: "You're at the top!", body: "Legend tier — you've unlocked everything. Keep sharing the love!" };
      if (referralsToNext === 1) {
        return {
          title: `${next.icon} Just 1 more referral!`,
          body: `You're 1 referral away from ${next.name} tier — unlock ${next.reward}!`,
        };
      }
      return {
        title: `${next.icon} Almost ${next.name}!`,
        body: `Only ${referralsToNext} more referrals to unlock ${next.reward}. Share your code now!`,
      };

    case "new_conversion":
      return {
        title: "🎉 New referral joined!",
        body: newReferralName
          ? `${newReferralName} just signed up with your code! You now have ${referralCount} referrals.`
          : `Someone just signed up with your code! You now have ${referralCount} referrals.`,
      };

    case "weekly_nudge":
      return {
        title: "📣 Share ConnectWorld AI",
        body: next
          ? `You're ${referralsToNext} referrals from ${next.name} tier (${next.reward}). Share your invite code today!`
          : "Share your invite code with friends and earn rewards together!",
      };

    case "tier_unlocked":
      return {
        title: `${current.icon} ${current.name} Tier Unlocked!`,
        body: `Congratulations! You've reached ${current.name} tier. Enjoy ${current.reward}!`,
      };

    default:
      return { title: "Referral Update", body: "Check your referral progress!" };
  }
}

/**
 * Schedule a referral milestone notification (uses expo-notifications pattern)
 */
export async function scheduleReferralMilestoneNotification(
  type: ReferralMilestoneNotification["type"],
  referralCount: number,
  newReferralName?: string
): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;

    const prefs = await getReferralNotifPrefs();
    if (!prefs.enabled) return null;

    // Check type-specific prefs
    if (type === "approaching_tier" && !prefs.approachingTierEnabled) return null;
    if (type === "new_conversion" && !prefs.conversionEnabled) return null;
    if (type === "weekly_nudge" && !prefs.weeklyNudgeEnabled) return null;

    const { title, body } = generateMilestoneNotification(type, referralCount, newReferralName);

    // Dynamic import to avoid web crashes
    const Notifications = await import("expo-notifications");

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: "referral_milestone", screen: "/referral" },
        sound: "default",
      },
      trigger: type === "weekly_nudge"
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3600, repeats: false } // 1 hour delay for nudges
        : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false }, // Near-instant for conversions
    });

    // Record the notification
    const record: ReferralMilestoneNotification = {
      id: notifId,
      type,
      title,
      body,
      tier: type === "approaching_tier" ? getCurrentAndNextTier(referralCount).next?.name : undefined,
      referralsNeeded: getCurrentAndNextTier(referralCount).referralsToNext,
      scheduledAt: Date.now(),
      fired: false,
    };
    await recordNotification(record);

    return notifId;
  } catch {
    return null;
  }
}

/**
 * Check referral count and trigger appropriate notifications.
 * Call this after a new referral conversion or periodically.
 */
export async function checkAndNotifyReferralMilestones(
  referralCount: number,
  previousCount: number,
  newReferralName?: string
): Promise<void> {
  // New conversion notification
  if (referralCount > previousCount) {
    await scheduleReferralMilestoneNotification("new_conversion", referralCount, newReferralName);
  }

  // Check if user just unlocked a new tier
  const prevTier = getCurrentAndNextTier(previousCount).current;
  const currTier = getCurrentAndNextTier(referralCount).current;
  if (currTier.name !== prevTier.name && referralCount > previousCount) {
    await scheduleReferralMilestoneNotification("tier_unlocked", referralCount);
  }

  // Check if approaching next tier
  const { shouldNotify } = shouldNotifyApproachingTier(referralCount);
  if (shouldNotify) {
    // Don't spam — only notify once per tier approach
    const history = await getNotificationHistory();
    const recentApproaching = history.find(
      (n) => n.type === "approaching_tier" && Date.now() - n.scheduledAt < 24 * 60 * 60 * 1000
    );
    if (!recentApproaching) {
      await scheduleReferralMilestoneNotification("approaching_tier", referralCount);
    }
  }
}

/**
 * Schedule weekly nudge if user hasn't referred anyone recently
 */
export async function scheduleWeeklyReferralNudge(referralCount: number): Promise<void> {
  const lastNudge = await AsyncStorage.getItem(LAST_NUDGE_KEY);
  const lastNudgeTime = lastNudge ? parseInt(lastNudge, 10) : 0;
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  if (Date.now() - lastNudgeTime < oneWeek) return;

  await scheduleReferralMilestoneNotification("weekly_nudge", referralCount);
  await AsyncStorage.setItem(LAST_NUDGE_KEY, Date.now().toString());
}

// ─── PREFERENCES ────────────────────────────────────────────────────────────

export async function getReferralNotifPrefs(): Promise<ReferralNotifPrefs> {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_NOTIF_KEY + "_prefs");
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    enabled: true,
    approachingTierEnabled: true,
    conversionEnabled: true,
    weeklyNudgeEnabled: true,
  };
}

export async function saveReferralNotifPrefs(prefs: ReferralNotifPrefs): Promise<void> {
  await AsyncStorage.setItem(REFERRAL_NOTIF_KEY + "_prefs", JSON.stringify(prefs));
}

// ─── HISTORY ────────────────────────────────────────────────────────────────

async function recordNotification(notif: ReferralMilestoneNotification): Promise<void> {
  try {
    const history = await getNotificationHistory();
    history.unshift(notif);
    await AsyncStorage.setItem(REFERRAL_NOTIF_KEY, JSON.stringify(history.slice(0, 30)));
  } catch {}
}

export async function getNotificationHistory(): Promise<ReferralMilestoneNotification[]> {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_NOTIF_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
