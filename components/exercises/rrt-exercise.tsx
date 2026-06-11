import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { vanillaClient } from "@/lib/trpc";

export interface RRTPhrase {
  /** The phrase in the target language */
  phrase: string;
  /** English translation */
  translation: string;
  /** Pronunciation guide */
  pronunciation: string;
  /** Rocky-style encouragement after completing this phrase */
  encouragement: string;
}

/** Pre-generated audio clips keyed by speed level */
export interface RRTAudioClips {
  [phrase: string]: {
    slow?: { audioUrl: string; durationEstimate: number };
    normal?: { audioUrl: string; durationEstimate: number };
    fast?: { audioUrl: string; durationEstimate: number };
    native?: { audioUrl: string; durationEstimate: number };
  };
}

interface Props {
  title: string;
  scenario: string;
  phrases: RRTPhrase[];
  /** Language code for TTS (e.g., "es", "pt-BR") */
  ttsLanguage?: string;
  /** Pre-generated audio clips from server (optional - falls back to device TTS) */
  audioClips?: RRTAudioClips;
  /** Whether to attempt server audio generation on mount */
  useServerAudio?: boolean;
  /** Language name for server audio generation (e.g., "spanish", "portuguese") */
  serverLanguage?: string;
  onComplete: (correct: number, total: number) => void;
}

type SpeedLevel = "slow" | "normal" | "fast";

const SPEED_CONFIG: Record<SpeedLevel, { rate: number; label: string; bpm: number }> = {
  slow: { rate: 0.6, label: "Slow (0.6x)", bpm: 60 },
  normal: { rate: 1.0, label: "Natural (1.0x)", bpm: 90 },
  fast: { rate: 1.3, label: "Fast (1.3x)", bpm: 120 },
};

const SPEEDS: SpeedLevel[] = ["slow", "normal", "fast"];
const REPS_PER_SPEED = 3;

export function RRTExercise({
  title,
  scenario,
  phrases,
  ttsLanguage = "es",
  audioClips: initialAudioClips,
  useServerAudio = true,
  serverLanguage,
  onComplete,
}: Props) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentSpeedIndex, setCurrentSpeedIndex] = useState(0);
  const [currentRep, setCurrentRep] = useState(0);
  const [phase, setPhase] = useState<"listen" | "repeat" | "feedback">("listen");
  const [completedPhrases, setCompletedPhrases] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState("");
  const [exerciseComplete, setExerciseComplete] = useState(false);
  const [audioClips, setAudioClips] = useState<RRTAudioClips>(initialAudioClips || {});
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioMode, setAudioMode] = useState<"server" | "device">(initialAudioClips ? "server" : "device");

  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation values
  const pulseScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const beatOpacity = useSharedValue(0.3);

  const currentPhrase = phrases[currentPhraseIndex];
  const currentSpeed = SPEEDS[currentSpeedIndex];
  const speedConfig = SPEED_CONFIG[currentSpeed];

  // Enable silent mode audio on mount
  useEffect(() => {
    if (Platform.OS !== "web") {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
  }, []);

  // Pre-generate server audio on mount if enabled
  useEffect(() => {
    if (!useServerAudio || initialAudioClips || phrases.length === 0) return;

    const lang = serverLanguage || inferServerLanguage(ttsLanguage);
    setIsLoadingAudio(true);

    vanillaClient.rrtAudio.batchGenerateAudio.mutate({
      phrases: phrases.map((p) => ({ phrase: p.phrase, translation: p.translation })),
      language: lang,
      speeds: ["slow", "normal", "fast"],
    })
      .then((result) => {
        const clips: RRTAudioClips = {};
        for (const phraseResult of result.phrases) {
          clips[phraseResult.phrase] = phraseResult.clips as any;
        }
        setAudioClips(clips);
        setAudioMode("server");
        setIsLoadingAudio(false);
      })
      .catch((err) => {
        console.warn("[RRT] Server audio generation failed, using device TTS:", err);
        setAudioMode("device");
        setIsLoadingAudio(false);
      });
  }, [useServerAudio, initialAudioClips, phrases.length]);

  // Cleanup audio player on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        try {
          audioPlayerRef.current.pause();
          audioPlayerRef.current.remove();
        } catch {}
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Pulse animation for rhythm indicator
  useEffect(() => {
    if (phase === "listen" || phase === "repeat") {
      const interval = 60000 / speedConfig.bpm; // ms per beat
      beatOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: interval * 0.2, easing: Easing.out(Easing.ease) }),
          withTiming(0.3, { duration: interval * 0.8, easing: Easing.in(Easing.ease) })
        ),
        -1
      );
    } else {
      cancelAnimation(beatOpacity);
      beatOpacity.value = 0.3;
    }
  }, [phase, speedConfig.bpm]);

  // Update progress bar
  useEffect(() => {
    const totalSteps = phrases.length * SPEEDS.length * REPS_PER_SPEED;
    const currentStep =
      currentPhraseIndex * SPEEDS.length * REPS_PER_SPEED +
      currentSpeedIndex * REPS_PER_SPEED +
      currentRep;
    progressWidth.value = withTiming((currentStep / totalSteps) * 100, { duration: 300 });
  }, [currentPhraseIndex, currentSpeedIndex, currentRep]);

  // Play audio from server URL
  const playServerAudio = useCallback((url: string, durationEstimate: number): Promise<void> => {
    return new Promise((resolve) => {
      // Clean up previous player
      if (audioPlayerRef.current) {
        try {
          audioPlayerRef.current.pause();
          audioPlayerRef.current.remove();
        } catch {}
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      try {
        const player = createAudioPlayer(url);
        audioPlayerRef.current = player;
        player.play();

        // Poll for completion
        checkIntervalRef.current = setInterval(() => {
          try {
            if (!player.playing) {
              clearInterval(checkIntervalRef.current!);
              checkIntervalRef.current = null;
              player.remove();
              audioPlayerRef.current = null;
              resolve();
            }
          } catch {
            clearInterval(checkIntervalRef.current!);
            checkIntervalRef.current = null;
            resolve();
          }
        }, 200);

        // Safety timeout based on duration estimate + buffer
        const timeout = Math.max(5000, (durationEstimate + 2) * 1000);
        setTimeout(() => {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
          try {
            player.pause();
            player.remove();
          } catch {}
          audioPlayerRef.current = null;
          resolve();
        }, timeout);
      } catch (err) {
        console.warn("[RRT] Server audio playback failed:", err);
        resolve(); // Resolve so caller can fall back
      }
    });
  }, []);

  // Play audio using device TTS
  const playDeviceTTS = useCallback((text: string, rate: number): Promise<void> => {
    return new Promise((resolve) => {
      Speech.speak(text, {
        language: ttsLanguage,
        rate,
        onDone: () => resolve(),
        onError: () => resolve(),
        onStopped: () => resolve(),
      });
    });
  }, [ttsLanguage]);

  const speakPhrase = useCallback(async () => {
    if (!currentPhrase) return;
    setIsPlaying(true);

    // Try server audio first
    const phraseClips = audioClips[currentPhrase.phrase];
    const clip = phraseClips?.[currentSpeed];

    if (audioMode === "server" && clip?.audioUrl) {
      await playServerAudio(clip.audioUrl, clip.durationEstimate);
    } else {
      // Fallback to device TTS
      await playDeviceTTS(currentPhrase.phrase, speedConfig.rate);
    }

    setIsPlaying(false);
    setPhase("repeat");
  }, [currentPhrase, currentSpeed, audioClips, audioMode, playServerAudio, playDeviceTTS, speedConfig.rate]);

  const handleListen = () => {
    if (isPlaying) return;
    setPhase("listen");
    speakPhrase();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRepeatDone = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("feedback");

    // Advance to next rep/speed/phrase
    const nextRep = currentRep + 1;
    if (nextRep < REPS_PER_SPEED) {
      // More reps at this speed
      setShowEncouragement(getEncouragement(currentSpeed));
      setTimeout(() => {
        setCurrentRep(nextRep);
        setPhase("listen");
        setShowEncouragement("");
        // Auto-play next rep
        setTimeout(() => speakPhrase(), 400);
      }, 1200);
    } else {
      // Move to next speed
      const nextSpeedIndex = currentSpeedIndex + 1;
      if (nextSpeedIndex < SPEEDS.length) {
        setShowEncouragement(`Speed up! ${SPEED_CONFIG[SPEEDS[nextSpeedIndex]].label}`);
        setTimeout(() => {
          setCurrentSpeedIndex(nextSpeedIndex);
          setCurrentRep(0);
          setPhase("listen");
          setShowEncouragement("");
          setTimeout(() => speakPhrase(), 600);
        }, 1500);
      } else {
        // Phrase complete - move to next phrase
        setShowEncouragement(currentPhrase?.encouragement || "Perfect! Next phrase!");
        setCompletedPhrases((c) => c + 1);
        const nextPhraseIndex = currentPhraseIndex + 1;
        if (nextPhraseIndex < phrases.length) {
          setTimeout(() => {
            setCurrentPhraseIndex(nextPhraseIndex);
            setCurrentSpeedIndex(0);
            setCurrentRep(0);
            setPhase("listen");
            setShowEncouragement("");
          }, 2000);
        } else {
          // All phrases complete!
          setExerciseComplete(true);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => onComplete(phrases.length, phrases.length), 2000);
        }
      }
    }
  };

  const beatAnimStyle = useAnimatedStyle(() => ({
    opacity: beatOpacity.value,
    transform: [{ scale: 0.8 + beatOpacity.value * 0.2 }],
  }));

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (isLoadingAudio) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Generating native speaker audio...</Text>
          <Text style={styles.loadingSubtext}>
            Creating clips at 3 speeds for {phrases.length} phrases
          </Text>
        </View>
      </View>
    );
  }

  if (exerciseComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text style={styles.completeTitle}>RRT Complete!</Text>
          <Text style={styles.completeSubtitle}>
            You mastered {phrases.length} phrases at all 3 speeds
          </Text>
          <Text style={styles.completeEncouragement}>
            Rocky says: "You crushed it! Your muscle memory is building!"
          </Text>
          {audioMode === "server" && (
            <View style={styles.audioBadge}>
              <Text style={styles.audioBadgeText}>🎙️ Native Speaker Audio</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.scenario}>{scenario}</Text>

      {/* Audio Mode Indicator */}
      <View style={styles.audioModeRow}>
        <View style={[styles.audioModeBadge, audioMode === "server" && styles.audioModeBadgeServer]}>
          <Text style={styles.audioModeText}>
            {audioMode === "server" ? "🎙️ Native Speaker" : "🔊 Device TTS"}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, progressAnimStyle]} />
        </View>
        <Text style={styles.progressText}>
          Phrase {currentPhraseIndex + 1}/{phrases.length} • {speedConfig.label}
        </Text>
      </View>

      {/* Speed Indicators */}
      <View style={styles.speedRow}>
        {SPEEDS.map((speed, idx) => (
          <View
            key={speed}
            style={[
              styles.speedBadge,
              idx === currentSpeedIndex && styles.speedBadgeActive,
              idx < currentSpeedIndex && styles.speedBadgeDone,
            ]}
          >
            <Text
              style={[
                styles.speedBadgeText,
                idx === currentSpeedIndex && styles.speedBadgeTextActive,
              ]}
            >
              {speed === "slow" ? "🐢" : speed === "normal" ? "🚶" : "🏃"}{" "}
              {SPEED_CONFIG[speed].label.split(" ")[0]}
            </Text>
          </View>
        ))}
      </View>

      {/* Rep Counter */}
      <View style={styles.repRow}>
        {Array.from({ length: REPS_PER_SPEED }).map((_, idx) => (
          <View
            key={idx}
            style={[styles.repDot, idx < currentRep && styles.repDotDone, idx === currentRep && styles.repDotCurrent]}
          />
        ))}
        <Text style={styles.repText}>Rep {currentRep + 1}/{REPS_PER_SPEED}</Text>
      </View>

      {/* Rhythm Beat Indicator */}
      <View style={styles.beatContainer}>
        <Animated.View style={[styles.beatCircle, beatAnimStyle]}>
          <Text style={styles.beatText}>♪</Text>
        </Animated.View>
      </View>

      {/* Current Phrase Card */}
      <View style={styles.phraseCard}>
        <Text style={styles.phraseText}>{currentPhrase?.phrase}</Text>
        <Text style={styles.phrasePron}>{currentPhrase?.pronunciation}</Text>
        <Text style={styles.phraseTranslation}>{currentPhrase?.translation}</Text>
      </View>

      {/* Encouragement */}
      {showEncouragement ? (
        <View style={styles.encouragementBanner}>
          <Text style={styles.encouragementText}>{showEncouragement}</Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {phase === "listen" && !isPlaying ? (
          <Pressable
            style={({ pressed }) => [styles.listenBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            onPress={handleListen}
          >
            <Text style={styles.listenBtnText}>🔊 Listen</Text>
          </Pressable>
        ) : phase === "listen" && isPlaying ? (
          <View style={styles.playingIndicator}>
            <Text style={styles.playingText}>🎧 Playing at {speedConfig.label}...</Text>
          </View>
        ) : phase === "repeat" ? (
          <Pressable
            style={({ pressed }) => [styles.repeatBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            onPress={handleRepeatDone}
          >
            <Text style={styles.repeatBtnText}>✅ I Repeated It!</Text>
          </Pressable>
        ) : (
          <View style={styles.feedbackIndicator}>
            <Text style={styles.feedbackText}>⏳ Moving to next...</Text>
          </View>
        )}
      </View>

      {/* Replay button */}
      {phase === "repeat" && (
        <Pressable
          style={({ pressed }) => [styles.replayBtn, pressed && { opacity: 0.7 }]}
          onPress={handleListen}
        >
          <Text style={styles.replayBtnText}>🔄 Hear Again</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

/** Infer the server language name from a TTS language code */
function inferServerLanguage(ttsLang: string): string {
  const map: Record<string, string> = {
    es: "spanish",
    "es-MX": "spanish",
    "es-ES": "spanish",
    pt: "portuguese",
    "pt-BR": "portuguese",
    fr: "french",
    "fr-FR": "french",
    ja: "japanese",
    "ja-JP": "japanese",
    en: "english",
    "en-US": "english",
  };
  return map[ttsLang] || map[ttsLang.split("-")[0]] || "spanish";
}

function getEncouragement(speed: SpeedLevel): string {
  const encouragements: Record<SpeedLevel, string[]> = {
    slow: ["Good! Again!", "That's it! One more!", "Keep going!"],
    normal: ["Faster now! You got this!", "Natural speed! Nice!", "Again!"],
    fast: ["Lightning speed! 🔥", "You're on fire!", "One more time!"],
  };
  const arr = encouragements[speed];
  return arr[Math.floor(Math.random() * arr.length)];
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  loadingText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF", marginTop: 16 },
  loadingSubtext: { fontSize: 14, color: "#9CA3AF", marginTop: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  scenario: { fontSize: 14, color: "#9CA3AF", marginBottom: 12 },
  audioModeRow: { alignItems: "flex-start", marginBottom: 12 },
  audioModeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  audioModeBadgeServer: { borderColor: "#22C55E40", backgroundColor: "#22C55E15" },
  audioModeText: { fontSize: 11, color: "#9CA3AF" },
  progressContainer: { marginBottom: 16 },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: "#2A2A4A", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: "#6C63FF" },
  progressText: { fontSize: 12, color: "#9CA3AF", marginTop: 4, textAlign: "center" },
  speedRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 12 },
  speedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  speedBadgeActive: { borderColor: "#6C63FF", backgroundColor: "#2A2A4A" },
  speedBadgeDone: { borderColor: "#22C55E", backgroundColor: "#1A2E1A" },
  speedBadgeText: { fontSize: 12, color: "#6B7280" },
  speedBadgeTextActive: { color: "#FFFFFF", fontWeight: "600" },
  repRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 },
  repDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#2A2A4A" },
  repDotDone: { backgroundColor: "#22C55E" },
  repDotCurrent: { backgroundColor: "#6C63FF", borderWidth: 2, borderColor: "#8B83FF" },
  repText: { fontSize: 12, color: "#9CA3AF", marginLeft: 8 },
  beatContainer: { alignItems: "center", marginBottom: 20 },
  beatCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
  },
  beatText: { fontSize: 28, color: "#FFFFFF" },
  phraseCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
  },
  phraseText: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginBottom: 8 },
  phrasePron: { fontSize: 16, color: "#8B83FF", marginBottom: 4, fontStyle: "italic" },
  phraseTranslation: { fontSize: 14, color: "#9CA3AF" },
  encouragementBanner: {
    backgroundColor: "#22C55E20",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#22C55E40",
  },
  encouragementText: { fontSize: 16, fontWeight: "600", color: "#22C55E", textAlign: "center" },
  actionRow: { alignItems: "center", marginBottom: 12 },
  listenBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  listenBtnText: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  repeatBtn: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  repeatBtnText: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  replayBtn: { alignSelf: "center", paddingVertical: 8 },
  replayBtnText: { fontSize: 14, color: "#8B83FF" },
  playingIndicator: { paddingVertical: 16 },
  playingText: { fontSize: 16, color: "#FFFFFF" },
  feedbackIndicator: { paddingVertical: 16 },
  feedbackText: { fontSize: 16, color: "#9CA3AF" },
  completeContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  completeEmoji: { fontSize: 64, marginBottom: 16 },
  completeTitle: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  completeSubtitle: { fontSize: 16, color: "#9CA3AF", textAlign: "center", marginBottom: 16 },
  completeEncouragement: { fontSize: 14, color: "#22C55E", textAlign: "center", fontStyle: "italic" },
  audioBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#22C55E15",
    borderWidth: 1,
    borderColor: "#22C55E40",
  },
  audioBadgeText: { fontSize: 12, color: "#22C55E" },
});
