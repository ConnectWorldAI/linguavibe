import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

export interface DictationClip {
  /** The correct transcript in target language */
  transcript: string;
  /** English translation */
  translation: string;
  /** Pronunciation guide */
  pronunciation: string;
  /** Context/source info (e.g., "Movie: Roma, Scene: Market conversation") */
  source: string;
  /** Explanation of contractions/slang used */
  explanation: string;
}

interface Props {
  title: string;
  scenario: string;
  clips: DictationClip[];
  /** Language code for TTS */
  ttsLanguage?: string;
  onComplete: (correct: number, total: number) => void;
}

type DictationStep = "listen" | "write" | "compare" | "imitate";

const STEP_LABELS: Record<DictationStep, { label: string; emoji: string; instruction: string }> = {
  listen: { label: "Listen", emoji: "👂", instruction: "Listen carefully to the audio clip. Focus on the sounds and rhythm." },
  write: { label: "Write", emoji: "✍️", instruction: "Write exactly what you heard. Don't worry about perfection!" },
  compare: { label: "Compare", emoji: "🔍", instruction: "Compare your answer with the correct transcript." },
  imitate: { label: "Imitate", emoji: "🗣️", instruction: "Say the phrase out loud, matching the rhythm and pronunciation." },
};

export function NetflixDictationExercise({ title, scenario, clips, ttsLanguage = "es", onComplete }: Props) {
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [step, setStep] = useState<DictationStep>("listen");
  const [userInput, setUserInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [listenCount, setListenCount] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [exerciseComplete, setExerciseComplete] = useState(false);

  const currentClip = clips[currentClipIndex];

  const playAudio = useCallback((rate: number = 1.0) => {
    if (!currentClip || isPlaying) return;
    setIsPlaying(true);
    Speech.speak(currentClip.transcript, {
      language: ttsLanguage,
      rate,
      onDone: () => {
        setIsPlaying(false);
        setListenCount((c) => c + 1);
      },
      onError: () => setIsPlaying(false),
    });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentClip, ttsLanguage, isPlaying]);

  const handleStepAdvance = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    switch (step) {
      case "listen":
        setStep("write");
        break;
      case "write":
        setStep("compare");
        break;
      case "compare":
        setStep("imitate");
        break;
      case "imitate":
        // Calculate score for this clip
        const accuracy = calculateAccuracy(userInput, currentClip.transcript);
        setScores((prev) => [...prev, accuracy]);

        // Move to next clip or finish
        const nextIndex = currentClipIndex + 1;
        if (nextIndex < clips.length) {
          setCurrentClipIndex(nextIndex);
          setStep("listen");
          setUserInput("");
          setListenCount(0);
        } else {
          setExerciseComplete(true);
          const totalScore = [...scores, accuracy];
          const avgScore = totalScore.reduce((a, b) => a + b, 0) / totalScore.length;
          const correctCount = Math.round((avgScore / 100) * clips.length);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => onComplete(correctCount, clips.length), 1500);
        }
        break;
    }
  };

  const getDiffHighlight = (): { word: string; correct: boolean }[] => {
    if (!currentClip) return [];
    const correctWords = currentClip.transcript.toLowerCase().split(/\s+/);
    const userWords = userInput.toLowerCase().split(/\s+/);

    const highlighted = correctWords.map((word, i) => {
      if (userWords[i] === word) return { word, correct: true };
      return { word, correct: false };
    });

    return highlighted;
  };

  if (exerciseComplete) {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    return (
      <View style={styles.container}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeEmoji}>🎬</Text>
          <Text style={styles.completeTitle}>Dictation Complete!</Text>
          <Text style={styles.completeSubtitle}>
            Average accuracy: {Math.round(avgScore)}%
          </Text>
          <Text style={styles.completeDetail}>
            {clips.length} clips completed through all 4 steps
          </Text>
          <Text style={styles.completeTip}>
            Rocky says: "Your ears are getting sharper! Keep practicing with real content!"
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.scenario}>{scenario}</Text>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Clip {currentClipIndex + 1}/{clips.length}
        </Text>
        <Text style={styles.sourceText}>{currentClip?.source}</Text>
      </View>

      {/* Step Indicators */}
      <View style={styles.stepsRow}>
        {(["listen", "write", "compare", "imitate"] as DictationStep[]).map((s, idx) => {
          const stepInfo = STEP_LABELS[s];
          const isActive = s === step;
          const isDone = (["listen", "write", "compare", "imitate"] as DictationStep[]).indexOf(step) > idx;
          return (
            <View key={s} style={[styles.stepIndicator, isActive && styles.stepActive, isDone && styles.stepDone]}>
              <Text style={[styles.stepEmoji, isActive && styles.stepEmojiActive]}>{stepInfo.emoji}</Text>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{stepInfo.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Instruction */}
      <View style={styles.instructionCard}>
        <Text style={styles.instructionText}>{STEP_LABELS[step].instruction}</Text>
      </View>

      {/* Step Content */}
      {step === "listen" && (
        <View style={styles.stepContent}>
          <Pressable
            style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            onPress={() => playAudio(1.0)}
          >
            <Text style={styles.playBtnText}>
              {isPlaying ? "🎧 Playing..." : "🔊 Play Audio"}
            </Text>
          </Pressable>

          {listenCount > 0 && (
            <Pressable
              style={({ pressed }) => [styles.slowBtn, pressed && { opacity: 0.7 }]}
              onPress={() => playAudio(0.7)}
            >
              <Text style={styles.slowBtnText}>🐢 Play Slower</Text>
            </Pressable>
          )}

          <Text style={styles.listenHint}>
            {listenCount === 0
              ? "Press play to hear the clip"
              : `Listened ${listenCount} time${listenCount > 1 ? "s" : ""}. Ready to write?`}
          </Text>

          {listenCount >= 1 && (
            <Pressable
              style={({ pressed }) => [styles.advanceBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
              onPress={handleStepAdvance}
            >
              <Text style={styles.advanceBtnText}>Ready to Write →</Text>
            </Pressable>
          )}
        </View>
      )}

      {step === "write" && (
        <View style={styles.stepContent}>
          <TextInput
            style={styles.dictationInput}
            placeholder="Write what you heard..."
            placeholderTextColor="#6B7280"
            value={userInput}
            onChangeText={setUserInput}
            multiline
            autoFocus
            returnKeyType="done"
          />

          <Pressable
            style={({ pressed }) => [styles.replaySmall, pressed && { opacity: 0.7 }]}
            onPress={() => playAudio(0.8)}
          >
            <Text style={styles.replaySmallText}>🔄 Replay Audio</Text>
          </Pressable>

          {userInput.trim().length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.advanceBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
              onPress={handleStepAdvance}
            >
              <Text style={styles.advanceBtnText}>Check My Answer →</Text>
            </Pressable>
          )}
        </View>
      )}

      {step === "compare" && (
        <View style={styles.stepContent}>
          {/* User's answer */}
          <View style={styles.compareCard}>
            <Text style={styles.compareLabel}>Your Answer:</Text>
            <Text style={styles.compareUserText}>{userInput || "(empty)"}</Text>
          </View>

          {/* Correct answer with diff highlighting */}
          <View style={[styles.compareCard, styles.compareCorrectCard]}>
            <Text style={styles.compareLabel}>Correct:</Text>
            <View style={styles.diffRow}>
              {getDiffHighlight().map((item, idx) => (
                <Text
                  key={idx}
                  style={[styles.diffWord, item.correct ? styles.diffCorrect : styles.diffWrong]}
                >
                  {item.word}{" "}
                </Text>
              ))}
            </View>
            <Text style={styles.comparePron}>{currentClip?.pronunciation}</Text>
            <Text style={styles.compareTranslation}>{currentClip?.translation}</Text>
          </View>

          {/* Explanation */}
          {currentClip?.explanation && (
            <View style={styles.explanationCard}>
              <Text style={styles.explanationTitle}>💡 Notes:</Text>
              <Text style={styles.explanationText}>{currentClip.explanation}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.advanceBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            onPress={handleStepAdvance}
          >
            <Text style={styles.advanceBtnText}>Now Imitate →</Text>
          </Pressable>
        </View>
      )}

      {step === "imitate" && (
        <View style={styles.stepContent}>
          <View style={styles.imitateCard}>
            <Text style={styles.imitatePhrase}>{currentClip?.transcript}</Text>
            <Text style={styles.imitatePron}>{currentClip?.pronunciation}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            onPress={() => playAudio(0.8)}
          >
            <Text style={styles.playBtnText}>
              {isPlaying ? "🎧 Playing..." : "🔊 Listen Again"}
            </Text>
          </Pressable>

          <Text style={styles.imitateInstruction}>
            Say the phrase out loud 3 times, matching the rhythm and pronunciation.
            Focus on the sounds you missed in your written answer.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.advanceBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            onPress={handleStepAdvance}
          >
            <Text style={styles.advanceBtnText}>
              {currentClipIndex + 1 < clips.length ? "Next Clip →" : "Finish Exercise ✓"}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function calculateAccuracy(userInput: string, correct: string): number {
  const userWords = userInput.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const correctWords = correct.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (correctWords.length === 0) return 0;

  let matches = 0;
  for (let i = 0; i < correctWords.length; i++) {
    if (userWords[i] === correctWords[i]) matches++;
  }
  return Math.round((matches / correctWords.length) * 100);
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  scenario: { fontSize: 14, color: "#9CA3AF", marginBottom: 16 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  progressText: { fontSize: 13, color: "#6C63FF", fontWeight: "600" },
  sourceText: { fontSize: 12, color: "#6B7280", fontStyle: "italic" },
  stepsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, gap: 4 },
  stepIndicator: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  stepActive: { borderColor: "#6C63FF", backgroundColor: "#2A2A4A" },
  stepDone: { borderColor: "#22C55E", backgroundColor: "#1A2E1A" },
  stepEmoji: { fontSize: 18, marginBottom: 2 },
  stepEmojiActive: { fontSize: 22 },
  stepLabel: { fontSize: 10, color: "#6B7280" },
  stepLabelActive: { color: "#FFFFFF", fontWeight: "600" },
  instructionCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#6C63FF",
  },
  instructionText: { fontSize: 14, color: "#D1D5DB" },
  stepContent: { alignItems: "center", gap: 12 },
  playBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  playBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  slowBtn: { paddingVertical: 8 },
  slowBtnText: { fontSize: 14, color: "#8B83FF" },
  listenHint: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  advanceBtn: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 8,
  },
  advanceBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  dictationInput: {
    width: "100%",
    minHeight: 100,
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    textAlignVertical: "top",
  },
  replaySmall: { paddingVertical: 6 },
  replaySmallText: { fontSize: 13, color: "#8B83FF" },
  compareCard: {
    width: "100%",
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  compareCorrectCard: { borderColor: "#22C55E40", backgroundColor: "#1A2E1A" },
  compareLabel: { fontSize: 12, color: "#9CA3AF", marginBottom: 6, fontWeight: "600" },
  compareUserText: { fontSize: 15, color: "#D1D5DB" },
  diffRow: { flexDirection: "row", flexWrap: "wrap" },
  diffWord: { fontSize: 16 },
  diffCorrect: { color: "#22C55E" },
  diffWrong: { color: "#EF4444", textDecorationLine: "underline" },
  comparePron: { fontSize: 13, color: "#8B83FF", marginTop: 8, fontStyle: "italic" },
  compareTranslation: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  explanationCard: {
    width: "100%",
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F59E0B40",
  },
  explanationTitle: { fontSize: 13, fontWeight: "600", color: "#F59E0B", marginBottom: 4 },
  explanationText: { fontSize: 13, color: "#D1D5DB" },
  imitateCard: {
    width: "100%",
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6C63FF40",
  },
  imitatePhrase: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginBottom: 8 },
  imitatePron: { fontSize: 15, color: "#8B83FF", fontStyle: "italic" },
  imitateInstruction: { fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 16 },
  completeContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  completeEmoji: { fontSize: 64, marginBottom: 16 },
  completeTitle: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  completeSubtitle: { fontSize: 18, color: "#22C55E", marginBottom: 4 },
  completeDetail: { fontSize: 14, color: "#9CA3AF", marginBottom: 16 },
  completeTip: { fontSize: 14, color: "#8B83FF", textAlign: "center", fontStyle: "italic" },
});
