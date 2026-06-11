import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addToReviewQueue } from "@/lib/srs";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Genre = "all" | "comedy" | "drama" | "news" | "kids" | "documentary";
type Difficulty = "beginner" | "intermediate" | "advanced";
type ViewMode = "browse" | "player" | "quiz";

type SubtitleLine = {
  id: string;
  startTime: number;
  endTime: number;
  original: string;
  translated: string;
  vocabWords: VocabWord[];
};

type VocabWord = {
  word: string;
  translation: string;
  partOfSpeech: string;
  example: string;
};

type QuizQuestion = {
  id: string;
  type: "meaning" | "fill-blank" | "listening" | "context";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  relatedWord?: string;
};

type Clip = {
  id: string;
  title: string;
  description: string;
  genre: Genre;
  difficulty: Difficulty;
  duration: string;
  durationSec: number;
  language: string;
  flag: string;
  vocabCount: number;
  thumbnail: string;
  isNew: boolean;
  rating: number;
  subtitles: SubtitleLine[];
  quiz: QuizQuestion[];
};

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_CLIPS: Clip[] = [
  {
    id: "1",
    title: "Ordering at a Dominican Restaurant",
    description: "Learn food vocabulary through a real restaurant scene in Santo Domingo",
    genre: "comedy",
    difficulty: "beginner",
    duration: "3:24",
    durationSec: 204,
    language: "Spanish",
    flag: "🇩🇴",
    vocabCount: 12,
    thumbnail: "🍽️",
    isNew: true,
    rating: 4.8,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 5, original: "Buenas tardes, bienvenido al restaurante.", translated: "Good afternoon, welcome to the restaurant.", vocabWords: [{ word: "bienvenido", translation: "welcome", partOfSpeech: "adjective", example: "Bienvenido a mi casa" }, { word: "restaurante", translation: "restaurant", partOfSpeech: "noun", example: "El restaurante está lleno" }] },
      { id: "s2", startTime: 5, endTime: 10, original: "¿Qué desea ordenar hoy?", translated: "What would you like to order today?", vocabWords: [{ word: "desea", translation: "would like / wish", partOfSpeech: "verb", example: "¿Qué desea tomar?" }, { word: "ordenar", translation: "to order", partOfSpeech: "verb", example: "Voy a ordenar la comida" }] },
      { id: "s3", startTime: 10, endTime: 16, original: "Me gustaría el mofongo con pollo, por favor.", translated: "I would like the mofongo with chicken, please.", vocabWords: [{ word: "me gustaría", translation: "I would like", partOfSpeech: "phrase", example: "Me gustaría un café" }, { word: "pollo", translation: "chicken", partOfSpeech: "noun", example: "El pollo está delicioso" }] },
      { id: "s4", startTime: 16, endTime: 22, original: "Excelente elección. ¿Y para tomar?", translated: "Excellent choice. And to drink?", vocabWords: [{ word: "elección", translation: "choice", partOfSpeech: "noun", example: "Buena elección de película" }, { word: "tomar", translation: "to drink", partOfSpeech: "verb", example: "¿Qué quieres tomar?" }] },
      { id: "s5", startTime: 22, endTime: 28, original: "Un jugo de chinola bien frío, por favor.", translated: "A passion fruit juice, very cold, please.", vocabWords: [{ word: "jugo", translation: "juice", partOfSpeech: "noun", example: "El jugo de naranja es rico" }, { word: "chinola", translation: "passion fruit (Dominican)", partOfSpeech: "noun", example: "La chinola es una fruta tropical" }, { word: "frío", translation: "cold", partOfSpeech: "adjective", example: "El agua está fría" }] },
      { id: "s6", startTime: 28, endTime: 34, original: "Perfecto. Su orden estará lista en quince minutos.", translated: "Perfect. Your order will be ready in fifteen minutes.", vocabWords: [{ word: "orden", translation: "order", partOfSpeech: "noun", example: "Mi orden llegó rápido" }, { word: "quince", translation: "fifteen", partOfSpeech: "number", example: "Son las quince horas" }] },
    ],
    quiz: [
      { id: "q1", type: "meaning", question: "What does 'bienvenido' mean?", options: ["Goodbye", "Welcome", "Thank you", "Please"], correctIndex: 1, explanation: "'Bienvenido' comes from 'bien' (well) + 'venido' (come) — literally 'well come'.", relatedWord: "bienvenido" },
      { id: "q2", type: "fill-blank", question: "Me _____ el mofongo con pollo.", options: ["gustaría", "quiero", "tengo", "soy"], correctIndex: 0, explanation: "'Me gustaría' is the polite way to say 'I would like' in Spanish.", relatedWord: "me gustaría" },
      { id: "q3", type: "context", question: "What is 'chinola' in Dominican Spanish?", options: ["Orange", "Passion fruit", "Mango", "Pineapple"], correctIndex: 1, explanation: "'Chinola' is the Dominican word for passion fruit. In other countries it's called 'maracuyá'.", relatedWord: "chinola" },
      { id: "q4", type: "meaning", question: "What does '¿Qué desea ordenar?' mean?", options: ["Where is the menu?", "What would you like to order?", "Is the food ready?", "How much does it cost?"], correctIndex: 1, explanation: "'Desea' is the formal 'you wish/want' and 'ordenar' means 'to order'.", relatedWord: "ordenar" },
    ],
  },
  {
    id: "2",
    title: "Breaking News: Weather Report",
    description: "Practice listening comprehension with a fast-paced Spanish news broadcast",
    genre: "news",
    difficulty: "advanced",
    duration: "5:12",
    durationSec: 312,
    language: "Spanish",
    flag: "🇪🇸",
    vocabCount: 28,
    thumbnail: "📺",
    isNew: false,
    rating: 4.5,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 5, original: "Buenas noches, les informamos sobre el pronóstico del tiempo.", translated: "Good evening, we inform you about the weather forecast.", vocabWords: [{ word: "pronóstico", translation: "forecast", partOfSpeech: "noun", example: "El pronóstico dice lluvia" }] },
      { id: "s2", startTime: 5, endTime: 11, original: "Se esperan lluvias intensas en toda la región norte.", translated: "Heavy rains are expected throughout the northern region.", vocabWords: [{ word: "lluvias", translation: "rains", partOfSpeech: "noun", example: "Las lluvias causaron inundaciones" }, { word: "intensas", translation: "intense/heavy", partOfSpeech: "adjective", example: "Las lluvias intensas cerraron las carreteras" }] },
    ],
    quiz: [
      { id: "q1", type: "meaning", question: "What does 'pronóstico' mean?", options: ["Program", "Forecast", "Problem", "Promise"], correctIndex: 1, explanation: "'Pronóstico' means forecast or prediction, commonly used for weather." },
    ],
  },
  {
    id: "3",
    title: "The Lost Puppy",
    description: "A heartwarming short film for beginners with simple vocabulary",
    genre: "kids",
    difficulty: "beginner",
    duration: "4:45",
    durationSec: 285,
    language: "French",
    flag: "🇫🇷",
    vocabCount: 15,
    thumbnail: "🐕",
    isNew: true,
    rating: 4.9,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 5, original: "Regarde, un petit chien perdu dans le parc!", translated: "Look, a little lost dog in the park!", vocabWords: [{ word: "chien", translation: "dog", partOfSpeech: "noun", example: "Mon chien est gentil" }, { word: "perdu", translation: "lost", partOfSpeech: "adjective", example: "Je suis perdu" }] },
      { id: "s2", startTime: 5, endTime: 10, original: "Il a l'air triste. On doit l'aider!", translated: "He looks sad. We must help him!", vocabWords: [{ word: "triste", translation: "sad", partOfSpeech: "adjective", example: "Elle est triste aujourd'hui" }, { word: "aider", translation: "to help", partOfSpeech: "verb", example: "Je veux t'aider" }] },
    ],
    quiz: [
      { id: "q1", type: "meaning", question: "What does 'chien' mean in French?", options: ["Cat", "Dog", "Bird", "Fish"], correctIndex: 1, explanation: "'Chien' means dog. The feminine form is 'chienne'." },
    ],
  },
  {
    id: "4",
    title: "Office Drama: The Promotion",
    description: "Business vocabulary in a dramatic workplace scenario",
    genre: "drama",
    difficulty: "intermediate",
    duration: "7:30",
    durationSec: 450,
    language: "Japanese",
    flag: "🇯🇵",
    vocabCount: 22,
    thumbnail: "💼",
    isNew: false,
    rating: 4.6,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 5, original: "田中さん、昇進おめでとうございます！", translated: "Mr. Tanaka, congratulations on your promotion!", vocabWords: [{ word: "昇進", translation: "promotion", partOfSpeech: "noun", example: "昇進を目指しています" }] },
    ],
    quiz: [
      { id: "q1", type: "meaning", question: "What does '昇進' (shōshin) mean?", options: ["Salary", "Promotion", "Transfer", "Retirement"], correctIndex: 1, explanation: "'昇進' means promotion in a professional context." },
    ],
  },
  {
    id: "5",
    title: "Street Food Tour: Mexico City",
    description: "Explore Mexican street food culture while learning casual conversation",
    genre: "documentary",
    difficulty: "intermediate",
    duration: "6:15",
    durationSec: 375,
    language: "Spanish",
    flag: "🇲🇽",
    vocabCount: 18,
    thumbnail: "🌮",
    isNew: true,
    rating: 4.7,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 5, original: "¡Bienvenidos a la Ciudad de México! Hoy vamos a probar los mejores tacos.", translated: "Welcome to Mexico City! Today we're going to try the best tacos.", vocabWords: [{ word: "probar", translation: "to try/taste", partOfSpeech: "verb", example: "Quiero probar ese platillo" }] },
    ],
    quiz: [
      { id: "q1", type: "meaning", question: "What does 'probar' mean?", options: ["To prove", "To try/taste", "To buy", "To cook"], correctIndex: 1, explanation: "'Probar' means to try or taste. It can also mean 'to prove' in other contexts." },
    ],
  },
  {
    id: "6",
    title: "Comedy Sketch: Airport Confusion",
    description: "A hilarious skit about travel miscommunication — great for idioms",
    genre: "comedy",
    difficulty: "intermediate",
    duration: "4:02",
    durationSec: 242,
    language: "Korean",
    flag: "🇰🇷",
    vocabCount: 16,
    thumbnail: "✈️",
    isNew: false,
    rating: 4.4,
    subtitles: [
      { id: "s1", startTime: 0, endTime: 5, original: "실례합니다, 이 비행기가 서울행인가요?", translated: "Excuse me, is this flight going to Seoul?", vocabWords: [{ word: "비행기", translation: "airplane", partOfSpeech: "noun", example: "비행기가 출발합니다" }] },
    ],
    quiz: [
      { id: "q1", type: "meaning", question: "What does '비행기' mean?", options: ["Train", "Bus", "Airplane", "Ship"], correctIndex: 2, explanation: "'비행기' (bihaenggi) means airplane." },
    ],
  },
];

const GENRES: { key: Genre; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "grid-outline" },
  { key: "comedy", label: "Comedy", icon: "happy-outline" },
  { key: "drama", label: "Drama", icon: "film-outline" },
  { key: "news", label: "News", icon: "newspaper-outline" },
  { key: "kids", label: "Kids", icon: "balloon-outline" },
  { key: "documentary", label: "Docs", icon: "earth-outline" },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function WatchPartyScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("browse");
  const [selectedGenre, setSelectedGenre] = useState<Genre>("all");
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(0);
  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredClips = MOCK_CLIPS.filter((c) => selectedGenre === "all" || c.genre === selectedGenre);

  // Simulated playback timer
  useEffect(() => {
    if (isPlaying && selectedClip) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          const subIdx = selectedClip.subtitles.findIndex(
            (s) => next >= s.startTime && next < s.endTime
          );
          if (subIdx >= 0) setCurrentSubtitleIndex(subIdx);
          if (next >= selectedClip.durationSec) {
            setIsPlaying(false);
            return selectedClip.durationSec;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, selectedClip]);

  const handlePlayClip = (clip: Clip) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedClip(clip);
    setViewMode("player");
    setCurrentSubtitleIndex(0);
    setCurrentTime(0);
    setIsPlaying(true);
    setSavedWords(new Set());
  };

  const handleSaveWord = (word: VocabWord) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedWords((prev) => new Set(prev).add(word.word));
    // Add to SRS review queue for spaced repetition
    if (selectedClip) {
      addToReviewQueue([{
        id: `wp_${selectedClip.id}_${word.word}`,
        word: word.word,
        translation: word.translation,
        context: word.example || `From Watch Party: ${selectedClip.title}`,
        lessonId: `watch-party-${selectedClip.id}`,
      }]);
    }
  };

  const handleStartQuiz = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setViewMode("quiz");
    setQuizIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setQuizComplete(false);
    setShowExplanation(false);
    setIsPlaying(false);
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (selectedClip && index === selectedClip.quiz[quizIndex].correctIndex) {
      setQuizScore((prev) => prev + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedClip) return;
    if (quizIndex + 1 >= selectedClip.quiz.length) {
      setQuizComplete(true);
    } else {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── BROWSE VIEW ────────────────────────────────────────────────────────────
  if (viewMode === "browse") {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Watch Party</Text>
            <Text style={styles.headerSubtitle}>Learn through clips & shows</Text>
          </View>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="bookmark-outline" size={20} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll} contentContainerStyle={styles.genreContent}>
          {GENRES.map((g) => (
            <TouchableOpacity
              key={g.key}
              style={[styles.genreChip, selectedGenre === g.key && styles.genreChipActive]}
              onPress={() => setSelectedGenre(g.key)}
            >
              <Ionicons name={g.icon as any} size={14} color={selectedGenre === g.key ? Colors.secondary : Colors.textSecondary} />
              <Text style={[styles.genreChipText, selectedGenre === g.key && styles.genreChipTextActive]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredClips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.clipList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.clipCard} activeOpacity={0.8} onPress={() => handlePlayClip(item)}>
              <View style={styles.clipThumbnail}>
                <Text style={styles.clipEmoji}>{item.thumbnail}</Text>
                <View style={styles.clipDuration}>
                  <Ionicons name="play" size={10} color="#FFF" />
                  <Text style={styles.clipDurationText}>{item.duration}</Text>
                </View>
                {item.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
              </View>
              <View style={styles.clipInfo}>
                <View style={styles.clipMeta}>
                  <Text style={styles.clipFlag}>{item.flag}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: item.difficulty === "beginner" ? Colors.success + "22" : item.difficulty === "intermediate" ? Colors.gold + "22" : Colors.accent + "22" }]}>
                    <Text style={[styles.difficultyText, { color: item.difficulty === "beginner" ? Colors.success : item.difficulty === "intermediate" ? Colors.gold : Colors.accent }]}>{item.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.clipTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.clipDesc} numberOfLines={1}>{item.description}</Text>
                <View style={styles.clipStats}>
                  <View style={styles.clipStat}>
                    <Ionicons name="book-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.clipStatText}>{item.vocabCount} words</Text>
                  </View>
                  <View style={styles.clipStat}>
                    <Ionicons name="star" size={12} color={Colors.gold} />
                    <Text style={styles.clipStatText}>{item.rating}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </ScreenContainer>
    );
  }

  // ─── PLAYER VIEW ────────────────────────────────────────────────────────────
  if (viewMode === "player" && selectedClip) {
    const currentSub = selectedClip.subtitles[currentSubtitleIndex];
    const progress = selectedClip.durationSec > 0 ? currentTime / selectedClip.durationSec : 0;

    return (
      <ScreenContainer>
        <ScrollView style={styles.playerScroll} contentContainerStyle={styles.playerScrollContent}>
          {/* Video Area */}
          <View style={styles.videoArea}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoEmoji}>{selectedClip.thumbnail}</Text>
              <Text style={styles.videoTitle}>{selectedClip.title}</Text>
            </View>
            <View style={styles.playbackOverlay}>
              <TouchableOpacity onPress={() => setCurrentTime(Math.max(0, currentTime - 5))}>
                <Ionicons name="play-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} style={styles.playPauseBtn}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentTime(Math.min(selectedClip.durationSec, currentTime + 5))}>
                <Ionicons name="play-forward" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{selectedClip.duration}</Text>
            </View>
          </View>

          {/* Dual Subtitles */}
          <View style={styles.subtitleArea}>
            <Text style={styles.subtitleLabel}>ORIGINAL</Text>
            <Text style={styles.subtitleOriginal}>{currentSub?.original || "..."}</Text>
            <View style={styles.subtitleDivider} />
            <Text style={styles.subtitleLabel}>TRANSLATION</Text>
            <Text style={styles.subtitleTranslated}>{currentSub?.translated || "..."}</Text>
          </View>

          {/* Vocabulary Words */}
          {currentSub && currentSub.vocabWords.length > 0 && (
            <View style={styles.vocabSection}>
              <Text style={styles.vocabSectionTitle}>Tap to save vocabulary</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vocabChips}>
                {currentSub.vocabWords.map((w) => {
                  const isSaved = savedWords.has(w.word);
                  return (
                    <TouchableOpacity
                      key={w.word}
                      style={[styles.vocabChip, isSaved && styles.vocabChipSaved]}
                      onPress={() => !isSaved && handleSaveWord(w)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.vocabChipWord, isSaved && styles.vocabChipWordSaved]}>{w.word}</Text>
                      <Text style={styles.vocabChipTranslation}>{w.translation}</Text>
                      {isSaved && <Ionicons name="checkmark-circle" size={14} color={Colors.success} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.playerFooter}>
            <View style={styles.savedCount}>
              <Ionicons name="bookmark" size={16} color={Colors.gold} />
              <Text style={styles.savedCountText}>{savedWords.size} words saved</Text>
            </View>
            <View style={styles.playerActions}>
              <TouchableOpacity style={styles.backToBrowseBtn} onPress={() => { setViewMode("browse"); setIsPlaying(false); }}>
                <Ionicons name="grid-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.backToBrowseText}>Browse</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quizCta} onPress={handleStartQuiz}>
                <Ionicons name="school" size={16} color="#FFF" />
                <Text style={styles.quizCtaText}>Take Quiz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── QUIZ VIEW ──────────────────────────────────────────────────────────────
  if (viewMode === "quiz" && selectedClip) {
    if (quizComplete) {
      const totalQuestions = selectedClip.quiz.length;
      const percentage = Math.round((quizScore / totalQuestions) * 100);
      const xpEarned = quizScore * 15 + savedWords.size * 5;

      return (
        <ScreenContainer>
          <View style={styles.quizCompleteContainer}>
            <View style={styles.quizCompleteCard}>
              <Text style={styles.quizCompleteEmoji}>{percentage >= 80 ? "🎉" : percentage >= 50 ? "👏" : "💪"}</Text>
              <Text style={styles.quizCompleteTitle}>{percentage >= 80 ? "Excellent!" : percentage >= 50 ? "Good Job!" : "Keep Practicing!"}</Text>
              <Text style={styles.quizCompleteScore}>{quizScore}/{totalQuestions} correct ({percentage}%)</Text>
              <View style={styles.xpReward}>
                <Ionicons name="flash" size={20} color={Colors.gold} />
                <Text style={styles.xpRewardText}>+{xpEarned} XP earned</Text>
              </View>
              <View style={styles.quizStats}>
                <View style={styles.quizStatItem}>
                  <Text style={styles.quizStatValue}>{savedWords.size}</Text>
                  <Text style={styles.quizStatLabel}>Words Saved</Text>
                </View>
                <View style={styles.quizStatDivider} />
                <View style={styles.quizStatItem}>
                  <Text style={styles.quizStatValue}>{quizScore}</Text>
                  <Text style={styles.quizStatLabel}>Correct</Text>
                </View>
                <View style={styles.quizStatDivider} />
                <View style={styles.quizStatItem}>
                  <Text style={styles.quizStatValue}>{formatTime(currentTime)}</Text>
                  <Text style={styles.quizStatLabel}>Watched</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.quizDoneBtn} onPress={() => setViewMode("browse")}>
                <Text style={styles.quizDoneBtnText}>Back to Clips</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.replayBtn} onPress={() => handlePlayClip(selectedClip)}>
                <Ionicons name="refresh" size={16} color={Colors.secondary} />
                <Text style={styles.replayBtnText}>Replay Clip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScreenContainer>
      );
    }

    const currentQuestion = selectedClip.quiz[quizIndex];

    return (
      <ScreenContainer>
        <ScrollView style={styles.quizScroll} contentContainerStyle={styles.quizScrollContent}>
          {/* Quiz Header */}
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={() => setViewMode("player")}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.quizProgress}>{quizIndex + 1} / {selectedClip.quiz.length}</Text>
            <View style={styles.quizScoreBadge}>
              <Ionicons name="flash" size={14} color={Colors.gold} />
              <Text style={styles.quizScoreText}>{quizScore}</Text>
            </View>
          </View>

          {/* Progress dots */}
          <View style={styles.quizDots}>
            {selectedClip.quiz.map((_, i) => (
              <View key={i} style={[styles.quizDot, i === quizIndex && styles.quizDotCurrent, i < quizIndex && styles.quizDotDone]} />
            ))}
          </View>

          {/* Question */}
          <View style={styles.questionCard}>
            <View style={styles.questionTypeBadge}>
              <Text style={styles.questionTypeText}>
                {currentQuestion.type === "meaning" ? "Meaning" : currentQuestion.type === "fill-blank" ? "Fill in the Blank" : currentQuestion.type === "context" ? "Context" : "Listening"}
              </Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, i) => {
              const isCorrect = selectedAnswer !== null && i === currentQuestion.correctIndex;
              const isWrong = selectedAnswer === i && i !== currentQuestion.correctIndex;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.optionBtn, isCorrect && styles.optionCorrect, isWrong && styles.optionWrong]}
                  onPress={() => handleAnswerSelect(i)}
                  disabled={selectedAnswer !== null}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLetter}>
                    <Text style={styles.optionLetterText}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={[styles.optionText, isCorrect && styles.optionTextCorrect, isWrong && styles.optionTextWrong]}>{option}</Text>
                  {isCorrect && <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={{ marginLeft: "auto" }} />}
                  {isWrong && <Ionicons name="close-circle" size={20} color={Colors.accent} style={{ marginLeft: "auto" }} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation */}
          {showExplanation && (
            <View style={styles.explanationCard}>
              <Ionicons name="bulb" size={16} color={Colors.gold} />
              <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
            </View>
          )}

          {/* Next button */}
          {selectedAnswer !== null && (
            <TouchableOpacity style={styles.nextQuestionBtn} onPress={handleNextQuestion}>
              <Text style={styles.nextQuestionBtnText}>{quizIndex + 1 >= selectedClip.quiz.length ? "See Results" : "Next Question"}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }


  // Load persisted data from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@watch_party_data');
        if (stored) {
          // Data available from sync/server
        }
      } catch {}
    })();
  }, []);
  return null;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  headerAction: { marginLeft: "auto", width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  genreScroll: { maxHeight: 44, marginBottom: Spacing.sm },
  genreContent: { paddingHorizontal: Spacing.lg, gap: 8 },
  genreChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  genreChipActive: { backgroundColor: Colors.glowSubtle, borderColor: Colors.secondary },
  genreChipText: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  genreChipTextActive: { color: Colors.secondary },
  clipList: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: 12 },
  clipCard: { flexDirection: "row", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  clipThumbnail: { width: 100, height: 100, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", position: "relative" },
  clipEmoji: { fontSize: 36 },
  clipDuration: { position: "absolute", bottom: 6, right: 6, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  clipDurationText: { fontSize: 10, color: "#FFF", fontWeight: "600" },
  newBadge: { position: "absolute", top: 6, left: 6, backgroundColor: Colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  newBadgeText: { fontSize: 9, fontWeight: "800", color: "#FFF" },
  clipInfo: { flex: 1, padding: 10, justifyContent: "center" },
  clipMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  clipFlag: { fontSize: 14 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  difficultyText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  clipTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary, marginBottom: 2 },
  clipDesc: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  clipStats: { flexDirection: "row", gap: 12 },
  clipStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  clipStatText: { fontSize: 11, color: Colors.textSecondary },
  // Player
  playerScroll: { flex: 1 },
  playerScrollContent: { paddingBottom: 40 },
  videoArea: { backgroundColor: "#000", paddingTop: 20, paddingBottom: 10, paddingHorizontal: Spacing.lg },
  videoPlaceholder: { height: 160, alignItems: "center", justifyContent: "center", borderRadius: BorderRadius.lg, backgroundColor: "rgba(255,255,255,0.05)" },
  videoEmoji: { fontSize: 48, marginBottom: 8 },
  videoTitle: { fontSize: FontSize.sm, color: "#FFF", fontWeight: "600", textAlign: "center" },
  playbackOverlay: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32, paddingVertical: 12 },
  playPauseBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center", shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 12, elevation: 10 },
  progressBarContainer: { height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, marginTop: 8 },
  progressBar: { height: 4, backgroundColor: Colors.secondary, borderRadius: 2 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  timeText: { fontSize: 10, color: "rgba(255,255,255,0.6)" },
  // Subtitles
  subtitleArea: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surfaceCard, marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  subtitleLabel: { fontSize: 10, fontWeight: "700", color: Colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  subtitleOriginal: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary, lineHeight: 22 },
  subtitleDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  subtitleTranslated: { fontSize: FontSize.md, color: Colors.secondary, fontStyle: "italic", lineHeight: 22 },
  // Vocabulary
  vocabSection: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  vocabSectionTitle: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary, marginBottom: 8 },
  vocabChips: { gap: 8 },
  vocabChip: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, alignItems: "center", minWidth: 80 },
  vocabChipSaved: { borderColor: Colors.greenBorder, backgroundColor: Colors.greenGlow },
  vocabChipWord: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  vocabChipWordSaved: { color: Colors.success },
  vocabChipTranslation: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  // Player footer
  playerFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  savedCount: { flexDirection: "row", alignItems: "center", gap: 6 },
  savedCountText: { fontSize: FontSize.sm, color: Colors.gold, fontWeight: "600" },
  playerActions: { flexDirection: "row", gap: 10 },
  backToBrowseBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  backToBrowseText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: "600" },
  quizCta: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.secondary, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  quizCtaText: { fontSize: FontSize.sm, fontWeight: "700", color: "#FFF" },
  // Quiz
  quizScroll: { flex: 1 },
  quizScrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40 },
  quizHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md },
  quizProgress: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  quizScoreBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.goldGlow, borderWidth: 1, borderColor: Colors.goldBorder },
  quizScoreText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  quizDots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: Spacing.lg },
  quizDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  quizDotCurrent: { backgroundColor: Colors.secondary, width: 20, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  quizDotDone: { backgroundColor: Colors.success },
  questionCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  questionTypeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.glowSubtle, borderWidth: 1, borderColor: Colors.glowBorder, marginBottom: 10 },
  questionTypeText: { fontSize: 11, fontWeight: "700", color: Colors.secondary },
  questionText: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary, lineHeight: 26 },
  optionsContainer: { gap: 10, marginBottom: Spacing.md },
  optionBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, borderRadius: BorderRadius.lg, backgroundColor: Colors.surfaceCard, borderWidth: 1.5, borderColor: Colors.border, gap: 12 },
  optionCorrect: { borderColor: Colors.success, backgroundColor: Colors.greenGlow },
  optionWrong: { borderColor: Colors.accent, backgroundColor: Colors.redGlow },
  optionLetter: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  optionLetterText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  optionText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary, flex: 1 },
  optionTextCorrect: { color: Colors.success },
  optionTextWrong: { color: Colors.accent },
  explanationCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: Spacing.md, backgroundColor: Colors.goldGlow, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.goldBorder, marginBottom: Spacing.md },
  explanationText: { fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1, lineHeight: 20 },
  nextQuestionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, backgroundColor: Colors.secondary, borderRadius: BorderRadius.lg, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  nextQuestionBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#FFF" },
  // Quiz Complete
  quizCompleteContainer: { flex: 1, justifyContent: "center", paddingHorizontal: Spacing.lg },
  quizCompleteCard: { backgroundColor: Colors.surfaceCard, borderRadius: 20, padding: 28, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  quizCompleteEmoji: { fontSize: 56, marginBottom: 12 },
  quizCompleteTitle: { fontSize: 24, fontWeight: "800", color: Colors.textPrimary, marginBottom: 6 },
  quizCompleteScore: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: 16 },
  xpReward: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.goldGlow, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.goldBorder, marginBottom: 20 },
  xpRewardText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.gold },
  quizStats: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  quizStatItem: { alignItems: "center", paddingHorizontal: 16 },
  quizStatValue: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  quizStatLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  quizStatDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  quizDoneBtn: { width: "100%", paddingVertical: 14, backgroundColor: Colors.secondary, borderRadius: BorderRadius.lg, alignItems: "center", marginBottom: 10, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 },
  quizDoneBtnText: { fontSize: FontSize.md, fontWeight: "700", color: "#FFF" },
  replayBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10 },
  replayBtnText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.secondary },
});
