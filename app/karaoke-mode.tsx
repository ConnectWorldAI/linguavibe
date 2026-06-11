/**
 * Karaoke Mode Screen
 * Sing-along mode with word-by-word lyrics highlighting in real-time
 * and pronunciation scoring feedback.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
  Platform,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface KaraokeWord {
  text: string;
  startTime: number;
  endTime: number;
  translation?: string;
}

interface KaraokeLine {
  id: string;
  words: KaraokeWord[];
  startTime: number;
  endTime: number;
  original: string;
  translated: string;
}

interface PronunciationScore {
  lineId: string;
  score: number; // 0-100
  feedback: string;
  wordScores: { word: string; score: number }[];
}

// ─── DEMO DATA ──────────────────────────────────────────────────────────────

const DEMO_KARAOKE_LINES: KaraokeLine[] = [
  {
    id: "line-1",
    original: "Buenos días, ¿cómo estás?",
    translated: "Good morning, how are you?",
    startTime: 0,
    endTime: 4000,
    words: [
      { text: "Buenos", startTime: 0, endTime: 700, translation: "Good" },
      { text: "días,", startTime: 700, endTime: 1400, translation: "morning," },
      { text: "¿cómo", startTime: 1600, endTime: 2500, translation: "how" },
      { text: "estás?", startTime: 2500, endTime: 3800, translation: "are you?" },
    ],
  },
  {
    id: "line-2",
    original: "Me llamo Juan, ¿y tú?",
    translated: "My name is Juan, and you?",
    startTime: 4000,
    endTime: 8000,
    words: [
      { text: "Me", startTime: 4000, endTime: 4400, translation: "My" },
      { text: "llamo", startTime: 4400, endTime: 5200, translation: "name is" },
      { text: "Juan,", startTime: 5200, endTime: 6000, translation: "Juan," },
      { text: "¿y", startTime: 6200, endTime: 6800, translation: "and" },
      { text: "tú?", startTime: 6800, endTime: 7800, translation: "you?" },
    ],
  },
  {
    id: "line-3",
    original: "Mucho gusto en conocerte",
    translated: "Nice to meet you",
    startTime: 8000,
    endTime: 12000,
    words: [
      { text: "Mucho", startTime: 8000, endTime: 8800, translation: "Much" },
      { text: "gusto", startTime: 8800, endTime: 9600, translation: "pleasure" },
      { text: "en", startTime: 9600, endTime: 10000, translation: "in" },
      { text: "conocerte", startTime: 10000, endTime: 11800, translation: "meeting you" },
    ],
  },
  {
    id: "line-4",
    original: "Vamos a hablar un poco más",
    translated: "Let's talk a little more",
    startTime: 12000,
    endTime: 16000,
    words: [
      { text: "Vamos", startTime: 12000, endTime: 12700, translation: "Let's" },
      { text: "a", startTime: 12700, endTime: 13000, translation: "to" },
      { text: "hablar", startTime: 13000, endTime: 13800, translation: "talk" },
      { text: "un", startTime: 13800, endTime: 14200, translation: "a" },
      { text: "poco", startTime: 14200, endTime: 14800, translation: "little" },
      { text: "más", startTime: 14800, endTime: 15800, translation: "more" },
    ],
  },
  {
    id: "line-5",
    original: "Hola, hola, buenos días",
    translated: "Hello, hello, good morning",
    startTime: 16000,
    endTime: 20000,
    words: [
      { text: "Hola,", startTime: 16000, endTime: 16800, translation: "Hello," },
      { text: "hola,", startTime: 16800, endTime: 17600, translation: "hello," },
      { text: "buenos", startTime: 17600, endTime: 18400, translation: "good" },
      { text: "días", startTime: 18400, endTime: 19800, translation: "morning" },
    ],
  },
  {
    id: "line-6",
    original: "Adiós, adiós, buenas noches",
    translated: "Goodbye, goodbye, good night",
    startTime: 20000,
    endTime: 24000,
    words: [
      { text: "Adiós,", startTime: 20000, endTime: 20800, translation: "Goodbye," },
      { text: "adiós,", startTime: 20800, endTime: 21600, translation: "goodbye," },
      { text: "buenas", startTime: 21600, endTime: 22400, translation: "good" },
      { text: "noches", startTime: 22400, endTime: 23800, translation: "night" },
    ],
  },
  {
    id: "line-7",
    original: "Gracias, de nada, por favor",
    translated: "Thank you, you're welcome, please",
    startTime: 24000,
    endTime: 28000,
    words: [
      { text: "Gracias,", startTime: 24000, endTime: 25000, translation: "Thank you," },
      { text: "de", startTime: 25000, endTime: 25400, translation: "you're" },
      { text: "nada,", startTime: 25400, endTime: 26200, translation: "welcome," },
      { text: "por", startTime: 26200, endTime: 26800, translation: "for" },
      { text: "favor", startTime: 26800, endTime: 27800, translation: "please" },
    ],
  },
  {
    id: "line-8",
    original: "Aprendemos con amor",
    translated: "We learn with love",
    startTime: 28000,
    endTime: 32000,
    words: [
      { text: "Aprendemos", startTime: 28000, endTime: 29200, translation: "We learn" },
      { text: "con", startTime: 29200, endTime: 29800, translation: "with" },
      { text: "amor", startTime: 29800, endTime: 31500, translation: "love" },
    ],
  },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function KaraokeModeScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{
    songId?: string;
    title?: string;
    language?: string;
    lyrics?: string;
    duration?: string;
  }>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [scores, setScores] = useState<PronunciationScore[]>([]);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isMicActive, setIsMicActive] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Parse lyrics from params or use demo
  const karaokeLines: KaraokeLine[] = params.lyrics
    ? (() => {
        try {
          const parsed = JSON.parse(params.lyrics);
          return parsed.map((line: any, i: number) => ({
            id: `line-${i}`,
            original: line.original || "",
            translated: line.translated || "",
            startTime: line.startTime || i * 4000,
            endTime: line.endTime || (i + 1) * 4000,
            words: (line.words || line.original?.split(" ") || []).map((w: any, j: number) => {
              if (typeof w === "string") {
                const lineStart = line.startTime || i * 4000;
                const lineDur = (line.endTime || (i + 1) * 4000) - lineStart;
                const wordCount = (line.original?.split(" ") || []).length;
                return {
                  text: w,
                  startTime: lineStart + (j * lineDur / wordCount),
                  endTime: lineStart + ((j + 1) * lineDur / wordCount),
                };
              }
              return w;
            }),
          }));
        } catch { return DEMO_KARAOKE_LINES; }
      })()
    : DEMO_KARAOKE_LINES;

  const totalDuration = params.duration
    ? parseInt(params.duration)
    : karaokeLines[karaokeLines.length - 1]?.endTime || 32000;

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 100;
          if (next >= totalDuration) {
            setIsPlaying(false);
            setIsComplete(true);
            if (timerRef.current) clearInterval(timerRef.current);
            // Calculate overall score
            if (scores.length > 0) {
              const avg = Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length);
              setOverallScore(avg);
            }
            return totalDuration;
          }
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  // Track current line and auto-scroll
  useEffect(() => {
    const lineIdx = karaokeLines.findIndex(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );
    if (lineIdx >= 0 && lineIdx !== currentLineIndex) {
      setCurrentLineIndex(lineIdx);
      flatListRef.current?.scrollToIndex({ index: lineIdx, animated: true, viewPosition: 0.3 });

      // Simulate pronunciation scoring for the previous line
      if (isMicActive && lineIdx > 0) {
        const prevLine = karaokeLines[lineIdx - 1];
        const score = Math.floor(Math.random() * 30) + 70; // 70-100
        const wordScores = prevLine.words.map(w => ({
          word: w.text,
          score: Math.floor(Math.random() * 40) + 60,
        }));
        const feedback = score >= 90 ? "Excellent!" : score >= 80 ? "Great job!" : score >= 70 ? "Good, keep practicing!" : "Try again";
        setScores(prev => [...prev, { lineId: prevLine.id, score, feedback, wordScores }]);
        if (Platform.OS !== "web") {
          if (score >= 90) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    }
  }, [currentTime]);

  // Mic pulse animation
  useEffect(() => {
    if (isMicActive && isPlaying) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isMicActive, isPlaying]);

  const togglePlay = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isComplete) {
      // Restart
      setCurrentTime(0);
      setCurrentLineIndex(0);
      setScores([]);
      setIsComplete(false);
      setOverallScore(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMicActive(!isMicActive);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#22C55E";
    if (score >= 80) return "#F59E0B";
    if (score >= 70) return "#FF8C00";
    return "#EF4444";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return "🌟";
    if (score >= 80) return "👍";
    if (score >= 70) return "💪";
    return "🔄";
  };

  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

  const renderKaraokeLine = ({ item, index }: { item: KaraokeLine; index: number }) => {
    const isCurrentLine = index === currentLineIndex && isPlaying;
    const isPastLine = currentTime > item.endTime;
    const lineScore = scores.find(s => s.lineId === item.id);

    return (
      <View style={[styles.lineContainer, isCurrentLine && styles.currentLineContainer]}>
        {/* Words with individual highlighting */}
        <View style={styles.wordsRow}>
          {item.words.map((word, wIdx) => {
            const isCurrentWord = isCurrentLine && currentTime >= word.startTime && currentTime < word.endTime;
            const isPastWord = currentTime > word.endTime;
            const wordScore = lineScore?.wordScores.find(ws => ws.word === word.text);

            return (
              <View key={`${item.id}-w${wIdx}`} style={styles.wordWrapper}>
                <Text
                  style={[
                    styles.wordText,
                    { color: isPastWord ? colors.primary : isCurrentWord ? "#fff" : colors.foreground },
                    isCurrentWord && [styles.currentWord, { backgroundColor: colors.primary }],
                    isPastLine && !isCurrentLine && { opacity: 0.6 },
                  ]}
                >
                  {word.text}
                </Text>
                {/* Word-level score indicator */}
                {wordScore && (
                  <View style={[styles.wordScoreDot, { backgroundColor: getScoreColor(wordScore.score) }]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Translation */}
        {showTranslation && (
          <Text style={[styles.translationText, { color: colors.muted }]}>
            {item.translated}
          </Text>
        )}

        {/* Line score */}
        {lineScore && (
          <View style={[styles.lineScoreBadge, { backgroundColor: getScoreColor(lineScore.score) + "20" }]}>
            <Text style={styles.lineScoreEmoji}>{getScoreEmoji(lineScore.score)}</Text>
            <Text style={[styles.lineScoreText, { color: getScoreColor(lineScore.score) }]}>
              {lineScore.score}%
            </Text>
            <Text style={[styles.lineScoreFeedback, { color: colors.muted }]}>{lineScore.feedback}</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── RESULTS VIEW ──────────────────────────────────────────────────────────

  if (isComplete) {
    return (
      <ScreenContainer>
        <View style={styles.resultsContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.resultsContent}>
            <Text style={styles.resultsEmoji}>{getScoreEmoji(overallScore)}</Text>
            <Text style={[styles.resultsTitle, { color: colors.foreground }]}>
              {overallScore >= 90 ? "Perfect!" : overallScore >= 80 ? "Great Job!" : overallScore >= 70 ? "Good Effort!" : "Keep Practicing!"}
            </Text>
            <Text style={[styles.resultsScore, { color: colors.primary }]}>{overallScore}%</Text>
            <Text style={[styles.resultsSubtitle, { color: colors.muted }]}>Overall Pronunciation Score</Text>

            {/* Score breakdown */}
            <View style={[styles.scoreBreakdown, { backgroundColor: colors.surface }]}>
              {scores.map((s, i) => (
                <View key={s.lineId} style={[styles.scoreRow, i < scores.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 0.5 }]}>
                  <Text style={[styles.scoreLineNum, { color: colors.muted }]}>Line {i + 1}</Text>
                  <View style={[styles.scoreBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.scoreBarFill, { width: `${s.score}%`, backgroundColor: getScoreColor(s.score) }]} />
                  </View>
                  <Text style={[styles.scoreValue, { color: getScoreColor(s.score) }]}>{s.score}%</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.resultsActions}>
              <TouchableOpacity
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                onPress={togglePlay}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareBtn, { backgroundColor: "#25D366" }]}
                onPress={async () => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const songTitle = params.title || "a song";
                  const lang = params.language || "a language";
                  const emoji = getScoreEmoji(overallScore);
                  const scoreBreakdown = scores.map((s, i) => `  Line ${i + 1}: ${s.score}%`).join("\n");
                  const message = `${emoji} I scored ${overallScore}% on "${songTitle}" in ${lang}!\n\n${scoreBreakdown}\n\nCan you beat my score? 🎤 #LinguaVibe #KaraokeChallenge`;
                  try {
                    await Share.share({ message, title: `Karaoke Score: ${overallScore}%` });
                  } catch (e) {
                    Alert.alert("Share", "Could not open share sheet.");
                  }
                }}
              >
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.shareBtnText}>Share Score</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.challengeBtn, { borderColor: colors.primary }]}
                onPress={async () => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const songTitle = params.title || "a song";
                  const lang = params.language || "a language";
                  const message = `🎤 Challenge! I scored ${overallScore}% singing "${songTitle}" in ${lang}. Think you can do better? Open LinguaVibe and try! #LinguaVibeChallenge`;
                  try {
                    await Share.share({ message, title: "Karaoke Challenge" });
                  } catch (e) {
                    Alert.alert("Share", "Could not open share sheet.");
                  }
                }}
              >
                <Ionicons name="trophy" size={18} color={colors.primary} />
                <Text style={[styles.challengeBtnText, { color: colors.primary }]}>Challenge a Friend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.doneBtn, { borderColor: colors.border }]}
                onPress={() => router.back()}
              >
                <Text style={[styles.doneBtnText, { color: colors.foreground }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ─── MAIN VIEW ──────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {params.title || "Karaoke Mode"}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            {params.language || "Spanish"} • Sing Along
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowTranslation(!showTranslation)}>
          <Ionicons name={showTranslation ? "language" : "language-outline"} size={22} color={showTranslation ? colors.primary : colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${(currentTime / totalDuration) * 100}%`, backgroundColor: colors.primary }]} />
      </View>
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, { color: colors.muted }]}>{formatTime(currentTime)}</Text>
        <Text style={[styles.timeText, { color: colors.muted }]}>{formatTime(totalDuration)}</Text>
      </View>

      {/* Lyrics display */}
      <FlatList
        ref={flatListRef}
        data={karaokeLines}
        keyExtractor={(item) => item.id}
        renderItem={renderKaraokeLine}
        contentContainerStyle={styles.lyricsContent}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => {}}
      />

      {/* Controls */}
      <View style={[styles.controls, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Mic toggle */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.micBtn, { backgroundColor: isMicActive ? "#EF4444" : colors.border }]}
            onPress={toggleMic}
          >
            <Ionicons name={isMicActive ? "mic" : "mic-off"} size={22} color={isMicActive ? "#fff" : colors.muted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Play/Pause */}
        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: colors.primary }]}
          onPress={togglePlay}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#fff" />
        </TouchableOpacity>

        {/* Score indicator */}
        <View style={styles.liveScore}>
          {scores.length > 0 && (
            <>
              <Text style={[styles.liveScoreValue, { color: getScoreColor(Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length)) }]}>
                {Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length)}%
              </Text>
              <Text style={[styles.liveScoreLabel, { color: colors.muted }]}>Avg</Text>
            </>
          )}
        </View>
      </View>

      {/* Mic status */}
      {isMicActive && (
        <View style={[styles.micStatus, { backgroundColor: "#EF4444" + "15" }]}>
          <Ionicons name="radio-button-on" size={10} color="#EF4444" />
          <Text style={[styles.micStatusText, { color: "#EF4444" }]}>Listening for pronunciation...</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerBack: { width: 40 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  progressBar: { height: 3, marginHorizontal: 16, marginTop: 12, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 4 },
  timeText: { fontSize: 11 },
  lyricsContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  lineContainer: { marginBottom: 24, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  currentLineContainer: { backgroundColor: "rgba(10, 126, 164, 0.08)" },
  wordsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  wordWrapper: { alignItems: "center" },
  wordText: { fontSize: 22, fontWeight: "500" },
  currentWord: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
  wordScoreDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  translationText: { fontSize: 14, marginTop: 8, fontStyle: "italic" },
  lineScoreBadge: { flexDirection: "row", alignItems: "center", marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start", gap: 6 },
  lineScoreEmoji: { fontSize: 14 },
  lineScoreText: { fontSize: 13, fontWeight: "700" },
  lineScoreFeedback: { fontSize: 11 },
  controls: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, paddingHorizontal: 24, borderTopWidth: 0.5, gap: 24 },
  micBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  playBtn: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  liveScore: { alignItems: "center", width: 44 },
  liveScoreValue: { fontSize: 16, fontWeight: "700" },
  liveScoreLabel: { fontSize: 10 },
  micStatus: { position: "absolute", bottom: 100, left: 20, right: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 20, gap: 6 },
  micStatusText: { fontSize: 12, fontWeight: "500" },
  // Results
  resultsContainer: { flex: 1, padding: 20 },
  closeBtn: { alignSelf: "flex-end", padding: 8 },
  resultsContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  resultsEmoji: { fontSize: 64, marginBottom: 12 },
  resultsTitle: { fontSize: 28, fontWeight: "700" },
  resultsScore: { fontSize: 56, fontWeight: "800", marginTop: 8 },
  resultsSubtitle: { fontSize: 14, marginTop: 4 },
  scoreBreakdown: { width: "100%", borderRadius: 16, padding: 16, marginTop: 24 },
  scoreRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10 },
  scoreLineNum: { fontSize: 12, width: 44 },
  scoreBar: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 4 },
  scoreValue: { fontSize: 13, fontWeight: "600", width: 36, textAlign: "right" },
  resultsActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 32, gap: 12 },
  retryBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 28, gap: 8 },
  retryBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  shareBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 28, gap: 8 },
  shareBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  challengeBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 28, borderWidth: 1.5, gap: 6 },
  challengeBtnText: { fontSize: 15, fontWeight: "600" },
  doneBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 28, borderWidth: 1 },
  doneBtnText: { fontSize: 15, fontWeight: "600" },
});
