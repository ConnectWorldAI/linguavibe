/**
 * Error Pattern Detection & Targeted Drills
 * 
 * Tracks recurring mistakes across flashcards, conversations, quizzes, and pronunciation.
 * Identifies patterns (e.g., always confusing ser/estar, wrong tense usage) and
 * auto-generates targeted micro-lessons for weak spots.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ErrorCategory =
  | "grammar"
  | "vocabulary"
  | "pronunciation"
  | "spelling"
  | "tense"
  | "gender"
  | "word_order"
  | "preposition"
  | "conjugation"
  | "false_friend";

export type ErrorSource =
  | "flashcard"
  | "conversation"
  | "quiz"
  | "pronunciation"
  | "writing"
  | "placement_test"
  | "challenge";

export interface ErrorEntry {
  id: string;
  timestamp: string;
  source: ErrorSource;
  category: ErrorCategory;
  targetWord: string;         // The word/phrase that was wrong
  userAnswer: string;         // What the user said/typed
  correctAnswer: string;      // What it should have been
  context?: string;           // Sentence or context where error occurred
  language: string;           // Target language
  severity: 1 | 2 | 3;       // 1=minor, 2=moderate, 3=critical
}

export interface ErrorPattern {
  id: string;
  category: ErrorCategory;
  description: string;        // Human-readable pattern description
  examples: Array<{
    userAnswer: string;
    correctAnswer: string;
    context?: string;
  }>;
  frequency: number;          // How many times this pattern appeared
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;          // Has the user corrected this pattern?
  resolutionScore: number;    // 0-100, how well they've improved
}

export interface DrillExercise {
  id: string;
  patternId: string;
  type: "fill_blank" | "multiple_choice" | "translate" | "correct_error" | "conjugate";
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 1 | 2 | 3;
}

export interface DrillSession {
  id: string;
  patternIds: string[];
  exercises: DrillExercise[];
  startedAt: string;
  completedAt?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface ErrorStats {
  totalErrors: number;
  patternsDetected: number;
  patternsResolved: number;
  topWeaknesses: ErrorPattern[];
  improvementRate: number;    // Percentage improvement over last 7 days
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySource: Record<ErrorSource, number>;
  recentTrend: "improving" | "stable" | "declining";
}

// ─── Storage Keys ───────────────────────────────────────────────────────────

const ERRORS_KEY = "@error_pattern_entries";
const PATTERNS_KEY = "@error_patterns";
const DRILLS_KEY = "@error_drill_sessions";
const STATS_CACHE_KEY = "@error_stats_cache";

// ─── Error Logging ──────────────────────────────────────────────────────────

/**
 * Log a new error from any learning activity
 */
export async function logError(error: Omit<ErrorEntry, "id" | "timestamp">): Promise<void> {
  const entries = await getErrorEntries();
  const newEntry: ErrorEntry = {
    ...error,
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  entries.push(newEntry);
  // Keep last 500 errors
  const trimmed = entries.slice(-500);
  await AsyncStorage.setItem(ERRORS_KEY, JSON.stringify(trimmed));
  // Trigger pattern detection after every 5 errors
  if (trimmed.length % 5 === 0) {
    await detectPatterns();
  }
}

/**
 * Get all logged error entries
 */
export async function getErrorEntries(): Promise<ErrorEntry[]> {
  const raw = await AsyncStorage.getItem(ERRORS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// ─── Pattern Detection ──────────────────────────────────────────────────────

/**
 * Analyze error entries and detect recurring patterns
 */
export async function detectPatterns(): Promise<ErrorPattern[]> {
  const entries = await getErrorEntries();
  const existingPatterns = await getPatterns();
  
  // Group errors by category + similar target words
  const groups: Record<string, ErrorEntry[]> = {};
  
  for (const entry of entries) {
    // Group by category
    const categoryKey = entry.category;
    if (!groups[categoryKey]) groups[categoryKey] = [];
    groups[categoryKey].push(entry);
    
    // Group by specific confusion pairs (e.g., ser/estar)
    const pairKey = `${entry.category}:${normalizeWord(entry.correctAnswer)}`;
    if (!groups[pairKey]) groups[pairKey] = [];
    groups[pairKey].push(entry);
  }
  
  const newPatterns: ErrorPattern[] = [];
  
  for (const [key, groupEntries] of Object.entries(groups)) {
    // Only flag as pattern if it appears 3+ times
    if (groupEntries.length < 3) continue;
    
    // Check if pattern already exists
    const existing = existingPatterns.find(p => p.id === `pat_${hashString(key)}`);
    if (existing) {
      // Update existing pattern
      existing.frequency = groupEntries.length;
      existing.lastSeen = groupEntries[groupEntries.length - 1].timestamp;
      existing.examples = groupEntries.slice(-5).map(e => ({
        userAnswer: e.userAnswer,
        correctAnswer: e.correctAnswer,
        context: e.context,
      }));
      // Check if user has improved (fewer recent errors)
      const recentErrors = groupEntries.filter(e => {
        const dayAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return new Date(e.timestamp).getTime() > dayAgo;
      });
      const olderErrors = groupEntries.filter(e => {
        const dayAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return new Date(e.timestamp).getTime() <= dayAgo;
      });
      if (olderErrors.length > 0 && recentErrors.length === 0) {
        existing.resolved = true;
        existing.resolutionScore = 100;
      } else if (olderErrors.length > recentErrors.length) {
        existing.resolutionScore = Math.round(
          ((olderErrors.length - recentErrors.length) / olderErrors.length) * 100
        );
      }
      newPatterns.push(existing);
    } else {
      // Create new pattern
      const category = groupEntries[0].category;
      const description = generatePatternDescription(category, groupEntries);
      newPatterns.push({
        id: `pat_${hashString(key)}`,
        category,
        description,
        examples: groupEntries.slice(-5).map(e => ({
          userAnswer: e.userAnswer,
          correctAnswer: e.correctAnswer,
          context: e.context,
        })),
        frequency: groupEntries.length,
        firstSeen: groupEntries[0].timestamp,
        lastSeen: groupEntries[groupEntries.length - 1].timestamp,
        resolved: false,
        resolutionScore: 0,
      });
    }
  }
  
  await AsyncStorage.setItem(PATTERNS_KEY, JSON.stringify(newPatterns));
  return newPatterns;
}

/**
 * Get all detected patterns
 */
export async function getPatterns(): Promise<ErrorPattern[]> {
  const raw = await AsyncStorage.getItem(PATTERNS_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Get unresolved patterns sorted by frequency (most problematic first)
 */
export async function getActivePatterns(): Promise<ErrorPattern[]> {
  const patterns = await getPatterns();
  return patterns
    .filter(p => !p.resolved)
    .sort((a, b) => b.frequency - a.frequency);
}

// ─── Targeted Drill Generation ──────────────────────────────────────────────

/**
 * Generate a targeted drill session for the user's top weak patterns
 */
export async function generateDrillSession(maxExercises: number = 10): Promise<DrillSession> {
  const patterns = await getActivePatterns();
  const topPatterns = patterns.slice(0, 3); // Focus on top 3 weaknesses
  
  const exercises: DrillExercise[] = [];
  
  for (const pattern of topPatterns) {
    const drills = generateDrillsForPattern(pattern, Math.ceil(maxExercises / topPatterns.length));
    exercises.push(...drills);
  }
  
  // Shuffle exercises
  const shuffled = exercises.sort(() => Math.random() - 0.5).slice(0, maxExercises);
  
  const session: DrillSession = {
    id: `drill_${Date.now()}`,
    patternIds: topPatterns.map(p => p.id),
    exercises: shuffled,
    startedAt: new Date().toISOString(),
    score: 0,
    totalQuestions: shuffled.length,
    correctAnswers: 0,
  };
  
  return session;
}

/**
 * Generate drill exercises for a specific error pattern
 */
function generateDrillsForPattern(pattern: ErrorPattern, count: number): DrillExercise[] {
  const drills: DrillExercise[] = [];
  
  for (let i = 0; i < count && i < pattern.examples.length; i++) {
    const example = pattern.examples[i];
    
    switch (pattern.category) {
      case "tense":
      case "conjugation":
        drills.push({
          id: `ex_${Date.now()}_${i}`,
          patternId: pattern.id,
          type: "conjugate",
          prompt: `Conjugate correctly: "${example.context || example.correctAnswer}"`,
          correctAnswer: example.correctAnswer,
          explanation: `You often write "${example.userAnswer}" instead of "${example.correctAnswer}". ${getExplanationForCategory(pattern.category)}`,
          difficulty: Math.min(3, Math.ceil(pattern.frequency / 3)) as 1 | 2 | 3,
        });
        break;
        
      case "gender":
      case "preposition":
        drills.push({
          id: `ex_${Date.now()}_${i}`,
          patternId: pattern.id,
          type: "fill_blank",
          prompt: generateFillBlankPrompt(example, pattern.category),
          correctAnswer: example.correctAnswer,
          explanation: `The correct form is "${example.correctAnswer}". ${getExplanationForCategory(pattern.category)}`,
          difficulty: Math.min(3, Math.ceil(pattern.frequency / 3)) as 1 | 2 | 3,
        });
        break;
        
      case "vocabulary":
      case "false_friend":
        drills.push({
          id: `ex_${Date.now()}_${i}`,
          patternId: pattern.id,
          type: "multiple_choice",
          prompt: `Which is the correct translation/usage?`,
          options: generateOptions(example.correctAnswer, example.userAnswer),
          correctAnswer: example.correctAnswer,
          explanation: `"${example.userAnswer}" is incorrect. The correct answer is "${example.correctAnswer}". ${getExplanationForCategory(pattern.category)}`,
          difficulty: Math.min(3, Math.ceil(pattern.frequency / 3)) as 1 | 2 | 3,
        });
        break;
        
      case "grammar":
      case "word_order":
      case "spelling":
        drills.push({
          id: `ex_${Date.now()}_${i}`,
          patternId: pattern.id,
          type: "correct_error",
          prompt: `Find and correct the error: "${example.userAnswer}"`,
          correctAnswer: example.correctAnswer,
          explanation: `The correct form is "${example.correctAnswer}". ${getExplanationForCategory(pattern.category)}`,
          difficulty: Math.min(3, Math.ceil(pattern.frequency / 3)) as 1 | 2 | 3,
        });
        break;
        
      default:
        drills.push({
          id: `ex_${Date.now()}_${i}`,
          patternId: pattern.id,
          type: "translate",
          prompt: `Translate correctly: "${example.context || example.correctAnswer}"`,
          correctAnswer: example.correctAnswer,
          explanation: `You wrote "${example.userAnswer}" but the correct answer is "${example.correctAnswer}".`,
          difficulty: 2,
        });
    }
  }
  
  return drills;
}

/**
 * Record drill session results and update pattern resolution scores
 */
export async function completeDrillSession(
  session: DrillSession,
  results: Array<{ exerciseId: string; correct: boolean }>
): Promise<DrillSession> {
  const correctCount = results.filter(r => r.correct).length;
  const completed: DrillSession = {
    ...session,
    completedAt: new Date().toISOString(),
    correctAnswers: correctCount,
    score: Math.round((correctCount / session.totalQuestions) * 100),
  };
  
  // Save session
  const sessions = await getDrillSessions();
  sessions.push(completed);
  await AsyncStorage.setItem(DRILLS_KEY, JSON.stringify(sessions.slice(-50)));
  
  // Update pattern resolution scores
  if (completed.score >= 80) {
    const patterns = await getPatterns();
    for (const patternId of session.patternIds) {
      const pattern = patterns.find(p => p.id === patternId);
      if (pattern) {
        pattern.resolutionScore = Math.min(100, pattern.resolutionScore + 20);
        if (pattern.resolutionScore >= 100) {
          pattern.resolved = true;
        }
      }
    }
    await AsyncStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
  }
  
  return completed;
}

/**
 * Get drill
 session history
 */
export async function getDrillSessions(): Promise<DrillSession[]> {
  const raw = await AsyncStorage.getItem(DRILLS_KEY);
  return raw ? JSON.parse(raw) : [];
}

// ─── Statistics ─────────────────────────────────────────────────────────────

/**
 * Get comprehensive error statistics
 */
export async function getErrorStats(): Promise<ErrorStats> {
  const entries = await getErrorEntries();
  const patterns = await getPatterns();
  
  // Count by category
  const errorsByCategory: Record<ErrorCategory, number> = {
    grammar: 0, vocabulary: 0, pronunciation: 0, spelling: 0,
    tense: 0, gender: 0, word_order: 0, preposition: 0,
    conjugation: 0, false_friend: 0,
  };
  
  const errorsBySource: Record<ErrorSource, number> = {
    flashcard: 0, conversation: 0, quiz: 0, pronunciation: 0,
    writing: 0, placement_test: 0, challenge: 0,
  };
  
  for (const entry of entries) {
    errorsByCategory[entry.category]++;
    errorsBySource[entry.source]++;
  }
  
  // Calculate improvement rate
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  
  const thisWeekErrors = entries.filter(e => new Date(e.timestamp).getTime() > weekAgo).length;
  const lastWeekErrors = entries.filter(e => {
    const t = new Date(e.timestamp).getTime();
    return t > twoWeeksAgo && t <= weekAgo;
  }).length;
  
  const improvementRate = lastWeekErrors > 0
    ? Math.round(((lastWeekErrors - thisWeekErrors) / lastWeekErrors) * 100)
    : 0;
  
  // Determine trend
  let recentTrend: "improving" | "stable" | "declining" = "stable";
  if (improvementRate > 10) recentTrend = "improving";
  else if (improvementRate < -10) recentTrend = "declining";
  
  const activePatterns = patterns.filter(p => !p.resolved);
  const resolvedPatterns = patterns.filter(p => p.resolved);
  
  return {
    totalErrors: entries.length,
    patternsDetected: patterns.length,
    patternsResolved: resolvedPatterns.length,
    topWeaknesses: activePatterns.slice(0, 5),
    improvementRate,
    errorsByCategory,
    errorsBySource,
    recentTrend,
  };
}

/**
 * Get a quick summary of what the user needs to work on
 */
export async function getWeaknessReport(): Promise<{
  topIssues: string[];
  suggestedDrillMinutes: number;
  urgentPatterns: ErrorPattern[];
}> {
  const patterns = await getActivePatterns();
  const topIssues = patterns.slice(0, 3).map(p => p.description);
  const urgentPatterns = patterns.filter(p => p.frequency >= 5);
  
  return {
    topIssues,
    suggestedDrillMinutes: Math.min(15, patterns.length * 3),
    urgentPatterns,
  };
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/[^a-záéíóúñüàèìòùâêîôûäëïöü]/gi, "");
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generatePatternDescription(category: ErrorCategory, entries: ErrorEntry[]): string {
  const sample = entries[0];
  switch (category) {
    case "tense":
      return `Recurring tense confusion: often using wrong verb tense (e.g., "${sample.userAnswer}" instead of "${sample.correctAnswer}")`;
    case "gender":
      return `Gender agreement errors: mixing masculine/feminine forms (e.g., "${sample.userAnswer}" vs "${sample.correctAnswer}")`;
    case "conjugation":
      return `Conjugation mistakes: incorrect verb forms (e.g., "${sample.userAnswer}" instead of "${sample.correctAnswer}")`;
    case "preposition":
      return `Preposition confusion: using wrong prepositions (e.g., "${sample.userAnswer}" vs "${sample.correctAnswer}")`;
    case "vocabulary":
      return `Vocabulary mix-up: confusing similar words (e.g., "${sample.userAnswer}" with "${sample.correctAnswer}")`;
    case "false_friend":
      return `False friend trap: using words that look similar but mean different things`;
    case "word_order":
      return `Word order issues: placing words in incorrect positions`;
    case "spelling":
      return `Spelling pattern: recurring misspellings (e.g., "${sample.userAnswer}")`;
    case "grammar":
      return `Grammar rule confusion: repeated structural errors`;
    case "pronunciation":
      return `Pronunciation pattern: consistently mispronouncing certain sounds`;
    default:
      return `Recurring error in ${category}`;
  }
}

function generateFillBlankPrompt(
  example: { userAnswer: string; correctAnswer: string; context?: string },
  category: ErrorCategory
): string {
  if (example.context) {
    return `Fill in the blank: ${example.context.replace(example.correctAnswer, "___")}`;
  }
  return `Choose the correct ${category}: ___ (hint: not "${example.userAnswer}")`;
}

function generateOptions(correct: string, wrong: string): string[] {
  const distractors = [
    wrong,
    correct + "s",
    correct.slice(0, -1),
  ].filter(d => d !== correct && d.length > 0);
  
  const options = [correct, ...distractors.slice(0, 3)];
  return options.sort(() => Math.random() - 0.5);
}

function getExplanationForCategory(category: ErrorCategory): string {
  switch (category) {
    case "tense":
      return "Pay attention to time indicators in the sentence to choose the correct tense.";
    case "gender":
      return "Remember to match articles and adjectives with the noun's gender.";
    case "conjugation":
      return "Check the subject of the sentence to determine the correct verb ending.";
    case "preposition":
      return "Prepositions often don't translate directly between languages. Try to memorize common combinations.";
    case "vocabulary":
      return "These words are commonly confused. Try creating mental associations to distinguish them.";
    case "false_friend":
      return "This word looks similar to an English word but has a different meaning.";
    case "word_order":
      return "Remember that word order rules differ between languages.";
    case "spelling":
      return "Pay attention to accent marks and special characters.";
    default:
      return "Review this rule and practice with more examples.";
  }
}
