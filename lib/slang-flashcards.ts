import AsyncStorage from "@react-native-async-storage/async-storage";

const SLANG_FLASHCARDS_KEY = "@slang_flashcards";

export interface SlangFlashcard {
  id: string;
  word: string;
  meaning: string;
  dialect: string;
  dialectFlag: string;
  example?: string;
  note?: string;
  songTitle?: string;
  artist?: string;
  savedAt: string;
  reviewed: boolean;
  mastered: boolean;
}

/**
 * Get all saved slang flashcards
 */
export async function getSlangFlashcards(): Promise<SlangFlashcard[]> {
  try {
    const data = await AsyncStorage.getItem(SLANG_FLASHCARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save a slang word as a flashcard
 */
export async function saveSlangFlashcard(
  card: Omit<SlangFlashcard, "id" | "savedAt" | "reviewed" | "mastered">
): Promise<SlangFlashcard> {
  const cards = await getSlangFlashcards();

  // Check if already saved (by word + dialect)
  const existing = cards.find(
    (c) => c.word.toLowerCase() === card.word.toLowerCase() && c.dialect === card.dialect
  );
  if (existing) {
    return existing;
  }

  const newCard: SlangFlashcard = {
    ...card,
    id: `slang_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    reviewed: false,
    mastered: false,
  };

  cards.unshift(newCard);
  await AsyncStorage.setItem(SLANG_FLASHCARDS_KEY, JSON.stringify(cards));
  return newCard;
}

/**
 * Remove a slang flashcard by ID
 */
export async function removeSlangFlashcard(id: string): Promise<void> {
  const cards = await getSlangFlashcards();
  const filtered = cards.filter((c) => c.id !== id);
  await AsyncStorage.setItem(SLANG_FLASHCARDS_KEY, JSON.stringify(filtered));
}

/**
 * Check if a slang word is already saved
 */
export async function isSlangSaved(word: string, dialect: string): Promise<boolean> {
  const cards = await getSlangFlashcards();
  return cards.some(
    (c) => c.word.toLowerCase() === word.toLowerCase() && c.dialect === dialect
  );
}

/**
 * Mark a flashcard as reviewed
 */
export async function markFlashcardReviewed(id: string): Promise<void> {
  const cards = await getSlangFlashcards();
  const card = cards.find((c) => c.id === id);
  if (card) {
    card.reviewed = true;
    await AsyncStorage.setItem(SLANG_FLASHCARDS_KEY, JSON.stringify(cards));
  }
}

/**
 * Mark a flashcard as mastered
 */
export async function markFlashcardMastered(id: string): Promise<void> {
  const cards = await getSlangFlashcards();
  const card = cards.find((c) => c.id === id);
  if (card) {
    card.mastered = true;
    await AsyncStorage.setItem(SLANG_FLASHCARDS_KEY, JSON.stringify(cards));
  }
}

/**
 * Get count of saved flashcards
 */
export async function getFlashcardCount(): Promise<number> {
  const cards = await getSlangFlashcards();
  return cards.length;
}
