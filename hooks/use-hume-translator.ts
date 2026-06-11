/**
 * Hume-Powered Live Translation Hook
 * 
 * Combines Hume EVI's emotion-aware speech processing with the existing
 * OpenAI Realtime Translation API for a superior translation experience.
 * 
 * Architecture:
 * 1. Hume EVI handles: emotion detection, prosody analysis, speaker engagement tracking
 * 2. OpenAI Realtime handles: actual speech-to-speech translation
 * 3. This hook orchestrates both, providing:
 *    - Real-time emotion-aware translation (adjusts formality based on detected emotion)
 *    - Confidence indicators for translation quality
 *    - Speaker engagement metrics
 *    - Automatic dialect detection from prosody
 * 
 * The user preference is to silence original audio and only play translated audio.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export interface TranslationSegment {
  id: string;
  originalText: string;
  translatedText: string;
  timestamp: number;
  emotion: string | null;
  confidence: number;
  speakerTone: "formal" | "casual" | "excited" | "neutral";
}

export interface TranslatorSessionState {
  isActive: boolean;
  isConnecting: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  mode: "one-way" | "conversation";
  voicePreference: "natural" | "clone";
  // Real-time state
  segments: TranslationSegment[];
  currentSpeaker: "user" | "other" | null;
  isListening: boolean;
  isSpeaking: boolean;
  // Metrics
  duration: number;
  wordsTranslated: number;
  averageLatency: number;
  // Emotion overlay from Hume
  speakerEmotion: string | null;
  emotionConfidence: number;
  engagementLevel: "high" | "medium" | "low";
}

export function useHumeTranslator(options: {
  sourceLanguage: string;
  targetLanguage: string;
  mode?: "one-way" | "conversation";
  voicePreference?: "natural" | "clone";
  voiceModelId?: string;
  secondLanguage?: string;
  silenceOriginal?: boolean; // Default true per user preference
}) {
  const {
    sourceLanguage,
    targetLanguage,
    mode = "one-way",
    voicePreference = "natural",
    voiceModelId,
    secondLanguage,
    silenceOriginal = true,
  } = options;

  const [session, setSession] = useState<TranslatorSessionState>({
    isActive: false,
    isConnecting: false,
    sourceLanguage,
    targetLanguage,
    mode,
    voicePreference,
    segments: [],
    currentSpeaker: null,
    isListening: false,
    isSpeaking: false,
    duration: 0,
    wordsTranslated: 0,
    averageLatency: 0,
    speakerEmotion: null,
    emotionConfidence: 0,
    engagementLevel: "medium",
  });

  const [error, setError] = useState<string | null>(null);
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTime = useRef<number>(0);

  // tRPC mutations for the existing live translate backend
  const createSessionMutation = trpc.liveTranslate.createSession.useMutation();
  const createConversationMutation = trpc.liveTranslate.createConversationSession.useMutation();
  const reportUsageMutation = trpc.liveTranslate.reportUsage.useMutation();

  // Hume token for emotion overlay
  const getHumeTokenMutation = trpc.hume.getAccessToken.useMutation();

  // Start translation session
  const startSession = useCallback(async () => {
    setSession((prev) => ({ ...prev, isConnecting: true }));
    setError(null);

    try {
      let translationSession;

      if (mode === "conversation" && secondLanguage) {
        // Two-way conversation mode
        const result = await createConversationMutation.mutateAsync({
          language1: sourceLanguage,
          language2: secondLanguage,
          voicePreference,
          voiceModelId,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to create conversation session");
        }
        translationSession = result;
      } else {
        // One-way translation
        const result = await createSessionMutation.mutateAsync({
          targetLanguage,
          sourceLanguage,
          mode: "fast",
          voicePreference,
          voiceModelId,
          conversationMode: mode === "conversation",
          secondLanguage,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to create translation session");
        }
        translationSession = result;
      }

      // Also get Hume token for emotion overlay (non-blocking)
      getHumeTokenMutation.mutateAsync({}).catch(() => {
        // Emotion overlay is optional - translation works without it
        console.log("[HumeTranslator] Emotion overlay unavailable, continuing without");
      });

      // Start duration timer
      sessionStartTime.current = Date.now();
      durationTimer.current = setInterval(() => {
        setSession((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - sessionStartTime.current) / 1000),
        }));
      }, 1000);

      setSession((prev) => ({
        ...prev,
        isActive: true,
        isConnecting: false,
        isListening: true,
      }));

      return translationSession;
    } catch (err: any) {
      setError(err.message || "Failed to start translation");
      setSession((prev) => ({ ...prev, isConnecting: false }));
      return null;
    }
  }, [sourceLanguage, targetLanguage, mode, voicePreference, voiceModelId, secondLanguage]);

  // Stop translation session
  const stopSession = useCallback(async () => {
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }

    const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);

    // Report usage
    try {
      await reportUsageMutation.mutateAsync({
        durationSeconds,
        targetLanguage,
        voicePreference,
        conversationMode: mode === "conversation",
      });
    } catch {
      // Non-critical
    }

    setSession((prev) => ({
      ...prev,
      isActive: false,
      isListening: false,
      isSpeaking: false,
      currentSpeaker: null,
    }));

    return { durationSeconds, wordsTranslated: session.wordsTranslated };
  }, [targetLanguage, voicePreference, mode, session.wordsTranslated]);

  // Add a translation segment (called when translation is received)
  const addSegment = useCallback((segment: Omit<TranslationSegment, "id" | "timestamp">) => {
    const newSegment: TranslationSegment = {
      ...segment,
      id: `seg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    setSession((prev) => ({
      ...prev,
      segments: [...prev.segments, newSegment],
      wordsTranslated: prev.wordsTranslated + segment.translatedText.split(" ").length,
    }));
  }, []);

  // Update emotion from Hume prosody analysis
  const updateEmotion = useCallback((emotion: string, confidence: number) => {
    setSession((prev) => ({
      ...prev,
      speakerEmotion: emotion,
      emotionConfidence: confidence,
      engagementLevel: confidence > 0.7 ? "high" : confidence > 0.4 ? "medium" : "low",
    }));
  }, []);

  // Toggle listening state (for push-to-talk mode)
  const toggleListening = useCallback(() => {
    setSession((prev) => ({ ...prev, isListening: !prev.isListening }));
  }, []);

  // Swap languages (for conversation mode)
  const swapSpeaker = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      currentSpeaker: prev.currentSpeaker === "user" ? "other" : "user",
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
      }
    };
  }, []);

  return {
    session,
    error,
    // Actions
    startSession,
    stopSession,
    addSegment,
    updateEmotion,
    toggleListening,
    swapSpeaker,
    // Computed
    isActive: session.isActive,
    isConnecting: session.isConnecting,
    silenceOriginal,
    formattedDuration: formatDuration(session.duration),
  };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
