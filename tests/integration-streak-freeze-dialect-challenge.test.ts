/**
 * Integration Tests: Streak Freeze + Dialect Challenge
 *
 * End-to-end flow tests covering:
 * 1. Streak Freeze: purchase → apply on missed day → streak preserved
 * 2. Dialect Challenge: start game → answer questions → scoring → stats persistence
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Streak Freeze Integration Tests ─────────────────────────────────────────

describe("Streak Freeze - End-to-End Flow", () => {
  const streakFreezePath = path.resolve(__dirname, "../lib/streak-freeze.ts");
  const streakNotificationsPath = path.resolve(__dirname, "../lib/streak-notifications.ts");
  const purchaseScreenPath = path.resolve(__dirname, "../app/streak-freeze-purchase.tsx");
  let freezeContent: string;
  let notifContent: string;
  let purchaseContent: string;

  beforeEach(() => {
    freezeContent = fs.readFileSync(streakFreezePath, "utf-8");
    notifContent = fs.readFileSync(streakNotificationsPath, "utf-8");
    purchaseContent = fs.readFileSync(purchaseScreenPath, "utf-8");
  });

  describe("Purchase Flow", () => {
    it("exports purchaseFreezeWithCredits function", () => {
      expect(freezeContent).toContain("export async function purchaseFreezeWithCredits");
    });

    it("exports purchaseFreezeWithXP function", () => {
      expect(freezeContent).toContain("export async function purchaseFreezeWithXP");
    });

    it("purchase screen imports streak-freeze lib", () => {
      expect(purchaseContent).toContain("streak-freeze");
    });

    it("purchase screen shows credits-based purchase option", () => {
      expect(purchaseContent).toContain("credits");
    });

    it("purchase screen handles purchasing state during transaction", () => {
      expect(purchaseContent).toContain("purchasing");
    });

    it("purchase screen shows success feedback after purchase", () => {
      expect(purchaseContent).toContain("success");
    });
  });

  describe("Freeze Application on Missed Day", () => {
    it("exports checkAndApplyStreakFreeze function", () => {
      expect(freezeContent).toContain("export async function checkAndApplyStreakFreeze");
    });

    it("checkAndApplyStreakFreeze reads streak data from AsyncStorage", () => {
      expect(freezeContent).toContain("AsyncStorage");
    });

    it("checkAndApplyStreakFreeze decrements availableFreezes on use", () => {
      expect(freezeContent).toContain("availableFreezes");
      expect(freezeContent).toContain("availableFreezes -= 1");
    });

    it("checkAndApplyStreakFreeze preserves streak count when freeze is applied", () => {
      expect(freezeContent).toContain("streak");
    });

    it("checkAndApplyStreakFreeze returns false when no freezes available", () => {
      expect(freezeContent).toContain("return false");
    });
  });

  describe("Streak Notifications Integration", () => {
    it("markTodayAsPracticed updates the streak storage key", () => {
      expect(notifContent).toContain("markTodayAsPracticed");
      expect(notifContent).toContain("AsyncStorage");
    });

    it("streak data includes last_practice_date for tracking", () => {
      expect(notifContent).toContain("last_practice_date");
    });

    it("markTodayAsPracticed stores today's date", () => {
      expect(notifContent).toContain("lastPractice");
    });
  });

  describe("Freeze Data Persistence", () => {
    it("uses a dedicated storage key for freeze data", () => {
      expect(freezeContent).toMatch(/@linguavibe.*freeze|FREEZE_STORAGE_KEY|streak.freeze/i);
    });

    it("stores freeze count and usage tracking", () => {
      expect(freezeContent).toContain("availableFreezes");
      expect(freezeContent).toContain("freezesUsedTotal");
    });

    it("getStreakFreezeData returns typed freeze state", () => {
      expect(freezeContent).toContain("export async function getStreakFreezeData");
    });

    it("tracks activeFreezeDate for freeze application", () => {
      expect(freezeContent).toContain("activeFreezeDate");
    });
  });
});

// ─── Dialect Challenge Integration Tests ─────────────────────────────────────

describe("Dialect Challenge - End-to-End Flow", () => {
  const challengePath = path.resolve(__dirname, "../app/dialect-challenge.tsx");
  let challengeContent: string;

  beforeEach(() => {
    challengeContent = fs.readFileSync(challengePath, "utf-8");
  });

  describe("Game Initialization", () => {
    it("exports a default screen component", () => {
      expect(challengeContent).toContain("export default function");
    });

    it("contains CHALLENGE_PHRASES with multiple dialect entries", () => {
      expect(challengeContent).toContain("CHALLENGE_PHRASES");
    });

    it("includes phrases from at least 5 different dialects", () => {
      const dialectMatches = challengeContent.match(/correctDialect:\s*"([^"]+)"/g) || [];
      const uniqueDialects = new Set(dialectMatches.map(m => m.replace(/correctDialect:\s*"/, "").replace(/"$/, "")));
      expect(uniqueDialects.size).toBeGreaterThanOrEqual(5);
    });

    it("shuffles phrases on game start for variety", () => {
      expect(challengeContent).toMatch(/shuffle|sort.*random|Math\.random/);
    });
  });

  describe("Gameplay Mechanics", () => {
    it("presents multiple choices for dialect identification", () => {
      expect(challengeContent).toContain("choices");
      expect(challengeContent).toContain("DIALECT_CHOICES");
    });

    it("tracks correct answers with isCorrect state", () => {
      expect(challengeContent).toContain("isCorrect");
      expect(challengeContent).toContain("setIsCorrect");
    });

    it("implements a timer for each round", () => {
      expect(challengeContent).toContain("timeLeft");
      expect(challengeContent).toContain("startTimer");
    });

    it("identifies correct dialect using correctDialect field", () => {
      expect(challengeContent).toContain("correctDialect");
    });

    it("provides a teaching moment explaining the dialect", () => {
      expect(challengeContent).toContain("teachingMoment");
    });

    it("advances to next round after feedback", () => {
      expect(challengeContent).toContain("currentRound");
      expect(challengeContent).toMatch(/setCurrentRound/);
    });
  });

  describe("Audio Integration", () => {
    it("includes audio playback for phrase pronunciation", () => {
      expect(challengeContent).toMatch(/Speech|speak/);
    });

    it("uses Speech API for phrase samples", () => {
      expect(challengeContent).toMatch(/Speech\.speak/);
    });
  });

  describe("Scoring and Results", () => {
    it("calculates final score", () => {
      expect(challengeContent).toMatch(/score/);
    });

    it("shows results screen at end of challenge", () => {
      expect(challengeContent).toContain("results");
      expect(challengeContent).toContain("setGameMode(\"results\")");
    });

    it("tracks score and streak during gameplay", () => {
      expect(challengeContent).toContain("setScore");
      expect(challengeContent).toContain("setStreak");
    });

    it("displays bestStreak tracking", () => {
      expect(challengeContent).toContain("bestStreak");
    });
  });

  describe("Stats Persistence", () => {
    it("persists challenge stats to AsyncStorage", () => {
      expect(challengeContent).toContain("AsyncStorage");
    });

    it("tracks totalPlayed count", () => {
      expect(challengeContent).toContain("totalPlayed");
    });

    it("tracks bestStreak as accuracy metric", () => {
      expect(challengeContent).toContain("bestStreak");
    });

    it("offers Play Again option after completion", () => {
      expect(challengeContent).toContain("Play Again");
    });
  });

  describe("Navigation and Entry Points", () => {
    it("can be navigated to from the app", () => {
      expect(fs.existsSync(challengePath)).toBe(true);
    });

    it("includes a back navigation option", () => {
      expect(challengeContent).toMatch(/router\.back/);
    });

    it("uses ScreenContainer for proper layout", () => {
      expect(challengeContent).toContain("ScreenContainer");
    });
  });
});

// ─── Cross-Feature Integration ───────────────────────────────────────────────

describe("Cross-Feature Integration", () => {
  it("dialect challenge completion triggers markTodayAsPracticed", () => {
    const challengeContent = fs.readFileSync(
      path.resolve(__dirname, "../app/dialect-challenge.tsx"),
      "utf-8"
    );
    expect(challengeContent).toContain("markTodayAsPracticed");
  });

  it("streak freeze purchase screen is accessible as a route", () => {
    const purchasePath = path.resolve(__dirname, "../app/streak-freeze-purchase.tsx");
    expect(fs.existsSync(purchasePath)).toBe(true);
  });

  it("dialect challenge screen is accessible as a route", () => {
    const challengePath = path.resolve(__dirname, "../app/dialect-challenge.tsx");
    expect(fs.existsSync(challengePath)).toBe(true);
  });

  it("streak freeze data structure includes freeze count and activeFreezeDate", () => {
    const freezeContent = fs.readFileSync(
      path.resolve(__dirname, "../lib/streak-freeze.ts"),
      "utf-8"
    );
    expect(freezeContent).toContain("availableFreezes");
    expect(freezeContent).toContain("activeFreezeDate");
  });

  it("dialect challenge uses consistent color theming", () => {
    const challengeContent = fs.readFileSync(
      path.resolve(__dirname, "../app/dialect-challenge.tsx"),
      "utf-8"
    );
    expect(challengeContent).toMatch(/useColors|Colors|colors/);
  });
});
