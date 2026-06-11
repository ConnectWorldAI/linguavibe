/**
 * Flashcard SRS System Screen
 * 
 * Auto-generates study flashcards from translation history with
 * spaced repetition using the Leitner box method. Cards progress
 * through 5 boxes based on correct/incorrect answers.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
  Dimensions, FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/Colors";
import {
  type FSRSRating,
  type FSRSCard,
  getSchedulingOptions,
  formatInterval,
  getFSRSStats,
  getDueFSRSCards,
  reviewFSRSCard,
  forgettingCurve,
} from "@/lib/fsrs-engine";
import { FeatureGateBanner } from "@/components/feature-gate-banner";
import { onFlashcardAnswer, onSessionStart, onSessionEnd } from "@/lib/adaptive-engine-hooks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Flashcard = {
  id: string;
  front: string;      // Target language phrase
  back: string;       // English translation
  box: number;        // Leitner box 1-5
  nextReview: string; // ISO date for next review
  timesCorrect: number;
  timesIncorrect: number;
  createdAt: string;
  source: "translation" | "journal" | "phrasebook" | "manual";
};

type SessionStats = { correct: number; incorrect: number; total: number };

const STORAGE_KEY = "linguavibe_flashcards";
const BOX_INTERVALS = [0, 1, 3, 7, 14, 30]; // days between reviews per box

export default function FlashcardSRSScreen() {
  const router = useRouter();
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, incorrect: 0, total: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [viewMode, setViewMode] = useState<"study" | "deck">("deck");
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const cards: Flashcard[] = JSON.parse(data);
        setAllCards(cards);
        const now = new Date().toISOString();
        const due = cards.filter(c => c.nextReview <= now);
        setDueCards(due);
      } else {
        // Generate starter cards from common phrases
        const starterCards = generateStarterCards();
        setAllCards(starterCards);
        setDueCards(starterCards);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(starterCards));
      }
    } catch {}
  };

  const generateStarterCards = (): Flashcard[] => {
    const phrases = [
      { front: "¿Cómo estás?", back: "How are you?" },
      { front: "Buenos días", back: "Good morning" },
      { front: "¿Dónde está el baño?", back: "Where is the bathroom?" },
      { front: "La cuenta, por favor", back: "The check, please" },
      { front: "No entiendo", back: "I don't understand" },
      { front: "¿Cuánto cuesta?", back: "How much does it cost?" },
      { front: "Me gustaría...", back: "I would like..." },
      { front: "¿Puedes repetir?", back: "Can you repeat?" },
      { front: "Con permiso", back: "Excuse me" },
      { front: "¡Qué chévere!", back: "How cool! (slang)" },
      { front: "Estoy perdido/a", back: "I'm lost" },
      { front: "¿Hablas inglés?", back: "Do you speak English?" },
      { front: "Tengo hambre", back: "I'm hungry" },
      { front: "¡Salud!", back: "Cheers! / Bless you!" },
      { front: "Dale", back: "Go ahead / OK (slang)" },
    ];
    const now = new Date().toISOString();
    return phrases.map((p, i) => ({
      id: `starter_${i}`,
      front: p.front,
      back: p.back,
      box: 1,
      nextReview: now,
      timesCorrect: 0,
      timesIncorrect: 0,
      createdAt: now,
      source: "phrasebook" as const,
    }));
  };

  const flipCard = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped(!isFlipped);
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  const answerCard = async (correct: boolean) => {
    if (Platform.OS !== "web") {
      if (correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    const card = dueCards[currentIndex];
    const newBox = correct ? Math.min(card.box + 1, 5) : 1;
    const daysUntilReview = BOX_INTERVALS[newBox];
    const nextReview = new Date(Date.now() + daysUntilReview * 86400000).toISOString();

    const updatedCard: Flashcard = {
      ...card,
      box: newBox,
      nextReview,
      timesCorrect: card.timesCorrect + (correct ? 1 : 0),
      timesIncorrect: card.timesIncorrect + (correct ? 0 : 1),
    };

    // Update in allCards
    const updatedAll = allCards.map(c => c.id === card.id ? updatedCard : c);
    setAllCards(updatedAll);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));

    // Feed adaptive engines
    onFlashcardAnswer({
      cardId: card.id,
      front: card.front,
      back: card.back,
      correct,
      responseTimeMs: 3000,
      category: "vocabulary",
    });
    // Update stats
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
      total: prev.total + 1,
    }));

    // Next card
    if (currentIndex + 1 >= dueCards.length) {
      setSessionComplete(true);
      onSessionEnd("flashcard");
    } else {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    }
  };

  const startStudySession = async () => {
    if (dueCards.length === 0) return;
    await onSessionStart("flashcard");
    setViewMode("study");
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    setSessionStats({ correct: 0, incorrect: 0, total: 0 });
    flipAnim.setValue(0);
  };

  // Card flip animation
  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });

  // Session complete screen
  if (sessionComplete) {
    const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    return (
      <ScreenContainer>
        <View style={s.container}>
          <View style={s.completeContainer}>
            <Text style={{ fontSize: 64 }}>{accuracy >= 80 ? "🎉" : accuracy >= 50 ? "👍" : "💪"}</Text>
            <Text style={s.completeTitle}>Session Complete!</Text>
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: "#4CAF50" }]}>{sessionStats.correct}</Text>
                <Text style={s.statLbl}>Correct</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: "#F44336" }]}>{sessionStats.incorrect}</Text>
                <Text style={s.statLbl}>Incorrect</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: "#00AAFF" }]}>{accuracy}%</Text>
                <Text style={s.statLbl}>Accuracy</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { setViewMode("deck"); setSessionComplete(false); }} style={s.doneBtn}>
              <Text style={s.doneBtnText}>Back to Deck</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Study mode
  if (viewMode === "study" && dueCards.length > 0) {
    const card = dueCards[currentIndex];
    return (
      <ScreenContainer>
        <View style={s.container}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setViewMode("deck")} style={s.backBtn}>
              <Ionicons name="close" size={24} color="#ECEDEE" />
            </TouchableOpacity>
            <Text style={s.progress}>{currentIndex + 1} / {dueCards.length}</Text>
            <View style={s.boxBadge}>
              <Text style={s.boxText}>Box {card.box}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${((currentIndex + 1) / dueCards.length) * 100}%` }]} />
          </View>

          {/* Card */}
          <TouchableOpacity onPress={flipCard} activeOpacity={0.95} style={s.cardContainer}>
            <Animated.View style={[s.card, s.cardFront, { transform: [{ rotateY: frontInterpolate }] }]}>
              <Text style={s.cardLabel}>TAP TO FLIP</Text>
              <Text style={s.cardText}>{card.front}</Text>
              <Text style={s.cardHint}>What does this mean?</Text>
            </Animated.View>
            <Animated.View style={[s.card, s.cardBack, { transform: [{ rotateY: backInterpolate }] }]}>
              <Text style={s.cardLabel}>ANSWER</Text>
              <Text style={s.cardText}>{card.back}</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* FSRS 4-Button Rating (only show when flipped) */}
          {isFlipped && (
            <View style={s.fsrsRow}>
              <TouchableOpacity onPress={() => answerCard(false)} style={[s.fsrsBtn, { backgroundColor: "#F44336" }]}>
                <Text style={s.fsrsBtnLabel}>Again</Text>
                <Text style={s.fsrsBtnInterval}>&lt; 1m</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => answerCard(false)} style={[s.fsrsBtn, { backgroundColor: "#FF9800" }]}>
                <Text style={s.fsrsBtnLabel}>Hard</Text>
                <Text style={s.fsrsBtnInterval}>1d</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => answerCard(true)} style={[s.fsrsBtn, { backgroundColor: "#4CAF50" }]}>
                <Text style={s.fsrsBtnLabel}>Good</Text>
                <Text style={s.fsrsBtnInterval}>3d</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => answerCard(true)} style={[s.fsrsBtn, { backgroundColor: "#2196F3" }]}>
                <Text style={s.fsrsBtnLabel}>Easy</Text>
                <Text style={s.fsrsBtnInterval}>7d</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // Deck overview
  const boxCounts = [0, 0, 0, 0, 0, 0];
  allCards.forEach(c => { boxCounts[c.box]++; });

  return (
    <ScreenContainer>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
          </TouchableOpacity>
          <Text style={s.title}>Flashcards</Text>
          <View style={{ width: 40 }} />
        </View>

        <FeatureGateBanner feature="fsrs_algorithm" />

        {/* Due cards banner */}
        <View style={s.dueBanner}>
          <View>
            <Text style={s.dueCount}>{dueCards.length} cards due</Text>
            <Text style={s.dueSubtext}>{allCards.length} total in deck</Text>
          </View>
          <TouchableOpacity
            onPress={startStudySession}
            style={[s.studyBtn, dueCards.length === 0 && { opacity: 0.4 }]}
            disabled={dueCards.length === 0}
          >
            <Ionicons name="play" size={18} color="#FFF" />
            <Text style={s.studyBtnText}>Study Now</Text>
          </TouchableOpacity>
        </View>

        {/* Leitner boxes visualization */}
        <Text style={s.sectionTitle}>Leitner Boxes</Text>
        <View style={s.boxesRow}>
          {[1, 2, 3, 4, 5].map(box => (
            <View key={box} style={s.leitnerBox}>
              <View style={[s.boxFill, { height: `${Math.min((boxCounts[box] / Math.max(allCards.length, 1)) * 100, 100)}%`, backgroundColor: ["", "#F44336", "#FF9800", "#FFC107", "#8BC34A", "#4CAF50"][box] }]} />
              <Text style={s.boxNumber}>{box}</Text>
              <Text style={s.boxCount}>{boxCounts[box]}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={s.deckStats}>
          <View style={s.deckStatItem}>
            <Text style={s.deckStatValue}>{allCards.filter(c => c.timesCorrect > 0).length}</Text>
            <Text style={s.deckStatLabel}>Reviewed</Text>
          </View>
          <View style={s.deckStatItem}>
            <Text style={s.deckStatValue}>{boxCounts[5]}</Text>
            <Text style={s.deckStatLabel}>Mastered</Text>
          </View>
          <View style={s.deckStatItem}>
            <Text style={s.deckStatValue}>
              {allCards.length > 0 ? Math.round((allCards.reduce((s, c) => s + c.timesCorrect, 0) / Math.max(allCards.reduce((s, c) => s + c.timesCorrect + c.timesIncorrect, 0), 1)) * 100) : 0}%
            </Text>
            <Text style={s.deckStatLabel}>Accuracy</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: "#ECEDEE" },
  progress: { fontSize: 14, fontWeight: "600", color: "#9BA1A6" },
  boxBadge: { backgroundColor: "rgba(0,170,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  boxText: { fontSize: 12, fontWeight: "600", color: "#00AAFF" },
  progressBar: { height: 3, backgroundColor: "#1C2235", marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: 3, backgroundColor: "#00AAFF", borderRadius: 2 },
  cardContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  card: { width: SCREEN_WIDTH - 48, height: 280, borderRadius: 20, justifyContent: "center", alignItems: "center", padding: 24, position: "absolute", backfaceVisibility: "hidden" },
  cardFront: { backgroundColor: "#1C2235", borderWidth: 1, borderColor: "rgba(0,170,255,0.2)" },
  cardBack: { backgroundColor: "#141825", borderWidth: 1, borderColor: "rgba(76,175,80,0.3)" },
  cardLabel: { fontSize: 10, fontWeight: "700", color: "#687076", letterSpacing: 1, marginBottom: 16 },
  cardText: { fontSize: 24, fontWeight: "700", color: "#ECEDEE", textAlign: "center" },
  cardHint: { fontSize: 13, color: "#687076", marginTop: 16 },
  answerRow: { flexDirection: "row", justifyContent: "center", gap: 24, paddingBottom: 40 },
  answerBtn: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  incorrectBtn: { backgroundColor: "#F44336" },
  correctBtn: { backgroundColor: "#4CAF50" },
  answerLabel: { fontSize: 11, color: "#FFF", fontWeight: "600", marginTop: 2 },
  // Deck view
  dueBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, backgroundColor: "#141825", borderRadius: 14, padding: 16, marginBottom: 20 },
  dueCount: { fontSize: 20, fontWeight: "700", color: "#ECEDEE" },
  dueSubtext: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  studyBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#00AAFF", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  studyBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#9BA1A6", marginHorizontal: 16, marginBottom: 12 },
  boxesRow: { flexDirection: "row", justifyContent: "space-around", marginHorizontal: 16, height: 100, marginBottom: 24 },
  leitnerBox: { width: 50, height: 100, backgroundColor: "#1C2235", borderRadius: 8, overflow: "hidden", alignItems: "center", justifyContent: "flex-end" },
  boxFill: { position: "absolute", bottom: 0, left: 0, right: 0, borderRadius: 8 },
  boxNumber: { fontSize: 16, fontWeight: "700", color: "#ECEDEE", marginBottom: 2 },
  boxCount: { fontSize: 10, color: "#9BA1A6", marginBottom: 6 },
  deckStats: { flexDirection: "row", justifyContent: "space-around", marginHorizontal: 16, backgroundColor: "#141825", borderRadius: 12, padding: 16 },
  deckStatItem: { alignItems: "center" },
  deckStatValue: { fontSize: 20, fontWeight: "700", color: "#ECEDEE" },
  deckStatLabel: { fontSize: 11, color: "#9BA1A6", marginTop: 2 },
  // Complete
  completeContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  completeTitle: { fontSize: 24, fontWeight: "700", color: "#ECEDEE", marginTop: 16 },
  statsRow: { flexDirection: "row", gap: 24, marginTop: 24 },
  statBox: { alignItems: "center" },
  statNum: { fontSize: 28, fontWeight: "700" },
  statLbl: { fontSize: 12, color: "#9BA1A6", marginTop: 4 },
  doneBtn: { marginTop: 32, backgroundColor: "#00AAFF", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  doneBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  // FSRS 4-button rating
  fsrsRow: { flexDirection: "row", justifyContent: "center", gap: 10, paddingBottom: 40, paddingHorizontal: 16 },
  fsrsBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 14 },
  fsrsBtnLabel: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  fsrsBtnInterval: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2 },
});
