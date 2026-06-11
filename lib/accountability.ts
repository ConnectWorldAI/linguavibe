/**
 * Accountability System
 * - Goal adjustment prompts when user falls behind 3+ days
 * - Weekly progress digest notifications (Sunday evening)
 * - Smart scheduling that finds calendar gaps for study sessions
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const BEHIND_STREAK_KEY = "@accountability_behind_days";
const LAST_DIGEST_KEY = "@accountability_last_digest";
const SMART_SCHEDULE_KEY = "@accountability_smart_schedule";
const DISMISSED_ADJUSTMENT_KEY = "@accountability_dismissed_adjustment";

// ─── Goal Adjustment System ──────────────────────────────────────────────────

export interface GoalAdjustmentSuggestion {
  type: "extend_deadline" | "increase_daily" | "weekend_catchup" | "change_focus";
  title: string;
  description: string;
  actionLabel: string;
  newValue?: string;
  impact: string;
}

export interface BehindStatus {
  daysBehind: number;
  hoursDeficit: number;
  shouldShowModal: boolean;
  suggestions: GoalAdjustmentSuggestion[];
  motivationalMessage: string;
}

/**
 * Calculate how many consecutive days the user has been behind
 */
export async function checkBehindStatus(
  dailyTargetMinutes: number,
  actualMinutesToday: number
): Promise<BehindStatus> {
  const stored = await AsyncStorage.getItem(BEHIND_STREAK_KEY);
  let behindDays = stored ? JSON.parse(stored) : { count: 0, lastChecked: "" };

  const today = new Date().toISOString().split("T")[0];

  // If already checked today, return cached
  if (behindDays.lastChecked === today) {
    return buildBehindStatus(behindDays.count, dailyTargetMinutes);
  }

  // Update behind count
  if (actualMinutesToday < dailyTargetMinutes * 0.5) {
    // Less than 50% of target = behind
    behindDays.count += 1;
  } else {
    behindDays.count = Math.max(0, behindDays.count - 1); // Recovery
  }
  behindDays.lastChecked = today;

  await AsyncStorage.setItem(BEHIND_STREAK_KEY, JSON.stringify(behindDays));
  return buildBehindStatus(behindDays.count, dailyTargetMinutes);
}

function buildBehindStatus(daysBehind: number, dailyTargetMinutes: number): BehindStatus {
  const hoursDeficit = (daysBehind * dailyTargetMinutes) / 60;

  // Check if user dismissed the modal recently
  const shouldShowModal = daysBehind >= 3;

  const suggestions = generateSuggestions(daysBehind, dailyTargetMinutes, hoursDeficit);
  const motivationalMessage = getMotivationalMessage(daysBehind);

  return {
    daysBehind,
    hoursDeficit,
    shouldShowModal,
    suggestions,
    motivationalMessage,
  };
}

function generateSuggestions(
  daysBehind: number,
  dailyTarget: number,
  hoursDeficit: number
): GoalAdjustmentSuggestion[] {
  const suggestions: GoalAdjustmentSuggestion[] = [];

  // Suggestion 1: Extend deadline
  const extraWeeks = Math.ceil(daysBehind / 5);
  suggestions.push({
    type: "extend_deadline",
    title: "Extend Your Target Date",
    description: `Push your goal back ${extraWeeks} week${extraWeeks > 1 ? "s" : ""} to reduce daily pressure. No shame in adjusting — life happens.`,
    actionLabel: `Add ${extraWeeks} Week${extraWeeks > 1 ? "s" : ""}`,
    newValue: `+${extraWeeks * 7} days`,
    impact: `Daily target stays at ${dailyTarget} min/day`,
  });

  // Suggestion 2: Increase daily time to catch up
  const catchUpDays = 14;
  const extraMinPerDay = Math.ceil((hoursDeficit * 60) / catchUpDays);
  suggestions.push({
    type: "increase_daily",
    title: "Boost Daily Sessions",
    description: `Add ${extraMinPerDay} extra minutes per day for the next 2 weeks to get back on track.`,
    actionLabel: `Set to ${dailyTarget + extraMinPerDay} min/day`,
    newValue: `${dailyTarget + extraMinPerDay}`,
    impact: `Back on track in ~${catchUpDays} days`,
  });

  // Suggestion 3: Weekend catch-up plan
  const weekendMinutes = Math.ceil((hoursDeficit * 60) / 4); // spread over 4 weekend days (2 weekends)
  suggestions.push({
    type: "weekend_catchup",
    title: "Weekend Catch-Up Plan",
    description: `Keep weekdays light (${Math.floor(dailyTarget * 0.7)} min) and do ${weekendMinutes} min sessions on weekends to recover.`,
    actionLabel: "Activate Weekend Plan",
    newValue: `${weekendMinutes} min weekends`,
    impact: `Caught up in 2 weekends`,
  });

  // Suggestion 4: Change skill focus
  suggestions.push({
    type: "change_focus",
    title: "Switch to Quick Wins",
    description: "Focus on vocabulary and flashcards (5-10 min sessions) instead of full lessons. Small wins build momentum.",
    actionLabel: "Switch to Quick Mode",
    impact: "Easier to maintain streak with micro-sessions",
  });

  return suggestions;
}

function getMotivationalMessage(daysBehind: number): string {
  if (daysBehind <= 3) {
    return "You're a little behind, but catching up is totally doable. Let's adjust your plan so it works with your life, not against it.";
  } else if (daysBehind <= 7) {
    return "A week off track isn't the end — it's a chance to reset. Most successful learners have setbacks. What matters is coming back.";
  } else {
    return "Life got busy, and that's okay. Let's rebuild your plan from where you are now. Small consistent steps beat big sporadic efforts every time.";
  }
}

/**
 * Dismiss the adjustment modal (won't show again for 3 days)
 */
export async function dismissAdjustmentModal(): Promise<void> {
  await AsyncStorage.setItem(
    DISMISSED_ADJUSTMENT_KEY,
    new Date().toISOString()
  );
}

/**
 * Check if modal was recently dismissed
 */
export async function wasModalRecentlyDismissed(): Promise<boolean> {
  const dismissed = await AsyncStorage.getItem(DISMISSED_ADJUSTMENT_KEY);
  if (!dismissed) return false;
  const dismissedDate = new Date(dismissed);
  const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < 3;
}

// ─── Weekly Progress Digest ──────────────────────────────────────────────────

export interface WeeklyDigest {
  weekOf: string;
  totalStudyMinutes: number;
  skillsBreakdown: { skill: string; minutes: number; percentage: number }[];
  streakDays: number;
  paceStatus: "ahead" | "on_track" | "behind";
  lessonsCompleted: number;
  wordsLearned: number;
  nextWeekPlan: string[];
  encouragement: string;
}

/**
 * Generate the weekly progress digest content
 */
export function generateWeeklyDigest(
  studyMinutes: number,
  streakDays: number,
  lessonsCompleted: number,
  wordsLearned: number,
  targetMinutesPerWeek: number
): WeeklyDigest {
  const paceRatio = studyMinutes / targetMinutesPerWeek;
  const paceStatus: "ahead" | "on_track" | "behind" =
    paceRatio >= 1.1 ? "ahead" : paceRatio >= 0.8 ? "on_track" : "behind";

  // Estimate skill breakdown (in production, this would come from actual tracking)
  const skillsBreakdown = [
    { skill: "Speaking", minutes: Math.round(studyMinutes * 0.30), percentage: 30 },
    { skill: "Listening", minutes: Math.round(studyMinutes * 0.25), percentage: 25 },
    { skill: "Vocabulary", minutes: Math.round(studyMinutes * 0.20), percentage: 20 },
    { skill: "Reading", minutes: Math.round(studyMinutes * 0.15), percentage: 15 },
    { skill: "Grammar", minutes: Math.round(studyMinutes * 0.10), percentage: 10 },
  ];

  const nextWeekPlan = generateNextWeekPlan(paceStatus, studyMinutes, targetMinutesPerWeek);
  const encouragement = getDigestEncouragement(paceStatus, streakDays);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  return {
    weekOf: weekStart.toISOString().split("T")[0],
    totalStudyMinutes: studyMinutes,
    skillsBreakdown,
    streakDays,
    paceStatus,
    lessonsCompleted,
    wordsLearned,
    nextWeekPlan,
    encouragement,
  };
}

function generateNextWeekPlan(
  paceStatus: string,
  actualMinutes: number,
  targetMinutes: number
): string[] {
  const plan: string[] = [];

  if (paceStatus === "behind") {
    const deficit = targetMinutes - actualMinutes;
    const extraPerDay = Math.ceil(deficit / 7);
    plan.push(`Add ${extraPerDay} extra min/day to catch up`);
    plan.push("Focus on vocabulary flashcards for quick wins");
    plan.push("Try 2 speaking sessions to boost confidence");
  } else if (paceStatus === "on_track") {
    plan.push("Maintain your current pace — you're doing great");
    plan.push("Try a new lesson type you haven't explored");
    plan.push("Challenge yourself with one advanced exercise");
  } else {
    plan.push("You're ahead! Consider exploring advanced content");
    plan.push("Try a live conversation simulation this week");
    plan.push("Help a friend start learning — teaching reinforces knowledge");
  }

  return plan;
}

function getDigestEncouragement(paceStatus: string, streakDays: number): string {
  if (streakDays >= 30) {
    return `${streakDays}-day streak! You're building a habit that will last a lifetime. Keep showing up.`;
  } else if (streakDays >= 7) {
    return `${streakDays} days strong! You're past the hardest part — the first week. Momentum is on your side.`;
  } else if (paceStatus === "behind") {
    return "Every expert was once a beginner who didn't quit. Tomorrow is a fresh start.";
  } else {
    return "Consistency beats intensity. You're building something real, one day at a time.";
  }
}

/**
 * Check if it's time to send the weekly digest (Sunday 7 PM)
 */
export async function shouldSendWeeklyDigest(): Promise<boolean> {
  const now = new Date();
  const isSunday = now.getDay() === 0;
  const isEvening = now.getHours() >= 19;

  if (!isSunday || !isEvening) return false;

  const lastDigest = await AsyncStorage.getItem(LAST_DIGEST_KEY);
  if (lastDigest) {
    const lastDate = new Date(lastDigest);
    const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 6) return false; // Already sent this week
  }

  return true;
}

/**
 * Mark digest as sent
 */
export async function markDigestSent(): Promise<void> {
  await AsyncStorage.setItem(LAST_DIGEST_KEY, new Date().toISOString());
}

// ─── Smart Scheduling ────────────────────────────────────────────────────────

export interface TimeSlot {
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  day: string; // "Monday", "Tuesday", etc.
  type: "short" | "medium" | "long";
  suggestion: string;
}

export interface SmartSchedule {
  slots: TimeSlot[];
  totalAvailableMinutes: number;
  optimalDistribution: string;
}

/**
 * Analyze calendar gaps and suggest study blocks
 */
export function analyzeCalendarGaps(
  busyBlocks: { day: string; startHour: number; endHour: number }[],
  wakeHour: number = 7,
  sleepHour: number = 23,
  dailyTargetMinutes: number = 30
): SmartSchedule {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const slots: TimeSlot[] = [];

  for (const day of days) {
    const dayBusy = busyBlocks
      .filter((b) => b.day === day)
      .sort((a, b) => a.startHour - b.startHour);

    // Find gaps between busy blocks
    let currentHour = wakeHour;

    for (const block of dayBusy) {
      const gapMinutes = (block.startHour - currentHour) * 60;
      if (gapMinutes >= 15) {
        // Usable gap found
        const slot = createStudySlot(day, currentHour, 0, gapMinutes, dailyTargetMinutes);
        if (slot) slots.push(slot);
      }
      currentHour = block.endHour;
    }

    // Check gap after last busy block until sleep
    const endGap = (sleepHour - currentHour) * 60;
    if (endGap >= 15) {
      const slot = createStudySlot(day, currentHour, 0, endGap, dailyTargetMinutes);
      if (slot) slots.push(slot);
    }
  }

  // Sort by optimal time (morning > afternoon > evening for learning)
  slots.sort((a, b) => {
    const scoreA = getTimeScore(a.startHour);
    const scoreB = getTimeScore(b.startHour);
    return scoreB - scoreA;
  });

  // Take best slot per day
  const bestPerDay = new Map<string, TimeSlot>();
  for (const slot of slots) {
    if (!bestPerDay.has(slot.day)) {
      bestPerDay.set(slot.day, slot);
    }
  }

  const finalSlots = Array.from(bestPerDay.values());
  const totalAvailable = finalSlots.reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    slots: finalSlots,
    totalAvailableMinutes: totalAvailable,
    optimalDistribution: getDistributionAdvice(finalSlots, dailyTargetMinutes),
  };
}

function createStudySlot(
  day: string,
  startHour: number,
  startMinute: number,
  availableMinutes: number,
  targetMinutes: number
): TimeSlot | null {
  // Determine session length based on available time
  let duration: number;
  let type: "short" | "medium" | "long";
  let suggestion: string;

  if (availableMinutes >= 45 && targetMinutes >= 30) {
    duration = Math.min(45, targetMinutes);
    type = "long";
    suggestion = "Full lesson + speaking practice";
  } else if (availableMinutes >= 25) {
    duration = Math.min(25, availableMinutes);
    type = "medium";
    suggestion = "Vocabulary review + quick quiz";
  } else if (availableMinutes >= 10) {
    duration = Math.min(15, availableMinutes);
    type = "short";
    suggestion = "Flashcard review (SRS due cards)";
  } else {
    return null; // Too short
  }

  return {
    startHour,
    startMinute,
    durationMinutes: duration,
    day,
    type,
    suggestion,
  };
}

function getTimeScore(hour: number): number {
  // Research shows morning learning is most effective for retention
  if (hour >= 7 && hour <= 10) return 10; // Morning: best
  if (hour >= 10 && hour <= 12) return 8; // Late morning: great
  if (hour >= 14 && hour <= 16) return 7; // Afternoon: good
  if (hour >= 16 && hour <= 19) return 6; // Evening: decent
  if (hour >= 19 && hour <= 21) return 5; // Night: okay
  return 3; // Late night: not ideal
}

function getDistributionAdvice(slots: TimeSlot[], dailyTarget: number): string {
  const totalWeekly = slots.reduce((sum, s) => sum + s.durationMinutes, 0);
  const weeklyTarget = dailyTarget * 7;

  if (totalWeekly >= weeklyTarget * 1.2) {
    return "You have plenty of time! Focus on quality over quantity — 30 focused minutes beats 60 distracted ones.";
  } else if (totalWeekly >= weeklyTarget) {
    return "Your schedule fits your goals perfectly. Stick to the suggested slots and you'll hit your target.";
  } else if (totalWeekly >= weeklyTarget * 0.7) {
    return "Tight schedule, but doable. Prioritize speaking and vocabulary — they give the most progress per minute.";
  } else {
    return "Your schedule is packed. Consider micro-sessions (5-10 min flashcards) during commutes or breaks.";
  }
}

/**
 * Save smart schedule to storage
 */
export async function saveSmartSchedule(schedule: SmartSchedule): Promise<void> {
  await AsyncStorage.setItem(SMART_SCHEDULE_KEY, JSON.stringify(schedule));
}

/**
 * Load saved smart schedule
 */
export async function loadSmartSchedule(): Promise<SmartSchedule | null> {
  const stored = await AsyncStorage.getItem(SMART_SCHEDULE_KEY);
  if (stored) return JSON.parse(stored);
  return null;
}

/**
 * Format time for display
 */
export function formatTime(hour: number, minute: number = 0): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}
