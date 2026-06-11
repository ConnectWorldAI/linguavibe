/**
 * Pronunciation Heatmap — Analytics library
 * Analyzes all duel match history to identify weak sounds/words
 * and generates heatmap data for visual display.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type DuelMatch, type DuelRound, type DuelCategory, getDuelHistory } from "./pronunciation-duel";

// ── Types ──────────────────────────────────────────────────────────
export type HeatmapIntensity = "mastered" | "strong" | "moderate" | "weak" | "struggling";

export interface WordAttempt {
  word: string;
  phonetic: string;
  translation: string;
  category: DuelCategory;
  language: string;
  score: number;
  transcript: string;
  timestamp: string;
}

export interface HeatmapCell {
  word: string;
  phonetic: string;
  translation: string;
  category: DuelCategory;
  language: string;
  averageScore: number;
  attempts: number;
  bestScore: number;
  worstScore: number;
  recentTrend: "improving" | "declining" | "stable";
  intensity: HeatmapIntensity;
  lastAttempted: string;
}

export interface CategoryStats {
  category: DuelCategory;
  label: string;
  averageScore: number;
  totalAttempts: number;
  weakWordCount: number;
  strongWordCount: number;
}

export interface LanguageHeatmap {
  language: string;
  cells: HeatmapCell[];
  categoryStats: CategoryStats[];
  overallScore: number;
  totalAttempts: number;
  weakestCategory: DuelCategory;
  strongestCategory: DuelCategory;
  improvementRate: number; // percentage change over last 7 days
}

export interface HeatmapSummary {
  languages: LanguageHeatmap[];
  globalWeakWords: HeatmapCell[];
  globalStrongWords: HeatmapCell[];
  totalWordsAttempted: number;
  overallAccuracy: number;
  practiceStreak: number;
  lastPracticed: string | null;
}

// ── Constants ──────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<DuelCategory, string> = {
  abcs: "ABCs & Letters",
  numbers: "Numbers",
  adjectives: "Adjectives",
  verbs_present: "Present Tense",
  verbs_past: "Past Tense",
  verbs_future: "Future Tense",
  mixed: "Mixed Practice",
};

const HEATMAP_CACHE_KEY = "@pronunciation_heatmap_cache";

// ── Score → Intensity Mapping ──────────────────────────────────────
export function getIntensity(score: number): HeatmapIntensity {
  if (score >= 90) return "mastered";
  if (score >= 75) return "strong";
  if (score >= 55) return "moderate";
  if (score >= 35) return "weak";
  return "struggling";
}

export function getIntensityColor(intensity: HeatmapIntensity): string {
  switch (intensity) {
    case "mastered": return "#00FF88";
    case "strong": return "#4ADE80";
    case "moderate": return "#FFD600";
    case "weak": return "#FF8C00";
    case "struggling": return "#FF4444";
  }
}

export function getIntensityBgColor(intensity: HeatmapIntensity): string {
  switch (intensity) {
    case "mastered": return "rgba(0, 255, 136, 0.15)";
    case "strong": return "rgba(74, 222, 128, 0.12)";
    case "moderate": return "rgba(255, 214, 0, 0.12)";
    case "weak": return "rgba(255, 140, 0, 0.15)";
    case "struggling": return "rgba(255, 68, 68, 0.18)";
  }
}

// ── Extract Attempts from Match History ────────────────────────────
export function extractAttempts(matches: DuelMatch[]): WordAttempt[] {
  const attempts: WordAttempt[] = [];
  for (const match of matches) {
    for (const round of match.rounds) {
      attempts.push({
        word: round.word.text,
        phonetic: round.word.phonetic,
        translation: round.word.translation,
        category: round.word.category,
        language: match.language || "Spanish",
        score: round.playerScore,
        transcript: round.playerTranscript,
        timestamp: match.startedAt,
      });
    }
  }
  return attempts;
}

// ── Calculate Trend ────────────────────────────────────────────────
function calculateTrend(scores: number[]): "improving" | "declining" | "stable" {
  if (scores.length < 2) return "stable";
  const half = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, half);
  const secondHalf = scores.slice(half);
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;
  if (diff > 5) return "improving";
  if (diff < -5) return "declining";
  return "stable";
}

// ── Build Heatmap Cells ────────────────────────────────────────────
export function buildHeatmapCells(attempts: WordAttempt[]): HeatmapCell[] {
  const wordMap = new Map<string, WordAttempt[]>();

  for (const attempt of attempts) {
    const key = `${attempt.language}:${attempt.word}`;
    const existing = wordMap.get(key) || [];
    existing.push(attempt);
    wordMap.set(key, existing);
  }

  const cells: HeatmapCell[] = [];
  for (const [, wordAttempts] of wordMap) {
    const scores = wordAttempts.map(a => a.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const sorted = [...wordAttempts].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    cells.push({
      word: wordAttempts[0].word,
      phonetic: wordAttempts[0].phonetic,
      translation: wordAttempts[0].translation,
      category: wordAttempts[0].category,
      language: wordAttempts[0].language,
      averageScore: Math.round(avgScore),
      attempts: wordAttempts.length,
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      recentTrend: calculateTrend(scores),
      intensity: getIntensity(avgScore),
      lastAttempted: sorted[0].timestamp,
    });
  }

  return cells.sort((a, b) => a.averageScore - b.averageScore);
}

// ── Build Category Stats ───────────────────────────────────────────
export function buildCategoryStats(cells: HeatmapCell[]): CategoryStats[] {
  const categories: DuelCategory[] = [
    "abcs", "numbers", "adjectives",
    "verbs_present", "verbs_past", "verbs_future",
  ];

  return categories.map(cat => {
    const catCells = cells.filter(c => c.category === cat);
    const totalAttempts = catCells.reduce((sum, c) => sum + c.attempts, 0);
    const avgScore = catCells.length > 0
      ? catCells.reduce((sum, c) => sum + c.averageScore, 0) / catCells.length
      : 0;

    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      averageScore: Math.round(avgScore),
      totalAttempts,
      weakWordCount: catCells.filter(c => c.averageScore < 55).length,
      strongWordCount: catCells.filter(c => c.averageScore >= 75).length,
    };
  });
}

// ── Build Language Heatmap ─────────────────────────────────────────
export function buildLanguageHeatmap(
  language: string,
  cells: HeatmapCell[],
  attempts: WordAttempt[]
): LanguageHeatmap {
  const langCells = cells.filter(c => c.language === language);
  const langAttempts = attempts.filter(a => a.language === language);
  const categoryStats = buildCategoryStats(langCells);

  const overallScore = langCells.length > 0
    ? Math.round(langCells.reduce((sum, c) => sum + c.averageScore, 0) / langCells.length)
    : 0;

  const weakest = categoryStats.reduce((min, c) =>
    c.totalAttempts > 0 && c.averageScore < min.averageScore ? c : min,
    { ...categoryStats[0] }
  );
  const strongest = categoryStats.reduce((max, c) =>
    c.averageScore > max.averageScore ? c : max,
    { ...categoryStats[0] }
  );

  // Calculate improvement rate (last 7 days vs prior)
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
  const recentScores = langAttempts
    .filter(a => new Date(a.timestamp).getTime() > sevenDaysAgo)
    .map(a => a.score);
  const priorScores = langAttempts
    .filter(a => {
      const t = new Date(a.timestamp).getTime();
      return t > fourteenDaysAgo && t <= sevenDaysAgo;
    })
    .map(a => a.score);

  let improvementRate = 0;
  if (recentScores.length > 0 && priorScores.length > 0) {
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const priorAvg = priorScores.reduce((a, b) => a + b, 0) / priorScores.length;
    improvementRate = Math.round(recentAvg - priorAvg);
  }

  return {
    language,
    cells: langCells,
    categoryStats,
    overallScore,
    totalAttempts: langAttempts.length,
    weakestCategory: weakest.category,
    strongestCategory: strongest.category,
    improvementRate,
  };
}

// ── Build Full Heatmap Summary ─────────────────────────────────────
export async function buildHeatmapSummary(): Promise<HeatmapSummary> {
  const matches = await getDuelHistory();
  const attempts = extractAttempts(matches);
  const cells = buildHeatmapCells(attempts);

  // Group by language
  const languages = [...new Set(attempts.map(a => a.language))];
  const languageHeatmaps = languages.map(lang =>
    buildLanguageHeatmap(lang, cells, attempts)
  );

  const globalWeakWords = cells.filter(c => c.averageScore < 55).slice(0, 10);
  const globalStrongWords = cells
    .filter(c => c.averageScore >= 75)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 10);

  const overallAccuracy = cells.length > 0
    ? Math.round(cells.reduce((sum, c) => sum + c.averageScore, 0) / cells.length)
    : 0;

  // Practice streak (consecutive days with attempts)
  const daySet = new Set(
    attempts.map(a => new Date(a.timestamp).toISOString().split("T")[0])
  );
  const sortedDays = [...daySet].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = new Date(today);
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (daySet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // Today hasn't been practiced yet, check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    languages: languageHeatmaps,
    globalWeakWords,
    globalStrongWords,
    totalWordsAttempted: cells.length,
    overallAccuracy,
    practiceStreak: streak,
    lastPracticed: sortedDays.length > 0 ? sortedDays[0] : null,
  };
}

// ── Cache helpers ──────────────────────────────────────────────────
export async function cacheHeatmap(summary: HeatmapSummary): Promise<void> {
  try {
    await AsyncStorage.setItem(HEATMAP_CACHE_KEY, JSON.stringify({
      data: summary,
      cachedAt: new Date().toISOString(),
    }));
  } catch {}
}

export async function getCachedHeatmap(): Promise<HeatmapSummary | null> {
  try {
    const raw = await AsyncStorage.getItem(HEATMAP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Cache valid for 5 minutes
    const age = Date.now() - new Date(parsed.cachedAt).getTime();
    if (age > 5 * 60 * 1000) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

// ── Recommendation Engine ──────────────────────────────────────────
export interface PracticeRecommendation {
  type: "weak_word" | "declining_word" | "new_category" | "review";
  word?: string;
  category?: DuelCategory;
  language: string;
  reason: string;
  priority: number; // 1 = highest
}

export function generateRecommendations(summary: HeatmapSummary): PracticeRecommendation[] {
  const recs: PracticeRecommendation[] = [];

  for (const langMap of summary.languages) {
    // Struggling words first
    const struggling = langMap.cells
      .filter(c => c.intensity === "struggling")
      .slice(0, 3);
    for (const cell of struggling) {
      recs.push({
        type: "weak_word",
        word: cell.word,
        language: langMap.language,
        reason: `"${cell.word}" averages ${cell.averageScore}% — needs focused practice`,
        priority: 1,
      });
    }

    // Declining words
    const declining = langMap.cells
      .filter(c => c.recentTrend === "declining" && c.attempts >= 3)
      .slice(0, 2);
    for (const cell of declining) {
      recs.push({
        type: "declining_word",
        word: cell.word,
        language: langMap.language,
        reason: `"${cell.word}" scores are declining — review before it slips`,
        priority: 2,
      });
    }

    // Weak categories
    const weakCats = langMap.categoryStats
      .filter(c => c.averageScore < 55 && c.totalAttempts > 0);
    for (const cat of weakCats) {
      recs.push({
        type: "new_category",
        category: cat.category,
        language: langMap.language,
        reason: `${cat.label} averages ${cat.averageScore}% — try more drills`,
        priority: 3,
      });
    }

    // Untried categories
    const untriedCats = langMap.categoryStats
      .filter(c => c.totalAttempts === 0);
    for (const cat of untriedCats) {
      recs.push({
        type: "new_category",
        category: cat.category,
        language: langMap.language,
        reason: `You haven't tried ${cat.label} yet — give it a go!`,
        priority: 4,
      });
    }
  }

  return recs.sort((a, b) => a.priority - b.priority);
}
