import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Grammar Comparison Exercise
 * Whiteboard-style side-by-side bilingual grammar explanation.
 * Inspired by real teacher whiteboard lessons (e.g., Uberlandy Martinez).
 * 
 * Shows:
 * 1. Side-by-side grammar table (e.g., Subject Pronouns in English vs Spanish)
 * 2. Word order comparison with visual highlighting
 * 3. Example sentences broken down word-by-word with pronunciation
 * 4. Quick quiz to verify understanding
 */

interface GrammarRow {
  native: string;        // Word in native/known language (e.g., "I")
  target: string;        // Word in target language (e.g., "Yo")
  pronunciation: string; // Phonetic guide (e.g., "/yoh/")
  note?: string;         // Optional note (e.g., "formal" for Usted)
}

interface ConjugationEntry {
  pronoun: string;       // e.g., "yo", "tú", "él/ella"
  present: string;       // e.g., "hablo"
  past: string;          // e.g., "hablé"
  future: string;        // e.g., "hablaré"
  presentPron: string;   // pronunciation for present
  pastPron: string;      // pronunciation for past
  futurePron: string;    // pronunciation for future
}

interface ConjugationTable {
  verb: string;          // e.g., "hablar" (to speak)
  verbMeaning: string;   // e.g., "to speak"
  entries: ConjugationEntry[];
}

interface WordOrderExample {
  nativeSentence: string;       // "They called them"
  targetSentence: string;       // "Los llamaron"
  nativeBreakdown: string[];    // ["They", "called", "them"]
  targetBreakdown: string[];    // ["Los", "llamaron"]
  pronunciationBreakdown: string[]; // ["/lohs/", "/yah-MAH-rohn/"]
  orderNote: string;            // "In Spanish, the object pronoun comes BEFORE the verb"
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Props {
  title: string;
  scenario: string;
  character: { name: string; role: string; emoji: string };
  grammarTopic: string;         // e.g., "Subject Pronouns vs Object Pronouns"
  nativeLanguage: string;       // e.g., "English"
  targetLanguage: string;       // e.g., "Spanish"
  grammarTable: GrammarRow[];   // Side-by-side comparison table
  wordOrderExamples: WordOrderExample[]; // Sentence structure comparisons
  quiz: QuizQuestion[];         // Quick comprehension check
  keyRule: string;              // The main grammar rule being taught
  conjugationTable?: ConjugationTable; // Optional conjugation variant
  vocabularyLearned: { word: string; pronunciation: string; meaning: string }[];
  onComplete: (correct: number, total: number) => void;
  onSaveToNotebook?: (data: GrammarNotebookEntry) => void; // Save table to notebook
  onPlayAudio?: (text: string, language: string) => void;  // Tap to hear pronunciation
}

// Exported type for grammar notebook
export interface GrammarNotebookEntry {
  id: string;
  grammarTopic: string;
  nativeLanguage: string;
  targetLanguage: string;
  grammarTable: GrammarRow[];
  conjugationTable?: ConjugationTable;
  keyRule: string;
  savedAt: number;
}

export function GrammarComparisonExercise({
  title,
  scenario,
  character,
  grammarTopic,
  nativeLanguage,
  targetLanguage,
  grammarTable,
  wordOrderExamples,
  quiz,
  keyRule,
  conjugationTable,
  vocabularyLearned,
  onComplete,
  onSaveToNotebook,
  onPlayAudio,
}: Props) {
  const [phase, setPhase] = useState<"table" | "conjugation" | "examples" | "quiz" | "results">(conjugationTable ? "conjugation" : "table");
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (onSaveToNotebook) {
      onSaveToNotebook({
        id: `${grammarTopic}-${Date.now()}`,
        grammarTopic,
        nativeLanguage,
        targetLanguage,
        grammarTable,
        conjugationTable,
        keyRule,
        savedAt: Date.now(),
      });
      setSaved(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handlePlayRow = (text: string) => {
    if (onPlayAudio) {
      onPlayAudio(text, targetLanguage);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleQuizAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    const correct = index === quiz[quizIndex].correctIndex;
    if (correct) {
      setQuizCorrect((c) => c + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleQuizNext = () => {
    if (quizIndex < quiz.length - 1) {
      setQuizIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setPhase("results");
    }
  };

  // Conjugation Table Phase
  if (phase === "conjugation" && conjugationTable) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{character.emoji}</Text>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerScenario}>{scenario}</Text>
        </View>

        {/* Verb Banner */}
        <View style={styles.topicBanner}>
          <Text style={styles.topicIcon}>📝</Text>
          <Text style={styles.topicText}>{conjugationTable.verb} — {conjugationTable.verbMeaning}</Text>
        </View>

        {/* Key Rule */}
        <View style={styles.ruleCard}>
          <Text style={styles.ruleIcon}>💡</Text>
          <Text style={styles.ruleText}>{keyRule}</Text>
        </View>

        {/* Conjugation Table */}
        <View style={styles.tableCard}>
          {/* Header Row */}
          <View style={styles.conjHeaderRow}>
            <View style={styles.conjCellPronoun}>
              <Text style={styles.conjHeaderText}>Pronoun</Text>
            </View>
            <View style={styles.conjCellTense}>
              <Text style={styles.conjHeaderText}>Present</Text>
            </View>
            <View style={styles.conjCellTense}>
              <Text style={styles.conjHeaderText}>Past</Text>
            </View>
            <View style={styles.conjCellTense}>
              <Text style={styles.conjHeaderText}>Future</Text>
            </View>
          </View>

          {/* Conjugation Rows */}
          {conjugationTable.entries.map((entry, index) => (
            <View key={index} style={[styles.conjRow, index % 2 === 0 && styles.tableRowEven]}>
              <View style={styles.conjCellPronoun}>
                <Text style={styles.conjPronounText}>{entry.pronoun}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.conjCellTense, pressed && { opacity: 0.6 }]}
                onPress={() => handlePlayRow(entry.present)}
              >
                <Text style={styles.conjVerbText}>{entry.present}</Text>
                <Text style={styles.conjPronText}>{entry.presentPron}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.conjCellTense, pressed && { opacity: 0.6 }]}
                onPress={() => handlePlayRow(entry.past)}
              >
                <Text style={styles.conjVerbText}>{entry.past}</Text>
                <Text style={styles.conjPronText}>{entry.pastPron}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.conjCellTense, pressed && { opacity: 0.6 }]}
                onPress={() => handlePlayRow(entry.future)}
              >
                <Text style={styles.conjVerbText}>{entry.future}</Text>
                <Text style={styles.conjPronText}>{entry.futurePron}</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.tapHint}>Tap any cell to hear pronunciation 🔊</Text>

        {/* Save to Notebook */}
        {onSaveToNotebook && (
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }, saved && styles.saveBtnSaved]}
            onPress={handleSave}
            disabled={saved}
          >
            <Text style={styles.saveBtnText}>{saved ? "✓ Saved to Notebook" : "📓 Save to Notebook"}</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]}
          onPress={() => setPhase(grammarTable.length > 0 ? "table" : "examples")}
        >
          <Text style={styles.nextBtnText}>{grammarTable.length > 0 ? "See Grammar Table →" : "See Examples →"}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Phase 1: Grammar Table (whiteboard style)
  if (phase === "table") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{character.emoji}</Text>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerScenario}>{scenario}</Text>
        </View>

        {/* Grammar Topic Banner */}
        <View style={styles.topicBanner}>
          <Text style={styles.topicIcon}>📋</Text>
          <Text style={styles.topicText}>{grammarTopic}</Text>
        </View>

        {/* Key Rule */}
        <View style={styles.ruleCard}>
          <Text style={styles.ruleIcon}>💡</Text>
          <Text style={styles.ruleText}>{keyRule}</Text>
        </View>

        {/* Side-by-side Table */}
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <View style={[styles.tableCell, styles.tableCellLeft]}>
              <Text style={styles.tableHeaderText}>{nativeLanguage}</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellRight]}>
              <Text style={styles.tableHeaderText}>{targetLanguage}</Text>
            </View>
          </View>

          {/* Table Rows — tap to hear */}
          {grammarTable.map((row, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [styles.tableRow, index % 2 === 0 && styles.tableRowEven, pressed && { opacity: 0.7 }]}
              onPress={() => handlePlayRow(row.target)}
            >
              <View style={[styles.tableCell, styles.tableCellLeft]}>
                <Text style={styles.nativeWord}>{row.native}</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellRight]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.targetWord}>{row.target}</Text>
                  {onPlayAudio && <Text style={{ fontSize: 12 }}>🔊</Text>}
                </View>
                <Text style={styles.pronunciationText}>{row.pronunciation}</Text>
                {row.note && <Text style={styles.noteText}>{row.note}</Text>}
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.tapHint}>Tap any row to hear pronunciation 🔊</Text>

        {/* Save to Notebook */}
        {onSaveToNotebook && (
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }, saved && styles.saveBtnSaved]}
            onPress={handleSave}
            disabled={saved}
          >
            <Text style={styles.saveBtnText}>{saved ? "✓ Saved to Notebook" : "📓 Save to Notebook"}</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]}
          onPress={() => setPhase("examples")}
        >
          <Text style={styles.nextBtnText}>See Examples →</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Phase 2: Word Order Examples
  if (phase === "examples") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{character.emoji}</Text>
          <Text style={styles.headerTitle}>Word Order Comparison</Text>
          <Text style={styles.headerScenario}>See how sentence structure differs</Text>
        </View>

        {wordOrderExamples.map((example, exIndex) => (
          <View key={exIndex} style={styles.exampleCard}>
            {/* Native sentence */}
            <View style={styles.sentenceRow}>
              <Text style={styles.langLabel}>{nativeLanguage}:</Text>
              <Text style={styles.sentenceText}>{example.nativeSentence}</Text>
            </View>

            {/* Target sentence */}
            <View style={styles.sentenceRow}>
              <Text style={styles.langLabelTarget}>{targetLanguage}:</Text>
              <Text style={styles.sentenceTextTarget}>{example.targetSentence}</Text>
            </View>

            {/* Word-by-word breakdown */}
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Word-by-Word:</Text>
              <View style={styles.breakdownGrid}>
                {example.targetBreakdown.map((word, wIndex) => (
                  <View key={wIndex} style={styles.breakdownItem}>
                    <Text style={styles.breakdownWord}>{word}</Text>
                    <Text style={styles.breakdownPron}>{example.pronunciationBreakdown[wIndex]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Order Note */}
            <View style={styles.orderNoteBox}>
              <Text style={styles.orderNoteIcon}>⚡</Text>
              <Text style={styles.orderNoteText}>{example.orderNote}</Text>
            </View>
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]}
          onPress={() => setPhase("quiz")}
        >
          <Text style={styles.nextBtnText}>Test Your Understanding →</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Phase 3: Quiz
  if (phase === "quiz") {
    const q = quiz[quizIndex];
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🧠</Text>
          <Text style={styles.headerTitle}>Quick Check</Text>
          <Text style={styles.headerScenario}>Question {quizIndex + 1} of {quiz.length}</Text>
        </View>

        <View style={styles.quizCard}>
          <Text style={styles.quizQuestion}>{q.question}</Text>

          {q.options.map((option, oIndex) => {
            const isSelected = selectedAnswer === oIndex;
            const isCorrect = oIndex === q.correctIndex;
            const showResult = selectedAnswer !== null;

            return (
              <Pressable
                key={oIndex}
                style={({ pressed }) => [
                  styles.quizOption,
                  pressed && !showResult && { opacity: 0.8 },
                  showResult && isCorrect && styles.quizOptionCorrect,
                  showResult && isSelected && !isCorrect && styles.quizOptionWrong,
                ]}
                onPress={() => handleQuizAnswer(oIndex)}
                disabled={selectedAnswer !== null}
              >
                <Text style={[
                  styles.quizOptionText,
                  showResult && isCorrect && styles.quizOptionTextCorrect,
                  showResult && isSelected && !isCorrect && styles.quizOptionTextWrong,
                ]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}

          {showExplanation && (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationText}>{q.explanation}</Text>
            </View>
          )}
        </View>

        {selectedAnswer !== null && (
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]}
            onPress={handleQuizNext}
          >
            <Text style={styles.nextBtnText}>
              {quizIndex < quiz.length - 1 ? "Next Question →" : "See Results →"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    );
  }

  // Phase 4: Results
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🎓</Text>
        <Text style={styles.headerTitle}>Grammar Mastered!</Text>
        <Text style={styles.headerScenario}>
          {quizCorrect}/{quiz.length} correct — {grammarTopic}
        </Text>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultScore}>{Math.round((quizCorrect / quiz.length) * 100)}%</Text>
        <Text style={styles.resultLabel}>Comprehension</Text>
      </View>

      {/* Vocabulary Summary */}
      <View style={styles.vocabSection}>
        <Text style={styles.vocabTitle}>Key Vocabulary</Text>
        {vocabularyLearned.map((v, i) => (
          <View key={i} style={styles.vocabRow}>
            <Text style={styles.vocabWord}>{v.word}</Text>
            <Text style={styles.vocabPron}>{v.pronunciation}</Text>
            <Text style={styles.vocabMeaning}>{v.meaning}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]}
        onPress={() => onComplete(quizCorrect, quiz.length)}
      >
        <Text style={styles.nextBtnText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { alignItems: "center", marginBottom: 16 },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#ECEDEE" },
  headerScenario: { fontSize: 13, color: "#9BA1A6", textAlign: "center", marginTop: 4 },

  // Topic Banner
  topicBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: "rgba(0, 170, 255, 0.1)", borderRadius: 10 },
  topicIcon: { fontSize: 18 },
  topicText: { fontSize: 15, fontWeight: "700", color: "#00AAFF" },

  // Key Rule
  ruleCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#1a2234", borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: "#FBBF24" },
  ruleIcon: { fontSize: 18 },
  ruleText: { fontSize: 14, color: "#FBBF24", flex: 1, lineHeight: 20, fontWeight: "600" },

  // Grammar Table
  tableCard: { backgroundColor: "#0d1b2a", borderRadius: 16, overflow: "hidden", marginBottom: 20, borderWidth: 1, borderColor: "#334155" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#1e3a5f" },
  tableRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#1e2d3d" },
  tableRowEven: { backgroundColor: "rgba(0, 170, 255, 0.03)" },
  tableCell: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  tableCellLeft: { borderRightWidth: 1, borderRightColor: "#1e2d3d" },
  tableCellRight: {},
  tableHeaderText: { fontSize: 13, fontWeight: "800", color: "#00AAFF", textTransform: "uppercase", letterSpacing: 0.5 },
  nativeWord: { fontSize: 16, fontWeight: "600", color: "#ECEDEE" },
  targetWord: { fontSize: 16, fontWeight: "700", color: "#4ADE80" },
  pronunciationText: { fontSize: 12, color: "#9BA1A6", marginTop: 2, fontStyle: "italic" },
  noteText: { fontSize: 11, color: "#FBBF24", marginTop: 2, fontWeight: "500" },

  // Word Order Examples
  exampleCard: { backgroundColor: "#1a2234", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#334155" },
  sentenceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  langLabel: { fontSize: 11, fontWeight: "700", color: "#9BA1A6", width: 60, textTransform: "uppercase" },
  langLabelTarget: { fontSize: 11, fontWeight: "700", color: "#00AAFF", width: 60, textTransform: "uppercase" },
  sentenceText: { fontSize: 16, color: "#ECEDEE", fontWeight: "500" },
  sentenceTextTarget: { fontSize: 16, color: "#4ADE80", fontWeight: "700" },
  breakdownSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#1e2d3d" },
  breakdownTitle: { fontSize: 12, fontWeight: "700", color: "#9BA1A6", marginBottom: 8, textTransform: "uppercase" },
  breakdownGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  breakdownItem: { backgroundColor: "#0d1b2a", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, alignItems: "center", borderWidth: 1, borderColor: "#00AAFF40" },
  breakdownWord: { fontSize: 14, fontWeight: "700", color: "#4ADE80" },
  breakdownPron: { fontSize: 11, color: "#9BA1A6", marginTop: 2 },
  orderNoteBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 12, backgroundColor: "rgba(251, 191, 36, 0.08)", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "rgba(251, 191, 36, 0.2)" },
  orderNoteIcon: { fontSize: 14 },
  orderNoteText: { fontSize: 13, color: "#FBBF24", flex: 1, lineHeight: 18, fontWeight: "600" },

  // Quiz
  quizCard: { backgroundColor: "#1a2234", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#334155" },
  quizQuestion: { fontSize: 16, fontWeight: "700", color: "#ECEDEE", marginBottom: 16, lineHeight: 22 },
  quizOption: { backgroundColor: "#0d1b2a", borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: "#334155" },
  quizOptionCorrect: { borderColor: "#22C55E", backgroundColor: "rgba(34, 197, 94, 0.1)" },
  quizOptionWrong: { borderColor: "#EF4444", backgroundColor: "rgba(239, 68, 68, 0.1)" },
  quizOptionText: { fontSize: 15, color: "#ECEDEE", fontWeight: "500" },
  quizOptionTextCorrect: { color: "#22C55E", fontWeight: "700" },
  quizOptionTextWrong: { color: "#EF4444", fontWeight: "700" },
  explanationBox: { backgroundColor: "rgba(0, 170, 255, 0.08)", borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: "rgba(0, 170, 255, 0.2)" },
  explanationText: { fontSize: 13, color: "#00AAFF", lineHeight: 18 },

  // Results
  resultCard: { alignItems: "center", backgroundColor: "#1a2234", borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: "#334155" },
  resultScore: { fontSize: 48, fontWeight: "800", color: "#4ADE80" },
  resultLabel: { fontSize: 14, color: "#9BA1A6", marginTop: 4 },

  // Vocabulary
  vocabSection: { marginBottom: 20 },
  vocabTitle: { fontSize: 14, fontWeight: "700", color: "#9BA1A6", marginBottom: 10, textTransform: "uppercase" },
  vocabRow: { backgroundColor: "#0d1b2a", borderRadius: 10, padding: 12, marginBottom: 8 },
  vocabWord: { fontSize: 16, fontWeight: "600", color: "#00AAFF" },
  vocabPron: { fontSize: 12, color: "#9BA1A6", marginTop: 2, fontStyle: "italic" },
  vocabMeaning: { fontSize: 14, color: "#ECEDEE", marginTop: 4 },

  // Conjugation Table
  conjHeaderRow: { flexDirection: "row", backgroundColor: "#1e3a5f" },
  conjRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#1e2d3d" },
  conjCellPronoun: { width: 70, paddingVertical: 10, paddingHorizontal: 8, justifyContent: "center", borderRightWidth: 1, borderRightColor: "#1e2d3d" },
  conjCellTense: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: "center", borderRightWidth: 1, borderRightColor: "#1e2d3d" },
  conjHeaderText: { fontSize: 11, fontWeight: "800", color: "#00AAFF", textTransform: "uppercase", textAlign: "center" },
  conjPronounText: { fontSize: 13, fontWeight: "700", color: "#ECEDEE" },
  conjVerbText: { fontSize: 14, fontWeight: "700", color: "#4ADE80", textAlign: "center" },
  conjPronText: { fontSize: 10, color: "#9BA1A6", marginTop: 2, fontStyle: "italic", textAlign: "center" },

  // Tap Hint
  tapHint: { fontSize: 12, color: "#9BA1A6", textAlign: "center", marginTop: 8, marginBottom: 8, fontStyle: "italic" },

  // Save Button
  saveBtn: { backgroundColor: "#1a2234", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: "#334155" },
  saveBtnSaved: { borderColor: "#22C55E", backgroundColor: "rgba(34, 197, 94, 0.08)" },
  saveBtnText: { fontSize: 14, fontWeight: "600", color: "#ECEDEE" },

  // Buttons
  nextBtn: { backgroundColor: "#00AAFF", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
