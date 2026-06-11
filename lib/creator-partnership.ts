/**
 * Creator Partnership & Affiliate System for ConnectWorld AI
 * 
 * This system manages relationships with language teaching creators like
 * @inglesconomar (2.1M followers) who can promote ConnectWorld AI to their
 * existing audience in exchange for revenue share.
 * 
 * The system is designed to be BETTER than TikTok's native subscription
 * (Omar only has 8 subscribers at $5.09/mo on TikTok) by offering:
 * 
 * 1. Higher conversion (our app is the product, not just "sub-only stories")
 * 2. Revenue share on ALL subscribers they bring (not just TikTok subs)
 * 3. Creator dashboard with real analytics
 * 4. Their voice/avatar inside the app (builds their brand)
 * 5. Cross-platform promotion (not locked to TikTok)
 * 
 * Commission Structure (protects profit per knowledge base):
 * - Tier 1: 20% of first subscription month from direct referrals
 * - Tier 2: 5% of months 2-12 from retained subscribers
 * - Bonus: $1 per free-to-paid conversion in their region
 * - Cap: Commission never exceeds 25% of revenue per user (profit protection)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type PartnerTier = "affiliate" | "ambassador" | "featured_teacher" | "co_creator";

export type PartnerStatus = "applied" | "reviewing" | "approved" | "active" | "paused" | "terminated";

export type ContentRights = "exclusive" | "non_exclusive" | "co_owned";

export interface CreatorPartner {
  id: string;
  
  // Identity
  name: string;
  displayName: string;
  email: string;
  phone?: string;
  country: string;
  city?: string;
  languages: { speaks: string[]; teaches: string[] };
  
  // Social presence
  platforms: Array<{
    platform: "tiktok" | "instagram" | "youtube" | "facebook" | "twitter";
    handle: string;
    followers: number;
    engagement_rate: number; // percentage
    url: string;
    verified: boolean;
  }>;
  totalReach: number; // combined followers across platforms
  
  // Partnership details
  tier: PartnerTier;
  status: PartnerStatus;
  joinedAt: string;
  approvedAt?: string;
  
  // Commission structure
  commission: {
    tier1Rate: number;    // % of first month (default 20%)
    tier2Rate: number;    // % of months 2-12 (default 5%)
    conversionBonus: number; // $ per free-to-paid conversion
    maxCommissionCap: number; // max % of revenue per user (default 25%)
    customRate?: number;  // override for high-value partners
  };
  
  // Promo tools
  promoCode: string;       // unique code (e.g., "OMAR2026")
  referralLink: string;    // connectworldai.com/ref/omar
  qrCodeUrl: string;       // QR code image URL
  deepLinkScheme: string;  // app deep link with attribution
  
  // Performance
  stats: {
    totalReferrals: number;
    activeSubscribers: number;
    totalRevenue: number;
    totalCommissionEarned: number;
    totalCommissionPaid: number;
    pendingPayout: number;
    conversionRate: number; // % of referrals that subscribe
    retentionRate: number;  // % still subscribed after 3 months
    avgSubscriberLTV: number; // lifetime value of their referrals
  };
  
  // Content integration
  hasAvatarInApp: boolean;
  avatarId?: string;
  voiceCloneId?: string;
  contentRights: ContentRights;
  
  // Payout
  payoutMethod: "paypal" | "bank_transfer" | "crypto" | "mobile_money";
  payoutDetails?: Record<string, string>;
  payoutSchedule: "weekly" | "biweekly" | "monthly";
  minimumPayout: number; // minimum $ before payout triggers
}

export interface AffiliateApplication {
  id: string;
  name: string;
  email: string;
  country: string;
  platforms: Array<{
    platform: string;
    handle: string;
    followers: number;
    url: string;
  }>;
  teachingExperience: string;
  languagesTeaching: string[];
  whyPartner: string;
  contentSamples: string[]; // URLs to their best content
  expectedMonthlyContent: number;
  submittedAt: string;
  status: PartnerStatus;
  reviewNotes?: string;
}

export interface ReferralEvent {
  id: string;
  partnerId: string;
  userId: string;
  event: "click" | "install" | "signup" | "free_trial" | "subscription" | "renewal" | "churn";
  timestamp: string;
  metadata: {
    platform?: string;
    promoCode?: string;
    subscriptionTier?: string;
    amount?: number;
    commission?: number;
  };
}

// ─── TARGET PARTNERS (DR MARKET) ─────────────────────────────────────────────

/**
 * Priority target partners for the Dominican Republic / Caribbean market
 * These are creators we want to approach for partnership
 */
export const TARGET_PARTNERS: Array<{
  name: string;
  handle: string;
  platform: string;
  followers: number;
  niche: string;
  country: string;
  website?: string;
  notes: string;
  priority: "high" | "medium" | "low";
  proposedTier: PartnerTier;
  proposedCommission: number;
}> = [
  {
    name: "Inglés con Omar",
    handle: "@inglesconomar",
    platform: "tiktok",
    followers: 2_100_000,
    niche: "Teaching English to Spanish speakers (DR-based)",
    country: "DO",
    website: "www.inglesconomar.com",
    notes: "2.1M followers, 16M likes. Has TikTok subscription ($5.09/mo) but only 8 subscribers — clearly the subscription model isn't working for him on TikTok. His content format (word cards, phonetic pronunciation, Spider-Man memes for confusing words) is exactly what we replicate with AI. Partnership would give him: better monetization than TikTok subs, his voice/avatar in our app, revenue share on all subscribers from DR. He already has a website membership (Membresía Bilingüe) and Curso Básico. We offer him a better platform than his own website.",
    priority: "high",
    proposedTier: "featured_teacher",
    proposedCommission: 25, // Higher for first major partner
  },
  {
    name: "BilingueBlogs",
    handle: "@bilingueblogs",
    platform: "instagram",
    followers: 500_000,
    niche: "Spanish dialects and accents education",
    country: "US",
    website: "https://www.instagram.com/bilingueblogs",
    notes: "Great source for dialect content. Already identified as LLM training source. Could be both content source AND affiliate partner.",
    priority: "high",
    proposedTier: "ambassador",
    proposedCommission: 20,
  },
  {
    name: "Randy Cruz",
    handle: "@randycruzc",
    platform: "tiktok",
    followers: 800_000,
    niche: "Dominican culture and language",
    country: "DO",
    notes: "Already tracked in TikTok ingestion system. Dominican content creator with strong engagement.",
    priority: "medium",
    proposedTier: "affiliate",
    proposedCommission: 20,
  },
  {
    name: "Yaismar",
    handle: "@yaismar_21",
    platform: "tiktok",
    followers: 600_000,
    niche: "Dominican lifestyle and language",
    country: "DO",
    notes: "Already tracked in TikTok ingestion system. Female Dominican creator — adds diversity to our partner roster.",
    priority: "medium",
    proposedTier: "affiliate",
    proposedCommission: 20,
  },
];

// ─── PARTNERSHIP TIERS EXPLAINED ─────────────────────────────────────────────

export const PARTNER_TIER_DETAILS: Record<PartnerTier, {
  name: string;
  requirements: string[];
  benefits: string[];
  commission: { tier1: number; tier2: number; bonus: number };
  contentExpectation: string;
}> = {
  affiliate: {
    name: "Affiliate Partner",
    requirements: [
      "1,000+ followers on any platform",
      "Language teaching or education content",
      "Consistent posting (3+ times/week)",
    ],
    benefits: [
      "Unique referral link and promo code",
      "20% commission on first month of referrals",
      "5% recurring for months 2-12",
      "$1 bonus per free-to-paid conversion",
      "Monthly performance reports",
      "Promotional assets (banners, scripts, captions)",
    ],
    commission: { tier1: 20, tier2: 5, bonus: 1 },
    contentExpectation: "Mention ConnectWorld AI 2-4 times per month in organic content",
  },
  ambassador: {
    name: "Brand Ambassador",
    requirements: [
      "50,000+ followers on primary platform",
      "Proven engagement rate (3%+)",
      "Active language teaching community",
      "Consistent content quality",
    ],
    benefits: [
      "Everything in Affiliate, plus:",
      "Custom landing page (connectworldai.com/ref/[name])",
      "Early access to new features",
      "Direct Slack/WhatsApp channel with our team",
      "Co-branded content opportunities",
      "Free Pro subscription for life",
      "Invite to creator events",
    ],
    commission: { tier1: 22, tier2: 7, bonus: 1.5 },
    contentExpectation: "Dedicated ConnectWorld AI content 4-8 times per month",
  },
  featured_teacher: {
    name: "Featured Teacher",
    requirements: [
      "500,000+ followers OR proven teaching expertise",
      "Willing to have voice/avatar in the app",
      "Consistent content schedule",
      "Alignment with ConnectWorld AI values",
    ],
    benefits: [
      "Everything in Ambassador, plus:",
      "Your AI avatar teaches inside ConnectWorld AI",
      "Your voice cloned (with consent) for lessons",
      "Revenue share on ALL content your avatar generates",
      "Featured placement in app (Teacher tab, Home screen)",
      "Co-created curriculum with your methodology",
      "Monthly guaranteed minimum payment",
      "Annual contract with renewal bonus",
    ],
    commission: { tier1: 25, tier2: 10, bonus: 2 },
    contentExpectation: "Weekly dedicated content + monthly live sessions promoting ConnectWorld AI",
  },
  co_creator: {
    name: "Co-Creator Partner",
    requirements: [
      "1,000,000+ followers",
      "Established brand and audience",
      "Willing to co-develop features",
      "Long-term commitment (12+ months)",
    ],
    benefits: [
      "Everything in Featured Teacher, plus:",
      "Equity/revenue share in specific market (e.g., 'ConnectWorld AI Dominican Republic')",
      "Co-branding opportunities",
      "Input on product roadmap for their market",
      "Custom features built for their audience",
      "Guaranteed minimum monthly revenue",
      "Exclusive territory rights",
    ],
    commission: { tier1: 30, tier2: 15, bonus: 3 },
    contentExpectation: "Full integration — their brand promotes ConnectWorld AI as primary recommendation",
  },
};

// ─── PROMO CODE SYSTEM ───────────────────────────────────────────────────────

export interface PromoCode {
  code: string;
  partnerId: string;
  discountType: "percentage" | "fixed" | "trial_extension";
  discountValue: number; // % or $ or days
  validFrom: string;
  validUntil: string;
  maxUses: number;
  currentUses: number;
  applicableTiers: string[]; // which subscription tiers it works on
  region?: string; // restrict to specific region
}

/**
 * Generate a promo code for a partner
 */
export function generatePromoCode(partner: CreatorPartner): PromoCode {
  const code = partner.displayName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) + "2026";
  
  return {
    code,
    partnerId: partner.id,
    discountType: "percentage",
    discountValue: 15, // 15% off first 3 months
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    maxUses: 100000,
    currentUses: 0,
    applicableTiers: ["plus", "pro", "family"],
    region: partner.country === "DO" ? "caribbean" : undefined,
  };
}

// ─── REFERRAL TRACKING ───────────────────────────────────────────────────────

const REFERRAL_STORAGE_KEY = "@connectworld_referral_source";

/**
 * Store referral attribution when user installs via partner link
 */
export async function storeReferralAttribution(partnerId: string, promoCode?: string): Promise<void> {
  await AsyncStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify({
    partnerId,
    promoCode,
    timestamp: new Date().toISOString(),
    source: "deep_link",
  }));
}

/**
 * Get stored referral attribution
 */
export async function getReferralAttribution(): Promise<{
  partnerId: string;
  promoCode?: string;
  timestamp: string;
  source: string;
} | null> {
  const stored = await AsyncStorage.getItem(REFERRAL_STORAGE_KEY);
  if (!stored) return null;
  return JSON.parse(stored);
}

// ─── COMMISSION CALCULATOR ───────────────────────────────────────────────────

/**
 * Calculate commission for a referral event
 * Ensures profit protection: commission never exceeds maxCommissionCap
 */
export function calculateCommission(
  partner: CreatorPartner,
  event: "first_month" | "renewal" | "conversion",
  subscriptionAmount: number,
): { commission: number; capped: boolean } {
  let rawCommission = 0;
  
  switch (event) {
    case "first_month":
      rawCommission = subscriptionAmount * (partner.commission.tier1Rate / 100);
      break;
    case "renewal":
      rawCommission = subscriptionAmount * (partner.commission.tier2Rate / 100);
      break;
    case "conversion":
      rawCommission = partner.commission.conversionBonus;
      break;
  }
  
  // Apply cap (profit protection)
  const maxAllowed = subscriptionAmount * (partner.commission.maxCommissionCap / 100);
  const capped = rawCommission > maxAllowed;
  const finalCommission = Math.min(rawCommission, maxAllowed);
  
  return { commission: finalCommission, capped };
}

// ─── OUTREACH TEMPLATES ──────────────────────────────────────────────────────

/**
 * DM/Email templates for reaching out to potential partners
 */
export const OUTREACH_TEMPLATES = {
  tiktok_dm_english: (creatorName: string) => `
Hey ${creatorName}! 👋

I'm reaching out from ConnectWorld AI — we're building the world's first AI language learning app that teaches REAL language (slang, dialects, pronunciation) not textbook stuff.

We've been watching your content and love your teaching style. We'd like to offer you a partnership:

✅ 20-25% revenue share on every subscriber you bring
✅ Your voice/avatar teaching inside our app (millions of potential students)
✅ Better than TikTok subscriptions (we've seen creators struggle with low sub counts there)
✅ Custom promo code for your audience
✅ Free Pro access for life

Our app launches with Caribbean pricing ($2.99/mo) so your audience can actually afford it.

Interested? Let's chat! 🤝
  `.trim(),

  tiktok_dm_spanish: (creatorName: string) => `
¡Hola ${creatorName}! 👋

Te escribo de ConnectWorld AI — estamos construyendo la primera app de idiomas con IA que enseña el idioma REAL (jerga, dialectos, pronunciación), no lo del libro de texto.

Hemos visto tu contenido y nos encanta tu estilo de enseñanza. Queremos ofrecerte una asociación:

✅ 20-25% de comisión por cada suscriptor que traigas
✅ Tu voz/avatar enseñando dentro de nuestra app (millones de estudiantes potenciales)
✅ Mejor que las suscripciones de TikTok
✅ Código promocional personalizado para tu audiencia
✅ Acceso Pro gratis de por vida

Nuestra app tiene precios para el Caribe ($2.99/mes) para que tu audiencia pueda pagarlo.

¿Te interesa? ¡Hablemos! 🤝
  `.trim(),

  email_formal: (creatorName: string, platform: string, followers: number) => `
Subject: Partnership Opportunity — ConnectWorld AI × ${creatorName}

Hi ${creatorName},

I hope this message finds you well. My name is [Name] from ConnectWorld AI, an AI-powered language learning platform launching in 2026.

We've been following your incredible work on ${platform} (${followers.toLocaleString()} followers!) and believe there's a strong alignment between your audience and our product.

ConnectWorld AI teaches real-world language — regional slang, authentic pronunciation, and cultural context — exactly the kind of content your audience loves.

We'd like to propose a Featured Teacher partnership:

• Revenue Share: 25% on first month + 10% recurring for 12 months
• Your Avatar: AI version of you teaching inside our app
• Regional Pricing: $2.99/mo for Caribbean users (your audience can afford it)
• Promo Code: Custom code with 15% discount for your followers
• Guaranteed Minimum: Monthly minimum payment regardless of performance

For context, our competitors charge $6.99-$13.95/mo and don't offer regional dialects. We believe your endorsement could drive significant adoption in the Dominican/Caribbean market.

Would you be open to a 15-minute call this week to discuss?

Best regards,
[Name]
ConnectWorld AI
  `.trim(),
};

// ─── CREATOR DASHBOARD DATA ──────────────────────────────────────────────────

export interface CreatorDashboardData {
  partner: CreatorPartner;
  recentReferrals: ReferralEvent[];
  monthlyStats: {
    month: string;
    referrals: number;
    conversions: number;
    revenue: number;
    commission: number;
  }[];
  topContent: Array<{
    platform: string;
    url: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  nextPayout: {
    amount: number;
    date: string;
    method: string;
  };
  leaderboard: Array<{
    rank: number;
    name: string;
    referrals: number;
    isCurrentUser: boolean;
  }>;
}

/**
 * Get mock dashboard data for a partner (will be replaced with real API)
 */
export function getCreatorDashboardData(partnerId: string): CreatorDashboardData {
  // This will be replaced with real tRPC endpoint
  return {
    partner: {
      id: partnerId,
      name: "Inglés con Omar",
      displayName: "Omar",
      email: "omar@inglesconomar.com",
      country: "DO",
      languages: { speaks: ["es"], teaches: ["en"] },
      platforms: [
        { platform: "tiktok", handle: "@inglesconomar", followers: 2100000, engagement_rate: 4.2, url: "https://tiktok.com/@inglesconomar", verified: true },
      ],
      totalReach: 2100000,
      tier: "featured_teacher",
      status: "active",
      joinedAt: "2026-06-01T00:00:00Z",
      commission: { tier1Rate: 25, tier2Rate: 10, conversionBonus: 2, maxCommissionCap: 25 },
      promoCode: "OMAR2026",
      referralLink: "https://connectworldai.com/ref/omar",
      qrCodeUrl: "",
      deepLinkScheme: "connectworldai://ref/omar",
      stats: {
        totalReferrals: 0,
        activeSubscribers: 0,
        totalRevenue: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        pendingPayout: 0,
        conversionRate: 0,
        retentionRate: 0,
        avgSubscriberLTV: 0,
      },
      hasAvatarInApp: false,
      contentRights: "non_exclusive",
      payoutMethod: "bank_transfer",
      payoutSchedule: "monthly",
      minimumPayout: 50,
    },
    recentReferrals: [],
    monthlyStats: [],
    topContent: [],
    nextPayout: { amount: 0, date: "2026-07-01", method: "bank_transfer" },
    leaderboard: [],
  };
}

// ─── WHY THIS IS BETTER THAN TIKTOK SUBSCRIPTIONS ────────────────────────────

/**
 * Comparison: ConnectWorld AI Partnership vs TikTok Subscription
 * 
 * Omar's TikTok Subscription:
 * - Price: $5.09/mo (discounted from $5.99)
 * - Subscribers: 8 (yes, only 8)
 * - Monthly revenue: ~$40 (TikTok takes 50% → $20 to Omar)
 * - Features: Sub-only stories, subscriber room, notes, 6 stickers, badge
 * - Problem: His 2.1M followers don't see value in paying for "stories"
 * 
 * ConnectWorld AI Featured Teacher Partnership:
 * - His audience pays: $2.99/mo (Caribbean pricing — affordable!)
 * - If 1% of his 2.1M followers subscribe: 21,000 subscribers
 * - Monthly revenue from his referrals: $41,790
 * - His commission (25% first month): $10,447
 * - His commission (10% recurring): $4,179/month ongoing
 * - PLUS: His avatar teaches inside the app (builds his brand)
 * - PLUS: He keeps his TikTok/website (non-exclusive)
 * 
 * Even at 0.1% conversion (2,100 subs):
 * - Monthly revenue: $4,179
 * - His commission: $1,044 first month, $417/month ongoing
 * - Still 20x more than his current TikTok subscription revenue
 */
export const PARTNERSHIP_VALUE_PROPOSITION = {
  currentTikTokRevenue: {
    subscribers: 8,
    pricePerMonth: 5.09,
    tiktokCut: 0.5,
    creatorRevenue: 8 * 5.09 * 0.5, // ~$20/month
  },
  connectworldProjection_conservative: {
    conversionRate: 0.001, // 0.1% of followers
    followers: 2_100_000,
    expectedSubscribers: 2_100,
    pricePerMonth: 2.99,
    monthlyRevenue: 2_100 * 2.99,
    creatorCommissionFirstMonth: 2_100 * 2.99 * 0.25,
    creatorCommissionRecurring: 2_100 * 2.99 * 0.10,
  },
  connectworldProjection_moderate: {
    conversionRate: 0.005, // 0.5% of followers
    followers: 2_100_000,
    expectedSubscribers: 10_500,
    pricePerMonth: 2.99,
    monthlyRevenue: 10_500 * 2.99,
    creatorCommissionFirstMonth: 10_500 * 2.99 * 0.25,
    creatorCommissionRecurring: 10_500 * 2.99 * 0.10,
  },
  connectworldProjection_optimistic: {
    conversionRate: 0.01, // 1% of followers
    followers: 2_100_000,
    expectedSubscribers: 21_000,
    pricePerMonth: 2.99,
    monthlyRevenue: 21_000 * 2.99,
    creatorCommissionFirstMonth: 21_000 * 2.99 * 0.25,
    creatorCommissionRecurring: 21_000 * 2.99 * 0.10,
  },
};
