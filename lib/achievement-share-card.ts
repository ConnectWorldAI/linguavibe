/**
 * Achievement Share Card Generator
 * 
 * Generates shareable image-style data for gold/diamond achievements
 * that users can post to social media. Uses React Native's Share API
 * with a formatted message + deep link.
 */
import { Share, Platform } from "react-native";
import type { AchievementUnlockEvent } from "@/lib/achievement-unlock";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShareCardData {
  title: string;
  description: string;
  tier: string;
  tierEmoji: string;
  tierColor: string;
  icon: string;
  category: string;
  unlockedAt: string;
  shareMessage: string;
  deepLink: string;
}

export interface ShareCardStyle {
  backgroundColor: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  accentColor: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_EMOJIS: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  diamond: "💎",
};

const TIER_COLORS: Record<string, ShareCardStyle> = {
  bronze: {
    backgroundColor: "#2D1F0F",
    borderColor: "#CD7F32",
    glowColor: "#CD7F3240",
    textColor: "#FFE0B2",
    accentColor: "#CD7F32",
  },
  silver: {
    backgroundColor: "#1A1A2E",
    borderColor: "#C0C0C0",
    glowColor: "#C0C0C040",
    textColor: "#E8E8E8",
    accentColor: "#C0C0C0",
  },
  gold: {
    backgroundColor: "#1A1500",
    borderColor: "#FFD700",
    glowColor: "#FFD70050",
    textColor: "#FFF8DC",
    accentColor: "#FFD700",
  },
  diamond: {
    backgroundColor: "#0A1628",
    borderColor: "#B9F2FF",
    glowColor: "#B9F2FF40",
    textColor: "#E0F7FF",
    accentColor: "#B9F2FF",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  duels: "Pronunciation Duels",
  streaks: "Daily Streaks",
  mastery: "Language Mastery",
  social: "Social",
  milestones: "Milestones",
};

const CELEBRATION_MESSAGES = [
  "Just unlocked a rare achievement! 🏆",
  "New trophy earned! Who else can match this? 🔥",
  "Level up! Another achievement in the bag! 💪",
  "Trophy room growing! Check this out! ✨",
  "Achievement unlocked! The grind pays off! 🎯",
];

const APP_DEEP_LINK = "https://linguavibe.app/achievements";

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Generate share card data from an achievement unlock event
 */
export function generateShareCardData(event: AchievementUnlockEvent): ShareCardData {
  const tier = event.tier || "bronze";
  const tierEmoji = TIER_EMOJIS[tier] || "🏆";
  const tierColor = TIER_COLORS[tier]?.accentColor || "#FFD700";
  const category = CATEGORY_LABELS[event.category] || event.category;

  const shareMessage = buildShareMessage(event, tierEmoji, category);

  return {
    title: event.title,
    description: event.description,
    tier,
    tierEmoji,
    tierColor,
    icon: event.icon,
    category,
    unlockedAt: event.unlockedAt,
    shareMessage,
    deepLink: APP_DEEP_LINK,
  };
}

/**
 * Build the share message text
 */
function buildShareMessage(
  event: AchievementUnlockEvent,
  tierEmoji: string,
  category: string
): string {
  const celebration = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
  const tierLabel = (event.tier || "").toUpperCase();

  return [
    celebration,
    "",
    `${tierEmoji} ${event.title} (${tierLabel})`,
    `📂 ${category}`,
    `📝 ${event.description}`,
    "",
    "Challenge me on ConnectWorld AI! 🎤",
    APP_DEEP_LINK,
  ].join("\n");
}

/**
 * Get the visual style for a share card based on tier
 */
export function getShareCardStyle(tier: string): ShareCardStyle {
  return TIER_COLORS[tier] || TIER_COLORS.gold;
}

/**
 * Check if an achievement is eligible for share card (gold/diamond only)
 */
export function isShareEligible(event: AchievementUnlockEvent): boolean {
  return event.tier === "gold" || event.tier === "diamond";
}

/**
 * Share the achievement card via native Share API
 */
export async function shareAchievementCard(event: AchievementUnlockEvent): Promise<boolean> {
  const cardData = generateShareCardData(event);

  try {
    const result = await Share.share(
      Platform.OS === "ios"
        ? {
            message: cardData.shareMessage,
            url: cardData.deepLink,
          }
        : {
            message: cardData.shareMessage,
          }
    );

    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

/**
 * Generate a text-based share card for clipboard/messaging
 */
export function generateTextShareCard(event: AchievementUnlockEvent): string {
  const tier = event.tier || "bronze";
  const tierEmoji = TIER_EMOJIS[tier] || "🏆";
  const category = CATEGORY_LABELS[event.category] || event.category;
  const border = tier === "diamond" ? "═" : tier === "gold" ? "━" : "─";
  const borderLine = border.repeat(24);

  return [
    `┌${borderLine}┐`,
    `│ ${tierEmoji} ACHIEVEMENT UNLOCKED ${tierEmoji} │`,
    `├${borderLine}┤`,
    `│                        │`,
    `│  ${event.title.padEnd(20)}  │`,
    `│  ${event.description.slice(0, 20).padEnd(20)}  │`,
    `│                        │`,
    `│  Tier: ${(tier.toUpperCase()).padEnd(14)}  │`,
    `│  Category: ${category.slice(0, 10).padEnd(10)}  │`,
    `│                        │`,
    `└${borderLine}┘`,
    "",
    "🎤 ConnectWorld AI",
    APP_DEEP_LINK,
  ].join("\n");
}

/**
 * Get share card preview data for the UI component
 */
export function getShareCardPreview(event: AchievementUnlockEvent): {
  style: ShareCardStyle;
  data: ShareCardData;
  eligible: boolean;
} {
  return {
    style: getShareCardStyle(event.tier || "bronze"),
    data: generateShareCardData(event),
    eligible: isShareEligible(event),
  };
}
