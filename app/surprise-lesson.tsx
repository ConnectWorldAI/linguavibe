/**
 * Surprise Lesson Screen
 * 
 * When the system detects the student hasn't opened the app in a while,
 * it generates a fun micro-lesson based on something trending in their
 * target culture. Accessed via push notification or from the home screen.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/Colors";
import { createVanillaClient } from "@/lib/trpc";
import { getStudentName } from "@/lib/teacher-memory";
import { getCompanionContext } from "@/lib/wave-cloud-memory";
import { markTodayAsPracticed } from "@/lib/streak-notifications";
import { markPracticeAndToast } from "@/lib/streak-practice-helper";
import { useUsage } from "@/lib/usage-context";

const SURPRISE_LESSONS_KEY = "@surprise_lessons_history";

interface NewWord {
  word: string;
  pronunciation: string;
  meaning: string;
  exampleSentence: string;
}

interface LessonContent {
  hook: string;
  newWords: NewWord[];
  culturalFact: string;
  miniChallenge: string;
  encouragement: string;
}

interface SurpriseLesson {
  id: string;
  title: string;
  notificationBody: string;
  lessonContent: LessonContent | null;
  language: string;
  timestamp: number;
  completed: boolean;
}

export default function SurpriseLessonScreen() {
  const { showStreakToast } = useUsage();
  const router = useRouter();
  const params = useLocalSearchParams<{ lessonId?: string }>();
  const [lesson, setLesson] = useState<SurpriseLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [challengeRevealed, setChallengeRevealed] = useState(false);
  const [wordRevealed, setWordRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadOrGenerateLesson();
  }, []);

  const loadOrGenerateLesson = async () => {
    try {
      // Check if we have a specific lesson to load
      if (params.lessonId) {
        const stored = await AsyncStorage.getItem(SURPRISE_LESSONS_KEY);
        if (stored) {
          const lessons: SurpriseLesson[] = JSON.parse(stored);
          const found = lessons.find((l) => l.id === params.lessonId);
          if (found) { setLesson(found); setIsLoading(false); return; }
        }
      }
      // Generate a new surprise lesson
      await generateNewLesson();
    } catch {
      setIsLoading(false);
    }
  };

  const generateNewLesson = useCallback(async () => {
    setIsLoading(true);
    try {
      const vanillaClient = createVanillaClient();
      const studentName = await getStudentName();
      const targetLang = (await AsyncStorage.getItem("@target_language")) || "es";
      const cefrLevel = (await AsyncStorage.getItem("@cefr_level")) || "A1";
      const memoryCtx = await getCompanionContext();

      const langNameMap: Record<string, string> = {
        es: "Spanish", fr: "French", pt: "Portuguese", de: "German",
        it: "Italian", ja: "Japanese", ko: "Korean", zh: "Chinese",
      };

      // Calculate hours since last app open
      const lastOpen = await AsyncStorage.getItem("@last_app_open");
      const hoursInactive = lastOpen
        ? Math.floor((Date.now() - parseInt(lastOpen, 10)) / (1000 * 60 * 60))
        : 24;

      const result = await vanillaClient.waveCloudChat.generateSurpriseLesson.mutate({
        studentName,
        targetLanguage: langNameMap[targetLang] || "Spanish",
        cefrLevel,
        interests: [],
        memoryContext: memoryCtx.slice(0, 500),
        hoursInactive,
      });

      const newLesson: SurpriseLesson = {
        id: `sl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: result.title,
        notificationBody: result.notificationBody,
        lessonContent: result.lessonContent,
        language: result.language,
        timestamp: Date.now(),
        completed: false,
      };

      // Save to history
      const stored = await AsyncStorage.getItem(SURPRISE_LESSONS_KEY);
      const lessons: SurpriseLesson[] = stored ? JSON.parse(stored) : [];
      lessons.unshift(newLesson);
      await AsyncStorage.setItem(SURPRISE_LESSONS_KEY, JSON.stringify(lessons.slice(0, 50)));

      setLesson(newLesson);
    } catch {
      // Fallback lesson
      setLesson({
        id: `sl_fallback_${Date.now()}`,
        title: "A Little Something For You",
        notificationBody: "Your teacher left you something cool",
        lessonContent: {
          hook: "Did you know that in many Spanish-speaking countries, people greet each other with a kiss on the cheek? It's called 'un beso' and it's totally normal even between people who just met!",
          newWords: [
            { word: "saludar", pronunciation: "sa-loo-DAR", meaning: "to greet", exampleSentence: "En mi país, saludamos con un beso." },
            { word: "la mejilla", pronunciation: "la meh-HEE-ya", meaning: "the cheek", exampleSentence: "Le dio un beso en la mejilla." },
            { word: "conocer", pronunciation: "ko-no-SER", meaning: "to meet/know", exampleSentence: "Mucho gusto en conocerte." },
          ],
          culturalFact: "In Argentina, even men greet each other with a kiss on the cheek. In Mexico, it's usually just between women or between a man and a woman.",
          miniChallenge: "Try greeting someone today by saying '¡Hola! ¿Cómo estás?' with a big smile!",
          encouragement: "You're doing amazing — every little bit of practice counts!",
        },
        language: "Spanish",
        timestamp: Date.now(),
        completed: false,
      });
    }
    setIsLoading(false);
  }, []);

  const markCompleted = async () => {
    if (!lesson) return;
    const updated = { ...lesson, completed: true };
    setLesson(updated);
    const stored = await AsyncStorage.getItem(SURPRISE_LESSONS_KEY);
    if (stored) {
      const lessons: SurpriseLesson[] = JSON.parse(stored);
      const idx = lessons.findIndex((l) => l.id === lesson.id);
      if (idx >= 0) { lessons[idx] = updated; }
      await AsyncStorage.setItem(SURPRISE_LESSONS_KEY, JSON.stringify(lessons));
    }
    markPracticeAndToast(showStreakToast);
  };

  const toggleWordReveal = (index: number) => {
    setWordRevealed((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (isLoading) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.neonPurple} />
          <Text style={s.loadingText}>Your teacher is preparing something special...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!lesson || !lesson.lessonContent) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={s.loadingContainer}>
          <Ionicons name="sad-outline" size={48} color={Colors.muted} />
          <Text style={s.loadingText}>Couldn't load the lesson. Try again later!</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backButton, pressed && { opacity: 0.7 }]}>
            <Text style={s.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const content = lesson.lessonContent;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerLabel}>SURPRISE LESSON</Text>
            <Text style={s.headerTitle}>{lesson.title}</Text>
          </View>
          <Pressable onPress={generateNewLesson} style={({ pressed }) => [s.refreshBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons name="refresh" size={20} color={Colors.neonPurple} />
          </Pressable>
        </View>

        {/* Hook */}
        <View style={s.hookCard}>
          <Ionicons name="sparkles" size={20} color={Colors.gold} />
          <Text style={s.hookText}>{content.hook}</Text>
        </View>

        {/* New Words */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            <Ionicons name="book" size={16} color={Colors.neonPurple} /> New Words
          </Text>
          {content.newWords.map((word, i) => (
            <Pressable
              key={i}
              onPress={() => toggleWordReveal(i)}
              style={({ pressed }) => [s.wordCard, pressed && { opacity: 0.8 }]}
            >
              <View style={s.wordHeader}>
                <Text style={s.wordText}>{word.word}</Text>
                <Text style={s.wordPronunciation}>/{word.pronunciation}/</Text>
              </View>
              {wordRevealed[i] ? (
                <View style={s.wordDetails}>
                  <Text style={s.wordMeaning}>{word.meaning}</Text>
                  <Text style={s.wordExample}>"{word.exampleSentence}"</Text>
                </View>
              ) : (
                <Text style={s.tapReveal}>Tap to reveal meaning</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Cultural Fact */}
        <View style={s.factCard}>
          <View style={s.factHeader}>
            <Ionicons name="earth" size={18} color={Colors.success} />
            <Text style={s.factTitle}>Cultural Insight</Text>
          </View>
          <Text style={s.factText}>{content.culturalFact}</Text>
        </View>

        {/* Mini Challenge */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            <Ionicons name="trophy" size={16} color={Colors.gold} /> 30-Second Challenge
          </Text>
          {challengeRevealed ? (
            <View style={s.challengeCard}>
              <Text style={s.challengeText}>{content.miniChallenge}</Text>
              <Pressable
                onPress={markCompleted}
                style={({ pressed }) => [
                  s.completedBtn,
                  lesson.completed && s.completedBtnDone,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons
                  name={lesson.completed ? "checkmark-circle" : "checkmark-circle-outline"}
                  size={20}
                  color={lesson.completed ? "#fff" : Colors.success}
                />
                <Text style={[s.completedBtnText, lesson.completed && { color: "#fff" }]}>
                  {lesson.completed ? "Completed!" : "Mark as Done"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setChallengeRevealed(true)}
              style={({ pressed }) => [s.revealBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="eye-outline" size={20} color="#fff" />
              <Text style={s.revealBtnText}>Reveal Challenge</Text>
            </Pressable>
          )}
        </View>

        {/* Encouragement */}
        <View style={s.encouragementCard}>
          <Ionicons name="heart" size={18} color={Colors.neonPurple} />
          <Text style={s.encouragementText}>{content.encouragement}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.md },
  loadingText: { fontSize: FontSize.base, color: Colors.muted, textAlign: "center" },
  backButton: { backgroundColor: Colors.neonPurple, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 10 },
  backButtonText: { color: "#fff", fontWeight: "600" },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },
  header: {
    flexDirection: "row", alignItems: "center", marginBottom: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, marginLeft: Spacing.sm },
  headerLabel: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.neonPurple, letterSpacing: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.textPrimary, marginTop: 2 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.neonPurple + "15",
    alignItems: "center", justifyContent: "center",
  },
  hookCard: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: Colors.gold + "10",
    padding: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  hookText: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.sm },
  wordCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 0.5, borderColor: Colors.borderLight,
  },
  wordHeader: { flexDirection: "row", alignItems: "baseline", gap: Spacing.sm },
  wordText: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.neonPurple },
  wordPronunciation: { fontSize: FontSize.sm, color: Colors.muted },
  wordDetails: { marginTop: Spacing.sm },
  wordMeaning: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: "600" },
  wordExample: { fontSize: FontSize.sm, color: Colors.muted, fontStyle: "italic", marginTop: 4 },
  tapReveal: { fontSize: FontSize.sm, color: Colors.muted, fontStyle: "italic", marginTop: 6 },
  factCard: {
    backgroundColor: Colors.success + "10", borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  factHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  factTitle: { fontSize: FontSize.base, fontWeight: "700", color: Colors.textPrimary },
  factText: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  challengeCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 0.5, borderColor: Colors.gold + "40",
  },
  challengeText: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22, marginBottom: Spacing.sm },
  completedBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.success,
  },
  completedBtnDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  completedBtnText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.success },
  revealBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.gold, paddingVertical: 12, borderRadius: 20,
  },
  revealBtnText: { fontSize: FontSize.base, fontWeight: "600", color: "#fff" },
  encouragementCard: {
    flexDirection: "row", alignItems: "flex-start", backgroundColor: Colors.neonPurple + "10",
    padding: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.sm,
  },
  encouragementText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
});
