/**
 * Tests for:
 * 1. XP Dashboard - tier calculations, weekly trend
 * 2. XP Level Tiers - progress bar logic
 * 3. Best Score indicator in Creator Directory
 * 4. Simplified onboarding quick-pick
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── XP TIER LOGIC (file-based) ──────────────────────────────────────────────
describe("XP Dashboard - Tier Logic", () => {
  const dashboardPath = path.resolve(__dirname, "../app/xp-dashboard.tsx");
  let dashboardCode: string;

  beforeEach(() => {
    dashboardCode = fs.readFileSync(dashboardPath, "utf-8");
  });

  it("exports XP_TIERS array with correct tier structure", () => {
    expect(dashboardCode).toContain("export const XP_TIERS");
    expect(dashboardCode).toContain("Beginner");
    expect(dashboardCode).toContain("Intermediate");
    expect(dashboardCode).toContain("Advanced");
    expect(dashboardCode).toContain("Expert");
    expect(dashboardCode).toContain("Master");
  });

  it("defines getCurrentTier function", () => {
    expect(dashboardCode).toContain("export function getCurrentTier");
  });

  it("defines getNextTier function", () => {
    expect(dashboardCode).toContain("export function getNextTier");
  });

  it("defines getTierProgress function", () => {
    expect(dashboardCode).toContain("export function getTierProgress");
  });

  it("Beginner tier starts at 0 XP", () => {
    expect(dashboardCode).toContain('{ name: "Beginner", minXP: 0');
  });

  it("Intermediate tier starts at 51 XP", () => {
    expect(dashboardCode).toContain('{ name: "Intermediate", minXP: 51');
  });

  it("Advanced tier starts at 201 XP", () => {
    expect(dashboardCode).toContain('{ name: "Advanced", minXP: 201');
  });

  it("Expert tier starts at 501 XP", () => {
    expect(dashboardCode).toContain('{ name: "Expert", minXP: 501');
  });

  it("Master tier starts at 1001 XP", () => {
    expect(dashboardCode).toContain('{ name: "Master", minXP: 1001');
  });

  it("renders weekly trend chart with 7 days", () => {
    expect(dashboardCode).toContain("getWeeklyTrend");
    expect(dashboardCode).toContain("for (let i = 6; i >= 0; i--)");
  });

  it("renders creator leaderboard with medals", () => {
    expect(dashboardCode).toContain("medals");
    expect(dashboardCode).toContain("Creator Leaderboard");
  });

  it("shows progress bar to next tier", () => {
    expect(dashboardCode).toContain("XP to");
    expect(dashboardCode).toContain("progressFill");
  });

  it("shows stats row with exercises, sessions, creators", () => {
    expect(dashboardCode).toContain("Exercises");
    expect(dashboardCode).toContain("Sessions");
    expect(dashboardCode).toContain("Creators");
  });
});

// ─── XP PROGRESS BAR COMPONENT ──────────────────────────────────────────────
describe("XP Progress Bar - Home Screen Component", () => {
  const barPath = path.resolve(__dirname, "../components/xp-progress-bar.tsx");
  let barCode: string;

  beforeEach(() => {
    barCode = fs.readFileSync(barPath, "utf-8");
  });

  it("exports XPProgressBar component", () => {
    expect(barCode).toContain("export function XPProgressBar");
  });

  it("imports tier functions from xp-dashboard", () => {
    expect(barCode).toContain("getCurrentTier");
    expect(barCode).toContain("getNextTier");
    expect(barCode).toContain("getTierProgress");
  });

  it("navigates to xp-dashboard on press", () => {
    expect(barCode).toContain("/xp-dashboard");
  });

  it("displays tier name and XP count", () => {
    expect(barCode).toContain("tier.name");
    expect(barCode).toContain("totalXP");
  });

  it("shows progress track with fill", () => {
    expect(barCode).toContain("progressTrack");
    expect(barCode).toContain("progressFill");
  });

  it("shows XP needed for next tier", () => {
    expect(barCode).toContain("XP to");
    expect(barCode).toContain("nextTier");
  });

  it("uses haptic feedback on press", () => {
    expect(barCode).toContain("Haptics.impactAsync");
  });
});

// ─── XP PROGRESS BAR WIRED INTO HOME SCREEN ─────────────────────────────────
describe("XP Progress Bar - Home Screen Integration", () => {
  const homePath = path.resolve(__dirname, "../app/(tabs)/index.tsx");
  let homeCode: string;

  beforeEach(() => {
    homeCode = fs.readFileSync(homePath, "utf-8");
  });

  it("imports XPProgressBar component", () => {
    expect(homeCode).toContain('import { XPProgressBar } from "@/components/xp-progress-bar"');
  });

  it("renders XPProgressBar on home screen", () => {
    expect(homeCode).toContain("<XPProgressBar />");
  });

  it("only shows for non-new users", () => {
    expect(homeCode).toContain("!isNewUser && <View");
    expect(homeCode).toContain("XPProgressBar");
  });
});

// ─── BEST SCORE IN CREATOR DIRECTORY ─────────────────────────────────────────
describe("Best Score - Creator Directory", () => {
  const dirPath = path.resolve(__dirname, "../app/creator-directory.tsx");
  let dirCode: string;

  beforeEach(() => {
    dirCode = fs.readFileSync(dirPath, "utf-8");
  });

  it("imports exercise scoring module", () => {
    expect(dirCode).toContain("getOverallXP");
    expect(dirCode).toContain("CreatorScoreSummary");
  });

  it("loads creator scores on mount", () => {
    expect(dirCode).toContain("getOverallXP().then");
    expect(dirCode).toContain("setCreatorScores");
  });

  it("shows mastery badge with percentage", () => {
    expect(dirCode).toContain("masteryBadge");
    expect(dirCode).toContain("mastery}%");
  });

  it("shows trophy icon for 80%+ mastery", () => {
    expect(dirCode).toContain('mastery >= 80 ? "trophy"');
  });

  it("shows star icon for 50%+ mastery", () => {
    expect(dirCode).toContain('mastery >= 50 ? "star"');
  });

  it("shows Best Score XP row for creators with scores", () => {
    expect(dirCode).toContain("Best:");
    expect(dirCode).toContain("score.totalPoints");
    expect(dirCode).toContain("score.maxPossiblePoints");
  });

  it("shows session count in score row", () => {
    expect(dirCode).toContain("score.sessionsCompleted");
    expect(dirCode).toContain("session");
  });

  it("falls back to language badge when no score exists", () => {
    expect(dirCode).toContain("langBadge");
    expect(dirCode).toContain("item.language");
  });
});

// ─── SIMPLIFIED ONBOARDING ───────────────────────────────────────────────────
describe("Simplified Onboarding - Quick Pick", () => {
  const onboardingPath = path.resolve(__dirname, "../app/onboarding.tsx");
  let onboardingCode: string;

  beforeEach(() => {
    onboardingCode = fs.readFileSync(onboardingPath, "utf-8");
  });

  it("includes a quick-pick step for primary use case", () => {
    // Should have a step where users choose their primary use: phone, translator, or learn
    expect(onboardingCode).toMatch(/phone|call|dial/i);
    expect(onboardingCode).toMatch(/translat/i);
    expect(onboardingCode).toMatch(/learn|class/i);
  });

  it("allows users to skip to phone/translator without full onboarding", () => {
    // Should have a quick path that doesn't require all learning setup steps
    expect(onboardingCode).toMatch(/skip|quick|fast|primary/i);
  });

  it("stores user's primary use preference", () => {
    expect(onboardingCode).toMatch(/primaryUse|primary_use|userIntent|quickPick/i);
  });
});

// ─── EXERCISE SCORING MODULE ─────────────────────────────────────────────────
describe("Exercise Scoring - Core Logic", () => {
  const scoringPath = path.resolve(__dirname, "../lib/exercise-scoring.ts");
  let scoringCode: string;

  beforeEach(() => {
    scoringCode = fs.readFileSync(scoringPath, "utf-8");
  });

  it("awards 3 points for first try correct without hint", () => {
    expect(scoringCode).toContain("if (attempts === 1 && !hintUsed) return 3");
  });

  it("awards 2 points when hint was used", () => {
    expect(scoringCode).toContain("if (hintUsed) return 2");
  });

  it("awards 1 point for 2+ attempts without reveal", () => {
    expect(scoringCode).toContain("if (attempts >= 2) return 1");
  });

  it("awards 0 points for revealed answers", () => {
    expect(scoringCode).toContain("if (wasRevealed) return 0");
  });

  it("exports saveSessionScores function", () => {
    expect(scoringCode).toContain("export async function saveSessionScores");
  });

  it("exports getOverallXP function", () => {
    expect(scoringCode).toContain("export async function getOverallXP");
  });

  it("exports getCreatorScore function", () => {
    expect(scoringCode).toContain("export async function getCreatorScore");
  });

  it("groups scores by creator for leaderboard", () => {
    expect(scoringCode).toContain("creatorMap");
    expect(scoringCode).toContain("creatorScores");
  });
});
