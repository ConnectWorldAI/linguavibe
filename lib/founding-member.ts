import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Founding Member 30-Day Launch Special ───────────────────────────────────
// 40% off all plans for the first 30 days after app launch.
// Users who subscribe during this window get the discounted rate locked for 12 months.

const FOUNDING_MEMBER_KEY = "@connectworld_founding_member";
const LAUNCH_DATE_KEY = "@connectworld_launch_date";

// Set your launch date here — the 30-day countdown starts from this date
// Update this to your actual launch date before publishing
const APP_LAUNCH_DATE = new Date("2026-06-01T00:00:00Z");
const SPECIAL_DURATION_DAYS = 30;

export interface FoundingMemberPricing {
  plus: { monthly: number; yearly: number; monthlyDisplay: string; yearlyDisplay: string };
  pro: { monthly: number; yearly: number; monthlyDisplay: string; yearlyDisplay: string };
  enterprise: { monthly: number; yearly: number; monthlyDisplay: string; yearlyDisplay: string };
}

// Full prices (after special ends)
export const FULL_PRICES = {
  plus: { monthly: 13.99, yearly: 99.99 },
  pro: { monthly: 27.99, yearly: 199.99 },
  enterprise: { monthly: 44.99, yearly: 449.99 },
};

// Founding member prices (40% off monthly, annual stays same as it's already discounted)
export const FOUNDING_PRICES: FoundingMemberPricing = {
  plus: {
    monthly: 8.99,
    yearly: 59.99,
    monthlyDisplay: "$8.99",
    yearlyDisplay: "$59.99",
  },
  pro: {
    monthly: 16.99,
    yearly: 119.99,
    monthlyDisplay: "$16.99",
    yearlyDisplay: "$119.99",
  },
  enterprise: {
    monthly: 26.99,
    yearly: 269.99,
    monthlyDisplay: "$26.99",
    yearlyDisplay: "$269.99",
  },
};

/**
 * Check if the founding member special is still active (within 30 days of launch)
 */
export function isFoundingSpecialActive(): boolean {
  const now = new Date();
  const endDate = new Date(APP_LAUNCH_DATE);
  endDate.setDate(endDate.getDate() + SPECIAL_DURATION_DAYS);
  return now >= APP_LAUNCH_DATE && now <= endDate;
}

/**
 * Get the number of days remaining in the founding member special
 */
export function getDaysRemaining(): number {
  const now = new Date();
  const endDate = new Date(APP_LAUNCH_DATE);
  endDate.setDate(endDate.getDate() + SPECIAL_DURATION_DAYS);
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Get hours remaining (for last-day urgency)
 */
export function getHoursRemaining(): number {
  const now = new Date();
  const endDate = new Date(APP_LAUNCH_DATE);
  endDate.setDate(endDate.getDate() + SPECIAL_DURATION_DAYS);
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}

/**
 * Get the end date of the special
 */
export function getSpecialEndDate(): Date {
  const endDate = new Date(APP_LAUNCH_DATE);
  endDate.setDate(endDate.getDate() + SPECIAL_DURATION_DAYS);
  return endDate;
}

/**
 * Mark user as a founding member (call when they subscribe during the special)
 */
export async function markAsFoundingMember(): Promise<void> {
  await AsyncStorage.setItem(FOUNDING_MEMBER_KEY, JSON.stringify({
    joinedAt: new Date().toISOString(),
    lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 12 months
    discount: 0.40, // 40% off
  }));
}

/**
 * Check if user is a founding member with locked pricing
 */
export async function isFoundingMember(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(FOUNDING_MEMBER_KEY);
    if (!data) return false;
    const { lockedUntil } = JSON.parse(data);
    return new Date(lockedUntil) > new Date();
  } catch {
    return false;
  }
}

/**
 * Get the current price for a plan (founding or full)
 */
export function getCurrentPrice(
  plan: "plus" | "pro" | "enterprise",
  cycle: "monthly" | "yearly"
): { price: number; display: string; isSpecial: boolean; savings: string } {
  const isSpecial = isFoundingSpecialActive();
  
  if (isSpecial) {
    const foundingPrice = FOUNDING_PRICES[plan][cycle];
    const fullPrice = cycle === "monthly" ? FULL_PRICES[plan].monthly : FULL_PRICES[plan].yearly;
    const savings = Math.round(((fullPrice - foundingPrice) / fullPrice) * 100);
    return {
      price: foundingPrice,
      display: `$${foundingPrice.toFixed(2)}`,
      isSpecial: true,
      savings: `${savings}% off`,
    };
  }

  const fullPrice = cycle === "monthly" ? FULL_PRICES[plan].monthly : FULL_PRICES[plan].yearly;
  return {
    price: fullPrice,
    display: `$${fullPrice.toFixed(2)}`,
    isSpecial: false,
    savings: "",
  };
}

/**
 * Get all plan prices with founding member status
 */
export function getAllPrices(cycle: "monthly" | "yearly") {
  return {
    plus: getCurrentPrice("plus", cycle),
    pro: getCurrentPrice("pro", cycle),
    enterprise: getCurrentPrice("enterprise", cycle),
    isSpecialActive: isFoundingSpecialActive(),
    daysRemaining: getDaysRemaining(),
  };
}
