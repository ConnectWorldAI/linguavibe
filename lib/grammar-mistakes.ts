import AsyncStorage from "@react-native-async-storage/async-storage";

const MISTAKES_KEY = "@grammar_mistake_journal";
const GRAMMAR_SRS_KEY = "@grammar_srs_queue";

// ─── Mistake Journal ───────────────────────────────────────────────────────────

export interface GrammarMistake {
  id: string;
  timestamp: number;
  source: "quiz" | "conversation" | "exercise" | "drill";
  category: string; // e.g., "verb_conjugation", "pronoun_usage", "word_order", "article", "preposition"
  language: string;
  question: string; // The question or context
  userAnswer: string;
  correctAnswer: string;
  rule: string; // The grammar rule that was violated
  grammarTopic: string; // Broader topic (e.g., "Subject Pronouns", "Past Tense")
}

export interface MistakePattern {
  category: string;
  count: number;
  percentage: number;
  recentMistakes: GrammarMistake[];
  lastOccurrence: number;
}

export async function logGrammarMistake(mistake: Omit<GrammarMistake, "id" | "timestamp">): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(MISTAKES_KEY);
    const mistakes: GrammarMistake[] = stored ? JSON.parse(stored) : [];
    
    const newMistake: GrammarMistake = {
      ...mistake,
      id: `mistake_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    
    mistakes.push(newMistake);
    
    // Keep last 500 mistakes
    if (mistakes.length > 500) {
      mistakes.splice(0, mistakes.length - 500);
    }
    
    await AsyncStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
    
    // Also add to grammar SRS queue
    await addToGrammarSRS(newMistake);
  } catch (e) {
    console.error("Failed to log grammar mistake:", e);
  }
}

export async function getMistakes(): Promise<GrammarMistake[]> {
  try {
    const stored = await AsyncStorage.getItem(MISTAKES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to get mistakes:", e);
    return [];
  }
}

export async function getMistakePatterns(): Promise<MistakePattern[]> {
  const mistakes = await getMistakes();
  
  // Group by category
  const categoryMap: Record<string, GrammarMistake[]> = {};
  for (const m of mistakes) {
    if (!categoryMap[m.category]) categoryMap[m.category] = [];
    categoryMap[m.category].push(m);
  }
  
  const total = mistakes.length || 1;
  const patterns: MistakePattern[] = Object.entries(categoryMap)
    .map(([category, items]) => ({
      category,
      count: items.length,
      percentage: Math.round((items.length / total) * 100),
      recentMistakes: items.slice(-5).reverse(),
      lastOccurrence: Math.max(...items.map((i) => i.timestamp)),
    }))
    .sort((a, b) => b.count - a.count);
  
  return patterns;
}

export async function getMistakesByLanguage(language: string): Promise<GrammarMistake[]> {
  const mistakes = await getMistakes();
  return mistakes.filter((m) => m.language.toLowerCase() === language.toLowerCase());
}

export async function clearMistakes(): Promise<void> {
  await AsyncStorage.removeItem(MISTAKES_KEY);
}

// ─── Grammar SRS (Spaced Repetition for Grammar Rules) ─────────────────────────

export interface GrammarSRSCard {
  id: string;
  mistakeId: string;
  category: string;
  language: string;
  question: string;
  correctAnswer: string;
  rule: string;
  grammarTopic: string;
  // SM-2 fields
  interval: number; // days until next review
  repetitions: number; // successful reviews in a row
  easeFactor: number; // difficulty multiplier (min 1.3)
  nextReviewDate: number; // timestamp
  lastReviewDate: number;
  createdAt: number;
}

export async function getGrammarSRSQueue(): Promise<GrammarSRSCard[]> {
  try {
    const stored = await AsyncStorage.getItem(GRAMMAR_SRS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to get grammar SRS queue:", e);
    return [];
  }
}

export async function getDueGrammarCards(): Promise<GrammarSRSCard[]> {
  const cards = await getGrammarSRSQueue();
  const now = Date.now();
  return cards.filter((c) => c.nextReviewDate <= now);
}

async function addToGrammarSRS(mistake: GrammarMistake): Promise<void> {
  try {
    const cards = await getGrammarSRSQueue();
    
    // Avoid duplicates for the same question
    const existing = cards.find(
      (c) => c.question === mistake.question && c.correctAnswer === mistake.correctAnswer
    );
    if (existing) {
      // Reset the card since they got it wrong again
      existing.interval = 1;
      existing.repetitions = 0;
      existing.easeFactor = Math.max(1.3, existing.easeFactor - 0.2);
      existing.nextReviewDate = Date.now(); // Due immediately
      existing.lastReviewDate = Date.now();
      await AsyncStorage.setItem(GRAMMAR_SRS_KEY, JSON.stringify(cards));
      return;
    }
    
    const newCard: GrammarSRSCard = {
      id: `gsrs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      mistakeId: mistake.id,
      category: mistake.category,
      language: mistake.language,
      question: mistake.question,
      correctAnswer: mistake.correctAnswer,
      rule: mistake.rule,
      grammarTopic: mistake.grammarTopic,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
      nextReviewDate: Date.now(), // Due immediately for first review
      lastReviewDate: Date.now(),
      createdAt: Date.now(),
    };
    
    cards.push(newCard);
    
    // Cap at 200 cards
    if (cards.length > 200) {
      cards.splice(0, cards.length - 200);
    }
    
    await AsyncStorage.setItem(GRAMMAR_SRS_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error("Failed to add to grammar SRS:", e);
  }
}

/**
 * Review a grammar SRS card with SM-2 algorithm
 * @param cardId - The card ID
 * @param quality - 0-5 rating (0-2 = wrong, 3 = hard, 4 = good, 5 = easy)
 */
export async function reviewGrammarCard(cardId: string, quality: number): Promise<void> {
  try {
    const cards = await getGrammarSRSQueue();
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    
    // SM-2 algorithm
    if (quality >= 3) {
      // Correct answer
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 3;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions += 1;
    } else {
      // Wrong answer — reset
      card.repetitions = 0;
      card.interval = 1;
    }
    
    // Update ease factor
    card.easeFactor = Math.max(
      1.3,
      card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    
    card.lastReviewDate = Date.now();
    card.nextReviewDate = Date.now() + card.interval * 24 * 60 * 60 * 1000;
    
    await AsyncStorage.setItem(GRAMMAR_SRS_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error("Failed to review grammar card:", e);
  }
}

export async function removeGrammarCard(cardId: string): Promise<void> {
  try {
    const cards = await getGrammarSRSQueue();
    const filtered = cards.filter((c) => c.id !== cardId);
    await AsyncStorage.setItem(GRAMMAR_SRS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to remove grammar card:", e);
  }
}

export async function getGrammarSRSStats(): Promise<{
  totalCards: number;
  dueToday: number;
  mastered: number;
  struggling: number;
}> {
  const cards = await getGrammarSRSQueue();
  const now = Date.now();
  return {
    totalCards: cards.length,
    dueToday: cards.filter((c) => c.nextReviewDate <= now).length,
    mastered: cards.filter((c) => c.repetitions >= 5 && c.interval >= 21).length,
    struggling: cards.filter((c) => c.repetitions === 0 || c.easeFactor < 1.8).length,
  };
}
