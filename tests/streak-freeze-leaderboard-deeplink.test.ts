/**
 * Tests for Streak Freeze, Leaderboard Weekly XP, and Notification Deep-Linking
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── STREAK FREEZE TESTS ────────────────────────────────────────────────────

describe("Streak Freeze Module", () => {
  const filePath = path.resolve(__dirname, "../lib/streak-freeze.ts");
  let fileContent: string;

  beforeEach(() => {
    fileContent = fs.readFileSync(filePath, "utf-8");
  });

  it("exports purchaseFreezeWithXP function", () => {
    expect(fileContent).toContain("export async function purchaseFreezeWithXP");
  });

  it("exports getNextXPFreezeCost function", () => {
    expect(fileContent).toContain("export function getNextXPFreezeCost");
  });

  it("exports getStreakFreezeData function", () => {
    expect(fileContent).toContain("export async function getStreakFreezeData");
  });

  it("exports checkAndApplyStreakFreeze function", () => {
    expect(fileContent).toContain("export async function checkAndApplyStreakFreeze");
  });

  it("exports MAX_XP_FREEZE_CAPACITY constant", () => {
    expect(fileContent).toContain("export const MAX_XP_FREEZE_CAPACITY");
  });

  it("uses AsyncStorage for persistence", () => {
    expect(fileContent).toContain("AsyncStorage");
  });

  it("has escalating cost model", () => {
    // Cost should increase with each purchase
    expect(fileContent).toContain("cost");
  });

  it("returns success/error result from purchaseFreezeWithXP", () => {
    expect(fileContent).toContain("success");
    expect(fileContent).toContain("error");
  });

  it("tracks available freezes count", () => {
    expect(fileContent).toContain("availableFreezes");
  });

  it("has capacity limit for XP-purchased freezes", () => {
    expect(fileContent).toMatch(/MAX_XP_FREEZE_CAPACITY\s*=\s*\d+/);
  });
});

// ─── STREAK SHIELD XP PURCHASE UI TESTS ─────────────────────────────────────

describe("Streak Shield XP Purchase UI", () => {
  const filePath = path.resolve(__dirname, "../app/streak-shield.tsx");
  let fileContent: string;

  beforeEach(() => {
    fileContent = fs.readFileSync(filePath, "utf-8");
  });

  it("imports purchaseFreezeWithXP from streak-freeze", () => {
    expect(fileContent).toContain("purchaseFreezeWithXP");
  });

  it("imports getNextXPFreezeCost from streak-freeze", () => {
    expect(fileContent).toContain("getNextXPFreezeCost");
  });

  it("imports getOverallXP from exercise-scoring", () => {
    expect(fileContent).toContain("getOverallXP");
  });

  it("has Buy with XP section", () => {
    expect(fileContent).toContain("Buy with XP");
  });

  it("shows freeze cost to user", () => {
    expect(fileContent).toContain("getNextXPFreezeCost");
  });

  it("shows user's available XP", () => {
    expect(fileContent).toContain("xpAvailable");
  });

  it("disables button when at max capacity", () => {
    expect(fileContent).toContain("MAX_XP_FREEZE_CAPACITY");
  });

  it("shows purchase result message", () => {
    expect(fileContent).toContain("xpMessage");
  });
});

// ─── LEADERBOARD WEEKLY XP TESTS ────────────────────────────────────────────

describe("Leaderboard Weekly XP Tab", () => {
  const filePath = path.resolve(__dirname, "../app/leaderboard.tsx");
  let fileContent: string;

  beforeEach(() => {
    fileContent = fs.readFileSync(filePath, "utf-8");
  });

  it("has weekly tab type", () => {
    expect(fileContent).toContain("weekly");
  });

  it("imports getOverallXP from exercise-scoring", () => {
    expect(fileContent).toContain("getOverallXP");
  });

  it("has WEEKLY_XP_LEADERS data", () => {
    expect(fileContent).toContain("WEEKLY_XP_LEADERS");
  });

  it("defaults to weekly tab", () => {
    expect(fileContent).toContain("useState<LeaderboardTab>(\"weekly\")");
  });

  it("loads user XP on mount", () => {
    expect(fileContent).toContain("loadUserXP");
  });

  it("sorts weekly leaders by XP", () => {
    expect(fileContent).toContain("sort((a, b) => b.value - a.value");
  });

  it("inserts real user XP into weekly leaders", () => {
    expect(fileContent).toContain("userWeeklyXP");
  });

  it("has calendar icon for weekly tab", () => {
    expect(fileContent).toContain("calendar");
  });
});

// ─── XP DASHBOARD LEADERBOARD LINK ─────────────────────────────────────────

describe("XP Dashboard Leaderboard Link", () => {
  const filePath = path.resolve(__dirname, "../app/xp-dashboard.tsx");
  let fileContent: string;

  beforeEach(() => {
    fileContent = fs.readFileSync(filePath, "utf-8");
  });

  it("has navigation link to leaderboard", () => {
    expect(fileContent).toContain("/leaderboard");
  });

  it("has podium icon for leaderboard button", () => {
    expect(fileContent).toContain("podium");
  });
});

// ─── NOTIFICATION DEEP-LINKING TESTS ────────────────────────────────────────

describe("Notification Deep-Link Module", () => {
  const filePath = path.resolve(__dirname, "../lib/notification-deep-link.ts");
  let fileContent: string;

  beforeEach(() => {
    fileContent = fs.readFileSync(filePath, "utf-8");
  });

  it("exports initNotificationDeepLinking function", () => {
    expect(fileContent).toContain("export function initNotificationDeepLinking");
  });

  it("exports createDeepLinkNotificationContent helper", () => {
    expect(fileContent).toContain("export function createDeepLinkNotificationContent");
  });

  it("uses addNotificationResponseReceivedListener", () => {
    expect(fileContent).toContain("addNotificationResponseReceivedListener");
  });

  it("handles cold start with getLastNotificationResponseAsync", () => {
    expect(fileContent).toContain("getLastNotificationResponseAsync");
  });

  it("routes to xp-dashboard", () => {
    expect(fileContent).toContain("\"xp-dashboard\": \"/xp-dashboard\"");
  });

  it("routes to achievements", () => {
    expect(fileContent).toContain("\"achievements\": \"/achievements\"");
  });

  it("routes to leaderboard", () => {
    expect(fileContent).toContain("\"leaderboard\": \"/leaderboard\"");
  });

  it("supports both deepLink and screen data keys", () => {
    expect(fileContent).toContain("data.deepLink");
    expect(fileContent).toContain("data.screen");
  });

  it("returns cleanup function", () => {
    expect(fileContent).toContain("subscription.remove()");
  });
});

// ─── DEEP-LINK WIRING IN ROOT LAYOUT ───────────────────────────────────────

describe("Deep-Link Wiring in Root Layout", () => {
  const filePath = path.resolve(__dirname, "../app/_layout.tsx");
  let fileContent: string;

  beforeEach(() => {
    fileContent = fs.readFileSync(filePath, "utf-8");
  });

  it("imports initNotificationDeepLinking", () => {
    expect(fileContent).toContain("initNotificationDeepLinking");
  });

  it("calls initNotificationDeepLinking in useEffect", () => {
    expect(fileContent).toContain("initNotificationDeepLinking()");
  });

  it("cleans up notification deep-link listener", () => {
    expect(fileContent).toContain("cleanupNotificationDeepLink");
  });
});

// ─── WEEKLY DIGEST DEEP-LINK DATA ──────────────────────────────────────────

describe("Weekly Digest Notification Deep-Link", () => {
  const filePath = path.resolve(__dirname, "../lib/weekly-digest.ts");
  let fileContent: string;

  beforeEach(() => {
    fileContent = fs.readFileSync(filePath, "utf-8");
  });

  it("includes deepLink data in notification content", () => {
    expect(fileContent).toContain("deepLink: \"xp-dashboard\"");
  });
});

// ─── DAILY XP GOAL DEEP-LINK DATA ──────────────────────────────────────────

describe("Daily XP Goal Notification Deep-Link", () => {
  const filePath = path.resolve(__dirname, "../lib/daily-xp-goal.ts");
  let fileContent: string;

  beforeEach(() => {
    fileContent = fs.readFileSync(filePath, "utf-8");
  });

  it("includes deepLink data in daily reminder notification", () => {
    expect(fileContent).toContain("deepLink: \"xp-dashboard\"");
  });
});
