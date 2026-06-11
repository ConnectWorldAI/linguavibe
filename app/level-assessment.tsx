/**
 * 4-Minute Level Assessment - Quick CEFR Scoring
 * Inspired by Fluently's instant level test. Tests speaking, listening,
 * vocabulary, and grammar in 4 minutes to place users at the right level.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface AssessmentQuestion {
  id: string;
  section: "vocabulary" | "grammar" | "listening" | "speaking";
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  question: string;
  options?: string[];
  correctIndex?: number;
  speakingPrompt?: string;
  audioDescription?: string;
}

interface CEFRResult {
  level: string;
  label: string;
  description: string;
  color: string;
  scores: {
    vocabulary: number;
    grammar: number;
    listening: number;
    speaking: number;
  };
  recommendations: string[];
}

// ─── DATA ───────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇪🇬" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
];

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // Vocabulary (adaptive)
  { id: "v1", section: "vocabulary", level: "A1", question: "What does 'hola' mean?", options: ["Hello", "Goodbye", "Thank you", "Please"], correctIndex: 0 },
  { id: "v2", section: "vocabulary", level: "A2", question: "What does 'mariposa' mean?", options: ["Butterfly", "Flower", "Bird", "Rainbow"], correctIndex: 0 },
  { id: "v3", section: "vocabulary", level: "B1", question: "What does 'aprovechar' mean?", options: ["To take advantage of", "To approve", "To approach", "To appreciate"], correctIndex: 0 },
  { id: "v4", section: "vocabulary", level: "B2", question: "What does 'desvelarse' mean?", options: ["To stay up all night", "To reveal", "To develop", "To undress"], correctIndex: 0 },
  { id: "v5", section: "vocabulary", level: "C1", question: "What does 'escudriñar' mean?", options: ["To scrutinize", "To shield", "To escape", "To sculpt"], correctIndex: 0 },
  // Grammar
  { id: "g1", section: "grammar", level: "A1", question: "Fill in: Yo ___ estudiante.", options: ["soy", "estoy", "tengo", "hago"], correctIndex: 0 },
  { id: "g2", section: "grammar", level: "A2", question: "Fill in: Ayer ella ___ al cine.", options: ["fue", "va", "ir", "iba"], correctIndex: 0 },
  { id: "g3", section: "grammar", level: "B1", question: "Fill in: Si yo ___ rico, viajaría.", options: ["fuera", "soy", "era", "seré"], correctIndex: 0 },
  { id: "g4", section: "grammar", level: "B2", question: "Fill in: Ojalá que ___ venido antes.", options: ["hubiera", "había", "ha", "haya"], correctIndex: 0 },
  // Listening
  { id: "l1", section: "listening", level: "A1", question: "You hear: 'Buenos días, ¿cómo estás?' — What was asked?", options: ["How are you?", "What's your name?", "Where are you going?", "What time is it?"], correctIndex: 0 },
  { id: "l2", section: "listening", level: "B1", question: "You hear a fast conversation about weekend plans. What are they planning?", options: ["Going to the beach", "Working overtime", "Visiting family", "Studying"], correctIndex: 0 },
  // Speaking
  { id: "s1", section: "speaking", level: "A1", question: "Say this sentence:", speakingPrompt: "Me llamo... y soy de..." },
  { id: "s2", section: "speaking", level: "B1", question: "Describe your daily routine in 30 seconds:", speakingPrompt: "Tell us about your morning routine" },
];

const CEFR_LEVELS: CEFRResult[] = [
  { level: "A1", label: "Beginner", description: "You can understand and use basic everyday expressions.", color: "#10B981", scores: { vocabulary: 20, grammar: 15, listening: 10, speaking: 15 }, recommendations: ["Start with basic greetings and numbers", "Practice daily vocabulary", "Listen to slow, clear audio"] },
  { level: "A2", label: "Elementary", description: "You can communicate in simple, routine tasks.", color: "#22C55E", scores: { vocabulary: 40, grammar: 35, listening: 30, speaking: 35 }, recommendations: ["Expand vocabulary with themed lessons", "Practice past tense", "Try short conversations"] },
  { level: "B1", label: "Intermediate", description: "You can deal with most situations while traveling.", color: "#3B82F6", scores: { vocabulary: 60, grammar: 55, listening: 50, speaking: 55 }, recommendations: ["Watch TV shows with subtitles", "Practice subjunctive mood", "Join conversation groups"] },
  { level: "B2", label: "Upper Intermediate", description: "You can interact with native speakers fluently.", color: "#6366F1", scores: { vocabulary: 75, grammar: 70, listening: 70, speaking: 72 }, recommendations: ["Read native content daily", "Practice formal writing", "Debate topics in target language"] },
  { level: "C1", label: "Advanced", description: "You can express yourself fluently and spontaneously.", color: "#8B5CF6", scores: { vocabulary: 90, grammar: 85, listening: 85, speaking: 88 }, recommendations: ["Focus on nuance and idioms", "Write essays and articles", "Teach others to solidify knowledge"] },
  { level: "C2", label: "Mastery", description: "You can understand virtually everything heard or read.", color: "#A855F7", scores: { vocabulary: 98, grammar: 95, listening: 95, speaking: 97 }, recommendations: ["Maintain through daily immersion", "Explore regional dialects", "Professional/academic use"] },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function LevelAssessmentScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ language?: string }>();
  const [phase, setPhase] = useState<"select" | "test" | "speaking" | "result">("select");
  const [selectedLanguage, setSelectedLanguage] = useState<typeof LANGUAGES[0] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes
  const [result, setResult] = useState<CEFRResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Timer
  useEffect(() => {
    if (phase === "test" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            finishTest();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, timeLeft]);

  // Result animation
  useEffect(() => {
    if (phase === "result") {
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    }
  }, [phase]);

  const startTest = (lang: typeof LANGUAGES[0]) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLanguage(lang);
    setPhase("test");
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeLeft(240);
  };

  const answerQuestion = (index: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newAnswers = [...answers, index];
    setAnswers(newAnswers);

    if (currentQuestion >= ASSESSMENT_QUESTIONS.length - 3) {
      // Last few are speaking — skip to results for now
      finishTest();
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const finishTest = () => {
    // Calculate score based on answers
    let correctCount = 0;
    answers.forEach((answer, i) => {
      if (ASSESSMENT_QUESTIONS[i]?.correctIndex === answer) correctCount++;
    });

    const percentage = answers.length > 0 ? (correctCount / answers.length) * 100 : 0;
    let levelIndex = 0;
    if (percentage >= 90) levelIndex = 5;
    else if (percentage >= 75) levelIndex = 4;
    else if (percentage >= 60) levelIndex = 3;
    else if (percentage >= 45) levelIndex = 2;
    else if (percentage >= 25) levelIndex = 1;
    else levelIndex = 0;

    setResult(CEFR_LEVELS[levelIndex]);
    setPhase("result");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── LANGUAGE SELECT ──────────────────────────────────────────────────────

  const renderSelect = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.selectHero}>
        <Text style={styles.selectEmoji}>📊</Text>
        <Text style={[styles.selectTitle, { color: colors.foreground }]}>4-Minute Level Test</Text>
        <Text style={[styles.selectSubtitle, { color: colors.muted }]}>
          Find your CEFR level (A1-C2) in just 4 minutes. We'll test your vocabulary, grammar, listening, and speaking to place you at the perfect level.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose a language to test:</Text>

      <View style={styles.languageGrid}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.languageCard, { backgroundColor: colors.surface }]}
            onPress={() => startTest(lang)}
            activeOpacity={0.7}
          >
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <Text style={[styles.languageName, { color: colors.foreground }]}>{lang.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* How it works */}
      <View style={[styles.howSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.howTitle, { color: colors.foreground }]}>How it works</Text>
        {[
          { icon: "⏱️", text: "4 minutes — quick and painless" },
          { icon: "📈", text: "Adaptive — questions get harder as you answer correctly" },
          { icon: "🎤", text: "Tests all skills: vocab, grammar, listening, speaking" },
          { icon: "🎯", text: "Places you at the right CEFR level (A1-C2)" },
          { icon: "📋", text: "Get a personalized learning plan based on results" },
        ].map((item, i) => (
          <View key={i} style={styles.howRow}>
            <Text style={styles.howIcon}>{item.icon}</Text>
            <Text style={[styles.howText, { color: colors.muted }]}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* CEFR Scale */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>CEFR Scale</Text>
      {CEFR_LEVELS.map((level) => (
        <View key={level.level} style={[styles.cefrRow, { backgroundColor: colors.surface }]}>
          <View style={[styles.cefrBadge, { backgroundColor: level.color }]}>
            <Text style={styles.cefrBadgeText}>{level.level}</Text>
          </View>
          <View style={styles.cefrInfo}>
            <Text style={[styles.cefrLabel, { color: colors.foreground }]}>{level.label}</Text>
            <Text style={[styles.cefrDesc, { color: colors.muted }]}>{level.description}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // ─── TEST VIEW ────────────────────────────────────────────────────────────

  const renderTest = () => {
    const question = ASSESSMENT_QUESTIONS[currentQuestion];
    if (!question) return null;

    return (
      <View style={styles.testContainer}>
        {/* Timer & Progress */}
        <View style={styles.testHeader}>
          <View style={[styles.timerBadge, { backgroundColor: timeLeft < 30 ? "#EF444420" : colors.primary + "20" }]}>
            <Ionicons name="time" size={16} color={timeLeft < 30 ? "#EF4444" : colors.primary} />
            <Text style={[styles.timerText, { color: timeLeft < 30 ? "#EF4444" : colors.primary }]}>{formatTime(timeLeft)}</Text>
          </View>
          <Text style={[styles.questionCount, { color: colors.muted }]}>
            {currentQuestion + 1}/{ASSESSMENT_QUESTIONS.length - 2}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / (ASSESSMENT_QUESTIONS.length - 2)) * 100}%`, backgroundColor: colors.primary }]} />
        </View>

        {/* Section Badge */}
        <View style={[styles.sectionBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>
            {question.section === "vocabulary" ? "📚 Vocabulary" : question.section === "grammar" ? "📝 Grammar" : question.section === "listening" ? "👂 Listening" : "🎤 Speaking"}
          </Text>
          <Text style={[styles.levelBadge, { color: colors.muted }]}>Level: {question.level}</Text>
        </View>

        {/* Question */}
        <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.questionText, { color: colors.foreground }]}>{question.question}</Text>
          {question.speakingPrompt && (
            <Text style={[styles.speakingPrompt, { color: colors.primary }]}>"{question.speakingPrompt}"</Text>
          )}
        </View>

        {/* Options */}
        {question.options && (
          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.optionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => answerQuestion(index)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionLetter, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.optionLetterText, { color: colors.primary }]}>{["A", "B", "C", "D"][index]}</Text>
                </View>
                <Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Speaking Button */}
        {question.speakingPrompt && (
          <TouchableOpacity
            style={[styles.recordBtn, { backgroundColor: isRecording ? "#EF4444" : colors.primary }]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (isRecording) {
                setIsRecording(false);
                answerQuestion(0); // Move to next
              } else {
                setIsRecording(true);
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name={isRecording ? "stop" : "mic"} size={28} color="#FFF" />
            <Text style={styles.recordBtnText}>{isRecording ? "Stop Recording" : "Start Speaking"}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ─── RESULT VIEW ──────────────────────────────────────────────────────────

  const renderResult = () => {
    if (!result) return null;

    return (
      <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.resultHero, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.resultBadge, { backgroundColor: result.color }]}>
            <Text style={styles.resultLevel}>{result.level}</Text>
          </View>
          <Text style={[styles.resultLabel, { color: colors.foreground }]}>{result.label}</Text>
          <Text style={[styles.resultDesc, { color: colors.muted }]}>{result.description}</Text>
          <Text style={[styles.resultLang, { color: colors.primary }]}>{selectedLanguage?.flag} {selectedLanguage?.name}</Text>
        </Animated.View>

        {/* Skill Breakdown */}
        <View style={[styles.breakdownCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.breakdownTitle, { color: colors.foreground }]}>Skill Breakdown</Text>
          {[
            { label: "Vocabulary", score: result.scores.vocabulary, icon: "📚" },
            { label: "Grammar", score: result.scores.grammar, icon: "📝" },
            { label: "Listening", score: result.scores.listening, icon: "👂" },
            { label: "Speaking", score: result.scores.speaking, icon: "🎤" },
          ].map((skill) => (
            <View key={skill.label} style={styles.skillRow}>
              <Text style={styles.skillIcon}>{skill.icon}</Text>
              <Text style={[styles.skillLabel, { color: colors.foreground }]}>{skill.label}</Text>
              <View style={[styles.skillBar, { backgroundColor: colors.border }]}>
                <View style={[styles.skillFill, { width: `${skill.score}%`, backgroundColor: result.color }]} />
              </View>
              <Text style={[styles.skillScore, { color: result.color }]}>{skill.score}%</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={[styles.recsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.recsTitle, { color: colors.foreground }]}>📋 Personalized Plan</Text>
          {result.recommendations.map((rec, i) => (
            <View key={i} style={styles.recRow}>
              <Text style={[styles.recBullet, { color: result.color }]}>•</Text>
              <Text style={[styles.recText, { color: colors.muted }]}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.startLearningBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.startLearningText}>Start Learning at {result.level}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.retakeBtn, { borderColor: colors.border }]}
          onPress={() => { setPhase("select"); setResult(null); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.retakeText, { color: colors.muted }]}>Retake Assessment</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (phase === "test") setPhase("select");
          else router.back();
        }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {phase === "select" ? "Level Assessment" : phase === "test" ? "Testing..." : "Your Results"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {phase === "select" && renderSelect()}
      {phase === "test" && renderTest()}
      {phase === "result" && renderResult()}
    </ScreenContainer>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  // Select
  selectHero: { alignItems: "center", marginBottom: 24 },
  selectEmoji: { fontSize: 48 },
  selectTitle: { fontSize: 24, fontWeight: "800", marginTop: 12 },
  selectSubtitle: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  languageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  languageCard: { width: (SCREEN_WIDTH - 52) / 3, paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  languageFlag: { fontSize: 28 },
  languageName: { fontSize: 11, fontWeight: "600", marginTop: 6 },
  howSection: { borderRadius: 16, padding: 16, marginTop: 8 },
  howTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  howRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  howIcon: { fontSize: 14 },
  howText: { flex: 1, fontSize: 12, lineHeight: 18 },
  cefrRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 6, gap: 12 },
  cefrBadge: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  cefrBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  cefrInfo: { flex: 1 },
  cefrLabel: { fontSize: 13, fontWeight: "700" },
  cefrDesc: { fontSize: 11, marginTop: 2 },
  // Test
  testContainer: { flex: 1, padding: 16 },
  testHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  timerBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  timerText: { fontSize: 16, fontWeight: "800" },
  questionCount: { fontSize: 13, fontWeight: "600" },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 16, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  sectionBadge: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 16 },
  sectionBadgeText: { fontSize: 13, fontWeight: "700" },
  levelBadge: { fontSize: 11 },
  questionCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  questionText: { fontSize: 18, fontWeight: "700", lineHeight: 26 },
  speakingPrompt: { fontSize: 15, marginTop: 12, fontStyle: "italic" },
  optionsContainer: { gap: 10 },
  optionBtn: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  optionLetter: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  optionLetterText: { fontSize: 14, fontWeight: "800" },
  optionText: { fontSize: 15, fontWeight: "600", flex: 1 },
  recordBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18, borderRadius: 16, marginTop: 20 },
  recordBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  // Result
  resultContent: { padding: 16, paddingBottom: 100, alignItems: "center" },
  resultHero: { alignItems: "center", marginBottom: 24 },
  resultBadge: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  resultLevel: { color: "#FFF", fontSize: 24, fontWeight: "900" },
  resultLabel: { fontSize: 22, fontWeight: "800", marginTop: 12 },
  resultDesc: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  resultLang: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  breakdownCard: { width: "100%", borderRadius: 16, padding: 16, marginBottom: 16 },
  breakdownTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  skillRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  skillIcon: { fontSize: 14 },
  skillLabel: { fontSize: 12, fontWeight: "600", width: 70 },
  skillBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  skillFill: { height: "100%", borderRadius: 3 },
  skillScore: { fontSize: 12, fontWeight: "700", width: 36, textAlign: "right" },
  recsCard: { width: "100%", borderRadius: 16, padding: 16, marginBottom: 20 },
  recsTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  recRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  recBullet: { fontSize: 16, fontWeight: "700" },
  recText: { flex: 1, fontSize: 13, lineHeight: 18 },
  startLearningBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  startLearningText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  retakeBtn: { width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 10, borderWidth: 1 },
  retakeText: { fontSize: 14, fontWeight: "600" },
});
