import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";
import { trpc } from "@/lib/trpc";
import { ConfettiAnimation } from "@/components/confetti-animation";
import { logLearningSession, type CEFRLevel } from "@/lib/cefr-hour-tracker";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48;

// ─── Colors ─────────────────────────────────────────────────────────────────
const Colors = {
  bg: "#0A0A0F",
  card: "#1A1A2E",
  cardLight: "#252540",
  cardHighlight: "#2A2A50",
  primary: "#6C63FF",
  primaryLight: "#8B83FF",
  primaryDark: "#4A42CC",
  success: "#22C55E",
  successBg: "#22C55E15",
  error: "#EF4444",
  errorBg: "#EF444415",
  warning: "#F59E0B",
  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  border: "#2A2A4A",
  gold: "#FFD700",
  imageBg: "#12121F",
  overlay: "rgba(0,0,0,0.6)",
  cyan: "#06B6D4",
  pink: "#EC4899",
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface VisualVocabItem {
  id: string;
  word: string;
  translation: string;
  pronunciation: string;
  gender: string | null;
  sceneDescription: string;
  imagePrompt: string;
  imageUrl: string;
  distractors: string[];
  culturalNote: string;
  example: string;
}

type Phase = "loading" | "learn" | "game" | "results";
type GameMode = "spot_the_word" | "image_match";

// ─── XP Calculation ─────────────────────────────────────────────────────────
const XP_BY_LEVEL: Record<string, number> = {
  A1: 15, A2: 20, B1: 25, B2: 30, C1: 35, C2: 40,
};

export default function VisualAssociationExerciseScreen() {
  const { showStreakToast } = useUsage();
  const params = useLocalSearchParams<{
    topic: string;
    language: string;
    dialect?: string;
    level: string;
    lessonId?: string;
  }>();

  const topic = params.topic || "Greetings";
  const language = params.language || "Spanish";
  const dialect = params.dialect;
  const level = params.level || "A1";
  const lessonId = params.lessonId || "";

  // ─── State ──────────────────────────────────────────────────────────────
  const sessionStartTime = useRef(Date.now());
  const [phase, setPhase] = useState<Phase>("loading");
  const [vocabItems, setVocabItems] = useState<VisualVocabItem[]>([]);
  const [culturalContext, setCulturalContext] = useState("");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());

  // Game state
  const [gameQuestions, setGameQuestions] = useState<Array<{
    vocabItem: VisualVocabItem;
    options: string[];
    correctIndex: number;
  }>>([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const cardScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  // tRPC mutation
  const generateMutation = trpc.creatorEngine.generateVisualVocab.useMutation();

  // ─── Load Vocab ─────────────────────────────────────────────────────────
  const loadVocab = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const result = await generateMutation.mutateAsync({
        language,
        dialect: dialect || undefined,
        level: level as any,
        topic,
        wordCount: 6,
      });

      if (result.success && result.vocabItems?.length > 0) {
        setVocabItems(result.vocabItems as VisualVocabItem[]);
        setCulturalContext(result.culturalContext || "");
        setPhase("learn");
      } else {
        setError(result.error || "Failed to generate visual vocabulary");
      }
    } catch (err: any) {
      setError(err.message || "Connection error. Please try again.");
    }
  }, [language, dialect, level, topic]);

  useEffect(() => {
    loadVocab();
  }, []);

  // ─── Pronunciation ────────────────────────────────────────────────────
  const speakWord = useCallback((word: string) => {
    if (Platform.OS !== "web") {
      const langCode = language.toLowerCase().slice(0, 2);
      Speech.speak(word, { language: langCode, rate: 0.8 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [language]);

  // ─── Learn Phase: Card Navigation ─────────────────────────────────────
  const handleNextCard = useCallback(() => {
    if (currentCardIndex < vocabItems.length - 1) {
      setCurrentCardIndex(i => i + 1);
      setCardFlipped(false);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [currentCardIndex, vocabItems.length]);

  const handlePrevCard = useCallback(() => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(i => i - 1);
      setCardFlipped(false);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [currentCardIndex]);

  const handleFlipCard = useCallback(() => {
    setCardFlipped(f => !f);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Mark as learned
    const item = vocabItems[currentCardIndex];
    if (item) {
      setLearnedWords(prev => new Set(prev).add(item.id));
    }
  }, [currentCardIndex, vocabItems]);

  const handleStartGame = useCallback(() => {
    // Build game questions from vocab items
    const questions = vocabItems.map(item => {
      // Combine correct word with distractors, shuffle
      const allOptions = [item.word, ...item.distractors.slice(0, 3)];
      // Fisher-Yates shuffle
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }
      return {
        vocabItem: item,
        options: allOptions,
        correctIndex: allOptions.indexOf(item.word),
      };
    });

    // Shuffle question order too
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    setGameQuestions(questions);
    setCurrentGameIndex(0);
    setSelectedAnswer(null);
    setAnswerRevealed(false);
    setCorrectCount(0);
    setPhase("game");
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [vocabItems]);

  // ─── Game Phase: Answer Selection ─────────────────────────────────────
  const handleSelectAnswer = useCallback(async (index: number) => {
    if (answerRevealed) return;

    setSelectedAnswer(index);
    setAnswerRevealed(true);

    const question = gameQuestions[currentGameIndex];
    const isCorrect = index === question.correctIndex;

    if (isCorrect) {
      setCorrectCount(c => c + 1);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    // Speak the correct word
    speakWord(question.vocabItem.word);
  }, [answerRevealed, currentGameIndex, gameQuestions, speakWord]);

  const handleNextQuestion = useCallback(async () => {
    if (currentGameIndex < gameQuestions.length - 1) {
      setCurrentGameIndex(i => i + 1);
      setSelectedAnswer(null);
      setAnswerRevealed(false);
    } else {
      // Game complete — show results
      const totalQ = gameQuestions.length;
      const baseXp = XP_BY_LEVEL[level] || 15;
      const scorePercent = correctCount / totalQ;
      const earned = Math.round(baseXp * scorePercent);
      setXpEarned(earned);

      // Save progress
      try {
        // Save completion
        const completedKey = `@visual_assoc_completed_${topic}_${language}`;
        await AsyncStorage.setItem(completedKey, JSON.stringify({
          completedAt: new Date().toISOString(),
          score: correctCount,
          total: totalQ,
          xpEarned: earned,
          wordsLearned: vocabItems.map(v => v.word),
        }));

        // Award XP
        if (earned > 0) {
          const currentXp = parseInt((await AsyncStorage.getItem("@total_xp")) || "0", 10);
          await AsyncStorage.setItem("@total_xp", String(currentXp + earned));
        }

        // Save mastered words
        const masteredKey = "@visual_vocab_mastered";
        const existing = await AsyncStorage.getItem(masteredKey);
        const mastered: string[] = existing ? JSON.parse(existing) : [];
        const newWords = vocabItems
          .filter((_, i) => {
            const q = gameQuestions.find(gq => gq.vocabItem.id === vocabItems[i].id);
            return q && gameQuestions.indexOf(q) < gameQuestions.length &&
              selectedAnswer === q.correctIndex;
          })
          .map(v => `${v.word}|${v.translation}|${language}`);
        const merged = [...new Set([...mastered, ...newWords])];
        await AsyncStorage.setItem(masteredKey, JSON.stringify(merged));

        // Update lesson progress if lessonId provided
        if (lessonId) {
          const progressRaw = await AsyncStorage.getItem("@lesson_progress");
          const progress: string[] = progressRaw ? JSON.parse(progressRaw) : [];
          const vaKey = `va_${lessonId}`;
          if (!progress.includes(vaKey)) {
            progress.push(vaKey);
            await AsyncStorage.setItem("@lesson_progress", JSON.stringify(progress));
          }
        }
      } catch (e) {
        // Silently handle storage errors
      }

      // Log CEFR hours
      try {
        const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStartTime.current) / 60000));
        await logLearningSession({
          activityType: "visual_association",
          durationMinutes,
          language,
          level: (level.toUpperCase() || "A1") as CEFRLevel,
          topic,
          accuracy: scorePercent,
          xpEarned: earned,
        });
      } catch (e) {
        // Silently handle
      }

      if (scorePercent >= 0.7) {
        setShowConfetti(true);
      }

      setPhase("results");
      markPracticeAndToast(showStreakToast);
    }
  }, [currentGameIndex, gameQuestions, correctCount, level, topic, language, vocabItems, lessonId, selectedAnswer]);

  // ─── Progress Bar Animation ───────────────────────────────────────────
  useEffect(() => {
    if (phase === "game" && gameQuestions.length > 0) {
      progressWidth.value = withTiming(
        ((currentGameIndex + 1) / gameQuestions.length) * 100,
        { duration: 300, easing: Easing.out(Easing.cubic) }
      );
    }
  }, [currentGameIndex, phase, gameQuestions.length]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // ─── Render: Loading ──────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconWrap}>
            <Ionicons name="eye-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.loadingTitle}>Creating Visual Vocabulary</Text>
          <Text style={styles.loadingSubtitle}>
            Generating culturally authentic scenes for {topic}...
          </Text>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
          <View style={styles.loadingTip}>
            <Ionicons name="bulb-outline" size={16} color={Colors.gold} />
            <Text style={styles.loadingTipText}>
              The CIA method pairs images with words — your brain remembers 2x better with visual associations!
            </Text>
          </View>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadVocab}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: Learn Phase (Image-Based Vocab Cards) ────────────────────
  if (phase === "learn") {
    const currentItem = vocabItems[currentCardIndex];
    const progress = `${currentCardIndex + 1}/${vocabItems.length}`;

    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Visual Vocab</Text>
            <Text style={styles.headerSubtitle}>{progress} · {topic}</Text>
          </View>
          <TouchableOpacity
            onPress={handleStartGame}
            style={[styles.headerBtn, styles.gameBtn]}
          >
            <Ionicons name="game-controller" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {vocabItems.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentCardIndex && styles.dotActive,
                learnedWords.has(vocabItems[i].id) && styles.dotLearned,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.learnContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Card */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.imageCard}>
            {currentItem.imageUrl ? (
              <Image
                source={{ uri: currentItem.imageUrl }}
                style={styles.sceneImage}
                contentFit="cover"
                transition={300}
                placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
              />
            ) : (
              <View style={[styles.sceneImage, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.placeholderText}>Scene loading...</Text>
              </View>
            )}

            {/* Word overlay on image */}
            <View style={styles.wordOverlay}>
              <Text style={styles.wordText}>{currentItem.word}</Text>
              {currentItem.gender && (
                <View style={[styles.genderBadge, {
                  backgroundColor: currentItem.gender === "feminine" ? "#EC489930" : "#3B82F630",
                }]}>
                  <Text style={[styles.genderText, {
                    color: currentItem.gender === "feminine" ? "#EC4899" : "#3B82F6",
                  }]}>
                    {currentItem.gender}
                  </Text>
                </View>
              )}
            </View>

            {/* Pronunciation button */}
            <TouchableOpacity
              style={styles.speakBtn}
              onPress={() => speakWord(currentItem.word)}
            >
              <Ionicons name="volume-high" size={20} color={Colors.text} />
            </TouchableOpacity>
          </Animated.View>

          {/* Pronunciation */}
          <Text style={styles.pronunciationText}>/{currentItem.pronunciation}/</Text>

          {/* Flip to reveal */}
          <TouchableOpacity
            style={[styles.flipCard, cardFlipped && styles.flipCardRevealed]}
            onPress={handleFlipCard}
            activeOpacity={0.8}
          >
            {!cardFlipped ? (
              <View style={styles.flipFront}>
                <Ionicons name="eye-off-outline" size={24} color={Colors.textSecondary} />
                <Text style={styles.flipHint}>Tap to reveal meaning</Text>
                <Text style={styles.flipSubhint}>Try to guess from the image first!</Text>
              </View>
            ) : (
              <Animated.View entering={FadeIn.duration(200)} style={styles.flipBack}>
                <Text style={styles.translationText}>{currentItem.translation}</Text>
                {currentItem.example && (
                  <View style={styles.exampleWrap}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.cyan} />
                    <Text style={styles.exampleText}>{currentItem.example}</Text>
                  </View>
                )}
                {currentItem.culturalNote && (
                  <View style={styles.culturalWrap}>
                    <Ionicons name="globe-outline" size={14} color={Colors.gold} />
                    <Text style={styles.culturalText}>{currentItem.culturalNote}</Text>
                  </View>
                )}
                <Text style={styles.sceneDesc}>{currentItem.sceneDescription}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>

          {/* Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, currentCardIndex === 0 && styles.navBtnDisabled]}
              onPress={handlePrevCard}
              disabled={currentCardIndex === 0}
            >
              <Ionicons name="chevron-back" size={24} color={currentCardIndex === 0 ? Colors.textMuted : Colors.text} />
              <Text style={[styles.navBtnText, currentCardIndex === 0 && styles.navBtnTextDisabled]}>Previous</Text>
            </TouchableOpacity>

            {currentCardIndex === vocabItems.length - 1 ? (
              <TouchableOpacity
                style={[styles.navBtn, styles.startGameBtn]}
                onPress={handleStartGame}
              >
                <Ionicons name="game-controller" size={20} color={Colors.text} />
                <Text style={[styles.navBtnText, { color: Colors.text }]}>Spot the Word!</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.navBtn}
                onPress={handleNextCard}
              >
                <Text style={styles.navBtnText}>Next</Text>
                <Ionicons name="chevron-forward" size={24} color={Colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Render: Game Phase (Spot the Word) ───────────────────────────────
  if (phase === "game") {
    const question = gameQuestions[currentGameIndex];
    const gameProgress = `${currentGameIndex + 1}/${gameQuestions.length}`;

    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPhase("learn")} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Spot the Word</Text>
            <Text style={styles.headerSubtitle}>{gameProgress}</Text>
          </View>
          <View style={styles.scoreChip}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.scoreText}>{correctCount}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.gameContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Scene Image */}
          <Animated.View entering={SlideInRight.duration(300)} style={styles.gameImageCard}>
            {question.vocabItem.imageUrl ? (
              <Image
                source={{ uri: question.vocabItem.imageUrl }}
                style={styles.gameImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.gameImage, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={40} color={Colors.textMuted} />
              </View>
            )}
            <View style={styles.gameImageOverlay}>
              <Text style={styles.gamePrompt}>What word matches this image?</Text>
            </View>
          </Animated.View>

          {/* Answer Options */}
          <View style={styles.optionsGrid}>
            {question.options.map((option, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === question.correctIndex;
              const showCorrect = answerRevealed && isCorrect;
              const showWrong = answerRevealed && isSelected && !isCorrect;

              return (
                <Animated.View
                  key={`${currentGameIndex}-${i}`}
                  entering={FadeInDown.delay(i * 80).duration(200)}
                >
                  <TouchableOpacity
                    style={[
                      styles.optionBtn,
                      showCorrect && styles.optionCorrect,
                      showWrong && styles.optionWrong,
                      isSelected && !answerRevealed && styles.optionSelected,
                    ]}
                    onPress={() => handleSelectAnswer(i)}
                    disabled={answerRevealed}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      showCorrect && styles.optionTextCorrect,
                      showWrong && styles.optionTextWrong,
                    ]}>
                      {option}
                    </Text>
                    {showCorrect && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                    )}
                    {showWrong && (
                      <Ionicons name="close-circle" size={22} color={Colors.error} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Reveal Panel */}
          {answerRevealed && (
            <Animated.View entering={FadeInUp.duration(300)} style={styles.revealPanel}>
              <View style={styles.revealHeader}>
                <Text style={styles.revealWord}>{question.vocabItem.word}</Text>
                <TouchableOpacity onPress={() => speakWord(question.vocabItem.word)}>
                  <Ionicons name="volume-high" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.revealPronunciation}>/{question.vocabItem.pronunciation}/</Text>
              <Text style={styles.revealTranslation}>{question.vocabItem.translation}</Text>
              {question.vocabItem.culturalNote && (
                <View style={styles.revealCultural}>
                  <Ionicons name="globe-outline" size={14} color={Colors.gold} />
                  <Text style={styles.revealCulturalText}>{question.vocabItem.culturalNote}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.nextQuestionBtn}
                onPress={handleNextQuestion}
              >
                <Text style={styles.nextQuestionText}>
                  {currentGameIndex < gameQuestions.length - 1 ? "Next Question" : "See Results"}
                </Text>
                <Ionicons
                  name={currentGameIndex < gameQuestions.length - 1 ? "arrow-forward" : "trophy"}
                  size={18}
                  color={Colors.text}
                />
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Render: Results Phase ────────────────────────────────────────────
  const totalQ = gameQuestions.length;
  const scorePercent = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
  const grade = scorePercent >= 90 ? "A+" : scorePercent >= 80 ? "A" : scorePercent >= 70 ? "B" : scorePercent >= 60 ? "C" : "D";
  const gradeColor = scorePercent >= 70 ? Colors.success : scorePercent >= 50 ? Colors.warning : Colors.error;

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && <ConfettiAnimation visible={showConfetti} onComplete={() => setShowConfetti(false)} />}

      <ScrollView contentContainerStyle={styles.resultsContent}>
        {/* Trophy */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.trophyWrap}>
          <Text style={styles.trophyEmoji}>
            {scorePercent >= 90 ? "🏆" : scorePercent >= 70 ? "🎯" : scorePercent >= 50 ? "💪" : "📚"}
          </Text>
        </Animated.View>

        <Text style={styles.resultsTitle}>
          {scorePercent >= 90 ? "Outstanding!" : scorePercent >= 70 ? "Great Job!" : scorePercent >= 50 ? "Keep Going!" : "Keep Practicing!"}
        </Text>
        <Text style={styles.resultsSubtitle}>Visual Association Complete</Text>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreStat}>
              <Text style={[styles.scoreStatValue, { color: gradeColor }]}>{grade}</Text>
              <Text style={styles.scoreStatLabel}>Grade</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreStat}>
              <Text style={styles.scoreStatValue}>{correctCount}/{totalQ}</Text>
              <Text style={styles.scoreStatLabel}>Correct</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreStat}>
              <Text style={[styles.scoreStatValue, { color: Colors.gold }]}>+{xpEarned}</Text>
              <Text style={styles.scoreStatLabel}>XP</Text>
            </View>
          </View>

          {/* Score bar */}
          <View style={styles.scoreBarWrap}>
            <View style={styles.scoreBarBg}>
              <View style={[styles.scoreBarFill, { width: `${scorePercent}%`, backgroundColor: gradeColor }]} />
            </View>
            <Text style={styles.scoreBarText}>{scorePercent}%</Text>
          </View>
        </View>

        {/* Words Learned */}
        <View style={styles.wordsLearnedCard}>
          <Text style={styles.wordsLearnedTitle}>Words Learned</Text>
          {vocabItems.map((item, i) => {
            const wasCorrect = gameQuestions.find(q => q.vocabItem.id === item.id)
              ? selectedAnswer === gameQuestions.find(q => q.vocabItem.id === item.id)!.correctIndex
              : false;
            return (
              <View key={item.id} style={styles.wordRow}>
                <View style={styles.wordRowLeft}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.wordThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.wordThumb, { backgroundColor: Colors.cardLight, justifyContent: "center", alignItems: "center" }]}>
                      <Ionicons name="image-outline" size={14} color={Colors.textMuted} />
                    </View>
                  )}
                  <View>
                    <Text style={styles.wordRowWord}>{item.word}</Text>
                    <Text style={styles.wordRowTranslation}>{item.translation}</Text>
                  </View>
                </View>
                <Ionicons
                  name={wasCorrect ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={wasCorrect ? Colors.success : Colors.error}
                />
              </View>
            );
          })}
        </View>

        {/* Cultural Context */}
        {culturalContext ? (
          <View style={styles.culturalCard}>
            <Ionicons name="globe-outline" size={18} color={Colors.gold} />
            <Text style={styles.culturalCardText}>{culturalContext}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              setPhase("learn");
              setCurrentCardIndex(0);
              setCardFlipped(false);
            }}
          >
            <Ionicons name="refresh" size={20} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Review Cards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={handleStartGame}
          >
            <Ionicons name="game-controller" size={20} color={Colors.text} />
            <Text style={[styles.actionBtnText, { color: Colors.text }]}>Play Again</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  loadingTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
  },
  loadingTipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  errorContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gameBtn: {
    backgroundColor: Colors.primary + "30",
  },

  // Progress dots
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  dotLearned: {
    backgroundColor: Colors.success,
  },

  // Learn content
  learnContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Image card
  imageCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.imageBg,
    marginBottom: 16,
    position: "relative",
  },
  sceneImage: {
    width: "100%",
    height: 280,
    backgroundColor: Colors.imageBg,
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
  wordOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.overlay,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  wordText: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: 0.5,
  },
  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  genderText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  speakBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + "CC",
    justifyContent: "center",
    alignItems: "center",
  },

  // Pronunciation
  pronunciationText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },

  // Flip card
  flipCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    minHeight: 100,
  },
  flipCardRevealed: {
    borderColor: Colors.primary + "50",
    backgroundColor: Colors.card,
  },
  flipFront: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  flipHint: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  flipSubhint: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  flipBack: {
    gap: 12,
  },
  translationText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  exampleWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    color: Colors.cyan,
    fontStyle: "italic",
    lineHeight: 20,
  },
  culturalWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  culturalText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gold,
    lineHeight: 18,
  },
  sceneDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    fontStyle: "italic",
  },

  // Navigation
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  navBtnTextDisabled: {
    color: Colors.textMuted,
  },
  startGameBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    flex: 1,
    justifyContent: "center",
  },

  // Game
  gameContent: {
    padding: 16,
    paddingBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    borderRadius: 2,
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  scoreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.successBg,
    borderRadius: 16,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.success,
  },

  gameImageCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.imageBg,
    marginBottom: 20,
    position: "relative",
  },
  gameImage: {
    width: "100%",
    height: 220,
    backgroundColor: Colors.imageBg,
  },
  gameImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.overlay,
  },
  gamePrompt: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },

  // Options
  optionsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "15",
  },
  optionCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.successBg,
  },
  optionWrong: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  optionText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  optionTextCorrect: {
    color: Colors.success,
  },
  optionTextWrong: {
    color: Colors.error,
  },

  // Reveal panel
  revealPanel: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    gap: 8,
  },
  revealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  revealWord: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
  },
  revealPronunciation: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  revealTranslation: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
  },
  revealCultural: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  revealCulturalText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gold,
    lineHeight: 18,
  },
  nextQuestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    marginTop: 8,
  },
  nextQuestionText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  // Results
  resultsContent: {
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  trophyWrap: {
    marginTop: 20,
    marginBottom: 16,
  },
  trophyEmoji: {
    fontSize: 64,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },

  // Score card
  scoreCard: {
    width: "100%",
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  scoreStat: {
    alignItems: "center",
    gap: 4,
  },
  scoreStatValue: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text,
  },
  scoreStatLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  scoreBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scoreBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  scoreBarText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
  },

  // Words learned
  wordsLearnedCard: {
    width: "100%",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  wordsLearnedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wordRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  wordThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: "hidden",
  },
  wordRowWord: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  wordRowTranslation: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Cultural card
  culturalCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gold + "30",
    marginBottom: 20,
  },
  culturalCardText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
  },
  doneBtn: {
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
