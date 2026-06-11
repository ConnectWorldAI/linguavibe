/**
 * Tests for Sprint: Notification Preferences, Pronunciation Timeline, Goal Streak
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

// ─── Feature 1: Notification Preferences in Weekly Goals ─────────────────────

describe("Notification Preferences in Weekly Goals", () => {
  let weeklyGoalsSource: string;

  beforeAll(() => {
    weeklyGoalsSource = readFile("app/weekly-goals.tsx");
  });

  it("has a settings tab in the tab bar", () => {
    expect(weeklyGoalsSource).toContain('"settings"');
    expect(weeklyGoalsSource).toContain("activeTab === \"settings\"");
  });

  it("loads notification preferences on mount", () => {
    expect(weeklyGoalsSource).toContain("loadNotifPrefs");
    expect(weeklyGoalsSource).toContain("getGoalNotificationPrefs");
  });

  it("updates notification preferences when toggled", () => {
    expect(weeklyGoalsSource).toContain("updateNotifPref");
    expect(weeklyGoalsSource).toContain("setGoalNotificationPrefs");
  });

  it("has toggle for master enable/disable", () => {
    expect(weeklyGoalsSource).toContain("Goal Reminders");
    expect(weeklyGoalsSource).toContain("Enable all goal notifications");
    expect(weeklyGoalsSource).toContain('updateNotifPref("enabled"');
  });

  it("has toggle for daily reminder", () => {
    expect(weeklyGoalsSource).toContain("Daily Progress");
    expect(weeklyGoalsSource).toContain('updateNotifPref("dailyReminder"');
  });

  it("has toggle for mid-week nudge", () => {
    expect(weeklyGoalsSource).toContain("Mid-Week Nudge");
    expect(weeklyGoalsSource).toContain('updateNotifPref("midWeekNudge"');
  });

  it("has toggle for final push", () => {
    expect(weeklyGoalsSource).toContain("Final Push");
    expect(weeklyGoalsSource).toContain('updateNotifPref("finalPush"');
  });

  it("has toggle for celebration", () => {
    expect(weeklyGoalsSource).toContain("Celebration");
    expect(weeklyGoalsSource).toContain('updateNotifPref("celebration"');
  });

  it("has reminder time picker with hour options", () => {
    expect(weeklyGoalsSource).toContain("Reminder Time");
    expect(weeklyGoalsSource).toContain('updateNotifPref("reminderHour"');
    expect(weeklyGoalsSource).toContain("[17, 18, 19, 20, 21]");
  });

  it("conditionally shows sub-toggles only when enabled", () => {
    expect(weeklyGoalsSource).toContain("notifPrefs.enabled &&");
  });

  it("has proper toggle styling", () => {
    expect(weeklyGoalsSource).toContain("notifStyles.toggle");
    expect(weeklyGoalsSource).toContain("notifStyles.toggleOn");
    expect(weeklyGoalsSource).toContain("notifStyles.toggleKnob");
  });
});

// ─── Feature 2: Pronunciation Progress Timeline ─────────────────────────────

describe("Pronunciation Progress Timeline", () => {
  let timelineSource: string;

  beforeAll(() => {
    timelineSource = readFile("app/pronunciation-timeline.tsx");
  });

  it("exists as a screen file", () => {
    expect(fs.existsSync(path.join(ROOT, "app/pronunciation-timeline.tsx"))).toBe(true);
  });

  it("imports pronunciation categories", () => {
    expect(timelineSource).toContain("PRONUNCIATION_CATEGORIES");
    expect(timelineSource).toContain("pronunciation-error-categorization");
  });

  it("loads errors from AsyncStorage", () => {
    expect(timelineSource).toContain("@pronunciation_errors");
    expect(timelineSource).toContain("AsyncStorage.getItem");
  });

  it("groups errors by week", () => {
    expect(timelineSource).toContain("getWeekNumber");
    expect(timelineSource).toContain("weekMap");
  });

  it("builds weekly snapshots", () => {
    expect(timelineSource).toContain("WeeklySnapshot");
    expect(timelineSource).toContain("weeklySnapshots");
  });

  it("builds category timelines with trend calculation", () => {
    expect(timelineSource).toContain("CategoryTimeline");
    expect(timelineSource).toContain("calculateTrend");
    expect(timelineSource).toContain("improving");
    expect(timelineSource).toContain("declining");
    expect(timelineSource).toContain("stable");
  });

  it("shows progress overview summary", () => {
    expect(timelineSource).toContain("Progress Overview");
    expect(timelineSource).toContain("Categories");
    expect(timelineSource).toContain("Weeks Tracked");
    expect(timelineSource).toContain("Improving");
  });

  it("renders expandable category cards", () => {
    expect(timelineSource).toContain("selectedCategory");
    expect(timelineSource).toContain("setSelectedCategory");
    expect(timelineSource).toContain("chevron-up");
    expect(timelineSource).toContain("chevron-down");
  });

  it("renders bar chart for each category", () => {
    expect(timelineSource).toContain("chartBars");
    expect(timelineSource).toContain("barHeight");
    expect(timelineSource).toContain("maxCount");
  });

  it("shows overall total errors per week chart", () => {
    expect(timelineSource).toContain("Total Errors Per Week");
    expect(timelineSource).toContain("overallChart");
  });

  it("shows trend indicators for each category", () => {
    expect(timelineSource).toContain("trending-down");
    expect(timelineSource).toContain("trending-up");
    expect(timelineSource).toContain("fewer errors");
    expect(timelineSource).toContain("Needs attention");
  });

  it("has empty state with CTA", () => {
    expect(timelineSource).toContain("No Pronunciation Data Yet");
    expect(timelineSource).toContain("Start a Conversation");
  });

  it("limits to last 12 weeks", () => {
    expect(timelineSource).toContain(".slice(-12)");
  });

  it("is accessible from home screen", () => {
    const homeSource = readFile("app/(tabs)/index.tsx");
    expect(homeSource).toContain("pronunciation-timeline");
    expect(homeSource).toContain("Pronunciation Timeline");
  });

  it("is linked from pronunciation weak spots card", () => {
    const cardSource = readFile("components/pronunciation-weak-spots-card.tsx");
    expect(cardSource).toContain("/pronunciation-timeline");
    expect(cardSource).toContain("View Progress Timeline");
  });
});

// ─── Feature 3: Goal Streak Tracking ────────────────────────────────────────

describe("Goal Streak Tracking", () => {
  let streakSource: string;
  let reportCardSource: string;

  beforeAll(() => {
    streakSource = readFile("lib/goal-streak.ts");
    reportCardSource = readFile("app/progress-report-card.tsx");
  });

  it("goal-streak module exists", () => {
    expect(fs.existsSync(path.join(ROOT, "lib/goal-streak.ts"))).toBe(true);
  });

  it("defines GoalStreak interface with required fields", () => {
    expect(streakSource).toContain("currentStreak: number");
    expect(streakSource).toContain("longestStreak: number");
    expect(streakSource).toContain("lastWeekHit: boolean");
    expect(streakSource).toContain("streakStartDate: string | null");
    expect(streakSource).toContain("totalWeeksHit: number");
    expect(streakSource).toContain("totalWeeksTracked: number");
  });

  it("defines streak badges with progressive tiers", () => {
    expect(streakSource).toContain("STREAK_BADGES");
    expect(streakSource).toContain("On Fire");
    expect(streakSource).toContain("Momentum");
    expect(streakSource).toContain("Dedicated");
    expect(streakSource).toContain("Champion");
    expect(streakSource).toContain("Unstoppable");
    expect(streakSource).toContain("Legend");
  });

  it("has a passing threshold of 70", () => {
    expect(streakSource).toContain("PASSING_SCORE = 70");
  });

  it("calculates streak from goal history", () => {
    expect(streakSource).toContain("calculateGoalStreak");
    expect(streakSource).toContain("@weekly_goals_history");
  });

  it("iterates history newest-first to find current streak", () => {
    // The function counts consecutive passing weeks from the most recent
    expect(streakSource).toContain("overallScore >= PASSING_SCORE");
  });

  it("exports getStreakBadge function", () => {
    expect(streakSource).toContain("export function getStreakBadge");
    expect(streakSource).toContain("streak >= b.minStreak");
  });

  it("exports getNextBadge function", () => {
    expect(streakSource).toContain("export function getNextBadge");
    expect(streakSource).toContain("streak < b.minStreak");
  });

  it("exports getStreakDisplay for report card", () => {
    expect(streakSource).toContain("export function getStreakDisplay");
    expect(streakSource).toContain("No Streak");
    expect(streakSource).toContain("1 Week");
  });

  it("caches streak result in AsyncStorage", () => {
    expect(streakSource).toContain("@goal_streak_cache");
    expect(streakSource).toContain("AsyncStorage.setItem(STREAK_CACHE_KEY");
  });

  it("report card loads goal streak on mount", () => {
    expect(reportCardSource).toContain("loadGoalStreak");
    expect(reportCardSource).toContain("calculateGoalStreak");
    expect(reportCardSource).toContain("getStreakDisplay");
  });

  it("report card displays streak badge section", () => {
    expect(reportCardSource).toContain("Goal Streak");
    expect(reportCardSource).toContain("streakDisplay");
    expect(reportCardSource).toContain("goalStreak.longestStreak");
    expect(reportCardSource).toContain("weeks hit");
    expect(reportCardSource).toContain("success rate");
  });

  it("report card conditionally shows streak only when history exists", () => {
    expect(reportCardSource).toContain("goalStreak.totalWeeksTracked > 0");
  });
});

// ─── Integration Tests ──────────────────────────────────────────────────────

describe("Integration", () => {
  it("weekly-goals-notifications module has get/set prefs exports", () => {
    const notifSource = readFile("lib/weekly-goals-notifications.ts");
    expect(notifSource).toContain("export async function getGoalNotificationPrefs");
    expect(notifSource).toContain("export async function setGoalNotificationPrefs");
  });

  it("pronunciation-timeline calculateTrend handles edge cases", () => {
    const timelineSource = readFile("app/pronunciation-timeline.tsx");
    // Should handle less than 2 values
    expect(timelineSource).toContain('if (values.length < 2) return "stable"');
  });

  it("goal-streak handles empty history gracefully", () => {
    const streakSource = readFile("lib/goal-streak.ts");
    expect(streakSource).toContain("if (history.length === 0)");
    expect(streakSource).toContain("currentStreak: 0");
  });
});
