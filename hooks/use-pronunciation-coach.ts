/**
 * Pronunciation Coach Hook
 * 
 * Combines Hume EVI emotion detection with server-side pronunciation analysis
 * to provide emotion-aware pronunciation coaching.
 * 
 * Features:
 * - Real-time emotion tracking during pronunciation attempts
 * - Adaptive difficulty based on frustration/confidence levels
 * - Phoneme-level feedback with IPA notation
 * - Session progress tracking
 * - Integration with Hume voice call for live coaching
 */

import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";

export interface PronunciationAttempt {
  word: string;
  score: number | null;
  phonemes: Array<{
    text: string;
    ipa: string;
    score: number;
    issue: string | null;
  }>;
  corrections: Array<{
    wrong: string;
    correct: string;
    explanation: string;
  }>;
  soundItOut: Array<{
    syllable: string;
    phonetic: string;
  }>;
  tip: string;
  emotionDuringAttempt: string | null;
  naturalness?: {
    overall: number;
    rhythm: number;
    intonation: number;
    flow: number;
    feedback: string;
  } | null;
  timestamp: number;
}

export interface PronunciationSessionState {
  isActive: boolean;
  language: string;
  dialect: string | null;
  level: "beginner" | "intermediate" | "advanced";
  attempts: PronunciationAttempt[];
  currentWord: string | null;
  averageScore: number;
  totalAttempts: number;
  emotionProfile: {
    averageFrustration: number;
    averageConfidence: number;
    emotionTrend: "improving" | "stable" | "declining";
  };
}

export function usePronunciationCoach(options: {
  language: string;
  dialect?: string;
  level?: "beginner" | "intermediate" | "advanced";
}) {
  const { language, dialect, level = "intermediate" } = options;

  const [session, setSession] = useState<PronunciationSessionState>({
    isActive: false,
    language,
    dialect: dialect || null,
    level,
    attempts: [],
    currentWord: null,
    averageScore: 0,
    totalAttempts: 0,
    emotionProfile: {
      averageFrustration: 0,
      averageConfidence: 0,
      emotionTrend: "stable",
    },
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<PronunciationAttempt | null>(null);
  const [drills, setDrills] = useState<Array<{
    id: string;
    text: string;
    ipa: string;
    translation: string;
    focusSound: string;
    tip: string;
    difficulty: string;
  }>>([]);

  const emotionHistory = useRef<Array<{ frustration: number; confidence: number; timestamp: number }>>([]);

  // tRPC mutations
  const analyzeMutation = trpc.pronunciation.analyze.useMutation();
  const generateDrillMutation = trpc.pronunciation.generateDrill.useMutation();
  const sessionSummaryMutation = trpc.pronunciation.sessionSummary.useMutation();

  // Track emotion data from Hume during pronunciation attempts
  const recordEmotion = useCallback((emotionData: {
    frustration?: number;
    confidence?: number;
    joy?: number;
    concentration?: number;
  }) => {
    emotionHistory.current.push({
      frustration: emotionData.frustration || 0,
      confidence: emotionData.confidence || 0,
      timestamp: Date.now(),
    });

    // Update emotion profile
    const recent = emotionHistory.current.slice(-10);
    const avgFrustration = recent.reduce((sum, e) => sum + e.frustration, 0) / recent.length;
    const avgConfidence = recent.reduce((sum, e) => sum + e.confidence, 0) / recent.length;

    // Determine trend
    let trend: "improving" | "stable" | "declining" = "stable";
    if (recent.length >= 5) {
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      const firstAvg = firstHalf.reduce((s, e) => s + e.frustration, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, e) => s + e.frustration, 0) / secondHalf.length;
      if (secondAvg < firstAvg - 0.1) trend = "improving";
      else if (secondAvg > firstAvg + 0.1) trend = "declining";
    }

    setSession((prev) => ({
      ...prev,
      emotionProfile: {
        averageFrustration: avgFrustration,
        averageConfidence: avgConfidence,
        emotionTrend: trend,
      },
    }));
  }, []);

  // Analyze a pronunciation attempt
  const analyzeAttempt = useCallback(async (targetText: string, attemptNumber = 1, previousScore?: number) => {
    setIsAnalyzing(true);
    setSession((prev) => ({ ...prev, currentWord: targetText }));

    // Get recent emotion data
    const recentEmotions = emotionHistory.current.slice(-5);
    const emotionData = recentEmotions.length > 0 ? {
      dominantEmotion: undefined,
      frustration: recentEmotions.reduce((s, e) => s + e.frustration, 0) / recentEmotions.length,
      confidence: recentEmotions.reduce((s, e) => s + e.confidence, 0) / recentEmotions.length,
      concentration: undefined,
      joy: undefined,
    } : undefined;

    try {
      const result = await analyzeMutation.mutateAsync({
        targetText,
        language,
        dialect,
        userLevel: level,
        emotionData,
        attemptNumber,
        previousScore,
      });

      if (result.success && result.analysis) {
        const attempt: PronunciationAttempt = {
          word: targetText,
          score: result.analysis.score,
          phonemes: result.analysis.phonemes || [],
          corrections: result.analysis.corrections || [],
          soundItOut: result.analysis.soundItOut || [],
          tip: result.analysis.tip || "",
          emotionDuringAttempt: result.analysis.emotionAwareFeedback || null,
          naturalness: result.analysis.naturalness || null,
          timestamp: Date.now(),
        };

        setLastAnalysis(attempt);
        setSession((prev) => {
          const newAttempts = [...prev.attempts, attempt];
          const scores = newAttempts.filter((a) => a.score !== null).map((a) => a.score!);
          const avgScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
          return {
            ...prev,
            attempts: newAttempts,
            totalAttempts: prev.totalAttempts + 1,
            averageScore: avgScore,
          };
        });

        return attempt;
      }
      return null;
    } catch (error) {
      console.error("Pronunciation analysis failed:", error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [language, dialect, level, analyzeMutation]);

  // Generate new drill words
  const loadDrills = useCallback(async (options?: {
    difficulty?: "easy" | "medium" | "hard";
    focusArea?: "vowels" | "consonants" | "tones" | "rhythm" | "intonation" | "all";
    count?: number;
  }) => {
    // Adapt difficulty based on emotion
    let difficulty = options?.difficulty || "medium";
    if (session.emotionProfile.averageFrustration > 0.6) {
      difficulty = "easy"; // Reduce difficulty when frustrated
    } else if (session.averageScore > 85 && session.emotionProfile.averageConfidence > 0.6) {
      difficulty = "hard"; // Increase when confident and scoring well
    }

    try {
      const result = await generateDrillMutation.mutateAsync({
        language,
        dialect,
        difficulty,
        focusArea: options?.focusArea || "all",
        count: options?.count || 5,
      });

      if (result.success && result.drills) {
        setDrills(result.drills);
        return result.drills;
      }
      return [];
    } catch (error) {
      console.error("Failed to generate drills:", error);
      return [];
    }
  }, [language, dialect, session.emotionProfile, session.averageScore, generateDrillMutation]);

  // End session and get summary
  const endSession = useCallback(async (durationMinutes: number) => {
    try {
      const result = await sessionSummaryMutation.mutateAsync({
        language,
        dialect,
        sessionType: "drill",
        duration: durationMinutes,
        wordsAttempted: session.totalAttempts,
        averageScore: session.averageScore,
        emotionProfile: {
          averageFrustration: session.emotionProfile.averageFrustration,
          averageConfidence: session.emotionProfile.averageConfidence,
          emotionTrend: session.emotionProfile.emotionTrend,
        },
      });

      setSession((prev) => ({ ...prev, isActive: false }));
      return result.success ? result.summary : null;
    } catch (error) {
      console.error("Failed to get session summary:", error);
      return null;
    }
  }, [language, dialect, session, sessionSummaryMutation]);

  // Start a new session
  const startSession = useCallback(() => {
    emotionHistory.current = [];
    setSession({
      isActive: true,
      language,
      dialect: dialect || null,
      level,
      attempts: [],
      currentWord: null,
      averageScore: 0,
      totalAttempts: 0,
      emotionProfile: {
        averageFrustration: 0,
        averageConfidence: 0,
        emotionTrend: "stable",
      },
    });
    setLastAnalysis(null);
    setDrills([]);
  }, [language, dialect, level]);

  return {
    session,
    isAnalyzing,
    lastAnalysis,
    drills,
    // Actions
    startSession,
    endSession,
    analyzeAttempt,
    loadDrills,
    recordEmotion,
    // Computed
    isSessionActive: session.isActive,
    shouldReduceDifficulty: session.emotionProfile.averageFrustration > 0.6,
    shouldIncreaseDifficulty: session.averageScore > 85 && session.emotionProfile.averageConfidence > 0.6,
  };
}
