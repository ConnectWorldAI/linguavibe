/**
 * Referral Incentive Program
 * 
 * Tiered referral system offering video call time and translation credits
 * as incentives for inviting new users. Tracks conversions and rewards.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Share, Platform } from "react-native";

// Storage keys
const REFERRAL_PROFILE_KEY = "@connectworld_referral_profile";
const REFERRAL_HISTORY_KEY = "@connectworld_referral_history";

// Reward constants
const CREDITS_PER_REFERRAL = 25; // Base credits for each successful referral
const VIDEO_MINUTES_PER_REFERRAL = 10; // Minutes of video call time per referral
const TRANSLATION_CREDITS_PER_REFERRAL = 50; // Translation credits per referral

// Tier thresholds
const TIER_THRESHOLDS = {
  starter: 0,
  ambassador: 5,
  champion: 15,
  legend: 50,
};

// Tier multipliers for rewards
const TIER_MULTIPLIERS = {
  starter: 1.0,
  ambassador: 1.5,
  champion: 2.0,
  legend: 3.0,
};

export type ReferralTier = "starter" | "ambassador" | "champion" | "legend";

export interface ReferralTierInfo {
  tier: ReferralTier;
  label: string;
  icon: string;
  color: string;
  minReferrals: number;
  multiplier: number;
  perks: string[];
}

export interface ReferralProfile {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  tier: ReferralTier;
  totalCreditsEarned: number;
  totalVideoMinutesEarned: number;
  totalTranslationCreditsEarned: number;
  availableCredits: number;
  availableVideoMinutes: number;
  availableTranslationCredits: number;
  createdAt: string;
  lastReferralDate: string | null;
  weeklyReferrals: number;
  monthlyReferrals: number;
}

export interface ReferralEntry {
  id: string;
  referredName: string;
  referredEmail?: string;
  status: "pending" | "signed_up" | "active" | "expired";
  createdAt: string;
  convertedAt?: string;
  creditsEarned: number;
  videoMinutesEarned: number;
  translationCreditsEarned: number;
}

export interface ReferralReward {
  credits: number;
  videoMinutes: number;
  translationCredits: number;
  bonusMessage?: string;
}

// Tier definitions
export const REFERRAL_TIERS: ReferralTierInfo[] = [
  {
    tier: "starter",
    label: "Starter",
    icon: "🌱",
    color: "#22C55E",
    minReferrals: 0,
    multiplier: 1.0,
    perks: ["25 credits per referral", "10 min video call time", "50 translation credits"],
  },
  {
    tier: "ambassador",
    label: "Ambassador",
    icon: "⭐",
    color: "#F59E0B",
    minReferrals: 5,
    multiplier: 1.5,
    perks: ["1.5x rewards", "Priority support", "Exclusive badge"],
  },
  {
    tier: "champion",
    label: "Champion",
    icon: "🏆",
    color: "#8B5CF6",
    minReferrals: 15,
    multiplier: 2.0,
    perks: ["2x rewards", "Early access features", "Custom referral page"],
  },
  {
    tier: "legend",
    label: "Legend",
    icon: "👑",
    color: "#FF4500",
    minReferrals: 50,
    multiplier: 3.0,
    perks: ["3x rewards", "Free premium month", "VIP community access"],
  },
];

/**
 * Get the referral tier for a given number of successful referrals
 */
export function getTierForReferrals(count: number): ReferralTierInfo {
  for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (count >= REFERRAL_TIERS[i].minReferrals) return REFERRAL_TIERS[i];
  }
  return REFERRAL_TIERS[0];
}

/**
 * Get progress to next tier as percentage (0-100)
 */
export function getTierProgress(successfulReferrals: number): { progress: number; nextTier: ReferralTierInfo | null; remaining: number } {
  const currentTier = getTierForReferrals(successfulReferrals);
  const currentIdx = REFERRAL_TIERS.findIndex((t) => t.tier === currentTier.tier);
  
  if (currentIdx >= REFERRAL_TIERS.length - 1) {
    return { progress: 100, nextTier: null, remaining: 0 };
  }

  const nextTier = REFERRAL_TIERS[currentIdx + 1];
  const range = nextTier.minReferrals - currentTier.minReferrals;
  const current = successfulReferrals - currentTier.minReferrals;
  const progress = Math.min(100, Math.round((current / range) * 100));
  const remaining = nextTier.minReferrals - successfulReferrals;

  return { progress, nextTier, remaining };
}

/**
 * Calculate reward for a successful referral
 */
export function calculateReward(tier: ReferralTier, isFirstReferral: boolean = false): ReferralReward {
  const multiplier = TIER_MULTIPLIERS[tier];
  const credits = Math.round(CREDITS_PER_REFERRAL * multiplier);
  const videoMinutes = Math.round(VIDEO_MINUTES_PER_REFERRAL * multiplier);
  const translationCredits = Math.round(TRANSLATION_CREDITS_PER_REFERRAL * multiplier);

  let bonusMessage: string | undefined;
  if (isFirstReferral) {
    bonusMessage = "🎉 First referral bonus! +10 extra credits";
  }

  return {
    credits: credits + (isFirstReferral ? 10 : 0),
    videoMinutes,
    translationCredits,
    bonusMessage,
  };
}

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "REF-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Get or create referral profile
 */
export async function getReferralProfile(): Promise<ReferralProfile> {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_PROFILE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  
  const profile: ReferralProfile = {
    referralCode: generateReferralCode(),
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    tier: "starter",
    totalCreditsEarned: 0,
    totalVideoMinutesEarned: 0,
    totalTranslationCreditsEarned: 0,
    availableCredits: 0,
    availableVideoMinutes: 0,
    availableTranslationCredits: 0,
    createdAt: new Date().toISOString(),
    lastReferralDate: null,
    weeklyReferrals: 0,
    monthlyReferrals: 0,
  };
  await AsyncStorage.setItem(REFERRAL_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

/**
 * Save referral profile
 */
async function saveReferralProfile(profile: ReferralProfile): Promise<void> {
  await AsyncStorage.setItem(REFERRAL_PROFILE_KEY, JSON.stringify(profile));
}

/**
 * Record a successful referral and grant rewards
 */
export async function recordSuccessfulReferral(
  referredName: string,
  referredEmail?: string
): Promise<{ profile: ReferralProfile; reward: ReferralReward }> {
  const profile = await getReferralProfile();
  const isFirst = profile.successfulReferrals === 0;
  const reward = calculateReward(profile.tier, isFirst);

  // Update profile
  profile.successfulReferrals += 1;
  profile.totalReferrals += 1;
  profile.weeklyReferrals += 1;
  profile.monthlyReferrals += 1;
  profile.lastReferralDate = new Date().toISOString();
  profile.tier = getTierForReferrals(profile.successfulReferrals).tier;

  // Grant rewards
  profile.totalCreditsEarned += reward.credits;
  profile.totalVideoMinutesEarned += reward.videoMinutes;
  profile.totalTranslationCreditsEarned += reward.translationCredits;
  profile.availableCredits += reward.credits;
  profile.availableVideoMinutes += reward.videoMinutes;
  profile.availableTranslationCredits += reward.translationCredits;

  if (profile.pendingReferrals > 0) profile.pendingReferrals -= 1;

  await saveReferralProfile(profile);

  // Save to history
  const entry: ReferralEntry = {
    id: Date.now().toString(36),
    referredName,
    referredEmail,
    status: "active",
    createdAt: new Date().toISOString(),
    convertedAt: new Date().toISOString(),
    creditsEarned: reward.credits,
    videoMinutesEarned: reward.videoMinutes,
    translationCreditsEarned: reward.translationCredits,
  };
  await addReferralHistoryEntry(entry);

  return { profile, reward };
}

/**
 * Record a pending referral (link shared but not yet converted)
 */
export async function recordPendingReferral(): Promise<ReferralProfile> {
  const profile = await getReferralProfile();
  profile.pendingReferrals += 1;
  profile.totalReferrals += 1;
  await saveReferralProfile(profile);
  return profile;
}

/**
 * Get referral history
 */
export async function getReferralHistory(): Promise<ReferralEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

/**
 * Add entry to referral history
 */
async function addReferralHistoryEntry(entry: ReferralEntry): Promise<void> {
  const history = await getReferralHistory();
  history.unshift(entry);
  await AsyncStorage.setItem(REFERRAL_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
}

/**
 * Share referral link via native share sheet
 */
export async function shareReferralLink(userName: string): Promise<boolean> {
  const profile = await getReferralProfile();
  const link = `https://connectworld.ai/join?ref=${profile.referralCode}`;
  const message = `🎁 ${userName} wants you to try ConnectWorld AI! Sign up with my code and we both get ${CREDITS_PER_REFERRAL} free credits for video calls and translations.\n\nUse code: ${profile.referralCode}\nOr join here: ${link}`;

  try {
    const result = await Share.share({
      message,
      url: Platform.OS === "ios" ? link : undefined,
    });
    if (result.action === Share.sharedAction) {
      await recordPendingReferral();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Spend credits (deduct from available balance)
 */
export async function spendCredits(amount: number): Promise<boolean> {
  const profile = await getReferralProfile();
  if (profile.availableCredits < amount) return false;
  profile.availableCredits -= amount;
  await saveReferralProfile(profile);
  return true;
}

/**
 * Spend video minutes
 */
export async function spendVideoMinutes(minutes: number): Promise<boolean> {
  const profile = await getReferralProfile();
  if (profile.availableVideoMinutes < minutes) return false;
  profile.availableVideoMinutes -= minutes;
  await saveReferralProfile(profile);
  return true;
}

/**
 * Spend translation credits
 */
export async function spendTranslationCredits(amount: number): Promise<boolean> {
  const profile = await getReferralProfile();
  if (profile.availableTranslationCredits < amount) return false;
  profile.availableTranslationCredits -= amount;
  await saveReferralProfile(profile);
  return true;
}

/**
 * Get referral stats summary for dashboard display
 */
export function getReferralStats(profile: ReferralProfile): {
  conversionRate: number;
  avgRewardPerReferral: number;
  tierLabel: string;
  tierIcon: string;
} {
  const conversionRate = profile.totalReferrals > 0
    ? Math.round((profile.successfulReferrals / profile.totalReferrals) * 100)
    : 0;
  const avgRewardPerReferral = profile.successfulReferrals > 0
    ? Math.round(profile.totalCreditsEarned / profile.successfulReferrals)
    : 0;
  const tierInfo = getTierForReferrals(profile.successfulReferrals);

  return {
    conversionRate,
    avgRewardPerReferral,
    tierLabel: tierInfo.label,
    tierIcon: tierInfo.icon,
  };
}
