import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const PUZZLE_CATEGORIES = [
  {
    id: "mystery",
    title: "Mystery Messages",
    description: "Decode secret messages from locals",
    icon: "🕵️",
    levels: 12,
    completed: 5,
    color: Colors.secondary,
  },
  {
    id: "lyrics",
    title: "Song Lyric Puzzles",
    description: "Figure out what the song is saying",
    icon: "🎵",
    levels: 15,
    completed: 8,
    color: Colors.warning,
  },
  {
    id: "slang",
    title: "Slang Decoder",
    description: "Crack the code of regional slang",
    icon: "🔥",
    levels: 20,
    completed: 3,
    color: Colors.error,
  },
  {
    id: "story",
    title: "Story Unlocker",
    description: "Translate to reveal the next chapter",
    icon: "📖",
    levels: 10,
    completed: 2,
    color: Colors.success,
  },
];

const CURRENT_PUZZLE = {
  category: "Mystery Messages",
  level: 6,
  title: "The Lost Tourist",
  story: "You found a note left by a tourist who got lost in Santo Domingo. Decode their message to help them find their way back.",
  clues: [
    { id: "1", text: "Estoy perdido cerca de la ___", answer: "playa", hint: "Where waves crash", solved: true },
    { id: "2", text: "Necesito encontrar mi ___", answer: "hotel", hint: "Where you sleep on vacation", solved: true },
    { id: "3", text: "¿Dónde está el ___ más cercano?", answer: "restaurante", hint: "Where you eat", solved: false },
    { id: "4", text: "Mi ___ no tiene batería", answer: "teléfono", hint: "You're holding one right now", solved: false },
  ],
  xpReward: 85,
  timeLimit: "5:00",
};

export default function DecodeModeScreen() {
  const [view, setView] = useState<"menu" | "puzzle">("menu");
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showHint, setShowHint] = useState<string | null>(null);

  const renderMenu = () => (
    <>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🔐</Text>
        <Text style={styles.heroTitle}>Decode Mode</Text>
        <Text style={styles.heroSubtitle}>
          Solve puzzles and mysteries by translating and decoding messages in your target language
        </Text>
      </View>

      {/* Daily Puzzle */}
      <TouchableOpacity style={styles.dailyPuzzle} onPress={() => setView("puzzle")}>
        <View style={styles.dailyBadge}>
          <Text style={styles.dailyBadgeText}>TODAY'S PUZZLE</Text>
        </View>
        <Text style={styles.dailyTitle}>{CURRENT_PUZZLE.title}</Text>
        <Text style={styles.dailyDescription}>{CURRENT_PUZZLE.story}</Text>
        <View style={styles.dailyMeta}>
          <View style={styles.dailyMetaItem}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={styles.dailyMetaText}>+{CURRENT_PUZZLE.xpReward} XP</Text>
          </View>
          <View style={styles.dailyMetaItem}>
            <Ionicons name="time" size={14} color={Colors.textSecondary} />
            <Text style={styles.dailyMetaText}>{CURRENT_PUZZLE.timeLimit}</Text>
          </View>
          <View style={styles.dailyMetaItem}>
            <Ionicons name="help-circle" size={14} color={Colors.textSecondary} />
            <Text style={styles.dailyMetaText}>{CURRENT_PUZZLE.clues.length} clues</Text>
          </View>
        </View>
        <View style={styles.dailyButton}>
          <Text style={styles.dailyButtonText}>Start Puzzle</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
        </View>
      </TouchableOpacity>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Puzzle Categories</Text>
      {PUZZLE_CATEGORIES.map((cat) => (
        <TouchableOpacity key={cat.id} style={styles.categoryCard}>
          <Text style={styles.categoryIcon}>{cat.icon}</Text>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryTitle}>{cat.title}</Text>
            <Text style={styles.categoryDescription}>{cat.description}</Text>
            <View style={styles.categoryProgress}>
              <View style={styles.categoryProgressBar}>
                <View
                  style={[
                    styles.categoryProgressFill,
                    { width: `${(cat.completed / cat.levels) * 100}%`, backgroundColor: cat.color },
                  ]}
                />
              </View>
              <Text style={styles.categoryProgressText}>
                {cat.completed}/{cat.levels}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      ))}

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Decode Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>18</Text>
            <Text style={styles.statLabel}>Puzzles Solved</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1,240</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderPuzzle = () => (
    <>
      {/* Puzzle Header */}
      <View style={styles.puzzleHeader}>
        <View>
          <Text style={styles.puzzleLevel}>Level {CURRENT_PUZZLE.level}</Text>
          <Text style={styles.puzzleTitle}>{CURRENT_PUZZLE.title}</Text>
        </View>
        <View style={styles.puzzleTimer}>
          <Ionicons name="time" size={16} color={Colors.warning} />
          <Text style={styles.puzzleTimerText}>4:32</Text>
        </View>
      </View>

      {/* Story */}
      <View style={styles.storyCard}>
        <Text style={styles.storyText}>{CURRENT_PUZZLE.story}</Text>
      </View>

      {/* Clues */}
      <Text style={styles.sectionTitle}>Decode the Clues</Text>
      {CURRENT_PUZZLE.clues.map((clue) => (
        <View
          key={clue.id}
          style={[
            styles.clueCard,
            clue.solved && styles.clueCardSolved,
          ]}
        >
          <View style={styles.clueHeader}>
            <View style={[
              styles.clueNumber,
              clue.solved && styles.clueNumberSolved,
            ]}>
              {clue.solved ? (
                <Ionicons name="checkmark" size={14} color={Colors.textPrimary} />
              ) : (
                <Text style={styles.clueNumberText}>{clue.id}</Text>
              )}
            </View>
            <Text style={styles.clueText}>{clue.text}</Text>
          </View>

          {clue.solved ? (
            <View style={styles.clueSolvedAnswer}>
              <Text style={styles.clueSolvedText}>✓ {clue.answer}</Text>
            </View>
          ) : (
            <View style={styles.clueInputRow}>
              <TextInput
                style={styles.clueInput}
                placeholder="Type your answer..."
                placeholderTextColor={Colors.textSecondary}
                value={answers[clue.id] || ""}
                onChangeText={(text) => setAnswers({ ...answers, [clue.id]: text })}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.hintButton}
                onPress={() => setShowHint(showHint === clue.id ? null : clue.id)}
              >
                <Ionicons name="bulb" size={16} color={Colors.warning} />
              </TouchableOpacity>
            </View>
          )}

          {showHint === clue.id && !clue.solved && (
            <View style={styles.hintBox}>
              <Ionicons name="bulb" size={14} color={Colors.warning} />
              <Text style={styles.hintText}>Hint: {clue.hint}</Text>
            </View>
          )}
        </View>
      ))}

      {/* Submit */}
      <TouchableOpacity style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Check Answers</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (view === "puzzle") setView("menu");
          else router.back();
        }}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {view === "menu" ? "Decode Mode" : "Puzzle"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {view === "menu" && renderMenu()}
        {view === "puzzle" && renderPuzzle()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  hero: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  dailyPuzzle: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  dailyBadge: {
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  dailyBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  dailyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dailyDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  dailyMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: Spacing.lg,
  },
  dailyMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dailyMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  dailyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  dailyButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  categoryDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  categoryProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  categoryProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  categoryProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  categoryProgressText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  statsCard: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  statsTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.secondary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  puzzleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  puzzleLevel: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
  },
  puzzleTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  puzzleTimer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warning + "15",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  puzzleTimerText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.warning,
  },
  storyCard: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  storyText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontStyle: "italic",
  },
  clueCard: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  clueCardSolved: {
    borderWidth: 1,
    borderColor: Colors.success + "40",
  },
  clueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.sm,
  },
  clueNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  clueNumberSolved: {
    backgroundColor: Colors.success,
  },
  clueNumberText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  clueText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  clueSolvedAnswer: {
    backgroundColor: Colors.success + "15",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginLeft: 34,
  },
  clueSolvedText: {
    fontSize: FontSize.md,
    color: Colors.success,
    fontWeight: "700",
  },
  clueInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 34,
  },
  clueInput: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.warning + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 34,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.warning + "10",
    borderRadius: BorderRadius.sm,
  },
  hintText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    fontStyle: "italic",
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});
