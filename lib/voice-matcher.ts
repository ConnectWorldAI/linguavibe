/**
 * Voice Matcher — Intelligent voice selection for Interpreter
 *
 * When a user hasn't trained their voice clone, this module:
 * 1. Analyzes the input audio characteristics (pitch range → gender detection)
 * 2. Selects the closest-matching pre-built TTS voice
 *
 * In production, this integrates with ElevenLabs voice library.
 * The pitch analysis would use Web Audio API or a native audio analysis module.
 */

// ─── Voice Profiles ─────────────────────────────────────────────────────────

export interface VoiceProfile {
  id: string;
  name: string;
  gender: "male" | "female";
  pitchRange: "low" | "mid" | "high";
  tone: "warm" | "neutral" | "bright";
  accent: string;
  /** ElevenLabs voice ID (production) */
  elevenLabsId?: string;
}

/**
 * Pre-built voice library — curated voices that cover the spectrum
 * of male/female, low/mid/high pitch, and warm/neutral/bright tone.
 */
export const VOICE_LIBRARY: VoiceProfile[] = [
  // Male voices
  { id: "m_low_warm", name: "Marcus", gender: "male", pitchRange: "low", tone: "warm", accent: "neutral" },
  { id: "m_low_neutral", name: "James", gender: "male", pitchRange: "low", tone: "neutral", accent: "neutral" },
  { id: "m_mid_warm", name: "Diego", gender: "male", pitchRange: "mid", tone: "warm", accent: "latin" },
  { id: "m_mid_neutral", name: "Alex", gender: "male", pitchRange: "mid", tone: "neutral", accent: "neutral" },
  { id: "m_mid_bright", name: "Carlos", gender: "male", pitchRange: "mid", tone: "bright", accent: "latin" },
  { id: "m_high_neutral", name: "Kai", gender: "male", pitchRange: "high", tone: "neutral", accent: "neutral" },
  { id: "m_high_bright", name: "Rafael", gender: "male", pitchRange: "high", tone: "bright", accent: "latin" },
  // Female voices
  { id: "f_low_warm", name: "Maya", gender: "female", pitchRange: "low", tone: "warm", accent: "neutral" },
  { id: "f_low_neutral", name: "Sofia", gender: "female", pitchRange: "low", tone: "neutral", accent: "latin" },
  { id: "f_mid_warm", name: "Isabella", gender: "female", pitchRange: "mid", tone: "warm", accent: "latin" },
  { id: "f_mid_neutral", name: "Emma", gender: "female", pitchRange: "mid", tone: "neutral", accent: "neutral" },
  { id: "f_mid_bright", name: "Valentina", gender: "female", pitchRange: "mid", tone: "bright", accent: "latin" },
  { id: "f_high_warm", name: "Luna", gender: "female", pitchRange: "high", tone: "warm", accent: "neutral" },
  { id: "f_high_bright", name: "Camila", gender: "female", pitchRange: "high", tone: "bright", accent: "latin" },
];

// ─── Audio Analysis ─────────────────────────────────────────────────────────

export interface AudioCharacteristics {
  gender: "male" | "female";
  pitchRange: "low" | "mid" | "high";
  tone: "warm" | "neutral" | "bright";
}

/**
 * Analyze audio characteristics from a speech sample.
 *
 * In production, this would:
 * 1. Use Web Audio API (AudioContext + AnalyserNode) to get frequency data
 * 2. Calculate fundamental frequency (F0) to determine pitch range
 * 3. Use spectral centroid to estimate tone (warm vs bright)
 * 4. Classify gender based on F0 range:
 *    - Male: typically 85-180 Hz
 *    - Female: typically 165-255 Hz
 *
 * For now, we provide a deterministic analysis based on simple heuristics
 * that would be replaced by actual audio processing in production.
 */
export function analyzeVoiceCharacteristics(
  /** Average fundamental frequency in Hz (from audio analysis) */
  fundamentalFrequency: number,
  /** Spectral centroid value (higher = brighter) */
  spectralCentroid?: number
): AudioCharacteristics {
  // Gender detection based on F0
  const gender: "male" | "female" = fundamentalFrequency < 165 ? "male" : "female";

  // Pitch range classification
  let pitchRange: "low" | "mid" | "high";
  if (gender === "male") {
    if (fundamentalFrequency < 110) pitchRange = "low";
    else if (fundamentalFrequency < 145) pitchRange = "mid";
    else pitchRange = "high";
  } else {
    if (fundamentalFrequency < 195) pitchRange = "low";
    else if (fundamentalFrequency < 230) pitchRange = "mid";
    else pitchRange = "high";
  }

  // Tone estimation from spectral centroid
  let tone: "warm" | "neutral" | "bright" = "neutral";
  if (spectralCentroid !== undefined) {
    if (spectralCentroid < 1500) tone = "warm";
    else if (spectralCentroid > 2500) tone = "bright";
  }

  return { gender, pitchRange, tone };
}

// ─── Voice Matching ─────────────────────────────────────────────────────────

/**
 * Find the best matching voice from the library based on detected characteristics.
 *
 * Scoring:
 * - Gender match: 10 points (mandatory — wrong gender is never acceptable)
 * - Pitch range match: 5 points (exact), 2 points (adjacent)
 * - Tone match: 3 points (exact), 1 point (adjacent)
 * - Accent preference: 2 points (if target language matches accent)
 */
export function findBestMatchingVoice(
  characteristics: AudioCharacteristics,
  targetLanguage?: string
): VoiceProfile {
  const pitchOrder: Record<string, number> = { low: 0, mid: 1, high: 2 };
  const toneOrder: Record<string, number> = { warm: 0, neutral: 1, bright: 2 };

  const isLatinLanguage = targetLanguage
    ? ["es", "es-do", "es-mx", "es-co", "es-ve", "pt-br", "it", "fr"].includes(targetLanguage)
    : false;

  let bestVoice = VOICE_LIBRARY[0];
  let bestScore = -1;

  for (const voice of VOICE_LIBRARY) {
    let score = 0;

    // Gender must match (hard requirement)
    if (voice.gender !== characteristics.gender) continue;
    score += 10;

    // Pitch range scoring
    const pitchDiff = Math.abs(pitchOrder[voice.pitchRange] - pitchOrder[characteristics.pitchRange]);
    if (pitchDiff === 0) score += 5;
    else if (pitchDiff === 1) score += 2;

    // Tone scoring
    const toneDiff = Math.abs(toneOrder[voice.tone] - toneOrder[characteristics.tone]);
    if (toneDiff === 0) score += 3;
    else if (toneDiff === 1) score += 1;

    // Accent preference
    if (isLatinLanguage && voice.accent === "latin") score += 2;
    if (!isLatinLanguage && voice.accent === "neutral") score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}

// ─── Quick Match (Convenience) ──────────────────────────────────────────────

/**
 * Quick voice match — given raw audio frequency data, returns the best voice.
 * This is the main function the Interpreter calls.
 */
export function quickMatchVoice(
  fundamentalFrequency: number,
  targetLanguage?: string,
  spectralCentroid?: number
): VoiceProfile {
  const characteristics = analyzeVoiceCharacteristics(fundamentalFrequency, spectralCentroid);
  return findBestMatchingVoice(characteristics, targetLanguage);
}

/**
 * Get a default voice based on simple gender detection.
 * Used as a fallback when no audio analysis is available yet.
 */
export function getDefaultVoice(gender: "male" | "female", targetLanguage?: string): VoiceProfile {
  const characteristics: AudioCharacteristics = {
    gender,
    pitchRange: "mid",
    tone: "neutral",
  };
  return findBestMatchingVoice(characteristics, targetLanguage);
}
