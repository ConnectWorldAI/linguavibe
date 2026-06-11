import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLessonContent, type LessonContent, type QuizQuestion } from "@/lib/lesson-content";
import { addWrongAnswersToQueue } from "@/lib/srs";
import { ConfettiAnimation } from "@/components/confetti-animation";
import { logLearningSession, type CEFRLevel } from "@/lib/cefr-hour-tracker";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";

const Colors = {
  bg: "#0A0A0F",
  card: "#1A1A2E",
  cardLight: "#252540",
  primary: "#6C63FF",
  primaryLight: "#8B83FF",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  border: "#2A2A4A",
  gold: "#FFD700",
  vocab: "#3B82F6",
  grammar: "#8B5CF6",
  reading: "#10B981",
  writing: "#F59E0B",
  speaking: "#EC4899",
  listening: "#06B6D4",
};

// XP awarded per CEFR level (base amount, multiplied by score percentage)
const XP_BY_LEVEL: Record<string, number> = {
  A1: 10,
  A2: 15,
  B1: 20,
  B2: 25,
  C1: 30,
  C2: 35,
};

type Phase = "content" | "quiz" | "results";

export default function LessonExerciseScreen() {
  const { showStreakToast } = useUsage();
  const params = useLocalSearchParams<{ lessonId: string; lessonTitle: string }>();
  const lessonId = params.lessonId || "";
  const lesson = getLessonContent(lessonId);

  const [phase, setPhase] = useState<Phase>("content");
  const lessonStartTime = useRef(Date.now());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [writingText, setWritingText] = useState("");
  const [currentContentSection, setCurrentContentSection] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Lesson Coming Soon</Text>
          <Text style={styles.emptySubtitle}>
            This lesson content is being prepared. Check back soon!
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typeColor = (Colors as Record<string, string>)[lesson.type] || Colors.primary;

  // Determine CEFR level from lessonId
  // Handles both old format ("a1_u1_l1") and new multi-language format ("esdo_a1_u1_l1")
  const cefrMatch = lessonId.match(/_(a1|a2|b1|b2|c1|c2)_/i) || lessonId.match(/^(a1|a2|b1|b2|c1|c2)_/i);
  const cefrLevel = cefrMatch ? cefrMatch[1].toUpperCase() : lessonId.substring(0, 2).toUpperCase();
  const baseXp = XP_BY_LEVEL[cefrLevel] || 10;

  const handleQuizSubmit = useCallback(async () => {
    setQuizSubmitted(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const correctCount = lesson.quiz.filter(q => selectedAnswers[q.id] === q.correct).length;
    const totalQ = lesson.quiz.length;
    const scorePercent = correctCount / totalQ;

    // Calculate XP earned (base × score percentage, minimum 1 XP if any correct)
    const earned = Math.round(baseXp * scorePercent);
    setXpEarned(earned);

    // Save completion
    const completedKey = `@lesson_completed_${lessonId}`;
    await AsyncStorage.setItem(completedKey, JSON.stringify({
      completedAt: new Date().toISOString(),
      score: correctCount,
      total: totalQ,
      xpEarned: earned,
    }));

    // Award XP — increment @total_xp
    if (earned > 0) {
      try {
        const currentXp = parseInt((await AsyncStorage.getItem("@total_xp")) || "0", 10);
        await AsyncStorage.setItem("@total_xp", String(currentXp + earned));
      } catch (e) {
        // Silently handle
      }
    }

    // Update lesson-path progress (add to completed set)
    try {
      const progressRaw = await AsyncStorage.getItem("@lesson_progress");
      const progress: string[] = progressRaw ? JSON.parse(progressRaw) : [];
      if (!progress.includes(lessonId)) {
        progress.push(lessonId);
        await AsyncStorage.setItem("@lesson_progress", JSON.stringify(progress));
      }
    } catch (e) {
      // Silently handle
    }

    // Add wrong answers to SRS review queue
    const wrongQuestions = lesson.quiz
      .filter(q => selectedAnswers[q.id] !== q.correct)
      .map(q => ({
        id: q.id,
        question: q.question,
        correctAnswer: q.options[q.correct],
      }));

    if (wrongQuestions.length > 0) {
      await addWrongAnswersToQueue(wrongQuestions, lessonId);
    }

    // Log CEFR hours
    try {
      const durationMinutes = Math.max(1, Math.round((Date.now() - lessonStartTime.current) / 60000));
      // Infer language from lessonId prefix (e.g., "esdo_a1_u1_l1" → "Spanish")
      const langPrefix = lessonId.split("_")[0];
      const langMap: Record<string, string> = { esdo: "Spanish", enus: "English", frfr: "French", ptbr: "Portuguese", dede: "German", itit: "Italian", jajp: "Japanese", kokr: "Korean", zhcn: "Chinese" };
      const inferredLang = langMap[langPrefix] || "Spanish";
      await logLearningSession({
        activityType: "vocabulary",
        durationMinutes,
        language: inferredLang,
        level: (cefrLevel || "A1") as CEFRLevel,
        topic: params.lessonTitle || "Lesson",
        accuracy: scorePercent,
        xpEarned: earned,
      });
    } catch (e) {
      // Silently handle
    }

    // Mark today as practiced for streak tracking
    markPracticeAndToast(showStreakToast);
    // Show confetti for good scores
    if (scorePercent >= 0.7) {
      setShowConfetti(true);
    }
  }, [selectedAnswers, lesson, lessonId, baseXp]);

  const score = lesson.quiz.filter(q => selectedAnswers[q.id] === q.correct).length;
  const totalQuestions = lesson.quiz.length;
  const allAnswered = Object.keys(selectedAnswers).length === totalQuestions;

  // ─── Content Renderers ────────────────────────────────────────────────────

  const renderVocab = () => {
    if (!lesson.vocab) return null;
    return (
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Key Vocabulary</Text>
        {lesson.vocab.map((item, i) => (
          <View key={i} style={styles.vocabCard}>
            <View style={styles.vocabMain}>
              <Text style={styles.vocabWord}>{item.word}</Text>
              <Text style={styles.vocabTranslation}>{item.translation}</Text>
              {item.pronunciation && (
                <Text style={styles.vocabPronunciation}>/{item.pronunciation}/</Text>
              )}
            </View>
            {item.example && (
              <View style={styles.vocabExample}>
                <Ionicons name="chatbubble-ellipses-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.vocabExampleText}>{item.example}</Text>
              </View>
            )}
            {item.gender && (
              <View style={[styles.genderBadge, { backgroundColor: item.gender === "feminine" ? "#EC489920" : "#3B82F620" }]}>
                <Text style={[styles.genderText, { color: item.gender === "feminine" ? "#EC4899" : "#3B82F6" }]}>
                  {item.gender}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderGrammar = () => {
    if (!lesson.grammar) return null;
    return (
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Grammar Rules</Text>
        {lesson.grammar.map((rule, i) => (
          <View key={i} style={styles.grammarCard}>
            <View style={styles.grammarHeader}>
              <Ionicons name="bulb-outline" size={16} color={Colors.grammar} />
              <Text style={styles.grammarRule}>{rule.rule}</Text>
            </View>
            <Text style={styles.grammarExplanation}>{rule.explanation}</Text>
            <View style={styles.grammarExampleBox}>
              <Text style={styles.grammarExample}>"{rule.example}"</Text>
              <Text style={styles.grammarTranslation}>{rule.translation}</Text>
            </View>
            {rule.tip && (
              <View style={styles.tipBox}>
                <Ionicons name="information-circle" size={14} color={Colors.warning} />
                <Text style={styles.tipText}>{rule.tip}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderReading = () => {
    if (!lesson.reading) return null;
    return (
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>{lesson.reading.title}</Text>
        <View style={styles.readingCard}>
          <Text style={styles.readingText}>{lesson.reading.text}</Text>
        </View>
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Comprehension Questions</Text>
        {lesson.reading.questions.map((q, qi) => (
          <View key={qi} style={styles.readingQuestion}>
            <Text style={styles.readingQuestionText}>{qi + 1}. {q.question}</Text>
            {q.options.map((opt, oi) => (
              <TouchableOpacity
                key={oi}
                style={[
                  styles.readingOption,
                  selectedAnswers[`r${qi}`] === oi && styles.readingOptionSelected,
                ]}
                onPress={() => {
                  setSelectedAnswers(prev => ({ ...prev, [`r${qi}`]: oi }));
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[
                  styles.readingOptionText,
                  selectedAnswers[`r${qi}`] === oi && { color: Colors.primary },
                ]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderWriting = () => {
    if (!lesson.writing) return null;
    const wordCount = writingText.trim().split(/\s+/).filter(Boolean).length;
    return (
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Writing Exercise</Text>
        <View style={styles.writingPromptCard}>
          <Ionicons name="pencil" size={18} color={Colors.writing} />
          <Text style={styles.writingPrompt}>{lesson.writing.prompt}</Text>
        </View>
        <Text style={styles.hintsTitle}>Hints:</Text>
        {lesson.writing.hints.map((hint, i) => (
          <View key={i} style={styles.hintRow}>
            <Text style={styles.hintBullet}>•</Text>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        ))}
        <TextInput
          style={styles.writingInput}
          multiline
          placeholder="Write your answer here..."
          placeholderTextColor={Colors.textMuted}
          value={writingText}
          onChangeText={setWritingText}
          textAlignVertical="top"
        />
        <View style={styles.wordCountRow}>
          <Text style={[
            styles.wordCountText,
            wordCount >= lesson.writing.wordCount.min && { color: Colors.success },
            wordCount > lesson.writing.wordCount.max && { color: Colors.error },
          ]}>
            {wordCount} / {lesson.writing.wordCount.min}-{lesson.writing.wordCount.max} words
          </Text>
        </View>
        {lesson.writing.exampleAnswer && (
          <View style={styles.exampleAnswerCard}>
            <Text style={styles.exampleAnswerTitle}>Example Answer:</Text>
            <Text style={styles.exampleAnswerText}>{lesson.writing.exampleAnswer}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSpeaking = () => {
    if (!lesson.speaking) return null;
    return (
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>Speaking Practice</Text>
        <View style={styles.scenarioCard}>
          <Ionicons name="mic" size={18} color={Colors.speaking} />
          <Text style={styles.scenarioText}>{lesson.speaking.scenario}</Text>
        </View>
        <Text style={styles.promptsTitle}>Practice these prompts:</Text>
        {lesson.speaking.prompts.map((prompt, i) => (
          <View key={i} style={styles.speakingPromptRow}>
            <View style={styles.promptNumber}>
              <Text style={styles.promptNumberText}>{i + 1}</Text>
            </View>
            <View style={styles.promptContent}>
              <Text style={styles.promptText}>{prompt}</Text>
              <Text style={styles.modelResponse}>{lesson.speaking?.modelResponses[i]}</Text>
            </View>
          </View>
        ))}
        <Text style={[styles.promptsTitle, { marginTop: 16 }]}>Tips:</Text>
        {lesson.speaking.tips.map((tip, i) => (
          <View key={i} style={styles.hintRow}>
            <Ionicons name="bulb-outline" size={12} color={Colors.warning} />
            <Text style={styles.hintText}>{tip}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderListening = () => {
    if (!lesson.listening) return null;
    return (
      <View style={styles.contentSection}>
        <Text style={styles.sectionTitle}>{lesson.listening.title}</Text>
        <View style={styles.transcriptCard}>
          <View style={styles.transcriptHeader}>
            <Ionicons name="headset" size={16} color={Colors.listening} />
            <Text style={styles.transcriptLabel}>Transcript</Text>
          </View>
          <Text style={styles.transcriptText}>{lesson.listening.transcript}</Text>
        </View>
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Questions</Text>
        {lesson.listening.questions.map((q, qi) => (
          <View key={qi} style={styles.readingQuestion}>
            <Text style={styles.readingQuestionText}>{qi + 1}. {q.question}</Text>
            {q.options.map((opt, oi) => (
              <TouchableOpacity
                key={oi}
                style={[
                  styles.readingOption,
                  selectedAnswers[`l${qi}`] === oi && styles.readingOptionSelected,
                ]}
                onPress={() => {
                  setSelectedAnswers(prev => ({ ...prev, [`l${qi}`]: oi }));
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[
                  styles.readingOptionText,
                  selectedAnswers[`l${qi}`] === oi && { color: Colors.primary },
                ]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  // ─── Quiz Renderer ────────────────────────────────────────────────────────

  const renderQuiz = () => (
    <View style={styles.contentSection}>
      <Text style={styles.sectionTitle}>Quiz</Text>
      <Text style={styles.quizSubtitle}>Test what you've learned!</Text>
      {lesson.quiz.map((q, qi) => (
        <View key={q.id} style={styles.quizQuestion}>
          <Text style={styles.questionText}>{qi + 1}. {q.question}</Text>
          {q.options.map((opt, oi) => (
            <TouchableOpacity
              key={oi}
              style={[
                styles.optionBtn,
                selectedAnswers[q.id] === oi && !quizSubmitted && styles.optionSelected,
                quizSubmitted && oi === q.correct && styles.optionCorrect,
                quizSubmitted && selectedAnswers[q.id] === oi && oi !== q.correct && styles.optionWrong,
              ]}
              onPress={() => {
                if (!quizSubmitted) {
                  setSelectedAnswers(prev => ({ ...prev, [q.id]: oi }));
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              disabled={quizSubmitted}
            >
              <Text style={[
                styles.optionText,
                selectedAnswers[q.id] === oi && !quizSubmitted && { color: Colors.primary },
                quizSubmitted && oi === q.correct && { color: Colors.success },
                quizSubmitted && selectedAnswers[q.id] === oi && oi !== q.correct && { color: Colors.error },
              ]}>
                {opt}
              </Text>
              {quizSubmitted && oi === q.correct && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              )}
              {quizSubmitted && selectedAnswers[q.id] === oi && oi !== q.correct && (
                <Ionicons name="close-circle" size={18} color={Colors.error} />
              )}
            </TouchableOpacity>
          ))}
          {quizSubmitted && q.explanation && (
            <View style={styles.explanationBox}>
              <Ionicons name="information-circle" size={14} color={Colors.primaryLight} />
              <Text style={styles.explanationText}>{q.explanation}</Text>
            </View>
          )}
        </View>
      ))}

      {!quizSubmitted ? (
        <TouchableOpacity
          style={[styles.submitBtn, !allAnswered && styles.submitBtnDisabled]}
          onPress={handleQuizSubmit}
          disabled={!allAnswered}
        >
          <Text style={styles.submitBtnText}>Submit Answers</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsEmoji}>{score === totalQuestions ? "🎉" : score >= totalQuestions * 0.7 ? "👍" : "📚"}</Text>
          <Text style={styles.resultsScore}>{score}/{totalQuestions} Correct</Text>
          <Text style={styles.resultsMessage}>
            {score === totalQuestions ? "Perfect score! Amazing work!" :
             score >= totalQuestions * 0.7 ? "Great job! Keep it up!" :
             "Good effort! Review the material and try again."}
          </Text>

          {/* XP Earned Badge */}
          {xpEarned > 0 && (
            <View style={styles.xpBadge}>
              <Ionicons name="star" size={18} color={Colors.gold} />
              <Text style={styles.xpBadgeText}>+{xpEarned} XP earned!</Text>
            </View>
          )}

          {/* SRS notification for wrong answers */}
          {score < totalQuestions && (
            <View style={styles.srsNotice}>
              <Ionicons name="refresh-circle" size={16} color={Colors.primaryLight} />
              <Text style={styles.srsNoticeText}>
                {totalQuestions - score} item{totalQuestions - score > 1 ? "s" : ""} added to your review queue
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ─── Cultural Note ────────────────────────────────────────────────────────

  const renderCulturalNote = () => {
    if (!lesson.culturalNote) return null;
    return (
      <View style={styles.culturalCard}>
        <View style={styles.culturalHeader}>
          <Text style={styles.culturalEmoji}>🌍</Text>
          <Text style={styles.culturalTitle}>Cultural Note</Text>
        </View>
        <Text style={styles.culturalText}>{lesson.culturalNote}</Text>
      </View>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Confetti overlay */}
      <ConfettiAnimation visible={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{lesson.type}</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>{lesson.introduction}</Text>
        </View>

        {/* Phase: Content */}
        {phase === "content" && (
          <>
            {lesson.type === "vocabulary" && renderVocab()}
            {lesson.type === "grammar" && renderGrammar()}
            {lesson.type === "reading" && renderReading()}
            {lesson.type === "writing" && renderWriting()}
            {lesson.type === "speaking" && renderSpeaking()}
            {lesson.type === "listening" && renderListening()}
            {renderCulturalNote()}

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                setPhase("quiz");
                setSelectedAnswers({});
                setQuizSubmitted(false);
              }}
            >
              <Text style={styles.continueBtnText}>Take the Quiz</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.text} />
            </TouchableOpacity>
          </>
        )}

        {/* Phase: Quiz */}
        {phase === "quiz" && renderQuiz()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerBack: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  introCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  introText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  contentSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 12 },

  // Vocab
  vocabCard: { backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 8 },
  vocabMain: { marginBottom: 4 },
  vocabWord: { fontSize: 16, fontWeight: "700", color: Colors.text },
  vocabTranslation: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  vocabPronunciation: { fontSize: 12, color: Colors.textMuted, fontStyle: "italic", marginTop: 2 },
  vocabExample: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  vocabExampleText: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  genderBadge: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 6 },
  genderText: { fontSize: 10, fontWeight: "600" },

  // Grammar
  grammarCard: { backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 10 },
  grammarHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  grammarRule: { fontSize: 15, fontWeight: "700", color: Colors.text, flex: 1 },
  grammarExplanation: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  grammarExampleBox: { backgroundColor: Colors.cardLight, borderRadius: 8, padding: 10 },
  grammarExample: { fontSize: 14, color: Colors.primaryLight, fontWeight: "600" },
  grammarTranslation: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 8, backgroundColor: Colors.warning + "10", padding: 8, borderRadius: 6 },
  tipText: { fontSize: 12, color: Colors.warning, flex: 1, lineHeight: 18 },

  // Reading
  readingCard: { backgroundColor: Colors.card, borderRadius: 10, padding: 16 },
  readingText: { fontSize: 14, color: Colors.text, lineHeight: 24 },
  readingQuestion: { marginBottom: 16 },
  readingQuestionText: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 8 },
  readingOption: { backgroundColor: Colors.card, borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  readingOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + "10" },
  readingOptionText: { fontSize: 13, color: Colors.textSecondary },

  // Writing
  writingPromptCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 12 },
  writingPrompt: { fontSize: 14, color: Colors.text, lineHeight: 22, flex: 1 },
  hintsTitle: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 8 },
  hintRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  hintBullet: { color: Colors.textMuted, fontSize: 12 },
  hintText: { fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 18 },
  writingInput: { backgroundColor: Colors.card, borderRadius: 10, padding: 14, minHeight: 120, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, marginTop: 12 },
  wordCountRow: { alignItems: "flex-end", marginTop: 6 },
  wordCountText: { fontSize: 12, color: Colors.textMuted },
  exampleAnswerCard: { backgroundColor: Colors.cardLight, borderRadius: 10, padding: 14, marginTop: 16 },
  exampleAnswerTitle: { fontSize: 12, fontWeight: "600", color: Colors.textMuted, marginBottom: 6 },
  exampleAnswerText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  // Speaking
  scenarioCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 16 },
  scenarioText: { fontSize: 14, color: Colors.text, lineHeight: 22, flex: 1 },
  promptsTitle: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 10 },
  speakingPromptRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  promptNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary + "20", justifyContent: "center", alignItems: "center" },
  promptNumberText: { fontSize: 11, fontWeight: "700", color: Colors.primary },
  promptContent: { flex: 1 },
  promptText: { fontSize: 13, color: Colors.text, fontWeight: "500", marginBottom: 4 },
  modelResponse: { fontSize: 13, color: Colors.speaking, fontStyle: "italic" },

  // Listening
  transcriptCard: { backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 16 },
  transcriptHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  transcriptLabel: { fontSize: 12, fontWeight: "600", color: Colors.listening },
  transcriptText: { fontSize: 13, color: Colors.text, lineHeight: 22 },

  // Cultural
  culturalCard: { backgroundColor: Colors.primary + "10", borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.primary + "30" },
  culturalHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  culturalEmoji: { fontSize: 18 },
  culturalTitle: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  culturalText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  // Continue button
  continueBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.primary, borderRadius: 12, padding: 16, marginTop: 8 },
  continueBtnText: { fontSize: 16, fontWeight: "700", color: Colors.text },

  // Quiz
  quizSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  quizQuestion: { marginBottom: 20 },
  questionText: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 10 },
  optionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.card, borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + "10" },
  optionCorrect: { borderColor: Colors.success, backgroundColor: Colors.success + "10" },
  optionWrong: { borderColor: Colors.error, backgroundColor: Colors.error + "10" },
  optionText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  explanationBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 8, padding: 8, backgroundColor: Colors.primary + "10", borderRadius: 6 },
  explanationText: { fontSize: 12, color: Colors.primaryLight, flex: 1, lineHeight: 18 },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: Colors.text },

  // Results
  resultsCard: { alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, padding: 24, marginTop: 16 },
  resultsEmoji: { fontSize: 48, marginBottom: 12 },
  resultsScore: { fontSize: 24, fontWeight: "800", color: Colors.text, marginBottom: 4 },
  resultsMessage: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginBottom: 16 },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  doneBtnText: { fontSize: 15, fontWeight: "700", color: Colors.text },

  // XP Badge
  xpBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.gold + "15", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.gold + "40", marginBottom: 12 },
  xpBadgeText: { fontSize: 14, fontWeight: "700", color: Colors.gold },

  // SRS Notice
  srsNotice: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary + "10", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 16 },
  srsNoticeText: { fontSize: 12, color: Colors.primaryLight },

  // Empty state
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginTop: 8 },
  backBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 },
  backBtnText: { fontSize: 14, fontWeight: "600", color: Colors.text },
});
