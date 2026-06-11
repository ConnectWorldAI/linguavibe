import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Sprint 26 — Grammar Mistake Journal, SRS for Grammar, Streak Leaderboard", () => {
  describe("Grammar Mistakes Library", () => {
    const libPath = path.resolve(__dirname, "../lib/grammar-mistakes.ts");
    let content: string;

    beforeEach(() => {
      content = fs.readFileSync(libPath, "utf-8");
    });

    it("exports logGrammarMistake function", () => {
      expect(content).toContain("export async function logGrammarMistake");
    });

    it("exports getMistakes function", () => {
      expect(content).toContain("export async function getMistakes");
    });

    it("exports getMistakePatterns function", () => {
      expect(content).toContain("export async function getMistakePatterns");
    });

    it("defines GrammarMistake interface with required fields", () => {
      expect(content).toContain("export interface GrammarMistake");
      expect(content).toContain("source: \"quiz\" | \"conversation\" | \"exercise\" | \"drill\"");
      expect(content).toContain("category: string");
      expect(content).toContain("userAnswer: string");
      expect(content).toContain("correctAnswer: string");
      expect(content).toContain("rule: string");
      expect(content).toContain("grammarTopic: string");
    });

    it("defines MistakePattern interface with count and percentage", () => {
      expect(content).toContain("export interface MistakePattern");
      expect(content).toContain("count: number");
      expect(content).toContain("percentage: number");
    });

    it("limits stored mistakes to 500", () => {
      expect(content).toContain("500");
    });

    it("groups mistakes by category for pattern analysis", () => {
      expect(content).toContain("categoryMap");
    });
  });

  describe("Grammar SRS (Spaced Repetition for Grammar Rules)", () => {
    const libPath = path.resolve(__dirname, "../lib/grammar-mistakes.ts");
    let content: string;

    beforeEach(() => {
      content = fs.readFileSync(libPath, "utf-8");
    });

    it("exports GrammarSRSCard interface with SM-2 fields", () => {
      expect(content).toContain("export interface GrammarSRSCard");
      expect(content).toContain("interval: number");
      expect(content).toContain("repetitions: number");
      expect(content).toContain("easeFactor: number");
      expect(content).toContain("nextReviewDate: number");
    });

    it("exports getGrammarSRSQueue function", () => {
      expect(content).toContain("export async function getGrammarSRSQueue");
    });

    it("exports getDueGrammarCards function", () => {
      expect(content).toContain("export async function getDueGrammarCards");
    });

    it("exports reviewGrammarCard function with quality parameter", () => {
      expect(content).toContain("export async function reviewGrammarCard(cardId: string, quality: number)");
    });

    it("implements SM-2 algorithm for interval calculation", () => {
      // SM-2 uses ease factor multiplication for intervals
      expect(content).toContain("card.interval * card.easeFactor");
      // Minimum ease factor of 1.3
      expect(content).toContain("1.3");
    });

    it("resets card on wrong answer (quality < 3)", () => {
      expect(content).toContain("quality >= 3");
      expect(content).toContain("card.repetitions = 0");
      expect(content).toContain("card.interval = 1");
    });

    it("automatically adds mistakes to SRS queue", () => {
      expect(content).toContain("addToGrammarSRS");
    });

    it("avoids duplicate SRS cards for same question", () => {
      expect(content).toContain("c.question === mistake.question && c.correctAnswer === mistake.correctAnswer");
    });

    it("exports getGrammarSRSStats for dashboard metrics", () => {
      expect(content).toContain("export async function getGrammarSRSStats");
      expect(content).toContain("totalCards");
      expect(content).toContain("dueToday");
      expect(content).toContain("mastered");
      expect(content).toContain("struggling");
    });
  });

  describe("Grammar Quiz Integration with Mistake Journal", () => {
    const quizPath = path.resolve(__dirname, "../app/grammar-quiz.tsx");
    let content: string;

    beforeEach(() => {
      content = fs.readFileSync(quizPath, "utf-8");
    });

    it("imports logGrammarMistake from grammar-mistakes library", () => {
      expect(content).toContain("import { logGrammarMistake } from \"@/lib/grammar-mistakes\"");
    });

    it("logs mistakes when user answers incorrectly", () => {
      expect(content).toContain("logGrammarMistake({");
      expect(content).toContain("source: \"quiz\"");
    });

    it("categorizes conjugation mistakes separately", () => {
      expect(content).toContain("verb_conjugation");
      expect(content).toContain("grammar_rule");
    });
  });

  describe("Grammar Mistake Journal Screen", () => {
    const screenPath = path.resolve(__dirname, "../app/grammar-mistake-journal.tsx");
    let content: string;

    beforeEach(() => {
      content = fs.readFileSync(screenPath, "utf-8");
    });

    it("has patterns and history view modes", () => {
      expect(content).toContain("\"patterns\" | \"history\"");
    });

    it("renders pattern cards with category icons", () => {
      expect(content).toContain("getCategoryIcon");
      expect(content).toContain("verb_conjugation");
      expect(content).toContain("pronoun_usage");
      expect(content).toContain("word_order");
    });

    it("shows progress bars for mistake frequency", () => {
      expect(content).toContain("progressBarFill");
      expect(content).toContain("percentage");
    });

    it("displays recent example with wrong and correct answers", () => {
      expect(content).toContain("wrongAnswer");
      expect(content).toContain("correctAnswer");
    });

    it("supports category filtering in history view", () => {
      expect(content).toContain("selectedCategory");
      expect(content).toContain("filterChip");
    });

    it("shows grammar rule for each mistake", () => {
      expect(content).toContain("ruleBox");
      expect(content).toContain("item.rule");
    });

    it("has empty state when no mistakes logged", () => {
      expect(content).toContain("No Mistakes Yet");
    });
  });

  describe("Grammar Streak Leaderboard Screen", () => {
    const screenPath = path.resolve(__dirname, "../app/grammar-streak-leaderboard.tsx");
    let content: string;

    beforeEach(() => {
      content = fs.readFileSync(screenPath, "utf-8");
    });

    it("imports getStreakData for user streak", () => {
      expect(content).toContain("getStreakData");
    });

    it("generates leaderboard with friends/study group members", () => {
      expect(content).toContain("generateLeaderboard");
      expect(content).toContain("Maria G.");
      expect(content).toContain("Carlos R.");
    });

    it("shows rank badges for top 3 (gold, silver, bronze)", () => {
      expect(content).toContain("🥇");
      expect(content).toContain("🥈");
      expect(content).toContain("🥉");
    });

    it("highlights current user in the list", () => {
      expect(content).toContain("isCurrentUser");
      expect(content).toContain("entryRowCurrent");
    });

    it("shows motivational message based on rank", () => {
      expect(content).toContain("motivationBanner");
      expect(content).toContain("take the lead");
    });

    it("caches leaderboard data per day", () => {
      expect(content).toContain("LEADERBOARD_KEY");
      expect(content).toContain("toDateString");
    });

    it("shows user summary card with streak and rank", () => {
      expect(content).toContain("summaryCard");
      expect(content).toContain("Day Streak");
      expect(content).toContain("Rank #");
    });
  });

  describe("Navigation Wiring", () => {
    const layoutPath = path.resolve(__dirname, "../app/_layout.tsx");
    let layoutContent: string;

    beforeEach(() => {
      layoutContent = fs.readFileSync(layoutPath, "utf-8");
    });

    it("registers grammar-mistake-journal screen in layout", () => {
      expect(layoutContent).toContain("grammar-mistake-journal");
    });

    it("registers grammar-streak-leaderboard screen in layout", () => {
      expect(layoutContent).toContain("grammar-streak-leaderboard");
    });
  });

  describe("Grammar Notebook Integration", () => {
    const notebookPath = path.resolve(__dirname, "../app/grammar-notebook.tsx");
    let content: string;

    beforeEach(() => {
      content = fs.readFileSync(notebookPath, "utf-8");
    });

    it("has navigation button to mistake journal", () => {
      expect(content).toContain("grammar-mistake-journal");
    });

    it("has navigation button to streak leaderboard", () => {
      expect(content).toContain("grammar-streak-leaderboard");
    });
  });
});
