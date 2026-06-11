import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";

const GOALS_KEY = "@linguavibe_daily_goals";
const GOAL_HISTORY_KEY = "@linguavibe_goal_history";

interface DailyGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  icon: string;
  color: string;
  completed: boolean;
}

const DEFAULT_GOALS: DailyGoal[] = [
  { id: "words", title: "Learn New Words", target: 10, current: 7, unit: "words", icon: "book", color: Colors.secondary, completed: false },
  { id: "minutes", title: "Study Time", target: 30, current: 22, unit: "min", icon: "time", color: Colors.gold, completed: false },
  { id: "flashcards", title: "Review Flashcards", target: 20, current: 20, unit: "cards", icon: "layers", color: Colors.success, completed: true },
  { id: "pronunciation", title: "Pronunciation Practice", target: 5, current: 3, unit: "words", icon: "mic", color: "#8B5CF6", completed: false },
  { id: "lessons", title: "Complete Lessons", target: 2, current: 1, unit: "lessons", icon: "play-circle", color: "#F472B6", completed: false },
];

const PRESET_GOALS = [
  { title: "Learn New Words", unit: "words", icon: "book", color: Colors.secondary, defaultTarget: 10 },
  { title: "Study Time", unit: "min", icon: "time", color: Colors.gold, defaultTarget: 30 },
  { title: "Review Flashcards", unit: "cards", icon: "layers", color: Colors.success, defaultTarget: 20 },
  { title: "Pronunciation Practice", unit: "words", icon: "mic", color: "#8B5CF6", defaultTarget: 5 },
  { title: "Complete Lessons", unit: "lessons", icon: "play-circle", color: "#F472B6", defaultTarget: 2 },
  { title: "Listen to Audio", unit: "min", icon: "headset", color: "#EC4899", defaultTarget: 15 },
  { title: "Write Sentences", unit: "sentences", icon: "create", color: "#14B8A6", defaultTarget: 5 },
  { title: "Watch Videos", unit: "videos", icon: "videocam", color: "#F59E0B", defaultTarget: 3 },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({ progress, size = 160, strokeWidth = 12, color = Colors.secondary }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(progress, 1), { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(0, 170, 255, 0.12)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function DailyGoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<DailyGoal[]>(DEFAULT_GOALS);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [customTarget, setCustomTarget] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState(7);
  const [todayDate] = useState(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const saved = await AsyncStorage.getItem(GOALS_KEY);
      if (saved) setGoals(JSON.parse(saved));
    } catch {}
  };

  const saveGoals = async (updated: DailyGoal[]) => {
    setGoals(updated);
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updated));
  };

  const totalProgress = goals.length > 0
    ? goals.reduce((sum, g) => sum + Math.min(g.current / g.target, 1), 0) / goals.length
    : 0;

  const completedCount = goals.filter(g => g.completed || g.current >= g.target).length;

  const handleAddGoal = () => {
    if (selectedPreset === null) return;
    const preset = PRESET_GOALS[selectedPreset];
    const target = parseInt(customTarget) || preset.defaultTarget;
    const newGoal: DailyGoal = {
      id: `custom_${Date.now()}`,
      title: preset.title,
      target,
      current: 0,
      unit: preset.unit,
      icon: preset.icon,
      color: preset.color,
      completed: false,
    };
    saveGoals([...goals, newGoal]);
    setShowAddGoal(false);
    setSelectedPreset(null);
    setCustomTarget("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleRemoveGoal = (id: string) => {
    Alert.alert("Remove Goal", "Remove this goal from your daily targets?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => saveGoals(goals.filter(g => g.id !== id)) },
    ]);
  };

  const handleIncrement = (id: string) => {
    const updated = goals.map(g => {
      if (g.id === id && g.current < g.target) {
        const newCurrent = g.current + 1;
        return { ...g, current: newCurrent, completed: newCurrent >= g.target };
      }
      return g;
    });
    saveGoals(updated);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleResetAll = () => {
    Alert.alert("Reset Goals", "Reset all progress for today?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => {
        const reset = goals.map(g => ({ ...g, current: 0, completed: false }));
        saveGoals(reset);
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Daily Goals</Text>
          <Text style={styles.headerDate}>{todayDate}</Text>
        </View>
        <TouchableOpacity onPress={handleResetAll} style={styles.resetBtn}>
          <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Progress Ring */}
        <View style={styles.ringSection}>
          <View style={styles.ringContainer}>
            <ProgressRing progress={totalProgress} size={180} strokeWidth={14} color={completedCount === goals.length ? Colors.success : Colors.secondary} />
            <View style={styles.ringCenter}>
              <Text style={styles.ringPercent}>{Math.round(totalProgress * 100)}%</Text>
              <Text style={styles.ringLabel}>{completedCount}/{goals.length} done</Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{streakDays} day streak</Text>
          </View>
        </View>

        {/* Motivational Banner */}
        {completedCount === goals.length && goals.length > 0 && (
          <View style={styles.completeBanner}>
            <Text style={styles.completeBannerEmoji}>🎉</Text>
            <View>
              <Text style={styles.completeBannerTitle}>All Goals Complete!</Text>
              <Text style={styles.completeBannerSub}>Amazing work today! +50 bonus XP earned</Text>
            </View>
          </View>
        )}

        {/* Goals List */}
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>Today's Targets</Text>
          {goals.map((goal) => {
            const progress = Math.min(goal.current / goal.target, 1);
            const isComplete = goal.current >= goal.target;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, isComplete && styles.goalCardComplete]}
                activeOpacity={0.7}
                onLongPress={() => handleRemoveGoal(goal.id)}
              >
                <View style={styles.goalLeft}>
                  <View style={[styles.goalIcon, { backgroundColor: `${goal.color}20` }]}>
                    <Ionicons name={goal.icon as any} size={20} color={goal.color} />
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalTitle, isComplete && styles.goalTitleComplete]}>
                      {goal.title}
                      {isComplete && " ✓"}
                    </Text>
                    <Text style={styles.goalProgress}>
                      {goal.current}/{goal.target} {goal.unit}
                    </Text>
                    <View style={styles.goalBar}>
                      <View style={[styles.goalBarFill, { width: `${progress * 100}%`, backgroundColor: goal.color }]} />
                    </View>
                  </View>
                </View>
                {!isComplete && (
                  <TouchableOpacity
                    style={[styles.incrementBtn, { borderColor: goal.color }]}
                    onPress={() => handleIncrement(goal.id)}
                  >
                    <Ionicons name="add" size={18} color={goal.color} />
                  </TouchableOpacity>
                )}
                {isComplete && (
                  <View style={[styles.checkBadge, { backgroundColor: goal.color }]}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add Goal */}
        {!showAddGoal ? (
          <TouchableOpacity style={styles.addGoalBtn} onPress={() => setShowAddGoal(true)}>
            <Ionicons name="add-circle-outline" size={22} color={Colors.secondary} />
            <Text style={styles.addGoalText}>Add New Goal</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addGoalForm}>
            <Text style={styles.addGoalFormTitle}>Choose a Goal</Text>
            <View style={styles.presetGrid}>
              {PRESET_GOALS.map((preset, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.presetChip, selectedPreset === i && { borderColor: preset.color, backgroundColor: `${preset.color}15` }]}
                  onPress={() => setSelectedPreset(i)}
                >
                  <Ionicons name={preset.icon as any} size={16} color={selectedPreset === i ? preset.color : Colors.textSecondary} />
                  <Text style={[styles.presetChipText, selectedPreset === i && { color: preset.color }]}>{preset.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedPreset !== null && (
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Daily target:</Text>
                <TextInput
                  style={styles.targetInput}
                  value={customTarget}
                  onChangeText={setCustomTarget}
                  placeholder={`${PRESET_GOALS[selectedPreset].defaultTarget}`}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                />
                <Text style={styles.targetUnit}>{PRESET_GOALS[selectedPreset].unit}</Text>
              </View>
            )}
            <View style={styles.addGoalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddGoal(false); setSelectedPreset(null); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, selectedPreset === null && { opacity: 0.4 }]}
                onPress={handleAddGoal}
                disabled={selectedPreset === null}
              >
                <Text style={styles.confirmBtnText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reminder Settings */}
        <View style={styles.reminderCard}>
          <View style={styles.reminderLeft}>
            <Ionicons name="notifications" size={20} color={Colors.gold} />
            <View>
              <Text style={styles.reminderTitle}>Daily Reminders</Text>
              <Text style={styles.reminderSub}>9:00 AM & 7:00 PM</Text>
            </View>
          </View>
          <View style={styles.reminderBadge}>
            <Text style={styles.reminderBadgeText}>ON</Text>
          </View>
        </View>

        {/* Weekly Summary */}
        <View style={styles.weeklyCard}>
          <Text style={styles.weeklyTitle}>This Week</Text>
          <View style={styles.weeklyRow}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
              const completed = i < 4; // Simulate 4 days completed
              const isToday = i === 4;
              return (
                <View key={i} style={styles.weeklyDay}>
                  <View style={[styles.weeklyDot, completed && styles.weeklyDotComplete, isToday && styles.weeklyDotToday]}>
                    {completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                    {isToday && <View style={styles.weeklyDotInner} />}
                  </View>
                  <Text style={[styles.weeklyDayText, isToday && { color: Colors.secondary }]}>{day}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.weeklySummary}>4/7 days completed • Keep it up!</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.textPrimary },
  headerDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  resetBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: Spacing.lg },
  ringSection: { alignItems: "center", paddingVertical: Spacing.xl },
  ringContainer: { position: "relative", alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringPercent: { fontSize: 36, fontWeight: "900", color: Colors.textPrimary },
  ringLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: Spacing.md, backgroundColor: Colors.surfaceCard, paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full },
  streakEmoji: { fontSize: 16 },
  streakText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.gold },
  completeBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(0, 255, 136, 0.08)", borderWidth: 1, borderColor: Colors.greenBorder, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  completeBannerEmoji: { fontSize: 28 },
  completeBannerTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.success },
  completeBannerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  goalsSection: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  goalCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  goalCardComplete: { borderColor: Colors.greenBorder, backgroundColor: "rgba(0, 255, 136, 0.04)" },
  goalLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  goalIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  goalTitleComplete: { color: Colors.success },
  goalProgress: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  goalBar: { height: 4, borderRadius: 2, backgroundColor: "rgba(0, 170, 255, 0.12)", marginTop: 6, overflow: "hidden" },
  goalBarFill: { height: "100%", borderRadius: 2 },
  incrementBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  checkBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  addGoalBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, borderStyle: "dashed", marginBottom: Spacing.lg },
  addGoalText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.secondary },
  addGoalForm: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  addGoalFormTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: Spacing.md },
  presetChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  presetChipText: { fontSize: FontSize.xs, fontWeight: "500", color: Colors.textSecondary },
  targetRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: Spacing.md },
  targetLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  targetInput: { width: 60, height: 36, borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceElevated, color: Colors.textPrimary, textAlign: "center", fontSize: FontSize.md, fontWeight: "700" },
  targetUnit: { fontSize: FontSize.sm, color: Colors.textSecondary },
  addGoalActions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceElevated, alignItems: "center" },
  cancelBtnText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary },
  confirmBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.sm, backgroundColor: Colors.secondary, alignItems: "center" },
  confirmBtnText: { fontSize: FontSize.sm, fontWeight: "700", color: "#fff" },
  reminderCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  reminderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  reminderTitle: { fontSize: FontSize.md, fontWeight: "600", color: Colors.textPrimary },
  reminderSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  reminderBadge: { backgroundColor: "rgba(0, 255, 136, 0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  reminderBadgeText: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.success },
  weeklyCard: { backgroundColor: Colors.surfaceCard, borderRadius: BorderRadius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  weeklyTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginBottom: Spacing.md },
  weeklyRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md },
  weeklyDay: { alignItems: "center", gap: 6 },
  weeklyDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
  weeklyDotComplete: { backgroundColor: Colors.success },
  weeklyDotToday: { borderWidth: 2, borderColor: Colors.secondary },
  weeklyDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary },
  weeklyDayText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: "600" },
  weeklySummary: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: "center" },
});
