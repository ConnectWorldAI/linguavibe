import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStorage[key] || null),
    setItem: vi.fn(async (key: string, value: string) => { mockStorage[key] = value; }),
    multiRemove: vi.fn(async (keys: string[]) => { keys.forEach(k => delete mockStorage[k]); }),
  },
}));

import {
  trackExerciseStart,
  trackExerciseComplete,
  trackExerciseAbandoned,
  getAnalyticsSummary,
  clearAnalytics,
} from "../lib/exercise-analytics";

describe("Exercise Analytics", () => {
  beforeEach(async () => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  it("should track exercise start and return a session ID", async () => {
    const sessionId = await trackExerciseStart("rrt", 5, "portuguese", "A1");
    expect(sessionId).toBeTruthy();
    expect(typeof sessionId).toBe("string");
    expect(sessionId.length).toBeGreaterThan(5);
  });

  it("should track exercise completion with accuracy", async () => {
    const sessionId = await trackExerciseStart("rrt", 5, "portuguese", "A1");
    await trackExerciseComplete(sessionId, "rrt", 4, 5, 30000, "portuguese", {
      level: "A1",
      audioMode: "server",
    });

    const summary = await getAnalyticsSummary();
    expect(summary.completedExercises).toBe(1);
    expect(summary.averageAccuracy).toBe(80); // 4/5 = 80%
  });

  it("should track exercise abandonment", async () => {
    const sessionId = await trackExerciseStart("netflix_dictation", 10, "spanish");
    await trackExerciseAbandoned(sessionId, "netflix_dictation", 3, "exit", 15000, "spanish");

    const summary = await getAnalyticsSummary();
    expect(summary.abandonedExercises).toBe(1);
  });

  it("should calculate completion rate correctly", async () => {
    // Start 3 exercises
    const s1 = await trackExerciseStart("rrt", 5, "portuguese");
    const s2 = await trackExerciseStart("whiteboard", 3, "portuguese");
    const s3 = await trackExerciseStart("rrt", 5, "portuguese");

    // Complete 2
    await trackExerciseComplete(s1, "rrt", 5, 5, 20000, "portuguese");
    await trackExerciseComplete(s2, "whiteboard", 2, 3, 15000, "portuguese");

    // Abandon 1
    await trackExerciseAbandoned(s3, "rrt", 2, "exit", 10000, "portuguese");

    const summary = await getAnalyticsSummary();
    expect(summary.totalExercises).toBe(3);
    expect(summary.completedExercises).toBe(2);
    expect(summary.abandonedExercises).toBe(1);
    // Completion rate: 2/3 = 67%
    expect(summary.completionRate).toBe(67);
  });

  it("should track multiple exercise types", async () => {
    const s1 = await trackExerciseStart("rrt", 5, "portuguese");
    const s2 = await trackExerciseStart("netflix_dictation", 5, "portuguese");

    await trackExerciseComplete(s1, "rrt", 4, 5, 20000, "portuguese");
    await trackExerciseComplete(s2, "netflix_dictation", 3, 5, 25000, "portuguese");

    const summary = await getAnalyticsSummary();
    // Today's events are counted in totals
    expect(summary.completedExercises).toBe(2);
    expect(summary.totalExercises).toBe(2);
    // Average accuracy: (80 + 60) / 2 = 70
    expect(summary.averageAccuracy).toBe(70);
  });

  it("should clear all analytics data", async () => {
    await trackExerciseStart("rrt", 5, "portuguese");
    await clearAnalytics();

    const summary = await getAnalyticsSummary();
    expect(summary.totalExercises).toBe(0);
    expect(summary.completedExercises).toBe(0);
  });
});
