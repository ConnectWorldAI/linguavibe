/**
 * SRS Phoneme Integration
 * 
 * Bridges the pronunciation heat map with the Spaced Repetition System.
 * Automatically surfaces struggling phonemes (score < 50) as SRS cards
 * so users get regular practice on their weakest sounds.
 * 
 * Phoneme SRS cards are stored in the main @srs_queue alongside vocabulary cards,
 * distinguished by a "phoneme:" prefix on the id and lessonId field.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addToReviewQueue, loadReviewQueue, saveReviewQueue } from "./srs";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PhonemeCardData {
  phonemeId: string;
  symbol: string;
  name: string;
  language: string;
  score: number;
  examples: string[];
  tip: string;
  category: "vowel" | "consonant" | "special";
}

// Storage key for tracking which phonemes have been auto-added
const PHONEME_SRS_TRACKING_KEY = "@srs_phoneme_tracking";

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Add a struggling phoneme to the SRS queue.
 * Creates an SRS card with phoneme-specific metadata encoded in the standard fields.
 * 
 * Card mapping:
 * - id: "phoneme:{language}:{phonemeId}"
 * - word: symbol + name (displayed as the "question")
 * - translation: tip (displayed as the "answer"/guidance)
 * - context: examples joined
 * - lessonId: "phoneme:{language}" (used to identify phoneme cards)
 */
export async function addPhonemeToSRS(phoneme: PhonemeCardData): Promise<boolean> {
  const id = `phoneme:${phoneme.language.toLowerCase()}:${phoneme.phonemeId}`;
  
  await addToReviewQueue([{
    id,
    word: `${phoneme.symbol} — ${phoneme.name}`,
    translation: phoneme.tip,
    context: `Practice: ${phoneme.examples.slice(0, 3).join(", ")}`,
    lessonId: `phoneme:${phoneme.language}`,
  }]);

  // Track that this phoneme was auto-added
  await trackPhonemeAdded(phoneme.phonemeId, phoneme.language);
  return true;
}

/**
 * Batch-add all struggling phonemes (score < threshold) for a language.
 * Returns the count of newly added phonemes.
 */
export async function addStrugglingPhonemesToSRS(
  phonemes: PhonemeCardData[],
  threshold: number = 50
): Promise<number> {
  const struggling = phonemes.filter(p => p.score < threshold);
  if (struggling.length === 0) return 0;

  const queue = await loadReviewQueue();
  const existingIds = new Set(queue.map(i => i.id));
  
  let addedCount = 0;
  const newItems: { id: string; word: string; translation: string; context: string; lessonId: string }[] = [];

  for (const phoneme of struggling) {
    const id = `phoneme:${phoneme.language.toLowerCase()}:${phoneme.phonemeId}`;
    if (!existingIds.has(id)) {
      newItems.push({
        id,
        word: `${phoneme.symbol} — ${phoneme.name}`,
        translation: phoneme.tip,
        context: `Practice: ${phoneme.examples.slice(0, 3).join(", ")}`,
        lessonId: `phoneme:${phoneme.language}`,
      });
      addedCount++;
    }
  }

  if (newItems.length > 0) {
    await addToReviewQueue(newItems);
    // Track all added phonemes
    for (const phoneme of struggling) {
      await trackPhonemeAdded(phoneme.phonemeId, phoneme.language);
    }
  }

  return addedCount;
}

/**
 * Get all phoneme SRS cards from the queue.
 */
export async function getPhonemeCards(): Promise<{ id: string; word: string; translation: string; context?: string; lessonId?: string }[]> {
  const queue = await loadReviewQueue();
  return queue.filter(item => item.id.startsWith("phoneme:"));
}

/**
 * Get phoneme SRS cards that are due for review.
 */
export async function getDuePhonemeCards(): Promise<number> {
  const queue = await loadReviewQueue();
  const now = Date.now();
  return queue.filter(item => item.id.startsWith("phoneme:") && item.nextReview <= now).length;
}

/**
 * Check if a specific phoneme is already in the SRS queue.
 */
export async function isPhonemeInSRS(phonemeId: string, language: string): Promise<boolean> {
  const queue = await loadReviewQueue();
  const id = `phoneme:${language.toLowerCase()}:${phonemeId}`;
  return queue.some(item => item.id === id);
}

/**
 * Remove a phoneme from SRS (e.g., when score improves above threshold).
 */
export async function removePhonemeFromSRS(phonemeId: string, language: string): Promise<void> {
  const queue = await loadReviewQueue();
  const id = `phoneme:${language.toLowerCase()}:${phonemeId}`;
  const filtered = queue.filter(item => item.id !== id);
  if (filtered.length !== queue.length) {
    await saveReviewQueue(filtered);
  }
}

/**
 * Get count of phoneme cards in the SRS queue by language.
 */
export async function getPhonemeCardCountByLanguage(): Promise<Record<string, number>> {
  const queue = await loadReviewQueue();
  const counts: Record<string, number> = {};
  
  for (const item of queue) {
    if (item.id.startsWith("phoneme:")) {
      const language = item.lessonId?.replace("phoneme:", "") || "unknown";
      counts[language] = (counts[language] || 0) + 1;
    }
  }
  
  return counts;
}

/**
 * Get the weakest/most-due phoneme card for daily challenge.
 * Returns null if no phoneme cards exist in the SRS queue.
 */
export async function getWeakestDuePhoneme(): Promise<{
  phonemeId: string;
  phonemeName: string;
  phonemeSymbol: string;
  language: string;
  examples: string;
  tip: string;
  srsCardId: string;
} | null> {
  const queue = await loadReviewQueue();
  const phonemeCards = queue.filter(item => item.id.startsWith("phoneme:"));
  if (phonemeCards.length === 0) return null;

  // Sort by: due first (nextReview <= now), then by lowest lastScore, then by earliest nextReview
  const now = Date.now();
  phonemeCards.sort((a, b) => {
    const aDue = a.nextReview <= now ? 0 : 1;
    const bDue = b.nextReview <= now ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    if ((a.lastScore || 0) !== (b.lastScore || 0)) return (a.lastScore || 0) - (b.lastScore || 0);
    return a.nextReview - b.nextReview;
  });

  const card = phonemeCards[0];
  // Parse the encoded phoneme data from the SRS item
  // id format: "phoneme:{language}:{phonemeId}"
  const parts = card.id.split(":");
  const language = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "Spanish";
  const phonemeId = parts[2] || "";
  // word format: "symbol — name"
  const wordParts = (card.word || "").split(" \u2014 ");
  const phonemeSymbol = wordParts[0]?.trim() || phonemeId;
  const phonemeName = wordParts[1]?.trim() || phonemeId;
  // context format: "Practice: word1, word2, word3"
  const examples = (card.context || "").replace(/^Practice:\s*/, "");
  const tip = card.translation || "";

  return {
    phonemeId,
    phonemeName,
    phonemeSymbol,
    language,
    examples,
    tip,
    srsCardId: card.id,
  };
}

// ─── Tracking ────────────────────────────────────────────────────────────────

interface PhonemeTracking {
  [key: string]: { addedAt: number; language: string };
}

async function trackPhonemeAdded(phonemeId: string, language: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(PHONEME_SRS_TRACKING_KEY);
    const tracking: PhonemeTracking = data ? JSON.parse(data) : {};
    tracking[`${language}:${phonemeId}`] = { addedAt: Date.now(), language };
    await AsyncStorage.setItem(PHONEME_SRS_TRACKING_KEY, JSON.stringify(tracking));
  } catch {}
}

export async function getPhonemeTrackingData(): Promise<PhonemeTracking> {
  try {
    const data = await AsyncStorage.getItem(PHONEME_SRS_TRACKING_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}
