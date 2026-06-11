import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────
export type GlowSection = "studio" | "library" | "quiz" | "classroom" | "calls";

export type PendingTask = {
  id: string;
  section: GlowSection;
  title: string;
  description: string;
  dueDate?: string; // ISO string
  priority: "low" | "medium" | "high" | "urgent";
  type: "drill" | "reading" | "test" | "class" | "call" | "practice";
};

export type GlowState = {
  [key in GlowSection]: {
    isGlowing: boolean;
    count: number;
    urgency: "none" | "low" | "medium" | "high" | "urgent";
    tasks: PendingTask[];
  };
};

// ─── Storage Key ─────────────────────────────────────────────────────────────
const GLOW_STORAGE_KEY = "@connectworld_glow_tasks";
const DISMISSED_KEY = "@connectworld_glow_dismissed";

// ─── Default State ───────────────────────────────────────────────────────────
const DEFAULT_GLOW: GlowState = {
  studio: { isGlowing: false, count: 0, urgency: "none", tasks: [] },
  library: { isGlowing: false, count: 0, urgency: "none", tasks: [] },
  quiz: { isGlowing: false, count: 0, urgency: "none", tasks: [] },
  classroom: { isGlowing: false, count: 0, urgency: "none", tasks: [] },
  calls: { isGlowing: false, count: 0, urgency: "none", tasks: [] },
};

// ─── Mock Pending Tasks (simulates what would come from server/schedule) ─────
const MOCK_PENDING_TASKS: PendingTask[] = [
  {
    id: "t1",
    section: "studio",
    title: "Pronunciation Drill Due",
    description: "Complete today's speaking practice",
    priority: "high",
    type: "drill",
    dueDate: new Date().toISOString(),
  },
  {
    id: "t2",
    section: "studio",
    title: "Voice Journal",
    description: "Record your daily voice entry",
    priority: "medium",
    type: "practice",
  },
  {
    id: "t3",
    section: "library",
    title: "New Reading Available",
    description: "\"El Subjuntivo\" — assigned by your teacher",
    priority: "medium",
    type: "reading",
  },
  {
    id: "t4",
    section: "quiz",
    title: "Weekly Quiz Ready",
    description: "Vocabulary test — 20 questions",
    priority: "high",
    type: "test",
    dueDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  },
  {
    id: "t5",
    section: "classroom",
    title: "Class in 30 minutes",
    description: "Spanish Conversation with Maria",
    priority: "urgent",
    type: "class",
    dueDate: new Date(Date.now() + 1800000).toISOString(),
  },
  {
    id: "t6",
    section: "calls",
    title: "Missed Call",
    description: "Carlos tried to reach you",
    priority: "low",
    type: "call",
  },
];

// ─── Urgency Calculation ─────────────────────────────────────────────────────
function getHighestUrgency(tasks: PendingTask[]): GlowState[GlowSection]["urgency"] {
  if (tasks.length === 0) return "none";
  const priorities = tasks.map((t) => t.priority);
  if (priorities.includes("urgent")) return "urgent";
  if (priorities.includes("high")) return "high";
  if (priorities.includes("medium")) return "medium";
  return "low";
}

// ─── Glow Color Helper ───────────────────────────────────────────────────────
export function getGlowColor(urgency: GlowState[GlowSection]["urgency"]): string {
  switch (urgency) {
    case "urgent": return "#FF4444";
    case "high": return "#FF8C00";
    case "medium": return "#FFD700";
    case "low": return "#00D4FF";
    default: return "transparent";
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useDashboardGlow() {
  const [glowState, setGlowState] = useState<GlowState>(DEFAULT_GLOW);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Load dismissed tasks from storage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(DISMISSED_KEY);
        if (stored) setDismissedIds(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  // Calculate glow state from pending tasks
  useEffect(() => {
    const activeTasks = MOCK_PENDING_TASKS.filter((t) => !dismissedIds.includes(t.id));
    
    const newState: GlowState = { ...DEFAULT_GLOW };
    
    for (const section of Object.keys(newState) as GlowSection[]) {
      const sectionTasks = activeTasks.filter((t) => t.section === section);
      newState[section] = {
        isGlowing: sectionTasks.length > 0,
        count: sectionTasks.length,
        urgency: getHighestUrgency(sectionTasks),
        tasks: sectionTasks,
      };
    }
    
    setGlowState(newState);
  }, [dismissedIds]);

  const dismissTask = useCallback(async (taskId: string) => {
    const updated = [...dismissedIds, taskId];
    setDismissedIds(updated);
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(updated));
  }, [dismissedIds]);

  const dismissSection = useCallback(async (section: GlowSection) => {
    const sectionTaskIds = glowState[section].tasks.map((t) => t.id);
    const updated = [...dismissedIds, ...sectionTaskIds];
    setDismissedIds(updated);
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(updated));
  }, [dismissedIds, glowState]);

  const resetDismissed = useCallback(async () => {
    setDismissedIds([]);
    await AsyncStorage.removeItem(DISMISSED_KEY);
  }, []);

  const totalPending = Object.values(glowState).reduce((sum, s) => sum + s.count, 0);

  return {
    glowState,
    totalPending,
    dismissTask,
    dismissSection,
    resetDismissed,
    getGlowColor,
  };
}
