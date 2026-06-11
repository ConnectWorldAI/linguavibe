/**
 * Spaced Repetition Visual Vocab Cards
 * Tinder-style swipe to learn vocabulary with AI-generated images,
 * spaced repetition scheduling, and "Words Known" counter.
 * Inspired by BigBean's visual approach + Anki's SRS algorithm.
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface VocabCard {
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  language: string;
  flag: string;
  example: string;
  exampleTranslation: string;
  category: string;
  level: string;
  imageEmoji: string;
  difficulty: "new" | "learning" | "review" | "mastered";
  nextReview: string;
  streak: number;
}

interface DeckInfo {
  id: string;
  name: string;
  language: string;
  flag: string;
  totalCards: number;
  newCards: number;
  reviewCards: number;
  masteredCards: number;
  lastStudied: string;
}

// ─── DATA ───────────────────────────────────────────────────────────────────

const VOCAB_CARDS: VocabCard[] = [
  { id: "1", word: "mariposa", translation: "butterfly", pronunciation: "mah-ree-POH-sah", language: "Spanish", flag: "🇪🇸", example: "La mariposa vuela sobre las flores.", exampleTranslation: "The butterfly flies over the flowers.", category: "Nature", level: "A2", imageEmoji: "🦋", difficulty: "new", nextReview: "now", streak: 0 },
  { id: "2", word: "papillon", translation: "butterfly", pronunciation: "pa-pee-YON", language: "French", flag: "🇫🇷", example: "Le papillon est très coloré.", exampleTranslation: "The butterfly is very colorful.", category: "Nature", level: "A2", imageEmoji: "🦋", difficulty: "new", nextReview: "now", streak: 0 },
  { id: "3", word: "蝶", translation: "butterfly", pronunciation: "chō", language: "Japanese", flag: "🇯🇵", example: "蝶が花の上を飛んでいる。", exampleTranslation: "A butterfly is flying over the flowers.", category: "Nature", level: "A2", imageEmoji: "🦋", difficulty: "new", nextReview: "now", streak: 0 },
  { id: "4", word: "atardecer", translation: "sunset", pronunciation: "ah-tar-deh-SER", language: "Spanish", flag: "🇪🇸", example: "El atardecer en la playa es hermoso.", exampleTranslation: "The sunset at the beach is beautiful.", category: "Nature", level: "B1", imageEmoji: "🌅", difficulty: "learning", nextReview: "now", streak: 1 },
  { id: "5", word: "강아지", translation: "puppy", pronunciation: "gang-a-ji", language: "Korean", flag: "🇰🇷", example: "강아지가 너무 귀여워요.", exampleTranslation: "The puppy is so cute.", category: "Animals", level: "A1", imageEmoji: "🐶", difficulty: "new", nextReview: "now", streak: 0 },
  { id: "6", word: "saudade", translation: "longing/nostalgia", pronunciation: "sow-DAH-jee", language: "Portuguese", flag: "🇧🇷", example: "Tenho saudade da minha família.", exampleTranslation: "I miss my family.", category: "Emotions", level: "B2", imageEmoji: "💭", difficulty: "learning", nextReview: "now", streak: 2 },
  { id: "7", word: "Gemütlichkeit", translation: "coziness/comfort", pronunciation: "geh-MOOT-likh-kite", language: "German", flag: "🇩🇪", example: "Die Gemütlichkeit des Cafés war wunderbar.", exampleTranslation: "The coziness of the café was wonderful.", category: "Culture", level: "B2", imageEmoji: "☕", difficulty: "review", nextReview: "now", streak: 4 },
  { id: "8", word: "حبيبي", translation: "my love/darling", pronunciation: "ha-BEE-bee", language: "Arabic", flag: "🇪🇬", example: "أنا أحبك يا حبيبي", exampleTranslation: "I love you, my darling.", category: "Relationships", level: "A2", imageEmoji: "❤️", difficulty: "new", nextReview: "now", streak: 0 },
  { id: "9", word: "木漏れ日", translation: "sunlight through leaves", pronunciation: "ko-mo-re-bi", language: "Japanese", flag: "🇯🇵", example: "木漏れ日が美しい午後でした。", exampleTranslation: "It was a beautiful afternoon with sunlight filtering through the leaves.", category: "Nature", level: "C1", imageEmoji: "🌿", difficulty: "new", nextReview: "now", streak: 0 },
  { id: "10", word: "échapper belle", translation: "narrow escape", pronunciation: "ay-sha-PAY bel", language: "French", flag: "🇫🇷", example: "On l'a échappé belle!", exampleTranslation: "That was a close call!", category: "Idioms", level: "B2", imageEmoji: "😅", difficulty: "review", nextReview: "now", streak: 3 },
];

const DECKS: DeckInfo[] = [
  { id: "d1", name: "Spanish Essentials", language: "Spanish", flag: "🇪🇸", totalCards: 500, newCards: 45, reviewCards: 23, masteredCards: 432, lastStudied: "2h ago" },
  { id: "d2", name: "French Daily", language: "French", flag: "🇫🇷", totalCards: 350, newCards: 30, reviewCards: 18, masteredCards: 302, lastStudied: "5h ago" },
  { id: "d3", name: "Japanese Kanji", language: "Japanese", flag: "🇯🇵", totalCards: 800, newCards: 120, reviewCards: 45, masteredCards: 635, lastStudied: "1d ago" },
  { id: "d4", name: "Korean Basics", language: "Korean", flag: "🇰🇷", totalCards: 250, newCards: 60, reviewCards: 12, masteredCards: 178, lastStudied: "3h ago" },
  { id: "d5", name: "Portuguese Slang", language: "Portuguese", flag: "🇧🇷", totalCards: 150, newCards: 25, reviewCards: 8, masteredCards: 117, lastStudied: "1d ago" },
  { id: "d6", name: "Arabic Conversations", language: "Arabic", flag: "🇪🇬", totalCards: 200, newCards: 40, reviewCards: 15, masteredCards: 145, lastStudied: "2d ago" },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function VocabCardsScreen() {
  const colors = useColors();
  const [view, setView] = useState<"decks" | "study" | "stats">("decks");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [wordsKnown, setWordsKnown] = useState(1847);
  const [todayReviewed, setTodayReviewed] = useState(0);
  const [todayNew, setTodayNew] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentCard = VOCAB_CARDS[currentCardIndex];

  const flipCard = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAnswer(!showAnswer);
    Animated.spring(flipAnim, {
      toValue: showAnswer ? 0 : 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const rateCard = (rating: "again" | "hard" | "good" | "easy") => {
    if (Platform.OS !== "web") {
      if (rating === "easy" || rating === "good") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }

    // Animate swipe
    const direction = rating === "again" ? -1 : rating === "easy" ? 1 : 0;
    Animated.sequence([
      Animated.timing(swipeAnim, { toValue: direction * SCREEN_WIDTH, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      // Update stats
      if (rating === "good" || rating === "easy") {
        setWordsKnown((w) => w + 1);
        setSessionStreak((s) => s + 1);
      } else {
        setSessionStreak(0);
      }
      setTodayReviewed((r) => r + 1);
      if (currentCard.difficulty === "new") setTodayNew((n) => n + 1);

      // Next card
      setCurrentCardIndex((i) => (i + 1) % VOCAB_CARDS.length);
      setShowAnswer(false);
      flipAnim.setValue(0);
      swipeAnim.setValue(0);
      scaleAnim.setValue(1);
    });
  };

  // ─── DECKS VIEW ───────────────────────────────────────────────────────────

  const renderDecks = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Words Known Counter */}
      <View style={[styles.counterCard, { backgroundColor: colors.primary + "10" }]}>
        <View style={styles.counterMain}>
          <Text style={[styles.counterNumber, { color: colors.primary }]}>{wordsKnown.toLocaleString()}</Text>
          <Text style={[styles.counterLabel, { color: colors.muted }]}>Words Known</Text>
        </View>
        <View style={styles.counterStats}>
          <View style={styles.counterStat}>
            <Text style={[styles.counterStatNum, { color: "#10B981" }]}>{todayNew}</Text>
            <Text style={[styles.counterStatLabel, { color: colors.muted }]}>New Today</Text>
          </View>
          <View style={styles.counterStat}>
            <Text style={[styles.counterStatNum, { color: "#3B82F6" }]}>{todayReviewed}</Text>
            <Text style={[styles.counterStatLabel, { color: colors.muted }]}>Reviewed</Text>
          </View>
          <View style={styles.counterStat}>
            <Text style={[styles.counterStatNum, { color: "#F59E0B" }]}>7</Text>
            <Text style={[styles.counterStatLabel, { color: colors.muted }]}>Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Quick Study Button */}
      <TouchableOpacity
        style={[styles.quickStudyBtn, { backgroundColor: colors.primary }]}
        onPress={() => setView("study")}
        activeOpacity={0.8}
      >
        <Ionicons name="flash" size={22} color="#FFF" />
        <View>
          <Text style={styles.quickStudyText}>Quick Study</Text>
          <Text style={styles.quickStudySub}>23 cards due for review</Text>
        </View>
      </TouchableOpacity>

      {/* Decks */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Decks</Text>
      {DECKS.map((deck) => (
        <TouchableOpacity
          key={deck.id}
          style={[styles.deckCard, { backgroundColor: colors.surface }]}
          onPress={() => setView("study")}
          activeOpacity={0.7}
        >
          <Text style={styles.deckFlag}>{deck.flag}</Text>
          <View style={styles.deckInfo}>
            <Text style={[styles.deckName, { color: colors.foreground }]}>{deck.name}</Text>
            <View style={styles.deckMeta}>
              <Text style={[styles.deckMetaText, { color: "#10B981" }]}>{deck.newCards} new</Text>
              <Text style={[styles.deckMetaText, { color: "#F59E0B" }]}>{deck.reviewCards} review</Text>
              <Text style={[styles.deckMetaText, { color: colors.muted }]}>{deck.masteredCards} mastered</Text>
            </View>
            {/* Progress Bar */}
            <View style={[styles.deckProgress, { backgroundColor: colors.border }]}>
              <View style={[styles.deckProgressFill, { width: `${(deck.masteredCards / deck.totalCards) * 100}%`, backgroundColor: "#10B981" }]} />
            </View>
          </View>
          <Text style={[styles.deckTime, { color: colors.muted }]}>{deck.lastStudied}</Text>
        </TouchableOpacity>
      ))}

      {/* SRS Info */}
      <View style={[styles.srsInfo, { backgroundColor: colors.surface }]}>
        <Text style={[styles.srsTitle, { color: colors.foreground }]}>🧠 Spaced Repetition</Text>
        <Text style={[styles.srsDesc, { color: colors.muted }]}>
          Cards you know well appear less often. Cards you struggle with appear more frequently. This scientifically-proven method ensures you remember words forever, not just for a test.
        </Text>
        <View style={styles.srsSchedule}>
          {[
            { label: "New", interval: "Same day", color: "#10B981" },
            { label: "Learning", interval: "1-3 days", color: "#F59E0B" },
            { label: "Review", interval: "1-4 weeks", color: "#3B82F6" },
            { label: "Mastered", interval: "1-6 months", color: "#8B5CF6" },
          ].map((stage) => (
            <View key={stage.label} style={styles.srsStage}>
              <View style={[styles.srsDot, { backgroundColor: stage.color }]} />
              <Text style={[styles.srsStageLabel, { color: colors.foreground }]}>{stage.label}</Text>
              <Text style={[styles.srsStageInterval, { color: colors.muted }]}>{stage.interval}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // ─── STUDY VIEW ───────────────────────────────────────────────────────────

  const renderStudy = () => {
    if (!currentCard) return null;

    const frontInterpolate = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });
    const backInterpolate = flipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["180deg", "360deg"],
    });

    return (
      <View style={styles.studyContainer}>
        {/* Session Stats */}
        <View style={styles.sessionHeader}>
          <View style={styles.sessionStat}>
            <Text style={[styles.sessionStatNum, { color: colors.primary }]}>{todayReviewed}</Text>
            <Text style={[styles.sessionStatLabel, { color: colors.muted }]}>Done</Text>
          </View>
          {sessionStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: "#F59E0B20" }]}>
              <Text style={styles.streakText}>🔥 {sessionStreak}</Text>
            </View>
          )}
          <View style={styles.sessionStat}>
            <Text style={[styles.sessionStatNum, { color: colors.muted }]}>{VOCAB_CARDS.length - currentCardIndex}</Text>
            <Text style={[styles.sessionStatLabel, { color: colors.muted }]}>Left</Text>
          </View>
        </View>

        {/* Card */}
        <TouchableOpacity
          onPress={flipCard}
          activeOpacity={0.95}
          style={styles.cardWrapper}
        >
          <Animated.View style={[
            styles.card,
            { backgroundColor: colors.surface, transform: [{ translateX: swipeAnim }, { scale: scaleAnim }] }
          ]}>
            {!showAnswer ? (
              // Front of card
              <View style={styles.cardFront}>
                <View style={[styles.cardDiffBadge, { backgroundColor: currentCard.difficulty === "new" ? "#10B98120" : currentCard.difficulty === "learning" ? "#F59E0B20" : "#3B82F620" }]}>
                  <Text style={[styles.cardDiffText, { color: currentCard.difficulty === "new" ? "#10B981" : currentCard.difficulty === "learning" ? "#F59E0B" : "#3B82F6" }]}>
                    {currentCard.difficulty === "new" ? "🆕 New" : currentCard.difficulty === "learning" ? "📖 Learning" : "🔄 Review"}
                  </Text>
                </View>
                <Text style={styles.cardEmoji}>{currentCard.imageEmoji}</Text>
                <Text style={[styles.cardWord, { color: colors.foreground }]}>{currentCard.word}</Text>
                <Text style={[styles.cardPronunciation, { color: colors.primary }]}>{currentCard.pronunciation}</Text>
                <View style={styles.cardLangRow}>
                  <Text style={styles.cardFlag}>{currentCard.flag}</Text>
                  <Text style={[styles.cardLang, { color: colors.muted }]}>{currentCard.language} • {currentCard.level}</Text>
                </View>
                <Text style={[styles.tapHint, { color: colors.muted }]}>Tap to reveal answer</Text>
              </View>
            ) : (
              // Back of card
              <View style={styles.cardBack}>
                <Text style={styles.cardEmoji}>{currentCard.imageEmoji}</Text>
                <Text style={[styles.cardWord, { color: colors.foreground }]}>{currentCard.word}</Text>
                <Text style={[styles.cardTranslation, { color: colors.primary }]}>{currentCard.translation}</Text>
                <View style={[styles.exampleBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.exampleText, { color: colors.foreground }]}>{currentCard.example}</Text>
                  <Text style={[styles.exampleTranslation, { color: colors.muted }]}>{currentCard.exampleTranslation}</Text>
                </View>
                <Text style={[styles.cardCategory, { color: colors.muted }]}>📁 {currentCard.category}</Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Rating Buttons (shown when answer is revealed) */}
        {showAnswer && (
          <View style={styles.ratingContainer}>
            <TouchableOpacity
              style={[styles.ratingBtn, { backgroundColor: "#EF444420" }]}
              onPress={() => rateCard("again")}
              activeOpacity={0.7}
            >
              <Text style={[styles.ratingEmoji]}>😵</Text>
              <Text style={[styles.ratingLabel, { color: "#EF4444" }]}>Again</Text>
              <Text style={[styles.ratingInterval, { color: colors.muted }]}>1 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingBtn, { backgroundColor: "#F59E0B20" }]}
              onPress={() => rateCard("hard")}
              activeOpacity={0.7}
            >
              <Text style={[styles.ratingEmoji]}>🤔</Text>
              <Text style={[styles.ratingLabel, { color: "#F59E0B" }]}>Hard</Text>
              <Text style={[styles.ratingInterval, { color: colors.muted }]}>10 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingBtn, { backgroundColor: "#10B98120" }]}
              onPress={() => rateCard("good")}
              activeOpacity={0.7}
            >
              <Text style={[styles.ratingEmoji]}>😊</Text>
              <Text style={[styles.ratingLabel, { color: "#10B981" }]}>Good</Text>
              <Text style={[styles.ratingInterval, { color: colors.muted }]}>1 day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingBtn, { backgroundColor: "#3B82F620" }]}
              onPress={() => rateCard("easy")}
              activeOpacity={0.7}
            >
              <Text style={[styles.ratingEmoji]}>🤩</Text>
              <Text style={[styles.ratingLabel, { color: "#3B82F6" }]}>Easy</Text>
              <Text style={[styles.ratingInterval, { color: colors.muted }]}>4 days</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (view === "study") setView("decks");
          else router.back();
        }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {view === "decks" ? "📚 Vocab Cards" : view === "study" ? "Studying..." : "Stats"}
        </Text>
        <TouchableOpacity onPress={() => setView(view === "stats" ? "decks" : "stats")}>
          <Ionicons name="stats-chart" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {view === "decks" && renderDecks()}
      {view === "study" && renderStudy()}
    </ScreenContainer>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  // Counter
  counterCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  counterMain: { alignItems: "center", marginBottom: 16 },
  counterNumber: { fontSize: 42, fontWeight: "900" },
  counterLabel: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  counterStats: { flexDirection: "row", justifyContent: "space-around" },
  counterStat: { alignItems: "center" },
  counterStatNum: { fontSize: 18, fontWeight: "800" },
  counterStatLabel: { fontSize: 10, marginTop: 2 },
  // Quick Study
  quickStudyBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, marginBottom: 20 },
  quickStudyText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  quickStudySub: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  // Deck Cards
  deckCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
  deckFlag: { fontSize: 28 },
  deckInfo: { flex: 1 },
  deckName: { fontSize: 14, fontWeight: "700" },
  deckMeta: { flexDirection: "row", gap: 8, marginTop: 4 },
  deckMetaText: { fontSize: 10, fontWeight: "600" },
  deckProgress: { height: 3, borderRadius: 2, marginTop: 6, overflow: "hidden" },
  deckProgressFill: { height: "100%", borderRadius: 2 },
  deckTime: { fontSize: 10 },
  // SRS Info
  srsInfo: { borderRadius: 16, padding: 16, marginTop: 16 },
  srsTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  srsDesc: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  srsSchedule: { gap: 8 },
  srsStage: { flexDirection: "row", alignItems: "center", gap: 8 },
  srsDot: { width: 8, height: 8, borderRadius: 4 },
  srsStageLabel: { fontSize: 12, fontWeight: "600", width: 70 },
  srsStageInterval: { fontSize: 11 },
  // Study
  studyContainer: { flex: 1, padding: 16 },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sessionStat: { alignItems: "center" },
  sessionStatNum: { fontSize: 18, fontWeight: "800" },
  sessionStatLabel: { fontSize: 10 },
  streakBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  streakText: { fontSize: 14, fontWeight: "700", color: "#F59E0B" },
  cardWrapper: { flex: 1, marginBottom: 16 },
  card: { flex: 1, borderRadius: 20, padding: 24, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  cardFront: { alignItems: "center", gap: 12 },
  cardBack: { alignItems: "center", gap: 12 },
  cardDiffBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  cardDiffText: { fontSize: 11, fontWeight: "700" },
  cardEmoji: { fontSize: 56 },
  cardWord: { fontSize: 32, fontWeight: "800" },
  cardPronunciation: { fontSize: 14, fontWeight: "500" },
  cardLangRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardFlag: { fontSize: 16 },
  cardLang: { fontSize: 12 },
  tapHint: { fontSize: 12, marginTop: 12 },
  cardTranslation: { fontSize: 22, fontWeight: "700" },
  exampleBox: { borderRadius: 12, padding: 14, width: "100%", marginTop: 8 },
  exampleText: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  exampleTranslation: { fontSize: 12, marginTop: 6, lineHeight: 18 },
  cardCategory: { fontSize: 11, marginTop: 8 },
  // Rating
  ratingContainer: { flexDirection: "row", gap: 8 },
  ratingBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  ratingEmoji: { fontSize: 20 },
  ratingLabel: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  ratingInterval: { fontSize: 9, marginTop: 2 },
});
