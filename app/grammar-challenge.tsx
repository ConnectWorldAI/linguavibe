import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Share,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


// ─── Types ──────────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

interface ChallengeResult {
  id: string;
  date: string;
  friendName: string;
  friendId: string;
  myScore: number;
  friendScore: number | null; // null if pending
  totalQuestions: number;
  status: "pending" | "won" | "lost" | "tied" | "waiting";
  questions: QuizQuestion[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CHALLENGE_HISTORY_KEY = "@grammar_challenge_history";

const GRAMMAR_CATEGORIES = [
  "Verb Conjugation",
  "Pronouns",
  "Articles",
  "Prepositions",
  "Gender Agreement",
  "Word Order",
  "Accent Marks",
  "Formality Register",
];

// ─── Quiz Question Generator ────────────────────────────────────────────────

function generateChallengeQuestions(count: number = 10): QuizQuestion[] {
  const questionBank: QuizQuestion[] = [
    {
      id: "q1",
      question: "Which is correct? 'Yo _____ al mercado ayer.'",
      options: ["fui", "iba", "iré", "voy"],
      correctIndex: 0,
      explanation: "Use 'fui' (preterite) for completed past actions.",
      category: "Verb Conjugation",
    },
    {
      id: "q2",
      question: "Choose the correct article: '_____ agua está fría.'",
      options: ["La", "El", "Los", "Un"],
      correctIndex: 1,
      explanation: "'Agua' is feminine but uses 'el' because it starts with a stressed 'a'.",
      category: "Articles",
    },
    {
      id: "q3",
      question: "Which preposition? 'Vamos _____ la playa.'",
      options: ["a", "en", "por", "de"],
      correctIndex: 0,
      explanation: "Use 'a' with verbs of motion to indicate destination.",
      category: "Prepositions",
    },
    {
      id: "q4",
      question: "Select the correct pronoun: '_____ dije la verdad.'",
      options: ["Le", "Lo", "La", "Les"],
      correctIndex: 0,
      explanation: "'Le' is the indirect object pronoun for 'a él/ella/usted'.",
      category: "Pronouns",
    },
    {
      id: "q5",
      question: "Which form is correct? 'Las casas son _____.'",
      options: ["bonitas", "bonito", "bonita", "bonitos"],
      correctIndex: 0,
      explanation: "Adjectives must agree in gender and number: 'casas' is feminine plural.",
      category: "Gender Agreement",
    },
    {
      id: "q6",
      question: "Where does the accent go? 'The word for telephone is...'",
      options: ["teléfono", "telefono", "telefonó", "telefóno"],
      correctIndex: 0,
      explanation: "Esdrújula words (stress on third-to-last syllable) always have a written accent.",
      category: "Accent Marks",
    },
    {
      id: "q7",
      question: "Which is more formal? 'Can you help me?'",
      options: ["¿Podría usted ayudarme?", "¿Me ayudas?", "¿Me echas una mano?", "Ayúdame"],
      correctIndex: 0,
      explanation: "Using 'usted' + conditional tense is the most formal register.",
      category: "Formality Register",
    },
    {
      id: "q8",
      question: "Correct word order: 'I always eat breakfast early.'",
      options: ["Siempre desayuno temprano.", "Desayuno siempre temprano.", "Temprano siempre desayuno.", "Desayuno temprano siempre."],
      correctIndex: 0,
      explanation: "Frequency adverbs typically precede the verb in Spanish.",
      category: "Word Order",
    },
    {
      id: "q9",
      question: "Which is correct? 'Ella _____ estudiando cuando llegué.'",
      options: ["estaba", "estuvo", "está", "estará"],
      correctIndex: 0,
      explanation: "Use imperfect 'estaba' for ongoing past actions interrupted by another event.",
      category: "Verb Conjugation",
    },
    {
      id: "q10",
      question: "Choose correctly: '_____ problema es difícil.'",
      options: ["El", "La", "Un", "Una"],
      correctIndex: 0,
      explanation: "'Problema' is masculine despite ending in -a (Greek origin).",
      category: "Articles",
    },
    {
      id: "q11",
      question: "Which is correct? 'Necesito _____ para mi hermana.'",
      options: ["algo", "algún", "alguna", "algunos"],
      correctIndex: 0,
      explanation: "'Algo' (something) is used as an indefinite pronoun without a noun following.",
      category: "Pronouns",
    },
    {
      id: "q12",
      question: "Select the correct form: 'Si yo _____ rico, viajaría.'",
      options: ["fuera", "soy", "fui", "seré"],
      correctIndex: 0,
      explanation: "Use subjunctive 'fuera' in hypothetical si-clauses (contrary to fact).",
      category: "Verb Conjugation",
    },
    {
      id: "q13",
      question: "Which preposition? 'Estoy pensando _____ ti.'",
      options: ["en", "a", "de", "por"],
      correctIndex: 0,
      explanation: "'Pensar en' means 'to think about' — the preposition is fixed.",
      category: "Prepositions",
    },
    {
      id: "q14",
      question: "Correct gender: 'La _____ es muy interesante.'",
      options: ["película", "pelicúla", "pelicula", "películo"],
      correctIndex: 0,
      explanation: "'Película' is feminine and has an accent on the antepenultimate syllable.",
      category: "Gender Agreement",
    },
    {
      id: "q15",
      question: "Which means 'I like it'?",
      options: ["Me gusta", "Yo gusto", "Me gusto", "Yo gusta"],
      correctIndex: 0,
      explanation: "'Gustar' uses indirect object pronouns; the subject is what is liked.",
      category: "Word Order",
    },
  ];

  // Shuffle and pick
  const shuffled = [...questionBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function GrammarChallengeScreen() {
  const { showStreakToast } = useUsage();
  const router = useRouter();
  const params = useLocalSearchParams<{ friendId?: string; friendName?: string; mode?: string }>();

  const friendName = params.friendName || "Friend";
  const friendId = params.friendId || "unknown";
  const isViewingResults = params.mode === "results";

  const [phase, setPhase] = useState<"intro" | "quiz" | "results" | "history">(
    isViewingResults ? "history" : "intro"
  );
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [challengeHistory, setChallengeHistory] = useState<ChallengeResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(15); // 15 seconds per question
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    loadChallengeHistory();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, currentIndex]);

  const handleTimeUp = () => {
    if (selectedAnswer === null) {
      setSelectedAnswer(-1); // Mark as unanswered
      setShowExplanation(true);
      setTimerActive(false);
    }
  };

  const loadChallengeHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHALLENGE_HISTORY_KEY);
      if (stored) setChallengeHistory(JSON.parse(stored));
    } catch {}
  };

  const saveChallengeResult = async (result: ChallengeResult) => {
    try {
      const stored = await AsyncStorage.getItem(CHALLENGE_HISTORY_KEY);
      const history: ChallengeResult[] = stored ? JSON.parse(stored) : [];
      history.unshift(result);
      if (history.length > 50) history.splice(50);
      await AsyncStorage.setItem(CHALLENGE_HISTORY_KEY, JSON.stringify(history));
      setChallengeHistory(history);
    } catch {}
  };

  const startChallenge = () => {
    const qs = generateChallengeQuestions(10);
    setQuestions(qs);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimeLeft(15);
    setTimerActive(true);
    setPhase("quiz");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    setTimerActive(false);

    const correct = index === questions[currentIndex].correctIndex;
    if (correct) {
      setScore((prev) => prev + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(15);
      setTimerActive(true);
    } else {
      // Quiz complete
      finishChallenge();
    }
  };

  const finishChallenge = async () => {
    setPhase("results");
    markPracticeAndToast(showStreakToast);
    setTimerActive(false);

    // Simulate friend's score (in production, this would come from server)
    const friendScore = Math.floor(Math.random() * 11); // 0-10
    const status: ChallengeResult["status"] =
      score > friendScore ? "won" : score < friendScore ? "lost" : "tied";

    const result: ChallengeResult = {
      id: `challenge-${Date.now()}`,
      date: new Date().toISOString(),
      friendName,
      friendId,
      myScore: score,
      friendScore,
      totalQuestions: questions.length,
      status,
      questions,
    };

    await saveChallengeResult(result);

    if (Platform.OS !== "web") {
      if (status === "won") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (status === "lost") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const shareChallenge = async () => {
    const percentage = Math.round((score / questions.length) * 100);
    try {
      await Share.share({
        message: `I scored ${score}/${questions.length} (${percentage}%) on a grammar challenge on ConnectWorld AI! Think you can beat me? 🏆📚`,
      });
    } catch {}
  };

  const rematchFriend = () => {
    startChallenge();
  };

  // ─── Render: Intro ──────────────────────────────────────────────────────────

  const renderIntro = () => (
    <View style={styles.introContainer}>
      <View style={styles.introCard}>
        <Text style={styles.introEmoji}>⚔️</Text>
        <Text style={styles.introTitle}>Grammar Challenge</Text>
        <Text style={styles.introSubtitle}>
          Challenge {friendName} to a grammar quiz!
        </Text>
        <Text style={styles.introDesc}>
          10 questions • 15 seconds each{"\n"}
          Test verb conjugation, articles, prepositions, and more.
        </Text>

        <View style={styles.vsCard}>
          <View style={styles.vsPlayer}>
            <Text style={styles.vsEmoji}>🧑‍🎓</Text>
            <Text style={styles.vsName}>You</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.vsPlayer}>
            <Text style={styles.vsEmoji}>🎯</Text>
            <Text style={styles.vsName}>{friendName}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={startChallenge} activeOpacity={0.8}>
          <Ionicons name="flash" size={20} color="#FFFFFF" />
          <Text style={styles.startBtnText}>Start Challenge</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => setPhase("history")}
          activeOpacity={0.7}
        >
          <Text style={styles.historyBtnText}>View Challenge History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Render: Quiz ───────────────────────────────────────────────────────────

  const renderQuiz = () => {
    const q = questions[currentIndex];
    if (!q) return null;

    const progress = (currentIndex + 1) / questions.length;
    const timerColor = timeLeft <= 5 ? "#EF4444" : timeLeft <= 10 ? "#F59E0B" : "#22C55E";

    return (
      <View style={styles.quizContainer}>
        {/* Progress Bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentIndex + 1}/{questions.length}</Text>
        </View>

        {/* Timer */}
        <View style={styles.timerRow}>
          <Ionicons name="timer-outline" size={18} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
          <Text style={styles.scoreText}>Score: {score}/{currentIndex + (selectedAnswer !== null ? 1 : 0)}</Text>
        </View>

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{q.category}</Text>
        </View>

        {/* Question */}
        <Text style={styles.questionText}>{q.question}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {q.options.map((option, idx) => {
            let optionStyle = styles.option;
            let textStyle = styles.optionText;

            if (selectedAnswer !== null) {
              if (idx === q.correctIndex) {
                optionStyle = { ...styles.option, ...styles.optionCorrect };
                textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
              } else if (idx === selectedAnswer && idx !== q.correctIndex) {
                optionStyle = { ...styles.option, ...styles.optionWrong };
                textStyle = { ...styles.optionText, ...styles.optionTextWrong };
              }
            }

            return (
              <TouchableOpacity
                key={idx}
                style={optionStyle}
                onPress={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
                activeOpacity={0.7}
              >
                <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
                <Text style={textStyle}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation */}
        {showExplanation && (
          <View style={styles.explanationCard}>
            <Ionicons
              name={selectedAnswer === q.correctIndex ? "checkmark-circle" : "close-circle"}
              size={20}
              color={selectedAnswer === q.correctIndex ? "#22C55E" : "#EF4444"}
            />
            <Text style={styles.explanationText}>{q.explanation}</Text>
          </View>
        )}

        {/* Next Button */}
        {selectedAnswer !== null && (
          <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>
              {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ─── Render: Results ────────────────────────────────────────────────────────

  const renderResults = () => {
    const latest = challengeHistory[0];
    if (!latest) return null;

    const percentage = Math.round((latest.myScore / latest.totalQuestions) * 100);
    const statusEmoji = latest.status === "won" ? "🏆" : latest.status === "lost" ? "😤" : "🤝";
    const statusText = latest.status === "won" ? "You Won!" : latest.status === "lost" ? "They Won!" : "It's a Tie!";
    const statusColor = latest.status === "won" ? "#22C55E" : latest.status === "lost" ? "#EF4444" : "#F59E0B";

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsEmoji}>{statusEmoji}</Text>
        <Text style={[styles.resultsTitle, { color: statusColor }]}>{statusText}</Text>

        <View style={styles.scoreComparison}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardEmoji}>🧑‍🎓</Text>
            <Text style={styles.scoreCardName}>You</Text>
            <Text style={[styles.scoreCardValue, { color: "#0a7ea4" }]}>
              {latest.myScore}/{latest.totalQuestions}
            </Text>
            <Text style={styles.scoreCardPercent}>{percentage}%</Text>
          </View>

          <Text style={styles.vsResultText}>VS</Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardEmoji}>🎯</Text>
            <Text style={styles.scoreCardName}>{latest.friendName}</Text>
            <Text style={[styles.scoreCardValue, { color: "#EC4899" }]}>
              {latest.friendScore ?? "?"}/{latest.totalQuestions}
            </Text>
            <Text style={styles.scoreCardPercent}>
              {latest.friendScore !== null ? `${Math.round((latest.friendScore / latest.totalQuestions) * 100)}%` : "Pending"}
            </Text>
          </View>
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.rematchBtn} onPress={rematchFriend} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.rematchBtnText}>Rematch</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={shareChallenge} activeOpacity={0.8}>
            <Ionicons name="share-social" size={18} color="#0a7ea4" />
            <Text style={styles.shareBtnText}>Share Score</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backToLeaderboardBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backToLeaderboardText}>Back to Leaderboard</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Render: History ────────────────────────────────────────────────────────

  const renderHistoryItem = useCallback(({ item }: { item: ChallengeResult }) => {
    const statusEmoji = item.status === "won" ? "🏆" : item.status === "lost" ? "😤" : item.status === "tied" ? "🤝" : "⏳";
    const statusColor = item.status === "won" ? "#22C55E" : item.status === "lost" ? "#EF4444" : "#F59E0B";
    const dateStr = new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

    return (
      <View style={styles.historyItem}>
        <Text style={styles.historyEmoji}>{statusEmoji}</Text>
        <View style={styles.historyInfo}>
          <Text style={styles.historyName}>vs {item.friendName}</Text>
          <Text style={styles.historyDate}>{dateStr}</Text>
        </View>
        <View style={styles.historyScores}>
          <Text style={[styles.historyScore, { color: statusColor }]}>
            {item.myScore} - {item.friendScore ?? "?"}
          </Text>
          <Text style={styles.historyTotal}>/ {item.totalQuestions}</Text>
        </View>
      </View>
    );
  }, []);

  const renderHistory = () => (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Challenge History</Text>
      {challengeHistory.length > 0 ? (
        <FlatList
          data={challengeHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>No challenges yet</Text>
          <Text style={styles.emptySubtext}>Challenge a friend from the leaderboard!</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => phase === "history" && isViewingResults ? router.back() : setPhase("intro")}
        activeOpacity={0.7}
      >
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Main Render ────────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#ECEDEE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚔️ Grammar Challenge</Text>
        <View style={{ width: 40 }} />
      </View>

      {phase === "intro" && renderIntro()}
      {phase === "quiz" && renderQuiz()}
      {phase === "results" && renderResults()}
      {phase === "history" && renderHistory()}
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const Colors = {
  bg: "#0D1117",
  surface: "#161B22",
  surfaceLight: "#1C2128",
  border: "#30363D",
  text: "#ECEDEE",
  textMuted: "#8B949E",
  primary: "#0a7ea4",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  accent: "#EC4899",
};

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  headerBack: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },

  // Intro
  introContainer: { flex: 1, padding: 20, justifyContent: "center" },
  introCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 28, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  introEmoji: { fontSize: 48, marginBottom: 12 },
  introTitle: { fontSize: 24, fontWeight: "800", color: Colors.text, marginBottom: 6 },
  introSubtitle: { fontSize: 16, color: Colors.textMuted, marginBottom: 16, textAlign: "center" },
  introDesc: { fontSize: 14, color: Colors.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  vsCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 28, width: "100%" },
  vsPlayer: { alignItems: "center", gap: 6 },
  vsEmoji: { fontSize: 36 },
  vsName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  vsText: { fontSize: 20, fontWeight: "900", color: Colors.accent },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginBottom: 12 },
  startBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  historyBtn: { paddingVertical: 10 },
  historyBtnText: { fontSize: 14, color: Colors.textMuted, textDecorationLine: "underline" },

  // Quiz
  quizContainer: { flex: 1, padding: 20 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: Colors.surfaceLight, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 3 },
  progressText: { fontSize: 13, color: Colors.textMuted, fontWeight: "600" },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  timerText: { fontSize: 16, fontWeight: "700" },
  scoreText: { marginLeft: "auto", fontSize: 14, color: Colors.textMuted, fontWeight: "600" },
  categoryBadge: { alignSelf: "flex-start", backgroundColor: Colors.surfaceLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 16 },
  categoryText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  questionText: { fontSize: 18, fontWeight: "700", color: Colors.text, lineHeight: 26, marginBottom: 20 },
  optionsContainer: { gap: 10, marginBottom: 16 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  optionCorrect: { borderColor: Colors.success, backgroundColor: "rgba(34, 197, 94, 0.1)" },
  optionWrong: { borderColor: Colors.error, backgroundColor: "rgba(239, 68, 68, 0.1)" },
  optionLetter: { fontSize: 14, fontWeight: "700", color: Colors.textMuted, width: 22 },
  optionText: { fontSize: 15, color: Colors.text, flex: 1 },
  optionTextCorrect: { color: Colors.success, fontWeight: "600" },
  optionTextWrong: { color: Colors.error },
  explanationCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: Colors.surfaceLight, borderRadius: 10, padding: 12, marginBottom: 16 },
  explanationText: { fontSize: 13, color: Colors.textMuted, flex: 1, lineHeight: 18 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12 },
  nextBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  // Results
  resultsContainer: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  resultsEmoji: { fontSize: 56, marginBottom: 12 },
  resultsTitle: { fontSize: 28, fontWeight: "900", marginBottom: 24 },
  scoreComparison: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 32 },
  scoreCard: { alignItems: "center", backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border, width: 130 },
  scoreCardEmoji: { fontSize: 28, marginBottom: 6 },
  scoreCardName: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  scoreCardValue: { fontSize: 24, fontWeight: "800" },
  scoreCardPercent: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  vsResultText: { fontSize: 18, fontWeight: "900", color: Colors.accent },
  resultActions: { flexDirection: "row", gap: 12, marginBottom: 20 },
  rematchBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  rematchBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  shareBtnText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  backToLeaderboardBtn: { paddingVertical: 10 },
  backToLeaderboardText: { fontSize: 14, color: Colors.textMuted, textDecorationLine: "underline" },

  // History
  historyContainer: { flex: 1, padding: 20 },
  historyTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 16 },
  historyItem: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  historyEmoji: { fontSize: 24 },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  historyDate: { fontSize: 12, color: Colors.textMuted },
  historyScores: { alignItems: "flex-end" },
  historyScore: { fontSize: 16, fontWeight: "700" },
  historyTotal: { fontSize: 11, color: Colors.textMuted },
  emptyHistory: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: "600", color: Colors.text },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  backBtn: { paddingVertical: 12, alignItems: "center" },
  backBtnText: { fontSize: 14, color: Colors.textMuted },
});
