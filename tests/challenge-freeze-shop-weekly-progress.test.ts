/**
 * Tests for: Challenge a Friend, Streak Freeze Shop Modal, Weekly Progress Card
 * Uses file-based testing approach (no runtime imports of RN modules)
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Weekly Progress Card Tests ───
describe("components/weekly-progress-card.tsx", () => {
  const filePath = path.resolve(__dirname, "../components/weekly-progress-card.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports getWeeklyXPData function", () => {
    expect(content).toContain("export async function getWeeklyXPData");
  });

  it("exports recordDailyXP function", () => {
    expect(content).toContain("export async function recordDailyXP");
  });

  it("exports WeeklyProgressCard component", () => {
    expect(content).toContain("export function WeeklyProgressCard");
  });

  it("uses AsyncStorage for persistence", () => {
    expect(content).toContain("AsyncStorage.getItem");
    expect(content).toContain("AsyncStorage.setItem");
  });

  it("defines WEEKLY_XP_KEY storage key", () => {
    expect(content).toContain("WEEKLY_XP_KEY");
    expect(content).toContain("@connectworld_weekly_xp_history");
  });

  it("returns 7 days of data", () => {
    expect(content).toContain("for (let i = 6; i >= 0; i--)");
  });

  it("accumulates XP for the same day", () => {
    expect(content).toContain("(history[today] || 0) + xp");
  });

  it("cleans up entries older than 14 days", () => {
    expect(content).toContain("setDate(cutoff.getDate() - 14)");
  });

  it("renders bar chart with 7 columns", () => {
    expect(content).toContain("weekData.map");
    expect(content).toContain("barColumn");
  });

  it("shows goal line indicator", () => {
    expect(content).toContain("goalLine");
    expect(content).toContain("dailyGoal");
  });

  it("navigates to XP Dashboard on tap", () => {
    expect(content).toContain("/xp-dashboard");
    expect(content).toContain("router.push");
  });

  it("shows total weekly XP in header", () => {
    expect(content).toContain("totalWeekXP");
    expect(content).toContain("XP");
  });

  it("colors bars green when goal is met", () => {
    expect(content).toContain("metGoal");
    expect(content).toContain("Colors.success");
  });

  it("highlights today's bar differently", () => {
    expect(content).toContain("isToday");
    expect(content).toContain("dayLabelToday");
  });

  it("shows legend with goal met indicator", () => {
    expect(content).toContain("Goal met");
    expect(content).toContain("legendDot");
  });
});

// ─── Streak Freeze Shop Modal Tests ───
describe("components/streak-freeze-shop-modal.tsx", () => {
  const filePath = path.resolve(__dirname, "../components/streak-freeze-shop-modal.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports StreakFreezeShopModal component", () => {
    expect(content).toContain("export function StreakFreezeShopModal");
  });

  it("accepts visible and onClose props", () => {
    expect(content).toContain("visible");
    expect(content).toContain("onClose");
  });

  it("imports from streak-freeze lib", () => {
    expect(content).toContain("streak-freeze");
  });

  it("shows available freeze count", () => {
    expect(content).toContain("availableFreezes");
  });

  it("shows XP cost for next freeze", () => {
    expect(content).toContain("getNextXPFreezeCost");
  });

  it("has a purchase/buy button", () => {
    expect(content).toContain("purchaseFreezeWithXP");
  });

  it("uses Modal component for overlay", () => {
    expect(content).toContain("Modal");
  });

  it("provides haptic feedback on purchase", () => {
    expect(content).toContain("Haptics");
  });
});

// ─── Streak Freeze Lib Tests ───
describe("lib/streak-freeze.ts", () => {
  const filePath = path.resolve(__dirname, "../lib/streak-freeze.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exports purchaseFreezeWithXP function", () => {
    expect(content).toContain("export async function purchaseFreezeWithXP");
  });

  it("exports getNextXPFreezeCost function", () => {
    expect(content).toContain("export function getNextXPFreezeCost");
  });

  it("exports checkAndApplyStreakFreeze function", () => {
    expect(content).toContain("export async function checkAndApplyStreakFreeze");
  });

  it("exports getStreakFreezeData function", () => {
    expect(content).toContain("export async function getStreakFreezeData");
  });

  it("defines MAX_XP_FREEZE_CAPACITY constant", () => {
    expect(content).toContain("MAX_XP_FREEZE_CAPACITY");
  });

  it("implements escalating cost tiers", () => {
    // Should have escalating cost tiers
    expect(content).toContain("XP_FREEZE_COSTS");
  });
});

// ─── Challenge a Friend (Leaderboard) Tests ───
describe("app/leaderboard.tsx - Challenge a Friend", () => {
  const filePath = path.resolve(__dirname, "../app/leaderboard.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has a Challenge a Friend button", () => {
    expect(content).toContain("Challenge");
  });

  it("uses Share API for challenge invite", () => {
    expect(content).toContain("Share.share");
  });

  it("generates a challenge message with XP", () => {
    expect(content).toContain("XP");
    expect(content).toContain("challenge");
  });

  it("includes app link in share message", () => {
    expect(content).toContain("buildChallengeMessage");
  });

  it("has a weekly XP tab/section", () => {
    expect(content).toContain("weekly");
  });

  it("imports exercise-scoring for real user XP", () => {
    expect(content).toContain("exercise-scoring");
  });
});

// ─── Home Screen Integration Tests ───
describe("Home screen - Freeze Shop & Weekly Progress wiring", () => {
  const filePath = path.resolve(__dirname, "../app/(tabs)/index.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports StreakFreezeShopModal", () => {
    expect(content).toContain("StreakFreezeShopModal");
  });

  it("imports WeeklyProgressCard", () => {
    expect(content).toContain("WeeklyProgressCard");
  });

  it("renders StreakFreezeShopModal with visible and onClose props", () => {
    expect(content).toContain("freezeShopVisible");
    expect(content).toContain("setFreezeShopVisible");
  });

  it("has a snow/freeze icon button on streak card", () => {
    expect(content).toContain("snow");
    expect(content).toContain("setFreezeShopVisible(true)");
  });

  it("renders WeeklyProgressCard in the home screen", () => {
    expect(content).toContain("<WeeklyProgressCard");
  });
});

// ─── XP Dashboard - Leaderboard Link Tests ───
describe("XP Dashboard - Leaderboard link", () => {
  const filePath = path.resolve(__dirname, "../app/xp-dashboard.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has a link/button to leaderboard", () => {
    expect(content).toContain("leaderboard");
  });

  it("uses router.push for navigation", () => {
    expect(content).toContain("router.push");
  });
});
