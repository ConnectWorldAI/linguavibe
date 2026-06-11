import AsyncStorage from "@react-native-async-storage/async-storage";

const MILESTONE_KEY = "@connectworld_daily_milestones";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  credits: number;
  requirement: {
    category: "talk" | "video" | "song" | "teacher" | "total";
    amount: number;
  };
}

export interface MilestoneCompletion {
  milestoneId: string;
  date: string;
  creditsAwarded: number;
}

export const DAILY_MILESTONES: Milestone[] = [
  {
    id: "talk_10",
    title: "Chatterbox",
    description: "10 minutes of voice calls today",
    icon: "call",
    credits: 5,
    requirement: { category: "talk", amount: 10 },
  },
  {
    id: "talk_5",
    title: "Quick Chat",
    description: "5 minutes of voice calls today",
    icon: "call-outline",
    credits: 3,
    requirement: { category: "talk", amount: 5 },
  },
  {
    id: "songs_3",
    title: "Music Lover",
    description: "3 songs translated today",
    icon: "musical-notes",
    credits: 5,
    requirement: { category: "song", amount: 3 },
  },
  {
    id: "songs_1",
    title: "First Song",
    description: "Translate your first song today",
    icon: "musical-note",
    credits: 2,
    requirement: { category: "song", amount: 1 },
  },
  {
    id: "teacher_15",
    title: "Dedicated Student",
    description: "15 minutes with AI teacher today",
    icon: "school",
    credits: 5,
    requirement: { category: "teacher", amount: 15 },
  },
  {
    id: "teacher_5",
    title: "Quick Lesson",
    description: "5 minutes with AI teacher today",
    icon: "book",
    credits: 2,
    requirement: { category: "teacher", amount: 5 },
  },
  {
    id: "video_5",
    title: "Face Time",
    description: "5 minutes of video calls today",
    icon: "videocam",
    credits: 5,
    requirement: { category: "video", amount: 5 },
  },
  {
    id: "total_20",
    title: "Power User",
    description: "20 total minutes of learning today",
    icon: "rocket",
    credits: 10,
    requirement: { category: "total", amount: 20 },
  },
];

export interface DailyMilestoneState {
  date: string;
  completedIds: string[];
  dailyTalk: number;
  dailyVideo: number;
  dailySong: number;
  dailyTeacher: number;
  perfectDayAwarded?: boolean;
}

export const PERFECT_DAY_BONUS = 37; // Sum of all milestone credits = 37, so 2x = +37 bonus

export function isPerfectDay(state: DailyMilestoneState): boolean {
  return state.completedIds.length >= DAILY_MILESTONES.length;
}

export function getPerfectDayBonus(state: DailyMilestoneState): number {
  if (isPerfectDay(state) && !state.perfectDayAwarded) {
    return PERFECT_DAY_BONUS;
  }
  return 0;
}

export async function getDailyMilestoneState(): Promise<DailyMilestoneState> {
  const today = new Date().toISOString().split("T")[0];
  try {
    const stored = await AsyncStorage.getItem(MILESTONE_KEY);
    if (stored) {
      const state: DailyMilestoneState = JSON.parse(stored);
      if (state.date === today) return state;
    }
  } catch {}
  // New day, reset
  return {
    date: today,
    completedIds: [],
    dailyTalk: 0,
    dailyVideo: 0,
    dailySong: 0,
    dailyTeacher: 0,
  };
}

export async function saveDailyMilestoneState(state: DailyMilestoneState): Promise<void> {
  try {
    await AsyncStorage.setItem(MILESTONE_KEY, JSON.stringify(state));
  } catch {}
}

export function checkMilestones(state: DailyMilestoneState): Milestone[] {
  const newlyCompleted: Milestone[] = [];
  const total = state.dailyTalk + state.dailyVideo + state.dailyTeacher;

  for (const milestone of DAILY_MILESTONES) {
    if (state.completedIds.includes(milestone.id)) continue;

    let met = false;
    switch (milestone.requirement.category) {
      case "talk":
        met = state.dailyTalk >= milestone.requirement.amount;
        break;
      case "video":
        met = state.dailyVideo >= milestone.requirement.amount;
        break;
      case "song":
        met = state.dailySong >= milestone.requirement.amount;
        break;
      case "teacher":
        met = state.dailyTeacher >= milestone.requirement.amount;
        break;
      case "total":
        met = total >= milestone.requirement.amount;
        break;
    }

    if (met) {
      newlyCompleted.push(milestone);
    }
  }

  return newlyCompleted;
}

export async function recordMilestoneUsage(
  category: "talk" | "video" | "song" | "teacher",
  amount: number
): Promise<{ state: DailyMilestoneState; newMilestones: Milestone[]; perfectDayTriggered: boolean }> {
  const state = await getDailyMilestoneState();

  switch (category) {
    case "talk":
      state.dailyTalk += amount;
      break;
    case "video":
      state.dailyVideo += amount;
      break;
    case "song":
      state.dailySong += amount;
      break;
    case "teacher":
      state.dailyTeacher += amount;
      break;
  }

  const newMilestones = checkMilestones(state);

  // Mark newly completed
  for (const m of newMilestones) {
    state.completedIds.push(m.id);
  }

  // Check for Perfect Day
  let perfectDayTriggered = false;
  if (isPerfectDay(state) && !state.perfectDayAwarded) {
    state.perfectDayAwarded = true;
    perfectDayTriggered = true;
  }

  await saveDailyMilestoneState(state);
  return { state, newMilestones, perfectDayTriggered };
}
