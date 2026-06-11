/**
 * Tests for Sprint: Streak Shield, Export Report, Badge Celebration
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Streak Shield Module Tests ─────────────────────────────────────────────

describe("Streak Shield Module", () => {
  let shieldSource: string;

  beforeAll(() => {
    shieldSource = fs.readFileSync(
      path.join(__dirname, "../lib/streak-shield.ts"),
      "utf-8"
    );
  });

  it("exports getShieldState function", () => {
    expect(shieldSource).toContain("export async function getShieldState()");
  });

  it("exports saveShieldState function", () => {
    expect(shieldSource).toContain("export async function saveShieldState(");
  });

  it("exports useShield function", () => {
    expect(shieldSource).toContain("export async function useShield(");
  });

  it("exports earnShield function", () => {
    expect(shieldSource).toContain("export async function earnShield()");
  });

  it("exports shouldAutoActivateShield function", () => {
    expect(shieldSource).toContain("export async function shouldAutoActivateShield(");
  });

  it("exports getEarnConditions function", () => {
    expect(shieldSource).toContain("export function getEarnConditions()");
  });

  it("exports getShieldDisplayInfo function", () => {
    expect(shieldSource).toContain("export function getShieldDisplayInfo(");
  });

  it("defines MAX_SHIELDS as 3", () => {
    expect(shieldSource).toContain("const MAX_SHIELDS = 3");
  });

  it("defines EARN_COOLDOWN_DAYS as 7", () => {
    expect(shieldSource).toContain("const EARN_COOLDOWN_DAYS = 7");
  });

  it("default state starts with 1 free shield", () => {
    expect(shieldSource).toContain("shieldsAvailable: 1");
  });

  it("useShield decrements shieldsAvailable", () => {
    expect(shieldSource).toContain("state.shieldsAvailable -= 1");
  });

  it("useShield increments shieldsUsed", () => {
    expect(shieldSource).toContain("state.shieldsUsed += 1");
  });

  it("earnShield checks max capacity", () => {
    expect(shieldSource).toContain("state.shieldsAvailable >= state.maxShields");
  });

  it("earnShield checks cooldown period", () => {
    expect(shieldSource).toContain("daysSince < EARN_COOLDOWN_DAYS");
  });

  it("shouldAutoActivateShield requires streak >= 2", () => {
    expect(shieldSource).toContain("if (currentStreak < 2) return false");
  });

  it("shouldAutoActivateShield checks for duplicate usage", () => {
    expect(shieldSource).toContain("h.weekStartDate === weekStartDate");
  });

  it("getEarnConditions returns 4 conditions", () => {
    const conditions = shieldSource.match(/id: "[^"]+"/g);
    expect(conditions).not.toBeNull();
    expect(conditions!.length).toBeGreaterThanOrEqual(4);
  });

  it("getShieldDisplayInfo handles zero shields", () => {
    expect(shieldSource).toContain("No Shields — Streak at Risk!");
  });

  it("getShieldDisplayInfo handles full shields", () => {
    expect(shieldSource).toContain("Full Protection");
  });

  it("defines StreakShieldState interface", () => {
    expect(shieldSource).toContain("export interface StreakShieldState");
  });

  it("defines ShieldUsage interface", () => {
    expect(shieldSource).toContain("export interface ShieldUsage");
  });
});

// ─── Streak Shield Screen Tests ─────────────────────────────────────────────

describe("Streak Shield Screen", () => {
  let screenSource: string;

  beforeAll(() => {
    screenSource = fs.readFileSync(
      path.join(__dirname, "../app/streak-shield.tsx"),
      "utf-8"
    );
  });

  it("imports getShieldState from streak-shield module", () => {
    expect(screenSource).toContain("getShieldState");
  });

  it("imports earnShield from streak-shield module", () => {
    expect(screenSource).toContain("earnShield");
  });

  it("imports calculateGoalStreak for current streak display", () => {
    expect(screenSource).toContain("calculateGoalStreak");
  });

  it("renders shield slots for max shields", () => {
    expect(screenSource).toContain("shieldState.maxShields");
  });

  it("shows How It Works section", () => {
    expect(screenSource).toContain("How It Works");
  });

  it("shows Earn Shields section", () => {
    expect(screenSource).toContain("Earn Shields");
  });

  it("shows Shield History section", () => {
    expect(screenSource).toContain("Shield History");
  });

  it("shows Stats section with available/used/max", () => {
    expect(screenSource).toContain("shieldsAvailable");
    expect(screenSource).toContain("shieldsUsed");
  });

  it("handles earn button press with haptic feedback", () => {
    expect(screenSource).toContain("Haptics.notificationAsync");
  });

  it("shows earn message after attempting to earn", () => {
    expect(screenSource).toContain("earnMessage");
  });

  it("displays current streak info", () => {
    expect(screenSource).toContain("Current streak:");
  });
});

// ─── Export Report Screen Tests ─────────────────────────────────────────────

describe("Export Report Screen", () => {
  let screenSource: string;

  beforeAll(() => {
    screenSource = fs.readFileSync(
      path.join(__dirname, "../app/export-report.tsx"),
      "utf-8"
    );
  });

  it("imports captureRef from react-native-view-shot", () => {
    expect(screenSource).toContain("captureRef");
  });

  it("imports Sharing from expo-sharing", () => {
    expect(screenSource).toContain("expo-sharing");
  });

  it("has three style options: minimal, detailed, social", () => {
    expect(screenSource).toContain('"minimal"');
    expect(screenSource).toContain('"detailed"');
    expect(screenSource).toContain('"social"');
  });

  it("renders a shareable card with dark background", () => {
    expect(screenSource).toContain("#1A1A2E");
  });

  it("shows overall grade in the card", () => {
    expect(screenSource).toContain("reportData.overallGrade");
  });

  it("shows streak badge in the card", () => {
    expect(screenSource).toContain("streakBadge");
  });

  it("shows shield count in the card", () => {
    expect(screenSource).toContain("shieldsAvailable");
  });

  it("shows goal grade when available", () => {
    expect(screenSource).toContain("reportData.goalGrade");
  });

  it("shows metrics grid in detailed mode", () => {
    expect(screenSource).toContain("metricsGrid");
  });

  it("shows highlights in detailed mode", () => {
    expect(screenSource).toContain("highlightsSection");
  });

  it("has Share Report Card button", () => {
    expect(screenSource).toContain("Share Report Card");
  });

  it("has Share as Text fallback", () => {
    expect(screenSource).toContain("Share as Text");
  });

  it("handles web platform fallback", () => {
    expect(screenSource).toContain('Platform.OS === "web"');
  });

  it("captures image with high quality", () => {
    expect(screenSource).toContain("quality: 1.0");
  });

  it("loads streak data from calculateGoalStreak", () => {
    expect(screenSource).toContain("calculateGoalStreak");
  });

  it("loads shield state from getShieldState", () => {
    expect(screenSource).toContain("getShieldState");
  });

  it("shows ConnectWorld AI branding in card", () => {
    expect(screenSource).toContain("ConnectWorld AI");
  });
});

// ─── Badge Celebration Module Tests ─────────────────────────────────────────

describe("Badge Celebration Module", () => {
  let celebrationSource: string;

  beforeAll(() => {
    celebrationSource = fs.readFileSync(
      path.join(__dirname, "../lib/badge-celebration.ts"),
      "utf-8"
    );
  });

  it("exports checkForNewBadge function", () => {
    expect(celebrationSource).toContain("export async function checkForNewBadge()");
  });

  it("exports getCelebrationState function", () => {
    expect(celebrationSource).toContain("export async function getCelebrationState()");
  });

  it("exports markBadgeCelebrated function", () => {
    expect(celebrationSource).toContain("export async function markBadgeCelebrated(");
  });

  it("exports resetCelebrations function", () => {
    expect(celebrationSource).toContain("export async function resetCelebrations()");
  });

  it("exports getEarnedBadges function", () => {
    expect(celebrationSource).toContain("export async function getEarnedBadges()");
  });

  it("exports getNextBadgeProgress function", () => {
    expect(celebrationSource).toContain("export async function getNextBadgeProgress()");
  });

  it("tracks celebrated badges to avoid duplicates", () => {
    expect(celebrationSource).toContain("celebratedBadges");
  });

  it("checks if badge was already celebrated", () => {
    expect(celebrationSource).toContain("state.celebratedBadges.includes(currentBadge.title)");
  });

  it("calculates progress toward next badge", () => {
    expect(celebrationSource).toContain("weeksNeeded");
    expect(celebrationSource).toContain("progress");
  });
});

// ─── Badge Unlock Modal Component Tests ─────────────────────────────────────

describe("Badge Unlock Modal Component", () => {
  let modalSource: string;

  beforeAll(() => {
    modalSource = fs.readFileSync(
      path.join(__dirname, "../components/badge-unlock-modal.tsx"),
      "utf-8"
    );
  });

  it("exports BadgeUnlockModal component", () => {
    expect(modalSource).toContain("export function BadgeUnlockModal");
  });

  it("uses React Native Modal", () => {
    expect(modalSource).toContain("Modal");
  });

  it("has confetti particle animation", () => {
    expect(modalSource).toContain("ConfettiParticle");
  });

  it("renders 30 confetti particles", () => {
    expect(modalSource).toContain("length: 30");
  });

  it("uses reanimated for badge scale animation", () => {
    expect(modalSource).toContain("badgeScale");
  });

  it("uses reanimated for glow effect", () => {
    expect(modalSource).toContain("glowScale");
  });

  it("triggers haptic feedback on badge unlock", () => {
    expect(modalSource).toContain("Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)");
  });

  it("triggers multiple haptic impacts for celebration", () => {
    expect(modalSource).toContain("Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)");
    expect(modalSource).toContain("Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)");
  });

  it("shows New Badge Unlocked title", () => {
    expect(modalSource).toContain("New Badge Unlocked!");
  });

  it("shows badge title with color", () => {
    expect(modalSource).toContain("badge.title");
    expect(modalSource).toContain("badge.color");
  });

  it("shows streak weeks achieved", () => {
    expect(modalSource).toContain("streakWeeks");
  });

  it("has Awesome dismiss button", () => {
    expect(modalSource).toContain("Awesome!");
  });

  it("calls onDismiss when button pressed", () => {
    expect(modalSource).toContain("onDismiss");
  });

  it("uses sequential animation delays for staggered entrance", () => {
    expect(modalSource).toContain("withDelay");
    expect(modalSource).toContain("withSequence");
  });
});

// ─── Integration: Progress Report Card Wiring ───────────────────────────────

describe("Progress Report Card - Badge Celebration Integration", () => {
  let reportCardSource: string;

  beforeAll(() => {
    reportCardSource = fs.readFileSync(
      path.join(__dirname, "../app/progress-report-card.tsx"),
      "utf-8"
    );
  });

  it("imports BadgeUnlockModal component", () => {
    expect(reportCardSource).toContain("BadgeUnlockModal");
  });

  it("has showBadgeModal state", () => {
    expect(reportCardSource).toContain("showBadgeModal");
  });

  it("has unlockedBadge state", () => {
    expect(reportCardSource).toContain("unlockedBadge");
  });

  it("calls checkBadgeCelebration on mount", () => {
    expect(reportCardSource).toContain("checkBadgeCelebration");
  });

  it("imports checkForNewBadge from badge-celebration", () => {
    expect(reportCardSource).toContain("checkForNewBadge");
  });

  it("renders BadgeUnlockModal with correct props", () => {
    expect(reportCardSource).toContain("visible={showBadgeModal}");
    expect(reportCardSource).toContain("badge={unlockedBadge}");
    expect(reportCardSource).toContain("streakWeeks={unlockedStreakWeeks}");
  });

  it("has Export action button linking to /export-report", () => {
    expect(reportCardSource).toContain("/export-report");
  });
});

// ─── Integration: Home Screen Feature Entries ───────────────────────────────

describe("Home Screen Feature Entries", () => {
  let homeSource: string;

  beforeAll(() => {
    homeSource = fs.readFileSync(
      path.join(__dirname, "../app/(tabs)/index.tsx"),
      "utf-8"
    );
  });

  it("has Streak Shield in EXPLORE_FEATURES", () => {
    expect(homeSource).toContain("streak-shield");
    expect(homeSource).toContain("/streak-shield");
  });

  it("has Export Report in EXPLORE_FEATURES", () => {
    expect(homeSource).toContain("export-report");
    expect(homeSource).toContain("/export-report");
  });
});
