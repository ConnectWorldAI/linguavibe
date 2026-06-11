/**
 * Voice Room AI Moderation Engine
 * 
 * Provides intelligent moderation for live voice practice rooms:
 * - Real-time grammar/pronunciation correction prompts
 * - Topic steering when conversation stalls
 * - Level-matched conversation difficulty adjustment
 * - Turn-taking management for balanced participation
 * - Vocabulary injection based on room topic and level
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const AI_MOD_PREFS_KEY = "@connectworld_ai_mod_prefs";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type ProficiencyLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface ModerationConfig {
  correctionFrequency: "gentle" | "moderate" | "strict"; // How often AI corrects
  topicSteeringEnabled: boolean; // AI suggests new topics when silence detected
  turnManagementEnabled: boolean; // AI ensures everyone gets to speak
  vocabularyInjection: boolean; // AI introduces new words related to topic
  silenceThreshold: number; // Seconds before AI intervenes (default 15)
  correctionDelay: number; // Seconds to wait before correcting (allow self-correction)
  maxCorrectionsPerMinute: number; // Avoid overwhelming learners
}

export interface CorrectionEvent {
  id: string;
  timestamp: number;
  participantId: string;
  participantName: string;
  original: string;
  corrected: string;
  type: "grammar" | "pronunciation" | "vocabulary" | "conjugation" | "gender" | "word_order";
  severity: "minor" | "moderate" | "critical";
  explanation: string;
  level: ProficiencyLevel;
}

export interface TopicSuggestion {
  id: string;
  topic: string;
  prompt: string;
  level: ProficiencyLevel;
  language: string;
  category: "daily_life" | "culture" | "travel" | "work" | "debate" | "storytelling" | "games";
  estimatedDuration: number; // minutes
  vocabularyFocus: string[];
}

export interface TurnStatus {
  participantId: string;
  name: string;
  speakingTime: number; // seconds
  turnCount: number;
  lastSpoke: number; // timestamp
  isQuiet: boolean; // hasn't spoken in > 2 minutes
}

export interface ModerationState {
  isActive: boolean;
  roomId: string;
  config: ModerationConfig;
  corrections: CorrectionEvent[];
  currentTopic: TopicSuggestion | null;
  turnStatus: TurnStatus[];
  totalCorrections: number;
  sessionStart: number;
  lastCorrectionTime: number;
  silenceStart: number | null;
  vocabularyIntroduced: string[];
}

// ─── DEFAULT CONFIG ─────────────────────────────────────────────────────────

export const DEFAULT_MODERATION_CONFIG: ModerationConfig = {
  correctionFrequency: "moderate",
  topicSteeringEnabled: true,
  turnManagementEnabled: true,
  vocabularyInjection: true,
  silenceThreshold: 15,
  correctionDelay: 3,
  maxCorrectionsPerMinute: 4,
};

// ─── TOPIC SUGGESTIONS BY LEVEL ─────────────────────────────────────────────

export const TOPIC_SUGGESTIONS: TopicSuggestion[] = [
  // Beginner (A1-A2)
  {
    id: "t1", topic: "My Daily Routine", prompt: "Let's talk about what you do every day! Start with 'I wake up at...' and describe your morning.",
    level: "A1", language: "any", category: "daily_life", estimatedDuration: 5,
    vocabularyFocus: ["wake up", "breakfast", "commute", "lunch", "evening"],
  },
  {
    id: "t2", topic: "Favorite Foods", prompt: "What's your favorite food from a country whose language you're learning? Describe how it tastes!",
    level: "A1", language: "any", category: "culture", estimatedDuration: 5,
    vocabularyFocus: ["delicious", "spicy", "sweet", "ingredients", "recipe"],
  },
  {
    id: "t3", topic: "My Family", prompt: "Tell us about your family! How many brothers and sisters do you have? What do they do?",
    level: "A2", language: "any", category: "daily_life", estimatedDuration: 5,
    vocabularyFocus: ["brother", "sister", "parents", "older", "younger"],
  },
  {
    id: "t4", topic: "Weekend Plans", prompt: "What are you doing this weekend? Use future tense to describe your plans!",
    level: "A2", language: "any", category: "daily_life", estimatedDuration: 5,
    vocabularyFocus: ["going to", "plan", "maybe", "together", "excited"],
  },
  // Intermediate (B1-B2)
  {
    id: "t5", topic: "Travel Mishaps", prompt: "Share a funny or stressful travel story! What went wrong and how did you handle it?",
    level: "B1", language: "any", category: "travel", estimatedDuration: 8,
    vocabularyFocus: ["delayed", "lost", "confused", "eventually", "fortunately"],
  },
  {
    id: "t6", topic: "Cultural Differences", prompt: "What surprised you most about the culture of the language you're learning? Share a culture shock moment!",
    level: "B1", language: "any", category: "culture", estimatedDuration: 8,
    vocabularyFocus: ["surprised", "custom", "tradition", "different", "similar"],
  },
  {
    id: "t7", topic: "Dream Job", prompt: "If money wasn't an issue, what would your dream job be? Use conditional tense!",
    level: "B2", language: "any", category: "work", estimatedDuration: 8,
    vocabularyFocus: ["would", "if I could", "passion", "career", "fulfilling"],
  },
  {
    id: "t8", topic: "Movie Recommendations", prompt: "Recommend a movie or series in your target language. Explain the plot without spoilers!",
    level: "B2", language: "any", category: "culture", estimatedDuration: 8,
    vocabularyFocus: ["plot", "character", "recommend", "genre", "suspenseful"],
  },
  // Advanced (C1-C2)
  {
    id: "t9", topic: "AI & Language Learning", prompt: "Debate: Will AI replace human language teachers? Defend your position with arguments!",
    level: "C1", language: "any", category: "debate", estimatedDuration: 12,
    vocabularyFocus: ["artificial intelligence", "nuance", "irreplaceable", "efficiency", "empathy"],
  },
  {
    id: "t10", topic: "Climate & Society", prompt: "How is climate change affecting daily life in different countries? Discuss solutions you've heard about.",
    level: "C1", language: "any", category: "debate", estimatedDuration: 12,
    vocabularyFocus: ["sustainability", "carbon footprint", "renewable", "policy", "impact"],
  },
  {
    id: "t11", topic: "Collaborative Story", prompt: "Let's build a story together! Each person adds 2-3 sentences. I'll start: 'The old bookshop on the corner had a secret...'",
    level: "B2", language: "any", category: "storytelling", estimatedDuration: 10,
    vocabularyFocus: ["mysterious", "discovered", "suddenly", "meanwhile", "eventually"],
  },
  {
    id: "t12", topic: "Word Association Game", prompt: "I'll say a word, and the next person says the first word that comes to mind in the target language. Let's go! First word: 'ocean'",
    level: "A2", language: "any", category: "games", estimatedDuration: 5,
    vocabularyFocus: ["association", "reminds me of", "connected to", "similar", "opposite"],
  },
];

// ─── CORRECTION TEMPLATES ───────────────────────────────────────────────────

export const CORRECTION_TEMPLATES = {
  grammar: [
    { pattern: "verb agreement", explanation: "The verb should agree with the subject in number and person." },
    { pattern: "tense mismatch", explanation: "The tense doesn't match the time reference in your sentence." },
    { pattern: "article usage", explanation: "This noun requires a definite/indefinite article." },
    { pattern: "preposition", explanation: "This verb/noun takes a different preposition in this language." },
  ],
  pronunciation: [
    { pattern: "vowel sound", explanation: "This vowel has a different sound in this language than in English." },
    { pattern: "consonant cluster", explanation: "Try softening the consonant cluster — it flows more naturally." },
    { pattern: "stress placement", explanation: "The stress falls on a different syllable in this word." },
    { pattern: "intonation", explanation: "Questions in this language use a rising/falling intonation pattern." },
  ],
  vocabulary: [
    { pattern: "false friend", explanation: "This word looks similar to English but means something different!" },
    { pattern: "register mismatch", explanation: "This word is too formal/informal for this context." },
    { pattern: "collocation", explanation: "Native speakers typically pair this word with a different verb/adjective." },
  ],
  conjugation: [
    { pattern: "irregular verb", explanation: "This is an irregular verb — the conjugation doesn't follow the standard pattern." },
    { pattern: "subjunctive needed", explanation: "This context requires the subjunctive mood." },
    { pattern: "reflexive missing", explanation: "This verb is reflexive in this language — don't forget the pronoun!" },
  ],
  gender: [
    { pattern: "noun gender", explanation: "This noun is masculine/feminine — the article and adjective should match." },
    { pattern: "adjective agreement", explanation: "The adjective ending should match the gender of the noun." },
  ],
  word_order: [
    { pattern: "adjective placement", explanation: "In this language, adjectives typically come after the noun." },
    { pattern: "verb position", explanation: "The verb should be in a different position in this sentence structure." },
  ],
};

// ─── MODERATION ENGINE ──────────────────────────────────────────────────────

/**
 * Create a new moderation state for a room
 */
export function createModerationState(roomId: string, config?: Partial<ModerationConfig>): ModerationState {
  return {
    isActive: true,
    roomId,
    config: { ...DEFAULT_MODERATION_CONFIG, ...config },
    corrections: [],
    currentTopic: null,
    turnStatus: [],
    totalCorrections: 0,
    sessionStart: Date.now(),
    lastCorrectionTime: 0,
    silenceStart: null,
    vocabularyIntroduced: [],
  };
}

/**
 * Get topic suggestions filtered by level
 */
export function getTopicSuggestionsForLevel(level: ProficiencyLevel): TopicSuggestion[] {
  const levelOrder: ProficiencyLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const levelIdx = levelOrder.indexOf(level);
  // Include topics at this level and one below
  return TOPIC_SUGGESTIONS.filter((t) => {
    const topicIdx = levelOrder.indexOf(t.level);
    return topicIdx >= Math.max(0, levelIdx - 1) && topicIdx <= levelIdx;
  });
}

/**
 * Get a random topic suggestion for the given level
 */
export function getRandomTopic(level: ProficiencyLevel, excludeIds: string[] = []): TopicSuggestion | null {
  const available = getTopicSuggestionsForLevel(level).filter((t) => !excludeIds.includes(t.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Generate a correction event based on type and severity
 */
export function generateCorrection(
  participantId: string,
  participantName: string,
  type: CorrectionEvent["type"],
  severity: CorrectionEvent["severity"],
  original: string,
  corrected: string,
  level: ProficiencyLevel
): CorrectionEvent {
  const templates = CORRECTION_TEMPLATES[type] || CORRECTION_TEMPLATES.grammar;
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    participantId,
    participantName,
    original,
    corrected,
    type,
    severity,
    explanation: template.explanation,
    level,
  };
}

/**
 * Check if a correction should be issued based on config and timing
 */
export function shouldIssueCorrection(state: ModerationState): boolean {
  const now = Date.now();
  const timeSinceLastCorrection = (now - state.lastCorrectionTime) / 1000;
  const minInterval = 60 / state.config.maxCorrectionsPerMinute;
  
  if (timeSinceLastCorrection < minInterval) return false;
  if (timeSinceLastCorrection < state.config.correctionDelay) return false;
  
  // Frequency-based probability
  const probability = state.config.correctionFrequency === "gentle" ? 0.3
    : state.config.correctionFrequency === "moderate" ? 0.6
    : 0.9;
  
  return Math.random() < probability;
}

/**
 * Update turn status for a participant
 */
export function updateTurnStatus(
  state: ModerationState,
  participantId: string,
  name: string,
  isSpeaking: boolean
): ModerationState {
  const existing = state.turnStatus.find((t) => t.participantId === participantId);
  const now = Date.now();
  
  if (existing) {
    if (isSpeaking) {
      existing.speakingTime += 1;
      existing.lastSpoke = now;
      existing.isQuiet = false;
    } else {
      existing.isQuiet = (now - existing.lastSpoke) > 120000; // 2 minutes
    }
  } else {
    state.turnStatus.push({
      participantId,
      name,
      speakingTime: isSpeaking ? 1 : 0,
      turnCount: isSpeaking ? 1 : 0,
      lastSpoke: isSpeaking ? now : 0,
      isQuiet: !isSpeaking,
    });
  }
  
  return state;
}

/**
 * Get participants who haven't spoken recently (for turn management)
 */
export function getQuietParticipants(state: ModerationState): TurnStatus[] {
  return state.turnStatus.filter((t) => t.isQuiet);
}

/**
 * Generate a turn-management prompt to include quiet participants
 */
export function generateTurnPrompt(quietParticipants: TurnStatus[]): string {
  if (quietParticipants.length === 0) return "";
  if (quietParticipants.length === 1) {
    return `${quietParticipants[0].name}, we'd love to hear your thoughts! Would you like to share?`;
  }
  const names = quietParticipants.slice(0, 2).map((p) => p.name).join(" and ");
  return `${names}, you've been quiet — would either of you like to jump in?`;
}

/**
 * Get vocabulary to introduce based on current topic and level
 */
export function getVocabularyForTopic(topic: TopicSuggestion, alreadyIntroduced: string[]): string[] {
  return topic.vocabularyFocus.filter((v) => !alreadyIntroduced.includes(v)).slice(0, 2);
}

/**
 * Generate a vocabulary injection message
 */
export function generateVocabularyPrompt(words: string[], language: string): string {
  if (words.length === 0) return "";
  if (words.length === 1) {
    return `📚 New word alert! Try using "${words[0]}" in your next sentence. It means...`;
  }
  return `📚 Vocabulary boost! Try working these words into the conversation: "${words.join('" and "')}"`;
}

/**
 * Detect if silence threshold has been reached
 */
export function checkSilenceThreshold(state: ModerationState, anySpeaking: boolean): { shouldIntervene: boolean; duration: number } {
  const now = Date.now();
  
  if (anySpeaking) {
    state.silenceStart = null;
    return { shouldIntervene: false, duration: 0 };
  }
  
  if (!state.silenceStart) {
    state.silenceStart = now;
    return { shouldIntervene: false, duration: 0 };
  }
  
  const duration = (now - state.silenceStart) / 1000;
  return {
    shouldIntervene: duration >= state.config.silenceThreshold,
    duration,
  };
}

/**
 * Get session summary after leaving a room
 */
export function getSessionSummary(state: ModerationState): {
  duration: number;
  totalCorrections: number;
  topicsDiscussed: number;
  vocabularyLearned: string[];
  participationScore: number;
  correctionBreakdown: Record<CorrectionEvent["type"], number>;
} {
  const duration = Math.round((Date.now() - state.sessionStart) / 60000); // minutes
  const correctionBreakdown: Record<CorrectionEvent["type"], number> = {
    grammar: 0, pronunciation: 0, vocabulary: 0, conjugation: 0, gender: 0, word_order: 0,
  };
  state.corrections.forEach((c) => { correctionBreakdown[c.type]++; });
  
  // Participation score based on speaking time relative to others
  const totalSpeaking = state.turnStatus.reduce((sum, t) => sum + t.speakingTime, 0);
  const userSpeaking = state.turnStatus[0]?.speakingTime || 0;
  const participationScore = totalSpeaking > 0 ? Math.round((userSpeaking / totalSpeaking) * 100) : 0;
  
  return {
    duration,
    totalCorrections: state.corrections.length,
    topicsDiscussed: state.currentTopic ? 1 : 0,
    vocabularyLearned: state.vocabularyIntroduced,
    participationScore,
    correctionBreakdown,
  };
}

/**
 * Save moderation preferences
 */
export async function saveModerationPrefs(config: ModerationConfig): Promise<void> {
  await AsyncStorage.setItem(AI_MOD_PREFS_KEY, JSON.stringify(config));
}

/**
 * Load moderation preferences
 */
export async function loadModerationPrefs(): Promise<ModerationConfig> {
  try {
    const stored = await AsyncStorage.getItem(AI_MOD_PREFS_KEY);
    if (stored) return { ...DEFAULT_MODERATION_CONFIG, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_MODERATION_CONFIG;
}

/**
 * Get level-appropriate rooms for a user's proficiency
 */
export function filterRoomsByLevel(rooms: { level: string }[], userLevel: ProficiencyLevel): typeof rooms {
  const levelOrder: ProficiencyLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const userIdx = levelOrder.indexOf(userLevel);
  
  // Map room levels to proficiency
  const levelMap: Record<string, number[]> = {
    beginner: [0, 1], // A1, A2
    intermediate: [2, 3], // B1, B2
    advanced: [4, 5], // C1, C2
    all: [0, 1, 2, 3, 4, 5],
  };
  
  return rooms.filter((r) => {
    const allowedRange = levelMap[r.level] || levelMap.all;
    // Allow user to join rooms within 1 level of their proficiency
    return allowedRange.some((idx) => Math.abs(idx - userIdx) <= 1) || r.level === "all";
  });
}
