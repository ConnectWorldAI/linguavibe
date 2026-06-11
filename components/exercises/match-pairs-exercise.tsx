import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface Props {
  title: string;
  scenario: string;
  pairs: { left: string; right: string; pronunciation: string }[];
  onComplete: (correct: number, total: number) => void;
}

export function MatchPairsExercise({ title, scenario, pairs, onComplete }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ left: number; right: number } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  // Shuffle right side
  const [shuffledRight] = useState(() => {
    const indices = pairs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });

  const handleLeftSelect = (index: number) => {
    if (matched.has(index)) return;
    setSelectedLeft(index);
    setWrongPair(null);
  };

  const handleRightSelect = (rightOriginalIndex: number) => {
    if (selectedLeft === null) return;
    if (matched.has(rightOriginalIndex)) return;

    if (selectedLeft === rightOriginalIndex) {
      // Correct match
      setMatched((prev) => new Set([...prev, rightOriginalIndex]));
      setCorrectCount((c) => c + 1);
      setSelectedLeft(null);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Check if all matched
      if (matched.size + 1 === pairs.length) {
        setTimeout(() => onComplete(correctCount + 1, pairs.length), 600);
      }
    } else {
      // Wrong match
      setWrongPair({ left: selectedLeft, right: rightOriginalIndex });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => { setWrongPair(null); setSelectedLeft(null); }, 1000);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.scenario}>{scenario}</Text>
      <Text style={styles.instruction}>Tap a word on the left, then tap its match on the right</Text>

      <View style={styles.pairsContainer}>
        {/* Left column */}
        <View style={styles.column}>
          {pairs.map((pair, index) => {
            const isMatched = matched.has(index);
            const isSelected = selectedLeft === index;
            const isWrong = wrongPair?.left === index;
            return (
              <Pressable
                key={`l-${index}`}
                style={[
                  styles.card,
                  isMatched && styles.cardMatched,
                  isSelected && styles.cardSelected,
                  isWrong && styles.cardWrong,
                ]}
                onPress={() => handleLeftSelect(index)}
              >
                <Text style={[styles.cardText, isMatched && styles.cardTextMatched]}>{pair.left}</Text>
                <Text style={styles.cardPron}>{pair.pronunciation}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Right column (shuffled) */}
        <View style={styles.column}>
          {shuffledRight.map((originalIndex, displayIndex) => {
            const isMatched = matched.has(originalIndex);
            const isWrong = wrongPair?.right === originalIndex;
            return (
              <Pressable
                key={`r-${displayIndex}`}
                style={[
                  styles.card,
                  isMatched && styles.cardMatched,
                  isWrong && styles.cardWrong,
                ]}
                onPress={() => handleRightSelect(originalIndex)}
              >
                <Text style={[styles.cardText, isMatched && styles.cardTextMatched]}>{pairs[originalIndex].right}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.progress}>{matched.size} / {pairs.length} matched</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#ECEDEE", textAlign: "center", marginBottom: 4 },
  scenario: { fontSize: 13, color: "#9BA1A6", textAlign: "center", marginBottom: 12 },
  instruction: { fontSize: 13, color: "#00AAFF", textAlign: "center", marginBottom: 20 },
  pairsContainer: { flexDirection: "row", gap: 12 },
  column: { flex: 1, gap: 10 },
  card: { backgroundColor: "#1a2234", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#334155", minHeight: 60, justifyContent: "center" },
  cardSelected: { borderColor: "#00AAFF", borderWidth: 2, backgroundColor: "#0d1b2a" },
  cardMatched: { backgroundColor: "#0d3320", borderColor: "#22C55E" },
  cardWrong: { backgroundColor: "#3d1519", borderColor: "#EF4444" },
  cardText: { fontSize: 15, color: "#ECEDEE", textAlign: "center" },
  cardTextMatched: { color: "#22C55E" },
  cardPron: { fontSize: 11, color: "#9BA1A6", textAlign: "center", marginTop: 2 },
  progress: { fontSize: 13, color: "#687076", textAlign: "center", marginTop: 20 },
});
