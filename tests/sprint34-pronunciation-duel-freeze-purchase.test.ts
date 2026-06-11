/**
 * Sprint 34 Tests — Pronunciation Duel Games, Challenge History Entry, Freeze Purchase
 */
import { describe, it, expect } from "vitest";

// ─── Pronunciation Duel Library Tests ───────────────────────────────────────

describe("Pronunciation Duel Library", () => {
  it("exports all required game functions", async () => {
    const lib = await import("../lib/pronunciation-duel");
    expect(lib.getDuelWords).toBeDefined();
    expect(lib.scorePronunciation).toBeDefined();
    expect(lib.calculateTimeBonus).toBeDefined();
    expect(lib.simulateOpponentScore).toBeDefined();
    expect(lib.simulateOpponentTime).toBeDefined();
    expect(lib.createDuelMatch).toBeDefined();
    expect(lib.completeRound).toBeDefined();
    expect(lib.saveDuelMatch).toBeDefined();
    expect(lib.getDuelHistory).toBeDefined();
    expect(lib.getDuelStats).toBeDefined();
    expect(lib.getModeInfo).toBeDefined();
    expect(lib.getCategoryInfo).toBeDefined();
    expect(lib.getRandomOpponent).toBeDefined();
  });

  it("getDuelWords returns words for word_flash mode", async () => {
    const { getDuelWords } = await import("../lib/pronunciation-duel");
    const words = getDuelWords("word_flash", "abcs", 3);
    expect(words.length).toBeGreaterThanOrEqual(1);
    expect(words.length).toBeLessThanOrEqual(3);
    words.forEach(w => {
      expect(w).toHaveProperty("id");
      expect(w).toHaveProperty("text");
      expect(w).toHaveProperty("phonetic");
      expect(w).toHaveProperty("translation");
      expect(w).toHaveProperty("language");
      expect(w).toHaveProperty("category");
      expect(w).toHaveProperty("difficulty");
    });
  });

  it("getDuelWords returns tongue twisters for tongue_twister mode", async () => {
    const { getDuelWords } = await import("../lib/pronunciation-duel");
    const words = getDuelWords("tongue_twister", "mixed", 4);
    expect(words.length).toBeGreaterThanOrEqual(1);
    expect(words.length).toBeLessThanOrEqual(4);
  });

  it("getDuelWords returns mixed category words", async () => {
    const { getDuelWords } = await import("../lib/pronunciation-duel");
    const words = getDuelWords("phrase_race", "mixed", 5);
    expect(words.length).toBeGreaterThanOrEqual(1);
  });

  it("scorePronunciation returns 100 for exact match", async () => {
    const { scorePronunciation } = await import("../lib/pronunciation-duel");
    const score = scorePronunciation("Hola mundo", "Hola mundo");
    expect(score).toBe(100);
  });

  it("scorePronunciation returns 0 for empty transcript", async () => {
    const { scorePronunciation } = await import("../lib/pronunciation-duel");
    const score = scorePronunciation("Hola mundo", "");
    expect(score).toBe(0);
  });

  it("scorePronunciation returns partial score for similar text", async () => {
    const { scorePronunciation } = await import("../lib/pronunciation-duel");
    const score = scorePronunciation("Hola mundo", "Hola munda");
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(100);
  });

  it("scorePronunciation is case-insensitive", async () => {
    const { scorePronunciation } = await import("../lib/pronunciation-duel");
    const score = scorePronunciation("Hola Mundo", "hola mundo");
    expect(score).toBe(100);
  });

  it("calculateTimeBonus returns 0 for max time exceeded", async () => {
    const { calculateTimeBonus } = await import("../lib/pronunciation-duel");
    expect(calculateTimeBonus(6000, "word_flash")).toBe(0);
    expect(calculateTimeBonus(11000, "phrase_race")).toBe(0);
    expect(calculateTimeBonus(16000, "tongue_twister")).toBe(0);
  });

  it("calculateTimeBonus returns positive for fast responses", async () => {
    const { calculateTimeBonus } = await import("../lib/pronunciation-duel");
    const bonus = calculateTimeBonus(1000, "word_flash");
    expect(bonus).toBeGreaterThan(0);
    expect(bonus).toBeLessThanOrEqual(20);
  });

  it("simulateOpponentScore returns score within valid range", async () => {
    const { simulateOpponentScore } = await import("../lib/pronunciation-duel");
    for (let i = 0; i < 20; i++) {
      const score = simulateOpponentScore("medium", 75);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("simulateOpponentTime returns positive time", async () => {
    const { simulateOpponentTime } = await import("../lib/pronunciation-duel");
    const time = simulateOpponentTime("word_flash", "medium");
    expect(time).toBeGreaterThan(0);
  });

  it("createDuelMatch returns valid match structure", async () => {
    const { createDuelMatch } = await import("../lib/pronunciation-duel");
    const match = createDuelMatch("word_flash", "abcs", "medium", "Spanish", "Player1", "Bot", 5);
    expect(match.id).toContain("duel_");
    expect(match.mode).toBe("word_flash");
    expect(match.category).toBe("abcs");
    expect(match.difficulty).toBe("medium");
    expect(match.totalRounds).toBe(5);
    expect(match.currentRound).toBe(0);
    expect(match.rounds).toHaveLength(0);
    expect(match.winner).toBeNull();
    expect(match.completedAt).toBeNull();
  });

  it("completeRound updates match correctly", async () => {
    const { createDuelMatch, completeRound, getDuelWords } = await import("../lib/pronunciation-duel");
    const match = createDuelMatch("word_flash", "numbers", "easy", "Spanish", "Me", "Bot", 3);
    const words = getDuelWords("word_flash", "numbers", 3);
    const updated = completeRound(match, words[0], 85, 2000, words[0].text);
    expect(updated.currentRound).toBe(1);
    expect(updated.rounds).toHaveLength(1);
    expect(updated.playerTotalScore).toBeGreaterThan(0);
    expect(updated.opponentTotalScore).toBeGreaterThan(0);
  });

  it("completeRound determines winner after all rounds", async () => {
    const { createDuelMatch, completeRound, getDuelWords } = await import("../lib/pronunciation-duel");
    let match = createDuelMatch("word_flash", "abcs", "easy", "Spanish", "Me", "Bot", 2);
    const words = getDuelWords("word_flash", "abcs", 2);
    match = completeRound(match, words[0], 95, 1500, words[0].text);
    match = completeRound(match, words[1] || words[0], 90, 1800, (words[1] || words[0]).text);
    expect(match.completedAt).not.toBeNull();
    expect(["player", "opponent", "tie"]).toContain(match.winner);
  });

  it("getModeInfo returns valid info for all modes", async () => {
    const { getModeInfo } = await import("../lib/pronunciation-duel");
    const modes = ["word_flash", "phrase_race", "tongue_twister"] as const;
    modes.forEach(m => {
      const info = getModeInfo(m);
      expect(info.title).toBeTruthy();
      expect(info.icon).toBeTruthy();
      expect(info.description).toBeTruthy();
      expect(info.color).toBeTruthy();
    });
  });

  it("getCategoryInfo returns valid info for all categories", async () => {
    const { getCategoryInfo } = await import("../lib/pronunciation-duel");
    const cats = ["abcs", "numbers", "adjectives", "verbs_present", "verbs_past", "verbs_future", "mixed"] as const;
    cats.forEach(c => {
      const info = getCategoryInfo(c);
      expect(info.title).toBeTruthy();
      expect(info.icon).toBeTruthy();
      expect(info.color).toBeTruthy();
    });
  });

  it("getRandomOpponent returns a string name", async () => {
    const { getRandomOpponent } = await import("../lib/pronunciation-duel");
    const name = getRandomOpponent();
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThan(0);
  });
});

// ─── Challenge Leaderboard History Button Tests ─────────────────────────────

describe("Challenge Leaderboard History Entry Point", () => {
  it("challenge-leaderboard.tsx contains navigation to challenge-history", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/challenge-leaderboard.tsx", "utf-8");
    expect(content).toContain("/challenge-history");
    expect(content).toContain("time-outline");
  });
});

// ─── Streak Freeze Purchase Screen Tests ─────────────────────────────────────

describe("Streak Freeze Purchase Screen", () => {
  it("streak-freeze-purchase.tsx exists and imports required modules", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/streak-freeze-purchase.tsx", "utf-8");
    expect(content).toContain("purchaseStreakFreeze");
    expect(content).toContain("purchaseFreezeWithCredits");
    expect(content).toContain("getStreakFreezeData");
    // RevenueCat integration is in the streak-freeze lib which is imported
    expect(content).toContain("streak-freeze");
  });

  it("teacher.tsx freeze widget navigates to streak-freeze-purchase for buy", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/(tabs)/teacher.tsx", "utf-8");
    expect(content).toContain("/streak-freeze-purchase");
  });

  it("purchase screen has money and credits payment methods", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/streak-freeze-purchase.tsx", "utf-8");
    expect(content).toContain("paymentMethod");
    expect(content).toContain("\"money\"");
    expect(content).toContain("\"credits\"");
    expect(content).toContain("PURCHASE_OPTIONS");
    expect(content).toContain("CREDITS_OPTION");
  });

  it("purchase screen has restore purchases option", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/streak-freeze-purchase.tsx", "utf-8");
    expect(content).toContain("Restore Purchases");
  });
});

// ─── Pronunciation Duel Screens Existence Tests ──────────────────────────────

describe("Pronunciation Duel Screens", () => {
  it("pronunciation-duel-lobby.tsx exists with mode selection", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/pronunciation-duel-lobby.tsx", "utf-8");
    expect(content).toContain("word_flash");
    expect(content).toContain("phrase_race");
    expect(content).toContain("tongue_twister");
    expect(content).toContain("Start Duel");
    expect(content).toContain("Challenge a Friend");
  });

  it("pronunciation-duel.tsx exists with game phases", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/pronunciation-duel.tsx", "utf-8");
    expect(content).toContain("countdown");
    expect(content).toContain("listen");
    expect(content).toContain("record");
    expect(content).toContain("scoring");
    expect(content).toContain("round_result");
    expect(content).toContain("complete");
    expect(content).toContain("scorePronunciation");
    expect(content).toContain("completeRound");
  });

  it("pronunciation-duel-results.tsx exists with share and rematch", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/linguavibe/app/pronunciation-duel-results.tsx", "utf-8");
    expect(content).toContain("Share");
    expect(content).toContain("Rematch");
    expect(content).toContain("getDuelHistory");
    expect(content).toContain("getDuelStats");
    expect(content).toContain("Victory");
    expect(content).toContain("Defeated");
  });
});
