/**
 * Achievements System — Unlockable badges with persistence.
 * Badges are checked against current user stats and unlocked automatically.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACHIEVEMENTS_KEY = "@achievements_unlocked";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Ionicons name
  color: string;
  category: "xp" | "streak" | "sessions" | "creators" | "special";
  /** Function to check if the badge should be unlocked */
  checkUnlocked: (stats: UserStats) => boolean;
}

export interface UserStats {
  totalXP: number;
  currentStreak: number;
  totalSessions: number;
  totalExercises: number;
  creatorsAttempted: number;
  focusSessions: number;
  pinnedFeatures: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number; // timestamp
}

// ─── BADGE DEFINITIONS ──────────────────────────────────────────────────────
export const ACHIEVEMENTS: Achievement[] = [
  // XP Badges
  {
    id: "first_xp",
    name: "First Steps",
    description: "Earn your first XP point",
    icon: "footsteps",
    color: "#6B7280",
    category: "xp",
    checkUnlocked: (s) => s.totalXP >= 1,
  },
  {
    id: "xp_50",
    name: "Getting Warmed Up",
    description: "Earn 50 XP total",
    icon: "flame",
    color: "#F59E0B",
    category: "xp",
    checkUnlocked: (s) => s.totalXP >= 50,
  },
  {
    id: "xp_100",
    name: "Century Club",
    description: "Earn 100 XP total",
    icon: "star",
    color: "#3B82F6",
    category: "xp",
    checkUnlocked: (s) => s.totalXP >= 100,
  },
  {
    id: "xp_250",
    name: "XP Machine",
    description: "Earn 250 XP total",
    icon: "rocket",
    color: "#8B5CF6",
    category: "xp",
    checkUnlocked: (s) => s.totalXP >= 250,
  },
  {
    id: "xp_500",
    name: "Half Grand",
    description: "Earn 500 XP total",
    icon: "diamond",
    color: "#EC4899",
    category: "xp",
    checkUnlocked: (s) => s.totalXP >= 500,
  },
  {
    id: "xp_1000",
    name: "XP Master",
    description: "Earn 1000 XP total",
    icon: "trophy",
    color: "#EF4444",
    category: "xp",
    checkUnlocked: (s) => s.totalXP >= 1000,
  },

  // Streak Badges
  {
    id: "streak_3",
    name: "Hat Trick",
    description: "Maintain a 3-day streak",
    icon: "flame",
    color: "#F97316",
    category: "streak",
    checkUnlocked: (s) => s.currentStreak >= 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "calendar",
    color: "#22C55E",
    category: "streak",
    checkUnlocked: (s) => s.currentStreak >= 7,
  },
  {
    id: "streak_14",
    name: "Fortnight Fighter",
    description: "Maintain a 14-day streak",
    icon: "shield-checkmark",
    color: "#3B82F6",
    category: "streak",
    checkUnlocked: (s) => s.currentStreak >= 14,
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "medal",
    color: "#F59E0B",
    category: "streak",
    checkUnlocked: (s) => s.currentStreak >= 30,
  },
  {
    id: "streak_100",
    name: "Unstoppable",
    description: "Maintain a 100-day streak",
    icon: "flash",
    color: "#EF4444",
    category: "streak",
    checkUnlocked: (s) => s.currentStreak >= 100,
  },

  // Session Badges
  {
    id: "first_session",
    name: "First Exercise",
    description: "Complete your first exercise session",
    icon: "checkmark-circle",
    color: "#22C55E",
    category: "sessions",
    checkUnlocked: (s) => s.totalSessions >= 1,
  },
  {
    id: "sessions_10",
    name: "Dedicated Learner",
    description: "Complete 10 exercise sessions",
    icon: "school",
    color: "#3B82F6",
    category: "sessions",
    checkUnlocked: (s) => s.totalSessions >= 10,
  },
  {
    id: "sessions_25",
    name: "Quarter Century",
    description: "Complete 25 exercise sessions",
    icon: "ribbon",
    color: "#8B5CF6",
    category: "sessions",
    checkUnlocked: (s) => s.totalSessions >= 25,
  },
  {
    id: "sessions_50",
    name: "Half Century",
    description: "Complete 50 exercise sessions",
    icon: "trophy",
    color: "#F59E0B",
    category: "sessions",
    checkUnlocked: (s) => s.totalSessions >= 50,
  },

  // Creator Badges
  {
    id: "first_creator",
    name: "Explorer",
    description: "Try exercises from your first creator",
    icon: "compass",
    color: "#06B6D4",
    category: "creators",
    checkUnlocked: (s) => s.creatorsAttempted >= 1,
  },
  {
    id: "creators_3",
    name: "Variety Seeker",
    description: "Try exercises from 3 different creators",
    icon: "people",
    color: "#8B5CF6",
    category: "creators",
    checkUnlocked: (s) => s.creatorsAttempted >= 3,
  },
  {
    id: "creators_all",
    name: "All Creators Tried",
    description: "Try exercises from all available creators",
    icon: "globe",
    color: "#EF4444",
    category: "creators",
    checkUnlocked: (s) => s.creatorsAttempted >= 5,
  },

  // Special Badges
  {
    id: "focus_first",
    name: "Focused Mind",
    description: "Complete your first Focus Mode session",
    icon: "eye",
    color: "#6366F1",
    category: "special",
    checkUnlocked: (s) => s.focusSessions >= 1,
  },
  {
    id: "focus_10",
    name: "Deep Focus",
    description: "Complete 10 Focus Mode sessions",
    icon: "hourglass",
    color: "#14B8A6",
    category: "special",
    checkUnlocked: (s) => s.focusSessions >= 10,
  },
  {
    id: "pinned_3",
    name: "Organizer",
    description: "Pin 3 features to your quick access",
    icon: "pin",
    color: "#F97316",
    category: "special",
    checkUnlocked: (s) => s.pinnedFeatures >= 3,
  },
];

// ─── PERSISTENCE ────────────────────────────────────────────────────────────
export async function getUnlockedAchievements(): Promise<UnlockedAchievement[]> {
  try {
    const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function saveUnlockedAchievements(unlocked: UnlockedAchievement[]): Promise<void> {
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
}

/**
 * Check all achievements against current stats and unlock any new ones.
 * Returns array of newly unlocked achievement IDs.
 */
export async function checkAndUnlockAchievements(stats: UserStats): Promise<string[]> {
  const existing = await getUnlockedAchievements();
  const existingIds = new Set(existing.map((a) => a.id));
  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!existingIds.has(achievement.id) && achievement.checkUnlocked(stats)) {
      newlyUnlocked.push({ id: achievement.id, unlockedAt: Date.now() });
    }
  }

  if (newlyUnlocked.length > 0) {
    await saveUnlockedAchievements([...existing, ...newlyUnlocked]);
  }

  return newlyUnlocked.map((a) => a.id);
}

/**
 * Get achievement progress summary.
 */
export async function getAchievementProgress(): Promise<{
  total: number;
  unlocked: number;
  unlockedIds: Set<string>;
  unlockedList: UnlockedAchievement[];
}> {
  const unlocked = await getUnlockedAchievements();
  return {
    total: ACHIEVEMENTS.length,
    unlocked: unlocked.length,
    unlockedIds: new Set(unlocked.map((a) => a.id)),
    unlockedList: unlocked,
  };
}
