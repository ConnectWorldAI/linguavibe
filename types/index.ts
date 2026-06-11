// Language & Dialect Types
export interface Language {
  id: string;
  name: string;
  nativeName: string;
  code: string; // ISO 639-1
  flag: string; // emoji
  dialects: Dialect[];
}

export interface Dialect {
  id: string;
  name: string;
  region: string;
  languageId: string;
  hasSlang: boolean;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  nativeLanguage: Language;
  targetLanguages: Language[];
  currentLevel: ProficiencyLevel;
  credits: number;
  subscription: SubscriptionTier;
  streak: number;
  xp: number;
  selectedTeacherId?: string;
}

export type ProficiencyLevel = "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced" | "native";

export type SubscriptionTier = "free" | "plus" | "pro";

// Song Types
export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  originalLanguage: Language;
  translatedLanguage: Language;
  dialect?: Dialect;
  duration: number; // seconds
  difficulty: "easy" | "medium" | "hard";
  lyrics: LyricLine[];
  vocalsUrl?: string;
  instrumentalUrl?: string;
  fullMixUrl?: string;
  createdAt: string;
}

export interface LyricLine {
  id: string;
  timestamp: number; // seconds
  original: string;
  translated: string;
  phonetic?: string;
}

export type PlaybackMode = "full_mix" | "vocals_only" | "instrumental_only";

// Lesson Types
export interface Course {
  id: string;
  title: string;
  description: string;
  language: Language;
  level: ProficiencyLevel;
  totalLessons: number;
  completedLessons: number;
  isPurchased: boolean;
  price?: number; // one-time purchase price
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  type: LessonType;
  duration: number; // minutes
  xpReward: number;
  isCompleted: boolean;
  isLocked: boolean;
  exercises: Exercise[];
}

export type LessonType = "grammar" | "vocabulary" | "listening" | "reading" | "speaking";

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  audioUrl?: string;
}

export type ExerciseType = "multiple_choice" | "fill_blank" | "drag_drop" | "record_pronunciation" | "translate" | "listen_select";

// Grammar Breakdown (from songs)
export interface GrammarBreakdown {
  id: string;
  songId: string;
  word: string;
  translation: string;
  partOfSpeech: PartOfSpeech;
  gender?: "masculine" | "feminine" | "neutral";
  conjugation?: string;
  tense?: string;
  example: string;
  notes?: string;
}

export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "pronoun" | "preposition" | "conjunction" | "interjection" | "article";

// Teacher Types
export interface Teacher {
  id: string;
  name: string;
  avatar: string; // realistic avatar image URL
  language: Language;
  dialect?: Dialect;
  specialty: string;
  personality: string;
  rating: number;
  totalSessions: number;
  bio: string;
  voiceStyle: string;
  accentDescription: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  teacherId: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  duration: number; // seconds
  creditsUsed: number;
  topic?: string;
  summary?: ConversationSummary;
}

export interface ConversationSummary {
  corrections: Correction[];
  newVocabulary: VocabularyItem[];
  score: number; // 0-100
  feedback: string;
  minutesPracticed: number;
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface VocabularyItem {
  word: string;
  translation: string;
  context: string;
}

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number; // monthly
  yearlyPrice?: number;
  features: string[];
  creditsPerMonth: number;
  songTranslationsPerMonth: number;
  teacherMinutesPerMonth: number;
}

// Credits
export interface CreditTransaction {
  id: string;
  type: "earned" | "spent" | "purchased";
  amount: number;
  description: string;
  timestamp: string;
}
