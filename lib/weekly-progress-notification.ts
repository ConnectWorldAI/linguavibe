/**
 * Weekly Progress Notification
 * 
 * Compiles a weekly summary of student improvement across all adaptive metrics:
 * - Knowledge gaps closed
 * - Error patterns fixed
 * - Streak maintenance
 * - Accuracy trend
 * - Session count and duration
 * - Pacing improvements
 * - Learning style insights
 * 
 * Sends as a push notification (local) every Sunday at 6 PM with a rich summary.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentGoals, gradeGoals } from "./weekly-goals-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Storage keys
const WEEKLY_REPORT_KEY = "@linguavibe_weekly_report";
const WEEKLY_NOTIF_ENABLED_KEY = "@linguavibe_weekly_notif_enabled";
const WEEKLY_NOTIF_ID_KEY = "@linguavibe_weekly_notif_id";

// Types
export interface WeeklyMetrics {
  weekStartDate: string; // ISO date
  weekEndDate: string;
  sessionsCompleted: number;
  totalMinutes: number;
  averageAccuracy: number;
  accuracyTrend: "improving" | "stable" | "declining";
  streakDays: number;
  streakBest: number;
  knowledgeGapsClosed: number;
  newSkillsIntroduced: number;
  errorPatternsFixed: number;
  errorPatternsRemaining: number;
  flashcardsReviewed: number;
  flashcardsMastered: number;
  lessonsCompleted: number;
  conversationMinutes: number;
  drillSessionsCompleted: number;
  drillAccuracy: number;
  primaryLearningStyle: string;
  pacingState: string;
  currentDifficulty: number;
  overallMastery: number; // 0-100
  masteryChange: number; // positive = improvement
}

export interface WeeklyReport {
  metrics: WeeklyMetrics;
  highlights: string[];
  areasOfImprovement: string[];
  teacherNote: string;
  grade: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
  goalGrade?: string; // Personal goal grade (A+ to F)
  goalScore?: number; // 0-100 goal completion percentage
  goalsSet?: number; // Number of goals set this week
  goalsCompleted?: number; // Number of goals fully completed
  generatedAt: string;
}

/**
 * Compile weekly metrics from all adaptive engine data
 */
export async function compileWeeklyMetrics(): Promise<WeeklyMetrics> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  // Gather data from all sources
  const [
    sessionData,
    errorData,
    knowledgeData,
    flashcardData,
    pacingData,
    styleData,
    streakData,
  ] = await Promise.all([
    getSessionMetrics(weekStart, now),
    getErrorMetrics(weekStart, now),
    getKnowledgeMetrics(),
    getFlashcardMetrics(weekStart, now),
    getPacingMetrics(),
    getStyleMetrics(),
    getStreakMetrics(),
  ]);

  return {
    weekStartDate: weekStart.toISOString(),
    weekEndDate: now.toISOString(),
    sessionsCompleted: sessionData.count,
    totalMinutes: sessionData.totalMinutes,
    averageAccuracy: sessionData.averageAccuracy,
    accuracyTrend: sessionData.trend,
    streakDays: streakData.current,
    streakBest: streakData.best,
    knowledgeGapsClosed: knowledgeData.gapsClosed,
    newSkillsIntroduced: knowledgeData.newSkills,
    errorPatternsFixed: errorData.fixed,
    errorPatternsRemaining: errorData.remaining,
    flashcardsReviewed: flashcardData.reviewed,
    flashcardsMastered: flashcardData.mastered,
    lessonsCompleted: sessionData.lessonsCompleted,
    conversationMinutes: sessionData.conversationMinutes,
    drillSessionsCompleted: errorData.drillsCompleted,
    drillAccuracy: errorData.drillAccuracy,
    primaryLearningStyle: styleData.primary,
    pacingState: pacingData.state,
    currentDifficulty: pacingData.difficulty,
    overallMastery: knowledgeData.mastery,
    masteryChange: knowledgeData.masteryChange,
  };
}

/**
 * Generate a full weekly report with highlights and teacher note
 */
export async function generateWeeklyReport(): Promise<WeeklyReport> {
  const metrics = await compileWeeklyMetrics();

  // Calculate grade
  const grade = calculateGrade(metrics);

  // Generate highlights
  const highlights = generateHighlights(metrics);

  // Generate areas of improvement
  const areasOfImprovement = generateImprovementAreas(metrics);

  // Generate teacher note
  const teacherNote = generateTeacherNote(metrics, grade);

  // Grade personal weekly goals
  const currentGoals = await getCurrentGoals();
  const goalResult = gradeGoals(currentGoals);
  const goalsCompleted = currentGoals.filter(g => g.currentValue >= g.targetValue).length;

  const report: WeeklyReport = {
    metrics,
    highlights,
    areasOfImprovement,
    teacherNote,
    grade,
    goalGrade: currentGoals.length > 0 ? goalResult.grade : undefined,
    goalScore: currentGoals.length > 0 ? goalResult.score : undefined,
    goalsSet: currentGoals.length > 0 ? currentGoals.length : undefined,
    goalsCompleted: currentGoals.length > 0 ? goalsCompleted : undefined,
    generatedAt: new Date().toISOString(),
  };

  // Save report
  await saveWeeklyReport(report);

  return report;
}

/**
 * Schedule the weekly progress notification (every Sunday at 6 PM)
 */
export async function scheduleWeeklyNotification(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  // Cancel existing
  await cancelWeeklyNotification();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "📊 Your Weekly Progress Report",
      body: "See how much you've improved this week! Tap to view your report card.",
      data: { type: "weekly_report", route: "/progress-report-card" },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 18,
      minute: 0,
    },
  });

  await AsyncStorage.setItem(WEEKLY_NOTIF_ID_KEY, id);
  await AsyncStorage.setItem(WEEKLY_NOTIF_ENABLED_KEY, "true");
  return id;
}

/**
 * Cancel the weekly progress notification
 */
export async function cancelWeeklyNotification(): Promise<void> {
  const existingId = await AsyncStorage.getItem(WEEKLY_NOTIF_ID_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
    await AsyncStorage.removeItem(WEEKLY_NOTIF_ID_KEY);
  }
}

/**
 * Check if weekly notification is enabled
 */
export async function isWeeklyNotificationEnabled(): Promise<boolean> {
  const enabled = await AsyncStorage.getItem(WEEKLY_NOTIF_ENABLED_KEY);
  return enabled === "true";
}

/**
 * Toggle weekly notification on/off
 */
export async function toggleWeeklyNotification(enabled: boolean): Promise<void> {
  if (enabled) {
    await scheduleWeeklyNotification();
  } else {
    await cancelWeeklyNotification();
    await AsyncStorage.setItem(WEEKLY_NOTIF_ENABLED_KEY, "false");
  }
}

/**
 * Send an immediate progress notification (for testing or manual trigger)
 */
export async function sendImmediateProgressNotification(): Promise<void> {
  if (Platform.OS === "web") return;

  const report = await generateWeeklyReport();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `📊 Weekly Report: Grade ${report.grade}`,
      body: report.teacherNote.substring(0, 100) + "...",
      data: { type: "weekly_report", route: "/progress-report-card" },
      sound: "default",
    },
    trigger: null, // Send immediately
  });
}

/**
 * Get the last saved weekly report
 */
export async function getLastWeeklyReport(): Promise<WeeklyReport | null> {
  try {
    const data = await AsyncStorage.getItem(WEEKLY_REPORT_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Get weekly report history (last 4 weeks)
 */
export async function getWeeklyReportHistory(): Promise<WeeklyReport[]> {
  try {
    const data = await AsyncStorage.getItem(`${WEEKLY_REPORT_KEY}_history`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// --- Private helpers ---

async function saveWeeklyReport(report: WeeklyReport): Promise<void> {
  await AsyncStorage.setItem(WEEKLY_REPORT_KEY, JSON.stringify(report));

  // Also append to history (keep last 12 weeks)
  const history = await getWeeklyReportHistory();
  history.unshift(report);
  if (history.length > 12) history.pop();
  await AsyncStorage.setItem(`${WEEKLY_REPORT_KEY}_history`, JSON.stringify(history));
}

function calculateGrade(metrics: WeeklyMetrics): WeeklyReport["grade"] {
  let score = 0;

  // Sessions (max 20 points)
  score += Math.min(metrics.sessionsCompleted * 3, 20);

  // Accuracy (max 25 points)
  score += (metrics.averageAccuracy / 100) * 25;

  // Streak (max 15 points)
  score += Math.min(metrics.streakDays * 2.5, 15);

  // Mastery improvement (max 20 points)
  score += Math.min(Math.max(metrics.masteryChange * 4, 0), 20);

  // Error patterns fixed (max 10 points)
  score += Math.min(metrics.errorPatternsFixed * 5, 10);

  // Variety bonus (max 10 points)
  let variety = 0;
  if (metrics.flashcardsReviewed > 0) variety++;
  if (metrics.lessonsCompleted > 0) variety++;
  if (metrics.conversationMinutes > 0) variety++;
  if (metrics.drillSessionsCompleted > 0) variety++;
  score += variety * 2.5;

  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C+";
  if (score >= 40) return "C";
  if (score >= 25) return "D";
  return "F";
}

function generateHighlights(metrics: WeeklyMetrics): string[] {
  const highlights: string[] = [];

  if (metrics.streakDays >= 7) {
    highlights.push(`Perfect week! ${metrics.streakDays}-day streak maintained`);
  } else if (metrics.streakDays >= 5) {
    highlights.push(`Strong consistency: ${metrics.streakDays}-day streak`);
  }

  if (metrics.accuracyTrend === "improving") {
    highlights.push(`Accuracy trending up to ${metrics.averageAccuracy}%`);
  }

  if (metrics.errorPatternsFixed > 0) {
    highlights.push(`Fixed ${metrics.errorPatternsFixed} recurring error pattern${metrics.errorPatternsFixed > 1 ? "s" : ""}`);
  }

  if (metrics.knowledgeGapsClosed > 0) {
    highlights.push(`Closed ${metrics.knowledgeGapsClosed} knowledge gap${metrics.knowledgeGapsClosed > 1 ? "s" : ""}`);
  }

  if (metrics.flashcardsMastered > 0) {
    highlights.push(`Mastered ${metrics.flashcardsMastered} new flashcard${metrics.flashcardsMastered > 1 ? "s" : ""}`);
  }

  if (metrics.conversationMinutes >= 10) {
    highlights.push(`${metrics.conversationMinutes} minutes of conversation practice`);
  }

  if (metrics.masteryChange > 0) {
    highlights.push(`Overall mastery improved by ${metrics.masteryChange}%`);
  }

  return highlights.slice(0, 4); // Max 4 highlights
}

function generateImprovementAreas(metrics: WeeklyMetrics): string[] {
  const areas: string[] = [];

  if (metrics.sessionsCompleted < 5) {
    areas.push("Try to practice at least 5 days per week for best retention");
  }

  if (metrics.errorPatternsRemaining > 3) {
    areas.push(`${metrics.errorPatternsRemaining} error patterns still need attention — try targeted drills`);
  }

  if (metrics.conversationMinutes < 5) {
    areas.push("Speaking practice is low — try a 5-minute AI conversation daily");
  }

  if (metrics.accuracyTrend === "declining") {
    areas.push("Accuracy is declining — consider slowing down and reviewing basics");
  }

  if (metrics.flashcardsReviewed < 20) {
    areas.push("Review more flashcards to strengthen vocabulary retention");
  }

  if (metrics.totalMinutes < 30) {
    areas.push("Total study time is low — even 10 minutes daily makes a difference");
  }

  return areas.slice(0, 3); // Max 3 areas
}

function generateTeacherNote(metrics: WeeklyMetrics, grade: string): string {
  if (grade === "A+" || grade === "A") {
    return `Outstanding week! You've shown real dedication with ${metrics.sessionsCompleted} sessions and ${metrics.totalMinutes} minutes of practice. Your ${metrics.averageAccuracy}% accuracy shows strong comprehension. ${metrics.masteryChange > 0 ? `Your mastery grew by ${metrics.masteryChange}% — that's real, measurable progress.` : "Keep this momentum going!"} You're on track to reach the next level soon.`;
  }

  if (grade === "B+" || grade === "B") {
    return `Good progress this week with ${metrics.sessionsCompleted} sessions. Your accuracy of ${metrics.averageAccuracy}% is solid. ${metrics.errorPatternsRemaining > 0 ? `Focus on those ${metrics.errorPatternsRemaining} error patterns — targeted drills will help.` : ""} ${metrics.conversationMinutes < 5 ? "Try adding more speaking practice next week." : "Your conversation practice is helping!"} You're building a strong foundation.`;
  }

  if (grade === "C+" || grade === "C") {
    return `You made some progress this week, but there's room to grow. ${metrics.sessionsCompleted < 3 ? "Consistency is key — try to practice at least 5 days next week." : ""} ${metrics.averageAccuracy < 60 ? "Your accuracy suggests you might be moving too fast — it's okay to review earlier material." : ""} Remember: small daily sessions beat occasional long ones. You've got this!`;
  }

  return `This was a quiet week for learning. ${metrics.sessionsCompleted === 0 ? "It happens! The important thing is getting back on track." : `You managed ${metrics.sessionsCompleted} session${metrics.sessionsCompleted > 1 ? "s" : ""}, which is a start.`} Try setting a daily reminder and starting with just 5 minutes. Every bit counts, and your previous progress is still there waiting for you.`;
}

// Data gathering helpers (read from AsyncStorage where each engine stores data)

async function getSessionMetrics(start: Date, end: Date): Promise<{
  count: number;
  totalMinutes: number;
  averageAccuracy: number;
  trend: "improving" | "stable" | "declining";
  lessonsCompleted: number;
  conversationMinutes: number;
}> {
  try {
    const sessionsRaw = await AsyncStorage.getItem("@linguavibe_session_history");
    const sessions = sessionsRaw ? JSON.parse(sessionsRaw) : [];
    const weekSessions = sessions.filter((s: any) => {
      const d = new Date(s.endedAt || s.timestamp);
      return d >= start && d <= end;
    });

    const count = weekSessions.length;
    const totalMinutes = weekSessions.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0);
    const accuracies = weekSessions.filter((s: any) => s.accuracy != null).map((s: any) => s.accuracy);
    const averageAccuracy = accuracies.length > 0 ? Math.round(accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length) : 0;

    // Trend: compare first half vs second half
    const mid = Math.floor(accuracies.length / 2);
    const firstHalf = accuracies.slice(0, mid);
    const secondHalf = accuracies.slice(mid);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length : 0;
    const trend = secondAvg > firstAvg + 5 ? "improving" : secondAvg < firstAvg - 5 ? "declining" : "stable";

    const lessonsCompleted = weekSessions.filter((s: any) => s.type === "lesson").length;
    const conversationMinutes = weekSessions
      .filter((s: any) => s.type === "conversation")
      .reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0);

    return { count, totalMinutes, averageAccuracy, trend, lessonsCompleted, conversationMinutes };
  } catch {
    return { count: 0, totalMinutes: 0, averageAccuracy: 0, trend: "stable", lessonsCompleted: 0, conversationMinutes: 0 };
  }
}

async function getErrorMetrics(start: Date, end: Date): Promise<{
  fixed: number;
  remaining: number;
  drillsCompleted: number;
  drillAccuracy: number;
}> {
  try {
    const patternsRaw = await AsyncStorage.getItem("@linguavibe_error_patterns");
    const patterns = patternsRaw ? JSON.parse(patternsRaw) : [];
    const remaining = patterns.filter((p: any) => !p.resolved).length;
    const fixed = patterns.filter((p: any) => {
      if (!p.resolvedAt) return false;
      const d = new Date(p.resolvedAt);
      return d >= start && d <= end;
    }).length;

    const drillsRaw = await AsyncStorage.getItem("@linguavibe_drill_sessions");
    const drills = drillsRaw ? JSON.parse(drillsRaw) : [];
    const weekDrills = drills.filter((d: any) => {
      const date = new Date(d.completedAt || d.timestamp);
      return date >= start && date <= end;
    });
    const drillsCompleted = weekDrills.length;
    const drillAccuracies = weekDrills.filter((d: any) => d.accuracy != null).map((d: any) => d.accuracy);
    const drillAccuracy = drillAccuracies.length > 0
      ? Math.round(drillAccuracies.reduce((a: number, b: number) => a + b, 0) / drillAccuracies.length)
      : 0;

    return { fixed, remaining, drillsCompleted, drillAccuracy };
  } catch {
    return { fixed: 0, remaining: 0, drillsCompleted: 0, drillAccuracy: 0 };
  }
}

async function getKnowledgeMetrics(): Promise<{
  gapsClosed: number;
  newSkills: number;
  mastery: number;
  masteryChange: number;
}> {
  try {
    const treeRaw = await AsyncStorage.getItem("@linguavibe_skill_tree");
    const tree = treeRaw ? JSON.parse(treeRaw) : null;
    if (!tree) return { gapsClosed: 0, newSkills: 0, mastery: 0, masteryChange: 0 };

    const mastery = tree.overallMastery || 0;
    const prevMasteryRaw = await AsyncStorage.getItem("@linguavibe_prev_mastery");
    const prevMastery = prevMasteryRaw ? parseFloat(prevMasteryRaw) : mastery;
    const masteryChange = Math.round((mastery - prevMastery) * 10) / 10;

    // Save current as prev for next week
    await AsyncStorage.setItem("@linguavibe_prev_mastery", mastery.toString());

    const gapsClosed = tree.gapsClosed || 0;
    const newSkills = tree.newSkillsThisWeek || 0;

    return { gapsClosed, newSkills, mastery, masteryChange };
  } catch {
    return { gapsClosed: 0, newSkills: 0, mastery: 0, masteryChange: 0 };
  }
}

async function getFlashcardMetrics(start: Date, end: Date): Promise<{
  reviewed: number;
  mastered: number;
}> {
  try {
    const statsRaw = await AsyncStorage.getItem("@linguavibe_flashcard_stats");
    const stats = statsRaw ? JSON.parse(statsRaw) : null;
    if (!stats) return { reviewed: 0, mastered: 0 };

    return {
      reviewed: stats.weeklyReviewed || stats.totalReviewed || 0,
      mastered: stats.weeklyMastered || stats.newlyMastered || 0,
    };
  } catch {
    return { reviewed: 0, mastered: 0 };
  }
}

async function getPacingMetrics(): Promise<{ state: string; difficulty: number }> {
  try {
    const pacingRaw = await AsyncStorage.getItem("@linguavibe_pacing_profile");
    const pacing = pacingRaw ? JSON.parse(pacingRaw) : null;
    return {
      state: pacing?.currentState || "warming_up",
      difficulty: pacing?.currentDifficulty || 5,
    };
  } catch {
    return { state: "warming_up", difficulty: 5 };
  }
}

async function getStyleMetrics(): Promise<{ primary: string }> {
  try {
    const styleRaw = await AsyncStorage.getItem("@linguavibe_learning_style");
    const style = styleRaw ? JSON.parse(styleRaw) : null;
    return { primary: style?.primaryStyle || "reading" };
  } catch {
    return { primary: "reading" };
  }
}

async function getStreakMetrics(): Promise<{ current: number; best: number }> {
  try {
    const streakRaw = await AsyncStorage.getItem("@linguavibe_streak");
    const streak = streakRaw ? JSON.parse(streakRaw) : null;
    return {
      current: streak?.currentStreak || 0,
      best: streak?.bestStreak || 0,
    };
  } catch {
    return { current: 0, best: 0 };
  }
}
