import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, TextInput } from "react-native";
import { useAchievementUnlock } from "@/hooks/use-achievement-unlock";
import { AchievementUnlockToast } from "@/components/achievement-unlock-toast";
import { trackLessonComplete } from "@/lib/analytics";
import { incrementLessonCount, maybeRequestStoreReview } from "@/lib/store-review";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLessonContent, type LessonContent, type VocabItem, type QuizQuestion } from "@/lib/lesson-content";
import { useStudyMusic } from "@/hooks/use-study-music";
import { onLessonComplete, onLessonQuizAnswer, onSessionStart, onSessionEnd } from "@/lib/adaptive-engine-hooks";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  gold: "#FFD700",
  success: "#00E676",
  accent: "#FF6B6B",
  glowSubtle: "rgba(0,170,255,0.08)",
  glowBorder: "rgba(0,170,255,0.2)",
};

export default function LessonPlayerScreen() {
  const { showStreakToast } = useUsage();
  const router = useRouter();
  const params = useLocalSearchParams<{ lessonId?: string; lessonTitle?: string; courseName?: string }>();
  const lessonTitle = params.lessonTitle || "Lesson";
  const courseName = params.courseName || "Course";

  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [expandedVocab, setExpandedVocab] = useState<string | null>(null);
  const [lessonStartTime] = useState(() => Date.now());

  // Background study music (culturally-appropriate for target language)
  const { state: musicState, controls: musicControls } = useStudyMusic(courseName || "Spanish");

  // Load real lesson content from curriculum data
  const lessonContent = useMemo(() => {
    if (params.lessonId) {
      return getLessonContent(params.lessonId);
    }
    return null;
  }, [params.lessonId]);

  // Load saved state
  useEffect(() => {
    const loadState = async () => {
      const [savedNotes, savedBookmark, savedCompleted] = await Promise.all([
        AsyncStorage.getItem(`lesson_notes_${params.lessonId}`),
        AsyncStorage.getItem(`lesson_bookmarked_${params.lessonId}`),
        AsyncStorage.getItem(`lesson_completed_${params.lessonId}`),
      ]);
      if (savedNotes) setNotes(savedNotes);
      if (savedBookmark === "true") setBookmarked(true);
      if (savedCompleted === "true") setCompleted(true);
    };
    loadState();
  }, []);

  const saveNotes = useCallback(async (text: string) => {
    setNotes(text);
    await AsyncStorage.setItem(`lesson_notes_${params.lessonId}`, text);
  }, [params.lessonId]);

  const toggleBookmark = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newState = !bookmarked;
    setBookmarked(newState);
    if (newState) {
      await AsyncStorage.setItem(`lesson_bookmarked_${params.lessonId}`, "true");
      const bookmarks = JSON.parse(await AsyncStorage.getItem("saved_lessons") || "[]");
      const exists = bookmarks.find((b: any) => b.lessonId === params.lessonId);
      if (!exists) {
        bookmarks.push({ lessonId: params.lessonId, lessonTitle, courseName, savedAt: Date.now() });
        await AsyncStorage.setItem("saved_lessons", JSON.stringify(bookmarks));
      }
    } else {
      await AsyncStorage.removeItem(`lesson_bookmarked_${params.lessonId}`);
      const bookmarks = JSON.parse(await AsyncStorage.getItem("saved_lessons") || "[]");
      const filtered = bookmarks.filter((b: any) => b.lessonId !== params.lessonId);
      await AsyncStorage.setItem("saved_lessons", JSON.stringify(filtered));
    }
  };

  const { toastData, checkForUnlocks, dismissToast } = useAchievementUnlock();

  const handleComplete = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompleted(true);
    await AsyncStorage.setItem(`lesson_completed_${params.lessonId}`, "true");
    // Track progress
    const progressKey = "@lesson_progress";
    const progress = JSON.parse(await AsyncStorage.getItem(progressKey) || "{}");
    progress[params.lessonId || "unknown"] = { completedAt: Date.now(), score: quizScore };
    await AsyncStorage.setItem(progressKey, JSON.stringify(progress));
    // Track lesson completion in analytics
    const duration = Math.floor((Date.now() - (lessonStartTime || Date.now())) / 1000);
    trackLessonComplete(params.lessonId || "unknown", quizScore, duration);
    // Feed adaptive learning engines
    await onLessonComplete({
      lessonId: params.lessonId || "unknown",
      quizScore,
      durationSeconds: duration,
      vocabLearned: (lessonContent as any)?.vocabulary?.length || 0,
    });
    await onSessionEnd("lesson");
    // Increment total lesson count and maybe request store review after 7th lesson
    await incrementLessonCount();
    await maybeRequestStoreReview();
    // Mark today as practiced for streak tracking
    markPracticeAndToast(showStreakToast);
    // Check for achievement unlocks after lesson completion
    setTimeout(() => checkForUnlocks(), 1200);
  };

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
    // Feed adaptive engines with quiz answer
    const question = lessonContent?.quiz?.find(q => q.id === questionId);
    if (question) {
      onLessonQuizAnswer({
        lessonId: params.lessonId || "unknown",
        questionId,
        conceptId: `${params.lessonId}_${questionId}`,
        conceptName: question.question || questionId,
        correct: answerIndex === question.correct,
        responseTimeMs: 5000,
        category: "grammar",
      });
    }
  };

  const quizScore = useMemo(() => {
    if (!lessonContent?.quiz) return 0;
    let correct = 0;
    lessonContent.quiz.forEach((q) => {
      if (quizAnswers[q.id] === q.correct) correct++;
    });
    return lessonContent.quiz.length > 0 ? Math.round((correct / lessonContent.quiz.length) * 100) : 0;
  }, [quizAnswers, lessonContent]);

  // Render vocabulary section
  const renderVocab = (vocab: VocabItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        <Ionicons name="book" size={16} color={Colors.secondary} /> Vocabulary ({vocab.length} words)
      </Text>
      {vocab.map((item, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.vocabCard}
          onPress={() => setExpandedVocab(expandedVocab === item.word ? null : item.word)}
          activeOpacity={0.7}
        >
          <View style={styles.vocabHeader}>
            <Text style={styles.vocabWord}>{item.word}</Text>
            {item.gender && (
              <View style={[styles.genderBadge, { backgroundColor: item.gender === "masculine" ? "#3B82F6" : item.gender === "feminine" ? "#EC4899" : "#8B5CF6" }]}>
                <Text style={styles.genderText}>{item.gender[0].toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.vocabTranslation}>{item.translation}</Text>
          </View>
          {item.pronunciation && (
            <Text style={styles.vocabPronunciation}>/{item.pronunciation}/</Text>
          )}
          {expandedVocab === item.word && item.example && (
            <View style={styles.vocabExample}>
              <Text style={styles.vocabExampleLabel}>Example:</Text>
              <Text style={styles.vocabExampleText}>{item.example}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render grammar section
  const renderGrammar = () => {
    if (!lessonContent?.grammar) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="construct" size={16} color={Colors.gold} /> Grammar Rules
        </Text>
        {lessonContent.grammar.map((rule, idx) => (
          <View key={idx} style={styles.grammarCard}>
            <Text style={styles.grammarRule}>{rule.rule}</Text>
            <Text style={styles.grammarExplanation}>{rule.explanation}</Text>
            <View style={styles.grammarExample}>
              <Text style={styles.grammarExampleText}>{rule.example}</Text>
              <Text style={styles.grammarTranslation}>{rule.translation}</Text>
            </View>
            {rule.tip && (
              <View style={styles.grammarTip}>
                <Ionicons name="bulb" size={14} color={Colors.gold} />
                <Text style={styles.grammarTipText}>{rule.tip}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  // Render reading section
  const renderReading = () => {
    if (!lessonContent?.reading) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="reader" size={16} color={Colors.secondary} /> Reading: {lessonContent.reading.title}
        </Text>
        <View style={styles.readingCard}>
          <Text style={styles.readingText}>{lessonContent.reading.text}</Text>
        </View>
      </View>
    );
  };

  // Render quiz section
  const renderQuiz = () => {
    if (!lessonContent?.quiz || lessonContent.quiz.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="help-circle" size={16} color={Colors.gold} /> Quiz ({lessonContent.quiz.length} questions)
        </Text>
        {lessonContent.quiz.map((q, idx) => (
          <View key={q.id} style={styles.quizCard}>
            <Text style={styles.quizQuestion}>{idx + 1}. {q.question}</Text>
            {q.options.map((option, optIdx) => {
              const isSelected = quizAnswers[q.id] === optIdx;
              const isCorrect = showQuizResults && optIdx === q.correct;
              const isWrong = showQuizResults && isSelected && optIdx !== q.correct;
              return (
                <TouchableOpacity
                  key={optIdx}
                  style={[
                    styles.quizOption,
                    isSelected && styles.quizOptionSelected,
                    isCorrect && styles.quizOptionCorrect,
                    isWrong && styles.quizOptionWrong,
                  ]}
                  onPress={() => !showQuizResults && handleQuizAnswer(q.id, optIdx)}
                  disabled={showQuizResults}
                >
                  <Text style={[
                    styles.quizOptionText,
                    isSelected && styles.quizOptionTextSelected,
                    isCorrect && { color: Colors.success },
                    isWrong && { color: Colors.accent },
                  ]}>
                    {option}
                  </Text>
                  {isCorrect && <Ionicons name="checkmark-circle" size={18} color={Colors.success} />}
                  {isWrong && <Ionicons name="close-circle" size={18} color={Colors.accent} />}
                </TouchableOpacity>
              );
            })}
            {showQuizResults && q.explanation && (
              <Text style={styles.quizExplanation}>{q.explanation}</Text>
            )}
          </View>
        ))}
        {!showQuizResults && Object.keys(quizAnswers).length === lessonContent.quiz.length && (
          <TouchableOpacity
            style={styles.submitQuizBtn}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setShowQuizResults(true);
            }}
          >
            <Text style={styles.submitQuizBtnText}>Check Answers</Text>
          </TouchableOpacity>
        )}
        {showQuizResults && (
          <View style={styles.quizScoreCard}>
            <Text style={styles.quizScoreText}>Score: {quizScore}%</Text>
            <Text style={styles.quizScoreSub}>
              {quizScore >= 80 ? "Excellent! 🎉" : quizScore >= 60 ? "Good job! Keep practicing." : "Review the material and try again."}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Fallback if no lesson content found
  if (!lessonContent) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.headerTitle}>{lessonTitle}</Text>
            <Text style={styles.headerSub}>{courseName}</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Ionicons name="book-outline" size={48} color={Colors.textMuted} />
          <Text style={{ fontSize: 16, color: Colors.textSecondary, textAlign: "center", marginTop: 16 }}>
            Lesson content is being prepared. Check back soon!
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, textAlign: "center", marginTop: 8 }}>
            Lesson ID: {params.lessonId || "unknown"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{lessonContent.title || lessonTitle}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{courseName}</Text>
        </View>
        <TouchableOpacity onPress={() => musicControls.toggle()} style={styles.bookmarkBtn}>
          <Ionicons name={musicState.isPlaying ? "musical-notes" : "musical-notes-outline"} size={20} color={musicState.isPlaying ? Colors.secondary : Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleBookmark} style={styles.bookmarkBtn}>
          <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={bookmarked ? Colors.gold : Colors.textSecondary} />
        </TouchableOpacity>
        {!completed ? (
          <TouchableOpacity onPress={handleComplete} style={styles.completeBtn}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.completeBtn, { backgroundColor: Colors.success }]}>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Lesson Type Badge */}
        <View style={styles.typeBadge}>
          <Ionicons
            name={
              lessonContent.type === "vocabulary" ? "book" :
              lessonContent.type === "grammar" ? "construct" :
              lessonContent.type === "reading" ? "reader" :
              lessonContent.type === "writing" ? "create" :
              lessonContent.type === "speaking" ? "mic" : "headset"
            }
            size={14}
            color={Colors.secondary}
          />
          <Text style={styles.typeBadgeText}>{lessonContent.type.charAt(0).toUpperCase() + lessonContent.type.slice(1)} Lesson</Text>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>{lessonContent.introduction}</Text>
        </View>

        {/* Cultural Note */}
        {lessonContent.culturalNote && (
          <View style={styles.culturalNote}>
            <Ionicons name="earth" size={16} color={Colors.gold} />
            <Text style={styles.culturalNoteText}>{lessonContent.culturalNote}</Text>
          </View>
        )}

        {/* Vocabulary */}
        {lessonContent.vocab && lessonContent.vocab.length > 0 && renderVocab(lessonContent.vocab)}

        {/* Grammar */}
        {renderGrammar()}

        {/* Reading */}
        {renderReading()}

        {/* Speaking */}
        {lessonContent.speaking && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="mic" size={16} color={Colors.secondary} /> Speaking Practice
            </Text>
            <View style={styles.speakingCard}>
              <Text style={styles.speakingScenario}>{lessonContent.speaking.scenario}</Text>
              {lessonContent.speaking.prompts.map((prompt, idx) => (
                <View key={idx} style={styles.speakingPrompt}>
                  <Text style={styles.speakingPromptText}>Say: "{prompt}"</Text>
                </View>
              ))}
              {lessonContent.speaking.tips.map((tip, idx) => (
                <View key={idx} style={styles.grammarTip}>
                  <Ionicons name="bulb" size={14} color={Colors.gold} />
                  <Text style={styles.grammarTipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quiz */}
        {renderQuiz()}

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <Text style={styles.notesSectionTitle}>
            <Ionicons name="document-text-outline" size={16} color={Colors.textPrimary} /> Lesson Notes
          </Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Take notes while studying..."
            placeholderTextColor={Colors.textMuted}
            multiline
            value={notes}
            onChangeText={saveNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Mark Complete Button */}
        {!completed && (
          <TouchableOpacity style={styles.markCompleteBtn} onPress={handleComplete} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.markCompleteBtnText}>Mark Lesson as Complete</Text>
          </TouchableOpacity>
        )}

        {completed && (
          <View style={styles.completedBanner}>
            <Ionicons name="trophy" size={20} color={Colors.gold} />
            <Text style={styles.completedBannerText}>Lesson Complete! Great work.</Text>
          </View>
        )}

        {/* Navigate to exercises */}
        <TouchableOpacity
          style={styles.exerciseBtn}
          onPress={() => router.push({ pathname: "/lesson-exercise", params: { lessonId: params.lessonId, lessonTitle: lessonContent.title } } as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="fitness" size={20} color="#FFFFFF" />
          <Text style={styles.exerciseBtnText}>Practice Exercises</Text>
        </TouchableOpacity>
      </ScrollView>
      <AchievementUnlockToast toastData={toastData} onDismiss={dismissToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  completeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.glowSubtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  typeBadgeText: { fontSize: 12, fontWeight: "600", color: Colors.secondary },
  introCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  introText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  culturalNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(255,215,0,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  culturalNoteText: { fontSize: 13, color: Colors.gold, flex: 1, lineHeight: 20 },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, marginBottom: 12 },
  vocabCard: {
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  vocabHeader: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  vocabWord: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  vocabTranslation: { fontSize: 14, color: Colors.secondary },
  vocabPronunciation: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  vocabExample: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  vocabExampleLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  vocabExampleText: { fontSize: 13, color: Colors.textSecondary, fontStyle: "italic" },
  genderBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  genderText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  grammarCard: {
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  grammarRule: { fontSize: 15, fontWeight: "700", color: Colors.gold, marginBottom: 6 },
  grammarExplanation: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  grammarExample: {
    padding: 10,
    backgroundColor: "rgba(0,170,255,0.06)",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  grammarExampleText: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  grammarTranslation: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  grammarTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(255,215,0,0.06)",
    borderRadius: 6,
  },
  grammarTipText: { fontSize: 12, color: Colors.gold, flex: 1 },
  readingCard: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readingText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 24 },
  speakingCard: {
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  speakingScenario: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12, lineHeight: 20 },
  speakingPrompt: {
    padding: 10,
    backgroundColor: "rgba(0,170,255,0.06)",
    borderRadius: 8,
    marginBottom: 8,
  },
  speakingPromptText: { fontSize: 14, fontWeight: "600", color: Colors.secondary },
  quizCard: {
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  quizQuestion: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary, marginBottom: 10 },
  quizOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  quizOptionSelected: { borderColor: Colors.secondary, backgroundColor: Colors.glowSubtle },
  quizOptionCorrect: { borderColor: Colors.success, backgroundColor: "rgba(0,230,118,0.1)" },
  quizOptionWrong: { borderColor: Colors.accent, backgroundColor: "rgba(255,107,107,0.1)" },
  quizOptionText: { fontSize: 14, color: Colors.textSecondary },
  quizOptionTextSelected: { color: Colors.textPrimary, fontWeight: "600" },
  quizExplanation: { fontSize: 12, color: Colors.textMuted, marginTop: 8, fontStyle: "italic" },
  submitQuizBtn: {
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    marginTop: 8,
  },
  submitQuizBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  quizScoreCard: {
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.glowSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    marginTop: 12,
  },
  quizScoreText: { fontSize: 24, fontWeight: "800", color: Colors.secondary },
  quizScoreSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  notesSection: { marginHorizontal: 16, marginTop: 20 },
  notesSectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, marginBottom: 10 },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    minHeight: 100,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  markCompleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 14,
  },
  markCompleteBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(0,230,118,0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  completedBannerText: { fontSize: 15, fontWeight: "700", color: Colors.success },
  exerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    backgroundColor: Colors.gold,
    borderRadius: 14,
  },
  exerciseBtnText: { fontSize: 15, fontWeight: "700", color: Colors.primary },
});
