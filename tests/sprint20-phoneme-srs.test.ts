/**
 * Sprint 20 Tests: Phoneme Expansion + SRS Phoneme Integration
 * 
 * Tests:
 * 1. Pronunciation heat map has all 8 languages with phoneme data
 * 2. Each language has proper phoneme structure (id, symbol, name, category, score, etc.)
 * 3. SRS phoneme library exists with correct exports
 * 4. SRS phoneme cards use "phoneme:" prefix convention
 * 5. SRS review screen handles phoneme-type cards differently
 * 6. Heat map has "Add Weak Sounds to SRS" button
 * 7. Notification wording updated for mixed card types
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const HEAT_MAP_PATH = path.resolve(__dirname, "../app/pronunciation-heat-map.tsx");
const SRS_PHONEME_PATH = path.resolve(__dirname, "../lib/srs-phoneme.ts");
const SRS_REVIEW_PATH = path.resolve(__dirname, "../app/srs-review.tsx");
const SRS_LIB_PATH = path.resolve(__dirname, "../lib/srs.ts");
const NOTIFICATIONS_PATH = path.resolve(__dirname, "../lib/notifications.ts");

const heatMapSource = fs.readFileSync(HEAT_MAP_PATH, "utf-8");
const srsPhonemeSource = fs.readFileSync(SRS_PHONEME_PATH, "utf-8");
const srsReviewSource = fs.readFileSync(SRS_REVIEW_PATH, "utf-8");
const srsLibSource = fs.readFileSync(SRS_LIB_PATH, "utf-8");
const notificationsSource = fs.readFileSync(NOTIFICATIONS_PATH, "utf-8");

describe("Sprint 20: Pronunciation Heat Map — 8 Language Phoneme Data", () => {
  it("has all 8 language entries in LANGUAGE_SETS", () => {
    expect(heatMapSource).toContain("LANGUAGE_SETS: LanguagePhonemeSet[]");
    expect(heatMapSource).toContain('language: "Spanish"');
    expect(heatMapSource).toContain('language: "French"');
    expect(heatMapSource).toContain('language: "Japanese"');
    expect(heatMapSource).toContain('language: "Korean"');
    expect(heatMapSource).toContain('language: "German"');
    expect(heatMapSource).toContain('language: "Italian"');
    expect(heatMapSource).toContain('language: "Portuguese"');
    expect(heatMapSource).toContain('language: "Mandarin"');
  });

  it("has all 8 language flags", () => {
    expect(heatMapSource).toContain("🇪🇸");
    expect(heatMapSource).toContain("🇫🇷");
    expect(heatMapSource).toContain("🇯🇵");
    expect(heatMapSource).toContain("🇰🇷");
    expect(heatMapSource).toContain("🇩🇪");
    expect(heatMapSource).toContain("🇮🇹");
    expect(heatMapSource).toContain("🇵🇹");
    expect(heatMapSource).toContain("🇨🇳");
  });

  it("Japanese phonemes cover pitch accent, mora timing, and key consonants", () => {
    expect(heatMapSource).toContain("JAPANESE_PHONEMES");
    expect(heatMapSource).toContain("High-Low Pitch");
    expect(heatMapSource).toContain("Low-High Pitch");
    expect(heatMapSource).toContain("Mora Timing");
    expect(heatMapSource).toContain("Tsu (affricate)");
    expect(heatMapSource).toContain("Fu (bilabial)");
    expect(heatMapSource).toContain("R-tap (flap)");
    expect(heatMapSource).toContain("Geminate (double consonant)");
  });

  it("Korean phonemes cover aspirated, tense consonants, and vowel distinctions", () => {
    expect(heatMapSource).toContain("KOREAN_PHONEMES");
    expect(heatMapSource).toContain("Aspirated K");
    expect(heatMapSource).toContain("Tense KK");
    expect(heatMapSource).toContain("Tense PP");
    expect(heatMapSource).toContain("Tense SS");
    expect(heatMapSource).toContain("Eu (unrounded)");
    expect(heatMapSource).toContain("Final Consonants");
    expect(heatMapSource).toContain("받침");
  });

  it("German phonemes cover umlauts, ch sounds, and final devoicing", () => {
    expect(heatMapSource).toContain("GERMAN_PHONEMES");
    expect(heatMapSource).toContain("A-Umlaut");
    expect(heatMapSource).toContain("O-Umlaut");
    expect(heatMapSource).toContain("U-Umlaut");
    expect(heatMapSource).toContain("Ich-Laut (palatal)");
    expect(heatMapSource).toContain("Ach-Laut (velar)");
    expect(heatMapSource).toContain("Final Devoicing");
    expect(heatMapSource).toContain("Pf (affricate)");
  });

  it("Italian phonemes cover gemination, open/closed vowels, and special consonants", () => {
    expect(heatMapSource).toContain("ITALIAN_PHONEMES");
    expect(heatMapSource).toContain("Double Consonants");
    expect(heatMapSource).toContain("Rolled R (trill)");
    expect(heatMapSource).toContain("Gli (palatal lateral)");
    expect(heatMapSource).toContain("Gn (palatal nasal)");
    expect(heatMapSource).toContain("Open E (è)");
    expect(heatMapSource).toContain("Open O (ò)");
  });

  it("Portuguese phonemes cover nasal vowels, digraphs, and regional variants", () => {
    expect(heatMapSource).toContain("PORTUGUESE_PHONEMES");
    expect(heatMapSource).toContain("Nasal ÃO");
    expect(heatMapSource).toContain("Nasal A");
    expect(heatMapSource).toContain("Lh (palatal lateral)");
    expect(heatMapSource).toContain("Nh (palatal nasal)");
    expect(heatMapSource).toContain("Final S (EU vs BR)");
    expect(heatMapSource).toContain("D before i (Brazilian)");
  });

  it("Mandarin phonemes cover tones, retroflex, and palatal initials", () => {
    expect(heatMapSource).toContain("MANDARIN_PHONEMES");
    expect(heatMapSource).toContain("1st Tone (high flat)");
    expect(heatMapSource).toContain("2nd Tone (rising)");
    expect(heatMapSource).toContain("3rd Tone (dip)");
    expect(heatMapSource).toContain("4th Tone (falling)");
    expect(heatMapSource).toContain("Neutral Tone");
    expect(heatMapSource).toContain("Zh (retroflex)");
    expect(heatMapSource).toContain("X (palatal fricative)");
    expect(heatMapSource).toContain("Aspirated pairs");
  });

  it("all phonemes follow the PhonemeData interface structure", () => {
    // Check that each language array has proper fields
    const phonemePattern = /id:\s*"[^"]+",\s*symbol:\s*"[^"]+",\s*name:\s*"[^"]+",\s*category:\s*"(vowel|consonant|special)"/g;
    const matches = heatMapSource.match(phonemePattern);
    // Should have many matches across all 8 languages (19 + 7 + 11 + 14 + 11 + 12 + 13 + 16 = 103)
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(90);
  });
});

describe("Sprint 20: SRS Phoneme Integration Library", () => {
  it("srs-phoneme.ts exists and exports core functions", () => {
    expect(srsPhonemeSource).toContain("export async function addPhonemeToSRS");
    expect(srsPhonemeSource).toContain("export async function addStrugglingPhonemesToSRS");
    expect(srsPhonemeSource).toContain("export async function getPhonemeCards");
    expect(srsPhonemeSource).toContain("export async function getDuePhonemeCards");
    expect(srsPhonemeSource).toContain("export async function isPhonemeInSRS");
    expect(srsPhonemeSource).toContain("export async function removePhonemeFromSRS");
  });

  it("uses phoneme: prefix convention for card IDs", () => {
    expect(srsPhonemeSource).toContain('`phoneme:${phoneme.language.toLowerCase()}:${phoneme.phonemeId}`');
    expect(srsPhonemeSource).toContain('item.id.startsWith("phoneme:")');
  });

  it("exports PhonemeCardData type", () => {
    expect(srsPhonemeSource).toContain("export interface PhonemeCardData");
    expect(srsPhonemeSource).toContain("phonemeId: string");
    expect(srsPhonemeSource).toContain("symbol: string");
    expect(srsPhonemeSource).toContain("language: string");
    expect(srsPhonemeSource).toContain("score: number");
    expect(srsPhonemeSource).toContain("examples: string[]");
    expect(srsPhonemeSource).toContain("tip: string");
  });

  it("uses threshold of 50 for struggling phonemes by default", () => {
    expect(srsPhonemeSource).toContain("threshold: number = 50");
    expect(srsPhonemeSource).toContain("p.score < threshold");
  });

  it("integrates with main SRS queue via addToReviewQueue", () => {
    expect(srsPhonemeSource).toContain('import { addToReviewQueue, loadReviewQueue, saveReviewQueue } from "./srs"');
  });

  it("maps phoneme data to SRS item fields correctly", () => {
    // word = symbol + name, translation = tip, context = examples, lessonId = phoneme:{language}
    expect(srsPhonemeSource).toContain("word: `${phoneme.symbol} — ${phoneme.name}`");
    expect(srsPhonemeSource).toContain("translation: phoneme.tip");
    expect(srsPhonemeSource).toContain("context: `Practice: ${phoneme.examples.slice(0, 3).join");
    expect(srsPhonemeSource).toContain("lessonId: `phoneme:${phoneme.language}`");
  });

  it("tracks phoneme additions in separate storage key", () => {
    expect(srsPhonemeSource).toContain("@srs_phoneme_tracking");
    expect(srsPhonemeSource).toContain("trackPhonemeAdded");
  });
});

describe("Sprint 20: SRS Review Screen — Phoneme Card Handling", () => {
  it("detects phoneme cards by ID prefix", () => {
    expect(srsReviewSource).toContain('currentItem?.id?.startsWith("phoneme:")');
  });

  it("shows 'Pronounce this sound' label for phoneme cards", () => {
    expect(srsReviewSource).toContain("Pronounce this sound");
  });

  it("shows 'What does this mean?' for vocabulary cards", () => {
    expect(srsReviewSource).toContain("What does this mean?");
  });

  it("shows 'Tip' label for phoneme answer, 'Answer' for vocab", () => {
    expect(srsReviewSource).toContain('"Tip"');
    expect(srsReviewSource).toContain('"Answer"');
  });

  it("shows mic icon for phoneme cards instead of book icon", () => {
    expect(srsReviewSource).toContain('name="mic"');
  });

  it("shows pronunciation-specific rating prompt for phoneme cards", () => {
    expect(srsReviewSource).toContain("How well can you produce this sound?");
  });

  it("displays language from lessonId for phoneme cards", () => {
    expect(srsReviewSource).toContain('currentItem.lessonId?.replace("phoneme:", "")');
  });
});

describe("Sprint 20: Heat Map — SRS Integration UI", () => {
  it("imports addStrugglingPhonemesToSRS from srs-phoneme", () => {
    expect(heatMapSource).toContain('import { addStrugglingPhonemesToSRS');
    expect(heatMapSource).toContain('from "@/lib/srs-phoneme"');
  });

  it("has 'Add Weak Sounds to SRS' button", () => {
    expect(heatMapSource).toContain("Add Weak Sounds to SRS");
  });

  it("has Spaced Repetition section header", () => {
    expect(heatMapSource).toContain("Spaced Repetition");
  });

  it("shows success message after adding to SRS", () => {
    expect(heatMapSource).toContain("Added to Review Queue");
    expect(heatMapSource).toContain("to your review queue");
  });

  it("has handleAddToSRS function that calls addStrugglingPhonemesToSRS", () => {
    expect(heatMapSource).toContain("handleAddToSRS");
    expect(heatMapSource).toContain("addStrugglingPhonemesToSRS(phonemeCards, 50)");
  });

  it("tracks srsAdded state for UI toggle", () => {
    expect(heatMapSource).toContain("srsAdded");
    expect(heatMapSource).toContain("setSrsAdded(true)");
    expect(heatMapSource).toContain("srsAddedCount");
  });
});

describe("Sprint 20: Notification Wording — Generic for Mixed Cards", () => {
  it("uses generic 'Review Time' title instead of 'Vocabulary Review Time'", () => {
    expect(notificationsSource).toContain("Review Time!");
    expect(notificationsSource).not.toContain("Vocabulary Review Time!");
  });

  it("uses 'cards' instead of 'words' in notification body", () => {
    expect(notificationsSource).toContain("card is ready for review");
    expect(notificationsSource).toContain("cards are ready for review");
  });
});

describe("Sprint 20: SRS Library — Unchanged Core Contract", () => {
  it("still exports all original SRS functions", () => {
    expect(srsLibSource).toContain("export function calculateNextReview");
    expect(srsLibSource).toContain("export async function loadReviewQueue");
    expect(srsLibSource).toContain("export async function getDueItems");
    expect(srsLibSource).toContain("export async function getDueCount");
    expect(srsLibSource).toContain("export async function addToReviewQueue");
    expect(srsLibSource).toContain("export async function reviewItem");
    expect(srsLibSource).toContain("export async function getQueueStats");
  });

  it("still uses @srs_queue storage key", () => {
    expect(srsLibSource).toContain('@srs_queue');
  });

  it("still uses SM-2 algorithm with min ease factor 1.3", () => {
    expect(srsLibSource).toContain("MIN_EASE_FACTOR = 1.3");
    expect(srsLibSource).toContain("quality < 3");
  });
});
