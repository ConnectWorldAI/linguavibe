import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface BlankItem {
  beforeText: string;
  afterText: string;
  correctAnswer: string;
  hint: string;
  pronunciation: string;
}

interface Props {
  title: string;
  scenario: string;
  character: { name: string; role: string; emoji: string };
  blanks: BlankItem[];
  vocabularyLearned: { word: string; pronunciation: string; meaning: string }[];
  onComplete: (correct: number, total: number) => void;
}

export function FillOrderExercise({ title, scenario, character, blanks, vocabularyLearned, onComplete }: Props) {
  const [answers, setAnswers] = useState<string[]>(blanks.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const handleSubmit = () => {
    const res = blanks.map((blank, i) =>
      answers[i].trim().toLowerCase() === blank.correctAnswer.toLowerCase()
    );
    setResults(res);
    setSubmitted(true);
    const correct = res.filter(Boolean).length;
    if (Platform.OS !== "web") {
      if (correct === blanks.length) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const correctCount = results.filter(Boolean).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{character.emoji}</Text>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerScenario}>{scenario}</Text>
      </View>

      <View style={styles.orderCard}>
        {blanks.map((blank, index) => (
          <View key={index} style={styles.blankRow}>
            <Text style={styles.blankText}>
              {blank.beforeText}
              {submitted ? (
                <Text style={results[index] ? styles.correctWord : styles.wrongWord}>
                  {" "}{answers[index] || "___"}{" "}
                </Text>
              ) : null}
              {blank.afterText}
            </Text>
            {!submitted && (
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={answers[index]}
                  onChangeText={(text) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = text;
                    setAnswers(newAnswers);
                  }}
                  placeholder={blank.hint}
                  placeholderTextColor="#687076"
                  autoCapitalize="none"
                  returnKeyType="done"
                />
              </View>
            )}
            {submitted && !results[index] && (
              <Text style={styles.correction}>
                Correct: {blank.correctAnswer} ({blank.pronunciation})
              </Text>
            )}
          </View>
        ))}
      </View>

      {!submitted && (
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.8 }, answers.some(a => !a.trim()) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={answers.some(a => !a.trim())}
        >
          <Text style={styles.submitBtnText}>Check Order</Text>
        </Pressable>
      )}

      {submitted && (
        <View style={styles.resultSection}>
          <Text style={styles.resultText}>{correctCount}/{blanks.length} correct!</Text>
          <View style={styles.vocabSection}>
            {vocabularyLearned.map((v, i) => (
              <View key={i} style={styles.vocabRow}>
                <Text style={styles.vocabWord}>{v.word}</Text>
                <Text style={styles.vocabPron}>{v.pronunciation}</Text>
                <Text style={styles.vocabMeaning}>{v.meaning}</Text>
              </View>
            ))}
          </View>
          <Pressable style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.8 }]} onPress={() => onComplete(correctCount, blanks.length)}>
            <Text style={styles.continueBtnText}>Continue</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { alignItems: "center", marginBottom: 16 },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#ECEDEE" },
  headerScenario: { fontSize: 13, color: "#9BA1A6", textAlign: "center", marginTop: 4 },
  orderCard: { backgroundColor: "#1a2234", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#334155" },
  blankRow: { marginBottom: 16 },
  blankText: { fontSize: 16, color: "#ECEDEE", lineHeight: 24 },
  inputRow: { marginTop: 8 },
  input: { backgroundColor: "#0d1b2a", borderRadius: 8, padding: 12, color: "#ECEDEE", fontSize: 16, borderWidth: 1, borderColor: "#00AAFF" },
  correctWord: { color: "#22C55E", fontWeight: "700" },
  wrongWord: { color: "#EF4444", fontWeight: "700", textDecorationLine: "line-through" },
  correction: { fontSize: 13, color: "#22C55E", marginTop: 4 },
  submitBtn: { backgroundColor: "#00AAFF", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  resultSection: { marginTop: 16 },
  resultText: { fontSize: 18, fontWeight: "700", color: "#ECEDEE", textAlign: "center", marginBottom: 16 },
  vocabSection: { marginBottom: 16 },
  vocabRow: { backgroundColor: "#0d1b2a", borderRadius: 10, padding: 12, marginBottom: 8 },
  vocabWord: { fontSize: 16, fontWeight: "600", color: "#00AAFF" },
  vocabPron: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  vocabMeaning: { fontSize: 14, color: "#ECEDEE", marginTop: 4 },
  continueBtn: { backgroundColor: "#00AAFF", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  continueBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
