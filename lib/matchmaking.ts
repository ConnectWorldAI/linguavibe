/**
 * Matchmaking System
 * 
 * ELO-based skill rating system for pronunciation duel matchmaking.
 * Provides skill-based queue filtering, rank tiers, and fair opponent matching.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const MATCHMAKING_PROFILE_KEY = "@connectworld_matchmaking_profile";
const MATCH_HISTORY_KEY = "@connectworld_match_history";

// ELO Constants
const BASE_RATING = 1000;
const K_FACTOR_NEW = 40; // Higher K for new players (first 10 games)
const K_FACTOR_NORMAL = 20;
const K_FACTOR_VETERAN = 10; // Lower K for experienced players (50+ games)
const PLACEMENT_GAMES = 10;
const VETERAN_GAMES = 50;

// Matchmaking queue constants
const MAX_RATING_DIFF_INITIAL = 100; // Start searching within 100 ELO
const RATING_DIFF_EXPANSION_RATE = 50; // Expand by 50 every 10 seconds
const MAX_RATING_DIFF_CAP = 500; // Never match beyond 500 ELO difference
const QUEUE_TIMEOUT_MS = 60000; // 60 second queue timeout

export type RankTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master";

export interface RankInfo {
  tier: RankTier;
  label: string;
  icon: string;
  color: string;
  minRating: number;
  maxRating: number;
}

export interface MatchmakingProfile {
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestWinStreak: number;
  rankTier: RankTier;
  lastMatchDate: string | null;
  placementGamesRemaining: number;
  preferredLanguage: string;
  preferredDifficulty: "easy" | "medium" | "hard" | "any";
}

export interface MatchHistoryEntry {
  id: string;
  date: string;
  opponentName: string;
  opponentRating: number;
  myScore: number;
  opponentScore: number;
  result: "win" | "loss" | "draw";
  ratingChange: number;
  language: string;
}

export interface QueueStatus {
  inQueue: boolean;
  queueStartTime: number;
  currentWaitSeconds: number;
  searchRadius: number;
  estimatedWaitSeconds: number;
  playersInRange: number;
}

export interface MatchmakingCandidate {
  id: string;
  name: string;
  rating: number;
  rankTier: RankTier;
  gamesPlayed: number;
  winRate: number;
  language: string;
}

// Rank tier definitions
export const RANK_TIERS: RankInfo[] = [
  { tier: "bronze", label: "Bronze", icon: "🥉", color: "#CD7F32", minRating: 0, maxRating: 799 },
  { tier: "silver", label: "Silver", icon: "🥈", color: "#C0C0C0", minRating: 800, maxRating: 1099 },
  { tier: "gold", label: "Gold", icon: "🥇", color: "#FFD700", minRating: 1100, maxRating: 1399 },
  { tier: "platinum", label: "Platinum", icon: "💠", color: "#00CED1", minRating: 1400, maxRating: 1699 },
  { tier: "diamond", label: "Diamond", icon: "💎", color: "#B9F2FF", minRating: 1700, maxRating: 1999 },
  { tier: "master", label: "Master", icon: "👑", color: "#FF4500", minRating: 2000, maxRating: 9999 },
];

/**
 * Get the rank tier for a given rating
 */
export function getRankForRating(rating: number): RankInfo {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (rating >= RANK_TIERS[i].minRating) return RANK_TIERS[i];
  }
  return RANK_TIERS[0];
}

/**
 * Get the K-factor based on games played
 */
function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < PLACEMENT_GAMES) return K_FACTOR_NEW;
  if (gamesPlayed >= VETERAN_GAMES) return K_FACTOR_VETERAN;
  return K_FACTOR_NORMAL;
}

/**
 * Calculate expected score using ELO formula
 */
function expectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Calculate new ELO rating after a match
 */
export function calculateNewRating(
  playerRating: number,
  opponentRating: number,
  result: "win" | "loss" | "draw",
  gamesPlayed: number
): { newRating: number; change: number } {
  const k = getKFactor(gamesPlayed);
  const expected = expectedScore(playerRating, opponentRating);
  const actual = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
  const change = Math.round(k * (actual - expected));
  const newRating = Math.max(0, playerRating + change);
  return { newRating, change };
}

/**
 * Calculate the current search radius based on wait time
 */
export function getSearchRadius(waitTimeSeconds: number): number {
  const expansions = Math.floor(waitTimeSeconds / 10);
  const radius = MAX_RATING_DIFF_INITIAL + expansions * RATING_DIFF_EXPANSION_RATE;
  return Math.min(radius, MAX_RATING_DIFF_CAP);
}

/**
 * Check if two players are within matchmaking range
 */
export function isValidMatch(
  playerRating: number,
  candidateRating: number,
  searchRadius: number
): boolean {
  return Math.abs(playerRating - candidateRating) <= searchRadius;
}

/**
 * Score a candidate for matchmaking quality (lower = better match)
 */
export function matchQualityScore(
  playerRating: number,
  candidateRating: number,
  playerLanguage: string,
  candidateLanguage: string
): number {
  const ratingDiff = Math.abs(playerRating - candidateRating);
  const languageBonus = playerLanguage === candidateLanguage ? 0 : 200;
  return ratingDiff + languageBonus;
}

/**
 * Get estimated wait time based on rating and time of day
 */
export function getEstimatedWaitTime(rating: number): number {
  // Higher/lower ratings have longer wait times
  const distanceFromMedian = Math.abs(rating - 1100);
  const baseWait = 10; // 10 seconds base
  const ratingPenalty = Math.floor(distanceFromMedian / 200) * 5;
  return baseWait + ratingPenalty;
}

/**
 * Load matchmaking profile from storage
 */
export async function getMatchmakingProfile(): Promise<MatchmakingProfile> {
  try {
    const stored = await AsyncStorage.getItem(MATCHMAKING_PROFILE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return createDefaultProfile();
}

/**
 * Create a default matchmaking profile
 */
function createDefaultProfile(): MatchmakingProfile {
  return {
    rating: BASE_RATING,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    bestWinStreak: 0,
    rankTier: "silver",
    lastMatchDate: null,
    placementGamesRemaining: PLACEMENT_GAMES,
    preferredLanguage: "spanish",
    preferredDifficulty: "any",
  };
}

/**
 * Save matchmaking profile
 */
export async function saveMatchmakingProfile(profile: MatchmakingProfile): Promise<void> {
  await AsyncStorage.setItem(MATCHMAKING_PROFILE_KEY, JSON.stringify(profile));
}

/**
 * Record a match result and update ELO
 */
export async function recordMatchResult(
  opponentName: string,
  opponentRating: number,
  myScore: number,
  opponentScore: number,
  language: string
): Promise<{ profile: MatchmakingProfile; ratingChange: number }> {
  const profile = await getMatchmakingProfile();
  const result: "win" | "loss" | "draw" =
    myScore > opponentScore ? "win" : myScore < opponentScore ? "loss" : "draw";

  const { newRating, change } = calculateNewRating(
    profile.rating,
    opponentRating,
    result,
    profile.gamesPlayed
  );

  // Update profile
  profile.rating = newRating;
  profile.gamesPlayed += 1;
  profile.lastMatchDate = new Date().toISOString();
  profile.rankTier = getRankForRating(newRating).tier;

  if (profile.placementGamesRemaining > 0) {
    profile.placementGamesRemaining -= 1;
  }

  if (result === "win") {
    profile.wins += 1;
    profile.winStreak += 1;
    profile.bestWinStreak = Math.max(profile.bestWinStreak, profile.winStreak);
  } else if (result === "loss") {
    profile.losses += 1;
    profile.winStreak = 0;
  } else {
    profile.draws += 1;
  }

  await saveMatchmakingProfile(profile);

  // Save to match history
  const entry: MatchHistoryEntry = {
    id: Date.now().toString(36),
    date: new Date().toISOString(),
    opponentName,
    opponentRating,
    myScore,
    opponentScore,
    result,
    ratingChange: change,
    language,
  };
  await addMatchHistoryEntry(entry);

  return { profile, ratingChange: change };
}

/**
 * Get match history
 */
export async function getMatchHistory(): Promise<MatchHistoryEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(MATCH_HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

/**
 * Add an entry to match history
 */
async function addMatchHistoryEntry(entry: MatchHistoryEntry): Promise<void> {
  const history = await getMatchHistory();
  history.unshift(entry);
  // Keep last 100 matches
  const trimmed = history.slice(0, 100);
  await AsyncStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(trimmed));
}

/**
 * Get win rate as a percentage
 */
export function getWinRate(profile: MatchmakingProfile): number {
  if (profile.gamesPlayed === 0) return 0;
  return Math.round((profile.wins / profile.gamesPlayed) * 100);
}

/**
 * Get progress to next rank as a percentage (0-100)
 */
export function getRankProgress(rating: number): number {
  const currentRank = getRankForRating(rating);
  const range = currentRank.maxRating - currentRank.minRating;
  if (range === 0) return 100;
  const progress = ((rating - currentRank.minRating) / range) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

/**
 * Generate simulated opponents for local/demo matchmaking
 */
export function generateSimulatedOpponents(
  playerRating: number,
  count: number = 5,
  language: string = "spanish"
): MatchmakingCandidate[] {
  const names = [
    "Maria S.", "Carlos R.", "Yuki T.", "Hans M.", "Sophie L.",
    "Ahmed K.", "Priya N.", "Lucas B.", "Mei W.", "Diego F.",
    "Emma J.", "Kenji H.", "Isabella V.", "Liam O.", "Aisha B.",
  ];

  return Array.from({ length: count }, (_, i) => {
    const ratingOffset = Math.floor((Math.random() - 0.5) * 300);
    const rating = Math.max(100, playerRating + ratingOffset);
    const gamesPlayed = Math.floor(Math.random() * 80) + 5;
    const winRate = Math.floor(Math.random() * 40) + 30;
    return {
      id: `sim_${i}_${Date.now()}`,
      name: names[i % names.length],
      rating,
      rankTier: getRankForRating(rating).tier,
      gamesPlayed,
      winRate,
      language,
    };
  });
}

/**
 * Find the best match from a list of candidates
 */
export function findBestMatch(
  playerRating: number,
  playerLanguage: string,
  candidates: MatchmakingCandidate[],
  searchRadius: number
): MatchmakingCandidate | null {
  const validCandidates = candidates.filter((c) =>
    isValidMatch(playerRating, c.rating, searchRadius)
  );

  if (validCandidates.length === 0) return null;

  // Sort by match quality (closest rating + same language preferred)
  validCandidates.sort(
    (a, b) =>
      matchQualityScore(playerRating, a.rating, playerLanguage, a.language) -
      matchQualityScore(playerRating, b.rating, playerLanguage, b.language)
  );

  return validCandidates[0];
}

/**
 * Queue status helper for UI
 */
export function createQueueStatus(
  inQueue: boolean,
  queueStartTime: number,
  playerRating: number
): QueueStatus {
  const currentWaitSeconds = inQueue ? Math.floor((Date.now() - queueStartTime) / 1000) : 0;
  return {
    inQueue,
    queueStartTime,
    currentWaitSeconds,
    searchRadius: getSearchRadius(currentWaitSeconds),
    estimatedWaitSeconds: getEstimatedWaitTime(playerRating),
    playersInRange: Math.max(1, Math.floor(Math.random() * 12) + 3), // Simulated
  };
}

/**
 * Check if queue has timed out
 */
export function isQueueTimedOut(queueStartTime: number): boolean {
  return Date.now() - queueStartTime > QUEUE_TIMEOUT_MS;
}

/**
 * Update preferred matchmaking settings
 */
export async function updateMatchmakingPreferences(
  updates: Partial<Pick<MatchmakingProfile, "preferredLanguage" | "preferredDifficulty">>
): Promise<MatchmakingProfile> {
  const profile = await getMatchmakingProfile();
  Object.assign(profile, updates);
  await saveMatchmakingProfile(profile);
  return profile;
}
