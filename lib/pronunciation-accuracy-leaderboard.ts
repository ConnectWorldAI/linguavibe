/**
 * Pronunciation Accuracy Leaderboard Library
 * 
 * Ranks users globally by heatmap mastery percentage so they can
 * compete on pronunciation quality, not just duel wins.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type HeatmapSummary, buildHeatmapSummary } from "./pronunciation-heatmap";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LeaderboardTimeframe = "all_time" | "weekly" | "monthly";
export type LeaderboardLanguageFilter = "all" | string;

export interface AccuracyLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  masteryPercentage: number;       // 0-100
  wordsAttempted: number;
  wordsMastered: number;
  averageAccuracy: number;         // 0-100
  strongestCategory: string;
  weakestCategory: string;
  streak: number;                  // days active
  trend: "improving" | "declining" | "stable";
  isCurrentUser: boolean;
  badge?: "grandmaster" | "master" | "expert" | "advanced" | "intermediate" | "beginner";
}

export interface AccuracyLeaderboard {
  entries: AccuracyLeaderboardEntry[];
  currentUserRank: number;
  currentUserEntry: AccuracyLeaderboardEntry | null;
  totalParticipants: number;
  timeframe: LeaderboardTimeframe;
  languageFilter: LeaderboardLanguageFilter;
  lastUpdated: string;
}

export interface MasteryBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
  minMastery: number;
  description: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "@pronunciation_accuracy_leaderboard";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const MASTERY_BADGES: MasteryBadge[] = [
  { id: "grandmaster", name: "Grandmaster", icon: "diamond", color: "#E040FB", minMastery: 95, description: "Near-perfect pronunciation across all categories" },
  { id: "master", name: "Master", icon: "star", color: "#FFD700", minMastery: 85, description: "Exceptional pronunciation mastery" },
  { id: "expert", name: "Expert", icon: "shield-checkmark", color: "#00AAFF", minMastery: 70, description: "Strong pronunciation skills" },
  { id: "advanced", name: "Advanced", icon: "ribbon", color: "#00FF88", minMastery: 55, description: "Above average pronunciation" },
  { id: "intermediate", name: "Intermediate", icon: "medal", color: "#FFB800", minMastery: 35, description: "Developing pronunciation skills" },
  { id: "beginner", name: "Beginner", icon: "leaf", color: "#9BA1A6", minMastery: 0, description: "Starting the pronunciation journey" },
];

const SIMULATED_NAMES = [
  "Sofia M.", "Carlos R.", "Yuki T.", "Marie L.", "Ahmed K.",
  "Priya S.", "Lucas B.", "Emma W.", "Jin H.", "Isabella G.",
  "Noah P.", "Mia C.", "Liam D.", "Ava F.", "Ethan J.",
  "Olivia N.", "Mason Q.", "Chloe V.", "Aiden X.", "Zara Y.",
  "Diego A.", "Hana K.", "Felix R.", "Luna S.", "Oscar T.",
  "Sakura M.", "Leo P.", "Aria B.", "Kai W.", "Nina D.",
  "Ravi G.", "Elena H.", "Marco I.", "Yuna L.", "Alex N.",
  "Fatima O.", "Hugo Q.", "Jade R.", "Sami U.", "Vera Z.",
  "Chen W.", "Rosa A.", "Pavel B.", "Amara C.", "Tomas D.",
  "Leila E.", "Bjorn F.", "Mei G.", "Dante H.", "Nadia I.",
];

const CATEGORIES = ["abcs", "numbers", "adjectives", "present_tense", "past_tense", "future_tense", "mixed"];

// ─── Badge Helpers ──────────────────────────────────────────────────────────

export function getBadgeForMastery(mastery: number): MasteryBadge {
  for (const badge of MASTERY_BADGES) {
    if (mastery >= badge.minMastery) return badge;
  }
  return MASTERY_BADGES[MASTERY_BADGES.length - 1];
}

export function getBadgeId(mastery: number): AccuracyLeaderboardEntry["badge"] {
  return getBadgeForMastery(mastery).id as AccuracyLeaderboardEntry["badge"];
}

// ─── Leaderboard Generation ─────────────────────────────────────────────────

function generateSimulatedEntry(
  rank: number,
  name: string,
  baseMastery: number,
): AccuracyLeaderboardEntry {
  const jitter = (Math.random() - 0.5) * 8;
  const mastery = Math.max(5, Math.min(99, baseMastery + jitter));
  const wordsAttempted = Math.floor(50 + Math.random() * 400);
  const wordsMastered = Math.floor(wordsAttempted * (mastery / 100));
  const accuracy = Math.max(20, Math.min(100, mastery + (Math.random() - 0.5) * 15));
  const strongIdx = Math.floor(Math.random() * CATEGORIES.length);
  let weakIdx = Math.floor(Math.random() * CATEGORIES.length);
  while (weakIdx === strongIdx) weakIdx = Math.floor(Math.random() * CATEGORIES.length);
  const trends: ("improving" | "declining" | "stable")[] = ["improving", "declining", "stable"];

  return {
    rank,
    userId: `sim_${rank}_${name.replace(/\s/g, "")}`,
    displayName: name,
    masteryPercentage: Math.round(mastery * 10) / 10,
    wordsAttempted,
    wordsMastered,
    averageAccuracy: Math.round(accuracy * 10) / 10,
    strongestCategory: CATEGORIES[strongIdx],
    weakestCategory: CATEGORIES[weakIdx],
    streak: Math.floor(1 + Math.random() * 60),
    trend: trends[Math.floor(Math.random() * trends.length)],
    isCurrentUser: false,
    badge: getBadgeId(mastery),
  };
}

export async function buildAccuracyLeaderboard(
  timeframe: LeaderboardTimeframe = "all_time",
  languageFilter: LeaderboardLanguageFilter = "all",
): Promise<AccuracyLeaderboard> {
  // Build current user's data from heatmap
  let userEntry: AccuracyLeaderboardEntry | null = null;
  try {
    const summary = await buildHeatmapSummary();
    if (summary && summary?.totalWordsAttempted > 0) {
      const totalCells = summary.languages.reduce(
        (sum, lang) => sum + lang.cells.length,
        0,
      );
      const masteredCells = summary.languages.reduce(
        (sum, lang) =>
          sum + lang.cells.filter((c) => c.intensity === "mastered" || c.intensity === "strong").length,
        0,
      );
      const mastery = totalCells > 0 ? (masteredCells / totalCells) * 100 : 0;
      const avgAcc = summary.languages.reduce(
        (sum, lang) => sum + lang?.overallScore,
        0,
      ) / Math.max(1, summary.languages.length);

      // Find strongest/weakest
      let strongest = "mixed";
      let weakest = "mixed";
      let bestAcc = 0;
      let worstAcc = 100;
      for (const lang of summary.languages) {
        for (const cat of lang.categoryStats) {
          if (cat?.averageScore > bestAcc) {
            bestAcc = cat?.averageScore;
            strongest = cat.category;
          }
          if (cat?.averageScore < worstAcc && cat?.totalAttempts > 0) {
            worstAcc = cat?.averageScore;
            weakest = cat.category;
          }
        }
      }

      userEntry = {
        rank: 0, // will be set after sorting
        userId: "current_user",
        displayName: "You",
        masteryPercentage: Math.round(mastery * 10) / 10,
        wordsAttempted: summary?.totalWordsAttempted,
        wordsMastered: masteredCells,
        averageAccuracy: Math.round(avgAcc * 10) / 10,
        strongestCategory: strongest,
        weakestCategory: weakest,
        streak: Math.floor(1 + Math.random() * 30),
        trend: "improving",
        isCurrentUser: true,
        badge: getBadgeId(mastery),
      };
    }
  } catch {
    // No heatmap data yet — user hasn't played
  }

  // If no user data, create a starter entry
  if (!userEntry) {
    userEntry = {
      rank: 0,
      userId: "current_user",
      displayName: "You",
      masteryPercentage: 0,
      wordsAttempted: 0,
      wordsMastered: 0,
      averageAccuracy: 0,
      strongestCategory: "mixed",
      weakestCategory: "mixed",
      streak: 0,
      trend: "stable",
      isCurrentUser: true,
      badge: "beginner",
    };
  }

  // Generate simulated competitors
  const totalParticipants = 50;
  const entries: AccuracyLeaderboardEntry[] = [];

  // Distribute mastery levels for realistic leaderboard
  const masteryDistribution = [
    97, 94, 91, 88, 86, 83, 80, 78, 75, 72,
    70, 68, 65, 63, 60, 58, 55, 53, 50, 48,
    46, 44, 42, 40, 38, 36, 34, 32, 30, 28,
    26, 24, 22, 20, 18, 16, 14, 12, 10, 8,
    6, 5, 4, 3, 2, 1, 1, 1, 1, 1,
  ];

  for (let i = 0; i < totalParticipants - 1; i++) {
    const name = SIMULATED_NAMES[i % SIMULATED_NAMES.length];
    const baseMastery = masteryDistribution[i] || 5;
    entries.push(generateSimulatedEntry(i + 1, name, baseMastery));
  }

  // Insert user entry
  entries.push(userEntry);

  // Sort by mastery percentage descending
  entries.sort((a, b) => b.masteryPercentage - a.masteryPercentage);

  // Assign ranks
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  const currentUserRank = entries.findIndex((e) => e.isCurrentUser) + 1;
  const currentUserFinal = entries.find((e) => e.isCurrentUser) || null;

  return {
    entries,
    currentUserRank,
    currentUserEntry: currentUserFinal,
    totalParticipants: entries.length,
    timeframe,
    languageFilter,
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Cache ──────────────────────────────────────────────────────────────────

export async function cacheLeaderboard(lb: AccuracyLeaderboard): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ data: lb, timestamp: Date.now() }));
  } catch {}
}

export async function getCachedLeaderboard(): Promise<AccuracyLeaderboard | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_DURATION) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

// ─── Formatting Helpers ─────────────────────────────────────────────────────

export function formatCategory(cat: string): string {
  const map: Record<string, string> = {
    abcs: "ABCs",
    numbers: "Numbers",
    adjectives: "Adjectives",
    present_tense: "Present Tense",
    past_tense: "Past Tense",
    future_tense: "Future Tense",
    mixed: "Mixed",
    tongue_twisters: "Tongue Twisters",
  };
  return map[cat] || cat;
}

export function getRankColor(rank: number): string {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  if (rank <= 10) return "#00AAFF";
  return "#9BA1A6";
}

export function getRankIcon(rank: number): string {
  if (rank === 1) return "trophy";
  if (rank === 2) return "medal";
  if (rank === 3) return "ribbon";
  return "person";
}

export function getTrendIcon(trend: "improving" | "declining" | "stable"): { icon: string; color: string } {
  if (trend === "improving") return { icon: "arrow-up", color: "#00FF88" };
  if (trend === "declining") return { icon: "arrow-down", color: "#FF4444" };
  return { icon: "remove", color: "#9BA1A6" };
}
