/**
 * Word Banks Index
 *
 * Aggregates all language-specific word banks and provides
 * a unified interface for selecting words by language.
 */
import type { DuelWord, DuelCategory, DuelGameMode } from "@/lib/pronunciation-duel";
import { FRENCH_WORD_BANK, FRENCH_TONGUE_TWISTERS } from "./french";
import { PORTUGUESE_WORD_BANK, PORTUGUESE_TONGUE_TWISTERS } from "./portuguese";
import { JAPANESE_WORD_BANK, JAPANESE_TONGUE_TWISTERS } from "./japanese";
import { GERMAN_WORD_BANK, GERMAN_TONGUE_TWISTERS } from "./german";
import { KOREAN_WORD_BANK, KOREAN_TONGUE_TWISTERS } from "./korean";
import { MANDARIN_WORD_BANK, MANDARIN_TONGUE_TWISTERS } from "./mandarin";

// ─── Supported Languages ────────────────────────────────────────────────────

export type DuelLanguage = "Spanish" | "French" | "Portuguese" | "Japanese" | "German" | "Korean" | "Mandarin";

export const SUPPORTED_DUEL_LANGUAGES: { id: DuelLanguage; label: string; flag: string }[] = [
  { id: "Spanish", label: "Spanish", flag: "🇪🇸" },
  { id: "French", label: "French", flag: "🇫🇷" },
  { id: "Portuguese", label: "Portuguese", flag: "🇧🇷" },
  { id: "Japanese", label: "Japanese", flag: "🇯🇵" },
  { id: "German", label: "German", flag: "🇩🇪" },
  { id: "Korean", label: "Korean", flag: "🇰🇷" },
  { id: "Mandarin", label: "Mandarin", flag: "🇨🇳" },
];

// ─── Language Word Banks Map ────────────────────────────────────────────────

const LANGUAGE_WORD_BANKS: Record<string, Record<string, DuelWord[]>> = {
  French: FRENCH_WORD_BANK,
  Portuguese: PORTUGUESE_WORD_BANK,
  Japanese: JAPANESE_WORD_BANK,
  German: GERMAN_WORD_BANK,
  Korean: KOREAN_WORD_BANK,
  Mandarin: MANDARIN_WORD_BANK,
};

const LANGUAGE_TONGUE_TWISTERS: Record<string, DuelWord[]> = {
  French: FRENCH_TONGUE_TWISTERS,
  Portuguese: PORTUGUESE_TONGUE_TWISTERS,
  Japanese: JAPANESE_TONGUE_TWISTERS,
  German: GERMAN_TONGUE_TWISTERS,
  Korean: KOREAN_TONGUE_TWISTERS,
  Mandarin: MANDARIN_TONGUE_TWISTERS,
};

// ─── Multi-Language Word Selection ──────────────────────────────────────────

/**
 * Get duel words for a specific language, mode, and category.
 * Falls back to Spanish (default) if language not found.
 */
export function getLanguageDuelWords(
  language: string,
  mode: DuelGameMode,
  category: DuelCategory,
  count: number = 5
): DuelWord[] {
  // Tongue twisters have their own bank
  if (mode === "tongue_twister") {
    const twisters = LANGUAGE_TONGUE_TWISTERS[language];
    if (twisters && twisters.length > 0) {
      const shuffled = [...twisters].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    // Fallback: return null to use default Spanish bank
    return [];
  }

  const bank = LANGUAGE_WORD_BANKS[language];
  if (!bank) return []; // Fallback to default

  let pool: DuelWord[] = [];
  if (category === "mixed") {
    Object.values(bank).forEach(words => {
      pool = pool.concat(words);
    });
  } else {
    pool = [...(bank[category] || [])];
  }

  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Check if a language has word bank support
 */
export function isLanguageSupported(language: string): boolean {
  return language === "Spanish" || language in LANGUAGE_WORD_BANKS;
}

/**
 * Get available categories for a language
 */
export function getLanguageCategories(language: string): DuelCategory[] {
  if (language === "Spanish") {
    return ["abcs", "numbers", "adjectives", "verbs_present", "verbs_past", "verbs_future", "mixed"];
  }

  const bank = LANGUAGE_WORD_BANKS[language];
  if (!bank) return [];

  const categories = Object.keys(bank) as DuelCategory[];
  categories.push("mixed");
  return categories;
}

/**
 * Get total word count for a language
 */
export function getLanguageWordCount(language: string): number {
  if (language === "Spanish") return 0; // Handled by default bank

  const bank = LANGUAGE_WORD_BANKS[language];
  if (!bank) return 0;

  let count = 0;
  Object.values(bank).forEach(words => {
    count += words.length;
  });

  const twisters = LANGUAGE_TONGUE_TWISTERS[language];
  if (twisters) count += twisters.length;

  return count;
}
