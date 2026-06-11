import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const LESSON = {
  title: "Ordering Food Like a Local",
  language: "Dominican Spanish",
  level: "Beginner",
  duration: "15 min",
  xp: 120,
  sections: [
    {
      type: "vocab",
      title: "Key Vocabulary",
      items: [
        { word: "La comida", translation: "The food", gender: "feminine", audio: true },
        { word: "El plato", translation: "The plate/dish", gender: "masculine", audio: true },
        { word: "Mangú", translation: "Mashed plantains (Dominican)", gender: "masculine", audio: true },
        { word: "Los tostones", translation: "Fried plantain slices", gender: "masculine", audio: true },
        { word: "La habichuela", translation: "Beans", gender: "feminine", audio: true },
        { word: "El moro", translation: "Rice and beans mixed (Dominican)", gender: "masculine", audio: true },
      ],
    },
    {
      type: "grammar",
      title: "Grammar Focus: Ordering",
      rules: [
        {
          rule: "Quiero + noun",
          explanation: "Use 'quiero' (I want) + the item to order directly",
          example: "Quiero un moro con pollo",
          translation: "I want rice and beans with chicken",
        },
        {
          rule: "Dame + noun",
          explanation: "Informal: 'Dame' (give me) is common in Dominican restaurants",
          example: "Dame un jugo de chinola",
          translation: "Give me a passion fruit juice",
        },
        {
          rule: "¿Tienen + noun?",
          explanation: "Ask if they have something: '¿Tienen...?'",
          example: "¿Tienen tostones?",
          translation: "Do you have fried plantains?",
        },
      ],
    },
    {
      type: "slang",
      title: "Dominican Slang",
      items: [
        { slang: "¡Tá bueno!", meaning: "It's good! / That's enough!", context: "Approving food or saying you're full" },
        { slang: "Vaina", meaning: "Thing (can mean anything)", context: "Dame esa vaina = Give me that thing" },
        { slang: "Colmado", meaning: "Corner store / small grocery", context: "Where locals buy snacks and drinks" },
        { slang: "Chin", meaning: "A little bit", context: "Un chin de arroz = A little bit of rice" },
      ],
    },
  ],
};

const QUIZ_QUESTIONS = [
  {
    id: "1",
    question: "How do you say 'I want rice and beans' in Dominican Spanish?",
    options: ["Quiero un moro", "Dame la comida", "Tengo hambre", "¿Tienen arroz?"],
    correct: 0,
  },
  {
    id: "2",
    question: "What does 'colmado' mean?",
    options: ["Restaurant", "Corner store", "Kitchen", "Market"],
    correct: 1,
  },
  {
    id: "3",
    question: "'La habichuela' is:",
    options: ["Masculine", "Feminine", "Neutral", "Plural"],
    correct: 1,
  },
];

export default function LessonDetailScreen() {
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const renderVocab = (section: typeof LESSON.sections[0]) => (
    <View style={styles.sectionContent}>
      {(section as any).items.map((item: any, index: number) => (
        <View key={index} style={styles.vocabCard}>
          <View style={styles.vocabLeft}>
            <Text style={styles.vocabWord}>{item.word}</Text>
            <Text style={styles.vocabTranslation}>{item.translation}</Text>
            {item.gender && (
              <View style={[
                styles.genderBadge,
                item.gender === "feminine" ? styles.genderFeminine : styles.genderMasculine,
              ]}>
                <Text style={styles.genderText}>{item.gender}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.audioButton}>
            <Ionicons name="volume-high" size={18} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderGrammar = (section: typeof LESSON.sections[0]) => (
    <View style={styles.sectionContent}>
      {(section as any).rules.map((rule: any, index: number) => (
        <View key={index} style={styles.grammarCard}>
          <View style={styles.grammarRuleHeader}>
            <Text style={styles.grammarRule}>{rule.rule}</Text>
          </View>
          <Text style={styles.grammarExplanation}>{rule.explanation}</Text>
          <View style={styles.grammarExample}>
            <Text style={styles.grammarExampleText}>"{rule.example}"</Text>
            <Text style={styles.grammarExampleTranslation}>{rule.translation}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSlang = (section: typeof LESSON.sections[0]) => (
    <View style={styles.sectionContent}>
      {(section as any).items.map((item: any, index: number) => (
        <View key={index} style={styles.slangCard}>
          <Text style={styles.slangWord}>{item.slang}</Text>
          <Text style={styles.slangMeaning}>{item.meaning}</Text>
          <View style={styles.slangContext}>
            <Ionicons name="chatbubble-ellipses" size={12} color={Colors.textSecondary} />
            <Text style={styles.slangContextText}>{item.context}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderQuiz = () => (
    <View style={styles.sectionContent}>
      <Text style={styles.quizTitle}>Quick Quiz</Text>
      <Text style={styles.quizSubtitle}>Test what you just learned!</Text>

      {QUIZ_QUESTIONS.map((q) => (
        <View key={q.id} style={styles.quizQuestion}>
          <Text style={styles.questionText}>{q.question}</Text>
          {q.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswers[q.id] === index && styles.optionSelected,
                quizSubmitted && index === q.correct && styles.optionCorrect,
                quizSubmitted && selectedAnswers[q.id] === index && index !== q.correct && styles.optionWrong,
              ]}
              onPress={() => {
                if (!quizSubmitted) {
                  setSelectedAnswers({ ...selectedAnswers, [q.id]: index });
                }
              }}
            >
              <Text style={[
                styles.optionText,
                selectedAnswers[q.id] === index && styles.optionTextSelected,
              ]}>
                {option}
              </Text>
              {quizSubmitted && index === q.correct && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              )}
              {quizSubmitted && selectedAnswers[q.id] === index && index !== q.correct && (
                <Ionicons name="close-circle" size={18} color={Colors.error} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {!quizSubmitted ? (
        <TouchableOpacity
          style={[
            styles.submitQuiz,
            Object.keys(selectedAnswers).length < QUIZ_QUESTIONS.length && styles.submitQuizDisabled,
          ]}
          onPress={() => setQuizSubmitted(true)}
        >
          <Text style={styles.submitQuizText}>Submit Answers</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.quizResult}>
          <Text style={styles.quizResultEmoji}>🎉</Text>
          <Text style={styles.quizResultTitle}>
            {Object.entries(selectedAnswers).filter(([id, ans]) =>
              QUIZ_QUESTIONS.find(q => q.id === id)?.correct === ans
            ).length}/{QUIZ_QUESTIONS.length} Correct!
          </Text>
          <Text style={styles.quizResultXp}>+{LESSON.xp} XP earned</Text>
        </View>
      )}
    </View>
  );

  const section = LESSON.sections[currentSection];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{LESSON.title}</Text>
          <Text style={styles.headerSubtitle}>
            {LESSON.language} • {LESSON.level}
          </Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{LESSON.xp} XP</Text>
        </View>
      </View>

      {/* Progress Tabs */}
      <View style={styles.progressTabs}>
        {LESSON.sections.map((s, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.progressTab,
              currentSection === index && styles.progressTabActive,
              showQuiz && styles.progressTab,
            ]}
            onPress={() => { setShowQuiz(false); setCurrentSection(index); }}
          >
            <Text style={[
              styles.progressTabText,
              currentSection === index && !showQuiz && styles.progressTabTextActive,
            ]}>
              {s.type === "vocab" ? "📝" : s.type === "grammar" ? "📐" : "🔥"}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.progressTab, showQuiz && styles.progressTabActive]}
          onPress={() => setShowQuiz(true)}
        >
          <Text style={[styles.progressTabText, showQuiz && styles.progressTabTextActive]}>
            ✅
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {!showQuiz && (
          <>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.type === "vocab" && renderVocab(section)}
            {section.type === "grammar" && renderGrammar(section)}
            {section.type === "slang" && renderSlang(section)}
          </>
        )}
        {showQuiz && renderQuiz()}

        {/* Pronunciation Practice Section */}
        {!showQuiz && section.type === "vocab" && (
          <View style={styles.pronunciationSection}>
            <View style={styles.pronunciationHeader}>
              <Ionicons name="mic" size={20} color={Colors.accent} />
              <Text style={styles.pronunciationTitle}>Pronunciation Practice</Text>
            </View>
            <Text style={styles.pronunciationSubtitle}>
              Tap a word, then say it out loud. Your teacher will correct you.
            </Text>
            <View style={styles.pronunciationDemo}>
              <View style={styles.pronunciationWord}>
                <Text style={styles.pronunciationWordText}>Mangú</Text>
                <Text style={styles.pronunciationPhonetic}>mahn-GOO</Text>
              </View>
              <View style={styles.pronunciationFeedback}>
                <View style={styles.feedbackRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.feedbackText}>Good! You got the stress on the right syllable.</Text>
                </View>
              </View>
              <View style={styles.pronunciationWord}>
                <Text style={styles.pronunciationWordText}>Habichuela</Text>
                <Text style={styles.pronunciationPhonetic}>ah-bee-CHWAY-lah</Text>
              </View>
              <View style={styles.pronunciationFeedback}>
                <View style={styles.feedbackRow}>
                  <Ionicons name="alert-circle" size={16} color={Colors.warning} />
                  <Text style={styles.feedbackText}>Almost! The 'ch' is softer — like "chw" not "ch". Try: ah-bee-CHWAY-lah</Text>
                </View>
                <TouchableOpacity style={styles.hearItButton}>
                  <Ionicons name="volume-high" size={14} color={Colors.textPrimary} />
                  <Text style={styles.hearItText}>Hear Sophia say it</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.tryAgainButton}>
                <Ionicons name="mic" size={18} color={Colors.textPrimary} />
                <Text style={styles.tryAgainText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navButtons}>
          {(currentSection > 0 || showQuiz) && (
            <TouchableOpacity
              style={styles.navButtonPrev}
              onPress={() => {
                if (showQuiz) { setShowQuiz(false); setCurrentSection(LESSON.sections.length - 1); }
                else setCurrentSection(currentSection - 1);
              }}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.textPrimary} />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          {!showQuiz && (
            <TouchableOpacity
              style={styles.navButtonNext}
              onPress={() => {
                if (currentSection < LESSON.sections.length - 1) setCurrentSection(currentSection + 1);
                else setShowQuiz(true);
              }}
            >
              <Text style={styles.navButtonText}>
                {currentSection === LESSON.sections.length - 1 ? "Take Quiz" : "Next"}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  xpBadge: {
    backgroundColor: Colors.warning + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  xpText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.warning },
  progressTabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  progressTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  progressTabActive: { backgroundColor: Colors.secondary },
  progressTabText: { fontSize: 16 },
  progressTabTextActive: {},
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionContent: { gap: Spacing.sm },
  vocabCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  vocabLeft: { flex: 1 },
  vocabWord: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  vocabTranslation: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  genderBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: 6,
  },
  genderFeminine: { backgroundColor: "#FF69B4" + "20" },
  genderMasculine: { backgroundColor: "#4169E1" + "20" },
  genderText: { fontSize: 10, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase" },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  grammarCard: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  grammarRuleHeader: { marginBottom: Spacing.sm },
  grammarRule: { fontSize: FontSize.md, fontWeight: "800", color: Colors.secondary },
  grammarExplanation: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  grammarExample: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  grammarExampleText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  grammarExampleTranslation: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, fontStyle: "italic" },
  slangCard: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  slangWord: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.warning },
  slangMeaning: { fontSize: FontSize.md, color: Colors.textPrimary, marginTop: 4 },
  slangContext: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  slangContextText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: "italic" },
  quizTitle: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary },
  quizSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  quizQuestion: { marginBottom: Spacing.lg },
  questionText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary, marginBottom: Spacing.sm },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  optionSelected: { borderColor: Colors.secondary },
  optionCorrect: { borderColor: Colors.success, backgroundColor: Colors.success + "10" },
  optionWrong: { borderColor: Colors.error, backgroundColor: Colors.error + "10" },
  optionText: { fontSize: FontSize.md, color: Colors.textPrimary },
  optionTextSelected: { fontWeight: "600" },
  submitQuiz: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  submitQuizDisabled: { opacity: 0.5 },
  submitQuizText: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary },
  quizResult: { alignItems: "center", padding: Spacing.xl },
  quizResultEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  quizResultTitle: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary },
  quizResultXp: { fontSize: FontSize.md, color: Colors.warning, fontWeight: "600", marginTop: 4 },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xl,
  },
  navButtonPrev: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  navButtonNext: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginLeft: "auto",
  },
  navButtonText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textPrimary },
  pronunciationSection: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  pronunciationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  pronunciationTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  pronunciationSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  pronunciationDemo: {
    gap: Spacing.md,
  },
  pronunciationWord: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  pronunciationWordText: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.secondary,
  },
  pronunciationPhonetic: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
  pronunciationFeedback: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  feedbackText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  hearItButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  hearItText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  tryAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: 8,
  },
  tryAgainText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});
