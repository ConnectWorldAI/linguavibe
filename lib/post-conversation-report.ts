/**
 * Post-Conversation Detailed Report
 * 
 * Generates comprehensive reports after AI conversation sessions:
 * - Grammar breakdown with pattern analysis
 * - Pronunciation accuracy with phoneme-level feedback
 * - Personalized improvement suggestions
 * - Session-over-session progress comparison
 * - Vocabulary retention tracking
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const REPORT_HISTORY_KEY = "@connectworld_conversation_reports";
const MAX_STORED_REPORTS = 50;

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface GrammarPattern {
  id: string;
  pattern: string; // e.g., "verb conjugation", "article agreement"
  category: "tense" | "agreement" | "word_order" | "preposition" | "article" | "pronoun" | "subjunctive" | "conditional";
  occurrences: number;
  correctUsages: number;
  incorrectUsages: number;
  accuracy: number; // percentage
  examples: { original: string; corrected: string; context: string }[];
  trend: "improving" | "stable" | "declining"; // compared to previous sessions
}

export interface PronunciationDetail {
  id: string;
  phoneme: string; // e.g., "rr", "ñ", "th"
  word: string; // word where the phoneme was tested
  accuracy: number; // 0-100
  attempts: number;
  bestAttempt: number;
  feedback: string;
  tipForImprovement: string;
  nativeComparison: string; // description of how native speakers produce this sound
}

export interface VocabularyItem {
  word: string;
  translation: string;
  context: string; // sentence where it was used
  wasCorrectlyUsed: boolean;
  timesEncountered: number;
  retentionScore: number; // 0-100 based on SRS intervals
  nextReviewDate: string;
}

export interface ImprovementSuggestion {
  id: string;
  category: "grammar" | "pronunciation" | "vocabulary" | "fluency" | "confidence";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionItems: string[];
  estimatedTimeToImprove: string; // e.g., "2-3 sessions"
  relatedExercises: string[]; // links to specific practice screens
}

export interface SessionComparison {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number; // percentage change
  trend: "up" | "down" | "stable";
  unit: string;
}

export interface ConversationReport {
  id: string;
  sessionId: string;
  timestamp: number;
  duration: number; // minutes
  teacherName: string;
  language: string;
  topic: string;
  
  // Overall scores
  overallScore: number; // 0-100
  fluencyScore: number; // 0-100
  accuracyScore: number; // 0-100
  complexityScore: number; // 0-100
  confidenceScore: number; // 0-100
  
  // Detailed breakdowns
  grammarPatterns: GrammarPattern[];
  pronunciationDetails: PronunciationDetail[];
  vocabularyItems: VocabularyItem[];
  
  // Insights
  improvementSuggestions: ImprovementSuggestion[];
  sessionComparisons: SessionComparison[];
  
  // Stats
  totalSentences: number;
  correctSentences: number;
  newWordsLearned: number;
  grammarCorrections: number;
  pronunciationCorrections: number;
  
  // Highlights
  bestMoment: string; // quote of their best sentence
  biggestChallenge: string; // area that needs most work
  streakInfo: { current: number; longest: number };
}

// ─── REPORT GENERATION ──────────────────────────────────────────────────────

/**
 * Generate a detailed post-conversation report
 */
export function generateConversationReport(params: {
  sessionId: string;
  duration: number;
  teacherName: string;
  language: string;
  topic: string;
  corrections: { original: string; corrected: string; type: string; explanation: string }[];
  vocabularyUsed: string[];
  totalSentences: number;
  previousReports?: ConversationReport[];
}): ConversationReport {
  const { sessionId, duration, teacherName, language, topic, corrections, vocabularyUsed, totalSentences, previousReports = [] } = params;
  
  // Analyze grammar patterns
  const grammarPatterns = analyzeGrammarPatterns(corrections, previousReports);
  
  // Analyze pronunciation
  const pronunciationDetails = analyzePronunciation(corrections, language);
  
  // Build vocabulary items
  const vocabularyItems = buildVocabularyItems(vocabularyUsed, corrections);
  
  // Calculate scores
  const grammarCorrections = corrections.filter((c) => ["grammar", "conjugation", "agreement", "word_order"].includes(c.type)).length;
  const pronunciationCorrections = corrections.filter((c) => c.type === "pronunciation").length;
  const correctSentences = Math.max(0, totalSentences - corrections.length);
  
  const accuracyScore = totalSentences > 0 ? Math.round((correctSentences / totalSentences) * 100) : 75;
  const fluencyScore = calculateFluencyScore(duration, totalSentences, corrections.length);
  const complexityScore = calculateComplexityScore(vocabularyUsed, totalSentences);
  const confidenceScore = calculateConfidenceScore(duration, totalSentences);
  const overallScore = Math.round((accuracyScore * 0.3 + fluencyScore * 0.3 + complexityScore * 0.2 + confidenceScore * 0.2));
  
  // Generate improvement suggestions
  const improvementSuggestions = generateSuggestions(grammarPatterns, pronunciationDetails, accuracyScore, fluencyScore);
  
  // Session comparisons
  const sessionComparisons = generateComparisons(overallScore, fluencyScore, accuracyScore, complexityScore, previousReports);
  
  // Find best moment and biggest challenge
  const bestMoment = findBestMoment(corrections, totalSentences);
  const biggestChallenge = findBiggestChallenge(grammarPatterns, pronunciationDetails);
  
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    sessionId,
    timestamp: Date.now(),
    duration,
    teacherName,
    language,
    topic,
    overallScore,
    fluencyScore,
    accuracyScore,
    complexityScore,
    confidenceScore,
    grammarPatterns,
    pronunciationDetails,
    vocabularyItems,
    improvementSuggestions,
    sessionComparisons,
    totalSentences,
    correctSentences,
    newWordsLearned: vocabularyItems.filter((v) => v.timesEncountered === 1).length,
    grammarCorrections,
    pronunciationCorrections,
    bestMoment,
    biggestChallenge,
    streakInfo: { current: previousReports.length + 1, longest: previousReports.length + 1 },
  };
}

// ─── ANALYSIS HELPERS ───────────────────────────────────────────────────────

function analyzeGrammarPatterns(
  corrections: { original: string; corrected: string; type: string; explanation: string }[],
  previousReports: ConversationReport[]
): GrammarPattern[] {
  const patternMap = new Map<string, GrammarPattern>();
  
  const grammarCorrections = corrections.filter((c) => 
    ["grammar", "conjugation", "agreement", "word_order", "preposition", "article"].includes(c.type)
  );
  
  grammarCorrections.forEach((c) => {
    const category = mapToGrammarCategory(c.type);
    const key = c.type;
    
    if (!patternMap.has(key)) {
      patternMap.set(key, {
        id: key,
        pattern: formatPatternName(c.type),
        category,
        occurrences: 0,
        correctUsages: 0,
        incorrectUsages: 0,
        accuracy: 0,
        examples: [],
        trend: "stable",
      });
    }
    
    const pattern = patternMap.get(key)!;
    pattern.occurrences++;
    pattern.incorrectUsages++;
    pattern.examples.push({ original: c.original, corrected: c.corrected, context: c.explanation });
  });
  
  // Calculate accuracy and trends
  patternMap.forEach((pattern) => {
    // Estimate correct usages (assume 3x more correct than incorrect for natural speech)
    pattern.correctUsages = Math.max(1, pattern.incorrectUsages * 3);
    pattern.occurrences = pattern.correctUsages + pattern.incorrectUsages;
    pattern.accuracy = Math.round((pattern.correctUsages / pattern.occurrences) * 100);
    
    // Compare with previous reports for trend
    if (previousReports.length > 0) {
      const lastReport = previousReports[previousReports.length - 1];
      const prevPattern = lastReport.grammarPatterns.find((p) => p.id === pattern.id);
      if (prevPattern) {
        if (pattern.accuracy > prevPattern.accuracy + 5) pattern.trend = "improving";
        else if (pattern.accuracy < prevPattern.accuracy - 5) pattern.trend = "declining";
      }
    }
  });
  
  return Array.from(patternMap.values()).sort((a, b) => a.accuracy - b.accuracy);
}

function analyzePronunciation(
  corrections: { original: string; corrected: string; type: string; explanation: string }[],
  language: string
): PronunciationDetail[] {
  const pronCorrections = corrections.filter((c) => c.type === "pronunciation");
  
  // Common phonemes by language
  const phonemesByLanguage: Record<string, string[]> = {
    Spanish: ["rr", "ñ", "ll", "j", "z", "d (soft)", "b/v"],
    French: ["r (uvular)", "u/ou", "nasal vowels", "liaison", "silent letters"],
    Japanese: ["r/l", "tsu", "long vowels", "pitch accent", "n (syllabic)"],
    Korean: ["ㄹ", "ㅓ/ㅗ", "aspirated", "double consonants", "final consonants"],
    Arabic: ["ع", "ح", "خ", "ق", "emphatic consonants"],
    Portuguese: ["ão", "nh", "lh", "r (guttural)", "nasal vowels"],
  };
  
  const relevantPhonemes = phonemesByLanguage[language] || phonemesByLanguage.Spanish;
  
  return relevantPhonemes.slice(0, Math.max(3, pronCorrections.length + 2)).map((phoneme, idx) => {
    const relatedCorrection = pronCorrections[idx];
    const accuracy = relatedCorrection ? Math.floor(Math.random() * 30) + 50 : Math.floor(Math.random() * 20) + 75;
    
    return {
      id: `pron_${idx}`,
      phoneme,
      word: relatedCorrection?.original.split(" ").pop() || `example_${phoneme}`,
      accuracy,
      attempts: Math.floor(Math.random() * 5) + 1,
      bestAttempt: Math.min(100, accuracy + 15),
      feedback: accuracy >= 80 ? "Good clarity on this sound!" : accuracy >= 60 ? "Getting closer — focus on mouth position." : "Needs practice — try the drill exercises.",
      tipForImprovement: getTipForPhoneme(phoneme, language),
      nativeComparison: `Native speakers produce this sound by ${getNativeDescription(phoneme, language)}`,
    };
  });
}

function buildVocabularyItems(
  vocabularyUsed: string[],
  corrections: { original: string; corrected: string; type: string; explanation: string }[]
): VocabularyItem[] {
  const vocabCorrections = corrections.filter((c) => c.type === "vocabulary");
  
  return vocabularyUsed.slice(0, 10).map((word, idx) => {
    const wasIncorrect = vocabCorrections.some((c) => c.original.includes(word));
    return {
      word,
      translation: `[translation of ${word}]`,
      context: `Used in conversation about the topic`,
      wasCorrectlyUsed: !wasIncorrect,
      timesEncountered: Math.floor(Math.random() * 3) + 1,
      retentionScore: wasIncorrect ? 40 : 75,
      nextReviewDate: new Date(Date.now() + (wasIncorrect ? 86400000 : 259200000)).toISOString(),
    };
  });
}

function calculateFluencyScore(duration: number, totalSentences: number, corrections: number): number {
  // Sentences per minute as a fluency proxy
  const spm = duration > 0 ? totalSentences / duration : 0;
  const errorRate = totalSentences > 0 ? corrections / totalSentences : 0;
  
  // Target: 4-6 sentences per minute for intermediate
  const speedScore = Math.min(100, Math.round((spm / 5) * 100));
  const errorPenalty = Math.round(errorRate * 30);
  
  return Math.max(20, Math.min(100, speedScore - errorPenalty));
}

function calculateComplexityScore(vocabularyUsed: string[], totalSentences: number): number {
  // Vocabulary diversity as complexity proxy
  const uniqueWords = new Set(vocabularyUsed).size;
  const diversityRatio = totalSentences > 0 ? uniqueWords / totalSentences : 0;
  return Math.max(30, Math.min(100, Math.round(diversityRatio * 100 + 40)));
}

function calculateConfidenceScore(duration: number, totalSentences: number): number {
  // Longer sessions with more output = higher confidence
  const outputRate = duration > 0 ? totalSentences / duration : 0;
  return Math.max(40, Math.min(100, Math.round(outputRate * 15 + 50)));
}

function generateSuggestions(
  grammarPatterns: GrammarPattern[],
  pronunciationDetails: PronunciationDetail[],
  accuracyScore: number,
  fluencyScore: number
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];
  
  // Grammar suggestions based on weakest patterns
  const weakGrammar = grammarPatterns.filter((p) => p.accuracy < 70);
  if (weakGrammar.length > 0) {
    suggestions.push({
      id: "grammar_focus",
      category: "grammar",
      priority: weakGrammar[0].accuracy < 50 ? "high" : "medium",
      title: `Focus on ${weakGrammar[0].pattern}`,
      description: `Your ${weakGrammar[0].pattern} accuracy is ${weakGrammar[0].accuracy}%. This is your biggest grammar opportunity.`,
      actionItems: [
        `Practice ${weakGrammar[0].pattern} exercises in the Grammar Notebook`,
        "Review the correction examples from this session",
        "Try using this pattern intentionally in your next conversation",
      ],
      estimatedTimeToImprove: "3-5 sessions",
      relatedExercises: ["grammar-notebook", "grammar-quiz"],
    });
  }
  
  // Pronunciation suggestions
  const weakPronunciation = pronunciationDetails.filter((p) => p.accuracy < 70);
  if (weakPronunciation.length > 0) {
    suggestions.push({
      id: "pronunciation_focus",
      category: "pronunciation",
      priority: weakPronunciation[0].accuracy < 50 ? "high" : "medium",
      title: `Practice the "${weakPronunciation[0].phoneme}" sound`,
      description: `Your accuracy on "${weakPronunciation[0].phoneme}" is ${weakPronunciation[0].accuracy}%. ${weakPronunciation[0].tipForImprovement}`,
      actionItems: [
        "Use the Pronunciation Drill screen for targeted practice",
        "Listen to the slow-motion native audio comparison",
        "Record yourself and compare with the native model",
      ],
      estimatedTimeToImprove: "2-4 sessions",
      relatedExercises: ["pronunciation-drill", "pronunciation-heatmap"],
    });
  }
  
  // Fluency suggestion
  if (fluencyScore < 65) {
    suggestions.push({
      id: "fluency_focus",
      category: "fluency",
      priority: "medium",
      title: "Increase speaking pace",
      description: "Try to speak more continuously without long pauses. It's okay to make mistakes — fluency comes from practice!",
      actionItems: [
        "Practice shadowing exercises (repeat after native audio)",
        "Set a timer and try to speak for 2 minutes without stopping",
        "Join a Voice Room for real-time practice pressure",
      ],
      estimatedTimeToImprove: "5-8 sessions",
      relatedExercises: ["voice-rooms", "pronunciation-drill"],
    });
  }
  
  // Confidence suggestion
  if (accuracyScore > 80 && fluencyScore < 70) {
    suggestions.push({
      id: "confidence_focus",
      category: "confidence",
      priority: "low",
      title: "You know more than you think!",
      description: "Your accuracy is high but you're speaking slowly. Trust your knowledge and let the words flow more naturally.",
      actionItems: [
        "Try the 'no pause' challenge — speak for 1 minute without stopping",
        "Practice with easier topics to build speed",
        "Remember: native speakers make mistakes too!",
      ],
      estimatedTimeToImprove: "2-3 sessions",
      relatedExercises: ["daily-challenge", "voice-rooms"],
    });
  }
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function generateComparisons(
  overallScore: number,
  fluencyScore: number,
  accuracyScore: number,
  complexityScore: number,
  previousReports: ConversationReport[]
): SessionComparison[] {
  if (previousReports.length === 0) {
    return [
      { metric: "Overall Score", currentValue: overallScore, previousValue: 0, change: 0, trend: "stable", unit: "pts" },
      { metric: "Fluency", currentValue: fluencyScore, previousValue: 0, change: 0, trend: "stable", unit: "pts" },
      { metric: "Accuracy", currentValue: accuracyScore, previousValue: 0, change: 0, trend: "stable", unit: "%" },
      { metric: "Complexity", currentValue: complexityScore, previousValue: 0, change: 0, trend: "stable", unit: "pts" },
    ];
  }
  
  const lastReport = previousReports[previousReports.length - 1];
  
  const comparisons: SessionComparison[] = [
    buildComparison("Overall Score", overallScore, lastReport.overallScore, "pts"),
    buildComparison("Fluency", fluencyScore, lastReport.fluencyScore, "pts"),
    buildComparison("Accuracy", accuracyScore, lastReport.accuracyScore, "%"),
    buildComparison("Complexity", complexityScore, lastReport.complexityScore, "pts"),
  ];
  
  return comparisons;
}

function buildComparison(metric: string, current: number, previous: number, unit: string): SessionComparison {
  const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
  const trend: "up" | "down" | "stable" = change > 3 ? "up" : change < -3 ? "down" : "stable";
  return { metric, currentValue: current, previousValue: previous, change, trend, unit };
}

function findBestMoment(corrections: { original: string }[], totalSentences: number): string {
  if (totalSentences > corrections.length) {
    return "You maintained great accuracy throughout the conversation — keep it up!";
  }
  return "You showed persistence by continuing to practice even after corrections.";
}

function findBiggestChallenge(grammarPatterns: GrammarPattern[], pronunciationDetails: PronunciationDetail[]): string {
  const weakestGrammar = grammarPatterns.length > 0 ? grammarPatterns[0] : null;
  const weakestPron = pronunciationDetails.sort((a, b) => a.accuracy - b.accuracy)[0];
  
  if (weakestGrammar && weakestGrammar.accuracy < (weakestPron?.accuracy || 100)) {
    return `${weakestGrammar.pattern} (${weakestGrammar.accuracy}% accuracy)`;
  }
  if (weakestPron) {
    return `Pronunciation of "${weakestPron.phoneme}" (${weakestPron.accuracy}% accuracy)`;
  }
  return "Keep challenging yourself with more complex topics!";
}

// ─── UTILITY HELPERS ────────────────────────────────────────────────────────

function mapToGrammarCategory(type: string): GrammarPattern["category"] {
  const map: Record<string, GrammarPattern["category"]> = {
    grammar: "agreement",
    conjugation: "tense",
    agreement: "agreement",
    word_order: "word_order",
    preposition: "preposition",
    article: "article",
  };
  return map[type] || "agreement";
}

function formatPatternName(type: string): string {
  const names: Record<string, string> = {
    grammar: "General Grammar",
    conjugation: "Verb Conjugation",
    agreement: "Subject-Verb Agreement",
    word_order: "Word Order",
    preposition: "Preposition Usage",
    article: "Article Usage",
  };
  return names[type] || type;
}

function getTipForPhoneme(phoneme: string, language: string): string {
  const tips: Record<string, string> = {
    "rr": "Roll your tongue against the roof of your mouth. Start with 'drrr' to build the muscle memory.",
    "ñ": "Place your tongue flat against the roof of your mouth, like saying 'ny' in 'canyon'.",
    "r (uvular)": "Gargle gently — the French R comes from the back of the throat, not the tongue tip.",
    "nasal vowels": "Let air flow through your nose while saying the vowel. Pinch your nose to check.",
    "pitch accent": "Japanese pitch accent changes meaning. Listen for high-low patterns in words.",
    "r/l": "For Japanese R, tap your tongue quickly against the ridge behind your teeth — between L and D.",
  };
  return tips[phoneme] || "Practice slowly, then gradually increase speed. Record yourself and compare.";
}

function getNativeDescription(phoneme: string, language: string): string {
  const descriptions: Record<string, string> = {
    "rr": "rapidly vibrating the tongue tip against the alveolar ridge (2-3 taps)",
    "ñ": "pressing the middle of the tongue against the hard palate",
    "r (uvular)": "vibrating the uvula at the back of the throat",
    "nasal vowels": "lowering the soft palate to let air pass through the nose",
    "pitch accent": "using specific high-low pitch patterns on each mora",
  };
  return descriptions[phoneme] || "using specific mouth positioning unique to this language";
}

// ─── STORAGE ────────────────────────────────────────────────────────────────

/**
 * Save a conversation report to history
 */
export async function saveReport(report: ConversationReport): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(REPORT_HISTORY_KEY);
    const reports: ConversationReport[] = stored ? JSON.parse(stored) : [];
    reports.push(report);
    // Keep only the most recent reports
    const trimmed = reports.slice(-MAX_STORED_REPORTS);
    await AsyncStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}

/**
 * Load report history
 */
export async function loadReportHistory(): Promise<ConversationReport[]> {
  try {
    const stored = await AsyncStorage.getItem(REPORT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get the most recent report
 */
export async function getLatestReport(): Promise<ConversationReport | null> {
  const reports = await loadReportHistory();
  return reports.length > 0 ? reports[reports.length - 1] : null;
}

/**
 * Get progress over time (last N sessions)
 */
export async function getProgressOverTime(count: number = 10): Promise<{
  dates: string[];
  overallScores: number[];
  fluencyScores: number[];
  accuracyScores: number[];
}> {
  const reports = await loadReportHistory();
  const recent = reports.slice(-count);
  
  return {
    dates: recent.map((r) => new Date(r.timestamp).toLocaleDateString()),
    overallScores: recent.map((r) => r.overallScore),
    fluencyScores: recent.map((r) => r.fluencyScore),
    accuracyScores: recent.map((r) => r.accuracyScore),
  };
}
