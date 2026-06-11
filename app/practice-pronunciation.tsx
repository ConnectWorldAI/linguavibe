import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
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
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


const { width } = Dimensions.get("window");

type PracticeState = "listen" | "ready" | "recording" | "analyzing" | "results";

type PhonemeScore = {
  phoneme: string;
  score: number; // 0-100
  feedback: "perfect" | "good" | "needs_work";
};

type NaturalnessScore = {
  overall: number;
  rhythm: number;
  intonation: number;
  flow: number;
  feedback: string;
};

type PronunciationResult = {
  overallScore: number;
  fluencyScore: number;
  accuracyScore: number;
  intonationScore: number;
  phonemes: PhonemeScore[];
  tips: string[];
  naturalness?: NaturalnessScore;
};

// Real AI pronunciation analysis via server hook
function buildResultFromAI(analysis: any, phrase: string): PronunciationResult {
  const words = phrase.split(" ");
  const phonemes: PhonemeScore[] = (analysis.phonemes || []).map((p: any) => ({
    phoneme: p.text || p.ipa || "",
    score: p.score || 0,
    feedback: (p.score || 0) >= 90 ? "perfect" as const : (p.score || 0) >= 75 ? "good" as const : "needs_work" as const,
  }));
  if (phonemes.length === 0) {
    words.forEach((word) => {
      phonemes.push({ phoneme: word, score: analysis.score || 0, feedback: (analysis.score || 0) >= 90 ? "perfect" : (analysis.score || 0) >= 75 ? "good" : "needs_work" });
    });
  }
  const overallScore = analysis.score || 0;
  const naturalness: NaturalnessScore | undefined = analysis.naturalness ? {
    overall: analysis.naturalness.overall || 0,
    rhythm: analysis.naturalness.rhythm || 0,
    intonation: analysis.naturalness.intonation || 0,
    flow: analysis.naturalness.flow || 0,
    feedback: analysis.naturalness.feedback || "Keep practicing for a more natural sound!",
  } : undefined;

  return {
    overallScore,
    fluencyScore: Math.min(100, overallScore + 5),
    accuracyScore: overallScore,
    intonationScore: Math.min(100, overallScore + 3),
    phonemes,
    tips: analysis.corrections?.map((c: any) => `${c.wrong} → ${c.correct}: ${c.explanation}`) || [analysis.tip || "Keep practicing!"],
    naturalness,
  };
}

export default function PracticePronunciationScreen() {
  const { showStreakToast } = useUsage();
  const params = useLocalSearchParams<{
    phrase?: string;
    translation?: string;
    language?: string;
    flag?: string;
  }>();

  const phrase = params.phrase || "Tá to' tranquilo por aquí";
  const translation = params.translation || "Everything's cool around here";
  const language = params.language || "Dominican Spanish";
  const flag = params.flag || "🇩🇴";

  const [state, setState] = useState<PracticeState>("listen");
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated values
  const pulseScale = useSharedValue(1);
  const micGlow = useSharedValue(0);

  useEffect(() => {
    if (state === "recording") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      micGlow.value = withTiming(1, { duration: 300 });
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      micGlow.value = withTiming(0, { duration: 200 });
    }
  }, [state]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: micGlow.value,
  }));

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
    };
  }, []);

  const playOriginal = () => {
    setIsPlayingOriginal(true);
    // Simulate playing original audio
    setTimeout(() => {
      setIsPlayingOriginal(false);
      setState("ready");
    }, 2000);

    if (Platform.OS !== "web") {
      const Haptics = require("expo-haptics");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Real pronunciation coach and speech-to-text hooks
  const pronunciationCoach = usePronunciationCoach({
    language: language,
    level: "intermediate",
  });
  const speechToText = useSpeechToText();

  const startRecording = async () => {
    setState("recording");
    setRecordingTime(0);
    setWaveformData([]);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    waveRef.current = setInterval(() => {
      setWaveformData((prev) => [...prev.slice(-50), Math.random() * 0.8 + 0.2]);
    }, 80);

    if (Platform.OS !== "web") {
      const Haptics = require("expo-haptics");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await speechToText.startRecording();
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveRef.current) clearInterval(waveRef.current);
    setState("analyzing");

    await speechToText.stopRecording();
    // Real AI pronunciation analysis
    const analysis = await pronunciationCoach.analyzeAttempt(phrase, attempts + 1, bestScore > 0 ? bestScore : undefined);
    if (analysis) {
      const score = buildResultFromAI(analysis, phrase);
      setResult(score);
      setAttempts((prev) => prev + 1);
      if (score.overallScore > bestScore) {
        setBestScore(score.overallScore);
      }
      setState("results");
      markPracticeAndToast(showStreakToast);

      if (Platform.OS !== "web") {
        const Haptics = require("expo-haptics");
        if (score.overallScore >= 85) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } else {
      setResult({ overallScore: 0, fluencyScore: 0, accuracyScore: 0, intonationScore: 0, phonemes: [], tips: ["Analysis unavailable. Please try again."] });
      setState("results");
    }
  };

  const retryPractice = () => {
    setState("listen");
    setResult(null);
    setRecordingTime(0);
    setWaveformData([]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return Colors.success;
    if (score >= 75) return Colors.gold;
    if (score >= 60) return Colors.warning;
    return Colors.accent;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent!";
    if (score >= 80) return "Great job!";
    if (score >= 70) return "Good effort!";
    if (score >= 60) return "Keep practicing";
    return "Try again";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Practice Pronunciation</Text>
          <Text style={styles.headerSubtitle}>{flag} {language}</Text>
        </View>
        <View style={styles.attemptBadge}>
          <Text style={styles.attemptText}>#{attempts + 1}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Phrase Card */}
        <View style={styles.phraseCard}>
          <View style={styles.phraseHeader}>
            <Text style={styles.phraseLabel}>SAY THIS:</Text>
            <TouchableOpacity
              style={[styles.listenBtn, isPlayingOriginal && styles.listenBtnActive]}
              onPress={playOriginal}
            >
              <Ionicons
                name={isPlayingOriginal ? "volume-high" : "volume-medium"}
                size={16}
                color={isPlayingOriginal ? Colors.primary : Colors.secondary}
              />
              <Text style={[styles.listenBtnText, isPlayingOriginal && styles.listenBtnTextActive]}>
                {isPlayingOriginal ? "Playing..." : "Listen"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.phraseText}>{phrase}</Text>
          <Text style={styles.translationText}>{translation}</Text>
        </View>

        {/* Main Interaction Area */}
        {state === "listen" && (
          <View style={styles.listenState}>
            <View style={styles.instructionCard}>
              <Ionicons name="headset" size={32} color={Colors.secondary} />
              <Text style={styles.instructionTitle}>Step 1: Listen</Text>
              <Text style={styles.instructionText}>
                Tap "Listen" above to hear the native pronunciation, then record yourself saying it.
              </Text>
            </View>
            <TouchableOpacity style={styles.listenMainBtn} onPress={playOriginal}>
              <Ionicons name="play-circle" size={24} color={Colors.primary} />
              <Text style={styles.listenMainBtnText}>Play Original Audio</Text>
            </TouchableOpacity>
          </View>
        )}

        {state === "ready" && (
          <View style={styles.readyState}>
            <View style={styles.instructionCard}>
              <Ionicons name="mic" size={32} color={Colors.gold} />
              <Text style={styles.instructionTitle}>Step 2: Record</Text>
              <Text style={styles.instructionText}>
                Now tap the microphone and say the phrase. Speak clearly and at a natural pace.
              </Text>
            </View>
            <Animated.View style={[styles.recordButtonOuter, pulseStyle]}>
              <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                <Ionicons name="mic" size={36} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.tapToRecord}>Tap to record</Text>
          </View>
        )}

        {state === "recording" && (
          <View style={styles.recordingState}>
            {/* Live Waveform */}
            <View style={styles.waveformContainer}>
              <View style={styles.waveform}>
                {waveformData.map((val, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: val * 60,
                        backgroundColor: Colors.gold,
                        opacity: 0.6 + val * 0.4,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Timer */}
            <View style={styles.recordingTimer}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTimeText}>{formatTime(recordingTime)}</Text>
            </View>

            {/* Stop Button */}
            <Animated.View style={[styles.stopButtonGlow, glowStyle]} />
            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <View style={styles.stopIcon} />
            </TouchableOpacity>
            <Text style={styles.tapToStop}>Tap to stop</Text>
          </View>
        )}

        {state === "analyzing" && (
          <View style={styles.analyzingState}>
            <View style={styles.analyzingAnimation}>
              <Ionicons name="analytics" size={48} color={Colors.secondary} />
            </View>
            <Text style={styles.analyzingTitle}>Analyzing your pronunciation...</Text>
            <Text style={styles.analyzingSubtext}>Comparing phonemes, intonation, and fluency</Text>
            <View style={styles.analyzingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        )}

        {state === "results" && result && (
          <View style={styles.resultsState}>
            {/* Overall Score */}
            <View style={styles.scoreCircle}>
              <View style={[styles.scoreRing, { borderColor: getScoreColor(result.overallScore) }]}>
                <Text style={[styles.scoreNumber, { color: getScoreColor(result.overallScore) }]}>
                  {result.overallScore}
                </Text>
                <Text style={styles.scoreOutOf}>/100</Text>
              </View>
              <Text style={[styles.scoreLabel, { color: getScoreColor(result.overallScore) }]}>
                {getScoreLabel(result.overallScore)}
              </Text>
            </View>

            {/* Score Breakdown */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Score Breakdown</Text>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Accuracy</Text>
                <View style={styles.breakdownBar}>
                  <View style={[styles.breakdownFill, { width: `${result.accuracyScore}%`, backgroundColor: getScoreColor(result.accuracyScore) }]} />
                </View>
                <Text style={styles.breakdownValue}>{result.accuracyScore}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Fluency</Text>
                <View style={styles.breakdownBar}>
                  <View style={[styles.breakdownFill, { width: `${result.fluencyScore}%`, backgroundColor: getScoreColor(result.fluencyScore) }]} />
                </View>
                <Text style={styles.breakdownValue}>{result.fluencyScore}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Intonation</Text>
                <View style={styles.breakdownBar}>
                  <View style={[styles.breakdownFill, { width: `${result.intonationScore}%`, backgroundColor: getScoreColor(result.intonationScore) }]} />
                </View>
                <Text style={styles.breakdownValue}>{result.intonationScore}</Text>
              </View>
            </View>

            {/* How Natural Do I Sound? */}
            {result.naturalness && (
              <View style={styles.breakdownCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="sparkles" size={18} color={Colors.primary} />
                  <Text style={[styles.breakdownTitle, { marginBottom: 0, marginLeft: 8 }]}>How Natural Do I Sound?</Text>
                </View>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: getScoreColor(result.naturalness.overall), alignItems: 'center', justifyContent: 'center', backgroundColor: `${getScoreColor(result.naturalness.overall)}15` }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: getScoreColor(result.naturalness.overall) }}>{result.naturalness.overall}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 6 }}>
                    {result.naturalness.overall >= 85 ? 'Sounds native!' : result.naturalness.overall >= 70 ? 'Getting there!' : result.naturalness.overall >= 50 ? 'Keep practicing' : 'Work on flow'}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Rhythm</Text>
                  <View style={styles.breakdownBar}>
                    <View style={[styles.breakdownFill, { width: `${result.naturalness.rhythm}%`, backgroundColor: getScoreColor(result.naturalness.rhythm) }]} />
                  </View>
                  <Text style={styles.breakdownValue}>{result.naturalness.rhythm}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Intonation</Text>
                  <View style={styles.breakdownBar}>
                    <View style={[styles.breakdownFill, { width: `${result.naturalness.intonation}%`, backgroundColor: getScoreColor(result.naturalness.intonation) }]} />
                  </View>
                  <Text style={styles.breakdownValue}>{result.naturalness.intonation}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Flow</Text>
                  <View style={styles.breakdownBar}>
                    <View style={[styles.breakdownFill, { width: `${result.naturalness.flow}%`, backgroundColor: getScoreColor(result.naturalness.flow) }]} />
                  </View>
                  <Text style={styles.breakdownValue}>{result.naturalness.flow}</Text>
                </View>
                <View style={{ marginTop: 12, padding: 12, backgroundColor: `${Colors.primary}10`, borderRadius: 10 }}>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }}>
                    {result.naturalness.feedback}
                  </Text>
                </View>
              </View>
            )}

            {/* Word-by-Word Scores */}
            <View style={styles.phonemeCard}>
              <Text style={styles.phonemeTitle}>Word-by-Word</Text>
              <View style={styles.phonemeGrid}>
                {result.phonemes.map((p, i) => (
                  <View
                    key={i}
                    style={[
                      styles.phonemeChip,
                      {
                        borderColor:
                          p.feedback === "perfect"
                            ? Colors.success
                            : p.feedback === "good"
                            ? Colors.gold
                            : Colors.accent,
                        backgroundColor:
                          p.feedback === "perfect"
                            ? "rgba(0, 255, 136, 0.08)"
                            : p.feedback === "good"
                            ? "rgba(255, 184, 0, 0.08)"
                            : "rgba(255, 45, 45, 0.08)",
                      },
                    ]}
                  >
                    <Text style={styles.phonemeWord}>{p.phoneme}</Text>
                    <Text
                      style={[
                        styles.phonemeScore,
                        {
                          color:
                            p.feedback === "perfect"
                              ? Colors.success
                              : p.feedback === "good"
                              ? Colors.gold
                              : Colors.accent,
                        },
                      ]}
                    >
                      {p.score}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Tips */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={16} color={Colors.gold} />
                <Text style={styles.tipsTitle}>Tips to Improve</Text>
              </View>
              {result.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Best Score */}
            {attempts > 1 && (
              <View style={styles.bestScoreRow}>
                <Ionicons name="trophy" size={14} color={Colors.gold} />
                <Text style={styles.bestScoreText}>Best score: {bestScore}/100</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.retryButton} onPress={retryPractice}>
                <Ionicons name="refresh" size={18} color={Colors.secondary} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextPhraseButton} onPress={() => router.back()}>
                <Text style={styles.nextPhraseText}>Done</Text>
                <Ionicons name="checkmark" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  attemptBadge: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: Colors.glowBorder },
  attemptText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.secondary },
  content: { paddingHorizontal: Spacing.md, paddingBottom: 40 },

  // Phrase Card
  phraseCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.glowBorder },
  phraseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  phraseLabel: { fontSize: 10, fontWeight: "800", color: Colors.secondary, letterSpacing: 1.2 },
  listenBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0, 170, 255, 0.1)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  listenBtnActive: { backgroundColor: Colors.secondary },
  listenBtnText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.secondary },
  listenBtnTextActive: { color: Colors.primary },
  phraseText: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, lineHeight: 30 },
  translationText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 6, fontStyle: "italic" },

  // Listen State
  listenState: { alignItems: "center", paddingTop: Spacing.xl },
  instructionCard: { alignItems: "center", gap: 8, paddingVertical: Spacing.lg },
  instructionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  instructionText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", maxWidth: "80%", lineHeight: 20 },
  listenMainBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.secondary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: BorderRadius.lg },
  listenMainBtnText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.primary },

  // Ready State
  readyState: { alignItems: "center", paddingTop: Spacing.lg },
  recordButtonOuter: { marginTop: Spacing.lg },
  recordButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accent, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255, 45, 45, 0.4)" },
  tapToRecord: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 12 },

  // Recording State
  recordingState: { alignItems: "center", paddingTop: Spacing.md },
  waveformContainer: { width: "100%", height: 80, justifyContent: "center", marginBottom: Spacing.md },
  waveform: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 60, gap: 2 },
  waveBar: { width: 3, borderRadius: 2, minHeight: 3 },
  recordingTimer: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: Spacing.lg },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  recordingTimeText: { fontSize: FontSize.xxl, fontWeight: "700", color: Colors.textPrimary, fontVariant: ["tabular-nums"] },
  stopButtonGlow: { position: "absolute", width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255, 45, 45, 0.15)", bottom: 80 },
  stopButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: Colors.accent },
  stopIcon: { width: 24, height: 24, borderRadius: 4, backgroundColor: Colors.accent },
  tapToStop: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 12 },

  // Analyzing State
  analyzingState: { alignItems: "center", paddingTop: Spacing.xl * 2 },
  analyzingAnimation: { marginBottom: Spacing.md },
  analyzingTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  analyzingSubtext: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  analyzingDots: { flexDirection: "row", gap: 8, marginTop: Spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },

  // Results State
  resultsState: { paddingTop: Spacing.md },
  scoreCircle: { alignItems: "center", marginBottom: Spacing.lg },
  scoreRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.2)" },
  scoreNumber: { fontSize: 32, fontWeight: "800" },
  scoreOutOf: { fontSize: FontSize.xs, color: Colors.textMuted },
  scoreLabel: { fontSize: FontSize.md, fontWeight: "700", marginTop: 8 },

  // Breakdown
  breakdownCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  breakdownTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  breakdownRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  breakdownLabel: { width: 80, fontSize: FontSize.sm, color: Colors.textSecondary },
  breakdownBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceElevated, marginHorizontal: 8, overflow: "hidden" },
  breakdownFill: { height: "100%", borderRadius: 3 },
  breakdownValue: { width: 28, fontSize: FontSize.xs, fontWeight: "700", color: Colors.textPrimary, textAlign: "right" },

  // Phonemes
  phonemeCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  phonemeTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 10 },
  phonemeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  phonemeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  phonemeWord: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  phonemeScore: { fontSize: 10, fontWeight: "700", marginTop: 1 },

  // Tips
  tipsCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.goldBorder },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  tipsTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  tipRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  tipBullet: { color: Colors.textMuted, fontSize: FontSize.sm },
  tipText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },

  // Best Score
  bestScoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: Spacing.md },
  bestScoreText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.gold },

  // Actions
  resultActions: { flexDirection: "row", gap: 12, marginTop: Spacing.sm },
  retryButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.surfaceCard, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.glowBorder },
  retryButtonText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.secondary },
  nextPhraseButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.gold, paddingVertical: 14, borderRadius: BorderRadius.md },
  nextPhraseText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.primary },
});
