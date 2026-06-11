import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { trpc } from "@/lib/trpc";

const Colors = {
  bg: "#0A0A0F",
  surface: "#14141A",
  surfaceCard: "#1C1C24",
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  secondary: "#6366F1",
  gold: "#F59E0B",
  success: "#22C55E",
  error: "#EF4444",
  border: "#2A2A35",
};

interface DailyTask {
  id: string;
  title: string;
  description: string;
  type: "lesson" | "vocabulary" | "speaking" | "listening" | "review" | "song";
  duration: number; // minutes
  completed: boolean;
  route?: string;
}

interface DailyPlan {
  id: string;
  date: string;
  greeting: string;
  focusArea: string;
  tasks: DailyTask[];
  totalMinutes: number;
}

export default function PersonalizedDailyPlanScreen() {
  const router = useRouter();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const llmMutation = (trpc as any).system?.llm?.useMutation?.() || { mutateAsync: async () => ({ response: "" }), isLoading: false };

  useEffect(() => {
    loadTodaysPlan();
  }, []);

  const loadTodaysPlan = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const stored = await AsyncStorage.getItem(`@daily_plan_${today}`);
      if (stored) {
        setPlan(JSON.parse(stored));
      }
    } catch {}
    setLoading(false);
  };

  const generatePlan = useCallback(async () => {
    setGenerating(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const targetLang = (await AsyncStorage.getItem("@target_language")) || "Spanish";
      const level = (await AsyncStorage.getItem("@user_level")) || "A2";
      const streakData = await AsyncStorage.getItem("@streak_data");
      const streak = streakData ? JSON.parse(streakData) : { current: 0 };
      const schedule = (await AsyncStorage.getItem("@learning_schedule")) || "15";

      const prompt = `Create a personalized daily language learning plan for a student learning ${targetLang} at CEFR level ${level}.
They have ${schedule} minutes available today and a ${streak.current || 0}-day streak.

Return a JSON object:
{
  "greeting": "short personalized greeting (1 sentence, motivating)",
  "focusArea": "today's focus theme (e.g., 'Travel Vocabulary' or 'Past Tense Mastery')",
  "tasks": [
    {
      "title": "task name",
      "description": "brief description of what to do",
      "type": "lesson|vocabulary|speaking|listening|review|song",
      "duration": number_in_minutes
    }
  ]
}

Make tasks specific to ${targetLang} at ${level} level. Include a mix of activities. Total duration should be around ${schedule} minutes. Make it feel personalized and achievable.`;

      let planData: any;
      try {
        const response = await llmMutation.mutateAsync({
          messages: [{ role: "user", content: prompt }],
          responseFormat: "json",
        });
        planData = JSON.parse(response.content || "{}");
      } catch {
        planData = {
          greeting: `Good ${getTimeOfDay()}! Let's keep your ${streak.current || 0}-day streak alive.`,
          focusArea: "Daily Practice Mix",
          tasks: [
            { title: "Quick Review", description: "Review yesterday's vocabulary", type: "review", duration: 3 },
            { title: "New Lesson", description: `Continue ${targetLang} ${level} curriculum`, type: "lesson", duration: 8 },
            { title: "Listen & Repeat", description: "Practice pronunciation with audio", type: "listening", duration: 4 },
            { title: "Song Break", description: "Listen to a translated song", type: "song", duration: 3 },
          ],
        };
      }

      const tasks: DailyTask[] = (planData.tasks || []).map((t: any, i: number) => ({
        id: `task-${Date.now()}-${i}`,
        title: t.title,
        description: t.description,
        type: t.type || "lesson",
        duration: t.duration || 5,
        completed: false,
        route: getRouteForType(t.type),
      }));

      const newPlan: DailyPlan = {
        id: `plan-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        greeting: planData.greeting || "Let's learn today!",
        focusArea: planData.focusArea || "Daily Practice",
        tasks,
        totalMinutes: tasks.reduce((sum, t) => sum + t.duration, 0),
      };

      await AsyncStorage.setItem(`@daily_plan_${newPlan.date}`, JSON.stringify(newPlan));
      setPlan(newPlan);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Failed to generate plan:", e);
    } finally {
      setGenerating(false);
    }
  }, []);

  const toggleTask = async (taskId: string) => {
    if (!plan) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = {
      ...plan,
      tasks: plan.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    };
    setPlan(updated);
    await AsyncStorage.setItem(`@daily_plan_${plan.date}`, JSON.stringify(updated));
  };

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  };

  const getRouteForType = (type: string): string => {
    switch (type) {
      case "lesson": return "/curriculum-drills";
      case "vocabulary": return "/vocabulary-from-song";
      case "speaking": return "/ai-teacher-call";
      case "listening": return "/karaoke-mode";
      case "review": return "/flashcard-review";
      case "song": return "/song-translation-studio";
      default: return "/curriculum-drills";
    }
  };

  const getIconForType = (type: string): string => {
    switch (type) {
      case "lesson": return "school";
      case "vocabulary": return "book";
      case "speaking": return "mic";
      case "listening": return "headset";
      case "review": return "refresh-circle";
      case "song": return "musical-notes";
      default: return "document";
    }
  };

  const completedCount = plan?.tasks.filter((t) => t.completed).length || 0;
  const totalCount = plan?.tasks.length || 0;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  if (loading) {
    return (
      <ScreenContainer className="bg-background">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Plan</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={generatePlan} disabled={generating}>
            <Ionicons name="sparkles" size={18} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {plan ? (
            <>
              {/* Greeting */}
              <View style={styles.greetingCard}>
                <Text style={styles.greetingText}>{plan.greeting}</Text>
                <Text style={styles.focusText}>Today's focus: {plan.focusArea}</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    {completedCount}/{totalCount} tasks complete
                  </Text>
                  <Text style={styles.progressTime}>{plan.totalMinutes} min total</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
              </View>

              {/* Tasks */}
              <View style={styles.tasksSection}>
                {plan.tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
                    onPress={() => toggleTask(task.id)}
                  >
                    <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
                      {task.completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <View style={styles.taskContent}>
                      <View style={styles.taskHeader}>
                        <Ionicons
                          name={getIconForType(task.type) as any}
                          size={16}
                          color={task.completed ? Colors.textSecondary : Colors.secondary}
                        />
                        <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                          {task.title}
                        </Text>
                      </View>
                      <Text style={styles.taskDescription}>{task.description}</Text>
                      <Text style={styles.taskDuration}>{task.duration} min</Text>
                    </View>
                    {task.route && !task.completed && (
                      <TouchableOpacity
                        style={styles.goBtn}
                        onPress={() => router.push(task.route as any)}
                      >
                        <Ionicons name="play" size={14} color="#FFF" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Completion Message */}
              {completedCount === totalCount && totalCount > 0 && (
                <View style={styles.completionCard}>
                  <Text style={styles.completionEmoji}>🎉</Text>
                  <Text style={styles.completionTitle}>All Done!</Text>
                  <Text style={styles.completionSubtitle}>
                    Amazing work today! Your streak is growing stronger.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Empty State */}
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No Plan for Today</Text>
                <Text style={styles.emptySubtitle}>
                  Let AI create a personalized learning plan based on your progress and weak areas.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
                onPress={generatePlan}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                )}
                <Text style={styles.generateBtnText}>
                  {generating ? "Creating Your Plan..." : "Generate Today's Plan"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.textPrimary },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceCard, alignItems: "center", justifyContent: "center" },

  greetingCard: { marginHorizontal: 16, marginTop: 8, marginBottom: 16, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  greetingText: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary, marginBottom: 6 },
  focusText: { fontSize: 13, color: Colors.secondary, fontWeight: "500" },

  progressSection: { marginHorizontal: 16, marginBottom: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  progressTime: { fontSize: 12, color: Colors.textSecondary },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: Colors.surfaceCard },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.secondary },

  tasksSection: { marginHorizontal: 16 },
  taskCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  taskCardCompleted: { opacity: 0.6, borderColor: Colors.success + "40" },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center", marginRight: 12 },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  taskContent: { flex: 1 },
  taskHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  taskTitle: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  taskTitleCompleted: { textDecorationLine: "line-through", color: Colors.textSecondary },
  taskDescription: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  taskDuration: { fontSize: 11, color: Colors.secondary, fontWeight: "500" },
  goBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.secondary, alignItems: "center", justifyContent: "center" },

  completionCard: { alignItems: "center", marginHorizontal: 16, marginTop: 20, backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Colors.success + "40" },
  completionEmoji: { fontSize: 40, marginBottom: 8 },
  completionTitle: { fontSize: 18, fontWeight: "700", color: Colors.success },
  completionSubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", marginTop: 4 },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12, marginHorizontal: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 20 },

  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.secondary, borderRadius: 12, paddingVertical: 14, marginHorizontal: 16, marginTop: 16 },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
});
