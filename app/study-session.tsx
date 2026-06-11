import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotificationScheduler } from "@/lib/notification-scheduler";

const STUDY_HISTORY_KEY = "@connectworld_study_history";
const STUDY_XP_KEY = "@connectworld_study_xp";
const FOCUS_GOAL_KEY = "@connectworld_focus_goal";
const FOCUS_STREAK_KEY = "@connectworld_focus_streak";

// Pomodoro presets
const PRESETS = [
  { label: "Quick", focusMin: 15, breakMin: 3, xpPerCycle: 30 },
  { label: "Classic", focusMin: 25, breakMin: 5, xpPerCycle: 50 },
  { label: "Deep", focusMin: 45, breakMin: 10, xpPerCycle: 90 },
  { label: "Marathon", focusMin: 60, breakMin: 15, xpPerCycle: 120 },
];

type SessionPhase = "idle" | "focus" | "break" | "complete";

interface SessionHistory {
  date: string;
  focusMinutes: number;
  cycles: number;
  xpEarned: number;
}

// Weekly Focus Chart Component
function WeeklyChart({ history }: { history: SessionHistory[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7; // Monday = 0

  // Aggregate focus minutes per day of the week (last 7 days)
  const weekData = days.map((label, i) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - (currentDayIndex - i));
    const dateStr = targetDate.toISOString().split("T")[0];
    const dayMinutes = history
      .filter((s) => s.date.startsWith(dateStr))
      .reduce((sum, s) => sum + s.focusMinutes, 0);
    return { label, minutes: dayMinutes, isToday: i === currentDayIndex };
  });

  const maxMinutes = Math.max(...weekData.map((d) => d.minutes), 30); // min 30 for scale
  const totalWeek = weekData.reduce((sum, d) => sum + d.minutes, 0);
  const avgDay = Math.round(totalWeek / 7);

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.headerRow}>
        <Text style={chartStyles.title}>This Week</Text>
        <Text style={chartStyles.subtitle}>{totalWeek}m total · {avgDay}m/day avg</Text>
      </View>
      <View style={chartStyles.chartRow}>
        {weekData.map((day, i) => {
          const barHeight = day.minutes > 0 ? Math.max((day.minutes / maxMinutes) * 100, 8) : 4;
          return (
            <View key={i} style={chartStyles.barCol}>
              <Text style={chartStyles.barValue}>
                {day.minutes > 0 ? `${day.minutes}` : ""}
              </Text>
              <View style={chartStyles.barTrack}>
                <View
                  style={[
                    chartStyles.barFill,
                    {
                      height: barHeight,
                      backgroundColor: day.isToday ? "#00AAFF" : day.minutes > 0 ? "#6366F1" : "rgba(255,255,255,0.06)",
                    },
                  ]}
                />
              </View>
              <Text style={[chartStyles.barLabel, day.isToday && { color: "#00AAFF", fontWeight: "700" }]}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#E2E8F0" },
  subtitle: { fontSize: 11, color: "#64748B" },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 130,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  barValue: {
    fontSize: 9,
    color: "#94A3B8",
    marginBottom: 4,
    fontWeight: "600",
  },
  barTrack: {
    flex: 1,
    width: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 10,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 6,
  },
});

export default function StudySessionScreen() {
  const { activateDND, deactivateDND, isDNDActive } = useNotificationScheduler();

  const [selectedPreset, setSelectedPreset] = useState(1); // Classic
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [timeRemaining, setTimeRemaining] = useState(0); // seconds
  const [totalFocusTime, setTotalFocusTime] = useState(0); // seconds accumulated
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(30); // minutes
  const [focusStreak, setFocusStreak] = useState(0);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const preset = PRESETS[selectedPreset];

  // Load history, XP, goal, and streak on mount
  useEffect(() => {
    loadHistory();
    loadTotalXP();
    loadGoalAndStreak();
  }, []);

  const loadGoalAndStreak = async () => {
    try {
      const goalStr = await AsyncStorage.getItem(FOCUS_GOAL_KEY);
      if (goalStr) setDailyGoal(parseInt(goalStr, 10));
      const streakStr = await AsyncStorage.getItem(FOCUS_STREAK_KEY);
      if (streakStr) setFocusStreak(parseInt(streakStr, 10));
    } catch {}
  };

  const updateDailyGoal = async (minutes: number) => {
    setDailyGoal(minutes);
    setShowGoalPicker(false);
    await AsyncStorage.setItem(FOCUS_GOAL_KEY, String(minutes));
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getTodayMinutes = (): number => {
    const todayStr = new Date().toISOString().split("T")[0];
    return history
      .filter((s) => s.date.startsWith(todayStr))
      .reduce((sum, s) => sum + s.focusMinutes, 0) + Math.round(totalFocusTime / 60);
  };

  const getGoalProgress = (): number => {
    return Math.min(getTodayMinutes() / dailyGoal, 1);
  };

  // Pulse animation during focus
  useEffect(() => {
    if (phase === "focus" && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);
    }
  }, [phase, isPaused]);

  // Timer countdown
  useEffect(() => {
    if ((phase === "focus" || phase === "break") && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          if (phase === "focus") {
            setTotalFocusTime((t) => t + 1);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isPaused]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STUDY_HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  };

  const loadTotalXP = async () => {
    try {
      const stored = await AsyncStorage.getItem(STUDY_XP_KEY);
      if (stored) setTotalXP(parseInt(stored, 10));
    } catch {}
  };

  const saveSession = async () => {
    const session: SessionHistory = {
      date: new Date().toISOString(),
      focusMinutes: Math.round(totalFocusTime / 60),
      cycles: cyclesCompleted,
      xpEarned,
    };
    const newHistory = [session, ...history].slice(0, 30); // Keep last 30
    setHistory(newHistory);
    const newTotalXP = totalXP + xpEarned;
    setTotalXP(newTotalXP);
    try {
      await AsyncStorage.setItem(STUDY_HISTORY_KEY, JSON.stringify(newHistory));
      await AsyncStorage.setItem(STUDY_XP_KEY, String(newTotalXP));
    } catch {}
  };

  const handlePhaseComplete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase === "focus") {
      // Focus phase complete → start break
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const earnedXP = preset.xpPerCycle;
      setCyclesCompleted((c) => c + 1);
      setXpEarned((x) => x + earnedXP);
      setPhase("break");
      setTimeRemaining(preset.breakMin * 60);
      animateProgress(preset.breakMin * 60);
    } else if (phase === "break") {
      // Break complete → back to focus
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setPhase("focus");
      setTimeRemaining(preset.focusMin * 60);
      animateProgress(preset.focusMin * 60);
    }
  }, [phase, preset]);

  const animateProgress = (totalSeconds: number) => {
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: totalSeconds * 1000,
      useNativeDriver: false,
    }).start();
  };

  const startSession = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    // Activate DND
    const totalSessionMinutes = (preset.focusMin + preset.breakMin) * 4; // Estimate 4 cycles
    await activateDND(totalSessionMinutes);

    setPhase("focus");
    setTimeRemaining(preset.focusMin * 60);
    setTotalFocusTime(0);
    setCyclesCompleted(0);
    setXpEarned(0);
    setIsPaused(false);
    animateProgress(preset.focusMin * 60);
  };

  const pauseSession = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resumeSession = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsPaused(false);
  };

  const endSession = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("complete");
    await deactivateDND();
    await saveSession();
  };

  const resetSession = () => {
    setPhase("idle");
    setTimeRemaining(0);
    setTotalFocusTime(0);
    setCyclesCompleted(0);
    setXpEarned(0);
    setIsPaused(false);
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "focus": return "#00AAFF";
      case "break": return "#22C55E";
      case "complete": return "#EAB308";
      default: return "#6366F1";
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case "focus": return "FOCUS";
      case "break": return "BREAK";
      case "complete": return "COMPLETE";
      default: return "READY";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Session</Text>
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={14} color="#EAB308" />
          <Text style={styles.xpBadgeText}>{totalXP} XP</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Timer Display */}
        <View style={styles.timerSection}>
          <Animated.View
            style={[
              styles.timerCircle,
              {
                borderColor: getPhaseColor(),
                transform: [{ scale: pulseAnim }],
                opacity: phase === "idle" ? 0.6 : 1,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.timerGlow,
                {
                  backgroundColor: getPhaseColor(),
                  opacity: glowAnim,
                },
              ]}
            />
            <View style={styles.timerInner}>
              <Text style={[styles.phaseLabel, { color: getPhaseColor() }]}>
                {getPhaseLabel()}
              </Text>
              <Text style={styles.timerText}>
                {phase === "idle" ? formatTime(preset.focusMin * 60) : formatTime(timeRemaining)}
              </Text>
              {phase !== "idle" && phase !== "complete" && (
                <Text style={styles.cycleText}>
                  Cycle {cyclesCompleted + (phase === "focus" ? 1 : 0)}
                </Text>
              )}
              {phase === "complete" && (
                <Text style={styles.completeText}>Great work!</Text>
              )}
            </View>
          </Animated.View>

          {/* DND Active Indicator */}
          {isDNDActive() && phase !== "idle" && (
            <View style={styles.dndBanner}>
              <Ionicons name="moon" size={14} color="#6366F1" />
              <Text style={styles.dndBannerText}>Do Not Disturb Active</Text>
            </View>
          )}
        </View>

        {/* Daily Goal Progress Ring */}
        {phase === "idle" && (
          <View style={styles.goalSection}>
            <View style={styles.goalRingContainer}>
              <View style={styles.goalRingOuter}>
                <View
                  style={[
                    styles.goalRingFill,
                    {
                      transform: [{ rotate: `${getGoalProgress() * 360}deg` }],
                      borderTopColor: getGoalProgress() >= 1 ? "#22C55E" : "#6366F1",
                      borderRightColor: getGoalProgress() >= 0.5 ? (getGoalProgress() >= 1 ? "#22C55E" : "#6366F1") : "transparent",
                    },
                  ]}
                />
              </View>
              <View style={styles.goalRingInner}>
                <Text style={styles.goalRingValue}>{getTodayMinutes()}</Text>
                <Text style={styles.goalRingLabel}>/ {dailyGoal}m</Text>
              </View>
            </View>
            <View style={styles.goalInfo}>
              <TouchableOpacity onPress={() => setShowGoalPicker(!showGoalPicker)} style={styles.goalEditBtn}>
                <Text style={styles.goalEditText}>Daily Goal: {dailyGoal}m</Text>
                <Ionicons name="pencil" size={12} color="#64748B" />
              </TouchableOpacity>
              {focusStreak > 0 && (
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={14} color="#F97316" />
                  <Text style={styles.streakText}>{focusStreak} day streak</Text>
                </View>
              )}
              {getGoalProgress() >= 1 && (
                <View style={styles.goalMetBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                  <Text style={styles.goalMetText}>Goal met today!</Text>
                </View>
              )}
            </View>
            {showGoalPicker && (
              <View style={styles.goalPickerRow}>
                {[15, 30, 45, 60, 90, 120].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.goalPickerChip, m === dailyGoal && styles.goalPickerChipActive]}
                    onPress={() => updateDailyGoal(m)}
                  >
                    <Text style={[styles.goalPickerChipText, m === dailyGoal && styles.goalPickerChipTextActive]}>
                      {m}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Session Stats */}
        {phase !== "idle" && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color="#00AAFF" />
              <Text style={styles.statValue}>{Math.round(totalFocusTime / 60)}m</Text>
              <Text style={styles.statLabel}>Focus</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="refresh-outline" size={16} color="#22C55E" />
              <Text style={styles.statValue}>{cyclesCompleted}</Text>
              <Text style={styles.statLabel}>Cycles</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star-outline" size={16} color="#EAB308" />
              <Text style={styles.statValue}>+{xpEarned}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {phase === "idle" && (
            <>
              {/* Preset Selection */}
              <View style={styles.presetRow}>
                {PRESETS.map((p, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.presetChip, i === selectedPreset && styles.presetChipActive]}
                    onPress={() => setSelectedPreset(i)}
                  >
                    <Text style={[styles.presetChipText, i === selectedPreset && styles.presetChipTextActive]}>
                      {p.label}
                    </Text>
                    <Text style={[styles.presetChipSub, i === selectedPreset && styles.presetChipSubActive]}>
                      {p.focusMin}m / {p.breakMin}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Start Button */}
              <TouchableOpacity style={styles.startBtn} onPress={startSession} activeOpacity={0.8}>
                <Ionicons name="play" size={24} color="#fff" />
                <Text style={styles.startBtnText}>Start Focus Session</Text>
              </TouchableOpacity>

              <Text style={styles.startHint}>
                DND will activate automatically. Earn {preset.xpPerCycle} XP per cycle.
              </Text>

              <TouchableOpacity
                style={styles.leaderboardBtn}
                onPress={() => router.push("/focus-leaderboard" as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="trophy" size={16} color="#FFD700" />
                <Text style={styles.leaderboardBtnText}>View Focus Leaderboard</Text>
                <Ionicons name="chevron-forward" size={14} color="#64748B" />
              </TouchableOpacity>
            </>
          )}

          {(phase === "focus" || phase === "break") && (
            <View style={styles.activeControls}>
              {isPaused ? (
                <TouchableOpacity style={styles.resumeBtn} onPress={resumeSession}>
                  <Ionicons name="play" size={20} color="#fff" />
                  <Text style={styles.resumeBtnText}>Resume</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.pauseBtn} onPress={pauseSession}>
                  <Ionicons name="pause" size={20} color="#fff" />
                  <Text style={styles.pauseBtnText}>Pause</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.endBtn} onPress={endSession}>
                <Ionicons name="stop" size={20} color="#EF4444" />
                <Text style={styles.endBtnText}>End Session</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === "complete" && (
            <View style={styles.completeSection}>
              <View style={styles.rewardCard}>
                <Ionicons name="trophy" size={32} color="#EAB308" />
                <Text style={styles.rewardTitle}>Session Complete!</Text>
                <Text style={styles.rewardDesc}>
                  {Math.round(totalFocusTime / 60)} minutes focused · {cyclesCompleted} cycles
                </Text>
                <View style={styles.xpReward}>
                  <Ionicons name="star" size={18} color="#EAB308" />
                  <Text style={styles.xpRewardText}>+{xpEarned} XP Earned</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.newSessionBtn} onPress={resetSession}>
                <Ionicons name="refresh" size={18} color="#00AAFF" />
                <Text style={styles.newSessionText}>New Session</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Weekly Focus Chart */}
        {phase === "idle" && (
          <WeeklyChart history={history} />
        )}

        {/* History */}
        {history.length > 0 && phase === "idle" && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Sessions</Text>
            {history.slice(0, 7).map((session, i) => {
              const date = new Date(session.date);
              const dayStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              return (
                <View key={i} style={styles.historyRow}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{dayStr}</Text>
                    <Text style={styles.historyDetail}>
                      {session.focusMinutes}m · {session.cycles} cycles
                    </Text>
                  </View>
                  <View style={styles.historyXP}>
                    <Ionicons name="star" size={12} color="#EAB308" />
                    <Text style={styles.historyXPText}>+{session.xpEarned}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Tips */}
        {phase === "idle" && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Focus Tips</Text>
            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
              <Text style={styles.tipText}>
                The Pomodoro Technique: 25 minutes of focused work followed by a 5-minute break improves retention by up to 40%.
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="phone-portrait-outline" size={16} color="#F59E0B" />
              <Text style={styles.tipText}>
                DND activates automatically so you won't be interrupted. All notifications are saved for when you finish.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060912" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 170, 255, 0.1)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(234, 179, 8, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.3)",
  },
  xpBadgeText: { fontSize: 12, fontWeight: "700", color: "#EAB308" },
  scrollContent: { paddingBottom: 40 },
  timerSection: { alignItems: "center", paddingVertical: 32 },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  timerGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  timerInner: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "200",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  cycleText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  completeText: {
    fontSize: 14,
    color: "#EAB308",
    fontWeight: "600",
    marginTop: 4,
  },
  dndBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  dndBannerText: { fontSize: 12, color: "#A5B4FC", fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statItem: { alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontWeight: "700", color: "#fff" },
  statLabel: { fontSize: 11, color: "#64748B" },
  controls: { paddingHorizontal: 16 },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  presetChipActive: {
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    borderColor: "#00AAFF",
  },
  presetChipText: { fontSize: 12, fontWeight: "700", color: "#94A3B8" },
  presetChipTextActive: { color: "#fff" },
  presetChipSub: { fontSize: 10, color: "#475569", marginTop: 2 },
  presetChipSubActive: { color: "#00AAFF" },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#00AAFF",
  },
  startBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  startHint: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 10,
  },
  activeControls: {
    flexDirection: "row",
    gap: 12,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  pauseBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  resumeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(0, 170, 255, 0.2)",
    borderWidth: 1,
    borderColor: "#00AAFF",
  },
  resumeBtnText: { fontSize: 14, fontWeight: "600", color: "#00AAFF" },
  endBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  endBtnText: { fontSize: 14, fontWeight: "600", color: "#EF4444" },
  completeSection: { alignItems: "center", gap: 16 },
  rewardCard: {
    width: "100%",
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: "rgba(234, 179, 8, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(234, 179, 8, 0.2)",
    gap: 8,
  },
  rewardTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  rewardDesc: { fontSize: 13, color: "#94A3B8" },
  xpReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(234, 179, 8, 0.15)",
  },
  xpRewardText: { fontSize: 16, fontWeight: "700", color: "#EAB308" },
  newSessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 170, 255, 0.3)",
  },
  newSessionText: { fontSize: 14, fontWeight: "600", color: "#00AAFF" },
  historySection: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  historyTitle: { fontSize: 15, fontWeight: "700", color: "#E2E8F0", marginBottom: 12 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  historyLeft: {},
  historyDate: { fontSize: 13, fontWeight: "600", color: "#E2E8F0" },
  historyDetail: { fontSize: 11, color: "#64748B", marginTop: 2 },
  historyXP: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyXPText: { fontSize: 12, fontWeight: "600", color: "#EAB308" },
  tipsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  tipsTitle: { fontSize: 15, fontWeight: "700", color: "#E2E8F0", marginBottom: 10 },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(245, 158, 11, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.1)",
    marginBottom: 8,
  },
  tipText: { flex: 1, fontSize: 12, color: "#94A3B8", lineHeight: 18 },
  // Goal Section
  goalSection: {
    marginTop: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  goalRingContainer: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  goalRingOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: "rgba(99, 102, 241, 0.15)",
    position: "absolute",
  },
  goalRingFill: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: "transparent",
    position: "absolute",
  },
  goalRingInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  goalRingValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E2E8F0",
  },
  goalRingLabel: {
    fontSize: 10,
    color: "#64748B",
  },
  goalInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 6,
  },
  goalEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  goalEditText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F97316",
  },
  goalMetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  goalMetText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
  },
  goalPickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    width: "100%",
  },
  goalPickerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  goalPickerChipActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "#6366F1",
  },
  goalPickerChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  goalPickerChipTextActive: {
    color: "#6366F1",
  },
  leaderboardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 215, 0, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)",
  },
  leaderboardBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E2E8F0",
  },
});
