import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Constants ──────────────────────────────────────────────────────────────
const RC_INITIALIZED_KEY = "@connectworld_rc_initialized";

// Entitlement identifiers configured in RevenueCat dashboard
export const ENTITLEMENTS = {
  PLUS: "plus_access",
  PRO: "pro_access",
  ENTERPRISE: "enterprise_access",
} as const;

// Product identifiers (must match RevenueCat dashboard + App Store Connect / Google Play)
export const PRODUCT_IDS = {
  PLUS_MONTHLY: "connectworld_plus_monthly",
  PLUS_YEARLY: "connectworld_plus_yearly",
  PRO_MONTHLY: "connectworld_pro_monthly",
  PRO_YEARLY: "connectworld_pro_yearly",
  ENTERPRISE_MONTHLY: "connectworld_enterprise_monthly",
  ENTERPRISE_YEARLY: "connectworld_enterprise_yearly",
  LIFETIME: "connectworld_lifetime",
} as const;

// Fallback pricing (used when offerings aren't loaded from RevenueCat yet)
export const FALLBACK_PRICING = {
  [PRODUCT_IDS.PLUS_MONTHLY]: { price: 9.99, period: "month" },
  [PRODUCT_IDS.PLUS_YEARLY]: { price: 79.99, period: "year" },
  [PRODUCT_IDS.PRO_MONTHLY]: { price: 19.99, period: "month" },
  [PRODUCT_IDS.PRO_YEARLY]: { price: 149.99, period: "year" },
  [PRODUCT_IDS.ENTERPRISE_MONTHLY]: { price: 49.99, period: "month" },
  [PRODUCT_IDS.ENTERPRISE_YEARLY]: { price: 399.99, period: "year" },
  [PRODUCT_IDS.LIFETIME]: { price: 299.99, period: "lifetime" },
} as const;

// Offering identifier
export const DEFAULT_OFFERING_ID = "default";

// Map plan IDs to entitlement identifiers
export type PlanId = "free" | "plus" | "pro" | "enterprise";

const PLAN_TO_ENTITLEMENT: Record<Exclude<PlanId, "free">, string> = {
  plus: ENTITLEMENTS.PLUS,
  pro: ENTITLEMENTS.PRO,
  enterprise: ENTITLEMENTS.ENTERPRISE,
};

// ─── Types ──────────────────────────────────────────────────────────────────
export interface RevenueCatConfig {
  apiKeyApple: string;
  apiKeyGoogle: string;
}

export interface SubscriptionStatus {
  plan: PlanId;
  isActive: boolean;
  expirationDate: string | null;
  willRenew: boolean;
  managementUrl: string | null;
}

export interface AvailablePackage {
  identifier: string;
  planId: PlanId;
  billingCycle: "monthly" | "yearly";
  price: string;
  priceAmount: number;
  currencyCode: string;
  title: string;
  description: string;
  rcPackage: PurchasesPackage;
}

// ─── Initialization ─────────────────────────────────────────────────────────

let isInitialized = false;

/**
 * Initialize RevenueCat SDK.
 * Call this once at app startup (in _layout.tsx).
 * Uses environment variable REVENUECAT_API_KEY for the platform-specific key.
 */
export async function initializeRevenueCat(config?: RevenueCatConfig): Promise<void> {
  if (isInitialized) return;
  if (Platform.OS === "web") {
    // RevenueCat doesn't fully support web in Expo Go — use mock mode
    isInitialized = true;
    return;
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    const apiKey =
      Platform.OS === "ios"
        ? config?.apiKeyApple || process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || ""
        : config?.apiKeyGoogle || process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || "";

    if (!apiKey) {
      console.warn("[RevenueCat] No API key configured. Purchases will not work.");
      isInitialized = true;
      return;
    }

    await Purchases.configure({ apiKey });
    isInitialized = true;
    await AsyncStorage.setItem(RC_INITIALIZED_KEY, "true");
  } catch (error) {
    console.error("[RevenueCat] Initialization failed:", error);
    isInitialized = true; // Prevent retry loops
  }
}

// ─── Customer Info ──────────────────────────────────────────────────────────

/**
 * Get the current subscription status from RevenueCat.
 * Falls back to AsyncStorage if RevenueCat is unavailable (web/no API key).
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (Platform.OS === "web" || !isInitialized) {
    return getLocalSubscriptionStatus();
  }

  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
    return parseCustomerInfo(customerInfo);
  } catch (error) {
    console.warn("[RevenueCat] Failed to get customer info, using local fallback:", error);
    return getLocalSubscriptionStatus();
  }
}

/**
 * Parse RevenueCat CustomerInfo into our SubscriptionStatus type.
 */
function parseCustomerInfo(info: CustomerInfo): SubscriptionStatus {
  // Check entitlements in order of highest tier
  if (info.entitlements.active[ENTITLEMENTS.ENTERPRISE]) {
    const ent = info.entitlements.active[ENTITLEMENTS.ENTERPRISE];
    return {
      plan: "enterprise",
      isActive: true,
      expirationDate: ent.expirationDate,
      willRenew: ent.willRenew,
      managementUrl: info.managementURL,
    };
  }
  if (info.entitlements.active[ENTITLEMENTS.PRO]) {
    const ent = info.entitlements.active[ENTITLEMENTS.PRO];
    return {
      plan: "pro",
      isActive: true,
      expirationDate: ent.expirationDate,
      willRenew: ent.willRenew,
      managementUrl: info.managementURL,
    };
  }
  if (info.entitlements.active[ENTITLEMENTS.PLUS]) {
    const ent = info.entitlements.active[ENTITLEMENTS.PLUS];
    return {
      plan: "plus",
      isActive: true,
      expirationDate: ent.expirationDate,
      willRenew: ent.willRenew,
      managementUrl: info.managementURL,
    };
  }

  return {
    plan: "free",
    isActive: false,
    expirationDate: null,
    willRenew: false,
    managementUrl: info.managementURL,
  };
}

/**
 * Fallback: read subscription from AsyncStorage (for web or when RC unavailable).
 */
async function getLocalSubscriptionStatus(): Promise<SubscriptionStatus> {
  const plan = (await AsyncStorage.getItem("@subscription_plan")) as PlanId | null;
  return {
    plan: plan || "free",
    isActive: plan !== null && plan !== "free",
    expirationDate: null,
    willRenew: false,
    managementUrl: null,
  };
}

// ─── Offerings & Packages ───────────────────────────────────────────────────

/**
 * Fetch available offerings from RevenueCat.
 * Returns packages mapped to our plan structure.
 */
export async function getAvailablePackages(): Promise<AvailablePackage[]> {
  if (Platform.OS === "web" || !isInitialized) {
    return getLocalPackages();
  }

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;

    if (!current) {
      console.warn("[RevenueCat] No current offering available");
      return getLocalPackages();
    }

    return mapOfferingToPackages(current);
  } catch (error) {
    console.warn("[RevenueCat] Failed to fetch offerings:", error);
    return getLocalPackages();
  }
}

/**
 * Map a RevenueCat offering to our AvailablePackage format.
 */
function mapOfferingToPackages(offering: PurchasesOffering): AvailablePackage[] {
  const packages: AvailablePackage[] = [];

  for (const pkg of offering.availablePackages) {
    const product = pkg.product;
    const identifier = product.identifier;

    // Determine plan and billing cycle from product identifier
    let planId: PlanId = "free";
    let billingCycle: "monthly" | "yearly" = "monthly";

    if (identifier.includes("plus")) {
      planId = "plus";
    } else if (identifier.includes("pro")) {
      planId = "pro";
    } else if (identifier.includes("enterprise")) {
      planId = "enterprise";
    }

    if (identifier.includes("yearly") || identifier.includes("annual")) {
      billingCycle = "yearly";
    }

    if (planId !== "free") {
      packages.push({
        identifier: pkg.identifier,
        planId,
        billingCycle,
        price: product.priceString,
        priceAmount: product.price,
        currencyCode: product.currencyCode,
        title: product.title,
        description: product.description,
        rcPackage: pkg,
      });
    }
  }

  return packages;
}

/**
 * Fallback packages for web/no-RC mode (shows prices but purchase won't work).
 */
function getLocalPackages(): AvailablePackage[] {
  return [
    { identifier: "plus_monthly", planId: "plus", billingCycle: "monthly", price: "$13.99", priceAmount: 13.99, currencyCode: "USD", title: "Plus Monthly", description: "500 credits/month, all languages, AI teacher, song breakdowns", rcPackage: null as any },
    { identifier: "plus_yearly", planId: "plus", billingCycle: "yearly", price: "$99.99", priceAmount: 99.99, currencyCode: "USD", title: "Plus Yearly", description: "Save 40% — all Plus features", rcPackage: null as any },
    { identifier: "pro_monthly", planId: "pro", billingCycle: "monthly", price: "$27.99", priceAmount: 27.99, currencyCode: "USD", title: "Pro Monthly", description: "Unlimited AI teacher, voice cloning, song translation, stem separation", rcPackage: null as any },
    { identifier: "pro_yearly", planId: "pro", billingCycle: "yearly", price: "$199.99", priceAmount: 199.99, currencyCode: "USD", title: "Pro Yearly", description: "Save 40% — all Pro features", rcPackage: null as any },
    { identifier: "enterprise_monthly", planId: "enterprise", billingCycle: "monthly", price: "$44.99", priceAmount: 44.99, currencyCode: "USD", title: "Enterprise Monthly", description: "Team/family sharing (5 seats), API access, custom curriculum", rcPackage: null as any },
    { identifier: "enterprise_yearly", planId: "enterprise", billingCycle: "yearly", price: "$449.99", priceAmount: 449.99, currencyCode: "USD", title: "Enterprise Yearly", description: "Save 17% — all Enterprise features", rcPackage: null as any },
  ];
}

// ─── Purchases ──────────────────────────────────────────────────────────────

export interface PurchaseResult {
  success: boolean;
  plan: PlanId;
  error?: string;
  errorCode?: string;
  customerInfo?: CustomerInfo;
}

/**
 * Purchase a package through RevenueCat.
 * Handles the native purchase flow (App Store / Google Play sheet).
 */
export async function purchasePackage(pkg: AvailablePackage): Promise<PurchaseResult> {
  if (Platform.OS === "web") {
    // Web fallback: simulate purchase and store locally
    await AsyncStorage.setItem("@subscription_plan", pkg.planId);
    await AsyncStorage.setItem("@subscription_date", new Date().toISOString());
    return { success: true, plan: pkg.planId };
  }

  if (!pkg.rcPackage) {
    return { success: false, plan: "free", error: "Invalid package (no RevenueCat package)" };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg.rcPackage);

    // Determine which plan was activated
    const status = parseCustomerInfo(customerInfo);

    // Sync to local storage for offline access
    await AsyncStorage.setItem("@subscription_plan", status.plan);
    await AsyncStorage.setItem("@subscription_date", new Date().toISOString());

    return {
      success: true,
      plan: status.plan,
      customerInfo,
    };
  } catch (error: any) {
    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { success: false, plan: "free", error: "Purchase cancelled", errorCode: "cancelled" };
    }

    return {
      success: false,
      plan: "free",
      error: error.message || "Purchase failed",
      errorCode: error.code,
    };
  }
}

// ─── Restore Purchases ──────────────────────────────────────────────────────

/**
 * Restore previous purchases (e.g., after reinstall or new device).
 */
export async function restorePurchases(): Promise<SubscriptionStatus> {
  if (Platform.OS === "web") {
    return getLocalSubscriptionStatus();
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const status = parseCustomerInfo(customerInfo);

    // Sync to local storage
    await AsyncStorage.setItem("@subscription_plan", status.plan);

    return status;
  } catch (error) {
    console.error("[RevenueCat] Restore failed:", error);
    return getLocalSubscriptionStatus();
  }
}

// ─── User Identification ────────────────────────────────────────────────────

/**
 * Identify a user with RevenueCat (for cross-device subscription sync).
 * Call after user logs in.
 */
export async function identifyUser(userId: string): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await Purchases.logIn(userId);
  } catch (error) {
    console.error("[RevenueCat] Failed to identify user:", error);
  }
}

/**
 * Log out the current user (resets to anonymous).
 * Call when user logs out.
 */
export async function logOutUser(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await Purchases.logOut();
  } catch (error) {
    console.error("[RevenueCat] Failed to log out:", error);
  }
}

// ─── Subscription Change Listener ──────────────────────────────────────────

type SubscriptionChangeCallback = (status: SubscriptionStatus) => void;
const listeners: Set<SubscriptionChangeCallback> = new Set();

/**
 * Subscribe to real-time subscription status changes.
 * Returns an unsubscribe function.
 */
export function onSubscriptionChange(callback: SubscriptionChangeCallback): () => void {
  listeners.add(callback);

  // Set up native listener if first subscriber
  if (listeners.size === 1 && Platform.OS !== "web") {
    try {
      Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
        const status = parseCustomerInfo(info);
        // Sync to local storage
        AsyncStorage.setItem("@subscription_plan", status.plan).catch(() => {});
        // Notify all listeners
        listeners.forEach((cb) => cb(status));
      });
    } catch (error) {
      console.warn("[RevenueCat] Failed to add customer info listener:", error);
    }
  }

  return () => {
    listeners.delete(callback);
  };
}

// ─── Subscription Management ────────────────────────────────────────────────

/**
 * Open the platform's subscription management page.
 * iOS: Opens App Store subscriptions; Android: Opens Google Play subscriptions.
 */
export async function openManageSubscriptions(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const info = await Purchases.getCustomerInfo();
    if (info.managementURL) {
      const { Linking } = require("react-native");
      await Linking.openURL(info.managementURL);
    }
  } catch (error) {
    console.error("[RevenueCat] Failed to open management URL:", error);
  }
}
