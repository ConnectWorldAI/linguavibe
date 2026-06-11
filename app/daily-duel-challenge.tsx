/**
 * Daily Duel Challenge Screen
 * Shows today's Word of the Day challenge with recording, scoring, and sharing.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Share,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { generateDuelInviteLink, generateDailyResultLink } from "@/lib/social-challenge-sharing";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";
import {
  type DailyChallenge,
  type DailyChallengeAttempt,
  type DailyChallengeStreak,
  getTodaysChallenge,
  getTodaysAttempt,
  saveDailyChallengeAttempt,
  getDailyChallengeStreak,
  updateDailyChallengeStreak,
  calculateRank,
  getRankColor,
  getRankEmoji,
  generateShareContent,
} from "@/lib/daily-duel-challenge";
import { scorePronunciation } from "@/lib/pronunciation-duel";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


type Phase = "loading" | "ready" | "recording" | "scoring" | "bonus" | "results" | "already_done";

export default function DailyDuelChallengeScreen() {
  const { showStreakToast } = useUsage();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [streak, setStreak] = useState<DailyChallengeStreak | null>(null);
  const [existingAttempt, setExistingAttempt] = useState<DailyChallengeAttempt | null>(null);

  // Game state
  const [currentWordIndex, setCurrentWordIndex] = useState(0); // 0 = main, 1-2 = bonus
  const [scores, setScores] = useState<number[]>([]);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadChallenge();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadChallenge = async () => {
    try {
      const [todayChallenge, todayAttempt, currentStreak] = await Promise.all([
        getTodaysChallenge(),
        getTodaysAttempt(),
        getDailyChallengeStreak(),
      ]);
      setChallenge(todayChallenge);
      setStreak(currentStreak);

      if (todayAttempt) {
        setExistingAttempt(todayAttempt);
        setPhase("already_done");
      } else {
        setPhase("ready");
      }
    } catch (err) {
      console.error("Failed to load daily challenge:", err);
      setPhase("ready");
    }
  };

  const getCurrentWord = () => {
    if (!challenge) return null;
    if (currentWordIndex === 0) return challenge.word;
    return challenge.bonusWords[currentWordIndex - 1] || null;
  };

  const startRecording = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowCountdown(true);
    setCountdown(3);

    let count = 3;
    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setShowCountdown(false);
        setIsRecording(true);
        // Auto-stop after 4 seconds
        setTimeout(() => stopRecording(), 4000);
      }
    }, 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setPhase("scoring");

    const word = getCurrentWord();
    if (!word) return;

    // Simulate speech-to-text result (in production, uses real STT)
    await new Promise(r => setTimeout(r, 1200));
    const similarity = 0.5 + Math.random() * 0.5;
    const transcript = word.text; // Simulated
    const score = scorePronunciation(word.text, transcript);

    const newScores = [...scores, score];
    const newTranscripts = [...transcripts, transcript];
    setScores(newScores);
    setTranscripts(newTranscripts);

    if (Platform.OS !== "web") {
      if (score >= 80) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }

    // Move to next word or results
    if (currentWordIndex < 2 && challenge && challenge.bonusWords.length > currentWordIndex) {
      setCurrentWordIndex(prev => prev + 1);
      setPhase("bonus");
    } else {
      // All words done — save attempt
      const totalScore = newScores.reduce((a, b) => a + b, 0);
      const rank = calculateRank(totalScore);
      const attempt: DailyChallengeAttempt = {
        challengeId: challenge!.id,
        date: challenge!.date,
        score: newScores[0],
        transcript: newTranscripts[0],
        bonusScores: newScores.slice(1),
        totalScore,
        rank,
        completedAt: new Date().toISOString(),
      };
      await saveDailyChallengeAttempt(attempt);
      const updatedStreak = await updateDailyChallengeStreak();
      setStreak(updatedStreak);
      setExistingAttempt(attempt);
      setPhase("results");
      markPracticeAndToast(showStreakToast);
    }
  };

  const handleShare = async () => {
    if (!challenge || !existingAttempt) return;
    const { text, hashtags } = generateShareContent(challenge, existingAttempt);
    const deepLink = generateDailyResultLink(challenge.date, existingAttempt.score);
    try {
      await Share.share({
        message: `${text}\n\n${hashtags}\n\n${deepLink.url}`,
        url: deepLink.url,
      });
    } catch {}
  };

  const handlePlayAgain = () => {
    // Can't replay daily — navigate to regular duel
    router.push("/pronunciation-duel-lobby" as any);
  };

  // ── Render Sections ────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Daily Duel</Text>
        {challenge && <Text style={styles.headerTheme}>{challenge.theme}</Text>}
      </View>
      {streak && (
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color="#FF6B00" />
          <Text style={styles.streakText}>{streak.current}</Text>
        </View>
      )}
    </View>
  );

  const renderReadyPhase = () => {
    if (!challenge) return null;
    const word = challenge.word;
    return (
      <ScrollView contentContainerStyle={styles.readyContainer}>
        <View style={styles.wordOfDayBadge}>
          <Ionicons name="today" size={20} color={Colors.accentBlue} />
          <Text style={styles.wordOfDayLabel}>Word of the Day</Text>
        </View>

        <View style={styles.mainWordCard}>
          <Text style={styles.mainWordText}>{word.text}</Text>
          <Text style={styles.mainWordPhonetic}>{word.phonetic}</Text>
          <Text style={styles.mainWordTranslation}>{word.translation}</Text>
          <View style={styles.wordMeta}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{challenge.language}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{challenge.category.replace("_", " ")}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{challenge.difficulty}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.bonusLabel}>
          + {challenge.bonusWords.length} Bonus Words
        </Text>

        <View style={styles.communityRow}>
          <Ionicons name="people" size={16} color={Colors.textSecondary} />
          <Text style={styles.communityText}>
            {challenge.completedBy.toLocaleString()} players completed today
          </Text>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={startRecording}>
          <Ionicons name="mic" size={24} color="#FFFFFF" />
          <Text style={styles.startBtnText}>Start Challenge</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderRecordingPhase = () => {
    const word = getCurrentWord();
    if (!word) return null;

    return (
      <View style={styles.recordingContainer}>
        {showCountdown ? (
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.recordingWordLabel}>
              {currentWordIndex === 0 ? "Main Word" : `Bonus ${currentWordIndex}`}
            </Text>
            <Text style={styles.recordingWord}>{word.text}</Text>
            <Text style={styles.recordingPhonetic}>{word.phonetic}</Text>

            <View style={styles.micPulse}>
              <Ionicons name="mic" size={48} color={Colors.error} />
            </View>
            <Text style={styles.recordingHint}>Listening...</Text>

            <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
              <Ionicons name="stop" size={24} color="#FFFFFF" />
              <Text style={styles.stopBtnText}>Done</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderScoringPhase = () => (
    <View style={styles.scoringContainer}>
      <ActivityIndicator size="large" color={Colors.accentBlue} />
      <Text style={styles.scoringText}>Analyzing pronunciation...</Text>
    </View>
  );

  const renderBonusPhase = () => {
    const word = getCurrentWord();
    const lastScore = scores[scores.length - 1];
    return (
      <View style={styles.bonusContainer}>
        <Text style={styles.bonusScoreLabel}>Score</Text>
        <Text style={[styles.bonusScore, {
          color: lastScore >= 80 ? Colors.success : lastScore >= 55 ? Colors.warning : Colors.error,
        }]}>
          {lastScore}%
        </Text>
        <Text style={styles.bonusNextLabel}>Bonus Word {currentWordIndex}</Text>
        {word && (
          <View style={styles.bonusWordCard}>
            <Text style={styles.bonusWordText}>{word.text}</Text>
            <Text style={styles.bonusWordPhonetic}>{word.phonetic}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.startBtn} onPress={startRecording}>
          <Ionicons name="mic" size={24} color="#FFFFFF" />
          <Text style={styles.startBtnText}>Record</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderResultsPhase = () => {
    if (!existingAttempt || !challenge) return null;
    const rankColor = getRankColor(existingAttempt.rank);
    const rankEmoji = getRankEmoji(existingAttempt.rank);

    return (
      <ScrollView contentContainerStyle={styles.resultsContainer}>
        <Text style={styles.resultsEmoji}>{rankEmoji}</Text>
        <Text style={[styles.resultsRank, { color: rankColor }]}>
          {existingAttempt.rank.toUpperCase()}
        </Text>
        <Text style={styles.resultsTotalScore}>
          {existingAttempt.totalScore}/300
        </Text>

        {/* Score breakdown */}
        <View style={styles.scoreBreakdown}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Main: {challenge.word.text}</Text>
            <Text style={styles.scoreValue}>{existingAttempt.score}%</Text>
          </View>
          {existingAttempt.bonusScores.map((s, i) => (
            <View key={i} style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>
                Bonus {i + 1}: {challenge.bonusWords[i]?.text || "—"}
              </Text>
              <Text style={styles.scoreValue}>{s}%</Text>
            </View>
          ))}
        </View>

        {/* Streak */}
        {streak && (
          <View style={styles.streakCard}>
            <Ionicons name="flame" size={24} color="#FF6B00" />
            <View>
              <Text style={styles.streakCardTitle}>{streak.current} Day Streak</Text>
              <Text style={styles.streakCardSub}>
                Longest: {streak.longest} | Total: {streak.totalCompleted}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.playMoreBtn} onPress={handlePlayAgain}>
            <Ionicons name="game-controller" size={20} color={Colors.accentBlue} />
            <Text style={styles.playMoreBtnText}>More Duels</Text>
          </TouchableOpacity>
        </View>

        {/* Hashtags */}
        <View style={styles.hashtagRow}>
          {challenge.hashtags.map(tag => (
            <Text key={tag} style={styles.hashtag}>{tag}</Text>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderAlreadyDone = () => {
    if (!existingAttempt || !challenge) return null;
    return renderResultsPhase();
  };

  if (phase === "loading") {
    return (
      <ScreenContainer>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentBlue} />
          <Text style={styles.loadingText}>Loading today's challenge...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {renderHeader()}
      <View style={styles.content}>
        {phase === "ready" && renderReadyPhase()}
        {(phase === "recording" || isRecording || showCountdown) && renderRecordingPhase()}
        {phase === "scoring" && renderScoringPhase()}
        {phase === "bonus" && renderBonusPhase()}
        {phase === "results" && renderResultsPhase()}
        {phase === "already_done" && renderAlreadyDone()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerTheme: {
    fontSize: FontSize.xs,
    color: Colors.accentBlue,
    fontWeight: "600",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,107,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  streakText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#FF6B00",
  },

  content: { flex: 1 },

  // Ready phase
  readyContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 100,
  },
  wordOfDayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,204,255,0.1)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  wordOfDayLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.accentBlue,
  },
  mainWordCard: {
    width: "100%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accentBlue,
    marginBottom: Spacing.md,
  },
  mainWordText: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  mainWordPhonetic: {
    fontSize: FontSize.lg,
    color: Colors.accentBlue,
    marginBottom: 4,
  },
  mainWordTranslation: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  wordMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metaPill: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  metaPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  bonusLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.xl,
  },
  communityText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  startBtnText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Recording phase
  recordingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,204,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.accentBlue,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.accentBlue,
  },
  recordingWordLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  recordingWord: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  recordingPhonetic: {
    fontSize: FontSize.lg,
    color: Colors.accentBlue,
    marginBottom: Spacing.xl,
  },
  micPulse: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,68,68,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  recordingHint: {
    fontSize: FontSize.md,
    color: Colors.error,
    fontWeight: "600",
    marginBottom: Spacing.xl,
  },
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  stopBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Scoring phase
  scoringContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  scoringText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  // Bonus phase
  bonusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  bonusScoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  bonusScore: {
    fontSize: 48,
    fontWeight: "800",
  },
  bonusNextLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  bonusWordCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: Spacing.lg,
    width: "80%",
  },
  bonusWordText: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  bonusWordPhonetic: {
    fontSize: FontSize.md,
    color: Colors.accentBlue,
  },

  // Results phase
  resultsContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 100,
  },
  resultsEmoji: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
  resultsRank: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    marginBottom: 4,
  },
  resultsTotalScore: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  scoreBreakdown: {
    width: "100%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: Spacing.md,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  scoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  scoreValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    width: "100%",
    backgroundColor: "rgba(255,107,0,0.1)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,107,0,0.3)",
  },
  streakCardTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#FF6B00",
  },
  streakCardSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  shareBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  playMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,204,255,0.12)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accentBlue,
  },
  playMoreBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.accentBlue,
  },
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  hashtag: {
    fontSize: FontSize.xs,
    color: Colors.accentBlue,
    fontWeight: "500",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
