import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";
import { getAnalyticsSummary } from "@/lib/exercise-analytics";
import { getDueCards } from "@/lib/spaced-repetition";

interface LearningSchedule {
  daysPerWeek: number;
  minutesPerDay: number;
  preferredTime: string;
}

interface DailyTask {
  id: string;
  icon: string;
  title: string;
  duration: string;
  route: string;
  completed: boolean;
}

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

export function DailyPlanWidget() {
  const [schedule, setSchedule] = useState<LearningSchedule | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const raw = await AsyncStorage.getItem("@learning_schedule");
      if (!raw) return;
      const parsed: LearningSchedule = JSON.parse(raw);
      setSchedule(parsed);

      // Check if today is a scheduled day
      const today = new Date().getDay(); // 0=Sun, 1=Mon...
      const scheduledDays = getScheduledDays(parsed.daysPerWeek);
      if (!scheduledDays.includes(today)) return;

      // Generate personalized tasks based on minutes per day + intelligence
      const generatedTasks = await generateTasks(parsed.minutesPerDay);
      
      // Check completion status
      const todayKey = `@daily_plan_${new Date().toISOString().split("T")[0]}`;
      const completedRaw = await AsyncStorage.getItem(todayKey);
      const completedIds: string[] = completedRaw ? JSON.parse(completedRaw) : [];
      
      const tasksWithStatus = generatedTasks.map(t => ({
        ...t,
        completed: completedIds.includes(t.id),
      }));
      setTasks(tasksWithStatus);
      setCompletedToday(completedIds.length);
    } catch {}
  };

  const getScheduledDays = (daysPerWeek: number): number[] => {
    // Spread days evenly across the week
    if (daysPerWeek >= 7) return [0, 1, 2, 3, 4, 5, 6];
    if (daysPerWeek >= 5) return [1, 2, 3, 4, 5]; // weekdays
    if (daysPerWeek >= 3) return [1, 3, 5]; // Mon, Wed, Fri
    return [1, 4]; // Mon, Thu
  };

  const generateTasks = async (minutes: number): Promise<DailyTask[]> => {
    // Check intelligence data to prioritize tasks
    let hasDueCards = false;
    let weakArea = "";
    try {
      const [dueCards, summary] = await Promise.all([getDueCards(), getAnalyticsSummary()]);
      hasDueCards = dueCards.length > 0;
      if (summary.byType) {
        const types = Object.entries(summary.byType);
        const weakest = types.sort((a: any, b: any) => (a[1].avgAccuracy || 100) - (b[1].avgAccuracy || 100))[0];
        if (weakest && (weakest[1] as any).avgAccuracy < 70) {
          weakArea = weakest[0];
        }
      }
    } catch {}

    const allTasks: DailyTask[] = [];

    // Prioritize SRS reviews if cards are due (a real teacher would say "do reviews first")
    if (hasDueCards) {
      allTasks.push({ id: "vocab", icon: "albums", title: "Review Due Cards", duration: "5 min", route: "/smart-practice", completed: false });
    }

    // If struggling, add targeted practice with personalized label
    if (weakArea) {
      const areaNames: Record<string, string> = { rrt: "Listening", dictation: "Dictation", whiteboard: "Writing", pronunciation: "Speaking" };
      allTasks.push({ id: "smart_practice", icon: "sparkles", title: `Extra ${areaNames[weakArea] || "Practice"} (you need this)`, duration: "7 min", route: "/smart-practice", completed: false });
    } else {
      allTasks.push({ id: "smart_practice", icon: "sparkles", title: "Personalized Practice", duration: "7 min", route: "/smart-practice", completed: false });
    }

    if (!hasDueCards) {
      allTasks.push({ id: "vocab", icon: "albums", title: "Vocabulary Review", duration: "5 min", route: "/srs-review", completed: false });
    }

    allTasks.push(
      { id: "lesson", icon: "book", title: "Daily Lesson", duration: "10 min", route: "/lessons", completed: false },
      { id: "listen", icon: "ear", title: "Listening Practice", duration: "5 min", route: "/lessons", completed: false },
      { id: "speak", icon: "mic", title: "Speaking Practice", duration: "5 min", route: "/practice-pronunciation", completed: false },
      { id: "teacher", icon: "person", title: "Chat With Your Teacher", duration: "10 min", route: "/(tabs)/teacher", completed: false },
      { id: "song", icon: "musical-notes", title: "Song Translation", duration: "5 min", route: "/(tabs)/songs", completed: false },
      { id: "culture", icon: "globe", title: "Cultural Insight", duration: "3 min", route: "/live-cultural-feed", completed: false },
    );

    // Select tasks based on available minutes
    const selected: DailyTask[] = [];
    let remaining = minutes;
    for (const task of allTasks) {
      const taskMinutes = parseInt(task.duration);
      if (remaining >= taskMinutes) {
        selected.push(task);
        remaining -= taskMinutes;
      }
      if (remaining <= 0) break;
    }
    return selected.length > 0 ? selected : [allTasks[0], allTasks[1]];
  };

  const markTaskComplete = async (taskId: string) => {
    const todayKey = `@daily_plan_${new Date().toISOString().split("T")[0]}`;
    const completedRaw = await AsyncStorage.getItem(todayKey);
    const completedIds: string[] = completedRaw ? JSON.parse(completedRaw) : [];
    
    if (!completedIds.includes(taskId)) {
      completedIds.push(taskId);
      await AsyncStorage.setItem(todayKey, JSON.stringify(completedIds));
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
    setCompletedToday(completedIds.length);
  };

  if (!schedule || tasks.length === 0) return null;

  const progress = tasks.length > 0 ? completedToday / tasks.length : 0;
  const timeLabel = TIME_LABELS[schedule.preferredTime] || "Today";
  const allDone = completedToday >= tasks.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={18} color={Colors.primary} />
          <Text style={styles.title}>Your {timeLabel} Plan</Text>
        </View>
        <Text style={styles.progress}>
          {completedToday}/{tasks.length} done
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Time reminder */}
      {!allDone && (
        <Text style={styles.reminder}>
          {schedule.minutesPerDay} min session • {schedule.daysPerWeek} days/week
        </Text>
      )}

      {allDone && (
        <View style={styles.doneRow}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.doneText}>All done for today! Great work.</Text>
        </View>
      )}

      {/* Tasks */}
      {!allDone && tasks.slice(0, 4).map((task) => (
        <TouchableOpacity
          key={task.id}
          style={[styles.taskRow, task.completed && styles.taskCompleted]}
          onPress={() => {
            if (!task.completed) {
              markTaskComplete(task.id);
            }
            router.push(task.route as any);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.taskIcon, task.completed && styles.taskIconDone]}>
            {task.completed ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : (
              <Ionicons name={task.icon as any} size={14} color={Colors.primary} />
            )}
          </View>
          <View style={styles.taskInfo}>
            <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
              {task.title}
            </Text>
            <Text style={styles.taskDuration}>{task.duration}</Text>
          </View>
          {!task.completed && (
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  progress: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  reminder: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  doneText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.success,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  taskCompleted: {
    opacity: 0.6,
  },
  taskIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  taskIconDone: {
    backgroundColor: Colors.success,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  taskDuration: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
