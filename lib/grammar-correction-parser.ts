/**
 * Grammar Correction Parser
 * Parses AI teacher responses to detect grammar corrections and logs them to the mistake journal.
 * The AI teacher is prompted to "correct mistakes gently" — this parser detects those corrections
 * from the response text and logs them automatically.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logGrammarMistake } from "./grammar-mistakes";

const CORRECTION_LOG_KEY = "@grammar_correction_log";

export interface ParsedCorrection {
  original: string;
  corrected: string;
  explanation: string;
  category: string;
  grammarTopic: string;
}

/**
 * Common patterns that indicate the AI is correcting the user's grammar:
 * - "It should be X instead of Y"
 * - "The correct form is X"
 * - "You said X, but it should be Y"
 * - "Instead of X, say Y"
 * - "X → Y" or "X -> Y"
 * - "Correction: ..."
 * - "*corrected form*" (asterisk corrections)
 */
const CORRECTION_PATTERNS: RegExp[] = [
  // "You said X, but it should be Y"
  /[Yy]ou said ["']?(.+?)["']?,?\s*but\s+(?:it\s+)?should\s+be\s+["']?(.+?)["']?[.!]/g,
  // "Instead of X, say Y" / "Instead of X, use Y"
  /[Ii]nstead of ["']?(.+?)["']?,?\s*(?:say|use|try)\s+["']?(.+?)["']?[.!]/g,
  // "It should be X (not Y)" / "It should be X, not Y"
  /[Ii]t should be ["']?(.+?)["']?\s*[,(]\s*not\s+["']?(.+?)["']?[.)]/g,
  // "The correct form is X" (captures the correction but not the original)
  /[Tt]he correct (?:form|way|word|phrase) is ["']?(.+?)["']?[.!,]/g,
  // "X → Y" or "X -> Y" (arrow corrections)
  /["']?(.+?)["']?\s*(?:→|➜|➡|->){1,2}\s*["']?(.+?)["']?/g,
  // "*corrected*" pattern (asterisk corrections common in chat)
  /\*(.+?)\*/g,
  // "Correction: X should be Y"
  /[Cc]orrection:?\s*["']?(.+?)["']?\s*should be\s*["']?(.+?)["']?[.!]/g,
  // "Not X but Y" / "Not X, Y"
  /[Nn]ot ["']?(.+?)["']?,?\s*(?:but|rather)\s+["']?(.+?)["']?[.!]/g,
];

/**
 * Categorize a grammar correction based on keywords
 */
function categorizeCorrection(original: string, corrected: string, context: string): { category: string; grammarTopic: string } {
  const combined = `${original} ${corrected} ${context}`.toLowerCase();

  if (/conjugat|verb form|tense|past|present|future|imperfect|preterit|subjunctive/.test(combined)) {
    return { category: "verb_conjugation", grammarTopic: "Verb Conjugation" };
  }
  if (/pronoun|él|ella|yo|tú|usted|le|lo|la|les|nos/.test(combined)) {
    return { category: "pronoun_usage", grammarTopic: "Pronouns" };
  }
  if (/word order|order of|position|placement|before|after the verb/.test(combined)) {
    return { category: "word_order", grammarTopic: "Word Order" };
  }
  if (/article|el |la |los |las |un |una |the |a /.test(combined)) {
    return { category: "article", grammarTopic: "Articles" };
  }
  if (/preposition|por |para |en |de |a |con |sin /.test(combined)) {
    return { category: "preposition", grammarTopic: "Prepositions" };
  }
  if (/gender|masculine|feminine|masc|fem/.test(combined)) {
    return { category: "gender_agreement", grammarTopic: "Gender Agreement" };
  }
  if (/plural|singular|agreement|agree/.test(combined)) {
    return { category: "number_agreement", grammarTopic: "Number Agreement" };
  }
  if (/accent|tilde|stress|pronunciation/.test(combined)) {
    return { category: "accent_marks", grammarTopic: "Accent Marks" };
  }
  if (/spelling|spell|typo|written/.test(combined)) {
    return { category: "spelling", grammarTopic: "Spelling" };
  }
  if (/formal|informal|register|polite|usted|tú/.test(combined)) {
    return { category: "register", grammarTopic: "Formality Register" };
  }

  return { category: "general_grammar", grammarTopic: "General Grammar" };
}

/**
 * Parse an AI response for grammar corrections
 */
export function parseCorrections(aiResponse: string, userMessage: string): ParsedCorrection[] {
  const corrections: ParsedCorrection[] = [];
  const seen = new Set<string>();

  for (const pattern of CORRECTION_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(aiResponse)) !== null) {
      const groups = match.slice(1).filter(Boolean);
      if (groups.length === 0) continue;

      let original = "";
      let corrected = "";

      if (groups.length >= 2) {
        // Pattern has both original and corrected
        original = groups[0].trim();
        corrected = groups[1].trim();
      } else if (groups.length === 1) {
        // Asterisk correction or single-capture pattern
        corrected = groups[0].trim();
        original = userMessage.slice(0, 50); // Use user message as context
      }

      // Skip if too short or same text
      if (original.length < 2 && corrected.length < 2) continue;
      if (original.toLowerCase() === corrected.toLowerCase()) continue;

      // Deduplicate
      const key = `${original}|${corrected}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const { category, grammarTopic } = categorizeCorrection(original, corrected, aiResponse);

      // Extract explanation from surrounding context
      const matchIndex = match.index;
      const contextStart = Math.max(0, matchIndex - 50);
      const contextEnd = Math.min(aiResponse.length, matchIndex + match[0].length + 100);
      const explanation = aiResponse.slice(contextStart, contextEnd).trim();

      corrections.push({
        original,
        corrected,
        explanation,
        category,
        grammarTopic,
      });
    }
  }

  return corrections;
}

/**
 * Parse AI response for corrections and log them to the grammar mistake journal
 */
export async function parseAndLogCorrections(
  aiResponse: string,
  userMessage: string,
  language: string
): Promise<ParsedCorrection[]> {
  const corrections = parseCorrections(aiResponse, userMessage);

  for (const correction of corrections) {
    await logGrammarMistake({
      source: "conversation",
      category: correction.category,
      language,
      question: `AI corrected your message: "${correction.original}"`,
      userAnswer: correction.original,
      correctAnswer: correction.corrected,
      rule: correction.explanation.slice(0, 200),
      grammarTopic: correction.grammarTopic,
    });
  }

  // Track correction count for weekly report
  if (corrections.length > 0) {
    try {
      const stored = await AsyncStorage.getItem(CORRECTION_LOG_KEY);
      const log: { date: string; count: number }[] = stored ? JSON.parse(stored) : [];
      const today = new Date().toISOString().split("T")[0];
      const todayEntry = log.find((e) => e.date === today);
      if (todayEntry) {
        todayEntry.count += corrections.length;
      } else {
        log.push({ date: today, count: corrections.length });
      }
      // Keep last 90 days
      if (log.length > 90) log.splice(0, log.length - 90);
      await AsyncStorage.setItem(CORRECTION_LOG_KEY, JSON.stringify(log));
    } catch {}
  }

  return corrections;
}

/**
 * Get correction counts by day for the past N days
 */
export async function getCorrectionHistory(days: number = 30): Promise<{ date: string; count: number }[]> {
  try {
    const stored = await AsyncStorage.getItem(CORRECTION_LOG_KEY);
    const log: { date: string; count: number }[] = stored ? JSON.parse(stored) : [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return log.filter((e) => e.date >= cutoffStr);
  } catch {
    return [];
  }
}
