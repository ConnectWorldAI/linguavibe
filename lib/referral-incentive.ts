/**
 * Referral Incentive System
 * 
 * Rewards both the challenger (referrer) and the invitee when a new user signs up
 * via a referral link. Benefits include bonus XP, free Streak Freeze, and additional
 * video call time or speech-to-speech translation credits.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Storage Keys ───
const REFERRAL_CODE_KEY = "@connectworld_referral_code";
const REFERRAL_HISTORY_KEY = "@connectworld_referral_history";
const REFERRAL_REWARDS_KEY = "@connectworld_referral_rewards";
const REWARD_HISTORY_KEY = "@connectworld_reward_history";
const REFERRAL_UNREAD_KEY = "@connectworld_referral_unread_count";

// ─── Constants ───
export const REFERRAL_REWARDS = {
  referrer: {
    bonusXP: 50,
    streakFreezes: 1,
    videoCallMinutes: 5,
    translationCredits: 10,
  },
  invitee: {
    bonusXP: 25,
    streakFreezes: 1,
    videoCallMinutes: 3,
    translationCredits: 5,
  },
} as const;

export const REFERRAL_TIERS = [
  { referrals: 1, title: "Connector", badge: "🤝", bonusMultiplier: 1 },
  { referrals: 5, title: "Ambassador", badge: "🌟", bonusMultiplier: 1.5 },
  { referrals: 10, title: "Champion", badge: "🏆", bonusMultiplier: 2 },
  { referrals: 25, title: "Legend", badge: "👑", bonusMultiplier: 3 },
] as const;

// ─── Types ───
export interface ReferralRecord {
  id: string;
  inviteeId: string;
  inviteeName: string;
  timestamp: string;
  rewardsClaimed: boolean;
}

export interface ReferralRewards {
  totalXPEarned: number;
  totalFreezes: number;
  totalVideoMinutes: number;
  totalTranslationCredits: number;
  unclaimedXP: number;
  unclaimedFreezes: number;
  unclaimedVideoMinutes: number;
  unclaimedTranslationCredits: number;
}

export interface ReferralData {
  code: string;
  referrals: ReferralRecord[];
  rewards: ReferralRewards;
  currentTier: typeof REFERRAL_TIERS[number] | null;
  nextTier: typeof REFERRAL_TIERS[number] | null;
  referralsToNextTier: number;
}

// ─── Core Functions ───

/**
 * Generate a unique referral code for the user.
 * Format: CW-XXXXX (alphanumeric, easy to share)
 */
export async function generateReferralCode(): Promise<string> {
  const existing = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
  if (existing) return existing;

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars (0, O, 1, I)
  let code = "CW-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
  return code;
}

/**
 * Get the user's referral code (generates one if none exists)
 */
export async function getReferralCode(): Promise<string> {
  return generateReferralCode();
}

/**
 * Build the shareable challenge message with referral code
 */
export async function buildChallengeMessage(
  userXP: number,
  weeklyXP: number
): Promise<string> {
  const code = await getReferralCode();
  const message = [
    `🔥 I earned ${weeklyXP} XP this week on ConnectWorld AI!`,
    `Can you beat my score? Join my challenge!`,
    ``,
    `🎁 Use my code ${code} when you sign up and we BOTH get:`,
    `• ${REFERRAL_REWARDS.invitee.bonusXP} bonus XP`,
    `• ${REFERRAL_REWARDS.invitee.streakFreezes} free Streak Freeze`,
    `• ${REFERRAL_REWARDS.invitee.videoCallMinutes} min free video calls`,
    `• ${REFERRAL_REWARDS.invitee.translationCredits} translation credits`,
    ``,
    `Download ConnectWorld AI and start learning! 🌍`,
    `https://connectworld.ai/invite/${code}`,
  ].join("\n");

  return message;
}

/**
 * Record a successful referral (called when invitee signs up with code)
 */
export async function recordReferral(
  inviteeId: string,
  inviteeName: string
): Promise<ReferralRewards> {
  // Load existing history
  const historyRaw = await AsyncStorage.getItem(REFERRAL_HISTORY_KEY);
  const history: ReferralRecord[] = historyRaw ? JSON.parse(historyRaw) : [];

  // Add new referral
  const record: ReferralRecord = {
    id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    inviteeId,
    inviteeName,
    timestamp: new Date().toISOString(),
    rewardsClaimed: false,
  };
  history.push(record);
  await AsyncStorage.setItem(REFERRAL_HISTORY_KEY, JSON.stringify(history));

  // Calculate tier multiplier
  const tier = getCurrentTier(history.length);
  const multiplier = tier ? tier.bonusMultiplier : 1;

  // Calculate rewards
  const rewardsRaw = await AsyncStorage.getItem(REFERRAL_REWARDS_KEY);
  const rewards: ReferralRewards = rewardsRaw
    ? JSON.parse(rewardsRaw)
    : {
        totalXPEarned: 0,
        totalFreezes: 0,
        totalVideoMinutes: 0,
        totalTranslationCredits: 0,
        unclaimedXP: 0,
        unclaimedFreezes: 0,
        unclaimedVideoMinutes: 0,
        unclaimedTranslationCredits: 0,
      };

  const xpReward = Math.floor(REFERRAL_REWARDS.referrer.bonusXP * multiplier);
  rewards.totalXPEarned += xpReward;
  rewards.totalFreezes += REFERRAL_REWARDS.referrer.streakFreezes;
  rewards.totalVideoMinutes += REFERRAL_REWARDS.referrer.videoCallMinutes;
  rewards.totalTranslationCredits += REFERRAL_REWARDS.referrer.translationCredits;
  rewards.unclaimedXP += xpReward;
  rewards.unclaimedFreezes += REFERRAL_REWARDS.referrer.streakFreezes;
  rewards.unclaimedVideoMinutes += REFERRAL_REWARDS.referrer.videoCallMinutes;
  rewards.unclaimedTranslationCredits += REFERRAL_REWARDS.referrer.translationCredits;

  await AsyncStorage.setItem(REFERRAL_REWARDS_KEY, JSON.stringify(rewards));

  // Record in reward history ledger
  await appendRewardHistory({
    id: `rh_referrer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: "referrer_earned",
    code: "YOUR_CODE",
    date: new Date().toISOString(),
    rewards: {
      bonusXP: xpReward,
      streakFreezes: REFERRAL_REWARDS.referrer.streakFreezes,
      videoCallMinutes: REFERRAL_REWARDS.referrer.videoCallMinutes,
      translationCredits: REFERRAL_REWARDS.referrer.translationCredits,
    },
    description: `${inviteeName} joined using your code`,
  });

  // Increment unread referral badge count
  await incrementUnreadReferralCount();

  return rewards;
}

/**
 * Claim pending referral rewards (XP, freezes, etc.)
 */
export async function claimReferralRewards(): Promise<{
  xp: number;
  freezes: number;
  videoMinutes: number;
  translationCredits: number;
}> {
  const rewardsRaw = await AsyncStorage.getItem(REFERRAL_REWARDS_KEY);
  if (!rewardsRaw) return { xp: 0, freezes: 0, videoMinutes: 0, translationCredits: 0 };

  const rewards: ReferralRewards = JSON.parse(rewardsRaw);
  const claimed = {
    xp: rewards.unclaimedXP,
    freezes: rewards.unclaimedFreezes,
    videoMinutes: rewards.unclaimedVideoMinutes,
    translationCredits: rewards.unclaimedTranslationCredits,
  };

  // Record claim in reward history
  if (claimed.xp > 0 || claimed.freezes > 0 || claimed.videoMinutes > 0 || claimed.translationCredits > 0) {
    await appendRewardHistory({
      id: `rh_claim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "claimed",
      code: "",
      date: new Date().toISOString(),
      rewards: {
        bonusXP: claimed.xp,
        streakFreezes: claimed.freezes,
        videoCallMinutes: claimed.videoMinutes,
        translationCredits: claimed.translationCredits,
      },
      description: "Claimed pending rewards",
    });
  }

  // Reset unclaimed
  rewards.unclaimedXP = 0;
  rewards.unclaimedFreezes = 0;
  rewards.unclaimedVideoMinutes = 0;
  rewards.unclaimedTranslationCredits = 0;
  await AsyncStorage.setItem(REFERRAL_REWARDS_KEY, JSON.stringify(rewards));

  // Mark all referrals as claimed
  const historyRaw = await AsyncStorage.getItem(REFERRAL_HISTORY_KEY);
  if (historyRaw) {
    const history: ReferralRecord[] = JSON.parse(historyRaw);
    const updated = history.map((r) => ({ ...r, rewardsClaimed: true }));
    await AsyncStorage.setItem(REFERRAL_HISTORY_KEY, JSON.stringify(updated));
  }

  return claimed;
}

/**
 * Get full referral data for display
 */
export async function getReferralData(): Promise<ReferralData> {
  const code = await getReferralCode();

  const historyRaw = await AsyncStorage.getItem(REFERRAL_HISTORY_KEY);
  const referrals: ReferralRecord[] = historyRaw ? JSON.parse(historyRaw) : [];

  const rewardsRaw = await AsyncStorage.getItem(REFERRAL_REWARDS_KEY);
  const rewards: ReferralRewards = rewardsRaw
    ? JSON.parse(rewardsRaw)
    : {
        totalXPEarned: 0,
        totalFreezes: 0,
        totalVideoMinutes: 0,
        totalTranslationCredits: 0,
        unclaimedXP: 0,
        unclaimedFreezes: 0,
        unclaimedVideoMinutes: 0,
        unclaimedTranslationCredits: 0,
      };

  const currentTier = getCurrentTier(referrals.length);
  const nextTier = getNextTier(referrals.length);
  const referralsToNextTier = nextTier ? nextTier.referrals - referrals.length : 0;

  return { code, referrals, rewards, currentTier, nextTier, referralsToNextTier };
}

// ─── Referral Redemption ───

const REFERRAL_REDEEMED_KEY = "@connectworld_referral_redeemed";
const REFERRAL_BONUS_XP_KEY = "@connectworld_referral_bonus_xp";

// ─── Reward History ───

export interface RewardHistoryEntry {
  id: string;
  type: "referrer_earned" | "invitee_redeemed" | "claimed";
  code: string;
  date: string;
  rewards: {
    bonusXP: number;
    streakFreezes: number;
    videoCallMinutes: number;
    translationCredits: number;
  };
  description: string;
}

/**
 * Get the full reward history ledger for display on the dashboard.
 */
export async function getRewardHistory(): Promise<RewardHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(REWARD_HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Append an entry to the reward history ledger.
 */
async function appendRewardHistory(entry: RewardHistoryEntry): Promise<void> {
  const existing = await getRewardHistory();
  existing.unshift(entry); // newest first
  // Keep max 100 entries
  const trimmed = existing.slice(0, 100);
  await AsyncStorage.setItem(REWARD_HISTORY_KEY, JSON.stringify(trimmed));
}

export interface ReferralRedemptionResult {
  success: boolean;
  error?: string;
  rewards?: {
    bonusXP: number;
    streakFreezes: number;
    videoCallMinutes: number;
    translationCredits: number;
  };
}

/**
 * Validate a referral code format (CW-XXXXX).
 * In a real app this would also verify against a server.
 */
export function isValidReferralCode(code: string): boolean {
  return /^CW-[A-Z0-9]{5}$/i.test(code.trim());
}

/**
 * Check if the current user has already redeemed a referral code.
 */
export async function hasRedeemedReferral(): Promise<boolean> {
  const val = await AsyncStorage.getItem(REFERRAL_REDEEMED_KEY);
  return val !== null;
}

/**
 * Redeem a referral code during onboarding.
 * Awards the invitee their rewards and records the referrer's credit.
 * Returns the rewards granted to the invitee.
 */
export async function redeemReferralCode(code: string): Promise<ReferralRedemptionResult> {
  const trimmed = code.trim().toUpperCase();

  // Check if already redeemed
  const alreadyRedeemed = await hasRedeemedReferral();
  if (alreadyRedeemed) {
    return { success: false, error: "You have already redeemed a referral code." };
  }

  // Prevent self-referral
  const ownCode = await AsyncStorage.getItem("@connectworld_referral_code");
  if (ownCode && ownCode.toUpperCase() === trimmed) {
    return { success: false, error: "You cannot use your own referral code." };
  }

  // Try server-side validation first (supports affiliate codes + peer codes)
  try {
    const trpcModule = await import("@/lib/trpc");
    const serverResult = await trpcModule.vanillaClient.affiliate.validateAndRedeem.mutate({ code: trimmed });
    if (serverResult.valid && serverResult.rewards) {
      // Server validated — apply rewards locally
      await applyReferralRewards(trimmed, serverResult.rewards);
      return { success: true, rewards: serverResult.rewards };
    } else if (serverResult.error) {
      return { success: false, error: serverResult.error };
    }
  } catch {
    // Server unavailable — fall through to local validation
  }

  // Fallback: local format validation for CW-XXXXX codes
  if (!isValidReferralCode(trimmed)) {
    return { success: false, error: "Invalid referral code. Please check and try again." };
  }

  // Local fallback: apply default invitee rewards
  const inviteeRewards = REFERRAL_REWARDS.invitee;
  await applyReferralRewards(trimmed, {
    bonusXP: inviteeRewards.bonusXP,
    streakFreezes: inviteeRewards.streakFreezes,
    videoCallMinutes: inviteeRewards.videoCallMinutes,
    translationCredits: inviteeRewards.translationCredits,
  });

  // Credit the referrer (simulated locally — in production this would be server-side)
  await recordReferral(`invitee_${Date.now()}`, "New User");

  return {
    success: true,
    rewards: {
      bonusXP: inviteeRewards.bonusXP,
      streakFreezes: inviteeRewards.streakFreezes,
      videoCallMinutes: inviteeRewards.videoCallMinutes,
      translationCredits: inviteeRewards.translationCredits,
    },
  };
}

/**
 * Apply referral rewards locally (shared by server-validated and local-validated paths).
 */
async function applyReferralRewards(
  code: string,
  rewards: { bonusXP: number; streakFreezes: number; videoCallMinutes: number; translationCredits: number }
): Promise<void> {
  // Mark as redeemed
  await AsyncStorage.setItem(REFERRAL_REDEEMED_KEY, JSON.stringify({
    code,
    redeemedAt: new Date().toISOString(),
  }));

  // Record in reward history ledger
  await appendRewardHistory({
    id: `rh_redeem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: "invitee_redeemed",
    code,
    date: new Date().toISOString(),
    rewards,
    description: `Redeemed code ${code}`,
  });

  // Store bonus XP
  const existingBonusRaw = await AsyncStorage.getItem(REFERRAL_BONUS_XP_KEY);
  const existingBonus = existingBonusRaw ? parseInt(existingBonusRaw, 10) : 0;
  await AsyncStorage.setItem(REFERRAL_BONUS_XP_KEY, String(existingBonus + rewards.bonusXP));

  // Grant streak freezes
  try {
    const freezeRaw = await AsyncStorage.getItem("@streak_freeze_data");
    const freezeData = freezeRaw ? JSON.parse(freezeRaw) : {
      availableFreezes: 0,
      freezesUsedTotal: 0,
      activeFreezeDate: null,
      purchaseHistory: [],
    };
    freezeData.availableFreezes += rewards.streakFreezes;
    freezeData.purchaseHistory.push({
      id: `ref_redeem_${Date.now()}`,
      date: new Date().toISOString(),
      quantity: rewards.streakFreezes,
      method: "free_monthly",
      price: "$0.00",
    });
    await AsyncStorage.setItem("@streak_freeze_data", JSON.stringify(freezeData));
  } catch {}

  // Grant video call minutes & translation credits
  try {
    const usageRaw = await AsyncStorage.getItem("@connectworld_usage_data");
    if (usageRaw) {
      const usage = JSON.parse(usageRaw);
      usage.creditsUsed = (usage.creditsUsed || 0) - rewards.translationCredits;
      usage.videoMinutesUsed = (usage.videoMinutesUsed || 0) - rewards.videoCallMinutes;
      await AsyncStorage.setItem("@connectworld_usage_data", JSON.stringify(usage));
    }
  } catch {}
}

/**
 * Get the bonus XP earned from referral redemption.
 * This is added to the user's displayed XP total.
 */
export async function getReferralBonusXP(): Promise<number> {
  const raw = await AsyncStorage.getItem(REFERRAL_BONUS_XP_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

// ─── Helpers ───

function getCurrentTier(referralCount: number): typeof REFERRAL_TIERS[number] | null {
  let current: typeof REFERRAL_TIERS[number] | null = null;
  for (const tier of REFERRAL_TIERS) {
    if (referralCount >= tier.referrals) {
      current = tier;
    }
  }
  return current;
}

function getNextTier(referralCount: number): typeof REFERRAL_TIERS[number] | null {
  for (const tier of REFERRAL_TIERS) {
    if (referralCount < tier.referrals) {
      return tier;
    }
  }
  return null;
}

// ─── Referral Badge Count (persisted) ───

/**
 * Get the current unread referral count (for badge display).
 */
export async function getUnreadReferralCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(REFERRAL_UNREAD_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

/**
 * Increment the unread referral count (called when a new referral is recorded).
 */
async function incrementUnreadReferralCount(): Promise<void> {
  const current = await getUnreadReferralCount();
  await AsyncStorage.setItem(REFERRAL_UNREAD_KEY, String(current + 1));
}

/**
 * Clear the unread referral count (called when user views the Referral Dashboard).
 */
export async function clearUnreadReferralCount(): Promise<void> {
  await AsyncStorage.setItem(REFERRAL_UNREAD_KEY, "0");
}
