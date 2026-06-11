import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Animated, Easing } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


type TestCategory = "Vocabulary" | "Grammar" | "Listening" | "Reading" | "Speaking";

interface Question {
  id: string;
  type: "multiple_choice" | "fill_in_blank" | "true_false" | "matching";
  prompt: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
}

interface Test {
  id: string;
  title: string;
  category: TestCategory;
  difficulty: string;
  questionCount: number;
  timeLimit: number; // in seconds
  dueDate?: string;
  questions: Question[];
}

interface TestResult {
  testId: string;
  score: number;
  total: number;
  grade: string;
  timeTaken: number;
  date: string;
}

const CATEGORIES: TestCategory[] = ["Vocabulary", "Grammar", "Listening", "Reading", "Speaking"];

const SAMPLE_TESTS: Test[] = [
  {
    id: "t1",
    title: "Basic Greetings & Numbers",
    category: "Vocabulary",
    difficulty: "A1",
    questionCount: 5,
    timeLimit: 300,
    dueDate: new Date().toISOString(), // Due today
    questions: [
      { id: "q1", type: "multiple_choice", prompt: "How do you say 'Hello'?", options: ["Hola", "Adiós", "Gracias", "Por favor"], correctAnswer: "Hola", explanation: "'Hola' is the standard greeting in Spanish." },
      { id: "q2", type: "true_false", prompt: "'Uno' means 'Two'.", options: ["True", "False"], correctAnswer: "False", explanation: "'Uno' means 'One'. 'Dos' means 'Two'." },
      { id: "q3", type: "fill_in_blank", prompt: "Translate 'Thank you': ______", correctAnswer: "Gracias", explanation: "'Gracias' means 'Thank you'." },
      { id: "q4", type: "multiple_choice", prompt: "Which number is 'Cinco'?", options: ["3", "4", "5", "6"], correctAnswer: "5", explanation: "'Cinco' is the number 5." },
      { id: "q5", type: "multiple_choice", prompt: "How do you say 'Goodbye'?", options: ["Hola", "Adiós", "Gracias", "Por favor"], correctAnswer: "Adiós", explanation: "'Adiós' means 'Goodbye'." },
    ],
  },
  {
    id: "t2",
    title: "Present Tense Verbs",
    category: "Grammar",
    difficulty: "A2",
    questionCount: 5,
    timeLimit: 420,
    questions: [
      { id: "q1", type: "multiple_choice", prompt: "Yo _____ (hablar) español.", options: ["hablo", "hablas", "habla", "hablamos"], correctAnswer: "hablo", explanation: "The 'yo' form of regular -ar verbs ends in -o." },
      { id: "q2", type: "fill_in_blank", prompt: "Tú _____ (comer) manzanas.", correctAnswer: "comes", explanation: "The 'tú' form of regular -er verbs ends in -es." },
      { id: "q3", type: "true_false", prompt: "'Nosotros vivimos' is correct for 'We live'.", options: ["True", "False"], correctAnswer: "True", explanation: "The 'nosotros' form of regular -ir verbs ends in -imos." },
      { id: "q4", type: "multiple_choice", prompt: "Ellos _____ (ser) estudiantes.", options: ["soy", "eres", "es", "son"], correctAnswer: "son", explanation: "'Son' is the 'ellos' form of the irregular verb 'ser'." },
      { id: "q5", type: "multiple_choice", prompt: "Ella _____ (tener) un perro.", options: ["tengo", "tienes", "tiene", "tenemos"], correctAnswer: "tiene", explanation: "'Tiene' is the 'ella' form of the irregular verb 'tener'." },
    ],
  },
  {
    id: "t3",
    title: "Restaurant Dialogue",
    category: "Listening",
    difficulty: "B1",
    questionCount: 5,
    timeLimit: 600,
    questions: [
      { id: "q1", type: "multiple_choice", prompt: "[Audio: '¿Qué desea pedir?'] What is the waiter asking?", options: ["What is your name?", "What do you want to order?", "Where is the bathroom?", "How much is it?"], correctAnswer: "What do you want to order?", explanation: "'¿Qué desea pedir?' translates to 'What do you want to order?'" },
      { id: "q2", type: "true_false", prompt: "[Audio: 'La cuenta, por favor.'] The customer is asking for the menu.", options: ["True", "False"], correctAnswer: "False", explanation: "'La cuenta' means 'the bill' or 'the check', not the menu." },
      { id: "q3", type: "fill_in_blank", prompt: "[Audio: 'Quiero una _____ de agua.'] (bottle)", correctAnswer: "botella", explanation: "'Botella' means 'bottle'." },
      { id: "q4", type: "multiple_choice", prompt: "[Audio: '¿Está picante?'] What does 'picante' mean?", options: ["Sweet", "Salty", "Spicy", "Sour"], correctAnswer: "Spicy", explanation: "'Picante' means 'spicy'." },
      { id: "q5", type: "multiple_choice", prompt: "[Audio: 'Buen provecho.'] When is this said?", options: ["Before a meal", "After a meal", "When paying", "When arriving"], correctAnswer: "Before a meal", explanation: "'Buen provecho' is said before eating, similar to 'Bon appétit'." },
    ],
  },
];

export default function QuizTestScreen() {
  const { showStreakToast } = useUsage();
  const [activeCategory, setActiveCategory] = useState<TestCategory>("Vocabulary");
  const [screenState, setScreenState] = useState<"browse" | "quiz" | "results" | "review">("browse");
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [fillBlankText, setFillBlankText] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (screenState === "quiz" && activeTest) {
      Animated.timing(progressAnim, {
        toValue: (currentQuestionIndex + 1) / activeTest.questionCount,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentQuestionIndex, screenState, activeTest]);

  useEffect(() => {
    if (screenState === "quiz" && timeRemaining > 0) {
      timerRef.current = setTimeout(() => setTimeRemaining((prev) => prev - 1), 1000);
    } else if (screenState === "quiz" && timeRemaining === 0) {
      submitTest();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeRemaining, screenState]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem("@quiz_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const saveHistory = async (newResult: TestResult) => {
    try {
      const updated = [newResult, ...history];
      setHistory(updated);
      await AsyncStorage.setItem("@quiz_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const startTest = (test: Test) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTest(test);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemaining(test.timeLimit);
    setScreenState("quiz");
    setFillBlankText("");
  };

  const handleAnswer = (answer: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!activeTest) return;
    
    const qId = activeTest.questions[currentQuestionIndex].id;
    setAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const nextQuestion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!activeTest) return;
    
    if (activeTest.questions[currentQuestionIndex].type === "fill_in_blank") {
      const qId = activeTest.questions[currentQuestionIndex].id;
      setAnswers((prev) => ({ ...prev, [qId]: fillBlankText }));
    }

    if (currentQuestionIndex < activeTest.questionCount - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setFillBlankText("");
    } else {
      submitTest();
    }
  };

  const calculateGrade = (score: number, total: number) => {
    const percentage = score / total;
    if (percentage >= 0.9) return "A";
    if (percentage >= 0.8) return "B";
    if (percentage >= 0.7) return "C";
    if (percentage >= 0.6) return "D";
    return "F";
  };

  const submitTest = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!activeTest) return;

    let score = 0;
    activeTest.questions.forEach((q) => {
      const userAnswer = answers[q.id] || (q.type === "fill_in_blank" ? fillBlankText : "");
      if (userAnswer.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim()) {
        score++;
      }
    });

    const result: TestResult = {
      testId: activeTest.id,
      score,
      total: activeTest.questionCount,
      grade: calculateGrade(score, activeTest.questionCount),
      timeTaken: activeTest.timeLimit - timeRemaining,
      date: new Date().toISOString(),
    };

    setTestResults(result);
    saveHistory(result);
    setScreenState("results");
    markPracticeAndToast(showStreakToast);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isDueToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const renderCategory = ({ item }: { item: TestCategory }) => (
    <TouchableOpacity
      style={[styles.categoryCard, activeCategory === item && styles.categoryCardActive]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveCategory(item);
      }}
    >
      <Text style={[styles.categoryText, activeCategory === item && styles.categoryTextActive]}>{item}</Text>
    </TouchableOpacity>
  );

  const renderTestCard = ({ item }: { item: Test }) => {
    const dueToday = isDueToday(item.dueDate);
    return (
      <TouchableOpacity
        style={[styles.testCard, dueToday && styles.testCardGlow]}
        onPress={() => startTest(item)}
      >
        <View style={styles.testCardHeader}>
          <Text style={styles.testTitle}>{item.title}</Text>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
        </View>
        <View style={styles.testCardDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="list" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.questionCount} Qs</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{formatTime(item.timeLimit)}</Text>
          </View>
        </View>
        {dueToday && (
          <View style={styles.dueBadge}>
            <Text style={styles.dueText}>DUE TODAY</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = ({ item }: { item: TestResult }) => {
    const test = SAMPLE_TESTS.find((t) => t.id === item.testId);
    return (
      <View style={styles.historyCard}>
        <View>
          <Text style={styles.historyTitle}>{test?.title || "Unknown Test"}</Text>
          <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.historyScoreContainer}>
          <Text style={styles.historyGrade}>{item.grade}</Text>
          <Text style={styles.historyScore}>{item.score}/{item.total}</Text>
        </View>
      </View>
    );
  };

  const renderBrowse = () => (
    <View style={styles.content}>
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
      <Text style={styles.sectionTitle}>Available Tests</Text>
      <FlatList
        data={SAMPLE_TESTS.filter((t) => t.category === activeCategory)}
        renderItem={renderTestCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.testList}
        ListEmptyComponent={<Text style={styles.emptyText}>No tests available in this category.</Text>}
      />
      <Text style={styles.sectionTitle}>Grade History</Text>
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => `${item.testId}-${index}`}
        contentContainerStyle={styles.historyList}
        ListEmptyComponent={<Text style={styles.emptyText}>No history yet.</Text>}
      />
    </View>
  );

  const renderQuiz = () => {
    if (!activeTest) return null;
    const question = activeTest.questions[currentQuestionIndex];
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    return (
      <View style={styles.quizContainer}>
        <View style={styles.quizHeader}>
          <Text style={styles.quizProgressText}>Question {currentQuestionIndex + 1} of {activeTest.questionCount}</Text>
          <Text style={[styles.quizTimer, timeRemaining < 60 && styles.quizTimerWarning]}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionPrompt}>{question.prompt}</Text>

          {question.type === "multiple_choice" || question.type === "true_false" ? (
            <View style={styles.optionsContainer}>
              {question.options?.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionBtn, answers[question.id] === opt && styles.optionBtnSelected]}
                  onPress={() => handleAnswer(opt)}
                >
                  <Text style={[styles.optionText, answers[question.id] === opt && styles.optionTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : question.type === "fill_in_blank" ? (
            <TextInput
              style={styles.textInput}
              value={fillBlankText}
              onChangeText={setFillBlankText}
              placeholder="Type your answer..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, (!answers[question.id] && !fillBlankText) && styles.nextBtnDisabled]}
          onPress={nextQuestion}
          disabled={!answers[question.id] && !fillBlankText}
        >
          <Text style={styles.nextBtnText}>
            {currentQuestionIndex === activeTest.questionCount - 1 ? "Submit Test" : "Next Question"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderResults = () => {
    if (!testResults || !activeTest) return null;
    const percentage = Math.round((testResults.score / testResults.total) * 100);

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Complete!</Text>
        <View style={styles.gradeCircle}>
          <Text style={styles.gradeText}>{testResults.grade}</Text>
        </View>
        <Text style={styles.scoreText}>{percentage}% ({testResults.score}/{testResults.total})</Text>
        <Text style={styles.timeText}>Time taken: {formatTime(testResults.timeTaken)}</Text>

        <View style={styles.resultsActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setScreenState("review");
            }}
          >
            <Ionicons name="search" size={20} color={Colors.textPrimary} />
            <Text style={styles.actionBtnText}>Review Answers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setScreenState("browse");
            }}
          >
            <Ionicons name="home" size={20} color={Colors.primary} />
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Back to Tests</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReview = () => {
    if (!activeTest) return null;

    return (
      <View style={styles.reviewContainer}>
        <Text style={styles.sectionTitle}>Review Answers</Text>
        <FlatList
          data={activeTest.questions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.reviewList}
          renderItem={({ item, index }) => {
            const userAnswer = answers[item.id] || "";
            const isCorrect = userAnswer.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();

            return (
              <View style={[styles.reviewCard, isCorrect ? styles.reviewCardCorrect : styles.reviewCardWrong]}>
                <Text style={styles.reviewQuestionNum}>Question {index + 1}</Text>
                <Text style={styles.reviewPrompt}>{item.prompt}</Text>
                <View style={styles.reviewAnswerRow}>
                  <Text style={styles.reviewLabel}>Your Answer:</Text>
                  <Text style={[styles.reviewAnswer, isCorrect ? styles.textSuccess : styles.textError]}>
                    {userAnswer || "(No answer)"}
                  </Text>
                </View>
                {!isCorrect && (
                  <View style={styles.reviewAnswerRow}>
                    <Text style={styles.reviewLabel}>Correct Answer:</Text>
                    <Text style={[styles.reviewAnswer, styles.textSuccess]}>{item.correctAnswer}</Text>
                  </View>
                )}
                <Text style={styles.reviewExplanation}>{item.explanation}</Text>
              </View>
            );
          }}
        />
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setScreenState("browse");
          }}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (screenState === "quiz") {
                // Confirm exit? For now just go back to browse
                setScreenState("browse");
              } else if (screenState === "results" || screenState === "review") {
                setScreenState("browse");
              } else {
                router.back();
              }
            }}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {screenState === "quiz" ? activeTest?.title : "Quiz & Tests"}
          </Text>
        </View>

        {screenState === "browse" && renderBrowse()}
        {screenState === "quiz" && renderQuiz()}
        {screenState === "results" && renderResults()}
        {screenState === "review" && renderReview()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  title: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginLeft: Spacing.md },
  content: { flex: 1 },
  categoriesContainer: { paddingVertical: Spacing.md },
  categoriesList: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  categoryCard: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  categoryCardActive: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.glow },
  categoryText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: "600" },
  categoryTextActive: { color: Colors.glow },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.sm },
  testList: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.lg },
  testCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  testCardGlow: { borderColor: Colors.glowBorder, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  testCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  testTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.textPrimary, flex: 1 },
  difficultyBadge: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  difficultyText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: "700" },
  testCardDetails: { flexDirection: "row", gap: Spacing.lg },
  detailItem: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  detailText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  dueBadge: { position: "absolute", top: -10, right: 10, backgroundColor: Colors.accent, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  dueText: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: "800" },
  historyList: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  historyCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.surfaceCard, padding: Spacing.md, borderRadius: BorderRadius.md },
  historyTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: "600" },
  historyDate: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs },
  historyScoreContainer: { alignItems: "flex-end" },
  historyGrade: { color: Colors.glow, fontSize: FontSize.lg, fontWeight: "800" },
  historyScore: { color: Colors.textSecondary, fontSize: FontSize.sm },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md, textAlign: "center", marginTop: Spacing.lg },
  
  quizContainer: { flex: 1, padding: Spacing.lg },
  quizHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  quizProgressText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: "600" },
  quizTimer: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: "700", fontVariant: ["tabular-nums"] },
  quizTimerWarning: { color: Colors.error },
  progressBarBg: { height: 6, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.full, overflow: "hidden", marginBottom: Spacing.xl },
  progressBarFill: { height: "100%", backgroundColor: Colors.glow },
  questionContainer: { flex: 1 },
  questionPrompt: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: "700", marginBottom: Spacing.xl, lineHeight: 32 },
  optionsContainer: { gap: Spacing.md },
  optionBtn: { backgroundColor: Colors.surfaceCard, padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  optionBtnSelected: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.glow },
  optionText: { color: Colors.textPrimary, fontSize: FontSize.md },
  optionTextSelected: { color: Colors.glow, fontWeight: "600" },
  textInput: { backgroundColor: Colors.surfaceCard, color: Colors.textPrimary, fontSize: FontSize.lg, padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  nextBtn: { backgroundColor: Colors.glow, padding: Spacing.lg, borderRadius: BorderRadius.full, alignItems: "center", marginTop: Spacing.lg },
  nextBtnDisabled: { backgroundColor: Colors.surfaceCard, opacity: 0.5 },
  nextBtnText: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: "700" },

  resultsContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg },
  resultsTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: "800", marginBottom: Spacing.xl },
  gradeCircle: { width: 150, height: 150, borderRadius: 75, backgroundColor: Colors.surfaceCard, borderWidth: 4, borderColor: Colors.glow, alignItems: "center", justifyContent: "center", marginBottom: Spacing.lg, shadowColor: Colors.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  gradeText: { color: Colors.glow, fontSize: 64, fontWeight: "900" },
  scoreText: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: "700", marginBottom: Spacing.sm },
  timeText: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.xxl },
  resultsActions: { flexDirection: "row", gap: Spacing.md, width: "100%" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Colors.surfaceCard, padding: Spacing.md, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  actionBtnPrimary: { backgroundColor: Colors.glow, borderColor: Colors.glow },
  actionBtnText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: "600" },

  reviewContainer: { flex: 1 },
  reviewList: { padding: Spacing.lg, gap: Spacing.md },
  reviewCard: { backgroundColor: Colors.surfaceCard, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  reviewCardCorrect: { borderColor: Colors.success + "40" },
  reviewCardWrong: { borderColor: Colors.error + "40" },
  reviewQuestionNum: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "700", marginBottom: Spacing.xs },
  reviewPrompt: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: "600", marginBottom: Spacing.md },
  reviewAnswerRow: { flexDirection: "row", marginBottom: Spacing.xs },
  reviewLabel: { color: Colors.textMuted, fontSize: FontSize.sm, width: 100 },
  reviewAnswer: { fontSize: FontSize.sm, fontWeight: "600", flex: 1 },
  textSuccess: { color: Colors.success },
  textError: { color: Colors.error },
  reviewExplanation: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.sm, fontStyle: "italic" },
  doneBtn: { backgroundColor: Colors.glow, margin: Spacing.lg, padding: Spacing.md, borderRadius: BorderRadius.full, alignItems: "center" },
  doneBtnText: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: "700" },
});
