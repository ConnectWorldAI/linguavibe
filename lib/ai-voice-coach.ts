/**
 * AI Voice Coach Feedback Library
 * 
 * After each duel round, generates and speaks a short AI tip explaining
 * what the user mispronounced and how to correct it.
 */

import * as Speech from "expo-speech";
import { Platform } from "react-native";

// ─── Types ──────────────────────────────────────────────────────────

export interface RoundFeedback {
  tip: string;
  encouragement: string;
  specificCorrection: string;
  overallMessage: string;
  severity: "perfect" | "good" | "needs_work" | "struggling";
}

export interface VoiceCoachSettings {
  enabled: boolean;
  speakFeedback: boolean;
  speechRate: number;
  speechPitch: number;
  language: string;
  voiceId?: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const LANGUAGE_VOICE_MAP: Record<string, string> = {
  spanish: "es-ES",
  french: "fr-FR",
  portuguese: "pt-BR",
  japanese: "ja-JP",
  german: "de-DE",
  korean: "ko-KR",
  mandarin: "zh-CN",
  english: "en-US",
};

const ENCOURAGEMENTS = {
  perfect: [
    "Perfect pronunciation! You nailed it!",
    "Flawless! You sound like a native speaker!",
    "Excellent! Keep up the amazing work!",
    "Outstanding! Your pronunciation is spot on!",
  ],
  good: [
    "Great job! Just a small adjustment needed.",
    "Almost perfect! One tiny thing to work on.",
    "Very good! You're getting closer to native level.",
    "Nice work! A small tweak will make it perfect.",
  ],
  needs_work: [
    "Good effort! Let's focus on one key area.",
    "You're making progress! Here's a tip to improve.",
    "Keep practicing! This sound is tricky for everyone.",
    "Don't give up! Here's how to get it right.",
  ],
  struggling: [
    "This is a tough one! Let me help you break it down.",
    "No worries, this sound takes time to master.",
    "Let's slow down and focus on the basics.",
    "Everyone struggles with this at first. Here's the trick.",
  ],
};

// ─── Feedback Generation ────────────────────────────────────────────

/**
 * Generate AI coach feedback for a round result
 */
export function generateRoundFeedback(
  targetWord: string,
  userTranscript: string,
  score: number,
  language: string,
  phonetic?: string
): RoundFeedback {
  const severity = getSeverity(score);
  const encouragement = getRandomItem(ENCOURAGEMENTS[severity]);
  const specificCorrection = generateCorrection(targetWord, userTranscript, language, phonetic);
  const tip = generateTip(targetWord, userTranscript, score, language);
  
  const overallMessage = score >= 90
    ? encouragement
    : `${encouragement} ${specificCorrection}`;
  
  return { tip, encouragement, specificCorrection, overallMessage, severity };
}

/**
 * Generate feedback for a complete match
 */
export function generateMatchFeedback(
  rounds: Array<{ word: string; transcript: string; score: number }>,
  language: string
): {
  summary: string;
  weakAreas: string[];
  strongAreas: string[];
  overallTip: string;
} {
  const avgScore = rounds.reduce((sum, r) => sum + r.score, 0) / Math.max(rounds.length, 1);
  const weakRounds = rounds.filter(r => r.score < 70).map(r => r.word);
  const strongRounds = rounds.filter(r => r.score >= 90).map(r => r.word);
  
  let summary: string;
  if (avgScore >= 90) {
    summary = "Incredible performance! Your pronunciation is nearly native-level.";
  } else if (avgScore >= 75) {
    summary = "Great match! You showed strong pronunciation skills with room to polish a few sounds.";
  } else if (avgScore >= 60) {
    summary = "Good effort! Focus on the words you struggled with and you'll see rapid improvement.";
  } else {
    summary = "Keep practicing! Pronunciation takes time. Review the words below and try again.";
  }
  
  const overallTip = weakRounds.length > 0
    ? `Focus on practicing: ${weakRounds.slice(0, 3).map(w => `"${w}"`).join(", ")}. Try saying each one slowly 5 times.`
    : "You're doing great! Try increasing the difficulty for more challenge.";
  
  return {
    summary,
    weakAreas: weakRounds,
    strongAreas: strongRounds,
    overallTip,
  };
}

// ─── Voice Playback ─────────────────────────────────────────────────

/**
 * Speak the coach feedback aloud using text-to-speech
 */
export async function speakFeedback(
  feedback: RoundFeedback,
  settings?: Partial<VoiceCoachSettings>
): Promise<void> {
  if (Platform.OS === "web") return; // TTS not reliable on web
  
  const rate = settings?.speechRate ?? 0.9;
  const pitch = settings?.speechPitch ?? 1.0;
  
  // Stop any ongoing speech
  const isSpeaking = await Speech.isSpeakingAsync();
  if (isSpeaking) {
    await Speech.stop();
  }
  
  return new Promise<void>((resolve) => {
    Speech.speak(feedback.overallMessage, {
      language: "en-US", // Coach speaks in English
      rate,
      pitch,
      onDone: () => resolve(),
      onError: () => resolve(),
      onStopped: () => resolve(),
    });
  });
}

/**
 * Speak the correct pronunciation of a word
 */
export async function speakCorrectPronunciation(
  word: string,
  language: string,
  rate?: number
): Promise<void> {
  if (Platform.OS === "web") return;
  
  const voiceLang = LANGUAGE_VOICE_MAP[language] || "en-US";
  
  const isSpeaking = await Speech.isSpeakingAsync();
  if (isSpeaking) {
    await Speech.stop();
  }
  
  return new Promise<void>((resolve) => {
    Speech.speak(word, {
      language: voiceLang,
      rate: rate ?? 0.8, // Slightly slower for learning
      pitch: 1.0,
      onDone: () => resolve(),
      onError: () => resolve(),
      onStopped: () => resolve(),
    });
  });
}

/**
 * Speak a combined feedback: coach tip + correct pronunciation
 */
export async function speakFullFeedback(
  feedback: RoundFeedback,
  targetWord: string,
  language: string,
  settings?: Partial<VoiceCoachSettings>
): Promise<void> {
  if (Platform.OS === "web") return;
  
  // First speak the coach tip in English
  await speakFeedback(feedback, settings);
  
  // Small pause
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Then speak the correct pronunciation in the target language
  if (feedback.severity !== "perfect") {
    await speakCorrectPronunciation(targetWord, language);
  }
}

/**
 * Stop any ongoing coach speech
 */
export async function stopCoachSpeech(): Promise<void> {
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }
  } catch {
    // Silent fail
  }
}

// ─── Internal Helpers ───────────────────────────────────────────────

function getSeverity(score: number): RoundFeedback["severity"] {
  if (score >= 90) return "perfect";
  if (score >= 70) return "good";
  if (score >= 50) return "needs_work";
  return "struggling";
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCorrection(
  target: string,
  transcript: string,
  language: string,
  phonetic?: string
): string {
  if (!transcript || transcript.trim().length === 0) {
    return `Try saying "${target}" clearly. ${phonetic ? `It sounds like: ${phonetic}` : ""}`;
  }
  
  const targetLower = target.toLowerCase().trim();
  const transcriptLower = transcript.toLowerCase().trim();
  
  if (targetLower === transcriptLower) {
    return "Your pronunciation matched perfectly!";
  }
  
  // Find the first differing character position
  let diffPos = 0;
  for (let i = 0; i < Math.min(targetLower.length, transcriptLower.length); i++) {
    if (targetLower[i] !== transcriptLower[i]) {
      diffPos = i;
      break;
    }
    diffPos = i + 1;
  }
  
  if (diffPos < targetLower.length) {
    const problemArea = targetLower.substring(
      Math.max(0, diffPos - 1),
      Math.min(targetLower.length, diffPos + 3)
    );
    return `Focus on the "${problemArea}" sound in "${target}". ${phonetic ? `The correct pronunciation is: ${phonetic}` : `Try breaking it into syllables.`}`;
  }
  
  return `You said "${transcript}" but the target was "${target}". ${phonetic ? `Listen for: ${phonetic}` : "Try again slowly."}`;
}

function generateTip(
  target: string,
  transcript: string,
  score: number,
  language: string
): string {
  const langTips: Record<string, string[]> = {
    spanish: [
      "Roll your R's by placing your tongue behind your upper teeth.",
      "Spanish vowels are pure — A is always 'ah', E is always 'eh'.",
      "The Ñ sound is like 'ny' in 'canyon'.",
      "Double L (ll) sounds like 'y' in most Spanish dialects.",
    ],
    french: [
      "Practice the French R by gargling gently in the back of your throat.",
      "Nasal vowels: let air flow through your nose for 'on', 'an', 'in'.",
      "Silent final consonants are key — don't pronounce the last letter.",
      "The 'u' sound: say 'ee' but round your lips like 'oo'.",
    ],
    portuguese: [
      "The 'ão' ending is a nasal sound — say 'ow' through your nose.",
      "Brazilian R at the start of words sounds like English H.",
      "The 'lh' combination sounds like 'ly' in 'million'.",
      "Stressed syllables in Portuguese are very important for meaning.",
    ],
    japanese: [
      "Japanese R is between English L and R — tap your tongue once.",
      "Keep vowels short and crisp — don't draw them out.",
      "The 'tsu' sound: put your tongue behind your teeth and hiss.",
      "Pitch accent matters — practice the rise and fall of syllables.",
    ],
    german: [
      "The 'ch' after front vowels sounds like a cat hissing.",
      "German R is uvular — vibrate the back of your throat.",
      "Umlauts change the vowel: ü is 'ee' with rounded lips.",
      "Final consonants are always voiceless: 'd' becomes 't' at word end.",
    ],
    korean: [
      "Korean has three types of consonants: plain, tense, and aspirated.",
      "The ㅓ vowel is like 'uh' but with your mouth more open.",
      "Double consonants (ㄲ, ㄸ, ㅃ) need a tense, sharp release.",
      "Practice the difference between ㄹ as L (final) and R (initial).",
    ],
    mandarin: [
      "Tones are essential — the same syllable with different tones means different things.",
      "The 'x' sound: say 'sh' but with your tongue behind your lower teeth.",
      "Practice the four tones: flat, rising, dipping, falling.",
      "The 'ü' sound: say 'ee' but round your lips tightly.",
    ],
  };
  
  const tips = langTips[language] || [
    "Practice slowly and gradually increase speed.",
    "Listen to native speakers and try to mimic their rhythm.",
    "Record yourself and compare with the original.",
    "Break difficult words into syllables.",
  ];
  
  if (score >= 90) {
    return "Your pronunciation is excellent. Keep challenging yourself with harder words!";
  }
  
  return getRandomItem(tips);
}
