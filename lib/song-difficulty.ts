/**
 * Song Difficulty Matching Engine
 * Maps songs to user's CEFR level based on vocabulary complexity,
 * sentence length, and grammatical structures.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface SongDifficulty {
  level: CEFRLevel;
  score: number; // 1-100
  reasons: string[];
  isRecommended: boolean;
}

export interface SongMetadata {
  id: string;
  title: string;
  artist: string;
  language: string;
  lyrics?: string;
  wordCount?: number;
  uniqueWords?: number;
  avgSentenceLength?: number;
  hasSlang?: boolean;
  tempo?: "slow" | "medium" | "fast";
  genre?: string;
}

// Vocabulary complexity thresholds by CEFR level
const LEVEL_THRESHOLDS = {
  A1: { maxUniqueWords: 200, maxSentenceLen: 6, maxWordLen: 7 },
  A2: { maxUniqueWords: 500, maxSentenceLen: 10, maxWordLen: 9 },
  B1: { maxUniqueWords: 1000, maxSentenceLen: 15, maxWordLen: 11 },
  B2: { maxUniqueWords: 2000, maxSentenceLen: 20, maxWordLen: 13 },
  C1: { maxUniqueWords: 4000, maxSentenceLen: 25, maxWordLen: 15 },
  C2: { maxUniqueWords: 10000, maxSentenceLen: 50, maxWordLen: 20 },
};

const LEVEL_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/**
 * Analyze song lyrics and determine difficulty level
 */
export function analyzeSongDifficulty(lyrics: string): SongDifficulty {
  if (!lyrics || lyrics.trim().length === 0) {
    return { level: "A2", score: 30, reasons: ["No lyrics available for analysis"], isRecommended: true };
  }

  const words = lyrics.toLowerCase().replace(/[^\w\sáéíóúñüàèìòùâêîôûäëïöü]/g, "").split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const sentences = lyrics.split(/[.!?¿¡\n]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLen = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgWordLen = words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0;

  // Score components
  let vocabScore = 0;
  let sentenceScore = 0;
  let wordLenScore = 0;

  // Vocabulary diversity score
  const vocabRatio = uniqueWords.size / Math.max(words.length, 1);
  if (vocabRatio < 0.3) vocabScore = 20;
  else if (vocabRatio < 0.4) vocabScore = 35;
  else if (vocabRatio < 0.5) vocabScore = 50;
  else if (vocabRatio < 0.6) vocabScore = 65;
  else if (vocabRatio < 0.7) vocabScore = 80;
  else vocabScore = 90;

  // Sentence complexity score
  if (avgSentenceLen <= 5) sentenceScore = 15;
  else if (avgSentenceLen <= 8) sentenceScore = 30;
  else if (avgSentenceLen <= 12) sentenceScore = 50;
  else if (avgSentenceLen <= 16) sentenceScore = 65;
  else if (avgSentenceLen <= 20) sentenceScore = 80;
  else sentenceScore = 90;

  // Word length complexity
  if (avgWordLen <= 4) wordLenScore = 20;
  else if (avgWordLen <= 5) wordLenScore = 35;
  else if (avgWordLen <= 6) wordLenScore = 50;
  else if (avgWordLen <= 7) wordLenScore = 65;
  else wordLenScore = 80;

  const totalScore = Math.round(vocabScore * 0.4 + sentenceScore * 0.35 + wordLenScore * 0.25);

  // Map score to CEFR level
  let level: CEFRLevel;
  if (totalScore <= 25) level = "A1";
  else if (totalScore <= 40) level = "A2";
  else if (totalScore <= 55) level = "B1";
  else if (totalScore <= 70) level = "B2";
  else if (totalScore <= 85) level = "C1";
  else level = "C2";

  const reasons: string[] = [];
  if (uniqueWords.size < 50) reasons.push("Limited vocabulary — great for beginners");
  else if (uniqueWords.size > 150) reasons.push("Rich vocabulary — good for advanced learners");
  if (avgSentenceLen < 6) reasons.push("Short, simple phrases");
  else if (avgSentenceLen > 15) reasons.push("Complex sentence structures");
  if (vocabRatio > 0.6) reasons.push("High vocabulary diversity");
  if (words.length < 100) reasons.push("Short song — easy to memorize");

  return { level, score: totalScore, reasons, isRecommended: true };
}

/**
 * Check if a song matches the user's current level (±1 level tolerance)
 */
export function isSongMatchedToLevel(songLevel: CEFRLevel, userLevel: CEFRLevel): boolean {
  const songIdx = LEVEL_ORDER.indexOf(songLevel);
  const userIdx = LEVEL_ORDER.indexOf(userLevel);
  return Math.abs(songIdx - userIdx) <= 1;
}

/**
 * Get user's current CEFR level from AsyncStorage
 */
export async function getUserLevel(): Promise<CEFRLevel> {
  try {
    const level = await AsyncStorage.getItem("@user_level");
    if (level && LEVEL_ORDER.includes(level as CEFRLevel)) {
      return level as CEFRLevel;
    }
  } catch {}
  return "A2"; // Default
}

/**
 * Get difficulty label and color for display
 */
export function getDifficultyDisplay(level: CEFRLevel): { label: string; color: string; emoji: string } {
  switch (level) {
    case "A1": return { label: "Beginner", color: "#22C55E", emoji: "🌱" };
    case "A2": return { label: "Elementary", color: "#84CC16", emoji: "🌿" };
    case "B1": return { label: "Intermediate", color: "#F59E0B", emoji: "🌳" };
    case "B2": return { label: "Upper Intermediate", color: "#F97316", emoji: "🔥" };
    case "C1": return { label: "Advanced", color: "#EF4444", emoji: "⚡" };
    case "C2": return { label: "Mastery", color: "#8B5CF6", emoji: "👑" };
  }
}

/**
 * Sort songs by relevance to user's level (closest match first)
 */
export function sortSongsByRelevance(songs: (SongMetadata & { difficulty?: SongDifficulty })[], userLevel: CEFRLevel): typeof songs {
  const userIdx = LEVEL_ORDER.indexOf(userLevel);
  return [...songs].sort((a, b) => {
    const aIdx = LEVEL_ORDER.indexOf(a.difficulty?.level || "B1");
    const bIdx = LEVEL_ORDER.indexOf(b.difficulty?.level || "B1");
    return Math.abs(aIdx - userIdx) - Math.abs(bIdx - userIdx);
  });
}
