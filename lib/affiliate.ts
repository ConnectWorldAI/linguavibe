import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── 2-Tier Affiliate Program ────────────────────────────────────────────────
// Tier 1: 20% commission on direct referrals (12-month cap)
// Tier 2: 5% commission on sub-referrals (12-month cap per user)

const AFFILIATE_KEY = "@connectworld_affiliate_data";
const REFERRAL_CODE_KEY = "@connectworld_referral_code";

export interface AffiliateData {
  referralCode: string;
  tier1Referrals: ReferralRecord[];
  tier2Referrals: ReferralRecord[];
  totalEarnings: number;
  pendingPayout: number;
  paidOut: number;
  joinedAt: string;
  payoutHistory: PayoutRecord[];
}

export interface ReferralRecord {
  userId: string;
  username: string;
  subscribedPlan: "plus" | "pro" | "enterprise";
  monthlyRevenue: number;
  commission: number;
  startDate: string;
  expiresAt: string; // 12-month cap
  isActive: boolean;
  tier: 1 | 2;
}

export interface PayoutRecord {
  id: string;
  amount: number;
  date: string;
  method: "paypal" | "bank" | "credits";
  status: "pending" | "completed" | "failed";
}

// Commission rates
export const COMMISSION_RATES = {
  TIER_1: 0.20, // 20% on direct referrals
  TIER_2: 0.05, // 5% on sub-referrals
  CAP_MONTHS: 12, // Commission expires after 12 months per referral
};

// Plan monthly prices for commission calculation
const PLAN_PRICES: Record<string, number> = {
  plus: 13.99,
  pro: 27.99,
  enterprise: 44.99,
};

/**
 * Generate a unique referral code for the user
 */
export function generateReferralCode(username: string): string {
  const base = username.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

/**
 * Initialize affiliate account for a user
 */
export async function initializeAffiliate(username: string): Promise<AffiliateData> {
  const existingData = await getAffiliateData();
  if (existingData) return existingData;

  const referralCode = generateReferralCode(username);
  const data: AffiliateData = {
    referralCode,
    tier1Referrals: [],
    tier2Referrals: [],
    totalEarnings: 0,
    pendingPayout: 0,
    paidOut: 0,
    joinedAt: new Date().toISOString(),
    payoutHistory: [],
  };

  await AsyncStorage.setItem(AFFILIATE_KEY, JSON.stringify(data));
  await AsyncStorage.setItem(REFERRAL_CODE_KEY, referralCode);
  return data;
}

/**
 * Get affiliate data for the current user
 */
export async function getAffiliateData(): Promise<AffiliateData | null> {
  try {
    const data = await AsyncStorage.getItem(AFFILIATE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Calculate monthly commission for a referral
 */
export function calculateCommission(plan: string, tier: 1 | 2): number {
  const price = PLAN_PRICES[plan] || 0;
  const rate = tier === 1 ? COMMISSION_RATES.TIER_1 : COMMISSION_RATES.TIER_2;
  return Math.round(price * rate * 100) / 100;
}

/**
 * Add a new Tier 1 referral (someone used your code)
 */
export async function addTier1Referral(
  userId: string,
  username: string,
  plan: "plus" | "pro" | "enterprise"
): Promise<void> {
  const data = await getAffiliateData();
  if (!data) return;

  const commission = calculateCommission(plan, 1);
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + COMMISSION_RATES.CAP_MONTHS);

  data.tier1Referrals.push({
    userId,
    username,
    subscribedPlan: plan,
    monthlyRevenue: PLAN_PRICES[plan],
    commission,
    startDate: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    isActive: true,
    tier: 1,
  });

  await AsyncStorage.setItem(AFFILIATE_KEY, JSON.stringify(data));
}

/**
 * Add a new Tier 2 referral (someone your referral referred)
 */
export async function addTier2Referral(
  userId: string,
  username: string,
  plan: "plus" | "pro" | "enterprise"
): Promise<void> {
  const data = await getAffiliateData();
  if (!data) return;

  const commission = calculateCommission(plan, 2);
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + COMMISSION_RATES.CAP_MONTHS);

  data.tier2Referrals.push({
    userId,
    username,
    subscribedPlan: plan,
    monthlyRevenue: PLAN_PRICES[plan],
    commission,
    startDate: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    isActive: true,
    tier: 2,
  });

  await AsyncStorage.setItem(AFFILIATE_KEY, JSON.stringify(data));
}

/**
 * Calculate total active monthly earnings
 */
export function calculateMonthlyEarnings(data: AffiliateData): {
  tier1Monthly: number;
  tier2Monthly: number;
  totalMonthly: number;
  activeTier1Count: number;
  activeTier2Count: number;
} {
  const now = new Date();

  const activeTier1 = data.tier1Referrals.filter(
    (r) => r.isActive && new Date(r.expiresAt) > now
  );
  const activeTier2 = data.tier2Referrals.filter(
    (r) => r.isActive && new Date(r.expiresAt) > now
  );

  const tier1Monthly = activeTier1.reduce((sum, r) => sum + r.commission, 0);
  const tier2Monthly = activeTier2.reduce((sum, r) => sum + r.commission, 0);

  return {
    tier1Monthly: Math.round(tier1Monthly * 100) / 100,
    tier2Monthly: Math.round(tier2Monthly * 100) / 100,
    totalMonthly: Math.round((tier1Monthly + tier2Monthly) * 100) / 100,
    activeTier1Count: activeTier1.length,
    activeTier2Count: activeTier2.length,
  };
}

/**
 * Get the referral link for sharing
 */
export function getReferralLink(code: string): string {
  return `https://connectworld.ai/join?ref=${code}`;
}

/**
 * Get the referral code for the current user
 */
export async function getReferralCode(): Promise<string | null> {
  return AsyncStorage.getItem(REFERRAL_CODE_KEY);
}

/**
 * Commission examples for display
 */
export const COMMISSION_EXAMPLES = {
  tier1: {
    plus: calculateCommission("plus", 1),    // $2.80/mo
    pro: calculateCommission("pro", 1),      // $5.60/mo
    enterprise: calculateCommission("enterprise", 1), // $9.00/mo
  },
  tier2: {
    plus: calculateCommission("plus", 2),    // $0.70/mo
    pro: calculateCommission("pro", 2),      // $1.40/mo
    enterprise: calculateCommission("enterprise", 2), // $2.25/mo
  },
};
