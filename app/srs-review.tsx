import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from "expo-audio";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import {
  getDueItems,
  getDueCount,
  reviewItem,
  getQueueStats,
  type SRSItem,
  type ReviewQuality,
} from "@/lib/srs";
import { scheduleSRSReviewNotification, scheduleSRSRecurringReminders } from "@/lib/notifications";
import { trpc } from "@/lib/trpc";

const { width } = Dimensions.get("window");

type ReviewRating = { label: string; quality: ReviewQuality; color: string; icon: string };

const RATINGS: ReviewRating[] = [
  { label: "Again", quality: 1, color: Colors.accent, icon: "close-circle" },
  { label: "Hard", quality: 3, color: Colors.gold, icon: "alert-circle" },
  { label: "Good", quality: 4, color: Colors.secondary, icon: "checkmark-circle" },
  { label: "Easy", quality: 5, color: Colors.success, icon: "star" },
];

export default function SRSReviewScreen() {
  const [dueItems, setDueItems] = useState<SRSItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, incorrect: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [queueStats, setQueueStats] = useState({ total: 0, due: 0, mastered: 0, learning: 0, new: 0 });
  const [loading, setLoading] = useState(true);

  // ─── Audio Playback for Phoneme Cards ───────────────────────────────────
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioPlayerRef = { current: null as AudioPlayer | null };
  const cachedAudioUrlsRef = { current: {} as Record<string, string> };
  const pronunciationMutation = trpc.voiceExercise.generatePronunciation.useMutation();

  const playPhonemeAudio = async (item: SRSItem) => {
    if (!item.id.startsWith("phoneme:")) return;
    // Stop existing playback
    if (audioPlayerRef.current) {
      try { audioPlayerRef.current.pause(); audioPlayerRef.current.remove(); } catch {}
      audioPlayerRef.current = null;
      setIsPlayingAudio(false);
    }
    // Extract example word from context
    const exampleMatch = item.context?.match(/Practice:\s*(.+)/);
    const firstExample = exampleMatch ? exampleMatch[1].split(",")[0].trim() : item.word.split(" — ")[0];
    const language = item.lessonId?.replace("phoneme:", "") || "Spanish";
    // Enable silent mode
    try { await setAudioModeAsync({ playsInSilentMode: true }); } catch {}
    // Check cache
    const cacheKey = `${firstExample}_${language}`;
    if (cachedAudioUrlsRef.current[cacheKey]) {
      playAudioFromUrl(cachedAudioUrlsRef.current[cacheKey]);
      return;
    }
    // Generate via ElevenLabs
    setIsLoadingAudio(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await pronunciationMutation.mutateAsync({
        text: firstExample,
        language,
        voiceStyle: "teacher",
        speed: "slow",
      });
      if (result.audioUrl) {
        cachedAudioUrlsRef.current[cacheKey] = result.audioUrl;
        playAudioFromUrl(result.audioUrl);
      } else {
        speakFallback(firstExample, language);
      }
    } catch {
      speakFallback(firstExample, language);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const playAudioFromUrl = (url: string) => {
    try {
      const player = createAudioPlayer(url);
      audioPlayerRef.current = player;
      setIsPlayingAudio(true);
      player.play();
      const checkInterval = setInterval(() => {
        try {
          if (!player.playing) {
            setIsPlayingAudio(false);
            player.remove();
            audioPlayerRef.current = null;
            clearInterval(checkInterval);
          }
        } catch {
          setIsPlayingAudio(false);
          clearInterval(checkInterval);
        }
      }, 500);
      setTimeout(() => {
        clearInterval(checkInterval);
        try { player.pause(); player.remove(); } catch {}
        setIsPlayingAudio(false);
        audioPlayerRef.current = null;
      }, 30000);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const speakFallback = (text: string, language: string) => {
    setIsPlayingAudio(true);
    try {
      Speech.speak(text, {
        language: language.toLowerCase().slice(0, 2),
        rate: 0.7,
        onDone: () => setIsPlayingAudio(false),
        onStopped: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Animations
  const cardFlip = useSharedValue(0);
  const cardSlide = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const items = await getDueItems();
    const stats = await getQueueStats();
    setDueItems(items);
    setQueueStats(stats);
    setLoading(false);
    if (items.length === 0) {
      setIsComplete(true);
    }
  };

  const currentItem = dueItems[currentIndex];

  const flipCard = () => {
    setShowAnswer(true);
    cardFlip.value = withTiming(1, { duration: 300 });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRating = async (rating: ReviewRating) => {
    if (!currentItem) return;

    if (Platform.OS !== "web") {
      if (rating.quality >= 4) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (rating.quality <= 2) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }

    // Update stats
    setSessionStats((prev) => ({
      reviewed: prev.reviewed + 1,
      correct: rating.quality >= 3 ? prev.correct + 1 : prev.correct,
      incorrect: rating.quality < 3 ? prev.incorrect + 1 : prev.incorrect,
    }));

    // Update SRS item
    await reviewItem(currentItem.id, rating.quality);

    // Animate card out
    cardSlide.value = withTiming(rating.quality >= 3 ? width : -width, { duration: 250 });
    cardOpacity.value = withTiming(0, { duration: 200 });

    setTimeout(() => {
      // Reset card
      cardSlide.value = 0;
      cardOpacity.value = 1;
      cardFlip.value = 0;
      setShowAnswer(false);

      // Next item
      if (currentIndex + 1 >= dueItems.length) {
        setIsComplete(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 280);
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardSlide.value }],
    opacity: cardOpacity.value,
  }));

  const answerStyle = useAnimatedStyle(() => ({
    opacity: cardFlip.value,
    transform: [{ translateY: withTiming(showAnswer ? 0 : 20, { duration: 300 }) }],
  }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="hourglass" size={48} color={Colors.secondary} />
          <Text style={styles.loadingText}>Loading review queue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Complete</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.completeContainer}>
          <View style={styles.completeIconWrap}>
            <Ionicons name="trophy" size={56} color={Colors.gold} />
          </View>
          <Text style={styles.completeTitle}>
            {sessionStats.reviewed > 0 ? "Session Complete!" : "All Caught Up!"}
          </Text>
          <Text style={styles.completeSubtitle}>
            {sessionStats.reviewed > 0
              ? `You reviewed ${sessionStats.reviewed} cards this session.`
              : "No cards are due for review right now. Come back later!"}
          </Text>

          {sessionStats.reviewed > 0 && (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.secondary }]}>{sessionStats.reviewed}</Text>
                <Text style={styles.statLabel}>Reviewed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.success }]}>{sessionStats.correct}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.accent }]}>{sessionStats.incorrect}</Text>
                <Text style={styles.statLabel}>Again</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.gold }]}>
                  {sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0}%
                </Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>
          )}

          <View style={styles.queueOverview}>
            <Text style={styles.queueTitle}>Queue Overview</Text>
            <View style={styles.queueRow}>
              <Text style={styles.queueLabel}>Total cards</Text>
              <Text style={styles.queueValue}>{queueStats.total}</Text>
            </View>
            <View style={styles.queueRow}>
              <Text style={styles.queueLabel}>Mastered</Text>
              <Text style={[styles.queueValue, { color: Colors.success }]}>{queueStats.mastered}</Text>
            </View>
            <View style={styles.queueRow}>
              <Text style={styles.queueLabel}>Learning</Text>
              <Text style={[styles.queueValue, { color: Colors.gold }]}>{queueStats.learning}</Text>
            </View>
            <View style={styles.queueRow}>
              <Text style={styles.queueLabel}>New</Text>
              <Text style={[styles.queueValue, { color: Colors.secondary }]}>{queueStats.new}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={async () => {
            // Schedule next SRS notification for remaining due items
            try {
              const remaining = await getDueCount();
              if (remaining > 0) {
                await scheduleSRSReviewNotification(remaining);
              }
              await scheduleSRSRecurringReminders();
            } catch {}
            router.back();
          }} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review</Text>
        <Text style={styles.headerCount}>{currentIndex + 1}/{dueItems.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex) / dueItems.length) * 100}%` }]} />
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Front - Question */}
          <View style={styles.cardFront}>
            {currentItem?.id?.startsWith("phoneme:") ? (
              <>
                <Text style={styles.cardLabel}>Pronounce this sound</Text>
                <Text style={styles.cardWord}>{currentItem?.word}</Text>
                {currentItem?.context && (
                  <Text style={styles.cardContext}>{currentItem.context}</Text>
                )}
                {/* Listen Button — native speaker audio via ElevenLabs */}
                <TouchableOpacity
                  style={styles.listenBtn}
                  onPress={() => playPhonemeAudio(currentItem)}
                  disabled={isLoadingAudio}
                  activeOpacity={0.7}
                >
                  {isLoadingAudio ? (
                    <ActivityIndicator size="small" color={Colors.secondary} />
                  ) : (
                    <Ionicons
                      name={isPlayingAudio ? "volume-high" : "play-circle"}
                      size={22}
                      color={Colors.secondary}
                    />
                  )}
                  <Text style={styles.listenBtnText}>
                    {isLoadingAudio ? "Loading..." : isPlayingAudio ? "Playing..." : "Listen"}
                  </Text>
                </TouchableOpacity>
                {/* Practice Drill Button — navigate to targeted drill */}
                <TouchableOpacity
                  style={styles.drillBtn}
                  onPress={() => {
                    const phonemeId = currentItem.id.split(":")[2] || "";
                    const language = currentItem.lessonId?.replace("phoneme:", "") || "Spanish";
                    const symbol = currentItem.word.split(" \u2014 ")[0] || "";
                    const name = currentItem.word.split(" \u2014 ")[1] || "";
                    const examples = currentItem.context?.replace("Practice: ", "") || "";
                    router.push({
                      pathname: "/pronunciation-drill" as any,
                      params: {
                        phonemeId,
                        phonemeName: name,
                        phonemeSymbol: symbol,
                        language,
                        examples,
                        tip: currentItem.translation,
                        srsCardId: currentItem.id,
                      },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="fitness" size={18} color={Colors.gold} />
                  <Text style={styles.drillBtnText}>Practice Drill</Text>
                </TouchableOpacity>
                <View style={styles.cardSource}>
                  <Ionicons name="mic" size={12} color={Colors.textMuted} />
                  <Text style={styles.cardSourceText}>
                    {currentItem.lessonId?.replace("phoneme:", "") || "Phoneme"} pronunciation
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.cardLabel}>What does this mean?</Text>
                <Text style={styles.cardWord}>{currentItem?.word}</Text>
                {currentItem?.context && (
                  <Text style={styles.cardContext}>{currentItem.context}</Text>
                )}
                {currentItem?.lessonId && (
                  <View style={styles.cardSource}>
                    <Ionicons name="book" size={12} color={Colors.textMuted} />
                    <Text style={styles.cardSourceText}>From: {currentItem.lessonId}</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Back - Answer */}
          {showAnswer && (
            <Animated.View style={[styles.cardAnswer, answerStyle]}>
              <View style={styles.answerDivider} />
              <Text style={styles.answerLabel}>
                {currentItem?.id?.startsWith("phoneme:") ? "Tip" : "Answer"}
              </Text>
              <Text style={styles.answerText}>{currentItem?.translation}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Tap to reveal */}
        {!showAnswer && (
          <TouchableOpacity style={styles.revealBtn} onPress={flipCard} activeOpacity={0.8}>
            <Ionicons name="eye" size={20} color="#FFFFFF" />
            <Text style={styles.revealBtnText}>Show Answer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rating buttons */}
      {showAnswer && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingPrompt}>
            {currentItem?.id?.startsWith("phoneme:") ? "How well can you produce this sound?" : "How well did you remember?"}
          </Text>
          <View style={styles.ratingButtons}>
            {RATINGS.map((rating) => (
              <TouchableOpacity
                key={rating.label}
                style={[styles.ratingBtn, { borderColor: rating.color + "60" }]}
                onPress={() => handleRating(rating)}
                activeOpacity={0.7}
              >
                <Ionicons name={rating.icon as any} size={22} color={rating.color} />
                <Text style={[styles.ratingLabel, { color: rating.color }]}>{rating.label}</Text>
                <Text style={styles.ratingHint}>
                  {rating.quality <= 2 ? "< 1 min" : rating.quality === 3 ? "~10 min" : rating.quality === 4 ? "1 day" : "4 days"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Session stats footer */}
      <View style={styles.sessionFooter}>
        <View style={styles.sessionStat}>
          <Ionicons name="checkmark" size={14} color={Colors.success} />
          <Text style={styles.sessionStatText}>{sessionStats.correct}</Text>
        </View>
        <View style={styles.sessionStat}>
          <Ionicons name="close" size={14} color={Colors.accent} />
          <Text style={styles.sessionStatText}>{sessionStats.incorrect}</Text>
        </View>
        <View style={styles.sessionStat}>
          <Ionicons name="layers" size={14} color={Colors.textMuted} />
          <Text style={styles.sessionStatText}>{dueItems.length - currentIndex} left</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 12 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  headerCount: { fontSize: FontSize.sm, color: Colors.textMuted, width: 40, textAlign: "right" },
  progressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: Spacing.lg, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 2 },

  // Card
  cardArea: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: 30, alignItems: "center" },
  card: {
    width: "100%", backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: BorderRadius.xl, padding: 28,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    minHeight: 220,
  },
  cardFront: { alignItems: "center" },
  cardLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 16 },
  cardWord: { fontSize: 26, fontWeight: "800", color: Colors.textPrimary, textAlign: "center", lineHeight: 34 },
  cardContext: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 12, fontStyle: "italic", textAlign: "center" },
  cardSource: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 16 },
  cardSourceText: { fontSize: FontSize.xs, color: Colors.textMuted },
  listenBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.secondary + "15", paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: BorderRadius.lg, marginTop: 16, borderWidth: 1, borderColor: Colors.secondary + "30",
  },
  listenBtnText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.secondary },
  drillBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.gold + "15", paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: BorderRadius.lg, marginTop: 10, borderWidth: 1, borderColor: Colors.gold + "30",
  },
  drillBtnText: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.gold },
  cardAnswer: { alignItems: "center", marginTop: 16 },
  answerDivider: { width: 60, height: 2, backgroundColor: Colors.secondary + "40", borderRadius: 1, marginBottom: 16 },
  answerLabel: { fontSize: FontSize.xs, color: Colors.secondary, fontWeight: "600", marginBottom: 8 },
  answerText: { fontSize: 22, fontWeight: "700", color: Colors.success, textAlign: "center" },
  revealBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.secondary, paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: BorderRadius.xl, marginTop: 24,
  },
  revealBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#FFFFFF" },

  // Ratings
  ratingContainer: { paddingHorizontal: Spacing.lg, paddingBottom: 12 },
  ratingPrompt: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: "center", marginBottom: 12 },
  ratingButtons: { flexDirection: "row", gap: 8 },
  ratingBtn: {
    flex: 1, alignItems: "center", paddingVertical: 12,
    borderRadius: BorderRadius.lg, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  ratingLabel: { fontSize: FontSize.xs, fontWeight: "700", marginTop: 4 },
  ratingHint: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  // Session footer
  sessionFooter: {
    flexDirection: "row", justifyContent: "center", gap: 20,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
  },
  sessionStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionStatText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // Complete
  completeContainer: { flex: 1, alignItems: "center", paddingHorizontal: Spacing.lg, paddingTop: 40 },
  completeIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.gold + "20",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  completeTitle: { fontSize: 24, fontWeight: "800", color: Colors.textPrimary, marginBottom: 8 },
  completeSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center", marginBottom: 24 },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.lg, padding: 14, minWidth: 70,
  },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  queueOverview: {
    width: "100%", backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: BorderRadius.lg, padding: 16, marginBottom: 24,
  },
  queueTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  queueRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  queueLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  queueValue: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  doneBtn: {
    backgroundColor: Colors.success, paddingVertical: 16, paddingHorizontal: 48,
    borderRadius: BorderRadius.xl,
  },
  doneBtnText: { fontSize: FontSize.lg, fontWeight: "700", color: "#FFFFFF" },
});
