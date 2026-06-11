/**
 * Social Challenge Sharing Library
 * 
 * Deep-link generation for sharing daily challenge results and duel invitations
 * via iMessage, WhatsApp, and other messaging apps. Links open directly in the app.
 */

import { Share, Platform } from "react-native";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────

export interface ShareableChallenge {
  type: "daily_result" | "duel_invitation" | "duel_result" | "streak_milestone";
  challengeId: string;
  language: string;
  word?: string;
  phonetic?: string;
  score?: number;
  maxScore?: number;
  rank?: string;
  streakDays?: number;
  mode?: string;
  category?: string;
  difficulty?: string;
  senderName?: string;
  timestamp: string;
}

export interface DeepLinkData {
  appLink: string;
  webLink: string;
  universalLink: string;
}

export interface ShareResult {
  shared: boolean;
  platform?: string;
  timestamp: string;
}

interface ShareHistoryEntry {
  id: string;
  type: ShareableChallenge["type"];
  timestamp: string;
  platform: string;
  recipientCount: number;
}

// ─── Constants ──────────────────────────────────────────────────────

const WEB_DOMAIN = "https://connectworldai.com";
const SHARE_HISTORY_KEY = "social_share_history";
const MAX_SHARE_HISTORY = 100;

// ─── Deep Link Generation ───────────────────────────────────────────

/**
 * Generate deep links for a shareable challenge
 */
export function generateDeepLinks(challenge: ShareableChallenge): DeepLinkData {
  const scheme = Linking.createURL("");
  const basePath = scheme.replace(/\/$/, "");
  
  const params = new URLSearchParams();
  params.set("type", challenge.type);
  params.set("id", challenge.challengeId);
  params.set("lang", challenge.language);
  if (challenge.word) params.set("word", challenge.word);
  if (challenge.score !== undefined) params.set("score", String(challenge.score));
  if (challenge.rank) params.set("rank", challenge.rank);
  if (challenge.mode) params.set("mode", challenge.mode);
  if (challenge.streakDays !== undefined) params.set("streak", String(challenge.streakDays));
  if (challenge.senderName) params.set("from", challenge.senderName);
  params.set("t", challenge.timestamp);

  const queryString = params.toString();

  return {
    appLink: `${basePath}/challenge?${queryString}`,
    webLink: `${WEB_DOMAIN}/challenge?${queryString}`,
    universalLink: `${WEB_DOMAIN}/challenge?${queryString}`,
  };
}

/**
 * Parse a deep link URL back into challenge data
 */
export function parseDeepLink(url: string): ShareableChallenge | null {
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    
    const type = params.get("type") as ShareableChallenge["type"];
    const challengeId = params.get("id");
    const language = params.get("lang");
    
    if (!type || !challengeId || !language) return null;
    
    return {
      type,
      challengeId,
      language,
      word: params.get("word") || undefined,
      score: params.has("score") ? Number(params.get("score")) : undefined,
      rank: params.get("rank") || undefined,
      mode: params.get("mode") || undefined,
      streakDays: params.has("streak") ? Number(params.get("streak")) : undefined,
      senderName: params.get("from") || undefined,
      timestamp: params.get("t") || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── Share Message Generators ───────────────────────────────────────

/**
 * Generate a share message for daily challenge results
 */
export function generateDailyResultMessage(challenge: ShareableChallenge): {
  title: string;
  message: string;
  url: string;
} {
  const links = generateDeepLinks(challenge);
  const rankEmoji = getRankEmoji(challenge.rank || "participant");
  const scoreText = challenge.score !== undefined && challenge.maxScore !== undefined
    ? `${challenge.score}/${challenge.maxScore}`
    : challenge.score !== undefined ? String(challenge.score) : "???";
  
  const streakLine = challenge.streakDays && challenge.streakDays > 1
    ? `\n🔥 ${challenge.streakDays}-day streak!`
    : "";
  
  return {
    title: `${rankEmoji} Daily Pronunciation Challenge`,
    message: [
      `${rankEmoji} I scored ${scoreText} on today's ConnectWorld AI Daily Challenge!`,
      "",
      `📝 Word: "${challenge.word || "???"}" ${challenge.phonetic ? `(${challenge.phonetic})` : ""}`,
      `🌍 Language: ${getLanguageLabel(challenge.language)}`,
      streakLine,
      "",
      "Can you beat my score? Tap to play:",
      links.universalLink,
      "",
      "#ConnectWorldAI #PronunciationChallenge #LanguageLearning",
    ].filter(Boolean).join("\n"),
    url: links.universalLink,
  };
}

/**
 * Generate a share message for duel invitations
 */
export function generateDuelInvitationMessage(challenge: ShareableChallenge): {
  title: string;
  message: string;
  url: string;
} {
  const links = generateDeepLinks(challenge);
  const modeLabel = getModeLabel(challenge.mode || "word_flash");
  const categoryLabel = getCategoryLabel(challenge.category || "abcs");
  
  return {
    title: "⚔️ Pronunciation Duel Challenge",
    message: [
      `⚔️ ${challenge.senderName || "Someone"} challenged you to a Pronunciation Duel!`,
      "",
      `🎮 Mode: ${modeLabel}`,
      `📚 Category: ${categoryLabel}`,
      `🌍 Language: ${getLanguageLabel(challenge.language)}`,
      `💪 Difficulty: ${(challenge.difficulty || "medium").charAt(0).toUpperCase() + (challenge.difficulty || "medium").slice(1)}`,
      "",
      "Accept the challenge:",
      links.universalLink,
      "",
      "#ConnectWorldAI #PronunciationDuel #LanguageBattle",
    ].join("\n"),
    url: links.universalLink,
  };
}

/**
 * Generate a share message for duel results
 */
export function generateDuelResultMessage(challenge: ShareableChallenge): {
  title: string;
  message: string;
  url: string;
} {
  const links = generateDeepLinks(challenge);
  const won = (challenge.score || 0) > (challenge.maxScore || 0) / 2;
  const emoji = won ? "🏆" : "💪";
  
  return {
    title: `${emoji} Duel Result`,
    message: [
      `${emoji} ${won ? "I won" : "Just battled in"} a Pronunciation Duel on ConnectWorld AI!`,
      "",
      `📊 Score: ${challenge.score || 0} points`,
      `🎮 Mode: ${getModeLabel(challenge.mode || "word_flash")}`,
      `🌍 Language: ${getLanguageLabel(challenge.language)}`,
      "",
      "Think you can do better? Challenge me:",
      links.universalLink,
      "",
      "#ConnectWorldAI #PronunciationDuel #LanguageLearning",
    ].join("\n"),
    url: links.universalLink,
  };
}

/**
 * Generate a share message for streak milestones
 */
export function generateStreakMilestoneMessage(challenge: ShareableChallenge): {
  title: string;
  message: string;
  url: string;
} {
  const links = generateDeepLinks(challenge);
  const days = challenge.streakDays || 0;
  const milestoneEmoji = days >= 365 ? "💎" : days >= 100 ? "🏆" : days >= 30 ? "🥇" : days >= 7 ? "🔥" : "⭐";
  
  return {
    title: `${milestoneEmoji} ${days}-Day Streak!`,
    message: [
      `${milestoneEmoji} I just hit a ${days}-day pronunciation streak on ConnectWorld AI!`,
      "",
      `🌍 Language: ${getLanguageLabel(challenge.language)}`,
      `📈 ${days} consecutive days of practice`,
      "",
      "Join me and start your streak:",
      links.universalLink,
      "",
      "#ConnectWorldAI #LanguageStreak #DailyPractice",
    ].join("\n"),
    url: links.universalLink,
  };
}

// ─── Share Actions ──────────────────────────────────────────────────

/**
 * Share daily challenge results via native share sheet
 */
export async function shareDailyResult(challenge: ShareableChallenge): Promise<ShareResult> {
  const { title, message } = generateDailyResultMessage(challenge);
  return shareViaNative(title, message, challenge);
}

/**
 * Share duel invitation via native share sheet
 */
export async function shareDuelInvitation(challenge: ShareableChallenge): Promise<ShareResult> {
  const { title, message } = generateDuelInvitationMessage(challenge);
  return shareViaNative(title, message, challenge);
}

/**
 * Share duel result via native share sheet
 */
export async function shareDuelResult(challenge: ShareableChallenge): Promise<ShareResult> {
  const { title, message } = generateDuelResultMessage(challenge);
  return shareViaNative(title, message, challenge);
}

/**
 * Share streak milestone via native share sheet
 */
export async function shareStreakMilestone(challenge: ShareableChallenge): Promise<ShareResult> {
  const { title, message } = generateStreakMilestoneMessage(challenge);
  return shareViaNative(title, message, challenge);
}

/**
 * Share directly to WhatsApp
 */
export async function shareToWhatsApp(challenge: ShareableChallenge): Promise<ShareResult> {
  const generator = getMessageGenerator(challenge.type);
  const { message } = generator(challenge);
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `whatsapp://send?text=${encoded}`;
  
  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      await logShareHistory(challenge, "whatsapp");
      return { shared: true, platform: "whatsapp", timestamp: new Date().toISOString() };
    }
    // Fallback to web WhatsApp
    await Linking.openURL(`https://wa.me/?text=${encoded}`);
    await logShareHistory(challenge, "whatsapp_web");
    return { shared: true, platform: "whatsapp_web", timestamp: new Date().toISOString() };
  } catch {
    return { shared: false, timestamp: new Date().toISOString() };
  }
}

/**
 * Share directly to iMessage (iOS only)
 */
export async function shareToiMessage(challenge: ShareableChallenge): Promise<ShareResult> {
  if (Platform.OS !== "ios") {
    return shareDailyResult(challenge); // Fallback to native share
  }
  
  const generator = getMessageGenerator(challenge.type);
  const { message } = generator(challenge);
  const encoded = encodeURIComponent(message);
  const smsUrl = `sms:&body=${encoded}`;
  
  try {
    await Linking.openURL(smsUrl);
    await logShareHistory(challenge, "imessage");
    return { shared: true, platform: "imessage", timestamp: new Date().toISOString() };
  } catch {
    return { shared: false, timestamp: new Date().toISOString() };
  }
}

// ─── Share History ──────────────────────────────────────────────────

async function logShareHistory(challenge: ShareableChallenge, platform: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SHARE_HISTORY_KEY);
    const history: ShareHistoryEntry[] = raw ? JSON.parse(raw) : [];
    
    history.unshift({
      id: `share_${Date.now()}`,
      type: challenge.type,
      timestamp: new Date().toISOString(),
      platform,
      recipientCount: 1,
    });
    
    await AsyncStorage.setItem(
      SHARE_HISTORY_KEY,
      JSON.stringify(history.slice(0, MAX_SHARE_HISTORY))
    );
  } catch {
    // Silent fail
  }
}

export async function getShareHistory(): Promise<ShareHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(SHARE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getShareCount(): Promise<number> {
  const history = await getShareHistory();
  return history.length;
}

// ─── Internal Helpers ───────────────────────────────────────────────

async function shareViaNative(
  title: string,
  message: string,
  challenge: ShareableChallenge
): Promise<ShareResult> {
  try {
    const result = await Share.share({ title, message });
    if (result.action === Share.sharedAction) {
      await logShareHistory(challenge, result.activityType || "native");
      return { shared: true, platform: result.activityType || "native", timestamp: new Date().toISOString() };
    }
    return { shared: false, timestamp: new Date().toISOString() };
  } catch {
    return { shared: false, timestamp: new Date().toISOString() };
  }
}

function getMessageGenerator(type: ShareableChallenge["type"]) {
  switch (type) {
    case "daily_result": return generateDailyResultMessage;
    case "duel_invitation": return generateDuelInvitationMessage;
    case "duel_result": return generateDuelResultMessage;
    case "streak_milestone": return generateStreakMilestoneMessage;
    default: return generateDailyResultMessage;
  }
}

function getRankEmoji(rank: string): string {
  switch (rank) {
    case "gold": return "🥇";
    case "silver": return "🥈";
    case "bronze": return "🥉";
    default: return "🎯";
  }
}

function getLanguageLabel(lang: string): string {
  const labels: Record<string, string> = {
    spanish: "🇪🇸 Spanish",
    french: "🇫🇷 French",
    portuguese: "🇧🇷 Portuguese",
    japanese: "🇯🇵 Japanese",
    german: "🇩🇪 German",
    korean: "🇰🇷 Korean",
    mandarin: "🇨🇳 Mandarin",
    english: "🇺🇸 English",
  };
  return labels[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

function getModeLabel(mode: string): string {
  switch (mode) {
    case "word_flash": return "Word Flash";
    case "phrase_race": return "Phrase Race";
    case "tongue_twister": return "Tongue Twister";
    default: return mode;
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "abcs": return "ABCs & Letters";
    case "numbers": return "Numbers";
    case "adjectives": return "Adjectives";
    case "present_tense": return "Present Tense";
    case "past_tense": return "Past Tense";
    case "future_tense": return "Future Tense";
    case "tongue_twisters": return "Tongue Twisters";
    default: return category;
  }
}

// ─── Convenience Link Generators ────────────────────────────────────

/**
 * Quick convenience: generate a duel invite deep link from mode/category/language.
 * Returns { url, message } for easy sharing.
 */
export function generateDuelInviteLink(
  mode: string,
  category: string,
  language: string
): { url: string; message: string } {
  const challenge: ShareableChallenge = {
    type: "duel_invitation",
    challengeId: `duel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    language,
    mode,
    word: category,
    timestamp: new Date().toISOString(),
    senderName: "A friend",
  };
  const links = generateDeepLinks(challenge);
  const shareContent = generateDuelInvitationMessage(challenge);
  const hashtags = "#LinguaVibe #LanguageDuel";
  return {
    url: links.universalLink,
    message: `${shareContent.message}\n\n${hashtags}`,
  };
}

/**
 * Quick convenience: generate a daily result deep link from date and score.
 * Returns { url, message } for easy sharing.
 */
export function generateDailyResultLink(
  date: string,
  score: number
): { url: string; message: string } {
  const challenge: ShareableChallenge = {
    type: "daily_result",
    challengeId: `daily_${date}`,
    language: "multi",
    score,
    word: date,
    timestamp: new Date().toISOString(),
    senderName: "A friend",
  };
  const links = generateDeepLinks(challenge);
  const dailyResult = generateDailyResultMessage(challenge);
  const hashtags = "#LinguaVibe #DailyChallenge";
  return {
    url: links.universalLink,
    message: `${dailyResult.message}\n\n${hashtags}`,
  };
}
