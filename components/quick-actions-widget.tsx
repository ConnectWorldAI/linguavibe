import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, BorderRadius, FontSize } from "../constants/Colors";

// ─── Types ───────────────────────────────────────────────────────────────────
interface QuickAction {
  id: string;
  icon: string;
  label: string;
  subtitle: string;
  route: string;
  gradient: string[];
  priority: number;
}

// ─── Time-of-day Helpers ─────────────────────────────────────────────────────
type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getGreeting(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case "morning": return "Good morning";
    case "afternoon": return "Good afternoon";
    case "evening": return "Good evening";
    case "night": return "Late night study?";
  }
}

// ─── Contextual Action Suggestions ──────────────────────────────────────────
const MORNING_ACTIONS: QuickAction[] = [
  { id: "morning_lesson", icon: "book", label: "Start a Lesson", subtitle: "Fresh mind, best time to learn", route: "/lessons", gradient: ["#3B82F6", "#2563EB"], priority: 1 },
  { id: "morning_vocab", icon: "flash", label: "Quick Vocab Review", subtitle: "5-min flashcard session", route: "/flashcards", gradient: ["#F59E0B", "#D97706"], priority: 2 },
  { id: "morning_goals", icon: "flag", label: "Check Weekly Goals", subtitle: "See your progress", route: "/weekly-goals", gradient: ["#10B981", "#059669"], priority: 3 },
];

const AFTERNOON_ACTIONS: QuickAction[] = [
  { id: "afternoon_convo", icon: "chatbubbles", label: "Practice Conversation", subtitle: "Chat with your AI teacher", route: "/conversation-sim", gradient: ["#8B5CF6", "#7C3AED"], priority: 1 },
  { id: "afternoon_drill", icon: "barbell", label: "Targeted Drills", subtitle: "Work on weak spots", route: "/adaptive-drills", gradient: ["#EF4444", "#DC2626"], priority: 2 },
  { id: "afternoon_culture", icon: "earth", label: "Cultural Discovery", subtitle: "Learn something new", route: "/cultural-feed", gradient: ["#06B6D4", "#0891B2"], priority: 3 },
];

const EVENING_ACTIONS: QuickAction[] = [
  { id: "evening_voice", icon: "mic", label: "Voice Practice", subtitle: "Wind down with speaking", route: "/voice-conversation", gradient: ["#EC4899", "#DB2777"], priority: 1 },
  { id: "evening_song", icon: "musical-notes", label: "Learn with Music", subtitle: "Relax and absorb", route: "/song-player", gradient: ["#6366F1", "#4F46E5"], priority: 2 },
  { id: "evening_report", icon: "stats-chart", label: "View Progress", subtitle: "See today's achievements", route: "/progress-report-card", gradient: ["#14B8A6", "#0D9488"], priority: 3 },
];

const NIGHT_ACTIONS: QuickAction[] = [
  { id: "night_review", icon: "refresh", label: "Quick Review", subtitle: "Reinforce today's learning", route: "/flashcards", gradient: ["#6366F1", "#4F46E5"], priority: 1 },
  { id: "night_listen", icon: "headset", label: "Passive Listening", subtitle: "Let it sink in", route: "/song-player", gradient: ["#8B5CF6", "#7C3AED"], priority: 2 },
  { id: "night_goals", icon: "checkmark-circle", label: "Log Progress", subtitle: "Update your weekly goals", route: "/weekly-goals", gradient: ["#10B981", "#059669"], priority: 3 },
];

function getTimeBasedActions(timeOfDay: TimeOfDay): QuickAction[] {
  switch (timeOfDay) {
    case "morning": return MORNING_ACTIONS;
    case "afternoon": return AFTERNOON_ACTIONS;
    case "evening": return EVENING_ACTIONS;
    case "night": return NIGHT_ACTIONS;
  }
}

// ─── Recent Activity Actions ─────────────────────────────────────────────────
const CONTINUE_ACTIONS: Record<string, QuickAction> = {
  lesson: { id: "continue_lesson", icon: "book", label: "Continue Lesson", subtitle: "Pick up where you left off", route: "/lessons", gradient: ["#3B82F6", "#2563EB"], priority: 0 },
  conversation: { id: "continue_convo", icon: "chatbubbles", label: "Continue Conversation", subtitle: "Resume your chat", route: "/conversation-sim", gradient: ["#8B5CF6", "#7C3AED"], priority: 0 },
  drill: { id: "continue_drill", icon: "barbell", label: "Continue Drills", subtitle: "Finish your session", route: "/adaptive-drills", gradient: ["#EF4444", "#DC2626"], priority: 0 },
};

const LAST_ACTIVITY_KEY = "@connectworld_last_activity";

export async function trackLastActivity(activityType: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACTIVITY_KEY, JSON.stringify({
      type: activityType,
      timestamp: Date.now(),
    }));
  } catch {}
}

// ─── Component ───────────────────────────────────────────────────────────────
export function QuickActionsWidget() {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    const timeOfDay = getTimeOfDay();
    setGreeting(getGreeting(timeOfDay));

    let suggestedActions = getTimeBasedActions(timeOfDay);

    // Check for recent activity to add "Continue" action
    try {
      const lastActivityRaw = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      if (lastActivityRaw) {
        const lastActivity = JSON.parse(lastActivityRaw);
        const hoursSince = (Date.now() - lastActivity.timestamp) / (1000 * 60 * 60);
        // Only show continue if activity was within last 24 hours
        if (hoursSince < 24 && CONTINUE_ACTIONS[lastActivity.type]) {
          const continueAction = CONTINUE_ACTIONS[lastActivity.type];
          suggestedActions = [continueAction, ...suggestedActions.slice(0, 2)];
        }
      }
    } catch {}

    setActions(suggestedActions.slice(0, 3));
  };

  const handlePress = (action: QuickAction) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(action.route as any);
  };

  if (actions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={16} color={Colors.accent} />
          <Text style={styles.greeting}>{greeting}</Text>
        </View>
        <Text style={styles.subtitle}>Suggested for you</Text>
      </View>
      <View style={styles.actionsRow}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={() => handlePress(action)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.gradient[0] + "20" }]}>
              <Ionicons name={action.icon as any} size={20} color={action.gradient[0]} />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>{action.label}</Text>
            <Text style={styles.actionSubtitle} numberOfLines={2}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greeting: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.primary + "40",
    borderRadius: BorderRadius.md,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  actionSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 13,
  },
});
