import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface Step {
  prompt: string;
  promptTranslation: string;
  pronunciation: string;
  options: string[];
  correctIndex: number;
  correctFeedback: string;
  wrongFeedback: string;
  culturalNote: string;
}

interface Props {
  title: string;
  scenario: string;
  character: { name: string; role: string; emoji: string };
  steps: Step[];
  vocabularyLearned: { word: string; pronunciation: string; meaning: string }[];
  onComplete: (correct: number, total: number) => void;
}

export function CulturalDiscoveryExercise({ title, scenario, character, steps, vocabularyLearned, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleSelect = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    const correct = index === step.correctIndex;
    setIsCorrect(correct);
    if (correct) {
      setCorrectCount((c) => c + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = () => {
    if (isLastStep) setShowSummary(true);
    else { setCurrentStep((s) => s + 1); setSelectedOption(null); setIsCorrect(null); }
  };

  if (showSummary) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.summaryTitle}>Cultural Discovery Complete!</Text>
        <View style={styles.vocabSection}>
          {vocabularyLearned.map((v, i) => (
            <View key={i} style={styles.vocabCard}>
              <Text style={styles.vocabWord}>{v.word}</Text>
              <Text style={styles.vocabPron}>{v.pronunciation}</Text>
              <Text style={styles.vocabMeaning}>{v.meaning}</Text>
            </View>
          ))}
        </View>
        <Pressable style={({ pressed }) => [styles.finishBtn, pressed && { opacity: 0.8 }]} onPress={() => onComplete(correctCount, steps.length)}>
          <Text style={styles.finishBtnText}>Continue</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.cultureHeader}>
        <Text style={styles.cultureIcon}>{character.emoji}</Text>
        <Text style={styles.cultureTitle}>{title}</Text>
      </View>
      {currentStep === 0 && (
        <View style={styles.scenarioCard}>
          <Text style={styles.scenarioText}>{scenario}</Text>
        </View>
      )}
      <View style={styles.discoveryCard}>
        <Text style={styles.discoveryPrompt}>{step.prompt}</Text>
        <Text style={styles.discoveryPron}>{step.pronunciation}</Text>
        <Text style={styles.discoveryTranslation}>{step.promptTranslation}</Text>
      </View>
      <View style={styles.optionsGrid}>
        {step.options.map((option, index) => {
          let cardStyle = styles.optionCard;
          if (selectedOption !== null) {
            if (index === step.correctIndex) cardStyle = styles.optionCardCorrect;
            else if (index === selectedOption && !isCorrect) cardStyle = styles.optionCardWrong;
          }
          return (
            <Pressable key={index} style={({ pressed }) => [cardStyle, pressed && selectedOption === null && { opacity: 0.8 }]} onPress={() => handleSelect(index)}>
              <Text style={styles.optionCardText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      {selectedOption !== null && (
        <View style={[styles.insightCard, isCorrect ? styles.insightCorrect : styles.insightWrong]}>
          <Text style={styles.insightText}>{isCorrect ? step.correctFeedback : step.wrongFeedback}</Text>
          {step.culturalNote ? (
            <View style={styles.culturalNoteBox}>
              <Text style={styles.culturalNoteLabel}>Cultural Insight</Text>
              <Text style={styles.culturalNoteText}>{step.culturalNote}</Text>
            </View>
          ) : null}
          <Pressable style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]} onPress={handleNext}>
            <Text style={styles.nextBtnText}>{isLastStep ? "See What You Learned" : "Discover More"}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  cultureHeader: { alignItems: "center", marginBottom: 16 },
  cultureIcon: { fontSize: 48, marginBottom: 8 },
  cultureTitle: { fontSize: 20, fontWeight: "700", color: "#ECEDEE", textAlign: "center" },
  scenarioCard: { backgroundColor: "#1a2234", borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#FFB800" },
  scenarioText: { fontSize: 14, color: "#ECEDEE", lineHeight: 20 },
  discoveryCard: { backgroundColor: "#0d1b2a", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#00AAFF" },
  discoveryPrompt: { fontSize: 18, fontWeight: "600", color: "#ECEDEE", marginBottom: 8 },
  discoveryPron: { fontSize: 14, color: "#00AAFF", marginBottom: 4 },
  discoveryTranslation: { fontSize: 13, color: "#9BA1A6" },
  optionsGrid: { gap: 10 },
  optionCard: { backgroundColor: "#1a2234", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#334155" },
  optionCardCorrect: { backgroundColor: "#0d3320", borderRadius: 12, padding: 16, borderWidth: 2, borderColor: "#22C55E" },
  optionCardWrong: { backgroundColor: "#3d1519", borderRadius: 12, padding: 16, borderWidth: 2, borderColor: "#EF4444" },
  optionCardText: { fontSize: 15, color: "#ECEDEE" },
  insightCard: { marginTop: 16, borderRadius: 12, padding: 16 },
  insightCorrect: { backgroundColor: "#0d3320" },
  insightWrong: { backgroundColor: "#3d1519" },
  insightText: { fontSize: 15, color: "#ECEDEE", marginBottom: 12 },
  culturalNoteBox: { backgroundColor: "rgba(255,184,0,0.1)", borderRadius: 8, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: "#FFB800" },
  culturalNoteLabel: { fontSize: 12, fontWeight: "600", color: "#FFB800", marginBottom: 4 },
  culturalNoteText: { fontSize: 13, color: "#ECEDEE", lineHeight: 18 },
  nextBtn: { backgroundColor: "#00AAFF", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, alignSelf: "flex-end" },
  nextBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  summaryTitle: { fontSize: 22, fontWeight: "700", color: "#ECEDEE", textAlign: "center", marginBottom: 20 },
  vocabSection: { marginBottom: 20 },
  vocabCard: { backgroundColor: "#1a2234", borderRadius: 10, padding: 14, marginBottom: 8 },
  vocabWord: { fontSize: 17, fontWeight: "600", color: "#00AAFF" },
  vocabPron: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  vocabMeaning: { fontSize: 14, color: "#ECEDEE", marginTop: 4 },
  finishBtn: { backgroundColor: "#00AAFF", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  finishBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
