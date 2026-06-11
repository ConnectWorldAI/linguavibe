import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { DuelRecordingOverlay } from "@/components/duel-recording-overlay";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  type DuelGameMode,
  type DuelCategory,
  type DuelDifficulty,
  type DuelMatch,
  type DuelWord,
  getDuelWords,
  createDuelMatch,
  completeRound,
  scorePronunciation,
  saveDuelMatch,
  getModeInfo,
} from "@/lib/pronunciation-duel";
import { createReplay, saveReplay } from "@/lib/duel-replay";
import { getAdaptiveRound, logAdaptiveSession } from "@/lib/adaptive-difficulty";
import { generateRoundFeedback, speakFullFeedback, stopCoachSpeech, type RoundFeedback } from "@/lib/ai-voice-coach";

type GamePhase = "countdown" | "listen" | "record" | "scoring" | "round_result" | "complete";

export default function PronunciationDuelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode: string;
    category: string;
    difficulty: string;
    opponent: string;
    language: string;
    adaptive: string;
  }>();

  const mode = (params.mode || "word_flash") as DuelGameMode;
  const category = (params.category || "mixed") as DuelCategory;
  const difficulty = (params.difficulty || "medium") as DuelDifficulty;
  const opponentName = params.opponent || "AI Opponent";
  const language = (params.language || "Spanish") as any;
  const isAdaptive = params.adaptive === "true";
  const modeInfo = getModeInfo(mode);
  const [adaptiveReason, setAdaptiveReason] = useState<string>("");

  const [phase, setPhase] = useState<GamePhase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [match, setMatch] = useState<DuelMatch | null>(null);
  const [words, setWords] = useState<DuelWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [roundScore, setRoundScore] = useState(0);
  const [opponentRoundScore, setOpponentRoundScore] = useState(0);
  const [showRecordingOverlay, setShowRecordingOverlay] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState<RoundFeedback | null>(null);
  const [coachEnabled, setCoachEnabled] = useState(true);

  // Real speech-to-text hook for actual mic recording
  const speechToText = useSpeechToText();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartRef = useRef<number>(0);

  // Initialize match (adaptive or standard)
  useEffect(() => {
    const initMatch = async () => {
      let duelWords: DuelWord[];
      let matchDifficulty = difficulty;
      if (isAdaptive) {
        try {
          const round = await getAdaptiveRound(mode, language, 5);
          duelWords = round.words;
          matchDifficulty = round.difficulty;
          setAdaptiveReason(round.personalizedReason);
        } catch {
          duelWords = getDuelWords(mode, category, 5, language);
        }
      } else {
        duelWords = getDuelWords(mode, category, 5, language);
      }
      setWords(duelWords);
      const newMatch = createDuelMatch(mode, category, matchDifficulty, language, "You", opponentName, duelWords.length);
      setMatch(newMatch);
    };
    initMatch();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("listen");
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // Auto-transition from listen to record after showing word
  useEffect(() => {
    if (phase !== "listen") return;
    const timer = setTimeout(() => {
      setPhase("record");
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  // Recording timer
  useEffect(() => {
    if (phase !== "record" || !isRecording) return;
    timerRef.current = setInterval(() => {
      setRecordingTime(Date.now() - recordStartRef.current);
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isRecording]);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const currentWord = words[currentWordIndex];

  const handleStartRecording = async () => {
    setIsRecording(true);
    recordStartRef.current = Date.now();
    setRecordingTime(0);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Start real microphone recording
    try {
      await speechToText.startRecording();
    } catch (err) {
      // If recording fails, fall back to simulation mode
      console.warn("Recording start failed, using simulation:", err);
    }
  };

  const handleStopRecording = useCallback(async () => {
    if (!isRecording || !currentWord || !match) return;
    setIsRecording(false);
    const elapsed = Date.now() - recordStartRef.current;

    let finalTranscript = "";

    // Try real speech-to-text first
    try {
      if (speechToText.state === "recording") {
        finalTranscript = await speechToText.stopRecording();
      }
    } catch (err) {
      console.warn("Speech-to-text failed, using fallback:", err);
    }

    // Fallback: if real STT returned empty or failed, use simulation
    if (!finalTranscript) {
      finalTranscript = simulateTranscript(currentWord.text, difficulty);
    }

    setTranscript(finalTranscript);

    // Score the pronunciation
    const score = scorePronunciation(currentWord.text, finalTranscript);
    setRoundScore(score);

    // Complete the round
    const updatedMatch = completeRound(match, currentWord, score, elapsed, finalTranscript);
    setMatch(updatedMatch);

    const lastRound = updatedMatch.rounds[updatedMatch.rounds.length - 1];
    setOpponentRoundScore(lastRound.opponentScore);

    setPhase("round_result");
    if (Platform.OS !== "web") {
      if (score >= lastRound.opponentScore) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }

    // Generate AI coach feedback
    const feedback = generateRoundFeedback(
      currentWord.text,
      finalTranscript,
      score,
      language,
      currentWord.phonetic
    );
    setCoachFeedback(feedback);
    // Speak feedback if coach is enabled
    if (coachEnabled) {
      speakFullFeedback(feedback, currentWord.text, language).catch(() => {});
    }
    // Animate score reveal
    Animated.timing(scoreAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [isRecording, currentWord, match, difficulty, speechToText, language, coachEnabled]);

  const handleNextRound = () => {
    if (!match) return;
    scoreAnim.setValue(0);

    if (match.currentRound >= match.totalRounds) {
      // Match complete — save match and replay, then navigate to results
      setPhase("complete");
      saveDuelMatch(match);
      // Log adaptive session if adaptive mode was used
      if (isAdaptive) {
        logAdaptiveSession({
          timestamp: new Date().toISOString(),
          strategy: "weakness_focus",
          difficulty,
          focusCategory: category,
          wordsAttempted: match.totalRounds,
          averageScore: match.playerScore / Math.max(match.totalRounds, 1),
          language,
        });
      }
      // Save replay for playback
      const replayData = createReplay(
        match.id,
        mode,
        category,
        language,
        difficulty,
        "You",
        opponentName,
        match.rounds.map(r => ({
          word: r.word.text,
          phonetic: r.word.phonetic,
          translation: r.word.translation,
          playerTranscript: r.playerTranscript,
          playerScore: r.playerScore,
          opponentScore: r.opponentScore,
          durationMs: r.playerTime,
        }))
      );
      saveReplay(replayData);
      setTimeout(() => {
        router.replace({
          pathname: "/pronunciation-duel-results" as any,
          params: { matchId: match.id, fromGame: "true" },
        });
      }, 1500);
    } else {
      setCurrentWordIndex(i => i + 1);
      setTranscript("");
      setRoundScore(0);
      setOpponentRoundScore(0);
      setRecordingTime(0);
      setPhase("listen");
    }
  };

  // Max recording time auto-stop
  useEffect(() => {
    if (!isRecording) return;
    const maxTime = mode === "tongue_twister" ? 15000 : mode === "phrase_race" ? 10000 : 5000;
    const timer = setTimeout(() => {
      if (isRecording) handleStopRecording();
    }, maxTime);
    return () => clearTimeout(timer);
  }, [isRecording, mode, handleStopRecording]);

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${secs}.${tenths}s`;
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (phase === "countdown") {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Text style={styles.countdownLabel}>Get Ready!</Text>
          <Text style={[styles.countdownNumber, { color: modeInfo.color }]}>{countdown || "GO!"}</Text>
          <Text style={styles.countdownMode}>{modeInfo.title}</Text>
          <Text style={styles.countdownVs}>vs {opponentName}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (phase === "complete") {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <Ionicons name="trophy" size={64} color={Colors.gold} />
          <Text style={styles.completeTitle}>Duel Complete!</Text>
          <Text style={styles.completeScore}>
            {match?.playerScore || 0} — {match?.opponentScore || 0}
          </Text>
          <Text style={[styles.completeResult, {
            color: match?.winner === "player" ? Colors.success : match?.winner === "tie" ? Colors.gold : Colors.accent,
          }]}>
            {match?.winner === "player" ? "You Won!" : match?.winner === "tie" ? "It's a Tie!" : "Opponent Wins!"}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.gameContainer}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => {
            Alert.alert("Quit Duel?", "Your progress will be lost.", [
              { text: "Cancel", style: "cancel" },
              { text: "Quit", style: "destructive", onPress: () => router.back() },
            ]);
          }}>
            <Ionicons name="close" size={24} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.roundIndicator}>
            <Text style={styles.roundText}>
              Round {(match?.currentRound || 0) + (phase === "round_result" ? 0 : 1)}/{match?.totalRounds || 5}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={styles.scorePreview}>
              <Text style={styles.scorePreviewText}>
                {match?.playerScore || 0} — {match?.opponentScore || 0}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowRecordingOverlay(!showRecordingOverlay)}
              style={{ padding: 4 }}
            >
              <Ionicons
                name={showRecordingOverlay ? "videocam" : "videocam-outline"}
                size={20}
                color={showRecordingOverlay ? Colors.accent : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {words.map((_, i) => {
            const round = match?.rounds[i];
            let dotColor = Colors.border;
            if (round) {
              dotColor = round.playerScore >= round.opponentScore ? Colors.success : Colors.accent;
            } else if (i === currentWordIndex && phase !== "round_result") {
              dotColor = modeInfo.color;
            }
            return <View key={i} style={[styles.dot, { backgroundColor: dotColor }]} />;
          })}
        </View>

        {/* Word Display */}
        {currentWord && (phase === "listen" || phase === "record") && (
          <View style={styles.wordSection}>
            <Text style={styles.wordCategory}>{currentWord.translation}</Text>
            <Text style={styles.wordMain}>{currentWord.text}</Text>
            <Text style={styles.wordPhonetic}>{currentWord.phonetic}</Text>
          </View>
        )}

        {/* Recording UI */}
        {phase === "record" && (
          <View style={styles.recordSection}>
            <Text style={styles.recordInstruction}>
              {isRecording ? "Speak now..." : "Tap to record"}
            </Text>

            <Animated.View style={[styles.micBtnWrap, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity
                style={[
                  styles.micBtn,
                  { backgroundColor: isRecording ? Colors.accent : modeInfo.color },
                ]}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
                activeOpacity={0.8}
              >
                <Ionicons name={isRecording ? "stop" : "mic"} size={36} color="#fff" />
              </TouchableOpacity>
            </Animated.View>

            {isRecording && (
              <Text style={styles.recordTimer}>{formatTime(recordingTime)}</Text>
            )}
          </View>
        )}

        {/* Listen Phase */}
        {phase === "listen" && (
          <View style={styles.listenSection}>
            <View style={[styles.listenPulse, { borderColor: modeInfo.color }]}>
              <Ionicons name="volume-high" size={32} color={modeInfo.color} />
            </View>
            <Text style={styles.listenText}>Listen carefully...</Text>
          </View>
        )}

        {/* Round Result */}
        {phase === "round_result" && (
          <Animated.View style={[styles.resultSection, { opacity: scoreAnim }]}>
            <View style={styles.resultScores}>
              <View style={styles.resultPlayer}>
                <Text style={styles.resultLabel}>You</Text>
                <Text style={[styles.resultScore, {
                  color: roundScore >= opponentRoundScore ? Colors.success : Colors.textMuted,
                }]}>
                  {roundScore}
                </Text>
              </View>
              <View style={styles.resultVs}>
                <Text style={styles.resultVsText}>VS</Text>
              </View>
              <View style={styles.resultPlayer}>
                <Text style={styles.resultLabel}>{opponentName}</Text>
                <Text style={[styles.resultScore, {
                  color: opponentRoundScore > roundScore ? Colors.accent : Colors.textMuted,
                }]}>
                  {opponentRoundScore}
                </Text>
              </View>
            </View>

            {transcript.length > 0 && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>You said:</Text>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </View>
            )}

            {/* AI Voice Coach Feedback */}
            {coachFeedback && (
              <View style={styles.coachBox}>
                <View style={styles.coachHeader}>
                  <Ionicons name="mic" size={16} color={Colors.primary} />
                  <Text style={styles.coachTitle}>AI Coach</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCoachEnabled(!coachEnabled);
                      if (coachEnabled) stopCoachSpeech();
                    }}
                    style={styles.coachToggle}
                  >
                    <Ionicons
                      name={coachEnabled ? "volume-high" : "volume-mute"}
                      size={16}
                      color={coachEnabled ? Colors.primary : Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.coachMessage}>{coachFeedback.overallMessage}</Text>
                {coachFeedback.severity !== "perfect" && (
                  <Text style={styles.coachTip}>\ud83d\udca1 {coachFeedback.tip}</Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: modeInfo.color }]}
              onPress={handleNextRound}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>
                {(match?.currentRound || 0) >= (match?.totalRounds || 5) ? "See Results" : "Next Round"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Scoring Phase */}
        {phase === "scoring" && (
          <View style={styles.scoringSection}>
            <Ionicons name="hourglass" size={32} color={modeInfo.color} />
            <Text style={styles.scoringText}>AI is judging...</Text>
          </View>
        )}
      </View>

      {/* Recording Overlay for Content Capture */}
      <DuelRecordingOverlay
        visible={showRecordingOverlay}
        mode={mode}
        playerName="You"
        opponentName={opponentName}
        playerScore={match?.playerScore || 0}
        opponentScore={match?.opponentScore || 0}
        currentRound={match?.currentRound || 0}
        totalRounds={match?.totalRounds || 5}
      />
    </ScreenContainer>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Simulate a speech-to-text transcript with realistic errors based on difficulty
 */
function simulateTranscript(target: string, difficulty: DuelDifficulty): string {
  const words = target.split(" ");
  const errorRate = difficulty === "easy" ? 0.05 : difficulty === "medium" ? 0.15 : 0.25;

  return words.map(word => {
    if (Math.random() < errorRate) {
      // Introduce a minor error
      const errorType = Math.random();
      if (errorType < 0.3 && word.length > 3) {
        // Drop a character
        const pos = Math.floor(Math.random() * (word.length - 1)) + 1;
        return word.slice(0, pos) + word.slice(pos + 1);
      } else if (errorType < 0.6 && word.length > 2) {
        // Swap two adjacent characters
        const pos = Math.floor(Math.random() * (word.length - 1));
        return word.slice(0, pos) + word[pos + 1] + word[pos] + word.slice(pos + 2);
      }
      // Keep word as-is (minor pronunciation difference)
    }
    return word;
  }).join(" ");
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  countdownLabel: { fontSize: FontSize.lg, color: Colors.textMuted, marginBottom: 16 },
  countdownNumber: { fontSize: 80, fontWeight: "900" },
  countdownMode: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginTop: 20 },
  countdownVs: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: 8 },
  completeTitle: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.textPrimary, marginTop: 16 },
  completeScore: { fontSize: 48, fontWeight: "900", color: Colors.textPrimary, marginTop: 12 },
  completeResult: { fontSize: FontSize.xl, fontWeight: "700", marginTop: 8 },
  gameContainer: { flex: 1, paddingHorizontal: 16 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  roundIndicator: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surfaceCard,
  },
  roundText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  scorePreview: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surfaceCard,
  },
  scorePreviewText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textSecondary },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 16,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  wordSection: { alignItems: "center", marginTop: 40, marginBottom: 30 },
  wordCategory: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 8 },
  wordMain: { fontSize: 32, fontWeight: "800", color: Colors.textPrimary, textAlign: "center" },
  wordPhonetic: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 8 },
  recordSection: { alignItems: "center", marginTop: 20 },
  recordInstruction: { fontSize: FontSize.md, color: Colors.textMuted, marginBottom: 24 },
  micBtnWrap: { marginBottom: 16 },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  recordTimer: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginTop: 12 },
  listenSection: { alignItems: "center", marginTop: 40 },
  listenPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  listenText: { fontSize: FontSize.md, color: Colors.textMuted },
  resultSection: { alignItems: "center", marginTop: 30 },
  resultScores: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 24 },
  resultPlayer: { alignItems: "center", flex: 1 },
  resultLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 4 },
  resultScore: { fontSize: 48, fontWeight: "900" },
  resultVs: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
  },
  resultVsText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textMuted },
  transcriptBox: {
    width: "100%",
    padding: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  transcriptLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  transcriptText: { fontSize: FontSize.md, color: Colors.textPrimary },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.lg,
  },
  nextBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#fff" },
  scoringSection: { alignItems: "center", marginTop: 60, gap: 12 },
  scoringText: { fontSize: FontSize.md, color: Colors.textMuted },
  coachBox: {
    width: "100%",
    padding: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    marginBottom: 16,
  },
  coachHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  coachTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
    flex: 1,
  },
  coachToggle: {
    padding: 4,
  },
  coachMessage: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 6,
  },
  coachTip: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontStyle: "italic",
  },
});
