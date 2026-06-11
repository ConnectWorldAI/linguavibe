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

export function ConversationChainExercise({ title, scenario, character, steps, vocabularyLearned, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Array<{ speaker: string; text: string; isUser: boolean }>>([]);
  const [showVocab, setShowVocab] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleSelect = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    const correct = index === step.correctIndex;
    setIsCorrect(correct);
    setConversationHistory((prev) => [
      ...prev,
      { speaker: character.name, text: step.prompt, isUser: false },
      { speaker: "You", text: step.options[index], isUser: true },
    ]);
    if (correct) {
      setCorrectCount((c) => c + 1);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNext = () => {
    if (isLastStep) setShowVocab(true);
    else { setCurrentStep((s) => s + 1); setSelectedOption(null); setIsCorrect(null); }
  };

  if (showVocab) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.completeTitle}>Conversation Complete!</Text>
        <Text style={styles.scoreText}>{correctCount}/{steps.length} correct</Text>
        {vocabularyLearned.map((v, i) => (
          <View key={i} style={styles.vocabRow}>
            <Text style={styles.vocabWord}>{v.word}</Text>
            <Text style={styles.vocabPron}>{v.pronunciation}</Text>
            <Text style={styles.vocabMeaning}>{v.meaning}</Text>
          </View>
        ))}
        <Pressable style={({ pressed }) => [styles.finishBtn, pressed && { opacity: 0.8 }]} onPress={() => onComplete(correctCount, steps.length)}>
          <Text style={styles.finishBtnText}>Continue</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{character.emoji}</Text>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerScenario}>{scenario}</Text>
      </View>
      {conversationHistory.map((msg, i) => (
        <View key={i} style={[styles.msgBubble, msg.isUser ? styles.msgUser : styles.msgCharacter]}>
          <Text style={styles.msgSpeaker}>{msg.speaker}</Text>
          <Text style={styles.msgText}>{msg.text}</Text>
        </View>
      ))}
      <View style={styles.characterBubble}>
        <Text style={styles.characterSays}>{character.emoji} {character.name}:</Text>
        <Text style={styles.promptText}>{step.prompt}</Text>
        <Text style={styles.promptPron}>{step.pronunciation}</Text>
        <Text style={styles.promptTranslation}>{step.promptTranslation}</Text>
      </View>
      {selectedOption === null && (
        <View style={styles.responseSection}>
          <Text style={styles.responseLabel}>Your response:</Text>
          {step.options.map((option, index) => (
            <Pressable key={index} style={({ pressed }) => [styles.responseOption, pressed && { opacity: 0.8 }]} onPress={() => handleSelect(index)}>
              <Text style={styles.responseText}>{option}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {selectedOption !== null && (
        <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackText}>{isCorrect ? step.correctFeedback : step.wrongFeedback}</Text>
          {step.culturalNote ? <Text style={styles.culturalNote}>{step.culturalNote}</Text> : null}
          <Pressable style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]} onPress={handleNext}>
            <Text style={styles.nextBtnText}>{isLastStep ? "Finish" : "Continue"}</Text>
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
  msgBubble: { borderRadius: 12, padding: 12, marginBottom: 8, maxWidth: "80%" as any },
  msgCharacter: { backgroundColor: "#1a2234", alignSelf: "flex-start" },
  msgUser: { backgroundColor: "#0a3d5c", alignSelf: "flex-end" },
  msgSpeaker: { fontSize: 11, color: "#9BA1A6", marginBottom: 2 },
  msgText: { fontSize: 14, color: "#ECEDEE" },
  characterBubble: { backgroundColor: "#1e2a3a", borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: "#00AAFF", marginVertical: 12 },
  characterSays: { fontSize: 13, color: "#00AAFF", marginBottom: 6 },
  promptText: { fontSize: 17, fontWeight: "600", color: "#ECEDEE", marginBottom: 4 },
  promptPron: { fontSize: 13, color: "#00AAFF", marginBottom: 2 },
  promptTranslation: { fontSize: 13, color: "#9BA1A6" },
  responseSection: { marginTop: 12 },
  responseLabel: { fontSize: 13, color: "#9BA1A6", marginBottom: 8 },
  responseOption: { backgroundColor: "#1a2234", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#334155" },
  responseText: { fontSize: 15, color: "#ECEDEE" },
  feedback: { marginTop: 12, borderRadius: 12, padding: 16 },
  feedbackCorrect: { backgroundColor: "#0d3320" },
  feedbackWrong: { backgroundColor: "#3d1519" },
  feedbackText: { fontSize: 15, color: "#ECEDEE", marginBottom: 8 },
  culturalNote: { fontSize: 13, color: "#FFB800", marginBottom: 12 },
  nextBtn: { backgroundColor: "#00AAFF", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, alignSelf: "flex-end" },
  nextBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  completeTitle: { fontSize: 22, fontWeight: "700", color: "#ECEDEE", textAlign: "center", marginBottom: 4 },
  scoreText: { fontSize: 14, color: "#9BA1A6", textAlign: "center", marginBottom: 20 },
  vocabRow: { backgroundColor: "#1a2234", borderRadius: 10, padding: 14, marginBottom: 8 },
  vocabWord: { fontSize: 17, fontWeight: "600", color: "#00AAFF" },
  vocabPron: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  vocabMeaning: { fontSize: 14, color: "#ECEDEE", marginTop: 4 },
  finishBtn: { backgroundColor: "#00AAFF", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  finishBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
