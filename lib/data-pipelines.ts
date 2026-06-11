/**
 * Data Pipelines - Connects features together
 * 
 * 1. Vocab Cards ↔ Lesson Progress — Words learned in lessons auto-populate vocab decks
 * 2. Feedback Report ↔ AI Calls — After ConnectWorld AI call, scorecard data flows into feedback report
 * 3. Musical Lessons ↔ Curriculum — Song lessons map to actual curriculum units
 * 4. City Exploration ↔ Scenario Chat — City scenarios link to conversation practice
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================
// TYPES
// ============================================

export interface VocabWord {
  id: string;
  word: string;
  translation: string;
  language: string;
  pronunciation?: string;
  context?: string;
  source: "lesson" | "slang-of-day" | "scenario" | "musical" | "manual" | "ai-call";
  sourceId?: string; // lesson ID, scenario ID, etc.
  difficulty: 1 | 2 | 3 | 4 | 5;
  nextReview: number; // timestamp
  interval: number; // days until next review
  easeFactor: number; // SM-2 algorithm ease factor
  repetitions: number;
  dateAdded: number;
  lastReviewed?: number;
  timesCorrect: number;
  timesIncorrect: number;
}

export interface CallFeedbackData {
  callId: string;
  teacherName: string;
  language: string;
  duration: number; // seconds
  timestamp: number;
  scores: {
    pronunciation: number; // 0-100
    grammar: number;
    vocabulary: number;
    fluency: number;
    comprehension: number;
    culturalAwareness: number;
  };
  overallScore: number;
  cefrLevel: string;
  wordsUsed: string[];
  newWordsLearned: string[];
  grammarMistakes: { mistake: string; correction: string; explanation: string }[];
  pronunciationIssues: { word: string; issue: string; tip: string }[];
  strengths: string[];
  areasToImprove: string[];
  recommendedLessons: string[];
  conversationHighlights: { timestamp: number; text: string; note: string }[];
}

export interface MusicalLessonMapping {
  lessonId: string;
  musicalLessonId: string;
  language: string;
  topic: string;
  vocabularyWords: string[];
  grammarConcepts: string[];
  culturalElements: string[];
}

export interface LearningSession {
  id: string;
  type: "lesson" | "scenario" | "musical" | "battle" | "call" | "vocab-review";
  language: string;
  timestamp: number;
  duration: number;
  wordsLearned: string[];
  score?: number;
}

// ============================================
// STORAGE KEYS
// ============================================

const KEYS = {
  VOCAB_DECK: "@vocab_deck",
  CALL_HISTORY: "@call_feedback_history",
  LEARNING_SESSIONS: "@learning_sessions",
  MUSICAL_MAPPINGS: "@musical_lesson_mappings",
  DAILY_STATS: "@daily_learning_stats",
  STREAK: "@learning_streak",
  WORDS_KNOWN: "@words_known_count",
};

// ============================================
// 1. VOCAB CARDS ↔ LESSON PROGRESS PIPELINE
// ============================================

/**
 * SM-2 Spaced Repetition Algorithm
 * Calculates next review date based on performance
 */
function calculateSM2(word: VocabWord, quality: 0 | 1 | 2 | 3 | 4 | 5): Partial<VocabWord> {
  let { easeFactor, interval, repetitions } = word;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    // Incorrect response - reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReviewed: Date.now(),
    timesCorrect: quality >= 3 ? word.timesCorrect + 1 : word.timesCorrect,
    timesIncorrect: quality < 3 ? word.timesIncorrect + 1 : word.timesIncorrect,
  };
}

/**
 * Add words from a lesson to the vocab deck
 */
export async function addWordsFromLesson(
  words: { word: string; translation: string; pronunciation?: string; context?: string }[],
  language: string,
  lessonId: string,
  difficulty: 1 | 2 | 3 | 4 | 5 = 2
): Promise<void> {
  const deck = await getVocabDeck();
  const existingWords = new Set(deck.map((w) => `${w.word}-${w.language}`));

  const newWords: VocabWord[] = words
    .filter((w) => !existingWords.has(`${w.word}-${language}`))
    .map((w) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      word: w.word,
      translation: w.translation,
      language,
      pronunciation: w.pronunciation,
      context: w.context,
      source: "lesson" as const,
      sourceId: lessonId,
      difficulty,
      nextReview: Date.now(), // Review immediately
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      dateAdded: Date.now(),
      timesCorrect: 0,
      timesIncorrect: 0,
    }));

  const updatedDeck = [...deck, ...newWords];
  await AsyncStorage.setItem(KEYS.VOCAB_DECK, JSON.stringify(updatedDeck));
  await updateWordsKnownCount(updatedDeck.length);
}

/**
 * Add words from a scenario conversation
 */
export async function addWordsFromScenario(
  words: { word: string; translation: string; context?: string }[],
  language: string,
  scenarioId: string
): Promise<void> {
  const deck = await getVocabDeck();
  const existingWords = new Set(deck.map((w) => `${w.word}-${w.language}`));

  const newWords: VocabWord[] = words
    .filter((w) => !existingWords.has(`${w.word}-${language}`))
    .map((w) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      word: w.word,
      translation: w.translation,
      language,
      context: w.context,
      source: "scenario" as const,
      sourceId: scenarioId,
      difficulty: 3,
      nextReview: Date.now() + 24 * 60 * 60 * 1000, // Review tomorrow
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      dateAdded: Date.now(),
      timesCorrect: 0,
      timesIncorrect: 0,
    }));

  const updatedDeck = [...deck, ...newWords];
  await AsyncStorage.setItem(KEYS.VOCAB_DECK, JSON.stringify(updatedDeck));
  await updateWordsKnownCount(updatedDeck.length);
}

/**
 * Add words learned during an AI call
 */
export async function addWordsFromCall(
  words: string[],
  language: string,
  callId: string
): Promise<void> {
  const deck = await getVocabDeck();
  const existingWords = new Set(deck.map((w) => `${w.word}-${w.language}`));

  const newWords: VocabWord[] = words
    .filter((w) => !existingWords.has(`${w}-${language}`))
    .map((w) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      word: w,
      translation: "", // Will be filled by AI
      language,
      source: "ai-call" as const,
      sourceId: callId,
      difficulty: 3,
      nextReview: Date.now() + 12 * 60 * 60 * 1000, // Review in 12 hours
      interval: 0.5,
      easeFactor: 2.5,
      repetitions: 0,
      dateAdded: Date.now(),
      timesCorrect: 0,
      timesIncorrect: 0,
    }));

  const updatedDeck = [...deck, ...newWords];
  await AsyncStorage.setItem(KEYS.VOCAB_DECK, JSON.stringify(updatedDeck));
  await updateWordsKnownCount(updatedDeck.length);
}

/**
 * Review a word and update its SRS schedule
 */
export async function reviewWord(wordId: string, quality: 0 | 1 | 2 | 3 | 4 | 5): Promise<void> {
  const deck = await getVocabDeck();
  const wordIndex = deck.findIndex((w) => w.id === wordId);
  if (wordIndex === -1) return;

  const updates = calculateSM2(deck[wordIndex], quality);
  deck[wordIndex] = { ...deck[wordIndex], ...updates };

  await AsyncStorage.setItem(KEYS.VOCAB_DECK, JSON.stringify(deck));
}

/**
 * Get words due for review
 */
export async function getDueWords(language?: string, limit: number = 20): Promise<VocabWord[]> {
  const deck = await getVocabDeck();
  const now = Date.now();

  return deck
    .filter((w) => w.nextReview <= now && (!language || w.language === language))
    .sort((a, b) => a.nextReview - b.nextReview)
    .slice(0, limit);
}

/**
 * Get full vocab deck
 */
export async function getVocabDeck(): Promise<VocabWord[]> {
  const data = await AsyncStorage.getItem(KEYS.VOCAB_DECK);
  return data ? JSON.parse(data) : [];
}

/**
 * Get vocab stats
 */
export async function getVocabStats(language?: string) {
  const deck = await getVocabDeck();
  const filtered = language ? deck.filter((w) => w.language === language) : deck;
  const now = Date.now();

  return {
    totalWords: filtered.length,
    mastered: filtered.filter((w) => w.repetitions >= 5).length,
    learning: filtered.filter((w) => w.repetitions > 0 && w.repetitions < 5).length,
    new: filtered.filter((w) => w.repetitions === 0).length,
    dueToday: filtered.filter((w) => w.nextReview <= now).length,
    averageEase: filtered.length > 0 
      ? filtered.reduce((sum, w) => sum + w.easeFactor, 0) / filtered.length 
      : 2.5,
  };
}

// ============================================
// 2. FEEDBACK REPORT ↔ AI CALLS PIPELINE
// ============================================

/**
 * Save call feedback data after an AI teacher call
 */
export async function saveCallFeedback(feedback: CallFeedbackData): Promise<void> {
  const history = await getCallHistory();
  history.unshift(feedback); // Most recent first

  // Keep last 100 calls
  const trimmed = history.slice(0, 100);
  await AsyncStorage.setItem(KEYS.CALL_HISTORY, JSON.stringify(trimmed));

  // Also add new words to vocab deck
  if (feedback.newWordsLearned.length > 0) {
    await addWordsFromCall(feedback.newWordsLearned, feedback.language, feedback.callId);
  }

  // Record learning session
  await recordLearningSession({
    id: feedback.callId,
    type: "call",
    language: feedback.language,
    timestamp: feedback.timestamp,
    duration: feedback.duration,
    wordsLearned: feedback.newWordsLearned,
    score: feedback.overallScore,
  });
}

/**
 * Get call feedback history
 */
export async function getCallHistory(): Promise<CallFeedbackData[]> {
  const data = await AsyncStorage.getItem(KEYS.CALL_HISTORY);
  return data ? JSON.parse(data) : [];
}

/**
 * Get progress over time (for radar chart in feedback report)
 */
export async function getProgressOverTime(language: string, lastN: number = 10) {
  const history = await getCallHistory();
  const filtered = history
    .filter((h) => h.language === language)
    .slice(0, lastN);

  if (filtered.length === 0) return null;

  return {
    calls: filtered.map((f) => ({
      date: f.timestamp,
      scores: f.scores,
      overall: f.overallScore,
      cefrLevel: f.cefrLevel,
    })),
    improvement: {
      pronunciation: filtered.length > 1
        ? filtered[0].scores.pronunciation - filtered[filtered.length - 1].scores.pronunciation
        : 0,
      grammar: filtered.length > 1
        ? filtered[0].scores.grammar - filtered[filtered.length - 1].scores.grammar
        : 0,
      vocabulary: filtered.length > 1
        ? filtered[0].scores.vocabulary - filtered[filtered.length - 1].scores.vocabulary
        : 0,
      fluency: filtered.length > 1
        ? filtered[0].scores.fluency - filtered[filtered.length - 1].scores.fluency
        : 0,
    },
    averageScore: filtered.reduce((sum, f) => sum + f.overallScore, 0) / filtered.length,
    totalCallTime: filtered.reduce((sum, f) => sum + f.duration, 0),
    totalWordsLearned: filtered.reduce((sum, f) => sum + f.newWordsLearned.length, 0),
  };
}

// ============================================
// 3. MUSICAL LESSONS ↔ CURRICULUM PIPELINE
// ============================================

/**
 * Musical lesson to curriculum mapping
 * Each curriculum unit can have an associated musical lesson
 */
const MUSICAL_CURRICULUM_MAP: Record<string, MusicalLessonMapping[]> = {
  spanish: [
    { lessonId: "es-greetings-1", musicalLessonId: "reggaeton-greetings", language: "spanish", topic: "Greetings & Introductions", vocabularyWords: ["hola", "buenos días", "¿cómo estás?", "mucho gusto", "me llamo"], grammarConcepts: ["ser vs estar", "informal vs formal"], culturalElements: ["beso greeting", "regional variations"] },
    { lessonId: "es-food-1", musicalLessonId: "salsa-food", language: "spanish", topic: "Ordering Food", vocabularyWords: ["la cuenta", "quiero", "para llevar", "la propina", "el menú"], grammarConcepts: ["querer conjugation", "articles"], culturalElements: ["tipping culture", "meal times"] },
    { lessonId: "es-directions-1", musicalLessonId: "cumbia-directions", language: "spanish", topic: "Asking Directions", vocabularyWords: ["a la derecha", "a la izquierda", "todo recto", "la esquina", "cerca de"], grammarConcepts: ["imperative mood", "prepositions"], culturalElements: ["landmarks vs street names", "asking strangers"] },
    { lessonId: "es-emotions-1", musicalLessonId: "bachata-emotions", language: "spanish", topic: "Expressing Emotions", vocabularyWords: ["estoy feliz", "tengo miedo", "me encanta", "estoy triste", "qué emoción"], grammarConcepts: ["estar + emotion", "tener expressions"], culturalElements: ["emotional expressiveness", "physical affection"] },
  ],
  french: [
    { lessonId: "fr-greetings-1", musicalLessonId: "chanson-greetings", language: "french", topic: "Greetings & Politeness", vocabularyWords: ["bonjour", "bonsoir", "s'il vous plaît", "merci beaucoup", "enchanté"], grammarConcepts: ["tu vs vous", "formal register"], culturalElements: ["la bise", "politeness culture"] },
    { lessonId: "fr-cafe-1", musicalLessonId: "jazz-cafe", language: "french", topic: "At the Café", vocabularyWords: ["un café", "l'addition", "un croissant", "terrasse", "un verre de vin"], grammarConcepts: ["partitive articles", "un/une"], culturalElements: ["café culture", "terrasse etiquette"] },
    { lessonId: "fr-shopping-1", musicalLessonId: "edith-piaf-shopping", language: "french", topic: "Shopping & Bargaining", vocabularyWords: ["combien ça coûte", "trop cher", "une réduction", "la taille", "je cherche"], grammarConcepts: ["demonstrative adjectives", "comparatives"], culturalElements: ["marchés", "boutique culture"] },
  ],
  japanese: [
    { lessonId: "jp-greetings-1", musicalLessonId: "jpop-greetings", language: "japanese", topic: "Greetings & Bowing", vocabularyWords: ["おはよう", "こんにちは", "すみません", "ありがとう", "よろしく"], grammarConcepts: ["keigo levels", "sentence particles"], culturalElements: ["bowing depth", "business cards"] },
    { lessonId: "jp-restaurant-1", musicalLessonId: "enka-restaurant", language: "japanese", topic: "Restaurant Ordering", vocabularyWords: ["いただきます", "お会計", "おすすめ", "もう一つ", "ごちそうさま"], grammarConcepts: ["counter words", "ください pattern"], culturalElements: ["itadakimasu ritual", "no tipping"] },
  ],
  korean: [
    { lessonId: "ko-greetings-1", musicalLessonId: "kpop-greetings", language: "korean", topic: "Greetings & Honorifics", vocabularyWords: ["안녕하세요", "감사합니다", "죄송합니다", "만나서 반갑습니다", "잘 부탁드립니다"], grammarConcepts: ["honorific levels", "-요 ending"], culturalElements: ["age hierarchy", "bowing"] },
    { lessonId: "ko-food-1", musicalLessonId: "trot-food", language: "korean", topic: "Korean Food & Dining", vocabularyWords: ["맛있어요", "주세요", "매워요", "건배", "잘 먹겠습니다"], grammarConcepts: ["adjective conjugation", "object markers"], culturalElements: ["sharing culture", "soju etiquette"] },
  ],
  portuguese: [
    { lessonId: "pt-greetings-1", musicalLessonId: "bossanova-greetings", language: "portuguese", topic: "Brazilian Greetings", vocabularyWords: ["oi", "tudo bem", "beleza", "prazer", "tchau"], grammarConcepts: ["você vs tu", "informal contractions"], culturalElements: ["abraço culture", "regional greetings"] },
    { lessonId: "pt-beach-1", musicalLessonId: "funk-beach", language: "portuguese", topic: "Beach & Leisure", vocabularyWords: ["praia", "cerveja", "protetor solar", "onda", "areia"], grammarConcepts: ["present continuous", "diminutives (-inho)"], culturalElements: ["beach culture", "carioca lifestyle"] },
  ],
  arabic: [
    { lessonId: "ar-greetings-1", musicalLessonId: "oud-greetings", language: "arabic", topic: "Arabic Greetings", vocabularyWords: ["مرحبا", "السلام عليكم", "شكراً", "كيف حالك", "إن شاء الله"], grammarConcepts: ["MSA vs dialect", "gender agreement"], culturalElements: ["Islamic greetings", "hospitality"] },
  ],
  german: [
    { lessonId: "de-greetings-1", musicalLessonId: "schlager-greetings", language: "german", topic: "German Greetings", vocabularyWords: ["Guten Tag", "Tschüss", "Bitte", "Danke schön", "Wie geht's"], grammarConcepts: ["Sie vs du", "word order"], culturalElements: ["handshake culture", "punctuality"] },
    { lessonId: "de-beer-1", musicalLessonId: "volksmusik-beer", language: "german", topic: "At the Biergarten", vocabularyWords: ["ein Bier bitte", "Prost", "die Speisekarte", "Schweinshaxe", "Gemütlichkeit"], grammarConcepts: ["articles (der/die/das)", "accusative case"], culturalElements: ["Biergarten rules", "Oktoberfest"] },
  ],
  mandarin: [
    { lessonId: "zh-greetings-1", musicalLessonId: "cpop-greetings", language: "mandarin", topic: "Chinese Greetings", vocabularyWords: ["你好", "谢谢", "不客气", "再见", "请问"], grammarConcepts: ["tones", "measure words"], culturalElements: ["face culture", "tea ceremony"] },
  ],
  hindi: [
    { lessonId: "hi-greetings-1", musicalLessonId: "bollywood-greetings", language: "hindi", topic: "Hindi Greetings", vocabularyWords: ["नमस्ते", "धन्यवाद", "कृपया", "कैसे हो", "अच्छा"], grammarConcepts: ["formal vs informal", "gender in verbs"], culturalElements: ["namaste gesture", "head wobble"] },
  ],
  russian: [
    { lessonId: "ru-greetings-1", musicalLessonId: "folk-greetings", language: "russian", topic: "Russian Greetings", vocabularyWords: ["Привет", "Спасибо", "Пожалуйста", "Как дела", "До свидания"], grammarConcepts: ["ты vs вы", "cases intro"], culturalElements: ["no smiling to strangers", "patronymics"] },
  ],
  swahili: [
    { lessonId: "sw-greetings-1", musicalLessonId: "bongo-greetings", language: "swahili", topic: "Swahili Greetings", vocabularyWords: ["Habari", "Asante", "Karibu", "Pole pole", "Hakuna matata"], grammarConcepts: ["noun classes", "verb prefixes"], culturalElements: ["greeting rituals", "ubuntu philosophy"] },
  ],
};

/**
 * Get musical lesson for a curriculum unit
 */
export function getMusicalLessonForUnit(lessonId: string, language: string): MusicalLessonMapping | null {
  const mappings = MUSICAL_CURRICULUM_MAP[language] || [];
  return mappings.find((m) => m.lessonId === lessonId) || null;
}

/**
 * Get all musical lessons for a language
 */
export function getAllMusicalLessons(language: string): MusicalLessonMapping[] {
  return MUSICAL_CURRICULUM_MAP[language] || [];
}

/**
 * Get vocabulary words from a musical lesson
 */
export function getMusicalLessonVocab(musicalLessonId: string, language: string): string[] {
  const mappings = MUSICAL_CURRICULUM_MAP[language] || [];
  const mapping = mappings.find((m) => m.musicalLessonId === musicalLessonId);
  return mapping?.vocabularyWords || [];
}

// ============================================
// 4. LEARNING SESSION TRACKING
// ============================================

/**
 * Record a learning session (any type)
 */
export async function recordLearningSession(session: LearningSession): Promise<void> {
  const sessions = await getLearningHistory();
  sessions.unshift(session);

  // Keep last 500 sessions
  const trimmed = sessions.slice(0, 500);
  await AsyncStorage.setItem(KEYS.LEARNING_SESSIONS, JSON.stringify(trimmed));

  // Update streak
  await updateStreak();

  // Update daily stats
  await updateDailyStats(session);
}

/**
 * Get learning history
 */
export async function getLearningHistory(limit: number = 50): Promise<LearningSession[]> {
  const data = await AsyncStorage.getItem(KEYS.LEARNING_SESSIONS);
  const sessions: LearningSession[] = data ? JSON.parse(data) : [];
  return sessions.slice(0, limit);
}

/**
 * Update learning streak
 */
async function updateStreak(): Promise<void> {
  const streakData = await AsyncStorage.getItem(KEYS.STREAK);
  const streak = streakData ? JSON.parse(streakData) : { current: 0, longest: 0, lastDate: "" };

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (streak.lastDate === today) return; // Already counted today

  if (streak.lastDate === yesterday) {
    streak.current += 1;
  } else if (streak.lastDate !== today) {
    streak.current = 1; // Reset streak
  }

  streak.longest = Math.max(streak.longest, streak.current);
  streak.lastDate = today;

  await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
}

/**
 * Get current streak
 */
export async function getStreak(): Promise<{ current: number; longest: number }> {
  const data = await AsyncStorage.getItem(KEYS.STREAK);
  return data ? JSON.parse(data) : { current: 0, longest: 0 };
}

/**
 * Update daily learning stats
 */
async function updateDailyStats(session: LearningSession): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const statsData = await AsyncStorage.getItem(KEYS.DAILY_STATS);
  const allStats = statsData ? JSON.parse(statsData) : {};

  if (!allStats[today]) {
    allStats[today] = { totalTime: 0, sessions: 0, wordsLearned: 0, xpEarned: 0 };
  }

  allStats[today].totalTime += session.duration;
  allStats[today].sessions += 1;
  allStats[today].wordsLearned += session.wordsLearned.length;
  allStats[today].xpEarned += session.score || 10;

  // Keep last 90 days
  const keys = Object.keys(allStats).sort().reverse().slice(0, 90);
  const trimmed: Record<string, any> = {};
  keys.forEach((k) => { trimmed[k] = allStats[k]; });

  await AsyncStorage.setItem(KEYS.DAILY_STATS, JSON.stringify(trimmed));
}

/**
 * Get daily stats for the past N days
 */
export async function getDailyStats(days: number = 7) {
  const data = await AsyncStorage.getItem(KEYS.DAILY_STATS);
  const allStats = data ? JSON.parse(data) : {};

  const result = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    result.push({
      date,
      ...(allStats[date] || { totalTime: 0, sessions: 0, wordsLearned: 0, xpEarned: 0 }),
    });
  }

  return result;
}

// ============================================
// HELPERS
// ============================================

async function updateWordsKnownCount(count: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.WORDS_KNOWN, count.toString());
}

export async function getWordsKnownCount(): Promise<number> {
  const data = await AsyncStorage.getItem(KEYS.WORDS_KNOWN);
  return data ? parseInt(data, 10) : 0;
}

/**
 * Get recommended next actions based on learning history
 */
export async function getRecommendations(language: string) {
  const vocabStats = await getVocabStats(language);
  const progress = await getProgressOverTime(language, 5);
  const streak = await getStreak();

  const recommendations: { type: string; title: string; reason: string; route: string }[] = [];

  // If many words due for review
  if (vocabStats.dueToday > 5) {
    recommendations.push({
      type: "vocab-review",
      title: "Review Vocabulary",
      reason: `${vocabStats.dueToday} words due for review`,
      route: "/vocab-cards",
    });
  }

  // If pronunciation needs work
  if (progress && progress.calls.length > 0) {
    const lastCall = progress.calls[0];
    if (lastCall.scores.pronunciation < 70) {
      recommendations.push({
        type: "pronunciation",
        title: "Pronunciation Practice",
        reason: "Your pronunciation scored below 70% last session",
        route: "/phoneme-pronunciation",
      });
    }
    if (lastCall.scores.grammar < 70) {
      recommendations.push({
        type: "grammar",
        title: "Grammar Battle",
        reason: "Strengthen grammar through competitive play",
        route: "/language-battles",
      });
    }
  }

  // If no call in 3 days, suggest one
  const history = await getCallHistory();
  const lastCallDate = history.find((h) => h.language === language)?.timestamp;
  if (!lastCallDate || Date.now() - lastCallDate > 3 * 86400000) {
    recommendations.push({
      type: "conversation",
      title: "Practice Speaking",
      reason: "It's been a while since your last conversation",
      route: "/conversation-scenarios",
    });
  }

  // Musical lesson suggestion
  recommendations.push({
    type: "musical",
    title: "Learn with Music",
    reason: "Songs help vocabulary stick 2x better",
    route: "/musical-lesson",
  });

  return recommendations.slice(0, 4);
}
