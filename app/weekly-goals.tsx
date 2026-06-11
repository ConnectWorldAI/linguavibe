/**
 * Weekly Goals Screen
 * 
 * Users set personal weekly targets (e.g., "Fix 3 error patterns", "Study 30 min/day")
 * and the report card grades against those personal goals.
 */
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

// ─── Types ──────────────────────────────────────────────────────────────────

export type GoalCategory =
  | "error_patterns"
  | "study_time"
  | "sessions"
  | "accuracy"
  | "flashcards"
  | "conversations"
  | "drills"
  | "streak"
  | "lessons"
  | "mastery"
  | "custom";

export interface WeeklyGoal {
  id: string;
  category: GoalCategory;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  icon: string;
  color: string;
  createdAt: string;
  weekStartDate: string;
  completed: boolean;
}

export interface GoalHistory {
  weekStartDate: string;
  weekEndDate: string;
  goals: WeeklyGoal[];
  overallScore: number; // 0-100
  grade: string;
}

interface GoalTemplate {
  category: GoalCategory;
  title: string;
  defaultTarget: number;
  unit: string;
  icon: string;
  color: string;
  description: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GOALS_KEY = "@weekly_goals_current";
const GOAL_HISTORY_KEY = "@weekly_goals_history";

const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    category: "error_patterns",
    title: "Fix Error Patterns",
    defaultTarget: 3,
    unit: "patterns",
    icon: "git-merge-outline",
    color: Colors.success,
    description: "Resolve recurring mistakes through targeted drills",
  },
  {
    category: "study_time",
    title: "Daily Study Time",
    defaultTarget: 30,
    unit: "min/day",
    icon: "time-outline",
    color: Colors.secondary,
    description: "Average daily study time across the week",
  },
  {
    category: "sessions",
    title: "Complete Sessions",
    defaultTarget: 7,
    unit: "sessions",
    icon: "calendar-outline",
    color: "#8B5CF6",
    description: "Total learning sessions this week",
  },
  {
    category: "accuracy",
    title: "Maintain Accuracy",
    defaultTarget: 80,
    unit: "%",
    icon: "checkmark-circle-outline",
    color: "#3B82F6",
    description: "Keep your average accuracy above this threshold",
  },
  {
    category: "flashcards",
    title: "Review Flashcards",
    defaultTarget: 50,
    unit: "cards",
    icon: "albums-outline",
    color: Colors.gold,
    description: "Total flashcards reviewed this week",
  },
  {
    category: "conversations",
    title: "Conversation Practice",
    defaultTarget: 15,
    unit: "minutes",
    icon: "chatbubbles-outline",
    color: "#EC4899",
    description: "Minutes spent in AI conversation practice",
  },
  {
    category: "drills",
    title: "Complete Drills",
    defaultTarget: 5,
    unit: "drills",
    icon: "fitness-outline",
    color: "#F97316",
    description: "Targeted drill sessions completed",
  },
  {
    category: "streak",
    title: "Maintain Streak",
    defaultTarget: 7,
    unit: "days",
    icon: "flame-outline",
    color: "#EF4444",
    description: "Keep your daily learning streak alive",
  },
  {
    category: "lessons",
    title: "Complete Lessons",
    defaultTarget: 3,
    unit: "lessons",
    icon: "book-outline",
    color: "#06B6D4",
    description: "Structured lessons completed this week",
  },
  {
    category: "mastery",
    title: "Increase Mastery",
    defaultTarget: 5,
    unit: "% gain",
    icon: "trending-up-outline",
    color: "#10B981",
    description: "Increase your overall mastery score by this amount",
  },
];

// ─── Storage Functions ──────────────────────────────────────────────────────

export async function getCurrentGoals(): Promise<WeeklyGoal[]> {
  try {
    const data = await AsyncStorage.getItem(GOALS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveCurrentGoals(goals: WeeklyGoal[]): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export async function getGoalHistory(): Promise<GoalHistory[]> {
  try {
    const data = await AsyncStorage.getItem(GOAL_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveGoalHistory(history: GoalHistory[]): Promise<void> {
  await AsyncStorage.setItem(GOAL_HISTORY_KEY, JSON.stringify(history));
}

/**
 * Grade goals for the current week. Called by the weekly report system.
 */
export function gradeGoals(goals: WeeklyGoal[]): { score: number; grade: string } {
  if (goals.length === 0) return { score: 0, grade: "N/A" };

  let totalProgress = 0;
  for (const goal of goals) {
    const progress = Math.min(goal.currentValue / goal.targetValue, 1.5); // Cap at 150%
    totalProgress += progress;
  }
  const avgProgress = totalProgress / goals.length;
  const score = Math.round(avgProgress * 100);

  let grade = "F";
  if (score >= 95) grade = "A+";
  else if (score >= 85) grade = "A";
  else if (score >= 78) grade = "B+";
  else if (score >= 70) grade = "B";
  else if (score >= 62) grade = "C+";
  else if (score >= 55) grade = "C";
  else if (score >= 40) grade = "D";

  return { score, grade };
}

// ─── Components ─────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onRemove,
  onUpdateTarget,
}: {
  goal: WeeklyGoal;
  onRemove: () => void;
  onUpdateTarget: (newTarget: number) => void;
}) {
  const progress = Math.min(goal.currentValue / goal.targetValue, 1);
  const progressPercent = Math.round(progress * 100);
  const isComplete = goal.currentValue >= goal.targetValue;

  return (
    <View style={[styles.goalCard, isComplete && styles.goalCardComplete]}>
      <View style={styles.goalHeader}>
        <View style={[styles.goalIconBg, { backgroundColor: goal.color + "20" }]}>
          <Ionicons name={goal.icon as any} size={20} color={goal.color} />
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalTarget}>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} activeOpacity={0.7} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(progressPercent, 100)}%`,
              backgroundColor: isComplete ? Colors.success : goal.color,
            },
          ]}
        />
      </View>

      <View style={styles.goalFooter}>
        <Text style={[styles.goalPercent, { color: isComplete ? Colors.success : goal.color }]}>
          {progressPercent}%
        </Text>
        {isComplete && (
          <View style={styles.completeBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.completeText}>Done!</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function GoalTemplateCard({
  template,
  onAdd,
  isAdded,
}: {
  template: GoalTemplate;
  onAdd: (target: number) => void;
  isAdded: boolean;
}) {
  const [customTarget, setCustomTarget] = useState(String(template.defaultTarget));
  const [showInput, setShowInput] = useState(false);

  return (
    <View style={[styles.templateCard, isAdded && styles.templateCardAdded]}>
      <View style={styles.templateHeader}>
        <View style={[styles.goalIconBg, { backgroundColor: template.color + "20" }]}>
          <Ionicons name={template.icon as any} size={18} color={template.color} />
        </View>
        <View style={styles.templateInfo}>
          <Text style={styles.templateTitle}>{template.title}</Text>
          <Text style={styles.templateDesc}>{template.description}</Text>
        </View>
      </View>

      {!isAdded && (
        <View style={styles.templateActions}>
          {showInput ? (
            <View style={styles.targetInputRow}>
              <TextInput
                style={styles.targetInput}
                value={customTarget}
                onChangeText={setCustomTarget}
                keyboardType="numeric"
                returnKeyType="done"
                placeholder={String(template.defaultTarget)}
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.targetUnit}>{template.unit}</Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: template.color }]}
                onPress={() => {
                  const target = parseInt(customTarget) || template.defaultTarget;
                  onAdd(target);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.setGoalBtn, { borderColor: template.color }]}
              onPress={() => setShowInput(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={14} color={template.color} />
              <Text style={[styles.setGoalText, { color: template.color }]}>Set Goal</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isAdded && (
        <View style={styles.addedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={styles.addedText}>Active</Text>
        </View>
      )}
    </View>
  );
}

function HistoryCard({ entry }: { entry: GoalHistory }) {
  const startDate = new Date(entry.weekStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endDate = new Date(entry.weekEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const completedGoals = entry.goals.filter(g => g.currentValue >= g.targetValue).length;

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{startDate} – {endDate}</Text>
        <Text style={[styles.historyGrade, { color: gradeColor(entry.grade) }]}>{entry.grade}</Text>
      </View>
      <View style={styles.historyStats}>
        <Text style={styles.historyStat}>{completedGoals}/{entry.goals.length} goals met</Text>
        <Text style={styles.historyStat}>Score: {entry.overallScore}%</Text>
      </View>
    </View>
  );
}

function gradeColor(grade: string): string {
  if (grade === "A+" || grade === "A") return Colors.success;
  if (grade === "B+" || grade === "B") return "#3B82F6";
  if (grade === "C+" || grade === "C") return Colors.gold;
  if (grade === "D") return "#F97316";
  return Colors.error;
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function WeeklyGoalsScreen() {
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [history, setHistory] = useState<GoalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"current" | "add" | "history" | "settings">("current");
  const [notifPrefs, setNotifPrefs] = useState({
    enabled: true,
    dailyReminder: true,
    midWeekNudge: true,
    finalPush: true,
    celebration: true,
    reminderHour: 19,
    reminderMinute: 0,
  });
  const [notifLoaded, setNotifLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [currentGoals, goalHistory] = await Promise.all([
        getCurrentGoals(),
        getGoalHistory(),
      ]);
      setGoals(currentGoals);
      setHistory(goalHistory);
    } catch (err) {
      console.warn("Failed to load goals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadNotifPrefs();
  }, [loadData]);

  const loadNotifPrefs = async () => {
    try {
      const { getGoalNotificationPrefs } = await import("@/lib/weekly-goals-notifications");
      const prefs = await getGoalNotificationPrefs();
      setNotifPrefs(prefs);
    } catch {}
    setNotifLoaded(true);
  };

  const updateNotifPref = async (key: string, value: any) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    try {
      const { setGoalNotificationPrefs } = await import("@/lib/weekly-goals-notifications");
      await setGoalNotificationPrefs({ [key]: value });
    } catch {}
  };

  const addGoal = useCallback(async (template: GoalTemplate, target: number) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)

    const newGoal: WeeklyGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category: template.category,
      title: template.title,
      targetValue: target,
      currentValue: 0,
      unit: template.unit,
      icon: template.icon,
      color: template.color,
      createdAt: now.toISOString(),
      weekStartDate: weekStart.toISOString(),
      completed: false,
    };

    const updated = [...goals, newGoal];
    setGoals(updated);
    await saveCurrentGoals(updated);
    // Schedule goal reminder notifications
    try {
      const { scheduleGoalReminders } = await import("@/lib/weekly-goals-notifications");
      await scheduleGoalReminders();
    } catch {}
    setActiveTab("current");
  }, [goals]);

  const removeGoal = useCallback(async (goalId: string) => {
    if (Platform.OS === "web") {
      const updated = goals.filter(g => g.id !== goalId);
      setGoals(updated);
      await saveCurrentGoals(updated);
      // Reschedule notifications
      try {
        const { scheduleGoalReminders, cancelAllGoalReminders } = await import("@/lib/weekly-goals-notifications");
        if (updated.length > 0) await scheduleGoalReminders();
        else await cancelAllGoalReminders();
      } catch {}
    } else {
      Alert.alert("Remove Goal", "Are you sure you want to remove this goal?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const updated = goals.filter(g => g.id !== goalId);
            setGoals(updated);
            await saveCurrentGoals(updated);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Reschedule notifications
            try {
              const { scheduleGoalReminders, cancelAllGoalReminders } = await import("@/lib/weekly-goals-notifications");
              if (updated.length > 0) await scheduleGoalReminders();
              else await cancelAllGoalReminders();
            } catch {}
          },
        },
      ]);
    }
  }, [goals]);

  const { score, grade } = gradeGoals(goals);
  const activeCategories = new Set(goals.map(g => g.category));

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Weekly Goals</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(["current", "add", "history", "settings"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "current" ? "My Goals" : tab === "add" ? "Add Goal" : tab === "history" ? "History" : "\u2699\uFE0F"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Current Goals Tab */}
          {activeTab === "current" && (
            <>
              {/* Score Card */}
              {goals.length > 0 && (
                <View style={styles.scoreCard}>
                  <View style={styles.scoreHeader}>
                    <Text style={styles.scoreTitle}>This Week's Progress</Text>
                    <Text style={[styles.scoreGrade, { color: gradeColor(grade) }]}>{grade}</Text>
                  </View>
                  <View style={styles.scoreBarBg}>
                    <View style={[styles.scoreBarFill, { width: `${Math.min(score, 100)}%` }]} />
                  </View>
                  <Text style={styles.scoreText}>{score}% of goals met</Text>
                </View>
              )}

              {/* Goals List */}
              {goals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="flag-outline" size={56} color={Colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No Goals Set</Text>
                  <Text style={styles.emptySubtext}>
                    Set weekly targets to track your progress and get graded on your report card.
                  </Text>
                  <TouchableOpacity
                    style={styles.addGoalCta}
                    onPress={() => setActiveTab("add")}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={styles.addGoalCtaText}>Add Your First Goal</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {goals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onRemove={() => removeGoal(goal.id)}
                      onUpdateTarget={() => {}}
                    />
                  ))}
                  <TouchableOpacity
                    style={styles.addMoreBtn}
                    onPress={() => setActiveTab("add")}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={Colors.secondary} />
                    <Text style={styles.addMoreText}>Add Another Goal</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {/* Add Goal Tab */}
          {activeTab === "add" && (
            <>
              <Text style={styles.sectionTitle}>Choose a Goal</Text>
              <Text style={styles.sectionSubtext}>
                Pick from templates below and set your own target. Goals reset each week.
              </Text>
              {GOAL_TEMPLATES.map((template) => (
                <GoalTemplateCard
                  key={template.category}
                  template={template}
                  onAdd={(target) => addGoal(template, target)}
                  isAdded={activeCategories.has(template.category)}
                />
              ))}
            </>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <>
              {history.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={56} color={Colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No History Yet</Text>
                  <Text style={styles.emptySubtext}>
                    Your weekly goal results will appear here after each week ends.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Goal History</Text>
                  {history.map((entry, idx) => (
                    <HistoryCard key={idx} entry={entry} />
                  ))}
                </>
              )}
            </>
          )}

          {/* Settings/Notification Preferences Tab */}
          {activeTab === "settings" && (
            <>
              <Text style={styles.sectionTitle}>Notification Preferences</Text>
              <View style={notifStyles.card}>
                <View style={notifStyles.row}>
                  <View style={notifStyles.rowLeft}>
                    <Ionicons name="notifications" size={20} color={Colors.secondary} />
                    <View>
                      <Text style={notifStyles.rowTitle}>Goal Reminders</Text>
                      <Text style={notifStyles.rowDesc}>Enable all goal notifications</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[notifStyles.toggle, notifPrefs.enabled && notifStyles.toggleOn]}
                    onPress={() => updateNotifPref("enabled", !notifPrefs.enabled)}
                    activeOpacity={0.7}
                  >
                    <View style={[notifStyles.toggleKnob, notifPrefs.enabled && notifStyles.toggleKnobOn]} />
                  </TouchableOpacity>
                </View>

                {notifPrefs.enabled && (
                  <>
                    <View style={notifStyles.divider} />
                    <View style={notifStyles.row}>
                      <View style={notifStyles.rowLeft}>
                        <Ionicons name="today" size={18} color={Colors.textSecondary} />
                        <View>
                          <Text style={notifStyles.rowTitle}>Daily Progress</Text>
                          <Text style={notifStyles.rowDesc}>Evening check-in on your goals</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[notifStyles.toggle, notifPrefs.dailyReminder && notifStyles.toggleOn]}
                        onPress={() => updateNotifPref("dailyReminder", !notifPrefs.dailyReminder)}
                        activeOpacity={0.7}
                      >
                        <View style={[notifStyles.toggleKnob, notifPrefs.dailyReminder && notifStyles.toggleKnobOn]} />
                      </TouchableOpacity>
                    </View>

                    <View style={notifStyles.divider} />
                    <View style={notifStyles.row}>
                      <View style={notifStyles.rowLeft}>
                        <Ionicons name="calendar" size={18} color={Colors.textSecondary} />
                        <View>
                          <Text style={notifStyles.rowTitle}>Mid-Week Nudge</Text>
                          <Text style={notifStyles.rowDesc}>Wednesday progress check</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[notifStyles.toggle, notifPrefs.midWeekNudge && notifStyles.toggleOn]}
                        onPress={() => updateNotifPref("midWeekNudge", !notifPrefs.midWeekNudge)}
                        activeOpacity={0.7}
                      >
                        <View style={[notifStyles.toggleKnob, notifPrefs.midWeekNudge && notifStyles.toggleKnobOn]} />
                      </TouchableOpacity>
                    </View>

                    <View style={notifStyles.divider} />
                    <View style={notifStyles.row}>
                      <View style={notifStyles.rowLeft}>
                        <Ionicons name="flag" size={18} color={Colors.textSecondary} />
                        <View>
                          <Text style={notifStyles.rowTitle}>Final Push</Text>
                          <Text style={notifStyles.rowDesc}>Saturday reminder before week resets</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[notifStyles.toggle, notifPrefs.finalPush && notifStyles.toggleOn]}
                        onPress={() => updateNotifPref("finalPush", !notifPrefs.finalPush)}
                        activeOpacity={0.7}
                      >
                        <View style={[notifStyles.toggleKnob, notifPrefs.finalPush && notifStyles.toggleKnobOn]} />
                      </TouchableOpacity>
                    </View>

                    <View style={notifStyles.divider} />
                    <View style={notifStyles.row}>
                      <View style={notifStyles.rowLeft}>
                        <Ionicons name="trophy" size={18} color={Colors.textSecondary} />
                        <View>
                          <Text style={notifStyles.rowTitle}>Celebration</Text>
                          <Text style={notifStyles.rowDesc}>Notify when all goals are hit</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[notifStyles.toggle, notifPrefs.celebration && notifStyles.toggleOn]}
                        onPress={() => updateNotifPref("celebration", !notifPrefs.celebration)}
                        activeOpacity={0.7}
                      >
                        <View style={[notifStyles.toggleKnob, notifPrefs.celebration && notifStyles.toggleKnobOn]} />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              {notifPrefs.enabled && (
                <View style={notifStyles.card}>
                  <Text style={notifStyles.timeTitle}>Reminder Time</Text>
                  <Text style={notifStyles.timeDesc}>When should we send daily reminders?</Text>
                  <View style={notifStyles.timeRow}>
                    {[17, 18, 19, 20, 21].map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          notifStyles.timeChip,
                          notifPrefs.reminderHour === hour && notifStyles.timeChipActive,
                        ]}
                        onPress={() => updateNotifPref("reminderHour", hour)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            notifStyles.timeChipText,
                            notifPrefs.reminderHour === hour && notifStyles.timeChipTextActive,
                          ]}
                        >
                          {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.secondary + "20",
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.secondary,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: Spacing.md,
  },
  // Score Card
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  scoreTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  scoreGrade: {
    fontSize: FontSize.xl,
    fontWeight: "800",
  },
  scoreBarBg: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  scoreBarFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  // Goal Card
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalCardComplete: {
    borderColor: Colors.success + "40",
    backgroundColor: Colors.success + "08",
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.sm,
  },
  goalIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  goalTarget: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  removeBtn: {
    padding: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalPercent: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  completeText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: "600",
  },
  // Template Card
  templateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateCardAdded: {
    opacity: 0.6,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  templateDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  templateActions: {
    marginTop: 4,
  },
  targetInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  targetInput: {
    flex: 1,
    height: 36,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    fontSize: FontSize.sm,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetUnit: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  setGoalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  setGoalText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  addedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  addedText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: "500",
  },
  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  addGoalCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  addGoalCtaText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "#fff",
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  addMoreText: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.secondary,
  },
  // Section
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  // History
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyDate: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  historyGrade: {
    fontSize: FontSize.lg,
    fontWeight: "800",
  },
  historyStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  historyStat: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});


// ─── Notification Preferences Styles ────────────────────────────────────────

const notifStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  rowDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: Colors.secondary,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  toggleKnobOn: {
    alignSelf: "flex-end",
  },
  timeTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  timeDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeChipActive: {
    backgroundColor: Colors.secondary + "20",
    borderColor: Colors.secondary,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  timeChipTextActive: {
    color: Colors.secondary,
  },
});
