import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { trpc } from "@/lib/trpc";
import { usePaywallGate } from "@/hooks/use-paywall-gate";
import { PaywallModal } from "@/components/paywall-modal";

// ─── Types ───────────────────────────────────────────────────────────────────
type QuizStatus = "available" | "in-progress" | "completed" | "overdue";
type QuizType = "vocabulary" | "grammar" | "listening" | "pronunciation" | "reading" | "mixed";

type QuizItem = {
  id: string;
  title: string;
  type: QuizType;
  questionCount: number;
  timeLimit: number; // minutes
  dueDate?: string;
  status: QuizStatus;
  score?: number; // 0-100
  grade?: string;
  completedAt?: string;
  assignedBy?: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
};

type ReportCard = {
  overallGrade: string;
  averageScore: number;
  totalQuizzes: number;
  strengths: string[];
  weaknesses: string[];
  recentScores: { label: string; score: number }[];
};

// ─── Mock Data ───────────────────────────────────────────────────────────────
const QUIZZES: QuizItem[] = [
  { id: "q1", title: "Ser vs. Estar Quiz", type: "grammar", questionCount: 15, timeLimit: 10, status: "available", dueDate: "2026-05-23", assignedBy: "Maria" },
  { id: "q2", title: "Food Vocabulary Test", type: "vocabulary", questionCount: 20, timeLimit: 12, status: "available", dueDate: "2026-05-24" },
  { id: "q3", title: "Listening Comprehension", type: "listening", questionCount: 10, timeLimit: 15, status: "overdue", dueDate: "2026-05-20", assignedBy: "Carlos" },
  { id: "q4", title: "Pronunciation Check", type: "pronunciation", questionCount: 8, timeLimit: 5, status: "in-progress" },
  { id: "q5", title: "Week 3 Mixed Review", type: "mixed", questionCount: 25, timeLimit: 20, status: "completed", score: 88, grade: "A-", completedAt: "2026-05-19" },
  { id: "q6", title: "Preterite Tense Drill", type: "grammar", questionCount: 12, timeLimit: 8, status: "completed", score: 72, grade: "B-", completedAt: "2026-05-17", assignedBy: "Maria" },
  { id: "q7", title: "Travel Phrases Quiz", type: "vocabulary", questionCount: 15, timeLimit: 10, status: "completed", score: 95, grade: "A+", completedAt: "2026-05-15" },
  { id: "q8", title: "Reading: El Mercado", type: "reading", questionCount: 10, timeLimit: 12, status: "completed", score: 80, grade: "B+", completedAt: "2026-05-12" },
];

const MOCK_QUESTIONS: QuizQuestion[] = [
  { id: "mq1", question: "\"Yo ___ estudiante\" — Which verb fits?", options: ["soy", "estoy", "tengo", "hago"], correctIndex: 0, explanation: "Use 'ser' for permanent characteristics like occupation/identity.", difficulty: "easy" },
  { id: "mq2", question: "\"La comida ___ lista\" — Which verb fits?", options: ["es", "está", "tiene", "hace"], correctIndex: 1, explanation: "Use 'estar' for temporary states/conditions.", difficulty: "medium" },
  { id: "mq3", question: "\"Nosotros ___ de Colombia\" — Which verb fits?", options: ["estamos", "somos", "tenemos", "vamos"], correctIndex: 1, explanation: "Use 'ser' for origin/nationality.", difficulty: "easy" },
  { id: "mq4", question: "\"Ella ___ cansada hoy\" — Which verb fits?", options: ["es", "está", "tiene", "va"], correctIndex: 1, explanation: "Use 'estar' for temporary feelings/conditions.", difficulty: "medium" },
  { id: "mq5", question: "\"La fiesta ___ en mi casa\" — Which verb fits?", options: ["es", "está", "tiene", "hay"], correctIndex: 0, explanation: "Use 'ser' for events (location of events).", difficulty: "hard" },
];

const REPORT_CARD: ReportCard = {
  overallGrade: "B+",
  averageScore: 84,
  totalQuizzes: 12,
  strengths: ["Vocabulary", "Reading Comprehension", "Pronunciation"],
  weaknesses: ["Subjunctive Mood", "Preterite vs. Imperfect"],
  recentScores: [
    { label: "Week 1", score: 72 },
    { label: "Week 2", score: 78 },
    { label: "Week 3", score: 85 },
    { label: "Week 4", score: 88 },
    { label: "Week 5", score: 95 },
  ],
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function QuizCenterScreen() {
  const { showPaywall, paywallFeature, singlePrice, checkAccess, dismissPaywall } = usePaywallGate();

  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "report">("pending");
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>(MOCK_QUESTIONS);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const generateQuiz = trpc.adaptiveExercise.generateLesson.useMutation();

  // Timer logic
  useEffect(() => {
    if (quizMode && timeLeft > 0 && !quizFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setQuizFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [quizMode, quizFinished]);

  const startQuiz = async (quiz: QuizItem) => {
    setActiveQuiz(quiz);
    setLoadingQuiz(true);
    // Try to generate real questions from server
    try {
      const result = await generateQuiz.mutateAsync({
        language: 'Spanish',
        level: 'B1',
        lessonTopic: quiz.type || 'general',
        lessonCategory: 'quiz',
      });
      if ((result as any)?.success && (result as any)?.lesson?.exercises) {
        const exercises = (result as any).lesson.exercises;
        const serverQuestions: QuizQuestion[] = exercises.slice(0, 5).map((ex: any, i: number) => ({
          id: `sq_${i}`,
          question: ex.title || ex.prompt || ex.scenario || `Question ${i + 1}`,
          options: ex.steps?.[0]?.options || ex.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: ex.steps?.[0]?.correctIndex ?? ex.correctIndex ?? 0,
          explanation: ex.steps?.[0]?.correctFeedback || ex.culturalNote || 'Correct!',
          difficulty: ex.difficulty || 'medium',
        }));
        if (serverQuestions.length > 0) setQuestions(serverQuestions);
      }
    } catch {
      // Fall back to MOCK_QUESTIONS
      setQuestions(MOCK_QUESTIONS);
    }
    setLoadingQuiz(false);
    setQuizMode(true);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setTimeLeft(quiz.timeLimit * 60);
    setQuizFinished(false);
    setAnswers(new Array(questions.length).fill(null));
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const selectAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
    if (index === questions[currentQuestion].correctIndex) {
      setScore((prev) => prev + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const exitQuiz = () => {
    setQuizMode(false);
    setActiveQuiz(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: QuizStatus) => {
    switch (status) {
      case "available": return Colors.secondary;
      case "in-progress": return Colors.gold;
      case "overdue": return Colors.error;
      case "completed": return Colors.success;
    }
  };

  const getStatusLabel = (status: QuizStatus) => {
    switch (status) {
      case "available": return "Ready";
      case "in-progress": return "In Progress";
      case "overdue": return "Overdue";
      case "completed": return "Done";
    }
  };

  const getTypeIcon = (type: QuizType) => {
    switch (type) {
      case "vocabulary": return "text";
      case "grammar": return "school";
      case "listening": return "headset";
      case "pronunciation": return "mic";
      case "reading": return "book";
      case "mixed": return "layers";
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return Colors.success;
    if (grade.startsWith("B")) return Colors.secondary;
    if (grade.startsWith("C")) return Colors.gold;
    if (grade.startsWith("D")) return Colors.warning;
    return Colors.error;
  };

  const pendingQuizzes = QUIZZES.filter((q) => q.status !== "completed");
  const completedQuizzes = QUIZZES.filter((q) => q.status === "completed");

  // ─── Quiz Mode Render ──────────────────────────────────────────────────────
  if (quizMode && activeQuiz) {
    if (quizFinished) {
      const finalScore = Math.round((score / questions.length) * 100);
      const grade = finalScore >= 93 ? "A" : finalScore >= 85 ? "A-" : finalScore >= 80 ? "B+" : finalScore >= 73 ? "B" : finalScore >= 68 ? "B-" : finalScore >= 63 ? "C+" : finalScore >= 58 ? "C" : "D";
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.resultScreen}>
            <View style={[styles.gradeCircle, { borderColor: getGradeColor(grade) }]}>
              <Text style={[styles.gradeText, { color: getGradeColor(grade) }]}>{grade}</Text>
              <Text style={styles.gradePercent}>{finalScore}%</Text>
            </View>
            <Text style={styles.resultTitle}>Quiz Complete!</Text>
            <Text style={styles.resultSub}>{activeQuiz.title}</Text>
            <View style={styles.resultStats}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNum}>{score}/{questions.length}</Text>
                <Text style={styles.resultStatLabel}>Correct</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatNum}>{formatTime(activeQuiz.timeLimit * 60 - timeLeft)}</Text>
                <Text style={styles.resultStatLabel}>Time Used</Text>
              </View>
            </View>
            {/* Wrong answers review */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Review Mistakes</Text>
              {questions.map((q, i) => {
                if (answers[i] === q.correctIndex) return null;
                return (
                  <View key={q.id} style={styles.reviewItem}>
                    <Text style={styles.reviewQ}>{q.question}</Text>
                    <Text style={styles.reviewCorrect}>Correct: {q.options[q.correctIndex]}</Text>
                    <Text style={styles.reviewExplanation}>{q.explanation}</Text>
                  </View>
                );
              })}
              {answers.every((a, i) => a === questions[i]?.correctIndex) && (
                <Text style={styles.perfectText}>Perfect score! No mistakes to review.</Text>
              )}
            </View>
            <TouchableOpacity style={styles.exitBtn} onPress={exitQuiz} activeOpacity={0.8}>
              <Text style={styles.exitBtnText}>Back to Quiz Center</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    const question = questions[currentQuestion];
    return (
      <SafeAreaView style={styles.container}>
        {/* Quiz Header */}
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={exitQuiz} style={styles.quizExitBtn}>
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.quizProgress}>
            <View style={styles.quizProgressBar}>
              <View style={[styles.quizProgressFill, { width: `${((currentQuestion + 1) / questions.length) * 100}%` }]} />
            </View>
            <Text style={styles.quizProgressText}>{currentQuestion + 1}/{questions.length}</Text>
          </View>
          <View style={[styles.timerBadge, timeLeft < 60 && styles.timerUrgent]}>
            <Ionicons name="time" size={14} color={timeLeft < 60 ? Colors.error : Colors.gold} />
            <Text style={[styles.timerText, timeLeft < 60 && styles.timerTextUrgent]}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {/* Question */}
        <ScrollView contentContainerStyle={styles.quizContent}>
          <View style={styles.difficultyRow}>
            <View style={[styles.diffBadge, { backgroundColor: question.difficulty === "easy" ? Colors.success + "20" : question.difficulty === "medium" ? Colors.gold + "20" : Colors.error + "20" }]}>
              <Text style={[styles.diffText, { color: question.difficulty === "easy" ? Colors.success : question.difficulty === "medium" ? Colors.gold : Colors.error }]}>
                {question.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              let optionStyle = styles.optionBtn;
              let textStyle = styles.optionText;
              if (selectedAnswer !== null) {
                if (index === question.correctIndex) {
                  optionStyle = { ...styles.optionBtn, ...styles.optionCorrect };
                  textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
                } else if (index === selectedAnswer && index !== question.correctIndex) {
                  optionStyle = { ...styles.optionBtn, ...styles.optionWrong };
                  textStyle = { ...styles.optionText, ...styles.optionTextWrong };
                }
              }
              return (
                <TouchableOpacity
                  key={index}
                  style={[optionStyle, selectedAnswer === index && index === question.correctIndex && styles.optionCorrect]}
                  onPress={() => selectAnswer(index)}
                  activeOpacity={0.7}
                  disabled={selectedAnswer !== null}
                >
                  <View style={styles.optionLetter}>
                    <Text style={styles.optionLetterText}>{String.fromCharCode(65 + index)}</Text>
                  </View>
                  <Text style={[textStyle]}>{option}</Text>
                  {selectedAnswer !== null && index === question.correctIndex && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={{ marginLeft: "auto" }} />
                  )}
                  {selectedAnswer === index && index !== question.correctIndex && (
                    <Ionicons name="close-circle" size={20} color={Colors.error} style={{ marginLeft: "auto" }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation */}
          {showExplanation && (
            <View style={styles.explanationCard}>
              <Ionicons name="bulb" size={18} color={Colors.gold} />
              <Text style={styles.explanationText}>{question.explanation}</Text>
            </View>
          )}

          {/* Next button */}
          {selectedAnswer !== null && (
            <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion} activeOpacity={0.8}>
              <Text style={styles.nextBtnText}>
                {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Main Quiz Center Render ───────────────────────────────────────────────
  const renderQuizItem = ({ item }: { item: QuizItem }) => (
    <TouchableOpacity
      style={styles.quizCard}
      activeOpacity={0.7}
      onPress={() => {
        if (item.status === "available" || item.status === "overdue" || item.status === "in-progress") {
          startQuiz(item);
        }
      }}
    >
      <View style={styles.quizCardLeft}>
        <View style={[styles.quizIcon, { backgroundColor: getStatusColor(item.status) + "15" }]}>
          <Ionicons name={getTypeIcon(item.type) as any} size={20} color={getStatusColor(item.status)} />
        </View>
      </View>
      <View style={styles.quizCardCenter}>
        <View style={styles.quizTitleRow}>
          <Text style={styles.quizTitle} numberOfLines={1}>{item.title}</Text>
          {item.status === "overdue" && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueBadgeText}>OVERDUE</Text>
            </View>
          )}
        </View>
        <View style={styles.quizMeta}>
          <Text style={styles.quizMetaText}>{item.questionCount} questions</Text>
          <Text style={styles.quizMetaDot}>·</Text>
          <Text style={styles.quizMetaText}>{item.timeLimit} min</Text>
          {item.assignedBy && (
            <>
              <Text style={styles.quizMetaDot}>·</Text>
              <Text style={styles.quizMetaText}>by {item.assignedBy}</Text>
            </>
          )}
        </View>
        {item.dueDate && item.status !== "completed" && (
          <Text style={[styles.dueText, item.status === "overdue" && { color: Colors.error }]}>
            Due: {item.dueDate}
          </Text>
        )}
        {item.status === "completed" && item.score !== undefined && (
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreGrade, { color: getGradeColor(item.grade || "C") }]}>{item.grade}</Text>
            <Text style={styles.scorePercent}>{item.score}%</Text>
          </View>
        )}
      </View>
      <View style={styles.quizCardRight}>
        {item.status === "completed" ? (
          <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
        ) : (
          <View style={[styles.startBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.startBadgeText}>{item.status === "in-progress" ? "Resume" : "Start"}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Quiz Center</Text>
          <Text style={styles.headerSub}>Tests & assessments</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["pending", "completed", "report"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "pending" ? `Pending (${pendingQuizzes.length})` : tab === "completed" ? "History" : "Report Card"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === "pending" && (
        <FlatList
          data={pendingQuizzes}
          keyExtractor={(item) => item.id}
          renderItem={renderQuizItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle" size={48} color={Colors.success} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySub}>No pending quizzes or tests</Text>
            </View>
          }
        />
      )}

      {activeTab === "completed" && (
        <FlatList
          data={completedQuizzes}
          keyExtractor={(item) => item.id}
          renderItem={renderQuizItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === "report" && (
        <ScrollView contentContainerStyle={styles.reportContent} showsVerticalScrollIndicator={false}>
          {/* Overall Grade */}
          <View style={styles.reportGradeCard}>
            <View style={[styles.reportGradeCircle, { borderColor: getGradeColor(REPORT_CARD.overallGrade) }]}>
              <Text style={[styles.reportGradeText, { color: getGradeColor(REPORT_CARD.overallGrade) }]}>{REPORT_CARD.overallGrade}</Text>
            </View>
            <View>
              <Text style={styles.reportGradeLabel}>Overall Grade</Text>
              <Text style={styles.reportGradeSub}>{REPORT_CARD.averageScore}% avg · {REPORT_CARD.totalQuizzes} quizzes</Text>
            </View>
          </View>

          {/* Score Trend */}
          <View style={styles.trendCard}>
            <Text style={styles.trendTitle}>Score Trend</Text>
            <View style={styles.trendBars}>
              {REPORT_CARD.recentScores.map((s, i) => (
                <View key={i} style={styles.trendBarCol}>
                  <View style={styles.trendBarBg}>
                    <View style={[styles.trendBarFill, { height: `${s.score}%`, backgroundColor: s.score >= 85 ? Colors.success : s.score >= 70 ? Colors.secondary : Colors.gold }]} />
                  </View>
                  <Text style={styles.trendBarLabel}>{s.label}</Text>
                  <Text style={styles.trendBarScore}>{s.score}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Strengths & Weaknesses */}
          <View style={styles.swCard}>
            <View style={styles.swSection}>
              <View style={styles.swHeader}>
                <Ionicons name="trophy" size={16} color={Colors.success} />
                <Text style={styles.swTitle}>Strengths</Text>
              </View>
              {REPORT_CARD.strengths.map((s, i) => (
                <View key={i} style={styles.swItem}>
                  <Ionicons name="checkmark" size={14} color={Colors.success} />
                  <Text style={styles.swItemText}>{s}</Text>
                </View>
              ))}
            </View>
            <View style={styles.swDivider} />
            <View style={styles.swSection}>
              <View style={styles.swHeader}>
                <Ionicons name="trending-up" size={16} color={Colors.gold} />
                <Text style={styles.swTitle}>Needs Work</Text>
              </View>
              {REPORT_CARD.weaknesses.map((w, i) => (
                <View key={i} style={styles.swItem}>
                  <Ionicons name="alert-circle" size={14} color={Colors.gold} />
                  <Text style={styles.swItemText}>{w}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    
      <PaywallModal
        visible={showPaywall}
        onClose={dismissPaywall}
        feature={paywallFeature}
        singlePrice={singlePrice}
      />
</SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },

  // Tabs
  tabRow: { flexDirection: "row", marginHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: 6 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.full, alignItems: "center", backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  tabText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  tabTextActive: { color: Colors.textPrimary },

  // List
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: 10 },
  quizCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  quizCardLeft: {},
  quizIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quizCardCenter: { flex: 1, gap: 4 },
  quizTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  quizTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, flex: 1 },
  overdueBadge: { backgroundColor: Colors.error + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.error + "40" },
  overdueBadgeText: { fontSize: 9, fontWeight: "800", color: Colors.error, letterSpacing: 0.5 },
  quizMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  quizMetaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  quizMetaDot: { fontSize: FontSize.xs, color: Colors.textMuted },
  dueText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  scoreGrade: { fontSize: FontSize.sm, fontWeight: "800" },
  scorePercent: { fontSize: FontSize.xs, color: Colors.textSecondary },
  quizCardRight: { alignItems: "center", justifyContent: "center" },
  startBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  startBadgeText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.textPrimary },

  // Empty
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // Quiz mode
  quizHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 12 },
  quizExitBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  quizProgress: { flex: 1, gap: 4 },
  quizProgressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" },
  quizProgressFill: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 2 },
  quizProgressText: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: "center" },
  timerBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.goldGlow, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.goldBorder },
  timerUrgent: { backgroundColor: Colors.redGlow, borderColor: Colors.redBorder },
  timerText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.gold },
  timerTextUrgent: { color: Colors.error },
  quizContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  difficultyRow: { marginBottom: Spacing.md },
  diffBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  diffText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  questionText: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, lineHeight: 32, marginBottom: Spacing.xl },
  optionsContainer: { gap: 10 },
  optionBtn: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, gap: 12 },
  optionCorrect: { borderColor: Colors.success, backgroundColor: Colors.success + "10" },
  optionWrong: { borderColor: Colors.error, backgroundColor: Colors.error + "10" },
  optionLetter: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  optionLetterText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textSecondary },
  optionText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary, flex: 1 },
  optionTextCorrect: { color: Colors.success },
  optionTextWrong: { color: Colors.error },
  explanationCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: Spacing.lg, backgroundColor: Colors.goldGlow, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.goldBorder },
  explanationText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: Spacing.xl, backgroundColor: Colors.secondary, paddingVertical: 14, borderRadius: BorderRadius.full },
  nextBtnText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },

  // Result screen
  resultScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.lg },
  gradeCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, alignItems: "center", justifyContent: "center", marginBottom: Spacing.lg },
  gradeText: { fontSize: 36, fontWeight: "800" },
  gradePercent: { fontSize: FontSize.sm, color: Colors.textSecondary },
  resultTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary },
  resultSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  resultStats: { flexDirection: "row", gap: 40, marginTop: Spacing.xl },
  resultStat: { alignItems: "center" },
  resultStatNum: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  resultStatLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  reviewSection: { marginTop: Spacing.xl, width: "100%", gap: 10 },
  reviewTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  reviewItem: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  reviewQ: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  reviewCorrect: { fontSize: FontSize.xs, color: Colors.success },
  reviewExplanation: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: "italic" },
  perfectText: { fontSize: FontSize.sm, color: Colors.success, textAlign: "center", marginTop: 8 },
  exitBtn: { marginTop: Spacing.xl, backgroundColor: Colors.surfaceCard, paddingHorizontal: 32, paddingVertical: 14, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  exitBtnText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },

  // Report card
  reportContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: 16 },
  reportGradeCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  reportGradeCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  reportGradeText: { fontSize: FontSize.xl, fontWeight: "800" },
  reportGradeLabel: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  reportGradeSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  trendCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  trendTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  trendBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120 },
  trendBarCol: { alignItems: "center", flex: 1, gap: 4 },
  trendBarBg: { width: 24, height: 100, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden", justifyContent: "flex-end" },
  trendBarFill: { width: "100%", borderRadius: 12 },
  trendBarLabel: { fontSize: 9, color: Colors.textMuted },
  trendBarScore: { fontSize: 10, fontWeight: "700", color: Colors.textSecondary },
  swCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  swSection: { gap: 8 },
  swHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  swTitle: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.textPrimary },
  swItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  swItemText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  swDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
});
