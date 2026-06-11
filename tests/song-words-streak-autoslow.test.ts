import { describe, it, expect } from "vitest";

// ─── Song Words Filter Tests ─────────────────────────────────────────────────

describe("Song Words Filter in Flashcard Review", () => {
  // Simulates the SRS queue with song-tagged items
  const mockSRSQueue = [
    { id: "song_1", word: "Despacito", translation: "Slowly", context: "Despacito, quiero respirar tu cuello despacito", lessonId: "song:Despacito", easeFactor: 2.5, interval: 1, repetitions: 0, nextReview: 0, lastScore: 0, createdAt: Date.now(), lastReviewedAt: 0 },
    { id: "song_2", word: "Bailando", translation: "Dancing", context: "Yo te miro y se me corta la respiración", lessonId: "song:Bailando", easeFactor: 2.5, interval: 1, repetitions: 0, nextReview: 0, lastScore: 0, createdAt: Date.now(), lastReviewedAt: 0 },
    { id: "song_3", word: "Corazón", translation: "Heart", context: "Mi corazón late por ti", lessonId: "song:Vivir Mi Vida", easeFactor: 2.5, interval: 3, repetitions: 2, nextReview: Date.now() + 86400000, lastScore: 3, createdAt: Date.now(), lastReviewedAt: Date.now() },
    { id: "lesson_1", word: "Hola", translation: "Hello", context: "¡Hola! ¿Cómo estás?", lessonId: "lesson:basics_1", easeFactor: 2.5, interval: 1, repetitions: 0, nextReview: 0, lastScore: 0, createdAt: Date.now(), lastReviewedAt: 0 },
    { id: "lesson_2", word: "Gracias", translation: "Thank you", context: "Muchas gracias", lessonId: "lesson:basics_1", easeFactor: 2.5, interval: 1, repetitions: 0, nextReview: 0, lastScore: 0, createdAt: Date.now(), lastReviewedAt: 0 },
  ];

  it("should filter items with lessonId starting with 'song:'", () => {
    const songItems = mockSRSQueue.filter((item) => item.lessonId?.startsWith("song:"));
    expect(songItems).toHaveLength(3);
    expect(songItems.every((item) => item.lessonId!.startsWith("song:"))).toBe(true);
  });

  it("should only show due song words (nextReview <= now)", () => {
    const now = Date.now();
    const songItems = mockSRSQueue.filter((item) => item.lessonId?.startsWith("song:"));
    const dueItems = songItems.filter((item) => item.nextReview <= now);
    expect(dueItems).toHaveLength(2); // song_1 and song_2 are due (nextReview: 0)
    expect(dueItems.map((i) => i.id)).toContain("song_1");
    expect(dueItems.map((i) => i.id)).toContain("song_2");
  });

  it("should convert SRS items to flashcard format", () => {
    const songItems = mockSRSQueue.filter((item) => item.lessonId?.startsWith("song:"));
    const flashcards = songItems.map((item) => ({
      id: item.id,
      front: item.word,
      back: item.translation,
      example: item.context || "",
      category: "Song Words",
      difficulty: item.easeFactor,
      nextReview: item.nextReview,
      interval: item.interval,
      repetitions: item.repetitions,
    }));
    expect(flashcards[0].front).toBe("Despacito");
    expect(flashcards[0].back).toBe("Slowly");
    expect(flashcards[0].category).toBe("Song Words");
    expect(flashcards[1].front).toBe("Bailando");
  });

  it("should count total song words for badge display", () => {
    const songWordCount = mockSRSQueue.filter((item) => item.lessonId?.startsWith("song:")).length;
    expect(songWordCount).toBe(3);
  });

  it("should exclude non-song items from song filter", () => {
    const songItems = mockSRSQueue.filter((item) => item.lessonId?.startsWith("song:"));
    expect(songItems.find((i) => i.id === "lesson_1")).toBeUndefined();
    expect(songItems.find((i) => i.id === "lesson_2")).toBeUndefined();
  });
});

// ─── Adaptive Speed Auto-Slow Tests ─────────────────────────────────────────

describe("Adaptive Speed Auto-Slow", () => {
  it("should drop to 0.5x when a word scores red and line is looping", () => {
    let playbackSpeed = 1;
    const loopingLine = 5; // currently looping a line
    const wordScores: Record<string, "green" | "yellow" | "red"> = {
      "line5_0": "green",
      "line5_1": "red",
      "line5_2": "yellow",
    };

    const hasRed = Object.values(wordScores).some((v) => v === "red");
    if (hasRed && loopingLine !== null && playbackSpeed > 0.5) {
      playbackSpeed = 0.5;
    }

    expect(playbackSpeed).toBe(0.5);
  });

  it("should NOT auto-slow when not looping", () => {
    let playbackSpeed = 1;
    const loopingLine = null; // not looping
    const wordScores: Record<string, "green" | "yellow" | "red"> = {
      "line5_0": "red",
      "line5_1": "red",
    };

    const hasRed = Object.values(wordScores).some((v) => v === "red");
    if (hasRed && loopingLine !== null && playbackSpeed > 0.5) {
      playbackSpeed = 0.5;
    }

    expect(playbackSpeed).toBe(1); // unchanged
  });

  it("should NOT auto-slow when already at 0.5x", () => {
    let playbackSpeed = 0.5;
    const loopingLine = 3;
    const wordScores: Record<string, "green" | "yellow" | "red"> = {
      "line3_0": "red",
    };

    const hasRed = Object.values(wordScores).some((v) => v === "red");
    if (hasRed && loopingLine !== null && playbackSpeed > 0.5) {
      playbackSpeed = 0.5;
    }

    expect(playbackSpeed).toBe(0.5); // already there
  });

  it("should NOT auto-slow when all words are green/yellow", () => {
    let playbackSpeed = 1;
    const loopingLine = 2;
    const wordScores: Record<string, "green" | "yellow" | "red"> = {
      "line2_0": "green",
      "line2_1": "yellow",
      "line2_2": "green",
    };

    const hasRed = Object.values(wordScores).some((v) => v === "red");
    if (hasRed && loopingLine !== null && playbackSpeed > 0.5) {
      playbackSpeed = 0.5;
    }

    expect(playbackSpeed).toBe(1); // no red, no slow
  });
});

// ─── Streak Rewards Tests ────────────────────────────────────────────────────

describe("Streak Rewards for Sing-Along", () => {
  function processLineScores(
    scores: Record<string, "green" | "yellow" | "red">,
    lineId: string,
    wordCount: number,
    currentStreak: number
  ): { newStreak: number; confetti: boolean; xpBonus: number } {
    const lineKeys = Array.from({ length: wordCount }, (_, i) => `${lineId}_${i}`);
    const allGreen = lineKeys.every((k) => scores[k] === "green");

    if (allGreen) {
      const newStreak = currentStreak + 1;
      const confetti = newStreak > 0 && newStreak % 5 === 0;
      const xpBonus = confetti ? newStreak * 10 : 0;
      return { newStreak, confetti, xpBonus };
    }
    return { newStreak: 0, confetti: false, xpBonus: 0 };
  }

  it("should increment streak when all words are green", () => {
    const scores: Record<string, "green" | "yellow" | "red"> = {
      "line1_0": "green",
      "line1_1": "green",
      "line1_2": "green",
    };
    const result = processLineScores(scores, "line1", 3, 2);
    expect(result.newStreak).toBe(3);
    expect(result.confetti).toBe(false);
  });

  it("should trigger confetti at 5-line streak", () => {
    const scores: Record<string, "green" | "yellow" | "red"> = {
      "line5_0": "green",
      "line5_1": "green",
    };
    const result = processLineScores(scores, "line5", 2, 4); // 4 + 1 = 5
    expect(result.newStreak).toBe(5);
    expect(result.confetti).toBe(true);
    expect(result.xpBonus).toBe(50); // 5 * 10
  });

  it("should trigger confetti at 10-line streak with 100 XP", () => {
    const scores: Record<string, "green" | "yellow" | "red"> = {
      "line10_0": "green",
      "line10_1": "green",
      "line10_2": "green",
    };
    const result = processLineScores(scores, "line10", 3, 9); // 9 + 1 = 10
    expect(result.newStreak).toBe(10);
    expect(result.confetti).toBe(true);
    expect(result.xpBonus).toBe(100); // 10 * 10
  });

  it("should reset streak when any word is not green", () => {
    const scores: Record<string, "green" | "yellow" | "red"> = {
      "line3_0": "green",
      "line3_1": "yellow",
      "line3_2": "green",
    };
    const result = processLineScores(scores, "line3", 3, 4);
    expect(result.newStreak).toBe(0);
    expect(result.confetti).toBe(false);
  });

  it("should reset streak when a word is red", () => {
    const scores: Record<string, "green" | "yellow" | "red"> = {
      "line7_0": "red",
      "line7_1": "green",
    };
    const result = processLineScores(scores, "line7", 2, 8);
    expect(result.newStreak).toBe(0);
    expect(result.confetti).toBe(false);
  });

  it("should NOT trigger confetti at streak 3 (only multiples of 5)", () => {
    const scores: Record<string, "green" | "yellow" | "red"> = {
      "line3_0": "green",
    };
    const result = processLineScores(scores, "line3", 1, 2);
    expect(result.newStreak).toBe(3);
    expect(result.confetti).toBe(false);
    expect(result.xpBonus).toBe(0);
  });

  it("should handle single-word lines correctly", () => {
    const scores: Record<string, "green" | "yellow" | "red"> = {
      "line1_0": "green",
    };
    const result = processLineScores(scores, "line1", 1, 0);
    expect(result.newStreak).toBe(1);
  });

  it("should accumulate XP across multiple 5-line milestones", () => {
    // Simulate reaching 5, then 10
    const firstMilestone = processLineScores({ "l_0": "green" }, "l", 1, 4);
    expect(firstMilestone.xpBonus).toBe(50);

    const secondMilestone = processLineScores({ "l_0": "green" }, "l", 1, 9);
    expect(secondMilestone.xpBonus).toBe(100);

    const totalXP = firstMilestone.xpBonus + secondMilestone.xpBonus;
    expect(totalXP).toBe(150);
  });
});
