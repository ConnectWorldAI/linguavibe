import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
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

export function StoryChoiceExercise({ title, scenario, character, steps, vocabularyLearned, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showVocab, setShowVocab] = useState(false);

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
    if (isLastStep) {
      setShowVocab(true);
    } else {
      setCurrentStep((s) => s + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  if (showVocab) {
    return (
      <View style={styles.container}>
        <Text style={styles.vocabTitle}>Words You Learned</Text>
        {vocabularyLearned.map((v, i) => (
          <View key={i} style={styles.vocabRow}>
            <Text style={styles.vocabWord}>{v.word}</Text>
            <Text style={styles.vocabPronunciation}>{v.pronunciation}</Text>
            <Text style={styles.vocabMeaning}>{v.meaning}</Text>
          </View>
        ))}
        <Pressable style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]} onPress={() => onComplete(correctCount, steps.length)}>
          <Text style={styles.nextBtnText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.characterRow}>
        <Text style={styles.characterEmoji}>{character.emoji}</Text>
        <View style={styles.characterInfo}>
          <Text style={styles.characterName}>{character.name}</Text>
          <Text style={styles.characterRole}>{character.role}</Text>
        </View>
      </View>

      {currentStep === 0 && <Text style={styles.scenario}>{scenario}</Text>}

      <View style={styles.speechBubble}>
        <Text style={styles.promptText}>{step.prompt}</Text>
        <Text style={styles.pronunciation}>{step.pronunciation}</Text>
        <Text style={styles.translation}>{step.promptTranslation}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {step.options.map((option, index) => {
          let optStyle = styles.option;
          if (selectedOption !== null) {
            if (index === step.correctIndex) optStyle = styles.optionCorrect;
            else if (index === selectedOption && !isCorrect) optStyle = styles.optionWrong;
          }
          return (
            <Pressable
              key={index}
              style={({ pressed }) => [optStyle, pressed && selectedOption === null && { opacity: 0.8 }]}
              onPress={() => handleSelect(index)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedOption !== null && (
        <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackText}>{isCorrect ? step.correctFeedback : step.wrongFeedback}</Text>
          {step.culturalNote ? <Text style={styles.culturalNote}>{step.culturalNote}</Text> : null}
          <Pressable style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]} onPress={handleNext}>
            <Text style={styles.nextBtnText}>{isLastStep ? "See Vocabulary" : "Next"}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.progress}>
        <Text style={styles.progressText}>{currentStep + 1} / {steps.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  characterRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  characterEmoji: { fontSize: 40, marginRight: 12 },
  characterInfo: { flex: 1 },
  characterName: { fontSize: 18, fontWeight: "700", color: "#ECEDEE" },
  characterRole: { fontSize: 13, color: "#9BA1A6" },
  scenario: { fontSize: 14, color: "#9BA1A6", marginBottom: 16, fontStyle: "italic" },
  speechBubble: { backgroundColor: "#1e2a3a", borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: "#00AAFF" },
  promptText: { fontSize: 18, fontWeight: "600", color: "#ECEDEE", marginBottom: 6 },
  pronunciation: { fontSize: 13, color: "#00AAFF", marginBottom: 4 },
  translation: { fontSize: 13, color: "#9BA1A6" },
  optionsContainer: { gap: 10 },
  option: { backgroundColor: "#1a2234", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#334155" },
  optionCorrect: { backgroundColor: "#0d3320", borderRadius: 12, padding: 16, borderWidth: 2, borderColor: "#22C55E" },
  optionWrong: { backgroundColor: "#3d1519", borderRadius: 12, padding: 16, borderWidth: 2, borderColor: "#EF4444" },
  optionText: { fontSize: 16, color: "#ECEDEE" },
  feedback: { marginTop: 16, borderRadius: 12, padding: 16 },
  feedbackCorrect: { backgroundColor: "#0d3320" },
  feedbackWrong: { backgroundColor: "#3d1519" },
  feedbackText: { fontSize: 15, color: "#ECEDEE", marginBottom: 8 },
  culturalNote: { fontSize: 13, color: "#FFB800", marginBottom: 12 },
  nextBtn: { backgroundColor: "#00AAFF", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, alignSelf: "flex-end" },
  nextBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  progress: { marginTop: 16, alignItems: "center" },
  progressText: { fontSize: 13, color: "#687076" },
  vocabTitle: { fontSize: 20, fontWeight: "700", color: "#ECEDEE", marginBottom: 16, textAlign: "center" },
  vocabRow: { backgroundColor: "#1a2234", borderRadius: 10, padding: 14, marginBottom: 8 },
  vocabWord: { fontSize: 17, fontWeight: "600", color: "#00AAFF" },
  vocabPronunciation: { fontSize: 13, color: "#9BA1A6", marginTop: 2 },
  vocabMeaning: { fontSize: 14, color: "#ECEDEE", marginTop: 4 },
});
