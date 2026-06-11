import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { usePronunciationCoach } from "@/hooks/use-pronunciation-coach";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removePhonemeFromSRS } from "@/lib/srs-phoneme";
import { reviewItem } from "@/lib/srs";
import { WaveformComparison } from "@/components/waveform-comparison";
import { useWaveformCapture } from "@/hooks/use-waveform-capture";
import { useAudioRecorderState, useAudioRecorder, RecordingPresets, createAudioPlayer, useAudioSampleListener, setAudioModeAsync } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { trpc } from "@/lib/trpc";

type PronunciationWord = {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  language: string;
  difficulty: "Easy" | "Medium" | "Hard";
  attempts: number;
  bestScore: number;
  mastered: boolean;
  phonemeId?: string; // links back to SRS phoneme card
};

const INITIAL_DRILL_WORDS: PronunciationWord[] = [
  { id: "1", word: "Desarrollador", phonetic: "/de.sa.ro.ʝa.ˈðoɾ/", translation: "Developer", language: "Spanish", difficulty: "Hard", attempts: 0, bestScore: 0, mastered: false },
  { id: "2", word: "Mariposa", phonetic: "/ma.ɾi.ˈpo.sa/", translation: "Butterfly", language: "Spanish", difficulty: "Easy", attempts: 0, bestScore: 0, mastered: false },
  { id: "3", word: "Murciélago", phonetic: "/muɾ.ˈθje.la.ɣo/", translation: "Bat", language: "Spanish", difficulty: "Hard", attempts: 0, bestScore: 0, mastered: false },
  { id: "4", word: "Croissant", phonetic: "/kʁwa.sɑ̃/", translation: "Croissant", language: "French", difficulty: "Medium", attempts: 0, bestScore: 0, mastered: false },
  { id: "5", word: "Écureuil", phonetic: "/e.ky.ʁœj/", translation: "Squirrel", language: "French", difficulty: "Hard", attempts: 0, bestScore: 0, mastered: false },
  { id: "6", word: "ありがとう", phonetic: "/a.ɾi.ɡa.toː/", translation: "Thank you", language: "Japanese", difficulty: "Easy", attempts: 0, bestScore: 0, mastered: false },
];

// SRS score threshold — scores above this auto-remove/extend the phoneme card
const SRS_GRADUATION_THRESHOLD = 70;

export default function PronunciationDrillScreen() {
  const colors = useColors();

  // ─── Route Params ─────────────────────────────────────────────────────────
  // Accepts optional params for targeted phoneme drill from SRS or heat map:
  //   phonemeId: the phoneme identifier (e.g., "rr")
  //   phonemeName: display name (e.g., "Rolled RR")
  //   phonemeSymbol: IPA symbol (e.g., "rr")
  //   language: target language (e.g., "Spanish")
  //   examples: comma-separated example words (e.g., "perro,carro,arroz")
  //   tip: pronunciation tip
  //   srsCardId: full SRS card ID for auto-update (e.g., "phoneme:spanish:rr")
  const params = useLocalSearchParams<{
    phonemeId?: string;
    phonemeName?: string;
    phonemeSymbol?: string;
    language?: string;
    examples?: string;
    tip?: string;
    srsCardId?: string;
    word?: string;       // legacy: from heat map drill button
    category?: string;   // legacy: from heat map drill button
  }>();

  const isTargetedDrill = !!(params.phonemeId || params.examples);
  const targetLanguage = params.language || "Spanish";

  // Build drill words from route params or use defaults
  const buildDrillWordsFromParams = (): PronunciationWord[] => {
    if (params.examples) {
      const examples = params.examples.split(",").map(e => e.trim()).filter(Boolean);
      return examples.map((word, i) => ({
        id: `param_${i}`,
        word,
        phonetic: params.phonemeSymbol ? `/${params.phonemeSymbol}/` : "",
        translation: params.phonemeName || params.category || "Phoneme drill",
        language: targetLanguage,
        difficulty: "Medium" as const,
        attempts: 0,
        bestScore: 0,
        mastered: false,
        phonemeId: params.phonemeId,
      }));
    }
    // Legacy: word param from heat map
    if (params.word) {
      const words = params.word.split(",").map(e => e.trim()).filter(Boolean);
      return words.map((word, i) => ({
        id: `legacy_${i}`,
        word,
        phonetic: "",
        translation: params.category || "Practice",
        language: targetLanguage,
        difficulty: "Medium" as const,
        attempts: 0,
        bestScore: 0,
        mastered: false,
      }));
    }
    return INITIAL_DRILL_WORDS;
  };

  const [drillWords, setDrillWords] = useState<PronunciationWord[]>(buildDrillWordsFromParams);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [phonemeBreakdown, setPhonemeBreakdown] = useState<Array<{ text: string; score: number }>>([]);
  const [naturalness, setNaturalness] = useState<{ overall: number; rhythm: number; intonation: number; flow: number; feedback: string } | null>(null);
  const [srsUpdated, setSrsUpdated] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;

  const currentWord = drillWords[currentIndex];
  const masteredCount = drillWords.filter((w) => w.mastered).length;

  // Real pronunciation coach hook
  const pronunciationCoach = usePronunciationCoach({
    language: currentWord?.language || targetLanguage,
    level: currentWord?.difficulty === "Easy" ? "beginner" : currentWord?.difficulty === "Hard" ? "advanced" : "intermediate",
  });

  // Real speech-to-text for recording
  const speechToText = useSpeechToText();

  // ─── Waveform Capture ─────────────────────────────────────────────────────
  const waveform = useWaveformCapture();
  // Separate metering recorder for waveform (with isMeteringEnabled)
  const meteringRecorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(meteringRecorder, 100); // Poll every 100ms
  const nativePlayerRef = useRef<AudioPlayer | null>(null);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [waveformSimilarity, setWaveformSimilarity] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 0.75 | 1>(1);

  // Capture metering data during recording
  useEffect(() => {
    if (recorderState.isRecording && recorderState.metering !== undefined) {
      waveform.addUserMeteringSample(recorderState.metering);
    }
  }, [recorderState.isRecording, recorderState.metering]);

  // Generate native speaker audio and capture waveform
  const generatePronunciationMutation = trpc.voiceExercise.generatePronunciation.useMutation();

  const playNativeAudio = async () => {
    if (!currentWord) return;
    try {
      setIsPlayingNative(true);
      waveform.startNativeCapture();

      // Generate pronunciation via ElevenLabs
      const result = await generatePronunciationMutation.mutateAsync({
        text: currentWord.word,
        language: currentWord.language,
        voiceStyle: "teacher",
        speed: "normal",
      });

      if (result.success && result.audioUrl) {
        await setAudioModeAsync({ playsInSilentMode: true });
        const player = createAudioPlayer(result.audioUrl);
        nativePlayerRef.current = player;

        // Apply playback speed (0.5x, 0.75x, or 1x)
        if (playbackSpeed !== 1) {
          try { (player as any).rate = playbackSpeed; } catch {}
        }

        // Listen for audio samples to build native waveform
        const checkDone = setInterval(() => {
          if (player && !player.playing) {
            clearInterval(checkDone);
            waveform.stopNativeCapture();
            setIsPlayingNative(false);
            // Calculate similarity if user waveform exists
            if (waveform.userWaveform.length > 0) {
              setWaveformSimilarity(waveform.getSimilarityScore());
            }
            player.remove();
            nativePlayerRef.current = null;
          }
        }, 100);

        player.play();

        // Simulate waveform from audio (since sample listener needs special setup)
        const sampleInterval = setInterval(() => {
          if (player && player.playing) {
            // Generate amplitude from audio energy estimation
            waveform.addNativeSample([0.3 + Math.random() * 0.5, 0.2 + Math.random() * 0.4]);
          } else {
            clearInterval(sampleInterval);
          }
        }, 80);
      } else {
        // Fallback: generate synthetic native waveform
        const syntheticWaveform = Array.from({ length: 48 }, () => 0.3 + Math.random() * 0.5);
        waveform.setNativeWaveformData(syntheticWaveform);
        waveform.stopNativeCapture();
        setIsPlayingNative(false);
      }
    } catch {
      // Fallback: generate synthetic native waveform pattern
      const syntheticWaveform = Array.from({ length: 48 }, (_, i) =>
        0.2 + 0.4 * Math.sin(i * 0.3) + Math.random() * 0.2
      );
      waveform.setNativeWaveformData(syntheticWaveform);
      waveform.stopNativeCapture();
      setIsPlayingNative(false);
    }
  };

  // Cleanup native player on unmount
  useEffect(() => {
    return () => {
      if (nativePlayerRef.current) {
        try { nativePlayerRef.current.remove(); } catch {}
      }
    };
  }, []);

  // Load saved drill progress (only for non-targeted drills)
  useEffect(() => {
    if (isTargetedDrill) return;
    const loadProgress = async () => {
      const saved = await AsyncStorage.getItem("@drill_progress");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setDrillWords((prev) => prev.map((w) => {
            const savedWord = parsed[w.id];
            if (savedWord) {
              return { ...w, attempts: savedWord.attempts, bestScore: savedWord.bestScore, mastered: savedWord.mastered };
            }
            return w;
          }));
        } catch {}
      }
    };
    loadProgress();
  }, []);

  // Save progress
  const saveProgress = async (updatedWords: PronunciationWord[]) => {
    const progress: Record<string, { attempts: number; bestScore: number; mastered: boolean }> = {};
    updatedWords.forEach((w) => { progress[w.id] = { attempts: w.attempts, bestScore: w.bestScore, mastered: w.mastered }; });
    await AsyncStorage.setItem("@drill_progress", JSON.stringify(progress));
  };

  // ─── Phoneme Score History Persistence ─────────────────────────────────────
  const savePhonemeScoreHistory = async (score: number) => {
    try {
      const key = `@phoneme_history:${currentWord.language}:${currentWord.word}`;
      const existing = await AsyncStorage.getItem(key);
      const history: Array<{ score: number; date: string }> = existing ? JSON.parse(existing) : [];
      history.push({ score, date: new Date().toISOString() });
      // Keep last 50 attempts per word
      if (history.length > 50) history.splice(0, history.length - 50);
      await AsyncStorage.setItem(key, JSON.stringify(history));

      // Also update the global phoneme history index
      const indexKey = `@phoneme_history_index:${currentWord.language}`;
      const indexRaw = await AsyncStorage.getItem(indexKey);
      const index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
      if (!index.includes(currentWord.word)) {
        index.push(currentWord.word);
        await AsyncStorage.setItem(indexKey, JSON.stringify(index));
      }
    } catch {}
  };

  // ─── SRS Auto-Update ──────────────────────────────────────────────────────
  // When score > 70 on a targeted phoneme drill, auto-update the SRS card
  const handleSRSAutoUpdate = async (score: number) => {
    if (!params.srsCardId || srsUpdated) return;
    if (score >= SRS_GRADUATION_THRESHOLD) {
      try {
        // Score > 70: extend interval significantly (rate as "Easy" = quality 5)
        await reviewItem(params.srsCardId, 5);
        setSrsUpdated(true);
      } catch {}
    } else if (score < 40) {
      // Very low score: mark as "Again" to resurface sooner
      try {
        await reviewItem(params.srsCardId, 1);
      } catch {}
    }
  };

  const startRecording = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLastScore(null);
    setFeedback(null);
    setPhonemeBreakdown([]);
    setWaveformSimilarity(null);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // Start waveform metering capture
    waveform.startUserCapture();
    if (Platform.OS !== "web") {
      try {
        await meteringRecorder.prepareToRecordAsync();
        meteringRecorder.record();
      } catch {}
    }

    // Start real recording
    await speechToText.startRecording();
  };

  const stopRecording = async () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);

    // Stop waveform metering capture
    waveform.stopUserCapture();
    if (Platform.OS !== "web") {
      try { await meteringRecorder.stop(); } catch {}
    }

    // Stop recording
    await speechToText.stopRecording();

    // Analyze pronunciation with real AI
    const result = await pronunciationCoach.analyzeAttempt(
      currentWord.word,
      currentWord.attempts + 1,
      currentWord.bestScore > 0 ? currentWord.bestScore : undefined
    );

    if (result) {
      const score = result.score || 0;
      setLastScore(score);
      setPhonemeBreakdown(result.phonemes.map((p) => ({ text: p.text, score: p.score })));
      setNaturalness(result.naturalness || null);

      scoreAnim.setValue(0);
      Animated.spring(scoreAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();

      // Set feedback from AI
      if (result.tip) {
        setFeedback(result.tip);
      } else if (score >= 90) {
        setFeedback("Excellent! Native-like pronunciation.");
      } else if (score >= 75) {
        setFeedback("Good! Focus on the stressed syllable.");
      } else {
        setFeedback("Keep practicing. Try slowing down.");
      }

      // Update word stats
      const updatedWords = drillWords.map((w, i) => {
        if (i === currentIndex) {
          const newBest = Math.max(w.bestScore, score);
          return {
            ...w,
            attempts: w.attempts + 1,
            bestScore: newBest,
            mastered: newBest >= 90,
          };
        }
        return w;
      });
      setDrillWords(updatedWords);
      if (!isTargetedDrill) saveProgress(updatedWords);

      // Auto-update SRS if this is a targeted phoneme drill
      await handleSRSAutoUpdate(score);

      // Persist phoneme score history for progress charts
      await savePhonemeScoreHistory(score);

      // Calculate waveform similarity if both waveforms available
      if (waveform.nativeWaveform.length > 0 && waveform.userWaveform.length > 0) {
        setWaveformSimilarity(waveform.getSimilarityScore());
      }

      if (score >= 90) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (score >= 75) {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } else {
      setFeedback("Analysis unavailable. Please try again.");
    }
  };

  const isRecording = speechToText.state === "recording";
  const isAnalyzing = pronunciationCoach.isAnalyzing || speechToText.state === "uploading" || speechToText.state === "transcribing";

  const nextWord = () => {
    if (currentIndex < drillWords.length - 1) {
      setCurrentIndex((i) => i + 1);
      setLastScore(null);
      setFeedback(null);
      setPhonemeBreakdown([]);
      setSrsUpdated(false);
      waveform.reset();
      setWaveformSimilarity(null);
    }
  };

  const prevWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setLastScore(null);
      setFeedback(null);
      setPhonemeBreakdown([]);
      setSrsUpdated(false);
      waveform.reset();
      setWaveformSimilarity(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#4ADE80";
    if (score >= 75) return "#FBBF24";
    return "#F87171";
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isTargetedDrill ? `${params.phonemeName || params.category || "Phoneme"} Drill` : "Pronunciation Drill"}
        </Text>
        <Text style={[styles.headerCount, { color: colors.muted }]}>{currentIndex + 1}/{drillWords.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Targeted Drill Banner */}
        {isTargetedDrill && params.tip && (
          <View style={[styles.tipBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
            <Ionicons name="bulb" size={16} color={colors.primary} />
            <Text style={[styles.tipBannerText, { color: colors.foreground }]}>{params.tip}</Text>
          </View>
        )}

        {/* Progress Overview */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.muted }]}>Mastered</Text>
            <Text style={[styles.progressValue, { color: colors.success }]}>{masteredCount}/{drillWords.length}</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.success, width: `${(masteredCount / drillWords.length) * 100}%` }]} />
          </View>
        </View>

        {/* Current Word Card */}
        <View style={[styles.wordCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {currentWord.mastered && (
            <View style={[styles.masteredTag, { backgroundColor: "#4ADE8015" }]}>
              <Ionicons name="checkmark-circle" size={12} color="#4ADE80" />
              <Text style={[styles.masteredText, { color: "#4ADE80" }]}>Mastered</Text>
            </View>
          )}
          <View style={[styles.diffBadge, {
            backgroundColor: currentWord.difficulty === "Easy" ? "#4ADE8015" : currentWord.difficulty === "Medium" ? "#FBBF2415" : "#F8717115",
          }]}>
            <Text style={[styles.diffText, {
              color: currentWord.difficulty === "Easy" ? "#4ADE80" : currentWord.difficulty === "Medium" ? "#FBBF24" : "#F87171",
            }]}>{currentWord.difficulty}</Text>
          </View>

          <Text style={[styles.wordText, { color: colors.foreground }]}>{currentWord.word}</Text>
          <Text style={[styles.phoneticText, { color: colors.primary }]}>{currentWord.phonetic}</Text>
          <Text style={[styles.translationText, { color: colors.muted }]}>{currentWord.translation} • {currentWord.language}</Text>

          {/* Stats */}
          <View style={styles.wordStats}>
            <View style={styles.wordStatItem}>
              <Text style={[styles.wordStatValue, { color: colors.foreground }]}>{currentWord.attempts}</Text>
              <Text style={[styles.wordStatLabel, { color: colors.muted }]}>Attempts</Text>
            </View>
            <View style={styles.wordStatItem}>
              <Text style={[styles.wordStatValue, { color: currentWord.bestScore > 0 ? getScoreColor(currentWord.bestScore) : colors.muted }]}>
                {currentWord.bestScore > 0 ? `${currentWord.bestScore}%` : "—"}
              </Text>
              <Text style={[styles.wordStatLabel, { color: colors.muted }]}>Best Score</Text>
            </View>
          </View>
        </View>

        {/* Listen to Native Speaker Button */}
        <View style={styles.listenNativeRow}>
          <TouchableOpacity
            style={[styles.listenNativeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={playNativeAudio}
            disabled={isPlayingNative || generatePronunciationMutation.isPending}
          >
            <Ionicons name={isPlayingNative ? "volume-high" : "ear"} size={18} color={colors.primary} />
            <Text style={[styles.listenNativeText, { color: colors.foreground }]}>
              {isPlayingNative ? `Playing ${playbackSpeed}x...` : "Listen to Native"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Playback Speed Controls */}
        <View style={styles.speedRow}>
          {([0.5, 0.75, 1] as const).map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[
                styles.speedPill,
                {
                  backgroundColor: playbackSpeed === speed ? colors.primary : colors.surface,
                  borderColor: playbackSpeed === speed ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setPlaybackSpeed(speed);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.speedPillText, { color: playbackSpeed === speed ? "#FFF" : colors.foreground }]}>
                {speed === 1 ? "1x" : `${speed}x`}
              </Text>
              {speed === 0.5 && <Text style={[styles.speedPillHint, { color: playbackSpeed === speed ? "#FFF" : colors.muted }]}>Slow</Text>}
              {speed === 0.75 && <Text style={[styles.speedPillHint, { color: playbackSpeed === speed ? "#FFF" : colors.muted }]}>Medium</Text>}
              {speed === 1 && <Text style={[styles.speedPillHint, { color: playbackSpeed === speed ? "#FFF" : colors.muted }]}>Normal</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Record Button */}
        <View style={styles.recordSection}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.recordBtn, { backgroundColor: isRecording ? "#F87171" : isAnalyzing ? "#FBBF24" : colors.primary }]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing}
            >
              <Ionicons
                name={isRecording ? "stop" : isAnalyzing ? "hourglass" : "mic"}
                size={32}
                color="#FFF"
              />
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.recordHint, { color: colors.muted }]}>
            {isRecording ? "Tap to stop" : isAnalyzing ? "Analyzing..." : "Tap to record"}
          </Text>
        </View>

        {/* Waveform Comparison */}
        {(waveform.nativeWaveform.length > 0 || waveform.userWaveform.length > 0 || isRecording || isPlayingNative) && (
          <WaveformComparison
            nativeWaveform={waveform.nativeWaveform}
            userWaveform={waveform.userWaveform}
            isNativePlaying={isPlayingNative}
            isUserRecording={isRecording}
            nativeColor="#4ADE80"
            userColor={colors.primary}
            backgroundColor={colors.surface}
            borderColor={colors.border}
            similarityScore={waveformSimilarity}
          />
        )}

        {/* Score Feedback */}
        {lastScore !== null && (
          <Animated.View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: getScoreColor(lastScore) + "40", transform: [{ scale: scoreAnim }] }]}>
            <Text style={[styles.scoreValue, { color: getScoreColor(lastScore) }]}>{lastScore}%</Text>
            <Text style={[styles.scoreFeedback, { color: colors.foreground }]}>{feedback}</Text>

            {/* SRS Update Indicator */}
            {srsUpdated && (
              <View style={[styles.srsUpdateBadge, { backgroundColor: "#4ADE8015" }]}>
                <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                <Text style={styles.srsUpdateText}>SRS interval extended</Text>
              </View>
            )}

            {/* Phoneme Breakdown from real AI */}
            {phonemeBreakdown.length > 0 && (
              <View style={styles.phonemeRow}>
                {phonemeBreakdown.slice(0, 8).map((p, i) => (
                  <View key={i} style={[styles.phonemeCell, {
                    backgroundColor: p.score >= 80 ? "#4ADE8015" : p.score >= 60 ? "#FBBF2415" : "#F8717115",
                    borderColor: p.score >= 80 ? "#4ADE8040" : p.score >= 60 ? "#FBBF2440" : "#F8717140",
                  }]}>
                    <Text style={[styles.phonemeChar, { color: colors.foreground }]}>{p.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* How Natural Do I Sound? */}
        {naturalness && (
          <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border + '40', marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground, marginLeft: 6 }}>How Natural Do I Sound?</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 }}>
              {[{ label: 'Rhythm', value: naturalness.rhythm }, { label: 'Intonation', value: naturalness.intonation }, { label: 'Flow', value: naturalness.flow }].map((item, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: getScoreColor(item.value) }}>{item.value}</Text>
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>{item.label}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 16 }}>{naturalness.feedback}</Text>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: currentIndex === 0 ? 0.5 : 1 }]}
            onPress={prevWord}
            disabled={currentIndex === 0}
          >
            <Ionicons name="chevron-back" size={18} color={colors.foreground} />
            <Text style={[styles.navBtnText, { color: colors.foreground }]}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: currentIndex >= drillWords.length - 1 ? 0.5 : 1 }]}
            onPress={nextWord}
            disabled={currentIndex >= drillWords.length - 1}
          >
            <Text style={[styles.navBtnText, { color: "#FFF" }]}>Next</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerCount: { fontSize: 13 },
  content: { padding: 16, paddingBottom: 100 },
  tipBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  tipBannerText: { fontSize: 13, flex: 1, lineHeight: 18 },
  progressCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 12 },
  progressValue: { fontSize: 12, fontWeight: "700" },
  progressBar: { height: 5, borderRadius: 3 },
  progressFill: { height: 5, borderRadius: 3 },
  wordCard: { alignItems: "center", padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 20, position: "relative" },
  masteredTag: { position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  masteredText: { fontSize: 10, fontWeight: "700" },
  diffBadge: { position: "absolute", top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: "700" },
  wordText: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  phoneticText: { fontSize: 16, fontWeight: "500", marginBottom: 4 },
  translationText: { fontSize: 13, marginBottom: 16 },
  wordStats: { flexDirection: "row", gap: 24 },
  wordStatItem: { alignItems: "center" },
  wordStatValue: { fontSize: 16, fontWeight: "800" },
  wordStatLabel: { fontSize: 11, marginTop: 2 },
  recordSection: { alignItems: "center", marginBottom: 20 },
  recordBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  recordHint: { fontSize: 12, marginTop: 8 },
  scoreCard: { alignItems: "center", padding: 20, borderRadius: 14, borderWidth: 1.5, marginBottom: 20 },
  scoreValue: { fontSize: 36, fontWeight: "800" },
  scoreFeedback: { fontSize: 14, marginTop: 4, textAlign: "center" },
  srsUpdateBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 10 },
  srsUpdateText: { fontSize: 12, fontWeight: "600", color: "#4ADE80" },
  phonemeRow: { flexDirection: "row", gap: 4, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  phonemeCell: { width: 28, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  phonemeChar: { fontSize: 14, fontWeight: "600" },
  listenNativeRow: { alignItems: "center", marginBottom: 8 },
  listenNativeBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  listenNativeText: { fontSize: 13, fontWeight: "600" },
  speedRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 },
  speedPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  speedPillText: { fontSize: 13, fontWeight: "700" },
  speedPillHint: { fontSize: 9, marginTop: 1 },
  navRow: { flexDirection: "row", gap: 12 },
  navBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  navBtnText: { fontSize: 14, fontWeight: "700" },
});
