import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { StoryChoiceExercise, CulturalDiscoveryExercise, ConversationChainExercise, MatchPairsExercise, FillOrderExercise, GrammarComparisonExercise, RRTExercise, NetflixDictationExercise } from "@/components/exercises";
import type { RRTPhrase } from "@/components/exercises/rrt-exercise";
import type { DictationClip } from "@/components/exercises/netflix-dictation-exercise";
import { WhiteboardExercise, type WhiteboardLessonData, type WhiteboardResults } from "@/components/whiteboard-exercise";
import { trpc } from "@/lib/trpc";
import { saveGrammarNotebookEntry } from "@/app/grammar-notebook";
import * as Speech from "expo-speech";
import { useCultureMode, getPreferredExerciseTypes, getExerciseDistribution } from "@/lib/culture-mode";
import { logLearningSession, type ActivityType, type CEFRLevel } from "@/lib/cefr-hour-tracker";
import { trackExerciseStart, trackExerciseComplete, type ExerciseType as AnalyticsExerciseType } from "@/lib/exercise-analytics";
import { analyzePerformance } from "@/lib/learning-intelligence";
import { MoodCheckIn } from "@/components/mood-check-in";
import { TeacherPersonalNote } from "@/components/teacher-personal-note";
import { getStudentName, getMoodContext, recordMemory, learnAboutStudent, initFromOnboarding } from "@/lib/teacher-memory";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";
import { trackLessonComplete } from "@/lib/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ExerciseType = "story_choice" | "cultural_discovery" | "conversation_chain" | "match_pairs" | "fill_order" | "grammar_comparison" | "whiteboard_teaching" | "rrt" | "netflix_dictation";

interface GeneratedExercise {
  type: ExerciseType;
  title: string;
  scenario: string;
  character: { name: string; role: string; emoji: string };
  steps?: Array<{
    prompt: string;
    promptTranslation: string;
    pronunciation: string;
    options: string[];
    correctIndex: number;
    correctFeedback: string;
    wrongFeedback: string;
    culturalNote: string;
  }>;
  pairs?: Array<{ left: string; right: string; pronunciation: string }>;
  blanks?: Array<{
    beforeText: string;
    afterText: string;
    correctAnswer: string;
    hint: string;
    pronunciation: string;
  }>;
  // Grammar Comparison fields
  grammarTopic?: string;
  nativeLanguage?: string;
  targetLanguage?: string;
  grammarTable?: Array<{ native: string; target: string; pronunciation: string; note?: string }>;
  wordOrderExamples?: Array<{
    nativeSentence: string;
    targetSentence: string;
    nativeBreakdown: string[];
    targetBreakdown: string[];
    pronunciationBreakdown: string[];
    orderNote: string;
  }>;
  quiz?: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>;
  keyRule?: string;
  conjugationTable?: {
    verb: string;
    verbMeaning: string;
    entries: Array<{
      pronoun: string;
      present: string;
      past: string;
      future: string;
      presentPron: string;
      pastPron: string;
      futurePron: string;
    }>;
  };
  vocabularyLearned: Array<{ word: string; pronunciation: string; meaning: string }>;
  // Whiteboard Teaching fields
  whiteboardLesson?: WhiteboardLessonData;
  // RRT (Rhythmic Reinforcement Training) fields
  rrtPhrases?: RRTPhrase[];
  // Netflix Dictation fields
  dictationClips?: DictationClip[];
}

export default function AdaptiveLessonScreen() {
  const { showStreakToast } = useUsage();
  const params = useLocalSearchParams<{
    lessonId: string;
    topic: string;
    category: string;
    level: string;
    language: string;
    culturalHint?: string;
  }>();

  const [exercises, setExercises] = useState<GeneratedExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const { mode, intensity } = useCultureMode();
  const preferredTypes = getPreferredExerciseTypes(mode);
  const distribution = getExerciseDistribution(mode, intensity);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [showMoodCheck, setShowMoodCheck] = useState(true);
  const [showTeacherNote, setShowTeacherNote] = useState(false);
  const [studentName, setStudentName] = useState("there");
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const lessonStartTime = useRef(Date.now());
  const exerciseStartTimes = useRef<Record<number, number>>({});
  const analyticsSessionIds = useRef<Record<number, string>>({});

  // Use creator-powered engine (pulls teaching styles from Airtable creators)
  // Falls back to basic adaptiveExercise if creatorEngine fails
  const creatorGenerateMutation = trpc.creatorEngine.generateLesson.useMutation();
  const fallbackGenerateMutation = trpc.adaptiveExercise.generateLesson.useMutation();
  const generatePronunciation = trpc.voiceExercise.generatePronunciation.useMutation();

  // Voice-reading handler for grammar table rows
  const handlePlayGrammarAudio = async (text: string, language: string) => {
    try {
      const result = await generatePronunciation.mutateAsync({
        text,
        language,
        speed: "slow",
      });
      if (result.success && result.audioUrl) {
        // Audio returned as data URI — playback handled by expo-audio
        // For now, use Speech as reliable fallback
        if (Platform.OS !== "web") {
          Speech.speak(text, { language: language.toLowerCase().slice(0, 2), rate: 0.8 });
        }
      } else {
        // Fallback to expo-speech
        if (Platform.OS !== "web") {
          Speech.speak(text, { language: language.toLowerCase().slice(0, 2), rate: 0.8 });
        }
      }
    } catch {
      if (Platform.OS !== "web") {
        Speech.speak(text, { language: language.toLowerCase().slice(0, 2), rate: 0.8 });
      }
    }
  };

  // Save to grammar notebook handler
  const handleSaveToNotebook = (data: any) => {
    saveGrammarNotebookEntry(data);
  };

  const loadExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try creator-powered engine first (Airtable creators + AI)
      let result: any = null;
      try {
        result = await creatorGenerateMutation.mutateAsync({
          language: params.language || "Spanish",
          dialect: undefined,
          level: (params.level as any) || "A1",
          lessonTopic: params.topic || "Greetings",
          lessonCategory: params.category || "vocabulary",
          culturalFocus: params.culturalHint || "",
          previousErrors: [],
        });
      } catch {
        // Creator engine failed — fall back to basic adaptive exercise
        result = await fallbackGenerateMutation.mutateAsync({
          language: params.language || "Spanish",
          level: (params.level as any) || "A1",
          lessonTopic: params.topic || "Greetings",
          lessonCategory: params.category || "vocabulary",
          culturalFocus: params.culturalHint || "",
          preferredExerciseTypes: preferredTypes,
          culturalPercentage: distribution.cultural,
        });
      }
      if (result?.success && result.lesson?.exercises) {
        setExercises(result.lesson.exercises as GeneratedExercise[]);
        // Log which creator methods were used (for analytics)
        if (result.creatorsUsed?.length) {
          console.log("Creator methods applied:", result.creatorsUsed.map((c: any) => c.name).join(", "));
        }
      } else {
        setError(result?.error || "Failed to generate exercises");
      }
    } catch (err: any) {
      setError(err.message || "Connection error");
    } finally {
      setLoading(false);
    }
  }, [params.language, params.level, params.topic, params.category, params.culturalHint]);

  useEffect(() => {
    loadExercises();
    getStudentName().then(setStudentName);
    initFromOnboarding();
  }, []);

  // Track exercise start time when index changes + analytics
  useEffect(() => {
    exerciseStartTimes.current[currentExerciseIndex] = Date.now();
    // Fire analytics start event
    if (exercises[currentExerciseIndex]) {
      const ex = exercises[currentExerciseIndex];
      const analyticsType = (ex.type === "whiteboard_teaching" ? "whiteboard" : ex.type) as AnalyticsExerciseType;
      const phraseCount = ex.steps?.length || ex.pairs?.length || ex.blanks?.length || ex.rrtPhrases?.length || ex.dictationClips?.length || ex.quiz?.length || 5;
      trackExerciseStart(analyticsType, phraseCount, params.language || "Spanish", params.level).then((sessionId) => {
        analyticsSessionIds.current[currentExerciseIndex] = sessionId;
      }).catch(() => {});
    }
  }, [currentExerciseIndex, exercises]);

  const handleExerciseComplete = async (correct: number, total: number) => {
    setTotalCorrect((c) => c + correct);
    setTotalQuestions((t) => t + total);

    // Log exercise analytics
    try {
      const exerciseStart = exerciseStartTimes.current[currentExerciseIndex] || Date.now();
      const durationMs = Date.now() - exerciseStart;
      const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
      const sessionId = analyticsSessionIds.current[currentExerciseIndex] || `fallback_${Date.now()}`;
      const currentExType = exercises[currentExerciseIndex]?.type;
      const analyticsType = (currentExType === "whiteboard_teaching" ? "whiteboard" : currentExType) as AnalyticsExerciseType;
      trackExerciseComplete(sessionId, analyticsType, correct, total, durationMs, params.language || "Spanish", { level: params.level }).catch(() => {});
    } catch (e) {
      // Silently handle analytics errors
    }

    // Log CEFR hours for this exercise
    try {
      const exerciseStart = exerciseStartTimes.current[currentExerciseIndex] || Date.now();
      const durationMinutes = Math.max(1, Math.round((Date.now() - exerciseStart) / 60000));
      const currentExType = exercises[currentExerciseIndex]?.type;
      const activityMap: Record<string, ActivityType> = {
        story_choice: "story_choice",
        cultural_discovery: "cultural_discovery",
        conversation_chain: "conversation",
        match_pairs: "match_pairs",
        fill_order: "fill_order",
        grammar_comparison: "grammar_comparison",
        whiteboard_teaching: "whiteboard",
      };
      await logLearningSession({
        activityType: activityMap[currentExType] || "adaptive",
        durationMinutes,
        language: params.language || "Spanish",
        level: (params.level?.toUpperCase() || "A1") as CEFRLevel,
        topic: params.topic || "General",
        accuracy: total > 0 ? correct / total : 0,
        xpEarned: 0, // XP not tracked per-exercise in adaptive
      });
    } catch (e) {
      // Silently handle CEFR logging errors
    }

    // Run intelligence analysis on each exercise completion
    try {
      const currentExType = exercises[currentExerciseIndex]?.type || "adaptive_lesson";
      await analyzePerformance(
        currentExType,
        params.topic || "General",
        params.language || "Spanish",
        params.level || "A1",
        correct,
        total
      );
    } catch (e) {
      // Silently handle intelligence analysis errors
    }

    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((i) => i + 1);
    } else {
      setLessonComplete(true);
    }
  };

  const renderExercise = (exercise: GeneratedExercise) => {
    switch (exercise.type) {
      case "story_choice":
        return (
          <StoryChoiceExercise
            title={exercise.title}
            scenario={exercise.scenario}
            character={exercise.character}
            steps={exercise.steps || []}
            vocabularyLearned={exercise.vocabularyLearned}
            onComplete={handleExerciseComplete}
          />
        );
      case "cultural_discovery":
        return (
          <CulturalDiscoveryExercise
            title={exercise.title}
            scenario={exercise.scenario}
            character={exercise.character}
            steps={exercise.steps || []}
            vocabularyLearned={exercise.vocabularyLearned}
            onComplete={handleExerciseComplete}
          />
        );
      case "conversation_chain":
        return (
          <ConversationChainExercise
            title={exercise.title}
            scenario={exercise.scenario}
            character={exercise.character}
            steps={exercise.steps || []}
            vocabularyLearned={exercise.vocabularyLearned}
            onComplete={handleExerciseComplete}
          />
        );
      case "match_pairs":
        return (
          <MatchPairsExercise
            title={exercise.title}
            scenario={exercise.scenario}
            pairs={exercise.pairs || []}
            onComplete={handleExerciseComplete}
          />
        );
      case "fill_order":
        return (
          <FillOrderExercise
            title={exercise.title}
            scenario={exercise.scenario}
            character={exercise.character}
            blanks={exercise.blanks || []}
            vocabularyLearned={exercise.vocabularyLearned}
            onComplete={handleExerciseComplete}
          />
        );
      case "grammar_comparison":
        return (
          <GrammarComparisonExercise
            title={exercise.title}
            scenario={exercise.scenario}
            character={exercise.character}
            grammarTopic={exercise.grammarTopic || "Grammar"}
            nativeLanguage={exercise.nativeLanguage || "English"}
            targetLanguage={exercise.targetLanguage || params.language || "Spanish"}
            grammarTable={exercise.grammarTable || []}
            wordOrderExamples={exercise.wordOrderExamples || []}
            quiz={exercise.quiz || []}
            keyRule={exercise.keyRule || ""}
            conjugationTable={exercise.conjugationTable}
            vocabularyLearned={exercise.vocabularyLearned}
            onComplete={handleExerciseComplete}
            onSaveToNotebook={handleSaveToNotebook}
            onPlayAudio={handlePlayGrammarAudio}
          />
        );
      case "whiteboard_teaching":
        if (exercise.whiteboardLesson) {
          return (
            <WhiteboardExercise
              lesson={exercise.whiteboardLesson}
              onComplete={(results: WhiteboardResults) => {
                handleExerciseComplete(results.correctAnswers, results.totalQuestions);
              }}
              speakEnabled={true}
              ttsLanguage={params.language || "Spanish"}
            />
          );
        }
        return <Text style={styles.errorText}>Whiteboard lesson data missing</Text>;
      case "rrt":
        if (exercise.rrtPhrases && exercise.rrtPhrases.length > 0) {
          return (
            <RRTExercise
              title={exercise.title}
              scenario={exercise.scenario}
              phrases={exercise.rrtPhrases}
              ttsLanguage={params.language || "es"}
              onComplete={handleExerciseComplete}
            />
          );
        }
        return <Text style={styles.errorText}>RRT exercise data missing</Text>;
      case "netflix_dictation":
        if (exercise.dictationClips && exercise.dictationClips.length > 0) {
          return (
            <NetflixDictationExercise
              title={exercise.title}
              scenario={exercise.scenario}
              clips={exercise.dictationClips}
              ttsLanguage={params.language || "es"}
              onComplete={handleExerciseComplete}
            />
          );
        }
        return <Text style={styles.errorText}>Netflix Dictation exercise data missing</Text>;
      default:
        return <Text style={styles.errorText}>Unknown exercise type</Text>;
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00AAFF" />
          <Text style={styles.loadingText}>Creating your personalized lesson...</Text>
          <Text style={styles.loadingSubtext}>
            AI is crafting cultural exercises for {params.topic}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer className="p-6">
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Couldn't Load Lesson</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]} onPress={loadExercises}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (lessonComplete) {
    const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    // Record this lesson as a memory
    const recordLessonMemory = async () => {
      if (percentage >= 80) {
        await recordMemory("breakthrough", `Got ${percentage}% on ${params.topic}`, { topic: params.topic, emotion: "proud" });
      } else if (percentage < 50) {
        await recordMemory("struggle", `Struggled with ${params.topic} (${percentage}%)`, { topic: params.topic, emotion: "frustrated" });
      }
    };
    if (!showTeacherNote) {
      recordLessonMemory();
      setShowTeacherNote(true);
      // Wire streak tracking and analytics on lesson completion
      (async () => {
        try {
          // Mark today as practiced for streak notifications
          const streakStr = await AsyncStorage.getItem("@connectworld_streak");
          const currentStreak = streakStr ? parseInt(streakStr, 10) : 1;
          await markPracticeAndToast(showStreakToast, currentStreak);
          // Increment lessons completed counter
          const lessonsStr = await AsyncStorage.getItem("@lessons_completed");
          const count = lessonsStr ? parseInt(lessonsStr, 10) : 0;
          await AsyncStorage.setItem("@lessons_completed", String(count + 1));
          // Track lesson complete analytics event
          const durationSec = exerciseStartTimes.current[0] ? Math.round((Date.now() - exerciseStartTimes.current[0]) / 1000) : 60;
          trackLessonComplete(params.topic || "adaptive", percentage, durationSec);
        } catch {}
      })();
    }
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.completeContainer}>
            <Text style={styles.completeEmoji}>{percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "💪"}</Text>
            <Text style={styles.completeTitle}>Lesson Complete!</Text>
            <Text style={styles.completeScore}>{totalCorrect}/{totalQuestions} correct ({percentage}%)</Text>
            <Text style={styles.completeTopic}>{params.topic}</Text>
            {percentage >= 80 && <Text style={styles.completeMessage}>Excellent! You're mastering this cultural context!</Text>}
            {percentage >= 50 && percentage < 80 && <Text style={styles.completeMessage}>Good progress! Practice makes perfect.</Text>}
            {percentage < 50 && <Text style={styles.completeMessage}>Keep going! Try this lesson again to improve.</Text>}
            {/* Teacher Personal Note */}
            {showTeacherNote && (
              <TeacherPersonalNote
                lessonTopic={params.topic || "today's lesson"}
                accuracy={percentage}
                struggles={[params.topic || "this topic"]}
                wins={percentage >= 70 ? ["showing up and trying"] : []}
                teacherName="Your Teacher"
                onDismiss={() => setShowTeacherNote(false)}
              />
            )}
            <Pressable style={({ pressed }) => [styles.nextLessonBtn, pressed && { opacity: 0.8 }]} onPress={() => router.back()}>
              <Text style={styles.nextLessonBtnText}>Back to Lessons</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.retryLessonBtn, pressed && { opacity: 0.8 }]} onPress={() => { setLessonComplete(false); setCurrentExerciseIndex(0); setTotalCorrect(0); setTotalQuestions(0); loadExercises(); }}>
              <Text style={styles.retryLessonBtnText}>Try Again (New Exercises)</Text>
            </Pressable>
            {percentage < 70 && (
              <Pressable style={({ pressed }) => [styles.smartPracticeBtn, pressed && { opacity: 0.8 }]} onPress={() => router.push("/smart-practice" as any)}>
                <Text style={styles.smartPracticeBtnText}>🧠 Get Extra Practice (System Recommended)</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  if (!currentExercise) return null;

  return (
    <ScreenContainer>
      {/* Mood Check-In (shows once at start of lesson) */}
      {showMoodCheck && currentExerciseIndex === 0 && (
        <MoodCheckIn
          studentName={studentName}
          onComplete={(mood) => { setCurrentMood(mood); setShowMoodCheck(false); }}
          onSkip={() => setShowMoodCheck(false)}
        />
      )}
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` as any }]} />
      </View>
      <View style={styles.progressInfo}>
        <Pressable style={({ pressed }) => [pressed && { opacity: 0.6 }]} onPress={() => router.back()}>
          <Text style={styles.closeBtn}>✕</Text>
        </Pressable>
        <Text style={styles.progressText}>Exercise {currentExerciseIndex + 1} of {exercises.length}</Text>
      </View>
      {renderExercise(currentExercise)}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 18, fontWeight: "600", color: "#ECEDEE", marginTop: 20 },
  loadingSubtext: { fontSize: 14, color: "#9BA1A6", marginTop: 8, textAlign: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorEmoji: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: "700", color: "#ECEDEE", marginBottom: 8 },
  errorMessage: { fontSize: 14, color: "#9BA1A6", textAlign: "center", marginBottom: 24 },
  errorText: { fontSize: 14, color: "#EF4444", textAlign: "center" },
  retryBtn: { backgroundColor: "#00AAFF", borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backBtn: { paddingVertical: 12 },
  backBtnText: { color: "#9BA1A6", fontSize: 14 },
  progressBar: { height: 4, backgroundColor: "#1a2234", borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: "#00AAFF", borderRadius: 2 },
  progressInfo: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: { fontSize: 20, color: "#9BA1A6", marginRight: 16 },
  progressText: { fontSize: 13, color: "#9BA1A6" },
  completeContainer: { alignItems: "center", paddingTop: 60 },
  completeEmoji: { fontSize: 64, marginBottom: 16 },
  completeTitle: { fontSize: 24, fontWeight: "700", color: "#ECEDEE", marginBottom: 8 },
  completeScore: { fontSize: 18, color: "#00AAFF", fontWeight: "600", marginBottom: 4 },
  completeTopic: { fontSize: 14, color: "#9BA1A6", marginBottom: 16 },
  completeMessage: { fontSize: 15, color: "#ECEDEE", textAlign: "center", marginBottom: 32 },
  nextLessonBtn: { backgroundColor: "#00AAFF", borderRadius: 10, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 12 },
  nextLessonBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  retryLessonBtn: { paddingVertical: 12 },
  retryLessonBtnText: { color: "#00AAFF", fontSize: 14 },
  smartPracticeBtn: { marginTop: 16, backgroundColor: "#6366F1", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  smartPracticeBtnText: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "center" },
});
