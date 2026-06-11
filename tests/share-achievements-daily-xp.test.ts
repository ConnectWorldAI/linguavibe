/**
 * Tests for Share Milestone, Achievements, and Daily XP Goal features.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── FILE EXISTENCE TESTS ───────────────────────────────────────────────────
describe("File structure", () => {
  const projectRoot = path.resolve(__dirname, "..");

  it("achievements.ts lib exists", () => {
    expect(fs.existsSync(path.join(projectRoot, "lib/achievements.ts"))).toBe(true);
  });

  it("achievements.tsx screen exists", () => {
    expect(fs.existsSync(path.join(projectRoot, "app/achievements.tsx"))).toBe(true);
  });

  it("daily-xp-goal.ts lib exists", () => {
    expect(fs.existsSync(path.join(projectRoot, "lib/daily-xp-goal.ts"))).toBe(true);
  });

  it("daily-xp-goal.tsx screen exists", () => {
    expect(fs.existsSync(path.join(projectRoot, "app/daily-xp-goal.tsx"))).toBe(true);
  });

  it("xp-dashboard.tsx has Share button", () => {
    const content = fs.readFileSync(path.join(projectRoot, "app/xp-dashboard.tsx"), "utf-8");
    expect(content).toContain("Share Milestone");
    expect(content).toContain("Share.share");
    expect(content).toContain("share-social");
  });

  it("xp-progress-bar.tsx has daily goal indicator", () => {
    const content = fs.readFileSync(path.join(projectRoot, "components/xp-progress-bar.tsx"), "utf-8");
    expect(content).toContain("dailyGoal");
    expect(content).toContain("dailyProgress");
    expect(content).toContain("daily-xp-goal");
  });
});

// ─── ACHIEVEMENTS MODULE TESTS ──────────────────────────────────────────────
describe("Achievements module", () => {
  const achievementsPath = path.resolve(__dirname, "../lib/achievements.ts");
  let achievementsContent: string;

  beforeEach(() => {
    achievementsContent = fs.readFileSync(achievementsPath, "utf-8");
  });

  it("exports ACHIEVEMENTS array with badge definitions", () => {
    expect(achievementsContent).toContain("export const ACHIEVEMENTS");
    expect(achievementsContent).toContain("Achievement[]");
  });

  it("defines XP badges", () => {
    expect(achievementsContent).toContain("first_xp");
    expect(achievementsContent).toContain("xp_100");
    expect(achievementsContent).toContain("xp_500");
    expect(achievementsContent).toContain("xp_1000");
  });

  it("defines streak badges", () => {
    expect(achievementsContent).toContain("streak_3");
    expect(achievementsContent).toContain("streak_7");
    expect(achievementsContent).toContain("streak_30");
    expect(achievementsContent).toContain("streak_100");
  });

  it("defines session badges", () => {
    expect(achievementsContent).toContain("first_session");
    expect(achievementsContent).toContain("sessions_10");
    expect(achievementsContent).toContain("sessions_50");
  });

  it("defines creator badges", () => {
    expect(achievementsContent).toContain("first_creator");
    expect(achievementsContent).toContain("creators_3");
    expect(achievementsContent).toContain("creators_all");
  });

  it("defines special badges (focus, pins)", () => {
    expect(achievementsContent).toContain("focus_first");
    expect(achievementsContent).toContain("focus_10");
    expect(achievementsContent).toContain("pinned_3");
  });

  it("exports checkAndUnlockAchievements function", () => {
    expect(achievementsContent).toContain("export async function checkAndUnlockAchievements");
  });

  it("exports getAchievementProgress function", () => {
    expect(achievementsContent).toContain("export async function getAchievementProgress");
  });

  it("exports getUnlockedAchievements function", () => {
    expect(achievementsContent).toContain("export async function getUnlockedAchievements");
  });

  it("uses AsyncStorage for persistence", () => {
    expect(achievementsContent).toContain("@achievements_unlocked");
    expect(achievementsContent).toContain("AsyncStorage");
  });

  it("each badge has required fields (id, name, description, icon, color, category, checkUnlocked)", () => {
    expect(achievementsContent).toContain("id:");
    expect(achievementsContent).toContain("name:");
    expect(achievementsContent).toContain("description:");
    expect(achievementsContent).toContain("icon:");
    expect(achievementsContent).toContain("color:");
    expect(achievementsContent).toContain("category:");
    expect(achievementsContent).toContain("checkUnlocked:");
  });

  it("UserStats interface includes all required fields", () => {
    expect(achievementsContent).toContain("totalXP");
    expect(achievementsContent).toContain("currentStreak");
    expect(achievementsContent).toContain("totalSessions");
    expect(achievementsContent).toContain("totalExercises");
    expect(achievementsContent).toContain("creatorsAttempted");
    expect(achievementsContent).toContain("focusSessions");
    expect(achievementsContent).toContain("pinnedFeatures");
  });
});

// ─── ACHIEVEMENTS SCREEN TESTS ──────────────────────────────────────────────
describe("Achievements screen", () => {
  const screenPath = path.resolve(__dirname, "../app/achievements.tsx");
  let screenContent: string;

  beforeEach(() => {
    screenContent = fs.readFileSync(screenPath, "utf-8");
  });

  it("renders badge grid with FlatList numColumns=2", () => {
    expect(screenContent).toContain("numColumns={2}");
    expect(screenContent).toContain("FlatList");
  });

  it("shows progress summary (X/Y badges unlocked)", () => {
    expect(screenContent).toContain("Badges Unlocked");
    expect(screenContent).toContain("progressTrack");
    expect(screenContent).toContain("progressFill");
  });

  it("has category filter chips", () => {
    expect(screenContent).toContain("selectedCategory");
    expect(screenContent).toContain("filterChip");
    expect(screenContent).toContain("\"all\"");
    expect(screenContent).toContain("\"xp\"");
    expect(screenContent).toContain("\"streak\"");
  });

  it("shows locked/unlocked state per badge", () => {
    expect(screenContent).toContain("isUnlocked");
    expect(screenContent).toContain("lock-closed");
    expect(screenContent).toContain("lockOverlay");
    expect(screenContent).toContain("unlockedBadge");
  });

  it("imports and uses checkAndUnlockAchievements", () => {
    expect(screenContent).toContain("checkAndUnlockAchievements");
    expect(screenContent).toContain("getAchievementProgress");
  });

  it("navigates back with back button", () => {
    expect(screenContent).toContain("router.back()");
    expect(screenContent).toContain("arrow-back");
  });
});

// ─── DAILY XP GOAL MODULE TESTS ─────────────────────────────────────────────
describe("Daily XP Goal module", () => {
  const modulePath = path.resolve(__dirname, "../lib/daily-xp-goal.ts");
  let moduleContent: string;

  beforeEach(() => {
    moduleContent = fs.readFileSync(modulePath, "utf-8");
  });

  it("exports getDailyXPGoal and setDailyXPGoal", () => {
    expect(moduleContent).toContain("export async function getDailyXPGoal");
    expect(moduleContent).toContain("export async function setDailyXPGoal");
  });

  it("exports getDailyProgress and addDailyXP", () => {
    expect(moduleContent).toContain("export async function getDailyProgress");
    expect(moduleContent).toContain("export async function addDailyXP");
  });

  it("exports checkDailyGoalMet", () => {
    expect(moduleContent).toContain("export async function checkDailyGoalMet");
  });

  it("defines XP_GOAL_PRESETS with 4 levels", () => {
    expect(moduleContent).toContain("XP_GOAL_PRESETS");
    expect(moduleContent).toContain("Casual");
    expect(moduleContent).toContain("Regular");
    expect(moduleContent).toContain("Serious");
    expect(moduleContent).toContain("Intense");
  });

  it("defines REMINDER_TIME_PRESETS", () => {
    expect(moduleContent).toContain("REMINDER_TIME_PRESETS");
    expect(moduleContent).toContain("Morning");
    expect(moduleContent).toContain("Evening");
  });

  it("schedules notifications via expo-notifications", () => {
    expect(moduleContent).toContain("Notifications.scheduleNotificationAsync");
    expect(moduleContent).toContain("cancelScheduledNotificationAsync");
    expect(moduleContent).toContain("Daily XP Goal Reminder");
  });

  it("tracks daily progress by date key", () => {
    expect(moduleContent).toContain("getTodayKey");
    expect(moduleContent).toContain("YYYY-MM-DD");
  });

  it("DailyXPGoal interface has targetXP, reminderHour, reminderMinute, isEnabled", () => {
    expect(moduleContent).toContain("targetXP: number");
    expect(moduleContent).toContain("reminderHour: number");
    expect(moduleContent).toContain("reminderMinute: number");
    expect(moduleContent).toContain("isEnabled: boolean");
  });

  it("addDailyXP updates goalMet when target reached", () => {
    expect(moduleContent).toContain("progress.goalMet = progress.earnedXP >= goal.targetXP");
  });
});

// ─── DAILY XP GOAL SCREEN TESTS ─────────────────────────────────────────────
describe("Daily XP Goal screen", () => {
  const screenPath = path.resolve(__dirname, "../app/daily-xp-goal.tsx");
  let screenContent: string;

  beforeEach(() => {
    screenContent = fs.readFileSync(screenPath, "utf-8");
  });

  it("shows today's progress with XP/target", () => {
    expect(screenContent).toContain("Today's Progress");
    expect(screenContent).toContain("progressXP");
    expect(screenContent).toContain("progressTrack");
  });

  it("has XP target preset cards", () => {
    expect(screenContent).toContain("XP_GOAL_PRESETS");
    expect(screenContent).toContain("presetCard");
    expect(screenContent).toContain("selectedXP");
  });

  it("has reminder toggle with Switch", () => {
    expect(screenContent).toContain("Switch");
    expect(screenContent).toContain("isEnabled");
    expect(screenContent).toContain("Daily Reminder");
  });

  it("shows time presets when reminder is enabled", () => {
    expect(screenContent).toContain("REMINDER_TIME_PRESETS");
    expect(screenContent).toContain("timeChip");
    expect(screenContent).toContain("selectedTime");
  });

  it("has Save Goal button that calls setDailyXPGoal", () => {
    expect(screenContent).toContain("Save Goal");
    expect(screenContent).toContain("setDailyXPGoal");
    expect(screenContent).toContain("handleSave");
  });

  it("shows checkmark when daily goal is met", () => {
    expect(screenContent).toContain("goalMet");
    expect(screenContent).toContain("checkmark-circle");
  });
});

// ─── SHARE MILESTONE TESTS ──────────────────────────────────────────────────
describe("Share Milestone on XP Dashboard", () => {
  const dashboardPath = path.resolve(__dirname, "../app/xp-dashboard.tsx");
  let dashboardContent: string;

  beforeEach(() => {
    dashboardContent = fs.readFileSync(dashboardPath, "utf-8");
  });

  it("imports Share from react-native", () => {
    expect(dashboardContent).toContain("Share,");
    expect(dashboardContent).toMatch(/import\s*{[^}]*Share[^}]*}\s*from\s*"react-native"/);
  });

  it("has Share Milestone button with share-social icon", () => {
    expect(dashboardContent).toContain("Share Milestone");
    expect(dashboardContent).toContain("share-social");
    expect(dashboardContent).toContain("shareButton");
  });

  it("share message includes tier name and XP stats", () => {
    expect(dashboardContent).toContain("tier.name");
    expect(dashboardContent).toContain("totalXP");
    expect(dashboardContent).toContain("totalExercisesCompleted");
    expect(dashboardContent).toContain("totalSessionsCompleted");
  });

  it("has Achievements navigation button in header", () => {
    expect(dashboardContent).toContain("/achievements");
    expect(dashboardContent).toContain("ribbon");
  });

  it("triggers haptic feedback on share", () => {
    expect(dashboardContent).toContain("NotificationFeedbackType.Success");
  });
});
