/**
 * Tests for: addDailyXP wiring in exercise completion, Badge Toast, and Weekly Digest.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

const projectRoot = path.resolve(__dirname, "..");

// ─── DAILY XP WIRING TESTS ─────────────────────────────────────────────────
describe("addDailyXP wired into exercise completion", () => {
  const exercisePath = path.join(projectRoot, "app/creator-exercise.tsx");
  let content: string;

  beforeEach(() => {
    content = fs.readFileSync(exercisePath, "utf-8");
  });

  it("imports addDailyXP from daily-xp-goal", () => {
    expect(content).toContain("import { addDailyXP } from \"@/lib/daily-xp-goal\"");
  });

  it("calls addDailyXP after saveSessionScores", () => {
    const saveIdx = content.indexOf("saveSessionScores");
    const addIdx = content.indexOf("addDailyXP(totalXP)");
    expect(addIdx).toBeGreaterThan(saveIdx);
  });

  it("passes totalXP to addDailyXP", () => {
    expect(content).toContain("await addDailyXP(totalXP)");
  });
});

// ─── BADGE TOAST COMPONENT TESTS ────────────────────────────────────────────
describe("Badge Toast component", () => {
  const toastPath = path.join(projectRoot, "components/badge-toast.tsx");
  let content: string;

  beforeEach(() => {
    content = fs.readFileSync(toastPath, "utf-8");
  });

  it("file exists", () => {
    expect(fs.existsSync(toastPath)).toBe(true);
  });

  it("exports BadgeToast component", () => {
    expect(content).toContain("export function BadgeToast");
  });

  it("accepts badge prop and onDismiss callback", () => {
    expect(content).toContain("BadgeToastProps");
    expect(content).toContain("badge:");
    expect(content).toContain("onDismiss:");
  });

  it("uses Animated for slide-in animation", () => {
    expect(content).toContain("Animated.View");
    expect(content).toContain("slideAnim");
    expect(content).toContain("Animated.spring");
  });

  it("shows badge icon and name from ACHIEVEMENTS", () => {
    expect(content).toContain("ACHIEVEMENTS.find");
    expect(content).toContain("achievement.icon");
    expect(content).toContain("achievement.name");
    expect(content).toContain("achievement.description");
  });

  it("shows 'New Badge Unlocked!' title", () => {
    expect(content).toContain("New Badge Unlocked!");
  });

  it("auto-dismisses after duration", () => {
    expect(content).toContain("setTimeout");
    expect(content).toContain("dismiss()");
    expect(content).toContain("duration");
  });

  it("triggers haptic feedback on show", () => {
    expect(content).toContain("NotificationFeedbackType.Success");
  });

  it("has close button for manual dismiss", () => {
    expect(content).toContain("\"close\"");
    expect(content).toContain("onPress={dismiss}");
  });

  it("positioned absolutely at top of screen", () => {
    expect(content).toContain("position: \"absolute\"");
    expect(content).toContain("top:");
    expect(content).toContain("zIndex: 9999");
  });
});

// ─── BADGE TOAST WIRED IN HOME SCREEN ───────────────────────────────────────
describe("Badge Toast wired in home screen", () => {
  const homePath = path.join(projectRoot, "app/(tabs)/index.tsx");
  let content: string;

  beforeEach(() => {
    content = fs.readFileSync(homePath, "utf-8");
  });

  it("imports BadgeToast component", () => {
    expect(content).toContain("BadgeToast");
    expect(content).toContain("badge-toast");
  });

  it("imports checkAndUnlockAchievements", () => {
    expect(content).toContain("checkAndUnlockAchievements");
    expect(content).toContain("UserStats");
  });

  it("imports getOverallXP for stats", () => {
    expect(content).toContain("getOverallXP");
    expect(content).toContain("exercise-scoring");
  });

  it("has badgeToast state", () => {
    expect(content).toContain("badgeToast");
    expect(content).toContain("setBadgeToast");
  });

  it("checks achievements on mount with delay", () => {
    expect(content).toContain("checkAchievements");
    expect(content).toContain("setTimeout(checkAchievements");
    expect(content).toContain("1500");
  });

  it("builds UserStats from XP data and streak", () => {
    expect(content).toContain("totalXP: xpData.totalXP");
    expect(content).toContain("currentStreak: streak");
    expect(content).toContain("totalSessions:");
    expect(content).toContain("totalExercises:");
    expect(content).toContain("creatorsAttempted:");
  });

  it("shows toast for first newly unlocked badge", () => {
    expect(content).toContain("setBadgeToast({ badgeId: newBadgeIds[0] })");
  });

  it("renders BadgeToast component", () => {
    expect(content).toContain("<BadgeToast");
    expect(content).toContain("badge={badgeToast}");
    expect(content).toContain("onDismiss={() => setBadgeToast(null)}");
  });
});

// ─── WEEKLY DIGEST MODULE TESTS ─────────────────────────────────────────────
describe("Weekly Digest module", () => {
  const digestPath = path.join(projectRoot, "lib/weekly-digest.ts");
  let content: string;

  beforeEach(() => {
    content = fs.readFileSync(digestPath, "utf-8");
  });

  it("file exists", () => {
    expect(fs.existsSync(digestPath)).toBe(true);
  });

  it("exports getWeeklyDigestSettings and setWeeklyDigestSettings", () => {
    expect(content).toContain("export async function getWeeklyDigestSettings");
    expect(content).toContain("export async function setWeeklyDigestSettings");
  });

  it("exports scheduleWeeklyDigestNotification", () => {
    expect(content).toContain("export async function scheduleWeeklyDigestNotification");
  });

  it("exports cancelWeeklyDigestNotification", () => {
    expect(content).toContain("export async function cancelWeeklyDigestNotification");
  });

  it("exports generateWeeklyDigest", () => {
    expect(content).toContain("export async function generateWeeklyDigest");
  });

  it("exports formatDigestMessage", () => {
    expect(content).toContain("export function formatDigestMessage");
  });

  it("exports isDigestDueThisWeek", () => {
    expect(content).toContain("export async function isDigestDueThisWeek");
  });

  it("exports DAY_NAMES array", () => {
    expect(content).toContain("export const DAY_NAMES");
    expect(content).toContain("Sunday");
    expect(content).toContain("Saturday");
  });

  it("defines WeeklyDigestSettings interface", () => {
    expect(content).toContain("export interface WeeklyDigestSettings");
    expect(content).toContain("isEnabled: boolean");
    expect(content).toContain("dayOfWeek: number");
    expect(content).toContain("hour: number");
    expect(content).toContain("minute: number");
  });

  it("defines WeeklyDigestEntry interface", () => {
    expect(content).toContain("export interface WeeklyDigestEntry");
    expect(content).toContain("weekStartDate:");
    expect(content).toContain("xpEarned:");
    expect(content).toContain("badgesUnlocked:");
    expect(content).toContain("exercisesCompleted:");
    expect(content).toContain("streakDays:");
  });

  it("uses expo-notifications for scheduling", () => {
    expect(content).toContain("Notifications.scheduleNotificationAsync");
    expect(content).toContain("SchedulableTriggerInputTypes.WEEKLY");
  });

  it("uses AsyncStorage for persistence", () => {
    expect(content).toContain("AsyncStorage");
    expect(content).toContain("@weekly_digest_settings");
    expect(content).toContain("@weekly_digest_history");
  });

  it("keeps last 12 weeks of history", () => {
    expect(content).toContain("slice(-12)");
  });

  it("formatDigestMessage includes XP, badges, exercises, streak", () => {
    expect(content).toContain("XP earned");
    expect(content).toContain("badge");
    expect(content).toContain("exercises completed");
    expect(content).toContain("streak");
  });

  it("notification content has title and body", () => {
    expect(content).toContain("Your Weekly Progress");
    expect(content).toContain("weekly achievements digest");
  });
});

// ─── WEEKLY DIGEST UI IN DAILY XP GOAL SCREEN ──────────────────────────────
describe("Weekly Digest UI in daily-xp-goal screen", () => {
  const screenPath = path.join(projectRoot, "app/daily-xp-goal.tsx");
  let content: string;

  beforeEach(() => {
    content = fs.readFileSync(screenPath, "utf-8");
  });

  it("imports weekly digest functions", () => {
    expect(content).toContain("getWeeklyDigestSettings");
    expect(content).toContain("setWeeklyDigestSettings");
    expect(content).toContain("DAY_NAMES");
  });

  it("has digestEnabled state", () => {
    expect(content).toContain("digestEnabled");
    expect(content).toContain("setDigestEnabled");
  });

  it("has digestDay state", () => {
    expect(content).toContain("digestDay");
    expect(content).toContain("setDigestDay");
  });

  it("shows Weekly Digest section with newspaper icon", () => {
    expect(content).toContain("Weekly Digest");
    expect(content).toContain("newspaper");
  });

  it("has Weekly Summary toggle switch", () => {
    expect(content).toContain("Weekly Summary");
    expect(content).toContain("Switch");
    expect(content).toContain("digestEnabled");
  });

  it("shows day-of-week chips when enabled", () => {
    expect(content).toContain("DAY_NAMES.map");
    expect(content).toContain("dayChip");
  });

  it("calls setWeeklyDigestSettings on day change", () => {
    expect(content).toContain("setWeeklyDigestSettings");
    expect(content).toContain("dayOfWeek: idx");
  });
});
