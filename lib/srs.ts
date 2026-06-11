/**
 * Spaced Repetition System (SM-2 Algorithm)
 * 
 * Implements the SuperMemo 2 algorithm for optimal vocabulary review scheduling.
 * Tracks items with ease factor, interval, and repetition count.
 * Stores the review queue in AsyncStorage under @srs_queue.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SRSItem {
  id: string;
  word: string;
  translation: string;
  context?: string; // example sentence or lesson context
  lessonId?: string; // source lesson
  easeFactor: number; // SM-2 ease factor (min 1.3, default 2.5)
  interval: number; // current interval in days
  repetitions: number; // number of successful reviews
  nextReview: number; // timestamp of next review date
  lastScore: number; // last quality score (0-5)
  createdAt: number; // when item was added
  lastReviewedAt: number; // when last reviewed
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = complete blackout
// 1 = incorrect, but remembered upon seeing answer
// 2 = incorrect, but answer seemed easy to recall
// 3 = correct with serious difficulty
// 4 = correct after hesitation
// 5 = perfect response

// ─── Constants ───────────────────────────────────────────────────────────────

const SRS_QUEUE_KEY = "@srs_queue";
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

// ─── SM-2 Algorithm ─────────────────────────────────────────────────────────

/**
 * Calculate the next review schedule for an item based on the SM-2 algorithm.
 * 
 * @param item - The SRS item to update
 * @param quality - Quality of recall (0-5)
 * @returns Updated SRS item with new schedule
 */
export function calculateNextReview(item: SRSItem, quality: ReviewQuality): SRSItem {
  let { easeFactor, interval, repetitions } = item;

  // Update ease factor using SM-2 formula
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (quality < 3) {
    // Failed recall — reset repetitions but keep ease factor change
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall — advance interval
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * newEaseFactor);
    }
    repetitions++;
  }

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    ...item,
    easeFactor: newEaseFactor,
    interval,
    repetitions,
    nextReview,
    lastScore: quality,
    lastReviewedAt: Date.now(),
  };
}

// ─── Queue Management ────────────────────────────────────────────────────────

/**
 * Load the full review queue from AsyncStorage.
 */
export async function loadReviewQueue(): Promise<SRSItem[]> {
  try {
    const data = await AsyncStorage.getItem(SRS_QUEUE_KEY);
    if (data) {
      return JSON.parse(data) as SRSItem[];
    }
  } catch (e) {
    // Silently handle parse errors
  }
  return [];
}

/**
 * Save the full review queue to AsyncStorage.
 */
export async function saveReviewQueue(queue: SRSItem[]): Promise<void> {
  await AsyncStorage.setItem(SRS_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Get items that are due for review (nextReview <= now).
 */
export async function getDueItems(): Promise<SRSItem[]> {
  const queue = await loadReviewQueue();
  const now = Date.now();
  return queue
    .filter((item) => item.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview);
}

/**
 * Get the count of items due for review.
 */
export async function getDueCount(): Promise<number> {
  const due = await getDueItems();
  return due.length;
}

/**
 * Add vocabulary items to the review queue.
 * Skips items that already exist (by id).
 */
export async function addToReviewQueue(items: Omit<SRSItem, "easeFactor" | "interval" | "repetitions" | "nextReview" | "lastScore" | "createdAt" | "lastReviewedAt">[]): Promise<void> {
  const queue = await loadReviewQueue();
  const existingIds = new Set(queue.map((i) => i.id));

  const newItems: SRSItem[] = items
    .filter((item) => !existingIds.has(item.id))
    .map((item) => ({
      ...item,
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      nextReview: Date.now(), // immediately due for first review
      lastScore: 0,
      createdAt: Date.now(),
      lastReviewedAt: 0,
    }));

  if (newItems.length > 0) {
    await saveReviewQueue([...queue, ...newItems]);
  }
}

/**
 * Update an item in the queue after review.
 */
export async function reviewItem(itemId: string, quality: ReviewQuality): Promise<SRSItem | null> {
  const queue = await loadReviewQueue();
  const index = queue.findIndex((i) => i.id === itemId);
  if (index === -1) return null;

  const updatedItem = calculateNextReview(queue[index], quality);
  queue[index] = updatedItem;
  await saveReviewQueue(queue);
  return updatedItem;
}

/**
 * Add wrong-answer vocabulary from a quiz to the SRS queue.
 * Creates SRS items from quiz questions that were answered incorrectly.
 */
export async function addWrongAnswersToQueue(
  wrongQuestions: { id: string; question: string; correctAnswer: string }[],
  lessonId: string
): Promise<void> {
  const items = wrongQuestions.map((q) => ({
    id: `srs_${lessonId}_${q.id}`,
    word: q.question,
    translation: q.correctAnswer,
    context: `From lesson quiz`,
    lessonId,
  }));

  await addToReviewQueue(items);
}

/**
 * Remove an item from the review queue.
 */
export async function removeFromQueue(itemId: string): Promise<void> {
  const queue = await loadReviewQueue();
  const filtered = queue.filter((i) => i.id !== itemId);
  await saveReviewQueue(filtered);
}

/**
 * Get queue statistics.
 */
export async function getQueueStats(): Promise<{
  total: number;
  due: number;
  mastered: number; // items with 5+ successful repetitions
  learning: number; // items with 1-4 repetitions
  new: number; // items with 0 repetitions
}> {
  const queue = await loadReviewQueue();
  const now = Date.now();
  const due = queue.filter((i) => i.nextReview <= now).length;
  const mastered = queue.filter((i) => i.repetitions >= 5).length;
  const learning = queue.filter((i) => i.repetitions > 0 && i.repetitions < 5).length;
  const newItems = queue.filter((i) => i.repetitions === 0).length;

  return { total: queue.length, due, mastered, learning, new: newItems };
}
