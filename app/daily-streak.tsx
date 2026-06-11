/**
 * Daily Streak & Gamification Screen
 * 
 * Daily translation goals, streak counter, XP system to keep users
 * coming back. Shows progress, achievements, and leaderboard.
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  ScrollView, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type DailyGoal = {
  type: "translations" | "flashcards" | "journal" | "pronunciation";
  target: number;
  current: number;
  xpReward: number;
  label: string;
  icon: string;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
};

type UserStats = {
  totalXP: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastActiveDate: string;
  translationsToday: number;
  flashcardsToday: number;
  journalToday: number;
  pronunciationToday: number;
};

const STORAGE_KEY = "linguavibe_gamification";
const XP_PER_LEVEL = 500;

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_translation", title: "First Words", description: "Complete your first translation", icon: "🌱", unlocked: false },
  { id: "streak_3", title: "On Fire", description: "3-day streak", icon: "🔥", unlocked: false },
  { id: "streak_7", title: "Dedicated", description: "7-day streak", icon: "⭐", unlocked: false },
  { id: "streak_30", title: "Unstoppable", description: "30-day streak", icon: "💎", unlocked: false },
  { id: "xp_1000", title: "Scholar", description: "Earn 1,000 XP", icon: "📚", unlocked: false },
  { id: "xp_5000", title: "Master", description: "Earn 5,000 XP", icon: "🏆", unlocked: false },
  { id: "flashcards_100", title: "Card Shark", description: "Review 100 flashcards", icon: "🃏", unlocked: false },
  { id: "journal_10", title: "Writer", description: "Write 10 journal entries", icon: "✍️", unlocked: false },
  { id: "pronunciation_50", title: "Speaker", description: "Score 50 pronunciations", icon: "🎤", unlocked: false },
  { id: "perfect_day", title: "Perfect Day", description: "Complete all daily goals", icon: "🌟", unlocked: false },
];

export default function DailyStreakScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    totalXP: 0, level: 1, streak: 0, longestStreak: 0,
    lastActiveDate: "", translationsToday: 0, flashcardsToday: 0,
    journalToday: 0, pronunciationToday: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const saved = JSON.parse(data);
        const today = new Date().toISOString().split("T")[0];
        if (saved.lastActiveDate !== today) {
          // New day - check streak
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          const newStreak = saved.lastActiveDate === yesterday ? saved.streak + 1 : 1;
          const updated = {
            ...saved,
            streak: newStreak,
            longestStreak: Math.max(saved.longestStreak, newStreak),
            lastActiveDate: today,
            translationsToday: 0,
            flashcardsToday: 0,
            journalToday: 0,
            pronunciationToday: 0,
          };
          setStats(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } else {
          setStats(saved);
        }
        if (saved.achievements) setAchievements(saved.achievements);
      } else {
        const today = new Date().toISOString().split("T")[0];
        const initial = { ...stats, lastActiveDate: today, streak: 1 };
        setStats(initial);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch {}
  };

  const dailyGoals: DailyGoal[] = [
    { type: "translations", target: 5, current: stats.translationsToday, xpReward: 50, label: "Translations", icon: "language" },
    { type: "flashcards", target: 10, current: stats.flashcardsToday, xpReward: 30, label: "Flashcards", icon: "albums" },
    { type: "journal", target: 1, current: stats.journalToday, xpReward: 40, label: "Journal Entry", icon: "create" },
    { type: "pronunciation", target: 3, current: stats.pronunciationToday, xpReward: 35, label: "Pronunciations", icon: "mic" },
  ];

  const totalGoalProgress = dailyGoals.reduce((sum, g) => sum + Math.min(g.current / g.target, 1), 0) / dailyGoals.length;
  const xpToNextLevel = XP_PER_LEVEL - (stats.totalXP % XP_PER_LEVEL);
  const levelProgress = ((stats.totalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  const claimXP = async (goal: DailyGoal) => {
    if (goal.current < goal.target) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = { ...stats, totalXP: stats.totalXP + goal.xpReward, level: Math.floor((stats.totalXP + goal.xpReward) / XP_PER_LEVEL) + 1 };
    setStats(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <ScreenContainer>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#ECEDEE" />
          </TouchableOpacity>
          <Text style={s.title}>Progress</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Streak & Level Card */}
          <View style={s.heroCard}>
            <View style={s.streakSection}>
              <Text style={s.streakEmoji}>🔥</Text>
              <Text style={s.streakCount}>{stats.streak}</Text>
              <Text style={s.streakLabel}>Day Streak</Text>
            </View>
            <View style={s.levelSection}>
              <Text style={s.levelText}>Level {stats.level}</Text>
              <View style={s.xpBar}>
                <View style={[s.xpFill, { width: `${levelProgress}%` }]} />
              </View>
              <Text style={s.xpText}>{xpToNextLevel} XP to next level</Text>
              <Text style={s.totalXP}>{stats.totalXP} total XP</Text>
            </View>
          </View>

          {/* Daily Goals */}
          <Text style={s.sectionTitle}>Daily Goals</Text>
          <View style={s.goalsCard}>
            {/* Overall progress ring */}
            <View style={s.overallProgress}>
              <Text style={s.overallPercent}>{Math.round(totalGoalProgress * 100)}%</Text>
              <Text style={s.overallLabel}>Complete</Text>
            </View>

            {dailyGoals.map((goal, i) => {
              const progress = Math.min(goal.current / goal.target, 1);
              const isComplete = progress >= 1;
              return (
                <View key={i} style={s.goalRow}>
                  <View style={[s.goalIcon, isComplete && { backgroundColor: "rgba(76,175,80,0.15)" }]}>
                    <Ionicons name={goal.icon as any} size={18} color={isComplete ? "#4CAF50" : "#9BA1A6"} />
                  </View>
                  <View style={s.goalInfo}>
                    <Text style={s.goalLabel}>{goal.label}</Text>
                    <View style={s.goalBar}>
                      <View style={[s.goalFill, { width: `${progress * 100}%`, backgroundColor: isComplete ? "#4CAF50" : "#00AAFF" }]} />
                    </View>
                  </View>
                  <Text style={s.goalCount}>{goal.current}/{goal.target}</Text>
                  {isComplete && (
                    <TouchableOpacity onPress={() => claimXP(goal)} style={s.claimBtn}>
                      <Text style={s.claimText}>+{goal.xpReward}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Achievements */}
          <Text style={s.sectionTitle}>Achievements</Text>
          <View style={s.achievementsGrid}>
            {achievements.map((a) => (
              <View key={a.id} style={[s.achievementCard, !a.unlocked && s.achievementLocked]}>
                <Text style={s.achievementIcon}>{a.icon}</Text>
                <Text style={[s.achievementTitle, !a.unlocked && { color: "#687076" }]}>{a.title}</Text>
                <Text style={s.achievementDesc}>{a.description}</Text>
              </View>
            ))}
          </View>

          {/* Stats */}
          <Text style={s.sectionTitle}>All-Time Stats</Text>
          <View style={s.allTimeStats}>
            <View style={s.allTimeStat}>
              <Text style={s.allTimeValue}>{stats.longestStreak}</Text>
              <Text style={s.allTimeLabel}>Best Streak</Text>
            </View>
            <View style={s.allTimeStat}>
              <Text style={s.allTimeValue}>{stats.totalXP}</Text>
              <Text style={s.allTimeLabel}>Total XP</Text>
            </View>
            <View style={s.allTimeStat}>
              <Text style={s.allTimeValue}>{stats.level}</Text>
              <Text style={s.allTimeLabel}>Level</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: "#ECEDEE" },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  heroCard: { flexDirection: "row", backgroundColor: "#141825", borderRadius: 16, padding: 20, marginBottom: 24 },
  streakSection: { alignItems: "center", marginRight: 24 },
  streakEmoji: { fontSize: 32 },
  streakCount: { fontSize: 36, fontWeight: "800", color: "#FF6B35", marginTop: 4 },
  streakLabel: { fontSize: 11, color: "#9BA1A6", marginTop: 2 },
  levelSection: { flex: 1, justifyContent: "center" },
  levelText: { fontSize: 18, fontWeight: "700", color: "#ECEDEE", marginBottom: 8 },
  xpBar: { height: 8, backgroundColor: "#1C2235", borderRadius: 4, overflow: "hidden" },
  xpFill: { height: 8, backgroundColor: "#00AAFF", borderRadius: 4 },
  xpText: { fontSize: 11, color: "#9BA1A6", marginTop: 4 },
  totalXP: { fontSize: 11, color: "#687076", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#ECEDEE", marginBottom: 12 },
  goalsCard: { backgroundColor: "#141825", borderRadius: 16, padding: 16, marginBottom: 24 },
  overallProgress: { alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1C2235" },
  overallPercent: { fontSize: 28, fontWeight: "800", color: "#00AAFF" },
  overallLabel: { fontSize: 11, color: "#9BA1A6" },
  goalRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  goalIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(155,161,166,0.1)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  goalInfo: { flex: 1 },
  goalLabel: { fontSize: 13, fontWeight: "600", color: "#ECEDEE", marginBottom: 4 },
  goalBar: { height: 4, backgroundColor: "#1C2235", borderRadius: 2, overflow: "hidden" },
  goalFill: { height: 4, borderRadius: 2 },
  goalCount: { fontSize: 12, color: "#9BA1A6", marginLeft: 8, width: 30, textAlign: "right" },
  claimBtn: { backgroundColor: "#4CAF50", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  claimText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
  achievementsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  achievementCard: { width: (SCREEN_WIDTH - 52) / 3, backgroundColor: "#141825", borderRadius: 12, padding: 10, alignItems: "center" },
  achievementLocked: { opacity: 0.4 },
  achievementIcon: { fontSize: 24, marginBottom: 4 },
  achievementTitle: { fontSize: 11, fontWeight: "700", color: "#ECEDEE", textAlign: "center" },
  achievementDesc: { fontSize: 9, color: "#687076", textAlign: "center", marginTop: 2 },
  allTimeStats: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#141825", borderRadius: 12, padding: 16 },
  allTimeStat: { alignItems: "center" },
  allTimeValue: { fontSize: 22, fontWeight: "700", color: "#ECEDEE" },
  allTimeLabel: { fontSize: 11, color: "#9BA1A6", marginTop: 2 },
});
