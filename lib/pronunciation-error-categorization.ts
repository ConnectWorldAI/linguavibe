/**
 * Pronunciation Error Categorization
 * 
 * Classifies pronunciation errors into specific phonetic categories so that
 * targeted drills can address the exact weakness (vowel sounds, consonant clusters,
 * accent/stress placement, intonation, etc.)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PronunciationCategory =
  | "vowel_sounds"
  | "consonant_clusters"
  | "accent_placement"
  | "intonation"
  | "liaison_elision"
  | "nasal_sounds"
  | "trill_tap"
  | "aspiration"
  | "tone"
  | "rhythm_timing";

export interface PronunciationCategoryInfo {
  id: PronunciationCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  examples: string[];
  languages: string[]; // Which languages this category is most relevant for
}

export interface PronunciationError {
  id: string;
  timestamp: string;
  category: PronunciationCategory;
  subcategory: string; // e.g., "open_e_vs_closed_e", "rr_trill", "penultimate_stress"
  word: string;
  phoneme?: string; // IPA representation of the target sound
  userAttempt: string; // What the user said (description or phonetic)
  expected: string; // What was expected
  language: string;
  score: number; // 0-100 pronunciation score for this specific attempt
  context: string; // Sentence or phrase context
  source: "conversation" | "voice_drill" | "sing_along" | "phoneme_practice" | "read_aloud";
}

export interface PronunciationPattern {
  id: string;
  category: PronunciationCategory;
  subcategory: string;
  description: string;
  frequency: number;
  averageScore: number;
  lastSeen: string;
  firstSeen: string;
  resolved: boolean;
  improvementRate: number; // percentage improvement since first seen
  targetPhonemes: string[];
  commonWords: string[]; // Words where this error occurs most
  drillType: "minimal_pairs" | "tongue_twisters" | "repeat_after" | "stress_marking" | "intonation_contour";
}

export interface PronunciationStats {
  totalErrors: number;
  errorsByCategory: Record<PronunciationCategory, number>;
  weakestCategory: PronunciationCategory | null;
  strongestCategory: PronunciationCategory | null;
  averageScore: number;
  recentTrend: "improving" | "stable" | "declining";
  patternsDetected: number;
  patternsResolved: number;
  topWeakPhonemes: string[];
}

// ─── Category Definitions ───────────────────────────────────────────────────

export const PRONUNCIATION_CATEGORIES: PronunciationCategoryInfo[] = [
  {
    id: "vowel_sounds",
    label: "Vowel Sounds",
    description: "Open/closed vowels, diphthongs, vowel length",
    icon: "ellipse-outline",
    color: "#3B82F6",
    examples: ["Spanish: e/é distinction", "French: ou vs u", "Japanese: short vs long vowels"],
    languages: ["Spanish", "French", "Japanese", "Korean", "Portuguese", "Italian", "German"],
  },
  {
    id: "consonant_clusters",
    label: "Consonant Clusters",
    description: "Difficult consonant combinations, final consonants",
    icon: "layers-outline",
    color: "#8B5CF6",
    examples: ["Spanish: str- clusters", "German: pf-, kn-", "English: -ths, -sks"],
    languages: ["Spanish", "French", "German", "Portuguese", "Korean", "Japanese"],
  },
  {
    id: "accent_placement",
    label: "Stress & Accent",
    description: "Word stress position, accent marks, emphasis patterns",
    icon: "trending-up-outline",
    color: "#F59E0B",
    examples: ["Spanish: último vs ultimo", "Italian: àncora vs ancóra", "Portuguese: avó vs avô"],
    languages: ["Spanish", "Italian", "Portuguese", "French", "German"],
  },
  {
    id: "intonation",
    label: "Intonation",
    description: "Sentence melody, question vs statement patterns",
    icon: "pulse-outline",
    color: "#EC4899",
    examples: ["Spanish: rising for questions", "French: final syllable rise", "Japanese: pitch accent"],
    languages: ["Spanish", "French", "Japanese", "Korean", "Italian", "German", "Portuguese"],
  },
  {
    id: "liaison_elision",
    label: "Liaison & Elision",
    description: "Connected speech, dropped sounds, linking between words",
    icon: "link-outline",
    color: "#06B6D4",
    examples: ["French: les amis → lez-ami", "Spanish: para el → pa'l", "Italian: l'uomo"],
    languages: ["French", "Spanish", "Italian", "Portuguese"],
  },
  {
    id: "nasal_sounds",
    label: "Nasal Sounds",
    description: "Nasal vowels and consonants specific to certain languages",
    icon: "water-outline",
    color: "#10B981",
    examples: ["French: an, en, on, un", "Portuguese: ão, ãe", "Japanese: ん (n)"],
    languages: ["French", "Portuguese", "Japanese"],
  },
  {
    id: "trill_tap",
    label: "Trill & Tap",
    description: "Rolled R, flapped R, and similar articulations",
    icon: "repeat-outline",
    color: "#EF4444",
    examples: ["Spanish: rr trill", "French: uvular R", "Italian: single r vs rr"],
    languages: ["Spanish", "Italian", "Portuguese", "French", "German"],
  },
  {
    id: "aspiration",
    label: "Aspiration & Voicing",
    description: "Aspirated vs unaspirated stops, voiced vs voiceless distinctions",
    icon: "cloud-outline",
    color: "#6366F1",
    examples: ["Korean: ㅂ vs ㅃ vs ㅍ", "German: ch sounds", "Japanese: voiced/voiceless"],
    languages: ["Korean", "German", "Japanese", "Mandarin"],
  },
  {
    id: "tone",
    label: "Tone & Pitch",
    description: "Lexical tones, pitch patterns that change word meaning",
    icon: "musical-notes-outline",
    color: "#F97316",
    examples: ["Mandarin: 4 tones (mā, má, mǎ, mà)", "Japanese: pitch accent", "Korean: length"],
    languages: ["Mandarin", "Japanese", "Korean"],
  },
  {
    id: "rhythm_timing",
    label: "Rhythm & Timing",
    description: "Syllable timing, mora timing, stress timing patterns",
    icon: "timer-outline",
    color: "#14B8A6",
    examples: ["Spanish: syllable-timed", "Japanese: mora-timed", "French: phrase-final lengthening"],
    languages: ["Spanish", "Japanese", "French", "Italian", "Portuguese", "German"],
  },
];

// ─── Storage Keys ───────────────────────────────────────────────────────────

const PRONUN_ERRORS_KEY = "@pronunciation_errors";
const PRONUN_PATTERNS_KEY = "@pronunciation_patterns";
const PRONUN_STATS_KEY = "@pronunciation_stats_cache";

// ─── Phoneme Classification Rules ──────────────────────────────────────────

/**
 * Classify a pronunciation error into a specific category based on the word,
 * context, and language.
 */
export function classifyPronunciationError(params: {
  word: string;
  language: string;
  score: number;
  context?: string;
  errorDescription?: string;
}): { category: PronunciationCategory; subcategory: string } {
  const { word, language, score, errorDescription } = params;
  const desc = (errorDescription || "").toLowerCase();
  const wordLower = word.toLowerCase();

  // Check explicit error descriptions first
  if (desc.includes("vowel") || desc.includes("vocal")) {
    return { category: "vowel_sounds", subcategory: detectVowelSubcategory(wordLower, language) };
  }
  if (desc.includes("stress") || desc.includes("accent") || desc.includes("emphasis")) {
    return { category: "accent_placement", subcategory: detectStressSubcategory(wordLower, language) };
  }
  if (desc.includes("tone") || desc.includes("pitch")) {
    return { category: "tone", subcategory: "lexical_tone" };
  }
  if (desc.includes("nasal")) {
    return { category: "nasal_sounds", subcategory: "nasal_vowel" };
  }
  if (desc.includes("trill") || desc.includes("roll") || desc.includes("rr")) {
    return { category: "trill_tap", subcategory: "alveolar_trill" };
  }
  if (desc.includes("cluster") || desc.includes("consonant")) {
    return { category: "consonant_clusters", subcategory: detectClusterSubcategory(wordLower, language) };
  }
  if (desc.includes("intonation") || desc.includes("melody")) {
    return { category: "intonation", subcategory: "sentence_melody" };
  }
  if (desc.includes("liaison") || desc.includes("elision") || desc.includes("linking")) {
    return { category: "liaison_elision", subcategory: "word_linking" };
  }
  if (desc.includes("rhythm") || desc.includes("timing") || desc.includes("speed")) {
    return { category: "rhythm_timing", subcategory: "syllable_timing" };
  }

  // Language-specific heuristic classification
  return classifyByLanguageHeuristics(wordLower, language, score);
}

function detectVowelSubcategory(word: string, language: string): string {
  if (language === "French") {
    if (/[ouù]/.test(word)) return "ou_vs_u";
    if (/[eéèê]/.test(word)) return "open_e_closed_e";
    return "general_vowel";
  }
  if (language === "Spanish" || language.includes("Spanish")) {
    if (/[aeiou]{2}/.test(word)) return "diphthong";
    return "pure_vowel";
  }
  if (language === "Japanese") return "vowel_length";
  if (language === "German") return "umlaut";
  return "general_vowel";
}

function detectStressSubcategory(word: string, language: string): string {
  if (language === "Spanish" || language.includes("Spanish")) {
    if (/[áéíóú]/.test(word)) return "written_accent";
    return "natural_stress_rules";
  }
  if (language === "Italian") return "penultimate_stress";
  if (language === "Portuguese") return "oxytone_paroxytone";
  return "word_stress";
}

function detectClusterSubcategory(word: string, language: string): string {
  if (/^[bcdfgklmnprstvwxz]{2,}/.test(word)) return "initial_cluster";
  if (/[bcdfgklmnprstvwxz]{2,}$/.test(word)) return "final_cluster";
  return "medial_cluster";
}

function classifyByLanguageHeuristics(word: string, language: string, score: number): { category: PronunciationCategory; subcategory: string } {
  // Spanish-specific
  if (language === "Spanish" || language.includes("Spanish")) {
    if (/rr/.test(word) || (word.startsWith("r") && word.length > 1)) {
      return { category: "trill_tap", subcategory: "alveolar_trill" };
    }
    if (/[áéíóú]/.test(word)) {
      return { category: "accent_placement", subcategory: "written_accent" };
    }
    if (/[bdg]/.test(word) && score < 50) {
      return { category: "consonant_clusters", subcategory: "stop_approximant" };
    }
    // Default for Spanish: rhythm/timing if score is moderate
    if (score >= 40 && score < 70) {
      return { category: "rhythm_timing", subcategory: "syllable_timing" };
    }
    return { category: "vowel_sounds", subcategory: "pure_vowel" };
  }

  // French-specific
  if (language === "French") {
    if (/[aeiouyàâéèêëîïôùûü]n[^aeiouy]/.test(word) || word.endsWith("on") || word.endsWith("an") || word.endsWith("en")) {
      return { category: "nasal_sounds", subcategory: "nasal_vowel" };
    }
    if (/r/.test(word)) {
      return { category: "trill_tap", subcategory: "uvular_r" };
    }
    return { category: "liaison_elision", subcategory: "word_linking" };
  }

  // Japanese-specific
  if (language === "Japanese") {
    return { category: "tone", subcategory: "pitch_accent" };
  }

  // Korean-specific
  if (language === "Korean") {
    return { category: "aspiration", subcategory: "tensed_aspirated" };
  }

  // Mandarin-specific
  if (language === "Mandarin") {
    return { category: "tone", subcategory: "lexical_tone" };
  }

  // German-specific
  if (language === "German") {
    if (/ch/.test(word)) {
      return { category: "aspiration", subcategory: "ich_ach_laut" };
    }
    if (/[äöü]/.test(word)) {
      return { category: "vowel_sounds", subcategory: "umlaut" };
    }
    return { category: "consonant_clusters", subcategory: "initial_cluster" };
  }

  // Default
  return { category: "vowel_sounds", subcategory: "general_vowel" };
}

// ─── Error Logging ──────────────────────────────────────────────────────────

/**
 * Log a pronunciation error with automatic categorization
 */
export async function logPronunciationError(params: {
  word: string;
  userAttempt: string;
  expected: string;
  language: string;
  score: number;
  context: string;
  source: PronunciationError["source"];
  errorDescription?: string;
  phoneme?: string;
}): Promise<PronunciationError> {
  const { word, userAttempt, expected, language, score, context, source, errorDescription, phoneme } = params;

  // Classify the error
  const { category, subcategory } = classifyPronunciationError({
    word,
    language,
    score,
    errorDescription,
  });

  const error: PronunciationError = {
    id: `pron_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    category,
    subcategory,
    word,
    phoneme,
    userAttempt,
    expected,
    language,
    score,
    context,
    source,
  };

  // Store
  const errors = await getPronunciationErrors();
  errors.push(error);
  const trimmed = errors.slice(-300); // Keep last 300
  await AsyncStorage.setItem(PRONUN_ERRORS_KEY, JSON.stringify(trimmed));

  // Trigger pattern detection every 3 errors
  if (trimmed.length % 3 === 0) {
    await detectPronunciationPatterns();
  }

  return error;
}

/**
 * Get all stored pronunciation errors
 */
export async function getPronunciationErrors(): Promise<PronunciationError[]> {
  try {
    const data = await AsyncStorage.getItem(PRONUN_ERRORS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ─── Pattern Detection ──────────────────────────────────────────────────────

/**
 * Analyze pronunciation errors to detect recurring patterns
 */
export async function detectPronunciationPatterns(): Promise<PronunciationPattern[]> {
  const errors = await getPronunciationErrors();
  if (errors.length < 3) return [];

  // Group errors by category + subcategory
  const groups: Record<string, PronunciationError[]> = {};
  for (const err of errors) {
    const key = `${err.category}::${err.subcategory}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(err);
  }

  const patterns: PronunciationPattern[] = [];
  for (const [key, groupErrors] of Object.entries(groups)) {
    if (groupErrors.length < 2) continue; // Need at least 2 occurrences

    const [category, subcategory] = key.split("::") as [PronunciationCategory, string];
    const sorted = groupErrors.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
    const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));
    const firstAvg = firstHalf.reduce((s, e) => s + e.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, e) => s + e.score, 0) / secondHalf.length : firstAvg;
    const improvement = secondAvg - firstAvg;

    const avgScore = sorted.reduce((s, e) => s + e.score, 0) / sorted.length;
    const uniqueWords = [...new Set(sorted.map(e => e.word))];
    const phonemes = [...new Set(sorted.filter(e => e.phoneme).map(e => e.phoneme!))];

    const catInfo = PRONUNCIATION_CATEGORIES.find(c => c.id === category);
    const description = `${catInfo?.label || category}: ${subcategory.replace(/_/g, " ")} (${uniqueWords.slice(0, 3).join(", ")})`;

    // Determine drill type based on category
    let drillType: PronunciationPattern["drillType"] = "repeat_after";
    if (category === "vowel_sounds" || category === "consonant_clusters") drillType = "minimal_pairs";
    if (category === "trill_tap" || category === "nasal_sounds") drillType = "tongue_twisters";
    if (category === "accent_placement") drillType = "stress_marking";
    if (category === "intonation") drillType = "intonation_contour";

    patterns.push({
      id: `pron_pat_${category}_${subcategory}`,
      category,
      subcategory,
      description,
      frequency: sorted.length,
      averageScore: Math.round(avgScore),
      lastSeen: sorted[sorted.length - 1].timestamp,
      firstSeen: sorted[0].timestamp,
      resolved: avgScore >= 80 && improvement > 10,
      improvementRate: Math.round(improvement),
      targetPhonemes: phonemes,
      commonWords: uniqueWords.slice(0, 5),
      drillType,
    });
  }

  // Sort by frequency (most common first), then by score (worst first)
  patterns.sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    if (b.frequency !== a.frequency) return b.frequency - a.frequency;
    return a.averageScore - b.averageScore;
  });

  await AsyncStorage.setItem(PRONUN_PATTERNS_KEY, JSON.stringify(patterns));
  return patterns;
}

/**
 * Get detected pronunciation patterns
 */
export async function getPronunciationPatterns(): Promise<PronunciationPattern[]> {
  try {
    const data = await AsyncStorage.getItem(PRONUN_PATTERNS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ─── Stats ──────────────────────────────────────────────────────────────────

/**
 * Get pronunciation statistics summary
 */
export async function getPronunciationStats(): Promise<PronunciationStats> {
  const errors = await getPronunciationErrors();
  const patterns = await getPronunciationPatterns();

  if (errors.length === 0) {
    return {
      totalErrors: 0,
      errorsByCategory: {} as Record<PronunciationCategory, number>,
      weakestCategory: null,
      strongestCategory: null,
      averageScore: 0,
      recentTrend: "stable",
      patternsDetected: 0,
      patternsResolved: 0,
      topWeakPhonemes: [],
    };
  }

  // Count by category
  const byCategory: Record<PronunciationCategory, number> = {
    vowel_sounds: 0,
    consonant_clusters: 0,
    accent_placement: 0,
    intonation: 0,
    liaison_elision: 0,
    nasal_sounds: 0,
    trill_tap: 0,
    aspiration: 0,
    tone: 0,
    rhythm_timing: 0,
  };
  for (const err of errors) {
    byCategory[err.category] = (byCategory[err.category] || 0) + 1;
  }

  // Find weakest and strongest
  const categories = Object.entries(byCategory).filter(([, count]) => count > 0);
  const weakest = categories.length > 0
    ? categories.sort((a, b) => b[1] - a[1])[0][0] as PronunciationCategory
    : null;
  const strongest = categories.length > 1
    ? categories.sort((a, b) => a[1] - b[1])[0][0] as PronunciationCategory
    : null;

  // Average score
  const avgScore = Math.round(errors.reduce((s, e) => s + e.score, 0) / errors.length);

  // Recent trend (last 7 days vs previous 7 days)
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  const recentErrors = errors.filter(e => new Date(e.timestamp).getTime() > weekAgo);
  const olderErrors = errors.filter(e => {
    const t = new Date(e.timestamp).getTime();
    return t > twoWeeksAgo && t <= weekAgo;
  });
  const recentAvg = recentErrors.length > 0 ? recentErrors.reduce((s, e) => s + e.score, 0) / recentErrors.length : avgScore;
  const olderAvg = olderErrors.length > 0 ? olderErrors.reduce((s, e) => s + e.score, 0) / olderErrors.length : avgScore;
  const trend: "improving" | "stable" | "declining" = recentAvg > olderAvg + 5 ? "improving" : recentAvg < olderAvg - 5 ? "declining" : "stable";

  // Top weak phonemes from unresolved patterns
  const unresolvedPatterns = patterns.filter(p => !p.resolved);
  const topPhonemes = unresolvedPatterns
    .flatMap(p => p.targetPhonemes)
    .slice(0, 5);

  const stats: PronunciationStats = {
    totalErrors: errors.length,
    errorsByCategory: byCategory,
    weakestCategory: weakest,
    strongestCategory: strongest,
    averageScore: avgScore,
    recentTrend: trend,
    patternsDetected: patterns.length,
    patternsResolved: patterns.filter(p => p.resolved).length,
    topWeakPhonemes: topPhonemes,
  };

  await AsyncStorage.setItem(PRONUN_STATS_KEY, JSON.stringify(stats));
  return stats;
}

// ─── Drill Generation ───────────────────────────────────────────────────────

export interface PronunciationDrill {
  id: string;
  patternId: string;
  category: PronunciationCategory;
  type: PronunciationPattern["drillType"];
  title: string;
  instructions: string;
  items: PronunciationDrillItem[];
  difficulty: 1 | 2 | 3;
}

export interface PronunciationDrillItem {
  id: string;
  prompt: string;
  targetWord: string;
  phoneme?: string;
  audioHint?: string; // Description of how to produce the sound
  contrastWord?: string; // For minimal pairs
}

/**
 * Generate targeted pronunciation drills based on detected patterns
 */
export async function generatePronunciationDrills(maxDrills: number = 3): Promise<PronunciationDrill[]> {
  const patterns = await getPronunciationPatterns();
  const unresolved = patterns.filter(p => !p.resolved).slice(0, maxDrills);

  const drills: PronunciationDrill[] = [];

  for (const pattern of unresolved) {
    const catInfo = PRONUNCIATION_CATEGORIES.find(c => c.id === pattern.category);
    const drill: PronunciationDrill = {
      id: `drill_${pattern.id}_${Date.now()}`,
      patternId: pattern.id,
      category: pattern.category,
      type: pattern.drillType,
      title: `${catInfo?.label || pattern.category} Practice`,
      instructions: getDrillInstructions(pattern),
      items: generateDrillItems(pattern),
      difficulty: pattern.averageScore < 40 ? 3 : pattern.averageScore < 60 ? 2 : 1,
    };
    drills.push(drill);
  }

  return drills;
}

function getDrillInstructions(pattern: PronunciationPattern): string {
  switch (pattern.drillType) {
    case "minimal_pairs":
      return `Listen carefully and repeat each pair. Focus on the difference between similar sounds in: ${pattern.commonWords.slice(0, 2).join(", ")}`;
    case "tongue_twisters":
      return `Practice these tongue twisters slowly, then speed up. Focus on the ${pattern.subcategory.replace(/_/g, " ")} sound.`;
    case "repeat_after":
      return `Listen and repeat each word 3 times. Pay attention to the ${pattern.subcategory.replace(/_/g, " ")}.`;
    case "stress_marking":
      return `Mark where the stress falls in each word, then say it aloud with correct emphasis.`;
    case "intonation_contour":
      return `Practice the rising and falling patterns. Match the melody of each sentence.`;
    default:
      return `Practice the following sounds carefully.`;
  }
}

function generateDrillItems(pattern: PronunciationPattern): PronunciationDrillItem[] {
  // Generate drill items from the pattern's common words
  return pattern.commonWords.map((word, idx) => ({
    id: `item_${idx}`,
    prompt: `Say: "${word}"`,
    targetWord: word,
    phoneme: pattern.targetPhonemes[idx] || undefined,
    audioHint: getAudioHint(pattern.category, pattern.subcategory),
    contrastWord: pattern.drillType === "minimal_pairs" ? getContrastWord(word, pattern.category) : undefined,
  }));
}

function getAudioHint(category: PronunciationCategory, subcategory: string): string {
  const hints: Record<string, string> = {
    "vowel_sounds": "Keep your mouth shape consistent. Don't let the vowel glide.",
    "consonant_clusters": "Don't insert extra vowels between consonants. Say them together smoothly.",
    "accent_placement": "Emphasize the stressed syllable by making it slightly louder and longer.",
    "intonation": "Think of the sentence as a melody. Let your voice rise and fall naturally.",
    "liaison_elision": "Connect the words smoothly without pausing between them.",
    "nasal_sounds": "Let air flow through your nose. Your mouth and nose work together.",
    "trill_tap": "Relax your tongue tip and let it vibrate against the roof of your mouth.",
    "aspiration": "Feel the puff of air on your hand as you say the sound.",
    "tone": "Keep the pitch pattern steady throughout the syllable.",
    "rhythm_timing": "Give each syllable equal time. Don't rush through unstressed syllables.",
  };
  return hints[category] || "Focus on clarity and precision.";
}

function getContrastWord(word: string, category: PronunciationCategory): string {
  // Simple contrast word generation (in production, this would use a dictionary)
  // For now, return a placeholder that indicates what to contrast with
  if (category === "vowel_sounds") return `${word} (long)`;
  if (category === "trill_tap") return word.replace(/rr/g, "r").replace(/^r/, "l");
  if (category === "accent_placement") return `${word} (shifted stress)`;
  return word;
}
