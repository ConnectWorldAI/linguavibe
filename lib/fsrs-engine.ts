/**
 * FSRS (Free Spaced Repetition Scheduler) Engine
 *
 * A modern, evidence-based spaced repetition algorithm that replaces SM-2.
 * Based on the FSRS-4.5 algorithm by Jarrett Ye, which models memory with
 * two key parameters:
 *   - Stability (S): How long a memory will last (in days)
 *   - Difficulty (D): How hard the material is to learn (0-10 scale)
 *
 * FSRS uses a power-law forgetting curve: R = (1 + t / (9 * S))^(-1)
 * where R = retrievability, t = days since last review, S = stability.
 *
 * Key advantages over SM-2:
 *   - More accurate forgetting curve model
 *   - Separate difficulty and stability parameters
 *   - Better handling of lapses (failed reviews)
 *   - Desired retention rate is configurable
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Storage ─────────────────────────────────────────────────────────────────
const FSRS_STORAGE_KEY = "linguavibe_fsrs_data";
const FSRS_SETTINGS_KEY = "linguavibe_fsrs_settings";

// ─── FSRS Parameters (FSRS-4.5 defaults) ────────────────────────────────────
// These 17 parameters control the algorithm behavior.
// They can be optimized per-user with enough review data.
const DEFAULT_PARAMS = {
  w: [
    0.4, 0.6, 2.4, 5.8,  // Initial stability for Again/Hard/Good/Easy
    4.93, 0.94, 0.86, 0.01, // Difficulty parameters
    1.49, 0.14, 0.94,       // Stability after failure
    2.18, 0.05, 0.34,       // Stability increase factors
    1.26, 0.29, 2.61,       // Difficulty adjustment factors
  ],
  desiredRetention: 0.9, // Target 90% recall rate
  maximumInterval: 365,
  enableFuzz: true, // Add small random offset to prevent clustering
};

// ─── Types ───────────────────────────────────────────────────────────────────
export type FSRSRating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export const FSRS_RATING_LABELS: Record<FSRSRating, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

export type CardState = "new" | "learning" | "review" | "relearning";

export interface FSRSCard {
  id: string;
  // Content identification
  exerciseType: string;
  topic: string;
  subtopic?: string;
  language: string;
  front: string; // Question/prompt
  back: string; // Answer
  // FSRS core parameters
  state: CardState;
  difficulty: number; // 0-10 scale
  stability: number; // Days until retention drops to desired level
  retrievability: number; // Current recall probability (0-1)
  // Scheduling
  scheduledDays: number; // Days until next review
  elapsedDays: number; // Days since last review
  nextReviewDate: string; // ISO date
  lastReviewDate: string; // ISO date
  // Tracking
  reps: number; // Total successful reviews
  lapses: number; // Total failures (rated "Again")
  totalReviews: number;
  createdAt: string;
  // Learning context
  tags: string[];
  notes?: string;
}

export interface FSRSState {
  cards: FSRSCard[];
  dailyNewLimit: number;
  dailyReviewLimit: number;
  newToday: number;
  reviewsToday: number;
  lastResetDate: string;
  totalReviewsAllTime: number;
}

export interface FSRSSettings {
  desiredRetention: number; // 0.7 - 0.97
  maximumInterval: number;
  enableFuzz: boolean;
  newCardsPerDay: number;
  reviewsPerDay: number;
  // Learning steps (minutes) before card graduates to review
  learningSteps: number[];
  // Relearning steps (minutes) after a lapse
  relearningSteps: number[];
}

export interface ReviewLog {
  cardId: string;
  rating: FSRSRating;
  state: CardState;
  scheduledDays: number;
  elapsedDays: number;
  stability: number;
  difficulty: number;
  reviewedAt: string;
}

export interface SchedulingResult {
  card: FSRSCard;
  again: { card: FSRSCard; interval: number };
  hard: { card: FSRSCard; interval: number };
  good: { card: FSRSCard; interval: number };
  easy: { card: FSRSCard; interval: number };
}

// ─── Default State ───────────────────────────────────────────────────────────
const DEFAULT_STATE: FSRSState = {
  cards: [],
  dailyNewLimit: 20,
  dailyReviewLimit: 200,
  newToday: 0,
  reviewsToday: 0,
  lastResetDate: new Date().toISOString().split("T")[0],
  totalReviewsAllTime: 0,
};

const DEFAULT_SETTINGS: FSRSSettings = {
  desiredRetention: 0.9,
  maximumInterval: 365,
  enableFuzz: true,
  newCardsPerDay: 20,
  reviewsPerDay: 200,
  learningSteps: [1, 10], // 1 min, 10 min
  relearningSteps: [10], // 10 min
};

// ─── Core FSRS Algorithm ─────────────────────────────────────────────────────

/**
 * FSRS forgetting curve: R = (1 + t / (9 * S))^(-1)
 * Returns the probability of recall after t days with stability S
 */
export function forgettingCurve(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

/**
 * Calculate the interval needed to reach desired retention
 * Inverse of forgetting curve: t = 9 * S * (R^(-1) - 1)
 */
function intervalFromRetention(stability: number, desiredRetention: number): number {
  return Math.round(9 * stability * (Math.pow(desiredRetention, -1) - 1));
}

/**
 * Initialize difficulty for a new card based on first rating
 */
function initDifficulty(rating: FSRSRating): number {
  const w = DEFAULT_PARAMS.w;
  // D0(G) = w[4] - (G - 3) * w[5]
  return clamp(w[4] - (rating - 3) * w[5], 1, 10);
}

/**
 * Initialize stability for a new card based on first rating
 */
function initStability(rating: FSRSRating): number {
  const w = DEFAULT_PARAMS.w;
  // S0(G) = w[G-1]
  return Math.max(w[rating - 1], 0.1);
}

/**
 * Update difficulty after a review
 */
function nextDifficulty(d: number, rating: FSRSRating): number {
  const w = DEFAULT_PARAMS.w;
  // D' = w[7] * D0(3) + (1 - w[7]) * (D - w[6] * (G - 3))
  const d0 = w[4]; // D0(3) = w[4]
  const newD = w[7] * d0 + (1 - w[7]) * (d - w[6] * (rating - 3));
  return clamp(newD, 1, 10);
}

/**
 * Calculate new stability after a successful review (rating >= 2)
 */
function nextRecallStability(d: number, s: number, r: number, rating: FSRSRating): number {
  const w = DEFAULT_PARAMS.w;
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;

  // S'_r = S * (e^(w[8]) * (11 - D) * S^(-w[9]) * (e^(w[10] * (1 - R)) - 1) * hardPenalty * easyBonus + 1)
  const factor = Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp(w[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;

  return Math.max(s * (factor + 1), 0.1);
}

/**
 * Calculate new stability after a lapse (rating = 1, "Again")
 */
function nextForgetStability(d: number, s: number, r: number): number {
  const w = DEFAULT_PARAMS.w;
  // S'_f = w[11] * D^(-w[12]) * ((S + 1)^w[13] - 1) * e^(w[14] * (1 - R))
  const newS = w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r));

  return Math.max(Math.min(newS, s), 0.1); // Never exceed previous stability
}

/**
 * Add fuzz to interval to prevent card clustering
 */
function applyFuzz(interval: number): number {
  if (!DEFAULT_PARAMS.enableFuzz || interval < 2.5) return Math.round(interval);
  const fuzzFactor = 0.05;
  const minIvl = Math.max(2, Math.round(interval * (1 - fuzzFactor)));
  const maxIvl = Math.round(interval * (1 + fuzzFactor));
  return minIvl + Math.floor(Math.random() * (maxIvl - minIvl + 1));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Scheduling ──────────────────────────────────────────────────────────────

/**
 * Generate scheduling options for all 4 ratings
 * Returns the predicted next state for each possible rating
 */
export function getSchedulingOptions(card: FSRSCard): SchedulingResult {
  const now = new Date();
  const lastReview = new Date(card.lastReviewDate);
  const elapsedDays = Math.max(0, (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
  const currentR = forgettingCurve(elapsedDays, card.stability);
  const dr = DEFAULT_PARAMS.desiredRetention;
  const maxIvl = DEFAULT_PARAMS.maximumInterval;

  const results: Record<FSRSRating, { card: FSRSCard; interval: number }> = {} as any;

  for (const rating of [1, 2, 3, 4] as FSRSRating[]) {
    let newS: number;
    let newD: number;
    let newState: CardState;
    let interval: number;

    if (card.state === "new") {
      // First review of a new card
      newS = initStability(rating);
      newD = initDifficulty(rating);
      newState = rating === 1 ? "learning" : "review";
      interval = rating === 1 ? 0 : Math.min(intervalFromRetention(newS, dr), maxIvl);
    } else if (rating === 1) {
      // Lapse — card goes to relearning
      newS = nextForgetStability(card.difficulty, card.stability, currentR);
      newD = nextDifficulty(card.difficulty, rating);
      newState = "relearning";
      interval = 0; // Review again soon
    } else {
      // Successful review
      newS = nextRecallStability(card.difficulty, card.stability, currentR, rating);
      newD = nextDifficulty(card.difficulty, rating);
      newState = "review";
      interval = Math.min(intervalFromRetention(newS, dr), maxIvl);
    }

    interval = applyFuzz(interval);

    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + interval);

    results[rating] = {
      card: {
        ...card,
        state: newState,
        difficulty: Math.round(newD * 100) / 100,
        stability: Math.round(newS * 100) / 100,
        retrievability: Math.round(forgettingCurve(0, newS) * 1000) / 1000,
        scheduledDays: interval,
        elapsedDays: Math.round(elapsedDays * 10) / 10,
        nextReviewDate: nextDate.toISOString(),
        lastReviewDate: now.toISOString(),
        reps: rating >= 2 ? card.reps + 1 : card.reps,
        lapses: rating === 1 ? card.lapses + 1 : card.lapses,
        totalReviews: card.totalReviews + 1,
      },
      interval,
    };
  }

  return {
    card,
    again: results[1],
    hard: results[2],
    good: results[3],
    easy: results[4],
  };
}

/**
 * Format interval for display: "< 1m", "10m", "1d", "3d", "2w", "1mo"
 */
export function formatInterval(days: number): string {
  if (days < 1 / 1440) return "< 1m";
  if (days < 1 / 24) return `${Math.round(days * 1440)}m`;
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 7) return `${Math.round(days)}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

// ─── State Management ────────────────────────────────────────────────────────

async function loadFSRSState(): Promise<FSRSState> {
  try {
    const raw = await AsyncStorage.getItem(FSRS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const state: FSRSState = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    if (state.lastResetDate !== today) {
      state.newToday = 0;
      state.reviewsToday = 0;
      state.lastResetDate = today;
    }
    return state;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

async function saveFSRSState(state: FSRSState): Promise<void> {
  await AsyncStorage.setItem(FSRS_STORAGE_KEY, JSON.stringify(state));
}

export async function getFSRSSettings(): Promise<FSRSSettings> {
  try {
    const raw = await AsyncStorage.getItem(FSRS_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export async function updateFSRSSettings(updates: Partial<FSRSSettings>): Promise<FSRSSettings> {
  const current = await getFSRSSettings();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(FSRS_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

// ─── Card Operations ─────────────────────────────────────────────────────────

export async function addFSRSCard(params: {
  exerciseType: string;
  topic: string;
  subtopic?: string;
  language: string;
  front: string;
  back: string;
  tags?: string[];
  notes?: string;
}): Promise<FSRSCard> {
  const state = await loadFSRSState();
  const now = new Date().toISOString();

  // Check for existing card
  const existing = state.cards.find(
    (c) => c.exerciseType === params.exerciseType && c.topic === params.topic && c.subtopic === params.subtopic
  );
  if (existing) {
    // Reset to new state
    existing.state = "new";
    existing.stability = 0;
    existing.difficulty = 5;
    existing.nextReviewDate = now;
    existing.notes = params.notes || existing.notes;
    await saveFSRSState(state);
    return existing;
  }

  const card: FSRSCard = {
    id: `fsrs_${params.exerciseType}_${params.topic}_${Date.now()}`,
    exerciseType: params.exerciseType,
    topic: params.topic,
    subtopic: params.subtopic,
    language: params.language,
    front: params.front,
    back: params.back,
    state: "new",
    difficulty: 5, // Mid-range default
    stability: 0,
    retrievability: 0,
    scheduledDays: 0,
    elapsedDays: 0,
    nextReviewDate: now,
    lastReviewDate: now,
    reps: 0,
    lapses: 0,
    totalReviews: 0,
    createdAt: now,
    tags: params.tags || [params.exerciseType, params.language],
    notes: params.notes,
  };

  state.cards.push(card);
  await saveFSRSState(state);
  return card;
}

export async function reviewFSRSCard(cardId: string, rating: FSRSRating): Promise<FSRSCard | null> {
  const state = await loadFSRSState();
  const cardIndex = state.cards.findIndex((c) => c.id === cardId);
  if (cardIndex < 0) return null;

  const card = state.cards[cardIndex];
  const scheduling = getSchedulingOptions(card);

  const ratingMap: Record<FSRSRating, { card: FSRSCard; interval: number }> = {
    1: scheduling.again,
    2: scheduling.hard,
    3: scheduling.good,
    4: scheduling.easy,
  };

  const result = ratingMap[rating];
  state.cards[cardIndex] = result.card;
  state.reviewsToday += 1;
  state.totalReviewsAllTime += 1;

  await saveFSRSState(state);
  return result.card;
}

export async function getDueFSRSCards(): Promise<FSRSCard[]> {
  const state = await loadFSRSState();
  const settings = await getFSRSSettings();
  const now = new Date();

  // Get new cards (limited by daily cap)
  const newCards = state.cards
    .filter((c) => c.state === "new")
    .slice(0, Math.max(0, settings.newCardsPerDay - state.newToday));

  // Get learning/relearning cards (always show)
  const learningCards = state.cards.filter(
    (c) => (c.state === "learning" || c.state === "relearning") && new Date(c.nextReviewDate) <= now
  );

  // Get review cards (limited by daily cap)
  const reviewCards = state.cards
    .filter((c) => c.state === "review" && new Date(c.nextReviewDate) <= now)
    .sort((a, b) => {
      // Sort by retrievability (lowest first = most urgent)
      const aR = forgettingCurve(
        (now.getTime() - new Date(a.lastReviewDate).getTime()) / (1000 * 60 * 60 * 24),
        a.stability
      );
      const bR = forgettingCurve(
        (now.getTime() - new Date(b.lastReviewDate).getTime()) / (1000 * 60 * 60 * 24),
        b.stability
      );
      return aR - bR;
    })
    .slice(0, Math.max(0, settings.reviewsPerDay - state.reviewsToday));

  // Interleave: learning first, then new, then reviews
  return [...learningCards, ...newCards, ...reviewCards];
}

export async function getFSRSStats(): Promise<{
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueToday: number;
  reviewedToday: number;
  averageRetention: number;
  averageDifficulty: number;
  matureCards: number;
  lapseRate: number;
  totalReviewsAllTime: number;
  retentionByDifficulty: { easy: number; medium: number; hard: number };
}> {
  const state = await loadFSRSState();
  const now = new Date();

  const newCards = state.cards.filter((c) => c.state === "new");
  const learningCards = state.cards.filter((c) => c.state === "learning" || c.state === "relearning");
  const reviewCards = state.cards.filter((c) => c.state === "review");
  const matureCards = reviewCards.filter((c) => c.stability > 21);

  const dueCards = state.cards.filter((c) => new Date(c.nextReviewDate) <= now);

  // Calculate average retention
  const retentions = reviewCards.map((c) => {
    const elapsed = (now.getTime() - new Date(c.lastReviewDate).getTime()) / (1000 * 60 * 60 * 24);
    return forgettingCurve(elapsed, c.stability);
  });
  const avgRetention = retentions.length > 0
    ? retentions.reduce((s, r) => s + r, 0) / retentions.length
    : 1;

  // Average difficulty
  const avgDifficulty = state.cards.length > 0
    ? state.cards.reduce((s, c) => s + c.difficulty, 0) / state.cards.length
    : 5;

  // Lapse rate
  const totalLapses = state.cards.reduce((s, c) => s + c.lapses, 0);
  const totalReviews = state.cards.reduce((s, c) => s + c.totalReviews, 0);
  const lapseRate = totalReviews > 0 ? totalLapses / totalReviews : 0;

  // Retention by difficulty bucket
  const easyCards = reviewCards.filter((c) => c.difficulty <= 3.5);
  const medCards = reviewCards.filter((c) => c.difficulty > 3.5 && c.difficulty <= 7);
  const hardCards = reviewCards.filter((c) => c.difficulty > 7);

  const retByDiff = (cards: FSRSCard[]) => {
    if (cards.length === 0) return 1;
    return cards.reduce((s, c) => {
      const el = (now.getTime() - new Date(c.lastReviewDate).getTime()) / (1000 * 60 * 60 * 24);
      return s + forgettingCurve(el, c.stability);
    }, 0) / cards.length;
  };

  return {
    totalCards: state.cards.length,
    newCards: newCards.length,
    learningCards: learningCards.length,
    reviewCards: reviewCards.length,
    dueToday: dueCards.length,
    reviewedToday: state.reviewsToday,
    averageRetention: Math.round(avgRetention * 100),
    averageDifficulty: Math.round(avgDifficulty * 10) / 10,
    matureCards: matureCards.length,
    lapseRate: Math.round(lapseRate * 100),
    totalReviewsAllTime: state.totalReviewsAllTime,
    retentionByDifficulty: {
      easy: Math.round(retByDiff(easyCards) * 100),
      medium: Math.round(retByDiff(medCards) * 100),
      hard: Math.round(retByDiff(hardCards) * 100),
    },
  };
}

export async function removeFSRSCard(cardId: string): Promise<boolean> {
  const state = await loadFSRSState();
  const before = state.cards.length;
  state.cards = state.cards.filter((c) => c.id !== cardId);
  if (state.cards.length < before) {
    await saveFSRSState(state);
    return true;
  }
  return false;
}

export async function resetFSRSState(): Promise<void> {
  await AsyncStorage.removeItem(FSRS_STORAGE_KEY);
}

/**
 * Migrate SM-2 cards to FSRS format
 * Maps SM-2 ease factor and interval to FSRS stability and difficulty
 */
export async function migrateFromSM2(sm2Cards: Array<{
  id: string;
  exerciseType: string;
  topic: string;
  subtopic?: string;
  language: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string;
  totalReviews: number;
  correctReviews: number;
}>): Promise<number> {
  const state = await loadFSRSState();
  let migrated = 0;

  for (const sm2 of sm2Cards) {
    // Skip if already migrated
    if (state.cards.some((c) => c.topic === sm2.topic && c.exerciseType === sm2.exerciseType)) continue;

    // Map SM-2 ease factor (1.3-2.5+) to FSRS difficulty (1-10)
    // Lower ease = higher difficulty
    const difficulty = clamp(10 - ((sm2.easeFactor - 1.3) / 1.7) * 9, 1, 10);

    // SM-2 interval maps directly to FSRS stability
    const stability = Math.max(sm2.interval, 0.1);

    const card: FSRSCard = {
      id: `fsrs_migrated_${sm2.id}`,
      exerciseType: sm2.exerciseType,
      topic: sm2.topic,
      subtopic: sm2.subtopic,
      language: sm2.language,
      front: sm2.topic,
      back: "",
      state: sm2.repetitions === 0 ? "new" : "review",
      difficulty: Math.round(difficulty * 100) / 100,
      stability: Math.round(stability * 100) / 100,
      retrievability: 0.9,
      scheduledDays: sm2.interval,
      elapsedDays: 0,
      nextReviewDate: sm2.nextReviewDate,
      lastReviewDate: sm2.lastReviewDate,
      reps: sm2.correctReviews,
      lapses: sm2.totalReviews - sm2.correctReviews,
      totalReviews: sm2.totalReviews,
      createdAt: sm2.lastReviewDate,
      tags: [sm2.exerciseType, sm2.language],
    };

    state.cards.push(card);
    migrated++;
  }

  await saveFSRSState(state);
  return migrated;
}
