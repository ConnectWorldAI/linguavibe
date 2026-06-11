import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { calculateNextReview as srsCalculateNextReview, type ReviewQuality, type SRSItem, loadReviewQueue } from "@/lib/srs";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

interface Flashcard {
  id: string;
  front: string;
  back: string;
  example: string;
  category: string;
  difficulty: number; // 0-4 (SM-2 easiness factor proxy)
  nextReview: number; // timestamp
  interval: number; // days
  repetitions: number;
}

const INITIAL_CARDS: Flashcard[] = [
  { id: "1", front: "¿Qué lo que?", back: "What's up? (Dominican slang)", example: "\"¡Oye! ¿Qué lo que, hermano?\"", category: "Greetings", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "2", front: "Vaina", back: "Thing / Stuff (Dominican)", example: "\"Pásame esa vaina.\"", category: "Slang", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "3", front: "Colmado", back: "Corner store / Bodega", example: "\"Voy al colmado a comprar agua.\"", category: "Places", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "4", front: "Guagua", back: "Bus (Dominican/Caribbean)", example: "\"Tomo la guagua para ir al trabajo.\"", category: "Transport", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "5", front: "Tiguere", back: "Clever/street-smart person", example: "\"Ese tipo es un tiguere.\"", category: "Slang", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "6", front: "Chin", back: "A little bit", example: "\"Dame un chin de café.\"", category: "Quantities", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "7", front: "Jevi", back: "Cool / Awesome", example: "\"Esa fiesta estuvo jevi.\"", category: "Adjectives", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "8", front: "Pariguayo", back: "Boring person / Party pooper", example: "\"No seas pariguayo, ven a bailar.\"", category: "Slang", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "9", front: "Motoconcho", back: "Motorcycle taxi", example: "\"Cogí un motoconcho hasta la esquina.\"", category: "Transport", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "10", front: "Klok", back: "Okay / Cool (agreement)", example: "\"¿Nos vemos a las 8? — Klok.\"", category: "Slang", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "11", front: "Reunión", back: "Meeting (business)", example: "\"Tenemos una reunión a las 10.\"", category: "Business", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "12", front: "Presupuesto", back: "Budget", example: "\"El presupuesto fue aprobado.\"", category: "Business", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "13", front: "Plazo", back: "Deadline / Term", example: "\"El plazo es el viernes.\"", category: "Business", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "14", front: "Cotidiano", back: "Daily / Everyday", example: "\"Es parte de la vida cotidiana.\"", category: "Adjectives", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
  { id: "15", front: "Madrugada", back: "Early morning (before dawn)", example: "\"Llegamos de madrugada.\"", category: "Time", difficulty: 2.5, nextReview: 0, interval: 1, repetitions: 0 },
];

const STORAGE_KEY = "flashcard_deck";
const STATS_KEY = "flashcard_stats";

// SM-2 algorithm — delegates to shared lib/srs.ts engine
function calculateNextReview(card: Flashcard, quality: number): Flashcard {
  // Map the card to SRSItem format for the shared engine
  const srsItem: SRSItem = {
    id: card.id,
    word: card.front,
    translation: card.back,
    context: card.example,
    easeFactor: card.difficulty,
    interval: card.interval,
    repetitions: card.repetitions,
    nextReview: card.nextReview,
    lastScore: quality as ReviewQuality,
    createdAt: 0,
    lastReviewedAt: Date.now(),
  };

  // Use the shared SM-2 engine (quality 0-5 scale; we map 0-4 to 0-5)
  const mappedQuality = Math.min(5, quality) as ReviewQuality;
  const result = srsCalculateNextReview(srsItem, mappedQuality);

  return {
    ...card,
    difficulty: result.easeFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    nextReview: result.nextReview,
  };
}

// Get urgency color based on when card is due
function getUrgencyColor(nextReview: number): string {
  const now = Date.now();
  const hoursUntilDue = (nextReview - now) / (1000 * 60 * 60);
  if (hoursUntilDue < 0) return Colors.error; // overdue
  if (hoursUntilDue < 24) return Colors.gold; // due today
  return Colors.success; // upcoming
}

function getNextReviewLabel(nextReview: number): string {
  if (nextReview === 0) return "New";
  const now = Date.now();
  const diff = nextReview - now;
  if (diff <= 0) return "Due now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// Legacy compatibility — this block is now unused but kept for reference
function _legacyCalculateNextReview(card: Flashcard, quality: number): Flashcard {
  let { difficulty, interval, repetitions } = card;

  if (quality < 2) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * difficulty);
    repetitions++;
  }
  difficulty = Math.max(1.3, difficulty + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02)));
  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
  return { ...card, difficulty, interval, repetitions, nextReview };
}

type DeckFilter = "all" | "song_words" | "lessons";

export default function FlashcardReviewScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>(INITIAL_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, mastered: 0, again: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [deckFilter, setDeckFilter] = useState<DeckFilter>("all");
  const [songWordCount, setSongWordCount] = useState(0);

  const flipProgress = useSharedValue(0);
  const cardScale = useSharedValue(1);

  // Load saved deck (with Song Words filter support)
  useEffect(() => {
    const loadDeck = async () => {
      try {
        if (deckFilter === "song_words") {
          // Load from the canonical SRS queue, filter by song lessonId
          const srsQueue = await loadReviewQueue();
          const songItems = srsQueue.filter((item) => item.lessonId?.startsWith("song:"));
          setSongWordCount(songItems.length);
          const dueItems = songItems.filter((item) => item.nextReview <= Date.now());
          const songCards: Flashcard[] = dueItems.map((item) => ({
            id: item.id,
            front: item.word,
            back: item.translation,
            example: item.context || "",
            category: "Song Words",
            difficulty: item.easeFactor,
            nextReview: item.nextReview,
            interval: item.interval,
            repetitions: item.repetitions,
          }));
          if (songCards.length > 0) setCards(songCards);
          else setCards([{ id: "empty", front: "No song words due", back: "Save words by long-pressing in karaoke mode", example: "", category: "Song Words", difficulty: 2.5, nextReview: Date.now() + 86400000, interval: 1, repetitions: 0 }]);
        } else {
          const saved = await AsyncStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as Flashcard[];
            const due = parsed.filter((c) => c.nextReview <= Date.now());
            if (due.length > 0) setCards(due);
          }
          // Also count song words for badge
          const srsQueue = await loadReviewQueue();
          setSongWordCount(srsQueue.filter((item) => item.lessonId?.startsWith("song:")).length);
        }
      } catch (e) {}
    };
    loadDeck();
  }, [deckFilter]);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? currentIndex / cards.length : 0;

  const handleFlip = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped(!isFlipped);
    flipProgress.value = withTiming(isFlipped ? 0 : 1, { duration: 300, easing: Easing.inOut(Easing.ease) });
  };

  const handleRate = async (quality: number) => {
    if (Platform.OS !== "web") {
      if (quality >= 3) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    const updated = calculateNextReview(currentCard, quality);
    const newCards = [...cards];
    newCards[currentIndex] = updated;

    // Update stats
    const newStats = { ...sessionStats, reviewed: sessionStats.reviewed + 1 };
    if (quality >= 3) newStats.mastered++;
    if (quality === 0) newStats.again++;
    setSessionStats(newStats);

    // Save to AsyncStorage
    try {
      const allCards = await AsyncStorage.getItem(STORAGE_KEY);
      let fullDeck = allCards ? JSON.parse(allCards) as Flashcard[] : INITIAL_CARDS;
      const idx = fullDeck.findIndex((c) => c.id === updated.id);
      if (idx >= 0) fullDeck[idx] = updated;
      else fullDeck.push(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fullDeck));
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch (e) {}

    // Animate card exit
    cardScale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withTiming(1, { duration: 150 })
    );

    // Next card
    if (currentIndex + 1 >= cards.length) {
      setIsComplete(true);
    } else {
      setIsFlipped(false);
      flipProgress.value = withTiming(0, { duration: 200 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const frontStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipProgress.value, [0, 0.5, 1], [1, 0, 0]),
    transform: [
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipProgress.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` },
    ],
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  if (isComplete) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeEmoji}>🎯</Text>
          <Text style={styles.completeTitle}>Session Complete!</Text>
          <Text style={styles.completeSubtitle}>Great job reviewing your flashcards</Text>

          <View style={styles.completeStats}>
            <View style={styles.completeStatItem}>
              <Text style={styles.completeStatNumber}>{sessionStats.reviewed}</Text>
              <Text style={styles.completeStatLabel}>Reviewed</Text>
            </View>
            <View style={styles.completeStatItem}>
              <Text style={[styles.completeStatNumber, { color: Colors.success }]}>{sessionStats.mastered}</Text>
              <Text style={styles.completeStatLabel}>Mastered</Text>
            </View>
            <View style={styles.completeStatItem}>
              <Text style={[styles.completeStatNumber, { color: Colors.error }]}>{sessionStats.again}</Text>
              <Text style={styles.completeStatLabel}>Again</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
              flipProgress.value = 0;
              setSessionStats({ reviewed: 0, mastered: 0, again: 0 });
              setIsComplete(false);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.completeBtnText}>Review Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.customDeckBtn} onPress={() => router.push("/custom-deck" as any)} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={16} color={Colors.secondary} />
            <Text style={styles.customDeckBtnText}>My Custom Decks</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Flashcards</Text>
          <Text style={styles.headerSub}>{currentIndex + 1} / {cards.length}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.streakBadge}>🔥 {sessionStats.reviewed}</Text>
        </View>
      </View>

      {/* Deck Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, deckFilter === "all" && styles.filterTabActive]}
          onPress={() => { setDeckFilter("all"); setCurrentIndex(0); setIsFlipped(false); flipProgress.value = 0; }}
        >
          <Ionicons name="layers" size={14} color={deckFilter === "all" ? Colors.secondary : Colors.textMuted} />
          <Text style={[styles.filterTabText, deckFilter === "all" && styles.filterTabTextActive]}>All Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, deckFilter === "song_words" && styles.filterTabActive]}
          onPress={() => { setDeckFilter("song_words"); setCurrentIndex(0); setIsFlipped(false); flipProgress.value = 0; }}
        >
          <Ionicons name="musical-notes" size={14} color={deckFilter === "song_words" ? Colors.gold : Colors.textMuted} />
          <Text style={[styles.filterTabText, deckFilter === "song_words" && { color: Colors.gold }]}>Song Words</Text>
          {songWordCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{songWordCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <TouchableOpacity onPress={handleFlip} activeOpacity={0.95} style={styles.cardTouchable}>
          <Animated.View style={[styles.cardWrapper, cardAnimStyle]}>
            {/* Front */}
            <Animated.View style={[styles.card, styles.cardFront, frontStyle]}>
              <View style={styles.cardCategory}>
                <Text style={styles.cardCategoryText}>{currentCard?.category}</Text>
                <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(currentCard?.nextReview || 0) }]} />
              </View>
              <Text style={styles.cardFrontText}>{currentCard?.front}</Text>
              <View style={styles.nextReviewRow}>
                <Ionicons name="time-outline" size={12} color={getUrgencyColor(currentCard?.nextReview || 0)} />
                <Text style={[styles.nextReviewText, { color: getUrgencyColor(currentCard?.nextReview || 0) }]}>
                  {getNextReviewLabel(currentCard?.nextReview || 0)}
                </Text>
              </View>
              <Text style={styles.tapHint}>Tap to reveal</Text>
            </Animated.View>

            {/* Back */}
            <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
              <View style={styles.cardCategory}>
                <Text style={styles.cardCategoryText}>{currentCard?.category}</Text>
              </View>
              <Text style={styles.cardBackText}>{currentCard?.back}</Text>
              <View style={styles.exampleBox}>
                <Ionicons name="chatbubble-outline" size={14} color={Colors.secondary} />
                <Text style={styles.exampleText}>{currentCard?.example}</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Rating Buttons */}
      {isFlipped && (
        <View style={styles.ratingRow}>
          <TouchableOpacity style={[styles.rateBtn, styles.rateBtnAgain]} onPress={() => handleRate(0)}>
            <Ionicons name="refresh" size={18} color={Colors.error} />
            <Text style={[styles.rateBtnText, { color: Colors.error }]}>Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rateBtn, styles.rateBtnHard]} onPress={() => handleRate(2)}>
            <Ionicons name="alert-circle" size={18} color={Colors.warning} />
            <Text style={[styles.rateBtnText, { color: Colors.warning }]}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rateBtn, styles.rateBtnGood]} onPress={() => handleRate(3)}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />
            <Text style={[styles.rateBtnText, { color: Colors.secondary }]}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rateBtn, styles.rateBtnEasy]} onPress={() => handleRate(4)}>
            <Ionicons name="rocket" size={18} color={Colors.success} />
            <Text style={[styles.rateBtnText, { color: Colors.success }]}>Easy</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Stats */}
      <View style={styles.bottomStats}>
        <View style={styles.bottomStatItem}>
          <Ionicons name="layers" size={14} color={Colors.textMuted} />
          <Text style={styles.bottomStatText}>{cards.length - currentIndex} remaining</Text>
        </View>
        <View style={styles.bottomStatItem}>
          <Ionicons name="checkmark-done" size={14} color={Colors.success} />
          <Text style={styles.bottomStatText}>{sessionStats.mastered} mastered</Text>
        </View>
      </View>
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
  headerRight: { width: 40, alignItems: "center" },
  streakBadge: { fontSize: 14, fontWeight: "700", color: Colors.gold },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 2 },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cardTouchable: { width: "100%", maxWidth: 360, aspectRatio: 0.7 },
  cardWrapper: { flex: 1 },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    padding: 28,
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
    borderWidth: 1,
  },
  cardFront: {
    backgroundColor: Colors.surface,
    borderColor: Colors.glowBorder,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  cardBack: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: "rgba(0,230,118,0.2)",
  },
  cardCategory: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: Colors.glowSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nextReviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    position: "absolute",
    top: 16,
    right: 16,
  },
  nextReviewText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cardCategoryText: { fontSize: 11, fontWeight: "600", color: Colors.secondary },
  cardFrontText: { fontSize: 28, fontWeight: "900", color: Colors.textPrimary, textAlign: "center" },
  tapHint: { position: "absolute", bottom: 20, fontSize: 12, color: Colors.textMuted },
  cardBackText: { fontSize: 22, fontWeight: "700", color: Colors.success, textAlign: "center", marginBottom: 20 },
  exampleBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(0,170,255,0.06)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  exampleText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 20, fontStyle: "italic" },
  ratingRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  rateBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
  },
  rateBtnAgain: { backgroundColor: "rgba(255,82,82,0.08)", borderColor: "rgba(255,82,82,0.2)" },
  rateBtnHard: { backgroundColor: "rgba(255,159,67,0.08)", borderColor: "rgba(255,159,67,0.2)" },
  rateBtnGood: { backgroundColor: Colors.glowSubtle, borderColor: Colors.glowBorder },
  rateBtnEasy: { backgroundColor: "rgba(0,230,118,0.08)", borderColor: "rgba(0,230,118,0.2)" },
  rateBtnText: { fontSize: 11, fontWeight: "700" },
  bottomStats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingBottom: 20,
  },
  bottomStatItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  bottomStatText: { fontSize: 12, color: Colors.textMuted },
  // Complete screen
  completeContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  completeEmoji: { fontSize: 64, marginBottom: 16 },
  completeTitle: { fontSize: 26, fontWeight: "900", color: Colors.textPrimary, marginBottom: 8 },
  completeSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 32 },
  completeStats: { flexDirection: "row", gap: 24, marginBottom: 32 },
  completeStatItem: { alignItems: "center" },
  completeStatNumber: { fontSize: 28, fontWeight: "900", color: Colors.textPrimary },
  completeStatLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    marginBottom: 12,
  },
  completeBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  doneBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    width: "100%",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  doneBtnText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  customDeckBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, marginTop: 4 },
  customDeckBtnText: { fontSize: 13, fontWeight: "600", color: Colors.secondary },

  // Filter tabs
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    borderColor: Colors.secondary,
    backgroundColor: "rgba(0,170,255,0.08)",
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  filterTabTextActive: {
    color: Colors.secondary,
  },
  filterBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.primary,
  },
});
