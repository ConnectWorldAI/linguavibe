/**
 * Tests for Sprint: Recently Visited + Focus Mode + Milestone Celebrations
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Recently Visited Storage Module ─────────────────────────────────────────

describe("lib/recently-visited.ts", () => {
  const filePath = path.resolve(__dirname, "../lib/recently-visited.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports getRecentlyVisited function", () => {
    expect(content).toContain("export async function getRecentlyVisited");
  });

  it("exports addRecentlyVisited function", () => {
    expect(content).toContain("export async function addRecentlyVisited");
  });

  it("exports clearRecentlyVisited function", () => {
    expect(content).toContain("export async function clearRecentlyVisited");
  });

  it("uses AsyncStorage with correct key", () => {
    expect(content).toContain("@connectworld_recently_visited");
    expect(content).toContain("AsyncStorage");
  });

  it("caps items at MAX_ITEMS = 5", () => {
    expect(content).toContain("MAX_ITEMS = 5");
    expect(content).toContain(".slice(0, MAX_ITEMS)");
  });

  it("deduplicates by id", () => {
    expect(content).toContain("filter((i) => i.id !== item.id)");
  });

  it("stores visitedAt timestamp", () => {
    expect(content).toContain("visitedAt: Date.now()");
  });

  it("exports RecentlyVisitedItem interface with required fields", () => {
    expect(content).toContain("id: string");
    expect(content).toContain("title: string");
    expect(content).toContain("icon: string");
    expect(content).toContain("route: string");
    expect(content).toContain("color: string");
    expect(content).toContain("visitedAt: number");
  });
});

// ─── Recently Visited Row Component ──────────────────────────────────────────

describe("components/recently-visited-row.tsx", () => {
  const filePath = path.resolve(__dirname, "../components/recently-visited-row.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports RecentlyVisitedRow component", () => {
    expect(content).toContain("export function RecentlyVisitedRow");
  });

  it("imports getRecentlyVisited from storage module", () => {
    expect(content).toContain("getMergedRecentAndPinned");
    expect(content).toContain("@/lib/recently-visited");
  });

  it("renders horizontal ScrollView", () => {
    expect(content).toContain("ScrollView");
    expect(content).toContain("horizontal");
  });

  it("shows 'Recently Visited' header text", () => {
    expect(content).toContain("Recently Visited");
  });

  it("renders chips with icon and label", () => {
    expect(content).toContain("chipIcon");
    expect(content).toContain("chipLabel");
  });

  it("navigates on chip press via router.push", () => {
    expect(content).toContain("router.push");
  });

  it("tracks feature usage on tap", () => {
    expect(content).toContain("trackFeatureUsed");
  });

  it("returns null when items list is empty", () => {
    expect(content).toContain("if (items.length === 0) return null");
  });

  it("uses useFocusEffect for refreshing on screen focus", () => {
    expect(content).toContain("useFocusEffect");
  });
});

// ─── Home Screen Wiring ──────────────────────────────────────────────────────

describe("app/(tabs)/index.tsx - Recently Visited wiring", () => {
  const filePath = path.resolve(__dirname, "../app/(tabs)/index.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("imports RecentlyVisitedRow component", () => {
    expect(content).toContain("import { RecentlyVisitedRow }");
  });

  it("imports addRecentlyVisited from lib", () => {
    expect(content).toContain("import { addRecentlyVisited }");
  });

  it("renders RecentlyVisitedRow below search bar", () => {
    expect(content).toContain("<RecentlyVisitedRow");
  });

  it("calls addRecentlyVisited on explore item tap", () => {
    expect(content).toContain("addRecentlyVisited(");
  });

  it("passes refreshTrigger prop to RecentlyVisitedRow", () => {
    expect(content).toContain("refreshTrigger={recentRefresh}");
  });
});

// ─── Focus Mode Screen ───────────────────────────────────────────────────────

describe("app/focus-mode.tsx", () => {
  const filePath = path.resolve(__dirname, "../app/focus-mode.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports default screen component", () => {
    expect(content).toContain("export default function FocusModeScreen");
  });

  it("uses useKeepAwake to prevent screen sleep", () => {
    expect(content).toContain("useKeepAwake");
  });

  it("displays elapsed timer with formatTime function", () => {
    expect(content).toContain("formatTime");
    expect(content).toContain("elapsed");
  });

  it("has pause/resume functionality", () => {
    expect(content).toContain("isPaused");
    expect(content).toContain("handlePause");
    expect(content).toContain("Resume");
    expect(content).toContain("Pause");
  });

  it("has End Focus button that navigates back", () => {
    expect(content).toContain("handleEndFocus");
    expect(content).toContain("End Focus");
    expect(content).toContain("router.back()");
  });

  it("saves focus session history to AsyncStorage", () => {
    expect(content).toContain("@connectworld_focus_history");
    expect(content).toContain("AsyncStorage.setItem");
  });

  it("shows motivational messages based on elapsed time", () => {
    expect(content).toContain("getMotivation");
    expect(content).toContain("Getting started");
    expect(content).toContain("Great focus");
  });

  it("uses haptic feedback on end", () => {
    expect(content).toContain("Haptics.notificationAsync");
    expect(content).toContain("NotificationFeedbackType.Success");
  });

  it("accepts activity param from route", () => {
    expect(content).toContain("useLocalSearchParams");
    expect(content).toContain("activity");
  });

  it("shows FOCUS MODE badge at top", () => {
    expect(content).toContain("FOCUS MODE");
  });
});

// ─── Focus Mode in EXPLORE_CATEGORIES ────────────────────────────────────────

describe("Focus Mode in home screen categories", () => {
  const filePath = path.resolve(__dirname, "../app/(tabs)/index.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("has Focus Mode entry in EXPLORE_CATEGORIES", () => {
    expect(content).toContain("\"focus-mode\"");
    expect(content).toContain("\"Focus Mode\"");
    expect(content).toContain("\"/focus-mode\"");
  });
});

// ─── Milestone Celebration Module ────────────────────────────────────────────

describe("lib/milestone-celebration.ts", () => {
  const filePath = path.resolve(__dirname, "../lib/milestone-celebration.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("exists and exports celebrateDailyGoalComplete function", () => {
    expect(content).toContain("export async function celebrateDailyGoalComplete");
  });

  it("exports celebrateStreakMilestone function", () => {
    expect(content).toContain("export async function celebrateStreakMilestone");
  });

  it("exports isStreakMilestone function", () => {
    expect(content).toContain("export function isStreakMilestone");
  });

  it("defines STREAK_MILESTONES array with correct thresholds", () => {
    expect(content).toContain("STREAK_MILESTONES");
    expect(content).toContain("7");
    expect(content).toContain("14");
    expect(content).toContain("30");
    expect(content).toContain("60");
    expect(content).toContain("100");
    expect(content).toContain("365");
  });

  it("uses expo-haptics notificationAsync for success", () => {
    expect(content).toContain("Haptics.notificationAsync");
    expect(content).toContain("NotificationFeedbackType.Success");
  });

  it("uses expo-haptics impactAsync Heavy for burst", () => {
    expect(content).toContain("Haptics.impactAsync");
    expect(content).toContain("ImpactFeedbackStyle.Heavy");
  });

  it("skips haptics on web platform", () => {
    expect(content).toContain('Platform.OS === "web"');
  });

  it("scales intensity based on milestone level", () => {
    expect(content).toContain("getMilestoneIntensity");
    expect(content).toContain("light");
    expect(content).toContain("medium");
    expect(content).toContain("heavy");
  });

  it("exports playCelebrationSound function", () => {
    expect(content).toContain("export async function playCelebrationSound");
  });

  it("exports convenience functions celebrateDailyGoal and celebrateStreak", () => {
    expect(content).toContain("export async function celebrateDailyGoal");
    expect(content).toContain("export async function celebrateStreak");
  });
});

// ─── Milestone Celebration Wiring ────────────────────────────────────────────

describe("weekly-goals-storage.ts - milestone celebration wiring", () => {
  const filePath = path.resolve(__dirname, "../lib/weekly-goals-storage.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("calls celebrateDailyGoalComplete when a goal is completed", () => {
    expect(content).toContain("celebrateDailyGoalComplete");
    expect(content).toContain("justCompleted");
  });

  it("calls celebrateStreakMilestone in archiveAndResetGoals", () => {
    expect(content).toContain("celebrateStreakMilestone");
    expect(content).toContain("isStreakMilestone");
  });

  it("imports milestone celebration module", () => {
    expect(content).toContain("@/lib/milestone-celebration");
  });
});
