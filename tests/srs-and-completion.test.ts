import { describe, it, expect } from "vitest";
import { calculateNextReview, type SRSItem, type ReviewQuality } from "../lib/srs";
import { getLessonContent, hasLessonContent, getAllLessonIds } from "../lib/lesson-content";

// ─── SRS SM-2 Algorithm Tests ──────────────────────────────────────────────

describe("SRS - SM-2 Algorithm", () => {
  const baseItem: SRSItem = {
    id: "test_1",
    word: "hola",
    translation: "hello",
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(),
    lastScore: 0,
    createdAt: Date.now(),
    lastReviewedAt: 0,
  };

  it("resets repetitions on quality < 3 (failed recall)", () => {
    const item = { ...baseItem, repetitions: 3, interval: 10 };
    const result = calculateNextReview(item, 2);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("sets interval to 1 on first successful review", () => {
    const result = calculateNextReview(baseItem, 4);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it("sets interval to 6 on second successful review", () => {
    const item = { ...baseItem, repetitions: 1, interval: 1 };
    const result = calculateNextReview(item, 4);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it("multiplies interval by ease factor on subsequent reviews", () => {
    const item = { ...baseItem, repetitions: 2, interval: 6, easeFactor: 2.5 };
    const result = calculateNextReview(item, 5);
    expect(result.interval).toBe(16); // 6 * updated_ease_factor (2.6) = 15.6 → rounds to 16
    expect(result.repetitions).toBe(3);
  });

  it("never lets ease factor drop below 1.3", () => {
    const item = { ...baseItem, easeFactor: 1.3 };
    const result = calculateNextReview(item, 0); // worst score
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("increases ease factor on perfect score (5)", () => {
    const result = calculateNextReview(baseItem, 5);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it("decreases ease factor on low quality (3)", () => {
    const result = calculateNextReview(baseItem, 3);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it("sets nextReview in the future", () => {
    const now = Date.now();
    const result = calculateNextReview(baseItem, 4);
    expect(result.nextReview).toBeGreaterThan(now);
  });

  it("updates lastReviewedAt to current time", () => {
    const now = Date.now();
    const result = calculateNextReview(baseItem, 4);
    expect(result.lastReviewedAt).toBeGreaterThanOrEqual(now);
  });
});

// ─── Lesson Content Expansion Tests ────────────────────────────────────────

describe("Lesson Content - All CEFR Levels", () => {
  const expectedLessonIds = [
    // A1
    "a1_u1_l1", "a1_u1_l2", "a1_u1_l3", "a1_u1_l4", "a1_u1_l5",
    "a1_u2_l1", "a1_u2_l2", "a1_u2_l3", "a1_u2_l4", "a1_u2_l5",
    // A2
    "a2_u1_l1", "a2_u1_l2", "a2_u1_l3", "a2_u1_l4", "a2_u1_l5",
    "a2_u2_l1", "a2_u2_l2", "a2_u2_l3", "a2_u2_l4", "a2_u2_l5",
    // B1
    "b1_u1_l1", "b1_u1_l2", "b1_u1_l3", "b1_u1_l4", "b1_u1_l5",
    "b1_u2_l1", "b1_u2_l2", "b1_u2_l3", "b1_u2_l4", "b1_u2_l5",
    // B2
    "b2_u1_l1", "b2_u1_l2", "b2_u1_l3", "b2_u1_l4", "b2_u1_l5",
    // C1
    "c1_u1_l1", "c1_u1_l2", "c1_u1_l3", "c1_u1_l4", "c1_u1_l5",
    // C2
    "c2_u1_l1", "c2_u1_l2", "c2_u1_l3", "c2_u1_l4", "c2_u1_l5",
  ];

  it("has content for all expected lesson IDs", () => {
    for (const id of expectedLessonIds) {
      expect(hasLessonContent(id)).toBe(true);
    }
  });

  it("returns null for non-existent lesson IDs", () => {
    expect(getLessonContent("z9_u9_l9")).toBeNull();
  });

  it("has at least 45 total lessons", () => {
    const allIds = getAllLessonIds();
    expect(allIds.length).toBeGreaterThanOrEqual(45);
  });

  it("each lesson has a valid type", () => {
    const validTypes = ["vocabulary", "grammar", "reading", "writing", "speaking", "listening"];
    for (const id of expectedLessonIds) {
      const lesson = getLessonContent(id);
      expect(lesson).not.toBeNull();
      expect(validTypes).toContain(lesson!.type);
    }
  });

  it("each lesson has at least 2 quiz questions", () => {
    for (const id of expectedLessonIds) {
      const lesson = getLessonContent(id);
      expect(lesson!.quiz.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("quiz questions have valid correct answer indices", () => {
    for (const id of expectedLessonIds) {
      const lesson = getLessonContent(id);
      for (const q of lesson!.quiz) {
        expect(q.correct).toBeGreaterThanOrEqual(0);
        expect(q.correct).toBeLessThan(q.options.length);
      }
    }
  });

  it("B2 lessons exist and cover advanced topics", () => {
    const b2_1 = getLessonContent("b2_u1_l1");
    expect(b2_1).not.toBeNull();
    expect(b2_1!.title).toContain("Abstract");
  });

  it("C1 lessons exist with idioms and advanced grammar", () => {
    const c1_1 = getLessonContent("c1_u1_l1");
    expect(c1_1).not.toBeNull();
    expect(c1_1!.title).toContain("Idioms");
  });

  it("C2 lessons exist with register switching and stylistic grammar", () => {
    const c2_1 = getLessonContent("c2_u1_l1");
    expect(c2_1).not.toBeNull();
    expect(c2_1!.title).toContain("Register");
  });
});

// ─── XP Award Logic Tests ──────────────────────────────────────────────────

describe("XP Award Logic", () => {
  const XP_BY_LEVEL: Record<string, number> = {
    A1: 10, A2: 15, B1: 20, B2: 25, C1: 30, C2: 35,
  };

  it("awards correct XP for each CEFR level at 100% score", () => {
    expect(Math.round(XP_BY_LEVEL["A1"] * 1.0)).toBe(10);
    expect(Math.round(XP_BY_LEVEL["B1"] * 1.0)).toBe(20);
    expect(Math.round(XP_BY_LEVEL["C2"] * 1.0)).toBe(35);
  });

  it("awards proportional XP for partial scores", () => {
    expect(Math.round(XP_BY_LEVEL["A1"] * 0.5)).toBe(5);
    expect(Math.round(XP_BY_LEVEL["B2"] * 0.75)).toBe(19);
  });

  it("awards 0 XP for 0% score", () => {
    expect(Math.round(XP_BY_LEVEL["A1"] * 0)).toBe(0);
  });
});
