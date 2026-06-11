/**
 * Geo-Pricing System for ConnectWorld AI
 * 
 * Implements regional pricing to make the app affordable in developing markets
 * while maintaining profitability. Uses IP-based detection + App Store country
 * to determine the user's pricing tier.
 * 
 * Strategy:
 * - US/Canada/UK/EU/Australia/Japan: Standard pricing ($13.99-$44.99/mo)
 * - Caribbean/Central America: Caribbean Plan ($2.99-$4.99/mo)
 * - South America: LatAm Plan ($3.99-$7.99/mo)
 * - Africa: Africa Plan ($1.49-$3.99/mo)
 * - Southeast Asia: SEA Plan ($2.99-$5.99/mo)
 * 
 * This ensures:
 * 1. People in DR, Haiti, Jamaica etc. can afford the app
 * 2. We still capture revenue that would otherwise be $0
 * 3. Creators like Omar can promote to their audience knowing the price is right
 * 4. Volume at lower price > zero users at high price
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type PricingRegion =
  | "standard"       // US, Canada, UK, EU, Australia, Japan, Korea
  | "caribbean"      // DR, Haiti, Jamaica, Trinidad, Puerto Rico, Cuba, Bahamas
  | "central_america" // Guatemala, Honduras, El Salvador, Nicaragua, Costa Rica, Panama
  | "south_america"  // Brazil, Colombia, Argentina, Peru, Chile, Ecuador, Venezuela
  | "africa"         // Nigeria, Kenya, South Africa, Ghana, Tanzania, Ethiopia
  | "southeast_asia" // Philippines, Vietnam, Thailand, Indonesia, Malaysia
  | "south_asia"     // India, Pakistan, Bangladesh, Sri Lanka
  | "middle_east";   // Egypt, Morocco, Tunisia, Jordan

export interface RegionalPricing {
  region: PricingRegion;
  regionName: string;
  currency: string;
  currencySymbol: string;
  plans: {
    plus: { monthly: number; yearly: number };
    pro: { monthly: number; yearly: number };
    family: { monthly: number; yearly: number };
  };
  creditPacks: {
    starter: number;
    value: number;
    pro: number;
    mega: number;
  };
  individualProducts: {
    callTranslatePerCall: number;
    songBreakdown: number;
    songTranslation: number;
    aiTeacher30min: number;
    voiceClone: number;
  };
}

// ─── COUNTRY TO REGION MAPPING ───────────────────────────────────────────────
const COUNTRY_REGION_MAP: Record<string, PricingRegion> = {
  // Standard (full price)
  US: "standard", CA: "standard", GB: "standard", DE: "standard",
  FR: "standard", IT: "standard", ES: "standard", NL: "standard",
  BE: "standard", AT: "standard", CH: "standard", SE: "standard",
  NO: "standard", DK: "standard", FI: "standard", IE: "standard",
  AU: "standard", NZ: "standard", JP: "standard", KR: "standard",
  SG: "standard", HK: "standard", TW: "standard",

  // Caribbean
  DO: "caribbean", HT: "caribbean", JM: "caribbean", TT: "caribbean",
  BB: "caribbean", BS: "caribbean", CU: "caribbean", PR: "caribbean",
  GD: "caribbean", LC: "caribbean", VC: "caribbean", AG: "caribbean",
  DM: "caribbean", KN: "caribbean", BZ: "caribbean", GY: "caribbean",
  SR: "caribbean",

  // Central America
  GT: "central_america", HN: "central_america", SV: "central_america",
  NI: "central_america", CR: "central_america", PA: "central_america",
  MX: "central_america", // Mexico gets LatAm pricing

  // South America
  BR: "south_america", CO: "south_america", AR: "south_america",
  PE: "south_america", CL: "south_america", EC: "south_america",
  VE: "south_america", BO: "south_america", PY: "south_america",
  UY: "south_america",

  // Africa
  NG: "africa", KE: "africa", ZA: "africa", GH: "africa",
  TZ: "africa", ET: "africa", UG: "africa", RW: "africa",
  SN: "africa", CI: "africa", CM: "africa", CD: "africa",

  // Southeast Asia
  PH: "southeast_asia", VN: "southeast_asia", TH: "southeast_asia",
  ID: "southeast_asia", MY: "southeast_asia", MM: "southeast_asia",
  KH: "southeast_asia", LA: "southeast_asia",

  // South Asia
  IN: "south_asia", PK: "south_asia", BD: "south_asia",
  LK: "south_asia", NP: "south_asia",

  // Middle East / North Africa
  EG: "middle_east", MA: "middle_east", TN: "middle_east",
  JO: "middle_east", LB: "middle_east", IQ: "middle_east",
};

// ─── REGIONAL PRICING TABLE ─────────────────────────────────────────────────
const PRICING_TABLE: Record<PricingRegion, RegionalPricing> = {
  standard: {
    region: "standard",
    regionName: "Standard",
    currency: "USD",
    currencySymbol: "$",
    plans: {
      plus: { monthly: 13.99, yearly: 139.99 },
      pro: { monthly: 27.99, yearly: 279.99 },
      family: { monthly: 44.99, yearly: 449.99 },
    },
    creditPacks: { starter: 4.99, value: 12.99, pro: 39.99, mega: 79.99 },
    individualProducts: {
      callTranslatePerCall: 2.99,
      songBreakdown: 1.99,
      songTranslation: 3.99,
      aiTeacher30min: 4.99,
      voiceClone: 9.99,
    },
  },
  caribbean: {
    region: "caribbean",
    regionName: "Caribbean Plan",
    currency: "USD",
    currencySymbol: "$",
    plans: {
      plus: { monthly: 2.99, yearly: 29.99 },
      pro: { monthly: 4.99, yearly: 49.99 },
      family: { monthly: 7.99, yearly: 79.99 },
    },
    creditPacks: { starter: 0.99, value: 2.49, pro: 7.99, mega: 14.99 },
    individualProducts: {
      callTranslatePerCall: 0.49,
      songBreakdown: 0.29,
      songTranslation: 0.99,
      aiTeacher30min: 0.99,
      voiceClone: 2.99,
    },
  },
  central_america: {
    region: "central_america",
    regionName: "Central America Plan",
    currency: "USD",
    currencySymbol: "$",
    plans: {
      plus: { monthly: 2.99, yearly: 29.99 },
      pro: { monthly: 5.99, yearly: 59.99 },
      family: { monthly: 9.99, yearly: 99.99 },
    },
    creditPacks: { starter: 1.49, value: 3.99, pro: 11.99, mega: 22.99 },
    individualProducts: {
      callTranslatePerCall: 0.79,
      songBreakdown: 0.49,
      songTranslation: 1.49,
      aiTeacher30min: 1.49,
      voiceClone: 3.99,
    },
  },
  south_america: {
    region: "south_america",
    regionName: "South America Plan",
    currency: "USD",
    currencySymbol: "$",
    plans: {
      plus: { monthly: 3.99, yearly: 39.99 },
      pro: { monthly: 7.99, yearly: 79.99 },
      family: { monthly: 12.99, yearly: 129.99 },
    },
    creditPacks: { starter: 1.99, value: 4.99, pro: 14.99, mega: 29.99 },
    individualProducts: {
      callTranslatePerCall: 0.99,
      songBreakdown: 0.69,
      songTranslation: 1.99,
      aiTeacher30min: 1.99,
      voiceClone: 4.99,
    },
  },
  africa: {
    region: "africa",
    regionName: "Africa Plan",
    currency: "USD",
    currencySymbol: "$",
    plans: {
      plus: { monthly: 1.49, yearly: 14.99 },
      pro: { monthly: 3.99, yearly: 39.99 },
      family: { monthly: 6.99, yearly: 69.99 },
    },
    creditPacks: { starter: 0.79, value: 1.99, pro: 5.99, mega: 11.99 },
    individualProducts: {
      callTranslatePerCall: 0.39,
      songBreakdown: 0.19,
      songTranslation: 0.79,
      aiTeacher30min: 0.79,
      voiceClone: 1.99,
    },
  },
  southeast_asia: {
    region: "southeast_asia",
    regionName: "Southeast Asia Plan",
    currency: "USD",
    currencySymbol: "$",
    plans: {
      plus: { monthly: 2.99, yearly: 29.99 },
      pro: { monthly: 5.99, yearly: 59.99 },
      family: { monthly: 9.99, yearly: 99.99 },
    },
    creditPacks: { starter: 1.49, value: 3.49, pro: 9.99, mega: 19.99 },
    individualProducts: {
      callTranslatePerCall: 0.69,
      songBreakdown: 0.39,
      songTranslation: 1.29,
      aiTeacher30min: 1.29,
      voiceClone: 3.49,
    },
  },
  south_asia: {
    region: "south_asia",
    regionName: "South Asia Plan",
    currency: "USD",
    currencySymbol: "$",
    plans: {
      plus: { monthly: 1.99, yearly: 19.99 },
      pro: { monthly: 4.99, yearly: 49.99 },
      family: { monthly: 7.99, yearly: 79.99 },
    },
    creditPacks: { starter: 0.99, value: 2.49, pro: 7.99, mega: 14.99 },
    individualProducts: {
      callTranslatePerCall: 0.49,
      songBreakdown: 0.29,
      songTranslation: 0.99,
      aiTeacher30min: 0.99,
      voiceClone: 2.99,
    },
  },
  middle_east: {
    region: "middle_east",
    regionName: "Middle East & North Africa Plan",
    currency: "USD",
    currencySymbol: "$",
    plans: {
      plus: { monthly: 3.99, yearly: 39.99 },
      pro: { monthly: 7.99, yearly: 79.99 },
      family: { monthly: 12.99, yearly: 129.99 },
    },
    creditPacks: { starter: 1.99, value: 4.99, pro: 14.99, mega: 29.99 },
    individualProducts: {
      callTranslatePerCall: 0.99,
      songBreakdown: 0.69,
      songTranslation: 1.99,
      aiTeacher30min: 1.99,
      voiceClone: 4.99,
    },
  },
};

// ─── DETECTION & RESOLUTION ──────────────────────────────────────────────────
const GEO_STORAGE_KEY = "@connectworld_geo_region";

/**
 * Detect user's pricing region from IP geolocation
 * Falls back to "standard" if detection fails
 */
export async function detectPricingRegion(): Promise<PricingRegion> {
  try {
    // Check cached region first
    const cached = await AsyncStorage.getItem(GEO_STORAGE_KEY);
    if (cached && cached in PRICING_TABLE) {
      return cached as PricingRegion;
    }

    // Use free IP geolocation API
    const response = await fetch("https://ipapi.co/json/", { 
      signal: AbortSignal.timeout(5000) 
    });
    
    if (!response.ok) return "standard";
    
    const data = await response.json();
    const countryCode = data.country_code?.toUpperCase();
    
    if (!countryCode) return "standard";
    
    const region = COUNTRY_REGION_MAP[countryCode] || "standard";
    
    // Cache the result
    await AsyncStorage.setItem(GEO_STORAGE_KEY, region);
    
    return region;
  } catch {
    return "standard";
  }
}

/**
 * Get pricing for a specific region
 */
export function getPricingForRegion(region: PricingRegion): RegionalPricing {
  return PRICING_TABLE[region];
}

/**
 * Get the user's current pricing (detect region + return prices)
 */
export async function getUserPricing(): Promise<RegionalPricing> {
  const region = await detectPricingRegion();
  return PRICING_TABLE[region];
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, pricing: RegionalPricing): string {
  return `${pricing.currencySymbol}${amount.toFixed(2)}`;
}

/**
 * Get discount percentage compared to standard pricing
 */
export function getDiscountPercentage(region: PricingRegion, plan: "plus" | "pro" | "family"): number {
  if (region === "standard") return 0;
  const standard = PRICING_TABLE.standard.plans[plan].monthly;
  const regional = PRICING_TABLE[region].plans[plan].monthly;
  return Math.round((1 - regional / standard) * 100);
}

/**
 * Check if user is in a discounted region
 */
export function isDiscountedRegion(region: PricingRegion): boolean {
  return region !== "standard";
}

/**
 * Get all available regions with their pricing summaries
 */
export function getAllRegionPricingSummary(): Array<{
  region: PricingRegion;
  name: string;
  plusMonthly: string;
  proMonthly: string;
  discount: number;
}> {
  return Object.entries(PRICING_TABLE).map(([key, pricing]) => ({
    region: key as PricingRegion,
    name: pricing.regionName,
    plusMonthly: `${pricing.currencySymbol}${pricing.plans.plus.monthly.toFixed(2)}`,
    proMonthly: `${pricing.currencySymbol}${pricing.plans.pro.monthly.toFixed(2)}`,
    discount: getDiscountPercentage(key as PricingRegion, "pro"),
  }));
}

/**
 * Get the country code to region mapping (for admin/debugging)
 */
export function getCountryRegionMap(): Record<string, PricingRegion> {
  return { ...COUNTRY_REGION_MAP };
}

/**
 * Override the detected region (for testing or manual selection)
 */
export async function overridePricingRegion(region: PricingRegion): Promise<void> {
  await AsyncStorage.setItem(GEO_STORAGE_KEY, region);
}

/**
 * Clear cached region (force re-detection)
 */
export async function clearCachedRegion(): Promise<void> {
  await AsyncStorage.removeItem(GEO_STORAGE_KEY);
}

// ─── CARIBBEAN PLAN MARKETING ────────────────────────────────────────────────
/**
 * Marketing copy for the Caribbean Plan — used in promotions by creators like Omar
 */
export const CARIBBEAN_PLAN_MARKETING = {
  headline: "ConnectWorld AI — Ahora para el Caribe",
  subheadline: "Aprende inglés con IA por solo $2.99/mes",
  bulletPoints: [
    "Traducción en tiempo real de llamadas",
    "Profesores de IA que hablan tu dialecto",
    "Canciones traducidas con pronunciación",
    "Slang dominicano, jamaiquino, haitiano y más",
    "Clases virtuales ilimitadas",
  ],
  ctaText: "Empieza Gratis",
  promoCode: "CARIBE2026",
  promoDiscount: "15% off first 3 months",
  creatorMessage: "Usa mi código para 15% de descuento los primeros 3 meses",
};

/**
 * Pricing comparison for creator promotions
 * Shows how ConnectWorld AI compares to competitors in the Caribbean market
 */
export const CARIBBEAN_PRICE_COMPARISON = {
  connectworldAI: { name: "ConnectWorld AI", price: "$2.99/mo", features: "AI teachers + live translation + songs + slang" },
  duolingo: { name: "Duolingo Plus", price: "$6.99/mo", features: "Gamified lessons (no slang, no calls, no translation)" },
  babbel: { name: "Babbel", price: "$13.95/mo", features: "Structured courses (no AI, no live features)" },
  inglesConOmar: { name: "Inglés con Omar", price: "$5.09/mo", features: "TikTok sub-only stories + subscriber room" },
  rosettaStone: { name: "Rosetta Stone", price: "$11.99/mo", features: "Immersion method (no slang, no modern content)" },
};

// ─── PROFIT-LOCK GUARD SYSTEM ────────────────────────────────────────────────
// Rule: We NEVER go red. Even with affiliates, promos, and lowest-tier pricing,
// every transaction must maintain minimum 40% profit margin.

export type CostTier = "premium" | "standard" | "lite" | "ultra_lite";

export interface ServiceCosts {
  aiComputePerMinute: number;    // Cost per minute of AI conversation
  ttsPerMinute: number;          // Text-to-speech cost per minute
  translationPerMinute: number;  // Live translation cost per minute
  videoStreamPerMinute: number;  // Video delivery cost per minute
  storagePerGbMonth: number;     // Storage cost
  cdnPerGbTransfer: number;      // Content delivery cost
}

/**
 * Cost tiers — cheaper regions get lighter (cheaper) AI models and delivery
 */
export const SERVICE_COST_TIERS: Record<CostTier, ServiceCosts> = {
  premium: {
    aiComputePerMinute: 0.005,     // GPT-4 level
    ttsPerMinute: 0.008,           // ElevenLabs HD
    translationPerMinute: 0.012,   // Real-time high quality
    videoStreamPerMinute: 0.002,   // HD streaming
    storagePerGbMonth: 0.023,
    cdnPerGbTransfer: 0.085,
  },
  standard: {
    aiComputePerMinute: 0.002,     // GPT-4-mini level
    ttsPerMinute: 0.004,           // Standard TTS
    translationPerMinute: 0.006,   // Standard quality
    videoStreamPerMinute: 0.001,   // SD streaming
    storagePerGbMonth: 0.023,
    cdnPerGbTransfer: 0.045,
  },
  lite: {
    aiComputePerMinute: 0.001,     // GPT-3.5 level
    ttsPerMinute: 0.002,           // Basic TTS
    translationPerMinute: 0.003,   // Cached/batch translation
    videoStreamPerMinute: 0.0005,  // Pre-downloaded SD
    storagePerGbMonth: 0.023,
    cdnPerGbTransfer: 0.02,
  },
  ultra_lite: {
    aiComputePerMinute: 0.0005,    // Smallest model
    ttsPerMinute: 0.001,           // Device-local TTS
    translationPerMinute: 0.002,   // Pre-cached only
    videoStreamPerMinute: 0.0003,  // Compressed pre-download
    storagePerGbMonth: 0.023,
    cdnPerGbTransfer: 0.01,
  },
};

/**
 * Map pricing regions to cost tiers
 * Cheaper regions get lighter AI to maintain margins
 */
export const REGION_COST_TIER: Record<PricingRegion, CostTier> = {
  standard: "premium",
  caribbean: "lite",
  central_america: "lite",
  south_america: "standard",
  africa: "ultra_lite",
  southeast_asia: "lite",
  south_asia: "lite",
  middle_east: "standard",
};

/**
 * Usage caps per region — cheaper regions get fewer real-time minutes
 * but SAME pre-made content (videos, clips, lessons)
 */
export interface RegionUsageCaps {
  aiTeacherMinutesPerMonth: number;
  liveTranslationMinutesPerMonth: number;
  songsPerWeek: number;
  videoCallMinutesPerMonth: number;
  preGeneratedContentAccess: "unlimited"; // Always unlimited — near-zero cost
  adsLevel: "none" | "light" | "medium";
}

export const REGION_USAGE_CAPS: Record<PricingRegion, Record<"plus" | "pro" | "family", RegionUsageCaps>> = {
  standard: {
    plus: { aiTeacherMinutesPerMonth: 60, liveTranslationMinutesPerMonth: 30, songsPerWeek: 10, videoCallMinutesPerMonth: 30, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
    pro: { aiTeacherMinutesPerMonth: 300, liveTranslationMinutesPerMonth: 120, songsPerWeek: 50, videoCallMinutesPerMonth: 120, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
    family: { aiTeacherMinutesPerMonth: 500, liveTranslationMinutesPerMonth: 200, songsPerWeek: 100, videoCallMinutesPerMonth: 200, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
  },
  caribbean: {
    plus: { aiTeacherMinutesPerMonth: 30, liveTranslationMinutesPerMonth: 10, songsPerWeek: 5, videoCallMinutesPerMonth: 10, preGeneratedContentAccess: "unlimited", adsLevel: "light" },
    pro: { aiTeacherMinutesPerMonth: 120, liveTranslationMinutesPerMonth: 45, songsPerWeek: 20, videoCallMinutesPerMonth: 45, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
    family: { aiTeacherMinutesPerMonth: 200, liveTranslationMinutesPerMonth: 75, songsPerWeek: 40, videoCallMinutesPerMonth: 75, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
  },
  central_america: {
    plus: { aiTeacherMinutesPerMonth: 30, liveTranslationMinutesPerMonth: 10, songsPerWeek: 5, videoCallMinutesPerMonth: 10, preGeneratedContentAccess: "unlimited", adsLevel: "light" },
    pro: { aiTeacherMinutesPerMonth: 120, liveTranslationMinutesPerMonth: 45, songsPerWeek: 20, videoCallMinutesPerMonth: 45, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
    family: { aiTeacherMinutesPerMonth: 200, liveTranslationMinutesPerMonth: 75, songsPerWeek: 40, videoCallMinutesPerMonth: 75, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
  },
  south_america: {
    plus: { aiTeacherMinutesPerMonth: 45, liveTranslationMinutesPerMonth: 15, songsPerWeek: 7, videoCallMinutesPerMonth: 15, preGeneratedContentAccess: "unlimited", adsLevel: "light" },
    pro: { aiTeacherMinutesPerMonth: 180, liveTranslationMinutesPerMonth: 60, songsPerWeek: 30, videoCallMinutesPerMonth: 60, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
    family: { aiTeacherMinutesPerMonth: 300, liveTranslationMinutesPerMonth: 100, songsPerWeek: 60, videoCallMinutesPerMonth: 100, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
  },
  africa: {
    plus: { aiTeacherMinutesPerMonth: 15, liveTranslationMinutesPerMonth: 5, songsPerWeek: 3, videoCallMinutesPerMonth: 5, preGeneratedContentAccess: "unlimited", adsLevel: "medium" },
    pro: { aiTeacherMinutesPerMonth: 60, liveTranslationMinutesPerMonth: 20, songsPerWeek: 10, videoCallMinutesPerMonth: 20, preGeneratedContentAccess: "unlimited", adsLevel: "light" },
    family: { aiTeacherMinutesPerMonth: 100, liveTranslationMinutesPerMonth: 35, songsPerWeek: 20, videoCallMinutesPerMonth: 35, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
  },
  southeast_asia: {
    plus: { aiTeacherMinutesPerMonth: 30, liveTranslationMinutesPerMonth: 10, songsPerWeek: 5, videoCallMinutesPerMonth: 10, preGeneratedContentAccess: "unlimited", adsLevel: "light" },
    pro: { aiTeacherMinutesPerMonth: 120, liveTranslationMinutesPerMonth: 45, songsPerWeek: 20, videoCallMinutesPerMonth: 45, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
    family: { aiTeacherMinutesPerMonth: 200, liveTranslationMinutesPerMonth: 75, songsPerWeek: 40, videoCallMinutesPerMonth: 75, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
  },
  south_asia: {
    plus: { aiTeacherMinutesPerMonth: 20, liveTranslationMinutesPerMonth: 7, songsPerWeek: 4, videoCallMinutesPerMonth: 7, preGeneratedContentAccess: "unlimited", adsLevel: "medium" },
    pro: { aiTeacherMinutesPerMonth: 90, liveTranslationMinutesPerMonth: 30, songsPerWeek: 15, videoCallMinutesPerMonth: 30, preGeneratedContentAccess: "unlimited", adsLevel: "light" },
    family: { aiTeacherMinutesPerMonth: 150, liveTranslationMinutesPerMonth: 50, songsPerWeek: 30, videoCallMinutesPerMonth: 50, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
  },
  middle_east: {
    plus: { aiTeacherMinutesPerMonth: 45, liveTranslationMinutesPerMonth: 15, songsPerWeek: 7, videoCallMinutesPerMonth: 15, preGeneratedContentAccess: "unlimited", adsLevel: "light" },
    pro: { aiTeacherMinutesPerMonth: 180, liveTranslationMinutesPerMonth: 60, songsPerWeek: 30, videoCallMinutesPerMonth: 60, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
    family: { aiTeacherMinutesPerMonth: 300, liveTranslationMinutesPerMonth: 100, songsPerWeek: 60, videoCallMinutesPerMonth: 100, preGeneratedContentAccess: "unlimited", adsLevel: "none" },
  },
};

// ─── PROFIT-LOCK CALCULATOR ──────────────────────────────────────────────────

export interface ProfitCalculation {
  subscriptionPrice: number;
  promoDiscount: number;
  userPays: number;
  storeCut: number;        // Apple/Google 30% (Year 1) or 15% (Year 2+)
  revenueToUs: number;
  affiliateCommission: number;
  estimatedMonthlyCost: number;
  netProfit: number;
  profitMargin: number;    // percentage
  isGreen: boolean;        // true = profitable, false = would go red
  adjustmentNeeded: string | null; // what to change if red
}

/**
 * PROFIT-LOCK GUARD: Calculate whether a pricing scenario is profitable.
 * If it would go red, returns what adjustment is needed.
 * 
 * Rule: Net profit margin must ALWAYS be >= 40% of revenueToUs.
 * This applies to EVERY combination of:
 *   - Any region's price
 *   - Any promo discount
 *   - Any affiliate commission rate
 *   - Any usage pattern
 * 
 * If violated, the system auto-suggests adjustments.
 */
export function calculateProfitLock(params: {
  region: PricingRegion;
  plan: "plus" | "pro" | "family";
  promoDiscountPercent: number;      // 0-50%
  affiliateCommissionPercent: number; // 0-30%
  isFirstMonth: boolean;
  storeYear: 1 | 2;                 // Year 1 = 30% cut, Year 2+ = 15%
}): ProfitCalculation {
  const { region, plan, promoDiscountPercent, affiliateCommissionPercent, isFirstMonth, storeYear } = params;
  
  const pricing = PRICING_TABLE[region];
  const subscriptionPrice = pricing.plans[plan].monthly;
  
  // Apply promo discount
  const promoDiscount = subscriptionPrice * (promoDiscountPercent / 100);
  const userPays = subscriptionPrice - promoDiscount;
  
  // Apple/Google store cut
  const storeCutRate = storeYear === 1 ? 0.30 : 0.15;
  const storeCut = userPays * storeCutRate;
  const revenueToUs = userPays - storeCut;
  
  // Affiliate commission (on revenue to us, not on user's payment)
  const affiliateCommission = revenueToUs * (affiliateCommissionPercent / 100);
  
  // Estimate monthly serving cost based on region's cost tier and usage caps
  const costTier = REGION_COST_TIER[region];
  const costs = SERVICE_COST_TIERS[costTier];
  const caps = REGION_USAGE_CAPS[region][plan];
  
  // Estimate: assume user uses 60% of their caps on average
  const avgUsageRate = 0.6;
  const estimatedMonthlyCost = 
    (caps.aiTeacherMinutesPerMonth * avgUsageRate * costs.aiComputePerMinute) +
    (caps.liveTranslationMinutesPerMonth * avgUsageRate * costs.translationPerMinute) +
    (caps.songsPerWeek * 4 * avgUsageRate * 0.01) + // ~$0.01 per song translation
    (caps.videoCallMinutesPerMonth * avgUsageRate * costs.videoStreamPerMinute) +
    0.03; // base server/storage overhead
  
  // Net profit
  const netProfit = revenueToUs - affiliateCommission - estimatedMonthlyCost;
  const profitMargin = revenueToUs > 0 ? (netProfit / revenueToUs) * 100 : 0;
  
  // Minimum margin threshold
  const MIN_MARGIN = 40; // 40% minimum
  const isGreen = profitMargin >= MIN_MARGIN;
  
  // Determine adjustment if red
  let adjustmentNeeded: string | null = null;
  if (!isGreen) {
    if (affiliateCommissionPercent > 15) {
      adjustmentNeeded = `Reduce affiliate commission from ${affiliateCommissionPercent}% to ${Math.floor(MIN_MARGIN - (100 - profitMargin))}%`;
    } else if (promoDiscountPercent > 10) {
      adjustmentNeeded = `Reduce promo discount from ${promoDiscountPercent}% to ${Math.max(0, promoDiscountPercent - 5)}%`;
    } else {
      adjustmentNeeded = `Tighten usage caps for ${region}/${plan} or add ads to offset`;
    }
  }
  
  return {
    subscriptionPrice,
    promoDiscount,
    userPays,
    storeCut,
    revenueToUs,
    affiliateCommission,
    estimatedMonthlyCost,
    netProfit,
    profitMargin: Math.round(profitMargin * 10) / 10,
    isGreen,
    adjustmentNeeded,
  };
}

/**
 * Validate an entire pricing scenario before it goes live.
 * Checks ALL combinations and returns any that would go red.
 */
export function validatePricingScenario(params: {
  region: PricingRegion;
  maxPromoDiscount: number;
  maxAffiliateCommission: number;
}): { allGreen: boolean; redScenarios: ProfitCalculation[] } {
  const { region, maxPromoDiscount, maxAffiliateCommission } = params;
  const redScenarios: ProfitCalculation[] = [];
  
  const plans: Array<"plus" | "pro" | "family"> = ["plus", "pro", "family"];
  
  for (const plan of plans) {
    // Check worst case: max promo + max commission + Year 1 store cut
    const worstCase = calculateProfitLock({
      region,
      plan,
      promoDiscountPercent: maxPromoDiscount,
      affiliateCommissionPercent: maxAffiliateCommission,
      isFirstMonth: true,
      storeYear: 1,
    });
    
    if (!worstCase.isGreen) {
      redScenarios.push(worstCase);
    }
  }
  
  return {
    allGreen: redScenarios.length === 0,
    redScenarios,
  };
}

/**
 * Auto-adjust pricing/caps to ensure profitability.
 * Called when a new price or commission is proposed.
 * Returns the maximum safe values.
 */
export function getMaxSafeCommission(params: {
  region: PricingRegion;
  plan: "plus" | "pro" | "family";
  promoDiscountPercent: number;
}): { maxCommission: number; maxPromoDiscount: number } {
  const { region, plan, promoDiscountPercent } = params;
  
  // Binary search for max commission that stays green
  let maxCommission = 30;
  while (maxCommission > 0) {
    const result = calculateProfitLock({
      region,
      plan,
      promoDiscountPercent,
      affiliateCommissionPercent: maxCommission,
      isFirstMonth: true,
      storeYear: 1,
    });
    if (result.isGreen) break;
    maxCommission -= 1;
  }
  
  // Binary search for max promo discount
  let maxPromo = 50;
  while (maxPromo > 0) {
    const result = calculateProfitLock({
      region,
      plan,
      promoDiscountPercent: maxPromo,
      affiliateCommissionPercent: 25, // assume featured teacher rate
      isFirstMonth: true,
      storeYear: 1,
    });
    if (result.isGreen) break;
    maxPromo -= 1;
  }
  
  return { maxCommission, maxPromoDiscount: maxPromo };
}
