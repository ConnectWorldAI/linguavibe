import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated as RNAnimated,
  Modal,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useUsage } from "@/lib/usage-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { quickMatchVoice, getDefaultVoice, type VoiceProfile } from "@/lib/voice-matcher";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { trpc } from "@/lib/trpc";
import { useHumeVoice, type EmotionScore } from "@/hooks/use-hume-voice";
import { useHumeTranslator } from "@/hooks/use-hume-translator";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";

// ─── Languages ──────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "es-do", name: "Dominican Spanish", flag: "🇩🇴" },
  { code: "es-mx", name: "Mexican Spanish", flag: "🇲🇽" },
  { code: "es-co", name: "Colombian Spanish", flag: "🇨🇴" },
  { code: "es-ve", name: "Venezuelan Spanish", flag: "🇻🇪" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳" },
  { code: "pt-br", name: "Brazilian Portuguese", flag: "🇧🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
];

// ─── Sentiment Colors ───────────────────────────────────────────────────────

const SENTIMENT_COLORS: Record<string, string> = {
  neutral: "#9CA3AF",
  happy: "#4ADE80",
  excited: "#FBBF24",
  confused: "#F59E0B",
  frustrated: "#F87171",
  sad: "#60A5FA",
  angry: "#EF4444",
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface ConversationEntry {
  id: string;
  speaker: "person1" | "person2";
  original: string;
  translated: string;
  sentiment: string;
  timestamp: number;
  audioUrl?: string; // TTS audio URL for re-listening
  isTranslating?: boolean; // Loading indicator while pipeline processes
}

// ─── Component ──────────────────────────────────────────────────────────────

// ─── Session History Types ─────────────────────────────────────────────────

interface InterpreterSession {
  id: string;
  date: string;
  person1Lang: string;
  person2Lang: string;
  entries: ConversationEntry[];
  duration: number; // seconds
}

const SESSION_HISTORY_KEY = "@interpreter_sessions";

export default function InterpreterScreen() {
  const { isLimitReached, incrementUsage } = useUsage();
  const [person1Lang, setPerson1Lang] = useState(LANGUAGES[0]); // English
  const [person2Lang, setPerson2Lang] = useState(LANGUAGES[1]); // Spanish
  const [isListening, setIsListening] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<"person1" | "person2" | null>(null);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [showLangPicker, setShowLangPicker] = useState<"person1" | "person2" | null>(null);
  const [autoDetect, setAutoDetect] = useState(true);
  const [autoDetectLang, setAutoDetectLang] = useState(true);
  const [detectedLangInfo, setDetectedLangInfo] = useState<{
    person1?: { language: string; confidence: number; dialect?: string | null };
    person2?: { language: string; confidence: number; dialect?: string | null };
  }>({});
  const [isDetectingLang, setIsDetectingLang] = useState(false);
  const [sentimentEnabled, setSentimentEnabled] = useState(true);
  const [useMyVoice, setUseMyVoice] = useState(false);
  const [voiceTrained, setVoiceTrained] = useState(false);
  const [matchedVoice, setMatchedVoice] = useState<VoiceProfile | null>(null);

  // ─── Voice Quality Indicator ────────────────────────────────────────────────
  const [voiceQuality, setVoiceQuality] = useState<{
    overall: number; clarity: number; consistency: number; background: number;
    tips: string[];
  } | null>(null);
  const [showVoiceQuality, setShowVoiceQuality] = useState(false);

  // ─── Real-time Transcript Overlay ──────────────────────────────────────────
  const [showTranscript, setShowTranscript] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  // ─── Invite Flow ───────────────────────────────────────────────────────────
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  // ─── Speech-to-Text ─────────────────────────────────────────────────────────
  const stt = useSpeechToText();
  const [isTranslating, setIsTranslating] = useState(false);

  // ─── TTS & Audio Playback ──────────────────────────────────────────────────
  const ttsMutation = trpc.translate.tts.useMutation();
  const translateMutation = trpc.translate.text.useMutation();
  const detectLangMutation = trpc.translate.detectLanguage.useMutation();
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  // ─── Session History Search ────────────────────────────────────────────────
  const [historySearch, setHistorySearch] = useState("");

  // ─── Hume AI Sentiment Detection ──────────────────────────────────────────
  const [humeSessionActive, setHumeSessionActive] = useState(false);
  const humeVoice = useHumeVoice({
    persona: "live_translator",
    language: person2Lang.name,
    customContext: `Translation direction: ${person1Lang.name} → ${person2Lang.name}. Mode: Two-way conversation interpretation.`,
    onEmotions: (emotions: EmotionScore[]) => {
      if (emotions.length > 0 && sentimentEnabled) {
        const top = emotions[0].name.toLowerCase();
        // Map Hume emotion names to our simplified sentiment labels
        const sentimentMap: Record<string, string> = {
          joy: "happy", amusement: "happy", excitement: "excited",
          interest: "curious", curiosity: "curious", surprise: "surprised",
          confusion: "confused", contemplation: "neutral",
          sadness: "sad", disappointment: "sad",
          anger: "angry", annoyance: "angry",
          fear: "nervous", anxiety: "nervous",
          admiration: "happy", love: "happy", gratitude: "happy",
        };
        setLastHumeSentiment(sentimentMap[top] || "neutral");
      }
    },
    onError: (err) => {
      console.warn("[Interpreter] Hume error:", err);
    },
  });
  const [lastHumeSentiment, setLastHumeSentiment] = useState<string>("neutral");

  // ─── Continuous Mode ───────────────────────────────────────────────────────
  const [continuousMode, setContinuousMode] = useState(false);
  const [continuousActive, setContinuousActive] = useState(false);
  const continuousTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  // ─── OpenAI Realtime Translation for Continuous Mode ─────────────────────
  const realtimeTranslator = useHumeTranslator({
    sourceLanguage: person1Lang.code,
    targetLanguage: person2Lang.code,
    mode: "conversation",
    voicePreference: useMyVoice && voiceTrained ? "clone" : "natural",
    voiceModelId: useMyVoice && voiceTrained ? "user_cloned_voice" : undefined,
    secondLanguage: person2Lang.code,
    silenceOriginal: true,
  });

  // ─── Session History ───────────────────────────────────────────────────────
  const [sessionHistory, setSessionHistory] = useState<InterpreterSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState<InterpreterSession | null>(null);

  // Load session history on mount
  React.useEffect(() => {
    AsyncStorage.getItem(SESSION_HISTORY_KEY).then((val) => {
      if (val) setSessionHistory(JSON.parse(val));
    });
  }, []);

  // Filtered history for search
  const filteredHistory = React.useMemo(() => {
    if (!historySearch.trim()) return sessionHistory;
    const q = historySearch.toLowerCase();
    return sessionHistory.filter((s) =>
      s.person1Lang.toLowerCase().includes(q) ||
      s.person2Lang.toLowerCase().includes(q) ||
      s.entries.some((e) =>
        e.original.toLowerCase().includes(q) ||
        e.translated.toLowerCase().includes(q)
      )
    );
  }, [sessionHistory, historySearch]);

  // Save current session to history
  const saveSession = useCallback(async () => {
    if (conversation.length === 0) return;
    const session: InterpreterSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      person1Lang: person1Lang.name,
      person2Lang: person2Lang.name,
      entries: conversation,
      duration: Math.round((Date.now() - sessionStartRef.current) / 1000),
    };
    const updated = [session, ...sessionHistory].slice(0, 30);
    setSessionHistory(updated);
    try {
      await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [conversation, person1Lang, person2Lang, sessionHistory]);

  // Connect/disconnect Hume when sentiment is toggled or screen mounts
  React.useEffect(() => {
    if (sentimentEnabled && !humeVoice.isConnected && !humeVoice.isConnecting) {
      humeVoice.connect().catch(() => {});
      setHumeSessionActive(true);
    } else if (!sentimentEnabled && humeVoice.isConnected) {
      humeVoice.disconnect();
      setHumeSessionActive(false);
    }
  }, [sentimentEnabled]);

  // Cleanup Hume on unmount
  React.useEffect(() => {
    return () => {
      if (humeVoice.isConnected) humeVoice.disconnect();
    };
  }, []);

  // ─── Session Export (from history) ────────────────────────────────────────
  const exportSession = useCallback(async (session: InterpreterSession) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const header = `Interpreter Session\n${session.person1Lang} ↔ ${session.person2Lang}\n${new Date(session.date).toLocaleDateString()} • Duration: ${Math.floor(session.duration / 60)}m ${session.duration % 60}s\n${"─".repeat(40)}\n\n`;

    const transcript = session.entries.map((entry) => {
      const speaker = entry.speaker === "person1" ? session.person1Lang : session.person2Lang;
      const sentimentTag = entry.sentiment ? ` [${entry.sentiment}]` : "";
      return `[${speaker}]${sentimentTag}\n  Original: ${entry.original}\n  Translated: ${entry.translated}\n`;
    }).join("\n");

    const fullText = header + transcript;

    if (Platform.OS === "web") {
      try { await navigator.clipboard.writeText(fullText); } catch {}
      return;
    }

    try {
      const fileUri = FileSystem.documentDirectory + `interpreter-session-${session.id}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, fullText);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: "text/plain", dialogTitle: "Share Session" });
      }
    } catch {}
  }, []);

  // ─── Session Deletion ─────────────────────────────────────────────────────
  const deleteSession = useCallback(async (sessionId: string) => {
    const updated = sessionHistory.filter((s) => s.id !== sessionId);
    setSessionHistory(updated);
    try {
      await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [sessionHistory]);

  const confirmDeleteSession = useCallback((sessionId: string) => {
    if (Platform.OS === "web") {
      deleteSession(sessionId);
      return;
    }
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteSession(sessionId) },
      ]
    );
  }, [deleteSession]);

  const clearAllSessions = useCallback(() => {
    if (sessionHistory.length === 0) return;
    if (Platform.OS === "web") {
      setSessionHistory([]);
      AsyncStorage.removeItem(SESSION_HISTORY_KEY);
      return;
    }
    Alert.alert(
      "Clear All Sessions",
      `Delete all ${sessionHistory.length} sessions? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            setSessionHistory([]);
            AsyncStorage.removeItem(SESSION_HISTORY_KEY);
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [sessionHistory]);

  // Continuous mode: use OpenAI Realtime Translation API for true speech-to-speech
  const startContinuousMode = useCallback(async () => {
    setContinuousActive(true);
    sessionStartRef.current = Date.now();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Start the realtime translation session (sub-second latency, speech-to-speech)
    try {
      const sessionResult = await realtimeTranslator.startSession();
      if (sessionResult) {
        // Connect Hume for emotion overlay during continuous mode
        if (sentimentEnabled && !humeVoice.isConnected) {
          humeVoice.connect();
        }
      } else {
        // Realtime API unavailable — fall back to polling STT pipeline
        console.log("[Interpreter] Realtime API unavailable, using STT fallback");
        const cycle = () => {
          const speakers: Array<"person1" | "person2"> = ["person1", "person2"];
          const nextSpeaker = speakers[Math.floor(Math.random() * 2)];
          startListening(nextSpeaker);
          continuousTimerRef.current = setTimeout(cycle, 3000 + Math.random() * 2000);
        };
        continuousTimerRef.current = setTimeout(cycle, 1500);
      }
    } catch (err) {
      console.warn("[Interpreter] Realtime session start failed:", err);
      // Fall back to simulated cycle
      const cycle = () => {
        const speakers: Array<"person1" | "person2"> = ["person1", "person2"];
        const nextSpeaker = speakers[Math.floor(Math.random() * 2)];
        startListening(nextSpeaker);
        continuousTimerRef.current = setTimeout(cycle, 3000 + Math.random() * 2000);
      };
      continuousTimerRef.current = setTimeout(cycle, 1500);
    }
  }, [realtimeTranslator, sentimentEnabled, humeVoice]);

  const stopContinuousMode = useCallback(async () => {
    setContinuousActive(false);
    if (continuousTimerRef.current) {
      clearTimeout(continuousTimerRef.current);
      continuousTimerRef.current = null;
    }
    stopListening();

    // Stop the realtime translation session and report usage
    if (realtimeTranslator.isActive) {
      await realtimeTranslator.stopSession();
    }

    // Auto-save session when stopping continuous mode
    if (conversation.length > 0) {
      saveSession();
    }
  }, [conversation, saveSession, realtimeTranslator]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (continuousTimerRef.current) clearTimeout(continuousTimerRef.current);
    };
  }, []);

  // Export conversation as text transcript
  const exportConversation = useCallback(async () => {
    if (conversation.length === 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const header = `Interpreter Session\n${person1Lang.name} ↔ ${person2Lang.name}\n${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n${"-".repeat(40)}\n\n`;

    const transcript = conversation.map((entry) => {
      const speaker = entry.speaker === "person1" ? person1Lang.name : person2Lang.name;
      const sentiment = entry.sentiment ? ` [${entry.sentiment}]` : "";
      return `[${speaker}]${sentiment}\n  Original: ${entry.original}\n  Translated: ${entry.translated}\n`;
    }).join("\n");

    const fullText = header + transcript;

    if (Platform.OS === "web") {
      // Web: copy to clipboard
      try {
        await navigator.clipboard.writeText(fullText);
      } catch (e) { /* fallback */ }
      return;
    }

    // Native: share as file
    try {
      const fileUri = FileSystem.documentDirectory + "interpreter-transcript.txt";
      await FileSystem.writeAsStringAsync(fileUri, fullText);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: "text/plain", dialogTitle: "Share Transcript" });
      }
    } catch (e) {
      // Fallback: silent fail
    }
  }, [conversation, person1Lang, person2Lang]);

  // Check if voice is trained on mount (use correct key)
  React.useEffect(() => {
    AsyncStorage.getItem("@voice_clone_trained").then(async (val) => {
      if (val === "true") {
        setVoiceTrained(true);
        setUseMyVoice(true);
        // Load voice quality data
        try {
          const qualityRaw = await AsyncStorage.getItem("@voice_clone_quality");
          if (qualityRaw) {
            const q = JSON.parse(qualityRaw);
            setVoiceQuality(q);
          }
        } catch {}
      } else {
        // No clone — auto-detect and match a voice
        const defaultVoice = getDefaultVoice("male", "es");
        setMatchedVoice(defaultVoice);
      }
    });
  }, []);

  // Pulse animation for active listening
  const pulseAnim = useSharedValue(1);

  // Play TTS audio for a conversation entry
  const playEntryAudio = useCallback(async (entry: ConversationEntry) => {
    // If already playing this entry, stop
    if (playingEntryId === entry.id && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.remove();
      audioPlayerRef.current = null;
      setPlayingEntryId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.remove();
      audioPlayerRef.current = null;
    }

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await setAudioModeAsync({ playsInSilentMode: true });
    } catch {}

    // If we have a cached audio URL, play it directly
    if (entry.audioUrl) {
      try {
        setPlayingEntryId(entry.id);
        const player = createAudioPlayer(entry.audioUrl);
        audioPlayerRef.current = player;
        player.play();
        const checkInterval = setInterval(() => {
          if (!player.playing) {
            setPlayingEntryId(null);
            player.remove();
            audioPlayerRef.current = null;
            clearInterval(checkInterval);
          }
        }, 500);
      } catch {
        // Fallback to expo-speech
        setPlayingEntryId(entry.id);
        Speech.speak(entry.translated, {
          language: entry.speaker === "person1" ? person2Lang.code : person1Lang.code,
          rate: 0.9,
          onDone: () => setPlayingEntryId(null),
          onStopped: () => setPlayingEntryId(null),
          onError: () => setPlayingEntryId(null),
        });
      }
      return;
    }

    // Generate TTS audio via ElevenLabs
    setPlayingEntryId(entry.id);
    try {
      const targetLang = entry.speaker === "person1" ? person2Lang.code : person1Lang.code;
      const result = await ttsMutation.mutateAsync({
        text: entry.translated,
        language: targetLang,
      });

      if (result.audioUrl) {
        // Cache the audio URL on the entry
        setConversation((prev) =>
          prev.map((e) => e.id === entry.id ? { ...e, audioUrl: result.audioUrl } : e)
        );

        const player = createAudioPlayer(result.audioUrl);
        audioPlayerRef.current = player;
        player.play();
        const checkInterval = setInterval(() => {
          if (!player.playing) {
            setPlayingEntryId(null);
            player.remove();
            audioPlayerRef.current = null;
            clearInterval(checkInterval);
          }
        }, 500);
      }
    } catch {
      // Fallback to expo-speech
      Speech.speak(entry.translated, {
        language: entry.speaker === "person1" ? person2Lang.code : person1Lang.code,
        rate: 0.9,
        onDone: () => setPlayingEntryId(null),
        onStopped: () => setPlayingEntryId(null),
        onError: () => setPlayingEntryId(null),
      });
    }
  }, [playingEntryId, person1Lang, person2Lang, ttsMutation]);

  // Cleanup audio player on unmount
  React.useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.remove();
      }
    };
  }, []);

  // Update live transcript when STT produces text
  React.useEffect(() => {
    if (stt.transcript && showTranscript) {
      setLiveTranscript(stt.transcript);
    }
  }, [stt.transcript, showTranscript]);

  const startListening = useCallback(async (speaker: "person1" | "person2") => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsListening(true);
    setActiveSpeaker(speaker);

    // Start pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Auto-detect language from speech (wired after STT completes in stopAndProcess)
    if (autoDetectLang) {
      setIsDetectingLang(true);
    }

    // --- Real Speech-to-Text + Translation + TTS Pipeline ---
    try {
      // 1. Start recording from microphone
      await stt.startRecording();

      // Wait for user to release (handled by onPressOut calling stopListening)
      // The actual transcription happens in stopAndProcess
    } catch (err) {
      // If STT fails (e.g. no permission), fall back to demo mode
      console.warn("[Interpreter] STT start failed, using demo:", err);
      fallbackDemoEntry(speaker);
    }

    // Track voice clone usage for this session
    if (useMyVoice && voiceTrained) {
      incrementUsage("interpreter" as any, 1);
    }
  }, [pulseAnim, stt, autoDetectLang, person1Lang, person2Lang]);

  // Process recorded audio: transcribe, translate, generate TTS
  const stopAndProcess = useCallback(async (speaker: "person1" | "person2") => {
    // Create a placeholder "translating" entry immediately for loading indicator
    const placeholderId = `translating_${Date.now()}`;
    const placeholderEntry: ConversationEntry = {
      id: placeholderId,
      speaker,
      original: "",
      translated: "",
      sentiment: "neutral",
      timestamp: Date.now(),
      isTranslating: true,
    };
    setConversation((prev) => [...prev, placeholderEntry]);

    try {
      setIsTranslating(true);

      // 1. Stop recording and get transcript
      const spokenText = await stt.stopRecording();

      if (!spokenText || spokenText.trim().length === 0) {
        // No speech detected — remove placeholder and fall back to demo
        setConversation((prev) => prev.filter((e) => e.id !== placeholderId));
        fallbackDemoEntry(speaker);
        return;
      }

      // 2. Real language detection from transcribed text
      let sourceLang = speaker === "person1" ? person1Lang : person2Lang;
      let targetLang = speaker === "person1" ? person2Lang : person1Lang;

      if (autoDetectLang) {
        try {
          const detected = await detectLangMutation.mutateAsync({ text: spokenText });
          if (detected.success && detected.confidence > 60) {
            setDetectedLangInfo(prev => ({
              ...prev,
              [speaker]: {
                language: detected.language,
                confidence: detected.confidence,
                dialect: detected.dialect || null,
              },
            }));
            // If detected language differs from expected, swap source/target intelligently
            const detectedCode = detected.code?.toLowerCase() || "";
            const person1Code = person1Lang.code.split("-")[0];
            const person2Code = person2Lang.code.split("-")[0];
            if (speaker === "person1" && detectedCode.startsWith(person2Code)) {
              // Person 1 is speaking person 2's language — swap
              sourceLang = person2Lang;
              targetLang = person1Lang;
            } else if (speaker === "person2" && detectedCode.startsWith(person1Code)) {
              // Person 2 is speaking person 1's language — swap
              sourceLang = person1Lang;
              targetLang = person2Lang;
            }
          }
        } catch {
          // Detection failed — continue with default languages
        } finally {
          setIsDetectingLang(false);
        }
      }

      // 3. Translate the text with context-aware parameters
      const translateResult = await translateMutation.mutateAsync({
        text: spokenText,
        fromLanguage: sourceLang.name,
        toLanguage: targetLang.name,
        dialect: targetLang.code.includes("-") ? targetLang.name : undefined,
        context: conversation.length > 0
          ? `Previous context: ${conversation.slice(-3).map(e => e.original).join(". ")}`
          : undefined,
      });
      const translatedText = (translateResult.success ? translateResult.translation : null) || spokenText;

      // 3. Get sentiment from Hume (already tracked via hook) or fallback
      const sentiment = humeVoice.isConnected && sentimentEnabled
        ? lastHumeSentiment
        : "neutral";

      // 4. Generate TTS audio for the translation
      let audioUrl: string | undefined;
      try {
        const ttsResult = await ttsMutation.mutateAsync({
          text: translatedText,
          language: targetLang.code,
        });
        audioUrl = ttsResult.audioUrl || undefined;
      } catch {
        // TTS is optional — continue without audio
      }

      // 5. Replace placeholder with real conversation entry
      const entry: ConversationEntry = {
        id: Date.now().toString(),
        speaker,
        original: spokenText,
        translated: translatedText,
        sentiment,
        timestamp: Date.now(),
        audioUrl,
        isTranslating: false,
      };

      setConversation((prev) => prev.map((e) => e.id === placeholderId ? entry : e));

      // 6. Auto-play the translated audio
      if (audioUrl) {
        try {
          await setAudioModeAsync({ playsInSilentMode: true });
          const player = createAudioPlayer(audioUrl);
          audioPlayerRef.current = player;
          player.play();
          setPlayingEntryId(entry.id);
          const checkInterval = setInterval(() => {
            if (!player.playing) {
              setPlayingEntryId(null);
              player.remove();
              audioPlayerRef.current = null;
              clearInterval(checkInterval);
            }
          }, 500);
        } catch {
          // Fallback to expo-speech
          Speech.speak(translatedText, {
            language: targetLang.code,
            rate: 0.9,
          });
        }
      }

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.warn("[Interpreter] Pipeline error:", err);
      setConversation((prev) => prev.filter((e) => e.id !== placeholderId));
      fallbackDemoEntry(speaker);
    } finally {
      setIsTranslating(false);
      setIsListening(false);
      setActiveSpeaker(null);
      pulseAnim.value = 1;
    }
  }, [stt, person1Lang, person2Lang, translateMutation, ttsMutation, humeVoice, sentimentEnabled, lastHumeSentiment, pulseAnim]);

  // Fallback demo entry when STT/translate is unavailable
  const fallbackDemoEntry = useCallback((speaker: "person1" | "person2") => {
    const sentiment = humeVoice.isConnected && sentimentEnabled
      ? lastHumeSentiment
      : ["neutral", "happy", "excited", "confused"][Math.floor(Math.random() * 4)];

    const demoEntries: Record<string, { original: string; translated: string }> = {
      person1: {
        original: "Hey, where's the best place to eat around here?",
        translated: "Oye, ¿cuál es el mejor lugar para comer por aquí?",
      },
      person2: {
        original: "¡Claro! Hay un sitio buenísimo en la esquina, te va a encantar.",
        translated: "Of course! There's an amazing spot on the corner, you'll love it.",
      },
    };

    const entry: ConversationEntry = {
      id: Date.now().toString(),
      speaker,
      original: demoEntries[speaker].original,
      translated: demoEntries[speaker].translated,
      sentiment,
      timestamp: Date.now(),
    };

    setConversation((prev) => [...prev, entry]);
    setIsListening(false);
    setActiveSpeaker(null);
    pulseAnim.value = 1;

    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [humeVoice, sentimentEnabled, lastHumeSentiment, pulseAnim]);

  const stopListening = useCallback(() => {
    // When user releases mic button, process the recording
    if (isListening && activeSpeaker) {
      stopAndProcess(activeSpeaker);
    } else {
      setIsListening(false);
      setActiveSpeaker(null);
      pulseAnim.value = 1;
    }
  }, [pulseAnim, isListening, activeSpeaker, stopAndProcess]);

  const swapLanguages = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const temp = person1Lang;
    setPerson1Lang(person2Lang);
    setPerson2Lang(temp);
  };

  const clearConversation = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConversation([]);
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // ─── Language Picker Modal ────────────────────────────────────────────────

  if (showLangPicker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pickerHeader}>
          <TouchableOpacity onPress={() => setShowLangPicker(null)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.pickerTitle}>
            {showLangPicker === "person1" ? "Your Language" : "Their Language"}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.pickerList}>
          {LANGUAGES.map((lang) => {
            const isSelected =
              showLangPicker === "person1"
                ? person1Lang.code === lang.code
                : person2Lang.code === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                onPress={() => {
                  if (showLangPicker === "person1") setPerson1Lang(lang);
                  else setPerson2Lang(lang);
                  setShowLangPicker(null);
                }}
              >
                <Text style={styles.pickerFlag}>{lang.flag}</Text>
                <Text style={[styles.pickerName, isSelected && styles.pickerNameActive]}>
                  {lang.name}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color="#6366F1" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Interpreter</Text>
          <Text style={styles.headerSub}>Real-time conversation translation</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity onPress={() => {
            const code = `LV-${Date.now().toString(36).toUpperCase()}`;
            setInviteCode(code);
            setShowInvite(true);
          }} style={styles.clearBtn}>
            <Ionicons name="person-add-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.clearBtn}>
            <Ionicons name="time-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={exportConversation} style={styles.clearBtn}>
            <Ionicons name="share-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearConversation} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Pair */}
      <View style={styles.langPair}>
        <TouchableOpacity style={styles.langBtn} onPress={() => setShowLangPicker("person1")}>
          <Text style={styles.langFlag}>{person1Lang.flag}</Text>
          <Text style={styles.langName}>{person1Lang.name}</Text>
          <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={swapLanguages} style={styles.swapBtn}>
          <Ionicons name="swap-horizontal" size={20} color="#6366F1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.langBtn} onPress={() => setShowLangPicker("person2")}>
          <Text style={styles.langFlag}>{person2Lang.flag}</Text>
          <Text style={styles.langName}>{person2Lang.name}</Text>
          <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Settings Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.settingsScroll} contentContainerStyle={styles.settingsRow}>
        <TouchableOpacity
          style={[styles.settingChip, autoDetect && styles.settingChipActive]}
          onPress={() => setAutoDetect(!autoDetect)}
        >
          <Ionicons name="ear" size={14} color={autoDetect ? "#6366F1" : "#9CA3AF"} />
          <Text style={[styles.settingChipText, autoDetect && styles.settingChipTextActive]}>
            Auto-detect speaker
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingChip, autoDetectLang && styles.settingChipActive]}
          onPress={() => setAutoDetectLang(!autoDetectLang)}
        >
          <Ionicons name="language" size={14} color={autoDetectLang ? "#6366F1" : "#9CA3AF"} />
          <Text style={[styles.settingChipText, autoDetectLang && styles.settingChipTextActive]}>
            Auto-detect language
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingChip, sentimentEnabled && styles.settingChipActive]}
          onPress={() => setSentimentEnabled(!sentimentEnabled)}
        >
          <Ionicons name="heart" size={14} color={sentimentEnabled ? "#6366F1" : "#9CA3AF"} />
          <Text style={[styles.settingChipText, sentimentEnabled && styles.settingChipTextActive]}>
            Sentiment
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingChip, useMyVoice && styles.settingChipActive]}
          onPress={() => {
            if (!voiceTrained) {
              router.push("/voice-clone-training");
            } else {
              setUseMyVoice(!useMyVoice);
            }
          }}
        >
          <Ionicons name="mic" size={14} color={useMyVoice ? "#6366F1" : "#9CA3AF"} />
          <Text style={[styles.settingChipText, useMyVoice && styles.settingChipTextActive]}>
            My Voice
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingChip, continuousMode && styles.settingChipActive]}
          onPress={() => {
            if (continuousActive) stopContinuousMode();
            setContinuousMode(!continuousMode);
          }}
        >
          <Ionicons name="infinite" size={14} color={continuousMode ? "#6366F1" : "#9CA3AF"} />
          <Text style={[styles.settingChipText, continuousMode && styles.settingChipTextActive]}>
            Continuous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingChip, showTranscript && styles.settingChipActive]}
          onPress={() => setShowTranscript(!showTranscript)}
        >
          <Ionicons name="document-text" size={14} color={showTranscript ? "#6366F1" : "#9CA3AF"} />
          <Text style={[styles.settingChipText, showTranscript && styles.settingChipTextActive]}>
            Transcript
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Detection Banner */}
      {autoDetectLang && (detectedLangInfo.person1 || detectedLangInfo.person2) && (
        <View style={styles.langDetectBanner}>
          <Ionicons name="language" size={16} color="#34D399" />
          <View style={{ flex: 1 }}>
            {detectedLangInfo.person1 && (
              <Text style={styles.langDetectText}>
                You: {detectedLangInfo.person1.language}
                {detectedLangInfo.person1.dialect ? ` (${detectedLangInfo.person1.dialect})` : ""}
                {" "}<Text style={styles.langDetectConfidence}>{detectedLangInfo.person1.confidence}% sure</Text>
              </Text>
            )}
            {detectedLangInfo.person2 && (
              <Text style={styles.langDetectText}>
                Them: {detectedLangInfo.person2.language}
                {detectedLangInfo.person2.dialect ? ` (${detectedLangInfo.person2.dialect})` : ""}
                {" "}<Text style={styles.langDetectConfidence}>{detectedLangInfo.person2.confidence}% sure</Text>
              </Text>
            )}
          </View>
          {isDetectingLang && <Ionicons name="sync" size={14} color="#34D399" />}
        </View>
      )}

      {/* Voice Info Banner */}
      {!voiceTrained && matchedVoice && (
        <View style={styles.voiceInfoBanner}>
          <Ionicons name="information-circle" size={16} color="#60A5FA" />
          <Text style={styles.voiceInfoText}>
            Using "{matchedVoice.name}" ({matchedVoice.gender}, {matchedVoice.pitchRange} pitch).{" "}
            <Text
              style={styles.voiceInfoLink}
              onPress={() => router.push("/voice-clone-training")}
            >
              Train your voice
            </Text>{" "}
            for a personalized experience.
          </Text>
        </View>
      )}

      {/* Voice Quality Indicator */}
      {voiceTrained && voiceQuality && (
        <TouchableOpacity
          style={styles.voiceQualityBanner}
          onPress={() => setShowVoiceQuality(!showVoiceQuality)}
        >
          <View style={styles.voiceQualityRow}>
            <Ionicons name="shield-checkmark" size={16} color={voiceQuality.overall >= 80 ? "#34D399" : voiceQuality.overall >= 60 ? "#FBBF24" : "#F87171"} />
            <Text style={styles.voiceQualityLabel}>Voice Clone Quality</Text>
            <View style={styles.voiceQualityScoreBadge}>
              <Text style={styles.voiceQualityScore}>{voiceQuality.overall}%</Text>
            </View>
            <Ionicons name={showVoiceQuality ? "chevron-up" : "chevron-down"} size={14} color="#9CA3AF" />
          </View>
          {showVoiceQuality && (
            <View style={styles.voiceQualityDetails}>
              <View style={styles.voiceQualityMetric}>
                <Text style={styles.voiceQualityMetricLabel}>Clarity</Text>
                <View style={styles.voiceQualityBar}>
                  <View style={[styles.voiceQualityBarFill, { width: `${voiceQuality.clarity}%`, backgroundColor: "#60A5FA" }]} />
                </View>
                <Text style={styles.voiceQualityMetricValue}>{voiceQuality.clarity}%</Text>
              </View>
              <View style={styles.voiceQualityMetric}>
                <Text style={styles.voiceQualityMetricLabel}>Consistency</Text>
                <View style={styles.voiceQualityBar}>
                  <View style={[styles.voiceQualityBarFill, { width: `${voiceQuality.consistency}%`, backgroundColor: "#A78BFA" }]} />
                </View>
                <Text style={styles.voiceQualityMetricValue}>{voiceQuality.consistency}%</Text>
              </View>
              <View style={styles.voiceQualityMetric}>
                <Text style={styles.voiceQualityMetricLabel}>Background</Text>
                <View style={styles.voiceQualityBar}>
                  <View style={[styles.voiceQualityBarFill, { width: `${voiceQuality.background}%`, backgroundColor: "#34D399" }]} />
                </View>
                <Text style={styles.voiceQualityMetricValue}>{voiceQuality.background}%</Text>
              </View>
              {voiceQuality.tips && voiceQuality.tips.length > 0 && (
                <View style={styles.voiceQualityTips}>
                  <Text style={styles.voiceQualityTipsTitle}>Tips to improve:</Text>
                  {voiceQuality.tips.map((tip, i) => (
                    <Text key={i} style={styles.voiceQualityTip}>• {tip}</Text>
                  ))}
                </View>
              )}
              <TouchableOpacity
                style={styles.retrainBtn}
                onPress={() => router.push("/voice-clone-training")}
              >
                <Ionicons name="refresh" size={14} color="#6366F1" />
                <Text style={styles.retrainBtnText}>Re-train Voice</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Real-time Transcript Overlay */}
      {showTranscript && (isListening || continuousActive) && liveTranscript.length > 0 && (
        <View style={styles.transcriptOverlay}>
          <View style={styles.transcriptHeader}>
            <View style={styles.transcriptLive}>
              <View style={styles.transcriptLiveDot} />
              <Text style={styles.transcriptLiveText}>LIVE</Text>
            </View>
            <TouchableOpacity onPress={() => setLiveTranscript("")}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.transcriptText}>{liveTranscript}</Text>
        </View>
      )}

      {/* Conversation Feed */}
      <ScrollView style={styles.conversationFeed} contentContainerStyle={{ paddingBottom: 20 }}>
        {conversation.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color="#4B5563" />
            </View>
            <Text style={styles.emptyTitle}>Start a conversation</Text>
            <Text style={styles.emptyDesc}>
              Tap and hold one of the microphone buttons below.{"\n"}
              Speak naturally — the interpreter will translate{"\n"}
              in real-time and detect sentiment.
            </Text>
            <View style={styles.pipelineInfo}>
              <View style={styles.pipelineStep}>
                <Ionicons name="mic" size={16} color="#6366F1" />
                <Text style={styles.pipelineText}>Listen</Text>
              </View>
              <Ionicons name="arrow-forward" size={12} color="#4B5563" />
              <View style={styles.pipelineStep}>
                <Ionicons name="heart" size={16} color="#F472B6" />
                <Text style={styles.pipelineText}>Sentiment</Text>
              </View>
              <Ionicons name="arrow-forward" size={12} color="#4B5563" />
              <View style={styles.pipelineStep}>
                <Ionicons name="language" size={16} color="#34D399" />
                <Text style={styles.pipelineText}>Translate</Text>
              </View>
              <Ionicons name="arrow-forward" size={12} color="#4B5563" />
              <View style={styles.pipelineStep}>
                <Ionicons name="volume-high" size={16} color="#FBBF24" />
                <Text style={styles.pipelineText}>Speak</Text>
              </View>
            </View>
          </View>
        )}

        {conversation.map((entry) => (
          <View
            key={entry.id}
            style={[
              styles.bubble,
              entry.speaker === "person1" ? styles.bubbleLeft : styles.bubbleRight,
              entry.isTranslating && styles.bubbleTranslating,
            ]}
          >
            {entry.isTranslating ? (
              <View style={styles.translatingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.translatingText}>Translating...</Text>
                <View style={styles.translatingPipeline}>
                  <Ionicons name="mic" size={12} color="#6366F1" />
                  <Ionicons name="arrow-forward" size={10} color="#4B5563" />
                  <Ionicons name="language" size={12} color="#34D399" />
                  <Ionicons name="arrow-forward" size={10} color="#4B5563" />
                  <Ionicons name="volume-high" size={12} color="#FBBF24" />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.bubbleHeader}>
                  <Text style={styles.bubbleSpeaker}>
                    {entry.speaker === "person1" ? person1Lang.flag : person2Lang.flag}{" "}
                    {entry.speaker === "person1" ? "You" : "Them"}
                  </Text>
                  {sentimentEnabled && (
                    <View style={[styles.sentimentBadge, { backgroundColor: `${SENTIMENT_COLORS[entry.sentiment]}20` }]}>
                      <View style={[styles.sentimentDot, { backgroundColor: SENTIMENT_COLORS[entry.sentiment] }]} />
                      <Text style={[styles.sentimentText, { color: SENTIMENT_COLORS[entry.sentiment] }]}>
                        {entry.sentiment}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.bubbleOriginal}>{entry.original}</Text>
                <View style={styles.bubbleDivider} />
                <View style={styles.bubbleTranslatedRow}>
                  <Text style={[styles.bubbleTranslated, { flex: 1 }]}>{entry.translated}</Text>
                  <TouchableOpacity
                    style={styles.playEntryBtn}
                    onPress={() => playEntryAudio(entry)}
                  >
                    <Ionicons
                      name={playingEntryId === entry.id ? "stop" : "play"}
                      size={14}
                      color="#6366F1"
                    />
                  </TouchableOpacity>
                </View>
                {useMyVoice && voiceTrained && (
                  <View style={styles.voiceCloneBadge}>
                    <Ionicons name="person" size={10} color="#A78BFA" />
                    <Text style={styles.voiceCloneBadgeText}>Your voice</Text>
                  </View>
                )}
              </>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Continuous Mode Button */}
      {continuousMode && (
        <View style={styles.continuousRow}>
          <TouchableOpacity
            style={[styles.continuousBtn, continuousActive && styles.continuousBtnActive]}
            onPress={continuousActive ? stopContinuousMode : startContinuousMode}
            disabled={realtimeTranslator.isConnecting}
          >
            {realtimeTranslator.isConnecting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={continuousActive ? "stop-circle" : "infinite"}
                size={24}
                color="#FFFFFF"
              />
            )}
            <Text style={styles.continuousBtnText}>
              {realtimeTranslator.isConnecting
                ? "Connecting..."
                : continuousActive
                  ? "Stop Listening"
                  : "Start Continuous Mode"}
            </Text>
          </TouchableOpacity>
          {continuousActive && (
            <View style={styles.continuousInfo}>
              <View style={styles.continuousInfoRow}>
                <View style={styles.realtimeDot} />
                <Text style={styles.continuousHint}>
                  {realtimeTranslator.isActive
                    ? `Live speech-to-speech • ${realtimeTranslator.formattedDuration}`
                    : "Auto-detecting speakers... Tap stop when done."}
                </Text>
              </View>
              {useMyVoice && voiceTrained && (
                <View style={styles.continuousInfoRow}>
                  <Ionicons name="person" size={12} color="#A78BFA" />
                  <Text style={styles.continuousVoiceHint}>Using your cloned voice</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Mic Buttons */}
      {!continuousActive && (
      <View style={styles.micRow}>
        {/* Person 1 (You) */}
        <View style={styles.micSection}>
          <Text style={styles.micLabel}>{person1Lang.flag} You</Text>
          <Animated.View style={[activeSpeaker === "person1" && pulseStyle]}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                activeSpeaker === "person1" && styles.micBtnActive,
              ]}
              onPressIn={() => startListening("person1")}
              onPressOut={() => stopListening()}
              disabled={isListening && activeSpeaker !== "person1"}
            >
              <Ionicons
                name={activeSpeaker === "person1" ? "radio" : "mic"}
                size={28}
                color={activeSpeaker === "person1" ? "#FFFFFF" : "#6366F1"}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Divider */}
        <View style={styles.micDivider}>
          <View style={styles.micDividerLine} />
          <Text style={styles.micDividerText}>OR</Text>
          <View style={styles.micDividerLine} />
        </View>

        {/* Person 2 (Them) */}
        <View style={styles.micSection}>
          <Text style={styles.micLabel}>{person2Lang.flag} Them</Text>
          <Animated.View style={[activeSpeaker === "person2" && pulseStyle]}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                styles.micBtnAlt,
                activeSpeaker === "person2" && styles.micBtnAltActive,
              ]}
              onPressIn={() => startListening("person2")}
              onPressOut={() => stopListening()}
              disabled={isListening && activeSpeaker !== "person2"}
            >
              <Ionicons
                name={activeSpeaker === "person2" ? "radio" : "mic"}
                size={28}
                color={activeSpeaker === "person2" ? "#FFFFFF" : "#34D399"}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
      )}

      {/* Session History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.historyOverlay}>
          <SafeAreaView style={styles.historyContainer}>
            {/* History Header */}
            <View style={styles.historyHeader}>
              <TouchableOpacity onPress={() => { setShowHistory(false); setSelectedSession(null); }}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.historyTitle}>
                {selectedSession ? "Session Details" : "Session History"}
              </Text>
              {!selectedSession && sessionHistory.length > 0 ? (
                <TouchableOpacity onPress={clearAllSessions}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 24 }} />
              )}
            </View>

            {selectedSession ? (
              /* Selected session detail view */
              <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.sessionDetailHeader}>
                  <Text style={styles.sessionDetailLangs}>
                    {selectedSession.person1Lang} ↔ {selectedSession.person2Lang}
                  </Text>
                  <Text style={styles.sessionDetailDate}>
                    {new Date(selectedSession.date).toLocaleDateString()} • {Math.floor(selectedSession.duration / 60)}m {selectedSession.duration % 60}s
                  </Text>
                </View>
                {selectedSession.entries.map((entry) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.bubble,
                      entry.speaker === "person1" ? styles.bubbleLeft : styles.bubbleRight,
                    ]}
                  >
                    <View style={styles.bubbleHeader}>
                      <Text style={styles.bubbleSpeaker}>
                        {entry.speaker === "person1" ? "You" : "Them"}
                      </Text>
                      {entry.sentiment && (
                        <View style={[styles.sentimentBadge, { backgroundColor: `${SENTIMENT_COLORS[entry.sentiment] || "#9CA3AF"}20` }]}>
                          <View style={[styles.sentimentDot, { backgroundColor: SENTIMENT_COLORS[entry.sentiment] || "#9CA3AF" }]} />
                          <Text style={[styles.sentimentText, { color: SENTIMENT_COLORS[entry.sentiment] || "#9CA3AF" }]}>
                            {entry.sentiment}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.bubbleOriginal}>{entry.original}</Text>
                    <View style={styles.bubbleDivider} />
                    <View style={styles.bubbleTranslatedRow}>
                      <Text style={[styles.bubbleTranslated, { flex: 1 }]}>{entry.translated}</Text>
                      <TouchableOpacity
                        style={styles.playEntryBtn}
                        onPress={() => playEntryAudio(entry)}
                      >
                        <Ionicons
                          name={playingEntryId === entry.id ? "stop-circle" : "volume-high"}
                          size={18}
                          color={playingEntryId === entry.id ? "#EF4444" : "#6366F1"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {/* Session Detail Actions */}
                <View style={styles.sessionDetailActions}>
                  <TouchableOpacity
                    style={styles.sessionActionBtn}
                    onPress={() => selectedSession && exportSession(selectedSession)}
                  >
                    <Ionicons name="share-outline" size={18} color="#6366F1" />
                    <Text style={styles.sessionActionText}>Export</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sessionActionBtn, styles.sessionActionBtnDanger]}
                    onPress={() => {
                      if (selectedSession) {
                        confirmDeleteSession(selectedSession.id);
                        setSelectedSession(null);
                      }
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.sessionActionText, { color: "#EF4444" }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.backToListBtn}
                  onPress={() => setSelectedSession(null)}
                >
                  <Ionicons name="arrow-back" size={16} color="#6366F1" />
                  <Text style={styles.backToListText}>Back to sessions</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              /* Session list view */
              <View style={{ flex: 1 }}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color="#6B7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by language or keyword..."
                  placeholderTextColor="#4B5563"
                  value={historySearch}
                  onChangeText={setHistorySearch}
                  returnKeyType="search"
                />
                {historySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setHistorySearch("")}>
                    <Ionicons name="close-circle" size={16} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
              <FlatList
                data={filteredHistory}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={48} color="#4B5563" />
                    <Text style={styles.emptyTitle}>No sessions yet</Text>
                    <Text style={styles.emptyDesc}>
                      Your interpreter sessions will appear here.{"\n"}
                      Use Continuous Mode to auto-save sessions.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.sessionCard}>
                    <TouchableOpacity onPress={() => setSelectedSession(item)} style={{ flex: 1 }}>
                      <View style={styles.sessionCardTop}>
                        <Text style={styles.sessionLangs}>
                          {item.person1Lang} ↔ {item.person2Lang}
                        </Text>
                        <Text style={styles.sessionDate}>
                          {new Date(item.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.sessionCardBottom}>
                        <Text style={styles.sessionMeta}>
                          {item.entries.length} messages • {Math.floor(item.duration / 60)}m {item.duration % 60}s
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#4B5563" />
                      </View>
                      {item.entries.length > 0 && (
                        <Text style={styles.sessionPreview} numberOfLines={1}>
                          {item.entries[0].original}
                        </Text>
                      )}
                    </TouchableOpacity>
                    {/* Session card actions */}
                    <View style={styles.sessionCardActions}>
                      <TouchableOpacity
                        style={styles.sessionCardActionBtn}
                        onPress={() => exportSession(item)}
                      >
                        <Ionicons name="share-outline" size={16} color="#6366F1" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.sessionCardActionBtn}
                        onPress={() => confirmDeleteSession(item.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Hume connection status */}
      {sentimentEnabled && (
        <View style={styles.humeStatus}>
          <View style={[styles.humeStatusDot, { backgroundColor: humeVoice.isConnected ? "#34D399" : humeVoice.isConnecting ? "#FBBF24" : "#EF4444" }]} />
          <Text style={styles.humeStatusText}>
            {humeVoice.isConnected ? "Hume AI Connected" : humeVoice.isConnecting ? "Connecting..." : "Hume Offline"}
          </Text>
          {humeVoice.dominantEmotion !== "neutral" && humeVoice.isConnected && (
            <Text style={styles.humeEmotionText}>• {humeVoice.dominantEmotion}</Text>
          )}
        </View>
      )}

      {/* Invite Modal */}
      <Modal visible={showInvite} animationType="slide" transparent>
        <View style={styles.historyOverlay}>
          <SafeAreaView style={[styles.historyContainer, { maxHeight: "60%" }]}>
            <View style={styles.historyHeader}>
              <TouchableOpacity onPress={() => setShowInvite(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.historyTitle}>Invite to Session</Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={{ padding: 24, alignItems: "center", gap: 20 }}>
              <View style={styles.inviteCodeBox}>
                <Text style={styles.inviteCodeLabel}>Session Code</Text>
                <Text style={styles.inviteCodeValue}>{inviteCode}</Text>
              </View>
              <Text style={styles.inviteDesc}>
                Share this code with the other person. When they join, both of your trained voices will be used for bidirectional translation.
              </Text>
              <View style={styles.inviteFeatures}>
                <View style={styles.inviteFeatureRow}>
                  <Ionicons name="mic" size={16} color="#A78BFA" />
                  <Text style={styles.inviteFeatureText}>Both voices used in translation</Text>
                </View>
                <View style={styles.inviteFeatureRow}>
                  <Ionicons name="language" size={16} color="#34D399" />
                  <Text style={styles.inviteFeatureText}>Auto-detect each person's language</Text>
                </View>
                <View style={styles.inviteFeatureRow}>
                  <Ionicons name="heart" size={16} color="#F472B6" />
                  <Text style={styles.inviteFeatureText}>Shared sentiment analysis</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.inviteShareBtn}
                onPress={async () => {
                  const message = `Join my LinguaVibe interpreter session!\nCode: ${inviteCode}\n\nBoth our trained voices will be used for real-time translation.`;
                  if (Platform.OS !== "web" && await Sharing.isAvailableAsync()) {
                    const tmpFile = `${FileSystem.cacheDirectory}invite.txt`;
                    await FileSystem.writeAsStringAsync(tmpFile, message);
                    await Sharing.shareAsync(tmpFile);
                  } else {
                    Alert.alert("Invite Code", message);
                  }
                }}
              >
                <Ionicons name="share-social" size={18} color="#FFFFFF" />
                <Text style={styles.inviteShareBtnText}>Share Invite</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Info footer */}
      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={12} color="#4B5563" />
        <Text style={styles.footerText}>
          Powered by Hume AI (sentiment) + ConnectWorld LLM (slang & dialect aware)
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060912",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSub: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },
  clearBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  langPair: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  langBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1D23",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#2A2D35",
  },
  langFlag: {
    fontSize: 18,
  },
  langName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsScroll: {
    maxHeight: 44,
    marginBottom: 8,
  },
  settingsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
  },
  settingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1A1D23",
    borderWidth: 1,
    borderColor: "#2A2D35",
  },
  settingChipActive: {
    borderColor: "rgba(99, 102, 241, 0.4)",
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  settingChipText: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
  },
  settingChipTextActive: {
    color: "#6366F1",
  },
  conversationFeed: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A1D23",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyDesc: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  pipelineInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A1D23",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pipelineStep: {
    alignItems: "center",
    gap: 2,
  },
  pipelineText: {
    color: "#9CA3AF",
    fontSize: 9,
    fontWeight: "500",
  },
  bubble: {
    backgroundColor: "#1A1D23",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    maxWidth: "85%",
    borderWidth: 1,
    borderColor: "#2A2D35",
  },
  bubbleLeft: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
    backgroundColor: "#1E1B2E",
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  bubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  bubbleSpeaker: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
  },
  sentimentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sentimentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sentimentText: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  bubbleOriginal: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleDivider: {
    height: 1,
    backgroundColor: "#2A2D35",
    marginVertical: 8,
  },
  bubbleTranslated: {
    color: "#A5B4FC",
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },
  micRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  micSection: {
    alignItems: "center",
    gap: 8,
  },
  micLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    borderWidth: 2,
    borderColor: "rgba(99, 102, 241, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  micBtnAlt: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  micBtnAltActive: {
    backgroundColor: "#34D399",
    borderColor: "#34D399",
  },
  micDivider: {
    alignItems: "center",
    gap: 4,
  },
  micDividerLine: {
    width: 1,
    height: 16,
    backgroundColor: "#2A2D35",
  },
  micDividerText: {
    color: "#4B5563",
    fontSize: 9,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingBottom: 8,
  },
  footerText: {
    color: "#4B5563",
    fontSize: 10,
  },
  // Language Picker
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1D23",
  },
  pickerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
    marginBottom: 2,
  },
  pickerItemActive: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  pickerFlag: {
    fontSize: 22,
  },
  pickerName: {
    color: "#FFFFFF",
    fontSize: 15,
    flex: 1,
  },
  pickerNameActive: {
    color: "#6366F1",
    fontWeight: "600",
  },
  voiceInfoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(96, 165, 250, 0.08)",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.15)",
  },
  voiceInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 17,
  },
  voiceInfoLink: {
    color: "#60A5FA",
    fontWeight: "600",
  },
  // Language Detection Banner
  langDetectBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(52, 211, 153, 0.08)",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.15)",
  },
  langDetectText: {
    fontSize: 12,
    color: "#D1D5DB",
    lineHeight: 17,
  },
  langDetectConfidence: {
    fontSize: 11,
    color: "#34D399",
    fontWeight: "600",
  },
  // Continuous Mode
  continuousRow: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  continuousBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.4)",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: "100%",
  },
  continuousBtnActive: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  continuousBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  continuousHint: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
  },
  // History Modal
  historyOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  historyContainer: {
    flex: 1,
    backgroundColor: "#060912",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1D23",
  },
  historyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sessionCard: {
    backgroundColor: "#1A1D23",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2D35",
  },
  sessionCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sessionCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionLangs: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  sessionDate: {
    color: "#6B7280",
    fontSize: 11,
  },
  sessionMeta: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  sessionPreview: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
  sessionDetailHeader: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  sessionDetailLangs: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sessionDetailDate: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  backToListBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    marginTop: 8,
  },
  backToListText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: "500",
  },
  // Clear All button
  clearAllText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
  // Session detail actions
  sessionDetailActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1A1D23",
  },
  sessionActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  sessionActionBtnDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  sessionActionText: {
    color: "#6366F1",
    fontSize: 13,
    fontWeight: "500",
  },
  // Session card actions row
  sessionCardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#2A2D35",
  },
  sessionCardActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  // Hume status bar
  humeStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  humeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  humeStatusText: {
    color: "#6B7280",
    fontSize: 11,
  },
  humeEmotionText: {
    color: "#9CA3AF",
    fontSize: 11,
    fontStyle: "italic",
  },
  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1D23",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2A2D35",
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    paddingVertical: 0,
  },
  // Play button in bubbles
  bubbleTranslatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playEntryBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  // Translating loading indicator
  bubbleTranslating: {
    borderColor: "rgba(99, 102, 241, 0.3)",
    borderStyle: "dashed" as any,
  },
  translatingContainer: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  translatingText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  translatingPipeline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  // Voice clone badge
  voiceCloneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(167, 139, 250, 0.1)",
    alignSelf: "flex-start",
  },
  voiceCloneBadgeText: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "500",
  },
  // Continuous mode realtime info
  continuousInfo: {
    gap: 4,
    marginTop: 4,
  },
  continuousInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  realtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  continuousVoiceHint: {
    color: "#A78BFA",
    fontSize: 11,
  },
  // Voice Quality Indicator
  voiceQualityBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#1A1D25",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A2D35",
  },
  voiceQualityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceQualityLabel: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  voiceQualityScoreBadge: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  voiceQualityScore: {
    color: "#34D399",
    fontSize: 12,
    fontWeight: "700",
  },
  voiceQualityDetails: {
    marginTop: 12,
    gap: 10,
  },
  voiceQualityMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceQualityMetricLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    width: 80,
  },
  voiceQualityBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#2A2D35",
    borderRadius: 3,
    overflow: "hidden",
  },
  voiceQualityBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  voiceQualityMetricValue: {
    color: "#D1D5DB",
    fontSize: 11,
    width: 32,
    textAlign: "right",
  },
  voiceQualityTips: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#2A2D35",
  },
  voiceQualityTipsTitle: {
    color: "#FBBF24",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  voiceQualityTip: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },
  retrainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 8,
  },
  retrainBtnText: {
    color: "#6366F1",
    fontSize: 12,
    fontWeight: "600",
  },
  // Transcript Overlay
  transcriptOverlay: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  transcriptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  transcriptLive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  transcriptLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  transcriptLiveText: {
    color: "#EF4444",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  transcriptText: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
  },
  // Invite Modal
  inviteCodeBox: {
    backgroundColor: "#1A1D25",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6366F1",
    borderStyle: "dashed",
    width: "100%",
  },
  inviteCodeLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  inviteCodeValue: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 2,
  },
  inviteDesc: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  inviteFeatures: {
    width: "100%",
    gap: 10,
  },
  inviteFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inviteFeatureText: {
    color: "#D1D5DB",
    fontSize: 13,
  },
  inviteShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
  },
  inviteShareBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
