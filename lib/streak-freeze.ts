/**
 * Streak Freeze / Protection System
 *
 * Allows users to purchase one-day streak shields via microtransaction.
 * When a freeze is active, missing a day won't break the streak.
 * Integrates with grammar-streak.ts to check freeze status before resetting.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface StreakFreezeData {
  availableFreezes: number; // How many freeze tokens the user owns
  freezesUsedTotal: number; // Lifetime count of freezes used
  activeFreezeDate: string | null; // YYYY-MM-DD if a freeze is active today
  purchaseHistory: FreezePurchase[];
}

export interface FreezePurchase {
  id: string;
  date: string; // ISO date
  quantity: number;
  method: "revenuecat" | "credits" | "free_monthly";
  price: string; // e.g., "$0.99"
}

// ─── Constants ───────────────────────────────────────────────────────────────
const FREEZE_STORAGE_KEY = "@streak_freeze_data";
const FREEZE_PRICE = "$0.99";
const FREEZE_PRICE_AMOUNT = 0.99;
const FREE_MONTHLY_FREEZES = 2; // Users get 2 free freezes per month
const LAST_FREE_GRANT_KEY = "@streak_freeze_last_free_grant";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Data Access ─────────────────────────────────────────────────────────────
export async function getStreakFreezeData(): Promise<StreakFreezeData> {
  try {
    const raw = await AsyncStorage.getItem(FREEZE_STORAGE_KEY);
    if (raw) {
      const data: StreakFreezeData = JSON.parse(raw);
      // Grant free monthly freezes if needed
      await grantMonthlyFreezes(data);
      return data;
    }
  } catch (e) {
    console.error("Failed to load streak freeze data:", e);
  }
  // Initialize with free monthly freezes
  const initial: StreakFreezeData = {
    availableFreezes: FREE_MONTHLY_FREEZES,
    freezesUsedTotal: 0,
    activeFreezeDate: null,
    purchaseHistory: [],
  };
  await saveStreakFreezeData(initial);
  await AsyncStorage.setItem(LAST_FREE_GRANT_KEY, getCurrentMonth());
  return initial;
}

async function saveStreakFreezeData(data: StreakFreezeData): Promise<void> {
  try {
    await AsyncStorage.setItem(FREEZE_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save streak freeze data:", e);
  }
}

async function grantMonthlyFreezes(data: StreakFreezeData): Promise<void> {
  const currentMonth = getCurrentMonth();
  const lastGrant = await AsyncStorage.getItem(LAST_FREE_GRANT_KEY);
  if (lastGrant !== currentMonth) {
    data.availableFreezes += FREE_MONTHLY_FREEZES;
    await AsyncStorage.setItem(LAST_FREE_GRANT_KEY, currentMonth);
    await saveStreakFreezeData(data);
  }
}

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Check if a streak freeze is active for today.
 * Called by grammar-streak.ts before breaking the streak.
 */
export async function isFreezeActiveToday(): Promise<boolean> {
  const data = await getStreakFreezeData();
  return data.activeFreezeDate === getToday();
}

/**
 * Activate a streak freeze for today.
 * Consumes one available freeze token.
 * Returns true if successful, false if no freezes available.
 */
export async function activateFreeze(): Promise<boolean> {
  const data = await getStreakFreezeData();
  if (data.availableFreezes <= 0) return false;

  data.availableFreezes -= 1;
  data.freezesUsedTotal += 1;
  data.activeFreezeDate = getToday();
  await saveStreakFreezeData(data);
  return true;
}

/**
 * Purchase additional streak freezes via RevenueCat.
 * Returns the updated freeze data.
 */
export async function purchaseStreakFreeze(quantity: number = 1): Promise<{
  success: boolean;
  data: StreakFreezeData;
  error?: string;
}> {
  // Import RevenueCat dynamically to avoid circular deps
  const { purchasePackage, getAvailablePackages } = await import("./revenuecat");

  try {
    // Try to find a streak freeze consumable package
    const packages = await getAvailablePackages();
    const freezePackage = packages.find(
      (p) => p.identifier.includes("streak_freeze") || p.identifier.includes("consumable")
    );

    if (freezePackage) {
      const result = await purchasePackage(freezePackage);
      if (!result.success) {
        return { success: false, data: await getStreakFreezeData(), error: result.error };
      }
    } else {
      // Fallback: simulate purchase on web / when no consumable product exists
      // In production, this would be a real consumable IAP
      await new Promise((r) => setTimeout(r, 800));
    }

    // Add freezes to inventory
    const data = await getStreakFreezeData();
    data.availableFreezes += quantity;
    data.purchaseHistory.push({
      id: `freeze_${Date.now()}`,
      date: new Date().toISOString(),
      quantity,
      method: "revenuecat",
      price: `$${(FREEZE_PRICE_AMOUNT * quantity).toFixed(2)}`,
    });
    await saveStreakFreezeData(data);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, data: await getStreakFreezeData(), error: e.message || "Purchase failed" };
  }
}

/**
 * Purchase freezes using in-app credits (alternative to real money).
 * Costs 10 credits per freeze.
 */
export async function purchaseFreezeWithCredits(quantity: number = 1): Promise<{
  success: boolean;
  data: StreakFreezeData;
}> {
  const data = await getStreakFreezeData();
  data.availableFreezes += quantity;
  data.purchaseHistory.push({
    id: `freeze_credits_${Date.now()}`,
    date: new Date().toISOString(),
    quantity,
    method: "credits",
    price: `${10 * quantity} credits`,
  });
  await saveStreakFreezeData(data);
  return { success: true, data };
}

/**
 * Get freeze pricing info for display.
 */
export function getFreezePricing() {
  return {
    price: FREEZE_PRICE,
    priceAmount: FREEZE_PRICE_AMOUNT,
    freeMonthly: FREE_MONTHLY_FREEZES,
    creditsPerFreeze: 10,
  };
}

// ─── XP-Based Purchase ───────────────────────────────────────────────────────

/** Cost tiers for purchasing freezes with XP */
export const XP_FREEZE_COSTS = [
  { tier: 1, cost: 15, label: "First freeze" },
  { tier: 2, cost: 25, label: "Second freeze" },
  { tier: 3, cost: 40, label: "Third freeze" },
  { tier: 4, cost: 60, label: "Fourth freeze" },
  { tier: 5, cost: 80, label: "Fifth freeze" },
];

export const MAX_XP_FREEZE_CAPACITY = 5;

/**
 * Get the XP cost for the next freeze based on current inventory.
 */
export function getNextXPFreezeCost(currentCount: number): number {
  if (currentCount >= MAX_XP_FREEZE_CAPACITY) return Infinity;
  const tier = XP_FREEZE_COSTS[currentCount];
  return tier ? tier.cost : 100;
}

/**
 * Purchase a streak freeze using XP points.
 * Returns success/failure and cost. Caller deducts XP from scoring system.
 */
export async function purchaseFreezeWithXP(
  availableXP: number
): Promise<{ success: boolean; error?: string; xpSpent?: number }> {
  const data = await getStreakFreezeData();

  if (data.availableFreezes >= MAX_XP_FREEZE_CAPACITY) {
    return { success: false, error: "Maximum freeze capacity reached" };
  }

  const cost = getNextXPFreezeCost(data.availableFreezes);

  if (availableXP < cost) {
    return { success: false, error: `Not enough XP. Need ${cost} XP, have ${availableXP} XP` };
  }

  data.availableFreezes += 1;
  data.purchaseHistory.push({
    id: `freeze_xp_${Date.now()}`,
    date: new Date().toISOString(),
    quantity: 1,
    method: "credits",
    price: `${cost} XP`,
  });
  await saveStreakFreezeData(data);

  // Track total XP spent on freezes
  const xpSpentKey = "@streak_freeze_xp_spent";
  try {
    const stored = await AsyncStorage.getItem(xpSpentKey);
    const total = stored ? parseInt(stored, 10) + cost : cost;
    await AsyncStorage.setItem(xpSpentKey, String(total));
  } catch {}

  return { success: true, xpSpent: cost };
}

/**
 * Check if a streak freeze should be auto-applied for missed days.
 * Call during streak calculation when diff > 1.
 * Returns whether streak was preserved and how many freezes were used.
 */
export async function checkAndApplyStreakFreeze(
  currentStreak: number,
  daysMissed: number
): Promise<{ streakPreserved: boolean; newStreak: number; freezesUsed: number }> {
  if (daysMissed <= 0) {
    return { streakPreserved: true, newStreak: currentStreak, freezesUsed: 0 };
  }

  const data = await getStreakFreezeData();
  const freezesAvailable = data.availableFreezes;

  if (freezesAvailable >= daysMissed) {
    // Can cover all missed days
    data.availableFreezes -= daysMissed;
    data.freezesUsedTotal += daysMissed;
    data.activeFreezeDate = getToday();
    await saveStreakFreezeData(data);
    return {
      streakPreserved: true,
      newStreak: currentStreak + 1,
      freezesUsed: daysMissed,
    };
  } else {
    // Not enough freezes — streak resets
    return { streakPreserved: false, newStreak: 1, freezesUsed: 0 };
  }
}

/**
 * Get total XP spent on freezes.
 */
export async function getTotalXPSpentOnFreezes(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem("@streak_freeze_xp_spent");
    return stored ? parseInt(stored, 10) : 0;
  } catch {}
  return 0;
}
