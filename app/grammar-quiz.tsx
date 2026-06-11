import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { logGrammarMistake } from "@/lib/grammar-mistakes";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";


const NOTEBOOK_KEY = "@grammar_notebook_entries";
const QUIZ_HISTORY_KEY = "@grammar_quiz_history";

interface GrammarRow {
  native: string;
  target: string;
  pronunciation: string;
  note?: string;
}

interface ConjugationEntry {
  pronoun: string;
  present: string;
  past: string;
  future: string;
  presentPron: string;
  pastPron: string;
  futurePron: string;
}

interface ConjugationTable {
  verb: string;
  verbMeaning: string;
  entries: ConjugationEntry[];
}

interface NotebookEntry {
  id: string;
  grammarTopic: string;
  nativeLanguage: string;
  targetLanguage: string;
  grammarTable: GrammarRow[];
  conjugationTable?: ConjugationTable;
  keyRule: string;
  savedAt: number;
}

interface QuizQuestion {
  type: "fill_blank_grammar" | "fill_blank_conjugation";
  prompt: string;
  hint: string;
  correctAnswer: string;
  pronunciation: string;
  source: string; // topic name
}

interface QuizResult {
  date: number;
  score: number;
  total: number;
  topics: string[];
}

function generateQuestions(entries: NotebookEntry[], count: number = 10): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const entry of entries) {
    // Generate from grammar table
    for (const row of entry.grammarTable) {
      if (row.target && row.native) {
        questions.push({
          type: "fill_blank_grammar",
          prompt: `How do you say "${row.native}" in ${entry.targetLanguage}?`,
          hint: row.pronunciation.slice(0, 3) + "...",
          correctAnswer: row.target.toLowerCase().trim(),
          pronunciation: row.pronunciation,
          source: entry.grammarTopic,
        });
      }
    }

    // Generate from conjugation table
    if (entry.conjugationTable) {
      const tenses = ["present", "past", "future"] as const;
      const tenseLabels = { present: "present", past: "past", future: "future" };
      for (const conj of entry.conjugationTable.entries) {
        for (const tense of tenses) {
          questions.push({
            type: "fill_blank_conjugation",
            prompt: `"${entry.conjugationTable.verb}" (${entry.conjugationTable.verbMeaning}) — ${tenseLabels[tense]} tense for "${conj.pronoun}"?`,
            hint: conj[`${tense}Pron`].slice(0, 4) + "...",
            correctAnswer: conj[tense].toLowerCase().trim(),
            pronunciation: conj[`${tense}Pron`],
            source: entry.grammarTopic,
          });
        }
      }
    }
  }

  // Shuffle and limit
  const shuffled = questions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function GrammarQuizScreen() {
  const { showStreakToast } = useUsage();
  const params = useLocalSearchParams<{ entryId?: string }>();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAndGenerate();
  }, []);

  const loadAndGenerate = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTEBOOK_KEY);
      if (stored) {
        let parsed = JSON.parse(stored) as NotebookEntry[];
        // If specific entry requested, filter to it
        if (params.entryId) {
          parsed = parsed.filter((e) => e.id === params.entryId);
        }
        setEntries(parsed);
        const qs = generateQuestions(parsed, 10);
        setQuestions(qs);
      }
    } catch (e) {
      console.error("Failed to load entries for quiz:", e);
    }
    setLoading(false);
  };

  const currentQuestion = questions[currentIndex];

  const checkAnswer = () => {
    if (!currentQuestion || showResult) return;
    const correct = userAnswer.toLowerCase().trim() === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setScore((s) => s + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Log mistake to grammar mistake journal + SRS
      const entry = entries.find((e) => e.grammarTopic === currentQuestion.source);
      logGrammarMistake({
        source: "quiz",
        category: currentQuestion.type === "fill_blank_conjugation" ? "verb_conjugation" : "grammar_rule",
        language: entry?.targetLanguage || "Unknown",
        question: currentQuestion.prompt,
        userAnswer: userAnswer.trim(),
        correctAnswer: currentQuestion.correctAnswer,
        rule: entry?.keyRule || "Review this grammar topic",
        grammarTopic: currentQuestion.source,
      });
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setQuizComplete(true);
      markPracticeAndToast(showStreakToast);
      saveQuizResult();
      return;
    }
    setCurrentIndex((i) => i + 1);
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
  };

  const saveQuizResult = async () => {
    try {
      const result: QuizResult = {
        date: Date.now(),
        score: score + (isCorrect ? 0 : 0), // score already updated
        total: questions.length,
        topics: [...new Set(questions.map((q) => q.source))],
      };
      const stored = await AsyncStorage.getItem(QUIZ_HISTORY_KEY);
      const history: QuizResult[] = stored ? JSON.parse(stored) : [];
      history.push(result);
      await AsyncStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save quiz result:", e);
    }
  };

  const restartQuiz = () => {
    const qs = generateQuestions(entries, 10);
    setQuestions(qs);
    setCurrentIndex(0);
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setScore(0);
    setQuizComplete(false);
  };

  const scorePercentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  if (loading) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (questions.length === 0) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Grammar Quiz</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No Quiz Available</Text>
          <Text style={styles.emptyText}>
            Save grammar tables from lessons first, then come back to quiz yourself!
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (quizComplete) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <Text style={styles.resultsEmoji}>{scorePercentage >= 80 ? "🏆" : scorePercentage >= 60 ? "👍" : "📚"}</Text>
          <Text style={styles.resultsTitle}>Quiz Complete!</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{score}/{questions.length}</Text>
            <Text style={styles.scorePercent}>{scorePercentage}%</Text>
          </View>
          <Text style={styles.resultsFeedback}>
            {scorePercentage >= 80
              ? "Excellent! You've mastered these grammar patterns."
              : scorePercentage >= 60
              ? "Good progress! Keep reviewing to strengthen your recall."
              : "Keep practicing! Review the grammar tables and try again."}
          </Text>
          <View style={styles.resultsTopics}>
            <Text style={styles.topicsLabel}>Topics covered:</Text>
            {[...new Set(questions.map((q) => q.source))].map((topic, i) => (
              <Text key={i} style={styles.topicChip}>• {topic}</Text>
            ))}
          </View>
          <View style={styles.resultsActions}>
            <Pressable style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]} onPress={restartQuiz}>
              <Text style={styles.retryBtnText}>🔄 Try Again</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.8 }]} onPress={() => router.back()}>
              <Text style={styles.doneBtnText}>✓ Done</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Grammar Quiz</Text>
        <Text style={styles.progressText}>{currentIndex + 1}/{questions.length}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.quizContent}>
        {/* Source Badge */}
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText}>📋 {currentQuestion.source}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionType}>
            {currentQuestion.type === "fill_blank_conjugation" ? "🔤 Conjugation" : "📝 Translation"}
          </Text>
          <Text style={styles.questionText}>{currentQuestion.prompt}</Text>
          <Text style={styles.hintText}>Hint: {currentQuestion.hint}</Text>
        </View>

        {/* Answer Input */}
        <View style={styles.answerSection}>
          <TextInput
            style={[
              styles.answerInput,
              showResult && isCorrect && styles.answerCorrect,
              showResult && !isCorrect && styles.answerWrong,
            ]}
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder="Type your answer..."
            placeholderTextColor="#687076"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!showResult}
            returnKeyType="done"
            onSubmitEditing={checkAnswer}
          />
        </View>

        {/* Result Feedback */}
        {showResult && (
          <View style={[styles.feedbackCard, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={styles.feedbackEmoji}>{isCorrect ? "✅" : "❌"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedbackTitle}>{isCorrect ? "Correct!" : "Not quite"}</Text>
              {!isCorrect && (
                <Text style={styles.feedbackAnswer}>
                  Answer: <Text style={{ fontWeight: "700", color: "#4ADE80" }}>{currentQuestion.correctAnswer}</Text>
                </Text>
              )}
              <Text style={styles.feedbackPron}>🔊 {currentQuestion.pronunciation}</Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        {!showResult ? (
          <Pressable
            style={({ pressed }) => [styles.checkBtn, pressed && { opacity: 0.8 }, !userAnswer.trim() && styles.checkBtnDisabled]}
            onPress={checkAnswer}
            disabled={!userAnswer.trim()}
          >
            <Text style={styles.checkBtnText}>Check Answer</Text>
          </Pressable>
        ) : (
          <Pressable style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]} onPress={nextQuestion}>
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= questions.length ? "See Results" : "Next Question →"}
            </Text>
          </Pressable>
        )}

        {/* Score Counter */}
        <View style={styles.scoreCounter}>
          <Text style={styles.scoreCounterText}>Score: {score}/{currentIndex + (showResult ? 1 : 0)}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// Export for use in streak tracking
export async function getQuizHistory(): Promise<QuizResult[]> {
  try {
    const stored = await AsyncStorage.getItem(QUIZ_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, color: "#9BA1A6" },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: "#1e2d3d" },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backText: { fontSize: 16, color: "#00AAFF", fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#ECEDEE", flex: 1 },
  progressText: { fontSize: 14, color: "#9BA1A6", fontWeight: "600" },

  progressBar: { height: 4, backgroundColor: "#1e2d3d", marginHorizontal: 16, marginTop: 8, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: "#00AAFF", borderRadius: 2 },

  quizContent: { padding: 20, paddingBottom: 100 },

  sourceBadge: { alignSelf: "flex-start", backgroundColor: "rgba(0, 170, 255, 0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  sourceBadgeText: { fontSize: 12, color: "#00AAFF", fontWeight: "600" },

  questionCard: { backgroundColor: "#1a2234", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#334155", marginBottom: 20 },
  questionType: { fontSize: 12, color: "#9BA1A6", fontWeight: "600", marginBottom: 8, textTransform: "uppercase" },
  questionText: { fontSize: 18, fontWeight: "700", color: "#ECEDEE", lineHeight: 26, marginBottom: 10 },
  hintText: { fontSize: 13, color: "#687076", fontStyle: "italic" },

  answerSection: { marginBottom: 16 },
  answerInput: { backgroundColor: "#0d1b2a", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, color: "#ECEDEE", borderWidth: 2, borderColor: "#334155", fontWeight: "600" },
  answerCorrect: { borderColor: "#22C55E", backgroundColor: "rgba(34, 197, 94, 0.05)" },
  answerWrong: { borderColor: "#EF4444", backgroundColor: "rgba(239, 68, 68, 0.05)" },

  feedbackCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 12, padding: 16, marginBottom: 16 },
  feedbackCorrect: { backgroundColor: "rgba(34, 197, 94, 0.08)", borderWidth: 1, borderColor: "rgba(34, 197, 94, 0.2)" },
  feedbackWrong: { backgroundColor: "rgba(239, 68, 68, 0.08)", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.2)" },
  feedbackEmoji: { fontSize: 24 },
  feedbackTitle: { fontSize: 16, fontWeight: "700", color: "#ECEDEE", marginBottom: 4 },
  feedbackAnswer: { fontSize: 14, color: "#ECEDEE", marginBottom: 4 },
  feedbackPron: { fontSize: 12, color: "#9BA1A6", fontStyle: "italic" },

  checkBtn: { backgroundColor: "#00AAFF", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 16 },
  checkBtnDisabled: { opacity: 0.4 },
  checkBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  nextBtn: { backgroundColor: "#22C55E", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 16 },
  nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  scoreCounter: { alignItems: "center", marginTop: 8 },
  scoreCounterText: { fontSize: 14, color: "#9BA1A6", fontWeight: "600" },

  // Empty State
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#ECEDEE", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#9BA1A6", textAlign: "center", lineHeight: 20 },

  // Results
  resultsContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  resultsEmoji: { fontSize: 60, marginBottom: 16 },
  resultsTitle: { fontSize: 24, fontWeight: "800", color: "#ECEDEE", marginBottom: 20 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#1a2234", borderWidth: 3, borderColor: "#00AAFF", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  scoreNumber: { fontSize: 28, fontWeight: "800", color: "#ECEDEE" },
  scorePercent: { fontSize: 14, color: "#00AAFF", fontWeight: "600" },
  resultsFeedback: { fontSize: 15, color: "#9BA1A6", textAlign: "center", lineHeight: 22, marginBottom: 20, paddingHorizontal: 20 },
  resultsTopics: { alignSelf: "stretch", marginBottom: 24 },
  topicsLabel: { fontSize: 13, color: "#687076", fontWeight: "600", marginBottom: 6 },
  topicChip: { fontSize: 13, color: "#ECEDEE", marginBottom: 4 },
  resultsActions: { flexDirection: "row", gap: 12 },
  retryBtn: { flex: 1, backgroundColor: "#1a2234", borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  retryBtnText: { fontSize: 15, fontWeight: "700", color: "#ECEDEE" },
  doneBtn: { flex: 1, backgroundColor: "#00AAFF", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  doneBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
