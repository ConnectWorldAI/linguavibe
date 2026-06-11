import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

import {
  recordCardReview,
  getGamificationState,
  completeReviewSession,
  getLevelProgress,
  getStreakInfo,
} from "../lib/srs-gamification";

describe("SRS Gamification", () => {
  beforeEach(() => {
    // Clear storage between tests
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should start with default state", async () => {
    const state = await getGamificationState();
    expect(state.totalXP).toBe(0);
    expect(state.level).toBe(1);
    expect(state.currentStreak).toBe(0);
    expect(state.badges).toEqual([]);
  });

  it("should award XP for reviewing a card", async () => {
    const result = await recordCardReview({
      correct: true,
      firstTry: true,
      onTime: true,
    });
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(result.message).toContain("+");
    
    const state = await getGamificationState();
    expect(state.totalXP).toBeGreaterThan(0);
    expect(state.currentStreak).toBe(1); // First review starts streak
  });

  it("should award more XP for correct first-try answers", async () => {
    const correctResult = await recordCardReview({
      correct: true,
      firstTry: true,
      onTime: true,
    });
    
    // Reset storage for fair comparison
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    
    const incorrectResult = await recordCardReview({
      correct: false,
      firstTry: false,
      onTime: false,
    });
    
    expect(correctResult.xpEarned).toBeGreaterThan(incorrectResult.xpEarned);
  });

  it("should track streak correctly", async () => {
    await recordCardReview({ correct: true, firstTry: true, onTime: true });
    
    const streakInfo = await getStreakInfo();
    expect(streakInfo.current).toBe(1);
    expect(streakInfo.multiplier).toBeGreaterThan(1);
  });

  it("should calculate level progress", async () => {
    // Record several reviews to gain XP
    for (let i = 0; i < 5; i++) {
      await recordCardReview({ correct: true, firstTry: true, onTime: true });
    }
    
    const progress = await getLevelProgress();
    expect(progress.level).toBeGreaterThanOrEqual(1);
    expect(progress.totalXP).toBeGreaterThan(0);
    expect(progress.progress).toBeGreaterThanOrEqual(0);
    expect(progress.progress).toBeLessThanOrEqual(1);
  });

  it("should award perfect recall bonus when all cards correct", async () => {
    // Review 5 cards perfectly
    for (let i = 0; i < 5; i++) {
      await recordCardReview({ correct: true, firstTry: true, onTime: true });
    }
    
    const sessionResult = await completeReviewSession();
    expect(sessionResult).not.toBeNull();
    expect(sessionResult!.perfectRecallBonus).toBe(50);
    expect(sessionResult!.message).toContain("Perfect Recall");
  });

  it("should NOT award perfect recall if any card was incorrect", async () => {
    // Review 4 correct, 1 incorrect
    for (let i = 0; i < 4; i++) {
      await recordCardReview({ correct: true, firstTry: true, onTime: true });
    }
    await recordCardReview({ correct: false, firstTry: false, onTime: true });
    
    const sessionResult = await completeReviewSession();
    expect(sessionResult).toBeNull();
  });

  it("should earn badges for streak milestones", async () => {
    // Simulate 3-day streak by manipulating state
    const state = await getGamificationState();
    state.currentStreak = 2; // Will become 3 on next review
    state.lastReviewDate = ""; // Force new day
    mockStorage["linguavibe_srs_gamification"] = JSON.stringify(state);
    
    const result = await recordCardReview({ correct: true, firstTry: true, onTime: true });
    
    // Check if streak_3 badge was earned
    const newState = await getGamificationState();
    const streak3Badge = newState.badges.find((b) => b.id === "streak_3");
    expect(streak3Badge).toBeDefined();
    expect(streak3Badge!.name).toBe("Getting Started");
  });
});
