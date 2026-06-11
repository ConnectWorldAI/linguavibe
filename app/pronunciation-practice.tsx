import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { usePronunciationCoach } from "@/hooks/use-pronunciation-coach";
import { useSpeechToText } from "@/hooks/use-speech-to-text";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  surfaceElevated: "#1C2235",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  gold: "#FFD700",
  success: "#00E676",
  error: "#FF5252",
  warning: "#FF9F43",
  glowSubtle: "rgba(0,170,255,0.08)",
  glowBorder: "rgba(0,170,255,0.2)",
};

interface PracticeWord {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  difficulty: "easy" | "medium" | "hard";
  language: string;
}

const PRACTICE_WORDS: PracticeWord[] = [
  { id: "1", word: "¿Qué lo que?", phonetic: "/ke lo ke/", translation: "What's up?", difficulty: "easy", language: "Dominican Spanish" },
  { id: "2", word: "Buenas noches", phonetic: "/bwe.nas no.tʃes/", translation: "Good evening", difficulty: "easy", language: "Spanish" },
  { id: "3", word: "Desarrollador", phonetic: "/de.sa.ro.ʝa.ðoɾ/", translation: "Developer", difficulty: "hard", language: "Spanish" },
  { id: "4", word: "Presupuesto", phonetic: "/pɾe.su.pwes.to/", translation: "Budget", difficulty: "medium", language: "Spanish" },
  { id: "5", word: "Bonjour", phonetic: "/bɔ̃.ʒuʁ/", translation: "Good morning", difficulty: "easy", language: "French" },
  { id: "6", word: "Entrepreneur", phonetic: "/ɑ̃.tʁə.pʁə.nœʁ/", translation: "Entrepreneur", difficulty: "hard", language: "French" },
  { id: "7", word: "Merci beaucoup", phonetic: "/mɛʁ.si bo.ku/", translation: "Thank you very much", difficulty: "medium", language: "French" },
  { id: "8", word: "Konnichiwa", phonetic: "/kon.ni.tɕi.wa/", translation: "Hello", difficulty: "easy", language: "Japanese" },
  { id: "9", word: "Arigatou gozaimasu", phonetic: "/a.ɾi.ɡa.toː ɡo.za.i.ma.sɯ/", translation: "Thank you", difficulty: "medium", language: "Japanese" },
  { id: "10", word: "Sumimasen", phonetic: "/sɯ.mi.ma.seɴ/", translation: "Excuse me", difficulty: "medium", language: "Japanese" },
];

// Simulated waveform bars
const WAVEFORM_BARS = 30;

function generateWaveform(): number[] {
  return Array.from({ length: WAVEFORM_BARS }, () => Math.random() * 0.7 + 0.15);
}

export default function PronunciationPracticeScreen() {
  const router = useRouter();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [naturalnessData, setNaturalnessData] = useState<{ overall: number; rhythm: number; intonation: number; flow: number; feedback: string } | null>(null);
  const [waveform, setWaveform] = useState<number[]>(Array(WAVEFORM_BARS).fill(0.1));
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulseScale = useSharedValue(1);
  const scoreOpacity = useSharedValue(0);

  const currentWord = PRACTICE_WORDS[currentWordIndex];

  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (waveformTimer.current) clearInterval(waveformTimer.current);
    };
  }, []);

  // Real pronunciation coach and speech-to-text hooks
  const pronunciationCoach = usePronunciationCoach({
    language: currentWord?.language || "Spanish",
    level: currentWord?.difficulty === "easy" ? "beginner" : currentWord?.difficulty === "hard" ? "advanced" : "intermediate",
  });
  const speechToText = useSpeechToText();

  const startRecording = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);
    setHasRecording(false);
    setScore(null);
    setRecordingDuration(0);
    scoreOpacity.value = 0;

    // Animate pulse
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Waveform visual animation
    waveformTimer.current = setInterval(() => {
      setWaveform(generateWaveform());
    }, 100);

    // Track duration
    recordingTimer.current = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);

    // Start real audio recording
    await speechToText.startRecording();
  };

  const stopRecording = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRecording(false);
    setHasRecording(true);
    pulseScale.value = withTiming(1, { duration: 200 });

    if (recordingTimer.current) clearInterval(recordingTimer.current);
    if (waveformTimer.current) clearInterval(waveformTimer.current);

    // Stop recording and get real AI analysis
    await speechToText.stopRecording();
    const analysis = await pronunciationCoach.analyzeAttempt(
      currentWord.word,
      wordsCompleted + 1,
      score || undefined
    );
    const finalScore = analysis?.score || 0;
    setScore(finalScore);
    setNaturalnessData(analysis?.naturalness || null);
    scoreOpacity.value = withTiming(1, { duration: 400 });

    if (Platform.OS !== "web") {
      if (finalScore >= 80) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const playRecording = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(true);
    // Simulate playback with waveform animation
    let elapsed = 0;
    const playTimer = setInterval(() => {
      setWaveform(generateWaveform());
      elapsed += 100;
      if (elapsed >= recordingDuration * 1000) {
        clearInterval(playTimer);
        setIsPlaying(false);
        setWaveform(Array(WAVEFORM_BARS).fill(0.1));
      }
    }, 100);
  };

  const nextWord = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (score) {
      setWordsCompleted(wordsCompleted + 1);
      setTotalScore(totalScore + score);
    }
    setHasRecording(false);
    setScore(null);
    setRecordingDuration(0);
    setWaveform(Array(WAVEFORM_BARS).fill(0.1));
    scoreOpacity.value = 0;
    setCurrentWordIndex((currentWordIndex + 1) % PRACTICE_WORDS.length);
  };

  const getScoreColor = (s: number) => {
    if (s >= 85) return Colors.success;
    if (s >= 65) return Colors.warning;
    return Colors.error;
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return "Excellent!";
    if (s >= 80) return "Great job!";
    if (s >= 65) return "Good effort";
    return "Keep practicing";
  };

  const getDifficultyColor = (d: string) => {
    if (d === "easy") return Colors.success;
    if (d === "medium") return Colors.warning;
    return Colors.error;
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pronunciation</Text>
          <Text style={styles.headerSub}>{currentWordIndex + 1} / {PRACTICE_WORDS.length}</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.avgScore}>
            {wordsCompleted > 0 ? `${Math.round(totalScore / wordsCompleted)}%` : "—"}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentWordIndex / PRACTICE_WORDS.length) * 100}%` }]} />
      </View>

      {/* Word Card */}
      <View style={styles.wordCard}>
        <View style={styles.wordHeader}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentWord.difficulty) + "20", borderColor: getDifficultyColor(currentWord.difficulty) + "60" }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(currentWord.difficulty) }]}>{currentWord.difficulty}</Text>
          </View>
          <Text style={styles.languageLabel}>{currentWord.language}</Text>
        </View>
        <Text style={styles.wordText}>{currentWord.word}</Text>
        <Text style={styles.phoneticText}>{currentWord.phonetic}</Text>
        <Text style={styles.translationText}>{currentWord.translation}</Text>
      </View>

      {/* Waveform Visualization */}
      <View style={styles.waveformContainer}>
        <View style={styles.waveformBars}>
          {waveform.map((height, i) => (
            <View
              key={i}
              style={[
                styles.waveformBar,
                {
                  height: `${height * 100}%`,
                  backgroundColor: isRecording ? Colors.error : isPlaying ? Colors.secondary : Colors.textMuted + "40",
                },
              ]}
            />
          ))}
        </View>
        {isRecording && (
          <Text style={styles.durationText}>{Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, "0")}</Text>
        )}
      </View>

      {/* Score Display */}
      {score !== null && (
        <Animated.View style={[styles.scoreContainer, scoreStyle]}>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(score) }]}>
            <Text style={[styles.scoreNumber, { color: getScoreColor(score) }]}>{score}%</Text>
          </View>
          <Text style={[styles.scoreLabel, { color: getScoreColor(score) }]}>{getScoreLabel(score)}</Text>
          <View style={styles.scoreTips}>
            {score < 80 && (
              <Text style={styles.tipText}>Try speaking more slowly and clearly</Text>
            )}
            {score >= 80 && score < 90 && (
              <Text style={styles.tipText}>Almost perfect! Focus on the stressed syllables</Text>
            )}
            {score >= 90 && (
              <Text style={styles.tipText}>Native-like pronunciation!</Text>
            )}
          </View>
        </Animated.View>
      )}

      {/* How Natural Do I Sound? */}
      {naturalnessData && score !== null && (
        <View style={[styles.scoreContainer, { marginTop: 8, paddingVertical: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="sparkles" size={16} color={Colors.primary} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginLeft: 6 }}>Naturalness</Text>
            <View style={{ marginLeft: 'auto', backgroundColor: `${getScoreColor(naturalnessData.overall)}20`, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: getScoreColor(naturalnessData.overall) }}>{naturalnessData.overall}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            {[{ label: 'Rhythm', val: naturalnessData.rhythm }, { label: 'Intonation', val: naturalnessData.intonation }, { label: 'Flow', val: naturalnessData.flow }].map((item, i) => (
              <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: getScoreColor(item.val) }}>{item.val}</Text>
                <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 2 }}>{item.label}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 }}>{naturalnessData.feedback}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!isRecording && hasRecording && (
          <TouchableOpacity style={styles.playBtn} onPress={playRecording} disabled={isPlaying}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={Colors.secondary} />
          </TouchableOpacity>
        )}

        <Animated.View style={pulseStyle}>
          <TouchableOpacity
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <Ionicons name="mic" size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </Animated.View>

        {hasRecording && (
          <TouchableOpacity style={styles.nextBtn} onPress={nextWord}>
            <Ionicons name="arrow-forward" size={20} color={Colors.success} />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Hint */}
      <Text style={styles.hintText}>
        {isRecording ? "Speak the word clearly, then tap to stop" : hasRecording ? "Listen to your recording or move to next word" : "Tap the microphone to start recording"}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textMuted },
  headerStats: { width: 40, alignItems: "center" },
  avgScore: { fontSize: 14, fontWeight: "700", color: Colors.gold },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 2 },
  wordCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  wordHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, width: "100%" },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  difficultyText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  languageLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: "500" },
  wordText: { fontSize: 28, fontWeight: "900", color: Colors.textPrimary, textAlign: "center", marginBottom: 8 },
  phoneticText: { fontSize: 14, color: Colors.secondary, fontWeight: "500", marginBottom: 8 },
  translationText: { fontSize: 14, color: Colors.textSecondary },
  waveformContainer: {
    marginHorizontal: 20,
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    justifyContent: "center",
  },
  waveformBars: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    gap: 2,
  },
  waveformBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  durationText: { position: "absolute", bottom: 4, right: 12, fontSize: 10, color: Colors.error, fontWeight: "600" },
  scoreContainer: { alignItems: "center", marginBottom: 16 },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  scoreNumber: { fontSize: 20, fontWeight: "900" },
  scoreLabel: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  scoreTips: {},
  tipText: { fontSize: 12, color: Colors.textMuted, textAlign: "center" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: 16,
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  recordBtnActive: {
    backgroundColor: "#CC0000",
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.glowSubtle,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,230,118,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,230,118,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  hintText: { textAlign: "center", fontSize: 12, color: Colors.textMuted, paddingHorizontal: 32, paddingBottom: 20 },
});
