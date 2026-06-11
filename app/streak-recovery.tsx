/**
 * Streak Break Recovery Screen
 * When a user misses a day and loses their streak, this shows a
 * "Recovery Challenge" that lets them earn it back with double-effort.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

const Colors = {
  bg: "#0A0E1A",
  card: "#141B2D",
  cardBorder: "#1E293B",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  primary: "#00AAFF",
  warning: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
  orange: "#F97316",
  purple: "#8B5CF6",
  gold: "#FFD700",
};

interface RecoveryChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: "medium" | "hard" | "extreme";
  duration: string;
  xpBonus: number;
  streakRestore: number; // days restored
  tasks: string[];
}

const RECOVERY_CHALLENGES: RecoveryChallenge[] = [
  {
    id: "double_lesson",
    title: "Double Down",
    description: "Complete 2x your daily lesson goal in one session",
    icon: "book",
    difficulty: "medium",
    duration: "45-60 min",
    xpBonus: 150,
    streakRestore: 1,
    tasks: [
      "Complete 2 full lessons (any level)",
      "Score 80%+ on both quizzes",
      "Review 10 flashcards with 'Good' or better",
    ],
  },
  {
    id: "pronunciation_marathon",
    title: "Pronunciation Marathon",
    description: "Nail 20 pronunciation exercises back-to-back",
    icon: "mic",
    difficulty: "hard",
    duration: "30-45 min",
    xpBonus: 200,
    streakRestore: 2,
    tasks: [
      "Complete 20 pronunciation drills",
      "Achieve 85%+ average accuracy",
      "Record 3 sentences with native-like flow",
      "Practice 5 tongue twisters",
    ],
  },
  {
    id: "flashcard_blitz",
    title: "Flashcard Blitz",
    description: "Review 50 flashcards with at least 80% recall rate",
    icon: "layers",
    difficulty: "medium",
    duration: "25-35 min",
    xpBonus: 120,
    streakRestore: 1,
    tasks: [
      "Review 50 flashcards in one session",
      "Rate 40+ cards as 'Good' or 'Easy'",
      "Zero 'Again' ratings on previously mastered cards",
    ],
  },
  {
    id: "immersion_challenge",
    title: "Full Immersion",
    description: "Spend 90 minutes in target language activities only",
    icon: "globe",
    difficulty: "extreme",
    duration: "90 min",
    xpBonus: 350,
    streakRestore: 3,
    tasks: [
      "Watch 30 min of content with dual-language subtitles",
      "Complete 3 conversation simulations",
      "Translate 5 real-world articles or posts",
      "Write a 100-word journal entry in target language",
      "Listen to 2 songs with synced lyrics",
    ],
  },
  {
    id: "speed_challenge",
    title: "Speed Round",
    description: "Complete rapid-fire exercises against the clock",
    icon: "timer",
    difficulty: "hard",
    duration: "20-30 min",
    xpBonus: 180,
    streakRestore: 1,
    tasks: [
      "Translate 15 sentences in under 5 minutes",
      "Match 30 vocabulary pairs in 3 minutes",
      "Complete a timed grammar quiz (90%+ required)",
      "Identify 20 audio clips correctly",
    ],
  },
];

export default function StreakRecoveryScreen() {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const lostStreak = 12; // days the user had before breaking
  const daysMissed = 1;

  const handleSelectChallenge = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChallenge(id);
  };

  const handleStartChallenge = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChallengeStarted(true);
  };

  const handleToggleTask = (task: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(task)) next.delete(task);
      else next.add(task);
      return next;
    });
  };

  const handleCompleteChallenge = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In production: restore streak, award XP, save to storage
    router.back();
  };

  const selected = RECOVERY_CHALLENGES.find((c) => c.id === selectedChallenge);
  const allTasksDone = selected ? selected.tasks.every((t) => completedTasks.has(t)) : false;

  const difficultyColor = (d: string) =>
    d === "medium" ? Colors.warning : d === "hard" ? Colors.orange : Colors.error;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Streak Recovery</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Streak Lost Banner */}
        <View style={styles.lostBanner}>
          <View style={styles.lostIconWrap}>
            <Ionicons name="flame" size={32} color={Colors.orange} />
            <View style={styles.lostBadge}>
              <Ionicons name="alert" size={12} color="#FFF" />
            </View>
          </View>
          <Text style={styles.lostTitle}>Your {lostStreak}-Day Streak Broke</Text>
          <Text style={styles.lostSub}>
            You missed {daysMissed} day{daysMissed > 1 ? "s" : ""}. Complete a recovery challenge to earn it back!
          </Text>
        </View>

        {/* How It Works */}
        <View style={styles.howSection}>
          <Text style={styles.howTitle}>How Recovery Works</Text>
          <View style={styles.howSteps}>
            <View style={styles.howStep}>
              <View style={[styles.howStepNum, { backgroundColor: Colors.primary + "20" }]}>
                <Text style={[styles.howStepNumText, { color: Colors.primary }]}>1</Text>
              </View>
              <Text style={styles.howStepText}>Pick a challenge</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
            <View style={styles.howStep}>
              <View style={[styles.howStepNum, { backgroundColor: Colors.warning + "20" }]}>
                <Text style={[styles.howStepNumText, { color: Colors.warning }]}>2</Text>
              </View>
              <Text style={styles.howStepText}>Complete all tasks</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
            <View style={styles.howStep}>
              <View style={[styles.howStepNum, { backgroundColor: Colors.success + "20" }]}>
                <Text style={[styles.howStepNumText, { color: Colors.success }]}>3</Text>
              </View>
              <Text style={styles.howStepText}>Streak restored!</Text>
            </View>
          </View>
        </View>

        {!challengeStarted ? (
          <>
            {/* Challenge Options */}
            <Text style={styles.sectionTitle}>Choose Your Challenge</Text>
            {RECOVERY_CHALLENGES.map((challenge) => (
              <TouchableOpacity
                key={challenge.id}
                style={[
                  styles.challengeCard,
                  selectedChallenge === challenge.id && styles.challengeCardSelected,
                ]}
                onPress={() => handleSelectChallenge(challenge.id)}
                activeOpacity={0.8}
              >
                <View style={styles.challengeHeader}>
                  <View style={styles.challengeIconWrap}>
                    <Ionicons name={challenge.icon as any} size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  </View>
                  {selectedChallenge === challenge.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  )}
                </View>
                <View style={styles.challengeMeta}>
                  <View style={[styles.diffBadge, { backgroundColor: difficultyColor(challenge.difficulty) + "20" }]}>
                    <Text style={[styles.diffText, { color: difficultyColor(challenge.difficulty) }]}>
                      {challenge.difficulty}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{challenge.duration}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="flash" size={13} color={Colors.gold} />
                    <Text style={styles.metaText}>+{challenge.xpBonus} XP</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="flame" size={13} color={Colors.orange} />
                    <Text style={styles.metaText}>+{challenge.streakRestore}d</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* Start Button */}
            {selectedChallenge && (
              <TouchableOpacity style={styles.startBtn} onPress={handleStartChallenge} activeOpacity={0.8}>
                <Ionicons name="rocket" size={18} color="#FFF" />
                <Text style={styles.startBtnText}>Start Challenge</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {/* Active Challenge */}
            <View style={styles.activeHeader}>
              <Ionicons name={selected!.icon as any} size={24} color={Colors.primary} />
              <Text style={styles.activeTitle}>{selected!.title}</Text>
            </View>

            <Text style={styles.taskListTitle}>Complete All Tasks:</Text>
            {selected!.tasks.map((task, idx) => {
              const done = completedTasks.has(task);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.taskItem, done && styles.taskItemDone]}
                  onPress={() => handleToggleTask(task)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.taskCheck, done && styles.taskCheckDone]}>
                    {done && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                  <Text style={[styles.taskText, done && styles.taskTextDone]}>{task}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(completedTasks.size / selected!.tasks.length) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {completedTasks.size}/{selected!.tasks.length} tasks complete
              </Text>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              style={[styles.completeBtn, !allTasksDone && styles.completeBtnDisabled]}
              onPress={allTasksDone ? handleCompleteChallenge : undefined}
              activeOpacity={allTasksDone ? 0.8 : 1}
            >
              <Ionicons name="trophy" size={18} color={allTasksDone ? "#FFF" : Colors.textMuted} />
              <Text style={[styles.completeBtnText, !allTasksDone && { color: Colors.textMuted }]}>
                {allTasksDone ? "Restore My Streak!" : "Complete all tasks to restore"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Skip Option */}
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
          <Text style={styles.skipText}>Start fresh from Day 1 instead</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },

  lostBanner: {
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.orange + "30",
  },
  lostIconWrap: { position: "relative", marginBottom: 12 },
  lostBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  lostTitle: { fontSize: 20, fontWeight: "800", color: Colors.text, marginBottom: 6 },
  lostSub: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },

  howSection: { marginBottom: 24 },
  howTitle: { fontSize: 14, fontWeight: "600", color: Colors.textMuted, marginBottom: 12 },
  howSteps: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  howStep: { alignItems: "center", gap: 4 },
  howStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  howStepNumText: { fontSize: 13, fontWeight: "700" },
  howStepText: { fontSize: 11, color: Colors.textSecondary },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },

  challengeCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  challengeCardSelected: { borderColor: Colors.primary },
  challengeHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  challengeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  challengeTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  challengeDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  challengeMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, color: Colors.textMuted },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  startBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  activeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  activeTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },

  taskListTitle: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary, marginBottom: 12 },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  taskItemDone: { borderColor: Colors.success + "40", backgroundColor: Colors.success + "08" },
  taskCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  taskText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 19 },
  taskTextDone: { color: Colors.success, textDecorationLine: "line-through" },

  progressSection: { marginTop: 16, marginBottom: 16 },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cardBorder,
    marginBottom: 8,
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: Colors.success },
  progressText: { fontSize: 12, color: Colors.textMuted, textAlign: "center" },

  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  completeBtnDisabled: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  completeBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipText: { fontSize: 13, color: Colors.textMuted, textDecorationLine: "underline" },
});
