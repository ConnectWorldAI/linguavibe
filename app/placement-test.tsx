import React, { useState, useEffect, useRef, useCallback } from "react";
import { ConfettiAnimation } from "@/components/confetti-animation";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/lib/i18n";
import { useSubscription } from "@/hooks/use-subscription";
import {
  generatePlacementResult,
  generateLearningPath,
  savePlacementResult,
  saveLearningPath,
  type PlacementResult as AdaptivePlacementResult,
  type LearningPath,
  CEFR_THETA,
} from "@/lib/adaptive-placement";
import { FeatureGateBanner } from "@/components/feature-gate-banner";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


// ─── Types ───────────────────────────────────────────────────────────────────
type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type QuestionType = "vocabulary" | "grammar" | "reading" | "listening";
type TestState = "intro" | "testing" | "results";

interface Question {
  id: string;
  type: QuestionType;
  level: CEFRLevel;
  prompt: string;
  context?: string;
  options: string[];
  correctIndex: number;
}

interface TestResult {
  level: CEFRLevel;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  breakdown: Record<QuestionType, { correct: number; total: number }>;
}

// ─── CEFR Level Descriptions ─────────────────────────────────────────────────
const CEFR_DESCRIPTIONS: Record<CEFRLevel, { title: string; description: string; color: string }> = {
  A1: { title: "Beginner", description: "Can understand and use familiar everyday expressions and very basic phrases.", color: "#EF4444" },
  A2: { title: "Elementary", description: "Can communicate in simple and routine tasks requiring direct exchange of information.", color: "#F97316" },
  B1: { title: "Intermediate", description: "Can deal with most situations likely to arise while travelling in the target language area.", color: "#EAB308" },
  B2: { title: "Upper Intermediate", description: "Can interact with a degree of fluency and spontaneity with native speakers.", color: "#22C55E" },
  C1: { title: "Advanced", description: "Can express ideas fluently and spontaneously without much obvious searching for expressions.", color: "#3B82F6" },
  C2: { title: "Mastery", description: "Can understand with ease virtually everything heard or read.", color: "#8B5CF6" },
};

// ─── Question Bank (Adaptive) ────────────────────────────────────────────────
const QUESTION_BANK: Question[] = [
  // A1 - Vocabulary
  { id: "a1_v1", type: "vocabulary", level: "A1", prompt: "What is the correct greeting for the morning?", options: ["Good night", "Good morning", "Good evening", "Goodbye"], correctIndex: 1 },
  { id: "a1_v2", type: "vocabulary", level: "A1", prompt: "Which word means a place where you sleep?", options: ["Kitchen", "Bedroom", "Garden", "Office"], correctIndex: 1 },
  { id: "a1_v3", type: "vocabulary", level: "A1", prompt: "What color is the sky on a clear day?", options: ["Red", "Green", "Blue", "Yellow"], correctIndex: 2 },
  // A1 - Grammar
  { id: "a1_g1", type: "grammar", level: "A1", prompt: "Choose the correct form: 'She ___ a student.'", options: ["am", "is", "are", "be"], correctIndex: 1 },
  { id: "a1_g2", type: "grammar", level: "A1", prompt: "Which is correct? 'I have two ___.'", options: ["childs", "childrens", "children", "child"], correctIndex: 2 },
  // A2 - Vocabulary
  { id: "a2_v1", type: "vocabulary", level: "A2", prompt: "What does 'postpone' mean?", options: ["Cancel completely", "Do immediately", "Delay to a later time", "Forget about"], correctIndex: 2 },
  { id: "a2_v2", type: "vocabulary", level: "A2", prompt: "A person who fixes water pipes is called a:", options: ["Carpenter", "Plumber", "Electrician", "Mechanic"], correctIndex: 1 },
  // A2 - Grammar
  { id: "a2_g1", type: "grammar", level: "A2", prompt: "'I ___ to the store yesterday.'", options: ["go", "went", "gone", "going"], correctIndex: 1 },
  { id: "a2_g2", type: "grammar", level: "A2", prompt: "'She is ___ than her sister.'", options: ["tall", "taller", "tallest", "more tall"], correctIndex: 1 },
  // A2 - Reading
  { id: "a2_r1", type: "reading", level: "A2", context: "The café opens at 8 AM and closes at 6 PM. On weekends, it opens one hour later.", prompt: "What time does the café open on Saturday?", options: ["7 AM", "8 AM", "9 AM", "10 AM"], correctIndex: 2 },
  // B1 - Vocabulary
  { id: "b1_v1", type: "vocabulary", level: "B1", prompt: "What does 'reluctant' mean?", options: ["Eager and excited", "Unwilling or hesitant", "Angry and upset", "Confused and lost"], correctIndex: 1 },
  { id: "b1_v2", type: "vocabulary", level: "B1", prompt: "Choose the synonym of 'abundant':", options: ["Scarce", "Plentiful", "Expensive", "Tiny"], correctIndex: 1 },
  // B1 - Grammar
  { id: "b1_g1", type: "grammar", level: "B1", prompt: "'If I ___ rich, I would travel the world.'", options: ["am", "was", "were", "be"], correctIndex: 2 },
  { id: "b1_g2", type: "grammar", level: "B1", prompt: "'The book ___ by millions of people.'", options: ["has read", "has been read", "have read", "is reading"], correctIndex: 1 },
  // B1 - Reading
  { id: "b1_r1", type: "reading", level: "B1", context: "Despite the heavy rain, the marathon continued as planned. Organizers provided extra water stations and medical tents along the route.", prompt: "What did organizers do about the rain?", options: ["Cancelled the event", "Moved it indoors", "Added support stations", "Shortened the route"], correctIndex: 2 },
  // B2 - Vocabulary
  { id: "b2_v1", type: "vocabulary", level: "B2", prompt: "What does 'ubiquitous' mean?", options: ["Rare and valuable", "Found everywhere", "Extremely large", "Very old"], correctIndex: 1 },
  { id: "b2_v2", type: "vocabulary", level: "B2", prompt: "'Pragmatic' most closely means:", options: ["Idealistic", "Practical and realistic", "Emotional", "Theoretical"], correctIndex: 1 },
  // B2 - Grammar
  { id: "b2_g1", type: "grammar", level: "B2", prompt: "'Had she known about the delay, she ___ earlier.'", options: ["would leave", "would have left", "will leave", "had left"], correctIndex: 1 },
  { id: "b2_g2", type: "grammar", level: "B2", prompt: "'Not only ___ the exam, but she also got the highest score.'", options: ["she passed", "did she pass", "she did pass", "passed she"], correctIndex: 1 },
  // B2 - Reading
  { id: "b2_r1", type: "reading", level: "B2", context: "The study found that bilingual individuals showed a 4.5-year delay in the onset of dementia symptoms compared to monolinguals, suggesting cognitive reserve benefits from managing two language systems.", prompt: "What advantage did bilinguals show?", options: ["Better memory for names", "Faster reading speed", "Later onset of dementia", "Higher IQ scores"], correctIndex: 2 },
  // C1 - Vocabulary
  { id: "c1_v1", type: "vocabulary", level: "C1", prompt: "'Sycophantic' behavior involves:", options: ["Being overly critical", "Excessive flattery to gain advantage", "Acting independently", "Showing genuine kindness"], correctIndex: 1 },
  { id: "c1_v2", type: "vocabulary", level: "C1", prompt: "An 'ephemeral' experience is one that is:", options: ["Deeply meaningful", "Short-lived and fleeting", "Physically painful", "Intellectually stimulating"], correctIndex: 1 },
  // C1 - Grammar
  { id: "c1_g1", type: "grammar", level: "C1", prompt: "'Scarcely ___ the door when the phone rang.'", options: ["I had closed", "had I closed", "I closed", "did I close"], correctIndex: 1 },
  { id: "c1_g2", type: "grammar", level: "C1", prompt: "'The proposal, ___ merits are undeniable, was rejected on financial grounds.'", options: ["which", "whose", "that", "of which"], correctIndex: 1 },
  // C1 - Reading
  { id: "c1_r1", type: "reading", level: "C1", context: "The paradox of choice suggests that while autonomy and freedom of choice are critical to well-being, an overabundance of options can lead to decision paralysis and decreased satisfaction with chosen outcomes.", prompt: "According to the text, too many choices can:", options: ["Always improve decisions", "Lead to paralysis and less satisfaction", "Have no measurable effect", "Only affect younger people"], correctIndex: 1 },
  // C2 - Vocabulary
  { id: "c2_v1", type: "vocabulary", level: "C2", prompt: "'Sesquipedalian' refers to:", options: ["A type of insect", "The use of long words", "A mathematical concept", "An ancient civilization"], correctIndex: 1 },
  { id: "c2_v2", type: "vocabulary", level: "C2", prompt: "A 'palimpsest' is:", options: ["A type of fossil", "A manuscript written over earlier text", "An optical illusion", "A musical instrument"], correctIndex: 1 },
  // C2 - Grammar
  { id: "c2_g1", type: "grammar", level: "C2", prompt: "Which sentence demonstrates correct use of the subjunctive?", options: ["I wish I was there.", "If I was you, I'd go.", "It is essential that he be present.", "I suggest that she goes early."], correctIndex: 2 },
  { id: "c2_g2", type: "grammar", level: "C2", prompt: "'The committee ___ unable to reach a consensus.' (formal British English)", options: ["was", "were", "is", "has been"], correctIndex: 1 },
  // C2 - Reading
  { id: "c2_r1", type: "reading", level: "C2", context: "The hermeneutic circle posits that understanding a text's parts requires comprehension of the whole, yet grasping the whole necessitates understanding its constituent parts — a seemingly paradoxical iterative process that characterizes all interpretive endeavors.", prompt: "The hermeneutic circle describes:", options: ["A logical fallacy in arguments", "The recursive nature of interpretation", "A method of speed reading", "The structure of academic papers"], correctIndex: 1 },
];

// ─── Adaptive Algorithm ──────────────────────────────────────────────────────
const LEVEL_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function getAdaptiveQuestions(bank: Question[], startEstimate?: CEFRLevel): Question[] {
  // Start at estimated level (from onboarding) or default to A2
  const startIdx = startEstimate ? LEVEL_ORDER.indexOf(startEstimate) : 1;
  const selected: Question[] = [];
  let currentLevelIdx = Math.max(0, Math.min(startIdx, 5));
  const questionsPerLevel = 5;
  let consecutiveCorrect = 0;
  let consecutiveWrong = 0;

  // Reduce questions for higher-level users (skip easy questions they'd ace)
  const totalQuestions = startIdx >= 3 ? 15 : 20;

  // Select questions adaptively (simulated selection)
  for (let i = 0; i < totalQuestions; i++) {
    const level = LEVEL_ORDER[currentLevelIdx];
    const available = bank.filter(q => q.level === level && !selected.includes(q));
    if (available.length > 0) {
      selected.push(available[Math.floor(Math.random() * available.length)]);
    } else {
      // Fallback: pick from adjacent levels
      const fallback = bank.filter(q => !selected.includes(q));
      if (fallback.length > 0) selected.push(fallback[0]);
    }

    // Simulate adaptation (actual adaptation happens during test)
    if (i % 3 === 2) {
      if (consecutiveCorrect >= 2 && currentLevelIdx < 5) {
        currentLevelIdx++;
        consecutiveCorrect = 0;
      } else if (consecutiveWrong >= 2 && currentLevelIdx > 0) {
        currentLevelIdx--;
        consecutiveWrong = 0;
      }
    }
  }

  return selected.slice(0, totalQuestions);
}

function calculateLevel(answers: boolean[], questions: Question[]): CEFRLevel {
  const levelScores: Record<CEFRLevel, { correct: number; total: number }> = {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 },
    C2: { correct: 0, total: 0 },
  };

  questions.forEach((q, i) => {
    levelScores[q.level].total++;
    if (answers[i]) levelScores[q.level].correct++;
  });

  // Find highest level with >= 60% accuracy
  let highestLevel: CEFRLevel = "A1";
  for (const level of LEVEL_ORDER) {
    const s = levelScores[level];
    if (s.total > 0 && s.correct / s.total >= 0.6) {
      highestLevel = level;
    }
  }

  return highestLevel;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PlacementTestScreen() {
  const { showStreakToast } = useUsage();
  const router = useRouter();
  const { plan, isPremium } = useSubscription();
  const [testState, setTestState] = useState<TestState>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>("es");
  const [lastTestDate, setLastTestDate] = useState<string | null>(null);
  const [showRetakeGuard, setShowRetakeGuard] = useState(false);
  const [daysUntilRetake, setDaysUntilRetake] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ from: string; to: string } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem("@target_language").then((lang) => {
      if (lang) setTargetLanguage(lang);
    });
    AsyncStorage.getItem("@placement_test_date").then((date) => {
      if (date) setLastTestDate(date);
    });
  }, []);

  const canRetake = useCallback((): boolean => {
    // Premium users can always retake
    if (isPremium) return true;
    // First time — always allowed
    if (!lastTestDate) return true;
    // Free users: 1 retake per 30 days
    const lastDate = new Date(lastTestDate);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 30) return true;
    setDaysUntilRetake(30 - diffDays);
    return false;
  }, [isPremium, lastTestDate]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [testState]);

  const startTest = async () => {
    if (!canRetake()) {
      setShowRetakeGuard(true);
      return;
    }
    // Load CEFR estimate from onboarding experience selector
    const estimate = await AsyncStorage.getItem("@cefr_estimate") as CEFRLevel | null;
    const adaptive = getAdaptiveQuestions(QUESTION_BANK, estimate || undefined);
    setQuestions(adaptive);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowFeedback(false);
    setTestState("testing");
  };

  const handleSkipTest = async () => {
    // Default to A1 (Beginner) when skipping
    await AsyncStorage.setItem("@cefr_level", "A1");
    await AsyncStorage.setItem("@placement_test_skipped", "true");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Route to main app (onboarding already complete)
    router.replace("/(tabs)" as any);
  };

  const handleAnswer = (optionIndex: number) => {
    if (showFeedback) return;
    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const isCorrect = optionIndex === questions[currentIndex].correctIndex;
    setAnswers(prev => [...prev, isCorrect]);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(isCorrect ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animate progress
    Animated.timing(progressAnim, {
      toValue: (currentIndex + 1) / questions.length,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Move to next question after delay
    setTimeout(() => {
      if (currentIndex >= questions.length - 1) {
        finishTest([...answers, isCorrect]);
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setShowFeedback(false);
      }
    }, 1200);
  };

  const finishTest = async (finalAnswers: boolean[]) => {
    const level = calculateLevel(finalAnswers, questions);
    const correctCount = finalAnswers.filter(Boolean).length;

    const breakdown: Record<QuestionType, { correct: number; total: number }> = {
      vocabulary: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 },
      listening: { correct: 0, total: 0 },
    };

    questions.forEach((q, i) => {
      breakdown[q.type].total++;
      if (finalAnswers[i]) breakdown[q.type].correct++;
    });

    const testResult: TestResult = {
      level,
      score: Math.round((correctCount / questions.length) * 100),
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      breakdown,
    };

    setResult(testResult);
    setTestState("results");
    markPracticeAndToast(showStreakToast);

    // Check for level-up before saving
    const previousLevel = await AsyncStorage.getItem("@cefr_level");
    const leveledUp = previousLevel && LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(previousLevel as CEFRLevel);

    // Save to AsyncStorage
    await AsyncStorage.setItem("@cefr_level", level);
    await AsyncStorage.setItem("@placement_test_result", JSON.stringify(testResult));
    await AsyncStorage.setItem("@placement_test_date", new Date().toISOString());

    // Generate adaptive placement result and learning path
    try {
      const adaptiveResponses = questions.map((q, i) => ({
        questionId: q.id,
        correct: finalAnswers[i],
        question: {
          id: q.id,
          type: q.type as any,
          level: q.level,
          difficulty: CEFR_THETA[q.level],
          discrimination: 1.0,
          prompt: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          tags: [],
        },
      }));
      const placementResult = generatePlacementResult(adaptiveResponses);
      const learningPath = generateLearningPath(placementResult);
      await savePlacementResult(placementResult);
      await saveLearningPath(learningPath);
    } catch {}

    // Track CEFR history (array of {level, date, score})
    const historyRaw = await AsyncStorage.getItem("@cefr_history");
    const history: Array<{ level: string; date: string; score: number }> = historyRaw ? JSON.parse(historyRaw) : [];
    history.push({ level, date: new Date().toISOString(), score: testResult.score });
    await AsyncStorage.setItem("@cefr_history", JSON.stringify(history));

    // Set level-up flag for celebration
    if (leveledUp) {
      const upData = { from: previousLevel as string, to: level };
      await AsyncStorage.setItem("@cefr_level_up", JSON.stringify(upData));
      setLevelUpData(upData);
      setShowLevelUp(true);
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getTypeIcon = (type: QuestionType): string => {
    switch (type) {
      case "vocabulary": return "book";
      case "grammar": return "construct";
      case "reading": return "document-text";
      case "listening": return "headset";
    }
  };

  // ─── Render Intro ──────────────────────────────────────────────────────────
  const renderIntro = () => {
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage);
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <FeatureGateBanner feature="placement_retake" currentPlan={plan} />
        <View style={styles.introContainer}>
          <View style={styles.introIcon}>
            <Ionicons name="school" size={48} color={Colors.secondary} />
          </View>
          <Text style={styles.introTitle}>Placement Test</Text>
          <Text style={styles.introSubtitle}>
            Discover your {langInfo?.name || "language"} proficiency level
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>~10 minutes</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="help-circle" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>20 adaptive questions</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="trending-up" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>Questions adapt to your level</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="ribbon" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>CEFR level assessment (A1–C2)</Text>
            </View>
          </View>

          <View style={styles.levelsPreview}>
            <Text style={styles.levelsTitle}>CEFR Levels</Text>
            {LEVEL_ORDER.map((level) => (
              <View key={level} style={styles.levelRow}>
                <View style={[styles.levelBadge, { backgroundColor: CEFR_DESCRIPTIONS[level].color + "20" }]}>
                  <Text style={[styles.levelBadgeText, { color: CEFR_DESCRIPTIONS[level].color }]}>{level}</Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelName}>{CEFR_DESCRIPTIONS[level].title}</Text>
                  <Text style={styles.levelDesc} numberOfLines={1}>{CEFR_DESCRIPTIONS[level].description}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={startTest} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>{lastTestDate ? "Retake Test" : "Start Test"}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          {!lastTestDate && (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkipTest} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
          )}

          {!lastTestDate && (
            <View style={styles.retakeNote}>
              <Ionicons name="information-circle" size={16} color={Colors.textMuted} />
              <Text style={styles.retakeNoteText}>
                You'll start at A1 (Beginner). You can take the test later from Settings.
              </Text>
            </View>
          )}

          {lastTestDate && !isPremium && (
            <View style={styles.retakeNote}>
              <Ionicons name="information-circle" size={16} color={Colors.textMuted} />
              <Text style={styles.retakeNoteText}>
                Free plan: 1 retake per 30 days. Upgrade for unlimited retakes.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ─── Render Question ───────────────────────────────────────────────────────
  const renderQuestion = () => {
    if (questions.length === 0) return null;
    const q = questions[currentIndex];
    const progress = (currentIndex + 1) / questions.length;

    return (
      <View style={styles.questionContainer}>
        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
        </View>

        {/* Question Type Badge */}
        <View style={styles.typeBadge}>
          <Ionicons name={getTypeIcon(q.type) as any} size={14} color={Colors.secondary} />
          <Text style={styles.typeBadgeText}>{q.type.charAt(0).toUpperCase() + q.type.slice(1)}</Text>
          <Text style={styles.levelTag}>{q.level}</Text>
        </View>

        {/* Context (for reading questions) */}
        {q.context && (
          <View style={styles.contextCard}>
            <Ionicons name="document-text" size={16} color={Colors.textMuted} />
            <Text style={styles.contextText}>{q.context}</Text>
          </View>
        )}

        {/* Prompt */}
        <Text style={styles.questionPrompt}>{q.prompt}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {q.options.map((option, idx) => {
            let optionStyle = styles.optionBtn;
            let textStyle = styles.optionText;
            if (showFeedback) {
              if (idx === q.correctIndex) {
                optionStyle = { ...styles.optionBtn, ...styles.optionCorrect };
                textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
              } else if (idx === selectedOption && idx !== q.correctIndex) {
                optionStyle = { ...styles.optionBtn, ...styles.optionWrong };
                textStyle = { ...styles.optionText, ...styles.optionTextWrong };
              }
            } else if (idx === selectedOption) {
              optionStyle = { ...styles.optionBtn, ...styles.optionSelected };
            }

            return (
              <TouchableOpacity
                key={idx}
                style={optionStyle}
                onPress={() => handleAnswer(idx)}
                activeOpacity={0.7}
                disabled={showFeedback}
              >
                <View style={styles.optionLetter}>
                  <Text style={styles.optionLetterText}>{String.fromCharCode(65 + idx)}</Text>
                </View>
                <Text style={textStyle}>{option}</Text>
                {showFeedback && idx === q.correctIndex && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={{ marginLeft: "auto" }} />
                )}
                {showFeedback && idx === selectedOption && idx !== q.correctIndex && (
                  <Ionicons name="close-circle" size={20} color={Colors.error} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // ─── Render Results ────────────────────────────────────────────────────────
  const renderResults = () => {
    if (!result) return null;
    const levelInfo = CEFR_DESCRIPTIONS[result.level];

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.resultsContainer}>
          {/* Level Badge */}
          <View style={[styles.resultBadge, { backgroundColor: levelInfo.color + "20", borderColor: levelInfo.color }]}>
            <Text style={[styles.resultLevel, { color: levelInfo.color }]}>{result.level}</Text>
            <Text style={[styles.resultTitle, { color: levelInfo.color }]}>{levelInfo.title}</Text>
          </View>

          <Text style={styles.resultDescription}>{levelInfo.description}</Text>

          {/* Score */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <Text style={styles.scoreValue}>{result.score}%</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Correct Answers</Text>
              <Text style={styles.scoreValue}>{result.correctAnswers} / {result.totalQuestions}</Text>
            </View>
          </View>

          {/* Breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Skill Breakdown</Text>
            {(["vocabulary", "grammar", "reading", "listening"] as QuestionType[]).map((type) => {
              const data = result.breakdown[type];
              if (data.total === 0) return null;
              const pct = Math.round((data.correct / data.total) * 100);
              return (
                <View key={type} style={styles.breakdownRow}>
                  <Ionicons name={getTypeIcon(type) as any} size={16} color={Colors.textSecondary} />
                  <Text style={styles.breakdownLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  <View style={styles.breakdownBarContainer}>
                    <View style={[styles.breakdownBar, { width: `${pct}%`, backgroundColor: pct >= 60 ? Colors.success : Colors.error }]} />
                  </View>
                  <Text style={styles.breakdownPct}>{pct}%</Text>
                </View>
              );
            })}
          </View>

          {/* Recommendations */}
          <View style={styles.recsCard}>
            <Text style={styles.recsTitle}>Recommended Next Steps</Text>
            <View style={styles.recItem}>
              <Ionicons name="book" size={16} color={Colors.secondary} />
              <Text style={styles.recText}>Start lessons at {result.level} level</Text>
            </View>
            <View style={styles.recItem}>
              <Ionicons name="chatbubbles" size={16} color={Colors.secondary} />
              <Text style={styles.recText}>Practice conversations at {result.level === "A1" ? "beginner" : result.level === "A2" || result.level === "B1" ? "intermediate" : "advanced"} difficulty</Text>
            </View>
            <View style={styles.recItem}>
              <Ionicons name="musical-notes" size={16} color={Colors.secondary} />
              <Text style={styles.recText}>Try songs matched to your level</Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.startBtn} onPress={() => {
            // If coming from onboarding (no previous CEFR level before this test), go to main app
            // Otherwise go back to previous screen
            if (!lastTestDate) {
              router.replace("/(tabs)" as any);
            } else {
              router.back();
            }
          }} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Continue Learning</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.retakeBtn} onPress={startTest} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
            <Text style={styles.retakeBtnText}>Retake Test</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {testState === "intro" ? "Placement Test" : testState === "testing" ? "Testing..." : "Your Results"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {testState === "intro" && renderIntro()}
        {testState === "testing" && renderQuestion()}
        {testState === "results" && renderResults()}
      </Animated.View>

      {/* Retake Guard Modal */}
      <Modal transparent visible={showRetakeGuard} animationType="fade" onRequestClose={() => setShowRetakeGuard(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalOverlayBg} activeOpacity={1} onPress={() => setShowRetakeGuard(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconWrap}>
              <Ionicons name="time" size={32} color={Colors.warning} />
            </View>
            <Text style={styles.modalTitle}>Retake Limit Reached</Text>
            <Text style={styles.modalDesc}>
              Free plan users can retake the placement test once every 30 days. You have {daysUntilRetake} day{daysUntilRetake !== 1 ? "s" : ""} remaining until your next retake.
            </Text>
            <View style={styles.modalBenefits}>
              {["Unlimited placement retakes", "Track progress over time", "All CEFR levels unlocked", "Advanced lesson access"].map((b, i) => (
                <View key={i} style={styles.modalBenefitRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.modalBenefitText}>{b}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalUpgradeBtn}
              onPress={() => { setShowRetakeGuard(false); router.push("/payment-setup" as any); }}
              activeOpacity={0.8}
            >
              <Ionicons name="rocket" size={18} color={Colors.backgroundDark} />
              <Text style={styles.modalUpgradeBtnText}>Upgrade to Plus</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalDismiss} onPress={() => setShowRetakeGuard(false)}>
              <Text style={styles.modalDismissText}>I'll Wait</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Level-Up Celebration Modal */}
      <Modal transparent visible={showLevelUp} animationType="fade" onRequestClose={() => setShowLevelUp(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: "center", paddingVertical: 32 }]}>
            {/* Animated Confetti */}
            <ConfettiAnimation visible={showLevelUp} />

            {/* Trophy badge */}
            <View style={styles.trophyBadge}>
              <Ionicons name="trophy" size={48} color="#FFD700" />
            </View>

            <Text style={styles.levelUpTitle}>Level Up!</Text>
            <Text style={styles.levelUpSubtitle}>Congratulations! You've advanced!</Text>

            {levelUpData && (
              <View style={styles.levelUpProgress}>
                <View style={[styles.levelUpBadge, { backgroundColor: (CEFR_DESCRIPTIONS[levelUpData.from as CEFRLevel]?.color || "#EF4444") + "20" }]}>
                  <Text style={[styles.levelUpBadgeText, { color: CEFR_DESCRIPTIONS[levelUpData.from as CEFRLevel]?.color || "#EF4444" }]}>{levelUpData.from}</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color={Colors.gold} />
                <View style={[styles.levelUpBadge, { backgroundColor: (CEFR_DESCRIPTIONS[levelUpData.to as CEFRLevel]?.color || "#22C55E") + "20", borderWidth: 2, borderColor: CEFR_DESCRIPTIONS[levelUpData.to as CEFRLevel]?.color || "#22C55E" }]}>
                  <Text style={[styles.levelUpBadgeText, { color: CEFR_DESCRIPTIONS[levelUpData.to as CEFRLevel]?.color || "#22C55E", fontWeight: "800" }]}>{levelUpData.to}</Text>
                </View>
              </View>
            )}

            <Text style={styles.levelUpDesc}>
              {levelUpData ? `You've progressed from ${CEFR_DESCRIPTIONS[levelUpData.from as CEFRLevel]?.title || levelUpData.from} to ${CEFR_DESCRIPTIONS[levelUpData.to as CEFRLevel]?.title || levelUpData.to}!` : "Keep up the great work!"}
            </Text>

            {/* Achievement badge */}
            <View style={styles.achievementBadge}>
              <Ionicons name="ribbon" size={20} color="#FFD700" />
              <Text style={styles.achievementText}>Achievement Unlocked: Level Up Master</Text>
            </View>

            <TouchableOpacity
              style={styles.levelUpBtn}
              onPress={async () => {
                setShowLevelUp(false);
                await AsyncStorage.removeItem("@cefr_level_up");
                if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.levelUpBtnText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceCard,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  // Intro
  introContainer: {
    alignItems: "center",
    paddingTop: Spacing.xl,
  },
  introIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  introSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  infoCard: {
    width: "100%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  levelsPreview: {
    width: "100%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  levelsTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  levelBadge: {
    width: 36,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  levelDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    width: "100%",
  },
  startBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#fff",
  },
  // Question
  questionContainer: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
  },
  typeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.secondary,
  },
  levelTag: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  contextCard: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary + "60",
  },
  contextText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  questionPrompt: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: Spacing.sm,
  },
  optionSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "10",
  },
  optionCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + "15",
  },
  optionWrong: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + "15",
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetterText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  optionText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  optionTextCorrect: {
    color: Colors.success,
  },
  optionTextWrong: {
    color: Colors.error,
  },
  // Results
  resultsContainer: {
    alignItems: "center",
    paddingTop: Spacing.lg,
  },
  resultBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  resultLevel: {
    fontSize: 32,
    fontWeight: "900",
  },
  resultTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
  resultDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  scoreCard: {
    width: "100%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  scoreValue: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  breakdownCard: {
    width: "100%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  breakdownTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    width: 80,
  },
  breakdownBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  breakdownBar: {
    height: "100%",
    borderRadius: 3,
  },
  breakdownPct: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textPrimary,
    width: 35,
    textAlign: "right",
  },
  recsCard: {
    width: "100%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  recsTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  recItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  recText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  retakeBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  // Retake Note
  retakeNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  retakeNoteText: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
  },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.surfaceCard, borderRadius: 24, padding: 24, margin: 20, maxWidth: 400, alignSelf: "center", width: "90%" },
  modalOverlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: { backgroundColor: Colors.surfaceCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: "center" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 20 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.warning + "15", borderWidth: 2, borderColor: Colors.warning + "40", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  modalTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginBottom: 8 },
  modalDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 20, paddingHorizontal: 16 },
  modalBenefits: { width: "100%", gap: 8, marginBottom: 24 },
  modalBenefitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalBenefitText: { fontSize: FontSize.sm, color: Colors.textPrimary },
  modalUpgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.secondary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: BorderRadius.lg, width: "100%", marginBottom: 12 },
  modalUpgradeBtnText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.backgroundDark },
  modalDismiss: { paddingVertical: 8 },
  modalDismissText: { fontSize: FontSize.sm, color: Colors.textMuted },
  // Skip button
  skipBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  skipBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.textMuted,
    textDecorationLine: "underline",
  },
  // Level-Up Celebration
  trophyBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFD700" + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFD700" + "40",
  },
  levelUpTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  levelUpSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  levelUpProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  levelUpBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  levelUpBadgeText: {
    fontSize: 18,
    fontWeight: "700",
  },
  levelUpDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFD700" + "10",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFD700" + "30",
  },
  achievementText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFD700",
  },
  levelUpBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
  levelUpBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});
