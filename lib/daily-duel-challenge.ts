/**
 * Daily Duel Challenge — Word of the Day system
 * Auto-generates daily pronunciation challenges that users can share
 * to create viral content loops.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type DuelWord, type DuelCategory, type DuelDifficulty } from "./pronunciation-duel";
import { getLanguageDuelWords, SUPPORTED_DUEL_LANGUAGES } from "./word-banks";

// ── Types ──────────────────────────────────────────────────────────
export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  word: DuelWord;
  language: string;
  category: DuelCategory;
  difficulty: DuelDifficulty;
  bonusWords: DuelWord[]; // 2 extra words for bonus rounds
  theme: string; // e.g., "Tongue Twister Tuesday", "Verb Vortex"
  shareMessage: string;
  hashtags: string[];
  expiresAt: string;
  completedBy: number; // simulated community count
}

export interface DailyChallengeAttempt {
  challengeId: string;
  date: string;
  score: number;
  transcript: string;
  bonusScores: number[];
  totalScore: number;
  rank: "gold" | "silver" | "bronze" | "participant";
  completedAt: string;
}

export interface DailyChallengeStreak {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
  totalCompleted: number;
}

// ── Constants ──────────────────────────────────────────────────────
const DAILY_CHALLENGE_KEY = "@daily_duel_challenge";
const DAILY_ATTEMPT_KEY = "@daily_duel_attempts";
const DAILY_STREAK_KEY = "@daily_duel_streak";

const DAILY_THEMES: { day: number; theme: string; category: DuelCategory }[] = [
  { day: 0, theme: "Sunday Sounds", category: "abcs" },
  { day: 1, theme: "Verb Vortex Monday", category: "verbs_present" },
  { day: 2, theme: "Tongue Twister Tuesday", category: "adjectives" },
  { day: 3, theme: "Word Workout Wednesday", category: "numbers" },
  { day: 4, theme: "Tense Throwdown Thursday", category: "verbs_past" },
  { day: 5, theme: "Future Friday", category: "verbs_future" },
  { day: 6, theme: "Saturday Sprint", category: "adjectives" },
];

// ── Deterministic seed from date ───────────────────────────────────
function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ── Generate Daily Challenge ───────────────────────────────────────
export function generateDailyChallenge(
  date: string = new Date().toISOString().split("T")[0],
  preferredLanguage: string = "Spanish"
): DailyChallenge {
  const seed = dateToSeed(date);
  const rng = seededRandom(seed);
  const dayOfWeek = new Date(date + "T12:00:00Z").getDay();
  const themeInfo = DAILY_THEMES[dayOfWeek];

  // Pick language — rotate through supported languages based on seed
  const languages = SUPPORTED_DUEL_LANGUAGES.map(l => l.id);
  const langIndex = Math.floor(rng() * languages.length);
  const language = languages.includes(preferredLanguage as DuelLanguage) ? preferredLanguage : languages[langIndex];

  // Get words for the category
  const allWords = getLanguageDuelWords(language as any, "word_flash", themeInfo.category);
  if (allWords.length === 0) {
    // Fallback to abcs
    const fallbackWords = getLanguageDuelWords(language as any, "abcs", "food" as any);
    return createChallengeFromWords(date, fallbackWords, language, "abcs", themeInfo.theme, rng);
  }

  return createChallengeFromWords(date, allWords, language, themeInfo.category, themeInfo.theme, rng);
}

function createChallengeFromWords(
  date: string,
  words: DuelWord[],
  language: string,
  category: DuelCategory,
  theme: string,
  rng: () => number
): DailyChallenge {
  // Shuffle words deterministically
  const shuffled = [...words].sort(() => rng() - 0.5);
  const mainWord = shuffled[0];
  const bonusWords = shuffled.slice(1, 3);

  const difficulties: DuelDifficulty[] = ["easy", "medium", "hard"];
  const difficulty = difficulties[Math.floor(rng() * 3)];

  const shareMessage = `Can you pronounce "${mainWord.text}" (${mainWord.phonetic}) in ${language}? Take today's Daily Duel Challenge!`;
  const hashtags = [
    "#LinguaVibe",
    "#DailyDuel",
    `#${language}`,
    "#PronunciationChallenge",
    `#${theme.replace(/\s+/g, "")}`,
  ];

  // Simulated community participation (grows with date)
  const daysSinceEpoch = Math.floor(new Date(date).getTime() / 86400000);
  const completedBy = 100 + Math.floor(rng() * 500) + (daysSinceEpoch % 200);

  const expiresAt = new Date(date + "T23:59:59Z").toISOString();

  return {
    id: `daily-${date}`,
    date,
    word: mainWord,
    language,
    category,
    difficulty,
    bonusWords,
    theme,
    shareMessage,
    hashtags,
    expiresAt,
    completedBy,
  };
}

// ── Persistence ────────────────────────────────────────────────────
export async function saveDailyChallenge(challenge: DailyChallenge): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(challenge));
  } catch {}
}

export async function getCachedDailyChallenge(): Promise<DailyChallenge | null> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_CHALLENGE_KEY);
    if (!raw) return null;
    const challenge: DailyChallenge = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    if (challenge.date !== today) return null; // Expired
    return challenge;
  } catch {
    return null;
  }
}

export async function getTodaysChallenge(preferredLanguage?: string): Promise<DailyChallenge> {
  const cached = await getCachedDailyChallenge();
  if (cached) return cached;
  const today = new Date().toISOString().split("T")[0];
  const challenge = generateDailyChallenge(today, preferredLanguage);
  await saveDailyChallenge(challenge);
  return challenge;
}

// ── Attempts ───────────────────────────────────────────────────────
export async function saveDailyChallengeAttempt(attempt: DailyChallengeAttempt): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_ATTEMPT_KEY);
    const attempts: DailyChallengeAttempt[] = raw ? JSON.parse(raw) : [];
    attempts.push(attempt);
    // Keep last 90 days
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const filtered = attempts.filter(a => new Date(a.completedAt).getTime() > cutoff);
    await AsyncStorage.setItem(DAILY_ATTEMPT_KEY, JSON.stringify(filtered));
  } catch {}
}

export async function getDailyChallengeAttempts(): Promise<DailyChallengeAttempt[]> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_ATTEMPT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getTodaysAttempt(): Promise<DailyChallengeAttempt | null> {
  const today = new Date().toISOString().split("T")[0];
  const attempts = await getDailyChallengeAttempts();
  return attempts.find(a => a.date === today) || null;
}

// ── Streak ─────────────────────────────────────────────────────────
export async function getDailyChallengeStreak(): Promise<DailyChallengeStreak> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { current: 0, longest: 0, lastCompletedDate: null, totalCompleted: 0 };
}

export async function updateDailyChallengeStreak(): Promise<DailyChallengeStreak> {
  const streak = await getDailyChallengeStreak();
  const today = new Date().toISOString().split("T")[0];

  if (streak.lastCompletedDate === today) return streak; // Already updated today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (streak.lastCompletedDate === yesterday) {
    streak.current += 1;
  } else {
    streak.current = 1;
  }

  streak.longest = Math.max(streak.longest, streak.current);
  streak.lastCompletedDate = today;
  streak.totalCompleted += 1;

  try {
    await AsyncStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(streak));
  } catch {}
  return streak;
}

// ── Score → Rank ───────────────────────────────────────────────────
export function calculateRank(totalScore: number): "gold" | "silver" | "bronze" | "participant" {
  if (totalScore >= 270) return "gold";    // 90+ avg across 3 words
  if (totalScore >= 210) return "silver";  // 70+ avg
  if (totalScore >= 150) return "bronze";  // 50+ avg
  return "participant";
}

export function getRankColor(rank: "gold" | "silver" | "bronze" | "participant"): string {
  switch (rank) {
    case "gold": return "#FFD700";
    case "silver": return "#C0C0C0";
    case "bronze": return "#CD7F32";
    case "participant": return "#7EB8E0";
  }
}

export function getRankEmoji(rank: "gold" | "silver" | "bronze" | "participant"): string {
  switch (rank) {
    case "gold": return "🥇";
    case "silver": return "🥈";
    case "bronze": return "🥉";
    case "participant": return "⭐";
  }
}

// ── Share Content Generation ───────────────────────────────────────
export function generateShareContent(
  challenge: DailyChallenge,
  attempt: DailyChallengeAttempt
): { text: string; hashtags: string } {
  const rankEmoji = getRankEmoji(attempt.rank);
  const text = `${rankEmoji} I scored ${attempt.totalScore}/300 on today's LinguaVibe Daily Duel!\n\nWord: "${challenge.word.text}" (${challenge.word.phonetic})\nLanguage: ${challenge.language}\nTheme: ${challenge.theme}\n\nCan you beat my score?`;
  const hashtags = challenge.hashtags.join(" ");
  return { text, hashtags };
}
