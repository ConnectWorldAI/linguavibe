/**
 * Spaced Repetition Engine
 * 
 * Implements the SM-2 algorithm (SuperMemo 2) with forgetting curves
 * to schedule exercise reviews at optimal intervals.
 * 
 * Instead of showing all homework at once, exercises are drip-fed
 * based on when the student is about to forget the material.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const SRS_STORAGE_KEY = "linguavibe_srs_data";

// Quality ratings (0-5 scale from SM-2)
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

// Quality descriptions for UI
export const QUALITY_LABELS: Record<ReviewQuality, string> = {
  0: "Complete blackout",
  1: "Incorrect, remembered on seeing answer",
  2: "Incorrect, but easy to recall",
  3: "Correct with difficulty",
  4: "Correct with hesitation",
  5: "Perfect recall",
};

// Simplified quality for user-facing buttons
export type SimpleQuality = "again" | "hard" | "good" | "easy";
export const SIMPLE_TO_SM2: Record<SimpleQuality, ReviewQuality> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

export interface SRSCard {
  id: string; // Unique card ID (exercise type + topic + subtopic)
  exerciseType: string; // rrt, netflix_dictation, whiteboard, fill_blank, etc.
  topic: string; // Grammar topic, vocabulary set, etc.
  subtopic?: string; // Specific area (e.g., "past tense irregular verbs")
  language: string; // Target language
  
  // SM-2 algorithm state
  easeFactor: number; // Starts at 2.5, minimum 1.3
  interval: number; // Days until next review
  repetitions: number; // Successful repetitions in a row
  
  // Scheduling
  nextReviewDate: string; // ISO date string
  lastReviewDate: string; // ISO date string
  createdAt: string; // ISO date string
  
  // Performance tracking
  totalReviews: number;
  correctReviews: number;
  averageQuality: number;
  
  // Context for exercise generation
  difficulty: "beginner" | "intermediate" | "advanced";
  relatedVocabulary?: string[];
  notes?: string; // Why this card was created (e.g., "Struggled with past tense in lesson 12")
}

export interface SRSState {
  cards: SRSCard[];
  dailyNewCardLimit: number; // Max new cards per day (default 10)
  dailyReviewLimit: number; // Max reviews per day (default 50)
  newCardsToday: number;
  reviewsToday: number;
  lastResetDate: string; // ISO date for daily counter reset
}

const DEFAULT_STATE: SRSState = {
  cards: [],
  dailyNewCardLimit: 10,
  dailyReviewLimit: 50,
  newCardsToday: 0,
  reviewsToday: 0,
  lastResetDate: new Date().toISOString().split("T")[0],
};

/**
 * SM-2 Algorithm Implementation
 * 
 * Calculates the next review interval based on performance quality.
 * The forgetting curve is modeled by increasing intervals for successful reviews
 * and resetting for failures.
 */
function calculateSM2(
  card: SRSCard,
  quality: ReviewQuality
): { interval: number; easeFactor: number; repetitions: number } {
  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    // Failed review — reset to beginning
    repetitions = 0;
    interval = 1; // Review again tomorrow
  } else {
    // Successful review — increase interval
    repetitions += 1;
    
    if (repetitions === 1) {
      interval = 1; // First success: review tomorrow
    } else if (repetitions === 2) {
      interval = 3; // Second success: review in 3 days
    } else {
      // Subsequent successes: multiply by ease factor
      interval = Math.round(interval * easeFactor);
    }
  }

  // Update ease factor (minimum 1.3)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Cap interval at 365 days
  if (interval > 365) interval = 365;

  return { interval, easeFactor, repetitions };
}

/**
 * Get the retention probability for a card based on time elapsed
 * Uses the forgetting curve: R = e^(-t/S) where S is stability (interval)
 */
export function getRetentionProbability(card: SRSCard): number {
  const now = new Date();
  const lastReview = new Date(card.lastReviewDate);
  const daysSinceReview = (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24);
  
  // Stability is proportional to the interval
  const stability = card.interval * card.easeFactor;
  
  // Forgetting curve: R = e^(-t/S)
  const retention = Math.exp(-daysSinceReview / stability);
  return Math.max(0, Math.min(1, retention));
}

/**
 * Load SRS state from AsyncStorage
 */
async function loadState(): Promise<SRSState> {
  try {
    const raw = await AsyncStorage.getItem(SRS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    
    const state: SRSState = JSON.parse(raw);
    
    // Reset daily counters if it's a new day
    const today = new Date().toISOString().split("T")[0];
    if (state.lastResetDate !== today) {
      state.newCardsToday = 0;
      state.reviewsToday = 0;
      state.lastResetDate = today;
    }
    
    return state;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/**
 * Save SRS state to AsyncStorage
 */
async function saveState(state: SRSState): Promise<void> {
  await AsyncStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Add a new card to the SRS system
 * Called when the intelligence engine identifies a struggle area
 */
export async function addCard(params: {
  exerciseType: string;
  topic: string;
  subtopic?: string;
  language: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  relatedVocabulary?: string[];
  notes?: string;
}): Promise<SRSCard> {
  const state = await loadState();
  
  // Check if card already exists for this topic
  const existingIndex = state.cards.findIndex(
    (c) => c.exerciseType === params.exerciseType && c.topic === params.topic && c.subtopic === params.subtopic
  );
  
  if (existingIndex >= 0) {
    // Reset existing card (student is struggling again)
    const existing = state.cards[existingIndex];
    existing.interval = 1;
    existing.repetitions = 0;
    existing.nextReviewDate = new Date().toISOString();
    existing.notes = params.notes || existing.notes;
    await saveState(state);
    return existing;
  }
  
  const now = new Date().toISOString();
  const card: SRSCard = {
    id: `${params.exerciseType}_${params.topic}_${params.subtopic || "general"}_${Date.now()}`,
    exerciseType: params.exerciseType,
    topic: params.topic,
    subtopic: params.subtopic,
    language: params.language,
    easeFactor: 2.5,
    interval: 0, // Due immediately
    repetitions: 0,
    nextReviewDate: now, // Due now
    lastReviewDate: now,
    createdAt: now,
    totalReviews: 0,
    correctReviews: 0,
    averageQuality: 0,
    difficulty: params.difficulty,
    relatedVocabulary: params.relatedVocabulary,
    notes: params.notes,
  };
  
  state.cards.push(card);
  await saveState(state);
  return card;
}

/**
 * Review a card and update its schedule
 */
export async function reviewCard(cardId: string, quality: SimpleQuality): Promise<SRSCard | null> {
  const state = await loadState();
  const cardIndex = state.cards.findIndex((c) => c.id === cardId);
  
  if (cardIndex < 0) return null;
  
  const card = state.cards[cardIndex];
  const sm2Quality = SIMPLE_TO_SM2[quality];
  
  // Calculate new SM-2 values
  const { interval, easeFactor, repetitions } = calculateSM2(card, sm2Quality);
  
  // Update card
  card.interval = interval;
  card.easeFactor = easeFactor;
  card.repetitions = repetitions;
  card.lastReviewDate = new Date().toISOString();
  card.totalReviews += 1;
  if (sm2Quality >= 3) card.correctReviews += 1;
  card.averageQuality = ((card.averageQuality * (card.totalReviews - 1)) + sm2Quality) / card.totalReviews;
  
  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  card.nextReviewDate = nextDate.toISOString();
  
  // Update daily counters
  state.reviewsToday += 1;
  
  await saveState(state);
  return card;
}

/**
 * Get cards due for review today (sorted by urgency)
 * This is the core "drip-feed" mechanism — only shows what's due NOW
 */
export async function getDueCards(): Promise<SRSCard[]> {
  const state = await loadState();
  const now = new Date();
  
  // Filter cards that are due (nextReviewDate <= now)
  const dueCards = state.cards.filter((card) => {
    const reviewDate = new Date(card.nextReviewDate);
    return reviewDate <= now;
  });
  
  // Sort by urgency: most overdue first, then by lowest retention probability
  dueCards.sort((a, b) => {
    const aOverdue = now.getTime() - new Date(a.nextReviewDate).getTime();
    const bOverdue = now.getTime() - new Date(b.nextReviewDate).getTime();
    return bOverdue - aOverdue; // Most overdue first
  });
  
  // Respect daily review limit
  return dueCards.slice(0, state.dailyReviewLimit - state.reviewsToday);
}

/**
 * Get upcoming cards (scheduled for future, not due yet)
 * Used for the "upcoming" section in Smart Practice
 */
export async function getUpcomingCards(days: number = 7): Promise<SRSCard[]> {
  const state = await loadState();
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return state.cards.filter((card) => {
    const reviewDate = new Date(card.nextReviewDate);
    return reviewDate > now && reviewDate <= futureDate;
  }).sort((a, b) => {
    return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
  });
}

/**
 * Get SRS statistics for the dashboard
 */
export async function getStats(): Promise<{
  totalCards: number;
  dueToday: number;
  reviewedToday: number;
  averageRetention: number;
  streakDays: number;
  matureCards: number; // Cards with interval > 21 days
  youngCards: number; // Cards with interval <= 21 days
  newCards: number; // Cards never reviewed
}> {
  const state = await loadState();
  const now = new Date();
  
  const dueCards = state.cards.filter((c) => new Date(c.nextReviewDate) <= now);
  const matureCards = state.cards.filter((c) => c.interval > 21);
  const youngCards = state.cards.filter((c) => c.interval > 0 && c.interval <= 21);
  const newCards = state.cards.filter((c) => c.totalReviews === 0);
  
  // Calculate average retention across all cards
  const retentions = state.cards.map(getRetentionProbability);
  const avgRetention = retentions.length > 0
    ? retentions.reduce((sum, r) => sum + r, 0) / retentions.length
    : 1;
  
  return {
    totalCards: state.cards.length,
    dueToday: dueCards.length,
    reviewedToday: state.reviewsToday,
    averageRetention: Math.round(avgRetention * 100),
    streakDays: 0, // TODO: calculate from review history
    matureCards: matureCards.length,
    youngCards: youngCards.length,
    newCards: newCards.length,
  };
}

/**
 * Get the optimal time to study based on card due dates
 * Returns a recommendation for when to practice next
 */
export async function getNextStudyRecommendation(): Promise<{
  hasDueCards: boolean;
  dueCount: number;
  nextDueIn: string; // Human-readable time until next card is due
  urgency: "none" | "low" | "medium" | "high" | "critical";
  message: string;
}> {
  const state = await loadState();
  const now = new Date();
  
  const dueCards = state.cards.filter((c) => new Date(c.nextReviewDate) <= now);
  
  if (dueCards.length > 0) {
    const urgency = dueCards.length > 20 ? "critical" : dueCards.length > 10 ? "high" : dueCards.length > 5 ? "medium" : "low";
    return {
      hasDueCards: true,
      dueCount: dueCards.length,
      nextDueIn: "now",
      urgency,
      message: dueCards.length === 1
        ? "You have 1 exercise ready for review"
        : `You have ${dueCards.length} exercises ready for review`,
    };
  }
  
  // Find next upcoming card
  const upcoming = state.cards
    .filter((c) => new Date(c.nextReviewDate) > now)
    .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());
  
  if (upcoming.length === 0) {
    return {
      hasDueCards: false,
      dueCount: 0,
      nextDueIn: "none",
      urgency: "none",
      message: "All caught up! No reviews scheduled.",
    };
  }
  
  const nextDue = new Date(upcoming[0].nextReviewDate);
  const hoursUntil = (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  let nextDueIn: string;
  if (hoursUntil < 1) {
    nextDueIn = `${Math.round(hoursUntil * 60)} minutes`;
  } else if (hoursUntil < 24) {
    nextDueIn = `${Math.round(hoursUntil)} hours`;
  } else {
    nextDueIn = `${Math.round(hoursUntil / 24)} days`;
  }
  
  return {
    hasDueCards: false,
    dueCount: 0,
    nextDueIn,
    urgency: "none",
    message: `Next review in ${nextDueIn}`,
  };
}

/**
 * Bulk add cards from the intelligence engine's analysis
 * Called when the system detects multiple struggle areas
 */
export async function addCardsFromStruggles(struggles: Array<{
  exerciseType: string;
  topic: string;
  subtopic?: string;
  language: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  reason: string;
}>): Promise<SRSCard[]> {
  const cards: SRSCard[] = [];
  for (const struggle of struggles) {
    const card = await addCard({
      exerciseType: struggle.exerciseType,
      topic: struggle.topic,
      subtopic: struggle.subtopic,
      language: struggle.language,
      difficulty: struggle.difficulty,
      notes: struggle.reason,
    });
    cards.push(card);
  }
  return cards;
}

/**
 * Remove a card from the SRS system (mastered or no longer relevant)
 */
export async function removeCard(cardId: string): Promise<boolean> {
  const state = await loadState();
  const initialLength = state.cards.length;
  state.cards = state.cards.filter((c) => c.id !== cardId);
  if (state.cards.length < initialLength) {
    await saveState(state);
    return true;
  }
  return false;
}

/**
 * Update daily limits
 */
export async function updateLimits(newCardLimit: number, reviewLimit: number): Promise<void> {
  const state = await loadState();
  state.dailyNewCardLimit = newCardLimit;
  state.dailyReviewLimit = reviewLimit;
  await saveState(state);
}
